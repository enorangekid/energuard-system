# Orange Sports Web — Claude Code 인수인계 (집 PC에서 시작)

이 파일을 먼저 읽고 시작한다. 회사 PC에서 작업하던 Orange Sports 웹을 집 PC의 Claude Code로 이어받는 상황이다.

---

## 0. 30초 요약

- **Orange Sports** = 제품 2개. `orange-sports/`(Electron 앱, 성숙) + **`orange-sports-web/`(이 폴더, Node 서버 + 바닐라 JS SPA, 개발 중 본체)**.
- 웹은 `server.js`(의존성 0, Node 내장 `http`)가 API 프록시 + 정적 서빙을 함. `127.0.0.1:4173`.
- **실행**: `cd orange-sports-web` → `npm start` → 브라우저 `http://127.0.0.1:4173`. `npm install` 불필요(의존성 0).
- 코드 저장소: GitHub `enorangekid/energuard-system`, 이 폴더는 `Admin_backup/orange-sports-web/`.
- 마지막 커밋: `d24987c` (DeepL 번역·시즌 스탯·기사 리더 개편·문서).

---

## 1. 읽는 순서 (같은 폴더)

1. **`HANDOFF.md`** (이 파일) — 시작점, 현재 상태, 다음 할 일
2. **`PROJECT_OVERVIEW.md`** — 파일 구조, `server.js` 모듈별 동작, 데이터 출처, 완료/미완, 알려진 이슈. **가장 상세**
3. **`INFRA_PLAN.md`** — 제품 경계 확정(웹=공개 정보 / 위젯=문자중계·알림), NAS 배포 방향, 로컬 개발 중 지킬 4원칙, 진행 순서
4. **`ORANGE_SPORTS_ARCHITECTURE_ADDENDUM.md`** — 3계층 Core/API 원칙, 정규화 책임. *단 6·7장(Windows 로컬 Core 자식프로세스)은 폐기됨*
5. `WORK_NOTES_2026-09-04.md` — 그 이전 웹 작업 메모
6. `../orange-sports/ORANGE_SPORTS_HANDOFF.md`, `ORANGE_SPORTS_PRODUCT_PLAN.md` — Electron 앱 구현 이력·제품 방침

---

## 2. 로컬 실행 준비

### `.env` 만들기 (커밋 안 되므로 이 PC에 새로)
`orange-sports-web/` 에서 `.env.example` → `.env` 복사 후:
```
DEEPL_API_KEY=<회사 PC와 같은 DeepL Free 키, ...:fx 로 끝남>
```
- 키 없어도 서버는 뜸(번역이 영어로 폴백). 확인: `http://127.0.0.1:4173/api/health` 의 `"deepl"` 값이 `"free"` 여야 정상.

### 번역 캐시 (선택)
회사 PC `orange-sports-web/.cache/translations.json` 을 같은 경로에 복사하면 재번역 안 함. 없어도 됨(쓰면서 쌓임). `.cache/` 는 Git 제외.

### 정적 파일 vs 서버
- `public/` (index.html, app.js, styles.css) 수정 → **브라우저 새로고침만** (server.js가 매 요청 `fs.readFileSync`)
- `server.js` 수정 → **서버 재시작** (`Ctrl+C` → `npm start`)

---

## 3. 지금까지 완료된 것 (커밋 d24987c 기준)

- 뉴스: 7종목 통합, 3단계 중복제거, 썸네일 확보(네이버 원본 추출 + og:image 백필 + 로고 필터)
- 국내 기사 **본문 전문 추출**(CMS 컨테이너 탐지) + ESPN 6문단 — *개인용. 공개판에선 뺄 것*
- **DeepL 번역** 연동: 뉴스 제목·요약·본문 + 선수/팀명. `names-ko.json`(196개 이름 사전) → 미매칭분만 DeepL → `translations.json` 영구 캐시
- 기사 리더: 단일 컬럼, 이미지 상단 배너, **브라우저 뒤로가기 정상화**(history 통합), 호버 프리페치, 요약 즉시표시
- **시즌 선택 + 선수 스탯 순위**(MLB 8·NBA 5·EPL 2·F1 2 카테고리) + 선수 헤드샷(축구 제외)
- 과거 시즌 순위표(MLB/NBA/EPL/F1)
- 성능: `getNews` 60초 memo, 기사 상세 직접 fetch(35~130ms cold)

---

## 4. 다음 할 일

`INFRA_PLAN.md` 8장 순서 기준.

### A. 로컬에서 지금 이어서 (웹 기능 완성)
1. **순위표 고도화** — MLB 지구별(AL/NL 동·중·서), EPL 승격/강등·UCL 진출 색상. 현재 평면 top-10. Electron `renderer.js`의 `getRankClass`, `tblStandings` 참고
2. **UCL** 순위·스탯 (웹은 EPL만)
3. (선택) 현재 경기상황 인라인뷰 (스코어보드 요약). **문자중계 UI는 웹에 안 만듦**
4. 리더 행에 팀 로고 추가

### B. NAS 이전 대비 (INFRA_PLAN 3장 4원칙)
5. `DATA_DIR` 환경변수 — `server.js`의 `TRANSLATION_CACHE_FILE = path.join(__dirname, '.cache', ...)` 를 `process.env.DATA_DIR || path.join(__dirname,'.cache')` 기반으로
6. `Dockerfile` (`FROM node:22-alpine` + `CMD ["node","server.js"]` 수준)
7. base URL 설정화 (프론트·위젯이 서버 주소 하드코딩 안 함)
8. `PUBLIC_MODE` 플래그 — 켜지면 `extractKoreanArticleBody` off(요약만), 번역 범위 축소

### C. 위젯 작업 착수 시
9. 경기 상세 **데이터 레이어**를 Core로 (renderer.js의 MLB linescore, NBA playbyplay, EPL events, F1 세션). `취득/정규화/DOM` 분해 → 정규화를 순수함수로 → `GET /api/sports/{sport}/game/{id}`. UI는 위젯에만

---

## 5. 이 환경의 주의사항

- **git**: PATH에 없음. GitHub Desktop 번들 사용: `C:\Users\<user>\AppData\Local\GitHubDesktop\app-<버전>\resources\app\git\cmd\git.exe` (버전 폴더명은 매번 확인). 또는 GitHub Desktop GUI로 커밋/푸시.
- **PowerShell**: `git commit -m "..."` 은 큰따옴표 파싱이 깨질 수 있음 → `-F <파일>` 로 메시지 전달.
- **브라우저 자동 열기 금지** — 사용자가 Live Server 등으로 직접 보고 있음. 파일 수정 후 브라우저 새로 열지 말 것.
- **DeepL 한도** = 월 50만 자. `translations.json` 유실 = 재번역 = 실비용. 캐시 파일 함부로 지우지 말 것.
- **저작권** — 국내 기사 전문 추출·네이버 스크래핑은 개인용. 공개 배포 논의 시 `PUBLIC_MODE` 로 제한.
- 서버 재시작 후 테스트는 `Invoke-RestMethod http://127.0.0.1:4173/api/...` 로. `/api/health` 에 `deepl`·`names`·`translationCache` 상태 노출.

---

## 6. 회사 ↔ 집 동기화

- 코드: GitHub Desktop Commit + Push ↔ Pull
- `.env`: 커밋 안 됨. PC마다 1회 생성 (DeepL 키는 재사용)
- `.cache/translations.json`: 커밋 안 됨. 수동 복사 또는 각자 재생성
