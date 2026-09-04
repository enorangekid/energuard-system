const http = require('http');
const fs = require('fs');
const path = require('path');

// .env 로더 (의존성 없이): KEY=value 줄을 process.env로. 이미 있는 값은 덮지 않는다.
try {
  for (const line of fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const PORT = Number(process.env.ORANGE_SPORTS_PORT || 4173);
const PUBLIC_DIR = path.join(__dirname, 'public');
const CACHE = new Map();
const TRANSLATION_CACHE_FILE = path.join(__dirname, '.cache', 'translations.json');
let TRANSLATION_CACHE = {};
try { TRANSLATION_CACHE = JSON.parse(fs.readFileSync(TRANSLATION_CACHE_FILE, 'utf8')); } catch {}
let translationSaveTimer;

// DeepL API Free 키(…:fx)면 자동으로 free 엔드포인트 사용. 키는 .env(DEEPL_API_KEY)에만 둔다.
const DEEPL_KEY = (process.env.DEEPL_API_KEY || process.env.DEEPL_AUTH_KEY || '').trim();
const DEEPL_ENDPOINT = (/:fx$/.test(DEEPL_KEY) || process.env.DEEPL_FREE === '1')
  ? 'https://api-free.deepl.com/v2/translate'
  : 'https://api.deepl.com/v2/translate';

// 선수·팀 이름은 기계번역에 맡기지 않고 사전으로 치환한다. names-ko.json에서 계속 보강.
let NAME_KO = {};
try { NAME_KO = JSON.parse(fs.readFileSync(path.join(__dirname, 'names-ko.json'), 'utf8')); } catch {}
const NAME_ENTRIES = Object.entries(NAME_KO).filter(([k, v]) => k && v && !k.startsWith('_') && typeof v === 'string').sort((a, b) => b[0].length - a[0].length);
const NAME_LC = new Map(NAME_ENTRIES.map(([k, v]) => [k.toLowerCase(), v]));
const NAME_RE = NAME_ENTRIES.length
  ? new RegExp('(?<![\\p{L}\\p{N}])(' + NAME_ENTRIES.map(([k]) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\p{L}\\p{N}])', 'giu')
  : null;
function applyNameDict(text = '') { return NAME_RE ? text.replace(NAME_RE, m => NAME_LC.get(m.toLowerCase()) || m) : text; }
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
  const response = await fetch(url, { signal:AbortSignal.timeout(9000), headers:{ Accept:type === 'json' ? 'application/json' : 'text/html,application/xhtml+xml,application/rss+xml,application/xml;q=0.9,*/*;q=0.8', 'User-Agent':'Mozilla/5.0 Orange-Sports-Web/0.2' } });
  if (!response.ok) throw new Error(`데이터 제공처 응답 오류 (${response.status})`);
  const value = type === 'json' ? await response.json() : await response.text();
  CACHE.set(url, { savedAt:Date.now(), value });
  return value;
}

function decodeXml(value = '') {
  return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&lsquo;|&rsquo;|&#8216;|&#8217;/g, "'").replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/g, '"')
    .replace(/&hellip;|&#8230;/g, '…').replace(/&middot;|&#183;/g, '·').replace(/&ndash;|&#8211;/g, '–').replace(/&mdash;|&#8212;/g, '—')
    .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(+n); } catch { return ''; } })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return ''; } })
    .trim();
}
function tagValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}
function stripTags(value = '') { return decodeXml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')); }

function newsThumbnail(value = '') {
  const decoded = decodeXml(value);
  try {
    const url = new URL(decoded);
    if (url.hostname === 'search.pstatic.net' && url.searchParams.has('src')) {
      const src = url.searchParams.get('src');
      // 네이버 검색 썸네일은 type=fface200_200(200px 얼굴 크롭)이라 큰 카드에서 심하게 뭉갠다.
      // src가 네이버 뉴스 이미지 CDN(imgnews.pstatic.net)이면 referrer 없이도 원본이 열리므로 원본을 쓴다.
      if (/^https?:\/\/[^/]*imgnews\.pstatic\.net\//i.test(src)) return src;
      // 그 외 도메인은 핫링크 차단 위험이 있어 프록시는 유지하되 저화질 크롭 지정만 제거한다.
      url.searchParams.delete('type');
      return url.toString();
    }
  } catch {}
  return decoded;
}

// 본문 사진이 없는 기사는 og:image가 언론사 로고·SNS 공유 기본이미지인 경우가 많다. 이런 URL은 버린다.
const LOGO_IMAGE_RE = /(^|[\/_-])(sns[_-]?)?logo|og[_-]?(image|img|default)|no[_-]?image|noimage|default[_-]?(image|img|thumb|photo)|blank|masthead|nameplate|placeholder|favicon|apple-touch|emblem|watermark|share[_-]?(image|img|thumb)/i;

// 구글 뉴스 RSS 등 이미지 필드가 없는 기사는 기사 페이지의 og:image를 읽어 썸네일을 채운다.
// 실패/타임아웃은 빈 값으로 캐시해 매 요청마다 다시 시도하지 않는다.
async function pageImage(link = '') {
  if (!/^https?:\/\//i.test(link)) return '';
  let host = '';
  try { host = new URL(link).hostname; } catch { return ''; }
  // 구글 뉴스 링크는 리다이렉트 인터스티셜이라 og:image가 기사와 무관한 구글 브랜딩 이미지뿐이다.
  if (/(^|\.)news\.google\.com$/i.test(host)) return '';
  const key = `ogimage:${link}`;
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.savedAt < 6 * 60 * 60_000) return cached.value;
  let image = '';
  try {
    const res = await fetch(link, { redirect:'follow', signal:AbortSignal.timeout(8000), headers:{ 'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Orange-Sports-Web/0.2', Accept:'text/html,application/xhtml+xml' } });
    if (res.ok) {
      const head = (await res.text()).slice(0, 200_000);
      const pick = re => decodeXml(head.match(re)?.[1] || '');
      const found = pick(/<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"']+)["']/i)
        || pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::url)?["']/i)
        || pick(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i);
      if (/^https?:\/\//i.test(found)) {
        let path = ''; try { path = new URL(found).pathname; } catch {}
        if (!LOGO_IMAGE_RE.test(path)) image = found;
      }
    }
  } catch {}
  CACHE.set(key, { savedAt:Date.now(), value:image });
  return image;
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
      image:newsThumbnail(imageMatch?.[1] || ''),
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
    const image = decodeXml(block.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1] || block.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] || block.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1] || block.match(/<image\s+href="([^"]+)"/i)?.[1] || '');
    return { id:`${sport}-domestic-${sourceKey}-${index}`, title:rawTitle.endsWith(suffix) ? rawTitle.slice(0, -suffix.length) : rawTitle, link:tagValue(block, 'link'), published:tagValue(block, 'pubDate'), author:source, summary:'', image, kind:'domestic' };
  }).filter(article => article.title && article.link);
}

function normalizeOfficialNews(data, sport) {
  return (data.articles || data.headlines || []).slice(0, 20).map((article, index) => ({ id:`${sport}-official-${article.id || index}`, title:article.headline || article.title || '', link:article.links?.web?.href || article.link || '', published:article.published || article.lastModified || '', author:article.source || 'ESPN', summary:article.description || '', image:article.images?.[0]?.url || article.image?.url || '', kind:'official', badge:'해외' })).filter(article => article.title && article.link);
}

// [속보][단독][포토] 같은 말머리를 떼고 앞부분만 비교해 언론사별 표기 차이로 인한 중복을 잡는다.
function articleKey(article) { return (article.title||'').toLowerCase().replace(/^(?:\s*\[[^\]]{1,14}\]\s*)+/, '').replace(/[^a-z0-9가-힣]/g, '').slice(0, 50); }

// 통신사(연합 등) 송고 기사를 여러 매체가 각자 다시 올리면 사진 URL도 제목도 조금씩 달라 exact 비교로는 못 잡는다.
// 제목을 내용 토큰 집합으로 바꿔, 겹치는 토큰이 충분하고(같은 사건) 노출 시각대까지 같으면 근접 중복으로 본다.
const DUP_STOP_TOKENS = new Set(['경기','시즌','리그','프로','올해','오늘','내일','만에','향해','결국','다시','대한','관련','이번','최근','그리고','밝혔다','전했다','했다','한다','대해','위해','까지','부터','에서','으로','상대','최다','최소','최초','기록','소식','현지','미국','한국','국내','해외','선수','감독','구단']);
// 한국어는 매체마다 조사·띄어쓰기가 달라(예: "대타로" vs "대타") 토큰이 어긋난다. 흔한 조사를 떼고 비교한다.
function stemToken(w='') { const s=w.replace(/(으로부터|으로|로서|로써|이라는|라는|이라고|라고|에게서|에서|에게|한테|이라|보다|처럼|까지|부터|만에|번째|이나|와의|과의|은|는|이|가|을|를|의|도|만|와|과|에|께|야|랑|로)$/,''); return s.length>=2?s:w; }
function contentTokens(title='') {
  return new Set((title||'').toLowerCase().replace(/[^a-z0-9가-힣\s]/g,' ').split(/\s+/).filter(w=>w.length>=2).map(stemToken).filter(w=>!DUP_STOP_TOKENS.has(w)));
}
function isNearDuplicate(a, b) {
  let shared=0;
  for(const t of a.tokens) if(b.tokens.has(t)) shared++;
  if(shared<4) return false;
  const ratio=shared/Math.min(a.tokens.size,b.tokens.size);
  const sameSlot=Boolean(a.slot) && a.slot===b.slot && /전$/.test(a.slot);   // "10분 전" 처럼 실제 상대시각이 일치
  return ratio>=0.5 || sameSlot;
}
function uniqueArticles(items) {
  const seen=new Set(), kept=[];
  return items.filter(article=>{
    const titleKey=articleKey(article);
    const imgKey=article.image?`img:${article.image}`:'';   // 같은 사진 파일 = 사실상 같은 기사
    if((titleKey&&seen.has(titleKey))||(imgKey&&seen.has(imgKey)))return false;
    const meta={tokens:contentTokens(article.title),slot:article.publishedLabel||''};
    if(kept.some(k=>isNearDuplicate(meta,k)))return false;
    if(titleKey)seen.add(titleKey);
    if(imgKey)seen.add(imgKey);
    kept.push(meta);
    return true;
  });
}
function isExcluded(article, sport) { const title=article.title.toLowerCase(); return (SPORTS[sport].exclude||[]).some(term=>title.includes(term.toLowerCase())); }
function isRelevant(article, sport) { const terms=SPORTS[sport].relevance; if(isExcluded(article,sport))return false; if(!terms)return true; const title=article.title.toLowerCase(); return terms.some(term=>title.includes(term.toLowerCase())); }
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
async function deeplTranslate(texts) {
  if (!DEEPL_KEY || !texts.length) return null;
  const body = new URLSearchParams();
  body.set('target_lang', 'KO');
  body.set('source_lang', 'EN');
  for (const t of texts) body.append('text', t);
  try {
    const res = await fetch(DEEPL_ENDPOINT, {
      method:'POST', signal:AbortSignal.timeout(9000),
      headers:{ 'Authorization':`DeepL-Auth-Key ${DEEPL_KEY}`, 'Content-Type':'application/x-www-form-urlencoded' },
      body:body.toString()
    });
    if (!res.ok) return null;
    const data = await res.json();
    const out = (data.translations || []).map(t => t.text || '');
    return out.length === texts.length ? out : null;
  } catch { return null; }
}
async function myMemoryTranslate(value='') {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(value.slice(0,450))}&langpair=en%7Cko`;
  try {
    const data = await cachedFetch(url, 24*60*60_000);
    const t = decodeXml(data?.responseData?.translatedText || '');
    return /[가-힣]/.test(t) ? t : '';
  } catch { return ''; }
}
// 캐시 → 이름 사전 선치환 → DeepL(한 번에 batch) → 실패분만 MyMemory → 그래도 실패면 원문.
async function translateBatch(values=[]) {
  const result = values.map(v => !needsTranslation(v) ? v : (TRANSLATION_CACHE[v] ?? null));
  const pending = [];
  values.forEach((v, i) => { if (result[i] === null) pending.push({ i, raw:v, prepped:applyNameDict(v) }); });
  if (!pending.length) return result;
  const dl = await deeplTranslate(pending.map(p => p.prepped));
  for (let k = 0; k < pending.length; k++) {
    const p = pending[k];
    let t = dl && dl[k];
    if (!t || !/[가-힣]/.test(t)) t = await myMemoryTranslate(p.prepped);
    if (t && /[가-힣]/.test(t)) { TRANSLATION_CACHE[p.raw] = t; result[p.i] = t; }
    else result[p.i] = p.raw;
  }
  saveTranslationCache();
  return result;
}
async function translateText(value='') { return (await translateBatch([value]))[0]; }
async function translateParagraph(value='') {
  if (value.length <= 900) return translateText(value);
  const sentences = value.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [value], chunks = [];
  for (const s of sentences) { const last = chunks.at(-1) || ''; if (last && (last + s).length <= 900) chunks[chunks.length-1] = last + s; else chunks.push(s.trim()); }
  return (await translateBatch(chunks)).join(' ');
}
async function translateArticles(items) {
  const n = items.length;
  const out = await translateBatch([...items.map(a => a.title || ''), ...items.map(a => a.summary || '')]);
  const titles = out.slice(0, n), summaries = out.slice(n);
  return items.map((article, i) => {
    const title = titles[i], summary = summaries[i];
    if (title === (article.title || '') && summary === (article.summary || '')) return article;
    return { ...article, originalTitle:article.title, originalSummary:article.summary, title, summary, badge:'해외·번역' };
  });
}

function extractEspnParagraphs(html='') {
  return [...html.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)]
    .map(match=>stripTags(match[1]))
    .filter(text=>text.length>45&&!text.startsWith('- '))
    .slice(0,6);
}

// 개인 사용용: 국내 기사 본문을 언론사 페이지에서 뽑아 온다. 사이트별 본문 컨테이너 id/class를 순서대로 시도한다.
const KO_BODY_KEYS = ['article-view-content-div','articleBodyContents','newsct_article','dic_area','articeBody','articleBody','article_body','articleCont','news_body_area','newsEndContents','article_content','article-content','articleContent','news_view','view_con','viewContent','art_text','news_text','textBody','CmAdContent','newsContent','article-body-content','art_content'];
function sliceBalancedTag(html, openIdx) {
  const re = /<(\/?)(?:div|article|section)\b[^>]*>/gi;
  re.lastIndex = openIdx; let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[1]) { depth--; if (depth <= 0) return html.slice(openIdx, m.index); }
    else depth++;
    if (re.lastIndex - openIdx > 200000) break;
  }
  return html.slice(openIdx, openIdx + 60000);
}
function findKoBodyRegion(html='') {
  for (const key of KO_BODY_KEYS) {
    const m = new RegExp(`<(?:div|article|section)[^>]*(?:id|class)=["'][^"']*\\b${key}\\b[^"']*["'][^>]*>`, 'i').exec(html);
    if (m) return sliceBalancedTag(html, m.index);
  }
  const ip = /<(?:div|section|article)[^>]*itemprop=["']articleBody["'][^>]*>/i.exec(html);
  if (ip) return sliceBalancedTag(html, ip.index);
  const art = /<article\b[^>]*>/i.exec(html);
  if (art) return sliceBalancedTag(html, art.index);
  return '';
}
const KO_JUNK_LINE = /무단[\s]*전재|재배포\s*금지|저작권자|ⓒ|Copyrights?|\bAll rights reserved|[\w.-]+@[\w.-]+\.[a-z]{2,}|▶|☞|◀|\[사진|무단\s*복제|기사제보|구독하기|앱에서\s*보기|네이버.*구독|카카오톡.*공유|페이스북.*공유/i;
function extractKoreanArticleBody(html='') {
  let region = findKoBodyRegion(html);
  if (!region) return '';
  region = region
    .replace(/<script[\s\S]*?<\/script>/gi,' ')
    .replace(/<style[\s\S]*?<\/style>/gi,' ')
    .replace(/<figcaption[\s\S]*?<\/figcaption>/gi,' ')
    .replace(/<figure[\s\S]*?<\/figure>/gi,' ')
    .replace(/<!--[\s\S]*?-->/g,' ');
  const blocks = region
    .split(/<\/p>|<br\s*\/?>|<\/div>|<\/li>|<\/h[1-6]>|<\/tr>/i)
    .map(b=>stripTags(b).replace(/\s+/g,' ').trim())
    .map(b=>b.replace(/^\[[^\]]{1,40}\]\s*/,'').replace(/^[가-힣]{2,4}\s*(?:기자|특파원|인턴기자|객원기자)\s*=\s*/,''))
    .filter(b=>b.length>=20 && !KO_JUNK_LINE.test(b));
  const out = [];
  for (const b of blocks) if (b !== out[out.length-1]) out.push(b);
  return out.join('\n\n').slice(0, 9000);
}
// 클라이언트가 이미 가진 기사 링크를 그대로 받는다. getNews를 다시 돌리지 않아 응답이 빠르다.
function safeArticleUrl(raw='') {
  let u; try { u = new URL(raw); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const h = u.hostname.toLowerCase();
  if (h==='localhost'||h==='0.0.0.0'||h==='::1'||/^127\./.test(h)||/^10\./.test(h)||/^192\.168\./.test(h)||/^169\.254\./.test(h)||/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return null;
  return u.toString();
}
async function getArticleDetail(link) {
  const safe = safeArticleUrl(link);
  if (!safe) return { summary:'' };
  const host = new URL(safe).hostname;
  // 구글 뉴스 리다이렉트 링크는 본문 페이지가 아니라 인터스티셜이라 추출 불가.
  if (/(^|\.)news\.google\.com$/i.test(host)) return { summary:'' };
  try {
    const html = await cachedFetch(safe, 30*60_000, 'text');
    if (host.endsWith('espn.com')) {
      const paragraphs = extractEspnParagraphs(html);
      const translated = await translateBatch(paragraphs);   // 문단 전체를 한 번의 DeepL 호출로
      const useful = translated.filter((text,index)=>text&&text!==paragraphs[index]&&/[가-힣]/.test(text));
      if (useful.length>=Math.min(2,paragraphs.length)) return { summary:translated.join('\n\n'), translated:true, paragraphCount:translated.length };
      return { summary:paragraphs.join('\n\n')||'', translated:false, paragraphCount:paragraphs.length };
    }
    const body = extractKoreanArticleBody(html);
    if (body && body.length>=120) return { summary:body, fullText:true, paragraphCount:body.split('\n\n').length };
    return { summary:'' };
  } catch { return { summary:'' }; }
}

// getNews는 스크랩·중복제거·og:image 백필·번역 오케스트레이션이 무거워 60초간 결과(프라미스)를 메모한다.
// 개별 fetch는 cachedFetch가 이미 캐시하지만, 이 래퍼가 있어야 재방문 시 조합 비용까지 건너뛴다.
const NEWS_MEMO = new Map();
function getNews(sport) {
  const hit = NEWS_MEMO.get(sport);
  if (hit && Date.now() - hit.at < 60_000) return hit.promise;
  const promise = buildNews(sport).catch(err => { NEWS_MEMO.delete(sport); throw err; });
  NEWS_MEMO.set(sport, { at:Date.now(), promise });
  return promise;
}
async function buildNews(sport) {
  const config = SPORTS[sport];
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`${config.query} when:14d`)}&hl=ko&gl=KR&ceid=KR:ko`;
  const naverPromise = Promise.all(config.naverQueries.map((query,index)=>{
    const url=`https://search.naver.com/search.naver?where=news&sort=1&query=${encodeURIComponent(query)}`;
    return cachedFetch(url,10*60_000,'text').then(html=>parseNaverNews(html,sport,index)).catch(()=>[]);
  })).then(groups=>groups.flat());
  const googlePromise=cachedFetch(rssUrl,10*60_000,'text').then(xml=>parseNewsRss(xml,sport,'google')).catch(()=>[]);
  // 네이버는 종목 전용 검색어(naverQueries)로 이미 좁혀져 있으니 제외어만 걸러 신뢰하고,
  // 구글은 넓은 OR 검색이라 relevance 키워드 게이트를 그대로 적용한다. (구글 RSS엔 썸네일이 없어 과도한 필터가 이미지 없는 카드만 남기는 문제 완화)
  const domesticPromise=Promise.all([naverPromise,googlePromise]).then(([naver,google])=>{
    const trustedNaver=naver.filter(article=>!isExcluded(article,sport));
    const filteredGoogle=google.filter(article=>isRelevant(article,sport));
    return uniqueArticles([...trustedNaver,...filteredGoogle]).slice(0,24);
  });
  const officialPromise = sport==='mlb'
    ? cachedFetch('https://www.mlb.com/feeds/news/rss.xml',10*60_000,'text').then(xml=>parseNewsRss(xml,sport,'official').map(article=>({...article,kind:'official',badge:'MLB 공식'}))).catch(()=>[])
    : (config.newsPaths||config.path?[...(config.newsPaths||[config.path])]:[]).length
      ? Promise.all((config.newsPaths||[config.path]).map(path=>cachedFetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/news?limit=20`,10*60_000).then(data=>normalizeOfficialNews(data,sport)).catch(()=>[]))).then(groups=>uniqueArticles(groups.flat()))
      : Promise.resolve([]);
  const [domestic, official] = await Promise.all([domesticPromise, officialPromise]);
  const domesticTop = domestic.slice(0,18);
  await Promise.allSettled(domesticTop.map(async article => {
    if (article.image) return;
    const image = await pageImage(article.link);
    if (image) article.image = image;
  }));
  const translatedOfficial=await translateArticles(official.slice(0,10));
  const articles = uniqueArticles([...domesticTop,...translatedOfficial])
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
  if(config.type==='news')return { children:[] };
  if(sport==='football')return cachedFetch(`https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings?season=${season}`, 5 * 60_000);
  if(config.type==='multi-espn')return { children:[] };
  if (config.type === 'mlb') return cachedFetch(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${season}&standingsTypes=regularSeason&hydrate=team`, 5 * 60_000);
  if (config.type === 'espn') return cachedFetch(`https://site.api.espn.com/apis/v2/sports/${config.path}/standings?season=${season}`, 5 * 60_000);
  const sessions = await cachedFetch(`https://api.openf1.org/v1/sessions?year=${season}&session_name=Race`, 10 * 60_000);
  const lastRace = sessions.filter(item => new Date(item.date_start) <= new Date()).sort((a,b) => new Date(b.date_start) - new Date(a.date_start))[0];
  if (!lastRace) return { drivers:[], teams:[] };
  const [drivers, teams, roster] = await Promise.all([
    cachedFetch(`https://api.openf1.org/v1/championship_drivers?session_key=${lastRace.session_key}`, 5 * 60_000).catch(() => []),
    cachedFetch(`https://api.openf1.org/v1/championship_teams?session_key=${lastRace.session_key}`, 5 * 60_000).catch(() => []),
    cachedFetch(`https://api.openf1.org/v1/drivers?session_key=${lastRace.session_key}`, 5 * 60_000).catch(() => [])
  ]);
  // championship_drivers엔 이름이 없어 drivers 응답과 driver_number로 조인한다.
  const byNum = new Map((roster || []).map(d => [d.driver_number, d]));
  const namedDrivers = (drivers || []).map(d => {
    const info = byNum.get(d.driver_number) || {};
    return { ...d, full_name:applyNameDict(info.full_name || ''), broadcast_name:info.broadcast_name, name_acronym:info.name_acronym, headshot_url:info.headshot_url, team_name:applyNameDict(d.team_name || info.team_name || '') };
  });
  const namedTeams = (teams || []).map(t => ({ ...t, team_name:applyNameDict(t.team_name || '') }));
  return { drivers:namedDrivers, teams:namedTeams, session:lastRace };
}

function mlbHeadshot(id) { return id ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_120,q_auto:best/v1/people/${id}/headshot/67/current` : ''; }
// 스탯 표의 선수·팀 이름을 사전 → (미매칭 시) DeepL 로 한국어화한다.
async function localizeLeaderGroups(groups) {
  const strings = new Set();
  for (const g of groups) for (const r of g.rows) { if (r.name) strings.add(r.name); if (r.team) strings.add(r.team); }
  const list = [...strings];
  const dict = list.map(s => applyNameDict(s));
  const needIdx = []; const needStr = [];
  list.forEach((s, i) => { if (dict[i] === s && needsTranslation(s)) { needIdx.push(i); needStr.push(s); } });
  const mt = needStr.length ? await translateBatch(needStr) : [];
  const ko = new Map();
  list.forEach((s, i) => { let v = dict[i]; const k = needIdx.indexOf(i); if (k >= 0 && mt[k]) v = mt[k]; ko.set(s, v); });
  for (const g of groups) for (const r of g.rows) { r.name = ko.get(r.name) || r.name; r.team = ko.get(r.team) || r.team; }
  return groups;
}

// 선수 스탯 순위. sport별로 카테고리 목록을 {key,title,label,rows:[{rank,name,team,value}]} 형태로 정규화.
const LEADER_TTL = 30 * 60_000;
async function getLeaders(sport, season) {
  const y = /^\d{4}$/.test(String(season)) ? String(season) : String(new Date().getFullYear());
  const groups = await buildLeaderGroups(sport, y);
  return { groups: await localizeLeaderGroups(groups) };
}
async function buildLeaderGroups(sport, y) {
  if (sport === 'mlb') {
    const CATS = [
      { c:'battingAverage', g:'hitting', title:'타율', label:'AVG' },
      { c:'homeRuns', g:'hitting', title:'홈런', label:'HR' },
      { c:'runsBattedIn', g:'hitting', title:'타점', label:'RBI' },
      { c:'stolenBases', g:'hitting', title:'도루', label:'SB' },
      { c:'earnedRunAverage', g:'pitching', title:'평균자책', label:'ERA' },
      { c:'wins', g:'pitching', title:'다승', label:'W' },
      { c:'strikeouts', g:'pitching', title:'탈삼진', label:'SO' },
      { c:'saves', g:'pitching', title:'세이브', label:'SV' }
    ];
    const raw = await Promise.all(CATS.map(x =>
      cachedFetch(`https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${x.c}&statGroup=${x.g}&sportId=1&season=${y}&limit=12`, LEADER_TTL).catch(() => null)));
    return CATS.map((x, i) => {
      const cat = (raw[i]?.leagueLeaders || []).find(l => l.leaderCategory === x.c && (!l.statGroup || l.statGroup === x.g)) || (raw[i]?.leagueLeaders || [])[0];
      const rows = (cat?.leaders || []).slice(0, 12).map(l => ({
        rank: l.rank ?? null,
        name: l.person?.fullName || '-',
        team: l.team?.name || '', value: l.value ?? '',
        photo: mlbHeadshot(l.person?.id)
      }));
      return rows.length ? { key:x.c, title:`${x.title} 순위`, label:x.label, rows } : null;
    }).filter(Boolean);
  }
  if (sport === 'nba') {
    const CATS = [
      { key:'points', group:'offensive', stat:'avgPoints', title:'득점', label:'PPG' },
      { key:'rebounds', group:'general', stat:'avgRebounds', title:'리바운드', label:'RPG' },
      { key:'assists', group:'offensive', stat:'avgAssists', title:'어시스트', label:'APG' },
      { key:'steals', group:'defensive', stat:'avgSteals', title:'스틸', label:'SPG' },
      { key:'blocks', group:'defensive', stat:'avgBlocks', title:'블록', label:'BPG' }
    ];
    const raw = await Promise.all(CATS.map(x =>
      cachedFetch(`https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?region=us&lang=en&contentorigin=espn&isqualified=true&page=1&limit=12&sort=${encodeURIComponent(x.group + '.' + x.stat + ':desc')}&season=${y}&seasontype=2`, LEADER_TTL).catch(() => null)));
    return CATS.map((x, i) => {
      const data = raw[i]; if (!data) return null;
      const idx = data.categories?.find(c => c.name === x.group)?.names?.indexOf(x.stat) ?? -1;
      const rows = (data.athletes || []).slice(0, 12).map((row, r) => {
        const vg = row.categories?.find(c => c.name === x.group);
        const v = idx >= 0 ? (vg?.totals?.[idx] ?? vg?.values?.[idx] ?? '-') : '-';
        const a = row.athlete || {};
        return { rank:r + 1, name: a.displayName || '-', team: a.teamName || a.teamShortName || '', value: v,
          photo: a.headshot?.href || (a.id ? `https://a.espncdn.com/i/headshots/nba/players/full/${a.id}.png` : '') };
      });
      return rows.length ? { key:x.key, title:`${x.title} 순위`, label:x.label, rows } : null;
    }).filter(Boolean);
  }
  if (sport === 'football') {
    const data = await cachedFetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/statistics?season=${y}`, LEADER_TTL).catch(() => null);
    const WANT = { goalsLeaders:{ title:'득점', label:'G' }, assistsLeaders:{ title:'도움', label:'A' } };
    return (data?.stats || []).filter(c => WANT[c.name]).map(c => ({
      key:c.name, title:`${WANT[c.name].title} 순위`, label:WANT[c.name].label,
      rows: (c.leaders || []).slice(0, 12).map((l, i) => ({
        rank:i + 1, name: l.athlete?.displayName || l.athlete?.shortName || '-',
        team: l.athlete?.team?.displayName || l.athlete?.team?.shortDisplayName || '', value: l.value ?? l.displayValue ?? '',
        photo: ''   // ESPN 축구 API는 선수 헤드샷을 제공하지 않아 이니셜 원으로 대체
      }))
    })).filter(g => g.rows.length);
  }
  if (sport === 'f1') {
    const st = await getStandings('f1', y);
    const mk = (list, isDriver) => (list || []).slice(0, 12).map(d => ({
      rank: d.position_current ?? null,
      name: isDriver ? (d.full_name || d.broadcast_name || `#${d.driver_number}`) : (d.team_name || '-'),
      team: isDriver ? (d.team_name || '') : '',
      value: d.points_current ?? 0,
      photo: isDriver ? (d.headshot_url || '') : ''
    }));
    return [
      { key:'drivers', title:'드라이버 챔피언십', label:'PTS', rows: mk(st.drivers, true) },
      { key:'constructors', title:'컨스트럭터 챔피언십', label:'PTS', rows: mk(st.teams, false) }
    ].filter(g => g.rows.length);
  }
  return [];
}

async function apiResponse(url) {
  if (url.pathname === '/api/health') return { ok:true, service:'orange-sports-web', sports:Object.keys(SPORTS), deepl:DEEPL_KEY?(/:fx$/.test(DEEPL_KEY)?'free':'pro'):'off', names:NAME_ENTRIES.length, translationCache:Object.keys(TRANSLATION_CACHE).length };
  if (url.pathname === '/api/article') return getArticleDetail(url.searchParams.get('url') || '');
  const match = url.pathname.match(new RegExp(`^/api/sports/(${Object.keys(SPORTS).join('|')})/(schedule|standings|leaders|news|article)$`));
  if (!match) return null;
  const [, sport, resource] = match;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(url.searchParams.get('date') || '') ? url.searchParams.get('date') : new Date().toISOString().slice(0, 10);
  const season = /^\d{4}$/.test(url.searchParams.get('season') || '') ? url.searchParams.get('season') : date.slice(0, 4);
  if (resource === 'schedule') return getSchedule(sport, date);
  if (resource === 'standings') return getStandings(sport, season);
  if (resource === 'leaders') return getLeaders(sport, season);
  if (resource === 'article') return getArticleDetail(url.searchParams.get('url') || '');  // 이전 경로 호환
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
