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
    // content-body 패딩은 base.css (30px 40px) 그대로 유지
  
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
        if(typeof initStickyHeader === 'function') initStickyHeader();
        loadWorklogFromServer();
    }
    if(pageId === 'productlogs' && typeof renderProductLogPage === 'function') renderProductLogPage();
    if(pageId === 'ranking' && typeof loadRankingData === 'function') {
        loadRankingData();
        // sticky 헤더 그림자 감지
        const _cb = document.querySelector('.content-body');
        const _rh = document.querySelector('.rk-sticky-header');
        const _rt = document.querySelector('.rk-tabs-col-sticky');
        if (_cb && _rh) {
            _cb.addEventListener('scroll', function _rkScroll() {
                if (!document.getElementById('page-ranking').classList.contains('active')) {
                    _cb.removeEventListener('scroll', _rkScroll); return;
                }
                _rh.classList.toggle('is-stuck', _cb.scrollTop > 10);
            }, { passive: true });
        }
    }
    if(pageId === 'sales' && typeof loadSalesData === 'function') {
        if(!salesData || salesData.length === 0) loadSalesData();
        const _cb2 = document.querySelector('.content-body');
        const _sh = document.querySelector('.sales-sticky-header');
        if (_cb2 && _sh) {
            _cb2.addEventListener('scroll', function _salesScroll() {
                if (!document.getElementById('page-sales').classList.contains('active')) {
                    _cb2.removeEventListener('scroll', _salesScroll); return;
                }
                _sh.classList.toggle('is-stuck', _cb2.scrollTop > 10);
            }, { passive: true });
        }
    }

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
        const targetUrl = document.getElementById('calcSelector').value;
        if (frame.src !== targetUrl) {
            frame.src = targetUrl;
        }
    });
}
function changeCalculator(url) { document.getElementById('calcFrame').src = url; }