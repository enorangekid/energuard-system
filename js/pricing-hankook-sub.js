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
  { supplier:'열선커터기',  name:'프리커터기',                 code:'HC_FREE',      cost:33000,  previousPrice:56000,  price:56000,  shipping:3000, refMargin:25 },
  { supplier:'열선커터기',  name:'프리커터기-열선',              code:'HC_FREE_W',    cost:4000,   previousPrice:15000,  price:15000,  shipping:3000, refMargin:57 },
  { supplier:'열선커터기',  name:'엘림 열선커터기',              code:'HC_ELIM',      cost:19400,  previousPrice:28000,  price:29500,  shipping:3000, refMargin:18 },
  { supplier:'열선커터기',  name:'엘림 열선커터기-열선',           code:'HC_ELIM_W',    cost:900,    previousPrice:2300,   price:2500,   shipping:3000, refMargin:49 },
  { supplier:'열선커터기',  name:'마닉스 핸드폼커터기',            code:'HC_MAN',       cost:18400,  previousPrice:43000,  price:43000,  shipping:3000, refMargin:41 },
  { supplier:'열선커터기',  name:'팬형 열선커터기',              code:'HC_PEN',       cost:22000,  previousPrice:34500,  price:34500,  shipping:3000, refMargin:20 },
  { supplier:'열선커터기',  name:'팬형 열선커터기-열선',           code:'HC_PEN_W',     cost:3000,   previousPrice:7000,   price:7000,   shipping:3000, refMargin:41 },
  { supplier:'열선커터기',  name:'USB 열선커터기',             code:'HC_USB',       cost:11000,  previousPrice:16900,  price:17900,  shipping:3000, refMargin:25 },
  { supplier:'열선커터기',  name:'USB 열선커터기-열선',          code:'HC_USB_W',     cost:1300,   previousPrice:3000,   price:3000,   shipping:3000, refMargin:41 },
  { supplier:'열선커터기',  name:'USB 열선커터기-조각용팁',        code:'HC_USB_T',     cost:2300,   previousPrice:5200,   price:5200,   shipping:3000, refMargin:40 },
  { supplier:'열선커터기',  name:'USB 열선커터기-롱나이프팁',       code:'HC_USB_LK',    cost:2000,   previousPrice:4500,   price:4500,   shipping:3000, refMargin:40 },
  { supplier:'기타부자재',  name:'쎈 폼건',                   code:'SEN_GUN',      cost:4200,   previousPrice:7500,   price:7500,   shipping:3000, refMargin:28 },
  { supplier:'기타부자재',  name:'탑 폼건',                   code:'TOP_GUN',      cost:6000,   previousPrice:10500,  price:10500,  shipping:3000, refMargin:27 },
  { supplier:'기타부자재',  name:'아이소핑크본드',               code:'ISO_BD',       cost:2050,   previousPrice:4500,   price:4500,   shipping:3000, refMargin:38 },
  { supplier:'기타부자재',  name:'돼지표본드',                 code:'PIG_BD',       cost:1400,   previousPrice:3500,   price:3500,   shipping:3000, refMargin:38 },
  { supplier:'기타부자재',  name:'투명실리콘',                 code:'SC_TR',        cost:1600,   previousPrice:5500,   price:5500,   shipping:3000, refMargin:55 },
  { supplier:'기타부자재',  name:'실리콘건',                  code:'SC_GUN',       cost:1200,   previousPrice:3000,   price:3000,   shipping:3000, refMargin:44 },
  { supplier:'기타부자재',  name:'실리콘헤라',                 code:'SC_HE',        cost:650,    previousPrice:2000,   price:2000,   shipping:3000, refMargin:52 },
  { supplier:'기타부자재',  name:'플라스틱평헤라',               code:'SC_PHE',       cost:350,    previousPrice:1200,   price:1200,   shipping:3000, refMargin:55 },
  { supplier:'기타부자재',  name:'플라스틱톱날헤라',              code:'SC_SHE',       cost:350,    previousPrice:1200,   price:1200,   shipping:3000, refMargin:55 },
  { supplier:'기타부자재',  name:'곰팡이제거제',                code:'MR',           cost:3000,   previousPrice:5200,   price:6500,   shipping:3000, refMargin:36 },
  { supplier:'기타부자재',  name:'커터칼-대형',                code:'CK_L',         cost:500,    previousPrice:1500,   price:1500,   shipping:3000, refMargin:51 },
  { supplier:'기타부자재',  name:'커터날대형18mm-10개입',        code:'CK_B',         cost:450,    previousPrice:1000,   price:1200,   shipping:3000, refMargin:49 },
  { supplier:'기타부자재',  name:'반코팅장갑-목장갑',             code:'GL',           cost:280,    previousPrice:500,    price:500,    shipping:3000, refMargin:28 },
  { supplier:'기타부자재',  name:'OPP투명테이프',              code:'TP_TR',        cost:700,    previousPrice:2000,   price:2500,   shipping:3000, refMargin:58 },
  { supplier:'기타부자재',  name:'은박테이프',                 code:'TP_AL',        cost:720,    previousPrice:3000,   price:3000,   shipping:3000, refMargin:60 },
  { supplier:'기타부자재',  name:'회색 면테이프(48mm)',          code:'TP_GY48',      cost:1975,   previousPrice:4000,   price:5000,   shipping:3000, refMargin:45 },
  { supplier:'기타부자재',  name:'회색 면테이프(100mm)',         code:'TP_GY100',     cost:3463,   previousPrice:7500,   price:8500,   shipping:3000, refMargin:45 },
];

/* ═══════════════════════════════════════
   가격 인상 이력 (2026-09-22, 사용자 요청)

   부자재는 올해 중동 전쟁으로 나프타 수급이 흔들려 공급원가·판매가를 여러 번 올렸다. 언제 얼마를
   올렸는지 상품별로 남긴다 — 엑셀의 "26.04.10 추가인상 …" 열과 같은 정보다. 항목 하나 = 날짜 + 올린
   금액(공급원가와 판매가를 같은 금액만큼 올림, 내리면 음수). 한 상품에 여러 번 쌓인다.
   - 아래 시드는 사용자가 준 승현기업 엑셀(2026.06.09 기준표)의 값이다. DB에 저장된 이력이 있으면 그것이 우선한다.
   - 화면에서 공급원가 조정 [적용]이나 연필로 직접 수정하면 오늘 날짜로 자동 기록된다(저장 전까지는 점선 표시,
     "되돌리기"를 누르면 함께 사라진다). 날짜·금액은 이력 칸을 눌러 언제든 고칠 수 있다.
   - 저장은 hk_products.shipping JSON의 increases에 함께 들어간다(SQL 변경 없음, 이력 스냅샷에도 포함).
═══════════════════════════════════════ */
const HK_SUB_INCREASE_SEED = [
  ['2026-04-10', 250,   ['T_TF_G', 'T_TF_G_S', 'T_TF_G_B', 'T_TF_D', 'T_TF_D_S', 'T_TF_D_B']],
  ['2026-04-10', 350,   ['T_EB_G', 'T_EB_G_S', 'T_EB_G_B', 'T_EB_D', 'T_EB_D_S', 'T_EB_D_B',
                         'T_B1_G', 'T_B1_G_B', 'T_B2_G', 'T_B2_G_B', 'T_BIG65_G',
                         'T_SF_G', 'T_SF_G_B', 'T_SFB_G', 'T_SFB_G_B']],
  ['2026-04-10', 9000,  ['T_2K_H', 'T_2K_S']],
  ['2026-05-06', 350,   ['T_SF_251SET']],
  ['2026-06-09', 16000, ['T_2K_H', 'T_2K_S']],
  ['2026-06-09', 10000, ['T_NZ']],
  ['2026-06-09', 2000,  ['T_TP']],
  ['2026-08-21', 500,   ['T_SR']],
  // 함일셀레나 — 05.06 (월드 폼크리너 계열만 +500, 나머지 +300)
  ['2026-05-06', 300,   ['W_SF_G', 'W_SF_G_B', 'W_SFB_G', 'W_SFB_G_S', 'W_SFB_G_B', 'W_B2_G', 'W_B2_G_S', 'W_B2_G_B', 'W_SF_251SET']],
  ['2026-05-06', 500,   ['W_FC', 'W_FC_S']],
  // 투원테크 — 04.29
  ['2026-04-29', 53000, ['TW_LF_H']],
  ['2026-04-29', 70000, ['TW_LF_S']],
  ['2026-04-29', 5000,  ['TW_TP']],
  ['2026-04-29', 10000, ['TW_NZ']],
  // 유니산업 — 04.10
  ['2026-04-10', 500,   ['U_FB', 'U_FB_S', 'U_FB_SET']],
  // 형제산업 — 06.09
  ['2026-06-09', 2250,  ['H_HT']],
  // 열선커터기 — 07.02
  ['2026-07-02', 1000,  ['HC_ELIM', 'HC_USB']],
  ['2026-07-02', 100,   ['HC_ELIM_W']],
  // 기타부자재 — 05.11 (곰팡이제거제 하나)
  ['2026-05-11', 500,   ['MR']],
];
HK_SUB_PRODUCTS.forEach(product => { product.increases = []; });
HK_SUB_INCREASE_SEED.forEach(([date, amount, codes]) => {
  codes.forEach(code => {
    const product = HK_SUB_PRODUCTS.find(item => item.code === code);
    if (product) product.increases.push({ date, amount });
  });
});
HK_SUB_PRODUCTS.forEach(product => product.increases.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)));

function _hkSubToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function _hkSubShortDate(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ''));
  return match ? `${match[1].slice(2)}.${match[2]}.${match[3]}` : String(date || '');
}

function _hkSubSigned(value) {
  const number = Number(value) || 0;
  return (number > 0 ? '+' : '') + number.toLocaleString();
}

function _hkSubSortIncreases(list) {
  list.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/* 이력 칸 — 최근 3건을 날짜 순으로 배지로 보여주고 나머지는 "외 N건", 아래에 누적 금액. */
function _hkSubIncreaseCellInner(product) {
  const list = product.increases || [];
  if (!list.length) return '<span class="hk-sub-inc-empty"><i class="fa-solid fa-plus"></i> 기록</span>';
  const shown = list.slice(-3);
  const chips = shown.map(item => `<span class="hk-sub-inc ${item.amount < 0 ? 'down' : 'up'}${item.pending ? ' pending' : ''}"><em>${_hkSubShortDate(item.date)}</em>${_hkSubSigned(item.amount)}</span>`).join('');
  const more = list.length > shown.length ? `<span class="hk-sub-inc-more">외 ${list.length - shown.length}건</span>` : '';
  const total = list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  return `<div class="hk-sub-inc-list">${more}${chips}</div><div class="hk-sub-inc-total">누적 ${_hkSubSigned(total)}원 · ${list.length}회</div>`;
}

function _hkSubRefreshIncreaseCell(row) {
  const product = HK_SUB_PRODUCTS[Number(row?.dataset.rowIndex)];
  const cell = row?.querySelector('.hk-sub-increase');
  if (product && cell) cell.innerHTML = _hkSubIncreaseCellInner(product);
}

/* 공급원가 조정·직접 수정을 오늘 날짜의 인상 이력으로 남긴다. 같은 날(저장 전) 여러 번이면 합치고, 합이 0이면 지운다. */
function _hkSubRecordIncrease(product, delta) {
  if (!delta) return;
  product.increases = product.increases || [];
  const today = _hkSubToday();
  const same = product.increases.find(item => item.pending && item.date === today);
  if (same) {
    same.amount += delta;
    if (!same.amount) product.increases.splice(product.increases.indexOf(same), 1);
  } else {
    product.increases.push({ date: today, amount: delta, pending: true });
    _hkSubSortIncreases(product.increases);
  }
}

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
    <td class="hk-sub-name">${product.name}</td>
    <td class="hk-iso-draft-code">${product.code}</td>
    <td class="hk-sub-cost hk-sub-cost-cell">
      <div class="hk-sub-cost-line">
        <div class="hk-iso-price-edit-wrap hk-sub-cost-direct-wrap">
          <input type="text" inputmode="numeric" class="pricing-input-field hk-sub-cost-input" value="${Number(product.cost).toLocaleString()}" data-original-cost="${Number(product.cost)}" onblur="finishHkSubCostEdit(this)" onkeydown="handleHkSubCostKey(event,this)" readonly aria-label="공급원가">
          <button type="button" class="hk-iso-row-price-edit-btn" onclick="beginHkSubCostEdit(this)" title="공급원가를 직접 수정"><i class="fa-solid fa-pen"></i></button>
        </div>
        <div class="hk-sub-adjust-wrap">
          <input type="text" inputmode="numeric" class="pricing-input-field hk-sub-cost-adjust-input" placeholder="+200" aria-label="공급원가 조정액" onkeydown="handleHkSubCostAdjustmentKey(event,this)">
          <button type="button" class="hk-sub-cost-adjust-btn" onclick="applyHkSubCostAdjustment(this)" title="입력한 금액을 공급원가와 판매가에 더합니다">적용</button>
        </div>
      </div>
      <div class="hk-sub-cost-history" data-original-cost="${Number(product.cost)}" hidden>변경 전 <span>${Number(product.cost).toLocaleString()}원</span> · <strong></strong><button type="button" onclick="revertHkSubCost(this)" title="변경 전 원가와 판매가로 되돌리기"><i class="fa-solid fa-rotate-left"></i></button></div>
    </td>
    <td class="hk-sub-increase" onclick="openHkSubIncreaseModal(this)" title="눌러서 가격 인상 이력 보기·수정 (공급원가와 판매가를 같은 금액만큼 올린 기록)">${_hkSubIncreaseCellInner(product)}</td>
    <td class="hk-sub-previous">${_hkIsoDraftNumber(product.previousPrice)}<small class="${difference > 0 ? 'up' : difference < 0 ? 'down' : ''}">${difference ? `${difference > 0 ? '+' : ''}${_hkIsoDraftNumber(difference)}` : '동일'}</small></td>
    <td class="hk-iso-draft-price hk-sub-price-cell">
      <input type="text" class="pricing-input-field hk-iso-final-price-input hk-sub-derived-price-input" value="${Number(product.price).toLocaleString()}" data-original-price="${Number(product.price)}" readonly tabindex="-1" aria-label="공급원가 연동 판매가">
      <div class="hk-iso-price-history" hidden>변경 전 <span>${Number(product.price).toLocaleString()}원</span></div>
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

/* 업체별 묶음 — 아이소핑크·스티로폼의 규격 그룹처럼 아코디언 하나가 업체 하나다.
   행 번호(rowIndex)는 HK_SUB_PRODUCTS 전체 기준 그대로라 저장·계산 코드는 바뀌지 않는다. */
function _hkSubGroups() {
  const groups = [];
  HK_SUB_PRODUCTS.forEach((product, index) => {
    const name = product.supplier || '승현기업';
    let group = groups.find(item => item.name === name);
    if (!group) {
      group = { name, items: [] };
      groups.push(group);
    }
    group.items.push({ product, index });
  });
  return groups;
}

function _hkSubTableHtml(items) {
  return `<div class="pricing-table-scroll">
    <table class="pricing-table hk-sub-table">
      <colgroup>
        <col class="hk-sub-col-name"><col class="hk-sub-col-code">
        <col class="hk-sub-col-cost"><col class="hk-sub-col-increase"><col class="hk-sub-col-previous"><col class="hk-sub-col-price"><col class="hk-sub-col-shipping">
        <col class="hk-sub-col-margin"><col class="hk-sub-col-rate"><col class="hk-sub-col-fee"><col class="hk-sub-col-vat">
        <col class="hk-sub-col-net"><col class="hk-sub-col-rate"><col class="hk-sub-col-rate">
      </colgroup>
      <thead><tr>
        <th class="hk-sub-head-base">제품명</th><th class="hk-sub-head-code">상품코드</th>
        <th class="hk-sub-head-base">공급원가</th><th class="hk-sub-head-base">가격 인상 이력</th><th class="hk-sub-head-base">이전 판매가</th><th class="hk-sub-head-sale-price">개당 판매가</th><th class="hk-sub-head-shipping">배송비</th>
        <th class="hk-sub-head-margin">마진</th><th class="hk-sub-head-margin">마진율</th><th class="hk-sub-head-margin">판매수수료<br><small>6%</small></th><th class="hk-sub-head-margin">부가세<br><small>10%</small></th>
        <th class="hk-sub-head-margin">개당 마진</th><th class="hk-sub-head-rate">순수마진율</th><th class="hk-sub-ref-margin-head">참고마진율</th>
      </tr></thead>
      <tbody>${items.map(({ product, index }) => _hkSubRowHtml(product, index)).join('')}</tbody>
    </table>
  </div>`;
}

/* 아이소핑크·스티로폼과 같은 모양의 아코디언 섹션(머리글 + 접었다 펴는 표) */
function _hkSubAccordionHtml(group, groupIndex) {
  const id = `sub_g${groupIndex}`;
  return `<div class="hk-iso-accordion${groupIndex === 0 ? ' open' : ''}" id="hkIsoAcc-${id}">
    <div class="hk-iso-accordion-head">
      <span class="hk-iso-accordion-title">${group.name}</span>
      <span class="hk-iso-accordion-count">상품 ${group.items.length}개</span>
      <button type="button" class="hk-iso-accordion-toggle" onclick="toggleHkIsoAccordion('${id}')" title="펼치기 / 접기" aria-label="${group.name} 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"></i></button>
    </div>
    <div class="hk-iso-accordion-body">${_hkSubTableHtml(group.items)}</div>
  </div>`;
}

/* 위쪽 설정 카드 — 아이소핑크·스티로폼 카드와 같은 자리에 단가 기준 년월을 둔다(한국단열 전체에 하나). */
function _hkSubSettingsCard() {
  return `<div class="card pricing-cost-card hk-iso-draft-margin-card" data-draft-tab="sub-shared">
    <div class="pricing-section-title">공통 설정 <span class="pricing-section-sub">— 공급원가를 고치면 판매가가 같은 금액만큼 함께 움직입니다 · 연필: 공급원가 직접 수정 · 조정액: +200 / -100 · 조정하면 가격 인상 이력에 오늘 날짜로 자동 기록(칸을 눌러 수정)</span></div>
    <div class="pricing-cost-footer hk-iso-shared-cost-controls">
      <div class="pricing-base-month-wrap">
        <label class="pricing-base-month-label" for="hkSubBaseMonth">단가 기준 년월</label>
        <input type="month" id="hkSubBaseMonth" class="pricing-input-field pricing-month-field" value="${HK_ISO_DRAFT_BASE_MONTH}" oninput="hkIsoSetBaseMonth(this.value)">
      </div>
    </div>
  </div>`;
}

function renderHkSubPane() {
  // 카드 id(hkIsoAcc-sub_all)는 저장 코드가 행의 판매가 입력칸을 찾는 기준이라 그대로 둔다.
  return `<div id="hkSubBaseDataSection">
    ${_hkSubSettingsCard()}<div id="hkIsoAcc-sub_all" class="card pricing-result-card hk-sub-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">한국단열 부자재 기준 판매가<span class="pricing-spec-badge">2026.06.09 기준 · ${HK_SUB_PRODUCTS.length}개</span></div>
      </div>
      <div class="hk-iso-accordion-list">
        ${_hkSubGroups().map(_hkSubAccordionHtml).join('')}
      </div>
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

function _hkSubUpdateHistory(row) {
  const costInput = row.querySelector('.hk-sub-cost-input');
  const priceInput = row.querySelector('.hk-iso-final-price-input');
  const costHistory = row.querySelector('.hk-sub-cost-history');
  const priceHistory = row.querySelector('.hk-iso-price-history');
  if (!costInput || !priceInput) return;
  const originalCost = Number(costInput.dataset.originalCost || 0);
  const currentCost = _hkIsoDraftParseNumber(costInput.value);
  const originalPrice = Number(priceInput.dataset.originalPrice || 0);
  const currentPrice = _hkIsoDraftParseNumber(priceInput.value);
  const costDelta = currentCost - originalCost;
  if (costHistory) {
    costHistory.hidden = costDelta === 0;
    const delta = costHistory.querySelector('strong');
    if (delta) delta.textContent = `${costDelta > 0 ? '+' : ''}${costDelta.toLocaleString()}원`;
  }
  if (priceHistory) priceHistory.hidden = currentPrice === originalPrice;
  row.querySelector('.hk-sub-cost-cell')?.classList.toggle('changed', costDelta !== 0);
  row.querySelector('.hk-sub-price-cell')?.classList.toggle('changed', currentPrice !== originalPrice);
}

window.beginHkSubCostEdit = function(source) {
  const cell = source.closest('.hk-sub-cost-cell');
  const input = cell?.querySelector('.hk-sub-cost-input');
  const row = cell?.closest('tr');
  if (!input || !row) return;
  const product = HK_SUB_PRODUCTS[Number(row.dataset.rowIndex)];
  input.dataset.editStartCost = String(product?.cost ?? _hkIsoDraftParseNumber(input.value));
  input.dataset.editStartPrice = String(product?.price ?? 0);
  input.readOnly = false;
  cell.classList.add('editing');
  input.focus();
  input.select();
};

window.finishHkSubCostEdit = function(input) {
  if (input.readOnly) return;
  const row = input.closest('tr');
  const product = HK_SUB_PRODUCTS[Number(row?.dataset.rowIndex)];
  if (!row || !product) return;
  const startCost = Number(input.dataset.editStartCost ?? product.cost) || 0;
  const startPrice = Number(input.dataset.editStartPrice ?? product.price) || 0;
  const parsed = _hkIsoDraftParseNumber(input.value);
  const nextCost = Math.max(0, Math.round(parsed));
  const delta = nextCost - startCost;
  product.cost = nextCost;
  product.price = Math.max(0, startPrice + delta);
  _hkSubRecordIncrease(product, delta);
  row.dataset.cost = String(product.cost);
  input.value = product.cost.toLocaleString();
  input.readOnly = true;
  input.closest('.hk-sub-cost-cell')?.classList.remove('editing');
  const priceInput = row.querySelector('.hk-iso-final-price-input');
  if (priceInput) {
    priceInput.value = product.price.toLocaleString();
    window.recalcHkSubRow(priceInput);
  }
  _hkSubUpdateHistory(row);
  _hkSubRefreshIncreaseCell(row);
};

window.handleHkSubCostKey = function(event, input) {
  if (event.key === 'Enter') input.blur();
  if (event.key === 'Escape') {
    input.value = Number(input.dataset.editStartCost || 0).toLocaleString();
    input.blur();
  }
};

window.applyHkSubCostAdjustment = function(source) {
  const cell = source.closest('.hk-sub-cost-cell');
  const row = cell?.closest('tr');
  const input = cell?.querySelector('.hk-sub-cost-adjust-input');
  const product = HK_SUB_PRODUCTS[Number(row?.dataset.rowIndex)];
  if (!row || !input || !product) return;
  const raw = String(input.value || '').replace(/,/g, '').trim();
  if (!/^[+-]?\s*\d+$/.test(raw)) {
    input.classList.add('invalid');
    input.focus();
    return;
  }
  const delta = Math.round(Number(raw.replace(/\s/g, '')));
  if (!Number.isFinite(delta) || delta === 0) {
    input.classList.add('invalid');
    input.focus();
    return;
  }
  const currentCost = Number(product.cost || 0);
  const nextCost = Math.max(0, currentCost + delta);
  const appliedDelta = nextCost - currentCost;
  product.cost = nextCost;
  product.price = Math.max(0, Number(product.price || 0) + appliedDelta);
  _hkSubRecordIncrease(product, appliedDelta);
  row.dataset.cost = String(product.cost);
  const costInput = row.querySelector('.hk-sub-cost-input');
  if (costInput) costInput.value = product.cost.toLocaleString();
  const priceInput = row.querySelector('.hk-iso-final-price-input');
  if (priceInput) {
    priceInput.value = product.price.toLocaleString();
    window.recalcHkSubRow(priceInput);
  }
  input.value = '';
  input.classList.remove('invalid');
  _hkSubUpdateHistory(row);
  _hkSubRefreshIncreaseCell(row);
};

window.handleHkSubCostAdjustmentKey = function(event, input) {
  input.classList.remove('invalid');
  if (event.key === 'Enter') {
    event.preventDefault();
    window.applyHkSubCostAdjustment(input);
  }
  if (event.key === 'Escape') input.value = '';
};

window.revertHkSubCost = function(button) {
  const row = button.closest('tr');
  const costInput = row?.querySelector('.hk-sub-cost-input');
  const priceInput = row?.querySelector('.hk-iso-final-price-input');
  const product = HK_SUB_PRODUCTS[Number(row?.dataset.rowIndex)];
  if (!row || !costInput || !priceInput || !product) return;
  product.cost = Number(costInput.dataset.originalCost || 0);
  product.price = Number(priceInput.dataset.originalPrice || 0);
  // 되돌리면 저장 전에 자동으로 남긴 인상 이력(점선 배지)도 함께 지운다.
  product.increases = (product.increases || []).filter(item => !item.pending);
  row.dataset.cost = String(product.cost);
  costInput.value = product.cost.toLocaleString();
  priceInput.value = product.price.toLocaleString();
  window.recalcHkSubRow(priceInput);
  _hkSubUpdateHistory(row);
  _hkSubRefreshIncreaseCell(row);
};

/* ─── 가격 인상 이력 편집 팝업(index.html #hkSubIncreaseModal) ─── */
let _hkSubIncreaseEditIndex = -1;

function _hkSubIncreaseRowHtml(item = {}) {
  const date = item.date || _hkSubToday();
  const amount = item.amount != null ? item.amount : '';
  return `<tr data-pending="${item.pending ? 1 : 0}">
    <td><input type="date" class="pim-input hk-sub-inc-date" value="${date}"></td>
    <td><input type="text" inputmode="numeric" class="pim-input hk-sub-inc-amount" value="${amount === '' ? '' : (amount > 0 ? '+' : '') + Number(amount).toLocaleString()}" placeholder="+250 / -100" onkeydown="if(event.key==='Enter')confirmHkSubIncreaseModal()"></td>
    <td><button type="button" class="hk-sub-inc-del" onclick="removeHkSubIncreaseRow(this)" title="이 이력 삭제"><i class="fa-solid fa-trash-can"></i></button></td>
  </tr>`;
}

window.openHkSubIncreaseModal = function(source) {
  const row = source.closest('tr');
  const index = Number(row?.dataset.rowIndex);
  const product = HK_SUB_PRODUCTS[index];
  const modal = document.getElementById('hkSubIncreaseModal');
  const body = document.getElementById('hkSubIncreaseModalBody');
  if (!product || !modal || !body) return;
  _hkSubIncreaseEditIndex = index;
  document.getElementById('hkSubIncreaseModalTitle').textContent = `${product.name} — 가격 인상 이력`;
  body.innerHTML = `<div class="pim-margin-hint">공급원가와 판매가를 같은 금액만큼 올린 기록입니다(내렸으면 음수). 날짜와 금액은 언제든 고칠 수 있고, 공급원가 조정 [적용]을 누르면 오늘 날짜로 자동으로 추가됩니다. 이 기록은 현재 공급원가·판매가를 바꾸지 않습니다.</div>
    <div class="pim-table-scroll-wrap">
      <table class="pim-table hk-sub-inc-modal-table">
        <thead><tr><th>인상일</th><th>올린 금액 (원)</th><th></th></tr></thead>
        <tbody id="hkSubIncreaseModalRows">${(product.increases || []).map(_hkSubIncreaseRowHtml).join('')}</tbody>
      </table>
    </div>
    <button type="button" class="pricing-margin-edit-btn hk-sub-inc-add" onclick="addHkSubIncreaseRow()"><i class="fa-solid fa-plus"></i> 이력 추가</button>`;
  modal.style.display = 'flex';
};

window.closeHkSubIncreaseModal = function() {
  const modal = document.getElementById('hkSubIncreaseModal');
  if (modal) modal.style.display = 'none';
  _hkSubIncreaseEditIndex = -1;
};

window.addHkSubIncreaseRow = function() {
  const tbody = document.getElementById('hkSubIncreaseModalRows');
  if (!tbody) return;
  tbody.insertAdjacentHTML('beforeend', _hkSubIncreaseRowHtml());
  tbody.lastElementChild.querySelector('.hk-sub-inc-amount')?.focus();
};

window.removeHkSubIncreaseRow = function(button) {
  button.closest('tr')?.remove();
};

window.confirmHkSubIncreaseModal = function() {
  const product = HK_SUB_PRODUCTS[_hkSubIncreaseEditIndex];
  const tbody = document.getElementById('hkSubIncreaseModalRows');
  if (!product || !tbody) return;
  const next = [];
  let valid = true;
  [...tbody.querySelectorAll('tr')].forEach(tr => {
    const dateInput = tr.querySelector('.hk-sub-inc-date');
    const amountInput = tr.querySelector('.hk-sub-inc-amount');
    const raw = String(amountInput.value || '').replace(/[,\s]/g, '');
    const okDate = /^\d{4}-\d{2}-\d{2}$/.test(dateInput.value);
    const okAmount = /^[+-]?\d+$/.test(raw) && Number(raw) !== 0;
    dateInput.classList.toggle('invalid', !okDate);
    amountInput.classList.toggle('invalid', !okAmount);
    if (!okDate || !okAmount) { valid = false; return; }
    const item = { date: dateInput.value, amount: Math.round(Number(raw)) };
    if (tr.dataset.pending === '1') item.pending = true;
    next.push(item);
  });
  if (!valid) return;
  _hkSubSortIncreases(next);
  product.increases = next;
  const row = document.querySelector(`.hk-sub-table tr[data-row-index="${_hkSubIncreaseEditIndex}"]`);
  _hkSubRefreshIncreaseCell(row);
  window.closeHkSubIncreaseModal();
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

document.addEventListener('click', function(event) {
  const modal = document.getElementById('hkSubIncreaseModal');
  if (modal && event.target === modal) window.closeHkSubIncreaseModal();
});

/* 저장에 성공하면 호출된다(pricing-hankook-db.js) — 저장 전 표시(점선)를 없애고, "변경 전" 기준도 방금 저장한 값으로 맞춘다. */
window.hkSubMarkSaved = function() {
  HK_SUB_PRODUCTS.forEach(product => (product.increases || []).forEach(item => { delete item.pending; }));
  document.querySelectorAll('.hk-sub-table tbody tr').forEach(row => {
    const product = HK_SUB_PRODUCTS[Number(row.dataset.rowIndex)];
    const costInput = row.querySelector('.hk-sub-cost-input');
    if (!product || !costInput) return;
    costInput.dataset.originalCost = String(product.cost);
    const history = row.querySelector('.hk-sub-cost-history');
    if (history) {
      history.dataset.originalCost = String(product.cost);
      const span = history.querySelector('span');
      if (span) span.textContent = `${Number(product.cost).toLocaleString()}원`;
    }
    _hkSubUpdateHistory(row);
    _hkSubRefreshIncreaseCell(row);
  });
};

window.hkSubProductIndex = function() {
  return HK_SUB_PRODUCTS.map((row, rowIndex) => ({
    code: row.code,
    block: null,
    // 가격 인상 이력도 같은 JSON에 둔다(저장 전 표시용 pending 플래그는 저장하지 않는다).
    ship: { subCost: Number(row.cost), increases: (row.increases || []).map(({ date, amount }) => ({ date, amount })) },
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

/* ═══════════════════════════════════════
   한국단열라이프 채널 — 부자재 (2026-09-22 사용자 제공 표)

   상품ID가 적힌 행부터 다음 상품ID 전까지를 같은 네이버 상품의 옵션으로 묶는다.
   공통 부자재 상품코드가 있는 항목은 HK_SUB_PRODUCTS의 현재 판매가를 그대로 가져오며,
   어싱매트·실외기 커버처럼 아직 공통 상품코드가 없는 항목만 targetPrice를 직접 둔다.
   타이거폼2K와 라이트폼은 실제 옵션 가격보다 낮은 별도 네이버 기준가가 있으므로
   product.basePrice로 각각 330,000원·290,000원을 보존한다.
═══════════════════════════════════════ */
(function addHkdLifeSubProducts() {
  const item = (productCode, productName, prevPrice, extra = {}) => ({
    productCode,
    productName,
    prevPrice,
    prevShipping: extra.prevShipping ?? 3000,
    stock: 99999999,
    ...extra,
  });
  const product = (productId, baseShipping, shippingBasis, jejuShipping, returnExchange, items, extra = {}) => ({
    categoryId: 'hk_sub',
    productId,
    baseShipping,
    shippingBasis,
    jejuShipping,
    returnExchange,
    items,
    ...extra,
  });
  const direct = (code, name, targetPrice) => item(code, name, targetPrice, {
    targetPrice,
    displayCode: '—',
  });

  HK_CHANNEL_LISTINGS.hkd_life = [
    product('12180989963', 3000, '30개마다', 10000, '6000/12000', [
      item('TP_GY100', '회색면테이프 100mm 25M', 8500),
      item('TP_GY48', '회색면테이프 48mm 25M', 5000),
    ]),
    product('12180967307', 3000, '-', 10000, '6000/12000', [
      item('TP_TR', 'OPP테이프', 1500),
      item('TP_AL', '은박테이프', 3000),
    ]),
    product('12180953634', 3000, '15개마다', 10000, '6000/12000', [
      item('TP_AL', '은박테이프', 3000),
      item('TP_TR', 'OPP테이프', 1500),
    ]),
    product('12180880762', 3000, '10개마다', 10000, '6000/12000', [
      item('W_FC', '폼크리너', 3500),
    ]),
    product('12177020511', 3000, '15개마다', 10000, '6000/12000', [
      item('MR', '곰팡이 제거제', 5200),
    ]),
    product('12176974333', 3000, '15개마다', 10000, '6000/12000', [
      item('T_SR', '타이거 스티커제거제', 3500),
    ]),
    product('12176934520', 3000, '15개마다', 10000, '6000/12000', [
      item('T_SA', '타이거 스프레이접착제', 10000),
    ]),
    product('12176887744', 3000, '10개마다', 10000, '6000/12000', [
      item('H_542', '도배본드 형제 542본드', 3500),
    ]),
    product('12176851590', 3000, '2개마다', 10000, '6000/12000', [
      item('H_HT', '하이테크 접착제', 23000),
    ]),
    product('12176748939', 3000, '20개마다', 10000, '6000/12000', [
      item('H_025', '바인더 접착제', 4500),
    ]),
    product('12171440423', 3000, '5개마다', 10000, '6000/12000', [
      item('U_FB_SET', '유니패스트본드+유니폼건세트', 18500),
    ]),
    product('12171401993', 3000, '5개마다', 10000, '6000/12000', [
      item('T_SF_251SET', '타이거스프레이폼+월드폼건251 세트', 25500),
    ]),
    product('12171353853', 3000, '5개마다', 10000, '6000/12000', [
      item('W_SF_251SET', '월드스프레이폼+월드폼건251 세트', 27200),
    ]),
    product('12171297137', 3000, '15개마다', 10000, '6000/12000', [
      item('T_GUN_RED', '타이거 폼건 기본형_레드', 24000),
      item('T_GUN_BLK', '타이거 폼건 고급형_블랙', 32000),
      item('T_GUN_PRO', '타이거 폼건 전문가용', 44000),
      item('T_GUN_PRM', '타이거 폼건 프리미엄', 74000),
    ]),
    product('12171002010', 3000, '7개마다', 10000, '6000/12000', [
      item('U_GUN', '유니 폼건', 12600),
    ]),
    product('12170986439', 3000, '7개마다', 10000, '6000/12000', [
      item('W_GUN_251', '월드 251폼건', 16500),
    ]),
    product('12170777448', 3000, '5개마다', 10000, '6000/12000', [
      item('HC_FREE', '프리커터기', 56000),
    ]),
    product('12170745283', 3000, '5개마다', 10000, '6000/12000', [
      item('HC_ELIM', '엘림 열선커터기', 28000),
    ]),
    product('12170717343', 3000, '5개마다', 10000, '6000/12000', [
      item('HC_USB', 'USB 열선커터기', 16900),
    ]),
    product('12170600653', 0, '-', 16000, '13000/26000', [
      item('T_2K_H', '타이거폼2K 경질 (주제+경화제) 1세트', 330000),
      item('T_2K_S', '타이거폼2K 연질 (주제+경화제) 1세트', 330000),
    ], { basePrice: 330000 }),
    product('12170576219', 0, '-', 16000, '13000/26000', [
      item('TW_LF_H', '라이트폼 경질 (주제+경화제) 1세트', 290000),
      item('TW_LF_S', '라이트폼 연질 (주제+경화제) 1세트', 290000),
    ], { basePrice: 290000 }),
    product('12115421548', 3000, '10개마다', 10000, '6000/12000', [
      item('U_FB', '유니 패스트본드 건용', 6500),
    ]),
    product('12083617577', 3000, '5개마다', 10000, '6000/12000', [
      direct('HKL_EARTH_M', '어싱매트 중형 (50cm x 90cm)', 16000),
      direct('HKL_EARTH_L', '어싱매트 대형 (50cm x 120cm)', 20000),
    ]),
    product('12043329222', 3000, '5개마다', 10000, '6000/12000', [
      direct('HKL_COVER_PVC_A', '실외기 방수커버 PVC 58cm x 57cm x 28cm_A형', 5800),
      direct('HKL_COVER_PVC_B', '실외기 방수커버 PVC 70cm x 57cm x 28cm_B형', 6500),
      direct('HKL_COVER_PVC_C', '실외기 방수커버 PVC 80cm x 70cm x 35cm_C형', 7000),
      direct('HKL_COVER_PVC_D', '실외기 방수커버 PVC 90cm x 70cm x 35cm_D형', 7500),
      direct('HKL_COVER_PVC_E', '실외기 방수커버 PVC 95cm x 85cm x 38cm_E형', 8500),
      direct('HKL_COVER_TARP_A', '실외기 방수커버 타포린 58cm x 57cm x 28cm_A형', 14000),
      direct('HKL_COVER_TARP_B', '실외기 방수커버 타포린 70cm x 57cm x 28cm_B형', 14500),
      direct('HKL_COVER_TARP_C', '실외기 방수커버 타포린 80cm x 70cm x 35cm_C형', 18000),
      direct('HKL_COVER_TARP_D', '실외기 방수커버 타포린 90cm x 70cm x 35cm_D형', 18000),
      direct('HKL_COVER_TARP_E', '실외기 방수커버 타포린 95cm x 85cm x 38cm_E형', 22500),
    ]),
    product('12115378507', 7800, '1개마다', 16000, '16000/32000', [
      item('W_B2_G_B', '월드 폼본드 B2 건용_1박스', 105000),
    ]),
    product('12115359167', 3000, '10개마다', 10000, '6000/12000', [
      item('W_B2_G', '월드 폼본드 B2 건용', 7500),
    ]),
    product('12115290303', 3000, '1개마다', 16000, '16000/32000', [
      item('W_SFB_G_B', '월드 스피드폼 건용_1박스', 155000),
    ]),
    product('12115283640', 3000, '10개마다', 10000, '6000/12000', [
      item('W_SFB_G', '월드 스피드폼 건용', 10500),
    ]),
    product('12114965914', 3000, '1개마다', 16000, '16000/32000', [
      item('W_SF_G_B', '월드 스프레이폼_1박스', 150000),
    ]),
    product('12114957587', 3000, '10개마다', 10000, '6000/12000', [
      item('W_SF_G', '월드 스프레이폼 건용', 10200),
    ]),
    product('12114748092', 3000, '10개마다', 10000, '6000/12000', [
      item('T_BIG65_G', '타이거폼 BIG65 건용', 7200),
    ]),
    product('12114719624', 7800, '1개마다', 16000, '16000/32000', [
      item('T_B2_G_B', '타이거폼 B2 건용_1박스', 155000, { prevShipping: 7800 }),
    ]),
    product('12114711415', 3000, '10개마다', 10000, '6000/12000', [
      item('T_B2_G', '타이거폼 B2 건용', 11500, { prevShipping: 7800 }),
    ]),
    product('12114684775', 7800, '1개마다', 16000, '16000/32000', [
      item('T_B1_G_B', '타이거폼 B1 건용_1박스', 245000, { prevShipping: 7800 }),
    ]),
    product('12114677071', 3000, '10개마다', 10000, '6000/12000', [
      item('T_B1_G', '타이거폼 B1 건용', 17500, { prevShipping: 7800 }),
    ]),
    product('12114623723', 7800, '1개마다', 16000, '16000/32000', [
      item('T_SF_G_B', '타이거 스프레이폼 건용_1박스', 125000, { prevShipping: 7800 }),
    ]),
    product('12114605576', 3000, '10개마다', 10000, '6000/12000', [
      item('T_SF_G', '타이거 스프레이폼 건용', 8800, { prevShipping: 7800 }),
    ]),
    product('12101967474', 7800, '1개마다', 16000, '16000/32000', [
      item('T_SFB_G_B', '타이거 스피드폼본드 건용_1박스', 120000, { prevShipping: 7800 }),
    ]),
    product('12101928855', 3000, '10개마다', 10000, '6000/12000', [
      item('T_SFB_G', '타이거 스피드폼본드 건용', 8300, { prevShipping: 7800 }),
    ]),
    product('12101770224', 7800, '1개마다', 16000, '16000/32000', [
      item('T_EB_G_B', '타이거 이지본드 건용_1박스', 115000, { prevShipping: 7800 }),
    ]),
    product('12101756255', 3000, '10개마다', 10000, '6000/12000', [
      item('T_EB_G', '타이거 이지본드 건용', 8300, { prevShipping: 7800 }),
    ]),
    product('12101724124', 7800, '1개마다', 16000, '16000/32000', [
      item('T_EB_D_B', '타이거 이지본드 일회용_1박스', 110000, { prevShipping: 7800 }),
    ]),
    product('12101724123', 3000, '10개마다', 10000, '6000/12000', [
      item('T_EB_D', '타이거 이지본드 일회용', 7900, { prevShipping: 7800 }),
    ]),
    product('12101607902', 7800, '1개마다', 16000, '16000/32000', [
      item('T_TF_G_B', '타이거폼 건용_1박스', 75000, { prevShipping: 7800 }),
    ], { basePrice: 75000 }),
    product('12101607901', 3000, '10개마다', 10000, '6000/12000', [
      item('T_TF_G', '타이거폼 건용', 5400, { prevShipping: 0 }),
    ], { basePrice: 5400 }),
    product('12101581936', 7800, '1개마다', 16000, '16000/32000', [
      item('T_TF_D_B', '타이거폼 일회용_1박스', 65000, { prevShipping: 0 }),
    ], { basePrice: 65000 }),
    product('12101581935', 3000, '10개마다', 10000, '6000/12000', [
      item('T_TF_D', '타이거폼 일회용', 4800),
    ], { basePrice: 4800 }),
  ];

  // 신규 채널은 현재 정상값에서 시작한다. 이후 원가표 판매가나 배송 정책이 바뀐 경우에만
  // "수정 전"과 차이가 생기도록 현재 판매가·배송비를 최초 기준선으로 맞춘다.
  HK_CHANNEL_LISTINGS.hkd_life.forEach(channelProduct => {
    channelProduct.items.forEach(channelItem => {
      const currentPrice = channelItem.targetPrice != null
        ? Number(channelItem.targetPrice)
        : window.hkSubPriceByCode(channelItem.productCode);
      if (currentPrice != null && Number.isFinite(currentPrice)) channelItem.prevPrice = currentPrice;
      channelItem.prevShipping = Number(channelProduct.baseShipping || 0);
    });
  });
})();
