# Orange Sports — 프로젝트 현황 (다른 AI 공유용)

작성일 2026-09-04. 스포츠 정보 도구. **현재는 로컬 개발**, 향후 NAS(홈서버) 이전 후 **공개 웹 + Windows 위젯** 구조로 운영 예정 → `INFRA_PLAN.md`.

---

## 1. 큰 그림 — 제품 2개

| | 경로 | 정체 | 상태 |
|---|---|---|---|
| **Windows 앱** | `Admin_backup/orange-sports/` | Electron 데스크톱 클라이언트 (v2.6.0). 트레이 상주 + 실시간 카드 알림. `renderer.js` 2,146줄에 전 기능 구현됨(경기센터·문자중계·순위·스탯·플레이오프·F1 세션). | **성숙**. 기능 완성. 앞으로는 알림/트레이 담당 클라이언트로 축소 예정 |
| **웹 (본체)** | `Admin_backup/orange-sports-web/` | 순수 Node `http` 서버(의존성 0) + 바닐라 JS SPA. `127.0.0.1:4173` 바인딩. | **개발 중**. Windows 앱 기능을 하나씩 이식하는 단계 |
| 레거시 위젯 | `Admin_backup/orange-sports/legacy-admin-widget/widget-sports.js` (2,011줄) | 과거 에너가드 통합관리자 대시보드용 스포츠 패널. 현재 로드 안 함. 이식 완료 후 삭제 예정 | 비교 참고용 보관 |

방향: **웹을 본체로, Windows 앱은 알림 클라이언트로.** 상세는 `../orange-sports/ORANGE_SPORTS_PRODUCT_PLAN.md`, 구현 이력은 `../orange-sports/ORANGE_SPORTS_HANDOFF.md`(33KB), 최근 웹 작업은 `WORK_NOTES_2026-09-04.md`, **인프라·배포 계획은 `INFRA_PLAN.md`**.

### 제품 경계 (확정, `INFRA_PLAN.md` 1장)

- **공개 웹**: 종목별 뉴스 · 팀/선수 순위 · 선수 스탯 · 과거 시즌 · 경기 일정 · **현재 경기상황(요약 상태만: 3회말/2쿼터/2:1)**. 주소 공유하면 누구나
- **Windows 위젯(설치파일)**: 일정·결과 · 응원팀/관심경기 설정 · **상세 문자중계** · 득점/시작/종료 감지 · Windows 네이티브 알림. 설치자만
- **문자중계 UI는 공개 웹에 만들지 않는다.** 매 플레이 데이터 처리 로직만 Core로(위젯이 씀), UI는 위젯 전용

### 확정된 아키텍처 원칙 (상세: `ORANGE_SPORTS_ARCHITECTURE_ADDENDUM.md`)

3계층으로 본다:

```
ESPN / MLB StatsAPI / OpenF1 / Naver / Google News
        ↓
Orange Sports Core/API   ← 지금은 server.js가 이 역할 + 정적 서버를 겸함 (별도 분리 안 함)
  · 외부 API 접근  · 캐시  · 번역  · 데이터 정규화  · 기사 처리  · 공통 API 제공
        ↓                    ↓
   Web (본체 UI)        Windows Client (트레이·알림·백그라운드 감시)
```

1. **Windows 앱이 없어도 Web은 100% 동작한다** (뉴스·일정·순위·스탯·경기상세·문자중계·플레이오프·기사리더 전부)
2. **Web·Windows는 외부 스포츠 API를 제각각 호출하지 않는다.** Core/API를 단일 창구로 사용
3. **외부 응답 → 내부 표준 데이터 변환 책임은 Core.** 정규화 함수는 DOM/Electron 비의존 순수 JS
4. 코드 공유는 **Core 내부**에서, 데이터 공유는 **Core API**를 통해
5. Windows는 Core를 자식 프로세스로 자동 실행(`spawnedCore` 플래그로 "내가 띄운 것만 종료"). 알림 감지는 당분간 10~20초 폴링 → 상태 비교 → 이벤트(`game_start`/`score_change`/`inning_change`/`period_change`/`game_end`)
6. 지금 하지 않을 것: monorepo, TypeScript, Express/Fastify, WebSocket 서버, Redis/Supabase/KV 즉시 도입

---

## 2. orange-sports-web 파일 구조

```
orange-sports-web/
├── server.js            540줄. Node 내장 http만 사용(의존성 0). API 프록시 + 정적 서빙
├── package.json         scripts: start(node server.js), check(node --check)
├── public/
│   ├── index.html       6.6KB. 단일 페이지 (탭·티커·뉴스·일정·순위·스탯·기사 리더)
│   ├── app.js           264줄. 프레임워크 없음. state 객체 + 렌더 함수
│   └── styles.css       36줄(압축형). 종목별 테마는 <body data-theme="{sport}">
├── names-ko.json        196개. 영문 선수·팀명 → 한국어 사전 (기계번역 전 치환)
├── .env                 DEEPL_API_KEY=...:fx  (gitignore됨)
├── .cache/
│   └── translations.json  번역 결과 영구 캐시 (gitignore됨). 현재 ~47KB
├── README.md
└── WORK_NOTES_2026-09-04.md
```

실행: `cd orange-sports-web && npm start` → 브라우저 `http://127.0.0.1:4173`. 포트 변경은 `ORANGE_SPORTS_PORT`.
정적 파일은 매 요청 `fs.readFileSync` → HTML/CSS/JS 수정은 재시작 불필요(브라우저 새로고침만). **server.js 수정 시에만 재시작.**

---

## 3. 종목(sport) 키

`kbo`(국내야구) · `mlb`(해외야구) · `kfootball`(국내축구) · `football`(해외축구=EPL+UCL) · `kbl`(국내농구) · `nba`(해외농구) · `f1`

- **뉴스**: 7종목 전부
- **일정·순위·선수스탯**: `mlb`, `nba`, `football`, `f1` 만 (`SPORT_DATA` 집합). `kbo/kbl/kfootball`은 `type:'news'` = 뉴스 전용, 데이터 공급처 미정
- `football`은 `type:'multi-espn'` (EPL + UCL 스코어보드 합침). 단 순위·스탯은 현재 **EPL(eng.1)만** 구현

---

## 4. server.js 주요 모듈

### 4.1 공통
- `cachedFetch(url, ttl, type='json')` — 메모리 `Map` 캐시. `AbortSignal.timeout(9000)`. 재시작 시 소멸
- `.env` 로더 (의존성 없이 직접 파싱)
- 라우트: `GET /api/health`, `/api/article?url=`, `/api/sports/{sport}/{schedule|standings|leaders|news}`

### 4.2 뉴스 — `getNews(sport)` = `buildNews` + 60초 memo
- **국내기사**: 네이버 뉴스 검색 HTML 스크래핑(`search.naver.com`, `sort=1` 최신순, `parseNaverNews` 정규식 파싱) + Google News RSS(`when:14d`)
- **공식기사**: MLB→`mlb.com/feeds/news/rss.xml`, 그 외→ESPN `.../news` API. 제목·요약 DeepL 번역, 뱃지 `해외·번역`
- **중복 제거** `uniqueArticles()`:
  1. 제목 키(말머리 `[속보][포토]` 제거 + 앞 50자)
  2. 동일 이미지 URL
  3. 근접중복 — 제목을 토큰화(한국어 조사 `stemToken`으로 어미 제거) 후 4개 이상 겹치거나(같은 사건) + 노출 시각대 동일
- **관련성 필터** `isRelevant` — `SPORTS[sport].relevance` 키워드가 제목에 있어야 통과. **네이버 결과엔 미적용(제외어만), 구글 결과에만 적용** (구글 RSS는 썸네일이 없어 과도한 필터 시 이미지 없는 카드만 남는 문제 회피)
- **썸네일**:
  - 네이버 제공 `search.pstatic.net/common/?src=...` 프록시 URL → `newsThumbnail()`이 안의 `imgnews.pstatic.net` 원본 추출(referrer 없이 로드됨, 고화질)
  - 이미지 없는 기사(주로 구글 RSS) → `pageImage()`가 기사 페이지 `og:image` 읽어 백필. 단 `news.google.com` 리다이렉트 링크는 스킵(브랜딩 로고만 나옴). 로고/기본이미지 URL 패턴(`LOGO_IMAGE_RE`)은 버림
- 홈 화면은 7종목 뉴스를 각 5개씩 합쳐 client `dedupeArticles`로 재차 중복 제거 후 발행시각순

### 4.3 기사 본문 — `getArticleDetail(link)`
- 클라이언트가 이미 가진 기사 `link`를 그대로 받음(getNews 재실행 안 함 → 빠름). SSRF 가드(`safeArticleUrl`: http/https만, 사설·로컬 IP 차단)
- **ESPN**: `extractEspnParagraphs` → `<p>` 6개 → `translateBatch` 번역
- **국내 언론사**: `extractKoreanArticleBody(html)` — CMS별 본문 컨테이너 id/class를 순서대로 탐색(`article-view-content-div`, `dic_area`, `newsct_article`, `articleBody`, `itemprop=articleBody`, `<article>` …) → `<div>` 깊이 계산으로 컨테이너 범위 정확히 잘라냄 → `<script>/<style>/<figure>` 제거, `[서울=뉴시스] ○○ 기자 =` 머리말·저작권·공유버튼 잡줄 필터. **개인 열람 전용**(계획서상 국내 기사 전문 복제 금지)
- `news.google.com` 링크는 본문 없음 → 빈 값
- 30분 캐시

### 4.4 번역 (DeepL Free 중심)
- `deeplTranslate(texts[])` — `api-free.deepl.com/v2/translate`(키가 `:fx`로 끝나면 free 엔드포인트 자동), 최대 50개 batch, `target_lang=KO&source_lang=EN`
- `translateBatch(values[])` — **캐시 확인 → 이름 사전 `applyNameDict` 선치환 → DeepL 1회 → 실패분만 MyMemory(`api.mymemory.translated.net`) → 그래도 실패면 원문**
- `TRANSLATION_CACHE` = `{ "영문":"한국어" }` 객체. `.cache/translations.json`에 debounce 저장, 시작 시 로드. **재시작·재요청에도 재번역 안 함**
- `names-ko.json` (196개) — NBA·MLB·EPL·UCL·F1 팀 + 스타 선수. 사전 매칭은 대소문자 무시·긴 키 우선. `applyNameDict`는 유니코드 경계 룩어라운드 정규식
- `needsTranslation()` = 한글 없고 라틴 3자 이상. 한글/사전해결분은 DeepL 안 탐
- 사용 지점: 뉴스 제목+요약, ESPN 본문, 선수스탯 이름/팀명(`localizeLeaderGroups`)
- `/api/health`에 `deepl`(free/pro/off), `names`, `translationCache` 노출

### 4.5 순위 — `getStandings(sport, season)`
- MLB: `statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=...`
- NBA / EPL: `site.api.espn.com/apis/v2/sports/{path}/standings?season=...`
  - **주의: NBA는 시즌 종료연도(2025-26 → 2026), EPL은 시즌 시작연도(2026-27 → 2026)** — ESPN이 종목별로 규칙이 다름
- F1: OpenF1 `sessions`(Race) → 현재시각 이전 마지막 레이스 → `championship_drivers` + `championship_teams`. **championship_drivers엔 이름이 없어 `/v1/drivers`와 `driver_number`로 조인** + 이름 사전 적용
- 클라이언트 `collectStandings`가 상위 10팀만 표시. 팀명 한글화는 client `teamName()`(`TEAM_KO`, `TEAM_KO_BY_SPORT` 맵, app.js 내)

### 4.6 선수 스탯 — `getLeaders(sport, season)` = `buildLeaderGroups` + `localizeLeaderGroups`
반환: `{ groups: [{ key, title, label, rows:[{ rank, name, team, value, photo }] }] }`
- **MLB** (8 카테고리): 타율·홈런·타점·도루 / 평균자책·다승·탈삼진·세이브. `statsapi.mlb.com/.../stats/leaders` — `leaderCategories`는 **한 번에 1개만**(콤마 리스트는 400) → 카테고리별 개별 fetch. 헤드샷 `img.mlbstatic.com/.../people/{id}/headshot/67/current`
- **NBA** (5): 득점·리바운드·어시스트·스틸·블록. `site.web.api.espn.com/apis/common/v3/.../statistics/byathlete?sort={group.stat}:desc&season={endYear}&seasontype=2`. `categories[].names[]` 인덱스로 `athletes[].categories[].totals[]` 조회. 헤드샷 `athlete.headshot.href`
- **해외축구/EPL** (2): 득점·도움. `site.api.espn.com/apis/site/v2/sports/soccer/eng.1/statistics?season=...` → `stats[]` 배열의 `goalsLeaders`/`assistsLeaders` → `leaders[].athlete`. **헤드샷 없음**(ESPN 축구 API 미제공) → 이니셜 원
- **F1** (2): 드라이버·컨스트럭터 챔피언십. `getStandings('f1')` 재사용. 헤드샷 OpenF1 `headshot_url`
- `localizeLeaderGroups` — 모든 name/team 수집 → `applyNameDict` → 미매칭분만 `translateBatch`(DeepL) → 치환. 전부 `translations.json`에 캐시
- 30분 캐시(`LEADER_TTL`)
- 클라이언트 `renderLeaders` — 카테고리 카드, 상위 5 + "더보기"로 12위까지. 각 행에 30px 원형 헤드샷(로드 실패 시 `onerror`로 이니셜)

### 4.7 일정 — `getSchedule(sport, date)`
MLB `statsapi` schedule, ESPN scoreboard, OpenF1 meetings/sessions. 클라이언트 `normalizeSchedule` → `normalizeMlb/normalizeEspn/normalizeF1`

---

## 5. public/app.js 구조 (프레임워크 없음)

- `state = { sport, date, games, articles, standings, favoriteTeams, request, filter, activeArticle, season, leaders, leadersExpanded }`
- `loadSport(sport, keepSeason)` — 탭 클릭 진입점. `state.request` 증가로 이전 요청 무효화. `renderCachedSport`로 캐시 즉시 표시 후 `loadOne`/`loadHome`
- `loadOne` — schedule/news/standings/(SPORT_DATA면 leaders) 병렬 fetch + 렌더
- `getJson(url)` — client `apiCache` Map + in-flight promise 공유. `apiTtl`: news 10분 / article 30분 / standings 5분 / 그 외 20초
- **기사 리더**: `openArticle(id, push)` → `history.pushState({view:'article',id})`. `popstate` 리스너로 브라우저 뒤로가기 = 리더 닫고 목록 복귀(사이트 이탈 방지). 화면 내 "뒤로" 버튼도 `history.back()` 경유. 카드 `pointerover` 시 `prefetchBody`로 본문 선요청
- **번역 즉시 표시**: 리더 열면 검색 요약을 바로 보여주고, 본문 도착 시 교체
- **시즌 선택**: `#seasonSelect` (mlb/nba/football/f1). `currentSeasonValue`/`seasonOptions`가 종목별 연도 규칙 처리. 변경 시 `loadSport(sport, true)`
- 종목별 테마색: `body[data-theme=...]` CSS 변수 `--accent`

---

## 6. 데이터 출처 (공식 제휴 아님, best-effort)

| 소스 | 용도 | 리스크 |
|---|---|---|
| `site.api.espn.com`, `site.web.api.espn.com`, `cdn.espn.com` | NBA/EPL/UCL 경기·순위·스탯·뉴스 | 비공식. 응답구조/차단 변동 가능. PowerShell UA는 Akamai 403, Node fetch는 통과 |
| `statsapi.mlb.com` | MLB 전부 | 안정적. CORS 허용 |
| `api.openf1.org` | F1 일정·챔피언십 | 무료범위 2023+, 실시간(세션±30분)은 유료. 초3/분30 제한 |
| `search.naver.com` (HTML 스크래핑) | 국내 뉴스 | 마크업 변경 취약, 버스트 시 스로틀. API 아님 |
| `news.google.com/rss` | 국내 뉴스 보조 | 이미지 없음, 링크가 리다이렉트라 본문 못 긁음 |
| `mlb.com/feeds/news/rss.xml` | MLB 공식 뉴스 | 안정적 |
| `api-free.deepl.com` | 번역 | 월 50만 자 무료. 키 `.env` |
| `api.mymemory.translated.net` | 번역 폴백 | 무료 한도 작음(현재 429). 사실상 DeepL만 씀 |
| `img.mlbstatic.com`, `a.espncdn.com`, `media.formula1.com` | 로고·헤드샷 | referrer 무관 로드됨 |

---

## 7. 완료된 것 (2026-09-04 기준)

- 7종목 뉴스 통합(국내+공식), 3단계 중복제거, 썸네일 확보(네이버 원본 추출 + og:image 백필 + 로고이미지 필터)
- 국내 기사 **본문 전문** 추출(CMS 컨테이너 탐지) + ESPN 6문단
- **DeepL 번역** 연동: 뉴스 제목·요약·본문 + 선수/팀명. `translations.json` 영구 캐시. 이름 사전 196개
- 기사 리더: 단일 컬럼 레이아웃, 이미지 상단 배너(확대·잘림 방지 `object-fit:contain`+`width:auto`), **브라우저 뒤로가기 정상화**(history 통합), 호버 프리페치, 본문 로드 35~130ms(cold)
- **시즌 선택 + 선수 스탯 순위**(mlb 8 / nba 5 / EPL 2 / f1 2 카테고리) + 선수 얼굴(축구 제외)
- 과거 시즌 순위표(mlb/nba/EPL/f1)
- 성능: `getNews` 60초 memo, 기사 상세 직접 fetch

---

## 8. 미완 / 다음 작업

> 진행 순서·인프라 단계는 `INFRA_PLAN.md` 5장. 아래는 웹 기능 잔여 항목.

**A. 로컬에서 지금 이어서 (웹 기능 완성)**
1. **순위표 고도화** — MLB 지구별(AL/NL 동·중·서), EPL 승격/강등·UCL 진출 색상(`getRankClass`). 웹은 현재 평면 top-10
2. **UCL** 순위·스탯 (웹은 EPL만)
3. (선택) **현재 경기상황 인라인뷰** — 스코어보드 요약(이닝/쿼터/스코어). *문자중계 UI는 웹에 만들지 않음 — 위젯 전용*
4. 리더 행에 팀 로고 (지금은 선수 얼굴만)
5. **KBO/KBL/K리그** 경기·순위·기록 — 데이터 공급처 미정 (현재 뉴스만)

**B. NAS 이전 대비 코드 반영 (`INFRA_PLAN.md` 3장)**
6. `DATA_DIR` 환경변수 (translations.json 경로 하드코딩 해제)
7. Dockerfile
8. base URL 설정화 (프론트·위젯이 서버 주소 하드코딩 안 함)
9. `PUBLIC_MODE` 플래그 — 공개판은 기사 전문 리더 off + 번역 범위 축소

**C. 위젯 작업 착수 시**
10. **경기 상세 데이터 레이어를 Core로** — Electron `renderer.js`의 MLB 이닝별 R/H/E, NBA 플레이바이플레이, EPL 이벤트, F1 세션결과·피트스톱. 방법: `취득 / 정규화 / DOM` 분해 → 정규화를 순수함수로 Core에 → `GET /api/sports/{sport}/game/{id}`(F1은 `/session/{id}`) 신설. **UI는 위젯에만**. MLB→NBA→축구→F1
11. **플레이오프/토너먼트 대진** — Electron `tblPlayoff*`. (웹에 넣을지 위젯에 둘지 미정)
12. **위젯 데이터 소스를 NAS Core/API로 전환** + 설치파일 재빌드. 알림 클릭 → 웹 경기 페이지 열기

---

## 9. 알려진 이슈 / 제약

- 네이버 스크래핑 취약(마크업 변경·스로틀). 정규식 파서라 깨질 수 있음
- Google News RSS: 이미지 0, 리다이렉트 링크 → 본문 추출 불가 (해외야구/농구/F1에서 종목당 2~4개 fallback 카드)
- ESPN 축구: 선수 헤드샷 미제공. 일부 리더 항목의 소속팀이 과거 팀으로 표시됨(ESPN 데이터)
- 네이버 기사 `published`에 스크랩 시각이 들어가 홈 최신순 정렬이 네이버 기사 편향
- 과거 축구 순위표: 최근 시즌만 확실, 오래된 시즌은 빈 값 가능
- MyMemory 429(무료 한도 소진) — DeepL이 주력
- 국내 기사 전문 추출은 **개인 사용 한정**. 공개판(`PUBLIC_MODE`)에서는 제거 예정 → 썸네일·제목·요약·언론사·시간·원문링크까지만
- 배포: 현재 "내 PC 로컬" → 향후 **NAS**(`INFRA_PLAN.md`). NAS는 `DATA_DIR` 볼륨에 파일 캐시 영속 가능. 정전·재부팅 시 위젯 알림 놓칠 수 있음(UPS + 위젯 재시도로 완화)
- DeepL API Free 월 50만 자. 번역 캐시 유실 = 재번역 = 실비용 → `DATA_DIR` 영속, 부족하면 Supabase 테이블

---

## 10. 다른 AI에게 묻고 싶은 것

> Q2(코드 공유 전략), Q6(서버리스 방향)은 `ORANGE_SPORTS_ARCHITECTURE_ADDENDUM.md`에서 확정됨 — 아래는 그 원칙 하에서의 세부 질문.

1. **의존성 없이** 더 나은 국내 기사 본문 추출법 (readability 스타일 휴리스틱)? 현재는 CMS 컨테이너 화이트리스트 + `<div>` 깊이 파싱
2. 플레이오프 **대진표(bracket) 렌더링**을 바닐라 JS + CSS로 하는 깔끔한 방법
3. **KBO/KBL/K리그** 무료 데이터 소스 (경기·순위·선수기록). Statiz/네이버스포츠 외 API성 소스?
4. ESPN 비공식 API 안정성 대비책 — 캐시 TTL 늘리기 외에
5. 번역 품질 — 이름은 사전, 문장은 DeepL. 문장 안 고유명사 일관성을 더 높이는 방법 (지금은 DeepL 호출 전 영문 텍스트에 사전 치환은 안 하고, 결과 후처리도 안 함 → 개선 여지)
6. 경기 상세 이식 시 종목별 **표준 경기 객체** 스키마 설계 (ADDENDUM 4장 예시 객체를 어디까지 공통화할지 — MLB 이닝/NBA 쿼터/축구 전후반/F1 랩을 `period`로 추상화 가능한지)

---

## 11. 참고 파일

### 아키텍처 / 인프라 방향 (이 문서와 세트로 읽을 것)
- `INFRA_PLAN.md` (같은 폴더) — **제품 경계 확정(문자중계는 위젯 전용)**, NAS 기반 배포 방향, 로컬 개발 중 지킬 4원칙(DATA_DIR·Dockerfile·base URL·PUBLIC_MODE), 진행 순서, 리스크
- `ORANGE_SPORTS_ARCHITECTURE_ADDENDUM.md` (같은 폴더) — 3계층 Core/API 원칙, 정규화 책임, renderer.js 이식 방법, "지금 하지 말 것". **단 6·7장(Windows 로컬 Core 자식프로세스)은 폐기** — Core는 NAS에 있고 위젯은 그 API 클라이언트 (`INFRA_PLAN.md` 참조)

### Electron 쪽 (이식 원본)

- `../orange-sports/renderer.js` 2,146줄 — 전 기능. 스탯/순위 모듈 ≈ 1,536~2,300줄, 경기센터 ≈ 300~1,300줄, F1 세션 ≈ 630~900줄
- `../orange-sports/main.js` 458줄 — 알림 엔진, 트레이, 백그라운드 감시
- `../orange-sports/legacy-admin-widget/widget-sports.js` 2,011줄 — 구 위젯(참고용)
- `../orange-sports/ORANGE_SPORTS_HANDOFF.md` — 앱 구현·알림 동작 상세
- `../orange-sports/ORANGE_SPORTS_PRODUCT_PLAN.md` — 제품 경계·배포 원칙
