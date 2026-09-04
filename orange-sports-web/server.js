const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.ORANGE_SPORTS_PORT || 4173);
const PUBLIC_DIR = path.join(__dirname, 'public');
const CACHE = new Map();
const TRANSLATION_CACHE_FILE = path.join(__dirname, '.cache', 'translations.json');
let TRANSLATION_CACHE = {};
try { TRANSLATION_CACHE = JSON.parse(fs.readFileSync(TRANSLATION_CACHE_FILE, 'utf8')); } catch {}
let translationSaveTimer;
const SPORTS = {
  kbo: { type:'news', label:'국내야구', query:'KBO OR 프로야구 OR 한국야구', naverQueries:['KBO 프로야구','국내 프로야구'], relevance:['KBO','프로야구','한국야구','한화 이글스','LG 트윈스','두산 베어스','롯데 자이언츠','삼성 라이온즈','KIA 타이거즈','SSG 랜더스','키움 히어로즈','NC 다이노스','KT 위즈'] },
  mlb: { type:'mlb', label:'해외야구', query:'MLB OR 메이저리그 OR 오타니 OR 이정후 OR 김하성', naverQueries:['MLB','메이저리그'], officialDomain:'mlb.com' },
  kfootball: { type:'news', label:'국내축구', query:'K리그 OR 국내축구 OR 한국 축구 국가대표', naverQueries:['K리그 국내축구','한국 축구 국가대표'], relevance:['K리그','국내축구','축구대표팀','국가대표','울산 HD','전북 현대','FC서울','수원 삼성','포항 스틸러스','대전하나','광주FC','대구FC','강원FC','김천 상무'] },
  football: { type:'multi-espn', paths:['soccer/eng.1','soccer/uefa.champions'], newsPaths:['soccer/eng.1','soccer/uefa.champions','soccer/esp.1','soccer/ger.1','soccer/ita.1'], label:'해외축구', query:'해외축구 OR 유럽축구 OR EPL OR 챔피언스리그', naverQueries:['해외축구 유럽축구','EPL 챔피언스리그'], relevance:['해외축구','유럽축구','EPL','프리미어리그','챔피언스리그','UCL','라리가','분데스리가','세리에A','토트넘','맨유','맨시티','아스널','리버풀','첼시','레알 마드리드','바르셀로나','바이에른 뮌헨','파리 생제르맹','PSG'] },
  kbl: { type:'news', label:'국내농구', query:'KBL OR WKBL OR 국내 프로농구', naverQueries:['KBL 프로농구','WKBL 여자농구'], relevance:['KBL','WKBL','프로농구','여자농구','서울 SK','창원 LG','원주 DB','수원 KT','부산 KCC','울산 현대모비스','대구 한국가스공사','고양 소노','안양 정관장'] },
  nba: { type:'espn', path:'basketball/nba', label:'해외농구', query:'NBA OR 미국프로농구 OR LA 레이커스 OR 골든스테이트', naverQueries:['NBA 농구','미국프로농구 NBA'], relevance:['NBA','미국프로농구','레이커스','클리퍼스','셀틱스','워리어스','캐벌리어스','닉스','너기츠','매버릭스','선더','스퍼스','피스톤스','로키츠','벅스','팀버울브스','랩터스','세븐티식서스','펠리컨스','트레일블레이저스','그리즐리스','새크라멘토','피닉스 선즈','올랜도 매직','인디애나 페이서스','브루클린 네츠','샬럿 호네츠'] },
  f1: { type:'f1', path:'racing/f1', label:'F1', query:'F1 OR 포뮬러1 OR 포뮬러 원 OR 그랑프리', naverQueries:['F1 포뮬러1','포뮬러 원 그랑프리'], relevance:['F1','포뮬러1','포뮬러 원','그랑프리','Formula 1','Grand Prix','베르스타펜','노리스','해밀턴','페라리','맥라렌'], exclude:['캠페인','파일럿 워치','시계','레노버','씽크스테이션','커뮤니티 어워드','K리그','자작자동차대회','자작자동차 대회','포뮬러 부문'] }
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

function parseNaverNews(html, sport, sourceKey = '') {
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
      id:`${sport}-naver-${sourceKey}-${index}`,
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

function parseNewsRss(xml, sport, sourceKey = '') {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 24).map((match, index) => {
    const block = match[1];
    const rawTitle = tagValue(block, 'title');
    const source = tagValue(block, 'source') || tagValue(block, 'dc:creator') || rawTitle.split(' - ').at(-1) || '국내 스포츠 뉴스';
    const suffix = ` - ${source}`;
    const image = block.match(/<image\s+href="([^"]+)"/i)?.[1] || block.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] || '';
    return { id:`${sport}-domestic-${sourceKey}-${index}`, title:rawTitle.endsWith(suffix) ? rawTitle.slice(0, -suffix.length) : rawTitle, link:tagValue(block, 'link'), published:tagValue(block, 'pubDate'), author:source, summary:'', image, kind:'domestic' };
  }).filter(article => article.title && article.link);
}

function normalizeOfficialNews(data, sport) {
  return (data.articles || data.headlines || []).slice(0, 20).map((article, index) => ({ id:`${sport}-official-${article.id || index}`, title:article.headline || article.title || '', link:article.links?.web?.href || article.link || '', published:article.published || article.lastModified || '', author:article.source || 'ESPN', summary:article.description || '', image:article.images?.[0]?.url || article.image?.url || '', kind:'official', badge:'해외' })).filter(article => article.title && article.link);
}

function articleKey(article) { return article.title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '').slice(0, 55); }
function uniqueArticles(items) { const seen=new Set(); return items.filter(article=>{const key=articleKey(article);if(!key||seen.has(key))return false;seen.add(key);return true;}); }
function isRelevant(article, sport) { const config=SPORTS[sport], terms=config.relevance; if(!terms)return true; const title=article.title.toLowerCase(); return terms.some(term=>title.includes(term.toLowerCase()))&&!(config.exclude||[]).some(term=>title.includes(term.toLowerCase())); }
function needsTranslation(value='') { return !/[가-힣]/.test(value)&&/[a-z]{3}/i.test(value); }
function saveTranslationCache() {
  clearTimeout(translationSaveTimer);
  translationSaveTimer=setTimeout(()=>{
    try {
      fs.mkdirSync(path.dirname(TRANSLATION_CACHE_FILE),{recursive:true});
      fs.writeFileSync(TRANSLATION_CACHE_FILE,JSON.stringify(TRANSLATION_CACHE,null,2));
    } catch {}
  },250);
}
async function translateText(value='') {
  if(!needsTranslation(value))return value;
  if(TRANSLATION_CACHE[value])return TRANSLATION_CACHE[value];
  const url=`https://api.mymemory.translated.net/get?q=${encodeURIComponent(value.slice(0,450))}&langpair=en%7Cko`;
  try {
    const data=await cachedFetch(url,24*60*60_000), translated=decodeXml(data?.responseData?.translatedText||'');
    if(/[가-힣]/.test(translated)){TRANSLATION_CACHE[value]=translated;saveTranslationCache();return translated;}
    return value;
  }
  catch { return value; }
}
async function translateParagraph(value='') {
  if(value.length<=400)return translateText(value);
  const sentences=value.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[value], chunks=[];
  for(const sentence of sentences){const last=chunks.at(-1)||'';if(last&&(last+sentence).length<=400)chunks[chunks.length-1]=last+sentence;else chunks.push(sentence.trim());}
  return (await Promise.all(chunks.map(chunk=>translateText(chunk)))).join(' ');
}
async function translateArticles(items) {
  return Promise.all(items.map(async article=>{
    if(!needsTranslation(article.title))return article;
    const title=await translateText(article.title), translated=title!==article.title;
    if(!translated)return article;
    return {...article,originalTitle:article.title,originalSummary:article.summary,title,badge:'해외·번역'};
  }));
}

function extractEspnParagraphs(html='') {
  return [...html.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)]
    .map(match=>stripTags(match[1]))
    .filter(text=>text.length>45&&!text.startsWith('- '))
    .slice(0,6);
}
async function getArticleDetail(sport,id) {
  const news=await getNews(sport), article=news.articles.find(item=>String(item.id)===String(id));
  if(!article)return null;
  let host=''; try{host=new URL(article.link).hostname;}catch{}
  if(!host.endsWith('espn.com'))return {id:article.id,summary:article.summary||''};
  try {
    const html=await cachedFetch(article.link,30*60_000,'text'), paragraphs=extractEspnParagraphs(html);
    const translated=await Promise.all(paragraphs.map(paragraph=>translateParagraph(paragraph)));
    const useful=translated.filter((text,index)=>text&&text!==paragraphs[index]&&/[가-힣]/.test(text));
    if(useful.length>=Math.min(2,paragraphs.length))return {id:article.id,summary:translated.join('\n\n'),translated:true,paragraphCount:translated.length};
    return {id:article.id,summary:paragraphs.join('\n\n')||article.summary||'',translated:false,paragraphCount:paragraphs.length};
  } catch { return {id:article.id,summary:article.summary||''}; }
}

async function getNews(sport) {
  const config = SPORTS[sport];
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`${config.query} when:14d`)}&hl=ko&gl=KR&ceid=KR:ko`;
  const naverPromise = Promise.all(config.naverQueries.map((query,index)=>{
    const url=`https://search.naver.com/search.naver?where=news&sort=1&query=${encodeURIComponent(query)}`;
    return cachedFetch(url,10*60_000,'text').then(html=>parseNaverNews(html,sport,index)).catch(()=>[]);
  })).then(groups=>groups.flat());
  const googlePromise=cachedFetch(rssUrl,10*60_000,'text').then(xml=>parseNewsRss(xml,sport,'google')).catch(()=>[]);
  const domesticPromise=Promise.all([naverPromise,googlePromise]).then(([naver,google])=>uniqueArticles([...naver,...google]).filter(article=>isRelevant(article,sport)).slice(0,24));
  const officialPromise = sport==='mlb'
    ? cachedFetch('https://www.mlb.com/feeds/news/rss.xml',10*60_000,'text').then(xml=>parseNewsRss(xml,sport,'official').map(article=>({...article,kind:'official',badge:'MLB 공식'}))).catch(()=>[])
    : (config.newsPaths||config.path?[...(config.newsPaths||[config.path])]:[]).length
      ? Promise.all((config.newsPaths||[config.path]).map(path=>cachedFetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/news?limit=20`,10*60_000).then(data=>normalizeOfficialNews(data,sport)).catch(()=>[]))).then(groups=>uniqueArticles(groups.flat()))
      : Promise.resolve([]);
  const [domestic, official] = await Promise.all([domesticPromise, officialPromise]);
  const translatedOfficial=await translateArticles(official.slice(0,10));
  const articles = uniqueArticles([...domestic.slice(0,18),...translatedOfficial])
    .sort((a,b)=>Number(Boolean(b.image))-Number(Boolean(a.image)));
  return { articles, domesticCount:domestic.length, officialCount:official.length };
}

async function getSchedule(sport, date) {
  const config = SPORTS[sport];
  if(config.type==='news')return { events:[] };
  if (config.type === 'mlb') return cachedFetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${encodeURIComponent(date)}&hydrate=team,linescore`, 20_000);
  if (config.type === 'espn') return cachedFetch(`https://site.api.espn.com/apis/site/v2/sports/${config.path}/scoreboard?dates=${date.replaceAll('-', '')}&limit=100`, 20_000);
  if(config.type==='multi-espn'){const groups=await Promise.all(config.paths.map(path=>cachedFetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard?dates=${date.replaceAll('-', '')}&limit=100`,20_000).catch(()=>({events:[]}))));return {events:groups.flatMap(group=>group.events||[])};}
  const year = date.slice(0, 4);
  const [meetings, sessions] = await Promise.all([cachedFetch(`https://api.openf1.org/v1/meetings?year=${year}`, 10 * 60_000), cachedFetch(`https://api.openf1.org/v1/sessions?year=${year}`, 10 * 60_000)]);
  return { meetings, sessions };
}

async function getStandings(sport, season) {
  const config = SPORTS[sport];
  if(config.type==='news'||config.type==='multi-espn')return { children:[] };
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
  const match = url.pathname.match(new RegExp(`^/api/sports/(${Object.keys(SPORTS).join('|')})/(schedule|standings|news|article)$`));
  if (!match) return null;
  const [, sport, resource] = match;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('date') || '') ? url.searchParams.get('date') : new Date().toISOString().slice(0, 10);
  const season = /^\d{4}$/.test(url.searchParams.get('season') || '') ? url.searchParams.get('season') : date.slice(0, 4);
  if (resource === 'schedule') return getSchedule(sport, date);
  if (resource === 'standings') return getStandings(sport, season);
  if(resource==='article')return getArticleDetail(sport,url.searchParams.get('id')||'');
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
