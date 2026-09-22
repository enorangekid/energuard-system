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
    id: 'bead1_600x900', superId: 'bead1', label: '600x900 기본 옵션', sub: '430×430 · 600×900',
    saleGroupLabel: '600*900', unitKey: 'b1_900', codePrefix: 'St', gradeLabel: '1종 3호', adhesive: false,
    sheet: '900*1800',
    rows: [
      { t:10, s:'430*430-4', p:1300, r:45, sp:1050 },
      // 2단계 배송 엑셀에만 있던 행(`St_430_430_10_5`, 상품번호 3505478787) — 사용자가 1단계에 추가하라고 함(2026-09-22).
      // 참고마진은 같은 두께 430*430 행과 같은 45%로 두었다(엑셀에 값 없음).
      { t:10, s:'430*430-5', p:1500, r:45 },
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
    id: 'bead1_600x900_bundle', superId: 'bead1', label: '600x900 묶음 옵션', sub: '430×430 · 600×900 묶음 · 쿠팡전용 포함',
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
    id: 'bead1_600x900_high_t', superId: 'bead1', label: '600x900 고티', sub: '100~600T',
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
    id: 'bead1_900x1800_high_t', superId: 'bead1', label: '900x1800 고티', sub: '100~600T',
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
      // 사용자 확인(2026-09-22): 20T-5장은 20,200원이 맞다(1단계 엑셀의 11,500원은 오류). 원장 판매가 참고값은 다른 행처럼
      // 판매가 × 3(=60,600), 참고마진은 이 가격의 순수마진율(54%)에 맞게 다른 접착식 행과 같은 55%로 바꿨다.
      { t:20, s:'600*900-5', p:20200, r:55, sp:60600 },
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
    id: 'bead2_600x900', superId: 'bead2', label: '600x900 기본 옵션', sub: '20~100T',
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
    id: 'bead2_600x900_high_t', superId: 'bead2', label: '600x900 고티', sub: '100~600T',
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
    id: 'bead2_900x1800_high_t', superId: 'bead2', label: '900x1800 고티', sub: '100~600T',
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

/* ═══════════════════════════════════════
   2단계 — 상품번호별 배송비·실판매가 (2026-09-22, 사용자가 준 엑셀 119행 취합)

   아이소핑크의 HK_ISO_SHIPPING_BLOCKS 구조를 그대로 쓴다(블록 하나 = 1단계 그룹 하나, 상품번호 여러 개가
   같은 블록을 공유). 값은 "상품코드 → 배송값" 사전으로 적어두고 1단계 행 순서에 맞춰 rows를 만든다 —
   행 순서를 손으로 맞추다 틀리는 일을 막고, 사전에 없는 행은 자동으로 알 수 있다.
   schema
   - per5: 5장당 배송비 기준(1종 3호·접착식 6,000 / 2종 2호 5,500). 값 = 5장당 실제배송비, 또는 [실제배송비, 배송비 플러스 금액].
   - per1Coupon(무료배송): 실판매가 = 판매가 + 실제배송비(플러스 금액 = 실제배송비). 값 = 실제배송비.
   - free90: 무료배송 + 10% 네고 — 실판매가 = floor100((판매가 + 실제배송비) × 0.9). 값 = 실제배송비.
   사용자 결정: 900*1800 고티의 `1800_900` 코드(상품번호 2913417918)는 `900_1800`으로 통일하고 나중에 받는 채널 자료의
   `1800_900` 코드는 자동으로 매핑한다(아래 별칭). `SSt_600_900_100_1`은 일부러 그렇게 등록한 코드라 그대로 둔다.
   사전에 없는 행(Neo_600_900_20_3 — 엑셀 어디에도 없음)은 5장당 기준 배송비 그대로(차액 0, 플러스 0)로 두고 assumed 표시.
═══════════════════════════════════════ */
const HK_BEAD_FREE_FIXED = { 100: 7500, 200: 7500, 300: 11000, 400: 14000, 500: 17000, 600: 21000 };   // 600*900 고티 무료배송
const HK_BEAD_FREE_1800 = { 100: 21500, 200: 21500, 300: 31500, 400: 41400, 500: 51300, 600: 60600 };   // 900*1800 고티 무료배송
const HK_BEAD_FREE_1200 = { 100: 14500, 200: 14500, 300: 21000, 400: 28000, 500: 34400, 600: 40800 };   // 900*1200 무료배송
function _hkBeadFreeData(prefix, sizeCode, qtyByThickness, table) {
  const data = {};
  Object.keys(table).forEach(t => { data[`${prefix}_${sizeCode}_${t}_${qtyByThickness[t]}`] = table[t]; });
  return data;
}
const HK_BEAD_HIGH_QTY = { 100: 2, 200: 1, 300: 1, 400: 1, 500: 1, 600: 1 };

const HK_BEAD_SHIPPING_BLOCKS = [
  {
    id: 'bead1_600x900_1', accordion: 'bead1_600x900', title: '스티로폼 1종 3호 600x900 기본 옵션', schema: 'per5',
    productNumbers: ['437331834', '3505478787'], baseShipping5: 6000,
    data: {
      St_430_430_10_4: 5200, St_430_430_10_5: 5200, St_600_900_10_5: 5500,
      St_430_430_20_3: 5500, St_600_900_20_2: 5500,
      St_430_430_30_3: 5500, St_600_900_30_1: 5500,
      St_430_430_40_2: 5500, St_600_900_40_1: 5500,
      St_430_430_50_2: 5500, St_600_900_50_1: 5500,
      St_430_430_100_1: 5500, St_600_900_100_1: 5500,
    },
  },
  {
    id: 'bead1_600x900_bundle_1', accordion: 'bead1_600x900_bundle', title: '스티로폼 1종 3호 600x900 묶음 옵션', schema: 'per5',
    productNumbers: ['446014684', '쿠팡전용'], baseShipping5: 6000,
    data: {
      St_600_900_10_10: 5500, St_600_900_20_5: 5500, St_600_900_30_3: 5500, St_600_900_40_2: 5500,
      St_430_430_50_3: 5200, St_600_900_50_2: 5500, St_430_430_100_3: 5500,
    },
  },
  {
    id: 'bead1_600x900_high_t_1', accordion: 'bead1_600x900_high_t', title: '스티로폼 1종 3호 600x900 고티(무료배송)', schema: 'per1Coupon',
    productNumbers: ['2913417918'],
    data: _hkBeadFreeData('St', '600_900', HK_BEAD_HIGH_QTY, HK_BEAD_FREE_FIXED),
  },
  {
    id: 'bead1_900x1800_1', accordion: 'bead1_900x1800', title: '스티로폼 1종 3호 900x1800(무료배송 · 10% 네고)', schema: 'free90',
    productNumbers: ['5759250443', '쿠팡전용'],
    data: {
      St_900_1800_10_10: 14000, St_900_1800_20_7: 15700, St_900_1800_30_5: 16900, St_900_1800_40_3: 14000,
      St_900_1800_40_5: 14000, St_900_1800_50_3: 16900, St_900_1800_100_1: 12200,
    },
  },
  {
    id: 'bead1_900x1800_high_t_1', accordion: 'bead1_900x1800_high_t', title: '스티로폼 1종 3호 900x1800 고티(무료배송)', schema: 'per1Coupon',
    productNumbers: ['5763066244', '2913417918'],
    data: _hkBeadFreeData('St', '900_1800', HK_BEAD_HIGH_QTY, HK_BEAD_FREE_1800),
  },
  {
    id: 'bead1_900x1200_1', accordion: 'bead1_900x1200', title: '스티로폼 1종 3호 900x1200(무료배송)', schema: 'per1Coupon',
    productNumbers: ['2913417918'],
    data: _hkBeadFreeData('St', '1200_900', HK_BEAD_HIGH_QTY, HK_BEAD_FREE_1200),
  },
  {
    id: 'beadA_600x900_1', accordion: 'beadA_600x900', title: '스티로폼 접착식 1종 3호 600x900', schema: 'per5',
    productNumbers: ['437331834', '3505478787', '3950515541', '446014684', '쿠팡전용'], baseShipping5: 6000,
    data: {
      StA_600_900_20_2: 5500, StA_600_900_20_5: 5500, StA_600_900_30_1: 5500,
      StA_600_900_30_3: 5500, StA_600_900_50_1: 5500, StA_600_900_50_2: 5500,
    },
  },
  {
    id: 'beadA_900x1800_1', accordion: 'beadA_900x1800', title: '스티로폼 접착식 1종 3호 900x1800(무료배송 · 10% 네고)', schema: 'free90',
    productNumbers: ['5759250443'],
    data: { StA_900_1800_20_7: 21500, StA_900_1800_30_5: 16900, StA_900_1800_50_3: 16900 },
  },
  {
    id: 'bead2_600x900_1', accordion: 'bead2_600x900', title: '스티로폼 2종 2호 600x900 기본 옵션', schema: 'per5',
    productNumbers: ['2216673728', '쿠팡전용'], baseShipping5: 5500,
    data: {
      Neo_430_430_20_3: 5500,
      Neo_430_430_30_3: [6500, 200], Neo_600_900_30_2: 5500, Neo_600_900_30_3: 5500,
      Neo_430_430_50_3: [9300, 800], Neo_600_900_50_1: 6500, Neo_600_900_50_2: [6500, 200],
      Neo_430_430_100_2: 5200, Neo_600_900_100_1: 5200,
    },
  },
  {
    id: 'bead2_600x900_high_t_1', accordion: 'bead2_600x900_high_t', title: '스티로폼 2종 2호 600x900 고티(무료배송)', schema: 'per1Coupon',
    productNumbers: ['2913417918'],
    data: _hkBeadFreeData('Neo', '600_900', HK_BEAD_HIGH_QTY, HK_BEAD_FREE_FIXED),
  },
  {
    id: 'bead2_900x1800_1', accordion: 'bead2_900x1800', title: '스티로폼 2종 2호 900x1800(무료배송 · 10% 네고)', schema: 'free90',
    productNumbers: ['5759250443'],
    data: { Neo_900_1800_30_5: 16900, Neo_900_1800_50_3: 16900, Neo_900_1800_100_1: 12200 },
  },
  {
    id: 'bead2_900x1800_high_t_1', accordion: 'bead2_900x1800_high_t', title: '스티로폼 2종 2호 900x1800 고티(무료배송)', schema: 'per1Coupon',
    productNumbers: ['5763066244', '2913417918'],
    data: _hkBeadFreeData('Neo', '900_1800', HK_BEAD_HIGH_QTY, HK_BEAD_FREE_1800),
  },
  {
    id: 'bead2_900x1200_1', accordion: 'bead2_900x1200', title: '스티로폼 2종 2호 900x1200(무료배송)', schema: 'per1Coupon',
    productNumbers: ['2913417918'],
    data: _hkBeadFreeData('Neo', '1200_900', HK_BEAD_HIGH_QTY, HK_BEAD_FREE_1200),
  },
];

/* 같은 옵션이 다른 코드로도 등록된 경우의 별칭 → 기준 코드. 900*1800 고티은 상품번호 2913417918에 `1800_900`
   순서로 등록돼 있었는데 사용자가 실수라며 900_1800으로 통일하라고 했다(2026-09-22). 나중에 받는 채널 자료에
   1800_900 코드가 나오면 이 규칙으로 자동 매핑한다. */
const HK_BEAD_CODE_ALIASES = { SSt_600_900_100_1: 'St_600_900_100_1' };
['St', 'Neo'].forEach(prefix => {
  Object.entries(HK_BEAD_HIGH_QTY).forEach(([thickness, qty]) => {
    HK_BEAD_CODE_ALIASES[`${prefix}_1800_900_${thickness}_${qty}`] = `${prefix}_900_1800_${thickness}_${qty}`;
  });
});
window.hkBeadNormalizeCode = function(code) {
  const text = String(code || '');
  return HK_BEAD_CODE_ALIASES[text] || text.replace(/^(St|StA|Neo)_1800_900_/, '$1_900_1800_');
};
window.hkBeadCodeAliasesFor = function(code) {
  return Object.keys(HK_BEAD_CODE_ALIASES).filter(alias => HK_BEAD_CODE_ALIASES[alias] === code);
};

/* 사전 → 엔진이 읽는 블록(HK_ISO_SHIPPING_BLOCKS)으로 만들어 등록한다. */
HK_BEAD_SHIPPING_BLOCKS.forEach(def => {
  const acc = HK_BEAD_ACCORDIONS.find(item => item.id === def.accordion);
  const block = {
    id: def.id,
    title: def.title,
    categoryId: 'hk_bead',
    productNumbers: def.productNumbers,
    sourceAccordion: acc.id,
    saleGroupLabel: acc.saleGroupLabel,
    isAdhesive: acc.adhesive,
    codePrefix: acc.codePrefix,
    schema: def.schema,
  };
  if (def.schema === 'per5') { block.baseShipping5 = def.baseShipping5; block.sharedBaseShipping = true; }
  if (def.schema === 'per1Coupon') block.isFreeShipping = true;
  block.rows = acc.draftRows.map(row => {
    const code = _hkIsoDraftProductCode(row.saleSize, row._t, false, acc.codePrefix);
    const value = def.data[code];
    if (def.schema === 'per5') {
      if (value == null) return { actualShipping5: def.baseShipping5, plusAmount: 0, assumed: true };
      return Array.isArray(value) ? { actualShipping5: value[0], plusAmount: value[1] } : { actualShipping5: value, plusAmount: 0 };
    }
    if (def.schema === 'per1Coupon') return { actualShipping: value ?? 0, coupon: 0, plusAmount: value ?? 0 };
    return { actualShipping: value ?? 0 };
  });
  HK_ISO_SHIPPING_BLOCKS.push(block);
  // 배송 블록이 생긴 그룹은 1단계 표에 배송 정책·가격 조정·현재 판매가 열을 다시 보여준다.
  HK_ISO_CONNECTED_DRAFTS[acc.id].hideUnifiedShipping = false;
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
    // 2단계 배송 블록이 있는 그룹은 배송값(ship)도 같은 상품 행에 함께 저장·복원한다.
    const block = HK_ISO_SHIPPING_BLOCKS.find(item => item.sourceAccordion === acc.id) || null;
    acc.draftRows.forEach((row, rowIndex) => {
      list.push({
        code: _hkIsoDraftProductCode(row.saleSize, row._t, false, acc.codePrefix),
        block, ship: block ? block.rows[rowIndex] : null, row, rowIndex,
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
      <button type="button" class="pricing-margin-edit-btn" onclick="toggleHkIsoShippingSection('hk_bead')" title="규격 그룹별 배송비·무료배송·10% 네고 정책을 수정합니다(스티로폼 전체).">
        <i class="fa-solid fa-truck-fast"></i> 배송 세부설정
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
        <div class="pricing-result-title">한국단열 스티로폼 기준 판매가<span class="pricing-spec-badge">원가·배송 통합</span></div>
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

/* ═══════════════════════════════════════
   한국단열 채널(스마트스토어) — 스티로폼 상품 (2026-09-22, 사용자가 준 채널 엑셀 118행)

   상품번호 10개. 옵션의 현재 판매가는 상품코드로 2단계 실판매가를 조회해서(엑셀의 VLOOKUP과 같은 방식)
   화면에서 계산하므로 여기에는 코드 목록만 둔다. 사용자 지시대로 "수정 전 판매가·배송비"는 엑셀의 예전 값이
   아니라 현재 값에 맞춰 넣는다(차액 0에서 시작; 단가표를 저장하면 그 시점 값으로 다시 맞춰진다).
   - 상품 단위 값(배송비·배송비 기준·제주·편도교환)은 엑셀 그대로. 옵션 코드는 스토어에 실제 등록된 코드 그대로 둔다 —
     `St_1800_900_…`·`SSt_600_900_100_1`처럼 별칭이 있는 코드도 그대로 두고, 가격 조회만 기준 코드로 자동 매핑된다
     (hkBeadNormalizeCode, 사용자 지시 "나중에 줄 때 알아서 매핑").
   - 상품번호 3950655401은 접착식 스티로폼(StA_) 옵션과 접착식 아이소핑크(IsoA_) 옵션이 한 상품에 섞여 있다 —
     카테고리는 상품 단위라 스티로폼으로 두고, 가격은 코드로 조회하니 IsoA_ 옵션도 아이소핑크 2단계 값으로 계산된다.
   - 3950515541과 3950655401은 번호가 비슷하지만 엑셀에 별개 상품으로 있어서 그대로 두 상품으로 넣었다.
═══════════════════════════════════════ */
window.hkBeadProductNameFromCode = function(code) {
  if (/^I+soA?_/.test(code)) return _hkIsoProductNameFromCode(code); // 스티로폼 상품에 섞인 아이소핑크 옵션
  const match = /^(SSt|StA|St|Neo)_(\d+)_(\d+)_(\d+)_(\d+)$/.exec(code);
  if (!match) return code;
  const label = { St: '백색스티로폼', SSt: '백색스티로폼', StA: '접착식_백색스티로폼', Neo: '회색스티로폼' }[match[1]];
  return `${label} ${match[2]}x${match[3]} ${match[4]}T_${match[5]}장`;
};

(function addBeadHkdChannelProducts() {
  const highCodes = (prefix, size) => [[100, 2], [200, 1], [300, 1], [400, 1], [500, 1], [600, 1]]
    .map(([thickness, qty]) => `${prefix}_${size}_${thickness}_${qty}`);
  const make = (productId, shipping, codes) => ({
    categoryId: 'hk_bead',
    productId,
    baseShipping: shipping.base,
    shippingBasis: shipping.basis,
    jejuShipping: shipping.jeju,
    returnExchange: shipping.exchange,
    items: codes.map(productCode => ({
      productCode,
      prevPrice: _hkIsoLookupFinalPriceByCode(productCode) ?? 0,
      prevShipping: shipping.base,
    })),
  });
  const per5 = { base: 6000, basis: '5개마다', jeju: 10000, exchange: '8500/17000' };
  const free = { base: 0, basis: '-', jeju: 30000, exchange: '35000/70000' };
  const basicOptions = [
    'St_430_430_20_3', 'St_600_900_20_2', 'St_430_430_30_3', 'St_600_900_30_1', 'St_430_430_40_2', 'St_600_900_40_1',
    'St_430_430_50_2', 'St_600_900_50_1', 'St_430_430_100_1', 'St_600_900_100_1',
    'StA_600_900_20_2', 'StA_600_900_30_1', 'StA_600_900_50_1',
  ];

  HK_CHANNEL_LISTINGS.hkd.push(
    make('437331834', { base: 6500, basis: '5개마다', jeju: 10000, exchange: '10500/25000' },
      ['St_430_430_10_4', 'St_600_900_10_5', ...basicOptions]),
    make('446014684', { base: 6000, basis: '1개마다', jeju: 10000, exchange: '8500/17000' },
      ['St_430_430_50_3', 'St_600_900_50_2', 'St_430_430_100_3', 'SSt_600_900_100_1',
       'StA_600_900_20_2', 'StA_600_900_30_1', 'StA_600_900_50_2']),
    make('2216673728', per5,
      ['Neo_430_430_20_3', 'Neo_430_430_30_3', 'Neo_600_900_30_2', 'Neo_430_430_50_3',
       'Neo_600_900_50_1', 'Neo_430_430_100_2', 'Neo_600_900_100_1']),
    make('2913417918', free, [
      ...highCodes('St', '600_900'), ...highCodes('Neo', '600_900'),
      ...highCodes('St', '1200_900'), ...highCodes('Neo', '1200_900'),
      ...highCodes('St', '1800_900'), ...highCodes('Neo', '1800_900'),
    ]),
    make('3505478787', per5, ['St_430_430_10_5', 'St_600_900_10_5', ...basicOptions]),
    make('3950515541', per5, ['StA_600_900_20_2', 'StA_600_900_30_1', 'StA_600_900_50_1']),
    make('3950655401', per5,
      ['StA_600_900_20_2', 'StA_600_900_30_1', 'StA_600_900_50_1',
       'IsoA_600_900_10_3', 'IsoA_600_900_20_1', 'IsoA_600_900_30_1', 'IsoA_600_900_40_1', 'IsoA_600_900_50_1']),
    make('5759250443', { base: 0, basis: '-', jeju: 35000, exchange: '35000/70000' }, [
      'St_900_1800_10_10', 'St_900_1800_20_7', 'St_900_1800_30_5', 'St_900_1800_40_3', 'St_900_1800_50_3', 'St_900_1800_100_1',
      'Neo_900_1800_30_5', 'Neo_900_1800_50_3', 'Neo_900_1800_100_1',
      'StA_900_1800_20_7', 'StA_900_1800_30_5', 'StA_900_1800_50_3',
    ]),
    make('5763066244', { base: 0, basis: '-', jeju: 90000, exchange: '80000/80000' },
      [...highCodes('Neo', '900_1800'), ...highCodes('St', '900_1800')]),
    make('7875494911', per5, ['St_600_900_30_1', 'StA_600_900_30_1', 'St_430_430_30_3']),
  );
})();

/* ═══════════════════════════════════════
   ESM 채널 — 스티로폼 (2026-09-22, 사용자가 준 표 48행). 옵션 하나가 상품 하나이고 행마다 마스터상품번호·
   상품번호가 따로 있다(아이소핑크 HK_ESM_ROWS와 같은 구조). ESM 최종 판매가 = (한국단열 판매가 + 한국단열
   배송비) × 1.08 을 100원 올림(HK_CHANNEL_CONFIG.esm)이라 값은 코드로 계산하고, 수정 전 판매가는 사용자 규칙대로
   현재 값에 맞춘다.
   - 430x430 / 600x900 그룹은 엑셀의 한국단열 배송비가 전부 6,500이다(Neo·쿠팡전용 코드 포함 — 한국단열 채널의
     같은 코드 상품 배송비(6,000)나 2단계 기본값(5,500)과 달라서) → 옵션마다 hkdShipping: 6500으로 명시했다.
     900x1800·고티 그룹은 배송비 "-"(0)이라 한국단열 채널 값(0)을 그대로 쓴다.
   - 상품코드는 ESM에 등록된 그대로(`St_1800_900_…` 포함) — 가격 조회만 기준 코드로 매핑된다.
═══════════════════════════════════════ */
(function addBeadEsmProducts() {
  const rows = [
    ['스티로폼 430x430 / 600x900', '1447267565', '2045175651', 'St_430_430_20_3'],
    ['스티로폼 430x430 / 600x900', '1458980510', '2059652956', 'St_600_900_20_2'],
    ['스티로폼 430x430 / 600x900', '1447374396', '2045314965', 'St_430_430_30_3'],
    ['스티로폼 430x430 / 600x900', '1458993148', '2059667975', 'St_600_900_30_1'],
    ['스티로폼 430x430 / 600x900', '1454412683', '2053999876', 'St_430_430_50_2'],
    ['스티로폼 430x430 / 600x900', '1447389276', '2045338281', 'St_600_900_50_1'],
    ['스티로폼 430x430 / 600x900', '1447390601', '2045340209', 'St_430_430_100_1'],
    ['스티로폼 430x430 / 600x900', '1447391732', '2045341887', 'St_600_900_100_1'],
    ['스티로폼 430x430 / 600x900', '1447421895', '2045389028', 'Neo_430_430_20_3'],
    ['스티로폼 430x430 / 600x900', '1447422708', '2045390220', 'Neo_430_430_30_3'],
    ['스티로폼 430x430 / 600x900', '1461799611', '2062777359', 'Neo_600_900_30_3'],
    ['스티로폼 430x430 / 600x900', '1447424802', '4584566369', 'Neo_430_430_50_3'],
    ['스티로폼 430x430 / 600x900', '1447427982', '4584566215', 'Neo_600_900_50_2'],
    ['스티로폼 430x430 / 600x900', '1447428712', '2045398310', 'Neo_430_430_100_2'],
    ['스티로폼 430x430 / 600x900', '1447429295', '4584566009', 'Neo_600_900_100_1'],
    ['스티로폼 430x430 / 600x900', '1408663872', '1998794871', 'StA_600_900_20_2'],
    ['스티로폼 430x430 / 600x900', '1408663050', '1998793432', 'StA_600_900_30_1'],
    ['스티로폼 430x430 / 600x900', '1408661432', '4584567015', 'StA_600_900_50_1'],
    ['스티로폼 900x1800', '1577177580', '4584574533', 'St_900_1800_20_7'],
    ['스티로폼 900x1800', '1577935479', '2191129325', 'St_900_1800_30_5'],
    ['스티로폼 900x1800', '1577943208', '4584574738', 'St_900_1800_50_3'],
    ['스티로폼 900x1800', '1577947533', '2191142355', 'St_900_1800_100_1'],
    ['스티로폼 900x1800', '1577986898', '4584629654', 'St_1800_900_200_1'],
    ['스티로폼 900x1800', '1577996584', '4584598380', 'St_1800_900_300_1'],
    ['스티로폼 900x1800', '1577997862', '4584598726', 'St_1800_900_400_1'],
    ['스티로폼 900x1800', '1577999724', '4584599076', 'St_1800_900_500_1'],
    ['스티로폼 900x1800', '1578000774', '4584599529', 'St_1800_900_600_1'],
    ['스티로폼 900x1800', '1577966924', '4584580485', 'StA_900_1800_20_7'],
    ['스티로폼 900x1800', '1577968335', '4584580625', 'StA_900_1800_30_5'],
    ['스티로폼 900x1800', '1577971233', '4584581733', 'StA_900_1800_50_3'],
    ['스티로폼 900x1800', '1577957265', '4584574904', 'Neo_900_1800_30_5'],
    ['스티로폼 900x1800', '1577958581', '4584576933', 'Neo_900_1800_50_3'],
    ['스티로폼 900x1800', '1577959874', '4584580078', 'Neo_900_1800_100_2'],
    ['스티로폼 900x1800', '1578002683', '4584599847', 'Neo_1800_900_200_1'],
    ['스티로폼 900x1800', '1578003720', '4584600127', 'Neo_1800_900_300_1'],
    ['스티로폼 900x1800', '1578004306', '4584600522', 'Neo_1800_900_400_1'],
    ['스티로폼 900x1800', '1578005083', '4584601050', 'Neo_1800_900_500_1'],
    ['스티로폼 900x1800', '1578005812', '4584601428', 'Neo_1800_900_600_1'],
    ['스티로폼 600x900 고티', '1629761555', '4584601706', 'St_600_900_200_1'],
    ['스티로폼 600x900 고티', '1629762765', '4584601972', 'St_600_900_300_1'],
    ['스티로폼 600x900 고티', '1629763710', '4584602348', 'St_600_900_400_1'],
    ['스티로폼 600x900 고티', '1629764809', '4584602650', 'St_600_900_500_1'],
    ['스티로폼 600x900 고티', '1629765636', '4584602972', 'St_600_900_600_1'],
    ['스티로폼 600x900 고티', '2027221439', '2683978695', 'Neo_600_900_200_1'],
    ['스티로폼 600x900 고티', '2027231651', '2683988896', 'Neo_600_900_300_1'],
    ['스티로폼 600x900 고티', '2027235296', '2683992612', 'Neo_600_900_400_1'],
    ['스티로폼 600x900 고티', '2027236509', '2683993962', 'Neo_600_900_500_1'],
    ['스티로폼 600x900 고티', '2027238396', '2683996052', 'Neo_600_900_600_1'],
  ];
  const config = HK_CHANNEL_CONFIG.esm;
  rows.forEach(([groupName, masterId, productId, productCode]) => {
    const item = { productCode };
    if (groupName === '스티로폼 430x430 / 600x900') item.hkdShipping = 6500;
    // 수정 전 판매가 = 현재 ESM 최종 판매가(사용자 규칙 — 차액 0에서 시작)
    item.prevPrice = _hkEsmPriceParts('hk_bead', productCode, config, item)?.finalPrice ?? 0;
    HK_CHANNEL_LISTINGS.esm.push({ categoryId: 'hk_bead', productId, masterId, groupName, items: [item] });
  });
})();

/* ═══════════════════════════════════════
   11번가 채널 — 스티로폼 (2026-09-22, 사용자가 준 표 9상품·113옵션). 아이소핑크 11번가(markupOptions
   레이아웃)와 같은 구조 — 상품 하나에 옵션 여러 개, 판매가는 HK_CHANNEL_CONFIG['11st']로 계산.
   - 430x430/600x900 계열(1848852975·1602435245·1548926732·1534558353·2265999489)은 엑셀의 한국단열
     배송비가 전부 6,500이라 옵션마다 hkdShipping: 6500을 명시했다(한국단열 채널의 같은 코드 배송비와 다름).
   - 900x1800·600x900 고티 계열(3731788703·3733599906·2053811062·1741566411)은 배송비 "-"(0) — 이 코드들은
     한국단열 채널에서도 배송비 0인 상품(2913417918)에만 있어서 조회값이 그대로 0이라 override 불필요.
   - 기준가 옵션이 첫 옵션이 아닌 경우: 옵션추가금이 0인 행(=기준가와 같은 값)을 찾아 baseCode로 지정 —
     1534558353은 St_430_430_50_2(엑셀의 주황 강조는 기준가 표시가 아니었다, 값으로 재확인함), 2053811062·
     1741566411은 St_600_900_300_1.
   - 1548926732·1534558353처럼 스티로폼(St_/Neo_/StA_)과 아이소핑크(Iso_/IsoA_) 코드가 한 상품에 섞여도
     categoryId를 hk_bead로 두면 코드 조회가 두 쪽 다 찾는다(한국단열 채널의 3950655401과 같은 패턴).
   - 2053811062·1741566411은 옵션 구성이 완전히 같은 별개 상품(원본 표 그대로, 아이소핑크 11번가의
     1534504863/1541883159와 같은 경우).
═══════════════════════════════════════ */
const HK_BEAD_11ST_GROUPS = [
  { productId: '1848852975', shipping: 6500, codes: [
    'St_430_430_10_5', 'St_600_900_10_5', 'St_430_430_20_3', 'St_600_900_20_2', 'St_430_430_30_3', 'St_600_900_30_1',
    'St_430_430_40_2', 'St_600_900_40_1', 'St_430_430_50_2', 'St_600_900_50_1', 'St_430_430_100_1', 'St_600_900_100_1',
    'StA_600_900_20_2', 'StA_600_900_30_1', 'StA_600_900_50_1',
  ] },
  { productId: '1602435245', shipping: 6500, codes: [
    'Neo_430_430_20_3', 'Neo_430_430_30_3', 'Neo_600_900_30_3', 'Neo_430_430_50_3', 'Neo_600_900_50_2', 'Neo_430_430_100_2', 'Neo_600_900_100_1',
  ] },
  { productId: '1548926732', shipping: 6500, codes: [
    'St_430_430_50_2', 'St_600_900_50_1', 'St_430_430_100_1', 'St_600_900_100_1',
    'Neo_430_430_50_3', 'Neo_600_900_50_2', 'Neo_430_430_100_2', 'Neo_600_900_100_1',
    'Iso_430_430_30_2', 'Iso_600_900_30_1', 'Iso_430_430_50_2', 'Iso_600_900_50_1',
    'StA_600_900_50_1', 'IsoA_600_900_30_1', 'IsoA_600_900_50_1',
  ] },
  { productId: '1534558353', shipping: 6500, baseCode: 'St_430_430_50_2', codes: [
    'St_430_430_20_3', 'St_600_900_20_2', 'St_430_430_30_3', 'St_600_900_30_1', 'St_430_430_50_2', 'St_600_900_50_1',
    'St_430_430_100_1', 'St_600_900_100_1',
    'Neo_430_430_20_3', 'Neo_430_430_30_3', 'Neo_600_900_30_3', 'Neo_430_430_50_3', 'Neo_600_900_50_2', 'Neo_430_430_100_2', 'Neo_600_900_100_1',
    'Iso_430_430_10_3', 'Iso_600_900_10_3', 'Iso_430_430_20_3', 'Iso_600_900_20_1', 'Iso_430_430_30_2', 'Iso_600_900_30_1',
    'Iso_430_430_40_2', 'Iso_600_900_40_1', 'Iso_430_430_50_2', 'Iso_600_900_50_1', 'Iso_430_430_70_1', 'Iso_600_900_70_1', 'Iso_430_430_100_1',
    'StA_600_900_20_2', 'StA_600_900_30_1', 'StA_600_900_50_1',
    'IsoA_600_900_10_3', 'IsoA_600_900_20_1', 'IsoA_600_900_30_1', 'IsoA_600_900_40_1', 'IsoA_600_900_50_1',
  ] },
  { productId: '3731788703', shipping: null, codes: [
    'St_900_1800_20_7', 'St_900_1800_30_5', 'St_900_1800_50_3', 'St_900_1800_100_1',
    'Neo_900_1800_30_5', 'Neo_900_1800_50_3', 'Neo_900_1800_100_1',
    'StA_900_1800_20_7', 'StA_900_1800_30_5', 'StA_900_1800_50_3',
  ] },
  { productId: '3733599906', shipping: null, codes: [
    'St_900_1800_200_1', 'St_900_1800_300_1', 'St_900_1800_400_1', 'St_900_1800_500_1', 'St_900_1800_600_1',
    'Neo_900_1800_200_1', 'Neo_900_1800_300_1', 'Neo_900_1800_400_1', 'Neo_900_1800_500_1', 'Neo_900_1800_600_1',
  ] },
  { productId: '2265999489', shipping: 6500, codes: ['StA_600_900_20_2', 'StA_600_900_30_1', 'StA_600_900_50_1'] },
  { productId: '2053811062', shipping: null, baseCode: 'St_600_900_300_1', codes: [
    'St_600_900_200_1', 'St_600_900_300_1', 'St_600_900_400_1', 'St_600_900_500_1', 'St_600_900_600_1',
    'Neo_600_900_200_1', 'Neo_600_900_300_1', 'Neo_600_900_400_1', 'Neo_600_900_500_1', 'Neo_600_900_600_1',
  ] },
  { productId: '1741566411', shipping: null, baseCode: 'St_600_900_300_1', codes: [
    'St_600_900_200_1', 'St_600_900_300_1', 'St_600_900_400_1', 'St_600_900_500_1', 'St_600_900_600_1',
    'Neo_600_900_200_1', 'Neo_600_900_300_1', 'Neo_600_900_400_1', 'Neo_600_900_500_1', 'Neo_600_900_600_1',
  ] },
];

(function addBead11stProducts() {
  const config = HK_CHANNEL_CONFIG['11st'];
  HK_BEAD_11ST_GROUPS.forEach(group => {
    const items = group.codes.map(code => {
      const item = { productCode: code };
      if (group.shipping != null) item.hkdShipping = group.shipping;
      item.prevPrice = _hkEsmPriceParts('hk_bead', code, config, item)?.finalPrice ?? 0;
      return item;
    });
    const product = { categoryId: 'hk_bead', productId: group.productId, items };
    if (group.baseCode) {
      product.baseCode = group.baseCode;
      product.seedBaseCode = group.baseCode; // 11st 배열은 pricing-hankook.js의 seedBaseCode 초기화 루프보다 늦게 로드되므로 직접 채운다.
    }
    HK_CHANNEL_LISTINGS['11st'].push(product);
  });
})();

/* ═══════════════════════════════════════
   홈페이지 채널(boonimall) — 스티로폼 (2026-09-22, 사용자가 준 표 26상품·28옵션). 마크업 없이 2단계
   실판매가를 그대로 쓰는 채널이라(아이소핑크 홈페이지와 같은 구조) 코드 목록 + 배송값만 두고,
   현재 판매가는 _hkIsoLookupFinalPriceByCode로 조회한다.
   - 사용자 규칙대로 수정 전 판매가·배송비는 엑셀의 예전 값이 아니라 현재 값에 맞춘다(차액 0에서 시작).
   - 옵션 하나가 상품 하나(각자 고유 상품ID)이고, 접착식 3옵션(StA_600_900_20_2/30_1/50_1)만 상품ID 118
     하나를 공유한다(엑셀에 병합 셀로 표시).
   - 배송비 그룹: 430x430·600x900 저두께(≤100T, 100T만 배송비기준 "2개마다")는 6,000원/5개마다,
     600x900 200T 이상(고티)은 0원/무료배송(제주·교환 값도 다름).
═══════════════════════════════════════ */
(function addBeadHomepageProducts() {
  const low = { base: 6000, basis: '5개마다', jeju: 10000, exchange: '8000/16000' };
  const low2 = { base: 6000, basis: '2개마다', jeju: 10000, exchange: '8000/16000' }; // 100T만 배송비기준이 다름
  const high = { base: 0, basis: '-', jeju: 20000, exchange: '20000/40000' };
  const single = (productId, shipping, productCode) => ({
    categoryId: 'hk_bead', productId,
    baseShipping: shipping.base, shippingBasis: shipping.basis, jejuShipping: shipping.jeju, returnExchange: shipping.exchange,
    items: [{ productCode, prevPrice: _hkIsoLookupFinalPriceByCode(productCode) ?? 0, prevShipping: shipping.base }],
  });
  const rows = [
    ['193', low, 'St_430_430_20_3'], ['194', low, 'St_430_430_30_3'], ['195', low, 'St_430_430_50_3'], ['196', low, 'St_430_430_100_1'],
    ['246', low, 'St_600_900_20_2'], ['119', low, 'St_600_900_30_1'], ['120', low, 'St_600_900_50_1'], ['121', low2, 'St_600_900_100_1'],
    ['122', high, 'St_600_900_200_1'], ['123', high, 'St_600_900_300_1'], ['124', high, 'St_600_900_400_1'], ['125', high, 'St_600_900_500_1'], ['126', high, 'St_600_900_600_1'],
    ['245', low, 'Neo_430_430_20_3'], ['197', low, 'Neo_430_430_30_3'], ['198', low, 'Neo_430_430_50_3'], ['199', low, 'Neo_430_430_100_2'],
    ['127', low, 'Neo_600_900_30_2'], ['128', low, 'Neo_600_900_50_1'], ['129', low2, 'Neo_600_900_100_1'],
    ['230', high, 'Neo_600_900_200_1'], ['231', high, 'Neo_600_900_300_1'], ['232', high, 'Neo_600_900_400_1'], ['233', high, 'Neo_600_900_500_1'], ['234', high, 'Neo_600_900_600_1'],
  ];
  const products = rows.map(([productId, shipping, code]) => single(productId, shipping, code));
  products.push({
    categoryId: 'hk_bead', productId: '118',
    baseShipping: low.base, shippingBasis: low.basis, jejuShipping: low.jeju, returnExchange: low.exchange,
    items: ['StA_600_900_20_2', 'StA_600_900_30_1', 'StA_600_900_50_1'].map(code => ({
      productCode: code, prevPrice: _hkIsoLookupFinalPriceByCode(code) ?? 0, prevShipping: low.base,
    })),
  });
  HK_CHANNEL_LISTINGS.homepage.push(...products);
})();

/* ═══════════════════════════════════════
   쿠팡 채널 — 스티로폼 (2026-09-22, 사용자가 준 표 61행 중 54행). 위너 상품은 이번엔 없음(사용자 확인).
   쿠폰은 두 종류다 — 대부분 퍼센트(10%, item.couponOff=10로 명시: 무료배송 상품도 예외 없이 10%라
   기본값 12% 분기를 쓰면 안 된다), 노출상품ID 174891106 상품 11개만 정액 25,000원 쿠폰
   (item.couponFlat=25000 — _hkCoupangPriceParts의 새 분기: 등록가 = 참고 판매가(×1.05, 100원 올림) +
   25,000, 쿠폰 적용 후 최종가 = 참고 판매가. 원본 엑셀은 이 11행도 퍼센트 쿠폰과 같은 식으로 계산해
   틀린 값이 있었다 — 사용자가 정정함, 2026-09-22).
   등록가 반올림은 100원 올림이 아니라 10원 단위 반올림(사용자 확인, categoryId==='hk_bead' 분기).
   보류(사용자가 나중에 확인하기로 함, 2026-09-22): ① 노출상품ID·옵션ID가 없는 7옵션(600x900 기본 10T~50T
   St_ 5개, StA_ 접착식 20T·30T 2개) — 아직 쿠팡에 등록 전으로 보여 이번엔 뺐다. ② "교환/반품" 칸이 엑셀에
   숫자 하나뿐이라(아이소핑크는 "편도/왕복" 두 값) 의미를 그대로 문자열로만 옮겨뒀다.
═══════════════════════════════════════ */
(function addBeadCoupangProducts() {
  const config = HK_CHANNEL_CONFIG.coupang;
  const group = (productId, returnExchange, rows) => {
    const items = rows.map(([optionId, code, ship, couponFlat]) => {
      const item = { productCode: code, optionId, hkdShipping: ship };
      if (couponFlat != null) item.couponFlat = couponFlat; else item.couponOff = 10;
      const parts = _hkCoupangPriceParts('hk_bead', code, config, item, null);
      item.prevPrice = parts ? parts.registered : 0;
      return item;
    });
    return { categoryId: 'hk_bead', productId, baseShipping: 0, jejuShipping: 8000, returnExchange, items };
  };
  HK_CHANNEL_LISTINGS.coupang.push(
    group('8121108535', '8000', [
      ['91273288153', 'St_430_430_10_4', 6500], ['91273288173', 'St_430_430_20_3', 6500],
      ['91273288160', 'St_430_430_30_3', 6500], ['91273288147', 'St_430_430_40_2', 6500],
      ['91273288182', 'St_430_430_50_2', 6500], ['91273288166', 'St_430_430_100_1', 6500],
    ]),
    group('174891106', '10000', [
      ['91287911524', 'St_600_900_10_10', 6500, 25000], ['91287941626', 'St_600_900_20_5', 6500, 25000],
      ['91287941621', 'St_600_900_30_3', 6500, 25000], ['91287911536', 'St_600_900_40_2', 6500, 25000],
      ['91287911539', 'St_600_900_50_2', 6500, 25000], ['91287911531', 'St_600_900_100_1', 6000, 25000],
      ['91273879184', 'St_600_900_200_1', 0, 25000], ['91273879186', 'St_600_900_300_1', 0, 25000],
      ['91273879192', 'St_600_900_400_1', 0, 25000], ['91273879179', 'St_600_900_500_1', 0, 25000],
      ['91273879195', 'St_600_900_600_1', 0, 25000],
    ]),
    group('5164342505', '8500', [
      ['91273904223', 'StA_600_900_20_5', 6000], ['91273904225', 'StA_600_900_30_3', 6000],
      ['91273904229', 'StA_600_900_50_2', 6000],
    ]),
    group('8074861817', '5000', [
      ['91274209421', 'Neo_430_430_20_3', 6000], ['91274209436', 'Neo_430_430_30_3', 6000],
      ['91274209430', 'Neo_430_430_50_3', 6000], ['91274209442', 'Neo_430_430_100_2', 6000],
    ]),
    group('8074870644', '7500', [
      ['91274226598', 'Neo_600_900_30_3', 6000], ['91274226601', 'Neo_600_900_50_2', 6000],
      ['91274226603', 'Neo_600_900_100_1', 6000],
    ]),
    group('8323148124', '14500', [['91274005590', 'St_900_1800_20_7', 0]]),
    group('5994531539', '14500', [
      ['91273973750', 'St_900_1800_30_5', 0], ['91273973743', 'St_900_1800_50_3', 0], ['91273973746', 'St_900_1800_100_1', 0],
      ['91274028166', 'Neo_900_1800_30_5', 0], ['91274028179', 'Neo_900_1800_50_3', 0], ['91274028172', 'Neo_900_1800_100_1', 0],
      ['91274069755', 'StA_900_1800_20_7', 0], ['91274069760', 'StA_900_1800_30_5', 0], ['91274069765', 'StA_900_1800_50_3', 0],
    ]),
    group('9578897160', '14500', [['95536302261', 'St_900_1800_40_3', 0], ['95536302260', 'St_900_1800_40_5', 0]]),
    group('5999901388', '30000', [
      ['91274154861', 'St_900_1800_200_1', 0], ['91274154867', 'St_900_1800_300_1', 0], ['91274154886', 'St_900_1800_400_1', 0],
      ['91274154880', 'St_900_1800_500_1', 0], ['91274154872', 'St_900_1800_600_1', 0],
      ['91274176290', 'Neo_900_1800_200_1', 0], ['91274176282', 'Neo_900_1800_300_1', 0], ['91274176299', 'Neo_900_1800_400_1', 0],
      ['91274176310', 'Neo_900_1800_500_1', 0], ['91274176320', 'Neo_900_1800_600_1', 0],
    ]),
    group('4868994758', '17500', [
      ['91274242173', 'Neo_600_900_200_1', 0], ['91274242193', 'Neo_600_900_300_1', 0], ['91274242200', 'Neo_600_900_400_1', 0],
      ['91274242188', 'Neo_600_900_500_1', 0], ['91274242179', 'Neo_600_900_600_1', 0],
    ]),
  );
})();
