# 개념

**mattpocock/skills**는 TypeScript 강사 Matt Pocock이 매일 실무에서 쓰는 **에이전트 스킬 모음**입니다.
Claude Code, Codex, Copilot 같은 코딩 에이전트에 설치해서 `/grill-with-docs`, `/to-spec`, `/implement` 같은 슬래시 명령으로 부릅니다.
무료 오픈소스(MIT 라이선스)이며, Claude Code에서는 **플러그인**(`mattpocock-skills`) 한 번 설치로 스킬 27개가 한꺼번에 들어옵니다.

저자가 내세우는 방향은 "바이브 코딩이 아니라 **진짜 엔지니어링**"입니다.
GSD·BMAD·Spec-Kit처럼 개발 과정 전체를 대신 쥐는 프레임워크와 달리, 이 스킬들은 **작고, 고치기 쉽고, 서로 조합**해서 쓰도록 만들어졌습니다.
각 스킬은 결국 `SKILL.md` 마크다운 파일 하나이므로, 읽어 보고 내 입맛대로 고쳐 쓸 수 있습니다.

> 이 가이드는 mattpocock-skills **1.3.2** (2026-10-31 커밋 `4ae2317`) 를 기준으로 작성했습니다. 버전이 올라가면 스킬 이름·질문 내용·출력이 조금 달라질 수 있습니다.

## 이 스킬들이 고치려는 4가지 문제

| 문제 | 증상 | 해결 스킬 |
|---|---|---|
| **1. 에이전트가 내 뜻대로 안 한다** | 다 만들고 나서야 "그게 아닌데…" | `/grill-with-docs`, `/grill-me` — 시작 전에 에이전트가 나를 **꼬치꼬치 인터뷰** |
| **2. 에이전트가 너무 장황하다** | 한 단어면 될 걸 스무 단어로 설명 | `/grill-with-docs` — 프로젝트 **용어집(`GLOSSARY.md`)** 을 함께 만듦 |
| **3. 코드가 동작하지 않는다** | 테스트 없이 "다 됐습니다" | `/tdd`, `/diagnosing-bugs` — **빨강→초록** 피드백 루프 |
| **4. 진흙덩어리 코드가 된다** | 빨리 만든 만큼 빨리 복잡해짐 | `/to-spec`, `/improve-codebase-architecture` — **설계를 매일 챙김** |

## 핵심 개념 6가지

### 1. Skill (스킬)과 두 가지 호출 방식
스킬은 `skills/<분류>/<이름>/SKILL.md` 파일 하나로 된 "에이전트용 작업 설명서"입니다. 이 저장소의 스킬은 **누가 부를 수 있는가**로 둘로 나뉩니다.

- **User-invoked (사용자 호출)**: **사람이 `/이름`을 직접 입력해야만** 실행됩니다. 흐름을 지휘하는 역할입니다. 예) `/grill-with-docs`, `/to-spec`, `/to-tickets`, `/implement`
- **Model-invoked (모델 호출)**: 사람이 불러도 되고, **상황이 맞으면 에이전트가 알아서** 꺼내 씁니다. 재사용되는 규율을 담고 있습니다. 예) `tdd`, `code-review`, `grilling`, `domain-modeling`

사용자 호출 스킬은 내부에서 모델 호출 스킬을 부릅니다. 예를 들어 `/implement`는 안에서 `tdd`와 `code-review`를 부릅니다.

### 2. Grilling (그릴링, 꼬치꼬치 인터뷰)
에이전트가 나에게 질문을 **라운드(round)** 단위로 묶어서 던집니다. 질문마다 **추천 답(➡️)** 이 붙어 있어서 `yes`만 입력하면 추천 답을 받아들인 것이 됩니다.
결정 하나가 정해지면 그 결정에 딸린 다음 질문들이 열리고(이를 **frontier, 최전선**이라 부름), 더 물을 것이 없을 때 끝납니다.
**사실 확인**(파일에 뭐가 있는지 등)은 에이전트가 직접 하고, **결정**만 사람에게 묻는 것이 원칙입니다.

### 3. Shared Language (공유 언어) — `GLOSSARY.md`와 ADR
- **`GLOSSARY.md`**: 이 프로젝트에서만 쓰는 용어를 한두 문장으로 정의하고, 쓰지 말아야 할 동의어를 `_Avoid_`로 적는 용어집입니다. 에이전트가 이 용어로 말하고, 변수·함수 이름도 이 용어로 짓게 됩니다.
- **ADR (Architecture Decision Record)**: `docs/adr/0001-제목.md` 형태의 짧은 결정 기록입니다. **되돌리기 어렵고, 맥락 없이 보면 이상하고, 진짜 대안 중에 고른 결정**일 때만 만듭니다.

### 4. Issue Tracker (이슈 트래커)
스펙과 티켓을 어디에 저장할지 정한 곳입니다. GitHub Issues, GitLab Issues, **로컬 마크다운 파일**(`.scratch/` 폴더) 중에서 고릅니다.
이 가이드는 GitHub 계정 없이도 따라 할 수 있도록 **로컬 마크다운**을 사용합니다.

### 5. Tracer-bullet Ticket (예광탄 티켓)과 Blocking Edge
큰 작업을 **세로로 얇게 자른 조각**(티켓)으로 나눕니다. 각 티켓은 혼자서도 끝까지 동작을 확인할 수 있어야 하고, 새 대화 창 하나에 들어갈 만큼 작아야 합니다.
티켓마다 "이 티켓보다 먼저 끝나야 하는 티켓"(**Blocked by**, 막는 간선)을 적어서 작업 순서를 표시합니다.

### 6. Seam (이음매)과 Two-axis Review (두 축 리뷰)
- **Seam**: 테스트를 거는 공개 경계(함수·모듈의 바깥 인터페이스)입니다. `/tdd`는 테스트를 쓰기 전에 **어느 seam에서 테스트할지 사람에게 먼저 확인**받습니다.
- **Two-axis review**: `code-review`는 변경분을 두 서브에이전트가 따로 봅니다. **Standards**(저장소 코딩 규칙·코드 냄새를 지켰나)와 **Spec**(스펙대로 만들었나)입니다. 두 결과를 섞지 않고 나란히 보여 줍니다.

## 추가로 알아두면 좋은 개념

| 개념 | 설명 |
|---|---|
| **`/setup-matt-pocock-skills`** | 저장소마다 **한 번** 실행하는 준비 스킬. 이슈 트래커·트리아지 라벨·용어집 위치를 정해서 `docs/agents/`에 적고, `CLAUDE.md`에 `## Agent skills` 블록을 추가합니다. |
| **`/ask-matt`** | "지금 상황엔 어떤 스킬을 써야 하지?"를 물어보는 길잡이 스킬. 스킬이 기억나지 않을 때 씁니다. |
| **Context hygiene (맥락 위생)** | `grill-with-docs → to-spec → to-tickets`는 **한 대화 창에서 끊지 않고** 진행하고, 티켓 구현(`/implement`)은 티켓마다 `/clear`로 비운 **새 창**에서 시작합니다. |
| **Smart zone** | 모델이 또렷하게 추론하는 대화 길이(최신 모델 기준 약 15만 토큰). 넘어갈 것 같으면 단계 경계에서 `/compact` 합니다. |
| **Plugin 접두어** | 플러그인으로 설치한 스킬의 정식 이름은 `/mattpocock-skills:grill-with-docs`처럼 앞에 플러그인 이름이 붙습니다. 보통은 `/grill-with-docs`만 입력해도 되지만, Claude Code 기본 명령과 이름이 겹치는 `code-review`·`research`·`prototype`은 **정식 이름**으로 부르는 것이 안전합니다. |
| **skills.sh 설치** | `npx skills@latest add mattpocock/skills`로 스킬 파일을 내 프로젝트에 **복사**하는 방식. 직접 고칠 수 있지만 자동 업데이트가 없습니다. **플러그인과 둘 중 하나만** 고르세요. 둘 다 깔면 스킬이 두 벌이 됩니다. |

## mattpocock/skills의 기본 사이클 (Main flow)

> 이 가이드는 처음 써보는 사람을 위한 **가장 기본적인 흐름**만 다룹니다.
> **설치 → 저장소 준비(setup) → 인터뷰(grill) → 스펙 → 티켓 → 구현(TDD + 리뷰)**
> 미리 준비된 작은 할 일 관리 앱(`todo-app` 폴더)을 복사해서, 여기에 **반복 할 일**("매주 월요일 분리수거") 기능을 추가하며 이 흐름을 한 바퀴 돌아봅니다.

```
플러그인 설치 (한 번)
   │
   ▼
/setup-matt-pocock-skills   ← 저장소마다 한 번
   │
   ▼
┌─────────── 한 대화 창에서 이어서 ───────────┐
│ /grill-with-docs  아이디어를 인터뷰로 다듬기 │ → GLOSSARY.md, (ADR)
│        ▼                                    │
│ /to-spec          대화를 스펙으로 정리       │ → .scratch/<기능>/spec.md
│        ▼                                    │
│ /to-tickets       스펙을 티켓으로 쪼개기     │ → .scratch/<기능>/issues/01-….md
└─────────────────────────────────────────────┘
   │
   ▼  (/clear 후 티켓마다 새 창)
/implement 01 → tdd(빨강→초록) → code-review → 커밋
/implement 02 → …
/implement 03 → …
```

### 왜 "반복 할 일"인가

할 일 앱은 누구나 알지만, "삭제 기능 추가" 같은 뻔한 기능은 인터뷰할 거리도, 용어집에 적을 말도 거의 없습니다.
**반복 할 일**은 사람이 정해야 할 것이 많아서 이 스킬들의 장점이 잘 드러납니다.

- 이번 회차를 완료하면 다음 회차는 **언제** 생기나? 완료하는 순간인가, 날짜가 되면인가?
- 다음 마감일은 **원래 마감일** 기준인가, **완료한 날** 기준인가?
- 지난 회차를 안 하고 넘어가면 쌓이나, 사라지나?
- 하나를 지우면 이번 회차만인가, 반복 전체인가?

이 질문들에 답하는 과정에서 **반복 규칙, 회차, 반복 시리즈** 같은 이 프로젝트만의 용어가 생기고, 기능도 자연스럽게 여러 티켓으로 나뉩니다.

**출처·재사용 범위:** 원출처는 [mattpocock/skills](https://github.com/mattpocock/skills)이며 저장소의 LICENSE는 MIT(Copyright (c) 2026 Matt Pocock)입니다. 이 가이드는 원문을 그대로 옮기지 않고, 공식 README와 각 `SKILL.md`의 내용을 바탕으로 한국어로 새로 설명한 것입니다. 원문을 복사·변형해 배포하는 경우에는 해당 버전·원 경로를 기록하고 LICENSE의 저작권/허락 고지를 보존하세요. 연습용 저장소 `todo-app`(이 모듈의 `todo-app` 폴더)과 예시 프롬프트·예시 답변은 이 가이드에서 새로 만든 것입니다.

각 단계는 [공식 README](https://github.com/mattpocock/skills)의 Installation 순서와 [`ask-matt`](https://github.com/mattpocock/skills/blob/main/skills/engineering/ask-matt/SKILL.md) 스킬이 설명하는 Main flow를 따릅니다.

| 이 가이드 | 공식 문서 |
|---|---|
| 0 단계: 준비하기 | (가이드에서 추가) |
| 1 단계: 플러그인 설치 | README › Installation › 1. Get the skills |
| 2 단계: 연습용 저장소 준비하기 | (가이드에서 추가한 실습 준비, `todo-app` 폴더 제공) |
| 3 단계: 저장소 설정 | README › Installation › 2. Run `/setup-matt-pocock-skills` |
| 4 단계: 아이디어 인터뷰 | ask-matt › The main flow › 1. `/grill-with-docs` |
| 5 단계: 스펙 만들기 | ask-matt › The main flow › 3. `/to-spec` |
| 6 단계: 티켓으로 쪼개기 | ask-matt › The main flow › 3. `/to-tickets` |
| 7 단계: 티켓 구현과 리뷰 | ask-matt › The main flow › 3. `/implement` (`/tdd` + `/code-review`) |

---

# 0 단계: 준비하기

- macOS / Windows / Linux 컴퓨터
- **Node.js 20 이상** ([nodejs.org](https://nodejs.org)에서 LTS 버전 설치) — 연습용 프로젝트를 실행하는 데만 씁니다.
- **git**
- **Claude Code** (설치와 로그인이 끝난 상태)

터미널(Windows는 PowerShell)을 열고 세 가지가 모두 준비됐는지 확인합니다.

```bash
node -v
```

```bash
git --version
```

```bash
claude --version
```

## 규칙
> `claude --version`이 동작하지 않으면 Claude Code부터 설치하고 `claude`를 한 번 실행해 로그인하세요.

> git을 처음 쓴다면 커밋에 쓸 이름과 이메일을 먼저 등록합니다.
> `git config --global user.name "내 이름"` / `git config --global user.email "내 이메일"`

## 산출물
- 없음 (환경 확인만 합니다)

## 체크리스트
- [ ] `node -v`가 v20 이상인지 확인한다.
- [ ] `git --version`과 `claude --version`이 버전 번호를 출력하는지 확인한다.

# 1 단계: 플러그인 설치

1. 터미널에서 Claude Code 공식 마켓플레이스로 플러그인을 설치합니다.

   ```bash
   claude plugin install mattpocock-skills@claude-plugins-official
   ```

2. 설치됐는지 확인합니다.

   ```bash
   claude plugin list
   ```

   목록에 `mattpocock-skills`가 보이면 성공입니다.

3. 위 1번이 "플러그인을 찾을 수 없다"는 오류로 실패하면, 저장소 자체를 마켓플레이스로 추가해서 설치합니다.

   ```bash
   claude plugin marketplace add mattpocock/skills
   ```

   ```bash
   claude plugin install mattpocock-skills@mattpocock
   ```

## 규칙
> Claude Code가 이미 켜져 있었다면 **완전히 종료한 뒤 다시 실행**해야 새 스킬이 보입니다.

> 플러그인은 **자동으로 업데이트**됩니다. 스킬 파일을 직접 고치고 싶다면 플러그인 대신 `npx skills@latest add mattpocock/skills`(skills.sh)로 설치하세요. **둘 중 하나만** 설치합니다. 둘 다 설치하면 모든 스킬이 두 번씩 보입니다.

> 제거는 `claude plugin uninstall mattpocock-skills` 입니다.

## 산출물
- Claude Code에 설치된 `mattpocock-skills` 플러그인 (스킬 27개)

## 체크리스트
- [ ] `claude plugin list`에 `mattpocock-skills`가 표시되는지 확인한다.
- [ ] (2단계 이후) Claude Code 입력창에 `/grill`을 쳤을 때 자동완성에 `grill-with-docs`가 뜨는지 확인한다.

# 2 단계: 연습용 저장소 준비하기

스킬을 시험할 대상이 필요합니다. 할 일을 추가·완료·조회하는 작은 CLI `todo-app`을 **이 모듈 폴더에 미리 만들어 두었습니다.** 코드를 직접 칠 필요 없이 복사해서 씁니다. 할 일에는 **마감일**을 붙일 수 있습니다.

이 앱에는 일부러 비워 둔 **불편함**이 하나 있습니다. "매주 월요일 분리수거"처럼 **반복되는 일**은 완료할 때마다 다음 주 것을 손으로 다시 추가해야 합니다. 4단계부터 이 문제를 스킬로 해결합니다.

## 미리 만들어 둔 파일

```
M33-mattpocock2/
└── todo-app/
    ├── package.json        npm test 로 테스트를 실행하는 설정 (의존성 없음)
    ├── .gitignore          실행 중 생기는 todos.json 을 git 에서 제외
    ├── src/
    │   ├── todo.js         할 일 추가(addTodo)·완료(completeTodo)·목록 문자열(formatTodos)
    │   ├── store.js        todos.json 파일 읽기·쓰기
    │   └── cli.js          명령어 처리: add <제목> [마감일] / done <번호> / list
    └── test/
        └── todo.test.js    todo.js 의 동작을 확인하는 테스트 5개
```

<details>
<summary><code>src/todo.js</code> 핵심 코드 보기</summary>

```js
// 할 일 하나는 { id, title, due, done } 모양이다. due 는 "YYYY-MM-DD" 문자열 또는 null.
export function addTodo(todos, title, due = null) { ... }   // 1부터 번호를 매겨 새 할 일 추가
export function completeTodo(todos, id) { ... }             // 해당 번호만 done: true 로
export function formatTodos(todos) { ... }                  // "[x] 1. 분리수거 (마감 2026-11-16)"
```

반복 할 일 기능은 주로 이 파일과 `src/cli.js`를 고쳐서 만들게 됩니다. 전체 코드는 `todo-app/src/todo.js`를 열어 보세요.

</details>

## 따라 하기

1. `todo-app` 폴더를 **강의 자료 저장소 밖**의 작업할 위치로 복사합니다. 아래는 홈 폴더로 복사하는 예입니다. 터미널을 `M33-mattpocock2` 폴더에서 열고 실행하세요.

   macOS / Linux / Git Bash:
   ```bash
   cp -r todo-app ~/todo-app
   ```

   Windows PowerShell:
   ```powershell
   Copy-Item -Recurse todo-app $HOME\todo-app
   ```

   파일 탐색기에서 `todo-app` 폴더를 복사해 붙여 넣어도 됩니다.

2. 복사한 폴더로 이동해서 git 저장소로 초기화합니다.

   ```bash
   cd ~/todo-app
   ```

   ```bash
   git init
   ```

3. 테스트를 실행합니다.

   ```bash
   npm test
   ```

4. 앱을 직접 써 보며 **불편함**을 확인합니다.

   ```bash
   node src/cli.js add 분리수거 2026-11-16
   ```

   ```bash
   node src/cli.js done 1
   ```

   ```text
   [x] 1. 분리수거 (마감 2026-11-16)
   ```

   분리수거를 끝냈지만 다음 주(2026-11-23) 분리수거는 생기지 않습니다. 매주 직접 `add` 해야 합니다.

5. 확인용 데이터 파일을 지웁니다. (macOS·Windows 어디서나 동작하는 명령입니다.)

   ```bash
   node -e "require('fs').rmSync('todos.json', { force: true })"
   ```

6. 첫 커밋을 만듭니다.

   ```bash
   git add .
   git commit -m "todo-app 초기 버전"
   ```

## 규칙
> **반드시 강의 자료 저장소 밖으로 복사**해서 실습합니다. `M33-mattpocock2/todo-app`에서 바로 하면 강의 자료 저장소 안에 또 다른 git 저장소가 생기고, 실습 중 만든 파일과 커밋이 강의 자료와 섞입니다. 원본 `todo-app` 폴더는 다시 실습할 때를 위해 그대로 둡니다.

> 제목에 띄어쓰기가 있으면 따옴표로 감쌉니다. 예) `node src/cli.js add "우유 사기"`

> 이후 모든 단계는 **복사한 `todo-app` 폴더 안에서** 진행합니다.

## 산출물
- 작업 위치의 `todo-app/` 저장소 (`package.json`, `.gitignore`, `src/todo.js`, `src/store.js`, `src/cli.js`, `test/todo.test.js`)
- 첫 커밋 1개

## 체크리스트
- [ ] `npm test`에서 테스트 5개가 모두 통과(pass 5)하는지 확인한다.
- [ ] `done 1` 뒤에 다음 주 할 일이 **생기지 않는다**는 것을 직접 확인한다.
- [ ] `git status`에 `todos.json`이 보이지 않는지 확인한다.
- [ ] `git log --oneline`에 커밋이 1개 있는지 확인한다.

# 3 단계: 저장소 설정 — `/setup-matt-pocock-skills`

다른 엔지니어링 스킬들이 "스펙은 어디에 쓰지? 용어집은 어디 있지?"를 알 수 있도록 저장소를 한 번 설정합니다.

1. `todo-app` 폴더에서 Claude Code를 실행합니다.

   ```bash
   claude
   ```

2. 입력창에 아래를 입력합니다.

   ```text
   /setup-matt-pocock-skills
   ```

3. 에이전트가 저장소를 살펴본 뒤, 섹션별로 하나씩 묻습니다. 아래처럼 답합니다.

   | 에이전트의 질문 (요지) | 이렇게 답하기 |
   |---|---|
   | **Section A. 이슈 트래커**를 어디로 할까요? (GitHub / GitLab / Local markdown / Other) | `Local markdown` |
   | **Section B. 기본 트리아지 라벨**을 그대로 쓸까요? | `yes` |
   | `CLAUDE.md`와 `AGENTS.md`가 둘 다 없는데 어느 쪽을 만들까요? | `CLAUDE.md` |
   | 작성할 파일 초안을 보여 드립니다. 이대로 쓸까요? | `yes` |

   용어집 위치(Section C)는 단일 저장소이므로 묻지 않고 **single-context**(루트 `GLOSSARY.md` + `docs/adr/`)로 정합니다.

4. 생긴 파일을 확인하고 커밋합니다. (Claude Code 안에서 `!`를 앞에 붙이면 셸 명령을 바로 실행할 수 있습니다.)

   ```text
   !git status
   ```

   ```text
   !git add . && git commit -m "mattpocock skills 설정"
   ```

## 규칙
> 이 스킬은 **저장소마다 한 번**만 실행합니다. 나중에 바꾸고 싶으면 `docs/agents/*.md`를 직접 고치면 됩니다. 이슈 트래커를 통째로 바꿀 때만 다시 실행합니다.

> GitHub를 고르면 `gh` CLI 로그인과 원격 저장소(`git remote`)가 필요합니다. 처음 실습에서는 **Local markdown**을 권장합니다.

> 이 스킬은 정해진 스크립트가 아니라 **프롬프트로 동작**합니다. 질문 문장은 조금씩 다를 수 있으니 위 표의 "요지"를 보고 답하세요.

## 산출물
- `CLAUDE.md` — `## Agent skills` 블록(이슈 트래커 / 트리아지 라벨 / 도메인 문서 안내)
- `docs/agents/issue-tracker.md` — "스펙·티켓은 `.scratch/<기능>/`에 마크다운으로 쓴다"
- `docs/agents/triage-labels.md` — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`
- `docs/agents/domain.md` — `GLOSSARY.md`와 `docs/adr/`를 읽는 규칙

## 체크리스트
- [ ] `CLAUDE.md`에 `## Agent skills` 제목이 있는지 확인한다.
- [ ] `docs/agents/` 폴더에 `.md` 파일 3개가 생겼는지 확인한다.
- [ ] `docs/agents/issue-tracker.md`에 `.scratch/`가 언급되는지 확인한다.

# 4 단계: 아이디어 인터뷰 — `/grill-with-docs`

"반복 할 일" 기능을 추가하려 합니다. 바로 코드를 시키지 않고, 먼저 에이전트가 **나를 인터뷰**하게 해서 무엇을 만들지 합의합니다.

1. 3단계와 같은 대화 창에서(또는 `claude`를 새로 실행해서) 아래를 입력합니다.

   ```text
   /grill-with-docs 반복 할 일 기능을 추가하고 싶어.
   지금은 "매주 월요일 분리수거"를 끝내면 다음 주 것을 매번 손으로 다시 add 해야 해.
   반복으로 등록해 두면 완료할 때 다음 회차가 알아서 생겼으면 좋겠어.
   ```

2. 에이전트가 코드를 먼저 읽은 뒤, 아래와 같은 모양으로 **질문 묶음(라운드)** 을 보냅니다. (예시이며 실제 질문은 매번 다릅니다.)

   ```text
   ❓ Q1 - 반복 주기: 어떤 주기를 지원할까요? (a) 매일·매주 (b) 매일·매주·매월 (c) "3일마다" 같은 임의 간격
   ➡️ (a) 매일·매주만. 매월은 말일 처리가 복잡하니 이번 범위에서 뺍니다.

   ❓ Q2 - 다음 회차가 생기는 때: 완료하는 순간 바로 만들까요, 마감일이 지나면 만들까요?
   ➡️ 완료하는 순간 바로 다음 회차를 만듭니다.

   ❓ Q3 - 다음 마감일의 기준: 원래 마감일에 주기를 더할까요, 완료한 날에 더할까요?
   ➡️ 원래 마감일 + 주기. 늦게 끝내도 "매주 월요일"이 화요일로 밀리지 않습니다.
   ```

3. 이 가이드의 7단계 결과 확인과 똑같이 나오도록, **아래 결정대로** 답하세요. (추천 답이 같으면 `yes`, 다르면 직접 적습니다.)

   | 결정할 것 | 이 실습에서 정할 답 |
   |---|---|
   | 반복 주기 | **매일(day)·매주(week)** 만. 매월은 Out of Scope |
   | 다음 회차가 생기는 때 | **완료하는 순간** 새 할 일로 추가 |
   | 다음 마감일 기준 | **원래 마감일 + 주기** (완료한 날 기준 아님) |
   | 마감일 없는 반복 할 일 | **허용하지 않음** (반복 할 일은 마감일 필수) |
   | 지난 회차를 안 하고 넘어가면 | 아무 일도 없음. 쌓이지 않고 **완료할 때만** 다음 회차가 생김 |
   | 반복 중단·삭제 | 이번에는 **Out of Scope** |
   | 명령 형식 | `node src/cli.js add <제목> <마감일> --every day\|week` |
   | 목록 표시 | `[ ] 2. 분리수거 (마감 2026-11-23, 매주)` 처럼 주기를 함께 표시 |

   답하는 예시입니다.

   ```text
   Q1 yes. Q2 yes. Q3 yes.
   ```

   ```text
   반복 할 일은 마감일이 꼭 있어야 해. 명령은 add <제목> <마감일> --every day 또는 week 로 하자.
   반복 중단이나 삭제는 이번엔 안 할 거야.
   ```

4. 질문이 더 나오지 않으면 에이전트가 정리한 내용을 보여 주고 "이해한 내용이 맞나요?"라고 확인합니다. 위 표와 같으면 `yes`라고 답합니다.

5. 인터뷰 도중 용어가 정해질 때마다 `GLOSSARY.md`가 바로 갱신됩니다. 다른 터미널이나 편집기에서 내용을 확인해 봅니다. (예시)

   ```markdown
   # 할 일 관리

   개인이 해야 할 일을 기록하고 완료를 표시하는 CLI.

   ## Language

   **할 일**:
   완료 여부와 선택적인 마감일을 가진 작업 하나.
   _Avoid_: 태스크, 작업, 항목

   **마감일**:
   할 일을 끝내야 하는 날짜. YYYY-MM-DD 형식.
   _Avoid_: 기한, 데드라인

   **반복 할 일**:
   완료하면 같은 제목의 다음 회차가 자동으로 생기는 할 일. 마감일이 반드시 있다.
   _Avoid_: 정기 할 일, 루틴

   **반복 주기**:
   다음 회차의 마감일을 정하는 간격. 매일 또는 매주.
   _Avoid_: 반복 규칙, 간격, 빈도

   **회차**:
   반복 할 일이 만들어 낸 할 일 하나하나.
   _Avoid_: 인스턴스, 발생, 복사본
   ```

## 규칙
> **사실은 에이전트가, 결정은 사람이** 합니다. 에이전트가 "마감일을 어떻게 저장하고 있나요?"처럼 코드에서 확인할 수 있는 것을 묻지는 않습니다. 대신 "다음 마감일은 무엇을 기준으로 하나요?" 같은 결정을 묻습니다.

> 질문에 모두 답하기 전에는 에이전트가 **코드를 고치지 않습니다.** 인터뷰가 끝난 뒤에도 바로 구현하지 말고 5단계로 넘어갑니다.

> 에이전트가 용어를 다르게 쓰면 바로잡으세요. 예) "'인스턴스' 말고 '회차'라고 부르자." 이렇게 정한 말이 `GLOSSARY.md`에 기록되고, 이후 함수·테스트 이름에도 쓰입니다.

> "다음 마감일은 원래 마감일 기준"처럼 **되돌리기 어렵고, 모르고 보면 이상하고, 진짜 대안이 있던** 결정은 ADR로 남자고 제안받을 수 있습니다. 제안을 받아들이면 `docs/adr/0001-….md`가 생깁니다. 제안이 없거나 거절해도 정상입니다.

> 저장소가 없는 일(기획서, 글쓰기 등)을 다듬을 때는 기록을 남기지 않는 `/grill-me`를 씁니다. 저장소가 있다면 항상 `/grill-with-docs`가 낫습니다.

> **이 단계부터 6단계까지는 `/clear`나 `/compact` 없이 한 대화 창에서** 이어서 진행합니다. 스펙과 티켓이 인터뷰 내용을 그대로 이어받아야 하기 때문입니다.

## 산출물
- `GLOSSARY.md` — 할 일, 마감일, 반복 할 일, 반복 주기, 회차 등 이 프로젝트의 용어
- (선택) `docs/adr/0001-….md` — 예) "다음 마감일은 완료일이 아니라 원래 마감일 기준"
- 에이전트와 합의된 기능 설명 (대화 창 안)

## 체크리스트
- [ ] 저장소 루트에 `GLOSSARY.md`가 생겼는지 확인한다.
- [ ] 각 용어에 한두 문장 정의와 `_Avoid_` 줄이 있는지 확인한다.
- [ ] 3번 표의 결정 8가지가 대화에서 모두 확정됐는지 확인한다.

# 5 단계: 스펙 만들기 — `/to-spec`

인터뷰한 내용을 **스펙 문서**로 정리합니다. 이 스킬은 새로 질문하지 않고, 지금까지의 대화를 요약해서 씁니다.

1. 4단계와 **같은 대화 창**에서 입력합니다.

   ```text
   /to-spec
   ```

2. 에이전트가 테스트를 걸 **seam(이음매)** 을 제안하고 확인을 받습니다. (예시)

   ```text
   테스트 seam 제안: src/todo.js의 공개 함수(addTodo, completeTodo, formatTodos) 한 곳.
   반복 할 일 만들기·다음 회차 생성·표시를 모두 이 함수들로 확인할 수 있습니다.
   CLI(src/cli.js)는 인자만 넘기므로 별도 seam을 두지 않습니다. 맞습니까?
   ```

   제안이 맞으면 `yes`라고 답합니다.

3. 에이전트가 스펙을 `.scratch/<기능 이름>/spec.md`에 저장합니다. 기능 이름(예: `recurring-todos`)은 에이전트가 정합니다.

4. 스펙 파일을 열어 아래 제목들이 있는지 훑어봅니다.

   | 제목 | 내용 |
   |---|---|
   | Problem Statement | 사용자 입장에서 본 문제 (반복되는 일을 매번 다시 추가해야 함) |
   | Solution | 사용자 입장에서 본 해결 (반복으로 등록하면 완료 시 다음 회차 생성) |
   | User Stories | "As a 사용자, I want …, so that …" 형태의 긴 목록 |
   | Implementation Decisions | 바꿀 모듈, 인터페이스, 결정 사항 (파일 경로·코드는 쓰지 않음) |
   | Testing Decisions | 어디를 어떻게 테스트할지 |
   | Out of Scope | 매월 반복, 반복 중단·삭제 등 이번에 하지 않을 것 |

## 규칙
> 스펙에는 **파일 경로나 코드 조각을 쓰지 않습니다.** 코드는 금방 바뀌어서 스펙이 낡기 때문입니다.

> 스펙이 마음에 들지 않으면 대화로 고쳐 달라고 하면 됩니다. 예) "Out of Scope에 '평일만 반복'을 추가해줘."

> "이슈 트래커 정보가 없다"는 말이 나오면 3단계(`/setup-matt-pocock-skills`)를 건너뛴 것입니다.

## 산출물
- `.scratch/<기능 이름>/spec.md` — 스펙 문서 (라벨 `ready-for-agent`)

## 체크리스트
- [ ] `.scratch/` 아래에 `spec.md`가 생겼는지 확인한다.
- [ ] 스펙의 용어가 `GLOSSARY.md`의 용어(반복 할 일, 반복 주기, 회차 등)와 같은지 확인한다.
- [ ] Out of Scope에 매월 반복과 반복 중단·삭제가 들어 있는지 확인한다.

# 6 단계: 티켓으로 쪼개기 — `/to-tickets`

스펙을 **한 번에 하나씩 끝낼 수 있는 티켓**으로 나눕니다.

1. 5단계와 **같은 대화 창**에서 입력합니다.

   ```text
   /to-tickets
   ```

2. 에이전트가 티켓 목록을 제안하고 의견을 묻습니다. (예시)

   ```text
   1. 반복 할 일 만들기
      Blocked by: 없음 (바로 시작 가능)
      What it delivers: add 분리수거 2026-11-16 --every week 로 반복 할 일을 만들고,
                        목록에 "(마감 2026-11-16, 매주)"로 보인다.
   2. 완료하면 다음 회차 만들기
      Blocked by: 1
      What it delivers: 반복 할 일을 done 하면 마감일이 한 주기 뒤인 새 회차가 목록에 추가된다.
   3. 잘못된 반복 입력 거부하기
      Blocked by: 1
      What it delivers: 마감일 없는 반복 할 일이나 day/week 이외의 주기를 오류 메시지로 거부한다.

   - 크기가 적당한가요? (너무 큼 / 너무 잘게 나눔)
   - Blocked by 관계가 맞나요?
   - 합치거나 더 쪼갤 티켓이 있나요?
   ```

3. 괜찮으면 승인합니다. 2번과 3번은 둘 다 1번에만 막혀 있으므로 1번이 끝나면 어느 쪽부터 해도 됩니다.

   ```text
   좋아, 이대로 만들어줘.
   ```

4. 티켓 파일과 스펙을 함께 커밋합니다.

   ```text
   !git add . && git commit -m "반복 할 일 스펙과 티켓"
   ```

## 규칙
> 티켓은 **세로로 자른 조각**이어야 합니다. "데이터 구조만 먼저", "CLI만 먼저" 같은 가로 자르기는 하지 않습니다. 1번 티켓만 끝나도 "반복 할 일을 만들고 목록에서 본다"는 동작을 처음부터 끝까지 확인할 수 있어야 합니다.

> 로컬 트래커에서는 **티켓 하나당 파일 하나**입니다. 번호는 막는 티켓이 먼저 오도록 `01`부터 매깁니다.

> 이 단계가 끝나면 인터뷰~티켓까지의 대화는 역할을 다했습니다. 이제부터는 티켓 파일이 기억 장치입니다.

## 산출물
- `.scratch/<기능 이름>/issues/01-<제목>.md`, `02-<제목>.md`, `03-<제목>.md` … — 각각 What to build / Blocked by / Status: ready-for-agent / 완료 조건 체크박스

## 체크리스트
- [ ] `.scratch/<기능 이름>/issues/`에 티켓 파일이 2개 이상 생겼는지 확인한다.
- [ ] 각 티켓에 `Blocked by`와 체크박스 형태의 완료 조건이 있는지 확인한다.
- [ ] 스펙과 티켓이 커밋됐는지 `git log --oneline`으로 확인한다.

# 7 단계: 티켓 구현과 리뷰 — `/implement`

티켓을 하나씩 구현합니다. `/implement`는 안에서 `tdd`(빨강→초록)로 코드를 만들고, 끝나면 `code-review`(두 축 리뷰)를 돌린 뒤 커밋합니다.

1. 리뷰 기준점을 분명히 하기 위해 작업용 브랜치를 만듭니다.

   ```text
   !git switch -c feature/recurring-todos
   ```

2. 대화 창을 비웁니다. 구현은 **티켓마다 새 창**에서 시작합니다.

   ```text
   /clear
   ```

3. 첫 번째 티켓을 구현하게 합니다. 파일 이름은 6단계에서 생긴 이름으로 바꿔 넣습니다. (`@`를 치면 파일 경로 자동완성이 됩니다.)

   ```text
   /implement @.scratch/recurring-todos/issues/01-create-recurring-todo.md
   리뷰 기준점(fixed point)은 main 브랜치로 해줘.
   ```

4. 진행 중에 에이전트가 묻는 것과 답하는 방법입니다.

   | 에이전트의 질문 (요지) | 이렇게 답하기 |
   |---|---|
   | (tdd) "이 seam에서 테스트할까요?" | 스펙에서 합의한 seam(`src/todo.js`의 공개 함수)이면 `yes` |
   | (code-review) "기준점을 무엇으로 할까요?" | `main` (3번에서 미리 말했다면 묻지 않습니다) |
   | 파일 수정·명령 실행 권한 요청 | 내용을 읽어 보고 허용 |

   진행 순서는 대략 이렇습니다.
   - **빨강**: `test/todo.test.js`에 "반복 할 일은 주기와 함께 표시된다" 같은 실패하는 테스트를 먼저 추가하고 `npm test`로 실패를 확인
   - **초록**: 테스트를 통과할 만큼만 `src/todo.js`, `src/cli.js`를 고침
   - 다음 동작에 대해 빨강→초록 반복
   - **리뷰**: Standards / Spec 두 서브에이전트의 결과를 `## Standards`, `## Spec`으로 나란히 보고
   - **커밋**: 현재 브랜치(`feature/recurring-todos`)에 커밋

5. 리뷰에서 고칠 점이 나오면 고쳐 달라고 합니다.

   ```text
   Spec 리뷰에서 지적한 부분을 고치고 다시 커밋해줘.
   ```

6. 남은 티켓도 `/clear` 후 같은 방법으로 하나씩 진행합니다.

   ```text
   /clear
   ```

   ```text
   /implement @.scratch/recurring-todos/issues/02-create-next-occurrence-on-complete.md
   리뷰 기준점(fixed point)은 main 브랜치로 해줘.
   ```

   ```text
   /clear
   ```

   ```text
   /implement @.scratch/recurring-todos/issues/03-reject-invalid-recurrence.md
   리뷰 기준점(fixed point)은 main 브랜치로 해줘.
   ```

7. 모든 티켓이 끝나면 결과를 확인합니다. 먼저 테스트를 돌립니다.

   ```text
   !npm test
   ```

   깨끗한 상태에서 시작하려고 데이터 파일을 지운 뒤, 반복 할 일을 만들고 완료해 봅니다.

   ```text
   !node -e "require('fs').rmSync('todos.json', { force: true })"
   ```

   ```text
   !node src/cli.js add 분리수거 2026-11-16 --every week
   ```

   ```text
   !node src/cli.js done 1
   ```

   기대 출력 (형식은 인터뷰에서 정한 대로이며 글자는 조금 다를 수 있습니다):

   ```text
   [x] 1. 분리수거 (마감 2026-11-16, 매주)
   [ ] 2. 분리수거 (마감 2026-11-23, 매주)
   ```

   잘못된 입력이 거부되는지도 확인합니다.

   ```text
   !node src/cli.js add "물 마시기" --every day
   ```

   ```text
   !node src/cli.js add 운동 2026-11-16 --every month
   ```

   둘 다 오류 메시지가 나오면 정상입니다. 마지막으로 커밋을 확인합니다.

   ```text
   !git log --oneline main..HEAD
   ```

## 규칙
> **구현 전에 반드시 `/clear`** 합니다. 각 티켓은 그 자체로 충분한 정보를 담고 있으므로 이전 대화는 필요 없고, 오히려 판단을 흐립니다.

> `tdd`의 원칙: **실패하는 테스트가 먼저**, 통과할 만큼만 구현, **한 번에 한 조각**. 테스트를 한꺼번에 몰아 쓰지 않습니다. 리팩터링은 TDD 루프가 아니라 리뷰 단계에서 합니다.

> 날짜 계산 테스트의 기대값은 **사람이 확인한 값**이어야 합니다. 예) "2026-11-16 + 1주 = 2026-11-23"처럼 달력으로 확인한 날짜를 그대로 적습니다. 코드와 같은 방식으로 계산한 값을 기대값으로 쓰면 틀려도 통과하는 테스트가 됩니다. (`tdd` 스킬이 경계하는 "Tautological" 테스트)

> `/implement`는 블로커가 먼저 끝난 티켓부터 진행합니다. 1번이 끝나기 전에 2번·3번을 시작하지 마세요.

> 리뷰를 **따로** 받고 싶다면 새 창에서 플러그인 정식 이름으로 부릅니다. `/code-review`만 치면 Claude Code에 기본으로 있는 다른 리뷰 명령이 실행될 수 있습니다.
> `/mattpocock-skills:code-review main`

> 알려진 문제: `code-review`의 서브에이전트가 다시 `code-review`를 부르며 에이전트가 계속 늘어나는 경우가 보고되어 있습니다. 화면에 에이전트가 비정상적으로 많이 뜨면 `Esc`로 멈추세요.

## 산출물
- `src/todo.js`, `src/cli.js` — 반복 할 일 만들기, 완료 시 다음 회차 생성, 잘못된 입력 거부가 추가된 코드
- `test/todo.test.js` — 반복 할 일 동작을 검증하는 테스트 추가
- `feature/recurring-todos` 브랜치의 티켓별 커밋
- 티켓마다 Standards / Spec 두 축 리뷰 결과 (대화 창 안)

## 체크리스트
- [ ] `npm test`가 모두 통과하는지 확인한다. (기존 테스트 5개도 그대로 통과해야 한다)
- [ ] 반복 할 일을 `done` 하면 마감일이 **원래 마감일 + 7일**인 새 회차가 생기는지 확인한다.
- [ ] 반복이 아닌 일반 할 일을 `done` 하면 새 할 일이 **생기지 않는지** 확인한다.
- [ ] 마감일 없는 반복 할 일과 `--every month`가 오류로 거부되는지 확인한다.
- [ ] `git log --oneline main..HEAD`에 티켓별 커밋이 있는지 확인한다.
- [ ] 각 티켓 파일의 완료 조건 체크박스가 모두 충족됐는지 확인한다.

---

# 더 해보기

기본 사이클을 한 바퀴 돌았다면 아래 스킬도 써 보세요. 이번 실습에서 Out of Scope로 미룬 기능이 좋은 다음 과제입니다.

| 상황 | 스킬 | 예시 프롬프트 |
|---|---|---|
| 다음 기능을 같은 흐름으로 추가한다 | `/grill-with-docs` | `/grill-with-docs 반복 할 일을 중단하는 기능을 추가하고 싶어.` |
| 어떤 스킬을 써야 할지 모르겠다 | `/ask-matt` | `/ask-matt 매월 반복을 추가하려는데 말일 처리가 어려워 보여. 어디서부터 시작하지?` |
| 방금 작업을 돌아보고 환경을 개선하고 싶다 | `/retro` | `/retro` (구현을 마친 그 대화 창에서, `/clear` 전에) |
| 에이전트 말이 이해가 안 된다 | `/wait-what` | `/wait-what` |
| 다른 사람·다른 폴더로 작업을 넘긴다 | `/handoff` | `/handoff 다음 세션은 매월 반복 기능을 다룬다` |
| 잘 안 잡히는 버그를 고친다 | `diagnosing-bugs` | `12월 마지막 주 반복 할 일의 다음 회차 날짜가 이상해. diagnosing-bugs 스킬로 원인을 찾아줘.` |
| 코드 구조를 점검한다 | `/improve-codebase-architecture` | `/improve-codebase-architecture` |
| 저장소 없이 생각만 다듬는다 | `/grill-me` | `/grill-me 우리 팀 주간 회의 운영 방식을 정리하려고 해.` |

# 문제 해결

| 증상 | 해결 |
|---|---|
| `/grill-with-docs`가 자동완성에 안 뜬다 | Claude Code를 완전히 종료 후 재실행. 그래도 없으면 `claude plugin list`로 설치 확인 |
| `/code-review`가 엉뚱한 리뷰를 한다 | Claude Code 기본 명령과 이름이 겹친 것. `/mattpocock-skills:code-review`로 부르기 |
| "run `/setup-matt-pocock-skills`" 라는 안내가 나온다 | 3단계를 건너뛰었거나 다른 폴더에서 실행함. `todo-app` 폴더에서 3단계 실행 |
| 스킬이 두 번씩 보인다 | 플러그인과 skills.sh를 둘 다 설치함. 하나를 제거 (`claude plugin uninstall mattpocock-skills` 또는 `.claude/skills/`의 복사본 삭제) |
| 인터뷰 질문이 끝없이 이어진다 | 정상 동작에 가깝습니다. 범위를 줄이고 싶으면 "Out of Scope로 미루자"라고 답하기 |
| 7단계 결과의 번호·날짜가 기대와 다르다 | 이전 실습의 `todos.json`이 남아 있는 것. 7단계의 `rmSync` 명령으로 지운 뒤 다시 실행 |
| 결과 형식이 가이드와 다르다 | 4단계에서 다르게 결정한 것. 인터뷰에서 정한 형식이 기준이며, 같은 결과를 원하면 4단계 표대로 다시 진행 |
