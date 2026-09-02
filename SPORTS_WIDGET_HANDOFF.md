# 스포츠 위젯 작업 인수인계

최종 갱신: 2026-09-01
대상 저장소: `energuard-system` / `main`

> 2026-09-01 업데이트 요약: 카드 알림 5건 개선(팀 로고 표시 · 회색 실루엣 아바타 · 압정형 고정 버튼 · 프라이버시 투명도 · 적층 간격) + EPL/UCL 선수 얼굴 소스 보강, 그리고 Windows 앱에 **순위 뷰**(팀 순위 · 선수 스탯 · 플레이오프/토너먼트 · 과거 시즌 드롭다운)를 통합관리자 웹 위젯에서 이식. 버전 2.0.0 → 2.1.0.

> 2026-09-02 업데이트 요약: NBA 순위 경기 수와 MLB 애리조나 누락을 수정하고 시즌 목록을 현재 연도 기준으로 변경했다. 알림창은 NBA 네이비/오렌지, MLB 레드, EPL 퍼플, UCL 블루 계열로 구분했다. 버전 2.1.0 → 2.2.1.

> 2026-09-02 UI 업데이트: 네이버 스포츠의 정보 구조를 참고해 상단 종목 칩, 화면 메뉴, 월 이동, 7일 날짜 스트립, 리그 헤더와 한 줄 경기 일정으로 재구성했다. 버전 2.2.1 → 2.3.0.

> 2026-09-02 F1 업데이트: OpenF1 무료 API를 연결해 F1 일정, 완료 세션 결과, 타이어 전략, 피트스톱, 레이스 컨트롤, 드라이버·컨스트럭터 챔피언십을 추가했다. 버전 2.4.0 → 2.5.0.

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

`windows-nba-widget/`에 Electron 기반 독립 앱을 만들었다. 설치 제품명은 `Orange Sports`이며 현재 버전은 2.5.0이다.

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
- 알림 카드의 포인트·테두리·배경·그림자 색은 종목별로 구분하며 레이아웃과 동작은 동일하다.
- 경기 화면은 종목 선택 → 경기 일정/문자 중계/순위·스탯/설정 → 월·날짜 선택 → 리그별 경기 행 순서로 탐색한다.
- F1은 OpenF1 무료 API로 시즌 일정, 세션별 한국시간, 완료 세션 결과, 드라이버 사진, 타이어 스틴트, 피트스톱과 레이스 컨트롤 기록을 표시한다.
- F1 순위 화면은 가장 최근 무료 접근 가능한 결승을 기준으로 드라이버·컨스트럭터 챔피언십을 표시하며 2023년 이후 과거 시즌을 선택할 수 있다.
- OpenF1 무료 정책에 맞춰 세션 시작 30분 전부터 종료 30분 후까지는 상세 데이터를 요청하지 않고 `라이브 유료` 또는 `결과 준비 중` 안내를 표시한다. F1 실시간 알림은 아직 없다.
- 선택 날짜를 중심으로 앞뒤 3일씩 총 7일을 표시하며 `오늘`, 이전/다음, 달력 선택을 모두 지원한다.
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

F1 일정/과거 세션/챔피언십 (무료, 인증 불필요)
https://api.openf1.org/v1/meetings?year={YEAR}
https://api.openf1.org/v1/sessions?year={YEAR}
https://api.openf1.org/v1/session_result?session_key={SESSION_KEY}
https://api.openf1.org/v1/drivers?session_key={SESSION_KEY}
https://api.openf1.org/v1/race_control?session_key={SESSION_KEY}
https://api.openf1.org/v1/pit?session_key={SESSION_KEY}
https://api.openf1.org/v1/stints?session_key={SESSION_KEY}
https://api.openf1.org/v1/championship_drivers?session_key={SESSION_KEY}
https://api.openf1.org/v1/championship_teams?session_key={SESSION_KEY}
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
- `npm run build`: Windows x64 NSIS 설치 파일 생성 성공(코드 서명 인증서는 없어 SmartScreen 경고 가능)
- 최종 설치 파일명: `Energuard-Sports-Live-Setup-2.1.0.exe`
- 최종 로컬 설치 파일 크기: 93,777,150 bytes (약 89.4 MiB)
- SHA-256: `32B924EE83E89B269ED854BFC969674F7FA439F522B7F770E9E8A7B97FA19D5B`
- ⚠️ 순위 뷰는 이번 커밋 환경(CI 샌드박스)에서 Electron GUI 실행이 막혀 `npm run smoke`/`npm start` 런타임 검증을 못 했다. 로컬에서 `npm start` 후 종목별 **순위** 탭(팀 순위/선수 스탯/플레이오프·토너먼트/시즌 드롭다운)을 한 번 눌러 확인 필요.

### 2.2.1 (2026-09-02)

- 실제 Electron 실행에서 NBA 순위 30팀과 첫 팀 경기 수 82, MLB 순위 30팀 및 애리조나 표시를 확인했다.
- 과거 시즌 실제 데이터로 NBA 선수 스탯 5종/플레이오프 21개, MLB 선수 스탯 8종/플레이오프 11개, EPL 순위 20팀/스탯 2종, UCL 순위 36팀/스탯 2종/토너먼트 23개를 확인했다.
- `npm run check`와 기존 `npm run smoke`를 다시 통과했다.
- 알림창은 `notification.js`가 `html[data-sport]`를 지정하고 `notification.css`가 종목별 컬러 테마를 적용한다.
- `Energuard-Sports-Live-Setup-2.2.1.exe` 패키징 완료, 크기 93,777,510 bytes, SHA-256 `3C590C69C4D870700006D7A5FDD4C4FC968726204606C2851A85734ADE23F492`.
- Authenticode 확인 결과 `NotSigned`이며 코드 서명 인증서는 포함되지 않았다.

### 2.3.0 (2026-09-02)

- 경기 일정 화면을 네이버 스포츠형 구조로 개편했다. 상단 종목 칩, 월 이동, 오늘 버튼, 7일 날짜 스트립, 리그별 한 줄 경기 목록을 공통 적용했다.
- NBA의 세 자리 점수도 열이 어긋나지 않도록 팀·점수 영역을 분리했고, MLB/EPL/UCL도 같은 일정 탐색 구조와 행 스타일을 사용한다.
- 날짜 스트립에서 날짜를 누르면 해당 날짜의 경기 데이터를 즉시 다시 불러오고, 월 이동 및 오늘 복귀도 동일한 선택 날짜 상태를 사용한다.
- 430×760 화면에서 실제 렌더링을 육안 확인했으며 월 제목·UCL 종목명 줄바꿈 문제를 보정했다.
- `npm run check`, `npm run smoke` 통과: NBA/MLB/EPL/UCL 경기 목록과 각 종목 상세 데이터, 알림 적층 동작을 확인했다.
- `Energuard-Sports-Live-Setup-2.3.0.exe` 패키징 완료, 크기 93,779,576 bytes (약 89.44 MiB), SHA-256 `B2949F5C89AE0C7E04BB4EE27E1C18AD56F5D2A520AE7152A009A7573F6FD564`.
- Authenticode 확인 결과 `NotSigned`이며 코드 서명 인증서는 포함되지 않았다.

### 2.3.1 (2026-09-02)

- MLB 일정의 날짜 기준을 미국 경기일이 아니라 한국시간(`Asia/Seoul`) 달력 날짜로 수정했다.
- 선택 날짜의 전날·당일 MLB 일정을 함께 조회하고, `gameDate`를 한국시간으로 변환해 선택 날짜와 일치하는 경기만 표시한다.
- 경기 시각도 시스템 시간대에 의존하지 않고 한국시간으로 명시해 표시한다.
- MLB 공식 일정으로 2026-09-02 한국시간 경기 15개와 진행 중 경기 3개가 필터링되는 것을 확인했다.
- `npm run check` 통과. Electron 스모크는 로컬 GPU 프로세스 오류로 실행되지 않았지만 공식 API 원본을 직접 대조해 날짜 필터 결과를 검증했다.
- `Energuard-Sports-Live-Setup-2.3.1.exe` 패키징 완료, 크기 93,779,732 bytes (약 89.44 MiB), SHA-256 `DBAEF947AAC0E99A7CCD31CE0A627C3E280E1C3503742143184591B1DDB5B5DC`.
- Authenticode 확인 결과 `NotSigned`이며 코드 서명 인증서는 포함되지 않았다.

### 2.4.0 (2026-09-02)

- 사용자 노출 제품명을 `Energuard Sports Live`에서 `Orange Sports`로 변경했다. 창 제목, 타이틀바, 트레이, 설치 파일, 바로가기와 User-Agent에 적용했다.
- 기존 설치판의 설정 파일 경로는 마이그레이션 후보로 유지해 응원 팀·알림·창 설정을 새 이름에서도 읽는다. 기존 `appId`는 설치 업그레이드 호환성을 위해 내부 식별자로 유지한다.
- 현재 진행 중인 각 경기 행에 `알림` 토글을 추가했다. 선택하면 `알림 중`으로 바뀌며 종목별 응원 팀 필터와 OR 조건으로 감시한다.
- 경기별 선택값은 `alertGameIdsBySport`에 NBA/MLB/EPL/UCL별로 저장한다. 해당 경기 알림을 켜거나 끌 때 플레이 기준점을 초기화해 과거 이벤트가 뒤늦게 알림으로 나오지 않게 했다.
- `npm run check`와 경기 필터 단위 검증을 통과했다. 직접 선택 경기, 응원 팀 경기는 포함되고 관계없는 경기는 제외되는 것을 확인했다.
- `Orange-Sports-Setup-2.4.0.exe` 패키징 완료, 크기 93,780,373 bytes (약 89.44 MiB), SHA-256 `945CC4BA78AD2BBA73B75509397C12576263FAB8A0B90E78D789D4CA38A174F6`.
- Authenticode 확인 결과 `NotSigned`이며 코드 서명 인증서는 포함되지 않았다.

### 2.5.0 (2026-09-02)

- 상단 종목 칩에 F1을 추가하고 OpenF1의 `meetings`·`sessions`로 날짜별 그랑프리 세션 일정을 표시한다.
- 무료 접근 가능한 완료 세션에서 최종 결과, 드라이버 사진, 타이어 전략, 피트스톱, 레이스 컨트롤 기록을 표시한다.
- F1 순위 탭에 드라이버·컨스트럭터 챔피언십과 2023년 이후 시즌 선택을 추가했다.
- OpenF1 무료 라이브 제한 구간에는 상세 요청을 보내지 않고 유료 라이브/결과 준비 안내를 표시한다.
- `api.openf1.org`만 Electron 스포츠 프록시 허용 호스트에 추가했다. 모든 OpenF1 요청은 전역 큐에서 최소 360ms 간격과 분당 29회 안전 한도를 적용하고 결과를 메모리 캐시한다.
- `npm run check` 통과. `npm run smoke`에서 F1 일정 1개, 세션 결과 20명, 레이스 컨트롤 78개, 타이어 전략 20명, 드라이버 순위 23명, 컨스트럭터 순위 11개를 실제 응답으로 확인했다. 기존 NBA/MLB/EPL/UCL 및 알림 스모크도 모두 통과했다.
- `Orange-Sports-Setup-2.5.0.exe` 패키징 완료, 크기 93,785,862 bytes(약 89.44 MiB), SHA-256 `7DB220BB819EF14A2EFEF3F9202609FD4BF39C84759D4A0297ED0414065F2411`.
- 기존 `final-release/win-unpacked/resources/app.asar`가 잠겨 있어 빌드는 `release-2.5.0`에서 완료한 뒤 설치 파일과 blockmap을 `final-release`에도 복사했다. Authenticode는 `NotSigned`다.

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
