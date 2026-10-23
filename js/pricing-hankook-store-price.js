/* ═══════════════════════════════════════
   한국단열 스마트스토어 '스토어 판매가' (2026-10-23, 사용자 결정)

   스마트스토어에서는 판매가를 올려 두고 조건 없는 알림쿠폰(예: 300원)을 걸어 빨간 최대할인가(= 원래 가격)가 목록에 보이게 하려 한다.
   그런데 단가표는 한국단열 실판매가 하나로 스마트스토어 가격검증·홈페이지·쿠팡·ESM·11번가를 전부 계산한다.
   그래서 **몰별 적용 > 한국단열 표**에 `스토어 판매가` 칸 하나를 더했다(모든 카테고리, '현재 판매가' 왼쪽). 연동도 자동 계산도 아니고 사용자가 직접 적는 값이다.
   - **상품번호 + 상품코드(옵션)별**로 따로 적는다(같은 코드가 여러 상품에 있어도 그 상품 줄만 바뀐다). 키는 `상품번호|상품코드`.
   - 처음 값 = 단가표 판매가(표의 '현재 판매가')와 같다. 값을 따로 저장하는 것은 단가표 판매가와 **다르게 적은 옵션만**이다 — 같게 두거나 지우면 계속 단가표 판매가를 따른다.
   - **한국단열 스마트스토어(`hkd` 채널: 몰별 표·가격검증·엑셀)만** 이 값을 쓴다. 가격검증도 같다 — pricing-check-test.js의 gatherHkdItems가
     _hkChannelTargetPrice(…, 'hkd', …)를 expected로 보내므로 스토어 판매가가 기준이다. 홈페이지·쿠팡·ESM·11번가·마진 계산은 단가표 판매가(원래 가격) 그대로다.
   - 입력은 관리자만, 연필 버튼(또는 칸)을 눌러야 고칠 수 있다. 다른 사용자(보기 전용 포함)에게는 글자로만 보인다.
   - 쿠폰과 한 세트다 — 쿠폰을 중단하면 스토어 판매가도 단가표 판매가로 되돌려야 실제 인상이 안 된다.

   구조는 여기(JS), 값은 DB — hk_settings 의 key 'store_prices' 한 줄({ '상품번호|상품코드': 스토어 판매가 }, SQL 변경 없음). 단가표 [저장]과 같이 저장된다(pricing-hankook-db.js).
   DB에 아직 저장된 값이 없을 때만 아래 HK_STORE_PRICE_SEED(코드 기본값)가 보인다 — 한 번 [저장]하면 DB 값이 우선이다(DB는 코드가 대신 쓰지 않는다).
   가격 계산은 pricing-hankook.js의 _hkChannelTargetPrice가 hkd 채널일 때만 이 값을 먼저 본다(없으면 단가표 값).
═══════════════════════════════════════ */

/* 처음 값(DB에 store_prices가 없을 때만) — 2026-10-23 사용자 지시: 열반사 1M 8개 상품(505443624·10682944267·11243899862·12605232942·11356673932·3781080651·3402310018·10923727373)을
   스토어 판매가 +300원(그 상품에 300원 쿠폰을 걸 것이라 상품 안의 옵션 전체 — 505443624 안의 단열벽지 색상 옵션 포함). 값은 그 시점 단가표 판매가 + 300이다.
   3780749543(5T~20T)은 나중에 +300, 10912518316(20T~50T)은 +500으로 추가했다. */
const HK_STORE_PRICE_SEED = {
  // 505443624 (열반사 메인)
  '505443624|BL_5_1_SN': 3200, '505443624|BL_5_1_DN': 3500, '505443624|BL_5_1_SA': 4700, '505443624|BL_5_1_DA': 4900, '505443624|BL_6_1_SN': 4900, '505443624|BL_6_1_DN': 5200, '505443624|BL_6_1_SA': 6600, '505443624|BL_6_1_DA': 7000, '505443624|BL_10_1_SN': 6100, '505443624|BL_10_1_DN': 6500, '505443624|BL_10_1_SA': 8000, '505443624|BL_10_1_DA': 8400, '505443624|BL_13_1_DN': 8600, '505443624|BL_13_1_DA': 10300, '505443624|WP_DW_5_1': 6600, '505443624|WP_SK_5_1': 6100, // 같은 상품 안의 단열벽지 색상 옵션 11개(WP_DW 1색·WP_SK 10색)도 +300
  // 10682944267 (차박)
  '10682944267|BL_5_1_SN': 3200, '10682944267|BL_5_1_DN': 3500, '10682944267|BL_5_1_SA': 4700, '10682944267|BL_5_1_DA': 4900, '10682944267|BL_6_1_SN': 4900, '10682944267|BL_6_1_DN': 5200, '10682944267|BL_6_1_SA': 6600, '10682944267|BL_6_1_DA': 7000, '10682944267|BL_10_1_SN': 6100, '10682944267|BL_10_1_DN': 6500, '10682944267|BL_10_1_SA': 8000, '10682944267|BL_10_1_DA': 8400, '10682944267|BL_13_1_DN': 8600, '10682944267|BL_13_1_DA': 10300,
  // 11243899862 (고양이)
  '11243899862|BL_5_1_SN': 3200, '11243899862|BL_5_1_DN': 3500, '11243899862|BL_5_1_SA': 4700, '11243899862|BL_5_1_DA': 4900, '11243899862|BL_6_1_SN': 4900, '11243899862|BL_6_1_DN': 5200, '11243899862|BL_6_1_SA': 6600, '11243899862|BL_6_1_DA': 7000, '11243899862|BL_10_1_SN': 6100, '11243899862|BL_10_1_DN': 6500, '11243899862|BL_10_1_SA': 8000, '11243899862|BL_10_1_DA': 8400, '11243899862|BL_13_1_DN': 8600, '11243899862|BL_13_1_DA': 10300,
  // 12605232942 (아파트단열필름)
  '12605232942|BL_5_1_SN': 3200, '12605232942|BL_5_1_DN': 3500, '12605232942|BL_5_1_SA': 4700, '12605232942|BL_5_1_DA': 4900, '12605232942|BL_6_1_SN': 4900, '12605232942|BL_6_1_DN': 5200, '12605232942|BL_6_1_SA': 6600, '12605232942|BL_6_1_DA': 7000, '12605232942|BL_10_1_SN': 6100, '12605232942|BL_10_1_DN': 6500, '12605232942|BL_10_1_SA': 8000, '12605232942|BL_10_1_DA': 8400, '12605232942|BL_13_1_DN': 8600, '12605232942|BL_13_1_DA': 10300,
  // 11356673932 (은박매트)
  '11356673932|BL_5_1_SN': 3200, '11356673932|BL_5_1_DN': 3500, '11356673932|BL_5_1_SA': 4700, '11356673932|BL_5_1_DA': 4900, '11356673932|BL_6_1_SN': 4900, '11356673932|BL_6_1_DN': 5200, '11356673932|BL_6_1_SA': 6600, '11356673932|BL_6_1_DA': 7000, '11356673932|BL_10_1_SN': 6100, '11356673932|BL_10_1_DN': 6500, '11356673932|BL_10_1_SA': 8000, '11356673932|BL_10_1_DA': 8400, '11356673932|BL_13_1_DN': 8600, '11356673932|BL_13_1_DA': 10300,
  // 3781080651 (5T~6T)
  '3781080651|BL_5_1_SN': 3200, '3781080651|BL_5_1_DN': 3500, '3781080651|BL_5_1_SA': 4700, '3781080651|BL_5_1_DA': 4900, '3781080651|BL_6_1_SN': 4900, '3781080651|BL_6_1_DN': 5200, '3781080651|BL_6_1_SA': 6600, '3781080651|BL_6_1_DA': 7000,
  // 3402310018 (5T~13T 고급형)
  '3402310018|BL_5_1_DN': 3500, '3402310018|BL_5_1_DA': 4900, '3402310018|BL_6_1_DN': 5200, '3402310018|BL_6_1_DA': 7000, '3402310018|BL_10_1_DN': 6500, '3402310018|BL_10_1_DA': 8400, '3402310018|BL_13_1_DN': 8600, '3402310018|BL_13_1_DA': 10300,
  // 10923727373 (5T~13T)
  '10923727373|BL_5_1_SN': 3200, '10923727373|BL_5_1_DN': 3500, '10923727373|BL_5_1_SA': 4700, '10923727373|BL_5_1_DA': 4900, '10923727373|BL_6_1_SN': 4900, '10923727373|BL_6_1_DN': 5200, '10923727373|BL_6_1_SA': 6600, '10923727373|BL_6_1_DA': 7000, '10923727373|BL_10_1_SN': 6100, '10923727373|BL_10_1_DN': 6500, '10923727373|BL_10_1_SA': 8000, '10923727373|BL_10_1_DA': 8400, '10923727373|BL_13_1_DN': 8600, '10923727373|BL_13_1_DA': 10300,
  // 3780749543 (5T~20T) — 2026-10-23 사용자 지시로 추가(+300). 20T 옵션은 10912518316과 겹치지만 상품번호별 값이라 따로 정한다.
  '3780749543|BL_5_1_SN': 3200, '3780749543|BL_5_1_DN': 3500, '3780749543|BL_5_1_SA': 4700, '3780749543|BL_5_1_DA': 4900, '3780749543|BL_6_1_SN': 4900, '3780749543|BL_6_1_DN': 5200, '3780749543|BL_6_1_SA': 6600, '3780749543|BL_6_1_DA': 7000, '3780749543|BL_10_1_SN': 6100, '3780749543|BL_10_1_DN': 6500, '3780749543|BL_10_1_SA': 8000, '3780749543|BL_10_1_DA': 8400, '3780749543|BL_13_1_DN': 8600, '3780749543|BL_13_1_DA': 10300, '3780749543|BL_20_1_DN': 14300, '3780749543|BL_20_1_DA': 16300,
  // 10912518316 (20T~50T) — 2026-10-23 사용자 지시로 추가(+500, 가격대가 높아 300이 아니라 500). 20T는 3780749543보다 200원 비싸다.
  '10912518316|BL_20_1_DN': 14500, '10912518316|BL_20_1_DA': 16500, '10912518316|BL_30_1_DN': 19500, '10912518316|BL_30_1_DA': 21500, '10912518316|BL_40_1_DN': 28500, '10912518316|BL_50_1_DN': 32500,
};

(function () {
  const prices = { ...HK_STORE_PRICE_SEED }; // '상품번호|상품코드' → 스토어 판매가(원)
  const isAdmin = () => !!(window.currentUser && window.currentUser.role === 'admin');
  const fmt = value => (Number.isFinite(Number(value)) ? Number(value).toLocaleString() : '');
  const parse = value => { const n = Math.round(Number(String(value ?? '').replace(/[^\d]/g, ''))); return Number.isFinite(n) && n > 0 ? n : null; };
  const keyOf = (productId, code) => `${productId}|${code}`;

  /* 스토어 판매가 — 따로 정한 값이 있으면 그 값, 없으면 null(= 단가표 판매가를 따른다). */
  window.hkStorePriceOf = (productId, code) => {
    if (productId == null || !code) return null;
    const key = keyOf(productId, code);
    return Object.prototype.hasOwnProperty.call(prices, key) ? prices[key] : null;
  };
  window.hkStorePriceOverrides = () => ({ ...prices });
  window.hkStorePriceApply = values => {
    Object.keys(prices).forEach(key => delete prices[key]);
    Object.entries(values || {}).forEach(([key, value]) => { const n = parse(value); if (n != null) prices[key] = n; });
  };

  /* 몰별 표(한국단열)의 '스토어 판매가' 칸 안쪽 — base는 그 옵션의 단가표 판매가. 단가표 값과 다르게 적으면 빨갛게 보인다. */
  window.hkStoreCellHtml = (productId, code, base) => {
    if (productId == null || !code || base == null || !Number.isFinite(Number(base))) return '—';
    const set = window.hkStorePriceOf(productId, code);
    const value = set != null ? set : Number(base);
    const differs = set != null && set !== Number(base);
    if (!isAdmin()) return `<b class="hk-store-price-text${differs ? ' is-set' : ''}">${fmt(value)}</b>`;
    // 다른 가격 칸과 같은 방식 — 연필(또는 칸)을 눌러야 고칠 수 있고, Enter·칸 밖 클릭으로 확정, Esc로 취소.
    return `<div class="hk-iso-price-edit-wrap">
      <input type="text" inputmode="numeric" class="hk-store-price-input${differs ? ' is-set' : ''}" data-pid="${productId}" data-code="${code}" data-base="${Number(base)}" value="${fmt(value)}" readonly onclick="hkStorePriceBegin(this)" onblur="hkStorePriceFinish(this)" onkeydown="hkStorePriceKey(event,this)" aria-label="스토어 판매가">
      <button type="button" class="hk-iso-row-price-edit-btn" onclick="hkStorePriceBegin(this)" title="이 옵션의 스토어 판매가 수정"><i class="fa-solid fa-pen"></i></button>
    </div>`;
  };

  window.hkStorePriceBegin = source => {
    const cell = source.closest('.hk-store-price-cell');
    const input = cell && cell.querySelector('.hk-store-price-input');
    if (!input || !input.readOnly) return;
    input.dataset.start = input.value;
    input.readOnly = false;
    cell.classList.add('editing');
    input.focus();
    input.select();
  };

  window.hkStorePriceFinish = input => {
    if (input.readOnly) return;
    input.readOnly = true;
    input.closest('.hk-store-price-cell')?.classList.remove('editing');
    if (input.value !== input.dataset.start) window.hkStorePriceEdit(input);
  };

  window.hkStorePriceKey = (event, input) => {
    if (event.key === 'Enter') input.blur();
    if (event.key === 'Escape') { input.value = input.dataset.start ?? input.value; input.blur(); }
  };

  window.hkStorePriceEdit = input => {
    const productId = input && input.dataset.pid;
    const code = input && input.dataset.code;
    if (!productId || !code) return;
    const base = parse(input.dataset.base);
    const typed = parse(input.value);
    const key = keyOf(productId, code);
    if (typed == null || typed === base) delete prices[key]; else prices[key] = typed;
    if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
    if (typeof window._hkRefreshChannelListing === 'function') window._hkRefreshChannelListing(); // 표를 다시 그려 차액·기준가·옵션추가금까지 바로 바뀌게
  };
})();
