/* ═══════════════════════════════════════
   한국단열 기타단열재(hk_etc) — 1단계 기준단가 (2026-09-23)

   사용자가 준 표를 그대로 옮겼다. 첫 상품군: 필름난방보온재(HF_), 캠핑용단열재(CP_). "기타단열재"는
   앞으로 다른 상품군도 계속 추가될 수 있는 묶음 카테고리라(사용자 확인) 상품군별로 그룹만 나눴다.
   전용OPP테이프·전용면테이프는 부자재 쪽에 이미 있어서 안 옮겼다(사용자 확인 — "면테이프는 빼자,
   부자재 쪽에 있어").

   원가는 실제 원재료(OPP필름·PE폼·하이덴필름) 단가로 쪼개진다(사용자가 준 표의 원가합계·마진과
   정확히 일치 확인) — 아이소핑크·스티로폼처럼 편집 가능한 "원가 설정 카드"로 만들었다(HK_ETC_BOM).
   - 필름난방보온재: 원가 = (OPP필름+PE폼+하이덴필름 ㎡당단가 합) × 판매길이(m) + 포장비(500원,
     50m·25m 롤에만 붙고 1m 샘플엔 안 붙는다 — 표에 그렇게 돼 있음, 마진 계산과 정확히 일치해서
     실수가 아니라 의도된 값으로 봤다).
   - 캠핑용단열재: 표에 "㎡당원가×50m+포장비"(53,000, 마스터 롤 전체 원가)와 "m당원가"(1,060) 두
     값이 같이 있는데, 실제 마진 계산은 m당원가 기준이었다(2,700-1,060=1,640, 표의 마진과 일치) —
     열반사단열재·단열벽지 롤형과 같은 "마스터 원가 ÷ 길이 × 판매길이" 방식이다.
   - 표에 판매가 관련 열이 세 개 있었다(판매가A→판매가B→"26.05.08 인상가 25%") — 아래 2026-09-28
     항목 참고, 최종적으로는 인상가를 실제 판매가로 쓴다. 원가·원가합계는 이 세 값과 무관하게 재료
     단가로 그대로 계산된다(검증 완료).
   - 순수마진 계산에 택배비를 뺀다(표의 개당마진과 정확히 일치 확인) — 다른 카테고리
     1단계엔 없던 항목인데, 여기는 표에 원래 있던 값이라 그대로 반영했다. 상품군 위에 있던 상품ID
     (한국단열 자사몰의 지금 판매 중인 상품 번호, 사용자 확인)는 채널 연결용이 아니라 참고 정보라서
     이번엔 코드에 안 넣었다(사용자 확인 — "택배비는 그냥 무시해", 채널 연결 자료로는 안 씀).

   구조는 여기(JS), 값은 DB — 저장하는 값은 판매가(상품코드별)와 원가 설정(hk_settings.etcCosts,
   { film: {...}, camping: {...} })뿐이다. 마진·수수료·순수마진은 화면에서 다시 계산한다.

   2026-09-23 추가 수정(사용자 확인):
   - **원가 설정 카드·원가 칸은 일단 화면에 안 보여준다** — HK_ETC_BOM·_hkEtcProductCost 등 계산
     로직은 그대로 두고 렌더링만 뺐다(renderHkEtcPane, _hkEtcTableHtml). 마진 계산에는 원가가
     여전히 쓰인다(화면에 원가 숫자만 안 보일 뿐).
   - **참고마진율 열 추가** — 원본 표에 없던 열이라(사용자 확인 — "적당히 넣어") 계산된 순수마진율을
     5% 단위로 반올림해 채웠다.

   2026-09-28 추가 수정(사용자 확인 — "인상가가 지금 실제 판매가"):
   - **"26.05.08 인상가(25%)"가 참고용이 아니라 지금 실제 적용 중인 판매가였다** — 단열벽지·
     열반사단열재와 같은 이유(원가 공식을 몰라서 그때 판매가에서 25% 가볍게 올린 게 그대로 굳어짐).
     그래서 표의 세 값(판매가A→판매가B→인상가) 중 인상가를 새 판매가로, 바로 직전 값인 판매가B를
     이전 판매가로 썼다(판매가A는 더 오래된 값이라 안 씀). "26.05.08 인상가" 열 자체는 이제 판매가와
     같아져서 화면에서 뺐다(product.increase25 필드도 삭제).
     - HF_5_50: 98,000 → 123,000 / HF_5_25: 55,000 → 69,000 / HF_5_1: 2,000 → 2,500(엑셀 표의
       판매가A와 우연히 같은 값) / CP_5_1: 2,700 → 3,400.
   - 참고마진율도 새 판매가 기준으로 다시 계산(HF_5_50=25%, HF_5_25=30%, HF_5_1=40%, CP_5_1=55%).

   2026-09-30 추가(사용자 요청): **방습초배지 상품군 — 원가 계산 없이 판매가만 관리**(noCost). 방습단열초배지 6개 + 초배용부직포 2개, 한국단열(hkd)
   몰별 단가표에서 이 판매가를 관리코드로 가져간다. 원가·마진 칸은 "—", 판매가는 연필로 직접 수정. 관리코드는 내가 정했다:
   DPS_{두께}_{길이m}(방습단열초배지 — 0.2T는 02, 1T·5T는 그대로) / CBF_01_{길이m}(초배용부직포 0.1T).
═══════════════════════════════════════ */

// 상품군별 원가 구성비(원/㎡) — 편집하면 그 상품군 행 전체 원가가 다시 계산된다.
const HK_ETC_BOM = {
  film:    { opp: 325, pe: 770, highDen: 0,  pack: 500, label: '필름난방보온재' },
  camping: { opp: 190, pe: 770, highDen: 90, pack: 500, label: '캠핑용단열재' },
};

// ㎡당 원가(OPP필름+PE폼+하이덴필름 합).
function _hkEtcSqmCost(lineKey) {
  const b = HK_ETC_BOM[lineKey];
  if (!b) return 0;
  return (Number(b.opp) || 0) + (Number(b.pe) || 0) + (Number(b.highDen) || 0);
}

// 필름난방보온재 — 독립 계산(㎡당원가 × 길이 + 포장비).
function _hkEtcFilmCost(length, includePack) {
  return _hkEtcSqmCost('film') * length + (includePack ? (Number(HK_ETC_BOM.film.pack) || 0) : 0);
}

// 캠핑용단열재 — 50m 마스터롤 원가 ÷ 50 × 판매길이.
function _hkEtcCampingMasterCost() {
  return _hkEtcSqmCost('camping') * 50 + (Number(HK_ETC_BOM.camping.pack) || 0);
}
function _hkEtcCampingCost(length) {
  return _hkEtcCampingMasterCost() / 50 * length;
}

function _hkEtcProductCost(product) {
  return product.lineKey === 'camping'
    ? _hkEtcCampingCost(product.length)
    : _hkEtcFilmCost(product.length, product.includePack);
}

const HK_ETC_PRODUCTS = [
  { name: '필름난방보온재(5T 가교)', spec: '5T*1*50m', code: 'HF_5_50', lineKey: 'film', length: 50, includePack: true, shipping: 20000, previousPrice: 98000, price: 123000, refMargin: 25 },
  { name: '필름난방보온재(5T 가교)', spec: '5T*1*25m', code: 'HF_5_25', lineKey: 'film', length: 25, includePack: true, shipping: 8000, previousPrice: 55000, price: 69000, refMargin: 30 },
  { name: '필름난방보온재(5T 가교)', spec: '5T*1*1m', code: 'HF_5_1', lineKey: 'film', length: 1, includePack: false, shipping: 0, previousPrice: 2000, price: 2500, refMargin: 40 },
  { name: '캠핑용단열재(5T 가교)', spec: '5T*1*1m', code: 'CP_5_1', lineKey: 'camping', length: 1, includePack: true, shipping: 0, previousPrice: 2700, price: 3400, refMargin: 55 },
].map(row => ({ group: HK_ETC_BOM[row.lineKey].label, cost: 0, ...row }));

// 방습초배지 — 원가 계산 없이 판매가만 둔다(cost: null, noCost: true). 이전 판매가 = 현재 판매가에서 시작.
[
  ['방습단열초배지', '0.2T 1m x 25m 비접착', 'DPS_02_25', 42000],
  ['방습단열초배지', '1T 1m x 25m 비접착', 'DPS_1_25', 80000],
  ['방습단열초배지', '5T 1m x 30m 비접착', 'DPS_5_30', 140000],
  ['방습단열초배지', '0.2T 1m x 1m 비접착', 'DPS_02_1', 1800],
  ['방습단열초배지', '1T 1m x 1m 비접착', 'DPS_1_1', 5000],
  ['방습단열초배지', '5T 1m x 1m 비접착', 'DPS_5_1', 5500],
  ['초배용부직포', '0.1T 1m x 1m 비접착', 'CBF_01_1', 1200],
  ['초배용부직포', '0.1T 1m x 80m 비접착', 'CBF_01_80', 53000],
].forEach(([name, spec, code, price]) => {
  HK_ETC_PRODUCTS.push({ group: '방습초배지', name, spec, code, noCost: true, cost: null, shipping: null, previousPrice: price, price, refMargin: null });
});

function hkEtcRefreshDerived() {
  HK_ETC_PRODUCTS.forEach(product => { if (!product.noCost) product.cost = _hkEtcProductCost(product); });
}
hkEtcRefreshDerived();

/* 마진 계산 — 다른 카테고리와 다르게 택배비를 뺀다(표에 원래 있던 항목, 검증 완료).
   순수마진 = 판매가 - 원가 - 택배비 - 판매수수료 6% - 부가세 10%. */
function _hkEtcMetrics(cost, price, shipping) {
  const margin = price - cost;
  const fee = Math.round(price * 0.06);
  const vat = Math.round(price * 0.10);
  const netMargin = margin - (Number(shipping) || 0) - fee - vat;
  return { margin, fee, vat, netMargin, netRate: price > 0 ? Math.round(netMargin / price * 100) : 0 };
}

function _hkEtcRowHtml(product, rowIndex) {
  const noCost = !!product.noCost;
  const metrics = noCost ? null : _hkEtcMetrics(product.cost, product.price, product.shipping);
  const dash = '—';
  const difference = Number(product.price) - Number(product.previousPrice);
  return `<tr data-row-index="${rowIndex}" data-product-code="${product.code}"${noCost ? ' data-no-cost="1"' : ''}>
    <td class="hk-sub-name">${product.name}</td>
    <td class="hk-reflective-spec" title="${product.spec}">${product.spec}</td>
    <td class="hk-iso-draft-code">${product.code}</td>
    <td class="hk-etc-shipping">${noCost ? dash : _hkIsoDraftNumber(product.shipping)}</td>
    <td class="hk-sub-previous">${_hkIsoDraftNumber(product.previousPrice)}<small class="${difference > 0 ? 'up' : difference < 0 ? 'down' : ''}">${difference ? `${difference > 0 ? '+' : ''}${_hkIsoDraftNumber(difference)}` : '동일'}</small></td>
    <td class="hk-iso-draft-price hk-sub-price-cell">
      <div class="hk-iso-price-edit-wrap">
        <input type="text" inputmode="numeric" class="pricing-input-field hk-iso-final-price-input" value="${Number(product.price).toLocaleString()}" data-original-price="${Number(product.price)}" onclick="beginHkEtcRowPriceEdit(this)" oninput="recalcHkEtcRow(this)" onblur="finishHkEtcRowPriceEdit(this)" onkeydown="handleHkEtcRowPriceKey(event,this)" readonly aria-label="판매가">
        <button type="button" class="hk-iso-row-price-edit-btn" onclick="beginHkEtcRowPriceEdit(this)" title="이 판매가만 수정"><i class="fa-solid fa-pen"></i></button>
      </div>
      <div class="hk-iso-price-history" hidden>변경 전 <span>${Number(product.price).toLocaleString()}원</span><button type="button" onclick="revertHkEtcRowPrice(this)" title="변경 전 판매가로 되돌리기"><i class="fa-solid fa-rotate-left"></i></button></div>
    </td>
    <td class="hk-sub-margin"${noCost ? ' title="원가를 계산하지 않는 상품"' : ''}>${noCost ? dash : _hkIsoDraftNumber(metrics.margin)}</td>
    <td class="hk-sub-fee">${noCost ? dash : _hkIsoDraftNumber(metrics.fee)}</td>
    <td class="hk-sub-vat">${noCost ? dash : _hkIsoDraftNumber(metrics.vat)}</td>
    <td class="hk-sub-net-margin">${noCost ? dash : _hkIsoDraftNumber(metrics.netMargin)}</td>
    <td class="hk-sub-net-rate">${noCost ? dash : _hkIsoDraftNumber(metrics.netRate, '%')}</td>
    <td class="hk-sub-ref-margin">${noCost ? dash : _hkIsoDraftNumber(product.refMargin, '%')}</td>
  </tr>`;
}

function _hkEtcGroups() {
  const groups = [];
  HK_ETC_PRODUCTS.forEach((product, index) => {
    let group = groups.find(item => item.name === product.group);
    if (!group) { group = { name: product.group, items: [] }; groups.push(group); }
    group.items.push({ product, index });
  });
  return groups;
}

function _hkEtcTableHtml(items) {
  return `<div class="pricing-table-scroll">
    <table class="pricing-table hk-sub-table hk-reflective-table">
      <colgroup>
        <col class="hk-reflective-col-name"><col class="hk-reflective-col-spec"><col class="hk-reflective-col-code">
        <col class="hk-sub-col-margin"><col class="hk-sub-col-previous"><col class="hk-sub-col-price">
        <col class="hk-sub-col-margin"><col class="hk-sub-col-margin"><col class="hk-sub-col-margin">
        <col class="hk-sub-col-net"><col class="hk-sub-col-rate"><col class="hk-sub-col-rate">
      </colgroup>
      <thead><tr>
        <th class="hk-sub-head-base">품명</th><th class="hk-sub-head-base">규격</th><th class="hk-sub-head-code">상품코드</th>
        <th class="hk-sub-head-margin">택배비</th><th class="hk-sub-head-base">이전 판매가</th><th class="hk-sub-head-sale-price">판매가</th>
        <th class="hk-sub-head-margin">마진</th><th class="hk-sub-head-margin">판매수수료<br><small>6%</small></th><th class="hk-sub-head-margin">부가세<br><small>10%</small></th>
        <th class="hk-sub-head-margin">순수마진</th><th class="hk-sub-head-rate">순수마진율</th><th class="hk-sub-ref-margin-head">참고마진율</th>
      </tr></thead>
      <tbody>${items.map(({ product, index }) => _hkEtcRowHtml(product, index)).join('')}</tbody>
    </table>
  </div>`;
}

function _hkEtcAccordionHtml(group, groupIndex) {
  const id = `etc_g${groupIndex}`;
  return `<div class="hk-iso-accordion${groupIndex === 0 ? ' open' : ''}" id="hkIsoAcc-${id}">
    <div class="hk-iso-accordion-head">
      <span class="hk-iso-accordion-title">${group.name}</span>
      <span class="hk-iso-accordion-count">상품 ${group.items.length}개</span>
      <button type="button" class="hk-iso-accordion-toggle" onclick="toggleHkIsoAccordion('${id}')" title="펼치기 / 접기" aria-label="${group.name} 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"></i></button>
    </div>
    <div class="hk-iso-accordion-body">${_hkEtcTableHtml(group.items)}</div>
  </div>`;
}

/* 상품군 원가 설정 카드 — 값을 바꾸면 그 상품군 행 전체 원가·마진이 바로 다시 계산된다. */
function _hkEtcBomCard(lineKey) {
  const b = HK_ETC_BOM[lineKey];
  const field = (key, label) => `<label class="hk-iso-bom-field">${label}
    <input type="text" inputmode="numeric" class="pricing-input-field hk-iso-bom-input" value="${Number(b[key]).toLocaleString()}" oninput="updateHkEtcBom('${lineKey}', '${key}', this.value)">
  </label>`;
  return `<div class="card pricing-cost-card hk-iso-draft-margin-card" data-draft-tab="etc-${lineKey}">
    <div class="pricing-section-title">${b.label} 원가 설정 <span class="pricing-section-sub">— 재료 단가를 고치면 이 상품군 행 전체 원가·마진이 바로 반영됩니다.</span></div>
    <div class="hk-iso-bom-fields">
      ${field('opp', 'OPP필름 (원/㎡)')}
      ${field('pe', 'PE폼 (원/㎡)')}
      ${field('highDen', '하이덴필름 (원/㎡)')}
      ${field('pack', '포장비 (원, 고정)')}
    </div>
  </div>`;
}

// 원가 설정 카드·원가 칸은 일단 화면에 안 보여준다(사용자 확인 2026-09-23) — 함수는 남겨뒀다가
// 나중에 다시 켤 수 있게 해뒀다(_hkEtcBomCard, HK_ETC_BOM, _hkEtcProductCost 등은 그대로 있음).
function renderHkEtcPane() {
  return `<div id="hkEtcBaseDataSection">
    <div id="hkIsoAcc-etc_all" class="card pricing-result-card hk-sub-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">한국단열 기타단열재 기준 판매가<span class="pricing-spec-badge">${HK_ETC_PRODUCTS.length}개</span></div>
      </div>
      <div class="hk-iso-accordion-list">
        ${_hkEtcGroups().map(_hkEtcAccordionHtml).join('')}
      </div>
    </div>
  </div>`;
}

window.updateHkEtcBom = function(lineKey, key, value) {
  const bom = HK_ETC_BOM[lineKey];
  if (!bom || key === 'label') return;
  bom[key] = Math.max(0, _hkIsoDraftParseNumber(value));
  hkEtcRefreshDerived();
  document.querySelectorAll('#hkIsoAcc-etc_all tr[data-row-index]').forEach(row => {
    const product = HK_ETC_PRODUCTS[Number(row.dataset.rowIndex)];
    if (!product) return;
    const costCell = row.querySelector('.hk-reflective-cost');
    if (costCell) costCell.textContent = _hkIsoDraftNumber(Math.round(product.cost));
    const priceInput = row.querySelector('.hk-iso-final-price-input');
    if (priceInput) window.recalcHkEtcRow(priceInput);
  });
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

window.recalcHkEtcRow = function(input) {
  const row = input.closest('tr');
  if (!row) return;
  const product = HK_ETC_PRODUCTS[Number(row.dataset.rowIndex)];
  if (!product) return;
  product.price = _hkIsoDraftParseNumber(input.value);
  if (!product.noCost) {
    const metrics = _hkEtcMetrics(product.cost, product.price, product.shipping);
    row.querySelector('.hk-sub-margin').textContent = _hkIsoDraftNumber(metrics.margin);
    row.querySelector('.hk-sub-fee').textContent = _hkIsoDraftNumber(metrics.fee);
    row.querySelector('.hk-sub-vat').textContent = _hkIsoDraftNumber(metrics.vat);
    row.querySelector('.hk-sub-net-margin').textContent = _hkIsoDraftNumber(metrics.netMargin);
    row.querySelector('.hk-sub-net-rate').textContent = _hkIsoDraftNumber(metrics.netRate, '%');
  }
  const historyEl = row.querySelector('.hk-iso-price-history');
  if (historyEl) historyEl.hidden = Number(input.dataset.originalPrice) === product.price;
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

window.beginHkEtcRowPriceEdit = function(source) {
  const cell = source.closest('.hk-iso-draft-price');
  const input = cell?.querySelector('.hk-iso-final-price-input');
  if (!input) return;
  input.dataset.editStartPrice = String(_hkIsoDraftParseNumber(input.value));
  input.readOnly = false;
  cell.classList.add('editing');
  input.focus();
  input.select();
};

window.finishHkEtcRowPriceEdit = function(input) {
  window.formatHkIsoDraftPrice(input);
  input.readOnly = true;
  input.closest('.hk-iso-draft-price')?.classList.remove('editing');
  const history = input.closest('.hk-iso-draft-price')?.querySelector('.hk-iso-price-history');
  if (history) history.hidden = Number(input.dataset.originalPrice) === _hkIsoDraftParseNumber(input.value);
};

window.revertHkEtcRowPrice = function(button) {
  const cell = button.closest('.hk-iso-draft-price');
  const input = cell?.querySelector('.hk-iso-final-price-input');
  if (!input) return;
  input.value = Number(input.dataset.originalPrice || 0).toLocaleString();
  window.recalcHkEtcRow(input);
  input.readOnly = true;
  cell.classList.remove('editing');
};

window.handleHkEtcRowPriceKey = function(event, input) {
  if (event.key === 'Enter') input.blur();
  if (event.key === 'Escape') {
    input.value = Number(input.dataset.editStartPrice || input.dataset.originalPrice || 0).toLocaleString();
    window.recalcHkEtcRow(input);
    input.blur();
  }
};

/* pricing-hankook-db.js가 부르는 색인 — 부자재·열반사단열재·단열벽지와 같은 모양. */
window.hkEtcProductIndex = function() {
  return HK_ETC_PRODUCTS.map((row, rowIndex) => ({
    code: row.code,
    block: null,
    ship: {},
    row,
    rowIndex,
    accordionId: 'etc_all',
    categoryId: 'hk_etc',
  }));
};

window.hkEtcPriceByCode = function(code) {
  const product = HK_ETC_PRODUCTS.find(item => item.code === code);
  return product ? Number(product.price) : null;
};

/* ═══════════════════════════════════════
   한국단열(hkd) 채널 — 기타단열재 (2026-09-29, 사용자가 준 표 4행 = 상품 3개).
   현재 판매가(3,400 / 2,500 / 69,000 / 123,000)와 수정 전 판매가(2,700 / 2,000 / 55,000 / 98,000)가 단가표
   (HK_ETC_PRODUCTS의 price·previousPrice)와 정확히 일치한다 — 9/28 "인상가 = 실제 판매가" 반영이 맞았다는 확인.
   4705673971은 25m·50m 두 옵션이 한 상품이라 첫 옵션(HF_5_25, 69,000)이 기준가고 50m는 옵션추가금 +54,000.
   재고는 기본(99,999,999). 배송비·제주·반품/교환은 사용자 표 그대로.
═══════════════════════════════════════ */
(function addEtcHkdChannelProducts() {
  const make = (productId, shipping, items) => ({
    categoryId: 'hk_etc',
    productId,
    baseShipping: shipping.base,
    shippingBasis: shipping.basis,
    jejuShipping: shipping.jeju,
    returnExchange: shipping.exchange,
    items: items.map(([productCode, productName, prevPrice]) => ({ productCode, productName, prevPrice, prevShipping: shipping.base })),
  });
  HK_CHANNEL_LISTINGS.hkd.push(
    make('10609463678', { base: 4500, basis: '10개마다', jeju: 12000, exchange: '8500/17000' }, [
      ['CP_5_1', '캠핑단열재 5T x 1m', 2700],
    ]),
    make('4654882496', { base: 5000, basis: '10개마다', jeju: 10000, exchange: '5000/10000' }, [
      ['HF_5_1', '난방필름단열재 5T 1m x 1m', 2000],
    ]),
    make('4705673971', { base: 0, basis: '-', jeju: 20000, exchange: '10000/18000' }, [
      ['HF_5_25', '난방필름단열재 5T 1m x 25m', 55000],
      ['HF_5_50', '난방필름단열재 5T 1m x 50m', 98000],
    ]),
  );
})();

/* ═══════════════════════════════════════
   한국단열(hkd) 채널 — 방습초배지 (2026-09-30, 사용자가 준 표 10행 = 상품 4개, 옵션 10개).
   판매가는 기타단열재 탭의 "방습초배지"(원가 없는 공통 판매가)를 관리코드로 가져온다. 수정 전 판매가는 현재 값.
   - 표에서 재고가 "-"인 옵션은 판매중지(사용자 표 관례 — 타포린·마닉스 등과 같음): 560852218의 0.2T 25m, 598636390의 초배용부직포 1m,
     2292742829의 0.2T 25m, 2292744287의 0.2T 1m. 나머지는 재고 기본(99,999,999).
   - 기준가(표의 기준가 = 어느 옵션 가격): 560852218 = 5T 1x30m(140,000), 598636390 = 초배용부직포 1m(1,200, 판매중지 옵션이 기준),
     2292742829 = 첫 옵션 53,000, 2292744287 = 5T 1x1m(5,500) → baseCode로 고정. 옵션추가금은 자동 계산.
   - 배송비 0/5000, 기준 "-"/25개마다/15개마다, 제주 10,000, 교환/반품 20000/20000(560852218)·8000/16000은 표 그대로.
═══════════════════════════════════════ */
(function addBangseupChobaeHkdChannelProducts() {
  const stopped = { status: 'stopped', seedStatus: 'stopped' };
  const make = (productId, shipping, items, baseCode) => ({
    categoryId: 'hk_etc',
    productId,
    baseShipping: shipping.base,
    shippingBasis: shipping.basis,
    jejuShipping: shipping.jeju,
    returnExchange: shipping.exchange,
    ...(baseCode ? { baseCode, seedBaseCode: baseCode } : {}),
    items: items.map(([productCode, productName, flag]) => ({
      productCode,
      productName,
      prevPrice: window.hkEtcPriceByCode(productCode),
      prevShipping: shipping.base,
      ...(flag === 'stopped' ? { ...stopped } : {}),
    })),
  });
  HK_CHANNEL_LISTINGS.hkd.push(
    make('560852218', { base: 0, basis: '-', jeju: 10000, exchange: '20000/20000' }, [
      ['DPS_02_25', '방습단열초배지 0.2T 1m x 25m 비접착', 'stopped'],
      ['DPS_1_25', '방습단열초배지 1T 1m x 25m 비접착'],
      ['DPS_5_30', '방습단열초배지 5T 1m x 30m 비접착'],
    ], 'DPS_5_30'),
    make('598636390', { base: 5000, basis: '25개마다', jeju: 10000, exchange: '8000/16000' }, [
      ['CBF_01_1', '초배용부직포 0.1T 1m x 1m 비접착', 'stopped'],
      ['DPS_02_1', '방습단열초배지 0.2T 1m x 1m 비접착'],
    ], 'CBF_01_1'),
    make('2292742829', { base: 0, basis: '-', jeju: 10000, exchange: '8000/16000' }, [
      ['CBF_01_80', '초배용부직포 0.1T 1m x 80m 비접착'],
      ['DPS_02_25', '방습단열초배지 0.2T 1m x 25m 비접착', 'stopped'],
    ]),
    make('2292744287', { base: 5000, basis: '15개마다', jeju: 10000, exchange: '8000/16000' }, [
      ['DPS_02_1', '방습단열초배지 0.2T 1m x 1m 비접착', 'stopped'],
      ['DPS_1_1', '방습단열초배지 1T 1m x 1m 비접착'],
      ['DPS_5_1', '방습단열초배지 5T 1m x 1m 비접착'],
    ], 'DPS_5_1'),
  );
})();
