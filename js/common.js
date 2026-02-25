/* ================= [1. Config & Global State] ================= */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxnBm3LeW0c_z7vW6z0IJ0voBA6IZnnGjqQKvdB7a-zvs_5dBlG3fMFKQKWy5B9Yj5J/exec"; 
var authPassword = ""; 

/* ================= [2. Login Logic] ================= */
window.onload = function() {
    document.getElementById("loginPassInput").addEventListener("keypress", function(e) {
        if(e.key === "Enter") tryLogin();
    });

    var savedPass = localStorage.getItem("dashboard_pass");
    if (savedPass) {
        authPassword = savedPass;
        document.getElementById('loginScreen').classList.add('hidden'); 
        showPage('dashboard', document.querySelector('.menu-item.active'));
    }
    
    setInterval(() => {
      const now = new Date();
      document.getElementById('clock').innerText = now.toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }, 1000);
    
    const tDate = document.getElementById('tDate');
    if(tDate) tDate.valueAsDate = new Date();

    // ✅ 실시간 날씨 데이터 로드 (초기 1회 및 30분마다 갱신)
    loadWeather();
    setInterval(loadWeather, 30 * 60 * 1000);
};

// ✅ 포천시 가산면 기준 날씨 API 호출 함수
async function loadWeather() {
    try {
        const lat = 37.8289; // 포천시 가산면 위도
        const lon = 127.1994; // 포천시 가산면 경도
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        
        if(data && data.current_weather) {
            const temp = data.current_weather.temperature;
            const code = data.current_weather.weathercode;
            
            let icon = '<i class="fa-solid fa-sun" style="color:#f59e0b;"></i>';
            let desc = '맑음';
            if (code === 1 || code === 2) { icon = '<i class="fa-solid fa-cloud-sun" style="color:#94a3b8;"></i>'; desc = '구름조금'; }
            if (code === 3) { icon = '<i class="fa-solid fa-cloud" style="color:#94a3b8;"></i>'; desc = '흐림'; }
            if ([45,48].includes(code)) { icon = '<i class="fa-solid fa-smog" style="color:#94a3b8;"></i>'; desc = '안개'; }
            if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) { icon = '<i class="fa-solid fa-cloud-rain" style="color:#3b82f6;"></i>'; desc = '비'; }
            if ([71,73,75,77,85,86].includes(code)) { icon = '<i class="fa-solid fa-snowflake" style="color:#0ea5e9;"></i>'; desc = '눈'; }
            if ([95,96,99].includes(code)) { icon = '<i class="fa-solid fa-cloud-bolt" style="color:#64748b;"></i>'; desc = '뇌우'; }

            const weatherEl = document.getElementById('weather-info');
            if (weatherEl) {
                weatherEl.innerHTML = `${icon} <span style="font-weight:700; color:#1e293b;">${temp}°C</span> <span style="font-size:12px; color:#9ca3af;">(${desc})</span>`;
            }
        }
    } catch (e) {
        console.error("날씨 정보 로드 실패:", e);
        const weatherEl = document.getElementById('weather-info');
        if (weatherEl) weatherEl.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="color:#ef4444;"></i> 날씨 오류';
    }
}

function tryLogin() {
    var input = document.getElementById('loginPassInput');
    var msg = document.getElementById('loginMsg');
    var isKeep = document.getElementById('keepLoginCheck').checked;
    var pass = input.value;

    if (!pass) { msg.innerText = "비밀번호를 입력해주세요."; return; }
    msg.innerText = "확인 중..."; msg.style.color = "#666";

    fetch(SCRIPT_URL, {
        method: 'POST', body: JSON.stringify({ action: "auth_check", password: pass })
    }).then(res => res.json()).then(json => {
        if (json.status === "success") {
            authPassword = pass; 
            if (isKeep) localStorage.setItem("dashboard_pass", pass);
            document.getElementById('loginScreen').classList.add('hidden');
            showPage('dashboard', document.querySelector('.menu-item.active'));
        } else {
            msg.innerText = "⛔ 비밀번호가 틀렸습니다."; msg.style.color = "red";
            input.value = ""; input.focus();
        }
    }).catch(err => {
        msg.innerText = "⚠️ 서버 통신 오류"; msg.style.color = "red";
    });
}

function handleLogout() {
    if (confirm("로그아웃 하시겠습니까?")) {
        authPassword = ""; 
        localStorage.removeItem("dashboard_pass"); 
        if(typeof isDashboardLoaded !== 'undefined') isDashboardLoaded = false; 
        location.reload(); 
    }
}

/* ================= [3. Navigation Logic] ================= */
function showPage(pageId, element) {
  document.querySelectorAll('.page-section').forEach(section => { section.classList.remove('active'); });
  document.getElementById('page-' + pageId).classList.add('active');
  
  if(element) {
    document.querySelectorAll('.menu-item').forEach(menu => { menu.classList.remove('active'); });
    element.classList.add('active');
    
    let menuText = element.querySelector('.menu-text');
    document.getElementById('pageTitleText').innerText = menuText ? menuText.innerText.trim() : element.innerText.trim();
  } else if(pageId === 'dashboard') {
    document.getElementById('pageTitleText').innerText = '지표 요약';
    let dashMenu = document.querySelector('.menu-item[onclick*="dashboard"]');
    if(dashMenu) dashMenu.classList.add('active');
  }
  
  if(pageId === 'dashboard' && typeof loadDashboardData === 'function') loadDashboardData();
  
  if(pageId === 'timeline' && typeof loadTimelineFromServer === 'function') loadTimelineFromServer();
  if(pageId === 'worklog' && typeof loadWorklogFromServer === 'function') loadWorklogFromServer(); 
  if(pageId === 'productlogs' && typeof renderProductLogPage === 'function') renderProductLogPage();
  if(pageId === 'ranking' && typeof loadRankingData === 'function') loadRankingData();
  if(pageId === 'sales' && typeof loadSalesData === 'function') loadSalesData();

if(pageId === 'notes') {
      document.getElementById('loader').style.display = 'flex';
      
      setTimeout(() => {
          const dateInput = document.getElementById('noteDate');
          
          // 무조건 한국 시간 기준 '오늘 날짜'로 세팅되도록 변경
          const now = new Date();
          const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
          dateInput.value = todayStr;

          if(typeof initQuill === 'function') initQuill();
          
          if(typeof handleNoteDateChange === 'function') {
              handleNoteDateChange(); 
          } else {
              document.getElementById('loader').style.display = 'none';
          }
      }, 300);
  }
}

/* ================= [4. Common Utils] ================= */
function formatCurrency(num) {
    if(num === "" || num === undefined || num === null) return "";
    return Number(num).toLocaleString();
}
function parseCurrency(str) { return Number(String(str).replace(/,/g, '')); }
function formatDate(dateStr) {
    if(!dateStr) return "";
    var d = new Date(dateStr);
    if(isNaN(d.getTime())) return dateStr; 
    var m = d.getMonth() + 1;
    return d.getFullYear() + '-' + (m < 10 ? '0'+m : m);
}

/* ================= [5. UI Utils] ================= */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

function toggleCalcPanel() {
    const panel = document.getElementById('calcPanel');
    const memoPanel = document.getElementById('quickMemoPanel');
    const aiPanel = document.getElementById('aiChatPanel');
    const widgetPanel = document.getElementById('widgetPanel');
    
    if(memoPanel && memoPanel.classList.contains('open')) memoPanel.classList.remove('open');
    if(aiPanel && aiPanel.classList.contains('open')) aiPanel.classList.remove('open');
    if(widgetPanel && widgetPanel.classList.contains('open')) widgetPanel.classList.remove('open');

    const isOpen = panel.classList.contains('open');
    if (!isOpen) {
        panel.classList.add('open');
        const frame = document.getElementById('calcFrame');
        const selector = document.getElementById('calcSelector');
        if (!frame.src || frame.src === window.location.href) {
            frame.src = selector.value;
        }
    } else {
        panel.classList.remove('open');
    }
}

function changeCalculator(url) {
    document.getElementById('calcFrame').src = url;
}

/* ================= [14. Widget Panel Logic (Sports)] ================= */

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
    "Rangers": "텍사스", "Texas Rangers": "텍사스",
    "Orioles": "볼티모어", "Baltimore Orioles": "볼티모어",
    "Mariners": "시애틀", "Seattle Mariners": "시애틀",

    // UCL
    "Real Madrid": "레알 마드리드",
    "Barcelona": "바르셀로나",
    "Bayern Munich": "바이에른 뮌헨",
    "Paris Saint-Germain": "PSG", "Paris SG": "PSG",
    "Inter Milan": "인테르",
    "Juventus": "유벤투스",
    "AC Milan": "AC 밀란",
    "Atletico Madrid": "아틀레티코",
    "Borussia Dortmund": "도르트문트"
};

// ✅ Spurs 중복 문제 완벽 해결 (종목별 컨텍스트 파악)
function getKoName(engName, tab) {
    if (!engName) return '?';
    if (engName === 'Spurs') {
        return tab === 'nba' ? '샌안토니오' : '토트넘';
    }
    return TEAM_KO_MAP[engName] || engName;
}

function toggleWidgetPanel() {
    const panel = document.getElementById('widgetPanel');
    const memoPanel = document.getElementById('quickMemoPanel');
    const aiPanel = document.getElementById('aiChatPanel');
    const calcPanel = document.getElementById('calcPanel');
    
    if(memoPanel && memoPanel.classList.contains('open')) memoPanel.classList.remove('open');
    if(aiPanel && aiPanel.classList.contains('open')) aiPanel.classList.remove('open');
    if(calcPanel && calcPanel.classList.contains('open')) calcPanel.classList.remove('open');

    const isOpen = panel.classList.contains('open');
    if (!isOpen) {
        panel.classList.add('open');
        if (!window.widgetInitialized) {
            loadWidgetData('nba');
            window.widgetInitialized = true;
        }
    } else {
        panel.classList.remove('open');
    }
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
    mlb: 'https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings',
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
    
    if (data.standings) html += widgetStandings(data.standings, tab);

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

    const L = isSoccer ? away : home;
    const R = isSoccer ? home : away;
    const ls = isSoccer ? (away.score||'0') : (home.score||'0');
    const rs = isSoccer ? (home.score||'0') : (away.score||'0');
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

// ✅ [승, 무, 패, 승점, 득실] 순서 반영
function buildStandingsRows(entries, tab) {
    let rows = '';
    entries.forEach((e, i) => {
        const s = e.stats || [];
        const getStat = name => { const x = s.find(item => item.name === name); return x ? x.displayValue : '0'; };
        
        const teamName = getKoName(e.team?.shortDisplayName || e.team?.name, tab);
        const logoUrl = e.team?.logos?.[0]?.href || '';
        const logoImg = logoUrl ? `<img src="${logoUrl}" style="width:16px; height:16px; object-fit:contain; vertical-align:middle; margin-right:6px;">` : '';

        if (tab === 'epl') {
            const w = getStat('wins');
            const d = getStat('ties'); // 무승부
            const l = getStat('losses');
            const pts = getStat('points'); // 승점
            const gd = getStat('pointDifferential'); // 득실
            
            rows += `<tr>
                <td><span class="sp-rank-num">${i+1}</span></td>
                <td><div style="display:flex; align-items:center;">${logoImg}${teamName}</div></td>
                <td>${w}</td><td>${d}</td><td>${l}</td><td style="font-weight:700; color:#0f172a;">${pts}</td><td>${gd}</td>
            </tr>`;
        } else {
            const w = getStat('wins');
            const l = getStat('losses');
            const pct = getStat('winPercent') || getStat('pointDifferential') || '-';
            
            rows += `<tr>
                <td><span class="sp-rank-num">${i+1}</span></td>
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
            
            html += `
            <div class="sp-standings-wrap">
                <div class="sp-section-title" style="margin-top:6px;">순위표 - ${confName}</div>
                <table class="sp-standings-table">
                    <thead><tr><th>#</th><th>팀</th><th>승</th><th>패</th><th>승률</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
        });
        return html;
    } 
    // 기타 종목 (EPL, MLB 등)
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

        return `<div class="sp-standings-wrap">
            <div class="sp-section-title" style="margin-top:6px;">순위표</div>
            <table class="sp-standings-table">
                <thead>${headHtml}</thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
    }
}