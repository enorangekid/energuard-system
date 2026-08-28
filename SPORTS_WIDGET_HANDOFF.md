# 스포츠 위젯 작업 인수인계

작성일: 2026-08-28  
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

### NBA Windows 전용 위젯

`windows-nba-widget/`에 Electron 기반 독립 앱을 만들었다.

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
- 득점/쿼터 종료 또는 모든 플레이 Windows 알림
- 응원 팀별 알림 필터와 알림음 설정
- 알림 클릭 시 해당 경기 문자중계로 이동
- 렌더러가 ESPN에 직접 연결하지 않고 Electron 메인 프로세스가 허용된 ESPN 주소만 요청한다.

주요 파일:

- `windows-nba-widget/main.js`: 창, 트레이, 설정 저장, 시작 프로그램, Windows 알림, ESPN 프록시
- `windows-nba-widget/preload.js`: 안전한 IPC 공개
- `windows-nba-widget/renderer.js`: 경기 목록, 문자중계, 폴링, 알림 판정
- `windows-nba-widget/index.html`, `styles.css`: UI
- `windows-nba-widget/package.json`: 실행/검사/NSIS 빌드

## 사용하는 데이터 주소

공식 리그 API 계약이 아니라 ESPN 공개 응답을 사용하므로 응답 구조나 접근 정책이 바뀌면 수정이 필요할 수 있다.

```text
경기 목록
https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard

NBA 상세 문자중계
https://cdn.espn.com/core/nba/playbyplay?xhr=1&gameId={GAME_ID}
```

웹 위젯에는 MLB Stats API와 ESPN의 축구·농구 데이터 주소도 사용 중이다. 전체 상수와 요청 코드는 `js/widget-sports.js`에서 확인한다.

## 검증 결과

- `npm run check`: `main.js`, `preload.js`, `renderer.js` 문법 검사 통과
- `npm run smoke`: ESPN 데이터를 받아 경기 카드 12개 렌더링 확인
- 비시즌 대체 안내와 경기/문자중계/설정 탭 렌더링 확인
- `npm run build`: Windows x64 NSIS 설치 파일 생성 성공
- 마지막 로컬 설치 파일: `NBA-Live-Widget-Setup-1.0.0.exe`, 약 89.4MB

## 알아둘 점과 다음 후보 작업

- 설치 파일은 코드 서명 인증서가 없어 다른 PC에서 SmartScreen 경고가 나올 수 있다.
- 한국어 문자중계는 ESPN 영문 문장을 규칙 기반으로 치환한다. 선수명은 원문이며 일부 드문 플레이 표현은 영어로 남을 수 있다.
- Windows 알림은 앱이 실행 중이거나 트레이에 남아 있을 때 작동한다.
- ESPN 데이터가 없는 경기에는 플레이 기록이나 선수 기록이 표시되지 않는다.
- 현재 앱 아이콘은 Electron 기본 아이콘이다. 배포 전 전용 `.ico` 제작을 권장한다.
- 패키징 시 Windows 파일 점유 문제가 있어 설치 파일 출력 폴더를 `final-release`로 분리하고, 설치된 Electron 런타임을 재사용하도록 빌드 명령을 설정했다.
- `npm install` 결과 개발 의존성 감사에서 high 등급 2건이 보고됐다. 무작정 `npm audit fix --force`를 실행하지 말고 Electron/electron-builder 호환성을 확인하며 올린다.

## Git 참고

- 직전 기준 커밋: `c28ab24 feat: 스포츠 위젯 리그 및 문자중계 확장`
- 이 문서와 NBA 웹 문자중계 보완, Windows 앱 소스는 다음 커밋에 포함된다.
- 빌드 산출물과 의존성 폴더는 커밋하지 않는다.
