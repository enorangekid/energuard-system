/* ===============================================================
   js/pricing-danpum-code.js — 단가표 두께 행별 "단품" 상품코드
   두께마다 개별로 등록된 네이버 상품코드를 클릭 한 번에 클립보드로 복사한다
   (엑셀 없이 화면에서 바로 네이버 상품관리 검색창에 붙여넣기 위함).

   [Supabase 테이블 DDL — sql/pricing_danpum_codes.sql 참고, 최초 1회 실행]

   [index.html 적용]
   pricing-highlight.js 다음 줄에 추가:
   <script src="js/pricing-danpum-code.js"></script>
   =============================================================== */

/* ═══════════════════════════════════════
   인메모리 캐시 — { "tabId|gradeId|thickness": "상품코드" }
═══════════════════════════════════════ */
let _dpCache = {};
function _dpKey(tabId, gradeId, t) { return `${tabId}|${gradeId}|${t}`; }

async function _loadDanpumCodes() {
  if (typeof supabaseClient === 'undefined') return;
  try {
    const { data, error } = await supabaseClient
      .from('pricing_danpum_codes')
      .select('tab_id,grade_id,thickness,product_code');
    if (error) throw error;
    _dpCache = {};
    (data || []).forEach(r => {
      if (r.product_code) _dpCache[_dpKey(r.tab_id, r.grade_id, r.thickness)] = r.product_code;
    });
  } catch (e) { console.warn('[단품 코드] 로드 실패', e); }
}

async function _saveDanpumCode(tabId, gradeId, t, code) {
  if (typeof supabaseClient === 'undefined') return;
  const key = _dpKey(tabId, gradeId, t);
  try {
    const { error } = await supabaseClient.from('pricing_danpum_codes').upsert(
      { tab_id: tabId, grade_id: gradeId, thickness: Number(t), product_code: code || null },
      { onConflict: 'tab_id,grade_id,thickness' }
    );
    if (error) throw error;
    if (code) _dpCache[key] = code; else delete _dpCache[key];
    window._rerenderPricingTab?.(tabId);
    if (typeof showToast === 'function') showToast('저장되었습니다', 'success');
  } catch (e) {
    console.warn('[단품 코드] 저장 실패', e);
    if (typeof showToast === 'function') showToast('저장 실패 — pricing_danpum_codes 테이블을 확인해주세요', 'error');
  }
}

window.copyDanpumCode = function(tabId, gradeId, t) {
  const code = _dpCache[_dpKey(tabId, gradeId, t)];
  if (code) { window._copyToClipboard?.(code); return; }
  if (window.currentUser?.role !== 'admin') {
    if (typeof showToast === 'function') showToast('등록된 단품 코드가 없습니다.', 'warning');
    return;
  }
  window.editDanpumCode(tabId, gradeId, t);
};
window.editDanpumCode = function(tabId, gradeId, t) {
  if (window.currentUser?.role !== 'admin') return;
  const cur  = _dpCache[_dpKey(tabId, gradeId, t)] || '';
  const code = prompt(`${t}T 단품 상품코드를 입력하세요 (비우면 삭제):`, cur);
  if (code === null) return;
  _saveDanpumCode(tabId, gradeId, t, code.trim());
};

/* ═══════════════════════════════════════
   결과 테이블에 "단품" 컬럼 주입 — 두께 컬럼 바로 뒤에 아이콘 버튼 하나만
   (경쟁사가/모음전 버튼과 달리 늘 붙어있는 값이라 별도 열 대신 두께 옆에 붙임)
═══════════════════════════════════════ */
function _injectDanpumColumn(tabId, gradeId) {
  const tbodyId = `${tabId}TableBody`;
  const tbody   = document.getElementById(tbodyId);
  if (!tbody) return;
  const table = tbody.closest('table');
  if (!table) return;

  table.querySelectorAll('thead .dp-th').forEach(el => el.remove());
  tbody.querySelectorAll('.dp-td').forEach(el => el.remove());

  const thead    = table.querySelector('thead');
  const thThick  = thead ? thead.querySelector('.th-thick') : null;
  if (thThick) {
    const th = document.createElement('th');
    th.rowSpan   = 2;
    th.className = 'dp-th';
    th.textContent = '단품';
    thThick.insertAdjacentElement('afterend', th);
  }

  tbody.querySelectorAll('tr').forEach(tr => {
    const thickCell = tr.querySelector('.td-thick');
    if (!thickCell) return;
    const t = parseInt(thickCell.textContent.trim());
    if (isNaN(t)) return;
    const td = document.createElement('td');
    td.className = 'dp-td';
    const has = !!_dpCache[_dpKey(tabId, gradeId, t)];
    td.innerHTML = `<button type="button" class="dp-btn${has ? '' : ' dp-empty'}"
      title="${has ? '클릭: 복사 / 우클릭: 변경' : '클릭: 코드 등록'}"
      onclick="event.stopPropagation();copyDanpumCode('${tabId}','${gradeId}',${t})"
      oncontextmenu="event.preventDefault();event.stopPropagation();editDanpumCode('${tabId}','${gradeId}',${t})">
      <i class="fa-solid fa-copy"></i></button>`;
    thickCell.insertAdjacentElement('afterend', td);
  });
}

/* ═══════════════════════════════════════
   pricing.js / pricing-competitor.js 연동
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  await _loadDanpumCodes();

  ['isopink', 'bead', 'pu', 'pf', 'fr'].forEach(tabId => {
    const key   = `recalc${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`;
    const _orig = window[key];
    window[key] = function() {
      _orig?.();
      const gradeId = window._subtabState?.[tabId] || (tabId === 'isopink' ? 'isopink' : '');
      if (gradeId) _injectDanpumColumn(tabId, gradeId);
    };
  });

  const _origSetTab = window.setPricingTab;
  window.setPricingTab = function(tabId, el) {
    _origSetTab?.(tabId, el);
    const gradeId = window._subtabState?.[tabId] || (tabId === 'isopink' ? 'isopink' : '');
    if (gradeId) Promise.resolve().then(() => _injectDanpumColumn(tabId, gradeId));
  };

  const subtabFns = { isopink: 'setIsopinkSubtab', bead: 'setBeadSubtab', pu: 'setPuSubtab', pf: 'setPfSubtab', fr: 'setFrSubtab' };
  Object.entries(subtabFns).forEach(([tabId, fnKey]) => {
    const _orig = window[fnKey];
    window[fnKey] = function(gradeId, btnEl) {
      _orig?.(gradeId, btnEl);
      Promise.resolve().then(() => _injectDanpumColumn(tabId, gradeId));
    };
  });

  const _origView = window.viewHistory;
  window.viewHistory = function(idx) {
    _origView?.(idx);
    const tabId   = window._activePricingTab || 'isopink';
    const gradeId = window._subtabState?.[tabId] || (tabId === 'isopink' ? 'isopink' : '');
    if (gradeId) _injectDanpumColumn(tabId, gradeId);
  };

  const tabId0   = window._activePricingTab || 'isopink';
  const gradeId0 = window._subtabState?.[tabId0] || (tabId0 === 'isopink' ? 'isopink' : '');
  if (gradeId0) _injectDanpumColumn(tabId0, gradeId0);
});

/* ═══════════════════════════════════════
   CSS
═══════════════════════════════════════ */
(function injectCSS() {
  const style = document.createElement('style');
  style.textContent = `
.dp-th {
  background: #f8fafc;
  color: #475569;
  font-size: 10px;
  font-weight: 700;
  text-align: center;
  padding: 6px 3px;
  border-left: 2px solid #e2e8f0;
  vertical-align: middle;
  white-space: nowrap;
}
.dp-td {
  text-align: center;
  padding: 3px 2px;
  border-left: 2px solid #e2e8f0;
  background: #fafafa;
}
.dp-btn {
  border: 1px solid #94a3b8;
  background: #fff;
  color: #475569;
  border-radius: 5px;
  width: 26px; height: 22px;
  font-size: 11px;
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.dp-btn:hover { background: #eef2ff; border-color: #6366f1; color: #4338ca; }
.dp-btn.dp-empty { color: #94a3b8; border-color: #cbd5e1; background: #f8fafc; }
.dp-btn.dp-empty:hover { color: #475569; border-color: #94a3b8; background: #eef2ff; }
  `;
  document.head.appendChild(style);
})();
