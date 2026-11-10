/* ═══════════════════════════════════════
   에너가드론 단가표 (2026-11-09) — 에너가드컴퍼니 열반사 제품(빌트론과 다른 브랜드)
   에너가드컴퍼니 단가표 > 불연단열재 옆 '에너가드론' 탭. 사용자가 준 에너가드론단가표.xlsx에서 옮겼다(원가·마진 계산은 안 가져옴 — 사용자 지시).
   - 인상 전 = 엑셀의 롤당(또는 2m당) 판매가, 1M 행은 'M당 판매가'. 1+1 행은 '1+1가격(5% 할인)'.
   - 현재 = 엑셀 '26.05.08 인상가(25%)' 칸 — 앱 가격 DB(app_product_prices 601~606)와 같은 값이라 현재 판매가로 본다.
   - (2026-11-10 사용자 지시로 10T 10m 롤과 20T 2m 판형은 ×1.2보다 더 올렸다 — 10T 20m 롤이 10m 롤 두 개보다 비싼 구성과, 20T 판형 5장이 20T 10m 롤보다 싼 구성을 바로잡으려고 비접착 가격을 올리고 옵션가는 그대로 유지: 10T 10m 34,000/44,000→38,000/48,000, 20T 2m 15,000/19,600→21,000/25,600)
   - (2026-11-10 사용자 지시로 10T 접착 가격을 5T와 같은 길이의 접착 차이에 맞춰 더 올렸다 — 10T 1m 5,500→5,600, 10m 48,000→50,000, 20m 94,000→97,000 (접착 차이 1,000/12,000/22,000). 20T는 접착 차이가 이미 5T보다 커서 그대로, 1+1은 그대로)
   - (2026-11-10 사용자 지시 "5% 정도") 1+1 상품은 낱개 2개 합계(롤마다 배송비 포함)의 5% 할인, 천 원 내림 — 1+1은 무료배송이고 낱개 2개 값에서 조금 싸게 보이는 상품이다. 5T 40m 172,000/243,000, 10T 20m 186,000/228,000
   - 새 가격 = 현재 ×1.2(빌트론 2026-11 재인상과 같은 방식): 롤(10M 이상)·1+1은 천 원 단위 내림, 1M·2M 판형은 100원 단위 반올림.
   - 배송비는 스마트스토어 기본배송비를 사용자가 확인해 준 값(2026-11-10)이다 — 1+1 상품 2개는 0원(무료배송, 배송비가 1+1 가격에 포함), 부과 조건은 사용자 확인(2026-11-10): 10T 1m 3개마다, 5T 1m 5개마다, 20T 2m 14,500원 5개마다, 나머지 롤 1개마다.
   - 상품번호는 스마트스토어 상품번호다(사용자가 스토어 상품 목록 화면으로 확인해 준 번호와 엑셀 맨 위 줄 번호가 같다, 2026-11-09). 상품명 표기도 스토어와 같다.
     그 목록 화면의 가격은 예전 값이라 쓰지 않는다(사용자 지시). 다른 몰 번호·몰별 가격 계산은 아직 없다.
   화면은 한국단열 열반사단열재 단가표(js/pricing-hankook-reflective.js)와 같은 카드·아코디언·표 클래스를 쓴다. 상품번호 칸의 [상품코드 복사] 버튼(한국단열 표와 같은 hkCopyProductCode)으로 네이버 상품번호를 복사한다.
   대표가(= 비접착 옵션 가격, 옵션가 0)와 옵션가(= 옵션 가격 − 대표가)도 이전·새 값을 같이 보여 준다.
   읽기 전용 표다 — 값을 바꾸려면 아래 EGR_PRODUCTS를 고친다.
═══════════════════════════════════════ */
const EGR_PRODUCTS = [
 {
  "name": "에너가드론 5T",
  "productNo": "10678271766",
  "items": [
   {
    "code": "EG_5_40_DN",
    "length": "40M",
    "ship": 23000,
    "shipBasis": "1개마다",
    "before": 45000,
    "current": 57000,
    "next": 68000
   },
   {
    "code": "EG_5_40_DA",
    "length": "40M",
    "ship": 23000,
    "shipBasis": "1개마다",
    "before": 70000,
    "current": 88000,
    "next": 105000
   }
  ]
 },
 {
  "name": "에너가드론 5T",
  "productNo": "10502202355",
  "items": [
   {
    "code": "EG_5_1_DN",
    "length": "1M",
    "ship": 5000,
    "shipBasis": "5개마다",
    "before": 1625,
    "current": 2100,
    "next": 2500
   },
   {
    "code": "EG_5_1_DA",
    "length": "1M",
    "ship": 5000,
    "shipBasis": "5개마다",
    "before": 2250,
    "current": 2900,
    "next": 3500
   }
  ]
 },
 {
  "name": "에너가드론 5T",
  "productNo": "10678221284",
  "items": [
   {
    "code": "EG_5_10_DN",
    "length": "10M",
    "ship": 6500,
    "shipBasis": "1개마다",
    "before": 14500,
    "current": 18200,
    "next": 21000
   },
   {
    "code": "EG_5_10_DA",
    "length": "10M",
    "ship": 6500,
    "shipBasis": "1개마다",
    "before": 22000,
    "current": 27500,
    "next": 33000
   }
  ]
 },
 {
  "name": "에너가드론 5T",
  "productNo": "10678252728",
  "items": [
   {
    "code": "EG_5_20_DN",
    "length": "20M",
    "ship": 10500,
    "shipBasis": "1개마다",
    "before": 28000,
    "current": 35000,
    "next": 42000
   },
   {
    "code": "EG_5_20_DA",
    "length": "20M",
    "ship": 10500,
    "shipBasis": "1개마다",
    "before": 43000,
    "current": 53800,
    "next": 64000
   }
  ]
 },
 {
  "name": "에너가드론 10T",
  "productNo": "10678260024",
  "items": [
   {
    "code": "EG_10_20_DN",
    "length": "20M",
    "ship": 23000,
    "shipBasis": "1개마다",
    "before": 50000,
    "current": 63000,
    "next": 75000
   },
   {
    "code": "EG_10_20_DA",
    "length": "20M",
    "ship": 23000,
    "shipBasis": "1개마다",
    "before": 63000,
    "current": 79000,
    "next": 97000
   }
  ]
 },
 {
  "name": "에너가드론 10T",
  "productNo": "10678178341",
  "items": [
   {
    "code": "EG_10_1_DN",
    "length": "1M",
    "ship": 5000,
    "shipBasis": "3개마다",
    "before": 3000,
    "current": 3800,
    "next": 4600
   },
   {
    "code": "EG_10_1_DA",
    "length": "1M",
    "ship": 5000,
    "shipBasis": "3개마다",
    "before": 3650,
    "current": 4600,
    "next": 5600
   }
  ]
 },
 {
  "name": "에너가드론 10T",
  "productNo": "10678232703",
  "items": [
   {
    "code": "EG_10_10_DN",
    "length": "10M",
    "ship": 12000,
    "shipBasis": "1개마다",
    "before": 23000,
    "current": 29000,
    "next": 38000
   },
   {
    "code": "EG_10_10_DA",
    "length": "10M",
    "ship": 12000,
    "shipBasis": "1개마다",
    "before": 29000,
    "current": 37000,
    "next": 50000
   }
  ]
 },
 {
  "name": "에너가드론 20T",
  "productNo": "10678191916",
  "items": [
   {
    "code": "EG_20_2_DN",
    "length": "2M",
    "ship": 14500,
    "shipBasis": "5개마다",
    "before": 10000,
    "current": 12500,
    "next": 21000
   },
   {
    "code": "EG_20_2_DA",
    "length": "2M",
    "ship": 14500,
    "shipBasis": "5개마다",
    "before": 13000,
    "current": 16300,
    "next": 25600
   }
  ]
 },
 {
  "name": "에너가드론 20T",
  "productNo": "10678239013",
  "items": [
   {
    "code": "EG_20_10_DN",
    "length": "10M",
    "ship": 22000,
    "shipBasis": "1개마다",
    "before": 62000,
    "current": 78000,
    "next": 93000
   },
   {
    "code": "EG_20_10_DA",
    "length": "10M",
    "ship": 22000,
    "shipBasis": "1개마다",
    "before": 74000,
    "current": 93000,
    "next": 111000
   }
  ]
 },
 {
  "name": "에너가드론 5T 1+1",
  "productNo": "11704402003",
  "items": [
   {
    "code": "EG_5_40_DN_2",
    "length": "40M",
    "ship": 0,
    "shipBasis": "무료",
    "before": 129200,
    "current": 162000,
    "next": 172000
   },
   {
    "code": "EG_5_40_DA_2",
    "length": "40M",
    "ship": 0,
    "shipBasis": "무료",
    "before": 176700,
    "current": 221000,
    "next": 243000
   }
  ]
 },
 {
  "name": "에너가드론 10T 1+1",
  "productNo": "11704416220",
  "items": [
   {
    "code": "EG_10_20_DN_2",
    "length": "20M",
    "ship": 0,
    "shipBasis": "무료",
    "before": 138700,
    "current": 174000,
    "next": 186000
   },
   {
    "code": "EG_10_20_DA_2",
    "length": "20M",
    "ship": 0,
    "shipBasis": "무료",
    "before": 163400,
    "current": 205000,
    "next": 228000
   }
  ]
 }
];

(function renderEguardronTab() {
  const num = n => Number(n).toLocaleString('ko-KR');
  const kind = code => (/_DA(_2)?$/.test(code) ? '한쪽접착' : '비접착');
  const thick = block => (block.name.match(/(\d+T)/) || [])[1] || '';
  const isSheet = item => /^[12]m$/.test(String(item.length).toLowerCase());
  // 스마트스토어 상품명과 같은 표기 — 롤은 "폭1m x 길이40m", 1M·2M 낱장은 "가로1m x 세로2m", 1+1은 앞에 "1+1 "
  const sizeLabel = item => { const len = String(item.length).toLowerCase(); return isSheet(item) ? `가로1m x 세로${len}` : `폭1m x 길이${len}`; };
  const productTitle = (block, item) => `${block.name.includes('1+1') ? '1+1 ' : ''}에너가드론 ${thick(block)} ${sizeLabel(item)}`;
  const specText = (block, item) => `${thick(block)} X ${String(item.length).toUpperCase()}${isSheet(item) ? '' : '(롤)'}`;

  // 스마트스토어 옵션 구조 — 대표가 = 첫 옵션(비접착) 가격(옵션가 0), 옵션가 = 그 옵션 가격 − 대표가.
  const baseOf = block => block.items[0];
  const optionPrice = (item, block, field) => item[field] - baseOf(block)[field];

  const readonlyPrice = value => `<div class="hk-iso-price-edit-wrap"><input type="text" class="pricing-input-field hk-iso-final-price-input" value="${num(value)}" readonly aria-label="가격"></div>`;
  const signed = n => (n > 0 ? '+' : '') + num(n);

  // 행 — 한국단열 열반사단열재 표(_hkReflectiveRowHtml)와 같은 칸 클래스. 이전 판매가 = 현재(26.05.08 인상가, 앱 가격 DB와 같은 값), 실판매가 = 새 가격.
  const rowHtml = (block, item, index) => {
    const base = baseOf(block);
    const diff = item.next - item.current;
    const prevOpt = optionPrice(item, block, 'current');
    const nextOpt = optionPrice(item, block, 'next');
    const productCells = index === 0 ? `
      <td rowspan="${block.items.length}" class="hk-sub-name egr-product-cell">
        <div class="egr-product-no">${block.productNo}</div>
        <div class="pgl-btns pgl-btns-fit"><button type="button" class="pgl-btn pgl-btn-wide" onclick="hkCopyProductCode(this,'${block.productNo}')" title="이 상품의 상품코드(${block.productNo})를 복사합니다">상품코드 복사</button></div>
      </td>
      <td rowspan="${block.items.length}" class="hk-iso-draft-price hk-sub-price-cell egr-base-cell">
        ${readonlyPrice(base.next)}<small class="egr-base-prev">이전 ${num(base.current)}</small>
      </td>` : '';
    return `<tr class="hk-reflective-roll-row" data-product-code="${item.code}">${productCells}
      <td class="hk-sub-name">고급형 ${kind(item.code)}</td>
      <td class="hk-reflective-spec" title="${specText(block, item)}">${specText(block, item)}</td>
      <td class="hk-iso-draft-code">${item.code}</td>
      <td class="hk-sub-previous">${num(item.ship)}<small>${item.shipBasis}</small></td>
      <td class="hk-sub-old-price" title="인상 전 판매가 — 참고용">${num(item.before)}</td>
      <td class="hk-sub-previous">${num(item.current)}<small class="${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}">${diff ? signed(diff) : '동일'}</small></td>
      <td class="hk-iso-draft-price hk-sub-price-cell">${readonlyPrice(item.next)}</td>
      <td class="hk-sub-previous">${num(prevOpt)}</td>
      <td class="hk-iso-draft-price hk-sub-price-cell">${readonlyPrice(nextOpt)}<small class="${nextOpt - prevOpt > 0 ? 'up' : ''}">${nextOpt - prevOpt ? signed(nextOpt - prevOpt) : '동일'}</small></td>
    </tr>`;
  };
  const tableHtml = block => `<div class="pricing-table-scroll">
    <table class="pricing-table hk-sub-table hk-reflective-table">
      <colgroup><col style="width:150px"><col style="width:112px"><col class="hk-reflective-col-name"><col class="hk-reflective-col-spec"><col class="hk-reflective-col-code"><col class="hk-sub-col-shipping"><col class="hk-sub-col-previous"><col class="hk-sub-col-previous"><col class="hk-sub-col-price"><col class="hk-sub-col-previous"><col class="hk-sub-col-price"></colgroup>
      <thead><tr>
        <th class="hk-sub-head-code">상품번호</th><th class="hk-sub-head-sale-price">대표가<br><small>옵션가 0 기준</small></th>
        <th class="hk-sub-head-base">품명</th><th class="hk-sub-head-base">규격</th><th class="hk-sub-head-code">상품코드</th><th class="hk-sub-head-base">배송비</th>
        <th class="hk-sub-head-base">예전가</th><th class="hk-sub-head-base">이전 판매가<br><small>26.05.08 인상가</small></th><th class="hk-sub-head-sale-price">실판매가</th>
        <th class="hk-sub-head-base">이전 옵션가</th><th class="hk-sub-head-sale-price">옵션가</th>
      </tr></thead>
      <tbody>${block.items.map((item, index) => rowHtml(block, item, index)).join('')}</tbody>
    </table>
  </div>`;
  const accordionHtml = (block, index) => {
    const id = `egr_${index}`;
    return `<div class="hk-iso-accordion open" id="hkIsoAcc-${id}">
      <div class="hk-iso-accordion-head">
        <span class="hk-iso-accordion-title">${productTitle(block, block.items[0])}<span class="hk-iso-accordion-sub">${block.productNo}</span></span>
        <span class="hk-iso-accordion-count">옵션 ${block.items.length}개</span>
        <button type="button" class="hk-iso-accordion-toggle" onclick="toggleHkIsoAccordion('${id}')" title="펼치기 / 접기" aria-label="펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"></i></button>
      </div>
      <div class="hk-iso-accordion-body">${tableHtml(block)}</div>
    </div>`;
  };
  const optionCount = EGR_PRODUCTS.reduce((sum, block) => sum + block.items.length, 0);

  // 스토어 가격검사(관리자 화면의 한국단열 몰별 검사와 같은 창, channelId 'egc') — 에너가드컴퍼니 스토어(smartstore.naver.com/energuardcompany)의
  // 에너가드론 상품을 하나씩 열어 옵션 관리코드(EG_…)로 짝지어 "새 판매가"(실판매가)와 같은지 본다. 스토어 쪽은 즉시할인가(대표가+옵션가)로 비교한다.
  // 검사 대상은 pricing-check-test.js의 gatherHkdItems('egc')가 이 함수를 불러 가져간다.
  window.hkEguardronCheckItems = () => EGR_PRODUCTS.map(block => ({
    productId: block.productNo,
    productUrl: `https://smartstore.naver.com/energuardcompany/products/${block.productNo}`,
    options: block.items.map(item => ({ code: item.code, name: `고급형 ${kind(item.code)}`, expected: item.next, status: null }))
  }));
  window.hkEguardronOpenCheck = () => {
    if (typeof window.openHkStorePriceCheck !== 'function') { if (typeof showToast === 'function') showToast('스토어 가격검사는 관리자 화면에서만 쓸 수 있습니다.', 'error'); return; }
    if (window.currentUser?.role !== 'admin') { if (typeof showToast === 'function') showToast('스토어 가격검사는 관리자만 쓸 수 있습니다.', 'error'); return; }
    window.openHkStorePriceCheck('egc');
  };
  const checkButton = typeof window.openHkStorePriceCheck === 'function'
    ? '<button type="button" class="pim-btn-confirm" onclick="hkEguardronOpenCheck()" title="에너가드컴퍼니 스토어의 에너가드론 상품을 하나씩 열어 새 판매가와 같은지 확인합니다(읽기 전용)"><i class="fa-solid fa-magnifying-glass-dollar"></i> 스토어 가격검사</button>' : '';
  const html = `<div class="card pricing-result-card hk-sub-card">
    <div class="pricing-result-header">
      <div class="pricing-result-title">에너가드론 열반사단열재 기준 판매가<span class="pricing-spec-badge">${EGR_PRODUCTS.length}개 상품 · ${optionCount}개 옵션</span></div>
      ${checkButton}<span class="pricing-result-hint">실판매가 = 이전 판매가 ×1.2 (롤·1+1 천 원 내림, 1M·2M 100원 단위) · 대표가 = 비접착 가격, 옵션가 = 옵션 가격 − 대표가</span>
    </div>
    <div class="hk-iso-accordion-list">${EGR_PRODUCTS.map(accordionHtml).join('')}</div>
  </div>`;

  // .hk-sub-table 은 마진 열까지 있는 한국단열 표라 min-width 1730px — 이 표는 열 수에 맞게 줄이고, 상품번호·대표가 칸은 가운데 정렬로 맞춘다.
  const style = document.createElement('style');
  style.textContent = '#pricing-tab-eguardron .hk-sub-table { min-width: 1180px; } #pricing-tab-eguardron .egr-product-cell { vertical-align: middle; text-align: center; } #pricing-tab-eguardron .egr-product-no { font-weight: 700; margin-bottom: 6px; } #pricing-tab-eguardron .egr-base-cell { vertical-align: middle; } #pricing-tab-eguardron .egr-base-prev { display: block; color: #94a3b8; font-size: 11px; margin-top: 4px; }';
  document.head.appendChild(style);
  const draw = () => { const pane = document.getElementById('pricing-tab-eguardron'); if (pane) pane.innerHTML = html; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', draw); else draw();
})();
