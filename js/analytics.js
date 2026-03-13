/* ================= [Ranking & Sales Logic] ================= */
// 전역 변수 설정
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

// [NEW] 순위 관리용 날짜 변수
let currentRankYear = new Date().getFullYear();
let currentRankMonth = new Date().getMonth() + 1;

// ✅ IDX_*, KEYWORD_PRIORITY_MAP, TAB_MAIN_KEYWORD 는 config.js에서 전역 선언됨
// (중복 선언 제거 — config.js 참고)

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 랭킹 월 선택기 초기화
    const picker = document.getElementById('rankingMonthPicker');
    if(picker) {
        const y = new Date().getFullYear();
        const m = String(new Date().getMonth() + 1).padStart(2, '0');
        picker.value = `${y}-${m}`;
    }

    // TOP5 데이터는 확장프로그램에서 DB에 직접 저장됩니다.
});

/* ================= [1. Ranking Functions (Updated)] ================= */

// [NEW] 월 변경 시 호출되는 함수
window.changeRankingMonth = function() {
    const picker = document.getElementById('rankingMonthPicker');
    if(!picker || !picker.value) return;
    
    const parts = picker.value.split('-');
    currentRankYear = parseInt(parts[0]);
    currentRankMonth = parseInt(parts[1]);
    
    // 변경된 월의 데이터 로드
    loadRankingData();
}

// 🚀 [Updated] 검색 순위 불러오기 (히스토리 + 비교 로직 포함)

window.loadRankingData = async function() {
    if (!supabaseClient) return;
    document.getElementById('loader').style.display = 'flex';

    try {
        // 1. 현재 월 기록 조회
        const { data: currentHistory, error: currErr } = await supabaseClient
            .from('ranking_history')
            .select('*')
            .eq('year', currentRankYear)
            .eq('month', currentRankMonth);

        if (currErr) throw currErr;

        // 2. 지난달 계산
        let prevYear = currentRankYear;
        let prevMonth = currentRankMonth - 1;
        if (prevMonth === 0) { prevMonth = 12; prevYear--; }

        // 3. ★ 중요: 지난달 데이터를 모든 주차(w1~w5)와 keyword를 포함하여 조회
        const { data: prevHistory, error: prevErr } = await supabaseClient
            .from('ranking_history')
            .select('product_code, keyword, rank_w1, rank_w2, rank_w3, rank_w4, rank_w5')
            .eq('year', prevYear)
            .eq('month', prevMonth);

        // 4. 지난달의 '가장 마지막으로 기록된 순위'를 매핑
        const prevMap = {};
        if (prevHistory) {
            prevHistory.forEach(p => {
                // 5주차부터 1주차까지 역순으로 검사하여 데이터가 있는 가장 최근 주차를 찾음
                let lastRank = p.rank_w5 || p.rank_w4 || p.rank_w3 || p.rank_w2 || p.rank_w1 || null;
                prevMap[String(p.product_code) + '_' + String(p.keyword || '')] = lastRank;
            });
        }

        // 5. 상품 마스터 정보 조회
        const { data: masterData, error: masterErr } = await supabaseClient
            .from('product_rankings')
            .select('*');
        if (masterErr) throw masterErr;

        // 6. 데이터 병합 (마스터 + 현재월 히스토리 + 전월 마지막 순위)
        products = masterData.map(m => {
            const history = currentHistory.find(h => String(h.product_code) === String(m.code) && String(h.keyword) === String(m.keyword)) || {};
            const lastMonthRank = prevMap[String(m.code) + '_' + String(m.keyword || '')]; 

            // [수정 포인트 1] 배열 크기를 15로 설정 (index 14를 지난달 순위 저장용으로 사용)
            let row = new Array(17).fill("");
            
            row[IDX_CODE] = m.code; row[IDX_NAME] = m.name; row[IDX_PRICE] = m.price; 
            row[IDX_CATEGORY] = m.category_tab; row[IDX_KEYWORD] = m.keyword;
            row[5] = history.rank_w1 || ""; row[6] = history.rank_w2 || "";
            row[7] = history.rank_w3 || ""; row[8] = history.rank_w4 || "";
            row[9] = history.rank_w5 || "";
            row[IDX_REMARK] = m.memo || "[]";
            row[IDX_CHECK] = m.is_checked === true;
            row[IDX_IMAGE] = m.image_url;
            row[IDX_DETAIL_CAT] = m.detail_category;
            row[IDX_TYPE] = m.product_type || 'mine';
            row[IDX_COMPANY] = m.company_name || '';

            // [수정 포인트 2] 지난달 마지막 순위를 14번 인덱스에 저장 (JSON 직렬화 시 보존됨)
            row[14] = lastMonthRank; 
            
            return row;
        });

        originalProducts = JSON.parse(JSON.stringify(products));
        renderRanking();

    } catch (e) {
        console.error("랭킹 데이터 로드 오류:", e);
    } finally {
        document.getElementById('loader').style.display = 'none';
    }
};

function renderRanking() {
  var tbodyMine = document.getElementById('list-mine');
  var tbodyWatch = document.getElementById('list-watch');
  if(!tbodyMine || !tbodyWatch) return;

  var groups = {};
  products.forEach((p, idx) => {
    if(String(p[IDX_CATEGORY]).trim() !== currentTab) return;
    var code = p[IDX_CODE]; 
    if(!groups[code]) groups[code] = []; 
    groups[code].push({ data: p, orgIdx: idx });
  });

  if(Object.keys(groups).length === 0) { 
      tbodyMine.innerHTML = `<tr><td colspan="13" style="padding:40px; color:#999;">'${currentTab}' 데이터가 없습니다.</td></tr>`;
      tbodyWatch.innerHTML = '';
      return; 
  }

  function getMainIdx(items) {
    var tabMain = TAB_MAIN_KEYWORD[currentTab];
    if (tabMain) {
      for (var i = 0; i < items.length; i++) {
        if (String(items[i].data[IDX_KEYWORD] || '').trim() === tabMain) return i;
      }
    }
    var bestIdx = 0, bestPriority = 9999;
    items.forEach(function(item, i) {
      var key = String(item.data[IDX_KEYWORD] || '').trim();
      var p = KEYWORD_PRIORITY_MAP[key];
      if (p === undefined) p = 9999;
      if (p < bestPriority) { bestPriority = p; bestIdx = i; }
    });
    return bestIdx;
  }

  function getLatestRank(row) {
    for (var k = 9; k >= 5; k--) if (row[k] && !isNaN(row[k])) return Number(row[k]);
    return 999999;
  }

  var groupArray = Object.keys(groups).map(function(code) {
    return { code: code, items: groups[code] };
  });

  groupArray.sort(function(a, b) {
    var mainA = a.items[getMainIdx(a.items)].data;
    var mainB = b.items[getMainIdx(b.items)].data;

    var keyA = String(mainA[IDX_KEYWORD] || '').trim();
    var keyB = String(mainB[IDX_KEYWORD] || '').trim();
    var idxA = KEYWORD_PRIORITY_MAP[keyA]; if (idxA === undefined) idxA = 9999;
    var idxB = KEYWORD_PRIORITY_MAP[keyB]; if (idxB === undefined) idxB = 9999;
    if (idxA !== idxB) return idxA - idxB;

    var rankA = getLatestRank(mainA);
    var rankB = getLatestRank(mainB);
    if (rankA !== rankB) return rankA - rankB;
    return String(mainA[IDX_NAME]).localeCompare(String(mainB[IDX_NAME]));
  });

  // 내 상품 / 관찰 상품 분리
  var mineGroups = groupArray.filter(g => (g.items[0].data[IDX_TYPE] || 'mine') === 'mine');
  var watchGroups = groupArray.filter(g => (g.items[0].data[IDX_TYPE] || 'mine') === 'watch');

  function buildGroupRows(groups) {
    var buf = [];
    groups.forEach(function(group) {
      var items = group.items;
      var mainIdx = getMainIdx(items);
      var subs = items.filter(function(_, i) { return i !== mainIdx; });
      // 현재 그룹의 메인 키워드 기준으로 KW_TREE에서 subs 순서 찾기
      var mainKeyword = String(items[mainIdx].data[IDX_KEYWORD] || '').trim();
      var treeEntry = KW_TREE.find(function(e) { return e.main === mainKeyword; });
      subs.sort(function(a, b) {
        var ka = String(a.data[IDX_KEYWORD] || '').trim();
        var kb = String(b.data[IDX_KEYWORD] || '').trim();
        var oa = treeEntry ? treeEntry.subs.indexOf(ka) : -1;
        var ob = treeEntry ? treeEntry.subs.indexOf(kb) : -1;
        if (oa === -1) oa = 9999;
        if (ob === -1) ob = 9999;
        return oa - ob;
      });
      var reordered = [items[mainIdx]].concat(subs);
      var main = reordered[0];
      var hasSub = reordered.length > 1;
      var btnHtml = hasSub ? `<span class="toggle-btn" onclick="toggleSub('${group.code}')">+</span>` : '';
      buf.push(createRowHtml(main.data, main.orgIdx, 'main-row', btnHtml, group.code, false));
      if (hasSub) {
        for (var i = 1; i < reordered.length; i++) {
          var sub = reordered[i];
          buf.push(createRowHtml(sub.data, sub.orgIdx, `sub-row sub-${group.code}`, '', group.code, true));
        }
      }
      // 행 간 여백
      buf.push('<tr class="rk-spacer-row"><td colspan="13"></td></tr>');
    });
    return buf;
  }

  // ── 내 상품 tbody 채우기 ──
  var mineRows = buildGroupRows(mineGroups);
  var mineSectionRow = '<tr class="rk-section-row rk-mine-row"><td colspan="13">' +
    '내 상품 <span class="rk-section-count">' + mineGroups.length + '개</span></td></tr>';
  var SPACER = '<tr class="rk-spacer-row"><td colspan="13"></td></tr>';
  tbodyMine.innerHTML = SPACER + mineSectionRow + SPACER + (mineRows.length > 0 ? mineRows.join('')
    : '<tr><td colspan="13" style="padding:20px; color:#999; text-align:center;">내 상품이 없습니다.</td></tr>');

  // ── 관찰 상품 tbody 채우기 ──
  var watchRows = buildGroupRows(watchGroups);
  if (watchRows.length > 0) {
    var watchSectionRow = '<tr class="rk-section-row rk-watch-row"><td colspan="13">' +
      '관찰 상품 <span class="rk-section-count">' + watchGroups.length + '개</span></td></tr>';
    tbodyWatch.innerHTML = watchSectionRow + SPACER + watchRows.join('');
    tbodyWatch.style.display = '';
  } else {
    tbodyWatch.innerHTML = '';
    tbodyWatch.style.display = 'none';
  }
  // watchSection은 더미로만 사용
  var watchSection = document.getElementById('watchSection');
  if (watchSection) watchSection.style.display = 'none';
  
}

// [Updated] 비교 로직 개선 (1주차 vs 전월 마지막 주차)
function createRowHtml(p, realIndex, className, btnHtml, code, isSub = false) {
  var isWatch = (p[IDX_TYPE] || 'mine') === 'watch';
  if (isWatch) className += ' watch-row';
  var ranks = [p[5], p[6], p[7], p[8], p[9]]; // index 5~9 maps to rank_w1~w5
  var diffHtml = '<span class="dash">-</span>';
  
  var currentVal = null;
  var prevVal = null;

  // 가장 최신 데이터 찾기 (뒤에서부터)
  for(let i=4; i>=0; i--) { 
      if(ranks[i] !== "" && ranks[i] != null) { 
          currentVal = Number(ranks[i]);
          
          if (i > 0 && ranks[i-1]) {
               // 같은 달 내 전주 비교
              prevVal = Number(ranks[i-1]);
          } else if (i === 0) {
              // ★ 1주차인 경우 -> 지난달 데이터(index 14)와 비교
              // [수정 포인트 3] 14번 인덱스에 저장된 지난달 마지막 순위를 참조
              if (p[14] !== "" && p[14] != null) {
                  prevVal = Number(p[14]);
              }
          }
          break; 
      } 
  }

  // 변동폭 계산 및 HTML 생성
  if (currentVal !== null && prevVal !== null) {
      var d = prevVal - currentVal; // (과거 - 현재)가 양수면 순위 상승
      if (d > 0) diffHtml = `<span class="up">▲${d}</span>`;
      else if (d < 0) diffHtml = `<span class="down">▼${Math.abs(d)}</span>`;
      else diffHtml = `<span class="dash">-</span>`;
  }

  var weekCells = '';
  for(var i=5; i<=9; i++) {
      var val = p[i] ? p[i] : ''; 
      var hl = '';
      // 마지막 입력된 값이면 하이라이트
      if (currentVal && val == currentVal) hl = 'latest-rank';

      weekCells += `<td class="${hl}">${val}</td>`;
  }

  var rawMemo = p[IDX_REMARK] ? String(p[IDX_REMARK]) : ""; 
  var memoList = getParsedMemos(rawMemo);
  var remarkCell = '';
      if(memoList.length > 0) {
          var sortedList = [...memoList].reverse();
          var popupHtml = '';
          sortedList.forEach((m, i) => { 
              var txtClass = m.text.includes("[시스템]") ? "sys-log" : "";
              var border = i < sortedList.length - 1 ? 'border-bottom:1px solid #555;' : '';
              var dateStr = m.date ? `<div style="font-size:10px;color:#f59e0b;font-weight:600;margin-bottom:4px;">${m.date}</div>` : '';
              popupHtml += `<div style="padding:7px 0;${border}">${dateStr}<div style="font-size:12px;color:#f1f5f9;line-height:1.6;word-break:break-all;">${m.text}</div></div>`; 
          });
          remarkCell = `<td><div class="memo-container"><span class="memo-badge">📝 ${memoList.length}</span><div class="memo-popup">${popupHtml}</div></div></td>`;
      } else { remarkCell = `<td></td>`; }

  // ✅ 관찰 상품: 업체명으로 스토어 ID를 찾아 스마트스토어 상품 URL 생성
  //    매핑에 없는 업체는 키워드 검색 URL로 fallback
  var linkUrl;
  if (isWatch) {
    const companyName = p[IDX_COMPANY] ? String(p[IDX_COMPANY]).trim() : '';
    const storeId = COMPETITOR_STORE_MAP[companyName];
    linkUrl = storeId
      ? `https://smartstore.naver.com/${storeId}/products/${p[IDX_CODE]}`
      : `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(p[IDX_KEYWORD])}`;
  } else {
    linkUrl = `https://smartstore.naver.com/hkdy/products/${p[IDX_CODE]}`;
  }
  var isChecked = (p[IDX_CHECK] === true || p[IDX_CHECK] === "TRUE" || p[IDX_CHECK] === "true");
  var checkInput = '';

  var imgUrl = p[IDX_IMAGE] || "";
  var imgHtml = "";
  if (!isSub) {
    if (imgUrl) {
            imgHtml = `<img src="${imgUrl}" style="width:80px; height:80px; object-fit:cover; border-radius:6px; vertical-align:middle; border:1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">`;
    } else {
            imgHtml = `<div style="width:80px; height:80px; background:#f8fafc; border-radius:6px; display:inline-block; border:1px dashed #e2e8f0;"></div>`;
    }
  }
  var imgCell = isSub ? `<td></td>` : `<td>${imgHtml}</td>`; 

  var detailCatStr = p[IDX_DETAIL_CAT] ? String(p[IDX_DETAIL_CAT]) : "";
  var codeDisplay, nameHtml, priceDisplay, keywordContent, deleteCell;

      codeDisplay = isSub ? '' : `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;"><a href="${linkUrl}" target="_blank" class="prod-link"><span class="prod-no">${p[IDX_CODE]}</span></a><button class="row-edit-btn" onclick="openProductEditModal(${realIndex})">편집</button></div>`;
      var nameClass = isChecked ? 'danger-bg' : '';
      var catHtml = detailCatStr ? `<div style="font-size:12px; color:#64748b; margin-top:3px; font-weight:500;">${detailCatStr}</div>` : '';
      var companyName = p[IDX_COMPANY] ? String(p[IDX_COMPANY]) : '';
      var companyBadge = (isWatch && companyName) ? `<div style="font-size:11px; color:#64748b; border-radius:4px; padding:2px 6px; margin-top:3px; font-weight:500; display:inline-block;">${companyName}</div>` : '';
      var baseNameHtml = `<span class="prod-name ${nameClass}" title="${p[IDX_NAME]}">${p[IDX_NAME]}</span>`;
      
      if (!isSub) { 
          nameHtml = `
          <div style="display:flex; align-items:center; gap:8px; height:100%;">
              <div>${checkInput}</div>
              <div style="flex:1; display:flex; flex-direction:column; justify-content:center; text-align:left; min-width:0;">
                  <a href="${linkUrl}" target="_blank" class="prod-link" style="display:inline-block;">${baseNameHtml}</a>
                  ${catHtml}
                  ${companyBadge}
              </div>
          </div>`; 
      } else {
          nameHtml = '';
      }
      priceDisplay = isSub ? '' : Number(p[IDX_PRICE]).toLocaleString();
      var keywordRaw = p[IDX_KEYWORD];
      var keywordSearchUrl = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(keywordRaw)}&vertical=search`;
      var keywordHtml = `<a href="${keywordSearchUrl}" target="_blank" class="keyword-link">${keywordRaw}</a>`;
      keywordContent = isSub ? `ㄴ ${keywordHtml}` : keywordHtml;
      deleteCell = ``;

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
          </tr>`;
}

function fetchProductImage(realIndex, productId) {
    if(!productId || productId.startsWith('NEW_')) { showToast('유효한 상품 번호가 아닙니다.', 'warning'); return; }
    var btn = event.target;
    var originalText = btn.innerText;
    btn.innerText = '로딩중...';
    btn.disabled = true;

    var keyword = products[realIndex][IDX_KEYWORD] || '';
    var reqId = 'img_' + Date.now();

    // 결과 수신 리스너
    function onMessage(e) {
        if (!e.data || e.data.type !== 'FETCH_NAVER_IMAGE_RESULT') return;
        if (e.data.reqId !== reqId) return;
        window.removeEventListener('message', onMessage);

        btn.innerText = originalText;
        btn.disabled = false;

        var response = e.data.response;
        if (response && response.success && response.imageUrl) {
            products[realIndex][IDX_IMAGE] = response.imageUrl;
            renderRanking();
        } else {
            showToast('이미지 가져오기 실패: ' + (response && response.message || '확장프로그램이 설치/활성화 상태인지 확인해주세요.'), 'error');
        }
    }
    window.addEventListener('message', onMessage);

    // 확장프로그램(app_bridge.js)으로 요청 전송
    var productType = products[realIndex][IDX_TYPE] || 'mine';
    window.postMessage({
        type: 'FETCH_NAVER_IMAGE',
        reqId: reqId,
        productId: productId,
        productCode: productId,
        productType: productType,
        keyword: keyword,
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_ANON_KEY
    }, '*');

    // 30초 타임아웃
    setTimeout(function() {
        window.removeEventListener('message', onMessage);
        if (btn.innerText === '로딩중...') {
            btn.innerText = originalText;
            btn.disabled = false;
            showToast('시간 초과. 확장프로그램이 설치/활성화 상태인지 확인해주세요.', 'error');
        }
    }, 30000);
}
function updateProductCode(realIndex, val) {
    products[realIndex][IDX_CODE] = val;
    if(confirm("상품번호가 변경되었습니다. 이미지를 자동으로 가져올까요?")) { fetchProductImage(realIndex, val); }
}


function showSavePanel() {}
function hideSavePanel() {}

function setTab(t) { 
  currentTab = t; 
  var master = document.getElementById('masterCheck');
  if(master) master.checked = false;
  document.querySelectorAll('#page-ranking .tab, #page-ranking .rk-tab').forEach(b => b.classList.toggle('active', b.innerText.trim() == t)); 
  // 탭 전환 시 전체 펼치기 상태 초기화
  _allSubsExpanded = false;
  var btnEl = document.getElementById('expandAllBtn');
  if (btnEl) btnEl.textContent = '[ 펼치기 ]';
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

// 전체 펼치기 / 접기
var _allSubsExpanded = false;
function toggleAllSubs() {
  var allBtns = document.querySelectorAll('.main-row .toggle-btn');
  if (allBtns.length === 0) return;
  _allSubsExpanded = !_allSubsExpanded;
  allBtns.forEach(function(btn) {
    var onclick = btn.getAttribute('onclick') || '';
    var match = onclick.match(/toggleSub\('(.+?)'\)/);
    if (!match) return;
    var code = match[1];
    var rows = document.querySelectorAll('.sub-' + code);
    rows.forEach(function(row) {
      row.style.display = _allSubsExpanded ? 'table-row' : 'none';
    });
    btn.innerText = _allSubsExpanded ? '-' : '+';
  });
  var btnEl = document.getElementById('expandAllBtn');
  if (btnEl) {
    btnEl.textContent = _allSubsExpanded ? '[ 접기 ]' : '[ 펼치기 ]';
  }
}

function updateData(realIndex, colIndex, val) { products[realIndex][colIndex] = val; }

function toggleAllChecks(checked) {
  products.forEach(p => { if(String(p[IDX_CATEGORY]).trim() === currentTab) p[IDX_CHECK] = checked; });
  renderRanking();
}

function addEmptyRow(type = 'mine') {
  var tempCode = "NEW_" + Date.now();
  var newRow = [ tempCode, "", "", currentTab, "", "", "", "", "", "", "[]", false, "", "", null, type, "" ];
  products.push(newRow);
  var label = type === 'watch' ? '관찰 상품' : '내 상품';
  showToast(label + ' 행이 추가되었습니다.', 'success');
  renderRanking();
  setTimeout(() => { document.querySelector('.ranking-scroll-wrapper').scrollTop = document.querySelector('.ranking-scroll-wrapper').scrollHeight; }, 100);
}

function addSubKeyword(mainRealIndex) {
  var mainRow = products[mainRealIndex];
  // \uba54\uc778 \ud589 \uc815\ubcf4 \ubcf5\uc0ac (\ucf54\ub4dc, \uc774\ub984, \uac00\uaca9, \ud0ed \ub3d9\uc77c)
  var newRow = new Array(15).fill("");
  newRow[IDX_CODE]     = mainRow[IDX_CODE];
  newRow[IDX_NAME]     = mainRow[IDX_NAME];
  newRow[IDX_PRICE]    = mainRow[IDX_PRICE];
  newRow[IDX_CATEGORY] = mainRow[IDX_CATEGORY];
  newRow[IDX_KEYWORD]  = "";  // \ube48 \ud0a4\uc6cc\ub4dc - \uc0ac\uc6a9\uc790\uac00 \uc785\ub825
  newRow[IDX_REMARK]   = "[]";
  newRow[IDX_CHECK]    = false;
  newRow[IDX_IMAGE]    = mainRow[IDX_IMAGE];
  newRow[IDX_DETAIL_CAT] = mainRow[IDX_DETAIL_CAT];
  newRow[IDX_TYPE]       = mainRow[IDX_TYPE] || 'mine';
  newRow[IDX_COMPANY]    = mainRow[IDX_COMPANY] || '';
  // 메인 행 바로 다음 위치에 삽입 (\uac19\uc740 code \uadf8\ub8f9\uc73c\ub85c \ubb36\uc774\uae30 \uc704\ud568)
  products.splice(mainRealIndex + 1, 0, newRow);
  renderRanking();
}

function deleteProductRow(realIndex) {
  if(!confirm('정말 이 상품을 삭제하시겠습니까?')) return;
  products.splice(realIndex, 1);
  renderRanking();
  saveData(true); // 즉시 DB 저장
}

// 🚀 [Updated] 검색 순위 저장 (히스토리 + 마스터 데이터 동시 저장)
window.saveData = async function(silent = false) {
    if (!products || products.length === 0) { showToast('저장할 데이터가 없습니다.', 'warning'); return; }
    if (!supabaseClient) return;

    if (!silent && !confirm(`${currentRankYear}년 ${currentRankMonth}월 순위 데이터를 저장하시겠습니까?`)) return;

    var btn = document.getElementById('saveBtn');
    var originalText = btn ? btn.innerText : '';
    if(btn) { btn.disabled = true; btn.innerText = '저장 중...'; }
    document.getElementById('loader').style.display = 'flex';
    
    try {
        // 1. 순위 히스토리 데이터 준비 (ranking_history)
        const historyRows = products.map(row => ({
            year: currentRankYear,
            month: currentRankMonth,
            product_code: row[IDX_CODE],
            keyword: row[IDX_KEYWORD],
            product_name: row[IDX_NAME],
            rank_w1: row[5] !== "" ? Number(row[5]) : null, 
            rank_w2: row[6] !== "" ? Number(row[6]) : null,
            rank_w3: row[7] !== "" ? Number(row[7]) : null, 
            rank_w4: row[8] !== "" ? Number(row[8]) : null,
            rank_w5: row[9] !== "" ? Number(row[9]) : null,
            memo: row[IDX_REMARK] ? row[IDX_REMARK] : "[]"
        }));

        // 2. 마스터 데이터 준비 (product_rankings - 상품 기본 정보 업데이트)
        const masterRows = products.map(row => ({
            code: row[IDX_CODE],
            name: row[IDX_NAME],
            price: Number(row[IDX_PRICE]),
            category_tab: row[IDX_CATEGORY],
            keyword: row[IDX_KEYWORD],
            is_checked: String(row[IDX_CHECK]).toUpperCase() === "TRUE",
            memo: row[IDX_REMARK] ? row[IDX_REMARK] : "[]",
            image_url: row[IDX_IMAGE],
            detail_category: row[IDX_DETAIL_CAT],
            product_type: row[IDX_TYPE] || 'mine',
            company_name: row[IDX_COMPANY] || ''
        }));

        // 3. Supabase Upsert 실행
        
        // (A) 히스토리 저장 (키: year, month, product_code)
        const { error: histError } = await supabaseClient
            .from('ranking_history')
            .upsert(historyRows, { onConflict: 'year, month, product_code, keyword' });
        
        if (histError) throw histError;

        // (B) 마스터 데이터 저장 (키: code) - 기존 데이터가 있으면 정보 업데이트
        const { error: masterError } = await supabaseClient
            .from('product_rankings')
            .upsert(masterRows, { onConflict: 'code, keyword' });
            
        if (masterError) throw masterError;
        
        showToast('저장되었습니다.', 'success'); 
        originalProducts = JSON.parse(JSON.stringify(products));
        hideSavePanel();
        renderRanking();

    } catch(e) { 
        console.error(e); 
        showToast('저장 실패: ' + e.message, 'error'); 
    } finally { 
        document.getElementById('loader').style.display = 'none'; 
        if(btn) { btn.disabled = false; btn.innerText = originalText; }
    }
};

function resetData() {
  if(!confirm("수정 중인 내용을 모두 취소하고, 서버에 저장된 값을 다시 불러오시겠습니까?")) return;
  hideSavePanel();
  loadRankingData(); 
}

function downloadCSV() {
  if(products.length === 0) { showToast('데이터가 없습니다.', 'warning'); return; }
  var csvContent = "\uFEFF"; csvContent += "상품번호,상품명,세부카테고리,가격,탭분류,키워드,1주차,2주차,3주차,4주차,5주차,비고,중요체크,이미지\n";
  products.forEach(p => {
    var rawMemo = p[IDX_REMARK] ? String(p[IDX_REMARK]) : ""; var memoList = getParsedMemos(rawMemo); var memoText = memoList.map(m => `[${m.date}] ${m.text}`).join(" / ");
    var row = [ p[IDX_CODE], `"${String(p[IDX_NAME]||"").replace(/"/g, '""')}"`, `"${String(p[IDX_DETAIL_CAT]||"").replace(/"/g, '""')}"`, p[IDX_PRICE], p[IDX_CATEGORY], p[IDX_KEYWORD], p[5], p[6], p[7], p[8], p[9], `"${memoText.replace(/"/g, '""')}"`, p[IDX_CHECK] ? "TRUE" : "FALSE", p[IDX_IMAGE] || "" ];
    csvContent += row.join(",") + "\n";
  });
  var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); var url = URL.createObjectURL(blob); var link = document.createElement("a"); var today = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url); link.setAttribute("download", `한국단열_순위데이터_${currentRankYear}_${currentRankMonth}_${today}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

/* ================= [2. Sales Functions] ================= */

// 매출 데이터 불러오기
window.loadSalesData = async function() {
    if (!supabaseClient) return;
    document.getElementById('loader').style.display = 'flex';
    try {
        const { data, error } = await supabaseClient.from('sales_data').select('*').order('month_str', { ascending: true });
        if (error) throw error;
        
        salesData = data.map(item => [
            item.mall_type || "", item.month_str || "", item.revenue || 0, item.ad_spend || 0,
            item.roas || 0, item.traffic || 0, item.pay_count || 0, item.mobile_ratio || 0,
            item.refund_ratio || 0, item.winner_ratio || 0
        ]);
        originalSalesData = JSON.parse(JSON.stringify(salesData));
        isSalesEditMode = false; 
        updateSalesEditUI(); 
        setSalesTab(currentSalesTab); 
    } catch (e) { 
        console.error("매출 데이터 로드 오류:", e); 
        showToast('매출 데이터 로드 중 오류가 발생했습니다.', 'error');
    } finally { 
        document.getElementById('loader').style.display = 'none'; 
    }
};

function parseRatio(val) {
    if (val === undefined || val === null || val === "") return "";
    var str = String(val).trim().replace(/,/g, '');
    if (str.includes('%')) return Number(str.replace(/%/g, '')).toFixed(1);
    var num = Number(str);
    if (isNaN(num)) return "";
    if (num <= 1 && num > 0) return (num * 100).toFixed(1);
    return num.toFixed(1);
}

function updateSales(realIdx, colIdx, val) {
  if(colIdx === 2 || colIdx === 3 || colIdx === 5 || colIdx === 6) salesData[realIdx][colIdx] = parseCurrency(val);
  else if(colIdx === 4 || colIdx === 7 || colIdx === 8 || colIdx === 9) salesData[realIdx][colIdx] = Number(val) / 100;
  else salesData[realIdx][colIdx] = val;
}

function toggleSalesEditMode() {
  isSalesEditMode = !isSalesEditMode;
  updateSalesEditUI();
  renderSales();
}

function updateSalesEditUI() {
  var editBtn = document.getElementById('editSalesBtn'); 
  var addBtn = document.getElementById('addSalesRowBtn'); 
  var resetBtn = document.getElementById('resetSalesBtn');
  var colDeletes = document.querySelectorAll('.col-delete');

  if(!editBtn || !addBtn || !resetBtn) return;

  if (isSalesEditMode) { 
      editBtn.innerText = "편집 취소"; editBtn.classList.add('edit-active'); 
      addBtn.style.display = 'inline-block'; resetBtn.style.display = 'inline-block'; 
      colDeletes.forEach(el => {
          el.style.display = el.tagName === 'COL' ? '' : 'table-cell';
          if(el.tagName === 'COL') el.style.width = '60px'; 
      });
  } 
  else { 
      editBtn.innerText = "편집"; editBtn.classList.remove('edit-active'); 
      addBtn.style.display = 'none'; resetBtn.style.display = 'none'; 
      colDeletes.forEach(el => {
          el.style.display = 'none';
          if(el.tagName === 'COL') el.style.width = '0px'; 
      });
  }
}

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

window.saveSalesData = async function() {
    if (!supabaseClient) return;
    if (!confirm("매출 데이터를 저장하시겠습니까?")) return;
    var btn = document.getElementById('saveSalesBtn'); btn.innerText = "저장 중...";
    document.getElementById('loader').style.display = 'flex';
    
    try {
        await supabaseClient.from('sales_data').delete().neq('mall_type', 'DUMMY_DATA');
        const insertData = salesData.map(row => ({
            mall_type: row[0] || "", month_str: row[1] || "", revenue: Number(row[2]) || 0, ad_spend: Number(row[3]) || 0,
            roas: Number(row[4]) || 0, traffic: Number(row[5]) || 0, pay_count: Number(row[6]) || 0, mobile_ratio: Number(row[7]) || 0,
            refund_ratio: Number(row[8]) || 0, winner_ratio: Number(row[9]) || 0
        }));
        if (insertData.length > 0) {
            const { error } = await supabaseClient.from('sales_data').insert(insertData);
            if (error) throw error;
        }
        showToast('매출 데이터 저장 완료!', 'success');
        btn.innerText = "저장";
        originalSalesData = JSON.parse(JSON.stringify(salesData)); 
        isSalesEditMode = false; updateSalesEditUI(); renderSales();
    } catch(e) { 
        console.error(e); showToast('저장 실패: ' + e.message, 'error'); btn.innerText = "저장";
    } finally { 
        document.getElementById('loader').style.display = 'none'; 
    }
};

function downloadSalesCSV() {
  if(salesData.length === 0) { showToast('다운로드할 데이터가 없습니다.', 'warning'); return; }
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
  document.querySelectorAll('#page-sales .sales-tab').forEach(b => b.classList.toggle('active', b.innerText.trim() == t)); 
  
  var smartCols = document.querySelectorAll('.col-smart'); 
  var coupangCols = document.querySelectorAll('.col-coupang');
  
  if(t === '스마트스토어') { 
      smartCols.forEach(e => {
          e.style.display = e.tagName === 'COL' ? '' : 'table-cell';
          if(e.tagName === 'COL') e.style.width = '110px'; 
      }); 
      coupangCols.forEach(e => {
          e.style.display = 'none';
          if(e.tagName === 'COL') e.style.width = '0px'; 
      }); 
  } else { 
      smartCols.forEach(e => {
          e.style.display = 'none';
          if(e.tagName === 'COL') e.style.width = '0px'; 
      }); 
      coupangCols.forEach(e => {
          e.style.display = e.tagName === 'COL' ? '' : 'table-cell';
          if(e.tagName === 'COL') e.style.width = '110px'; 
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
    try {
        // 1. JSON 파싱 시도 (정상 구조)
        var parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [{date:"", text:raw}];
    } catch(e) {
        // 2. "[날짜] 내용 / [날짜] 내용" 형태 레거시 문자열 분리
        var legacyPattern = /\[([^\]]+)\]\s*([^/]+?)(?=\s*\/\s*\[|$)/g;
        var matches = [];
        var match;
        while ((match = legacyPattern.exec(raw)) !== null) {
            var text = match[2].trim();
            if (text) matches.push({ date: match[1].trim(), text: text });
        }
        // 3. 패턴 매칭 실패 시 전체를 하나로
        return matches.length > 0 ? matches : [{date:"", text:raw}];
    }
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
    if(!text) { showToast('내용을 입력해주세요.', 'warning'); return; } pushMemoToData(currentEditRowIndex, text); input.value = ''; renderMemoListInModal(); 
}

function deleteMemo(index) { 
    if(!confirm("정말 이 메모를 삭제하시겠습니까?")) return; 
    var raw = products[currentEditRowIndex][IDX_REMARK]; var list = getParsedMemos(raw); 
    list.splice(index, 1); products[currentEditRowIndex][IDX_REMARK] = JSON.stringify(list); renderMemoListInModal(); 
}
// ── TOP5 수신 토스트 알림 ─────────────────────────────────────
function showTop5Toast(msg) {
    var toast = document.getElementById('top5Toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'top5Toast';
        toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#10b981;color:white;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:700;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:opacity 0.4s;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 4000);
}
/* ═══════════════════════════════════════════════════
   상품 추가 버튼 → openAddProductModal
   (기존 toggleEditMode 역할 대체)
═══════════════════════════════════════════════════ */
var _addProductType = 'mine'; // 현재 추가 탭

window.openAddProductModal = function() {
  _addProductType = 'mine';
  // 탭 초기화
  document.getElementById('addTabMine').classList.add('active');
  document.getElementById('addTabWatch').classList.remove('active');
  document.getElementById('addCompanyRow').style.display = 'none';
  // 필드 초기화
  ['addCode','addName','addDetailCat','addPrice','addKeyword','addCompany'].forEach(id => {
    var el = document.getElementById(id); if(el) el.value = '';
  });
  document.getElementById('addCategory').value = currentTab;
  document.getElementById('addSubKeywordsWrap').innerHTML = '';
  // 이미지 초기화
  var prev = document.getElementById('addImgPreview');
  var empty = document.getElementById('addImgEmpty');
  prev.src = ''; prev.style.display = 'none'; empty.style.display = 'flex';
  // 모달 열기
  document.getElementById('productAddModal').style.display = 'flex';
  setTimeout(() => { var el = document.getElementById('addCode'); if(el) el.focus(); }, 100);
};

window.closeAddProductModal = function(e) {
  if(e && e.target !== document.getElementById('productAddModal')) return;
  document.getElementById('productAddModal').style.display = 'none';
};

window.switchAddTab = function(type) {
  _addProductType = type;
  document.getElementById('addTabMine').classList.toggle('active', type === 'mine');
  document.getElementById('addTabWatch').classList.toggle('active', type === 'watch');
  document.getElementById('addCompanyRow').style.display = type === 'watch' ? 'flex' : 'none';
};

window.onAddCodeInput = function() {
  var code = document.getElementById('addCode').value.trim();
  var prev = document.getElementById('addImgPreview');
  var empty = document.getElementById('addImgEmpty');
  if(!code) { prev.style.display='none'; empty.style.display='flex'; return; }
};

window.fetchAddProductImage = async function() {
  var code = document.getElementById('addCode').value.trim();
  if(!code) { showToast('상품번호를 먼저 입력해주세요.', 'warning'); return; }
  var btn = event.target; btn.textContent = '불러오는 중...'; btn.disabled = true;
  var keyword = document.getElementById('addKeyword').value.trim();
  var reqId = 'img_add_' + Date.now();
  function onMsg(e) {
    if(!e.data || e.data.type !== 'FETCH_NAVER_IMAGE_RESULT' || e.data.reqId !== reqId) return;
    window.removeEventListener('message', onMsg);
    btn.textContent = '🔄 이미지 불러오기'; btn.disabled = false;
    var res = e.data.response;
    if(res && res.success && res.imageUrl) {
      var prev = document.getElementById('addImgPreview');
      var empty = document.getElementById('addImgEmpty');
      prev.src = res.imageUrl; prev.style.display = 'block'; empty.style.display = 'none';
      prev._url = res.imageUrl;
    } else { showToast('이미지 가져오기 실패', 'error'); }
  }
  window.addEventListener('message', onMsg);
  window.postMessage({ type:'FETCH_NAVER_IMAGE', reqId, productId:code, productCode:code, productType:_addProductType, keyword, supabaseUrl:SUPABASE_URL, supabaseKey:SUPABASE_ANON_KEY }, '*');
  setTimeout(() => { window.removeEventListener('message', onMsg); if(btn.disabled){ btn.textContent='🔄 이미지 불러오기'; btn.disabled=false; } }, 30000);
};

window.addSubKeywordFieldForAdd = function() {
  var wrap = document.getElementById('addSubKeywordsWrap');
  var idx = wrap.children.length;
  var div = document.createElement('div');
  div.className = 'prod-modal-row';
  div.innerHTML = `<label>보조 키워드 ${idx+1}</label><input type="text" class="add-sub-kw" placeholder="보조 키워드"><button style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;padding:0 4px;" onclick="this.parentNode.remove()">✕</button>`;
  wrap.appendChild(div);
};

window.saveNewProduct = function() {
  var code = document.getElementById('addCode').value.trim();
  var name = document.getElementById('addName').value.trim();
  var cat  = document.getElementById('addCategory').value;
  var detailCat = document.getElementById('addDetailCat').value.trim();
  var price = document.getElementById('addPrice').value.trim();
  var keyword = document.getElementById('addKeyword').value.trim();
  var company = document.getElementById('addCompany').value.trim();
  var prev = document.getElementById('addImgPreview');
  var imgUrl = (prev._url || (prev.src && !prev.src.endsWith('/') ? prev.src : '')) || '';

  if(!code) { showToast('상품번호를 입력해주세요.', 'warning'); return; }
  if(!name) { showToast('상품명을 입력해주세요.', 'warning'); return; }
  if(!keyword) { showToast('메인 키워드를 입력해주세요.', 'warning'); return; }

  // 메인 행
  var mainRow = new Array(17).fill('');
  mainRow[IDX_CODE] = code; mainRow[IDX_NAME] = name;
  mainRow[IDX_PRICE] = price || 0; mainRow[IDX_CATEGORY] = cat;
  mainRow[IDX_KEYWORD] = keyword; mainRow[IDX_REMARK] = '[]';
  mainRow[IDX_CHECK] = false; mainRow[IDX_IMAGE] = imgUrl;
  mainRow[IDX_DETAIL_CAT] = detailCat; mainRow[14] = null;
  mainRow[IDX_TYPE] = _addProductType; mainRow[IDX_COMPANY] = company;
  products.push(mainRow);

  // 보조 키워드 행들
  var subInputs = document.querySelectorAll('#addSubKeywordsWrap .add-sub-kw');
  subInputs.forEach(inp => {
    var subKw = inp.value.trim();
    if(!subKw) return;
    var subRow = new Array(17).fill('');
    subRow[IDX_CODE] = code; subRow[IDX_NAME] = name;
    subRow[IDX_PRICE] = price || 0; subRow[IDX_CATEGORY] = cat;
    subRow[IDX_KEYWORD] = subKw; subRow[IDX_REMARK] = '[]';
    subRow[IDX_CHECK] = false; subRow[IDX_IMAGE] = imgUrl;
    subRow[IDX_DETAIL_CAT] = detailCat; subRow[14] = null;
    subRow[IDX_TYPE] = _addProductType; subRow[IDX_COMPANY] = company;
    products.push(subRow);
  });

  // 현재 탭과 다르면 탭 전환
  if(cat !== currentTab) setTab(cat);
  else renderRanking();

  document.getElementById('productAddModal').style.display = 'none';
  showToast('저장 중...', 'info');
  saveData(true); // 즉시 DB 저장
};

/* ═══════════════════════════════════════════════════
   상품 편집 모달
═══════════════════════════════════════════════════ */
var _editProductIndex = -1;      // 메인 행 인덱스
var _editSubIndices   = [];      // 보조 키워드 행 인덱스 배열
var _editOriginalKeywords = {};  // { realIndex: 원래키워드 } — 키워드 변경 감지용

window.openProductEditModal = function(realIndex) {
  _editProductIndex = realIndex;
  var p = products[realIndex];

  // 같은 code를 가진 보조 행 찾기
  var code = p[IDX_CODE];
  _editSubIndices = [];
  _editOriginalKeywords = {};
  _editOriginalKeywords[realIndex] = p[IDX_KEYWORD] || '';  // 메인 키워드 원본 저장
  products.forEach((row, i) => {
    if(i !== realIndex && String(row[IDX_CODE]) === String(code) && String(row[IDX_CATEGORY]) === String(p[IDX_CATEGORY])) {
      _editSubIndices.push(i);
      _editOriginalKeywords[i] = row[IDX_KEYWORD] || '';  // 보조 키워드 원본 저장
    }
  });

  // 필드 채우기
  document.getElementById('editCode').value = p[IDX_CODE] || '';
  document.getElementById('editName').value = p[IDX_NAME] || '';
  document.getElementById('editCategory').value = p[IDX_CATEGORY] || '아이소핑크';
  document.getElementById('editDetailCat').value = p[IDX_DETAIL_CAT] || '';
  document.getElementById('editPrice').value = p[IDX_PRICE] || '';
  document.getElementById('editKeyword').value = p[IDX_KEYWORD] || '';
  document.getElementById('editW1').value = p[5] || '';
  document.getElementById('editW2').value = p[6] || '';
  document.getElementById('editW3').value = p[7] || '';
  document.getElementById('editW4').value = p[8] || '';
  document.getElementById('editW5').value = p[9] || '';

  // 보조 키워드 렌더링
  var wrap = document.getElementById('editSubKeywordsWrap');
  wrap.innerHTML = '';
  _editSubIndices.forEach((subIdx, n) => {
    var sp = products[subIdx];
    var subKw = sp[IDX_KEYWORD] || '';
    var div = document.createElement('div');
    div.className = 'prod-modal-sub-block';
    div.dataset.subIdx = subIdx;
    div.innerHTML = `
      <div class="prod-modal-row" style="margin-bottom:4px;">
        <label>보조 키워드 ${n+1}</label>
        <input type="text" class="edit-sub-kw" value="${subKw}" placeholder="보조 키워드">
        <button style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;padding:0 4px;" onclick="removeEditSubRow(${subIdx}, this.closest('.prod-modal-sub-block'))">✕</button>
      </div>
      <div class="prod-modal-rank-row prod-modal-rank-row--sub">
        <div class="prod-modal-rank-cell"><label>1주</label><input type="number" class="edit-sub-w1" value="${sp[5]||''}" placeholder="-"></div>
        <div class="prod-modal-rank-cell"><label>2주</label><input type="number" class="edit-sub-w2" value="${sp[6]||''}" placeholder="-"></div>
        <div class="prod-modal-rank-cell"><label>3주</label><input type="number" class="edit-sub-w3" value="${sp[7]||''}" placeholder="-"></div>
        <div class="prod-modal-rank-cell"><label>4주</label><input type="number" class="edit-sub-w4" value="${sp[8]||''}" placeholder="-"></div>
        <div class="prod-modal-rank-cell"><label>5주</label><input type="number" class="edit-sub-w5" value="${sp[9]||''}" placeholder="-"></div>
      </div>`;
    wrap.appendChild(div);
  });

  // 이미지
  var imgUrl = p[IDX_IMAGE] || '';
  var prev = document.getElementById('editImgPreview');
  var empty = document.getElementById('editImgEmpty');
  prev._url = imgUrl;
  if(imgUrl) { prev.src = imgUrl; prev.style.display = 'block'; empty.style.display = 'none'; }
  else { prev.src = ''; prev.style.display = 'none'; empty.style.display = 'flex'; }

  // 체크
  var isChecked = (p[IDX_CHECK] === true || p[IDX_CHECK] === 'TRUE' || p[IDX_CHECK] === 'true');
  document.getElementById('editCheck').checked = isChecked;
  _syncEditCheckBtn(isChecked);

  // 메모 렌더링
  renderEditMemoList(realIndex);

  document.getElementById('productEditModal').style.display = 'flex';
};

window.removeEditSubRow = function(subIdx, rowEl) {
  // 해당 보조 키워드를 빈 키워드로 표시 (삭제 플래그)
  rowEl.dataset.deleted = 'true';
  rowEl.style.opacity = '0.3';
  rowEl.style.textDecoration = 'line-through';
  rowEl.querySelector('.edit-sub-kw').disabled = true;
};

window.toggleEditCheck = function() {
  var cb = document.getElementById('editCheck');
  cb.checked = !cb.checked;
  _syncEditCheckBtn(cb.checked);
};

function _syncEditCheckBtn(checked) {
  var btn   = document.getElementById('editCheckBtn');
  var icon  = document.getElementById('editCheckIcon');
  var label = document.getElementById('editCheckLabel');
  if(!btn) return;
  if(checked) {
    btn.style.background    = '#eef2ff';
    btn.style.borderColor   = '#6366f1';
    btn.style.color         = '#4f46e5';
    icon.textContent        = '☑';
    label.textContent       = '체크됨 (상품명 강조)';
  } else {
    btn.style.background    = '#f8fafc';
    btn.style.borderColor   = '#e2e8f0';
    btn.style.color         = '#94a3b8';
    icon.textContent        = '☐';
    label.textContent       = '미체크';
  }
}

window.renderEditMemoList = function(rowIdx) {
  if(rowIdx === undefined) rowIdx = _editProductIndex;
  if(rowIdx < 0) return;
  var raw = products[rowIdx][IDX_REMARK] ? String(products[rowIdx][IDX_REMARK]) : '';
  var list = getParsedMemos(raw);
  var container = document.getElementById('editMemoList');
  if(!container) return;
  if(list.length === 0) {
    container.innerHTML = '<div style="font-size:12px;color:#94a3b8;padding:6px 2px;">등록된 메모가 없습니다.</div>';
    return;
  }
  container.innerHTML = [...list].reverse().map((memo, i) => {
    var originalIndex = list.length - 1 - i;
    return `<div style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 10px;background:#f8fafc;border-radius:7px;border:1px solid #e2e8f0;gap:8px;">
      <div style="flex:1;">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">${memo.date}</div>
        <div style="font-size:13px;color:#334155;">${memo.text}</div>
      </div>
      <button onclick="deleteEditMemo(${originalIndex})" style="border:none;background:none;color:#ef4444;cursor:pointer;font-size:14px;padding:0;flex-shrink:0;">✕</button>
    </div>`;
  }).join('');
};

window.addEditMemo = function() {
  if(_editProductIndex < 0) return;
  var input = document.getElementById('editMemoInput');
  var text = input.value.trim();
  if(!text) return;
  var raw = products[_editProductIndex][IDX_REMARK] ? String(products[_editProductIndex][IDX_REMARK]) : '';
  var list = getParsedMemos(raw);
  list.push({ date: getNowStr(), text: text });
  products[_editProductIndex][IDX_REMARK] = JSON.stringify(list);
  input.value = '';
  renderEditMemoList();
};

window.deleteEditMemo = function(index) {
  if(_editProductIndex < 0) return;
  var raw = products[_editProductIndex][IDX_REMARK];
  var list = getParsedMemos(raw);
  list.splice(index, 1);
  products[_editProductIndex][IDX_REMARK] = JSON.stringify(list);
  renderEditMemoList();
};

window.deleteFromEditModal = function() {
  if(_editProductIndex < 0) return;
  var p = products[_editProductIndex];
  var name = p[IDX_NAME] || '이 상품';
  if(!confirm(`"${name.substring(0,20)}" 상품을 삭제하시겠습니까?\n같은 상품코드의 보조 키워드 행도 함께 삭제됩니다.`)) return;

  // 삭제할 인덱스 수집 (메인 + 보조, 역순으로 splice)
  var toDelete = [_editProductIndex, ..._editSubIndices].sort((a,b) => b - a);
  toDelete.forEach(i => products.splice(i, 1));

  document.getElementById('productEditModal').style.display = 'none';
  _editProductIndex = -1; _editSubIndices = []; _editOriginalKeywords = {};
  renderRanking();
  saveData(true); // 즉시 DB 저장
};

window.closeProductEditModal = function(e) {
  if(e && e.target !== document.getElementById('productEditModal')) return;
  document.getElementById('productEditModal').style.display = 'none';
  _editProductIndex = -1; _editSubIndices = [];
};

window.onEditCodeInput = function() {
  // 코드 변경 시 이미지 초기화 힌트
};

window.fetchEditProductImage = async function() {
  var code = document.getElementById('editCode').value.trim();
  if(!code) { showToast('상품번호를 먼저 입력해주세요.', 'warning'); return; }
  var btn = event.target; btn.textContent = '불러오는 중...'; btn.disabled = true;
  var keyword = document.getElementById('editKeyword').value.trim();
  var reqId = 'img_edit_' + Date.now();
  var productType = _editProductIndex >= 0 ? (products[_editProductIndex][IDX_TYPE] || 'mine') : 'mine';
  function onMsg(e) {
    if(!e.data || e.data.type !== 'FETCH_NAVER_IMAGE_RESULT' || e.data.reqId !== reqId) return;
    window.removeEventListener('message', onMsg);
    btn.textContent = '🔄 이미지 불러오기'; btn.disabled = false;
    var res = e.data.response;
    if(res && res.success && res.imageUrl) {
      var prev = document.getElementById('editImgPreview');
      var empty = document.getElementById('editImgEmpty');
      prev.src = res.imageUrl; prev._url = res.imageUrl;
      prev.style.display = 'block'; empty.style.display = 'none';
    } else { showToast('이미지 가져오기 실패', 'error'); }
  }
  window.addEventListener('message', onMsg);
  window.postMessage({ type:'FETCH_NAVER_IMAGE', reqId, productId:code, productCode:code, productType, keyword, supabaseUrl:SUPABASE_URL, supabaseKey:SUPABASE_ANON_KEY }, '*');
  setTimeout(() => { window.removeEventListener('message', onMsg); if(btn.disabled){ btn.textContent='🔄 이미지 불러오기'; btn.disabled=false; } }, 30000);
};

window.addSubKeywordField = function() {
  var wrap = document.getElementById('editSubKeywordsWrap');
  var idx = wrap.children.length;
  var div = document.createElement('div');
  div.className = 'prod-modal-sub-block';
  div.dataset.subIdx = 'new_' + Date.now();
  div.innerHTML = `
    <div class="prod-modal-row" style="margin-bottom:4px;">
      <label>보조 키워드 ${idx+1}</label>
      <input type="text" class="edit-sub-kw" placeholder="보조 키워드">
      <button style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;padding:0 4px;" onclick="this.closest('.prod-modal-sub-block').remove()">✕</button>
    </div>
    <div class="prod-modal-rank-row prod-modal-rank-row--sub">
      <div class="prod-modal-rank-cell"><label>1주</label><input type="number" class="edit-sub-w1" placeholder="-"></div>
      <div class="prod-modal-rank-cell"><label>2주</label><input type="number" class="edit-sub-w2" placeholder="-"></div>
      <div class="prod-modal-rank-cell"><label>3주</label><input type="number" class="edit-sub-w3" placeholder="-"></div>
      <div class="prod-modal-rank-cell"><label>4주</label><input type="number" class="edit-sub-w4" placeholder="-"></div>
      <div class="prod-modal-rank-cell"><label>5주</label><input type="number" class="edit-sub-w5" placeholder="-"></div>
    </div>`;
  wrap.appendChild(div);
};

window.saveProductEdit = function() {
  if(_editProductIndex < 0) return;
  var p = products[_editProductIndex];

  var code      = document.getElementById('editCode').value.trim();
  var name      = document.getElementById('editName').value.trim();
  var cat       = document.getElementById('editCategory').value;
  var detailCat = document.getElementById('editDetailCat').value.trim();
  var price     = document.getElementById('editPrice').value.trim();
  var keyword   = document.getElementById('editKeyword').value.trim();
  var w1 = document.getElementById('editW1').value.trim();
  var w2 = document.getElementById('editW2').value.trim();
  var w3 = document.getElementById('editW3').value.trim();
  var w4 = document.getElementById('editW4').value.trim();
  var w5 = document.getElementById('editW5').value.trim();
  var prev = document.getElementById('editImgPreview');
  var imgUrl = prev._url || (prev.src && !prev.src.endsWith('/') ? prev.src : '') || p[IDX_IMAGE] || '';

  if(!code) { showToast('상품번호를 입력해주세요.', 'warning'); return; }
  if(!name) { showToast('상품명을 입력해주세요.', 'warning'); return; }
  if(!keyword) { showToast('메인 키워드를 입력해주세요.', 'warning'); return; }

  // 메인 행 업데이트
  p[IDX_CODE] = code; p[IDX_NAME] = name; p[IDX_CATEGORY] = cat;
  p[IDX_DETAIL_CAT] = detailCat; p[IDX_PRICE] = price || 0;
  p[IDX_KEYWORD] = keyword; p[IDX_IMAGE] = imgUrl;
  p[5]=w1; p[6]=w2; p[7]=w3; p[8]=w4; p[9]=w5;

  // 체크 저장
  p[IDX_CHECK] = document.getElementById('editCheck').checked;

  // 보조 키워드 처리
  var subBlocks = document.querySelectorAll('#editSubKeywordsWrap .prod-modal-sub-block');
  subBlocks.forEach(block => {
    var subIdx   = block.dataset.subIdx;
    var isDeleted = block.dataset.deleted === 'true';
    var kwEl     = block.querySelector('.edit-sub-kw');
    var kw       = kwEl ? kwEl.value.trim() : '';

    // 보조 키워드 주차 순위 읽기
    var sw1 = block.querySelector('.edit-sub-w1') ? block.querySelector('.edit-sub-w1').value.trim() : '';
    var sw2 = block.querySelector('.edit-sub-w2') ? block.querySelector('.edit-sub-w2').value.trim() : '';
    var sw3 = block.querySelector('.edit-sub-w3') ? block.querySelector('.edit-sub-w3').value.trim() : '';
    var sw4 = block.querySelector('.edit-sub-w4') ? block.querySelector('.edit-sub-w4').value.trim() : '';
    var sw5 = block.querySelector('.edit-sub-w5') ? block.querySelector('.edit-sub-w5').value.trim() : '';

    if(String(subIdx).startsWith('new_')) {
      // 새로 추가된 보조 키워드
      if(kw && !isDeleted) {
        var newSub = new Array(17).fill('');
        newSub[IDX_CODE] = code; newSub[IDX_NAME] = name;
        newSub[IDX_PRICE] = price || 0; newSub[IDX_CATEGORY] = cat;
        newSub[IDX_KEYWORD] = kw; newSub[IDX_REMARK] = '[]';
        newSub[IDX_CHECK] = false; newSub[IDX_IMAGE] = imgUrl;
        newSub[IDX_DETAIL_CAT] = detailCat; newSub[14] = null;
        newSub[IDX_TYPE] = p[IDX_TYPE]; newSub[IDX_COMPANY] = p[IDX_COMPANY] || '';
        newSub[5]=sw1; newSub[6]=sw2; newSub[7]=sw3; newSub[8]=sw4; newSub[9]=sw5;
        products.splice(_editProductIndex + 1, 0, newSub);
      }
    } else {
      var si = parseInt(subIdx);
      if(!isNaN(si) && products[si]) {
        if(isDeleted || !kw) {
          products.splice(si, 1);
        } else {
          products[si][IDX_CODE] = code; products[si][IDX_NAME] = name;
          products[si][IDX_CATEGORY] = cat; products[si][IDX_DETAIL_CAT] = detailCat;
          products[si][IDX_PRICE] = price || 0; products[si][IDX_IMAGE] = imgUrl;
          products[si][IDX_KEYWORD] = kw;
          products[si][5]=sw1; products[si][6]=sw2; products[si][7]=sw3; products[si][8]=sw4; products[si][9]=sw5;
        }
      }
    }
  });

  // 탭이 바뀌었으면 탭 이동, 아니면 리렌더
  if(cat !== currentTab) setTab(cat);
  else renderRanking();

  // 키워드가 변경된 경우 DB에서 이전 키워드 row 삭제
  var changedOldKeywords = [];
  // 메인 행 키워드 변경 확인
  if(_editOriginalKeywords[_editProductIndex] && _editOriginalKeywords[_editProductIndex] !== keyword) {
    changedOldKeywords.push({ code: code, oldKeyword: _editOriginalKeywords[_editProductIndex] });
  }
  // 보조 행 키워드 변경 확인
  _editSubIndices.forEach(si => {
    var newKw = products[si] ? products[si][IDX_KEYWORD] : null;
    if(newKw && _editOriginalKeywords[si] && _editOriginalKeywords[si] !== newKw) {
      changedOldKeywords.push({ code: code, oldKeyword: _editOriginalKeywords[si] });
    }
  });
  if(changedOldKeywords.length > 0 && supabaseClient) {
    changedOldKeywords.forEach(async ({ code: c, oldKeyword }) => {
      await supabaseClient.from('product_rankings')
        .delete()
        .eq('code', c)
        .eq('keyword', oldKeyword);
      await supabaseClient.from('ranking_history')
        .delete()
        .eq('product_code', c)
        .eq('keyword', oldKeyword);
    });
    showToast('키워드 변경으로 이전 데이터가 정리되었습니다.', 'info');
  }

  document.getElementById('productEditModal').style.display = 'none';
  _editProductIndex = -1; _editSubIndices = []; _editOriginalKeywords = {};

  showToast('저장 중...', 'info');
  saveData(true); // 즉시 DB 저장
};