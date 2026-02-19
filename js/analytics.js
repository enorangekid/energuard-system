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
var salesChartInstance = null; 

// 데이터 인덱스 상수
const IDX_CODE = 0; IDX_NAME = 1; IDX_PRICE = 2; IDX_CATEGORY = 3; IDX_KEYWORD = 4; IDX_REMARK = 10; IDX_CHECK = 11; 

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

// [중요] PC 로컬 테스트를 위해 GET -> POST 방식으로 변경
function loadRankingData() {
  if(!authPassword) return; // 로그인 체크
  document.getElementById('loader').style.display = 'flex';
  
  fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
          action: "read",
          sheetName: "Sheet1",
          password: authPassword
      })
  })
  .then(res => res.json())
  .then(json => {
    if(json.status === "error") { 
        alert("데이터 로드 실패: " + json.message); 
        return; 
    }
    if(json.data && json.data.length > 0) {
      if(json.data[0][0] === "상품번호") json.data.shift(); // 헤더 제거
      originalProducts = JSON.parse(JSON.stringify(json.data)); 
      products = JSON.parse(JSON.stringify(originalProducts));
    } else { 
      products = []; 
      originalProducts = []; 
    }
    renderRanking();
  })
  .catch(err => {
      console.error(err);
      alert("순위 데이터 로드 중 오류 발생");
  })
  .finally(() => document.getElementById('loader').style.display = 'none');
}

function renderRanking() {
  var tbody = document.getElementById('list');
  var groups = {};
  
  // 데이터 그룹핑
  products.forEach((p, idx) => {
    if(String(p[IDX_CATEGORY]).trim() !== currentTab) return;
    var code = p[IDX_CODE]; 
    if(!groups[code]) groups[code] = []; 
    groups[code].push({ data: p, orgIdx: idx });
  });

  if(Object.keys(groups).length === 0) { 
      tbody.innerHTML = `<tr><td colspan="12" style="padding:30px; color:#999;">'${currentTab}' 데이터가 없습니다.</td></tr>`; 
      return; 
  }

  // 정렬 로직
  var groupArray = Object.keys(groups).map(code => { return { code: code, items: groups[code] }; });
  groupArray.sort((a, b) => {
    var mainA = a.items[0].data; var mainB = b.items[0].data;
    var idxA = KEYWORD_PRIORITY_MAP[mainA[IDX_KEYWORD]] || 9999; 
    var idxB = KEYWORD_PRIORITY_MAP[mainB[IDX_KEYWORD]] || 9999;
    
    if (idxA !== idxB) return idxA - idxB; // 1순위: 키워드
    
    function getLatestRank(row) { 
        for (var k = 9; k >= 5; k--) if (row[k] && !isNaN(row[k])) return Number(row[k]); 
        return 999999; 
    }
    var rankA = getLatestRank(mainA); var rankB = getLatestRank(mainB);
    if (rankA !== rankB) return rankA - rankB; // 2순위: 최신 순위
    return String(mainA[IDX_NAME]).localeCompare(String(mainB[IDX_NAME])); // 3순위: 이름
  });

  // HTML 생성
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
      if(isAdmin) { 
          weekCells += `<td class="${hl}"><input type="text" inputmode="numeric" class="rank-input" value="${val}" onchange="updateData(${realIndex}, ${i}, this.value)"></td>`; 
      } else { 
          weekCells += `<td class="${hl}">${val}</td>`; 
      }
  }

  var rawMemo = p[IDX_REMARK] ? String(p[IDX_REMARK]) : ""; 
  var memoList = getParsedMemos(rawMemo);
  
  var remarkCell = '';
  if(isAdmin) { 
      remarkCell = `<td><button class="admin-memo-btn" onclick="openRankingMemoModal(${realIndex})">📝 (${memoList.length})</button></td>`; 
  } else {
      if(memoList.length > 0) {
          var sortedList = [...memoList].reverse();
          var popupHtml = `<ul class="popup-list">`;
          sortedList.forEach(m => { 
              var txtClass = m.text.includes("[시스템]") ? "sys-log" : ""; 
              popupHtml += `<li class="popup-item"><span class="popup-date">${m.date}</span><span class="${txtClass}">${m.text}</span></li>`; 
          });
          popupHtml += `</ul>`;
          remarkCell = `<td><div class="memo-container"><span class="memo-badge">📝 ${memoList.length}</span><div class="memo-popup">${popupHtml}</div></div></td>`;
      } else { 
          remarkCell = `<td></td>`; 
      }
  }

  var linkUrl = `https://smartstore.naver.com/hkdy/products/${p[IDX_CODE]}`;
  var isChecked = (p[IDX_CHECK] === true || p[IDX_CHECK] === "TRUE" || p[IDX_CHECK] === "true");
  var checkInput = isAdmin ? `<input type="checkbox" class="check-input" ${isChecked ? 'checked' : ''} onchange="updateData(${realIndex}, ${IDX_CHECK}, this.checked)">` : '';

  var codeDisplay, nameHtml, priceDisplay, keywordContent, deleteCell;

  if (isAdmin) {
      codeDisplay = `<input type="text" class="admin-input" value="${p[IDX_CODE]}" onchange="updateData(${realIndex}, ${IDX_CODE}, this.value)" placeholder="코드">`;
      var safeName = String(p[IDX_NAME]).replace(/"/g, '&quot;');
      nameHtml = `<div style="display:flex; align-items:center;">${checkInput}<input type="text" class="admin-input admin-input-left" value="${safeName}" onchange="updateData(${realIndex}, ${IDX_NAME}, this.value)" placeholder="상품명"></div>`;
      priceDisplay = `<input type="number" class="admin-input" value="${p[IDX_PRICE]}" onchange="updateData(${realIndex}, ${IDX_PRICE}, this.value)" placeholder="가격">`;
      var keywordInput = `<input type="text" class="admin-input-key" value="${p[IDX_KEYWORD]}" onchange="updateData(${realIndex}, ${IDX_KEYWORD}, this.value)" placeholder="키워드">`;
      
      if (!isSub) {
          keywordContent = `<div>${keywordInput}<button class="add-sub-btn" onclick="addSubKeywordRow('${p[IDX_CODE]}')" title="보조 키워드 추가">+</button></div>`;
      } else {
          keywordContent = `<div style="padding-left:15px;">ㄴ ${keywordInput}</div>`;
      }
      deleteCell = `<td><button class="del-btn" onclick="deleteProductRow(${realIndex})">삭제</button></td>`;
  } else {
      codeDisplay = isSub ? '' : `<a href="${linkUrl}" target="_blank" class="prod-link"><span class="prod-no">${p[IDX_CODE]}</span></a>`;
      var nameClass = isChecked ? 'danger-bg' : '';
      if (!isSub) { 
          nameHtml = `<div style="display:flex; align-items:center;">${checkInput}<a href="${linkUrl}" target="_blank" class="prod-link" style="flex:1;"><span class="prod-name ${nameClass}" title="${p[IDX_NAME]}">${p[IDX_NAME]}</span></a></div>`; 
      } else {
          nameHtml = `<div style="display:flex; align-items:center;">${checkInput}<span class="prod-name ${nameClass}" style="flex:1;">${p[IDX_NAME]}</span></div>`;
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
            <td style="text-align:left;">${nameHtml}</td>
            <td>${priceDisplay}</td>
            <td class="${keywordClass}">${keywordContent}</td>
            <td>${diffHtml}</td>
            ${weekCells}
            ${remarkCell}
            ${deleteCell}
          </tr>`;
}

// 탭 및 토글 기능
function toggleEditMode() {
  var btn = document.getElementById('editModeBtn'); 
  var panel = document.getElementById('adminPanel'); 
  var masterBtn = document.getElementById('masterCheck'); 
  var adminCols = document.querySelectorAll('.admin-col');

  if (isAdmin) {
      isAdmin = false;
      btn.innerText = "✏️ 편집 모드";
      btn.classList.remove('btn-active');
      panel.style.display = 'none'; 
      if(masterBtn) masterBtn.style.display = 'none'; 
      adminCols.forEach(col => col.style.display = 'none');
      products = JSON.parse(JSON.stringify(originalProducts));
      renderRanking();
  } else {
      isAdmin = true;
      btn.innerText = "❌ 편집 종료";
      btn.classList.add('btn-active');
      panel.style.display = 'flex'; 
      if(masterBtn) masterBtn.style.display = 'inline-block'; 
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

// 행 추가/삭제 기능
function addEmptyRow() {
  if(!isAdmin) { alert("편집 모드에서만 추가할 수 있습니다."); return; }
  var tempCode = "NEW_" + Date.now();
  var newRow = [ tempCode, "", "", currentTab, "", "", "", "", "", "", "[]", false ];
  products.push(newRow);
  alert("새 상품(메인) 행이 추가되었습니다. 맨 아래를 확인하세요.");
  renderRanking();
  setTimeout(() => { document.querySelector('#page-ranking').scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 100);
}

function addSubKeywordRow(parentCode) {
  if(!isAdmin) return;
  var parent = products.find(p => p[IDX_CODE] == parentCode);
  if (!parent) return;
  var newSubRow = [ parent[IDX_CODE], parent[IDX_NAME], parent[IDX_PRICE], parent[IDX_CATEGORY], "", "", "", "", "", "", "[]", false ];
  let lastIndex = -1;
  for (let i = products.length - 1; i >= 0; i--) {
      if (products[i][IDX_CODE] == parentCode) { lastIndex = i; break; }
  }
  if (lastIndex !== -1) products.splice(lastIndex + 1, 0, newSubRow);
  else products.push(newSubRow);
  renderRanking();
}

function deleteProductRow(realIndex) {
  if(!confirm("정말 이 행을 삭제하시겠습니까? (저장 버튼을 눌러야 완전히 반영됩니다)")) return;
  products.splice(realIndex, 1);
  renderRanking();
}

// 저장/초기화/다운로드
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
          alert("✅ 저장 완료되었습니다!"); 
          originalProducts = JSON.parse(JSON.stringify(products));
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
  var csvContent = "\uFEFF"; csvContent += "상품번호,상품명,가격,카테고리,키워드,1주차,2주차,3주차,4주차,5주차,비고,중요체크\n";
  products.forEach(p => {
    var rawMemo = p[IDX_REMARK] ? String(p[IDX_REMARK]) : ""; var memoList = getParsedMemos(rawMemo); var memoText = memoList.map(m => `[${m.date}] ${m.text}`).join(" / ");
    var row = [ p[IDX_CODE], `"${String(p[IDX_NAME]).replace(/"/g, '""')}"`, p[IDX_PRICE], p[IDX_CATEGORY], p[IDX_KEYWORD], p[5], p[6], p[7], p[8], p[9], `"${memoText.replace(/"/g, '""')}"`, p[IDX_CHECK] ? "TRUE" : "FALSE" ];
    csvContent += row.join(",") + "\n";
  });
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); var url = URL.createObjectURL(blob); var link = document.createElement("a"); var today = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url); link.setAttribute("download", `한국단열_순위데이터_${today}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

/* ================= [2. Sales Functions] ================= */

// [중요] PC 로컬 테스트를 위해 GET -> POST 방식으로 변경
function loadSalesData() {
  if(!authPassword) return;
  document.getElementById('loader').style.display = 'flex';
  
  fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
          action: "read",
          sheetName: "SalesData",
          password: authPassword
      })
  })
  .then(res => res.json())
  .then(json => {
      if (json.status === "error") {
          alert("데이터 로드 실패: " + json.message);
          return;
      }
      if(json.data && json.data.length > 0) {
          if(json.data[0][0] === "몰구분") json.data.shift();
          originalSalesData = JSON.parse(JSON.stringify(json.data));
          salesData = JSON.parse(JSON.stringify(originalSalesData));
      } else { 
          salesData = []; 
          originalSalesData = [];
      }
      isSalesEditMode = false;
      updateSalesEditUI();
      renderSales();
  })
  .catch(err => {
      console.error(err);
      alert("매출 데이터 로드 중 오류 발생");
  })
  .finally(() => document.getElementById('loader').style.display = 'none');
}

function renderSales() {
  var tbody = document.getElementById('salesList');
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
      trafficData.push(Number(row[5]) || 0);
      payCountData.push(Number(row[6]) || 0);
      let t = Number(row[5]) || 0; let p = Number(row[6]) || 0;
      convData.push(t > 0 ? (p/t*100).toFixed(2) : 0);
  });

  filtered.forEach((row, index) => {
      var realIdx = salesData.indexOf(row); 
      var disabledAttr = isSalesEditMode ? '' : 'disabled';
      var rev = parseCurrency(row[2]) || 0;
      var ad = parseCurrency(row[3]) || 0;
      var rawRoas = Number(row[4]);
      var roas = rawRoas < 50 ? Math.round(rawRoas * 100) : Math.round(rawRoas);
      var traffic = Number(row[5]) || 0;
      var payCount = Number(row[6]) || 0;
      var conv = traffic > 0 ? (payCount / traffic * 100).toFixed(2) : 0;
      var dateStr = formatDate(row[1]);
      var mom = getGrowthRate(rev, dateStr, 'mom');
      var yoy = getGrowthRate(rev, dateStr, 'yoy');
      
      var growthHtml = '';
      if(rev > 0 && (mom !== null || yoy !== null)) {
          growthHtml += `<span class="growth-text">`;
          if(mom !== null) {
              var colorClass = mom > 0 ? 'growth-up' : (mom < 0 ? 'growth-down' : 'growth-neutral');
              var arrow = mom > 0 ? '▲' : (mom < 0 ? '▼' : '-');
              growthHtml += `<span class="${colorClass}">${arrow} ${Math.abs(mom)}% (전월)</span> `;
          }
          if(yoy !== null) {
              var colorClass = yoy > 0 ? 'growth-up' : (yoy < 0 ? 'growth-down' : 'growth-neutral');
              var arrow = yoy > 0 ? '▲' : (yoy < 0 ? '▼' : '-');
              growthHtml += `<br><span class="${colorClass}">${arrow} ${Math.abs(yoy)}% (전년)</span>`;
          }
          growthHtml += `</span>`;
      }

      var tr = document.createElement('tr');
      var mobileRatio = row[7] ? (Number(row[7]) * 100).toFixed(1) : "";
      var refundRatio = row[8] ? (Number(row[8]) * 100).toFixed(1) : "";
      var winnerRatio = row[9] ? (Number(row[9]) * 100).toFixed(1) : "";
      var deleteBtn = isSalesEditMode ? `<button class="del-btn" onclick="deleteSalesRow(${realIdx})">삭제</button>` : '';

      var commonHtml = `<td><input type="text" value="${dateStr}" disabled></td>
          <td><input type="text" value="${formatCurrency(rev)}" onchange="updateSales(${realIdx}, 2, this.value)" ${disabledAttr}>${growthHtml}</td>
          <td><input type="text" value="${formatCurrency(ad)}" onchange="updateSales(${realIdx}, 3, this.value)" ${disabledAttr}></td>
          <td><div class="input-group"><input type="number" value="${roas}" onchange="updateSales(${realIdx}, 4, this.value)" ${disabledAttr}><span class="input-group-addon">%</span></div></td>
          <td><input type="number" value="${traffic}" onchange="updateSales(${realIdx}, 5, this.value)" ${disabledAttr}></td>
          <td><input type="number" value="${payCount}" onchange="updateSales(${realIdx}, 6, this.value)" ${disabledAttr}></td>
          <td><div class="input-group"><span style="font-weight:bold;">${conv}</span><span style="margin-left:2px;">%</span></div></td>`;

      var specificHtml = '';
      if(currentSalesTab === '스마트스토어') {
          specificHtml = `<td class="col-smart"><div class="input-group"><input type="number" step="0.1" value="${mobileRatio}" onchange="updateSales(${realIdx}, 7, this.value)" ${disabledAttr}><span class="input-group-addon">%</span></div></td>
              <td class="col-smart"><div class="input-group"><input type="number" step="0.1" value="${refundRatio}" onchange="updateSales(${realIdx}, 8, this.value)" ${disabledAttr}><span class="input-group-addon">%</span></div></td>
              <td class="col-coupang" style="display:none"></td>`;
      } else {
          specificHtml = `<td class="col-smart" style="display:none"></td><td class="col-smart" style="display:none"></td>
              <td class="col-coupang"><div class="input-group"><input type="number" step="0.1" value="${winnerRatio}" onchange="updateSales(${realIdx}, 9, this.value)" ${disabledAttr}><span class="input-group-addon">%</span></div></td>`;
      }
      tr.innerHTML = commonHtml + specificHtml + `<td>${deleteBtn}</td>`;
      tbody.appendChild(tr);
  });
  drawChart(labels, revenueData, adSpendData, trafficData, payCountData, convData);
}

function updateSales(realIdx, colIdx, val) {
  if(colIdx === 2 || colIdx === 3) salesData[realIdx][colIdx] = parseCurrency(val);
  else if(colIdx === 4 || colIdx === 7 || colIdx === 8 || colIdx === 9) salesData[realIdx][colIdx] = Number(val) / 100;
  else salesData[realIdx][colIdx] = val;
}

function toggleSalesEditMode() {
  if (isSalesEditMode) {
      if (confirm("편집 모드를 종료하시겠습니까? 저장하지 않은 내용은 원래대로 돌아갑니다.")) {
          isSalesEditMode = false;
          salesData = JSON.parse(JSON.stringify(originalSalesData));
          renderSales();
      }
  } else {
      isSalesEditMode = true;
      renderSales();
  }
  updateSalesEditUI();
}

function resetSalesData() {
  if(!confirm("편집 중인 내용을 모두 취소하고 처음 상태로 되돌리시겠습니까?")) return;
  salesData = JSON.parse(JSON.stringify(originalSalesData));
  renderSales();
}

function updateSalesEditUI() {
  var editBtn = document.getElementById('editSalesBtn');
  var addBtn = document.getElementById('addSalesRowBtn');
  var resetBtn = document.getElementById('resetSalesBtn');
  if (isSalesEditMode) {
      editBtn.innerText = "❌ 편집 취소"; editBtn.classList.add('edit-active');
      addBtn.style.display = 'inline-block'; resetBtn.style.display = 'inline-block';
  } else {
      editBtn.innerText = "✏️ 편집"; editBtn.classList.remove('edit-active');
      addBtn.style.display = 'none'; resetBtn.style.display = 'none';
  }
}

function addSalesRow() {
  if (!isSalesEditMode) return; 
  var nextDate = '2024-01';
  var filtered = salesData.filter(row => row[0] === currentSalesTab);
  var lastIndex = -1;
  if(filtered.length > 0) {
      filtered.sort((a, b) => String(b[1]).localeCompare(String(a[1])));
      var lastDateStr = filtered[0][1];
      var d = new Date(lastDateStr); d.setMonth(d.getMonth() + 1); 
      var m = d.getMonth() + 1; nextDate = d.getFullYear() + '-' + (m < 10 ? '0'+m : m);
      for(let i = salesData.length - 1; i >= 0; i--) { if(salesData[i][0] === currentSalesTab) { lastIndex = i; break; } }
  }
  var newRow = [currentSalesTab, nextDate, 0, 0, 0, 0, 0, 0, 0, 0];
  if (lastIndex !== -1) salesData.splice(lastIndex + 1, 0, newRow); else salesData.push(newRow);
  renderSales(); 
  setTimeout(() => { document.querySelector('#salesView .table-scroll-wrapper').scrollTop = 0; }, 100);
}

function deleteSalesRow(realIdx) {
  if(!isSalesEditMode) return;
  if(!confirm("정말 이 데이터를 삭제하시겠습니까? (저장 버튼을 눌러야 반영됩니다)")) return;
  salesData.splice(realIdx, 1);
  renderSales();
}

function saveSalesData() {
  if (!confirm("매출 데이터를 저장하시겠습니까?")) return;
  var btn = document.getElementById('saveSalesBtn'); 
  btn.innerText = "저장 중...";
  var header = ["몰구분", "년월", "결제금액", "집행광고비", "광고수익률(ROAS)", "유입수", "결제수", "모바일비율", "환불금액비율", "아이템위너비율"];
  var dataToSave = [header].concat(salesData);
  fetch(SCRIPT_URL, { 
      method: 'POST', 
      body: JSON.stringify({ action: "save", sheetName: "SalesData", data: dataToSave, password: authPassword }) 
  }).then(res => res.json()).then(json => {
        if(json.status === "success") {
          alert("매출 데이터 저장 완료!");
          btn.innerText = "💾 매출 데이터 저장";
          originalSalesData = JSON.parse(JSON.stringify(salesData));
          isSalesEditMode = false;
          updateSalesEditUI();
          renderSales(); 
        } else { alert("❌ 저장 실패: " + json.message); btn.innerText = "💾 매출 데이터 저장"; }
    });
}

function downloadSalesCSV() {
  if(salesData.length === 0) { alert("다운로드할 데이터가 없습니다."); return; }
  var csvContent = "\uFEFF";
  csvContent += "몰구분,년월,결제금액,광고비,ROAS(%),유입수,결제수,전환율(%),모바일비율(%),환불금액비율(%),위너비율(%)\n";
  salesData.forEach(row => {
      var mall = row[0];
      if(mall !== currentSalesTab && currentSalesTab !== '전체') return;
      var dateStr = formatDate(row[1]);
      var rev = row[2] || 0; var ad = row[3] || 0;
      var roas = row[4] ? (Number(row[4]) * 100).toFixed(0) : 0;
      var traffic = row[5] || 0; var pay = row[6] || 0;
      var conv = traffic > 0 ? (pay / traffic * 100).toFixed(2) : 0;
      var mobile = row[7] ? (Number(row[7]) * 100).toFixed(1) : "";
      var refund = row[8] ? (Number(row[8]) * 100).toFixed(1) : "";
      var winner = row[9] ? (Number(row[9]) * 100).toFixed(1) : "";
      var csvRow = [ mall, dateStr, rev, ad, roas, traffic, pay, conv, mobile, refund, winner ];
      csvContent += csvRow.join(",") + "\n";
  });
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob); var link = document.createElement("a"); var today = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url); link.setAttribute("download", `한국단열_매출데이터_${currentSalesTab}_${today}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function drawChart(labels, rev, ad, traffic, pay, conv) {
  var ctx = document.getElementById('salesChart').getContext('2d');
  if(salesChartInstance) salesChartInstance.destroy();
  var datasets = [
      { label: '결제금액 (좌)', data: rev, backgroundColor: 'rgba(52, 152, 219, 0.5)', yAxisID: 'y', order: 10 },
      { label: '광고비 (우)', data: ad, type: 'line', borderColor: '#e74c3c', backgroundColor: '#e74c3c', borderWidth: 2, yAxisID: 'y_ad', order: 1 }
  ];
  if(document.getElementById('chkTraffic').checked) { datasets.push({ label: '유입수 (우)', data: traffic, type: 'line', borderColor: '#2ecc71', backgroundColor: '#2ecc71', yAxisID: 'y_count', order: 2 }); }
  if(document.getElementById('chkPayCount').checked) { datasets.push({ label: '결제수 (우)', data: pay, type: 'line', borderColor: '#9b59b6', backgroundColor: '#9b59b6', yAxisID: 'y_pay', order: 3 }); }
  if(document.getElementById('chkConv').checked) { datasets.push({ label: '전환율 (우측%)', data: conv, type: 'line', borderColor: '#f39c12', backgroundColor: '#f39c12', yAxisID: 'y_rate', order: 4 }); }

  salesChartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels: labels, datasets: datasets },
      options: {
          responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
          scales: {
              y: { type: 'linear', display: true, position: 'left', title: { display: true, text: '결제금액 (원)' }, ticks: { callback: function(value) { return value.toLocaleString(); } } },
              y_ad: { type: 'linear', display: true, position: 'right', title: { display: true, text: '광고비 (원)' }, grid: { drawOnChartArea: false }, ticks: { callback: function(value) { return value.toLocaleString(); }, color: '#e74c3c' } },
              y_count: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, display: (ctx) => document.getElementById('chkTraffic').checked },
              y_pay: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, display: (ctx) => document.getElementById('chkPayCount').checked },
              y_rate: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, display: (ctx) => document.getElementById('chkConv').checked }
          }
      }
  });
}

function setSalesTab(t) { 
  currentSalesTab = t; 
  document.querySelectorAll('#page-sales .tab').forEach(b => b.classList.toggle('active', b.innerText == t)); 
  var smartCols = document.querySelectorAll('.col-smart');
  var coupangCols = document.querySelectorAll('.col-coupang');
  if(t === '스마트스토어') { smartCols.forEach(e => e.style.display = 'table-cell'); coupangCols.forEach(e => e.style.display = 'none'); } 
  else { smartCols.forEach(e => e.style.display = 'none'); coupangCols.forEach(e => e.style.display = 'table-cell'); }
  renderSales();
}

function getGrowthRate(currentVal, dateStr, type) {
  if(!currentVal) return null;
  var currDate = new Date(dateStr);
  var targetDate = new Date(currDate);
  if(type === 'mom') targetDate.setMonth(currDate.getMonth() - 1); 
  else targetDate.setFullYear(currDate.getFullYear() - 1); 
  var targetStr = formatDate(targetDate);
  var found = salesData.find(row => row[0] === currentSalesTab && formatDate(row[1]) === targetStr);
  if(found) {
      var pastVal = parseCurrency(found[2]); 
      if(pastVal > 0) return ((currentVal - pastVal) / pastVal * 100).toFixed(1);
  }
  return null;
}

/* ================= [3. Memo Utils & Functions] ================= */

function getParsedMemos(raw) { 
    if (!raw || raw.trim() === "") return [];
    try { 
        var parsed = JSON.parse(raw); 
        return Array.isArray(parsed) ? parsed : [{date:"-", text:raw}]; 
    } catch(e) { return [{date:"Old", text:raw}]; } 
}

function getNowStr() {
  var now = new Date();
  return now.getFullYear().toString().slice(2) + "." + ('0' + (now.getMonth()+1)).slice(-2) + "." + ('0' + now.getDate()).slice(-2) + " " + ('0' + now.getHours()).slice(-2) + ":" + ('0' + now.getMinutes()).slice(-2);
}

function pushMemoToData(rowIdx, text) {
  var raw = products[rowIdx][IDX_REMARK] ? String(products[rowIdx][IDX_REMARK]) : "";
  var list = getParsedMemos(raw);
  list.push({ date: getNowStr(), text: text });
  products[rowIdx][IDX_REMARK] = JSON.stringify(list);
}

function openRankingMemoModal(rowIdx) { 
    currentEditRowIndex = rowIdx; 
    document.getElementById('rankingMemoModal').style.display = 'flex'; 
    document.getElementById('newMemoInput').value = ''; 
    document.getElementById('newMemoInput').focus(); 
    renderMemoListInModal(); 
}

function closeRankingMemoModal() { 
    document.getElementById('rankingMemoModal').style.display = 'none'; 
    currentEditRowIndex = -1; 
    renderRanking(); 
}

function renderMemoListInModal() {
  if(currentEditRowIndex === -1) return; 
  var raw = products[currentEditRowIndex][IDX_REMARK] ? String(products[currentEditRowIndex][IDX_REMARK]) : ""; 
  var list = getParsedMemos(raw); 
  var container = document.getElementById('memoListArea'); 
  container.innerHTML = '';
  if(list.length === 0) { container.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">등록된 메모가 없습니다.</div>'; return; }
  var displayList = [...list].reverse(); 
  displayList.forEach((memo, i) => { 
      var originalIndex = list.length - 1 - i; 
      var div = document.createElement('div'); 
      div.className = 'memo-list-item'; 
      div.style.cssText = "border-bottom:1px solid #eee; padding:8px 0; display:flex; justify-content:space-between; align-items:center;";
      div.innerHTML = `<div style="font-size:13px;"><div style="font-size:11px; color:#888;">${memo.date}</div><div>${memo.text}</div></div><button style="border:none; color:red; background:none; cursor:pointer;" onclick="deleteMemo(${originalIndex})">삭제</button>`; 
      container.appendChild(div); 
  });
}

function addNewMemo() { 
    if(currentEditRowIndex === -1) return; 
    var input = document.getElementById('newMemoInput'); 
    var text = input.value.trim(); 
    if(!text) { alert("내용을 입력해주세요."); return; } 
    pushMemoToData(currentEditRowIndex, text); 
    input.value = ''; 
    renderMemoListInModal(); 
}

function deleteMemo(index) { 
    if(!confirm("정말 이 메모를 삭제하시겠습니까?")) return; 
    var raw = products[currentEditRowIndex][IDX_REMARK]; 
    var list = getParsedMemos(raw); 
    list.splice(index, 1); 
    products[currentEditRowIndex][IDX_REMARK] = JSON.stringify(list); 
    renderMemoListInModal(); 
}
