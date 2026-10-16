/* ═══════════════════════════════════════
   한국단열 경쟁사 가격 비교 — 카테고리 탭 '경쟁사 가격' (2026-10-13)

   한국단열 스마트스토어(hkd) 판매가를 경쟁사와 "장당 실구매가"(배송비까지 더한 장당 값)로 비교한다.
   예전에 엑셀로 맞추던 비교표(아이소핑크 900×1800 · 600×900)를 화면으로 옮긴 것이다.

   · 한국단열 줄 = 단가표의 현재 값(_hkChannelHkdPrice + hkd 채널 배송비)을 그대로 읽는다 — 저장하지 않는다.
   · 경쟁사 줄 = 사람이 입력한 값. hk_settings 의 key 'competitor_compare' 한 줄(JSON)에 저장한다(SQL 변경 없음).
     이 탭의 [저장]으로만 저장되고, 단가표 저장·이력과는 무관하다.
   · [수집값 불러오기] = 크롬 확장이 모은 경쟁사 옵션 가격(competitor_price_scans, 에너가드 경쟁사 수집과 같은 테이블)을
     업체명(store_name)·두께·규격·장수로 짝지어 판매가를 채운다. 배송비·배송기준은 수집되지 않아 직접 입력한다.

   계산(엑셀과 같다):
     배송비/건   = 배송비 ÷ 배송기준(N개마다)
     장당 단가   = 판매가 ÷ 장수
     장당 실구매가 = (판매가 + 배송비/건) ÷ 장수 × 규격환산(한국단열 규격 면적 ÷ 그 상품 규격 면적 — 600x450은 600x900의 절반이라 ×2)
     차이        = 경쟁사 장당 실구매가 − 한국단열 장당 실구매가 (+ 이면 경쟁사가 더 비싸 우리에게 유리)
═══════════════════════════════════════ */
(function () {
  if (typeof HK_CATEGORIES === 'undefined') return;
  // 이 파일을 불러온 화면(단가표, 단가표 보기 전용 pricing-view.html)에서 각 카테고리(아이소핑크·열반사단열재) 맨 위에 경쟁사 가격 구역이 생긴다.
  // 보기 전용에서는 viewOnly()로 수집·편집·저장 버튼을 빼고 보기만 하게 한다.

  const SETTING_KEY = 'competitor_compare';
  // 사용자 결정(2026-10-14): 경쟁사 가격은 화면에서 직접 고치지 않고 확장 수집값을 [수집값 불러오기]로만 반영한다.
  // 입력칸·줄/업체 추가·삭제 버튼은 이 값이 true일 때만 나온다(편집 코드는 그대로 남겨 두었다).
  const EDITABLE = false;
  // 업체(열) 추가·삭제는 가격 편집과 별개로 켜 둔다(사용자 지시 2026-10-14) — 열반사 비교표 머리글의 [+]·[×].
  const COMPANY_EDITABLE = true;

  /* 비교표 정의 — ours: [두께, 한국단열 상품코드, 그 묶음의 장수]. 한국단열 줄은 이 코드의 현재 판매가·배송비로 계산한다.
     900×1800은 모음전(배송비 포함 묶음) 기준이고 70T·100T는 1장 단품이라 배송비를 따로 받는다. */
  const TABLES = [
    {
      // ownThicknessVendors: 상품 페이지마다 다른 두께의 묶음 옵션을 끼워 넣는 업체(나라단열 — 100T 상품에 20·30·40·50T 묶음이 같이 있음).
      // 이 업체는 상품 제목의 두께와 같은 두께의 옵션만 쓴다(사용자 확인 2026-10-15, 끼어든 옵션 가격이 어긋남: 40T 2장 40,000 > 18,000×2).
      id: 'iso_900_1800', kind: 'sheet', categoryId: 'hk_isopink', size: '900x1800', ownThicknessVendors: ['나라단열'], exactSizeOnly: true,
      title: '아이소핑크 경쟁사 가격 비교표 – 900×1800',
      keyword: /아이소|아이스핑크|압출|XPS/i,
      ours: [
        [10, 'Iso_900_1800_10_10', 10], [20, 'Iso_900_1800_20_5', 5], [30, 'Iso_900_1800_30_3', 3], [40, 'Iso_900_1800_40_2', 2],
        [50, 'Iso_900_1800_50_2', 2], [70, 'Iso_900_1800_70_1', 1], [100, 'Iso_900_1800_100_1', 1],
      ],
    },
    {
      id: 'iso_600_900', kind: 'sheet', categoryId: 'hk_isopink', size: '600x900', ownThicknessVendors: ['나라단열'],
      title: '아이소핑크 경쟁사 가격 비교표 – 600×900',
      keyword: /아이소|아이스핑크|압출|XPS/i,
      ours: [
        [10, 'Iso_600_900_10_3', 3], [20, 'Iso_600_900_20_1', 1], [30, 'Iso_600_900_30_1', 1], [40, 'Iso_600_900_40_1', 1],
        [50, 'Iso_600_900_50_1', 1], [70, 'Iso_600_900_70_1', 1], [100, 'Iso_600_900_100_1', 1],
      ],
    },
    // 스티로폼(St_)·네오폴(Neo_) — 아이소핑크와 같은 구조(2026-10-15). 한국단열 줄 = 단가표의 현재 값(_hkChannelHkdPrice, 카테고리 hk_bead).
    // 같은 크기만 비교한다(exactSizeOnly). 100T 600×900은 한국단열이 1장(St_600_900_100_1)과 2장(…_100_2) 둘 다 판다.
    {
      id: 'st_900_1800', kind: 'sheet', categoryId: 'hk_bead', size: '900x1800', exactSizeOnly: true, ownThicknessVendors: ['나라단열'], codePrefixes: ['St', 'SSt'], gradeFilter: 3, chip: '스티로폼 900×1800',
      title: '스티로폼 경쟁사 가격 비교표 – 900×1800',
      keyword: /스티로폼|비드법|EPS/i,
      ours: [
        [10, 'St_900_1800_10_10', 10],
        [20, 'St_900_1800_20_7', 7],
        [30, 'St_900_1800_30_5', 5],
        [40, 'St_900_1800_40_3', 3],
        [50, 'St_900_1800_50_3', 3],
        [100, 'St_900_1800_100_1', 1],
        [200, 'St_900_1800_200_1', 1],
        [300, 'St_900_1800_300_1', 1],
        [400, 'St_900_1800_400_1', 1],
        [500, 'St_900_1800_500_1', 1],
        [600, 'St_900_1800_600_1', 1],
      ],
    },
    {
      id: 'st_600_900', kind: 'sheet', categoryId: 'hk_bead', size: '600x900', exactSizeOnly: true, ownThicknessVendors: ['나라단열'], codePrefixes: ['St', 'SSt'], gradeFilter: 3, chip: '스티로폼 600×900',
      title: '스티로폼 경쟁사 가격 비교표 – 600×900',
      keyword: /스티로폼|비드법|EPS/i,
      ours: [
        [10, 'St_600_900_10_5', 5],
        [20, 'St_600_900_20_2', 2],
        [30, 'St_600_900_30_1', 1],
        [40, 'St_600_900_40_1', 1],
        [50, 'St_600_900_50_1', 1],
        [100, 'St_600_900_100_1', 1],
        [100, 'St_600_900_100_2', 2],
        [200, 'St_600_900_200_1', 1],
        [300, 'St_600_900_300_1', 1],
        [400, 'St_600_900_400_1', 1],
        [500, 'St_600_900_500_1', 1],
        [600, 'St_600_900_600_1', 1],
      ],
    },
    {
      id: 'neo_900_1800', kind: 'sheet', categoryId: 'hk_bead', size: '900x1800', exactSizeOnly: true, ownThicknessVendors: ['나라단열'], codePrefixes: ['Neo'], gradeFilter: 2, chip: '네오폴 900×1800',
      title: '네오폴 경쟁사 가격 비교표 – 900×1800',
      keyword: /네오폴|그라파이트/i,
      ours: [
        [30, 'Neo_900_1800_30_5', 5],
        [50, 'Neo_900_1800_50_3', 3],
        [100, 'Neo_900_1800_100_1', 1],
        [200, 'Neo_900_1800_200_1', 1],
        [300, 'Neo_900_1800_300_1', 1],
        [400, 'Neo_900_1800_400_1', 1],
        [500, 'Neo_900_1800_500_1', 1],
        [600, 'Neo_900_1800_600_1', 1],
      ],
    },
    {
      id: 'neo_600_900', kind: 'sheet', categoryId: 'hk_bead', size: '600x900', exactSizeOnly: true, ownThicknessVendors: ['나라단열'], codePrefixes: ['Neo'], gradeFilter: 2, chip: '네오폴 600×900',
      title: '네오폴 경쟁사 가격 비교표 – 600×900',
      keyword: /네오폴|그라파이트/i,
      ours: [
        [30, 'Neo_600_900_30_2', 2],
        [50, 'Neo_600_900_50_1', 1],
        [100, 'Neo_600_900_100_1', 1],
        [200, 'Neo_600_900_200_1', 1],
        [300, 'Neo_600_900_300_1', 1],
        [400, 'Neo_600_900_400_1', 1],
        [500, 'Neo_600_900_500_1', 1],
        [600, 'Neo_600_900_600_1', 1],
      ],
    },
    {
      // 열반사단열재 — 같은 길이·같은 두께끼리 "두께 × 제품 옵션"별 판매가를 비교한다(kind:'unit'). 길이 1·5·10·20·25·50M를 탭으로 고른다.
      // 옵션 키는 빌트론 상품코드(BL_{두께}_{길이}_{SN|SA|DN|DA})의 끝 두 글자와 같다 — S 일반형·D 고급형, N 비접착·A 한쪽접착.
      // id는 처음 1M만 만들 때의 'refl_1m'을 그대로 둔다(저장된 자료와 이어지게). 길이는 줄의 len 값(없으면 1)이다.
      id: 'refl_1m', kind: 'unit', categoryId: 'hk_reflective', unitLabel: 'M',
      title: '열반사단열재 경쟁사 가격 비교표',
      lengths: [1, 5, 10, 20, 25, 50],
      keyword: /열반사|알루미늄|은박|빌트론|열 반사|단열\s*롤/i,
      thicknesses: [5, 6, 10, 13],
      options: [
        { key: 'SN', label: '일반 비접착' }, { key: 'SA', label: '일반 접착' },
        { key: 'DN', label: '고급 비접착' }, { key: 'DA', label: '고급 접착' },
      ],
      codeOf: (t, opt, len = 1) => `BL_${t}_${len}_${opt}`,
    },
    {
      // 단열벽지(2026-10-14) — 길이 2.3M·10M·20M. 경쟁사는 두께·등급 구분 없이 길이마다 가격 하나(무늬만 다름)라서, 업체·길이별 판매 중 최저가를
      // 대표값으로 잡아 한국단열 4종(고급형1·고급형2·이중화이트·실크형, 전부 5T) 줄에 같이 넣는다(shared: true). 무늬로 상품을 짝짓지 않는다.
      // 경쟁사는 보통 2.5M를 팔고 우리만 2.3M라서 경쟁사 2.5M는 2.3M 칸으로 본다(lengthAlias). 한국단열 줄 코드 = WP_{상품}_5_{길이코드}.
      id: 'wp_roll', kind: 'unit', shared: true, categoryId: 'hk_wallpaper', unitLabel: 'M',
      title: '단열벽지 경쟁사 가격 비교표',
      oursLabel: '한국단열',
      lengths: [2.3, 10, 20],
      lengthAlias: { 2.5: 2.3 },
      lengthNote: { 2.3: '경쟁사 2.5M' },
      keyword: /단열\s*벽지|접착식\s*벽지|폼블럭/i,
      thicknesses: [5],
      options: [
        { key: 'P1', label: '고급형1' }, { key: 'P2', label: '고급형2' },
        { key: 'DW', label: '이중화이트' }, { key: 'SK', label: '실크형' },
      ],
      codeOf: (t, opt, len = 10) => `WP_${opt}_${t}_${len === 2.3 ? '23' : len}`,
    },
    {
      // 기타단열재 — 난방필름단열재(우리 '필름난방보온재 5T 가교', HF_5_{1|25|50}). 경쟁사 옵션 형식을 아직 못 봐서 단열벽지와 같은 방식(업체·길이별
      // 판매 중 최저가를 대표값으로, 5T가 아니면 제외)으로 시작한다 — 첫 수집 결과(옵션 해석 불가 등)를 보고 다듬는다.
      id: 'etc_film', chip: '난방필름', kind: 'unit', shared: true, categoryId: 'hk_etc', unitLabel: 'M',
      title: '난방필름단열재 경쟁사 가격 비교표',
      oursLabel: '한국단열',
      lengths: [1, 25, 50],
      lengthPick: 'max', // 폭×길이 표기("폭1.2M x 50M")나 "50M(폭1M)"에서 폭 대신 길이를 고르려고 가장 큰 값을 쓴다
      nameLengthOnlyIfNoLabel: true, // 옵션에 길이가 없으면 건너뜀(구구난방의 전선몰딩·연선 같은 부자재가 1M로 잡힌 문제)
      thicknessAlias: { 4: 5 }, // 사용자 확인(2026-10-14): 와우비전 '4T 25M(이지웜/비점착)'은 4T로 적혀 있지만 사실상 5T
      skipLabel: /테이프|부자재|스프레이|본드|벽지|열반사|아이소핑크|스티로폼|동박/,
      keyword: /난방|필름|발열|열선/i,
      thicknesses: [5],
      options: [{ key: 'F', label: '필름난방보온재(5T 가교)' }],
      codeOf: (t, opt, len = 1) => `HF_${t}_${len}`,
    },
    {
      // 캠핑단열재(우리 '캠핑용단열재 5T 가교', CP_5_1) — 1M만 있다.
      id: 'etc_camp', chip: '캠핑단열재', kind: 'unit', shared: true, categoryId: 'hk_etc', unitLabel: 'M',
      title: '캠핑단열재 경쟁사 가격 비교표',
      oursLabel: '한국단열',
      lengths: [1],
      lengthPick: 'max',
      nameLengthOnlyIfNoLabel: true,
      skipLabel: /테이프|부자재|스프레이|본드|벽지|열반사|아이소핑크|스티로폼|동박/,
      keyword: /캠핑|차박|텐트|매트/i,
      thicknesses: [5],
      options: [{ key: 'C', label: '캠핑용단열재(5T 가교)' }],
      codeOf: (t, opt, len = 1) => `CP_${t}_${len}`,
    },
  ];

  /* DB에 저장된 값이 아직 없을 때 채워 두는 예전 비교표 값 — [업체, 두께, 규격, 장수, 판매가, 배송비, 배송기준, 확인일].
     단열코리아는 2026-10-13에 확장 수집·상품 목록으로 다시 확인했고, 나머지 업체는 예전 표 그대로라 확인일이 비어 있다. */
  const SEED = {
    iso_900_1800: [
      ['나라단열', 10, '900x1800', 1, 5000, 12500, 10, ''], ['단열코리아', 10, '900x1800', 5, 25000, 11000, 1, '2026-10-13'],
      ['나라단열', 20, '900x1800', 1, 9000, 8800, 4, ''], ['단열코리아', 20, '900x1800', 3, 31500, 11000, 1, '2026-10-13'],
      ['나라단열', 30, '900x1800', 1, 13600, 8800, 3, ''], ['단열코리아', 30, '900x1800', 2, 28000, 11000, 1, '2026-10-13'],
      ['나라단열', 40, '900x1800', 1, 18000, 12500, 4, ''],
      ['나라단열', 50, '900x1800', 1, 23000, 12500, 3, ''], ['단열코리아', 50, '900x1800', 1, 23000, 11000, 1, '2026-10-13'],
      ['나라단열', 70, '900x1800', 1, 34000, 12500, 4, ''], ['단열코리아', 70, '900x1800', 1, 38000, 11000, 1, '2026-10-13'],
      ['나라단열', 100, '900x1800', 1, 43000, 12500, 2, ''], ['단열코리아', 100, '900x1800', 1, 49000, 11000, 1, '2026-10-13'],
    ],
    iso_600_900: [
      ['극동씨앤씨', 10, '600x450', 3, 2400, 6000, 8, ''], ['단열코리아', 10, '600x900', 3, 6900, 5500, 5, '2026-10-13'],
      ['극동씨앤씨', 20, '600x450', 2, 5000, 6000, 5, ''], ['나라단열', 20, '600x900', 1, 3500, 5500, 10, ''], ['단열코리아', 20, '600x900', 1, 4400, 5500, 5, '2026-10-13'],
      ['극동씨앤씨', 30, '600x900', 1, 6000, 6000, 5, ''], ['나라단열', 30, '600x900', 1, 5000, 5500, 7, ''], ['단열코리아', 30, '600x900', 1, 6000, 5500, 5, '2026-10-13'],
      ['나라단열', 40, '600x900', 1, 6000, 5500, 5, ''],
      ['극동씨앤씨', 50, '600x900', 1, 10000, 6000, 3, ''], ['나라단열', 50, '600x900', 1, 7500, 5500, 4, ''], ['단열코리아', 50, '600x900', 1, 10100, 5500, 5, '2026-10-13'],
      ['단열코리아', 70, '600x900', 1, 14700, 5500, 5, '2026-10-13'], ['나라단열', 70, '600x900', 1, 11000, 5500, 3, ''], ['극동씨앤씨', 70, '600x900', 1, 16000, 6000, 3, ''],
      ['극동씨앤씨', 100, '600x900', 1, 19500, 6000, 3, ''], ['나라단열', 100, '600x900', 1, 15000, 5500, 2, ''], ['단열코리아', 100, '600x900', 1, 21000, 5500, 5, '2026-10-13'],
    ],
  };

  /* 열반사 1M — [업체, 두께, 옵션, 1M 판매가, 확인일]. 사용자가 준 표(2026-10-14) 그대로이고 확인일은 아직 모른다. */
  SEED.refl_1m = [
    ['배관공구마켓', 5, 'SN', 2800, ''], ['낭만홈즈', 5, 'SN', 2700, ''], ['메가론', 5, 'SN', 2600, ''],
    ['배관공구마켓', 5, 'SA', 3100, ''], ['낭만홈즈', 5, 'SA', 4000, ''], ['메가론', 5, 'SA', 3500, ''],
    ['메가론', 5, 'DN', 3000, ''], ['메가론', 5, 'DA', 3900, ''],
    ['메가론', 6, 'SN', 3300, ''], ['메가론', 6, 'SA', 4300, ''], ['메가론', 6, 'DN', 3900, ''],
    ['낭만홈즈', 6, 'DA', 5900, ''], ['메가론', 6, 'DA', 4900, ''],
    ['배관공구마켓', 10, 'SN', 5700, ''], ['메가론', 10, 'SN', 4400, ''],
    ['배관공구마켓', 10, 'SA', 7600, ''], ['메가론', 10, 'SA', 5400, ''],
    ['메가론', 10, 'DN', 4700, ''], ['낭만홈즈', 10, 'DA', 7000, ''], ['메가론', 10, 'DA', 5700, ''],
    ['메가론', 13, 'DN', 6200, ''], ['메가론', 13, 'DA', 7100, ''],
  ];

  /* 업체별 비교 상품 주소(스마트스토어 상품 페이지) — 업체 열 머리글에 링크로 보이고, 가격 수집은 이 주소를 연다. 사용자가 준 열반사 1M 주소. */
  const SEED_LINKS = {
    refl_1m: {
      '배관공구마켓': 'https://smartstore.naver.com/bgggmarket/products/9630995046',
      '메가론': 'https://smartstore.naver.com/firestop/products/4828083317',
      '낭만홈즈': 'https://smartstore.naver.com/romancehomes/products/5835171089',
    },
  };

  /* 업체별 배송비 — 확장으로는 수집되지 않아 직접 입력한다(사용자가 준 값, 2026-10-14). fee = 배송비(원), every = N개마다 1회(비우면 1).
     '__ours'는 한국단열(빌트론) 쪽 값이다. 열반사 1M 비교에서 [배송비 포함 비교]를 켜면 1M당 가격 = 판매가 + 배송비 ÷ N개 로 비교한다. */
  const OURS_SHIP_KEY = '__ours';
  const SEED_SHIPPING = {
    refl_1m: {
      '배관공구마켓': { fee: 4000, every: 1 },
      '낭만홈즈': { fee: 4000, every: 10 },
      '메가론': { fee: 4000, every: 5 },
      [OURS_SHIP_KEY]: { fee: 4300, every: 5 },
    },
  };

  // focus = 주목할 업체(표마다 이름 목록) — [편집]에서 ★로 정한다. 가격을 맞출 기준이 되는 업체라 열을 강조하고 '그 업체 대비' 차이를 따로 보여 준다.
  const state = { rows: {}, loaded: false, loading: false, dirty: false, saving: false, savedAt: null, note: '', noteKind: '', nextId: 1, links: seedLinks(), shipping: JSON.parse(JSON.stringify(SEED_SHIPPING)), focus: {}, optionMap: {}, exclude: {} };
  const focusOf = table => (state.focus[table.id] || []);
  /* 제외한 옵션 — (업체, 두께, 묶음 장수)를 표에서 빼고 수집·수집값 불러오기에서도 거른다(같은 업체가 한 두께에 상품을 둘 파는데
     하나만 비교하고 싶을 때, 예: 단열코리아 600×900 100T 2장 묶음). state.exclude[표id] = ['업체|두께|장수', …]. */
  const excludeKey = (comp, t, sheets) => `${comp}|${Number(t)}|${num(sheets) || 1}`;
  const isExcluded = (table, comp, t, sheets) => ((state.exclude[table.id] || []).includes(excludeKey(comp, t, sheets)));

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const num = value => {
    if (value === '' || value == null) return null;
    const n = parseFloat(String(value).replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  };
  const fmt = value => (value == null || !Number.isFinite(value)) ? '—' : Math.round(value).toLocaleString('ko-KR');
  const client = () => (typeof supabaseClient !== 'undefined' ? supabaseClient : null);
  const toast = (message, type) => { if (typeof showToast === 'function') showToast(message, type); else console.warn('[경쟁사 가격]', message); };
  const today = () => new Date().toISOString().slice(0, 10);
  const tableOf = id => TABLES.find(t => t.id === id);
  // 보기 전용(pricing-view.html — 로그인 없이 링크로 보는 화면, 관리자가 아닌 사용자)에서는 보기·탭 전환·배송비 포함 토글만 되고
  // 수집·편집·업체 추가/삭제·저장 버튼은 나오지 않으며 해당 함수도 실행되지 않는다(익명 키로 저장하지 못하게 이중으로 막음).
  const viewOnly = () => !(window.currentUser && window.currentUser.role === 'admin');

  /* "900x1800"·"900 x 1800"·"900×1800" 같은 규격 글자의 면적(㎟). 읽히지 않으면 null. */
  function areaOf(text) {
    const m = String(text || '').match(/(\d{3,4})\s*[x×X*]\s*(\d{3,4})/);
    return m ? Number(m[1]) * Number(m[2]) : null;
  }

  function seedTableRows(table) {
    if (table.kind === 'unit') {
      return (SEED[table.id] || []).map(([comp, t, opt, price, checked]) => ({ id: state.nextId++, comp, t, opt, price, link: '', checked }));
    }
    return (SEED[table.id] || []).map(([comp, t, spec, sheets, price, ship, every, checked]) =>
      ({ id: state.nextId++, comp, t, spec, sheets, price, ship, every, link: '', checked }));
  }

  function seedLinks() {
    return JSON.parse(JSON.stringify(SEED_LINKS));
  }

  function seedRows() {
    const rows = {};
    TABLES.forEach(table => { rows[table.id] = seedTableRows(table); });
    return rows;
  }

  /* ─── 한국단열 줄: 단가표의 현재 값 ─── */
  function shippingInfo(code) {
    // 같은 코드가 상품 여러 개에 들어 있을 수 있다(스티로폼 St_600_900_30_1은 437331834 6,500원 / 3505478787·7875494911 6,000원).
    // 손님은 더 싼 쪽에서 살 수 있으니 한 개당 배송비(배송비 ÷ N개마다)가 가장 낮은 상품의 값을 쓴다.
    const perOf = p => {
      const m = String(p.shippingBasis || '').match(/(\d+)\s*개마다/);
      return Number(p.baseShipping || 0) / (m ? Number(m[1]) : 1);
    };
    const product = (typeof HK_CHANNEL_LISTINGS !== 'undefined' ? (HK_CHANNEL_LISTINGS.hkd || []) : [])
      .filter(p => (p.items || []).some(item => item.productCode === code))
      .reduce((best, p) => (!best || perOf(p) < perOf(best) ? p : best), null);
    if (product) {
      const ship = Number(product.baseShipping || 0);
      const m = String(product.shippingBasis || '').match(/(\d+)\s*개마다/);
      return { ship, every: m ? Number(m[1]) : 1 };
    }
    const ship = typeof _hkHkdShippingByCode === 'function' ? _hkHkdShippingByCode(code) : null;
    return { ship: Number(ship || 0), every: 5 }; // 2단계 배송 블록은 5장당
  }

  /* 한국단열 스마트스토어의 옵션 구성(2026-10-14, 사용자 요청 '한국단열도 옵션가 스토어 형태로') — 두께 t의 묶음 장수별 등록 상품.
     코드 규칙 Iso_{가로}_{세로}_{두께}_{장수}(70T·100T 무료배송 묶음 상품은 IIso_). 예: 5695312387(900×1800 묶음·무료배송)의 10T 10장,
     8324406068 같은 1장 단품(유료배송 N개마다). 가격이 있는 코드만 옵션이 된다. per = 장당 실구매가(배송비 포함). */
  function ourOptionsOf(table, t) {
    const sz = String(table.size || '').replace(/[x×X*]/, '_');
    const sheetSet = new Set([1]);
    (table.ours || []).filter(d => d[0] === Number(t)).forEach(d => sheetSet.add(d[2])); // 같은 두께에 묶음이 둘 이상인 표(스티로폼 600×900 100T)
    (state.rows[table.id] || []).filter(r => Number(r.t) === Number(t) && num(r.price)).forEach(r => sheetSet.add(num(r.sheets) || 1));
    const out = [];
    [...sheetSet].sort((a, b) => a - b).forEach(sheets => (table.codePrefixes || ['Iso', 'IIso']).forEach(prefix => {
      const code = `${prefix}_${sz}_${t}_${sheets}`;
      let price = null;
      try { price = _hkChannelHkdPrice(table.categoryId, code); } catch (e) { price = null; }
      price = Number(price);
      if (!Number.isFinite(price) || price <= 0) return;
      const { ship, every } = shippingInfo(code);
      out.push({ code, sheets, price, ship, every, per: (price + perItemShip(ship, every)) / sheets });
    }));
    return out;
  }

  function oursOf(table, [t, code, sheets]) {
    let price = null;
    try { price = _hkChannelHkdPrice(table.categoryId, code); } catch (e) { price = null; }
    const { ship, every } = shippingInfo(code);
    return { t, code, sheets, price, ship, every, spec: table.size };
  }

  /* 업체 상품 주소 — 두께·규격마다 상품이 다른 업체가 있어 여러 개일 수 있다. 저장값은 문자열(예전) 또는 배열이다. */
  const asList = v => (Array.isArray(v) ? v : (v ? [v] : [])).map(x => String(x).trim()).filter(Boolean);
  /* 길이마다 표는 서로 독립이다(업체 종류도, 판매 상품도, 상품 주소도 길이마다 다를 수 있다). 주소 키: '업체'(= 1M), '업체@5'(= 5M) …
     길이 사이에 주소를 물려받지 않는다. 주소가 따로 적혀 있지 않으면 그 길이 칸이 읽힌 상품 페이지(줄의 link)를 보여 준다. */
  function companyLinks(table, name, len = 1) {
    const specific = asList((state.links[table.id] || {})[len > 1 ? `${name}@${len}` : name]);
    if (specific.length) return specific;
    // 따로 적힌 주소가 없으면, 그 길이 칸들이 읽힌 상품 페이지(두께마다 상품이 다른 업체는 여러 개)를 중복 없이 보여 준다
    return [...new Set((state.rows[table.id] || []).filter(r => r.comp === name && r.link && (Number(r.len) || 1) === len).map(r => r.link))];
  }

  /* 비교표 칸을 눌러 상품 페이지로 간다 — 그 줄에 상품 주소(link)가 있으면 그 페이지, 없으면 그 업체에 등록된 상품 주소(하나면 바로,
     두께마다 상품이 다른 업체처럼 여러 개면 목록 팝업). 주소가 하나도 없으면 링크 없이 값만 보인다. ci는 matrixComps[표] 안의 업체 순서. */
  function cellLink(table, name, ci, row, inner, len = 1) {
    const direct = row && row.link ? String(row.link) : '';
    const urls = direct ? [direct] : companyLinks(table, name, len);
    if (urls.length === 1) {
      return `<a href="${esc(urls[0])}" target="_blank" rel="noopener" title="${direct ? '이 가격이 나온 상품 페이지 열기' : `${esc(name)} 상품 페이지 열기`}" style="text-decoration:none;color:inherit;">${inner}</a>`;
    }
    if (urls.length > 1) {
      return `<span role="button" tabindex="0" onclick="hkCmpShowLinks(event,'${table.id}',${ci})" title="${esc(name)} 상품 페이지 ${urls.length}개 — 눌러서 목록 보기" style="cursor:pointer;">${inner}</span>`;
    }
    return inner;
  }

  /* 길이(M) — 줄에 len이 없으면 1M(처음 1M만 만들 때 저장된 줄). */
  const rowLen = r => Number(r.len) || 1;
  const shipKey = (name, len) => (Number(len) > 1 ? `${name}@${len}` : name);
  /* 길이 표시 — 경쟁사와 길이 표기가 다른 칸(단열벽지 2.3M = 경쟁사 2.5M)은 괄호로 알려 준다. */
  const lenText = (table, len) => `${len}M${table.lengthNote && table.lengthNote[len] ? ` (${table.lengthNote[len]})` : ''}`;

  /* 열반사(unit) 한국단열 줄 — 단가표의 (두께, 옵션, 길이) 실판매가. 우리가 안 파는 조합(13T 일반형, 13T 25M 등)은 price가 null이다.
     롤 원품 코드(…_R, 예: BL_6_25_SN_R)가 있으면 그 롤을 먼저 쓴다 — 경쟁사의 "1롤"과 맞는 건 이쪽이다. */
  function unitOurs(table, t, opt, len = 1) {
    const base = table.codeOf(t, opt, len);
    for (const code of [`${base}_R`, base]) {
      let price = null;
      try { price = _hkChannelHkdPrice(table.categoryId, code); } catch (e) { price = null; }
      price = Number(price);
      if (Number.isFinite(price) && price > 0) return { code, price };
    }
    return { code: base, price: null };
  }

  /* 비교 값 — 한국단열 줄·경쟁사 줄 모두 sheet 표는 장당 실구매가, unit 표는 1M 판매가. */
  function oursValue(table, t, optOrUndefined, len = 1) {
    if (table.kind === 'unit') return unitOurs(table, t, optOrUndefined, len).price;
    const def = table.ours.find(d => d[0] === Number(t));
    if (!def) return null;
    // 스토어에 등록된 옵션(묶음·단품) 중 장당 실구매가가 가장 싼 값 — 경쟁사도 업체별 최저 옵션으로 비교하므로 같은 기준이다.
    const opts = ourOptionsOf(table, Number(t));
    if (opts.length) return Math.min(...opts.map(o => o.per));
    const o = oursOf(table, def);
    return o.price == null ? null : (o.price + perItemShip(o.ship, o.every)) / o.sheets;
  }

  /* 비교용 배송 기준 — 5개를 샀을 때의 개당 총액으로 맞춘다(사용자 결정 2026-10-15, 우리 상품의 5개마다와 같은 기준).
     개당 배송비 = 배송비 × ceil(5 ÷ N) ÷ 5 — 10개마다는 1번(÷5), 3개마다는 2번(×2÷5), 1개마다는 5번(개당 그대로).
     아래 everyForCompare는 이 식을 '배송비 ÷ everyForCompare'로 쓰도록 바꾼 값이다. 입력·표시는 업체가 적은 그대로. */
  const COMPARE_EVERY = 5;
  const everyForCompare = r => { const n = num(r.every) || 1; return COMPARE_EVERY / Math.ceil(COMPARE_EVERY / n); };
  const perItemShip = (ship, every) => (Number(ship) || 0) * Math.ceil(COMPARE_EVERY / (Number(every) || 1)) / COMPARE_EVERY; // 한국단열 쪽 계산용(같은 규칙)

  function derive(table, row) {
    const price = num(row.price), sheets = num(row.sheets);
    if (!price || !sheets) return null;
    const ship = num(row.ship), every = everyForCompare(row);
    const shipPer = ship == null ? null : ship / every;
    const tableArea = areaOf(table.size), area = areaOf(row.spec);
    const ratio = tableArea && area ? tableArea / area : 1;
    return { perSheet: price / sheets, shipPer, real: shipPer == null ? null : (price + shipPer) / sheets * ratio };
  }

  /* 차이 배지 — 단가표 공용 마진율 배지(.pricing-rate-badge)를 그대로 쓴다. 경쟁사가 더 비싸면(+) 유리(초록), 더 싸면(−) 불리(빨강). */
  function diffHtml(real, oursReal) {
    if (real == null || oursReal == null) return '<span style="color:#cbd5e1;">—</span>';
    const d = Math.round(real - oursReal);
    if (d === 0) return '<span class="pricing-rate-badge mid">±0</span>';
    return `<span class="pricing-rate-badge ${d > 0 ? 'good' : 'low'}">${d > 0 ? '+' : ''}${d.toLocaleString('ko-KR')} ${d > 0 ? '유리' : '불리'}</span>`;
  }

  /* ─── 화면 — 단가표 공용 부품(결과 카드 .pricing-result-card · 서브탭 .bead-subtab · 표 .pricing-table · 입력칸 .pricing-input-field ·
     배지 .pricing-rate-badge)을 그대로 써서 기존 아이소핑크·열반사 표와 같은 모양으로 보이게 한다. ─── */
  const TH_SHEET = [['두께', 6], ['구분', 10], ['규격', 8], ['상품코드·링크', 11], ['장수', 5], ['판매가', 8], ['배송비', 8], ['배송기준', 6],
    ['장당 단가', 7], ['배송비/건', 7], ['장당 실구매가', 8], ['한국단열<br>장당 실구매가', 9], ['차이<br>경쟁사−한국단열', 9], ['확인일', 8], ['', 4]];
  // 한국단열 줄은 배경(옅은 인디고)만 다르고 글자 크기·굵기·색은 다른 칸과 같다(사용자 지시 2026-10-14).

  /* 단가표 공용 표(.pricing-table)는 칸 여백이 넉넉해 입력칸이 많은 이 표는 칸이 좁아진다 — 칸 여백만 줄인다. */
  function compact(html) {
    return html.replace(/<(td|th)([^>]*)>/g, (m, tag, attrs) => {
      const base = tag === 'td' ? 'padding:12px 6px;background:#fff;' : 'padding:12px 6px;';
      return attrs.includes('style="') ? `<${tag}${attrs.replace('style="', `style="${base}`)}>` : `<${tag}${attrs} style="${base}">`;
    });
  }

  /* 두께 묶음 구분 — 공용 표의 줄무늬·마우스 오버는 줄 단위라 두께 칸(rowspan)을 어긋나게 칠해서 쓰지 않는다. 대신 두께 묶음마다
     옅은 배경을 번갈아 주고 묶음 첫 줄 위에 굵은 선을 둔다. gi = 묶음 순서. */
  function styleGroup(html, gi) {
    const tint = gi % 2 ? '#f8fafc' : '#fff';
    let first = true;
    return html.replace(/<tr([^>]*)>([\s\S]*?)<\/tr>/g, (m, trAttrs, inner) => {
      const top = first ? 'border-top:2px solid #cbd5e1;' : '';
      first = false;
      const cells = inner.replace(/<td([^>]*)>/g, (mm, attrs) => attrs.includes('style="')
        ? `<td${attrs.replace('style="', `style="background:${tint};${top}`)}>`
        : `<td${attrs} style="background:${tint};${top}">`);
      return `<tr${trAttrs}>${cells}</tr>`;
    });
  }

  function theadHtml(cols) {
    return `<colgroup>${cols.map(([, w]) => `<col style="width:${w}%">`).join('')}</colgroup>
      <thead><tr>${cols.map(([label]) => `<th>${label}</th>`).join('')}</tr></thead>`;
  }

  function inputHtml(table, row, field, { placeholder = '', numeric = true, align = 'right' } = {}) {
    const value = row[field] == null ? '' : row[field];
    if (!EDITABLE) return `<span style="display:block;text-align:${align};">${value === '' ? '—' : (numeric ? Number(value).toLocaleString('ko-KR') : esc(value))}</span>`;
    const shown = numeric && value !== '' ? Number(value).toLocaleString('ko-KR') : esc(value);
    return `<input type="text" class="pricing-input-field" ${numeric ? 'inputmode="numeric"' : ''} style="width:100%;height:32px;padding:0 8px;font-size:13px;text-align:${align};" value="${shown}" placeholder="${placeholder}" onchange="hkCmpEdit('${table.id}',${row.id},'${field}',this)">`;
  }

  function linkCellHtml(table, row) {
    if (!EDITABLE) {
      return row.link
        ? `<a href="${esc(row.link)}" target="_blank" rel="noopener" title="${esc(row.link)}" style="color:#4f46e5;"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
        : '<span style="color:#cbd5e1;">—</span>';
    }
    const icon = row.link
      ? `<a href="${esc(row.link)}" target="_blank" rel="noopener" title="상품 페이지" style="color:#4f46e5;"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
      : '';
    return `<div style="display:flex;align-items:center;gap:6px;"><input type="text" class="pricing-input-field" style="width:100%;height:32px;padding:0 8px;font-size:12px;font-weight:500;text-align:left;" value="${esc(row.link)}" placeholder="링크" onchange="hkCmpEdit('${table.id}',${row.id},'link',this)">${icon}</div>`;
  }

  function addButton(tableId, t, opt, title) {
    if (!EDITABLE) return '';
    return `<button type="button" class="pgl-btn" title="${esc(title)}" onclick="hkCmpAddRow('${tableId}',${t}${opt ? `,'${opt}'` : ''})"><i class="fa-solid fa-plus"></i></button>`;
  }

  function delButton(tableId, rowId) {
    if (!EDITABLE) return '';
    return `<button type="button" class="pgl-btn" title="이 줄 삭제" onclick="hkCmpDelRow('${tableId}',${rowId})"><i class="fa-solid fa-xmark"></i></button>`;
  }

  function competitorRowHtml(table, row, group, first, oursReal, listId) {
    const d = derive(table, row);
    const incomplete = num(row.price) && num(row.ship) == null;
    const id = `hkc-${row.id}`;
    return `<tr data-hkc-row="${row.id}">
      ${first ? `<td rowspan="${group}" style="text-align:center;font-weight:700;color:#4f46e5;vertical-align:top;">${row.t}T<div style="margin-top:6px;">${addButton(table.id, row.t, '', `${row.t}T 경쟁사 줄 추가`)}</div></td>` : ''}
      <td>${EDITABLE ? `<input type="text" class="pricing-input-field" list="${listId}" style="width:100%;height:32px;padding:0 8px;font-size:13px;text-align:left;" value="${esc(row.comp)}" placeholder="업체" onchange="hkCmpEdit('${table.id}',${row.id},'comp',this)">` : `<span style="display:block;text-align:left;font-weight:600;color:#334155;">${esc(row.comp) || '—'}</span>`}</td>
      <td>${inputHtml(table, row, 'spec', { placeholder: table.size, numeric: false, align: 'center' })}</td>
      <td>${linkCellHtml(table, row)}</td>
      <td>${inputHtml(table, row, 'sheets')}</td>
      <td>${inputHtml(table, row, 'price')}</td>
      <td>${inputHtml(table, row, 'ship', { placeholder: incomplete ? '입력' : '' })}</td>
      <td>${inputHtml(table, row, 'every')}</td>
      <td id="${id}-per">${fmt(d?.perSheet)}</td>
      <td id="${id}-ship">${fmt(d?.shipPer)}</td>
      <td id="${id}-real">${fmt(d?.real)}</td>
      <td>${fmt(oursReal)}</td>
      <td id="${id}-diff" style="text-align:center;">${diffHtml(d?.real, oursReal)}</td>
      <td style="text-align:center;font-size:11px;color:#94a3b8;white-space:nowrap;">${esc(row.checked || '—')}</td>
      <td style="text-align:center;">${delButton(table.id, row.id)}</td>
    </tr>`;
  }

  function tableHtml(table, listId) {
    const rows = state.rows[table.id] || [];
    const oursByT = new Map(table.ours.slice().reverse().map(def => [def[0], oursOf(table, def)]));
    const thicknesses = [...new Set([...oursByT.keys(), ...rows.map(r => Number(r.t))])].sort((a, b) => a - b);
    const body = thicknesses.map((t, gi) => {
      const ours = oursByT.get(t);
      const list = rows.filter(r => Number(r.t) === t);
      const group = 1 + list.length;
      const oursPer = ours && ours.price != null ? (ours.price + perItemShip(ours.ship, ours.every)) / ours.sheets : null;
      const oursRow = ours
        ? `<tr>
            <td rowspan="${group}" style="text-align:center;font-weight:700;color:#4f46e5;vertical-align:top;">${t}T<div style="margin-top:6px;">${addButton(table.id, t, '', `${t}T 경쟁사 줄 추가`)}</div></td>
            <td style="background:#eef2ff;text-align:left;font-weight:700;">한국단열</td>
            <td style="background:#eef2ff;text-align:center;">${esc(table.size)}×${ours.sheets}장</td>
            <td style="background:#eef2ff;text-align:left;font-size:11px;">${esc(ours.code)}</td>
            <td style="background:#eef2ff;">${ours.sheets}</td>
            <td style="background:#eef2ff;">${fmt(ours.price)}</td>
            <td style="background:#eef2ff;">${ours.ship ? fmt(ours.ship) : '무료'}</td>
            <td style="background:#eef2ff;">${ours.ship ? ours.every : '—'}</td>
            <td style="background:#eef2ff;">${fmt(ours.price == null ? null : ours.price / ours.sheets)}</td>
            <td style="background:#eef2ff;">${ours.ship ? fmt(perItemShip(ours.ship, ours.every)) : '—'}</td>
            <td style="background:#eef2ff;">${fmt(oursPer)}</td>
            <td style="background:#eef2ff;">${fmt(oursPer)}</td>
            <td style="background:#eef2ff;text-align:center;">기준</td>
            <td style="background:#eef2ff;"></td><td style="background:#eef2ff;"></td>
          </tr>`
        : '';
      const compRows = list.map((row, i) => competitorRowHtml(table, row, ours ? group : list.length, !ours && i === 0, oursPer, listId)).join('');
      return styleGroup(oursRow + compRows, gi);
    }).join('');
    return compact(`<div style="margin-top:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;">
        <div style="font-size:14px;font-weight:700;color:#1e293b;">${esc(table.title)}</div>
        <button type="button" class="pricing-margin-edit-btn" onclick="hkCmpSave()"><i class="fa-solid fa-floppy-disk"></i> 저장</button>
      </div>
      <div class="pricing-table-scroll" style="border:1px solid #e2e8f0;border-radius:10px;">
        <table class="pricing-table" style="min-width:1100px;">${theadHtml(TH_SHEET)}<tbody>${body}</tbody></table>
      </div>
    </div>`);
  }

  /* 열반사 1M 비교표 — 한눈에 보이도록 "두께 × 제품 옵션" 한 줄에 업체별 가격 칸을 가로로 놓는 표(사용자가 엑셀로 맞추던 모양).
     칸을 비우면 그 업체 가격을 지운다. 새 업체는 [+ 업체]로 열을 더한다. 링크·확인일은 칸에 마우스를 올리면 보인다. */
  const matrixComps = {}; // tableId → 그리는 순간의 업체 열 순서(칸 편집 핸들러가 인덱스로 찾는다)

  /* 길이별로 따로 두는 '가격 줄은 없지만 열은 남겨 둔' 업체 목록 — extraComps[표][길이] = [이름…]. */
  function extraList(tableId, len, create) {
    const all = state.extraComps = state.extraComps || {};
    if (Array.isArray(all[tableId])) all[tableId] = { 1: all[tableId] }; // 예전 형식(길이 구분 없음 = 1M)
    const byLen = all[tableId] = all[tableId] || {};
    return create ? (byLen[len] = byLen[len] || []) : (byLen[len] || []);
  }

  /* 그 길이에 있는 업체(가격 줄이 있거나 열만 남겨 둔 업체). */
  function matrixCompsOf(table, len = 1) {
    const names = [];
    (state.rows[table.id] || []).forEach(r => { if (r.comp && rowLen(r) === len && !names.includes(r.comp)) names.push(r.comp); });
    extraList(table.id, len).forEach(n => { if (!names.includes(n)) names.push(n); });
    return names;
  }

  /* 모든 길이를 합친 업체 이름(저장·수집 대상 계산용). */
  function matrixCompsAll(table) {
    const names = [];
    const lens = new Set([...(table.lengths || [1]), ...(state.rows[table.id] || []).map(rowLen)]);
    [...lens].sort((a, b) => a - b).forEach(len => matrixCompsOf(table, len).forEach(n => { if (!names.includes(n)) names.push(n); }));
    return names;
  }

  /* 배송비 — fee ÷ every(N개마다). 입력이 없으면 null(상품가만 비교). */
  function shipPerUnit(table, key) {
    const v = (state.shipping[table.id] || {})[key] || {};
    const fee = num(v.fee);
    return fee == null ? null : perItemShip(fee, v.every); // 5개를 샀을 때의 개당 배송비(아이소·스티로폼과 같은 기준)
  }

  function withShipOn(table) { return !!uiOf(table.categoryId).withShip; }

  /* 편집 모드 — [편집]을 눌러야 배송비 입력과 업체 추가·삭제가 가능하다(사용자 지시 2026-10-14). 꺼져 있으면 값만 보인다. */
  function editingOn(table) { return !viewOnly() && !!uiOf(table.categoryId).editing; }

  /* 비교에 쓰는 1M 값 — [배송비 포함 비교]가 꺼져 있으면 판매가 그대로, 켜져 있으면 판매가 + 배송비/N개(입력이 있을 때). */
  function effValue(table, key, price) {
    if (price == null) return null;
    if (!withShipOn(table)) return price;
    const per = shipPerUnit(table, key);
    return per == null ? price : price + per;
  }

  function minCompPrice(table, t, opt, len = 1) {
    const values = (state.rows[table.id] || []).filter(r => Number(r.t) === t && r.opt === opt && rowLen(r) === len && num(r.price))
      .map(r => effValue(table, shipKey(r.comp, len), num(r.price)));
    return values.length ? Math.min(...values) : null;
  }

  function vsMinBadge(oursValue, min) {
    if (oursValue == null || min == null) return '<span style="color:#cbd5e1;">—</span>';
    const gap = Math.round(oursValue - min);
    if (gap === 0) return '<span class="pricing-rate-badge mid">최저가와 같음</span>';
    return `<span class="pricing-rate-badge ${gap > 0 ? 'low' : 'good'}">${gap > 0 ? '+' : ''}${gap.toLocaleString('ko-KR')} ${gap > 0 ? '불리' : '유리'}</span>`;
  }

  /* 주목 업체 대비 — 우리 값이 그 업체보다 비싸면(+) 불리(빨강), 싸면(−) 유리(초록). 비교할 값이 없으면 '—'. */
  function vsRefBadge(oursValue, ref) {
    if (oursValue == null || ref == null) return '<span style="color:#cbd5e1;">—</span>';
    const gap = Math.round(oursValue - ref);
    if (gap === 0) return '<span class="pricing-rate-badge mid">같음</span>';
    return `<span class="pricing-rate-badge ${gap > 0 ? 'low' : 'good'}">${gap > 0 ? '+' : ''}${gap.toLocaleString('ko-KR')} ${gap > 0 ? '불리' : '유리'}</span>`;
  }

  function shipCellHtml(table, key) {
    const v = (state.shipping[table.id] || {})[key] || {};
    if (!editingOn(table)) {
      const fee = num(v.fee);
      const box = inner => `<div style="display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap;height:28px;">${inner}</div>`;
      if (fee === 0) return box('<span style="font-size:13px;font-weight:600;color:#15803d;">무료배송</span>');
      return fee == null
        ? box('<span style="color:#d5dbe3;">—</span>')
        : box(`<span style="font-size:13px;font-weight:600;color:#334155;">${fee.toLocaleString('ko-KR')}원</span><span style="font-size:11px;color:#64748b;">${(num(v.every) || 1) > 1 ? `/ ${num(v.every)}개마다` : '/ 주문당'}</span>`);
    }
    const style = 'height:28px;padding:0 4px;font-size:12px;text-align:center;';
    const k = esc(key).replace(/'/g, '&#39;');
    return `<div style="display:flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap;height:28px;">
      <input type="text" inputmode="numeric" class="pricing-input-field" style="width:62px;${style}" value="${v.fee === '' || v.fee == null ? '' : Number(v.fee).toLocaleString('ko-KR')}" placeholder="배송비" onchange="hkCmpEditShip('${table.id}','${k}','fee',this)">
      <span style="font-size:11px;color:#64748b;">원</span><span style="color:#cbd5e1;">/</span>
      <input type="text" inputmode="numeric" class="pricing-input-field" style="width:38px;${style}" value="${v.every === '' || v.every == null ? '' : v.every}" placeholder="1" onchange="hkCmpEditShip('${table.id}','${k}','every',this)">
      <span style="font-size:11px;color:#64748b;">개마다</span></div>`;
  }

  const fmtWon = v => Number(v).toLocaleString('ko-KR');
  /* 길이형 표 칸 아래의 작은 글씨 — 아이소·스티로폼 비교표처럼 판매가와 배송 조건(5개 기준 환산)을 보여 준다. */
  function unitCellSub(table, key, price) {
    if (!withShipOn(table) || price == null) return '';
    const v = (state.shipping[table.id] || {})[key] || {};
    const fee = num(v.fee), every = num(v.every) || 1;
    const line = text => `<span style="display:block;font-size:10px;margin-top:2px;${text.style}">${text.html}</span>`;
    let ship;
    if (fee == null) ship = line({ style: 'color:#fca5a5;', html: '배송비 입력 필요' });
    else if (fee === 0) ship = line({ style: 'font-weight:600;color:#15803d;', html: '무료배송' });
    else {
      const per = perItemShip(fee, every);
      ship = line({ style: 'color:#64748b;', html: `배송 ${fmtWon(fee)}${every > 1 ? ` / ${every}개마다` : ' / 주문당'}${every > 1 && every !== COMPARE_EVERY ? `<span style="color:#94a3b8;"> → 5개 기준 ${fmtWon(Math.round(per))}</span>` : ''}` });
    }
    return `${line({ style: 'color:#94a3b8;', html: `판매가 ${fmtWon(price)}` })}${ship}`;
  }

  function unitTableHtml(table, listId, opts = {}) {
    const rows = state.rows[table.id] || [];
    const len = uiOf(table.categoryId).len || 1; // 지금 고른 길이(M)
    // 그 길이에서 파는 상품이 없는 업체(예: 1M에만 있는 업체)는 이 길이 표에서 열을 뺀다. [편집] 중에는 업체를 관리할 수 있게 모두 보인다.
    const focusNames = focusOf(table);
    // 주목 업체는 맨 왼쪽에 먼저 둔다(나머지 순서는 그대로)
    const comps = matrixComps[table.id] = matrixCompsOf(table, len)
      .filter(name => editingOn(table) || rows.some(r => r.comp === name && rowLen(r) === len && num(r.price)))
      .sort((a, b) => (focusNames.includes(b) ? 1 : 0) - (focusNames.includes(a) ? 1 : 0));
    const focusShown = comps.filter(name => focusNames.includes(name)); // 이 길이 표에 보이는 주목 업체 — '그 업체 대비' 열을 따로 둔다
    const thicknesses = [...new Set([...table.thicknesses, ...rows.map(r => Number(r.t))])].sort((a, b) => a - b);
    const withShip = withShipOn(table);
    const FOCUS_W = 11; // '주목 업체 대비' 열 폭(%)
    const compW = Math.floor((51 - FOCUS_W * focusShown.length) / Math.max(comps.length, 1));
    const C = 'text-align:center;'; // 숫자·머리글을 모두 가운데 맞춤 — 머리글과 숫자가 어긋나 보이지 않게
    const FOCUS_BG = '#fff7e0', FOCUS_HEAD = '#b45309';
    const colW = ((100 - 7 - 12) / (comps.length + 2 + focusShown.length)).toFixed(2); // 업체 N + 한국단열·최저가 대비 2 + 주목 업체 대비
    const head = `<colgroup><col style="width:7%"><col style="width:12%">${Array.from({ length: comps.length + 2 + focusShown.length }, () => `<col style="width:${colW}%">`).join('')}</colgroup>
      <thead><tr><th>두께</th><th>제품 옵션</th>
        ${comps.map((name, ci) => {
          const urls = companyLinks(table, name, len);
          const icon = urls.length === 1
            ? ` <a href="${esc(urls[0])}" target="_blank" rel="noopener" title="${len}M 비교 상품 페이지" style="color:#a5b4fc;margin-left:4px;"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
            : (urls.length > 1
              ? ` <span role="button" tabindex="0" title="${len}M 비교 상품 페이지 ${urls.length}개 — 눌러서 목록 보기" onclick="hkCmpShowLinks(event,'${table.id}',${ci})" style="margin-left:4px;cursor:pointer;color:#a5b4fc;"><i class="fa-solid fa-arrow-up-right-from-square"></i><span style="font-size:10px;margin-left:2px;">${urls.length}</span></span>`
              : '');
          const linkEdit = COMPANY_EDITABLE && editingOn(table) ? ` <span role="button" tabindex="0" title="${esc(name)} ${len}M 비교 상품 주소 편집" onclick="hkCmpEditLinks('${table.id}',${ci})" style="margin-left:6px;cursor:pointer;color:#a5b4fc;"><i class="fa-solid fa-pen"></i></span>` : '';
          const del = COMPANY_EDITABLE && editingOn(table) ? ` <span role="button" tabindex="0" title="${esc(name)} 열 삭제" onclick="hkCmpDelComp('${table.id}',${ci})" style="margin-left:8px;cursor:pointer;color:#94a3b8;"><i class="fa-solid fa-xmark"></i></span>` : '';
          const on = focusNames.includes(name);
          // 주목 업체 ★ — 편집 중에는 눌러서 켜고 끄고, 평소에는 켜진 것만 표시한다
          const star = editingOn(table)
            ? ` <span role="button" tabindex="0" title="${on ? '주목 업체 해제' : '주목 업체로 설정(열을 강조하고 이 업체 대비 차이를 따로 보여 줍니다)'}" onclick="hkCmpToggleFocus('${table.id}',${ci})" style="margin-left:6px;cursor:pointer;color:${on ? '#fcd34d' : '#a5b4fc'};"><i class="fa-${on ? 'solid' : 'regular'} fa-star"></i></span>`
            : (on ? ' <i class="fa-solid fa-star" style="color:#fcd34d;margin-left:4px;"></i>' : '');
          return `<th${on ? ` style="background:${FOCUS_HEAD};"` : ''}>${esc(name)}${star}${icon}${linkEdit}${del}</th>`;
        }).join('')}
        <th style="background:#4f46e5;">${esc(table.oursLabel || '한국단열(빌트론)')}<br>${len}M ${withShip ? '판매가+배송비' : '판매가'}</th><th>최저가 대비</th>
        ${focusShown.map(name => `<th style="background:${FOCUS_HEAD};">★ ${esc(name)}<br>대비</th>`).join('')}</tr></thead>`;
    // 배송비 줄 — 업체마다 배송비와 N개마다를 직접 입력한다(확장으로 수집되지 않는다).
    const shipBg = 'background:#fffbeb;border-bottom:2px solid #cbd5e1;';
    const shipRow = `<tr>
      <td colspan="2" style="${C}font-weight:700;color:#334155;height:50px;${shipBg}">배송비 <span style="font-size:11px;font-weight:500;color:#94a3b8;">원 / N개마다</span></td>
      ${comps.map(name => `<td style="border-left:1px solid #eef2f7;${shipBg}${focusNames.includes(name) ? `background:${FOCUS_BG};` : ''}">${shipCellHtml(table, shipKey(name, len))}</td>`).join('')}
      <td style="${shipBg}border-left:1px solid #eef2f7;">${shipCellHtml(table, shipKey(OURS_SHIP_KEY, len))}</td>
      <td style="${shipBg}"></td>
      ${focusShown.map(() => `<td style="${shipBg}"></td>`).join('')}
    </tr>`;
    // 한국단열이 판매하지 않는 두께·옵션(예: 13T 일반형)은 비교 대상이 아니라 줄을 만들지 않는다(사용자 지시 2026-10-14).
    const soldOptions = t => table.options.filter(opt => unitOurs(table, t, opt.key, len).price != null);
    const body = thicknesses.filter(t => soldOptions(t).length).map((t, gi) => styleGroup(soldOptions(t).map((opt, oi, list) => {
      const ours = unitOurs(table, t, opt.key, len);
      const oursShown = effValue(table, shipKey(OURS_SHIP_KEY, len), ours.price);
      const min = minCompPrice(table, t, opt.key, len);
      const cells = comps.map((name, ci) => {
        const row = rows.find(r => r.comp === name && Number(r.t) === t && r.opt === opt.key && rowLen(r) === len);
        const price = row && num(row.price) ? num(row.price) : '';
        const shown = price === '' ? '' : effValue(table, shipKey(name, len), price);
        const per = shipPerUnit(table, shipKey(name, len));
        const tip = row ? `${row.checked ? `확인일 ${row.checked}` : '확인일 기록 없음'}${row.link ? ' · 링크 있음' : ''}${table.shared ? ` · 판매 중 최저가${num(row.hi) > num(row.price) ? `(최고 ${Number(row.hi).toLocaleString('ko-KR')})` : ''}` : ''}${withShip && per != null ? ` · 판매가 ${Number(price).toLocaleString('ko-KR')} + 배송비 ${Math.round(per).toLocaleString('ko-KR')}` : ''}` : '';
        if (!EDITABLE) {
          const valueHtml = shown === '' ? '<span style="color:#d5dbe3;font-weight:400;">—</span>' : Math.round(shown).toLocaleString('ko-KR');
          // 이 가격이 나온 상품 페이지가 기록돼 있으면 눌러서 연다(길이·두께마다 상품이 다른 업체도 칸마다 맞는 페이지)
          // 줄에 상품 주소가 없으면 그 업체에 등록된 상품 주소로 연다(여러 개면 목록)
          const cellInner = shown !== ''
            ? cellLink(table, name, ci, row, `<span style="font-size:13px;font-weight:600;color:#334155;border-bottom:1px dotted #94a3b8;">${valueHtml}</span>`, len)
            : `<span style="font-size:13px;font-weight:600;color:#334155;">${valueHtml}</span>`;
          return `<td style="border-left:1px solid #eef2f7;${C}${focusNames.includes(name) ? `background:${FOCUS_BG};` : ''}" title="${esc(tip)}">${cellInner}${shown !== '' ? unitCellSub(table, shipKey(name, len), price) : ''}</td>`;
        }
        return `<td style="border-left:1px solid #eef2f7;"><input type="text" inputmode="numeric" class="pricing-input-field" data-hkcm="${t}|${opt.key}|${ci}" title="${esc(tip)}"
            style="width:100%;height:26px;padding:0 6px;font-size:12px;text-align:center;" value="${price === '' ? '' : Number(price).toLocaleString('ko-KR')}" placeholder=""
            onchange="hkCmpEditCell('${table.id}',${t},'${opt.key}',${ci},this)"></td>`;
      }).join('');
      return `<tr data-hkcm-row="${t}|${opt.key}">
        ${oi === 0 ? `<td rowspan="${list.length}" style="${C}font-weight:700;color:#4f46e5;vertical-align:middle;border-right:1px solid #e2e8f0;">${t}T</td>` : ''}
        <td style="${C}font-weight:600;color:#334155;border-right:1px solid #e2e8f0;">${esc(opt.label)}</td>
        ${cells}
        <td style="background:#eef2ff;${C}font-size:13px;font-weight:600;color:#334155;border-left:1px solid #e2e8f0;" title="${ours.price == null ? '한국단열 판매 안 함' : esc(ours.code)}">${oursShown == null ? '<span style="font-size:11px;font-weight:500;">판매 안 함</span>' : `${Math.round(oursShown).toLocaleString('ko-KR')}${unitCellSub(table, shipKey(OURS_SHIP_KEY, len), ours.price)}`}</td>
        <td id="hkcm-${t}-${opt.key}-diff" style="${C}">${vsMinBadge(oursShown, min)}</td>
        ${focusShown.map(name => {
          const r = rows.find(x => x.comp === name && Number(x.t) === t && x.opt === opt.key && rowLen(x) === len);
          const ref = r && num(r.price) ? effValue(table, shipKey(name, len), num(r.price)) : null;
          return `<td style="${C}background:${FOCUS_BG};">${vsRefBadge(oursShown, ref)}</td>`;
        }).join('')}
      </tr>`;
    }).join(''), gi)).join('');
    const compactBody = (shipRow + body).replace(/<td([^>]*)>/g, (m, attrs) => attrs.includes('style="')
      ? `<td${attrs.replace('style="', 'style="padding:11px 6px;background:#fff;')}>`
      : `<td${attrs} style="padding:11px 6px;background:#fff;">`);
    const hint = viewOnly() ? '' : (EDITABLE ? '칸을 비우면 그 업체 가격이 지워집니다' : '가격은 확장 수집값을 [수집값 불러오기]로 반영하고, 배송비는 직접 입력합니다. 칸은 판매가 + 5개를 샀을 때의 개당 배송비입니다');
    return `<div style="margin-top:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;">
        <div>
          <div style="font-size:14px;font-weight:700;color:#1e293b;">${esc(table.title)} – ${esc(lenText(table, len))} 기준 <span style="font-size:11px;font-weight:500;color:#94a3b8;">${hint}</span></div>
          ${opts.inlineStatus ? `<div class="hk-cmp-status" style="font-size:11px;color:#94a3b8;margin-top:3px;">${statusHtml()}</div>` : ''}
        </div>
        <div style="display:flex;gap:8px;">
          ${viewOnly() ? '' : `<button type="button" class="pricing-margin-edit-btn" onclick="hkCmpCollect('${table.id}')" title="등록된 경쟁사 상품 주소를 크롬 확장이 열어 옵션별 판매가를 읽어 옵니다(통합 확장 0.32.5 이상). 길이는 모두 한 번에 읽습니다.">
            <i class="fa-solid fa-people-arrows"></i> 경쟁사 가격 확인</button>`}
          ${COMPANY_EDITABLE && editingOn(table) ? `<button type="button" class="pricing-margin-edit-btn" onclick="hkCmpAddComp('${table.id}')"><i class="fa-solid fa-plus"></i> 경쟁사 추가</button>` : ''}
          ${COMPANY_EDITABLE && !viewOnly() ? `<button type="button" class="pricing-margin-edit-btn" onclick="hkCmpToggleEdit('${table.categoryId}')" title="${editingOn(table) ? '편집을 끝냅니다' : '배송비 입력, 경쟁사 추가·삭제를 할 수 있습니다'}"><i class="fa-solid fa-${editingOn(table) ? 'check' : 'pen'}"></i> ${editingOn(table) ? '편집 완료' : '편집'}</button>` : ''}
          <button type="button" class="pricing-margin-edit-btn hk-cmp-view-ok" onclick="hkCmpToggleShip('${table.categoryId}')" title="켜면 같은 길이끼리 판매가 + 5개를 샀을 때의 개당 배송비로 비교합니다(분석 막대도 같은 기준). 배송비를 아직 적지 않은 업체는 판매가만 비교합니다">
            <i class="fa-solid fa-truck-fast"></i> 배송비 포함 비교: ${withShip ? '켜짐' : '꺼짐'}</button>
          ${viewOnly() ? '' : '<button type="button" class="pricing-margin-edit-btn" onclick="hkCmpSave()"><i class="fa-solid fa-floppy-disk"></i> 저장</button>'}
        </div>
      </div>
      <div class="pricing-table-scroll" style="border:1px solid #e2e8f0;border-radius:10px;">
        <table class="pricing-table" style="min-width:${540 + comps.length * 150 + focusShown.length * 130}px;">${head.replace(/<(td|th)([^>]*)>/g, (m, tag, attrs) => (attrs.includes('style="') ? `<${tag}${attrs.replace('style="', 'style="padding:10px 6px;')}>` : `<${tag}${attrs} style="padding:10px 6px;">`))}<tbody>${compactBody}</tbody></table>
      </div>
    </div>`;
  }

  window.hkCmpToggleEdit = function (cat) {
    const ui = uiOf(cat);
    ui.editing = !ui.editing;
    rerender();
  };

  /* 주목 업체 설정·해제 — 편집 중 업체 머리글의 ★. 표 전체(모든 길이)에 적용된다. */
  window.hkCmpToggleFocus = function (tableId, ci) {
    if (viewOnly()) return;
    const table = tableOf(tableId);
    const name = (matrixComps[tableId] || [])[ci];
    if (!table || !name) return;
    const list = state.focus[tableId] = state.focus[tableId] || [];
    const at = list.indexOf(name);
    if (at >= 0) list.splice(at, 1); else list.push(name);
    markDirty();
    rerender();
  };

  window.hkCmpToggleShip = function (cat) {
    const ui = uiOf(cat);
    ui.withShip = !ui.withShip;
    rerender();
  };

  /* 배송비 칸 편집 — key는 업체 이름 또는 '__ours'(한국단열). 입력 후 표와 분석을 다시 그린다. */
  window.hkCmpEditShip = function (tableId, key, field, input) {
    const table = tableOf(tableId);
    if (!table) return;
    const map = state.shipping[tableId] = state.shipping[tableId] || {};
    const cur = map[key] = map[key] || { fee: '', every: '' };
    const n = num(input.value);
    cur[field] = n == null ? '' : n;
    markDirty();
    rerender();
  };

  /* 칸 하나 편집 — 값이 있으면 그 (업체, 두께, 옵션) 줄을 만들거나 고치고, 비우면 줄을 지운다. */
  window.hkCmpEditCell = function (tableId, t, opt, ci, input) {
    const table = tableOf(tableId);
    const comp = (matrixComps[tableId] || [])[ci];
    if (!table || !comp) return;
    const list = state.rows[tableId] = state.rows[tableId] || [];
    const len = uiOf(table.categoryId).len || 1;
    const idx = list.findIndex(r => r.comp === comp && Number(r.t) === Number(t) && r.opt === opt && rowLen(r) === len);
    const value = num(input.value);
    if (value == null) {
      if (idx >= 0) list.splice(idx, 1);
      // 마지막 가격을 지워도 업체 열은 남겨 둔다(열 삭제는 머리글의 ×).
      const kept = extraList(tableId, len, true);
      if (!kept.includes(comp)) kept.push(comp);
      input.value = '';
    } else {
      input.value = value.toLocaleString('ko-KR');
      if (idx >= 0) { list[idx].price = value; list[idx].checked = today(); }
      else list.push({ id: state.nextId++, comp, t: Number(t), opt, len, price: value, link: '', checked: today() });
    }
    markDirty();
    // 같은 줄의 '최저가 대비'만 다시 그린다(입력 중인 칸의 포커스를 지키기 위해 표 전체는 다시 그리지 않는다).
    const min = minCompPrice(table, Number(t), opt, len);
    const diff = document.getElementById(`hkcm-${t}-${opt}-diff`);
    if (diff) diff.innerHTML = vsMinBadge(effValue(table, shipKey(OURS_SHIP_KEY, len), unitOurs(table, Number(t), opt, len).price), min);
    renderAnalysis(table.categoryId);
  };

  window.hkCmpAddComp = function (tableId) {
    const name = String(window.prompt('추가할 경쟁사 이름을 입력하세요') || '').trim();
    if (!name) return;
    const len = uiOf(tableOf(tableId).categoryId).len || 1;
    if (matrixCompsOf(tableOf(tableId), len).includes(name)) { toast(`"${name}"은(는) ${len}M 표에 이미 있습니다.`, 'error'); return; }
    const url = String(window.prompt('비교할 상품 페이지 주소를 입력하세요(스마트스토어 상품 주소, 없으면 비워 두세요)') || '').trim();
    if (url && !/^https:\/\/smartstore\.naver\.com\/[^/]+\/products\/\d+\/?$/.test(url)) {
      toast('스마트스토어 상품 주소 형식이 아닙니다(https://smartstore.naver.com/스토어/products/번호).', 'error');
      return;
    }
    extraList(tableId, len, true).push(name);
    if (url) (state.links[tableId] = state.links[tableId] || {})[len > 1 ? `${name}@${len}` : name] = [url];
    markDirty();
    rerender();
  };

  /* 업체 비교 상품 주소 편집 — 한 줄에 하나(두께·규격마다 상품이 다르면 여러 개). 수집은 적힌 주소를 모두 연다. */
  window.hkCmpEditLinks = function (tableId, ci) {
    const table = tableOf(tableId);
    const name = (matrixComps[tableId] || [])[ci];
    if (!table || !name) return;
    const len = table.kind === 'unit' ? (uiOf(table.categoryId).len || 1) : 1;
    const lenLabel = table.kind === 'unit' ? `${len}M` : table.size; // 문구용 — sheet 표는 규격
    const linkKey = len > 1 ? `${name}@${len}` : name;
    const ownLinks = asList((state.links[tableId] || {})[linkKey]);
    let dialog = document.getElementById('hkCompareLinksDialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'hkCompareLinksDialog';
      dialog.className = 'pv-dialog';
      document.body.appendChild(dialog);
    }
    dialog.innerHTML = `<div class="pricing-input-modal-header">
        <div class="pim-header-left">
          <span class="pim-title"><i class="fa-solid fa-link"></i> ${esc(name)} · ${esc(lenLabel)} 비교 상품 주소</span>
          <span class="pim-sub">한 줄에 하나 · 스마트스토어 상품 주소</span>
        </div>
        <button type="button" class="pim-close-btn" data-close><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="pv-body">
        <div class="pv-hint"><i class="fa-solid fa-circle-info"></i>
          <span>${table.kind === 'unit' ? `길이마다 표는 서로 독립이라 ${len}M 표에만 쓰는 주소입니다.` : `규격마다 표는 서로 독립이라 ${esc(table.size)} 표에만 쓰는 주소입니다.`} 같은 길이의 상품이 두께마다 따로 있으면 여러 줄로 적습니다. [경쟁사 가격 확인]은 모든 길이 표의 주소를 열어 읽고, 읽은 옵션은 길이에 맞는 표에 들어갑니다.</span>
        </div>
        <textarea class="pim-input" data-links rows="6" spellcheck="false" style="width:100%;height:auto;font-size:13px;line-height:1.5;padding:10px;" placeholder="https://smartstore.naver.com/스토어/products/상품번호">${esc(ownLinks.join('\n'))}</textarea>
        <div class="pctd-status-bar" data-statusbar><span data-status role="status"></span></div>
        <div class="pctd-actions">
          <button type="button" class="pim-btn-confirm" data-save><i class="fa-solid fa-check"></i> 확인</button>
          <button type="button" class="pim-btn-cancel" data-cancel>취소</button>
        </div>
      </div>`;
    const close = () => dialog.close();
    dialog.querySelector('[data-close]').onclick = close;
    dialog.querySelector('[data-cancel]').onclick = close;
    dialog.querySelector('[data-save]').onclick = () => {
      const lines = [...new Set(dialog.querySelector('[data-links]').value.split(/\r?\n/).map(l => l.trim()).filter(Boolean))];
      const bad = lines.filter(l => !SMARTSTORE_PRODUCT.test(l));
      if (bad.length) { dialog.querySelector('[data-status]').textContent = `스마트스토어 상품 주소 형식이 아닙니다: ${bad[0]}`; return; }
      (state.links[tableId] = state.links[tableId] || {})[linkKey] = lines;
      markDirty();
      rerender();
      close();
    };
    dialog.showModal();
  };

  window.hkCmpShowLinks = function (event, tableId, ci) {
    event.stopPropagation();
    const table = tableOf(tableId);
    const name = (matrixComps[tableId] || [])[ci];
    if (!table || !name) return;
    document.getElementById('hkCmpLinksPopup')?.remove();
    const len = table.kind === 'unit' ? (uiOf(table.categoryId).len || 1) : 1;
    const pop = document.createElement('div');
    pop.id = 'hkCmpLinksPopup';
    const rect = event.currentTarget.getBoundingClientRect();
    pop.style.cssText = `position:fixed;z-index:9000;left:${Math.max(8, rect.left - 40)}px;top:${rect.bottom + 6}px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 8px 24px rgba(15,23,42,.15);padding:8px 10px;max-width:420px;font-size:12px;`;
    pop.innerHTML = `<div style="font-weight:700;color:#334155;margin-bottom:6px;">${esc(name)} · ${table.kind === 'unit' ? `${len}M` : esc(table.size)} 상품 주소</div>` + companyLinks(table, name, len)
      .map((u, i) => `<div style="margin:3px 0;"><a href="${esc(u)}" target="_blank" rel="noopener" style="color:#4f46e5;word-break:break-all;">${i + 1}. ${esc(u.replace('https://smartstore.naver.com/', ''))}</a></div>`).join('');
    document.body.appendChild(pop);
    setTimeout(() => document.addEventListener('click', function close() { pop.remove(); document.removeEventListener('click', close); }), 0);
  };

  window.hkCmpDelComp = function (tableId, ci) {
    const name = (matrixComps[tableId] || [])[ci];
    if (!name) return;
    const tbl = tableOf(tableId);
    const len = tbl.kind === 'unit' ? (uiOf(tbl.categoryId).len || 1) : 1;
    const count = (state.rows[tableId] || []).filter(r => r.comp === name && rowLen(r) === len).length;
    const where = tbl.kind === 'unit' ? `${len}M 표에서 지울까요? 이 길이의 가격 ${count}건이 함께 지워집니다(다른 길이 표는 그대로입니다).` : `${tbl.size} 표에서 지울까요? 이 규격의 가격 ${count}건이 함께 지워집니다(다른 규격 표는 그대로입니다).`;
    if (!window.confirm(`"${name}"을(를) ${where}`)) return;
    state.rows[tableId] = (state.rows[tableId] || []).filter(r => !(r.comp === name && rowLen(r) === len));
    const kept = extraList(tableId, len, true);
    const at = kept.indexOf(name);
    if (at >= 0) kept.splice(at, 1);
    const key = len > 1 ? `${name}@${len}` : name;
    if (state.links[tableId]) state.links[tableId][key] = [];
    if (state.shipping[tableId]) delete state.shipping[tableId][key];
    markDirty();
    rerender();
  };

  /* ─── 가격 경쟁력 분석(막대) — 입력표와 같은 자료에서 만든다. 읽기 전용이다. ───
     sheet 표(아이소핑크)는 두께마다 한 줄(값 = 장당 실구매가), unit 표(열반사)는 두께 탭 안에 제품 옵션마다 한 줄(값 = 1M 판매가). */
  const uiByCat = {}; // 카테고리마다 고른 표·두께·펼침 상태
  /* 보기 전환 단추(단가 계산 | 경쟁사 비교)를 쓰는 카테고리 — 경쟁사 비교를 누르면 그 카테고리의 단가 계산 화면(원가 카드·단가표)을
     숨기고 비교 화면만 보여 준다. 나머지 카테고리는 아직 예전처럼 맨 위 접힌 구역이다. 고른 보기는 브라우저에 기억한다. */
  const VIEW_TOGGLE_CATS = []; // (2026-10-15 상단 전환 줄은 아코디언 머리줄 버튼으로 대체 — 코드는 남겨 둠)
  const viewKey = cat => `hkCmpView:${cat}`;
  function uiOf(cat) {
    // 기본은 접힌 상태 — 단가표를 열 때 원가·판매가 표가 먼저 보이게 한다(사용자 지시 2026-10-14).
    if (!uiByCat[cat]) {
      const first = TABLES.find(t => t.categoryId === cat) || {};
      let view = 'calc';
      try { if (localStorage.getItem(viewKey(cat)) === 'compare') view = 'compare'; } catch { /* 저장소를 못 쓰면 기본 보기 */ }
      uiByCat[cat] = { tableId: first.id, t: null, len: (first.lengths && first.lengths[0]) || 1, open: false, view, withShip: true };
    }
    return uiByCat[cat];
  }
  const usesViewToggle = cat => VIEW_TOGGLE_CATS.includes(cat);
  const viewOf = cat => (usesViewToggle(cat) ? uiOf(cat).view : 'legacy');

  function analysisGroups(table, onlyT) {
    const rows = state.rows[table.id] || [];
    const thicknesses = table.kind === 'unit'
      ? [...new Set([...table.thicknesses, ...rows.map(r => Number(r.t))])].sort((a, b) => a - b)
      : [...new Set([...table.ours.map(d => d[0]), ...rows.map(r => Number(r.t))])].sort((a, b) => a - b);
    const groups = [];
    thicknesses.forEach(t => {
      if (onlyT != null && t !== onlyT) return;
      if (table.kind === 'unit') {
        const len = uiOf(table.categoryId).len || 1;
        table.options.forEach(opt => {
          const oursPrice = oursValue(table, t, opt.key, len);
          if (oursPrice == null) return; // 한국단열이 안 파는 옵션은 비교 대상이 아니다
          const ours = effValue(table, shipKey(OURS_SHIP_KEY, len), oursPrice);
          const comps = rows.filter(r => Number(r.t) === t && r.opt === opt.key && rowLen(r) === len && num(r.price))
            .map(r => ({ comp: r.comp || '(업체 미입력)', value: effValue(table, shipKey(r.comp, len), num(r.price)), checked: r.checked }));
          groups.push({ t, label: opt.label, sub: '', ours, comps });
        });
      } else {
        const def = table.ours.find(d => d[0] === t);
        const comps = rows.filter(r => Number(r.t) === t).map(r => ({ comp: r.comp || '(업체 미입력)', value: derive(table, r)?.real ?? null, checked: r.checked }))
          .filter(c => c.value != null);
        groups.push({ t, label: `${t}T`, sub: def ? `${table.size}×${def[2]}장` : '', ours: oursValue(table, t), comps });
      }
    });
    return { thicknesses, groups };
  }

  function analysisSummary(table) {
    const all = analysisGroups(table).groups.filter(g => g.ours != null && g.comps.length);
    if (!all.length) return '비교할 경쟁사 가격이 아직 없습니다.';
    const gaps = all.map(g => ({ g, gap: Math.round(g.ours - Math.min(...g.comps.map(c => c.value))) }));
    const higher = gaps.filter(x => x.gap > 0);
    const name = x => (table.kind === 'unit' ? `${x.g.t}T ${x.g.label}` : x.g.label);
    const lenText = table.kind === 'unit' ? `${uiOf(table.categoryId).len || 1}M 기준 ` : '';
    let text = `${lenText}비교 가능한 ${all.length}개 중 ${higher.length}개가 경쟁사 최저가보다 높고, ${gaps.length - higher.length}개는 최저가 이하입니다.`;
    if (higher.length) {
      const worst = higher.reduce((a, b) => (b.gap > a.gap ? b : a));
      const best = higher.reduce((a, b) => (b.gap < a.gap ? b : a));
      text += ` 격차가 가장 큰 곳은 ${name(worst)}(+${worst.gap.toLocaleString('ko-KR')}원), 가장 작은 곳은 ${name(best)}(+${best.gap.toLocaleString('ko-KR')}원)입니다.`;
    }
    return text;
  }

  /* 막대 색 — 단가표 기본 색(인디고 #4f46e5 = 우리, 슬레이트 = 경쟁사)에 맞춘다. */
  const BAR = { track: '#f1f5f9', compLow: '#94a3b8', compRange: '#cbd5e1', ours: '#4f46e5' };
  const FOCUS_TICK = '#d97706'; // 주목 업체 눈금(막대 위)

  function barHtml(group, scale, focusNames = []) {
    const pct = v => `${Math.max(0, Math.min(100, v / scale * 100)).toFixed(2)}%`;
    // 주목 업체 — 경쟁사 막대 위에 호박색 눈금을 세우고, 아래 줄에 그 업체 가격과 우리와의 차이를 적는다
    const focus = group.comps.filter(c => focusNames.includes(c.comp) && c.value != null);
    const focusTicks = focus.map(c => `<div title="★ ${esc(c.comp)} ${fmt(c.value)}원" style="position:absolute;left:calc(${pct(c.value)} - 2px);top:0;bottom:0;width:4px;background:${FOCUS_TICK};"></div>`).join('');
    const focusText = focus.map(c => {
      const g = group.ours != null ? Math.round(group.ours - c.value) : null;
      const gh = g == null ? '' : g === 0 ? ' · 같음' : ` · 우리 <b style="color:${g > 0 ? '#dc2626' : '#16a34a'};">${g > 0 ? '+' : ''}${g.toLocaleString('ko-KR')}원 ${g > 0 ? '불리' : '유리'}</b>`;
      return `<span style="color:#b45309;font-weight:600;"><i class="fa-solid fa-star" style="font-size:10px;"></i> ${esc(c.comp)} ${fmt(c.value)}원${gh}</span>`;
    }).join(' &nbsp; ');
    const values = group.comps.map(c => c.value);
    const min = values.length ? Math.min(...values) : null, max = values.length ? Math.max(...values) : null;
    const minComp = min == null ? null : group.comps.find(c => c.value === min).comp;
    const gap = group.ours != null && min != null ? Math.round(group.ours - min) : null;
    const gapHtml = gap == null ? '' : gap === 0 ? '<span class="pricing-rate-badge mid">최저가와 같음</span>'
      : `<span class="pricing-rate-badge ${gap > 0 ? 'low' : 'good'}">최저가 대비 ${gap > 0 ? '+' : ''}${gap.toLocaleString('ko-KR')} ${gap > 0 ? '불리' : '유리'}</span>`;
    const range = min == null ? '경쟁사 가격 없음'
      : `경쟁사 ${fmt(min)}원${max !== min ? ` ~ ${fmt(max)}원` : ''} · 최저 ${esc(minComp)}${group.comps.length > 1 ? ` (${group.comps.length}곳)` : ''}`;
    return `<div style="padding:12px 0;border-bottom:1px solid #f1f5f9;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;">
        <span style="font-size:14px;font-weight:700;color:#1e293b;">${esc(group.label)}${group.sub ? ` <span style="font-size:11px;font-weight:500;color:#94a3b8;">${esc(group.sub)}</span>` : ''}</span>
        <span style="font-size:14px;font-weight:700;color:#1e293b;">${group.ours == null ? '<span style="font-size:11px;font-weight:500;color:#94a3b8;">한국단열 판매 안 함</span>' : `${fmt(group.ours)}원`}</span>
      </div>
      <div style="position:relative;height:10px;margin-top:7px;background:${BAR.track};border-radius:6px;overflow:hidden;">
        ${min == null ? '' : `<div style="position:absolute;left:0;top:0;bottom:0;width:${pct(min)};background:${BAR.compLow};"></div>
        <div style="position:absolute;left:${pct(min)};top:0;bottom:0;width:${pct(max - min)};background:${BAR.compRange};"></div>`}${focusTicks}
      </div>
      <div style="height:6px;margin-top:3px;background:${BAR.track};border-radius:6px;overflow:hidden;">
        ${group.ours == null ? '' : `<div style="height:100%;width:${pct(group.ours)};background:${BAR.ours};"></div>`}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:6px;font-size:12px;color:#64748b;">
        <span>${range}</span>${gapHtml}
      </div>
      ${focusText ? `<div style="margin-top:4px;font-size:12px;">${focusText}</div>` : ''}
    </div>`;
  }

  function subtabBar(items, activeKey, onclickOf, extraClass = '') {
    return `<div class="bead-subtab-bar${extraClass}">${items.map(item =>
      `<button type="button" class="bead-subtab${item.key === activeKey ? ' active' : ''}" onclick="${onclickOf(item.key)}">${esc(item.label)}${item.sub ? `<span class="bead-subtab-sub">${esc(item.sub)}</span>` : ''}</button>`
    ).join('')}</div>`;
  }

  function analysisInnerHtml(cat) {
    if (!state.loaded) return '<div style="padding:16px 22px;color:#94a3b8;font-size:13px;">불러오는 중…</div>';
    const ui = uiOf(cat);
    const catTables = TABLES.filter(t => t.categoryId === cat);
    const table = tableOf(ui.tableId) || catTables[0];
    const chips = catTables.length > 1
      ? subtabBar(catTables.map(item => ({ key: item.id, label: item.chip || item.title.replace(/^.*경쟁사 가격 비교표 – /, ''), sub: item.kind === 'unit' ? (ui.withShip ? '판매가+배송비' : '판매가') : '장당 실구매가' })),
        table.id, key => `hkCmpPickTable('${cat}','${key}')`)
      : '';
    const whole = analysisGroups(table);
    if (table.kind === 'unit') whole.thicknesses = whole.thicknesses.filter(t => whole.groups.some(g => g.t === t));
    let tabs = '', lenTabs = '', shown = whole.groups, tNow = null;
    const len = ui.len || 1;
    if (table.kind === 'unit') {
      lenTabs = subtabBar(table.lengths.map(l => ({ key: l, label: `${l}M`, sub: table.lengthNote && table.lengthNote[l] ? table.lengthNote[l] : '' })), len, key => `hkCmpPickLen('${cat}',${key})`);
      tNow = whole.thicknesses.includes(ui.t) ? ui.t : whole.thicknesses[0];
      // 두께가 하나뿐인 표(단열벽지 5T)는 두께 탭이 필요 없다
      tabs = whole.thicknesses.length > 1 ? subtabBar(whole.thicknesses.map(t => ({ key: t, label: `${t}T` })), tNow, key => `hkCmpPickT('${cat}',${key})`) : '';
      shown = whole.groups.filter(g => g.t === tNow);
    }
    const values = shown.flatMap(g => [g.ours, ...g.comps.map(c => c.value)]).filter(v => v != null);
    const scale = values.length ? Math.max(...values) * 1.02 : 1;
    const swatch = color => `<i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};margin-right:4px;"></i>`;
    const legend = `<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:#64748b;margin-top:10px;">
      <span>${swatch(BAR.compLow)}경쟁사 최저가까지</span><span>${swatch(BAR.compRange)}최저~최고 구간</span>${focusOf(table).length ? `<span>${swatch(FOCUS_TICK)}★ 주목 업체(${esc(focusOf(table).join(', '))})</span>` : ''}
      <span>${swatch(BAR.ours)}${esc(table.oursLabel || '한국단열')} ${table.kind === 'unit' ? `${len}M ${uiOf(cat).withShip ? '판매가+배송비' : '판매가'}` : '장당 실구매가'}</span></div>`;
    return `${chips}${lenTabs}${tabs}
      <div style="padding:14px 22px 4px;">
        <div style="font-size:13px;color:#334155;font-weight:500;">${esc(analysisSummary(table))}</div>
        ${legend}
        <div style="margin-top:6px;">${shown.map(g => barHtml(g, scale, focusOf(table))).join('')}</div>
      </div>`;
  }

  function renderAnalysis(cat) {
    const el = document.getElementById(`hkCmpAnalysis-${cat}`);
    if (el) el.innerHTML = analysisInnerHtml(cat);
  }

  // 분석에서 고른 표 하나만 아래 입력표에 보인다(표를 바꾸면 입력표도 같이 바뀐다).
  window.hkCmpPickTable = function (cat, id) {
    const ui = uiOf(cat);
    ui.tableId = id;
    ui.t = null;
    // 표마다 길이 목록이 달라(난방필름 1·25·50M, 캠핑 1M) 고른 길이가 새 표에 없으면 그 표의 첫 길이로 옮긴다
    const next = tableOf(id);
    if (next && next.lengths && !next.lengths.includes(ui.len)) ui.len = next.lengths[0];
    renderAnalysis(cat);
    const body = document.getElementById(`hkComparePaneBody-${cat}`);
    if (body) body.innerHTML = bodyHtml(cat);
    if (document.querySelector('.hk-cmp-card-panel')) rerender();
  };
  window.hkCmpPickT = function (cat, t) { uiOf(cat).t = Number(t); renderAnalysis(cat); if (document.querySelector('.hk-cmp-card-panel')) rerender(); };
  // 길이를 바꾸면 분석과 아래 비교표가 같은 길이로 같이 바뀐다.
  window.hkCmpPickLen = function (cat, len) {
    const ui = uiOf(cat);
    ui.len = Number(len) || 1;
    ui.t = null;
    renderAnalysis(cat);
    const body = document.getElementById(`hkComparePaneBody-${cat}`);
    if (body) body.innerHTML = bodyHtml(cat);
    if (document.querySelector('.hk-cmp-card-panel')) rerender();
  };
  window.hkCmpToggle = function (cat) { const ui = uiOf(cat); ui.open = !ui.open; rerender(); };

  /* 아이소핑크(sheet) 비교표 — 열반사·단열벽지와 같은 모양의 매트릭스(2026-10-14): 줄 = 두께, 열 = 업체, 칸 = 그 업체의 '장당 실구매가'
     (배송비 포함, 규격 환산). 한 업체가 같은 두께에 묶음을 여러 개 팔면 장당 실구매가가 가장 싼 줄을 칸에 보이고 나머지는 마우스를 올리면 보인다.
     배송비는 수집되지 않아 [편집]에서 두께 × 업체로 직접 입력한다(그 업체·두께의 모든 묶음 줄에 같은 값). 저장 형식(옵션별 줄)은 그대로다.
     예전 옵션별 줄 표는 '옵션별 상세'로 접어 둔다. 규격(900×1800 / 600×900)은 위쪽 칩이 표를 고른다. */
  function sheetMatrixHtml(table, listId, opts = {}) {
    const rows = state.rows[table.id] || [];
    const focusNames = focusOf(table);
    const FOCUS_BG = '#fff7e0', FOCUS_HEAD = '#b45309';
    const C = 'text-align:center;';
    const editing = editingOn(table);
    const seen = [];
    rows.forEach(r => { if (r.comp && !seen.includes(r.comp)) seen.push(r.comp); });
    extraList(table.id, 1).forEach(n => { if (!seen.includes(n)) seen.push(n); }); // 가격 줄은 아직 없고 주소만 등록한 업체
    // 주목 업체는 맨 왼쪽(나머지 순서는 그대로)
    const comps = matrixComps[table.id] = seen.sort((a, b) => (focusNames.includes(b) ? 1 : 0) - (focusNames.includes(a) ? 1 : 0));
    const focusShown = comps.filter(n => focusNames.includes(n));
    const oursByT = new Map(table.ours.slice().reverse().map(def => [def[0], oursOf(table, def)]));
    const thicknesses = [...new Set([...oursByT.keys(), ...rows.map(r => Number(r.t))])].sort((a, b) => a - b);
    const FOCUS_W = 11;

    // (업체, 두께)의 후보 줄 → 장당 실구매가가 가장 싼 줄과 상세 설명
    const cellOf = (name, t) => {
      const list = rows.filter(r => r.comp === name && Number(r.t) === t && num(r.price));
      if (!list.length) return null;
      const info = list.map(r => ({ r, d: derive(table, r) }));
      const withReal = info.filter(x => x.d && x.d.real != null);
      const best = withReal.length ? withReal.reduce((a, b) => (b.d.real < a.d.real ? b : a)) : null;
      const fallback = best ? null : info.filter(x => x.d).reduce((a, b) => (!a || b.d.perSheet < a.d.perSheet ? b : a), null);
      const tip = info.map(({ r, d }) => `${r.spec || table.size} ${num(r.sheets) || 1}장 · 판매가 ${num(r.price).toLocaleString('ko-KR')}`
        + `${num(r.ship) != null ? ` + 배송비 ${num(r.ship).toLocaleString('ko-KR')}/${num(r.every) || 1}개${(num(r.every) || 1) > 1 && everyForCompare(r) !== (num(r.every) || 1) ? `(5개 기준 ${Math.round(num(r.ship) / everyForCompare(r)).toLocaleString('ko-KR')})` : ''}` : ' · 배송비 미입력'}`
        + `${d && d.real != null ? ` → 장당 ${Math.round(d.real).toLocaleString('ko-KR')}` : (d ? ` → 장당 단가 ${Math.round(d.perSheet).toLocaleString('ko-KR')}` : '')}`
        + `${r.checked ? ` (확인일 ${r.checked})` : ''}`).join('\n');
      return { best, fallback, tip };
    };

    const colW = ((100 - 7) / (comps.length + 2 + focusShown.length)).toFixed(2); // 업체 N + 한국단열·최저가 대비 2 + 주목 업체 대비
    const head = `<colgroup><col style="width:7%">${Array.from({ length: comps.length + 2 + focusShown.length }, () => `<col style="width:${colW}%">`).join('')}</colgroup>
      <thead><tr><th>두께</th>
        ${comps.map((name, ci) => {
          const on = focusNames.includes(name);
          const star = editing
            ? ` <span role="button" tabindex="0" title="${on ? '주목 업체 해제' : '주목 업체로 설정(열을 강조하고 이 업체 대비 차이를 따로 보여 줍니다)'}" onclick="hkCmpToggleFocus('${table.id}',${ci})" style="margin-left:6px;cursor:pointer;color:${on ? '#fcd34d' : '#a5b4fc'};"><i class="fa-${on ? 'solid' : 'regular'} fa-star"></i></span>`
            : (on ? ' <i class="fa-solid fa-star" style="color:#fcd34d;margin-left:4px;"></i>' : '');
          const urls = companyLinks(table, name, 1).filter(u => SMARTSTORE_PRODUCT.test(u));
          const icon = urls.length === 1
            ? ` <a href="${esc(urls[0])}" target="_blank" rel="noopener" title="${esc(table.size)} 비교 상품 페이지" style="color:#a5b4fc;margin-left:4px;"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
            : (urls.length > 1
              ? ` <span role="button" tabindex="0" title="${esc(table.size)} 비교 상품 페이지 ${urls.length}개 — 눌러서 목록 보기" onclick="hkCmpShowLinks(event,'${table.id}',${ci})" style="margin-left:4px;cursor:pointer;color:#a5b4fc;"><i class="fa-solid fa-arrow-up-right-from-square"></i><span style="font-size:10px;margin-left:2px;">${urls.length}</span></span>`
              : '');
          const linkEdit = editing ? ` <span role="button" tabindex="0" title="${esc(name)} ${esc(table.size)} 비교 상품 주소 편집" onclick="hkCmpEditLinks('${table.id}',${ci})" style="margin-left:6px;cursor:pointer;color:#a5b4fc;"><i class="fa-solid fa-pen"></i></span>` : '';
          const del = editing ? ` <span role="button" tabindex="0" title="${esc(name)} 열 삭제" onclick="hkCmpDelComp('${table.id}',${ci})" style="margin-left:8px;cursor:pointer;color:#94a3b8;"><i class="fa-solid fa-xmark"></i></span>` : '';
          return `<th${on ? ` style="background:${FOCUS_HEAD};"` : ''}>${esc(name)}${star}${icon}${linkEdit}${del}</th>`;
        }).join('')}
        <th style="background:#4f46e5;">한국단열<br>장당 실구매가</th><th>최저가 대비</th>
        ${focusShown.map(name => `<th style="background:${FOCUS_HEAD};">★ ${esc(name)}<br>대비</th>`).join('')}</tr></thead>`;

    // 두께 줄을 누르면 그 두께의 옵션(묶음) 줄이 펼쳐진다 — 최종 줄의 값이 어떤 옵션에서 나왔는지(✓) 한눈에 보이게 한다.
    const sheetOpen = uiOf(table.categoryId).sheetOpen = uiOf(table.categoryId).sheetOpen || {};
    const isOpen = t => !!sheetOpen[`${table.id}|${t}`];
    const OPT_BG = 'background:#fafbfc;';
    // 배송비 — 칸 안에 항상 보이고(열반사의 배송비 줄처럼), [편집] 중에는 그 칸에서 바로 고친다. 두께마다 다르고 수집되지 않아 직접 입력한다.
    // 같은 업체·두께에 묶음(장수)이 둘 이상이면(예: 단열코리아 100T 1장·2장 — 상품마다 배송비가 다름) 편집 중 칸에 묶음별로 입력칸이 나뉘고,
    // 값은 그 묶음(장수)의 줄에만 들어간다(hkCmpEditSheetShip). 평소에는 칸에 보이는 가격(최저 옵션)의 배송비를 보여 준다.
    const shipOfRow = r => (r && num(r.ship) != null ? { fee: num(r.ship), every: num(r.every) || 1 } : null);
    const shipHtml = (name, ci, t, c) => {
      const priced = rows.filter(x => x.comp === name && Number(x.t) === t && num(x.price));
      if (editing) {
        const st = 'height:24px;padding:0 3px;font-size:11px;text-align:center;';
        const sizes = [...new Set(priced.map(x => num(x.sheets) || 1))].sort((x, y) => x - y);
        const line = n => {
          const r = n == null ? rows.find(x => x.comp === name && Number(x.t) === t) : priced.find(x => (num(x.sheets) || 1) === n);
          const sv = shipOfRow(r);
          const arg = n == null ? '' : `,${n}`;
          return `<div style="display:flex;align-items:center;justify-content:center;gap:3px;white-space:nowrap;margin-top:5px;">
          ${sizes.length > 1 ? `<span style="font-size:10px;font-weight:600;color:#64748b;min-width:24px;text-align:right;">${n}장</span>` : ''}
          <input type="text" inputmode="numeric" class="pricing-input-field" style="width:54px;${st}" value="${sv ? sv.fee.toLocaleString('ko-KR') : ''}" placeholder="배송비" onchange="hkCmpEditSheetShip('${table.id}',${ci},${t},'ship',this${arg})">
          <span style="font-size:10px;color:#94a3b8;">/</span>
          <input type="text" inputmode="numeric" class="pricing-input-field" style="width:30px;${st}" value="${sv ? sv.every : ''}" placeholder="1" onchange="hkCmpEditSheetShip('${table.id}',${ci},${t},'every',this${arg})">
          <span style="font-size:10px;color:#94a3b8;">개</span></div>`;
        };
        return (sizes.length ? sizes : [null]).map(line).join('');
      }
      const shown = c && (c.best ? c.best.r : (c.fallback ? c.fallback.r : null));
      const sv = shipOfRow(shown) || shipOfRow(priced.find(x => num(x.ship) != null));
      if (!sv) return '<span style="display:block;font-size:10px;color:#fca5a5;margin-top:3px;">배송비 입력 필요</span>';
      if (sv.fee === 0) return '<span style="display:block;font-size:10px;font-weight:600;color:#15803d;margin-top:3px;">무료배송</span>';
      return `<span style="display:block;font-size:10px;color:#64748b;margin-top:3px;">배송 ${sv.fee.toLocaleString('ko-KR')}${sv.every > 1 ? ` / ${sv.every}개마다` : ' / 주문당'}${sv.every > 1 && sv.every !== COMPARE_EVERY ? `<span style="color:#94a3b8;"> → 5개 기준 ${Math.round(sv.fee * Math.ceil(COMPARE_EVERY / sv.every) / COMPARE_EVERY).toLocaleString('ko-KR')}</span>` : ''}</span>`;
    };
    // 한국단열 배송비는 단가표(몰별 상품·2단계 배송 블록)의 값을 그대로 받아 와 계산에 쓰고, 칸에는 읽기 전용으로 보여 준다.
    // 한국단열 배송비를 고치려면 단가표 쪽에서 고친다 — 이 표에서 입력하는 배송비는 경쟁사 칸뿐이다.
    const won = v => `${Number(v).toLocaleString('ko-KR')}`;
    const oursShipHtml = o => {
      if (!o) return '';
      if (!o.ship) return '<span style="display:block;font-size:10px;font-weight:600;color:#15803d;margin-top:3px;">무료배송</span>';
      return `<span style="display:block;font-size:10px;color:#64748b;margin-top:3px;">배송 ${Number(o.ship).toLocaleString('ko-KR')}${o.every > 1 ? ` / ${o.every}개마다` : ' / 주문당'}</span>`;
    };
    const bodyRows = thicknesses.map((t, gi) => {
      const ours = oursByT.get(t);
      const oursOpts = ourOptionsOf(table, t);
      const bestOurs = oursOpts.length ? oursOpts.reduce((a, b) => (b.per < a.per ? b : a)) : null;
      const defPer = ours && ours.price != null ? (ours.price + perItemShip(ours.ship, ours.every)) / ours.sheets : null;
      const oursPer = bestOurs ? bestOurs.per : defPer;
      const cells = comps.map(name => ({ name, c: cellOf(name, t) }));
      const reals = cells.map(x => x.c && x.c.best ? x.c.best.d.real : null).filter(v => v != null);
      const min = reals.length ? Math.min(...reals) : null;
      const expanded = isOpen(t);
      const tds = cells.map(({ name, c }, ci) => {
        const bg = focusNames.includes(name) ? `background:${FOCUS_BG};` : '';
        if (!c) return `<td style="border-left:1px solid #eef2f7;${C}${bg}"><span style="color:#d5dbe3;">—</span></td>`;
        if (c.best) {
          const { r, d } = c.best;
          const inner = `<span style="font-size:13px;font-weight:700;color:#334155;">${Math.round(d.real).toLocaleString('ko-KR')}</span><span style="display:block;font-size:10px;font-weight:500;color:#94a3b8;">${num(r.sheets) || 1}장 묶음</span>`;
          const linked = cellLink(table, name, ci, r, inner, 1);
          return `<td style="border-left:1px solid #eef2f7;${C}${bg}" title="${esc(c.tip)}">${linked}${shipHtml(name, ci, t, c)}</td>`;
        }
        // 배송비가 없어 장당 실구매가를 못 구하는 칸 — 장당 단가만 흐리게 보이고 비교(최저가)에는 넣지 않는다
        const per = c.fallback ? Math.round(c.fallback.d.perSheet).toLocaleString('ko-KR') : '—';
        return `<td style="border-left:1px solid #eef2f7;${C}${bg}" title="${esc(`배송비 미입력 — 장당 단가만 표시합니다(비교에서 제외)\n${c.tip}`)}">${cellLink(table, name, ci, c.fallback ? c.fallback.r : null, `<span style="font-size:12px;font-weight:500;color:#cbd5e1;">${per}</span>`, 1)}${shipHtml(name, ci, t, c)}</td>`;
      }).join('');
      const focusTds = focusShown.map(name => {
        const c = cellOf(name, t);
        const ref = c && c.best ? c.best.d.real : null;
        return `<td style="${C}background:${FOCUS_BG};">${vsRefBadge(oursPer, ref)}</td>`;
      }).join('');
      const finalRow = `<tr>
        <td style="${C}font-weight:700;color:#4f46e5;border-right:1px solid #e2e8f0;"><span role="button" tabindex="0" onclick="hkCmpToggleSheetT('${table.id}',${t})" title="${expanded ? '옵션 줄 접기' : '옵션(묶음) 구성 펼치기'}" style="cursor:pointer;"><i class="fa-solid fa-chevron-${expanded ? 'down' : 'right'}" style="font-size:10px;color:#94a3b8;margin-right:4px;"></i>${t}T</span>${ours ? `<span style="display:block;font-size:10px;font-weight:500;color:#94a3b8;">${esc(table.size)}×${ours.sheets}장</span>` : ''}</td>
        ${tds}
        <td style="background:#eef2ff;${C}font-size:13px;font-weight:700;color:#334155;border-left:1px solid #e2e8f0;" title="${bestOurs ? esc(bestOurs.code) : (ours ? esc(ours.code) : '')}">${oursPer == null ? '<span style="font-size:11px;font-weight:500;">판매 안 함</span>' : `${Math.round(oursPer).toLocaleString('ko-KR')}${oursShipHtml(bestOurs || (ours && ours.price != null ? ours : null))}${(bestOurs || (ours && ours.price != null ? ours : null)) ? `<span style="display:block;font-size:10px;color:#475569;">판매가 ${won((bestOurs || ours).price)}</span>` : ''}`}</td>
        <td style="${C}">${vsMinBadge(oursPer, min)}</td>
        ${focusTds}
      </tr>`;
      let optRows = '';
      if (expanded) {
        const sizes = new Set();
        rows.filter(r => Number(r.t) === t && num(r.price)).forEach(r => sizes.add(num(r.sheets) || 1));
        oursOpts.forEach(o => sizes.add(o.sheets));
        optRows = [...sizes].sort((a, b) => a - b).map(s => {
          const optCells = cells.map(({ name, c }) => {
            const bg = focusNames.includes(name) ? `background:${FOCUS_BG};` : OPT_BG;
            const list = rows.filter(r => r.comp === name && Number(r.t) === t && (num(r.sheets) || 1) === s && num(r.price));
            if (!list.length) return `<td style="border-left:1px solid #eef2f7;${C}${bg}"><span style="color:#e2e8f0;">—</span></td>`;
            const bestRow = c && c.best ? c.best.r : null;
            const exBtn = editing && !viewOnly()
              ? `<span role="button" tabindex="0" title="이 옵션(${esc(name)} ${t}T ${s}장)을 표에서 빼고 이후 수집에서도 거릅니다" onclick="hkCmpExclude('${table.id}',${comps.indexOf(name)},${t},${s})" style="float:right;cursor:pointer;color:#94a3b8;font-size:11px;margin-left:4px;"><i class="fa-solid fa-xmark"></i></span>` : '';
            const lines = list.map(r => {
              const d = derive(table, r);
              const ship = num(r.ship);
              const a1 = areaOf(r.spec), a0 = areaOf(table.size);
              const conv = a1 && a0 && a1 !== a0 ? ` · ×${Math.round(a0 / a1 * 100) / 100} 환산` : '';
              const calc = `${num(r.price).toLocaleString('ko-KR')}${ship != null ? ` + 배송 ${Math.round(ship / everyForCompare(r)).toLocaleString('ko-KR')}` : ''}`;
              const val = d && d.real != null
                ? `<b style="color:#334155;">${Math.round(d.real).toLocaleString('ko-KR')}</b>`
                : '<span style="font-size:11px;color:#fca5a5;">배송비 입력 필요</span>';
              const mark = bestRow === r ? '<span style="color:#16a34a;font-weight:700;"> ✓</span>' : '';
              return `<div style="font-size:11px;color:#64748b;line-height:1.45;">${r.spec && a1 !== a0 ? `${esc(r.spec)} · ` : ''}${calc}${conv}</div><div style="font-size:13px;">→ ${val}${mark}</div>`;
            }).join('<div style="height:4px;"></div>');
            return `<td style="border-left:1px solid #eef2f7;${C}${bg}">${exBtn}${lines}</td>`;
          }).join('');
          const myOpts = oursOpts.filter(o => o.sheets === s);
          const oursCell = myOpts.length
            ? `<td style="${OPT_BG}${C}border-left:1px solid #e2e8f0;">${myOpts.map(o => `<div style="font-size:11px;color:#64748b;line-height:1.45;" title="${esc(o.code)}">${o.price.toLocaleString('ko-KR')}${o.ship ? ` + 배송 ${Math.round(perItemShip(o.ship, o.every)).toLocaleString('ko-KR')}` : ' · 무료배송'}</div><div style="font-size:13px;">→ <b style="color:#334155;">${Math.round(o.per).toLocaleString('ko-KR')}</b>${bestOurs === o ? '<span style="color:#16a34a;font-weight:700;"> ✓</span>' : ''}</div>`).join('<div style="height:4px;"></div>')}</td>`
            : `<td style="${OPT_BG}${C}border-left:1px solid #e2e8f0;"><span style="color:#e2e8f0;">—</span></td>`;
          return `<tr>
            <td style="${C}font-size:12px;color:#64748b;${OPT_BG}border-right:1px solid #e2e8f0;">${s}장 묶음</td>
            ${optCells}
            ${oursCell}
            <td style="${OPT_BG}"></td>
            ${focusShown.map(() => `<td style="${OPT_BG}"></td>`).join('')}
          </tr>`;
        }).join('');
      }
      return styleGroup(finalRow + optRows, gi);
    }).join('');
    const compactBody = bodyRows.replace(/<td([^>]*)>/g, (m, attrs) => attrs.includes('style="')
      ? `<td${attrs.replace('style="', 'style="padding:11px 6px;background:#fff;')}>`
      : `<td${attrs} style="padding:11px 6px;background:#fff;">`);


    const hint = viewOnly() ? '' : '칸은 장당 실구매가이고 배송비는 업체의 N개마다를 5개 기준으로 환산해 넣습니다. 배송비는 [편집]에서 칸마다 입력합니다';
    return `<div style="margin-top:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;">
        <div>
          <div style="font-size:14px;font-weight:700;color:#1e293b;">${esc(table.title)} <span style="font-size:11px;font-weight:500;color:#94a3b8;">${hint}</span></div>
          ${opts.inlineStatus ? `<div class="hk-cmp-status" style="font-size:11px;color:#94a3b8;margin-top:3px;">${statusHtml()}</div>` : ''}
        </div>
        <div style="display:flex;gap:8px;">
          ${viewOnly() ? '' : `<button type="button" class="pricing-margin-edit-btn" onclick="hkCmpCollect('${table.id}')" title="등록된 경쟁사 상품 주소를 크롬 확장이 열어 옵션별 판매가를 읽어 옵니다(통합 확장 0.32.5 이상). 옵션 해석은 결과 창에서 고칠 수 있습니다."><i class="fa-solid fa-people-arrows"></i> 경쟁사 가격 확인</button>`}
          ${editing ? `<button type="button" class="pricing-margin-edit-btn" onclick="hkCmpAddComp('${table.id}')"><i class="fa-solid fa-plus"></i> 경쟁사 추가</button>` : ''}
          <button type="button" class="pricing-margin-edit-btn hk-cmp-view-ok" onclick="hkCmpSheetAll('${table.id}')" title="두께마다 옵션(묶음) 구성을 펼치거나 접습니다"><i class="fa-solid fa-list"></i> 옵션 줄 ${thicknesses.every(t => isOpen(t)) ? '모두 접기' : '모두 펼치기'}</button>
          ${viewOnly() ? '' : `<button type="button" class="pricing-margin-edit-btn" onclick="hkCmpToggleEdit('${table.categoryId}')" title="${editing ? '편집을 끝냅니다' : '배송비 입력, 주목 업체 설정을 할 수 있습니다'}"><i class="fa-solid fa-${editing ? 'check' : 'pen'}"></i> ${editing ? '편집 완료' : '편집'}</button>`}
          ${viewOnly() ? '' : '<button type="button" class="pricing-margin-edit-btn" onclick="hkCmpSave()"><i class="fa-solid fa-floppy-disk"></i> 저장</button>'}
        </div>
      </div>
      <div class="pricing-table-scroll" style="border:1px solid #e2e8f0;border-radius:10px;">
        <table class="pricing-table" style="min-width:${360 + comps.length * 130 + focusShown.length * 130}px;">${head.replace(/<(td|th)([^>]*)>/g, (m, tag, attrs) => (attrs.includes('style="') ? `<${tag}${attrs.replace('style="', 'style="padding:10px 6px;')}>` : `<${tag}${attrs} style="padding:10px 6px;">`))}<tbody>${compactBody}</tbody></table>
      </div>
      ${excludedListHtml(table)}
      <details style="margin-top:16px;"><summary style="cursor:pointer;font-size:13px;font-weight:600;color:#64748b;">옵션별 상세 (업체 · 두께 · 규격 · 묶음별 원본 줄)</summary>${tableHtml(table, listId)}</details>
    </div>`;
  }

  /* 제외한 옵션 목록 — [편집] 중에만 보이고, [되돌리기]를 누르면 다시 수집 대상이 된다(지운 가격은 다음 수집 때 다시 들어온다). */
  function excludedListHtml(table) {
    const list = state.exclude[table.id] || [];
    if (!list.length || !editingOn(table)) return '';
    const items = list.map(key => {
      const [comp, t, sheets] = key.split('|');
      return `<span style="display:inline-flex;align-items:center;gap:6px;margin:3px 8px 3px 0;padding:2px 8px;border:1px solid #e2e8f0;border-radius:999px;background:#f8fafc;font-size:12px;color:#475569;">${esc(comp)} ${esc(t)}T ${esc(sheets)}장
        <span role="button" tabindex="0" onclick="hkCmpUnexclude('${table.id}','${esc(key).replace(/'/g, '&#39;')}')" title="제외를 풀고 다시 수집 대상으로 되돌립니다" style="cursor:pointer;color:#4f46e5;font-weight:600;">되돌리기</span></span>`;
    }).join('');
    return `<div style="margin-top:12px;font-size:12px;color:#64748b;"><b style="color:#334155;">제외한 옵션</b> <span style="color:#94a3b8;">표에서 빼고 수집도 거릅니다</span><div style="margin-top:4px;">${items}</div></div>`;
  }

  /* 옵션 하나 제외 — 그 (업체, 두께, 장수) 줄을 지우고 이후 수집에서도 거른다. */
  window.hkCmpExclude = function (tableId, ci, t, sheets) {
    if (viewOnly()) return;
    const table = tableOf(tableId);
    const name = (matrixComps[tableId] || [])[ci];
    if (!table || !name) return;
    const list = state.exclude[tableId] = state.exclude[tableId] || [];
    const key = excludeKey(name, t, sheets);
    if (!list.includes(key)) list.push(key);
    state.rows[tableId] = (state.rows[tableId] || []).filter(r => !(r.comp === name && Number(r.t) === Number(t) && (num(r.sheets) || 1) === (num(sheets) || 1)));
    markDirty();
    rerender();
  };
  window.hkCmpUnexclude = function (tableId, key) {
    if (viewOnly()) return;
    state.exclude[tableId] = (state.exclude[tableId] || []).filter(k => k !== key);
    markDirty();
    rerender();
  };

  /* 두께 하나의 옵션(묶음) 줄 펼치기·접기 / 전체. 보기 전용에서도 쓴다. */
  window.hkCmpToggleSheetT = function (tableId, t) {
    const table = tableOf(tableId);
    if (!table) return;
    const ui = uiOf(table.categoryId);
    ui.sheetOpen = ui.sheetOpen || {};
    const k = `${tableId}|${t}`;
    ui.sheetOpen[k] = !ui.sheetOpen[k];
    rerender();
  };
  window.hkCmpSheetAll = function (tableId) {
    const table = tableOf(tableId);
    if (!table) return;
    const ui = uiOf(table.categoryId);
    ui.sheetOpen = ui.sheetOpen || {};
    const ts = [...new Set([...table.ours.map(d => d[0]), ...(state.rows[tableId] || []).map(r => Number(r.t))])];
    const allOpen = ts.every(t => ui.sheetOpen[`${tableId}|${t}`]);
    ts.forEach(t => { ui.sheetOpen[`${tableId}|${t}`] = !allOpen; });
    rerender();
  };

  /* 배송비 입력 — sheets(묶음 장수)를 주면 그 묶음의 줄에만, 안 주면 그 업체·두께의 모든 줄에 같은 값을 넣는다. */
  window.hkCmpEditSheetShip = function (tableId, ci, t, field, input, sheets) {
    if (viewOnly()) return;
    const table = tableOf(tableId);
    const name = (matrixComps[tableId] || [])[ci];
    if (!table || !name || !['ship', 'every'].includes(field)) return;
    const v = num(input.value);
    (state.rows[tableId] || [])
      .filter(r => r.comp === name && Number(r.t) === Number(t) && (sheets == null || (num(r.sheets) || 1) === Number(sheets)))
      .forEach(r => { r[field] = v == null ? '' : v; });
    markDirty();
    rerender();
  };

  function bodyHtml(cat) {
    if (!state.loaded) return '<div style="padding:16px 0;color:#94a3b8;font-size:13px;">경쟁사 가격을 불러오는 중입니다…</div>';
    const names = [...new Set(Object.values(state.rows).flat().map(r => r.comp).filter(Boolean))];
    const listId = `hkCmpCompanyNames-${cat}`;
    const ui = uiOf(cat);
    return `<datalist id="${listId}">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>`
      + TABLES.filter(table => table.categoryId === cat && table.id === ui.tableId)
        .map(table => (table.kind === 'unit' ? unitTableHtml(table, listId) : sheetMatrixHtml(table, listId))).join('');
  }

  function statusHtml() {
    if (state.saving) return '<span style="color:#64748b;">저장 중…</span>';
    if (state.dirty) return '<span style="color:#d97706;font-weight:600;">저장하지 않은 변경이 있습니다</span>';
    if (state.savedAt) return `<span>마지막 저장 ${esc(state.savedAt.toLocaleString('ko-KR'))}</span>`;
    return '';
  }

  /* 카테고리 맨 위 구역 — 가격 경쟁력 분석(막대) + 경쟁사 가격 입력표. 그 카테고리에 비교표가 없으면(스티로폼 등) 아무것도 안 그린다. */
  function sectionInner(cat) {
    if (!state.loaded && !state.loading) load();
    const ui = uiOf(cat);
    const noteHtml = state.note && (!state.noteCat || state.noteCat === cat)
      ? `<span style="color:${state.noteKind === 'error' ? '#dc2626' : '#64748b'};">${esc(state.note)}</span>` : '';
    const label = (HK_CATEGORIES.find(c => c.id === cat) || {}).label || '';
    if (usesViewToggle(cat)) ui.open = true;
    return `<div class="card pricing-result-card" style="margin-bottom:24px;">
      <div class="pricing-result-header"${ui.open ? '' : ' style="border-radius:12px;border-bottom:0;"'}>
        <div class="pricing-result-title">${esc(label)} 경쟁사 가격 · 가격 경쟁력<span class="pricing-spec-badge">한국단열 스마트스토어 기준</span>${!ui.open && state.dirty ? '<span class="pricing-result-hint" style="color:#d97706;font-weight:600;">저장하지 않은 변경이 있습니다</span>' : ''}</div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${!viewOnly() && ui.open && TABLES.some(t => t.categoryId === cat && t.kind !== 'unit') ? `<button type="button" class="pricing-margin-edit-btn" onclick="hkCmpImportScans('${cat}')" title="확장으로 수집한 경쟁사 옵션 가격(competitor_price_scans)을 업체명·두께·규격으로 짝지어 판매가를 채웁니다. 표에 이미 있는 업체만 반영하고, 배송비·배송기준은 직접 입력합니다.">
            <i class="fa-solid fa-cloud-arrow-down"></i> 수집값 불러오기</button>` : ''}
          ${usesViewToggle(cat) ? '' : `<button type="button" class="hk-iso-accordion-toggle" onclick="hkCmpToggle('${cat}')" title="펼치기 / 접기" aria-label="경쟁사 가격 구역 펼치기 또는 접기"><i class="fa-solid fa-chevron-down hk-iso-accordion-chevron"${ui.open ? ' style="transform:rotate(180deg);color:#4f46e5;"' : ''}></i></button>`}
        </div>
      </div>
      ${ui.open ? `
      <div id="hkCmpAnalysis-${cat}">${analysisInnerHtml(cat)}</div>
      <div style="padding:6px 22px 20px;">
        <div class="pricing-result-hint hk-cmp-status-line" style="min-height:18px;margin-top:8px;"><span class="hk-cmp-status">${statusHtml()}</span> ${noteHtml}</div>
        <div id="hkComparePaneBody-${cat}">${bodyHtml(cat)}</div>
      </div>` : ''}
    </div>`;
  }

  function viewBarHtml(cat) {
    const v = uiOf(cat).view;
    const btn = (key, icon, label) => `<button type="button" class="bead-subtab${v === key ? ' active' : ''}" onclick="hkCmpSetView('${cat}','${key}')"><i class="fa-solid ${icon}" style="margin-right:6px;"></i>${label}</button>`;
    return `<div class="bead-subtab-bar hk-cmp-viewbar" style="margin-bottom:16px;">${btn('calc', 'fa-calculator', '단가 계산')}${btn('compare', 'fa-people-arrows', '경쟁사 비교')}</div>`;
  }

  function sectionBody(cat) {
    if (!usesViewToggle(cat)) return sectionInner(cat);
    return viewBarHtml(cat) + (uiOf(cat).view === 'compare' ? sectionInner(cat) : '');
  }

  /* ─── 카드 제목 옆 [경쟁사 비교] 단추 — 누르면 그 카테고리 '기준 판매가' 카드의 단가표 전체(상위 탭·아코디언)가 경쟁사 화면으로 바뀐다 ───
     경쟁사 화면 = 표 고르기 칩(규격·상품군, 상위 탭 자리) → 가격표(매트릭스) → 경쟁력 그래프. 한 번 더 누르면 단가 계산으로 돌아온다.
     고른 보기·표는 이 화면을 보는 동안만 기억한다(저장 안 함 — 페이지를 새로 열면 항상 단가 계산). */
  const CARD_CATS = ['hk_isopink', 'hk_bead', 'hk_reflective', 'hk_wallpaper', 'hk_etc']; // 맨 위 비교 구역을 빼고 카드 단추만 쓰는 카테고리
  const cardMem = {};
  const cardTable = {}; // 카테고리마다 비교 화면에서 고른 표(없으면 칩의 첫 번째)
  try {
    Object.keys(localStorage).filter(k => k.startsWith('hkCmpAccView:')).forEach(k => localStorage.removeItem(k)); // 이전 버전이 남긴 값 정리
  } catch { /* 저장소를 못 쓰면 그대로 */ }
  const cardView = cat => cardMem[cat] || 'calc';
  const cardBtnInner = v => (v === 'compare'
    ? '<i class="fa-solid fa-calculator"></i> 단가 계산'
    : '<i class="fa-solid fa-people-arrows"></i> 경쟁사 비교');
  const tableLabel = t => t.chip || String(t.size || '').replace('x', '×') || t.title.replace(/^.*경쟁사 가격 비교표 – /, '');

  /* 비교 화면의 표 칩(상위 탭 자리) + 고른 표의 가격표·그래프 */
  function cardPanelInner(cat) {
    // 칩 순서 — 계열(스티로폼→네오폴)은 정의 순서 그대로, 같은 계열 안에서는 작은 규격(600×900)부터. 단가 계산 화면의 순서와 같다.
    const seriesOrder = [];
    const seriesOf = t => { const k = t.id.split('_')[0]; if (!seriesOrder.includes(k)) seriesOrder.push(k); return seriesOrder.indexOf(k); };
    const areaOf = t => (String(t.size || '').split('x').map(Number).reduce((a, b) => a * b, 1) || 0);
    const catTables = TABLES.filter(t => t.categoryId === cat);
    catTables.forEach(seriesOf);
    catTables.sort((a, b) => seriesOf(a) - seriesOf(b) || areaOf(a) - areaOf(b));
    if (!catTables.length) return '';
    const ui = uiOf(cat);
    const table = catTables.find(t => t.id === cardTable[cat]) || catTables[0];
    const chips = catTables.length > 1
      // 단가 계산 화면의 상위 탭과 같은 높이(두 줄)가 되도록 작은 설명 줄을 같이 둔다
      ? subtabBar(catTables.map(t => ({ key: t.id, label: tableLabel(t), sub: t.kind === 'unit' ? (ui.withShip ? '판매가+배송비' : '판매가') : '장당 실구매가' })),
        table.id, key => `hkCmpCardPick('${cat}','${key}')`)
      : '';
    return `${chips}<div class="hk-cmp-card-body">${accPanelInner(table)}</div>`;
  }

  window.hkCompareCardParts = function (cat) {
    if (!CARD_CATS.includes(cat) || !TABLES.some(t => t.categoryId === cat)) return { btn: '', panel: '', view: 'calc' };
    const view = cardView(cat);
    return {
      view,
      btn: `<button type="button" class="hk-cmp-card-btn" data-cat="${cat}" onclick="hkCmpCardToggle('${cat}')" title="이 단가표 전체를 경쟁사 가격 비교 화면으로 바꾸고, 다시 누르면 단가 계산으로 돌아옵니다">${cardBtnInner(view)}</button>`,
      panel: `<div class="hk-cmp-card-panel" data-cat="${cat}">${view === 'compare' ? cardPanelInner(cat) : ''}</div>`,
    };
  };

  /* 경쟁력 그래프(막대) — 선택한 표 하나만. 맨 위 구역의 분석과 같은 막대·요약이다. */
  function barsOnlyHtml(table) {
    const shown = analysisGroups(table).groups;
    const values = shown.flatMap(g => [g.ours, ...g.comps.map(c => c.value)]).filter(v => v != null);
    const scale = values.length ? Math.max(...values) * 1.02 : 1;
    const swatch = color => `<i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};margin-right:4px;"></i>`;
    const focus = focusOf(table);
    const legend = `<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:#64748b;margin-top:10px;">
      <span>${swatch(BAR.compLow)}경쟁사 최저가까지</span><span>${swatch(BAR.compRange)}최저~최고 구간</span>${focus.length ? `<span>${swatch(FOCUS_TICK)}★ 주목 업체(${esc(focus.join(', '))})</span>` : ''}
      <span>${swatch(BAR.ours)}${esc(table.oursLabel || '한국단열')} 장당 실구매가</span></div>`;
    return `<div style="margin-top:6px;">
      <div style="font-size:13px;color:#334155;font-weight:500;">${esc(analysisSummary(table))}</div>
      ${legend}
      <div style="margin-top:6px;">${shown.map(g => barHtml(g, scale, focus)).join('')}</div>
    </div>`;
  }

  /* unit 표(열반사·단열벽지·기타단열재)의 경쟁력 그래프 — 길이 탭·두께 탭과 막대. 길이는 표마다 다르니 고른 길이가 이 표에 없으면 첫 길이로 옮긴다. */
  function unitAnalysisParts(table) {
    const cat = table.categoryId;
    const ui = uiOf(cat);
    if (!table.lengths.includes(ui.len)) ui.len = table.lengths[0];
    const len = ui.len;
    const whole = analysisGroups(table);
    whole.thicknesses = whole.thicknesses.filter(t => whole.groups.some(g => g.t === t));
    const lenTabs = table.lengths.length > 1
      ? subtabBar(table.lengths.map(l => ({ key: l, label: `${l}M`, sub: table.lengthNote && table.lengthNote[l] ? table.lengthNote[l] : '' })), len, key => `hkCmpPickLen('${cat}',${key})`)
      : '';
    const tNow = whole.thicknesses.includes(ui.t) ? ui.t : whole.thicknesses[0];
    const tabs = whole.thicknesses.length > 1
      ? subtabBar(whole.thicknesses.map(t => ({ key: t, label: `${t}T` })), tNow, key => `hkCmpPickT('${cat}',${key})`) : '';
    const shown = whole.groups.filter(g => g.t === tNow);
    const values = shown.flatMap(g => [g.ours, ...g.comps.map(c => c.value)]).filter(v => v != null);
    const scale = values.length ? Math.max(...values) * 1.02 : 1;
    const swatch = color => `<i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};margin-right:4px;"></i>`;
    const focus = focusOf(table);
    const legend = `<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:#64748b;margin-top:10px;">
      <span>${swatch(BAR.compLow)}경쟁사 최저가까지</span><span>${swatch(BAR.compRange)}최저~최고 구간</span>${focus.length ? `<span>${swatch(FOCUS_TICK)}★ 주목 업체(${esc(focus.join(', '))})</span>` : ''}
      <span>${swatch(BAR.ours)}${esc(table.oursLabel || '한국단열')} ${len}M ${ui.withShip ? '판매가+배송비' : '판매가'}</span></div>`;
    const bars = `<div style="margin-top:6px;">
      <div style="font-size:13px;color:#334155;font-weight:500;">${esc(analysisSummary(table))}</div>
      ${legend}
      <div style="margin-top:6px;">${shown.map(g => barHtml(g, scale, focus)).join('')}</div>
    </div>`;
    return { lenTabs, tabs, bars };
  }

  /* 단가표 자리에 들어가는 경쟁사 화면 — 가격표(매트릭스)가 먼저, 경쟁력 그래프는 그 아래. */
  function accPanelInner(table) {
    if (!state.loaded && !state.loading) load();
    if (!state.loaded) return '<div style="padding:16px 0;color:#94a3b8;font-size:13px;">경쟁사 가격을 불러오는 중입니다…</div>';
    const noteHtml = state.note
      ? `<span style="color:${state.noteKind === 'error' ? '#dc2626' : '#64748b'};">${esc(state.note)}</span>` : '';
    if (table.kind !== 'unit') {
      return `<div>
      ${noteHtml ? `<div class="pricing-result-hint" style="margin-top:2px;">${noteHtml}</div>` : ''}
      ${sheetMatrixHtml(table, `hkCmpCompanyNames-${table.id}`, { inlineStatus: true })}
      <div style="margin-top:26px;padding-top:16px;border-top:1px solid #e2e8f0;">
        <div style="font-size:14px;font-weight:700;color:#1e293b;">${esc(table.title)} · 경쟁력 그래프</div>
        ${barsOnlyHtml(table)}
      </div>
    </div>`;
    }
    return accUnitPanel(table, noteHtml);
  }

  function accUnitPanel(table, noteHtml) {
    const parts = unitAnalysisParts(table);
    return `<div>
      ${noteHtml ? `<div class="pricing-result-hint" style="margin-top:2px;">${noteHtml}</div>` : ''}
      ${parts.lenTabs}
      ${unitTableHtml(table, `hkCmpCompanyNames-${table.id}`, { inlineStatus: true })}
      <div style="margin-top:26px;padding-top:16px;border-top:1px solid #e2e8f0;">
        <div style="font-size:14px;font-weight:700;color:#1e293b;">${esc(table.title)} · 경쟁력 그래프</div>
        ${parts.tabs}
        ${parts.bars}
      </div>
    </div>`;
  }

  window.hkCmpCardToggle = function (cat) {
    if (!CARD_CATS.includes(cat)) return;
    cardMem[cat] = cardView(cat) === 'compare' ? 'calc' : 'compare';
    rerender();
  };
  window.hkCmpCardPick = function (cat, tableId) {
    const ui = uiOf(cat);
    cardTable[cat] = tableId;
    ui.tableId = tableId;
    ui.t = null;
    const next = tableOf(tableId);
    if (next && next.lengths && !next.lengths.includes(ui.len)) ui.len = next.lengths[0];
    rerender();
  };

  /* ─── 경쟁사 비교 엑셀용 데이터(2026-10-16) — js/pricing-hankook-excel.js의 [경쟁사 비교 엑셀]이 파일로 만든다 ───
     화면 표와 같은 값(5개를 샀을 때의 개당 배송비 기준)을 비교표마다 시트 줄(blocks)로 돌려준다. 링크는 주소 글자 그대로.
     cells의 항목: 글자/숫자, 또는 { v, z, diff } (z = 숫자 서식, diff = 부호에 따라 빨강/파랑). head 줄의 spans는 병합할 열 범위. */
  window.hkCompareExportSheets = async function () {
    if (!state.loaded) {
      if (!state.loading) await load();
      for (let i = 0; i < 100 && !state.loaded; i++) await new Promise(resolve => setTimeout(resolve, 100));
    }
    const won = v => (v == null || v === '' ? '' : { v: Number(v), z: '#,##0' });
    const diff = v => (v == null || v === '' ? '' : { v: Math.round(v), z: '+#,##0;-#,##0;0', diff: true });
    const shipDesc = (fee, every) => {
      if (fee == null) return '배송비 미입력';
      if (Number(fee) === 0) return '무료배송';
      const n = Number(every) || 1;
      return `${fmtWon(fee)} / ${n > 1 ? `${n}개마다` : '주문당'}${n > 1 && n !== COMPARE_EVERY ? ` → 5개 기준 ${fmtWon(Math.round(perItemShip(fee, n)))}` : ''}`;
    };
    const sheetNameOf = table => {
      const base = table.chip || `${(HK_CATEGORIES.find(c => c.id === table.categoryId) || {}).label || ''} ${String(table.size || '').replace('x', '×')}`.trim();
      return base.replace(/[\\/?*[\]:]/g, ' ').slice(0, 28);
    };
    const sheets = [];
    const usedNames = new Set();
    const uniqueName = name => { let n = name, i = 2; while (usedNames.has(n)) n = `${name.slice(0, 26)} ${i++}`; usedNames.add(n); return n; };

    const perTable = []; // 표마다 만든 줄 — 같은 카테고리(아이소핑크·스티로폼·기타단열재)는 아래에서 시트 하나로 모은다
    const catOrder = [];
    TABLES.forEach(t => { if (!catOrder.includes(t.categoryId)) catOrder.push(t.categoryId); });
    const seriesOrder = [];
    const seriesIdx = t => { const k = t.id.split('_')[0]; if (!seriesOrder.includes(k)) seriesOrder.push(k); return seriesOrder.indexOf(k); };
    const areaOf2 = t => (String(t.size || '').split('x').map(Number).reduce((a, b) => a * b, 1) || 0);
    TABLES.forEach(seriesIdx);
    const ordered = TABLES.slice().sort((a, b) => catOrder.indexOf(a.categoryId) - catOrder.indexOf(b.categoryId) || seriesIdx(a) - seriesIdx(b) || areaOf2(a) - areaOf2(b));
    ordered.forEach(table => {
      const rows = state.rows[table.id] || [];
      const focusNames = focusOf(table);
      const blocks = [];

      if (table.kind === 'sheet') {
        const seen = [];
        rows.forEach(r => { if (r.comp && !seen.includes(r.comp)) seen.push(r.comp); });
        extraList(table.id, 1).forEach(n => { if (!seen.includes(n)) seen.push(n); });
        const comps = seen.sort((a, b) => (focusNames.includes(b) ? 1 : 0) - (focusNames.includes(a) ? 1 : 0));
        const focusShown = comps.filter(n => focusNames.includes(n));
        const oursByT = new Map(table.ours.slice().reverse().map(def => [def[0], oursOf(table, def)]));
        const thicknesses = [...new Set([...oursByT.keys(), ...rows.map(r => Number(r.t))])].sort((a, b) => a - b);
        const bestOf = (name, t) => {
          const list = rows.filter(r => r.comp === name && Number(r.t) === t && num(r.price));
          if (!list.length) return null;
          const info = list.map(r => ({ r, d: derive(table, r) }));
          const withReal = info.filter(x => x.d && x.d.real != null);
          const best = withReal.length ? withReal.reduce((a, b) => (b.d.real < a.d.real ? b : a)) : null;
          const fallback = best ? null : info.filter(x => x.d).reduce((a, b) => (!a || b.d.perSheet < a.d.perSheet ? b : a), null);
          return { best, fallback };
        };
        const group = ['', '한국단열', '', '', '', '경쟁 최저', '', '최저가 대비', ...focusShown.map(n => `★ ${n} 대비`), ...comps.flatMap(n => [n, '', '', ''])];
        const spans = [[1, 4], [5, 6], ...comps.map((_, i) => { const c0 = 8 + focusShown.length + i * 4; return [c0, c0 + 3]; })];
        const fields = ['두께', '규격 × 장수', '장당 실구매가', '판매가', '배송', '장당 실구매가', '업체', '(우리 − 최저)', ...focusShown.map(() => '(우리 − ★)'),
          ...comps.flatMap(() => ['장당 실구매가', '묶음', '판매가', '배송'])];
        blocks.push({ kind: 'head', cells: group, spans });
        blocks.push({ kind: 'head', cells: fields });
        thicknesses.forEach((t, gi) => {
          const ours = oursByT.get(t);
          const oursOpts = ourOptionsOf(table, t);
          const bestOurs = oursOpts.length ? oursOpts.reduce((a, b) => (b.per < a.per ? b : a)) : null;
          const oursOpt = bestOurs || (ours && ours.price != null ? ours : null);
          const defPer = ours && ours.price != null ? (ours.price + perItemShip(ours.ship, ours.every)) / ours.sheets : null;
          const oursPer = bestOurs ? bestOurs.per : defPer;
          const cells = comps.map(name => ({ name, c: bestOf(name, t) }));
          const reals = cells.map(x => (x.c && x.c.best ? x.c.best.d.real : null)).filter(v => v != null);
          const min = reals.length ? Math.min(...reals) : null;
          const minName = min != null ? ((cells.find(x => x.c && x.c.best && x.c.best.d.real === min) || {}).name || '') : '';
          const row = [
            `${t}T`,
            oursOpt ? `${table.size}×${oursOpt.sheets}장` : '',
            oursPer != null ? won(Math.round(oursPer)) : '판매 안 함',
            oursOpt ? won(oursOpt.price) : '',
            oursOpt ? shipDesc(oursOpt.ship, oursOpt.every) : '',
            min != null ? won(Math.round(min)) : '',
            minName,
            oursPer != null && min != null ? diff(oursPer - min) : '',
            ...focusShown.map(name => {
              const c = bestOf(name, t);
              const ref = c && c.best ? c.best.d.real : null;
              return oursPer != null && ref != null ? diff(oursPer - ref) : '';
            }),
          ];
          cells.forEach(({ c }) => {
            if (c && c.best) { const { r, d } = c.best; row.push(won(Math.round(d.real)), num(r.sheets) || 1, won(num(r.price)), shipDesc(num(r.ship), num(r.every))); }
            else if (c && c.fallback) { const { r, d } = c.fallback; row.push('', num(r.sheets) || 1, won(num(r.price)), '배송비 미입력'); }
            else row.push('', '', '', '');
          });
          blocks.push({ kind: 'data', cells: row, band: gi % 2 });
        });
      } else {
        // 길이형(열반사·단열벽지·기타) — 길이마다 구간을 나눈다
        table.lengths.forEach(len => {
          const comps = matrixCompsOf(table, len)
            .filter(name => rows.some(r => r.comp === name && rowLen(r) === len && num(r.price)))
            .sort((a, b) => (focusNames.includes(b) ? 1 : 0) - (focusNames.includes(a) ? 1 : 0));
          const focusShown = comps.filter(n => focusNames.includes(n));
          const thicknesses = [...new Set([...table.thicknesses, ...rows.map(r => Number(r.t))])].sort((a, b) => a - b);
          const sold = t => table.options.filter(opt => unitOurs(table, t, opt.key, len).price != null);
          const lines = [];
          thicknesses.forEach(t => sold(t).forEach(opt => lines.push({ t, opt })));
          if (!lines.length) return;
          const oursShipPer = shipPerUnit(table, shipKey(OURS_SHIP_KEY, len));
          const totalOf = (key, price) => { const per = shipPerUnit(table, key); return price + (per == null ? 0 : per); };
          blocks.push({ kind: 'group', cells: [`${lenText(table, len)} 기준`] });
          const group = ['', '', table.oursLabel || '한국단열', '', '', '경쟁 최저', '', '최저가 대비', ...focusShown.map(n => `★ ${n} 대비`), ...comps.flatMap(n => [n, '', ''])];
          const spans = [[2, 4], [5, 6], ...comps.map((_, i) => { const c0 = 8 + focusShown.length + i * 3; return [c0, c0 + 2]; })];
          const fields = ['두께', '제품 옵션', '판매가', '개당 배송', '합계', '합계', '업체', '(우리 − 최저)', ...focusShown.map(() => '(우리 − ★)'),
            ...comps.flatMap(() => ['판매가', '개당 배송', '합계'])];
          blocks.push({ kind: 'head', cells: group, spans });
          blocks.push({ kind: 'head', cells: fields });
          lines.forEach(({ t, opt }, li) => {
            const ours = unitOurs(table, t, opt.key, len);
            const oursTotal = ours.price + (oursShipPer == null ? 0 : oursShipPer);
            const priced = comps.map(name => {
              const r = rows.find(x => x.comp === name && Number(x.t) === t && x.opt === opt.key && rowLen(x) === len && num(x.price));
              return r ? { name, price: num(r.price), per: shipPerUnit(table, shipKey(name, len)), total: totalOf(shipKey(name, len), num(r.price)) } : { name, price: null };
            });
            const totals = priced.filter(x => x.price != null).map(x => x.total);
            const min = totals.length ? Math.min(...totals) : null;
            const minName = min != null ? (priced.find(x => x.price != null && x.total === min) || {}).name || '' : '';
            const row = [
              `${t}T`, opt.label, won(ours.price), oursShipPer == null ? '' : won(Math.round(oursShipPer)), won(Math.round(oursTotal)),
              min != null ? won(Math.round(min)) : '', minName,
              min != null ? diff(oursTotal - min) : '',
              ...focusShown.map(name => { const x = priced.find(p => p.name === name); return x && x.price != null ? diff(oursTotal - x.total) : ''; }),
            ];
            priced.forEach(x => {
              if (x.price == null) row.push('', '', '');
              else row.push(won(x.price), x.per == null ? '배송비 미입력' : won(Math.round(x.per)), won(Math.round(x.total)));
            });
            blocks.push({ kind: 'data', cells: row, band: li % 2 });
          });
        });
      }
      if (!blocks.length) return;
      perTable.push({ table, blocks });
    });

    // 카테고리별 시트 — 표가 여러 개인 카테고리(아이소핑크 2, 스티로폼·네오폴 4, 기타단열재 2)는 시트 하나에 구분 줄로 이어 붙인다
    const note = '배송비는 5개를 샀을 때의 개당 값으로 환산해 판매가에 더한 값입니다(한국단열·경쟁사 모두).';
    const sheetLabel = { hk_isopink: '아이소핑크', hk_bead: '스티로폼', hk_etc: '기타단열재' };
    catOrder.forEach(catId => {
      const items = perTable.filter(x => x.table.categoryId === catId);
      if (!items.length) return;
      if (items.length === 1) {
        const t = items[0].table;
        const single = { hk_reflective: '열반사', hk_wallpaper: '단열벽지' }[catId];
        sheets.push({ name: uniqueName(single || sheetNameOf(t)), title: t.title, sub: note, blocks: items[0].blocks });
        return;
      }
      const label = sheetLabel[catId] || ((HK_CATEGORIES.find(c => c.id === catId) || {}).label || catId);
      const blocks = [];
      items.forEach((item, index) => {
        if (index) blocks.push({ kind: 'blank', cells: [''] });
        const t = item.table;
        const part = t.chip || `${label} ${String(t.size || '').replace('x', '×')}`;
        blocks.push({ kind: 'group', cells: [part] });
        item.blocks.forEach(b => blocks.push(b));
      });
      sheets.push({ name: uniqueName(label), title: `${label} 경쟁사 가격 비교`, sub: note, blocks });
    });

    // 경쟁사 원본 줄 — 표마다 따로 읽기 불편한 값을 한 표로(링크는 주소 글자 그대로)
    const detail = [{ kind: 'head', cells: ['비교표', '업체', '두께', '규격·옵션', '길이(M)', '묶음(장)', '판매가', '배송비', '배송 기준(개)', '5개 기준 개당 배송비', '확인일', '링크'] }];
    TABLES.forEach(table => {
      (state.rows[table.id] || []).filter(r => r.comp && num(r.price)).forEach(r => {
        const sheetKind = table.kind === 'sheet';
        const optLabel = sheetKind ? (r.spec || table.size) : ((table.options.find(o => o.key === r.opt) || {}).label || r.opt || '');
        const ship = num(r.ship), every = num(r.every);
        detail.push({ kind: 'data', band: 0, cells: [
          table.title.replace(/ 경쟁사 가격 비교표.*/, '') + (sheetKind ? ` ${String(table.size || '').replace('x', '×')}` : ''),
          r.comp, `${r.t}T`, optLabel, sheetKind ? '' : rowLen(r), sheetKind ? (num(r.sheets) || 1) : '',
          won(num(r.price)), ship == null ? '' : won(ship), every == null ? '' : every,
          ship == null ? '' : won(Math.round(perItemShip(ship, every))), r.checked || '', r.link || '',
        ] });
      });
    });
    if (detail.length > 1) sheets.push({ name: uniqueName('경쟁사 원본'), title: '경쟁사 가격 원본 줄', sub: '표마다 입력·수집된 줄을 그대로 모았습니다. 링크는 주소 글자입니다(복사해서 브라우저에 붙여 넣기).', blocks: detail });
    return { sheets, savedAt: state.savedAt || null };
  };

  window.hkCompareSectionHtml = function (cat) {
    if (CARD_CATS.includes(cat)) return '';
    if (!TABLES.some(t => t.categoryId === cat)) return '';
    return `<div class="hk-cmp-section" data-cat="${cat}" data-view="${viewOf(cat)}">${sectionBody(cat)}</div>`;
  };

  function rerender() {
    const startedAt = performance.now();
    rerenderBody();
    const took = performance.now() - startedAt;
    if (took > 100) console.warn(`[경쟁사 비교] 다시 그리기 ${Math.round(took)}ms — 느리면 이 값을 알려 주세요`);
  }

  function rerenderBody() {
    document.querySelectorAll('.hk-cmp-section').forEach(el => {
      el.dataset.view = viewOf(el.dataset.cat);
      el.innerHTML = sectionBody(el.dataset.cat);
    });
    // 기준 판매가 카드 안의 경쟁사 화면 — 카드의 보기(data-cmp-view)와 단추 글자도 같이 맞춘다
    document.querySelectorAll('.hk-cmp-card-panel').forEach(el => {
      const cat = el.dataset.cat;
      const view = cardView(cat);
      const card = el.closest('.pricing-result-card');
      if (card) card.dataset.cmpView = view;
      const btn = card && card.querySelector('.hk-cmp-card-btn');
      if (btn) btn.innerHTML = cardBtnInner(view);
      el.innerHTML = view === 'compare' ? cardPanelInner(cat) : '';
    });
  }

  window.hkCmpSetView = function (cat, view) {
    if (!usesViewToggle(cat)) return;
    const ui = uiOf(cat);
    ui.view = view === 'compare' ? 'compare' : 'calc';
    if (ui.view === 'compare') ui.open = true; // 비교 보기에서는 구역을 항상 펼친다
    try { localStorage.setItem(viewKey(cat), ui.view); } catch { /* 기억 못 해도 이번 화면에서는 동작 */ }
    rerender();
  };

  function setStatus() {
    document.querySelectorAll('.hk-cmp-status').forEach(el => { el.innerHTML = statusHtml(); });
  }

  // 탭을 열 때마다 한국단열 현재 가격을 다시 읽어 와서 방금 고친 값이 비교에 바로 반영되게 한다.
  window.hkCompareOnOpen = function () { rerender(); };

  /* ─── 불러오기 / 저장 ─── */
  async function load() {
    const c = client();
    state.loading = true;
    try {
      if (!c) throw new Error('Supabase에 연결되지 않았습니다');
      const { data, error } = await c.from('hk_settings').select('value,updated_at').eq('key', SETTING_KEY).limit(1);
      if (error) throw new Error(error.message || String(error));
      const saved = data && data[0];
      const rows = saved && saved.value && saved.value.rows;
      if (rows && typeof rows === 'object') {
        state.rows = {};
        const seededTables = [];
        TABLES.forEach(table => {
          if (Array.isArray(rows[table.id])) {
            state.rows[table.id] = rows[table.id].map(r => ({ ...r, id: state.nextId++ }));
          } else {
            // 나중에 새로 생긴 비교표(저장본에 아직 없음)는 그 표의 시드 값을 채워 둔다.
            state.rows[table.id] = seedTableRows(table);
            if (state.rows[table.id].length) seededTables.push(table.title); // 채울 예전 값이 없는 새 표(단열벽지)는 안내하지 않는다
          }
        });
        const savedLinks = saved.value.links;
        if (savedLinks && typeof savedLinks === 'object') {
          TABLES.forEach(table => { if (savedLinks[table.id]) state.links[table.id] = { ...(state.links[table.id] || {}), ...savedLinks[table.id] }; });
        }
        const savedCompanies = saved.value.companies;
        if (savedCompanies && typeof savedCompanies === 'object') {
          TABLES.forEach(table => {
            const entry = savedCompanies[table.id];
            if (!entry) return;
            if (Array.isArray(entry)) {
              // 예전 형식(길이 구분 없음): 가격 줄이 하나도 없는 업체만 1M 열로 남긴다
              entry.forEach(name => {
                if (!(state.rows[table.id] || []).some(r => r.comp === name)) { const l = extraList(table.id, 1, true); if (!l.includes(name)) l.push(name); }
              });
            } else {
              Object.entries(entry).forEach(([len, names]) => {
                const l = extraList(table.id, Number(len) || 1, true);
                (names || []).forEach(n => { if (!l.includes(n)) l.push(n); });
              });
            }
          });
        }
        const savedShipping = saved.value.shipping;
        if (savedShipping && typeof savedShipping === 'object') {
          TABLES.forEach(table => { if (savedShipping[table.id]) state.shipping[table.id] = { ...(state.shipping[table.id] || {}), ...savedShipping[table.id] }; });
        }
        const savedFocus = saved.value.focus;
        if (savedFocus && typeof savedFocus === 'object') {
          TABLES.forEach(table => { if (Array.isArray(savedFocus[table.id])) state.focus[table.id] = savedFocus[table.id].map(String); });
        }
        const savedMap = saved.value.optionMap;
        if (savedMap && typeof savedMap === 'object') {
          TABLES.forEach(table => { if (savedMap[table.id] && typeof savedMap[table.id] === 'object') state.optionMap[table.id] = savedMap[table.id]; });
        }
        const savedExclude = saved.value.exclude;
        if (savedExclude && typeof savedExclude === 'object') {
          TABLES.forEach(table => { if (Array.isArray(savedExclude[table.id])) state.exclude[table.id] = savedExclude[table.id].map(String); });
        }
        state.savedAt = saved.updated_at ? new Date(saved.updated_at) : null;
        state.dirty = seededTables.length > 0;
        state.note = seededTables.length ? `새 비교표(${seededTables.join(', ')})에 예전 값을 채워 두었습니다 — 확인 후 [저장]을 눌러 확정하세요.` : '';
      } else {
        state.rows = seedRows();
        state.dirty = true;
        state.note = '아직 저장된 자료가 없어 예전 비교표 값을 채워 두었습니다 — 확인 후 [저장]을 눌러 확정하세요.';
      }
    } catch (e) {
      state.rows = seedRows();
      state.dirty = true;
      state.note = `저장된 값을 불러오지 못해 예전 비교표 값을 보여 줍니다 (${e.message})`;
      state.noteKind = 'error';
    }
    // 보기 전용에는 [저장]이 없으니 '저장하지 않은 변경'·'[저장]을 눌러 확정' 안내는 내지 않는다(불러오기 오류 안내만 남김).
    if (viewOnly()) { state.dirty = false; if (state.noteKind !== 'error') state.note = ''; }
    state.loaded = true;
    state.loading = false;
    rerender();
  }

  window.hkCmpSave = async function () {
    if (viewOnly()) return;
    const c = client();
    if (!c) { toast('Supabase에 연결되지 않았습니다', 'error'); return; }
    state.saving = true; setStatus();
    const rows = {};
    TABLES.forEach(table => {
      rows[table.id] = (state.rows[table.id] || []).map(({ id, ...rest }) => rest)
        .filter(r => r.comp || r.price)
        .filter(r => table.kind !== 'unit' || unitOurs(table, Number(r.t), r.opt, rowLen(r)).price != null);
    });
    const links = {};
    TABLES.forEach(table => {
      const names = new Set(matrixCompsAll(table));
      links[table.id] = Object.fromEntries(Object.entries(state.links[table.id] || {})
        .filter(([key, url]) => asList(url).length && names.has(key.split('@')[0])).map(([key, url]) => [key, asList(url)]));
    });
    const shipping = {};
    TABLES.forEach(table => {
      if (table.kind !== 'unit') return;
      const names = new Set([...matrixCompsAll(table), OURS_SHIP_KEY]);
      shipping[table.id] = Object.fromEntries(Object.entries(state.shipping[table.id] || {}).filter(([key, v]) => names.has(key.split('@')[0]) && v && (v.fee !== '' && v.fee != null)));
    });
    const companies = {};
    TABLES.forEach(table => {
      const byLen = {};
      [...new Set([...(table.lengths || [1]), ...(state.rows[table.id] || []).map(rowLen)])].forEach(len => {
        const names = matrixCompsOf(table, len);
        if (names.length) byLen[len] = names;
      });
      companies[table.id] = byLen;
    });
    const now = new Date().toISOString();
    const focus = {};
    TABLES.forEach(table => {
      const names = new Set(matrixCompsAll(table));
      const list = focusOf(table).filter(n => names.has(n));
      if (list.length) focus[table.id] = list;
    });
    const { error } = await c.from('hk_settings').upsert({ key: SETTING_KEY, value: { version: 1, rows, links, shipping, companies, focus, optionMap: Object.fromEntries(TABLES.filter(t => state.optionMap[t.id] && Object.keys(state.optionMap[t.id]).length).map(t => [t.id, state.optionMap[t.id]])), exclude: Object.fromEntries(TABLES.filter(t => (state.exclude[t.id] || []).length).map(t => [t.id, state.exclude[t.id]])) }, updated_at: now }, { onConflict: 'key' });
    state.saving = false;
    if (error) { toast(`저장 실패: ${error.message || error}`, 'error'); setStatus(); return; }
    state.dirty = false; state.savedAt = new Date(now); state.note = ''; state.noteKind = ''; state.noteCat = null;
    toast('경쟁사 가격이 저장되었습니다.', 'success');
    rerender();
  };

  /* ─── 편집 ─── */
  function markDirty() { state.dirty = true; setStatus(); }

  function refreshRow(table, row) {
    if (table.kind === 'unit') {
      const el = document.getElementById(`hkc-${row.id}-diff`);
      if (el) el.innerHTML = diffHtml(num(row.price), unitOurs(table, Number(row.t), row.opt, rowLen(row)).price);
      renderAnalysis(table.categoryId);
      return;
    }
    const ours = table.ours.find(def => def[0] === Number(row.t));
    const o = ours ? oursOf(table, ours) : null;
    const oursReal = o && o.price != null ? (o.price + perItemShip(o.ship, o.every)) / o.sheets : null;
    const d = derive(table, row);
    const set = (suffix, html) => { const el = document.getElementById(`hkc-${row.id}-${suffix}`); if (el) el.innerHTML = html; };
    set('per', fmt(d?.perSheet));
    set('ship', fmt(d?.shipPer));
    set('real', fmt(d?.real));
    set('diff', diffHtml(d?.real, oursReal));
    renderAnalysis(table.categoryId);
  }

  window.hkCmpEdit = function (tableId, rowId, field, input) {
    const table = tableOf(tableId);
    const row = (state.rows[tableId] || []).find(r => r.id === rowId);
    if (!table || !row) return;
    const raw = input.value.trim();
    if (['sheets', 'price', 'ship', 'every'].includes(field)) {
      const n = num(raw);
      row[field] = n == null ? '' : n;
      input.value = n == null ? '' : n.toLocaleString('ko-KR');
    } else {
      row[field] = raw;
    }
    if (field !== 'link' || raw) row.checked = today(); // 값을 고친 날을 확인일로 남긴다
    markDirty();
    if (['comp', 'link'].includes(field)) rerender(); else refreshRow(table, row);
  };

  window.hkCmpAddRow = function (tableId, t, opt) {
    const table = tableOf(tableId);
    if (!table) return;
    const list = state.rows[tableId] = state.rows[tableId] || [];
    if (table.kind === 'unit') {
      const lastUnit = [...list].reverse().find(r => r.comp && Number(r.t) === Number(t)) || [...list].reverse().find(r => r.comp);
      list.push({ id: state.nextId++, comp: lastUnit ? lastUnit.comp : '', t, opt, price: '', link: '', checked: '' });
      markDirty();
      rerender();
      return;
    }
    // 같은 업체의 배송비·배송기준은 두께가 달라도 거의 같아서, 이 표의 마지막 줄 값을 복사해 둔다.
    const last = [...list].reverse().find(r => r.comp);
    list.push({ id: state.nextId++, comp: last ? last.comp : '', t, spec: table.size, sheets: 1, price: '', ship: last ? last.ship : '', every: last ? last.every : '', link: '', checked: '' });
    markDirty();
    rerender();
  };

  window.hkCmpDelRow = function (tableId, rowId) {
    const list = state.rows[tableId] || [];
    const i = list.findIndex(r => r.id === rowId);
    if (i < 0) return;
    list.splice(i, 1);
    markDirty();
    rerender();
  };

  /* ─── 확장 수집값 가져오기 ─── */
  /* 옵션 이름(option_label)에서 먼저 읽고, 없는 항목만 상품명(product_name)에서 읽는다 — 상품명에는 옵션과 다른 규격·두께가 같이 적혀 있는 경우가 많다
     (예: 상품명 "…벽산1호 10T 400X600" 안의 옵션 "600x900 / 한영 특호90T(1장)"). */
  function parseScan(scan) {
    const SIZE = /(\d{3,4})\s*[x×X*]\s*(\d{3,4})/, THICK = /(\d{1,3})\s*[Tt]\b/, QTY = /(\d+)\s*장/;
    const sources = [String(scan.option_label || ''), String(scan.product_name || '')];
    const pick = re => { for (const text of sources) { const m = text.match(re); if (m) return m; } return null; };
    const size = pick(SIZE), thick = pick(THICK), qty = pick(QTY);
    if (!size || !thick) return null;
    return { spec: `${size[1]}x${size[2]}`, area: Number(size[1]) * Number(size[2]), t: Number(thick[1]), sheets: qty ? Number(qty[1]) : 1 };
  }

  /* 열반사 옵션 해석 — 두께(T)·길이(1M만)·등급·접착 여부가 모두 읽혀야 한다. 하나라도 못 읽으면 null(건너뜀).
     항목마다 옵션 이름(option_label)에서 먼저 찾고, 없을 때만 상품명(product_name)에서 찾는다 — 상품명에는 옵션과 반대 말이 같이 있는 경우가 많다
     (예: 상품명 "…단면은박비점착" 안의 옵션 "C.단면은박/점착"). 등급은 단면은박=일반형, 양면은박=고급형으로 본다(메가론 A~D 옵션 기준 추정). 점착 = 접착. */
  function parseUnitScan(scan) {
    const sources = [String(scan.option_label || ''), String(scan.product_name || '')];
    const firstOf = detect => { for (const text of sources) { const v = detect(text); if (v != null) return v; } return null; };
    const t = firstOf(text => { const m = text.match(/(\d{1,2})\s*[Tt]\b/) || text.match(/(\d{1,2})\s*(?:mm|㎜)/); return m ? Number(m[1]) : null; });
    const length = firstOf(text => {
      const wide = text.match(/(\d+(?:\.\d+)?)\s*[mM]\s*[xX×*]\s*(\d+(?:\.\d+)?)\s*[mM]\b/); // 폭 x 길이("1m X 5m") → 길이는 뒤쪽
      if (wide) return Number(wide[2]);
      const m = text.match(/(\d+(?:\.\d+)?)\s*(?:[mM]\b|미터)/);
      return m ? Number(m[1]) : null;
    });
    // 같은 상점에 섞여 있는 다른 제품(단열벽지, 동박 단열재)은 이 표의 대상이 아니라 해석 불가로 세지 않고 건너뛴다(undefined).
    if (/벽지|동박/.test(sources[0])) return undefined;
    if (t == null || length == null) return null; // 두께나 길이를 못 읽음(길이가 표에 없으면 호출 쪽이 조용히 건너뛴다)
    const adhesive = firstOf(text => (/비\s*(?:접착|점착)|무\s*(?:접착|점착)|비접|접착\s*없/.test(text) ? false : (/점착|접착/.test(text) ? true : null)));
    // 1면 = 단면(일반), 2면 = 양면(고급) — 업체마다 표기가 달라 같이 읽는다(예: "(1면 은박)")
    const grade = firstOf(text => (/양면|2\s*면|고급|프리미엄|이중/.test(text) ? 'D' : (/단면|1\s*면|한\s*면|일반|기본|스탠다드/.test(text) ? 'S' : null)));
    if (adhesive == null || grade == null) return null;
    return { t, len: length, opt: grade + (adhesive ? 'A' : 'N') };
  }

  /* 단열벽지 옵션 해석 — 길이만 읽으면 된다(경쟁사 옵션은 무늬뿐이고 두께·등급·접착 구분이 없다). 반환:
       undefined = 이 표의 상품이 아님(폼블럭·부자재·다른 두께 등 → 조용히 건너뜀)
       null      = 길이를 못 읽음('옵션 해석 불가')
       { t, len } = 표의 길이(경쟁사 2.5M는 2.3M로 옮김).
     · 제외 단어는 옵션 이름에서만 찾는다 — 상품명에는 "…곰팡이폼블럭…"처럼 단열벽지 상품에도 폼블럭이 같이 적혀 있다.
     · 두께가 적혀 있고 표의 두께(5T)가 아니면 다른 제품이다(은동이샵의 1mm 크레파펠·8mm 블럭아이). 안 적힌 업체는 그대로 통과.
     · 길이는 옵션 이름 맨 뒤쪽 'N M'(폭×길이라 "1Mx10M"·"50cmX10M"은 뒤쪽), 없으면 상품명의 첫 'N M'. cm·mm·소수점(2.5M)은 따로 처리한다.
     · 둘 다 없으면 호출 쪽이 그 상품 주소가 등록된 길이로 보강한다(fallbackLen). */
  function parseWallpaperScan(scan, table, ctx = {}) {
    const label = String(scan.option_label || ''), name = String(scan.product_name || '');
    if ((table.skipLabel || /폼블럭|스프레이|본드|애니핀|부자재|동박|열반사|아이소핑크|스티로폼/).test(label)) return undefined;
    const tableT = (table.thicknesses || [5])[0];
    let thickness = null;
    for (const text of [label, name]) {
      const m = text.match(/두께\s*(\d+(?:\.\d+)?)\s*(?:mm|㎜)/i) || text.match(/(\d+(?:\.\d+)?)\s*(?:mm|㎜)(?![a-zA-Z])/i) || text.match(/(?:^|[^\d.A-Za-z])(\d{1,2})\s*T\b/);
      if (m) { thickness = Number(m[1]); break; }
    }
    // 표기만 다르고 실제로는 같은 두께로 보는 경우(사용자 확인: 와우비전 '4T'는 사실상 5T) — table.thicknessAlias {표기: 표 두께}
    let aliased = false;
    if (thickness != null && thickness !== tableT) {
      if (table.thicknessAlias && table.thicknessAlias[thickness] === tableT) aliased = true;
      else return undefined;
    }
    const lengths = text => [...text.matchAll(/(\d+(?:\.\d+)?)\s*[mM](?![a-zA-Z])/g)].map(m => Number(m[1]));
    const inLabel = lengths(label), inName = lengths(name);
    // 길이를 옵션 이름에서 고르는 방식: 기본은 맨 뒤쪽 값(폭×길이), table.lengthPick === 'max'는 가장 큰 값(폭이 뒤에 오는 표기 대비)
    const pickIn = list => (table.lengthPick === 'max' ? Math.max(...list) : list[list.length - 1]);
    // 옵션 이름에 길이가 없을 때 상품명의 길이를 빌려 쓰는 규칙(단열벽지 업체 대부분 — 옵션이 무늬뿐)은 부자재가 섞인 페이지에서 위험하다
    // (구구난방: 상품명 "…1m세트" 안의 옵션 "전선몰딩 1,000원"이 1M 상품으로 잡혔다). table.nameLengthOnlyIfNoLabel 표는 옵션 이름이 있는데
    // 길이가 없으면 다른 물건으로 보고 건너뛰고, 옵션이 아예 없는 단일 상품 페이지일 때만 상품명 길이를 쓴다.
    // 단, 그 페이지에 길이가 적힌 옵션이 하나도 없으면(옵션이 색상·디자인뿐인 상품: 캠핑가오리 '디자인(색상) 랜덤', 리오캠핑 '그레이색 단열재')
    // 전부 같은 상품의 변형이라 상품명 길이(없으면 등록한 길이)를 쓴다 — 길이 있는 옵션이 같이 있을 때만 길이 없는 옵션을 다른 물건으로 본다.
    const noOption = !label.trim() || /옵션\s*없음/.test(label);
    if (table.nameLengthOnlyIfNoLabel && !inLabel.length && !noOption && ctx.pageHasLabelLength) return undefined;
    const raw = inLabel.length ? pickIn(inLabel) : (inName.length ? inName[0] : null);
    if (raw == null) return null;
    const len = (table.lengthAlias && table.lengthAlias[raw]) || raw;
    if (!table.lengths.includes(len)) return undefined; // 우리가 안 파는 길이(5M·9.5M·19.8M·30M 등)는 대상이 아니다
    return { t: tableT, len, aliased };
  }

  /* ─── 경쟁사 가격 확인(크롬 확장) ───
     에너가드 '경쟁사 가격 확인'과 같은 흐름: 단가표 안 버튼 → 확장이 업체별 상품 주소를 백그라운드 탭으로 하나씩 열어 옵션·가격을 읽음 →
     결과 창에서 이전 값과 비교 → [변경 적용]. 확장은 옵션을 있는 그대로 돌려주고(kind:'compscan'), 일반/고급·접착·1M 짝짓기는 여기(parseUnitScan)서 한다. */
  const COLLECT_MIN_EXTENSION = '0.32.5';
  const SMARTSTORE_PRODUCT = /^https:\/\/smartstore\.naver\.com\/[^/]+\/products\/\d+\/?$/;

  function extRequest(action, payload) {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();
      const timer = setTimeout(() => { window.removeEventListener('message', listener); reject(Error('확장 연결이 없습니다. 통합 확장을 업데이트·리로드한 뒤 이 관리자 페이지도 새로고침해 주세요.')); }, 8000);
      function listener(event) {
        if (event.source !== window || event.origin !== location.origin || event.data?.type !== 'EG_PRICE_TEST_RESPONSE' || event.data.requestId !== requestId) return;
        clearTimeout(timer); window.removeEventListener('message', listener);
        event.data.result?.ok ? resolve(event.data.result) : reject(Error(event.data.result?.error || '요청 실패'));
      }
      window.addEventListener('message', listener);
      window.postMessage({ type: 'EG_PRICE_TEST_REQUEST', requestId, action, payload }, location.origin);
    });
  }

  function versionLess(a, b) {
    const l = String(a).split('.').map(Number), r = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(l.length, r.length); i++) { const d = (l[i] || 0) - (r[i] || 0); if (d) return d < 0; }
    return false;
  }

  function collectTargets(table) {
    const seenLinks = new Set();
    const items = [];
    if (table.kind === 'sheet') {
      sheetVendors(table).forEach(name => asList((state.links[table.id] || {})[name]).forEach(link => {
        if (SMARTSTORE_PRODUCT.test(link) && !seenLinks.has(link)) { seenLinks.add(link); items.push({ name, link }); }
      }));
      return items;
    }
    const lens = [...new Set([...(table.lengths || [1]), ...(state.rows[table.id] || []).map(rowLen)])].sort((a, b) => a - b);
    lens.forEach(len => matrixCompsOf(table, len).forEach(name => companyLinks(table, name, len).forEach(link => {
      if (SMARTSTORE_PRODUCT.test(link) && !seenLinks.has(link)) { seenLinks.add(link); items.push({ name, link }); }
    })));
    return items;
  }

  /* ─── 아이소핑크(sheet) 수집 ───
     옵션 이름에서 규격·두께·묶음 장수를 읽는다(parseSheetOption). 업체마다 표기가 달라 틀리기 쉬운 품목이라, 사용자가 결과 창에서 고친 해석은
     업체별 '옵션 매핑표'(state.optionMap[표][업체][상품번호|옵션이름])에 저장해 다음 수집부터 그대로 쓴다. 매핑이 없으면 자동 해석을 초안으로 쓰고
     (결과 창에 '자동' 표시), 못 읽으면 '매핑 필요'로 따로 보인다. 브랜드(벽산 1호/한영 특호)는 보지 않는다. */
  function sheetVendors(table) {
    const names = [];
    (state.rows[table.id] || []).forEach(r => { if (r.comp && !names.includes(r.comp)) names.push(r.comp); });
    extraList(table.id, 1).forEach(n => { if (!names.includes(n)) names.push(n); });
    return names;
  }

  function parseSheetOption(raw) {
    const label = String(raw.label || ''), name = String(raw.productName || '');
    // 두께·묶음 장수는 옵션 이름에서만 읽는다 — 상품명의 "10T … 5장"은 그 상품의 대표 옵션 하나일 뿐이라 다른 옵션에 빌려 쓰면 틀린다.
    // 규격은 상품 안에서 거의 같아서 옵션 이름에 없으면 상품명에서 읽는다. 읽지 못하면 null → 결과 창에서 '매핑 필요'.
    // cm 표기: "90cm x 180cm x 10cm" = 900x1800, 두께 10cm = 100T. 두께가 따로 T·mm로 적혀 있으면 그쪽을 먼저 쓴다.
    const cm3 = text => {
      const m = text.match(/(\d{2,3})\s*cm\s*[x×X*]\s*(\d{2,3})\s*cm\s*[x×X*]\s*(\d{1,2}(?:\.\d)?)\s*cm/i);
      return m ? { spec: `${Number(m[1]) * 10}x${Number(m[2]) * 10}`, t: Math.round(Number(m[3]) * 10) } : null;
    };
    const cm2 = text => {
      const m = text.match(/(\d{2,3})\s*cm\s*[x×X*]\s*(\d{2,3})\s*cm/i);
      return m ? `${Number(m[1]) * 10}x${Number(m[2]) * 10}` : null;
    };
    const mm = label.match(/(\d{3,4})\s*[x×X*]\s*(\d{3,4})/) || name.match(/(\d{3,4})\s*[x×X*]\s*(\d{3,4})/);
    const c3 = cm3(label);
    const spec = mm ? `${mm[1]}x${mm[2]}` : (c3 ? c3.spec : (cm2(label) || cm2(name)));
    // "10T", "10T(1cm)", "10Tx600x450"(T 바로 뒤 x) 모두 읽는다
    const thick = label.match(/(\d{1,3})\s*[Tt](?![a-wyzA-WYZ가-힣])/) || label.match(/(\d{1,3})\s*(?:mm|㎜)/);
    const t = thick ? Number(thick[1]) : (c3 ? c3.t : null);
    const qty = label.match(/(\d+)\s*장/);
    if (!spec || t == null) return null;
    return { spec, t, sheets: qty ? Number(qty[1]) : 1 };
  }

  /* 옵션 규격이 이 표(table.size)에 들어가는지 — 같은 면적이거나 절반(600x450 → 600x900, 장당 값은 ×2 환산)이면 이 표. */
  function specFitsTable(table, spec) {
    const a = areaOf(spec), t = areaOf(table.size);
    if (!a || !t) return false;
    // exactSizeOnly: 우리와 같은 크기만 비교한다(사용자 결정 2026-10-15, 900×1800 표 — 나라단열 900×900 반장 옵션은 제외).
    return a === t || (!table.exactSizeOnly && a * 2 === t);
  }

  const mapKeyOf = raw => `${String(raw.link || '').match(/\/products\/(\d+)/)?.[1] || ''}|${String(raw.label || '').trim()}`;

  function sheetCollectResults(table, scanState) {
    const rawRows = (scanState && scanState.rows) || [];
    const current = state.rows[table.id] || [];
    const keyOf = (comp, t, spec, sheets) => `${comp}|${t}|${spec}|${sheets}`;
    const sold = new Set(table.ours.map(d => d[0])); // 한국단열이 파는 두께만 비교한다
    const results = [];
    const byKey = new Map();
    const usable = r => r.status !== '품절' && r.status !== '가격 확인 불가' && r.actual > 0;
    const pushCell = (key, entry) => {
      if (!byKey.has(key)) { byKey.set(key, results.length); results.push(entry); return; }
      const at = byKey.get(key), old = results[at];
      if ((usable(entry) && !usable(old)) || (usable(entry) && usable(old) && entry.actual < old.actual)) results[at] = entry;
    };
    const seen = new Set(), okComps = new Set(), failedComps = new Set(), unreadable = new Set();
    const foreign = new Map(); // 상품 주소 → 끼어든 다른 두께 옵션 수(나라단열)
    const gradeSkip = new Map(); // 상품 주소 → 기준이 아닌 호수 옵션 수(스티로폼 3호·네오폴 2호 기준)
    const log = []; // 수집된 원본 옵션마다 어떻게 처리했는지(결과 창 '수집 원본 옵션 보기')
    const note = (raw, why) => log.push({ comp: raw.name, label: raw.label, price: raw.soldOut ? null : raw.finalPrice, soldOut: !!raw.soldOut, link: raw.link, why });
    rawRows.forEach(raw => {
      if (raw.status === '수집 실패') {
        failedComps.add(raw.name);
        results.push({ comp: raw.name, status: '수집 실패', note: raw.errorMsg || '', link: raw.link });
        return;
      }
      okComps.add(raw.name);
      const mapKey = mapKeyOf(raw);
      const saved = ((state.optionMap[table.id] || {})[raw.name] || {})[mapKey];
      if (saved && saved.ignore) { note(raw, '매핑에서 무시로 지정'); return; }
      const parsed = saved ? { spec: saved.spec, t: Number(saved.t), sheets: Number(saved.sheets) || 1 } : parseSheetOption(raw);
      if (!parsed) {
        const dup = `${mapKey}`;
        if (!unreadable.has(dup)) { unreadable.add(dup); results.push({ comp: raw.name, status: '매핑 필요', label: raw.label, mapKey, link: raw.link, sheet: true }); }
        note(raw, '해석 불가 → 매핑 필요');
        return;
      }
      // 끼어든 다른 두께 옵션 제외 — 업체 설정(ownThicknessVendors)이고, 사용자가 직접 매핑한 옵션은 그대로 존중한다.
      if (!saved && (table.ownThicknessVendors || []).includes(raw.name)) {
        const title = String(raw.productName || '');
        const ownMatch = title.match(/(\d{1,3})\s*(?:mm|㎜)/i) || title.match(/(\d{1,3})\s*[Tt]\b/);
        const ownCm = title.match(/\d{2,3}\s*cm\s*[x×X*]\s*\d{2,3}\s*cm\s*[x×X*]\s*(\d{1,2}(?:\.\d)?)\s*cm/i);
        const ownT = ownMatch ? Number(ownMatch[1]) : (ownCm ? Math.round(Number(ownCm[1]) * 10) : null);
        if (ownT != null && ownT !== parsed.t) {
          const f = foreign.get(raw.link) || { comp: raw.name, link: raw.link, count: 0, own: ownT };
          f.count++;
          foreign.set(raw.link, f);
          note(raw, `다른 두께 옵션 제외(상품 ${f.own}T, 옵션 ${parsed.t}T)`);
          return;
        }
      }
      // 호수 — 같은 상품에 1호~4호 옵션이 같이 있다(나라단열). 같은 두께·장수는 싼 값 하나만 남기므로, 기준 호수가 아니면 먼저 뺀다.
      if (!saved && table.gradeFilter) {
        const gm = String(raw.label || '').match(/(\d)\s*호/);
        if (gm && Number(gm[1]) !== table.gradeFilter) {
          const g = gradeSkip.get(raw.link) || { comp: raw.name, link: raw.link, count: 0, grades: new Set() };
          g.count++; g.grades.add(`${gm[1]}호`);
          gradeSkip.set(raw.link, g);
          note(raw, `다른 호수 제외(${gm[1]}호, 기준 ${table.gradeFilter}호)`);
          return;
        }
      }
      if (!specFitsTable(table, parsed.spec)) { note(raw, `이 표의 규격이 아님(${parsed.spec})`); return; } // 다른 규격 표의 옵션(또는 우리가 안 파는 규격)
      if (!sold.has(parsed.t)) { note(raw, `한국단열이 안 파는 두께(${parsed.t}T)`); return; }               // 한국단열이 안 파는 두께
      if (isExcluded(table, raw.name, parsed.t, parsed.sheets)) { note(raw, `제외로 지정한 옵션(${parsed.t}T ${parsed.sheets}장)`); return; } // [편집]의 옵션 줄 ✕로 제외
      note(raw, `${parsed.t}T ${parsed.spec} ${parsed.sheets}장${saved ? ' (매핑)' : ' (자동)'}${raw.soldOut ? ' · 품절' : ''}`);
      seen.add(keyOf(raw.name, parsed.t, parsed.spec, parsed.sheets));
      const cur = current.find(x => x.comp === raw.name && Number(x.t) === parsed.t && String(x.spec || table.size) === parsed.spec && (num(x.sheets) || 1) === parsed.sheets);
      const before = cur && num(cur.price) ? num(cur.price) : null;
      // 최소 구매수량이 N개(>1)인 상품은 페이지 기준가가 N개 금액이다(나라단열 10T: 5개 25,000원 = 1개 5,000원) → 개당으로 환산한다.
      // 옵션 추가금(delta)은 개당 값이라 기준가만 N으로 나눈 뒤 더한다(확장 0.32.6+).
      const minQty = Number(raw.minQty) > 1 ? Math.floor(Number(raw.minQty)) : 1;
      const actual = raw.finalPrice > 0 && minQty > 1
        ? (raw.basePay != null && raw.delta != null ? Math.round(raw.basePay / minQty) + raw.delta : Math.round(raw.finalPrice / minQty))
        : raw.finalPrice;
      let status;
      if (raw.soldOut) status = '품절';
      else if (!(actual > 0)) status = '가격 확인 불가';
      else if (before == null) status = '신규';
      else if (before === actual) status = '일치';
      else status = '변경';
      pushCell(keyOf(raw.name, parsed.t, parsed.spec, parsed.sheets), {
        comp: raw.name, t: parsed.t, spec: parsed.spec, sheets: parsed.sheets, sheet: true, mapKey, mapped: !!saved,
        optLabel: `${raw.label} → ${parsed.spec} ${parsed.sheets}장${saved ? '' : ' (자동)'}`, label: raw.label,
        before, actual, diff: before != null && actual > 0 ? actual - before : null, status, link: raw.link,
        // 확장 0.32.6+: 최종가가 어떻게 나왔는지(기준가 + 옵션 추가금) — 화면 가격과 다를 때 원인을 보려고 결과 창에 작게 보인다
        diag: raw.basePay != null || raw.delta != null
          ? `기준가 ${raw.basePay != null ? Number(raw.basePay).toLocaleString('ko-KR') : '?'} + 추가금 ${raw.delta != null ? Number(raw.delta).toLocaleString('ko-KR') : '?'}${raw.baseSale != null && raw.baseSale !== raw.basePay ? ` · 판매가 ${Number(raw.baseSale).toLocaleString('ko-KR')}` : ''}${raw.instantPrice != null && raw.instantPrice !== raw.finalPrice ? ` · 이 옵션 즉시할인가 ${Number(raw.instantPrice).toLocaleString('ko-KR')}` : ''}${raw.salePrice != null && raw.salePrice !== raw.finalPrice ? ` · 이 옵션 판매가 ${Number(raw.salePrice).toLocaleString('ko-KR')}` : ''}${raw.comboCount != null ? ` · 옵션 ${raw.comboCount}개` : ''}${minQty > 1 ? ` · 최소구매 ${minQty}개 → 개당 ${actual.toLocaleString('ko-KR')}` : ''}${minQty === 1 && raw.quantityFields && Object.keys(raw.quantityFields).some(k => /min/i.test(k)) ? ` · 수량필드 ${JSON.stringify(Object.fromEntries(Object.entries(raw.quantityFields).filter(([k]) => /min/i.test(k)))).slice(0, 200)}` : ''}`
          : '',
      });
    });
    gradeSkip.forEach(g => results.push({ comp: g.comp, status: '다른 호수 옵션 제외', note: `${table.gradeFilter}호 기준 · ${[...g.grades].join('·')} ${g.count}건`, optLabel: g.link.replace('https://smartstore.naver.com/', ''), link: g.link }));
    // 제외한 끼어든 옵션은 몇 건인지만 한 줄로 알려 준다(반영 대상 아님)
    foreign.forEach(f => results.push({ comp: f.comp, status: '다른 두께 옵션 제외', note: `${f.own}T 상품 · ${f.count}건`, optLabel: f.link.replace('https://smartstore.naver.com/', ''), link: f.link }));
    const finished = !!scanState && !scanState.running && scanState.done >= scanState.total;
    (finished ? current : []).forEach(x => {
      if (!okComps.has(x.comp) || failedComps.has(x.comp) || !num(x.price)) return;
      const spec = String(x.spec || table.size), sheets = num(x.sheets) || 1;
      if (seen.has(keyOf(x.comp, Number(x.t), spec, sheets))) return;
      results.push({ comp: x.comp, t: Number(x.t), spec, sheets, sheet: true, optLabel: `${spec} ${sheets}장`, before: num(x.price), actual: null, diff: null, status: '스토어에서 안 보임', link: x.link || '' });
    });
    results.log = log;
    return results;
  }

  /* 확장이 돌려준 원본 옵션 → 표의 (업체, 두께, 옵션)에 짝지어 이전 값과 비교한 행 목록. */
  function collectResults(table, scanState) {
    if (table.kind === 'sheet') return sheetCollectResults(table, scanState);
    const rawRows = (scanState && scanState.rows) || [];
    // 한 상품 페이지에 여러 길이가 들어 있어도, 사용자가 그 업체를 등록한 길이(그 길이 표에 있거나 그 길이에 주소를 적은 경우)에만 반영한다.
    const registered = (comp, len) => matrixCompsOf(table, len).includes(comp)
      || asList((state.links[table.id] || {})[len > 1 ? `${comp}@${len}` : comp]).length > 0;
    const current = state.rows[table.id] || [];
    const keyOf = (comp, t, opt, len) => `${comp}|${t}|${opt}|${len}`;
    const optLabel = (key, len) => `${len}M ${(table.options.find(o => o.key === key) || {}).label || key}`;
    const results = [];
    const byKey = new Map(); // 같은 칸 중복 정리용: 칸 키 → results 안의 위치
    const usable = r => r.status !== '품절' && r.status !== '가격 확인 불가' && r.actual > 0;
    const pushCell = (key, entry) => {
      if (!byKey.has(key)) { byKey.set(key, results.length); results.push(entry); return; }
      const at = byKey.get(key), old = results[at];
      if ((usable(entry) && !usable(old)) || (usable(entry) && usable(old) && entry.actual < old.actual)) results[at] = entry;
    };
    const seen = new Set();
    const okComps = new Set();
    const failedComps = new Set();
    const sharedGroups = new Map(); // 단열벽지: '업체|길이' → { comp, t, len, entries:[{price, soldOut, link}] }
    const unreadable = new Set();
    // 옵션 이름에 길이가 적힌 옵션이 있는 상품 페이지(주소) — 길이 없는 옵션을 다른 물건으로 볼지 정할 때 쓴다(parseWallpaperScan)
    const pagesWithLabelLength = new Set(rawRows.filter(raw => /(\d+(?:\.\d+)?)\s*[mM](?![a-zA-Z])/.test(String(raw.label || ''))).map(raw => raw.link));
    rawRows.forEach(raw => {
      if (raw.status === '수집 실패') {
        failedComps.add(raw.name);
        results.push({ comp: raw.name, status: '수집 실패', note: raw.errorMsg || '', link: raw.link });
        return;
      }
      okComps.add(raw.name);
      if (table.shared) {
        // 단열벽지 — 업체·길이마다 판매 중 최저가 하나를 대표값으로 쓴다(아래 sharedGroups 정리에서 결과 한 줄로 만든다).
        let parsed = parseWallpaperScan({ option_label: raw.label, product_name: raw.productName }, table, { pageHasLabelLength: pagesWithLabelLength.has(raw.link) });
        if (parsed === undefined) return;
        if (parsed === null) {
          // 옵션에도 상품명에도 길이가 없으면, 이 주소가 등록된 길이로 본다(한 길이에만 등록돼 있을 때)
          const lens = table.lengths.filter(l => asList((state.links[table.id] || {})[l > 1 ? `${raw.name}@${l}` : raw.name]).includes(raw.link));
          if (lens.length !== 1) {
            const dupKey = `${raw.name}|${raw.link}|해석불가`;
            if (!unreadable.has(dupKey)) { unreadable.add(dupKey); results.push({ comp: raw.name, status: '옵션 해석 불가', label: raw.label, link: raw.link }); }
            return;
          }
          parsed = { t: table.thicknesses[0], len: lens[0] };
        }
        if (!table.options.some(o => unitOurs(table, parsed.t, o.key, parsed.len).price != null)) return;
        const gKey = `${raw.name}|${parsed.len}`;
        const g = sharedGroups.get(gKey) || { comp: raw.name, t: parsed.t, len: parsed.len, entries: [] };
        g.entries.push({ price: raw.finalPrice, soldOut: !!raw.soldOut, link: raw.link, aliased: !!parsed.aliased });
        sharedGroups.set(gKey, g);
        return;
      }
      const unit = parseUnitScan({ option_label: raw.label, product_name: raw.productName });
      if (unit === undefined) return; // 벽지·동박 등 다른 제품
      if (unit && !table.lengths.includes(unit.len)) return; // 표에 없는 길이(15M 등)는 대상이 아니다
      if (!unit) { results.push({ comp: raw.name, status: '옵션 해석 불가', label: raw.label, link: raw.link }); return; }
      if (unitOurs(table, unit.t, unit.opt, unit.len).price == null) return; // 한국단열이 안 파는 옵션
      if (!registered(raw.name, unit.len)) {
        // 등록하지 않은 길이는 반영하지 않고 알려만 준다(원하면 그 길이 탭에서 [편집] → [경쟁사 추가]로 등록)
        pushCell(keyOf(raw.name, unit.t, unit.opt, unit.len), { comp: raw.name, t: unit.t, len: unit.len, opt: unit.opt, optLabel: optLabel(unit.opt, unit.len), label: raw.label, before: null, actual: raw.finalPrice, diff: null, status: '등록 안 된 길이', link: raw.link });
        return;
      }
      seen.add(keyOf(raw.name, unit.t, unit.opt, unit.len));
      const cur = current.find(x => x.comp === raw.name && Number(x.t) === unit.t && x.opt === unit.opt && rowLen(x) === unit.len);
      const before = cur && num(cur.price) ? num(cur.price) : null;
      const actual = raw.finalPrice;
      let status;
      if (raw.soldOut) status = '품절';
      else if (!(actual > 0)) status = '가격 확인 불가';
      else if (before == null) status = '신규';
      else if (before === actual) status = '일치';
      else status = '변경';
      pushCell(keyOf(raw.name, unit.t, unit.opt, unit.len), { comp: raw.name, t: unit.t, len: unit.len, opt: unit.opt, optLabel: optLabel(unit.opt, unit.len), label: raw.label, before, actual, diff: before != null && actual > 0 ? actual - before : null, status, link: raw.link });
    });
    // 단열벽지: 업체·길이마다 판매 중 최저가 하나를 결과 한 줄로 만든다(품절은 판매 중인 값이 없을 때만 '품절').
    const optKeys = table.options.map(o => o.key);
    sharedGroups.forEach(g => {
      // 표기가 다른 두께(4T → 5T로 봄)는 정확히 같은 두께 옵션이 하나라도 판매 중이면 그쪽만 쓴다
      const liveAll = g.entries.filter(e => !e.soldOut && e.price > 0);
      const exact = liveAll.filter(e => !e.aliased);
      const live = exact.length ? exact : liveAll;
      const usedAlias = live.length > 0 && live.every(e => e.aliased);
      optKeys.forEach(k => seen.add(keyOf(g.comp, g.t, k, g.len)));
      const actual = live.length ? Math.min(...live.map(e => e.price)) : null;
      const high = live.length ? Math.max(...live.map(e => e.price)) : null;
      const link = (live.find(e => e.price === actual) || g.entries[0]).link;
      const base = { comp: g.comp, t: g.t, len: g.len, opt: '*', optLabel: `${g.len}M 한국단열 전 상품 공통`, label: live.length ? `판매 중 ${live.length}개의 최저가` : '', link };
      if (!registered(g.comp, g.len)) { results.push({ ...base, before: null, actual, diff: null, status: '등록 안 된 길이' }); return; }
      const cur = current.find(x => x.comp === g.comp && Number(x.t) === g.t && rowLen(x) === g.len && num(x.price));
      const before = cur ? num(cur.price) : null;
      let status;
      if (!live.length) status = g.entries.some(e => e.soldOut) ? '품절' : '가격 확인 불가';
      else if (before == null) status = '신규';
      else if (before === actual) status = '일치';
      else status = '변경';
      const notes = [high > actual ? `최고 ${high.toLocaleString('ko-KR')}` : '', usedAlias ? `${Object.keys(table.thicknessAlias || {})[0] || ''}T를 ${g.t}T로 봄` : ''].filter(Boolean);
      results.push({ ...base, before, actual, hi: high > actual ? high : null, note: notes.join(' · '),
        diff: before != null && actual > 0 ? actual - before : null, status });
    });
    // 수집은 됐는데 표에 있던 옵션이 스토어에서 안 보이는 경우(판매 중지·옵션 삭제 가능성).
    // 수집이 끝난 뒤에만 판정한다 — 진행 중에는 한 업체의 다른 상품 페이지를 아직 안 읽었을 뿐이라 거짓으로 '안 보임'이 떴다 사라졌다.
    const finished = !!scanState && !scanState.running && scanState.done >= scanState.total;
    const missingShared = new Set();
    (finished ? current : []).forEach(x => {
      if (!okComps.has(x.comp) || failedComps.has(x.comp) || !num(x.price)) return;
      if (seen.has(keyOf(x.comp, Number(x.t), x.opt, rowLen(x)))) return;
      if (unitOurs(table, Number(x.t), x.opt, rowLen(x)).price == null) return;
      if (table.shared) {
        // 공통 대표값은 업체·길이마다 한 줄만 보여 준다
        const mk = `${x.comp}|${rowLen(x)}`;
        if (missingShared.has(mk)) return;
        missingShared.add(mk);
        results.push({ comp: x.comp, t: Number(x.t), len: rowLen(x), opt: '*', optLabel: `${rowLen(x)}M 한국단열 전 상품 공통`, before: num(x.price), actual: null, diff: null, status: '스토어에서 안 보임', link: x.link || '' });
        return;
      }
      results.push({ comp: x.comp, t: Number(x.t), len: rowLen(x), opt: x.opt, optLabel: optLabel(x.opt, rowLen(x)), before: num(x.price), actual: null, diff: null, status: '스토어에서 안 보임', link: x.link || '' });
    });
    return results;
  }

  function collectBadgeClass(status) {
    if (status === '일치') return 'good';
    if (status === '변경' || status === '신규') return 'mid';
    if (status === '수집 실패') return 'low';
    return 'neutral';
  }

  // 값은 그대로(일치)인데 상품 주소·최고가 기록만 새로 한 건수 — 이것만 있어도 [변경 적용]이 '반영할 변경이 없습니다'로 끝나지 않게 한다.
  let appliedLinks = 0;

  /* 가격은 그대로(일치)인데 상품 주소·최고가 기록만 새로 반영될 줄 수 — 이것만 있어도 [변경 적용]을 누를 수 있어야 한다. */
  function pendingRecords(table, results) {
    const list = state.rows[table.id] || [];
    if (table.kind === 'sheet') {
      return results.filter(r => r.status === '일치' && r.link).filter(r => {
        const cur = list.find(x => x.comp === r.comp && Number(x.t) === r.t && String(x.spec || table.size) === r.spec && (num(x.sheets) || 1) === r.sheets);
        return cur && cur.link !== r.link;
      }).length;
    }
    const flat = results.flatMap(r => (r.opt === '*' ? table.options.map(o => ({ ...r, opt: o.key })) : [r]));
    return flat.filter(r => r.status === '일치').filter(r => {
      const cur = list.find(x => x.comp === r.comp && Number(x.t) === r.t && x.opt === r.opt && rowLen(x) === (r.len || 1));
      if (!cur) return false;
      return (r.link && cur.link !== r.link) || (table.shared && (cur.hi || null) !== (r.hi || null));
    }).length;
  }

  function applyCollected(table, results) {
    const list = state.rows[table.id] = state.rows[table.id] || [];
    let applied = 0;
    appliedLinks = 0;
    if (table.kind === 'sheet') {
      // 업체·두께·규격·묶음 장수가 같은 줄의 가격을 갱신하고, 없으면 새 줄을 만든다(배송비·배송기준은 같은 업체·두께 줄에서 이어받고, 없으면 비워 [편집]에서 입력).
      results.filter(r => (r.status === '변경' || r.status === '신규') && r.actual > 0).forEach(r => {
        const cur = list.find(x => x.comp === r.comp && Number(x.t) === r.t && String(x.spec || table.size) === r.spec && (num(x.sheets) || 1) === r.sheets);
        if (cur) { cur.price = r.actual; cur.checked = today(); if (r.link) cur.link = r.link; }
        else {
          const sib = list.find(x => x.comp === r.comp && Number(x.t) === r.t && num(x.ship) != null);
          list.push({ id: state.nextId++, comp: r.comp, t: r.t, spec: r.spec, sheets: r.sheets, price: r.actual, ship: sib ? sib.ship : '', every: sib ? sib.every : '', link: r.link || '', checked: today() });
        }
        const kept = extraList(table.id, 1, true);
        if (!kept.includes(r.comp)) kept.push(r.comp);
        applied++;
      });
      let changed = false;
      results.filter(r => r.status === '일치' && r.link).forEach(r => {
        const cur = list.find(x => x.comp === r.comp && Number(x.t) === r.t && String(x.spec || table.size) === r.spec && (num(x.sheets) || 1) === r.sheets);
        if (cur && cur.link !== r.link) { cur.link = r.link; changed = true; appliedLinks++; }
      });
      if (changed) markDirty();
      return applied;
    }
    // 단열벽지의 공통 대표값(opt '*')은 한국단열 상품 4종 줄에 같은 값으로 풀어 넣는다(건수는 결과 한 줄 = 1건).
    const flat = results.flatMap(r => (r.opt === '*' ? table.options.map((o, i) => ({ ...r, opt: o.key, _first: i === 0 })) : [{ ...r, _first: true }]));
    flat.filter(r => (r.status === '변경' || r.status === '신규') && r.actual > 0).forEach(r => {
      const cur = list.find(x => x.comp === r.comp && Number(x.t) === r.t && x.opt === r.opt && rowLen(x) === (r.len || 1));
      if (cur) { cur.price = r.actual; cur.checked = today(); if (r.link) cur.link = r.link; if (r.hi) cur.hi = r.hi; else delete cur.hi; }
      else list.push({ id: state.nextId++, comp: r.comp, t: r.t, opt: r.opt, len: r.len || 1, price: r.actual, ...(r.hi ? { hi: r.hi } : {}), link: r.link || '', checked: today() });
      const kept = extraList(table.id, r.len || 1, true);
      if (!kept.includes(r.comp)) kept.push(r.comp);
      if (r.link && !companyLinks(table, r.comp, r.len || 1).length) (state.links[table.id] = state.links[table.id] || {})[(r.len || 1) > 1 ? `${r.comp}@${r.len}` : r.comp] = [r.link];
      if (r._first) applied++;
    });
    // 값은 그대로(일치)여도 그 칸이 읽힌 상품 페이지가 다르거나 최고가(hi)가 바뀌었으면 기록만 새로 한다
    let linkChanged = false;
    flat.filter(r => r.status === '일치').forEach(r => {
      const cur = list.find(x => x.comp === r.comp && Number(x.t) === r.t && x.opt === r.opt && rowLen(x) === (r.len || 1));
      if (!cur) return;
      if (r.link && cur.link !== r.link) { cur.link = r.link; linkChanged = true; appliedLinks++; }
      if (table.shared && (cur.hi || null) !== (r.hi || null)) { if (r.hi) cur.hi = r.hi; else delete cur.hi; linkChanged = true; appliedLinks++; }
    });
    if (linkChanged) markDirty();
    return applied;
  }

  window.hkCmpCollect = async function (tableId) {
    if (viewOnly()) return;
    const table = tableOf(tableId);
    if (!table || (table.kind !== 'unit' && table.kind !== 'sheet')) return;
    const targets = collectTargets(table);
    let dialog = document.getElementById('hkCompareCollectDialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'hkCompareCollectDialog';
      dialog.className = 'pv-dialog';
      document.body.appendChild(dialog);
    }
    dialog.innerHTML = `<div class="pricing-input-modal-header">
        <div class="pim-header-left">
          <span class="pim-title"><i class="fa-solid fa-people-arrows"></i> 경쟁사 가격 확인</span>
          <span class="pim-sub">${esc(table.title)}</span>
        </div>
        <button type="button" class="pim-close-btn" data-close><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="pv-body">
        <div class="pv-hint"><i class="fa-solid fa-circle-info"></i>
          <span>등록된 경쟁사 상품 주소를 크롬 확장이 하나씩 열어 옵션별 판매가를 읽어 옵니다(통합 확장 ${COLLECT_MIN_EXTENSION} 이상, 스마트스토어에 로그인된 크롬). 결과를 확인한 뒤 [변경 적용]을 누르면 표에 반영되고, [저장]은 따로 눌러야 합니다.</span>
        </div>
        <div class="pctd-actions">
          <button type="button" class="pim-btn-confirm" data-apply disabled><i class="fa-solid fa-check"></i> 변경 적용</button>
          <button type="button" class="pim-btn-cancel" data-pause><i class="fa-solid fa-pause"></i> 일시정지</button>
          <button type="button" class="pim-btn-cancel" data-resume><i class="fa-solid fa-forward"></i> 이어서</button>
          <label class="pctd-checkbox"><input type="checkbox" data-only checked> 확인 필요한 항목만</label>
          <label class="pctd-checkbox"><input type="checkbox" data-rawtoggle> 수집 원본 옵션 보기(사용/제외 사유)</label>
        </div>
        <div class="pctd-status-bar" data-statusbar><span data-status role="status">시작 중…</span></div>
        <div class="pv-summary" data-summary></div>
        <div class="pv-table" data-result></div>
        <div class="pv-table" data-raw style="margin-top:12px;display:none;"></div>
      </div>`;
    const q = sel => dialog.querySelector(sel);
    const statusEl = q('[data-status]'), statusBar = q('[data-statusbar]'), summary = q('[data-summary]'), resultEl = q('[data-result]'), rawEl = q('[data-raw]');
    let timer = null, snapshot = null, results = [], polling = false;
    const close = () => { clearInterval(timer); dialog.close(); };
    q('[data-close]').onclick = close;
    dialog.onclose = () => clearInterval(timer);
    if (!dialog.open) dialog.showModal();

    // 수집 원본 옵션 목록 — 읽은 옵션마다 사용/제외 사유. 결과 표에 안 보이는 옵션이 왜 빠졌는지 보려고 쓴다.
    function renderRaw() {
      const on = q('[data-rawtoggle]').checked && Array.isArray(results.log);
      rawEl.style.display = on ? '' : 'none';
      if (!on) return;
      const tableEl = document.createElement('table');
      const head = tableEl.insertRow();
      [['경쟁사', true], ['옵션 이름', true], ['가격'], ['처리', true]].forEach(([text, left]) => {
        const th = document.createElement('th'); th.textContent = text; if (left) th.className = 'pv-td-left'; head.appendChild(th);
      });
      results.log.forEach(item => {
        const tr = tableEl.insertRow();
        [[item.comp, true], [`${item.label || '(옵션 없음)'}${item.link ? `  ·  ${item.link.replace('https://smartstore.naver.com/', '')}` : ''}`, true],
          [item.soldOut ? '품절' : item.price], [item.why, true]].forEach(([value, left]) => {
          const td = tr.insertCell();
          td.textContent = value == null ? '—' : typeof value === 'number' ? value.toLocaleString('ko-KR') : String(value);
          if (left) td.className = 'pv-td-left';
        });
      });
      rawEl.replaceChildren(tableEl);
    }
    q('[data-rawtoggle]').onchange = render;

    // 옵션 해석 수정(아이소핑크) — "두께,규격,장수"로 고치거나 '무시'(비교 대상 아님). 비우면 저장된 매핑을 지우고 자동 해석으로 돌아간다.
    function editMapping(r) {
      const curText = r.t != null ? `${r.t},${r.spec},${r.sheets}` : '';
      const input = window.prompt(`"${r.label}" 옵션을 어떻게 볼까요?
형식: 두께,규격,장수 (예: 10,900x1800,5)
비교에서 뺄 옵션이면 '무시'를 입력하세요. 비우면 자동 해석으로 돌아갑니다.`, curText);
      if (input == null) return;
      const v = String(input).trim();
      const byTable = state.optionMap[table.id] = state.optionMap[table.id] || {};
      const byComp = byTable[r.comp] = byTable[r.comp] || {};
      if (v === '') delete byComp[r.mapKey];
      else if (v === '무시') byComp[r.mapKey] = { ignore: true };
      else {
        const m = v.match(/^(\d{1,3})\s*,\s*(\d{3,4})\s*[x×*]\s*(\d{3,4})\s*,\s*(\d+)$/i);
        if (!m) { toast('형식이 맞지 않습니다. 예: 10,900x1800,5', 'error'); return; }
        byComp[r.mapKey] = { t: Number(m[1]), spec: `${m[2]}x${m[3]}`, sheets: Number(m[4]) };
      }
      markDirty();
      render();
    }

    function render() {
      const st = snapshot;
      if (!st || st.kind !== 'compscan') { statusEl.textContent = '다른 검사 기록이 있어 이 수집 결과가 없습니다 — 다시 시작해 주세요.'; return; }
      results = collectResults(table, st);
      statusEl.textContent = `${st.done}/${st.total}개 링크 · ${st.running ? '진행 중' : st.reason || '완료'}${st.currentProduct ? ` · ${st.currentProduct.replace('https://smartstore.naver.com/', '')}` : ''}`;
      statusBar.classList.toggle('running', !!st.running);
      const counts = {};
      results.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
      summary.replaceChildren(...Object.entries(counts).map(([k, v]) => {
        const badge = document.createElement('span');
        badge.className = 'pricing-rate-badge ' + collectBadgeClass(k);
        badge.textContent = `${k} ${v}건`;
        return badge;
      }));
      renderRaw();
      q('[data-pause]').disabled = !st.running;
      q('[data-resume]').disabled = st.running || st.done >= st.total;
      const changes = results.filter(r => r.status === '변경' || r.status === '신규').length;
      const records = pendingRecords(table, results); // 가격은 같고 상품 주소만 새로 기록되는 줄
      q('[data-apply]').disabled = st.running || (!changes && !records);
      q('[data-apply]').innerHTML = `<i class="fa-solid fa-check"></i> 변경 적용${changes ? ` (${changes}건${records ? ` + 주소 ${records}건` : ''})` : (records ? ` (상품 주소 ${records}건)` : '')}`;
      const shown = results.filter(r => !q('[data-only]').checked || r.status !== '일치');
      if (!shown.length) { resultEl.innerHTML = '<p class="pricing-empty-msg"><i class="fa-solid fa-circle-check"></i> 표시할 항목이 없습니다.</p>'; return; }
      const tableEl = document.createElement('table');
      const head = tableEl.insertRow();
      [['경쟁사', true], ['두께', true], ['제품 옵션', true], ['기록된 가격'], ['실제 가격'], ['차액'], ['판정', true]].forEach(([text, left]) => {
        const th = document.createElement('th'); th.textContent = text; if (left) th.className = 'pv-td-left'; head.appendChild(th);
      });
      shown.forEach(r => {
        const tr = tableEl.insertRow();
        [[r.comp, true], [r.t != null ? `${r.t}T` : '—', true], [r.optLabel || r.label || '—', true], [r.before], [r.actual], [r.diff]].forEach(([value, left]) => {
          const td = tr.insertCell();
          td.textContent = value == null ? '—' : typeof value === 'number' ? value.toLocaleString('ko-KR') : String(value);
          if (left) td.className = 'pv-td-left';
        });
        if (r.diag && tr.cells[2]) {
          const small = document.createElement('div');
          small.style.cssText = 'font-size:10px;color:#94a3b8;margin-top:2px;';
          small.textContent = r.diag;
          tr.cells[2].appendChild(small);
        }
        const td = tr.insertCell(); td.className = 'pv-td-left';
        const badge = document.createElement('span');
        badge.className = 'pricing-rate-badge ' + collectBadgeClass(r.status);
        badge.textContent = r.status + (r.note ? ` (${r.note})` : '');
        td.appendChild(badge);
        if (r.sheet && r.mapKey) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'pricing-margin-edit-btn';
          btn.style.marginLeft = '8px';
          btn.textContent = r.status === '매핑 필요' ? '매핑 입력' : '매핑 수정';
          btn.onclick = () => editMapping(r);
          td.appendChild(btn);
        }
      });
      resultEl.replaceChildren(tableEl);
    }

    async function refresh() {
      if (polling) return;
      polling = true;
      try { const r = await extRequest('status'); snapshot = r.state; render(); }
      catch (e) { statusEl.textContent = e.message; }
      finally { polling = false; }
    }
    q('[data-only]').onchange = render;
    for (const action of ['pause', 'resume']) {
      q(`[data-${action}]`).onclick = async () => { try { await extRequest(action); await refresh(); } catch (e) { statusEl.textContent = e.message; } };
    }
    q('[data-apply]').onclick = () => {
      const toApply = results.filter(r => (r.status === '변경' || r.status === '신규') && r.actual > 0);
      const applied = applyCollected(table, results);
      // 길이마다 표가 독립이라, 반영된 값은 읽힌 길이의 표에 들어간다 — 지금 보는 길이가 아니면 그 길이로 옮겨 보여 주고 어디에 들어갔는지 알린다.
      const ui = uiOf(table.categoryId);
      const lensApplied = [...new Set(toApply.map(r => r.len || 1))].sort((a, b) => a - b);
      if (table.kind === 'unit' && applied && lensApplied.length && !lensApplied.includes(ui.len || 1)) { ui.len = lensApplied[0]; ui.t = null; }
      if (applied || appliedLinks) { markDirty(); rerender(); }
      const byComp = {};
      toApply.forEach(r => { (byComp[r.comp] = byComp[r.comp] || new Set()).add(r.len || 1); });
      const where = Object.entries(byComp).map(([name, lens]) => (table.kind === 'unit' ? `${name} ${[...lens].sort((a, b) => a - b).join('·')}M` : name)).join(', ');
      toast(applied ? `경쟁사 가격 ${applied}건을 표에 반영했습니다(${where}) — [저장]을 눌러 확정하세요.`
        : (appliedLinks ? `가격은 그대로이고 상품 주소 등 기록 ${appliedLinks}건을 표에 반영했습니다 — [저장]을 눌러 확정하세요.` : '반영할 변경이 없습니다.'),
      (applied || appliedLinks) ? 'success' : 'info');
      close();
    };

    try {
      if (!targets.length) throw Error('수집할 경쟁사 상품 주소가 없습니다 — [편집]에서 업체를 추가하며 상품 주소를 입력해 주세요.');
      statusEl.textContent = '확장 연결 확인 중…';
      const ext = await extRequest('ping');
      if (!ext.version || versionLess(ext.version, COLLECT_MIN_EXTENSION)) throw Error(`통합 확장을 ${COLLECT_MIN_EXTENSION} 이상으로 업데이트·리로드한 뒤 이 페이지를 새로고침해 주세요(현재 ${ext.version || '확인 불가'}).`);
      await extRequest('start', { kind: 'compscan', items: targets.map(item => ({ name: item.name, link: item.link })) });
      timer = setInterval(() => { if (dialog.open) refresh(); }, 3000);
      await refresh();
    } catch (error) {
      statusEl.textContent = error.message || '시작하지 못했습니다';
    }
  };

  window.hkCmpImportScans = async function (cat) {
    if (viewOnly()) return;
    const c = client();
    if (!c) { toast('Supabase에 연결되지 않았습니다', 'error'); return; }
    const { data, error } = await c.from('competitor_price_scans')
      .select('product_url,product_name,store_name,option_label,final_price,sold_out,collected_at')
      .order('collected_at', { ascending: false }).limit(3000);
    if (error) { toast(`수집값을 불러오지 못했습니다: ${error.message || error}`, 'error'); return; }

    // 같은 상품·옵션은 가장 최근 수집만 쓴다.
    const latest = new Map();
    (data || []).forEach(scan => {
      const key = `${scan.store_name}|${scan.product_url}|${scan.option_label}`;
      if (!latest.has(key)) latest.set(key, scan);
    });

    // 수집 테이블은 에너가드 경쟁사 수집과 같이 쓰므로(에너가드컴퍼니·크린슐라 등도 들어 있다) 이 표에 이미 있는 업체만 반영한다.
    // 새 업체는 업체명을 적은 줄을 하나 추가한 뒤 다시 불러오면 된다 — 건너뛴 업체명은 결과 안내에 알려 준다.
    const known = new Set(Object.values(state.rows).flat().map(r => String(r.comp || '').trim()).filter(Boolean));
    const skipped = new Map();
    let unparsedUnit = 0;

    // 표 안에서 같은 (업체, 두께, 장수, 규격)이 여러 개면 가장 싼 값을 쓴다.
    const picked = new Map();
    latest.forEach(scan => {
      if (!scan.store_name || !scan.final_price || scan.sold_out) return;
      const text = `${scan.product_name || ''} ${scan.option_label || ''}`;
      const related = TABLES.filter(table => (!cat || table.categoryId === cat) && table.keyword.test(text));
      if (!related.length) return;
      // 스토어 이름이 표의 업체명을 포함하면 같은 업체로 본다(예: 스토어 "이지하우스 메가론" → 표의 "메가론"). 표에는 표의 이름으로 쓴다.
      const rawStore = String(scan.store_name).trim();
      const squash = text => String(text).replace(/\s+/g, '');
      const store = known.has(rawStore) ? rawStore : ([...known].find(name => squash(rawStore).includes(squash(name))) || null);
      if (!store) { skipped.set(rawStore, (skipped.get(rawStore) || 0) + 1); return; }
      const checked = String(scan.collected_at || '').slice(0, 10);
      related.forEach(table => {
        if (table.kind === 'unit') {
          const unit = parseUnitScan(scan);
          if (unit === undefined) return;
          if (unit && !table.lengths.includes(unit.len)) return;
          if (!unit) { unparsedUnit++; return; }
          const key = `${table.id}|${store}|${unit.t}|${unit.opt}|${unit.len}`;
          const prev = picked.get(key);
          if (!prev || scan.final_price < prev.price) {
            picked.set(key, { tableId: table.id, unit: true, comp: store, t: unit.t, len: unit.len, opt: unit.opt, price: scan.final_price, link: scan.product_url || '', checked });
          }
          return;
        }
        const parsed = parseScan(scan);
        if (!parsed) return;
        const tableArea = areaOf(table.size);
        const ratio = tableArea / parsed.area;
        if (ratio !== 1 && ratio !== 2) return; // 같은 규격이거나 정확히 절반 규격(600x450 등)만 이 표에 넣는다
        if (isExcluded(table, store, parsed.t, parsed.sheets)) return; // 제외로 지정한 옵션
        const key = `${table.id}|${store}|${parsed.t}|${parsed.spec}|${parsed.sheets}`;
        const prev = picked.get(key);
        if (!prev || scan.final_price < prev.price) {
          picked.set(key, { tableId: table.id, comp: store, t: parsed.t, spec: parsed.spec, sheets: parsed.sheets, price: scan.final_price, link: scan.product_url || '', checked });
        }
      });
    });

    let updated = 0, added = 0;
    picked.forEach(item => {
      const list = state.rows[item.tableId] = state.rows[item.tableId] || [];
      if (item.unit) {
        const sameUnit = list.find(r => r.comp === item.comp && Number(r.t) === item.t && r.opt === item.opt && rowLen(r) === item.len);
        if (sameUnit) {
          if (Number(sameUnit.price) !== item.price) updated++;
          sameUnit.price = item.price;
          sameUnit.checked = item.checked;
          if (!sameUnit.link && item.link) sameUnit.link = item.link;
        } else {
          list.push({ id: state.nextId++, comp: item.comp, t: item.t, opt: item.opt, len: item.len, price: item.price, link: item.link, checked: item.checked });
          added++;
        }
        return;
      }
      const same = list.find(r => r.comp === item.comp && Number(r.t) === item.t && Number(r.sheets) === item.sheets && areaOf(r.spec) === areaOf(item.spec));
      if (same) {
        if (Number(same.price) !== item.price) updated++;
        same.price = item.price;
        same.checked = item.checked;
        if (!same.link && item.link) same.link = item.link;
      } else {
        const sibling = list.find(r => r.comp === item.comp && num(r.ship) != null);
        list.push({ id: state.nextId++, comp: item.comp, t: item.t, spec: item.spec, sheets: item.sheets, price: item.price,
          ship: sibling ? sibling.ship : '', every: sibling ? sibling.every : '', link: item.link, checked: item.checked });
        added++;
      }
    });

    if (updated || added) markDirty();
    const skippedText = (skipped.size
      ? ` · 표에 없는 업체라 건너뜀: ${[...skipped].map(([name, n]) => `${name} ${n}건`).join(', ')}`
      : '') + (unparsedUnit ? ` · 1M 열반사 옵션인데 두께·등급·접착 중 읽지 못해 건너뜀 ${unparsedUnit}건` : '');
    state.note = (added || updated
      ? `수집값 반영: 가격 변경 ${updated}건 · 새 줄 ${added}건 (배송비가 비어 있는 줄은 직접 입력하세요) — [저장]을 눌러야 저장됩니다.`
      : `수집값 ${picked.size}건을 확인했지만 바뀐 가격이 없습니다.`) + skippedText;
    state.noteKind = '';
    state.noteCat = cat || null;
    rerender();
  };
})();
