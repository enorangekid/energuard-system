/* ===============================================================
   js/pricing-danpum-code.js — 단품 상품코드 (두께별 저장, 등급 단위로 일괄 복사)
   두께마다 개별로 등록된 네이버 상품코드를 저장해두고, 품명 셀의 "단품" 버튼을
   클릭하면 그 등급에 저장된 코드를 전부 한 번에 클립보드로 복사한다(개별 두께
   행마다 따로 복사하지 않고 한 번에 복사해서 붙여넣는 게 실제 쓰임새라 이렇게 함,
   2026-09-08 2차 수정). 값 자체는 두께별로 다르므로 저장은 여전히 두께 단위.

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
  } catch (e) {
    console.warn('[단품 코드] 저장 실패', e);
    if (typeof showToast === 'function') showToast('저장 실패 — pricing_danpum_codes 테이블을 확인해주세요', 'error');
    throw e;
  }
}

/* 이 등급에 저장된 단품 코드가 하나라도 있는지(품명 셀 버튼 활성 표시용) */
window._dpHasAny = function(tabId, gradeId) {
  const prefix = `${tabId}|${gradeId}|`;
  return Object.keys(_dpCache).some(k => k.startsWith(prefix));
};

/* 등급의 저장된 단품 코드를 전부(두께 큰 순서) 클립보드에 복사 */
window.copyAllDanpumCodes = function(tabId, gradeId) {
  const grade = (window._gradesOf?.(tabId) || []).find(g => g.id === gradeId);
  const rows  = grade ? (window._rowsOf?.(tabId, grade) || []).slice().sort((a, b) => b - a) : [];
  const codes = rows.map(t => _dpCache[_dpKey(tabId, gradeId, t)]).filter(Boolean);
  if (!codes.length) {
    if (window.currentUser?.role === 'admin') { window.openDpBulkModal(tabId, gradeId); return; }
    if (typeof showToast === 'function') showToast('등록된 단품 코드가 없습니다.', 'warning');
    return;
  }
  window._copyToClipboard?.(codes.join('\n'));
};

/* ═══════════════════════════════════════
   일괄 입력 모달 — 우클릭으로 열림
═══════════════════════════════════════ */
let _dpBulkCtx = null;

function _ensureDpBulkModal() {
  if (document.getElementById('dpBulkModal')) return;
  const div = document.createElement('div');
  div.id = 'dpBulkModal';
  div.className = 'dp-modal-overlay';
  div.style.display = 'none';
  div.innerHTML = `
    <div class="dp-modal-box">
      <div class="dp-modal-title">단품 상품코드 입력</div>
      <div class="dp-modal-sub" id="dpBulkModalSub"></div>
      <div class="dp-modal-hint">붙여넣고 [적용]을 누르면 저장됩니다 — "여기부터 채우기"로 고른 두께부터
        한 줄에 하나씩, 두께가 작아지는 방향으로 채워집니다. 등록된 만큼만 적어도 됩니다.</div>
      <div class="dp-start-row">
        <label for="dpBulkStartT">여기부터 채우기</label>
        <select id="dpBulkStartT"></select>
      </div>
      <textarea id="dpBulkTextarea" class="dp-textarea" rows="14" spellcheck="false" placeholder="한 줄에 하나씩 붙여넣으세요"></textarea>
      <div class="dp-modal-actions">
        <button class="pricing-margin-edit-btn" onclick="closeDpBulkModal()">취소</button>
        <button class="pricing-margin-edit-btn primary" onclick="applyDpBulkModal()"><i class="fa-solid fa-check"></i> 적용</button>
      </div>
    </div>`;
  document.body.appendChild(div);
  div.addEventListener('click', e => { if (e.target === div) closeDpBulkModal(); });
}

window.openDpBulkModal = function(tabId, gradeId) {
  if (window.currentUser?.role !== 'admin') return;
  const grade = (window._gradesOf?.(tabId) || []).find(g => g.id === gradeId);
  if (!grade) return;
  const rows = (window._rowsOf?.(tabId, grade) || []).slice().sort((a, b) => b - a); // 내림차순(큰 두께 먼저)
  if (!rows.length) return;
  _dpBulkCtx = { tabId, gradeId, rows };

  _ensureDpBulkModal();
  const codes = rows.map(t => _dpCache[_dpKey(tabId, gradeId, t)] || '');
  let firstFilled = -1, lastFilled = -1;
  codes.forEach((c, i) => { if (c) { if (firstFilled === -1) firstFilled = i; lastFilled = i; } });
  const visible = firstFilled === -1 ? [] : codes.slice(firstFilled, lastFilled + 1);
  document.getElementById('dpBulkTextarea').value = visible.join('\n');

  const startSel = document.getElementById('dpBulkStartT');
  startSel.innerHTML = rows.map(t => `<option value="${t}">${t}T</option>`).join('');
  startSel.value = String(rows[firstFilled === -1 ? 0 : firstFilled]);

  const label = `${grade.label || ''}${grade.sub ? ' ' + grade.sub : ''}`.trim() || gradeId;
  document.getElementById('dpBulkModalSub').textContent =
    `${tabId} / ${label} — 두께 ${rows[0]}T → ${rows[rows.length - 1]}T 순서 (총 ${rows.length}행)`;
  document.getElementById('dpBulkModal').style.display = 'flex';
};

window.closeDpBulkModal = function() {
  const modal = document.getElementById('dpBulkModal');
  if (modal) modal.style.display = 'none';
};

window.applyDpBulkModal = async function() {
  const ctx = _dpBulkCtx;
  if (!ctx) return;
  const { tabId, gradeId, rows } = ctx;

  const startT = document.getElementById('dpBulkStartT')?.value;
  let startIdx = rows.findIndex(t => String(t) === String(startT));
  if (startIdx === -1) startIdx = 0;
  const targetRows = rows.slice(startIdx);

  const raw = document.getElementById('dpBulkTextarea')?.value ?? '';
  let lines = raw.split(/\r?\n/).map(s => s.trim());
  if (lines.length === 1 && lines[0].includes(',')) lines = lines[0].split(',').map(s => s.trim());

  if (lines.length > targetRows.length && typeof showToast === 'function') {
    showToast(`${rows[startIdx]}T부터 남은 행(${targetRows.length}개)보다 입력한 줄(${lines.length}개)이 더 많아서 앞쪽 ${targetRows.length}개만 반영됩니다.`, 'warning');
  }

  let changed = 0;
  for (let i = 0; i < targetRows.length; i++) {
    const t    = targetRows[i];
    const code = (lines[i] || '').trim();
    const key  = _dpKey(tabId, gradeId, t);
    if ((_dpCache[key] || '') === code) continue;
    await _saveDanpumCode(tabId, gradeId, t, code);
    changed++;
  }

  closeDpBulkModal();
  window._rerenderPricingTab?.(tabId);
  if (typeof showToast === 'function') showToast(`단품 코드 ${changed}건 반영됨`, changed ? 'success' : 'warning');
};

/* ═══════════════════════════════════════
   초기 로드
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  await _loadDanpumCodes();
});

/* ═══════════════════════════════════════
   CSS
═══════════════════════════════════════ */
(function injectCSS() {
  const style = document.createElement('style');
  style.textContent = `
.dp-modal-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,.45);
  display: flex; align-items: center; justify-content: center; z-index: 3000;
}
.dp-modal-box {
  background: #fff; border-radius: 10px; width: 460px; max-width: 92vw;
  padding: 18px 20px; box-shadow: 0 12px 32px rgba(0,0,0,.25);
}
.dp-modal-title { font-size: 15px; font-weight: 700; color: #1e293b; }
.dp-modal-sub { font-size: 12px; color: #64748b; margin-top: 3px; }
.dp-modal-hint { font-size: 11px; color: #94a3b8; margin: 8px 0; line-height: 1.5; }
.dp-start-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.dp-start-row label { font-size: 12px; font-weight: 600; color: #334155; }
.dp-start-row select {
  border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px;
  font-size: 12px; color: #334155;
}
.dp-textarea {
  width: 100%; box-sizing: border-box; resize: vertical;
  border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px;
  font-size: 12px; font-family: ui-monospace, monospace; color: #334155;
}
.dp-modal-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 10px; }
.dp-modal-actions .primary { background: #2563eb; color: #fff; }
  `;
  document.head.appendChild(style);
})();
