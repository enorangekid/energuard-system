/* ================= [1. Config & Global State] ================= */

// Supabase 연동 설정
const SUPABASE_URL = "https://eukwfypbfqojbaihfqye.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MiBvlf3d6ulcVBsi7Odcgw_PTXSmXKj";

// ✅ 변수명 충돌을 피하기 위해 supabaseClient로 이름 변경
let supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("🚨 Supabase 라이브러리를 로드하지 못했습니다.");
}

let activeSession = null;
// 🚀 [추가] 페이지 전환 중복 방지 타이머
let pageTransitionTimer = null; 

/* ================= [2. Login Logic] ================= */
window.onload = async function() {
    document.getElementById("loginPassInput").addEventListener("keypress", function(e) {
        if(e.key === "Enter") tryLogin();
    });

    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            activeSession = session;
            document.getElementById('loginScreen').classList.add('hidden'); 
            
            // ✅ 로그인 직후 주소창에 맞게 페이지 로드하도록 변경 (라우팅 연동)
            let startPage = 'dashboard';
            if (window.location.hash) {
                startPage = window.location.hash.replace('#', '');
            }
            showPage(startPage, document.querySelector(`.menu-item[onclick*="${startPage}"]`), true);
        }
    }
    
    setInterval(() => {
      const now = new Date();
      const clockEl = document.getElementById('clock');
      if(clockEl) clockEl.innerText = now.toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }, 1000);
    
    const tDate = document.getElementById('tDate');
    if(tDate) tDate.valueAsDate = new Date();

    loadWeather();
    setInterval(loadWeather, 30 * 60 * 1000);
};

// 포천시 가산면 기준 날씨 API 호출 함수
async function loadWeather() {
    try {
        const lat = 37.8289; const lon = 127.1994;
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
            if (weatherEl) weatherEl.innerHTML = `${icon} <span style="font-weight:700; color:#1e293b;">${temp}°C</span> <span style="font-size:12px; color:#9ca3af;">(${desc})</span>`;
        }
    } catch (e) {
        const weatherEl = document.getElementById('weather-info');
        if (weatherEl) weatherEl.innerHTML = '<i class="fa-solid fa-circle-exclamation" style="color:#ef4444;"></i> 날씨 오류';
    }
}

// Supabase 이메일/비밀번호 로그인 로직
async function tryLogin() {
    var email = "admin@energuard.co.kr"; // Supabase Auth 계정
    var input = document.getElementById('loginPassInput');
    var msg = document.getElementById('loginMsg');
    var pass = input.value;

    if (!supabaseClient) {
        msg.innerText = "🚨 시스템 초기화 실패. 새로고침을 해주세요."; 
        msg.style.color = "red";
        return;
    }

    if (!pass) { msg.innerText = "비밀번호를 입력해주세요."; return; }
    
    msg.innerText = "안전하게 인증 중..."; 
    msg.style.color = "#666";

    // Supabase 로그인 API 호출
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: pass,
    });

    if (error) {
        if (error.message.includes("Email not confirmed")) {
            msg.innerText = "⛔ 이메일 인증이 필요합니다. (Supabase 설정 확인 필요)";
        } else if (error.message.includes("Invalid login credentials")) {
            msg.innerText = "⛔ 비밀번호가 틀렸습니다.";
        } else {
            msg.innerText = "⛔ 통신 오류: " + error.message;
        }
        msg.style.color = "red";
        input.value = ""; input.focus();
    } else {
        activeSession = data.session;
        document.getElementById('loginScreen').classList.add('hidden');
        
        let startPage = 'dashboard';
        if (window.location.hash) startPage = window.location.hash.replace('#', '');
        showPage(startPage, document.querySelector(`.menu-item[onclick*="${startPage}"]`), true);
    }
}

async function handleLogout() {
    if (confirm("로그아웃 하시겠습니까?")) {
        if(supabaseClient) await supabaseClient.auth.signOut();
        activeSession = null;
        if(typeof isDashboardLoaded !== 'undefined') isDashboardLoaded = false; 
        location.reload(); 
    }
}

/* ================= [3. Navigation & Routing Logic (새로 추가됨!)] ================= */
window.showPage = function(pageId, element = null, isHistoryAction = false) {
    // 🚀 [핵심 수정] 페이지 이동 시 무조건 로더 끄고 시작 (이전 페이지 로더 찌꺼기 제거)
    const loader = document.getElementById('loader');
    if(loader) loader.style.display = 'none';
    
    // 🚀 [핵심 수정] 이전 페이지 로딩 예약된 것들 취소 (빠르게 이동 시 충돌 방지)
    if(pageTransitionTimer) {
        clearTimeout(pageTransitionTimer);
        pageTransitionTimer = null;
    }

    // 1. 모든 페이지 숨기고 타겟 페이지만 표시
    document.querySelectorAll('.page-section').forEach(section => { section.classList.remove('active'); });
    const targetPage = document.getElementById('page-' + pageId);
    if(targetPage) targetPage.classList.add('active');
  
    // 2. 사이드바 메뉴 액티브 토글 및 상단 타이틀 변경
    if(element) {
        document.querySelectorAll('.menu-item').forEach(menu => { menu.classList.remove('active'); });
        element.classList.add('active');
        let menuText = element.querySelector('.menu-text');
        const titleEl = document.getElementById('pageTitleText');
        if(titleEl) titleEl.innerText = menuText ? menuText.innerText.trim() : element.innerText.trim();
    } else {
        document.querySelectorAll('.menu-item').forEach(menu => { menu.classList.remove('active'); });
        let targetMenu = document.querySelector(`.menu-item[onclick*="${pageId}"]`);
        if (targetMenu) {
            targetMenu.classList.add('active');
            let menuText = targetMenu.querySelector('.menu-text');
            const titleEl = document.getElementById('pageTitleText');
            if(titleEl) titleEl.innerText = menuText ? menuText.innerText.trim() : targetMenu.innerText.trim();
        } else if(pageId === 'dashboard') {
            const titleEl = document.getElementById('pageTitleText');
            if(titleEl) titleEl.innerText = '지표 요약';
            let dashMenu = document.querySelector('.menu-item[onclick*="dashboard"]');
            if(dashMenu) dashMenu.classList.add('active');
        }
    }
  
    // 모바일 사이드바 자동 닫기
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }

    // 🚀 3. 브라우저 주소창 업데이트
    if (!isHistoryAction) {
        history.pushState({ pageId: pageId }, "", "#" + pageId);
    }
  
    // 4. 메뉴별 데이터 로딩 함수 호출
    if(pageId === 'dashboard' && typeof loadDashboardData === 'function') loadDashboardData();
    if(pageId === 'timeline' && typeof loadTimelineFromServer === 'function') loadTimelineFromServer();
    if(pageId === 'worklog' && typeof loadWorklogFromServer === 'function') {
        if(typeof updateDateDisplay === 'function') updateDateDisplay();
        if(typeof initMonthlyLog === 'function') initMonthlyLog();
        loadWorklogFromServer(); 
    }
    if(pageId === 'productlogs' && typeof renderProductLogPage === 'function') renderProductLogPage();
    if(pageId === 'ranking' && typeof loadRankingData === 'function') loadRankingData();
    if(pageId === 'sales' && typeof loadSalesData === 'function' && (!salesData || salesData.length === 0)) loadSalesData();

    // 🚀 [노트 페이지 로직 수정] 타이머에 할당하여 페이지 이탈 시 취소 가능하게 만듦
    if(pageId === 'notes') {
        pageTransitionTimer = setTimeout(() => {
            const monthPicker = document.getElementById('noteMonthPicker');
            const now = new Date();
            const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
            if(monthPicker && !monthPicker.value) monthPicker.value = thisMonth;
            if(typeof initQuill === 'function') initQuill();
            if(typeof handleNoteMonthChange === 'function') {
                handleNoteMonthChange();
            }
        }, 300);
    }
};

// 🚀 브라우저 [뒤로 가기] / [앞으로 가기] 버튼 감지 이벤트
window.addEventListener('popstate', function(event) {
    let pageId = 'dashboard';
    
    if (event.state && event.state.pageId) {
        pageId = event.state.pageId;
    } else if (window.location.hash) {
        pageId = window.location.hash.replace('#', '');
    }
    
    if (typeof showPage === 'function') {
        showPage(pageId, null, true); 
    }
});

// 🚀 새로고침 하거나 URL 복사해서 들어올 때 초기 주소 세팅
window.addEventListener('DOMContentLoaded', () => {
    if (!window.location.hash) {
        history.replaceState({ pageId: 'dashboard' }, "", "#dashboard");
    }
});


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

/* ================= [5. UI Utils & Widgets (축약 생략)] ================= */
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }

/* ── [공통] 토스트 알림 ────────────────────────────────────────────
   사용법: showToast('메시지', 'success' | 'error' | 'warning' | 'info')
   기존 alert() / console.error() 대신 이 함수를 사용하세요.
──────────────────────────────────────────────────────────────── */
const TOAST_ICONS = {
    success: '<i class="fa-solid fa-circle-check"></i>',
    error:   '<i class="fa-solid fa-circle-xmark"></i>',
    warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
    info:    '<i class="fa-solid fa-circle-info"></i>',
};

function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) { console.warn('[Toast]', message); return; }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
        <span class="toast-msg">${message}</span>`;

    container.appendChild(toast);

    // duration 후 fade-out → 제거
    const remove = () => {
        toast.classList.add('hiding');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };
    const timer = setTimeout(remove, duration);

    // 클릭하면 즉시 닫기
    toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
}

/* ── [공통] 퀵패널 토글 헬퍼 ──────────────────────────────────────
   모든 퀵패널(quickMemoPanel, aiChatPanel, calcPanel, estimatePanel,
   widgetPanel)은 이 함수를 통해 열고 닫습니다.
   - targetId  : 열거나 닫을 패널 ID
   - onOpen    : 패널을 열 때 실행할 콜백 (선택)
   새 패널을 추가할 때는 QUICK_PANELS 배열에 ID만 추가하면 됩니다.
──────────────────────────────────────────────────────────────── */
const QUICK_PANELS = [
    'quickMemoPanel', 'aiChatPanel', 'calcPanel', 'estimatePanel', 'widgetPanel'
];

function openPanel(targetId, onOpen) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const isAlreadyOpen = target.classList.contains('open');

    // 모든 패널 닫기
    QUICK_PANELS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('open');
    });

    // 이미 열려 있던 패널이면 그냥 닫기만 하고 종료
    if (isAlreadyOpen) return;

    // 대상 패널 열기
    target.classList.add('open');
    if (typeof onOpen === 'function') onOpen();
}

function toggleCalcPanel() {
    openPanel('calcPanel', () => {
        const frame = document.getElementById('calcFrame');
        if (!frame.src || frame.src === window.location.href) {
            frame.src = document.getElementById('calcSelector').value;
        }
    });
}
function changeCalculator(url) { document.getElementById('calcFrame').src = url; }


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
// ================= [견적서 패널 자동 계산 & 인쇄 로직] =================

// 숫자 콤마 포맷
function formatEstNum(num) {
    if (!num) return "";
    return Number(num).toLocaleString();
}

// 콤마 제거하고 순수 숫자로 변환
function unformatEstNum(str) {
    if (!str) return 0;
    return Number(String(str).replace(/,/g, ''));
}

// 수량/단가 입력 시 자동 계산 함수
window.calcEst = function() {
    let totalSupply = 0;
    let totalTax = 0;

    const rows = document.querySelectorAll('#estTbody tr');
    rows.forEach(row => {
        const qtyInput = row.querySelector('.est-qty');
        const priceInput = row.querySelector('.est-price');
        const supplyInput = row.querySelector('.est-supply');
        const taxInput = row.querySelector('.est-tax');

        const qty = unformatEstNum(qtyInput.value);
        const price = unformatEstNum(priceInput.value);

        // 둘 다 입력되었을 때만 계산
        if (qty > 0 && price > 0) {
            const supply = qty * price;
            const tax = Math.floor(supply * 0.1); // 10% 부가세 (소수점 버림)
            
            supplyInput.value = formatEstNum(supply);
            taxInput.value = formatEstNum(tax);
            
            totalSupply += supply;
            totalTax += tax;
            
            // 입력 중이 아닌 칸은 콤마 유지 (사용자 편의성)
            if(document.activeElement !== qtyInput) qtyInput.value = formatEstNum(qty);
            if(document.activeElement !== priceInput) priceInput.value = formatEstNum(price);

        } else {
            supplyInput.value = "";
            taxInput.value = "";
        }
    });

    // 하단 및 상단 총계 업데이트
    document.getElementById('estSumSupply').value = formatEstNum(totalSupply);
    document.getElementById('estSumTax').value = formatEstNum(totalTax);
    document.getElementById('estTotalDisplay').innerText = formatEstNum(totalSupply + totalTax);
}

// 포커스가 빠질 때 콤마 찍기
document.addEventListener('focusout', function(e) {
    if (e.target.classList.contains('est-qty') || e.target.classList.contains('est-price')) {
        const val = unformatEstNum(e.target.value);
        if(val > 0) e.target.value = formatEstNum(val);
        else e.target.value = "";
    }
});

// 포커스가 들어갈 때 콤마 빼기 (수정하기 쉽게)
document.addEventListener('focusin', function(e) {
    if (e.target.classList.contains('est-qty') || e.target.classList.contains('est-price')) {
        const val = unformatEstNum(e.target.value);
        e.target.value = val > 0 ? val : "";
    }
});


function toggleEstimatePanel() {
    openPanel('estimatePanel', () => {
        // 패널을 열 때 오늘 날짜를 견적서 양식에 자동 기입
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        document.getElementById('estDateStr').value = `${year} 년 ${month} 월 ${date} 일`;
    });
}

/* ================= [견적서 인쇄 및 PDF 기능 수정] ================= */

// 1. 종이 인쇄 (우측 잘림 방지)
function printEstimate() {
    document.body.classList.add('print-mode-wrap');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('print-mode-wrap');
    }, 500);
}

// 2. PDF 저장 (화면 밖 렌더링 + 값 동기화 강화)
function saveEstimatePDF() {
    const source = document.getElementById('estimatePrintArea');
    const btn = document.getElementById('btnPdfSave');
    const originalText = btn.innerHTML;
    const dateStr = document.getElementById('estDateStr').value.replace(/ /g, '').replace(/년|월/g, '').replace(/일/g, '') || '날짜없음';

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 생성중...';
    btn.disabled = true;

    // 1. 원본 복제
    const clone = source.cloneNode(true);
    
    // 2. 화면 밖 임시 컨테이너 생성 (CSS에서 left: -9999px 설정됨)
    const wrapper = document.createElement('div');
    wrapper.id = 'pdf-capture-box';
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // 3. [중요] Input 값 강제 동기화 (복제된 노드는 사용자가 입력한 값을 잃어버림)
    const originalInputs = source.querySelectorAll('input');
    const cloneInputs = clone.querySelectorAll('input');
    originalInputs.forEach((input, i) => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            cloneInputs[i].checked = input.checked;
            if(input.checked) cloneInputs[i].setAttribute('checked', 'checked');
        } else {
            cloneInputs[i].value = input.value;
            cloneInputs[i].setAttribute('value', input.value);
        }
    });

    // 4. [추가] Textarea 값 강제 동기화 (혹시 모를 상황 대비)
    const originalTexts = source.querySelectorAll('textarea');
    const cloneTexts = clone.querySelectorAll('textarea');
    originalTexts.forEach((txt, i) => {
        cloneTexts[i].value = txt.value;
        cloneTexts[i].textContent = txt.value;
    });

    // PDF 옵션 설정
    const opt = {
        margin:       0, // CSS padding으로 여백 처리
        filename:     `견적서_${dateStr}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2, 
            useCORS: true, 
            scrollY: 0, 
            scrollX: 0,
            windowWidth: 800, // 가상 윈도우 폭 고정
            x: 0, 
            y: 0
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // 5. 렌더링 대기 후 캡처 (시간을 0.5초로 넉넉히 줌)
    setTimeout(() => {
        // wrapper가 아닌 clone 자체를 캡처해야 여백 계산이 정확함
        html2pdf().set(opt).from(clone).save().then(() => {
            if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }).catch(err => {
            console.error('PDF 저장 실패:', err);
            showToast('PDF 저장 중 오류가 발생했습니다.', 'error');
            if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    }, 500);
}