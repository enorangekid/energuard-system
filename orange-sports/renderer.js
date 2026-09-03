const TEAM_KO = {
  ATL:'애틀랜타',BOS:'보스턴',BKN:'브루클린',CHA:'샬럿',CHI:'시카고',CLE:'클리블랜드',DAL:'댈러스',DEN:'덴버',DET:'디트로이트',GS:'골든스테이트',GSW:'골든스테이트',HOU:'휴스턴',IND:'인디애나',LAC:'LA 클리퍼스',LAL:'LA 레이커스',MEM:'멤피스',MIA:'마이애미',MIL:'밀워키',MIN:'미네소타',NO:'뉴올리언스',NOP:'뉴올리언스',NY:'뉴욕 닉스',NYK:'뉴욕 닉스',OKC:'오클라호마시티',ORL:'올랜도',PHI:'필라델피아',PHX:'피닉스',POR:'포틀랜드',SA:'샌안토니오',SAS:'샌안토니오',SAC:'새크라멘토',TOR:'토론토',UTAH:'유타',UTA:'유타',WSH:'워싱턴',WAS:'워싱턴'
};

const NBA_TEAMS = [
  ['ATL','애틀랜타'],['BOS','보스턴'],['BKN','브루클린'],['CHA','샬럿'],['CHI','시카고'],['CLE','클리블랜드'],['DAL','댈러스'],['DEN','덴버'],['DET','디트로이트'],['GSW','골든스테이트'],['HOU','휴스턴'],['IND','인디애나'],['LAC','LA 클리퍼스'],['LAL','LA 레이커스'],['MEM','멤피스'],['MIA','마이애미'],['MIL','밀워키'],['MIN','미네소타'],['NOP','뉴올리언스'],['NYK','뉴욕 닉스'],['OKC','오클라호마시티'],['ORL','올랜도'],['PHI','필라델피아'],['PHX','피닉스'],['POR','포틀랜드'],['SAC','새크라멘토'],['SAS','샌안토니오'],['TOR','토론토'],['UTA','유타'],['WAS','워싱턴']
];

const MLB_TEAM_KO = {
  'Arizona Diamondbacks':'애리조나','Athletics':'애슬레틱스','Atlanta Braves':'애틀랜타','Baltimore Orioles':'볼티모어','Boston Red Sox':'보스턴 레드삭스','Chicago Cubs':'시카고 컵스','Chicago White Sox':'시카고 화이트삭스','Cincinnati Reds':'신시내티','Cleveland Guardians':'클리블랜드','Colorado Rockies':'콜로라도','Detroit Tigers':'디트로이트 타이거스','Houston Astros':'휴스턴','Kansas City Royals':'캔자스시티','Los Angeles Angels':'LA 에인절스','Los Angeles Dodgers':'LA 다저스','Miami Marlins':'마이애미 말린스','Milwaukee Brewers':'밀워키','Minnesota Twins':'미네소타','New York Mets':'뉴욕 메츠','New York Yankees':'뉴욕 양키스','Philadelphia Phillies':'필라델피아','Pittsburgh Pirates':'피츠버그','San Diego Padres':'샌디에이고','San Francisco Giants':'SF 자이언츠','Seattle Mariners':'시애틀','St. Louis Cardinals':'세인트루이스','Tampa Bay Rays':'탬파베이','Texas Rangers':'텍사스','Toronto Blue Jays':'토론토','Washington Nationals':'워싱턴'
};

const MLB_TEAMS = [[109,'애리조나'],[133,'애슬레틱스'],[144,'애틀랜타'],[110,'볼티모어'],[111,'보스턴 레드삭스'],[112,'시카고 컵스'],[145,'시카고 화이트삭스'],[113,'신시내티'],[114,'클리블랜드'],[115,'콜로라도'],[116,'디트로이트 타이거스'],[117,'휴스턴'],[118,'캔자스시티'],[108,'LA 에인절스'],[119,'LA 다저스'],[146,'마이애미 말린스'],[158,'밀워키'],[142,'미네소타'],[121,'뉴욕 메츠'],[147,'뉴욕 양키스'],[143,'필라델피아'],[134,'피츠버그'],[135,'샌디에이고'],[137,'SF 자이언츠'],[136,'시애틀'],[138,'세인트루이스'],[139,'탬파베이'],[140,'텍사스'],[141,'토론토'],[120,'워싱턴']];

const SOCCER_KO = {
  'Arsenal':'아스널','Aston Villa':'아스톤 빌라','Bournemouth':'본머스','Brentford':'브렌트포드','Brighton & Hove Albion':'브라이튼','Burnley':'번리','Chelsea':'첼시','Crystal Palace':'크리스탈 팰리스','Everton':'에버턴','Fulham':'풀럼','Leeds United':'리즈','Liverpool':'리버풀','Manchester City':'맨시티','Manchester United':'맨유','Newcastle United':'뉴캐슬','Nottingham Forest':'노팅엄','Sunderland':'선덜랜드','Tottenham Hotspur':'토트넘','West Ham United':'웨스트햄','Wolverhampton Wanderers':'울버햄튼','Real Madrid':'레알 마드리드','Barcelona':'바르셀로나','Bayern Munich':'바이에른 뮌헨','Paris Saint-Germain':'PSG','Internazionale':'인테르','Inter Milan':'인테르','Juventus':'유벤투스','AC Milan':'AC 밀란','Atletico Madrid':'아틀레티코','Borussia Dortmund':'도르트문트','Bayer Leverkusen':'레버쿠젠','Benfica':'벤피카','Sporting CP':'스포르팅 CP','PSV Eindhoven':'PSV','Feyenoord':'페예노르트','Ajax Amsterdam':'아약스','Ajax':'아약스','Napoli':'나폴리','Atalanta':'아탈란타','AS Monaco':'AS 모나코','Marseille':'마르세유','Lille':'릴','Olympiacos':'올림피아코스','Galatasaray':'갈라타사라이','Club Brugge':'클뤼프 브뤼허','Celtic':'셀틱','Rangers':'레인저스','FC Porto':'FC 포르투','Shakhtar Donetsk':'샤흐타르','Red Bull Salzburg':'잘츠부르크'
};

const SOCCER_ENDPOINTS = { epl:'eng.1', ucl:'uefa.champions' };
const NOTIFICATION_SPORTS = ['nba','mlb','epl','ucl'];
const NBA_ABBR_ALIASES = { GSW:'GS', NOP:'NO', NYK:'NY', SAS:'SA', UTA:'UTAH', WAS:'WSH' };

const F1_COUNTRY_KO = {
  Australia:'호주',China:'중국',Japan:'일본',Bahrain:'바레인','Saudi Arabia':'사우디아라비아',
  'United States':'미국',Canada:'캐나다',Monaco:'모나코',Spain:'스페인',Austria:'오스트리아',
  'United Kingdom':'영국',Belgium:'벨기에',Hungary:'헝가리',Netherlands:'네덜란드',Italy:'이탈리아',
  Azerbaijan:'아제르바이잔',Singapore:'싱가포르',Mexico:'멕시코',Brazil:'브라질',Qatar:'카타르',
  'United Arab Emirates':'아부다비'
};

const F1_SESSION_KO = {
  'Practice 1':'연습 주행 1','Practice 2':'연습 주행 2','Practice 3':'연습 주행 3',
  Qualifying:'예선','Sprint Qualifying':'스프린트 예선','Sprint Shootout':'스프린트 슛아웃',
  Sprint:'스프린트',Race:'결승','Day 1':'테스트 1일차','Day 2':'테스트 2일차','Day 3':'테스트 3일차'
};

const F1_TEAM_KO = {
  McLaren:'맥라렌',Ferrari:'페라리',Mercedes:'메르세데스','Red Bull Racing':'레드불 레이싱',
  'Aston Martin':'애스턴마틴',Alpine:'알핀',Williams:'윌리엄스','Racing Bulls':'레이싱 불스',
  'Kick Sauber':'킥 자우버',Haas:'하스',Audi:'아우디',Cadillac:'캐딜락'
};

const state = {
  sport: 'nba',
  date: localDateKey(new Date()),
  events: [],
  selectedGameId: '',
  selectedSoccerLeague: '',
  selectedPackage: null,
  settings: null,
  scoreboardTimer: null,
  commentaryTimer: null,
  monitorTimer: null,
  monitorInFlight: false,
  lastPlayIds: new Map(),
  periodStates: new Map(),
  mlbRosters: new Map(),
  fallback: false,
  table: {
    view: { nba: 'standings', mlb: 'standings', epl: 'standings', ucl: 'standings', f1: 'drivers' },
    mlbLeague: 'al',
    season: {},
    expanded: new Set(),
    playoffExpanded: new Set(),
    cache: {},
    loadReq: 0
  },
  f1: { calendars: {}, details: {}, requestQueue:Promise.resolve(), requestTimes:[], lastRequestAt:0 }
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

function localDateKey(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function dateKeyInTimeZone(value, timeZone = 'Asia/Seoul') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const get = type => parts.find(part => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function offsetDateKey(key, days) {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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

function mlbTeamName(team = {}) {
  return MLB_TEAM_KO[team.name] || team.name || '?';
}

function soccerTeamName(team = {}) {
  return SOCCER_KO[team.displayName] || SOCCER_KO[team.name] || SOCCER_KO[team.shortDisplayName] || team.shortDisplayName || team.displayName || team.name || '?';
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
  if (name === 'table') enterTableView();
}

function setGamesLoading(message = 'NBA 경기를 불러오는 중...') {
  $('#gamesStatus').hidden = false;
  $('#gamesStatus').innerHTML = `<span class="spinner"></span>${esc(message)}`;
  $('#gamesList').innerHTML = '';
}

function updateDateHeader() {
  const target = new Date(`${state.date}T12:00:00`);
  $('#dateTitle').textContent = `${target.getFullYear()}.${String(target.getMonth() + 1).padStart(2, '0')}`;
  $('#dateSub').textContent = `${target.getMonth() + 1}월 ${target.getDate()}일`;
  $('#datePicker').value = state.date;
  renderDateStrip();
}

function renderDateStrip() {
  const today = localDateKey(new Date());
  const selected = new Date(`${state.date}T12:00:00`);
  const dayNames = ['일','월','화','수','목','금','토'];
  $('#dateStrip').innerHTML = Array.from({length:7}, (_, index) => {
    const date = new Date(selected);
    date.setDate(selected.getDate() + index - 3);
    const key = localDateKey(date);
    const isToday = key === today;
    const isSelected = key === state.date;
    return `<button class="date-chip ${isSelected ? 'active' : ''} ${isToday ? 'today' : ''}" data-date="${key}"${isSelected ? ' aria-current="date"' : ''}><small>${isToday ? '오늘' : dayNames[date.getDay()]}</small><b>${date.getDate()}</b></button>`;
  }).join('');
  $$('.date-chip').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.date === state.date) return;
    state.date = button.dataset.date;
    loadGames({allowFallback:state.date === today});
  }));
}

function scheduleTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '--:--' : new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',hour12:false}).format(date);
}

function scheduleBoard(sport, title, rows, count) {
  if (!rows) return '';
  return `<section class="schedule-board" data-league="${sport}"><header class="schedule-board-head"><span class="league-symbol">${sport.toUpperCase()}</span><div><b>${esc(title)}</b><small>${count}${sport === 'f1' ? '세션' : '경기'}</small></div><span class="board-arrow">›</span></header><div class="schedule-board-body">${rows}</div></section>`;
}

function scheduleRow({ classes = '', attrs = '', time = '', phase = '', sub = '', awayName = '', awayLogo = '', awayRecord = '', homeName = '', homeLogo = '', homeRecord = '', awayScore = '', homeScore = '', started = false, live = false, selectable = true, gameId = '' }) {
  const score = started ? `<em>${esc(awayScore)}</em><i>:</i><em>${esc(homeScore)}</em>` : '<span class="versus">VS</span>';
  const alertSelected = live && isGameAlertSelected(gameId);
  const action = live && gameId
    ? `<button type="button" class="game-alert-toggle ${alertSelected ? 'active' : ''}" data-alert-game-id="${esc(gameId)}" aria-pressed="${alertSelected}" title="${alertSelected ? '이 경기 알림 끄기' : '이 경기 알림 받기'}">${alertSelected ? '알림 중' : '알림'}</button>`
    : `<span class="game-action ${selectable ? '' : 'muted'}">${selectable ? '기록' : '예정'}</span>`;
  return `<article class="game-card schedule-row ${classes} ${live ? 'live' : ''} ${selectable ? '' : 'disabled'}" ${attrs}>
    <div class="game-kickoff"><b class="${live ? 'status-live' : ''}">${live ? 'LIVE' : esc(time)}</b><small>${esc(sub)}</small></div>
    <div class="schedule-match"><div class="schedule-team away"><span><b>${esc(awayName)}</b><small>${esc(awayRecord)}</small></span><img src="${esc(awayLogo)}" alt=""></div><div class="game-score"><strong>${score}</strong><span>${esc(phase)}</span></div><div class="schedule-team home"><img src="${esc(homeLogo)}" alt=""><span><b>${esc(homeName)}</b><small>${esc(homeRecord)}</small></span></div></div>
    ${action}
  </article>`;
}

async function loadGames(options = {}) {
  if (state.sport === 'mlb') return loadMlbGames(options);
  if (state.sport === 'epl' || state.sport === 'ucl') return loadSoccerGames(options);
  if (state.sport === 'f1') return loadF1Games(options);
  return loadNbaGames(options);
}

async function loadNbaGames({ allowFallback = true, quiet = false } = {}) {
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
    syncFavoriteSelect();
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
  const rows = events.map(event => {
    const comp = event.competitions?.[0] || {};
    const away = comp.competitors?.find(item => item.homeAway === 'away') || {};
    const home = comp.competitors?.find(item => item.homeAway === 'home') || {};
    const live = isLiveEvent(event);
    const started = event.status?.type?.state !== 'pre';
    const league = event.season?.slug === 'post-season' || event.season?.type === 3 ? '플레이오프' : '정규시즌';
    return scheduleRow({attrs:`data-game-id="${esc(event.id)}"`,gameId:event.id,time:scheduleTime(event.date),phase:live ? statusText(event.status) : (started ? '종료' : '경기 전'),sub:league,awayName:teamName(away.team),awayLogo:teamLogo(away),awayRecord:recordText(away),homeName:teamName(home.team),homeLogo:teamLogo(home),homeRecord:recordText(home),awayScore:away.score || 0,homeScore:home.score || 0,started,live});
  }).join('');
  $('#gamesList').innerHTML = scheduleBoard('nba','NBA',rows,events.length);
  bindGameAlertButtons();
  $$('.game-card[data-game-id]').forEach(card => card.addEventListener('click', () => openGame(card.dataset.gameId)));
}

function isMlbLive(game) {
  return game?.status?.abstractGameState === 'Live' || ['I','M'].includes(game?.status?.codedGameState);
}

function mlbStatusText(game) {
  if (isMlbLive(game)) {
    const inning = game.linescore?.currentInningOrdinal || `${game.linescore?.currentInning || ''}회`;
    const half = game.linescore?.inningHalf === 'Top' ? '초' : game.linescore?.inningHalf === 'Bottom' ? '말' : '';
    return `${inning} ${half}`.trim();
  }
  return game.status?.detailedState || game.status?.abstractGameState || '경기 예정';
}

function mlbRecord(side = {}) {
  const record = side.leagueRecord;
  return record?.wins != null ? `${record.wins}-${record.losses}` : '';
}

function mlbTeamLogo(side = {}) {
  return side.team?.id ? `https://www.mlbstatic.com/team-logos/${side.team.id}.svg` : '';
}

async function loadMlbGames({ quiet = false } = {}) {
  clearTimeout(state.scoreboardTimer);
  clearTimeout(state.monitorTimer);
  updateDateHeader();
  state.fallback = false;
  $('#fallbackBanner').hidden = true;
  if (!quiet) setGamesLoading('MLB 경기를 불러오는 중...');
  const selectedDate = state.date;
  const mlbStartDate = offsetDateKey(selectedDate, -1);
  try {
    const data = await fetchJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${mlbStartDate}&endDate=${selectedDate}&hydrate=linescore,team`);
    if (state.sport !== 'mlb' || state.date !== selectedDate) return;
    const games = (data?.dates || [])
      .flatMap(day => day.games || [])
      .filter(game => dateKeyInTimeZone(game.gameDate) === selectedDate)
      .sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));
    state.events = games;
    renderMlbGames(games);
    syncFavoriteSelect();
    monitorLiveGames();
    if (games.some(isMlbLive)) state.scoreboardTimer = setTimeout(() => loadGames({quiet:true}), 20000);
  } catch (error) {
    if (state.sport !== 'mlb' || state.date !== selectedDate) return;
    $('#gamesStatus').hidden = false;
    $('#gamesStatus').innerHTML = `MLB 경기 정보를 불러오지 못했습니다.<br><small>${esc(error.message)}</small>`;
  }
}

function renderMlbGames(games) {
  $('#gamesStatus').hidden = games.length > 0;
  $('#gamesStatus').innerHTML = games.length ? '' : '선택한 날짜에 MLB 경기가 없습니다.';
  $('#liveDot').hidden = !games.some(isMlbLive);
  const rows = games.map(game => {
    const away = game.teams?.away || {};
    const home = game.teams?.home || {};
    const live = isMlbLive(game);
    const started = game.status?.abstractGameState !== 'Preview';
    const gameNumber = game.doubleHeader && game.doubleHeader !== 'N' ? ` · 더블헤더 ${game.gameNumber || ''}차전` : '';
    const selectable = started && game.gamePk;
    return scheduleRow({classes:'mlb-game-card',attrs:selectable ? `data-game-pk="${esc(game.gamePk)}"` : '',gameId:game.gamePk,time:scheduleTime(game.gameDate),phase:live ? mlbStatusText(game) : (started ? '종료' : '경기 전'),sub:`MLB${gameNumber}`,awayName:mlbTeamName(away.team),awayLogo:mlbTeamLogo(away),awayRecord:mlbRecord(away),homeName:mlbTeamName(home.team),homeLogo:mlbTeamLogo(home),homeRecord:mlbRecord(home),awayScore:away.score ?? 0,homeScore:home.score ?? 0,started,live,selectable});
  }).join('');
  $('#gamesList').innerHTML = scheduleBoard('mlb','메이저리그',rows,games.length);
  bindGameAlertButtons();
  $$('.mlb-game-card[data-game-pk]').forEach(card => card.addEventListener('click', () => openMlbGame(card.dataset.gamePk)));
}

function mlbKoreanEvent(play) {
  const labels = {
    single:'안타',double:'2루타',triple:'3루타',home_run:'홈런',walk:'볼넷',intent_walk:'고의4구',hit_by_pitch:'몸에 맞는 공',strikeout:'삼진',field_out:'범타',force_out:'포스 아웃',field_error:'실책 출루',sacrifice_fly:'희생플라이',sac_fly:'희생플라이',sacrifice_bunt:'희생번트',sac_bunt:'희생번트',double_play:'병살타',grounded_into_double_play:'병살타',fielders_choice:'야수 선택',catcher_interf:'포수 방해',stolen_base:'도루',wild_pitch:'폭투',passed_ball:'포일',balk:'보크',runner_out:'주자 아웃',caught_stealing_2b:'2루 도루 실패',caught_stealing_3b:'3루 도루 실패',caught_stealing_home:'홈 도루 실패',pickoff_1b:'1루 견제 아웃',pickoff_2b:'2루 견제 아웃',pickoff_3b:'3루 견제 아웃',pitching_substitution:'투수 교체',offensive_substitution:'대타·대주자 교체',defensive_substitution:'수비 교체'
  };
  return labels[play?.result?.eventType] || play?.result?.event || '경기 진행';
}

function mlbKoreanPitch(description) {
  return ({'Ball':'볼','Called Strike':'스트라이크','Swinging Strike':'헛스윙','Swinging Strike (Blocked)':'헛스윙','Foul':'파울','Foul Tip':'파울팁','In play, out(s)':'타격 · 아웃','In play, no out':'타격 · 출루','In play, run(s)':'타격 · 득점','Hit By Pitch':'몸에 맞는 공'})[description] || description || '투구';
}

function mlbKoreanPitchType(description) {
  return ({'Four-Seam Fastball':'포심','Two-Seam Fastball':'투심','Fastball':'직구','Sinker':'싱커','Cutter':'커터','Slider':'슬라이더','Sweeper':'스위퍼','Curveball':'커브','Knuckle Curve':'너클커브','Changeup':'체인지업','Split-Finger':'스플리터','Splitter':'스플리터','Knuckleball':'너클볼'})[description] || description || '';
}

function mlbPlayActor(play) {
  const type = play?.result?.eventType || '';
  if (type.includes('stolen') || type.startsWith('pickoff') || type === 'runner_out') {
    const runner = [...(play.runners || [])].reverse().find(item => item.details?.runner?.fullName);
    if (runner) return runner.details.runner.fullName;
  }
  if (type === 'pitching_substitution') return play?.matchup?.pitcher?.fullName || '';
  return play?.matchup?.batter?.fullName || '';
}

function mlbHeadshot(person = {}) {
  return person.id ? `https://img.mlbstatic.com/mlb-photos/image/upload/w_96,q_auto:best/v1/people/${person.id}/headshot/67/current` : '';
}

async function openMlbGame(gamePk) {
  state.selectedGameId = String(gamePk);
  showView('commentary');
  $('#commentaryEmpty').hidden = true;
  $('#commentaryContent').innerHTML = '<div class="loading"><span class="spinner"></span>MLB 전체 문자중계를 불러오는 중...</div>';
  await loadMlbCommentary(true);
}

async function loadMlbCommentary(showLoading = false) {
  clearTimeout(state.commentaryTimer);
  if (state.sport !== 'mlb' || !state.selectedGameId) return;
  const requestedGame = state.selectedGameId;
  if (showLoading) $('#commentaryContent').innerHTML = '<div class="loading"><span class="spinner"></span>MLB 전체 문자중계를 불러오는 중...</div>';
  try {
    const feed = await fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${encodeURIComponent(requestedGame)}/feed/live`);
    if (state.sport !== 'mlb' || state.selectedGameId !== requestedGame) return;
    const awayTeamId = feed?.gameData?.teams?.away?.id;
    const homeTeamId = feed?.gameData?.teams?.home?.id;
    const [awayInjuries, homeInjuries] = await Promise.all([
      fetchMlbInjuries(awayTeamId),
      fetchMlbInjuries(homeTeamId)
    ]);
    if (state.sport !== 'mlb' || state.selectedGameId !== requestedGame) return;
    renderMlbCommentary(feed, { away: awayInjuries, home: homeInjuries });
    const live = feed?.gameData?.status?.abstractGameState === 'Live';
    $('#commentaryBadge').hidden = !live;
    if (live) state.commentaryTimer = setTimeout(() => loadMlbCommentary(false), 12000);
  } catch (error) {
    $('#commentaryContent').innerHTML = `<div class="loading">MLB 문자중계를 불러오지 못했습니다.<br><small>${esc(error.message)}</small></div>`;
  }
}

async function fetchMlbInjuries(teamId) {
  if (!teamId) return [];
  const key = String(teamId);
  const cached = state.mlbRosters.get(key);
  if (cached && Date.now() - cached.savedAt < 10 * 60 * 1000) return cached.rows;
  try {
    const data = await fetchJson(`https://statsapi.mlb.com/api/v1/teams/${encodeURIComponent(teamId)}/roster?rosterType=40Man&hydrate=person`);
    const rows = (data?.roster || []).filter(row => /^D(?:10|15|60)$/i.test(row?.status?.code || '') || /injured/i.test(row?.status?.description || ''));
    state.mlbRosters.set(key, { savedAt: Date.now(), rows });
    return rows;
  } catch (_) {
    return cached?.rows || [];
  }
}

function mlbBoxPlayers(box = {}) {
  return Object.values(box.players || {});
}

function mlbStatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function mlbPlayerTable(team, box = {}) {
  const players = mlbBoxPlayers(box);
  const batters = players.filter(player => player.battingOrder || mlbStatNumber(player.stats?.batting?.plateAppearances) > 0);
  const pitchers = players.filter(player => player.stats?.pitching?.inningsPitched != null && (mlbStatNumber(player.stats?.pitching?.numberOfPitches) > 0 || mlbStatNumber(player.stats?.pitching?.outs) > 0));
  const battingRows = batters.map(player => {
    const game = player.stats?.batting || {};
    const season = player.seasonStats?.batting || {};
    return `<tr><td class="mlb-player-name">${esc(player.person?.fullName || '-')}<small>${esc(player.position?.abbreviation || '')}</small></td><td>${esc(game.atBats ?? 0)}</td><td>${esc(game.runs ?? 0)}</td><td>${esc(game.hits ?? 0)}</td><td>${esc(game.homeRuns ?? 0)}</td><td>${esc(game.rbi ?? 0)}</td><td>${esc(game.baseOnBalls ?? 0)}</td><td>${esc(game.strikeOuts ?? 0)}</td><td>${esc(season.avg || '-')}</td><td>${esc(season.obp || '-')}</td></tr>`;
  }).join('');
  const pitchingRows = pitchers.map(player => {
    const game = player.stats?.pitching || {};
    const season = player.seasonStats?.pitching || {};
    return `<tr><td class="mlb-player-name">${esc(player.person?.fullName || '-')}<small>${esc(player.position?.abbreviation || 'P')}</small></td><td>${esc(game.inningsPitched ?? '0.0')}</td><td>${esc(game.hits ?? 0)}</td><td>${esc(game.runs ?? 0)}</td><td>${esc(game.earnedRuns ?? 0)}</td><td>${esc(game.baseOnBalls ?? 0)}</td><td>${esc(game.strikeOuts ?? 0)}</td><td>${esc(game.homeRuns ?? 0)}</td><td>${esc(game.numberOfPitches ?? 0)}</td><td>${esc(season.era || '-')}</td></tr>`;
  }).join('');
  const logo = team?.id ? `https://www.mlbstatic.com/team-logos/${team.id}.svg` : '';
  return `<section class="mlb-box-team"><h3><img src="${esc(logo)}" alt="">${esc(mlbTeamName(team))}</h3><h4>타자</h4><div class="mlb-table-scroll"><table class="mlb-player-table"><thead><tr><th>선수</th><th>타수</th><th>득점</th><th>안타</th><th>홈런</th><th>타점</th><th>볼넷</th><th>삼진</th><th>AVG</th><th>OBP</th></tr></thead><tbody>${battingRows || '<tr><td colspan="10">타자 기록이 없습니다.</td></tr>'}</tbody></table></div><h4>투수</h4><div class="mlb-table-scroll"><table class="mlb-player-table"><thead><tr><th>선수</th><th>이닝</th><th>피안타</th><th>실점</th><th>자책</th><th>볼넷</th><th>삼진</th><th>피홈런</th><th>투구</th><th>ERA</th></tr></thead><tbody>${pitchingRows || '<tr><td colspan="10">투수 기록이 없습니다.</td></tr>'}</tbody></table></div></section>`;
}

function mlbLeaderCard(label, statKey, players, teamsById) {
  const leaders = players.map(player => ({ player, value: mlbStatNumber(player.stats?.batting?.[statKey]) })).filter(row => row.value > 0).sort((a,b) => b.value - a.value).slice(0, 2);
  return `<div class="mlb-leader-column"><h4>${esc(label)}</h4>${leaders.length ? leaders.map(({player,value}) => { const team = teamsById.get(Number(player.parentTeamId)) || {}; return `<div class="mlb-leader"><img class="team-mark" src="${esc(team.id ? `https://www.mlbstatic.com/team-logos/${team.id}.svg` : '')}" alt=""><img class="face" src="${esc(mlbHeadshot(player.person))}" alt=""><span><b>${esc(player.person?.fullName || '-')}</b><small>${esc(mlbTeamName(team))}</small></span><strong>${esc(value)}</strong></div>`; }).join('') : '<p class="mlb-empty-copy">기록 없음</p>'}</div>`;
}

function mlbInjuryTeam(team, rows = []) {
  const logo = team?.id ? `https://www.mlbstatic.com/team-logos/${team.id}.svg` : '';
  return `<section class="mlb-injury-team"><h3><img src="${esc(logo)}" alt="">${esc(mlbTeamName(team))}</h3>${rows.length ? rows.map(row => `<div class="mlb-injury-row"><img src="${esc(mlbHeadshot(row.person))}" alt=""><span><b>${esc(row.person?.fullName || '-')}</b><small>${esc(row.position?.name || row.position?.abbreviation || '')}</small></span><strong><i></i>${esc(row.status?.description || row.status?.code || '부상자 명단')}</strong></div>`).join('') : '<p class="mlb-empty-copy">40인 로스터 기준 부상자 명단 없음</p>'}</section>`;
}

function renderMlbCommentary(feed, injuries = { away: [], home: [] }) {
  const game = feed?.gameData || {};
  const live = feed?.liveData || {};
  const linescore = live.linescore || {};
  const current = live.plays?.currentPlay || {};
  const plays = live.plays?.allPlays || [];
  const isLive = game.status?.abstractGameState === 'Live';
  const away = game.teams?.away || {};
  const home = game.teams?.home || {};
  const awayName = mlbTeamName(away), homeName = mlbTeamName(home);
  const awayLogo = away.id ? `https://www.mlbstatic.com/team-logos/${away.id}.svg` : '';
  const homeLogo = home.id ? `https://www.mlbstatic.com/team-logos/${home.id}.svg` : '';
  const awayBox = live.boxscore?.teams?.away || {};
  const homeBox = live.boxscore?.teams?.home || {};
  const awayRuns = linescore.teams?.away?.runs ?? current.result?.awayScore ?? 0;
  const homeRuns = linescore.teams?.home?.runs ?? current.result?.homeScore ?? 0;
  const awayRecord = away.record?.wins != null ? `${away.record.wins}-${away.record.losses}` : '';
  const homeRecord = home.record?.wins != null ? `${home.record.wins}-${home.record.losses}` : '';
  const inning = Number(linescore.currentInning || current.about?.inning || 0);
  const top = linescore.inningHalf === 'Top' || current.about?.halfInning === 'top';
  const stateText = inning ? `${inning}회 ${top ? '초' : '말'}` : (game.status?.detailedState || '경기 기록');
  const batter = current.matchup?.batter || {};
  const pitcher = current.matchup?.pitcher || {};
  const count = current.count || {};
  const offense = linescore.offense || {};
  const maxInning = Math.max(9,...(linescore.innings || []).map(row => Number(row.num) || 0));
  const inningNumbers = Array.from({length:maxInning},(_,index) => index + 1);
  const inningMap = new Map((linescore.innings || []).map(row => [Number(row.num),row]));
  const lineRow = (side,abbr) => `<tr><th>${esc(abbr)}</th>${inningNumbers.map(number => `<td class="${number === inning ? 'current' : ''}">${esc(inningMap.get(number)?.[side]?.runs ?? '–')}</td>`).join('')}<td class="total">${esc(linescore.teams?.[side]?.runs ?? 0)}</td><td>${esc(linescore.teams?.[side]?.hits ?? 0)}</td><td>${esc(linescore.teams?.[side]?.errors ?? 0)}</td></tr>`;
  const lineScore = `<div class="panel-block"><div class="block-title"><span>이닝 스코어</span><small>R 득점 · H 안타 · E 실책</small></div><div class="linescore-wrap"><table class="linescore mlb-linescore"><thead><tr><th>팀</th>${inningNumbers.map(number => `<th class="${number === inning ? 'current' : ''}">${number}</th>`).join('')}<th>R</th><th>H</th><th>E</th></tr></thead><tbody>${lineRow('away',away.abbreviation || 'AWAY')}${lineRow('home',home.abbreviation || 'HOME')}</tbody></table></div></div>`;
  const bases = [['1루',offense.first],['2루',offense.second],['3루',offense.third]].map(([label,runner]) => `<span class="${runner ? 'occupied' : ''}" title="${esc(runner?.fullName || '주자 없음')}">${label}</span>`).join('');
  const pitches = (current.playEvents || []).filter(event => event.isPitch).slice(-8).map(event => {
    const speed = event.pitchData?.startSpeed ? `${Math.round(event.pitchData.startSpeed * 1.60934)}km/h` : '';
    const type = mlbKoreanPitchType(event.details?.type?.description);
    return `<div class="mlb-pitch-row"><b>${esc(event.pitchNumber || '')}구</b><span>${esc(mlbKoreanPitch(event.details?.description))}</span><small>${esc([type,speed].filter(Boolean).join(' · '))}</small><em>${esc(event.count ? `${event.count.balls}-${event.count.strikes}` : '')}</em></div>`;
  }).join('');
  const situation = `<div class="panel-block mlb-situation"><div class="block-title"><span>현재 승부</span><small>${esc(top ? awayName : homeName)} 공격</small></div><div class="mlb-matchup"><div>${mlbHeadshot(batter) ? `<img src="${esc(mlbHeadshot(batter))}" alt="">` : ''}<span><small>타자</small><b>${esc(batter.fullName || '-')}</b></span></div><i>VS</i><div>${mlbHeadshot(pitcher) ? `<img src="${esc(mlbHeadshot(pitcher))}" alt="">` : ''}<span><small>투수</small><b>${esc(pitcher.fullName || '-')}</b></span></div></div><div class="mlb-count"><b class="ball">B ${esc(count.balls ?? linescore.balls ?? 0)}</b><b class="strike">S ${esc(count.strikes ?? linescore.strikes ?? 0)}</b><b class="out">O ${esc(count.outs ?? linescore.outs ?? 0)}</b><div class="mlb-bases">${bases}</div></div><div class="mlb-pitches">${pitches || '<span class="mlb-no-pitch">현재 타석의 투구 기록을 기다리는 중입니다.</span>'}</div></div>`;
  const scoringPlays = plays.filter(play => play.about?.isScoringPlay).slice(-6).reverse();
  const scoring = scoringPlays.length ? `<div class="panel-block"><div class="block-title"><span>최근 득점 장면</span><small>${scoringPlays.length}개</small></div>${scoringPlays.map(play => `<div class="mlb-feed-row scoring"><span>${esc(play.about?.inning)}회 ${play.about?.halfInning === 'top' ? '초' : '말'}</span><div><b>${esc(mlbPlayActor(play))}</b><small>${esc(mlbKoreanEvent(play))}${Number(play.result?.rbi) ? ` · ${esc(play.result.rbi)}타점` : ''}</small></div><strong>${esc(play.result?.awayScore ?? 0)} : ${esc(play.result?.homeScore ?? 0)}</strong></div>`).join('')}</div>` : '';
  const statRows = [
    ['안타','batting','hits'],['홈런','batting','homeRuns'],['도루','batting','stolenBases'],['누타수','batting','totalBases'],
    ['삼진','batting','strikeOuts'],['허용 볼넷','pitching','baseOnBalls'],['홈런 허용','pitching','homeRuns'],['수비 실책','fielding','errors']
  ].map(([label,group,key]) => {
    const awayValue = mlbStatNumber(awayBox.teamStats?.[group]?.[key]);
    const homeValue = mlbStatNumber(homeBox.teamStats?.[group]?.[key]);
    const max = Math.max(awayValue, homeValue, 1);
    return `<div class="mlb-team-stat"><b>${esc(label)}</b><div><span><img src="${esc(awayLogo)}" alt="">${esc(awayValue)}</span><progress class="away" max="${max}" value="${awayValue}"></progress></div><div><span><img src="${esc(homeLogo)}" alt="">${esc(homeValue)}</span><progress class="home" max="${max}" value="${homeValue}"></progress></div></div>`;
  }).join('');
  const allPlayers = [...mlbBoxPlayers(awayBox), ...mlbBoxPlayers(homeBox)];
  const teamsById = new Map([[Number(away.id),away],[Number(home.id),home]]);
  const leaders = `<div class="panel-block"><div class="block-title"><span>경기 리더</span><small>현재 경기 기록</small></div><div class="mlb-leaders">${mlbLeaderCard('안타','hits',allPlayers,teamsById)}${mlbLeaderCard('홈런','homeRuns',allPlayers,teamsById)}${mlbLeaderCard('타점','rbi',allPlayers,teamsById)}</div></div>`;
  const teamStats = `<div class="panel-block"><div class="block-title"><span>팀 경기 통계</span><small>${esc(away.abbreviation || 'AWAY')} · ${esc(home.abbreviation || 'HOME')}</small></div><div class="mlb-team-stats">${statRows}</div></div>`;
  const playerStats = `<div class="panel-block mlb-box-panel"><div class="block-title"><span>선수 기록</span><small>경기 기록 · 시즌 AVG/OBP/ERA</small></div><div class="mlb-box-grid">${mlbPlayerTable(away,awayBox)}${mlbPlayerTable(home,homeBox)}</div></div>`;
  const injuryPanel = `<div class="panel-block"><div class="block-title"><span>부상 보고서</span><small>40인 로스터 기준</small></div><div class="mlb-injury-grid">${mlbInjuryTeam(away,injuries.away)}${mlbInjuryTeam(home,injuries.home)}</div></div>`;
  const groups = new Map();
  plays.filter(play => play.about?.isComplete).forEach(play => { const key=`${play.about?.inning}-${play.about?.halfInning}`; if(!groups.has(key)) groups.set(key,[]); groups.get(key).push(play); });
  const allPlays = [...groups.entries()].map(([key,rows]) => { const first=rows[0]; const groupTop=first.about?.halfInning === 'top'; const groupInning=Number(first.about?.inning); const groupTeam=groupTop ? away : home; return `<details class="period" ${groupInning === inning && groupTop === top ? 'open' : ''}><summary><span>${groupInning}회 ${groupTop ? '초' : '말'} · ${esc(mlbTeamName(groupTeam))} 공격</span><small>${rows.length}개 타석</small></summary>${rows.map(play => `<div class="mlb-feed-row ${play.about?.isScoringPlay ? 'scoring' : ''}"><span>${esc(mlbPlayActor(play))}</span><div><b>${esc(mlbKoreanEvent(play))}</b><small>${Number(play.result?.rbi) ? `${esc(play.result.rbi)}타점` : esc(play.result?.description || '')}</small></div><strong>${esc(play.result?.awayScore ?? 0)} : ${esc(play.result?.homeScore ?? 0)}</strong></div>`).join('')}</details>`; }).join('');
  $('#commentaryContent').innerHTML = `<div class="mlb-detail-page"><div class="commentary-head"><div class="commentary-head-top"><span class="${isLive ? 'live' : ''}">${isLive ? '● LIVE' : 'MLB'} · ${esc(stateText)}</span><div><button id="backFromMlbDetail">← 경기 목록</button><button id="refreshMlbCommentary">↻ 새로고침</button></div></div><div class="matchup"><div><img src="${esc(awayLogo)}" alt=""><b>${esc(awayName)}</b>${awayRecord ? `<small>${esc(awayRecord)}</small>` : ''}</div><div class="big-score"><strong>${esc(awayRuns)} : ${esc(homeRuns)}</strong><small>${esc(game.status?.detailedState || '원정 · 홈')}</small></div><div><img src="${esc(homeLogo)}" alt=""><b>${esc(homeName)}</b>${homeRecord ? `<small>${esc(homeRecord)}</small>` : ''}</div></div></div>${lineScore}${teamStats}${leaders}${playerStats}${injuryPanel}<div class="mlb-live-grid"><div>${situation}${scoring}</div><div class="panel-block mlb-all-plays"><div class="block-title"><span>전체 플레이 기록</span><small>${plays.filter(play => play.about?.isComplete).length}개 · ${isLive ? '12초 자동 갱신' : '1회부터 경기 종료까지'}</small></div>${allPlays || '<div class="loading">완료된 타석 기록이 없습니다.</div>'}</div></div></div>`;
  $('#refreshMlbCommentary').addEventListener('click', () => loadMlbCommentary(true));
  $('#backFromMlbDetail').addEventListener('click', () => showView('games'));
}

function dateOffsetKey(key, days) {
  const date = new Date(`${key}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

async function fetchSoccerScoreboard(sport, dates) {
  const leagues = sport === 'ucl' ? ['uefa.champions','uefa.champions_qual'] : [SOCCER_ENDPOINTS[sport]];
  const results = await Promise.all(leagues.map(league => fetchJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${dates}&limit=200`)));
  const unique = new Map();
  results.forEach((result, index) => (result?.events || []).forEach(event => unique.set(String(event.id), {...event, _league: leagues[index]})));
  return [...unique.values()].sort((a,b) => new Date(a.date) - new Date(b.date));
}

async function loadSoccerGames({ allowFallback = true, quiet = false } = {}) {
  clearTimeout(state.scoreboardTimer);
  clearTimeout(state.monitorTimer);
  updateDateHeader();
  $('#fallbackBanner').hidden = true;
  if (!quiet) setGamesLoading(`${state.sport.toUpperCase()} 경기를 불러오는 중...`);
  const requestedSport = state.sport;
  try {
    let events = await fetchSoccerScoreboard(requestedSport, apiDate(state.date));
    if (!events.length && allowFallback && state.date === localDateKey(new Date())) {
      events = await fetchSoccerScoreboard(requestedSport, `${apiDate(dateOffsetKey(state.date,-10))}-${apiDate(dateOffsetKey(state.date,10))}`);
      if (events.length) {
        $('#fallbackBanner').textContent = '오늘 경기가 없어 가까운 경기 일정을 보여드립니다.';
        $('#fallbackBanner').hidden = false;
      }
    }
    if (state.sport !== requestedSport) return;
    state.events = events;
    renderSoccerGames(events, requestedSport);
    syncFavoriteSelect();
    monitorLiveGames();
    if (events.some(isLiveEvent)) state.scoreboardTimer = setTimeout(() => loadGames({allowFallback:false,quiet:true}), 20000);
  } catch (error) {
    if (state.sport !== requestedSport) return;
    $('#gamesStatus').hidden = false;
    $('#gamesStatus').innerHTML = `${requestedSport.toUpperCase()} 경기 정보를 불러오지 못했습니다.<br><small>${esc(error.message)}</small>`;
  }
}

function renderSoccerGames(events, sport) {
  $('#gamesStatus').hidden = events.length > 0;
  $('#gamesStatus').innerHTML = events.length ? '' : `선택한 날짜에 ${sport.toUpperCase()} 경기가 없습니다.`;
  $('#liveDot').hidden = !events.some(isLiveEvent);
  const rows = events.map(event => {
    const comp = event.competitions?.[0] || {};
    const away = comp.competitors?.find(item => item.homeAway === 'away') || {};
    const home = comp.competitors?.find(item => item.homeAway === 'home') || {};
    const live = isLiveEvent(event);
    const started = event.status?.type?.state !== 'pre';
    const detail = event.status?.type?.shortDetail || event.status?.type?.detail || '';
    return scheduleRow({classes:'soccer-game-card',attrs:started ? `data-game-id="${esc(event.id)}"` : '',gameId:event.id,time:scheduleTime(event.date),phase:live ? detail : (started ? '종료' : '경기 전'),sub:sport.toUpperCase(),awayName:soccerTeamName(away.team),awayLogo:teamLogo(away),awayRecord:'원정',homeName:soccerTeamName(home.team),homeLogo:teamLogo(home),homeRecord:'홈',awayScore:away.score ?? 0,homeScore:home.score ?? 0,started,live,selectable:started});
  }).join('');
  $('#gamesList').innerHTML = scheduleBoard(sport,sport === 'epl' ? '프리미어리그' : 'UEFA 챔피언스리그',rows,events.length);
  bindGameAlertButtons();
  $$('.soccer-game-card[data-game-id]').forEach(card => card.addEventListener('click', () => openSoccerGame(card.dataset.gameId)));
}

function f1SessionName(session = {}) {
  return F1_SESSION_KO[session.session_name] || F1_SESSION_KO[session.session_type] || session.session_name || session.session_type || '세션';
}

function f1MeetingName(meeting = {}, session = {}) {
  if (/testing/i.test(meeting.meeting_name || '')) return '프리시즌 테스트';
  const country = F1_COUNTRY_KO[meeting.country_name || session.country_name] || meeting.country_name || session.country_name || meeting.location || session.location || 'F1';
  return `${country} 그랑프리`;
}

function f1SessionState(session = {}, now = Date.now()) {
  if (session.is_cancelled) return { key:'cancelled', label:'취소', selectable:false, live:false };
  const start = new Date(session.date_start).getTime();
  const end = new Date(session.date_end).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return { key:'unknown', label:'일정 확인', selectable:false, live:false };
  if (now < start - 30 * 60000) return { key:'pre', label:'예정', selectable:true, live:false };
  if (now < start) return { key:'restricted', label:'라이브 준비 · 유료', selectable:true, live:false };
  if (now <= end) return { key:'live', label:'LIVE · 유료', selectable:true, live:true };
  if (now <= end + 30 * 60000) return { key:'cooldown', label:'결과 준비 중', selectable:true, live:false };
  return { key:'post', label:'기록 보기', selectable:true, live:false };
}

async function loadF1Calendar(year) {
  if (state.f1.calendars[year]) return state.f1.calendars[year];
  const pending = Promise.all([
    f1FetchJson(`https://api.openf1.org/v1/meetings?year=${year}`),
    f1FetchJson(`https://api.openf1.org/v1/sessions?year=${year}`)
  ]).then(([meetings, sessions]) => {
    const meetingMap = new Map((meetings || []).map(meeting => [String(meeting.meeting_key), meeting]));
    return {
      meetings: meetings || [],
      sessions: (sessions || []).map(session => ({ ...session, _meeting: meetingMap.get(String(session.meeting_key)) || {} }))
    };
  });
  state.f1.calendars[year] = pending;
  try {
    const calendar = await pending;
    state.f1.calendars[year] = calendar;
    return calendar;
  } catch (error) {
    delete state.f1.calendars[year];
    throw error;
  }
}

async function loadF1Games({ allowFallback = true, quiet = false } = {}) {
  clearTimeout(state.scoreboardTimer);
  clearTimeout(state.monitorTimer);
  updateDateHeader();
  $('#fallbackBanner').hidden = true;
  if (!quiet) setGamesLoading('F1 일정을 불러오는 중...');
  const requestedDate = state.date;
  const year = Number(requestedDate.slice(0, 4));
  try {
    const calendar = await loadF1Calendar(year);
    if (state.sport !== 'f1' || state.date !== requestedDate) return;
    let sessions = calendar.sessions.filter(session => dateKeyInTimeZone(session.date_start) === requestedDate);
    if (!sessions.length && allowFallback && requestedDate === localDateKey(new Date())) {
      const target = new Date(`${requestedDate}T12:00:00+09:00`).getTime();
      const nearest = calendar.meetings
        .filter(meeting => !meeting.is_cancelled)
        .sort((a, b) => Math.abs(new Date(a.date_start).getTime() - target) - Math.abs(new Date(b.date_start).getTime() - target))[0];
      if (nearest) {
        sessions = calendar.sessions.filter(session => String(session.meeting_key) === String(nearest.meeting_key));
        $('#fallbackBanner').textContent = `오늘 세션이 없어 가장 가까운 ${f1MeetingName(nearest)} 일정을 보여드립니다.`;
        $('#fallbackBanner').hidden = false;
      }
    }
    state.events = sessions.sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
    renderF1Games(state.events);
    syncFavoriteSelect();
  } catch (error) {
    if (state.sport !== 'f1' || state.date !== requestedDate) return;
    $('#gamesStatus').hidden = false;
    $('#gamesStatus').innerHTML = `F1 일정을 불러오지 못했습니다.<br><small>${esc(error.message)}</small>`;
  }
}

function renderF1Games(sessions) {
  $('#gamesStatus').hidden = sessions.length > 0;
  $('#gamesStatus').innerHTML = sessions.length ? '' : '선택한 날짜에 F1 세션이 없습니다.';
  $('#liveDot').hidden = !sessions.some(session => f1SessionState(session).live);
  const groups = new Map();
  sessions.forEach(session => {
    const key = String(session.meeting_key);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(session);
  });
  $('#gamesList').innerHTML = [...groups.values()].map(group => {
    const meeting = group[0]._meeting || {};
    const rows = group.map(session => {
      const status = f1SessionState(session);
      const date = new Date(session.date_start);
      const dateLabel = new Intl.DateTimeFormat('ko-KR', { timeZone:'Asia/Seoul', month:'numeric', day:'numeric' }).format(date);
      return `<article class="game-card f1-session-row ${status.live ? 'live' : ''}" data-f1-session-key="${esc(session.session_key)}">
        <div class="game-kickoff"><b class="${status.live ? 'status-live' : ''}">${status.live ? 'LIVE' : esc(scheduleTime(session.date_start))}</b><small>${esc(dateLabel)}</small></div>
        <div class="f1-session-main">${meeting.country_flag ? `<img class="f1-flag" src="${esc(meeting.country_flag)}" alt="">` : ''}<span><b>${esc(f1SessionName(session))}</b><small>${esc(session.circuit_short_name || session.location || '')}</small></span></div>
        <span class="f1-session-status ${status.key}">${esc(status.label)}</span>
      </article>`;
    }).join('');
    return scheduleBoard('f1', f1MeetingName(meeting, group[0]), rows, group.length);
  }).join('');
  $$('.f1-session-row[data-f1-session-key]').forEach(card => card.addEventListener('click', () => openF1Session(card.dataset.f1SessionKey)));
}

function f1Delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function f1FetchJson(url) {
  const execute = async () => {
    let now = Date.now();
    state.f1.requestTimes = state.f1.requestTimes.filter(time => now - time < 60000);
    let wait = Math.max(0, 360 - (now - state.f1.lastRequestAt));
    if (state.f1.requestTimes.length >= 29) wait = Math.max(wait, state.f1.requestTimes[0] + 60050 - now);
    if (wait > 0) await f1Delay(wait);
    now = Date.now();
    state.f1.lastRequestAt = now;
    state.f1.requestTimes.push(now);
    return fetchJson(url);
  };
  const task = state.f1.requestQueue.then(execute, execute);
  state.f1.requestQueue = task.then(() => undefined, () => undefined);
  return task;
}

async function f1FetchSequence(urls) {
  const rows = [];
  for (const url of urls) rows.push(await f1FetchJson(url));
  return rows;
}

function f1DriverMap(drivers = []) {
  return new Map(drivers.map(driver => [String(driver.driver_number), driver]));
}

function f1Gap(result = {}) {
  if (result.position === 1) return '우승';
  const gap = result.gap_to_leader;
  if (Array.isArray(gap)) return gap.filter(value => value != null).map(value => typeof value === 'number' ? `+${value.toFixed(3)}` : value).join(' / ') || '-';
  if (typeof gap === 'number') return `+${gap.toFixed(3)}초`;
  return gap || (result.dnf ? '리타이어' : result.dns ? '미출발' : result.dsq ? '실격' : '-');
}

function f1ControlText(message = '') {
  return String(message)
    .replace(/SAFETY CAR DEPLOYED/gi, '세이프티카 투입')
    .replace(/VIRTUAL SAFETY CAR DEPLOYED/gi, '버추얼 세이프티카 발동')
    .replace(/VIRTUAL SAFETY CAR ENDING/gi, '버추얼 세이프티카 종료 예정')
    .replace(/GREEN FLAG/gi, '그린 플래그')
    .replace(/YELLOW FLAG/gi, '옐로 플래그')
    .replace(/RED FLAG/gi, '레드 플래그')
    .replace(/CHEQUERED FLAG/gi, '체커기')
    .replace(/DRS ENABLED/gi, 'DRS 사용 가능')
    .replace(/DRS DISABLED/gi, 'DRS 사용 중지')
    .replace(/SESSION STARTED/gi, '세션 시작')
    .replace(/SESSION ENDED/gi, '세션 종료');
}

async function openF1Session(sessionKey) {
  state.selectedGameId = String(sessionKey);
  showView('commentary');
  $('#commentaryEmpty').hidden = true;
  await loadF1Session(true);
}

async function loadF1Session(showLoading = false) {
  const sessionKey = String(state.selectedGameId || '');
  const session = state.events.find(item => String(item.session_key) === sessionKey);
  if (!session) return;
  const status = f1SessionState(session);
  if (showLoading) $('#commentaryContent').innerHTML = '<div class="loading"><span class="spinner"></span>F1 세션 기록을 불러오는 중...</div>';
  if (status.key !== 'post') {
    const meeting = session._meeting || {};
    const message = status.live ? '실시간 데이터는 유료 라이브 범위입니다.' : status.key === 'cooldown' ? '무료 데이터 전환을 기다리는 중입니다.' : status.key === 'cancelled' ? '취소된 세션입니다.' : '아직 시작하지 않은 세션입니다.';
    $('#commentaryContent').innerHTML = `<div class="f1-detail-hero">${meeting.circuit_image ? `<img src="${esc(meeting.circuit_image)}" alt="">` : ''}<div><small>${esc(f1MeetingName(meeting, session))}</small><h2>${esc(f1SessionName(session))}</h2><p>${esc(scheduleTime(session.date_start))} · ${esc(session.circuit_short_name || session.location || '')}</p></div></div><div class="f1-access-note"><b>${message}</b><p>OpenF1 무료 데이터는 세션 종료 30분 후부터 조회할 수 있습니다. 일정은 지금도 무료로 확인할 수 있습니다.</p></div>`;
    return;
  }
  try {
    let detail = state.f1.details[sessionKey];
    if (!detail) {
      const [results, drivers, controls, pits, stints] = await f1FetchSequence([
        `https://api.openf1.org/v1/session_result?session_key=${encodeURIComponent(sessionKey)}`,
        `https://api.openf1.org/v1/drivers?session_key=${encodeURIComponent(sessionKey)}`,
        `https://api.openf1.org/v1/race_control?session_key=${encodeURIComponent(sessionKey)}`,
        `https://api.openf1.org/v1/pit?session_key=${encodeURIComponent(sessionKey)}`,
        `https://api.openf1.org/v1/stints?session_key=${encodeURIComponent(sessionKey)}`
      ]);
      detail = { results, drivers, controls, pits, stints };
      state.f1.details[sessionKey] = detail;
    }
    if (String(state.selectedGameId) !== sessionKey || state.sport !== 'f1') return;
    renderF1Session(session, detail);
  } catch (error) {
    $('#commentaryContent').innerHTML = `<div class="loading">F1 기록을 불러오지 못했습니다.<br><small>${esc(error.message)}</small></div>`;
  }
}

function renderF1Session(session, detail) {
  const meeting = session._meeting || {};
  const drivers = f1DriverMap(detail.drivers);
  const results = (detail.results || []).slice().sort((a, b) => Number(a.position) - Number(b.position));
  const resultRows = results.map(result => {
    const driver = drivers.get(String(result.driver_number)) || {};
    return `<tr><td><b>${esc(result.position)}</b></td><td><div class="f1-driver-cell">${driver.headshot_url ? `<img src="${esc(driver.headshot_url)}" alt="">` : ''}<span><b>${esc(driver.full_name || `#${result.driver_number}`)}</b><small>${esc(F1_TEAM_KO[driver.team_name] || driver.team_name || '')}</small></span></div></td><td>${esc(result.number_of_laps ?? '-')}</td><td>${esc(f1Gap(result))}</td><td>${esc(result.points ?? 0)}</td></tr>`;
  }).join('');
  const controlRows = (detail.controls || []).slice().reverse().map(item => `<div class="f1-control-row"><span>${item.lap_number ? `${esc(item.lap_number)}랩` : scheduleTime(item.date)}</span><i class="${esc(String(item.flag || item.category || 'other').toLowerCase().replaceAll(' ','-'))}">${esc(item.flag || item.category || 'INFO')}</i><p>${esc(f1ControlText(item.message))}</p></div>`).join('');
  const pitRows = (detail.pits || []).map(item => { const driver=drivers.get(String(item.driver_number))||{}; return `<div class="f1-pit-row"><b>${esc(item.lap_number)}랩</b><span>${esc(driver.full_name || `#${item.driver_number}`)}<small>${esc(driver.team_name || '')}</small></span><strong>${item.stop_duration != null ? `${esc(item.stop_duration)}초` : item.lane_duration != null ? `${esc(item.lane_duration)}초` : '-'}</strong></div>`; }).join('');
  const stintGroups = new Map();
  (detail.stints || []).forEach(stint => { const key=String(stint.driver_number); if(!stintGroups.has(key)) stintGroups.set(key,[]); stintGroups.get(key).push(stint); });
  const strategyRows = [...stintGroups.entries()].map(([number, stints]) => { const driver=drivers.get(number)||{}; return `<div class="f1-strategy-row"><b>${esc(driver.name_acronym || `#${number}`)}</b><span>${stints.sort((a,b)=>a.stint_number-b.stint_number).map(stint => `<i class="tyre-${esc(String(stint.compound || 'unknown').toLowerCase())}">${esc(stint.compound || '?')}<small>${esc(stint.lap_start ?? '?')}-${esc(stint.lap_end ?? '?')}랩</small></i>`).join('')}</span></div>`; }).join('');
  $('#commentaryContent').innerHTML = `<div class="f1-detail-hero">${meeting.circuit_image ? `<img src="${esc(meeting.circuit_image)}" alt="">` : ''}<div><small>${esc(f1MeetingName(meeting, session))}</small><h2>${esc(f1SessionName(session))}</h2><p>${esc(session.circuit_short_name || session.location || '')} · 무료 과거 기록</p></div><button id="refreshF1Detail" title="새로고침">↻</button></div>
    <div class="panel-block"><div class="block-title"><span>세션 결과</span><small>${results.length}명</small></div><div class="f1-result-wrap"><table class="f1-result-table"><thead><tr><th>#</th><th>드라이버</th><th>랩</th><th>차이</th><th>PTS</th></tr></thead><tbody>${resultRows}</tbody></table></div></div>
    ${strategyRows ? `<div class="panel-block"><div class="block-title"><span>타이어 전략</span><small>스틴트별 사용 구간</small></div><div class="f1-strategies">${strategyRows}</div></div>` : ''}
    ${pitRows ? `<div class="panel-block"><div class="block-title"><span>피트스톱</span><small>${detail.pits.length}회</small></div>${pitRows}</div>` : ''}
    <div class="panel-block"><div class="block-title"><span>레이스 컨트롤</span><small>${detail.controls.length}개 · 최신순</small></div>${controlRows || '<div class="loading">레이스 컨트롤 기록이 없습니다.</div>'}</div>`;
  $('#refreshF1Detail').addEventListener('click', () => { delete state.f1.details[String(session.session_key)]; loadF1Session(true); });
}

function soccerAthlete(detail = {}) {
  return detail.athletesInvolved?.[0] || detail.participants?.[0]?.athlete || detail.athletes?.[0] || {};
}

function soccerRosterHeadshots(summary = {}) {
  const map = new Map();
  (summary.rosters || []).forEach(group => (group.roster || []).forEach(row => {
    const person = row.athlete || row;
    const href = person.headshot?.href || (typeof person.headshot === 'string' ? person.headshot : '');
    if (person.id && href) map.set(String(person.id), href);
  }));
  return map;
}

function soccerHeadshot(athlete = {}, rosterMap) {
  const direct = athlete.headshot?.href || (typeof athlete.headshot === 'string' ? athlete.headshot : '');
  if (direct) return direct;
  const id = athlete.id || athlete.athlete?.id || '';
  if (id && rosterMap?.get) { const fromRoster = rosterMap.get(String(id)); if (fromRoster) return fromRoster; }
  return '';
}

function soccerEventLabel(detail = {}) {
  if (detail.scoringPlay) return detail.ownGoal ? '자책골' : detail.penaltyKick ? '페널티킥 골' : '골';
  if (detail.redCard) return '퇴장';
  if (detail.yellowCard) return '경고';
  const text = detail.type?.text || detail.type?.abbreviation || detail.text || '';
  if (/substitution/i.test(text)) return '선수 교체';
  return text || '경기 이벤트';
}

function soccerDetailsFrom(summary, fallbackEvent) {
  const comp = summary?.header?.competitions?.[0] || fallbackEvent?.competitions?.[0] || {};
  const candidates = [...(comp.details || []),...(summary?.keyEvents || []),...(summary?.plays || [])];
  const unique = new Map();
  candidates.forEach((detail,index) => unique.set(String(detail.id || `${detail.clock?.value}-${detail.type?.id}-${index}`),detail));
  return [...unique.values()].filter(detail => detail.scoringPlay || detail.redCard || detail.yellowCard || /substitution/i.test(detail.type?.text || detail.text || ''));
}

async function openSoccerGame(gameId) {
  state.selectedGameId = String(gameId);
  state.selectedSoccerLeague = state.events.find(event => String(event.id) === state.selectedGameId)?._league || state.selectedSoccerLeague || '';
  showView('commentary');
  $('#commentaryEmpty').hidden = true;
  $('#commentaryContent').innerHTML = `<div class="loading"><span class="spinner"></span>${state.sport.toUpperCase()} 경기 이벤트를 불러오는 중...</div>`;
  await loadSoccerCommentary(true);
}

async function loadSoccerCommentary(showLoading = false) {
  clearTimeout(state.commentaryTimer);
  if (!['epl','ucl'].includes(state.sport) || !state.selectedGameId) return;
  const requestedSport = state.sport, requestedGame = state.selectedGameId;
  const fallbackEvent = state.events.find(event => String(event.id) === requestedGame);
  if (showLoading) $('#commentaryContent').innerHTML = '<div class="loading"><span class="spinner"></span>경기 이벤트를 불러오는 중...</div>';
  try {
    const league = fallbackEvent?._league || state.selectedSoccerLeague || SOCCER_ENDPOINTS[requestedSport];
    const summary = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${encodeURIComponent(requestedGame)}`);
    if (state.sport !== requestedSport || state.selectedGameId !== requestedGame) return;
    renderSoccerCommentary(summary, fallbackEvent, requestedSport);
    const live = (summary?.header?.competitions?.[0]?.status || fallbackEvent?.status)?.type?.state === 'in';
    $('#commentaryBadge').hidden = !live;
    if (live) state.commentaryTimer = setTimeout(() => loadSoccerCommentary(false), 12000);
  } catch (error) {
    if (fallbackEvent) renderSoccerCommentary({},fallbackEvent,requestedSport);
    else $('#commentaryContent').innerHTML = `<div class="loading">경기 이벤트를 불러오지 못했습니다.<br><small>${esc(error.message)}</small></div>`;
  }
}

function renderSoccerCommentary(summary, fallbackEvent, sport) {
  const comp = summary?.header?.competitions?.[0] || fallbackEvent?.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const away = competitors.find(item => item.homeAway === 'away') || {};
  const home = competitors.find(item => item.homeAway === 'home') || {};
  const details = soccerDetailsFrom(summary,fallbackEvent).sort((a,b) => Number(a.clock?.value || 0) - Number(b.clock?.value || 0));
  const rosterHeadshots = soccerRosterHeadshots(summary);
  const live = comp.status?.type?.state === 'in';
  const eventRows = details.map(detail => {
    const athlete = soccerAthlete(detail);
    const eventTeam = detail.team?.id === home.team?.id ? home : away;
    const image = soccerHeadshot(athlete, rosterHeadshots);
    return `<div class="soccer-event-row"><span>${esc(detail.clock?.displayValue || '')}</span>${image ? `<img src="${esc(image)}" alt="">` : `<img src="${esc(teamLogo(eventTeam))}" alt="">`}<div><b>${esc(athlete.displayName || athlete.shortName || soccerEventLabel(detail))}</b><small>${esc(soccerEventLabel(detail))} · ${esc(soccerTeamName(eventTeam.team))}</small></div></div>`;
  }).join('');
  const stats = (summary?.boxscore?.teams || []).map(group => `<div class="soccer-stat-team"><b>${esc(soccerTeamName(group.team))}</b>${(group.statistics || []).slice(0,6).map(stat => `<span><small>${esc(stat.label || stat.name)}</small><strong>${esc(stat.displayValue ?? stat.value ?? '-')}</strong></span>`).join('')}</div>`).join('');
  $('#commentaryContent').innerHTML = `<div class="commentary-head"><div class="commentary-head-top"><span class="${live ? 'live' : ''}">${live ? '● LIVE' : sport.toUpperCase()} · ${esc(comp.status?.type?.detail || comp.status?.type?.shortDetail || '경기 기록')}</span><button id="refreshSoccerCommentary">↻ 새로고침</button></div><div class="matchup"><div><img src="${esc(teamLogo(away))}" alt=""><b>${esc(soccerTeamName(away.team))}</b></div><div class="big-score"><strong>${esc(away.score ?? 0)} : ${esc(home.score ?? 0)}</strong><small>원정 · 홈</small></div><div><img src="${esc(teamLogo(home))}" alt=""><b>${esc(soccerTeamName(home.team))}</b></div></div></div><div class="panel-block"><div class="block-title"><span>주요 경기 이벤트</span><small>득점 · 카드 · 교체</small></div>${eventRows || '<div class="loading">표시할 주요 이벤트가 없습니다.</div>'}</div>${stats ? `<div class="panel-block"><div class="block-title"><span>팀 기록</span><small>주요 지표</small></div><div class="soccer-stats">${stats}</div></div>` : ''}`;
  $('#refreshSoccerCommentary').addEventListener('click', () => loadSoccerCommentary(true));
}

function setSport(sport) {
  if (!['nba','mlb','epl','ucl','f1'].includes(sport) || state.sport === sport) return;
  state.sport = sport;
  state.events = [];
  state.selectedGameId = '';
  state.selectedSoccerLeague = '';
  state.selectedPackage = null;
  clearTimeout(state.scoreboardTimer);
  clearTimeout(state.commentaryTimer);
  clearTimeout(state.monitorTimer);
  $('#commentaryBadge').hidden = true;
  $('#commentaryContent').innerHTML = '';
  $('#commentaryEmpty').hidden = false;
  $('#commentaryEmpty b').textContent = '경기를 선택해 주세요';
  $('#commentaryEmpty p').innerHTML = sport === 'mlb' ? '경기 화면에서 원하는 경기를 누르면<br>이닝 스코어와 전체 문자중계를 표시합니다.' : sport === 'nba' ? '경기 화면에서 원하는 경기를 누르면<br>쿼터별 스코어와 전체 문자중계를 표시합니다.' : sport === 'f1' ? '세션을 누르면 결과·타이어 전략과<br>레이스 컨트롤 기록을 표시합니다.' : '경기 화면에서 원하는 경기를 누르면<br>득점·카드·교체 이벤트를 표시합니다.';
  $$('.sport-tab').forEach(button => button.classList.toggle('active', button.dataset.sport === sport));
  syncFavoriteSelect();
  const tableActive = $('#tableView').classList.contains('active');
  if (tableActive) {
    syncTableSeasonSelect(sport);
    if (state.table.cache[sport]) renderTable(sport);
    else loadTable(sport);
    return;
  }
  showView('games');
  loadGames({allowFallback:sport === 'nba' || sport === 'f1'});
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

function eventIncludesFavorite(event, sport = state.sport) {
  const favorite = favoriteForSport(sport);
  if (!favorite) return false;
  if (sport === 'mlb') return ['away','home'].some(side => String(event.teams?.[side]?.team?.id || '') === String(favorite));
  if (sport === 'epl' || sport === 'ucl') return event.competitions?.[0]?.competitors?.some(item => String(item.team?.id || '') === String(favorite));
  const favoriteKey = NBA_ABBR_ALIASES[favorite] || favorite;
  return event.competitions?.[0]?.competitors?.some(item => (NBA_ABBR_ALIASES[item.team?.abbreviation] || item.team?.abbreviation) === favoriteKey);
}

function alertGameIdsForSport(sport = state.sport) {
  return (state.settings?.alertGameIdsBySport?.[sport] || []).map(String);
}

function isGameAlertSelected(gameId, sport = state.sport) {
  return Boolean(gameId) && alertGameIdsForSport(sport).includes(String(gameId));
}

function eventGameId(event, sport = state.sport) {
  return String(sport === 'mlb' ? event?.gamePk || '' : event?.id || '');
}

function notificationFilterMatches(gameId, selectedGameIds = [], favoriteMatches = true) {
  const ids = selectedGameIds.map(String);
  return ids.includes(String(gameId)) || Boolean(favoriteMatches);
}

function notificationStateKey(sport, gameId) {
  if (sport === 'mlb') return `mlb:${gameId}`;
  if (sport === 'epl' || sport === 'ucl') return `${sport}:${gameId}`;
  return String(gameId);
}

async function toggleGameAlert(gameId, button) {
  const sport = state.sport;
  const current = new Set(alertGameIdsForSport(sport));
  const selected = !current.has(String(gameId));
  if (selected) current.add(String(gameId)); else current.delete(String(gameId));
  const alertGameIdsBySport = {
    nba: [], mlb: [], epl: [], ucl: [], f1: [],
    ...(state.settings.alertGameIdsBySport || {}),
    [sport]: [...current]
  };
  state.settings = await window.nbaDesktop.saveSettings({ ...state.settings, alertGameIdsBySport });
  state.lastPlayIds.delete(notificationStateKey(sport, gameId));
  state.periodStates.delete(notificationStateKey(sport, gameId));
  button.classList.toggle('active', selected);
  button.setAttribute('aria-pressed', String(selected));
  button.title = selected ? '이 경기 알림 끄기' : '이 경기 알림 받기';
  button.textContent = selected ? '알림 중' : '알림';
  monitorLiveGames();
}

function bindGameAlertButtons() {
  $$('.game-alert-toggle').forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    toggleGameAlert(button.dataset.alertGameId, button);
  }));
}

function favoriteForSport(sport = state.sport) {
  const values = state.settings?.favoriteBySport || {};
  return values[sport] ?? (sport === 'nba' ? state.settings?.favoriteTeam : '') ?? '';
}

function findPlayAthlete(pkg, play) {
  const participantIds = new Set((play.participants || []).flatMap(participant => [participant.id, participant.athlete?.id]).filter(Boolean).map(String));
  const playText = String(play.text || play.shortDescription || '').toLowerCase();
  const candidates = (pkg?.boxscore?.players || []).flatMap(group =>
    (group.statistics || []).flatMap(stat => (stat.athletes || []).map(row => ({
      athlete: row.athlete || {},
      teamLogo: group.team?.logo || ''
    })))
  );
  const matchedById = candidates.find(item => participantIds.has(String(item.athlete.id || '')));
  const matchedByName = candidates
    .filter(item => item.athlete.displayName && playText.includes(String(item.athlete.displayName).toLowerCase()))
    .sort((a, b) => String(b.athlete.displayName).length - String(a.athlete.displayName).length)[0];
  const match = matchedById || matchedByName;
  if (!match) return null;
  return {
    name: match.athlete.displayName || match.athlete.shortName || '',
    image: match.athlete.headshot?.href || '',
    teamLogo: match.teamLogo
  };
}

async function fetchLiveNotificationEvents(sport, date = localDateKey(new Date())) {
  const previousDate = offsetDateKey(date, -1);
  if (sport === 'mlb') {
    const data = await fetchJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${previousDate}&endDate=${date}&hydrate=linescore,team`);
    return (data?.dates || []).flatMap(day => day.games || []).filter(game => dateKeyInTimeZone(game.gameDate) === date && isMlbLive(game));
  }
  const dates = `${apiDate(previousDate)}-${apiDate(date)}`;
  if (sport === 'nba') {
    const data = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dates}&limit=200`);
    return (data?.events || []).filter(event => dateKeyInTimeZone(event.date) === date && isLiveEvent(event));
  }
  const events = await fetchSoccerScoreboard(sport, dates);
  return events.filter(event => dateKeyInTimeZone(event.date) === date && isLiveEvent(event));
}

async function monitorLiveGames() {
  clearTimeout(state.monitorTimer);
  if (!state.settings?.notifications || state.monitorInFlight) return;
  state.monitorInFlight = true;
  try {
    const configuredSports = NOTIFICATION_SPORTS.filter(sport => favoriteForSport(sport) || alertGameIdsForSport(sport).length);
    const batches = await Promise.allSettled(configuredSports.map(async sport => ({ sport, events:await fetchLiveNotificationEvents(sport) })));
    const targets = new Map();
    batches.filter(result => result.status === 'fulfilled').forEach(({ value }) => {
      const selectedIds = alertGameIdsForSport(value.sport);
      value.events.forEach(event => {
        const gameId = eventGameId(event, value.sport);
        if (notificationFilterMatches(gameId, selectedIds, eventIncludesFavorite(event, value.sport))) {
          targets.set(`${value.sport}:${gameId}`, { sport:value.sport, event });
        }
      });
    });
    await Promise.allSettled([...targets.values()].map(({ sport,event }) => {
      if (sport === 'mlb') return checkMlbGameNotifications(event);
      if (sport === 'epl' || sport === 'ucl') return checkSoccerGameNotifications(event, sport);
      return checkGameNotifications(event);
    }));
  } finally {
    state.monitorInFlight = false;
    if (state.settings?.notifications) state.monitorTimer = setTimeout(monitorLiveGames, 12000);
  }
}

function mlbPeriodTransition(linescore = {}, previous = null) {
  const inning = Number(linescore.currentInning || 0);
  const phase = String(linescore.inningState || linescore.inningHalf || '').toLowerCase();
  const battingHalf = phase.includes('top') ? 'top' : phase.includes('bottom') ? 'bottom' : '';
  let completedHalf = '';
  if (inning && phase.includes('middle')) completedHalf = `${inning}-top`;
  else if (inning && phase.includes('end')) completedHalf = `${inning}-bottom`;
  else if (previous?.inning === inning && previous.battingHalf === 'top' && battingHalf === 'bottom') completedHalf = `${inning}-top`;
  else if (previous?.inning && inning > previous.inning && previous.battingHalf === 'bottom') completedHalf = `${previous.inning}-bottom`;
  return {
    completedHalf,
    snapshot: { inning, battingHalf, lastBoundaryKey:completedHalf || previous?.lastBoundaryKey || '' }
  };
}

function soccerPeriodTransition(status = {}, previous = null) {
  const period = Number(status.period || 0);
  const text = [status.type?.name,status.type?.description,status.type?.detail,status.type?.shortDetail,status.detail].filter(Boolean).join(' ');
  let boundary = '';
  if (/half\s*time|halftime|전반/i.test(text)) boundary = 'halftime';
  else if (/full\s*time|final|경기\s*종료/i.test(text) || status.type?.state === 'post') boundary = 'fulltime';
  else if (previous?.period === 1 && period >= 2) boundary = 'halftime';
  return { boundary, snapshot:{ period, lastBoundary:boundary || previous?.lastBoundary || '' } };
}

function nbaBoundaryLabel(play = {}) {
  const text = String(play.text || play.shortDescription || '');
  if (/Game End|End of Game/i.test(text)) return '경기 종료';
  const period = Number(play.period?.number || 0);
  if (period >= 1 && period <= 4) return `${period}쿼터 종료`;
  if (period > 4) return `${period - 4}차 연장 종료`;
  return koreanPlay(text);
}

async function checkMlbGameNotifications(game) {
  const feed = await fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${encodeURIComponent(game.gamePk)}/feed/live`);
  const key = `mlb:${game.gamePk}`;
  const gameData = feed.gameData || {}, linescore = feed.liveData?.linescore || {};
  const away = gameData.teams?.away || {}, home = gameData.teams?.home || {};
  const previousPeriod = state.periodStates.get(key);
  const { completedHalf, snapshot } = mlbPeriodTransition(linescore, previousPeriod);
  state.periodStates.set(key, snapshot);
  if (previousPeriod && completedHalf && completedHalf !== previousPeriod.lastBoundaryKey) {
    const [endedInning, endedHalf] = completedHalf.split('-');
    const boundaryLabel = `${endedInning}회 ${endedHalf === 'top' ? '초' : '말'} 종료`;
    await window.nbaDesktop.showNotification({
      sport:'mlb',league:'MLB',gameId:String(game.gamePk),body:`${boundaryLabel} · 현재 스코어 ${linescore.teams?.away?.runs ?? 0} : ${linescore.teams?.home?.runs ?? 0}`,
      awayName:mlbTeamName(away),homeName:mlbTeamName(home),awayLogo:away.id ? `https://www.mlbstatic.com/team-logos/${away.id}.svg` : '',homeLogo:home.id ? `https://www.mlbstatic.com/team-logos/${home.id}.svg` : '',
      awayScore:linescore.teams?.away?.runs ?? 0,homeScore:linescore.teams?.home?.runs ?? 0,meta:boundaryLabel,playerName:'',playerImage:'',silent:!state.settings.sound
    });
  }
  const plays = (feed?.liveData?.plays?.allPlays || []).filter(play => play.about?.isComplete);
  if (!plays.length) return;
  const playId = play => String(play.atBatIndex ?? play.about?.endTime ?? '');
  const previousId = state.lastPlayIds.get(key);
  state.lastPlayIds.set(key, playId(plays.at(-1)));
  if (!previousId) return;
  const index = plays.findIndex(play => playId(play) === previousId);
  const fresh = index >= 0 ? plays.slice(index + 1) : plays.slice(-1);
  const eligible = fresh.filter(play => state.settings.notificationLevel === 'all' || play.about?.isScoringPlay);
  if (!eligible.length) return;
  const play = eligible.at(-1);
  const actor = play.result?.eventType === 'pitching_substitution' ? play.matchup?.pitcher : play.matchup?.batter;
  const battingTeam = play.about?.halfInning === 'top' ? away : home;
  await window.nbaDesktop.showNotification({
    sport:'mlb',league:'MLB',gameId:String(game.gamePk),body:`${mlbKoreanEvent(play)}${Number(play.result?.rbi) ? ` · ${play.result.rbi}타점` : ''}`,
    awayName:mlbTeamName(away),homeName:mlbTeamName(home),awayLogo:away.id ? `https://www.mlbstatic.com/team-logos/${away.id}.svg` : '',homeLogo:home.id ? `https://www.mlbstatic.com/team-logos/${home.id}.svg` : '',
    awayScore:play.result?.awayScore ?? linescore.teams?.away?.runs ?? 0,homeScore:play.result?.homeScore ?? linescore.teams?.home?.runs ?? 0,
    meta:`${play.about?.inning || ''}회 ${play.about?.halfInning === 'top' ? '초' : '말'}`,playerName:actor?.fullName || mlbPlayActor(play),playerImage:mlbHeadshot(actor),eventTeamLogo:battingTeam.id ? `https://www.mlbstatic.com/team-logos/${battingTeam.id}.svg` : '',silent:!state.settings.sound
  });
}

async function checkSoccerGameNotifications(event, sport = state.sport) {
  const league = event._league || SOCCER_ENDPOINTS[sport];
  const summary = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${encodeURIComponent(event.id)}`);
  const details = soccerDetailsFrom(summary,event);
  const key = `${sport}:${event.id}`;
  const comp = summary?.header?.competitions?.[0] || event.competitions?.[0] || {};
  const away = comp.competitors?.find(item => item.homeAway === 'away') || {}, home = comp.competitors?.find(item => item.homeAway === 'home') || {};
  const status = comp.status || {};
  const previousPeriod = state.periodStates.get(key);
  const { boundary, snapshot } = soccerPeriodTransition(status, previousPeriod);
  state.periodStates.set(key, snapshot);
  if (previousPeriod && boundary && boundary !== previousPeriod.lastBoundary) {
    const boundaryLabel = boundary === 'halftime' ? '전반전 종료' : '경기 종료';
    await window.nbaDesktop.showNotification({
      sport,league:sport.toUpperCase(),endpointLeague:league,gameId:String(event.id),body:`${boundaryLabel} · 현재 스코어 ${away.score ?? 0} : ${home.score ?? 0}`,
      awayName:soccerTeamName(away.team),homeName:soccerTeamName(home.team),awayLogo:teamLogo(away),homeLogo:teamLogo(home),awayScore:away.score ?? 0,homeScore:home.score ?? 0,
      meta:boundaryLabel,playerName:'',playerImage:'',silent:!state.settings.sound
    });
  }
  if (!details.length) return;
  const detailId = detail => String(detail.id || `${detail.clock?.value}-${detail.type?.id}-${soccerEventLabel(detail)}`);
  const previousId = state.lastPlayIds.get(key);
  state.lastPlayIds.set(key, detailId(details.at(-1)));
  if (!previousId) return;
  const index = details.findIndex(detail => detailId(detail) === previousId);
  const fresh = index >= 0 ? details.slice(index + 1) : details.slice(-1);
  const eligible = fresh.filter(detail => state.settings.notificationLevel === 'all' || detail.scoringPlay || detail.redCard);
  if (!eligible.length) return;
  const detail = eligible.at(-1);
  const eventComp = event.competitions?.[0] || {};
  const evAway = eventComp.competitors?.find(item => item.homeAway === 'away') || {};
  const evHome = eventComp.competitors?.find(item => item.homeAway === 'home') || {};
  const athlete = soccerAthlete(detail), eventTeam = detail.team?.id === home.team?.id ? home : away;
  const playerImage = soccerHeadshot(athlete, soccerRosterHeadshots(summary));
  await window.nbaDesktop.showNotification({
    sport,league:sport.toUpperCase(),endpointLeague:league,gameId:String(event.id),body:soccerEventLabel(detail),awayName:soccerTeamName(away.team),homeName:soccerTeamName(home.team),awayLogo:teamLogo(away) || teamLogo(evAway),homeLogo:teamLogo(home) || teamLogo(evHome),awayScore:away.score ?? 0,homeScore:home.score ?? 0,meta:detail.clock?.displayValue || comp.status?.displayClock || '',playerName:athlete.displayName || athlete.shortName || '',playerImage,eventTeamLogo:teamLogo(eventTeam),silent:!state.settings.sound
  });
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
  const { away,home,map } = packageTeams(pkg);
  const scoreComp = event.competitions?.[0] || {};
  const scoreAway = scoreComp.competitors?.find(side => side.homeAway === 'away') || {};
  const scoreHome = scoreComp.competitors?.find(side => side.homeAway === 'home') || {};
  const notifyPlay = async (play, boundary = false) => {
    const athlete = boundary ? null : findPlayAthlete(pkg, play);
    const eventTeam = map.get(String(play.team?.id || ''));
    const awayScore = play.awayScore ?? away.score ?? 0;
    const homeScore = play.homeScore ?? home.score ?? 0;
    const boundaryLabel = boundary ? nbaBoundaryLabel(play) : koreanPlay(play.text || play.shortDescription);
    await window.nbaDesktop.showNotification({
      title:`${teamName(away.team)} ${awayScore} : ${homeScore} ${teamName(home.team)}`,sport:'nba',league:'NBA',
      body:boundary ? `${boundaryLabel} · 현재 스코어 ${awayScore} : ${homeScore}` : koreanPlay(play.text || play.shortDescription),gameId:event.id,
      awayName:teamName(away.team),homeName:teamName(home.team),awayLogo:teamLogo(away) || teamLogo(scoreAway),homeLogo:teamLogo(home) || teamLogo(scoreHome),
      awayScore,homeScore,meta:boundary ? boundaryLabel : `${periodLabel(play.period?.number)} · ${play.clock?.displayValue || ''}`,
      playerName:athlete?.name || '',playerImage:athlete?.image || '',eventTeamLogo:athlete?.teamLogo || eventTeam?.logo || '',silent:!state.settings.sound
    });
  };
  const isBoundary = play => /End of|Game End/i.test(play.text || play.shortDescription || '');
  const boundary = fresh.filter(isBoundary).at(-1);
  if (boundary) await notifyPlay(boundary, true);
  const eligible = fresh.filter(play => !isBoundary(play) && (state.settings.notificationLevel === 'all' || play.scoringPlay));
  if (eligible.length) await notifyPlay(eligible.at(-1));
}

function populateSettings() {
  Object.entries(state.settings).forEach(([key,value]) => { const input = document.getElementById(key); if(!input)return; if(input.type === 'checkbox') input.checked = Boolean(value); else input.value = value; });
  syncFavoriteSelect();
  $('#pinBtn').classList.toggle('on', state.settings.alwaysOnTop);
  $('#notificationOpacityValue').textContent = `${Math.round((Number(state.settings.notificationOpacity) || .95) * 100)}%`;
}

function syncFavoriteSelect() {
  const select = $('#favoriteTeam');
  if (!select || !state.settings) return;
  const optionMap = new Map();
  if (state.sport === 'f1') {
    select.innerHTML = '<option value="">무료 라이브 알림 미지원</option>';
    select.value = '';
    select.disabled = true;
    $('#favoriteTeamLabel').textContent = 'F1 실시간 알림';
    return;
  }
  select.disabled = false;
  if (state.sport === 'nba') NBA_TEAMS.forEach(([value,label]) => optionMap.set(String(value),label));
  else if (state.sport === 'mlb') MLB_TEAMS.forEach(([value,label]) => optionMap.set(String(value),label));
  else state.events.forEach(event => (event.competitions?.[0]?.competitors || []).forEach(side => optionMap.set(String(side.team?.id || ''),soccerTeamName(side.team))));
  const selected = favoriteForSport();
  if (selected && !optionMap.has(String(selected))) optionMap.set(String(selected),'저장된 응원 팀');
  select.innerHTML = '<option value="">전체 경기</option>' + [...optionMap.entries()].filter(([value]) => value).sort((a,b) => a[1].localeCompare(b[1],'ko')).map(([value,label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join('');
  select.value = String(selected || '');
  $('#favoriteTeamLabel').textContent = `${state.sport.toUpperCase()} 응원 팀`;
}

async function saveSettings() {
  const favoriteBySport = { nba:'',mlb:'',epl:'',ucl:'',f1:'',...(state.settings.favoriteBySport || {}),[state.sport]:$('#favoriteTeam').value };
  state.settings = await window.nbaDesktop.saveSettings({
    alwaysOnTop:$('#alwaysOnTop').checked,
    autoLaunch:$('#autoLaunch').checked,
    notifications:$('#notifications').checked,
    notificationLevel:$('#notificationLevel').value,
    favoriteTeam:$('#favoriteTeam').value,
    favoriteBySport,
    alertGameIdsBySport:state.settings.alertGameIdsBySport,
    sound:$('#sound').checked,
    notificationOpacity:Number($('#notificationOpacity').value),
    pinAllNotifications:$('#pinAllNotifications').checked
  });
  $('#pinBtn').classList.toggle('on', state.settings.alwaysOnTop);
  monitorLiveGames();
}

/* ==========================================================================
   순위 뷰 — 통합관리자 스포츠 위젯(js/widget-sports.js) 이식본
   팀 순위 / 선수 스탯 / 플레이오프·토너먼트 / 과거 시즌 선택
   원본 대비: fetch→IPC(fetchJson), escapeAdminHtml→esc,
   인라인 onclick/onchange/style → 위임 리스너 + 클래스, FontAwesome 제거,
   경기 목록(widgetCard)·문자중계는 앱 자체 구현이 있어 제외
   ========================================================================== */

const TEAM_KO_MAP = {
  // NBA
  "Lakers": "LA 레이커스", "Los Angeles Lakers": "LA 레이커스",
  "Warriors": "골든스테이트", "Golden State Warriors": "골든스테이트",
  "Celtics": "보스턴", "Boston Celtics": "보스턴",
  "Suns": "피닉스", "Phoenix Suns": "피닉스",
  "Mavericks": "댈러스", "Dallas Mavericks": "댈러스",
  "Nuggets": "덴버", "Denver Nuggets": "덴버",
  "Heat": "마이애미", "Miami Heat": "마이애미",
  "Bulls": "시카고", "Chicago Bulls": "시카고",
  "Knicks": "뉴욕 닉스", "New York Knicks": "뉴욕 닉스",
  "San Antonio": "샌안토니오", "San Antonio Spurs": "샌안토니오",
  "76ers": "필라델피아", "Philadelphia 76ers": "필라델피아",
  "Bucks": "밀워키", "Milwaukee Bucks": "밀워키",
  "Cavaliers": "클리블랜드", "Cleveland Cavaliers": "클리블랜드",
  "Timberwolves": "미네소타", "Minnesota Timberwolves": "미네소타",
  "Thunder": "오클라호마시티", "Oklahoma City Thunder": "오클라호마시티",
  "Clippers": "LA 클리퍼스", "Los Angeles Clippers": "LA 클리퍼스",
  "Nets": "브루클린", "Brooklyn Nets": "브루클린",
  "Hawks": "애틀랜타", "Atlanta Hawks": "애틀랜타",
  "Kings": "새크라멘토", "Sacramento Kings": "새크라멘토",
  "Pistons": "디트로이트", "Detroit Pistons": "디트로이트",
  "Rockets": "휴스턴", "Houston Rockets": "휴스턴",
  "Raptors": "토론토", "Toronto Raptors": "토론토",
  "Magic": "올랜도", "Orlando Magic": "올랜도",
  "Trail Blazers": "포틀랜드", "Portland Trail Blazers": "포틀랜드",
  "Hornets": "샬럿", "Charlotte Hornets": "샬럿",
  "Grizzlies": "멤피스", "Memphis Grizzlies": "멤피스",
  "Jazz": "유타", "Utah Jazz": "유타",
  "Wizards": "워싱턴", "Washington Wizards": "워싱턴",
  "Pelicans": "뉴올리언스", "New Orleans Pelicans": "뉴올리언스",
  "Pacers": "인디애나", "Indiana Pacers": "인디애나",
  // EPL
  "Manchester City": "맨시티", "Man City": "맨시티",
  "Arsenal": "아스널",
  "Liverpool": "리버풀",
  "Tottenham Hotspur": "토트넘", "Tottenham": "토트넘",
  "Manchester United": "맨유", "Man United": "맨유",
  "Chelsea": "첼시",
  "Newcastle United": "뉴캐슬", "Newcastle": "뉴캐슬",
  "Aston Villa": "아스톤 빌라",
  "Brighton & Hove Albion": "브라이튼", "Brighton": "브라이튼",
  "West Ham United": "웨스트햄", "West Ham": "웨스트햄",
  "Bournemouth": "본머스", "AFC Bournemouth": "본머스",
  "Wolverhampton Wanderers": "울버햄튼", "Wolves": "울버햄튼",
  "Crystal Palace": "크리스탈 팰리스", "C Palace": "크리스탈 팰리스",
  "Brentford": "브렌트포드",
  "Fulham": "풀럼",
  "Everton": "에버턴",
  "Nottingham Forest": "노팅엄", "Nottm Forest": "노팅엄",
  "Leicester City": "레스터", "Leicester": "레스터",
  "Ipswich Town": "입스위치", "Ipswich": "입스위치",
  "Southampton": "사우샘프턴",
  "Sunderland": "선덜랜드",
  "Leeds United": "리즈", "Leeds": "리즈",
  "Burnley": "번리",
  "Hull City": "헐 시티", "Hull": "헐 시티",
  "Coventry City": "코번트리", "Coventry": "코번트리",
  "Stoke City": "스토크시티", "Stoke": "스토크시티",
  "Swansea City": "스완지시티", "Swansea": "스완지시티",
  "Watford": "왓포드",
  "West Bromwich Albion": "웨스트브롬위치", "West Brom": "웨스트브롬위치", "West Bromwich": "웨스트브롬위치",
  "Norwich City": "노리치시티", "Norwich": "노리치시티",
  "Middlesbrough": "미들즈브러", "Boro": "미들즈브러",
  "Huddersfield Town": "허더스필드", "Huddersfield": "허더스필드",
  "Cardiff City": "카디프시티", "Cardiff": "카디프시티",
  "Sheffield United": "셰필드 유나이티드", "Sheffield Utd": "셰필드 유나이티드",
  "Queens Park Rangers": "QPR", "QPR": "QPR",
  // MLB
  "Dodgers": "LA 다저스", "Los Angeles Dodgers": "LA 다저스",
  "Yankees": "뉴욕 양키스", "New York Yankees": "뉴욕 양키스",
  "Padres": "샌디에이고", "San Diego Padres": "샌디에이고",
  "Mets": "뉴욕 메츠", "New York Mets": "뉴욕 메츠",
  "Braves": "애틀랜타", "Atlanta Braves": "애틀랜타",
  "Phillies": "필라델피아", "Philadelphia Phillies": "필라델피아",
  "Astros": "휴스턴", "Houston Astros": "휴스턴",
  "Texas Rangers": "텍사스",
  "Orioles": "볼티모어", "Baltimore Orioles": "볼티모어",
  "Mariners": "시애틀", "Seattle Mariners": "시애틀",
  "Red Sox": "보스턴 레드삭스", "Boston Red Sox": "보스턴 레드삭스",
  "Cubs": "시카고 컵스", "Chicago Cubs": "시카고 컵스",
  "White Sox": "시카고 화이트삭스", "Chicago White Sox": "시카고 화이트삭스",
  "Cardinals": "세인트루이스", "St. Louis Cardinals": "세인트루이스",
  "Giants": "SF 자이언츠", "San Francisco Giants": "SF 자이언츠",
  "Athletics": "오클랜드", "Oakland Athletics": "오클랜드", "A's": "오클랜드",
  "Tigers": "디트로이트 타이거스", "Detroit Tigers": "디트로이트 타이거스",
  "Twins": "미네소타", "Minnesota Twins": "미네소타",
  "Blue Jays": "토론토", "Toronto Blue Jays": "토론토",
  "Rays": "탬파베이", "Tampa Bay Rays": "탬파베이",
  "Guardians": "클리블랜드", "Cleveland Guardians": "클리블랜드",
  "Royals": "캔자스시티", "Kansas City Royals": "캔자스시티",
  "Angels": "LA 에인절스", "Los Angeles Angels": "LA 에인절스",
  "Nationals": "워싱턴", "Washington Nationals": "워싱턴",
  "Brewers": "밀워키", "Milwaukee Brewers": "밀워키",
  "Reds": "신시내티", "Cincinnati Reds": "신시내티",
  "Pirates": "피츠버그", "Pittsburgh Pirates": "피츠버그",
  "Rockies": "콜로라도", "Colorado Rockies": "콜로라도",
  "Diamondbacks": "애리조나", "Arizona Diamondbacks": "애리조나",
  "Marlins": "마이애미 말린스", "Miami Marlins": "마이애미 말린스",
  // UCL
  "Real Madrid": "레알 마드리드",
  "Barcelona": "바르셀로나",
  "Bayern Munich": "바이에른 뮌헨", "FC Bayern Munich": "바이에른 뮌헨",
  "Paris Saint-Germain": "PSG", "Paris SG": "PSG",
  "Inter Milan": "인테르", "Internazionale": "인테르",
  "Juventus": "유벤투스",
  "AC Milan": "AC 밀란",
  "Atletico Madrid": "아틀레티코", "Atlético de Madrid": "아틀레티코",
  "Borussia Dortmund": "도르트문트", "Dortmund": "도르트문트",
  "Porto": "FC 포르투", "FC Porto": "FC 포르투",
  "Benfica": "벤피카", "SL Benfica": "벤피카",
  "Sporting CP": "스포르팅 CP", "Sporting": "스포르팅 CP",
  "Ajax": "아약스", "AFC Ajax": "아약스",
  "PSV Eindhoven": "PSV",
  "Feyenoord": "페예노르트",
  "Bayer Leverkusen": "레버쿠젠", "Leverkusen": "레버쿠젠",
  "Bodo/Glimt": "보도/글리므트", "FK Bodø/Glimt": "보도/글리므트",
  "Borussia Mönchengladbach": "묀헨글라트바흐",
  "Eintracht Frankfurt": "프랑크푸르트",
  "Napoli": "나폴리", "SSC Napoli": "나폴리",
  "AS Roma": "AS 로마", "Roma": "AS 로마",
  "Lazio": "라치오", "SS Lazio": "라치오",
  "Atalanta": "아탈란타",
  "Fiorentina": "피오렌티나",
  "Sevilla": "세비야", "Sevilla FC": "세비야",
  "Valencia": "발렌시아", "Valencia CF": "발렌시아",
  "Villarreal": "비야레알", "Villarreal CF": "비야레알",
  "Real Sociedad": "레알 소시에다드",
  "Athletic Club": "아틀레틱 빌바오", "Athletic Bilbao": "아틀레틱 빌바오",
  "Celtic": "셀틱", "Celtic FC": "셀틱",
  "Rangers": "레인저스", "Rangers FC": "레인저스",
  "Shakhtar Donetsk": "샤흐타르",
  "Dynamo Kyiv": "디나모 키이우",
  "Red Bull Salzburg": "잘츠부르크", "FC Salzburg": "잘츠부르크",
  "Club Brugge": "클뤼프 브뤼허",
  "Galatasaray": "갈라타사라이",
  "Fenerbahce": "페네르바체",
  "Besiktas": "베식타스",
  "Monaco": "AS 모나코", "AS Monaco": "AS 모나코",
  "Olympique Lyonnais": "리옹", "Lyon": "리옹",
  "Olympique de Marseille": "마르세유", "Marseille": "마르세유",
  "Lille": "릴", "LOSC Lille": "릴",
  "RC Lens": "랑스",
  "Stade Brestois 29": "브레스트", "Brest": "브레스트",
  "Young Boys": "영 보이스", "BSC Young Boys": "영 보이스",
  "Sturm Graz": "슈투름 그라츠",
  "Slavia Prague": "슬라비아 프라하",
  "Sparta Prague": "스파르타 프라하",
  "Girona": "지로나", "Girona FC": "지로나",
  "AEK Athens": "AEK 아테네", "AEK": "AEK 아테네",
  "Ajax Amsterdam": "아약스",
  "Atlético Madrid": "아틀레티코", "Atlético": "아틀레티코",
  "Dinamo Zagreb": "디나모 자그레브",
  "F.C. København": "FC 코펜하겐", "København": "FC 코펜하겐",
  "FK Qarabag": "카라바흐", "Qarabag": "카라바흐",
  "Hapoel Be'er": "하포엘 베르셰바",
  "Kairat Almaty": "카이라트 알마티",
  "LASK Linz": "LASK 린츠",
  "Levski Sofia": "레프스키 소피아",
  "NEC Nijmegen": "NEC 네이메헌",
  "NK Celje": "첼레",
  "Olympiacos": "올림피아코스",
  "Pafos": "파포스",
  "Sabah FK": "사바흐 FK", "SABAH FK": "사바흐 FK",
  "Slovan Bratislava": "슬로반 브라티슬라바", "S Bratislava": "슬로반 브라티슬라바",
  "Union St.-Gilloise": "위니옹 생질루아즈", "Union SG": "위니옹 생질루아즈",
  "Viking FK": "비킹 FK"
};

function getKoName(engName, tab) {
  if (!engName) return '?';
  if (engName === 'Spurs') return tab === 'nba' ? '샌안토니오' : '토트넘';
  if (engName === 'Rangers') return tab === 'mlb' ? '텍사스' : '레인저스';
  return TEAM_KO_MAP[engName] || engName;
}

function getKoTeamName(team, tab) {
  if (!team) return '?';
  const candidates = [team.displayName, team.name, team.shortDisplayName, team.location, team.abbreviation].filter(Boolean);
  for (const candidate of candidates) {
    const translated = getKoName(candidate, tab);
    if (translated !== candidate) return translated;
  }
  return candidates[0] || '?';
}

const TBL_STAND_EP = {
  nba: 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings',
  epl: 'https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings',
  ucl: 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.champions/standings'
};
const TBL_STATS_EP = {
  epl: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/statistics',
  ucl: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/statistics'
};
const TBL_MLB_LEADERS_URL = (year, leagueId) => ({
  hitting: `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns,battingAverage,runsBattedIn,stolenBases&sportId=1&statGroup=hitting&season=${year}&leagueId=${leagueId}&limit=10`,
  pitching: `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=earnedRunAverage,wins,strikeouts,saves&sportId=1&statGroup=pitching&season=${year}&leagueId=${leagueId}&limit=10`
});
const TBL_NBA_LEADERS = [
  { key: 'points', title: '득점 순위', label: 'PTS', group: 'offensive', stat: 'avgPoints', sort: 'offensive.avgPoints' },
  { key: 'rebounds', title: '리바운드 순위', label: 'REB', group: 'general', stat: 'avgRebounds', sort: 'general.avgRebounds' },
  { key: 'assists', title: '어시스트 순위', label: 'AST', group: 'offensive', stat: 'avgAssists', sort: 'offensive.avgAssists' },
  { key: 'steals', title: '스틸 순위', label: 'STL', group: 'defensive', stat: 'avgSteals', sort: 'defensive.avgSteals' },
  { key: 'blocks', title: '블록 순위', label: 'BLK', group: 'defensive', stat: 'avgBlocks', sort: 'defensive.avgBlocks' }
];
const TBL_NBA_LEADERS_URL = (seasonEndYear, sort) =>
  `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?region=us&lang=en&contentorigin=espn&isqualified=true&page=1&limit=10&sort=${encodeURIComponent(sort + ':desc')}&season=${seasonEndYear}&seasontype=2`;
const TBL_SEASON_YEARS = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 1 - i);
const TBL_STAT_COLLAPSED_LIMIT = 5;

function tblCurrentNbaSeasonStartYear() {
  const now = new Date();
  return now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
}
function tblCurrentUclSeasonStartYear() {
  const now = new Date();
  return now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
}

async function tblFetch(url) {
  try { return await fetchJson(url); } catch { return null; }
}

function tblSeasonOptions(sport) {
  const currentStart = sport === 'nba' ? tblCurrentNbaSeasonStartYear()
    : sport === 'ucl' ? tblCurrentUclSeasonStartYear()
    : sport === 'f1' ? new Date().getFullYear() : null;
  const years = currentStart
    ? sport === 'f1' ? Array.from({ length: Math.max(0, currentStart - 2023) }, (_, i) => currentStart - 1 - i) : Array.from({ length: 11 }, (_, i) => currentStart - 1 - i)
    : TBL_SEASON_YEARS;
  const isCalendarSeason = sport === 'mlb' || sport === 'f1';
  return '<option value="">현재 시즌</option>' + years.map(year => {
    const label = isCalendarSeason ? `${year} 시즌` : `${year}-${String(year + 1).slice(-2)} 시즌`;
    return `<option value="${year}">${label}</option>`;
  }).join('');
}

function syncTableSeasonSelect(sport) {
  const bar = $('#tableSeasonBar');
  const select = $('#tableSeasonSelect');
  const supported = ['nba', 'mlb', 'epl', 'ucl', 'f1'].includes(sport);
  bar.hidden = !supported;
  if (supported) select.innerHTML = tblSeasonOptions(sport);
  select.value = state.table.season[sport] || '';
}

function enterTableView() {
  syncTableSeasonSelect(state.sport);
  if (state.table.cache[state.sport]) renderTable(state.sport);
  else loadTable(state.sport);
}

function adaptMlbStandings(data) {
  const children = (data?.records || []).map(record => ({
    standings: {
      entries: (record.teamRecords || []).map(item => ({
        team: {
          id: item.team?.id,
          name: item.team?.name,
          displayName: item.team?.name,
          shortDisplayName: item.team?.teamName || item.team?.shortName || item.team?.name,
          abbreviation: item.team?.abbreviation,
          logo: item.team?.id ? `https://www.mlbstatic.com/team-logos/${item.team.id}.svg` : '',
          logos: item.team?.id ? [{ href: `https://www.mlbstatic.com/team-logos/${item.team.id}.svg` }] : []
        },
        stats: [
          { name: 'gamesPlayed', displayValue: String(item.gamesPlayed ?? '') },
          { name: 'wins', displayValue: String(item.wins ?? item.leagueRecord?.wins ?? '') },
          { name: 'losses', displayValue: String(item.losses ?? item.leagueRecord?.losses ?? '') },
          { name: 'winPercent', displayValue: item.winningPercentage ?? item.leagueRecord?.pct ?? '' }
        ]
      }))
    }
  }));
  return children.length ? { children } : null;
}

function nbaAthleteStatValue(response, row, groupName, statName) {
  const group = response?.categories?.find(category => category.name === groupName);
  const statIndex = group?.names?.indexOf(statName) ?? -1;
  if (statIndex < 0) return '-';
  const values = row?.categories?.find(category => category.name === groupName);
  return values?.totals?.[statIndex] ?? values?.values?.[statIndex] ?? '-';
}

function getRankClass(rank, tab, total) {
  if (tab === 'epl') {
    if (rank <= 4) return 'sp-row-b';
    if (rank === 5) return 'sp-row-g';
    if (rank === 6) return 'sp-row-t';
    if (rank >= total - 2) return 'sp-row-r';
  } else if (tab === 'nba') {
    if (rank <= 6) return 'sp-row-b';
    if (rank <= 10) return 'sp-row-y';
  } else if (tab === 'ucl') {
    if (rank <= 8) return 'sp-row-b';
    if (rank <= 24) return 'sp-row-y';
    return 'sp-row-r';
  } else if (tab === 'ucl-group') {
    if (rank <= 2) return 'sp-row-b';
    if (rank === 3) return 'sp-row-g';
  } else if (tab === 'wc') {
    if (rank <= 2) return 'sp-row-b';
    if (rank === 3) return 'sp-row-y';
    if (rank === 4) return 'sp-row-r';
  }
  return '';
}

function tblStat(entry, name) {
  const x = (entry.stats || []).find(item => item.name === name);
  return x ? x.displayValue : '0';
}
function tblGamesPlayed(entry) {
  const gameStat = (entry.stats || []).find(item => item.name === 'gamesPlayed');
  if (gameStat?.displayValue != null && gameStat.displayValue !== '') return gameStat.displayValue;
  return Number(tblStat(entry, 'wins')) + Number(tblStat(entry, 'losses'));
}
const tblPct = t => parseFloat((t.stats || []).find(x => x.name === 'winPercent')?.displayValue || 0) || 0;

function buildStandingsRows(entries, tab) {
  const total = entries.length;
  return entries.map((e, i) => {
    const rank = i + 1;
    const teamName = getKoTeamName(e.team, tab);
    const logoUrl = e.team?.logos?.[0]?.href || '';
    const logoImg = logoUrl ? `<img src="${esc(logoUrl)}" alt="">` : '';
    const rowClass = getRankClass(rank, tab, total);
    const teamCell = `<td><div class="sp-team-cell">${logoImg}${esc(teamName)}</div></td>`;
    const rankEl = `<span class="sp-rank-num">${rank}</span>`;
    if (tab === 'epl' || tab === 'ucl' || tab === 'ucl-group' || tab === 'wc') {
      return `<tr class="${rowClass}"><td>${rankEl}</td>${teamCell}<td>${tblGamesPlayed(e)}</td><td>${tblStat(e, 'wins')}</td><td>${tblStat(e, 'ties')}</td><td>${tblStat(e, 'losses')}</td><td>${tblStat(e, 'points')}</td><td>${tblStat(e, 'pointDifferential')}</td></tr>`;
    }
    const pct = tblStat(e, 'winPercent') || tblStat(e, 'pointDifferential') || '-';
    return `<tr class="${rowClass}"><td>${rankEl}</td>${teamCell}<td>${tblGamesPlayed(e)}</td><td>${tblStat(e, 'wins')}</td><td>${tblStat(e, 'losses')}</td><td>${pct}</td></tr>`;
  }).join('');
}

function tblStandings(data, tab) {
  if (tab === 'nba' && data.children) {
    return data.children.map((conf, idx) => {
      const rawName = conf.name || '';
      let confName = '컨퍼런스';
      if (rawName.includes('Eastern')) confName = '동부 컨퍼런스';
      if (rawName.includes('Western')) confName = '서부 컨퍼런스';
      const entries = (conf.standings?.entries || []).slice().sort((a, b) => tblPct(b) - tblPct(a));
      const isLast = idx === data.children.length - 1;
      return `<div class="sp-standings-wrap">
        <div class="sp-section-title">순위표 - ${confName}</div>
        <table class="sp-standings-table"><thead><tr><th>#</th><th>팀</th><th>경기</th><th>승</th><th>패</th><th>승률</th></tr></thead>
        <tbody>${buildStandingsRows(entries, tab)}</tbody></table>
        ${isLast ? `<div class="sp-legend"><span class="lg-b">플레이오프</span><span class="lg-y">플레이인</span></div>` : ''}
      </div>`;
    }).join('');
  }
  if (tab === 'mlb' && data.children) {
    const MLB_DIVS = [
      { lg: 'AL 아메리칸리그', divs: [
        { name: '▸ 동부지구', abbs: ['NYY', 'BOS', 'TOR', 'BAL', 'TB'] },
        { name: '▸ 중부지구', abbs: ['CHW', 'CWS', 'CLE', 'DET', 'KC', 'MIN'] },
        { name: '▸ 서부지구', abbs: ['HOU', 'LAA', 'ATH', 'OAK', 'SEA', 'TEX'] }
      ] },
      { lg: 'NL 내셔널리그', divs: [
        { name: '▸ 동부지구', abbs: ['ATL', 'MIA', 'NYM', 'PHI', 'WSH'] },
        { name: '▸ 중부지구', abbs: ['CHC', 'CIN', 'MIL', 'PIT', 'STL'] },
        { name: '▸ 서부지구', abbs: ['AZ', 'ARI', 'LAD', 'SD', 'SF', 'COL'] }
      ] }
    ];
    const seen = new Set();
    const allEntries = [];
    const collect = entries => (entries || []).forEach(e => {
      const key = e.team?.id || e.team?.abbreviation;
      if (key && !seen.has(key)) { seen.add(key); allEntries.push(e); }
    });
    data.children.forEach(c => { collect(c.standings?.entries); (c.children || []).forEach(div => collect(div.standings?.entries)); });
    if (!allEntries.length) return `<div class="sp-state-box"><span>순위 데이터를 불러올 수 없습니다</span></div>`;
    const makeDivTable = (title, entries) => {
      if (!entries.length) return '';
      return `<div class="sp-standings-wrap"><div class="sp-div-title">${title}</div>
        <table class="sp-standings-table"><thead><tr><th>#</th><th>팀</th><th>경기</th><th>승</th><th>패</th><th>승률</th></tr></thead>
        <tbody>${buildStandingsRows(entries, tab)}</tbody></table></div>`;
    };
    let html = '';
    MLB_DIVS.forEach(({ lg, divs }) => {
      html += `<div class="sp-lg-header">${lg}</div>`;
      divs.forEach(({ name, abbs }) => {
        const divEntries = allEntries.filter(e => abbs.includes((e.team?.abbreviation || '').toUpperCase()));
        html += makeDivTable(name, divEntries.slice().sort((a, b) => tblPct(b) - tblPct(a)));
      });
    });
    return html || `<div class="sp-state-box"><span>순위 데이터를 불러올 수 없습니다</span></div>`;
  }
  if (tab === 'ucl') {
    const groups = (data.children || [])
      .map(child => ({ name: child.name || '순위표', entries: child.standings?.entries || [] }))
      .filter(group => group.entries.length);
    if (!groups.length && data.standings?.entries?.length) {
      groups.push({ name: data.standings.displayName || '순위표', entries: data.standings.entries });
    }
    if (!groups.length) return '';
    const isGroupStage = groups.length > 1 && groups.every(group => group.entries.length <= 8);
    const sortEntries = entries => entries.slice().sort((a, b) => {
      const stat = (entry, name) => parseFloat((entry.stats || []).find(item => item.name === name)?.displayValue || 0);
      return stat(b, 'points') - stat(a, 'points') || stat(b, 'pointDifferential') - stat(a, 'pointDifferential');
    });
    let html = groups.map(group => `<div class="sp-standings-wrap">
      <div class="sp-section-title">${esc(group.name)}</div>
      <table class="sp-standings-table"><thead><tr><th>#</th><th>팀</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>승점</th><th>득실</th></tr></thead>
      <tbody>${buildStandingsRows(sortEntries(group.entries), isGroupStage ? 'ucl-group' : 'ucl')}</tbody></table></div>`).join('');
    html += isGroupStage
      ? `<div class="sp-legend"><span class="lg-b">16강 진출</span><span class="lg-g">UEL 이동</span></div>`
      : `<div class="sp-legend"><span class="lg-b">16강 직행</span><span class="lg-y">녹아웃 PO</span><span class="lg-r">탈락</span></div>`;
    return html;
  }
  let entries = [];
  if (data.children?.length) data.children.forEach(child => { if (child.standings?.entries) entries = entries.concat(child.standings.entries); });
  else if (data.standings?.entries) entries = data.standings.entries;
  if (!entries.length) return '';
  entries = entries.slice().sort((a, b) => {
    const g = (t, n) => { const x = (t.stats || []).find(s => s.name === n); return x ? parseFloat(x.displayValue) || 0 : 0; };
    if (tab === 'epl') { const d = g(b, 'points') - g(a, 'points'); return d || g(b, 'pointDifferential') - g(a, 'pointDifferential'); }
    return g(b, 'winPercent') - g(a, 'winPercent');
  });
  const headHtml = tab === 'epl'
    ? `<tr><th>#</th><th>팀</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>승점</th><th>득실</th></tr>`
    : `<tr><th>#</th><th>팀</th><th>경기</th><th>승</th><th>패</th><th>승률</th></tr>`;
  const legend = tab === 'epl'
    ? `<div class="sp-legend"><span class="lg-b">UCL</span><span class="lg-g">UEL</span><span class="lg-t">UECL</span><span class="lg-r">강등</span></div>`
    : `<div class="sp-legend"><span class="lg-b">플레이오프</span><span class="lg-y">플레이인</span></div>`;
  return `<div class="sp-standings-wrap"><div class="sp-section-title">순위표</div>
    <table class="sp-standings-table"><thead>${headHtml}</thead><tbody>${buildStandingsRows(entries, tab)}</tbody></table>${legend}</div>`;
}

function tblViewTabs(sport) {
  const v = state.table.view[sport];
  const btn = (key, label) => `<button type="button" class="sp-mlb-league-tab ${v === key ? 'active' : ''}" data-tblview="${key}">${label}</button>`;
  if (sport === 'f1') return `<div class="sp-mlb-league-tabs sp-mlb-view-tabs" role="tablist">${btn('drivers', '드라이버 순위')}${btn('constructors', '팀 순위')}</div>`;
  let tabs = btn('standings', '팀 순위') + btn('stats', '선수 스탯');
  if (sport === 'nba' || sport === 'mlb') tabs += btn('playoffs', '플레이오프');
  if (sport === 'ucl') tabs += btn('tournament', '토너먼트');
  return `<div class="sp-mlb-league-tabs sp-mlb-view-tabs" role="tablist">${tabs}</div>`;
}

function tblMlbLeagueTabs() {
  const lg = state.table.mlbLeague;
  return `<div class="sp-mlb-league-tabs" role="tablist">
    <button type="button" class="sp-mlb-league-tab ${lg === 'al' ? 'active' : ''}" data-tblleague="al">아메리칸리그</button>
    <button type="button" class="sp-mlb-league-tab ${lg === 'nl' ? 'active' : ''}" data-tblleague="nl">내셔널리그</button>
  </div>`;
}

function tblMoreBtn(key, totalCount, label) {
  if (totalCount <= TBL_STAT_COLLAPSED_LIMIT) return '';
  const expanded = state.table.expanded.has(key);
  return `<button type="button" class="dash-mover-more" data-tblmore="${key}">${expanded ? '간략히 보기' : label} <span>${expanded ? '−' : '+'}</span></button>`;
}

function tblStatTableHtml(title, headLabel, rows, moreBtn) {
  return `<div class="sp-standings-wrap"><div class="sp-section-title">${title}</div>
    <table class="sp-standings-table sp-stat-table"><colgroup><col class="sp-stat-col-rank"><col class="sp-stat-col-player"><col class="sp-stat-col-team"><col class="sp-stat-col-value"></colgroup>
    <thead><tr><th>#</th><th>선수</th><th>팀</th><th>${headLabel}</th></tr></thead><tbody>${rows}</tbody></table>
    ${moreBtn}</div>`;
}

function tblSoccerStatLeaders(stats, tab) {
  if (!stats?.length) return '';
  const WANTED = { goalsLeaders: '득점 순위', assistsLeaders: '도움 순위' };
  let html = '';
  stats.forEach(cat => {
    const title = WANTED[cat.name];
    if (!title) return;
    const all = cat.leaders || [];
    if (!all.length) return;
    const key = `tbl-${tab}-${cat.name}`;
    const top = state.table.expanded.has(key) ? all : all.slice(0, TBL_STAT_COLLAPSED_LIMIT);
    const rows = top.map((l, i) => {
      const a = l.athlete || {};
      const teamName = getKoTeamName(a.team, tab);
      const logoUrl = a.team?.logos?.[0]?.href;
      const logoImg = logoUrl ? `<img src="${esc(logoUrl)}" alt="">` : '';
      return `<tr><td>${i + 1}</td><td class="sp-stat-name">${esc(a.shortName || a.displayName || '-')}</td><td class="sp-stat-team"><div>${logoImg}${esc(teamName)}</div></td><td class="sp-stat-val">${esc(l.value ?? '')}</td></tr>`;
    }).join('');
    html += tblStatTableHtml(title, esc(cat.abbreviation || ''), rows, tblMoreBtn(key, all.length, '더보기'));
  });
  return html;
}

function tblNbaStatLeaders(nbaLeaders) {
  if (!nbaLeaders?.length) return '';
  return nbaLeaders.map(item => {
    const all = item.data?.athletes || [];
    if (!all.length) return '';
    const key = `tbl-nba-${item.key}`;
    const visible = state.table.expanded.has(key) ? all : all.slice(0, TBL_STAT_COLLAPSED_LIMIT);
    const rows = visible.map((row, index) => {
      const athlete = row.athlete || {};
      const teamName = getKoName(athlete.teamName || athlete.teamShortName || '-', 'nba');
      const logoUrl = athlete.teamLogos?.[0]?.href || '';
      const logo = logoUrl ? `<img src="${esc(logoUrl)}" alt="">` : '';
      const value = nbaAthleteStatValue(item.data, row, item.group, item.stat);
      return `<tr><td>${index + 1}</td><td class="sp-stat-name">${esc(athlete.shortName || athlete.displayName || '-')}</td><td class="sp-stat-team"><div>${logo}${esc(teamName)}</div></td><td class="sp-stat-val">${esc(value)}</td></tr>`;
    }).join('');
    return tblStatTableHtml(item.title, item.label, rows, tblMoreBtn(key, all.length, '선수 더보기'));
  }).join('');
}

function tblMlbStatLeaders(mlbLeaders) {
  const WANTED = {
    battingAverage: { title: '타율 순위', label: 'AVG' },
    homeRuns: { title: '홈런 순위', label: 'HR' },
    runsBattedIn: { title: '타점 순위', label: 'RBI' },
    stolenBases: { title: '도루 순위', label: 'SB' },
    earnedRunAverage: { title: '평균자책 순위', label: 'ERA' },
    wins: { title: '다승 순위', label: 'W' },
    strikeouts: { title: '탈삼진 순위', label: 'SO' },
    saves: { title: '세이브 순위', label: 'SV' }
  };
  const HITTING = ['battingAverage', 'homeRuns', 'runsBattedIn', 'stolenBases'];
  const PITCHING = ['earnedRunAverage', 'wins', 'strikeouts', 'saves'];
  const lg = state.table.mlbLeague;
  const categories = new Map((mlbLeaders?.[lg] || []).map(cat => [cat.leaderCategory, cat]));
  const renderCat = category => {
    const cat = categories.get(category);
    const cfg = WANTED[category];
    if (!cat || !cfg) return '';
    const all = cat.leaders || [];
    if (!all.length) return '';
    const key = `tbl-mlb-${lg}-${cat.leaderCategory}`;
    const top = state.table.expanded.has(key) ? all : all.slice(0, TBL_STAT_COLLAPSED_LIMIT);
    const rows = top.map((l, i) => {
      const p = l.person || {};
      const shortName = p.firstName ? `${p.firstName[0]}. ${p.lastName}` : (p.fullName || '-');
      return `<tr><td>${l.rank ?? i + 1}</td><td class="sp-stat-name">${esc(shortName)}</td><td class="sp-stat-team">${esc(getKoName(l.team?.name, 'mlb'))}</td><td class="sp-stat-val">${esc(l.value ?? '')}</td></tr>`;
    }).join('');
    return tblStatTableHtml(cfg.title, cfg.label, rows, tblMoreBtn(key, all.length, '더보기'));
  };
  return tblMlbLeagueTabs()
    + `<div class="sp-mlb-stat-group">타자</div>` + HITTING.map(renderCat).join('')
    + `<div class="sp-mlb-stat-group">투수</div>` + PITCHING.map(renderCat).join('');
}

function tblPlayoffTeamLabel(team, tab, logoUrl) {
  const resolved = logoUrl || team?.logo || team?.logos?.[0]?.href;
  const logo = resolved ? `<img src="${esc(resolved)}" alt="">` : '<span class="sp-ucl-team-logo-fallback">?</span>';
  return `<span class="sp-ucl-team-label">${logo}<span>${esc(getKoTeamName(team, tab))}</span></span>`;
}

function tblMatchEvents(comp, home) {
  const details = comp.details || [];
  const homeId = home?.team?.id;
  const rows = details.filter(d => d.scoringPlay || d.redCard).map(d => ({
    minute: d.clock?.displayValue || '',
    minuteVal: d.clock?.value ?? 0,
    isHome: d.team?.id === homeId,
    player: d.athletesInvolved?.[0]?.displayName || d.athletesInvolved?.[0]?.shortName || (d.redCard ? '선수 정보 없음' : '득점자 정보 없음'),
    isRed: !!d.redCard, isOwnGoal: !!d.ownGoal, isPenalty: !!d.penaltyKick
  })).sort((a, b) => a.minuteVal - b.minuteVal);
  if (!rows.length) return '';
  const rowHtml = rows.map(r => {
    const icon = r.isRed ? '🟥' : (r.isOwnGoal ? '⚽(자책)' : '⚽');
    const pk = r.isPenalty ? ' (PK)' : '';
    return `<div class="sp-match-event ${r.isHome ? 'home' : 'away'}"><span class="sp-event-minute">${esc(r.minute)}</span><span class="sp-event-icon">${icon}</span><span class="sp-event-player">${esc(r.player + pk)}</span></div>`;
  }).join('');
  return `<div class="sp-match-events">${rowHtml}</div>`;
}

function tblUclTournament(data) {
  const ROUND_META = [
    ['knockout-round-playoffs', '녹아웃 플레이오프'], ['round-of-16', '16강'],
    ['quarterfinals', '8강'], ['semifinals', '4강'], ['final', '결승']
  ];
  const events = (data?.events || []).filter(e => ROUND_META.some(([slug]) => slug === e.season?.slug));
  if (!events.length) return `<div class="sp-state-box sp-stat-empty"><span>토너먼트 대진 전입니다.</span><span>대진이 확정되면 라운드별로 표시됩니다.</span></div>`;
  const tn = c => getKoTeamName(c?.team, 'ucl');
  const teamLabel = c => {
    const logoUrl = c?.team?.logo || c?.team?.logos?.[0]?.href;
    const logo = logoUrl ? `<img src="${esc(logoUrl)}" alt="">` : '<span class="sp-ucl-team-logo-fallback">?</span>';
    return `<span class="sp-ucl-team-label">${logo}<span>${esc(tn(c))}</span></span>`;
  };
  const eventTeamIds = event => (event.competitions?.[0]?.competitors || []).map(c => String(c.team?.id || c.id || '')).filter(Boolean).sort();
  return ROUND_META.map(([slug, title]) => {
    const roundEvents = events.filter(e => e.season?.slug === slug);
    if (!roundEvents.length) return '';
    const ties = new Map();
    roundEvents.forEach(event => {
      const key = eventTeamIds(event).join('-') || String(event.id);
      if (!ties.has(key)) ties.set(key, []);
      ties.get(key).push(event);
    });
    const cards = [...ties.values()].sort((a, b) => new Date(a[0].date) - new Date(b[0].date)).map(tieEvents => {
      const matches = tieEvents.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
      const decidingEvent = matches[matches.length - 1];
      const decidingComp = decidingEvent.competitions?.[0] || {};
      const decidingTeams = decidingComp.competitors || [];
      const home = decidingTeams.find(t => t.homeAway === 'home') || decidingTeams[0];
      const away = decidingTeams.find(t => t.homeAway === 'away') || decidingTeams[1];
      const seriesTeams = decidingComp.series?.competitors || [];
      const seriesById = new Map(seriesTeams.map(t => [String(t.id), t]));
      const ceId = c => String(c?.team?.id || c?.id || '');
      const winner = decidingTeams.find(t => seriesById.get(ceId(t))?.winner) || decidingTeams.find(t => t.winner);
      const matchRows = matches.map((event, index) => {
        const comp = event.competitions?.[0] || {};
        const teams = comp.competitors || [];
        const mh = teams.find(t => t.homeAway === 'home') || teams[0];
        const ma = teams.find(t => t.homeAway === 'away') || teams[1];
        const st = event.status?.type?.state;
        const date = new Date(event.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
        const leg = comp.leg?.displayValue === '1st Leg' ? '1차전' : comp.leg?.displayValue === '2nd Leg' ? '2차전' : matches.length > 1 ? `${index + 1}차전` : '단판';
        const score = st === 'pre' ? `<span class="sp-ucl-vs">VS</span>` : `<strong>${esc(mh?.score ?? '-')} : ${esc(ma?.score ?? '-')}</strong>`;
        const detailsHtml = st === 'pre' ? '' : tblMatchEvents(comp, mh);
        return `<div class="sp-ucl-match-block"><div class="sp-ucl-match-row">
          <span class="sp-ucl-match-meta">${esc(date)} · ${leg}</span>
          <span>${esc(tn(mh))}</span>${score}<span>${esc(tn(ma))}</span>
        </div>${detailsHtml}</div>`;
      }).join('');
      let resultHtml = '';
      if (decidingComp.series?.completed && seriesTeams.length) {
        const ha = seriesById.get(ceId(home))?.aggregateScore;
        const aa = seriesById.get(ceId(away))?.aggregateScore;
        resultHtml = `<div class="sp-ucl-tie-result"><span>합계 ${esc(ha)} : ${esc(aa)}</span><strong>${esc(tn(winner))} 진출</strong></div>`;
      } else if (slug === 'final' && decidingEvent.status?.type?.state === 'post' && winner) {
        resultHtml = `<div class="sp-ucl-tie-result"><strong>${esc(tn(winner))} 우승</strong></div>`;
      }
      return `<article class="sp-ucl-tie-card"><div class="sp-ucl-tie-title">${teamLabel(home)}<b>VS</b>${teamLabel(away)}</div>${matchRows}${resultHtml}</article>`;
    }).join('');
    return `<section class="sp-ucl-round"><div class="sp-section-title">${title}</div>${cards}</section>`;
  }).join('');
}

function tblNbaPlayoffs(data) {
  const ROUND_META = [
    ['play-in', '플레이인'], ['first-round', '1라운드'], ['semifinals', '컨퍼런스 준결승'],
    ['conference-finals', '컨퍼런스 결승'], ['nba-finals', 'NBA 파이널']
  ];
  const allEvents = (data?.events || []).filter(e => ['play-in-season', 'post-season'].includes(e.season?.slug));
  if (!allEvents.length) return `<div class="sp-state-box sp-stat-empty"><span>플레이오프 대진 전입니다.</span><span>대진이 확정되면 라운드별로 표시됩니다.</span></div>`;
  const roundKey = event => {
    const headline = event.competitions?.[0]?.notes?.[0]?.headline || '';
    if (headline.includes('Play-In')) return 'play-in';
    if (headline.includes('1st Round')) return 'first-round';
    if (headline.includes('Semifinals')) return 'semifinals';
    if (headline.includes('East Finals') || headline.includes('West Finals')) return 'conference-finals';
    if (headline.includes('NBA Finals')) return 'nba-finals';
    return '';
  };
  const cid = c => String(c?.team?.id || c?.id || '');
  return ROUND_META.map(([key, title]) => {
    const roundEvents = allEvents.filter(e => roundKey(e) === key);
    if (!roundEvents.length) return '';
    const seriesMap = new Map();
    roundEvents.forEach(event => {
      const competitors = event.competitions?.[0]?.competitors || [];
      const seriesKey = key === 'play-in' ? String(event.id) : competitors.map(cid).filter(Boolean).sort().join('-');
      if (!seriesMap.has(seriesKey)) seriesMap.set(seriesKey, []);
      seriesMap.get(seriesKey).push(event);
    });
    const cards = [...seriesMap.entries()].map(([seriesKey, seriesEvents]) => {
      const games = seriesEvents.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
      const latest = games[games.length - 1];
      const latestComp = latest.competitions?.[0] || {};
      const teams = latestComp.competitors || [];
      const home = teams.find(t => t.homeAway === 'home') || teams[0];
      const away = teams.find(t => t.homeAway === 'away') || teams[1];
      const seriesById = new Map((latestComp.series?.competitors || []).map(t => [String(t.id), Number(t.wins || 0)]));
      const homeWins = seriesById.get(cid(home)) ?? 0;
      const awayWins = seriesById.get(cid(away)) ?? 0;
      const seriesWinner = latestComp.series?.completed
        ? (homeWins > awayWins ? home : away)
        : key === 'play-in' && latest.status?.type?.state === 'post' ? teams.find(t => t.winner) : null;
      const expandKey = `nba-${key}-${seriesKey}`;
      const expanded = state.table.playoffExpanded.has(expandKey);
      const visibleGames = expanded || games.length <= 3 ? games : games.slice(-3);
      const gameRows = visibleGames.map(event => {
        const gameNumber = games.indexOf(event) + 1;
        const comp = event.competitions?.[0] || {};
        const et = comp.competitors || [];
        const gh = et.find(t => t.homeAway === 'home') || et[0];
        const ga = et.find(t => t.homeAway === 'away') || et[1];
        const scheduled = event.status?.type?.state === 'pre';
        const gd = new Date(event.date);
        const date = `${gd.getMonth() + 1}/${gd.getDate()}`;
        const score = scheduled ? 'VS' : `${gh?.score ?? '-'} : ${ga?.score ?? '-'}`;
        return `<div class="sp-ucl-match-row sp-nba-playoff-game">
          <span class="sp-ucl-match-meta">${esc(date)} · ${key === 'play-in' ? '단판' : `${gameNumber}차전`}</span>
          <span>${esc(getKoTeamName(gh?.team, 'nba'))}</span><strong>${esc(score)}</strong><span>${esc(getKoTeamName(ga?.team, 'nba'))}</span>
        </div>`;
      }).join('');
      const moreButton = games.length > 3
        ? `<button type="button" class="sp-playoff-more" data-tblseries="${expandKey}">${expanded ? '간략히 보기' : `이전 경기 포함 ${games.length}경기 전체보기`} <span>${expanded ? '−' : '+'}</span></button>`
        : '';
      const result = seriesWinner
        ? `<strong>${esc(getKoTeamName(seriesWinner.team, 'nba'))} ${key === 'play-in' ? '진출' : '시리즈 승리'}</strong>`
        : `<strong>${homeWins} : ${awayWins}</strong>`;
      return `<article class="sp-ucl-tie-card sp-nba-playoff-card">
        <div class="sp-ucl-tie-title">${tblPlayoffTeamLabel(home?.team, 'nba')}<b>VS</b>${tblPlayoffTeamLabel(away?.team, 'nba')}</div>
        ${gameRows}${moreButton}<div class="sp-ucl-tie-result"><span>${key === 'play-in' ? '단판 결과' : `시리즈 ${homeWins} : ${awayWins}`}</span>${result}</div>
      </article>`;
    }).join('');
    return `<section class="sp-ucl-round"><div class="sp-section-title">${title}</div>${cards}</section>`;
  }).join('');
}

function tblMlbPlayoffs(data) {
  const ROUND_META = [['F', '와일드카드 시리즈'], ['D', '디비전 시리즈'], ['L', '리그 챔피언십 시리즈'], ['W', '월드시리즈']];
  const games = (data?.dates || []).flatMap(d => d.games || []);
  if (!games.length) return `<div class="sp-state-box sp-stat-empty"><span>포스트시즌 대진 전입니다.</span><span>대진이 확정되면 라운드별로 표시됩니다.</span></div>`;
  const teamId = side => String(side?.team?.id || '');
  const teamLogo = side => side?.team?.id ? `https://www.mlbstatic.com/team-logos/${side.team.id}.svg` : '';
  const winTargets = { F: 2, D: 3, L: 4, W: 4 };
  return ROUND_META.map(([gameType, title]) => {
    const roundGames = games.filter(g => g.gameType === gameType);
    if (!roundGames.length) return '';
    const seriesMap = new Map();
    roundGames.forEach(game => {
      const key = [teamId(game.teams?.home), teamId(game.teams?.away)].filter(Boolean).sort().join('-');
      if (!seriesMap.has(key)) seriesMap.set(key, []);
      seriesMap.get(key).push(game);
    });
    const cards = [...seriesMap.values()].map(seriesGames => {
      const ordered = seriesGames.slice().sort((a, b) => new Date(a.gameDate) - new Date(b.gameDate));
      const latest = ordered[ordered.length - 1];
      const home = latest.teams?.home;
      const away = latest.teams?.away;
      const wins = new Map();
      ordered.forEach(game => ['home', 'away'].forEach(sn => {
        const side = game.teams?.[sn];
        if (side?.isWinner) wins.set(teamId(side), (wins.get(teamId(side)) || 0) + 1);
      }));
      const homeWins = wins.get(teamId(home)) || 0;
      const awayWins = wins.get(teamId(away)) || 0;
      const target = winTargets[gameType];
      const winner = homeWins >= target ? home : awayWins >= target ? away : null;
      const gameRows = ordered.map((game, index) => {
        const gh = game.teams?.home;
        const ga = game.teams?.away;
        const scheduled = game.status?.abstractGameState === 'Preview';
        const date = new Date(game.gameDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
        const score = scheduled ? 'VS' : `${gh?.score ?? '-'} : ${ga?.score ?? '-'}`;
        return `<div class="sp-ucl-match-row"><span class="sp-ucl-match-meta">${esc(date)} · ${index + 1}차전</span>
          <span>${esc(getKoTeamName(gh?.team, 'mlb'))}</span><strong>${esc(score)}</strong><span>${esc(getKoTeamName(ga?.team, 'mlb'))}</span></div>`;
      }).join('');
      const result = winner
        ? `<strong>${esc(getKoTeamName(winner.team, 'mlb'))} 시리즈 승리</strong>`
        : `<strong>${homeWins} : ${awayWins}</strong>`;
      return `<article class="sp-ucl-tie-card">
        <div class="sp-ucl-tie-title">${tblPlayoffTeamLabel(home?.team, 'mlb', teamLogo(home))}<b>VS</b>${tblPlayoffTeamLabel(away?.team, 'mlb', teamLogo(away))}</div>
        ${gameRows}<div class="sp-ucl-tie-result"><span>시리즈 ${homeWins} : ${awayWins}</span>${result}</div>
      </article>`;
    }).join('');
    return `<section class="sp-ucl-round"><div class="sp-section-title">${title}</div>${cards}</section>`;
  }).join('');
}

async function loadF1Table(reqId) {
  const year = Number(state.table.season.f1) || new Date().getFullYear();
  const calendar = await loadF1Calendar(year);
  const freeCutoff = Date.now() - 30 * 60000;
  const race = calendar.sessions
    .filter(session => session.session_name === 'Race' && !session.is_cancelled && new Date(session.date_end).getTime() < freeCutoff)
    .sort((a, b) => new Date(b.date_end) - new Date(a.date_end))[0];
  if (!race) throw new Error(`${year} 시즌의 완료된 결승 데이터가 없습니다.`);
  const [championshipDrivers, championshipTeams, drivers] = await f1FetchSequence([
    `https://api.openf1.org/v1/championship_drivers?session_key=${encodeURIComponent(race.session_key)}`,
    `https://api.openf1.org/v1/championship_teams?session_key=${encodeURIComponent(race.session_key)}`,
    `https://api.openf1.org/v1/drivers?session_key=${encodeURIComponent(race.session_key)}`
  ]);
  if (reqId !== state.table.loadReq) return;
  state.table.cache.f1 = { championshipDrivers, championshipTeams, drivers, race, season:year };
  renderTable('f1');
}

function renderF1Table(data) {
  const drivers = f1DriverMap(data.drivers || []);
  const view = state.table.view.f1 || 'drivers';
  let html = `<div class="sp-season-note">${esc(data.season)} 시즌 · ${esc(f1MeetingName(data.race?._meeting || {}, data.race))} 종료 기준</div>${tblViewTabs('f1')}`;
  if (view === 'constructors') {
    const rows = (data.championshipTeams || []).slice().sort((a,b)=>a.position_current-b.position_current).map(team => {
      const change = Number(team.position_start) - Number(team.position_current);
      return `<tr><td><b>${esc(team.position_current)}</b></td><td><div class="f1-constructor-cell"><i></i><b>${esc(F1_TEAM_KO[team.team_name] || team.team_name)}</b></div></td><td>${esc(team.points_current)}</td><td class="${change > 0 ? 'f1-up' : change < 0 ? 'f1-down' : ''}">${change > 0 ? `▲${change}` : change < 0 ? `▼${Math.abs(change)}` : '–'}</td></tr>`;
    }).join('');
    html += `<div class="sp-standings-wrap"><div class="sp-section-title">컨스트럭터 챔피언십</div><table class="sp-standings-table f1-champ-table"><thead><tr><th>#</th><th>팀</th><th>PTS</th><th>변동</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  } else {
    const rows = (data.championshipDrivers || []).slice().sort((a,b)=>a.position_current-b.position_current).map(item => {
      const driver = drivers.get(String(item.driver_number)) || {};
      const change = Number(item.position_start) - Number(item.position_current);
      return `<tr><td><b>${esc(item.position_current)}</b></td><td><div class="f1-driver-cell">${driver.headshot_url ? `<img src="${esc(driver.headshot_url)}" alt="">` : ''}<span><b>${esc(driver.full_name || `#${item.driver_number}`)}</b><small>${esc(F1_TEAM_KO[driver.team_name] || driver.team_name || '')}</small></span></div></td><td>${esc(item.points_current)}</td><td class="${change > 0 ? 'f1-up' : change < 0 ? 'f1-down' : ''}">${change > 0 ? `▲${change}` : change < 0 ? `▼${Math.abs(change)}` : '–'}</td></tr>`;
    }).join('');
    html += `<div class="sp-standings-wrap"><div class="sp-section-title">드라이버 챔피언십</div><table class="sp-standings-table f1-champ-table"><thead><tr><th>#</th><th>드라이버</th><th>PTS</th><th>변동</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  return html;
}

async function loadTable(sport) {
  const reqId = ++state.table.loadReq;
  $('#tableContent').innerHTML = `<div class="loading"><span class="spinner"></span>순위를 불러오는 중...</div>`;
  const season = state.table.season[sport] || '';
  const seasonQS = season ? `?season=${season}` : '';
  try {
    if (sport === 'f1') return await loadF1Table(reqId);
    let standings = null, stats = null, nbaLeaders = null, mlbLeaders = null, nbaPlayoffs = null, mlbPlayoffs = null, uclTournament = null;
    if (sport === 'nba') {
      const startYear = Number(season) || tblCurrentNbaSeasonStartYear();
      const endYear = startYear + 1;
      [standings, nbaLeaders, nbaPlayoffs] = await Promise.all([
        tblFetch(`${TBL_STAND_EP.nba}?season=${endYear}`),
        Promise.all(TBL_NBA_LEADERS.map(async cfg => ({ ...cfg, data: await tblFetch(TBL_NBA_LEADERS_URL(endYear, cfg.sort)) }))),
        tblFetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${endYear}0401-${endYear}0701&limit=1000`)
      ]);
    } else if (sport === 'mlb') {
      const year = Number(season) || new Date().getFullYear();
      const fetchLeague = leagueId => {
        const urls = TBL_MLB_LEADERS_URL(year, leagueId);
        return Promise.all([tblFetch(urls.hitting), tblFetch(urls.pitching)])
          .then(([h, p]) => [...(h?.leagueLeaders || []), ...(p?.leagueLeaders || [])]);
      };
      const [standRaw, al, nl, mlbPost] = await Promise.all([
        tblFetch(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${year}&standingsTypes=regularSeason&hydrate=team`),
        fetchLeague(103),
        fetchLeague(104),
        tblFetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&season=${year}&gameTypes=F,D,L,W&hydrate=linescore,team,seriesStatus`)
      ]);
      standings = adaptMlbStandings(standRaw);
      mlbLeaders = { al, nl };
      mlbPlayoffs = mlbPost;
    } else if (sport === 'epl') {
      [standings, stats] = await Promise.all([
        tblFetch(`${TBL_STAND_EP.epl}${seasonQS}`),
        tblFetch(`${TBL_STATS_EP.epl}${seasonQS}`)
      ]);
    } else if (sport === 'ucl') {
      const apiSeason = Number(season) || tblCurrentUclSeasonStartYear();
      [standings, stats, uclTournament] = await Promise.all([
        tblFetch(`${TBL_STAND_EP.ucl}?season=${apiSeason}`),
        tblFetch(`${TBL_STATS_EP.ucl}?season=${apiSeason}`),
        tblFetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard?dates=${apiSeason}0701-${apiSeason + 1}0701&limit=1000`)
      ]);
    }
    if (reqId !== state.table.loadReq) return;
    state.table.cache[sport] = { standings, stats, nbaLeaders, mlbLeaders, nbaPlayoffs, mlbPlayoffs, uclTournament, season };
    renderTable(sport);
  } catch (err) {
    if (reqId !== state.table.loadReq) return;
    console.error('loadTable error', err);
    $('#tableContent').innerHTML = `<div class="sp-state-box"><span>데이터를 불러오지 못했습니다.</span><span>잠시 후 다시 시도해 주세요.</span></div>`;
  }
}

function renderTable(sport) {
  const data = state.table.cache[sport];
  const host = $('#tableContent');
  if (!data) { host.innerHTML = `<div class="loading"><span class="spinner"></span>순위를 불러오는 중...</div>`; return; }
  if (sport === 'f1') { host.innerHTML = renderF1Table(data); return; }
  const view = state.table.view[sport];
  const emptyStand = `<div class="sp-state-box sp-stat-empty"><span>팀 순위를 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해 주세요.</span></div>`;
  const emptyStat = `<div class="sp-state-box sp-stat-empty"><span>선수 스탯을 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해 주세요.</span></div>`;
  let html = '';
  if (data.season) {
    const label = sport === 'mlb'
      ? `${data.season} 시즌 최종 기록`
      : `${data.season}-${String(Number(data.season) + 1).slice(2)} 시즌 최종 기록`;
    html += `<div class="sp-season-note">${label}</div>`;
  }
  html += tblViewTabs(sport);
  if (view === 'standings') {
    html += data.standings ? (tblStandings(data.standings, sport) || emptyStand) : emptyStand;
  } else if (view === 'stats') {
    if (sport === 'nba') html += data.nbaLeaders?.some(i => i.data?.athletes?.length) ? tblNbaStatLeaders(data.nbaLeaders) : emptyStat;
    else if (sport === 'mlb') html += (data.mlbLeaders?.al?.length || data.mlbLeaders?.nl?.length) ? tblMlbStatLeaders(data.mlbLeaders) : emptyStat;
    else html += data.stats?.stats?.length ? (tblSoccerStatLeaders(data.stats.stats, sport) || emptyStat) : emptyStat;
  } else if (view === 'playoffs') {
    html += sport === 'nba' ? tblNbaPlayoffs(data.nbaPlayoffs) : tblMlbPlayoffs(data.mlbPlayoffs);
  } else if (view === 'tournament') {
    html += tblUclTournament(data.uclTournament);
  }
  host.innerHTML = html;
}

function onTableClick(event) {
  const viewBtn = event.target.closest('[data-tblview]');
  if (viewBtn) { state.table.view[state.sport] = viewBtn.dataset.tblview; renderTable(state.sport); return; }
  const lgBtn = event.target.closest('[data-tblleague]');
  if (lgBtn) { state.table.mlbLeague = lgBtn.dataset.tblleague; renderTable(state.sport); return; }
  const moreBtn = event.target.closest('[data-tblmore]');
  if (moreBtn) {
    const k = moreBtn.dataset.tblmore;
    if (state.table.expanded.has(k)) state.table.expanded.delete(k); else state.table.expanded.add(k);
    renderTable(state.sport);
    return;
  }
  const seriesBtn = event.target.closest('[data-tblseries]');
  if (seriesBtn) {
    const k = seriesBtn.dataset.tblseries;
    if (state.table.playoffExpanded.has(k)) state.table.playoffExpanded.delete(k); else state.table.playoffExpanded.add(k);
    renderTable(state.sport);
  }
}

async function init() {
  state.settings = await window.nbaDesktop.getSettings();
  populateSettings();
  updateDateHeader();
  $$('.sport-tab').forEach(button => button.addEventListener('click', () => setSport(button.dataset.sport)));
  $$('.tab').forEach(tab => tab.addEventListener('click', () => showView(tab.dataset.view)));
  $('#prevDate').addEventListener('click', () => shiftDate(-1));
  $('#nextDate').addEventListener('click', () => shiftDate(1));
  $('#todayButton').addEventListener('click', () => { state.date=localDateKey(new Date()); loadGames({allowFallback:true}); });
  $('#refreshGames').addEventListener('click', () => loadGames({allowFallback:true}));
  $('#dateButton').addEventListener('click', () => $('#datePicker').showPicker());
  $('#datePicker').addEventListener('change', event => { if(event.target.value){ state.date=event.target.value; loadGames({allowFallback:false}); } });
  $('#backToGames').addEventListener('click', () => showView('games'));
  $('#tableSeasonSelect').addEventListener('change', event => {
    state.table.season[state.sport] = event.target.value || '';
    delete state.table.cache[state.sport];
    loadTable(state.sport);
  });
  $('#tableContent').addEventListener('click', onTableClick);
  $('#tableRefresh').addEventListener('click', () => { delete state.table.cache[state.sport]; loadTable(state.sport); });
  $('#minBtn').addEventListener('click', () => window.nbaDesktop.minimize());
  $('#closeBtn').addEventListener('click', () => window.nbaDesktop.hide());
  $('#pinBtn').addEventListener('click', async () => { const value=await window.nbaDesktop.setAlwaysOnTop(!state.settings.alwaysOnTop); state.settings.alwaysOnTop=value; $('#alwaysOnTop').checked=value; $('#pinBtn').classList.toggle('on',value); });
  $('#moveBottomRight').addEventListener('click', () => window.nbaDesktop.moveBottomRight());
  $$('#settingsView input, #settingsView select').forEach(input => input.addEventListener('change', saveSettings));
  $('#notificationOpacity').addEventListener('input', event => { $('#notificationOpacityValue').textContent = `${Math.round(Number(event.target.value) * 100)}%`; });
  $('#dismissNotifications').addEventListener('click', () => window.nbaDesktop.dismissNotifications());
  $('#testNotification').addEventListener('click', () => window.nbaDesktop.showNotification({title:'LA 레이커스 108 : 106 보스턴',body:'3점슛 성공',awayName:'LA 레이커스',homeName:'보스턴',awayLogo:'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',homeLogo:'https://a.espncdn.com/i/teamlogos/nba/500/bos.png',awayScore:108,homeScore:106,meta:'4쿼터 · 01:24',playerName:'LeBron James',playerImage:'https://a.espncdn.com/i/headshots/nba/players/full/1966.png',silent:!$('#sound').checked}));
  window.nbaDesktop.onFocusGame(target => {
    const sport = target?.sport || 'nba';
    if (state.sport !== sport) setSport(sport);
    state.selectedSoccerLeague = target?.endpointLeague || '';
    if (sport === 'mlb') openMlbGame(target.gameId);
    else if (sport === 'epl' || sport === 'ucl') openSoccerGame(target.gameId);
    else if (sport === 'f1') openF1Session(target.gameId);
    else openGame(target.gameId);
  });
  window.nbaDesktop.onSettingsChanged(settings => {
    state.settings = settings;
    $('#alwaysOnTop').checked = settings.alwaysOnTop;
    $('#pinBtn').classList.toggle('on', settings.alwaysOnTop);
  });
  await loadGames({allowFallback:true});
}

init();
