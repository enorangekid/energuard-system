-- 업무노트 "프로젝트" 기능 — 특정 테마/목적(외국인노동자관리, 환경표지인증절차, 양도양수절차 등)을
-- 언제든 꺼내보고 수정하는 장기 참고 문서("책"). 월별 업무노트(notes 테이블, date가 필수)와는
-- 성격이 완전히 달라서 별도 테이블로 분리했다. 프로젝트 하나(projects)는 여러 개의 탭
-- (project_tabs, 엑셀 시트처럼)으로 구성되고, 각 탭이 독립된 Quill 문서 하나다.

create table if not exists public.projects (
  id bigint generated always as identity primary key,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_tabs (
  id bigint generated always as identity primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  title text not null,
  content text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_tabs_project_id_idx on public.project_tabs(project_id);

-- notes 테이블에 RLS 정책이 걸려있다면(Supabase 대시보드에서 직접 설정한 경우) projects/project_tabs도
-- 같은 정책(관리자 계정 전체 허용)을 맞춰서 걸어줄 것 — 이 파일에는 별도 RLS를 추가하지 않았다.
