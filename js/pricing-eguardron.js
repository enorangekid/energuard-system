/* ═══════════════════════════════════════
   에너가드론 단가표 (2026-11-09) — 에너가드컴퍼니 열반사 제품(빌트론과 다른 브랜드)
   에너가드컴퍼니 단가표 > 불연단열재 옆 '에너가드론' 탭. 사용자가 준 에너가드론단가표.xlsx에서 옮겼다(원가·마진 계산은 안 가져옴 — 사용자 지시).
   - 인상 전 = 엑셀의 롤당(또는 2m당) 판매가, 1M 행은 'M당 판매가'. 1+1 행은 '1+1가격(5% 할인)'.
   - 현재 = 엑셀 '26.05.08 인상가(25%)' 칸 — 앱 가격 DB(app_product_prices 601~606)와 같은 값이라 현재 판매가로 본다.
   - 새 가격 = 현재 ×1.2(빌트론 2026-11 재인상과 같은 방식): 롤(10M 이상)·1+1은 천 원 단위 내림, 1M·2M 판형은 100원 단위 반올림.
   - 상품번호는 스마트스토어 상품번호다(사용자가 스토어 상품 목록 화면으로 확인해 준 번호와 엑셀 맨 위 줄 번호가 같다, 2026-11-09). 상품명 표기도 스토어와 같다.
     그 목록 화면의 가격은 예전 값이라 쓰지 않는다(사용자 지시). 다른 몰 번호·몰별 가격 계산은 아직 없다.
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
    "next": 94000
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
    "shipBasis": "5개마다",
    "before": 3000,
    "current": 3800,
    "next": 4600
   },
   {
    "code": "EG_10_1_DA",
    "length": "1M",
    "ship": 5000,
    "shipBasis": "5개마다",
    "before": 3650,
    "current": 4600,
    "next": 5500
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
    "next": 34000
   },
   {
    "code": "EG_10_10_DA",
    "length": "10M",
    "ship": 12000,
    "shipBasis": "1개마다",
    "before": 29000,
    "current": 37000,
    "next": 44000
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
    "next": 15000
   },
   {
    "code": "EG_20_2_DA",
    "length": "2M",
    "ship": 14500,
    "shipBasis": "5개마다",
    "before": 13000,
    "current": 16300,
    "next": 19600
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
    "ship": 23000,
    "shipBasis": "1개마다",
    "before": 129200,
    "current": 162000,
    "next": 194000
   },
   {
    "code": "EG_5_40_DA_2",
    "length": "40M",
    "ship": 23000,
    "shipBasis": "1개마다",
    "before": 176700,
    "current": 221000,
    "next": 265000
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
    "ship": 23000,
    "shipBasis": "1개마다",
    "before": 138700,
    "current": 174000,
    "next": 208000
   },
   {
    "code": "EG_10_20_DA_2",
    "length": "20M",
    "ship": 23000,
    "shipBasis": "1개마다",
    "before": 163400,
    "current": 205000,
    "next": 246000
   }
  ]
 }
];

(function renderEguardronTab() {
  const num = n => Number(n).toLocaleString('ko-KR');
  const pct = (a, b) => (b > 0 ? (((a / b) - 1) * 100).toFixed(1) + '%' : '—');
  const kind = code => (/_DA(_2)?$/.test(code) ? '한쪽접착' : '비접착');
  // 스마트스토어 상품명과 같은 표기 — 롤은 "폭1m x 길이40m", 1M·2M 낱장은 "가로1m x 세로2m", 1+1은 앞에 "1+1 "
  const spec = (block, item) => {
    const t = (block.name.match(/(\d+T)/) || [])[1] || '';
    const plus = block.name.includes('1+1') ? '1+1 ' : '';
    const len = String(item.length).toLowerCase();
    const size = /^[12]m$/.test(len) ? `가로1m x 세로${len}` : `폭1m x 길이${len}`;
    return `${plus}에너가드론 열반사단열재 ${t} ${size} 고급형 ${kind(item.code)}`;
  };
  const rows = EGR_PRODUCTS.map(block => block.items.map((item, i) => `<tr>
      ${i === 0 ? `<td rowspan="${block.items.length}" class="egr-product">${block.name}<br><small>${block.productNo}</small></td>` : ''}
      <td class="hk-iso-draft-code">${item.code}</td>
      <td>${spec(block, item)}</td>
      <td style="text-align:right">${num(item.ship)}<small style="color:#94a3b8"> / ${item.shipBasis}</small></td>
      <td style="text-align:right;color:#94a3b8">${num(item.before)}</td>
      <td style="text-align:right">${num(item.current)}</td>
      <td style="text-align:right;font-weight:700">${num(item.next)}</td>
      <td style="text-align:right">${pct(item.next, item.current)}</td>
    </tr>`).join('')).join('');
  const html = `<div class="pricing-result-card">
    <div class="pricing-card-header"><h3 style="margin:0">에너가드론 단가표</h3>
      <small style="color:#64748b">에너가드컴퍼니 열반사 · 현재 = 26.05.08 인상가 · 새 가격 = 현재 ×1.2 (롤 천 원 내림, 1M·2M 판형 100원 단위)</small></div>
    <div class="pricing-table-scroll"><table class="pricing-table" id="egrTable">
      <thead><tr><th>스마트스토어 상품번호</th><th>상품코드</th><th>상품명</th><th>배송비</th><th>인상 전</th><th>현재(인상가)</th><th>새 가격</th><th>인상률</th></tr></thead>
      <tbody>${rows}</tbody></table></div></div>`;
  const draw = () => { const pane = document.getElementById('pricing-tab-eguardron'); if (pane) pane.innerHTML = html; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', draw); else draw();
})();
