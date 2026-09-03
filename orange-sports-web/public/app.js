const SPORTS = {
  home:{ label:'SPORTS', name:'스포츠 홈', category:'ALL SPORTS', mark:'OS', keywords:['오늘의 스포츠','한국 선수','주요 경기','실시간 속보','우승 경쟁'] },
  mlb:{ label:'MLB', name:'메이저리그', category:'BASEBALL', mark:'MLB', keywords:['오타니 쇼헤이','이정후','김하성','LA 다저스','월드시리즈'] },
  nba:{ label:'NBA', name:'미국 프로농구', category:'BASKETBALL', mark:'NBA', keywords:['르브론 제임스','스테픈 커리','루카 돈치치','LA 레이커스','NBA 플레이오프'] },
  epl:{ label:'EPL', name:'프리미어리그', category:'FOOTBALL', mark:'EPL', keywords:['손흥민','맨체스터 시티','리버풀','아스널','프리미어리그 순위'] },
  ucl:{ label:'UCL', name:'UEFA 챔피언스리그', category:'FOOTBALL', mark:'UCL', keywords:['챔피언스리그','레알 마드리드','바르셀로나','바이에른 뮌헨','토너먼트'] },
  f1:{ label:'F1', name:'포뮬러 1', category:'MOTORSPORT', mark:'F1', keywords:['막스 베르스타펜','루이스 해밀턴','페라리','맥라렌','그랑프리'] }
};
const TEAM_KO = {108:'LA 에인절스',109:'애리조나',110:'볼티모어',111:'보스턴',112:'시카고 컵스',113:'신시내티',114:'클리블랜드',115:'콜로라도',116:'디트로이트',117:'휴스턴',118:'캔자스시티',119:'LA 다저스',120:'워싱턴',121:'뉴욕 메츠',133:'애슬레틱스',134:'피츠버그',135:'샌디에이고',136:'시애틀',137:'SF 자이언츠',138:'세인트루이스',139:'탬파베이',140:'텍사스',141:'토론토',142:'미네소타',143:'필라델피아',144:'애틀랜타',145:'시카고 화이트삭스',146:'마이애미',147:'뉴욕 양키스',158:'밀워키'};
const state = { sport:'home', date:kstDateKey(), games:[], articles:[], standings:[], favoriteTeams:new Set(JSON.parse(localStorage.getItem('orangeFavoriteTeams') || '[]')), request:0, filter:'all' };
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function kstDateKey(date = new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date); }
function dateLabel(key) { return new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'short'}).format(new Date(`${key}T12:00:00+09:00`)); }
function moveDate(days) { const d = new Date(`${state.date}T12:00:00+09:00`); d.setDate(d.getDate()+days); state.date=kstDateKey(d); loadSport(state.sport); }
function relativeTime(value, label='') { if(label)return label; const t=new Date(value).getTime(); if(!t)return ''; const h=Math.max(0,Math.round((Date.now()-t)/36e5)); return h<1?'방금 전':h<24?`${h}시간 전`:`${Math.floor(h/24)}일 전`; }
function teamName(team) { return TEAM_KO[team?.id] || team?.displayName || team?.shortDisplayName || team?.name || '팀'; }
function teamLogo(team) { return team?.logo || (team?.id && state.sport==='mlb' ? `https://www.mlbstatic.com/team-logos/${team.id}.svg` : ''); }
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
  const team=(item,score)=>`<div class="game-team">${teamLogo(item)?`<img src="${esc(teamLogo(item))}" alt="">`:`<i>${esc((teamName(item)||'?').slice(0,1))}</i>`}<span>${esc(teamName(item))}</span><b>${esc(score)}</b></div>`;
  return `<button class="game-row ${compact?'compact':''}" data-game="${esc(game.id)}" type="button"><div class="game-meta"><small>${esc(SPORTS[game.sport].label)}</small><strong class="${statusClass}">${esc(game.detail)}</strong></div>${team(game.away,game.awayScore)}${f1?'':team(game.home,game.homeScore)}</button>`;
}
function tickerCard(game){ return `<button class="ticker-game" data-game="${esc(game.id)}" type="button"><span class="ticker-head"><b>${esc(SPORTS[game.sport].label)}</b><em class="${game.state==='Live'?'live':''}">${esc(game.detail)}</em></span><span>${esc(teamName(game.away))}<strong>${esc(game.awayScore)}</strong></span>${game.sport==='f1'?'':`<span>${esc(teamName(game.home))}<strong>${esc(game.homeScore)}</strong></span>`}</button>`; }

function articleVisual(article, large=false){ if(article.image)return `<img src="${esc(article.image)}" alt="" loading="lazy">`; const source=(article.author||SPORTS[state.sport].label).slice(0,12); return `<div class="article-fallback ${large?'large':''}"><span>${esc(SPORTS[state.sport].mark)}</span><b>${esc(source)}</b></div>`; }
function articleCard(article,index){ return `<a class="news-card ${index===0?'wide':''}" data-kind="${esc(article.kind)}" data-article="${esc(article.id)}" href="#article/${esc(article.id)}"><div class="news-image">${articleVisual(article,index===0)}</div><div class="news-body"><small><span class="source-badge ${article.kind}">${article.kind==='official'?'공식':'국내'}</span>${esc(article.author)} · ${esc(relativeTime(article.published,article.publishedLabel))}</small><h3>${esc(article.title)}</h3><p>${esc(article.summary||'오렌지 스포츠 안에서 기사 정보를 확인하세요.')}</p></div></a>`; }

function renderGames(){
  const dateGames=state.sport==='f1'?state.games.filter(g=>Math.abs(new Date(g.date)-new Date(`${state.date}T12:00:00+09:00`))<15*864e5).slice(0,8):state.games;
  $('#scoreTicker').innerHTML=dateGames.length?dateGames.map(tickerCard).join(''):'<div class="empty horizontal">이 날짜에 등록된 경기가 없습니다.</div>';
  $('#recommendedGames').innerHTML=dateGames.length?dateGames.slice(0,6).map(g=>gameCard(g,true)).join(''):'<div class="empty">예정된 주요 경기가 없습니다.</div>';
  $('#fullSchedule').innerHTML=dateGames.length?dateGames.map(g=>gameCard(g)).join(''):'<div class="empty tall">표시할 일정이 없습니다.</div>';
  const teams=[...new Map(dateGames.flatMap(g=>[g.away,g.home]).filter(Boolean).map(t=>[String(t.id||t.name),t])).values()].slice(0,12);
  $('#teamChips').innerHTML=teams.length?teams.map(t=>{const id=String(t.id||t.name),active=state.favoriteTeams.has(id);return `<button class="team-chip ${active?'active':''}" data-team="${esc(id)}" type="button">${teamLogo(t)?`<img src="${esc(teamLogo(t))}" alt="">`:''}<span>${esc(teamName(t))}</span><b>${active?'✓':'+'}</b></button>`}).join(''):'<span class="muted">경기가 열리면 응원 팀을 선택할 수 있습니다.</span>';
}
function renderNews(){
  const filtered=state.filter==='all'?state.articles:state.articles.filter(a=>a.kind===state.filter), [featured,...rest]=filtered;
  $('#featuredStory').classList.remove('loading-card');
  $('#featuredStory').innerHTML=featured?`<a data-article="${esc(featured.id)}" href="#article/${esc(featured.id)}"><div class="feature-media">${articleVisual(featured,true)}</div><div class="feature-copy"><small>${featured.kind==='official'?'OFFICIAL':'국내 스포츠'} · ${esc(featured.author)} · ${esc(relativeTime(featured.published,featured.publishedLabel))}</small><h2>${esc(featured.title)}</h2><p>${esc(featured.summary||'오늘 가장 주목받는 스포츠 소식입니다.')}</p></div></a>`:'<div class="empty tall">뉴스를 불러오지 못했습니다.</div>';
  $('#sideNews').innerHTML=rest.slice(0,5).map(a=>`<a class="side-news-row" data-article="${esc(a.id)}" href="#article/${esc(a.id)}"><span><small>${esc(a.author)} · ${esc(relativeTime(a.published,a.publishedLabel))}</small><b>${esc(a.title)}</b></span><em>${a.kind==='official'?'공식':'뉴스'}</em></a>`).join('')||'<div class="empty">표시할 뉴스가 없습니다.</div>';
  $('#newsGrid').innerHTML=rest.slice(5,17).map(articleCard).join('')||'<div class="empty wide-empty">선택한 유형의 뉴스가 없습니다.</div>';
}

function collectStandings(data,sport){
  if(sport==='mlb')return (data.records||[]).flatMap(r=>r.teamRecords||[]).sort((a,b)=>Number(b.winningPercentage)-Number(a.winningPercentage)).map(r=>({name:teamName(r.team),logo:`https://www.mlbstatic.com/team-logos/${r.team.id}.svg`,record:`${r.wins}승 ${r.losses}패`,value:r.winningPercentage}));
  if(sport==='f1')return (data.drivers||[]).sort((a,b)=>(a.position_current||999)-(b.position_current||999)).map(r=>({name:r.full_name||r.broadcast_name||`드라이버 ${r.driver_number}`,record:r.team_name||'',value:`${r.points_current??0} PTS`}));
  const rows=[]; const walk=node=>{ if(node?.standings?.entries)rows.push(...node.standings.entries); (node?.children||[]).forEach(walk); }; walk(data);
  return [...new Map(rows.map(r=>[r.team?.id||r.team?.displayName,r])).values()].map(r=>{const stats=Object.fromEntries((r.stats||[]).map(s=>[s.name,s.displayValue])); return {name:teamName(r.team),logo:r.team?.logos?.[0]?.href||r.team?.logo,record:sport==='nba'?`${stats.wins||0}승 ${stats.losses||0}패`:`${stats.wins||0}승 ${stats.ties||stats.draws||0}무 ${stats.losses||0}패`,value:sport==='nba'?(stats.winPercent||stats.winPercentage||''):`${stats.points||0}점`}; });
}
function renderStandings(data){ state.standings=collectStandings(data,state.sport).slice(0,10); $('#standingsList').innerHTML=state.standings.length?state.standings.map((r,i)=>`<div class="standing-row"><em>${i+1}</em>${r.logo?`<img src="${esc(r.logo)}" alt="">`:`<i>${esc(r.name.slice(0,1))}</i>`}<span>${esc(r.name)}</span><small>${esc(r.record)}</small><b>${esc(r.value)}</b></div>`).join(''):'<div class="empty tall">현재 제공되는 순위가 없습니다.</div>'; }
function renderKeywords(){ $('#keywordGrid').innerHTML=SPORTS[state.sport].keywords.map((k,i)=>`<button type="button" data-keyword="${esc(k)}"><em>${String(i+1).padStart(2,'0')}</em><span><b>${esc(k)}</b><small>관련 뉴스 모아보기</small></span><strong>＋</strong></button>`).join(''); }

function openArticle(id){
  const article=state.articles.find(item=>String(item.id)===String(id)); if(!article)return;
  const related=state.articles.filter(item=>item.id!==article.id).slice(0,4);
  $('#readerImage').innerHTML=articleVisual(article,true);
  $('#readerMeta').innerHTML=`<span class="source-badge ${esc(article.kind)}">${article.kind==='official'?'공식 소식':'국내 기사'}</span><b>${esc(article.author)}</b><time>${esc(relativeTime(article.published,article.publishedLabel))}</time>`;
  $('#readerTitle').textContent=article.title;
  $('#readerLead').textContent=article.summary||`${article.author}에서 보도한 ${SPORTS[state.sport].name} 관련 최신 기사입니다.`;
  $('#readerOriginal').href=article.link;
  $('#readerRelated').innerHTML=related.map(item=>`<a data-article="${esc(item.id)}" href="#article/${esc(item.id)}"><small>${esc(item.author)} · ${esc(relativeTime(item.published,item.publishedLabel))}</small><b>${esc(item.title)}</b><span>기사 보기 ›</span></a>`).join('');
  document.querySelectorAll('.page-section,.team-strip').forEach(el=>el.hidden=true); $('#articleReader').hidden=false; window.scrollTo({top:0,behavior:'smooth'});
}
function closeArticle(){ $('#articleReader').hidden=true; document.querySelectorAll('.page-section,.team-strip').forEach(el=>el.hidden=false); history.replaceState(null,'',`#${state.sport==='home'?'top':'news'}`); }

function applySportHeader(sport){ const c=SPORTS[sport]; document.body.dataset.theme=sport; $('#ribbonSport').textContent=c.label; $('#leagueMark').textContent=c.mark; $('#leagueCategory').textContent=c.category; $('#leagueName').textContent=c.name; $('#newsTitle').textContent=`오늘의 ${c.label} 뉴스`; $('#standingsTitle').textContent=sport==='f1'?'드라이버 챔피언십':sport==='home'?'종목별 현황':'리그 순위'; document.querySelectorAll('[data-sport]').forEach(b=>b.classList.toggle('active',b.dataset.sport===sport)); $('#todayLabel').textContent=dateLabel(state.date); $('#scheduleDate').textContent=dateLabel(state.date); renderKeywords(); }
async function getJson(url){ const r=await fetch(url),d=await r.json(); if(!r.ok)throw new Error(d.error||'데이터 요청 실패'); return d; }

async function loadOne(sport,request){
  const [schedule,news,standings]=await Promise.allSettled([getJson(`/api/sports/${sport}/schedule?date=${state.date}`),getJson(`/api/sports/${sport}/news`),getJson(`/api/sports/${sport}/standings?season=${state.date.slice(0,4)}`)]);
  if(request!==state.request)return;
  state.games=schedule.status==='fulfilled'?normalizeSchedule(schedule.value,sport):[];
  state.articles=news.status==='fulfilled'?news.value.articles||[]:[];
  renderGames(); renderNews(); renderStandings(standings.status==='fulfilled'?standings.value:{});
}
async function loadHome(request){
  const sports=['mlb','nba','epl','ucl','f1'];
  const results=await Promise.all(sports.map(async sport=>{const [s,n]=await Promise.allSettled([getJson(`/api/sports/${sport}/schedule?date=${state.date}`),getJson(`/api/sports/${sport}/news`)]); let games=s.status==='fulfilled'?normalizeSchedule(s.value,sport):[]; if(sport==='f1'){const pivot=new Date(`${state.date}T12:00:00+09:00`); games=games.filter(game=>Math.abs(new Date(game.date)-pivot)<10*864e5);} return {sport,games,articles:n.status==='fulfilled'?(n.value.articles||[]).slice(0,5):[]};}));
  if(request!==state.request)return;
  state.games=results.flatMap(r=>r.games).sort((a,b)=>new Date(a.date)-new Date(b.date)); state.articles=results.flatMap(r=>r.articles).sort((a,b)=>new Date(b.published)-new Date(a.published)); renderGames();renderNews();
  const counts=results.map(r=>({name:SPORTS[r.sport].name,record:`오늘 ${r.games.length}경기`,value:`뉴스 ${r.articles.length}`,logo:''})); state.standings=counts; $('#standingsList').innerHTML=counts.map((r,i)=>`<div class="standing-row"><em>${i+1}</em><i>${SPORTS[results[i].sport].mark.slice(0,1)}</i><span>${r.name}</span><small>${r.record}</small><b>${r.value}</b></div>`).join('');
}
async function loadSport(sport){ closeArticle(); state.sport=sport; state.filter='all'; state.request+=1; const request=state.request; applySportHeader(sport); document.querySelectorAll('[data-news-filter]').forEach(b=>b.classList.toggle('active',b.dataset.newsFilter==='all')); $('#scoreTicker').innerHTML='<i class="loading-bar"></i>'; $('#recommendedGames').innerHTML='<div class="empty">경기를 불러오는 중입니다.</div>'; $('#fullSchedule').innerHTML='<div class="empty tall">일정을 불러오는 중입니다.</div>'; $('#featuredStory').className='feature-story loading-card'; $('#featuredStory').innerHTML=''; $('#sideNews').innerHTML='<div class="empty">뉴스를 불러오는 중입니다.</div>'; $('#newsGrid').innerHTML=''; $('#standingsList').innerHTML='<div class="empty tall">순위를 불러오는 중입니다.</div>'; try{ sport==='home'?await loadHome(request):await loadOne(sport,request); }catch(error){toast(error.message);} }

function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2200);}
document.addEventListener('click',event=>{
  const article=event.target.closest('[data-article]'); if(article){event.preventDefault();openArticle(article.dataset.article);return;}
  const sport=event.target.closest('[data-sport]'); if(sport){loadSport(sport.dataset.sport);scrollTo({top:0,behavior:'smooth'});return;}
  const filter=event.target.closest('[data-news-filter]'); if(filter){state.filter=filter.dataset.newsFilter;document.querySelectorAll('[data-news-filter]').forEach(b=>b.classList.toggle('active',b===filter));renderNews();return;}
  const team=event.target.closest('[data-team]'); if(team){const id=team.dataset.team;state.favoriteTeams.has(id)?state.favoriteTeams.delete(id):state.favoriteTeams.add(id);localStorage.setItem('orangeFavoriteTeams',JSON.stringify([...state.favoriteTeams]));renderGames();toast('응원 팀 설정을 저장했습니다.');return;}
  const keyword=event.target.closest('[data-keyword]'); if(keyword){$('#searchInput').value=keyword.dataset.keyword;filterNews(keyword.dataset.keyword);location.hash='news';return;}
  if(event.target.closest('[data-coming]'))toast('Windows 앱 설정과 연결할 예정입니다.');
  if(event.target.closest('[data-game]'))toast('경기 상세·문자중계 화면과 연결할 예정입니다.');
});
function filterNews(keyword){document.querySelectorAll('.news-card,.side-news-row').forEach(card=>card.hidden=Boolean(keyword)&&!card.textContent.toLowerCase().includes(keyword.toLowerCase()));}
$('#searchInput').addEventListener('input',e=>filterNews(e.target.value.trim()));
$('#prevDate').addEventListener('click',()=>moveDate(-1)); $('#nextDate').addEventListener('click',()=>moveDate(1)); $('#dateButton').addEventListener('click',()=>{state.date=kstDateKey();loadSport(state.sport);});
$('#articleBack').addEventListener('click',()=>{closeArticle();window.scrollTo({top:0,behavior:'smooth'});});
$('#followLeague').addEventListener('click',e=>{e.currentTarget.classList.toggle('active');e.currentTarget.textContent=e.currentTarget.classList.contains('active')?'✓ 리그 팔로잉':'＋ 리그 팔로우';});
loadSport('home');
