# Orange Sports — 아키텍처 보충 문서

작성일: 2026-09-04  
용도: `PROJECT_OVERVIEW.md` 보충 / 향후 구조 판단 기준 정리

> **2026-09-04 갱신 — 배포 방향 확정으로 일부 폐기됨.**
> - Core는 **NAS(인터넷)** 에서 운영한다. 자세한 인프라·배포 계획은 `INFRA_PLAN.md`.
> - 따라서 **6장·7장의 "Windows가 로컬 `server.js`를 자식 프로세스로 실행(`spawnedCore`)"은 폐기.** 위젯은 NAS의 Core API를 호출하는 인터넷 클라이언트다.
> - 5·11장의 renderer.js 이식은 유효하나 **문자중계 UI는 공개 웹에 옮기지 않는다** — 데이터 처리 로직만 Core로, UI는 Windows 위젯 전용 (`INFRA_PLAN.md` 1장).
> - 나머지(2·3·4·10·12·13·14장의 Core/API 원칙, 정규화 책임, "지금 하지 말 것")는 그대로 유효.

---

## 1. 이 문서의 목적

현재 Orange Sports의 큰 방향은 다음과 같다.

- **Web을 본체로 운영**
- **Windows 앱은 트레이·실시간 알림 중심의 보조 클라이언트로 축소**
- Windows 앱이 없어도 Web은 완전히 동작해야 함
- 외부 스포츠 데이터 접근은 가능한 한 한 곳으로 모아 중복 호출과 유지보수 비용을 줄임

이 문서는 위 방향을 실제 코드 구조와 런타임 관계로 구체화하기 위한 보충 문서다.

---

## 2. 최종 권장 구조

Orange Sports를 단순히 `Web`과 `Windows` 두 제품으로만 보지 않고, 아래 3계층으로 보는 것이 가장 명확하다.

```text
ESPN / MLB StatsAPI / OpenF1 / Naver / Google News
                        ↓
               Orange Sports Core/API
                 - 외부 API 접근
                 - 캐시
                 - 번역
                 - 데이터 정규화
                 - 기사 처리
                 - 공통 API 제공
                   ↓             ↓
          Orange Sports Web   Windows Client
          - 메인 UI            - 트레이
          - 뉴스               - 실시간 알림
          - 일정               - 백그라운드 감시
          - 순위
          - 선수 스탯
          - 경기 상세
          - 문자중계
          - 플레이오프
```

현재는 `orange-sports-web/server.js`가 Core/API와 정적 파일 서버 역할을 함께 담당하고 있으므로, **당장 별도 프로젝트로 분리할 필요는 없다.**

중요한 것은 폴더명이 아니라 **역할의 경계**다.

---

## 3. 핵심 원칙

### 원칙 1. Windows 앱이 없어도 Web은 100% 동작한다

Orange Sports의 본체는 Web이다.

따라서 다음 기능은 Windows 앱 실행 여부와 무관하게 Web에서 모두 동작해야 한다.

- 뉴스
- 일정
- 순위
- 선수 기록
- 경기 상세
- 문자중계
- 플레이오프 / 토너먼트
- 기사 리더

Windows는 Web의 기능을 보완하는 클라이언트이지, Web 실행에 필요한 부모 프로세스가 아니다.

---

### 원칙 2. 외부 스포츠 API 호출 창구는 Core/API로 최대한 통합한다

Web과 Windows가 각각 ESPN, MLB StatsAPI, OpenF1 등을 직접 호출하지 않는다.

권장 흐름:

```text
외부 API
   ↓
Orange Sports Core/API
   ↓
표준화된 Orange Sports 데이터
   ↓
┌───────────────┬────────────────┐
│ Web UI        │ Windows Client │
└───────────────┴────────────────┘
```

Windows 앱은 가능하면 다음과 같은 로컬 API를 사용한다.

```text
GET /api/sports/mlb/schedule
GET /api/sports/nba/schedule
GET /api/sports/football/schedule
GET /api/sports/f1/schedule
```

이렇게 하면:

- 동일 데이터 중복 호출 감소
- ESPN 비공식 API 차단 위험 감소
- OpenF1 레이트리밋 부담 감소
- 캐시 로직 중복 구현 방지
- Web과 Windows 간 경기 상태 해석 차이 방지
- 외부 API 구조 변경 시 수정 지점 축소

---

## 4. "코드 공유"와 "API 재사용"의 구분

두 개념은 경쟁 관계가 아니라 서로 다른 레벨에서 함께 사용한다.

### Core 내부에서는 코드 공유

예:

```text
외부 API 응답
   ↓
normalizeMlbGame()
normalizeEspnGame()
normalizeF1Session()
   ↓
Orange Sports 표준 경기 객체
```

정규화 함수는 DOM이나 Electron 객체에 의존하지 않는 **순수 JavaScript 함수**로 만드는 것이 좋다.

예시:

```js
{
  id: "game-id",
  sport: "mlb",
  status: "live",
  startTime: "...",
  home: {
    id: "...",
    name: "...",
    score: 3
  },
  away: {
    id: "...",
    name: "...",
    score: 2
  },
  period: {
    label: "8회초"
  },
  events: []
}
```

### Web과 Windows 사이에서는 API 재사용

Web과 Windows가 같은 정규화 모듈을 각각 불러 외부 API를 다시 호출하는 것이 아니라, Core/API가 정규화한 결과를 둘 다 받는다.

즉:

> 코드 공유는 Core 내부에서  
> 데이터 공유는 Core API를 통해

이 구조를 기본 원칙으로 한다.

---

## 5. renderer.js 이식 시 가장 먼저 해야 할 작업

기존 Electron의 `renderer.js`에는 경기센터, 문자중계, 순위, 스탯, F1 기능 등이 한 파일에 섞여 있다.

웹 이식 전에 먼저 다음 세 영역을 구분해야 한다.

```text
1. 데이터 취득
   fetch / API 호출

2. 데이터 정규화
   원본 API 응답 → Orange Sports 내부 객체

3. 화면 렌더링
   내부 객체 → DOM
```

특히 `2. 데이터 정규화`는 Web이나 Electron UI에 종속되지 않도록 분리해야 한다.

잘못된 이식 방식:

```text
renderer.js 코드 복사
→ Web DOM에 맞게 수정
→ 기존 로직과 웹 로직이 갈라짐
```

권장 방식:

```text
renderer.js 분석
→ 데이터 처리와 DOM 처리 분리
→ 정규화 로직을 Core 쪽으로 이동
→ Web은 Core API 결과만 렌더링
```

이렇게 해야 기능 이식이 끝난 뒤에도 동일 기능을 두 군데서 따로 유지보수하는 상황을 피할 수 있다.

---

## 6. Windows 알림 클라이언트의 런타임 구조

Windows 앱이 Core/API를 사용하게 되면 다음 의존 관계가 생긴다.

```text
Core/API → Web
Core/API → Windows
```

즉 Windows는 Core가 없으면 알림 데이터를 받을 수 없다.

이 의존성은 허용한다.

대신 사용자가 별도로 Web 서버를 실행하지 않아도 Windows 앱 하나만 실행하면 알림이 동작하도록 다음 구조를 권장한다.

### Windows 실행 시

```text
Windows 앱 실행
        ↓
GET http://127.0.0.1:4173/api/health
        ↓
┌─────────────────────────────┐
│ Core가 이미 실행 중         │
│ → 기존 Core 그대로 사용     │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Core가 실행 중이 아님       │
│ → Windows가 Core 자동 실행  │
└─────────────────────────────┘
```

Electron에서 Core를 자식 프로세스로 실행하는 방식이 현실적이다.

---

## 7. Core 종료 정책

Windows 앱이 Core를 자동 실행했다고 해서 Windows 종료 시 항상 Core를 종료하면 안 된다.

예를 들어 사용자가 이미 브라우저에서 Orange Sports Web을 사용 중일 수 있다.

따라서 Windows 앱은 자신이 Core를 실행했는지 여부를 기록해야 한다.

예:

```js
let spawnedCore = false;
let coreProcess = null;
```

동작 원칙:

```text
실행 시 기존 Core 발견
→ spawnedCore = false

기존 Core 없음
→ Windows가 Core 실행
→ spawnedCore = true
```

Windows 종료 시에는:

- `spawnedCore === true`일 때만 종료 여부 판단
- 기존에 외부에서 실행된 Core는 건드리지 않음

향후 Web과 Windows를 동시에 사용하는 비율이 높아지면 Core를 독립 상주 서비스처럼 운영하는 방식도 검토할 수 있다.

---

## 8. Windows 알림 감지 방식

초기에는 복잡한 WebSocket 구조가 필요 없다.

Windows 클라이언트가 Core API를 일정 주기로 조회한 뒤 이전 상태와 비교해 이벤트를 감지하면 충분하다.

예:

```text
10~20초마다 Core API 조회
        ↓
이전 경기 상태와 비교
        ↓
득점 / 경기 시작 / 경기 종료 / 이닝 변경 감지
        ↓
Windows 알림
```

예시 이벤트:

```text
game_start
score_change
inning_change
period_change
game_end
```

현재 단계에서는 폴링 방식이 단순하고 유지보수가 쉽다.

---

## 9. 향후 선택 사항 — SSE / WebSocket

Core 중심 구조가 안정된 뒤에는 Windows가 계속 폴링하지 않고 Core에서 이벤트를 밀어주는 방식으로 발전시킬 수 있다.

예:

```text
외부 데이터 감시
      ↓
Orange Sports Core
      ↓
SSE / WebSocket
      ↓
Windows Client
      ↓
Native Notification
```

하지만 경기 상세 이식과 Core 정규화가 완료되기 전에는 우선순위가 아니다.

**지금은 폴링 유지가 적절하다.**

---

## 10. 현재 server.js에 대한 판단

현재 `orange-sports-web/server.js`에는 이미 다음 역할이 존재한다.

- API 프록시
- `cachedFetch`
- 스포츠 일정/순위/스탯 처리
- 뉴스 수집
- 기사 본문 처리
- DeepL 번역
- 메모리 캐시
- 정적 파일 서빙

따라서 새 Core 서버를 처음부터 만드는 것보다, 현재 `server.js`를 **Orange Sports Core/API의 출발점**으로 보는 것이 현실적이다.

다만 기능이 늘어나면 다음처럼 내부 파일을 분리하는 것을 고려한다.

```text
orange-sports-web/
├── server.js
├── core/
│   ├── providers/
│   │   ├── espn.js
│   │   ├── mlb.js
│   │   ├── openf1.js
│   │   └── news.js
│   ├── normalizers/
│   │   ├── mlb.js
│   │   ├── espn.js
│   │   └── f1.js
│   ├── services/
│   │   ├── schedule.js
│   │   ├── standings.js
│   │   ├── leaders.js
│   │   ├── game-detail.js
│   │   └── translation.js
│   └── cache/
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── ...
```

이 구조는 예시이며, 당장 대규모 리팩터링을 강제하지 않는다.

**경기 상세 이식 과정에서 필요한 부분부터 점진적으로 분리한다.**

---

## 11. 경기 상세 이식 권장 순서

다음 작업의 우선순위는 아래와 같이 잡는다.

### 1단계 — Electron 경기센터 코드 분석

`renderer.js`의 경기센터/문자중계 영역에서 다음을 표시한다.

- 외부 API 호출부
- 원본 응답 파싱부
- 경기 상태 계산부
- 이벤트 생성부
- DOM 렌더링부

### 2단계 — 정규화 로직 분리

종목별로 표준 경기 객체를 반환하도록 정리한다.

우선 대상:

1. MLB
2. NBA
3. 해외축구
4. F1

### 3단계 — Core 경기 상세 API 구현

예:

```text
GET /api/sports/mlb/game/{id}
GET /api/sports/nba/game/{id}
GET /api/sports/football/game/{id}
GET /api/sports/f1/session/{id}
```

실제 URL 설계는 기존 라우트 스타일에 맞춰 조정한다.

### 4단계 — Web 경기센터 렌더링

Web은 원본 ESPN/MLB/OpenF1 데이터를 직접 이해하지 않고 Core에서 받은 표준 객체만 렌더링한다.

### 5단계 — Windows 알림 소스 변경

기존 Windows의 외부 API 직접 폴링을 Core API 호출 방식으로 교체한다.

### 6단계 — 중복 코드 제거

Web 이식과 Windows 전환이 검증된 뒤 Electron `renderer.js`의 기존 데이터 처리 코드를 제거한다.

---

## 12. 당장 하지 않아도 되는 것

현재 단계에서는 아래 작업을 서두르지 않는다.

- Core를 별도 npm 패키지로 분리
- Monorepo 전환
- TypeScript 전환
- Express/Fastify 도입
- WebSocket 서버 구축
- Redis/Supabase/KV 즉시 도입
- 모든 기존 Electron 코드를 한 번에 리팩터링

현재 Orange Sports는 개인 사용/소수 배포 목적이고 Node 내장 `http` 기반 구조도 잘 동작하고 있으므로, **복잡도를 먼저 늘리지 않는다.**

기능 이식 과정에서 실제로 필요해질 때 구조를 확장한다.

---

## 13. 최종 판단 기준

향후 구조가 애매해질 때는 아래 질문으로 판단한다.

### 질문 A

> Windows 앱을 완전히 종료해도 이 기능이 Web에서 정상 동작하는가?

아니라면 Web 본체 원칙에 어긋날 가능성이 높다.

### 질문 B

> 이 기능 때문에 Web과 Windows가 동일한 외부 API를 각각 호출하고 있는가?

그렇다면 Core/API로 합칠 수 있는지 우선 검토한다.

### 질문 C

> 외부 API의 응답 구조를 Web UI나 Windows 알림 코드가 직접 알고 있는가?

그렇다면 정규화 책임이 Core 밖으로 새어나간 것이다.

### 질문 D

> 같은 경기 상태를 Web과 Windows가 서로 다르게 판단할 가능성이 있는가?

그렇다면 공통 데이터 모델 또는 Core API에서 통일해야 한다.

---

## 14. 현재 확정할 아키텍처 원칙

최종적으로 다음 세 가지를 Orange Sports의 기본 설계 원칙으로 둔다.

> **1. Windows 앱이 없어도 Orange Sports Web은 100% 동작한다.**

> **2. Web과 Windows는 외부 스포츠 API를 제각각 호출하지 않고, 가능한 한 Orange Sports Core/API를 단일 데이터 창구로 사용한다.**

> **3. 외부 서비스의 제각각인 응답을 Orange Sports 내부 표준 데이터로 변환하는 책임은 Core가 가진다.**

이 원칙을 유지하면 향후 Web 독립 실행, Windows 알림 클라이언트, 서버리스 이전, 모바일 접근 등으로 확장하더라도 제품 구조가 크게 흔들리지 않는다.

---

## 15. 다음 작업

가장 먼저 할 일은 `renderer.js`의 경기센터/문자중계 코드를 Web으로 복사하는 것이 아니다.

**먼저 해당 영역을 분석해 `데이터 취득 → 정규화 → 렌더링` 세 부분으로 구분하고, 정규화 로직을 Core로 옮길 수 있는 형태인지 확인한다.**

그 이후 MLB 경기 상세부터 하나씩 Web으로 이식한다.
