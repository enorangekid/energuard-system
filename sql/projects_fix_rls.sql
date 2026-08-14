-- 진단: 데이터가 실제로 들어갔는지 확인 (SQL 에디터는 postgres 권한이라 RLS와 무관하게 항상 보임)
select id, title, updated_at from public.projects;
select id, project_id, title, sort_order from public.project_tabs;

-- 진단: RLS가 켜져 있는지 확인 (relrowsecurity = true면 켜진 것)
select relname, relrowsecurity from pg_class where relname in ('projects', 'project_tabs');

-- 조치: notes 테이블과 동일하게(내부 관리자 전용 툴, RLS 미사용) 꺼준다.
-- 위 진단에서 데이터가 있는데 relrowsecurity가 true였다면 이게 원인이었던 것.
alter table public.projects disable row level security;
alter table public.project_tabs disable row level security;
