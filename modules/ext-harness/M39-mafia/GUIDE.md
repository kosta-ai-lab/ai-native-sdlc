# 이 실습에서 할 일

> 파이프라인 6단계·코드 컨벤션·ADR·설계의도·평가기준 같은 개념 설명은 [README.md](README.md)를 먼저 읽어 보세요. 이 가이드는 mafia-codereview **0.1.0**을 기준으로 합니다.

> 이 가이드는 mafia-codereview를 처음 써보는 사람을 위한 **가장 기본적인 흐름**만 다룹니다.
> **설치 → 리뷰 기준 문서 준비 → 기능 구현(같은 대화) → 리뷰 파이프라인 6단계 → 기준 문서 업데이트**
> 미리 준비된 할 일 관리 앱(`todo-app` 폴더)을 복사해서, **반복 할 일**("매주 월요일 분리수거") 기능을 구현한 뒤 이 하네스로 리뷰합니다.

## 두 가지 실행 모드

리뷰 파이프라인(5~10단계)은 두 가지 방법으로 실행할 수 있습니다. 결과물(파일 4개)은 같습니다.

| | 자동 모드 | 직접 명령 모드 |
|---|---|---|
| 실행 | `/mafia-codereview:auto` **한 번** | 단계마다 명령을 **하나씩** 입력 |
| 진행 | [1]→[6]을 이어서 진행. 단계마다 초안·논의점을 보여 주고 답을 받으면 다음으로 | 내가 명령을 입력할 때만 다음 단계로 |
| 장점 | 빠르고 편함 | 단계마다 무엇이 만들어지는지 눈으로 확인. 한 단계만 다시 실행하기 쉬움 |
| 이럴 때 | 흐름에 익숙해진 뒤, 팀 프로젝트에서 반복 사용 | **처음 실습할 때(권장)**, 자동 모드에서 파일이 안 생겼을 때, 특정 단계만 다시 할 때 |

각 단계는 아래 명령에 대응합니다. `auto`는 이 명령들을 순서대로 대신 실행할 뿐이고, 실제로 문서를 만드는 것은 각 명령입니다.

| 파이프라인 단계 | 직접 명령 | 만들어지는 것 | GUIDE |
|---|---|---|---|
| [1] 상태 점검 | (전용 명령 없음 — git 명령으로 확인) | `.review-artifacts/feature/recurring-todos/` 폴더 | 5단계 |
| [2] 설계의도 작성 | `/mafia-codereview:write-intent` | `design-intent.md` | 6단계 |
| [3] 평가기준 수립 | `/mafia-codereview:gen-criteria` | `code-quality-guide.md` | 7단계 |
| [4] PR 본문 생성 | `/mafia-codereview:create-pr-body` | `pr-body.md` | 8단계 |
| [5] 코드리뷰 실행 | `/mafia-codereview:review` | `review-comments.md` | 9단계 |
| [6] 리뷰 반영 + QA | `/mafia-codereview:reflect-review` | `review-comments.md`에 판정 추가, 코드 수정·커밋 | 10단계 |
| (파이프라인 밖) 기준 문서 갱신 | `/mafia-codereview:update-docs` | `docs/code-convention.yaml`, `docs/adr.yaml` 수정 | 11단계 |

두 모드는 섞어 쓸 수 있습니다. 예를 들어 [2]~[4]는 직접 명령으로 만들고, 그다음은 `auto`에 "[5] 코드리뷰부터 진행해줘"라고 맡겨도 됩니다. 5~10단계마다 **자동 모드**와 **직접 명령 모드**를 함께 설명합니다.

```
todo-app 복사 (docs/code-convention.yaml, docs/adr.yaml 포함)
   │
   ▼
기능 브랜치 → Claude Code에서 설계 논의 + 구현 → 커밋
   │                    (같은 대화를 유지)
   ▼
┌───────────── 자동 모드 ─────────────┐   ┌──────────── 직접 명령 모드 ────────────┐
│ /mafia-codereview:auto              │   │ [1] git 명령으로 상태 점검              │
│   [1] 상태 점검                     │   │ [2] /mafia-codereview:write-intent      │
│   [2] 설계의도  [3] 평가기준        │ = │ [3] /mafia-codereview:gen-criteria      │
│   [4] PR 본문   [5] 코드리뷰(자동)  │   │ [4] /mafia-codereview:create-pr-body    │
│   [6] 리뷰 반영 + QA                │   │ [5] /mafia-codereview:review            │
│                                     │   │ [6] /mafia-codereview:reflect-review    │
└─────────────────────────────────────┘   └─────────────────────────────────────────┘
   │
   ▼
/mafia-codereview:update-docs   이번 작업에서 배운 규칙을 기준 문서에 반영 (두 모드 공통)
```

**출처·재사용 범위:** 원출처는 [vibemafiaclub/mafia-codereview-harness](https://github.com/vibemafiaclub/mafia-codereview-harness)입니다. 저장소 README와 `plugin.json`에는 라이선스가 **MIT**로 표기되어 있으나, 기준 커밋(`e175e34`) 시점에 별도의 LICENSE 파일은 없습니다. 이 가이드는 원문을 그대로 옮기지 않고 README와 각 명령 파일(`plugin/commands/*.md`)의 내용을 바탕으로 새로 설명한 것입니다. 원문을 복사·변형해 배포하는 경우에는 해당 버전·원 경로를 기록하고 저작권 고지를 보존하세요. 연습용 저장소 `todo-app`(이 모듈의 `todo-app` 폴더)과 그 안의 `docs/code-convention.yaml`·`docs/adr.yaml`(실습용 가상 기록), 예시 프롬프트·예시 답변은 이 가이드에서 새로 만든 것입니다.

| 이 가이드 | 공식 문서 |
|---|---|
| 0 단계: 준비하기 | (가이드에서 추가) |
| 1 단계: 플러그인 설치 | README › Quick Start 1 |
| 2 단계: 연습용 저장소 준비하기 | (가이드에서 추가한 실습 준비, `todo-app` 폴더 제공) |
| 3 단계: 리뷰 기준 문서 살펴보기 | README › Quick Start 2 |
| 4 단계: 기능 구현하기 | `auto.md` › 사전 조건 ("구현이 완료된 feature branch") |
| 5 단계: 모드 선택과 상태 점검 (`/mafia-codereview:auto` 또는 git 명령) | README › Quick Start 3, `auto.md` › Step 1 |
| 6 단계: 설계의도 작성 (`/mafia-codereview:write-intent`) | `auto.md` › Step 2, `write-intent.md` |
| 7 단계: 평가기준 수립 (`/mafia-codereview:gen-criteria`) | `auto.md` › Step 3, `gen-criteria.md` |
| 8 단계: PR 본문 생성 (`/mafia-codereview:create-pr-body`) | `auto.md` › Step 4, `create-pr-body.md` |
| 9 단계: 코드리뷰 실행 (`/mafia-codereview:review`) | `auto.md` › Step 5, `review.md` |
| 10 단계: 리뷰 반영과 QA (`/mafia-codereview:reflect-review`) | `auto.md` › Step 6, `reflect-review.md` |
| 11 단계: 기준 문서 업데이트 (`/mafia-codereview:update-docs`) | `update-docs.md` |

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

# 5 단계: 모드 선택과 상태 점검 — `/mafia-codereview:auto` 또는 git 명령

파이프라인의 [1] 단계입니다. 리뷰할 브랜치와 비교 기준(`main`), 변경 파일을 확인하고 산출물 폴더를 준비합니다. 4단계와 **같은 대화 창**에서 진행합니다.

먼저 모드를 고릅니다. 처음 실습이라면 **직접 명령 모드**를 권장합니다. 단계마다 어떤 명령이 어떤 파일을 만드는지 직접 확인할 수 있기 때문입니다.

| 모드 | 이 단계에서 할 일 |
|---|---|
| **자동 모드** | 5-A대로 `/mafia-codereview:auto` 실행. 이후 6~10단계는 `auto`가 이어서 진행하므로 각 단계의 "자동 모드" 안내를 따라 답만 하면 됨 |
| **직접 명령 모드 (권장)** | 5-B대로 git 명령으로 상태를 확인. 이후 6~10단계에서 명령을 하나씩 직접 실행 |

## 5-A. 자동 모드 — `/mafia-codereview:auto`

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

4. 이어서 `auto`가 [2] 설계의도 단계로 넘어갑니다. 이 단계에서 `auto`는 내부적으로 **`/mafia-codereview:write-intent`** 를 실행해 `design-intent.md`를 만듭니다. 초안과 논의점이 나오면 6단계의 **자동 모드**로 진행합니다. 초안을 보여 주지 않고 넘어가거나 파일이 생기지 않으면 `Esc`로 멈추고 6단계의 **직접 명령 모드**로 바꿉니다.

## 5-B. 직접 명령 모드 — git 명령으로 상태 점검

[1] 상태 점검에는 전용 명령이 없습니다. `auto`가 하는 확인을 git 명령으로 직접 합니다.

1. 현재 브랜치를 확인합니다. `feature/recurring-todos`여야 합니다.

   ```text
   !git branch --show-current
   ```

2. `main` 대비 변경 파일을 확인합니다. 0개라면 구현을 커밋하지 않은 것입니다.

   ```text
   !git diff main...HEAD --stat
   ```

3. 커밋하지 않은 변경이 없는지 확인합니다.

   ```text
   !git status
   ```

4. 산출물 폴더를 만듭니다. (명령들이 알아서 만들기도 하지만, 미리 만들어 두면 저장 위치가 확실해집니다. macOS·Windows 어디서나 동작하는 명령입니다.)

   ```text
   !node -e "require('fs').mkdirSync('.review-artifacts/feature/recurring-todos', { recursive: true })"
   ```

5. 6단계로 넘어가 `/mafia-codereview:write-intent`를 실행합니다.

## 규칙
> 기준 브랜치가 `main`이 아니라면 자동 모드에서는 이 단계에서 알려 줍니다. 예) "base branch는 develop이야." 직접 명령 모드에서는 각 명령을 실행할 때 함께 말합니다.

> 단계마다 Claude가 명령 실행·폴더 생성·worktree 생성 권한을 물을 수 있습니다. 내용을 확인하고 허용합니다.

> 두 모드 모두 **4단계와 같은 대화 창**에서 진행합니다. 6단계 설계의도와 10단계 리뷰 반영이 구현 대화의 맥락을 필요로 합니다.

## 산출물
- `.review-artifacts/feature/recurring-todos/` 폴더

## 체크리스트
- [ ] 자동 모드와 직접 명령 모드 중 하나를 골랐다.
- [ ] 현재 브랜치가 `feature/recurring-todos`이고 기준 브랜치가 `main`인지 확인한다.
- [ ] 변경 파일 수가 0이 아니고(`git diff main...HEAD --stat`), 커밋하지 않은 변경이 없는지 확인한다.

# 6 단계: 설계의도 작성 — `/mafia-codereview:write-intent` → design-intent.md

파이프라인의 [2] 단계입니다. **`/mafia-codereview:write-intent` 명령**이 지금까지의 대화(4단계의 설계 논의와 구현)를 읽고 설계의도 문서 `design-intent.md`를 만듭니다. `auto`는 [2] 단계에서 이 명령을 대신 실행해 줄 뿐이고, 문서를 만드는 것은 `write-intent`입니다.

이 단계는 두 가지 방법 중 하나로 진행합니다.

| 상황 | 모드 |
|---|---|
| 5단계의 `auto`가 이어서 설계의도 초안과 논의점을 보여 주고 있다 | **자동 모드** — 화면의 논의점에 답하고 6-4부터 진행 |
| `auto`가 초안을 보여 주지 않고 넘어갔거나, `design-intent.md` 파일이 생기지 않았거나, **처음 실습이라 만드는 과정을 직접 보고 싶다** | **직접 명령 모드 (권장)** — `/mafia-codereview:write-intent`를 직접 실행 |

아래는 직접 명령 모드 기준입니다. 자동 모드도 6-2 이후는 같습니다.

## 6-1. `write-intent` 실행

`auto`가 진행 중이라면 `Esc`로 멈춘 뒤, **4단계와 같은 대화 창**에서 입력합니다. 저장 위치를 함께 말해 두면 확실합니다.

```text
/mafia-codereview:write-intent
이번 반복 할 일 작업의 설계의도를 정리해줘.
확정본은 현재 폴더의 .review-artifacts/feature/recurring-todos/design-intent.md 에 저장해줘.
```

> 4단계 대화를 이미 `/clear` 했거나 Claude Code를 새로 켰다면, 명령 앞에 설계 결정을 한 번 다시 설명합니다. 이 명령은 **현재 대화에 나온 내용만** 재료로 씁니다.
>
> ```text
> 이번 작업의 설계 결정을 정리할게. 주기는 day/week만, 반복 할 일을 done 하는 순간 다음 회차 생성,
> 다음 마감일은 완료일이 아니라 원래 마감일 + 주기, 반복 할 일은 마감일 필수,
> 날짜 계산은 ADR-002에 따라 UTC 기준. 매월 주기와 반복 중단·삭제는 이번 범위에서 제외.
> ```

## 6-2. 초안과 논의점 확인

Claude가 별도 작업 폴더(fork)에서 초안을 만들고, **모호하거나 구체화가 필요한 논의점**을 함께 보여 줍니다. (예시)

```text
[설계의도 초안 요약]
- 작업 개요: 반복되는 일을 완료할 때마다 다시 추가해야 하는 문제 해결
- 결정 1: 다음 마감일 기준 — 원래 마감일 + 주기 (완료일 기준 아님)
- 결정 2: 반복 정보 저장 — 할 일 객체에 repeat 필드 추가
- 제외: 매월 반복, 반복 중단·삭제

[논의점]
1. 마감일 없는 기존 할 일을 반복으로 바꾸는 기능은 의도적으로 제외한 건가요?
2. 반복 할 일을 두 번 done 하면 다음 회차가 두 번 생기나요, 한 번만 생기나요?
3. 기존 todos.json 에 repeat 필드가 없는 할 일은 일반 할 일로 보는 게 의도인가요?
```

## 6-3. 논의점에 답하기

번호별로 내 의도를 답합니다. 초안에서 고칠 부분이 있으면 함께 말합니다.

```text
1은 의도적으로 제외한 거야. 2는 이미 완료된 할 일을 다시 done 하면 회차를 또 만들지 않아야 해.
3은 맞아, repeat 이 없으면 일반 할 일이야. 이대로 확정해서 저장해줘.
```

## 6-4. 파일이 만들어졌는지 확인

확정되면 `.review-artifacts/feature/recurring-todos/design-intent.md`에 저장됩니다. 브랜치 이름의 `/` 때문에 폴더가 `feature` 안의 `recurring-todos`로 한 단계 더 들어가 있습니다.

```text
!ls .review-artifacts/feature/recurring-todos/
```

```text
!cat .review-artifacts/feature/recurring-todos/design-intent.md
```

(Windows PowerShell에서 직접 볼 때는 `Get-Content .review-artifacts\feature\recurring-todos\design-intent.md`)

내용은 `write-intent` 명령에 정해진 구조를 따릅니다. (예시)

```markdown
# 설계의도

## 작업 개요
"매주 월요일 분리수거"처럼 반복되는 할 일을 완료할 때마다 사용자가 다음 회차를 직접 다시 추가해야 하는 문제를 해결한다.

## 핵심 설계 결정

### 결정 1: 다음 마감일의 기준
- 선택지: 원래 마감일 + 주기 vs 완료한 날 + 주기
- 선택: 원래 마감일 + 주기
- 이유: 늦게 완료해도 "매주 월요일" 같은 요일이 밀리지 않는다.

### 결정 2: 다음 회차가 생기는 시점
- 선택지: 완료하는 순간 vs 마감일이 지나면
- 선택: 완료하는 순간
- 이유: 별도의 예약 실행 없이 CLI 명령 하나로 동작한다. 이미 완료된 할 일을 다시 done 해도 회차를 또 만들지 않는다.

### 결정 3: 날짜 계산 방법
- 선택지: 로컬 시간 Date 계산 vs UTC 기준 계산
- 선택: UTC 기준으로 계산 후 즉시 "YYYY-MM-DD" 문자열로 되돌림
- 이유: ADR-002. 시간대에 따라 하루가 밀리는 버그를 막는다.

## 의도적으로 제외한 것
- 매월 반복: 말일(31일 → 2월) 처리 규칙을 먼저 정해야 해서 다음 작업으로 미룬다.
- 반복 중단·삭제: 이번 작업은 생성과 완료 흐름만 다룬다.
- 마감일 없는 할 일의 반복: 다음 회차의 마감일을 정할 수 없다.

## 주의사항
- repeat 필드가 없는 기존 todos.json 의 할 일은 일반 할 일로 동작해야 한다. (ADR-001)
- 월말·연말을 넘는 날짜(2026-12-28 → 2027-01-04)를 테스트로 확인한다.
```

## 6-5. 파일이 없을 때

| 원인 | 확인과 해결 |
|---|---|
| 별도 작업 폴더(worktree)에만 저장됐다 | `!git worktree list`로 다른 경로가 있는지 확인한 뒤 요청: `design-intent.md 를 워크트리가 아니라 현재 폴더의 .review-artifacts/feature/recurring-todos/ 에 저장해줘.` |
| 초안만 보여 주고 저장하지 않았다 | `확정본을 .review-artifacts/feature/recurring-todos/design-intent.md 에 저장해줘.` |
| `git status`에 안 보인다 | 정상입니다. `.gitignore`에 `.review-artifacts/`가 들어 있습니다. `ls`로 확인하세요. |
| 다른 브랜치에서 실행했다 | `!git branch --show-current`가 `feature/recurring-todos`인지 확인. 다르면 `!git switch feature/recurring-todos` 후 다시 실행 |

## 6-6. 다음 단계로 이어 가기

- **자동 모드**로 진행했다면 `auto`가 그대로 7단계([3] 평가기준)로 넘어갑니다.
- **직접 명령 모드**로 만들었다면 7단계의 직접 명령 모드(`/mafia-codereview:gen-criteria`)로 이어 가거나, 파이프라인을 다시 시작하면서 설계의도 단계를 건너뛰게 합니다.

  ```text
  /mafia-codereview:auto
  설계의도(design-intent.md)는 이미 만들었으니 [3] 평가기준 수립부터 진행해줘.
  ```

  단계별 명령 순서: `/mafia-codereview:gen-criteria`(7단계) → `/mafia-codereview:create-pr-body`(8단계) → `/mafia-codereview:review`(9단계) → `/mafia-codereview:reflect-review`(10단계)

## 규칙
> **논의점은 대충 넘기지 마세요.** 여기서 답한 내용이 리뷰의 기준이 됩니다. 2번처럼 "아직 생각 못 한 경우"가 나오면 지금 정하세요. 9단계에서 리뷰어는 이 의도와 실제 코드가 다르면 `[p1]`로 지적합니다.

> `write-intent`는 **4단계와 같은 대화 창**에서 실행합니다. 설계 논의가 없는 대화에서 실행하면 "핵심 설계 결정"과 "의도적으로 제외한 것"이 비거나 추측으로 채워집니다.

> 이 단계는 **문서만** 만들고 소스코드는 고치지 않습니다.

> 설계의도를 다시 쓰고 싶으면 `/mafia-codereview:write-intent`를 다시 실행하면 됩니다. 같은 경로의 파일을 새 확정본으로 바꿉니다.

## 산출물
- `.review-artifacts/feature/recurring-todos/design-intent.md` — 작업 개요 / 핵심 설계 결정(선택지·선택·이유) / 의도적으로 제외한 것 / 주의사항

## 체크리스트
- [ ] `/mafia-codereview:write-intent`(또는 `auto`의 [2] 단계)를 4단계와 같은 대화 창에서 실행했는지 확인한다.
- [ ] 논의점에 모두 답했는지 확인한다.
- [ ] `ls .review-artifacts/feature/recurring-todos/`에 `design-intent.md`가 보이는지 확인한다.
- [ ] 문서에 "핵심 설계 결정"이 선택지·선택·이유 형식으로 들어 있는지 확인한다.
- [ ] 문서에 "의도적으로 제외한 것" 섹션이 있는지 확인한다.

# 7 단계: 평가기준 수립 — `/mafia-codereview:gen-criteria` → code-quality-guide.md

파이프라인의 [3] 단계입니다. **`/mafia-codereview:gen-criteria` 명령**이 평가기준 문서 `code-quality-guide.md`를 만듭니다. 이 명령은 서브에이전트에게 `docs/adr.yaml` 전체를 읽혀 **이번 작업과 관련된 ADR만** 뽑게 하고, `docs/code-convention.yaml`에서 이번 작업의 stacks(`all`, `node`)에 맞는 규칙을 골라 둘을 합칩니다. `auto`는 [3] 단계에서 이 명령을 대신 실행해 줄 뿐이고, 문서를 만드는 것은 `gen-criteria`입니다.

| 상황 | 모드 |
|---|---|
| 6단계 뒤 `auto`가 이어서 평가기준 초안과 논의점을 보여 주고 있다 | **자동 모드** — 화면의 논의점에 답하고 7-4부터 진행 |
| 6단계를 직접 명령 모드로 했거나, `code-quality-guide.md` 파일이 생기지 않았거나, **만드는 과정을 직접 보고 싶다** | **직접 명령 모드 (권장)** — `/mafia-codereview:gen-criteria`를 직접 실행 |

아래는 직접 명령 모드 기준입니다. 자동 모드도 7-2 이후는 같습니다.

## 7-1. `gen-criteria` 실행

4단계부터 이어 온 **같은 대화 창**에서 입력합니다. 이 명령은 "현재 대화에서 작업의 설계 내용과 범위"를 파악하므로, 6단계에서 만든 설계의도 문서를 참고하라고 알려 주면 확실합니다.

```text
/mafia-codereview:gen-criteria
이번 반복 할 일 작업의 평가기준을 만들어줘. 작업 설계는 .review-artifacts/feature/recurring-todos/design-intent.md 를 참고해.
확정본은 현재 폴더의 .review-artifacts/feature/recurring-todos/code-quality-guide.md 에 저장해줘.
```

## 7-2. 초안과 논의점 확인

서브에이전트가 ADR을 분석하는 동안 잠시 기다립니다. 이어서 초안과 **기준 적용 범위가 모호한 논의점**이 나옵니다. (예시)

```text
[이 작업에 적용되는 ADR]
- ADR-001: 기존 todos.json 의 할 일에는 repeat 필드가 없으므로 읽을 때 기본값 처리 필요
- ADR-002: 다음 마감일 계산은 UTC 기준으로 하고 즉시 "YYYY-MM-DD" 로 되돌려야 함
(ADR-003 은 web 스택이라 제외)

[논의점]
1. GEN-001(50줄) 을 테스트 파일에도 적용할까요?
2. 주기 일수(1, 7)는 GEN-002 매직 넘버에 해당한다고 볼까요?
```

## 7-3. 논의점에 답하기

```text
1은 테스트 파일에는 적용하지 마. 2는 해당돼, 상수로 빼야 해. 이대로 확정해서 저장해줘.
```

## 7-4. 파일이 만들어졌는지 확인

```text
!ls .review-artifacts/feature/recurring-todos/
```

```text
!cat .review-artifacts/feature/recurring-todos/code-quality-guide.md
```

(Windows PowerShell에서 직접 볼 때는 `Get-Content .review-artifacts\feature\recurring-todos\code-quality-guide.md`)

내용은 `gen-criteria` 명령에 정해진 구조(공통 기준 + 이 작업에 적용되는 ADR)를 따릅니다. (예시)

```markdown
# 평가기준

## 공통 기준 (Code Convention)
- GEN-001: 함수는 단일 책임 원칙을 따른다. 50줄을 넘으면 분리를 검토한다. (테스트 파일 제외)
- GEN-002: 매직 넘버를 사용하지 않는다. 반복 주기 일수(1, 7)도 이름 있는 상수로 선언한다.
- GEN-003: 잘못된 입력(마감일 없는 반복, day/week 이외의 주기)은 발생 지점에서 Error 를 던진다. 메시지 출력과 종료 코드 1은 src/cli.js 에서만 처리한다.
- NODE-001: ES 모듈을 사용하고 외부 npm 의존성을 추가하지 않는다.
- NODE-002: 테스트는 node:test 와 node:assert/strict 로 공개 함수의 동작을 검증한다.
- TODO-001: src/todo.js 의 함수는 입력 배열을 변경하지 않고 새 배열을 반환한다.
- TODO-002: 파일 읽기·쓰기는 src/store.js 에서만 한다.

## 이 작업에 적용되는 ADR

### ADR-001: 할 일 저장소는 JSON 파일 하나로 한다
- 적용 방법: 반복 주기를 저장하는 새 필드가 없는 기존 할 일은 일반 할 일로 동작해야 한다. 이 경우를 테스트로 확인한다.

### ADR-002: 날짜는 시간대 없는 "YYYY-MM-DD" 문자열로 다룬다
- 적용 방법: 다음 회차 마감일은 UTC 기준(Date.UTC, getUTCDate/setUTCDate)으로 계산하고 즉시 문자열로 되돌린다. new Date("YYYY-MM-DD") 후 로컬 시간 함수로 계산하면 기준 위반이다. 2026-12-28 → 2027-01-04 같은 연말 경계를 테스트한다.
```

## 7-5. 파일이 없을 때

| 원인 | 확인과 해결 |
|---|---|
| 별도 작업 폴더(worktree)에만 저장됐다 | `!git worktree list`로 확인한 뒤 요청: `code-quality-guide.md 를 워크트리가 아니라 현재 폴더의 .review-artifacts/feature/recurring-todos/ 에 저장해줘.` |
| 초안만 보여 주고 저장하지 않았다 | `확정본을 .review-artifacts/feature/recurring-todos/code-quality-guide.md 에 저장해줘.` |
| `docs/adr.yaml`을 찾지 못했다 | `todo-app` 폴더에서 실행했는지, `docs/` 폴더가 복사·커밋됐는지 확인 |
| ADR-003이 들어가 있다 | `ADR-003은 web 전용이라 이번 작업과 관계없으니 빼고 다시 저장해줘.` |

## 7-6. 다음 단계로 이어 가기

- **자동 모드**로 진행했다면 `auto`가 그대로 8단계([4] PR 본문)로 넘어갑니다.
- **직접 명령 모드**로 만들었다면 8단계의 직접 명령 모드(`/mafia-codereview:create-pr-body`)로 이어 가거나, 파이프라인을 다시 시작하면서 앞 단계를 건너뛰게 합니다.

  ```text
  /mafia-codereview:auto
  설계의도와 평가기준은 이미 만들었으니 [4] PR 본문 생성부터 진행해줘.
  ```

## 규칙
> **ADR-003이 빠졌는지 확인하세요.** 관련 없는 ADR까지 기준에 들어가면 엉뚱한 리뷰가 나옵니다.

> 이 문서가 9단계 리뷰의 **유일한 근거**입니다. 여기 없는 기준으로는 리뷰 코멘트가 나오지 않습니다. 빠진 기준이 있다면 지금 추가해 달라고 하세요.

> 평가기준에는 `adr.yaml` **전체를 넣지 않고** 이번 작업과 관련된 항목만 넣습니다(하네스 규칙). 적용 방법이 "이 작업에서 구체적으로 무엇을 지켜야 하는지"로 적혀 있는지 보세요.

> 이 단계는 **문서만** 만들고 소스코드는 고치지 않습니다. 다시 만들고 싶으면 `/mafia-codereview:gen-criteria`를 다시 실행합니다.

## 산출물
- `.review-artifacts/feature/recurring-todos/code-quality-guide.md` — 공통 기준(Code Convention) + 이 작업에 적용되는 ADR(적용 방법 포함)

## 체크리스트
- [ ] `/mafia-codereview:gen-criteria`(또는 `auto`의 [3] 단계)를 같은 대화 창에서 실행했는지 확인한다.
- [ ] 논의점에 모두 답했는지 확인한다.
- [ ] `ls .review-artifacts/feature/recurring-todos/`에 `code-quality-guide.md`가 보이는지 확인한다.
- [ ] ADR-001과 ADR-002가 적용 방법과 함께 들어 있는지 확인한다.
- [ ] ADR-003이 제외됐는지 확인한다.

# 8 단계: PR 본문 생성 — `/mafia-codereview:create-pr-body` → pr-body.md

파이프라인의 [4] 단계입니다. **`/mafia-codereview:create-pr-body` 명령**이 `git diff main...HEAD`(main 대비 이 브랜치의 변경)를 분석해 PR 본문 `pr-body.md`를 만듭니다. 이 문서는 9단계 리뷰어가 **작성자의 의도를 이해하는 재료**이고, 11단계에서 실제 GitHub PR 본문으로도 씁니다. `auto`는 [4] 단계에서 이 명령을 대신 실행해 줄 뿐이고, 문서를 만드는 것은 `create-pr-body`입니다.

| 상황 | 모드 |
|---|---|
| 7단계 뒤 `auto`가 이어서 PR 본문 초안과 논의점을 보여 주고 있다 | **자동 모드** — 화면의 논의점에 답하고 8-4부터 진행 |
| 7단계를 직접 명령 모드로 했거나, `pr-body.md` 파일이 생기지 않았거나, **만드는 과정을 직접 보고 싶다** | **직접 명령 모드 (권장)** — `/mafia-codereview:create-pr-body`를 직접 실행 |

아래는 직접 명령 모드 기준입니다. 자동 모드도 8-2 이후는 같습니다.

## 8-1. `create-pr-body` 실행

구현이 **커밋되어 있는지** 먼저 확인합니다. 커밋되지 않은 변경은 `git diff main...HEAD`에 나오지 않습니다.

```text
!git status
```

```text
!git diff main...HEAD --stat
```

같은 대화 창에서 입력합니다.

```text
/mafia-codereview:create-pr-body
main 대비 이 브랜치의 변경으로 PR 본문을 만들어줘. 설계의도는 .review-artifacts/feature/recurring-todos/design-intent.md 를 참고해.
확정본은 현재 폴더의 .review-artifacts/feature/recurring-todos/pr-body.md 에 저장해줘.
```

## 8-2. 초안과 논의점 확인

초안과 **PR 설명에서 명확히 해야 할 논의점**이 나옵니다. (예시)

```text
[논의점]
1. 기존 할 일 출력 형식이 바뀌지 않았으니 Breaking Changes 는 "없음"으로 할까요?
2. 기존 todos.json 을 변환하는 마이그레이션이 필요한가요?
3. 관련 이슈 번호가 있나요?
```

## 8-3. 논의점에 답하기

```text
1은 없음으로. 2는 필요 없어, repeat 필드가 없으면 일반 할 일로 읽으니까.
3은 이슈 없어, Related 에는 ADR-001, ADR-002 와 design-intent.md 를 적어줘. 이대로 확정해서 저장해줘.
```

## 8-4. 파일이 만들어졌는지 확인

```text
!ls .review-artifacts/feature/recurring-todos/
```

```text
!cat .review-artifacts/feature/recurring-todos/pr-body.md
```

(Windows PowerShell에서 직접 볼 때는 `Get-Content .review-artifacts\feature\recurring-todos\pr-body.md`)

내용은 `create-pr-body` 명령에 정해진 구조(Summary / Changes / Breaking Changes / Test Plan / Related)를 따릅니다. (예시)

```markdown
# PR: 반복 할 일 추가 (매일·매주)

## Summary
반복되는 할 일을 완료할 때마다 다시 추가해야 하는 문제를 해결한다. 반복 할 일을 완료하면 원래 마감일 + 주기로 다음 회차를 자동 생성한다.

## Changes

### src/todo.js
- 할 일에 반복 주기(day, week)를 저장하고, 반복 할 일 완료 시 다음 회차를 추가
- 다음 마감일을 UTC 기준으로 계산 (ADR-002)
- 목록에 주기 표시 "(마감 2026-11-23, 매주)"

### src/cli.js
- add 명령에 --every day|week 옵션 추가, 잘못된 입력은 종료 코드 1

### test/todo.test.js
- 반복 할 일 생성·완료·잘못된 입력·연말 경계 테스트 추가

## Breaking Changes
없음

## Test Plan
- [ ] npm test 통과 (기존 테스트 5개 포함)
- [ ] add 분리수거 2026-11-16 --every week → done 1 → 2026-11-23 회차 생성
- [ ] 2026-12-28 매주 반복 완료 → 2027-01-04 회차 생성
- [ ] 마감일 없는 반복, --every month 는 오류와 종료 코드 1
- [ ] repeat 필드가 없는 기존 todos.json 의 할 일은 완료해도 회차가 생기지 않음

## Related
- ADR-001, ADR-002
- .review-artifacts/feature/recurring-todos/design-intent.md
```

## 8-5. 파일이 없을 때

| 원인 | 확인과 해결 |
|---|---|
| 별도 작업 폴더(worktree)에만 저장됐다 | `!git worktree list`로 확인한 뒤 요청: `pr-body.md 를 워크트리가 아니라 현재 폴더의 .review-artifacts/feature/recurring-todos/ 에 저장해줘.` |
| 초안만 보여 주고 저장하지 않았다 | `확정본을 .review-artifacts/feature/recurring-todos/pr-body.md 에 저장해줘.` |
| Changes가 비어 있거나 "변경 없음"이라고 한다 | 구현을 커밋하지 않았거나 `main`에서 실행함. `!git switch feature/recurring-todos`, 커밋 후 다시 실행 |

## 8-6. 다음 단계로 이어 가기

- **자동 모드**로 진행했다면 `auto`가 그대로 9단계([5] 코드리뷰 실행)로 넘어갑니다.
- **직접 명령 모드**로 만들었다면 리뷰를 시작합니다. 문서 3개가 모두 있으므로 `/mafia-codereview:review`를 직접 실행하거나, 파이프라인을 다시 시작하면서 앞 단계를 건너뛰게 합니다.

  ```text
  /mafia-codereview:auto
  설계의도, 평가기준, PR 본문은 이미 만들었으니 [5] 코드리뷰부터 진행해줘.
  ```

## 규칙
> **Test Plan을 꼭 보세요.** "2026-12-28 → 2027-01-04"처럼 구체적인 확인 항목이 있어야 9단계 리뷰어가 테스트 누락을 판단할 수 있습니다. 빠졌으면 추가해 달라고 하세요.

> Breaking Changes는 "없음"이라도 반드시 적습니다. 기존 사용자의 명령이나 데이터가 바뀌는지 판단하는 항목입니다.

> 이 단계는 **문서만** 만들고 소스코드는 고치지 않습니다. 코드를 더 고친 뒤에는 `/mafia-codereview:create-pr-body`를 다시 실행해 본문을 최신으로 맞춥니다.

## 산출물
- `.review-artifacts/feature/recurring-todos/pr-body.md` — Summary / Changes / Breaking Changes / Test Plan / Related

## 체크리스트
- [ ] 구현이 커밋된 상태에서 `/mafia-codereview:create-pr-body`(또는 `auto`의 [4] 단계)를 실행했는지 확인한다.
- [ ] 논의점에 모두 답했는지 확인한다.
- [ ] `ls .review-artifacts/feature/recurring-todos/`에 `pr-body.md`가 보이는지 확인한다.
- [ ] Breaking Changes와 Test Plan 섹션이 채워졌는지 확인한다.

# 9 단계: 코드리뷰 실행 — `/mafia-codereview:review` → review-comments.md

파이프라인의 [5] 단계입니다. **`/mafia-codereview:review` 명령**이 평가기준(`code-quality-guide.md`) + 설계의도(`design-intent.md`) + PR 본문(`pr-body.md`) + `git diff main...HEAD`를 읽고 근거 기반 코드리뷰 `review-comments.md`를 만듭니다. 이 단계는 **사람에게 묻지 않고 자동으로** 진행됩니다. `auto`는 [5] 단계에서 이 명령을 **서브에이전트**에게 맡겨 실행할 뿐이고, 리뷰를 만드는 것은 `review`입니다.

| 상황 | 모드 |
|---|---|
| 8단계 뒤 `auto`가 이어서 리뷰를 진행하고 있다 | **자동 모드** — 기다렸다가 9-3부터 진행 |
| 8단계를 직접 명령 모드로 했거나, `review-comments.md` 파일이 생기지 않았거나, **리뷰를 다시 받고 싶다** | **직접 명령 모드** — `/mafia-codereview:review`를 직접 실행 |

## 9-1. (직접 명령 모드) 입력 문서 3개 확인

리뷰는 세 문서를 근거로 합니다. 하나라면 빠져도 근거 없는 리뷰가 됩니다.

```text
!ls .review-artifacts/feature/recurring-todos/
```

`design-intent.md`, `code-quality-guide.md`, `pr-body.md` 세 파일이 있어야 합니다. 없는 파일은 6~8단계의 직접 명령 모드로 먼저 만듭니다.

## 9-2. (직접 명령 모드) `review` 실행

같은 대화 창에서 입력합니다. `auto`처럼 **서브에이전트**에게 맡기라고 말해 두면, 구현한 대화의 생각에 끌려가지 않는 독립적인 리뷰가 됩니다.

```text
/mafia-codereview:review
서브에이전트로 실행해서 .review-artifacts/feature/recurring-todos/ 의 code-quality-guide.md, design-intent.md, pr-body.md 와
git diff main...HEAD 를 근거로 리뷰해줘. 결과는 같은 폴더의 review-comments.md 에 저장해줘.
```

## 9-3. 결과 확인

기다리면 `review-comments.md`가 저장됩니다.

```text
!cat .review-artifacts/feature/recurring-todos/review-comments.md
```

(Windows PowerShell에서 직접 볼 때는 `Get-Content .review-artifacts\feature\recurring-todos\review-comments.md`)

내용은 `review` 명령에 정해진 구조(Summary + 우선순위별 Comments)를 따릅니다. (예시)

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

코멘트마다 **근거**가 `code-quality-guide.md`의 기준이나 `design-intent.md`를 가리키는지 확인합니다.

## 9-4. 파일이 없을 때

| 원인 | 확인과 해결 |
|---|---|
| 서브에이전트가 결과를 대화에만 보여 주고 저장하지 않았다 | `리뷰 결과를 .review-artifacts/feature/recurring-todos/review-comments.md 에 저장해줘.` |
| 입력 문서가 없어서 멈췄다 | 9-1에서 빠진 파일을 확인하고 6~8단계의 직접 명령 모드로 만든 뒤 다시 실행 |
| 별도 작업 폴더(worktree)에 저장됐다 | `!git worktree list`로 확인한 뒤 `review-comments.md 를 현재 폴더의 .review-artifacts/feature/recurring-todos/ 에 저장해줘.` |

## 9-5. 다음 단계로 이어 가기

- **자동 모드**로 진행했다면 `auto`가 그대로 10단계([6] 리뷰 반영 + QA)로 넘어갑니다.
- **직접 명령 모드**로 만들었다면 10단계의 직접 명령 모드(`/mafia-codereview:reflect-review`)로 이어 가거나, `auto`에 맡깁니다.

  ```text
  /mafia-codereview:auto
  [2]~[5] 산출물은 이미 있으니 [6] 리뷰 반영부터 진행해줘.
  ```

## 규칙
> 근거가 없는 코멘트(취향 리뷰)가 보이면 하네스 규칙 위반입니다. 10단계에서 거부(REJECT)할 수 있습니다.

> 리뷰어는 설계의도에 적힌 **의도적 결정에는 "왜 이렇게 했나요?"라고 묻지 않습니다.** 예를 들어 "매월 반복이 없다"는 지적이 나오면 안 됩니다.

> 이 단계는 리뷰 문서만 만들고 **코드를 고치지 않습니다.** 고치는 것은 10단계입니다.

> 코드를 더 고친 뒤 리뷰를 다시 받고 싶으면 8단계(`create-pr-body`)로 PR 본문을 최신으로 맞춘 뒤 `/mafia-codereview:review`를 다시 실행합니다.

## 산출물
- `.review-artifacts/feature/recurring-todos/review-comments.md` — Summary와 `[p1]`~`[p4]` 코멘트

## 체크리스트
- [ ] (직접 명령 모드) 입력 문서 3개가 있는 상태에서 `/mafia-codereview:review`를 실행했는지 확인한다.
- [ ] `ls .review-artifacts/feature/recurring-todos/`에 `review-comments.md`가 보이는지 확인한다.
- [ ] 모든 `[p1]`~`[p3]` 코멘트에 "근거"가 있는지 확인한다.
- [ ] 변경 제안 코멘트에 "side effect"가 적혀 있는지 확인한다.
- [ ] 의도적으로 제외한 기능에 대한 지적이 없는지 확인한다.

# 10 단계: 리뷰 반영과 QA — `/mafia-codereview:reflect-review`

파이프라인의 [6] 단계입니다. **`/mafia-codereview:reflect-review` 명령**이 `review-comments.md`의 코멘트마다 수용·거부를 판단해 보여 주고, 사람이 확인하면 코드를 고친 뒤 **빌드·테스트로 QA**합니다. 판정(ACCEPT / REJECT)은 `review-comments.md`에 덧붙입니다. `auto`는 [6] 단계에서 이 명령을 대신 실행해 줄 뿐입니다.

| 상황 | 모드 |
|---|---|
| 9단계 뒤 `auto`가 이어서 판단 목록을 보여 주고 있다 | **자동 모드** — 10-2부터 진행 |
| 9단계를 직접 명령 모드로 했거나, 판단 목록이 나오지 않았거나, **반영 과정을 직접 진행하고 싶다** | **직접 명령 모드** — `/mafia-codereview:reflect-review`를 직접 실행 |

## 10-1. (직접 명령 모드) `reflect-review` 실행

이 명령은 **구현 맥락이 살아 있는 대화**에서 실행해야 합니다. 4단계부터 이어 온 같은 대화 창에서 입력합니다.

```text
/mafia-codereview:reflect-review
.review-artifacts/feature/recurring-todos/review-comments.md 의 코멘트를 검토해서 수용/거부 판단을 보여줘.
고친 코드는 현재 브랜치(feature/recurring-todos)에 커밋해줘.
```

## 10-2. 판단 목록 확인

우선순위별 기본 처리에 따라 판단이 나옵니다. (예시)

```text
[p1] src/todo.js:24  → ACCEPT (기본 수용)
[p2] src/todo.js:5   → ACCEPT 제안 — 매월 주기 확장 시 이점. 확인해 주세요.
[p3] src/cli.js:12   → REJECT 제안 — 인자 파싱 라이브러리 도입은 NODE-001(의존성 금지) 위반
[p4] test/todo.test.js:40 → 일괄 수용
```

| 우선순위 | 기본 처리 |
|---|---|
| `[p1]` | 기본 수용. 거부하려면 명확한 근거 필요 |
| `[p2]` | 판단과 근거를 보여 주고 **사람이 확인** |
| `[p3]` | 판단을 보여 주되 **사람 재량** |
| `[p4]` | 일괄 수용 또는 무시 |

## 10-3. 확인하기

바꾸고 싶은 판단이 있으면 함께 말합니다.

```text
좋아, 제안대로 진행해줘.
```

## 10-4. 수정과 QA

코드가 수정되고 QA(테스트 실행)가 돌아갑니다. 테스트가 실패하면 **수정 → QA → 재확인**을 반복합니다. 끝나면 수정 내역, QA 결과, 커밋을 요약해 보고하고, `review-comments.md`의 각 코멘트 아래에 판정이 붙습니다.

```markdown
### [p1] src/todo.js:24
- 근거: ...
- 내용: ...
- 제안: ...
- **판정: ACCEPT** — 수정 완료. 이미 done 인 할 일은 그대로 반환하도록 변경.

### [p3] src/cli.js:12
- 근거: ...
- 내용: ...
- 제안: ...
- **판정: REJECT** — 인자 파싱 라이브러리 도입은 NODE-001(외부 의존성 금지) 위반.
```

## 10-5. 결과 확인

```text
!git log --oneline main..HEAD
```

```text
!npm test
```

```text
!cat .review-artifacts/feature/recurring-todos/review-comments.md
```

리뷰 반영 커밋이 보이지 않으면, 별도 작업 폴더(worktree)에서 고쳤을 수 있습니다.

```text
리뷰 반영 커밋이 지금 브랜치(feature/recurring-todos)에 없어. 워크트리의 변경을 이 브랜치로 가져와줘.
```

## 10-6. 다음 단계로 이어 가기

- **두 모드 모두** 이 단계에서 파이프라인이 끝납니다. 자동 모드라면 `auto`가 산출물 전체 목록과 최종 상태를 보고합니다.
- 11단계 `/mafia-codereview:update-docs`는 `auto`에 포함되지 않으므로 **직접 실행**합니다.

## 규칙
> `[p1]`을 거부하려면 **명확한 근거**가 필요합니다. "귀찮아서"는 근거가 아닙니다. `design-intent.md`나 기준 문서를 근거로 대세요.

> 리뷰 반영 단계는 구현할 때의 맥락이 살아 있어야 잘 동작합니다. 그래서 4단계부터 같은 대화를 유지한 것입니다. 대화를 비웠다면 실행 전에 "이번 작업은 반복 할 일 기능이고, 설계의도는 design-intent.md 에 있어"라고 알려 줍니다.

> 코드를 많이 고쳤다면 9단계 리뷰를 한 번 더 받아도 됩니다(8단계 PR 본문 갱신 → 9단계 → 10단계).

## 산출물
- 리뷰가 반영된 코드와 커밋
- 판정(ACCEPT / REJECT + 근거)이 추가된 `review-comments.md`
- QA(테스트) 결과 보고

## 체크리스트
- [ ] (직접 명령 모드) `/mafia-codereview:reflect-review`를 4단계와 같은 대화 창에서 실행했는지 확인한다.
- [ ] `review-comments.md`의 모든 코멘트에 판정이 붙었는지 확인한다.
- [ ] REJECT 판정에 근거가 적혀 있는지 확인한다.
- [ ] `npm test`가 통과하고, 리뷰 반영 커밋이 `feature/recurring-todos`에 있는지 확인한다.

# 11 단계: 기준 문서 업데이트 — `/mafia-codereview:update-docs`

이번 작업에서 새로 정한 것(예: "반복 주기는 이름 있는 표로 관리", "완료된 반복 할 일은 회차를 다시 만들지 않음")을 **다음 리뷰의 기준**으로 남깁니다. 이렇게 하면 기준 문서가 작업할수록 좋아집니다.

| 모드 | 이 단계에서 할 일 |
|---|---|
| **자동 모드** | `auto`는 10단계에서 끝나고 이 명령을 실행하지 않습니다. 아래대로 **직접 실행**합니다. |
| **직접 명령 모드** | 아래대로 실행합니다. |

1. 4단계부터 이어 온 같은 대화에서 실행합니다. 인자 없이 실행하면 두 문서를 모두 검토합니다.

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
| 다른 모드로 한 번 더 해 본다 | 이번에 직접 명령 모드로 했다면 다음엔 자동 모드(`/mafia-codereview:auto` 한 번)로, 반대로 했다면 직접 명령 모드(`write-intent` → `gen-criteria` → `create-pr-body` → `review` → `reflect-review`)로 진행해 결과물을 비교 |
| 한 단계만 다시 실행한다 | 코드를 더 고친 뒤 `/mafia-codereview:create-pr-body` → `/mafia-codereview:review`만 다시 실행해 리뷰를 새로 받기 |
| 다음 기능도 같은 흐름으로 리뷰한다 | 새 브랜치(`feature/stop-recurring`)에서 "반복 중단" 기능을 구현하고 원하는 모드로 진행. 11단계에서 추가한 ADR-004가 평가기준에 들어오는지 확인 |
| 기준 문서의 효과를 비교한다 | `docs/adr.yaml`에서 ADR-002를 지운 브랜치에서 같은 리뷰를 돌려, 날짜 계산 관련 코멘트가 사라지는지 비교 |
| 내 팀 프로젝트에 적용한다 | 플러그인 원본의 `docs/*.yaml` 예시를 참고해 팀의 실제 규칙·결정으로 두 문서를 작성 |

# 문제 해결

| 증상 | 해결 |
|---|---|
| `/mafia-codereview:auto` 등 명령이 자동완성에 안 뜬다 | Claude Code를 완전히 종료 후 재실행. 그래도 없으면 `claude plugin list`로 설치 확인 |
| 변경 파일이 0개로 나온다 | 구현을 커밋하지 않았거나 `main`에 있음. 기능 브랜치에서 커밋한 뒤 다시 실행 (5-B의 git 명령으로 확인) |
| 자동 모드가 중간 단계를 건너뛰거나 파일을 만들지 않았다 | `Esc`로 멈추고 그 단계부터 직접 명령 모드로 전환. 다시 `auto`로 돌아가려면 "○○는 이미 만들었으니 [n]부터 진행해줘" |
| `design-intent.md`가 만들어지지 않았다 | 6단계 직접 명령 모드: 4단계 대화 창에서 `/mafia-codereview:write-intent`를 직접 실행하고 저장 경로(`.review-artifacts/feature/recurring-todos/design-intent.md`)를 함께 지정. 그래도 없으면 6-5의 표(worktree, 미저장, 브랜치) 확인 |
| `code-quality-guide.md`가 만들어지지 않았다 | 7단계 직접 명령 모드: 같은 대화 창에서 `/mafia-codereview:gen-criteria`를 직접 실행하고 설계의도 문서와 저장 경로를 함께 지정. 그래도 없으면 7-5의 표 확인 |
| `pr-body.md`가 만들어지지 않았다 | 8단계 직접 명령 모드: 구현을 커밋한 뒤 `/mafia-codereview:create-pr-body`를 직접 실행하고 저장 경로를 함께 지정. 그래도 없으면 8-5의 표 확인 |
| 설계의도 초안이 빈약하다 | 구현 대화와 다른 창에서 실행함. 4단계 대화 창에서 다시 실행하거나, 설계 결정을 대화로 설명한 뒤 `/mafia-codereview:write-intent` |
| 평가기준에 관련 없는 ADR(ADR-003)이 들어갔다 | 논의점 답변에서 "ADR-003은 web 전용이니 제외해줘"라고 요청 |
| `review-comments.md`가 만들어지지 않았다 | 9단계 직접 명령 모드: 입력 문서 3개를 확인(9-1)한 뒤 `/mafia-codereview:review`를 서브에이전트로 실행하고 저장 경로를 함께 지정. 그래도 없으면 9-4의 표 확인 |
| 리뷰 반영 판단 목록이 나오지 않았다 | 10단계 직접 명령 모드: 4단계 대화 창에서 `/mafia-codereview:reflect-review`를 직접 실행 |
| 근거 없는 리뷰 코멘트가 있다 | 10단계에서 REJECT하고 근거로 "평가기준에 없는 항목"이라고 적기 |
| 리뷰 반영 커밋이 현재 브랜치에 없다 | worktree에서 작업된 것. 10-5의 요청문으로 가져오기 |
| `docs/code-convention.yaml`이 없다는 오류 | 2단계 복사가 덜 됨. `docs/` 폴더가 복사·커밋됐는지 확인 |
