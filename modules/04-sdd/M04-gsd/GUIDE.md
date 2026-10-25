# 개념

## GSD란?

**GSD**(Get Shit Done → 현재 이름 **GSD Core**, 구호는 *"Git. Ship. Done."*)는 Claude Code 안에 **명령어 + 역할별 서브에이전트 + 상태 문서**를 설치해, AI가 큰 일을 해도 품질이 떨어지지 않도록 일하는 방식을 관리하는 스펙 주도 개발(SDD) 시스템이다.

### 왜 필요한가 — 컨텍스트 rot

AI와 대화가 길어지면 앞의 내용이 쌓여 컨텍스트 창이 가득 차고, 답의 품질이 조용히 떨어진다("이제 더 간결하게 하겠습니다…"). 이것을 **컨텍스트 rot** 이라 부른다. GSD는 세 가지로 이를 막는다.

| 방법 | 설명 |
| --- | --- |
| **서브에이전트** | 리서치·기획·구현·검증 같은 무거운 일은 **매번 새 컨텍스트**를 가진 전문 에이전트가 처리한다. 메인 대화는 지휘만 한다. |
| **상태 문서** | 결정·진행 상황을 `.planning/` 의 Markdown 파일(`STATE.md` 등)에 적어 둔다. `/clear` 로 대화를 비워도 다음 명령이 파일을 읽고 이어 간다. |
| **작게 쪼개기** | 일을 마일스톤 → 단계(phase) → 계획(plan) → 작업(task)으로 나눠, 한 번에 새 컨텍스트 하나로 끝낼 수 있는 크기로 만든다. |

## 단계 루프 — GSD의 기본 리듬

```
 /gsd-new-project  (프로젝트당 1회: 질문 → 요구사항 → 로드맵)
        │
        ▼   ROADMAP.md 의 단계(phase)마다 반복
 ┌──────────────────────────────────────────────────────────────┐
 │ ① 논의   /gsd-discuss-phase N   어떻게 만들지 결정 → NN-CONTEXT.md     │
 │ ② 기획   /gsd-plan-phase N      리서치 + XML 작업 계획 → NN-NN-PLAN.md  │
 │ ③ 실행   /gsd-execute-phase N   병렬 웨이브로 구현, 작업마다 git 커밋      │
 │ ④ 검증   /gsd-verify-work N     사람이 하나씩 확인 → NN-UAT.md          │
 │ ⑤ 출시   /gsd-ship N (선택)     PR 생성                              │
 └──────────────────────────────────────────────────────────────┘
        ※ 각 명령 사이에 /clear 로 대화를 비운다 (문서가 기억을 대신한다)
```

## 산출물 지도 — `.planning/`

```
.planning/
├── PROJECT.md            프로젝트 비전·제약 (항상 읽힘)
├── REQUIREMENTS.md       v1 / v2 / 범위 밖 요구사항 + REQ-ID
├── ROADMAP.md            단계(phase) 목록, 목표, 성공 기준, 상태
├── STATE.md              결정·막힌 점·현재 위치 = 세션 간 기억
├── config.json           워크플로 설정 (모드, 단계 크기, 언어 …)
├── research/             (리서치를 켠 경우) 스택·기능·구조·주의점 조사
└── phases/
    └── 01-<단계이름>/
        ├── 01-CONTEXT.md        ① 논의 결과: 구현 결정 사항
        ├── 01-RESEARCH.md       ② 기획 전 조사
        ├── 01-01-PLAN.md        ② 작업 계획 (XML <task> 블록)
        ├── 01-02-PLAN.md
        ├── 01-01-SUMMARY.md     ③ 실행 결과 요약
        ├── 01-VERIFICATION.md   ③ 자동 검증: 요구사항 충족 여부
        └── 01-UAT.md            ④ 사람 인수 테스트 결과
```

PLAN 파일의 작업은 이런 XML 블록이다. `<verify>` 의 명령을 실행기가 직접 돌려 본다.

```xml
<task type="auto">
  <name>할 일 추가 로직 구현</name>
  <files>src/todo.js, tests/todo.test.js</files>
  <action>addTodo(todos, text): 앞뒤 공백 제거, 빈 값·200자 초과 거부 …</action>
  <verify>node --test</verify>
  <done>빈 입력은 거부되고 정상 입력은 목록 끝에 추가된다</done>
</task>
```

## 명령 한눈에 보기 (이 모듈에서 쓰는 것)

| 명령 | 하는 일 |
| --- | --- |
| `/gsd-help` | 설치 확인, 전체 명령 안내 |
| `/gsd-new-project` | 질문 → (리서치) → 요구사항 → 로드맵 생성 |
| `/gsd-discuss-phase N` | N단계의 구현 방식 결정 (화면 배치, 오류 처리 등) |
| `/gsd-plan-phase N` | N단계 리서치 + 작업 계획 + 계획 검사 |
| `/gsd-execute-phase N` | N단계 계획을 서브에이전트로 실행, 작업마다 커밋, 자동 검증 |
| `/gsd-verify-work N` | N단계를 사람이 직접 확인 (실패 시 수정 계획 생성) |
| `/gsd-progress` / `/gsd-progress --next` | 지금 어디인지 / 다음 할 일 자동 진행 |
| `/gsd-quick "할 일"` | 단계 없이 작은 작업을 빠르게 (`--full` 이면 논의·리서치·검증 포함) |
| `/gsd-settings` | 워크플로 설정 바꾸기 |
| `/gsd-ship N` | (선택) GitHub PR 생성 |
| `/clear` | Claude Code 기본 명령. 대화 비우기 — **GSD 명령 사이마다** 사용 |

> GSD는 이 밖에도 70개 넘는 명령이 있지만 처음에는 위 목록만으로 충분하다. `/gsd-help` 로 전체를 볼 수 있다.

## 이 가이드의 단계

| 단계 | 내용 | 주로 쓰는 명령 |
| --- | --- | --- |
| 1 | 설치 | `npx @opengsd/gsd-core@latest --claude --local` |
| 2 | Claude Code 실행과 권한 설정 | `claude`, `/gsd-help` |
| 3 | 프로젝트 만들기 — 질문·요구사항·로드맵 | `/gsd-new-project` |
| 4 | 단계 논의 | `/gsd-discuss-phase 1` |
| 5 | 단계 기획 | `/gsd-plan-phase 1` |
| 6 | 단계 실행 — 앱 만들기 | `/gsd-execute-phase 1` |
| 7 | 작업 검증 (사람 확인) | `/gsd-verify-work 1` |
| 8 | 남은 단계 진행과 마무리 | `/gsd-progress --next`, (선택) `/gsd-ship` |
| 9 | (도전) 마감일 기능 빠르게 추가 | `/gsd-quick --full` |

> 📌 실습 예제: M01~M03과 같은 **"할 일 관리 웹 앱"** 을 GSD로 만든다. 프로젝트 폴더는 `my-todo-gsd`. 완성된 앱을 실행·사용·확인하는 방법은 [SAMPLE.md](SAMPLE.md) 에 있다.

---

# 1 단계: 설치

**목적** — GSD Core를 실습 프로젝트에만(local) 설치한다.

**입력** — 🖥️ 터미널

```bash
# 1) 준비물 확인
node --version      # v20 이상
git --version
claude --version

# 2) 프로젝트 폴더 + git 저장소 (GSD는 작업마다 커밋하므로 git 필수)
mkdir -p ~/git/my-todo-gsd && cd ~/git/my-todo-gsd
git init

# 3) GSD Core 설치 — Claude Code 용, 이 폴더에만
npx @opengsd/gsd-core@latest --claude --local

# 4) 설치 결과 확인
ls .claude
ls .claude/commands | grep -c '^gsd-'      # 명령 개수
ls .claude/agents   | grep -c '^gsd-'      # 서브에이전트 개수
```

| 옵션 | 의미 |
| --- | --- |
| `--claude` | Claude Code 용으로 설치 (생략하면 런타임을 고르는 메뉴가 나온다) |
| `--local` | 현재 폴더의 `.claude/` 에만 설치 (`--global` 은 모든 프로젝트용 `~/.claude/`) |

## 규칙

- 패키지 이름은 **`@opengsd/gsd-core`** 다. 인터넷 글의 `npx get-shit-done-cc` 는 예전 이름이며 npm에서 지원 중단(deprecated) 표시가 붙어 있다. 쓰지 않는다.
- 이 모듈에서는 **`--local`** 로 설치한다. 실습 폴더에만 영향을 주고, 다른 프로젝트의 Claude Code 설정을 건드리지 않는다.
- `.claude` 는 이름이 `.` 으로 시작하는 **숨김 폴더**다. Finder에서는 `⌘ + Shift + .`, 터미널에서는 `ls -a` 로 본다.
- 처음 `npx` 실행 때 패키지를 내려받느라 시간이 걸린다. "Ok to proceed? (y)" 를 물으면 `y`.

## 산출물

설치 화면 (발췌):

```
  GSD Core v1.16.0
  Git. Ship. Done.
  Installing for Claude Code to ./.claude

  ✓ Installed workflow assets
  ✓ Installed 72 commands to commands/ (gsd-<cmd>.md flat form)
  ✓ Installed agents
  ✓ Configured context window monitor hook
  …
  Done! Open a blank directory in Claude Code and run /gsd-new-project.
```

```
my-todo-gsd/
├── .git/
└── .claude/
    ├── commands/     gsd-new-project.md, gsd-plan-phase.md … (72개)
    ├── agents/       gsd-planner.md, gsd-executor.md, gsd-verifier.md … (35개)
    ├── gsd-core/     워크플로 정의·템플릿·도구
    ├── hooks/        컨텍스트 감시 등 보조 스크립트
    └── settings.local.json
```

## 체크리스트

- [ ] 설치 화면 마지막에 `Done!` 이 보였다.
- [ ] `ls .claude/commands | grep -c '^gsd-'` 가 70 이상이다. (버전에 따라 조금 다를 수 있다)
- [ ] `ls .claude/agents | grep -c '^gsd-'` 가 30 이상이다.

---

# 2 단계: Claude Code 실행과 권한 설정

**목적** — Claude Code를 열고 GSD 명령이 보이는지 확인한다. GSD는 서브에이전트가 파일 읽기·쓰기, `git commit` 등을 아주 많이 하므로 **권한 확인 방식**을 먼저 정한다.

**입력** — 🖥️ 터미널, `my-todo-gsd` 폴더 안에서 둘 중 하나

**방법 A (공식 권장) — 권한 확인 건너뛰기**

```bash
claude --dangerously-skip-permissions
```

> ⚠️ Claude가 묻지 않고 명령을 실행한다. **이 실습 폴더처럼 망가져도 괜찮은 곳에서만** 쓴다. 중요한 파일이 있는 폴더에서는 쓰지 않는다.

**방법 B (안전) — 자주 쓰는 명령만 미리 허용**

```bash
mkdir -p .claude && cat > .claude/settings.json <<'EOF'
{
  "permissions": {
    "allow": [
      "Bash(git add:*)", "Bash(git commit:*)", "Bash(git status:*)",
      "Bash(git log:*)", "Bash(git diff:*)", "Bash(mkdir:*)", "Bash(ls:*)",
      "Bash(cat:*)", "Bash(date:*)", "Bash(node:*)"
    ]
  }
}
EOF
claude
```

그다음 🤖 **Claude Code** 에서:

```text
/gsd-help
```

## 규칙

- 방법 B를 써도 처음 보는 명령은 Claude Code가 허용 여부를 묻는다. 내용을 읽고 허용한다.
- 반드시 `my-todo-gsd` 폴더 **안에서** `claude` 를 실행한다. `--local` 로 설치했기 때문에 다른 폴더에서는 `/gsd-*` 명령이 보이지 않는다.
- 입력창에 `/gsd` 까지만 치면 자동 완성 목록이 나온다.

## 산출물

- (방법 B) `.claude/settings.json`
- `/gsd-help` 출력 — 명령 목록과 사용법

## 체크리스트

- [ ] `/gsd` 를 입력하면 `/gsd-new-project`, `/gsd-plan-phase` 등이 자동 완성 목록에 보인다.
- [ ] `/gsd-help` 가 명령 안내를 출력했다.

---

# 3 단계: 프로젝트 만들기 — 질문 · 요구사항 · 로드맵

**목적** — `/gsd-new-project` 로 GSD와 대화하며 무엇을 만들지 정하고, 요구사항(`REQUIREMENTS.md`)과 단계별 로드맵(`ROADMAP.md`)을 만든다.

**입력** — 🤖 Claude Code

```text
/gsd-new-project
```

GSD가 아래 순서로 묻는다. 화면의 선택지는 영어로 나오며, 답은 한국어로 해도 된다.

### 3-1. 무엇을 만들까요? (What do you want to build?)

아래를 그대로 붙여 넣는다.

```text
혼자 쓰는 간단한 할 일 관리 웹 앱을 만들고 싶다.
- 할 일을 입력해 목록 끝에 추가(Enter, 추가 버튼). 빈 값·공백만 입력은 거부하고 안내 문구 표시. 최대 200자.
- 완료 체크/해제, 확인 창 없이 즉시 삭제.
- '전체 / 진행 중 / 완료' 필터, 남은(미완료) 할 일 개수 항상 표시.
- 새로 고침하거나 브라우저를 다시 열어도 목록과 완료 상태 유지.
- 모든 기능을 키보드만으로 사용 가능.
- 범위 밖: 로그인, 여러 사용자, 서버 저장, 마감일.
기술 제약:
- 빌드 도구·프레임워크·npm 의존성 없이 순수 HTML/CSS/JavaScript(ES 모듈).
- 저장은 브라우저 localStorage 만.
- 테스트는 Node.js 내장 테스트 러너(node --test)만, 외부 테스트 라이브러리 금지. package.json 에는 "type": "module" 만.
- 구조: index.html, src/todo.js(순수 함수), src/storage.js(localStorage), src/app.js(화면·이벤트), tests/todo.test.js
- 로컬 실행: python3 -m http.server 8000
문서와 대답은 한국어로 해 줘.
```

이어서 GSD가 몇 가지 후속 질문을 한다. 자연스럽게 답한다. (예: "필터 상태도 저장할까요?" → "아니요, 새로 고침하면 전체로 돌아가도 됩니다")

### 3-2. 워크플로 설정 (Workflow Preferences)

질문은 **한 화면에 최대 4개씩 묶여** 나온다. 묶음 하나에 모두 답하면 다음 묶음이 나온다. 묶음을 나누는 것은 GSD를 실행하는 AI이므로 순서나 묶음 경계가 화면마다 조금 다를 수 있다 — 표의 **header** 이름(선택지 위의 작은 라벨)으로 찾아 답한다.

> 💡 `~/.gsd/defaults.json` (이전에 저장한 기본값)이 있으면 먼저 **Defaults** 질문이 나온다. 이 실습에서는 **Configure fresh** 를 골라 아래 질문을 모두 직접 답한다.

#### ① 기본 작업 방식

| 질문 (header) | 고를 것 | 이유 |
| --- | --- | --- |
| **Mode** | **Interactive** | 처음에는 단계마다 확인하며 무엇이 일어나는지 본다 (도구 기본 권장은 YOLO) |
| **Granularity** | **Coarse** | 작은 앱이므로 단계 수를 적게 |
| **Execution** | Parallel (Recommended) | 독립 작업은 동시에 |
| **Git Tracking** | Yes (Recommended) | `.planning/` 문서도 git 이력에 남김 |
| **Research** | **No** | 할 일 앱은 잘 알려진 영역 → 토큰·시간 절약 |

> Mode 는 따로 먼저 나오고, 이어서 Granularity · Execution · Git Tracking · Research 4개가 한 묶음으로 나오는 경우가 많다.

#### ② 품질 검사 에이전트

계획·실행 전후에 추가 에이전트를 돌릴지 정한다. 토큰과 시간이 더 들지만 품질이 올라간다.

| 질문 (header) | 고를 것 | 이유 |
| --- | --- | --- |
| **Plan Check** | Yes (Recommended) | 계획이 목표를 달성하는지 실행 전에 검사 |
| **Verifier** | Yes (Recommended) | 실행 후 요구사항 충족 자동 검증 |
| **Compact Content** | No (Recommended) | 처음에는 자세한 지시 유지 (Yes 는 지시문을 줄여 컨텍스트 절약) |

#### ③ AI 모델 — 두 번에 나눠 묻는다

선택지가 5개(Adaptive·Quality·Balanced·Budget·Inherit)라서 먼저 **AI Models** 로 큰 방향을 고르고, **Standard tier…** 를 골랐을 때만 **Model Tier** 가 이어서 나온다.

| 질문 (header) | 고를 것 | 이유 |
| --- | --- | --- |
| **AI Models** | **Standard tier…** | 정해진 등급을 모든 에이전트에 똑같이 적용 |
| **Model Tier** (조건부) | **Balanced** (요금이 걱정되면 Budget) | 기획은 Opus, 리서치·실행·검증은 Sonnet |

| AI Models 선택지 | 뜻 | Model Tier 질문 |
| --- | --- | --- |
| Adaptive (Recommended) | 무거운 역할은 상위 모델, 가벼운 역할은 저렴한 모델을 자동 배정 | 나오지 않음 |
| Standard tier… | Quality / Balanced / Budget 중 하나를 모든 에이전트에 적용 | **나옴** |
| Inherit | 지금 세션의 모델을 모든 에이전트가 그대로 사용 (Claude 외 런타임용) | 나오지 않음 |

> 도구의 기본 권장은 **Adaptive** 다. 이것을 골라도 실습에 문제가 없으며, 이 경우 Model Tier 질문은 건너뛰고 바로 ④로 간다.

#### ④ PR 본문 구성 (PR Body) — 여러 개 선택 가능

`/gsd-ship` (8단계, 선택)이 PR을 만들 때 **기본 본문 뒤에 덧붙일 섹션**을 고른다. 기본 섹션(요약·변경 사항·검증 결과 등)은 항상 들어가며 여기서 고르는 것은 추가분이다. **복수 선택**이므로 원하는 항목을 모두 체크한 뒤 제출한다.

| 선택지 | PR 본문에 덧붙는 내용 | 가져오는 곳 | 이 실습 |
| --- | --- | --- | --- |
| **User Stories & Acceptance Criteria** | 사용자 스토리와 인수 기준 | `REQUIREMENTS.md` | ✅ 선택 |
| **Success Metrics & Release Criteria** | 완료 정의(DoD)와 출시 기준 | `REQUIREMENTS.md`, `VERIFICATION.md` | ✅ 선택 |
| Risks & Dependencies | 배포 위험·의존성·롤백 메모 | `PLAN.md` | 선택 안 함 |
| Stakeholder Review & Approval | 승인 체크리스트 (결재가 필요한 팀용) | 템플릿 | 선택 안 함 |

- 혼자 만드는 작은 앱이므로 **"무엇을 만들었고 어떻게 확인했는지"** 가 드러나는 두 개만 고른다. 위험·승인 섹션은 팀 프로젝트에서 쓴다.
- 고르지 않은 섹션도 `config.json` 의 `ship.pr_body_sections` 에 `"enabled": false` 로 기록된다. 나중에 `true` 로 바꾸면 켜진다.
- 아무것도 고르지 않아도 된다. 그러면 PR 본문은 기본 섹션만으로 만들어진다.
- 원본 문서에 해당 내용(예: `## User Stories`)이 없으면 GSD가 기본 문구로 채운다.

#### ⑤ 리서치 재확인

이어서 리서치 여부를 다시 물으면 **Skip research** 를 고른다.

### 3-3. 요구사항 고르기

GSD가 기능을 범주별로 보여 주며 v1(이번 버전)에 넣을 것을 묻는다. 3-1 에서 말한 기능은 모두 **v1**, 마감일·로그인은 **범위 밖(Out of scope)** 으로 답한다.

정리된 요구사항 목록과 함께 "이 내용이 만들려는 것과 맞나요? (Does this capture what you're building?)" 를 물으면 확인 후 **yes** 로 답한다. 빠진 것이 있으면 adjust 라고 하고 고칠 내용을 말한다.

### 3-4. 프로젝트 구조 방식 고르기 (구조)

요구사항이 확정되면 로드맵을 만들기 직전에 **단계(phase)를 어떤 방식으로 나눌지** 묻는다.

```text
☐ 구조

프로젝트를 어떤 방식으로 단계화할까요?

❯ 1. Vertical MVP (Recommended)
     빨리 동작하는 앱을 만들고 기능을 조각별로 추가. 각 단계가 처음부터 끝까지 동작하는 사용자 기능을 전달
  2. Horizontal Layers
     기술 계층(로직 → 저장 → UI → 연결)을 하나씩 완성한 뒤 마지막에 조립
```

**→ 1. Vertical MVP** 를 고른다.

| 선택지 | 단계를 나누는 기준 | 할 일 앱이라면 | 어울리는 경우 |
| --- | --- | --- | --- |
| **Vertical MVP** | 사용자 기능 하나 = 단계 하나. 단계가 끝날 때마다 화면에서 써 볼 수 있다 | 1단계 "추가·완료·삭제·저장이 되는 앱" → 2단계 "필터·남은 개수·키보드" | 새 제품, 빠르게 만들고 고쳐 가는 작은 앱 (**이 실습**) |
| Horizontal Layers | 기술 계층 하나 = 단계 하나. 마지막에 조립해야 앱이 동작한다 | 1단계 `todo.js` → 2단계 `storage.js` → 3단계 화면 → 4단계 연결 | 인프라 비중이 크고 여러 명이 계층별로 나눠 만드는 프로젝트 |

Vertical MVP 를 고르면 이후 단계에 이런 차이가 생긴다.

- `ROADMAP.md` 의 단계마다 `**Mode:** mvp` 줄이 붙는다.
- 단계 목표가 사용자 스토리("**As a** 사용자, **I want to** …, **so that** …") 형태로 정리된다.
- 1단계 기획(5단계)에서 앱 전체 뼈대를 정리한 `SKELETON.md` 가 함께 만들어질 수 있다.
- 각 계획은 화면 → 로직 → 저장을 가장 얇게 관통하는 작업(`type="tracer"`)으로 시작하고, 그 위에 검증·오류 처리를 덧붙인다.
- 검증(7단계) 질문이 "사용자가 이것을 할 수 있나" 같은 사용자 흐름 중심으로 나온다.

> 💡 Horizontal Layers 를 골라도 앱은 완성된다. 다만 마지막 단계 전까지는 화면에서 확인할 수 있는 것이 거의 없어, 단계마다 직접 써 보며 확인하는 이 실습 흐름과는 잘 맞지 않는다.

### 3-5. 로드맵 승인

"Spawning roadmapper…" 가 나오면 1~5분 기다린다 (서브에이전트가 일하는 동안은 화면에 아무것도 나오지 않는다. 멈춘 것이 아니다). 제안 로드맵이 나오면 확인한다.

```text
Proposed Roadmap

2 phases | 9 requirements mapped | All v1 requirements covered ✓      ← 예시 (숫자는 다를 수 있다)

| # | Phase            | Goal                                   | Requirements |
|---|------------------|----------------------------------------|--------------|
| 1 | 핵심 할 일 기능    | 추가·완료·삭제·저장 + 단위 테스트          | TODO-01 …    |
| 2 | 필터·접근성 마무리 | 필터, 남은 개수, 키보드 사용               | TODO-07 …    |
```

이어서 **Roadmap** 질문이 나온다.

| 선택지 | 뜻 |
| --- | --- |
| **Approve** | 이 로드맵으로 확정하고 커밋 → 괜찮으면 이것을 고른다 |
| Adjust phases | 고칠 내용을 말하면 로드맵을 다시 만든다 (예: "1단계 하나로 합쳐 줘") |
| Review full file | `ROADMAP.md` 원문을 보여 준 뒤 다시 묻는다 |

### 3-6. 응답 언어를 한국어로 고정

🖥️ 터미널 (Claude Code는 그대로 두고 새 탭에서, `my-todo-gsd` 폴더)

```bash
node -e 'const fs=require("fs"),f=".planning/config.json",c=JSON.parse(fs.readFileSync(f));c.response_language="ko";fs.writeFileSync(f,JSON.stringify(c,null,2)+"\n")'
grep response_language .planning/config.json
git add .planning/config.json && git commit -m "chore: GSD 응답 언어 한국어"
```

## 규칙

- 3-1 의 설명에 **기술 제약을 구체적으로** 적는다. GSD는 이것을 `PROJECT.md` 에 기록하고, 이후 모든 서브에이전트가 읽는다. (M01 Kiro에서 AI가 스티어링을 어기고 Vitest를 골랐던 것처럼, 적지 않으면 AI가 임의로 정한다.)
- `response_language: "ko"` 는 모든 서브에이전트에 전달되어 이후 문서·질문이 한국어로 나온다. 화면의 선택지 라벨(Approve 등)은 영어로 남을 수 있다.
- 로드맵은 승인 전에 꼭 읽는다. 모든 v1 요구사항이 어떤 단계엔가 연결되어 있어야 한다("All v1 requirements covered ✓").

## 산출물

```
.planning/
├── PROJECT.md
├── REQUIREMENTS.md     ← REQ-ID (예: TODO-01) 가 붙은 v1 / v2 / Out of scope
├── ROADMAP.md          ← Phase 1, 2 … 각 단계의 Goal·Requirements·Success Criteria
├── STATE.md
└── config.json         ← mode, granularity, workflow.research … , model_profile, ship.pr_body_sections, response_language
```

## 체크리스트

- [ ] `.planning/` 에 위 5개 파일이 있다.
- [ ] `PROJECT.md` 에 기술 제약(순수 JS, localStorage, `node --test`, 의존성 없음)이 적혀 있다.
- [ ] `REQUIREMENTS.md` 의 Out of scope 에 로그인·여러 사용자·마감일이 있다.
- [ ] `ROADMAP.md` 의 단계마다 성공 기준(Success Criteria)이 있다.
- [ ] `config.json` 에 `"response_language": "ko"` 가 있다.
- [ ] `config.json` 의 `model_profile` 이 고른 값(`balanced` 또는 `adaptive` 등)이다.
- [ ] `config.json` 의 `ship.pr_body_sections` 에서 3-2 ④에서 고른 섹션만 `"enabled": true` 다.
- [ ] `git log --oneline` 에 GSD가 만든 문서 커밋이 보인다.

---

# 4 단계: 단계 논의 — `/gsd-discuss-phase 1`

**목적** — 1단계를 **어떻게** 만들지(화면 배치, 오류 문구, 저장 방식 등) 기획 전에 결정한다. 여기서 정한 내용이 이후 계획에 그대로 반영된다.

**입력** — 🤖 Claude Code

```text
/clear
```

```text
/gsd-discuss-phase 1
```

GSD가 1단계에서 정할 "회색 지대"를 몇 개 제시하고 하나씩 묻는다. 예시 답변:

| 예상 질문 | 예시 답변 |
| --- | --- |
| 빈 입력일 때 안내 방식은? | 입력란 아래에 "할 일 내용을 입력해 주세요." 를 표시 |
| 200자 초과는 입력을 막을지, 추가할 때 거부할지? | 입력은 허용하고 글자 수를 `N/200` 으로 보여 주며, 추가할 때 거부 |
| 같은 내용 중복은? | 허용, 대신 "같은 내용의 할 일이 이미 있어요" 안내 |
| 할 일 id 는? | 1부터 증가하는 정수 |
| 저장 데이터가 깨져 있으면? | 앱이 멈추지 않고 빈 목록으로 시작, 안내 문구 표시 |
| localStorage 키 이름은? | `my-todo-gsd:todos` |

## 규칙

- **각 GSD 명령 전에 `/clear`** 한다. 앞 대화가 남아 있으면 컨텍스트 rot 이 생긴다. 필요한 기억은 `.planning/` 문서가 대신한다.
- 이 단계는 **"무엇을"이 아니라 "어떻게"** 를 정하는 자리다. 새 기능을 추가하자고 하면 GSD가 범위 밖이라며 따로 기록해 둔다.
- 빨리 끝내고 싶으면 `/gsd-discuss-phase 1 --batch` 로 질문을 묶어서 한 번에 답할 수 있다.

## 산출물

```
.planning/phases/01-<단계이름>/
└── 01-CONTEXT.md     ← ## Implementation Decisions 에 내가 답한 내용
```

## 체크리스트

- [ ] `01-CONTEXT.md` 가 생겼고, 내가 답한 결정이 그대로 적혀 있다.
- [ ] 기술 제약(`node --test`, 의존성 없음)과 어긋나는 결정이 없다.

---

# 5 단계: 단계 기획 — `/gsd-plan-phase 1`

**목적** — 1단계를 새 컨텍스트 하나로 끝낼 수 있는 크기의 **작업 계획(PLAN)** 으로 쪼개고, 계획 검사기가 목표 달성 여부를 확인하게 한다.

**입력** — 🤖 Claude Code

```text
/clear
```

```text
/gsd-plan-phase 1
```

리서치를 꺼 두었으므로 플래너가 바로 계획을 만들고, 계획 검사기(plan checker)가 확인한다. 통과하지 못하면 스스로 고쳐 다시 검사한다. 1~5분 정도 걸리며 **중간에 멈추지 않는다.**

## 규칙

- 계획 파일을 열어 `<task>` 블록을 읽어 본다. 특히 `<files>` 와 `<verify>` 를 본다.
- ⚠️ `<files>` 에 `package-lock.json`, `vitest.config.js`, `node_modules` 가 보이거나, `<verify>` 가 `npm test`·`vitest` 라면 **기술 제약 위반**이다. 실행 전에 바로잡는다.

  ```text
  01 단계 계획이 PROJECT.md 의 기술 제약과 다르게 Vitest(또는 npm 의존성)를 쓰고 있어. node --test 만 쓰고 package.json 에 "type": "module" 만 두도록 계획을 고쳐 줘.
  ```

- 계획 수가 2~3개 정도면 적당하다. 너무 많으면 `Coarse` 설정과 로드맵을 다시 본다.

## 산출물

```
.planning/phases/01-<단계이름>/
├── 01-CONTEXT.md
├── 01-01-PLAN.md      ← 예: 순수 함수(todo.js) + 테스트
├── 01-02-PLAN.md      ← 예: 저장(storage.js) + 화면(index.html, app.js)
└── (리서치를 켰다면 01-RESEARCH.md)
```

## 체크리스트

- [ ] `01-NN-PLAN.md` 가 1개 이상 생겼다.
- [ ] 각 `<task>` 에 `<files>`, `<action>`, `<verify>`, `<done>` 이 있다.
- [ ] `<verify>` 에 `node --test` 처럼 실제로 실행 가능한 확인 방법이 있다.
- [ ] 외부 패키지(Vitest 등)가 계획에 없다.

---

# 6 단계: 단계 실행 — `/gsd-execute-phase 1`

**목적** — 계획을 서브에이전트(실행기)가 실행해 코드를 만들고, 작업마다 git 커밋을 남긴 뒤, 검증기가 요구사항 충족 여부를 자동 확인한다.

**입력** — 🤖 Claude Code

```text
/clear
```

```text
/gsd-execute-phase 1
```

## 6-1. 실행 지켜보기

화면에 대략 이런 진행이 보인다 (예시):

```text
Wave 1 (parallel):
  [Executor A] → 01-01-PLAN.md   ✓ committed
Wave 2:
  [Executor B] → 01-02-PLAN.md   ✓ committed

[Verifier] Checking codebase against phase goals...
  TODO-01 할 일 추가   ✓
  TODO-02 빈 입력 거부 ✓
  …
  Status: PASS
```

- 서로 의존하지 않는 계획은 같은 웨이브에서 동시에, 의존하는 계획은 다음 웨이브에서 실행된다.
- 권한 확인 방법 B를 썼다면 중간중간 허용을 묻는다. 읽고 허용한다.

## 6-2. 결과 확인

🖥️ 터미널 (새 탭, `my-todo-gsd`)

```bash
git log --oneline | head -15    # 작업마다 하나씩 커밋이 쌓였는지
ls index.html src tests
node --test
python3 -m http.server 8000     # 🌐 http://localhost:8000 확인 후 Ctrl+C
```

화면이 비어 있거나 동작하지 않으면 증상을 그대로 알린다.

```text
/gsd-debug http://localhost:8000 을 열었더니 화면에 아무것도 안 나와. 브라우저 콘솔 오류: (있으면 붙여 넣기)
```

> `/gsd-debug` 는 디버거 서브에이전트가 원인을 찾고, 상태를 `.planning/` 에 남겨 `/clear` 후에도 이어서 고칠 수 있다.

## 규칙

- 실행 중에는 **멈추지 않고 기다린다.** 끝나면 다음 할 일을 안내한다.
- 검증기가 `FAIL` 이나 빠진 요구사항(gap)을 보고하면, 안내대로 수정 계획을 실행한다(보통 `/gsd-execute-phase 1` 을 다시 실행).
- 커밋이 작업 단위로 나뉘어 있으므로, 잘못된 작업 하나만 `git revert <커밋>` 으로 되돌릴 수 있다.

## 산출물

```
my-todo-gsd/
├── index.html
├── package.json              {"type": "module"}
├── src/  todo.js  storage.js  app.js  (style.css)
├── tests/ todo.test.js
└── .planning/phases/01-<단계이름>/
    ├── 01-01-SUMMARY.md       ← 무엇을 만들고 커밋했는지
    ├── 01-02-SUMMARY.md
    └── 01-VERIFICATION.md     ← 요구사항별 PASS / FAIL
```

`git log --oneline` 예시:

```text
a1b2c3d docs(01): complete phase 1 verification
d4e5f6a feat(01-02): wire up add/toggle/delete UI
b7c8d9e feat(01-02): add localStorage storage module
f0a1b2c test(01-01): add unit tests for todo pure functions
c3d4e5f feat(01-01): implement todo pure functions
```

## 체크리스트

- [ ] `01-VERIFICATION.md` 의 결과가 PASS 다.
- [ ] `git log` 에 `feat(01-…)` 형태의 작업별 커밋이 여러 개 있다.
- [ ] `node --test` 가 `# fail 0` 이다.
- [ ] 🌐 http://localhost:8000 에서 화면이 나오고 할 일 추가가 된다. 자세한 확인은 [SAMPLE.md](SAMPLE.md).

---

# 7 단계: 작업 검증 — `/gsd-verify-work 1`

**목적** — 자동 검증이 "코드가 있고 테스트가 통과한다" 를 확인했다면, 여기서는 **사람이 직접 써 보고** 기대한 대로 동작하는지 확인한다(UAT, 사용자 인수 테스트).

**입력** — 먼저 🖥️ 터미널에서 서버를 켜 둔다(`python3 -m http.server 8000`). 그다음 🤖 Claude Code

```text
/clear
```

```text
/gsd-verify-work 1
```

GSD가 단계의 성공 기준을 하나씩 질문한다. 🌐 브라우저에서 직접 해 보고 답한다.

```text
[1/5] 할 일을 입력하고 Enter 를 누르면 목록 끝에 추가되나요?
> 예

[2/5] 공백만 입력하면 추가되지 않고 안내 문구가 보이나요?
> 아니요. 공백만 입력해도 빈 항목이 추가돼.
…
```

[SAMPLE.md](SAMPLE.md) 의 시나리오를 함께 보며 답하면 빠짐없이 확인할 수 있다.

## 규칙

- "아니요" 라고 답할 때는 **무엇이 어떻게 다른지** 구체적으로 적는다. GSD가 디버그 에이전트로 원인을 찾고 **수정 계획**을 만든다.
- 수정 계획이 만들어지면 `/clear` → `/gsd-execute-phase 1` → `/clear` → `/gsd-verify-work 1` 을 모두 통과할 때까지 반복한다.

## 산출물

```
.planning/phases/01-<단계이름>/01-UAT.md    ← 질문·답·결과
(실패가 있었다면) 수정용 PLAN 파일
```

## 체크리스트

- [ ] 모든 질문이 통과했다는 메시지가 나왔다 ("Phase 1 verified" 등).
- [ ] `01-UAT.md` 에 질문과 결과가 기록되어 있다.

---

# 8 단계: 남은 단계 진행과 마무리

**목적** — 로드맵의 나머지 단계(있다면)를 같은 루프로 끝내고, 마일스톤을 마무리한다.

**입력** — 🤖 Claude Code

1. 지금 어디인지 확인

   ```text
   /gsd-progress
   ```

2. 2단계가 있으면 4~7단계를 그대로 반복한다 (번호만 2로).

   ```text
   /clear
   /gsd-discuss-phase 2
   ```
   → `/clear` → `/gsd-plan-phase 2` → `/clear` → `/gsd-execute-phase 2` → `/clear` → `/gsd-verify-work 2`

   또는 다음 할 일을 GSD가 알아서 고르게 한다.

   ```text
   /gsd-progress --next
   ```

3. 모든 단계가 끝나면 마일스톤을 마무리한다.

   ```text
   /gsd-complete-milestone
   ```

4. (선택) GitHub 저장소와 `gh` CLI가 준비되어 있으면 PR을 만든다.

   ```text
   /gsd-ship 1
   ```

   PR 본문은 기본 섹션 뒤에 3-2 ④에서 고른 섹션(예: User Stories & Acceptance Criteria, Success Metrics & Release Criteria)이 덧붙어 만들어진다.

## 규칙

- 단계 사이, 명령 사이마다 `/clear` 를 잊지 않는다.
- `/gsd-ship` 은 GitHub 원격 저장소(`git remote`)와 로그인된 `gh` 가 필요하다. 이 실습에서는 건너뛰어도 된다.

## 산출물

- `ROADMAP.md` 의 모든 단계 상태가 완료
- `.planning/phases/02-…/` (단계가 둘 이상인 경우)
- 마일스톤 마무리 커밋·태그 (`/gsd-complete-milestone`)

## 체크리스트

- [ ] `/gsd-progress` 가 모든 단계 완료를 보여 준다.
- [ ] [SAMPLE.md](SAMPLE.md) 의 1~7단계 시나리오가 모두 통과한다.
- [ ] `git status` 가 깨끗하다 (커밋 안 된 변경 없음).

---

# 9 단계: (도전) 마감일 기능 빠르게 추가 — `/gsd-quick`

**목적** — 전체 단계 루프 없이, **빠른 모드**로 작은 기능을 추가한다. `--full` 을 붙이면 논의·리서치·계획 검사·검증까지 포함한 축소판 파이프라인이 돈다.

**입력** — 🤖 Claude Code

```text
/clear
```

```text
/gsd-quick --full 할 일에 선택적으로 마감일을 지정할 수 있게 해 줘. HTML date 입력과 YYYY-MM-DD 문자열로 저장한다. 마감일이 지난 미완료 할 일은 눈에 띄게 표시하고, 목록을 마감일이 가까운 순으로 정렬할 수 있게 한다. 예전에 저장된 마감일 없는 할 일도 그대로 보여야 한다. 테스트는 node --test 로 추가한다.
```

논의 질문이 나오면 답한다 (예: "마감일 없는 항목은 정렬 시 맨 아래").

## 규칙

- 빠른 모드 작업은 단계(phase)가 아니라 `.planning/quick/` 아래에 따로 기록된다.
- 기능이 크거나 여러 단계가 필요하면 `/gsd-new-milestone` 으로 다음 버전(v2) 마일스톤을 시작하는 것이 맞다. (`new-project` 와 같은 흐름이지만 기존 코드를 이어서 다룬다)
- 저장 형식이 바뀌므로 **기존 데이터 호환**(마감일 없는 할 일)을 꼭 확인한다.

## 산출물

```
.planning/quick/YYMMDD-xxx-<작업이름>/      ← 날짜-번호-이름 (예: 261012-a1b-due-date)
├── …-CONTEXT.md     (--full / --discuss 일 때) 논의 결정
├── …-PLAN.md
└── …-SUMMARY.md
```

+ 작업별 git 커밋, 바뀐 `src/`·`tests/`

## 체크리스트

- [ ] `.planning/quick/` 에 이번 작업 폴더가 생겼다.
- [ ] `node --test` 가 통과한다.
- [ ] [SAMPLE.md 8단계](SAMPLE.md#8단계-도전-마감일-기능-써-보기) 와 5단계(기존 기능) 시나리오가 모두 동작한다.

---

# 부록 A. CLAUDE.md 규칙 조각

프로젝트 루트의 `CLAUDE.md` 에 붙여 두면, GSD 명령 밖에서 대화할 때도 같은 흐름을 지킨다.

```markdown
## GSD 규칙

- 이 프로젝트는 GSD Core 로 개발한다. 계획과 상태는 `.planning/` 이 기준이다 (`PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`).
- 기술 제약은 `PROJECT.md` 를 따른다: 순수 HTML/CSS/JS(ES 모듈), localStorage, `node --test`, npm 의존성 없음.
- 기능을 바꾸거나 더하는 요청을 받으면 코드를 바로 고치지 말고, 작은 일은 `/gsd-quick`, 큰 일은 단계 추가나 `/gsd-new-milestone` 을 제안한다.
- 버그는 `/gsd-debug` 로 원인을 찾고 고친다.
- 작업은 하나씩 원자적으로 커밋한다. 커밋 메시지는 `type(단계-계획): 설명` 형식을 따른다.
- 문서와 화면 문구, 대답은 한국어로 쓴다.
```

# 부록 B. 자주 겪는 문제

| 증상 | 원인 / 해결 |
| --- | --- |
| `/gsd-…` 명령이 안 보인다 | `--local` 로 설치했으므로 `my-todo-gsd` 폴더 **안에서** `claude` 를 실행해야 한다. `ls .claude/commands` 로 확인 |
| 인터넷 글의 `npx get-shit-done-cc` 를 썼다 | 예전 이름이다. `npx @opengsd/gsd-core@latest --claude --local` 로 다시 설치하면 남은 파일을 정리해 준다 |
| `/gsd:new-project` 가 안 된다 | 예전 표기다. 지금은 `/gsd-new-project` (하이픈) |
| 권한 허용 요청이 너무 많다 | 2단계 방법 B의 `allow` 목록에 자주 나오는 명령을 추가하거나, 실습 폴더에서만 방법 A 사용 |
| 문서·질문이 영어로 나온다 | `.planning/config.json` 에 `"response_language": "ko"` (3-6) |
| 계획에 Vitest 등 npm 패키지가 들어갔다 | `PROJECT.md` 의 기술 제약 확인 후 5단계 요청문으로 계획을 고친다 (실행 전에) |
| 대화가 길어지고 답이 이상해졌다 | `/clear` 후 하려던 GSD 명령을 다시 실행한다. 상태는 `.planning/` 에 남아 있다 |
| 중간에 끊겼다 / 어디까지 했는지 모르겠다 | `/gsd-progress` 로 현재 위치와 다음 할 일을 확인 |
| 화면이 비어 있다 | `file://` 대신 `python3 -m http.server 8000`. 그래도 비면 `/gsd-debug` 에 증상과 콘솔 오류 전달 |
| `/gsd-ship` 이 실패한다 | GitHub 원격 저장소와 `gh auth login` 이 필요. 실습에서는 생략 가능 |
| 사용량 한도에 금방 닿는다 | `/gsd-settings` 에서 Research·Plan Check 를 끄거나, AI Models → Standard tier… → Model Tier 를 Budget 으로 |
| PR 본문 섹션을 바꾸고 싶다 | `.planning/config.json` 의 `ship.pr_body_sections` 에서 원하는 항목의 `"enabled"` 를 `true` / `false` 로 바꾼다 |

# 부록 C. 용어 정리

| 용어 | 뜻 |
| --- | --- |
| 컨텍스트 rot | 대화(컨텍스트)가 쌓일수록 AI 답의 품질이 떨어지는 현상 |
| 서브에이전트 | 특정 역할(플래너, 실행기, 검증기 …)만 하는 별도 AI. 매번 새 컨텍스트로 시작 |
| 마일스톤 | 하나의 출시 단위(v1, v2 …). 여러 단계로 이루어짐 |
| 단계 (phase) | 로드맵의 한 칸. 논의 → 기획 → 실행 → 검증 루프를 한 번 도는 단위 |
| 계획 (plan) | 단계를 새 컨텍스트 하나로 끝낼 크기로 나눈 것. `NN-NN-PLAN.md` |
| 작업 (task) | 계획 안의 `<task>` XML 블록. 실행 후 하나씩 커밋 |
| 웨이브 (wave) | 동시에 실행되는 계획 묶음. 의존성이 있으면 다음 웨이브로 |
| CONTEXT.md | 논의 단계에서 정한 구현 결정 |
| VERIFICATION.md | 실행 후 자동 검증 결과 (요구사항별 PASS/FAIL) |
| UAT.md | 사람이 직접 확인한 인수 테스트 결과 |
| STATE.md | 결정·막힌 점·현재 위치를 적은 세션 간 기억 |
| 빠른 모드 (quick) | 단계 없이 작은 작업을 처리. `.planning/quick/` 에 기록 |
| Interactive / YOLO | 단계마다 확인 / 자동 승인 모드 |
