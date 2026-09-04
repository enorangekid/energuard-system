/* ═══════════════════════════════════════
   한국단열 단가표 — 전용 파일 (2026-09-04 신설)

   에너가드컴퍼니 단가표(js/pricing.js)와 완전히 분리된 별도 엔진이다.
   합치지 않고 파일을 나눈 이유: pricing.js가 이미 3,000줄이 넘고,
   한국단열 원본 자료(한국단열단가표.xlsx)가 에너가드보다 카테고리도
   많고(아이소핑크/스티로폼/열반사단열재/단열벽지/창문형단열재/기타단열재/부자재)
   카테고리마다 단위·계산방식이 서로 달라서(장당·두께별 / m당·롤당 / 개당 등)
   pricing.js의 기존 엔진(_gradesOf/_getCostId/calcSheetRow 등)에 억지로
   끼워맞추면 관리가 더 어려워진다.

   tabId는 전부 hk_ 접두어를 붙여 에너가드 tabId(isopink/bead/pu/pf/fr)와
   절대 겹치지 않게 한다.

   지금은 틀(탭바 + "입력 전" 빈 상태)만 만든 상태 — 카테고리별 실제 엑셀을
   하나씩 받으면, 그 카테고리에 한해 GRADES/ROWS 정의와 원가입력 테이블,
   계산식을 채워넣는다. renderHkCategoryPane()의 분기만 늘려가면 되는 구조.
═══════════════════════════════════════ */

const HK_CATEGORIES = [
  { id: 'hk_isopink',    label: '아이소핑크' },
  { id: 'hk_bead',       label: '스티로폼' },
  { id: 'hk_reflective', label: '열반사단열재' },
  { id: 'hk_wallpaper',  label: '단열벽지' },
  { id: 'hk_window',     label: '창문형단열재' },
  { id: 'hk_etc',        label: '기타단열재' },
  { id: 'hk_sub',        label: '부자재' },
];

let _activeHkTab = HK_CATEGORIES[0].id;
window._activeHkTab = _activeHkTab;

/* ═══════════════════════════════════════
   탭바 + 빈 콘텐츠 초기 렌더
═══════════════════════════════════════ */
function initHkPricingTabs() {
  const tabsBar  = document.getElementById('hkPricingTabsBar');
  const bodyWrap = document.getElementById('hkPricingBodyWrap');
  if (!tabsBar || !bodyWrap) return;

  tabsBar.innerHTML = `<div class="pricing-tabs">${HK_CATEGORIES.map((c, i) =>
    `<button class="pricing-tab${i === 0 ? ' active' : ''}" onclick="setHkPricingTab('${c.id}',this)">${c.label}</button>`
  ).join('')}</div>`;

  bodyWrap.innerHTML = HK_CATEGORIES.map((c, i) =>
    `<div id="pricing-tab-${c.id}" class="pricing-tab-pane${i === 0 ? ' active' : ''}">${renderHkCategoryPane(c.id)}</div>`
  ).join('');

  _hkIsoPopulateSeedRows();
}
document.addEventListener('DOMContentLoaded', initHkPricingTabs);

/* ═══════════════════════════════════════
   탭 전환
═══════════════════════════════════════ */
window.setHkPricingTab = function(tabId, el) {
  _activeHkTab = tabId;
  window._activeHkTab = tabId;
  document.querySelectorAll('#hkPricingTabsBar .pricing-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#hkPricingBodyWrap .pricing-tab-pane').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('pricing-tab-' + tabId)?.classList.add('active');
};

/* ═══════════════════════════════════════
   카테고리별 콘텐츠 — 실제 데이터 들어오면 이 분기를 채운다.
   아직 미입력 카테고리는 빈 상태를 반환.
═══════════════════════════════════════ */
function renderHkCategoryPane(tabId) {
  const cat = HK_CATEGORIES.find(c => c.id === tabId);
  if (!cat) return '';

  if (tabId === 'hk_isopink') return renderHkIsopinkPane();

  // 카테고리가 채워지면 여기 if(tabId==='hk_bead'){...} 식으로
  // 전용 렌더 함수를 추가하면 됨 (renderHkIsopinkPane와 같은 패턴).

  return `
    <div class="pricing-coming-soon">
      <i class="fa-solid fa-file-excel"></i>
      <p>${cat.label} 원가표는 아직 입력 전입니다.</p>
    </div>`;
}

/* ═══════════════════════════════════════
   아이소핑크 (한국단열) — 2026-09-04

   원가 기준은 에너가드와 동일: 900×1800 원장, 원/mm 단가 × 두께.
   작은 규격(600×900, 430×430 등)은 그 원장을 나눠 잘라 파는 것 — 사용자 확인
   내용(2026-09-04): "600×900은 900×1800을 3등분, 430×430은 8등분"한다고
   보면 됨. 즉 조각원가 = 원장원가(원/mm × 두께) ÷ 분할수,
   판매원가(묶음) = 조각원가 × 묶음수량 — 이 부분은 자동 계산.

   판매가 자체(그 판매원가에 얼마를 남길지)는 두께·규격·채널(압출법/접착식/
   쿠팡위너 등)마다 목표 마진율이 다 달라서 자동으로 못 맞춘다 — 그래서
   판매가는 직접 입력받고, 마진액/마진율은 자동으로 보여줘서 엑셀의
   "참고마진"과 맞는지 눈으로 확인만 쉽게 하는 구조로 시작한다.

   품목/규격 조합이 두께마다 들쭉날쭉(엑셀에 고정된 격자가 아니라 그때그때
   블록이 추가되는 형태)이라, 표를 고정 격자로 만들지 않고 "행 추가"로
   필요한 조합만 자유롭게 늘려가는 방식으로 만들었다.
═══════════════════════════════════════ */

// 한국단열은 에너가드(대량/건축주 위주)와 달리 소량 주문하는 일반 소비자용이라
// 취급 두께 종류 자체가 훨씬 적다 — 받은 엑셀(아이소핑크.xlsx)에 실제로 있던
// 두께만 남김(2026-09-04, 나머지 두께는 아예 취급 안 함).
const HK_ISO_ROWS = [10,20,30,40,50,70,100,250,500];

// 압출법 특호 원/mm 단가 — 위 두께 전부 엑셀에 있던 값 그대로 미리 채워둠.
const HK_ISO_EXTRUDED_DEFAULTS = { 10:250, 20:250, 30:225, 40:225, 50:220, 70:220, 100:220, 250:230, 500:230 };

// 접착식은 별도 원/mm 단가가 아니라, 같은 두께 압출법 원가에 고정 가공비를 더한 값
// (10T~50T 전부 정확히 +1,350원으로 확인됨, 2026-09-04 사용자 확인 + 엑셀 역산 검증) —
// 그래서 두께별로 따로 입력받지 않고, 이 가공비 하나만 입력받아 압출법 원가에 더해서 씀.
const HK_ISO_ADHESIVE_SURCHARGE_DEFAULT = 1350;

const HK_ISO_PRODUCTS = [
  { id: 'extruded', label: '압출법 특호' },
  { id: 'adhesive', label: '접착식 압출법 특호' },
];

// 규격 분할수 — 900×1800 원장 한 장에서 몇 조각이 나오는지(2026-09-04 사용자 확인 +
// 원본 엑셀 실제 판매원가 역산으로 전부 검증 완료)
const HK_ISO_SIZE_PRESETS = [
  { key: '900x1800', label: '900×1800', divisor: 1 },
  { key: '600x900',  label: '600×900',  divisor: 3 },
  { key: '600x860',  label: '600×860',  divisor: 3 },
  { key: '600x430',  label: '600×430',  divisor: 6 },
  { key: '430x430',  label: '430×430',  divisor: 8 },
];

/* 원본 엑셀(아이소핑크.xlsx)의 판매가 행 전부 — "행 추가"로 직접 다 넣지 않아도
   되게 미리 불러와둠(2026-09-04). channel: '기본'(압출법/접착식 정가) 또는
   '쿠팡위너'(원가는 같지만 쿠팡 전용으로 마진을 다르게 잡은 채널) — 83행.
   marginPct(참고마진 %)는 원본 엑셀의 실제 판매가가 달성하고 있던 순수마진율을
   그대로 역산해서 채워둠 — 그래서 지금 판매가 칸이 "수정 불가·자동계산"으로
   바뀌어도 처음 로드했을 때는 원본 엑셀과 똑같은 판매가가 나온다(전부 역산
   검증 완료, 오차 0원). 여기서 참고마진 값을 55 같은 "깔끔한 목표치"로 직접
   바꾸면 그때부터 판매가가 그 목표에 맞춰 다시 자동 계산된다. */
const HK_ISO_SEED_ROWS = [
  { channel:'기본', product:'extruded', thickness:10, sizeKey:'430x430', qty:3, marginPct:52.1152 },
  { channel:'기본', product:'extruded', thickness:10, sizeKey:'600x900', qty:3, marginPct:51.4851 },
  { channel:'기본', product:'extruded', thickness:20, sizeKey:'430x430', qty:3, marginPct:58.2811 },
  { channel:'기본', product:'extruded', thickness:20, sizeKey:'600x900', qty:1, marginPct:49.6743 },
  { channel:'기본', product:'extruded', thickness:30, sizeKey:'430x430', qty:2, marginPct:57.9823 },
  { channel:'기본', product:'extruded', thickness:30, sizeKey:'600x900', qty:1, marginPct:50.2371 },
  { channel:'기본', product:'extruded', thickness:40, sizeKey:'430x430', qty:2, marginPct:58.3505 },
  { channel:'기본', product:'extruded', thickness:40, sizeKey:'600x900', qty:1, marginPct:51.6462 },
  { channel:'기본', product:'extruded', thickness:50, sizeKey:'430x430', qty:2, marginPct:57.739 },
  { channel:'기본', product:'extruded', thickness:50, sizeKey:'600x900', qty:1, marginPct:51.5699 },
  { channel:'기본', product:'extruded', thickness:70, sizeKey:'430x430', qty:1, marginPct:58.7909 },
  { channel:'기본', product:'extruded', thickness:70, sizeKey:'600x900', qty:1, marginPct:51.338 },
  { channel:'기본', product:'extruded', thickness:100, sizeKey:'430x430', qty:1, marginPct:57.4394 },
  { channel:'기본', product:'extruded', thickness:100, sizeKey:'600x900', qty:1, marginPct:51.4119 },
  { channel:'기본', product:'adhesive', thickness:10, sizeKey:'600x900', qty:3, marginPct:56.9119 },
  { channel:'기본', product:'adhesive', thickness:20, sizeKey:'600x900', qty:1, marginPct:57.8027 },
  { channel:'기본', product:'adhesive', thickness:30, sizeKey:'600x900', qty:1, marginPct:57.9339 },
  { channel:'기본', product:'adhesive', thickness:40, sizeKey:'600x900', qty:1, marginPct:57.6346 },
  { channel:'기본', product:'adhesive', thickness:50, sizeKey:'600x900', qty:1, marginPct:57.9855 },
  { channel:'기본', product:'adhesive', thickness:10, sizeKey:'600x900', qty:10, marginPct:60.604 },
  { channel:'기본', product:'adhesive', thickness:20, sizeKey:'600x900', qty:5, marginPct:57.8083 },
  { channel:'기본', product:'adhesive', thickness:30, sizeKey:'600x900', qty:3, marginPct:58.2281 },
  { channel:'기본', product:'adhesive', thickness:40, sizeKey:'600x900', qty:2, marginPct:58.1024 },
  { channel:'기본', product:'adhesive', thickness:50, sizeKey:'600x900', qty:2, marginPct:59.0999 },
  { channel:'기본', product:'extruded', thickness:10, sizeKey:'900x1800', qty:10, marginPct:30.1444 },
  { channel:'기본', product:'extruded', thickness:20, sizeKey:'900x1800', qty:5, marginPct:30.1444 },
  { channel:'기본', product:'extruded', thickness:30, sizeKey:'900x1800', qty:3, marginPct:35.8185 },
  { channel:'기본', product:'extruded', thickness:40, sizeKey:'900x1800', qty:2, marginPct:32.1224 },
  { channel:'기본', product:'extruded', thickness:50, sizeKey:'900x1800', qty:2, marginPct:34.9099 },
  { channel:'기본', product:'extruded', thickness:70, sizeKey:'900x1800', qty:1, marginPct:32.0791 },
  { channel:'기본', product:'extruded', thickness:100, sizeKey:'900x1800', qty:1, marginPct:28.5717 },
  { channel:'기본', product:'extruded', thickness:10, sizeKey:'900x1800', qty:1, marginPct:30.7856 },
  { channel:'기본', product:'extruded', thickness:20, sizeKey:'900x1800', qty:1, marginPct:30.7975 },
  { channel:'기본', product:'extruded', thickness:30, sizeKey:'900x1800', qty:1, marginPct:35.8158 },
  { channel:'기본', product:'extruded', thickness:40, sizeKey:'900x1800', qty:1, marginPct:36.7822 },
  { channel:'기본', product:'extruded', thickness:50, sizeKey:'900x1800', qty:1, marginPct:34.9099 },
  { channel:'기본', product:'extruded', thickness:70, sizeKey:'900x1800', qty:1, marginPct:33.0554 },
  { channel:'기본', product:'extruded', thickness:100, sizeKey:'900x1800', qty:1, marginPct:30.1149 },
  { channel:'기본', product:'extruded', thickness:70, sizeKey:'900x1800', qty:3, marginPct:31.0627 },
  { channel:'기본', product:'extruded', thickness:100, sizeKey:'900x1800', qty:3, marginPct:30.3635 },
  { channel:'기본', product:'extruded', thickness:250, sizeKey:'900x1800', qty:1, marginPct:51.1844 },
  { channel:'기본', product:'extruded', thickness:500, sizeKey:'900x1800', qty:1, marginPct:51.7199 },
  { channel:'기본', product:'adhesive', thickness:10, sizeKey:'900x1800', qty:1, marginPct:46.0221 },
  { channel:'기본', product:'adhesive', thickness:20, sizeKey:'900x1800', qty:1, marginPct:49.9211 },
  { channel:'기본', product:'adhesive', thickness:30, sizeKey:'900x1800', qty:1, marginPct:48.9901 },
  { channel:'기본', product:'adhesive', thickness:40, sizeKey:'900x1800', qty:1, marginPct:48.0116 },
  { channel:'기본', product:'adhesive', thickness:50, sizeKey:'900x1800', qty:1, marginPct:50.3629 },
  { channel:'기본', product:'adhesive', thickness:10, sizeKey:'900x1800', qty:10, marginPct:46.2352 },
  { channel:'기본', product:'adhesive', thickness:20, sizeKey:'900x1800', qty:5, marginPct:46.6793 },
  { channel:'기본', product:'adhesive', thickness:30, sizeKey:'900x1800', qty:3, marginPct:51.1831 },
  { channel:'기본', product:'adhesive', thickness:40, sizeKey:'900x1800', qty:2, marginPct:49.7344 },
  { channel:'기본', product:'adhesive', thickness:50, sizeKey:'900x1800', qty:2, marginPct:51.3954 },
  { channel:'기본', product:'extruded', thickness:100, sizeKey:'600x860', qty:1, marginPct:63.4031 },
  { channel:'기본', product:'extruded', thickness:250, sizeKey:'600x430', qty:1, marginPct:63.1299 },
  { channel:'기본', product:'extruded', thickness:250, sizeKey:'600x860', qty:1, marginPct:60.017 },
  { channel:'기본', product:'extruded', thickness:500, sizeKey:'600x430', qty:1, marginPct:61.6759 },
  { channel:'기본', product:'extruded', thickness:500, sizeKey:'600x860', qty:1, marginPct:59.0954 },
  { channel:'쿠팡위너', product:'extruded', thickness:10, sizeKey:'600x900', qty:10, marginPct:53.8605 },
  { channel:'쿠팡위너', product:'extruded', thickness:10, sizeKey:'600x900', qty:20, marginPct:53.7966 },
  { channel:'쿠팡위너', product:'extruded', thickness:20, sizeKey:'600x900', qty:5, marginPct:52.6722 },
  { channel:'쿠팡위너', product:'extruded', thickness:20, sizeKey:'600x900', qty:10, marginPct:52.6701 },
  { channel:'쿠팡위너', product:'extruded', thickness:30, sizeKey:'600x900', qty:1, marginPct:55.2607 },
  { channel:'쿠팡위너', product:'extruded', thickness:30, sizeKey:'600x900', qty:3, marginPct:55.2656 },
  { channel:'쿠팡위너', product:'extruded', thickness:30, sizeKey:'600x900', qty:5, marginPct:55.2636 },
  { channel:'쿠팡위너', product:'extruded', thickness:30, sizeKey:'600x900', qty:10, marginPct:55.2651 },
  { channel:'쿠팡위너', product:'extruded', thickness:40, sizeKey:'600x900', qty:2, marginPct:55.2662 },
  { channel:'쿠팡위너', product:'extruded', thickness:40, sizeKey:'600x900', qty:5, marginPct:55.2651 },
  { channel:'쿠팡위너', product:'extruded', thickness:50, sizeKey:'600x900', qty:1, marginPct:55.6665 },
  { channel:'쿠팡위너', product:'extruded', thickness:50, sizeKey:'600x900', qty:2, marginPct:52.8604 },
  { channel:'쿠팡위너', product:'extruded', thickness:70, sizeKey:'600x900', qty:1, marginPct:56.2821 },
  { channel:'쿠팡위너', product:'extruded', thickness:100, sizeKey:'600x900', qty:1, marginPct:56.0518 },
  { channel:'쿠팡위너', product:'extruded', thickness:100, sizeKey:'600x860', qty:1, marginPct:63.4031 },
  { channel:'쿠팡위너', product:'extruded', thickness:250, sizeKey:'600x860', qty:1, marginPct:60.017 },
  { channel:'쿠팡위너', product:'extruded', thickness:250, sizeKey:'600x430', qty:1, marginPct:63.1299 },
  { channel:'쿠팡위너', product:'extruded', thickness:500, sizeKey:'600x860', qty:1, marginPct:59.0954 },
  { channel:'쿠팡위너', product:'extruded', thickness:500, sizeKey:'600x430', qty:1, marginPct:61.6759 },
  { channel:'쿠팡위너', product:'extruded', thickness:10, sizeKey:'900x1800', qty:10, marginPct:30.1444 },
  { channel:'쿠팡위너', product:'extruded', thickness:20, sizeKey:'900x1800', qty:5, marginPct:29.4755 },
  { channel:'쿠팡위너', product:'extruded', thickness:30, sizeKey:'900x1800', qty:3, marginPct:39.4542 },
  { channel:'쿠팡위너', product:'extruded', thickness:40, sizeKey:'900x1800', qty:2, marginPct:39.4554 },
  { channel:'쿠팡위너', product:'extruded', thickness:50, sizeKey:'900x1800', qty:2, marginPct:34.9099 },
  { channel:'쿠팡위너', product:'extruded', thickness:70, sizeKey:'900x1800', qty:1, marginPct:42.4847 },
  { channel:'쿠팡위너', product:'extruded', thickness:100, sizeKey:'900x1800', qty:1, marginPct:33.6281 },
];

/* 참고마진(목표 순수마진율 %)을 만족하는 가장 낮은 100원 단위 판매가를 찾는다.
   원가에서 100원씩 올려가며 순수마진율이 목표 이상이 되는 첫 지점을 채택 —
   에너가드컴퍼니 쪽 계산 로직(calcSheetRow)과 같은 "ceil to 100" 사고방식.
   순수마진율은 가격이 오를수록 단조증가라 이 탐색은 항상 유일한 답을 찾는다. */
function _hkIsoSolvePrice(bundleCost, targetPct) {
  if (!bundleCost || targetPct == null || isNaN(targetPct)) return null;
  let price = Math.ceil(bundleCost / 100) * 100;
  for (let i = 0; i < 5000; i++) {
    const marginAmt  = price - bundleCost;
    const vat        = Math.round(marginAmt / 11);
    const commission = Math.round(price * 0.06);
    const netMargin  = marginAmt - vat - commission;
    const rate       = price > 0 ? (netMargin / price * 100) : 0;
    if (rate >= targetPct) return price;
    price += 100;
  }
  return price;
}

function _hkIsoCostFieldId(t) { return `hk_iso_cost_extruded_t${t}`; }

/* 원장(900×1800) 원가 — 압출법은 원/mm × 두께, 접착식은 압출법 원가 + 가공비 */
function _hkIsoSheetCost(productId, t) {
  const el = document.getElementById(_hkIsoCostFieldId(t));
  const perMm = el ? parseFloat(el.value) : NaN;
  if (!perMm) return null;
  const extrudedCost = perMm * t;
  if (productId === 'extruded') return extrudedCost;
  const surchargeEl = document.getElementById('hk_iso_adhesive_surcharge');
  const surcharge = surchargeEl ? (parseFloat(surchargeEl.value) || 0) : 0;
  return extrudedCost + surcharge;
}

function renderHkIsopinkPane() {
  const costRows = HK_ISO_ROWS.map(t => `
    <tr>
      <td class="pcut-name-cell">${t}T</td>
      <td><input type="text" inputmode="numeric" id="${_hkIsoCostFieldId(t)}" class="pricing-input-field pcut-cost-field" placeholder="0" value="${HK_ISO_EXTRUDED_DEFAULTS[t] ?? ''}"></td>
    </tr>`).join('');

  const costTableHtml = `<table class="pricing-cost-unified-table">
    <colgroup><col style="width:70px"><col style="width:160px"></colgroup>
    <thead><tr><th>두께</th><th>압출법 특호<br><span class="pricing-th-tiny" style="font-weight:400;color:#94a3b8">원/mm</span></th></tr></thead>
    <tbody>${costRows}</tbody>
  </table>`;

  const costCard = `<div class="card pricing-cost-card">
    <div class="pricing-section-title">원가 입력 <span class="pricing-section-sub">— 900×1800 원장 기준, 두께별 원/mm 단가 (엑셀에 있던 두께는 미리 채워둠)</span></div>
    <div class="pricing-cost-footer">
      <label class="pricing-base-month-wrap">
        <span class="pricing-base-month-label">접착식 가공비(고정, 원장당)</span>
        <input type="text" inputmode="numeric" id="hk_iso_adhesive_surcharge" class="pricing-input-field pricing-month-field" value="${HK_ISO_ADHESIVE_SURCHARGE_DEFAULT}">
      </label>
    </div>
    <div class="pricing-cost-card-inner">
      <div class="pricing-input-table-wrap">${costTableHtml}</div>
    </div>
  </div>`;

  const sellCard = `<div class="card pricing-cost-card">
    <div class="pricing-section-title">
      판매가 계산 <span class="pricing-section-sub">— 원가·참고마진만 입력하면 판매가는 자동 계산(에너가드컴퍼니와 동일한 방식), 결과 칸은 직접 수정 불가</span>
    </div>
    <div class="pricing-cost-footer">
      <button class="pricing-margin-edit-btn" onclick="_hkIsoAddSellRow()">
        <i class="fa-solid fa-plus"></i> 행 추가
      </button>
    </div>
    <div class="pricing-table-scroll">
      <table class="pricing-table">
        <thead><tr>
          <th>채널</th><th>품목</th><th>두께</th><th>규격(판매사이즈)</th><th>묶음수량</th>
          <th>참고마진<br><span class="pricing-th-tiny" style="font-weight:400;color:#94a3b8">%, 직접입력</span></th>
          <th>판매원가</th><th>판매가</th><th>마진</th><th>순수마진율</th><th></th>
        </tr></thead>
        <tbody id="hkIsoSellRowsBody"></tbody>
      </table>
    </div>
  </div>`;

  return costCard + sellCard;
}

/* 행 하나의 <tr> 내부 HTML — seed가 있으면 그 값으로 미리 선택된 상태로 만든다.
   판매가/마진/순수마진율은 전부 자동계산 결과 표시 칸(읽기전용)이고, 사람이
   직접 손댈 수 있는 건 채널(비고)·품목·두께·규격·묶음수량·참고마진뿐이다
   — 에너가드컴퍼니 단가표에서 결과표를 직접 고치지 않는 것과 같은 방식. */
function _hkIsoRowInnerHtml(seed) {
  const s = seed || {};
  const channel   = s.channel ?? '';
  const product   = s.product ?? HK_ISO_PRODUCTS[0].id;
  const thickness = s.thickness ?? HK_ISO_ROWS[0];
  const sizeKey   = s.sizeKey ?? HK_ISO_SIZE_PRESETS[0].key;
  const qty       = s.qty ?? 1;
  const marginPct = s.marginPct ?? '';
  return `
    <td><input type="text" class="pricing-input-field" style="width:70px" value="${channel}" placeholder="비고"></td>
    <td><select class="pricing-input-field" onchange="_hkIsoRecalcRow(this)">
      ${HK_ISO_PRODUCTS.map(p => `<option value="${p.id}"${p.id === product ? ' selected' : ''}>${p.label}</option>`).join('')}
    </select></td>
    <td><select class="pricing-input-field" onchange="_hkIsoRecalcRow(this)">
      ${HK_ISO_ROWS.map(t => `<option value="${t}"${t === thickness ? ' selected' : ''}>${t}T</option>`).join('')}
    </select></td>
    <td><select class="pricing-input-field" onchange="_hkIsoRecalcRow(this)">
      ${HK_ISO_SIZE_PRESETS.map(p => `<option value="${p.key}"${p.key === sizeKey ? ' selected' : ''}>${p.label}</option>`).join('')}
    </select></td>
    <td><input type="text" inputmode="numeric" class="pricing-input-field" value="${qty}" style="width:56px" oninput="_hkIsoRecalcRow(this)"></td>
    <td><input type="text" inputmode="decimal" class="pricing-input-field pricing-margin-field" value="${marginPct}" placeholder="0" style="width:70px" oninput="_hkIsoRecalcRow(this)"></td>
    <td class="hk-iso-bundle-cost">—</td>
    <td class="hk-iso-sell-price">—</td>
    <td class="hk-iso-margin-amt">—</td>
    <td class="hk-iso-margin-rate">—</td>
    <td><button class="pricing-margin-edit-btn" onclick="this.closest('tr').remove()" title="행 삭제"><i class="fa-solid fa-trash"></i></button></td>`;
}

/* 판매가 계산 행 추가(빈 행) */
window._hkIsoAddSellRow = function() {
  const tbody = document.getElementById('hkIsoSellRowsBody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = _hkIsoRowInnerHtml();
  tbody.appendChild(tr);
  _hkIsoRecalcRow(tr);
};

/* 원본 엑셀 데이터로 판매가 행 전부 미리 채우기 — 아이소핑크 탭 최초 렌더 직후 1회 호출 */
function _hkIsoPopulateSeedRows() {
  const tbody = document.getElementById('hkIsoSellRowsBody');
  if (!tbody || tbody.children.length) return; // 이미 채워져 있으면(재실행) 건너뜀
  HK_ISO_SEED_ROWS.forEach(seed => {
    const tr = document.createElement('tr');
    tr.innerHTML = _hkIsoRowInnerHtml(seed);
    tbody.appendChild(tr);
    _hkIsoRecalcRow(tr);
  });
}

/* 행 하나 재계산 — 셀렉트/입력값이 바뀔 때마다 호출. 판매가/마진/순수마진율은
   전부 여기서만 채워지는 자동계산 결과라 사람이 직접 타이핑할 수 없다. */
window._hkIsoRecalcRow = function(el) {
  const tr = el.closest ? el.closest('tr') : el;
  if (!tr) return;
  const [, productSel, thicknessSel, sizeSel, qtyInput, marginInput] = tr.querySelectorAll('select, input');
  const bundleCostCell = tr.querySelector('.hk-iso-bundle-cost');
  const sellPriceCell  = tr.querySelector('.hk-iso-sell-price');
  const marginAmtCell  = tr.querySelector('.hk-iso-margin-amt');
  const marginRateCell = tr.querySelector('.hk-iso-margin-rate');

  const productId  = productSel?.value;
  const t          = parseFloat(thicknessSel?.value);
  const sizeKey     = sizeSel?.value;
  const qty         = parseFloat(qtyInput?.value) || 0;
  const targetPct   = marginInput?.value.trim() !== '' ? parseFloat(marginInput.value) : null;

  const preset = HK_ISO_SIZE_PRESETS.find(p => p.key === sizeKey);
  const sheetCost = _hkIsoSheetCost(productId, t);

  if (!sheetCost || !preset || !qty) {
    bundleCostCell.textContent = '—';
    sellPriceCell.textContent  = '—';
    marginAmtCell.textContent  = '—';
    marginRateCell.textContent = '—';
    return;
  }

  const bundleCost = Math.round(sheetCost / preset.divisor * qty);
  bundleCostCell.textContent = bundleCost.toLocaleString() + '원';

  const sellPrice = _hkIsoSolvePrice(bundleCost, targetPct);
  if (!sellPrice) {
    sellPriceCell.textContent  = '—';
    marginAmtCell.textContent  = '—';
    marginRateCell.textContent = '—';
    return;
  }
  const marginAmt   = sellPrice - bundleCost;
  const vat         = Math.round(marginAmt / 11);
  const commission  = Math.round(sellPrice * 0.06);
  const netMargin   = marginAmt - vat - commission;
  const marginRate  = sellPrice > 0 ? (netMargin / sellPrice * 100) : 0;
  sellPriceCell.textContent  = sellPrice.toLocaleString() + '원';
  marginAmtCell.textContent  = marginAmt.toLocaleString() + '원';
  marginRateCell.textContent = marginRate.toFixed(1) + '%';
};
