# Codex 미디어 원고 직접 접근

`tools/media-notes.cjs`는 브라우저 화면이나 로그인 세션을 사용하지 않고 Supabase의
`notes` 테이블에 직접 접근한다. 이 PC에 로그인된 Supabase CLI 권한을 이용하며,
API 키는 실행 중에만 사용하고 출력하거나 파일에 저장하지 않는다.

Codex에서는 이 명령이 사용자 Supabase CLI 인증 저장소를 읽을 수 있도록 허용된
`node tools/media-notes.cjs` 실행 권한을 사용해야 한다. 익명 키로 REST를 직접 호출하면
RLS에 의해 `401 Unauthorized`가 발생하므로 그 방식으로 원고 개수를 판단하지 않는다.

접근 범위는 `type=blog`와 `type=youtube`인 행으로 제한된다.

## 조회

```powershell
node tools/media-notes.cjs count --type youtube
node tools/media-notes.cjs list --type youtube --limit 20
node tools/media-notes.cjs search --type blog --query "아이소핑크" --limit 20
node tools/media-notes.cjs get --id 원고_UUID
```

`get`은 HTML 형식의 `content`를 포함한 원고 전체를 반환한다.

## 신규 저장

본문을 UTF-8 HTML 파일로 먼저 만든 뒤 저장한다.

```powershell
node tools/media-notes.cjs create --type blog --date 2026-10-07 --title "제목" --status saving --content-file 원고.html
```

## 기존 원고 수정

```powershell
node tools/media-notes.cjs update --id 원고_UUID --content-file 수정원고.html
node tools/media-notes.cjs update --id 원고_UUID --title "새 제목" --status uploaded
```

수정 결과에는 수정 전 행(`before`)과 수정 후 행(`row`)이 함께 표시된다.
저장은 사용자가 명시적으로 요청했을 때만 실행한다.

## 새 Codex 채팅에 전달할 핵심 지시

```text
미디어콘텐츠의 블로그·유튜브 원고는 브라우저 화면이나 Supabase 익명 키로 조회하지 마.
프로젝트의 tools/MEDIA_NOTES_CLI.md를 먼저 읽고 tools/media-notes.cjs만 사용해 Supabase
notes 테이블을 직접 조회·검색·저장·수정해. type은 blog 또는 youtube야. 저장은 내가
명시적으로 요청했을 때만 실행하고, 기존 원고 수정 전에는 id와 현재 본문을 먼저 확인해.
```
