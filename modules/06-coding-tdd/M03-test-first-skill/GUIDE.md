# 이 단원이 말하려는 것

규칙을 적어 둬도 AI가 늘 지키지는 않는다. 그러면 **무엇을 장치로 막고, 장치가 막지 못하는 것은 누가 보는가**. 여기서 장치는 훅 같은 강제 수단이다. 규칙으로 먼저 해 보고, 규칙만으로 부족했던 것과 예외 없이 막아야 하는 것을 스킬과 훅으로 옮긴다. 단원 M02에서 본 문제는 두 가지다. 규칙이 있어도 잘 지켜지지 않은 "한 번에 한 기능"과, 규칙이 없을 때 나온 테스트 세탁이다. 이 단원에서 앞의 것은 스킬로, 뒤의 것은 구현 담당과 훅으로 다룬다. 장치가 막지 못하는 것은 사람이 확인한다.

이 과정의 네 가지 원칙은 이 단원에서 다음을 뜻한다.

| 원칙 | 이 단원(스킬과 훅)에서는 |
|---|---|
| ① AI는 제안하고, 결정은 사람이 한다 | 스킬은 사람이 `/test-first`로 부를 때만 실행되고, 커밋은 하지 않는다. 메인 세션이 테스트를 무르게 고쳤는지는 사람이 `git diff -- test`와 `docs/tdd-log.md`로 본다 |
| ② 말이 아니라 실행 결과로 확인한다 | 훅은 직접 실행해 종료 코드를 본다. 구현 담당이 "수정하지 않았다"고 보고해도 테스트 파일이 그대로인지 `git diff`와 `grep`으로 본다 |
| ③ 맡길수록 절차가 필요하다 | 단원 M02에서 본 두 문제를 스킬과 훅으로 다룬다. "한 번에 한 기능"은 스킬의 순서에 담고, 테스트 세탁은 구현 담당을 나누고 훅으로 막는다 |
| ④ 앞 단계가 뒤 단계의 기준이다 | 인수조건 파일이 스킬의 입력이다. 스킬은 인수조건에서 테스트 목록을 만들고, 한 항목씩 테스트, 구현, 기록으로 잇는다 |

그래서 이 단원의 단계는 네 마디로 나누어 적었다. 해당하는 일이 없는 마디는 뺐다.

- **맡긴다**: AI에게 하는 요청이다. AI가 내놓는 것은 제안이다.
- **확인한다**: 직접 실행하는 명령과 그 출력, 직접 열어 읽는 파일이다. 검증 실행에서 본 것도 여기에 두어 자기 결과와 견주게 했다.
- **정한다**: 확인한 것을 보고 사람이 내리는 판단이다. 받아들일지, 무엇을 장치로 막고 무엇을 사람이 볼지를 정한다.
- **넘긴다**: 다음 단계의 기준이 되는 산출물이다.

AI에게 맡길 일이 없는 단계(0~4, 7단계)에는 '맡긴다'가 없다. 실습 폴더를 준비하고 스킬, 서브에이전트, 훅 파일을 만드는 일은 직접 하므로 '한다'에 적었다. 단계 제목 아래에는 그 단계에서 주로 연습하는 원칙을 적었다. 준비만 하는 0, 1단계에는 적지 않았다.

# 개념

단원 M02에서 규칙은 AI의 작업을 바꿨지만 "한 번에 한 기능"은 다섯 번 가운데 두 번만 지켜졌다. 규칙은 지시일 뿐이기 때문이다. 이 단원에서는 **여러 단계의 절차는 스킬에 담고, 예외 없이 지켜야 하는 것은 훅으로 강제한다.**

## 규칙, 스킬, 훅

| 수단 | 파일 | 언제 적용되나 | 강제력 |
|---|---|---|---|
| 규칙 | `CLAUDE.md` | 세션을 시작할 때마다 읽힌다 | 지시. 지켜지지 않을 수 있다 |
| 스킬 | `.claude/skills/<이름>/SKILL.md` | `/이름`으로 부르면 그 내용이 지시로 들어간다 | 지시. 여러 단계의 절차를 담기 좋다 |
| 서브에이전트 | `.claude/agents/<이름>.md` | 메인 세션이 일을 맡길 때 별도 맥락에서 실행된다 | 역할과 쓸 수 있는 도구를 나눈다 |
| 훅 | `.claude/settings.json`과 스크립트 | 도구를 쓰기 직전처럼 정해진 시점에 자동으로 실행된다 | 강제. 종료 코드 2로 끝나면 그 도구 호출이 막힌다 |

Claude Code 공식 문서도 같은 구분을 권한다. `CLAUDE.md`에는 세션마다 필요한 사실을 두고, 여러 단계의 절차는 스킬로 옮기며, 예외가 없어야 하는 규칙은 훅으로 강제하라는 것이다.

## 이 단원에서 만드는 것

```
/test-first docs/05-acceptance.feature        ← 사람이 부른다
        │
        ▼
  메인 세션 (스킬의 순서를 따른다)
   1. 테스트 목록에서 항목 하나를 고른다
   2. 테스트 하나를 쓴다 ─────────────► test/
   3. pnpm test로 유효한 Red를 확인한다
   4. 구현을 맡긴다 ──► implementer 서브에이전트 ──► src/
                              │
                              └─ test/, docs/를 고치려 하면 훅이 막는다 (종료 코드 2)
   5. pnpm test로 Green을 직접 확인한다
   6. docs/tdd-log.md에 Red와 Green을 적는다
        │
        └─ 항목이 남았으면 1로
```

테스트를 쓰는 쪽(메인 세션)과 구현하는 쪽(implementer)을 나누는 이유는 단원 M02에서 본 테스트 세탁 때문이다. 구현하는 쪽이 테스트를 고칠 수 없으면, 통과시키는 방법은 구현을 고치는 것뿐이다.

## 이 단원의 실습

| 항목 | 값 |
|---|---|
| 출발점 | [단원 M02의 todo-app/](../M02-tdd-rules/todo-app/) (시나리오 네 개 가운데 두 개만 구현됨) |
| 작업 폴더 | `~/work/tdd/todo-app-skill` |
| 만드는 것 | `test-first` 스킬, `implementer` 서브에이전트, 테스트를 지키는 훅 |
| 완성본 | 이 단원의 [harness/.claude/](harness/.claude/) (막히면 비교하거나 복사한다) |

> 검증 환경(2026-11-24): macOS, Node.js v24.22.0, pnpm 12.21.0, Vitest 3.2.6, TypeScript 5.9.3, Claude Code 2.1.330(모델 Sonnet 5.5).
> 훅 스크립트는 직접 실행해 판정을 확인했다. `/test-first`와 훅 차단은 Claude Code 비대화형 실행(`claude -p`)으로 확인했다. 대화형 화면에서의 표시(신뢰 확인 창, 서브에이전트 표시)는 확인하지 않았다.

**출처와 재사용 범위:** 이 단원의 스킬, 서브에이전트, 훅 스크립트, 프롬프트는 이 저장소에서 새로 만들었다(코드는 Apache 2.0). 파일 형식은 Claude Code 공식 문서를 따랐다.

---

# 0 단계: 준비 확인하기

## 확인한다

- 준비물은 [단원 M01](../M01-red-green-refactor/)과 같다. 훅 스크립트는 Node.js로 실행하므로 따로 설치할 것은 없다.
- [단원 M02](../M02-tdd-rules/)의 개념 절을 먼저 읽는다. 이 단원은 그 관찰에서 출발한다.

## 체크리스트
- [ ] `node --version`, `pnpm --version`, `git --version`, `claude --version`이 버전을 출력한다.

---

# 1 단계: 실습 폴더 준비하기

## 한다

- 단원 M02의 출발점을 복사하고, 규칙 파일을 넣는다. 강의 자료 저장소의 위치를 `<저장소>`로 적었다.
  ```bash
  mkdir -p ~/work/tdd
  cp -R <저장소>/modules/06-coding-tdd/M02-tdd-rules/todo-app ~/work/tdd/todo-app-skill
  cd ~/work/tdd/todo-app-skill
  cp <저장소>/modules/06-coding-tdd/CLAUDE.md CLAUDE.md
  pnpm install --frozen-lockfile --ignore-scripts
  git init
  git add -A && git commit -m "chore: 실습 출발점"
  pnpm test          # Tests  2 passed (2)
  ```

## 넘긴다 (산출물)

- `~/work/tdd/todo-app-skill` (테스트 2개 통과, `CLAUDE.md` 포함).

## 체크리스트
- [ ] `pnpm test`가 `Tests  2 passed (2)`를 출력한다.
- [ ] `CLAUDE.md`가 있다.

---

# 2 단계: test-first 스킬 만들기

> 연습하는 원칙: ③ 맡길수록 절차가 필요하다. 단원 M02에서 잘 지켜지지 않은 "한 번에 한 기능"을 스킬의 순서에 담는다.

## 한다

- 스킬은 폴더 하나와 `SKILL.md` 파일 하나다. 머리말의 `name`이 명령 이름(`/test-first`)이 된다. `name`이 없으면 폴더 이름을 쓴다.
  ```bash
  mkdir -p .claude/skills/test-first
  ```
- `.claude/skills/test-first/SKILL.md`를 다음 내용으로 만든다.
  ```markdown
  ---
  name: test-first
  description: 인수조건 파일의 시나리오를 한 번에 하나씩, 테스트를 먼저 쓰는 순서로 구현한다.
  argument-hint: [인수조건 파일 경로]
  disable-model-invocation: true
  allowed-tools: Bash(pnpm test *) Bash(pnpm typecheck *) Bash(git status *) Bash(git diff *)
  ---

  # test-first

  인수조건 파일 `$ARGUMENTS`의 시나리오를 한 번에 하나씩 구현한다. 아래 순서를 건너뛰지 않는다.

  ## 준비

  1. `$ARGUMENTS`를 읽는다. 파일이 없으면 멈추고 경로를 묻는다.
  2. `docs/test-list.md`가 없으면 시나리오마다 한 줄씩 `- [ ]` 항목으로 만든다. 이미 테스트가 있는 시나리오는 `[x]`로 적는다. 인수조건에 없는 항목은 넣지 않는다.

  ## 항목마다 반복

  `[ ]`인 첫 항목 **하나만** 골라 다음을 한다. 한 항목이 끝나기 전에는 다음 항목의 테스트를 쓰지 않는다.

  1. **테스트 하나 추가.** 그 항목의 테스트 하나만 test/ 아래에 쓴다. 인수조건의 값을 그대로 쓴다. 구현 파일은 건드리지 않는다.
  2. **Red 확인.** `pnpm test`를 실행한다.
     - 파일을 불러오지 못한 오류면 implementer 서브에이전트에게 "동작 없는 뼈대만" 만들게 한 뒤 다시 실행한다.
     - 새 테스트가 처음부터 통과하면 구현하지 않는다. 이미 있는 동작이라는 뜻이다. 그 사실을 기록하고 5번으로 간다.
     - 단언 실패이고 메시지가 인수조건의 값을 말하면 유효한 Red다.
  3. **구현은 implementer에게 맡긴다.** implementer 서브에이전트에게 실패한 테스트의 이름과 실패 메시지를 주고 "이 테스트를 통과하는 최소 구현"을 요청한다. 직접 구현하지 않는다.
  4. **Green 확인.** `pnpm test`를 직접 실행해 모든 테스트가 통과하는지 본다. implementer가 테스트가 잘못됐다고 보고하면 테스트를 고치지 말고 멈춰서 사용자에게 묻는다.
  5. **기록.** `docs/tdd-log.md`에 항목 이름, Red의 실패 메시지 한 줄, Green의 결과 줄(`Tests …`)을 덧붙이고, `docs/test-list.md`의 항목을 `[x]`로 바꾼다.

  ## 끝

  모든 항목이 `[x]`가 되면 `pnpm test`와 `pnpm typecheck`를 실행하고, 항목별 Red와 Green을 한 줄씩 보고한다. 커밋은 하지 않는다.
  ```
- 맨 위 `---` 사이의 머리말이 스킬의 설정이다.

  | 항목 | 뜻 |
  |---|---|
  | `name` | 명령 이름. `/` 메뉴에 이 이름으로 보인다 |
  | `description` | 스킬이 하는 일. Claude가 스킬을 쓸지 정할 때 읽는 설명이다 |
  | `argument-hint` | 자동 완성에 보이는 인수 안내 |
  | `disable-model-invocation: true` | Claude가 알아서 부르지 못하게 한다. 사람이 `/test-first`로 부를 때만 실행된다 |
  | `allowed-tools` | 스킬을 부른 차례 동안 묻지 않고 쓸 수 있는 도구. 여기서는 테스트, 타입 검사, `git status`, `git diff` 명령을 넣었다 |

- 본문의 `$ARGUMENTS`는 스킬을 부를 때 준 인수로 바뀐다. `/test-first docs/05-acceptance.feature`라고 부르면 그 경로가 들어간다.
- 본문은 단원 M01에서 프롬프트로 일러 준 순서와 같다. 다른 점은 **구현을 직접 하지 않고 implementer에게 맡긴다**는 것이다.

## 넘긴다 (산출물)

- `.claude/skills/test-first/SKILL.md`.

## 체크리스트
- [ ] 파일의 첫 줄이 `---`다. 그렇지 않으면 머리말이 읽히지 않는다.
- [ ] `disable-model-invocation: true`가 있다.

---

# 3 단계: 구현 담당 서브에이전트 만들기

> 연습하는 원칙: ③ 맡길수록 절차가 필요하다. 테스트 세탁을 막으려고 테스트를 쓰는 쪽과 구현하는 쪽을 나눈다.

## 한다

- 서브에이전트는 `.claude/agents/` 아래의 마크다운 파일 하나다. 머리말의 `name`과 `description`은 필수다.
  ```bash
  mkdir -p .claude/agents
  ```
- `.claude/agents/implementer.md`를 다음 내용으로 만든다.
  ```markdown
  ---
  name: implementer
  description: 실패한 테스트를 통과하는 최소 구현만 작성하는 구현 담당. test-first 스킬이 구현 단계에서 부른다.
  tools: Read, Edit, Write, Bash, Glob, Grep
  ---

  너는 구현 담당이다. 받은 테스트를 통과시키는 일만 한다.

  - src/ 아래 파일만 고친다. test/와 docs/는 읽기만 한다. 고치려고 하면 훅이 막는다.
  - 받은 테스트를 통과하는 최소 코드만 쓴다. 인수조건에 없는 기능을 넣지 않는다.
  - "뼈대만" 만들라는 요청이면 함수 선언과 빈 값을 돌려주는 본문만 만든다. 동작은 넣지 않는다.
  - 끝나면 pnpm test를 실행하고 결과 줄(Tests …)을 그대로 보고한다.
  - 테스트가 잘못됐다고 판단하면 고치지 말고, 그렇게 본 이유를 보고한다.
  ```
- 본문은 이 서브에이전트의 지시문이다. 메인 세션의 대화 내용은 넘어가지 않으므로, 구현 담당이 알아야 할 것을 여기에 적는다.

## 정한다

- 이 지시문도 지시일 뿐이다. "test/는 읽기만 한다"는 말이 지켜지지 않을 때를 대비해 다음 단계에서 훅을 건다.

## 넘긴다 (산출물)

- `.claude/agents/implementer.md`.

## 체크리스트
- [ ] 머리말에 `name: implementer`와 `description`이 있다.

---

# 4 단계: 테스트를 지키는 훅 만들기

> 연습하는 원칙: ③ 맡길수록 절차가 필요하다. ② 말이 아니라 실행 결과로 확인한다.

## 한다

- 훅 스크립트를 만든다. Claude Code는 파일을 고치는 도구(Edit, Write)를 쓰기 직전에 이 스크립트를 실행하고, 도구 입력을 JSON으로 표준 입력에 준다. 서브에이전트 안에서 실행된 도구라면 그 JSON에 `agent_type`(서브에이전트 이름)이 들어 있다.
  ```bash
  mkdir -p .claude/hooks
  ```
- `.claude/hooks/protect-tests.mjs`를 다음 내용으로 만든다.
  ```javascript
  #!/usr/bin/env node
  // 구현 담당(implementer) 서브에이전트가 테스트와 인수조건을 고치지 못하게 막는다.
  // Claude Code가 Edit·Write 도구를 쓰기 직전에 이 스크립트를 실행하고, 도구 입력을 표준 입력으로 준다.
  // 종료 코드 2로 끝나면 그 도구 호출이 막히고, 표준 오류에 쓴 글이 이유로 전달된다.
  import { readFileSync } from "node:fs";
  import path from "node:path";

  const input = JSON.parse(readFileSync(0, "utf8"));
  const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
  const file = String(input.tool_input?.file_path ?? "");
  const relative = path.relative(root, file).split(path.sep).join("/");
  const guarded = relative.startsWith("test/") || relative.startsWith("docs/");

  if (input.agent_type === "implementer" && guarded) {
    console.error(
      `차단: 구현 담당은 ${relative} 파일을 고칠 수 없다. 테스트나 인수조건이 잘못됐다고 보면 고치지 말고 이유를 보고한다.`,
    );
    process.exit(2);
  }
  process.exit(0);
  ```
- 훅을 등록한다. `.claude/settings.json`을 다음 내용으로 만든다.
  ```json
  {
    "permissions": {
      "allow": [
        "Bash(pnpm test *)",
        "Bash(pnpm typecheck *)"
      ]
    },
    "hooks": {
      "PreToolUse": [
        {
          "matcher": "Edit|Write",
          "hooks": [
            {
              "type": "command",
              "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-tests.mjs"
            }
          ]
        }
      ]
    }
  }
  ```
  - `hooks.PreToolUse`: Edit 또는 Write 도구를 쓰기 직전에 스크립트를 실행한다.
  - `permissions.allow`: 테스트와 타입 검사 명령은 묻지 않고 실행한다. 서브에이전트도 이 명령을 쓴다.

## 확인한다

- **훅을 직접 실행해 판정을 확인한다.** Claude Code 없이도 확인할 수 있다.
  ```bash
  echo '{"agent_type":"implementer","tool_input":{"file_path":"'"$PWD"'/test/todo.test.ts"}}' \
    | CLAUDE_PROJECT_DIR="$PWD" node .claude/hooks/protect-tests.mjs; echo "exit=$?"
  ```
  ```
  차단: 구현 담당은 test/todo.test.ts 파일을 고칠 수 없다. 테스트나 인수조건이 잘못됐다고 보면 고치지 말고 이유를 보고한다.
  exit=2
  ```
- 같은 명령에서 경로를 `src/todo.ts`로 바꾸면 `exit=0`이 나온다. `"agent_type":"implementer",`를 지워도 `exit=0`이다. 메인 세션은 테스트를 써야 하므로 막지 않는다.

## 넘긴다 (산출물)

- 만든 파일을 커밋한다.
  ```bash
  git add -A && git commit -m "chore: test-first 스킬과 테스트 보호 훅"
  ```
- `.claude/hooks/protect-tests.mjs`, `.claude/settings.json`.
- 훅 판정 세 가지(구현 담당과 test/는 2, 구현 담당과 src/는 0, 메인 세션과 test/는 0).

## 체크리스트
- [ ] 구현 담당이 `test/` 파일을 고치는 입력에 `exit=2`가 나온다.
- [ ] 구현 담당이 `src/` 파일을 고치는 입력에 `exit=0`이 나온다.
- [ ] `agent_type`이 없는 입력에 `exit=0`이 나온다.

---

# 5 단계: /test-first 실행하기

> 연습하는 원칙: ② 말이 아니라 실행 결과로 확인한다. ④ 앞 단계가 뒤 단계의 기준이다.

## 맡긴다

- Claude Code를 시작한다. 처음이면 이 폴더를 신뢰하는지 물을 수 있다. 직접 만든 폴더이므로 신뢰한다.
  ```bash
  claude
  ```
- 스킬을 부른다.
  ```
  /test-first docs/05-acceptance.feature
  ```

## 확인한다

- 일하는 순서를 본다. 검증 실행 2회에서는 두 번 모두 다음 순서였다.

  | 순서 | 누가 | 한 일 | `pnpm test` 결과 |
  |---|---|---|---|
  | 1 | 메인 | `docs/test-list.md` 작성 (앞의 두 항목은 `[x]`) | |
  | 2 | 메인 | "앞뒤 공백 제거" 테스트 하나 추가 | 1 failed |
  | 3 | implementer | `src/todo.ts` 수정 | 3 passed |
  | 4 | 메인 | Green 확인, `docs/tdd-log.md` 기록, 항목 닫기 | 3 passed |
  | 5 | 메인 | "공백만 있는 제목 거부" 테스트 하나 추가 | 1 failed |
  | 6 | implementer | `src/todo.ts` 수정 | 4 passed |
  | 7 | 메인 | Green 확인, 기록, 항목 닫기, 타입 검사 | 4 passed |

- 끝나면 산출물을 확인한다. 기록은 다음과 비슷하다.
  ```bash
  cat docs/tdd-log.md
  ```
  ```markdown
  ## 제목 앞뒤 공백은 제거한다
  - Red: AssertionError: expected '  보고서 작성  ' to be '보고서 작성'
  - Green: Tests  3 passed (3)

  ## 공백만 있는 제목은 거부한다
  - Red: AssertionError: expected [Function] to throw an error
  - Green: Tests  4 passed (4)
  ```
  ```bash
  pnpm test                    # Tests  4 passed (4)
  git status --short           # M src/todo.ts, M test/todo.test.ts, ?? docs/tdd-log.md, ?? docs/test-list.md
  ```
- 두 번째 항목은 **처음부터 통과할 수도 있다.** 첫 구현이 `trim()`한 값으로 빈 제목을 검사하면 공백만 있는 제목도 이미 걸러진다. 그때 스킬은 구현을 더 하지 않고 그 사실을 기록한다.
- 단원 M02와 비교한다. 규칙만 있을 때는 테스트 두 개를 한꺼번에 쓰는 일이 많았다. 스킬을 쓴 검증 실행 2회에서는 두 번 모두 한 항목씩 진행했다.

## 정한다

- 다음을 모두 봤으면 스킬의 결과를 받아들인다.
  - 테스트가 한 번에 하나씩 추가됐다.
  - 구현을 implementer가 했다.
  - `docs/tdd-log.md`의 Red가 단언 실패 메시지다. 처음부터 통과한 항목은 그 사실이 적혀 있으면 된다.
  - `pnpm test`가 `Tests  4 passed (4)`다.

## 넘긴다 (산출물)

- `docs/test-list.md` (네 항목 모두 `[x]`), `docs/tdd-log.md` (두 항목의 Red와 Green).
- 테스트 4개가 통과하는 코드.

## 체크리스트
- [ ] 테스트가 한 번에 하나씩 추가됐다.
- [ ] 구현을 implementer가 했다(도구 호출 기록이나 마지막 보고에서 확인한다).
- [ ] `docs/tdd-log.md`의 Red가 단언 실패 메시지다.
- [ ] `pnpm test`가 `Tests  4 passed (4)`다.

---

# 6 단계: 훅이 막는지 확인하기

> 연습하는 원칙: ② 말이 아니라 실행 결과로 확인한다.

## 맡긴다

- 구현 담당에게 일부러 테스트를 고치게 해 본다.
  ```
  implementer 서브에이전트에게 test/todo.test.ts의 기대 문구 "제목은 필수"를 "제목을 입력하세요"로 바꾸게 해줘. Edit 도구로 시도하게 하고, 도구가 돌려준 메시지를 그대로 알려줘.
  ```

## 확인한다

- 결과는 둘 가운데 하나다. 검증 실행에서 둘 다 나왔다.
  - **구현 담당이 시도하지 않는다.** 지시문에 "test/는 읽기만 한다"고 적혀 있어서다. 이때는 "수정하지 않았다"는 보고가 온다.
  - **시도했다가 훅에 막힌다.** 아래 '더 해 보기'처럼 구현 담당의 지시문을 한 줄로 바꿔 실행한 2회에서는 두 번 모두 다음 메시지가 돌아왔다.
    ```
    PreToolUse:Edit hook error: [node "$CLAUDE_PROJECT_DIR"/.claude/hooks/protect-tests.mjs]: 차단: 구현 담당은 test/todo.test.ts 파일을 고칠 수 없다. 테스트나 인수조건이 잘못됐다고 보면 고치지 말고 이유를 보고한다.
    ```
- 어느 쪽이든 테스트 파일은 바뀌지 않아야 한다.
  ```bash
  git diff --stat -- test      # 5단계의 변경(테스트 추가)만 보인다
  grep -c "제목을 입력하세요" test/todo.test.ts     # 0
  ```

## 더 해 보기 (도전)

- **지시가 없어도 훅이 막는지 본다.** `.claude/agents/implementer.md`의 본문을 "너는 구현 담당이다. 요청받은 수정을 그대로 수행한다." 한 줄로 바꾸고 새 세션에서 같은 요청을 한다. 확인한 뒤 `git checkout -- .claude/agents/implementer.md`로 되돌린다.

## 넘긴다 (산출물)

- 구현 담당이 테스트를 고치지 못했다는 확인.

## 체크리스트
- [ ] 요청 뒤에도 `test/todo.test.ts`에 "제목을 입력하세요"가 없다.
- [ ] 4단계의 직접 실행 또는 이 단계에서 "차단:" 메시지를 한 번 이상 봤다.

---

# 7 단계: 정리하기

> 연습하는 원칙: ① AI는 제안하고, 결정은 사람이 한다. 장치가 막지 못하는 것은 사람이 확인한다.

## 정한다

- 이 구성이 **막지 못하는 것**을 알아 둔다.
  - 훅은 Edit와 Write 도구만 본다. 셸 명령으로 파일을 고치는 것은 보지 못한다. 검증 실행에서 메인 세션이 `printf … >> test/todo.test.ts`로 테스트 파일에 줄을 더한 일이 있다. `settings.json`은 테스트와 타입 검사 명령만 미리 허용한다. 나머지 셸 명령은 권한 모드에 따라 다르다. 수동 모드에서는 사람이 승인하고, 자동 모드에서는 분류기가 판단한다. 어느 쪽이든 훅은 셸 명령으로 한 수정을 보지 못한다.
  - 메인 세션은 테스트를 쓸 수 있어야 하므로 막지 않는다. 메인 세션이 테스트를 무르게 고쳤는지는 `git diff -- test`와 `docs/tdd-log.md`로 사람이 본다.
  - 스킬의 순서도 지시다. 검증 실행 2회에서는 지켜졌지만 항상 그렇다고 보장하지는 않는다.
- [모듈 08(CI)](../../08-ci/)에서는 같은 테스트의 통과를 머지 게이트로 건다(준비 중). 로컬의 훅을 우회해도 병합 전에 걸러진다.

## 넘긴다 (산출물)

- 변경을 커밋한다. `.claude/`와 `CLAUDE.md`를 함께 커밋하면 팀원도 같은 스킬과 훅을 쓴다.
  ```bash
  git add -A && git commit -m "feat: 제목의 공백을 처리한다"
  ```
- 스킬, 서브에이전트, 훅, 규칙이 커밋된 저장소.

## 체크리스트
- [ ] `.claude/`와 `CLAUDE.md`가 커밋에 들어 있다.
- [ ] 이 구성이 막지 못하는 것 세 가지를 설명할 수 있다.

---

# 돌아보기: 네 원칙을 어디서 썼나

| 원칙 | 이 단원에서 한 일 |
|---|---|
| ① AI는 제안하고, 결정은 사람이 한다 | 이 구성이 막지 못하는 것 세 가지를 짚었다(7단계). 메인 세션이 테스트를 무르게 고쳤는지는 사람이 `git diff -- test`와 `docs/tdd-log.md`로 보기로 했다. 커밋도 스킬이 아니라 사람이 했다 |
| ② 말이 아니라 실행 결과로 확인한다 | 훅을 직접 실행해 `exit=2`와 `exit=0`을 봤다(4단계). 스킬이 끝난 뒤 `docs/tdd-log.md`, `pnpm test`, `git status --short`로 결과를 봤다(5단계). 구현 담당에게 테스트를 고치라고 요청해 본 뒤 테스트 파일이 그대로인지 `git diff`와 `grep`으로 봤다(6단계) |
| ③ 맡길수록 절차가 필요하다 | 단원 M02에서 본 문제 두 가지를 스킬과 훅으로 다뤘다. "한 번에 한 기능"은 스킬의 순서에 담았다(2단계). 테스트 세탁은 구현 담당을 나누고(3단계), 구현 담당이 테스트를 고치지 못하게 훅으로 막았다(4단계) |
| ④ 앞 단계가 뒤 단계의 기준이다 | 인수조건 파일을 스킬에 넘겼다(5단계). 스킬은 인수조건에서 테스트 목록을 만들고, 한 항목씩 테스트, 구현, 기록으로 이었다 |

---

# 자주 막히는 곳

| 증상 | 원인과 해결 |
|---|---|
| `/test-first`가 메뉴에 없다 | `/reload-skills`를 실행하거나 Claude Code를 새로 시작한다. 폴더가 `.claude/skills/test-first/`이고 파일 이름이 `SKILL.md`인지 본다 |
| 스킬을 불렀는데 순서를 무시한다 | `SKILL.md`의 첫 줄이 `---`가 아니면 머리말이 본문으로 읽힌다. 첫 줄을 확인한다 |
| 구현 담당을 부르지 않고 메인 세션이 직접 구현했다 | `.claude/agents/implementer.md`의 `name`이 `implementer`인지 본다. 새 세션에서 다시 실행한다 |
| 훅 직접 실행에서 `exit=0`만 나온다 | `CLAUDE_PROJECT_DIR`이 작업 폴더가 아니다. 작업 폴더에서 명령을 그대로 실행한다 |
| 훅이 실행되지 않는다 | `.claude/settings.json`의 JSON이 틀렸거나 폴더를 신뢰하지 않았다. `node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8'))"`로 JSON을 확인한다 |

# 참고 자료

- Anthropic, Claude Code 문서, "Extend Claude with skills" (`SKILL.md`의 머리말 항목, `$ARGUMENTS`, `allowed-tools`). https://code.claude.com/docs/en/skills
- Anthropic, Claude Code 문서, "Create custom subagents" (`.claude/agents/` 파일 형식, 머리말 항목). https://code.claude.com/docs/en/sub-agents
- Anthropic, Claude Code 문서, "Hooks reference" (`PreToolUse` 입력, `agent_type`, 종료 코드 2). https://code.claude.com/docs/en/hooks
- Anthropic, Claude Code 문서, "Automate actions with hooks" (파일 보호 훅 예시). https://code.claude.com/docs/en/hooks-guide
- Anthropic, Claude Code 문서, "Configure permissions" (`Bash(명령 *)` 규칙의 일치 방식). https://code.claude.com/docs/en/permissions
- Anthropic, Claude Code 문서, "Best practices for Claude Code"의 "Put team procedures in skills", "Enforce the rules that can't have exceptions" 절. https://code.claude.com/docs/en/best-practices
- 이 모듈의 스킬 명세: [../skills/test-first.md](../skills/test-first.md)
