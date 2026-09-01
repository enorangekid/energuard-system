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

async function loadGames(options = {}) {
  if (state.sport === 'mlb') return loadMlbGames(options);
  if (state.sport === 'epl' || state.sport === 'ucl') return loadSoccerGames(options);
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
  try {
    const data = await fetchJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${state.date}&hydrate=linescore,team`);
    if (state.sport !== 'mlb') return;
    const games = (data?.dates || []).flatMap(day => day.games || []);
    state.events = games;
    renderMlbGames(games);
    syncFavoriteSelect();
    monitorLiveGames();
    if (games.some(isMlbLive)) state.scoreboardTimer = setTimeout(() => loadGames({quiet:true}), 20000);
  } catch (error) {
    if (state.sport !== 'mlb') return;
    $('#gamesStatus').hidden = false;
    $('#gamesStatus').innerHTML = `MLB 경기 정보를 불러오지 못했습니다.<br><small>${esc(error.message)}</small>`;
  }
}

function renderMlbGames(games) {
  $('#gamesStatus').hidden = games.length > 0;
  $('#gamesStatus').innerHTML = games.length ? '' : '선택한 날짜에 MLB 경기가 없습니다.';
  $('#liveDot').hidden = !games.some(isMlbLive);
  $('#gamesList').innerHTML = games.map(game => {
    const away = game.teams?.away || {};
    const home = game.teams?.home || {};
    const live = isMlbLive(game);
    const started = game.status?.abstractGameState !== 'Preview';
    const gameNumber = game.doubleHeader && game.doubleHeader !== 'N' ? ` · 더블헤더 ${game.gameNumber || ''}차전` : '';
    const selectable = started && game.gamePk;
    return `<article class="game-card mlb-game-card ${selectable ? '' : 'disabled'} ${live ? 'live' : ''}"${selectable ? ` data-game-pk="${esc(game.gamePk)}"` : ''}>
      <div class="game-meta"><span>MLB${esc(gameNumber)}</span><b class="${live ? 'status-live' : ''}">${live ? '● LIVE · ' : ''}${esc(mlbStatusText(game))}</b></div>
      <div class="game-teams">
        <div class="team"><img src="${esc(mlbTeamLogo(away))}" alt=""><b>${esc(mlbTeamName(away.team))}</b><small>${esc(mlbRecord(away))}</small></div>
        <div class="game-score"><strong>${started ? `${esc(away.score ?? 0)} : ${esc(home.score ?? 0)}` : 'VS'}</strong><span>${live ? '실시간' : (started ? '결과' : '예정')}</span></div>
        <div class="team"><img src="${esc(mlbTeamLogo(home))}" alt=""><b>${esc(mlbTeamName(home.team))}</b><small>${esc(mlbRecord(home))}</small></div>
      </div><div class="game-footer ${selectable ? '' : 'muted'}">${selectable ? '이닝 스코어 · 현재 승부 · 전체 문자중계 보기 ›' : '경기 시작 후 문자중계를 볼 수 있습니다.'}</div>
    </article>`;
  }).join('');
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
    renderMlbCommentary(feed);
    const live = feed?.gameData?.status?.abstractGameState === 'Live';
    $('#commentaryBadge').hidden = !live;
    if (live) state.commentaryTimer = setTimeout(() => loadMlbCommentary(false), 12000);
  } catch (error) {
    $('#commentaryContent').innerHTML = `<div class="loading">MLB 문자중계를 불러오지 못했습니다.<br><small>${esc(error.message)}</small></div>`;
  }
}

function renderMlbCommentary(feed) {
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
  const awayRuns = linescore.teams?.away?.runs ?? current.result?.awayScore ?? 0;
  const homeRuns = linescore.teams?.home?.runs ?? current.result?.homeScore ?? 0;
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
  const groups = new Map();
  plays.filter(play => play.about?.isComplete).forEach(play => { const key=`${play.about?.inning}-${play.about?.halfInning}`; if(!groups.has(key)) groups.set(key,[]); groups.get(key).push(play); });
  const allPlays = [...groups.entries()].map(([key,rows]) => { const first=rows[0]; const groupTop=first.about?.halfInning === 'top'; const groupInning=Number(first.about?.inning); const groupTeam=groupTop ? away : home; return `<details class="period" ${groupInning === inning && groupTop === top ? 'open' : ''}><summary><span>${groupInning}회 ${groupTop ? '초' : '말'} · ${esc(mlbTeamName(groupTeam))} 공격</span><small>${rows.length}개 타석</small></summary>${rows.map(play => `<div class="mlb-feed-row ${play.about?.isScoringPlay ? 'scoring' : ''}"><span>${esc(mlbPlayActor(play))}</span><div><b>${esc(mlbKoreanEvent(play))}</b><small>${Number(play.result?.rbi) ? `${esc(play.result.rbi)}타점` : esc(play.result?.description || '')}</small></div><strong>${esc(play.result?.awayScore ?? 0)} : ${esc(play.result?.homeScore ?? 0)}</strong></div>`).join('')}</details>`; }).join('');
  $('#commentaryContent').innerHTML = `<div class="commentary-head"><div class="commentary-head-top"><span class="${isLive ? 'live' : ''}">${isLive ? '● LIVE' : 'MLB'} · ${esc(stateText)}</span><button id="refreshMlbCommentary">↻ 새로고침</button></div><div class="matchup"><div><img src="${esc(awayLogo)}" alt=""><b>${esc(awayName)}</b></div><div class="big-score"><strong>${esc(awayRuns)} : ${esc(homeRuns)}</strong><small>원정 · 홈</small></div><div><img src="${esc(homeLogo)}" alt=""><b>${esc(homeName)}</b></div></div></div>${lineScore}${situation}${scoring}<div class="panel-block"><div class="block-title"><span>전체 플레이 기록</span><small>${plays.filter(play => play.about?.isComplete).length}개 · ${isLive ? '12초 자동 갱신' : '1회부터 경기 종료까지'}</small></div>${allPlays || '<div class="loading">완료된 타석 기록이 없습니다.</div>'}</div>`;
  $('#refreshMlbCommentary').addEventListener('click', () => loadMlbCommentary(true));
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
  $('#gamesList').innerHTML = events.map(event => {
    const comp = event.competitions?.[0] || {};
    const away = comp.competitors?.find(item => item.homeAway === 'away') || {};
    const home = comp.competitors?.find(item => item.homeAway === 'home') || {};
    const live = isLiveEvent(event);
    const started = event.status?.type?.state !== 'pre';
    const date = new Intl.DateTimeFormat('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(event.date));
    return `<article class="game-card soccer-game-card ${started ? '' : 'disabled'} ${live ? 'live' : ''}"${started ? ` data-game-id="${esc(event.id)}"` : ''}>
      <div class="game-meta"><span>${esc(sport.toUpperCase())} · ${esc(date)}</span><b class="${live ? 'status-live' : ''}">${live ? '● LIVE · ' : ''}${esc(event.status?.type?.shortDetail || event.status?.type?.detail || '')}</b></div>
      <div class="game-teams"><div class="team"><img src="${esc(teamLogo(away))}" alt=""><b>${esc(soccerTeamName(away.team))}</b><small>원정</small></div><div class="game-score"><strong>${started ? `${esc(away.score ?? 0)} : ${esc(home.score ?? 0)}` : 'VS'}</strong><span>${live ? '실시간' : (started ? '결과' : '예정')}</span></div><div class="team"><img src="${esc(teamLogo(home))}" alt=""><b>${esc(soccerTeamName(home.team))}</b><small>홈</small></div></div>
      <div class="game-footer ${started ? '' : 'muted'}">${started ? '득점·카드·교체 이벤트 보기 ›' : '경기 시작 후 이벤트를 볼 수 있습니다.'}</div>
    </article>`;
  }).join('');
  $$('.soccer-game-card[data-game-id]').forEach(card => card.addEventListener('click', () => openSoccerGame(card.dataset.gameId)));
}

function soccerAthlete(detail = {}) {
  return detail.athletesInvolved?.[0] || detail.participants?.[0]?.athlete || detail.athletes?.[0] || {};
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
  const live = comp.status?.type?.state === 'in';
  const eventRows = details.map(detail => {
    const athlete = soccerAthlete(detail);
    const eventTeam = detail.team?.id === home.team?.id ? home : away;
    const image = athlete.headshot?.href || athlete.headshot || '';
    return `<div class="soccer-event-row"><span>${esc(detail.clock?.displayValue || '')}</span>${image ? `<img src="${esc(image)}" alt="">` : `<img src="${esc(teamLogo(eventTeam))}" alt="">`}<div><b>${esc(athlete.displayName || athlete.shortName || soccerEventLabel(detail))}</b><small>${esc(soccerEventLabel(detail))} · ${esc(soccerTeamName(eventTeam.team))}</small></div></div>`;
  }).join('');
  const stats = (summary?.boxscore?.teams || []).map(group => `<div class="soccer-stat-team"><b>${esc(soccerTeamName(group.team))}</b>${(group.statistics || []).slice(0,6).map(stat => `<span><small>${esc(stat.label || stat.name)}</small><strong>${esc(stat.displayValue ?? stat.value ?? '-')}</strong></span>`).join('')}</div>`).join('');
  $('#commentaryContent').innerHTML = `<div class="commentary-head"><div class="commentary-head-top"><span class="${live ? 'live' : ''}">${live ? '● LIVE' : sport.toUpperCase()} · ${esc(comp.status?.type?.detail || comp.status?.type?.shortDetail || '경기 기록')}</span><button id="refreshSoccerCommentary">↻ 새로고침</button></div><div class="matchup"><div><img src="${esc(teamLogo(away))}" alt=""><b>${esc(soccerTeamName(away.team))}</b></div><div class="big-score"><strong>${esc(away.score ?? 0)} : ${esc(home.score ?? 0)}</strong><small>원정 · 홈</small></div><div><img src="${esc(teamLogo(home))}" alt=""><b>${esc(soccerTeamName(home.team))}</b></div></div></div><div class="panel-block"><div class="block-title"><span>주요 경기 이벤트</span><small>득점 · 카드 · 교체</small></div>${eventRows || '<div class="loading">표시할 주요 이벤트가 없습니다.</div>'}</div>${stats ? `<div class="panel-block"><div class="block-title"><span>팀 기록</span><small>주요 지표</small></div><div class="soccer-stats">${stats}</div></div>` : ''}`;
  $('#refreshSoccerCommentary').addEventListener('click', () => loadSoccerCommentary(true));
}

function setSport(sport) {
  if (!['nba','mlb','epl','ucl'].includes(sport) || state.sport === sport) return;
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
  $('#commentaryEmpty p').innerHTML = sport === 'mlb' ? '경기 화면에서 원하는 경기를 누르면<br>이닝 스코어와 전체 문자중계를 표시합니다.' : sport === 'nba' ? '경기 화면에서 원하는 경기를 누르면<br>쿼터별 스코어와 전체 문자중계를 표시합니다.' : '경기 화면에서 원하는 경기를 누르면<br>득점·카드·교체 이벤트를 표시합니다.';
  $$('.sport-tab').forEach(button => button.classList.toggle('active', button.dataset.sport === sport));
  syncFavoriteSelect();
  showView('games');
  loadGames({allowFallback:sport === 'nba'});
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
  const favorite = favoriteForSport();
  if (!favorite) return true;
  if (state.sport === 'mlb') return ['away','home'].some(side => String(event.teams?.[side]?.team?.id || '') === String(favorite));
  if (state.sport === 'epl' || state.sport === 'ucl') return event.competitions?.[0]?.competitors?.some(item => String(item.team?.id || '') === String(favorite));
  return event.competitions?.[0]?.competitors?.some(item => item.team?.abbreviation === favorite);
}

function favoriteForSport() {
  const values = state.settings?.favoriteBySport || {};
  return values[state.sport] ?? (state.sport === 'nba' ? state.settings?.favoriteTeam : '') ?? '';
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

async function monitorLiveGames() {
  clearTimeout(state.monitorTimer);
  const liveEvents = state.events.filter(event => state.sport === 'mlb' ? isMlbLive(event) : isLiveEvent(event)).filter(eventIncludesFavorite);
  if (!state.settings?.notifications || !liveEvents.length) return;
  const checker = state.sport === 'mlb' ? checkMlbGameNotifications : ['epl','ucl'].includes(state.sport) ? checkSoccerGameNotifications : checkGameNotifications;
  await Promise.allSettled(liveEvents.map(checker));
  state.monitorTimer = setTimeout(monitorLiveGames, 12000);
}

async function checkMlbGameNotifications(game) {
  const feed = await fetchJson(`https://statsapi.mlb.com/api/v1.1/game/${encodeURIComponent(game.gamePk)}/feed/live`);
  const plays = (feed?.liveData?.plays?.allPlays || []).filter(play => play.about?.isComplete);
  if (!plays.length) return;
  const key = `mlb:${game.gamePk}`;
  const playId = play => String(play.atBatIndex ?? play.about?.endTime ?? '');
  const previousId = state.lastPlayIds.get(key);
  state.lastPlayIds.set(key, playId(plays.at(-1)));
  if (!previousId) return;
  const index = plays.findIndex(play => playId(play) === previousId);
  const fresh = index >= 0 ? plays.slice(index + 1) : plays.slice(-1);
  const eligible = fresh.filter(play => state.settings.notificationLevel === 'all' || play.about?.isScoringPlay);
  if (!eligible.length) return;
  const play = eligible.at(-1), gameData = feed.gameData || {}, linescore = feed.liveData?.linescore || {};
  const away = gameData.teams?.away || {}, home = gameData.teams?.home || {};
  const actor = play.result?.eventType === 'pitching_substitution' ? play.matchup?.pitcher : play.matchup?.batter;
  const battingTeam = play.about?.halfInning === 'top' ? away : home;
  await window.nbaDesktop.showNotification({
    sport:'mlb',league:'MLB',gameId:String(game.gamePk),body:`${mlbKoreanEvent(play)}${Number(play.result?.rbi) ? ` · ${play.result.rbi}타점` : ''}`,
    awayName:mlbTeamName(away),homeName:mlbTeamName(home),awayLogo:away.id ? `https://www.mlbstatic.com/team-logos/${away.id}.svg` : '',homeLogo:home.id ? `https://www.mlbstatic.com/team-logos/${home.id}.svg` : '',
    awayScore:play.result?.awayScore ?? linescore.teams?.away?.runs ?? 0,homeScore:play.result?.homeScore ?? linescore.teams?.home?.runs ?? 0,
    meta:`${play.about?.inning || ''}회 ${play.about?.halfInning === 'top' ? '초' : '말'}`,playerName:actor?.fullName || mlbPlayActor(play),playerImage:mlbHeadshot(actor),eventTeamLogo:battingTeam.id ? `https://www.mlbstatic.com/team-logos/${battingTeam.id}.svg` : '',silent:!state.settings.sound
  });
}

async function checkSoccerGameNotifications(event) {
  const sport = state.sport, league = event._league || SOCCER_ENDPOINTS[sport];
  const summary = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${encodeURIComponent(event.id)}`);
  const details = soccerDetailsFrom(summary,event);
  if (!details.length) return;
  const key = `${sport}:${event.id}`;
  const detailId = detail => String(detail.id || `${detail.clock?.value}-${detail.type?.id}-${soccerEventLabel(detail)}`);
  const previousId = state.lastPlayIds.get(key);
  state.lastPlayIds.set(key, detailId(details.at(-1)));
  if (!previousId) return;
  const index = details.findIndex(detail => detailId(detail) === previousId);
  const fresh = index >= 0 ? details.slice(index + 1) : details.slice(-1);
  const eligible = fresh.filter(detail => state.settings.notificationLevel === 'all' || detail.scoringPlay || detail.redCard);
  if (!eligible.length) return;
  const detail = eligible.at(-1), comp = summary?.header?.competitions?.[0] || event.competitions?.[0] || {};
  const away = comp.competitors?.find(item => item.homeAway === 'away') || {}, home = comp.competitors?.find(item => item.homeAway === 'home') || {};
  const athlete = soccerAthlete(detail), eventTeam = detail.team?.id === home.team?.id ? home : away;
  await window.nbaDesktop.showNotification({
    sport,league:sport.toUpperCase(),endpointLeague:league,gameId:String(event.id),body:soccerEventLabel(detail),awayName:soccerTeamName(away.team),homeName:soccerTeamName(home.team),awayLogo:teamLogo(away),homeLogo:teamLogo(home),awayScore:away.score ?? 0,homeScore:home.score ?? 0,meta:detail.clock?.displayValue || comp.status?.displayClock || '',playerName:athlete.displayName || athlete.shortName || '',playerImage:athlete.headshot?.href || '',eventTeamLogo:teamLogo(eventTeam),silent:!state.settings.sound
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
  const eligible = fresh.filter(play => state.settings.notificationLevel === 'all' || play.scoringPlay || /End of|Game End/i.test(play.text || ''));
  if (!eligible.length) return;
  const play = eligible.at(-1);
  const { away,home,map } = packageTeams(pkg);
  const athlete = findPlayAthlete(pkg, play);
  const eventTeam = map.get(String(play.team?.id || ''));
  await window.nbaDesktop.showNotification({
    title:`${teamName(away.team)} ${play.awayScore ?? away.score ?? 0} : ${play.homeScore ?? home.score ?? 0} ${teamName(home.team)}`,
    sport:'nba',league:'NBA',
    body:koreanPlay(play.text || play.shortDescription),
    gameId:event.id,
    awayName:teamName(away.team),
    homeName:teamName(home.team),
    awayLogo:teamLogo(away),
    homeLogo:teamLogo(home),
    awayScore:play.awayScore ?? away.score ?? 0,
    homeScore:play.homeScore ?? home.score ?? 0,
    meta:`${periodLabel(play.period?.number)} · ${play.clock?.displayValue || ''}`,
    playerName:athlete?.name || '',
    playerImage:athlete?.image || '',
    eventTeamLogo:athlete?.teamLogo || eventTeam?.logo || '',
    silent:!state.settings.sound
  });
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
  const favoriteBySport = { nba:'',mlb:'',epl:'',ucl:'',...(state.settings.favoriteBySport || {}),[state.sport]:$('#favoriteTeam').value };
  state.settings = await window.nbaDesktop.saveSettings({
    alwaysOnTop:$('#alwaysOnTop').checked,
    autoLaunch:$('#autoLaunch').checked,
    notifications:$('#notifications').checked,
    notificationLevel:$('#notificationLevel').value,
    favoriteTeam:$('#favoriteTeam').value,
    favoriteBySport,
    sound:$('#sound').checked,
    notificationOpacity:Number($('#notificationOpacity').value),
    pinAllNotifications:$('#pinAllNotifications').checked
  });
  $('#pinBtn').classList.toggle('on', state.settings.alwaysOnTop);
  monitorLiveGames();
}

async function init() {
  state.settings = await window.nbaDesktop.getSettings();
  populateSettings();
  updateDateHeader();
  $$('.sport-tab').forEach(button => button.addEventListener('click', () => setSport(button.dataset.sport)));
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
  $('#notificationOpacity').addEventListener('input', event => { $('#notificationOpacityValue').textContent = `${Math.round(Number(event.target.value) * 100)}%`; });
  $('#dismissNotifications').addEventListener('click', () => window.nbaDesktop.dismissNotifications());
  $('#testNotification').addEventListener('click', () => window.nbaDesktop.showNotification({title:'LA 레이커스 108 : 106 보스턴',body:'3점슛 성공',awayName:'LA 레이커스',homeName:'보스턴',awayScore:108,homeScore:106,meta:'4쿼터 · 01:24',playerName:'LeBron James',playerImage:'https://a.espncdn.com/i/headshots/nba/players/full/1966.png',silent:!$('#sound').checked}));
  window.nbaDesktop.onFocusGame(target => {
    const sport = target?.sport || 'nba';
    if (state.sport !== sport) setSport(sport);
    state.selectedSoccerLeague = target?.endpointLeague || '';
    if (sport === 'mlb') openMlbGame(target.gameId);
    else if (sport === 'epl' || sport === 'ucl') openSoccerGame(target.gameId);
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
