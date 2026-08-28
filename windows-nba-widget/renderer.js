const TEAM_KO = {
  ATL:'애틀랜타',BOS:'보스턴',BKN:'브루클린',CHA:'샬럿',CHI:'시카고',CLE:'클리블랜드',DAL:'댈러스',DEN:'덴버',DET:'디트로이트',GS:'골든스테이트',GSW:'골든스테이트',HOU:'휴스턴',IND:'인디애나',LAC:'LA 클리퍼스',LAL:'LA 레이커스',MEM:'멤피스',MIA:'마이애미',MIL:'밀워키',MIN:'미네소타',NO:'뉴올리언스',NOP:'뉴올리언스',NY:'뉴욕 닉스',NYK:'뉴욕 닉스',OKC:'오클라호마시티',ORL:'올랜도',PHI:'필라델피아',PHX:'피닉스',POR:'포틀랜드',SA:'샌안토니오',SAS:'샌안토니오',SAC:'새크라멘토',TOR:'토론토',UTAH:'유타',UTA:'유타',WSH:'워싱턴',WAS:'워싱턴'
};

const NBA_TEAMS = [
  ['ATL','애틀랜타'],['BOS','보스턴'],['BKN','브루클린'],['CHA','샬럿'],['CHI','시카고'],['CLE','클리블랜드'],['DAL','댈러스'],['DEN','덴버'],['DET','디트로이트'],['GSW','골든스테이트'],['HOU','휴스턴'],['IND','인디애나'],['LAC','LA 클리퍼스'],['LAL','LA 레이커스'],['MEM','멤피스'],['MIA','마이애미'],['MIL','밀워키'],['MIN','미네소타'],['NOP','뉴올리언스'],['NYK','뉴욕 닉스'],['OKC','오클라호마시티'],['ORL','올랜도'],['PHI','필라델피아'],['PHX','피닉스'],['POR','포틀랜드'],['SAC','새크라멘토'],['SAS','샌안토니오'],['TOR','토론토'],['UTA','유타'],['WAS','워싱턴']
];

const state = {
  date: localDateKey(new Date()),
  events: [],
  selectedGameId: '',
  selectedPackage: null,
  settings: null,
  scoreboardTimer: null,
  commentaryTimer: null,
  monitorTimer: null,
  lastPlayIds: new Map(),
  fallback: false
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

function localDateKey(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function apiDate(key) { return key.replaceAll('-', ''); }

function koDate(key) {
  const today = localDateKey(new Date());
  const target = new Date(`${key}T00:00:00`);
  const label = key === today ? '오늘' : new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',weekday:'short'}).format(target);
  return { label, full: new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit'}).format(target) };
}

function shiftDate(days) {
  const date = new Date(`${state.date}T12:00:00`);
  date.setDate(date.getDate() + days);
  state.date = localDateKey(date);
  loadGames({ allowFallback:false });
}

function teamName(team = {}) {
  return TEAM_KO[team.abbreviation] || TEAM_KO[team.name] || team.shortDisplayName || team.displayName || team.name || '?';
}

function teamLogo(competitor = {}) {
  return competitor.team?.logo || competitor.team?.logos?.[0]?.href || '';
}

function recordText(competitor = {}) {
  return competitor.records?.find(row => row.type === 'total')?.summary || competitor.records?.[0]?.summary || '';
}

function periodLabel(period) {
  const num = Number(period) || 0;
  if (!num) return '경기';
  return num <= 4 ? `${num}쿼터` : `연장 ${num - 4}`;
}

function statusText(status = {}) {
  const type = status.type || {};
  if (type.state === 'in') return `${periodLabel(status.period)} ${status.displayClock || ''}`.trim();
  if (type.state === 'post') return type.shortDetail || '경기 종료';
  const dateText = type.shortDetail || type.detail;
  return dateText || '경기 예정';
}

function koreanPlay(text) {
  if (!text) return '경기 진행';
  let value = String(text)
    .replace(/(\d+)-foot/gi,'$1피트')
    .replace(/three point (jumper|shot|pullup jump shot|step back jumpshot|running pullup jump shot)/gi,'3점슛')
    .replace(/two point (jumper|shot)/gi,'2점슛')
    .replace(/driving floating jump shot/gi,'드라이빙 플로터')
    .replace(/running pullup jump shot/gi,'러닝 풀업 점프슛')
    .replace(/pullup jump shot/gi,'풀업 점프슛')
    .replace(/step back jumpshot/gi,'스텝백 점프슛')
    .replace(/jump shot/gi,'점프슛').replace(/driving layup/gi,'드라이빙 레이업')
    .replace(/finger roll layup/gi,'핑거롤 레이업').replace(/layup/gi,'레이업')
    .replace(/alley oop dunk shot/gi,'앨리웁 덩크').replace(/driving dunk/gi,'드라이빙 덩크')
    .replace(/dunk shot|dunk/gi,'덩크').replace(/free throw/gi,'자유투')
    .replace(/hook shot/gi,'훅슛').replace(/bank shot/gi,'뱅크슛')
    .replace(/Defensive rebound by (.+)/i,'$1 수비 리바운드')
    .replace(/Offensive rebound by (.+)/i,'$1 공격 리바운드')
    .replace(/Turnover by (.+)/i,'$1 턴오버').replace(/Steal by (.+)/i,'$1 스틸')
    .replace(/Block by (.+)/i,'$1 블록').replace(/Timeout (.+)/i,'$1 타임아웃')
    .replace(/ enters the game for /i,' 교체 투입 → ')
    .replace(/Personal foul by (.+)/i,'$1 개인 파울').replace(/Shooting foul by (.+)/i,'$1 슈팅 파울')
    .replace(/Loose ball foul by (.+)/i,'$1 루즈볼 파울').replace(/Offensive foul by (.+)/i,'$1 공격자 파울')
    .replace(/Technical foul by (.+)/i,'$1 테크니컬 파울').replace(/Jump Ball/i,'점프볼')
    .replace(/End of the (\d+)(st|nd|rd|th) Quarter/i,'$1쿼터 종료').replace(/End of Game/i,'경기 종료')
    .replace(/\(([^)]+) assists\)/gi,'($1 도움)');
  if (/ makes /i.test(value)) value = value.replace(/ makes /i,' ') + ' 성공';
  else if (/ misses /i.test(value)) value = value.replace(/ misses /i,' ') + ' 실패';
  return value;
}

async function fetchJson(url) {
  return window.nbaDesktop.fetchJson(url);
}

function showView(name) {
  $$('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.view === name));
  $$('.view').forEach(view => view.classList.toggle('active', view.id === `${name}View`));
}

function setGamesLoading(message = 'NBA 경기를 불러오는 중...') {
  $('#gamesStatus').hidden = false;
  $('#gamesStatus').innerHTML = `<span class="spinner"></span>${esc(message)}`;
  $('#gamesList').innerHTML = '';
}

function updateDateHeader() {
  const text = koDate(state.date);
  $('#dateTitle').textContent = text.label;
  $('#dateSub').textContent = text.full;
  $('#datePicker').value = state.date;
}

async function loadGames({ allowFallback = true, quiet = false } = {}) {
  clearTimeout(state.scoreboardTimer);
  updateDateHeader();
  if (!quiet) setGamesLoading();
  state.fallback = false;
  $('#fallbackBanner').hidden = true;
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${apiDate(state.date)}&limit=100`;
    const data = await fetchJson(url);
    let events = data?.events || [];
    if (!events.length && allowFallback && state.date === localDateKey(new Date())) {
      const now = new Date();
      const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
      const endYear = startYear + 1;
      const fallbackUrl = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${endYear}0401-${endYear}0701&limit=1000`;
      const fallback = await fetchJson(fallbackUrl);
      events = (fallback?.events || []).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 12);
      if (events.length) {
        state.fallback = true;
        $('#fallbackBanner').textContent = '현재 경기가 없어 최근 포스트시즌 경기를 보여드립니다.';
        $('#fallbackBanner').hidden = false;
      }
    }
    state.events = events;
    renderGames(events);
    monitorLiveGames();
    if (events.some(isLiveEvent)) state.scoreboardTimer = setTimeout(() => loadGames({allowFallback:false,quiet:true}), 20000);
  } catch (error) {
    $('#gamesStatus').hidden = false;
    $('#gamesStatus').innerHTML = `경기 정보를 불러오지 못했습니다.<br><small>${esc(error.message)}</small>`;
  }
}

function isLiveEvent(event) { return event?.status?.type?.state === 'in'; }

function renderGames(events) {
  $('#gamesStatus').hidden = events.length > 0;
  $('#gamesStatus').innerHTML = events.length ? '' : '선택한 날짜에 NBA 경기가 없습니다.';
  $('#liveDot').hidden = !events.some(isLiveEvent);
  $('#gamesList').innerHTML = events.map(event => {
    const comp = event.competitions?.[0] || {};
    const away = comp.competitors?.find(item => item.homeAway === 'away') || {};
    const home = comp.competitors?.find(item => item.homeAway === 'home') || {};
    const live = isLiveEvent(event);
    const started = event.status?.type?.state !== 'pre';
    const league = event.season?.slug === 'post-season' || event.season?.type === 3 ? '플레이오프' : '정규시즌';
    return `<article class="game-card ${live ? 'live' : ''}" data-game-id="${esc(event.id)}">
      <div class="game-meta"><span>${esc(league)}</span><b class="${live ? 'status-live' : ''}">${live ? '● LIVE · ' : ''}${esc(statusText(event.status))}</b></div>
      <div class="game-teams">
        <div class="team"><img src="${esc(teamLogo(away))}" alt=""><b>${esc(teamName(away.team))}</b><small>${esc(recordText(away))}</small></div>
        <div class="game-score"><strong>${started ? `${esc(away.score || 0)} : ${esc(home.score || 0)}` : 'VS'}</strong><span>${live ? '실시간' : (started ? '결과' : '예정')}</span></div>
        <div class="team"><img src="${esc(teamLogo(home))}" alt=""><b>${esc(teamName(home.team))}</b><small>${esc(recordText(home))}</small></div>
      </div><div class="game-footer">쿼터 스코어 · 선수 기록 · 전체 문자중계 보기 ›</div>
    </article>`;
  }).join('');
  $$('.game-card').forEach(card => card.addEventListener('click', () => openGame(card.dataset.gameId)));
}

async function openGame(gameId) {
  state.selectedGameId = String(gameId);
  showView('commentary');
  $('#commentaryEmpty').hidden = true;
  $('#commentaryContent').innerHTML = '<div class="loading"><span class="spinner"></span>전체 문자중계를 불러오는 중...</div>';
  await loadCommentary(true);
}

async function loadCommentary(showLoading = false) {
  clearTimeout(state.commentaryTimer);
  if (!state.selectedGameId) return;
  if (showLoading) $('#commentaryContent').innerHTML = '<div class="loading"><span class="spinner"></span>전체 문자중계를 불러오는 중...</div>';
  try {
    const data = await fetchJson(`https://cdn.espn.com/core/nba/playbyplay?xhr=1&gameId=${encodeURIComponent(state.selectedGameId)}`);
    if (String(state.selectedGameId) !== String(data?.gamepackageJSON?.header?.id || state.selectedGameId)) return;
    const pkg = data?.gamepackageJSON;
    if (!pkg) throw new Error('문자중계 데이터가 없습니다.');
    state.selectedPackage = pkg;
    renderCommentary(pkg);
    const live = pkg.header?.competitions?.[0]?.status?.type?.state === 'in';
    $('#commentaryBadge').hidden = !live;
    if (live) state.commentaryTimer = setTimeout(() => loadCommentary(false), 8000);
  } catch (error) {
    $('#commentaryContent').innerHTML = `<div class="loading">문자중계를 불러오지 못했습니다.<br><small>${esc(error.message)}</small></div>`;
  }
}

function packageTeams(pkg) {
  const comp = pkg?.header?.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const away = competitors.find(item => item.homeAway === 'away') || {};
  const home = competitors.find(item => item.homeAway === 'home') || {};
  const map = new Map();
  [away,home].forEach(item => map.set(String(item.team?.id || item.id || ''), {name:teamName(item.team),abbr:item.team?.abbreviation || '–',logo:teamLogo(item)}));
  return { comp, away, home, map };
}

function playRow(play, teamMap) {
  const team = teamMap.get(String(play.team?.id || ''));
  return `<div class="play-row ${play.scoringPlay ? 'scoring' : ''}"><span>${esc(play.clock?.displayValue || '')}</span><div class="play-team" title="${esc(team?.name || '공통 상황')}">${team?.logo ? `<img src="${esc(team.logo)}" alt="">` : ''}<b>${esc(team?.abbr || '–')}</b></div><p>${esc(koreanPlay(play.text || play.shortDescription))}</p><strong>${play.awayScore == null ? '' : `${esc(play.awayScore)} : ${esc(play.homeScore)}`}</strong></div>`;
}

function renderCommentary(pkg) {
  const { comp, away, home, map } = packageTeams(pkg);
  const plays = (pkg.plays || []).filter(play => play.text || play.shortDescription);
  const last = plays.at(-1) || {};
  const status = comp.status || {};
  const live = status.type?.state === 'in';
  const period = Number(status.period || last.period?.number || 0);
  const possession = comp.competitors?.find(item => item.possession);
  const situation = live ? `${periodLabel(period)} · ${status.displayClock || last.clock?.displayValue || ''}${possession ? ` · ${teamName(possession.team)} 공격` : ''}` : (status.type?.detail || status.type?.shortDetail || '경기 종료');
  const maxPeriod = Math.max(4,away.linescores?.length || 0,home.linescores?.length || 0,period);
  const periods = Array.from({length:maxPeriod},(_,i) => i + 1);
  const scoreRow = (team,name) => `<tr><th title="${esc(name)}">${esc(team.team?.abbreviation || name)}</th>${periods.map((num,i) => `<td class="${num === period ? 'current' : ''}">${esc(team.linescores?.[i]?.displayValue ?? '–')}</td>`).join('')}<td class="total">${esc(team.score ?? 0)}</td></tr>`;
  const linescore = `<div class="panel-block"><div class="block-title"><span>쿼터별 스코어</span><small>${live ? '실시간 반영' : '최종 기록'}</small></div><div class="linescore-wrap"><table class="linescore"><thead><tr><th>팀</th>${periods.map(num => `<th class="${num === period ? 'current' : ''}">${num <= 4 ? `Q${num}` : `OT${num-4}`}</th>`).join('')}<th>T</th></tr></thead><tbody>${scoreRow(away,teamName(away.team))}${scoreRow(home,teamName(home.team))}</tbody></table></div></div>`;
  const leaders = renderLeaders(pkg.boxscore?.players || []);
  const scoring = plays.filter(play => play.scoringPlay).slice(-10).reverse();
  const scoringHtml = scoring.length ? `<div class="panel-block scoring-list"><div class="block-title"><span>최근 득점</span><small>최근 ${scoring.length}개</small></div>${scoring.map(play => playRow(play,map)).join('')}</div>` : '';
  const groups = new Map();
  plays.forEach(play => { const number = Number(play.period?.number || 0); if(number){ if(!groups.has(number)) groups.set(number,[]); groups.get(number).push(play); } });
  const allPlays = [...groups.entries()].map(([number,rows]) => `<details class="period" ${number === period ? 'open' : ''}><summary><span>${periodLabel(number)}</span><small>${rows.length}개 플레이</small></summary>${rows.map(play => playRow(play,map)).join('')}</details>`).join('');
  $('#commentaryContent').innerHTML = `<div class="commentary-head"><div class="commentary-head-top"><span class="${live ? 'live' : ''}">${live ? '● LIVE' : 'NBA'} · ${esc(situation)}</span><button id="refreshCommentary">↻ 새로고침</button></div><div class="matchup"><div><img src="${esc(teamLogo(away))}" alt=""><b>${esc(teamName(away.team))}</b></div><div class="big-score"><strong>${esc(away.score ?? 0)} : ${esc(home.score ?? 0)}</strong><small>원정 · 홈</small></div><div><img src="${esc(teamLogo(home))}" alt=""><b>${esc(teamName(home.team))}</b></div></div></div>${linescore}${leaders}${scoringHtml}<div class="panel-block"><div class="block-title"><span>전체 문자중계</span><small>${plays.length}개 · ${live ? '8초 자동 갱신' : '쿼터별 펼치기'}</small></div>${allPlays || '<div class="loading">플레이 기록이 없습니다.</div>'}</div>`;
  $('#refreshCommentary').addEventListener('click', () => loadCommentary(true));
}

function renderLeaders(groups) {
  const cards = groups.map(group => {
    const stats = group.statistics?.[0];
    const labels = stats?.labels || [];
    const pts = labels.indexOf('PTS'), reb = labels.indexOf('REB'), ast = labels.indexOf('AST');
    if (pts < 0) return '';
    const athletes = (stats.athletes || []).filter(row => !row.didNotPlay && row.stats?.[pts] != null).sort((a,b) => Number(b.stats[pts])-Number(a.stats[pts])).slice(0,2);
    if (!athletes.length) return '';
    return `<div class="leader-team"><div class="leader-team-title"><img src="${esc(group.team?.logo || '')}" alt=""><b>${esc(teamName(group.team))}</b></div>${athletes.map(row => `<div class="leader-row">${row.athlete?.headshot?.href ? `<img src="${esc(row.athlete.headshot.href)}" alt="">` : ''}<span><b>${esc(row.athlete?.shortName || row.athlete?.displayName)}</b><small>${esc(row.stats[pts])}득점 · ${esc(row.stats[reb] ?? 0)}리바운드 · ${esc(row.stats[ast] ?? 0)}도움</small></span></div>`).join('')}</div>`;
  }).filter(Boolean).join('');
  return cards ? `<div class="panel-block"><div class="block-title"><span>주요 선수</span><small>팀별 득점 상위</small></div><div class="leader-grid">${cards}</div></div>` : '';
}

function eventIncludesFavorite(event) {
  const favorite = state.settings?.favoriteTeam;
  if (!favorite) return true;
  return event.competitions?.[0]?.competitors?.some(item => item.team?.abbreviation === favorite);
}

async function monitorLiveGames() {
  clearTimeout(state.monitorTimer);
  const liveEvents = state.events.filter(isLiveEvent).filter(eventIncludesFavorite);
  if (!state.settings?.notifications || !liveEvents.length) return;
  await Promise.allSettled(liveEvents.map(checkGameNotifications));
  state.monitorTimer = setTimeout(monitorLiveGames, 12000);
}

async function checkGameNotifications(event) {
  const data = await fetchJson(`https://cdn.espn.com/core/nba/playbyplay?xhr=1&gameId=${encodeURIComponent(event.id)}`);
  const pkg = data?.gamepackageJSON;
  const plays = (pkg?.plays || []).filter(play => play.id);
  if (!plays.length) return;
  const previousId = state.lastPlayIds.get(String(event.id));
  state.lastPlayIds.set(String(event.id), String(plays.at(-1).id));
  if (!previousId) return;
  const index = plays.findIndex(play => String(play.id) === previousId);
  const fresh = index >= 0 ? plays.slice(index + 1) : plays.slice(-1);
  const eligible = fresh.filter(play => state.settings.notificationLevel === 'all' || play.scoringPlay || /End of|Game End/i.test(play.text || ''));
  if (!eligible.length) return;
  const play = eligible.at(-1);
  const { away,home } = packageTeams(pkg);
  await window.nbaDesktop.showNotification({
    title:`${teamName(away.team)} ${play.awayScore ?? away.score ?? 0} : ${play.homeScore ?? home.score ?? 0} ${teamName(home.team)}`,
    body:`${periodLabel(play.period?.number)} ${play.clock?.displayValue || ''} · ${koreanPlay(play.text || play.shortDescription)}`,
    gameId:event.id,
    silent:!state.settings.sound
  });
}

function populateSettings() {
  $('#favoriteTeam').insertAdjacentHTML('beforeend', NBA_TEAMS.map(([code,name]) => `<option value="${code}">${name}</option>`).join(''));
  Object.entries(state.settings).forEach(([key,value]) => { const input = document.getElementById(key); if(!input)return; if(input.type === 'checkbox') input.checked = Boolean(value); else input.value = value; });
  $('#pinBtn').classList.toggle('on', state.settings.alwaysOnTop);
}

async function saveSettings() {
  state.settings = await window.nbaDesktop.saveSettings({
    alwaysOnTop:$('#alwaysOnTop').checked,
    autoLaunch:$('#autoLaunch').checked,
    notifications:$('#notifications').checked,
    notificationLevel:$('#notificationLevel').value,
    favoriteTeam:$('#favoriteTeam').value,
    sound:$('#sound').checked
  });
  $('#pinBtn').classList.toggle('on', state.settings.alwaysOnTop);
  monitorLiveGames();
}

async function init() {
  state.settings = await window.nbaDesktop.getSettings();
  populateSettings();
  updateDateHeader();
  $$('.tab').forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));
  $('#prevDate').addEventListener('click', () => shiftDate(-1));
  $('#nextDate').addEventListener('click', () => shiftDate(1));
  $('#refreshGames').addEventListener('click', () => loadGames({allowFallback:true}));
  $('#dateButton').addEventListener('click', () => $('#datePicker').showPicker());
  $('#datePicker').addEventListener('change', event => { if(event.target.value){ state.date=event.target.value; loadGames({allowFallback:false}); } });
  $('#backToGames').addEventListener('click', () => showView('games'));
  $('#minBtn').addEventListener('click', () => window.nbaDesktop.minimize());
  $('#closeBtn').addEventListener('click', () => window.nbaDesktop.hide());
  $('#pinBtn').addEventListener('click', async () => { const value=await window.nbaDesktop.setAlwaysOnTop(!state.settings.alwaysOnTop); state.settings.alwaysOnTop=value; $('#alwaysOnTop').checked=value; $('#pinBtn').classList.toggle('on',value); });
  $('#moveBottomRight').addEventListener('click', () => window.nbaDesktop.moveBottomRight());
  $$('#settingsView input, #settingsView select').forEach(input => input.addEventListener('change', saveSettings));
  $('#testNotification').addEventListener('click', () => window.nbaDesktop.showNotification({title:'NBA LIVE · 알림 테스트',body:'4쿼터 01:24 · 응원 팀이 3점슛을 성공했습니다. 108 : 106',silent:!$('#sound').checked}));
  window.nbaDesktop.onFocusGame(gameId => openGame(gameId));
  window.nbaDesktop.onSettingsChanged(settings => {
    state.settings = settings;
    $('#alwaysOnTop').checked = settings.alwaysOnTop;
    $('#pinBtn').classList.toggle('on', settings.alwaysOnTop);
  });
  await loadGames({allowFallback:true});
}

init();
