/* ===============================================================
   js/pricing-competitor.js  —  에너가드컴퍼니 경쟁사 단가 비교
   단가표 테이블 우측에 경쟁사 컬럼을 인라인으로 추가

   [Supabase 테이블 DDL — 최초 1회 실행]
   -- comp{n}_link: 그 경쟁사 가격의 상품 페이지 URL(loadCompPrices/saveCompPrice가 씀).
   -- 예전 이 주석엔 안 적혀있었는데 실제 코드/저장은 계속 이 컬럼을 썼음 — 문서만 갱신함
   -- (2026-09-02). 이미 가격이 잘 저장/로드되고 있었다면 이 컬럼은 이미 있는 것임(select가
   -- 컬럼 하나라도 없으면 통째로 실패해서 가격까지 안 불러와지므로).
   CREATE TABLE competitor_prices (
     id            bigserial PRIMARY KEY,
     tab_id        text NOT NULL,
     grade_id      text NOT NULL,
     thickness     integer NOT NULL,
     comp1_price   integer,
     comp1_link    text,
     comp2_price   integer,
     comp2_link    text,
     comp3_price   integer,
     comp3_link    text,
     updated_at    timestamptz DEFAULT now(),
     UNIQUE(tab_id, grade_id, thickness)
   );
   ALTER TABLE competitor_prices DISABLE ROW LEVEL SECURITY;
   -- 이미 테이블이 있는데 링크 컬럼만 없다면:
   -- ALTER TABLE competitor_prices ADD COLUMN IF NOT EXISTS comp1_link text;
   -- ALTER TABLE competitor_prices ADD COLUMN IF NOT EXISTS comp2_link text;
   -- ALTER TABLE competitor_prices ADD COLUMN IF NOT EXISTS comp3_link text;

   -- 경쟁사 이름(탭별 3곳) — editCompName/_saveCompMeta가 쓰는 테이블.
   -- 2026-09-02: 이 테이블이 아예 없거나 RLS에 막혀 저장이 조용히 실패하는데도
   -- "저장되었습니다" 토스트가 뜨던 버그가 있었다(호출부가 에러를 삼켰음, 수정함).
   -- 이름 변경이 새로고침 후 원래대로 돌아온다면 이 테이블부터 확인/생성할 것.
   -- comp{n}_excluded: "경쟁사 최저가 맞춤"(autoMatchCompetitorPriceIsopink) 자동계산에서
   -- 그 경쟁사를 뺄지 여부. 도저히 가격을 맞출 수 없는 업체를 목록에서 완전히 지우지 않고
   -- 표시는 유지한 채 자동 계산에서만 제외하기 위함(2026-09-02).
   -- 2026-09-02(2차): 처음엔 tab_id(아이소/비드/우레탄 등 큰 카테고리)만 PK였는데, 같은
   -- 큰 카테고리 안에서도 서브탭(등급, 예: 비드법의 2종3호/2종2호/.../준불연)마다 실제로
   -- 등록된 경쟁사가 다를 수 있어서 제외설정도 서브탭 단위로 따로 걸 수 있어야 한다는
   -- 요청으로 grade_id를 PK에 추가함. 기존 tab_id 단위 값은 각 탭의 기본 서브탭에만
   -- 옮겨두고 나머지 서브탭은 기본값(제외 없음)에서 새로 시작한다:
   --   ALTER TABLE competitor_names ADD COLUMN IF NOT EXISTS grade_id text;
   --   UPDATE competitor_names SET grade_id = CASE tab_id
   --     WHEN 'isopink' THEN 'isopink' WHEN 'bead' THEN 'ia1' WHEN 'pu' THEN 'ic'
   --     WHEN 'pf' THEN 'lxo_s' WHEN 'fr' THEN 'fr_bul' ELSE tab_id END
   --   WHERE grade_id IS NULL;
   --   ALTER TABLE competitor_names DROP CONSTRAINT IF EXISTS competitor_names_pkey;
   --   ALTER TABLE competitor_names ADD PRIMARY KEY (tab_id, grade_id);
   CREATE TABLE IF NOT EXISTS competitor_names (
     tab_id          text NOT NULL,
     grade_id        text NOT NULL,
     comp1_name      text,
     comp2_name      text,
     comp3_name      text,
     comp1_excluded  boolean DEFAULT false,
     comp2_excluded  boolean DEFAULT false,
     comp3_excluded  boolean DEFAULT false,
     updated_at      timestamptz DEFAULT now(),
     PRIMARY KEY (tab_id, grade_id)
   );
   ALTER TABLE competitor_names DISABLE ROW LEVEL SECURITY;
   -- 이미 competitor_names 테이블이 있는 상태에서 이 컬럼만 추가하려면 위 2026-09-02(2차)
   -- 마이그레이션 블록을 그대로 실행 (comp{n}_excluded 컬럼 자체가 없다면 먼저):
   -- ALTER TABLE competitor_names ADD COLUMN IF NOT EXISTS comp1_excluded boolean DEFAULT false;
   -- ALTER TABLE competitor_names ADD COLUMN IF NOT EXISTS comp2_excluded boolean DEFAULT false;
   -- ALTER TABLE competitor_names ADD COLUMN IF NOT EXISTS comp3_excluded boolean DEFAULT false;

   [index.html 적용]
   pricing.js 바로 다음에 추가:
   <script src="js/pricing-competitor.js"></script>
   =============================================================== */

/* ═══════════════════════════════════════
   경쟁사 이름 설정
═══════════════════════════════════════ */
const COMP_COUNT         = 3;
const COMP_DEFAULT_NAMES = ['크린슐라', '산일상사', '대유물류'];
const COMP_COLORS        = ['#3b82f6', '#f59e0b', '#10b981'];

// 같은 경쟁사 링크를 두께 여러 개에 걸쳐 등록해둔 경우(모음전 상품 하나가 여러 두께를
// 옵션으로 커버) — 그 행들을 같은 배경색으로 묶어서 "이 URL은 한 번만 열어보면 여러 행이
// 같이 채워진다"를 한눈에 보이게 한다(2026-09-02). 경쟁사 슬롯(comp1/2/3)별로 독립 배정.
const LINK_GROUP_COLORS = ['#fef3c7', '#dbeafe', '#dcfce7', '#fae8ff', '#ffe4e6', '#e0f2fe', '#fef9c3', '#ede9fe', '#ffedd5', '#cffafe'];

/* 탭+서브탭(등급)별 이름+제외설정 인메모리 캐시 — { [tabId:gradeId]: { names:[3], excluded:[3 bool] } }
   2026-09-02: 같은 큰 카테고리(예: 비드법) 안에서도 서브탭마다 등록된 경쟁사가 달라서
   제외설정을 탭 단위가 아니라 (탭, 서브탭) 단위로 따로 걸 수 있게 키를 확장함. */
let _compMetaCache = {};
function _compMetaKey(tabId, gradeId) { return `${tabId}:${gradeId}`; }

async function _compMeta(tabId, gradeId) {
  const key = _compMetaKey(tabId, gradeId);
  if (_compMetaCache[key]) return _compMetaCache[key];
  let meta = { names: [...COMP_DEFAULT_NAMES], excluded: [false, false, false] };
  try {
    const { data: r, error } = await supabaseClient
      .from('competitor_names')
      .select('comp1_name,comp2_name,comp3_name,comp1_excluded,comp2_excluded,comp3_excluded')
      .eq('tab_id', tabId)
      .eq('grade_id', gradeId)
      .maybeSingle();
    if (error) throw error;
    if (r) {
      meta = {
        names: [
          r.comp1_name || COMP_DEFAULT_NAMES[0],
          r.comp2_name || COMP_DEFAULT_NAMES[1],
          r.comp3_name || COMP_DEFAULT_NAMES[2],
        ],
        excluded: [!!r.comp1_excluded, !!r.comp2_excluded, !!r.comp3_excluded],
      };
    }
  } catch(e) { console.warn('[Comp] 이름/제외설정 로드 실패', e); }
  _compMetaCache[key] = meta;
  return meta;
}

async function _compNames(tabId, gradeId) { return (await _compMeta(tabId, gradeId)).names; }
async function _compExcluded(tabId, gradeId) { return (await _compMeta(tabId, gradeId)).excluded; }

async function _saveCompMeta(tabId, gradeId, names, excluded) {
  // ⚠️ 예전엔 실패해도 여기서 에러를 삼키고 조용히 리턴해서, 호출부(editCompName)가
  // 항상 "저장되었습니다" 성공 토스트를 띄우는 버그가 있었다 — 실제로는 competitor_names
  // 테이블이 없거나 RLS에 막혀도 사용자는 저장된 줄 알고 새로고침 후에야 원래 이름으로
  // 돌아온 걸 발견하게 됨(2026-09-02). 이제 실패를 그대로 던져서 호출부가 알게 한다.
  const { error } = await supabaseClient.from('competitor_names').upsert({
    tab_id: tabId,
    grade_id: gradeId,
    comp1_name: names[0],
    comp2_name: names[1],
    comp3_name: names[2],
    comp1_excluded: !!excluded[0],
    comp2_excluded: !!excluded[1],
    comp3_excluded: !!excluded[2],
    updated_at: new Date().toISOString(),
  }, { onConflict: 'tab_id,grade_id' });
  if (error) {
    console.warn('[Comp] 이름/제외설정 저장 실패', error);
    throw error;
  }
  _compMetaCache[_compMetaKey(tabId, gradeId)] = { names, excluded };
}

/* ═══════════════════════════════════════
   인메모리 캐시
   { [tabId]: { [gradeId]: { [t]: { comp1_price, comp1_link, comp2_price, comp2_link, comp3_price, comp3_link } } } }
═══════════════════════════════════════ */
window._compCache = {};

function _cacheGet(tabId, gradeId, t) {
  return window._compCache?.[tabId]?.[gradeId]?.[t] || {};
}
function _cacheSet(tabId, gradeId, t, compIdx, price, link) {
  window._compCache[tabId]             = window._compCache[tabId] || {};
  window._compCache[tabId][gradeId]    = window._compCache[tabId][gradeId] || {};
  window._compCache[tabId][gradeId][t] = window._compCache[tabId][gradeId][t] || {};
  const c = window._compCache[tabId][gradeId][t];
  c[`comp${compIdx + 1}_price`] = (price === '' || price === null) ? null : Number(price);
  if (link !== undefined) c[`comp${compIdx + 1}_link`] = (link === '' || link === null) ? null : link;
}

async function loadCompPrices(tabId, gradeId) {
  if (typeof supabaseClient === 'undefined') return;
  try {
    const { data: rows, error } = await supabaseClient
      .from('competitor_prices')
      .select('thickness,comp1_price,comp1_link,comp2_price,comp2_link,comp3_price,comp3_link')
      .eq('tab_id', tabId)
      .eq('grade_id', gradeId);
    if (error) throw error;
    window._compCache[tabId]          = window._compCache[tabId] || {};
    window._compCache[tabId][gradeId] = {};
    (rows || []).forEach(r => {
      window._compCache[tabId][gradeId][r.thickness] = {
        comp1_price: r.comp1_price, comp1_link: r.comp1_link,
        comp2_price: r.comp2_price, comp2_link: r.comp2_link,
        comp3_price: r.comp3_price, comp3_link: r.comp3_link,
      };
    });
  } catch(e) { console.warn('[Comp] 로드 실패', e); }
}

async function saveCompPrice(tabId, gradeId, thickness, compIdx, rawVal, rawLink) {
  if (window.currentUser?.role !== 'admin') return;
  if (typeof supabaseClient === 'undefined') return;

  const price = (rawVal === '' || rawVal == null) ? null : Number(rawVal);
  const link  = (rawLink === '' || rawLink == null) ? null : rawLink;
  _cacheSet(tabId, gradeId, thickness, compIdx, price, link);

  const cached  = _cacheGet(tabId, gradeId, thickness);
  const payload = {
    tab_id:      tabId,
    grade_id:    gradeId,
    thickness:   Number(thickness),
    comp1_price: cached.comp1_price ?? null, comp1_link: cached.comp1_link ?? null,
    comp2_price: cached.comp2_price ?? null, comp2_link: cached.comp2_link ?? null,
    comp3_price: cached.comp3_price ?? null, comp3_link: cached.comp3_link ?? null,
    updated_at:  new Date().toISOString(),
  };

  try {
    const { error } = await supabaseClient
      .from('competitor_prices')
      .upsert(payload, { onConflict: 'tab_id,grade_id,thickness' });
    if (error) throw error;
    _refreshCompCells(tabId, gradeId, thickness);
    if (typeof showToast === 'function') showToast('저장됨', 'success');
  } catch(e) {
    console.warn('[Comp] 저장 실패', e);
    if (typeof showToast === 'function') showToast('저장 실패', 'error');
  }
}

window.saveCompPrice = saveCompPrice;

/* ═══════════════════════════════════════
   diff 배지 HTML
   diff = 우리 - 경쟁사
   양수(우리 > 경쟁사) = 경쟁사가 더 쌈 → 우리한테 불리 → 빨강 "불리"
   음수(우리 < 경쟁사) = 경쟁사가 더 비쌈 → 우리한테 유리 → 초록 "유리"
═══════════════════════════════════════ */
function _compDiffBadge(ourPrice, compPrice) {
  if (ourPrice == null || compPrice == null || compPrice === 0)
    return '<span class="cp-diff-empty">—</span>';
  const diff = ourPrice - compPrice;
  if (diff === 0) return '<span class="cp-diff-same">±0</span>';
  const sign = diff > 0 ? '+' : '';
  const cls  = diff > 0 ? 'up' : 'down';
  const lbl  = diff > 0 ? '불리' : '유리';
  return `<span class="cp-diff ${cls}">${sign}${Number(diff).toLocaleString('ko-KR')}<em>${lbl}</em></span>`;
}

/* ═══════════════════════════════════════
   에너가드 실판가 조회
═══════════════════════════════════════ */
function _ourPrice(tabId, gradeId, t) {
  try {
    if (tabId === 'isopink') return window._isoCalcRow?.(t)?.realPrice ?? null;
    const grade = (window._gradesOf?.(tabId) || []).find(g => g.id === gradeId);
    if (!grade) return null;
    const costId = window._getCostId?.(tabId, grade, t);
    const cost   = costId ? (window.fieldVal?.(costId) ?? 0) : 0;
    if (!cost) return null;
    if (tabId === 'fr') {
      const m = window._getMargin?.(tabId, grade, t) ?? 0;
      return window.calcFrSheetRow?.(cost, m, grade.area)?.realPrice ?? null;
    }
    const m    = window._getMargin?.(tabId, grade, t) ?? 0;
    const tEff = grade.tFactor ?? t;
    return window.calcSheetRow?.(cost, m, tEff, grade.area)?.realPrice ?? null;
  } catch { return null; }
}

/* ═══════════════════════════════════════
   현재 활성 gradeId
═══════════════════════════════════════ */
function _activeGradeId(tabId) {
  return tabId === 'isopink' ? 'isopink' : (window._subtabState?.[tabId] || '');
}

/* ═══════════════════════════════════════
   두께 목록
═══════════════════════════════════════ */
function _thicknesses(tabId, gradeId) {
  if (tabId === 'isopink') return window.ISOPINK_ROWS || [];
  const grade = (window._gradesOf?.(tabId) || []).find(g => g.id === gradeId);
  return grade ? (window._rowsOf?.(tabId, grade) || []) : [];
}

/* ═══════════════════════════════════════
   특정 두께의 diff 셀만 재렌더
═══════════════════════════════════════ */
function _refreshCompCells(tabId, gradeId, t) {
  const ourPrice = _ourPrice(tabId, gradeId, t);
  const cached   = _cacheGet(tabId, gradeId, t);
  for (let i = 0; i < COMP_COUNT; i++) {
    const el = document.getElementById(`cp_diff_${tabId}_${gradeId}_${i}_${t}`);
    if (el) el.innerHTML = _compDiffBadge(ourPrice, cached[`comp${i + 1}_price`]);
  }
}

function _refreshAllCompCells(tabId, gradeId) {
  _thicknesses(tabId, gradeId).forEach(t => _refreshCompCells(tabId, gradeId, t));
}

/* ═══════════════════════════════════════
   링크 그룹 색상 — 같은 URL을 쓰는 행이 2개 이상이면 그룹으로 보고 배경색 배정
   (compIdx별로 독립 배정, 반환값: [{link: color}, {link: color}, {link: color}])
═══════════════════════════════════════ */
function _computeLinkGroupColors(tabId, gradeId) {
  const thicknesses = _thicknesses(tabId, gradeId);
  const maps = [];
  for (let i = 0; i < COMP_COUNT; i++) {
    const counts = {};
    thicknesses.forEach(t => {
      const link = _cacheGet(tabId, gradeId, t)[`comp${i + 1}_link`];
      if (link) counts[link] = (counts[link] || 0) + 1;
    });
    const map = {};
    let idx = 0;
    Object.keys(counts).forEach(link => {
      if (counts[link] >= 2) { map[link] = LINK_GROUP_COLORS[idx % LINK_GROUP_COLORS.length]; idx++; }
    });
    maps.push(map);
  }
  return maps;
}

/* ═══════════════════════════════════════
   경쟁사 셀 HTML (tr 뒤에 붙는 td들)
═══════════════════════════════════════ */
function _buildCompCells(tabId, gradeId, t, linkGroupColors) {
  const ourPrice = _ourPrice(tabId, gradeId, t);
  const cached   = _cacheGet(tabId, gradeId, t);
  let html = '';
  for (let i = 0; i < COMP_COUNT; i++) {
    const val      = cached[`comp${i + 1}_price`];
    const link     = cached[`comp${i + 1}_link`] || '';
    const diffHtml = _compDiffBadge(ourPrice, val);
    const color    = COMP_COLORS[i];
    const groupColor = link ? linkGroupColors?.[i]?.[link] : null;
    const groupStyle = groupColor ? ` background:${groupColor} !important;` : '';
    const groupTitle = groupColor ? ' title="같은 상품 링크가 등록된 다른 두께 행들과 같은 색"' : '';
    const dispVal  = val != null ? Number(val).toLocaleString('ko-KR') : '—';
    const linkIcon = link
      ? `<a href="${link}" target="_blank" class="cp-link-icon" title="상품 페이지"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
      : `<span class="cp-link-icon cp-link-empty" title="링크 없음"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>`;
    html += `<td class="cp-td-price" style="--cc:${color};${groupStyle}"${groupTitle} data-comp-idx="${i}" data-tab="${tabId}" data-grade="${gradeId}" data-t="${t}" data-link="${link.replace(/"/g,'&quot;')}">
      <div class="cp-val-wrap">
        <span class="cp-val">${dispVal}</span>
        ${linkIcon}
      </div>
      <div class="cp-edit-wrap" style="display:none">
        <input type="text" inputmode="numeric" class="cp-input" style="--cc:${color}"
          value="${val != null ? val : ''}" placeholder="단가"
          onchange="_syncCompCell(this)">
        <input type="text" class="cp-link-input" style="--cc:${color}"
          value="${link}" placeholder="링크 URL"
          onchange="_syncCompCell(this)">
      </div>
    </td>`;
    html += `<td class="cp-td-diff" id="cp_diff_${tabId}_${gradeId}_${i}_${t}">${diffHtml}</td>`;
  }
  return html;
}

/* 편집 중 input 변경 시 즉시 저장 (단가 또는 링크 변경) */
window._syncCompCell = function(inputEl) {
  const td      = inputEl.closest('td[data-comp-idx]');
  if (!td) return;
  const compIdx = parseInt(td.dataset.compIdx);
  const t       = parseInt(td.dataset.t);
  const tabId   = td.dataset.tab;
  const gradeId = td.dataset.grade;
  const priceEl = td.querySelector('.cp-input');
  const linkEl  = td.querySelector('.cp-link-input');
  saveCompPrice(tabId, gradeId, t, compIdx, priceEl?.value.trim(), linkEl?.value.trim());
};

/* ─ 편집 모드 토글 ─────────────────────────────────────
   compIdx 번째 경쟁사 열을 편집/읽기 모드로 전환
   tabId, gradeId는 현재 활성 탭 기준
──────────────────────────────────────────────────────── */
window.toggleCompEdit = function(compIdx) {
  if (window.currentUser?.role !== 'admin') return;
  const tabId   = window._activePricingTab || 'isopink';
  const gradeId = _activeGradeId(tabId);
  const tbodyId = tabId === 'isopink' ? 'pricingTableBody' : `${tabId}TableBody`;
  const tbody   = document.getElementById(tbodyId);
  if (!tbody) return;

  const isEditing = tbody.dataset[`compEditing${compIdx}`] === '1';

  if (isEditing) {
    /* ── 편집 → 저장 후 읽기 전용으로 ── */
    tbody.querySelectorAll(`td[data-comp-idx="${compIdx}"]`).forEach(td => {
      const priceInput = td.querySelector('.cp-input');
      const linkInput  = td.querySelector('.cp-link-input');
      const valWrap    = td.querySelector('.cp-val-wrap');
      const editWrap   = td.querySelector('.cp-edit-wrap');
      const span       = td.querySelector('.cp-val');
      const t   = parseInt(td.dataset.t);
      const tab = td.dataset.tab;
      const gr  = td.dataset.grade;
      if (!priceInput) return;
      const rawPrice = priceInput.value.trim();
      const rawLink  = linkInput?.value.trim() || '';
      saveCompPrice(tab, gr, t, compIdx, rawPrice, rawLink);
      // 표시값 갱신
      if (span) span.textContent = rawPrice !== '' ? Number(rawPrice).toLocaleString('ko-KR') : '—';
      // 링크 아이콘 갱신
      const existingIcon = td.querySelector('.cp-link-icon');
      if (existingIcon) {
        if (rawLink) {
          existingIcon.outerHTML = `<a href="${rawLink}" target="_blank" class="cp-link-icon" title="상품 페이지"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`;
        } else {
          existingIcon.outerHTML = `<span class="cp-link-icon cp-link-empty" title="링크 없음"><i class="fa-solid fa-arrow-up-right-from-square"></i></span>`;
        }
      }
      if (valWrap)  valWrap.style.display  = '';
      if (editWrap) editWrap.style.display = 'none';
    });
    delete tbody.dataset[`compEditing${compIdx}`];
    _setEditBtnState(compIdx, false);
  } else {
    /* ── 읽기 → 편집 ── */
    tbody.querySelectorAll(`td[data-comp-idx="${compIdx}"]`).forEach(td => {
      const valWrap  = td.querySelector('.cp-val-wrap');
      const editWrap = td.querySelector('.cp-edit-wrap');
      if (valWrap)  valWrap.style.display  = 'none';
      if (editWrap) editWrap.style.display = '';
    });
    tbody.dataset[`compEditing${compIdx}`] = '1';
    _setEditBtnState(compIdx, true);
  }
};

function _setEditBtnState(compIdx, isEditing) {
  document.querySelectorAll(`.cp-edit-btn[data-ci="${compIdx}"]`).forEach(btn => {
    if (isEditing) {
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      btn.title = '저장';
      btn.classList.add('saving');
    } else {
      btn.innerHTML = '<i class="fa-solid fa-tag"></i>';
      btn.title = '단가 편집';
      btn.classList.remove('saving');
    }
  });
}

/* ═══════════════════════════════════════
   테이블에 경쟁사 컬럼 주입
═══════════════════════════════════════ */
async function _injectCompColumns(tabId, gradeId, skipFetch) {
  const tbodyId = tabId === 'isopink' ? 'pricingTableBody' : `${tabId}TableBody`;
  const tbody   = document.getElementById(tbodyId);
  if (!tbody) return;
  const table = tbody.closest('table');
  if (!table) return;

  // 데이터 로드 — recalcPricing처럼 타이핑할 때마다 불리는 경로에서는 매번 새로 안 불러온다
  // (경쟁사 가격은 원가/마진 입력과 무관하니 이미 있는 캐시로 표만 다시 그리면 충분함,
  // 2026-09-02: tbody가 통째로 갈아끼워질 때마다 여기서 재조회하면 키보드 입력마다 매번
  // Supabase를 때려서 낭비였음).
  if (!skipFetch) await loadCompPrices(tabId, gradeId);

  /* ── 기존 경쟁사 컬럼 완전 제거 후 재주입 ──
     플래그 방식 대신 항상 클린하게 지우고 다시 그림 */
  table.querySelectorAll('thead .cp-th-group, thead .cp-th-sub, thead .cp-th-diff-hd').forEach(el => el.remove());
  table.querySelectorAll('colgroup .cp-col').forEach(el => el.remove());
  tbody.querySelectorAll('.cp-td-price, .cp-td-diff').forEach(el => el.remove());

  const meta     = await _compMeta(tabId, gradeId);
  const names    = meta.names;
  const excluded = meta.excluded;

  /* ── 1. thead 헤더 추가 ── */
  const thead    = table.querySelector('thead');
  const theadTrs = thead ? Array.from(thead.querySelectorAll('tr')) : [];

  if (theadTrs.length >= 2) {
    names.forEach((name, i) => {
      const isExcluded = !!excluded[i];
      const th = document.createElement('th');
      th.colSpan = 2;
      th.className = 'cp-th-group' + (isExcluded ? ' cp-th-excluded' : '');
      th.style.cssText = `--cc:${COMP_COLORS[i]}`;
      th.innerHTML = `
        <div class="cp-th-inner">
          <span class="cp-th-name" data-ci="${i}" data-tab="${tabId}" data-grade="${gradeId}">${name}</span>
          <div class="cp-th-actions">
            <button class="cp-name-btn" title="이름 변경" onclick="editCompName(${i}, '${tabId}', '${gradeId}')"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="cp-exclude-btn${isExcluded ? ' active' : ''}" data-ci="${i}" data-tab="${tabId}" data-grade="${gradeId}"
              title="${isExcluded ? '가격맞춤 계산에서 제외됨 — 클릭하면 다시 포함' : '가격 도저히 못 맞추는 업체면 눌러서 가격맞춤 계산에서 제외'}"
              onclick="toggleCompExcluded(${i}, '${tabId}', '${gradeId}')"><i class="fa-solid fa-ban"></i></button>
            <button class="cp-edit-btn" data-ci="${i}" title="단가 편집"
              onclick="toggleCompEdit(${i})"><i class="fa-solid fa-tag"></i></button>
          </div>
        </div>`;
      theadTrs[0].appendChild(th);

      const th2 = document.createElement('th');
      th2.className = 'cp-th-sub';
      th2.style.cssText = `--cc:${COMP_COLORS[i]}`;
      th2.textContent = '단가';
      theadTrs[1].appendChild(th2);

      const th3 = document.createElement('th');
      th3.className = 'cp-th-diff-hd';
      th3.textContent = '우리 대비';
      theadTrs[1].appendChild(th3);
    });
  } else if (theadTrs.length === 1) {
    names.forEach((name, i) => {
      const th = document.createElement('th');
      th.colSpan = 2;
      th.className = 'cp-th-group';
      th.style.cssText = `--cc:${COMP_COLORS[i]}`;
      th.innerHTML = `<span class="cp-th-name" data-ci="${i}">${name}</span>`;
      theadTrs[0].appendChild(th);
    });
  }

  /* ── 2. colgroup 확장 ── */
  let colgroup = table.querySelector('colgroup');
  if (!colgroup) {
    colgroup = document.createElement('colgroup');
    table.prepend(colgroup);
  }
  for (let i = 0; i < COMP_COUNT; i++) {
    const cPrice = document.createElement('col');
    cPrice.className = 'cp-col';
    cPrice.style.width = '82px';
    colgroup.appendChild(cPrice);
    const cDiff = document.createElement('col');
    cDiff.className = 'cp-col';
    cDiff.style.width = '72px';
    colgroup.appendChild(cDiff);
  }

  /* ── 3. tbody 각 tr에 경쟁사 셀 추가 ── */
  const linkGroupColors = _computeLinkGroupColors(tabId, gradeId);
  Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
    const thickCell = tr.querySelector('.td-thick');
    const t = thickCell ? parseInt(thickCell.textContent.trim()) : NaN;
    if (isNaN(t)) {
      for (let i = 0; i < COMP_COUNT * 2; i++) {
        const td = document.createElement('td');
        td.className = i % 2 === 0 ? 'cp-td-price' : 'cp-td-diff';
        tr.appendChild(td);
      }
      return;
    }
    tr.insertAdjacentHTML('beforeend', _buildCompCells(tabId, gradeId, t, linkGroupColors));
  });

  table.dataset.compInjected = gradeId;
}

/* ═══════════════════════════════════════
   경쟁사 이름 변경
═══════════════════════════════════════ */
window.editCompName = async function(idx, tabId, gradeId) {
  if (window.currentUser?.role !== 'admin') {
    if (typeof showToast === 'function') showToast('관리자만 이름을 변경할 수 있습니다.', 'warning');
    return;
  }
  const meta    = await _compMeta(tabId, gradeId);
  const names   = meta.names;
  const newName = prompt('경쟁사 이름을 입력하세요:', names[idx]);
  if (!newName || !newName.trim()) return;
  names[idx] = newName.trim();
  try {
    await _saveCompMeta(tabId, gradeId, names, meta.excluded);
  } catch (e) {
    if (typeof showToast === 'function') showToast('이름 저장 실패 — competitor_names 테이블을 확인해주세요.', 'error');
    return;
  }
  document.querySelectorAll(`.cp-th-name[data-ci="${idx}"][data-tab="${tabId}"][data-grade="${gradeId}"]`).forEach(el => {
    el.textContent = names[idx];
  });
  if (typeof showToast === 'function') showToast('저장되었습니다.', 'success');
}

/* ═══════════════════════════════════════
   경쟁사 "가격맞춤 계산에서 제외" 토글
   — 도저히 가격을 맞출 수 없는 업체를 목록/표시는 유지한 채 자동 최저가 계산에서만 뺀다.
═══════════════════════════════════════ */
window.toggleCompExcluded = async function(idx, tabId, gradeId) {
  if (window.currentUser?.role !== 'admin') {
    if (typeof showToast === 'function') showToast('관리자만 변경할 수 있습니다.', 'warning');
    return;
  }
  const meta = await _compMeta(tabId, gradeId);
  const excluded = [...meta.excluded];
  excluded[idx] = !excluded[idx];
  try {
    await _saveCompMeta(tabId, gradeId, meta.names, excluded);
  } catch (e) {
    if (typeof showToast === 'function') showToast('저장 실패 — competitor_names 테이블에 comp{n}_excluded 컬럼이 있는지 확인해주세요.', 'error');
    return;
  }
  document.querySelectorAll(`.cp-exclude-btn[data-ci="${idx}"][data-tab="${tabId}"][data-grade="${gradeId}"]`).forEach(btn => {
    btn.classList.toggle('active', excluded[idx]);
    btn.title = excluded[idx] ? '가격맞춤 계산에서 제외됨 — 클릭하면 다시 포함' : '가격 도저히 못 맞추는 업체면 눌러서 가격맞춤 계산에서 제외';
    btn.closest('.cp-th-group')?.classList.toggle('cp-th-excluded', excluded[idx]);
  });
  if (typeof showToast === 'function') {
    showToast(excluded[idx] ? '가격맞춤 계산에서 제외했습니다.' : '가격맞춤 계산에 다시 포함했습니다.', 'success');
  }
}

/* ═══════════════════════════════════════
   탭/서브탭 전환 시 재주입 (tbody 초기화 후)
═══════════════════════════════════════ */

/* ═══════════════════════════════════════
   pricing.js 연동
   pricing.js loadPricingCosts() 완료 시 _onPricingLoaded 콜백으로 주입
═══════════════════════════════════════ */

/* loadPricingCosts 완료 콜백 — pricing.js가 호출함
   loadPricingCosts는 현재 활성 탭 데이터만 갱신하므로 활성 탭 플래그만 초기화 */
window._onPricingLoaded = function() {
  const tabId   = window._activePricingTab || 'isopink';
  const gradeId = _activeGradeId(tabId);
  _injectCompColumns(tabId, gradeId);
};

document.addEventListener('DOMContentLoaded', () => {

  /* ── setPricingTab (상품 탭 전환) ──
     단가표 페이지가 활성 상태일 때만 주입 (showPage 진입 시 _onPricingLoaded가 처리하므로 중복 방지) */
  const _origSetTab = window.setPricingTab;
  window.setPricingTab = function(tabId, el) {
    _origSetTab?.(tabId, el);
    const pricingPage = document.getElementById('page-pricing');
    if (pricingPage?.classList.contains('active')) {
      // _origSetTab 내부 recalc 완료 후 실행되도록 microtask 뒤로 밀기
      Promise.resolve().then(() => _injectCompColumns(tabId, _activeGradeId(tabId)));
    }
  };

  /* ── 서브탭 전환 ── */
  ['bead','pu','pf','fr'].forEach(tabId => {
    const fnMap = { bead:'setBeadSubtab', pu:'setPuSubtab', pf:'setPfSubtab', fr:'setFrSubtab' };
    const fnKey = fnMap[tabId];
    const _orig = window[fnKey];
        window[fnKey] = function(gradeId, btnEl) {
      _orig?.(gradeId, btnEl);
      const pricingPage = document.getElementById('page-pricing');
      if (pricingPage?.classList.contains('active')) {
        Promise.resolve().then(() => _injectCompColumns(tabId, gradeId));
      }
    };;
  });

  /* ── recalcPricing — 원가/마진 변경 시 표를 통째로 다시 그린다(isopink는
     buildRows()가 tbody.innerHTML을 교체함) — 그러면 기존에 주입해둔 경쟁사 셀(.cp-td-price
     등)도 같이 사라지는데, 예전엔 그 뒤에 diff 배지만 갱신하는 _refreshAllCompCells를 불러서
     사라진 셀을 못 찾고 조용히 아무 일도 안 했다(2026-09-02 발견 — 원가/마진을 한 번이라도
     건드리면 경쟁사 컬럼 전체가 없어지는 버그). _injectCompColumns로 통째로 다시 주입하게
     고침 — 이러면 링크 그룹 색상도 매번 최신 상태로 다시 계산됨. */
  const _origRecalc = window.recalcPricing;
  window.recalcPricing = function() {
    _origRecalc?.();
    _injectCompColumns('isopink', 'isopink', true);
  };
  ['bead','pu','pf','fr'].forEach(tabId => {
    const key   = `recalc${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`;
    const _orig = window[key];
    window[key] = function() {
      _orig?.();
      _injectCompColumns(tabId, _activeGradeId(tabId), true);
    };
  });

  /* ── viewHistory ── */
  const _origView = window.viewHistory;
  window.viewHistory = function(idx) {
    _origView?.(idx);
    const tabId   = window._activePricingTab || 'isopink';
    _injectCompColumns(tabId, _activeGradeId(tabId));
  };

});

/* ═══════════════════════════════════════
   CSS
═══════════════════════════════════════ */
(function injectCSS() {
  const style = document.createElement('style');
  style.textContent = `

/* ── 경쟁사 헤더 그룹 ── */
.cp-th-group {
  background: color-mix(in srgb, var(--cc) 10%, #f8fafc);
  color: var(--cc);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  padding: 7px 6px;
  border-left: 2px solid color-mix(in srgb, var(--cc) 25%, #e2e8f0);
  white-space: nowrap;
  vertical-align: middle;
}
.cp-th-group small {
  font-size: 9px;
  opacity: .5;
  margin-left: 2px;
}
.cp-th-group:hover small { opacity: 1; }

.cp-th-name { display: inline-block; }

.cp-th-sub {
  background: color-mix(in srgb, var(--cc) 6%, #f8fafc);
  color: var(--cc);
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  padding: 5px 4px;
  border-left: 2px solid color-mix(in srgb, var(--cc) 20%, #e9ecef);
  white-space: nowrap;
}
.cp-th-diff-hd {
  background: #f8fafc;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 500;
  text-align: center;
  padding: 5px 3px;
  white-space: nowrap;
}

/* ── 바디 셀 ── */
.cp-td-price {
  text-align: center;
  padding: 4px 5px;
  border-left: 2px solid color-mix(in srgb, var(--cc, #e2e8f0) 20%, #f1f5f9);
  background: color-mix(in srgb, var(--cc, #f8fafc) 3%, #fff);
}
.cp-td-diff {
  text-align: center;
  padding: 4px 3px;
  background: #fafafa;
}

/* ── 입력 필드 ── */
.cp-input {
  width: 72px;
  padding: 3px 5px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  text-align: right;
  color: #1e293b;
  font-family: inherit;
  background: #fff;
  transition: border-color .15s, box-shadow .15s;
}
.cp-input:focus {
  outline: none;
  border-color: var(--cc, #6366f1);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--cc, #6366f1) 20%, transparent);
}
.cp-input::placeholder { color: #d1d5db; }

.cp-readonly { font-size: 12px; color: #475569; }

/* ── 단가+링크 래퍼 ── */
.cp-val-wrap {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 2px 2px;
}
.cp-edit-wrap {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 2px 0;
}

/* ── 링크 아이콘 ── */
.cp-link-icon {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--cc, #6366f1);
  opacity: 0.7;
  transition: opacity .15s;
  line-height: 1;
  text-decoration: none;
}
.cp-link-icon:hover { opacity: 1; }
.cp-link-empty {
  opacity: 0.2;
  cursor: default;
  pointer-events: none;
}

/* ── 링크 입력 필드 ── */
.cp-link-input {
  width: 100%;
  min-width: 72px;
  padding: 2px 5px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 10px;
  color: #64748b;
  font-family: inherit;
  background: #fff;
}
.cp-link-input:focus {
  outline: none;
  border-color: var(--cc, #6366f1);
}
.cp-link-input::placeholder { color: #d1d5db; font-size: 10px; }

/* ── 헤더 내부 레이아웃 ── */
.cp-th-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.cp-th-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}
.cp-name-btn, .cp-edit-btn {
  background: none;
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 2px 5px;
  cursor: pointer;
  font-size: 11px;
  color: var(--cc, #6366f1);
  opacity: 0.6;
  transition: opacity .15s, background .15s;
  line-height: 1;
}
.cp-name-btn:hover, .cp-edit-btn:hover { opacity: 1; }
.cp-edit-btn.saving {
  opacity: 1;
  background: color-mix(in srgb, var(--cc, #16a34a) 15%, white);
  color: #16a34a;
  border-color: #16a34a;
}

/* ── 가격맞춤 계산 제외 토글 ──
   눌러도 해당 경쟁사 이름/가격 표시는 그대로 두고, autoMatchCompetitorPriceIsopink
   계산에서만 뺀다(2026-09-02). */
.cp-exclude-btn {
  background: none;
  border: 1px solid currentColor;
  border-radius: 4px;
  padding: 2px 5px;
  cursor: pointer;
  font-size: 11px;
  color: var(--cc, #6366f1);
  opacity: 0.6;
  transition: opacity .15s, background .15s, color .15s, border-color .15s;
  line-height: 1;
}
.cp-exclude-btn:hover { opacity: 1; }
.cp-exclude-btn.active {
  opacity: 1;
  background: #fef2f2;
  color: #ef4444;
  border-color: #ef4444;
}
/* 제외된 경쟁사는 헤더 전체를 살짝 죽여서 한눈에 보이게 */
.cp-th-group.cp-th-excluded {
  background: repeating-linear-gradient(135deg, #f8fafc, #f8fafc 6px, #f1f5f9 6px, #f1f5f9 12px);
  color: #94a3b8;
}
.cp-th-group.cp-th-excluded .cp-th-name { text-decoration: line-through; opacity: 0.6; }

/* ── 읽기 전용 값 표시 ── */
.cp-val {
  font-size: 12px;
  color: #334155;
  display: block;
  text-align: right;
  padding: 3px 4px;
  min-width: 60px;
}

/* ── diff 배지 ── */
.cp-diff-empty { color: #d1d5db; font-size: 11px; }
.cp-diff-same  { color: #94a3b8; font-size: 11px; }

.cp-diff {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.cp-diff.up   { background: #fef2f2; color: #dc2626; }
.cp-diff.down { background: #f0fdf4; color: #16a34a; }
.cp-diff em {
  font-style: normal;
  font-size: 9px;
  font-weight: 400;
  opacity: .75;
}

  `;
  document.head.appendChild(style);
})();
