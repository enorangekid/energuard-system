/* ================= [Ranking & Sales Logic] ================= */
// 전역 변수 설정
var isAdmin = false; 
var products = [];
var originalProducts = [];
var salesData = [];
var originalSalesData = [];
var currentTab = '아이소핑크';
var currentSalesTab = '스마트스토어';
var isSalesEditMode = false; 
var currentEditRowIndex = -1; 
var salesChartFin = null; // 재무 차트
var salesChartTraff = null; // 트래픽 차트

// 데이터 인덱스 상수 (N열에 세부 카테고리 추가)
const IDX_CODE = 0; 
const IDX_NAME = 1; 
const IDX_PRICE = 2; 
const IDX_CATEGORY = 3; 
const IDX_KEYWORD = 4; 
const IDX_REMARK = 10; 
const IDX_CHECK = 11; 
const IDX_IMAGE = 12; 
const IDX_DETAIL_CAT = 13; 

// 키워드 정렬 순서
var CUSTOM_KEYWORD_ORDER = [
  "아이소핑크", "압축스티로폼", "스티로폼", "스티로폼단열재", "열반사단열재",
  "캠핑단열재", "은박매트", "길고양이겨울집", "창문방풍", "에어컨커버",
  "단열벽지", "바닥단열재", "전기난방필름", "우레탄뿜칠", "열선커터기",
  "우레탄폼건", "창문단열재", "창문열차단", "창문햇빛가리개", "에어컨가림막", "어싱매트"
];
var KEYWORD_PRIORITY_MAP = {};
CUSTOM_KEYWORD_ORDER.forEach((k, i) => KEYWORD_PRIORITY_MAP[k] = i);

/* ================= [1. Ranking Functions] ================= */

function loadRankingData() {
  if(!authPassword) return; 
  document.getElementById('loader').style.display = 'flex';
  
  fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: "read", sheetName: "Sheet1", password: authPassword })
  })
  .then(res => res.json())
  .then(json => {
    if(json.status === "error") { alert("데이터 로드 실패: " + json.message); return; }
    if(json.data && json.data.length > 0) {
      if(json.data[0][0] === "상품번호") json.data.shift(); // 헤더 제거
      originalProducts = JSON.parse(JSON.stringify(json.data)); 
      products = JSON.parse(JSON.stringify(originalProducts));
    } else { 
      products = []; originalProducts = []; 
    }
    renderRanking();
  })
  .catch(err => { console.error(err); alert("순위 데이터 로드 중 오류 발생"); })
  .finally(() => document.getElementById('loader').style.display = 'none');
}

function renderRanking() {
  var tbody = document.getElementById('list');
  if(!tbody) return;

  var groups = {};
  products.forEach((p, idx) => {
    if(String(p[IDX_CATEGORY]).trim() !== currentTab) return;
    var code = p[IDX_CODE]; 
    if(!groups[code]) groups[code] = []; 
    groups[code].push({ data: p, orgIdx: idx });
  });

  if(Object.keys(groups).length === 0) { 
      tbody.innerHTML = `<tr><td colspan="14" style="padding:40px; color:#999;">'${currentTab}' 데이터가 없습니다.</td></tr>`; 
      return; 
  }

  var groupArray = Object.keys(groups).map(code => { return { code: code, items: groups[code] }; });
  groupArray.sort((a, b) => {
    var mainA = a.items[0].data; var mainB = b.items[0].data;
    
    var keyA = String(mainA[IDX_KEYWORD] || "").trim();
    var keyB = String(mainB[IDX_KEYWORD] || "").trim();
    var idxA = KEYWORD_PRIORITY_MAP[keyA]; if (idxA === undefined) idxA = 9999;
    var idxB = KEYWORD_PRIORITY_MAP[keyB]; if (idxB === undefined) idxB = 9999;
    
    if (idxA !== idxB) return idxA - idxB; 
    
    function getLatestRank(row) { 
        for (var k = 9; k >= 5; k--) if (row[k] && !isNaN(row[k])) return Number(row[k]); 
        return 999999; 
    }
    var rankA = getLatestRank(mainA); var rankB = getLatestRank(mainB);
    if (rankA !== rankB) return rankA - rankB; 
    return String(mainA[IDX_NAME]).localeCompare(String(mainB[IDX_NAME])); 
  });

  var htmlBuffer = [];
  groupArray.forEach(group => {
    var items = group.items; 
    var main = items[0]; 
    var hasSub = items.length > 1; 
    var btnHtml = hasSub ? `<span class="toggle-btn" onclick="toggleSub('${group.code}')">+</span>` : '';
    
    htmlBuffer.push(createRowHtml(main.data, main.orgIdx, 'main-row', btnHtml, group.code, false));
    if(hasSub) {
      for(var i=1; i<items.length; i++) {
        var sub = items[i];
        htmlBuffer.push(createRowHtml(sub.data, sub.orgIdx, `sub-row sub-${group.code}`, '', group.code, true));
      }
    }
  });
  tbody.innerHTML = htmlBuffer.join('');
  
  if(isAdmin) { document.querySelectorAll('.admin-col').forEach(el => el.style.display = ''); } 
  else { document.querySelectorAll('.admin-col').forEach(el => el.style.display = 'none'); }
}

function createRowHtml(p, realIndex, className, btnHtml, code, isSub = false) {
  var ranks = [p[5], p[6], p[7], p[8], p[9]];
  var diffHtml = '<span class="dash">-</span>';
  var lastIdx = -1;
  for(let i=4; i>=0; i--) { if(ranks[i] !== "" && ranks[i] != null) { lastIdx = i; break; } }
  
  if(lastIdx > 0 && ranks[lastIdx-1]) { 
      var d = ranks[lastIdx-1] - ranks[lastIdx]; 
      diffHtml = d > 0 ? `<span class="up">▲${d}</span>` : (d < 0 ? `<span class="down">▼${Math.abs(d)}</span>` : '<span class="dash">-</span>'); 
  }

  var weekCells = '';
  for(var i=5; i<=9; i++) {
      var val = p[i] ? p[i] : ''; 
      var hl = (i === (lastIdx + 5)) ? 'latest-rank' : '';
      if(isAdmin) { weekCells += `<td class="${hl}"><input type="text" inputmode="numeric" class="rank-input" value="${val}" onchange="updateData(${realIndex}, ${i}, this.value)"></td>`; } 
      else { weekCells += `<td class="${hl}">${val}</td>`; }
  }

  var rawMemo = p[IDX_REMARK] ? String(p[IDX_REMARK]) : ""; 
  var memoList = getParsedMemos(rawMemo);
  var remarkCell = '';
  if(isAdmin) { remarkCell = `<td><button class="admin-memo-btn" onclick="openRankingMemoModal(${realIndex})">📝 (${memoList.length})</button></td>`; } 
  else {
      if(memoList.length > 0) {
          var sortedList = [...memoList].reverse();
          var popupHtml = `<ul class="popup-list">`;
          sortedList.forEach(m => { 
              var txtClass = m.text.includes("[시스템]") ? "sys-log" : ""; 
              popupHtml += `<li class="popup-item"><span class="popup-date">${m.date}</span><span class="${txtClass}">${m.text}</span></li>`; 
          });
          popupHtml += `</ul>`;
          remarkCell = `<td><div class="memo-container"><span class="memo-badge">📝 ${memoList.length}</span><div class="memo-popup">${popupHtml}</div></div></td>`;
      } else { remarkCell = `<td></td>`; }
  }

  var linkUrl = `https://smartstore.naver.com/hkdy/products/${p[IDX_CODE]}`;
  var isChecked = (p[IDX_CHECK] === true || p[IDX_CHECK] === "TRUE" || p[IDX_CHECK] === "true");
  var checkInput = isAdmin ? `<input type="checkbox" class="check-input" ${isChecked ? 'checked' : ''} onchange="updateData(${realIndex}, ${IDX_CHECK}, this.checked)">` : '';

  var imgUrl = p[IDX_IMAGE] || "";
  var imgHtml = "";
  if (imgUrl) {
      if (isAdmin && !isSub) {
          imgHtml = `<div style="position:relative; display:inline-block; padding-bottom:30px;">
                        <img src="${imgUrl}" style="width:80px; height:80px; object-fit:cover; border-radius:6px; border:1px solid #e5e7eb; vertical-align:middle;">
                        <button onclick="fetchProductImage(${realIndex}, '${p[IDX_CODE]}')" style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); background:#334155; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; font-weight:bold; cursor:pointer; white-space:nowrap; box-shadow:0 2px 4px rgba(0,0,0,0.1);" title="새 이미지로 갱신">🔄 다시 불러오기</button>
                     </div>`;
      } else {
          imgHtml = `<img src="${imgUrl}" style="width:80px; height:80px; object-fit:cover; border-radius:6px; vertical-align:middle; border:1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">`;
      }
  } else {
      if (isAdmin && !isSub) {
          imgHtml = `<button onclick="fetchProductImage(${realIndex}, '${p[IDX_CODE]}')" style="font-size:11px; cursor:pointer; background:#f1f5f9; border:1px dashed #cbd5e1; color:#64748b; border-radius:6px; width:80px; height:80px; font-weight:bold; padding:0; display:flex; flex-direction:column; justify-content:center; align-items:center;">이미지<br>가져오기</button>`;
      } else {
          imgHtml = `<div style="width:80px; height:80px; background:#f8fafc; border-radius:6px; display:inline-block; border:1px dashed #e2e8f0;"></div>`;
      }
  }
  var imgCell = `<td>${imgHtml}</td>`; 

  var detailCatStr = p[IDX_DETAIL_CAT] ? String(p[IDX_DETAIL_CAT]) : "";
  var codeDisplay, nameHtml, priceDisplay, keywordContent, deleteCell;

  if (isAdmin) {
      codeDisplay = `<input type="text" class="admin-input" value="${p[IDX_CODE]}" onchange="updateProductCode(${realIndex}, this.value)" placeholder="코드">`;
      var safeName = String(p[IDX_NAME] || "").replace(/"/g, '&quot;');
      nameHtml = `
          <div style="display:flex; align-items:center; gap:8px; height:100%;">
              <div>${checkInput}</div>
              <div style="flex:1; display:flex; flex-direction:column; justify-content:center; gap:4px; min-width:0;">
                  <input type="text" class="admin-input admin-input-left" value="${safeName}" onchange="updateData(${realIndex}, ${IDX_NAME}, this.value)" placeholder="상품명">
                  <input type="text" class="admin-input admin-input-left" value="${detailCatStr}" onchange="updateData(${realIndex}, ${IDX_DETAIL_CAT}, this.value)" placeholder="상품 카테고리 (N열)" style="color:#64748b; font-weight:normal; border-color:#cbd5e1; background:#f8fafc;">
              </div>
          </div>`;
      priceDisplay = `<input type="number" class="admin-input" value="${p[IDX_PRICE]}" onchange="updateData(${realIndex}, ${IDX_PRICE}, this.value)" placeholder="가격">`;
      
      var keywordInput = `<input type="text" class="admin-input-key" value="${p[IDX_KEYWORD]}" onchange="updateData(${realIndex}, ${IDX_KEYWORD}, this.value)" placeholder="키워드">`;
      
      if (!isSub) { keywordContent = `<div>${keywordInput}</div>`; } 
      else { keywordContent = `<div style="padding-left:15px;">ㄴ ${keywordInput}</div>`; }
      
      deleteCell = `<td><button class="del-btn" onclick="deleteProductRow(${realIndex})">삭제</button></td>`;
  } else {
      codeDisplay = isSub ? '' : `<a href="${linkUrl}" target="_blank" class="prod-link"><span class="prod-no">${p[IDX_CODE]}</span></a>`;
      var nameClass = isChecked ? 'danger-bg' : '';
      var catHtml = detailCatStr ? `<div style="font-size:12px; color:#64748b; margin-top:3px; font-weight:500;">${detailCatStr}</div>` : '';
      var baseNameHtml = `<span class="prod-name ${nameClass}" title="${p[IDX_NAME]}">${p[IDX_NAME]}</span>`;
      
      if (!isSub) { 
          nameHtml = `
          <div style="display:flex; align-items:center; gap:8px; height:100%;">
              <div>${checkInput}</div>
              <div style="flex:1; display:flex; flex-direction:column; justify-content:center; text-align:left; min-width:0;">
                  <a href="${linkUrl}" target="_blank" class="prod-link" style="display:inline-block;">${baseNameHtml}</a>
                  ${catHtml}
              </div>
          </div>`; 
      } else {
          nameHtml = `
          <div style="display:flex; align-items:center; gap:8px; height:100%;">
              <div>${checkInput}</div>
              <div style="flex:1; display:flex; flex-direction:column; justify-content:center; text-align:left; min-width:0;">
                  ${baseNameHtml}
                  ${catHtml}
              </div>
          </div>`;
      }
      priceDisplay = isSub ? '' : Number(p[IDX_PRICE]).toLocaleString();
      var keywordRaw = p[IDX_KEYWORD];
      var keywordSearchUrl = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(keywordRaw)}&vertical=search`;
      var keywordHtml = `<a href="${keywordSearchUrl}" target="_blank" class="keyword-link">${keywordRaw}</a>`;
      keywordContent = isSub ? `ㄴ ${keywordHtml}` : keywordHtml;
      deleteCell = ``;
  }

  var keywordClass = isSub ? 'sub-keyword' : 'keyword';

  return `<tr class="${className}">
            <td>${btnHtml}</td>
            <td>${codeDisplay}</td>
            ${imgCell} 
            <td style="text-align:left; vertical-align:middle;">${nameHtml}</td>
            <td>${priceDisplay}</td>
            <td class="${keywordClass}">${keywordContent}</td>
            <td>${diffHtml}</td>
            ${weekCells}
            ${remarkCell}
            ${deleteCell}
          </tr>`;
}

function fetchProductImage(realIndex, productId) {
    if(!productId || productId.startsWith("NEW_")) { alert("유효한 상품 번호가 아닙니다."); return; }
    var btn = event.target;
    btn.innerText = "로딩중...";

    fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: "get_naver_image", productId: productId, password: authPassword })
    })
    .then(res => res.json())
    .then(json => {
        if(json.status === "success") {
            products[realIndex][IDX_IMAGE] = json.imageUrl;
            renderRanking();
        } else {
            alert("이미지 가져오기 실패: " + json.message);
            btn.innerText = "재시도";
        }
    })
    .catch(err => { console.error(err); alert("서버 통신 오류"); btn.innerText = "오류"; });
}

function updateProductCode(realIndex, val) {
    products[realIndex][IDX_CODE] = val;
    if(confirm("상품번호가 변경되었습니다. 이미지를 자동으로 가져올까요?")) { fetchProductImage(realIndex, val); }
}

function toggleEditMode() {
  var btn = document.getElementById('editModeBtn'); 
  var panel = document.getElementById('adminPanel'); 
  var masterBtn = document.getElementById('masterCheck'); 
  var adminCols = document.querySelectorAll('.admin-col');

  if (isAdmin) {
      isAdmin = false; btn.innerText = "✏️ 편집 모드"; btn.classList.remove('btn-active');
      panel.style.display = 'none'; if(masterBtn) masterBtn.style.display = 'none'; 
      adminCols.forEach(col => col.style.display = 'none');
      products = JSON.parse(JSON.stringify(originalProducts));
      renderRanking();
  } else {
      isAdmin = true; btn.innerText = "❌ 편집 종료"; btn.classList.add('btn-active');
      panel.style.display = 'flex'; if(masterBtn) masterBtn.style.display = 'inline-block'; 
      adminCols.forEach(col => col.style.display = ''); 
      renderRanking();
  }
}

function setTab(t) { 
  currentTab = t; 
  var master = document.getElementById('masterCheck');
  if(master) master.checked = false;
  document.querySelectorAll('#page-ranking .tab').forEach(b => b.classList.toggle('active', b.innerText == t)); 
  renderRanking(); 
}

function toggleSub(code) {
  var rows = document.querySelectorAll(`.sub-${code}`);
  var btn = document.querySelector(`.main-row .toggle-btn[onclick="toggleSub('${code}')"]`);
  rows.forEach(row => {
    if(row.style.display === 'table-row') { row.style.display = 'none'; if(btn) btn.innerText = '+'; } 
    else { row.style.display = 'table-row'; if(btn) btn.innerText = '-'; }
  });
}

function updateData(realIndex, colIndex, val) { products[realIndex][colIndex] = val; }

function toggleAllChecks(checked) {
  if(!isAdmin) return;
  products.forEach(p => { if(String(p[IDX_CATEGORY]).trim() === currentTab) p[IDX_CHECK] = checked; });
  renderRanking();
}

function addEmptyRow() {
  if(!isAdmin) { alert("편집 모드에서만 추가할 수 있습니다."); return; }
  var tempCode = "NEW_" + Date.now();
  var newRow = [ tempCode, "", "", currentTab, "", "", "", "", "", "", "[]", false, "", "" ];
  products.push(newRow);
  alert("새 상품(메인) 행이 추가되었습니다. 맨 아래를 확인하세요.");
  renderRanking();
  setTimeout(() => { document.querySelector('.ranking-scroll-wrapper').scrollTop = document.querySelector('.ranking-scroll-wrapper').scrollHeight; }, 100);
}

function deleteProductRow(realIndex) {
  if(!confirm("정말 이 행을 삭제하시겠습니까? (저장 버튼을 눌러야 완전히 반영됩니다)")) return;
  products.splice(realIndex, 1); renderRanking();
}

function saveData() {
  var btn = document.getElementById('saveBtn'); var originalText = btn.innerText;
  if (!products || products.length === 0) { alert("⚠️ 저장할 데이터가 없습니다!"); return; }
  btn.disabled = true; btn.innerText = "저장 중..."; document.getElementById('loader').style.display = 'flex';
  
  fetch(SCRIPT_URL, { 
      method: 'POST', redirect: 'follow', 
      body: JSON.stringify({ action: "save", sheetName: "Sheet1", data: products, password: authPassword }) 
  })
  .then(res => res.json()).then(json => { 
      if(json.status === "success") { 
          alert("✅ 저장 완료되었습니다!"); originalProducts = JSON.parse(JSON.stringify(products));
      } else { alert("❌ 저장 실패: " + json.message); } 
  })
  .catch(err => { alert("⚠️ 통신 오류가 발생했습니다."); }).finally(() => { document.getElementById('loader').style.display = 'none'; btn.disabled = false; btn.innerText = originalText; });
}

function resetData() {
  if(!confirm("수정 중인 내용을 모두 취소하고, 서버에 저장된 원래 값을 다시 불러오시겠습니까?")) return;
  loadRankingData(); 
}

function downloadCSV() {
  if(!isAdmin) { alert("편집 모드에서만 다운로드 가능합니다."); return; }
  if(products.length === 0) { alert("데이터가 없습니다."); return; }
  var csvContent = "\uFEFF"; csvContent += "상품번호,상품명,세부카테고리,가격,탭분류,키워드,1주차,2주차,3주차,4주차,5주차,비고,중요체크,이미지\n";
  products.forEach(p => {
    var rawMemo = p[IDX_REMARK] ? String(p[IDX_REMARK]) : ""; var memoList = getParsedMemos(rawMemo); var memoText = memoList.map(m => `[${m.date}] ${m.text}`).join(" / ");
    var row = [ p[IDX_CODE], `"${String(p[IDX_NAME]||"").replace(/"/g, '""')}"`, `"${String(p[IDX_DETAIL_CAT]||"").replace(/"/g, '""')}"`, p[IDX_PRICE], p[IDX_CATEGORY], p[IDX_KEYWORD], p[5], p[6], p[7], p[8], p[9], `"${memoText.replace(/"/g, '""')}"`, p[IDX_CHECK] ? "TRUE" : "FALSE", p[IDX_IMAGE] || "" ];
    csvContent += row.join(",") + "\n";
  });
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); var url = URL.createObjectURL(blob); var link = document.createElement("a"); var today = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url); link.setAttribute("download", `한국단열_순위데이터_${today}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

/* ================= [2. Sales Functions] ================= */

function loadSalesData() {
  if(!authPassword) return;
  document.getElementById('loader').style.display = 'flex';
  
  fetch(SCRIPT_URL, {
      method: 'POST', body: JSON.stringify({ action: "read", sheetName: "SalesData", password: authPassword })
  })
  .then(res => res.json()).then(json => {
      if (json.status === "error") { alert("데이터 로드 실패: " + json.message); return; }
      if(json.data && json.data.length > 0) {
          if(json.data[0][0] === "몰구분") json.data.shift();
          originalSalesData = JSON.parse(JSON.stringify(json.data));
          salesData = JSON.parse(JSON.stringify(originalSalesData));
      } else { salesData = []; originalSalesData = []; }
      isSalesEditMode = false; 
      updateSalesEditUI(); 
      setSalesTab(currentSalesTab); // renderSales() 대신 호출하여 첫 로딩부터 여백 0px 완벽 적용
  })
  .catch(err => { console.error(err); alert("매출 데이터 로드 중 오류 발생: HTML 파일이 최신 버전인지 확인하세요."); })
  .finally(() => { document.getElementById('loader').style.display = 'none'; });
}

function parseRatio(val) {
    if (val === undefined || val === null || val === "") return "";
    var str = String(val).trim().replace(/,/g, '');
    if (str.includes('%')) return Number(str.replace(/%/g, '')).toFixed(1);
    var num = Number(str);
    if (isNaN(num)) return "";
    if (num <= 1 && num > 0) return (num * 100).toFixed(1);
    return num.toFixed(1);
}

// 1. 데이터 업데이트 함수
function updateSales(realIdx, colIdx, val) {
  if(colIdx === 2 || colIdx === 3 || colIdx === 5 || colIdx === 6) salesData[realIdx][colIdx] = parseCurrency(val);
  else if(colIdx === 4 || colIdx === 7 || colIdx === 8 || colIdx === 9) salesData[realIdx][colIdx] = Number(val) / 100;
  else salesData[realIdx][colIdx] = val;
}

// 2. 편집 모드 켜기/끄기 함수
function toggleSalesEditMode() {
  isSalesEditMode = !isSalesEditMode;
  updateSalesEditUI();
  renderSales();
}

// 3. 편집 모드 UI 업데이트 함수 (여백 제거 로직 포함)
function updateSalesEditUI() {
  var editBtn = document.getElementById('editSalesBtn'); 
  var addBtn = document.getElementById('addSalesRowBtn'); 
  var resetBtn = document.getElementById('resetSalesBtn');
  var colDeletes = document.querySelectorAll('.col-delete');

  if(!editBtn || !addBtn || !resetBtn) return;

  if (isSalesEditMode) { 
      editBtn.innerText = "❌ 편집 취소"; editBtn.classList.add('edit-active'); 
      addBtn.style.display = 'inline-block'; resetBtn.style.display = 'inline-block'; 
      colDeletes.forEach(el => {
          el.style.display = el.tagName === 'COL' ? '' : 'table-cell';
          if(el.tagName === 'COL') el.style.width = '60px'; // 편집 모드 너비 복구
      });
  } 
  else { 
      editBtn.innerText = "✏️ 편집"; editBtn.classList.remove('edit-active'); 
      addBtn.style.display = 'none'; resetBtn.style.display = 'none'; 
      colDeletes.forEach(el => {
          el.style.display = 'none';
          if(el.tagName === 'COL') el.style.width = '0px'; // 기본 모드 공간 삭제
      });
  }
}

// 4. 입력 데이터 초기화 함수
function resetSalesData() {
  if(!confirm("수정 중인 내용을 모두 취소하시겠습니까?")) return;
  salesData = JSON.parse(JSON.stringify(originalSalesData));
  isSalesEditMode = false;
  updateSalesEditUI();
  renderSales();
}

function renderSales() {
  var tbody = document.getElementById('salesList'); 
  if(!tbody) return; 
  tbody.innerHTML = '';
  
  if (!salesData) salesData = [];
  var filtered = salesData.filter(row => row && row[0] === currentSalesTab);
  filtered.sort((a, b) => String(b[1]).localeCompare(String(a[1])));

  var chartData = [...filtered].reverse(); 
  if(chartData.length > 24) chartData = chartData.slice(chartData.length - 24);

  var labels = [], revenueData = [], adSpendData = [], trafficData = [], payCountData = [], convData = [];
  chartData.forEach(row => {
      labels.push(formatDate(row[1])); 
      revenueData.push(parseCurrency(row[2]) || 0);
      adSpendData.push(parseCurrency(row[3]) || 0); 
      
      let t = Number(String(row[5] || "0").replace(/,/g, '')) || 0;
      let p = Number(String(row[6] || "0").replace(/,/g, '')) || 0;
      trafficData.push(t);
      payCountData.push(p);
      convData.push(t > 0 ? (p/t*100).toFixed(2) : 0);
  });

  filtered.forEach((row, index) => {
      var realIdx = salesData.indexOf(row); 
      var rev = parseCurrency(row[2]) || 0; 
      var ad = parseCurrency(row[3]) || 0;
      
      var roasStr = String(row[4] || "0").trim();
      var isRoasPercent = roasStr.includes('%');
      var roasNum = Number(roasStr.replace(/,/g, '').replace(/%/g, '')) || 0;
      var roas = isRoasPercent ? roasNum : (roasNum < 50 && roasNum > 0 ? Math.round(roasNum * 100) : Math.round(roasNum));
      
      var traffic = Number(String(row[5] || "0").replace(/,/g, '')) || 0; 
      var payCount = Number(String(row[6] || "0").replace(/,/g, '')) || 0;
      var conv = traffic > 0 ? (payCount / traffic * 100).toFixed(2) : 0;
      var dateStr = formatDate(row[1]); 
      var mom = getGrowthRate(rev, dateStr, 'mom'); 
      var yoy = getGrowthRate(rev, dateStr, 'yoy');
      
var growthHtml = '';
      if(rev > 0 && (mom !== null || yoy !== null)) {
          growthHtml += `<div class="growth-container">`;
          
          if(mom !== null) { 
              var type = mom > 0 ? 'up' : (mom < 0 ? 'down' : 'neutral'); 
              var arrow = mom > 0 ? '▲' : (mom < 0 ? '▼' : '-'); 
              growthHtml += `<div class="growth-badge ${type}"><span class="growth-label">전월</span><span class="growth-val">${arrow} ${Math.abs(mom)}%</span></div>`; 
          }
          if(yoy !== null) { 
              var type = yoy > 0 ? 'up' : (yoy < 0 ? 'down' : 'neutral'); 
              var arrow = yoy > 0 ? '▲' : (yoy < 0 ? '▼' : '-'); 
              growthHtml += `<div class="growth-badge ${type}"><span class="growth-label">전년</span><span class="growth-val">${arrow} ${Math.abs(yoy)}%</span></div>`; 
          }
          
          growthHtml += `</div>`;
      }

      var tr = document.createElement('tr');
      var mobileRatio = parseRatio(row[7]); 
      var refundRatio = parseRatio(row[8]); 
      var winnerRatio = parseRatio(row[9]);
      var deleteBtn = isSalesEditMode ? `<button class="del-btn" onclick="deleteSalesRow(${realIdx})">삭제</button>` : '';

      var commonHtml = '';
      var specificHtml = '';

      // [핵심] 편집 모드와 일반 모드의 HTML 구조 분리 (ROAS 빨간색 강조)
      if (isSalesEditMode) {
          commonHtml = `<td><input type="text" value="${dateStr}" disabled style="text-align:center;"></td>
              <td><input type="text" value="${formatCurrency(rev)}" onchange="updateSales(${realIdx}, 2, this.value)"></td>
              <td>${growthHtml}</td> 
              <td><input type="text" value="${formatCurrency(ad)}" onchange="updateSales(${realIdx}, 3, this.value)"></td>
              <td><div class="input-group"><input type="number" value="${roas}" onchange="updateSales(${realIdx}, 4, this.value)" style="color:#dc2626; font-weight:700;"><span class="input-group-addon" style="color:#dc2626;">%</span></div></td>
              <td><input type="text" value="${formatCurrency(traffic)}" onchange="updateSales(${realIdx}, 5, this.value)"></td>
              <td><input type="text" value="${formatCurrency(payCount)}" onchange="updateSales(${realIdx}, 6, this.value)"></td>
              <td><div class="input-group"><span style="font-weight:700; color:#d97706;">${conv}</span><span style="margin-left:2px; color:#d97706; font-weight:700;">%</span></div></td>`;
              
          if(currentSalesTab === '스마트스토어') {
              specificHtml = `<td class="col-smart"><div class="input-group"><input type="number" step="0.1" value="${mobileRatio}" onchange="updateSales(${realIdx}, 7, this.value)"><span class="input-group-addon">%</span></div></td>
                  <td class="col-smart"><div class="input-group"><input type="number" step="0.1" value="${refundRatio}" onchange="updateSales(${realIdx}, 8, this.value)"><span class="input-group-addon">%</span></div></td>
                  <td class="col-coupang" style="display:none"></td>`;
          } else {
              specificHtml = `<td class="col-smart" style="display:none"></td><td class="col-smart" style="display:none"></td>
                  <td class="col-coupang"><div class="input-group"><input type="number" step="0.1" value="${winnerRatio}" onchange="updateSales(${realIdx}, 9, this.value)"><span class="input-group-addon">%</span></div></td>`;
          }
      } else {
          // 일반 모드일 때는 input 대신 일반 텍스트로 출력 (ROAS 빨간색)
          commonHtml = `<td style="font-weight:600;">${dateStr}</td>
              <td style="font-weight:800; color:#1e293b;">${formatCurrency(rev)}</td>
              <td>${growthHtml}</td> 
              <td style="font-weight:600;">${formatCurrency(ad)}</td>
              <td style="font-weight:800; color:#dc2626;">${roas} %</td>
              <td style="font-weight:600;">${formatCurrency(traffic)}</td>
              <td style="font-weight:600;">${formatCurrency(payCount)}</td>
              <td style="font-weight:800; color:#d97706;">${conv} %</td>`;
              
          if(currentSalesTab === '스마트스토어') {
              specificHtml = `<td class="col-smart" style="font-weight:600;">${mobileRatio} %</td>
                  <td class="col-smart" style="font-weight:600;">${refundRatio} %</td>
                  <td class="col-coupang" style="display:none"></td>`;
          } else {
              specificHtml = `<td class="col-smart" style="display:none"></td><td class="col-smart" style="display:none"></td>
                  <td class="col-coupang" style="font-weight:600;">${winnerRatio} %</td>`;
          }
      }

      tr.innerHTML = commonHtml + specificHtml + `<td class="col-delete" style="display:${isSalesEditMode ? '' : 'none'};">${deleteBtn}</td>`; 
      tbody.appendChild(tr);
  });
  
  drawChart(labels, revenueData, adSpendData, trafficData, payCountData, convData);
}

function addSalesRow() {
  if (!isSalesEditMode) return; 
  var nextDate = '2024-01'; var filtered = salesData.filter(row => row && row[0] === currentSalesTab); var lastIndex = -1;
  if(filtered.length > 0) {
      filtered.sort((a, b) => String(b[1]).localeCompare(String(a[1])));
      var lastDateStr = filtered[0][1]; var d = new Date(lastDateStr); d.setMonth(d.getMonth() + 1); 
      var m = d.getMonth() + 1; nextDate = d.getFullYear() + '-' + (m < 10 ? '0'+m : m);
      for(let i = salesData.length - 1; i >= 0; i--) { if(salesData[i][0] === currentSalesTab) { lastIndex = i; break; } }
  }
  var newRow = [currentSalesTab, nextDate, 0, 0, 0, 0, 0, 0, 0, 0];
  if (lastIndex !== -1) salesData.splice(lastIndex + 1, 0, newRow); else salesData.push(newRow);
  renderSales(); setTimeout(() => { document.querySelector('.table-scroll-wrapper').scrollTop = 0; }, 100);
}

function deleteSalesRow(realIdx) {
  if(!isSalesEditMode) return;
  if(!confirm("정말 이 데이터를 삭제하시겠습니까? (저장 버튼을 눌러야 반영됩니다)")) return;
  salesData.splice(realIdx, 1); renderSales();
}

function saveSalesData() {
  if (!confirm("매출 데이터를 저장하시겠습니까?")) return;
  var btn = document.getElementById('saveSalesBtn'); btn.innerText = "저장 중...";
  var header = ["몰구분", "년월", "결제금액", "집행광고비", "광고수익률(ROAS)", "유입수", "결제수", "모바일비율", "환불금액비율", "아이템위너비율"];
  var dataToSave = [header].concat(salesData);
  fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: "save", sheetName: "SalesData", data: dataToSave, password: authPassword }) })
  .then(res => res.json()).then(json => {
        if(json.status === "success") {
          alert("매출 데이터 저장 완료!"); btn.innerText = "💾 저장";
          originalSalesData = JSON.parse(JSON.stringify(salesData)); isSalesEditMode = false; updateSalesEditUI(); renderSales(); 
        } else { alert("❌ 저장 실패: " + json.message); btn.innerText = "💾 저장"; }
    });
}

function downloadSalesCSV() {
  if(salesData.length === 0) { alert("다운로드할 데이터가 없습니다."); return; }
  var csvContent = "\uFEFF";
  csvContent += "몰구분,년월,결제금액,광고비,ROAS(%),유입수,결제수,전환율(%),모바일비율(%),환불금액비율(%),위너비율(%)\n";
  salesData.forEach(row => {
      var mall = row[0]; if(mall !== currentSalesTab && currentSalesTab !== '전체') return;
      var dateStr = formatDate(row[1]); var rev = row[2] || 0; var ad = row[3] || 0; var roas = row[4] ? (Number(row[4]) * 100).toFixed(0) : 0;
      var traffic = row[5] || 0; var pay = row[6] || 0; var conv = traffic > 0 ? (pay / traffic * 100).toFixed(2) : 0;
      var mobile = row[7] ? (Number(row[7]) * 100).toFixed(1) : ""; var refund = row[8] ? (Number(row[8]) * 100).toFixed(1) : ""; var winner = row[9] ? (Number(row[9]) * 100).toFixed(1) : "";
      var csvRow = [ mall, dateStr, rev, ad, roas, traffic, pay, conv, mobile, refund, winner ]; csvContent += csvRow.join(",") + "\n";
  });
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob); var link = document.createElement("a"); var today = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url); link.setAttribute("download", `한국단열_매출데이터_${currentSalesTab}_${today}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function drawChart(labels, rev, ad, traffic, pay, conv) {
  var canvasFin = document.getElementById('salesChartFinancial');
  var canvasTraff = document.getElementById('salesChartTraffic');
  
  if(!canvasFin || !canvasTraff) { return; }

  var ctxFin = canvasFin.getContext('2d');
  if(salesChartFin) salesChartFin.destroy();
  
  salesChartFin = new Chart(ctxFin, {
      type: 'bar',
      data: {
          labels: labels,
          datasets: [
              { label: '결제금액 (좌)', data: rev, backgroundColor: 'rgba(52, 152, 219, 0.5)', yAxisID: 'y', order: 2 },
              { label: '광고비 (우)', data: ad, type: 'line', borderColor: '#e74c3c', backgroundColor: '#e74c3c', borderWidth: 2, yAxisID: 'y_ad', order: 1 }
          ]
      },
      options: {
          responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
          scales: {
              y: { type: 'linear', display: true, position: 'left', ticks: { callback: function(value) { return (value/10000).toLocaleString() + '만'; } } },
              y_ad: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: function(value) { return (value/10000).toLocaleString() + '만'; }, color: '#e74c3c' } }
          }
      }
  });

  var ctxTraff = canvasTraff.getContext('2d');
  if(salesChartTraff) salesChartTraff.destroy();
  
  var trafficDatasets = [];
  var chkPayCount = document.getElementById('chkPayCount');
  var chkConv = document.getElementById('chkConv');

  if(chkPayCount && chkPayCount.checked) { 
      trafficDatasets.push({ 
          label: '결제수 (좌)', 
          data: pay, 
          type: 'bar', 
          backgroundColor: 'rgba(46, 204, 113, 0.6)',
          yAxisID: 'y', 
          order: 2 
      }); 
  }
  if(chkConv && chkConv.checked) { 
      trafficDatasets.push({ 
          label: '전환율 (우측%)', 
          data: conv, 
          type: 'line', 
          borderColor: '#f39c12', 
          backgroundColor: '#f39c12', 
          borderWidth: 2, 
          yAxisID: 'y_rate', 
          order: 1 
      }); 
  }

  salesChartTraff = new Chart(ctxTraff, {
      type: 'bar', 
      data: { labels: labels, datasets: trafficDatasets },
      options: {
          responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
          scales: {
              y: { type: 'linear', display: true, position: 'left', ticks: { callback: function(value) { return value.toLocaleString() + '건'; } } },
              y_rate: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: function(value) { return value + '%'; }, color: '#f39c12' } }
          }
      }
  });
}

function setSalesTab(t) { 
  currentSalesTab = t; 
  document.querySelectorAll('#page-sales .tab').forEach(b => b.classList.toggle('active', b.innerText == t)); 
  
  var smartCols = document.querySelectorAll('.col-smart'); 
  var coupangCols = document.querySelectorAll('.col-coupang');
  
  if(t === '스마트스토어') { 
      smartCols.forEach(e => {
          e.style.display = e.tagName === 'COL' ? '' : 'table-cell';
          if(e.tagName === 'COL') e.style.width = '110px'; // 너비 복구
      }); 
      coupangCols.forEach(e => {
          e.style.display = 'none';
          if(e.tagName === 'COL') e.style.width = '0px'; // 너비 완전 삭제
      }); 
  } else { 
      smartCols.forEach(e => {
          e.style.display = 'none';
          if(e.tagName === 'COL') e.style.width = '0px'; // 너비 완전 삭제
      }); 
      coupangCols.forEach(e => {
          e.style.display = e.tagName === 'COL' ? '' : 'table-cell';
          if(e.tagName === 'COL') e.style.width = '110px'; // 너비 복구
      }); 
  }
  renderSales();
}

function getGrowthRate(currentVal, dateStr, type) {
  if(!currentVal) return null;
  var currDate = new Date(dateStr); var targetDate = new Date(currDate);
  if(type === 'mom') targetDate.setMonth(currDate.getMonth() - 1); else targetDate.setFullYear(currDate.getFullYear() - 1); 
  var targetStr = formatDate(targetDate);
  var found = salesData.find(row => row && row[0] === currentSalesTab && formatDate(row[1]) === targetStr);
  if(found) { var pastVal = parseCurrency(found[2]); if(pastVal > 0) return ((currentVal - pastVal) / pastVal * 100).toFixed(1); }
  return null;
}

/* ================= [3. Memo Utils & Functions] ================= */

function getParsedMemos(raw) { 
    if (!raw || raw.trim() === "") return [];
    try { var parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : [{date:"-", text:raw}]; } catch(e) { return [{date:"Old", text:raw}]; } 
}

function getNowStr() {
  var now = new Date();
  return now.getFullYear().toString().slice(2) + "." + ('0' + (now.getMonth()+1)).slice(-2) + "." + ('0' + now.getDate()).slice(-2) + " " + ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2);
}

function pushMemoToData(rowIdx, text) {
  var raw = products[rowIdx][IDX_REMARK] ? String(products[rowIdx][IDX_REMARK]) : "";
  var list = getParsedMemos(raw); list.push({ date: getNowStr(), text: text }); products[rowIdx][IDX_REMARK] = JSON.stringify(list);
}

function openRankingMemoModal(rowIdx) { 
    currentEditRowIndex = rowIdx; document.getElementById('rankingMemoModal').style.display = 'flex'; 
    document.getElementById('newMemoInput').value = ''; document.getElementById('newMemoInput').focus(); renderMemoListInModal(); 
}

function closeRankingMemoModal() { document.getElementById('rankingMemoModal').style.display = 'none'; currentEditRowIndex = -1; renderRanking(); }

function renderMemoListInModal() {
  if(currentEditRowIndex === -1) return; 
  var raw = products[currentEditRowIndex][IDX_REMARK] ? String(products[currentEditRowIndex][IDX_REMARK]) : ""; 
  var list = getParsedMemos(raw); 
  var container = document.getElementById('memoListArea'); container.innerHTML = '';
  if(list.length === 0) { container.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">등록된 메모가 없습니다.</div>'; return; }
  var displayList = [...list].reverse(); 
  displayList.forEach((memo, i) => { 
      var originalIndex = list.length - 1 - i; var div = document.createElement('div'); div.className = 'memo-list-item'; 
      div.style.cssText = "border-bottom:1px solid #eee; padding:8px 0; display:flex; justify-content:space-between; align-items:center;";
      div.innerHTML = `<div style="font-size:13px;"><div style="font-size:11px; color:#888;">${memo.date}</div><div>${memo.text}</div></div><button style="border:none; color:red; background:none; cursor:pointer;" onclick="deleteMemo(${originalIndex})">삭제</button>`; 
      container.appendChild(div); 
  });
}

function addNewMemo() { 
    if(currentEditRowIndex === -1) return; 
    var input = document.getElementById('newMemoInput'); var text = input.value.trim(); 
    if(!text) { alert("내용을 입력해주세요."); return; } pushMemoToData(currentEditRowIndex, text); input.value = ''; renderMemoListInModal(); 
}

function deleteMemo(index) { 
    if(!confirm("정말 이 메모를 삭제하시겠습니까?")) return; 
    var raw = products[currentEditRowIndex][IDX_REMARK]; var list = getParsedMemos(raw); 
    list.splice(index, 1); products[currentEditRowIndex][IDX_REMARK] = JSON.stringify(list); renderMemoListInModal(); 
}