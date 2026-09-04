/* ================= [1. Config & Global State] ================= */

// Supabase 연동 설정
const SUPABASE_URL = "https://eukwfypbfqojbaihfqye.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MiBvlf3d6ulcVBsi7Odcgw_PTXSmXKj";

// ✅ 변수명 충돌을 피하기 위해 supabaseClient로 이름 변경
let supabaseClient = null;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabaseClient.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT' && activeSession) {
            activeSession = null;
            currentUser = null;
            location.reload();
        }
    });
} else {
    console.error("🚨 Supabase 라이브러리를 로드하지 못했습니다.");
}

let activeSession = null;
window.currentUser = null;  // Supabase Auth 사용자 프로필
// 🚀 [추가] 페이지 전환 중복 방지 타이머
let pageTransitionTimer = null;
// 2026-09-02: 업무노트 탭에 이미 한 번 들어갔다 왔으면(에디터가 이미 떠서 편집 중일 수
// 있으므로) 재진입 시 handleNoteMonthChange()로 다시 덮어쓰지 않기 위한 플래그.
let isNotesTabLoaded = false;

async function getAuthenticatedFunctionHeaders() {
    if (!supabaseClient) throw new Error('인증 시스템이 초기화되지 않았습니다.');

    const { data, error } = await supabaseClient.auth.getSession();
    const accessToken = data?.session?.access_token || '';
    if (error || !accessToken) throw new Error('로그인 세션이 만료되었습니다. 다시 로그인해 주세요.');

    return {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
    };
}

function escapeAdminHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function sanitizeAdminHtml(value) {
    const html = String(value ?? '');
    return typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(html) : escapeAdminHtml(html);
}

function safeAdminUrl(value) {
    try {
        const url = new URL(String(value ?? ''), window.location.origin);
        return ['http:', 'https:', 'blob:'].includes(url.protocol) ? url.href : '';
    } catch {
        return '';
    }
}

// 통합관리자와 에너가드랩은 하나의 로그인 계정으로 모든 기능을 사용합니다.
const ROLE_RESTRICTIONS = {};

function profileFromAuthUser(user) {
    const metadata = user?.user_metadata || {};
    const email = user?.email || '';
    const displayName = metadata.display_name || metadata.name || email.split('@')[0] || '관리자';
    return {
        id: user?.id || null,
        username: email,
        email,
        role: 'admin',
        display_name: displayName
    };
}

function enterAuthenticatedApp(user, showWelcome = false) {
    currentUser = profileFromAuthUser(user);
    activeSession = true;

    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) loginScreen.classList.add('hidden');

    const nameEl = document.getElementById('loggedUserName');
    if (nameEl) nameEl.innerText = '관리자님';
    updateRoleBadge('admin');
    applyRoleUI();
    if (showWelcome) showWelcomeModal('관리자', 'admin');

    // 🚀 새로고침/재접속해도 이전에 열어뒀던 탭들을 그대로 복원
    loadOpenPageTabs();
    const restoredId = restoreActivePageTabId();
    const restoredEl = document.querySelector(`.menu-item[onclick*="showPage('${restoredId}'"]`)
        || document.querySelector('.menu-item[onclick*="dashboard"]');
    showPage(restoredId, restoredEl, true);
}

/* ================= [2. Login Logic] ================= */
window.onload = async function() {
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

    // Supabase Auth 세션은 같은 GitHub Pages 도메인의 에너가드랩과 공유됩니다.
    if (supabaseClient) {
        const { data, error } = await supabaseClient.auth.getSession();
        if (!error && data?.session?.user) {
            enterAuthenticatedApp(data.session.user);
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
            if (weatherEl) weatherEl.innerHTML = `${icon} <span style="font-weight:700; color:#1e293b;">${escapeAdminHtml(temp)}°C</span> <span style="font-size:12px; color:#9ca3af;">(${escapeAdminHtml(desc)})</span>`;
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

// 통합관리자와 에너가드랩이 함께 사용하는 Supabase Auth 로그인
async function tryLogin() {
    const usernameEl = document.getElementById('loginUsernameInput');
    const passEl     = document.getElementById('loginPassInput');
    const msg        = document.getElementById('loginMsg');
    const email      = (usernameEl ? usernameEl.value : '').trim();
    const pass       = passEl ? passEl.value : '';

    if (!supabaseClient) {
        msg.innerText = "🚨 시스템 초기화 실패. 새로고침을 해주세요.";
        msg.style.color = "red"; return;
    }
    if (!email || !pass) {
        msg.innerText = "이메일과 비밀번호를 입력해주세요.";
        msg.style.color = "red"; return;
    }

    msg.innerText = "인증 중..."; msg.style.color = "#666";

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });

        if (error || !data?.user) {
            msg.innerText = "이메일 또는 비밀번호가 올바르지 않습니다.";
            msg.style.color = "red";
            if (passEl) { passEl.value = ''; passEl.focus(); }
            return;
        }
        localStorage.removeItem('keepLogin');
        enterAuthenticatedApp(data.user, true);

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

/* ── 로그인 환영 모달 ──
   2026-09-02: 이모지 다 빼고("쓸모없는 이모지는 촌스럽다" — 확장프로그램 UI 다듬을 때
   나온 지적을 여기도 동일 적용), "팀원이 믿고 있습니다"류 팀 전제 문구를 혼자 운영하는
   느낌에 맞게 정리, 멘트 개수도 늘림(role별 문구는 실제로 role이 항상 'admin'이라
   사용자용 문구가 죽은 코드였음 — 하나로 합침). 여기에 "오늘 확인할 업무"(monthly_tasks
   중 오늘까지 마감인데 미완료인 Daily 항목)를 실제 데이터로 보여주는 섹션을 추가함 —
   매출/블로그순위/상품순위는 loadSalesOverview 등 기존 로더가 DOM 렌더링과 강하게
   얽혀있어(순수 데이터 함수로 바로 재사용 불가) 이번엔 보류, 업무 체크만 우선 반영. */
async function showWelcomeModal(displayName, role) {
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

    const messages = [
        '오늘 하루도 수고 많으세요.',
        '가볍게 오늘 할 일부터 확인해볼까요.',
        '천천히, 그렇지만 꾸준히 가면 됩니다.',
        '오늘도 에너가드컴퍼니, 잘 되고 있습니다.',
        '쌓이는 게 다 자산이 됩니다. 오늘도 화이팅.',
        '잠깐 숨 고르고, 오늘 할 일부터 봐요.',
        '매일 조금씩이 결국 큰 차이를 만듭니다.',
        '오늘도 무리하지 말고 차근차근 가요.',
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    const badgeColor = isAdmin ? '#4f46e5' : '#10b981';
    const badgeText = isAdmin ? '관리자' : '사용자';

    // 2026-09-02(2차): 처음엔 밀린 것까지 다 긁어와서 "28건" 식으로 크게 때렸더니 로그인하자마자
    // 부담스럽다는 반응 — 웰컴창은 업무 보고서가 아니니, 오늘 것 중 딱 하나만(우선순위 높은 것
    // 우선, 동점이면 랜덤) 부드럽게 살짝 알려주는 정도로 낮춤. 밀린 업무 전체는 업무일지
    // 페이지에 가면 어차피 보이니 여기서 다 안 보여줘도 됨.
    let taskSummaryHtml = '';
    try {
        if (supabaseClient) {
            const now = new Date();
            const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const { data } = await supabaseClient.from('monthly_tasks')
                .select('task, priority, is_done')
                .eq('year', now.getFullYear()).eq('month', now.getMonth() + 1).eq('type', 'Daily').eq('date', todayKey);
            const pending = (data || []).filter(r => r.task && r.is_done !== true && r.is_done !== 'TRUE');
            if (pending.length) {
                const maxPriority = Math.max(...pending.map(r => Number(r.priority) || 0));
                const topPicks = pending.filter(r => (Number(r.priority) || 0) === maxPriority);
                const picked = topPicks[Math.floor(Math.random() * topPicks.length)];
                const restLabel = pending.length > 1 ? `<div class="wm-task-more">오늘 할 일 ${pending.length}개 중 하나예요</div>` : '';
                taskSummaryHtml = `
                    <div class="wm-task-box" onclick="closeWelcomeModal(); navigateFromDash('worklog');">
                        <div class="wm-task-title"><i class="fa-regular fa-lightbulb"></i> 오늘 할 일 중 하나만 살짝</div>
                        <div class="wm-task-pick">${escapeAdminHtml(picked.task)}</div>
                        ${restLabel}
                    </div>`;
            }
        }
    } catch (e) {
        console.warn('[웰컴모달] 업무 조회 실패', e);
    }

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
                ${greeting},<br>${displayName}님
            </div>
            <div style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: ${taskSummaryHtml ? '18px' : '28px'};">
                ${msg}
            </div>
            ${taskSummaryHtml}
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
            .wm-task-box {
                text-align: left; background: #f8fafc; border: 1px solid #eef0f4; border-radius: 12px;
                padding: 14px 16px; margin-bottom: 20px; cursor: pointer; transition: background 0.15s;
            }
            .wm-task-box:hover { background: #f1f5f9; }
            .wm-task-title { font-size: 12px; font-weight: 600; color: #94a3b8; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
            .wm-task-pick { font-size: 14px; font-weight: 700; color: #334155; line-height: 1.4; }
            .wm-task-more { font-size: 11px; color: #94a3b8; margin-top: 6px; }
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
        // 단가표: 원가 저장, 엑셀 저장, 마진 편집 버튼 숨김
        document.querySelectorAll('[onclick*="savePricingCosts"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('[onclick*="exportPricingExcel"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('[onclick*="openPricingModal"]').forEach(el => el.style.display = 'none');
        // 마진 편집 모달 저장 버튼도 숨김
        const pimConfirm = document.querySelector('.pim-btn-confirm');
        if (pimConfirm) pimConfirm.style.display = 'none';
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
        window._isLoggingOut = true;
        if (supabaseClient) await supabaseClient.auth.signOut().catch(() => {});
        activeSession = null;
        currentUser   = null;
        localStorage.removeItem('keepLogin');
        // 2026-09-02: 페이지 탭바 상태(열린 탭 목록/마지막 탭)가 로그인 세션과 무관한
        // 별개의 localStorage 키라서 로그아웃해도 안 지워지고 남아있던 문제 — 사용자가
        // "로그아웃했는데 업무탭이 여전히 남아있다"고 지적해서 같이 정리하도록 추가.
        localStorage.removeItem(PAGE_TABS_STORE_KEY);
        localStorage.removeItem(PAGE_ACTIVE_TAB_STORE_KEY);
        if(typeof isDashboardLoaded !== 'undefined') isDashboardLoaded = false;
        location.reload();
    }
}

window.openEnerguardLab = function() {
    window.open('https://enorangekid.github.io/energuard-lab/', '_blank', 'noopener');
};

/* ================= [3. Navigation & Routing Logic (새로 추가됨!)] ================= */
/* ================= [페이지 탭바 — 사이드바 카테고리를 브라우저 탭처럼 동시에 열어두기] =================
   2026-08-27: page-section들은 원래도 DOM에 항상 다 그려져 있고 showPage()가 .active 클래스만
   토글하는 구조라, "열려있는 탭 목록"만 별도로 관리하면 자연스럽게 얹을 수 있다.
   - 사이드바에서 새 카테고리를 열면 탭에 추가(이미 있으면 그대로 활성화만)
   - 탭은 ×버튼으로 개별로 닫을 수 있음
   - 열린 탭 목록/마지막으로 보던 탭은 localStorage에 저장해서 새로고침·재접속해도 복원됨
   2026-09-02: "지표 요약"(대시보드)은 업무를 처리하는 화면이 아니라 그냥 홈 화면이라, 업무
   탭으로 취급하지 않기로 함(사용자 지적) — PAGE_TAB_META에서 빼서 탭에 안 뜨게 하고, 탭이
   0개가 될 수 있게 허용(닫으면 그냥 대시보드로 돌아감 — 더 이상 "최소 1개 유지" 제약 불필요). */
const PAGE_TAB_META = {
    timeline:    { label: '업무 타임라인',   icon: 'fa-solid fa-clock-rotate-left' },
    worklog:     { label: '월간 업무일지',   icon: 'fa-solid fa-table-list' },
    productlogs: { label: '상품 수정 내역',  icon: 'fa-solid fa-pen-to-square' },
    notes:       { label: '업무 노트',      icon: 'fa-solid fa-pen-nib' },
    media:       { label: '미디어 콘텐츠',   icon: 'fa-solid fa-photo-film' },
    pricing:     { label: '단가표',        icon: 'fa-solid fa-tags' },
};
const PAGE_TABS_STORE_KEY = 'eg_admin_open_tabs_v1';
const PAGE_ACTIVE_TAB_STORE_KEY = 'eg_admin_active_tab_v1';
let openPageTabs = [];
let currentPageId = 'dashboard';

function loadOpenPageTabs() {
    try {
        const saved = JSON.parse(localStorage.getItem(PAGE_TABS_STORE_KEY) || '[]');
        openPageTabs = Array.isArray(saved) ? saved.filter(id => PAGE_TAB_META[id]) : [];
    } catch (e) { openPageTabs = []; }
}

function restoreActivePageTabId() {
    try {
        const saved = localStorage.getItem(PAGE_ACTIVE_TAB_STORE_KEY);
        return (saved && PAGE_TAB_META[saved]) ? saved : 'dashboard';
    } catch (e) { return 'dashboard'; }
}

function savePageTabsState() {
    try {
        localStorage.setItem(PAGE_TABS_STORE_KEY, JSON.stringify(openPageTabs));
        localStorage.setItem(PAGE_ACTIVE_TAB_STORE_KEY, currentPageId);
    } catch (e) { /* localStorage 막힌 환경이면 그냥 탭 기억 기능만 조용히 스킵 */ }
}

function renderPageTabStrip() {
    const strip = document.getElementById('pageTabStrip');
    if (!strip) return;
    strip.innerHTML = openPageTabs.map(id => {
        const meta = PAGE_TAB_META[id] || { label: id, icon: 'fa-solid fa-file' };
        const activeCls = id === currentPageId ? ' active' : '';
        return `<div class="pg-tab${activeCls}" onclick="activatePageTab('${id}')" data-tab-id="${id}">
            <i class="${meta.icon}"></i><span class="pg-tab-label">${meta.label}</span>
            <span class="pg-tab-close" onclick="event.stopPropagation(); closePageTab('${id}')" title="탭 닫기"><i class="fa-solid fa-xmark"></i></span>
        </div>`;
    }).join('');
    const activeTabEl = strip.querySelector('.pg-tab.active');
    if (activeTabEl) activeTabEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

window.activatePageTab = function(pageId) {
    const el = document.querySelector(`.menu-item[onclick*="showPage('${pageId}'"]`);
    showPage(pageId, el);
};

window.closePageTab = function(pageId) {
    const idx = openPageTabs.indexOf(pageId);
    if (idx === -1) return;
    openPageTabs.splice(idx, 1);
    if (currentPageId === pageId) {
        // 닫은 탭이 지금 보던 탭이었으면 바로 왼쪽(없으면 맨 앞, 그것도 없으면 대시보드)으로 전환
        const nextId = openPageTabs[Math.max(0, idx - 1)] || openPageTabs[0] || 'dashboard';
        window.activatePageTab(nextId);
    } else {
        savePageTabsState();
        renderPageTabStrip();
    }
};

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

    // 🚀 페이지 탭바 등록 — 처음 여는 카테고리면 탭에 추가, 이미 열려있으면 활성화만.
    // currentPageId는 대시보드를 포함해 항상 갱신(탭 스트립의 "활성 탭" 표시가 정확해야
    // 하므로 — 대시보드로 오면 어떤 탭도 active로 안 보여야 함), openPageTabs에 실제로
    // 넣는 건 탭 대상 페이지일 때만.
    currentPageId = pageId;
    if (PAGE_TAB_META[pageId] && !openPageTabs.includes(pageId)) openPageTabs.push(pageId);
    savePageTabsState();
    renderPageTabStrip();

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
  
    // 2. 사이드바 메뉴 액티브 토글
    if(element) {
        document.querySelectorAll('.menu-item').forEach(menu => { menu.classList.remove('active'); });
        element.classList.add('active');
    } else {
        document.querySelectorAll('.menu-item').forEach(menu => { menu.classList.remove('active'); });
        // 2026-09-02: activatePageTab()은 `showPage('id'` 형태로 정확히 매칭하는데 여기는
        // pageId 문자열이 onclick 어디든 있으면 매칭하는 느슨한 방식이었다 — 지금 페이지
        // id들끼리는 안 겹쳐서 문제가 없었지만, 나중에 예를 들어 pricing_history 같은 id를
        // 추가하면 pricing 탭 복원 시 엉뚱한 메뉴가 활성화될 수 있는 잠재 버그라 통일함.
        let targetMenu = document.querySelector(`.menu-item[onclick*="showPage('${pageId}'"]`);
        if (targetMenu) {
            targetMenu.classList.add('active');
        } else if(pageId === 'dashboard') {
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
    // 2026-09-02: 페이지 탭바로 여러 탭을 오가며 작업하게 됐는데, 여기 로딩 호출들이
    // "그 페이지로 들어올 때마다 무조건" 실행되는 구조였다 — worklog는 initMonthlyLog()가
    // 컨테이너를 innerHTML=''로 비우고 새로 그리고, notes는 handleNoteMonthChange()가
    // 에디터 내용을 서버 값으로 덮어써서, 월간업무일지에서 입력하다가 업무노트 갔다 오면
    // 저장 안 한 입력이 그대로 날아가는 버그였다(사용자가 실제로 겪어서 발견). 이미 이번
    // 세션에 한 번 로드된 상태면(같은 달의 worklog 캐시가 있거나 notes 에디터가 이미 떠
    // 있으면) 다시 지우고 다시 그리지 않고 그대로 둔다 — 대시보드가 isDashboardLoaded로
    // 이미 하던 것과 같은 패턴.
    if(pageId === 'dashboard' && typeof loadDashboardData === 'function') loadDashboardData();
    if(pageId === 'timeline' && typeof loadTimelineFromServer === 'function') loadTimelineFromServer();
    if(pageId === 'worklog' && typeof loadWorklogFromServer === 'function') {
        if(typeof updateDateDisplay === 'function') updateDateDisplay();
        const worklogMonthKey = (typeof currentWorkYear !== 'undefined' && typeof currentWorkMonth !== 'undefined')
            ? `${currentWorkYear}-${currentWorkMonth}` : null;
        const worklogAlreadyLoaded = worklogMonthKey && typeof worklogCache !== 'undefined' && worklogCache[worklogMonthKey];
        if (!worklogAlreadyLoaded) {
            if(typeof initMonthlyLog === 'function') initMonthlyLog();
            loadWorklogFromServer();
        }
    }
    if(pageId === 'productlogs' && typeof renderProductLogPage === 'function') renderProductLogPage();
    // 🚀 [노트 페이지 로직 수정] 타이머에 할당하여 페이지 이탈 시 취소 가능하게 만듦
    if(pageId === 'notes' && !isNotesTabLoaded) {
        pageTransitionTimer = setTimeout(() => {
            const monthPicker = document.getElementById('noteMonthPicker');
            const now = new Date();
            const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
            if(monthPicker && !monthPicker.value) monthPicker.value = thisMonth;
            if(typeof initQuill === 'function') initQuill();
            if(typeof handleNoteMonthChange === 'function') {
                handleNoteMonthChange();
            }
            isNotesTabLoaded = true;
        }, 300);
    }
    // 블로그/유튜브 원고 — '미디어 콘텐츠' 페이지(2026-08-14, 업무노트에서 분리됨)
    if(pageId === 'media') {
        pageTransitionTimer = setTimeout(() => {
            if(typeof initMediaQuill === 'function') initMediaQuill();
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

// 📌 외부(챗GPT/워드 등)에서 복사해 붙여넣을 때 딸려오는 <h1>~<h6> 제목 태그를
// 일반 문단으로 강제 변환한다. 태그 자체가 남아있으면 글자 크기를 15px로 맞춰도
// 브라우저 기본 굵기/여백이 남아 줄 간격이 달라 보이는 문제가 있었다(2026-08-18).
window.stripHeaderClipboardMatcher = function(node, delta) {
    if (node.nodeType === 1 && /^H[1-6]$/.test(node.tagName)) {
        delta.ops.forEach(function(op) {
            if (op.attributes && op.attributes.header) delete op.attributes.header;
        });
    }
    return delta;
};
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
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.innerHTML = TOAST_ICONS[type] || TOAST_ICONS.info;
    const messageEl = document.createElement('span');
    messageEl.className = 'toast-msg';
    messageEl.textContent = String(message ?? '');
    toast.append(icon, messageEl);

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
   archivePanel)은 이 함수를 통해 열고 닫습니다.
   - targetId  : 열거나 닫을 패널 ID
   - onOpen    : 패널을 열 때 실행할 콜백 (선택)
   새 패널을 추가할 때는 QUICK_PANELS 배열에 ID만 추가하면 됩니다.
──────────────────────────────────────────────────────────────── */
const QUICK_PANELS = [
    'quickMemoPanel', 'aiChatPanel', 'calcPanel', 'estimatePanel', 'archivePanel'
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
    openPanel('calcPanel');
}
/* ================================================================
   자료실 (Archive Panel) — Supabase Storage 'archives' 버킷 사용
   폴더 구조: archives/{cat}/{file} — 카테고리 폴더 바로 아래, 사람별 폴더 없음
   ================================================================ */


/* ── 자료실 경로 헬퍼 ──────────────────────────────────────────
   예전엔 quote/image/etc가 로그인한 사람별로 폴더가 또 나뉘어 있었는데(직원별
   구분용), 1인 운영으로 정리되면서 의미가 없어져 전부 공용 방식(폴더 없이
   카테고리 바로 아래)으로 통일했다(2026-08-25).
────────────────────────────────────────────────────────────── */
const ARC_PUBLIC_CATS = ['company', 'cert', 'quote', 'image', 'etc'];

function arcIsPublic(cat) {
    return ARC_PUBLIC_CATS.includes(cat);
}

/* profileFromAuthUser()가 username을 로그인 이메일 그대로 쓰게 되면서(보안 리팩터링
   이후), 이메일의 @가 Storage 경로에 그대로 들어가 "Invalid key"로 업로드가 거부되는
   문제가 있었다(2026-08-25, 견적서 자료실 저장에서 발견). */
function arcSafeUsername(username) {
    return String(username || 'unknown')
        .replace(/@/g, '_at_')
        .replace(/[^a-zA-Z0-9._-]/g, '_');
}

/* 한글 등 비ASCII 파일명을 평문으로 그대로 Storage 키에 넣으면 "Invalid key"로
   거부된다(2026-08-25, @ 수정 후에도 한글 파일명에서 재발 확인). 처음엔 %를 -로
   치환하는 방식을 썼는데, "010-7181-7224"처럼 이름에 원래 하이픈이 있는 경우
   디코딩 시 진짜 하이픈과 구분이 안 돼서 이름이 깨지는 문제가 있었다 — 그래서
   ASCII-safe한 이름은 아예 손대지 않고 그대로 두고, 진짜 인코딩이 필요한
   경우(한글 등)만 "b64-" 마커 + base64url로 확실히 구분되게 바꿨다. 확장자는
   디코딩 없이 그대로 유지해서 자료실의 파일 아이콘/미리보기 판별이 안 깨지게 한다. */
function arcEncodeFileName(name) {
    const str = String(name || '');
    if (/^[a-zA-Z0-9._-]*$/.test(str)) return str; // 이미 안전하면 그대로
    const dotIdx = str.lastIndexOf('.');
    const base = dotIdx > 0 ? str.slice(0, dotIdx) : str;
    const ext = dotIdx > 0 ? str.slice(dotIdx) : '';
    const b64 = btoa(unescape(encodeURIComponent(base)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `b64-${b64}${ext}`;
}

function arcStoragePath(cat, fileName) {
    const username = arcSafeUsername(currentUser?.username);
    return arcIsPublic(cat)
        ? `${cat}/${fileName}`
        : `${cat}/${username}/${fileName}`;
}

function arcListPath(cat) {
    const username = arcSafeUsername(currentUser?.username);
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
        // 세 가지 저장 방식이 섞여 있다:
        //  1) 예전 회사자료/인증서 등 — encodeURIComponent 전체를 %→- 치환, 그래서 한글이
        //     껴있으면 항상 "-XX-XX..."(16진수)로 시작한다.
        //  2) 오늘 새로 만든 방식 — "b64-" 마커 + base64url (진짜 인코딩이 필요할 때만).
        //  3) 그 외(전화번호/영문 등 원래 ASCII-safe한 이름) — 손대지 않고 그대로.
        // "010-7181-7224"처럼 원래부터 하이픈이 있는 이름 전체를 무조건 디코딩 대상으로
        // 취급했다가 깨지는 문제가 있었다(2026-08-25) — 맨 앞 패턴으로만 판단해야 안전하다.
        const decodeArcName = (name) => {
            const idx = name.indexOf('___');
            if (idx === -1) return name;
            const raw = name.substring(idx + 3);
            const dotIdx = raw.lastIndexOf('.');
            const base = dotIdx > 0 ? raw.slice(0, dotIdx) : raw;
            const ext = dotIdx > 0 ? raw.slice(dotIdx) : '';
            if (base.startsWith('b64-')) {
                try {
                    const b64 = base.slice(4).replace(/-/g, '+').replace(/_/g, '/');
                    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
                    return decodeURIComponent(escape(atob(padded))) + ext;
                } catch { return raw; }
            }
            if (/^-[0-9A-Fa-f]{2}/.test(raw)) {
                try { return decodeURIComponent(raw.replace(/-/g, '%')); }
                catch { return raw; }
            }
            return raw; // ASCII-safe한 원래 이름 — 그대로
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
            const safeCategory = escapeAdminHtml(f.category);
            const safeStoredName = escapeAdminHtml(f.name);
            const originalName = decodeArcName(f.name);
            const safeOriginalName = escapeAdminHtml(originalName);
            const catBadge = arcCurrentCategory === 'all'
                ? `<span style="font-size:10px; background:#f1f5f9; color:#64748b; padding:1px 6px; border-radius:4px; font-weight:600;">${escapeAdminHtml(catLabel[f.category] || f.category)}</span>`
                : '';
            const ext = f.name.split('.').pop().toLowerCase();
            const canPreview = ['jpg','jpeg','png','gif','webp','svg','pdf'].includes(ext);
            return `
            <div class="arc-file-item" data-category="${safeCategory}" data-name="${safeStoredName}" data-original="${safeOriginalName}">
                <i class="fa-solid ${icon}" style="color:${color}; font-size:18px; flex-shrink:0; cursor:${canPreview ? 'pointer' : 'default'};"
                   ${canPreview ? `onclick="arcPreviewItem(this)" title="미리보기"` : ''}></i>
                <div style="flex:1; min-width:0; cursor:${canPreview ? 'pointer' : 'default'};"
                     ${canPreview ? `onclick="arcPreviewItem(this)"` : ''}>
                    <div style="font-size:12px; font-weight:600; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${safeOriginalName}">${safeOriginalName}</div>
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
        // 파일명: 타임스탬프___원본명(인코딩) 구조로 저장 — 한글 파일명 그대로 저장하면
        // Storage가 거부한다(arcEncodeFileName 참고).
        const safeName = `${Date.now()}___${arcEncodeFileName(file.name)}`;
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
                      title="${escapeAdminHtml(originalName)}">${escapeAdminHtml(originalName)}</span>
                <div style="display:flex; gap:8px; flex-shrink:0;">
                    <button id="arcPreviewDownloadBtn"
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
    const downloadBtn = document.getElementById('arcPreviewDownloadBtn');
    if (downloadBtn) downloadBtn.onclick = () => arcDownload(category, fileName, originalName);

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

        const url = safeAdminUrl(data.signedUrl);
        if (!url) throw new Error('허용되지 않은 미리보기 URL입니다.');

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
            contentEl.innerHTML = `<iframe src="${escapeAdminHtml(url)}#toolbar=1" style="width:80vw; height:75vh; border:none; display:block;"></iframe>`;
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
    a.download = originalName || fileName; // 인코딩된 저장 키 대신 원래(한글) 이름으로 저장
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
