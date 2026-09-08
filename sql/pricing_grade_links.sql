-- 품명 셀(등급)당 "모음전" 상품코드 하나만 저장(2026-09-08, 2차 수정) — 처음엔
-- danpum_url/moeum_url(링크 열기)로 만들었는데, 실제 의도는 "클릭하면 상품코드가
-- 클립보드로 복사된다"였고, 단품은 두께마다 따로 등록돼 있어서 등급 단위로는 안
-- 맞는다는 걸 확인함(단품은 pricing_danpum_codes.sql로 별도 관리). 여기는 등급
-- 전체를 아우르는 모음전 상품 하나의 코드만 남긴다.
CREATE TABLE IF NOT EXISTS pricing_grade_links (
  tab_id      text NOT NULL,
  grade_id    text NOT NULL,
  moeum_code  text,
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (tab_id, grade_id)
);
ALTER TABLE pricing_grade_links DISABLE ROW LEVEL SECURITY;

-- 이미 이 테이블을 만들었다면(초안, danpum_url/moeum_url 컬럼) 아래를 실행:
ALTER TABLE pricing_grade_links ADD COLUMN IF NOT EXISTS moeum_code text;
ALTER TABLE pricing_grade_links DROP COLUMN IF EXISTS danpum_url;
ALTER TABLE pricing_grade_links DROP COLUMN IF EXISTS moeum_url;
