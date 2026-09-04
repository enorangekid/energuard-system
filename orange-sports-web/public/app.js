const SPORTS = {
  home:{ label:'SPORTS', name:'스포츠 홈', category:'ALL SPORTS', mark:'OS', keywords:['오늘의 스포츠','한국 선수','주요 경기','실시간 속보','우승 경쟁'] },
  kbo:{ label:'국내야구', name:'국내 야구', category:'KOREAN BASEBALL', mark:'KBO', newsOnly:true, keywords:['KBO','프로야구','한국시리즈','야구 국가대표','신인 드래프트'] },
  mlb:{ label:'해외야구', name:'해외 야구 · MLB', category:'WORLD BASEBALL', mark:'MLB', keywords:['오타니 쇼헤이','이정후','김하성','LA 다저스','월드시리즈'] },
  kfootball:{ label:'국내축구', name:'국내 축구', category:'KOREAN FOOTBALL', mark:'K', newsOnly:true, keywords:['K리그','축구 국가대표','울산 HD','전북 현대','FC서울'] },
  football:{ label:'해외축구', name:'해외 축구', category:'WORLD FOOTBALL', mark:'FC', keywords:['프리미어리그','챔피언스리그','라리가','분데스리가','세리에A'] },
  kbl:{ label:'국내농구', name:'국내 농구', category:'KOREAN BASKETBALL', mark:'KBL', newsOnly:true, keywords:['KBL','WKBL','프로농구','농구 국가대표','농구 플레이오프'] },
  nba:{ label:'해외농구', name:'해외 농구 · NBA', category:'WORLD BASKETBALL', mark:'NBA', keywords:['르브론 제임스','스테픈 커리','루카 돈치치','LA 레이커스','NBA 플레이오프'] },
  f1:{ label:'F1', name:'포뮬러 1', category:'MOTORSPORT', mark:'F1', keywords:['막스 베르스타펜','루이스 해밀턴','페라리','맥라렌','그랑프리'] }
};
const TEAM_KO = {108:'LA 에인절스',109:'애리조나',110:'볼티모어',111:'보스턴',112:'시카고 컵스',113:'신시내티',114:'클리블랜드',115:'콜로라도',116:'디트로이트',117:'휴스턴',118:'캔자스시티',119:'LA 다저스',120:'워싱턴',121:'뉴욕 메츠',133:'애슬레틱스',134:'피츠버그',135:'샌디에이고',136:'시애틀',137:'SF 자이언츠',138:'세인트루이스',139:'탬파베이',140:'텍사스',141:'토론토',142:'미네소타',143:'필라델피아',144:'애틀랜타',145:'시카고 화이트삭스',146:'마이애미',147:'뉴욕 양키스',158:'밀워키'};
const TEAM_KO_BY_SPORT = {
  nba:{ATL:'애틀랜타 호크스',BOS:'보스턴 셀틱스',BKN:'브루클린 네츠',CHA:'샬럿 호네츠',CHI:'시카고 불스',CLE:'클리블랜드 캐벌리어스',DAL:'댈러스 매버릭스',DEN:'덴버 너기츠',DET:'디트로이트 피스톤스',GS:'골든스테이트 워리어스',HOU:'휴스턴 로키츠',IND:'인디애나 페이서스',LAC:'LA 클리퍼스',LAL:'LA 레이커스',MEM:'멤피스 그리즐리스',MIA:'마이애미 히트',MIL:'밀워키 벅스',MIN:'미네소타 팀버울브스',NO:'뉴올리언스 펠리컨스',NY:'뉴욕 닉스',OKC:'오클라호마시티 썬더',ORL:'올랜도 매직',PHI:'필라델피아 세븐티식서스',PHX:'피닉스 선즈',POR:'포틀랜드 트레일블레이저스',SA:'샌안토니오 스퍼스',SAC:'새크라멘토 킹스',TOR:'토론토 랩터스',UTAH:'유타 재즈',WSH:'워싱턴 위저즈'},
  epl:{ARS:'아스널',AVL:'애스턴 빌라',BHA:'브라이턴',BOU:'본머스',BRE:'브렌트퍼드',CHE:'첼시',COV:'코번트리 시티',CRY:'크리스털 팰리스',EVE:'에버턴',FUL:'풀럼',HUL:'헐 시티',IPS:'입스위치 타운',LEE:'리즈 유나이티드',LIV:'리버풀',MAN:'맨체스터 유나이티드',MNC:'맨체스터 시티',NEW:'뉴캐슬 유나이티드',NFO:'노팅엄 포리스트',SUN:'선덜랜드',TOT:'토트넘 홋스퍼'}
};
const state = { sport:'home', date:kstDateKey(), games:[], articles:[], standings:[], favoriteTeams:new Set(JSON.parse(localStorage.getItem('orangeFavoriteTeams') || '[]')), request:0, filter:'all', activeArticle:null, season:'', leaders:[], leadersExpanded:new Set() };
// 순위·선수 스탯(과거 시즌 포함)을 제공하는 종목
const SPORT_DATA = new Set(['mlb','nba','football','f1']);
function currentSeasonValue(sport){ const n=new Date(), Y=n.getFullYear(), m=n.getMonth();
  if(sport==='mlb'||sport==='f1') return String(Y);
  if(sport==='nba') return String(m>=9 ? Y+1 : Y);      // ESPN NBA는 시즌 종료연도
  if(sport==='football') return String(m>=7 ? Y : Y-1);  // EPL은 시즌 시작연도(8월 개막)
  return ''; }
function seasonOptions(sport){ const cur=Number(currentSeasonValue(sport)); if(!cur) return [];
  const lo = sport==='f1' ? 2023 : cur-10, out=[];
  for(let v=cur; v>=lo; v--){
    const label = (sport==='mlb'||sport==='f1') ? `${v} 시즌`
      : sport==='nba' ? `${v-1}-${String(v).slice(-2)} 시즌`
      : `${v}-${String(v+1).slice(-2)} 시즌`;
    out.push({value:String(v), label});
  }
  return out; }
function seasonParam(sport){ return state.season || currentSeasonValue(sport); }
const apiCache = new Map();
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function kstDateKey(date = new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date); }
function dateLabel(key) { return new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'short'}).format(new Date(`${key}T12:00:00+09:00`)); }
function moveDate(days) { const d = new Date(`${state.date}T12:00:00+09:00`); d.setDate(d.getDate()+days); state.date=kstDateKey(d); loadSport(state.sport); }
function relativeTime(value, label='') { if(label)return label; const t=new Date(value).getTime(); if(!t)return ''; const h=Math.max(0,Math.round((Date.now()-t)/36e5)); return h<1?'방금 전':h<24?`${h}시간 전`:`${Math.floor(h/24)}일 전`; }
function teamName(team, sport=state.sport) { const key=String(team?.abbreviation||team?.abbr||'').toUpperCase(), mapSport=sport==='football'?'epl':sport; return TEAM_KO[team?.id] || TEAM_KO_BY_SPORT[mapSport]?.[key] || team?.displayName || team?.shortDisplayName || team?.name || '팀'; }
function teamLogo(team, sport=state.sport) {
  const supplied = team?.logo || team?.logos?.[0]?.href;
  if (supplied) return supplied;
  if (team?.id && sport==='mlb') return `https://www.mlbstatic.com/team-logos/${team.id}.svg`;
  const abbreviation = String(team?.abbreviation || team?.abbr || '').toLowerCase();
  if (abbreviation && sport==='nba') return `https://a.espncdn.com/i/teamlogos/nba/500/${abbreviation}.png`;
  return '';
}
function teamMark(team, sport, className='') {
  const name=teamName(team,sport), logo=teamLogo(team,sport), initial=(team?.abbreviation || name || '?').slice(0,2);
  return `<span class="team-mark ${esc(className)}"><i>${esc(initial)}</i>${logo?`<img src="${esc(logo)}" alt="${esc(name)} 로고">`:''}</span>`;
}
function statusTime(date) { return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(date)); }

function normalizeMlb(data) {
  return (data.dates || []).flatMap(day=>day.games||[]).map(game=>({ id:game.gamePk, sport:'mlb', date:game.gameDate, away:game.teams?.away?.team, home:game.teams?.home?.team, awayScore:game.teams?.away?.score ?? '-', homeScore:game.teams?.home?.score ?? '-', state:game.status?.abstractGameState, detail:game.status?.abstractGameState==='Live'?`${game.linescore?.currentInning||''}회 ${game.linescore?.inningHalf==='Top'?'초':'말'}`:game.status?.abstractGameState==='Final'?'종료':statusTime(game.gameDate) }));
}
function normalizeEspn(data, sport) {
  return (data.events||[]).map(event=>{ const comp=event.competitions?.[0]||{}, competitors=comp.competitors||[]; const home=competitors.find(c=>c.homeAway==='home')||competitors[0]||{}, away=competitors.find(c=>c.homeAway==='away')||competitors[1]||{}; const status=comp.status||event.status||{}, completed=status.type?.completed; return {id:event.id,sport,date:event.date,away:{...(away.team||{}),logo:away.team?.logo||away.team?.logos?.[0]?.href},home:{...(home.team||{}),logo:home.team?.logo||home.team?.logos?.[0]?.href},awayScore:away.score??'-',homeScore:home.score??'-',state:completed?'Final':status.type?.state==='in'?'Live':'Preview',detail:completed?'종료':status.type?.state==='in'?(status.type?.shortDetail||status.displayClock||'LIVE'):statusTime(event.date)}; });
}
function normalizeF1(data) {
  const meetings=data.meetings||[], sessions=data.sessions||[];
  return meetings.map(meeting=>{ const race=sessions.find(s=>s.meeting_key===meeting.meeting_key&&s.session_name==='Race')||sessions.filter(s=>s.meeting_key===meeting.meeting_key).at(-1); if(!race)return null; const start=new Date(race.date_start), end=new Date(race.date_end||race.date_start); const live=Date.now()>=start&&Date.now()<=end; const done=Date.now()>end; return {id:meeting.meeting_key,sport:'f1',date:race.date_start,away:{name:meeting.country_name||'F1'},home:{name:meeting.meeting_name||meeting.location},awayScore:meeting.country_code||'',homeScore:'',state:live?'Live':done?'Final':'Preview',detail:live?'레이스 진행 중':done?'종료':statusTime(race.date_start)}; }).filter(Boolean).sort((a,b)=>new Date(a.date)-new Date(b.date));
}
function normalizeSchedule(data,sport){ return sport==='mlb'?normalizeMlb(data):sport==='f1'?normalizeF1(data):normalizeEspn(data,sport); }

function gameCard(game, compact=false) {
  const statusClass=game.state==='Live'?'live':game.state==='Final'?'final':'scheduled', f1=game.sport==='f1';
  const team=(item,score)=>`<div class="game-team">${teamMark(item,game.sport)}<span>${esc(teamName(item,game.sport))}</span><b>${esc(score)}</b></div>`;
  return `<button class="game-row ${compact?'compact':''}" data-game="${esc(game.id)}" type="button"><div class="game-meta"><small>${esc(SPORTS[game.sport].label)}</small><strong class="${statusClass}">${esc(game.detail)}</strong></div>${team(game.away,game.awayScore)}${f1?'':team(game.home,game.homeScore)}</button>`;
}
function tickerCard(game){ const row=(team,score)=>`<span>${teamMark(team,game.sport,'ticker-mark')}<span class="ticker-team-name">${esc(teamName(team,game.sport))}</span><strong>${esc(score)}</strong></span>`; return `<button class="ticker-game" data-game="${esc(game.id)}" type="button"><span class="ticker-head"><b>${esc(SPORTS[game.sport].label)}</b><em class="${game.state==='Live'?'live':''}">${esc(game.detail)}</em></span>${row(game.away,game.awayScore)}${game.sport==='f1'?'':row(game.home,game.homeScore)}</button>`; }

function articleVisual(article, large=false){ if(article.image)return `<img src="${esc(article.image)}" alt="${esc(article.title)}" loading="lazy" referrerpolicy="no-referrer">`; const source=(article.author||SPORTS[state.sport].label).slice(0,12); return `<div class="article-fallback ${large?'large':''}"><span>${esc(SPORTS[state.sport].mark)}</span><b>${esc(source)}</b></div>`; }
function articleBadge(article){ return article.badge||(article.kind==='official'?'공식':'국내'); }
// 홈은 7개 종목 뉴스를 합쳐 보여줘서 종목이 겹치는 기사(예: 라이선스 게임 소식)나
// 통신사 송고분을 여러 매체가 각자 올린 근접 중복이 나란히 뜬다. 제목/사진/내용 토큰으로 한 번 더 거른다.
const DEDUPE_STOP=new Set(['경기','시즌','리그','프로','올해','오늘','내일','만에','향해','결국','다시','대한','관련','이번','최근','그리고','밝혔다','전했다','했다','한다','대해','위해','까지','부터','에서','으로','상대','최다','최소','최초','기록','소식','현지','미국','한국','국내','해외','선수','감독','구단']);
function dedupeArticles(items){
  const seen=new Set(), kept=[];
  return items.filter(a=>{
    const title=(a.title||'').toLowerCase();
    const tkey=title.replace(/^(?:\s*\[[^\]]{1,14}\]\s*)+/,'').replace(/[^a-z0-9가-힣]/g,'').slice(0,50);
    const ikey=a.image?`i:${a.image}`:'';
    if((tkey&&seen.has(tkey))||(ikey&&seen.has(ikey)))return false;
    const stem=w=>{const s=w.replace(/(으로부터|으로|로서|로써|이라는|라는|이라고|라고|에게서|에서|에게|한테|이라|보다|처럼|까지|부터|만에|번째|이나|와의|과의|은|는|이|가|을|를|의|도|만|와|과|에|께|야|랑|로)$/,'');return s.length>=2?s:w;};
    const toks=new Set(title.replace(/[^a-z0-9가-힣\s]/g,' ').split(/\s+/).filter(w=>w.length>=2).map(stem).filter(w=>!DEDUPE_STOP.has(w)));
    const slot=a.publishedLabel||'';
    const near=kept.some(k=>{
      let s=0; for(const t of toks) if(k.toks.has(t)) s++;
      if(s<4)return false;
      return s/Math.min(toks.size,k.toks.size)>=0.5 || (slot && slot===k.slot && /전$/.test(slot));
    });
    if(near)return false;
    if(tkey)seen.add(tkey); if(ikey)seen.add(ikey);
    kept.push({toks,slot});
    return true;
  });
}
function articleCard(article,index){ return `<a class="news-card ${index===0?'wide':''}" data-kind="${esc(article.kind)}" data-article="${esc(article.id)}" href="#article/${esc(article.id)}"><div class="news-image">${articleVisual(article,index===0)}</div><div class="news-body"><small><span class="source-badge ${article.kind}">${esc(articleBadge(article))}</span>${esc(article.author)} · ${esc(relativeTime(article.published,article.publishedLabel))}</small><h3>${esc(article.title)}</h3><p>${esc(article.summary||'오렌지 스포츠 안에서 기사 정보를 확인하세요.')}</p></div></a>`; }

function renderGames(){
  const dateGames=state.sport==='f1'?state.games.filter(g=>Math.abs(new Date(g.date)-new Date(`${state.date}T12:00:00+09:00`))<15*864e5).slice(0,8):state.games;
  const preparing=SPORTS[state.sport]?.newsOnly;
  $('#scoreTicker').innerHTML=dateGames.length?dateGames.map(tickerCard).join(''):`<div class="empty horizontal">${preparing?'경기 데이터는 다음 단계에서 연결합니다.':'이 날짜에 등록된 경기가 없습니다.'}</div>`;
  $('#recommendedGames').innerHTML=dateGames.length?dateGames.slice(0,6).map(g=>gameCard(g,true)).join(''):`<div class="empty">${preparing?'현재는 뉴스 중심으로 제공합니다.':'예정된 주요 경기가 없습니다.'}</div>`;
  $('#fullSchedule').innerHTML=dateGames.length?dateGames.map(g=>gameCard(g)).join(''):`<div class="empty tall">${preparing?'경기 일정·결과는 준비 중입니다.':'표시할 일정이 없습니다.'}</div>`;
  const teams=[...new Map(dateGames.flatMap(g=>[g.away&&{...g.away,_sport:g.sport},g.home&&{...g.home,_sport:g.sport}]).filter(Boolean).map(t=>[`${t._sport}:${String(t.id||t.name)}`,t])).values()].slice(0,12);
  $('#teamChips').innerHTML=teams.length?teams.map(t=>{const id=String(t.id||t.name),active=state.favoriteTeams.has(id);return `<button class="team-chip ${active?'active':''}" data-team="${esc(id)}" type="button">${teamMark(t,t._sport,'chip-mark')}<span>${esc(teamName(t,t._sport))}</span><b>${active?'✓':'+'}</b></button>`}).join(''):'<span class="muted">경기가 열리면 응원 팀을 선택할 수 있습니다.</span>';
}
function renderNews(){
  const filtered=state.filter==='all'?state.articles:state.articles.filter(a=>a.kind===state.filter), [featured,...rest]=filtered;
  $('#featuredStory').classList.remove('loading-card');
  $('#featuredStory').innerHTML=featured?`<a data-article="${esc(featured.id)}" href="#article/${esc(featured.id)}"><div class="feature-media">${articleVisual(featured,true)}</div><div class="feature-copy"><small>${esc(articleBadge(featured))} · ${esc(featured.author)} · ${esc(relativeTime(featured.published,featured.publishedLabel))}</small><h2>${esc(featured.title)}</h2><p>${esc(featured.summary||'오늘 가장 주목받는 스포츠 소식입니다.')}</p></div></a>`:'<div class="empty tall">뉴스를 불러오지 못했습니다.</div>';
  $('#sideNews').innerHTML=rest.slice(0,5).map(a=>`<a class="side-news-row" data-article="${esc(a.id)}" href="#article/${esc(a.id)}"><span><small>${esc(a.author)} · ${esc(relativeTime(a.published,a.publishedLabel))}</small><b>${esc(a.title)}</b></span><em>${esc(articleBadge(a))}</em></a>`).join('')||'<div class="empty">표시할 뉴스가 없습니다.</div>';
  $('#newsGrid').innerHTML=rest.slice(5).map(articleCard).join('')||'<div class="empty wide-empty">선택한 유형의 뉴스가 없습니다.</div>';
}

function collectStandings(data,sport){
  if(sport==='mlb')return (data.records||[]).flatMap(r=>r.teamRecords||[]).sort((a,b)=>Number(b.winningPercentage)-Number(a.winningPercentage)).map(r=>({name:teamName(r.team),logo:`https://www.mlbstatic.com/team-logos/${r.team.id}.svg`,record:`${r.wins}승 ${r.losses}패`,value:r.winningPercentage}));
  if(sport==='f1')return (data.drivers||[]).sort((a,b)=>(a.position_current||999)-(b.position_current||999)).map(r=>({name:r.full_name||r.broadcast_name||`드라이버 ${r.driver_number}`,record:r.team_name||'',value:`${r.points_current??0} PTS`}));
  const rows=[]; const walk=node=>{ if(node?.standings?.entries)rows.push(...node.standings.entries); (node?.children||[]).forEach(walk); }; walk(data);
  return [...new Map(rows.map(r=>[r.team?.id||r.team?.displayName,r])).values()].map(r=>{const stats=Object.fromEntries((r.stats||[]).map(s=>[s.name,s.displayValue])); return {name:teamName(r.team),logo:r.team?.logos?.[0]?.href||r.team?.logo,record:sport==='nba'?`${stats.wins||0}승 ${stats.losses||0}패`:`${stats.wins||0}승 ${stats.ties||stats.draws||0}무 ${stats.losses||0}패`,value:sport==='nba'?(stats.winPercent||stats.winPercentage||''):`${stats.points||0}점`}; });
}
function renderStandings(data){ state.standings=collectStandings(data,state.sport).slice(0,10); $('#standingsList').innerHTML=state.standings.length?state.standings.map((r,i)=>`<div class="standing-row"><em>${i+1}</em>${r.logo?`<img src="${esc(r.logo)}" alt="">`:`<i>${esc(r.name.slice(0,1))}</i>`}<span>${esc(r.name)}</span><small>${esc(r.record)}</small><b>${esc(r.value)}</b></div>`).join(''):`<div class="empty tall">${SPORTS[state.sport]?.newsOnly?'순위·선수 기록은 준비 중입니다.':'현재 제공되는 순위가 없습니다.'}</div>`; }
function renderKeywords(){ $('#keywordGrid').innerHTML=SPORTS[state.sport].keywords.map((k,i)=>`<button type="button" data-keyword="${esc(k)}"><em>${String(i+1).padStart(2,'0')}</em><span><b>${esc(k)}</b><small>관련 뉴스 모아보기</small></span><strong>＋</strong></button>`).join(''); }
function renderLeaders(data){
  state.leaders=data?.groups||[];
  const grid=$('#leadersGrid');
  if(!state.leaders.length){ grid.innerHTML='<div class="empty wide-empty">선수 기록을 불러오지 못했습니다.</div>'; return; }
  grid.innerHTML=state.leaders.map(g=>{
    const open=state.leadersExpanded.has(g.key);
    const rows=(open?g.rows:g.rows.slice(0,5)).map(r=>`<div class="leader-row"><em>${esc(String(r.rank??''))}</em><span class="lpic"><i>${esc((r.name||'?').slice(0,1))}</i>${r.photo?`<img src="${esc(r.photo)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`:''}</span><span class="ln">${esc(r.name)}</span><small>${esc(r.team||'')}</small><b>${esc(String(r.value))}</b></div>`).join('');
    const more=g.rows.length>5?`<button type="button" class="leader-more" data-leader-more="${esc(g.key)}">${open?'접기 −':'더보기 +'}</button>`:'';
    return `<div class="leader-card"><div class="leader-head"><b>${esc(g.title)}</b><span>${esc(g.label)}</span></div>${rows}${more}</div>`;
  }).join('');
}

function canFetchBody(article){ return article && /^https?:/.test(article.link||'') && !/news\.google\.com/.test(article.link||'') && (article.kind==='official'||article.kind==='domestic'); }
function articleBodyUrl(article){ return `/api/article?url=${encodeURIComponent(article.link)}`; }
// 목록에서 카드에 마우스만 올려도 본문을 미리 받아둔다. 클릭 시엔 캐시에서 즉시 표시.
const prefetched=new Set();
function prefetchBody(article){
  if(!canFetchBody(article)) return;
  const url=articleBodyUrl(article);
  if(prefetched.has(url)) return;
  prefetched.add(url);
  getJson(url).catch(()=>prefetched.delete(url));
}

function openArticle(id, push=true){
  const article=state.articles.find(item=>String(item.id)===String(id)); if(!article)return;
  state.activeArticle=String(id);
  // 기사 열기를 히스토리에 쌓아, 브라우저 뒤로가기가 사이트를 벗어나지 않고 목록으로 돌아오게 한다.
  if(push && history.state?.id!==String(id)) history.pushState({view:'article',id:String(id)},'',`#article/${encodeURIComponent(id)}`);
  const related=state.articles.filter(item=>item.id!==article.id).slice(0,4);
  $('#readerImage').innerHTML=articleVisual(article,true);
  $('#readerMeta').innerHTML=`<span class="source-badge ${esc(article.kind)}">${esc(articleBadge(article))}</span><b>${esc(article.author)}</b><time>${esc(relativeTime(article.published,article.publishedLabel))}</time>`;
  $('#readerTitle').textContent=article.title;
  const fetchBody=canFetchBody(article);
  // 요약을 즉시 보여줘 체감 대기를 없애고, 전문이 도착하면 교체한다.
  $('#readerLead').textContent=article.summary||(fetchBody?'기사 본문을 불러오는 중입니다…':`${article.author}에서 보도한 ${SPORTS[state.sport].name} 관련 최신 기사입니다.`);
  $('#readerOriginal').href=article.link;
  $('#readerRelated').innerHTML=related.map(item=>`<a data-article="${esc(item.id)}" href="#article/${esc(item.id)}"><small>${esc(item.author)} · ${esc(relativeTime(item.published,item.publishedLabel))}</small><b>${esc(item.title)}</b><span>기사 보기 ›</span></a>`).join('');
  document.querySelectorAll('.page-section,.team-strip').forEach(el=>el.hidden=true); $('#articleReader').hidden=false; window.scrollTo({top:0,behavior:'smooth'});
  related.forEach(prefetchBody);
  if(fetchBody)getJson(articleBodyUrl(article)).then(detail=>{
    if(state.activeArticle!==String(id))return;
    if(!detail?.summary)return;   // 실패 시 이미 떠 있는 요약 유지
    $('#readerLead').textContent=detail.translated===false?`현재 무료 번역 호출 한도에 도달해 원문으로 표시합니다.\n\n${detail.summary}`:detail.summary;
  }).catch(()=>{});
}
function hideReader(){ state.activeArticle=null; $('#articleReader').hidden=true; document.querySelectorAll('.page-section,.team-strip').forEach(el=>el.hidden=false); if(!SPORT_DATA.has(state.sport)){$('#leaderboards').hidden=true;$('#seasonSelect').hidden=true;} }
function closeArticle(){ hideReader(); history.replaceState(null,'',`#${state.sport==='home'?'top':'news'}`); }
// 뒤로가기/앞으로가기: 기사 상태면 리더를 열고, 아니면 리더를 닫아 목록으로 복귀한다.
window.addEventListener('popstate',()=>{
  const m=location.hash.match(/^#article\/(.+)$/);
  if(m){ const id=decodeURIComponent(m[1]); if(state.activeArticle!==id) openArticle(id,false); return; }
  if(!$('#articleReader').hidden) hideReader();
});

function applySportHeader(sport){ const c=SPORTS[sport]; document.body.dataset.theme=sport; $('#ribbonSport').textContent=c.label; $('#leagueMark').textContent=c.mark; $('#leagueCategory').textContent=c.category; $('#leagueName').textContent=c.name; $('#newsTitle').textContent=`오늘의 ${c.label} 뉴스`; $('#standingsTitle').textContent=sport==='f1'?'드라이버 챔피언십':sport==='home'?'종목별 현황':'리그 순위'; document.querySelectorAll('[data-sport]').forEach(b=>b.classList.toggle('active',b.dataset.sport===sport)); $('#todayLabel').textContent=dateLabel(state.date); $('#scheduleDate').textContent=dateLabel(state.date); renderKeywords();
  const hasData=SPORT_DATA.has(sport), sel=$('#seasonSelect');
  sel.hidden=!hasData; $('#leaderboards').hidden=!hasData;
  if(hasData){
    const opts=seasonOptions(sport);
    sel.innerHTML='<option value="">현재 시즌</option>'+opts.map(o=>`<option value="${o.value}">${esc(o.label)}</option>`).join('');
    sel.value=state.season;
    $('#leadersTitle').textContent=sport==='f1'?'드라이버·팀 순위':'선수 기록';
    $('#leadersSeasonTag').textContent=state.season?(opts.find(o=>o.value===state.season)?.label||''):'현재 시즌';
  }
}
function apiTtl(url){ return url.endsWith('/news')?10*60_000:url.includes('/api/article?')?30*60_000:url.includes('/standings?')?5*60_000:20_000; }
function peekJson(url){ const cached=apiCache.get(url); return cached?.data && Date.now()-cached.savedAt<apiTtl(url)?cached.data:null; }
async function getJson(url){
  const cached=apiCache.get(url), ttl=apiTtl(url);
  if(cached?.data && Date.now()-cached.savedAt<ttl)return cached.data;
  if(cached?.promise)return cached.promise;
  const promise=fetch(url).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'데이터 요청 실패');apiCache.set(url,{data:d,savedAt:Date.now()});return d;}).catch(error=>{apiCache.delete(url);throw error;});
  apiCache.set(url,{...(cached||{}),promise});
  return promise;
}

function sportUrls(sport){ const s=seasonParam(sport); return {schedule:`/api/sports/${sport}/schedule?date=${state.date}`,news:`/api/sports/${sport}/news`,standings:`/api/sports/${sport}/standings?season=${s}`,leaders:`/api/sports/${sport}/leaders?season=${s}`}; }
function renderCachedSport(sport){
  const urls=sportUrls(sport), schedule=peekJson(urls.schedule), news=peekJson(urls.news), standings=peekJson(urls.standings), leaders=SPORT_DATA.has(sport)?peekJson(urls.leaders):null;
  if(schedule){state.games=normalizeSchedule(schedule,sport);renderGames();}
  if(news){state.articles=news.articles||[];renderNews();}
  if(standings)renderStandings(standings);
  if(leaders)renderLeaders(leaders);
  return {schedule:Boolean(schedule),news:Boolean(news),standings:Boolean(standings),leaders:Boolean(leaders)};
}

async function loadOne(sport,request){
  const urls=sportUrls(sport);
  const schedule=getJson(urls.schedule).then(data=>{if(request!==state.request)return;state.games=normalizeSchedule(data,sport);renderGames();}).catch(()=>{if(request===state.request){state.games=[];renderGames();}});
  const news=getJson(urls.news).then(data=>{if(request!==state.request)return;state.articles=data.articles||[];renderNews();}).catch(()=>{if(request===state.request){state.articles=[];renderNews();}});
  const standings=getJson(urls.standings).then(data=>{if(request===state.request)renderStandings(data);}).catch(()=>{if(request===state.request)renderStandings({});});
  const tasks=[schedule,news,standings];
  if(SPORT_DATA.has(sport)) tasks.push(getJson(urls.leaders).then(data=>{if(request===state.request)renderLeaders(data);}).catch(()=>{if(request===state.request)renderLeaders({});}));
  await Promise.allSettled(tasks);
}
async function loadHome(request){
  const sports=['kbo','mlb','kfootball','football','kbl','nba','f1'];
  const results=await Promise.all(sports.map(async sport=>{const [s,n]=await Promise.allSettled([getJson(`/api/sports/${sport}/schedule?date=${state.date}`),getJson(`/api/sports/${sport}/news`)]); let games=s.status==='fulfilled'?normalizeSchedule(s.value,sport):[]; if(sport==='f1'){const pivot=new Date(`${state.date}T12:00:00+09:00`); games=games.filter(game=>Math.abs(new Date(game.date)-pivot)<10*864e5);} return {sport,games,articles:n.status==='fulfilled'?(n.value.articles||[]).slice(0,5):[]};}));
  if(request!==state.request)return;
  state.games=results.flatMap(r=>r.games).sort((a,b)=>new Date(a.date)-new Date(b.date)); state.articles=dedupeArticles(results.flatMap(r=>r.articles)).sort((a,b)=>new Date(b.published)-new Date(a.published)); renderGames();renderNews();
  const counts=results.map(r=>({name:SPORTS[r.sport].name,record:`오늘 ${r.games.length}경기`,value:`뉴스 ${r.articles.length}`,logo:''})); state.standings=counts; $('#standingsList').innerHTML=counts.map((r,i)=>`<div class="standing-row"><em>${i+1}</em><i>${SPORTS[results[i].sport].mark.slice(0,1)}</i><span>${r.name}</span><small>${r.record}</small><b>${r.value}</b></div>`).join('');
}
async function loadSport(sport, keepSeason){
  closeArticle();
  if(!keepSeason && sport!==state.sport){ state.season=''; state.leadersExpanded.clear(); }
  state.sport=sport; state.filter='all'; state.request+=1; const request=state.request; applySportHeader(sport);
  document.querySelectorAll('[data-news-filter]').forEach(b=>b.classList.toggle('active',b.dataset.newsFilter==='all'));
  const cached=sport==='home'?{}:renderCachedSport(sport);
  if(SPORT_DATA.has(sport) && !cached.leaders)$('#leadersGrid').innerHTML='<div class="empty">기록을 불러오는 중입니다.</div>';
  if(!cached.schedule){$('#scoreTicker').innerHTML='<i class="loading-bar"></i>';$('#recommendedGames').innerHTML='<div class="empty">경기를 불러오는 중입니다.</div>';$('#fullSchedule').innerHTML='<div class="empty tall">일정을 불러오는 중입니다.</div>';}
  if(!cached.news){$('#featuredStory').className='feature-story loading-card';$('#featuredStory').innerHTML='';$('#sideNews').innerHTML='<div class="empty">뉴스를 불러오는 중입니다.</div>';$('#newsGrid').innerHTML='';}
  if(!cached.standings)$('#standingsList').innerHTML='<div class="empty tall">순위를 불러오는 중입니다.</div>';
  try{ sport==='home'?await loadHome(request):await loadOne(sport,request); }catch(error){toast(error.message);}
}

function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2200);}
document.addEventListener('click',event=>{
  const article=event.target.closest('[data-article]'); if(article){event.preventDefault();openArticle(article.dataset.article);return;}
  const sport=event.target.closest('[data-sport]'); if(sport){loadSport(sport.dataset.sport);scrollTo({top:0,behavior:'smooth'});return;}
  const filter=event.target.closest('[data-news-filter]'); if(filter){state.filter=filter.dataset.newsFilter;document.querySelectorAll('[data-news-filter]').forEach(b=>b.classList.toggle('active',b===filter));renderNews();return;}
  const team=event.target.closest('[data-team]'); if(team){const id=team.dataset.team;state.favoriteTeams.has(id)?state.favoriteTeams.delete(id):state.favoriteTeams.add(id);localStorage.setItem('orangeFavoriteTeams',JSON.stringify([...state.favoriteTeams]));renderGames();toast('응원 팀 설정을 저장했습니다.');return;}
  const keyword=event.target.closest('[data-keyword]'); if(keyword){$('#searchInput').value=keyword.dataset.keyword;filterNews(keyword.dataset.keyword);location.hash='news';return;}
  const more=event.target.closest('[data-leader-more]'); if(more){const k=more.dataset.leaderMore;state.leadersExpanded.has(k)?state.leadersExpanded.delete(k):state.leadersExpanded.add(k);renderLeaders({groups:state.leaders});return;}
  if(event.target.closest('[data-coming]'))toast('Windows 앱 설정과 연결할 예정입니다.');
  if(event.target.closest('[data-game]'))toast('경기 상세·문자중계 화면과 연결할 예정입니다.');
});
document.addEventListener('pointerover',event=>{
  const link=event.target.closest('[data-article]'); if(!link)return;
  const article=state.articles.find(a=>String(a.id)===String(link.dataset.article));
  if(article)prefetchBody(article);
},{passive:true});
document.addEventListener('error',event=>{
  if(!(event.target instanceof HTMLImageElement))return;
  if(event.target.closest('.team-mark')){event.target.remove();return;}
  const container=event.target.closest('.news-image,.feature-media,.reader-image');
  if(container){const large=container.classList.contains('feature-media')||container.classList.contains('reader-image');container.innerHTML=`<div class="article-fallback ${large?'large':''}"><span>${esc(SPORTS[state.sport].mark)}</span><b>ORANGE SPORTS</b></div>`;}
},true);
function filterNews(keyword){document.querySelectorAll('.news-card,.side-news-row').forEach(card=>card.hidden=Boolean(keyword)&&!card.textContent.toLowerCase().includes(keyword.toLowerCase()));}
$('#searchInput').addEventListener('input',e=>filterNews(e.target.value.trim()));
$('#prevDate').addEventListener('click',()=>moveDate(-1)); $('#nextDate').addEventListener('click',()=>moveDate(1)); $('#dateButton').addEventListener('click',()=>{state.date=kstDateKey();loadSport(state.sport);});
$('#seasonSelect').addEventListener('change',e=>{ state.season=e.target.value; state.leadersExpanded.clear(); loadSport(state.sport,true); });
$('#articleBack').addEventListener('click',()=>{
  // 히스토리에 기사 진입 기록이 있으면 브라우저 뒤로가기와 동일하게 처리, 없으면(딥링크 등) 그냥 닫기.
  if(history.state?.view==='article'){ history.back(); } else { closeArticle(); }
  window.scrollTo({top:0,behavior:'smooth'});
});
$('#followLeague').addEventListener('click',e=>{e.currentTarget.classList.toggle('active');e.currentTarget.textContent=e.currentTarget.classList.contains('active')?'✓ 리그 팔로잉':'＋ 리그 팔로우';});
loadSport('home');
