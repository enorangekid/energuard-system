/* ===============================================================
   js/pricing-highlight.js — 단가표 두께 행 하이라이트
   두께(td-thick) 셀 클릭 → 행 전체 노랑 하이라이트 토글
   Supabase pricing_highlights 테이블에 저장

   [DDL — 최초 1회 실행]
   CREATE TABLE pricing_highlights (
     id         bigserial PRIMARY KEY,
     tab_id     text NOT NULL,
     grade_id   text NOT NULL,
     thickness  integer NOT NULL,
     UNIQUE(tab_id, grade_id, thickness)
   );

   [index.html 적용]
   pricing-competitor.js 다음 줄에 추가:
   <script src="js/pricing-highlight.js"></script>
   =============================================================== */

/* ═══════════════════════════════════════
   인메모리 캐시 — Set으로 관리
   key: "tabId|gradeId|thickness"
═══════════════════════════════════════ */
const _hlCache = new Set();

function _hlKey(tabId, gradeId, t) {
  return `${tabId}|${gradeId}|${t}`;
}

/* ═══════════════════════════════════════
   Supabase 유틸
═══════════════════════════════════════ */
function _hlHeaders() {
  const key = supabaseClient?.supabaseKey || '';
  return {
    'apikey':        key,
    'Authorization': 'Bearer ' + key,
    'Content-Type':  'application/json',
  };
}

/* 전체 하이라이트 로드 */
async function _loadHighlights() {
  if (typeof supabaseClient === 'undefined') return;
  try {
    const res = await fetch(
      `${supabaseClient.supabaseUrl}/rest/v1/pricing_highlights?select=tab_id,grade_id,thickness`,
      { headers: _hlHeaders() }
    );
    const rows = await res.json();
    if (!Array.isArray(rows)) return;
    _hlCache.clear();
    rows.forEach(r => _hlCache.add(_hlKey(r.tab_id, r.grade_id, r.thickness)));
  } catch(e) { console.warn('[Highlight] 로드 실패', e); }
}

/* 하이라이트 추가 */
async function _addHighlight(tabId, gradeId, t) {
  if (typeof supabaseClient === 'undefined') return;
  _hlCache.add(_hlKey(tabId, gradeId, t));
  try {
    await fetch(
      `${supabaseClient.supabaseUrl}/rest/v1/pricing_highlights?on_conflict=tab_id,grade_id,thickness`,
      {
        method: 'POST',
        headers: { ..._hlHeaders(), 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ tab_id: tabId, grade_id: gradeId, thickness: Number(t) }),
      }
    );
  } catch(e) { console.warn('[Highlight] 추가 실패', e); }
}

/* 하이라이트 제거 */
async function _removeHighlight(tabId, gradeId, t) {
  if (typeof supabaseClient === 'undefined') return;
  _hlCache.delete(_hlKey(tabId, gradeId, t));
  try {
    await fetch(
      `${supabaseClient.supabaseUrl}/rest/v1/pricing_highlights?tab_id=eq.${tabId}&grade_id=eq.${gradeId}&thickness=eq.${t}`,
      { method: 'DELETE', headers: _hlHeaders() }
    );
  } catch(e) { console.warn('[Highlight] 제거 실패', e); }
}

/* ═══════════════════════════════════════
   DOM 적용 — 현재 보이는 tbody에 하이라이트 클래스 적용
═══════════════════════════════════════ */
function _activeGradeIdHL(tabId) {
  return tabId === 'isopink' ? 'isopink' : (window._subtabState?.[tabId] || '');
}

window._applyHighlights = function() {
  const tabId   = window._activePricingTab || 'isopink';
  const gradeId = _activeGradeIdHL(tabId);
  const tbodyId = tabId === 'isopink' ? 'pricingTableBody' : `${tabId}TableBody`;
  const tbody   = document.getElementById(tbodyId);
  if (!tbody) return;

  tbody.querySelectorAll('tr[data-t]').forEach(tr => {
    const t   = parseInt(tr.dataset.t);
    const key = _hlKey(tabId, gradeId, t);
    if (_hlCache.has(key)) {
      tr.classList.add('hl-row');
    } else {
      tr.classList.remove('hl-row');
    }
  });
};

/* ═══════════════════════════════════════
   클릭 토글 — tbody 이벤트 위임
═══════════════════════════════════════ */
function _onThickClick(e) {
  // admin만 토글 가능
  if (window.currentUser?.role !== 'admin') return;

  const td = e.target.closest('.td-thick');
  if (!td) return;

  const tr      = td.closest('tr[data-t]');
  if (!tr) return;

  const t       = parseInt(tr.dataset.t);
  const tabId   = window._activePricingTab || 'isopink';
  const gradeId = _activeGradeIdHL(tabId);
  const key     = _hlKey(tabId, gradeId, t);

  if (_hlCache.has(key)) {
    tr.classList.remove('hl-row');
    _removeHighlight(tabId, gradeId, t);
  } else {
    tr.classList.add('hl-row');
    _addHighlight(tabId, gradeId, t);
  }
}

/* ═══════════════════════════════════════
   pricing.js 함수 후킹
   — recalc 완료 후 하이라이트 재적용
   — setPricingTab / 서브탭 전환 후 재적용
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. 전체 하이라이트 데이터 로드
  await _loadHighlights();

  // 2. tbody 클릭 이벤트 등록 (이벤트 위임)
  ['pricingTableBody','beadTableBody','puTableBody','pfTableBody','frTableBody'].forEach(id => {
    // tbody가 나중에 동적 생성되므로 부모에 위임
    const pane = document.getElementById('page-pricing');
    if (pane && !pane._hlRegistered) {
      pane.addEventListener('click', _onThickClick);
      pane._hlRegistered = true;
    }
  });

  // 3. recalcPricing 후킹 (아이소핑크)
  const _origRecalc = window.recalcPricing;
  window.recalcPricing = function() {
    _origRecalc?.();
    window._applyHighlights();
  };

  // 4. recalcBead/Pu/Pf/Fr 후킹
  ['bead','pu','pf','fr'].forEach(tabId => {
    const key   = `recalc${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`;
    const _orig = window[key];
    window[key] = function() {
      _orig?.();
      window._applyHighlights();
    };
  });

  // 5. setPricingTab 후킹
  const _origSetTab = window.setPricingTab;
  window.setPricingTab = function(tabId, el) {
    _origSetTab?.(tabId, el);
    Promise.resolve().then(() => window._applyHighlights());
  };

  // 6. 서브탭 후킹
  const subtabFns = { bead:'setBeadSubtab', pu:'setPuSubtab', pf:'setPfSubtab', fr:'setFrSubtab' };
  Object.entries(subtabFns).forEach(([tabId, fnKey]) => {
    const _orig = window[fnKey];
    window[fnKey] = function(gradeId, btnEl) {
      _orig?.(gradeId, btnEl);
      Promise.resolve().then(() => window._applyHighlights());
    };
  });
});

/* ═══════════════════════════════════════
   CSS 인젝션
═══════════════════════════════════════ */
(function injectCSS() {
  const style = document.createElement('style');
  style.textContent = `
/* 하이라이트 행 */
.hl-row td {
  background-color: #fffbeb !important;
  border-top: 1px solid #f59e0b !important;
  border-bottom: 1px solid #f59e0b !important;
}
.hl-row .td-highlight {
  background-color: #fef3c7 !important;
}

/* 두께 셀 클릭 커서 (admin) */
.td-thick {
  cursor: pointer;
  user-select: none;
  position: relative;
}
.td-thick:hover::after {
  content: '●';
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 8px;
  color: #f59e0b;
  opacity: 0.6;
}
.hl-row .td-thick {
  color: #d97706 !important;
  font-weight: 700 !important;
}
.hl-row .td-thick::after {
  content: '★';
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 9px;
  color: #f59e0b;
  opacity: 1;
}
  `;
  document.head.appendChild(style);
})();
