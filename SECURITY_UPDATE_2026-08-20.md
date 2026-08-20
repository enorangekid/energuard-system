# 통합관리자(Admin_backup) 보안 점검·수정 정리 (2026-08-20)

에너가드랩(Naver-rank) 쪽에서 먼저 보안 점검(Edge Function 인증, RLS 잠금, 회원가입 차단 등)을
진행했고, 그 여파로 같은 Supabase 프로젝트를 공유하는 통합관리자(Admin_backup)에서도
연쇄적으로 문제가 발견되어 같이 정리했다. GPT가 직접 수정 작업을 진행했고, Claude(이 세션)가
파일을 직접 열어 코드 레벨로 교차검증했다.

## 배경 — 왜 건드리게 됐나
에너가드랩의 Edge Function(blog-rank, naver-ad-report 등)이 원래 로그인 없이 URL만 알면
누구나 호출 가능했고(Service Role로 DB 전체 CRUD + OpenAI 호출까지 트리거됨), RLS도
anon에게 조회·쓰기가 전부 열려있었다. 이를 잠그는 과정에서:
- Supabase Auth 신규 회원가입이 실제로 열려 있었던 것도 확인(disable_signup: false) → 차단
- 관리자 UID 화이트리스트(`is_energuard_admin()`) 도입, 모든 public 테이블 anon 권한 회수
이 변경이 **통합관리자와 같은 Supabase 프로젝트를 공유**하기 때문에 통합관리자 쪽에도
그대로 적용됐고, 그 결과 통합관리자에서 anon 키에 의존하던 부분들이 깨지거나 새로 발견됐다.

## 통합관리자(Admin_backup) 저장소에서 실제로 고친 것

1. **대시보드 매출/광고 카드 401 오류 수정**
   - `js/dashboard.js`의 naver-ad-report 호출 7곳이 `Authorization: Bearer <anon key>`로
     보내고 있었는데, 에너가드랩 쪽 인증 강화 이후 이 방식이 막혀서 **매출·광고 카드가
     실제로 401로 깨져 있었음**(가능성이 아니라 확인된 실제 장애).
   - anon key 대신 현재 로그인 세션의 access_token을 보내도록 수정, 공통 인증 헤더 함수로 통일.
   - 세션 만료 시 로그인 화면으로 이동하도록 처리.
   - 네이버·쿠팡 매출/광고 카드 전체 정상 표시 확인 완료.

2. **업무노트·프로젝트 자동저장 오류 무시 문제 수정**
   - `js/notes.js`, `js/projects.js`의 자동저장이 Supabase의 `{ error }`를 확인하지 않고
     무조건 "자동 저장됨"으로 표시하던 버그 수정 — RLS 거부/네트워크 오류가 나도
     사용자는 저장된 줄 알고 있다가 내용이 실제로는 사라지는 데이터 유실 위험이 있었음.
   - 이제 실제 성공한 경우에만 "저장됨" 표시, 실패 시 편집 내용·변경 상태를 유지해서
     재시도 가능하게 함(로컬 캐시를 실패했는데 성공으로 반영하지 않도록도 처리).

3. **단가 관리(경쟁사가/강조상품) 기능 인증·오류 처리 수정**
   - `js/pricing-competitor.js`, `js/pricing-highlight.js`도 anon key로 직접 REST 호출하던
     것을 로그인 세션 토큰으로 변경.
   - `response.ok`/Supabase 오류를 확인해서, 저장 실패했는데 성공 알림이 뜨던 문제 수정.

4. **저장형 XSS 방어 보강**
   - `media.js`, `dashboard.js`, `common.js` 등에서 DB 값·AI 결과를 이스케이프 없이
     `innerHTML`에 직접 넣던 부분 정리.
   - 제목/업체명처럼 순수 텍스트는 HTML 이스케이프, AI 결과처럼 서식이 필요한 내용은
     DOMPurify 적용하는 식으로 구분.
   - 인라인 onclick 일부를 이벤트 리스너 방식으로 교체.
   - (참고: 오늘 RLS 잠금으로 "외부인이 anon으로 악성 HTML을 심는" 경로 자체는 이미 막혀서
     긴급도는 낮았지만, 코드 품질/방어 차원에서 같이 정리함.)

5. **관리자 계정 단일화**
   - `is_energuard_admin()`(에너가드랩 쪽 DB 함수, 통합관리자와 공유)에 등록돼 있던
     관리자 UUID 2개 중 과거 staff 계정을 제거, 현재 실제 사용 중인 계정 1개만 남김.
   - 통합관리자에 별도 역할(role) 체계는 만들지 않기로 결정(1인 운영 도구라 과함).

6. **로그인·로그아웃 세션 통합 재확인**
   - 통합관리자와 에너가드랩이 하나의 Supabase Auth 세션을 공유하는 기존 구조를
     새 인증 체계 기준으로 재검증. admin 계정으로 양쪽 다 추가 로그인 없이 접근되는 것,
     로그아웃 시 양쪽 보호 페이지가 전부 로그인 화면으로 튕기는 것 확인 완료.

## 에너가드랩(Naver-rank) 저장소 쪽에서 고쳤지만 통합관리자에 영향 있는 것

- **gemini-chat Edge Function** — 통합관리자(`media.js`, `tasks.js`)가 실제로 호출해서 쓰는
  AI 함수인데, 저장소에 소스가 없이 원격에만 배포돼 있고 `verify_jwt: false`(로그인 없이
  호출 가능)였음. 소스를 `supabase/functions/gemini-chat`에 복구/재작성해서 저장소에 반영,
  관리자 JWT 검증 + 호출량 제한(daily quota) 추가. 통합관리자 쪽 호출부도 세션 토큰을
  보내도록 같이 수정됨.
- **rank-collector, inquiry-assistant- Edge Function 삭제** — 예전에 쓰다가
  shopping-rank-extension으로 대체되어 안 쓰는 함수였는데 로그인 없이 호출 가능한 상태로
  방치돼 있었음. 원격 함수 삭제 + `common.js`(통합관리자·에너가드랩 공용)에 남아있던
  `AI_INQUIRY_URL` 호출 코드·죽은 UI 잔재 제거.
- **회원가입 차단, RLS 관리자 UUID 락다운, edge function 로그인 검증** 등 — 에너가드랩
  쪽에서 진행했지만 같은 Supabase 프로젝트라 통합관리자 데이터 접근 규칙에도 그대로 적용됨.

## 남은 것 (급하지 않음)
- CDN 패키지(chart.js, quill@2, supabase-js@2) 버전 고정 — 마지막 유지보수 단계로 미룸.
- 예전 anon 허용 SQL 파일들을 legacy로 표시/분리해서 나중에 실수로 재실행 안 되게 하는 작업.
- 통합관리자 자체 역할(role) 체계는 1인 운영 전제라 만들지 않기로 확정.

## 검증 완료
- admin 계정으로 통합관리자·에너가드랩 양쪽 접근 정상
- 과거 staff 계정 DB 접근 차단 확인
- 로그아웃 후 양쪽 보호 페이지 접근 차단 확인
- 네이버·쿠팡 매출/광고 데이터 정상 표시
- 업무노트·프로젝트 자동저장 성공/실패 케이스 확인
- AI 기능 정상 작동 + 비로그인 직접 호출 차단 확인
- 단가 저장 성공/실패 처리 확인
- rank-collector/inquiry-assistant- 호출 흔적 없음 확인
- 수정사항 전부 GitHub에 반영 완료
