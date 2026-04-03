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
window.currentUser = null;  // { username, role, display_name }
// 🚀 [추가] 페이지 전환 중복 방지 타이머
let pageTransitionTimer = null;

/* ── 역할별 접근 제한 정의 ──────────────────────────
   admin   : 전체 접근
   general : timeline, worklog 접근 불가
             대시보드 금주목표 카드 숨김
─────────────────────────────────────────────────── */
const ROLE_RESTRICTIONS = {
    general: {
        blockedPages:    ['timeline', 'worklog'],
        hiddenMenus:     ['timeline', 'worklog'],
        blockedPanels:   ['widgetPanel'],   // 스포츠 위젯 패널 차단
        readonlyNoteTabs: ['blog', 'youtube'], // 읽기 전용 노트 탭
        readonlyPages:   ['ranking', 'sales', 'pricing'], // 편집 불가 페이지
    }
};

/* ================= [2. Login Logic] ================= */
window.onload = async function() {
    // 기존 Supabase Auth 세션 완전 제거 (users 테이블 기반 로그인으로 전환)
    if (supabaseClient) {
        await supabaseClient.auth.signOut().catch(() => {});
    }

    // 엔터키 핸들러
    const passEl = document.getElementById("loginPassInput");
    if (passEl) passEl.addEventListener("keypress", e => { if(e.key === "Enter") tryLogin(); });
    const userEl = document.getElementById("loginUsernameInput");
    if (userEl) userEl.addEventListener("keypress", e => { if(e.key === "Enter") passEl && passEl.focus(); });

    setInterval(() => {
      const now = new Date();
      const clockEl = document.getElementById('clock');
      if(clockEl) clockEl.innerText = now.toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }, 1000);

    const tDate = document.getElementById('tDate');
    if(tDate) tDate.valueAsDate = new Date();

    loadWeather();
    setInterval(loadWeather, 30 * 60 * 1000);

    // ── 로그인 상태 유지 자동 복원 ──
    const saved = localStorage.getItem('keepLogin');
    if (saved) {
        try {
            const { username, role, display_name, expiry } = JSON.parse(saved);
            // 만료 확인 (30일)
            if (expiry && Date.now() < expiry) {
                currentUser   = { username, role, display_name };
                activeSession = true;
                applyRoleUI();
                document.getElementById('loginScreen').classList.add('hidden');
                const nameEl = document.getElementById('loggedUserName');
                const _rawName1 = (display_name || username).replace(/님$/, '');
                if (nameEl) nameEl.innerText = _rawName1 + '님';
                updateRoleBadge(role);
                const keepCheck = document.getElementById('keepLoginCheck');
                showWelcomeModal(_rawName1, role);
                if (keepCheck) keepCheck.checked = true;
                let startPage = 'dashboard';
                const restriction = ROLE_RESTRICTIONS[currentUser.role];
                if (restriction && restriction.blockedPages.includes(startPage)) startPage = 'dashboard';
                showPage(startPage, document.querySelector(`.menu-item[onclick*="${startPage}"]`), true);
                return;
            } else {
                localStorage.removeItem('keepLogin');
            }
        } catch(e) {
            localStorage.removeItem('keepLogin');
        }
    }
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

// 비밀번호 보이기/숨기기 토글
function togglePassVisible() {
    const input = document.getElementById('loginPassInput');
    const icon  = document.getElementById('passEyeIcon');
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-regular fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa-regular fa-eye';
    }
}

// users 테이블 기반 로그인
async function tryLogin() {
    const usernameEl = document.getElementById('loginUsernameInput');
    const passEl     = document.getElementById('loginPassInput');
    const msg        = document.getElementById('loginMsg');
    const username   = (usernameEl ? usernameEl.value : '').trim();
    const pass       = passEl ? passEl.value : '';

    if (!supabaseClient) {
        msg.innerText = "🚨 시스템 초기화 실패. 새로고침을 해주세요.";
        msg.style.color = "red"; return;
    }
    if (!username || !pass) {
        msg.innerText = "아이디와 비밀번호를 입력해주세요.";
        msg.style.color = "red"; return;
    }

    msg.innerText = "인증 중..."; msg.style.color = "#666";

    try {
        // username 또는 phone으로 조회
        const { data, error } = await supabaseClient
            .from('users')
            .select('id, username, password, role, display_name')
            .or(`username.eq.${username},phone.eq.${username}`)
            .single();

        if (error || !data || data.password !== pass) {
            msg.innerText = "⛔ 아이디 또는 비밀번호가 틀렸습니다.";
            msg.style.color = "red";
            if (passEl) { passEl.value = ''; passEl.focus(); }
            return;
        }

        // 로그인 성공
        currentUser   = { username: data.username, role: data.role, display_name: data.display_name };
        activeSession = true;

        // ── 로그인 상태 유지 저장 ──
        const keepCheck = document.getElementById('keepLoginCheck');
        if (keepCheck && keepCheck.checked) {
            const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30일
            localStorage.setItem('keepLogin', JSON.stringify({
                username: data.username,
                role: data.role,
                display_name: data.display_name,
                expiry
            }));
        } else {
            localStorage.removeItem('keepLogin');
        }

        applyRoleUI();

        document.getElementById('loginScreen').classList.add('hidden');

        const nameEl = document.getElementById('loggedUserName');
        const _rawName2 = (data.display_name || data.username).replace(/님$/, '');
        if (nameEl) nameEl.innerText = _rawName2 + '님';
        updateRoleBadge(data.role);
        showWelcomeModal(_rawName2, data.role);

        let startPage = 'dashboard';
        const restriction = ROLE_RESTRICTIONS[currentUser.role];
        if (restriction && restriction.blockedPages.includes(startPage)) startPage = 'dashboard';
        showPage(startPage, document.querySelector(`.menu-item[onclick*="${startPage}"]`), true);

    } catch(e) {
        msg.innerText = "⛔ 오류: " + e.message;
        msg.style.color = "red";
    }
}


/* 역할에 따른 뱃지 텍스트 업데이트 */
function updateRoleBadge(role) {
    const badgeEl = document.getElementById('userRoleBadge');
    if (badgeEl) badgeEl.innerText = role === 'admin' ? '관리자' : '사용자';
}

/* ── 로그인 환영 모달 ── */
function showWelcomeModal(displayName, role) {
    // 혹시 이미 떠 있는 모달 제거 (중복 방지)
    const existing = document.getElementById('welcomeOverlay');
    if (existing) existing.remove();
    const isAdmin = role === 'admin';
    const hour = new Date().getHours();
    let greeting = '안녕하세요';
    if (hour >= 5  && hour < 12) greeting = '좋은 아침이에요';
    else if (hour >= 12 && hour < 17) greeting = '좋은 오후예요';
    else if (hour >= 17 && hour < 21) greeting = '좋은 저녁이에요';
    else greeting = '늦은 시간까지 수고 많으세요';

    const messages = isAdmin ? [
        '오늘도 에너가드컴퍼니를 이끌어 주세요 💪',
        '모든 팀원이 믿고 있습니다. 오늘도 파이팅! 🚀',
        '좋은 하루가 되길 바랍니다. 오늘도 화이팅! ✨',
        '에너가드컴퍼니의 성장을 함께 만들어 가요 📈',
    ] : [
        '오늘 하루도 함께해 주셔서 감사해요 😊',
        '작은 노력이 큰 결과를 만들어요. 오늘도 파이팅! 💫',
        '좋은 하루 보내세요! 오늘도 최선을 다해봐요 🌟',
        '함께라면 무엇이든 가능해요. 오늘도 화이팅! 🙌',
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    const badgeColor = isAdmin ? '#4f46e5' : '#10b981';
    const badgeText = isAdmin ? '관리자' : '사용자';

    const overlay = document.createElement('div');
    overlay.id = 'welcomeOverlay';
    overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        background: rgba(15, 23, 42, 0.55);
        backdrop-filter: blur(6px);
        animation: welcomeFadeIn 0.3s ease;
    `;

    overlay.innerHTML = `
        <div id="welcomeCard" style="
            background: #ffffff;
            border-radius: 20px;
            padding: 40px 44px 36px;
            width: 420px;
            max-width: 90vw;
            box-shadow: 0 32px 80px rgba(0,0,0,0.25);
            text-align: center;
            position: relative;
            animation: welcomeSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
            <div style="
                width: 64px; height: 64px; border-radius: 50%;
                background: linear-gradient(135deg, ${badgeColor}, ${isAdmin ? '#818cf8' : '#34d399'});
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 20px;
                box-shadow: 0 8px 24px ${badgeColor}40;
            ">
                <i class="fa-solid ${isAdmin ? 'fa-crown' : 'fa-user'}" style="color:white; font-size:26px;"></i>
            </div>
            <div style="
                display: inline-block;
                background: ${badgeColor}15;
                color: ${badgeColor};
                font-size: 12px; font-weight: 700;
                padding: 3px 12px; border-radius: 20px;
                margin-bottom: 14px;
                letter-spacing: 0.3px;
            ">${badgeText}</div>
            <div style="font-size: 22px; font-weight: 800; color: #1e293b; margin-bottom: 8px; letter-spacing: -0.5px;">
                ${greeting},<br>${displayName}님! 👋
            </div>
            <div style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 28px;">
                ${msg}
            </div>
            <button onclick="closeWelcomeModal()" style="
                width: 100%; padding: 13px;
                background: ${badgeColor};
                color: white; border: none; border-radius: 10px;
                font-size: 14px; font-weight: 700;
                cursor: pointer; letter-spacing: 0.2px;
                font-family: 'Pretendard', sans-serif;
                transition: opacity 0.2s;
            " onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'">
                시작하기
            </button>
        </div>
        <style>
            @keyframes welcomeFadeIn { from { opacity:0; } to { opacity:1; } }
            @keyframes welcomeSlideUp { from { opacity:0; transform:translateY(30px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
            @keyframes welcomeFadeOut { to { opacity:0; } }
        </style>
    `;

    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeWelcomeModal(); });
}

function closeWelcomeModal() {
    const overlay = document.getElementById('welcomeOverlay');
    if (!overlay) return;
    overlay.style.animation = 'welcomeFadeOut 0.25s ease forwards';
    overlay.addEventListener('animationend', () => overlay.remove(), { once: true });
}

/* 역할에 따른 메뉴/섹션 표시 제어 */
function applyRoleUI() {
    if (!currentUser) return;
    const restriction = ROLE_RESTRICTIONS[currentUser.role];
    if (!restriction) return; // admin은 제한 없음

    // 사이드바 메뉴 숨기기
    restriction.hiddenMenus.forEach(pageId => {
        const menuEl = document.querySelector(`.menu-item[onclick*="'${pageId}'"]`);
        if (menuEl) menuEl.style.display = 'none';
    });

    // 대시보드 금주 주간 목표 카드 숨기기
    const taskCard = document.querySelector('#dash-task-list')?.closest('.dash-card');
    if (taskCard) taskCard.style.display = 'none';

    // 읽기 전용 페이지 편집 요소 숨기기
    if (restriction.readonlyPages) {
        // 상품검색순위: 상품 추가 버튼, 편집 버튼, 저장 버튼
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) addProductBtn.style.display = 'none';
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) saveBtn.style.display = 'none';

        // 매출분석: 편집/추가/저장 버튼
        const editSalesBtn = document.getElementById('editSalesBtn');
        if (editSalesBtn) editSalesBtn.style.display = 'none';
        const addSalesRowBtn = document.getElementById('addSalesRowBtn');
        if (addSalesRowBtn) addSalesRowBtn.style.display = 'none';
        const saveSalesBtn = document.getElementById('saveSalesBtn');
        if (saveSalesBtn) saveSalesBtn.style.display = 'none';

        // 단가표: 원가 저장, 엑셀 저장, 마진 편집 버튼 숨김
        document.querySelectorAll('[onclick*="savePricingCosts"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('[onclick*="exportPricingExcel"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('[onclick*="openPricingModal"]').forEach(el => el.style.display = 'none');
        // 마진 편집 모달 저장 버튼도 숨김
        const pimConfirm = document.querySelector('.pim-btn-confirm');
        if (pimConfirm) pimConfirm.style.display = 'none';
    }

    // 차단된 패널의 우측바 아이콘 숨기기
    if (restriction.blockedPanels) {
        restriction.blockedPanels.forEach(panelId => {
            // onclick에 패널 토글 함수가 있는 quick-item 찾기
            const toggleFn = {
                'widgetPanel': 'toggleWidgetPanel',
            }[panelId];
            if (toggleFn) {
                const iconEl = document.querySelector(`.quick-item[onclick*="${toggleFn}"]`);
                if (iconEl) iconEl.style.display = 'none';
            }
        });
    }
}

/* 현재 사용자가 해당 노트 탭에서 읽기 전용인지 반환 */
window.isNoteTabReadonly = function(tab) {
    if (!currentUser) return false;
    const restriction = ROLE_RESTRICTIONS[currentUser.role];
    if (!restriction || !restriction.readonlyNoteTabs) return false;
    return restriction.readonlyNoteTabs.includes(tab);
};

async function handleLogout() {
    if (confirm("로그아웃 하시겠습니까?")) {
        activeSession = null;
        currentUser   = null;
        localStorage.removeItem('keepLogin');
        if(typeof isDashboardLoaded !== 'undefined') isDashboardLoaded = false;
        location.reload();
    }
}

/* ================= [3. Navigation & Routing Logic (새로 추가됨!)] ================= */
window.showPage = function(pageId, element = null, isHistoryAction = false) {
    // 페이지 전환 시 미리보기 모달 정리
    const _prevModal = document.getElementById('arcPreviewModal');
    if (_prevModal) { if (_prevModal._keyHandler) document.removeEventListener('keydown', _prevModal._keyHandler); _prevModal.remove(); }

    // 권한 체크 — 차단된 페이지 접근 시 대시보드로 리다이렉트
    if (currentUser) {
        const restriction = ROLE_RESTRICTIONS[currentUser.role];
        if (restriction && restriction.blockedPages.includes(pageId)) {
            showToast('접근 권한이 없습니다.', 'warning');
            pageId  = 'dashboard';
            element = document.querySelector('.menu-item[onclick*=\'dashboard\']');
        }
    }

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
    'quickMemoPanel', 'aiChatPanel', 'calcPanel', 'estimatePanel', 'widgetPanel', 'archivePanel'
];

function openPanel(targetId, onOpen) {
    // 차단된 패널 접근 시 토스트 후 중단
    if (currentUser) {
        const restriction = ROLE_RESTRICTIONS[currentUser.role];
        if (restriction && restriction.blockedPanels && restriction.blockedPanels.includes(targetId)) {
            showToast('접근 권한이 없습니다.', 'warning');
            return;
        }
    }
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

/* ================================================================
   자료실 (Archive Panel) — Supabase Storage 'archives' 버킷 사용
   폴더 구조: 공용(company/cert): archives/{cat}/{file} / 개인(quote/image/etc): archives/{cat}/{username}/{file}
   ================================================================ */


/* ── 자료실 경로 헬퍼 ──────────────────────────────────────────
   공용: company, cert       → archives/{cat}/{filename}
   개인: quote, image, etc  → archives/{cat}/{username}/{filename}
────────────────────────────────────────────────────────────── */
const ARC_PUBLIC_CATS = ['company', 'cert'];

function arcIsPublic(cat) {
    return ARC_PUBLIC_CATS.includes(cat);
}

function arcStoragePath(cat, fileName) {
    const username = currentUser?.username || 'unknown';
    return arcIsPublic(cat)
        ? `${cat}/${fileName}`
        : `${cat}/${username}/${fileName}`;
}

function arcListPath(cat) {
    const username = currentUser?.username || 'unknown';
    return arcIsPublic(cat) ? cat : `${cat}/${username}`;
}

let arcCurrentCategory = 'all';

function toggleArchivePanel() {
    // 열릴 때마다 목록 초기화 후 새로 로드 (이전 onerror 잔재 방지)
    const listEl = document.getElementById('arcFileList');
    if (listEl) listEl.innerHTML = '';
    openPanel('archivePanel', () => {
        arcLoadFiles();
    });
}

function arcSelectCategory(cat, btn) {
    arcCurrentCategory = cat;
    document.querySelectorAll('.arc-cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    arcLoadFiles();
}

async function arcLoadFiles() {
    const listEl = document.getElementById('arcFileList');
    if (!listEl || !supabaseClient) return;

    listEl.innerHTML = '<div style="text-align:center; padding:30px 0; color:#94a3b8; font-size:13px;"><i class="fa-solid fa-spinner fa-spin" style="margin-bottom:8px; display:block;"></i>불러오는 중...</div>';

    try {
        let allFiles = [];
        const categories = arcCurrentCategory === 'all'
            ? ['company', 'cert', 'quote', 'image', 'etc']
            : [arcCurrentCategory];

        for (const cat of categories) {
            const listPath = arcListPath(cat);
            const { data, error } = await supabaseClient.storage
                .from('archives')
                .list(listPath, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
            if (!error && data) {
                allFiles = allFiles.concat(data
                    .filter(f => f.name !== '.emptyFolderPlaceholder')
                    .map(f => ({ ...f, category: cat }))
                );
            }
        }

        if (!allFiles.length) {
            listEl.innerHTML = '<div style="text-align:center; padding:40px 0; color:#94a3b8; font-size:13px;"><i class="fa-solid fa-folder-open" style="font-size:28px; display:block; margin-bottom:10px; color:#d1fae5;"></i>파일이 없습니다.</div>';
            return;
        }

        // 저장된 파일명에서 원본명 추출: {timestamp}___{원본명}
        // 구버전: encodeURIComponent 후 %를 -로 치환 → 항상 -XX로 시작 (예: -ED-95-9C...)
        // 신버전: 평문 그대로 저장 → 날짜/영문/숫자로 시작
        const decodeArcName = (name) => {
            const idx = name.indexOf('___');
            if (idx === -1) return name;
            const raw = name.substring(idx + 3);
            try {
                // 구버전 감지: -로 시작하고 바로 뒤 2자리가 16진수
                if (/^-[0-9A-Fa-f]{2}/.test(raw)) {
                    return decodeURIComponent(raw.replace(/-/g, '%'));
                }
                return raw;
            } catch { return raw; }
        };

        const extIcon = (name) => {
            const ext = name.split('.').pop().toLowerCase();
            if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return { icon: 'fa-file-image', color: '#8b5cf6' };
            if (['pdf'].includes(ext))           return { icon: 'fa-file-pdf',  color: '#ef4444' };
            if (['xlsx','xls','csv'].includes(ext)) return { icon: 'fa-file-excel', color: '#16a34a' };
            if (['docx','doc'].includes(ext))    return { icon: 'fa-file-word', color: '#3b82f6' };
            if (['pptx','ppt'].includes(ext))    return { icon: 'fa-file-powerpoint', color: '#f59e0b' };
            if (['zip','rar','7z'].includes(ext)) return { icon: 'fa-file-zipper', color: '#64748b' };
            return { icon: 'fa-file', color: '#94a3b8' };
        };

        const catLabel = { company:'회사자료', cert:'인증서', quote:'견적서', image:'이미지', etc:'기타' };

        const fmtSize = (bytes) => {
            if (!bytes) return '-';
            if (bytes < 1024) return bytes + 'B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
            return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
        };

        listEl.innerHTML = allFiles.map(f => {
            const { icon, color } = extIcon(f.name);
            const catBadge = arcCurrentCategory === 'all'
                ? `<span style="font-size:10px; background:#f1f5f9; color:#64748b; padding:1px 6px; border-radius:4px; font-weight:600;">${catLabel[f.category] || f.category}</span>`
                : '';
            const ext = f.name.split('.').pop().toLowerCase();
            const canPreview = ['jpg','jpeg','png','gif','webp','svg','pdf'].includes(ext);
            return `
            <div class="arc-file-item" data-category="${f.category}" data-name="${f.name}" data-original="${decodeArcName(f.name)}">
                <i class="fa-solid ${icon}" style="color:${color}; font-size:18px; flex-shrink:0; cursor:${canPreview ? 'pointer' : 'default'};"
                   ${canPreview ? `onclick="arcPreviewItem(this)" title="미리보기"` : ''}></i>
                <div style="flex:1; min-width:0; cursor:${canPreview ? 'pointer' : 'default'};"
                     ${canPreview ? `onclick="arcPreviewItem(this)"` : ''}>
                    <div style="font-size:12px; font-weight:600; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${decodeArcName(f.name)}">${decodeArcName(f.name)}</div>
                    <div style="font-size:11px; color:#94a3b8; margin-top:2px; display:flex; align-items:center; gap:6px;">
                        ${catBadge}
                        <span>${fmtSize(f.metadata?.size)}</span>
                        ${canPreview ? '<span style="color:#3b82f6; font-weight:600;">미리보기</span>' : ''}
                    </div>
                </div>
                <div style="display:flex; gap:6px; flex-shrink:0;">
                    <button class="arc-btn arc-btn-dl" onclick="arcDownloadItem(this)" title="다운로드">
                        <i class="fa-solid fa-download"></i>
                    </button>
                    <button class="arc-btn arc-btn-del" onclick="arcDeleteItem(this)" title="삭제">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>`;
        }).join('');

    } catch(e) {
        console.error('자료실 로드 오류:', e);
        listEl.innerHTML = '<div style="text-align:center; padding:30px 0; color:#ef4444; font-size:13px;">파일 목록을 불러오지 못했습니다.</div>';
    }
}

async function arcUploadFiles(files) {
    if (!files || !files.length || !supabaseClient) return;
    const cat = arcCurrentCategory === 'all' ? 'etc' : arcCurrentCategory;
    const statusEl = document.getElementById('arcUploadStatus');
    const dropZone = document.getElementById('arcDropZone');

    let done = 0;
    const total = files.length;
    statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 업로드 중... (0/${total})`;
    dropZone.style.opacity = '0.6';
    dropZone.style.pointerEvents = 'none';

    for (const file of files) {
        // 파일명: 타임스탬프___원본명 구조로 저장
        const safeName = `${Date.now()}___${file.name}`;
        const path = arcStoragePath(cat, safeName);
        const { error } = await supabaseClient.storage
            .from('archives')
            .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || 'application/octet-stream' });
        if (!error) done++;
        else console.error('업로드 실패:', file.name, error);
        statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 업로드 중... (${done}/${total})`;
    }

    dropZone.style.opacity = '1';
    dropZone.style.pointerEvents = 'auto';
    document.getElementById('arcFileInput').value = '';

    if (done === total) {
        statusEl.innerHTML = `<span style="color:#16a34a;"><i class="fa-solid fa-check"></i> ${done}개 업로드 완료</span>`;
    } else {
        statusEl.innerHTML = `<span style="color:#f59e0b;"><i class="fa-solid fa-triangle-exclamation"></i> ${done}/${total}개 완료 (일부 실패)</span>`;
    }

    setTimeout(() => { statusEl.innerHTML = ''; }, 3000);
    arcLoadFiles();
}

function arcHandleDrop(event) {
    event.preventDefault();
    const dropZone = document.getElementById('arcDropZone');
    dropZone.style.borderColor = '#d1fae5';
    dropZone.style.background = '#f0fdf4';
    const files = event.dataTransfer.files;
    if (files.length) arcUploadFiles(files);
}

/* ── 자료실 미리보기 ── */
function arcPreviewItem(el) {
    const item = el.closest('.arc-file-item');
    if (!item) return;
    arcShowPreview(item.dataset.category, item.dataset.name, item.dataset.original);
}

async function arcShowPreview(category, fileName, originalName) {
    if (!supabaseClient) return;

    // 기존 모달 제거
    const existing = document.getElementById('arcPreviewModal');
    if (existing) existing.remove();

    const ext = fileName.split('.').pop().toLowerCase();
    const isImage = ['jpg','jpeg','png','gif','webp','svg'].includes(ext);
    const isPdf   = ext === 'pdf';

    // 모달 생성
    const modal = document.createElement('div');
    modal.id = 'arcPreviewModal';
    modal.style.cssText = `
        position:fixed; inset:0; z-index:9000;
        background:rgba(0,0,0,0.7); backdrop-filter:blur(4px);
        display:flex; align-items:center; justify-content:center;
        padding:20px;
    `;
    modal.onclick = (e) => { if (e.target === modal) arcClosePreview(); };

    // 로딩 상태 먼저 표시
    modal.innerHTML = `
        <div style="background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 24px 48px rgba(0,0,0,0.3);
                    display:flex; flex-direction:column; max-width:90vw; max-height:90vh; min-width:320px;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 20px;
                        border-bottom:1px solid #f1f5f9; background:#f8fafc; flex-shrink:0;">
                <span style="font-size:13px; font-weight:700; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:60vw;"
                      title="${originalName}">${originalName}</span>
                <div style="display:flex; gap:8px; flex-shrink:0;">
                    <button onclick="arcDownload('${category}','${fileName}','${originalName}')"
                        style="padding:6px 14px; border-radius:7px; border:1px solid #e2e8f0; background:#fff;
                               font-size:12px; font-weight:600; color:#475569; cursor:pointer; display:flex; align-items:center; gap:5px;">
                        <i class="fa-solid fa-download"></i> 다운로드
                    </button>
                    <button onclick="arcClosePreview()"
                        style="width:30px; height:30px; border-radius:50%; border:none; background:#f1f5f9;
                               color:#64748b; cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
            <div id="arcPreviewContent"
                style="flex:1; display:flex; align-items:center; justify-content:center;
                       min-height:200px; overflow:auto; padding:20px; background:#f8fafc;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:28px; color:#94a3b8;"></i>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // ESC 키로 닫기
    modal._keyHandler = (e) => { if (e.key === 'Escape') arcClosePreview(); };
    document.addEventListener('keydown', modal._keyHandler);

    // Signed URL 발급 후 렌더링
    try {
        const path = arcStoragePath(category, fileName);
        const { data, error } = await supabaseClient.storage
            .from('archives')
            .createSignedUrl(path, 300); // 5분 유효

        const contentEl = document.getElementById('arcPreviewContent');
        if (!contentEl) return;

        if (error || !data?.signedUrl) {
            contentEl.innerHTML = `<div style="padding:40px; color:#ef4444; font-size:13px; text-align:center;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:28px; display:block; margin-bottom:10px;"></i>
                URL을 불러올 수 없습니다.</div>`;
            return;
        }

        const url = data.signedUrl;

        if (isImage) {
            // 이미지 preload 후 삽입 (alt/onerror 잔상 방지)
            const img = new Image();
            img.onload = () => {
                if (!document.getElementById('arcPreviewContent')) return;
                contentEl.style.padding = '0';
                contentEl.style.background = '#1e293b';
                contentEl.innerHTML = '';
                img.style.cssText = 'max-width:100%; max-height:80vh; object-fit:contain; display:block; border-radius:0;';
                contentEl.appendChild(img);
            };
            img.onerror = () => {
                if (!document.getElementById('arcPreviewContent')) return;
                contentEl.innerHTML = `<div style="padding:40px; color:#ef4444; font-size:13px; text-align:center;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:28px; display:block; margin-bottom:10px;"></i>
                    이미지를 불러올 수 없습니다.</div>`;
            };
            img.src = url;
        } else if (isPdf) {
            contentEl.style.padding = '0';
            contentEl.style.minHeight = '70vh';
            contentEl.innerHTML = `<iframe src="${url}#toolbar=1" style="width:80vw; height:75vh; border:none; display:block;"></iframe>`;
        } else {
            contentEl.innerHTML = `<div style="padding:40px; color:#64748b; font-size:13px; text-align:center;">
                <i class="fa-solid fa-file" style="font-size:28px; display:block; margin-bottom:10px;"></i>
                이 파일 형식은 미리보기를 지원하지 않습니다.</div>`;
        }
    } catch(e) {
        const contentEl = document.getElementById('arcPreviewContent');
        if (contentEl) contentEl.innerHTML = `<div style="padding:40px; color:#ef4444; font-size:13px; text-align:center;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size:28px; display:block; margin-bottom:10px;"></i>
            미리보기를 불러올 수 없습니다.</div>`;
    }
}

function arcClosePreview() {
    const modal = document.getElementById('arcPreviewModal');
    if (modal) {
        if (modal._keyHandler) document.removeEventListener('keydown', modal._keyHandler);
        modal.remove();
    }
}



function arcDownloadItem(btn) {
    const item = btn.closest('.arc-file-item');
    arcDownload(item.dataset.category, item.dataset.name, item.dataset.original);
}
function arcDeleteItem(btn) {
    const item = btn.closest('.arc-file-item');
    arcDelete(item.dataset.category, item.dataset.name, btn);
}

async function arcDownload(category, fileName, originalName) {
    if (!supabaseClient) return;
    const path = arcStoragePath(category, fileName);
    const { data, error } = await supabaseClient.storage
        .from('archives')
        .download(path);
    if (error || !data) { showToast('다운로드 실패', 'error'); return; }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}

async function arcDelete(category, fileName, btn) {
    if (!confirm(`"${fileName}" 을(를) 삭제하시겠습니까?`)) return;
    if (!supabaseClient) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    const { error } = await supabaseClient.storage
        .from('archives')
        .remove([arcStoragePath(category, fileName)]);

    if (error) {
        showToast('삭제 실패', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    } else {
        showToast('삭제되었습니다.', 'success');
        arcLoadFiles();
    }
}