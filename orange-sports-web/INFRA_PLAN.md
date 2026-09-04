# Orange Sports — 인프라 / 배포 방향 (확정)

작성일 2026-09-04. `PROJECT_OVERVIEW.md` · `ORANGE_SPORTS_ARCHITECTURE_ADDENDUM.md`와 세트.

---

## 0. 한 줄 요약

> **지금은 로컬에서 기능을 완성한다. 향후 자체 미디어서버·웹게임·니치사이트·개인 서버까지 고려한 NAS(홈랩)를 구축하고, 그때 완성된 Orange Sports를 NAS로 이전해 `공개 Web + Windows 위젯` 구조로 운영한다.**

Render / Railway 등 관리형 클라우드에는 **지금 배포하지 않는다.**

---

## 1. 제품 경계 (확정)

| | 공개 웹페이지 | Windows 위젯 (설치파일) |
|---|---|---|
| 접근 | 주소만 공유하면 누구나 | 설치한 사람만 |
| 종목별 실시간 뉴스 | ✅ | — |
| 팀 순위 / 선수 순위 / 선수 스탯 / 과거 시즌 | ✅ | — |
| 경기 일정 | ✅ | ✅ |
| **현재 경기상황** (3회말 / 2쿼터 / 전반 35분 / 2:1) | ✅ (요약 상태만) | ✅ |
| **상세 문자중계** (매 플레이) | ❌ | ✅ |
| 응원팀 / 관심경기 설정 | — | ✅ |
| 득점·시작·종료 감지 + Windows 네이티브 알림 | — | ✅ |

**핵심: 문자중계 UI는 공개 웹에 만들지 않는다.**
- 웹의 "현재 경기상황"은 이미 `normalizeSchedule`이 만드는 상태 라벨 + 스코어 수준으로 충분
- 매 플레이 단위 문자중계는 위젯 전용. 그 **데이터 처리 로직은 Core로** 가져오되(위젯이 씀), **UI는 위젯에만** 둔다
- 위젯 미설치 사용자는 웹은 쓰지만 문자중계·알림은 못 씀 (의도된 경계)

---

## 2. 최종 목표 구조

```
GitHub (코드 저장·관리)
   │  git push
   ▼
NAS  (홈랩 서버)
├─ Orange Sports Core/API   ← 외부 API 접근·캐시·번역·정규화·공통 API
├─ Orange Sports Web        ← 공개 UI (정적 + Core API 소비)
├─ DATA_DIR/  (translations.json 등 영구 데이터)
├─ (그 외 Plex/Jellyfin, 웹게임, 니치사이트, DB, 개발서버 …)
└─ Cloudflare Tunnel
   ▼
인터넷  (https://sports.example.com)
   ├─ 회사 PC / 집 PC / 휴대폰  → 공개 웹
   └─ Windows 위젯             → 같은 Core API 호출
```

- NAS는 단순 저장장치가 아니라 **개인 서버 인프라(홈랩)**. Orange Sports 하나만이면 소형 VPS가 낫지만, 미디어서버·웹게임·니치사이트·백업까지 고려하면 NAS 구축의 의미가 커짐
- 공인 IP 노출·포트포워딩 없이 **Cloudflare Tunnel**로 도메인 연결
- **`ORANGE_SPORTS_ARCHITECTURE_ADDENDUM.md`의 "Windows가 로컬 server.js를 자식 프로세스로 실행(`spawnedCore`)" 부분은 폐기.** Core가 NAS(인터넷)에 있으므로 위젯은 그냥 그 API를 호출하는 클라이언트다.

---

## 3. 지금(로컬 개발 중) 반드시 지킬 원칙

NAS 이전을 "설정 교체" 수준으로 만들기 위해 개발 단계에서 미리 지킨다.

| 원칙 | 지금 | 나중 |
|---|---|---|
| **DATA_DIR 환경변수** | `translations.json` 경로를 `process.env.DATA_DIR \|\| './.cache'`로 (현재 `path.join(__dirname,'.cache',...)` 하드코딩 상태) | NAS 볼륨 경로 한 줄 교체 |
| **Dockerfile** | server.js 의존성 0 → `FROM node:22-alpine` + `CMD ["node","server.js"]` 수준. "내 PC 실행 == NAS 실행" 같은 이미지 | 컨테이너 그대로 배포 |
| **base URL 설정화** | 프론트/위젯이 서버 주소를 하드코딩하지 않음 (`ORANGE_SPORTS_BASE` 등) | `https://sports.example.com` 로 값만 변경 |
| **PUBLIC_MODE 플래그** | 켜지면 기사 전문 리더 off(요약만), 번역 범위 축소 | 공개 배포 시 on. 로컬 개인판은 off(풀기능) |
| **비밀값은 .env** | DeepL 키 등 이미 `.env` (gitignore) | NAS 컨테이너 환경변수로 주입 |
| **영구데이터 ↔ 코드 분리** | 캐시/데이터는 `DATA_DIR` 아래로 모음 | NAS 볼륨 마운트 |

---

## 4. 저작권 / 데이터 소스 (공개 전 확인)

- **국내 기사 전문 추출**(`extractKoreanArticleBody`)은 개인 열람 전용. **공개 웹(PUBLIC_MODE)에서는 제거** → 썸네일·제목·요약·언론사·발행시간·원문 링크까지만
- 네이버 뉴스 스크래핑, ESPN/MLB/OpenF1은 공식 제휴 API 아님(best-effort). **공유 범위를 키우기 전 각 소스 이용약관 재확인**
- DeepL API Free 한도 = 월 50만 자. 번역 캐시(`translations.json`) 유실이 곧 재번역 = 실비용이므로:
  - 로컬: 파일 유지로 충분
  - NAS: `DATA_DIR` 볼륨에 영속. 그래도 부족하면 **Supabase 테이블**(`translation_cache(source_text pk, translated_text)`) — 이미 다른 프로젝트에서 Supabase 사용 중

---

## 5. 진행 순서

```
1. Orange Sports 로컬 기능 완성
     · 뉴스 / 순위 / 선수스탯 / 과거시즌 / 일정 / 현재 경기상황  ← 대부분 완료
     · 남음: 순위표 고도화(지구별·승격강등 색), UCL 순위·스탯, (선택) 경기상황 인라인뷰
2. Core/API 구조 정리 (필요한 만큼만 providers/normalizers/services 분리)
3. 위 3장 4원칙 코드에 반영 (DATA_DIR · Dockerfile · base URL · PUBLIC_MODE)
4. NAS 제품·구성 결정 (x86 CPU / Docker 지원 / RAM 확장 / Intel Quick Sync 여부)
5. NAS 구축 + Docker 환경
6. Orange Sports NAS 이전 (컨테이너 실행 + DATA_DIR 볼륨 연결)
7. Cloudflare Tunnel + 도메인 연결
8. 공개 웹 오픈 (PUBLIC_MODE on)
9. Windows 위젯 데이터 소스를 NAS Core/API로 변경 + 설치파일 재빌드
10. 문자중계 데이터 레이어를 Core에 추가 (위젯용)
```

**원칙: 지금 개발 과정에 NAS·Docker·Cloudflare·서버운영을 한꺼번에 끌어들이지 않는다.** 로컬에서 프로그램을 완성하고, NAS 시점에 완성본을 이전한다.

---

## 6. 감안할 리스크

- **NAS 가동률 vs 위젯 알림** — 위젯의 존재 이유가 실시간 알림인데 정전·ISP 장애·NAS 재부팅 시 알림을 놓칠 수 있음. 완화: UPS + BIOS 자동복구 + Docker `restart: unless-stopped` + DSM 재부팅 저트래픽 시간 예약 + **위젯에 "재연결 중" 재시도 로직**. 계획 재부팅은 월 1~2회·각 수 분 수준으로 관리 가능하나 관리형 클라우드보다는 가동률이 낮음
- **NAS 구축 전 공백** — 그 전에도 회사/집 접속이 필요하면 **현재 PC에서 `cloudflared` 실행**으로 `127.0.0.1:4173`을 임시 공개 가능(PC 켜져 있을 때만, NAS와 같은 터널 기술)
- **RAID ≠ 백업** — NAS를 사진·백업 저장소로도 쓸 거면 오프사이트 1부 더 (3-2-1)
- **컴퓨트 vs 스토리지** — 홈랩 야망이 크면 미니PC(N100/N305, RAM 16~32GB, Docker) + 별도 스토리지 조합이 스펙 대비 유리. "NAS 먼저, 부족하면 미니PC 추가"도 가능
