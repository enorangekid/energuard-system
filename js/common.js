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
      document.getElementById('clock').innerText = now.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }, 1000);
    
    const tDate = document.getElementById('tDate');
    if(tDate) tDate.valueAsDate = new Date();
};

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
        authPassword = ""; localStorage.removeItem("dashboard_pass"); location.reload(); 
    }
}

/* ================= [3. Navigation Logic] ================= */
function showPage(pageId, element) {
  document.querySelectorAll('.page-section').forEach(section => { section.classList.remove('active'); });
  document.getElementById('page-' + pageId).classList.add('active');
  
  if(element) {
    document.querySelectorAll('.menu-item').forEach(menu => { menu.classList.remove('active'); });
    element.classList.add('active');
    document.getElementById('pageTitleText').innerText = element.innerText.trim();
  }
  
  if(pageId === 'timeline' && typeof loadTimelineFromServer === 'function') loadTimelineFromServer();
  if(pageId === 'worklog' && typeof loadWorklogFromServer === 'function') loadWorklogFromServer(); 
  if(pageId === 'productlogs' && typeof renderProductLogPage === 'function') renderProductLogPage();
  if(pageId === 'ranking' && typeof loadRankingData === 'function') loadRankingData();
  if(pageId === 'sales' && typeof loadSalesData === 'function') loadSalesData();

  // [수정] 노트 페이지 진입 로직 강화
  if(pageId === 'notes') {
      document.getElementById('loader').style.display = 'flex';
      
      // 약간의 지연을 주어 DOM이 렌더링된 후 실행
      setTimeout(() => {
          // 1. 오늘 날짜 세팅
          const dateInput = document.getElementById('noteDate');
          if(!dateInput.value) {
              const today = new Date().toISOString().split('T')[0];
              dateInput.value = today;
          }

          // 2. 에디터 초기화 및 데이터 로드 호출
          if(typeof initQuill === 'function') initQuill();
          
          if(typeof handleNoteDateChange === 'function') {
              handleNoteDateChange(); 
          } else {
              document.getElementById('loader').style.display = 'none';
          }
      }, 300); // 300ms 딜레이로 안정성 확보
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
