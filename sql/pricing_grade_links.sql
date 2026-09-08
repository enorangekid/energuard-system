-- 품명 셀(등급)당 "단품"/"모음전" 네이버 상품 링크 2개만 저장(2026-09-08) — 두께별
-- 상품번호를 따로 저장하려던 시도(상품번호 열)를 걷어내고 훨씬 단순하게 대체.
CREATE TABLE IF NOT EXISTS pricing_grade_links (
  tab_id      text NOT NULL,
  grade_id    text NOT NULL,
  danpum_url  text,
  moeum_url   text,
  updated_at  timestamptz DEFAULT now(),
  PRIMARY KEY (tab_id, grade_id)
);
ALTER TABLE pricing_grade_links DISABLE ROW LEVEL SECURITY;
