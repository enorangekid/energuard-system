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
   - "26.05.08 인상가(25%)" 열도 열반사단열재와 같이 참고용으로 화면에 보여준다(계산엔 안 씀).
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
  { name:'단열벽지(고급형1)', spec:'5T X 1M', code:'WP_P1_5_1', masterKey:'P1', length:1, price:3400, increase25:3600, refMargin:35 },
  { name:'단열벽지(고급형1)', spec:'5T X 2.3M(판)', code:'WP_P1_5_23', masterKey:'P1', length:2.3, price:13500, increase25:14000, refMargin:55 },
  { name:'단열벽지(고급형1)', spec:'5T X 10M', code:'WP_P1_5_10', masterKey:'P1', length:10, price:45000, increase25:48700, refMargin:50 },
  { name:'단열벽지(고급형1)', spec:'5T X 20M(롤)', code:'WP_P1_5_20', masterKey:'P1', length:20, price:69000, increase25:74900, refMargin:40 },
  { name:'단열벽지(고급형1)', spec:'5T X 2.3M X 10장(판상형)', code:'WP_P1_5_23_10', masterKey:'P1', length:23, price:91000, increase25:null, refMargin:45 },
  { name:'단열벽지(고급형2)', spec:'5T X 1M', code:'WP_P2_5_1', masterKey:'P2', length:1, price:6000, increase25:6200, refMargin:60 },
  { name:'단열벽지(고급형2)', spec:'5T X 2.3M(판)', code:'WP_P2_5_23', masterKey:'P2', length:2.3, price:16500, increase25:16700, refMargin:60 },
  { name:'단열벽지(고급형2)', spec:'5T X 10M', code:'WP_P2_5_10', masterKey:'P2', length:10, price:49000, increase25:51200, refMargin:50 },
  { name:'단열벽지(고급형2)', spec:'5T X 20M(롤)', code:'WP_P2_5_20', masterKey:'P2', length:20, price:84000, increase25:89600, refMargin:45 },
  { name:'단열벽지(고급형2)', spec:'5T X 2.3M X 10장(판상형)', code:'WP_P2_5_23_10', masterKey:'P2', length:23, price:99000, increase25:null, refMargin:45 },
  { name:'단열벽지(이중화이트)', spec:'5T X 1M', code:'WP_DW_5_1', masterKey:'DW', length:1, price:6300, increase25:6700, refMargin:55 },
  { name:'단열벽지(이중화이트)', spec:'5T X 2.3M(판)', code:'WP_DW_5_23', masterKey:'DW', length:2.3, price:19000, increase25:19200, refMargin:65 },
  { name:'단열벽지(이중화이트)', spec:'5T X 10M', code:'WP_DW_5_10', masterKey:'DW', length:10, price:54000, increase25:57600, refMargin:50 },
  { name:'단열벽지(이중화이트)', spec:'5T X 20M(롤)', code:'WP_DW_5_20', masterKey:'DW', length:20, price:90000, increase25:96000, refMargin:45 },
  { name:'단열벽지(이중화이트)', spec:'5T X 2.3M X 10장(판상형)', code:'WP_DW_5_23_10', masterKey:'DW', length:23, price:107000, increase25:null, refMargin:45 },
  { name:'단열벽지(실크형)', spec:'5T X 1M', code:'WP_SK_5_1', masterKey:'SK', length:1, price:6300, increase25:6700, refMargin:55 },
  { name:'단열벽지(실크형)', spec:'5T X 2.3M(판)', code:'WP_SK_5_23', masterKey:'SK', length:2.3, price:19000, increase25:19200, refMargin:65 },
  { name:'단열벽지(실크형)', spec:'5T X 10M', code:'WP_SK_5_10', masterKey:'SK', length:10, price:54000, increase25:57600, refMargin:55 },
  { name:'단열벽지(실크형)', spec:'5T X 20M(롤)', code:'WP_SK_5_20', masterKey:'SK', length:20, price:90000, increase25:96000, refMargin:45 },
  { name:'단열벽지(실크형)', spec:'5T X 2.3M X 10장(판상형)', code:'WP_SK_5_23_10', masterKey:'SK', length:23, price:107000, increase25:null, refMargin:50 },
  // 9T 슈퍼형은 더 이상 안 판다(사용자 확인, 2026-09-23) — 빼둠.
].map(row => ({ group: HK_WALLPAPER_MASTER[row.masterKey].label, cost: 0, ...row }));

// 이전 판매가 — 엑셀에 별도 "수정 전" 값이 없어서(신규 카테고리) 처음에는 지금 판매가와 같게 둔다.
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
    <td class="hk-sub-previous">${_hkIsoDraftNumber(product.previousPrice)}<small class="${difference > 0 ? 'up' : difference < 0 ? 'down' : ''}">${difference ? `${difference > 0 ? '+' : ''}${_hkIsoDraftNumber(difference)}` : '동일'}</small></td>
    <td class="hk-iso-draft-price hk-sub-price-cell">
      <div class="hk-iso-price-edit-wrap">
        <input type="text" inputmode="numeric" class="pricing-input-field hk-iso-final-price-input" value="${Number(product.price).toLocaleString()}" data-original-price="${Number(product.price)}" onclick="beginHkWallpaperRowPriceEdit(this)" oninput="recalcHkWallpaperRow(this)" onblur="finishHkWallpaperRowPriceEdit(this)" onkeydown="handleHkWallpaperRowPriceKey(event,this)" readonly aria-label="판매가">
        <button type="button" class="hk-iso-row-price-edit-btn" onclick="beginHkWallpaperRowPriceEdit(this)" title="이 판매가만 수정"><i class="fa-solid fa-pen"></i></button>
      </div>
      <div class="hk-iso-price-history" hidden>변경 전 <span>${Number(product.price).toLocaleString()}원</span><button type="button" onclick="revertHkWallpaperRowPrice(this)" title="변경 전 판매가로 되돌리기"><i class="fa-solid fa-rotate-left"></i></button></div>
    </td>
    <td class="hk-reflective-increase" title="26.05.08 인상가(25%) — 엑셀 참고용 숫자, 계산에는 안 쓴다">${_hkIsoDraftNumber(product.increase25)}</td>
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
        <col class="hk-reflective-col-cost"><col class="hk-sub-col-previous"><col class="hk-sub-col-price">
        <col class="hk-reflective-col-increase"><col class="hk-sub-col-margin"><col class="hk-sub-col-margin"><col class="hk-sub-col-margin">
        <col class="hk-sub-col-net"><col class="hk-sub-col-rate"><col class="hk-sub-col-rate">
      </colgroup>
      <thead><tr>
        <th class="hk-sub-head-base">품명</th><th class="hk-sub-head-base">규격</th><th class="hk-sub-head-code">상품코드</th>
        <th class="hk-sub-head-base">원가</th><th class="hk-sub-head-base">이전 판매가</th><th class="hk-sub-head-sale-price">판매가</th>
        <th class="hk-sub-head-base">26.05.08<br>인상가(25%)</th>
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
    product('11355611905', 0, '-', 20000, '10000/20000', [
      ['단열벽지 이중화이트 5T x 2.3m', 'WP_DW_5_23'],
      ['단열벽지 이중화이트 5T x 10m', 'WP_DW_5_10'],
      ['단열벽지 이중화이트 5T x 20m', 'WP_DW_5_20'],
      ['단열벽지 3D실크벽지 5T x 2.3m_화이트계열', 'WP_SK_5_23'],
      ['단열벽지 3D실크벽지 5T x 10m_화이트계열', 'WP_SK_5_10'],
      ['단열벽지 3D실크벽지 5T x 20m_화이트계열', 'WP_SK_5_20'],
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
  const group = (productId, jejuShipping, returnExchange, rows) => {
    const items = rows.map(([code, hkdShipping, memo]) => {
      const item = { productCode: code, hkdShipping, couponOff: 10 };
      if (memo) item.memo = memo;
      const parts = _hkCoupangPriceParts('hk_wallpaper', code, config, item, null);
      item.prevPrice = parts ? parts.registered : 0;
      return item;
    });
    return { categoryId: 'hk_wallpaper', productId, baseShipping: 0, jejuShipping, returnExchange, items };
  };
  const conditionalCouponMemo = '다운로드 쿠폰(조건부): 5만원↑ 2천원 / 10만원↑ 5천원 할인';

  HK_CHANNEL_LISTINGS.coupang.push(
    group('15371038922', 6000, '12000', [
      ['WP_P1_5_23', 0, conditionalCouponMemo], ['WP_P2_5_23', 0, conditionalCouponMemo],
      ['WP_DW_5_23', 0, conditionalCouponMemo], ['WP_SK_5_23', 0, conditionalCouponMemo],
    ]),
    group('15371405367', 10000, '20000', [
      ['WP_P1_5_10', 0], ['WP_P2_5_10', 0], ['WP_DW_5_10', 0], ['WP_SK_5_10', 0],
    ]),
    group('15371406769', 20000, '40000', [
      ['WP_P1_5_20', 0], ['WP_P2_5_20', 0], ['WP_DW_5_20', 0], ['WP_SK_5_20', 0],
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
