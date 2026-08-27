/* ===============================================================
   js/widget-sports.js  —  스포츠 위젯 패널 (ESPN API 연동)
   의존성: common.js의 openPanel() 함수
   로드 순서: common.js 이후에 로드되어야 합니다.
   =============================================================== */

/* ================= [Sports Widget] ================= */

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
    // 과거 시즌 강등/승격 등으로 나오는 팀들(2026-08-25, 2015-16 시즌 조회하며 추가)
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
    "Texas Rangers": "텍사스",  // "Rangers" 단독키는 UCL Rangers FC와 충돌 → 풀네임만 사용
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

    // 국가대표 (월드컵)
    "Korea Republic": "대한민국", "South Korea": "대한민국",
    "Brazil": "브라질",
    "Argentina": "아르헨티나",
    "France": "프랑스",
    "Germany": "독일",
    "Spain": "스페인",
    "England": "잉글랜드",
    "Portugal": "포르투갈",
    "Netherlands": "네덜란드",
    "Belgium": "벨기에",
    "Croatia": "크로아티아",
    "Uruguay": "우루과이",
    "Mexico": "멕시코",
    "United States": "미국", "USA": "미국",
    "Bosnia-Herzegovina": "보스니아 헤르체고비나", "Bosnia & Herzegovina": "보스니아 헤르체고비나", "Bosnia-Herz": "보스니아 헤르체고비나",
    "DR Congo": "콩고 민주 공화국", "Congo DR": "콩고 민주 공화국", "Congo, DR": "콩고 민주 공화국",
    "Curaçao": "퀴라소", "Curacao": "퀴라소",
    "Cape Verde": "카보베르데",
    "Jordan": "요르단",
    "Uzbekistan": "우즈베키스탄",
    "Haiti": "아이티",
    "Canada": "캐나다",
    "Japan": "일본",
    "Australia": "호주",
    "Morocco": "모로코",
    "Senegal": "세네갈",
    "Ghana": "가나",
    "Nigeria": "나이지리아",
    "Ivory Coast": "코트디부아르", "Côte d'Ivoire": "코트디부아르",
    "Egypt": "이집트",
    "Algeria": "알제리",
    "Cameroon": "카메룬",
    "Mali": "말리",
    "Tunisia": "튀니지",
    "Saudi Arabia": "사우디아라비아",
    "Iran": "이란",
    "Iraq": "이라크",
    "Qatar": "카타르",
    "China PR": "중국", "China": "중국",
    "Indonesia": "인도네시아",
    "Japan": "일본",
    "Ecuador": "에콰도르",
    "Colombia": "콜롬비아",
    "Chile": "칠레",
    "Peru": "페루",
    "Venezuela": "베네수엘라",
    "Bolivia": "볼리비아",
    "Paraguay": "파라과이",
    "Panama": "파나마",
    "Honduras": "온두라스",
    "Jamaica": "자메이카",
    "El Salvador": "엘살바도르",
    "Costa Rica": "코스타리카",
    "Serbia": "세르비아",
    "Switzerland": "스위스",
    "Denmark": "덴마크",
    "Poland": "폴란드",
    "Austria": "오스트리아",
    "Slovakia": "슬로바키아",
    "Romania": "루마니아",
    "Hungary": "헝가리",
    "Turkey": "튀르키예", "Türkiye": "튀르키예",
    "Ukraine": "우크라이나",
    "Sweden": "스웨덴",
    "Norway": "노르웨이",
    "Scotland": "스코틀랜드",
    "Wales": "웨일스",
    "Albania": "알바니아",
    "Slovenia": "슬로베니아",
    "Czechia": "체코", "Czech Republic": "체코",
    "New Zealand": "뉴질랜드",
    "South Africa": "남아프리카공화국",
};

// ✅ Spurs 중복 문제 완벽 해결 (종목별 컨텍스트 파악)
function getKoName(engName, tab) {
    if (!engName) return '?';
    // 종목별 동명이팀 분기
    if (engName === 'Spurs')   return tab === 'nba' ? '샌안토니오' : '토트넘';
    if (engName === 'Rangers') return tab === 'mlb' ? '텍사스' : '레인저스';
    return TEAM_KO_MAP[engName] || engName;
}

function toggleWidgetPanel() {
    openPanel('widgetPanel', () => {
        if (!window.widgetInitialized) {
            syncWidgetSeasonSelect('nba');
            loadWidgetData('nba');
            window.widgetInitialized = true;
        }
    });
}

let currentWidgetTab = 'nba';
let widgetCache = {};

const WIDGET_CFG = {
    nba: { label:'NBA',      soccer:false },
    epl: { label:'EPL',      soccer:true  },
    ucl: { label:'UEFA CL',  soccer:true  },
    wc:  { label:'FIFA WC',  soccer:true  },
    mlb: { label:'MLB',      soccer:false },
};

const WIDGET_SCORE_EP = {
    nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    epl: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
    ucl: ['https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard',
          'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions_qual/scoreboard'],
    wc:  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard',
};
const WIDGET_STAND_EP = {
    nba: 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings',
    epl: 'https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings',
    wc:  'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings',
};
// 리그 스탯 순위(득점왕 등) — EPL은 이 ESPN 엔드포인트로. MLB용 ESPN 히든 API
// (.../mlb/statistics)는 시즌 33경기 시점에서 멈춘 채 갱신이 안 되는 게 확인돼서
// (2026-08-25, 20분 뒤 재조회·season 파라미터 다 시도해도 똑같음) 버리고, MLB는
// MLB 공식 API(statsapi.mlb.com)로 따로 가져온다 — 아래 WIDGET_MLB_LEADERS_EP 참고.
const WIDGET_STATS_EP = {
    epl: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/statistics',
};

function widgetStatCategories(statsRes, tab) {
    if (!statsRes) return null;
    return statsRes.stats || null;
}

// MLB 공식 API — leaderCategories를 콤마로 여러 개 한 번에 요청 가능. statGroup을 지정 안
// 하면 타격/포수/투수 기록이 뒤섞여서 나오므로(2026-08-25 확인) hitting/pitching 두 번
// 나눠서 부른다. season은 MLB가 한 해 안에 시작·종료라 그냥 올해 연도를 쓰면 된다.
const WIDGET_MLB_LEADERS_URL = (year, leagueId) => ({
    hitting: `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=homeRuns,battingAverage,runsBattedIn,stolenBases&sportId=1&statGroup=hitting&season=${year}&leagueId=${leagueId}&limit=10`,
    pitching: `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=earnedRunAverage,wins,strikeouts,saves&sportId=1&statGroup=pitching&season=${year}&leagueId=${leagueId}&limit=10`,
});

const WIDGET_NBA_LEADERS = [
    { key: 'points', title: '득점 순위', label: 'PTS', group: 'offensive', stat: 'avgPoints', sort: 'offensive.avgPoints' },
    { key: 'rebounds', title: '리바운드 순위', label: 'REB', group: 'general', stat: 'avgRebounds', sort: 'general.avgRebounds' },
    { key: 'assists', title: '어시스트 순위', label: 'AST', group: 'offensive', stat: 'avgAssists', sort: 'offensive.avgAssists' },
    { key: 'steals', title: '스틸 순위', label: 'STL', group: 'defensive', stat: 'avgSteals', sort: 'defensive.avgSteals' },
    { key: 'blocks', title: '블록 순위', label: 'BLK', group: 'defensive', stat: 'avgBlocks', sort: 'defensive.avgBlocks' },
];

const WIDGET_NBA_LEADERS_URL = (seasonEndYear, sort) =>
    `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?region=us&lang=en&contentorigin=espn&isqualified=true&page=1&limit=10&sort=${encodeURIComponent(sort + ':desc')}&season=${seasonEndYear}&seasontype=2`;

// 과거 시즌 선택 — NBA, EPL과 MLB에서 지원한다. 탭별로 따로 기억해 다른 종목을 보고
// 돌아와도 마지막 선택 시즌을 유지한다.
const widgetSeason = {};
const WIDGET_SEASON_YEARS = Array.from({ length: 11 }, (_, index) => 2025 - index);
let widgetMlbLeague = 'al';
let widgetMlbView = 'standings';
let widgetNbaView = 'standings';
let widgetEplView = 'standings';
let widgetLoadRequestId = 0;

function currentNbaSeasonStartYear() {
    const now = new Date();
    return now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
}

function updateWidgetSeasonOptions(tab, select) {
    const isMlb = tab === 'mlb';
    const years = tab === 'nba'
        ? Array.from({ length: 11 }, (_, index) => currentNbaSeasonStartYear() - 1 - index)
        : WIDGET_SEASON_YEARS;
    select.innerHTML = '<option value="">현재 시즌</option>' + years.map(year => {
        const label = isMlb ? `${year} 시즌` : `${year}-${String(year + 1).slice(-2)} 시즌`;
        return `<option value="${year}">${label}</option>`;
    }).join('');
}

function syncWidgetSeasonSelect(tab) {
    const seasonSel = document.getElementById('sp-season-select');
    if (!seasonSel) return;
    const supportsSeason = tab === 'nba' || tab === 'epl' || tab === 'mlb';
    seasonSel.style.display = supportsSeason ? '' : 'none';
    if (supportsSeason) updateWidgetSeasonOptions(tab, seasonSel);
    seasonSel.value = widgetSeason[tab] || '';
}

function setWidgetTab(tab, el) {
    currentWidgetTab = tab;
    document.querySelectorAll('.sp-tab-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');

    syncWidgetSeasonSelect(tab);

    if (widgetCache[tab]) renderWidget(tab, widgetCache[tab]);
    else loadWidgetData(tab);
}

function reloadWidget() {
    delete widgetCache[currentWidgetTab];
    loadWidgetData(currentWidgetTab);
}

window.changeWidgetSeason = function(value) {
    widgetSeason[currentWidgetTab] = value || null;
    delete widgetCache[currentWidgetTab];
    loadWidgetData(currentWidgetTab);
};

// EPL/UCL/WC는 경기가 매일 열리지 않아서, ESPN scoreboard API의 기본값(그날 하루치만)만
// 받아오면 최근 며칠 새 끝난 경기가 "최근 결과"에 아예 안 잡히는 문제가 있었다
// (2026-08-25). dates 범위를 넉넉히 지정해서 최근 결과/예정 경기를 같이 잡히게 한다.
function widgetDateRange(tab) {
    const fmt = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const start = new Date(); start.setDate(start.getDate() - 6);
    const end = new Date(); end.setDate(end.getDate() + (tab === 'ucl' ? 14 : 7));
    return `${fmt(start)}-${fmt(end)}`;
}

function widgetMlbDateRange() {
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const start = new Date(); start.setDate(start.getDate() - 6);
    const end = new Date(); end.setDate(end.getDate() + 7);
    return { start: fmt(start), end: fmt(end) };
}

async function fetchWidgetJson(url, timeoutMs = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.warn('Widget API request failed:', url, error?.name || error);
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function adaptMlbSchedule(data) {
    const games = (data?.dates || []).flatMap(date => date.games || []);
    return {
        events: games.map(game => {
            const state = game.status?.abstractGameState === 'Live'
                ? 'in'
                : game.status?.abstractGameState === 'Final' ? 'post' : 'pre';
            const competitor = homeAway => {
                const side = game.teams?.[homeAway] || {};
                const team = side.team || {};
                return {
                    homeAway,
                    score: side.score ?? '0',
                    winner: Boolean(side.isWinner),
                    records: [{ summary: side.leagueRecord ? `${side.leagueRecord.wins}-${side.leagueRecord.losses}` : '' }],
                    team: {
                        id: team.id,
                        name: team.name,
                        shortDisplayName: team.teamName || team.shortName || team.name,
                        abbreviation: team.abbreviation,
                        logo: team.id ? `https://www.mlbstatic.com/team-logos/${team.id}.svg` : '',
                    },
                };
            };
            return {
                id: game.gamePk,
                date: game.gameDate,
                status: {
                    type: {
                        state,
                        detail: game.status?.detailedState || '',
                    },
                    displayClock: game.linescore?.currentInningOrdinal || '',
                    period: game.linescore?.currentInning || '',
                },
                competitions: [{ competitors: [competitor('home'), competitor('away')] }],
            };
        }),
    };
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
                    logos: item.team?.id ? [{ href: `https://www.mlbstatic.com/team-logos/${item.team.id}.svg` }] : [],
                },
                stats: [
                    { name: 'gamesPlayed', displayValue: String(item.gamesPlayed ?? '') },
                    { name: 'wins', displayValue: String(item.wins ?? item.leagueRecord?.wins ?? '') },
                    { name: 'losses', displayValue: String(item.losses ?? item.leagueRecord?.losses ?? '') },
                    { name: 'winPercent', displayValue: item.winningPercentage ?? item.leagueRecord?.pct ?? '' },
                ],
            })),
        },
    }));
    return children.length ? { children } : null;
}

async function loadWidgetData(tab) {
    const requestId = ++widgetLoadRequestId;
    const content = document.getElementById('sp-content');
    const icon = document.getElementById('sp-refreshIcon');
    content.innerHTML = `<div class="sp-state-box sp-loading"><i class="fa-solid fa-spinner fa-spin"></i><span>데이터를 불러오는 중입니다...</span></div>`;
    icon.classList.add('fa-spin');

    try {
        const season = widgetSeason[tab]; // 과거 시즌은 경기 목록 없이 순위표와 선수 스탯만 표시한다.
        const seasonQS = season ? `?season=${season}` : '';

        // 과거 시즌을 볼 땐 "지금 진행중/예정" 경기 목록은 의미가 없으니 스코어보드는 안 부른다.
        const scoreEndpoints = Array.isArray(WIDGET_SCORE_EP[tab])
            ? WIDGET_SCORE_EP[tab]
            : [WIDGET_SCORE_EP[tab]].filter(Boolean);
        const scoreUrls = WIDGET_CFG[tab]?.soccer
            ? scoreEndpoints.map(endpoint => `${endpoint}?dates=${widgetDateRange(tab)}`)
            : scoreEndpoints;
        const scorePromise = tab === 'mlb' || season
            ? Promise.resolve(null)
            : Promise.all(scoreUrls.map(fetchWidgetJson)).then(responses => {
                const valid = responses.filter(Boolean);
                if (!valid.length) return null;
                const eventMap = new Map();
                valid.forEach(response => (response.events || []).forEach(event => {
                    eventMap.set(String(event.id), event);
                }));
                return { ...valid[0], events: [...eventMap.values()] };
            });
        const mlbYear = Number(season) || new Date().getFullYear();
        const mlbDates = widgetMlbDateRange();
        const mlbSchedulePromise = tab === 'mlb' && !season
            ? fetchWidgetJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${mlbDates.start}&endDate=${mlbDates.end}&hydrate=linescore,team`)
                .then(adaptMlbSchedule)
            : Promise.resolve(null);
        const mlbStandingsPromise = tab === 'mlb'
            ? fetchWidgetJson(`https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${mlbYear}&standingsTypes=regularSeason&hydrate=team`)
                .then(adaptMlbStandings)
            : Promise.resolve(null);
        const nbaSeasonStart = Number(season) || currentNbaSeasonStartYear();
        const nbaSeasonEnd = nbaSeasonStart + 1;
        const nbaStandingsPromise = tab === 'nba'
            ? fetchWidgetJson(`${WIDGET_STAND_EP.nba}?season=${nbaSeasonEnd}`)
            : Promise.resolve(null);
        const nbaLeadersPromise = tab === 'nba'
            ? Promise.all(WIDGET_NBA_LEADERS.map(async config => ({
                ...config,
                data: await fetchWidgetJson(WIDGET_NBA_LEADERS_URL(nbaSeasonEnd, config.sort)),
            })))
            : Promise.resolve(null);
        const mlbLeadersPromise = (tab === 'mlb')
            ? (() => {
                const fetchLeagueLeaders = (leagueId) => {
                    const urls = WIDGET_MLB_LEADERS_URL(mlbYear, leagueId);
                    return Promise.all([
                        fetchWidgetJson(urls.hitting),
                        fetchWidgetJson(urls.pitching),
                    ]).then(([h, p]) => [...(h?.leagueLeaders || []), ...(p?.leagueLeaders || [])]);
                };
                return Promise.all([
                    fetchLeagueLeaders(103),
                    fetchLeagueLeaders(104),
                ]).then(([al, nl]) => ({ al, nl }));
            })()
            : Promise.resolve(null);

        const [scoreRes, standRes, statsRes, mlbLeaders, nbaLeaders] = await Promise.all([
            tab === 'mlb'
                ? mlbSchedulePromise
                : scorePromise,
            tab === 'mlb'
                ? mlbStandingsPromise
                : tab === 'nba'
                    ? nbaStandingsPromise
                    : WIDGET_STAND_EP[tab] ? fetchWidgetJson(`${WIDGET_STAND_EP[tab]}${seasonQS}`) : Promise.resolve(null),
            WIDGET_STATS_EP[tab] ? fetchWidgetJson(`${WIDGET_STATS_EP[tab]}${seasonQS}`) : Promise.resolve(null),
            mlbLeadersPromise,
            nbaLeadersPromise,
        ]);

        if (requestId !== widgetLoadRequestId || tab !== currentWidgetTab) return;
        widgetCache[tab] = { scores: scoreRes, standings: standRes, stats: statsRes, mlbLeaders, nbaLeaders, season };
        renderWidget(tab, widgetCache[tab]);

        const now = new Date();
        document.getElementById('sp-updateTime').innerText =
            `업데이트 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    } catch(e) {
        if (requestId !== widgetLoadRequestId || tab !== currentWidgetTab) return;
        content.innerHTML = `<div class="sp-state-box"><i class="fa-solid fa-satellite-dish" style="color:#ef4444; font-size:32px;"></i><span style="margin-top:10px;">데이터를 불러오지 못했습니다.</span><span style="font-size:11px; color:#94a3b8; font-weight:normal;">잠시 후 다시 시도해주세요.</span></div>`;
        console.error("Widget API Error:", e);
    } finally {
        if (requestId === widgetLoadRequestId) icon.classList.remove('fa-spin');
    }
}

function renderWidget(tab, data) {
    // 과거 시즌 선택 중이면 경기 일정/LIVE는 의미가 없으니 표·득점왕만 보여준다(2026-08-25).
    if (data.season) {
        const seasonLabel = tab === 'mlb'
            ? `${data.season} 시즌 최종 기록`
            : `${data.season}-${String(Number(data.season)+1).slice(2)} 시즌 최종 기록`;
        let html = `<div class="sp-state-box" style="padding:14px 0;"><i class="fa-solid fa-clock-rotate-left" style="color:#94a3b8;"></i><span>${seasonLabel}</span></div>`;
        if (tab === 'mlb') {
            html += widgetMlbViewTabs();
            if (widgetMlbView === 'stats') {
                if (data.mlbLeaders?.al?.length || data.mlbLeaders?.nl?.length) {
                    html += widgetMlbStatLeaders(data.mlbLeaders);
                } else {
                    html += `<div class="sp-state-box sp-stat-empty"><i class="fa-solid fa-chart-simple"></i><span>선수 스탯을 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해주세요.</span></div>`;
                }
            } else {
                html += data.standings
                    ? widgetStandings(data.standings, tab)
                    : `<div class="sp-state-box sp-stat-empty"><i class="fa-solid fa-ranking-star"></i><span>팀 순위를 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해주세요.</span></div>`;
            }
        } else if (tab === 'nba') {
            html += widgetNbaViewTabs();
            if (widgetNbaView === 'stats') {
                if (data.nbaLeaders?.some(item => item.data?.athletes?.length)) {
                    html += widgetNbaStatLeaders(data.nbaLeaders);
                } else {
                    html += `<div class="sp-state-box sp-stat-empty"><i class="fa-solid fa-chart-simple"></i><span>선수 스탯을 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해 주세요.</span></div>`;
                }
            } else {
                html += data.standings
                    ? widgetStandings(data.standings, tab)
                    : `<div class="sp-state-box sp-stat-empty"><i class="fa-solid fa-ranking-star"></i><span>팀 순위를 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해 주세요.</span></div>`;
            }
        } else if (tab === 'epl') {
            html += widgetEplViewTabs();
            if (widgetEplView === 'stats') {
                const catsSeason = widgetStatCategories(data.stats, tab);
                html += catsSeason
                    ? widgetStatLeaders(catsSeason, tab)
                    : `<div class="sp-state-box sp-stat-empty"><i class="fa-solid fa-chart-simple"></i><span>선수 스탯을 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해 주세요.</span></div>`;
            } else {
                html += data.standings
                    ? widgetStandings(data.standings, tab)
                    : `<div class="sp-state-box sp-stat-empty"><i class="fa-solid fa-ranking-star"></i><span>팀 순위를 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해 주세요.</span></div>`;
            }
        } else {
            if (data.standings) html += widgetStandings(data.standings, tab);
        }
        document.getElementById('sp-content').innerHTML = html;
        return;
    }

    const events = data.scores?.events || [];
    const live  = events.filter(e => e.status?.type?.state === 'in');
    // 날짜 범위를 넓게 받아오게 되면서(위 widgetDateRange), "최근 결과"는 최신순으로
    // 정렬해서 오래된 경기가 아니라 진짜 최근 경기가 먼저 보이게 한다(2026-08-25).
    const post  = events.filter(e => e.status?.type?.state === 'post')
        .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0,8);
    const pre   = events.filter(e => e.status?.type?.state === 'pre').slice(0,8);

    let html = '';
    if (live.length)  html += widgetSection(`LIVE (${live.length}경기)`, live.map(e=>widgetCard(e,'live',tab)).join(''));
    if (pre.length)   html += widgetSection('예정 경기',  pre.map(e=>widgetCard(e,'sched',tab)).join(''));
    if (post.length)  html += widgetSection('최근 결과',  post.map(e=>widgetCard(e,'final',tab)).join(''));
    if (!html && !data.season) html = `<div class="sp-state-box"><i class="fa-regular fa-calendar-xmark"></i><span>경기 정보가 없습니다</span></div>`;

    if (tab === 'mlb') {
        html += widgetMlbViewTabs();
        if (widgetMlbView === 'stats') {
            if (data.mlbLeaders?.al?.length || data.mlbLeaders?.nl?.length) {
                html += widgetMlbStatLeaders(data.mlbLeaders);
            } else {
                html += `<div class="sp-state-box sp-stat-empty"><i class="fa-solid fa-chart-simple"></i><span>선수 스탯을 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해주세요.</span></div>`;
            }
        } else {
            html += data.standings
                ? widgetStandings(data.standings, tab)
                : `<div class="sp-state-box sp-stat-empty"><i class="fa-solid fa-ranking-star"></i><span>팀 순위를 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해주세요.</span></div>`;
        }
    } else if (tab === 'nba') {
        html += widgetNbaViewTabs();
        if (widgetNbaView === 'stats') {
            if (data.nbaLeaders?.some(item => item.data?.athletes?.length)) {
                html += widgetNbaStatLeaders(data.nbaLeaders);
            } else {
                html += `<div class="sp-state-box sp-stat-empty"><i class="fa-solid fa-chart-simple"></i><span>선수 스탯을 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해 주세요.</span></div>`;
            }
        } else {
            html += data.standings
                ? widgetStandings(data.standings, tab)
                : `<div class="sp-state-box sp-stat-empty"><i class="fa-solid fa-ranking-star"></i><span>팀 순위를 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해 주세요.</span></div>`;
        }
    } else if (tab === 'epl') {
        html += widgetEplViewTabs();
        if (widgetEplView === 'stats') {
            const cats = widgetStatCategories(data.stats, tab);
            html += cats
                ? widgetStatLeaders(cats, tab)
                : `<div class="sp-state-box sp-stat-empty"><i class="fa-solid fa-chart-simple"></i><span>선수 스탯을 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해 주세요.</span></div>`;
        } else {
            html += data.standings
                ? widgetStandings(data.standings, tab)
                : `<div class="sp-state-box sp-stat-empty"><i class="fa-solid fa-ranking-star"></i><span>팀 순위를 불러오지 못했습니다.</span><span>새로고침 후 다시 확인해 주세요.</span></div>`;
        }
    } else if (data.standings) {
        html += widgetStandings(data.standings, tab);
    }

    document.getElementById('sp-content').innerHTML = html;
}

// "N개까지만 보이고 눌러야 펼쳐지는" 더보기 버튼 — dashboard.js의 moverSlice/
// moverMoreBtnHtml/toggleMoverExpand과 같은 패턴(2026-08-25). 스포츠 위젯은 탭이 바뀔
// 때마다 다시 그려지므로 widgetCache[currentWidgetTab]로 재렌더링한다.
const SPORTS_STAT_EXPANDED = new Set();
const SPORTS_STAT_COLLAPSED_LIMIT = 5;

function sportsStatMoreBtnHtml(key, totalCount, label) {
    if (totalCount <= SPORTS_STAT_COLLAPSED_LIMIT) return '';
    const expanded = SPORTS_STAT_EXPANDED.has(key);
    return `<button type="button" class="dash-mover-more" onclick="toggleSportsStatExpand('${key}')">${expanded ? '간략히 보기' : label} <span>${expanded ? '−' : '+'}</span></button>`;
}

window.toggleSportsStatExpand = function(key) {
    if (SPORTS_STAT_EXPANDED.has(key)) SPORTS_STAT_EXPANDED.delete(key); else SPORTS_STAT_EXPANDED.add(key);
    if (widgetCache[currentWidgetTab]) renderWidget(currentWidgetTab, widgetCache[currentWidgetTab]);
};

window.setWidgetMlbLeague = function(league) {
    if (league !== 'al' && league !== 'nl') return;
    widgetMlbLeague = league;
    if (widgetCache.mlb) renderWidget('mlb', widgetCache.mlb);
};

window.setWidgetMlbView = function(view) {
    if (view !== 'stats' && view !== 'standings') return;
    widgetMlbView = view;
    if (widgetCache.mlb) renderWidget('mlb', widgetCache.mlb);
};

window.setWidgetNbaView = function(view) {
    if (view !== 'stats' && view !== 'standings') return;
    widgetNbaView = view;
    if (widgetCache.nba) renderWidget('nba', widgetCache.nba);
};

window.setWidgetEplView = function(view) {
    if (view !== 'stats' && view !== 'standings') return;
    widgetEplView = view;
    if (widgetCache.epl) renderWidget('epl', widgetCache.epl);
};

function widgetEplViewTabs() {
    return `
        <div class="sp-mlb-league-tabs sp-mlb-view-tabs" role="tablist" aria-label="EPL 데이터 선택">
            <button type="button" class="sp-mlb-league-tab ${widgetEplView === 'standings' ? 'active' : ''}" role="tab" aria-selected="${widgetEplView === 'standings'}" onclick="setWidgetEplView('standings')">팀 순위</button>
            <button type="button" class="sp-mlb-league-tab ${widgetEplView === 'stats' ? 'active' : ''}" role="tab" aria-selected="${widgetEplView === 'stats'}" onclick="setWidgetEplView('stats')">선수 스탯</button>
        </div>`;
}

function widgetNbaViewTabs() {
    return `
        <div class="sp-mlb-league-tabs sp-mlb-view-tabs" role="tablist" aria-label="NBA 데이터 선택">
            <button type="button" class="sp-mlb-league-tab ${widgetNbaView === 'standings' ? 'active' : ''}" role="tab" aria-selected="${widgetNbaView === 'standings'}" onclick="setWidgetNbaView('standings')">팀 순위</button>
            <button type="button" class="sp-mlb-league-tab ${widgetNbaView === 'stats' ? 'active' : ''}" role="tab" aria-selected="${widgetNbaView === 'stats'}" onclick="setWidgetNbaView('stats')">선수 스탯</button>
        </div>`;
}

function widgetMlbViewTabs() {
    return `
        <div class="sp-mlb-league-tabs sp-mlb-view-tabs" role="tablist" aria-label="MLB 데이터 선택">
            <button type="button" class="sp-mlb-league-tab ${widgetMlbView === 'standings' ? 'active' : ''}" role="tab" aria-selected="${widgetMlbView === 'standings'}" onclick="setWidgetMlbView('standings')">팀 순위</button>
            <button type="button" class="sp-mlb-league-tab ${widgetMlbView === 'stats' ? 'active' : ''}" role="tab" aria-selected="${widgetMlbView === 'stats'}" onclick="setWidgetMlbView('stats')">선수 스탯</button>
        </div>`;
}

// 리그 득점/도움 순위 — ESPN statistics 엔드포인트의 stats[] 배열에서 득점(goalsLeaders)과
// 도움(assistsLeaders) 항목만 뽑아 상위 5명을 보여준다(2026-08-25). 선수명은 번역 목록이
// 없어 영문 그대로 표시하고, 팀명만 기존 TEAM_KO_MAP으로 한글화한다.
// MLB 타자/투수 순위는 뺐다 — WIDGET_STATS_EP 주석 참고(데이터 소스가 갱신 안 됨, 2026-08-25).
function widgetStatLeaders(stats, tab) {
    if (!stats?.length) return '';
    const WANTED = { goalsLeaders: '득점 순위', assistsLeaders: '도움 순위' };

    let html = '';
    stats.forEach(cat => {
        const title = WANTED[cat.name];
        if (!title) return;
        const all = cat.leaders || [];
        if (!all.length) return;
        const key = `sp-stat-${tab}-${cat.name}`;
        const top = SPORTS_STAT_EXPANDED.has(key) ? all : all.slice(0, SPORTS_STAT_COLLAPSED_LIMIT);

        const rows = top.map((l, i) => {
            const a = l.athlete || {};
            const teamData = a.team;
            // 이 API의 team 객체는 abbreviation(BHA, MNC 등) 위주라 TEAM_KO_MAP(전체/짧은
            // 영문명 기준)과 안 맞았다 — name/displayName을 우선 조회한다(2026-08-25).
            const teamName = getKoName(teamData?.name || teamData?.displayName || teamData?.shortDisplayName || teamData?.abbreviation, tab);
            const logoUrl = teamData?.logos?.[0]?.href;
            const logoImg = logoUrl ? `<img src="${logoUrl}" style="width:14px; height:14px; object-fit:contain; vertical-align:middle; margin-right:4px;">` : '';
            return `<tr>
                <td>${i + 1}</td>
                <td style="text-align:left; font-weight:600; color:#0f172a;">${a.shortName || a.displayName || '-'}</td>
                <td style="text-align:left;"><div style="display:flex; align-items:center;">${logoImg}${teamName}</div></td>
                <td style="font-weight:700; color:#0f172a;">${l.value ?? ''}</td>
            </tr>`;
        }).join('');

        html += `
        <div class="sp-standings-wrap">
            <div class="sp-section-title" style="margin-top:6px;">${title}</div>
            <table class="sp-standings-table sp-stat-table">
                <colgroup><col class="sp-stat-col-rank"><col class="sp-stat-col-player"><col class="sp-stat-col-team"><col class="sp-stat-col-value"></colgroup>
                <thead><tr><th>#</th><th>선수</th><th>팀</th><th>${cat.abbreviation || ''}</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            ${sportsStatMoreBtnHtml(key, all.length, '더보기')}
        </div>`;
    });
    return html;
}

// ESPN NBA 선수 통계 응답은 카테고리별 배열 인덱스로 값을 제공한다.
function nbaAthleteStatValue(response, row, groupName, statName) {
    const group = response?.categories?.find(category => category.name === groupName);
    const statIndex = group?.names?.indexOf(statName) ?? -1;
    if (statIndex < 0) return '-';
    const values = row?.categories?.find(category => category.name === groupName);
    return values?.totals?.[statIndex] ?? values?.values?.[statIndex] ?? '-';
}

function widgetNbaStatLeaders(nbaLeaders) {
    if (!nbaLeaders?.length) return '';

    return nbaLeaders.map(item => {
        const all = item.data?.athletes || [];
        if (!all.length) return '';
        const key = `sp-stat-nba-${item.key}`;
        const visible = SPORTS_STAT_EXPANDED.has(key)
            ? all
            : all.slice(0, SPORTS_STAT_COLLAPSED_LIMIT);
        const rows = visible.map((row, index) => {
            const athlete = row.athlete || {};
            const teamName = getKoName(athlete.teamName || athlete.teamShortName || '-', 'nba');
            const logoUrl = athlete.teamLogos?.[0]?.href || '';
            const logo = logoUrl
                ? `<img src="${logoUrl}" style="width:14px;height:14px;object-fit:contain;vertical-align:middle;margin-right:4px;">`
                : '';
            const value = nbaAthleteStatValue(item.data, row, item.group, item.stat);
            return `<tr>
                <td>${index + 1}</td>
                <td style="text-align:left;font-weight:600;color:#0f172a;">${athlete.shortName || athlete.displayName || '-'}</td>
                <td style="text-align:left;"><div style="display:flex;align-items:center;">${logo}${teamName}</div></td>
                <td style="font-weight:700;color:#0f172a;">${value}</td>
            </tr>`;
        }).join('');

        return `
        <div class="sp-standings-wrap">
            <div class="sp-section-title" style="margin-top:6px;">${item.title}</div>
            <table class="sp-standings-table sp-stat-table">
                <colgroup><col class="sp-stat-col-rank"><col class="sp-stat-col-player"><col class="sp-stat-col-team"><col class="sp-stat-col-value"></colgroup>
                <thead><tr><th>#</th><th>선수</th><th>팀</th><th>${item.label}</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            ${sportsStatMoreBtnHtml(key, all.length, '선수 더보기')}
        </div>`;
    }).join('');
}

// MLB 공식 API(statsapi.mlb.com) 응답 전용 렌더러 — ESPN 쪽(widgetStatLeaders)과 필드
// 이름이 아예 달라서(athlete→person, team.logos 없음 등) 따로 만들었다(2026-08-25).
function widgetMlbStatLeaders(mlbLeaders) {
    const WANTED_MLB = {
        battingAverage: { title: '타율 순위', label: 'AVG' },
        homeRuns: { title: '홈런 순위', label: 'HR' },
        runsBattedIn: { title: '타점 순위', label: 'RBI' },
        stolenBases: { title: '도루 순위', label: 'SB' },
        earnedRunAverage: { title: '평균자책 순위', label: 'ERA' },
        wins: { title: '다승 순위', label: 'W' },
        strikeouts: { title: '탈삼진 순위', label: 'SO' },
        saves: { title: '세이브 순위', label: 'SV' },
    };
    const HITTING_ORDER = ['battingAverage', 'homeRuns', 'runsBattedIn', 'stolenBases'];
    const PITCHING_ORDER = ['earnedRunAverage', 'wins', 'strikeouts', 'saves'];
    const leagueLeaders = mlbLeaders?.[widgetMlbLeague] || [];
    const categories = new Map(leagueLeaders.map(cat => [cat.leaderCategory, cat]));

    const renderCategory = (category) => {
        const cat = categories.get(category);
        const config = WANTED_MLB[category];
        if (!cat || !config) return '';
        const all = cat.leaders || [];
        if (!all.length) return '';
        const key = `sp-stat-mlb-${widgetMlbLeague}-${cat.leaderCategory}`;
        const top = SPORTS_STAT_EXPANDED.has(key) ? all : all.slice(0, SPORTS_STAT_COLLAPSED_LIMIT);

        const rows = top.map((l, i) => {
            const p = l.person || {};
            const shortName = p.firstName ? `${p.firstName[0]}. ${p.lastName}` : (p.fullName || '-');
            const teamName = getKoName(l.team?.name, 'mlb');
            return `<tr>
                <td>${l.rank ?? i + 1}</td>
                <td style="text-align:left; font-weight:600; color:#0f172a;">${shortName}</td>
                <td style="text-align:left;">${teamName}</td>
                <td style="font-weight:700; color:#0f172a;">${l.value ?? ''}</td>
            </tr>`;
        }).join('');

        return `
        <div class="sp-standings-wrap">
            <div class="sp-section-title" style="margin-top:6px;">${config.title}</div>
            <table class="sp-standings-table sp-stat-table">
                <colgroup><col class="sp-stat-col-rank"><col class="sp-stat-col-player"><col class="sp-stat-col-team"><col class="sp-stat-col-value"></colgroup>
                <thead><tr><th>#</th><th>선수</th><th>팀</th><th>${config.label}</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            ${sportsStatMoreBtnHtml(key, all.length, '더보기')}
        </div>`;
    };

    let html = `
        <div class="sp-mlb-league-tabs" role="tablist" aria-label="MLB 리그 선택">
            <button type="button" class="sp-mlb-league-tab ${widgetMlbLeague === 'al' ? 'active' : ''}" role="tab" aria-selected="${widgetMlbLeague === 'al'}" onclick="setWidgetMlbLeague('al')">아메리칸리그</button>
            <button type="button" class="sp-mlb-league-tab ${widgetMlbLeague === 'nl' ? 'active' : ''}" role="tab" aria-selected="${widgetMlbLeague === 'nl'}" onclick="setWidgetMlbLeague('nl')">내셔널리그</button>
        </div>
        <div class="sp-mlb-stat-group">타자</div>`;
    html += HITTING_ORDER.map(renderCategory).join('');
    html += '<div class="sp-mlb-stat-group">투수</div>';
    html += PITCHING_ORDER.map(renderCategory).join('');
    return html;
}

function widgetSection(title, body) {
    return `<div class="sp-section-title">${title}</div>${body}`;
}

function widgetCard(ev, type, tab) {
    const comp = ev.competitions?.[0];
    if (!comp) return '';
    const isSoccer = WIDGET_CFG[tab]?.soccer;
    const home = comp.competitors?.find(c => c.homeAway === 'home');
    const away = comp.competitors?.find(c => c.homeAway === 'away');
    if (!home || !away) return '';

    const L = home;
    const R = away;
    const ls = home.score||'0';
    const rs = away.score||'0';
    const lWin = type==='final' && parseInt(ls)>parseInt(rs);
    const rWin = type==='final' && parseInt(rs)>parseInt(ls);
    const lc = L.team?.color ? `#${L.team.color}` : '#1e3a5f';
    const rc = R.team?.color ? `#${R.team.color}` : '#1e3a5f';

    let badge='', tinfo='';
    if (type==='live') {
        badge = `<span class="sp-status-badge live">LIVE</span>`;
        const liveDetail = tab === 'mlb'
            ? (ev.status?.displayClock || (ev.status?.period ? `${ev.status.period}회` : ''))
            : `${ev.status?.displayClock||''} ${ev.status?.period?`Q${ev.status.period}`:''}`;
        tinfo = `<span class="sp-time-info live">${liveDetail}</span>`;
    } else if (type==='final') {
        badge = `<span class="sp-status-badge final">종료</span>`;
        tinfo = `<span class="sp-time-info">Final</span>`;
    } else {
        const kst = new Date(ev.date).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Seoul'});
        badge = `<span class="sp-status-badge sched">예정</span>`;
        tinfo = `<span class="sp-time-info">${kst}</span>`;
    }

    const scoreEl = type==='sched'
        ? `<span class="sp-score-vs">VS</span>`
        : `<div class="sp-score-nums"><span>${ls}</span><span class="sp-score-sep">:</span><span>${rs}</span></div>`;

    const teamEl = (t, win, isAway) => {
        const teamData = (isAway ? R : L).team;
        const logoUrl = teamData?.logo || (teamData?.logos && teamData.logos[0]?.href);
        const displayName = getKoName(teamData?.shortDisplayName || teamData?.name, tab);
        
        const logoHtml = logoUrl 
            ? `<img src="${logoUrl}" style="width:100%; height:100%; object-fit:contain; border-radius:50%;">` 
            : `${teamData?.abbreviation?.slice(0,2)||'?'}`;

        return `
        <div class="sp-team ${isAway?'away':''} ${win?'winner':''}">
            <div class="sp-team-logo" style="background:${isAway?rc:lc}22;border:1px solid ${isAway?rc:lc}44;color:${isAway?rc:lc}; padding: 2px;">
                ${logoHtml}
            </div>
            <div class="sp-team-info">
                <div class="sp-team-name">${displayName}</div>
                <div class="sp-team-record">${(isAway?R:L).records?.[0]?.summary||''}</div>
            </div>
        </div>`;
    };

    // 득점/퇴장 — ESPN 스코어보드가 competitions[0].details에 이미 담아서 준다(경기별
    // 별도 호출 불필요). 라이브·종료 경기에서만, 골(scoringPlay)과 레드카드만 뽑아서
    // 시간순으로 보여준다(2026-08-25).
    const eventsHtml = (isSoccer && (type==='live' || type==='final'))
        ? widgetMatchEvents(comp, home, away)
        : '';

    return `
    <div class="sp-score-card ${type==='live'?'live':''}">
        <div class="sp-card-meta">
            <span class="sp-league-label">${WIDGET_CFG[tab]?.label||''}</span>
            ${badge}
        </div>
        <div class="sp-matchup">
            ${teamEl(L, lWin, false)}
            <div class="sp-score-center">${scoreEl}${tinfo}</div>
            ${teamEl(R, rWin, true)}
        </div>
        ${eventsHtml}
    </div>`;
}

// 득점/퇴장 목록 — 홈/원정 어느 팀인지는 details의 team.id를 competitors의 team.id와
// 비교해서 판정한다(ESPN이 홈/원정 구분자를 따로 안 주는 경우가 있어서).
function widgetMatchEvents(comp, home, away) {
    const details = comp.details || [];
    const homeId = home.team?.id;

    const rows = details
        .filter(d => d.scoringPlay || d.redCard)
        .map(d => ({
            minute: d.clock?.displayValue || '',
            minuteVal: d.clock?.value ?? 0,
            isHome: d.team?.id === homeId,
            player: d.athletesInvolved?.[0]?.displayName || d.athletesInvolved?.[0]?.shortName || '',
            isRed: !!d.redCard,
            isOwnGoal: !!d.ownGoal,
            isPenalty: !!d.penaltyKick,
        }))
        .sort((a, b) => a.minuteVal - b.minuteVal);

    if (!rows.length) return '';

    const rowHtml = rows.map(r => {
        const icon = r.isRed ? '🟥' : (r.isOwnGoal ? '⚽️(자책)' : '⚽');
        const pk = r.isPenalty ? ' (PK)' : '';
        return `<div class="sp-match-event ${r.isHome ? 'home' : 'away'}">
            <span class="sp-event-minute">${r.minute}</span>
            <span class="sp-event-icon">${icon}</span>
            <span class="sp-event-player">${r.player}${pk}</span>
        </div>`;
    }).join('');

    return `<div class="sp-match-events">${rowHtml}</div>`;
}

// 순위별 배경색 반환 (EPL: UCL/UEL/UECL/강등, NBA: 플레이오프/플레이인)
function getRankStyle(rank, tab, total) {
    if (tab === 'epl') {
        if (rank <= 4)       return { bg: 'rgba(37,99,235,0.08)',  border: '#2563eb' }; // UCL
        if (rank === 5)      return { bg: 'rgba(16,185,129,0.08)', border: '#10b981' }; // UEL
        if (rank === 6)      return { bg: 'rgba(20,184,166,0.08)', border: '#14b8a6' }; // UECL
        if (rank >= total-2) return { bg: 'rgba(239,68,68,0.08)',  border: '#ef4444' }; // 강등
    } else if (tab === 'nba') {
        if (rank <= 6)  return { bg: 'rgba(37,99,235,0.08)',  border: '#2563eb' }; // 플레이오프
        if (rank <= 10) return { bg: 'rgba(234,179,8,0.08)',  border: '#eab308' }; // 플레이인
    } else if (tab === 'wc') {
        if (rank <= 2) return { bg: 'rgba(37,99,235,0.08)',  border: '#2563eb' }; // 16강 진출
        if (rank === 3) return { bg: 'rgba(234,179,8,0.08)', border: '#eab308' }; // 3위 (진출 경쟁)
        if (rank === 4) return { bg: 'rgba(239,68,68,0.08)', border: '#ef4444' }; // 탈락
    }
    return null;
}

// ✅ [승, 무, 패, 승점, 득실] 순서 반영
function buildStandingsRows(entries, tab) {
    let rows = '';
    const total = entries.length;
    entries.forEach((e, i) => {
        const rank = i + 1;
        const s = e.stats || [];
        const getStat = name => { const x = s.find(item => item.name === name); return x ? x.displayValue : '0'; };
        
        const teamName = getKoName(e.team?.shortDisplayName || e.team?.name, tab);
        const logoUrl = e.team?.logos?.[0]?.href || '';
        const logoImg = logoUrl ? `<img src="${logoUrl}" style="width:16px; height:16px; object-fit:contain; vertical-align:middle; margin-right:6px;">` : '';

        const style = getRankStyle(rank, tab, total);
        const rowBg  = style ? `background:${style.bg}; border-left:3px solid ${style.border};` : 'border-left:3px solid transparent;';
        const rankEl = style
            ? `<span class="sp-rank-num" style="background:${style.border}; color:#fff;">${rank}</span>`
            : `<span class="sp-rank-num">${rank}</span>`;

        if (tab === 'epl' || tab === 'wc') {
            const gp = getStat('gamesPlayed');
            const w = getStat('wins');
            const d = getStat('ties');
            const l = getStat('losses');
            const pts = getStat('points');
            const gd = getStat('pointDifferential');

            rows += `<tr style="${rowBg}">
                <td>${rankEl}</td>
                <td><div style="display:flex; align-items:center;">${logoImg}${teamName}</div></td>
                <td>${gp}</td><td>${w}</td><td>${d}</td><td>${l}</td><td style="font-weight:700; color:#0f172a;">${pts}</td><td>${gd}</td>
            </tr>`;
        } else {
            const gp = getStat('gamesPlayed');
            const w = getStat('wins');
            const l = getStat('losses');
            const pct = getStat('winPercent') || getStat('pointDifferential') || '-';

            rows += `<tr style="${rowBg}">
                <td>${rankEl}</td>
                <td><div style="display:flex; align-items:center;">${logoImg}${teamName}</div></td>
                <td>${gp}</td><td>${w}</td><td>${l}</td><td>${pct}</td>
            </tr>`;
        }
    });
    return rows;
}

function widgetStandings(data, tab) {
    // ✅ NBA: 동부/서부 분리 및 승률 명시적 내림차순 정렬 적용
    if (tab === 'nba' && data.children) {
        let html = '';
        data.children.forEach(conf => {
            let confName = '컨퍼런스';
            if(conf.name.includes('Eastern')) confName = '동부 컨퍼런스';
            if(conf.name.includes('Western')) confName = '서부 컨퍼런스';
            
            let entries = conf.standings.entries || [];
            
            // 승률 높은 순서대로 내림차순 정렬
            entries.sort((a, b) => {
                const getPct = (team) => {
                    const stat = team.stats?.find(x => x.name === 'winPercent');
                    return stat ? parseFloat(stat.displayValue) || 0 : 0;
                };
                return getPct(b) - getPct(a);
            });

            let rows = buildStandingsRows(entries, tab);
            
            const isLast = conf === data.children[data.children.length - 1];
            html += `
            <div class="sp-standings-wrap">
                <div class="sp-section-title" style="margin-top:6px;">순위표 - ${confName}</div>
                <table class="sp-standings-table">
                    <thead><tr><th>#</th><th>팀</th><th>경기</th><th>승</th><th>패</th><th>승률</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
                ${isLast ? `<div style="display:flex;gap:10px;flex-wrap:wrap;padding:6px 4px 2px;font-size:10px;color:#64748b;">
                    <span style="padding-left:6px;border-left:3px solid #2563eb;">플레이오프</span>
                    <span style="padding-left:6px;border-left:3px solid #eab308;">플레이인</span>
                </div>` : ''}
            </div>`;
        });
        return html;
    } 
    // ✅ MLB: AL/NL → 동부/중부/서부 지구별 분리
    else if (tab === 'mlb' && data.children) {
        // 팀 약어 기반 하드코딩 지구 편성 (API 구조에 무관하게 동작)
        const MLB_DIVS = [
            {
                lg: 'AL 아메리칸리그',
                divs: [
                    { name: '▸ 동부지구', abbs: ['NYY','BOS','TOR','BAL','TB'] },
                    { name: '▸ 중부지구', abbs: ['CHW','CWS','CLE','DET','KC','MIN'] },
                    { name: '▸ 서부지구', abbs: ['HOU','LAA','ATH','OAK','SEA','TEX'] },
                ]
            },
            {
                lg: 'NL 내셔널리그',
                divs: [
                    { name: '▸ 동부지구', abbs: ['ATL','MIA','NYM','PHI','WSH'] },
                    { name: '▸ 중부지구', abbs: ['CHC','CIN','MIL','PIT','STL'] },
                    { name: '▸ 서부지구', abbs: ['ARI','LAD','SD','SF','COL'] },
                ]
            }
        ];

        const sortByPct = arr => arr.slice().sort((a,b) => {
            const g = t => parseFloat(t.stats?.find(x=>x.name==='winPercent')?.displayValue||0);
            return g(b)-g(a);
        });

        const makeLeagueHeader = (title) => `
            <div class="sp-section-title" style="margin-top:14px; font-weight:800; font-size:13px; background:#e8edf5; padding:6px 10px; border-radius:4px;">${title}</div>`;

        const makeDivTable = (title, entries) => {
            if (!entries.length) return '';
            const rows = buildStandingsRows(entries, tab);
            return `
            <div class="sp-standings-wrap">
                <div class="sp-section-title" style="margin-top:6px; padding-left:4px; font-size:11.5px; color:#64748b;">${title}</div>
                <table class="sp-standings-table">
                    <thead><tr><th>#</th><th>팀</th><th>경기</th><th>승</th><th>패</th><th>승률</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        };

        // API 응답에서 모든 팀 entries 수집 (중복 제거)
        const seen = new Set();
        const allEntries = [];
        const collect = (entries) => {
            (entries || []).forEach(e => {
                const key = e.team?.id || e.team?.abbreviation;
                if (key && !seen.has(key)) { seen.add(key); allEntries.push(e); }
            });
        };
        data.children.forEach(c => {
            collect(c.standings?.entries);
            (c.children || []).forEach(div => collect(div.standings?.entries));
        });

        if (!allEntries.length) {
            return `<div class="sp-state-box"><span>순위 데이터를 불러올 수 없습니다</span></div>`;
        }

        let html = '';
        MLB_DIVS.forEach(({ lg, divs }) => {
            html += makeLeagueHeader(lg);
            divs.forEach(({ name, abbs }) => {
                const divEntries = allEntries.filter(e =>
                    abbs.includes((e.team?.abbreviation || '').toUpperCase())
                );
                html += makeDivTable(name, sortByPct(divEntries));
            });
        });

        return html || `<div class="sp-state-box"><span>순위 데이터를 불러올 수 없습니다</span></div>`;
    }
    // ✅ WC: 조별리그 그룹별 분리 렌더링
    else if (tab === 'wc') {
        if (!data.children?.length) {
            return `<div class="sp-standings-wrap" style="text-align:center; padding:20px 10px; color:#94a3b8;">
                <div style="font-size:13px; font-weight:600; color:#64748b;">조별 순위 데이터 없음</div>
                <div style="font-size:11px; margin-top:4px;">토너먼트 단계이거나 데이터가 아직 제공되지 않습니다</div>
            </div>`;
        }

        let html = '';
        data.children.forEach(group => {
            const groupName = group.name || '그룹';
            const entries = group.standings?.entries || [];
            if (!entries.length) return;

            entries.sort((a, b) => {
                const gs = (t, n) => parseFloat(t.stats?.find(s => s.name === n)?.displayValue || 0);
                const ptsDiff = gs(b, 'points') - gs(a, 'points');
                return ptsDiff !== 0 ? ptsDiff : gs(b, 'pointDifferential') - gs(a, 'pointDifferential');
            });

            const rows = buildStandingsRows(entries, 'wc');
            html += `
            <div class="sp-standings-wrap">
                <div class="sp-section-title" style="margin-top:6px;">${groupName}</div>
                <table class="sp-standings-table">
                    <thead><tr><th>#</th><th>팀</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>승점</th><th>득실</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        });

        if (html) {
            html += `<div style="display:flex;gap:10px;flex-wrap:wrap;padding:6px 4px 10px;font-size:10px;color:#64748b;">
                <span style="padding-left:6px;border-left:3px solid #2563eb;">16강 진출</span>
                <span style="padding-left:6px;border-left:3px solid #eab308;">3위 (진출 경쟁)</span>
                <span style="padding-left:6px;border-left:3px solid #ef4444;">탈락</span>
            </div>`;
        }
        return html || `<div class="sp-state-box"><span>조별 순위 데이터를 불러올 수 없습니다</span></div>`;
    }
    else {
        let entries = [];
        if (data.children && data.children.length > 0) {
            data.children.forEach(child => {
                if (child.standings && child.standings.entries) {
                    entries = entries.concat(child.standings.entries);
                }
            });
        } else if (data.standings && data.standings.entries) {
            entries = data.standings.entries;
        }

        if (!entries.length) return '';

        entries.sort((a, b) => {
            const getStat = (team, statName) => {
                const stat = team.stats?.find(x => x.name === statName);
                return stat ? parseFloat(stat.displayValue) || 0 : 0;
            };

            if (tab === 'epl') {
                const ptsA = getStat(a, 'points');
                const ptsB = getStat(b, 'points');
                if (ptsA !== ptsB) return ptsB - ptsA;
                return getStat(b, 'pointDifferential') - getStat(a, 'pointDifferential'); 
            } else {
                return getStat(b, 'winPercent') - getStat(a, 'winPercent');
            }
        });

        let rows = buildStandingsRows(entries, tab);
        
        // ✅ EPL 열 순서: 승, 무, 패, 승점, 득실
        let headHtml = tab === 'epl'
            ? `<tr><th>#</th><th>팀</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>승점</th><th>득실</th></tr>`
            : `<tr><th>#</th><th>팀</th><th>경기</th><th>승</th><th>패</th><th>승률</th></tr>`;

        const legendStyle = 'display:flex;gap:10px;flex-wrap:wrap;padding:6px 4px 2px;font-size:10px;color:#64748b;';
        const legendSpanStyle = 'padding-left:6px;';
        const legend = tab === 'epl'
            ? `<div style="${legendStyle}">
                <span style="${legendSpanStyle}border-left:3px solid #2563eb;">UCL</span>
                <span style="${legendSpanStyle}border-left:3px solid #10b981;">UEL</span>
                <span style="${legendSpanStyle}border-left:3px solid #14b8a6;">UECL</span>
                <span style="${legendSpanStyle}border-left:3px solid #ef4444;">강등</span>
               </div>`
            : `<div style="${legendStyle}">
                <span style="${legendSpanStyle}border-left:3px solid #2563eb;">플레이오프</span>
                <span style="${legendSpanStyle}border-left:3px solid #eab308;">플레이인</span>
               </div>`;

        return `<div class="sp-standings-wrap">
            <div class="sp-section-title" style="margin-top:6px;">순위표</div>
            <table class="sp-standings-table">
                <thead>${headHtml}</thead>
                <tbody>${rows}</tbody>
            </table>
            ${legend}
        </div>`;
    }
}
