# 스포츠 위젯 작업 인수인계

최종 갱신: 2026-09-01
대상 저장소: `energuard-system` / `main`

> 2026-09-01 업데이트 요약: 카드 알림 5건 개선(팀 로고 표시 · 회색 실루엣 아바타 · 압정형 고정 버튼 · 프라이버시 투명도 · 적층 간격) + EPL/UCL 선수 얼굴 소스 보강, 그리고 Windows 앱에 **순위 뷰**(팀 순위 · 선수 스탯 · 플레이오프/토너먼트 · 과거 시즌 드롭다운)를 통합관리자 웹 위젯에서 이식. 버전 2.0.0 → 2.1.0.

## 집에서 이어서 시작하기

```powershell
git pull origin main
cd windows-nba-widget
npm install
npm start
```

Windows 설치 파일을 새로 만들 때:

```powershell
npm run build
```

결과물은 `windows-nba-widget/final-release/`에 생성된다. `node_modules`, `dist`, `release`, `final-release`는 Git에서 제외했으므로 집에서는 반드시 `npm install` 후 다시 빌드해야 한다.

## 현재 구현 범위

### 통합관리자 웹 스포츠 위젯

- NBA, MLB에 플레이오프 화면을 추가했다.
- UCL은 리그 단계뿐 아니라 토너먼트 대진과 라운드별 결과를 표시한다.
- UCL 클럽명 한글 매핑을 확장했다.
- MLB 문자중계에 이닝 스코어보드, 타자/투수, 볼·스트라이크·아웃, 주자 상황, 득점 장면, 전체 플레이 기록을 넣었다.
- NBA 문자중계를 새로 추가했다.
  - 경기 카드 및 NBA 플레이오프 경기에서 열 수 있다.
  - 쿼터별 스코어보드, 현재 쿼터/시계/공격 팀, 팀별 주요 선수, 최근 득점, 전체 플레이를 표시한다.
  - 각 플레이에 팀 로고와 약칭을 표시한다.
  - 전체 문장은 말줄임 없이 여러 줄로 표시한다.
  - 라이브 경기에서는 8초마다 자동 갱신한다.
- 스포츠 패널을 닫거나 탭/뷰를 전환할 때 MLB/NBA 자동 갱신 타이머를 정리한다.
- 현재 웹 캐시 버전은 `20260828-nbafulltext`이다.

관련 파일:

- `index.html`
- `css/panels.css`
- `js/widget-sports.js`

### Windows 스포츠 라이브 위젯

`windows-nba-widget/`에 Electron 기반 독립 앱을 만들었다. 설치 제품명은 `Energuard Sports Live`이며 현재 버전은 2.1.0이다.

- 프레임 없는 430×760 위젯 창
- 항상 위 표시 및 화면 오른쪽 아래 자동 배치
- 닫기 시 종료하지 않고 시스템 트레이로 숨김
- Windows 로그인 시 자동 실행 설정
- 날짜별 NBA 경기 목록, 팀 로고, 기록, 점수, 상태
- 현재 날짜에 경기가 없으면 최근 포스트시즌 경기 자동 표시
- 쿼터별 스코어보드
- 팀별 득점 상위 선수와 득점·리바운드·도움
- 최근 득점 및 쿼터별 전체 문자중계
- 선택한 라이브 경기 8초 자동 갱신
- 라이브 경기 목록 20초 자동 갱신
- 득점/쿼터 종료 또는 모든 플레이를 우측 하단 카카오톡형 카드 알림으로 표시
- 알림 카드는 7초 후 닫히고 마우스를 올리면 유지되며 클릭 시 해당 경기로 이동
- 알림별 고정, 모든 알림 자동 고정, 투명도 조절, 전체 닫기를 지원한다.
- 새 알림은 아래에서 생성되고 기존 알림은 위로 쌓인다. 일반 알림은 최대 6개를 유지하며 고정 알림은 자동 제거하지 않는다.
- ESPN 플레이의 선수 ID를 박스스코어 선수 정보와 연결해 이벤트 선수 얼굴을 표시하고, 얼굴이 없으면 회색 실루엣 아바타로 대체한다(팀 로고로 대체하지 않는다).
- Windows 앱에 NBA/MLB 종목 전환과 MLB 날짜별 경기 목록을 추가했다.
- MLB 경기 카드에서 이닝별 R/H/E 스코어보드, 현재 타자·투수, B/S/O, 주자, 최근 투구, 득점 장면, 1회부터 전체 플레이를 볼 수 있다.
- EPL과 UCL 종목 전환, 날짜별 경기 목록, 득점·경고·퇴장·교체 이벤트 및 주요 팀 기록을 추가했다.
- UCL 본선(`uefa.champions`)과 예선(`uefa.champions_qual`)을 함께 조회하며, 상세 화면과 알림 클릭 시 원래 리그 경로를 유지한다.
- MLB는 완료된 새 타석, EPL/UCL은 새 득점·퇴장(모든 이벤트 설정 시 카드·교체 포함)을 감지해 카드 알림을 띄운다.
- 응원 팀은 NBA/MLB/EPL/UCL별로 따로 저장하고 해당 팀 경기만 감시할 수 있다.
- 응원 팀별 알림 필터와 알림음 설정
- 알림 클릭 시 해당 경기 문자중계로 이동
- 렌더러가 ESPN에 직접 연결하지 않고 Electron 메인 프로세스가 허용된 ESPN 주소만 요청한다.

#### 2.1.0 변경 (2026-09-01)

카드 알림:

- NBA/EPL/UCL 알림에 양 팀 로고가 표시된다. playbyplay/summary 응답에 로고가 없어 안 뜨던 문제를 스코어보드 `event` 데이터의 로고로 폴백하도록 고쳤다.
- 선수 얼굴이 없으면 회색 실루엣 아바타(인라인 base64 SVG)로 대체한다. 선수 없는 이벤트(쿼터/경기 종료 등)는 아바타를 숨긴다.
- 고정 버튼을 압정(📌) 토글로 바꿨다. 미고정=회색조·기울임·흐림, 고정=컬러·정방향·노란 배경.
- 알림 투명도 하한을 65% → 15%로 낮췄다(프라이버시용). 슬라이더 `min=0.15`, `main.js` 클램프 하한 `0.12`.
- 적층 알림 간격을 좁혔다. `layoutNotificationWindows`의 stride 154px → 132px(창 위아래 투명 여백만큼 겹침).
- EPL/UCL 알림·문자중계의 선수 얼굴은 이벤트 데이터에 headshot이 없을 때 `summary.rosters`에서 선수 ID로 조회해 보강한다. 그래도 없으면 알림은 회색 아바타, 문자중계 패널은 팀 로고로 폴백한다(ESPN이 축구 선수 사진을 잘 제공하지 않아 대부분 아바타로 표시될 수 있음).
- `renderer.js`의 "알림 미리보기"·`main.js` 스모크 테스트 페이로드에 팀 로고 URL을 넣어 미리보기로도 로고가 검증되게 했다.

순위 뷰(신규):

- 하단 탭에 **순위**를 추가했다(`data-view="table"`, `#tableView`). 상단 종목탭(NBA/MLB/EPL/UCL)을 그대로 따르며 별도 종목 선택은 없다.
- 통합관리자 웹 위젯(`js/widget-sports.js`)의 팀 순위 · 선수 스탯 · 플레이오프/토너먼트 · 과거 시즌 드롭다운을 `renderer.js` 하단 "순위 모듈"로 이식했다.
  - 팀 순위: NBA 동/서 컨퍼런스, MLB 지구별(팀 약어 하드코딩 편성), EPL 리그표, UCL 리그 페이즈/그룹. 진출권 색상은 CSS 행 클래스(`.sp-row-b/g/t/y/r`)로 표현.
  - 선수 스탯: NBA 5개 카테고리(득점/리바운드/어시스트/스틸/블록, `site.web.api.espn.com`), EPL/UCL 득점·도움(ESPN statistics), MLB AL/NL 타자·투수(`statsapi.mlb.com/stats/leaders`). "더보기" 토글로 5명→전체.
  - 플레이오프: NBA 라운드별 시리즈, MLB 포스트시즌 시리즈. UCL은 토너먼트 대진(합계·진출·우승).
  - 과거 시즌 드롭다운: NBA/MLB/EPL/UCL 지원. 과거 시즌 선택 시 "N-N 시즌 최종 기록" 배지와 순위/스탯만.
- `main.js` 허용 호스트에 `site.web.api.espn.com` 추가(NBA 선수 스탯). 나머지는 기존 허용 호스트 재사용.
- 원본 대비 의도적 차이: FontAwesome 아이콘 제거(빈 상태는 텍스트만), 인라인 `onclick`/`onchange`/`style` → 위임 리스너 + CSS 클래스(엄격 CSP 준수), NBA 플레이오프 카드 내부 인라인 문자중계 제거(문자중계는 별도 탭), 월드컵(WC) 제외(앱에 종목 없음).

주요 파일:

- `windows-nba-widget/main.js`: 창, 트레이, 설정 저장, 시작 프로그램, 카드 알림 창, 스포츠 데이터 프록시(허용 호스트 목록)
- `windows-nba-widget/preload.js`: 안전한 IPC 공개
- `windows-nba-widget/renderer.js`: 경기 목록, 문자중계, 폴링, 알림 판정, **순위 모듈**(파일 하단 `TEAM_KO_MAP`·`getKoName`·`tblStandings`·`tbl*StatLeaders`·`tbl*Playoffs`·`tblUclTournament`·`loadTable`·`renderTable`·`onTableClick`)
- `windows-nba-widget/index.html`, `styles.css`: UI(순위 탭·`#tableView`·`.sp-*` 이식 스타일 포함)
- `windows-nba-widget/notification.html`, `notification.css`, `notification.js`: 카카오톡형 적층 알림 UI
- `windows-nba-widget/notification-preload.js`: 알림 창 전용 IPC
- `windows-nba-widget/package.json`: 실행/검사/NSIS 빌드

## 사용하는 데이터 주소

공식 리그 API 계약이 아니라 ESPN 공개 응답을 사용하므로 응답 구조나 접근 정책이 바뀌면 수정이 필요할 수 있다.

```text
경기 목록
https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard

NBA 상세 문자중계
https://cdn.espn.com/core/nba/playbyplay?xhr=1&gameId={GAME_ID}

MLB 경기/문자중계
https://statsapi.mlb.com/api/v1/schedule
https://statsapi.mlb.com/api/v1.1/game/{GAME_PK}/feed/live

EPL/UCL 경기 및 상세
https://site.api.espn.com/apis/site/v2/sports/soccer/{LEAGUE}/scoreboard
https://site.api.espn.com/apis/site/v2/sports/soccer/{LEAGUE}/summary?event={EVENT_ID}

순위 뷰 (2.1.0)
https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season={END_YEAR}
https://site.api.espn.com/apis/v2/sports/soccer/{LEAGUE}/standings
https://site.api.espn.com/apis/site/v2/sports/soccer/{LEAGUE}/statistics
https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/statistics/byathlete?...   (NBA 선수 스탯 · 허용 호스트 추가됨)
https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&...
https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=...&statGroup=hitting|pitching&...
```

웹 위젯에는 MLB Stats API와 ESPN의 축구·농구 데이터 주소도 사용 중이다. 전체 상수와 요청 코드는 `js/widget-sports.js`에서 확인한다.

## 검증 결과

### ~2.0.0 (기존)

- `npm run smoke`: NBA 12개, MLB 15개, EPL 5개, UCL 예선 4개 경기 카드 렌더링 확인
- MLB 상세에서 스코어보드·현재 승부·투구 6개·전체 플레이 83개 확인
- EPL 상세 이벤트 13개/팀 기록 2개, UCL 상세 이벤트 20개/팀 기록 2개 확인
- 비시즌 대체 안내와 경기/문자중계/설정 탭 렌더링 확인

### 2.1.0 (2026-09-01)

- `node --check main.js / renderer.js / notification.js / notification-preload.js`: 통과
- 카드 알림 개선은 개발자가 `npm start` → 설정 → "알림 미리보기"로 로고·압정 버튼·아바타 육안 확인함
- `npm run build`: Windows x64 NSIS 설치 파일 생성 성공(코드 서명 포함)
- 최종 설치 파일명: `Energuard-Sports-Live-Setup-2.1.0.exe`
- 최종 로컬 설치 파일 크기: 93,777,150 bytes (약 89.4 MiB)
- SHA-256: `32B924EE83E89B269ED854BFC969674F7FA439F522B7F770E9E8A7B97FA19D5B`
- ⚠️ 순위 뷰는 이번 커밋 환경(CI 샌드박스)에서 Electron GUI 실행이 막혀 `npm run smoke`/`npm start` 런타임 검증을 못 했다. 로컬에서 `npm start` 후 종목별 **순위** 탭(팀 순위/선수 스탯/플레이오프·토너먼트/시즌 드롭다운)을 한 번 눌러 확인 필요.

## Claude Code에서 버그 수정할 때 확인할 곳

- 기능 뼈대 구현을 우선한 상태라 세부 간격·타이포그래피·반응형 디자인은 `index.html`, `styles.css`, `notification.css`에서 다듬으면 된다.
- 종목 분기는 `renderer.js`의 `loadGames`, `setSport`, `monitorLiveGames`에서 시작한다.
- MLB 알림 판정은 `checkMlbGameNotifications`, EPL/UCL 알림 판정은 `checkSoccerGameNotifications`에 있다.
- EPL/UCL 상세 이벤트는 ESPN `summary` 응답의 `details`, `keyEvents`, `plays`를 합쳐 사용한다. 제공 데이터가 없는 경기는 빈 이벤트로 표시될 수 있다.
- UCL 예선 알림을 눌렀을 때도 예선 상세 주소를 열 수 있도록 `_league`와 `endpointLeague`를 유지하므로 이 전달값을 제거하지 않는다.
- 종목별 응원 팀은 `favoriteBySport`에 저장한다. 이전 NBA 설정은 새 제품명으로 바뀌어도 기존 설정 폴더에서 자동으로 읽는다.
- 실시간 데이터 변경 후에는 `npm run check`, `npm run smoke`, 마지막에 `npm run build` 순서로 확인한다.
- 순위 뷰 진입/종목 전환/시즌 변경은 `renderer.js`의 `enterTableView`·`setSport`(순위 탭 활성 시 분기)·`#tableSeasonSelect` 리스너에서 시작한다. fetch 오케스트레이션은 `loadTable`, 렌더 분기는 `renderTable`, 서브탭/더보기/시리즈 펼침 클릭은 `#tableContent` 위임 리스너 `onTableClick`(`data-tblview`/`data-tblleague`/`data-tblmore`/`data-tblseries`).
- 순위 뷰 팀명 한글화는 이식한 `TEAM_KO_MAP`+`getKoName`/`getKoTeamName`를 쓴다. 앱의 기존 `TEAM_KO`/`teamName` 등과는 별개다(매핑 누락 팀은 영문 노출 → `TEAM_KO_MAP`에 추가).
- 순위/스탯 표의 진출권 색은 `getRankClass`가 돌려주는 `.sp-row-*` 클래스로만 표현한다(인라인 스타일 금지 — CSP).

## 알아둘 점과 다음 후보 작업

- 설치 파일은 코드 서명 인증서가 없어 다른 PC에서 SmartScreen 경고가 나올 수 있다.
- 한국어 문자중계는 ESPN 영문 문장을 규칙 기반으로 치환한다. 선수명은 원문이며 일부 드문 플레이 표현은 영어로 남을 수 있다.
- 카드 알림은 앱이 실행 중이거나 트레이에 남아 있을 때 작동한다.
- ESPN 데이터가 없는 경기에는 플레이 기록이나 선수 기록이 표시되지 않는다.
- 현재 앱 아이콘은 Electron 기본 아이콘이다. 배포 전 전용 `.ico` 제작을 권장한다.
- 패키징 시 Windows 파일 점유 문제가 있어 설치 파일 출력 폴더를 `final-release`로 분리하고, 설치된 Electron 런타임을 재사용하도록 빌드 명령을 설정했다.
- `npm install` 결과 개발 의존성 감사에서 high 등급 2건이 보고됐다. 무작정 `npm audit fix --force`를 실행하지 말고 Electron/electron-builder 호환성을 확인하며 올린다.

## Git 참고

- 이 문서와 Windows 다종목 확장 소스는 `feat: Windows 스포츠 라이브 위젯 다종목 확장` 커밋에 포함한다.
- 2.1.0(알림 개선 + 순위 뷰 이식)은 `windows-nba-widget/` 하위 8개 소스 파일과 이 문서, `README.md` 변경으로 구성된다.
- 빌드 산출물(`final-release/` 등)과 의존성 폴더는 커밋하지 않는다.
