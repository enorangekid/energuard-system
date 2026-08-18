-- 프로젝트 대표 이미지(썸네일) — 목록(책장) 카드에 표시할 대표 이미지 URL을 저장한다.
-- 실제 파일은 기존 이미지 업로드에 쓰던 Supabase Storage 'images' 버킷의
-- project-thumbs/ 경로에 올라가고, 이 컬럼에는 공개 URL만 저장한다(2026-08-14).
alter table public.projects
  add column if not exists thumbnail_url text;
