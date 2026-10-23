/* ═══════════════════════════════════════
   한국단열 네이버 쿠폰 — 추가상품 옆 '쿠폰' 탭 (2026-10-20, 사용자 요청)

   네이버 쿠폰은 상품 하나만 빼지 못하고 **혜택 자체를 중지**해야 한다(사용자). 그래서 화면은 쿠폰 단위이고,
   [신규 쿠폰 등록]과 [중지]를 여기서 기록한다. 이 탭은 **기록용**이다 — 네이버 판매자센터에 실제로 발행·중지하는 기능은 아니고,
   판매자센터에서 한 일을 여기도 맞춰 두는 장부다(가격 계산에는 쓰이지 않는다).

   - 저장: hk_settings 의 key 'coupon_list' 한 줄(JSON, SQL 변경 없음). 단가표 [저장]과는 따로 이 탭의 [쿠폰 저장]으로 저장한다.
     (그래서 pricing-hankook-db.js 의 단가 상태 불러오기에서는 이 key를 뺀다 — 최근 저장 시각에 안 섞이게)
   - 저장값이 없으면 아래 HK_COUPON_DEFS(2026.04.17 자료)를 처음 값으로 보여 준다. 쿠폰은 전부 "알림받기 쿠폰".
   - 규칙(사용자 확인 2026-10-20): 중복할인 쿠폰은 최소구매 70,000원 이상이 일반적이고 배송비할인 쿠폰은 금액과 무관하다.
   - 보기 전용(pricing-view.html)·관리자가 아닌 사용자에게는 등록·중지·저장 버튼이 나오지 않는다.
═══════════════════════════════════════ */

// 쿠폰 정의 — products는 그 쿠폰이 걸린 상품번호(사용자가 준 쿠폰 목록 그대로)
// 저장값이 없을 때 처음 보여 주는 값이다(DB에 저장하면 그 값이 우선). 새 쿠폰·중지는 화면에서 하고 [쿠폰 저장]으로 DB에 남긴다.
const HK_COUPON_DEFS = [
  { no: 1, kind: '배송비할인', amount: 500,  min: 0,     products: '2229818356,3020442618,439103571,439904706,442086644,3736232926,7875494911,3950655401,3950515541,3505478787,2216673728,446014684,437331834,3781080651,3780749543,3402310018,10923727373' },
  { no: 2, kind: '배송비할인', amount: 1000, min: 0,     products: '8456757485,8324347562,8324352040,11097629335,8324375715,8324406068,8131395351,10181586522,10181582241,10181571912,10181564057,10181453964,10912518316,614497979,10683699346,2599610352' },
  { no: 3, kind: '배송비할인', amount: 2000, min: 0,     products: '2599698654,349222019,2599273590,2599242583' },
  { no: 4, kind: '중복할인',   amount: 1000, min: 70000, products: '5695312387,4995022274,2913417918,5763066244,5759250443,12936160195,10471290026,623737324,505443624,10682944267,11243899862,12605232942,628487624,11356673932,10609463678,669533622,7934125826,647994348,11502054249,11351466629,11351478928,11355611905,4654882496,4650594055,5009082205,4609308307,5012855593,11984357778' },
  { no: 5, kind: '중복할인',   amount: 2000, min: 70000,     products: '5697937041,10628616594,2599158337,2598880337,2448558544,3394369231,4705673971' },
];

// 상품별 목록 — [상품번호, 구분, 쿠폰종류, 할인액, 최소구매(표 원문, 빈칸은 0), 배송비(0이면 무료), 비고]
const HK_COUPON_ROWS = [
  ['2229818356', '아이소핑크', '배송비할인', 500, 0, 6000, '430 / 600 저티'],
  ['3020442618', '아이소핑크', '배송비할인', 500, 0, 6000, '430 / 600 저티'],
  ['439103571', '아이소핑크', '배송비할인', 500, 0, 6000, '430 / 600 저티'],
  ['439904706', '아이소핑크', '배송비할인', 500, 0, 6000, '430 / 600 ~100T 메인상품'],
  ['442086644', '아이소핑크', '배송비할인', 500, 0, 6000, '430 / 600 70T 100T'],
  ['3736232926', '아이소핑크', '배송비할인', 500, 0, 6000, '접아 모음전'],
  ['8456757485', '아이소핑크', '배송비할인', 1000, 0, 11700, '20T 원장 단품'],
  ['8324347562', '아이소핑크', '배송비할인', 1000, 0, 13000, '70T 원장 단품'],
  ['8324352040', '아이소핑크', '배송비할인', 1000, 0, 17000, '100T 원장 단품'],
  ['11097629335', '아이소핑크', '배송비할인', 1000, 0, 11700, '30T 원장 단품'],
  ['8324375715', '아이소핑크', '배송비할인', 1000, 0, 10000, '40T 원장 단품'],
  ['8324406068', '아이소핑크', '배송비할인', 1000, 0, 10400, '10T 원장 단품'],
  ['8131395351', '아이소핑크', '배송비할인', 1000, 0, 10400, '50T 원장 단품'],
  ['5697937041', '아이소핑크', '상품중복할인', 2000, 0, 0, '70T~500T 원장'],
  ['5695312387', '아이소핑크', '상품중복할인', 1000, 70000, 0, '원장 모음전'],
  ['4995022274', '아이소핑크', '상품중복할인', 1000, 70000, 0, '600 100T~500T'],
  ['10181586522', '아이소핑크(접착식)', '배송비할인', 1000, 0, 10400, '접아 50T 원장 단품'],
  ['10181582241', '아이소핑크(접착식)', '배송비할인', 1000, 0, 10000, '접아 40T 원장 단품'],
  ['10181571912', '아이소핑크(접착식)', '배송비할인', 1000, 0, 11700, '접아 30T 원장 단품'],
  ['10181564057', '아이소핑크(접착식)', '배송비할인', 1000, 0, 11700, '접아 20T 원장 단품'],
  ['10181453964', '아이소핑크(접착식)', '배송비할인', 1000, 0, 10400, '접아 10T 원장 단품'],
  ['7875494911', '스티로폼', '배송비할인', 500, 0, 6000, '430 / 600 스 30T'],
  ['3950655401', '스티로폼', '배송비할인', 500, 0, 6000, '접스 접아 모음전'],
  ['3950515541', '스티로폼', '배송비할인', 500, 0, 6000, '접스 모음전'],
  ['3505478787', '스티로폼', '배송비할인', 500, 0, 6000, '430 / 600 스+네 ~100T'],
  ['2216673728', '스티로폼', '배송비할인', 500, 0, 6000, '430 / 600 네 ~100T'],
  ['446014684', '스티로폼', '배송비할인', 500, 0, 6000, '430 / 600 스 50T~100T + 접스'],
  ['437331834', '스티로폼', '배송비할인', 500, 0, 6500, '430 / 600 스 10T~100T 메인상품'],
  ['2913417918', '스티로폼', '상품중복할인', 1000, 0, 0, '스+네 고티 모음전'],
  ['5763066244', '스티로폼', '상품중복할인', 1000, 0, 0, '스+네 원장 고티 모음전'],
  ['5759250443', '스티로폼', '상품중복할인', 1000, 0, 0, '스+네 원장 ~100T + 접스'],
  ['3781080651', '열반사단열재', '배송비할인', 500, 0, 5000, '5T~6T 1M'],
  ['3780749543', '열반사단열재', '배송비할인', 500, 0, 5000, '5T~20T 1M'],
  ['3402310018', '열반사단열재', '배송비할인', 500, 0, 5000, '5T~13T 1M'],
  ['10923727373', '열반사단열재', '배송비할인', 500, 0, 5000, '5T~13T 1M'],
  ['10912518316', '열반사단열재', '배송비할인', 1000, 0, 11000, '20T~50T 1M'],
  ['614497979', '열반사단열재', '배송비할인', 1000, 0, 14500, '20T~30T 2M'],
  ['10683699346', '열반사단열재', '배송비할인', 1000, 0, 14500, '20T~50T 2M'],
  ['2599610352', '열반사단열재', '배송비할인', 1000, 0, 20000, '6T 25M'],
  ['2599698654', '열반사단열재', '배송비할인', 2000, 0, 27000, '5T 50M 롤 모음전'],
  ['349222019', '열반사단열재', '배송비할인', 2000, 0, 27000, '10T 25M'],
  ['2599273590', '열반사단열재', '배송비할인', 2000, 0, 32000, '13T 20M'],
  ['2599242583', '열반사단열재', '배송비할인', 2000, 0, 27000, '20T 10M'],
  ['12936160195', '열반사단열재', '상품중복할인', 1000, 70000, 0, '5T~13T 5M'],
  ['10471290026', '열반사단열재', '상품중복할인', 1000, 70000, 0, '20T~50T 2M'],
  ['623737324', '열반사단열재', '상품중복할인', 1000, 70000, 0, '5T~13T 10M'],
  ['505443624', '열반사단열재', '상품중복할인', 1000, 70000, 4300, '5T~13T 1M 메인상품'],
  ['10682944267', '열반사단열재', '상품중복할인', 1000, 70000, 4300, '5T~13T 1M 차박'],
  ['11243899862', '열반사단열재', '상품중복할인', 1000, 70000, 4300, '5T~13T 1M 고양이'],
  ['12605232942', '열반사단열재', '상품중복할인', 1000, 70000, 4300, '5T~13T 1M 아파트단열필름'],
  ['10628616594', '열반사단열재', '상품중복할인', 2000, 70000, 0, '20T 2M 5장'],
  ['2599158337', '열반사단열재', '상품중복할인', 2000, 70000, 0, '30T 2M 5장'],
  ['2598880337', '열반사단열재', '상품중복할인', 2000, 70000, 0, '40T 2M 5장'],
  ['2448558544', '열반사단열재', '상품중복할인', 2000, 70000, 0, '50T 2M 5장'],
  ['628487624', '열반사단열재', '상품중복할인', 1000, 70000, 0, '5T~13T 5M~25M'],
  ['11356673932', '은박매트', '상품중복할인', 1000, 70000, 4500, '5T~13T 1M 은박매트'],
  ['10609463678', '캠핑단열재', '상품중복할인', 1000, 70000, 4500, '5T 1M 캠핑단열재'],
  ['669533622', '단열벽지', '상품중복할인', 1000, 70000, 3500, '단열벽지 1M 메인상품'],
  ['3394369231', '단열벽지', '상품중복할인', 2000, 70000, 0, '단열벽지 20M'],
  ['7934125826', '단열벽지', '상품중복할인', 1000, 70000, 0, '실크벽지 2.3M / 10M / 20M'],
  ['647994348', '단열벽지', '상품중복할인', 1000, 70000, 0, '단열벽지 2.3M / 10M / 20M'],
  ['11502054249', '단열벽지', '상품중복할인', 1000, 70000, 0, '단열벽지 2.3M / 10M / 20M'],
  ['11351466629', '단열벽지', '상품중복할인', 1000, 70000, 0, '실크 옥스 2.3M / 10M / 20M'],
  ['11351478928', '단열벽지', '상품중복할인', 1000, 70000, 0, '실크 클레이 2.3M / 10M / 20M'],
  ['11355611905', '단열벽지', '상품중복할인', 1000, 70000, 0, '단열벽지 화이트 2.3M / 10M / 20M'],
  ['4654882496', '난방필름단열재', '상품중복할인', 1000, 70000, 5000, '난방필름 1M'],
  ['4705673971', '난방필름단열재', '상품중복할인', 2000, 70000, 0, '난방필름 25M'],
  ['4650594055', '창문형단열재', '상품중복할인', 1000, 70000, 8000, '100원단위'],
  ['5009082205', '창문형단열재', '상품중복할인', 1000, 70000, 8000, '100원단위'],
  ['4609308307', '창문형단열재', '상품중복할인', 1000, 70000, 8000, '100원단위'],
  ['5012855593', '창문형단열재', '상품중복할인', 1000, 70000, 0, '스티로폼 구간 단위'],
  ['11984357778', '창문형단열재', '상품중복할인', 1000, 70000, 0, '아이소 구간 단위'],
  // 2026-10-23 새 쿠폰에 처음 들어가는 열반사 2M 낱장 3개(예전 쿠폰 자료에는 없던 상품) — 상품번호·옵션 메모만 이 표에 둔다
  ['10985931589', '열반사단열재', '상품중복할인', 500, 0, 14500, '30T 2M'],
  ['10985932386', '열반사단열재', '상품중복할인', 500, 0, 14500, '40T 2M'],
  ['10985933117', '열반사단열재', '상품중복할인', 500, 0, 14500, '50T 2M'],
];

/* 새로 발행하기로 한 쿠폰 — 2026-10-23 사용자 결정. 열반사는 스토어 판매가를 쿠폰 금액만큼 올리고(js/pricing-hankook-store-price.js) 조건 없는 금액형 알림쿠폰을 건다
   (최소구매 조건이 붙으면 가격 줄에 빨간 최대할인가가 안 보인다). 상품번호는 쿠폰 금액별로 묶었다 — 그룹상품은 예전 쿠폰 기록처럼 대표 번호만 적었다
   (롤 그룹 50700400 = 2599698654, 5M 그룹 50561135 = 12936160195 — 구성 상품 전체에 붙는지는 판매자센터에서 확인).
   DB의 쿠폰 기록에 이 id가 없으면 목록 끝에 넣고 [쿠폰 저장] 대기로 둔다(코드가 DB를 대신 쓰지는 않는다). 저장하면 seeds에 id가 남아 다시 들어오지 않는다.
   묶음(id)마다 따로 판단한다 — 이미 저장한 뒤에 새 묶음을 더해도 새 묶음만 들어온다. */
const HK_COUPON_NEW_SEEDS = [
  {
    // 같은 조건(조건 없는 금액형)이면 카테고리와 상관없이 금액별로 한 쿠폰에 묶는다 — 쿠폰은 300·500·1,000원 3개(2026-10-23 사용자 결정).
    //  · 열반사: 스토어 판매가를 쿠폰 금액만큼 올려 둔다(js/pricing-hankook-store-price.js).
    //  · 스티로폼 900×1800 원장(5759250443 일반·5763066244 고티): 판매가는 올리지 않고 쿠폰만 — 판매 부진 상품 테스트.
    //  · 아이소핑크 접착식 900×1800 원장 단품 5개(10181453964~10181586522): 스토어 판매가 +500과 같이.
    //  · 아이소핑크 900×1800 원장 모음전 5695312387: 판매가 그대로 쿠폰만(일반 옵션은 나라단열과 맞춘 가격, 판매 부진 상품 테스트).
    id: '2026-10-23-new-alert-coupons', label: '열반사·스티로폼·아이소핑크',
    issue: '2026.10.23 ~ 2027.10.23', issuePeriod: '1년', validity: '발급일로부터 30일',
    coupons: [
      { amount: 300, products: '505443624,10682944267,11243899862,12605232942,11356673932,3781080651,3402310018,10923727373,3780749543' },
      { amount: 500, products: '10912518316,614497979,10683699346,10985931589,10985932386,10985933117,10471290026,12936160195,623737324,628487624,5759250443,10181453964,10181564057,10181571912,10181582241,10181586522,5695312387' },
      { amount: 1000, products: '349222019,2599242583,2599273590,2599610352,2599698654,10628616594,2599158337,2598880337,2448558544,5763066244' },
    ],
  },
];
const HK_COUPON_LIST_DATE = '2026.04.17';

// 네이버 판매자센터 '혜택 목록'(2026-10-20 화면)과 대조한 내용 — 5개 모두 적용중, 대상 알림받기, 발급 2026.04.23 ~ 2027.04.23, 쿠폰유효기간 발급일로부터 30일
const HK_COUPON_NAVER = { target: '알림받기', issue: '2026.04.23 ~ 2027.04.23', validity: '발급일로부터 30일' };
const HK_COUPON_KEY = 'coupon_list';
const HK_COUPON_PERIODS = ['1주일', '1개월', '3개월', '6개월', '1년'];

const _hkCoupon = { coupons: null, seeds: [], loaded: false, loading: false, saving: false, dirty: false, savedAt: null, note: '', noteKind: '', formOpen: false };

const _hkCouponAdmin = () => !!(window.currentUser && window.currentUser.role === 'admin');
const _hkCouponClient = () => (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
const _hkCouponToast = (message, type) => { if (typeof showToast === 'function') showToast(message, type); else console.warn('[쿠폰]', message); };

function _hkCouponWon(value) {
  return value ? Number(value).toLocaleString() + '원' : '';
}

function _hkCouponEsc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function _hkCouponDate(date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function _hkCouponIso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 발급 시작일 + 발급 기간 → 발급 종료일
function _hkCouponIssueEnd(startIso, period) {
  const date = new Date(startIso + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return null;
  if (period === '1주일') date.setDate(date.getDate() + 7);
  else if (period === '1개월') date.setMonth(date.getMonth() + 1);
  else if (period === '3개월') date.setMonth(date.getMonth() + 3);
  else if (period === '6개월') date.setMonth(date.getMonth() + 6);
  else date.setFullYear(date.getFullYear() + 1);
  return date;
}

function _hkCouponSeed() {
  return HK_COUPON_DEFS.map(def => ({
    no: def.no, kind: def.kind, amount: def.amount, min: def.min,
    status: def.status === '중지' ? '중지' : '적용중', stopped: def.stopped || '',
    target: HK_COUPON_NAVER.target, issue: HK_COUPON_NAVER.issue, validity: HK_COUPON_NAVER.validity,
    scope: 'selected', products: def.products.split(','),
  }));
}

function _hkCouponList() {
  if (!_hkCoupon.coupons) _hkCoupon.coupons = _hkCouponSeed();
  return _hkCoupon.coupons;
}

/* 새 쿠폰 기본값(HK_COUPON_NEW_SEEDS)을 아직 안 넣었으면 목록 끝에 넣는다 — DB에서 기록을 불러온 뒤에만 부른다. 넣으면 [쿠폰 저장] 대기가 된다. */
function _hkCouponApplyNewSeeds() {
  const added = [];
  HK_COUPON_NEW_SEEDS.forEach(seeds => {
    if (_hkCoupon.seeds.includes(seeds.id)) return;
    const coupons = _hkCouponList();
    let no = coupons.reduce((max, c) => Math.max(max, Number(c.no) || 0), 0);
    seeds.coupons.forEach(seed => {
      no += 1;
      coupons.push({
        no, kind: '중복할인', amount: seed.amount, min: 0,
        status: '적용중', stopped: '', target: HK_COUPON_NAVER.target,
        issue: seeds.issue, issuePeriod: seeds.issuePeriod, validity: seeds.validity,
        scope: 'selected', products: seed.products.split(','),
      });
    });
    _hkCoupon.seeds.push(seeds.id);
    added.push(`${seeds.label} ${seeds.coupons.map(s => _hkCouponWon(s.amount)).join(' · ')}`);
  });
  if (!added.length) return false;
  _hkCoupon.dirty = true;
  _hkCoupon.note = `새 쿠폰(조건 없는 알림쿠폰)을 목록 끝에 추가했습니다 — ${added.join(' / ')}. 판매자센터에도 같은 조건으로 발행하고, [쿠폰 저장]을 눌러야 DB에 남습니다.`;
  _hkCoupon.noteKind = '';
  return true;
}

function _hkCouponRerender() {
  const pane = document.getElementById('pricing-tab-hk_coupon');
  if (!pane) return;
  const open = [...pane.querySelectorAll('.hk-coupon-block details[open]')].map(d => d.closest('.hk-coupon-block').dataset.no);
  pane.innerHTML = renderHkCouponPane();
  open.forEach(no => { const d = pane.querySelector(`.hk-coupon-block[data-no="${no}"] details`); if (d) d.open = true; });
}

/* ─── 불러오기 / 저장 ─── */
window.hkCouponOnOpen = async function() {
  if (_hkCoupon.loaded || _hkCoupon.loading) return;
  _hkCoupon.loading = true;
  try {
    const client = _hkCouponClient();
    if (!client) throw new Error('Supabase에 연결되지 않았습니다');
    const { data, error } = await client.from('hk_settings').select('value,updated_at').eq('key', HK_COUPON_KEY).limit(1);
    if (error) throw new Error(error.message || String(error));
    const saved = data && data[0];
    if (saved && saved.value && Array.isArray(saved.value.coupons)) {
      _hkCoupon.coupons = saved.value.coupons;
      _hkCoupon.seeds = Array.isArray(saved.value.seeds) ? saved.value.seeds.slice() : [];
      _hkCoupon.savedAt = saved.updated_at ? new Date(saved.updated_at) : null;
      _hkCoupon.note = '';
    } else {
      _hkCoupon.coupons = _hkCouponSeed();
      _hkCoupon.note = '아직 저장한 쿠폰 기록이 없어 2026.04.17 자료를 보여 줍니다. 쿠폰을 등록·중지한 뒤 [쿠폰 저장]을 누르면 DB에 남습니다.';
    }
    _hkCoupon.noteKind = '';
    _hkCouponApplyNewSeeds(); // 새로 발행하기로 한 쿠폰(2026-10-23) — 아직 기록에 없으면 추가
    _hkCoupon.loaded = true;
  } catch (error) {
    _hkCoupon.coupons = _hkCoupon.coupons || _hkCouponSeed();
    _hkCoupon.note = `저장된 쿠폰 기록을 불러오지 못해 2026.04.17 자료를 보여 줍니다 (${error.message})`;
    _hkCoupon.noteKind = 'error';
  }
  _hkCoupon.loading = false;
  _hkCouponRerender();
};

window.hkCouponSave = async function() {
  if (!_hkCouponAdmin() || _hkCoupon.saving) return;
  const client = _hkCouponClient();
  if (!client) { _hkCouponToast('Supabase에 연결되지 않아 저장할 수 없습니다.', 'error'); return; }
  _hkCoupon.saving = true;
  _hkCouponRerender();
  const now = new Date().toISOString();
  const { error } = await client.from('hk_settings').upsert({ key: HK_COUPON_KEY, value: { version: 1, coupons: _hkCouponList(), seeds: _hkCoupon.seeds }, updated_at: now }, { onConflict: 'key' });
  _hkCoupon.saving = false;
  if (error) {
    _hkCouponToast(`쿠폰 저장 실패: ${error.message || error}`, 'error');
  } else {
    _hkCoupon.dirty = false;
    _hkCoupon.loaded = true;
    _hkCoupon.savedAt = new Date(now);
    _hkCoupon.note = '';
    _hkCouponToast('쿠폰 기록을 저장했습니다.', 'success');
  }
  _hkCouponRerender();
};

/* ─── 중지 / 되돌리기 / 삭제 ─── */
function _hkCouponFind(no) { return _hkCouponList().find(c => String(c.no) === String(no)); }
function _hkCouponName(c) { return `${c.target || '알림받기'} 쿠폰 ${c.kind} ${Number(c.amount)}`; }

window.hkCouponStop = function(no) {
  const coupon = _hkCouponFind(no);
  if (!_hkCouponAdmin() || !coupon) return;
  if (!window.confirm(`쿠폰${coupon.no} (${_hkCouponName(coupon)})을 "중지"로 기록할까요?\n\n이 화면은 기록용입니다. 네이버 판매자센터 혜택 목록에서도 직접 중지해야 실제로 멈춥니다.`)) return;
  coupon.status = '중지';
  coupon.stopped = _hkCouponDate(new Date());
  _hkCoupon.dirty = true;
  _hkCouponRerender();
};

window.hkCouponResume = function(no) {
  const coupon = _hkCouponFind(no);
  if (!_hkCouponAdmin() || !coupon) return;
  if (!window.confirm(`쿠폰${coupon.no}을 다시 "적용중"으로 되돌릴까요? (잘못 눌렀을 때만 쓰세요)`)) return;
  coupon.status = '적용중';
  coupon.stopped = '';
  _hkCoupon.dirty = true;
  _hkCouponRerender();
};

window.hkCouponRemove = function(no) {
  const coupon = _hkCouponFind(no);
  if (!_hkCouponAdmin() || !coupon) return;
  if (!window.confirm(`쿠폰${coupon.no} (${_hkCouponName(coupon)}) 기록을 목록에서 지울까요?\n중지한 이력도 함께 사라집니다.`)) return;
  _hkCoupon.coupons = _hkCouponList().filter(c => c !== coupon);
  _hkCoupon.dirty = true;
  _hkCouponRerender();
};

/* ─── 신규 쿠폰 등록 ─── */
window.hkCouponToggleForm = function() {
  if (!_hkCouponAdmin()) return;
  _hkCoupon.formOpen = !_hkCoupon.formOpen;
  _hkCouponRerender();
  if (_hkCoupon.formOpen) document.getElementById('hkCouponForm')?.scrollIntoView({ block: 'nearest' });
};

// 폼 안의 항목이 바뀔 때 — 발급 종료일 미리보기와 조건부 입력칸 표시를 맞춘다
window.hkCouponFormUpdate = function() {
  const form = document.getElementById('hkCouponForm');
  if (!form) return;
  const get = name => form.elements[name];
  const end = _hkCouponIssueEnd(get('issueStart').value, get('issuePeriod').value);
  form.querySelector('.hk-coupon-issue-end').textContent = end ? '~ ' + _hkCouponDate(end) : '';
  form.querySelector('.hk-coupon-validity-days').hidden = get('validityType').value !== 'days';
  form.querySelector('.hk-coupon-validity-range').hidden = get('validityType').value !== 'range';
  form.querySelector('.hk-coupon-scope-products').hidden = get('scope').value !== 'selected';
  const isShip = get('kind').value === '배송비할인';
  form.querySelector('.hk-coupon-min-hint').textContent = isShip ? '배송비할인은 보통 금액과 무관(0)' : '중복할인은 보통 70,000원 이상';
};

window.hkCouponCreate = function() {
  if (!_hkCouponAdmin()) return;
  const form = document.getElementById('hkCouponForm');
  if (!form) return;
  const get = name => form.elements[name].value;
  const amount = Math.round(Number(get('amount')));
  const min = Math.round(Number(get('min') || 0));
  if (!(amount > 0)) { _hkCouponToast('할인 금액을 입력해 주세요.', 'warning'); return; }
  if (!(min >= 0)) { _hkCouponToast('최소 주문금액을 확인해 주세요.', 'warning'); return; }
  const start = get('issueStart');
  const issueEnd = _hkCouponIssueEnd(start, get('issuePeriod'));
  if (!issueEnd) { _hkCouponToast('혜택 발급 시작일을 골라 주세요.', 'warning'); return; }
  let validity;
  if (get('validityType') === 'days') {
    const days = Math.round(Number(get('validityDays')));
    if (!(days >= 1)) { _hkCouponToast('쿠폰 유효기간(일)을 입력해 주세요.', 'warning'); return; }
    validity = `발급일로부터 ${days}일`;
  } else {
    const from = get('validityFrom'), to = get('validityTo');
    if (!from || !to || from > to) { _hkCouponToast('쿠폰 유효기간의 시작·종료일을 확인해 주세요.', 'warning'); return; }
    validity = `${from.replace(/-/g, '.')} ~ ${to.replace(/-/g, '.')}`;
  }
  const scope = get('scope');
  let products = [];
  if (scope === 'selected') {
    products = [...new Set(get('products').split(/[^0-9]+/).filter(Boolean))];
    if (!products.length) { _hkCouponToast('혜택 상품으로 지정할 상품번호를 입력해 주세요.', 'warning'); return; }
  }
  const coupons = _hkCouponList();
  const no = coupons.reduce((max, c) => Math.max(max, Number(c.no) || 0), 0) + 1;
  coupons.push({
    no, kind: get('kind') === '배송비할인' ? '배송비할인' : '중복할인', amount, min,
    status: '적용중', stopped: '', target: HK_COUPON_NAVER.target,
    issue: `${_hkCouponDate(new Date(start + 'T00:00:00'))} ~ ${_hkCouponDate(issueEnd)}`, issuePeriod: get('issuePeriod'),
    validity, scope, products,
  });
  _hkCoupon.dirty = true;
  _hkCoupon.formOpen = false;
  _hkCouponRerender();
  _hkCouponToast(`쿠폰${no}을 등록했습니다. 네이버 판매자센터에서도 같은 조건으로 발행하고, 이 화면에서 [쿠폰 저장]을 눌러 주세요.`, 'success');
};

function _hkCouponFormHtml() {
  const today = _hkCouponIso(new Date());
  const end = _hkCouponIssueEnd(today, '1개월');
  return `<form class="hk-coupon-form" id="hkCouponForm" onsubmit="hkCouponCreate(); return false;" onchange="hkCouponFormUpdate()" oninput="hkCouponFormUpdate()">
    <h4>신규 쿠폰 등록 <small>네이버 판매자센터 혜택 등록 항목과 같습니다 — 판매자센터에서 먼저(또는 같이) 발행하세요</small></h4>
    <div class="hk-coupon-form-grid">
      <label>쿠폰 종류
        <select name="kind"><option value="중복할인">상품중복할인</option><option value="배송비할인">배송비할인</option></select>
      </label>
      <label>할인 설정 (원)
        <input type="number" name="amount" min="1" step="100" placeholder="예: 2000">
      </label>
      <label>최소 주문금액 (원) <small class="hk-coupon-min-hint">중복할인은 보통 70,000원 이상</small>
        <input type="number" name="min" min="0" step="1000" value="70000">
      </label>
      <label>혜택 발급 기간
        <span class="hk-coupon-inline">
          <select name="issuePeriod">${HK_COUPON_PERIODS.map(p => `<option${p === '1개월' ? ' selected' : ''}>${p}</option>`).join('')}</select>
          <input type="date" name="issueStart" value="${today}">
          <span class="hk-coupon-issue-end">${end ? '~ ' + _hkCouponDate(end) : ''}</span>
        </span>
      </label>
      <label>쿠폰 유효기간
        <span class="hk-coupon-inline">
          <select name="validityType"><option value="days">발급일로부터 N일</option><option value="range">기간 지정</option></select>
          <span class="hk-coupon-validity-days"><input type="number" name="validityDays" min="1" value="30" style="width:70px"> 일</span>
          <span class="hk-coupon-validity-range" hidden><input type="date" name="validityFrom"> ~ <input type="date" name="validityTo"></span>
        </span>
      </label>
      <label>혜택 상품 지정
        <select name="scope"><option value="selected">상품 선택</option><option value="all">내 스토어 상품 전체</option></select>
      </label>
    </div>
    <label class="hk-coupon-scope-products">혜택 상품번호 <small>쉼표·줄바꿈·공백으로 구분해 붙여 넣기</small>
      <textarea name="products" rows="3" placeholder="예: 4654882496, 4705673971"></textarea>
    </label>
    <div class="hk-coupon-form-actions">
      <button type="submit" class="hk-coupon-btn is-primary">등록</button>
      <button type="button" class="hk-coupon-btn" onclick="hkCouponToggleForm()">취소</button>
    </div>
  </form>`;
}

/* ─── 화면 ─── */
// 상품번호·구분·옵션 메모로 찾기 — 맞는 상품이 있는 쿠폰만 남기고 펼친다
function hkCouponSearch(value) {
  const pane = document.querySelector('.hk-coupon-pane');
  if (!pane) return;
  const query = String(value || '').trim().toLowerCase();
  pane.querySelectorAll('.hk-coupon-block').forEach(block => {
    let shown = 0;
    block.querySelectorAll('tbody tr[data-text]').forEach(row => {
      const hit = !query || row.dataset.text.includes(query);
      row.hidden = !hit;
      if (hit) shown += 1;
    });
    block.querySelectorAll('tr.hk-coupon-sub').forEach(sub => {
      let next = sub.nextElementSibling, any = false;
      while (next && !next.classList.contains('hk-coupon-sub')) { if (!next.hidden) any = true; next = next.nextElementSibling; }
      sub.hidden = !any;
    });
    block.hidden = !!query && shown === 0;
    const details = block.querySelector('details');
    if (details) details.open = !!query && shown > 0;
  });
}

/* 상품별 배송비 — 단가표(한국단열 몰별 표)의 현재 값을 읽는다(2026-10-23 사용자 지시: 쿠폰 탭의 배송비가 예전 값이라 최근 상황으로). 단가표에 상품이 없으면 예전 자료(HK_COUPON_ROWS)의 값을 쓴다. */
function _hkCouponShippingText(id, row) {
  const listings = (typeof HK_CHANNEL_LISTINGS !== 'undefined' && HK_CHANNEL_LISTINGS.hkd) || [];
  const product = listings.find(p => String(p.productId) === String(id));
  if (product && product.baseShipping != null) {
    const fee = Number(product.baseShipping);
    if (!fee) return '무료';
    const basis = product.shippingBasis && product.shippingBasis !== '-' ? ` · ${product.shippingBasis}` : '';
    return `${_hkCouponWon(fee)}${basis}`;
  }
  return row ? (row[5] ? _hkCouponWon(row[5]) : '무료') : '';
}

function _hkCouponBlock(def, rows, admin) {
  const stopped = def.status === '중지';
  const all = def.scope === 'all';
  const ids = def.products || [];
  // 구분별 상품 수 — 이 쿠폰을 중지하면 영향 받는 상품이 어디에 몰려 있는지
  const groups = [];
  ids.forEach(id => {
    const row = rows.get(id);
    const name = row ? row[1] : '(목록에 없는 상품)';
    let group = groups.find(g => g.name === name);
    if (!group) { group = { name, items: [] }; groups.push(group); }
    group.items.push({ id, row });
  });
  const chips = all ? '<span class="hk-coupon-cat">내 스토어 상품 전체</span>' : groups.map(g => `<span class="hk-coupon-cat">${g.name} <b>${g.items.length}</b></span>`).join('');
  const lines = groups.map(g => `<tr class="hk-coupon-sub"><td colspan="3">${g.name} <small>${g.items.length}개</small></td></tr>` + g.items.map(({ id, row }) => {
    const note = row ? row[6] : '';
    const shipping = _hkCouponShippingText(id, row);
    return `<tr data-text="${(id + ' ' + g.name + ' ' + note).toLowerCase()}">
      <td class="hk-coupon-id">${id}</td>
      <td class="hk-coupon-note">${note}</td>
      <td class="hk-coupon-num">${shipping}</td>
    </tr>`;
  }).join('')).join('');
  const isShip = def.kind === '배송비할인';
  const buttons = !admin ? '' : stopped
    ? `<button type="button" class="hk-coupon-btn" onclick="hkCouponResume(${def.no})">적용중으로 되돌리기</button><button type="button" class="hk-coupon-btn is-danger" onclick="hkCouponRemove(${def.no})">기록 삭제</button>`
    : `<button type="button" class="hk-coupon-btn is-stop" onclick="hkCouponStop(${def.no})">쿠폰 중지</button>`;
  return `<section class="hk-coupon-block is-c${((def.no - 1) % 5) + 1}${stopped ? ' is-stopped' : ''}" data-no="${def.no}">
    <div class="hk-coupon-head">
      <div class="hk-coupon-title">
        <span class="hk-coupon-no">쿠폰${def.no}</span>
        <span class="hk-coupon-name">${_hkCouponEsc(_hkCouponName(def))}</span>
        <span class="hk-coupon-status ${stopped ? 'is-off' : 'is-on'}">${stopped ? '중지' + (def.stopped ? ' ' + _hkCouponEsc(def.stopped) : '') : '적용중'}</span>
      </div>
      <div class="hk-coupon-facts">
        <span><small>${isShip ? '배송비 할인' : '상품 중복할인'}</small><b>−${_hkCouponWon(def.amount)}</b></span>
        <span><small>최소 주문금액</small><b>${def.min ? _hkCouponWon(def.min) + ' 이상' : '금액 무관'}</b></span>
        <span><small>발급 기간</small><b class="is-sm">${_hkCouponEsc(def.issue || '')}</b></span>
        <span><small>쿠폰 유효기간</small><b class="is-sm">${_hkCouponEsc(def.validity || '')}</b></span>
        <span><small>걸린 상품</small><b>${all ? '전체' : ids.length + '개'}</b></span>
      </div>
      ${buttons ? `<div class="hk-coupon-actions">${buttons}</div>` : ''}
    </div>
    <div class="hk-coupon-cats">${chips}</div>
    ${all ? '' : `<details>
      <summary>상품 ${ids.length}개 보기</summary>
      <table class="pricing-table hk-coupon-table">
        <thead><tr><th>상품번호</th><th>옵션 · 메모</th><th>배송비 <small>(단가표 현재값)</small></th></tr></thead>
        <tbody>${lines}</tbody>
      </table>
    </details>`}
  </section>`;
}

function renderHkCouponPane() {
  const admin = _hkCouponAdmin();
  const coupons = _hkCouponList();
  const rows = new Map(HK_COUPON_ROWS.map(row => [row[0], row])); // 상품번호 → 상품 행
  const active = coupons.filter(def => def.status !== '중지');
  const stoppedCount = coupons.length - active.length;
  const hasAll = active.some(def => def.scope === 'all');
  const productCount = new Set(active.flatMap(def => def.products || [])).size;
  // 적용중인 쿠폰을 먼저, 중지한 쿠폰은 아래로
  const ordered = [...active, ...coupons.filter(def => def.status === '중지')];
  const savedText = _hkCoupon.saving ? '저장 중…'
    : _hkCoupon.loading ? '불러오는 중…'
    : _hkCoupon.dirty ? '저장 안 된 변경이 있습니다'
    : _hkCoupon.savedAt ? '최근 저장: ' + _hkCoupon.savedAt.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

  return `<div class="hk-coupon-pane">
    <div class="hk-coupon-banner">
      <div class="hk-coupon-summary">
        <span>쿠폰 <b>${coupons.length}개</b></span>
        <span>적용중 <b class="is-on">${active.length}</b></span>
        <span>중지 <b class="is-off">${stoppedCount}</b></span>
        <span>걸린 상품 <b>${hasAll ? '전체 포함' : productCount + '개'}</b></span>
        <input type="search" class="hk-coupon-search" placeholder="상품번호 · 옵션 검색" oninput="hkCouponSearch(this.value)">
        ${admin ? `<span class="hk-coupon-saved${_hkCoupon.dirty ? ' is-dirty' : ''}">${savedText}</span>
        <button type="button" class="hk-coupon-btn is-primary" onclick="hkCouponToggleForm()">+ 신규 쿠폰 등록</button>
        <button type="button" class="hk-coupon-btn" onclick="hkCouponSave()"${_hkCoupon.saving ? ' disabled' : ''}>쿠폰 저장</button>` : ''}
      </div>
      <p>쿠폰은 상품 하나만 따로 빼지 못하고 <b>혜택 자체를 중지</b>해야 합니다(중지한 쿠폰은 되살릴 수 없고 새로 발행만 됩니다). 예전 쿠폰은 2026-10-22에 전부 중지했고, <b>2026-10-23에 조건 없는 금액형 알림쿠폰을 새로 발행하기로 했습니다</b> — <b>300·500·1,000원 3개</b>이고, 같은 조건이면 열반사·스티로폼·아이소핑크 구분 없이 금액별로 한 쿠폰에 묶었습니다. 열반사와 아이소핑크 접착식 단품은 스토어 판매가를 쿠폰 금액만큼 올려 두었고(몰별 적용 &gt; 한국단열의 '스토어 판매가'), 스티로폼·아이소핑크 900×1800 원장 모음전은 판매가를 올리지 않고 쿠폰만 겁니다. 최소 주문금액이 없어야 가격 줄에 빨간 최대할인가가 보입니다.</p>
      <p><b>이 탭은 기록용입니다</b> — 네이버에 실제로 발행·중지하는 기능은 아닙니다. 판매자센터에서 한 일을 여기도 맞춰 두세요. 기본 자료는 ${HK_COUPON_LIST_DATE} 상품 목록과 판매자센터 혜택 목록(2026-10-20)을 대조한 것입니다. 가격 계산에는 쓰이지 않습니다.</p>
      ${_hkCoupon.note && (admin || _hkCoupon.noteKind === 'error') ? `<p class="hk-coupon-note-line${_hkCoupon.noteKind === 'error' ? ' is-error' : ''}">${_hkCouponEsc(_hkCoupon.note)}</p>` : ''}
    </div>
    ${admin && _hkCoupon.formOpen ? _hkCouponFormHtml() : ''}
    <div class="hk-coupon-list">${ordered.map(def => _hkCouponBlock(def, rows, admin)).join('')}</div>
  </div>`;
}
