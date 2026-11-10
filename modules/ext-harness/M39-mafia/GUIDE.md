# 개념

**MAFIA Code-Review harness**(이하 mafia-codereview)는 vibemafiaclub이 만든 **Claude Code용 코드리뷰 자동화 파이프라인**입니다. Claude Code 플러그인 하나로 설치하며, 명령 하나(`/mafia-codereview:auto`)로 아래 과정을 순서대로 진행합니다.

**설계의도 정리 → 평가기준 수립 → PR 본문 작성 → 근거 기반 코드리뷰 → 리뷰 반영과 QA**

이 하네스의 핵심 생각은 **"리뷰는 기준과 의도에 근거해야 한다"** 입니다. AI 리뷰가 흔히 빠지는 두 가지 문제를 막도록 설계되어 있습니다.

| 흔한 AI 리뷰의 문제 | mafia-codereview의 해결 |
|---|---|
| **근거 없는 취향 리뷰** ("저라면 이렇게 하겠어요") | 팀의 **코딩 컨벤션과 ADR**에서 이번 작업에 맞는 항목만 뽑아 **평가기준 문서**를 만들고, 모든 리뷰 코멘트가 그 기준을 인용하게 함 |
| **의도를 모르는 리뷰** (일부러 그렇게 한 것을 "왜 이렇게 했나요?") | 리뷰 전에 **설계의도 문서**를 만들어, 의도적인 결정은 존중하고 **의도와 구현이 어긋난 곳만** 지적하게 함 |

> 이 가이드는 mafia-codereview **0.1.0** (2026-03-27 커밋 `e175e34`) 을 기준으로 작성했습니다. 파이프라인에 대한 저자의 설명 영상은 [YouTube](https://www.youtube.com/watch?v=CfLhrS0ww5w)에 있습니다.

## 파이프라인 6단계

```
/mafia-codereview:auto
  → [1] 상태 점검        현재 브랜치·기준 브랜치(main)·변경 파일 수 확인
  → [2] 설계의도 작성     (Fork)               → design-intent.md
  → [3] 평가기준 수립     (Fork + Sub-agent)   → code-quality-guide.md
  → [4] PR 본문 생성      (Fork)               → pr-body.md
  → [5] 코드리뷰 실행     (Sub-agent, 자동)     → review-comments.md
  → [6] 리뷰 반영 + QA    (Fork)               → review-comments.md 에 판정 추가, 코드 수정
```

[2]~[4]와 [6]은 초안을 보여 주며 **모호한 논의점**을 함께 묻고, 사람이 답하면 확정합니다. [5] 코드리뷰만 **사람 확인 없이 자동**으로 진행됩니다.

## 핵심 개념 6가지

### 1. Code Convention (`docs/code-convention.yaml`)
팀이 **항상** 지키는 코딩 규칙 목록입니다. 항목마다 `id`, `rule`(규칙), `stacks`(적용 대상 기술)를 적습니다. `stacks: [all]`은 모든 작업, `stacks: [node]`는 Node.js 코드에만 적용됩니다. 평가기준을 만들 때 이번 작업과 관련된 stacks의 항목만 골라 씁니다.

### 2. ADR (`docs/adr.yaml`)
**Architecture Decision Record**, 팀이 내린 **중요한 기술 결정과 그 이유**의 기록입니다. 항목마다 `context`(왜 이 결정이 필요했나), `decision`(무엇을 정했나), `consequence`(그 결과 지켜야 할 것)를 적습니다. 평가기준을 만들 때 **서브에이전트가 ADR 전체를 읽고 이번 작업과 관련된 항목만** 뽑아 "이 작업에 어떻게 적용되는지"를 설명합니다. 관련 없는 ADR은 빠집니다.

### 3. Design Intent (설계의도, `design-intent.md`)
**이번 작업이 무엇을 해결하고, 어떤 선택을 왜 했고, 무엇을 일부러 뺐는지**를 적은 문서입니다. **현재 대화에서 논의된 내용**으로 작성되므로, 구현할 때 나눈 설계 대화가 그대로 재료가 됩니다. 리뷰어는 이 문서에 적힌 의도적 결정에는 이의를 달지 않습니다.

### 4. Evaluation Criteria (평가기준, `code-quality-guide.md`)
Code Convention(공통 기준) + 이번 작업 관련 ADR(작업별 기준)을 합친 문서입니다. **리뷰의 유일한 근거**입니다.

### 5. 우선순위 `[p1]`~`[p4]` 와 side effect
리뷰 코멘트는 네 단계로 나뉩니다.

| 표시 | 뜻 | 리뷰 반영 단계의 기본 처리 |
|---|---|---|
| `[p1]` | 반드시 수정 (버그, 기준 위반, 의도-구현 불일치) | 기본 수용. 거부하려면 명확한 근거 필요 |
| `[p2]` | 강력 권장 (유지보수성·가독성에 의미 있는 영향) | 판단과 근거를 보여 주고 **사람이 확인** |
| `[p3]` | 권장 (지금도 동작에는 문제 없음) | 판단을 보여 주고 **사람 재량** |
| `[p4]` | 사소한 개선 (이름, 형식) | 일괄 수용 또는 무시 |

변경을 제안할 때는 **side effect(부수 효과)와 그럼에도 제안하는 이유**를 함께 적습니다. 리뷰는 무조건 따라야 하는 명령이 아니라 **판단 재료**라는 생각입니다.

### 6. Fork와 Sub-agent
- **Fork(worktree)**: 현재 저장소의 **별도 작업 폴더**(git worktree)를 만들어 그 안에서 단계를 실행합니다. [2]~[4]는 **문서만 만들고 소스코드는 건드리지 않습니다.**
- **Sub-agent**: 메인 대화와 분리된 별도 에이전트. ADR 분석([3])과 코드리뷰([5])를 맡깁니다. 리뷰를 메인 대화가 아닌 별도 에이전트가 하므로, **구현한 대화의 생각에 끌려가지 않는 리뷰**가 됩니다.

## 추가로 알아두면 좋은 개념

| 개념 | 설명 |
|---|---|
| **`.review-artifacts/{브랜치명}/`** | 모든 산출물이 저장되는 폴더. 브랜치마다 따로 생깁니다. 예) `.review-artifacts/feature/recurring-todos/` |
| **단계별 명령** | `auto` 대신 단계를 하나씩 실행할 수도 있습니다: `write-intent`, `gen-criteria`, `create-pr-body`, `review`, `reflect-review` |
| **`update-docs`** | 작업에서 새로 정한 규칙·결정을 `code-convention.yaml`과 `adr.yaml`에 반영하는 명령. 두 문서의 **충돌·연쇄 수정·폐기 대상**을 찾아 MUST / RECOMMENDED로 제안합니다. |
| **base branch** | 비교 기준 브랜치. 따로 말하지 않으면 `main`입니다. 변경분은 `git diff main...HEAD`로 봅니다. |
| **ACCEPT / REJECT 판정** | 리뷰 반영 단계에서 코멘트마다 수용·거부와 그 근거를 `review-comments.md`에 덧붙입니다. |

## 이 실습에서 할 일

> 이 가이드는 mafia-codereview를 처음 써보는 사람을 위한 **가장 기본적인 흐름**만 다룹니다.
> **설치 → 리뷰 기준 문서 준비 → 기능 구현(같은 대화) → `/mafia-codereview:auto` 6단계 → 기준 문서 업데이트**
> 미리 준비된 할 일 관리 앱(`todo-app` 폴더)을 복사해서, **반복 할 일**("매주 월요일 분리수거") 기능을 구현한 뒤 이 하네스로 리뷰합니다.

```
todo-app 복사 (docs/code-convention.yaml, docs/adr.yaml 포함)
   │
   ▼
기능 브랜치 → Claude Code에서 설계 논의 + 구현 → 커밋
   │                    (같은 대화를 유지)
   ▼
/mafia-codereview:auto
   [1] 상태 점검 → [2] 설계의도 → [3] 평가기준 → [4] PR 본문
   → [5] 자동 코드리뷰 → [6] 리뷰 반영 + QA
   │
   ▼
/mafia-codereview:update-docs   이번 작업에서 배운 규칙을 기준 문서에 반영
```

**출처·재사용 범위:** 원출처는 [vibemafiaclub/mafia-codereview-harness](https://github.com/vibemafiaclub/mafia-codereview-harness)입니다. 저장소 README와 `plugin.json`에는 라이선스가 **MIT**로 표기되어 있으나, 기준 커밋(`e175e34`) 시점에 별도의 LICENSE 파일은 없습니다. 이 가이드는 원문을 그대로 옮기지 않고 README와 각 명령 파일(`plugin/commands/*.md`)의 내용을 바탕으로 새로 설명한 것입니다. 원문을 복사·변형해 배포하는 경우에는 해당 버전·원 경로를 기록하고 저작권 고지를 보존하세요. 연습용 저장소 `todo-app`(이 모듈의 `todo-app` 폴더)과 그 안의 `docs/code-convention.yaml`·`docs/adr.yaml`(실습용 가상 기록), 예시 프롬프트·예시 답변은 이 가이드에서 새로 만든 것입니다.

| 이 가이드 | 공식 문서 |
|---|---|
| 0 단계: 준비하기 | (가이드에서 추가) |
| 1 단계: 플러그인 설치 | README › Quick Start 1 |
| 2 단계: 연습용 저장소 준비하기 | (가이드에서 추가한 실습 준비, `todo-app` 폴더 제공) |
| 3 단계: 리뷰 기준 문서 살펴보기 | README › Quick Start 2 |
| 4 단계: 기능 구현하기 | `auto.md` › 사전 조건 ("구현이 완료된 feature branch") |
| 5 단계: 파이프라인 시작과 상태 점검 | README › Quick Start 3, `auto.md` › Step 1 |
| 6 단계: 설계의도 작성 | `auto.md` › Step 2, `write-intent.md` |
| 7 단계: 평가기준 수립 | `auto.md` › Step 3, `gen-criteria.md` |
| 8 단계: PR 본문 생성 | `auto.md` › Step 4, `create-pr-body.md` |
| 9 단계: 자동 코드리뷰 | `auto.md` › Step 5, `review.md` |
| 10 단계: 리뷰 반영과 QA | `auto.md` › Step 6, `reflect-review.md` |
| 11 단계: 기준 문서 업데이트 | `update-docs.md` |

---

# 0 단계: 준비하기

- macOS / Windows / Linux 컴퓨터
- **Node.js 20 이상** ([nodejs.org](https://nodejs.org)) — 연습용 앱 실행용
- **git** — 이 하네스는 브랜치와 `git diff`로 동작하므로 필수입니다.
- **Claude Code** (설치와 로그인이 끝난 상태)

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
> 이 하네스는 **git과 함께 쓸 때** 효과가 가장 큽니다(공식 README). 모든 단계를 git 저장소의 기능 브랜치에서 진행합니다.

## 산출물
- 없음 (환경 확인만 합니다)

## 체크리스트
- [ ] `node -v`가 v20 이상인지 확인한다.
- [ ] `git --version`과 `claude --version`이 버전 번호를 출력하는지 확인한다.

# 1 단계: 플러그인 설치

1. 터미널에서 마켓플레이스를 추가합니다.

   ```bash
   claude plugin marketplace add vibemafiaclub/mafia-codereview-harness
   ```

2. 플러그인을 설치합니다.

   ```bash
   claude plugin install mafia-codereview@mafia-codereview-harness
   ```

3. 설치를 확인합니다.

   ```bash
   claude plugin list
   ```

   목록에 `mafia-codereview`가 보이면 성공입니다.

> 공식 README처럼 Claude Code 안에서 설치해도 됩니다. `claude`를 실행한 뒤 `/plugin marketplace add vibemafiaclub/mafia-codereview-harness`, 이어서 `/plugin install mafia-codereview`를 입력합니다.

## 규칙
> Claude Code가 이미 켜져 있었다면 **완전히 종료한 뒤 다시 실행**해야 새 명령이 보입니다.

> 플러그인 명령은 항상 `mafia-codereview:` 접두어가 붙습니다. 예) `/mafia-codereview:auto`

> 제거는 `claude plugin uninstall mafia-codereview@mafia-codereview-harness` 입니다.

## 산출물
- Claude Code에 설치된 `mafia-codereview` 플러그인 (명령 7개)

## 체크리스트
- [ ] `claude plugin list`에 `mafia-codereview`가 표시되는지 확인한다.
- [ ] Claude Code 재실행 후 `/mafia-codereview:`를 쳤을 때 `auto`, `review` 등 7개 명령이 자동완성에 뜨는지 확인한다.

# 2 단계: 연습용 저장소 준비하기

할 일을 추가·완료·조회하는 작은 CLI `todo-app`을 **이 모듈 폴더에 미리 만들어 두었습니다.** 이 하네스가 필요로 하는 **리뷰 기준 문서 2개**(`docs/code-convention.yaml`, `docs/adr.yaml`)도 todo-app에 맞게 미리 작성해 넣었습니다.

이 앱에는 일부러 비워 둔 **불편함**이 하나 있습니다. "매주 월요일 분리수거"처럼 **반복되는 일**은 완료할 때마다 다음 주 것을 손으로 다시 추가해야 합니다.

## 미리 만들어 둔 파일

```
M39-mafia/
└── todo-app/
    ├── package.json            npm test 로 테스트를 실행하는 설정 (의존성 없음)
    ├── .gitignore              todos.json(실행 데이터)과 .review-artifacts/(리뷰 산출물)를 git 에서 제외
    ├── docs/
    │   ├── code-convention.yaml   팀 코딩 컨벤션 7개 항목 (3단계에서 설명)
    │   └── adr.yaml               기술 결정 기록 3개 (3단계에서 설명)
    ├── src/
    │   ├── todo.js             할 일 추가(addTodo)·완료(completeTodo)·목록 문자열(formatTodos)
    │   ├── store.js            todos.json 파일 읽기·쓰기
    │   └── cli.js              명령어 처리: add <제목> [마감일] / done <번호> / list
    └── test/
        └── todo.test.js        todo.js 의 동작을 확인하는 테스트 5개
```

## 따라 하기

1. `todo-app` 폴더를 **강의 자료 저장소 밖**의 작업할 위치로 복사합니다. 터미널을 `M39-mafia` 폴더에서 열고 실행하세요. (파일 탐색기로 복사해도 됩니다.)

   macOS / Linux / Git Bash:
   ```bash
   cp -r todo-app ~/todo-app
   ```

   Windows PowerShell:
   ```powershell
   Copy-Item -Recurse todo-app $HOME\todo-app
   ```

2. 복사한 폴더로 이동해서 git 저장소로 초기화합니다. 이 하네스는 기준 브랜치를 `main`으로 보므로 이름을 맞춥니다.

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

4. 확인용 데이터 파일을 지우고 첫 커밋을 만듭니다.

   ```bash
   node -e "require('fs').rmSync('todos.json', { force: true })"
   ```

   ```bash
   git add .
   git commit -m "todo-app 초기 버전"
   ```

## 규칙
> **반드시 강의 자료 저장소 밖으로 복사**해서 실습합니다. 원본 폴더에서 바로 하면 강의 자료 저장소 안에 또 다른 git 저장소가 생기고, 실습 파일과 커밋이 강의 자료와 섞입니다.

> 이후 모든 단계는 **복사한 `todo-app` 폴더 안에서** 진행합니다.

## 산출물
- 작업 위치의 `todo-app/` 저장소와 `main` 브랜치의 첫 커밋 (`docs/` 포함)

## 체크리스트
- [ ] `npm test`에서 테스트 5개가 모두 통과(pass 5)하는지 확인한다.
- [ ] `docs/code-convention.yaml`과 `docs/adr.yaml`이 커밋에 포함됐는지 `git show --stat`으로 확인한다.
- [ ] `git branch --show-current`가 `main`인지 확인한다.

# 3 단계: 리뷰 기준 문서 살펴보기

공식 README의 2번째 단계는 "`code-convention.yaml`과 `adr.yaml`을 복사한 뒤 상황에 맞게 수정"입니다. 플러그인에 들어 있는 원본은 TypeScript·Next.js·NestJS 팀용 예시라서, 이 실습에서는 **todo-app에 맞게 고친 버전**을 미리 넣어 두었습니다. 리뷰 품질은 이 두 문서의 품질에 달려 있으므로, 무엇이 들어 있는지 먼저 읽어 봅니다.

1. 편집기로 `docs/code-convention.yaml`을 엽니다. 7개 규칙이 3개 묶음으로 들어 있습니다.

   | id | 규칙 요약 | stacks |
   |---|---|---|
   | GEN-001 | 함수는 단일 책임, 50줄 넘으면 분리 검토 | all |
   | GEN-002 | 매직 넘버 금지, 이름 있는 상수로 | all |
   | GEN-003 | 잘못된 입력은 발생 지점에서 Error, 메시지·종료 코드 1은 `src/cli.js`에서만 | all |
   | NODE-001 | ES 모듈, 외부 npm 의존성 추가 금지 | node |
   | NODE-002 | `node:test` + `node:assert/strict`, 공개 함수의 동작을 검증 | node |
   | TODO-001 | `src/todo.js` 함수는 순수 함수 (입력 변경 금지, 새 배열 반환) | node |
   | TODO-002 | 파일 읽기·쓰기는 `src/store.js`에서만 | node |

2. `docs/adr.yaml`을 엽니다. 실습을 위해 만든 **가상의 결정 기록** 3개가 있습니다.

   | id | 제목 | stacks | 이번 반복 할 일 작업과의 관계 |
   |---|---|---|---|
   | ADR-001 | 할 일 저장소는 JSON 파일 하나 | node | **관련 있음** — 할 일에 필드를 추가하면 예전 파일에는 그 필드가 없음 |
   | ADR-002 | 날짜는 시간대 없는 `"YYYY-MM-DD"` 문자열, 계산은 UTC 기준 | node | **매우 관련 있음** — 다음 마감일 계산 |
   | ADR-003 | 웹 화면은 목록을 브라우저에 캐시하지 않음 | web | **관련 없음** — CLI 작업이므로 7단계에서 빠져야 정상 |

   ADR-003은 일부러 넣은 **관련 없는 항목**입니다. 7단계에서 서브에이전트가 이것을 제외하는지 확인해 봅니다.

3. 좋은 ADR의 `context`가 어떻게 생겼는지 ADR-002를 읽어 보세요. "언제, 무슨 문제가, 누가 어디서 고생했는지, 왜 찾기 어려웠는지"가 구체적으로 적혀 있습니다. `update-docs` 명령은 이런 수준의 context를 요구합니다.

## 규칙
> 내 프로젝트에 적용할 때는 플러그인의 원본 예시를 그대로 쓰지 말고 **팀이 실제로 지키는 규칙과 실제로 내린 결정**으로 바꾸세요. 기준이 엉뚱하면 리뷰도 엉뚱해집니다.

> 규칙은 "명확하고 실행 가능하게" 씁니다. "깔끔하게 짠다" 같은 규칙은 리뷰 근거가 될 수 없습니다.

## 산출물
- 없음 (기준 문서 읽기)

## 체크리스트
- [ ] code-convention의 `stacks`가 `all`과 `node`로 나뉘는 이유를 이해했는지 확인한다.
- [ ] ADR-002의 decision(날짜 계산은 UTC 기준)을 읽었는지 확인한다.
- [ ] ADR-003이 이번 작업과 관계없다는 것을 확인했다.

# 4 단계: 기능 구현하기

mafia-codereview는 **구현이 끝난 기능 브랜치**를 리뷰하는 하네스입니다. 먼저 Claude Code로 반복 할 일 기능을 만듭니다. 이때 나눈 **설계 대화가 6단계 설계의도 문서의 재료**가 되므로, 설계를 대화로 정한 뒤 구현하고, **이 대화 창을 끄지 않고 5단계까지 이어 갑니다.**

1. 기능 브랜치를 만들고 Claude Code를 실행합니다.

   ```bash
   git switch -c feature/recurring-todos
   ```

   ```bash
   claude
   ```

2. 먼저 설계를 정합니다. 코드는 아직 쓰지 말라고 합니다.

   ```text
   반복 할 일 기능을 추가하려고 해. 코드는 아직 쓰지 말고 설계부터 같이 정하자.
   지금은 "매주 월요일 분리수거"를 done 하면 다음 주 것을 손으로 다시 add 해야 해.
   내가 정한 것:
   - 주기는 매일(day)·매주(week)만. 매월은 이번엔 안 함
   - 반복 할 일을 done 하는 순간 같은 제목의 다음 회차를 새 할 일로 추가
   - 다음 마감일은 완료한 날이 아니라 원래 마감일 + 주기 (늦게 끝내도 요일이 밀리지 않게)
   - 반복 할 일은 마감일 필수. 명령은 add <제목> <마감일> --every day|week
   - 목록에는 "[ ] 2. 분리수거 (마감 2026-11-23, 매주)" 처럼 주기를 표시
   - 반복 중단·삭제는 이번엔 안 함
   docs/code-convention.yaml 과 docs/adr.yaml 을 읽고, 데이터 모양과 날짜 계산 방법을 제안해줘.
   ```

3. Claude가 데이터 모양(예: 할 일에 `repeat: "week"` 필드 추가)과 날짜 계산 방법(ADR-002에 따라 UTC 기준)을 제안합니다. 마음에 들면 구현을 요청합니다.

   ```text
   좋아, 그대로 구현해줘. 테스트는 test/todo.test.js 에 추가하고,
   2026-12-28 매주 반복을 완료하면 2027-01-04 회차가 생기는 테스트도 넣어줘.
   ```

4. 구현이 끝나면 확인하고 **커밋**합니다.

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
   !git add . && git commit -m "반복 할 일 기능 구현"
   ```

## 규칙
> **같은 대화를 유지하세요.** `/clear`나 Claude Code 재시작을 하면 6단계에서 설계의도를 쓸 재료(왜 이렇게 정했는지)가 사라집니다. 설계의도 문서는 "현재 대화에서 논의된 내용"으로 쓰입니다.

> **반드시 커밋한 뒤** 5단계로 넘어갑니다. 파이프라인은 `git diff main...HEAD`로 변경을 보고, 별도 작업 폴더(worktree)는 커밋된 내용만 볼 수 있습니다.

> 이 단계에서는 일부러 리뷰 받을 거리를 남겨 둬도 괜찮습니다. 예를 들어 "7"이라는 숫자를 그대로 쓰면 GEN-002(매직 넘버) 지적을 받을 수 있습니다.

## 산출물
- 반복 할 일이 구현된 `src/todo.js`, `src/cli.js`와 추가된 테스트
- `feature/recurring-todos` 브랜치의 구현 커밋
- 대화 창 안의 설계 논의 (6단계의 재료)

## 체크리스트
- [ ] `npm test`가 모두 통과하는지 확인한다.
- [ ] `done 1` 뒤에 마감일이 2026-11-23인 2번 할 일이 생기는지 확인한다.
- [ ] `git status`가 깨끗하고(커밋 완료), 현재 브랜치가 `feature/recurring-todos`인지 확인한다.

# 5 단계: 파이프라인 시작과 상태 점검 — `/mafia-codereview:auto`

4단계와 **같은 대화 창**에서 파이프라인을 시작합니다.

1. 입력합니다.

   ```text
   /mafia-codereview:auto
   ```

2. [1] 상태 점검: 에이전트가 아래를 확인하고 맞는지 묻습니다. (예시)

   ```text
   - branch: feature/recurring-todos
   - base branch: main
   - 변경 파일: 3개 (src/cli.js, src/todo.js, test/todo.test.js)
   계속 진행할까요?
   ```

   맞으면 `yes`라고 답합니다.

3. 산출물 폴더 `.review-artifacts/feature/recurring-todos/`가 만들어집니다.

## 규칙
> 기준 브랜치가 `main`이 아니라면 이 단계에서 알려 줍니다. 예) "base branch는 develop이야."

> 단계마다 Claude가 명령 실행·폴더 생성·worktree 생성 권한을 물을 수 있습니다. 내용을 확인하고 허용합니다.

## 산출물
- `.review-artifacts/feature/recurring-todos/` 폴더

## 체크리스트
- [ ] 에이전트가 보여 준 브랜치·기준 브랜치·변경 파일 수가 맞는지 확인한다.

# 6 단계: 설계의도 작성 — design-intent.md

[2] 단계입니다. 별도 작업 폴더(fork)에서 **설계의도 문서 초안**을 만들고, 모호한 점을 함께 묻습니다.

1. 초안과 **논의점**이 나옵니다. (예시)

   ```text
   [논의점]
   1. 마감일 없는 기존 할 일을 반복으로 바꾸는 기능은 의도적으로 제외한 건가요?
   2. 반복 할 일을 두 번 done 하면 다음 회차가 두 번 생기나요, 한 번만 생기나요?
   3. 기존 todos.json 에 repeat 필드가 없는 할 일은 일반 할 일로 보는 게 의도인가요?
   ```

2. 내 의도대로 답합니다.

   ```text
   1은 의도적으로 제외한 거야. 2는 이미 완료된 할 일을 다시 done 하면 회차를 또 만들지 않아야 해.
   3은 맞아, repeat 이 없으면 일반 할 일이야.
   ```

3. 답이 반영된 `design-intent.md`가 확정·저장됩니다. 문서는 아래 구조입니다.

   | 섹션 | 내용 |
   |---|---|
   | 작업 개요 | 반복되는 일을 매번 다시 추가해야 하는 문제 해결 |
   | 핵심 설계 결정 | 결정마다 "선택지: A vs B / 선택 / 이유" (예: 다음 마감일 기준 = 원래 마감일 vs 완료일) |
   | 의도적으로 제외한 것 | 매월 반복, 반복 중단·삭제 등과 그 이유 |
   | 주의사항 | 리뷰할 때 특히 볼 점 (예: 날짜 계산 시간대) |

## 규칙
> **논의점은 대충 넘기지 마세요.** 여기서 답한 내용이 리뷰의 기준이 됩니다. 2번처럼 "아직 생각 못 한 경우"가 나오면 지금 정하세요. 9단계에서 리뷰어는 이 의도와 실제 코드가 다르면 `[p1]`로 지적합니다.

> 이 단계는 **문서만** 만들고 소스코드는 고치지 않습니다.

## 산출물
- `.review-artifacts/feature/recurring-todos/design-intent.md`

## 체크리스트
- [ ] 논의점에 모두 답했는지 확인한다.
- [ ] `design-intent.md`에 "의도적으로 제외한 것" 섹션이 있는지 확인한다.

# 7 단계: 평가기준 수립 — code-quality-guide.md

[3] 단계입니다. 서브에이전트가 `docs/adr.yaml`을 분석해 관련 항목만 뽑고, `docs/code-convention.yaml`에서 이번 작업의 stacks에 맞는 규칙을 골라 **평가기준 초안**을 만듭니다.

1. 초안과 **적용 범위가 모호한 논의점**이 나옵니다. (예시)

   ```text
   [이 작업에 적용되는 ADR]
   - ADR-001: 기존 todos.json 의 할 일에는 repeat 필드가 없으므로 읽을 때 기본값 처리 필요
   - ADR-002: 다음 마감일 계산은 UTC 기준으로 하고 즉시 "YYYY-MM-DD" 로 되돌려야 함
   (ADR-003 은 web 스택이라 제외)

   [논의점]
   1. GEN-001(50줄) 을 테스트 파일에도 적용할까요?
   2. 주기 일수(1, 7)는 GEN-002 매직 넘버에 해당한다고 볼까요?
   ```

2. 답합니다.

   ```text
   1은 테스트 파일에는 적용하지 마. 2는 해당돼, 상수로 빼야 해.
   ```

3. `code-quality-guide.md`가 확정·저장됩니다.

## 규칙
> **ADR-003이 빠졌는지 확인하세요.** 관련 없는 ADR까지 기준에 들어가면 엉뚱한 리뷰가 나옵니다. 들어가 있다면 "ADR-003은 web 전용이라 빼줘"라고 답합니다.

> 이 문서가 9단계 리뷰의 **유일한 근거**입니다. 여기 없는 기준으로는 리뷰 코멘트가 나오지 않습니다.

## 산출물
- `.review-artifacts/feature/recurring-todos/code-quality-guide.md` — "공통 기준(Code Convention)" + "이 작업에 적용되는 ADR(적용 방법 포함)"

## 체크리스트
- [ ] ADR-001과 ADR-002가 적용 방법과 함께 들어 있는지 확인한다.
- [ ] ADR-003이 제외됐는지 확인한다.

# 8 단계: PR 본문 생성 — pr-body.md

[4] 단계입니다. `git diff main...HEAD`를 바탕으로 PR 본문 초안을 만듭니다.

1. 초안과 **명확히 해야 할 논의점**이 나옵니다. (예시)

   ```text
   [논의점]
   1. 기존 할 일 출력 형식이 바뀌지 않았으니 Breaking Changes 는 "없음"으로 할까요?
   2. 관련 이슈 번호가 있나요?
   ```

2. 답합니다.

   ```text
   1은 없음으로. 2는 이슈 없어, Related 에는 ADR-002 만 적어줘.
   ```

3. `pr-body.md`가 확정·저장됩니다. 구조는 `Summary / Changes / Breaking Changes / Test Plan / Related`입니다.

## 규칙
> PR 본문은 9단계 리뷰어가 **작성자의 의도를 이해하는 재료**로도 쓰입니다. Test Plan에 "2026-12-28 → 2027-01-04" 같은 구체적인 확인 항목이 들어 있는지 보세요.

## 산출물
- `.review-artifacts/feature/recurring-todos/pr-body.md`

## 체크리스트
- [ ] Breaking Changes와 Test Plan 섹션이 채워졌는지 확인한다.

# 9 단계: 자동 코드리뷰 — review-comments.md

[5] 단계입니다. 서브에이전트가 **평가기준 + 설계의도 + PR 본문 + diff**를 받아 리뷰합니다. **사람에게 묻지 않고 자동으로** 진행됩니다.

1. 기다리면 `review-comments.md`가 저장됩니다. 편집기로 열어 봅니다. (예시)

   ```markdown
   # Code Review

   ## Summary
   설계의도대로 원래 마감일 기준 다음 회차를 만들고 있으나, 이미 완료된 반복 할 일을 다시 done 하면
   회차가 중복 생성됩니다. 주기 일수가 숫자 그대로 쓰였습니다.

   ## Comments

   ### [p1] src/todo.js:24
   - 근거: design-intent.md 핵심 설계 결정 / 논의점 2 (이미 완료된 할 일은 회차를 다시 만들지 않음)
   - 내용: completeTodo 가 done 여부를 확인하지 않고 다음 회차를 추가함
   - 제안: 이미 done 인 할 일이면 배열을 그대로 반환
   - side effect: 완료된 할 일을 다시 done 해도 오류가 나지 않고 조용히 넘어감
   - 제안 이유: 기존 일반 할 일의 동작(다시 done 해도 오류 없음)과 일관됨

   ### [p2] src/todo.js:5
   - 근거: GEN-002 매직 넘버 금지
   - 내용: 주기 일수 7 이 그대로 사용됨
   - 제안: const REPEAT_DAYS = { day: 1, week: 7 } 로 선언
   - side effect: 없음
   - 제안 이유: 매월 주기 추가 시 한 곳만 바꾸면 됨
   ```

2. 코멘트마다 **근거**가 code-quality-guide.md의 기준이나 design-intent.md를 가리키는지 확인합니다.

## 규칙
> 근거가 없는 코멘트(취향 리뷰)가 보이면 하네스 규칙 위반입니다. 10단계에서 거부(REJECT)할 수 있습니다.

> 리뷰어는 설계의도에 적힌 **의도적 결정에는 "왜 이렇게 했나요?"라고 묻지 않습니다.** 예를 들어 "매월 반복이 없다"는 지적이 나오면 안 됩니다.

## 산출물
- `.review-artifacts/feature/recurring-todos/review-comments.md` — Summary와 `[p1]`~`[p4]` 코멘트

## 체크리스트
- [ ] 모든 `[p1]`~`[p3]` 코멘트에 "근거"가 있는지 확인한다.
- [ ] 변경 제안 코멘트에 "side effect"가 적혀 있는지 확인한다.
- [ ] 의도적으로 제외한 기능에 대한 지적이 없는지 확인한다.

# 10 단계: 리뷰 반영과 QA

[6] 단계입니다. 코멘트마다 수용·거부를 판단해 보여 주고, 사람이 확인하면 코드를 고친 뒤 **테스트로 QA**합니다.

1. 판단 목록이 나옵니다. (예시)

   ```text
   [p1] src/todo.js:24  → ACCEPT (기본 수용)
   [p2] src/todo.js:5   → ACCEPT 제안 — 매월 주기 확장 시 이점. 확인해 주세요.
   [p3] src/cli.js:12   → REJECT 제안 — 인자 파싱 라이브러리 도입은 NODE-001(의존성 금지) 위반
   [p4] test/todo.test.js:40 → 일괄 수용
   ```

2. 확인합니다. 바꾸고 싶은 판단이 있으면 함께 말합니다.

   ```text
   좋아, 제안대로 진행해줘.
   ```

3. 코드가 수정되고 QA가 돌아갑니다. 테스트가 실패하면 **수정 → QA → 재확인**을 반복합니다.

4. 끝나면 수정 내역, QA 결과, 커밋을 요약해 보고합니다. `review-comments.md`의 각 코멘트 아래에 판정이 붙습니다.

   ```markdown
   - **판정: ACCEPT** — 수정 완료. 이미 done 인 할 일은 그대로 반환하도록 변경.
   ```

5. 마지막으로 직접 확인합니다. 파이프라인이 별도 작업 폴더(worktree)에서 고쳤다면 변경이 지금 브랜치에 들어왔는지도 확인합니다.

   ```text
   !git log --oneline main..HEAD
   ```

   ```text
   !npm test
   ```

   변경이 보이지 않으면 Claude에게 요청합니다.

   ```text
   리뷰 반영 커밋이 지금 브랜치(feature/recurring-todos)에 없어. 워크트리의 변경을 이 브랜치로 가져와줘.
   ```

## 규칙
> `[p1]`을 거부하려면 **명확한 근거**가 필요합니다. "귀찮아서"는 근거가 아닙니다. `design-intent.md`나 기준 문서를 근거로 대세요.

> 리뷰 반영 단계는 구현할 때의 맥락이 살아 있어야 잘 동작합니다. 그래서 4단계부터 같은 대화를 유지한 것입니다.

## 산출물
- 리뷰가 반영된 코드와 커밋
- 판정(ACCEPT / REJECT + 근거)이 추가된 `review-comments.md`
- QA(테스트) 결과 보고

## 체크리스트
- [ ] `review-comments.md`의 모든 코멘트에 판정이 붙었는지 확인한다.
- [ ] REJECT 판정에 근거가 적혀 있는지 확인한다.
- [ ] `npm test`가 통과하고, 리뷰 반영 커밋이 `feature/recurring-todos`에 있는지 확인한다.

# 11 단계: 기준 문서 업데이트 — `/mafia-codereview:update-docs`

이번 작업에서 새로 정한 것(예: "반복 주기는 이름 있는 표로 관리", "완료된 반복 할 일은 회차를 다시 만들지 않음")을 **다음 리뷰의 기준**으로 남깁니다. 이렇게 하면 기준 문서가 작업할수록 좋아집니다.

1. 같은 대화에서 실행합니다.

   ```text
   /mafia-codereview:update-docs
   ```

2. 에이전트가 두 문서를 모두 읽고 **변경 제안 목록**을 MUST / RECOMMENDED로 보여 줍니다. (예시)

   ```text
   MUST
   - ADR-004 추가: 반복 할 일의 다음 회차는 원래 마감일 + 주기로 만든다
     (context: 완료일 기준으로 하면 "매주 월요일" 할 일이 늦게 끝낼수록 요일이 밀리는 문제)
   RECOMMENDED
   - TODO-003 추가: 할 일 객체에 필드를 추가하면 필드가 없는 기존 데이터의 기본 동작을 테스트한다
   ```

3. 원하는 것만 골라 반영하게 합니다. context가 부족하다고 판단되면 에이전트가 더 구체적인 설명을 요청합니다.

   ```text
   ADR-004 와 TODO-003 둘 다 추가해줘.
   ```

4. 바뀐 문서를 커밋합니다.

   ```text
   !git add docs && git commit -m "반복 할 일 작업의 결정을 기준 문서에 반영"
   ```

5. (선택) GitHub 저장소가 있다면 확정된 PR 본문으로 PR을 열 수 있습니다.

   ```bash
   gh pr create --base main --title "feat: 반복 할 일" --body-file .review-artifacts/feature/recurring-todos/pr-body.md
   ```

## 규칙
> 특정 문서만 고치려면 인자를 줍니다. `/mafia-codereview:update-docs convention` 또는 `/mafia-codereview:update-docs adr`

> 새 규칙이 기존 규칙과 **충돌**하면(예: 새 ADR이 기존 convention과 반대) 에이전트가 함께 고칠 항목을 제안합니다. 둘 다 남겨 두면 다음 리뷰가 서로 모순된 기준을 받게 됩니다.

## 산출물
- 갱신된 `docs/adr.yaml`, `docs/code-convention.yaml`과 커밋
- (선택) GitHub PR

## 체크리스트
- [ ] 새 ADR 항목에 `context`가 구체적으로(무슨 문제가 있었는지) 적혔는지 확인한다.
- [ ] 새 항목의 `stacks`가 알맞게(예: `[node]`) 지정됐는지 확인한다.

---

# 더 해보기

| 상황 | 방법 |
|---|---|
| 단계를 하나씩 따로 실행해 본다 | `/mafia-codereview:write-intent` → `/mafia-codereview:gen-criteria` → `/mafia-codereview:create-pr-body` → `/mafia-codereview:review` → `/mafia-codereview:reflect-review` |
| 다음 기능도 같은 흐름으로 리뷰한다 | 새 브랜치(`feature/stop-recurring`)에서 "반복 중단" 기능을 구현하고 `auto` 실행. 11단계에서 추가한 ADR-004가 평가기준에 들어오는지 확인 |
| 기준 문서의 효과를 비교한다 | `docs/adr.yaml`에서 ADR-002를 지운 브랜치에서 같은 리뷰를 돌려, 날짜 계산 관련 코멘트가 사라지는지 비교 |
| 내 팀 프로젝트에 적용한다 | 플러그인 원본의 `docs/*.yaml` 예시를 참고해 팀의 실제 규칙·결정으로 두 문서를 작성 |

# 문제 해결

| 증상 | 해결 |
|---|---|
| `/mafia-codereview:auto`가 자동완성에 안 뜬다 | Claude Code를 완전히 종료 후 재실행. 그래도 없으면 `claude plugin list`로 설치 확인 |
| 변경 파일이 0개로 나온다 | 구현을 커밋하지 않았거나 `main`에 있음. 기능 브랜치에서 커밋한 뒤 다시 실행 |
| 설계의도 초안이 빈약하다 | 구현 대화와 다른 창에서 실행함. 4단계 대화 창에서 다시 실행하거나, 설계 결정을 대화로 설명한 뒤 `/mafia-codereview:write-intent` |
| 평가기준에 관련 없는 ADR(ADR-003)이 들어갔다 | 논의점 답변에서 "ADR-003은 web 전용이니 제외해줘"라고 요청 |
| 근거 없는 리뷰 코멘트가 있다 | 10단계에서 REJECT하고 근거로 "평가기준에 없는 항목"이라고 적기 |
| 리뷰 반영 커밋이 현재 브랜치에 없다 | worktree에서 작업된 것. 10단계 5번의 요청문으로 가져오기 |
| `docs/code-convention.yaml`이 없다는 오류 | 2단계 복사가 덜 됨. `docs/` 폴더가 복사·커밋됐는지 확인 |
