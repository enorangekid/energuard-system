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

/* ═══════════════════════════════════════
   한국단열 채널 — 열반사단열재 (2026-09-22, 사용자가 준 표 36행).
   엑셀의 "판매가·수정전판매가·차액"과 맨 뒤 "수정 전 판매가·차액·수정 전 배송비"는 전부 같은
   성격의 이전값 참고칸이다(사용자 확인 — "아이소핑크와 다른쪽에도 했었던 거랑 같은 헤더") —
   기존 규칙대로 수정 전 판매가·배송비는 엑셀 값이 아니라 지금 1단계 판매가·배송비로 맞춘다.
   상품ID 623737324 그룹의 제주배송비·반품/교환비가 중간(10T부터)에 바뀌는 것처럼 보였는데
   사용자가 "내 실수, 안 바뀐다"고 확인해서 그룹 전체에 22000 / 11000·22000을 그대로 썼다.
═══════════════════════════════════════ */
(function addReflectiveHkdChannelProducts() {
  const product = (productId, baseShipping, shippingBasis, jejuShipping, returnExchange, rows) => ({
    categoryId: 'hk_reflective',
    productId,
    baseShipping,
    shippingBasis,
    jejuShipping,
    returnExchange,
    items: rows.map(([productName, productCode]) => ({
      productCode,
      productName,
      prevPrice: _hkChannelTargetPrice('hk_reflective', productCode, 'hkd', null, null) ?? 0,
      prevShipping: baseShipping,
    })),
  });

  HK_CHANNEL_LISTINGS.hkd.push(
    product('349222019', 27000, '1개마다', 30000, '40000/80000', [
      ['빌트론 10T 1m x 25m 일반형 비접착', 'BL_10_25_SN_R'],
      ['빌트론 10T 1m x 25m 일반형 한쪽접착', 'BL_10_25_SA_R'],
      ['빌트론 10T 1m x 25m 고급형 비접착', 'BL_10_25_DN_R'],
      ['빌트론 10T 1m x 25m 고급형 한쪽접착', 'BL_10_25_DA_R'],
    ]),
    product('505443624', 4300, '5개마다', 12000, '8000/16000', [
      ['빌트론 10T 1m x 1m 일반형 비접착', 'BL_10_1_SN'],
      ['빌트론 10T 1m x 1m 고급형 비접착', 'BL_10_1_DN'],
      ['빌트론 10T 1m x 1m 일반형 한쪽접착', 'BL_10_1_SA'],
      ['빌트론 10T 1m x 1m 고급형 한쪽접착', 'BL_10_1_DA'],
      ['빌트론 13T 1m x 1m 고급형 비접착', 'BL_13_1_DN'],
      ['빌트론 13T 1m x 1m 고급형 한쪽접착', 'BL_13_1_DA'],
      ['빌트론 5T 1m x 1m 일반형 비접착', 'BL_5_1_SN'],
      ['빌트론 5T 1m x 1m 고급형 비접착', 'BL_5_1_DN'],
      ['빌트론 5T 1m x 1m 일반형 한쪽접착', 'BL_5_1_SA'],
      ['빌트론 5T 1m x 1m 고급형 한쪽접착', 'BL_5_1_DA'],
      ['빌트론 6T 1m x 1m 일반형 비접착', 'BL_6_1_SN'],
      ['빌트론 6T 1m x 1m 고급형 비접착', 'BL_6_1_DN'],
      ['빌트론 6T 1m x 1m 일반형 한쪽접착', 'BL_6_1_SA'],
      ['빌트론 6T 1m x 1m 고급형 한쪽접착', 'BL_6_1_DA'],
    ]),
    product('614497979', 14500, '5개마다', 26000, '26000/52000', [
      ['빌트론 20T 1m x 2m 고급형 비접착', 'BL_20_2_DN'],
      ['빌트론 20T 1m x 2m 고급형 한쪽접착', 'BL_20_2_DA'],
      ['빌트론 30T 1m x 2m 고급형 비접착', 'BL_30_2_DN'],
      ['빌트론 30T 1m x 2m 고급형 한쪽접착', 'BL_30_2_DA'],
    ]),
    product('623737324', 0, '-', 22000, '11000/22000', [
      ['빌트론 5T 1m x 10m 일반형 비접착', 'BL_5_10_SN'],
      ['빌트론 5T 1m x 10m 고급형 비접착', 'BL_5_10_DN'],
      ['빌트론 5T 1m x 10m 일반형 한쪽접착', 'BL_5_10_SA'],
      ['빌트론 5T 1m x 10m 고급형 한쪽접착', 'BL_5_10_DA'],
      ['빌트론 6T 1m x 10m 일반형 비접착', 'BL_6_10_SN'],
      ['빌트론 6T 1m x 10m 고급형 비접착', 'BL_6_10_DN'],
      ['빌트론 6T 1m x 10m 일반형 한쪽접착', 'BL_6_10_SA'],
      ['빌트론 6T 1m x 10m 고급형 한쪽접착', 'BL_6_10_DA'],
      ['빌트론 10T 1m x 10m 일반형 비접착', 'BL_10_10_SN'],
      ['빌트론 10T 1m x 10m 고급형 비접착', 'BL_10_10_DN'],
      ['빌트론 10T 1m x 10m 일반형 한쪽접착', 'BL_10_10_SA'],
      ['빌트론 10T 1m x 10m 고급형 한쪽접착', 'BL_10_10_DA'],
      ['빌트론 13T 1m x 10m 고급형 비접착', 'BL_13_10_DN'],
      ['빌트론 13T 1m x 10m 고급형 한쪽접착', 'BL_13_10_DA'],
    ]),
    // 2026-09-22 사용자가 준 4차 배치(24개 상품ID·234개 옵션) — 아래도 전부 같은 규칙.
    product('628487624', 0, '-', 30000, '40000/80000', [
      ['빌트론 5T 1m x 5m 일반형 비접착', 'BL_5_5_SN'],
      ['빌트론 5T 1m x 5m 고급형 비접착', 'BL_5_5_DN'],
      ['빌트론 5T 1m x 5m 일반형 한쪽접착', 'BL_5_5_SA'],
      ['빌트론 5T 1m x 5m 고급형 한쪽접착', 'BL_5_5_DA'],
      ['빌트론 6T 1m x 5m 일반형 비접착', 'BL_6_5_SN'],
      ['빌트론 6T 1m x 5m 고급형 비접착', 'BL_6_5_DN'],
      ['빌트론 6T 1m x 5m 일반형 한쪽접착', 'BL_6_5_SA'],
      ['빌트론 6T 1m x 5m 고급형 한쪽접착', 'BL_6_5_DA'],
      ['빌트론 10T 1m x 5m 일반형 비접착', 'BL_10_5_SN'],
      ['빌트론 10T 1m x 5m 고급형 비접착', 'BL_10_5_DN'],
      ['빌트론 10T 1m x 5m 일반형 한쪽접착', 'BL_10_5_SA'],
      ['빌트론 10T 1m x 5m 고급형 한쪽접착', 'BL_10_5_DA'],
      ['빌트론 13T 1m x 5m 고급형 비접착', 'BL_13_5_DN'],
      ['빌트론 13T 1m x 5m 고급형 한쪽접착', 'BL_13_5_DA'],
      ['빌트론 5T 1m x 10m 일반형 비접착', 'BL_5_10_SN'],
      ['빌트론 5T 1m x 10m 고급형 비접착', 'BL_5_10_DN'],
      ['빌트론 5T 1m x 10m 일반형 한쪽접착', 'BL_5_10_SA'],
      ['빌트론 5T 1m x 10m 고급형 한쪽접착', 'BL_5_10_DA'],
      ['빌트론 6T 1m x 10m 일반형 비접착', 'BL_6_10_SN'],
      ['빌트론 6T 1m x 10m 고급형 비접착', 'BL_6_10_DN'],
      ['빌트론 6T 1m x 10m 일반형 한쪽접착', 'BL_6_10_SA'],
      ['빌트론 6T 1m x 10m 고급형 한쪽접착', 'BL_6_10_DA'],
      ['빌트론 10T 1m x 10m 일반형 비접착', 'BL_10_10_SN'],
      ['빌트론 10T 1m x 10m 고급형 비접착', 'BL_10_10_DN'],
      ['빌트론 10T 1m x 10m 일반형 한쪽접착', 'BL_10_10_SA'],
      ['빌트론 10T 1m x 10m 고급형 한쪽접착', 'BL_10_10_DA'],
      ['빌트론 13T 1m x 10m 고급형 비접착', 'BL_13_10_DN'],
      ['빌트론 13T 1m x 10m 고급형 한쪽접착', 'BL_13_10_DA'],
      ['빌트론 5T 1m x 15m 일반형 비접착', 'BL_5_15_SN'],
      ['빌트론 5T 1m x 15m 고급형 비접착', 'BL_5_15_DN'],
      ['빌트론 5T 1m x 15m 일반형 한쪽접착', 'BL_5_15_SA'],
      ['빌트론 5T 1m x 15m 고급형 한쪽접착', 'BL_5_15_DA'],
      ['빌트론 6T 1m x 15m 일반형 비접착', 'BL_6_15_SN'],
      ['빌트론 6T 1m x 15m 고급형 비접착', 'BL_6_15_DN'],
      ['빌트론 6T 1m x 15m 일반형 한쪽접착', 'BL_6_15_SA'],
      ['빌트론 6T 1m x 15m 고급형 한쪽접착', 'BL_6_15_DA'],
      ['빌트론 10T 1m x 15m 일반형 비접착', 'BL_10_15_SN'],
      ['빌트론 10T 1m x 15m 고급형 비접착', 'BL_10_15_DN'],
      ['빌트론 10T 1m x 15m 일반형 한쪽접착', 'BL_10_15_SA'],
      ['빌트론 10T 1m x 15m 고급형 한쪽접착', 'BL_10_15_DA'],
      ['빌트론 13T 1m x 15m 고급형 비접착', 'BL_13_15_DN'],
      ['빌트론 13T 1m x 15m 고급형 한쪽접착', 'BL_13_15_DA'],
      ['빌트론 5T 1m x 20m 일반형 비접착', 'BL_5_20_SN'],
      ['빌트론 5T 1m x 20m 고급형 비접착', 'BL_5_20_DN'],
      ['빌트론 5T 1m x 20m 일반형 한쪽접착', 'BL_5_20_SA'],
      ['빌트론 5T 1m x 20m 고급형 한쪽접착', 'BL_5_20_DA'],
      ['빌트론 6T 1m x 20m 일반형 비접착', 'BL_6_20_SN'],
      ['빌트론 6T 1m x 20m 고급형 비접착', 'BL_6_20_DN'],
      ['빌트론 6T 1m x 20m 일반형 한쪽접착', 'BL_6_20_SA'],
      ['빌트론 6T 1m x 20m 고급형 한쪽접착', 'BL_6_20_DA'],
      ['빌트론 10T 1m x 20m 일반형 비접착', 'BL_10_20_SN'],
      ['빌트론 10T 1m x 20m 고급형 비접착', 'BL_10_20_DN'],
      ['빌트론 10T 1m x 20m 일반형 한쪽접착', 'BL_10_20_SA'],
      ['빌트론 10T 1m x 20m 고급형 한쪽접착', 'BL_10_20_DA'],
      ['빌트론 13T 1m x 20m 고급형 비접착', 'BL_13_20_DN'],
      ['빌트론 13T 1m x 20m 고급형 한쪽접착', 'BL_13_20_DA'],
      ['빌트론 5T 1m x 25m 일반형 비접착', 'BL_5_25_SN'],
      ['빌트론 5T 1m x 25m 고급형 비접착', 'BL_5_25_DN'],
      ['빌트론 5T 1m x 25m 일반형 한쪽접착', 'BL_5_25_SA'],
      ['빌트론 5T 1m x 25m 고급형 한쪽접착', 'BL_5_25_DA'],
      ['빌트론 6T 1m x 25m 일반형 비접착', 'BL_6_25_SN'],
      ['빌트론 6T 1m x 25m 고급형 비접착', 'BL_6_25_DN'],
      ['빌트론 6T 1m x 25m 일반형 한쪽접착', 'BL_6_25_SA'],
      ['빌트론 6T 1m x 25m 고급형 한쪽접착', 'BL_6_25_DA'],
      ['빌트론 10T 1m x 25m 일반형 비접착', 'BL_10_25_SN'],
      ['빌트론 10T 1m x 25m 고급형 비접착', 'BL_10_25_DN'],
      ['빌트론 10T 1m x 25m 일반형 한쪽접착', 'BL_10_25_SA'],
      ['빌트론 10T 1m x 25m 고급형 한쪽접착', 'BL_10_25_DA'],
    ]),
    product('12936160195', 0, '-', 30000, '40000/80000', [
      ['빌트론 5T 1m x 5m 일반형 비접착', 'BL_5_5_SN'],
      ['빌트론 5T 1m x 5m 고급형 비접착', 'BL_5_5_DN'],
      ['빌트론 5T 1m x 5m 일반형 한쪽접착', 'BL_5_5_SA'],
      ['빌트론 5T 1m x 5m 고급형 한쪽접착', 'BL_5_5_DA'],
      ['빌트론 6T 1m x 5m 일반형 비접착', 'BL_6_5_SN'],
      ['빌트론 6T 1m x 5m 고급형 비접착', 'BL_6_5_DN'],
      ['빌트론 6T 1m x 5m 일반형 한쪽접착', 'BL_6_5_SA'],
      ['빌트론 6T 1m x 5m 고급형 한쪽접착', 'BL_6_5_DA'],
      ['빌트론 10T 1m x 5m 일반형 비접착', 'BL_10_5_SN'],
      ['빌트론 10T 1m x 5m 고급형 비접착', 'BL_10_5_DN'],
      ['빌트론 10T 1m x 5m 일반형 한쪽접착', 'BL_10_5_SA'],
      ['빌트론 10T 1m x 5m 고급형 한쪽접착', 'BL_10_5_DA'],
      ['빌트론 13T 1m x 5m 고급형 비접착', 'BL_13_5_DN'],
      ['빌트론 13T 1m x 5m 고급형 한쪽접착', 'BL_13_5_DA'],
    ]),
    product('2448558544', 0, '-', 45000, '45000/90000', [
      ['빌트론 50T 1m x 2m 고급형 비접착_5장', 'BL_50_2_DN_5'],
    ]),
    product('2598880337', 0, '-', 35000, '35000/70000', [
      ['빌트론 40T 1m x 2m 고급형 비접착_5장', 'BL_40_2_DN_5'],
    ]),
    product('2599158337', 0, '-', 25000, '25000/50000', [
      ['빌트론 30T 1m x 2m 고급형 비접착_5장', 'BL_30_2_DN_5'],
      ['빌트론 30T 1m x 2m 고급형 한쪽접착_5장', 'BL_30_2_DA_5'],
    ]),
    product('2599242583', 26000, '1개마다', 26000, '39000/78000', [
      ['빌트론 20T 1m x 10m 고급형 비접착', 'BL_20_10_DN_R'],
      ['빌트론 20T 1m x 10m 고급형 한쪽접착', 'BL_20_10_DA_R'],
    ]),
    product('2599273590', 32000, '1개마다', 32000, '39000/78000', [
      ['빌트론 13T 1m x 20m 고급형 비접착', 'BL_13_20_DN_R'],
      ['빌트론 13T 1m x 20m 고급형 한쪽접착', 'BL_13_20_DA_R'],
    ]),
    product('2599610352', 20000, '1개마다', 20000, '30000/60000', [
      ['빌트론 6T 1m x 25m 일반형 비접착', 'BL_6_25_SN_R'],
      ['빌트론 6T 1m x 25m 고급형 비접착', 'BL_6_25_DN_R'],
      ['빌트론 6T 1m x 25m 일반형 한쪽접착', 'BL_6_25_SA_R'],
      ['빌트론 6T 1m x 25m 고급형 한쪽접착', 'BL_6_25_DA_R'],
    ]),
    product('2599698654', 27000, '1개마다', 27000, '40000/80000', [
      ['빌트론 5T 1m x 50m 일반형 비접착', 'BL_5_50_SN_R'],
      ['빌트론 5T 1m x 50m 일반형 한쪽접착', 'BL_5_50_SA_R'],
      ['빌트론 5T 1m x 50m 고급형 비접착', 'BL_5_50_DN_R'],
      ['빌트론 5T 1m x 50m 고급형 한쪽접착', 'BL_5_50_DA_R'],
      ['빌트론 6T 1m x 25m 일반형 비접착', 'BL_6_25_SN_R'],
      ['빌트론 6T 1m x 25m 일반형 한쪽접착', 'BL_6_25_SA_R'],
      ['빌트론 6T 1m x 25m 고급형 비접착', 'BL_6_25_DN_R'],
      ['빌트론 6T 1m x 25m 고급형 한쪽접착', 'BL_6_25_DA_R'],
      ['빌트론 10T 1m x 25m 일반형 비접착', 'BL_10_25_SN_R'],
      ['빌트론 10T 1m x 25m 일반형 한쪽접착', 'BL_10_25_SA_R'],
      ['빌트론 10T 1m x 25m 고급형 비접착', 'BL_10_25_DN_R'],
      ['빌트론 10T 1m x 25m 고급형 한쪽접착', 'BL_10_25_DA_R'],
      ['빌트론 13T 1m x 20m 고급형 비접착', 'BL_13_20_DN_R'],
      ['빌트론 13T 1m x 20m 고급형 한쪽접착', 'BL_13_20_DA_R'],
    ]),
    product('3402310018', 5000, '5개마다', 12000, '8500/17000', [
      ['빌트론 5T 1m x 1m 고급형 비접착', 'BL_5_1_DN'],
      ['빌트론 5T 1m x 1m 고급형 한쪽접착', 'BL_5_1_DA'],
      ['빌트론 6T 1m x 1m 고급형 비접착', 'BL_6_1_DN'],
      ['빌트론 6T 1m x 1m 고급형 한쪽접착', 'BL_6_1_DA'],
      ['빌트론 10T 1m x 1m 고급형 비접착', 'BL_10_1_DN'],
      ['빌트론 10T 1m x 1m 고급형 한쪽접착', 'BL_10_1_DA'],
      ['빌트론 13T 1m x 1m 고급형 비접착', 'BL_13_1_DN'],
      ['빌트론 13T 1m x 1m 고급형 한쪽접착', 'BL_13_1_DA'],
    ]),
    product('3780749543', 5000, '5개마다', 12000, '8500/17000', [
      ['빌트론 5T 1m x 1m 일반형 비접착', 'BL_5_1_SN'],
      ['빌트론 5T 1m x 1m 고급형 비접착', 'BL_5_1_DN'],
      ['빌트론 5T 1m x 1m 일반형 한쪽접착', 'BL_5_1_SA'],
      ['빌트론 5T 1m x 1m 고급형 한쪽접착', 'BL_5_1_DA'],
      ['빌트론 6T 1m x 1m 일반형 비접착', 'BL_6_1_SN'],
      ['빌트론 6T 1m x 1m 고급형 비접착', 'BL_6_1_DN'],
      ['빌트론 6T 1m x 1m 일반형 한쪽접착', 'BL_6_1_SA'],
      ['빌트론 6T 1m x 1m 고급형 한쪽접착', 'BL_6_1_DA'],
      ['빌트론 10T 1m x 1m 일반형 비접착', 'BL_10_1_SN'],
      ['빌트론 10T 1m x 1m 고급형 비접착', 'BL_10_1_DN'],
      ['빌트론 10T 1m x 1m 일반형 한쪽접착', 'BL_10_1_SA'],
      ['빌트론 10T 1m x 1m 고급형 한쪽접착', 'BL_10_1_DA'],
      ['빌트론 13T 1m x 1m 고급형 비접착', 'BL_13_1_DN'],
      ['빌트론 13T 1m x 1m 고급형 한쪽접착', 'BL_13_1_DA'],
      ['빌트론 20T 1m x 1m 고급형 비접착', 'BL_20_1_DN'],
      ['빌트론 20T 1m x 1m 고급형 한쪽접착', 'BL_20_1_DA'],
    ]),
    product('3781080651', 5000, '5개마다', 12000, '8500/17000', [
      ['빌트론 5T 1m x 1m 일반형 비접착', 'BL_5_1_SN'],
      ['빌트론 5T 1m x 1m 고급형 비접착', 'BL_5_1_DN'],
      ['빌트론 5T 1m x 1m 일반형 한쪽접착', 'BL_5_1_SA'],
      ['빌트론 5T 1m x 1m 고급형 한쪽접착', 'BL_5_1_DA'],
      ['빌트론 6T 1m x 1m 일반형 비접착', 'BL_6_1_SN'],
      ['빌트론 6T 1m x 1m 고급형 비접착', 'BL_6_1_DN'],
      ['빌트론 6T 1m x 1m 일반형 한쪽접착', 'BL_6_1_SA'],
      ['빌트론 6T 1m x 1m 고급형 한쪽접착', 'BL_6_1_DA'],
    ]),
    product('10471290026', 0, '-', 20000, '20000/40000', [
      ['빌트론 20T 1m x 2m 고급형 비접착', 'BL_20_2_DN_F'],
      ['빌트론 20T 1m x 2m 고급형 한쪽접착', 'BL_20_2_DA_F'],
      ['빌트론 30T 1m x 2m 고급형 비접착', 'BL_30_2_DN_F'],
      ['빌트론 30T 1m x 2m 고급형 한쪽접착', 'BL_30_2_DA_F'],
      ['빌트론 40T 1m x 2m 고급형 비접착', 'BL_40_2_DN_F'],
      ['빌트론 50T 1m x 2m 고급형 비접착', 'BL_50_2_DN_F'],
    ]),
    product('10628616594', 0, '-', 20000, '20000/40000', [
      ['빌트론 20T 1m x 2m 고급형 비접착_5장', 'BL_20_2_DN_5'],
      ['빌트론 20T 1m x 2m 고급형 한쪽접착_5장', 'BL_20_2_DA_5'],
    ]),
    product('10682944267', 4300, '5개마다', 12000, '8000/16000', [
      ['빌트론 10T 1m x 1m 일반형 비접착', 'BL_10_1_SN'],
      ['빌트론 10T 1m x 1m 고급형 비접착', 'BL_10_1_DN'],
      ['빌트론 10T 1m x 1m 일반형 한쪽접착', 'BL_10_1_SA'],
      ['빌트론 10T 1m x 1m 고급형 한쪽접착', 'BL_10_1_DA'],
      ['빌트론 13T 1m x 1m 고급형 비접착', 'BL_13_1_DN'],
      ['빌트론 13T 1m x 1m 고급형 한쪽접착', 'BL_13_1_DA'],
      ['빌트론 5T 1m x 1m 일반형 비접착', 'BL_5_1_SN'],
      ['빌트론 5T 1m x 1m 고급형 비접착', 'BL_5_1_DN'],
      ['빌트론 5T 1m x 1m 일반형 한쪽접착', 'BL_5_1_SA'],
      ['빌트론 5T 1m x 1m 고급형 한쪽접착', 'BL_5_1_DA'],
      ['빌트론 6T 1m x 1m 일반형 비접착', 'BL_6_1_SN'],
      ['빌트론 6T 1m x 1m 고급형 비접착', 'BL_6_1_DN'],
      ['빌트론 6T 1m x 1m 일반형 한쪽접착', 'BL_6_1_SA'],
      ['빌트론 6T 1m x 1m 고급형 한쪽접착', 'BL_6_1_DA'],
    ]),
    product('10683699346', 14500, '5개마다', 38000, '26000/52000', [
      ['빌트론 20T 1m x 2m 고급형 비접착', 'BL_20_2_DN'],
      ['빌트론 20T 1m x 2m 고급형 한쪽접착', 'BL_20_2_DA'],
      ['빌트론 30T 1m x 2m 고급형 비접착', 'BL_30_2_DN'],
      ['빌트론 30T 1m x 2m 고급형 한쪽접착', 'BL_30_2_DA'],
      ['빌트론 40T 1m x 2m 고급형 비접착', 'BL_40_2_DN'],
      ['빌트론 50T 1m x 2m 고급형 비접착', 'BL_50_2_DN'],
    ]),
    product('10912518316', 11000, '5개마다', 20000, '15000/30000', [
      ['빌트론 20T 1m x 1m 고급형 비접착', 'BL_20_1_DN'],
      ['빌트론 20T 1m x 1m 고급형 한쪽접착', 'BL_20_1_DA'],
      ['빌트론 30T 1m x 1m 고급형 비접착', 'BL_30_1_DN'],
      ['빌트론 30T 1m x 1m 고급형 한쪽접착', 'BL_30_1_DA'],
      ['빌트론 40T 1m x 1m 고급형 비접착', 'BL_40_1_DN'],
      ['빌트론 50T 1m x 1m 고급형 비접착', 'BL_50_1_DN'],
    ]),
    product('10923727373', 5000, '5개마다', 12000, '8500/17000', [
      ['빌트론 5T 1m x 1m 일반형 비접착', 'BL_5_1_SN'],
      ['빌트론 5T 1m x 1m 고급형 비접착', 'BL_5_1_DN'],
      ['빌트론 5T 1m x 1m 일반형 한쪽접착', 'BL_5_1_SA'],
      ['빌트론 5T 1m x 1m 고급형 한쪽접착', 'BL_5_1_DA'],
      ['빌트론 6T 1m x 1m 일반형 비접착', 'BL_6_1_SN'],
      ['빌트론 6T 1m x 1m 고급형 비접착', 'BL_6_1_DN'],
      ['빌트론 6T 1m x 1m 일반형 한쪽접착', 'BL_6_1_SA'],
      ['빌트론 6T 1m x 1m 고급형 한쪽접착', 'BL_6_1_DA'],
      ['빌트론 10T 1m x 1m 일반형 비접착', 'BL_10_1_SN'],
      ['빌트론 10T 1m x 1m 고급형 비접착', 'BL_10_1_DN'],
      ['빌트론 10T 1m x 1m 일반형 한쪽접착', 'BL_10_1_SA'],
      ['빌트론 10T 1m x 1m 고급형 한쪽접착', 'BL_10_1_DA'],
      ['빌트론 13T 1m x 1m 고급형 비접착', 'BL_13_1_DN'],
      ['빌트론 13T 1m x 1m 고급형 한쪽접착', 'BL_13_1_DA'],
    ]),
    product('10985931589', 14500, '5개마다', 38000, '26000/52000', [
      ['빌트론 30T 1m x 2m 고급형 비접착', 'BL_30_2_DN'],
      ['빌트론 30T 1m x 2m 고급형 한쪽접착', 'BL_30_2_DA'],
    ]),
    product('10985932386', 14500, '5개마다', 38000, '26000/52000', [
      ['빌트론 40T 1m x 2m 고급형 비접착', 'BL_40_2_DN'],
    ]),
    product('10985933117', 14500, '5개마다', 38000, '26000/52000', [
      ['빌트론 50T 1m x 2m 고급형 비접착', 'BL_50_2_DN'],
    ]),
    product('11243899862', 4300, '5개마다', 12000, '8000/16000', [
      ['빌트론 10T 1m x 1m 일반형 비접착', 'BL_10_1_SN'],
      ['빌트론 10T 1m x 1m 고급형 비접착', 'BL_10_1_DN'],
      ['빌트론 10T 1m x 1m 일반형 한쪽접착', 'BL_10_1_SA'],
      ['빌트론 10T 1m x 1m 고급형 한쪽접착', 'BL_10_1_DA'],
      ['빌트론 13T 1m x 1m 고급형 비접착', 'BL_13_1_DN'],
      ['빌트론 13T 1m x 1m 고급형 한쪽접착', 'BL_13_1_DA'],
      ['빌트론 5T 1m x 1m 일반형 비접착', 'BL_5_1_SN'],
      ['빌트론 5T 1m x 1m 고급형 비접착', 'BL_5_1_DN'],
      ['빌트론 5T 1m x 1m 일반형 한쪽접착', 'BL_5_1_SA'],
      ['빌트론 5T 1m x 1m 고급형 한쪽접착', 'BL_5_1_DA'],
      ['빌트론 6T 1m x 1m 일반형 비접착', 'BL_6_1_SN'],
      ['빌트론 6T 1m x 1m 고급형 비접착', 'BL_6_1_DN'],
      ['빌트론 6T 1m x 1m 일반형 한쪽접착', 'BL_6_1_SA'],
      ['빌트론 6T 1m x 1m 고급형 한쪽접착', 'BL_6_1_DA'],
    ]),
    product('11356673932', 5000, '5개마다', 12000, '8500/17000', [
      ['빌트론 10T 1m x 1m 일반형 비접착', 'BL_10_1_SN'],
      ['빌트론 10T 1m x 1m 고급형 비접착', 'BL_10_1_DN'],
      ['빌트론 10T 1m x 1m 일반형 한쪽접착', 'BL_10_1_SA'],
      ['빌트론 10T 1m x 1m 고급형 한쪽접착', 'BL_10_1_DA'],
      ['빌트론 13T 1m x 1m 고급형 비접착', 'BL_13_1_DN'],
      ['빌트론 13T 1m x 1m 고급형 한쪽접착', 'BL_13_1_DA'],
      ['빌트론 5T 1m x 1m 일반형 비접착', 'BL_5_1_SN'],
      ['빌트론 5T 1m x 1m 고급형 비접착', 'BL_5_1_DN'],
      ['빌트론 5T 1m x 1m 일반형 한쪽접착', 'BL_5_1_SA'],
      ['빌트론 5T 1m x 1m 고급형 한쪽접착', 'BL_5_1_DA'],
      ['빌트론 6T 1m x 1m 일반형 비접착', 'BL_6_1_SN'],
      ['빌트론 6T 1m x 1m 고급형 비접착', 'BL_6_1_DN'],
      ['빌트론 6T 1m x 1m 일반형 한쪽접착', 'BL_6_1_SA'],
      ['빌트론 6T 1m x 1m 고급형 한쪽접착', 'BL_6_1_DA'],
    ]),
    product('12605232942', 5000, '5개마다', 12000, '8500/17000', [
      ['빌트론 10T 1m x 1m 일반형 비접착', 'BL_10_1_SN'],
      ['빌트론 10T 1m x 1m 고급형 비접착', 'BL_10_1_DN'],
      ['빌트론 10T 1m x 1m 일반형 한쪽접착', 'BL_10_1_SA'],
      ['빌트론 10T 1m x 1m 고급형 한쪽접착', 'BL_10_1_DA'],
      ['빌트론 13T 1m x 1m 고급형 비접착', 'BL_13_1_DN'],
      ['빌트론 13T 1m x 1m 고급형 한쪽접착', 'BL_13_1_DA'],
      ['빌트론 5T 1m x 1m 일반형 비접착', 'BL_5_1_SN'],
      ['빌트론 5T 1m x 1m 고급형 비접착', 'BL_5_1_DN'],
      ['빌트론 5T 1m x 1m 일반형 한쪽접착', 'BL_5_1_SA'],
      ['빌트론 5T 1m x 1m 고급형 한쪽접착', 'BL_5_1_DA'],
      ['빌트론 6T 1m x 1m 일반형 비접착', 'BL_6_1_SN'],
      ['빌트론 6T 1m x 1m 고급형 비접착', 'BL_6_1_DN'],
      ['빌트론 6T 1m x 1m 일반형 한쪽접착', 'BL_6_1_SA'],
      ['빌트론 6T 1m x 1m 고급형 한쪽접착', 'BL_6_1_DA'],
    ]),
  );
})();

/* ═══════════════════════════════════════
   홈페이지 채널 — 열반사단열재 (2026-09-22, 사용자가 준 표 16행). 상품ID는 네이버 상품번호가 아니라
   부자재·스티로폼 홈페이지 채널과 같은 내부 목록 번호(짧은 숫자)다. 비접착/한쪽접착 옵션 2개가
   같은 상품ID 하나를 공유한다(엑셀 병합 셀). 반품/교환비는 전부 30000/60000으로 고정.
   수정 전 판매가·배송비는 기존 규칙대로 지금 1단계 값으로 맞춘다.
═══════════════════════════════════════ */
(function addReflectiveHomepageProducts() {
  const pair = (productId, baseShipping, nameA, codeA, nameB, codeB) => ({
    categoryId: 'hk_reflective',
    productId,
    baseShipping,
    shippingBasis: '1개마다',
    jejuShipping: baseShipping,
    returnExchange: '30000/60000',
    items: [
      { productCode: codeA, productName: nameA, prevPrice: _hkChannelTargetPrice('hk_reflective', codeA, 'homepage', null, null) ?? 0, prevShipping: baseShipping },
      { productCode: codeB, productName: nameB, prevPrice: _hkChannelTargetPrice('hk_reflective', codeB, 'homepage', null, null) ?? 0, prevShipping: baseShipping },
    ],
  });

  HK_CHANNEL_LISTINGS.homepage.push(
    pair('31', 27000, '[열반사단열재] 빌트론 5T 일반형 비접착 50m', 'BL_5_50_SN_R', '[열반사단열재] 빌트론 5T 일반형 한쪽접착 50m', 'BL_5_50_SA_R'),
    pair('30', 27000, '[열반사단열재] 빌트론 5T 고급형 비접착 50m', 'BL_5_50_DN_R', '[열반사단열재] 빌트론 5T 고급형한쪽접착 50m', 'BL_5_50_DA_R'),
    pair('29', 20000, '[열반사단열재] 빌트론 6T 일반형 비접착 25m', 'BL_6_25_SN_R', '[열반사단열재] 빌트론 6T 일반형 한쪽접착 25m', 'BL_6_25_SA_R'),
    pair('28', 20000, '[열반사단열재] 빌트론 6T 고급형 비접착 25m', 'BL_6_25_DN_R', '[열반사단열재] 빌트론 6T 고급형 한쪽접착 25m', 'BL_6_25_DA_R'),
    pair('27', 27000, '[열반사단열재] 빌트론 10T 일반형 비접착 25m', 'BL_10_25_SN_R', '[열반사단열재] 빌트론 10T 일반형 한쪽접착 25m', 'BL_10_25_SA_R'),
    pair('26', 27000, '[열반사단열재] 빌트론 10T 고급형 비접착 25m', 'BL_10_25_DN_R', '[열반사단열재] 빌트론 10T 고급형 한쪽접착 25m', 'BL_10_25_DA_R'),
    pair('17', 32000, '[열반사단열재] 빌트론 13T 고급형 비접착 20m', 'BL_13_20_DN_R', '[열반사단열재] 빌트론 13T 고급형 한쪽접착 20m', 'BL_13_20_DA_R'),
    pair('16', 27000, '[열반사단열재] 빌트론 20T 고급형 비접착 10m', 'BL_20_10_DN_R', '[열반사단열재] 빌트론 20T 고급형 한쪽접착 10m', 'BL_20_10_DA_R'),
  );
})();

/* ═══════════════════════════════════════
   쿠팡 채널 — 열반사단열재. 1차(2026-09-23, 표 16행 — 50m/25m/20m/10m 마스터롤): 총액(판매가+배송비
   27,000, 전부 고정) × 1.16을 **100원 단위 반올림**(아이소핑크·스티로폼의 올림과 다르다 — 16행
   전부와 정확히 일치)한 게 등록가, 최종가 = 등록가 × 0.88(12% 쿠폰). "무료"(배송 정책) 표시가 있는데도
   배송비는 총액 계산에 그대로 들어가고, 쿠폰은 무료배송 쪽 규칙(12%)이라 item.couponOff=12를 명시로
   강제했다(기본 분기는 배송비 있으면 10%라 그대로 두면 안 맞음).
   2차(2026-09-23, 표 39행 — 1M/2M/10M 옵션): 같은 등록가 공식이지만 **쿠폰은 표에 그대로 적힌 비율**
   (배송비 있는 1M·2M 그룹 10%, 배송비 0인 10M 그룹 12%)을 그대로 써보니 기본 분기(배송비 있으면
   10%/없으면 12%)와 정확히 같아서 이번엔 강제 안 하고 기본값 그대로 뒀다 — 39행 전부 일치 확인.
   10T(1mx10m) 그룹 안에서 BL_10_10_SA만 상품ID가 따로(8397602717) 붙어 있어 별도 상품으로 뒀다.
   제주배송비는 전부 8,000. 반품/교환비는 그룹마다 대부분 같은 값인데 딱 2행만 그룹 안에서 다르게
   적혀 있었다(178569244의 BL_50_1_DN=10,000 vs 나머지 5,000 / 5472028429의 BL_5_10_SN=12,000 vs
   나머지 10,000) — 반품/교환비는 상품(그룹) 단위로만 저장되는 필드라 그 그룹의 다수 값으로 통일했다
   (실판매가 계산에는 안 쓰이는 참고용 칸). 1차(8232412643·5465024346)는 이번 자료에 제주·반품 정보가
   없어서 2차와 같은 제주 8,000은 유지하되 반품비는 아직 확인 전(임시로 40,000 — 다르면 알려줄 것).
═══════════════════════════════════════ */
(function addReflectiveCoupangProducts() {
  const config = HK_CHANNEL_CONFIG.coupang;
  const group = (productId, jejuShipping, returnExchange, rows, opts = {}) => {
    const items = rows.map(([optionId, code, hkdShipping, memo]) => {
      const item = { productCode: code, optionId, hkdShipping };
      if (opts.couponOff != null) item.couponOff = opts.couponOff;
      if (memo) item.memo = memo;
      const parts = _hkCoupangPriceParts('hk_reflective', code, config, item, null);
      item.prevPrice = parts ? parts.registered : 0;
      return item;
    });
    return { categoryId: 'hk_reflective', productId, baseShipping: 0, jejuShipping, returnExchange, items };
  };
  // 조건부 다운로드 쿠폰(즉시할인 쿠폰과 별개, 장바구니 금액 구간별 — 사용자 확인 2026-09-23):
  // "1mx1m"(178569244) 상품의 5T~13T 옵션 14개에만 붙어 있다(20T~50T 옵션엔 없음). 가격 계산에는
  // 안 쓰고 메모로만 남긴다(즉시할인처럼 단품 하나의 최종가를 정하는 쿠폰이 아니라 장바구니 총액
  // 구간에 걸린 조건부 쿠폰이라 등록가/최종가 공식에 넣을 수 없다).
  const conditionalCouponMemo = '다운로드 쿠폰(조건부): 2만원↑ 3천원 / 3만원↑ 5천원 / 5만원↑ 7천원 할인';

  HK_CHANNEL_LISTINGS.coupang.push(
    // 1차 — 50m/25m/20m/10m 마스터롤(couponOff 12 강제) — 반품/교환비 미확인(임시 40,000)
    group('8232412643', 8000, '40000', [
      ['91289839102', 'BL_5_50_SN_R', 27000], ['91289839107', 'BL_5_50_DN_R', 27000],
      ['91289839097', 'BL_5_50_SA_R', 27000], ['91289839110', 'BL_5_50_DA_R', 27000],
    ], { couponOff: 12 }),
    group('5465024346', 8000, '40000', [
      ['91289798188', 'BL_6_25_SN_R', 27000], ['91289798162', 'BL_6_25_DN_R', 27000],
      ['91289798163', 'BL_6_25_SA_R', 27000], ['91289798197', 'BL_6_25_DA_R', 27000],
      ['91289798201', 'BL_10_25_SN_R', 27000], ['91289798192', 'BL_10_25_DN_R', 27000],
      ['91289798173', 'BL_10_25_SA_R', 27000], ['91289798165', 'BL_10_25_DA_R', 27000],
      ['91289798154', 'BL_13_20_DN_R', 27000], ['91289798168', 'BL_13_20_DA_R', 27000],
      ['91289798150', 'BL_20_10_DN_R', 27000], ['91289798157', 'BL_20_10_DA_R', 27000],
    ], { couponOff: 12 }),
    // 2차 — 1M(5T~13T 배송비 4,300 / 20T~50T 배송비 11,000), 기본 쿠폰 분기(10%) 그대로
    group('178569244', 8000, '5000', [
      ['91300101266', 'BL_5_1_SN', 4300, conditionalCouponMemo], ['91300101320', 'BL_5_1_DN', 4300, conditionalCouponMemo],
      ['91300101325', 'BL_5_1_SA', 4300, conditionalCouponMemo], ['91300101299', 'BL_5_1_DA', 4300, conditionalCouponMemo],
      ['91300101258', 'BL_6_1_SN', 4300, conditionalCouponMemo], ['91300101263', 'BL_6_1_DN', 4300, conditionalCouponMemo],
      ['91300101314', 'BL_6_1_SA', 4300, conditionalCouponMemo], ['91300101292', 'BL_6_1_DA', 4300, conditionalCouponMemo],
      ['91300101282', 'BL_10_1_SN', 4300, conditionalCouponMemo], ['91300101241', 'BL_10_1_DN', 4300, conditionalCouponMemo],
      ['91300101304', 'BL_10_1_SA', 4300, conditionalCouponMemo], ['91300101310', 'BL_10_1_DA', 4300, conditionalCouponMemo],
      ['91300101252', 'BL_13_1_DN', 4300, conditionalCouponMemo], ['91300101276', 'BL_13_1_DA', 4300, conditionalCouponMemo],
      ['91300101236', 'BL_20_1_DN', 11000], ['91300101260', 'BL_20_1_DA', 11000],
      ['91300101270', 'BL_30_1_DN', 11000], ['91300101288', 'BL_40_1_DN', 11000],
      ['91300101246', 'BL_50_1_DN', 11000],
    ]),
    // 2차 — 2M 판상형(배송비 14,500), 기본 쿠폰 분기(10%) 그대로
    group('8255306549', 8000, '12000', [
      ['91289888729', 'BL_20_2_DN', 14500], ['91289888705', 'BL_20_2_DA', 14500],
      ['91289888742', 'BL_30_2_DN', 14500], ['91289888790', 'BL_30_2_DA', 14500],
      ['91289888759', 'BL_40_2_DN', 14500], ['91289888716', 'BL_50_2_DN', 14500],
    ]),
    // 2차 — 10M(무료배송, 기본 쿠폰 분기(12%) 그대로) — BL_10_10_SA만 별도 상품ID
    group('5472028429', 8000, '10000', [
      ['91289600533', 'BL_5_10_SN', 0], ['91289600572', 'BL_5_10_DN', 0],
      ['91289600590', 'BL_5_10_SA', 0], ['91289600596', 'BL_5_10_DA', 0],
      ['91289600607', 'BL_6_10_SN', 0], ['91289600563', 'BL_6_10_DN', 0],
      ['91289600556', 'BL_6_10_SA', 0], ['91289600544', 'BL_6_10_DA', 0],
      ['91289600522', 'BL_10_10_SN', 0], ['91289600611', 'BL_10_10_DN', 0],
      ['91289600602', 'BL_10_10_DA', 0],
    ]),
    group('8397602717', 8000, '10000', [
      ['91289600583', 'BL_10_10_SA', 0],
    ]),
    group('5654567470', 8000, '10000', [
      ['91294032535', 'BL_13_10_DN', 0], ['91294032539', 'BL_13_10_DA', 0],
    ]),
  );
})();

/* ═══════════════════════════════════════
   ESM 채널 — 열반사단열재 (2026-09-23, 사용자가 준 표 49행). 아이소핑크·스티로폼 ESM과 같은 구조 —
   옵션 하나가 단품 상품 하나(각자 고유 마스터상품번호·상품번호). 최종 판매가 = (판매가+배송비)×1.08을
   100원 올림(`_hkEsmPriceParts`, 49행 전부 정확히 일치 확인). 배송비는 그룹별로 다르고(1m 5T~13T는
   4,500 — 한국단열 채널의 같은 옵션 배송비 4,300과 다르다) 이번 표 값 그대로 override했다.
═══════════════════════════════════════ */
(function addReflectiveEsmProducts() {
  const rows = [
    ['열반사단열재 5T~13T 1m', '1394613428', '4584644489', 'BL_5_1_SN', 4500],
    ['열반사단열재 5T~13T 1m', '1394619524', '4584644969', 'BL_5_1_DN', 4500],
    ['열반사단열재 5T~13T 1m', '1394622808', '4584645350', 'BL_5_1_SA', 4500],
    ['열반사단열재 5T~13T 1m', '1395636578', '1979010825', 'BL_5_1_DA', 4500],
    ['열반사단열재 5T~13T 1m', '1395154587', '4584645643', 'BL_6_1_SN', 4500],
    ['열반사단열재 5T~13T 1m', '1395156244', '4584645936', 'BL_6_1_DN', 4500],
    ['열반사단열재 5T~13T 1m', '1395159645', '4584646169', 'BL_6_1_SA', 4500],
    ['열반사단열재 5T~13T 1m', '1395160554', '4584646413', 'BL_6_1_DA', 4500],
    ['열반사단열재 5T~13T 1m', '1395161557', '4584646719', 'BL_10_1_SN', 4500],
    ['열반사단열재 5T~13T 1m', '1395162650', '4584646961', 'BL_10_1_DN', 4500],
    ['열반사단열재 5T~13T 1m', '1395167207', '4584647304', 'BL_10_1_SA', 4500],
    ['열반사단열재 5T~13T 1m', '1404417914', '1992314088', 'BL_10_1_DA', 4500],
    ['열반사단열재 5T~13T 1m', '1395596549', '1978929735', 'BL_13_1_DN', 4500],
    ['열반사단열재 5T~13T 1m', '1395597452', '4584647664', 'BL_13_1_DA', 4500],
    ['열반사단열재 20T~50T 1m', '1395600420', '4584656901', 'BL_20_1_DN', 11000],
    ['열반사단열재 20T~50T 1m', '1404592609', '1992610288', 'BL_20_1_DA', 11000],
    ['열반사단열재 20T~50T 1m', '1395616302', '4584657282', 'BL_30_1_DN', 11000],
    ['열반사단열재 20T~50T 1m', '1395617176', '4584657686', 'BL_40_1_DN', 11000],
    ['열반사단열재 20T~50T 1m', '1395619742', '1978975740', 'BL_50_1_DN', 11000],
    ['열반사단열재 10m', '1396521595', '4584697298', 'BL_5_10_SN', 0],
    ['열반사단열재 10m', '1396524027', '1980618078', 'BL_5_10_SA', 0],
    ['열반사단열재 10m', '1396523137', '1980616788', 'BL_5_10_DN', 0],
    ['열반사단열재 10m', '6010960886', '4586293919', 'BL_5_10_DA', 0],
    ['열반사단열재 10m', '1396529934', '1980627915', 'BL_6_10_SN', 0],
    ['열반사단열재 10m', '1396539010', '4584697097', 'BL_6_10_SA', 0],
    ['열반사단열재 10m', '6010962491', '4586294661', 'BL_6_10_DN', 0],
    ['열반사단열재 10m', '1396539769', '1980645259', 'BL_6_10_DA', 0],
    ['열반사단열재 10m', '1396542431', '4584696828', 'BL_10_10_SN', 0],
    ['열반사단열재 10m', '1396637820', '1980848772', 'BL_10_10_SA', 0],
    ['열반사단열재 10m', '1396543863', '1980651457', 'BL_10_10_DN', 0],
    ['열반사단열재 10m', '1396640146', '1980852854', 'BL_10_10_DA', 0],
    ['열반사단열재 10m', '1526599674', '4584696253', 'BL_13_10_DN', 0],
    ['열반사단열재 10m', '6010979707', '4586303844', 'BL_13_10_DA', 0],
    ['열반사단열재 롤단위', '1395897806', '1979501275', 'BL_5_50_SN_R', 27000],
    ['열반사단열재 롤단위', '1395899168', '4584672442', 'BL_5_50_DN_R', 27000],
    ['열반사단열재 롤단위', '1395900267', '1979506807', 'BL_5_50_SA_R', 27000],
    ['열반사단열재 롤단위', '1404342880', '1992215304', 'BL_5_50_DA_R', 27000],
    ['열반사단열재 롤단위', '1395906593', '4584672808', 'BL_6_25_SN_R', 27000],
    ['열반사단열재 롤단위', '1395908264', '4584673302', 'BL_6_25_DN_R', 27000],
    ['열반사단열재 롤단위', '1395913193', '4584673492', 'BL_6_25_SA_R', 27000],
    ['열반사단열재 롤단위', '1395914410', '4584673717', 'BL_6_25_DA_R', 27000],
    ['열반사단열재 롤단위', '1395935349', '4584673937', 'BL_10_25_SN_R', 27000],
    ['열반사단열재 롤단위', '1395953341', '4584674153', 'BL_10_25_DN_R', 27000],
    ['열반사단열재 롤단위', '1396322961', '4584674418', 'BL_10_25_SA_R', 27000],
    ['열반사단열재 롤단위', '1396324751', '1980299343', 'BL_10_25_DA_R', 27000],
    ['열반사단열재 롤단위', '1396331912', '4584675063', 'BL_13_20_DN_R', 27000],
    ['열반사단열재 롤단위', '1396335547', '1980314957', 'BL_13_20_DA_R', 27000],
    ['열반사단열재 롤단위', '1396347416', '1980332238', 'BL_20_10_DN_R', 27000],
    ['열반사단열재 롤단위', '1396349064', '1980335035', 'BL_20_10_DA_R', 27000],
  ];
  const config = HK_CHANNEL_CONFIG.esm;
  rows.forEach(([groupName, masterId, productId, productCode, hkdShipping]) => {
    const item = { productCode, hkdShipping };
    item.prevPrice = _hkEsmPriceParts('hk_reflective', productCode, config, item)?.finalPrice ?? 0;
    HK_CHANNEL_LISTINGS.esm.push({ categoryId: 'hk_reflective', productId, masterId, groupName, items: [item] });
  });
})();

/* ═══════════════════════════════════════
   11번가 채널 — 열반사단열재 (2026-09-23, 사용자가 준 표 49행, 마스터상품번호 4개). 아이소핑크·
   스티로폼 11번가(markupOptions 레이아웃)와 같은 구조 — 상품 하나에 옵션 여러 개, ESM과 같은 계산식
   (×1.08, 100원 올림, HK_CHANNEL_CONFIG['11st']도 markupPercent:108이라 _hkEsmPriceParts를 그대로
   쓴다). 4그룹 전부 각 그룹의 첫 옵션(옵션추가금 0인 행)이 기준가라 baseCode를 따로 안 줘도 된다
   (렌더러 기본 동작이 첫 코드를 기준으로 삼음). 49행 전부 등록가(최종가) 일치 확인.
═══════════════════════════════════════ */
const HK_REFLECTIVE_11ST_GROUPS = [
  { productId: '1549579106', shipping: 27000, codes: [
    ['BL_5_50_SN_R', '빌트론 5T 1m x 50m 일반형 비접착'], ['BL_5_50_DN_R', '빌트론 5T 1m x 50m 고급형 비접착'],
    ['BL_5_50_SA_R', '빌트론 5T 1m x 50m 일반형 한쪽접착'], ['BL_5_50_DA_R', '빌트론 5T 1m x 50m 고급형 한쪽접착'],
    ['BL_6_25_SN_R', '빌트론 6T 1m x 25m 일반형 비접착'], ['BL_6_25_DN_R', '빌트론 6T 1m x 25m 고급형 비접착'],
    ['BL_6_25_SA_R', '빌트론 6T 1m x 25m 일반형 한쪽접착'], ['BL_6_25_DA_R', '빌트론 6T 1m x 25m 고급형 한쪽접착'],
    ['BL_10_25_SN_R', '빌트론 10T 1m x 25m 일반형 비접착'], ['BL_10_25_DN_R', '빌트론 10T 1m x 25m 고급형 비접착'],
    ['BL_10_25_SA_R', '빌트론 10T 1m x 25m 일반형 한쪽접착'], ['BL_10_25_DA_R', '빌트론 10T 1m x 25m 고급형 한쪽접착'],
    ['BL_13_20_DN_R', '빌트론 13T 1m x 20m 고급형 비접착'], ['BL_13_20_DA_R', '빌트론 13T 1m x 20m 고급형 한쪽접착'],
    ['BL_20_10_DN_R', '빌트론 20T 1m x 10m 고급형 비접착'], ['BL_20_10_DA_R', '빌트론 20T 1m x 10m 고급형 한쪽접착'],
  ] },
  { productId: '1549043324', shipping: 4500, codes: [
    ['BL_5_1_SN', '빌트론 5T 1m x 1m 일반형 비접착'], ['BL_5_1_DN', '빌트론 5T 1m x 1m 고급형 비접착'],
    ['BL_5_1_SA', '빌트론 5T 1m x 1m 일반형 한쪽접착'], ['BL_5_1_DA', '빌트론 5T 1m x 1m 고급형 한쪽접착'],
    ['BL_6_1_SN', '빌트론 6T 1m x 1m 일반형 비접착'], ['BL_6_1_DN', '빌트론 6T 1m x 1m 고급형 비접착'],
    ['BL_6_1_SA', '빌트론 6T 1m x 1m 일반형 한쪽접착'], ['BL_6_1_DA', '빌트론 6T 1m x 1m 고급형 한쪽접착'],
    ['BL_10_1_SN', '빌트론 10T 1m x 1m 일반형 비접착'], ['BL_10_1_DN', '빌트론 10T 1m x 1m 고급형 비접착'],
    ['BL_10_1_SA', '빌트론 10T 1m x 1m 일반형 한쪽접착'], ['BL_10_1_DA', '빌트론 10T 1m x 1m 고급형 한쪽접착'],
    ['BL_13_1_DN', '빌트론 13T 1m x 1m 고급형 비접착'], ['BL_13_1_DA', '빌트론 13T 1m x 1m 고급형 한쪽접착'],
  ] },
  { productId: '1661569991', shipping: 11000, codes: [
    ['BL_20_1_DN', '빌트론 20T 1m x 1m 고급형 비접착'], ['BL_20_1_DA', '빌트론 20T 1m x 1m 고급형 한쪽접착'],
    ['BL_30_1_DN', '빌트론 30T 1m x 1m 고급형 비접착'], ['BL_40_1_DN', '빌트론 40T 1m x 1m 고급형 비접착'], ['BL_50_1_DN', '빌트론 50T 1m x 1m 고급형 비접착'],
  ] },
  { productId: '1671441485', shipping: 0, codes: [
    ['BL_5_10_SN', '빌트론 5T 1m x 10m 일반형 비접착'], ['BL_5_10_DN', '빌트론 5T 1m x 10m 고급형 비접착'],
    ['BL_5_10_SA', '빌트론 5T 1m x 10m 일반형 한쪽접착'], ['BL_5_10_DA', '빌트론 5T 1m x 10m 고급형 한쪽접착'],
    ['BL_6_10_SN', '빌트론 6T 1m x 10m 일반형 비접착'], ['BL_6_10_DN', '빌트론 6T 1m x 10m 고급형 비접착'],
    ['BL_6_10_SA', '빌트론 6T 1m x 10m 일반형 한쪽접착'], ['BL_6_10_DA', '빌트론 6T 1m x 10m 고급형 한쪽접착'],
    ['BL_10_10_SN', '빌트론 10T 1m x 10m 일반형 비접착'], ['BL_10_10_DN', '빌트론 10T 1m x 10m 고급형 비접착'],
    ['BL_10_10_SA', '빌트론 10T 1m x 10m 일반형 한쪽접착'], ['BL_10_10_DA', '빌트론 10T 1m x 10m 고급형 한쪽접착'],
    ['BL_13_10_DN', '빌트론 13T 1m x 10m 고급형 비접착'], ['BL_13_10_DA', '빌트론 13T 1m x 10m 고급형 한쪽접착'],
  ] },
];
(function addReflective11stProducts() {
  const config = HK_CHANNEL_CONFIG['11st'];
  HK_REFLECTIVE_11ST_GROUPS.forEach(group => {
    const items = group.codes.map(([code, name]) => {
      const item = { productCode: code, productName: name, hkdShipping: group.shipping };
      item.prevPrice = _hkEsmPriceParts('hk_reflective', code, config, item)?.finalPrice ?? 0;
      return item;
    });
    HK_CHANNEL_LISTINGS['11st'].push({ categoryId: 'hk_reflective', productId: group.productId, items });
  });
})();
