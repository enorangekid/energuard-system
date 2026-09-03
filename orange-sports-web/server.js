const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.ORANGE_SPORTS_PORT || 4173);
const PUBLIC_DIR = path.join(__dirname, 'public');
const CACHE = new Map();
const SPORTS = {
  mlb: { type: 'mlb', label: 'MLB', query: 'MLB OR 메이저리그 OR 오타니 OR 이정후 OR 김하성', naverQuery:'MLB', officialDomain:'mlb.com' },
  nba: { type: 'espn', path: 'basketball/nba', label: 'NBA', query: 'NBA OR 미국프로농구', naverQuery:'NBA 농구', officialDomain:'nba.com' },
  epl: { type: 'espn', path: 'soccer/eng.1', label: 'EPL', query: '프리미어리그 OR EPL OR 손흥민', naverQuery:'EPL 프리미어리그', officialDomain:'premierleague.com' },
  ucl: { type: 'espn', path: 'soccer/uefa.champions', label: 'UCL', query: '챔피언스리그 OR UCL', naverQuery:'UCL 챔피언스리그', officialDomain:'uefa.com' },
  f1: { type: 'f1', label: 'F1', query: '포뮬러1 OR F1 그랑프리', naverQuery:'F1 포뮬러1', officialDomain:'formula1.com' }
};
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon' };

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type':type, 'Cache-Control':status === 200 ? 'no-cache' : 'no-store', 'X-Content-Type-Options':'nosniff' });
  res.end(body);
}

async function cachedFetch(url, ttl, type = 'json') {
  const cached = CACHE.get(url);
  if (cached && Date.now() - cached.savedAt < ttl) return cached.value;
  const response = await fetch(url, { headers:{ Accept:type === 'json' ? 'application/json' : 'application/rss+xml, application/xml, text/xml', 'User-Agent':'Mozilla/5.0 Orange-Sports-Web/0.2' } });
  if (!response.ok) throw new Error(`데이터 제공처 응답 오류 (${response.status})`);
  const value = type === 'json' ? await response.json() : await response.text();
  CACHE.set(url, { savedAt:Date.now(), value });
  return value;
}

function decodeXml(value = '') {
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim();
}
function tagValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}
function stripTags(value = '') { return decodeXml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')); }

function originalNewsImage(value = '') {
  const decoded = decodeXml(value);
  try {
    const url = new URL(decoded);
    if (url.hostname === 'search.pstatic.net') return url.searchParams.get('src') || decoded;
  } catch { return decoded; }
  return decoded;
}

function parseNaverNews(html, sport) {
  const matches = [...html.matchAll(/<a[^>]+href="([^"]+)"[^>]+data-heatmap-target="\.tit"[^>]*>\s*<span[^>]*sds-comps-text-type-headline1[^>]*>([\s\S]*?)<\/span>/gi)];
  return matches.slice(0, 20).map((match, index) => {
    const start = match.index;
    const end = matches[index + 1]?.index || Math.min(html.length, start + 7000);
    const after = html.slice(start, Math.min(end, start + 5000));
    const before = html.slice(Math.max(0, start - 2800), start);
    const imageMatch = after.match(/data-heatmap-target="\.img"[\s\S]{0,1400}?<img[^>]+src="([^"]+)"/i);
    const summaryMatch = after.match(/data-heatmap-target="\.body"[\s\S]{0,500}?<span[^>]*sds-comps-text-type-body1[^>]*>([\s\S]*?)<\/span>/i);
    const sourceMatches = [...before.matchAll(/sds-comps-profile-info-title-text[\s\S]{0,500}?<span[^>]*>([^<]+)<\/span>/gi)];
    const timeMatches = [...before.matchAll(/(\d+\s*(?:분|시간|일)\s*전)/g)];
    let author = stripTags(sourceMatches.at(-1)?.[1] || '');
    try { if (!author) author = new URL(decodeXml(match[1])).hostname.replace(/^www\./, ''); } catch { author = '국내 스포츠 뉴스'; }
    return {
      id:`${sport}-naver-${index}`,
      title:stripTags(match[2]),
      link:decodeXml(match[1]),
      publishedLabel:timeMatches.at(-1)?.[1] || '최신',
      published:new Date().toISOString(),
      author,
      summary:stripTags(summaryMatch?.[1] || '').slice(0, 190),
      image:originalNewsImage(imageMatch?.[1] || ''),
      kind:'domestic'
    };
  }).filter(article => article.title && article.link);
}

function parseNewsRss(xml, sport) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 24).map((match, index) => {
    const block = match[1];
    const rawTitle = tagValue(block, 'title');
    const source = tagValue(block, 'source') || tagValue(block, 'dc:creator') || rawTitle.split(' - ').at(-1) || '국내 스포츠 뉴스';
    const suffix = ` - ${source}`;
    const image = block.match(/<image\s+href="([^"]+)"/i)?.[1] || block.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] || '';
    return { id:`${sport}-domestic-${index}`, title:rawTitle.endsWith(suffix) ? rawTitle.slice(0, -suffix.length) : rawTitle, link:tagValue(block, 'link'), published:tagValue(block, 'pubDate'), author:source, summary:'', image, kind:'domestic' };
  }).filter(article => article.title && article.link);
}

function normalizeOfficialNews(data, sport) {
  return (data.articles || data.headlines || []).slice(0, 10).map((article, index) => ({ id:`${sport}-official-${article.id || index}`, title:article.headline || article.title || '', link:article.links?.web?.href || article.link || '', published:article.published || article.lastModified || '', author:article.source || SPORTS[sport].label, summary:article.description || '', image:article.images?.[0]?.url || article.image?.url || '', kind:'official' })).filter(article => article.title && article.link);
}

async function getNews(sport) {
  const config = SPORTS[sport];
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`${config.query} when:7d`)}&hl=ko&gl=KR&ceid=KR:ko`;
  const naverUrl = `https://search.naver.com/search.naver?where=news&sort=1&query=${encodeURIComponent(config.naverQuery)}`;
  const domesticPromise = cachedFetch(naverUrl, 10 * 60_000, 'text').then(html => parseNaverNews(html, sport)).then(items => items.length ? items : cachedFetch(rssUrl, 10 * 60_000, 'text').then(xml => parseNewsRss(xml, sport))).catch(() => cachedFetch(rssUrl, 10 * 60_000, 'text').then(xml => parseNewsRss(xml, sport)).catch(() => []));
  const officialRssUrl = sport === 'mlb' ? 'https://www.mlb.com/feeds/news/rss.xml' : `https://news.google.com/rss/search?q=${encodeURIComponent(`${config.label} site:${config.officialDomain} when:14d`)}&hl=ko&gl=KR&ceid=KR:ko`;
  const officialPromise = cachedFetch(officialRssUrl, 10 * 60_000, 'text').then(xml => parseNewsRss(xml, sport).map(article => ({ ...article, kind:'official' }))).catch(() => []);
  const [domestic, official] = await Promise.all([domesticPromise, officialPromise]);
  const seen = new Set();
  const articles = [...domestic.slice(0, 16), ...official.slice(0, 6)].filter(article => {
    const key = article.title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '').slice(0, 45);
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
  return { articles, domesticCount:domestic.length, officialCount:official.length };
}

async function getSchedule(sport, date) {
  const config = SPORTS[sport];
  if (config.type === 'mlb') return cachedFetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}&hydrate=team,linescore`, 20_000);
  if (config.type === 'espn') return cachedFetch(`https://site.api.espn.com/apis/site/v2/sports/${config.path}/scoreboard?dates=${date.replaceAll('-', '')}&limit=100`, 20_000);
  const year = date.slice(0, 4);
  const [meetings, sessions] = await Promise.all([cachedFetch(`https://api.openf1.org/v1/meetings?year=${year}`, 10 * 60_000), cachedFetch(`https://api.openf1.org/v1/sessions?year=${year}`, 10 * 60_000)]);
  return { meetings, sessions };
}

async function getStandings(sport, season) {
  const config = SPORTS[sport];
  if (config.type === 'mlb') return cachedFetch(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${season}&standingsTypes=regularSeason&hydrate=team`, 5 * 60_000);
  if (config.type === 'espn') return cachedFetch(`https://site.api.espn.com/apis/v2/sports/${config.path}/standings?season=${season}`, 5 * 60_000);
  const sessions = await cachedFetch(`https://api.openf1.org/v1/sessions?year=${season}&session_name=Race`, 10 * 60_000);
  const lastRace = sessions.filter(item => new Date(item.date_start) <= new Date()).sort((a,b) => new Date(b.date_start) - new Date(a.date_start))[0];
  if (!lastRace) return { drivers:[], teams:[] };
  const [drivers, teams] = await Promise.all([cachedFetch(`https://api.openf1.org/v1/championship_drivers?session_key=${lastRace.session_key}`, 5 * 60_000).catch(() => []), cachedFetch(`https://api.openf1.org/v1/championship_teams?session_key=${lastRace.session_key}`, 5 * 60_000).catch(() => [])]);
  return { drivers, teams, session:lastRace };
}

async function apiResponse(url) {
  if (url.pathname === '/api/health') return { ok:true, service:'orange-sports-web', sports:Object.keys(SPORTS) };
  const match = url.pathname.match(/^\/api\/sports\/(mlb|nba|epl|ucl|f1)\/(schedule|standings|news)$/);
  if (!match) return null;
  const [, sport, resource] = match;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('date') || '') ? url.searchParams.get('date') : new Date().toISOString().slice(0, 10);
  const season = /^\d{4}$/.test(url.searchParams.get('season') || '') ? url.searchParams.get('season') : date.slice(0, 4);
  if (resource === 'schedule') return getSchedule(sport, date);
  if (resource === 'standings') return getStandings(sport, season);
  return getNews(sport);
}

function staticFile(pathname) {
  const requested = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const resolved = path.resolve(PUBLIC_DIR, requested);
  if (resolved !== PUBLIC_DIR && !resolved.startsWith(PUBLIC_DIR + path.sep)) return null;
  return resolved;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      const data = await apiResponse(url);
      if (!data) return send(res, 404, JSON.stringify({ error:'API를 찾을 수 없습니다.' }));
      return send(res, 200, JSON.stringify(data));
    }
    const file = staticFile(url.pathname);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, '페이지를 찾을 수 없습니다.', 'text/plain; charset=utf-8');
    return send(res, 200, fs.readFileSync(file), MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  } catch (error) { return send(res, 500, JSON.stringify({ error:error.message || '서버 오류' })); }
});

server.listen(PORT, '127.0.0.1', () => console.log(`Orange Sports Web: http://127.0.0.1:${PORT}`));
