# 스포츠 위젯 작업 인수인계

최종 갱신: 2026-09-01
대상 저장소: `energuard-system` / `main`

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

`windows-nba-widget/`에 Electron 기반 독립 앱을 만들었다. 설치 제품명은 `Energuard Sports Live`이며 현재 버전은 2.0.0이다.

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
- ESPN 플레이의 선수 ID를 박스스코어 선수 정보와 연결해 이벤트 선수 얼굴을 표시하고, 얼굴이 없으면 해당 팀 로고로 대체한다.
- Windows 앱에 NBA/MLB 종목 전환과 MLB 날짜별 경기 목록을 추가했다.
- MLB 경기 카드에서 이닝별 R/H/E 스코어보드, 현재 타자·투수, B/S/O, 주자, 최근 투구, 득점 장면, 1회부터 전체 플레이를 볼 수 있다.
- EPL과 UCL 종목 전환, 날짜별 경기 목록, 득점·경고·퇴장·교체 이벤트 및 주요 팀 기록을 추가했다.
- UCL 본선(`uefa.champions`)과 예선(`uefa.champions_qual`)을 함께 조회하며, 상세 화면과 알림 클릭 시 원래 리그 경로를 유지한다.
- MLB는 완료된 새 타석, EPL/UCL은 새 득점·퇴장(모든 이벤트 설정 시 카드·교체 포함)을 감지해 카드 알림을 띄운다.
- 응원 팀은 NBA/MLB/EPL/UCL별로 따로 저장하고 해당 팀 경기만 감시할 수 있다.
- 응원 팀별 알림 필터와 알림음 설정
- 알림 클릭 시 해당 경기 문자중계로 이동
- 렌더러가 ESPN에 직접 연결하지 않고 Electron 메인 프로세스가 허용된 ESPN 주소만 요청한다.

주요 파일:

- `windows-nba-widget/main.js`: 창, 트레이, 설정 저장, 시작 프로그램, 카드 알림 창, 스포츠 데이터 프록시
- `windows-nba-widget/preload.js`: 안전한 IPC 공개
- `windows-nba-widget/renderer.js`: 경기 목록, 문자중계, 폴링, 알림 판정
- `windows-nba-widget/index.html`, `styles.css`: UI
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
```

웹 위젯에는 MLB Stats API와 ESPN의 축구·농구 데이터 주소도 사용 중이다. 전체 상수와 요청 코드는 `js/widget-sports.js`에서 확인한다.

## 검증 결과

- `npm run check`: 메인·프리로드·렌더러·알림 스크립트 문법 검사 통과
- `npm run smoke`: NBA 12개, MLB 15개, EPL 5개, UCL 예선 4개 경기 카드 렌더링 확인
- MLB 상세에서 스코어보드·현재 승부·투구 6개·전체 플레이 83개 확인
- EPL 상세 이벤트 13개/팀 기록 2개, UCL 상세 이벤트 20개/팀 기록 2개 확인
- 비시즌 대체 안내와 경기/문자중계/설정 탭 렌더링 확인
- `npm run build`: Windows x64 NSIS 설치 파일 생성 성공
- 최종 설치 파일명: `Energuard-Sports-Live-Setup-2.0.0.exe`
- 최종 로컬 설치 파일 크기: 93,763,803 bytes (약 89.4 MiB)
- SHA-256: `DA2E67AEE7CFBB1B1ED138DCC0B8EBB5D47A38A7856FCA313B0ECF2272B78F45`

## Claude Code에서 버그 수정할 때 확인할 곳

- 기능 뼈대 구현을 우선한 상태라 세부 간격·타이포그래피·반응형 디자인은 `index.html`, `styles.css`, `notification.css`에서 다듬으면 된다.
- 종목 분기는 `renderer.js`의 `loadGames`, `setSport`, `monitorLiveGames`에서 시작한다.
- MLB 알림 판정은 `checkMlbGameNotifications`, EPL/UCL 알림 판정은 `checkSoccerGameNotifications`에 있다.
- EPL/UCL 상세 이벤트는 ESPN `summary` 응답의 `details`, `keyEvents`, `plays`를 합쳐 사용한다. 제공 데이터가 없는 경기는 빈 이벤트로 표시될 수 있다.
- UCL 예선 알림을 눌렀을 때도 예선 상세 주소를 열 수 있도록 `_league`와 `endpointLeague`를 유지하므로 이 전달값을 제거하지 않는다.
- 종목별 응원 팀은 `favoriteBySport`에 저장한다. 이전 NBA 설정은 새 제품명으로 바뀌어도 기존 설정 폴더에서 자동으로 읽는다.
- 실시간 데이터 변경 후에는 `npm run check`, `npm run smoke`, 마지막에 `npm run build` 순서로 확인한다.

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
- 빌드 산출물과 의존성 폴더는 커밋하지 않는다.
