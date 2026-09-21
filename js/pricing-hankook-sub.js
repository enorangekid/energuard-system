/* ═══════════════════════════════════════
   한국단열 부자재 — 상품코드별 기준 단가 (2026-06-09 기준)

   부자재는 두께나 절단 규격이 없고 상품코드 하나가 판매 단위 하나를 뜻한다.
   배송비는 결제 시 별도로 받는 금액이라 순수마진에서 차감하지 않는다.
   순수마진 = 판매가 - 원가 - 판매수수료 6% - 부가세 10%.
═══════════════════════════════════════ */

const HK_SUB_PRODUCTS = [
  { name:'타이거폼-건용',                    code:'T_TF_G',       cost:3300,   previousPrice:5400,   price:5800,   shipping:3000, refMargin:27 },
  { name:'타이거폼-건용_깜짝할인',            code:'T_TF_G_S',     cost:3300,   previousPrice:4400,   price:4800,   shipping:3000, refMargin:15 },
  { name:'타이거폼-건용-박스',               code:'T_TF_G_B',     cost:49500,  previousPrice:75000,  price:77000,  shipping:7800, refMargin:20 },
  { name:'타이거폼-일회용',                  code:'T_TF_D',       cost:2900,   previousPrice:4800,   price:5100,   shipping:3000, refMargin:27 },
  { name:'타이거폼-일회용_깜짝할인',           code:'T_TF_D_S',     cost:2900,   previousPrice:3800,   price:4200,   shipping:3000, refMargin:15 },
  { name:'타이거폼-일회용-박스',              code:'T_TF_D_B',     cost:43500,  previousPrice:65000,  price:67000,  shipping:7800, refMargin:20 },
  { name:'타이거 이지본드-건용',              code:'T_EB_G',       cost:5150,   previousPrice:8300,   price:8700,   shipping:3000, refMargin:25 },
  { name:'타이거 이지본드-건용_깜짝할인',        code:'T_EB_G_S',     cost:5150,   previousPrice:7100,   price:7500,   shipping:3000, refMargin:15 },
  { name:'타이거 이지본드-건용-박스',           code:'T_EB_G_B',     cost:77250,  previousPrice:115000, price:118000, shipping:7800, refMargin:20 },
  { name:'타이거 이지본드-일회용',             code:'T_EB_D',       cost:4850,   previousPrice:7900,   price:8200,   shipping:3000, refMargin:25 },
  { name:'타이거 이지본드-일회용_깜짝할인',       code:'T_EB_D_S',     cost:4850,   previousPrice:6800,   price:7000,   shipping:3000, refMargin:15 },
  { name:'타이거 이지본드-일회용-박스',          code:'T_EB_D_B',     cost:72750,  previousPrice:110000, price:112000, shipping:7800, refMargin:20 },
  { name:'우레탄폼-B1',                     code:'T_B1_G',       cost:8450,   previousPrice:17500,  price:15700,  shipping:3000, refMargin:30 },
  { name:'우레탄폼-B1-박스',                  code:'T_B1_G_B',     cost:126750, previousPrice:245000, price:214000, shipping:7800, refMargin:25 },
  { name:'우레탄폼-B2',                     code:'T_B2_G',       cost:5150,   previousPrice:11500,  price:9200,   shipping:3000, refMargin:28 },
  { name:'우레탄폼-B2-박스',                  code:'T_B2_G_B',     cost:77250,  previousPrice:155000, price:128000, shipping:7800, refMargin:28 },
  { name:'우레탄폼 - 빅-65',                 code:'T_BIG65_G',    cost:5050,   previousPrice:7800,   price:8500,   shipping:3000, refMargin:25 },
  { name:'스프레이 접착제',                   code:'T_SA',         cost:3850,   previousPrice:10000,  price:10000,  shipping:3000, refMargin:46 },
  { name:'스티커 제거제',                    code:'T_SR',         cost:2000,   previousPrice:3500,   price:4500,   shipping:3000, refMargin:41 },
  { name:'타이거 스프레이폼',                  code:'T_SF_G',       cost:5450,   previousPrice:8800,   price:9300,   shipping:3000, refMargin:25 },
  { name:'타이거 스프레이폼-박스',              code:'T_SF_G_B',     cost:81750,  previousPrice:125000, price:128000, shipping:7800, refMargin:20 },
  { name:'타이거 스피드 폼본드',               code:'T_SFB_G',      cost:5150,   previousPrice:8300,   price:8700,   shipping:3000, refMargin:25 },
  { name:'타이거 스피드 폼본드-박스',            code:'T_SFB_G_B',    cost:77250,  previousPrice:120000, price:120000, shipping:7800, refMargin:20 },
  { name:'타이거2K 경질세트',                 code:'T_2K_H',       cost:278000, previousPrice:340000, price:360000, shipping:0,    refMargin:7 },
  { name:'타이거2K 연질세트',                 code:'T_2K_S',       cost:298000, previousPrice:370000, price:390000, shipping:0,    refMargin:8 },
  { name:'타이거2K-노즐 세트',                code:'T_NZ',         cost:35000,  previousPrice:45000,  price:55000,  shipping:0,    refMargin:28 },
  { name:'타이거2K-팁 세트',                 code:'T_TP',         cost:7000,   previousPrice:20000,  price:20000,  shipping:0,    refMargin:59 },
  { name:'타이거폼건-보급형005C',              code:'T_GUN_005C',   cost:7700,   previousPrice:13000,  price:13000,  shipping:3000, refMargin:28 },
  { name:'타이거폼건-기본형레드',               code:'T_GUN_RED',    cost:13500,  previousPrice:24000,  price:22000,  shipping:3000, refMargin:28 },
  { name:'타이거폼건-고급형블랙',               code:'T_GUN_BLK',    cost:15500,  previousPrice:32000,  price:29000,  shipping:3000, refMargin:36 },
  { name:'타이거폼건-전문가용',                code:'T_GUN_PRO',    cost:19500,  previousPrice:44000,  price:37000,  shipping:3000, refMargin:40 },
  { name:'타이거폼건-프리미엄',                code:'T_GUN_PRM',    cost:30000,  previousPrice:74000,  price:61000,  shipping:3000, refMargin:43 },
  { name:'타이거 스프레이폼+251폼건',            code:'T_SF_251SET',  cost:14850,  previousPrice:25500,  price:25500,  shipping:3000, refMargin:26 },
  { supplier:'함일셀레나', name:'월드 스프레이폼',             code:'W_SF_G',       cost:6350,   previousPrice:9600,   price:10500,  shipping:3000, refMargin:25 },
  { supplier:'함일셀레나', name:'월드 스프레이폼-박스',          code:'W_SF_G_B',     cost:95250,  previousPrice:145000, price:150000, shipping:7800, refMargin:22 },
  { supplier:'함일셀레나', name:'월드스피드 폼본드',             code:'W_SFB_G',      cost:6300,   previousPrice:9800,   price:10500,  shipping:3000, refMargin:25 },
  { supplier:'함일셀레나', name:'월드스피드 폼본드_깜짝할인',       code:'W_SFB_G_S',    cost:6300,   previousPrice:7800,   price:9100,   shipping:3000, refMargin:15 },
  { supplier:'함일셀레나', name:'월드스피드 폼본드-박스',          code:'W_SFB_G_B',    cost:94500,  previousPrice:135000, price:149000, shipping:7800, refMargin:20 },
  { supplier:'함일셀레나', name:'월드폼본드B2',                code:'W_B2_G',       cost:5700,   previousPrice:7500,   price:9500,   shipping:3000, refMargin:25 },
  { supplier:'함일셀레나', name:'월드폼본드B2_깜짝할인',          code:'W_B2_G_S',     cost:5700,   previousPrice:6800,   price:8300,   shipping:3000, refMargin:15 },
  { supplier:'함일셀레나', name:'월드폼본드B2-박스',             code:'W_B2_G_B',     cost:85500,  previousPrice:105000, price:135000, shipping:7800, refMargin:20 },
  { supplier:'함일셀레나', name:'월드 폼크리너',                code:'W_FC',         cost:2500,   previousPrice:3000,   price:4000,   shipping:3000, refMargin:27 },
  { supplier:'함일셀레나', name:'월드 폼크리너_깜짝할인',          code:'W_FC_S',       cost:2500,   previousPrice:2500,   price:3500,   shipping:3000, refMargin:15 },
  { supplier:'함일셀레나', name:'월드251폼건',                code:'W_GUN_251',    cost:9500,   previousPrice:16500,  price:16500,  shipping:3000, refMargin:26 },
  { supplier:'함일셀레나', name:'월드 스프레이폼+251폼건',         code:'W_SF_251SET',  cost:16200,  previousPrice:26100,  price:28000,  shipping:3000, refMargin:26 },
  { supplier:'투원테크',   name:'라이트폼 경질세트',             code:'TW_LF_H',      cost:280000, previousPrice:290000, price:380000, shipping:0,    refMargin:9 },
  { supplier:'투원테크',   name:'라이트폼 연질세트',             code:'TW_LF_S',      cost:320000, previousPrice:340000, price:430000, shipping:0,    refMargin:10 },
  { supplier:'투원테크',   name:'라이트폼-팁노즐(10개)',          code:'TW_TP',        cost:10000,  previousPrice:20000,  price:20000,  shipping:0,    refMargin:59 },
  { supplier:'투원테크',   name:'라이트폼-건세트(노즐세트)',        code:'TW_NZ',        cost:50000,  previousPrice:70000,  price:90000,  shipping:0,    refMargin:27 },
  { supplier:'유니산업',   name:'유니 패스트본드',              code:'U_FB',         cost:4700,   previousPrice:6500,   price:7400,   shipping:3000, refMargin:20 },
  { supplier:'유니산업',   name:'유니 패스트본드_깜짝할인',        code:'U_FB_S',       cost:4700,   previousPrice:6500,   price:6800,   shipping:3000, refMargin:15 },
  { supplier:'유니산업',   name:'유니폼건',                   code:'U_GUN',        cost:6000,   previousPrice:12600,  price:12600,  shipping:3000, refMargin:36 },
  { supplier:'유니산업',   name:'유니 패스트본드+유니 폼건',        code:'U_FB_SET',     cost:10700,  previousPrice:18500,  price:19500,  shipping:3000, refMargin:32 },
  { supplier:'형제산업',   name:'하이테크접착제',               code:'H_HT',         cost:13950,  previousPrice:23000,  price:28000,  shipping:3000, refMargin:33 },
  { supplier:'형제산업',   name:'바인더접착제',                code:'H_025',        cost:1980,   previousPrice:4500,   price:4500,   shipping:3000, refMargin:40 },
  { supplier:'형제산업',   name:'도배용접착제',                code:'H_542',        cost:1250,   previousPrice:3500,   price:3500,   shipping:3000, refMargin:48 },
];

function _hkSubMetrics(product, price = Number(product.price) || 0) {
  const cost = Number(product.cost) || 0;
  const margin = price - cost;
  const fee = Math.round(price * 0.06);
  const vat = Math.round(price * 0.10);
  const netMargin = margin - fee - vat;
  return {
    margin,
    marginRate: price > 0 ? Math.round(margin / price * 100) : 0,
    fee,
    vat,
    netMargin,
    netRate: price > 0 ? Math.round(netMargin / price * 100) : 0,
  };
}

function _hkSubRowHtml(product, rowIndex) {
  const metrics = _hkSubMetrics(product);
  const difference = Number(product.price) - Number(product.previousPrice);
  return `<tr data-row-index="${rowIndex}" data-product-code="${product.code}" data-cost="${product.cost}">
    <td class="hk-sub-supplier">${product.supplier || '승현기업'}</td>
    <td class="hk-sub-name">${product.name}</td>
    <td class="hk-iso-draft-code">${product.code}</td>
    <td class="hk-sub-cost">${_hkIsoDraftNumber(product.cost)}</td>
    <td class="hk-sub-previous">${_hkIsoDraftNumber(product.previousPrice)}<small class="${difference > 0 ? 'up' : difference < 0 ? 'down' : ''}">${difference ? `${difference > 0 ? '+' : ''}${_hkIsoDraftNumber(difference)}` : '동일'}</small></td>
    <td class="hk-iso-draft-price hk-sub-price-cell">
      <div class="hk-iso-price-edit-wrap">
        <input type="text" inputmode="numeric" class="pricing-input-field hk-iso-final-price-input" value="${Number(product.price).toLocaleString()}" data-original-price="${Number(product.price)}" onclick="beginHkIsoRowPriceEdit(this)" oninput="recalcHkSubRow(this);updateHkIsoPriceHistory(this)" onblur="finishHkIsoRowPriceEdit(this)" onkeydown="handleHkSubRowPriceKey(event,this)" readonly>
        <button type="button" class="hk-iso-row-price-edit-btn" onclick="beginHkIsoRowPriceEdit(this)" title="이 판매가만 수정"><i class="fa-solid fa-pen"></i></button>
      </div>
      <div class="hk-iso-price-history" hidden>변경 전 <span>${Number(product.price).toLocaleString()}원</span><button type="button" onclick="revertHkSubRowPrice(this)" title="변경 전 판매가로 되돌리기"><i class="fa-solid fa-rotate-left"></i></button></div>
    </td>
    <td class="hk-sub-shipping">${product.shipping ? _hkIsoDraftNumber(product.shipping) : '—'}</td>
    <td class="hk-sub-margin">${_hkIsoDraftNumber(metrics.margin)}</td>
    <td class="hk-sub-margin-rate">${_hkIsoDraftNumber(metrics.marginRate, '%')}</td>
    <td class="hk-sub-fee">${_hkIsoDraftNumber(metrics.fee)}</td>
    <td class="hk-sub-vat">${_hkIsoDraftNumber(metrics.vat)}</td>
    <td class="hk-sub-net-margin">${_hkIsoDraftNumber(metrics.netMargin)}</td>
    <td class="hk-sub-net-rate">${_hkIsoDraftNumber(metrics.netRate, '%')}</td>
    <td class="hk-sub-ref-margin">${_hkIsoDraftNumber(product.refMargin, '%')}</td>
  </tr>`;
}

function renderHkSubPane() {
  const rows = HK_SUB_PRODUCTS.map(_hkSubRowHtml).join('');
  return `<div id="hkIsoAcc-sub_all" class="card pricing-result-card hk-sub-card">
    <div class="pricing-result-header">
      <div class="pricing-result-title">부자재 기준 판매가<span class="pricing-spec-badge">2026.06.09 · ${HK_SUB_PRODUCTS.length}개</span></div>
      <span class="pricing-result-hint">배송비는 별도 청구 · 순수마진 계산에서 제외</span>
    </div>
    <div class="pricing-table-scroll">
      <table class="pricing-table hk-sub-table">
        <thead><tr>
          <th>업체명</th><th>제품명</th><th>상품코드</th><th>개당 원가</th><th>이전 판매가</th><th>개당 판매가</th><th>배송비</th>
          <th>마진</th><th>마진율</th><th>판매수수료<br><small>6%</small></th><th>부가세<br><small>10%</small></th>
          <th>개당 마진</th><th>순수마진율</th><th>참고마진율</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

window.recalcHkSubRow = function(input) {
  const row = input.closest('tr');
  if (!row) return;
  const rowIndex = Number(row.dataset.rowIndex);
  const product = HK_SUB_PRODUCTS[rowIndex];
  if (!product) return;
  const price = _hkIsoDraftParseNumber(input.value);
  product.price = price;
  const metrics = _hkSubMetrics(product, price);
  row.querySelector('.hk-sub-margin').textContent = _hkIsoDraftNumber(metrics.margin);
  row.querySelector('.hk-sub-margin-rate').textContent = _hkIsoDraftNumber(metrics.marginRate, '%');
  row.querySelector('.hk-sub-fee').textContent = _hkIsoDraftNumber(metrics.fee);
  row.querySelector('.hk-sub-vat').textContent = _hkIsoDraftNumber(metrics.vat);
  row.querySelector('.hk-sub-net-margin').textContent = _hkIsoDraftNumber(metrics.netMargin);
  row.querySelector('.hk-sub-net-rate').textContent = _hkIsoDraftNumber(metrics.netRate, '%');
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

window.handleHkSubRowPriceKey = function(event, input) {
  if (event.key === 'Enter') input.blur();
  if (event.key === 'Escape') {
    input.value = Number(input.dataset.editStartPrice || input.dataset.originalPrice || 0).toLocaleString();
    window.recalcHkSubRow(input);
    window.updateHkIsoPriceHistory(input);
    input.blur();
  }
};

window.revertHkSubRowPrice = function(button) {
  const cell = button.closest('.hk-iso-draft-price');
  const input = cell?.querySelector('.hk-iso-final-price-input');
  if (!input) return;
  input.value = Number(input.dataset.originalPrice || 0).toLocaleString();
  window.recalcHkSubRow(input);
  window.updateHkIsoPriceHistory(input);
  input.readOnly = true;
  cell.classList.remove('editing');
};

window.hkSubProductIndex = function() {
  return HK_SUB_PRODUCTS.map((row, rowIndex) => ({
    code: row.code,
    block: null,
    ship: null,
    row,
    rowIndex,
    accordionId: 'sub_all',
    categoryId: 'hk_sub',
  }));
};

window.hkSubPriceByCode = function(code) {
  const product = HK_SUB_PRODUCTS.find(item => item.code === code);
  return product ? Number(product.price) : null;
};
