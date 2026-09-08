/* ===============================================================
   js/pricing-product-code.js — 단가표 결과행별 네이버 상품번호
   두께 행마다 상품번호를 저장해두고, 엑셀 없이 화면에서 바로 복사/붙여넣기 한다.

   [Supabase 테이블 DDL — sql/pricing_product_codes.sql 참고, 최초 1회 실행]

   [index.html 적용]
   pricing-highlight.js 다음 줄에 추가:
   <script src="js/pricing-product-code.js"></script>
   =============================================================== */

/* ═══════════════════════════════════════
   인메모리 캐시 — { "tabId|gradeId|thickness": "상품번호" }
   경쟁사가(competitor_prices)와 달리 탭/등급별로 나눠서 불러올 이유가 없을 만큼
   가벼운 데이터라(행 하나당 문자열 하나) 페이지 열 때 전체를 한 번에 불러온다.
═══════════════════════════════════════ */
let _pcCache = {};
function _pcKey(tabId, gradeId, t) { return `${tabId}|${gradeId}|${t}`; }

async function _loadProductCodes() {
  if (typeof supabaseClient === 'undefined') return;
  try {
    const { data: rows, error } = await supabaseClient
      .from('pricing_product_codes')
      .select('tab_id,grade_id,thickness,product_code');
    if (error) throw error;
    _pcCache = {};
    (rows || []).forEach(r => {
      if (r.product_code) _pcCache[_pcKey(r.tab_id, r.grade_id, r.thickness)] = r.product_code;
    });
  } catch (e) { console.warn('[상품번호] 로드 실패', e); }
}

async function _savePc(tabId, gradeId, t, code) {
  if (typeof supabaseClient === 'undefined') return;
  const key = _pcKey(tabId, gradeId, t);
  try {
    const { error } = await supabaseClient.from('pricing_product_codes').upsert(
      { tab_id: tabId, grade_id: gradeId, thickness: Number(t), product_code: code || null },
      { onConflict: 'tab_id,grade_id,thickness' }
    );
    if (error) throw error;
    if (code) _pcCache[key] = code; else delete _pcCache[key];
  } catch (e) {
    console.warn('[상품번호] 저장 실패', e);
    if (typeof showToast === 'function') showToast('상품번호 저장 실패', 'error');
  }
}

/* ═══════════════════════════════════════
   단일 셀 편집 — input에서 포커스 빠질 때 저장
═══════════════════════════════════════ */
window._onPcInputBlur = function(el) {
  const { tab, grade, t } = el.dataset;
  const code = el.value.trim();
  const key = _pcKey(tab, grade, t);
  if ((_pcCache[key] || '') === code) return; // 변화 없으면 저장 스킵
  _savePc(tab, grade, Number(t), code);
};

/* ═══════════════════════════════════════
   결과 테이블에 "상품번호" 컬럼 주입
   경쟁사 컬럼(_injectCompColumns)과 같은 방식 — recalc할 때마다 tbody가 통째로
   갈아끼워지므로 매번 다시 붙인다. 캐시를 페이지 로드 때 전부 불러두기 때문에
   경쟁사가처럼 매번 다시 조회할 필요는 없다(동기적으로 바로 그림).
═══════════════════════════════════════ */
function _injectProductCodeColumn(tabId, gradeId) {
  const tbodyId = `${tabId}TableBody`;
  const tbody   = document.getElementById(tbodyId);
  if (!tbody) return;
  const table = tbody.closest('table');
  if (!table) return;

  table.querySelectorAll('thead .pcode-th').forEach(el => el.remove());
  table.querySelectorAll('colgroup .pcode-col').forEach(el => el.remove());
  tbody.querySelectorAll('.pcode-td').forEach(el => el.remove());

  const thead    = table.querySelector('thead');
  const theadTrs = thead ? Array.from(thead.querySelectorAll('tr')) : [];
  if (theadTrs.length >= 1) {
    const th = document.createElement('th');
    th.rowSpan   = theadTrs.length >= 2 ? 2 : 1;
    th.className = 'pcode-th';
    th.innerHTML = `<div class="pcode-th-inner">상품번호
      <button class="pcode-bulk-btn" title="상품번호 일괄 입력·복사"
        onclick="openPcBulkModal('${tabId}','${gradeId}')"><i class="fa-solid fa-list-ol"></i></button>
    </div>`;
    theadTrs[0].appendChild(th);
  }

  const colgroup = table.querySelector('colgroup');
  if (colgroup) {
    const col = document.createElement('col');
    col.className = 'pcode-col';
    col.style.width = '130px';
    colgroup.appendChild(col);
  }

  tbody.querySelectorAll('tr').forEach(tr => {
    const thickCell = tr.querySelector('.td-thick');
    const t = thickCell ? parseInt(thickCell.textContent.trim()) : NaN;
    const td = document.createElement('td');
    td.className = 'pcode-td';
    if (!isNaN(t)) {
      const code = _pcCache[_pcKey(tabId, gradeId, t)] || '';
      const safe = code.replace(/"/g, '&quot;');
      td.innerHTML = `<input type="text" class="pcode-input" value="${safe}" placeholder="상품번호"
        data-tab="${tabId}" data-grade="${gradeId}" data-t="${t}"
        onblur="_onPcInputBlur(this)" onkeydown="if(event.key==='Enter') this.blur()">`;
    }
    tr.appendChild(td);
  });
}

/* ═══════════════════════════════════════
   일괄 입력·복사 모달
   2026-09-08: "옵션마다 상품번호를 엑셀 없이 화면에서 바로 붙여넣고 복사하고 싶다"는
   요청 — 두께가 큰 것부터 작은 것 순서로 한 줄에 하나씩(등록 안 된 얇은 두께는
   생략 가능) 붙여넣으면 두꺼운 쪽부터 채워지고, 반대로 복사할 때도 같은 순서로
   줄바꿈(기본) 또는 쉼표로 이어붙여 클립보드에 담는다. 등급(서브탭) 단위로만
   동작 — 등급이 여러 개 섞인 채로 한 번에 옮기면 어디까지가 어느 등급인지
   구분할 방법이 없어서, 등급을 바꿔가며 각각 붙여넣는 방식으로 뒀다.
═══════════════════════════════════════ */
let _pcBulkCtx = null;

function _ensurePcBulkModal() {
  if (document.getElementById('pcBulkModal')) return;
  const div = document.createElement('div');
  div.id = 'pcBulkModal';
  div.className = 'pcode-modal-overlay';
  div.style.display = 'none';
  div.innerHTML = `
    <div class="pcode-modal-box">
      <div class="pcode-modal-title">상품번호 일괄 입력·복사</div>
      <div class="pcode-modal-sub" id="pcBulkModalSub"></div>
      <div class="pcode-modal-hint">두께 큰 것부터 작은 순서로 한 줄에 하나씩 — 등록 안 된 얇은 두께는 생략해도 됩니다.
        현재 저장된 값이 미리 채워져 있으니, 복사만 하려면 바로 "클립보드로 복사"를 누르면 됩니다.</div>
      <textarea id="pcBulkTextarea" class="pcode-textarea" rows="14" spellcheck="false"></textarea>
      <div class="pcode-modal-actions">
        <label class="pcode-comma-toggle"><input type="checkbox" id="pcBulkCommaMode"> 쉼표로 복사</label>
        <button class="pricing-margin-edit-btn" onclick="copyPcBulkToClipboard()"><i class="fa-solid fa-copy"></i> 클립보드로 복사</button>
        <div style="flex:1"></div>
        <button class="pricing-margin-edit-btn" onclick="closePcBulkModal()">취소</button>
        <button class="pricing-margin-edit-btn primary" onclick="applyPcBulkModal()"><i class="fa-solid fa-check"></i> 적용</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  div.addEventListener('click', e => { if (e.target === div) closePcBulkModal(); });
}

window.openPcBulkModal = function(tabId, gradeId) {
  if (window.currentUser?.role !== 'admin') return;
  const grade = (window._gradesOf?.(tabId) || []).find(g => g.id === gradeId);
  if (!grade) return;
  const rows = (window._rowsOf?.(tabId, grade) || []).slice().sort((a, b) => b - a); // 내림차순(큰 두께 먼저)
  if (!rows.length) return;
  _pcBulkCtx = { tabId, gradeId, rows };

  _ensurePcBulkModal();
  const codes = rows.map(t => _pcCache[_pcKey(tabId, gradeId, t)] || '');
  let lastFilled = -1;
  codes.forEach((c, i) => { if (c) lastFilled = i; });
  const visible = codes.slice(0, lastFilled + 1);

  document.getElementById('pcBulkTextarea').value = visible.join('\n');
  const label = `${grade.label || ''}${grade.sub ? ' ' + grade.sub : ''}`.trim() || gradeId;
  document.getElementById('pcBulkModalSub').textContent =
    `${tabId} / ${label} — 두께 ${rows[0]}T → ${rows[rows.length - 1]}T 순서 (총 ${rows.length}행)`;
  document.getElementById('pcBulkModal').style.display = 'flex';
};

window.closePcBulkModal = function() {
  const modal = document.getElementById('pcBulkModal');
  if (modal) modal.style.display = 'none';
};

window.copyPcBulkToClipboard = async function() {
  const ta = document.getElementById('pcBulkTextarea');
  if (!ta) return;
  const commaMode = document.getElementById('pcBulkCommaMode')?.checked;
  const lines = ta.value.split(/\r?\n/);
  const text  = commaMode ? lines.join(',') : lines.join('\n');
  try {
    await navigator.clipboard.writeText(text);
    if (typeof showToast === 'function') showToast(`클립보드에 복사되었습니다 (${lines.filter(l => l.trim()).length}개)`, 'success');
  } catch (e) {
    console.warn('[상품번호] 클립보드 복사 실패', e);
    if (typeof showToast === 'function') showToast('클립보드 복사 실패 — 직접 선택해서 복사해주세요', 'error');
  }
};

window.applyPcBulkModal = async function() {
  const ctx = _pcBulkCtx;
  if (!ctx) return;
  const { tabId, gradeId, rows } = ctx;
  const raw = document.getElementById('pcBulkTextarea')?.value ?? '';
  let lines = raw.split(/\r?\n/).map(s => s.trim());
  // 줄바꿈 없이 쉼표만으로 붙여넣은 경우도 허용
  if (lines.length === 1 && lines[0].includes(',')) lines = lines[0].split(',').map(s => s.trim());

  if (lines.length > rows.length && typeof showToast === 'function') {
    showToast(`두께 행(${rows.length}개)보다 입력한 줄(${lines.length}개)이 더 많아서 앞쪽 ${rows.length}개만 반영됩니다.`, 'warning');
  }

  let changed = 0;
  for (let i = 0; i < rows.length; i++) {
    const t    = rows[i];
    const code = (lines[i] || '').trim();
    const key  = _pcKey(tabId, gradeId, t);
    if ((_pcCache[key] || '') === code) continue;
    await _savePc(tabId, gradeId, t, code);
    changed++;
  }

  closePcBulkModal();
  _injectProductCodeColumn(tabId, gradeId);
  if (typeof showToast === 'function') {
    showToast(`상품번호 ${changed}건 반영됨`, changed ? 'success' : 'warning');
  }
};

/* ═══════════════════════════════════════
   pricing.js / pricing-competitor.js 연동
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  await _loadProductCodes();

  const tabId0 = window._activePricingTab || 'isopink';

  /* recalcXxx — 표가 다시 그려질 때마다 상품번호 컬럼도 다시 붙인다(경쟁사 컬럼보다
     나중에 로드되므로, 경쟁사 컬럼이 원가/마진을 다시 그릴 때 지워버려도 그 뒤에
     다시 한 번 더 붙여서 항상 맨 오른쪽에 남는다). */
  ['isopink', 'bead', 'pu', 'pf', 'fr'].forEach(tabId => {
    const key   = `recalc${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`;
    const _orig = window[key];
    window[key] = function() {
      _orig?.();
      const gradeId = window._subtabState?.[tabId] || (tabId === 'isopink' ? 'isopink' : '');
      if (gradeId) _injectProductCodeColumn(tabId, gradeId);
    };
  });

  /* setPricingTab (상품 탭 전환) */
  const _origSetTab = window.setPricingTab;
  window.setPricingTab = function(tabId, el) {
    _origSetTab?.(tabId, el);
    const gradeId = window._subtabState?.[tabId] || (tabId === 'isopink' ? 'isopink' : '');
    if (gradeId) Promise.resolve().then(() => _injectProductCodeColumn(tabId, gradeId));
  };

  /* 서브탭 전환 */
  const subtabFns = { isopink: 'setIsopinkSubtab', bead: 'setBeadSubtab', pu: 'setPuSubtab', pf: 'setPfSubtab', fr: 'setFrSubtab' };
  Object.entries(subtabFns).forEach(([tabId, fnKey]) => {
    const _orig = window[fnKey];
    window[fnKey] = function(gradeId, btnEl) {
      _orig?.(gradeId, btnEl);
      Promise.resolve().then(() => _injectProductCodeColumn(tabId, gradeId));
    };
  });

  /* viewHistory — 원가/마진만 바뀌지 상품번호는 이력과 무관하니 다시 그려주기만 함 */
  const _origView = window.viewHistory;
  window.viewHistory = function(idx) {
    _origView?.(idx);
    const tabId   = window._activePricingTab || 'isopink';
    const gradeId = window._subtabState?.[tabId] || (tabId === 'isopink' ? 'isopink' : '');
    if (gradeId) _injectProductCodeColumn(tabId, gradeId);
  };

  /* 최초 진입 시(이미 단가표 탭이 열려있는 상태로 로드됐다면) 바로 한 번 그려준다 */
  const gradeId0 = window._subtabState?.[tabId0] || (tabId0 === 'isopink' ? 'isopink' : '');
  if (gradeId0) _injectProductCodeColumn(tabId0, gradeId0);
});

/* ═══════════════════════════════════════
   CSS
═══════════════════════════════════════ */
(function injectCSS() {
  const style = document.createElement('style');
  style.textContent = `
.pcode-th {
  background: #f8fafc;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  padding: 6px 5px;
  border-left: 2px solid #e2e8f0;
  vertical-align: middle;
  white-space: nowrap;
}
.pcode-th-inner { display: flex; align-items: center; justify-content: center; gap: 5px; }
.pcode-bulk-btn {
  border: none; background: #e2e8f0; color: #475569; border-radius: 4px;
  width: 20px; height: 20px; font-size: 10px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.pcode-bulk-btn:hover { background: #cbd5e1; }
.pcode-td {
  padding: 3px 5px;
  border-left: 2px solid #e2e8f0;
  background: #fafafa;
}
.pcode-input {
  width: 100%; box-sizing: border-box;
  border: 1px solid transparent; background: transparent;
  font-size: 11px; color: #334155; text-align: center;
  padding: 4px 3px; border-radius: 4px;
}
.pcode-input:hover { border-color: #e2e8f0; background: #fff; }
.pcode-input:focus { outline: none; border-color: #94a3b8; background: #fff; }

.pcode-modal-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,.45);
  display: flex; align-items: center; justify-content: center; z-index: 3000;
}
.pcode-modal-box {
  background: #fff; border-radius: 10px; width: 480px; max-width: 92vw;
  padding: 18px 20px; box-shadow: 0 12px 32px rgba(0,0,0,.25);
}
.pcode-modal-title { font-size: 15px; font-weight: 700; color: #1e293b; }
.pcode-modal-sub { font-size: 12px; color: #64748b; margin-top: 3px; }
.pcode-modal-hint { font-size: 11px; color: #94a3b8; margin: 8px 0; line-height: 1.5; }
.pcode-textarea {
  width: 100%; box-sizing: border-box; resize: vertical;
  border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px;
  font-size: 12px; font-family: ui-monospace, monospace; color: #334155;
}
.pcode-modal-actions { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
.pcode-comma-toggle { font-size: 11px; color: #64748b; display: flex; align-items: center; gap: 4px; }
.pcode-modal-actions .primary { background: #2563eb; color: #fff; }
  `;
  document.head.appendChild(style);
})();
