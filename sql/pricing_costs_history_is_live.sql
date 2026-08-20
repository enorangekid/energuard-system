-- 단가표에서 원가/마진을 조정하면 화면·견적서에 즉시 반영되던 문제를 고치기 위해,
-- "저장한 값"과 "실제로 웹/앱에 적용한 값"을 분리한다(2026-08-20).
-- 이제부터 "원가 저장"은 이력에 스냅샷만 남기고, 견적서/앱가격은 is_live=true로
-- 표시된 스냅샷만 참조한다. 실제 적용은 이력 목록에서 별도로 지정해야 한다.
alter table public.pricing_costs_history
  add column if not exists is_live boolean not null default false;

-- 마이그레이션 직후 견적서가 참조할 데이터가 하나도 없으면 안 되므로,
-- 아직 is_live가 하나도 없는 경우에 한해 가장 최근(label 최대) 이력을 실제 적용가로 지정한다.
update public.pricing_costs_history t
set is_live = true
where product_type = 'all'
  and not exists (
    select 1 from public.pricing_costs_history where product_type = 'all' and is_live
  )
  and t.id = (
    select id from public.pricing_costs_history
    where product_type = 'all'
    order by label desc
    limit 1
  );
