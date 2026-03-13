/* ===============================================================
   js/config.js  —  에너가드컴퍼니 통합 관리 시스템 공통 설정
   이 파일은 index.html에서 모든 다른 JS보다 먼저 로드되어야 합니다.
   =============================================================== */

/* ── [1] 키워드 우선순위 (analytics.js, dashboard.js 공통 사용) ── */

/**
 * 검색 순위 / 대시보드에서 대표 키워드를 결정할 때 사용하는 정렬 순서.
 * 새 키워드를 추가하거나 순서를 바꿀 때는 이 배열만 수정하면 됩니다.
 */
const KEYWORD_ORDER = [
  "아이소핑크", "압축스티로폼",
  "스티로폼", "스티로폼단열재",
  "열반사단열재", "캠핑단열재", "은박매트", "길고양이겨울집", "창문방풍", "에어컨커버",
  "단열벽지",
  "바닥단열재", "전기난방필름", "우레탄뿜칠", "열선커터기",
  "우레탄폼건", "창문열차단", "창문햇빛가리개", "에어컨가림막", "어싱매트",
  "창문단열재", "차박창문가리개"
];

/** KEYWORD_ORDER 기반으로 자동 생성되는 우선순위 맵 { 키워드: 인덱스 } */
const KEYWORD_PRIORITY_MAP = {};
KEYWORD_ORDER.forEach((k, i) => { KEYWORD_PRIORITY_MAP[k] = i; });

/* ── [2] 탭별 대표 키워드 (analytics.js 사용) ── */

/**
 * 검색 순위 페이지의 탭별로 '대표 키워드'를 정의합니다.
 * null이면 해당 탭은 대표 키워드 없이 전체를 표시합니다.
 */
const TAB_MAIN_KEYWORD = {
  '아이소핑크':   '아이소핑크',
  '스티로폼':     '스티로폼',
  '열반사단열재': '열반사단열재',
  '단열벽지':     '단열벽지',
  '기타':         null
};

/* ── [3] 데이터 인덱스 상수 (analytics.js 사용) ── */

/** product_rankings 테이블 컬럼 인덱스 */
const IDX_CODE       = 0;   // 상품번호
const IDX_NAME       = 1;   // 상품명
const IDX_PRICE      = 2;   // 가격
const IDX_CATEGORY   = 3;   // 카테고리 탭
const IDX_KEYWORD    = 4;   // 키워드
const IDX_REMARK     = 10;  // 비고(메모)
const IDX_CHECK      = 11;  // 체크여부
const IDX_IMAGE      = 12;  // 이미지 URL
const IDX_DETAIL_CAT = 13;  // 세부 카테고리
const IDX_TYPE       = 15;  // product_type ('mine' | 'watch')
const IDX_COMPANY    = 16;  // company_name (관찰 상품 업체명)

/* ── [4] 경쟁사 스마트스토어 ID 매핑 ── */

/**
 * 관찰 상품의 company_name → 스마트스토어 ID 매핑.
 * 클릭 시 https://smartstore.naver.com/{storeId}/products/{상품코드} 로 이동.
 * 새 경쟁사 추가 시 이 맵에만 추가하면 됩니다.
 */
const COMPETITOR_STORE_MAP = {
  '벽산단열재':   'kis114',
  '단열코리아':   'sp14011',
  '극동씨앤씨':   'kdongcnc',
  '산일상사':     'sanil',
  '나라단열':     'ddutong',
  '낭만홈즈':     'romancehomes',
  'DY SHOP':      'kdystory',
  '집코리아':     'foamworld',
  '프라임랩':     'primemade',
  '디비바':       'dbbamall',
  '은동이샵':     'nine',
  'HOMEGLOW':     'alljun',
  '베스트파트너': 'bestpartner',
};

/* ── [5] 메인→보조 키워드 계층 구조 ── */
const KW_TREE = [
  { main: '아이소핑크',    subs: ['XPS단열재','압출법보온판','벽산아이소핑크','아이소핑크특호','아이소핑크규격','압출법단열재'] },
  { main: '압축스티로폼',  subs: ['미술용스티로폼','EPS블럭'] },
  { main: '스티로폼',      subs: ['EPS블럭','압축스티로폼','대형스티로폼','조각용스티로폼','폼보드'] },
  { main: '스티로폼단열재',subs: ['EPS단열재','비드법단열재','네오폴'] },
  { main: '열반사단열재',  subs: ['은박단열재','온도리','결로방지단열재','단열필름','외벽단열재','보온시트'] },
  { main: '캠핑단열재',    subs: ['장박단열재','캠핑바닥공사','장박바닥공사','텐트바닥공사'] },
  { main: '은박매트',      subs: ['은박돗자리','두꺼운돗자리','돗자리'] },
  { main: '길고양이겨울집',subs: ['고양이겨울집','고보협겨울집','길냥이급식소'] },
  { main: '창문방풍',      subs: ['창문우풍','창문방풍비닐','베란다방풍비닐','방풍비닐커튼'] },
  { main: '에어컨커버',    subs: ['실외기커버'] },
  { main: '차박창문가리개',subs: ['뒷유리햇빛가리개','조수석햇빛가리개','운전석햇빛가리개','자동차햇빛가리개','차량용햇빛가리개'] },
  { main: '단열벽지',      subs: ['접착식단열벽지','보온벽지','결로방지벽지','곰팡이벽지','방한벽지'] },
  { main: '바닥단열재',    subs: ['바닥보온재'] },
  { main: '전기난방필름',  subs: ['난방필름단열재','난방단열재','난방필름','전기판넬'] },
  { main: '우레탄뿜칠',    subs: ['타이거폼2K','라이트폼','스프레이폼','단열뿜칠'] },
  { main: '열선커터기',    subs: ['스티로폼절단기'] },
  { main: '우레탄폼건',    subs: ['폼건','스프레이폼'] },
  { main: '창문열차단',    subs: ['창문단열재','단열뽁뽁이'] },
  { main: '창문햇빛가리개',subs: ['베란다햇빛가리개','사무실햇빛가리개'] },
  { main: '에어컨가림막',  subs: ['창문형에어컨가림막'] },
  { main: '어싱매트',      subs: ['맨발걷기','어싱패드'] },
  { main: '실외기커버',    subs: ['실외기방수커버'] },
];

/**
 * 보조 키워드 정렬용 맵: { 보조키워드: { mainKeyword, subIndex } }
 * analytics.js의 buildGroupRows에서 보조 키워드 순서 정렬에 사용
 */
const KW_SUB_ORDER_MAP = {};
KW_TREE.forEach(function(entry) {
  entry.subs.forEach(function(sub, idx) {
    if (!KW_SUB_ORDER_MAP[sub]) {
      KW_SUB_ORDER_MAP[sub] = { main: entry.main, order: idx };
    }
  });
});