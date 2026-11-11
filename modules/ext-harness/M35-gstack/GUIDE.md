# 이 실습에서 할 일

> gstack의 스프린트·역할 스킬·설계 문서 같은 개념 설명은 [README.md](README.md)를 먼저 읽어 보세요. 이 가이드는 gstack **1.99.0.0**을 기준으로 합니다.

> 이 가이드는 gstack을 처음 써보는 사람을 위한 **가장 기본적인 흐름**만 다룹니다.
> **설치 → 오피스아워 → 계획 리뷰 → 구현 → 코드 리뷰 → QA → (PR 출시) → 회고**
> 미리 준비된 할 일 관리 앱(`todo-app` 폴더)을 복사해서, 여기에 **반복 할 일**("매주 월요일 분리수거") 기능을 추가하며 스프린트를 한 바퀴 돌아봅니다.

```
todo-app 복사 → 기능 브랜치 생성
   │
   ▼
/office-hours        아이디어 재정의 → 설계 문서 (~/.gstack/projects/…)
   │
   ▼
/autoplan               구현 계획 작성 → 자동 리뷰 → 구현 요청
   │
   ▼
구현 (Claude Code)    → 커밋
   │
   ▼
/review              운영에서 터질 버그 찾기·고치기 → 커밋
   │
   ▼
/qa                  CLI를 직접 실행하며 테스트 → 버그면 회귀 테스트 + 수정
   │
   ▼
/ship (선택, GitHub 필요)   테스트·점검 → 푸시 → PR
   │
   ▼
/retro               회고
```

**출처·재사용 범위:** 원출처는 [garrytan/gstack](https://github.com/garrytan/gstack)이며 저장소의 LICENSE는 MIT(Copyright (c) 2026 Garry Tan)입니다. 이 가이드는 원문을 그대로 옮기지 않고, 공식 README와 `docs/skills.md`, 각 `SKILL.md`의 내용을 바탕으로 한국어로 새로 설명한 것입니다. 원문을 복사·변형해 배포하는 경우에는 해당 버전·원 경로를 기록하고 LICENSE의 저작권/허락 고지를 보존하세요. 연습용 저장소 `todo-app`(이 모듈의 `todo-app` 폴더)과 예시 프롬프트·예시 답변은 이 가이드에서 새로 만든 것입니다.

| 이 가이드 | 공식 문서 |
|---|---|
| 0 단계: 준비하기 | README › Install › Requirements |
| 1 단계: gstack 설치 | README › Install › Step 1: Install on your machine |
| 2 단계: 연습용 저장소 준비하기 | (가이드에서 추가한 실습 준비, `todo-app` 폴더 제공) |
| 3 단계: 오피스아워 | README › The sprint › `/office-hours` |
| 4 단계: 계획 세우고 자동 리뷰 | README › See it work › `/autoplan`, "Approve plan. Exit plan mode." |
| 5 단계: 구현 확인과 커밋 | README › See it work (구현 단계) |
| 6 단계: 코드 리뷰 | README › The sprint › `/review` |
| 7 단계: QA | README › The sprint › `/qa`, docs › QA without a webpage |
| 8 단계: PR 출시 (선택) | README › The sprint › `/ship` |
| 9 단계: 회고 | README › The sprint › `/retro` |

---

# 0 단계: 준비하기

- **macOS 또는 Linux 권장.** Windows는 **Git Bash** 또는 **WSL**에서 동작합니다(최소 지원).
- **Node.js 20 이상** ([nodejs.org](https://nodejs.org)) — 연습용 앱 실행용. Windows에서는 gstack에도 필요합니다.
- **git**
- **Bun 1.4.2 이상** ([bun.sh](https://bun.sh)) — gstack 설치 스크립트가 사용합니다. 1.3.3보다 낮으면 설치가 거부됩니다.
- **Claude Code** (설치와 로그인이 끝난 상태)

1. Bun이 없다면 설치합니다.

   macOS / Linux:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

   Windows PowerShell:
   ```powershell
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```

2. 설치가 끝나면 셸을 다시 시작해서 `bun` 명령을 쓸 수 있게 합니다. 설치 스크립트가 셸 설정 파일에 등록한 경로(`~/.bun/bin`)는 셸을 다시 시작해야 반영됩니다.

   macOS (기본 셸 zsh):
   ```bash
   exec /bin/zsh
   ```

   Linux 등 bash를 쓰는 경우:
   ```bash
   exec /bin/bash
   ```

   `bun` 명령이 동작하는지 확인합니다. 사용법 안내가 출력되면 정상입니다.

   ```bash
   bun --help
   ```

   > `command not found: bun`이 나오면 터미널 창을 닫고 새로 연 뒤 다시 실행합니다. Windows는 PowerShell·Git Bash 창을 새로 열면 됩니다.

3. 모두 준비됐는지 확인합니다. (Windows는 **Git Bash**에서 실행)

   ```bash
   node -v
   ```

   ```bash
   git --version
   ```

   ```bash
   bun --version
   ```

   ```bash
   claude --version
   ```

## 규칙
> Windows 사용자는 이 가이드의 모든 터미널 명령을 **Git Bash**(Git for Windows에 포함)에서 실행하세요. PowerShell에서는 `~/.claude/...` 같은 경로와 `./setup` 실행이 다르게 동작합니다.

> Windows 11의 **스마트 앱 컨트롤**이 켜져 있으면 gstack이 내 컴퓨터에서 빌드한 실행 파일이 차단될 수 있습니다(`Permission denied`). 이 경우 WSL에서 실습하는 것이 가장 간단합니다.

## 산출물
- 없음 (환경 확인만 합니다)

## 체크리스트
- [ ] `node -v`가 v20 이상인지 확인한다.
- [ ] Bun 설치 후 셸을 다시 시작하고 `bun --help`가 사용법을 출력하는지 확인한다.
- [ ] `bun --version`이 1.4.2 이상인지 확인한다.
- [ ] `git --version`과 `claude --version`이 버전 번호를 출력하는지 확인한다.

# 1 단계: gstack 설치

공식 README는 **Claude Code에게 설치를 맡기는** 방법을 안내합니다. 직접 명령어로 설치해도 됩니다. 둘 중 하나만 하세요.

**방법 A. Claude Code에게 맡기기 (공식 안내)**

1. 아무 폴더에서 Claude Code를 실행합니다.

   ```bash
   claude
   ```

2. 아래 문장을 그대로 붙여 넣습니다. (공식 README의 설치 문장입니다.)

   ```text
   Install gstack: run git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup then add a "gstack" section to CLAUDE.md that says to use the /browse skill from gstack for all web browsing and never use mcp__claude-in-chrome__* tools. Claude Code lists the installed skills itself, so the section needs no skill list. Then ask the user if they also want to add gstack to the current project so teammates get it.
   ```

3. Claude가 명령 실행 권한을 물으면 내용을 확인하고 허용합니다. 마지막에 "현재 프로젝트에도 추가할까요?"라고 물으면 **아니요**라고 답합니다(팀 모드는 이 실습 범위 밖).

4. 설치가 끝나면 Claude Code를 종료하고 터미널로 돌아갑니다.

   ```text
   /exit
   ```

**방법 B. 직접 설치하기**

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
```

```bash
cd ~/.claude/skills/gstack && ./setup
```

설치 중에 텔레메트리(사용 통계 전송) 여부 등을 물으면 원하는 대로 답합니다. 기본값은 꺼짐입니다.

**설치 확인**

```bash
cat ~/.claude/skills/gstack/VERSION
```

`1.99.0.0` 같은 버전 번호가 출력되면 내려받기가 끝난 것입니다.

새로 설치한 스킬은 Claude Code를 **새로 실행해야** 보입니다. Claude Code를 실행합니다.

```bash
claude
```

입력창에 `/office`를 쳤을 때 `/office-hours`가 자동완성에 뜨는지 확인합니다. (확인만 하고 Enter는 누르지 않습니다. 입력한 글자는 지웁니다.)

확인이 끝나면 Claude Code를 종료하고 터미널로 돌아갑니다. 2단계는 터미널에서 진행합니다.

```text
/exit
```

## 규칙
> 앞에 `!` 없이 `claude`, `cat …` 같은 명령은 **터미널**에서, `/exit`·`/office-hours` 같은 `/` 명령은 **Claude Code 입력창**에서 입력합니다. 지금 어디에 있는지 헷갈리면 화면 아래에 Claude Code 입력창이 보이는지 확인하세요.

> 설치에는 보통 30초~수 분이 걸립니다. 브라우저(Chromium)를 내려받는 과정이 포함되어 있어 네트워크가 느리면 더 오래 걸립니다.

> 방법 A의 문장에는 "CLAUDE.md에 gstack 섹션을 추가하라"는 지시가 들어 있습니다. 이 섹션은 **내 사용자 설정 CLAUDE.md**(`~/.claude/CLAUDE.md`)에 추가됩니다. 웹 브라우징에 gstack의 `/browse`를 쓰라는 내용입니다.

> Windows(Git Bash, 개발자 모드 꺼짐)에서는 스킬이 링크가 아니라 복사본으로 설치됩니다. gstack을 `git pull`로 업데이트한 뒤에는 `cd ~/.claude/skills/gstack && ./setup`을 다시 실행해야 합니다.

> 제거 방법은 공식 문서 [docs/uninstall.md](https://github.com/garrytan/gstack/blob/main/docs/uninstall.md)를 따릅니다.

## 산출물
- `~/.claude/skills/gstack/` — gstack 저장소와 등록된 스킬
- `~/.gstack/` — gstack 설정과 앞으로 생길 설계 문서·리뷰 기록 보관 폴더
- (방법 A) `~/.claude/CLAUDE.md`의 `gstack` 섹션

## 체크리스트
- [ ] `~/.claude/skills/gstack` 폴더가 생겼는지 확인한다.
- [ ] Claude Code 재실행 후 `/office-hours`가 자동완성에 뜨는지 확인한다.
- [ ] `/exit`로 Claude Code를 종료하고 터미널로 돌아왔는지 확인한다.
- [ ] `/review`, `/qa`, `/ship`도 자동완성에 뜨는지 확인한다.

# 2 단계: 연습용 저장소 준비하기

스킬을 시험할 대상이 필요합니다. 할 일을 추가·완료·조회하는 작은 CLI `todo-app`을 **이 모듈 폴더에 미리 만들어 두었습니다.** 코드를 직접 칠 필요 없이 복사해서 씁니다. 할 일에는 **마감일**을 붙일 수 있습니다.

이 앱에는 일부러 비워 둔 **불편함**이 하나 있습니다. "매주 월요일 분리수거"처럼 **반복되는 일**은 완료할 때마다 다음 주 것을 손으로 다시 추가해야 합니다. 3단계부터 gstack 스프린트로 이 문제를 해결합니다.

## 미리 만들어 둔 파일

```
M35-gstack/
└── todo-app/
    ├── package.json        npm test 로 테스트를 실행하는 설정 (의존성 없음)
    ├── .gitignore          todos.json(실행 데이터)과 .gstack/(gstack 보고서)를 git 에서 제외
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

1. 이 단계는 Claude Code가 아니라 **터미널**에서 진행합니다. `todo-app` 폴더를 **강의 자료 저장소 밖**의 작업할 위치로 복사합니다. 터미널을 `M35-gstack` 폴더에서 열고 실행하세요. (파일 탐색기로 복사해도 됩니다.)

   ```bash
   cp -r todo-app ~/todo-app
   ```

2. 복사한 폴더로 이동해서 git 저장소로 초기화합니다. 기본 브랜치 이름은 `main`으로 맞춥니다.

   ```bash
   cd ~/todo-app
   ```

   ```bash
   git init -b main
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

   분리수거를 끝냈지만 다음 주(2026-11-23) 분리수거는 생기지 않습니다.

5. 확인용 데이터 파일을 지웁니다.

   ```bash
   node -e "require('fs').rmSync('todos.json', { force: true })"
   ```

6. 첫 커밋을 만듭니다.

   ```bash
   git add .
   git commit -m "todo-app 초기 버전"
   ```

## 규칙
> **반드시 강의 자료 저장소 밖으로 복사**해서 실습합니다. 원본 폴더에서 바로 하면 강의 자료 저장소 안에 또 다른 git 저장소가 생기고, 실습 파일과 커밋이 강의 자료와 섞입니다.

> 제목에 띄어쓰기가 있으면 따옴표로 감쌉니다. 예) `node src/cli.js add "우유 사기"`

> 이후 모든 단계는 **복사한 `todo-app` 폴더 안에서** 진행합니다.

## 산출물
- 작업 위치의 `todo-app/` 저장소와 `main` 브랜치의 첫 커밋 1개

## 체크리스트
- [ ] `npm test`에서 테스트 5개가 모두 통과(pass 5)하는지 확인한다.
- [ ] `done 1` 뒤에 다음 주 할 일이 **생기지 않는다**는 것을 직접 확인한다.
- [ ] `git branch`가 `main`을 보여 주는지 확인한다.

# 3 단계: 오피스아워 — `/office-hours`

코드를 쓰기 전에 YC 오피스아워 파트너와 "무엇을 만들지"를 먼저 이야기합니다. 결과물은 **설계 문서**입니다. 이 스킬은 **코드를 한 줄도 쓰지 않습니다.**

1. 설계 문서는 브랜치별로 저장되므로, 먼저 기능 브랜치를 만듭니다.

   ```bash
   git switch -c feature/recurring-todos
   ```

2. `todo-app` 폴더에서 Claude Code를 실행합니다.

   ```bash
   claude
   ```

3. 아래를 입력합니다.

   ```text
   /office-hours 할 일 앱에 반복 할 일 기능을 넣고 싶어.
   지금은 "매주 월요일 분리수거"를 끝내면 다음 주 것을 매번 손으로 다시 add 해야 해.
   ```

4. 진행되는 순서와 답하는 방법입니다. 질문은 **한 번에 하나씩** 선택지와 함께 나옵니다.

   | 순서 | 에이전트가 하는 일 (요지) | 이렇게 답하기 |
   |---|---|---|
   | ⓪ 학습 기록(learnings) 범위 | (처음 한 번만) "다른 프로젝트에서 쌓인 학습 기록도 찾아볼까요?" A) 다른 프로젝트까지 검색(추천) / B) 이 프로젝트 범위로만 | **B) 이 프로젝트 범위로만** (Keep learnings project-scoped only) |
   | ① 목표 확인 | "이걸 왜 만드나요?" (Startup / 사내 프로젝트 / 해커톤 / 오픈소스 / **학습** / 재미) | **학습(Learning)** → Builder mode로 진행 |
   | ② 아이디어 키우기 | "가장 멋진 버전은?", "누구에게 보여 줄 건가요?", "가장 빨리 쓸 수 있는 길은?" 같은 질문, 그리고 연속 완료 기록·알림 같은 확장 아이디어 제안 | 아이디어는 들어 보되, 선택지 중 마지막 **5번 Type something**(직접 입력)을 고르고 "**이번엔 가장 작은 버전으로 하고 나머지는 나중에**"라고 직접 입력하기 |
   | ③ 재정의와 전제 | "당신이 원하는 건 사실 ○○" 같은 재정의, 그리고 전제 목록 | 아래 표의 결정과 맞는 전제에 동의, 다르면 수정 |
   | ④ 접근 방식 2~3개 | A(가장 작은 버전) / B / C와 노력 추정치, 추천안 | **가장 작은 버전**(아래 표 내용)을 명시적으로 선택 |
   | ⑤ 설계 문서 작성 | 설계 문서 초안을 보여 주고 승인 요청 | 내용 확인 후 승인 |

5. 이 가이드의 7단계 결과 확인과 똑같이 나오도록 결정을 전달합니다. **먼저 아래 방법으로 한 번에 전달하세요.**

   ③·④처럼 결정에 관한 질문이 처음 나오면, 선택지 중 마지막의 **Type something**(직접 입력)을 고르고 아래 문장을 그대로 붙여 넣습니다.

   ```text
   가장 작은 버전으로 하자. 주기는 매일과 매주만, 완료하는 순간 다음 회차를 만들고,
   다음 마감일은 원래 마감일에 주기를 더해. 반복 할 일은 마감일이 꼭 있어야 해.
   명령은 add <제목> <마감일> --every day 또는 week, 목록에는 "(마감 2026-11-23, 매주)"처럼 보여줘.
   반복 중단, 알림, 연속 기록은 이번엔 안 해.
   ```

   이후 질문이 더 나오면 아래 표를 기준으로 답합니다. 선택지에 맞는 답이 있으면 고르고, 없으면 다시 **Type something**을 골라 표의 내용을 입력합니다.

   | 결정할 것 | 이 실습에서 정할 답 |
   |---|---|
   | 반복 주기 | **매일(day)·매주(week)** 만. 매월은 나중에 |
   | 다음 회차가 생기는 때 | **완료하는 순간** 새 할 일로 추가 |
   | 다음 마감일 기준 | **원래 마감일 + 주기** (완료한 날 기준 아님) |
   | 마감일 없는 반복 할 일 | **허용하지 않음** (반복 할 일은 마감일 필수) |
   | 지난 회차를 안 하고 넘어가면 | 쌓이지 않음. **완료할 때만** 다음 회차가 생김 |
   | 반복 중단·삭제, 알림, 연속 기록 | 이번에는 **하지 않음** |
   | 명령 형식 | `node src/cli.js add <제목> <마감일> --every day\|week` |
   | 목록 표시 | `[ ] 2. 분리수거 (마감 2026-11-23, 매주)` 처럼 주기를 함께 표시 |

6. 마지막에 에이전트가 이 대화에서 **내가 어떻게 생각하는지 관찰한 점**을 짧게 말해 주고, 설계 문서 경로를 알려 줍니다. 파일을 열어 내용을 확인합니다.

   ```text
   !ls ~/.gstack/projects/*/
   ```

## 규칙
> ⓪의 **learnings**는 gstack이 작업하며 알게 된 패턴·주의점을 프로젝트별로 쌓아 두는 기록(`~/.gstack/projects/<프로젝트>/learnings.jsonl`)입니다. 첫 실행 때 다른 프로젝트의 기록까지 찾아볼지 한 번 묻습니다. 실습에서는 다른 프로젝트 내용이 섞이지 않도록 **이 프로젝트 범위로만**을 고릅니다. 이 선택은 저장되어 다음부터는 묻지 않습니다. 바꾸려면 터미널에서 `~/.claude/skills/gstack/bin/gstack-config set cross_project_learnings true`(또는 `false`)를 실행합니다.

> `/office-hours`는 **설계 문서만** 만듭니다. 코드 작성·프로젝트 생성은 하지 않도록 막혀 있습니다. 구현은 4~5단계에서 합니다.

> ②에서 "가장 멋진 버전은?" 같은 질문의 앞쪽 선택지는 대개 범위를 넓히는 아이디어입니다. 그중에서 고르지 말고 **5번 Type something**(직접 입력)을 골라 입력창에 아래 문장을 타이핑합니다.
> ```text
> 이번엔 가장 작은 버전으로 하고 나머지는 나중에
> ```

> Builder mode는 일부러 "더 멋진 버전"을 제안합니다. 마음에 드는 아이디어가 있어도 이번 실습에서는 **가장 작은 버전(narrowest wedge)** 을 고르세요. 범위를 좁히는 것도 이 스킬이 가르치는 내용입니다.

> 접근 방식은 **반드시 사람이 명시적으로 골라야** 다음 단계로 넘어갑니다. "알아서 해"라고 하지 말고 고른 안을 말하세요.

> 외부 모델의 두 번째 의견(Codex)을 받을지 물을 수 있습니다. Codex CLI가 없으면 "아니요"를 고르면 됩니다.

> 설계 문서는 **저장소 밖**(`~/.gstack/projects/`)에 저장되므로 `git status`에 나타나지 않는 것이 정상입니다.

## 산출물
- `~/.gstack/projects/<프로젝트>/…-design-….md` — 문제 정의, 전제, 고른 접근 방식, 다음 할 일이 담긴 설계 문서

## 체크리스트
- [ ] Builder mode로 진행됐는지 확인한다.
- [ ] 접근 방식 중 "가장 작은 버전"을 직접 골랐는지 확인한다.
- [ ] `~/.gstack/projects/` 아래에 `-design-`이 들어간 파일이 생겼는지 확인한다.
- [ ] 설계 문서에 5번 표의 결정이 반영됐는지 확인한다.

# 4 단계: 계획 세우고 자동 리뷰 — `/autoplan`

설계 문서를 바탕으로 **구현 계획**을 세우고, 코드를 쓰기 전에 그 계획을 gstack의 리뷰어들에게 검토받습니다.

1. 3단계와 같은 대화 창에서 `/autoplan`에 구현 계획을 요청합니다. **plan mode는 켜지 않습니다.**

   ```text
   /autoplan 방금 만든 설계 문서대로 반복 할 일 기능의 구현 계획을 세우고 리뷰해줘.
   테스트는 test/todo.test.js 에 node:test 로 추가하는 걸로.
   ```

   > 화면 아래에 `plan mode on`이 보이면 `Shift+Tab`으로 끈 뒤 실행합니다. plan mode에서 실행하면 "plan mode에서는 /autoplan을 정상적으로 돌릴 수 없습니다. 어떻게 할까요?"라는 질문(D1)이 나옵니다. 이때는 추천안인 **A**를 고르고 안내대로 plan mode를 끈 뒤 다시 진행합니다.

2. `/autoplan`이 진행하는 모습과 답하는 방법입니다.

   | 진행 (요지) | 이렇게 하기 |
   |---|---|
   | 설계 문서를 찾았다고 알림 (`Design doc found: …`) | 확인만 |
   | **CEO 리뷰**: 범위가 맞는지 점검, 결정은 자동으로 처리 | 지켜보기 |
   | 디자인 리뷰 | 화면(UI)이 없는 CLI라서 **건너뛰는 것이 정상** |
   | **DX 리뷰**(개발자 경험): 명령 형식·오류 메시지 점검 | CLI 도구라서 실행될 수 있음. 지켜보기 |
   | **엔지니어링 리뷰**(항상 마지막): 데이터 흐름, 경계 사례, 실패 상황, 테스트 계획 | 지켜보기 |
   | **TASTE DECISIONS**: 사람이 정해야 할 취향 문제 몇 개 | 3단계 표와 맞는 쪽을 고르기. 범위를 늘리자는 제안은 "이번엔 안 함" |
   | 계획에 리뷰 결과가 반영되고 마무리 | 바뀐 계획을 읽어 보기 |

3. 엔지니어링 리뷰는 날짜 계산의 함정을 짚어 줄 수 있습니다. 예를 들어 "`new Date('2026-11-16')`은 UTC 기준이라 시간대에 따라 하루가 밀릴 수 있다", "월말·연말을 넘어가는 날짜(2026-12-28 + 1주)도 테스트하라" 같은 지적입니다. 이런 내용이 계획에 반영됐는지 확인합니다.

4. 리뷰가 끝나면 구현을 요청합니다. (5단계로 이어집니다.)

   ```text
   리뷰가 반영된 계획대로 구현해줘.
   ```

## 규칙
> `/autoplan`은 리뷰하면서 복원 지점·스냅샷·리뷰 기록 같은 파일을 여러 개 써야 해서, plan mode가 **꺼진 상태**에서 실행합니다. plan mode가 꺼져 있어도 `/autoplan`은 계획만 세우고 검토하므로 코드가 바로 바뀌지는 않습니다. 구현은 4번에서 직접 요청할 때 시작됩니다.

> `/autoplan`은 대부분의 질문을 **추천 답으로 자동 결정**합니다. 그래서 질문 수가 적은 대신 시간이 꽤 걸립니다(수 분~수십 분). 중간에 멈추지 말고 기다리세요.

> 원래 있던 `/plan-eng-review`(엔지니어링 계획 리뷰) 스킬은 2026-11-06에 단독 스킬에서 빠졌고, 그 방법은 `/autoplan`의 엔지니어링 단계로 남아 있습니다. 예전 자료에서 `/plan-eng-review`를 보면 `/autoplan`으로 대신하세요.

> 리뷰 결과(테스트 계획 포함)는 `~/.gstack/projects/`에 기록되고, 7단계의 `/qa`가 이 **테스트 계획을 자동으로 이어받습니다.**

## 산출물
- 리뷰 결과가 반영된 구현 계획
- `~/.gstack/projects/<프로젝트>/` 아래의 리뷰 기록·테스트 계획

## 체크리스트
- [ ] plan mode가 꺼진 상태에서 `/autoplan`을 실행했는지 확인한다.
- [ ] `/autoplan` 출력에 CEO 리뷰와 엔지니어링(Eng) 리뷰가 실행됐다는 내용이 있는지 확인한다.
- [ ] TASTE DECISIONS에 직접 답했는지 확인한다.
- [ ] 승인한 계획에 날짜 경계(월말·연말) 테스트가 들어 있는지 확인한다.

# 5 단계: 구현 확인과 커밋

4단계 4번에서 구현을 요청하면 Claude가 코드를 작성합니다. 이 단계는 gstack 스킬이 아니라 Claude Code의 기본 기능입니다. 구현이 끝나면 **Claude Code에서 나와 터미널에서 직접** 확인하고 커밋합니다.

1. Claude가 파일 수정·명령 실행 권한을 물으면 내용을 확인하고 허용합니다. 보통 `test/todo.test.js`, `src/todo.js`, `src/cli.js`가 바뀝니다.

2. 구현이 끝났다는 메시지가 나오면 Claude Code를 종료하고 터미널로 돌아갑니다.

   ```text
   /exit
   ```

3. 터미널(`todo-app` 폴더)에서 테스트를 직접 돌려 봅니다.

   ```bash
   npm test
   ```

4. 기능을 손으로 확인합니다.

   ```bash
   node -e "require('fs').rmSync('todos.json', { force: true })"
   ```

   ```bash
   node src/cli.js add 분리수거 2026-11-16 --every week
   ```

   ```bash
   node src/cli.js done 1
   ```

   기대 출력 (형식은 3단계에서 정한 대로이며 글자는 조금 다를 수 있습니다):

   ```text
   [x] 1. 분리수거 (마감 2026-11-16, 매주)
   [ ] 2. 분리수거 (마감 2026-11-23, 매주)
   ```

5. 브랜치를 확인하고 커밋합니다.

   ```bash
   git branch --show-current
   ```

   `feature/recurring-todos`가 나오면 커밋합니다.

   ```bash
   git add .
   git commit -m "반복 할 일 기능 구현"
   ```

## 규칙
> 테스트가 실패하거나 결과가 다르면 커밋하지 말고 Claude에게 고쳐 달라고 합니다. 터미널에서 `claude --continue`로 실행하면 방금 구현하던 대화를 이어서 열 수 있습니다. 예) "npm test 에서 실패한 테스트를 고쳐줘." 고친 뒤 다시 `/exit`하고 3번부터 확인합니다.

> 앞에 `!`가 없는 명령은 **터미널**에서 실행합니다. Claude Code 입력창에 그대로 치면 Claude에게 보내는 메시지가 됩니다.

> 커밋은 반드시 `feature/recurring-todos` 브랜치에서 합니다. `/ship`은 기본 브랜치(`main`)에서는 실행을 거부합니다.

## 산출물
- 반복 할 일이 구현된 `src/todo.js`, `src/cli.js`와 추가된 테스트
- `feature/recurring-todos` 브랜치의 구현 커밋

## 체크리스트
- [ ] `npm test`가 모두 통과하는지 확인한다. (기존 테스트 5개 포함)
- [ ] `done 1` 뒤에 마감일이 2026-11-23인 2번 할 일이 생기는지 확인한다.
- [ ] `git log --oneline main..HEAD`에 구현 커밋이 있는지 확인한다.

# 6 단계: 코드 리뷰 — `/review`

테스트가 통과해도 안심하지 않습니다. "**운영에서 뭐가 터질 수 있지?**"를 묻는 스태프 엔지니어에게 리뷰를 받습니다.

1. 터미널(`todo-app` 폴더)에서 Claude Code를 다시 실행합니다. 새로 실행하면 **새 대화**로 시작합니다. 리뷰는 구현한 대화의 가정에 끌려가지 않도록 새 대화에서 받는 것이 좋습니다.

   ```bash
   claude
   ```

2. 리뷰를 실행합니다. 현재 브랜치와 `main`의 차이를 자동으로 찾아서 봅니다.

   ```text
   /review
   ```

3. 결과를 읽는 방법입니다. (예시이며 실제 결과는 다릅니다.)

   ```text
   PR type: application

   [AUTO-FIXED] src/cli.js:14  --every 뒤 값이 없을 때 undefined 가 그대로 저장됨 → 오류 메시지로 거부
   [ASK]        src/todo.js:31 마감일을 new Date("YYYY-MM-DD")로 읽은 뒤 로컬 시간으로 더함
                → UTC보다 느린 시간대(미국 등)에서는 다음 마감일이 하루 앞당겨짐. UTC 기준 계산으로 바꿀까요?
   Completeness: 2026-12-28 + 1주 처럼 해를 넘기는 경우 테스트가 없음
   ```

   - `[AUTO-FIXED]`: 이미 고쳐진 것. 내용만 확인합니다.
   - `[ASK]`: 판단이 필요한 것. 추천안이 함께 나오므로 대부분 **수락**합니다.
   - Completeness(완전성): 30분 안에 채울 수 있는 빈틈. 채워 달라고 합니다.

4. 고친 내용을 확인하고 커밋합니다.

   ```text
   !npm test
   ```

   ```text
   !git add . && git commit -m "review 반영"
   ```

## 규칙
> `/review`는 스타일 지적이 아니라 **구조적 위험**(경계 조건, 잘못된 신뢰, 깨진 불변식, 진짜 실패를 놓치는 테스트 등)을 봅니다.

> 테스트를 약하게 만들거나 건너뛰게 바꾼 부분(`skip`, 느슨해진 단언 등)은 반드시 사람에게 이름을 대고 보고합니다. 이런 보고가 나오면 꼭 읽어 보세요.

> `/review`는 끝에 리뷰 기록을 남깁니다. 이 기록이 **Eng Review 관문**을 통과시켜 8단계 `/ship`이 사용합니다. 리뷰 뒤에 코드를 또 고쳤다면 `/review`를 다시 실행해야 기록이 최신(CURRENT)이 됩니다.

## 산출물
- 리뷰에서 고친 코드와 추가된 테스트, "review 반영" 커밋
- `~/.gstack/projects/` 아래의 리뷰 기록 (Review Readiness Dashboard에 표시)

## 체크리스트
- [ ] 리뷰 결과의 `[AUTO-FIXED]`·`[ASK]` 항목을 모두 읽었는지 확인한다.
- [ ] `[ASK]` 항목에 답했는지 확인한다.
- [ ] 리뷰 후 `npm test`가 통과하는지 확인한다.

# 7 단계: QA — `/qa`

이번에는 QA 리드가 앱을 **실제로 실행해 보며** 테스트합니다. 할 일 앱은 CLI라서 브라우저 없이 명령어로 테스트합니다.

1. 새 대화에서 QA를 요청합니다. 무엇을, 어디서, 어디까지 테스트할지 구체적으로 적습니다.

   ```text
   /clear
   ```

   ```text
   /qa 이 저장소의 CLI(node src/cli.js)를 테스트해줘.
   반복 할 일의 add / done / list, 잘못된 입력(마감일 없음, --every month, 없는 번호),
   종료 코드와 오류 메시지, 월말·연말을 넘는 다음 마감일을 확인해줘.
   todos.json 은 임시 폴더에서 만들어서 쓰고, 외부 서비스에는 접속하지 마.
   ```

2. QA가 먼저 **무엇을 어떤 도구로, 어디에 쓰기 권한을 가지고 테스트할지** 알려 줍니다. 4단계에서 만든 테스트 계획이 있으면 그것도 이어받습니다. 확인하고 진행합니다.

3. 진행 중에 일어나는 일입니다.

   - 명령을 하나 실행하고, 결과를 보고, 다음에 무엇을 시험할지 정하며 탐색합니다. 각 시도는 `.gstack/qa-reports/` 아래 `exploration-NNN.json`으로 기록됩니다.
   - 버그를 찾으면: 재현 → **그 버그 때문에 실패하는 테스트**를 `test/todo.test.js`에 추가 → 원인 수정 → 원래 시도와 새 테스트가 통과하는지 재확인 → 커밋
   - 마지막에 보고서 경로와 요약(찾은 문제, 고친 문제, **테스트하지 못한 것**)을 보여 줍니다.

4. 보고서를 열어 봅니다.

   ```text
   !ls .gstack/qa-reports/
   ```

5. 최종 결과를 확인합니다.

   ```text
   !npm test
   ```

   ```text
   !node -e "require('fs').rmSync('todos.json', { force: true })"
   ```

   ```text
   !node src/cli.js add 분리수거 2026-11-16 --every week
   ```

   ```text
   !node src/cli.js done 1
   ```

   ```text
   !node src/cli.js add "물 마시기" --every day
   ```

   ```text
   !node src/cli.js add 운동 2026-11-16 --every month
   ```

   앞의 두 명령은 2번 할 일(마감 2026-11-23)을 만들고, 뒤의 두 명령은 오류 메시지를 출력해야 합니다.

6. 8단계(`/ship`)는 GitHub가 필요한 선택 단계입니다. 하지 않는다면 Claude Code를 종료하지 말고 그대로 **9단계(`/retro`)** 로 넘어갑니다. 8단계를 한다면 8단계 1번에서 종료합니다.

## 규칙
> 코드를 고치지 않고 **보고서만** 받고 싶다면 `/qa` 대신 `/qa-only`를 씁니다. Windows에서는 `/qa-only`가 지원 보장 범위에 들어 있습니다.

> QA는 "버그가 없다"고 말하지 않고, **테스트한 것과 테스트하지 못한 것**을 나눠서 보고합니다. "테스트하지 못한 것"도 꼭 읽으세요.

> `.gstack/` 폴더는 `.gitignore`에 들어 있어서 보고서가 커밋되지 않습니다.

## 산출물
- `.gstack/qa-reports/qa-report-….md` — QA 보고서와 `exploration-NNN.json` 탐색 기록
- (버그를 찾았다면) 회귀 테스트와 수정 커밋

## 체크리스트
- [ ] `.gstack/qa-reports/`에 보고서가 생겼는지 확인한다.
- [ ] 보고서에 "테스트하지 못한 것" 항목이 있는지 확인한다.
- [ ] 버그를 고쳤다면 그 버그용 테스트가 추가됐는지 확인한다.
- [ ] 5번의 명령 결과가 기대대로인지 확인한다.

# 8 단계: PR 출시 — `/ship` (선택, GitHub 필요)

릴리스 엔지니어가 마지막 마일을 처리합니다. `main`과 동기화 → 테스트 → 커버리지·문서 점검 → 푸시 → **PR 생성**까지 한 번에 합니다.
`/ship`은 원격 저장소에 푸시하므로 **GitHub 저장소와 `gh` CLI 로그인**이 필요합니다. 없다면 이 단계는 건너뛰고 7단계까지로 실습을 마쳐도 됩니다.

1. 다음 명령들은 터미널에서 실행하므로, 7단계에서 쓰던 Claude Code를 종료합니다.

   ```text
   /exit
   ```

2. GitHub CLI가 로그인돼 있는지 확인합니다. (없으면 [cli.github.com](https://cli.github.com)에서 설치 후 `gh auth login`)

   ```bash
   gh auth status
   ```

3. 연습용 **비공개** 저장소를 만들고 `main` 브랜치를 올립니다.

   ```bash
   gh repo create todo-app --private --source=. --remote=origin
   ```

   ```bash
   git push -u origin main
   ```

4. 기능 브랜치(`feature/recurring-todos`)에 있는지 확인합니다.

   ```bash
   git branch --show-current
   ```

5. Claude Code를 다시 실행하고 `/ship`을 입력합니다.

   ```bash
   claude
   ```

   ```text
   /ship
   ```

6. `/ship`이 하는 일과 답하는 방법입니다.

   | 진행 (요지) | 이렇게 하기 |
   |---|---|
   | 기본 브랜치(`main`) 감지, `git fetch`, `main` 병합 | 지켜보기 |
   | **Review Readiness Dashboard** 표시 | 6단계 `/review` 기록으로 Eng Review가 CLEAR인지 확인 |
   | 테스트 실행, 바뀐 동작 짧게 탐색, 커버리지 지도 | 빠진 테스트를 추가하자고 하면 수락 |
   | 문서 점검 | README가 없거나 바뀔 게 없으면 그대로 진행 |
   | 버전 | 이 앱에는 `VERSION` 파일이 없어서 **버전 변경 없이 출시**한다고 알려 주는 것이 정상 |
   | 푸시와 PR 생성 | 완료되면 PR 주소가 출력됨 |

7. 출력된 PR 주소를 브라우저로 열어 PR 본문을 읽어 봅니다. 맨 앞에는 사람이 읽는 요약이, 맨 끝에는 접힌 **Agent notes**(gstack 도구가 읽는 기록)가 있습니다.

8. Claude Code를 종료하지 말고 그대로 9단계(`/retro`)로 넘어갑니다.

## 규칙
> `/ship`은 **기능 브랜치에서만** 실행됩니다. `main`에서 실행하면 "기본 브랜치에서는 출시하지 않는다"며 멈춥니다.

> `/ship`은 PR을 **만들기만** 하고 병합하지는 않습니다. 병합과 배포는 `/land-and-deploy`의 몫이며 이 실습에서는 다루지 않습니다. 연습이 끝나면 GitHub에서 PR을 직접 병합하거나 닫으세요.

> 실습용 저장소는 꼭 `--private`로 만드세요. 끝난 뒤 지우려면 `gh repo delete todo-app`(삭제 권한 필요)을 쓰거나 GitHub 웹에서 삭제합니다.

## 산출물
- GitHub의 `todo-app` 비공개 저장소와 `feature/recurring-todos` → `main` PR
- PR 본문(요약, 테스트 계획, 커버리지, Agent notes)

## 체크리스트
- [ ] Review Readiness Dashboard에서 Eng Review가 CLEAR인지 확인한다.
- [ ] `/ship`이 끝나고 PR 주소가 출력됐는지 확인한다.
- [ ] PR 본문 첫 문장이 바뀐 점을 쉬운 말로 설명하는지 확인한다.

# 9 단계: 회고 — `/retro`

스프린트의 마지막은 **Reflect(회고)** 입니다. 엔지니어링 매니저 역할의 `/retro`가 이 저장소의 커밋 기록을 읽고, 이번 작업에서 잘한 점과 개선할 점을 정리해 줍니다.

1. 7단계(또는 8단계)를 마친 Claude Code 화면에서 새 대화로 시작합니다.

   ```text
   /clear
   ```

2. 회고를 실행합니다.

   ```text
   /retro
   ```

3. 회고 결과를 읽어 봅니다. 대략 아래 내용이 나옵니다. (항목 이름과 순서는 버전에 따라 다를 수 있습니다)

   | 내용 (요지) | 읽어 볼 점 |
   |---|---|
   | 기간 동안의 커밋 수·바뀐 줄 수·작업 시간대 | `feature/recurring-todos`의 구현·리뷰·QA 커밋이 집계됐는지 |
   | 테스트 추세 | 처음 5개였던 테스트가 얼마나 늘었는지 |
   | 잘한 점(Wins) | 어느 단계가 실제로 도움이 됐는지 |
   | 개선할 점과 다음 할 일 | 다음 스프린트(예: 매월 반복, 반복 중단)에 가져갈 것 |

4. 궁금한 점을 이어서 물어봅니다. (예시)

   ```text
   이번 스프린트에서 /review 와 /qa 가 각각 찾은 문제를 비교해서 정리해줘.
   ```

5. 실습을 마쳤으면 Claude Code를 종료합니다.

   ```text
   /exit
   ```

## 규칙
> `/retro`는 원래 **주간 회고**용입니다. 실무에서는 기능 하나마다가 아니라 일주일에 한 번 정도 실행해 여러 작업을 함께 돌아봅니다. 이 실습에서는 스프린트를 한 바퀴 돌았으니 바로 실행해 봅니다.

> 회고는 **git 커밋 기록**을 바탕으로 합니다. 커밋을 하지 않은 작업은 집계되지 않으므로, 앞 단계에서 커밋을 빠뜨리지 않았는지 확인하세요.

> `/retro`는 코드를 고치지 않습니다. 읽고 정리만 합니다.

## 산출물
- 이번 스프린트의 회고 요약 (대화 창 안)

## 체크리스트
- [ ] `/retro` 결과에 이번 실습의 커밋들이 반영됐는지 확인한다.
- [ ] 개선할 점 중 다음 스프린트에 가져갈 것을 하나 골라 적어 둔다.
- [ ] `/exit`로 Claude Code를 종료한다.

---

# 더 해보기

| 상황 | 스킬 | 예시 프롬프트 |
|---|---|---|
| 위험한 명령(rm -rf, force-push)을 막고 싶다 | `/careful` | `/careful` 또는 "be careful" |
| 지정한 폴더 밖은 고치지 못하게 한다 | `/freeze` | `/freeze` 후 폴더를 물으면 `src` (해제는 `/unfreeze`) |
| 다음 기능을 같은 흐름으로 시작한다 | `/office-hours` | `/office-hours 반복 할 일을 중단하는 기능을 넣고 싶어.` |
| 아이디어를 실행 가능한 명세로 바로 바꾼다 | `/spec` | `/spec 매월 반복 할 일 (말일 처리 포함)` |
| 계획을 CEO 관점에서만 깊게 본다 | `/plan-ceo-review` | `/plan-ceo-review` (plan mode에서) |
| 작업 중 상태를 저장하고 다음에 이어 한다 | `/context-save`, `/context-restore` | `/context-save` |
| 프로젝트별로 gstack이 배운 것을 본다 | `/learn` | `/learn` |
| 할 일 앱을 웹으로 만든 뒤 브라우저로 테스트한다 | `/qa`, `/browse` | `/qa http://localhost:3000` |

# 문제 해결

| 증상 | 해결 |
|---|---|
| `/office-hours`가 자동완성에 안 뜬다 | Claude Code를 완전히 종료 후 재실행. 그래도 없으면 `cd ~/.claude/skills/gstack && ./setup` 다시 실행 |
| Bun을 설치했는데 `command not found: bun`이 나온다 | 셸을 다시 시작하지 않은 것. `exec /bin/zsh`(bash는 `exec /bin/bash`) 또는 터미널을 새로 연 뒤 `bun --help`로 확인 |
| `./setup`이 Bun 버전 때문에 멈춘다 | `bun upgrade`로 1.4.2 이상으로 올린 뒤 다시 실행 |
| Windows에서 `Permission denied` | 스마트 앱 컨트롤이 실행 파일을 막은 것. WSL에서 실습하거나 공식 문서 [troubleshooting](https://github.com/garrytan/gstack/blob/main/docs/troubleshooting.md) 참고 |
| `/autoplan`이 "No design doc found"라고 한다 | 3단계와 다른 브랜치에 있음. `git branch --show-current`가 `feature/recurring-todos`인지 확인 |
| `/plan-eng-review`가 없다 | 2026-11-06에 빠진 스킬. `/autoplan`을 사용 |
| `/ship`이 "Ship from a feature branch"라며 멈춘다 | `main`에 있음. `git switch feature/recurring-todos` 후 다시 실행 |
| `/ship`이 `git fetch origin` 실패로 멈춘다 | 원격 저장소가 없음. 8단계 2번(`gh repo create`, `git push`)을 먼저 실행 |
| 결과 번호·날짜가 기대와 다르다 | 이전 실습의 `todos.json`이 남아 있음. `rmSync` 명령으로 지운 뒤 다시 실행 |
