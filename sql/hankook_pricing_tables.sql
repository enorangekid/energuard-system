-- 한국단열 단가표(js/pricing-hankook.js, js/pricing-hankook-db.js) 저장용 테이블 (2026-09-21)
--
-- Supabase 대시보드 > SQL Editor에서 이 파일 전체를 한 번 실행한다(여러 번 실행해도 안전).
-- 기존 단가표 테이블(pricing_costs 등)과 같은 방식으로 RLS를 끈다.
--
-- 저장하는 것: 사람이 입력·수정하는 값만. 실판매가·옵션추가금·가격차이 같은 계산 결과는
-- 화면에서 다시 계산하므로 저장하지 않는다(원가/마진이 바뀔 때 저장값과 어긋나는 것을 막기 위해).
-- 첫 데이터는 화면의 "저장" 버튼을 처음 누를 때 JS 기본값이 그대로 올라간다(별도 시드 없음).

-- 1) 공통 설정 — key별 jsonb 한 줄씩
--    base_costs         {"thin":260,"mid":198,"thick":201}      두께구간 기본 원가(원/mm)
--    extra_margins      {"10":-10,"20":-10,"30":27,...}         두께별 추가마진(원/mm)
--    adhesive_fee       1350                                     접착 가공비(원장당)
--    block_base_shipping {"iso_600x900_1":6000}                  배송 블록 공통 5장당 배송비
CREATE TABLE IF NOT EXISTS hk_settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2) 상품(상품코드 기준) — 1단계 판매가 + 2단계 배송 정책
--    shipping: 배송 세부설정 한 행(actualShipping5, plusAmount, baseShipping, coupon 등) 그대로
CREATE TABLE IF NOT EXISTS hk_products (
  product_code  text PRIMARY KEY,
  category_id   text NOT NULL,
  accordion_id  text NOT NULL,
  row_index     integer NOT NULL,
  price         integer NOT NULL,
  shipping      jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 3) 채널별 등록 상품(스마트스토어 상품ID 단위)
CREATE TABLE IF NOT EXISTS hk_channel_products (
  channel_id       text NOT NULL,
  product_id       text NOT NULL,
  category_id      text NOT NULL,
  base_shipping    integer,
  shipping_basis   text,
  jeju_shipping    integer,
  return_exchange  text,
  sort_order       integer NOT NULL DEFAULT 0,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, product_id)
);

-- 4) 채널별 옵션 — 같은 상품 안에서 같은 코드가 두 번 나올 수 있어 순번(sort_order)을 키에 포함
CREATE TABLE IF NOT EXISTS hk_channel_items (
  channel_id      text NOT NULL,
  product_id      text NOT NULL,
  sort_order      integer NOT NULL,
  product_code    text NOT NULL,
  prev_price      integer,
  prev_shipping   integer,
  stock           integer,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id, product_id, sort_order)
);

-- 5) 저장 이력 — "단가 기준 년월"(YYYY-MM)이 label이다. 같은 년월로 다시 저장하면 그 이력을
--    덮어쓰고, 다른 년월이면 새 이력이 생긴다. 전체 상태를 통째로 남긴다(최근 60개만 유지, 앱에서 정리)
CREATE TABLE IF NOT EXISTS hk_history (
  id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label     text NOT NULL,
  saved_at  timestamptz NOT NULL DEFAULT now(),
  snapshot  jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS hk_history_saved_at_idx ON hk_history (saved_at DESC);

ALTER TABLE hk_settings         DISABLE ROW LEVEL SECURITY;
ALTER TABLE hk_products         DISABLE ROW LEVEL SECURITY;
ALTER TABLE hk_channel_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE hk_channel_items    DISABLE ROW LEVEL SECURITY;
ALTER TABLE hk_history          DISABLE ROW LEVEL SECURITY;

-- 다른 단가표 테이블처럼 anon/authenticated 역할이 읽고 쓸 수 있어야 한다.
GRANT SELECT, INSERT, UPDATE, DELETE ON hk_settings, hk_products, hk_channel_products, hk_channel_items, hk_history TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 스키마 캐시 갱신(테이블을 방금 만든 직후 API가 못 찾는 경우 대비)
NOTIFY pgrst, 'reload schema';
