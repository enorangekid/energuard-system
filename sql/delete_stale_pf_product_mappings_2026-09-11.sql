begin;

delete from public.product_mapping
where product_id::text in (
  '11635753662',
  '11638754577',
  '11638885016',
  '11638926471'
)
returning *;

commit;
