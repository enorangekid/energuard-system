-- 프로젝트 카드의 "소제목"(subtitle, 직접 입력)과 "말머리"(category, 드롭박스 선택)를
-- 별도 컬럼으로 분리한다. 예전에는 소제목 자리에 첫 번째 탭 이름을 그대로 재활용했는데,
-- 탭 이름이 "개요"로 고정돼 있거나 프로젝트 제목과 중복되는 문제가 있었다(2026-08-14).
alter table public.projects
  add column if not exists subtitle text,
  add column if not exists category text;
