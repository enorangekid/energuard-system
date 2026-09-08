-- 두께 행마다 개별로 등록된 "단품" 네이버 상품코드 저장(2026-09-08) — 두께별로
-- 별개의 상품이 등록돼 있는 경우가 많아(예: 아이소핑크 특호는 두께마다 28개
-- 상품이 따로 있음) 등급 단위(pricing_grade_links)가 아니라 두께 단위로 저장한다.
CREATE TABLE IF NOT EXISTS pricing_danpum_codes (
  id            bigserial PRIMARY KEY,
  tab_id        text NOT NULL,
  grade_id      text NOT NULL,
  thickness     integer NOT NULL,
  product_code  text,
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(tab_id, grade_id, thickness)
);
ALTER TABLE pricing_danpum_codes DISABLE ROW LEVEL SECURITY;
