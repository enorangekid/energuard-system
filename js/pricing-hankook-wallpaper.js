/* ═══════════════════════════════════════
   한국단열 단열벽지(하우스앤네이처) — 1단계 기준단가 (2026-09-23)

   엑셀(C:\Users\Hankook_design\Desktop\★단가표수정\한국단열\나눔\단열벽지.xlsx, 시트 "단열벽지")을
   사용자와 함께 확인해서 옮겼다. 상품 4개(전부 5T): 고급형1(WP_P1_)/고급형2(WP_P2_)/이중화이트
   (WP_DW_)/실크형(WP_SK_). 판매가는 엑셀 "실판매가"(맨 오른쪽 U열) 그대로.
   **9T 슈퍼형(WP_SP_)은 이제 안 팔아서 뺐다(사용자 확인, 2026-09-23)** — 엑셀엔 있었지만 코드에
   안 옮김.

   엑셀엔 판매 단위가 5가지(M당/2.3M당/2.3M×10장/10M/20M롤)였다. 처음엔 "2.3M×10장 묶음"을 뺐었는데
   (2026-09-23), 한국단열 채널 연결 중 실제 판매 데이터에 이 묶음이 포함돼 있어서 다시 넣기로 했다
   (사용자 확인) — 결국 5개(1M/2.3M/10M/20M롤/2.3M×10장) 전부 있다.
   - 원가: 1M/10M/20M 세 판매단위에서 "m당원가"가 상품마다 정확히 하나로 일정했다(예: 고급형1은
     1M/10M/20M 표 전부 1,585원/m로 똑같음 — 열반사단열재 롤형과 달리 여기는 이미 주어진 값이 서로
     비례해서 딱 맞아떨어졌다, 원가 계산이 안 되는 문제가 없었다). 그래서 마스터 원가(m당원가) 하나만
     두고 길이만 곱해서 계산한다(HK_WALLPAPER_MASTER, _hkWallpaperRollCost) — 열반사단열재처럼 원가
     칸을 숨길 필요 없이 그대로 보여준다. **2.3M도 이 마스터 단가(m당원가×2.3)를 그대로 썼다** —
     2.3M 표에 딸려 있던 재료비 분해표(필름/lldp필름/폼지/pet필름/접착비용/로스)는 합산해도 그 표의
     원가랑 안 맞아서(31~35%, 일정한 배수도 아님 — 기본 시트 원가가 빠진 부분표로 보임, 열반사단열재
     판상형처럼 재단 가공비가 얹힌 걸로 추정) 안 썼다(사용자도 "마스터 단가로"라고 확인).
     이중화이트만 2.3M 표 자체의 m당원가(1,865원)가 마스터(1,770원)랑 달랐는데, 마스터 값으로 통일.
     2.3M×10장(판상형) 묶음도 같은 마스터 단가 × 23m(10장×2.3m)로 계산했다.
   - **가격 3종 구분(2026-09-29 사용자 확인)**: 엑셀은 예전가(노란색 "M당 판매가") | 인상가("26.05.08
     인상가(25%)", 빨간색) | 실판매가(초록색 U열)를 따로 둔다. 실판매가가 지금 실제 판매가이고 예전가·
     인상가는 참고용이다. 9/28에 인상가를 판매가로 승격했던 건 잘못된 판단이라 되돌렸다(스토어 판매가
     6,300 = 이중화이트 1M 실판매가와 일치). 그래서 화면에도 세 값을 각각 열로 보여주고, DB엔
     실판매가(price)만 저장한다.
   - 참고마진율 열은 원본 엑셀에 없어서(열반사단열재와 같은 이유로) 실판매가 기준 순수마진율을 5%
     단위로 반올림해 채웠다.
   - 쿠팡 위너 전용 코드(WP_..._C, 10M·20M)는 이번엔 안 옮겼다 — 이중화이트·실크형 2개는 원본에
     실판매가가 비어 있어(확정 전으로 보임) 사용자에게 물어봐야 하는데, 지금은 "20M 기준"으로
     범위를 좁히기로 해서 일단 전부 보류(나중에 채널 작업 때 필요하면 다시 확인).

   구조는 여기(JS), 값은 DB — 저장하는 값은 판매가(상품코드별)뿐이다. 마진·수수료·순수마진은
   화면에서 다시 계산한다(부자재·열반사단열재와 같은 방식).
═══════════════════════════════════════ */

// 상품별 마스터 원가(m당원가)·마스터 롤 길이. length가 다른 옵션은 cost = costPerMeter × length로 계산한다.
const HK_WALLPAPER_MASTER = {
  P1: { costPerMeter: 1585, length: 20, label: '단열벽지(고급형1)' },
  P2: { costPerMeter: 1585, length: 20, label: '단열벽지(고급형2)' },
  DW: { costPerMeter: 1770, length: 20, label: '단열벽지(이중화이트)' },
  SK: { costPerMeter: 1695, length: 20, label: '단열벽지(실크형)' },
};

function _hkWallpaperRollCost(masterKey, length) {
  const master = HK_WALLPAPER_MASTER[masterKey];
  if (!master) return 0;
  return (Number(master.costPerMeter) || 0) * length;
}

const HK_WALLPAPER_PRODUCTS = [
  { name:'단열벽지(고급형1)', spec:'5T X 1M', code:'WP_P1_5_1', masterKey:'P1', length:1, oldPrice:2800, increase25:3600, price:3400, refMargin:35 },
  { name:'단열벽지(고급형1)', spec:'5T X 2.3M(판)', code:'WP_P1_5_23', masterKey:'P1', length:2.3, oldPrice:10900, increase25:14000, price:13500, refMargin:55 },
  { name:'단열벽지(고급형1)', spec:'5T X 10M', code:'WP_P1_5_10', masterKey:'P1', length:10, oldPrice:38000, increase25:48700, price:45000, refMargin:50 },
  { name:'단열벽지(고급형1)', spec:'5T X 20M(롤)', code:'WP_P1_5_20', masterKey:'P1', length:20, oldPrice:58500, increase25:74900, price:69000, refMargin:40 },
  { name:'단열벽지(고급형1)', spec:'5T X 2.3M X 10장(판상형)', code:'WP_P1_5_23_10', masterKey:'P1', length:23, oldPrice:75000, increase25:96000, price:91000, refMargin:45 },
  { name:'단열벽지(고급형2)', spec:'5T X 1M', code:'WP_P2_5_1', masterKey:'P2', length:1, oldPrice:4800, increase25:6200, price:6000, refMargin:60 },
  { name:'단열벽지(고급형2)', spec:'5T X 2.3M(판)', code:'WP_P2_5_23', masterKey:'P2', length:2.3, oldPrice:13000, increase25:16700, price:16500, refMargin:60 },
  { name:'단열벽지(고급형2)', spec:'5T X 10M', code:'WP_P2_5_10', masterKey:'P2', length:10, oldPrice:40000, increase25:51200, price:49000, refMargin:50 },
  { name:'단열벽지(고급형2)', spec:'5T X 20M(롤)', code:'WP_P2_5_20', masterKey:'P2', length:20, oldPrice:70000, increase25:89600, price:84000, refMargin:45 },
  { name:'단열벽지(고급형2)', spec:'5T X 2.3M X 10장(판상형)', code:'WP_P2_5_23_10', masterKey:'P2', length:23, oldPrice:80000, increase25:102400, price:99000, refMargin:45 },
  { name:'단열벽지(이중화이트)', spec:'5T X 1M', code:'WP_DW_5_1', masterKey:'DW', length:1, oldPrice:5200, increase25:6700, price:6300, refMargin:55 },
  { name:'단열벽지(이중화이트)', spec:'5T X 2.3M(판)', code:'WP_DW_5_23', masterKey:'DW', length:2.3, oldPrice:15000, increase25:19200, price:19000, refMargin:65 },
  { name:'단열벽지(이중화이트)', spec:'5T X 10M', code:'WP_DW_5_10', masterKey:'DW', length:10, oldPrice:45000, increase25:57600, price:54000, refMargin:50 },
  { name:'단열벽지(이중화이트)', spec:'5T X 20M(롤)', code:'WP_DW_5_20', masterKey:'DW', length:20, oldPrice:75000, increase25:96000, price:90000, refMargin:45 },
  { name:'단열벽지(이중화이트)', spec:'5T X 2.3M X 10장(판상형)', code:'WP_DW_5_23_10', masterKey:'DW', length:23, oldPrice:87000, increase25:111400, price:107000, refMargin:45 },
  { name:'단열벽지(실크형)', spec:'5T X 1M', code:'WP_SK_5_1', masterKey:'SK', length:1, oldPrice:5200, increase25:6700, price:6300, refMargin:55 },
  { name:'단열벽지(실크형)', spec:'5T X 2.3M(판)', code:'WP_SK_5_23', masterKey:'SK', length:2.3, oldPrice:15000, increase25:19200, price:19000, refMargin:65 },
  { name:'단열벽지(실크형)', spec:'5T X 10M', code:'WP_SK_5_10', masterKey:'SK', length:10, oldPrice:45000, increase25:57600, price:54000, refMargin:55 },
  { name:'단열벽지(실크형)', spec:'5T X 20M(롤)', code:'WP_SK_5_20', masterKey:'SK', length:20, oldPrice:75000, increase25:96000, price:90000, refMargin:45 },
  { name:'단열벽지(실크형)', spec:'5T X 2.3M X 10장(판상형)', code:'WP_SK_5_23_10', masterKey:'SK', length:23, oldPrice:87000, increase25:111400, price:107000, refMargin:50 },
  // 9T 슈퍼형은 더 이상 안 판다(사용자 확인, 2026-09-23) — 빼둠.
].map(row => ({ group: HK_WALLPAPER_MASTER[row.masterKey].label, cost: 0, ...row }));

// 가격 세 종류(엑셀 "단열벽지" 시트 기준, 2026-09-29 사용자 확인):
//   oldPrice   = 예전가(엑셀 노란색 "M당 판매가" 열, 참고용)
//   increase25 = 인상가("26.05.08 인상가(25%)" 열, 참고용)
//   price      = 실판매가(엑셀 초록색 U열) — 지금 실제 판매가. 마진 계산·DB 저장·채널 목표가는 전부 이 값.
// 이전 판매가(previousPrice)는 "마지막으로 저장한 판매가"라서 처음엔 실판매가와 같다(저장하면 자동 갱신).
HK_WALLPAPER_PRODUCTS.forEach(product => { product.previousPrice = product.price; });

function hkWallpaperRefreshDerived() {
  HK_WALLPAPER_PRODUCTS.forEach(product => { product.cost = _hkWallpaperRollCost(product.masterKey, product.length); });
}
hkWallpaperRefreshDerived();

/* 마진 계산 — 다른 신규 카테고리와 같은 규칙: 순수마진 = 판매가 - 원가 - 판매수수료 6% - 부가세 10%. */
function _hkWallpaperMetrics(cost, price) {
  const margin = price - cost;
  const fee = Math.round(price * 0.06);
  const vat = Math.round(price * 0.10);
  const netMargin = margin - fee - vat;
  return { margin, fee, vat, netMargin, netRate: price > 0 ? Math.round(netMargin / price * 100) : 0 };
}

function _hkWallpaperRowHtml(product, rowIndex) {
  const metrics = _hkWallpaperMetrics(product.cost, product.price);
  const difference = Number(product.price) - Number(product.previousPrice);
  return `<tr data-row-index="${rowIndex}" data-product-code="${product.code}">
    <td class="hk-sub-name">${product.name}</td>
    <td class="hk-reflective-spec" title="${product.spec}">${product.spec}</td>
    <td class="hk-iso-draft-code">${product.code}</td>
    <td class="hk-reflective-cost">${_hkIsoDraftNumber(Math.round(product.cost))}</td>
    <td class="hk-sub-old-price">${_hkIsoDraftNumber(product.oldPrice)}</td>
    <td class="hk-sub-increase25">${_hkIsoDraftNumber(product.increase25)}</td>
    <td class="hk-sub-previous">${_hkIsoDraftNumber(product.previousPrice)}<small class="${difference > 0 ? 'up' : difference < 0 ? 'down' : ''}">${difference ? `${difference > 0 ? '+' : ''}${_hkIsoDraftNumber(difference)}` : '동일'}</small></td>
    <td class="hk-iso-draft-price hk-sub-price-cell">
      <div class="hk-iso-price-edit-wrap">
        <input type="text" inputmode="numeric" class="pricing-input-field hk-iso-final-price-input" value="${Number(product.price).toLocaleString()}" data-original-price="${Number(product.price)}" onclick="beginHkWallpaperRowPriceEdit(this)" oninput="recalcHkWallpaperRow(this)" onblur="finishHkWallpaperRowPriceEdit(this)" onkeydown="handleHkWallpaperRowPriceKey(event,this)" readonly aria-label="판매가">
        <button type="button" class="hk-iso-row-price-edit-btn" onclick="beginHkWallpaperRowPriceEdit(this)" title="이 판매가만 수정"><i class="fa-solid fa-pen"></i></button>
      </div>
      <div class="hk-iso-price-history" hidden>변경 전 <span>${Number(product.price).toLocaleString()}원</span><button type="button" onclick="revertHkWallpaperRowPrice(this)" title="변경 전 판매가로 되돌리기"><i class="fa-solid fa-rotate-left"></i></button></div>
    </td>
    <td class="hk-sub-margin">${_hkIsoDraftNumber(metrics.margin)}</td>
    <td class="hk-sub-fee">${_hkIsoDraftNumber(metrics.fee)}</td>
    <td class="hk-sub-vat">${_hkIsoDraftNumber(metrics.vat)}</td>
    <td class="hk-sub-net-margin">${_hkIsoDraftNumber(metrics.netMargin)}</td>
    <td class="hk-sub-net-rate">${_hkIsoDraftNumber(metrics.netRate, '%')}</td>
    <td class="hk-sub-ref-margin">${_hkIsoDraftNumber(product.refMargin, '%')}</td>
  </tr>`;
}

function _hkWallpaperGroups() {
  const groups = [];
  HK_WALLPAPER_PRODUCTS.forEach((product, index) => {
    let group = groups.find(item => item.name === product.group);
    if (!group) { group = { name: product.group, items: [] }; groups.push(group); }
    group.items.push({ product, index });
  });
  return groups;
}

function _hkWallpaperTableHtml(items) {
  return `<div class="pricing-table-scroll">
    <table class="pricing-table hk-sub-table hk-reflective-table">
      <colgroup>
        <col class="hk-reflective-col-name"><col class="hk-reflective-col-spec"><col class="hk-reflective-col-code">
        <col class="hk-reflective-col-cost"><col class="hk-sub-col-previous"><col class="hk-sub-col-previous"><col class="hk-sub-col-previous"><col class="hk-sub-col-price">
        <col class="hk-sub-col-margin"><col class="hk-sub-col-margin"><col class="hk-sub-col-margin">
        <col class="hk-sub-col-net"><col class="hk-sub-col-rate"><col class="hk-sub-col-rate">
      </colgroup>
      <thead><tr>
        <th class="hk-sub-head-base">품명</th><th class="hk-sub-head-base">규격</th><th class="hk-sub-head-code">상품코드</th>
        <th class="hk-sub-head-base">원가</th><th class="hk-sub-head-base">예전가</th><th class="hk-sub-head-base">인상가<br><small>26.05.08</small></th><th class="hk-sub-head-base">이전 판매가</th><th class="hk-sub-head-sale-price">실판매가</th>
        <th class="hk-sub-head-margin">마진</th><th class="hk-sub-head-margin">판매수수료<br><small>6%</small></th><th class="hk-sub-head-margin">부가세<br><small>10%</small></th>
        <th class="hk-sub-head-margin">순수마진</th><th class="hk-sub-head-rate">순수마진율</th><th class="hk-sub-ref-margin-head">참고마진율</th>
      </tr></thead>
      <tbody>${items.map(({ product, index }) => _hkWallpaperRowHtml(product, index)).join('')}</tbody>
    </table>
  </div>`;
}

function _hkWallpaperAccordionHtml(group, groupIndex) {
  const id = `wallpaper_g${groupIndex}`;
  return `<div class="hk-iso-accordion${groupIndex === 0 ? ' open' : ''}" id="hkIsoAcc-${id}">
    <div class="hk-iso-accordion-head">
      <span class="hk-iso-accordion-title">${group.name}</span>
      <span class="hk-iso-accordion-count">상품 ${group.items.length}개</span>
      <button type="button" class="hk-iso-accordion-toggle" onclick="toggleHkIsoAccordion('${id}')" title="펼치기 / 접기" aria-label="${group.name} 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"></i></button>
    </div>
    <div class="hk-iso-accordion-body">${_hkWallpaperTableHtml(group.items)}</div>
  </div>`;
}

function renderHkWallpaperPane() {
  return `<div id="hkWallpaperBaseDataSection">
    <div id="hkIsoAcc-wallpaper_all" class="card pricing-result-card hk-sub-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">한국단열 단열벽지(하우스앤네이처) 기준 판매가<span class="pricing-spec-badge">${HK_WALLPAPER_PRODUCTS.length}개 · 1M/2.3M/10M/20M(롤)/2.3M×10장(판상형)</span></div>
      </div>
      <div class="hk-iso-accordion-list">
        ${_hkWallpaperGroups().map(_hkWallpaperAccordionHtml).join('')}
      </div>
    </div>
  </div>`;
}

window.recalcHkWallpaperRow = function(input) {
  const row = input.closest('tr');
  if (!row) return;
  const product = HK_WALLPAPER_PRODUCTS[Number(row.dataset.rowIndex)];
  if (!product) return;
  product.price = _hkIsoDraftParseNumber(input.value);
  const metrics = _hkWallpaperMetrics(product.cost, product.price);
  row.querySelector('.hk-sub-margin').textContent = _hkIsoDraftNumber(metrics.margin);
  row.querySelector('.hk-sub-fee').textContent = _hkIsoDraftNumber(metrics.fee);
  row.querySelector('.hk-sub-vat').textContent = _hkIsoDraftNumber(metrics.vat);
  row.querySelector('.hk-sub-net-margin').textContent = _hkIsoDraftNumber(metrics.netMargin);
  row.querySelector('.hk-sub-net-rate').textContent = _hkIsoDraftNumber(metrics.netRate, '%');
  const historyEl = row.querySelector('.hk-iso-price-history');
  if (historyEl) historyEl.hidden = Number(input.dataset.originalPrice) === product.price;
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

/* 판매가 칸 — 연필 아이콘을 눌러야 수정되는 방식(다른 카테고리와 같은 UX). */
window.beginHkWallpaperRowPriceEdit = function(source) {
  const cell = source.closest('.hk-iso-draft-price');
  const input = cell?.querySelector('.hk-iso-final-price-input');
  if (!input) return;
  input.dataset.editStartPrice = String(_hkIsoDraftParseNumber(input.value));
  input.readOnly = false;
  cell.classList.add('editing');
  input.focus();
  input.select();
};

window.finishHkWallpaperRowPriceEdit = function(input) {
  window.formatHkIsoDraftPrice(input);
  input.readOnly = true;
  input.closest('.hk-iso-draft-price')?.classList.remove('editing');
  const history = input.closest('.hk-iso-draft-price')?.querySelector('.hk-iso-price-history');
  if (history) history.hidden = Number(input.dataset.originalPrice) === _hkIsoDraftParseNumber(input.value);
};

window.revertHkWallpaperRowPrice = function(button) {
  const cell = button.closest('.hk-iso-draft-price');
  const input = cell?.querySelector('.hk-iso-final-price-input');
  if (!input) return;
  input.value = Number(input.dataset.originalPrice || 0).toLocaleString();
  window.recalcHkWallpaperRow(input);
  input.readOnly = true;
  cell.classList.remove('editing');
};

window.handleHkWallpaperRowPriceKey = function(event, input) {
  if (event.key === 'Enter') input.blur();
  if (event.key === 'Escape') {
    input.value = Number(input.dataset.editStartPrice || input.dataset.originalPrice || 0).toLocaleString();
    window.recalcHkWallpaperRow(input);
    input.blur();
  }
};

/* pricing-hankook-db.js가 부르는 색인 — 부자재·열반사단열재와 같은 모양. */
window.hkWallpaperProductIndex = function() {
  return HK_WALLPAPER_PRODUCTS.map((row, rowIndex) => ({
    code: row.code,
    block: null,
    ship: {},
    row,
    rowIndex,
    accordionId: 'wallpaper_all',
    categoryId: 'hk_wallpaper',
  }));
};

window.hkWallpaperPriceByCode = function(code) {
  // 쿠팡 위너 전용 코드(WP_..._C)는 같은 상품을 경쟁 가격 맞추려고 다른 코드로 등록한 것뿐이라
  // "_C"를 떼고 원래 코드로 찾는다(사용자 확인 2026-09-23 — 아이소핑크 위너와 같은 방식).
  const product = HK_WALLPAPER_PRODUCTS.find(item => item.code === code)
    || HK_WALLPAPER_PRODUCTS.find(item => item.code === code.replace(/_C$/, ''));
  return product ? Number(product.price) : null;
};

/* ═══════════════════════════════════════
   한국단열(hkd) 채널 연결 (2026-09-23)

   상품ID가 4개인데 647994348·11502054249 두 그룹이 같은 12개 코드(2.3M/10M/20M × 4상품)를
   그대로 중복해서 판다(자사몰 상품 페이지 2개, 사용자가 준 데이터 그대로 — 반품/교환비만 다름).
   669533622는 1M 단위(제주 추가배송 3,500원/5개마다), 3394369231은 20M(롤형) + 신규 추가한
   2.3M×10장(판상형) 묶음. 제주배송비 20,000원·반품/교환비 10000/20000은 전 그룹 공통.
═══════════════════════════════════════ */
(function addWallpaperHkdChannelProducts() {
  const product = (productId, baseShipping, shippingBasis, jejuShipping, returnExchange, rows) => ({
    categoryId: 'hk_wallpaper',
    productId,
    baseShipping,
    shippingBasis,
    jejuShipping,
    returnExchange,
    items: rows.map(([productName, productCode]) => ({
      productCode,
      productName,
      prevPrice: _hkChannelTargetPrice('hk_wallpaper', productCode, 'hkd', null, null) ?? 0,
      prevShipping: baseShipping,
    })),
  });

  const standardRows = [
    ['단열벽지 고급형1 5T x 2.3m', 'WP_P1_5_23'],
    ['단열벽지 고급형1 5T x 10m', 'WP_P1_5_10'],
    ['단열벽지 고급형1 5T x 20m', 'WP_P1_5_20'],
    ['단열벽지 고급형2 5T x 2.3m', 'WP_P2_5_23'],
    ['단열벽지 고급형2 5T x 10m', 'WP_P2_5_10'],
    ['단열벽지 고급형2 5T x 20m', 'WP_P2_5_20'],
    ['단열벽지 이중화이트 5T x 2.3m', 'WP_DW_5_23'],
    ['단열벽지 이중화이트 5T x 10m', 'WP_DW_5_10'],
    ['단열벽지 이중화이트 5T x 20m', 'WP_DW_5_20'],
    ['단열벽지 3D실크벽지 5T x 2.3m', 'WP_SK_5_23'],
    ['단열벽지 3D실크벽지 5T x 10m', 'WP_SK_5_10'],
    ['단열벽지 3D실크벽지 5T x 20m', 'WP_SK_5_20'],
  ];

  HK_CHANNEL_LISTINGS.hkd.push(
    product('647994348', 0, '-', 20000, '10000/20000', standardRows),
    product('11502054249', 0, '-', 20000, '10000/20000', standardRows),
    product('669533622', 3500, '5개마다', 20000, '10000/20000', [
      ['단열벽지 고급형1 5T x 1m', 'WP_P1_5_1'],
      ['단열벽지 고급형2 5T x 1m', 'WP_P2_5_1'],
      ['단열벽지 이중화이트 5T x 1m', 'WP_DW_5_1'],
      ['단열벽지 3D실크벽지 5T x 1m', 'WP_SK_5_1'],
    ]),
    product('3394369231', 0, '-', 20000, '10000/20000', [
      ['단열벽지 고급형1 5T x 20m(롤형)', 'WP_P1_5_20'],
      ['단열벽지 고급형2 5T x 20m(롤형)', 'WP_P2_5_20'],
      ['단열벽지 이중화이트 5T x 20m(롤형)', 'WP_DW_5_20'],
      ['단열벽지 3D실크벽지 5T x 20m(롤형)', 'WP_SK_5_20'],
      ['단열벽지 고급형1 5T x 2.3m_10장(판상형)', 'WP_P1_5_23_10'],
      ['단열벽지 고급형2 5T x 2.3m_10장(판상형)', 'WP_P2_5_23_10'],
      ['단열벽지 이중화이트 5T x 2.3m_10장(판상형)', 'WP_DW_5_23_10'],
      ['단열벽지 3D실크벽지 5T x 2.3m_10장(판상형)', 'WP_SK_5_23_10'],
    ]),
    // 3D실크벽지는 색상/패턴 시리즈별로 상품 페이지가 여러 개인데(옥스포드·클레이·화이트계열 등),
    // 전부 같은 WP_SK_5_* 코드를 그대로 쓴다(색상만 다르고 원가·판매가는 공통 — 사용자가 준 데이터 그대로).
    product('7934125826', 0, '-', 20000, '10000/20000', [
      ['단열벽지 3D실크벽지 5T x 2.3m', 'WP_SK_5_23'],
      ['단열벽지 3D실크벽지 5T x 10m', 'WP_SK_5_10'],
      ['단열벽지 3D실크벽지 5T x 20m', 'WP_SK_5_20'],
      ['단열벽지 3D실크벽지 5T x 2.3m_10장(판상형)', 'WP_SK_5_23_10'],
    ]),
    // 11355611905는 네이버 "그룹상품"이다(2026-09-29) — 사이즈(2.3m/10m/20m) × 디자인 11종 = 33개 상품이 각자 상품번호를
    // 가지고 한 페이지로 묶여 있어서, 옵션 하나로 등록하면 스토어 가격검사에 안 잡힌다. 스마트스토어센터 그룹상품 관리
    // 화면(사용자 캡처)의 상품번호로 33개를 각각 상품(항목 1개)으로 등록하고 "그룹상품" 배지(groupProduct)를 붙인다.
    // 디자인 이름에 "실크"가 있으면 3D실크(WP_SK_5_*), 아니면 이중화이트(WP_DW_5_*) — 화이트 그레이·파벽 그레이는
    // 이중화이트로 가정했다(이중화이트·실크는 2.3m/10m/20m 판매가가 같아서 가격검사엔 영향 없음). 20m의 793은 792가 빠진 번호.
    ...((groupMembers) => groupMembers.flatMap(([size, sizeLabel, members]) => members.map(([productId, design]) => {
      const silk = design.startsWith('실크');
      const code = `${silk ? 'WP_SK' : 'WP_DW'}_5_${size}`;
      const label = silk ? design.replace(/^실크 /, '') : design;
      const name = `단열벽지 ${silk ? '3D실크벽지' : '이중화이트'} 5T x ${sizeLabel}_${label}`;
      return {
        ...product(productId, 0, '-', 20000, '10000/20000', [[name, code]]),
        groupProduct: true,
        groupProductCode: '50578581',
        groupProductLabel: '이중화이트·3D실크벽지',
      };
    })))([
      ['23', '2.3m', [['11355611905', '화이트'], ['13025493764', '화이트 그레이'], ['13025493765', '럭스 화이트'], ['13025493766', '젠틀 화이트'],
        ['13025493767', '코튼 화이트'], ['13025493768', '헤링본 화이트'], ['13025493769', '베이직 화이트'], ['13025493770', '소프트 화이트'],
        ['13025493771', '파벽 그레이'], ['13025493772', '실크 화이트 옥스포드'], ['13025493773', '실크 화이트 클레이']]],
      ['10', '10m', [['13025493775', '화이트'], ['13025493776', '화이트 그레이'], ['13025493777', '럭스 화이트'], ['13025493778', '젠틀 화이트'],
        ['13025493779', '코튼 화이트'], ['13025493780', '헤링본 화이트'], ['13025493781', '베이직 화이트'], ['13025493782', '소프트 화이트'],
        ['13025493783', '파벽 그레이'], ['13025493784', '실크 화이트 옥스포드'], ['13025493785', '실크 화이트 클레이']]],
      ['20', '20m', [['13025493786', '화이트'], ['13025493787', '화이트 그레이'], ['13025493788', '럭스 화이트'], ['13025493789', '젠틀 화이트'],
        ['13025493790', '코튼 화이트'], ['13025493791', '헤링본 화이트'], ['13025493793', '베이직 화이트'], ['13025493794', '소프트 화이트'],
        ['13025493795', '파벽 그레이'], ['13025493796', '실크 화이트 옥스포드'], ['13025493797', '실크 화이트 클레이']]],
    ]),
    product('11351466629', 0, '-', 20000, '10000/20000', [
      ['단열벽지 3D실크벽지 5T x 2.3m_옥스포드시리즈', 'WP_SK_5_23'],
      ['단열벽지 3D실크벽지 5T x 10m_옥스포드시리즈', 'WP_SK_5_10'],
      ['단열벽지 3D실크벽지 5T x 20m_옥스포드시리즈', 'WP_SK_5_20'],
    ]),
    product('11351478928', 0, '-', 20000, '10000/20000', [
      ['단열벽지 3D실크벽지 5T x 2.3m_클레이시리즈', 'WP_SK_5_23'],
      ['단열벽지 3D실크벽지 5T x 10m_클레이시리즈', 'WP_SK_5_10'],
      ['단열벽지 3D실크벽지 5T x 20m_클레이시리즈', 'WP_SK_5_20'],
    ]),
  );
})();

/* ═══════════════════════════════════════
   홈페이지 채널 — 단열벽지 (2026-09-23, 사용자가 준 표 8행). 상품ID는 네이버 상품번호가 아니라
   부자재·열반사단열재 홈페이지 채널과 같은 내부 목록 번호(짧은 숫자), 옵션마다 하나씩(비접착/접착
   쌍이 아니라 단품). 10M/20M 두 길이만 있다(1M/2.3M/2.3M×10장은 홈페이지에 없음 — 사용자가 준
   데이터 그대로). 제주배송비는 배송비와 같은 값(열반사단열재 홈페이지 채널과 같은 규칙).
═══════════════════════════════════════ */
(function addWallpaperHomepageProducts() {
  const single = (productId, baseShipping, name, code) => ({
    categoryId: 'hk_wallpaper',
    productId,
    baseShipping,
    shippingBasis: '1개마다',
    jejuShipping: baseShipping,
    items: [{ productCode: code, productName: name, prevPrice: _hkChannelTargetPrice('hk_wallpaper', code, 'homepage', null, null) ?? 0, prevShipping: baseShipping }],
  });

  HK_CHANNEL_LISTINGS.homepage.push(
    single('97', 20000, '단열벽지 고급형1 10m', 'WP_P1_5_10'),
    single('95', 20000, '단열벽지 고급형1 20m', 'WP_P1_5_20'),
    single('98', 20000, '단열벽지 고급형2 10m', 'WP_P2_5_10'),
    single('251', 20000, '단열벽지 고급형2 20m', 'WP_P2_5_20'),
    single('250', 20000, '단열벽지 이중화이트 10m', 'WP_DW_5_10'),
    single('96', 20000, '단열벽지 이중화이트 20m', 'WP_DW_5_20'),
    single('252', 20000, '단열벽지 실크형 10m', 'WP_SK_5_10'),
    single('253', 20000, '단열벽지 실크형 20m', 'WP_SK_5_20'),
  );
})();

/* ═══════════════════════════════════════
   ESM 채널 — 단열벽지 (2026-09-23, 사용자가 준 표 12행, 상품 4개). 열반사단열재 ESM과 같은 계산식
   (판매가+배송비)×1.08을 100원 올림(`_hkEsmPriceParts`) — 배송비는 전부 0(표 그대로). 여기는 상품
   하나에 옵션이 여러 개 있다(마스터상품번호·상품번호 공유) — 4160666227/3746174297(3D실크벽지
   10m·20m), 4160678968/3746174297(3D실크벽지 2.3m), 4160842413/4751750159(고급형1·2/이중화이트
   10m·20m 6옵션), 4160851976/3759009570(고급형1·2/이중화이트 10m만 3옵션). 12행 전부 등록가 일치 확인.
═══════════════════════════════════════ */
(function addWallpaperEsmProducts() {
  const groups = [
    { groupName: '단열벽지 3D실크벽지 10m·20m', masterId: '4160666227', productId: '3746169320', rows: [
      ['단열벽지 3D실크벽지 5T x 10m', 'WP_SK_5_10', 0],
      ['단열벽지 3D실크벽지 5T x 20m', 'WP_SK_5_20', 0],
    ] },
    { groupName: '단열벽지 3D실크벽지 2.3m', masterId: '4160678968', productId: '3746174297', rows: [
      ['단열벽지 3D실크벽지 5T x 2.3m', 'WP_SK_5_23', 0],
    ] },
    { groupName: '단열벽지 고급형1·2/이중화이트 10m·20m', masterId: '4160842413', productId: '4751750159', rows: [
      ['단열벽지 고급형1 5T x 10m', 'WP_P1_5_10', 0],
      ['단열벽지 고급형2 5T x 10m', 'WP_P2_5_10', 0],
      ['단열벽지 이중화이트 5T x 10m', 'WP_DW_5_10', 0],
      ['단열벽지 고급형1 5T x 20m', 'WP_P1_5_20', 0],
      ['단열벽지 고급형2 5T x 20m', 'WP_P2_5_20', 0],
      ['단열벽지 이중화이트 5T x 20m', 'WP_DW_5_20', 0],
    ] },
    { groupName: '단열벽지 고급형1·2/이중화이트 10m', masterId: '4160851976', productId: '3759009570', rows: [
      ['단열벽지 고급형1 5T x 10m', 'WP_P1_5_10', 0],
      ['단열벽지 고급형2 5T x 10m', 'WP_P2_5_10', 0],
      ['단열벽지 이중화이트 5T x 10m', 'WP_DW_5_10', 0],
    ] },
  ];
  const config = HK_CHANNEL_CONFIG.esm;
  groups.forEach(({ groupName, masterId, productId, rows }) => {
    const items = rows.map(([productName, productCode, hkdShipping]) => {
      const item = { productCode, productName, hkdShipping };
      item.prevPrice = _hkEsmPriceParts('hk_wallpaper', productCode, config, item)?.finalPrice ?? 0;
      return item;
    });
    HK_CHANNEL_LISTINGS.esm.push({ categoryId: 'hk_wallpaper', productId, masterId, groupName, items });
  });
})();

/* ═══════════════════════════════════════
   11번가 채널 — 단열벽지 (2026-09-23, 사용자가 준 표 12행, 마스터상품번호 2개). ESM과 같은 계산식
   (×1.08, 100원 올림, HK_CHANNEL_CONFIG['11st']도 markupPercent:108). 1m 그룹(1684647231)은 배송비
   3,500(한국단열 채널 1m 그룹과 같은 값), 10m·20m 그룹(1680254582)은 배송비 0. 두 그룹 전부 첫
   옵션(고급형1)이 옵션추가금 0인 기준가라 baseCode 따로 안 줘도 된다. 12행 전부 등록가 일치 확인.
═══════════════════════════════════════ */
const HK_WALLPAPER_11ST_GROUPS = [
  { productId: '1684647231', shipping: 3500, codes: [
    ['WP_P1_5_1', '단열벽지 고급형1 5T x 1m'], ['WP_P2_5_1', '단열벽지 고급형2 5T x 1m'],
    ['WP_DW_5_1', '단열벽지 이중화이트 5T x 1m'], ['WP_SK_5_1', '단열벽지 3D실크벽지 5T x 1m'],
  ] },
  { productId: '1680254582', shipping: 0, codes: [
    ['WP_P1_5_10', '단열벽지 고급형1 5T x 10m'], ['WP_P2_5_10', '단열벽지 고급형2 5T x 10m'],
    ['WP_DW_5_10', '단열벽지 이중화이트 5T x 10m'], ['WP_SK_5_10', '단열벽지 3D실크벽지 5T x 10m'],
    ['WP_P1_5_20', '단열벽지 고급형1 5T x 20m'], ['WP_P2_5_20', '단열벽지 고급형2 5T x 20m'],
    ['WP_DW_5_20', '단열벽지 이중화이트 5T x 20m'], ['WP_SK_5_20', '단열벽지 3D실크벽지 5T x 20m'],
  ] },
];
(function addWallpaper11stProducts() {
  const config = HK_CHANNEL_CONFIG['11st'];
  HK_WALLPAPER_11ST_GROUPS.forEach(group => {
    const items = group.codes.map(([code, name]) => {
      const item = { productCode: code, productName: name, hkdShipping: group.shipping };
      item.prevPrice = _hkEsmPriceParts('hk_wallpaper', code, config, item)?.finalPrice ?? 0;
      return item;
    });
    HK_CHANNEL_LISTINGS['11st'].push({ categoryId: 'hk_wallpaper', productId: group.productId, items });
  });
})();

/* ═══════════════════════════════════════
   쿠팡 채널 — 단열벽지 (2026-09-23, 사용자가 준 표 앞쪽 12행 — 2.3m/10m/20m, 무료배송). 등록가 =
   총액(=판매가, 배송비 0)×1.16을 **100원 단위 반올림**(열반사단열재와 같은 반올림 규칙,
   `_hkCoupangPriceParts`에 hk_wallpaper 추가). 최종가 = 등록가×(1-쿠폰10%) — 무료배송인데도 쿠폰이
   기본 분기(무료배송 12%)가 아니라 10%라서 `item.couponOff=10`을 명시로 강제했다(12행 전부 일치
   확인). 제주배송비·반품교환비는 길이별로 다르다(2.3m 6000/12000, 10m 10000/20000, 20m 20000/40000).
   2.3m 그룹 4개 전부(사용자 확인 — "실크까지 총 4개다") 열반사단열재처럼 즉시할인 쿠폰과 별개인
   조건부 다운로드 쿠폰이 있어서 item.memo로 남겼다(가격 계산에는 안 씀).
═══════════════════════════════════════ */
(function addWallpaperCoupangProducts() {
  const config = HK_CHANNEL_CONFIG.coupang;
  /* 옵션 전체 등록 (2026-10-01, 셀러 오피스 옵션 목록 204개 — 옵션 ID·등록 옵션명·판매상태를 그대로 옮김, 사용자 지시 "전체 옵션 다 넣어").
     유형(고급형1 P1·고급형2 P2·이중화이트 DW·3D 실크 SK)별로 가격이 같아서 상품코드는 WP_{유형}_5_{길이}를 공유한다 —
     그래서 판매상태·수동가·메모의 DB 열쇠는 상품코드가 아니라 옵션 ID다(item.keyByOption, pricing-hankook-db.js).
     행 = [옵션 ID, 유형, 등록 옵션명, 판매중지면 1]. 셀러 오피스 판매가격이 단가표 등록가와 일치함을 확인했다. */
  // 옵션이 68개씩이라 표가 길어서 상품(2.3m·10m·20m)별로 접는다(item.section — 창문형단열재와 같은 구간 접기, 기본 접힘). 업체상품 ID는 셀러 오피스 값.
  const group = (productId, vendorProductId, length, jejuShipping, returnExchange, rows, memo) => {
    const items = rows.map(([optionId, type, productName, stopped]) => {
      const code = `WP_${type}_5_${length}`;
      const item = { productCode: code, optionId, productName, hkdShipping: 0, couponOff: 10, keyByOption: true,
        section: `단열벽지 ${length === 23 ? '2.3' : length}m`, sectionId: vendorProductId };
      if (memo) item.memo = memo;
      const parts = _hkCoupangPriceParts('hk_wallpaper', code, config, item, null);
      item.prevPrice = parts ? parts.registered : 0;
      // 판매중지 옵션 — status는 DB를 불러올 때 지워지므로 seedStatus에도 적어 둔다(코드 기본값).
      if (stopped) { item.status = 'stopped'; item.seedStatus = 'stopped'; }
      return item;
    });
    return { categoryId: 'hk_wallpaper', productId, baseShipping: 0, jejuShipping, returnExchange, items };
  };
  const conditionalCouponMemo = '다운로드 쿠폰(조건부): 5만원↑ 2천원 / 10만원↑ 5천원 할인';

  HK_CHANNEL_LISTINGS.coupang.push(
    group('8581028952', '15371038922', 23, 6000, '12000', [
      ['91879058115', 'P1', '고급형1_2.3m 42.모노라인'],
      ['91879058062', 'P1', '고급형1_2.3m 43.스트라이프 베이지'],
      ['91879058023', 'P1', '고급형1_2.3m 44.스트라이프 블루'],
      ['91879058081', 'P1', '고급형1_2.3m 45.캔버스 그린'],
      ['91879058190', 'P1', '고급형1_2.3m 47.파벽 브라운', 1],
      ['91879058156', 'P1', '고급형1_2.3m 48.파스텔 민트'],
      ['91879058256', 'P1', '고급형1_2.3m 49.파스텔 올리브'],
      ['91879058150', 'P1', '고급형1_2.3m 50.파스텔 핑크'],
      ['91879058014', 'P1', '고급형1_2.3m 51.에펠탑'],
      ['91879058178', 'P1', '고급형1_2.3m 52.러블리 하트'],
      ['91879058221', 'P1', '고급형1_2.3m 53.파인트리'],
      ['91879058316', 'P1', '고급형1_2.3m 54.한지'],
      ['91879058005', 'P1', '고급형1_2.3m 55.피오레'],
      ['91879057961', 'P1', '고급형1_2.3m 56.플로라'],
      ['91879057977', 'P2', '고급형2_2.3m 04.프랜치 바닐라'],
      ['91879058088', 'P2', '고급형2_2.3m 05.프랜치 그린'],
      ['91879058395', 'P2', '고급형2_2.3m 06.프랜치 블루'],
      ['91879058273', 'P2', '고급형2_2.3m 07.프랜치 민트'],
      ['91879058216', 'P2', '고급형2_2.3m 08.프랜치 핑크'],
      ['91879058342', 'P2', '고급형2_2.3m 09.모스 그레이'],
      ['91879057996', 'P2', '고급형2_2.3m 10.모스 민트'],
      ['91879058266', 'P2', '고급형2_2.3m 12.럭스 스카이블루'],
      ['91879058423', 'P2', '고급형2_2.3m 13.럭스 베이지'],
      ['91879058210', 'P2', '고급형2_2.3m 15.젠틀 바닐라'],
      ['91879058230', 'P2', '고급형2_2.3m 16.젠틀 민트'],
      ['91879058045', 'P2', '고급형2_2.3m 17.젠틀 라일락'],
      ['91879058246', 'P2', '고급형2_2.3m 19.젠틀 그레이'],
      ['91879058029', 'P2', '고급형2_2.3m 21.코튼 블루'],
      ['91879058373', 'P2', '고급형2_2.3m 22.코튼 핑크'],
      ['91879058199', 'P2', '고급형2_2.3m 24.코튼 그레이'],
      ['91879058307', 'P2', '고급형2_2.3m 26.헤링본 그레이'],
      ['91879058095', 'P2', '고급형2_2.3m 27.헤링본 브라운'],
      ['91879058142', 'P2', '고급형2_2.3m 28.헤링본 딥블루'],
      ['91879058354', 'P2', '고급형2_2.3m 30.베이직 브라운'],
      ['91879058138', 'P2', '고급형2_2.3m 31.베이직 다크퍼플'],
      ['91879058214', 'P2', '고급형2_2.3m 32.베이직 그레이'],
      ['91879058077', 'P2', '고급형2_2.3m 34.소프트 그레이'],
      ['91879058299', 'P2', '고급형2_2.3m 35.소프트 올리브'],
      ['91879058071', 'P2', '고급형2_2.3m 36.소프트 민트'],
      ['91879058385', 'P2', '고급형2_2.3m 37.소프트 카키'],
      ['91879058207', 'P2', '고급형2_2.3m 38.소프트 핑크'],
      ['91879058224', 'P2', '고급형2_2.3m 39.소프트 라임'],
      ['91879057944', 'P2', '고급형2_2.3m 40.소프트 퍼플'],
      ['91879058133', 'DW', '이중화이트_2.3m 02.화이트그레이', 1],
      ['91879058330', 'DW', '이중화이트_2.3m 11.럭스 화이트'],
      ['91879058122', 'DW', '이중화이트_2.3m 14.젠틀 화이트'],
      ['91879058413', 'DW', '이중화이트_2.3m 20.코튼 화이트'],
      ['91879058034', 'DW', '이중화이트_2.3m 25.헤링본 화이트'],
      ['91879058041', 'DW', '이중화이트_2.3m 29.베이직 화이트'],
      ['91879058168', 'DW', '이중화이트_2.3m 33.소프트 화이트'],
      ['91879058405', 'DW', '이중화이트_2.3m 46.파벽 그레이'],
      ['91879058108', 'SK', '3D 실크벽지_2.3m 화이트 옥스포드'],
      ['91879058066', 'SK', '3D 실크벽지_2.3m 코지 웜그레이 옥스포드'],
      ['91879058291', 'SK', '3D 실크벽지_2.3m 라이트 그레이 옥스포드', 1],
      ['91879058282', 'SK', '3D 실크벽지_2.3m 퓨어 그레이 옥스포드'],
      ['91879057956', 'SK', '3D 실크벽지_2.3m 페브릭 옥스포드'],
      ['91879057932', 'SK', '3D 실크벽지_2.3m 허브 옥스포드'],
      ['91879058058', 'SK', '3D 실크벽지_2.3m 데님블루 옥스포드', 1],
      ['91879057964', 'SK', '3D 실크벽지_2.3m 코지블루 옥스포드'],
      ['91879057985', 'SK', '3D 실크벽지_2.3m 화이트 클레이'],
      ['91879057922', 'SK', '3D 실크벽지_2.3m 코지 웜그레이 클레이'],
      ['91879058128', 'SK', '3D 실크벽지_2.3m 라이트 그레이 클레이'],
      ['91879058101', 'SK', '3D 실크벽지_2.3m 퓨어 그레이 클레이'],
      ['91879058051', 'SK', '3D 실크벽지_2.3m 페브릭 클레이'],
      ['91879058161', 'SK', '3D 실크벽지_2.3m 허브 클레이'],
      ['91879057949', 'SK', '3D 실크벽지_2.3m 데님블루 클레이', 1],
      ['91879057969', 'SK', '3D 실크벽지_2.3m 코지블루 클레이'],
      ['91879058237', 'SK', '3D 실크벽지_2.3m 모던라인 화이트', 1],
    ], conditionalCouponMemo),
    group('8581386325', '15371405367', 10, 10000, '20000', [
      ['91880312212', 'P1', '42.모노라인 고급형1_10m'],
      ['91880312167', 'P1', '43.스트라이프 베이지 고급형1_10m'],
      ['91880312233', 'P1', '44.스트라이프 블루 고급형1_10m'],
      ['91880312325', 'P1', '45.캔버스 그린 고급형1_10m'],
      ['91880312182', 'P1', '47.파벽 브라운 고급형1_10m', 1],
      ['91880312288', 'P1', '48.파스텔 민트 고급형1_10m'],
      ['91880312460', 'P1', '49.파스텔 올리브 고급형1_10m'],
      ['91880312241', 'P1', '50.파스텔 핑크 고급형1_10m'],
      ['91880312257', 'P1', '51.에펠탑 고급형1_10m'],
      ['91880312202', 'P1', '52.러블리 하트 고급형1_10m'],
      ['91880312296', 'P1', '53.파인트리 고급형1_10m'],
      ['91880312692', 'P1', '54.한지 고급형1_10m'],
      ['91880312351', 'P1', '55.피오레 고급형1_10m'],
      ['91880312175', 'P1', '56.플로라 고급형1_10m'],
      ['91880312270', 'P2', '04.프랜치 바닐라 고급형2_10m'],
      ['91880312192', 'P2', '05.프랜치 그린 고급형2_10m'],
      ['91880312506', 'P2', '06.프랜치 블루 고급형2_10m'],
      ['91880312315', 'P2', '07.프랜치 민트 고급형2_10m'],
      ['91880312439', 'P2', '08.프랜치 핑크 고급형2_10m'],
      ['91880312394', 'P2', '09.모스 그레이 고급형2_10m'],
      ['91880312671', 'P2', '10.모스 민트 고급형2_10m'],
      ['91880312677', 'P2', '12.럭스 스카이블루 고급형2_10m'],
      ['91880312578', 'P2', '13.럭스 베이지 고급형2_10m'],
      ['91880312619', 'P2', '15.젠틀 바닐라 고급형2_10m'],
      ['91880312606', 'P2', '16.젠틀 민트 고급형2_10m'],
      ['91880312513', 'P2', '17.젠틀 라일락 고급형2_10m'],
      ['91880312410', 'P2', '19.젠틀 그레이 고급형2_10m'],
      ['91880312687', 'P2', '21.코튼 블루 고급형2_10m'],
      ['91880312454', 'P2', '22.코튼 핑크 고급형2_10m'],
      ['91880312556', 'P2', '24.코튼 그레이 고급형2_10m'],
      ['91880312573', 'P2', '26.헤링본 그레이 고급형2_10m'],
      ['91880312449', 'P2', '27.헤링본 브라운 고급형2_10m'],
      ['91880312683', 'P2', '28.헤링본 딥블루 고급형2_10m'],
      ['91880312381', 'P2', '30.베이직 브라운 고급형2_10m'],
      ['91880312419', 'P2', '31.베이직 다크퍼플 고급형2_10m'],
      ['91880312718', 'P2', '32.베이직 그레이 고급형2_10m'],
      ['91880312487', 'P2', '34.소프트 그레이 고급형2_10m'],
      ['91880312592', 'P2', '35.소프트 올리브 고급형2_10m'],
      ['91880312358', 'P2', '36.소프트 민트 고급형2_10m'],
      ['91880312475', 'P2', '37.소프트 카키 고급형2_10m'],
      ['91880312664', 'P2', '38.소프트 핑크 고급형2_10m'],
      ['91880312640', 'P2', '39.소프트 라임 고급형2_10m'],
      ['91880312632', 'P2', '40.소프트 퍼플 고급형2_10m'],
      ['91880312585', 'DW', '02.화이트그레이 이중화이트_10m', 1],
      ['91880312364', 'DW', '11.럭스 화이트 이중화이트_10m'],
      ['91880312372', 'DW', '14.젠틀 화이트 이중화이트_10m'],
      ['91880312646', 'DW', '20.코튼 화이트 이중화이트_10m'],
      ['91880312521', 'DW', '25.헤링본 화이트 이중화이트_10m'],
      ['91880312545', 'DW', '29.베이직 화이트 이중화이트_10m'],
      ['91880312624', 'DW', '33.소프트 화이트 이중화이트_10m'],
      ['91880312711', 'DW', '46.파벽 그레이 이중화이트_10m'],
      ['91880312613', 'SK', '화이트 옥스포드 3D 실크벽지_10m'],
      ['91880312697', 'SK', '코지 웜그레이 옥스포드 3D 실크벽지_10m'],
      ['91880312248', 'SK', '라이트 그레이 옥스포드 3D 실크벽지_10m'],
      ['91880312702', 'SK', '퓨어 그레이 옥스포드 3D 실크벽지_10m'],
      ['91880312341', 'SK', '페브릭 옥스포드 3D 실크벽지_10m'],
      ['91880312499', 'SK', '허브 옥스포드 3D 실크벽지_10m'],
      ['91880312401', 'SK', '데님블루 옥스포드 3D 실크벽지_10m', 1],
      ['91880312305', 'SK', '코지블루 옥스포드 3D 실크벽지_10m'],
      ['91880312565', 'SK', '화이트 클레이 3D 실크벽지_10m', 1],
      ['91880312468', 'SK', '코지 웜그레이 클레이 3D 실크벽지_10m'],
      ['91880312333', 'SK', '라이트 그레이 클레이 3D 실크벽지_10m'],
      ['91880312654', 'SK', '퓨어 그레이 클레이 3D 실크벽지_10m'],
      ['91880312223', 'SK', '페브릭 클레이 3D 실크벽지_10m'],
      ['91880312599', 'SK', '허브 클레이 3D 실크벽지_10m'],
      ['91880312278', 'SK', '데님블루 클레이 3D 실크벽지_10m', 1],
      ['91880312426', 'SK', '코지블루 클레이 3D 실크벽지_10m'],
      ['91880312533', 'SK', '모던라인 화이트 3D 실크벽지_10m', 1],
    ]),
    group('8581394474', '15371406769', 20, 20000, '40000', [
      ['91880335865', 'P1', '42.모노라인 고급형1_20m'],
      ['91880335650', 'P1', '43.스트라이프 베이지 고급형1_20m'],
      ['91880336037', 'P1', '44.스트라이프 블루 고급형1_20m'],
      ['91880335558', 'P1', '45.캔버스 그린 고급형1_20m'],
      ['91880335812', 'P1', '47.파벽 브라운 고급형1_20m', 1],
      ['91880335909', 'P1', '48.파스텔 민트 고급형1_20m'],
      ['91880335695', 'P1', '49.파스텔 올리브 고급형1_20m'],
      ['91880335581', 'P1', '50.파스텔 핑크 고급형1_20m'],
      ['91880335608', 'P1', '51.에펠탑 고급형1_20m'],
      ['91880335764', 'P1', '52.러블리 하트 고급형1_20m'],
      ['91880335989', 'P1', '53.파인트리 고급형1_20m'],
      ['91880335961', 'P1', '54.한지 고급형1_20m'],
      ['91880335621', 'P1', '55.피오레 고급형1_20m'],
      ['91880335591', 'P1', '56.플로라 고급형1_20m'],
      ['91880335893', 'P2', '04.프랜치 바닐라 고급형2_20m'],
      ['91880336014', 'P2', '05.프랜치 그린 고급형2_20m'],
      ['91880335564', 'P2', '06.프랜치 블루 고급형2_20m'],
      ['91880335984', 'P2', '07.프랜치 민트 고급형2_20m'],
      ['91880335884', 'P2', '08.프랜치 핑크 고급형2_20m'],
      ['91880335756', 'P2', '09.모스 그레이 고급형2_20m'],
      ['91880336002', 'P2', '10.모스 민트 고급형2_20m'],
      ['91880335570', 'P2', '12.럭스 스카이블루 고급형2_20m'],
      ['91880335936', 'P2', '13.럭스 베이지 고급형2_20m'],
      ['91880336020', 'P2', '15.젠틀 바닐라 고급형2_20m', 1],
      ['91880335631', 'P2', '16.젠틀 민트 고급형2_20m'],
      ['91880335871', 'P2', '17.젠틀 라일락 고급형2_20m'],
      ['91880335702', 'P2', '19.젠틀 그레이 고급형2_20m'],
      ['91880335972', 'P2', '21.코튼 블루 고급형2_20m'],
      ['91880335640', 'P2', '22.코튼 핑크 고급형2_20m'],
      ['91880336032', 'P2', '24.코튼 그레이 고급형2_20m'],
      ['91880335454', 'P2', '26.헤링본 그레이 고급형2_20m'],
      ['91880335804', 'P2', '27.헤링본 브라운 고급형2_20m'],
      ['91880335925', 'P2', '28.헤링본 딥블루 고급형2_20m'],
      ['91880335725', 'P2', '30.베이직 브라운 고급형2_20m'],
      ['91880335857', 'P2', '31.베이직 다크퍼플 고급형2_20m'],
      ['91880335944', 'P2', '32.베이직 그레이 고급형2_20m'],
      ['91880335714', 'P2', '34.소프트 그레이 고급형2_20m'],
      ['91880335784', 'P2', '35.소프트 올리브 고급형2_20m'],
      ['91880335478', 'P2', '36.소프트 민트 고급형2_20m'],
      ['91880335675', 'P2', '37.소프트 카키 고급형2_20m'],
      ['91880335750', 'P2', '38.소프트 핑크 고급형2_20m'],
      ['91880335877', 'P2', '39.소프트 라임 고급형2_20m'],
      ['91880336026', 'P2', '40.소프트 퍼플 고급형2_20m'],
      ['91880335818', 'DW', '02.화이트그레이 이중화이트_20m', 1],
      ['91880335997', 'DW', '11.럭스 화이트 이중화이트_20m'],
      ['91880335487', 'DW', '14.젠틀 화이트 이중화이트_20m'],
      ['91880335406', 'DW', '20.코튼 화이트 이중화이트_20m'],
      ['91880335554', 'DW', '25.헤링본 화이트 이중화이트_20m'],
      ['91880335433', 'DW', '29.베이직 화이트 이중화이트_20m'],
      ['91880335979', 'DW', '33.소프트 화이트 이중화이트_20m'],
      ['91880336008', 'DW', '46.파벽 그레이 이중화이트_20m'],
      ['91880336029', 'SK', '화이트 옥스포드 3D 실크벽지_20m'],
      ['91880335392', 'SK', '코지 웜그레이 옥스포드 3D 실크벽지_20m'],
      ['91880335663', 'SK', '라이트 그레이 옥스포드 3D 실크벽지_20m'],
      ['91880335466', 'SK', '퓨어 그레이 옥스포드 3D 실크벽지_20m'],
      ['91880335834', 'SK', '페브릭 옥스포드 3D 실크벽지_20m'],
      ['91880335952', 'SK', '허브 옥스포드 3D 실크벽지_20m'],
      ['91880335776', 'SK', '데님블루 옥스포드 3D 실크벽지_20m', 1],
      ['91880335900', 'SK', '코지블루 옥스포드 3D 실크벽지_20m'],
      ['91880335829', 'SK', '화이트 클레이 3D 실크벽지_20m'],
      ['91880335376', 'SK', '코지 웜그레이 클레이 3D 실크벽지_20m'],
      ['91880335917', 'SK', '라이트 그레이 클레이 3D 실크벽지_20m'],
      ['91880335736', 'SK', '퓨어 그레이 클레이 3D 실크벽지_20m'],
      ['91880335846', 'SK', '페브릭 클레이 3D 실크벽지_20m'],
      ['91880335597', 'SK', '허브 클레이 3D 실크벽지_20m'],
      ['91880335419', 'SK', '데님블루 클레이 3D 실크벽지_20m', 1],
      ['91880335443', 'SK', '코지블루 클레이 3D 실크벽지_20m'],
      ['91880335796', 'SK', '모던라인 화이트 3D 실크벽지_20m', 1],
    ]),
  );

  /* 쿠팡 위너 — 단열벽지 고급형1 10m을 무늬 이름 9개로 나눠 등록하고 경쟁 가격에 맞춰 수동 조정했다
     (사용자 확인 2026-09-23, 같은 상품·아이소핑크 위너와 같은 방식). 표에 적힌 등록가는 35,500(참고
     판매가 ×1.05를 100원 올림한 값, 위너라 쿠폰은 안 먹인다)인데, **수동 판매가(item.manualPrice)는
     여기 코드로 안 넣었다** — pricing-hankook-db.js가 DB에 저장된 채널 옵션을 적용할 때마다 모든
     item.manualPrice를 먼저 지우고 저장된 값이 있을 때만 되살리기 때문에(비우면 계산가로 돌아가는
     게 의도된 동작이라 메모처럼 기본값을 보존하게 고칠 수 없음) 코드에 넣어도 새로고침마다 지워진다.
     화면 "수동 판매가" 칸에 9개 다 35,500을 직접 입력하고 저장해야 반영된다. 그 전까지는 계산가
     (총판매가×1.05를 1,000원 단위 올림 = 48,000)가 등록가로 보이고 35,500과 차액이 뜬다.
     반품/교환비는 9옵션 중 8개가 10000/20000이라 그 값으로 통일(피오레 1옵션만 20000/40000 — 나머지
     그룹과 같은 "그룹 다수값 통일" 규칙). */
  const winnerVariants = [
    ['피오레', '94167949231'], ['에펠탑', '94167949229'], ['파벽브라운', '94167949228'], ['한지', '94167949230'],
    ['프렌치바닐라', '94175430663'], ['프렌치그린', '94175430664'], ['프렌치핑크', '94175430662'],
    ['모스그레이', '94175430665'], ['모스민트', '94175430667'],
  ];
  HK_CHANNEL_LISTINGS.coupang.push({
    categoryId: 'hk_wallpaper', productId: '1213202111', pricing: 'winner',
    baseShipping: 0, shippingBasis: '무료', jejuShipping: 10000, returnExchange: '20000',
    items: winnerVariants.map(([label, optionId]) => ({
      productCode: 'WP_P1_5_10_C', optionId, hkdShipping: 0,
      productName: `위너_단열벽지_${label}_10m`,
      prevPrice: 35500,
    })),
  });
})();

/* ═══════════════════════════════════════
   한국단열(hkd) 아이소핑크 상품 439904706에 섞여 있는 단열벽지 1m×1m 색상 옵션 (2026-09-29).
   상품은 아이소핑크(categoryId hk_isopink)인데 스토어 옵션 끝에 단열벽지 색상 옵션이 같이 들어 있다(사용자 확인 —
   색상이 엄청 많고 전부 이중화이트 1m). 그 색상마다 항목을 만들지 않고 **이중화이트 1m(WP_DW_5_1) 하나만** 넣는다:
   스토어 색상 옵션에 관리코드 WP_DW_5_1을 넣으면(사용자가 넣기로 함) 스토어 가격검사가 그 코드로 짝지어서, 같은
   관리코드가 붙은 옵션은 몇 개든 이 항목의 가격과 비교한다(price-core.js 코드 매칭은 다대일).
   - 옵션에 categoryId를 'hk_wallpaper'로 적어서 단열벽지 가격표에서 가격을 가져온다(`_hkChannelTargetPrice`가
     item.categoryId를 먼저 본다).
   - 수정 전 판매가는 스토어에 지금 올라가 있는 값(6,300원, 2026-09-28 가격검사)이고, 이중화이트 1m 실판매가도
     6,300원이라 변경 없음이다.
   - 스토어 색상 옵션에 관리코드가 아직 없으면 검사에서는 "단가표에 없음"으로 나온다.
═══════════════════════════════════════ */
/* 스티로폼 상품 437331834(hk_bead)에도 같은 식으로 단열벽지 1m 색상 옵션이 섞여 있다(2026-09-29 사용자 확인).
   화이트 계열 7개는 이중화이트(WP_DW_5_1), "화이트 옥스포드·화이트 클레이" 2개는 실크형(WP_SK_5_1) 관리코드다.
   스토어 값은 둘 다 6,300원(9/29 가격검사) — 실판매가 6,300과 같다. */
(function addWallpaperOptionsToMixedProducts() {
  const add = (productId, categoryId, items) => {
    const product = (HK_CHANNEL_LISTINGS.hkd || []).find(p => String(p.productId) === productId && p.categoryId === categoryId);
    if (!product) return;
    items.forEach(([productCode, productName]) => product.items.push({
      categoryId: 'hk_wallpaper',
      productCode,
      productName,
      prevPrice: 6300,
      prevShipping: product.baseShipping,
    }));
  };
  add('439904706', 'hk_isopink', [['WP_DW_5_1', '단열벽지 이중화이트 5T x 1m']]);
  add('437331834', 'hk_bead', [
    ['WP_DW_5_1', '단열벽지 이중화이트 5T x 1m'],
    ['WP_SK_5_1', '단열벽지 실크형 5T x 1m'],
  ]);
  // 열반사단열재 상품 505443624(hk_reflective)도 같다(2026-09-29 사용자 확인). 색상 중 화이트 옥스포드·화이트 클레이·모던라인 화이트는
  // 실크형(WP_SK_5_1), 나머지는 이중화이트(WP_DW_5_1).
  add('505443624', 'hk_reflective', [
    ['WP_DW_5_1', '단열벽지 이중화이트 5T x 1m'],
    ['WP_SK_5_1', '단열벽지 실크형 5T x 1m'],
  ]);
})();
