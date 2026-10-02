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

/* 원가 없는 항목(실외기 커버·어싱매트) — 공급원가·마진 칸은 "—", 판매가는 연필로 직접 고친다. */
function _hkSubNoCostRowHtml(product, rowIndex) {
  const difference = Number(product.price) - Number(product.previousPrice);
  return `<tr data-row-index="${rowIndex}" data-product-code="${product.code}" data-no-cost="1">
    <td class="hk-sub-name">${product.name}</td>
    <td class="hk-iso-draft-code">${product.code}</td>
    <td class="hk-sub-cost hk-sub-cost-cell hk-sub-no-cost" title="원가를 계산하지 않는 상품 — 판매가를 직접 관리합니다">원가 없음</td>
    <td class="hk-sub-increase-none">—</td>
    <td class="hk-sub-previous">${_hkIsoDraftNumber(product.previousPrice)}<small class="${difference > 0 ? 'up' : difference < 0 ? 'down' : ''}">${difference ? `${difference > 0 ? '+' : ''}${_hkIsoDraftNumber(difference)}` : '동일'}</small></td>
    <td class="hk-iso-draft-price hk-sub-price-cell">
      <div class="hk-iso-price-edit-wrap">
        <input type="text" inputmode="numeric" class="pricing-input-field hk-iso-final-price-input" value="${Number(product.price).toLocaleString()}" data-original-price="${Number(product.price)}" onblur="finishHkSubPriceEdit(this)" onkeydown="handleHkSubPriceKey(event,this)" readonly aria-label="판매가">
        <button type="button" class="hk-iso-row-price-edit-btn" onclick="beginHkSubPriceEdit(this)" title="판매가를 직접 수정"><i class="fa-solid fa-pen"></i></button>
      </div>
      <div class="hk-iso-price-history" hidden>변경 전 <span>${Number(product.price).toLocaleString()}원</span></div>
    </td>
    <td class="hk-sub-shipping">${product.shipping ? _hkIsoDraftNumber(product.shipping) : '—'}</td>
    <td class="hk-sub-margin">—</td><td class="hk-sub-margin-rate">—</td><td class="hk-sub-fee">—</td><td class="hk-sub-vat">—</td>
    <td class="hk-sub-net-margin">—</td><td class="hk-sub-net-rate">—</td><td class="hk-sub-ref-margin">—</td>
  </tr>`;
}

function _hkSubRowHtml(product, rowIndex) {
  if (product.noCost) return _hkSubNoCostRowHtml(product, rowIndex);
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

/* 원가 없는 항목의 판매가 직접 수정 */
window.beginHkSubPriceEdit = function(button) {
  const input = button.closest('.hk-sub-price-cell')?.querySelector('.hk-iso-final-price-input');
  if (!input) return;
  input.dataset.editStartPrice = String(_hkIsoDraftParseNumber(input.value));
  input.readOnly = false;
  input.closest('.hk-sub-price-cell').classList.add('editing');
  input.focus();
  input.select();
};

window.finishHkSubPriceEdit = function(input) {
  if (input.readOnly) return;
  const row = input.closest('tr');
  const product = HK_SUB_PRODUCTS[Number(row?.dataset.rowIndex)];
  if (!row || !product) return;
  const next = Math.max(0, Math.round(_hkIsoDraftParseNumber(input.value)));
  product.price = next;
  input.value = next.toLocaleString();
  input.readOnly = true;
  input.closest('.hk-sub-price-cell')?.classList.remove('editing');
  _hkSubUpdateHistory(row);
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

window.handleHkSubPriceKey = function(event, input) {
  if (event.key === 'Enter') input.blur();
  if (event.key === 'Escape') {
    input.value = Number(input.dataset.editStartPrice || 0).toLocaleString();
    input.blur();
  }
};

function _hkSubUpdateHistory(row) {
  if (row.dataset.noCost) {
    const priceInput = row.querySelector('.hk-iso-final-price-input');
    const priceHistory = row.querySelector('.hk-iso-price-history');
    if (!priceInput) return;
    const changed = _hkIsoDraftParseNumber(priceInput.value) !== Number(priceInput.dataset.originalPrice || 0);
    if (priceHistory) priceHistory.hidden = !changed;
    row.querySelector('.hk-sub-price-cell')?.classList.toggle('changed', changed);
    return;
  }
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
    if (product && row.dataset.noCost) {
      // 원가 없는 항목 — 방금 저장한 판매가가 새 "변경 전" 기준이다.
      const priceInput = row.querySelector('.hk-iso-final-price-input');
      if (priceInput) {
        priceInput.dataset.originalPrice = String(product.price);
        const span = row.querySelector('.hk-iso-price-history span');
        if (span) span.textContent = `${Number(product.price).toLocaleString()}원`;
        _hkSubUpdateHistory(row);
      }
      return;
    }
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
    ship: { ...(row.noCost ? {} : { subCost: Number(row.cost) }), increases: (row.increases || []).map(({ date, amount }) => ({ date, amount })) },
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
   실외기 커버·어싱매트 — 원가 없는 공통 부자재 (2026-09-30, 사용자 요청)
   여러 몰(한국단열·한국단열라이프…)에서 같이 파는데 원가는 계산하지 않는다. 그래도 몰마다 가격을 맞추는 기준이 있어야 해서
   판매가를 이 부자재 표에 두고(cost: null, noCost: true), 몰별 단가표는 관리코드로 이 가격을 가져간다.
   - 공급원가·마진 칸은 "—"이고 판매가는 연필로 직접 고친다(원가 조정 없음). 저장은 다른 부자재와 같이 hk_products 판매가로.
   - 관리코드: 절전커버 COVER_SAVE_{5|9|14|20|30}_{M|L|XL}, 방수커버 COVER_{PVC|TARP}_{A~E}, 어싱매트 EARTH_M / EARTH_L.
   - 옵션 이름·치수는 사용자가 준 스토어 옵션명(PVC E형·타포린 E형 96cm, 타포린 C형 80x65x28).
   - 어싱매트는 한국단열은 15,000/19,000, 한국단열라이프는 아직 옛 가격 16,000/20,000이다. 기준은 한국단열 가격이고,
     라이프도 이 기준을 따라 "수정 전 16,000 → 15,000" 인하 반영 대기로 표에 보이게 했다(prevFixed).
═══════════════════════════════════════ */
const HK_OUTDOOR_COVER_SAVE = [
  ['COVER_SAVE_5_M', '실외기 절전커버 5T 50cm x 70cm_중형', 5500], ['COVER_SAVE_5_L', '실외기 절전커버 5T 50cm x 110cm_대형', 6500], ['COVER_SAVE_5_XL', '실외기 절전커버 5T 50cm x 130cm_특대형', 7500],
  ['COVER_SAVE_9_M', '실외기 절전커버 9T 50cm x 70cm_중형', 5800], ['COVER_SAVE_9_L', '실외기 절전커버 9T 50cm x 110cm_대형', 6500], ['COVER_SAVE_9_XL', '실외기 절전커버 9T 50cm x 130cm_특대형', 7500],
  ['COVER_SAVE_14_M', '실외기 절전커버 14T 50cm x 70cm_중형', 11000], ['COVER_SAVE_14_L', '실외기 절전커버 14T 50cm x 110cm_대형', 12300], ['COVER_SAVE_14_XL', '실외기 절전커버 14T 50cm x 130cm_특대형', 14200],
  ['COVER_SAVE_20_M', '실외기 절전커버 20T 50cm x 70cm_중형', 16000], ['COVER_SAVE_20_L', '실외기 절전커버 20T 50cm x 110cm_대형', 18000], ['COVER_SAVE_20_XL', '실외기 절전커버 20T 50cm x 130cm_특대형', 20000],
  ['COVER_SAVE_30_M', '실외기 절전커버 30T 50cm x 70cm_중형', 24000], ['COVER_SAVE_30_L', '실외기 절전커버 30T 50cm x 110cm_대형', 25000], ['COVER_SAVE_30_XL', '실외기 절전커버 30T 50cm x 130cm_특대형', 27000],
];
const HK_OUTDOOR_COVER_WATERPROOF = [
  ['COVER_PVC_A', '실외기 방수커버 PVC 58cm x 57cm x 28cm_A형', 5800],
  ['COVER_PVC_B', '실외기 방수커버 PVC 70cm x 57cm x 28cm_B형', 6500],
  ['COVER_PVC_C', '실외기 방수커버 PVC 80cm x 70cm x 35cm_C형', 7000],
  ['COVER_PVC_D', '실외기 방수커버 PVC 90cm x 70cm x 35cm_D형', 7500],
  ['COVER_PVC_E', '실외기 방수커버 PVC 96cm x 85cm x 38cm_E형', 8500],
  ['COVER_TARP_A', '실외기 방수커버 타포린 58cm x 57cm x 28cm_A형', 14000],
  ['COVER_TARP_B', '실외기 방수커버 타포린 70cm x 57cm x 28cm_B형', 14500],
  ['COVER_TARP_C', '실외기 방수커버 타포린 80cm x 65cm x 28cm_C형', 18000],
  ['COVER_TARP_D', '실외기 방수커버 타포린 90cm x 70cm x 35cm_D형', 18000],
  ['COVER_TARP_E', '실외기 방수커버 타포린 96cm x 85cm x 38cm_E형', 22500],
];
const HK_EARTH_MAT = [
  ['EARTH_M', '어싱매트 중형 (50cm x 90cm)', 15000],
  ['EARTH_L', '어싱매트 대형 (50cm x 120cm)', 19000],
];
[...HK_OUTDOOR_COVER_SAVE, ...HK_OUTDOOR_COVER_WATERPROOF, ...HK_EARTH_MAT].forEach(([code, name, price]) => {
  HK_SUB_PRODUCTS.push({
    supplier: '실외기 커버·어싱매트', name, code, cost: null, noCost: true,
    previousPrice: price, price, shipping: 3000, refMargin: null, increases: [],
  });
});

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
  // 공통 상품코드가 없는 항목은 코드 칸에 "—"를 보이고, 사용자가 정식 관리코드를 정한 항목(showCode)은 그 코드를 그대로 보여준다.
  const direct = (code, name, targetPrice, { showCode = false } = {}) => item(code, name, targetPrice, {
    targetPrice,
    ...(showCode ? {} : { displayCode: '—' }),
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
      // 관리코드 EARTH_M / EARTH_L — 사용자가 정함(2026-09-30, 임시였던 HKL_EARTH_M/L에서 바꿈). 스토어 옵션에도 이 관리코드를 등록하면 스토어 가격검사가 코드로 짝짓는다.
      // 공통 부자재 가격(한국단열 15,000/19,000)을 따르되, 스토어에 지금 올라 있는 값(16,000/20,000)이 "수정 전"이라 표에 인하 반영 대기로 보인다(prevFixed).
      item('EARTH_M', '어싱매트 중형 (50cm x 90cm)', 16000, { prevFixed: true }),
      item('EARTH_L', '어싱매트 대형 (50cm x 120cm)', 20000, { prevFixed: true }),
    ]),
    product('12043329222', 3000, '5개마다', 10000, '6000/12000', [
      // 실외기 방수커버 — 공통 부자재 표의 가격을 관리코드로 가져온다(아래 forEach가 수정 전 판매가를 맞춘다).
      ...HK_OUTDOOR_COVER_WATERPROOF.map(([code, name]) => item(code, name, 0)),
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
      if (!channelItem.prevFixed && currentPrice != null && Number.isFinite(currentPrice)) channelItem.prevPrice = currentPrice;
      channelItem.prevShipping = Number(channelProduct.baseShipping || 0);
    });
  });
})();

/* ═══════════════════════════════════════
   한국단열(hkd) 채널 — 부자재 (2026-09-29, 사용자가 준 표 3개 = 상품 46개·옵션 107개).
   상품ID가 적힌 행부터 다음 상품ID 전까지가 같은 네이버 상품의 옵션이다. 판매가는 HK_SUB_PRODUCTS(부자재 1단계)에서
   코드로 가져오고, 표의 "현재 판매가·기준가·옵션추가금"은 검증용으로만 썼다(수정 전 판매가·배송비는 사용자 규칙대로
   표의 "수정 전" 열이 아니라 현재 값으로 채운다 — 아래 forEach).
   - 기준가: 첫 옵션 가격이 기본이고, 표의 기준가가 첫 옵션 가격과 다르면 그 값을 product.basePrice로 둔다(스프레이접착제 9,500,
     건용_1박스 78,000, 251세트 24,500, 유니폼건 16,500, 회색면테이프 7,500, 곰팡이 제거제 5,200).
   - 스토어 옵션에 없는 판매중지 옵션(마닉스·펜형 열선커터기, 탑 폼건, 쎈 폼건)은 status: 'stopped'(2026-09-29 첫 검사에서 "스토어에 없음"으로 나와 사용자 확인). 재고는 기본 99,999,999.
   - 표의 사소한 불일치는 코드값으로 정리: "타이거퐁 B1 건용"→"타이거폼 B1 건용", 445923250의 두 번째 옵션 배송비 기준 "-"는 상품 기준인
     "8개마다", 520849850 제주배송비는 표대로 10,000.
═══════════════════════════════════════ */
(function addHkdSubProducts() {
  const product = (productId, shipping, items, basePrice) => ({
    categoryId: 'hk_sub',
    productId,
    baseShipping: shipping[0],
    shippingBasis: shipping[1],
    jejuShipping: shipping[2],
    returnExchange: shipping[3],
    ...(basePrice != null ? { basePrice } : {}),
    items: items.map(([productCode, productName, flag]) => ({
      productCode,
      productName,
      prevPrice: 0,
      prevShipping: shipping[0],
      ...(flag === 'stopped' ? { status: 'stopped' } : {}),
    })),
  });
  // [배송비, 배송비 기준, 제주배송비, 편도/교환]
  const s = (basis, jeju = 10000, exchange = '6000/12000') => [3000, basis, jeju, exchange];
  const BOX = [7800, '1개마다', 16000, '16000/32000'];
  const SET = [0, '-', 16000, '13000/26000'];

  HK_CHANNEL_LISTINGS.hkd.push(
    // ── 표 1: 타이거폼 계열 ──
    product('4132789099', s('15개마다'), [['T_TF_G', '타이거폼 건용'], ['T_TF_D', '타이거폼 일회용'], ['W_FC', '월드 폼크리너']]),
    product('676490504', s('10개마다'), [['T_TF_D', '타이거폼 일회용'], ['T_TF_G', '타이거폼 건용'], ['W_FC', '월드 폼크리너']]),
    product('670342159', s('15개마다'), [['T_EB_D', '타이거 이지본드 일회용'], ['T_EB_G', '타이거 이지본드 건용'], ['W_FC', '월드 폼크리너']]),
    product('682036041', s('7개마다'), [['T_EB_G', '타이거 이지본드 건용'], ['T_EB_D', '타이거 이지본드 일회용']]),
    product('5555044516', s('8개마다'), [['T_B1_G', '타이거폼 B1 건용'], ['T_B2_G', '타이거폼 B2 건용'], ['T_BIG65_G', '타이거폼 BIG65 건용'], ['T_TF_D', '타이거폼 일회용'], ['T_TF_G', '타이거폼 건용']]),
    product('3394412887', s('15개마다'), [['T_B2_G', '타이거폼 B2 건용'], ['T_B1_G', '타이거폼 B1 건용'], ['T_BIG65_G', '타이거폼 BIG65 건용']]),
    product('5555088019', s('5개마다'), [['T_BIG65_G', '타이거폼 BIG65 건용'], ['T_TF_D', '타이거폼 일회용'], ['T_TF_G', '타이거폼 건용'], ['T_B1_G', '타이거폼 B1 건용'], ['T_B2_G', '타이거폼 B2 건용'], ['W_FC', '월드 폼크리너']]),
    product('10839353059', s('12개마다', 10000, '7000/14000'), [['T_SF_G', '타이거 스프레이폼 건용']]),
    product('10892795922', s('15개마다'), [['T_SFB_G', '타이거 스피드폼본드 건용']]),
    product('10967850532', s('15개마다'), [['T_SA', '타이거 스프레이접착제']], 9500),
    product('10968989047', s('15개마다'), [['T_SR', '타이거 스티커제거제']]),
    product('10957702632', BOX, [['T_TF_G_B', '타이거폼 건용_1박스'], ['T_TF_D_B', '타이거폼 일회용_1박스']], 78000),
    product('676502263', BOX, [['T_TF_D_B', '타이거폼 일회용_1박스'], ['T_TF_G_B', '타이거폼 건용_1박스']]),
    product('5558179327', BOX, [['T_EB_G_B', '타이거 이지본드 건용_1박스'], ['T_EB_D_B', '타이거 이지본드 일회용_1박스']]),
    product('10957312733', BOX, [['T_EB_D_B', '타이거 이지본드 일회용_1박스'], ['T_EB_G_B', '타이거 이지본드 건용_1박스']]),
    product('10957558972', BOX, [['T_B1_G_B', '타이거폼 B1 건용_1박스'], ['T_B2_G_B', '타이거폼 B2 건용_1박스']]),
    product('670339936', BOX, [['T_B2_G_B', '타이거폼 B2 건용_1박스'], ['T_B1_G_B', '타이거폼 B1 건용_1박스']]),
    product('10957639004', BOX, [['T_SF_G_B', '타이거 스프레이폼 건용_1박스']]),
    product('10325744799', SET, [['T_2K_H', '타이거폼2K 경질 (주제+경화제) 1세트'], ['T_2K_S', '타이거폼2K 연질 (주제+경화제) 1세트']]),
    product('10828652365', s('5개마다'), [['T_SF_251SET', '타이거스프레이폼+월드폼건251 세트']], 24500),
    // ── 표 2: 폼건·월드·라이트폼·유니·접착제·커터기 ──
    product('2993746606', s('15개마다'), [['T_GUN_RED', '타이거 폼건 기본형_레드'], ['T_GUN_BLK', '타이거 폼건 고급형_블랙'], ['T_GUN_PRO', '타이거 폼건 전문가용'], ['T_GUN_PRM', '타이거 폼건 프리미엄'], ['TOP_GUN', '탑 폼건 (Top-Gun TP500/보급형)', 'stopped']]),
    product('5055159970', s('12개마다', 10000, '7000/14000'), [['W_SF_G', '월드 스프레이폼 건용'], ['T_SF_G', '타이거 스프레이폼 건용']]),
    product('445923250', s('8개마다', 10000, '8000/12000'), [['W_B2_G', '월드 폼본드 B2 건용'], ['W_SFB_G', '월드 스피드폼 건용']]),
    product('10957245887', s('8개마다', 10000, '8000/12000'), [['W_SFB_G', '월드 스피드폼 건용'], ['W_B2_G', '월드 폼본드 B2 건용']]),
    product('5812309858', BOX, [['W_SF_G_B', '월드 스프레이폼_1박스']]),
    product('520849850', [7800, '1개마다', 10000, '16000/32000'], [['W_B2_G_B', '월드 폼본드 B2 건용_1박스'], ['W_SFB_G_B', '월드 스피드폼 건용_1박스']]),
    product('10957533013', BOX, [['W_SFB_G_B', '월드 스피드폼 건용_1박스'], ['W_B2_G_B', '월드 폼본드 B2 건용_1박스']]),
    product('456787544', s('-'), [['W_FC', '월드 폼크리너'], ['T_TF_D', '타이거폼 일회용'], ['T_TF_G', '타이거폼 건용'], ['T_B2_G', '타이거폼 B2 건용'], ['T_B1_G', '타이거폼 B1 건용'], ['T_EB_D', '타이거 이지본드 일회용'], ['T_EB_G', '타이거 이지본드 건용']]),
    product('5163448623', s('5개마다'), [['W_SF_251SET', '월드스프레이폼+월드폼건251 세트']]),
    product('5057319372', SET, [['TW_LF_H', '라이트폼 경질 (주제+경화제) 1세트'], ['TW_LF_S', '라이트폼 연질 (주제+경화제) 1세트'], ['T_2K_H', '타이거폼2K 경질 (주제+경화제) 1세트'], ['T_2K_S', '타이거폼2K 연질 (주제+경화제) 1세트']]),
    product('10325763088', SET, [['TW_LF_H', '라이트폼 경질 (주제+경화제) 1세트'], ['TW_LF_S', '라이트폼 연질 (주제+경화제) 1세트']]),
    product('11315952100', s('15개마다'), [['U_FB', '유니 패스트본드 건용']]),
    product('11324843293', s('5개마다'), [['U_FB_SET', '유니패스트본드+유니폼건세트']]),
    product('692257896', s('15개마다'), [['U_GUN', '유니 폼건'], ['W_GUN_251', '월드 251폼건'], ['SEN_GUN', '쎈 폼건 (SSEN 폼건)', 'stopped']], 16500),
    product('5150321970', s('2개마다', 10000, '7000/14000'), [['H_HT', '하이테크 접착제']]),
    product('5150264043', s('20개마다'), [['H_025', '바인더 접착제']]),
    product('5150150577', s('20개마다'), [['H_542', '도배본드 형제 542본드']]),
    product('575543685', s('5개마다'), [['HC_FREE', '프리커터기'], ['HC_MAN', '마닉스커터기', 'stopped'], ['HC_ELIM', '엘림 열선커터기'], ['HC_PEN', '펜형 열선커터기', 'stopped'], ['HC_USB', 'USB 열선커터기']]),
    // ── 표 3: 열선커터기·실리콘·테이프·곰팡이 제거제 ──
    product('587600188', s('5개마다'), [['HC_USB', 'USB 열선커터기'], ['HC_ELIM', '엘림 열선커터기'], ['HC_FREE', '프리커터기'], ['HC_MAN', '마닉스커터기', 'stopped'], ['HC_PEN', '펜형 열선커터기', 'stopped']]),
    product('10957850942', s('5개마다'), [['HC_ELIM', '엘림 열선커터기'], ['HC_FREE', '프리커터기'], ['HC_MAN', '마닉스커터기', 'stopped'], ['HC_PEN', '펜형 열선커터기', 'stopped'], ['HC_USB', 'USB 열선커터기']]),
    product('2293206715', s('15개마다'), [['SC_TR', '유성실리콘'], ['SC_HE', '실리콘헤라'], ['SC_GUN', '실리콘건']]),
    product('4864847647', s('20개마다'), [['CK_L', '대형 커터칼 색상랜덤']]),
    product('5190500093', s('-'), [['TP_TR', 'OPP테이프'], ['TP_AL', '은박테이프']]),
    product('10832998671', s('30개마다'), [['TP_GY100', '회색면테이프 100mm 25M'], ['TP_GY48', '회색면테이프 48mm 25M']], 7500),
    product('10968712337', s('15개마다'), [['MR', '계양산업 곰팡이 제거제']], 5200),
    product('10971824110', s('-'), [['TP_AL', '은박테이프'], ['TP_TR', 'OPP테이프']]),
  );

  // 수정 전 판매가·배송비는 현재 값에서 시작한다(사용자 규칙 — 표의 "수정 전" 열은 쓰지 않는다).
  HK_CHANNEL_LISTINGS.hkd.filter(channelProduct => channelProduct.categoryId === 'hk_sub').forEach(channelProduct => {
    channelProduct.items.forEach(channelItem => {
      const currentPrice = window.hkSubPriceByCode(channelItem.productCode);
      if (currentPrice != null && Number.isFinite(currentPrice)) channelItem.prevPrice = currentPrice;
    });
  });
})();

/* ═══════════════════════════════════════
   한국단열(hkd) 채널 — 실외기 커버·어싱매트 (2026-09-30, 사용자가 준 한국단열 엑셀 표 26행 = 상품 3개)
   - 4563030455: 실외기 절전커버 5T·9T·14T·20T·30T × 중형·대형·특대형 15개 + 방수커버 PVC 5·타포린 5 = 옵션 25개.
   - 12650826381: 어싱매트_전기매트 중형 15,000 · 대형 19,000 / 13577623011: 어싱매트_발매트 중형 15,000 · 대형 19,000. 기준가 15,000.
   - 배송비 3,000 · 5개마다 · 제주 10,000 · 교환/반품 6000/12000(표 그대로). 판매가는 부자재 탭의 '실외기 커버·어싱매트' 항목(원가 없는 공통 판매가)을 관리코드로 가져온다.
     수정 전 판매가·배송비는 사용자 규칙대로 현재 값.
   - 관리코드(사용자 지시 "코드는 네가 만든 걸로"): 절전커버 COVER_SAVE_{9|14|20|30}_{M|L|XL}, 방수커버 COVER_{PVC|TARP}_{A~E}(공용), 어싱매트 EARTH_M / EARTH_L(전기매트·발매트 둘 다 같은 크기 코드).
   - 판매상태: 스토어 옵션표의 사용여부 N → 판매중지(절전커버 15개 전부 + PVC D·E + 타포린 C·D·E), Y → 판매중(PVC A·B·C, 타포린 A·B). 기준가 옵션은 판매중인 첫 옵션(PVC_A 5,800)이 된다.
   - 최초 엑셀 표의 절전커버 14T 중형 1,100은 오타 → 11,000. 5T 3옵션(5,500/6,500/7,500)은 나중에 스토어 옵션표로 받아 추가.
   - 방수커버 이름은 라이프와 같게(PVC E형·타포린 E형 96cm, 타포린 C형 80x65x28) 스토어 옵션명으로 맞췄다 — 이 표의 95cm·타포린 C형 80x70x35와 다르다.
═══════════════════════════════════════ */
(function addHkdOutdoorCoverProducts() {
  // 판매가는 공통 부자재 표(HK_SUB_PRODUCTS의 원가 없는 항목)에서 관리코드로 가져온다. 수정 전 판매가는 현재 값.
  const item = (productCode, productName, extra = {}) => ({
    productCode, productName, prevPrice: window.hkSubPriceByCode(productCode), prevShipping: 3000, ...extra,
  });
  const product = (productId, items) => ({
    categoryId: 'hk_sub', productId, baseShipping: 3000, shippingBasis: '5개마다', jejuShipping: 10000, returnExchange: '6000/12000', items,
  });
  // 스토어 옵션표(사용자 2026-09-30)의 사용여부 N인 옵션은 판매중지(코드 기본 상태 seedStatus — DB를 불러와도 유지).
  // 절전커버 15개 전부 N, 방수커버는 PVC D·E, 타포린 C·D·E가 N(재고 0). 나머지(PVC A·B·C, 타포린 A·B)는 Y = 판매중.
  const stoppedCodes = new Set(['COVER_PVC_D', 'COVER_PVC_E', 'COVER_TARP_C', 'COVER_TARP_D', 'COVER_TARP_E']);
  const stopped = { status: 'stopped', seedStatus: 'stopped' };
  const waterproof = HK_OUTDOOR_COVER_WATERPROOF.map(([code, name]) =>
    item(code, name, stoppedCodes.has(code) ? { ...stopped } : {}));
  HK_CHANNEL_LISTINGS.hkd.push(
    product('4563030455', [...HK_OUTDOOR_COVER_SAVE.map(([code, name]) => item(code, name, { ...stopped })), ...waterproof]),
    product('12650826381', [item('EARTH_M', '어싱매트_전기매트 중형'), item('EARTH_L', '어싱매트_전기매트 대형')]),
    product('13577623011', [item('EARTH_M', '어싱매트_발매트 중형'), item('EARTH_L', '어싱매트_발매트 대형')]),
  );
})();

/* ═══════════════════════════════════════
   11번가 채널 — 부자재 (2026-09-30, 사용자가 준 표: 상품 22개·옵션 74개).
   - 최종 판매가 = 부자재 판매가 × 1.08을 100원 단위 올림 — **배송비는 더하지 않는다**(이미지 표: T_EB_D 8,200 → 8,856 → 8,900). 그래서 옵션마다
     hkdShipping: 0을 명시해 기존 11번가 계산(_hkEsmPriceParts)을 그대로 쓴다. 74개 옵션 전부 표의 최종 판매가와 일치(브라우저 확인).
   - 표의 기준가가 첫 옵션이 아닌 상품은 baseCode(옵션추가금이 0인 옵션)로 지정: 1712551327·1707902427=W_FC, 2075041149=W_SFB_G, 2149743230=T_GUN_PRO,
     1641037728=HC_USB, 1904293765=CK_B, 3134927818=TP_TR. 어느 옵션도 아닌 기준가(2K 세트 367,200 · 라이트폼 세트 313,200)는 product.basePrice.
   - 관리코드가 11번가 페이지에 안 보여서 스토어 가격검사는 옵션 이름으로 짝짓는다(worker.js match11stOptions의 이름 매칭) — 옵션 이름은 표에 적힌
     스토어 옵션명 그대로(오타 "타어거폼B2"도 그대로). 수정 전 판매가는 현재 값(사용자 규칙).
   - 표에서 빨간 칸으로 칠한 이름(TIGER GUN 기본형-레드·고급형-블랙)의 뜻은 확인 전 — 구분 없이 넣었다.
═══════════════════════════════════════ */
(function addSub11stProducts() {
  const config = HK_CHANNEL_CONFIG['11st'];
  const make = (productId, rows, extra = {}) => {
    const product = {
      categoryId: 'hk_sub', productId,
      // 세 번째 값 = 11번가 스토어 옵션명(우리 표의 이름과 다른 경우 — "1단계 / 2단계"·번호 접두어 등, 2026-09-30 첫 검사 후 실제 페이지에서 확인). 검사가 이 이름으로도 짝짓는다.
      items: rows.map(([productCode, productName, storeName, status]) => ({
        productCode, productName, hkdShipping: 0,
        ...(storeName ? { storeName } : {}),
        ...(status ? { status, seedStatus: status } : {}),
      })),
      ...extra,
    };
    if (extra.baseCode) product.seedBaseCode = extra.baseCode; // 11번가 배열은 seedBaseCode 초기화 루프보다 늦게 로드되므로 직접 채운다.
    product.items.forEach(item => { item.prevPrice = _hkEsmPriceParts('hk_sub', item.productCode, config, item)?.finalPrice ?? 0; });
    return product;
  };
  HK_CHANNEL_LISTINGS['11st'].push(
    make('4420448801', [['T_EB_D', '타이거 이지본드 일회용 1캔'], ['T_EB_G', '타이거 이지본드 폼건전용 1캔']]),
    make('1967977625', [['T_B2_G', '타어거폼B2(건용) / 고난연폼'], ['T_B1_G', '타이거폼B1(건용) / 방화폼'], ['T_BIG65_G', '타이거폼BIG65폼(건용) / 대용량폼']]),
    make('1712551327', [['T_EB_D', '타이거이지본드-일회용'], ['T_EB_G', '타이거이지본드-건용'], ['W_B2_G', '월드폼본드B2 (별도 폼건 필요)', '월드폼본드 / 월드폼본드B2 (별도 폼건 필요)'], ['W_SFB_G', '월드스피드폼 (별도 폼건 필요)', '월드폼본드 / 월드스피드폼 (별도 폼건 필요)'], ['W_FC', '폼크리너', '폼세척제 / 랜덤']], { baseCode: 'W_FC' }),
    make('1707902427', [['T_TF_D', '타이거폼-일회용'], ['T_TF_G', '타이거폼-건용'], ['T_B2_G', '타이거폼B2-건용'], ['T_BIG65_G', '타이거폼BIG65폼-건용'], ['T_EB_D', '타이거이지본드-일회용'], ['T_EB_G', '타이거이지본드-건용'], ['W_B2_G', '월드폼본드B2 (폼건 전용)', '월드폼본드 / 월드폼본드B2 (폼건 전용)'], ['W_SFB_G', '월드스피드폼 (폼건 건용)', '월드폼본드 / 월드스피드폼 (폼건 건용)'], ['W_FC', '폼크리너', '폼세척제 / 랜덤']], { baseCode: 'W_FC' }),
    make('1533328354', [['T_EB_D', '타이거이지본드-일회용'], ['T_EB_G', '타이거이지본드-건용'], ['W_B2_G', '월드폼본드B2 (폼건 전용)', '월드폼본드 / 월드폼본드B2 (폼건 전용)'], ['W_SFB_G', '월드스피드폼 (폼건 전용)', '월드폼본드 / 월드스피드폼 (폼건 전용)']]),
    make('1531964206', [['T_EB_D', '타이거이지본드-일회용'], ['T_EB_G', '타이거이지본드-건용', '타이거이지본드 / 폼건 전용'], ['W_B2_G', '월드폼본드B2 (폼건 전용)', '월드폼본드 / 월드폼본드B2 (폼건 전용)'], ['W_SFB_G', '월드스피드폼 (폼건 전용)', '월드폼본드 / 월드스피드폼 (폼건 전용)']]),
    make('3024892494', [['W_SF_G', '월드스프레이폼'], ['T_SF_G', '타이거스프레이폼']]),
    make('1719837596', [['T_TF_D_B', '타이거폼 (일회용)_1박스', '01.타이거폼 (일회용)_1Box(15개)'], ['T_TF_G_B', '타이거폼 (건용)__1박스', '02.타이거폼 (건용)_1Box(15개)'], ['T_B2_G_B', '타이거폼B2 (건용)_1박스', '03.타이거폼B2 (건용)'], ['T_B1_G_B', '타이거폼B1 (건용)_1박스', '04.타이거폼B1 (건용)'], ['T_EB_D_B', '타이거이지본드 (일회용)_1박스', '05.타이거이지본드 (일회용)_1Box(15개)'], ['T_EB_G_B', '타이거이지본드 (건용)_1박스', '06.타이거이지본드 (건용)_1Box(15개)']]),
    make('3494784577', [['T_EB_D_B', '타이거이지본드 (일회용)_1박스', '타이거 이지본드 일회용 (1박스 15캔)'], ['T_EB_G_B', '타이거이지본드 (건용)_1박스', '타이거 이지본드 폼건 전용 (1박스 15캔)']]),
    make('3761607189', [['W_SF_G_B', '월드스프레이폼_1박스']]),
    make('3506485672', [['W_B2_G_B', '월드폼본드B2_1박스', '월드폼본드B2 (폼건 전용 /15캔 1박스)'], ['W_SFB_G_B', '월드스피드폼_1박스', '월드스피드폼 (폼건 전용/15캔 1박스)']]),
    make('3125691749', [['W_SF_251SET', '월드스프레이폼+월드폼건251 세트']]),
    make('2075041149', [['W_GUN_251', '월드폼건251', '03.월드폼건251'], ['W_B2_G', '월드폼본드B2 (폼건 건용)', '04.월드폼본드B2 (폼건 건용)'], ['W_SFB_G', '월드스피드폼(폼건 전용)', '05.월드스피드폼(폼건 전용)']], { baseCode: 'W_SFB_G' }),
    make('2149743230', [['T_GUN_RED', 'TIGER GUN(기본형-레드)'], ['T_GUN_BLK', 'TIGER GUN(고급형-블랙)'], ['T_GUN_PRO', 'TIGER GUN(전문가용)'], ['T_GUN_PRM', 'TIGER GUN(프리미엄)']], { baseCode: 'T_GUN_PRO' }),
    make('3020692034', [['T_2K_H', '타이거 2K 경질 1세트', '경질(주제+경화제) 1세트'], ['T_2K_S', '타이거 2K 연질 1세트', '연질(주제+경화제) 1세트']], { basePrice: 367200 }),
    make('7153519424', [['TW_LF_H', '라이트폼 경질 1세트'], ['TW_LF_S', '라이트폼 연질 1세트']], { basePrice: 313200 }),
    // 마닉스·펜형은 스토어 재고 0(품절)이라 품절로 둔다(코드 기본 상태 seedStatus).
    make('1641037728', [['HC_FREE', '프리커터 (직선절단기)', '1_프리커터 (직선절단기)'], ['HC_MAN', '마닉스 핸드폼커팅기 (곡선절단기)', '2_마닉스 핸드폼커팅기 (곡선절단기)', 'soldout'], ['HC_ELIM', '엘림열선캇터기 (곡선절단기)', '3_엘림열선캇터기 (곡선절단기)'], ['HC_PEN', '펜형 열선커터기', '4_펜형 열선커터기', 'soldout'], ['HC_USB', 'USB형 열선커터기', '5_USB형 열선커터기']], { baseCode: 'HC_USB' }),
    make('3112701490', [['H_HT', '하이테크 접착제']]),
    make('3112161423', [['H_025', '바인더 접착제']]),
    make('3103906217', [['H_542', '특수도배용본드']]),
    make('1904293765', [['T_SA', '스프레이 접착제'], ['SC_TR', '유성실리콘(투명)'], ['SC_HE', '실리콘 헤라'], ['SC_GUN', '실리콘건'], ['H_542', '특수도배용본드'], ['SC_PHE', '플라스틱 평헤라'], ['T_SR', '스티커제거제'], ['MR', '곰팡이제거제'], ['TP_AL', '은박테이프', '은박테이프(50mm x 40M)'], ['W_FC', '폼크리너', '폼크리너(랜덤발송)'], ['CK_L', '다용도커터칼(색상랜덤발송)'], ['CK_B', '커터날-18mm 10입']], { baseCode: 'CK_B' }),
    make('3134927818', [['TP_AL', '은박테이프'], ['TP_TR', 'OPP테이프']], { baseCode: 'TP_TR' }),
  );
})();

/* ═══════════════════════════════════════
   11번가 채널 — 기타단열재 2상품 (2026-10-02, 사용자가 준 표: 추가상품 프리셋에는 있는데 11번가 몰별 표에 빠져 있었다).
   - 3430746421 난방필름단열재 5T 1m x 1m 비접착(HF_5_1): 11번가 판매가 2,700 = 한국단열 2,500 × 1.08(배송비 5,000은 더하지 않는다 — 11번가는 hkdShipping 0, 사용자 표와 일치).
     난방필름은 1m 한 가지뿐(사용자 확인).
   - 1629927307 단열 초배지: 옵션 4개 — 방습단열초배지 0.2T·1T·5T(비접착 1m)와 초배용부직포 0.1T. 사용자가 준 옵션표에서 5T만 "사용함", 나머지 셋은 "임시품절"이었는데
     오래 수정을 안 해 사실상 판매중지 상태라서 **판매중지**로 뒀다(사용자 지시 — 스토어는 사용자가 11번가에서 직접 고친다). 5T는 판매중(기준가 = 옵션가 0)이고 가격은 최신 단가표 값. 옵션명은 옵션표(초배지 두께 선택) 그대로. 11번가 단가는 부자재와 같은 규칙(× 1.08 100원 올림, 배송비 없음).
═══════════════════════════════════════ */
(function addEtc11stProducts() {
  const config = HK_CHANNEL_CONFIG['11st'];
  const make = (productId, rows, extra = {}) => {
    const product = {
      categoryId: 'hk_etc', productId,
      items: rows.map(([productCode, productName, status]) => ({
        productCode, productName, hkdShipping: 0, storeName: productName,
        ...(status ? { status, seedStatus: status } : {}),
      })),
      ...extra,
    };
    if (extra.baseCode) product.seedBaseCode = extra.baseCode; // 11번가 배열은 seedBaseCode 초기화 루프보다 늦게 로드되므로 직접 채운다.
    // 수정 전 판매가 = 지금 계산값(사용자 규칙). 기타단열재 단가표(pricing-hankook-etc.js)가 이 파일보다 늦게 로드돼 여기서 조회가 안 되니, 현재 계산값(한국단열가 × 1.08 100원 올림)을 적어 둔다.
    const PREV = { HF_5_1: 2700, DPS_02_1: 2000, DPS_1_1: 5400, DPS_5_1: 6000, CBF_01_1: 1300 };
    product.items.forEach(item => { item.prevPrice = PREV[item.productCode] ?? 0; });
    return product;
  };
  HK_CHANNEL_LISTINGS['11st'].push(
    make('3430746421', [['HF_5_1', '난방필름단열재 5T 1m x 1m 비접착']]),
    make('1629927307', [
      ['DPS_02_1', '방습단열초배지 0.2T (비접착 0.2T/1m)', 'stopped'],
      ['DPS_1_1', '방습단열초배지 1T (비접착 1T/1m)', 'stopped'],
      ['DPS_5_1', '방습단열초배지 5T (비접착 5T/1m)'],
      ['CBF_01_1', '초배용부직포 0.1T (비접착 0.1T/1m)', 'stopped'],
    ], { baseCode: 'DPS_5_1' }),
  );
})();

/* ═══════════════════════════════════════
   홈페이지(부니몰) 채널 — 기타단열재·부자재 (2026-09-30, 사용자가 준 표: 상품 21개·옵션 52개).
   - 표의 단열벽지 8행(상품ID 97·95·98·251·250·96·252·253)은 홈페이지 채널에 이미 있어서 뺐다(사용자 "중복된 건 빼고").
   - 홈페이지는 마크업 없이 2단계 실판매가를 그대로 쓰는 채널이라 판매가는 카테고리 단가표(부자재 hkSubPriceByCode · 기타단열재 hkEtcPriceByCode)를 코드로 조회한다.
     표의 현재 판매가가 그 값과 전부 같다(브라우저 확인). 수정 전 판매가·배송비는 현재 값(사용자 규칙).
   - 기준가가 어느 옵션 가격도 아닌 상품은 basePrice: 218(타이거폼 2K 세트) 340,000. 나머지는 첫 옵션이 기준가.
   - 같은 관리코드가 다른 상품에 다시 나오는 것(H_542·H_025·CK_L이 161 묶음과 222·220·227에 각각)은 상품이 달라서 그대로 둔다.
   - 표에서 빨간 칸(유니폼건 U_GUN, TIGER Gun 기본형-레드·고급형-블랙)의 뜻은 확인 전 — 구분 없이 넣었다.
═══════════════════════════════════════ */
(function addSubEtcHomepageProducts() {
  const S_15 = [3000, '15개마다', 10000, '6000/12000'];
  const S_BOX = [8000, '1개마다', 10000, '16000/32000'];
  const product = (productId, categoryId, shipping, rows, extra = {}) => ({
    categoryId, productId,
    baseShipping: shipping[0], shippingBasis: shipping[1], jejuShipping: shipping[2], returnExchange: shipping[3],
    ...extra,
    items: rows.map(([productCode, productName, prevPrice]) => ({ productCode, productName, prevPrice, prevShipping: shipping[0] })),
  });
  const ETC = [5000, '10개마다', 10000, '7000/14000'];
  HK_CHANNEL_LISTINGS.homepage.push(
    product('249', 'hk_etc', ETC, [['CP_5_1', '캠핑단열재 5T x 1m', 3400]]),
    product('237', 'hk_etc', ETC, [['HF_5_1', '난방필름단열재 5T 1m x 1m', 2500]]),
    product('210', 'hk_etc', ETC, [['HF_5_25', '난방필름단열재 5T 1m x 25m', 69000], ['HF_5_50', '난방필름단열재 5T 1m x 50m', 123000]]),
    product('130', 'hk_sub', S_15, [['T_TF_G', '타이거폼 (건용)', 5800], ['T_TF_D', '타이거폼 (일회용)', 5100], ['T_B2_G', '타이거폼 B2 (건용)', 9200], ['T_B1_G', '타이거폼 B1 (건용)', 15700]]),
    product('248', 'hk_sub', S_15, [['T_EB_D', '타이거 이지본드 (일회용)', 8200], ['T_EB_G', '타이거 이지본드 (건용)', 8700]]),
    product('212', 'hk_sub', S_15, [['T_SF_G', '타이거 스프레이 (건용)', 9300]]),
    product('177', 'hk_sub', S_BOX, [['T_TF_G_B', '타이거폼_건용 (1박스15개)', 77000], ['T_TF_D_B', '타이거폼_일회용 (1박스15개)', 67000], ['T_B2_G_B', '타이거폼 B2_건용 (1박스15개)', 128000], ['T_B1_G_B', '타이거폼 B1_건용 (1박스15개)', 214000]]),
    product('176', 'hk_sub', S_BOX, [['T_EB_D_B', '타이거 이지본드_일회용 (1박스 15캔)', 112000], ['T_EB_G_B', '타이거 이지본드_건용 (1박스 15캔)', 118000]]),
    product('69', 'hk_sub', S_15, [['W_B2_G', '월드 폼본드 (건용)', 9500], ['W_SFB_G', '월드 스피드 폼본드 (건용)', 10500]]),
    product('244', 'hk_sub', S_BOX, [['W_SF_G_B', '월드 스프레이폼_건용 (1박스15개)', 150000]]),
    product('238', 'hk_sub', S_BOX, [['W_SFB_G_B', '월드 스피드 폼본드_건용 (1박스15개)', 149000]]),
    product('175', 'hk_sub', S_BOX, [['W_B2_G_B', '월드 폼본드 B2_건용 (1박스15개)', 135000]]),
    product('218', 'hk_sub', [0, '-', 20000, '20000/40000'], [['T_2K_H', '타이거폼 2K 경질(주제+경화제) 1세트', 360000], ['T_2K_S', '타이거폼 2K 연질(주제+경화제) 1세트', 390000]], { basePrice: 340000 }),
    product('224', 'hk_sub', S_15, [['U_GUN', '유니폼건', 12600], ['W_GUN_251', '월드251폼건', 16500]]),
    product('183', 'hk_sub', S_15, [['T_GUN_RED', 'TIGER Gun(기본형-레드)', 22000], ['T_GUN_BLK', 'TIGER Gun(고급형-블랙)', 29000], ['T_GUN_PRO', 'TIGER Gun(전문가용)', 37000], ['T_GUN_PRM', 'TIGER Gun(프리미엄)', 61000]]),
    product('223', 'hk_sub', [3000, '2개마다', 10000, '3000/6000'], [['H_HT', '하이테크 접착제', 28000]]),
    product('222', 'hk_sub', [3000, '20개마다', 10000, '3000/6000'], [['H_542', '도배본드 형제 542본드', 3500]]),
    product('220', 'hk_sub', [3000, '20개마다', 10000, '3000/6000'], [['H_025', '바인더 접착제', 4500]]),
    product('227', 'hk_sub', S_15, [['CK_L', '대형 커터칼 (색상랜덤)', 1500], ['CK_B', '커터날 대형 18mm (10개)', 1200]]),
    product('161', 'hk_sub', S_15, [['T_SA', '스프레이 접착제', 10000], ['SC_TR', '유성실리콘 (투명)', 5500], ['SC_HE', '실리콘 헤라', 2000], ['SC_GUN', '실리콘 건', 3000], ['H_542', '특수도배용접착제', 3500], ['H_025', '바인더 접착 증강제', 4500], ['SC_PHE', '플리스틱 평헤라', 1200], ['W_FC', '폼크리너', 4000], ['MR', '곰팡이 제거제', 6500], ['T_SR', '스티커 제거제', 4500], ['CK_L', '다용도커터칼', 1500], ['TP_AL', '은박테이프', 3000]]),
    product('83', 'hk_sub', [3000, '5개마다', 10000, '5000/10000'], [['HC_USB', 'USB형 열선터커기', 17900], ['HC_FREE', '프리커터기', 56000], ['HC_MAN', '마닉스 핸드폼커팅기', 43000], ['HC_ELIM', '엘림열선캇터기', 29500], ['HC_PEN', '펜형 열선커터기', 34500]]),
  );
})();

/* ═══════════════════════════════════════
   ESM 채널 — 기타단열재·부자재 (2026-09-30, 사용자가 준 표: 마스터상품번호·G마켓 상품번호 + 상품 35개·옵션 37개).
   - productId = G마켓 상품번호(goodscode)이고 옥션 ItemNo는 사용자가 나중에 준다(받으면 esm-auction.js의 마스터→옥션 목록에 추가 — 그전까지 옥션은 검사에서 제외).
   - **부자재는 배송비를 더하지 않는다**: 최종 판매가 = 판매가 × 1.08을 100원 단위 올림(T_TF_D 5,100 → 5,508 → 5,600). 기타단열재 HF_5_1만 한국단열 배송비 5,000을
     더한다((2,500+5,000)×1.08 = 8,100). 그래서 부자재 옵션은 hkdShipping: 0, HF_5_1은 5000을 명시했다. 37개 옵션 전부 표의 최종 판매가와 일치(브라우저 확인).
   - 타이거폼 2K·라이트폼 세트는 그룹상품이 아니라 **한 상품번호에 경질·연질 옵션이 둘인 옵션 상품**(사용자 확인) — 한 상품(마스터·G마켓 번호 공유)에 옵션 2개로 넣었다.
     G마켓 페이지: 기존가 388,800(2K 경질) + 연질 "(+32,400원)" = 421,200, 라이트폼 410,400 + 54,000 = 464,400.
   - storeName = 스토어 옵션명(우리 표 이름과 다른 경우, 옵션 상품의 옵션 검사용).
   - 표에서 빨간 칸(TIGER Gun 기본형-레드·고급형-블랙)의 뜻은 확인 전 — 구분 없이 넣었다.
═══════════════════════════════════════ */
(function addSubEtcEsmProducts() {
  const config = HK_CHANNEL_CONFIG.esm;
  const add = (masterId, productId, categoryId, groupName, rows) => {
    const items = rows.map(([productCode, productName, storeName]) => {
      const item = { productCode, productName, hkdShipping: productCode === 'HF_5_1' ? 5000 : 0, ...(storeName ? { storeName } : {}) };
      // 수정 전 판매가 = 현재 값(사용자 규칙). 기타단열재 가격 조회(hkEtcPriceByCode)는 이 파일보다 뒤에 로드돼서 이 시점엔 못 찾으므로 표의 현재 값(8,100)을 직접 쓴다.
      item.prevPrice = productCode === 'HF_5_1' ? 8100 : (_hkEsmPriceParts(categoryId, productCode, config, item)?.finalPrice ?? 0);
      return item;
    });
    HK_CHANNEL_LISTINGS.esm.push({ categoryId, productId, masterId, groupName, items });
  };
  add('1480486322', '3740234098', 'hk_etc', '기타단열재', [['HF_5_1', '난방필름단열재 5T 1m x 1m 비접착']]);
  const S = (masterId, productId, rows) => add(masterId, productId, 'hk_sub', '부자재', rows);
  S('1436373076', '921541378', [['T_TF_D', '타이거폼 우레탄폼 일회용']]);
  S('1445644697', '823826899', [['T_EB_G', '타이거이지본드 건용']]);
  S('1445639016', '823015398', [['T_EB_D', '타이거이지본드 일회용']]);
  S('1436528912', '926193434', [['T_B1_G', '타이거폼 B1']]);
  S('1436514137', '4720824583', [['T_B2_G', '타이거폼 B2']]);
  S('1436514904', '4720825041', [['T_BIG65_G', '타이거폼 Big65']]);
  S('1436433630', '930547153', [['T_TF_D_B', '타이거폼 우레탄폼 일회용 1박스']]);
  S('1441339277', '4720833502', [['T_SA', '스프레이접착제']]);
  S('1436981818', '2031741045', [['T_2K_H', '타이거폼2K 경질', '타이거폼2K 경질(주제+경화제) 1세트'], ['T_2K_S', '타이거폼2K 연질', '타이거폼2K 연질(주제+경화제) 1세트']]);
  S('1443114130', '4720822817', [['T_GUN_RED', '타이거폼건 기본형-레드']]);
  S('1443118187', '2039458315', [['T_GUN_BLK', '타이거폼건 고급형-블랙']]);
  S('1443123907', '4720823579', [['T_GUN_PRM', '타이거폼건 프리미엄']]);
  S('1443121763', '4720823976', [['T_GUN_PRO', '타이거폼건 전문가용']]);
  S('4320525348', '3809819874', [['TW_LF_H', '라이트폼 경질', '라이트폼 경질 1세트'], ['TW_LF_S', '라이트폼 연질', '라이트폼 연질 1세트']]);
  S('1436255005', '4720834351', [['W_SF_G', '월드스프레이폼']]);
  S('2692598081', '3212208735', [['W_SFB_G', '월드스피드폼']]);
  S('2692534350', '3212180324', [['W_B2_G', '월드폼본드 B2']]);
  S('2692701627', '3212251228', [['W_SFB_G_B', '월드스피드폼 1박스']]);
  S('2692664220', '3212236174', [['W_B2_G_B', '월드폼본드 B2 1박스']]);
  S('1590659712', '4720830024', [['W_SF_G_B', '월드스프레이폼 1박스']]);
  S('1481458058', '2085879279', [['W_GUN_251', '월드폼건251']]);
  S('1445669697', '2043039621', [['H_025', '바인더 접착제']]);
  S('1445666618', '2043035262', [['H_542', '특수도배용접착제']]);
  S('1442134572', '4720832573', [['H_HT', '하이테크접착제']]);
  S('1360695663', '1918061412', [['HC_FREE', '프리커터기']]);
  S('2084992064', '4720836185', [['HC_ELIM', '엘림열선커터기']]);
  S('1441532679', '4720826966', [['SC_GUN', '실리콘건']]);
  S('1441524128', '4720827429', [['SC_HE', '실리콘헤라']]);
  S('1441501531', '4720833077', [['SC_TR', '유성실리콘']]);
  S('1441560716', '2037137424', [['SC_PHE', '플라스틱 평헤라']]);
  S('1441643253', '4720837686', [['MR', '곰팡이 제거제']]);
  S('1368579484', '1931847781', [['CK_B', '대형 커터칼날']]);
  S('1368562908', '1931822041', [['CK_L', '대형 커터칼']]);
  S('1367771644', '1930558211', [['TP_AL', '은박테이프']]);
  if (typeof window.hkApplyEsmAuctionIds === 'function') window.hkApplyEsmAuctionIds(); // 옥션 번호 목록이 이미 로드돼 있으면 새 상품에도 연결(지금은 새 마스터 번호가 목록에 없어 연결 안 됨)
})();

/* ═══════════════════════════════════════
   쿠팡_부자재 채널 (2026-09-22, 사용자가 준 엑셀 58행). 계산식은 다른 쿠팡 채널과 다르다 —
   배송비를 더하지 않고 부자재 판매가만 ×1.05 해서 100원 단위로 "반올림"한다(올림 아님,
   _hkCoupangSubPriceParts, pricing-hankook.js). 상품ID(Product ID)로 옵션을 묶었다.
   사용자 규칙대로 수정 전 판매가는 엑셀의 예전 값이 아니라 현재 계산값에 맞춘다 — 엑셀 자체에
   같은 코드가 서로 다른 "수정 전 판매가"로 두 번 나오는 행(예: 타이거폼B2 단품 행에 박스 상품의
   수정전가가 잘못 들어간 것으로 보이는 154,000)이 있어서 더더욱 엑셀 값을 그대로 믿지 않는다.
   빨간 배경으로 표시된 행(예: 타이거폼건 기본형/블랙, 타이거폼건 프리미엄 두 번째 등록, 유니폼건,
   유니세트, 마닉스·펜형 열선커터기, 플라스틱평헤라 세 번)이 무엇을 뜻하는지는 아직 확인 전이라
   구분 없이 그대로 넣었다 — 나중에 사용자에게 물어볼 것.
   배송비 기준·제주배송비·교환/반품 정보는 이 엑셀에 없어서 비워둔다(다른 채널과 다름).
═══════════════════════════════════════ */
(function addSubCoupangProducts() {
  // [상품명, 상품코드, ProductID, 옵션ID, 배송비]
  const rows = [
    ['타이거폼(일회용)', 'T_TF_D', '8542424069', '91295535434', 3000],
    ['타이거이지본드(건용)', 'T_EB_G', '7872243770', '91295599053', 3000],
    ['타이거폼B2건용', 'T_B2_G', '8542424067', '91295557989', 3000],
    ['타이거스프레이폼', 'T_SF_G', '1889075845', '91295481260', 3000],
    ['타이거폼B2', 'T_B2_G', '7268985142', '91295772951', 7800],
    ['타이거폼B2(1BOX)', 'T_B2_G_B', '7268985142', '91733002075', 7800],
    ['타이거폼B1(1BOX)', 'T_B1_G_B', '176788350', '91733034373', 7800],
    ['타이거폼건용(1BOX)', 'T_TF_G_B', '9338172846', '91295671536', 7800],
    ['타이거폼일회용(1BOX)', 'T_TF_D_B', '176487952', '91733043941', 7800],
    ['타이거이지본드1BOX일회용', 'T_EB_D_B', '6258506970', '91295623422', 7800],
    ['타이거이지본드1BOX건용', 'T_EB_G_B', '7872243770', '91295623429', 7800],
    ['스프레이접착제', 'T_SA', '184633149', '91296132080', 3000],
    ['타이거2K연질', 'T_2K_S', '8113162102', '91295455578', 0],
    ['타이거2K경질', 'T_2K_H', '8113170799', '91295444929', 0],
    ['타이거폼건(기본형레드)', 'T_GUN_RED', '176600205', '91295861777', 3000],
    ['타이거폼건(고급형블랙)', 'T_GUN_BLK', '8476981212', '91295795375', 3000],
    ['타이거폼건(전문가용)', 'T_GUN_PRO', '8477013920', '91295815796', 3000],
    ['타이거폼건(프리미엄)', 'T_GUN_PRM', '8477068835', '91295883870', 3000],
    ['타이거폼건(프리미엄)', 'T_GUN_PRM', '8539760389', '91732161470', 3000],
    ['타이거스프레이폼+251폼건', 'T_SF_251SET', '8336013181', '91295501673', 3000],
    ['월드폼본드B2(1BOX)', 'W_B2_G_B', '1288714661', '91732988614', 7800],
    ['월드스피드폼본드(1BOX)', 'W_SFB_G_B', '7385059038', '91301423941', 7800],
    ['월드스피드폼본드(1개)', 'W_SFB_G', '8528568798', '91703742174', 7800],
    ['월드스프레이폼(1BOX)', 'W_SF_G_B', '7384936756', '91732995214', 7800],
    ['월드스프레이폼+251폼건', 'W_SF_251SET', '2335091479', '91296082421', 3000],
    ['월드스프레이폼+251폼건', 'W_SF_251SET', '2309816317', '91295405426', 3000],
    ['라이트폼(경질)', 'TW_LF_H', '8106236943', '91295424371', 0],
    ['라이트폼(연질)', 'TW_LF_S', '8531580647', '91295424364', 0],
    ['유니패스트본드', 'U_FB', '2087569285', '91733230525', 3000],
    ['유니폼건', 'U_GUN', '9018740014', '91733276761', 3000],
    ['유니패스트본드+유니폼건', 'U_FB_SET', '8539808596', '91733181936', 3000],
    ['하이테크접착제', 'H_HT', '2275458225', '91296107004', 3000],
    ['바인더접착제', 'H_025', '2274070565', '91295988458', 3000],
    ['형제542본드', 'H_542', '2251284878', '91296163541', 3000],
    ['형제542본드', 'H_542', '8453120969', '91300487883', 3000],
    ['프리커터기', 'HC_FREE', '2055324471', '91295924960', 3000],
    ['엘림열선커터기', 'HC_ELIM', '2055324471', '91295924950', 3000],
    ['USB열선커터기', 'HC_USB', '2055324471', '91295924953', 3000],
    ['프리커터기', 'HC_FREE', '176589661', '91301397597', 3000],
    ['마닉스곡선절단기', 'HC_MAN', '8399471152', '91295924956', 3000],
    ['펜형열선커터기', 'HC_PEN', '8399471152', '91295924965', 3000],
    ['프리커터 열선 추가', 'HC_FREE_W', '5380315904', '91295962591', 3000],
    ['엘림 열선 추가', 'HC_ELIM_W', '5380315904', '91295962601', 3000],
    ['USB 열선 추가 (5개1입)', 'HC_USB_W', '5380315904', '91295962582', 3000],
    ['USB 롱나이프팁 추가', 'HC_USB_LK', '5380315904', '91295962620', 3000],
    ['USB 조각용팁 추가', 'HC_USB_T', '5380315904', '91295962610', 3000],
    ['플라스틱 평헤라', 'SC_PHE', '184938310', '92616891530', 3000],
    ['플라스틱평헤라', 'SC_PHE', '8299630714', '91732181099', 3000],
    ['OPP테이프', 'TP_TR', '8710176581', '91300559552', 3000],
    ['은박테이프', 'TP_AL', '8520194034', '91300559555', 3000],
    ['은박테이프 (50mm x 40m)', 'TP_AL', '184630054', '91300528706', 3000],
    ['대형커터칼날', 'CK_B', '2347262583', '91300614967', 3000],
    ['대형커터칼', 'CK_L', '2347262583', '91300614970', 3000],
    ['회색면테이프100mm x 25M', 'TP_GY100', '8336023187', '91300581699', 3000],
  ];
  const byProduct = new Map();
  rows.forEach(([name, code, productId, optionId, shipping]) => {
    if (!byProduct.has(productId)) {
      byProduct.set(productId, { categoryId: 'hk_sub', productId, baseShipping: shipping, shippingBasis: '—', jejuShipping: null, returnExchange: '—', items: [] });
    }
    const product = byProduct.get(productId);
    const prevPrice = _hkChannelTargetPrice('hk_sub', code, 'coupang_sub', product, null) ?? 0;
    product.items.push({ productCode: code, productName: name, optionId, prevPrice, prevShipping: shipping });
  });
  HK_CHANNEL_LISTINGS.coupang_sub = [...byProduct.values()];
})();
