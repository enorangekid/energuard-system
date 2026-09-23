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

   아이소핑크는 새 사이즈별 단가표와 공통 원가·마진 계산 구조를 사용한다.
   나머지 카테고리는 자료를 받는 순서대로 renderHkCategoryPane()에 추가한다.
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

// 판매 채널 — 특정 카테고리에 속하지 않는 전사 상품 보기다. 한 채널 안에
// 아이소핑크·스티로폼·PF보드 등 그 몰에서 판매하는 모든 제품을 모으고,
// categoryId로 필터링한다(2026-09-21).
const HK_CHANNELS = [
  { id: 'hkd',         label: '한국단열' },
  { id: 'hkd_life',    label: '한국단열라이프' },
  { id: 'homepage',    label: '홈페이지' },
  { id: 'coupang',     label: '쿠팡' },
  { id: 'coupang_sub', label: '쿠팡_부자재' },
  { id: 'esm',         label: 'ESM' },
  { id: '11st',        label: '11번가' },
];
let _activeHkChannel = HK_CHANNELS[0].id;
window._activeHkChannel = _activeHkChannel;
let _activeHkChannelCategory = 'all';

// 한국단열 아이소핑크 — 상위 탭(일반/접착식/쿠팡 위너) 안에 사이즈·판매방식별
// 아코디언을 두는 구조(2026-09-16). 아코디언은 각각 독립적으로 열고 닫으며,
// 상위 탭을 바꿔도 그 탭에서 열어둔 상태를 유지한다.
// accordions[].id는 HK_ISO_CONNECTED_DRAFTS의 키와 그대로 맞물린다 — 이후
// 실제 상품 매핑의 기준키로 쓸 값이라 바꾸지 않는다.
const HK_ISO_SUPER_TABS = [
  {
    id: 'general',
    label: '일반 아이소핑크',
    sub: '600x900 · 900x1800 · 고티',
    accordions: [
      { id: 'iso_600x900',         label: '600x900 일반' },
      { id: 'iso_600x900_high_t',  label: '600 계열 고티', sub: '600×860 · 600×430' },
      { id: 'iso_900x1800_single', label: '900x1800 단품' },
      { id: 'iso_900x1800_bundle', label: '900x1800 묶음' },
      { id: 'iso_900x1800_high_t', label: '900x1800 고티' },
    ],
  },
  {
    id: 'adhesive',
    label: '접착식 아이소핑크',
    sub: '600x900 · 900x1800',
    accordions: [
      { id: 'adhesive_600x900_a',       label: '600x900' },
      { id: 'adhesive_900x1800_single', label: '900x1800 단품' },
      { id: 'adhesive_900x1800_bundle', label: '900x1800 묶음' },
    ],
  },
  {
    id: 'coupang',
    label: '쿠팡 위너',
    sub: '쿠팡 전용',
    accordions: [
      { id: 'iso_coupang_winner', label: '쿠팡 위너 전체' },
    ],
  },
];

// 아이소핑크 600x900 원본 표. 첫 번째 하위 탭에만 연결한다.
const HK_ISO_DRAFT_600X900_ROWS = [
  { name:'아이소핑크 10T',  unit:250, spec:'10*900*1800',  sheetCost:2500,  sheetPrice:6800,  saleSize:'430*430-3', saleCost:938,  price:2600,  margin:1663,  fee:156,  vat:260,  shipping:'', netMargin:1247, rate:48, refMargin:55 },
  { name:'',                unit:'',  spec:'',             sheetCost:'',    sheetPrice:'',    saleSize:'600*900-3', saleCost:2500, price:6800,  margin:4300,  fee:408,  vat:680,  shipping:'', netMargin:3212, rate:47, refMargin:50 },
  { name:'아이소핑크 20T',  unit:250, spec:'20*900*1800',  sheetCost:5000,  sheetPrice:12900, saleSize:'430*430-3', saleCost:1875, price:6400,  margin:4525,  fee:384,  vat:640,  shipping:'', netMargin:3501, rate:55, refMargin:55 },
  { name:'',                unit:'',  spec:'',             sheetCost:'',    sheetPrice:'',    saleSize:'600*900-1', saleCost:1667, price:4300,  margin:2633,  fee:258,  vat:430,  shipping:'', netMargin:1945, rate:45, refMargin:50 },
  { name:'아이소핑크 30T',  unit:225, spec:'30*900*1800',  sheetCost:6750,  sheetPrice:17700, saleSize:'430*430-2', saleCost:1688, price:5700,  margin:4013,  fee:342,  vat:570,  shipping:'', netMargin:3101, rate:54, refMargin:55 },
  { name:'',                unit:'',  spec:'',             sheetCost:'',    sheetPrice:'',    saleSize:'600*900-1', saleCost:2250, price:5900,  margin:3650,  fee:354,  vat:590,  shipping:'', netMargin:2706, rate:46, refMargin:50 },
  { name:'아이소핑크 40T',  unit:225, spec:'40*900*1800',  sheetCost:9000,  sheetPrice:24600, saleSize:'430*430-2', saleCost:2250, price:7700,  margin:5450,  fee:462,  vat:770,  shipping:'', netMargin:4218, rate:55, refMargin:55 },
  { name:'',                unit:'',  spec:'',             sheetCost:'',    sheetPrice:'',    saleSize:'600*900-1', saleCost:3000, price:8200,  margin:5200,  fee:492,  vat:820,  shipping:'', netMargin:3888, rate:47, refMargin:50 },
  { name:'아이소핑크 50T',  unit:220, spec:'50*900*1800',  sheetCost:11000, sheetPrice:30000, saleSize:'430*430-2', saleCost:2750, price:9200,  margin:6450,  fee:552,  vat:920,  shipping:'', netMargin:4978, rate:54, refMargin:55 },
  { name:'',                unit:'',  spec:'',             sheetCost:'',    sheetPrice:'',    saleSize:'600*900-1', saleCost:3667, price:10000, margin:6333,  fee:600,  vat:1000, shipping:'', netMargin:4733, rate:47, refMargin:50 },
  { name:'아이소핑크 70T',  unit:220, spec:'70*900*1800',  sheetCost:15400, sheetPrice:41700, saleSize:'430*430-1', saleCost:1925, price:6700,  margin:4775,  fee:402,  vat:670,  shipping:'', netMargin:3703, rate:55, refMargin:55 },
  { name:'',                unit:'',  spec:'',             sheetCost:'',    sheetPrice:'',    saleSize:'600*900-1', saleCost:5133, price:13900, margin:8767,  fee:834,  vat:1390, shipping:'', netMargin:6543, rate:47, refMargin:50 },
  { name:'아이소핑크 100T', unit:220, spec:'100*900*1800', sheetCost:22000, sheetPrice:59700, saleSize:'430*430-1', saleCost:2750, price:9100,  margin:6350,  fee:546,  vat:910,  shipping:'', netMargin:4894, rate:54, refMargin:55 },
  { name:'',                unit:'',  spec:'',             sheetCost:'',    sheetPrice:'',    saleSize:'600*900-1', saleCost:7333, price:19900, margin:12567, fee:1194, vat:1990, shipping:'', netMargin:9383, rate:47, refMargin:50 },
];

const HK_ISO_DRAFT_ADHESIVE_600X900_ROWS = [
  { name:'아이소핑크 10T', unit:250, spec:'10*900*1800', sheetCost:3850,  sheetPrice:37500, saleSize:'600*900-3', saleCost:3850, price:12500, margin:8650, fee:750, vat:1250, shipping:'', netMargin:6650, rate:53, refMargin:55 },
  { name:'',               unit:'',  spec:'',            sheetCost:'',    sheetPrice:480000, saleSize:'600*900-10', saleCost:12833, price:48000, margin:35167, fee:2880, vat:4800, shipping:'', netMargin:27487, rate:57, refMargin:55 },
  { name:'아이소핑크 20T', unit:250, spec:'20*900*1800', sheetCost:6350,  sheetPrice:7100,  saleSize:'600*900-1', saleCost:2117, price:7100,  margin:4983, fee:426, vat:710,  shipping:'', netMargin:3847, rate:54, refMargin:55 },
  { name:'',               unit:'',  spec:'',            sheetCost:'',    sheetPrice:177500, saleSize:'600*900-5', saleCost:10583, price:35500, margin:24917, fee:2130, vat:3550, shipping:'', netMargin:19237, rate:54, refMargin:55 },
  { name:'아이소핑크 30T', unit:225, spec:'30*900*1800', sheetCost:8100,  sheetPrice:9100,  saleSize:'600*900-1', saleCost:2700, price:9100,  margin:6400, fee:546, vat:910,  shipping:'', netMargin:4944, rate:54, refMargin:55 },
  { name:'',               unit:'',  spec:'',            sheetCost:'',    sheetPrice:82800, saleSize:'600*900-3', saleCost:8100, price:27600, margin:19500, fee:1656, vat:2760, shipping:'', netMargin:15084, rate:55, refMargin:55 },
  { name:'아이소핑크 40T', unit:225, spec:'40*900*1800', sheetCost:10350, sheetPrice:11500, saleSize:'600*900-1', saleCost:3450, price:11500, margin:8050, fee:690, vat:1150, shipping:'', netMargin:6210, rate:54, refMargin:55 },
  { name:'',               unit:'',  spec:'',            sheetCost:'',    sheetPrice:46800, saleSize:'600*900-2', saleCost:6900, price:23400, margin:16500, fee:1404, vat:2340, shipping:'', netMargin:12756, rate:55, refMargin:55 },
  { name:'아이소핑크 50T', unit:220, spec:'50*900*1800', sheetCost:12350, sheetPrice:13900, saleSize:'600*900-1', saleCost:4117, price:13900, margin:9783, fee:834, vat:1390, shipping:'', netMargin:7559, rate:54, refMargin:55 },
  { name:'',               unit:'',  spec:'',            sheetCost:'',    sheetPrice:58000, saleSize:'600*900-2', saleCost:8233, price:29000, margin:20767, fee:1740, vat:2900, shipping:'', netMargin:16127, rate:56, refMargin:55 },
];

const HK_ISO_DRAFT_900X1800_BUNDLE_ROWS = [
  { name:'아이소핑크 10T',  unit:250, spec:'10*900*1800',  sheetCost:2500,  sheetPrice:4150,  saleSize:'900*1800-10', saleCost:25000, price:41500, margin:16500, fee:2490, vat:4150, shipping:'', netMargin:9860,  rate:24, refMargin:30 },
  { name:'아이소핑크 20T',  unit:250, spec:'20*900*1800',  sheetCost:5000,  sheetPrice:8300,  saleSize:'900*1800-5',  saleCost:25000, price:41500, margin:16500, fee:2490, vat:4150, shipping:'', netMargin:9860,  rate:24, refMargin:30 },
  { name:'아이소핑크 30T',  unit:225, spec:'30*900*1800',  sheetCost:6750,  sheetPrice:12500, saleSize:'900*1800-3',  saleCost:20250, price:37500, margin:17250, fee:2250, vat:3750, shipping:'', netMargin:11250, rate:30, refMargin:30 },
  { name:'아이소핑크 40T',  unit:225, spec:'40*900*1800',  sheetCost:9000,  sheetPrice:15500, saleSize:'900*1800-2',  saleCost:18000, price:31000, margin:13000, fee:1860, vat:3100, shipping:'', netMargin:8040,  rate:26, refMargin:30 },
  { name:'아이소핑크 50T',  unit:220, spec:'50*900*1800',  sheetCost:11000, sheetPrice:20000, saleSize:'900*1800-2',  saleCost:22000, price:40000, margin:18000, fee:2400, vat:4000, shipping:'', netMargin:11600, rate:29, refMargin:30 },
  { name:'아이소핑크 70T',  unit:220, spec:'70*900*1800',  sheetCost:15400, sheetPrice:26500, saleSize:'900*1800-1',  saleCost:15400, price:26500, margin:11100, fee:1590, vat:2650, shipping:'', netMargin:6860,  rate:26, refMargin:25 },
  { name:'아이소핑크 100T', unit:220, spec:'100*900*1800', sheetCost:22000, sheetPrice:35500, saleSize:'900*1800-1',  saleCost:22000, price:35500, margin:13500, fee:2130, vat:3550, shipping:'', netMargin:7820,  rate:22, refMargin:25 },
];

const HK_ISO_DRAFT_900X1800_SINGLE_ROWS = [
  { name:'아이소핑크 10T',  unit:250, spec:'10*900*1800',  sheetCost:2500,  sheetPrice:4200,  saleSize:'900*1800-1', saleCost:2500,  price:4200,  margin:1700,  fee:252,  vat:420,  shipping:'', netMargin:1028, rate:24, refMargin:30 },
  { name:'아이소핑크 20T',  unit:250, spec:'20*900*1800',  sheetCost:5000,  sheetPrice:8400,  saleSize:'900*1800-1', saleCost:5000,  price:8400,  margin:3400,  fee:504,  vat:840,  shipping:'', netMargin:2056, rate:24, refMargin:30 },
  { name:'아이소핑크 30T',  unit:225, spec:'30*900*1800',  sheetCost:6750,  sheetPrice:12500, saleSize:'900*1800-1', saleCost:6750,  price:12500, margin:5750,  fee:750,  vat:1250, shipping:'', netMargin:3750, rate:30, refMargin:30 },
  { name:'아이소핑크 40T',  unit:225, spec:'40*900*1800',  sheetCost:9000,  sheetPrice:17000, saleSize:'900*1800-1', saleCost:9000,  price:17000, margin:8000,  fee:1020, vat:1700, shipping:'', netMargin:5280, rate:31, refMargin:30 },
  { name:'아이소핑크 50T',  unit:220, spec:'50*900*1800',  sheetCost:11000, sheetPrice:20000, saleSize:'900*1800-1', saleCost:11000, price:20000, margin:9000,  fee:1200, vat:2000, shipping:'', netMargin:5800, rate:29, refMargin:30 },
  { name:'아이소핑크 70T',  unit:220, spec:'70*900*1800',  sheetCost:15400, sheetPrice:27000, saleSize:'900*1800-1', saleCost:15400, price:27000, margin:11600, fee:1620, vat:2700, shipping:'', netMargin:7280, rate:27, refMargin:25 },
  { name:'아이소핑크 100T', unit:220, spec:'100*900*1800', sheetCost:22000, sheetPrice:36500, saleSize:'900*1800-1', saleCost:22000, price:36500, margin:14500, fee:2190, vat:3650, shipping:'', netMargin:8660, rate:24, refMargin:25 },
];

const HK_ISO_DRAFT_900X1800_HIGH_T_ROWS = [
  { name:'아이소핑크 70T',  unit:220, spec:'70*900*1800',  sheetCost:15400,  sheetPrice:26000,  saleSize:'900*1800-3', saleCost:46200,  price:78000,  margin:31800,  fee:4680,  vat:7800,  shipping:'', netMargin:19320,  rate:25, refMargin:25 },
  { name:'아이소핑크 100T', unit:220, spec:'100*900*1800', sheetCost:22000,  sheetPrice:36667,  saleSize:'900*1800-3', saleCost:66000,  price:110000, margin:44000,  fee:6600,  vat:11000, shipping:'', netMargin:26400,  rate:24, refMargin:25 },
  { name:'아이소핑크 250T', unit:230, spec:'250*900*1800', sheetCost:57500,  sheetPrice:155000, saleSize:'900*1800-1', saleCost:57500,  price:155000, margin:97500,  fee:9300,  vat:15500, shipping:'', netMargin:72700,  rate:47, refMargin:45 },
  { name:'아이소핑크 500T', unit:230, spec:'500*900*1800', sheetCost:115000, sheetPrice:315000, saleSize:'900*1800-1', saleCost:115000, price:315000, margin:200000, fee:18900, vat:31500, shipping:'', netMargin:149600, rate:47, refMargin:45 },
];

const HK_ISO_DRAFT_600X900_HIGH_T_ROWS = [
  { name:'아이소핑크 100T', unit:220, spec:'100*900*1800', sheetCost:22000,  sheetPrice:93000,  saleSize:'600*860-1', saleCost:7333,  price:31000,  margin:23667, fee:1860, vat:3100,  shipping:5500,  netMargin:13207, rate:43, refMargin:40 },
  { name:'아이소핑크 250T', unit:230, spec:'250*900*1800', sheetCost:57500,  sheetPrice:120000, saleSize:'600*430-1', saleCost:9583,  price:40000,  margin:30417, fee:2400, vat:4000,  shipping:5500,  netMargin:18517, rate:46, refMargin:45 },
  { name:'아이소핑크 250T', unit:230, spec:'250*900*1800', sheetCost:57500,  sheetPrice:210000, saleSize:'600*860-1', saleCost:19167, price:70000,  margin:50833, fee:4200, vat:7000,  shipping:9300,  netMargin:30333, rate:43, refMargin:45 },
  { name:'아이소핑크 500T', unit:230, spec:'500*900*1800', sheetCost:115000, sheetPrice:225000, saleSize:'600*430-1', saleCost:19167, price:75000,  margin:55833, fee:4500, vat:7500,  shipping:9300,  netMargin:34533, rate:46, refMargin:45 },
  { name:'아이소핑크 500T', unit:230, spec:'500*900*1800', sheetCost:115000, sheetPrice:405000, saleSize:'600*860-1', saleCost:38333, price:135000, margin:96667, fee:8100, vat:13500, shipping:17000, netMargin:58067, rate:43, refMargin:45 },
];

const HK_ISO_DRAFT_COUPANG_WINNER_ROWS = [
  { name:'아이소핑크 10T',  unit:250, spec:'10*900*1800',  sheetCost:2500,   sheetPrice:'',     saleSize:'600*900-10',  saleCost:8333,  price:24400,  margin:16067, fee:1464, vat:2440,  shipping:'',    netMargin:12163, rate:50, refMargin:50 },
  { name:'아이소핑크 10T',  unit:250, spec:'10*900*1800',  sheetCost:2500,   sheetPrice:'',     saleSize:'600*900-20',  saleCost:16667, price:48700,  margin:32033, fee:2922, vat:4870,  shipping:'',    netMargin:24241, rate:50, refMargin:50 },
  { name:'아이소핑크 20T',  unit:250, spec:'20*900*1800',  sheetCost:5000,   sheetPrice:'',     saleSize:'600*900-5',   saleCost:8333,  price:23500,  margin:15167, fee:1410, vat:2350,  shipping:'',    netMargin:11407, rate:49, refMargin:50 },
  { name:'아이소핑크 20T',  unit:250, spec:'20*900*1800',  sheetCost:5000,   sheetPrice:'',     saleSize:'600*900-10',  saleCost:16667, price:47000,  margin:30333, fee:2820, vat:4700,  shipping:'',    netMargin:22813, rate:49, refMargin:50 },
  { name:'아이소핑크 30T',  unit:225, spec:'30*900*1800',  sheetCost:6750,   sheetPrice:'',     saleSize:'600*900-1',   saleCost:2250,  price:6900,   margin:4650,  fee:414,  vat:690,   shipping:'',    netMargin:3546,  rate:51, refMargin:50 },
  { name:'아이소핑크 30T',  unit:225, spec:'30*900*1800',  sheetCost:6750,   sheetPrice:'',     saleSize:'600*900-3',   saleCost:6750,  price:20700,  margin:13950, fee:1242, vat:2070,  shipping:'',    netMargin:10638, rate:51, refMargin:50 },
  { name:'아이소핑크 30T',  unit:225, spec:'30*900*1800',  sheetCost:6750,   sheetPrice:'',     saleSize:'600*900-5',   saleCost:11250, price:34500,  margin:23250, fee:2070, vat:3450,  shipping:'',    netMargin:17730, rate:51, refMargin:50 },
  { name:'아이소핑크 30T',  unit:225, spec:'30*900*1800',  sheetCost:6750,   sheetPrice:'',     saleSize:'600*900-10',  saleCost:22500, price:69000,  margin:46500, fee:4140, vat:6900,  shipping:'',    netMargin:35460, rate:51, refMargin:50 },
  { name:'아이소핑크 40T',  unit:225, spec:'40*900*1800',  sheetCost:9000,   sheetPrice:'',     saleSize:'600*900-2',   saleCost:6000,  price:18400,  margin:12400, fee:1104, vat:1840,  shipping:'',    netMargin:9456,  rate:51, refMargin:50 },
  { name:'아이소핑크 40T',  unit:225, spec:'40*900*1800',  sheetCost:9000,   sheetPrice:'',     saleSize:'600*900-5',   saleCost:15000, price:46000,  margin:31000, fee:2760, vat:4600,  shipping:'',    netMargin:23640, rate:51, refMargin:50 },
  { name:'아이소핑크 50T',  unit:220, spec:'50*900*1800',  sheetCost:11000,  sheetPrice:'',     saleSize:'600*900-1',   saleCost:3667,  price:11400,  margin:7733,  fee:684,  vat:1140,  shipping:'',    netMargin:5909,  rate:52, refMargin:50 },
  { name:'아이소핑크 50T',  unit:220, spec:'50*900*1800',  sheetCost:11000,  sheetPrice:'',     saleSize:'600*900-2',   saleCost:7333,  price:20800,  margin:13467, fee:1248, vat:2080,  shipping:'',    netMargin:10139, rate:49, refMargin:50 },
  { name:'아이소핑크 70T',  unit:220, spec:'70*900*1800',  sheetCost:15400,  sheetPrice:'',     saleSize:'600*900-1',   saleCost:5133,  price:16300,  margin:11167, fee:978,  vat:1630,  shipping:'',    netMargin:8559,  rate:53, refMargin:50 },
  { name:'아이소핑크 100T', unit:220, spec:'100*900*1800', sheetCost:22000,  sheetPrice:'',     saleSize:'600*900-1',   saleCost:7333,  price:23100,  margin:15767, fee:1386, vat:2310,  shipping:'',    netMargin:12071, rate:52, refMargin:50 },
  { name:'아이소핑크 100T', unit:220, spec:'100*900*1800', sheetCost:22000,  sheetPrice:'',     saleSize:'600*860-1',   saleCost:7333,  price:31000,  margin:23667, fee:1860, vat:3100,  shipping:5500,  netMargin:13207, rate:43, refMargin:43 },
  { name:'아이소핑크 250T', unit:230, spec:'250*900*1800', sheetCost:57500,  sheetPrice:210000, saleSize:'600*860-1',   saleCost:19167, price:70000,  margin:50833, fee:4200, vat:7000,  shipping:9300,  netMargin:30333, rate:43, refMargin:43 },
  { name:'아이소핑크 250T', unit:230, spec:'250*900*1800', sheetCost:57500,  sheetPrice:120000, saleSize:'600*430-1',   saleCost:9583,  price:40000,  margin:30417, fee:2400, vat:4000,  shipping:5500,  netMargin:18517, rate:46, refMargin:47 },
  { name:'아이소핑크 500T', unit:230, spec:'500*900*1800', sheetCost:115000, sheetPrice:405000, saleSize:'600*860-1',   saleCost:38333, price:135000, margin:96667, fee:8100, vat:13500, shipping:17000, netMargin:58067, rate:43, refMargin:43 },
  { name:'아이소핑크 500T', unit:230, spec:'500*900*1800', sheetCost:115000, sheetPrice:225000, saleSize:'600*430-1',   saleCost:19167, price:75000,  margin:55833, fee:4500, vat:7500,  shipping:9300,  netMargin:34533, rate:46, refMargin:47 },
  { name:'아이소핑크 10T',  unit:250, spec:'10*900*1800',  sheetCost:2500,   sheetPrice:4150,   saleSize:'900*1800-10', saleCost:25000, price:41500,  margin:16500, fee:2490, vat:4150,  shipping:'',    netMargin:9860,  rate:24, refMargin:23 },
  { name:'아이소핑크 20T',  unit:250, spec:'20*900*1800',  sheetCost:5000,   sheetPrice:8200,   saleSize:'900*1800-5',  saleCost:25000, price:41000,  margin:16000, fee:2460, vat:4100,  shipping:'',    netMargin:9440,  rate:23, refMargin:24 },
  { name:'아이소핑크 30T',  unit:225, spec:'30*900*1800',  sheetCost:6750,   sheetPrice:13500,  saleSize:'900*1800-3',  saleCost:20250, price:40500,  margin:20250, fee:2430, vat:4050,  shipping:'',    netMargin:13770, rate:34, refMargin:33 },
  { name:'아이소핑크 40T',  unit:225, spec:'40*900*1800',  sheetCost:9000,   sheetPrice:18000,  saleSize:'900*1800-2',  saleCost:18000, price:36000,  margin:18000, fee:2160, vat:3600,  shipping:'',    netMargin:12240, rate:34, refMargin:32 },
  { name:'아이소핑크 50T',  unit:220, spec:'50*900*1800',  sheetCost:11000,  sheetPrice:20000,  saleSize:'900*1800-2',  saleCost:22000, price:40000,  margin:18000, fee:2400, vat:4000,  shipping:'',    netMargin:11600, rate:29, refMargin:29 },
  { name:'아이소핑크 70T',  unit:220, spec:'70*900*1800',  sheetCost:15400,  sheetPrice:33000,  saleSize:'900*1800-1',  saleCost:15400, price:33000,  margin:17600, fee:1980, vat:3300,  shipping:'',    netMargin:12320, rate:37, refMargin:36 },
  { name:'아이소핑크 100T', unit:220, spec:'100*900*1800', sheetCost:22000,  sheetPrice:39000,  saleSize:'900*1800-1',  saleCost:22000, price:39000,  margin:17000, fee:2340, vat:3900,  shipping:'',    netMargin:10760, rate:28, refMargin:28 },
];

const HK_ISO_DRAFT_ADHESIVE_900X1800_SINGLE_ROWS = [
  { name:'아이소핑크 10T', unit:250, spec:'10*900*1800', sheetCost:3850,  sheetPrice:9000,  saleSize:'900*1800-1', saleCost:3850,  price:9000,  margin:5150,  fee:540,  vat:900,  shipping:'', netMargin:3710,  rate:41, refMargin:45 },
  { name:'아이소핑크 20T', unit:250, spec:'20*900*1800', sheetCost:6350,  sheetPrice:16500, saleSize:'900*1800-1', saleCost:6350,  price:16500, margin:10150, fee:990,  vat:1650, shipping:'', netMargin:7510,  rate:46, refMargin:45 },
  { name:'아이소핑크 30T', unit:225, spec:'30*900*1800', sheetCost:8100,  sheetPrice:20500, saleSize:'900*1800-1', saleCost:8100,  price:20500, margin:12400, fee:1230, vat:2050, shipping:'', netMargin:9120,  rate:44, refMargin:45 },
  { name:'아이소핑크 40T', unit:225, spec:'40*900*1800', sheetCost:10350, sheetPrice:25500, saleSize:'900*1800-1', saleCost:10350, price:25500, margin:15150, fee:1530, vat:2550, shipping:'', netMargin:11070, rate:43, refMargin:45 },
  { name:'아이소핑크 50T', unit:220, spec:'50*900*1800', sheetCost:12350, sheetPrice:32500, saleSize:'900*1800-1', saleCost:12350, price:32500, margin:20150, fee:1950, vat:3250, shipping:'', netMargin:14950, rate:46, refMargin:45 },
];

const HK_ISO_DRAFT_ADHESIVE_900X1800_BUNDLE_ROWS = [
  { name:'아이소핑크 10T', unit:250, spec:'10*900*1800', sheetCost:3850,  sheetPrice:9050,  saleSize:'900*1800-10', saleCost:38500, price:90500, margin:52000, fee:5430, vat:9050, shipping:'', netMargin:37520, rate:41, refMargin:45 },
  { name:'아이소핑크 20T', unit:250, spec:'20*900*1800', sheetCost:6350,  sheetPrice:15100, saleSize:'900*1800-5',  saleCost:31750, price:75500, margin:43750, fee:4530, vat:7550, shipping:'', netMargin:31670, rate:42, refMargin:45 },
  { name:'아이소핑크 30T', unit:225, spec:'30*900*1800', sheetCost:8100,  sheetPrice:21833, saleSize:'900*1800-3',  saleCost:24300, price:65500, margin:41200, fee:3930, vat:6550, shipping:'', netMargin:30720, rate:47, refMargin:45 },
  { name:'아이소핑크 40T', unit:225, spec:'40*900*1800', sheetCost:10350, sheetPrice:26750, saleSize:'900*1800-2',  saleCost:20700, price:53500, margin:32800, fee:3210, vat:5350, shipping:'', netMargin:24240, rate:45, refMargin:45 },
  { name:'아이소핑크 50T', unit:220, spec:'50*900*1800', sheetCost:12350, sheetPrice:33500, saleSize:'900*1800-2',  saleCost:24700, price:67000, margin:42300, fee:4020, vat:6700, shipping:'', netMargin:31580, rate:47, refMargin:45 },
];

const HK_ISO_DRAFT_BASE_COSTS = {
  thin: 260,  // 10T~20T
  mid: 198,   // 30T~180T
  thick: 201, // 185T 이상
};
const HK_ISO_DRAFT_EXTRA_MARGINS = {
  10:-10, 20:-10, 30:27, 40:27, 50:22,
  70:22, 100:22, 250:29, 500:29,
};
// DB에 저장된 값을 불러올 때 js/pricing-hankook-db.js가 바꿀 수 있어 let이다.
let HK_ISO_DRAFT_ADHESIVE_ADDON = 1350;
// 단가 기준 년월(YYYY-MM) — 에너가드 단가표의 "단가 기준 년월"과 같은 역할. 저장할 때
// 이 값이 이력 이름이 되고, 같은 년월로 다시 저장하면 그 년월 이력을 덮어쓴다.
let HK_ISO_DRAFT_BASE_MONTH = '';

const HK_ISO_CONNECTED_DRAFTS = {
  iso_600x900: {
    rows: HK_ISO_DRAFT_600X900_ROWS,
    priceHeader: '원장<br>판매가',
    saleGroupLabel: '600*900',
    fixedCostAddon: 0,
  },
  adhesive_600x900_a: {
    rows: HK_ISO_DRAFT_ADHESIVE_600X900_ROWS,
    priceHeader: '판매가',
    saleGroupLabel: '600*900',
    fixedCostAddon: HK_ISO_DRAFT_ADHESIVE_ADDON,
  },
  iso_900x1800_bundle: {
    rows: HK_ISO_DRAFT_900X1800_BUNDLE_ROWS,
    priceHeader: '판매가',
    saleGroupLabel: '900*1800',
    fixedCostAddon: 0,
  },
  iso_900x1800_single: {
    rows: HK_ISO_DRAFT_900X1800_SINGLE_ROWS,
    priceHeader: '판매가',
    saleGroupLabel: '900*1800',
    fixedCostAddon: 0,
  },
  iso_900x1800_high_t: {
    rows: HK_ISO_DRAFT_900X1800_HIGH_T_ROWS,
    priceHeader: '판매가',
    saleGroupLabel: '900*1800',
    fixedCostAddon: 0,
  },
  adhesive_900x1800_single: {
    rows: HK_ISO_DRAFT_ADHESIVE_900X1800_SINGLE_ROWS,
    priceHeader: '판매가',
    saleGroupLabel: '900*1800',
    fixedCostAddon: HK_ISO_DRAFT_ADHESIVE_ADDON,
  },
  adhesive_900x1800_bundle: {
    rows: HK_ISO_DRAFT_ADHESIVE_900X1800_BUNDLE_ROWS,
    priceHeader: '판매가',
    saleGroupLabel: '900*1800',
    fixedCostAddon: HK_ISO_DRAFT_ADHESIVE_ADDON,
  },
  iso_600x900_high_t: {
    rows: HK_ISO_DRAFT_600X900_HIGH_T_ROWS,
    priceHeader: '판매가',
    saleGroupLabel: '600*900',
    fixedCostAddon: 0,
  },
  iso_coupang_winner: {
    rows: HK_ISO_DRAFT_COUPANG_WINNER_ROWS,
    priceHeader: '원장<br>판매가',
    saleGroupLabel: '쿠팡 위너',
    fixedCostAddon: 0,
  },
};

let _activeHkTab = HK_CATEGORIES[0].id;
window._activeHkTab = _activeHkTab;

/* ═══════════════════════════════════════
   탭바 + 빈 콘텐츠 초기 렌더
═══════════════════════════════════════ */
function initHkPricingTabs() {
  const tabsBar  = document.getElementById('hkPricingTabsBar');
  const bodyWrap = document.getElementById('hkPricingBodyWrap');
  if (!tabsBar || !bodyWrap) return;

  // 두 줄로 나눈 이유: 윗줄은 제품 카테고리별 "단가 정리", 아랫줄은 그 단가를 몰(채널)
  // 단위로 적용·검증하는 화면이라 성격이 다르다. 줄마다 이름표와 색(인디고/청록)을 달리해서
  // 구분한다. 선택 표시가 두 줄에서 동시에 켜지지 않는 규칙은 그대로다(setHkPricingTab/setHkChannel).
  tabsBar.innerHTML = `
    <div class="hk-tab-group hk-tab-group-category">
      <div class="hk-tab-group-label"><i class="fa-solid fa-table-list"></i><span><strong>제품별 단가</strong><small>카테고리</small></span></div>
      <div class="pricing-tabs" id="hkCategoryTabs">${HK_CATEGORIES.map((c, i) =>
        `<button class="pricing-tab${i === 0 ? ' active' : ''}" onclick="setHkPricingTab('${c.id}',this)">${c.label}</button>`
      ).join('')}</div>
    </div>
    <div class="hk-tab-group hk-tab-group-channel">
      <div class="hk-tab-group-label"><i class="fa-solid fa-store"></i><span><strong>몰별 적용</strong><small>판매 채널</small></span></div>
      <div class="pricing-tabs" id="hkChannelTabs">${HK_CHANNELS.map(c =>
        `<button class="pricing-tab" onclick="setHkChannel('${c.id}',this)">${c.label}</button>`
      ).join('')}</div>
    </div>`;

  window._hkRenderBody();
}

/* 본문(카테고리 패널 + 채널 목록 영역)만 다시 그린다. 초기 렌더와, DB에서 불러온 값을
   화면에 반영할 때(js/pricing-hankook-db.js) 함께 쓴다. */
window._hkRenderBody = function() {
  const bodyWrap = document.getElementById('hkPricingBodyWrap');
  if (!bodyWrap) return;
  bodyWrap.innerHTML = HK_CATEGORIES.map((c, i) =>
    `<div id="pricing-tab-${c.id}" class="pricing-tab-pane${i === 0 ? ' active' : ''}">${renderHkCategoryPane(c.id)}</div>`
  ).join('') + '<div class="hk-channel-catalog-section" id="hkChannelListingSection" hidden></div>';

  _hkIsoDraftRefreshAllTooltips();
};
document.addEventListener('DOMContentLoaded', initHkPricingTabs);

/* ═══════════════════════════════════════
   탭 전환
═══════════════════════════════════════ */
window.setHkPricingTab = function(tabId, el) {
  _activeHkTab = tabId;
  window._activeHkTab = tabId;
  document.querySelectorAll('#hkCategoryTabs .pricing-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#hkPricingBodyWrap .pricing-tab-pane').forEach(p => p.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('pricing-tab-' + tabId)?.classList.add('active');
  // 카테고리 탭을 고르면 "카테고리 모드" — 기준단가(1·2단계)는 보이고
  // 채널의 3단계 실제 등록 상품 표는 숨긴다. 채널 탭 쪽은 선택 표시를 지워서
  // 지금 보고 있는 화면과 맞지 않는 버튼이 같이 눌려 보이지 않게 한다.
  document.querySelectorAll('#hkChannelTabs .pricing-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('hkIsoBaseDataSection')?.removeAttribute('hidden');
  const listingSection = document.getElementById('hkChannelListingSection');
  if (listingSection) listingSection.hidden = true;
};

/* 채널 선택 — 고르면 "채널 모드"로 바뀐다: 기준단가(1·2단계)는 숨기고
   그 채널의 3단계 실제 등록 상품 표만 보여준다. */
window.setHkChannel = function(channelId, el) {
  _activeHkChannel = channelId;
  window._activeHkChannel = channelId;
  _activeHkChannelCategory = 'all';
  document.querySelectorAll('#hkChannelTabs .pricing-tab').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
  // 카테고리 탭 쪽 선택 표시도 지운다 — 지금은 채널 모드라 카테고리 탭 내용이
  // 안 보이는데 그 탭만 계속 눌려 보이면(파란 강조) 헷갈린다.
  document.querySelectorAll('#hkCategoryTabs .pricing-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#hkPricingBodyWrap .pricing-tab-pane').forEach(pane => pane.classList.remove('active'));
  const listingSection = document.getElementById('hkChannelListingSection');
  if (listingSection) listingSection.hidden = false;
  if (typeof window._hkRefreshChannelListing === 'function') window._hkRefreshChannelListing();
};

/* ═══════════════════════════════════════
   카테고리별 콘텐츠 — 실제 데이터 들어오면 이 분기를 채운다.
   아직 미입력 카테고리는 빈 상태를 반환.
═══════════════════════════════════════ */
function renderHkCategoryPane(tabId) {
  const cat = HK_CATEGORIES.find(c => c.id === tabId);
  if (!cat) return '';

  if (tabId === 'hk_isopink') return renderHkIsopinkPane();
  // 스티로폼(비드법)은 아이소핑크 표 엔진을 그대로 쓰고 데이터·화면은 js/pricing-hankook-bead.js가 맡는다.
  if (tabId === 'hk_bead' && typeof renderHkBeadPane === 'function') return renderHkBeadPane();
  // 부자재는 두께·규격 그룹이 없는 상품코드별 평면 표라 전용 파일에서 렌더한다.
  if (tabId === 'hk_sub' && typeof renderHkSubPane === 'function') return renderHkSubPane();
  // 열반사단열재는 두께·판매길이 구조가 아이소핑크·스티로폼과 달라(면적이 아니라 길이) 전용 파일에서 렌더한다.
  if (tabId === 'hk_reflective' && typeof renderHkReflectivePane === 'function') return renderHkReflectivePane();

  // 카테고리가 채워지면 여기에 전용 렌더 함수를 추가하면 됨 (renderHkIsopinkPane와 같은 패턴).

  return `
    <div class="pricing-coming-soon">
      <i class="fa-solid fa-file-excel"></i>
      <p>${cat.label} 원가표는 아직 입력 전입니다.</p>
    </div>`;
}

/* 한국단열 아이소핑크 단가표 공통 계산 */
function _hkIsoDraftNumber(value, suffix = '') {
  return value === '' || value == null ? '—' : Number(value).toLocaleString() + suffix;
}

function _hkIsoDraftParseNumber(value) {
  return parseFloat(String(value ?? '').replace(/,/g, '')) || 0;
}

function _hkIsoDraftDivisor(saleSize) {
  if (String(saleSize).startsWith('430*430')) return 8;
  if (String(saleSize).startsWith('600*430')) return 6;
  if (String(saleSize).startsWith('600*860')) return 3;
  if (String(saleSize).startsWith('600*900')) return 3;
  // 900*1800 원장을 반으로 자른 1200*900(스티로폼) — 정확히 1.5장분이라 1.5로 나눈다.
  if (String(saleSize).startsWith('1200*900') || String(saleSize).startsWith('900*1200')) return 1.5;
  return 1;
}

function _hkIsoDraftSetTooltip(element, text) {
  if (!element) return;
  element.title = text;
  element.classList.add('hk-iso-calc-cell');
}

function _hkIsoDraftUpdateRowTooltip(row) {
  if (!row) return;
  const thickness = _hkIsoDraftParseNumber(row.dataset.thickness);
  const marginPerMm = _hkIsoDraftParseNumber(row.dataset.marginPerMm);
  const fixedCostAddon = _hkIsoDraftParseNumber(row.dataset.fixedCostAddon);
  const sheetCost = _hkIsoDraftParseNumber(row.dataset.sheetCost);
  const saleCost = _hkIsoDraftParseNumber(row.dataset.saleCost);
  const rawSaleCost = row.dataset.saleCostRaw !== undefined
    ? _hkIsoDraftParseNumber(row.dataset.saleCostRaw)
    : saleCost;
  const shipping = _hkIsoDraftParseNumber(row.dataset.shipping);
  const referenceMargin = _hkIsoDraftParseNumber(row.dataset.referenceMargin);
  const saleSize = row.dataset.saleSize || '';
  const divisor = _hkIsoDraftDivisor(saleSize);
  const quantity = Number(saleSize.split('-').pop()) || 1;
  const finalPriceInput = row.querySelector('.hk-iso-final-price-input');
  const finalPrice = _hkIsoDraftParseNumber(finalPriceInput?.value);
  const rawMargin = finalPrice - rawSaleCost;
  const margin = Math.round(rawMargin);
  const fee = Math.round(finalPrice * 0.06);
  const vat = Math.round(finalPrice * 0.10);
  const rawNetMargin = rawMargin - fee - vat - shipping;
  const netMargin = Math.round(rawNetMargin);
  const rate = finalPrice > 0 ? Math.round(rawNetMargin / finalPrice * 100) : 0;
  const expectedPrice = _hkIsoDraftExpectedPrice(rawSaleCost, referenceMargin, shipping);
  const hasFractionalSaleCost = rawSaleCost !== saleCost;
  const saleCostFormulaResult = hasFractionalSaleCost
    ? `${_hkIsoDraftNumber(rawSaleCost)}원 (표시는 ${_hkIsoDraftNumber(saleCost)}원으로 반올림)`
    : `${_hkIsoDraftNumber(saleCost)}원`;

  const addonText = fixedCostAddon ? ` + 접착 가공비 ${fixedCostAddon.toLocaleString()}원` : '';
  const isBead = row.dataset.line === 'bead';
  _hkIsoDraftSetTooltip(row.querySelector('.hk-iso-draft-margin-per-mm'), isBead
    ? `적용 원가: ${marginPerMm.toLocaleString()}원/mm\n기본 원가(원/㎡·mm) × 원장 면적 + 추가마진(공통 원가 설정 카드)이고 두께와 관계없이 같습니다.`
    : `적용 원가: ${marginPerMm.toLocaleString()}원/mm\n구간 기본 원가 ${_hkIsoDraftBaseCost(thickness).toLocaleString()}원/mm + 두께별 추가마진으로 계산됩니다.`);
  _hkIsoDraftSetTooltip(row.querySelector('.hk-iso-draft-sheet-cost'),
    `원가 = 적용 원가 ${marginPerMm.toLocaleString()}원/mm × ${thickness}T${addonText}\n= ${sheetCost.toLocaleString()}원`);
  _hkIsoDraftSetTooltip(row.children[4],
    `원본 엑셀에 기록된 판매가입니다.\n자동 계산값이 아니라 기존 기준값을 그대로 표시합니다.`);
  _hkIsoDraftSetTooltip(row.children[5],
    `판매사이즈 ${saleSize}\n원장 ${divisor}분할 × ${quantity}장 묶음`);
  _hkIsoDraftSetTooltip(row.querySelector('.hk-iso-draft-sale-cost'),
    `판매원가 = 원가 ${sheetCost.toLocaleString()}원 ÷ ${divisor} × ${quantity}장\n= ${saleCostFormulaResult}`);
  _hkIsoDraftSetTooltip(row.querySelector('.hk-iso-draft-expected-price'),
    `예상판매가 = 참고마진 ${referenceMargin}%를 달성하는 최소 가격\n판매원가 ${saleCostFormulaResult}에서 수수료 6%, 부가세 10%${shipping ? `, 배송비 ${shipping.toLocaleString()}원` : ''}를 차감한 순수마진율 기준\n100원 단위 올림 = ${_hkIsoDraftNumber(expectedPrice)}`);
  _hkIsoDraftSetTooltip(row.querySelector('.hk-iso-draft-price'),
    `판매가: ${finalPrice.toLocaleString()}원\n예상판매가를 참고해 직접 정한 값입니다. 금액이나 연필 버튼을 누르면 이 행만 수정할 수 있습니다.`);
  if (finalPriceInput) finalPriceInput.title = row.querySelector('.hk-iso-draft-price').title;
  _hkIsoDraftSetTooltip(row.querySelector('.hk-iso-draft-margin'),
    `마진 = 최종 판매가 ${finalPrice.toLocaleString()}원 - 판매원가 ${saleCostFormulaResult}\n= ${_hkIsoDraftNumber(rawMargin)}원${rawMargin !== margin ? ` → 반올림 ${margin.toLocaleString()}원` : ''}`);
  _hkIsoDraftSetTooltip(row.querySelector('.hk-iso-draft-fee'),
    `판매수수료 = 최종 판매가 ${finalPrice.toLocaleString()}원 × 6%\n= ${fee.toLocaleString()}원`);
  _hkIsoDraftSetTooltip(row.querySelector('.hk-iso-draft-vat'),
    `부가세 = 최종 판매가 ${finalPrice.toLocaleString()}원 × 10%\n= ${vat.toLocaleString()}원`);
  const refShipping = _hkIsoDraftParseNumber(row.dataset.refShipping);
  _hkIsoDraftSetTooltip(row.querySelector('.hk-iso-draft-shipping'), isBead
    ? (refShipping ? `참고용 배송비 ${refShipping.toLocaleString()}원\n원본 엑셀과 같이 장당마진에서는 빼지 않습니다.` : '표시할 배송비가 없습니다.')
    : (shipping ? `판매 시 차감하는 배송비\n= ${shipping.toLocaleString()}원` : '차감할 배송비가 없습니다.'));
  _hkIsoDraftSetTooltip(row.querySelector('.hk-iso-draft-net-margin'),
    `장당마진 = 마진 ${_hkIsoDraftNumber(rawMargin)}원 - 수수료 ${fee.toLocaleString()}원 - 부가세 ${vat.toLocaleString()}원${shipping ? ` - 배송비 ${shipping.toLocaleString()}원` : ''}\n= ${_hkIsoDraftNumber(rawNetMargin)}원${rawNetMargin !== netMargin ? ` → 반올림 ${netMargin.toLocaleString()}원` : ''}`);
  _hkIsoDraftSetTooltip(row.querySelector('.hk-iso-draft-rate'),
    `순수마진율 = 장당마진 ${netMargin.toLocaleString()}원 ÷ 최종 판매가 ${finalPrice.toLocaleString()}원 × 100\n= ${rate}%`);
  _hkIsoDraftSetTooltip(row.querySelector('.hk-iso-draft-ref-margin'),
    `참고마진 ${referenceMargin}%\n예상판매가가 달성해야 하는 목표 순수마진율입니다.`);
}

function _hkIsoDraftRefreshAllTooltips() {
  document.querySelectorAll('.hk-iso-draft-table tbody tr').forEach(_hkIsoDraftUpdateRowTooltip);
}

function _hkIsoDraftExpectedPrice(saleCost, referenceMargin, shipping = 0) {
  if (!saleCost || referenceMargin == null || isNaN(referenceMargin)) return null;
  let price = Math.ceil(Number(saleCost) / 100) * 100;
  for (let i = 0; i < 5000; i++) {
    const margin = price - Number(saleCost);
    const fee = Math.round(price * 0.06);
    const vat = Math.round(price * 0.10);
    const netMargin = margin - fee - vat - Number(shipping || 0);
    const rate = price > 0 ? netMargin / price * 100 : 0;
    if (rate >= Number(referenceMargin)) return price;
    price += 100;
  }
  return price;
}

function _hkIsoDraftBaseBand(thickness) {
  if (Number(thickness) <= 20) return 'thin';
  if (Number(thickness) <= 180) return 'mid';
  return 'thick';
}

function _hkIsoDraftBaseCost(thickness) {
  const band = _hkIsoDraftBaseBand(thickness);
  const input = document.getElementById(`hkIsoDraftBaseCost-${band}`);
  return input ? _hkIsoDraftParseNumber(input.value) : HK_ISO_DRAFT_BASE_COSTS[band];
}

function _hkIsoDraftMarginCard() {
  const rangeRows = [
    { band:'thin', label:'10T ~ 20T' },
    { band:'mid', label:'30T ~ 180T' },
    { band:'thick', label:'185T 이상' },
  ].map(({ band, label }) => `<tr>
    <td><span class="pricing-range-label">${label}</span></td>
    <td><input type="text" inputmode="numeric" id="hkIsoDraftBaseCost-${band}" class="pricing-input-field hk-iso-base-cost-input" value="${HK_ISO_DRAFT_BASE_COSTS[band]}" oninput="updateHkIsoDraftBaseCost('${band}',this)" onblur="formatHkIsoDraftPrice(this)"></td>
  </tr>`).join('');

  return `<div class="card pricing-cost-card hk-iso-draft-margin-card" data-draft-tab="shared">
    <div class="pricing-section-title">공통 원가·배송 설정 <span class="pricing-section-sub">— 두께구간 기본 원가 + 두께별 추가마진 · 배송 정책</span></div>
    <div class="pricing-cost-footer hk-iso-shared-cost-controls">
      <div class="pricing-base-month-wrap">
        <label class="pricing-base-month-label" for="hkIsoBaseMonth">단가 기준 년월</label>
        <input type="month" id="hkIsoBaseMonth" class="pricing-input-field pricing-month-field" value="${HK_ISO_DRAFT_BASE_MONTH}" oninput="hkIsoSetBaseMonth(this.value)">
      </div>
      <button type="button" class="pricing-margin-edit-btn" onclick="openHkIsoDraftMarginModal()">
        <i class="fa-solid fa-sliders"></i> 마진 편집
      </button>
      <button type="button" class="pricing-margin-edit-btn" onclick="openHkIsoAdhesiveModal()" title="접착식 원장 한 장마다 원가에 더하는 가공비를 수정합니다.">
        <i class="fa-solid fa-layer-group"></i> 접착 가공비
      </button>
      <button type="button" class="pricing-margin-edit-btn" onclick="toggleHkIsoShippingSection()" title="규격 그룹별 배송비·쿠폰·무료배송 정책을 수정합니다(일반·접착식·쿠팡 위너 전체).">
        <i class="fa-solid fa-truck-fast"></i> 배송 세부설정
      </button>
    </div>
    <div class="pricing-cost-card-inner">
      <div class="pricing-input-table-wrap">
        <table class="pricing-cost-unified-table hk-iso-base-cost-table">
          <thead><tr><th>두께 구간</th><th>기본 원가<br><span class="pricing-th-tiny">원/mm</span></th></tr></thead>
          <tbody>${rangeRows}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}

/* 실제 스마트스토어 등록 상품코드 — 규격·두께·수량으로 결정되는 값이라 여기서
   기계적으로 만들어낼 수 있다(2026-09-16, 사용자가 준 코드 목록과 대조 완료).
   패턴: (일반)Iso_ / (접착식)IsoA_ + 규격(430_430 등) + 두께 + 판매수량.
   1단계 기준단가표에는 안 보여주고(2026-09-16, 사용자 지시로 제거) 2단계
   배송비/실판매가 표에서만 쓴다. 쿠팡 위너는 실제로 IsoC_ 접두어를 쓰는 걸
   원본 엑셀에서 확인했다 — 2단계 쿠팡 위너 블록을 만들 때 반영할 것. */
function _hkIsoDraftProductCode(saleSize, thickness, isAdhesive, codePrefix) {
  const [sizePart, qtyPart] = String(saleSize).split('-');
  const sizeCode = sizePart.replace(/\*/g, '_');
  const prefix = codePrefix || (isAdhesive ? 'IsoA' : 'Iso');
  return `${prefix}_${sizeCode}_${thickness}_${qtyPart}`;
}

/* "무료배송 + 10% 네고"(schema 'free90', 스티로폼 쿠팡전용 900*1800 — 사용자 엑셀 2026-09-21) 계산.
   배송비 플러스 금액 = 판매가 + 실제배송비, 그 90%가 원장판매할인금액, 그 100원 미만이 단수정리,
   실판매가 = 90% 금액 − 단수정리(= 100원 단위 버림). 엑셀 13행 전부 이 식과 일치를 확인했다.
   정수만 쓴다(90%를 ×9÷10으로) — 소수 오차로 1원 어긋나는 걸 막는다. */
function _hkIsoFree90Parts(basePrice, actualShipping) {
  const plus = Math.round(Number(basePrice || 0) + Number(actualShipping || 0));
  const discounted = Math.round(plus * 9 / 10);
  const finalPrice = Math.floor(discounted / 100) * 100;
  return { plus, discounted, rounding: discounted - finalPrice, finalPrice };
}

/* 블록 행 하나의 실판매가 — schema별 공식이 다르다: per5(600x900류)는 항상 플러스 금액을 더하고,
   per1Coupon(900x1800류)은 무료배송 상품만 더하며, free90은 위의 10% 네고 식이다. */
function _hkIsoBlockRowFinalPrice(block, ship, basePrice) {
  if (block.schema === 'free90') return _hkIsoFree90Parts(basePrice, ship.actualShipping).finalPrice;
  const plusAmount = ship.plusAmount ?? 0;
  const applyPlus = block.schema === 'per1Coupon' ? !!block.isFreeShipping : true;
  return basePrice + (applyPlus ? plusAmount : 0);
}

/* 상품코드 칸 — 같은 옵션이 다른 코드로도 등록돼 있으면(js/pricing-hankook-bead.js의 별칭) 아래에 작게 함께 보여준다. */
function _hkIsoCodeCellInner(code) {
  const aliases = typeof window.hkBeadCodeAliasesFor === 'function' ? window.hkBeadCodeAliasesFor(code) : [];
  return aliases.length ? `${code}<small class="hk-iso-code-alias">= ${aliases.join(' · ')}</small>` : code;
}

/* 1단계 행에 대응하는 배송 정책을 상품코드 기준의 한 개 요약으로 만든다.
   기존 2단계의 계산 규칙은 그대로 유지하고 화면만 기준가격 표 안으로 합친다. */
function _hkIsoUnifiedShippingInfo(tabId, rowIndex, row, thickness, basePrice) {
  const block = HK_ISO_SHIPPING_BLOCKS.find(item => item.sourceAccordion === tabId);
  if (!block) {
    // 2단계 배송 블록이 아직 없는 그룹(스티로폼 등) — 코드는 그룹의 접두어(St/StA/Neo)로 만든다.
    const fallbackCode = _hkIsoDraftProductCode(row.saleSize, thickness, false, HK_ISO_CONNECTED_DRAFTS[tabId]?.codePrefix);
    return { code:fallbackCode, mode:'미설정', policy:'배송 설정 없음', adjustment:0, applyAdjustment:false, targetPrice:basePrice };
  }

  const ship = block.rows[rowIndex] || {};
  const code = ship.codeOverride || _hkIsoDraftProductCode(row.saleSize, thickness, block.isAdhesive, block.codePrefix);
  const adjustment = Number(ship.plusAmount || 0);
  if (block.schema === 'free90') {
    const parts = _hkIsoFree90Parts(basePrice, ship.actualShipping);
    return {
      code,
      mode: '무료배송 · 10% 네고',
      policy: `실제배송비 ${_hkIsoDraftNumber(ship.actualShipping || 0)}원 → 90% 적용`,
      adjustment: parts.finalPrice - basePrice,
      applyAdjustment: true,
      targetPrice: parts.finalPrice,
    };
  }
  if (block.schema === 'per1Coupon') {
    const applyAdjustment = !!block.isFreeShipping;
    const policy = block.isFreeShipping
      ? `실제배송비 ${_hkIsoDraftNumber(ship.actualShipping || 0)}원`
      : `별도 ${_hkIsoDraftNumber(ship.perUnitShipping || 0)}원 · ${ship.actualShippingText || '기준 미정'}`;
    return {
      code,
      mode: block.isFreeShipping ? '무료배송' : '유료배송',
      policy,
      adjustment,
      applyAdjustment,
      targetPrice: basePrice + (applyAdjustment ? adjustment : 0),
    };
  }

  const hasBase = ship.baseShipping !== null;
  const baseShipping = hasBase ? Number(ship.baseShipping ?? block.baseShipping5 ?? 0) : null;
  const actualShipping = Number(ship.actualShipping5 || 0);
  const isIncluded = baseShipping === 0 || !hasBase;
  return {
    code,
    mode: isIncluded ? '배송비 포함' : '배송 보정',
    policy: hasBase
      ? `${_hkIsoDraftNumber(baseShipping)} → ${_hkIsoDraftNumber(actualShipping)}원`
      : `실제배송비 ${_hkIsoDraftNumber(actualShipping)}원`,
    adjustment,
    applyAdjustment: true,
    targetPrice: basePrice + adjustment,
  };
}

function _hkIsoUnifiedShippingCells(info) {
  const adjustmentText = info.applyAdjustment
    ? `${info.adjustment > 0 ? '+' : ''}${_hkIsoDraftNumber(info.adjustment)}`
    : `참고 ${info.adjustment > 0 ? '+' : ''}${_hkIsoDraftNumber(info.adjustment)}`;
  return `<td class="hk-iso-unified-shipping" title="${info.policy} — 눌러서 배송 세부설정 열기" onclick="openHkIsoShippingFor(this)">
      <span class="hk-iso-shipping-mode">${info.mode}</span>
      <span class="hk-iso-shipping-policy">${info.policy}</span>
    </td>
    <td class="hk-iso-unified-adjustment${info.applyAdjustment ? '' : ' is-reference'}">${adjustmentText}</td>
    <td class="hk-iso-unified-target">${_hkIsoDraftNumber(info.targetPrice)}</td>`;
}

/* draft(선택): 스티로폼처럼 아이소핑크와 계산 규칙이 조금 다른 그룹의 옵션.
   line:'bead' → 행에 data-line/data-unit-key를 달아 아이소핑크의 공통 원가 갱신이 건드리지 않게 하고,
   isAdhesive → 접착식 여부를 명시, deductShipping:false → 배송비 칸은 참고용(장당마진에서 안 뺌),
   hideUnifiedShipping → 2단계 배송 연결 전이라 배송 정책·가격 조정·현재 판매가 열을 숨김. */
function _hkIsoDraftSalesTable(tabId, sourceRows, priceHeader, saleGroupLabel, fixedCostAddon = 0, draft = null) {
  const isAdhesive = draft && draft.isAdhesive != null ? !!draft.isAdhesive : Number(fixedCostAddon) > 0;
  const lineAttr = draft && draft.line ? ` data-line="${draft.line}" data-unit-key="${draft.unitKey || ''}"` : '';
  const showUnified = !(draft && draft.hideUnifiedShipping);
  const deductShipping = !(draft && draft.deductShipping === false);
  const shippingHeader = (draft && draft.shippingHeader) || '배송비';
  let currentThickness = null;
  let currentSheetCost = null;
  let currentMarginPerMm = null;
  const rows = sourceRows.map((row, rowIndex) => {
    const thicknessMatch = row.name.match(/(\d+)T/);
    if (thicknessMatch) {
      currentThickness = Number(thicknessMatch[1]);
      currentMarginPerMm = Number(row.unit);
      currentSheetCost = currentMarginPerMm * currentThickness + Number(fixedCostAddon);
    }
    const sizeGroup = row.saleSize.split('-')[0].replaceAll('*', 'x');
    const divisor = _hkIsoDraftDivisor(row.saleSize);
    const quantity = Number(row.saleSize.split('-').pop()) || 1;
    const rawSaleCost = currentSheetCost / divisor * quantity;
    const saleCost = Math.round(rawSaleCost);
    const calcShipping = deductShipping ? Number(row.shipping || 0) : 0;
    const expectedPrice = _hkIsoDraftExpectedPrice(rawSaleCost, row.refMargin, calcShipping);
    const shippingInfo = _hkIsoUnifiedShippingInfo(tabId, rowIndex, row, currentThickness, Number(row.price));
    return `<tr data-draft-tab="${tabId}" data-row-index="${rowIndex}" data-product-code="${shippingInfo.code}" data-thickness="${currentThickness}" data-size-group="${sizeGroup}" data-sale-cost="${saleCost}" data-sale-cost-raw="${rawSaleCost}" data-sheet-cost="${currentSheetCost}" data-fixed-cost-addon="${fixedCostAddon}" data-margin-per-mm="${currentMarginPerMm}" data-reference-margin="${row.refMargin}" data-sale-size="${row.saleSize}" data-shipping="${calcShipping}" data-ref-shipping="${row.shipping || 0}" data-shipping-adjustment="${shippingInfo.adjustment}" data-shipping-apply="${shippingInfo.applyAdjustment ? 1 : 0}" data-is-adhesive="${isAdhesive ? 1 : 0}"${row.sheetFollow ? ' data-sheet-follow="1"' : ''}${lineAttr}>
    <td class="hk-iso-draft-name">${row.name || '　'}</td>
    <td class="hk-iso-draft-margin-per-mm">${_hkIsoDraftNumber(row.unit)}</td>
    <td>${row.spec || '—'}</td>
    <td class="hk-iso-draft-sheet-cost">${_hkIsoDraftNumber(row.sheetCost)}</td>
    <td class="hk-iso-sheet-price-muted">${_hkIsoDraftNumber(row.sheetPrice)}</td>
    <td class="hk-iso-unified-size"><span>${row.saleSize}</span><small>${shippingInfo.code}</small></td>
    <td class="hk-iso-draft-sale-cost">${_hkIsoDraftNumber(saleCost)}</td>
    <td class="hk-iso-draft-expected-price">${_hkIsoDraftNumber(expectedPrice)}</td>
    <td class="hk-iso-draft-price">
      <div class="hk-iso-price-edit-wrap">
        <input type="text" inputmode="numeric" class="pricing-input-field hk-iso-final-price-input" value="${Number(row.price).toLocaleString()}" data-original-price="${Number(row.price)}" onclick="beginHkIsoRowPriceEdit(this)" oninput="recalcHkIsoDraftRow(this);updateHkIsoPriceHistory(this)" onblur="finishHkIsoRowPriceEdit(this)" onkeydown="handleHkIsoRowPriceKey(event,this)" readonly>
        <button type="button" class="hk-iso-row-price-edit-btn" onclick="beginHkIsoRowPriceEdit(this)" title="이 판매가만 수정"><i class="fa-solid fa-pen"></i></button>
      </div>
      <div class="hk-iso-price-history" hidden>변경 전 <span>${Number(row.price).toLocaleString()}원</span><button type="button" onclick="revertHkIsoRowPrice(this)" title="변경 전 판매가로 되돌리기"><i class="fa-solid fa-rotate-left"></i></button></div>
    </td>
    ${showUnified ? _hkIsoUnifiedShippingCells(shippingInfo) : ''}
    <td class="hk-iso-draft-margin">${_hkIsoDraftNumber(row.margin)}</td>
    <td class="hk-iso-draft-fee">${_hkIsoDraftNumber(row.fee)}</td>
    <td class="hk-iso-draft-vat">${_hkIsoDraftNumber(row.vat)}</td>
    <td class="hk-iso-draft-shipping${deductShipping ? '' : ' hk-iso-ref-only'}">${row.shipping ? _hkIsoDraftNumber(row.shipping) : '—'}</td>
    <td class="hk-iso-draft-net-margin">${_hkIsoDraftNumber(row.netMargin)}</td>
    <td class="hk-iso-draft-rate">${_hkIsoDraftNumber(row.rate, '%')}</td>
    <td class="hk-iso-draft-ref-margin">${_hkIsoDraftNumber(row.refMargin, '%')}</td>
  </tr>`;
  }).join('');

  return `<div class="pricing-table-scroll">
    <table class="pricing-table hk-iso-draft-table">
      <thead>
        <tr>
          <th rowspan="2" class="hk-iso-head-base">KS정품</th>
          <th class="hk-iso-head-base">적용원가</th>
          <th rowspan="2" class="hk-iso-head-base">규 격</th>
          <th class="hk-iso-head-base">원가</th>
          <th rowspan="2" class="hk-iso-head-base hk-iso-sheet-price-muted-head">${priceHeader}</th>
          <th rowspan="2" class="hk-iso-head-size">판매사이즈</th>
          <th rowspan="2" class="hk-iso-head-base">판매원가</th>
          <th colspan="2" class="hk-iso-head-sale-price">${saleGroupLabel}</th>
          ${showUnified ? `<th rowspan="2" class="hk-iso-head-shipping">배송 정책</th>
          <th rowspan="2" class="hk-iso-head-shipping">가격 조정</th>
          <th rowspan="2" class="hk-iso-head-target">현재 판매가</th>` : ''}
          <th class="hk-iso-head-margin">마진</th>
          <th rowspan="2" class="hk-iso-head-margin">판매수수료 6%</th>
          <th rowspan="2" class="hk-iso-head-margin">부가세<br>10%</th>
          <th rowspan="2" class="hk-iso-head-margin">${shippingHeader}</th>
          <th rowspan="2" class="hk-iso-head-margin">장당마진</th>
          <th rowspan="2" class="hk-iso-head-rate">순수마진율</th>
          <th rowspan="2" class="hk-iso-ref-margin-head">참고마진</th>
        </tr>
        <tr class="hk-iso-draft-unit-row">
          <th class="hk-iso-head-base">원/mm</th><th class="hk-iso-head-base">원</th><th class="hk-iso-head-sale-price">예상판매가</th><th class="hk-iso-head-sale-price">판매가</th><th class="hk-iso-head-margin">원</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

/* 아코디언 섹션 하나(머리글 + 접었다 펴는 표 영역) */
function _hkIsoAccordionSectionHtml(acc, isOpen) {
  const draft = HK_ISO_CONNECTED_DRAFTS[acc.id];
  const count = draft ? draft.rows.length : 0;
  const bodyHtml = draft
    ? _hkIsoDraftSalesTable(acc.id, draft.rows, draft.priceHeader, draft.saleGroupLabel, draft.fixedCostAddon, draft)
    : `<div class="pricing-coming-soon">
        <i class="fa-solid fa-table-list"></i>
        <p>${acc.label}</p>
        <span>구조 연결 전</span>
      </div>`;
  return `<div class="hk-iso-accordion${isOpen ? ' open' : ''}" id="hkIsoAcc-${acc.id}">
    <div class="hk-iso-accordion-head">
      <span class="hk-iso-accordion-title">${acc.label}${acc.sub ? `<span class="hk-iso-accordion-sub">${acc.sub}</span>` : ''}</span>
      <span class="hk-iso-accordion-count">기준단가 ${count}개</span>
      <button type="button" class="hk-iso-accordion-toggle" onclick="toggleHkIsoAccordion('${acc.id}')" title="펼치기 / 접기" aria-label="${acc.label} 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"></i></button>
    </div>
    <div class="hk-iso-accordion-body">${bodyHtml}</div>
  </div>`;
}

function _hkIsoRefreshUnifiedRowElement(row) {
  if (!row) return;
  const tabId = row.dataset.draftTab;
  const rowIndex = Number(row.dataset.rowIndex);
  const sourceRow = HK_ISO_CONNECTED_DRAFTS[tabId]?.rows?.[rowIndex];
  const basePrice = _hkIsoDraftParseNumber(row.querySelector('.hk-iso-final-price-input')?.value);
  if (!sourceRow) return;
  const info = _hkIsoUnifiedShippingInfo(tabId, rowIndex, sourceRow, Number(row.dataset.thickness), basePrice);
  row.dataset.productCode = info.code;
  row.dataset.shippingAdjustment = info.adjustment;
  row.dataset.shippingApply = info.applyAdjustment ? '1' : '0';
  const shippingCell = row.querySelector('.hk-iso-unified-shipping');
  if (shippingCell) {
    shippingCell.title = `${info.policy} — 눌러서 배송 세부설정 열기`;
    shippingCell.querySelector('.hk-iso-shipping-mode').textContent = info.mode;
    shippingCell.querySelector('.hk-iso-shipping-policy').textContent = info.policy;
  }
  const adjustmentCell = row.querySelector('.hk-iso-unified-adjustment');
  if (adjustmentCell) {
    adjustmentCell.classList.toggle('is-reference', !info.applyAdjustment);
    adjustmentCell.textContent = info.applyAdjustment
      ? `${info.adjustment > 0 ? '+' : ''}${_hkIsoDraftNumber(info.adjustment)}`
      : `참고 ${info.adjustment > 0 ? '+' : ''}${_hkIsoDraftNumber(info.adjustment)}`;
  }
  const targetCell = row.querySelector('.hk-iso-unified-target');
  if (targetCell) targetCell.textContent = _hkIsoDraftNumber(info.targetPrice);
}

function _hkIsoSyncUnifiedShippingRow(sourceAccordion, rowIndex) {
  const row = document.querySelector(`#hkIsoAcc-${sourceAccordion} tr[data-row-index="${rowIndex}"]`);
  _hkIsoRefreshUnifiedRowElement(row);
  const listingSection = document.getElementById('hkChannelListingSection');
  if (listingSection && !listingSection.hidden && typeof window._hkRefreshChannelListing === 'function') {
    window._hkRefreshChannelListing();
  }
}

/* ═══════════════════════════════════════
   2단계 — 상품번호(실제 등록 상품)별 배송비/실판매가

   1단계 판매가는 "이론상 기준가"이고, 실제로는 상품번호(리스팅)마다 배송비
   정책이 달라서 같은 옵션도 최종 판매가가 달라진다(2026-09-16, 사용자가 준
   원본 엑셀 "아이소핑크_실제단가.xlsx"로 확인) — 그래서 1단계 표 안에서
   자동 계산으로 흡수하지 않고 이렇게 별도 블록으로 관리한다.

   블록 하나 = 같은 배송비 정책을 쓰는 상품번호 묶음 하나. rows는
   sourceAccordion의 원본 행(HK_ISO_CONNECTED_DRAFTS[...].rows)과 같은
   순서로 1:1 대응 — thickness/saleSize를 다시 안 적어도 되게.

   실제 계산 관계(엑셀 역산으로 확인):
   - 배송비차액 = 5장당실제배송비 − 5장당배송비(기준)
   - 1장당배송비차액 = 배송비차액 ÷ 5 (참고용, 실제 판매수량과 무관하게 항상 5로 나눔)
   - 배송비 플러스 금액은 1장당배송비차액을 "참고"해서 사람이 100원 단위로
     반올림/결정하는 값이라 순수 계산으로 못 만든다 — 그래서 직접입력(노란색).
   - 실판매가 = 1단계 판매가 + 배송비 플러스 금액
   ═══════════════════════════════════════ */
const HK_ISO_SHIPPING_BLOCKS = [
  {
    id: 'iso_600x900_1',
    title: '아이소핑크 600x900',
    productNumbers: ['439103571', '2229818356', '3020442618', '439904706', '442086644'],
    sourceAccordion: 'iso_600x900',
    saleGroupLabel: '600*900',
    isAdhesive: false,
    schema: 'per5',
    sharedBaseShipping: true,
    baseShipping5: 6000,
    // HK_ISO_DRAFT_600X900_ROWS와 같은 순서(10T 430*430-3, 10T 600*900-3, 20T ... )
    rows: [
      { actualShipping5: 5200,  plusAmount: -200 },
      { actualShipping5: 6500,  plusAmount: 0 },
      { actualShipping5: 5500,  plusAmount: -100 },
      { actualShipping5: 5500,  plusAmount: 0 },
      { actualShipping5: 5500,  plusAmount: -100 },
      { actualShipping5: 6500,  plusAmount: 0 },
      { actualShipping5: 6000,  plusAmount: 0 },
      { actualShipping5: 7000,  plusAmount: 0 },
      { actualShipping5: 6500,  plusAmount: 100 },
      { actualShipping5: 8700,  plusAmount: 0 },
      { actualShipping5: 5500,  plusAmount: -100 },
      { actualShipping5: 12200, plusAmount: 700 },
      { actualShipping5: 6500,  plusAmount: 100 },
      { actualShipping5: 17000, plusAmount: 1000 },
    ],
  },
  {
    id: 'adhesive_600x900_1',
    title: '접착식 아이소핑크 600x900',
    // 첫 변형(3/1/1/1/1장) 행은 439103571 등 스마트스토어 상품번호들이 쓰고,
    // 묶음(10/5/3/2/2장) 행은 "쿠팡전용"(별도 상품, 상품번호 없이 채널명으로만
    // 구분됨)이 쓴다 — 같은 표 안에 두 채널이 같이 있다(2026-09-16).
    productNumbers: ['439103571', '2229818356', '3020442618', '439904706', '3736232926'],
    sourceAccordion: 'adhesive_600x900_a',
    saleGroupLabel: '600*900',
    isAdhesive: true,
    schema: 'per5',
    baseShipping5: 6000,
    // HK_ISO_DRAFT_ADHESIVE_600X900_ROWS와 같은 순서(10T-3장, 10T-10장(묶음),
    // 20T-1장, 20T-5장(묶음), ... )
    rows: [
      { actualShipping5: 6500, plusAmount: 100 },  // 10T 600*900-3
      { actualShipping5: 6500, plusAmount: 0 },    // 10T 600*900-10 (쿠팡전용)
      { actualShipping5: 5500, plusAmount: 0 },    // 20T 600*900-1
      { actualShipping5: 5500, plusAmount: 0 },    // 20T 600*900-5 (쿠팡전용)
      { actualShipping5: 6500, plusAmount: 100 },  // 30T 600*900-1
      { actualShipping5: 6500, plusAmount: 0 },    // 30T 600*900-3 (쿠팡전용)
      { actualShipping5: 7000, plusAmount: 200 },  // 40T 600*900-1
      { actualShipping5: 7000, plusAmount: 0 },    // 40T 600*900-2 (쿠팡전용)
      { actualShipping5: 8700, plusAmount: 600 },  // 50T 600*900-1
      { actualShipping5: 8700, plusAmount: 0 },    // 50T 600*900-2 (쿠팡전용)
    ],
  },
  /* 900x1800 계열은 600x900과 배송비 구조 자체가 다르다(2026-09-16, 원본
     엑셀로 확인) — "5장당" 기준이 아니라 "1장당 배송비 + 몇 개마다 배송비
     청구하는지(실제배송비가 숫자가 아니라 텍스트 규칙)" 구조이고, 알림쿠폰
     칸이 따로 있다. 결정적으로 실판매가 공식 자체가 다르다:
     - 유료배송 상품(아래 첫 블록): 실판매가 = 판매가 그대로. 배송비 플러스
       금액은 "이걸 가격에 얹으면 얼마일지"의 참고값일 뿐 실제로는 안 얹는다
       (배송비는 결제 시 별도로 받으니까).
     - 무료배송 상품(상품번호 "(무료)" 표시): 실판매가 = 판매가 + 배송비
       플러스 금액(무료배송으로 보이게 하려고 배송비를 가격에 얹음).
     schema:'per1Coupon'으로 구분해서 별도 렌더러(_hkIsoShippingBlockHtmlPerUnit)
     로 그린다. */
  {
    id: 'iso_900x1800_single_1',
    title: '아이소핑크 900x1800 단품',
    productNumbers: [], // 원본 엑셀에 상품번호 표시 없음(유료배송 기본값으로 보임)
    sourceAccordion: 'iso_900x1800_single',
    saleGroupLabel: '900*1800',
    isAdhesive: false,
    schema: 'per1Coupon',
    isFreeShipping: false,
    // HK_ISO_DRAFT_900X1800_SINGLE_ROWS와 같은 순서(10T~100T, 전부 -1)
    rows: [
      { perUnitShipping: 7000,  actualShippingText: '5개마다', coupon: 1000, plusAmount: 10400 },
      { perUnitShipping: 8000,  actualShippingText: '3개마다', coupon: 1000, plusAmount: 11700 },
      { perUnitShipping: 8000,  actualShippingText: '2개마다', coupon: 1000, plusAmount: 11700 },
      { perUnitShipping: 6500,  actualShippingText: '1개마다', coupon: 1000, plusAmount: 10000 },
      { perUnitShipping: 7000,  actualShippingText: '1개마다', coupon: 1000, plusAmount: 10400 },
      { perUnitShipping: 9000,  actualShippingText: '1개마다', coupon: 1000, plusAmount: 13000 },
      { perUnitShipping: 12000, actualShippingText: '1개마다', coupon: 1000, plusAmount: 17000 },
    ],
  },
  {
    id: 'iso_900x1800_bundle_1',
    title: '아이소핑크 900x1800 묶음(무료배송)',
    productNumbers: ['5695312387'],
    sourceAccordion: 'iso_900x1800_bundle',
    saleGroupLabel: '900*1800',
    isAdhesive: false,
    schema: 'per1Coupon',
    isFreeShipping: true,
    // HK_ISO_DRAFT_900X1800_BUNDLE_ROWS와 같은 순서(10T-10,20T-5,30T-3,40T-2,50T-2,70T-1,100T-1)
    // 상품코드가 원본 엑셀에 70T·100T만 "IIso_"(I가 두 번)로 돼있다 — 실제 등록된
    // 코드를 그대로 옮긴 것(오타로 보이지만 사용자 확인 전까지 원본 그대로 둠).
    rows: [
      { actualShipping: 12200, coupon: 1000, plusAmount: 13500, codeOverride: null },
      { actualShipping: 12200, coupon: 1000, plusAmount: 13500, codeOverride: null },
      { actualShipping: 11000, coupon: 1000, plusAmount: 12000, codeOverride: null },
      { actualShipping: 9900,  coupon: 1000, plusAmount: 11000, codeOverride: null },
      { actualShipping: 12200, coupon: 1000, plusAmount: 13500, codeOverride: null },
      { actualShipping: 9300,  coupon: 1000, plusAmount: 10500, codeOverride: 'IIso_900_1800_70_1' },
      { actualShipping: 12200, coupon: 1000, plusAmount: 13500, codeOverride: 'IIso_900_1800_100_1' },
    ],
  },
  {
    id: 'adhesive_900x1800_single_1',
    title: '접착식 아이소핑크 900x1800 단품',
    productNumbers: [], // 원본 엑셀에 상품번호 표시 없음(유료배송 기본값)
    sourceAccordion: 'adhesive_900x1800_single',
    saleGroupLabel: '900*1800',
    isAdhesive: true,
    schema: 'per1Coupon',
    isFreeShipping: false,
    // HK_ISO_DRAFT_ADHESIVE_900X1800_SINGLE_ROWS와 같은 순서(10T~50T, 전부 -1)
    rows: [
      { perUnitShipping: 7000, actualShippingText: '5개마다', coupon: 1000, plusAmount: 8000 },
      { perUnitShipping: 8000, actualShippingText: '3개마다', coupon: 1000, plusAmount: 9000 },
      { perUnitShipping: 8000, actualShippingText: '2개마다', coupon: 1000, plusAmount: 9000 },
      { perUnitShipping: 6500, actualShippingText: '1개마다', coupon: 1000, plusAmount: 7500 },
      { perUnitShipping: 7000, actualShippingText: '1개마다', coupon: 1000, plusAmount: 8000 },
    ],
  },
  {
    id: 'adhesive_900x1800_bundle_1',
    title: '접착식 아이소핑크 900x1800 묶음(무료배송)',
    productNumbers: ['5695312387'],
    sourceAccordion: 'adhesive_900x1800_bundle',
    saleGroupLabel: '900*1800',
    isAdhesive: true,
    schema: 'per1Coupon',
    isFreeShipping: true,
    // HK_ISO_DRAFT_ADHESIVE_900X1800_BUNDLE_ROWS와 같은 순서(10T-10,20T-5,30T-3,40T-2,50T-2)
    rows: [
      { actualShipping: 12200, coupon: 1000, plusAmount: 13500 },
      { actualShipping: 12200, coupon: 1000, plusAmount: 13500 },
      { actualShipping: 11000, coupon: 1000, plusAmount: 12000 },
      { actualShipping: 9900,  coupon: 1000, plusAmount: 11000 },
      { actualShipping: 12200, coupon: 1000, plusAmount: 13500 },
    ],
  },
  {
    id: 'iso_900x1800_high_t_1',
    title: '아이소핑크 900x1800 고티(무료배송)',
    productNumbers: ['5697937041'],
    sourceAccordion: 'iso_900x1800_high_t',
    saleGroupLabel: '900*1800',
    isAdhesive: false,
    schema: 'per1Coupon',
    isFreeShipping: true,
    // HK_ISO_DRAFT_900X1800_HIGH_T_ROWS와 같은 순서(70T-3,100T-3,250T-1,500T-1)
    // 이 상품번호에서는 "1장당배송비차액" 칸이 원본 엑셀에도 비어있다(빈 칸 그대로 둠).
    rows: [
      { actualShipping: 22700, coupon: 1000, plusAmount: 24000 },
      { actualShipping: 31500, coupon: 1000, plusAmount: 33000 },
      { actualShipping: 26800, coupon: 1000, plusAmount: 28000 },
      { actualShipping: 51300, coupon: 1000, plusAmount: 53000 },
    ],
  },
  {
    id: 'iso_600x900_high_t_1',
    title: '아이소핑크 600 계열 고티(무료배송)',
    productNumbers: ['4995022274'],
    sourceAccordion: 'iso_600x900_high_t',
    saleGroupLabel: '600*900',
    isAdhesive: false,
    schema: 'per5',
    baseShipping5: 0, // "배송비 무료" 기준(0원)
    divisor: 1,       // 900*1800/600 계열 고티는 원장 1장 단위라 5로 안 나눈다
    // HK_ISO_DRAFT_600X900_HIGH_T_ROWS와 같은 순서(100T-600*860-1,250T-600*430-1,
    // 250T-600*860-1,500T-600*430-1,500T-600*860-1) — 원본 엑셀에 배송비 플러스
    // 금액이 전부 빈 칸이라(무료배송인데 아직 가격에 안 얹은 상태) 0으로 둔다.
    rows: [
      { actualShipping5: 5500, plusAmount: 0 },
      { actualShipping5: 5500, plusAmount: 0 },
      { actualShipping5: 9300, plusAmount: 0 },
      { actualShipping5: 9300, plusAmount: 0 },
      { actualShipping5: 17000, plusAmount: 0 },
    ],
  },
  {
    id: 'iso_coupang_winner_1',
    title: '아이소핑크 쿠팡 위너',
    productNumbers: [], // 채널명("쿠팡전용")으로만 구분, 상품번호 없음
    sourceAccordion: 'iso_coupang_winner',
    saleGroupLabel: '쿠팡 위너',
    isAdhesive: false,
    schema: 'per5',
    codePrefix: 'IsoC', // 쿠팡 위너 전용 상품코드 접두어(원본 엑셀에서 확인)
    baseShipping5: 6000, // 600*900 행들의 기본값(수량 많은 행은 행별로 덮어씀)
    perRowDivisor: true, // "1장당배송비차액" 칼럼이 5장 고정이 아니라 행의 판매수량으로 나뉜다
    // HK_ISO_DRAFT_COUPANG_WINNER_ROWS와 같은 순서(26행). 600*860/600*430/
    // 900*1800 규격은 "5장당" 개념이 없어서(원본 엑셀에도 그 칸들이 비어있음)
    // baseShipping:null로 표시해 차액 계산을 건너뛰고 배송비 플러스 금액만 그대로 쓴다.
    // ※ 30T-5장/40T-5장, 50T-1장/50T-2장처럼 같은 수량인데 "1장당배송비차액"이
    // 원본 엑셀에서도 서로 다르게 적혀있는 행이 있다(40T-5장·50T-2장) — 그 칸은
    // 참고용 표시일 뿐 실판매가 계산에는 안 쓰여서, 여기서는 행의 실제 판매수량
    // 기준으로 일관되게 계산한다(원본의 그 두 칸과는 다르게 보일 수 있음).
    rows: [
      { baseShipping: 12000, actualShipping5: 13000, plusAmount: 100 },  // 10T 600*900-10
      { baseShipping: 24000, actualShipping5: 26000, plusAmount: 100 },  // 10T 600*900-20
      { baseShipping: 6000,  actualShipping5: 6500,  plusAmount: 100 },  // 20T 600*900-5
      { baseShipping: 12000, actualShipping5: 13000, plusAmount: 100 },  // 20T 600*900-10
      { baseShipping: 6000,  actualShipping5: 6500,  plusAmount: 500 },  // 30T 600*900-1
      { baseShipping: 6000,  actualShipping5: 6500,  plusAmount: 200 },  // 30T 600*900-3
      { baseShipping: 6000,  actualShipping5: 6500,  plusAmount: 100 },  // 30T 600*900-5
      { baseShipping: 12000, actualShipping5: 13000, plusAmount: 200 },  // 30T 600*900-10
      { baseShipping: 6000,  actualShipping5: 6500,  plusAmount: 300 },  // 40T 600*900-2
      { baseShipping: 6000,  actualShipping5: 6500,  plusAmount: 500 },  // 40T 600*900-5
      { baseShipping: 6000,  actualShipping5: 6500,  plusAmount: 500 },  // 50T 600*900-1
      { baseShipping: 6000,  actualShipping5: 6500,  plusAmount: 500 },  // 50T 600*900-2
      { baseShipping: 6000,  actualShipping5: 6500,  plusAmount: 500 },  // 70T 600*900-1
      { baseShipping: 6000,  actualShipping5: 6500,  plusAmount: 500 },  // 100T 600*900-1
      { baseShipping: null,  actualShipping5: 5500,  plusAmount: 5500 }, // 100T 600*860-1
      { baseShipping: null,  actualShipping5: 9300,  plusAmount: 9300 }, // 250T 600*860-1
      { baseShipping: null,  actualShipping5: 5500,  plusAmount: 5500 }, // 250T 600*430-1
      { baseShipping: null,  actualShipping5: 17000, plusAmount: 17000 }, // 500T 600*860-1
      { baseShipping: null,  actualShipping5: 9300,  plusAmount: 9300 }, // 500T 600*430-1
      { baseShipping: null,  actualShipping5: 12200, plusAmount: 12200 }, // 10T 900*1800-10
      { baseShipping: null,  actualShipping5: 12200, plusAmount: 12200 }, // 20T 900*1800-5
      { baseShipping: null,  actualShipping5: 11000, plusAmount: 11000 }, // 30T 900*1800-3
      { baseShipping: null,  actualShipping5: 9900,  plusAmount: 9900 }, // 40T 900*1800-2
      { baseShipping: null,  actualShipping5: 12200, plusAmount: 12200 }, // 50T 900*1800-2
      { baseShipping: null,  actualShipping5: 9300,  plusAmount: 9300 }, // 70T 900*1800-1
      { baseShipping: null,  actualShipping5: 12200, plusAmount: 12200 }, // 100T 900*1800-1
    ],
  },
];

/* 배송비 블록 하나를 표로 그린다 — KS정품/호수/규격/판매사이즈/상품코드는
   sourceAccordion 원본 행에서 그대로 읽고, 배송비 관련 칸만 이 블록 고유 값.
   판매가(basePrice)는 1단계 표의 실제 입력칸(.hk-iso-final-price-input) 값을
   그때그때 읽어온다 — 1단계에서 "판매가 편집"으로 값을 바꿨으면 그 값이
   반영된다(정적 시드 데이터가 아니라 살아있는 DOM 값). 아직 1단계가 그려지기
   전이면(초기 로드 순서상 있을 수 없지만 방어적으로) 시드값으로 대체한다. */
function _hkIsoShippingBlockHtml(block) {
  const sourceRows = HK_ISO_CONNECTED_DRAFTS[block.sourceAccordion]?.rows || [];
  const livePriceInputs = document.querySelectorAll(`#hkIsoAcc-${block.sourceAccordion} .hk-iso-final-price-input`);
  const divisor = block.divisor ?? 5;
  // divisor가 1인 블록(예: 600 계열 고티 — 원장 1장 단위 무료배송)은 "5장당"이
  // 아니라 "배송비 무료" 기준이라 칼럼 이름을 다르게 붙인다(2026-09-16).
  const shippingLabel = divisor === 1 ? '배송비 무료' : `${divisor}장당<br>배송비`;
  const actualLabel = divisor === 1 ? '실제배송비' : `${divisor}장당<br>실제배송비`;
  let currentThickness = null;
  const rows = sourceRows.map((row, i) => {
    const thicknessMatch = row.name.match(/(\d+)T/);
    if (thicknessMatch) currentThickness = Number(thicknessMatch[1]);
    const ship = block.rows[i] || {};
    const code = ship.codeOverride || _hkIsoDraftProductCode(row.saleSize, currentThickness, block.isAdhesive, block.codePrefix);
    const basePrice = livePriceInputs[i] ? _hkIsoDraftParseNumber(livePriceInputs[i].value) : Number(row.price);
    // 행마다 기준배송비가 다른 블록(쿠팡 위너 — 수량 많으면 기준배송비도 배수로
    // 올라감)을 위해 행별 baseShipping을 우선 쓴다. null이면 "이 규격은 5장당
    // 개념이 없다"는 뜻(600*860/900*1800류 큰 두께) — 그 경우 차액 계산 자체를
    // 건너뛰고 배송비 플러스 금액을 그대로 표시만 한다(2026-09-16).
    const hasBase = ship.baseShipping !== null;
    const baseShipping = hasBase ? (ship.baseShipping ?? block.baseShipping5) : null;
    const actualShipping = ship.actualShipping5 ?? 0;
    const shippingDiff = hasBase ? actualShipping - baseShipping : null;
    const rowDivisor = block.perRowDivisor ? (Number(String(row.saleSize).split('-').pop()) || 1) : divisor;
    const perUnitDiff = hasBase ? shippingDiff / rowDivisor : null;
    const plusAmount = ship.plusAmount ?? 0;
    const finalPrice = basePrice + plusAmount;
    const usesSharedBase = !!block.sharedBaseShipping && hasBase;
    const baseShippingCell = hasBase
      ? (usesSharedBase
        ? `<span class="hk-iso-shared-base-value">${_hkIsoDraftNumber(baseShipping)}</span>`
        : `<input type="text" inputmode="numeric" class="pricing-input-field hk-iso-ship-base-input" value="${baseShipping.toLocaleString()}" oninput="recalcHkIsoShippingRow(this)" onblur="formatHkIsoDraftPrice(this)">`)
      : `<span class="hk-iso-ship-blank-cell">—</span>`;
    return `<tr data-shipping-block-id="${block.id}" data-source-accordion="${block.sourceAccordion}" data-row-index="${i}" data-product-code="${code}" data-base-price="${basePrice}" data-base-shipping="${baseShipping ?? ''}" data-has-base="${hasBase ? 1 : 0}" data-shared-base="${usesSharedBase ? 1 : 0}" data-divisor="${rowDivisor}">
      <td class="hk-iso-draft-name">${row.name || '　'}</td>
      <td>${_hkIsoDraftNumber(row.unit)}</td>
      <td>${row.spec || '—'}</td>
      <td>${row.saleSize}</td>
      <td class="hk-iso-draft-code">${_hkIsoCodeCellInner(code)}</td>
      <td class="hk-iso-ship-base-price">${_hkIsoDraftNumber(basePrice)}</td>
      <td>${baseShippingCell}</td>
      <td><input type="text" inputmode="numeric" class="pricing-input-field hk-iso-ship-actual-input" value="${actualShipping.toLocaleString()}" oninput="recalcHkIsoShippingRow(this)" onblur="formatHkIsoDraftPrice(this)"></td>
      <td class="hk-iso-ship-diff">${hasBase ? _hkIsoDraftNumber(shippingDiff) : '—'}</td>
      <td class="hk-iso-ship-per-unit">${hasBase ? _hkIsoDraftNumber(perUnitDiff) : '—'}</td>
      <td class="hk-iso-ship-plus-cell"><input type="text" inputmode="numeric" class="pricing-input-field hk-iso-ship-plus-input" value="${plusAmount.toLocaleString()}" oninput="recalcHkIsoShippingRow(this)" onblur="formatHkIsoDraftPrice(this)" title="1장당배송비차액을 참고해서 직접 정하는 값입니다(100원 단위로 반올림 등)."></td>
      <td class="hk-iso-ship-final-price">${_hkIsoDraftNumber(finalPrice)}</td>
    </tr>`;
  }).join('');

  const sharedBaseEditor = block.sharedBaseShipping
    ? `<label class="hk-iso-shared-shipping-editor">
        <span>판매 시 ${divisor}장당 배송비</span>
        <input type="text" inputmode="numeric" class="pricing-input-field" value="${Number(block.baseShipping5 || 0).toLocaleString()}" oninput="recalcHkIsoSharedBaseShipping('${block.id}',this)" onblur="formatHkIsoDraftPrice(this)">
        <em>원</em>
      </label>`
    : '';

  return `<div class="card pricing-cost-card hk-iso-shipping-block">
    <div class="pricing-result-header">
      <div class="pricing-result-title">${block.title}<span class="pricing-spec-badge">배송 상세</span></div>
      <div class="hk-iso-header-actions">
        ${sharedBaseEditor}
        <span class="pricing-result-hint">${block.productNumbers.length ? '상품번호 ' + block.productNumbers.join(' // ') : '상품번호 미지정(기본값)'}</span>
        <button type="button" class="pricing-margin-edit-btn hk-iso-ship-refresh-btn" onclick="_hkIsoRefreshShippingSection()" title="기준 판매가를 바꿨으면 눌러서 다시 불러옵니다">
          <i class="fa-solid fa-rotate"></i> 기준 판매가 새로고침
        </button>
      </div>
    </div>
    <div class="pricing-table-scroll">
      <table class="pricing-table hk-iso-draft-table hk-iso-shipping-table">
        <thead><tr>
          <th class="hk-iso-head-base">KS정품</th>
          <th class="hk-iso-head-base">호수</th>
          <th class="hk-iso-head-base">규 격</th>
          <th class="hk-iso-head-size">판매사이즈</th>
          <th class="hk-iso-head-code">상품코드</th>
          <th class="hk-iso-head-base">${block.saleGroupLabel}<br><span class="pricing-th-tiny">기준 판매가</span></th>
          <th class="hk-iso-head-sale-price">${shippingLabel}</th>
          <th class="hk-iso-head-sale-price">${actualLabel}</th>
          <th class="hk-iso-head-margin">배송비차액</th>
          <th class="hk-iso-head-margin">1장당<br>배송비차액</th>
          <th class="hk-iso-head-plus">배송비<br>플러스 금액</th>
          <th class="hk-iso-head-rate">실판매가</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

/* 행 하나 재계산 — 5장당배송비/실제배송비/배송비플러스금액 중 아무거나 바뀌면 호출 */
window.recalcHkIsoShippingRow = function(input) {
  const row = input.closest('tr');
  if (!row) return;
  const basePrice = Number(row.dataset.basePrice);
  const divisor = Number(row.dataset.divisor) || 5;
  const hasBase = row.dataset.hasBase === '1';
  const actualShipping = _hkIsoDraftParseNumber(row.querySelector('.hk-iso-ship-actual-input')?.value);
  const plusAmount = _hkIsoDraftParseNumber(row.querySelector('.hk-iso-ship-plus-input')?.value);
  const sourceAccordion = row.dataset.sourceAccordion;
  const rowIndex = Number(row.dataset.rowIndex);
  const block = HK_ISO_SHIPPING_BLOCKS.find(item => item.sourceAccordion === sourceAccordion);
  const ship = block?.rows?.[rowIndex];
  if (hasBase) {
    const baseInput = row.querySelector('.hk-iso-ship-base-input');
    const baseShipping = baseInput
      ? _hkIsoDraftParseNumber(baseInput.value)
      : Number(row.dataset.baseShipping || 0);
    row.dataset.baseShipping = baseShipping;
    const shippingDiff = actualShipping - baseShipping;
    const perUnitDiff = shippingDiff / divisor;
    row.querySelector('.hk-iso-ship-diff').textContent = _hkIsoDraftNumber(shippingDiff);
    row.querySelector('.hk-iso-ship-per-unit').textContent = _hkIsoDraftNumber(perUnitDiff);
    if (ship && row.dataset.sharedBase !== '1') ship.baseShipping = baseShipping;
  }
  if (ship) {
    ship.actualShipping5 = actualShipping;
    ship.plusAmount = plusAmount;
  }
  row.querySelector('.hk-iso-ship-final-price').textContent = _hkIsoDraftNumber(basePrice + plusAmount);
  _hkIsoSyncUnifiedShippingRow(sourceAccordion, rowIndex);
};

/* 판매 시 N장당 배송비는 상품군 공통 정책이다. 한 번 수정하면 해당 표의
   모든 규격에 같은 기준배송비를 적용하고, 실제배송비 차액만 행별로 다시 계산한다. */
window.recalcHkIsoSharedBaseShipping = function(blockId, input) {
  const block = HK_ISO_SHIPPING_BLOCKS.find(item => item.id === blockId);
  if (!block) return;
  const baseShipping = _hkIsoDraftParseNumber(input.value);
  block.baseShipping5 = baseShipping;
  document.querySelectorAll(`#hkIsoShippingSection tr[data-shipping-block-id="${blockId}"]`).forEach(row => {
    if (row.dataset.hasBase !== '1') return;
    row.dataset.baseShipping = baseShipping;
    const value = row.querySelector('.hk-iso-shared-base-value');
    if (value) value.textContent = _hkIsoDraftNumber(baseShipping);
    const actualInput = row.querySelector('.hk-iso-ship-actual-input');
    if (actualInput) window.recalcHkIsoShippingRow(actualInput);
  });
};

/* 900x1800류(schema:'per1Coupon') 배송비 블록 렌더러 — 600x900류와 표 구조 자체가
   다르다("5장당" 기준이 아니라 1장당배송비/몇개마다/알림쿠폰 구조, 무료배송
   여부에 따라 실판매가 공식이 아예 다름). */
function _hkIsoShippingBlockHtmlPerUnit(block) {
  const sourceRows = HK_ISO_CONNECTED_DRAFTS[block.sourceAccordion]?.rows || [];
  const livePriceInputs = document.querySelectorAll(`#hkIsoAcc-${block.sourceAccordion} .hk-iso-final-price-input`);
  let currentThickness = null;
  const rows = sourceRows.map((row, i) => {
    const thicknessMatch = row.name.match(/(\d+)T/);
    if (thicknessMatch) currentThickness = Number(thicknessMatch[1]);
    const ship = block.rows[i] || {};
    const code = ship.codeOverride || _hkIsoDraftProductCode(row.saleSize, currentThickness, block.isAdhesive, block.codePrefix);
    const basePrice = livePriceInputs[i] ? _hkIsoDraftParseNumber(livePriceInputs[i].value) : Number(row.price);
    const plusAmount = ship.plusAmount ?? 0;
    const finalPrice = block.isFreeShipping ? basePrice + plusAmount : basePrice;
    const shippingColHtml = block.isFreeShipping
      ? `<span class="hk-iso-ship-free-label">배송비 무료</span>`
      : `<input type="text" inputmode="numeric" class="pricing-input-field hk-iso-ship-perunit-input" value="${(ship.perUnitShipping ?? 0).toLocaleString()}" oninput="recalcHkIsoShippingRowPerUnit(this)" onblur="formatHkIsoDraftPrice(this)">`;
    const actualShippingHtml = block.isFreeShipping
      ? `<input type="text" inputmode="numeric" class="pricing-input-field hk-iso-ship-actual-input" value="${(ship.actualShipping ?? 0).toLocaleString()}" oninput="recalcHkIsoShippingRowPerUnit(this)" onblur="formatHkIsoDraftPrice(this)">`
      : `<input type="text" class="pricing-input-field hk-iso-ship-actual-text-input" value="${ship.actualShippingText ?? ''}" oninput="recalcHkIsoShippingRowPerUnit(this)">`;
    return `<tr data-source-accordion="${block.sourceAccordion}" data-row-index="${i}" data-product-code="${code}" data-base-price="${basePrice}" data-free-shipping="${block.isFreeShipping ? 1 : 0}">
      <td class="hk-iso-draft-name">${row.name || '　'}</td>
      <td>${_hkIsoDraftNumber(row.unit)}</td>
      <td>${row.spec || '—'}</td>
      <td>${row.saleSize}</td>
      <td class="hk-iso-draft-code">${_hkIsoCodeCellInner(code)}</td>
      <td class="hk-iso-ship-base-price">${_hkIsoDraftNumber(basePrice)}</td>
      <td>${shippingColHtml}</td>
      <td>${actualShippingHtml}</td>
      <td><input type="text" inputmode="numeric" class="pricing-input-field hk-iso-ship-coupon-input" value="${(ship.coupon ?? 0).toLocaleString()}" oninput="recalcHkIsoShippingRowPerUnit(this)" onblur="formatHkIsoDraftPrice(this)"></td>
      <td class="hk-iso-ship-blank-cell">—</td>
      <td class="hk-iso-ship-plus-cell"><input type="text" inputmode="numeric" class="pricing-input-field hk-iso-ship-plus-input" value="${plusAmount.toLocaleString()}" oninput="recalcHkIsoShippingRowPerUnit(this)" onblur="formatHkIsoDraftPrice(this)" title="${block.isFreeShipping ? '실판매가에 그대로 더해지는 값입니다.' : '참고용입니다 — 배송비를 결제 시 별도로 받는 상품이라 실판매가에는 안 더해집니다.'}"></td>
      <td class="hk-iso-ship-final-price">${_hkIsoDraftNumber(finalPrice)}</td>
    </tr>`;
  }).join('');

  return `<div class="card pricing-cost-card hk-iso-shipping-block">
    <div class="pricing-result-header">
      <div class="pricing-result-title">${block.title}<span class="pricing-spec-badge">배송 상세</span>${block.isFreeShipping ? '<span class="hk-iso-free-badge">무료배송</span>' : ''}</div>
      <div class="hk-iso-header-actions">
        <span class="pricing-result-hint">${block.productNumbers.length ? '상품번호 ' + block.productNumbers.join(' // ') : '상품번호 미지정(기본값)'}</span>
        <button type="button" class="pricing-margin-edit-btn hk-iso-ship-refresh-btn" onclick="_hkIsoRefreshShippingSection()" title="기준 판매가를 바꿨으면 눌러서 다시 불러옵니다">
          <i class="fa-solid fa-rotate"></i> 기준 판매가 새로고침
        </button>
      </div>
    </div>
    <div class="pricing-table-scroll">
      <table class="pricing-table hk-iso-draft-table hk-iso-shipping-table">
        <thead><tr>
          <th class="hk-iso-head-base">KS정품</th>
          <th class="hk-iso-head-base">호수</th>
          <th class="hk-iso-head-base">규 격</th>
          <th class="hk-iso-head-size">판매사이즈</th>
          <th class="hk-iso-head-code">상품코드</th>
          <th class="hk-iso-head-base">${block.saleGroupLabel}<br><span class="pricing-th-tiny">기준 판매가</span></th>
          <th class="hk-iso-head-sale-price">${block.isFreeShipping ? '배송비' : '1장당<br>배송비'}</th>
          <th class="hk-iso-head-sale-price">실제배송비</th>
          <th class="hk-iso-head-margin">알림 쿠폰</th>
          <th class="hk-iso-head-margin">1장당<br>배송비차액</th>
          <th class="hk-iso-head-plus">배송비<br>플러스 금액</th>
          <th class="hk-iso-head-rate">실판매가</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

/* per1Coupon 스키마 행 재계산 — 무료배송이면 배송비플러스금액이 실판매가에
   그대로 더해지고, 유료배송이면 실판매가는 판매가 그대로(플러스금액은 참고용). */
window.recalcHkIsoShippingRowPerUnit = function(input) {
  const row = input.closest('tr');
  if (!row) return;
  const basePrice = Number(row.dataset.basePrice);
  const isFree = row.dataset.freeShipping === '1';
  const plusAmount = _hkIsoDraftParseNumber(row.querySelector('.hk-iso-ship-plus-input')?.value);
  const sourceAccordion = row.dataset.sourceAccordion;
  const rowIndex = Number(row.dataset.rowIndex);
  const block = HK_ISO_SHIPPING_BLOCKS.find(item => item.sourceAccordion === sourceAccordion);
  const ship = block?.rows?.[rowIndex];
  if (ship) {
    ship.plusAmount = plusAmount;
    ship.coupon = _hkIsoDraftParseNumber(row.querySelector('.hk-iso-ship-coupon-input')?.value);
    if (isFree) {
      ship.actualShipping = _hkIsoDraftParseNumber(row.querySelector('.hk-iso-ship-actual-input')?.value);
    } else {
      ship.perUnitShipping = _hkIsoDraftParseNumber(row.querySelector('.hk-iso-ship-perunit-input')?.value);
      ship.actualShippingText = row.querySelector('.hk-iso-ship-actual-text-input')?.value || '';
    }
  }
  row.querySelector('.hk-iso-ship-final-price').textContent = _hkIsoDraftNumber(isFree ? basePrice + plusAmount : basePrice);
  _hkIsoSyncUnifiedShippingRow(sourceAccordion, rowIndex);
};

/* "무료배송 + 10% 네고"(schema 'free90') 블록 렌더러 — 실제배송비만 입력하고 나머지(플러스 금액·90%·단수정리·
   실판매가)는 _hkIsoFree90Parts로 계산한다. */
function _hkIsoShippingBlockHtmlFree90(block) {
  const sourceRows = HK_ISO_CONNECTED_DRAFTS[block.sourceAccordion]?.rows || [];
  const livePriceInputs = document.querySelectorAll(`#hkIsoAcc-${block.sourceAccordion} .hk-iso-final-price-input`);
  let currentThickness = null;
  const rows = sourceRows.map((row, i) => {
    const thicknessMatch = row.name.match(/(\d+)T/);
    if (thicknessMatch) currentThickness = Number(thicknessMatch[1]);
    const ship = block.rows[i] || {};
    const code = ship.codeOverride || _hkIsoDraftProductCode(row.saleSize, currentThickness, block.isAdhesive, block.codePrefix);
    const basePrice = livePriceInputs[i] ? _hkIsoDraftParseNumber(livePriceInputs[i].value) : Number(row.price);
    const parts = _hkIsoFree90Parts(basePrice, ship.actualShipping);
    return `<tr data-shipping-block-id="${block.id}" data-source-accordion="${block.sourceAccordion}" data-row-index="${i}" data-product-code="${code}" data-base-price="${basePrice}">
      <td class="hk-iso-draft-name">${row.name || '　'}</td>
      <td>${_hkIsoDraftNumber(row.unit)}</td>
      <td>${row.spec || '—'}</td>
      <td>${row.saleSize}</td>
      <td class="hk-iso-draft-code">${_hkIsoCodeCellInner(code)}</td>
      <td class="hk-iso-ship-base-price">${_hkIsoDraftNumber(basePrice)}</td>
      <td><span class="hk-iso-ship-free-label">배송비 무료</span></td>
      <td><input type="text" inputmode="numeric" class="pricing-input-field hk-iso-ship-actual-input" value="${Number(ship.actualShipping || 0).toLocaleString()}" oninput="recalcHkIsoShippingRowFree90(this)" onblur="formatHkIsoDraftPrice(this)"></td>
      <td class="hk-iso-ship-free90-plus">${_hkIsoDraftNumber(parts.plus)}</td>
      <td class="hk-iso-ship-free90-discounted">${_hkIsoDraftNumber(parts.discounted)}</td>
      <td class="hk-iso-ship-free90-rounding">${_hkIsoDraftNumber(parts.rounding)}</td>
      <td class="hk-iso-ship-final-price">${_hkIsoDraftNumber(parts.finalPrice)}</td>
    </tr>`;
  }).join('');

  return `<div class="card pricing-cost-card hk-iso-shipping-block">
    <div class="pricing-result-header">
      <div class="pricing-result-title">${block.title}<span class="pricing-spec-badge">배송 상세</span><span class="hk-iso-free-badge">무료배송 · 10% 네고</span></div>
      <div class="hk-iso-header-actions">
        <span class="pricing-result-hint">${block.productNumbers.length ? '상품번호 ' + block.productNumbers.join(' // ') : '상품번호 미지정(기본값)'}</span>
        <button type="button" class="pricing-margin-edit-btn hk-iso-ship-refresh-btn" onclick="_hkIsoRefreshShippingSection()" title="기준 판매가를 바꿨으면 눌러서 다시 불러옵니다">
          <i class="fa-solid fa-rotate"></i> 기준 판매가 새로고침
        </button>
      </div>
    </div>
    <div class="pricing-table-scroll">
      <table class="pricing-table hk-iso-draft-table hk-iso-shipping-table">
        <thead><tr>
          <th class="hk-iso-head-base">KS정품</th>
          <th class="hk-iso-head-base">호수</th>
          <th class="hk-iso-head-base">규 격</th>
          <th class="hk-iso-head-size">판매사이즈</th>
          <th class="hk-iso-head-code">상품코드</th>
          <th class="hk-iso-head-base">${block.saleGroupLabel}<br><span class="pricing-th-tiny">기준 판매가</span></th>
          <th class="hk-iso-head-sale-price">배송비</th>
          <th class="hk-iso-head-sale-price">실제배송비</th>
          <th class="hk-iso-head-margin">배송비<br>플러스 금액</th>
          <th class="hk-iso-head-margin">원장판매<br>할인금액 90%</th>
          <th class="hk-iso-head-plus">단수정리</th>
          <th class="hk-iso-head-rate">실판매가<br><span class="pricing-th-tiny">10% 네고</span></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}

/* free90 행 재계산 — 실제배송비가 바뀌면 플러스 금액·90%·단수정리·실판매가를 다시 계산한다. */
window.recalcHkIsoShippingRowFree90 = function(input) {
  const row = input.closest('tr');
  if (!row) return;
  const basePrice = Number(row.dataset.basePrice);
  const actualShipping = _hkIsoDraftParseNumber(row.querySelector('.hk-iso-ship-actual-input')?.value);
  const sourceAccordion = row.dataset.sourceAccordion;
  const rowIndex = Number(row.dataset.rowIndex);
  const block = HK_ISO_SHIPPING_BLOCKS.find(item => item.sourceAccordion === sourceAccordion);
  const ship = block?.rows?.[rowIndex];
  if (ship) ship.actualShipping = actualShipping;
  const parts = _hkIsoFree90Parts(basePrice, actualShipping);
  row.querySelector('.hk-iso-ship-free90-plus').textContent = _hkIsoDraftNumber(parts.plus);
  row.querySelector('.hk-iso-ship-free90-discounted').textContent = _hkIsoDraftNumber(parts.discounted);
  row.querySelector('.hk-iso-ship-free90-rounding').textContent = _hkIsoDraftNumber(parts.rounding);
  row.querySelector('.hk-iso-ship-final-price').textContent = _hkIsoDraftNumber(parts.finalPrice);
  _hkIsoSyncUnifiedShippingRow(sourceAccordion, rowIndex);
};

/* 배송 상세를 현재 기준 판매가로 다시 그린다. 새로고침 버튼과 팝업을 열 때
   호출하며, 블록의 schema에 따라 렌더러를 나눈다. 아이소핑크 팝업에는 아이소핑크 블록만,
   스티로폼 팝업에는 스티로폼 블록만 보여준다(window._hkIsoShippingCategory). */
window._hkIsoShippingCategory = 'hk_isopink';
window._hkIsoRefreshShippingSection = function() {
  const section = document.getElementById('hkIsoShippingSection');
  if (!section) return;
  section.innerHTML = HK_ISO_SHIPPING_BLOCKS
    .filter(block => (block.categoryId || 'hk_isopink') === window._hkIsoShippingCategory)
    .map(block => {
      if (block.schema === 'per1Coupon') return _hkIsoShippingBlockHtmlPerUnit(block);
      if (block.schema === 'free90') return _hkIsoShippingBlockHtmlFree90(block);
      return _hkIsoShippingBlockHtml(block);
    })
    .join('');
};

/* 배송 상세값은 통합 기준가격 표에서 버튼을 눌렀을 때 팝업으로 연다. categoryId를 주면 그 카테고리의 블록만 연다. */
window.toggleHkIsoShippingSection = function(categoryId) {
  const modal = document.getElementById('hkIsoShippingModal');
  const section = document.getElementById('hkIsoShippingSection');
  if (!modal || !section) return;
  window._hkIsoShippingCategory = categoryId || 'hk_isopink';
  const title = document.getElementById('hkIsoShippingModalTitle');
  if (title) title.textContent = window._hkIsoShippingCategory === 'hk_bead' ? '스티로폼 배송 세부설정' : '아이소핑크 배송 세부설정';
  window._hkIsoRefreshShippingSection();
  modal.style.display = 'flex';
};

/* 기준 판매가 표의 "배송 정책" 칸을 누르면 배송 세부설정을 열고, 그 행이 속한 그룹의
   같은 행(상품코드)으로 이동해서 잠깐 강조한다. */
window.openHkIsoShippingFor = function(cell) {
  const row = cell?.closest('tr');
  if (!row) return;
  window.toggleHkIsoShippingSection(HK_ISO_CONNECTED_DRAFTS[row.dataset.draftTab]?.line === 'bead' ? 'hk_bead' : 'hk_isopink');
  const target = document.querySelector(
    `#hkIsoShippingSection tr[data-source-accordion="${row.dataset.draftTab}"][data-row-index="${row.dataset.rowIndex}"]`);
  if (!target) return;
  target.scrollIntoView({ block: 'center', inline: 'nearest' });
  target.classList.add('hk-iso-ship-focus');
  setTimeout(() => target.classList.remove('hk-iso-ship-focus'), 2500);
};

window.closeHkIsoShippingModal = function() {
  const modal = document.getElementById('hkIsoShippingModal');
  if (modal) modal.style.display = 'none';
};

/* ═══════════════════════════════════════
   몰별 적용·검증 — 채널별 실제 등록 상품

   상품코드를 키로 2단계 실판매가를 그대로 가져와서(엑셀에서 VLOOKUP으로 하던
   것과 같은 방식, 2026-09-16) "네이버판매가"를 만들고, 같은 상품ID 안에서
   첫 번째 옵션 가격을 "기준가"로 잡아 옵션추가금을 계산한다(첫 옵션보다 싼
   옵션이 있으면 옵션추가금이 음수). "수정 전 판매가"는
   실제 스토어에 지금 올라가 있던 값(사람이 확인해서 넣어둠)이고, 가격차이는
   그것과 새로 계산한 네이버판매가의 차이 — 이 값 보고 실제 스토어 옵션가를
   얼마나 고쳐야 하는지 판단한다.

   채널(HK_CHANNELS)별로 키를 나눠서 관리한다 — 지금은 'hkd'(한국단열)만
   실제 자료가 있고 나머지는 준비중으로 뜬다. */
const HK_CHANNEL_LISTINGS = {
  hkd: [
    {
      categoryId: 'hk_isopink',
      productId: '439103571',
      baseShipping: 6000,
      shippingBasis: '5개마다',
      jejuShipping: 10000,
      returnExchange: '8500/17000',
      items: [
        { productCode: 'Iso_430_430_10_3',  prevPrice: 2500,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_10_3',  prevPrice: 6500,  prevShipping: 6000 },
        { productCode: 'Iso_430_430_20_3',  prevPrice: 5400,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_20_1',  prevPrice: 4000,  prevShipping: 6000 },
        { productCode: 'Iso_430_430_30_2',  prevPrice: 5300,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_30_1',  prevPrice: 6700,  prevShipping: 6000 },
        { productCode: 'Iso_430_430_40_2',  prevPrice: 7100,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_40_1',  prevPrice: 8300,  prevShipping: 6000 },
        { productCode: 'IsoA_600_900_10_3', prevPrice: 11500, prevShipping: 6000 },
        { productCode: 'IsoA_600_900_20_1', prevPrice: 6000,  prevShipping: 6000 },
        { productCode: 'IsoA_600_900_30_1', prevPrice: 8200,  prevShipping: 6000 },
        { productCode: 'IsoA_600_900_40_1', prevPrice: 10600, prevShipping: 6000 },
      ],
    },
    {
      categoryId: 'hk_isopink',
      productId: '2229818356',
      baseShipping: 6000,
      shippingBasis: '5개마다',
      jejuShipping: 10000,
      returnExchange: '8500/17000',
      items: [
        { productCode: 'Iso_430_430_10_3',  prevPrice: 2500,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_10_3',  prevPrice: 5400,  prevShipping: 6000 },
        { productCode: 'Iso_430_430_20_3',  prevPrice: 5300,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_20_1',  prevPrice: 7100,  prevShipping: 6000 },
        { productCode: 'Iso_430_430_30_2',  prevPrice: 6500,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_30_1',  prevPrice: 4000,  prevShipping: 6000 },
        { productCode: 'Iso_430_430_40_2',  prevPrice: 6700,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_40_1',  prevPrice: 8300,  prevShipping: 6000 },
        { productCode: 'IsoA_600_900_10_3', prevPrice: 11500, prevShipping: 6000 },
        { productCode: 'IsoA_600_900_20_1', prevPrice: 6000,  prevShipping: 6000 },
        { productCode: 'IsoA_600_900_30_1', prevPrice: 9000,  prevShipping: 6000 },
        { productCode: 'IsoA_600_900_40_1', prevPrice: 10600, prevShipping: 6000 },
      ],
    },
    // ── 아래는 2026-09-21에 추가(엑셀 3단계 원본 그대로) ──
    {
      categoryId: 'hk_isopink',
      productId: '3020442618',
      baseShipping: 6000,
      shippingBasis: '5개마다',
      jejuShipping: 10000,
      returnExchange: '8500/17000',
      items: [
        { productCode: 'Iso_430_430_10_3',  prevPrice: 2500,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_10_3',  prevPrice: 6500,  prevShipping: 6000 },
        { productCode: 'Iso_430_430_20_3',  prevPrice: 5400,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_20_1',  prevPrice: 4000,  prevShipping: 6000 },
        { productCode: 'IsoA_600_900_10_3', prevPrice: 11500, prevShipping: 6000 },
        { productCode: 'IsoA_600_900_20_1', prevPrice: 6000,  prevShipping: 6000 },
      ],
    },
    {
      categoryId: 'hk_isopink',
      productId: '439904706',
      baseShipping: 6000,
      shippingBasis: '5개마다',
      jejuShipping: 10000,
      returnExchange: '8500/17000',
      items: [
        { productCode: 'Iso_600_900_20_1',   prevPrice: 4000,  prevShipping: 6000 },
        { productCode: 'Iso_430_430_30_2',   prevPrice: 5300,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_30_1',   prevPrice: 6700,  prevShipping: 6000 },
        { productCode: 'Iso_430_430_40_2',   prevPrice: 7100,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_40_1',   prevPrice: 8300,  prevShipping: 6000 },
        { productCode: 'Iso_430_430_50_2',   prevPrice: 8700,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_50_1',   prevPrice: 11000, prevShipping: 6000 },
        { productCode: 'Iso_430_430_70_1',   prevPrice: 6000,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_70_1',   prevPrice: 14950, prevShipping: 6000 },
        { productCode: 'Iso_430_430_100_1',  prevPrice: 8700,  prevShipping: 6000 },
        { productCode: 'Iso_600_900_100_1',  prevPrice: 21850, prevShipping: 6000 },
        { productCode: 'IsoA_600_900_10_3',  prevPrice: 11500, prevShipping: 6000 },
        { productCode: 'IsoA_600_900_20_1',  prevPrice: 6000,  prevShipping: 6000 },
        { productCode: 'IsoA_600_900_30_1',  prevPrice: 8200,  prevShipping: 6000 },
        { productCode: 'IsoA_600_900_40_1',  prevPrice: 10600, prevShipping: 6000 },
        { productCode: 'IsoA_600_900_50_1',  prevPrice: 13650, prevShipping: 6000 },
      ],
    },
    {
      categoryId: 'hk_isopink',
      productId: '3736232926',
      baseShipping: 6000,
      shippingBasis: '5개마다',
      jejuShipping: 10000,
      returnExchange: '8500/17000',
      items: [
        { productCode: 'IsoA_600_900_10_3', prevPrice: 11500, prevShipping: 6000 },
        { productCode: 'IsoA_600_900_20_1', prevPrice: 6000,  prevShipping: 6000 },
        { productCode: 'IsoA_600_900_30_1', prevPrice: 9000,  prevShipping: 6000 },
        { productCode: 'IsoA_600_900_40_1', prevPrice: 10600, prevShipping: 6000 },
        { productCode: 'IsoA_600_900_50_1', prevPrice: 15000, prevShipping: 6000 },
      ],
    },
    {
      categoryId: 'hk_isopink',
      productId: '442086644',
      baseShipping: 6000,
      shippingBasis: '5개마다',
      jejuShipping: 10000,
      returnExchange: '8500/17000',
      // 이 상품만 "수정 전 배송비"가 6500(현재 배송비 6000과 다름)
      items: [
        { productCode: 'Iso_430_430_70_1',  prevPrice: 6000,  prevShipping: 6500 },
        { productCode: 'Iso_600_900_70_1',  prevPrice: 13900, prevShipping: 6500 },
        { productCode: 'Iso_430_430_100_1', prevPrice: 8500,  prevShipping: 6500 },
        { productCode: 'Iso_600_900_100_1', prevPrice: 20300, prevShipping: 6500 },
      ],
    },
    {
      categoryId: 'hk_isopink',
      productId: '4995022274',
      baseShipping: 0,
      shippingBasis: '-',
      jejuShipping: 30000,
      returnExchange: '20000/40000',
      items: [
        { productCode: 'Iso_600_860_100_1', prevPrice: 29500,  prevShipping: 0 },
        { productCode: 'Iso_600_430_250_1', prevPrice: 38000,  prevShipping: 0 },
        { productCode: 'Iso_600_860_250_1', prevPrice: 65000,  prevShipping: 0 },
        { productCode: 'Iso_600_430_500_1', prevPrice: 72000,  prevShipping: 0 },
        { productCode: 'Iso_600_860_500_1', prevPrice: 126000, prevShipping: 0 },
      ],
    },
    {
      categoryId: 'hk_isopink',
      productId: '5695312387',
      baseShipping: 0,
      shippingBasis: '-',
      jejuShipping: 30000,
      returnExchange: '31000/62000',
      // 70T·100T 코드가 "IIso_"(I 두 번)인 건 실제 등록 코드 그대로(2단계와 동일).
      items: [
        { productCode: 'Iso_900_1800_10_10',   prevPrice: 51500, prevShipping: 0 },
        { productCode: 'Iso_900_1800_20_5',    prevPrice: 52000, prevShipping: 0 },
        { productCode: 'Iso_900_1800_30_3',    prevPrice: 46900, prevShipping: 0 },
        { productCode: 'Iso_900_1800_40_2',    prevPrice: 42600, prevShipping: 0 },
        { productCode: 'Iso_900_1800_50_2',    prevPrice: 50100, prevShipping: 0 },
        { productCode: 'IIso_900_1800_70_1',   prevPrice: 39500, prevShipping: 0 },
        { productCode: 'IIso_900_1800_100_1',  prevPrice: 49500, prevShipping: 0 },
        { productCode: 'IsoA_900_1800_10_10',  prevPrice: 98500, prevShipping: 0 },
        { productCode: 'IsoA_900_1800_20_5',   prevPrice: 85000, prevShipping: 0 },
        { productCode: 'IsoA_900_1800_30_3',   prevPrice: 75000, prevShipping: 0 },
        { productCode: 'IsoA_900_1800_40_2',   prevPrice: 58500, prevShipping: 0 },
        { productCode: 'IsoA_900_1800_50_2',   prevPrice: 77500, prevShipping: 0 },
      ],
    },
    {
      categoryId: 'hk_isopink',
      productId: '5697937041',
      baseShipping: 0,
      shippingBasis: '-',
      jejuShipping: 70000,
      returnExchange: '40000/80000',
      items: [
        { productCode: 'Iso_900_1800_70_3',  prevPrice: 111000, prevShipping: 0 },
        { productCode: 'Iso_900_1800_100_3', prevPrice: 141000, prevShipping: 0 },
        { productCode: 'Iso_900_1800_250_1', prevPrice: 178000, prevShipping: 0 },
        { productCode: 'Iso_900_1800_500_1', prevPrice: 353000, prevShipping: 0 },
      ],
    },
    // ── 2026-09-21 추가 2차: 900x1800 단품은 옵션 하나마다 상품ID가 따로(상품당 옵션 1개),
    //    배송비/배송비기준/제주/편도교환도 상품마다 다르다(엑셀 원본 그대로).
    { categoryId: 'hk_isopink', productId: '8324406068',  baseShipping: 10400, shippingBasis: '5개마다', jejuShipping: 20000, returnExchange: '21000/42000',
      items: [{ productCode: 'Iso_900_1800_10_1',   prevPrice: 3800,  prevShipping: 10400 }] },
    { categoryId: 'hk_isopink', productId: '8456757485',  baseShipping: 11700, shippingBasis: '3개마다', jejuShipping: 20000, returnExchange: '14000/28000',
      items: [{ productCode: 'Iso_900_1800_20_1',   prevPrice: 7700,  prevShipping: 11700 }] },
    { categoryId: 'hk_isopink', productId: '11097629335', baseShipping: 11700, shippingBasis: '2개마다', jejuShipping: 20000, returnExchange: '14000/28000',
      items: [{ productCode: 'Iso_900_1800_30_1',   prevPrice: 11000, prevShipping: 11700 }] },
    { categoryId: 'hk_isopink', productId: '8324375715',  baseShipping: 10000, shippingBasis: '1개마다', jejuShipping: 20000, returnExchange: '18000/36000',
      items: [{ productCode: 'Iso_900_1800_40_1',   prevPrice: 15800, prevShipping: 10000 }] },
    { categoryId: 'hk_isopink', productId: '8131395351',  baseShipping: 10400, shippingBasis: '1개마다', jejuShipping: 30000, returnExchange: '14000/28000',
      items: [{ productCode: 'Iso_900_1800_50_1',   prevPrice: 17300, prevShipping: 10400 }] },
    { categoryId: 'hk_isopink', productId: '8324347562',  baseShipping: 13000, shippingBasis: '1개마다', jejuShipping: 20000, returnExchange: '14000/28000',
      items: [{ productCode: 'Iso_900_1800_70_1',   prevPrice: 29000, prevShipping: 13000 }] },
    { categoryId: 'hk_isopink', productId: '8324352040',  baseShipping: 17000, shippingBasis: '1개마다', jejuShipping: 20000, returnExchange: '18000/36000',
      items: [{ productCode: 'Iso_900_1800_100_1',  prevPrice: 35500, prevShipping: 17000 }] },
    { categoryId: 'hk_isopink', productId: '10181453964', baseShipping: 10400, shippingBasis: '5개마다', jejuShipping: 20000, returnExchange: '21000/42000',
      items: [{ productCode: 'IsoA_900_1800_10_1',  prevPrice: 8500,  prevShipping: 10400 }] },
    { categoryId: 'hk_isopink', productId: '10181564057', baseShipping: 11700, shippingBasis: '3개마다', jejuShipping: 20000, returnExchange: '14000/28000',
      items: [{ productCode: 'IsoA_900_1800_20_1',  prevPrice: 14250, prevShipping: 11700 }] },
    { categoryId: 'hk_isopink', productId: '10181571912', baseShipping: 11700, shippingBasis: '2개마다', jejuShipping: 20000, returnExchange: '14000/28000',
      items: [{ productCode: 'IsoA_900_1800_30_1',  prevPrice: 20200, prevShipping: 11700 }] },
    { categoryId: 'hk_isopink', productId: '10181582241', baseShipping: 10000, shippingBasis: '1개마다', jejuShipping: 20000, returnExchange: '18000/36000',
      items: [{ productCode: 'IsoA_900_1800_40_1',  prevPrice: 23750, prevShipping: 10000 }] },
    { categoryId: 'hk_isopink', productId: '10181586522', baseShipping: 10400, shippingBasis: '1개마다', jejuShipping: 30000, returnExchange: '14000/28000',
      items: [{ productCode: 'IsoA_900_1800_50_1',  prevPrice: 31300, prevShipping: 10400 }] },
    // 600 계열 고티: 상품 하나에 옵션 2개(600x430, 600x860) — 기준가는 첫 옵션(600x430)
    { categoryId: 'hk_isopink', productId: '10185646787', baseShipping: 0, shippingBasis: '-', jejuShipping: 30000, returnExchange: '20000/40000',
      items: [
        { productCode: 'Iso_600_430_250_1', prevPrice: 38000, prevShipping: 0 },
        { productCode: 'Iso_600_860_250_1', prevPrice: 65000, prevShipping: 0 },
      ] },
    { categoryId: 'hk_isopink', productId: '10185649832', baseShipping: 0, shippingBasis: '-', jejuShipping: 30000, returnExchange: '20000/40000',
      items: [
        { productCode: 'Iso_600_430_500_1', prevPrice: 72000,  prevShipping: 0 },
        { productCode: 'Iso_600_860_500_1', prevPrice: 126000, prevShipping: 0 },
      ] },
  ],

  // 홈페이지 채널(2026-09-21, 사용자가 준 엑셀). 상품ID는 홈페이지 상품번호(스마트스토어와 다름).
  // 재고는 전부 99,999,999(기본값)라 stock을 생략했다. prevPrice/prevShipping은 엑셀의 예전
  // 수정 전 값이 아니라 **현재 판매가·배송비에 맞춰서** 넣었다(사용자 지시 2026-09-21 — 새 채널은
  // 항상 이렇게 넣는다). 그래서 차액은 0에서 시작하고, 앞으로 단가를 고치면 그때부터 차액이
  // 쌓인다. 한국단열라이프에는 아이소핑크가 없다(사용자 확인).
  homepage: [
    // 430x430·600x900·600 계열 고티는 옵션 하나가 상품 하나
    { categoryId: 'hk_isopink', productId: '187', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_430_430_10_3',  prevPrice: 2400,  prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '188', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_430_430_20_3',  prevPrice: 6300,  prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '189', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_430_430_30_2',  prevPrice: 5600,  prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '235', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_430_430_40_2',  prevPrice: 7700,  prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '190', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_430_430_50_2',  prevPrice: 9300,  prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '214', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_430_430_70_1',  prevPrice: 6600,  prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '192', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_430_430_100_1', prevPrice: 9200,  prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '113', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_600_900_10_3',  prevPrice: 6800,  prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '260', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_600_900_20_1',  prevPrice: 4300,  prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '115', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_600_900_30_1',  prevPrice: 5900,  prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '236', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_600_900_40_1',  prevPrice: 8200,  prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '116', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_600_900_50_1',  prevPrice: 10000, prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '217', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_600_900_70_1',  prevPrice: 14600, prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '117', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_600_900_100_1', prevPrice: 20900, prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '216', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_600_430_250_1', prevPrice: 40000, prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '215', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_600_860_250_1', prevPrice: 70000, prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '228', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_600_430_500_1', prevPrice: 75000, prevShipping: 6000 }] },
    { categoryId: 'hk_isopink', productId: '229', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [{ productCode: 'Iso_600_860_500_1', prevPrice: 135000, prevShipping: 6000 }] },
    // 접착식 600x900: 상품 하나(184)에 옵션 5개 — 기준가는 첫 옵션(10T 3장 12,600)
    { categoryId: 'hk_isopink', productId: '184', baseShipping: 6000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '8000/16000',
      items: [
        { productCode: 'IsoA_600_900_10_3', prevPrice: 12600, prevShipping: 6000 },
        { productCode: 'IsoA_600_900_20_1', prevPrice: 7100,  prevShipping: 6000 },
        { productCode: 'IsoA_600_900_30_1', prevPrice: 9200,  prevShipping: 6000 },
        { productCode: 'IsoA_600_900_40_1', prevPrice: 11700, prevShipping: 6000 },
        { productCode: 'IsoA_600_900_50_1', prevPrice: 14500, prevShipping: 6000 },
      ] },
    // 900x1800 묶음(일반+접착식) 상품 239에 옵션 12개 — 기준가는 첫 옵션(20T 5장 55,000).
    // IIso_ 코드는 실제 등록된 오타를 그대로 둔 것(2단계 codeOverride와 같다).
    { categoryId: 'hk_isopink', productId: '239', baseShipping: 0, shippingBasis: '-', jejuShipping: 20000, returnExchange: '20000/40000',
      items: [
        { productCode: 'Iso_900_1800_20_5',    prevPrice: 55000,  prevShipping: 0 },
        { productCode: 'Iso_900_1800_10_10',   prevPrice: 55000,  prevShipping: 0 },
        { productCode: 'Iso_900_1800_30_3',    prevPrice: 49500,  prevShipping: 0 },
        { productCode: 'Iso_900_1800_40_2',    prevPrice: 42000,  prevShipping: 0 },
        { productCode: 'Iso_900_1800_50_2',    prevPrice: 53500,  prevShipping: 0 },
        { productCode: 'IIso_900_1800_70_1',   prevPrice: 37000,  prevShipping: 0 },
        { productCode: 'IIso_900_1800_100_1',  prevPrice: 49000,  prevShipping: 0 },
        { productCode: 'IsoA_900_1800_10_10',  prevPrice: 104000, prevShipping: 0 },
        { productCode: 'IsoA_900_1800_20_5',   prevPrice: 89000,  prevShipping: 0 },
        { productCode: 'IsoA_900_1800_30_3',   prevPrice: 77500,  prevShipping: 0 },
        { productCode: 'IsoA_900_1800_40_2',   prevPrice: 64500,  prevShipping: 0 },
        { productCode: 'IsoA_900_1800_50_2',   prevPrice: 80500,  prevShipping: 0 },
      ] },
    // 900x1800 고티 묶음 상품 242에 옵션 4개 — 기준가는 첫 옵션(70T 3장 102,000)
    { categoryId: 'hk_isopink', productId: '242', baseShipping: 0, shippingBasis: '-', jejuShipping: 20000, returnExchange: '20000/40000',
      items: [
        { productCode: 'Iso_900_1800_70_3',   prevPrice: 102000, prevShipping: 0 },
        { productCode: 'Iso_900_1800_100_3',  prevPrice: 143000, prevShipping: 0 },
        { productCode: 'Iso_900_1800_250_1',  prevPrice: 183000, prevShipping: 0 },
        { productCode: 'Iso_900_1800_500_1',  prevPrice: 368000, prevShipping: 0 },
      ] },
  ],
};

/* ESM 채널(2026-09-21, 사용자가 준 표 — 원본 표에는 "EMS"로 적혀 있음). 옵션 하나가 상품 하나이고
   행마다 마스터상품번호·상품번호가 따로 있다. productId=상품번호, masterId=마스터상품번호.
   ESM 판매가는 HK_CHANNEL_CONFIG.esm 규칙((한국단열 판매가+배송비)×1.08을 100원 올림)으로 계산하므로
   여기에는 값이 아니라 식별자와 "수정 전 판매가"만 둔다 — 수정 전 판매가는 새 채널 규칙대로 현재
   판매가에 맞췄고, 엑셀의 "판매가" 열과도 같다. 행: [그룹명, 마스터상품번호, 상품번호, 상품코드, 수정 전 판매가] */
const HK_ESM_ROWS = [
  ['아이소 430x430 / 600x900', '1410007860', '2000609425', 'Iso_430_430_10_3',   9100],
  ['아이소 430x430 / 600x900', '1479728994', '824834566',  'Iso_600_900_10_3',   13900],
  ['아이소 430x430 / 600x900', '1410003376', '2000601679', 'Iso_430_430_20_3',   13300],
  ['아이소 430x430 / 600x900', '1410001856', '2000599257', 'Iso_600_900_20_1',   11200],
  ['아이소 430x430 / 600x900', '1409988101', '4584539277', 'Iso_430_430_30_2',   12600],
  ['아이소 430x430 / 600x900', '1409399287', '1999789822', 'Iso_600_900_30_1',   12900],
  ['아이소 430x430 / 600x900', '1409396498', '4584540437', 'Iso_430_430_40_2',   14800],
  ['아이소 430x430 / 600x900', '1409386506', '1999768739', 'Iso_600_900_40_1',   15400],
  ['아이소 430x430 / 600x900', '1497356401', '4584541458', 'Iso_430_430_50_2',   16600],
  ['아이소 430x430 / 600x900', '1409303659', '4584536315', 'Iso_600_900_50_1',   17300],
  ['아이소 430x430 / 600x900', '1409286096', '4584542450', 'Iso_430_430_70_1',   13700],
  ['아이소 430x430 / 600x900', '1409282926', '1999605382', 'Iso_600_900_70_1',   22300],
  ['아이소 430x430 / 600x900', '1409271005', '1999588383', 'Iso_430_430_100_1',  16500],
  ['아이소 430x430 / 600x900', '1409125583', '1999397668', 'Iso_600_900_100_1',  29100],
  ['아이소 430x430 / 600x900', '1408580294', '4584550740', 'IsoA_600_900_10_3',  20100],
  ['아이소 430x430 / 600x900', '1447895669', '2045905739', 'IsoA_600_900_20_1',  14200],
  ['아이소 430x430 / 600x900', '1408577801', '1998640196', 'IsoA_600_900_30_1',  16500],
  ['아이소 430x430 / 600x900', '1408577016', '4584551143', 'IsoA_600_900_40_1',  19200],
  ['아이소 430x430 / 600x900', '1408428358', '4584551627', 'IsoA_600_900_50_1',  22200],
  ['아이소 600x430 / 600x860', '1387636008', '4584562167', 'Iso_600_430_250_1',  43200],
  ['아이소 600x430 / 600x860', '1387637649', '1964461987', 'Iso_600_430_500_1',  81000],
  ['아이소 600x430 / 600x860', '1387637073', '4584561479', 'Iso_600_860_250_1',  75600],
  ['아이소 600x430 / 600x860', '1387638171', '4584562726', 'Iso_600_860_500_1',  145800],
  ['아이소 900x1800',          '1587166394', '2201390136', 'Iso_900_1800_10_10', 59400],
  ['아이소 900x1800',          '1587167122', '2201390848', 'Iso_900_1800_20_5',  59400],
  ['아이소 900x1800',          '1587168848', '2201392850', 'Iso_900_1800_30_3',  53500],
  ['아이소 900x1800',          '1587172224', '2201396340', 'Iso_900_1800_40_2',  45400],
  ['아이소 900x1800',          '1587176392', '2201400767', 'Iso_900_1800_50_2',  57800],
  ['아이소 900x1800',          '1587183911', '4584541997', 'IIso_900_1800_70_1', 40000],
  ['아이소 900x1800',          '1587185047', '4584555746', 'IIso_900_1800_100_1', 53000],
  ['아이소 900x1800',          '1587198946', '4584555135', 'Iso_900_1800_250_1', 197700],
  ['아이소 900x1800',          '1587200935', '4584555000', 'Iso_900_1800_500_1', 397500],
  ['아이소 900x1800',          '1587188671', '4584555386', 'IsoA_900_1800_10_10', 112400],
  ['아이소 900x1800',          '1587189446', '4584555264', 'IsoA_900_1800_20_5', 96200],
  ['아이소 900x1800',          '1587191837', '4584538977', 'IsoA_900_1800_30_3', 83700],
  ['아이소 900x1800',          '1587195146', '4584540052', 'IsoA_900_1800_40_2', 69700],
  ['아이소 900x1800',          '1587195873', '4584541142', 'IsoA_900_1800_50_2', 87000],
];
HK_CHANNEL_LISTINGS.esm = HK_ESM_ROWS.map(([groupName, masterId, productId, productCode, prevPrice]) => ({
  categoryId: 'hk_isopink', productId, masterId, groupName,
  items: [{ productCode, prevPrice }],
}));

/* 11번가 채널(2026-09-21, 사용자가 준 표). 상품 하나에 옵션이 여러 개이고 기준가 옵션은 첫 옵션이
   아닌 경우가 있다(baseCode) — 1534504863·1541883159는 600x900 20T(11,200), 2221701321은 접착식 20T,
   3666826849는 900x1800 30T 3장(53,500). 가격은 HK_CHANNEL_CONFIG['11st'] 규칙((한국단열 판매가+배송비)
   ×1.08 을 100원 올림)으로 계산하므로 옵션별 값은 "수정 전 판매가"(=현재 최종 판매가)만 둔다.
   1534504863과 1541883159는 옵션 구성이 똑같은 별개 상품이다(원본 표 그대로). */
const HK_11ST_OPTIONS_A = [
  ['Iso_430_430_10_3', 9100], ['Iso_600_900_10_3', 13900], ['Iso_430_430_20_3', 13300], ['Iso_600_900_20_1', 11200],
  ['Iso_430_430_30_2', 12600], ['Iso_600_900_30_1', 12900], ['Iso_430_430_40_2', 14800], ['Iso_600_900_40_1', 15400],
  ['Iso_430_430_50_2', 16600], ['Iso_600_900_50_1', 17300], ['Iso_430_430_70_1', 13700], ['Iso_600_900_70_1', 22300],
  ['Iso_430_430_100_1', 16500],
  ['IsoA_600_900_10_3', 20100], ['IsoA_600_900_20_1', 14200], ['IsoA_600_900_30_1', 16500], ['IsoA_600_900_40_1', 19200], ['IsoA_600_900_50_1', 22200],
];
HK_CHANNEL_LISTINGS['11st'] = [
  { productId: '1534504863', baseCode: 'Iso_600_900_20_1',  items: HK_11ST_OPTIONS_A },
  { productId: '1541883159', baseCode: 'Iso_600_900_20_1',  items: HK_11ST_OPTIONS_A },
  { productId: '1536001162', items: [['Iso_600_900_70_1', 22300], ['Iso_600_900_100_1', 29100]] },
  { productId: '2929100660', items: [['Iso_600_430_250_1', 43200], ['Iso_600_860_250_1', 75600], ['Iso_600_430_500_1', 81000], ['Iso_600_860_500_1', 145800]] },
  { productId: '2221701321', baseCode: 'IsoA_600_900_20_1', items: [['IsoA_600_900_10_3', 20100], ['IsoA_600_900_20_1', 14200], ['IsoA_600_900_30_1', 16500], ['IsoA_600_900_40_1', 19200], ['IsoA_600_900_50_1', 22200]] },
  { productId: '3666826849', baseCode: 'Iso_900_1800_30_3', items: [
    ['Iso_900_1800_10_10', 59400], ['Iso_900_1800_20_5', 59400], ['Iso_900_1800_30_3', 53500], ['Iso_900_1800_40_2', 45400], ['Iso_900_1800_50_2', 57800],
    ['IIso_900_1800_70_1', 40000], ['IIso_900_1800_100_1', 53000],
    ['IsoA_900_1800_10_10', 112400], ['IsoA_900_1800_20_5', 96200], ['IsoA_900_1800_30_3', 83700], ['IsoA_900_1800_40_2', 69700], ['IsoA_900_1800_50_2', 87000],
  ] },
  { productId: '3680740710', items: [['Iso_900_1800_70_3', 110200], ['Iso_900_1800_100_3', 154500], ['Iso_900_1800_250_1', 197700], ['Iso_900_1800_500_1', 397500]] },
].map(product => ({
  categoryId: 'hk_isopink',
  ...product,
  // 옵션 객체는 상품마다 따로 만든다(같은 배열을 두 상품이 공유하면 한쪽의 판매상태 변경이 다른 쪽에 번진다)
  items: product.items.map(([productCode, prevPrice]) => ({ productCode, prevPrice })),
}));

/* 쿠팡 채널(2026-09-21, 사용자가 준 표). productId=Product ID, 옵션마다 옵션 ID(optionId)가 따로다.
   상품(Product ID)마다 교환/반품비가 다르고 배송비는 전부 무료, 제주배송비 8,000, 재고 99,999다.
   수정 전 판매가(prevPrice)는 새 채널 규칙대로 현재 등록 가격에 맞췄다 — 일반 상품은 쿠폰 적용 전 판매가,
   위너 상품(pricing:'winner')은 판매가(엑셀의 "판매가"·최종 판매가 열)다.
   - Product ID 5830333163은 일반 900x1800 10T·20T와 접착식 10T(표에서 떨어져 있음)를 한 상품으로 가진다.
   - 5202287414는 "쿠팡전용_" 접착식 600x900(한국단열에는 없는 코드).
   - 9474591055·8202426484·8080424483은 위너 상품(이름이 "위너_"/"위너아님_"). 위너는 쿠폰을 먹이지 않아
     쿠폰 적용 전 판매가·쿠폰 할인율 칸은 화면에서 "—"/"쿠폰 없음"으로 비운다(사용자 확인). 위너 옵션의 이름은
     코드로 만들 수 없어 직접 적는다.
   - 배송비는 5장 기준이다(사용자 확인 2026-09-21): 1~5장 6,000 / 6~10장 12,000 / 20장 24,000. 그래서 위너 10T 600x900 10장·20장은 배송 설정 값(12,000 / 24,000)을 그대로 따른다 — 엑셀에는 6,000 / 12,000으로 적혀 있었지만 엑셀이 틀린 것으로 정리했다. 그 3행의 수정 전 판매가는 엑셀 값 그대로(32,030 / 63,840 / 32,030)라 새 계산가와 차액(+6,300 / +12,600 / +6,300)이 반영 대기로 뜬다.
   행: [상품코드, 옵션 ID, 수정 전 판매가, (선택) 표시 상품명, (선택) 옵션 덮어쓰기 값 {hkdShipping, couponOff}] */
const _hkWinnerName = (spec, notWinner) => `${notWinner ? '위너아님_' : '위너_'}벽산아이소핑크 특호 ${spec}`;
const HK_COUPANG_PRODUCTS = [
  ['6410758339', '5000', [['Iso_430_430_10_3', '91272690373', 9800], ['Iso_430_430_20_3', '91272690376', 14300], ['Iso_430_430_30_2', '91272690380', 13500], ['Iso_430_430_40_2', '91272690392', 15900],
                          ['Iso_430_430_50_2', '91272690383', 17800], ['Iso_430_430_70_1', '91272690387', 14700], ['Iso_430_430_100_1', '91272690389', 17700]]],
  ['8115891747', '5000', [['Iso_600_900_10_3', '91273057157', 14900], ['Iso_600_900_20_1', '91273057163', 12000], ['Iso_600_900_30_1', '91273057151', 13900], ['Iso_600_900_40_1', '91273057134', 16500],
                          ['Iso_600_900_50_1', '91273057139', 18600], ['Iso_600_900_70_1', '91273057129', 23900], ['Iso_600_900_100_1', '91273057143', 31300]]],
  ['5202287414', '5000', [['IsoA_600_900_10_10', '94167230936', 62700], ['IsoA_600_900_20_5', '94167383082', 48200], ['IsoA_600_900_30_3', '91272792504', 39000],
                          ['IsoA_600_900_40_2', '91272792494', 34200], ['IsoA_600_900_50_2', '91272792491', 40600]], { namePrefix: '쿠팡전용_' }],
  ['4868769393', '10000', [['Iso_600_860_250_1', '91273210993', 81200], ['Iso_600_860_500_1', '91273210984', 156600], ['Iso_600_430_250_1', '91273234966', 46400], ['Iso_600_430_500_1', '91273234957', 87000]]],
  ['5830333163', '20000', [['Iso_900_1800_10_10', '91463660435', 63800], ['Iso_900_1800_20_5', '91463708028', 63800], ['IsoA_900_1800_10_10', '91463921374', 120700]]],
  ['8450863543', '20000', [['Iso_900_1800_30_3', '91463719200', 57500]]],
  ['8698533041', '20000', [['Iso_900_1800_40_2', '91463733992', 48800]]],
  ['8817063904', '20000', [['Iso_900_1800_50_2', '91463792954', 62100]]],
  ['8450892441', '20000', [['IIso_900_1800_70_1', '91463808392', 43000]]],
  ['8456728137', '20000', [['IIso_900_1800_100_1', '91463869289', 56900]]],
  ['8698561781', '20000', [['IsoA_900_1800_20_5', '91463936177', 103300]]],
  ['8698533025', '20000', [['IsoA_900_1800_30_3', '91463978903', 89900]]],
  ['8698420299', '20000', [['IsoA_900_1800_40_2', '91463993265', 74900]]],
  ['8817063902', '20000', [['IsoA_900_1800_50_2', '91464002011', 93400]]],
  ['8194369597', '40000', [['Iso_900_1800_70_3', '91273033944', 118400], ['Iso_900_1800_100_3', '91273033938', 165900], ['Iso_900_1800_250_1', '91273033924', 212300], ['Iso_900_1800_500_1', '91273033932', 426900]]],
  // 위너 상품
  ['9474591055', '20000', [
    ['IsoC_600_900_10_10',  '93925000104', 32030,  _hkWinnerName('10T 600x900 10장')],
    ['IsoC_600_900_10_20',  '94008697002', 63840,  _hkWinnerName('10T 600x900 20장')],
    ['IsoC_600_900_20_5',   '93925000102', 31080,  _hkWinnerName('20T 600x900 5장')],
    ['IsoC_600_900_20_10',  '94008697001', 62060,  _hkWinnerName('20T 600x900 10장')],
    ['IsoC_600_900_30_1',   '91503440235', 14070,  _hkWinnerName('30T 600x900 1장')],
    ['IsoC_600_900_30_3',   '93925000106', 28250,  _hkWinnerName('30T 600x900 3장')],
    ['IsoC_600_900_30_5',   '94008697003', 42630,  _hkWinnerName('30T 600x900 5장')],
    ['IsoC_600_900_30_10',  '94008697000', 85260,  _hkWinnerName('30T 600x900 10장', true)],
    ['IsoC_600_900_40_2',   '93925000103', 25940,  _hkWinnerName('40T 600x900 2장')],
    ['IsoC_600_900_40_5',   '94008696999', 55130,  _hkWinnerName('40T 600x900 5장')],
    ['IsoC_600_900_50_1',   '91503440231', 18800,  _hkWinnerName('50T 600x900 1장', true)],
    ['IsoC_600_900_70_1',   '93875453759', 23940,  _hkWinnerName('70T 600x900 1장')],
    ['IsoC_600_900_100_1',  '93875453758', 31080,  _hkWinnerName('100T 600x900 1장')],
    ['IsoC_600_860_100_1',  '93925381543', 38330,  _hkWinnerName('100T 600x860 1장')],
    ['IsoC_600_860_250_1',  '93925381545', 83270,  _hkWinnerName('250T 600x860 1장')],
    ['IsoC_600_430_250_1',  '93925381546', 47780,  _hkWinnerName('250T 600x430 1장')],
    ['IsoC_600_860_500_1',  '93925381544', 159600, _hkWinnerName('500T 600x860 1장')],
    ['IsoC_600_430_500_1',  '93925381550', 88520,  _hkWinnerName('500T 600x430 1장')],
    ['Iso_900_1800_10_10',  '94175599348', 57750,  _hkWinnerName('10T 900x1800 10장')],
    ['Iso_900_1800_20_5',   '94175599349', 57750,  _hkWinnerName('20T 900x1800 5장')],
    ['Iso_900_1800_30_3',   '94175599347', 51980,  _hkWinnerName('30T 900x1800 3장')],
    ['Iso_900_1800_40_2',   '94175599344', 44100,  _hkWinnerName('40T 900x1800 2장')],
    ['Iso_900_1800_50_2',   '94175599345', 56180,  _hkWinnerName('50T 900x1800 2장')],
    ['IIso_900_1800_70_1',  '94175599350', 38850,  _hkWinnerName('70T 900x1800 1장')],
    ['IIso_900_1800_100_1', '94175599346', 51450,  _hkWinnerName('100T 900x1800 1장')],
  ], { pricing: 'winner' }],
  ['8202426484', '20000', [
    ['IsoC_600_900_10_10', '94009132140', 32030, _hkWinnerName('10T 600x900 10장')],
    ['IsoC_600_900_20_5',  '94009132139', 31080, _hkWinnerName('20T 600x900 5장')],
    ['IsoC_600_900_30_3',  '94009132141', 28250, _hkWinnerName('30T 600x900 3장')],
    ['IsoC_600_900_40_2',  '94009132138', 25940, _hkWinnerName('40T 600x900 2장')],
    ['IsoC_600_900_50_2',  '94008868288', 28670, _hkWinnerName('50T 600x900 2장', true)],
    ['IsoC_600_900_100_1', '94008868289', 31080, _hkWinnerName('100T 600x900 1장', true)],
  ], { pricing: 'winner' }],
  ['8080424483', '20000', [
    ['IsoC_900_1800_10_10',  '94131179325', 56390, _hkWinnerName('10T 900x1800 10장')],
    ['IsoC_900_1800_20_5',   '94131179326', 55860, _hkWinnerName('20T 900x1800 5장')],
    ['IsoC_900_1800_30_3',   '94131179323', 54080, _hkWinnerName('30T 900x1800 3장')],
    ['IsoC_900_1800_50_2',   '94131179324', 54810, _hkWinnerName('50T 900x1800 2장')],
    ['IsoC_900_1800_70_1',   '94131179321', 44420, _hkWinnerName('70T 900x1800 1장')],
    ['IsoC_900_1800_100_1',  '94131179322', 53760, _hkWinnerName('100T 900x1800 1장')],
  ], { pricing: 'winner' }],
];
HK_CHANNEL_LISTINGS.coupang = HK_COUPANG_PRODUCTS.map(([productId, returnExchange, options, extra]) => ({
  categoryId: 'hk_isopink',
  productId,
  baseShipping: 0, shippingBasis: '무료', jejuShipping: 8000, returnExchange,
  ...(extra || {}),
  items: options.map(([productCode, optionId, prevPrice, productName, override]) => {
    const item = { productCode, optionId, prevPrice, stock: 99999, ...(override || {}) };
    const name = productName || (extra && extra.namePrefix ? extra.namePrefix + _hkIsoProductNameFromCode(productCode) : '');
    if (name) item.productName = name;
    return item;
  }),
}));

/* 코드에 미리 적어둔 기준가 옵션(baseCode)은 "기본값"이다 — DB에서 불러오거나 이력을 복원할 때
   이 기본값으로 되돌린 뒤 저장된 지정을 얹는다(js/pricing-hankook-db.js). */
Object.values(HK_CHANNEL_LISTINGS).forEach(list => list.forEach(product => {
  if (product.baseCode) product.seedBaseCode = product.baseCode;
}));

/* "Iso_430_430_10_3" → "아이소핑크 430x430 10T_3장" — 상품코드 자체가
   품목·규격·두께·수량을 다 담고 있어서 상품명을 따로 안 적어도 만들어낼 수 있다. */
function _hkIsoProductNameFromCode(code) {
  const isAdhesive = code.startsWith('IsoA_');
  // 실제 등록 코드에 "IIso_"(I 두 번) 오타가 있어서 앞의 I 반복을 허용한다.
  const body = code.replace(/^I+soA?_/, '');
  const [w, h, thickness, qty] = body.split('_');
  const prefix = isAdhesive ? '접착식_아이소핑크' : '아이소핑크';
  return `${prefix} ${w}x${h} ${thickness}T_${qty}장`;
}

/* 상품코드로 2단계 실판매가를 찾는다(VLOOKUP과 같은 방식) — 2단계 블록들을
   순서대로 뒤져서 코드가 일치하는 행을 찾고, 1단계의 지금 DOM 값 기준으로
   basePrice + 배송비플러스금액을 계산해 돌려준다. 못 찾으면 null. */
function _hkIsoLookupFinalPriceByCode(code) {
  // 스티로폼의 별칭 코드(예: St_1800_900_… → St_900_1800_…)는 기준 코드로 바꿔서 찾는다.
  if (typeof window.hkBeadNormalizeCode === 'function') code = window.hkBeadNormalizeCode(code);
  for (const block of HK_ISO_SHIPPING_BLOCKS) {
    const sourceRows = HK_ISO_CONNECTED_DRAFTS[block.sourceAccordion]?.rows || [];
    const livePriceInputs = document.querySelectorAll(`#hkIsoAcc-${block.sourceAccordion} .hk-iso-final-price-input`);
    let currentThickness = null;
    for (let i = 0; i < sourceRows.length; i++) {
      const row = sourceRows[i];
      const thicknessMatch = row.name.match(/(\d+)T/);
      if (thicknessMatch) currentThickness = Number(thicknessMatch[1]);
      const ship = block.rows[i] || {};
      const rowCode = ship.codeOverride || _hkIsoDraftProductCode(row.saleSize, currentThickness, block.isAdhesive, block.codePrefix);
      if (rowCode !== code) continue;
      const basePrice = livePriceInputs[i] ? _hkIsoDraftParseNumber(livePriceInputs[i].value) : Number(row.price);
      // schema별 실판매가 공식이 다르다(per5·per1Coupon·free90) — _hkIsoBlockRowFinalPrice 참고.
      return _hkIsoBlockRowFinalPrice(block, ship, basePrice);
    }
  }
  return null;
}

/* 채널별 표 모양·판매가 규칙. 등록이 없는 채널은 한국단열 스마트스토어처럼 기준 판매가를
   그대로 쓰는 기본 표를 쓴다.
   - esm / 11st: 판매가 = (한국단열 판매가 + 한국단열 배송비) × markupPercent/100 을 roundUp원 단위로
     올림(2026-09-21, 사용자가 준 ESM·11번가 표). 배송비는 판매가에 포함해서 받으니 이 채널의 배송비는 0.
     layout 'esm'은 행마다 상품번호가 따로인 표, 'markupOptions'는 상품 하나에 옵션이 여러 개인 표
     (기준가 옵션 지정·옵션가 계산)다. */
const HK_CHANNEL_CONFIG = {
  esm:   { layout: 'esm',           label: 'ESM',    markupPercent: 108, roundUp: 100 },
  '11st': { layout: 'markupOptions', label: '11번가', markupPercent: 108, roundUp: 100 },
  // 쿠팡(2026-09-21, 사용자가 준 표): 쿠팡에 등록하는 "쿠폰 적용 전 판매가" = (한국단열 판매가+배송비)×1.16을
  // 100원 올림. 그 위에 쿠팡 쿠폰 할인이 붙어 고객이 내는 "쿠폰 적용 최종 판매가"는 쿠폰 적용 전 판매가에서
  // 쿠폰 할인율(couponOff)만큼 뺀 값이다. 쿠폰은 상품마다 10%를 먹이기도 하고 12%를 먹이기도 하는데(사용자
  // 설명), 표 39행에서는 한국단열 배송비가 있는 상품이 10%, 없는 상품이 12%였다 — 그래서 옵션에
  // couponOff(10|12)를 따로 적지 않으면 이 기본값을 쓴다. "판매가" 열(×1.05를 100원 올림)은 참고값이고, 등록
  // 가격(=수정 전 판매가와 비교하는 값)은 쿠폰 적용 전 판매가로 봤다.
  // 위너 상품(product.pricing === 'winner', 표의 "위너_/위너아님_" 상품)은 규칙이 다르다: 쿠폰 할인 없이
  // 판매가(총판매가×1.05)를 그대로 받고, 자동 계산은 1,000원 단위 올림(winnerRoundUnit, 사용자 지시 2026-09-21)이다.
  // 등록 가격은 그 판매가이고 최종 판매가와 같다. 위너는 쿠폰을 먹이지 않아 쿠폰 적용 전 판매가가 없다.
  coupang: {
    layout: 'coupang', label: '쿠팡', preCouponPercent: 116, listPercent: 105, roundUp: 100,
    couponOffShipping: 10, couponOffFree: 12, winnerRoundUnit: 1000,
  },
};

/* 한국단열 채널에 등록된 같은 상품코드의 배송비(다른 채널 가격 계산의 기준). 한국단열에는 없고 다른
   채널에만 있는 코드(예: 쿠팡전용 접착식 600x900 10T_10장)는 2단계 배송 블록의 기준 배송비로 대신한다.
   그것도 못 찾으면 null. */
function _hkHkdShippingByCode(productCode) {
  const product = (HK_CHANNEL_LISTINGS.hkd || []).find(p => p.items.some(item => item.productCode === productCode));
  if (product) return Number(product.baseShipping || 0);
  return _hkIsoBlockShippingByCode(productCode);
}

/* 2단계 배송 블록에서 상품코드의 기준 배송비 — "5장당" 방식(per5) 블록만 안다(행별 기준배송비가
   null이면 5장당 개념이 없는 규격이라 0). 행에 기준배송비가 따로 없으면 블록의 5장당 배송비에 박스 수
   (장수 ÷ 5 올림)를 곱한다 — 배송비는 5장 기준이다(사용자 확인 2026-09-21: 1~5장 6,000 / 6~10장 12,000 /
   20장 24,000). 다른 방식 블록은 뜻이 확실하지 않아 null로 남긴다. */
function _hkIsoBlockShippingByCode(productCode) {
  if (typeof window.hkBeadNormalizeCode === 'function') productCode = window.hkBeadNormalizeCode(productCode);
  for (const block of HK_ISO_SHIPPING_BLOCKS) {
    const sourceRows = HK_ISO_CONNECTED_DRAFTS[block.sourceAccordion]?.rows || [];
    let thickness = null;
    for (let i = 0; i < sourceRows.length; i++) {
      const row = sourceRows[i];
      const thicknessMatch = row.name.match(/(\d+)T/);
      if (thicknessMatch) thickness = Number(thicknessMatch[1]);
      const ship = block.rows[i] || {};
      const rowCode = ship.codeOverride || _hkIsoDraftProductCode(row.saleSize, thickness, block.isAdhesive, block.codePrefix);
      if (rowCode !== productCode) continue;
      if (block.schema !== 'per5') return null;
      if (ship.baseShipping === null) return 0;
      if (ship.baseShipping !== undefined) return Number(ship.baseShipping);
      const quantity = Number(String(row.saleSize).split('-').pop()) || 1;
      const boxes = (block.divisor ?? 5) === 5 ? Math.ceil(quantity / 5) : 1;
      return Number(block.baseShipping5 ?? 0) * boxes;
    }
  }
  return null;
}

/* ESM 가격 계산 — 정수로만 계산해서 43,200처럼 딱 떨어지는 값이 소수 오차로 100원 올라가지 않게 한다.
   반환: { hkdPrice, hkdShipping, total, esmPrice(올림 전), finalPrice } 또는 null */
/* 채널 상품의 한국단열 판매가(2단계 실판매가) — 아이소핑크와 스티로폼은 상품코드로 2단계 블록을 뒤진다
   (스티로폼 상품 안에 아이소핑크 코드가 섞여 있어도 코드로 찾으니 카테고리와 무관하게 찾는다). */
function _hkChannelHkdPrice(categoryId, productCode) {
  if (categoryId === 'hk_isopink' || categoryId === 'hk_bead') return _hkIsoLookupFinalPriceByCode(productCode);
  if (categoryId === 'hk_reflective' && typeof window.hkReflectivePriceByCode === 'function') return window.hkReflectivePriceByCode(productCode);
  return null;
}

function _hkEsmPriceParts(categoryId, productCode, config, item) {
  const hkdPrice = _hkChannelHkdPrice(categoryId, productCode);
  // item.hkdShipping이 있으면(엑셀의 한국단열 배송비가 배송 설정 조회값과 다른 옵션 — 스티로폼 430/600은 전부 6,500) 그 값을 쓴다.
  const hkdShipping = item && item.hkdShipping != null ? Number(item.hkdShipping) : _hkHkdShippingByCode(productCode);
  if (hkdPrice == null || hkdShipping == null) return null;
  const total = hkdPrice + hkdShipping;
  const scaled = total * config.markupPercent; // 퍼센트 배율을 곱한 정수(÷100 하면 ESM 판매가)
  const unit = config.roundUp * 100;
  return {
    hkdPrice,
    hkdShipping,
    total,
    esmPrice: Math.round(scaled / 100),
    finalPrice: Math.ceil(scaled / unit) * config.roundUp,
  };
}

/* 쿠팡 가격 계산 — 전부 정수 계산(총판매가가 100원 단위라 ×1.16·×1.05도 정수다).
   일반(쿠폰형) 상품: 쿠폰 적용 전 = 총판매가×1.16을 100원 올림(딱 떨어지면 그대로), 참고 판매가 = ×1.05 100원 올림,
     최종 = 쿠폰 적용 전 − 쿠폰 할인율. 등록 가격(registered) = 쿠폰 적용 전.
   위너 상품(product.pricing === 'winner'): 판매가 = 총판매가×1.05를 1,000원 단위 올림(winnerRoundUnit), 쿠폰 할인 없음
     (couponOff null·쿠폰 적용 전 없음), 최종 = 판매가 = 등록 가격. item.manualPrice(수동 판매가)가 있으면 그 값이 등록 가격.
   반환: { hkdPrice, hkdShipping, total, preCoupon, listPrice, couponOff, finalPrice, registered, winner }
   item.couponOff(10 또는 12)가 있으면 그 옵션은 그 할인율을 쓴다. */
function _hkCoupangPriceParts(categoryId, productCode, config, item, product) {
  const hkdPrice = _hkChannelHkdPrice(categoryId, productCode);
  // item.hkdShipping이 있으면(쿠팡 표의 배송비가 배송 설정과 다른 옵션) 그 값을 우선한다.
  const hkdShipping = item && item.hkdShipping != null ? Number(item.hkdShipping) : _hkHkdShippingByCode(productCode);
  if (hkdPrice == null || hkdShipping == null) return null;
  const total = hkdPrice + hkdShipping;
  const unit = config.roundUp * 100;
  const listPrice = Math.ceil(total * config.listPercent / unit) * config.roundUp; // 참고 판매가(×1.05, 100원 올림) — 카테고리 공통
  // 정액 쿠폰 상품(스티로폼 쿠팡 일부 — 사용자 확인 2026-09-22): "쿠폰 10%"가 아니라 "25,000원 쿠폰"처럼
  // 원 단위 정액으로 붙는다. 등록가(쿠폰 적용 전) = 참고 판매가 + 쿠폰 금액, 쿠폰을 적용하면 그 금액만큼
  // 그대로 빠져서 최종가 = 참고 판매가가 된다. item.couponFlat(원)에 쿠폰 금액을 적어두면 이 경로를 탄다 —
  // 원본 엑셀은 이 상품들도 퍼센트 쿠폰과 같은 식(×1.16→×0.9)으로 계산해 뒀는데, 그건 틀린 값이었다.
  if (item && item.couponFlat != null) {
    const registered = listPrice + Number(item.couponFlat);
    return {
      hkdPrice, hkdShipping, total,
      preCoupon: registered, listPrice,
      couponOff: null, couponFlat: Number(item.couponFlat),
      finalPrice: listPrice, registered, winner: false,
    };
  }
  if (product && product.pricing === 'winner') {
    // 자동 판매가는 winnerRoundUnit(1,000원) 단위로 올림한다 — ×1.05는 수수료를 덮는 최소 가격이라 올림이 안전하다.
    // total×105는 정수라 나누기 결과가 딱 떨어지면 올림해도 그대로다.
    const step = config.winnerRoundUnit;
    const listPrice = Math.ceil(total * config.listPercent / (100 * step)) * step;
    // 아이템위너는 다른 판매자와 가격을 맞추려고 판매가를 직접 정하기도 한다 — item.manualPrice가 있으면
    // 그 값이 등록 가격이고, 없으면 계산한 판매가(×1.05)다.
    const manual = item && item.manualPrice != null && Number.isFinite(Number(item.manualPrice)) ? Number(item.manualPrice) : null;
    const registered = manual != null ? manual : listPrice;
    return {
      hkdPrice, hkdShipping, total,
      preCoupon: null, // 위너는 쿠폰을 먹이지 않아 쿠폰 적용 전 판매가가 없다
      listPrice, couponOff: null, finalPrice: registered, registered, manual, winner: true,
    };
  }
  // 등록 판매가(쿠폰 적용 전) 반올림 단위 — 아이소핑크는 100원 올림, 스티로폼은 10원 단위 반올림
  // (사용자 확인 2026-09-22, 엑셀 61행 전부와 정확히 일치), 열반사단열재는 100원 단위 반올림
  // (사용자 확인 2026-09-23, 표 16행 전부와 정확히 일치 — 올림이 아니라 반올림이라 아이소핑크와 다름).
  // 정수 연산만 써서 소수 오차를 피한다.
  const preCoupon = categoryId === 'hk_bead'
    ? Math.round(total * config.preCouponPercent / 1000) * 10
    : categoryId === 'hk_reflective'
      ? Math.round(total * config.preCouponPercent / unit) * config.roundUp
      : Math.ceil(total * config.preCouponPercent / unit) * config.roundUp;
  const couponOff = item && item.couponOff != null
    ? Number(item.couponOff)
    : (hkdShipping > 0 ? config.couponOffShipping : config.couponOffFree);
  return {
    hkdPrice,
    hkdShipping,
    total,
    preCoupon,
    listPrice,
    couponOff,
    finalPrice: Math.round(preCoupon * (100 - couponOff) / 100),
    registered: preCoupon,
    winner: false,
  };
}

/* 쿠팡_부자재(2026-09-22, 사용자가 준 엑셀 58행) — 다른 쿠팡 채널과 계산식이 다르다: 배송비를 더하지
   않고 부자재 판매가만 ×1.05 한 뒤 "100원 단위 반올림"(올림이 아니라 반올림, 엑셀 58행 전부와 일치
   확인)한다. 쿠폰·수수료 개념이 없는 단순 채널이라 전용 함수를 따로 둔다. */
function _hkCoupangSubPriceParts(productCode) {
  const hkdPrice = typeof window.hkSubPriceByCode === 'function' ? window.hkSubPriceByCode(productCode) : null;
  if (hkdPrice == null) return null;
  return { hkdPrice, registered: Math.round(hkdPrice * 1.05 / 100) * 100 };
}

function _hkChannelTargetPrice(categoryId, productCode, channelId, product, item) {
  // 아직 공통 원가표 상품코드가 없는 채널 전용 옵션은 받은 현재 판매가를 직접 기준값으로 쓴다.
  if (item && item.targetPrice != null && Number.isFinite(Number(item.targetPrice))) return Number(item.targetPrice);
  if (channelId === 'coupang_sub') return _hkCoupangSubPriceParts(productCode)?.registered ?? null;
  const config = HK_CHANNEL_CONFIG[channelId];
  if (config && config.layout === 'coupang') return _hkCoupangPriceParts(categoryId, productCode, config, item, product)?.registered ?? null;
  if (config && config.markupPercent) return _hkEsmPriceParts(categoryId, productCode, config, item)?.finalPrice ?? null;
  if (categoryId === 'hk_isopink' || categoryId === 'hk_bead') return _hkChannelHkdPrice(categoryId, productCode);
  if (categoryId === 'hk_sub' && typeof window.hkSubPriceByCode === 'function') return window.hkSubPriceByCode(productCode);
  if (categoryId === 'hk_reflective' && typeof window.hkReflectivePriceByCode === 'function') return window.hkReflectivePriceByCode(productCode);
  return null;
}

function _hkChannelItemName(categoryId, product, item) {
  if (item.productName) return item.productName;
  if (categoryId === 'hk_isopink') return _hkIsoProductNameFromCode(item.productCode);
  if (categoryId === 'hk_bead' && typeof window.hkBeadProductNameFromCode === 'function') return window.hkBeadProductNameFromCode(item.productCode);
  return product.productName || item.productCode;
}

function _hkChannelProductLink(channelId, product) {
  if (product.productUrl) return product.productUrl;
  if (channelId === 'hkd') return `https://smartstore.naver.com/hkdy/products/${product.productId}`;
  if (channelId === 'hkd_life') return `https://smartstore.naver.com/hkdylife/products/${product.productId}`;
  if (channelId === 'homepage') return `https://boonimall.kr/goods/view?no=${product.productId}`;
  // ESM 채널의 상품번호는 지마켓 상품코드(goodscode)다.
  if (channelId === 'esm') return `https://item.gmarket.co.kr/Item?goodscode=${product.productId}`;
  if (channelId === '11st') return `https://www.11st.co.kr/products/${product.productId}`;
  // 쿠팡: Product ID(노출상품ID)로 상품 페이지, 옵션은 뒤에 ?vendorItemId=옵션ID를 붙인다(_hkCoupangOptionLink).
  if (channelId === 'coupang') return `https://www.coupang.com/vp/products/${product.productId}`;
  return '';
}

/* 옵션 판매상태 — item.status: 없음(판매중) / 'soldout'(품절) / 'stopped'(판매중지).
   품절·판매중지 옵션은 스토어에 가격을 맞출 필요가 없으니 "반영 대기"에서 빠지고 표에서 흐리게
   보인다. DB에는 hk_settings.channel_options(js/pricing-hankook-db.js)로 저장된다. */
const HK_CHANNEL_STATUS = { soldout: '품절', stopped: '판매중지' };

/* 판매상태에 따른 재고수량 — 품절·판매중지 옵션은 재고 0으로 보여준다. 판매중으로 돌리면 원래 재고
   (item.stock, 없으면 표의 기본값)가 다시 나온다(item.stock 자체는 바꾸지 않으므로 저장값이 사라지지 않는다). */
const HK_CHANNEL_STATUS_STOCK = { soldout: 0, stopped: 0 };

function _hkChannelStock(item, defaultStock) {
  if (item.status && HK_CHANNEL_STATUS_STOCK[item.status] !== undefined) return HK_CHANNEL_STATUS_STOCK[item.status];
  return item.stock ?? defaultStock;
}

/* 재고수량 칸 — 상태 때문에 0이 된 경우 붉게 표시하고 이유를 툴팁으로 알려준다. */
function _hkChannelStockCellAttrs(item) {
  if (item.status && HK_CHANNEL_STATUS_STOCK[item.status] !== undefined) {
    return ` class="hk-stock-zero" title="${HK_CHANNEL_STATUS[item.status]} 상태라 재고수량 ${HK_CHANNEL_STATUS_STOCK[item.status]}으로 표시됩니다"`;
  }
  return '';
}

/* 상품의 기준가가 되는 옵션 순번 — 사용자가 지정한 옵션(product.baseCode)이 있으면 그것,
   없으면 판매중인 첫 옵션, 전부 품절·판매중지면 첫 옵션. 옵션추가금은 이 옵션 가격과의 차이. */
function _hkChannelBaseIndex(product) {
  const pinned = product.baseCode ? product.items.findIndex(item => item.productCode === product.baseCode) : -1;
  if (pinned >= 0) return pinned;
  const firstOnSale = product.items.findIndex(item => !item.status);
  return firstOnSale >= 0 ? firstOnSale : 0;
}

function _hkChannelFindProduct(channelId, productId) {
  return (HK_CHANNEL_LISTINGS[channelId] || []).find(product => String(product.productId) === String(productId));
}

/* 쿠팡 옵션 링크 — 상품 페이지에서 그 옵션(vendorItemId)이 선택된 상태로 열린다. */
function _hkCoupangOptionLink(channelId, product, item) {
  const base = _hkChannelProductLink(channelId, product);
  return base && item.optionId ? `${base}?vendorItemId=${item.optionId}` : '';
}

/* 한 카테고리의 상품표. 상품코드 해석은 카테고리별 가격 엔진에 맡기므로
   한국단열 탭 하나에 아이소핑크 외 모든 제품을 같은 형식으로 추가할 수 있다. */
function _hkChannelCategoryTableHtml(channelId, categoryId, products) {
  const layout = HK_CHANNEL_CONFIG[channelId]?.layout;
  if (layout === 'esm') return _hkEsmCategoryTableHtml(channelId, categoryId, products);
  if (layout === 'markupOptions') return _hkMarkupOptionsTableHtml(channelId, categoryId, products);
  if (layout === 'coupang') return _hkCoupangCategoryTableHtml(channelId, categoryId, products);
  const categoryLabel = HK_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
  const baseIndexByProduct = {};
  const baseByProduct = {};
  products.forEach(product => {
    baseIndexByProduct[product.productId] = _hkChannelBaseIndex(product);
    const baseItem = product.items[baseIndexByProduct[product.productId]];
    baseByProduct[product.productId] = product.basePrice != null
      ? Number(product.basePrice)
      : _hkChannelTargetPrice(categoryId, baseItem?.productCode, channelId, product, baseItem);
  });

  let rowsHtml = '';
  products.forEach((product, groupIndex) => {
    product.items.forEach((item, i) => {
      const targetPrice = _hkChannelTargetPrice(categoryId, item.productCode, channelId, product, item);
      const basePrice = baseByProduct[product.productId];
      const optionAdd = (targetPrice != null && basePrice != null) ? targetPrice - basePrice : null;
      const inactive = !!item.status;
      // 일부 실제 상품은 어느 옵션보다도 낮은 별도 기준가를 쓴다(2K·라이트폼 세트).
      const isBase = product.basePrice == null && i === baseIndexByProduct[product.productId];
      const priceDiff = (targetPrice != null && item.prevPrice != null) ? targetPrice - item.prevPrice : null;
      const shippingChanged = !inactive && item.prevShipping != null && product.baseShipping != null && item.prevShipping !== product.baseShipping;
      const priceChanged = !inactive && !!priceDiff;
      const productLink = _hkChannelProductLink(channelId, product);
      const productIdValue = productLink
        ? `<a href="${productLink}" target="_blank" rel="noopener noreferrer">${product.productId}</a>`
        : product.productId;
      const productIdCell = i === 0
        ? `<td class="hk-iso-listing-id" rowspan="${product.items.length}">${productIdValue}</td>`
        : '';
      const groupStartClass = (i === 0 && groupIndex > 0) ? ' hk-iso-listing-group-start' : '';
      const statusClass = inactive ? ` is-inactive is-${item.status}` : '';
      // 옵션이 둘 이상인 상품은 라디오로 기준가 옵션을 고른다(하나뿐이면 그 옵션이 곧 기준).
      const priceNumber = _hkIsoDraftNumber(targetPrice);
      const priceContent = product.items.length > 1 && product.basePrice == null
        ? `<label class="hk-base-pick" title="${isBase ? '이 상품의 기준가가 되는 옵션입니다' : '눌러서 이 옵션을 기준가로 지정'}"><input type="radio" name="hkbase-${channelId}-${product.productId}"${isBase ? ' checked' : ''} onchange="hkChannelSetBase('${channelId}','${product.productId}',${i})"><span>${priceNumber}</span></label>`
        : priceNumber;
      // 옵션이 하나뿐인 상품은 고를 다른 옵션이 없으니 경고하지 않는다.
      const baseInactive = isBase && inactive && product.items.length > 1;
      const baseTitle = baseInactive ? ' title="기준가 옵션이 품절·판매중지 상태입니다 — 다른 옵션을 기준으로 지정하세요"' : '';
      const statusOptions = [['', '판매중'], ['soldout', '품절'], ['stopped', '판매중지']]
        .map(([value, label]) => `<option value="${value}"${(item.status || '') === value ? ' selected' : ''}>${label}</option>`).join('');
      rowsHtml += `<tr class="${(groupStartClass + statusClass).trim()}">
        <td class="hk-iso-draft-name">${_hkChannelItemName(categoryId, product, item)}</td>
        <td class="hk-iso-draft-code">${item.displayCode ?? item.productCode}</td>
        ${productIdCell}
        <td class="hk-iso-ship-final-price${isBase ? ' is-base-option' : ''}${baseInactive ? ' is-base-inactive' : ''}${priceChanged ? ' is-changed' : ''}"${baseTitle}>${priceContent}</td>
        <td>${_hkIsoDraftNumber(basePrice)}</td>
        <td>${optionAdd == null ? '—' : _hkIsoDraftNumber(optionAdd)}</td>
        <td${_hkChannelStockCellAttrs(item)}>${_hkIsoDraftNumber(_hkChannelStock(item, 99999999))}</td>
        <td class="hk-iso-listing-status"><select class="hk-channel-status-select${inactive ? ' is-' + item.status : ''}" onchange="hkChannelSetStatus('${channelId}','${product.productId}',${i},this.value)" title="옵션 판매상태">${statusOptions}</select></td>
        <td>${_hkIsoDraftNumber(product.baseShipping)}</td>
        <td>${product.shippingBasis || '—'}</td>
        <td>${_hkIsoDraftNumber(product.jejuShipping)}</td>
        <td>${product.returnExchange || '—'}</td>
        <td class="hk-iso-listing-prev-price">${_hkIsoDraftNumber(item.prevPrice)}</td>
        <td class="hk-iso-listing-diff${priceChanged ? ' is-changed' : ''}">${priceDiff == null ? '—' : (priceDiff > 0 ? '+' : '') + _hkIsoDraftNumber(priceDiff)}</td>
        <td class="hk-iso-listing-prev-shipping${shippingChanged ? ' is-changed' : ''}">${_hkIsoDraftNumber(item.prevShipping)}</td>
      </tr>`;
    });
  });

  const optionCount = products.reduce((sum, product) => sum + product.items.length, 0);
  return `<div class="card pricing-cost-card hk-iso-channel-listing">
    <div class="pricing-result-header">
      <div class="pricing-result-title">${categoryLabel}<span class="pricing-spec-badge">상품 ${products.length} · 옵션 ${optionCount}</span></div>
      <span class="pricing-result-hint">상품코드 기준 현재 판매가와 수정 전 판매가 비교 · <span class="hk-base-legend">파란 칸</span> = 기준가 옵션(옵션 옆 동그라미를 눌러 변경)</span>
    </div>
    <div class="pricing-table-scroll">
      <table class="pricing-table hk-iso-draft-table hk-iso-listing-table">
        <colgroup>
          <col style="width:300px"><col style="width:130px"><col style="width:100px">
          <col style="width:120px"><col style="width:90px"><col style="width:100px">
          <col style="width:110px"><col style="width:110px"><col style="width:80px"><col style="width:90px">
          <col style="width:90px"><col style="width:100px"><col style="width:100px">
          <col style="width:100px"><col style="width:100px">
        </colgroup>
        <thead><tr>
          <th class="hk-iso-head-base">상품명</th>
          <th class="hk-iso-head-code">상품코드</th>
          <th class="hk-iso-head-base">상품ID</th>
          <th class="hk-iso-head-rate">현재 판매가</th>
          <th class="hk-iso-head-base">기준가</th>
          <th class="hk-iso-head-base">옵션추가금</th>
          <th class="hk-iso-head-base">재고수량</th>
          <th class="hk-iso-head-base">판매상태</th>
          <th class="hk-iso-head-base">배송비</th>
          <th class="hk-iso-head-base">배송비 기준</th>
          <th class="hk-iso-head-base">제주배송비</th>
          <th class="hk-iso-head-base">편도/교환</th>
          <th class="hk-iso-head-prev">수정 전 판매가</th>
          <th class="hk-iso-head-diff">차액</th>
          <th class="hk-iso-head-prev">수정 전 배송비</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  </div>`;
}

/* 쿠팡 채널 표 — Product ID(상품) 하나에 옵션 ID가 옵션마다 따로 있고, 옵션마다 가격이 독립이라
   기준가·옵션가 개념이 없다. 종류가 두 가지라(일반=쿠폰형, 위너) 칸을 이렇게 나눴다:
     계산 과정  : 총판매가 → 판매가(×1.05) → 쿠폰 적용 전 → 쿠폰 할인율 → 쿠폰 적용 최종
     수동 판매가: 위너 옵션만 입력 가능(다른 판매자와 가격을 맞추려고 직접 정한 가격)
     등록 판매가: 쿠팡에 실제로 입력하는 가격 — 초록 강조는 이 칸 하나만. 일반은 쿠폰 적용 전 판매가,
                  위너는 수동 판매가(있으면) 아니면 판매가(×1.05)
     수정 전 판매가·차액은 등록 판매가 기준, 메모는 옵션마다 자유롭게 남긴다(위너 관련 메모 등). */
function _hkCoupangCategoryTableHtml(channelId, categoryId, products) {
  const categoryLabel = HK_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
  const config = HK_CHANNEL_CONFIG[channelId];
  const num = _hkIsoDraftNumber;
  let rowsHtml = '';
  let optionCount = 0;
  let manualCount = 0;
  products.forEach((product, groupIndex) => {
    product.items.forEach((item, i) => {
      optionCount += 1;
      const parts = _hkCoupangPriceParts(categoryId, item.productCode, config, item, product);
      const registered = parts ? parts.registered : null;
      const isWinner = !!parts && parts.winner;
      const isManual = isWinner && parts.manual != null;
      if (isManual) manualCount += 1;
      const inactive = !!item.status;
      const priceDiff = (registered != null && item.prevPrice != null) ? registered - item.prevPrice : null;
      const priceChanged = !inactive && !!priceDiff;
      const link = _hkChannelProductLink(channelId, product);
      const idValue = link ? `<a href="${link}" target="_blank" rel="noopener noreferrer">${product.productId}</a>` : product.productId;
      const idCell = i === 0 ? `<td class="hk-iso-listing-id" rowspan="${product.items.length}">${idValue}</td>` : '';
      const statusOptions = [['', '판매중'], ['soldout', '품절'], ['stopped', '판매중지']]
        .map(([value, label]) => `<option value="${value}"${(item.status || '') === value ? ' selected' : ''}>${label}</option>`).join('');
      const rowClass = `${i === 0 && groupIndex > 0 ? 'hk-iso-listing-group-start' : ''}${inactive ? ` is-inactive is-${item.status}` : ''}`.trim();
      // 수동 판매가 — 위너 옵션만. 계산한 판매가와 얼마나 다른지 작게 보여준다.
      const manualGap = isManual ? parts.manual - parts.listPrice : 0;
      const manualCell = isWinner
        ? `<td class="hk-manual-cell${isManual ? ' is-manual' : ''}"><input type="text" inputmode="numeric" class="pricing-input-field hk-manual-input" value="${isManual ? parts.manual.toLocaleString() : ''}" placeholder="자동" title="다른 판매자와 가격을 맞추려고 직접 정한 판매가입니다. 비우면 계산한 판매가(×${config.listPercent / 100})를 씁니다." onchange="hkCoupangSetManualPrice('${channelId}','${product.productId}',${i},this.value)">${isManual ? `<small class="hk-manual-gap">계산가 ${manualGap > 0 ? '+' : ''}${num(manualGap)}</small>` : ''}</td>`
        : '<td class="hk-manual-cell is-none">—</td>';
      rowsHtml += `<tr class="${rowClass}">
        ${idCell}
        <td>${_hkCoupangOptionLink(channelId, product, item) ? `<a class="hk-option-link" href="${_hkCoupangOptionLink(channelId, product, item)}" target="_blank" rel="noopener noreferrer" title="쿠팡에서 이 옵션 열기">${item.optionId}</a>` : (item.optionId || '—')}</td>
        <td class="hk-iso-draft-name">${_hkChannelItemName(categoryId, product, item)}</td>
        <td class="hk-iso-draft-code">${item.productCode}</td>
        <td class="hk-iso-listing-status"><select class="hk-channel-status-select${inactive ? ' is-' + item.status : ''}" onchange="hkChannelSetStatus('${channelId}','${product.productId}',${i},this.value)" title="옵션 판매상태">${statusOptions}</select></td>
        <td>${num(parts?.hkdPrice)}</td>
        <td>${num(parts?.hkdShipping)}</td>
        <td>${num(parts?.total)}</td>
        <td>${num(parts?.listPrice)}</td>
        <td${isWinner ? ' title="위너 상품은 쿠폰을 먹이지 않아 쿠폰 적용 전 판매가가 없습니다"' : ''}>${isWinner ? '—' : num(parts?.preCoupon)}</td>
        <td class="hk-coupon-off is-off-${parts && parts.couponOff != null ? parts.couponOff : (parts && parts.couponFlat != null ? 'flat' : 'none')}"${isWinner ? ' title="위너 상품은 쿠폰을 먹이지 않고 판매가를 그대로 받습니다"' : (parts && parts.couponFlat != null ? ' title="퍼센트가 아니라 원 단위 정액 쿠폰입니다"' : '')}>${isWinner ? '쿠폰 없음' : (parts && parts.couponFlat != null ? num(parts.couponFlat) + '원' : (parts && parts.couponOff != null ? parts.couponOff + '%' : '—'))}</td>
        <td class="hk-price-final${isWinner ? ' is-plain' : ''}"${isWinner ? ' title="쿠폰이 없어서 등록 판매가와 같은 값입니다"' : ''}>${num(parts?.finalPrice)}</td>
        ${manualCell}
        <td class="hk-iso-ship-final-price${priceChanged ? ' is-changed' : ''}"${isManual ? ' title="수동 판매가를 쓰고 있습니다"' : ''}>${num(registered)}${isManual ? '<span class="hk-manual-tag">수동</span>' : ''}</td>
        <td class="hk-iso-listing-prev-price">${num(item.prevPrice)}</td>
        <td class="hk-iso-listing-diff${priceChanged ? ' is-changed' : ''}">${priceDiff == null ? '—' : (priceDiff > 0 ? '+' : '') + num(priceDiff)}</td>
        <td${_hkChannelStockCellAttrs(item)}>${num(_hkChannelStock(item, 99999))}</td>
        <td>${product.baseShipping ? num(product.baseShipping) : '무료'}</td>
        <td>${num(product.jejuShipping)}</td>
        <td>${product.returnExchange || '—'}</td>
        <td class="hk-memo-cell"><input type="text" class="pricing-input-field hk-memo-input" value="${_hkEscapeAttr(item.memo || '')}" placeholder="메모" oninput="hkCoupangSetMemo('${channelId}','${product.productId}',${i},this.value)"></td>
      </tr>`;
    });
  });

  const manualBadge = manualCount ? `<span class="hk-channel-status-badge is-manual">수동 판매가 ${manualCount}</span>` : '';
  return `<div class="card pricing-cost-card hk-iso-channel-listing">
    <div class="pricing-result-header">
      <div class="pricing-result-title">${categoryLabel}<span class="pricing-spec-badge">상품 ${products.length} · 옵션 ${optionCount}</span>${manualBadge}</div>
      <span class="pricing-result-hint">초록 칸 = <b>등록 판매가</b>(쿠팡에 입력하는 가격) · 일반: 쿠폰 적용 전 판매가(총판매가×${config.preCouponPercent / 100}, ${config.roundUp.toLocaleString()}원 올림)에 쿠폰(${config.couponOffShipping}%/${config.couponOffFree}%) · 위너: 쿠폰 없음, 수동 판매가가 있으면 그 값, 없으면 총판매가×${config.listPercent / 100}(${config.winnerRoundUnit.toLocaleString()}원 올림)</span>
    </div>
    <div class="pricing-table-scroll">
      <table class="pricing-table hk-iso-draft-table hk-iso-listing-table hk-esm-table hk-coupang-table">
        <colgroup>
          <col style="width:100px"><col style="width:105px"><col style="width:300px"><col style="width:140px"><col style="width:100px">
          <col style="width:100px"><col style="width:100px"><col style="width:110px"><col style="width:110px">
          <col style="width:130px"><col style="width:90px"><col style="width:130px">
          <col style="width:120px"><col style="width:130px"><col style="width:110px"><col style="width:100px">
          <col style="width:100px"><col style="width:90px"><col style="width:100px"><col style="width:100px"><col style="width:220px">
        </colgroup>
        <thead><tr>
          <th class="hk-iso-head-base">Product ID</th>
          <th class="hk-iso-head-base">옵션 ID</th>
          <th class="hk-iso-head-base">상품명</th>
          <th class="hk-iso-head-code">상품코드</th>
          <th class="hk-iso-head-base">판매상태</th>
          <th class="hk-iso-head-base">네이버<br>판매가</th>
          <th class="hk-iso-head-base">네이버<br>배송비</th>
          <th class="hk-iso-head-base">총판매가<br>(배송비 포함)</th>
          <th class="hk-iso-head-base">판매가<br>(×${config.listPercent / 100} 계산)</th>
          <th class="hk-iso-head-base">쿠폰 적용 전<br>판매가</th>
          <th class="hk-iso-head-base">쿠폰<br>할인율</th>
          <th class="hk-iso-head-base">쿠폰 적용<br>최종 판매가</th>
          <th class="hk-iso-head-manual">수동 판매가<br><span class="pricing-th-tiny">위너만 입력</span></th>
          <th class="hk-iso-head-rate">등록 판매가<br><span class="pricing-th-tiny">쿠팡에 입력</span></th>
          <th class="hk-iso-head-prev">수정 전 판매가</th>
          <th class="hk-iso-head-diff">차액</th>
          <th class="hk-iso-head-base">재고수량</th>
          <th class="hk-iso-head-base">배송비</th>
          <th class="hk-iso-head-base">제주배송비</th>
          <th class="hk-iso-head-base">교환/반품</th>
          <th class="hk-iso-head-base">메모</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  </div>`;
}

/* 옵션 판매가(수동) 입력 — 위너 옵션만. 비우면 계산한 판매가(×1.05)로 돌아간다. */
window.hkCoupangSetManualPrice = function(channelId, productId, index, value) {
  const item = _hkChannelFindProduct(channelId, productId)?.items[index];
  if (!item) return;
  const number = Math.round(Number(String(value).replace(/[^\d.]/g, '')));
  if (!String(value).trim() || !Number.isFinite(number) || number <= 0) delete item.manualPrice;
  else item.manualPrice = number;
  window._hkRefreshChannelListing();
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

/* 옵션 메모 — 글자를 칠 때마다 저장값만 바꾸고 표는 다시 그리지 않는다(입력 중인 칸이 풀리지 않게). */
window.hkCoupangSetMemo = function(channelId, productId, index, value) {
  const item = _hkChannelFindProduct(channelId, productId)?.items[index];
  if (!item) return;
  if (value.trim()) item.memo = value;
  else delete item.memo;
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

function _hkEscapeAttr(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
/* 11번가처럼 "상품 하나에 옵션 여럿 + 가격을 한국단열 판매가에서 계산"하는 채널 표. 상품번호를 옵션
   수만큼 묶어 보여주고, 옵션이 둘 이상이면 라디오로 기준가 옵션을 고른다(파란 칸). 옵션가 = 그 옵션
   최종 판매가 − 기준가 옵션 최종 판매가(음수 가능). 가격 규칙은 HK_CHANNEL_CONFIG[channelId]. */
function _hkMarkupOptionsTableHtml(channelId, categoryId, products) {
  const categoryLabel = HK_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
  const config = HK_CHANNEL_CONFIG[channelId];
  const channelLabel = config.label || channelId;
  const multiplier = (config.markupPercent / 100).toLocaleString();

  let rowsHtml = '';
  let optionCount = 0;
  products.forEach((product, groupIndex) => {
    const baseIndex = _hkChannelBaseIndex(product);
    const baseParts = _hkEsmPriceParts(categoryId, product.items[baseIndex]?.productCode, config, product.items[baseIndex]);
    const basePrice = baseParts ? baseParts.finalPrice : null;
    product.items.forEach((item, i) => {
      optionCount += 1;
      const parts = _hkEsmPriceParts(categoryId, item.productCode, config, item);
      const finalPrice = parts ? parts.finalPrice : null;
      const inactive = !!item.status;
      const isBase = i === baseIndex;
      const multi = product.items.length > 1;
      const baseInactive = isBase && inactive && multi;
      const priceDiff = (finalPrice != null && item.prevPrice != null) ? finalPrice - item.prevPrice : null;
      const priceChanged = !inactive && !!priceDiff;
      const optionAdd = (finalPrice != null && basePrice != null) ? finalPrice - basePrice : null;
      const link = _hkChannelProductLink(channelId, product);
      const idValue = link ? `<a href="${link}" target="_blank" rel="noopener noreferrer">${product.productId}</a>` : product.productId;
      const idCell = i === 0 ? `<td class="hk-iso-listing-id" rowspan="${product.items.length}">${idValue}</td>` : '';
      const priceNumber = _hkIsoDraftNumber(finalPrice);
      const priceContent = multi
        ? `<label class="hk-base-pick" title="${isBase ? '이 상품의 기준가가 되는 옵션입니다' : '눌러서 이 옵션을 기준가로 지정'}"><input type="radio" name="hkbase-${channelId}-${product.productId}"${isBase ? ' checked' : ''} onchange="hkChannelSetBase('${channelId}','${product.productId}',${i})"><span>${priceNumber}</span></label>`
        : priceNumber;
      const statusOptions = [['', '판매중'], ['soldout', '품절'], ['stopped', '판매중지']]
        .map(([value, label]) => `<option value="${value}"${(item.status || '') === value ? ' selected' : ''}>${label}</option>`).join('');
      const rowClass = `${i === 0 && groupIndex > 0 ? 'hk-iso-listing-group-start' : ''}${inactive ? ` is-inactive is-${item.status}` : ''}`.trim();
      rowsHtml += `<tr class="${rowClass}">
        ${idCell}
        <td class="hk-iso-draft-name">${_hkChannelItemName(categoryId, product, item)}</td>
        <td class="hk-iso-draft-code">${item.productCode}</td>
        <td class="hk-iso-listing-status"><select class="hk-channel-status-select${inactive ? ' is-' + item.status : ''}" onchange="hkChannelSetStatus('${channelId}','${product.productId}',${i},this.value)" title="옵션 판매상태">${statusOptions}</select></td>
        <td>${_hkIsoDraftNumber(parts?.hkdPrice)}</td>
        <td>${_hkIsoDraftNumber(parts?.hkdShipping)}</td>
        <td>${_hkIsoDraftNumber(parts?.total)}</td>
        <td>${_hkIsoDraftNumber(parts?.esmPrice)}</td>
        <td class="hk-iso-ship-final-price${isBase ? ' is-base-option' : ''}${baseInactive ? ' is-base-inactive' : ''}${priceChanged ? ' is-changed' : ''}"${baseInactive ? ' title="기준가 옵션이 품절·판매중지 상태입니다 — 다른 옵션을 기준으로 지정하세요"' : ''}>${priceContent}</td>
        <td>${_hkIsoDraftNumber(basePrice)}</td>
        <td>${optionAdd == null ? '—' : _hkIsoDraftNumber(optionAdd)}</td>
        <td class="hk-iso-listing-prev-price">${_hkIsoDraftNumber(item.prevPrice)}</td>
        <td class="hk-iso-listing-diff${priceChanged ? ' is-changed' : ''}">${priceDiff == null ? '—' : (priceDiff > 0 ? '+' : '') + _hkIsoDraftNumber(priceDiff)}</td>
      </tr>`;
    });
  });

  return `<div class="card pricing-cost-card hk-iso-channel-listing">
    <div class="pricing-result-header">
      <div class="pricing-result-title">${categoryLabel}<span class="pricing-spec-badge">상품 ${products.length} · 옵션 ${optionCount}</span></div>
      <span class="pricing-result-hint">${channelLabel} 최종 판매가 = (한국단열 판매가 + 배송비) × ${multiplier}, ${config.roundUp.toLocaleString()}원 단위 올림 · <span class="hk-base-legend">파란 칸</span> = 기준가 옵션(옵션 옆 동그라미를 눌러 변경)</span>
    </div>
    <div class="pricing-table-scroll">
      <table class="pricing-table hk-iso-draft-table hk-iso-listing-table hk-esm-table">
        <colgroup>
          <col style="width:120px"><col style="width:270px"><col style="width:150px"><col style="width:100px">
          <col style="width:110px"><col style="width:90px"><col style="width:110px"><col style="width:110px">
          <col style="width:130px"><col style="width:100px"><col style="width:100px"><col style="width:110px"><col style="width:100px">
        </colgroup>
        <thead><tr>
          <th class="hk-iso-head-base">상품번호</th>
          <th class="hk-iso-head-base">상품명</th>
          <th class="hk-iso-head-code">상품코드</th>
          <th class="hk-iso-head-base">판매상태</th>
          <th class="hk-iso-head-base">한국단열<br>판매가</th>
          <th class="hk-iso-head-base">한국단열<br>배송비</th>
          <th class="hk-iso-head-base">한국단열<br>총판매가</th>
          <th class="hk-iso-head-base">${channelLabel}<br>판매가</th>
          <th class="hk-iso-head-rate">${channelLabel} 최종<br>판매가</th>
          <th class="hk-iso-head-base">기준가</th>
          <th class="hk-iso-head-base">옵션가</th>
          <th class="hk-iso-head-prev">수정 전 판매가</th>
          <th class="hk-iso-head-diff">차액</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  </div>`;
}

/* ESM 채널 표 — 한국단열 표와 모양이 다르다. 상품마다 마스터상품번호·상품번호가 따로 있고(옵션 하나가
   상품 하나), 판매가는 한국단열 판매가+배송비에 배율을 곱해 올림한 값(HK_CHANNEL_CONFIG.esm)이다.
   그룹명이 같은 연속 행은 그룹명 칸 하나로 묶는다. */
function _hkEsmCategoryTableHtml(channelId, categoryId, products) {
  const categoryLabel = HK_CATEGORIES.find(c => c.id === categoryId)?.label || categoryId;
  const config = HK_CHANNEL_CONFIG[channelId];
  const rows = [];
  products.forEach(product => product.items.forEach((item, index) => rows.push({ product, item, index })));

  let rowsHtml = '';
  rows.forEach((row, r) => {
    const { product, item, index } = row;
    const parts = _hkEsmPriceParts(categoryId, item.productCode, config, item);
    const finalPrice = parts ? parts.finalPrice : null;
    const inactive = !!item.status;
    const priceDiff = (finalPrice != null && item.prevPrice != null) ? finalPrice - item.prevPrice : null;
    const priceChanged = !inactive && !!priceDiff;
    const startsGroup = r === 0 || rows[r - 1].product.groupName !== product.groupName;
    let groupCell = '';
    if (startsGroup) {
      let span = 1;
      while (rows[r + span] && rows[r + span].product.groupName === product.groupName) span += 1;
      groupCell = `<td class="hk-iso-listing-id" rowspan="${span}">${product.groupName || '—'}</td>`;
    }
    const statusOptions = [['', '판매중'], ['soldout', '품절'], ['stopped', '판매중지']]
      .map(([value, label]) => `<option value="${value}"${(item.status || '') === value ? ' selected' : ''}>${label}</option>`).join('');
    const rowClass = `${startsGroup && r > 0 ? 'hk-iso-listing-group-start' : ''}${inactive ? ` is-inactive is-${item.status}` : ''}`.trim();
    rowsHtml += `<tr class="${rowClass}">
      ${groupCell}
      <td>${product.masterId || '—'}</td>
      <td class="hk-esm-product-id">${_hkChannelProductLink(channelId, product) ? `<a href="${_hkChannelProductLink(channelId, product)}" target="_blank" rel="noopener noreferrer">${product.productId}</a>` : product.productId}</td>
      <td class="hk-iso-draft-name">${_hkChannelItemName(categoryId, product, item)}</td>
      <td class="hk-iso-draft-code">${item.productCode}</td>
      <td class="hk-iso-listing-status"><select class="hk-channel-status-select${inactive ? ' is-' + item.status : ''}" onchange="hkChannelSetStatus('${channelId}','${product.productId}',${index},this.value)" title="옵션 판매상태">${statusOptions}</select></td>
      <td>${_hkIsoDraftNumber(parts?.hkdPrice)}</td>
      <td>${_hkIsoDraftNumber(parts?.hkdShipping)}</td>
      <td>${_hkIsoDraftNumber(parts?.total)}</td>
      <td>${_hkIsoDraftNumber(parts?.esmPrice)}</td>
      <td class="hk-iso-ship-final-price${priceChanged ? ' is-changed' : ''}">${_hkIsoDraftNumber(finalPrice)}</td>
      <td class="hk-iso-listing-prev-price">${_hkIsoDraftNumber(item.prevPrice)}</td>
      <td class="hk-iso-listing-diff${priceChanged ? ' is-changed' : ''}">${priceDiff == null ? '—' : (priceDiff > 0 ? '+' : '') + _hkIsoDraftNumber(priceDiff)}</td>
    </tr>`;
  });

  const multiplier = (config.markupPercent / 100).toLocaleString();
  return `<div class="card pricing-cost-card hk-iso-channel-listing">
    <div class="pricing-result-header">
      <div class="pricing-result-title">${categoryLabel}<span class="pricing-spec-badge">상품 ${products.length} · 옵션 ${rows.length}</span></div>
      <span class="pricing-result-hint">ESM 최종 판매가 = (한국단열 판매가 + 배송비) × ${multiplier}, ${config.roundUp.toLocaleString()}원 단위 올림</span>
    </div>
    <div class="pricing-table-scroll">
      <table class="pricing-table hk-iso-draft-table hk-iso-listing-table hk-esm-table">
        <colgroup>
          <col style="width:150px"><col style="width:120px"><col style="width:110px"><col style="width:270px"><col style="width:150px">
          <col style="width:100px"><col style="width:110px"><col style="width:90px"><col style="width:110px">
          <col style="width:110px"><col style="width:120px"><col style="width:110px"><col style="width:100px">
        </colgroup>
        <thead><tr>
          <th class="hk-iso-head-base">그룹명</th>
          <th class="hk-iso-head-base">마스터상품번호</th>
          <th class="hk-iso-head-base">상품번호</th>
          <th class="hk-iso-head-base">상품명</th>
          <th class="hk-iso-head-code">상품코드</th>
          <th class="hk-iso-head-base">판매상태</th>
          <th class="hk-iso-head-base">한국단열<br>판매가</th>
          <th class="hk-iso-head-base">한국단열<br>배송비</th>
          <th class="hk-iso-head-base">한국단열<br>총판매가</th>
          <th class="hk-iso-head-base">ESM<br>판매가</th>
          <th class="hk-iso-head-rate">ESM 최종<br>판매가</th>
          <th class="hk-iso-head-prev">수정 전 판매가</th>
          <th class="hk-iso-head-diff">차액</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  </div>`;
}

/* 현재 판매가·배송비가 "수정 전" 값과 달라서 스토어에 반영해야 하는 옵션 목록.
   categoryId를 주면 그 제품 종류만 센다. */
function _hkChannelPendingItems(channelId, categoryId = 'all') {
  const pending = [];
  (HK_CHANNEL_LISTINGS[channelId] || []).forEach(product => {
    if (categoryId !== 'all' && product.categoryId !== categoryId) return;
    product.items.forEach(item => {
      if (item.status) return; // 품절·판매중지 옵션은 스토어 가격을 맞출 필요가 없다
      const target = _hkChannelTargetPrice(product.categoryId, item.productCode, channelId, product, item);
      const priceChanged = target != null && item.prevPrice != null && target !== item.prevPrice;
      const shippingChanged = item.prevShipping != null && product.baseShipping != null && item.prevShipping !== product.baseShipping;
      if (priceChanged || shippingChanged) pending.push({ product, item, target });
    });
  });
  return pending;
}

function _hkChannelPendingCount(channelId) {
  return _hkChannelPendingItems(channelId).length;
}

function _hkChannelStatusCounts(channelId) {
  const counts = { soldout: 0, stopped: 0 };
  (HK_CHANNEL_LISTINGS[channelId] || []).forEach(product => product.items.forEach(item => {
    if (item.status && counts[item.status] !== undefined) counts[item.status] += 1;
  }));
  return counts;
}

/* 옵션 판매상태 변경(판매중/품절/판매중지). 저장은 "단가표 저장"으로. */
window.hkChannelSetStatus = function(channelId, productId, index, value) {
  const item = _hkChannelFindProduct(channelId, productId)?.items[index];
  if (!item) return;
  if (value && HK_CHANNEL_STATUS[value]) item.status = value;
  else delete item.status;
  window._hkRefreshChannelListing();
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

/* 상품의 기준가 옵션 지정 — 이후 그 옵션이 기준가가 되고 다른 옵션의 옵션추가금이 다시 계산된다. */
window.hkChannelSetBase = function(channelId, productId, index) {
  const product = _hkChannelFindProduct(channelId, productId);
  const item = product?.items[index];
  if (!item) return;
  product.baseCode = item.productCode;
  window._hkRefreshChannelListing();
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

/* 수정 전 판매가·배송비는 "마지막으로 저장한 값"이다(2026-09-21, 사용자 지시로 "적용 완료" 버튼을
   없애고 자동화). 단가표를 저장할 때 모든 채널의 수정 전 값을 그 시점의 현재 판매가·배송비로
   맞춘다(js/pricing-hankook-db.js의 hkDbSave가 호출). 그래서 차액·반영 대기는 "마지막 저장
   이후에 고친 것"만 보여준다. 저장이 실패하면 돌려놓을 수 있게 되돌리기 함수를 준다. */
window.hkChannelAlignBaselines = function() {
  const backup = [];
  Object.entries(HK_CHANNEL_LISTINGS).forEach(([channelId, products]) => (products || []).forEach(product => {
    product.items.forEach(item => {
      backup.push([item, item.prevPrice, item.prevShipping]);
      const target = _hkChannelTargetPrice(product.categoryId, item.productCode, channelId, product, item);
      if (target != null) item.prevPrice = target;
      if (product.baseShipping != null) item.prevShipping = product.baseShipping;
    });
  }));
  return () => backup.forEach(([item, price, shipping]) => { item.prevPrice = price; item.prevShipping = shipping; });
};

function _hkChannelListingHtml(channelId) {
  const channelLabel = HK_CHANNELS.find(c => c.id === channelId)?.label || channelId;
  const products = HK_CHANNEL_LISTINGS[channelId] || [];
  if (!products.length) {
    return `<div class="card pricing-cost-card hk-iso-channel-listing">
      <div class="pricing-result-header"><div class="pricing-result-title">${channelLabel} — 몰별 적용·검증</div></div>
      <div class="pricing-coming-soon"><i class="fa-solid fa-store"></i><p>${channelLabel} 채널의 실제 등록 상품 자료는 아직 입력 전입니다.</p></div>
    </div>`;
  }

  const counts = products.reduce((result, product) => {
    result[product.categoryId] = (result[product.categoryId] || 0) + 1;
    return result;
  }, {});
  const filters = [{ id:'all', label:'전체', count:products.length }]
    .concat(HK_CATEGORIES.filter(category => counts[category.id]).map(category => ({ ...category, count:counts[category.id] })));
  const filterButtons = filters.map(filter => `<button type="button" class="hk-channel-category-filter${_activeHkChannelCategory === filter.id ? ' active' : ''}" onclick="setHkChannelCategory('${filter.id}',this)">${filter.label}<span>${filter.count}</span></button>`).join('');
  const visibleCategories = HK_CATEGORIES.filter(category => counts[category.id] && (_activeHkChannelCategory === 'all' || _activeHkChannelCategory === category.id));
  const optionCount = products.reduce((sum, product) => sum + product.items.length, 0);
  const pending = _hkChannelPendingCount(channelId);
  const statusCounts = _hkChannelStatusCounts(channelId);
  const statusBadges = [['soldout', '품절'], ['stopped', '판매중지']]
    .filter(([key]) => statusCounts[key])
    .map(([key, label]) => `<span class="hk-channel-status-badge is-${key}">${label} ${statusCounts[key]}</span>`).join('');

  return `<div class="hk-channel-catalog-header card pricing-cost-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">${channelLabel} — 몰별 적용·검증<span class="pricing-spec-badge">전체 상품 ${products.length} · 옵션 ${optionCount}</span><span class="hk-channel-pending-badge${pending ? ' has-pending' : ''}">반영 대기 ${pending}</span>${statusBadges}</div>
        <span class="pricing-result-hint">수정 전 판매가·배송비 = 마지막으로 저장한 값 (단가표를 저장하면 현재 값으로 바뀝니다)</span>
      </div>
      <div class="hk-channel-category-filters">${filterButtons}</div>
    </div>
    ${visibleCategories.map(category => _hkChannelCategoryTableHtml(channelId, category.id, products.filter(product => product.categoryId === category.id))).join('')}`;
}

window.setHkChannelCategory = function(categoryId) {
  _activeHkChannelCategory = categoryId;
  window._hkRefreshChannelListing();
};

/* 채널 탭은 특정 품목 화면과 무관한 전사 상품 목록이다. */
window._hkRefreshChannelListing = function() {
  const section = document.getElementById('hkChannelListingSection');
  if (!section) return;
  // 다시 그려도 표를 옆으로 넘겨 보던 위치는 유지한다(상태·기준 옵션을 바꿀 때마다 왼쪽 끝으로 튀지 않게).
  const scrolls = [...section.querySelectorAll('.pricing-table-scroll')].map(el => el.scrollLeft);
  section.innerHTML = _hkChannelListingHtml(window._activeHkChannel);
  section.querySelectorAll('.pricing-table-scroll').forEach((el, index) => { if (scrolls[index]) el.scrollLeft = scrolls[index]; });
  _hkFreezeListingColumns(section);
};

/* 엑셀의 "틀 고정"처럼 몰별 표의 왼쪽 열(상품코드 열까지)을 좌우로 스크롤해도 화면에 남겨 둔다.
   쿠팡 표만 고정한다(열이 21개로 길어서 — 다른 채널은 짧아서 없는 게 낫다는 사용자 지시 2026-09-21).
   상품ID·Product ID처럼 세로로 병합된(rowspan) 칸이 있는 행은 칸 개수가 달라서, 자식 순서가 아니라
   병합을 반영한 열 번호로 위치(left)를 정한다. 고정한 칸이 투명하면 뒤로 지나가는 내용이 비쳐 보이니
   흰 배경을 깔아준다(이미 색이 있는 칸은 그대로). */
function _hkFreezeListingColumns(root) {
  root.querySelectorAll('table.hk-coupang-table').forEach(table => {
    const headRow = table.tHead && table.tHead.rows[0];
    if (!headRow) return;
    const codeIndex = [...headRow.cells].findIndex(th => th.textContent.trim() === '상품코드');
    if (codeIndex < 0) return;
    const count = codeIndex + 1;
    // 실제 화면에 그려진 열 너비를 우선 쓰고(표가 넓어서 열이 늘어날 수 있음), 아직 안 그려졌으면(숨김) 선언한 폭으로 대신한다.
    let widths = [...headRow.cells].slice(0, count).map(th => th.getBoundingClientRect().width);
    if (widths.some(width => !width)) {
      widths = [...table.querySelectorAll('colgroup col')].slice(0, count).map(col => parseFloat(col.style.width) || 0);
    }
    if (widths.length < count || widths.some(width => !width)) return;
    const lefts = [];
    let offset = 0;
    widths.forEach(width => { lefts.push(offset); offset += width; });

    const occupied = []; // 열 번호별로 위 행에서 내려온 rowspan이 남은 행 수
    [...table.rows].forEach(tr => {
      let col = 0;
      const blocked = occupied.slice();
      [...tr.cells].forEach(cell => {
        while (blocked[col] > 0) col += 1;
        const span = cell.colSpan || 1;
        if (span === 1 && col < count) {
          cell.classList.add('hk-freeze');
          cell.style.left = `${lefts[col]}px`;
          if (col === count - 1) cell.classList.add('hk-freeze-last');
          if (cell.tagName === 'TD') {
            const bg = getComputedStyle(cell).backgroundColor;
            if (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') cell.style.backgroundColor = '#fff';
          }
        }
        for (let k = 0; k < span; k++) occupied[col + k] = cell.rowSpan || 1;
        col += span;
      });
      for (let i = 0; i < occupied.length; i++) occupied[i] = Math.max(0, (occupied[i] || 0) - 1);
    });
  });
}

function renderHkIsopinkPane() {
  const marginCard = _hkIsoDraftMarginCard();
  const superTabs = HK_ISO_SUPER_TABS.map((s, index) => `
    <button class="bead-subtab${index === 0 ? ' active' : ''}" onclick="setHkIsoSuperTab('${s.id}',this)">${s.label}<span class="bead-subtab-sub">${s.sub}</span></button>`
  ).join('');
  const superPanes = HK_ISO_SUPER_TABS.map((s, index) => `
    <div id="hkIsoSuper-${s.id}" class="hk-iso-super-pane${index === 0 ? ' active' : ''}">
      <div class="hk-iso-accordion-list" id="hkIsoAccordionList-${s.id}">
        ${s.accordions.map((acc, ai) => _hkIsoAccordionSectionHtml(acc, ai === 0)).join('')}
      </div>
    </div>`
  ).join('');

  return `<div id="hkIsoBaseDataSection">
    ${marginCard}<div class="card pricing-result-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">한국단열 아이소핑크 기준 판매가<span class="pricing-spec-badge">원가·배송 통합</span></div>
      </div>
      <div class="bead-subtab-bar" id="hkIsoSuperTabBar">${superTabs}</div>
      ${superPanes}
    </div>
  </div>`;
}

/* 상위 탭(일반/접착식/쿠팡 위너) 전환 — 각 탭 안 아코디언은 열고 닫은 상태를
   그대로 유지한다(탭을 다시 눌러도 초기화하지 않음). */
window.setHkIsoSuperTab = function(superId, el) {
  document.querySelectorAll('#hkIsoSuperTabBar .bead-subtab').forEach(button => button.classList.remove('active'));
  document.querySelectorAll('.hk-iso-super-pane').forEach(pane => pane.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('hkIsoSuper-' + superId)?.classList.add('active');
  _lockHkIsoRowPriceEditors();
};

/* 아코디언 머리글 클릭 — 그 아코디언만 독립적으로 열고 닫는다(다 접을 수도,
   다 펼칠 수도 있음. 다른 아코디언 상태에는 영향 없음). */
window.toggleHkIsoAccordion = function(accId) {
  document.getElementById('hkIsoAcc-' + accId)?.classList.toggle('open');
  _lockHkIsoRowPriceEditors();
};

function _lockHkIsoRowPriceEditors() {
  document.querySelectorAll('.hk-iso-final-price-input').forEach(input => {
    input.readOnly = true;
    input.closest('.hk-iso-draft-price')?.classList.remove('editing');
  });
}

window.beginHkIsoRowPriceEdit = function(source) {
  const cell = source.closest('.hk-iso-draft-price');
  const input = cell?.querySelector('.hk-iso-final-price-input');
  if (!input) return;
  input.dataset.editStartPrice = String(_hkIsoDraftParseNumber(input.value));
  input.readOnly = false;
  cell.classList.add('editing');
  input.focus();
  input.select();
};

window.finishHkIsoRowPriceEdit = function(input) {
  window.formatHkIsoDraftPrice(input);
  input.readOnly = true;
  input.closest('.hk-iso-draft-price')?.classList.remove('editing');
  window.updateHkIsoPriceHistory(input);
};

window.updateHkIsoPriceHistory = function(input) {
  const cell = input.closest('.hk-iso-draft-price');
  const history = cell?.querySelector('.hk-iso-price-history');
  if (!history) return;
  const originalPrice = Number(input.dataset.originalPrice || 0);
  const currentPrice = _hkIsoDraftParseNumber(input.value);
  const changed = currentPrice !== originalPrice;
  history.hidden = !changed;
  cell.classList.toggle('changed', changed);
};

window.revertHkIsoRowPrice = function(button) {
  const cell = button.closest('.hk-iso-draft-price');
  const input = cell?.querySelector('.hk-iso-final-price-input');
  if (!input) return;
  input.value = Number(input.dataset.originalPrice || 0).toLocaleString();
  window.recalcHkIsoDraftRow(input);
  window.updateHkIsoPriceHistory(input);
  input.readOnly = true;
  cell.classList.remove('editing');
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

window.handleHkIsoRowPriceKey = function(event, input) {
  if (event.key === 'Enter') input.blur();
  if (event.key === 'Escape') {
    input.value = Number(input.dataset.editStartPrice || input.dataset.originalPrice || 0).toLocaleString();
    window.recalcHkIsoDraftRow(input);
    window.updateHkIsoPriceHistory(input);
    input.blur();
  }
};

window.openHkIsoDraftMarginModal = function() {
  const modal = document.getElementById('hkIsoMarginModal');
  const body = document.getElementById('hkIsoMarginModalBody');
  if (!modal || !body) return;
  const rows = Object.entries(HK_ISO_DRAFT_EXTRA_MARGINS).map(([thickness, margin]) => {
    const baseCost = _hkIsoDraftBaseCost(Number(thickness));
    return `<tr>
      <td class="pim-td-t">${thickness}T</td>
      <td class="hk-iso-base-cost-preview">${_hkIsoDraftNumber(baseCost)}</td>
      <td><input type="text" inputmode="numeric" id="hkIsoMarginModal-${thickness}" class="pim-input pim-input-margin" value="${margin}" style="width:82px" oninput="previewHkIsoDraftMargin(${thickness},this)"></td>
      <td class="hk-iso-applied-cost-preview" data-modal-thickness="${thickness}">${_hkIsoDraftNumber(baseCost + Number(margin))}</td>
    </tr>`;
  }).join('');
  body.innerHTML = `<div class="pim-section-title">아이소핑크 — 두께별 추가마진 (원/mm)</div>
    <div class="pim-margin-hint">추가마진은 구간 기본 원가에 더해집니다. 음수를 입력하면 기본 원가보다 낮아집니다.</div>
    <div class="pim-table-scroll-wrap">
      <table class="pim-table pim-margin-only-table hk-iso-margin-modal-table">
        <thead><tr><th>두께</th><th>기본 원가</th><th>추가마진</th><th>적용 원가</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  modal.style.display = 'flex';
};

window.closeHkIsoDraftMarginModal = function() {
  const modal = document.getElementById('hkIsoMarginModal');
  if (modal) modal.style.display = 'none';
};

/* 접착 가공비(접착식 원장 한 장당 원가에 더하는 고정 금액) 편집 창 */
window.openHkIsoAdhesiveModal = function() {
  const modal = document.getElementById('hkIsoAdhesiveModal');
  const input = document.getElementById('hkIsoAdhesiveFeeInput');
  if (!modal || !input) return;
  input.value = HK_ISO_DRAFT_ADHESIVE_ADDON.toLocaleString();
  modal.style.display = 'flex';
  input.focus();
  input.select();
};

window.closeHkIsoAdhesiveModal = function() {
  const modal = document.getElementById('hkIsoAdhesiveModal');
  if (modal) modal.style.display = 'none';
};

window.confirmHkIsoAdhesiveModal = function() {
  const input = document.getElementById('hkIsoAdhesiveFeeInput');
  if (!input) return;
  const fee = _hkIsoDraftParseNumber(input.value);
  if (fee !== HK_ISO_DRAFT_ADHESIVE_ADDON) {
    HK_ISO_DRAFT_ADHESIVE_ADDON = fee;
    Object.values(HK_ISO_CONNECTED_DRAFTS).forEach(draft => {
      if (Number(draft.fixedCostAddon) > 0) draft.fixedCostAddon = fee;
    });
    window.updateHkIsoDraftFixedCost('shared', { value: fee });
    // 스티로폼 접착식 행도 같은 접착 가공비를 쓴다(js/pricing-hankook-bead.js).
    if (typeof window.hkBeadApplyUnits === 'function') window.hkBeadApplyUnits();
    if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
  }
  closeHkIsoAdhesiveModal();
};

window.hkIsoSetBaseMonth = function(value) {
  HK_ISO_DRAFT_BASE_MONTH = String(value || '');
  // 단가 기준 년월은 한국단열 전체에 하나다 — 아이소핑크·스티로폼 카드의 입력칸을 같이 맞춘다.
  ['hkIsoBaseMonth', 'hkBeadBaseMonth', 'hkSubBaseMonth'].forEach(id => {
    const input = document.getElementById(id);
    if (input && input.value !== HK_ISO_DRAFT_BASE_MONTH) input.value = HK_ISO_DRAFT_BASE_MONTH;
  });
};

window.previewHkIsoDraftMargin = function(thickness, input) {
  const preview = document.querySelector(`.hk-iso-applied-cost-preview[data-modal-thickness="${thickness}"]`);
  if (preview) preview.textContent = _hkIsoDraftNumber(_hkIsoDraftBaseCost(thickness) + _hkIsoDraftParseNumber(input.value));
};

window.confirmHkIsoDraftMarginModal = function() {
  Object.keys(HK_ISO_DRAFT_EXTRA_MARGINS).forEach(thickness => {
    const input = document.getElementById(`hkIsoMarginModal-${thickness}`);
    if (input) HK_ISO_DRAFT_EXTRA_MARGINS[thickness] = _hkIsoDraftParseNumber(input.value);
  });
  Object.keys(HK_ISO_DRAFT_EXTRA_MARGINS).forEach(thickness => _hkIsoDraftApplySharedCost(Number(thickness)));
  closeHkIsoDraftMarginModal();
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

function _hkIsoDraftApplySharedCost(thickness) {
  const baseCost = _hkIsoDraftBaseCost(thickness);
  const extraMargin = Number(HK_ISO_DRAFT_EXTRA_MARGINS[thickness] || 0);
  const appliedCost = baseCost + extraMargin;
  document.querySelectorAll(`.hk-iso-base-cost-preview[data-thickness="${thickness}"]`).forEach(cell => {
    cell.textContent = _hkIsoDraftNumber(baseCost);
  });
  document.querySelectorAll(`.hk-iso-applied-cost-preview[data-thickness="${thickness}"]`).forEach(cell => {
    cell.textContent = _hkIsoDraftNumber(appliedCost);
  });
  window.updateHkIsoDraftMargin('shared', Number(thickness), { value: appliedCost });
}

window.updateHkIsoDraftBaseCost = function(band) {
  Object.keys(HK_ISO_DRAFT_EXTRA_MARGINS).forEach(thickness => {
    if (_hkIsoDraftBaseBand(thickness) === band) _hkIsoDraftApplySharedCost(Number(thickness));
  });
};

/* 행 하나의 원가(mm당 원가 × 두께 + 접착 가공비)를 새로 계산해서 판매원가·예상판매가·마진을 갱신한다.
   아이소핑크(두께별 추가마진)와 스티로폼(등급·원장별 원가)이 함께 쓴다. */
function _hkIsoDraftApplyRowCost(row, thickness, marginPerMm) {
  const saleSize = row.dataset.saleSize;
  const divisor = _hkIsoDraftDivisor(saleSize);
  const quantity = Number(saleSize.split('-').pop()) || 1;
  const fixedCostAddon = _hkIsoDraftParseNumber(row.dataset.fixedCostAddon);
  const sheetCost = marginPerMm * Number(thickness) + fixedCostAddon;
  const rawSaleCost = sheetCost / divisor * quantity;
  const saleCost = Math.round(rawSaleCost);
  const referenceMargin = _hkIsoDraftParseNumber(row.dataset.referenceMargin);
  const shipping = _hkIsoDraftParseNumber(row.dataset.shipping);
  const expectedPrice = _hkIsoDraftExpectedPrice(rawSaleCost, referenceMargin, shipping);
  row.dataset.saleCost = saleCost;
  row.dataset.saleCostRaw = rawSaleCost;
  row.dataset.sheetCost = sheetCost;
  row.dataset.marginPerMm = marginPerMm;
  row.querySelector('.hk-iso-draft-sale-cost').textContent = _hkIsoDraftNumber(saleCost);
  row.querySelector('.hk-iso-draft-expected-price').textContent = _hkIsoDraftNumber(expectedPrice);
  if (row.querySelector('.hk-iso-draft-name').textContent.trim()) {
    row.querySelector('.hk-iso-draft-sheet-cost').textContent = _hkIsoDraftNumber(sheetCost);
    row.querySelector('.hk-iso-draft-margin-per-mm').textContent = _hkIsoDraftNumber(marginPerMm);
  }
  // 원장 판매가 칸이 원가와 같은 표(스티로폼 KS 표)는 원가를 따라간다.
  if (row.dataset.sheetFollow === '1') row.children[4].textContent = _hkIsoDraftNumber(sheetCost);
  const finalPriceInput = row.querySelector('.hk-iso-final-price-input');
  if (finalPriceInput) window.recalcHkIsoDraftRow(finalPriceInput);
}

window.updateHkIsoDraftMargin = function(tabId, thickness, input) {
  const marginPerMm = _hkIsoDraftParseNumber(input.value);
  // 'shared'는 아이소핑크 공통 원가 — 스티로폼 행(data-line="bead")은 자기 원가를 따로 쓰니 건드리지 않는다.
  const rowSelector = tabId === 'shared'
    ? `.hk-iso-draft-table tbody tr[data-thickness="${thickness}"]:not([data-line="bead"])`
    : `.hk-iso-draft-table tbody tr[data-draft-tab="${tabId}"][data-thickness="${thickness}"]`;
  document.querySelectorAll(rowSelector).forEach(row => _hkIsoDraftApplyRowCost(row, thickness, marginPerMm));
};

window.updateHkIsoDraftFixedCost = function(tabId, input) {
  const fixedCostAddon = _hkIsoDraftParseNumber(input.value);
  const thicknesses = new Set();
  const rowSelector = tabId === 'shared'
    ? '.hk-iso-draft-table tbody tr[data-is-adhesive="1"]'
    : `.hk-iso-draft-table tbody tr[data-draft-tab="${tabId}"]`;
  document.querySelectorAll(rowSelector).forEach(row => {
    row.dataset.fixedCostAddon = fixedCostAddon;
    thicknesses.add(row.dataset.thickness);
  });
  thicknesses.forEach(thickness => {
    if (tabId === 'shared') {
      _hkIsoDraftApplySharedCost(Number(thickness));
    } else {
      const marginInput = document.querySelector(`.hk-iso-draft-margin-input[data-draft-tab="${tabId}"][data-thickness="${thickness}"]`);
      if (marginInput) window.updateHkIsoDraftMargin(tabId, Number(thickness), marginInput);
    }
  });
};

window.recalcHkIsoDraftRow = function(input) {
  const row = input.closest('tr');
  if (!row) return;
  const saleCost = row.dataset.saleCostRaw !== undefined
    ? _hkIsoDraftParseNumber(row.dataset.saleCostRaw)
    : _hkIsoDraftParseNumber(row.dataset.saleCost);
  const shipping = _hkIsoDraftParseNumber(row.dataset.shipping);
  const price = _hkIsoDraftParseNumber(input.value);
  const rawMargin = price - saleCost;
  const margin = Math.round(rawMargin);
  const fee = Math.round(price * 0.06);
  const vat = Math.round(price * 0.10);
  const rawNetMargin = rawMargin - fee - vat - shipping;
  const netMargin = Math.round(rawNetMargin);
  const rate = price > 0 ? Math.round(rawNetMargin / price * 100) : 0;
  row.querySelector('.hk-iso-draft-margin').textContent = _hkIsoDraftNumber(margin);
  row.querySelector('.hk-iso-draft-fee').textContent = _hkIsoDraftNumber(fee);
  row.querySelector('.hk-iso-draft-vat').textContent = _hkIsoDraftNumber(vat);
  row.querySelector('.hk-iso-draft-net-margin').textContent = _hkIsoDraftNumber(netMargin);
  row.querySelector('.hk-iso-draft-rate').textContent = _hkIsoDraftNumber(rate, '%');
  _hkIsoDraftUpdateRowTooltip(row);
  _hkIsoRefreshUnifiedRowElement(row);
};

window.formatHkIsoDraftPrice = function(input) {
  const value = _hkIsoDraftParseNumber(input.value);
  input.value = value ? value.toLocaleString() : '';
};

document.addEventListener('click', function(event) {
  const modal = document.getElementById('hkIsoMarginModal');
  if (modal && event.target === modal) closeHkIsoDraftMarginModal();
  const adhesiveModal = document.getElementById('hkIsoAdhesiveModal');
  if (adhesiveModal && event.target === adhesiveModal) closeHkIsoAdhesiveModal();
  const shippingModal = document.getElementById('hkIsoShippingModal');
  if (shippingModal && event.target === shippingModal) closeHkIsoShippingModal();
});

/* 한국단열 단가표에 진입할 때 항상 맨 앞의 아이소핑크(일반 > 600x900 일반)부터
   보여준다 — 아코디언을 전부 접어놓고 나갔다 들어와도 다시 첫 아코디언만 열어준다. */
window.resetHkPricingView = function() {
  const firstCategoryButton = document.querySelector('#hkCategoryTabs .pricing-tab');
  const firstSuperButton = document.querySelector('#hkIsoSuperTabBar .bead-subtab');
  window.setHkPricingTab(HK_CATEGORIES[0].id, firstCategoryButton);
  window.setHkIsoSuperTab(HK_ISO_SUPER_TABS[0].id, firstSuperButton);
  const firstSuperTab = HK_ISO_SUPER_TABS[0];
  if (firstSuperTab && firstSuperTab.accordions[0]) {
    const list = document.getElementById('hkIsoAccordionList-' + firstSuperTab.id);
    list?.querySelectorAll('.hk-iso-accordion').forEach(section => {
      section.classList.toggle('open', section.id === 'hkIsoAcc-' + firstSuperTab.accordions[0].id);
    });
  }
  _lockHkIsoRowPriceEditors();
  // 처음 들어올 때 한 번 DB에서 저장값을 불러온다(js/pricing-hankook-db.js).
  if (typeof window.hkDbEnsureLoaded === 'function') window.hkDbEnsureLoaded();
};
