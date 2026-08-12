-- 업무노트 AI 추천 결과를 로컬스토리지 대신 서버에 영구 저장하기 위한 컬럼.
-- 에너가드랩 admin/work-notes.js(work_notes 테이블 버전)에서 이식.
alter table public.notes
  add column if not exists ai_suggestion text;
