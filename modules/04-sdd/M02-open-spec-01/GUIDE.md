# 개념

## OpenSpec이란?

**OpenSpec** 은 사람과 AI 코딩 도우미가 **코드를 쓰기 전에 "무엇을 만들지" 합의**하도록 돕는 가벼운 스펙 주도 개발(SDD) 도구다. 핵심은 두 가지 폴더다.

| 폴더 | 의미 | 비유 |
| --- | --- | --- |
| `openspec/specs/` | **시스템이 지금 어떻게 동작하는지**를 적은 기준 명세 (진실의 원천) | 현재 법전 |
| `openspec/changes/` | **바꾸려는 내용**을 담은 변경 제안. 변경 하나당 폴더 하나 | 국회에 올라온 개정안 |

변경이 구현되고 나면 `archive` 로 **개정안(델타 명세)을 법전(기준 명세)에 반영**하고, 변경 폴더는 `changes/archive/날짜-이름/` 으로 옮겨 이력으로 남긴다. 그래서 `openspec/specs/` 만 보면 언제나 **현재 시스템의 동작**을 알 수 있다.

## 변경(change) 하나의 산출물

`/opsx:propose` 를 실행하면 기본 스키마(`spec-driven`)에 따라 네 가지 문서가 순서대로 만들어진다.

```
proposal ──► specs ──► design ──► tasks ──► (apply: 구현)
   왜·무엇      요구사항     어떻게      작업 목록
```

| 산출물 | 경로 | 내용 |
| --- | --- | --- |
| proposal.md | `changes/<변경>/proposal.md` | **Why**(왜), **What Changes**(무엇이 바뀌나), **Capabilities**(새로/수정되는 기능 영역), **Impact**(영향) |
| 델타 명세 | `changes/<변경>/specs/<기능>/spec.md` | `## ADDED / MODIFIED / REMOVED Requirements` + 시나리오(WHEN/THEN) |
| design.md | `changes/<변경>/design.md` | Context, Goals / Non-Goals, Decisions(결정과 근거), Risks / Trade-offs |
| tasks.md | `changes/<변경>/tasks.md` | `## 1. 그룹` 아래 `- [ ] 1.1 작업` 형식의 체크리스트 |

## 델타 명세(Delta Spec) — OpenSpec의 핵심

델타 명세는 **기준 명세에 비해 무엇이 달라지는지**만 적는다. 그래서 기존 프로젝트(브라운필드)에서도 전체를 다시 쓰지 않고 변경분만 다룰 수 있다.

```markdown
## ADDED Requirements          ← 새로 생기는 요구사항 (archive 시 기준 명세에 추가)

### Requirement: 마감일 지정
The system SHALL allow ... 사용자는 할 일에 마감일을 지정할 수 있다.

#### Scenario: 마감일과 함께 추가
- **WHEN** 사용자가 마감일을 고르고 할 일을 추가한다
- **THEN** 할 일 옆에 마감일이 표시된다

## MODIFIED Requirements       ← 바뀌는 요구사항 (archive 시 기존 것을 통째로 교체 → 전체 내용을 적어야 함)

## REMOVED Requirements        ← 없어지는 요구사항 (archive 시 삭제, Reason/Migration 필수)
```

형식 규칙 (검증 도구 `openspec validate` 가 확인한다):

- 요구사항 제목은 `### Requirement: 이름`, 시나리오는 **반드시 `####` 4개**를 쓴 `#### Scenario: 이름`
- 모든 요구사항에는 **시나리오가 최소 1개** 있어야 한다.
- 요구사항 문장에는 **`SHALL` 또는 `MUST`** 키워드를 쓴다. 한국어로 작성해도 이 키워드와 구조 제목(`## ADDED Requirements` 등)은 **영어 그대로** 둔다.

## 구성 요소

| 구성 요소 | 위치 | 설명 |
| --- | --- | --- |
| `openspec` CLI | 내 컴퓨터(터미널) | 초기화, 목록·상태 확인, 검증, 보관을 담당하는 Node.js 도구 |
| 슬래시 커맨드 | `.claude/commands/opsx/*.md` | Claude Code에서 `/opsx:propose` 처럼 호출 |
| 스킬 | `.claude/skills/openspec-*/SKILL.md` | 커맨드가 사용하는 상세 작업 지시서 (Claude가 자동 활용) |
| 프로젝트 설정 | `openspec/config.yaml` | 언어·기술 스택·원칙(`context`), 산출물별 규칙(`rules`) |
| 기준 명세 | `openspec/specs/<기능>/spec.md` | 현재 시스템 동작 |
| 변경 | `openspec/changes/<변경>/` | 진행 중인 변경의 문서 묶음 |

> ⚠️ **터미널 명령 vs 채팅 명령을 구분하자.** (가장 흔한 실수)
> `openspec ...` 은 **터미널**에서, `/opsx:...` 는 **Claude Code 채팅창**에서 입력한다.

---

# 1 단계: 설치와 프로젝트 초기화

**목적** — `openspec` CLI를 설치하고, Claude Code가 OpenSpec 명령을 쓸 수 있는 프로젝트를 만든다.

**입력** — 터미널 명령

### 1-1. Node.js 확인 (20.19.0 이상)

```bash
node --version
# 없거나 낮으면 (macOS): brew install node
```

### 1-2. openspec CLI 설치

```bash
npm install -g @fission-ai/openspec@latest
openspec --version        # 예: 1.14.1
```

### 1-3. 프로젝트 폴더 만들고 초기화

```bash
mkdir my-todo-openspec && cd my-todo-openspec
git init
openspec init --tools claude --language "Korean (ko-KR)"
```

| 옵션 | 의미 |
| --- | --- |
| `--tools claude` | Claude Code용 커맨드·스킬을 `.claude/` 에 설치 (생략하면 대화형으로 선택) |
| `--language "Korean (ko-KR)"` | 모든 산출물을 한국어로 쓰도록 `config.yaml` 에 기록 |
| `--profile core` | 기본 명령 세트 (기본값) |

> OpenSpec은 익명 사용 통계를 수집한다. 끄려면 `openspec config set telemetry.enabled false` (또는 환경 변수 `OPENSPEC_TELEMETRY=0`).

## 규칙

- `openspec init` 은 **실행한 폴더**에 `openspec/` 을 만든다. 반드시 프로젝트 폴더 안에서 실행한다.
- 예전 OpenSpec으로 만든 프로젝트라면 `init` 이 옛 파일(`.claude/commands/openspec/`, `openspec/AGENTS.md`, `CLAUDE.md` 의 OpenSpec 마커 블록)을 **자동 정리**한다. 먼저 커밋해 두자.
- `.claude`, `openspec/specs/.gitkeep` 처럼 `.` 으로 시작하는 항목은 **숨김 파일**이다. 터미널에서 `ls -a`, Finder에서 `⌘ + Shift + .` 로 본다.
- CLI를 업그레이드한 뒤에는 프로젝트마다 `openspec update` 로 커맨드 파일을 갱신한다.

## 산출물

초기화 직후 화면:

```
OpenSpec Setup Complete

Created: Claude Code
6 skills and 6 commands in .claude/
Config: openspec/config.yaml (schema: spec-driven)

Getting started:
  Start your first change: /opsx:propose "your idea"
```

생성되는 구조:

```
my-todo-openspec/
├── .claude/
│   ├── commands/opsx/              ← /opsx:… 슬래시 커맨드 6개
│   │   ├── explore.md   propose.md   apply.md
│   │   └── update.md    sync.md      archive.md
│   └── skills/                     ← 커맨드가 사용하는 스킬 6개
│       ├── openspec-explore/SKILL.md
│       ├── openspec-propose/SKILL.md
│       ├── openspec-apply-change/SKILL.md
│       ├── openspec-update-change/SKILL.md
│       ├── openspec-sync-specs/SKILL.md
│       └── openspec-archive-change/SKILL.md
└── openspec/
    ├── config.yaml                 ← 프로젝트 맥락·규칙 (2단계에서 편집)
    ├── specs/.gitkeep              ← 기준 명세 (아직 비어 있음)
    └── changes/archive/.gitkeep    ← 보관된 변경 (아직 비어 있음)
```

## 체크리스트

- [ ] `openspec --version` 이 버전을 출력한다.
- [ ] 초기화 화면에 `6 skills and 6 commands in .claude/` 가 보였다.
- [ ] `ls .claude/commands/opsx` 에 `apply.md archive.md explore.md propose.md sync.md update.md` 6개가 있다.
- [ ] `ls .claude/skills` 에 `openspec-` 으로 시작하는 폴더 6개가 있다.
- [ ] `openspec/config.yaml` 에 `Language: Korean (ko-KR)` 가 들어 있다.

---

# 2 단계: 프로젝트 맥락 설정 (config.yaml)

**목적** — AI가 모든 산출물을 만들 때 참고할 **프로젝트 배경(context)** 과 **산출물별 규칙(rules)** 을 적는다. M01 Kiro의 스티어링(steering) 파일에 해당한다.

**입력** — `openspec/config.yaml` 을 편집기로 열어 아래 내용으로 바꾼다. (또는 Claude Code에 "config.yaml을 아래 내용으로 바꿔 줘"라고 붙여 넣어도 된다.)

```yaml
schema: spec-driven

context: |
  Language: Korean (ko-KR)
  All artifacts must be written in Korean (ko-KR).
  Keep OpenSpec structural headings and SHALL/MUST keywords in English.

  프로젝트: 초보자 학습용 할 일 관리 웹 앱 (혼자 쓰는 개인용)
  기술 스택: 빌드 도구·프레임워크 없이 순수 HTML/CSS/JavaScript(ES 모듈)
  구조: index.html, src/todo.js(순수 함수 로직), src/storage.js(localStorage 저장), src/app.js(화면·이벤트)
  테스트: tests/*.test.js 에 Node.js 내장 테스트 러너(node --test). package.json 에는 "type": "module" 만 두고 외부 의존성 없음
  실행: python3 -m http.server 8000
  원칙: 모든 기능은 키보드만으로 사용 가능. 데이터는 브라우저 localStorage 에만 저장하고 외부로 전송하지 않음

rules:
  proposal:
    - 범위 밖(Out of scope) 항목을 반드시 적는다
  tasks:
    - 각 작업 그룹에 해당 기능의 단위 테스트 작업을 포함한다
    - 각 작업에는 완료를 확인하는 방법(테스트 또는 명령)을 적는다
```

## 규칙

- `context` 에는 **AI가 코드를 읽어도 알 수 없는 것**만 적는다: 언어, 기술 제약, 원칙, 실행 방법. 일반적인 설명이나 코드에서 바로 보이는 사실은 넣지 않는다.
- 언어 설정 3줄(`Language: …`, `All artifacts…`, `Keep … in English`)은 지우지 않는다. **`SHALL`/`MUST` 와 구조 제목이 영어여야 검증이 통과**한다.
- `rules` 의 키는 산출물 이름(`proposal`, `specs`, `design`, `tasks`)이다. 해당 산출물을 만들 때만 적용된다.
- YAML은 **들여쓰기가 의미**를 가진다. 탭 대신 공백 2칸을 쓰고, `context: |` 아래 줄은 모두 같은 깊이로 들여쓴다.

## 산출물

- 수정된 `openspec/config.yaml`

## 체크리스트

- [ ] `config.yaml` 에 `schema: spec-driven`, `context:`, `rules:` 가 있다.
- [ ] 언어 설정 3줄이 그대로 있다.
- [ ] 기술 스택·구조·테스트·실행 방법·원칙이 적혀 있다.

---

# 3 단계: 탐색(Explore) — 아이디어 정리 (선택)

**목적** — 무엇을 만들지 아직 흐릿할 때, AI와 **부담 없이 대화하며 선택지를 비교**하고 범위를 좁힌다. 이 단계에서는 **코드를 절대 쓰지 않으며**, 요청하지 않으면 문서도 만들지 않는다.

**입력** — `claude` 를 실행한 뒤 채팅창에

```text
/opsx:explore 혼자 쓰는 할 일 관리 앱의 첫 버전에 꼭 필요한 기능과 빼도 되는 기능을 같이 정리해 줘. 새로 고침해도 데이터가 남아야 한다는 점은 꼭 지키고 싶어.
```

AI가 질문하고 선택지를 제시하면 대화로 답한다. 정리가 끝나면 AI가 "변경을 시작할까요?"라고 제안할 수 있다. 이 가이드에서는 이름을 고정하기 위해 **"아니요, propose로 직접 시작할게요"** 라고 답하고 4단계로 넘어간다.

## 규칙

- explore는 **생각을 정리하는 단계**다. 결정된 내용(필수 기능, 범위 밖)을 메모해 두었다가 4단계 propose 입력에 넣는다.
- 이미 무엇을 만들지 분명하면 이 단계를 건너뛰어도 된다.
- 기존 코드가 있는 프로젝트라면 AI가 코드베이스를 읽고 현재 구조를 설명해 준다. 브라운필드에서 특히 유용하다.

## 산출물

- 파일 없음 (대화만). 요청한 경우에만 변경 폴더나 문서가 생긴다.

## 체크리스트

- [ ] 첫 버전에 넣을 기능 목록을 정했다. (예: 추가, 완료 체크/해제, 삭제, 전체/진행 중/완료 필터, 남은 개수, 새로 고침 후 유지)
- [ ] 범위 밖 항목을 정했다. (예: 로그인, 여러 사용자, 마감일)
- [ ] `openspec/changes/` 아래에 의도하지 않은 폴더가 생기지 않았다. (`openspec list` 로 확인)

---

# 4 단계: 제안(Propose) — 변경과 계획 문서 만들기

**목적** — 하나의 변경 폴더를 만들고, 구현에 필요한 계획 문서 4종(proposal, specs, design, tasks)을 **한 번에** 생성한다.

**입력**

```text
/opsx:propose 변경 이름은 add-todo-list, 새 기능(capability) 이름은 todo-list 로 해 줘. 혼자 쓰는 간단한 할 일 관리 앱의 첫 버전이다. 사용자는 할 일을 입력해 목록에 추가하고, 완료 여부를 체크하거나 해제하고, 필요 없는 할 일을 삭제할 수 있다. 목록은 '전체 / 진행 중 / 완료'로 걸러 볼 수 있고, 남은 할 일 개수가 항상 보인다. 빈 값이나 공백만 입력하면 추가하지 않는다. 페이지를 새로 고치거나 브라우저를 다시 열어도 목록이 그대로 남아 있어야 한다. 로그인, 여러 사용자, 마감일은 이번 범위가 아니다.
```

## 규칙

- **변경 이름**은 kebab-case 동사형(`add-…`, `update-…`, `remove-…`)으로 짓는다. 이름을 지정하지 않으면 AI가 정하므로 경로가 문서와 달라질 수 있다.
- **기능(capability) 이름**은 "이번 작업"이 아니라 **오래 유지될 시스템 동작** 단위로 짓는다. (`todo-list` ✓, `add-todo-page` ✗) 이 이름이 `openspec/specs/todo-list/` 가 된다.
- propose 입력에는 **무엇을·왜·범위 밖**을 적고, 기술 선택은 `config.yaml` 의 context가 담당하게 한다.
- 산출물은 의존 순서대로 만들어진다: proposal → (specs, design) → tasks. AI가 각 문서를 쓰기 전에 알려 준다.
- 모르는 부분이 있으면 AI가 질문할 수 있다. 짧게 답한다.

## 산출물

```
openspec/changes/add-todo-list/
├── .openspec.yaml              ← 변경 메타데이터 (schema: spec-driven)
├── proposal.md                 ← Why / What Changes / Capabilities / Impact
├── specs/
│   └── todo-list/
│       └── spec.md             ← 델타 명세: ## ADDED Requirements …
├── design.md                   ← Context / Goals·Non-Goals / Decisions / Risks
└── tasks.md                    ← ## 1. … - [ ] 1.1 …
```

델타 명세 예시(발췌, AI 출력은 매번 조금씩 다르다):

```markdown
## ADDED Requirements

### Requirement: 할 일 추가
시스템은 사용자가 입력한 텍스트로 새 할 일을 목록 끝에 추가해야 한다(SHALL).

#### Scenario: 정상 추가
- **WHEN** 사용자가 "우유 사기"를 입력하고 Enter 를 누른다
- **THEN** 목록 끝에 "우유 사기"가 미완료 상태로 추가된다

#### Scenario: 빈 입력 거부
- **WHEN** 사용자가 공백만 입력하고 Enter 를 누른다
- **THEN** 할 일이 추가되지 않는다
```

## 체크리스트

- [ ] `openspec list` 에 `add-todo-list` 가 보인다.
- [ ] 위 구조의 파일 4종(proposal.md, specs/todo-list/spec.md, design.md, tasks.md)이 생겼다.
- [ ] proposal.md 의 Capabilities → New Capabilities 에 `todo-list` 가 있다.
- [ ] proposal.md 에 범위 밖(로그인·여러 사용자·마감일)이 적혀 있다(2단계 rules).
- [ ] 문서가 한국어로 작성되었다(2단계 context).

---

# 5 단계: 검토와 수정 (Review & Update)

**목적** — 구현 전에 사람이 계획을 **읽고 검증하고 고친다.** OpenSpec에서 가장 중요한 단계다. "AI가 엉뚱한 것을 자신 있게 만드는 것"을 여기서 막는다.

**입력** — 🖥️ 터미널(새 탭)에서 상태 확인과 검증

```bash
openspec status --change add-todo-list
openspec validate add-todo-list --strict
openspec show add-todo-list
```

🤖 Claude Code에서 수정이 필요할 때 (예시)

```text
/opsx:update add-todo-list - 할 일 텍스트는 최대 200자까지만 허용하고, 삭제할 때는 확인 창 없이 바로 삭제한다. 관련 명세 시나리오와 작업도 맞춰 줘.
```

## 규칙

- 검토 순서: **proposal(범위가 맞나?) → specs(시나리오가 내가 원하는 동작인가?) → design(결정이 context와 맞나?) → tasks(빠진 작업·테스트가 없나?)**
- `openspec validate --strict` 가 실패하면 대부분 형식 문제다: 시나리오 제목의 `####` 개수, 시나리오 없는 요구사항, `SHALL`/`MUST` 누락. 오류 메시지를 Claude Code에 붙여 넣고 고쳐 달라고 하면 된다.
- `/opsx:update` 는 **계획 문서만** 고치며, 고칠 때마다 **확인을 요청**한다. 하나를 고치면 연관된 다른 문서도 함께 맞춰 준다.
- 파일을 편집기로 직접 고쳐도 된다. 그 후 `/opsx:update add-todo-list` 를 내용 없이 실행하면 문서 간 모순을 점검해 준다.
- 변경의 **의도 자체**가 바뀌면 update가 아니라 **새 변경**을 만든다.

## 산출물

- `openspec status` 출력:

```
Change: add-todo-list
Schema: spec-driven
Progress: 4/4 artifacts complete

[x] proposal
[x] specs
[x] design
[x] tasks

All planning artifacts complete!
```

- `openspec validate` 출력: `Change 'add-todo-list' is valid`
- (수정한 경우) 갱신된 proposal/specs/design/tasks

## 체크리스트

- [ ] `status` 가 `4/4 artifacts complete` 이다.
- [ ] `validate --strict` 가 `is valid` 를 출력한다.
- [ ] 명세의 모든 시나리오를 읽고 내가 원하는 동작인지 확인했다.
- [ ] tasks.md 에 테스트 작업과 각 작업의 확인 방법이 있다(2단계 rules).
- [ ] 수정한 내용이 있다면 관련 문서 모두에 반영되었다.

---

# 6 단계: 구현(Apply)

**목적** — `tasks.md` 의 작업을 순서대로 실행해 **코드를 만들고**, 끝난 작업을 `[x]` 로 체크한다.

**입력**

```text
/opsx:apply add-todo-list
```

## 규칙

- AI가 파일 생성·명령 실행(`node --test` 등) 권한을 물으면 내용을 확인하고 허용한다.
- 중간에 끊겨도 다시 `/opsx:apply add-todo-list` 를 실행하면 **체크되지 않은 작업부터 이어서** 진행한다. 진행 상태는 tasks.md 체크박스로만 관리된다.
- 구현 중 설계를 바꿔야 하면 코드부터 고치지 말고 `/opsx:update` 로 **계획을 먼저 고친 뒤** 다시 apply 한다.
- 모든 작업이 체크되면 AI가 "보관 전에 검토·검증하라"고 안내한다. 바로 archive 하지 말고 직접 실행해서 확인한다.

## 산출물

```
my-todo-openspec/
├── index.html
├── styles.css
├── package.json          {"type": "module"}
├── src/ todo.js  storage.js  app.js
├── tests/ todo.test.js
└── openspec/changes/add-todo-list/tasks.md   ← 모든 작업 [x]
```

## 체크리스트

- [ ] tasks.md 의 모든 작업이 `[x]` 이다.
- [ ] `node --test` 가 통과한다.
- [ ] [SAMPLE.md](SAMPLE.md) 의 순서대로 앱을 실행하고, 모든 시나리오(추가·완료·필터·삭제·데이터 유지·키보드)가 명세대로 동작함을 확인했다.

---

# 7 단계: 병합과 보관 (Sync & Archive)

**목적** — 구현이 끝난 변경의 델타 명세를 **기준 명세(`openspec/specs/`)에 병합**하고, 변경 폴더를 **이력으로 보관**한다. 다음 변경은 이 최신 기준 명세를 출발점으로 삼는다.

**입력**

```text
/opsx:archive add-todo-list
```

AI가 "Delta specs: Not yet synced → Sync now?" 라고 물으면 **예**로 답한다.

(선택) 보관하기 전에 병합만 먼저 하고 싶다면:

```text
/opsx:sync add-todo-list
```

## 규칙

- archive는 미완료 작업이 있어도 막지는 않고 **경고만** 한다. 경고가 나오면 멈추고 남은 작업을 처리한다.
- 병합 규칙: **ADDED → 기준 명세에 추가**, **MODIFIED → 같은 이름의 요구사항을 통째로 교체**, **REMOVED → 삭제**.
- 새 기능의 기준 명세가 처음 만들어지면 `## Purpose` 가 `TBD - created by archiving change …` 로 채워진다. **한두 문장으로 직접 고쳐 둔다.**
- 보관된 변경 폴더(`changes/archive/`)는 삭제하지 않는다. "왜 이렇게 바뀌었나"의 기록이다. 모두 git에 커밋한다.

## 산출물

```
openspec/
├── specs/
│   └── todo-list/
│       └── spec.md                              ← 새로 생긴 기준 명세 (## Purpose, ## Requirements)
└── changes/
    └── archive/
        └── 2026-10-11-add-todo-list/            ← 날짜(YYYY-MM-DD)-변경이름
            ├── proposal.md  design.md  tasks.md  .openspec.yaml
            └── specs/todo-list/spec.md
```

터미널에서 `openspec archive add-todo-list` 를 직접 실행했을 때의 출력 예:

```
Specs to update:
  todo-list: create
Applying changes to openspec/specs/todo-list/spec.md:
  + 6 added            ← 숫자는 요구사항 개수에 따라 다름
Specs updated successfully.
Change 'add-todo-list' archived as '2026-10-11-add-todo-list'.
```

## 체크리스트

- [ ] `openspec list` 가 `No active changes found.` 를 출력한다.
- [ ] `openspec list --specs` 에 `todo-list` 와 요구사항 개수가 보인다.
- [ ] `openspec/specs/todo-list/spec.md` 의 `## Purpose` 를 직접 다듬었다.
- [ ] `openspec/changes/archive/YYYY-MM-DD-add-todo-list/` 가 생겼다.
- [ ] `git add -A && git commit` 으로 명세·코드·이력을 함께 커밋했다.

---

# 8 단계: (도전) 두 번째 변경 — 기존 명세 수정하기

**목적** — 이미 있는 기준 명세(`openspec/specs/todo-list/spec.md`)를 **델타 명세로 수정**하는 순환을 한 번 더 돌린다. OpenSpec의 진가는 이 두 번째 변경에서 드러난다.

**입력** — 7단계까지 끝낸 상태에서

```text
/opsx:propose 변경 이름은 add-due-date 로 하고, 기존 기능 todo-list 를 수정하는 변경으로 만들어 줘. 사용자는 할 일을 추가할 때 선택적으로 마감일을 지정할 수 있다. 마감일이 지난 미완료 할 일은 눈에 띄게 표시된다. 목록을 마감일이 가까운 순으로 정렬해 볼 수 있다. 기존에 저장된 마감일 없는 할 일도 그대로 보여야 한다. 알림 기능은 범위 밖이다.
```

이어서 5~7단계와 같은 순서로 진행한다.

```bash
openspec validate add-due-date --strict      # 🖥️ 터미널
openspec show add-due-date
```

```text
/opsx:apply add-due-date
```

앱 확인([SAMPLE.md 8단계](SAMPLE.md#8단계-도전-마감일-기능-써-보기)) 후

```text
/opsx:archive add-due-date
```

## 규칙

- 기존 기능을 바꾸는 변경이므로 proposal.md 의 **Modified Capabilities** 에 `todo-list` 가 들어가야 한다. New Capabilities 에 새 이름이 생기면 기능이 둘로 쪼개진 것이니 `/opsx:update` 로 바로잡는다.
- 기존 요구사항(예: 할 일 추가)의 동작이 바뀌면 `## MODIFIED Requirements` 에 **요구사항 전체 내용**을 다시 적어야 한다. archive 때 통째로 교체되기 때문이다.
- 저장 데이터 형식이 바뀌므로 **예전 데이터 호환**(마감일 없는 할 일)을 명세 시나리오와 테스트에 꼭 포함한다.

## 산출물

```
openspec/changes/add-due-date/
├── proposal.md                 ← Modified Capabilities: todo-list
├── specs/todo-list/spec.md     ← ## ADDED Requirements (+ 필요하면 ## MODIFIED Requirements)
├── design.md
└── tasks.md
```

archive 후:

```
openspec/specs/todo-list/spec.md                    ← 마감일 요구사항이 합쳐짐 (파일은 여전히 하나)
openspec/changes/archive/YYYY-MM-DD-add-todo-list/
openspec/changes/archive/YYYY-MM-DD-add-due-date/
```

## 체크리스트

- [ ] proposal.md 의 Modified Capabilities 에 `todo-list` 가 있다.
- [ ] `openspec validate add-due-date --strict` 가 `is valid` 이다.
- [ ] `node --test` 가 통과하고, SAMPLE.md 8단계 시나리오가 모두 동작한다.
- [ ] archive 후 `openspec/specs/todo-list/spec.md` 에 마감일 요구사항이 들어 있다.
- [ ] `openspec/changes/archive/` 아래에 변경이 2개 있다.
- [ ] `git add -A && git commit` 으로 커밋했다.

---

## 명령 한눈에 보기

**Claude Code 슬래시 커맨드 (기본 `core` 프로필)**

| 명령 | 하는 일 | 파일을 쓰나? |
| --- | --- | --- |
| `/opsx:explore [주제]` | 아이디어를 함께 생각하고 선택지를 비교 (선택) | 코드는 절대 안 씀. 요청할 때만 문서 작성 |
| `/opsx:propose [이름 또는 설명]` | 변경 폴더를 만들고 proposal → specs → design → tasks 를 한 번에 생성 | ✔ 계획 문서 |
| `/opsx:update [변경]` | 계획 문서를 수정하고 서로 일관되게 맞춤 (편집마다 확인 요청) | ✔ 계획 문서만 (코드 X) |
| `/opsx:apply [변경]` | tasks.md 순서대로 구현하고 `[x]` 체크 | ✔ 코드 |
| `/opsx:sync [변경]` | 델타 명세를 기준 명세에 미리 병합 (선택) | ✔ `openspec/specs/` |
| `/opsx:archive [변경]` | 완료 확인 → 명세 병합 → `changes/archive/` 로 이동 | ✔ |

**확장 명령 (선택)** — `openspec config profile` 로 켠 뒤 프로젝트에서 `openspec update`:
`/opsx:new`, `/opsx:continue`, `/opsx:ff`, `/opsx:verify`, `/opsx:bulk-archive`, `/opsx:onboard`

**자주 쓰는 터미널 명령**

| 명령 | 하는 일 |
| --- | --- |
| `openspec list` / `openspec list --specs` | 진행 중인 변경 목록 / 기준 명세 목록 |
| `openspec status --change <변경>` | 산출물 4종의 완료 상태 |
| `openspec show <변경 또는 명세>` | 내용 보기 |
| `openspec validate <변경> --strict` | 형식 검증 |
| `openspec view` | 대화형 대시보드 |
| `openspec archive <변경>` | 터미널에서 직접 보관 |

## 이 가이드의 단계

| 단계 | 내용 | 사용하는 명령 |
| --- | --- | --- |
| 1 | 설치와 프로젝트 초기화 | `npm i -g`, `openspec init` |
| 2 | 프로젝트 맥락 설정 | `openspec/config.yaml` 편집 |
| 3 | 탐색: 아이디어 정리 (선택) | `/opsx:explore` |
| 4 | 제안: 변경과 계획 문서 만들기 | `/opsx:propose` |
| 5 | 검토와 수정 | `openspec status/show/validate`, `/opsx:update` |
| 6 | 구현 | `/opsx:apply` |
| 7 | 병합과 보관 | `/opsx:sync`(선택), `/opsx:archive` |
| 8 | (도전) 두 번째 변경으로 기존 명세 수정 | `/opsx:propose` → `apply` → `archive` |

> 📌 실습 예제: 모든 입력 예시는 M01 Kiro와 같은 **"할 일 관리 웹 앱"** 을 OpenSpec으로 만드는 경우를 기준으로 한다. 변경 이름은 `add-todo-list`, 기능(capability) 이름은 `todo-list` 로 고정해 경로가 문서와 똑같이 나오게 한다. 완성된 앱을 실행·사용·확인하는 방법은 [SAMPLE.md](SAMPLE.md) 에 있다.

# 부록 A. CLAUDE.md 규칙 조각

OpenSpec 프로젝트 루트의 `CLAUDE.md` 에 붙여 두면, 슬래시 커맨드 밖에서 대화할 때도 같은 흐름을 지킨다.

```markdown
## OpenSpec 규칙

- 이 프로젝트는 OpenSpec으로 스펙 주도 개발을 한다. 프로젝트 맥락과 규칙은 `openspec/config.yaml` 을 따른다.
- 현재 시스템 동작은 `openspec/specs/` 가 기준이다. 동작을 바꾸는 요청을 받으면 코드를 바로 고치지 말고 `/opsx:propose` 로 변경을 먼저 만들자고 제안한다.
- 진행 중인 변경은 `openspec list` 로 확인한다. 구현은 해당 변경의 `tasks.md` 순서를 따르고, 끝난 작업은 `[x]` 로 체크한다.
- 계획이 바뀌면 `/opsx:update` 로 proposal·specs·design·tasks 를 함께 고친 뒤 구현한다.
- 명세는 한국어로 쓰되 `SHALL`/`MUST` 키워드와 `## ADDED Requirements` 같은 구조 제목은 영어로 둔다. 시나리오 제목은 `####` 4개를 쓴다.
- archive 전에 `openspec validate <변경> --strict` 와 테스트를 실행한다.
```

# 부록 B. 자주 겪는 문제

| 증상 | 원인 / 해결 |
| --- | --- |
| `command not found: openspec` | npm 전역 bin 경로가 PATH에 없음. `npm prefix -g` 로 위치 확인 후 PATH 추가, 또는 터미널 재시작 |
| `openspec --version` 이 예전 버전 | 다른 Node 버전(nvm 등)에 예전 CLI가 설치됨. 현재 Node에서 다시 `npm install -g …@latest` |
| Claude Code에 `/opsx:` 가 안 보인다 | 프로젝트 폴더 **안에서** `claude` 를 실행했는지 확인. `ls .claude/commands/opsx` 로 파일 확인. 실행 중이었다면 Claude Code 재시작 |
| `/openspec:proposal` 이 안 된다 | 예전 명령이다. 현재는 `/opsx:propose` |
| `/opsx:verify`, `/opsx:ff` 가 없다 | 기본 `core` 프로필에 없음. `openspec config profile` 로 추가 후 `openspec update` |
| `validate` 에서 시나리오 관련 오류 | 시나리오 제목은 `#### Scenario:` (`#` 4개). 요구사항마다 시나리오 1개 이상 |
| `validate` 에서 SHALL/MUST 오류 | 요구사항 문장에 영어 `SHALL` 또는 `MUST` 를 포함 (예: "…해야 한다(SHALL)") |
| 문서가 영어로 나온다 | `config.yaml` 의 `context` 에 언어 설정 3줄이 있는지 확인 |
| `.claude`, `openspec` 안 파일이 Finder에 안 보인다 | 숨김 파일. `⌘ + Shift + .` 또는 터미널 `ls -a` |
| 브라우저 화면이 비어 있다 | ES 모듈은 `file://` 로 열면 막힌다. `python3 -m http.server 8000` 주소로 접속 |

# 부록 C. 용어 정리

| 용어 | 뜻 |
| --- | --- |
| Change (변경) | 시스템을 바꾸려는 작업 단위. `openspec/changes/<이름>/` 폴더 하나 |
| Capability (기능 영역) | 오래 유지되는 시스템 동작 단위. `openspec/specs/<이름>/spec.md` 하나 |
| Spec (기준 명세) | 현재 시스템이 어떻게 동작하는지. 진실의 원천 |
| Delta Spec (델타 명세) | 변경으로 인해 달라지는 요구사항만 적은 명세 (ADDED / MODIFIED / REMOVED) |
| Requirement / Scenario | 시스템이 해야 하는 일(SHALL/MUST) / 이를 확인하는 구체적 상황(WHEN/THEN) |
| Artifact (산출물) | proposal, specs, design, tasks 문서 |
| Schema | 산출물 종류와 순서를 정의한 워크플로. 기본은 `spec-driven` |
| Sync / Archive | 델타 명세를 기준 명세에 병합 / 병합 후 변경 폴더를 이력으로 이동 |
| Profile | 설치할 명령 세트. 기본 `core`, 확장은 `custom` |
| Brownfield | 이미 코드가 있는 기존 프로젝트 (반대: Greenfield, 새 프로젝트) |
