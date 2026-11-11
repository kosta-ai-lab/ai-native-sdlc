# 이 실습에서 할 일

> `/poteto-mode`·플레이북·좋은 프롬프트의 5요소·검증 스킬 같은 개념 설명은 [README.md](README.md)를 먼저 읽어 보세요. 이 가이드는 pstack **0.15.36**을 **Claude Code**에서 쓰는 기준으로 작성했습니다.

> 이 가이드는 pstack을 처음 써보는 사람을 위한 **가장 기본적인 흐름**만 다룹니다.
> **설치 → 모델 설정과 검증 스킬 → 코드 이해 → `/poteto-mode`로 기능 구현 → 공격적 검증 → 주석 정리 → (PR)**
> 미리 준비된 할 일 관리 앱(`todo-app` 폴더)을 복사해서, 여기에 **반복 할 일**("매주 월요일 분리수거") 기능을 추가합니다.

```
todo-app 복사 → 기능 브랜치
   │
   ▼
/pstack:setup-pstack            모델·예산 설정 + verify-todo-app 검증 스킬 생성
   │
   ▼
/pstack:how                     (읽기 전용) 지금 코드가 어떻게 동작하는지 이해
   │
   ▼
/pstack:poteto-mode             목표·완료 조건·증거·제약을 담은 한 번의 요청
   ├─ Feature 플레이북 선택 → 할 일 목록
   ├─ how → architect(arena) → 서브에이전트가 구현
   └─ verify-todo-app 으로 실제 실행 증거 → 작은 커밋들
   │
   ▼
/pstack:interrogate             여러 적 에이전트가 깨뜨려 보기 (증명된 것만 보고)
   │
   ▼
/pstack:no-comments             주석 정리
   │
   ▼
(선택) /pstack:poteto-mode PR   Opening a PR 플레이북 (GitHub 필요)
```

**출처·재사용 범위:** 원출처는 [cursor/plugins의 pstack](https://github.com/cursor/plugins/tree/main/pstack)이며 `pstack/LICENSE`는 MIT(Copyright (c) 2026 Lauren Tan)입니다. 이 가이드는 원문을 그대로 옮기지 않고, pstack README·`docs/guide/`·`docs/harness/claude-code.md`·각 `SKILL.md`의 내용을 바탕으로 한국어로 새로 설명한 것입니다. 원문을 복사·변형해 배포하는 경우에는 해당 버전·원 경로를 기록하고 LICENSE의 저작권/허락 고지를 보존하세요. 연습용 저장소 `todo-app`(이 모듈의 `todo-app` 폴더)과 예시 프롬프트·예시 답변은 이 가이드에서 새로 만든 것입니다.

| 이 가이드 | 공식 pstack guide |
|---|---|
| 0 단계: 준비하기 | (가이드에서 추가) |
| 1 단계: pstack 설치 | 01 Set up pstack › Install the plugin |
| 2 단계: 연습용 저장소 준비하기 | (가이드에서 추가한 실습 준비, `todo-app` 폴더 제공) |
| 3 단계: 모델 설정과 검증 스킬 | 01 Set up pstack › Pick your models, Accept the verification offers |
| 4 단계: 코드 이해하기 | 03 Understand the code › Trace behavior with `/how` |
| 5 단계: `/poteto-mode`로 기능 구현 | 02 Route work through `/poteto-mode`, 05 Build and clean |
| 6 단계: 깨뜨려 보기 | 04 Design › Break it with `/interrogate` |
| 7 단계: 주석 정리 | 05 Build and clean › Strip the comments with `/no-comments` |
| 8 단계: PR 열기 (선택) | 06 Verify and ship |

---

# 0 단계: 준비하기

- macOS / Windows / Linux 컴퓨터
- **Node.js 20 이상** ([nodejs.org](https://nodejs.org)) — 연습용 앱 실행용
- **git**
- **Claude Code** (설치와 로그인이 끝난 상태)
- (8단계를 할 경우) **GitHub CLI `gh`** 와 로그인

터미널(Windows는 PowerShell 또는 Git Bash)을 열고 확인합니다.

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
> pstack은 서브에이전트를 많이 띄웁니다. 사용량 한도가 작은 요금제라면 실습 중 한도에 걸릴 수 있습니다. 3단계에서 예산을 낮게 잡으세요.

## 산출물
- 없음 (환경 확인만 합니다)

## 체크리스트
- [ ] `node -v`가 v20 이상인지 확인한다.
- [ ] `git --version`과 `claude --version`이 버전 번호를 출력하는지 확인한다.

# 1 단계: pstack 설치

1. 터미널에서 Cursor 플러그인 마켓플레이스를 Claude Code에 추가합니다.

   ```bash
   claude plugin marketplace add cursor/plugins
   ```

2. pstack을 설치합니다.

   ```bash
   claude plugin install pstack@cursor-plugins
   ```

3. 설치를 확인합니다.

   ```bash
   claude plugin list
   ```

   목록에 `pstack`이 보이면 성공입니다.

> Claude Code 안에서 설치해도 됩니다. 입력창에 `/plugin marketplace add cursor/plugins`, 이어서 `/plugin install pstack@cursor-plugins`를 입력합니다.

## 규칙
> Claude Code가 이미 켜져 있었다면 **완전히 종료한 뒤 다시 실행**해야 새 스킬이 보입니다.

> Claude Code는 제3자 마켓플레이스의 **자동 업데이트를 꺼 둡니다.** 그래서 설치한 버전에 머뭅니다. 한 번 업데이트하려면 `claude plugin update pstack@cursor-plugins`, 자동 업데이트를 켜려면 `/plugin` → marketplaces 탭 → `cursor-plugins` → enable auto-update.

> **Cursor 사용자**는 Cursor 채팅에서 `/add-plugin pstack` 한 줄로 설치하고, 이 가이드의 명령에서 `pstack:` 접두어를 빼고 입력합니다. (예: `/pstack:poteto-mode` → `/poteto-mode`)

## 산출물
- Claude Code에 설치된 `pstack` 플러그인 (스킬 58개, 서브에이전트 2개)

## 체크리스트
- [ ] `claude plugin list`에 `pstack`이 표시되는지 확인한다.
- [ ] Claude Code 재실행 후 입력창에 `/pstack:`을 쳤을 때 `poteto-mode`가 자동완성에 뜨는지 확인한다.

# 2 단계: 연습용 저장소 준비하기

스킬을 시험할 대상이 필요합니다. 할 일을 추가·완료·조회하는 작은 CLI `todo-app`을 **이 모듈 폴더에 미리 만들어 두었습니다.** 코드를 직접 칠 필요 없이 복사해서 씁니다. 할 일에는 **마감일**을 붙일 수 있습니다.

이 앱에는 일부러 비워 둔 **불편함**이 하나 있습니다. "매주 월요일 분리수거"처럼 **반복되는 일**은 완료할 때마다 다음 주 것을 손으로 다시 추가해야 합니다.

## 미리 만들어 둔 파일

```
M37-pstack/
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

전체 코드는 `todo-app/src/todo.js`를 열어 보세요.

</details>

## 따라 하기

1. `todo-app` 폴더를 **강의 자료 저장소 밖**의 작업할 위치로 복사합니다. 터미널을 `M37-pstack` 폴더에서 열고 실행하세요. (파일 탐색기로 복사해도 됩니다.)

   macOS / Linux / Git Bash:
   ```bash
   cp -r todo-app ~/todo-app
   ```

   Windows PowerShell:
   ```powershell
   Copy-Item -Recurse todo-app $HOME\todo-app
   ```

2. 복사한 폴더로 이동해서 git 저장소로 초기화합니다.

   ```bash
   cd ~/todo-app
   ```

   ```bash
   git init -b main
   ```

3. 테스트를 실행하고, 불편함을 직접 확인합니다.

   ```bash
   npm test
   ```

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

4. 확인용 데이터 파일을 지우고 첫 커밋을 만든 뒤, 기능 브랜치로 옮깁니다.

   ```bash
   node -e "require('fs').rmSync('todos.json', { force: true })"
   ```

   ```bash
   git add .
   git commit -m "todo-app 초기 버전"
   ```

   ```bash
   git switch -c feature/recurring-todos
   ```

## 규칙
> **반드시 강의 자료 저장소 밖으로 복사**해서 실습합니다. 원본 폴더에서 바로 하면 강의 자료 저장소 안에 또 다른 git 저장소가 생기고, 실습 파일과 커밋이 강의 자료와 섞입니다.

> 제목에 띄어쓰기가 있으면 따옴표로 감쌉니다. 예) `node src/cli.js add "우유 사기"`

> 이후 모든 단계는 **복사한 `todo-app` 폴더 안에서** 진행합니다.

## 산출물
- 작업 위치의 `todo-app/` 저장소, `main`의 첫 커밋, `feature/recurring-todos` 브랜치

## 체크리스트
- [ ] `npm test`에서 테스트 5개가 모두 통과(pass 5)하는지 확인한다.
- [ ] `done 1` 뒤에 다음 주 할 일이 **생기지 않는다**는 것을 직접 확인한다.
- [ ] `git branch --show-current`가 `feature/recurring-todos`인지 확인한다.

# 3 단계: 모델 설정과 검증 스킬 — `/pstack:setup-pstack`

pstack이 어떤 모델을 얼마나 깊게 쓸지 정하고, 이 앱을 **에이전트가 직접 실행해 확인할 수 있는 검증 스킬**을 만듭니다.

1. `todo-app` 폴더에서 Claude Code를 실행합니다.

   ```bash
   claude
   ```

2. 설정 스킬을 실행합니다.

   ```text
   /pstack:setup-pstack
   ```

3. 진행 순서와 답하는 방법입니다.

   | 에이전트의 질문 (요지) | 이렇게 답하기 |
   |---|---|
   | 예산(budget)을 고르세요: unlimited / large / medium / small | 실습은 **`small — medium reasoning`** (토큰 절약) |
   | 역할별 모델 표를 보여 주고, 그대로 쓸지 바꿀지 묻기 | **그대로 사용**. (Grok 등 Claude가 아닌 모델 역할은 세션 모델로 대체된다는 설명이 나오는 것이 정상) |
   | 검증 스킬을 만들까요? (`/create-verification-skill`) | **yes** |
   | (검증 스킬 생성 중) 코드로 알 수 없는 것만 질문 | 예) "사용자가 쓰는 화면은?" → `CLI (node src/cli.js)` |
   | 형식 검증(formal verification) 스킬을 만들까요? | **no** (동시성·상태 기계가 없는 작은 앱이라 불필요) |

4. 검증 스킬이 만들어지면, 생성기가 **한 번 끝까지 직접 돌려 보고**(실행 → 기능 하나 조작 → 증거 확보 → 정리) 결과를 보여 줍니다. 생긴 파일을 확인합니다.

   ```text
   !ls .claude/skills/
   ```

   `verify-todo-app` 같은 폴더가 보이고, 안에 `SKILL.md`와 `features/`(기능 지도)가 있습니다.

5. 검증 스킬은 팀원과 다른 에이전트도 쓰도록 **커밋**합니다.

   ```text
   !git add .claude && git commit -m "verify-todo-app 검증 스킬 추가"
   ```

6. 모델 설정은 **새 세션부터** 적용됩니다. Claude Code를 종료(`/exit`)하고 다시 실행합니다.

   ```bash
   claude
   ```

## 규칙
> 예산은 언제든 `/pstack:setup-pstack`을 다시 실행해서 바꿀 수 있습니다. 결과가 마음에 들지 않으면 `medium`으로 올려 보세요.

> 모델 설정 파일은 **내 컴퓨터 전체에 적용**되는 `~/.claude/rules/pstack-models.md`입니다. 저장소에는 들어가지 않습니다. `CLAUDE.md`에 적지 않습니다.

> 검증 스킬 이름(`verify-todo-app`)은 저장소 이름에 따라 조금 다를 수 있습니다. 실제 생긴 이름을 기억해 두세요. 5단계에서 씁니다.

> 생성기의 마지막 증명이 실패했다면 그 검증 스킬은 쓰지 말고, 에이전트에게 원인을 고쳐 달라고 하세요.

## 산출물
- `~/.claude/rules/pstack-models.md` — 예산과 역할별 모델 설정
- `.claude/skills/verify-todo-app/SKILL.md` — Launch / Doctor / Drive / Evidence / Cleanup 절차
- `.claude/skills/verify-todo-app/features/` — 기능 지도(할 일 추가, 완료, 목록 등 기능별 파일)

## 체크리스트
- [ ] `~/.claude/rules/pstack-models.md`에 `# budget: small` 줄이 있는지 확인한다.
- [ ] `.claude/skills/verify-…/SKILL.md`와 `features/README.md`가 생겼는지 확인한다.
- [ ] 생성기의 끝까지 증명(end-to-end proof)이 성공했는지 확인한다.
- [ ] Claude Code를 다시 실행했는지 확인한다.

# 4 단계: 코드 이해하기 — `/pstack:how`

고치기 전에, 지금 코드가 어떻게 동작하는지 에이전트가 **설명하게** 합니다. 이 단계는 코드를 바꾸지 않습니다.

1. 질문을 그대로 적습니다.

   ```text
   /pstack:how 할 일을 완료하면 어떤 순서로 처리되고 todos.json 에 어떻게 저장돼?
   마감일은 어떤 형태로 다뤄지고 있어?
   ```

2. 에이전트가 코드를 읽고 **실행 흐름, 주요 데이터 모양, 눈에 잘 안 띄는 점**을 설명합니다. 이런 내용이 나오면 잘 이해한 것입니다.

   - `cli.js`가 `todos.json`을 읽고 → `completeTodo`가 새 배열을 만들고 → `saveTodos`가 파일 전체를 다시 씀
   - 할 일 하나는 `{ id, title, due, done }`이고, `due`는 `"YYYY-MM-DD"` **문자열**(날짜 객체가 아님)
   - 번호는 "지금 가장 큰 번호 + 1"로 매김

3. (선택) 다음 작업 전에 에이전트가 내 목표를 제대로 이해했는지 확인하고 싶다면:

   ```text
   /pstack:in-your-own-words 반복 할 일 기능을 넣으려고 해. 내 목표와 풀려는 문제를 네 말로 정리해줘.
   ```

## 규칙
> "에이전트가 어차피 코드를 읽을 텐데"라고 이 단계를 건너뛰지 마세요. pstack 가이드는 "이해 없이 고치면 처음 그럴듯한 곳에서 증상만 고친다"고 경고합니다.

> 설명에 틀린 부분이 있으면 지금 바로잡습니다. 코드를 쓰기 전에 고치는 것이 가장 쌉니다.

## 산출물
- 없음 (대화 안의 설명)

## 체크리스트
- [ ] 설명에 `todos.json` 읽기 → 변경 → 저장 흐름이 나왔는지 확인한다.
- [ ] 마감일이 문자열로 저장된다는 점을 이해했는지 확인한다.

# 5 단계: `/pstack:poteto-mode`로 기능 구현

이제 한 번의 요청으로 기능을 맡깁니다. pstack은 **중간에 거의 묻지 않고** 진행한 뒤 결과와 증거를 보여 줍니다. 그래서 **결정할 것은 모두 프롬프트에 미리** 넣습니다.

1. 새 작업임을 알리기 위해 대화를 비웁니다.

   ```text
   /clear
   ```

2. 아래 요청을 입력합니다. 좋은 프롬프트의 5요소(목표 / 완료 조건 / 증거 / 아는 것 / 제약)가 모두 들어 있습니다. (`verify-todo-app`은 3단계에서 생긴 실제 이름으로 바꿉니다.)

   ```text
   /pstack:poteto-mode 반복 할 일 기능을 추가해줘.
   지금은 "매주 월요일 분리수거"를 done 하면 다음 주 것을 손으로 다시 add 해야 해.

   정해진 동작:
   - node src/cli.js add <제목> <마감일> --every day|week 로 반복 할 일을 만든다. 반복 할 일은 마감일이 꼭 있어야 한다.
   - 반복 할 일을 done 하면 그 순간 같은 제목의 다음 회차가 새 할 일로 추가된다.
     다음 마감일은 완료한 날이 아니라 원래 마감일 + 주기(1일 또는 7일)다.
   - 목록에는 "[ ] 2. 분리수거 (마감 2026-11-23, 매주)" 처럼 주기를 함께 보여준다.
   - 마감일 없는 반복, day/week 이외의 주기는 오류 메시지와 함께 종료 코드 1로 거부한다.

   완료 조건: npm test 통과(기존 5개 포함), 2026-12-28 매주 반복을 완료하면 2027-01-04 회차가 생김.
   증거: /verify-todo-app 으로 실제 CLI를 실행한 출력을 보여줘.
   제약: 기존 할 일의 목록 출력 형식은 바꾸지 마. 의존성 추가 금지.
   이 폴더의 현재 브랜치(feature/recurring-todos)에서 작업하고 커밋까지만 해. PR은 열지 마.
   ```

3. 진행되는 모습입니다. **지켜보기만** 하면 됩니다.

   | 진행 (요지) | 보이는 것 |
   |---|---|
   | 목표 재진술 | 첫 메시지에서 내 목표, 풀려는 문제, 예상하는 **가장 작은 변경**을 자기 말로 정리 (확인을 기다리지 않고 진행) |
   | 플레이북 선택 | **Feature** 플레이북. 단계가 할 일 목록에 복사됨 |
   | `how` | 바뀔 부분(todo.js, cli.js)을 다시 읽고 정리 |
   | `architect` → `arena` | 여러 서브에이전트가 데이터 모양 시안을 따로 냄 (예: `repeat: "week"` 필드 vs `{ every: 7 }`), 심판이 고르고 합침 |
   | throughput checkpoint | "막는 단계 / 독립 작업 / 공유 상태 / 가장 작은 분해" 4항목. 작은 앱이라 대부분 `n/a: <이유>` |
   | 구현 위임 | `pstack:poteto-agent` 서브에이전트가 정해진 데이터 모양으로 코드와 테스트 작성 |
   | 검증 | `verify-todo-app`으로 실제 CLI 실행, 출력 첨부. 확인 못 한 것은 "inconclusive"로 표시 |
   | 커밋 | 작고 순서 있는 커밋 여러 개 |
   | `Skipped in Claude Code: …` | Cursor 전용 단계(Bugbot 등)는 한 줄 남기고 건너뜀. 정상 |

4. 마지막 답변을 읽습니다. 아래 내용이 들어 있어야 합니다.

   - **무엇을 만들었고 무엇을 왜 골랐는지** (데이터 모양 시안 비교표)
   - **어떤 원칙이 어떤 결정을 바꿨는지** (예: `model-the-domain` → 반복 주기를 문자열 분기 대신 `{ day: 1, week: 7 }` 표로)
   - 검증 명령과 **실제 출력**
   - 남은 결정 사항

5. 직접 확인합니다.

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

   기대 출력 (글자는 조금 다를 수 있습니다):

   ```text
   [x] 1. 분리수거 (마감 2026-11-16, 매주)
   [ ] 2. 분리수거 (마감 2026-11-23, 매주)
   ```

   ```text
   !git log --oneline main..HEAD
   ```

## 규칙
> **스킬 이름을 나열하지 마세요.** "how 하고 architect 하고 arena 해" 같은 순서 지정은 플레이북이 지키던 단계를 빠뜨리게 만듭니다. 목표와 확인 방법만 말하면 됩니다.

> **구현 방법은 적지 않습니다.** "repeat 필드를 추가해" 같은 지시 대신 "어떤 동작이어야 하는지"만 적습니다. 데이터 모양은 `architect`가 시안을 비교해서 정합니다.

> 증거 없이 "다 됐습니다"라고 하면 **경고 신호**입니다. "증거를 보여줘" 또는 "prove-it-works 지켜"라고 다시 요청하세요.

> 결과가 마음에 들지 않으면 짧게 바로잡습니다. pstack은 짧은 후속 지시를 잘 이해합니다. 예) `반복 표시는 "매주" 말고 "1주마다"로 바꿔`, `continue`, `keep going until done`

> 이 단계는 서브에이전트를 여러 개 띄우므로 **시간과 토큰이 가장 많이 드는 단계**입니다(수 분~수십 분).

> 에이전트가 별도 워크트리(작업 폴더)를 만들어 작업했다면, 커밋이 어느 브랜치에 들어갔는지 물어보고 현재 브랜치로 가져와 달라고 하세요.

## 산출물
- 반복 할 일이 구현된 `src/todo.js`, `src/cli.js`와 추가된 테스트
- `feature/recurring-todos` 브랜치의 작은 커밋 여러 개
- 대화 안의 보고서: 설계 시안 비교표, 원칙별 결정, 검증 출력

## 체크리스트
- [ ] 첫 메시지에 목표 재진술이 있었는지 확인한다.
- [ ] 할 일 목록에 Feature 플레이북 단계가 복사됐는지 확인한다.
- [ ] 최종 답변에 실제 CLI 출력(증거)과 원칙 이름이 있는지 확인한다.
- [ ] `npm test`가 통과하고 `done 1` 뒤 2026-11-23 회차가 생기는지 확인한다.

# 6 단계: 깨뜨려 보기 — `/pstack:interrogate`

완성된 변경을 **적(adversary) 에이전트들이 깨뜨려 보게** 합니다. 실제로 실행해서 증명한 문제만 보고되고, 코드는 고치지 않습니다.

1. 새 대화에서 실행합니다.

   ```text
   /clear
   ```

   ```text
   /pstack:interrogate main 이후 이 브랜치의 변경 전체를 회의적으로 봐줘.
   실제 버그나 회귀가 아니면 지적하지 마.
   ```

2. 결과는 세 부분으로 나옵니다. (예시이며 실제 결과는 다릅니다.)

   ```text
   Intent: 반복 할 일을 완료하면 원래 마감일 + 주기로 다음 회차가 생겨야 한다.

   Findings:
   1. --every 뒤에 주기를 빼먹으면 오류 없이 일반 할 일로 저장됨
      command: node src/cli.js add 운동 2026-11-16 --every; echo $?
      output:  [ ] 1. 운동 (마감 2026-11-16)  /  0
      intent:  day/week 이외의 주기는 종료 코드 1로 거부해야 함
      found by: adversary 1

   Dropped:
   - adversary 2: 3건 버림 (실행으로 재현되지 않음 2, 스타일 지적 1)
   ```

   - **Findings**: 명령을 다시 실행해서 확인된 문제만. 명령·출력·기대 출력이 함께 나옵니다.
   - **Dropped**: 증명되지 않아 버린 지적. 여기도 읽어 보고, 동의하지 않으면 되살릴 수 있습니다.
   - "no verified findings"라면 증명된 문제가 없다는 뜻입니다.

3. 문제가 있다면 **새 작업으로** 고치게 합니다. 버그 수정이므로 재현을 먼저 요구합니다.

   ```text
   /pstack:poteto-mode new task. interrogate 결과 1번을 고쳐줘. repro first, then fix and verify.
   ```

## 규칙
> `/interrogate`는 **보고만** 하고 고치지 않습니다. 고치기는 3번처럼 따로 요청합니다.

> Claude Code에서는 다른 회사 모델을 부를 수 없어서 적 에이전트들이 모두 Claude로 실행됩니다. Cursor에서는 Opus와 Grok처럼 서로 다른 모델이 공격해서 더 다양한 문제를 찾습니다.

> "버그 수정"은 `/pstack:tdd`로도 할 수 있습니다. 실패하는 테스트를 먼저 쓰고 고칩니다. 예) `/pstack:tdd 결과 1번을 고쳐줘`

## 산출물
- 대화 안의 보고서: Intent / Findings / Dropped
- (문제가 있었다면) 재현 테스트와 수정 커밋

## 체크리스트
- [ ] 보고서에 Intent, Findings, Dropped 세 부분이 있는지 확인한다.
- [ ] 각 Finding에 실행 명령과 실제 출력이 붙어 있는지 확인한다.
- [ ] 찾은 문제를 고쳤다면 `npm test`가 통과하는지 확인한다.

# 7 단계: 주석 정리 — `/pstack:no-comments`

주석은 **쓴 사람이 아닌 다른 눈**이 봐야 합니다. Comment Sicko 서브에이전트가 이번 변경의 주석을 검토합니다.

1. 실행합니다.

   ```text
   /pstack:no-comments the diff
   ```

2. 진행되는 일입니다.

   - Comment Sicko가 주석마다 남길지 지울지 판단합니다. 남기는 것은 라이선스, 공개 API 설명, 코드로 설명할 수 없는 외부 링크, 바꿀 수 없는 외부 제약 정도입니다.
   - "이 부분이 헷갈려서 주석을 달았다"는 경우는 **코드를 고치라는 신호(refactor flag)** 로 보고, 받아들인 것은 근본 원인을 고칩니다.
   - "지우지 마세요" 같은 제약을 말하는 주석은 **테스트나 타입으로 바꿀지** 제안합니다.

3. 결과를 확인하고 커밋합니다.

   ```text
   !npm test
   ```

   ```text
   !git add . && git commit -m "주석 정리"
   ```

## 규칙
> 정리는 "있으면 좋은" 단계가 아닙니다. pstack 가이드는 설명조 주석과 방어용 군더더기가 남은 diff는 **미완성으로 보이고, 다음 버그가 숨는 곳**이라고 말합니다.

> 코드 군더더기는 `deslop`, 글(README·PR 설명)의 AI 말투는 `/pstack:unslop`, 주석은 `/pstack:no-comments`가 맡습니다. `deslop`은 pstack이 아니라 `cursor-team-kit` 플러그인에 들어 있습니다.

## 산출물
- 주석이 정리된 코드와 "주석 정리" 커밋 (바꿀 것이 없으면 커밋 없음)

## 체크리스트
- [ ] Comment Sicko의 판단 목록을 읽었는지 확인한다.
- [ ] 정리 후 `npm test`가 통과하는지 확인한다.

# 8 단계: PR 열기 (선택, GitHub 필요)

`/poteto-mode`의 **Opening a PR** 플레이북으로 PR을 엽니다. 작은 순서 있는 커밋, Conventional Commits 형식 제목, 브리핑 형식 본문으로 만듭니다. GitHub 저장소와 `gh` 로그인이 없다면 건너뛰어도 됩니다.

1. 연습용 **비공개** 저장소를 만들고 `main`을 올립니다.

   ```bash
   gh auth status
   ```

   ```bash
   gh repo create todo-app --private --source=. --remote=origin
   ```

   ```bash
   git push -u origin main
   ```

2. PR을 요청합니다.

   ```text
   /pstack:poteto-mode feature/recurring-todos 브랜치로 main 에 PR을 열어줘.
   ```

3. 진행되는 일입니다.

   - 커밋을 작고 순서 있게 정리(rebase)합니다.
   - 제목은 `feat: …` 같은 Conventional Commits 형식, 본문은 `## Why`(내 목표)로 시작합니다.
   - PR은 초안(draft)이 아닌 **바로 리뷰 가능한 상태**로 엽니다. `gh pr create`를 씁니다.
   - 끝나면 PR 주소를 알려 줍니다.

## 규칙
> PR을 연 뒤 리뷰 코멘트·CI 실패·충돌 처리까지 맡기려면 `/pstack:poteto-mode check on pr <번호>. anything outstanding?` (Babysit 플레이북)을 씁니다.

> 실습이 끝나면 GitHub에서 PR을 닫거나 병합하고, 필요하면 저장소를 삭제하세요.

## 산출물
- GitHub의 `todo-app` 비공개 저장소와 `feature/recurring-todos` → `main` PR

## 체크리스트
- [ ] PR 제목이 `feat:` 같은 형식인지 확인한다.
- [ ] PR 본문이 `## Why`로 시작하고 검증 증거를 담고 있는지 확인한다.

---

# 더 해보기

| 상황 | 스킬 | 예시 프롬프트 |
|---|---|---|
| 어떤 스킬을 써야 할지 모르겠다 | `/pstack:poteto-help` | `/pstack:poteto-help 반복 할 일에 매월 주기를 추가하려면 어떻게 요청하지?` |
| 보내기 전에 프롬프트를 더 깊게 다듬는다 | `/pstack:sharpen` | `/pstack:sharpen 반복 할 일 중단 기능을 추가해줘` |
| 변경이 왜 맞는지 제대로 이해하고 싶다 | `/pstack:teach` | `/pstack:teach 이번 변경이 어떻게 다음 회차를 만드는지, 왜 이 데이터 모양이 나은지 설득해줘` |
| 에이전트 말이 너무 어렵다 | `/pstack:bro` | `/pstack:bro` |
| 이 대화에서 무엇이 바뀌었는지 따라잡는다 | `/pstack:ketchup` | `/pstack:ketchup` |
| 작은 변경이 다른 곳을 깨뜨리지 않는지 본다 | `/pstack:blast-radius` | `/pstack:blast-radius formatTodos 변경` |
| 긴 작업에서 배운 것을 스킬에 남긴다 | `/pstack:reflect` | `/pstack:reflect 시간이 오래 걸렸어. 다음엔 반복되지 않게 배운 걸 남겨줘` |
| 같은 실수를 계속 바로잡고 있다 | `/pstack:correct` | `/pstack:correct` |
| 나만의 `-mode` 스킬을 만든다 | `/pstack:automate-me` | `/pstack:automate-me` |
| 결정 기록을 남기며 오래 맡긴다 | `/pstack:show-me-your-work` | `/pstack:show-me-your-work 결정 기록을 남겨줘. 나중에 검토할게` |

# 문제 해결

| 증상 | 해결 |
|---|---|
| `/pstack:poteto-mode`가 자동완성에 안 뜬다 | Claude Code를 완전히 종료 후 재실행. 그래도 없으면 `claude plugin list`로 설치 확인 |
| `/poteto-mode`라고 쳤더니 실행되지 않는다 | Claude Code에서는 `pstack:` 접두어가 필요. `/pstack:poteto-mode` |
| 모델 설정이 적용되지 않는 것 같다 | 설정은 새 세션부터 적용. Claude Code를 종료 후 재실행 |
| 사용량 한도에 금방 걸린다 | `/pstack:setup-pstack`을 다시 실행해 예산을 `small`로, 또는 패널(arena·interrogate) 목록을 1개로 줄이기 |
| 증거 없이 "완료"라고 한다 | "증거를 보여줘. prove-it-works 지켜."라고 다시 요청 |
| 내 질문이 앞 작업의 다음 단계로 처리된다 | 프롬프트 앞에 `new task.`를 붙여 플레이북을 새로 고르게 하기 |
| 변경이 현재 브랜치에 없다 | 에이전트가 별도 워크트리에서 작업한 것. 브랜치 이름을 물어보고 가져와 달라고 하기 |
| 결과 번호·날짜가 기대와 다르다 | 이전 실습의 `todos.json`이 남아 있음. `rmSync` 명령으로 지운 뒤 다시 실행 |
