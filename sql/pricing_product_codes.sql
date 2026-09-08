-- 단가표 결과행마다 네이버 스마트스토어 상품번호를 저장(2026-09-08) — 원가/마진처럼
-- 수시로 바뀌는 값이 아니라 등급/두께에 딸린 참조 정보라 pricing_highlights/
-- competitor_prices와 같은 방식(별도 테이블, tab_id+grade_id+thickness 키)으로 둔다.
CREATE TABLE IF NOT EXISTS pricing_product_codes (
  id            bigserial PRIMARY KEY,
  tab_id        text NOT NULL,
  grade_id      text NOT NULL,
  thickness     integer NOT NULL,
  product_code  text,
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(tab_id, grade_id, thickness)
);
ALTER TABLE pricing_product_codes DISABLE ROW LEVEL SECURITY;
