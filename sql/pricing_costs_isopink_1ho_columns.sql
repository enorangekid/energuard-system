-- 아이소핑크 1호 신설(2026-09-08)로 특호와 겹치는 30T~180T/185T+ 구간의 원가를
-- 독립 필드로 저장해야 해서, pricing_costs / pricing_costs_history 두 테이블에
-- 새 컬럼을 추가한다. 값이 없으면 저장 시 null로 들어가므로 not null 제약은 걸지 않는다.
alter table public.pricing_costs
  add column if not exists cost_900_1800_1ho_mid   numeric,
  add column if not exists cost_900_1800_1ho_thick  numeric;

alter table public.pricing_costs_history
  add column if not exists cost_900_1800_1ho_mid   numeric,
  add column if not exists cost_900_1800_1ho_thick  numeric;
