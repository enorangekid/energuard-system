/* ═══════════════════════════════════════
   한국단열 열반사단열재(빌트론) — 1단계 기준단가 (2026-09-22)

   엑셀(C:\Users\Hankook_design\Desktop\★단가표수정\한국단열\나눔\열반사단열재.xlsx, 시트 "열반사단열재")을
   사용자와 함께 확인해서 옮겼다. 2단계 배송 정책은 없다(사용자 확인) — 이 카테고리는 1단계 표만 있다.
   판매가 입력값은 항상 엑셀의 "실판매가"(가장 오른쪽 S열, 아이소핑크·스티로폼의 주황 셀과 같은
   역할 — 판매가를 보고 사람이 맞춰 조정한 최종값)를 그대로 썼다. "26.05.08 인상가(25%)" 열도
   엑셀과 비슷하게 참고용으로 화면에 같이 보여준다(계산에는 안 쓴다 — 원가 계산법을 몰라서 그냥
   기존 가격에 감으로 25% 올린 숫자라고 사용자가 확인함).

   두 가지 형태가 있다(사용자 확인 — 롤과 판상형은 서로 다른 제품):
   - 롤형(5T/6T/10T/13T + 고티 20~50T): 원가 공식을 찾으려고 여러 번 시도했다 — 에너가드론(다른 브랜드)
     파일의 재료비 공식(PE폼·PET필름·본드/물류·포장비)을 가져와 봐도 5T~13T는 두께별 비율이 전혀 안
     맞았고, 고티(20T~50T)는 판상형과 같은 제품이라(사용자 확인 — "20T를 롤로도 팔고 2M로 잘라 판상형
     으로도 판다") 판상형 재료비 공식과 거의 맞긴 했지만(1~10% 오차, 두꺼울수록 오차가 커짐 — 판상형
     쪽 재단·펼치기 가공비가 얹힌 걸로 보임) 정확히 일치하진 않았다. 결국 사용자가 "일단 복잡하니까
     원가 부분 안 보이게 해라"고 해서(2026-09-22), 롤형은 원가 칸 자체를 화면에서 뺐다 — 마스터 원가
     (HK_REFLECTIVE_ROLL_MASTER)와 길이 비례 계산(_hkReflectiveRollCost)은 마진 계산용으로 내부에는
     남겨뒀지만 표에는 안 보여주고, 편집 카드도 없앴다(_hkReflectiveRollCostCard는 안 쓰지만 남겨둠).
     13T부터는 일반형이 없다(사용자 확인, 고급형만).
   - 판상형(20T~50T, 20T만 원래 있고 30T 이상은 고급형만): 원가가 재료 구성비로 되어 있어서
     아이소핑크·스티로폼처럼 편집 가능한 "공통 원가 설정 카드"로 만들었다(사용자 확인 — 원가에서
     재료 단가가 바뀌면 자동 반영). 구성: AL필름+부직 550원(고정) + PE폼 119원×두께(mm) + PET필름
     95원(고정) + 포장비/지관 500원(고정) + 양면PET증착 255원(30T 이상만) + 본드/물류 540원(접착만).
     엑셀 하단 원가표(U~AB열, 20T~50T 6종)의 실제 수식(X229=X228*17 등)을 그대로 읽어서 확인했다
     (0.85 = 두께×0.85가 곱해지는 이유, 사용자 질문에 답하며 검증함). 이 표는 그대로 보여준다.
   - 참고마진율 열은 원본 엑셀에 없어서(사용자 확인 — "적당히 추가해줘") 실판매가 기준 순수마진율을
     5% 단위로 반올림해 채웠다.

   구조는 여기(JS), 값은 DB — 저장하는 값은 판매가(상품코드별)와 판상형 원가 설정(hk_settings.reflective_costs,
   { bom: 판상형 재료 구성비, roll: 롤형 마스터 원가 — roll은 화면에 안 보이지만 구조는 유지})뿐이다.
   마진·수수료·순수마진은 화면에서 다시 계산한다(부자재와 같은 방식).
═══════════════════════════════════════ */

// 판상형 원가 구성비(원) — 편집하면 판상형 행 전체 원가가 다시 계산된다.
const HK_REFLECTIVE_BOM = { pe: 119, pet: 95, alFelt: 550, pack: 500, petDouble: 255, bond: 540 };

// 판상형 1개(2M 기준) 원가 = AL필름/부직 + PE폼(두께×단가) + PET필름 + 포장비 + (30T 이상만 양면PET증착) + (접착만 본드/물류)
function _hkReflectiveBoardUnitCost(thickness, adhesive) {
  const pe = (Number(HK_REFLECTIVE_BOM.pe) || 0) * thickness;
  const petDouble = thickness >= 30 ? (Number(HK_REFLECTIVE_BOM.petDouble) || 0) : 0;
  const bond = adhesive ? (Number(HK_REFLECTIVE_BOM.bond) || 0) : 0;
  return (Number(HK_REFLECTIVE_BOM.alFelt) || 0) + pe + (Number(HK_REFLECTIVE_BOM.pet) || 0) + (Number(HK_REFLECTIVE_BOM.pack) || 0) + petDouble + bond;
}

// 롤형 마스터 원가(두께·등급별 "롤 전체" 원가·길이) — 편집하면 이 키를 쓰는 모든 길이별 옵션의 원가가
// "원가 ÷ 길이 × 판매길이"로 다시 계산된다. length 단위는 m.
const HK_REFLECTIVE_ROLL_MASTER = {
  '5_SN':  { cost: 42000, length: 50, label: '5T 일반형 비접착' },
  '5_DN':  { cost: 48000, length: 50, label: '5T 고급형 비접착' },
  '5_SA':  { cost: 65000, length: 50, label: '5T 일반형 한쪽접착' },
  '5_DA':  { cost: 71000, length: 50, label: '5T 고급형 한쪽접착' },
  '6_SN':  { cost: 32500, length: 25, label: '6T 일반형 비접착' },
  '6_DN':  { cost: 35500, length: 25, label: '6T 고급형 비접착' },
  '6_SA':  { cost: 44000, length: 25, label: '6T 일반형 한쪽접착' },
  '6_DA':  { cost: 47000, length: 25, label: '6T 고급형 한쪽접착' },
  '10_SN': { cost: 44000, length: 25, label: '10T 일반형 비접착' },
  '10_DN': { cost: 49000, length: 25, label: '10T 고급형 비접착' },
  '10_SA': { cost: 56000, length: 25, label: '10T 일반형 한쪽접착' },
  '10_DA': { cost: 60000, length: 25, label: '10T 고급형 한쪽접착' },
  '13_DN': { cost: 50000, length: 20, label: '13T 고급형 비접착' },
  '13_DA': { cost: 59000, length: 20, label: '13T 고급형 한쪽접착' },
  '20_DN': { cost: 34000, length: 10, label: '20T 고급형 비접착(고티)' },
  '20_DA': { cost: 40000, length: 10, label: '20T 고급형 한쪽접착(고티)' },
  '30_DN': { cost: 59000, length: 12, label: '30T 고급형 비접착(고티)' },
  '30_DA': { cost: 65500, length: 12, label: '30T 고급형 한쪽접착(고티)' },
  '40_DN': { cost: 53000, length: 8,  label: '40T 고급형 비접착(고티)' },
  '50_DN': { cost: 59500, length: 7,  label: '50T 고급형 비접착(고티)' },
};

// 롤형 길이별 원가 = 마스터 원가 ÷ 마스터 길이 × 판매 길이(마스터 자신을 넣으면 마스터 원가 그대로 나온다).
function _hkReflectiveRollCost(masterKey, length) {
  const master = HK_REFLECTIVE_ROLL_MASTER[masterKey];
  if (!master || !master.length) return 0;
  return (Number(master.cost) || 0) / master.length * length;
}

/* 롤형 — 원가는 마스터 원가에서 계산된다(_hkReflectiveRollCost). masterKey: HK_REFLECTIVE_ROLL_MASTER 키,
   length: 이 행의 판매 길이(m, 마스터롤 전체 판매면 마스터 길이와 같음). spec: 규격 표시,
   code: 상품코드(엑셀 그대로), price: 실판매가(S열), refMargin: 참고마진율(사용자 확인 — 순수마진율을
   5% 단위로 반올림해서 채움). */
function _hkReflectiveRollRows(group, rows) {
  return rows.map(row => ({ group, kind: 'roll', cost: 0, ...row }));
}

const HK_REFLECTIVE_PRODUCTS = [
  ..._hkReflectiveRollRows('5T', [
    { name:'5T 일반형 비접착', spec:'5T X 50M(롤)', code:'BL_5_50_SN_R', increase25:104000, masterKey:'5_SN', length:50, price:104000, refMargin:45 },
    { name:'5T 고급형 비접착', spec:'5T X 50M(롤)', code:'BL_5_50_DN_R', increase25:115000, masterKey:'5_DN', length:50, price:115000, refMargin:40 },
    { name:'5T 일반형 한쪽접착', spec:'5T X 50M(롤)', code:'BL_5_50_SA_R', increase25:182000, masterKey:'5_SA', length:50, price:182000, refMargin:50 },
    { name:'5T 고급형 한쪽접착', spec:'5T X 50M(롤)', code:'BL_5_50_DA_R', increase25:198000, masterKey:'5_DA', length:50, price:198000, refMargin:50 },
    { name:'5T 일반형 비접착', spec:'5T X 1M', code:'BL_5_1_SN', increase25:2900, masterKey:'5_SN', length:1, price:2900, refMargin:55 },
    { name:'5T 고급형 비접착', spec:'5T X 1M', code:'BL_5_1_DN', increase25:3200, masterKey:'5_DN', length:1, price:3200, refMargin:55 },
    { name:'5T 일반형 한쪽접착', spec:'5T X 1M', code:'BL_5_1_SA', increase25:4400, masterKey:'5_SA', length:1, price:4400, refMargin:55 },
    { name:'5T 고급형 한쪽접착', spec:'5T X 1M', code:'BL_5_1_DA', increase25:4600, masterKey:'5_DA', length:1, price:4600, refMargin:55 },
    { name:'5T 일반형 비접착', spec:'5T X 5M', code:'BL_5_5_SN', increase25:18000, masterKey:'5_SN', length:5, price:18000, refMargin:60 },
    { name:'5T 고급형 비접착', spec:'5T X 5M', code:'BL_5_5_DN', increase25:21000, masterKey:'5_DN', length:5, price:19000, refMargin:60 },
    { name:'5T 일반형 한쪽접착', spec:'5T X 5M', code:'BL_5_5_SA', increase25:27000, masterKey:'5_SA', length:5, price:25000, refMargin:60 },
    { name:'5T 고급형 한쪽접착', spec:'5T X 5M', code:'BL_5_5_DA', increase25:28000, masterKey:'5_DA', length:5, price:26000, refMargin:55 },
    { name:'5T 일반형 비접착', spec:'5T X 10M', code:'BL_5_10_SN', increase25:32000, masterKey:'5_SN', length:10, price:32000, refMargin:60 },
    { name:'5T 고급형 비접착', spec:'5T X 10M', code:'BL_5_10_DN', increase25:34000, masterKey:'5_DN', length:10, price:34000, refMargin:55 },
    { name:'5T 일반형 한쪽접착', spec:'5T X 10M', code:'BL_5_10_SA', increase25:49000, masterKey:'5_SA', length:10, price:48000, refMargin:55 },
    { name:'5T 고급형 한쪽접착', spec:'5T X 10M', code:'BL_5_10_DA', increase25:54000, masterKey:'5_DA', length:10, price:50000, refMargin:55 },
    { name:'5T 일반형 비접착', spec:'5T X 15M', code:'BL_5_15_SN', increase25:44000, masterKey:'5_SN', length:15, price:45000, refMargin:55 },
    { name:'5T 고급형 비접착', spec:'5T X 15M', code:'BL_5_15_DN', increase25:48000, masterKey:'5_DN', length:15, price:48000, refMargin:55 },
    { name:'5T 일반형 한쪽접착', spec:'5T X 15M', code:'BL_5_15_SA', increase25:70000, masterKey:'5_SA', length:15, price:68000, refMargin:55 },
    { name:'5T 고급형 한쪽접착', spec:'5T X 15M', code:'BL_5_15_DA', increase25:75000, masterKey:'5_DA', length:15, price:71000, refMargin:55 },
    { name:'5T 일반형 비접착', spec:'5T X 20M', code:'BL_5_20_SN', increase25:60000, masterKey:'5_SN', length:20, price:62000, refMargin:55 },
    { name:'5T 고급형 비접착', spec:'5T X 20M', code:'BL_5_20_DN', increase25:65000, masterKey:'5_DN', length:20, price:67000, refMargin:55 },
    { name:'5T 일반형 한쪽접착', spec:'5T X 20M', code:'BL_5_20_SA', increase25:95000, masterKey:'5_SA', length:20, price:92000, refMargin:55 },
    { name:'5T 고급형 한쪽접착', spec:'5T X 20M', code:'BL_5_20_DA', increase25:103000, masterKey:'5_DA', length:20, price:97000, refMargin:55 },
    { name:'5T 일반형 비접착', spec:'5T X 25M', code:'BL_5_25_SN', increase25:72000, masterKey:'5_SN', length:25, price:74000, refMargin:55 },
    { name:'5T 고급형 비접착', spec:'5T X 25M', code:'BL_5_25_DN', increase25:78000, masterKey:'5_DN', length:25, price:80000, refMargin:55 },
    { name:'5T 일반형 한쪽접착', spec:'5T X 25M', code:'BL_5_25_SA', increase25:114000, masterKey:'5_SA', length:25, price:108000, refMargin:55 },
    { name:'5T 고급형 한쪽접착', spec:'5T X 25M', code:'BL_5_25_DA', increase25:123000, masterKey:'5_DA', length:25, price:114000, refMargin:55 },
  ]),
  ..._hkReflectiveRollRows('6T', [
    { name:'6T 일반형 비접착', spec:'6T X 25M(롤)', code:'BL_6_25_SN_R', increase25:90000, masterKey:'6_SN', length:25, price:90000, refMargin:50 },
    { name:'6T 고급형 비접착', spec:'6T X 25M(롤)', code:'BL_6_25_DN_R', increase25:98000, masterKey:'6_DN', length:25, price:98000, refMargin:50 },
    { name:'6T 일반형 한쪽접착', spec:'6T X 25M(롤)', code:'BL_6_25_SA_R', increase25:132000, masterKey:'6_SA', length:25, price:132000, refMargin:50 },
    { name:'6T 고급형 한쪽접착', spec:'6T X 25M(롤)', code:'BL_6_25_DA_R', increase25:144000, masterKey:'6_DA', length:25, price:144000, refMargin:50 },
    { name:'6T 일반형 비접착', spec:'6T X 1M', code:'BL_6_1_SN', increase25:4600, masterKey:'6_SN', length:1, price:4600, refMargin:55 },
    { name:'6T 고급형 비접착', spec:'6T X 1M', code:'BL_6_1_DN', increase25:4900, masterKey:'6_DN', length:1, price:4900, refMargin:55 },
    { name:'6T 일반형 한쪽접착', spec:'6T X 1M', code:'BL_6_1_SA', increase25:6300, masterKey:'6_SA', length:1, price:6300, refMargin:55 },
    { name:'6T 고급형 한쪽접착', spec:'6T X 1M', code:'BL_6_1_DA', increase25:6700, masterKey:'6_DA', length:1, price:6700, refMargin:55 },
    { name:'6T 일반형 비접착', spec:'6T X 5M', code:'BL_6_5_SN', increase25:28000, masterKey:'6_SN', length:5, price:27000, refMargin:60 },
    { name:'6T 고급형 비접착', spec:'6T X 5M', code:'BL_6_5_DN', increase25:29000, masterKey:'6_DN', length:5, price:28000, refMargin:60 },
    { name:'6T 일반형 한쪽접착', spec:'6T X 5M', code:'BL_6_5_SA', increase25:37000, masterKey:'6_SA', length:5, price:35500, refMargin:60 },
    { name:'6T 고급형 한쪽접착', spec:'6T X 5M', code:'BL_6_5_DA', increase25:40000, masterKey:'6_DA', length:5, price:36500, refMargin:60 },
    { name:'6T 일반형 비접착', spec:'6T X 10M', code:'BL_6_10_SN', increase25:53000, masterKey:'6_SN', length:10, price:50000, refMargin:60 },
    { name:'6T 고급형 비접착', spec:'6T X 10M', code:'BL_6_10_DN', increase25:57000, masterKey:'6_DN', length:10, price:52000, refMargin:55 },
    { name:'6T 일반형 한쪽접착', spec:'6T X 10M', code:'BL_6_10_SA', increase25:72000, masterKey:'6_SA', length:10, price:69000, refMargin:60 },
    { name:'6T 고급형 한쪽접착', spec:'6T X 10M', code:'BL_6_10_DA', increase25:78000, masterKey:'6_DA', length:10, price:71000, refMargin:60 },
    { name:'6T 일반형 비접착', spec:'6T X 15M', code:'BL_6_15_SN', increase25:75000, masterKey:'6_SN', length:15, price:70000, refMargin:55 },
    { name:'6T 고급형 비접착', spec:'6T X 15M', code:'BL_6_15_DN', increase25:80000, masterKey:'6_DN', length:15, price:74000, refMargin:55 },
    { name:'6T 일반형 한쪽접착', spec:'6T X 15M', code:'BL_6_15_SA', increase25:103000, masterKey:'6_SA', length:15, price:98000, refMargin:55 },
    { name:'6T 고급형 한쪽접착', spec:'6T X 15M', code:'BL_6_15_DA', increase25:110000, masterKey:'6_DA', length:15, price:102000, refMargin:55 },
    { name:'6T 일반형 비접착', spec:'6T X 20M', code:'BL_6_20_SN', increase25:102000, masterKey:'6_SN', length:20, price:96000, refMargin:55 },
    { name:'6T 고급형 비접착', spec:'6T X 20M', code:'BL_6_20_DN', increase25:109000, masterKey:'6_DN', length:20, price:102000, refMargin:55 },
    { name:'6T 일반형 한쪽접착', spec:'6T X 20M', code:'BL_6_20_SA', increase25:138000, masterKey:'6_SA', length:20, price:130000, refMargin:55 },
    { name:'6T 고급형 한쪽접착', spec:'6T X 20M', code:'BL_6_20_DA', increase25:149000, masterKey:'6_DA', length:20, price:136000, refMargin:55 },
    { name:'6T 일반형 비접착', spec:'6T X 25M(롤)', code:'BL_6_25_SN', increase25:121000, masterKey:'6_SN', length:25, price:110000, refMargin:55 },
    { name:'6T 고급형 비접착', spec:'6T X 25M(롤)', code:'BL_6_25_DN', increase25:129000, masterKey:'6_DN', length:25, price:118000, refMargin:55 },
    { name:'6T 일반형 한쪽접착', spec:'6T X 25M(롤)', code:'BL_6_25_SA', increase25:165000, masterKey:'6_SA', length:25, price:157000, refMargin:55 },
    { name:'6T 고급형 한쪽접착', spec:'6T X 25M(롤)', code:'BL_6_25_DA', increase25:178000, masterKey:'6_DA', length:25, price:165000, refMargin:55 },
  ]),
  ..._hkReflectiveRollRows('10T', [
    { name:'10T 일반형 비접착', spec:'10T X 25M(롤)', code:'BL_10_25_SN_R', increase25:121000, masterKey:'10_SN', length:25, price:121000, refMargin:50 },
    { name:'10T 고급형 비접착', spec:'10T X 25M(롤)', code:'BL_10_25_DN_R', increase25:133000, masterKey:'10_DN', length:25, price:133000, refMargin:45 },
    { name:'10T 일반형 한쪽접착', spec:'10T X 25M(롤)', code:'BL_10_25_SA_R', increase25:163000, masterKey:'10_SA', length:25, price:163000, refMargin:50 },
    { name:'10T 고급형 한쪽접착', spec:'10T X 25M(롤)', code:'BL_10_25_DA_R', increase25:175000, masterKey:'10_DA', length:25, price:175000, refMargin:50 },
    { name:'10T 일반형 비접착', spec:'10T X 1M', code:'BL_10_1_SN', increase25:5800, masterKey:'10_SN', length:1, price:5800, refMargin:55 },
    { name:'10T 고급형 비접착', spec:'10T X 1M', code:'BL_10_1_DN', increase25:6200, masterKey:'10_DN', length:1, price:6200, refMargin:50 },
    { name:'10T 일반형 한쪽접착', spec:'10T X 1M', code:'BL_10_1_SA', increase25:7700, masterKey:'10_SA', length:1, price:7700, refMargin:55 },
    { name:'10T 고급형 한쪽접착', spec:'10T X 1M', code:'BL_10_1_DA', increase25:8100, masterKey:'10_DA', length:1, price:8100, refMargin:55 },
    { name:'10T 일반형 비접착', spec:'10T X 5M', code:'BL_10_5_SN', increase25:37000, masterKey:'10_SN', length:5, price:33000, refMargin:55 },
    { name:'10T 고급형 비접착', spec:'10T X 5M', code:'BL_10_5_DN', increase25:41000, masterKey:'10_DN', length:5, price:35000, refMargin:55 },
    { name:'10T 일반형 한쪽접착', spec:'10T X 5M', code:'BL_10_5_SA', increase25:49000, masterKey:'10_SA', length:5, price:42000, refMargin:55 },
    { name:'10T 고급형 한쪽접착', spec:'10T X 5M', code:'BL_10_5_DA', increase25:52000, masterKey:'10_DA', length:5, price:46000, refMargin:60 },
    { name:'10T 일반형 비접착', spec:'10T X 10M', code:'BL_10_10_SN', increase25:73000, masterKey:'10_SN', length:10, price:65000, refMargin:55 },
    { name:'10T 고급형 비접착', spec:'10T X 10M', code:'BL_10_10_DN', increase25:79000, masterKey:'10_DN', length:10, price:69000, refMargin:55 },
    { name:'10T 일반형 한쪽접착', spec:'10T X 10M', code:'BL_10_10_SA', increase25:94000, masterKey:'10_SA', length:10, price:83000, refMargin:55 },
    { name:'10T 고급형 한쪽접착', spec:'10T X 10M', code:'BL_10_10_DA', increase25:100000, masterKey:'10_DA', length:10, price:89000, refMargin:55 },
    { name:'10T 일반형 비접착', spec:'10T X 15M', code:'BL_10_15_SN', increase25:104000, masterKey:'10_SN', length:15, price:97000, refMargin:55 },
    { name:'10T 고급형 비접착', spec:'10T X 15M', code:'BL_10_15_DN', increase25:111000, masterKey:'10_DN', length:15, price:103000, refMargin:55 },
    { name:'10T 일반형 한쪽접착', spec:'10T X 15M', code:'BL_10_15_SA', increase25:135000, masterKey:'10_SA', length:15, price:122000, refMargin:55 },
    { name:'10T 고급형 한쪽접착', spec:'10T X 15M', code:'BL_10_15_DA', increase25:143000, masterKey:'10_DA', length:15, price:132000, refMargin:55 },
    { name:'10T 일반형 비접착', spec:'10T X 20M', code:'BL_10_20_SN', increase25:138000, masterKey:'10_SN', length:20, price:130000, refMargin:55 },
    { name:'10T 고급형 비접착', spec:'10T X 20M', code:'BL_10_20_DN', increase25:149000, masterKey:'10_DN', length:20, price:137000, refMargin:55 },
    { name:'10T 일반형 한쪽접착', spec:'10T X 20M', code:'BL_10_20_SA', increase25:179000, masterKey:'10_SA', length:20, price:165000, refMargin:55 },
    { name:'10T 고급형 한쪽접착', spec:'10T X 20M', code:'BL_10_20_DA', increase25:188000, masterKey:'10_DA', length:20, price:177000, refMargin:55 },
    { name:'10T 일반형 비접착', spec:'10T X 25M(롤)', code:'BL_10_25_SN', increase25:166000, masterKey:'10_SN', length:25, price:163000, refMargin:55 },
    { name:'10T 고급형 비접착', spec:'10T X 25M(롤)', code:'BL_10_25_DN', increase25:178000, masterKey:'10_DN', length:25, price:173000, refMargin:55 },
    { name:'10T 일반형 한쪽접착', spec:'10T X 25M(롤)', code:'BL_10_25_SA', increase25:214000, masterKey:'10_SA', length:25, price:200000, refMargin:55 },
    { name:'10T 고급형 한쪽접착', spec:'10T X 25M(롤)', code:'BL_10_25_DA', increase25:224000, masterKey:'10_DA', length:25, price:215000, refMargin:55 },
  ]),
  // 13T부터는 일반형이 없다(사용자 확인) — 고급형 비접착/한쪽접착만.
  ..._hkReflectiveRollRows('13T', [
    { name:'13T 고급형 비접착', spec:'13T X 20M(롤)', code:'BL_13_20_DN_R', increase25:133000, masterKey:'13_DN', length:20, price:133000, refMargin:45 },
    { name:'13T 고급형 한쪽접착', spec:'13T X 20M(롤)', code:'BL_13_20_DA_R', increase25:175000, masterKey:'13_DA', length:20, price:175000, refMargin:50 },
    { name:'13T 고급형 비접착', spec:'13T X 1M', code:'BL_13_1_DN', increase25:8300, masterKey:'13_DN', length:1, price:8300, refMargin:55 },
    { name:'13T 고급형 한쪽접착', spec:'13T X 1M', code:'BL_13_1_DA', increase25:10000, masterKey:'13_DA', length:1, price:10000, refMargin:55 },
    { name:'13T 고급형 비접착', spec:'13T X 5M', code:'BL_13_5_DN', increase25:44000, masterKey:'13_DN', length:5, price:45000, refMargin:60 },
    { name:'13T 고급형 한쪽접착', spec:'13T X 5M', code:'BL_13_5_DA', increase25:57000, masterKey:'13_DA', length:5, price:53000, refMargin:60 },
    { name:'13T 고급형 비접착', spec:'13T X 10M', code:'BL_13_10_DN', increase25:86000, masterKey:'13_DN', length:10, price:88000, refMargin:60 },
    { name:'13T 고급형 한쪽접착', spec:'13T X 10M', code:'BL_13_10_DA', increase25:109000, masterKey:'13_DA', length:10, price:103000, refMargin:60 },
    { name:'13T 고급형 비접착', spec:'13T X 15M', code:'BL_13_15_DN', increase25:127000, masterKey:'13_DN', length:15, price:130000, refMargin:60 },
    { name:'13T 고급형 한쪽접착', spec:'13T X 15M', code:'BL_13_15_DA', increase25:163000, masterKey:'13_DA', length:15, price:152000, refMargin:60 },
    { name:'13T 고급형 비접착', spec:'13T X 20M(롤)', code:'BL_13_20_DN', increase25:164000, masterKey:'13_DN', length:20, price:174000, refMargin:60 },
    { name:'13T 고급형 한쪽접착', spec:'13T X 20M(롤)', code:'BL_13_20_DA', increase25:207000, masterKey:'13_DA', length:20, price:205000, refMargin:60 },
  ]),
  // 고티(20T~50T 묶음) — 20T·30T는 DN/DA, 40T·50T는 DN만(사용자 확인). 마스터 롤 길이가 두께마다 다르다(10/12/8/7M).
  ..._hkReflectiveRollRows('고티(20T~50T)', [
    { name:'20T 고급형 비접착', spec:'20T X 롤전체', code:'BL_20_10_DN_R', increase25:125000, masterKey:'20_DN', length:10, price:125000, refMargin:55 },
    { name:'20T 고급형 한쪽접착', spec:'20T X 롤전체', code:'BL_20_10_DA_R', increase25:144000, masterKey:'20_DA', length:10, price:144000, refMargin:55 },
    { name:'30T 고급형 비접착', spec:'30T X 롤전체', code:'BL_30_12_DN_R', increase25:200000, masterKey:'30_DN', length:12, price:200000, refMargin:55 },
    { name:'30T 고급형 한쪽접착', spec:'30T X 롤전체', code:'BL_30_12_DA_R', increase25:225000, masterKey:'30_DA', length:12, price:225000, refMargin:55 },
    { name:'40T 고급형 비접착', spec:'40T X 롤전체', code:'BL_40_8_DN_R', increase25:200000, masterKey:'40_DN', length:8, price:200000, refMargin:60 },
    { name:'50T 고급형 비접착', spec:'50T X 롤전체', code:'BL_50_7_DN_R', increase25:200000, masterKey:'50_DN', length:7, price:200000, refMargin:55 },
    { name:'20T 고급형 비접착', spec:'20T X 1M', code:'BL_20_1_DN', increase25:14000, masterKey:'20_DN', length:1, price:14000, refMargin:60 },
    { name:'20T 고급형 한쪽접착', spec:'20T X 1M', code:'BL_20_1_DA', increase25:16000, masterKey:'20_DA', length:1, price:16000, refMargin:60 },
    { name:'30T 고급형 비접착', spec:'30T X 1M', code:'BL_30_1_DN', increase25:19000, masterKey:'30_DN', length:1, price:19000, refMargin:60 },
    { name:'30T 고급형 한쪽접착', spec:'30T X 1M', code:'BL_30_1_DA', increase25:21000, masterKey:'30_DA', length:1, price:21000, refMargin:60 },
    { name:'40T 고급형 비접착', spec:'40T X 1M', code:'BL_40_1_DN', increase25:28000, masterKey:'40_DN', length:1, price:28000, refMargin:60 },
    { name:'50T 고급형 비접착', spec:'50T X 1M', code:'BL_50_1_DN', increase25:32000, masterKey:'50_DN', length:1, price:32000, refMargin:55 },
    { name:'20T 고급형 비접착', spec:'20T X 0.5M', code:'BL_20_05_DN', increase25:9500, masterKey:'20_DN', length:0.5, price:9500, refMargin:50 },
    { name:'20T 고급형 한쪽접착', spec:'20T X 0.5M', code:'BL_20_05_DA', increase25:10700, masterKey:'20_DA', length:0.5, price:10700, refMargin:45 },
    { name:'30T 고급형 비접착', spec:'30T X 0.5M', code:'BL_30_05_DN', increase25:13800, masterKey:'30_DN', length:0.5, price:13800, refMargin:50 },
    { name:'30T 고급형 한쪽접착', spec:'30T X 0.5M', code:'BL_30_05_DA', increase25:15700, masterKey:'30_DA', length:0.5, price:15700, refMargin:50 },
    { name:'40T 고급형 비접착', spec:'40T X 0.5M', code:'BL_40_05_DN', increase25:19400, masterKey:'40_DN', length:0.5, price:19400, refMargin:50 },
    { name:'50T 고급형 비접착', spec:'50T X 0.5M', code:'BL_50_05_DN', increase25:23800, masterKey:'50_DN', length:0.5, price:23800, refMargin:50 },
  ]),
  // 판상형(20T~50T, 20T만 원래 있고 30T 이상은 고급형만) — 원가는 위 BOM 카드로 계산(cost는 아래 hkReflectiveRefreshDerived()가 채운다).
  ...[
    { group:'판상형 - 유료배송(2M당)', bundle:1, rows:[
      { name:'20T 고급형 비접착', spec:'20T X 2M', code:'BL_20_2_DN', increase25:28000, thickness:20, adhesive:false, price:28000, refMargin:85 },
      { name:'20T 고급형 한쪽접착', spec:'20T X 2M', code:'BL_20_2_DA', increase25:32000, thickness:20, adhesive:true, price:32000, refMargin:85 },
      { name:'30T 고급형 비접착', spec:'30T X 2M', code:'BL_30_2_DN', increase25:38000, thickness:30, adhesive:false, price:39000, refMargin:85 },
      { name:'30T 고급형 한쪽접착', spec:'30T X 2M', code:'BL_30_2_DA', increase25:42000, thickness:30, adhesive:true, price:43000, refMargin:85 },
      { name:'40T 고급형 비접착', spec:'40T X 2M', code:'BL_40_2_DN', increase25:56000, thickness:40, adhesive:false, price:58500, refMargin:85 },
      { name:'50T 고급형 비접착', spec:'50T X 2M', code:'BL_50_2_DN', increase25:64000, thickness:50, adhesive:false, price:67500, refMargin:85 },
    ]},
    { group:'판상형 - 무료배송(2M/3M묶음)', bundle:1, rows:[
      { name:'20T 고급형 비접착', spec:'20T X 2M(무료배송)', code:'BL_20_2_DN_F', increase25:28000, thickness:20, adhesive:false, price:31000, refMargin:85 },
      { name:'20T 고급형 한쪽접착', spec:'20T X 3M(무료배송)', code:'BL_20_2_DA_F', increase25:32000, thickness:20, adhesive:true, price:35000, refMargin:85 },
      { name:'30T 고급형 비접착', spec:'30T X 2M(무료배송)', code:'BL_30_2_DN_F', increase25:38000, thickness:30, adhesive:false, price:41000, refMargin:85 },
      { name:'30T 고급형 한쪽접착', spec:'30T X 2M(무료배송)', code:'BL_30_2_DA_F', increase25:42000, thickness:30, adhesive:true, price:46000, refMargin:85 },
      { name:'40T 고급형 비접착', spec:'40T X 2M(무료배송)', code:'BL_40_2_DN_F', increase25:56000, thickness:40, adhesive:false, price:61500, refMargin:85 },
      { name:'50T 고급형 비접착', spec:'50T X 2M(무료배송)', code:'BL_50_2_DN_F', increase25:64000, thickness:50, adhesive:false, price:70500, refMargin:85 },
    ]},
    { group:'판상형 - 5개묶음 10% 할인', bundle:5, rows:[
      { name:'20T 고급형 비접착', spec:'20T X 2M X 5개', code:'BL_20_2_DN_5', increase25:28000, thickness:20, adhesive:false, price:140000, refMargin:80 },
      { name:'20T 고급형 한쪽접착', spec:'20T X 2M X 5개', code:'BL_20_2_DA_5', increase25:32000, thickness:20, adhesive:true, price:158000, refMargin:80 },
      { name:'30T 고급형 비접착', spec:'30T X 2M X 5개', code:'BL_30_2_DN_5', increase25:38000, thickness:30, adhesive:false, price:189000, refMargin:80 },
      { name:'30T 고급형 한쪽접착', spec:'30T X 2M X 5개', code:'BL_30_2_DA_5', increase25:42000, thickness:30, adhesive:true, price:207000, refMargin:80 },
      { name:'40T 고급형 비접착', spec:'40T X 2M X 5개', code:'BL_40_2_DN_5', increase25:56000, thickness:40, adhesive:false, price:276000, refMargin:80 },
      { name:'50T 고급형 비접착', spec:'50T X 2M X 5개', code:'BL_50_2_DN_5', increase25:64000, thickness:50, adhesive:false, price:317000, refMargin:80 },
    ]},
  ].flatMap(({ group, bundle, rows }) => rows.map(row => ({ group, kind:'board', bundle, cost:0, ...row }))),
];

// 이전 판매가 — 엑셀에 별도 "수정 전" 값이 없어서(신규 카테고리) 처음에는 지금 판매가와 같게 둔다
// (스티로폼·부자재처럼 이후 판매가를 바꾸면 그 시점부터 차이가 표시된다).
HK_REFLECTIVE_PRODUCTS.forEach(product => { product.previousPrice = product.price; });

// 모든 행의 원가를 다시 계산한다(초기 로드·원가 카드 수정 시 호출) — 롤형은 마스터 원가, 판상형은 BOM 카드 기준.
function hkReflectiveRefreshDerived() {
  HK_REFLECTIVE_PRODUCTS.forEach(product => {
    if (product.kind === 'board') {
      product.cost = _hkReflectiveBoardUnitCost(product.thickness, product.adhesive) * (Number(product.bundle) || 1);
    } else {
      product.cost = _hkReflectiveRollCost(product.masterKey, product.length);
    }
  });
}
hkReflectiveRefreshDerived();

/* 마진 계산 — 부자재와 같은 규칙: 순수마진 = 판매가 - 원가 - 판매수수료 6% - 부가세 10%(배송비는 차감하지 않음). */
function _hkReflectiveMetrics(cost, price) {
  const margin = price - cost;
  const fee = Math.round(price * 0.06);
  const vat = Math.round(price * 0.10);
  const netMargin = margin - fee - vat;
  return {
    margin,
    fee,
    vat,
    netMargin,
    netRate: price > 0 ? Math.round(netMargin / price * 100) : 0,
  };
}

function _hkReflectiveRowHtml(product, rowIndex, showCost) {
  const metrics = _hkReflectiveMetrics(product.cost, product.price);
  const costClass = product.kind === 'board' ? ' hk-reflective-cost hk-reflective-board-cost' : ' hk-reflective-cost hk-reflective-roll-cost';
  const rowClass = product.kind === 'board' ? ' hk-reflective-board-row' : ' hk-reflective-roll-row';
  const difference = Number(product.price) - Number(product.previousPrice);
  return `<tr data-row-index="${rowIndex}" data-product-code="${product.code}" class="${rowClass.trim()}">
    <td class="hk-sub-name">${product.name}</td>
    <td class="hk-reflective-spec" title="${product.spec}">${product.spec}</td>
    <td class="hk-iso-draft-code">${product.code}</td>
    ${showCost ? `<td class="${costClass}">${_hkIsoDraftNumber(Math.round(product.cost))}</td>` : ''}
    <td class="hk-sub-previous">${_hkIsoDraftNumber(product.previousPrice)}<small class="${difference > 0 ? 'up' : difference < 0 ? 'down' : ''}">${difference ? `${difference > 0 ? '+' : ''}${_hkIsoDraftNumber(difference)}` : '동일'}</small></td>
    <td class="hk-iso-draft-price hk-sub-price-cell">
      <div class="hk-iso-price-edit-wrap">
        <input type="text" inputmode="numeric" class="pricing-input-field hk-iso-final-price-input" value="${Number(product.price).toLocaleString()}" data-original-price="${Number(product.price)}" onclick="beginHkReflectiveRowPriceEdit(this)" oninput="recalcHkReflectiveRow(this)" onblur="finishHkReflectiveRowPriceEdit(this)" onkeydown="handleHkReflectiveRowPriceKey(event,this)" readonly aria-label="판매가">
        <button type="button" class="hk-iso-row-price-edit-btn" onclick="beginHkReflectiveRowPriceEdit(this)" title="이 판매가만 수정"><i class="fa-solid fa-pen"></i></button>
      </div>
      <div class="hk-iso-price-history" hidden>변경 전 <span>${Number(product.price).toLocaleString()}원</span><button type="button" onclick="revertHkReflectiveRowPrice(this)" title="변경 전 판매가로 되돌리기"><i class="fa-solid fa-rotate-left"></i></button></div>
    </td>
    <td class="hk-reflective-increase" title="26.05.08 인상가(25%) — 엑셀 참고용 숫자, 계산에는 안 쓴다">${_hkIsoDraftNumber(product.increase25)}</td>
    <td class="hk-sub-margin">${_hkIsoDraftNumber(metrics.margin)}</td>
    <td class="hk-sub-fee">${_hkIsoDraftNumber(metrics.fee)}</td>
    <td class="hk-sub-vat">${_hkIsoDraftNumber(metrics.vat)}</td>
    <td class="hk-sub-net-margin">${_hkIsoDraftNumber(metrics.netMargin)}</td>
    <td class="hk-sub-net-rate">${_hkIsoDraftNumber(metrics.netRate, '%')}</td>
    <td class="hk-sub-ref-margin">${_hkIsoDraftNumber(product.refMargin, '%')}</td>
  </tr>`;
}

/* 그룹(아코디언) 묶음 — HK_REFLECTIVE_PRODUCTS에 등장하는 순서 그대로(두께/판매형태별). */
function _hkReflectiveGroups() {
  const groups = [];
  HK_REFLECTIVE_PRODUCTS.forEach((product, index) => {
    let group = groups.find(item => item.name === product.group);
    if (!group) {
      group = { name: product.group, items: [] };
      groups.push(group);
    }
    group.items.push({ product, index });
  });
  return groups;
}

function _hkReflectiveTableHtml(items) {
  // 롤형은 원가가 확정된 공식이 없어서 복잡하기만 하니 원가 칸을 아예 숨긴다(사용자 확인, 2026-09-22).
  // 판상형은 재료비 공식이 검증됐으니 그대로 보여준다.
  const showCost = items[0]?.product.kind === 'board';
  return `<div class="pricing-table-scroll">
    <table class="pricing-table hk-sub-table hk-reflective-table">
      <colgroup>
        <col class="hk-reflective-col-name"><col class="hk-reflective-col-spec"><col class="hk-reflective-col-code">
        ${showCost ? '<col class="hk-reflective-col-cost">' : ''}<col class="hk-sub-col-previous"><col class="hk-sub-col-price">
        <col class="hk-reflective-col-increase"><col class="hk-sub-col-margin"><col class="hk-sub-col-margin"><col class="hk-sub-col-margin">
        <col class="hk-sub-col-net"><col class="hk-sub-col-rate"><col class="hk-sub-col-rate">
      </colgroup>
      <thead><tr>
        <th class="hk-sub-head-base">품명</th><th class="hk-sub-head-base">규격</th><th class="hk-sub-head-code">상품코드</th>
        ${showCost ? '<th class="hk-sub-head-base">원가</th>' : ''}<th class="hk-sub-head-base">이전 판매가</th><th class="hk-sub-head-sale-price">판매가</th>
        <th class="hk-sub-head-base">26.05.08<br>인상가(25%)</th>
        <th class="hk-sub-head-margin">마진</th><th class="hk-sub-head-margin">판매수수료<br><small>6%</small></th><th class="hk-sub-head-margin">부가세<br><small>10%</small></th>
        <th class="hk-sub-head-margin">순수마진</th><th class="hk-sub-head-rate">순수마진율</th><th class="hk-sub-ref-margin-head">참고마진율</th>
      </tr></thead>
      <tbody>${items.map(({ product, index }) => _hkReflectiveRowHtml(product, index, showCost)).join('')}</tbody>
    </table>
  </div>`;
}

function _hkReflectiveAccordionHtml(group, groupIndex) {
  const id = `reflective_g${groupIndex}`;
  return `<div class="hk-iso-accordion${groupIndex === 0 ? ' open' : ''}" id="hkIsoAcc-${id}">
    <div class="hk-iso-accordion-head">
      <span class="hk-iso-accordion-title">${group.name}</span>
      <span class="hk-iso-accordion-count">상품 ${group.items.length}개</span>
      <button type="button" class="hk-iso-accordion-toggle" onclick="toggleHkIsoAccordion('${id}')" title="펼치기 / 접기" aria-label="${group.name} 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"></i></button>
    </div>
    <div class="hk-iso-accordion-body">${_hkReflectiveTableHtml(group.items)}</div>
  </div>`;
}

/* 판상형 원가 설정 카드 — 값을 바꾸면 판상형 행 전체 원가·마진이 바로 다시 계산된다. */
function _hkReflectiveBomCard() {
  const field = (key, label) => `<label class="hk-iso-bom-field">${label}
    <input type="text" inputmode="numeric" class="pricing-input-field hk-iso-bom-input" value="${Number(HK_REFLECTIVE_BOM[key]).toLocaleString()}" oninput="updateHkReflectiveBom('${key}', this.value)">
  </label>`;
  return `<div class="card pricing-cost-card hk-iso-draft-margin-card" data-draft-tab="reflective-shared">
    <div class="pricing-section-title">판상형 원가 설정(20T~50T) <span class="pricing-section-sub">— 재료 단가를 고치면 판상형 행 전체 원가·마진이 바로 반영됩니다.</span></div>
    <div class="hk-iso-bom-fields">
      ${field('pe', 'PE폼 (원/㎡·mm × 두께)')}
      ${field('pet', 'PET필름 (원, 고정)')}
      ${field('alFelt', 'AL필름+부직40g (원, 고정)')}
      ${field('pack', '포장비/지관 (원, 고정)')}
      ${field('petDouble', '양면PET증착 (원, 30T 이상만)')}
      ${field('bond', '본드/물류단가 (원, 접착 옵션만)')}
    </div>
  </div>`;
}

/* 롤형 마스터 원가 설정 카드 — 두께·등급별 "롤 전체 원가"를 고치면 1M/5M/10M/…/0.5M 등
   같은 키를 쓰는 모든 길이별 옵션의 원가가 비례해서 같이 계산된다(_hkReflectiveRollCost). */
function _hkReflectiveRollCostRowHtml(key) {
  const master = HK_REFLECTIVE_ROLL_MASTER[key];
  const perMeter = master.length ? master.cost / master.length : 0;
  return `<tr data-master-key="${key}">
    <td class="hk-reflective-roll-master-label">${master.label}</td>
    <td class="hk-reflective-roll-master-length">${master.length}M</td>
    <td class="hk-reflective-roll-master-cost">
      <input type="text" inputmode="numeric" class="pricing-input-field hk-iso-bom-input" value="${Number(master.cost).toLocaleString()}" oninput="updateHkReflectiveRollCost('${key}', this.value)">
    </td>
    <td class="hk-reflective-roll-master-permeter">${_hkIsoDraftNumber(Math.round(perMeter))}</td>
  </tr>`;
}

function _hkReflectiveRollCostCard() {
  const rows = Object.keys(HK_REFLECTIVE_ROLL_MASTER).map(_hkReflectiveRollCostRowHtml).join('');
  return `<div class="card pricing-cost-card hk-iso-draft-margin-card" data-draft-tab="reflective-roll">
    <div class="pricing-section-title">롤형 원가 설정(5T~13T, 고티) <span class="pricing-section-sub">— 두께·등급별 "롤 전체 원가"만 입력하면 1M·5M·10M 등 길이로 잘라 파는 모든 옵션의 원가가 "원가 ÷ 롤 길이 × 판매 길이"로 자동 계산됩니다.</span></div>
    <div class="pricing-table-scroll">
      <table class="pricing-table hk-reflective-roll-master-table">
        <thead><tr><th>두께·등급</th><th>롤 길이</th><th>롤 전체 원가</th><th>m당원가(계산됨)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="pricing-cost-footer hk-iso-shared-cost-controls">
      <div class="pricing-base-month-wrap">
        <label class="pricing-base-month-label" for="hkReflectiveBaseMonth">단가 기준 년월</label>
        <input type="month" id="hkReflectiveBaseMonth" class="pricing-input-field pricing-month-field" value="${HK_ISO_DRAFT_BASE_MONTH}" oninput="hkIsoSetBaseMonth(this.value)">
      </div>
    </div>
  </div>`;
}

function renderHkReflectivePane() {
  // 롤형 원가 설정 카드는 뺐다(사용자 확인, 2026-09-22 — "일단 복잡하니까 원가 부분 보이지 않게").
  // HK_REFLECTIVE_ROLL_MASTER·_hkReflectiveRollCost 자체는 그대로 둬서 마진 계산은 내부적으로 계속 쓴다.
  return `<div id="hkReflectiveBaseDataSection">
    ${_hkReflectiveBomCard()}<div id="hkIsoAcc-reflective_all" class="card pricing-result-card hk-sub-card">
      <div class="pricing-result-header">
        <div class="pricing-result-title">한국단열 열반사단열재(빌트론) 기준 판매가<span class="pricing-spec-badge">${HK_REFLECTIVE_PRODUCTS.length}개 · 2단계 배송 정책 없음</span></div>
      </div>
      <div class="hk-iso-accordion-list">
        ${_hkReflectiveGroups().map(_hkReflectiveAccordionHtml).join('')}
      </div>
    </div>
  </div>`;
}

/* 원가가 바뀐 뒤 화면에 이미 그려진 행들의 원가·마진 칸만 다시 채운다(전체 다시 그리기 없이). */
function _hkReflectiveRefreshRowCells(selector) {
  document.querySelectorAll(selector).forEach(row => {
    const product = HK_REFLECTIVE_PRODUCTS[Number(row.dataset.rowIndex)];
    if (!product) return;
    const costCell = row.querySelector('.hk-reflective-cost');
    if (costCell) costCell.textContent = _hkIsoDraftNumber(Math.round(product.cost));
    const priceInput = row.querySelector('.hk-iso-final-price-input');
    if (priceInput) window.recalcHkReflectiveRow(priceInput);
  });
}

window.updateHkReflectiveBom = function(key, value) {
  if (!(key in HK_REFLECTIVE_BOM)) return;
  HK_REFLECTIVE_BOM[key] = Math.max(0, _hkIsoDraftParseNumber(value));
  hkReflectiveRefreshDerived();
  _hkReflectiveRefreshRowCells('.hk-reflective-board-row');
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

window.updateHkReflectiveRollCost = function(key, value) {
  const master = HK_REFLECTIVE_ROLL_MASTER[key];
  if (!master) return;
  master.cost = Math.max(0, _hkIsoDraftParseNumber(value));
  hkReflectiveRefreshDerived();
  const permeterCell = document.querySelector(`.hk-reflective-roll-master-table tr[data-master-key="${key}"] .hk-reflective-roll-master-permeter`);
  if (permeterCell) permeterCell.textContent = _hkIsoDraftNumber(Math.round(master.length ? master.cost / master.length : 0));
  document.querySelectorAll(`.hk-reflective-roll-row`).forEach(row => {
    const product = HK_REFLECTIVE_PRODUCTS[Number(row.dataset.rowIndex)];
    if (!product || product.masterKey !== key) return;
    const costCell = row.querySelector('.hk-reflective-cost');
    if (costCell) costCell.textContent = _hkIsoDraftNumber(Math.round(product.cost));
    const priceInput = row.querySelector('.hk-iso-final-price-input');
    if (priceInput) window.recalcHkReflectiveRow(priceInput);
  });
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

window.recalcHkReflectiveRow = function(input) {
  const row = input.closest('tr');
  if (!row) return;
  const product = HK_REFLECTIVE_PRODUCTS[Number(row.dataset.rowIndex)];
  if (!product) return;
  product.price = _hkIsoDraftParseNumber(input.value);
  const metrics = _hkReflectiveMetrics(product.cost, product.price);
  row.querySelector('.hk-sub-margin').textContent = _hkIsoDraftNumber(metrics.margin);
  row.querySelector('.hk-sub-fee').textContent = _hkIsoDraftNumber(metrics.fee);
  row.querySelector('.hk-sub-vat').textContent = _hkIsoDraftNumber(metrics.vat);
  row.querySelector('.hk-sub-net-margin').textContent = _hkIsoDraftNumber(metrics.netMargin);
  row.querySelector('.hk-sub-net-rate').textContent = _hkIsoDraftNumber(metrics.netRate, '%');
  const historyEl = row.querySelector('.hk-iso-price-history');
  if (historyEl) historyEl.hidden = Number(input.dataset.originalPrice) === product.price;
  if (typeof window.hkDbMarkDirty === 'function') window.hkDbMarkDirty();
};

/* 판매가 칸 — 연필 아이콘을 눌러야 수정되는 방식(아이소핑크·스티로폼과 같은 UX, window.formatHkIsoDraftPrice 재사용). */
window.beginHkReflectiveRowPriceEdit = function(source) {
  const cell = source.closest('.hk-iso-draft-price');
  const input = cell?.querySelector('.hk-iso-final-price-input');
  if (!input) return;
  input.dataset.editStartPrice = String(_hkIsoDraftParseNumber(input.value));
  input.readOnly = false;
  cell.classList.add('editing');
  input.focus();
  input.select();
};

window.finishHkReflectiveRowPriceEdit = function(input) {
  window.formatHkIsoDraftPrice(input);
  input.readOnly = true;
  input.closest('.hk-iso-draft-price')?.classList.remove('editing');
  const history = input.closest('.hk-iso-draft-price')?.querySelector('.hk-iso-price-history');
  if (history) history.hidden = Number(input.dataset.originalPrice) === _hkIsoDraftParseNumber(input.value);
};

window.revertHkReflectiveRowPrice = function(button) {
  const cell = button.closest('.hk-iso-draft-price');
  const input = cell?.querySelector('.hk-iso-final-price-input');
  if (!input) return;
  input.value = Number(input.dataset.originalPrice || 0).toLocaleString();
  window.recalcHkReflectiveRow(input);
  input.readOnly = true;
  cell.classList.remove('editing');
};

window.handleHkReflectiveRowPriceKey = function(event, input) {
  if (event.key === 'Enter') input.blur();
  if (event.key === 'Escape') {
    input.value = Number(input.dataset.editStartPrice || input.dataset.originalPrice || 0).toLocaleString();
    window.recalcHkReflectiveRow(input);
    input.blur();
  }
};

/* pricing-hankook-db.js가 부르는 색인 — 부자재(hkSubProductIndex)와 같은 모양이다.
   accordionId를 전부 'reflective_all'로 두는 것도 같은 이유(부자재 참고) — 바깥 카드 하나가
   모든 아코디언을 감싸고 있어서 행을 어디서든 data-row-index로 바로 찾을 수 있다. */
window.hkReflectiveProductIndex = function() {
  return HK_REFLECTIVE_PRODUCTS.map((row, rowIndex) => ({
    code: row.code,
    block: null,
    ship: {},
    row,
    rowIndex,
    accordionId: 'reflective_all',
    categoryId: 'hk_reflective',
  }));
};

window.hkReflectivePriceByCode = function(code) {
  const product = HK_REFLECTIVE_PRODUCTS.find(item => item.code === code);
  return product ? Number(product.price) : null;
};
