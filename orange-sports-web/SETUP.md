# Orange Sports Web — 다른 PC에서 실행하기 (회사 ↔ 집)

코드는 GitHub `enorangekid/energuard-system` 레포의 `Admin_backup/orange-sports-web/`에 있다.
**의존성이 0이라 `npm install` 이 필요 없다.** Node만 있으면 된다.

---

## 처음 설치하는 PC에서

### 1. 레포 받기
GitHub Desktop으로 `enorangekid/energuard-system` clone.
(이미 clone 돼 있으면 `Fetch/Pull`로 최신화)

### 2. Node 설치 확인
```powershell
node --version
```
없으면 https://nodejs.org 에서 LTS 설치.

### 3. `.env` 만들기
`Admin_backup/orange-sports-web/` 폴더에서 `.env.example` 을 `.env` 로 복사하고 DeepL 키 입력:
```
DEEPL_API_KEY=여기에-복사한-키:fx
```
- DeepL 키는 회사 PC의 `.env` 와 **같은 키를 재사용**하면 된다 (계정당 발급된 키 1개).
- 키가 없어도 서버는 뜬다 (번역만 영어로 폴백).

### 4. 실행
```powershell
cd Admin_backup\orange-sports-web
npm start
```
브라우저에서 `http://127.0.0.1:4173`

### 5. (선택) 번역 캐시 가져오기
회사 PC의 `orange-sports-web/.cache/translations.json` 을 이 PC의 같은 경로에 복사해두면
이미 번역한 기사·이름을 다시 DeepL에 안 보낸다. **없어도 됨** (사용하면서 다시 쌓임).
`.cache/` 는 Git에 포함되지 않으므로 클라우드 드라이브/USB로 직접 옮긴다.

---

## 회사 ↔ 집 동기화 방법

- **코드 수정** → GitHub Desktp에서 Commit + Push → 다른 PC에서 Pull
- **`.env`** → 커밋 안 됨. PC마다 한 번씩 만든다 (키는 재사용)
- **`.cache/translations.json`** → 커밋 안 됨. 필요하면 수동 복사, 아니면 각자 쌓임

---

## 자주 겪는 문제

| 증상 | 원인 / 해결 |
|---|---|
| `.env` 더블클릭 시 암호창 | 은행 보안프로그램이 `.env` 확장자를 물고 있음. 메모장/VS Code로 열 것 |
| 해외 기사가 영어로 나옴 | `.env` 의 `DEEPL_API_KEY` 확인 → `http://127.0.0.1:4173/api/health` 에서 `"deepl":"free"` 여야 함 |
| server.js 수정했는데 반영 안 됨 | 서버 재시작 필요 (`Ctrl+C` → `npm start`). HTML/CSS/JS(public/)는 브라우저 새로고침만 |
| 포트 충돌 | `.env` 에 `ORANGE_SPORTS_PORT=4174` 등으로 변경 |
