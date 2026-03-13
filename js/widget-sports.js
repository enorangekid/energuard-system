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
    "Bournemouth": "본머스",
    "Wolverhampton Wanderers": "울버햄튼", "Wolves": "울버햄튼",
    "Crystal Palace": "크리스탈 팰리스", "C Palace": "크리스탈 팰리스",
    "Brentford": "브렌트포드",
    "Fulham": "풀럼",
    "Everton": "에버턴",
    "Nottingham Forest": "노팅엄", "Nottm Forest": "노팅엄",
    "Leicester City": "레스터",
    "Ipswich Town": "입스위치",
    "Southampton": "사우샘프턴",
    "Sunderland": "선덜랜드",
    "Leeds United": "리즈", "Leeds": "리즈",
    "Burnley": "번리",

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
    mlb: { label:'MLB',      soccer:false },
};

const WIDGET_SCORE_EP = {
    nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    epl: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard',
    ucl: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard',
    mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
};
const WIDGET_STAND_EP = {
    nba: 'https://site.api.espn.com/apis/v2/sports/basketball/nba/standings',
    epl: 'https://site.api.espn.com/apis/v2/sports/soccer/eng.1/standings',
    mlb: null, // MLB 순위표는 시즌 중(4월~10월)에만 제공됨
};

function setWidgetTab(tab, el) {
    currentWidgetTab = tab;
    document.querySelectorAll('.sp-tab-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    if (widgetCache[tab]) renderWidget(tab, widgetCache[tab]);
    else loadWidgetData(tab);
}

function reloadWidget() {
    delete widgetCache[currentWidgetTab];
    loadWidgetData(currentWidgetTab);
}

async function loadWidgetData(tab) {
    const content = document.getElementById('sp-content');
    const icon = document.getElementById('sp-refreshIcon');
    content.innerHTML = `<div class="sp-state-box sp-loading"><i class="fa-solid fa-spinner fa-spin"></i><span>데이터를 불러오는 중입니다...</span></div>`;
    icon.classList.add('fa-spin');

    try {
        const [scoreRes, standRes] = await Promise.all([
            fetch(WIDGET_SCORE_EP[tab]).then(r => r.json()),
            WIDGET_STAND_EP[tab] ? fetch(WIDGET_STAND_EP[tab]).then(r => r.json()).catch(()=>null) : Promise.resolve(null)
        ]);

        widgetCache[tab] = { scores: scoreRes, standings: standRes };
        renderWidget(tab, widgetCache[tab]);

        const now = new Date();
        document.getElementById('sp-updateTime').innerText =
            `업데이트 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    } catch(e) {
        content.innerHTML = `<div class="sp-state-box"><i class="fa-solid fa-satellite-dish" style="color:#ef4444; font-size:32px;"></i><span style="margin-top:10px;">데이터를 불러오지 못했습니다.</span><span style="font-size:11px; color:#94a3b8; font-weight:normal;">잠시 후 다시 시도해주세요.</span></div>`;
        console.error("Widget API Error:", e);
    } finally {
        icon.classList.remove('fa-spin');
    }
}

function renderWidget(tab, data) {
    const events = data.scores?.events || [];
    const live  = events.filter(e => e.status?.type?.state === 'in');
    const post  = events.filter(e => e.status?.type?.state === 'post').slice(0,8);
    const pre   = events.filter(e => e.status?.type?.state === 'pre').slice(0,8);

    let html = '';
    if (live.length)  html += widgetSection(`LIVE (${live.length}경기)`, live.map(e=>widgetCard(e,'live',tab)).join(''));
    if (pre.length)   html += widgetSection('예정 경기',  pre.map(e=>widgetCard(e,'sched',tab)).join(''));
    if (post.length)  html += widgetSection('최근 결과',  post.map(e=>widgetCard(e,'final',tab)).join(''));
    if (!html)        html  = `<div class="sp-state-box"><i class="fa-regular fa-calendar-xmark"></i><span>경기 정보가 없습니다</span></div>`;
    
    if (data.standings) {
        html += widgetStandings(data.standings, tab);
    } else if (tab === 'mlb') {
        html += `<div class="sp-standings-wrap" style="text-align:center; padding:20px 10px; color:#94a3b8;">
            <i class="fa-solid fa-baseball" style="font-size:28px; margin-bottom:10px; display:block;"></i>
            <div style="font-size:13px; font-weight:600; color:#64748b;">MLB 시즌 준비 중</div>
            <div style="font-size:11px; margin-top:4px;">순위표는 정규 시즌(4월~10월) 중에 제공됩니다</div>
        </div>`;
    }

    document.getElementById('sp-content').innerHTML = html;
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
        tinfo = `<span class="sp-time-info live">${ev.status?.displayClock||''} ${ev.status?.period?`Q${ev.status.period}`:''}</span>`;
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
    </div>`;
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

        if (tab === 'epl') {
            const w = getStat('wins');
            const d = getStat('ties');
            const l = getStat('losses');
            const pts = getStat('points');
            const gd = getStat('pointDifferential');
            
            rows += `<tr style="${rowBg}">
                <td>${rankEl}</td>
                <td><div style="display:flex; align-items:center;">${logoImg}${teamName}</div></td>
                <td>${w}</td><td>${d}</td><td>${l}</td><td style="font-weight:700; color:#0f172a;">${pts}</td><td>${gd}</td>
            </tr>`;
        } else {
            const w = getStat('wins');
            const l = getStat('losses');
            const pct = getStat('winPercent') || getStat('pointDifferential') || '-';
            
            rows += `<tr style="${rowBg}">
                <td>${rankEl}</td>
                <td><div style="display:flex; align-items:center;">${logoImg}${teamName}</div></td>
                <td>${w}</td><td>${l}</td><td>${pct}</td>
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
                    <thead><tr><th>#</th><th>팀</th><th>승</th><th>패</th><th>승률</th></tr></thead>
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
        const divKo = { 'East':'동부', 'Central':'중부', 'West':'서부' };
        const lgKo  = { 'American League':'🔵 AL 아메리칸리그', 'National League':'🔴 NL 내셔널리그' };

        const sortByPct = arr => arr.slice().sort((a,b) => {
            const g = t => parseFloat(t.stats?.find(x=>x.name==='winPercent')?.displayValue||0);
            return g(b)-g(a);
        });

        // 리그 헤더 (테이블 없이 타이틀만)
        const makeLeagueHeader = (title) => `
            <div class="sp-section-title" style="margin-top:14px; font-weight:800; font-size:13px; background:#e8edf5; padding:6px 10px; border-radius:4px;">${title}</div>`;

        // 지구별 테이블
        const makeDivTable = (title, entries) => {
            if (!entries.length) return '';
            const rows = buildStandingsRows(entries, tab);
            return `
            <div class="sp-standings-wrap">
                <div class="sp-section-title" style="margin-top:6px; padding-left:4px; font-size:11.5px; color:#64748b;">${title}</div>
                <table class="sp-standings-table">
                    <thead><tr><th>#</th><th>팀</th><th>승</th><th>패</th><th>승률</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        };

        let html = '';

        // 2단계: children = AL/NL, 그 안에 children = 지구
        const hasLeagues = data.children.some(c => c.children?.length);
        if (hasLeagues) {
            data.children.forEach(league => {
                const lgName = lgKo[league.name] || league.name;
                html += makeLeagueHeader(lgName);

                (league.children || []).forEach(div => {
                    const dk = Object.keys(divKo).find(k => div.name?.includes(k));
                    const divName = `▸ ${dk ? divKo[dk] : div.name}지구`;
                    html += makeDivTable(divName, sortByPct(div.standings?.entries || []));
                });
            });
        } else {
            // 1단계: children이 바로 지구 (이름에 AL/NL 포함)
            const lgMap = { 'American':'🔵 AL 아메리칸리그', 'National':'🔴 NL 내셔널리그' };
            ['American','National'].forEach(lg => {
                const lgDivs = data.children.filter(c => c.name?.includes(lg));
                if (!lgDivs.length) return;
                html += makeLeagueHeader(lgMap[lg]);
                lgDivs.forEach(div => {
                    const dk = Object.keys(divKo).find(k => div.name?.includes(k));
                    const divName = `▸ ${dk ? divKo[dk] : div.name}지구`;
                    html += makeDivTable(divName, sortByPct(div.standings?.entries || []));
                });
            });
        }

        return html || `<div class="sp-state-box"><span>순위 데이터를 불러올 수 없습니다</span></div>`;
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
            ? `<tr><th>#</th><th>팀</th><th>승</th><th>무</th><th>패</th><th>승점</th><th>득실</th></tr>`
            : `<tr><th>#</th><th>팀</th><th>승</th><th>패</th><th>승률</th></tr>`;

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