/* ═══════════════════════════════════════
   한국단열 스티로폼(비드법) — 1단계 기준단가 (2026-09-21)

   아이소핑크 표 엔진(pricing-hankook.js의 _hkIsoDraftSalesTable·recalcHkIsoDraftRow 등)을
   그대로 쓰고, 이 파일은 스티로폼의 데이터·원가 카드·상위 탭만 맡는다. 아이소핑크와 다른 점:
   - 원가는 두께 구간·두께별 추가마진이 없다. 등급 × 원장 규격별 적용 원가(원/mm, HK_BEAD_UNIT_COSTS)
     하나가 모든 두께에 그대로 적용된다(원가 = 적용 원가 × 두께, 접착식은 + 접착 가공비).
     적용 원가 = 기본 원가(원/㎡·mm, 1종 3호 58 / 2종 2호 77 — 사용자 제공 2026-09-21) × 원장 면적(㎡)을
     반올림한 값 + 원장 규격별 추가마진(HK_BEAD_UNIT_MARGINS). 추가마진 기본값은 기존 적용 원가
     115/195/150/245가 그대로 나오게 잡았다(21/28/25/23).
   - 접착식은 1종 3호 900*1800 원가 + 접착 가공비(아이소핑크와 같은 값을 공유).
   - 표의 "배송비" 칸은 원본 엑셀과 같이 참고용이다 — 장당마진·예상판매가에서 빼지 않는다.
   - 2단계 배송 정책이 아직 없어서 배송 정책·가격 조정·현재 판매가 열은 숨긴다(자료 받는 대로 연결).
   - 상품코드는 St_(1종 3호) / StA_(접착식) / Neo_(2종 2호) + 판매크기 + 두께 + 수량(사용자 확인 2026-09-21).

   구조는 여기(JS), 값은 DB — 저장하는 값은 판매가(상품코드별)와 원가(hk_settings.bead_costs)뿐이다.
   판매원가·마진·수수료·장당마진은 화면에서 다시 계산한다(hkBeadRefreshDerived).
═══════════════════════════════════════ */

// 기본 원가(원/㎡·mm) — 등급별 원자재 단가. 1종 3호(17K) 58원, 2종 2호(25K) 77원.
const HK_BEAD_BASE_COSTS = { b1: 58, b2: 77 };
// 원장 규격별 추가마진(원/mm) — 기본 원가 × 면적(반올림)에 더해 적용 원가가 된다.
const HK_BEAD_UNIT_MARGINS = { b1_900: 21, b1_1200: 28, b2_900: 25, b2_1200: 23 };
// 적용 원가(원/mm) — 등급 × 원장 규격. 위 두 값으로 _hkBeadRecomputeUnits()가 채운다.
const HK_BEAD_UNIT_COSTS = { b1_900: 0, b1_1200: 0, b2_900: 0, b2_1200: 0 };
const HK_BEAD_GRADES = [
  { key: 'b1', label: '1종 3호 (17K)' },
  { key: 'b2', label: '2종 2호 (25K)' },
];
const HK_BEAD_UNIT_INFO = [
  { key: 'b1_900',  gradeKey: 'b1', grade: '1종 3호 (17K)', sheet: '900*1800',  area: 1.62 },
  { key: 'b1_1200', gradeKey: 'b1', grade: '1종 3호 (17K)', sheet: '1200*2400', area: 2.88 },
  { key: 'b2_900',  gradeKey: 'b2', grade: '2종 2호 (25K)', sheet: '900*1800',  area: 1.62 },
  { key: 'b2_1200', gradeKey: 'b2', grade: '2종 2호 (25K)', sheet: '1200*2400', area: 2.88 },
];

// 원장 원가 = 기본 원가 × 원장 면적(㎡)을 원 단위로 반올림(예: 58 × 1.62 = 93.96 → 94).
function _hkBeadSheetCost(info) {
  return Math.round((Number(HK_BEAD_BASE_COSTS[info.gradeKey]) || 0) * info.area);
}
function _hkBeadRecomputeUnits() {
  HK_BEAD_UNIT_INFO.forEach(info => {
    HK_BEAD_UNIT_COSTS[info.key] = _hkBeadSheetCost(info) + (Number(HK_BEAD_UNIT_MARGINS[info.key]) || 0);
  });
}
_hkBeadRecomputeUnits();

const HK_BEAD_SUPER_TABS = [
  { id: 'bead1', label: '1종 3호', sub: '17K · 600x900 · 900x1800 · 1200x2400' },
  { id: 'beadA', label: '접착식 1종 3호', sub: '600x900 · 900x1800' },
  { id: 'bead2', label: '2종 2호', sub: '25K · 600x900 · 900x1800 · 1200x2400' },
];

/* 그룹(아코디언)별 기준 행. 행 = 판매크기(-수량)·두께·판매가·참고마진.
   t 두께 / s 판매사이즈-수량 / p 판매가 / r 참고마진 / sp 원본 원장 판매가 / f 원장 판매가가 원가와 같은 표 /
   sh 원본 엑셀의 배송비(참고용). 같은 두께는 붙어 있어야 한다(첫 행만 이름·원가를 보여준다). */
const HK_BEAD_ACCORDIONS = [
  {
    id: 'bead1_600x900', superId: 'bead1', label: '600x900 일반', sub: '430×430 · 600×900',
    saleGroupLabel: '600*900', unitKey: 'b1_900', codePrefix: 'St', gradeLabel: '1종 3호', adhesive: false,
    sheet: '900*1800',
    rows: [
      { t:10, s:'430*430-4', p:1300, r:45, sp:1050 },
      { t:10, s:'600*900-5', p:3500, r:40 },
      { t:20, s:'430*430-3', p:2200, r:45, sp:4950 },
      { t:20, s:'600*900-2', p:3300, r:40 },
      { t:30, s:'430*430-3', p:3400, r:45, sp:6900 },
      { t:30, s:'600*900-1', p:2300, r:40 },
      { t:40, s:'430*430-2', p:3200, r:45, sp:10200 },
      { t:40, s:'600*900-1', p:3400, r:40 },
      { t:50, s:'430*430-2', p:4000, r:45, sp:13200 },
      { t:50, s:'600*900-1', p:4400, r:40 },
      { t:100, s:'430*430-1', p:4000, r:45, sp:24600 },
      { t:100, s:'600*900-1', p:8200, r:40 },
    ],
  },
  {
    id: 'bead1_600x900_bundle', superId: 'bead1', label: '600x900 묶음', sub: '430×430 · 600×900 묶음',
    saleGroupLabel: '600*900', unitKey: 'b1_900', codePrefix: 'St', gradeLabel: '1종 3호', adhesive: false,
    sheet: '900*1800',
    rows: [
      { t:10, s:'600*900-10', p:7000, r:40, sp:10500 },
      { t:20, s:'600*900-5', p:8400, r:40, sp:25200 },
      { t:30, s:'600*900-3', p:7000, r:40, sp:21000 },
      { t:40, s:'600*900-2', p:6800, r:40, sp:20400 },
      { t:50, s:'430*430-3', p:4500, r:45, sp:26400 },
      { t:50, s:'600*900-2', p:8800, r:40, sp:26400 },
      { t:100, s:'430*430-3', p:12000, r:45, sp:24600 },
    ],
  },
  {
    id: 'bead1_600x900_high_t', superId: 'bead1', label: '600x900 후판', sub: '100~600T',
    saleGroupLabel: '600*900', unitKey: 'b1_900', codePrefix: 'St', gradeLabel: '1종 3호', adhesive: false,
    sheet: '900*1800',
    rows: [
      { t:100, s:'600*900-2', p:13000, r:25, sp:19500 },
      { t:200, s:'600*900-1', p:13000, r:25, sp:39000 },
      { t:300, s:'600*900-1', p:20500, r:30, sp:61500 },
      { t:400, s:'600*900-1', p:27500, r:30, sp:82500 },
      { t:500, s:'600*900-1', p:34500, r:30, sp:103500 },
      { t:600, s:'600*900-1', p:40500, r:30, sp:121500 },
    ],
  },
  {
    id: 'bead1_900x1800', superId: 'bead1', label: '900x1800 일반', sub: '10~100T · 묶음',
    saleGroupLabel: '900*1800', unitKey: 'b1_900', codePrefix: 'St', gradeLabel: '1종 3호', adhesive: false,
    sheet: '900*1800',
    rows: [
      { t:10, s:'900*1800-10', p:25500, r:39, sp:1150, f:1, sh:14000 },
      { t:20, s:'900*1800-7', p:32400, r:35, sp:2300, f:1, sh:15700 },
      { t:30, s:'900*1800-5', p:32600, r:35, sp:3450, f:1, sh:16900 },
      { t:40, s:'900*1800-3', p:24700, r:35, sp:4600, f:1, sh:14000 },
      { t:40, s:'900*1800-5', p:42500, r:35, sp:4600, f:1, sh:14000 },
      { t:50, s:'900*1800-3', p:33500, r:35, sp:5750, f:1, sh:16900 },
      { t:100, s:'900*1800-1', p:22500, r:35, sp:11500, f:1, sh:12200 },
    ],
  },
  {
    id: 'bead1_900x1800_high_t', superId: 'bead1', label: '900x1800 후판', sub: '100~600T',
    saleGroupLabel: '900*1800', unitKey: 'b1_900', codePrefix: 'St', gradeLabel: '1종 3호', adhesive: false,
    sheet: '900*1800',
    rows: [
      { t:100, s:'900*1800-2', p:54500, r:40, sp:11500, f:1 },
      { t:200, s:'900*1800-1', p:54500, r:40, sp:23000, f:1 },
      { t:300, s:'900*1800-1', p:74500, r:40, sp:34500, f:1 },
      { t:400, s:'900*1800-1', p:89600, r:30, sp:46000, f:1 },
      { t:500, s:'900*1800-1', p:104700, r:30, sp:57500, f:1 },
      { t:600, s:'900*1800-1', p:135400, r:30, sp:69000, f:1 },
    ],
  },
  {
    id: 'bead1_900x1200', superId: 'bead1', label: '900x1200', sub: '100~600T',
    saleGroupLabel: '900*1200', unitKey: 'b1_900', codePrefix: 'St', gradeLabel: '1종 3호', adhesive: false,
    sheet: '900*1800',
    rows: [
      { t:100, s:'1200*900-2', p:39000, r:45, sp:11500, f:1, sh:14500 },
      { t:200, s:'1200*900-1', p:39000, r:45, sp:23000, f:1, sh:14500 },
      { t:300, s:'1200*900-1', p:59000, r:45, sp:34500, f:1, sh:21000 },
      { t:400, s:'1200*900-1', p:79000, r:45, sp:46000, f:1, sh:28000 },
      { t:500, s:'1200*900-1', p:99000, r:45, sp:57500, f:1, sh:34400 },
      { t:600, s:'1200*900-1', p:119000, r:45, sp:69000, f:1, sh:40800 },
    ],
  },
  {
    id: 'bead1_1200x2400', superId: 'bead1', label: '1200x2400', sub: '100~900T',
    saleGroupLabel: '1200*2400', unitKey: 'b1_1200', codePrefix: 'St', gradeLabel: '1종 3호', adhesive: false,
    sheet: '1200*2400',
    rows: [
      { t:100, s:'1200*2400-2', p:90000, r:40, sp:19500, f:1 },
      { t:200, s:'1200*2400-1', p:90000, r:40, sp:39000, f:1 },
      { t:300, s:'1200*2400-1', p:130000, r:40, sp:58500, f:1 },
      { t:400, s:'1200*2400-1', p:170000, r:40, sp:78000, f:1 },
      { t:500, s:'1200*2400-1', p:210000, r:40, sp:97500, f:1 },
      { t:600, s:'1200*2400-1', p:250000, r:40, sp:117000, f:1 },
      { t:700, s:'1200*2400-1', p:290000, r:40, sp:136500, f:1 },
      { t:800, s:'1200*2400-1', p:330000, r:40, sp:156000, f:1 },
      { t:900, s:'1200*2400-1', p:370000, r:40, sp:175500, f:1 },
    ],
  },
  {
    id: 'beadA_600x900', superId: 'beadA', label: '600x900', sub: '20 · 30 · 50T',
    saleGroupLabel: '600*900', unitKey: 'b1_900', codePrefix: 'StA', gradeLabel: '접착식 3호', adhesive: true,
    sheet: '900*1800',
    rows: [
      { t:20, s:'600*900-2', p:4500, r:30, sp:13500 },
      { t:20, s:'600*900-5', p:11500, r:30, sp:34500 },
      { t:30, s:'600*900-1', p:5500, r:55, sp:16500 },
      { t:30, s:'600*900-3', p:18000, r:55, sp:54000 },
      { t:50, s:'600*900-1', p:8000, r:55, sp:24000 },
      { t:50, s:'600*900-2', p:15000, r:55, sp:45000 },
    ],
  },
  {
    id: 'beadA_900x1800', superId: 'beadA', label: '900x1800', sub: '20 · 30 · 50T',
    saleGroupLabel: '900*1800', unitKey: 'b1_900', codePrefix: 'StA', gradeLabel: '접착식 3호', adhesive: true,
    sheet: '900*1800',
    rows: [
      { t:20, s:'900*1800-7', p:68000, r:40, sp:4350, f:1, sh:21500 },
      { t:30, s:'900*1800-5', p:60000, r:35, sp:5850, f:1, sh:16900 },
      { t:50, s:'900*1800-3', p:54000, r:35, sp:8850, f:1, sh:16900 },
    ],
  },
  {
    id: 'bead2_600x900', superId: 'bead2', label: '600x900 일반', sub: '20~100T',
    saleGroupLabel: '600*900', unitKey: 'b2_900', codePrefix: 'Neo', gradeLabel: '2종 2호', adhesive: false,
    sheet: '900*1800',
    rows: [
      { t:20, s:'430*430-3', p:4500, r:60, sp:9500 },
      { t:20, s:'600*900-3', p:9500, r:55 },
      { t:30, s:'430*430-3', p:7600, r:60, sp:14250 },
      { t:30, s:'600*900-2', p:9500, r:55 },
      { t:30, s:'600*900-3', p:13500, r:55 },
      { t:50, s:'430*430-3', p:11500, r:60, sp:55500 },
      { t:50, s:'600*900-1', p:8200, r:55 },
      { t:50, s:'600*900-2', p:18500, r:55 },
      { t:100, s:'430*430-2', p:15500, r:60, sp:46500 },
      { t:100, s:'600*900-1', p:16400, r:55 },
    ],
  },
  {
    id: 'bead2_600x900_high_t', superId: 'bead2', label: '600x900 후판', sub: '100~600T',
    saleGroupLabel: '600*900', unitKey: 'b2_900', codePrefix: 'Neo', gradeLabel: '2종 2호', adhesive: false,
    sheet: '900*1800',
    rows: [
      { t:100, s:'600*900-2', p:24500, r:45, sp:36750 },
      { t:200, s:'600*900-1', p:24500, r:45, sp:73500 },
      { t:300, s:'600*900-1', p:34000, r:45, sp:102000 },
      { t:400, s:'600*900-1', p:51000, r:45, sp:153000 },
      { t:500, s:'600*900-1', p:63000, r:45, sp:189000 },
      { t:600, s:'600*900-1', p:69000, r:45, sp:207000 },
    ],
  },
  {
    id: 'bead2_900x1800', superId: 'bead2', label: '900x1800 일반', sub: '30~100T · 묶음',
    saleGroupLabel: '900*1800', unitKey: 'b2_900', codePrefix: 'Neo', gradeLabel: '2종 2호', adhesive: false,
    sheet: '900*1800',
    rows: [
      { t:30, s:'900*1800-5', p:60400, r:45, sp:4500, f:1, sh:16900 },
      { t:50, s:'900*1800-3', p:57000, r:45, sp:7500, f:1, sh:16900 },
      { t:100, s:'900*1800-1', p:34700, r:40, sp:15000, f:1, sh:12200 },
    ],
  },
  {
    id: 'bead2_900x1800_high_t', superId: 'bead2', label: '900x1800 후판', sub: '100~600T',
    saleGroupLabel: '900*1800', unitKey: 'b2_900', codePrefix: 'Neo', gradeLabel: '2종 2호', adhesive: false,
    sheet: '900*1800',
    rows: [
      { t:100, s:'900*1800-2', p:74900, r:40, sp:15000, f:1, sh:21500 },
      { t:200, s:'900*1800-1', p:74900, r:40, sp:30000, f:1, sh:21500 },
      { t:300, s:'900*1800-1', p:109500, r:40, sp:45000, f:1, sh:31500 },
      { t:400, s:'900*1800-1', p:139600, r:40, sp:60000, f:1, sh:41400 },
      { t:500, s:'900*1800-1', p:174700, r:40, sp:75000, f:1, sh:51300 },
      { t:600, s:'900*1800-1', p:210400, r:40, sp:90000, f:1, sh:60600 },
    ],
  },
  {
    id: 'bead2_900x1200', superId: 'bead2', label: '900x1200', sub: '100~600T',
    saleGroupLabel: '900*1200', unitKey: 'b2_900', codePrefix: 'Neo', gradeLabel: '2종 2호', adhesive: false,
    sheet: '900*1800',
    rows: [
      { t:100, s:'1200*900-2', p:59000, r:50, sp:15000, f:1, sh:14500 },
      { t:200, s:'1200*900-1', p:59000, r:50, sp:30000, f:1, sh:14500 },
      { t:300, s:'1200*900-1', p:89000, r:50, sp:45000, f:1, sh:21000 },
      { t:400, s:'1200*900-1', p:109000, r:50, sp:60000, f:1, sh:28000 },
      { t:500, s:'1200*900-1', p:139000, r:50, sp:75000, f:1, sh:34400 },
      { t:600, s:'1200*900-1', p:169000, r:50, sp:90000, f:1, sh:40800 },
    ],
  },
  {
    id: 'bead2_1200x2400', superId: 'bead2', label: '1200x2400', sub: '100~900T',
    saleGroupLabel: '1200*2400', unitKey: 'b2_1200', codePrefix: 'Neo', gradeLabel: '2종 2호', adhesive: false,
    sheet: '1200*2400',
    rows: [
      { t:100, s:'1200*2400-2', p:110000, r:40, sp:24500, f:1 },
      { t:200, s:'1200*2400-1', p:110000, r:40, sp:49000, f:1 },
      { t:300, s:'1200*2400-1', p:160000, r:40, sp:73500, f:1 },
      { t:400, s:'1200*2400-1', p:210000, r:40, sp:98000, f:1 },
      { t:500, s:'1200*2400-1', p:260000, r:40, sp:122500, f:1 },
      { t:600, s:'1200*2400-1', p:310000, r:40, sp:147000, f:1 },
      { t:700, s:'1200*2400-1', p:360000, r:40, sp:171500, f:1 },
      { t:800, s:'1200*2400-1', p:410000, r:40, sp:196000, f:1 },
      { t:900, s:'1200*2400-1', p:460000, r:40, sp:220500, f:1 },
    ],
  },
];

/* 엔진이 읽는 행 모양(HK_ISO_CONNECTED_DRAFTS[id].rows)으로 만든다 — 계산 값은 hkBeadRefreshDerived가 채운다. */
HK_BEAD_ACCORDIONS.forEach(acc => {
  let prevThickness = null;
  acc.draftRows = acc.rows.map(seed => {
    const first = seed.t !== prevThickness;
    prevThickness = seed.t;
    return {
      name: first ? `${acc.gradeLabel} ${seed.t}T` : '',
      unit: '', spec: first ? `${seed.t}*${acc.sheet}` : '',
      sheetCost: '', sheetPrice: '', saleSize: seed.s,
      price: seed.p, margin: 0, fee: 0, vat: 0,
      shipping: seed.sh != null ? seed.sh : '',
      netMargin: 0, rate: 0, refMargin: seed.r,
      sheetFollow: !!seed.f, sheetPriceSeed: seed.sp != null ? seed.sp : null, _t: seed.t,
    };
  });
  HK_ISO_CONNECTED_DRAFTS[acc.id] = {
    rows: acc.draftRows,
    priceHeader: '원장<br>판매가',
    saleGroupLabel: acc.saleGroupLabel,
    fixedCostAddon: acc.adhesive ? HK_ISO_DRAFT_ADHESIVE_ADDON : 0,
    line: 'bead',
    unitKey: acc.unitKey,
    codePrefix: acc.codePrefix,
    isAdhesive: acc.adhesive,
    deductShipping: false,
    hideUnifiedShipping: true,
    shippingHeader: '배송비<br><span class="pricing-th-tiny">참고</span>',
  };
});

/* 현재 원가·접착 가공비·판매가로 각 행의 원가·판매원가·마진·수수료·장당마진을 다시 계산해
   행 객체에 채운다(화면을 그리기 직전과 원가를 바꾼 뒤에 부른다). 판매가(row.price)는 건드리지 않는다. */
window.hkBeadRefreshDerived = function() {
  _hkBeadRecomputeUnits(); // DB 불러오기가 기본 원가·추가마진을 바꿨을 수 있다
  const addon = Number(HK_ISO_DRAFT_ADHESIVE_ADDON) || 0;
  HK_BEAD_ACCORDIONS.forEach(acc => {
    const unit = Number(HK_BEAD_UNIT_COSTS[acc.unitKey]) || 0;
    let sheetCost = 0;
    acc.draftRows.forEach(row => {
      if (row.name) {
        sheetCost = unit * row._t + (acc.adhesive ? addon : 0);
        row.unit = unit;
        row.sheetCost = sheetCost;
      }
      row.sheetPrice = row.sheetFollow ? sheetCost : (row.sheetPriceSeed != null ? row.sheetPriceSeed : '');
      const quantity = Number(row.saleSize.split('-').pop()) || 1;
      const rawSaleCost = sheetCost / _hkIsoDraftDivisor(row.saleSize) * quantity;
      const price = Number(row.price) || 0;
      const rawMargin = price - rawSaleCost;
      const fee = Math.round(price * 0.06);
      const vat = Math.round(price * 0.10);
      const rawNet = rawMargin - fee - vat;
      row.margin = Math.round(rawMargin);
      row.fee = fee;
      row.vat = vat;
      row.netMargin = Math.round(rawNet);
      row.rate = price > 0 ? Math.round(rawNet / price * 100) : 0;
    });
  });
};

/* DB 저장·불러오기가 쓰는 상품 목록 — 상품코드는 판매크기·두께·수량으로 만든다. */
window.hkBeadProductIndex = function() {
  const list = [];
  HK_BEAD_ACCORDIONS.forEach(acc => {
    acc.draftRows.forEach((row, rowIndex) => {
      list.push({
        code: _hkIsoDraftProductCode(row.saleSize, row._t, false, acc.codePrefix),
        block: null, ship: null, row, rowIndex,
        accordionId: acc.id, categoryId: 'hk_bead',
      });
    });
  });
  return list;
};

/* ─── 화면 ─── */
function _hkBeadCostCard() {
  // 아이소핑크 카드와 같은 모양 — 카드에는 기본 원가 입력칸만 두고, 추가마진과 적용 원가는 "마진 편집" 팝업에서 함께 본다.
  const gradeRows = HK_BEAD_GRADES.map(grade => `<tr>
    <td><span class="pricing-range-label">${grade.label}</span></td>
    <td><input type="text" inputmode="numeric" id="hkBeadBase-${grade.key}" class="pricing-input-field hk-iso-base-cost-input" value="${HK_BEAD_BASE_COSTS[grade.key]}" oninput="updateHkBeadBase('${grade.key}',this)" onblur="formatHkIsoDraftPrice(this)"></td>
  </tr>`).join('');

  return `<div class="card pricing-cost-card hk-iso-draft-margin-card" data-draft-tab="bead-shared">
    <div class="pricing-section-title">공통 원가 설정 <span class="pricing-section-sub">— 등급별 기본 원가 + 원장 규격별 추가마진 · 접착 가공비</span></div>
    <div class="pricing-cost-footer hk-iso-shared-cost-controls">
      <div class="pricing-base-month-wrap">
        <label class="pricing-base-month-label" for="hkBeadBaseMonth">단가 기준 년월</label>
        <input type="month" id="hkBeadBaseMonth" class="pricing-input-field pricing-month-field" value="${HK_ISO_DRAFT_BASE_MONTH}" oninput="hkIsoSetBaseMonth(this.value)">
      </div>
      <button type="button" class="pricing-margin-edit-btn" onclick="openHkBeadMarginModal()" title="원장 규격별 추가마진을 수정합니다.">
        <i class="fa-solid fa-sliders"></i> 마진 편집
      </button>
      <button type="button" class="pricing-margin-edit-btn" onclick="openHkIsoAdhesiveModal()" title="접착식 원장 한 장마다 원가에 더하는 가공비를 수정합니다(아이소핑크와 같은 값).">
        <i class="fa-solid fa-layer-group"></i> 접착 가공비
      </button>
    </div>
    <div class="pricing-cost-card-inner">
      <div class="pricing-input-table-wrap">
        <table class="pricing-cost-unified-table hk-iso-base-cost-table">
          <thead><tr><th>등급</th><th>기본 원가<br><span class="pricing-th-tiny">원/㎡·mm</span></th></tr></thead>
          <tbody>${gradeRows}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function renderHkBeadPane() {
  window.hkBeadRefreshDerived();
  const superTabs = HK_BEAD_SUPER_TABS.map((s, index) => `
    <button class="bead-subtab${index === 0 ? ' active' : ''}" onclick="setHkBeadSuperTab('${s.id}',this)">${s.label}<span class="bead-subtab-sub">${s.sub}</span></button>`
  ).join('');
  const superPanes = HK_BEAD_SUPER_TABS.map((s, index) => `
    <div id="hkBeadSuper-${s.id}" class="hk-bead-super-pane${index === 0 ? ' active' : ''}">
      <div class="hk-iso-accordion-list">
        ${HK_BEAD_ACCORDIONS.filter(acc => acc.superId === s.id).map((acc, ai) => _hkIsoAccordionSectionHtml(acc, ai === 0)).join('')}
      </div>
    </div>`
  ).join('');

  return `<div id="hkBeadBaseDataSection">
    ${_hkBeadCostCard()}<div class="card pricing-result-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">한국단열 스티로폼 기준 판매가<span class="pricing-spec-badge">1단계 · 배송 연결 전</span></div>
      </div>
      <div class="bead-subtab-bar" id="hkBeadSuperTabBar">${superTabs}</div>
      ${superPanes}
    </div>
  </div>`;
}

window.setHkBeadSuperTab = function(superId, el) {
  document.querySelectorAll('#hkBeadSuperTabBar .bead-subtab').forEach(button => button.classList.remove('active'));
  document.querySelectorAll('.hk-bead-super-pane').forEach(pane => pane.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('hkBeadSuper-' + superId)?.classList.add('active');
  if (typeof _lockHkIsoRowPriceEditors === 'function') _lockHkIsoRowPriceEditors();
};

/* 기본 원가·추가마진을 바꾸면 적용 원가를 다시 만들고, 그려진 표의 모든 스티로폼 행(접착식 포함)을 다시 계산한다. */
function _hkBeadAfterCostEdit() {
  _hkBeadRecomputeUnits();
  window.hkBeadApplyUnits();
}

/* 기본 원가(등급별)는 카드에서 바로 고친다. */
window.updateHkBeadBase = function(gradeKey, input) {
  HK_BEAD_BASE_COSTS[gradeKey] = _hkIsoDraftParseNumber(input.value);
  _hkBeadAfterCostEdit();
};

/* 추가마진(원장 규격별)은 아이소핑크처럼 "마진 편집" 팝업에서 고친다 — 확인을 눌러야 반영된다. */
window.openHkBeadMarginModal = function() {
  const modal = document.getElementById('hkBeadMarginModal');
  const body = document.getElementById('hkBeadMarginModalBody');
  if (!modal || !body) return;
  const rows = HK_BEAD_UNIT_INFO.map(info => `<tr>
      <td class="pim-td-t">${info.grade}</td>
      <td>${info.sheet}<span class="hk-bead-area">${info.area}㎡</span></td>
      <td class="hk-bead-modal-sheet" data-key="${info.key}">${_hkBeadSheetCost(info).toLocaleString()}</td>
      <td><input type="text" inputmode="numeric" id="hkBeadMarginModal-${info.key}" class="pim-input pim-input-margin" value="${HK_BEAD_UNIT_MARGINS[info.key]}" style="width:82px" oninput="previewHkBeadMargin('${info.key}',this)"></td>
      <td class="hk-bead-modal-applied" data-key="${info.key}">${HK_BEAD_UNIT_COSTS[info.key].toLocaleString()}</td>
    </tr>`).join('');
  body.innerHTML = `<div class="pim-section-title">스티로폼 — 원장 규격별 추가마진 (원/mm)</div>
    <div class="pim-margin-hint">추가마진은 기본 원가(원/㎡·mm) × 원장 면적으로 환산한 기본 원가에 더해집니다. 음수를 입력하면 기본 원가보다 낮아집니다. 두께와 관계없이 같은 원가가 적용되고, 접착식은 1종 3호 900*1800 적용 원가에 접착 가공비를 더합니다.</div>
    <div class="pim-table-scroll-wrap">
      <table class="pim-table pim-margin-only-table hk-iso-margin-modal-table">
        <thead><tr><th>등급</th><th>원장 규격</th><th>기본 원가</th><th>추가마진</th><th>적용 원가</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  modal.style.display = 'flex';
};

window.closeHkBeadMarginModal = function() {
  const modal = document.getElementById('hkBeadMarginModal');
  if (modal) modal.style.display = 'none';
};

window.previewHkBeadMargin = function(key, input) {
  const info = HK_BEAD_UNIT_INFO.find(item => item.key === key);
  const preview = document.querySelector(`.hk-bead-modal-applied[data-key="${key}"]`);
  if (info && preview) preview.textContent = (_hkBeadSheetCost(info) + _hkIsoDraftParseNumber(input.value)).toLocaleString();
};

window.confirmHkBeadMarginModal = function() {
  HK_BEAD_UNIT_INFO.forEach(info => {
    const input = document.getElementById('hkBeadMarginModal-' + info.key);
    if (input) HK_BEAD_UNIT_MARGINS[info.key] = _hkIsoDraftParseNumber(input.value);
  });
  _hkBeadAfterCostEdit();
  window.closeHkBeadMarginModal();
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

document.addEventListener('click', function(event) {
  const modal = document.getElementById('hkBeadMarginModal');
  if (modal && event.target === modal) window.closeHkBeadMarginModal();
});

/* 그려진 표의 스티로폼 행을 현재 원가·접착 가공비로 다시 계산한다(key를 주면 그 원가만). */
window.hkBeadApplyUnits = function(onlyKey) {
  document.querySelectorAll('.hk-iso-draft-table tbody tr[data-line="bead"]').forEach(row => {
    const key = row.dataset.unitKey;
    if (onlyKey && key !== onlyKey) return;
    row.dataset.fixedCostAddon = row.dataset.isAdhesive === '1' ? (Number(HK_ISO_DRAFT_ADHESIVE_ADDON) || 0) : 0;
    _hkIsoDraftApplyRowCost(row, Number(row.dataset.thickness), Number(HK_BEAD_UNIT_COSTS[key]) || 0);
  });
  window.hkBeadRefreshDerived();
};
