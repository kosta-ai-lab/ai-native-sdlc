# 개념

## BMAD Method란?

**BMAD Method**(BMad, *Agile AI-Driven Development*)는 Claude Code 같은 AI 코딩 도구에 **스킬(skill)** 을 설치해, 아이디어를 "명확히 하기 → 계획 → 만들고 검증 → 배우고 조정" 하는 **애자일 루프**로 소프트웨어를 만드는 스펙 주도 개발(SDD) 방법론이다.

AI 코딩 도우미는 구현은 잘하지만, **말하지 않은 가정을 그대로 코드로 만들어 버리는** 경우가 많다. BMAD는 중요한 결정을 문서(스펙·스토리)로 드러내고, 그 문서를 다음 작업의 맥락으로 이어 가서 사람이 판단을 놓치지 않게 한다.

### 핵심 생각 — 일의 크기에 맞게 계획한다

| 일의 크기 | 예 | BMAD 경로 |
| --- | --- | --- |
| 아주 작은 수정 | 오타, 설정 한 줄 | BMAD 없이 바로 고친다 |
| 한 번에 끝나는 변경 (약 500줄 이하) | 버그 수정, 작은 기능 | **`bmad-build` 한 번** |
| 에픽 (여러 번 나눠야 하는 하나의 목표) | **할 일 관리 앱 ← 이 모듈** | **`bmad-spec` → 스토리 나누기 → 스토리마다 `bmad-build`** |
| 프로젝트 (에픽 여러 개, 여러 사람) | 서비스 전체 | brief · PRD · UX · 아키텍처 → 에픽마다 위 경로 |

어느 경로든 **구현 단위는 `bmad-build` 한 번**으로 같다. 큰 일은 그 단위를 반복할 뿐이다.

### 전달 루프 (delivery loop)

```
   막연한 생각 ──► ① 명확히 하기 (Clarify)    bmad-brainstorming, bmad-forge-idea, bmad-product-brief …
   큰 아이디어 ──► ② 계획 (Plan)              bmad-prd, bmad-spec(+스토리), bmad-architecture …
   작은 변경   ──► ③ 만들고 검증 (Build)      bmad-build  (계획 승인 → 구현 → 리뷰 → 수정 → 커밋)
                   ④ 배우고 조정 (Learn)       bmad-walkthrough, bmad-retrospective, bmad-correct-course
                        └──────────── ②로 돌아가 스펙을 고친다
```

## 스킬과 에이전트

BMAD를 설치하면 Claude Code의 `.claude/skills/` 에 `bmad-` 로 시작하는 스킬이 생긴다. Claude Code 입력창에 `/bmad-help` 처럼 **슬래시 + 스킬 이름**으로 부른다.

**역할 에이전트 5명** — 불러내면 그 역할로 대화하고, 메뉴 코드(예: `PRD`)로 워크플로를 시작한다.

| 에이전트 | 스킬 | 주로 하는 일 |
| --- | --- | --- |
| 📊 Mary (분석가) | `bmad-agent-analyst` | 브레인스토밍, 시장·기술 조사, 제품 브리프 |
| 📋 John (PM) | `bmad-agent-pm` | PRD 작성·검증, 에픽과 스토리 |
| 🏗️ Winston (아키텍트) | `bmad-agent-architect` | 아키텍처 결정, 구현 준비 점검 |
| 💻 Amelia (개발자) | `bmad-agent-dev` | 구현(`BD`), 코드 리뷰(`CR`), 테스트 생성(`QA`) |
| 🎨 Sally (UX 디자이너) | `bmad-agent-ux-designer` | UX 설계 (`DESIGN.md`, `EXPERIENCE.md`) |

> 에이전트를 부르지 않고 **워크플로 스킬을 바로** 불러도 된다. 이 모듈은 주로 이 방법을 쓴다.

**이 모듈에서 쓰는 스킬**

| 스킬 | 하는 일 | 만드는 것 |
| --- | --- | --- |
| `bmad-help` | 현재 상태를 보고 다음에 할 일을 추천 | (대화) |
| `bmad-prd` | (선택) 제품 요구사항 문서 작성 | `prd.md`, `addendum.md` |
| `bmad-spec` | 요구사항을 짧은 계약서로 정리, 요청하면 스토리로 나눔 | `SPEC.md`, `stories.yaml` |
| `bmad-build` | 작업 하나를 계획 → 구현 → 리뷰 → 수정 → 커밋 | 스토리 문서 + 코드 + 커밋 |
| `bmad-walkthrough` | 사람이 변경을 검토하도록 안내 (무엇을 보고 어떻게 테스트할지) | (대화) |
| `bmad-code-review` | (선택) 여러 독립 리뷰어로 코드 리뷰 | 발견 사항 + 수정 |
| `bmad-retrospective` | 에픽 전체를 증거(스펙·스토리·커밋)로 돌아보고 승인 여부 판단 | 회고 문서 |

## 스펙 `SPEC.md` — 5개 항목의 계약서

`bmad-spec` 이 만드는 `SPEC.md` 는 짧다. 구현(`bmad-build`)이 읽는 **계약서**이기 때문이다.

| 항목 | 뜻 | 할 일 앱 예 |
| --- | --- | --- |
| **Why** | 왜 만드는가 | 개인이 할 일을 가볍게 기록·관리 |
| **Capabilities** (`CAP-1`, `CAP-2` …) | 할 수 있어야 하는 것 + **성공 조건** | CAP-1 할 일 추가: 빈 입력 거부, 200자 제한 … |
| **Constraints** | 설계를 제한하는 양보 불가 조건 | 순수 HTML/CSS/JS, localStorage, `node --test`, npm 의존성 없음 |
| **Non-goals** | 하지 않는 것 (최소 1개) | 로그인, 여러 사용자, 마감일 |
| **Success signal** | 완성되었다고 말할 수 있는 순간 | 새로 고침해도 목록이 그대로이고 키보드로 모두 조작 |

> ⚠️ `SPEC.md` 는 **손으로 고치지 않는다.** 같은 폴더의 `.memlog.md`(결정 기록)에서 매번 다시 만들어지므로, 고치고 싶으면 `bmad-spec` 을 다시 불러 바꿀 내용을 말한다. Capability ID(`CAP-N`)는 유지된다.

## 산출물 지도

```
my-todo-bmad/
├── .claude/skills/bmad-*/          ← 스킬 29종 (설치 프로그램이 생성)
├── _bmad/                          ← BMAD 설정·보조 스크립트
│   ├── config.toml                    프로젝트 설정 (언어, 출력 폴더 …)
│   ├── config.user.toml               개인 설정 (이름, 대화 언어, 숙련도) — git 제외
│   └── custom/                        내가 덮어쓰는 설정 (선택)
├── _bmad-output/                   ← BMAD가 만드는 문서
│   ├── planning-artifacts/            (선택) PRD, 아키텍처 …
│   ├── specs/spec-todo-app/
│   │   ├── SPEC.md                    5개 항목 계약서
│   │   ├── stories.yaml               스토리 목록 (실행 순서)
│   │   ├── .memlog.md                 결정 기록 (SPEC.md 의 원본)
│   │   └── stories/1-….md, 2-….md     스토리별 구현 기록 (bmad-build 가 생성)
│   └── implementation-artifacts/
│       └── deferred-work.md           나중에 할 일 (리뷰에서 미룬 것)
├── index.html  package.json  src/  tests/      ← 앱 코드 (bmad-build 가 생성)
```

## 이 가이드의 단계

| 단계 | 내용 | 주로 쓰는 명령 |
| --- | --- | --- |
| 1 | 설치 | `npx bmad-method install …` |
| 2 | Claude Code 실행과 권한, 도움말 | `claude`, `/bmad-help` |
| 3 | (선택) PM 에이전트와 PRD 만들기 | `/bmad-agent-pm` → `PRD` |
| 4 | 스펙 만들기 | `/bmad-spec` |
| 5 | 스토리로 나누기 | `/bmad-spec` (이어서) → `git commit` |
| 6 | 스토리별 구현 — 앱 만들기 | `/bmad-build` × 3 |
| 7 | 사람이 확인하기 | `/bmad-walkthrough`, (선택) `/bmad-code-review` |
| 8 | 에픽 마무리 | `/bmad-retrospective` |
| 9 | (도전) 마감일 기능 추가 | `/bmad-spec` (갱신) → `/bmad-build` |

> 📌 실습 예제: M01~M04와 같은 **"할 일 관리 웹 앱"** 을 BMAD로 만든다. 프로젝트 폴더는 `my-todo-bmad`. 완성된 앱을 실행·사용·확인하는 방법은 [SAMPLE.md](SAMPLE.md) 에 있다.

---

# 1 단계: 설치

**목적** — 실습 프로젝트 폴더에 BMAD(BMad Method 모듈)를 Claude Code 용으로 설치하고, **한국어로 대화·문서 작성**하도록 설정한다.

**입력** — 🖥️ 터미널

```bash
# 1) 준비물 확인
node --version      # v20.12 이상
python3 --version   # 3.10 이상
uv --version        # 없으면: brew install uv
git --version
claude --version

# 2) 프로젝트 폴더 + git 저장소
mkdir -p ~/git/my-todo-bmad && cd ~/git/my-todo-bmad
git init

# 3) BMAD 설치 — 질문 없이 한 번에 (이름은 본인 이름으로)
npx bmad-method install \
  --directory . \
  --modules bmm \
  --tools claude-code \
  --user-name 홍길동 \
  --communication-language Korean \
  --document-output-language Korean \
  --set bmm.user_skill_level=beginner \
  --yes

# 4) 설치 결과 확인
ls -a
ls .claude/skills | grep -c '^bmad-'     # 스킬 개수
cat _bmad/config.user.toml | grep -v '^#'

# 5) 깨끗한 시작점 커밋 (중요!)
git add -A
git commit -m "chore: install BMAD Method v6"
```

| 옵션 | 의미 |
| --- | --- |
| `--directory .` | 현재 폴더에 설치 |
| `--modules bmm` | **BMad Method** 모듈 (핵심 모듈 `core` 는 자동 포함) |
| `--tools claude-code` | Claude Code 용 스킬을 `.claude/skills/` 에 설치 |
| `--user-name` | 에이전트가 부를 이름 |
| `--communication-language Korean` | 대화 언어 |
| `--document-output-language Korean` | 만드는 문서(SPEC, 스토리 등)의 언어 |
| `--set bmm.user_skill_level=beginner` | 숙련도: `beginner` 면 개념을 더 자세히 설명 |
| `--yes` | 나머지는 기본값으로, 질문 없이 진행 |

> 💡 옵션 없이 `npx bmad-method install` 만 실행해도 된다. 그러면 설치 폴더 · 모듈 · 도구 · 이름 · 언어를 화면에서 하나씩 묻는다. 방향키로 고르고 **Space** 로 선택, **Enter** 로 다음. 모듈은 **BMad Method**, 도구는 **Claude Code** 를 고르고, 언어 질문에는 `Korean` 을 입력한다.

## 규칙

- 처음 `npx` 실행 때 "Ok to proceed? (y)" 를 물으면 `y`.
- 설치 화면에 `Python UV check` 경고가 나오면 uv 를 설치하고 **설치 명령을 다시 실행**한다. 경고만 나고 설치는 끝나지만, 스킬이 `uv run …` 을 못 해 제대로 동작하지 않는다.
- **설치 후 반드시 커밋한다.** `bmad-build` 는 시작할 때 작업 폴더가 깨끗한지(커밋하지 않은 변경이 없는지) 확인하고, 아니면 멈춰서 묻는다.
- `.claude`, `_bmad` 는 숨김 폴더이거나 이름이 `_` 로 시작한다. Finder에서는 `⌘ + Shift + .`, 터미널에서는 `ls -a` 로 본다.
- 설치 마지막에 "BMad v7 is close …" 안내가 나온다. **이 모듈은 v6 를 쓰므로 따라 하지 않는다.** (README "알아 둘 점" 참고)

## 산출물

설치 화면 (발췌):

```
*  ✅ Python UV check pass (uv 0.x detected).
•  Using modules from command-line: bmm
•  Using tools from command-line: claude-code
o  2 module(s) installed
|  Created directories:
|    output folder: _bmad-output
*  claude-code configured: 29 skills → .claude/skills
+-BMAD is ready to use!---------------------------------------+
|    ✓  BMad Core Module (v6.12.2, installed)                  |
|    ✓  BMad Method (v6.12.2, installed)                       |
|    ✓  claude-code (29 skills → .claude/skills)               |
|    Get started:                                              |
|      1. Launch your AI agent from your project folder        |
|      2. Not sure what to do? Invoke the bmad-help skill …    |
+-------------------------------------------------------------+
```

```
my-todo-bmad/
├── .git/
├── .claude/skills/     bmad-help/, bmad-spec/, bmad-build/, bmad-agent-pm/ … (29개, 각각 SKILL.md)
├── _bmad/              config.toml, config.user.toml, scripts/, _config/ …
└── _bmad-output/       (아직 비어 있음)
```

`_bmad/config.user.toml`:

```toml
[core]
user_name = "홍길동"
communication_language = "Korean"

[modules.bmm]
user_skill_level = "beginner"
```

## 체크리스트

- [ ] 설치 화면에 **`BMAD is ready to use!`** 가 보였다.
- [ ] `ls .claude/skills | grep -c '^bmad-'` 가 29 안팎이다. (버전에 따라 조금 다를 수 있다)
- [ ] `config.user.toml` 의 `communication_language` 가 `Korean` 이다.
- [ ] `git status` 가 깨끗하다 (`nothing to commit`).

---

# 2 단계: Claude Code 실행과 권한, 도움말

**목적** — Claude Code에서 BMAD 스킬이 보이는지 확인하고, `bmad-help` 로 BMAD가 추천하는 시작점을 듣는다. BMAD 스킬은 `uv run`, `git`, `node` 같은 명령을 자주 실행하므로 **권한 확인 방식**을 먼저 정한다.

**입력** — 🖥️ 터미널, `my-todo-bmad` 폴더 안에서 둘 중 하나

**방법 A (기본) — 물을 때마다 허용**

```bash
claude
```

권한을 물으면 내용을 읽고 **Yes** 또는 **Yes, and don't ask again …** 을 고른다.

**방법 B (편함) — 자주 쓰는 명령만 미리 허용**

```bash
cat > .claude/settings.json <<'EOF'
{
  "permissions": {
    "allow": [
      "Bash(uv run:*)", "Bash(python3:*)", "Bash(node:*)",
      "Bash(git status:*)", "Bash(git diff:*)", "Bash(git log:*)",
      "Bash(git add:*)", "Bash(git commit:*)", "Bash(git rev-parse:*)",
      "Bash(ls:*)", "Bash(mkdir:*)", "Bash(cat:*)"
    ]
  }
}
EOF
git add .claude/settings.json && git commit -m "chore: allow common commands for Claude Code"
claude
```

그다음 🤖 **Claude Code** 에서:

```text
/bmad-help 할 일 관리 웹 앱을 처음부터 만들려고 해. 요구사항은 이미 정리되어 있어. 어디서부터 시작하면 돼?
```

## 규칙

- 반드시 `my-todo-bmad` 폴더 **안에서** `claude` 를 실행한다. 스킬이 이 폴더의 `.claude/skills/` 에 설치되었기 때문이다.
- 입력창에 `/bmad` 까지만 치면 자동 완성 목록이 나온다.
- `bmad-help` 는 언제든 쓸 수 있다. **막히면 먼저 `/bmad-help`** 로 묻는다.
- BMAD 공식 문서는 워크플로마다 **새 대화**에서 시작하라고 권한다. 이 가이드에서 `/clear` 가 나오면 대화를 비우는 것이다. 결정은 문서(`_bmad-output/`)에 남아 있으므로 잃어버리지 않는다.

## 산출물

- (방법 B) `.claude/settings.json`
- `/bmad-help` 답변 — 예를 들어 다음처럼 현재 상태와 추천 다음 단계를 알려 준다. (문구는 매번 다르다)

```
현재 상태: BMad Method 설치됨, 아직 계획 문서 없음.
요구사항이 이미 명확하므로 →
  1. (추천) bmad-spec — 요구사항을 SPEC.md 로 정리하고 스토리로 나누기
  2. (선택) bmad-prd — 여러 사람이 합의해야 하는 제품이면 PRD 먼저
지금 bmad-spec 을 시작할까요?
```

## 체크리스트

- [ ] `/bmad` 를 입력하면 `/bmad-help`, `/bmad-spec`, `/bmad-build` 등이 자동 완성 목록에 보인다.
- [ ] `/bmad-help` 가 **한국어로** 다음 단계를 추천했다.
- [ ] 추천에 `bmad-spec` (또는 `bmad-build`) 이 들어 있다. 시작 제안이 나오면 지금은 "아니요, 직접 할게요" 라고 답하고 3·4단계로 간다.

---

# 3 단계: (선택) PM 에이전트와 PRD 만들기

**목적** — BMAD의 **역할 에이전트**를 체험한다. PM 에이전트 John과 대화하며 PRD(제품 요구사항 문서)를 만든다.

> ⏭️ **건너뛰어도 된다.** 할 일 앱은 혼자 만드는 작은 앱이고 요구사항이 이미 명확하므로, BMAD 문서도 PRD 없이 바로 `bmad-spec` 으로 가라고 권한다. 에이전트가 어떻게 일하는지 보고 싶을 때만 한다.

**입력** — 🤖 Claude Code

```text
/clear
```

```text
/bmad-agent-pm
```

John이 인사하고 메뉴를 보여 주면:

```text
PRD
```

John이 어떤 앱(제품)인지 물으면, 작업 방식(**Fast path**)을 앞에 붙여 한 번에 대답한다:

```text
Fast path 로 해 줘. BMAD 학습용으로 만드는 나만의 간단한 투두 앱이야.
```

> 💡 요구사항을 길게 붙여 넣는 단계(brain dump)는 따로 나오지 않는다. John이 이 짧은 설명만으로 빈칸을 추정해 PRD를 쓰고, 추정한 부분에 `[ASSUMPTION]` 을 붙인다. 추가·완료·삭제·필터·저장 같은 세부 요구사항이 빠졌으면 그때 4단계 **요구사항 입력문**의 `[기능]` 부분을 보여 주며 반영해 달라고 한다.

## 규칙

- **Fast path** — 남은 빈칸을 질문 한두 개로 묻고, 문서 전체를 한 번에 쓴다. 추정한 부분은 `[ASSUMPTION]` 표시가 붙는다. 이 표시를 읽고 틀린 것만 고쳐 달라고 한다.
- **Coaching path** — 섹션마다 질문하고 답이 부족하면 되묻는다. 시간이 오래 걸린다.
- PRD는 **무엇을, 왜** 만드는지만 쓴다. 어떻게(기술)는 `addendum.md` 로 간다.
- 끝나면 `bmad-spec` 이 이 PRD를 읽고 스펙을 만든다(4단계 입력문 대신 "PRD로 스펙을 만들어 줘" 라고 하면 된다).

## 산출물

```
_bmad-output/planning-artifacts/prd-todo-app-…/
├── prd.md         기능별 요구사항(FR-ID), 비기능 요구사항(NFR)
├── addendum.md    기술 선택, 고려했다 버린 대안 등
└── .memlog.md     결정 기록
```

## 체크리스트

- [ ] `/bmad-agent-pm` 이 John(📋)으로 인사하고 메뉴 코드(`PRD`, `CE`, `IR`, `CC`)를 보여 주었다.
- [ ] `prd.md` 에 추가·완료·삭제·필터·저장 요구사항이 있다.
- [ ] `[ASSUMPTION]` 을 확인하고 틀린 것은 고쳤다.

---

# 4 단계: 스펙 만들기 — `/bmad-spec`

**목적** — 할 일 앱 요구사항을 **`SPEC.md`(5개 항목 계약서)** 로 만든다. 이후 모든 구현은 이 문서를 기준으로 한다.

**입력** — 🤖 Claude Code

```text
/clear
```

아래 **요구사항 입력문**을 그대로 붙여 넣는다. (3단계에서 PRD를 만들었다면 마지막 줄만 "planning-artifacts 의 PRD 로 스펙을 만들어 줘" 로 바꿔도 된다)

```text
/bmad-spec 아래 요구사항으로 스펙을 만들어 줘. slug 는 todo-app 으로 해 줘.

[왜] 개인이 브라우저에서 할 일을 가볍게 기록하고 관리하는 웹 앱.

[기능]
1. 할 일 추가: 입력란 + 추가 버튼, Enter 로도 추가. 앞뒤 공백은 제거한다. 빈 입력이나 공백만 있는 입력은 거부하고 안내한다. 최대 200자, 넘으면 추가하지 않고 안내하며 입력한 글은 지우지 않는다. 같은 내용이 이미 있으면 추가는 하되 중복 안내를 보여 준다. 새 할 일은 목록 끝에 미완료로 추가된다.
2. 완료 표시: 체크 상자로 완료/미완료를 바꾼다. 완료된 항목은 취소선 등으로 구분된다.
3. 삭제: 삭제 버튼으로 확인 창 없이 바로 삭제한다.
4. 필터: 전체 / 진행 중 / 완료. 남은 할 일 개수는 필터와 상관없이 항상 전체 목록의 미완료 개수다.
5. 저장: 브라우저 localStorage 에 저장해 새로 고침이나 브라우저 재시작 후에도 유지된다. 저장 데이터가 손상되었으면 앱이 멈추지 않고 빈 목록으로 시작한다.
6. 접근성: 마우스 없이 키보드(Tab, Enter, Space)만으로 모든 기능을 쓸 수 있고 초점 표시가 보인다. 화면 문구는 한국어.

[제약]
- 순수 HTML/CSS/JavaScript(ES 모듈). 프레임워크, 빌드 도구, npm 의존성 없음. package.json 에는 "type": "module" 만 둔다.
- 파일 구조: index.html, src/todo.js(순수 함수: 추가·토글·삭제·필터·개수·검증), src/storage.js(localStorage), src/app.js(화면·이벤트), src/style.css, tests/todo.test.js.
- 테스트는 Node 내장 테스트 러너(node --test, node:test + node:assert)만 쓴다. Vitest, Jest 등은 쓰지 않는다.
- 실행은 python3 -m http.server 8000 후 http://localhost:8000 (file:// 아님).

[하지 않는 것] 로그인, 여러 사용자, 서버 저장, 마감일.

[완성 기준] node --test 가 모두 통과하고, 브라우저에서 할 일을 추가·완료·삭제·필터한 뒤 새로 고침해도 그대로이며, 키보드만으로 모두 조작할 수 있다.
```

## 규칙

- 입력이 충분하면 `bmad-spec` 은 **질문 없이** 바로 정리한다. 부족하면 **express**(일단 초안, 빈칸은 열린 질문으로) 와 **guided**(5개 항목을 하나씩 대화) 중 고르라고 묻는다. 위 입력문이면 대부분 바로 정리된다.
- 끝나면 **가정(Assumptions)** 과 **열린 질문(Open Questions)** 을 짧게 보여 준다. 하나씩 답한다. 답하면 스펙이 그 자리에서 갱신된다.
  - 예: "남은 개수 문구는?" → `남은 할 일 N개`
  - 예: "localStorage 키 이름은?" → `my-todo-bmad:todos`
  - 예: "중복 판단 시 대소문자·공백은?" → `앞뒤 공백 제거 후 완전히 같은 문자열만 중복`
- `bmad-party-mode`(여러 에이전트 토론), `bmad-advanced-elicitation`(다른 관점으로 다시 검토)을 권할 수 있다. 이번 실습에서는 쓰지 않아도 된다.
- 스펙 안의 제목(Why, Capabilities …)은 영어로, 내용은 한국어로 나올 수 있다. 정상이다.
- **`SPEC.md` 를 직접 편집하지 않는다.** 바꾸려면 "CAP-3 의 성공 조건을 …로 바꿔 줘" 처럼 요청한다.

## 산출물

```
_bmad-output/specs/spec-todo-app/
├── SPEC.md        ← 계약서
└── .memlog.md     ← 결정 기록 (한 줄씩 쌓임, SPEC.md 의 원본)
```

`SPEC.md` 예시 (발췌, 실제 문구는 다르다):

```markdown
---
id: SPEC-todo-app
companions: []
sources: []
---
# 할 일 관리 웹 앱

## Why
개인이 브라우저에서 할 일을 가볍게 기록·관리하려는 필요(pain)…

## Capabilities
- **CAP-1**
  - **intent:** 사용자는 할 일을 입력해 목록 끝에 미완료로 추가할 수 있다.
  - **success:** 빈 입력·공백만 입력은 거부되고 안내가 보인다. 201자 이상은 거부되고 입력값이 유지된다. …
- **CAP-2** … 완료 토글
- **CAP-3** … 삭제
- **CAP-4** … 필터와 남은 개수
- **CAP-5** … localStorage 저장·손상 데이터 처리
- **CAP-6** … 키보드 접근성

## Constraints
- 순수 HTML/CSS/JS(ES 모듈), npm 의존성 없음 …
- 테스트는 node --test 만 …

## Non-goals
- 로그인, 여러 사용자, 서버 저장, 마감일

## Success signal
- node --test 통과 + 새로 고침 후에도 목록 유지 + 키보드만으로 조작
```

## 체크리스트

- [ ] `_bmad-output/specs/spec-todo-app/SPEC.md` 가 생겼다.
- [ ] Capabilities 가 `CAP-1` ~ `CAP-6` 정도로 나뉘고, 각각 **success** 조건이 있다.
- [ ] Constraints 에 **npm 의존성 없음**과 **`node --test`** 가 있다.
- [ ] Non-goals 에 **마감일**이 있다 (9단계에서 바꾼다).
- [ ] 열린 질문에 모두 답했다.

---

# 5 단계: 스토리로 나누기 (Story Breakdown)

**목적** — 스펙을 **한 번의 `bmad-build` 로 끝낼 수 있는 크기의 스토리** 몇 개로 나눈다. 할 일 앱은 하나의 에픽이다.

**입력** — 🤖 Claude Code (4단계 대화에 이어서)

`bmad-spec` 이 먼저 "스토리로 나눌까요?" 라고 물으면 "네". 묻지 않으면:

```text
이 스펙을 스토리로 나눠 줘. 3개 정도로, 아래 순서를 제안해:
1. 핵심 로직과 테스트 — package.json, src/todo.js 순수 함수(추가·토글·삭제·필터·개수·검증), tests/todo.test.js
2. 저장과 화면 — src/storage.js, index.html, src/app.js, src/style.css 로 추가·완료·삭제가 화면에서 동작하고 새로 고침 후 유지
3. 필터·남은 개수·안내 문구·키보드 접근성 마무리
```

스토리마다 체크포인트를 물으면 이렇게 답한다.

| 질문 | 뜻 | 이 실습의 답 |
| --- | --- | --- |
| `spec_checkpoint` | 구현 전에 사람이 스토리 계획을 확인할까? | 스토리 1만 **예** (기초를 정하는 스토리) |
| `done_checkpoint` | 이 스토리가 끝나면 멈추고 사람이 확인할까? | 스토리 2만 **예** (처음 화면이 나오는 스토리) |
| `invoke_dev_with` | 구현할 때 덧붙일 메모 | 스토리 1: `node:test 만 사용, npm 패키지 설치 금지` |

마지막으로 🖥️ **터미널** (새 탭)에서 스펙을 커밋한다.

```bash
cd ~/git/my-todo-bmad
git add -A
git commit -m "docs: add todo-app spec and stories"
```

## 규칙

- 스토리는 **독립적으로 리뷰할 수 있는 조각**이어야 한다. 한 스토리가 약 500줄(테스트 제외)을 넘으면 더 나눈다.
- `stories.yaml` 에는 **상태(status)가 없다.** 진행 상태는 6단계에서 생기는 스토리 문서(`stories/N-….md`)의 `status` 로 본다.
- 체크포인트는 **자동 실행 도구(bmad-loop 등)** 가 읽는 값이다. 이 실습처럼 사람이 한 스토리씩 `bmad-build` 를 부를 때는 "여기서는 내가 꼭 확인한다"는 메모로 쓴다.
- **커밋을 꼭 한다.** 스펙 파일이 커밋되지 않은 채 `bmad-build` 를 부르면 "작업 폴더가 깨끗하지 않다"며 멈춘다.

## 산출물

`_bmad-output/specs/spec-todo-app/stories.yaml` (예시):

```yaml
- id: "1"
  title: 핵심 로직과 단위 테스트
  description: >-
    CAP-1~CAP-4 의 규칙을 src/todo.js 순수 함수로 구현하고
    node --test 로 검증한다. 화면은 없다.
  spec_checkpoint: true
  invoke_dev_with: >-
    node:test 만 사용, npm 패키지 설치 금지.
- id: "2"
  title: 저장과 기본 화면
  description: >-
    storage.js 와 index.html·app.js·style.css 로 추가·완료·삭제가
    화면에서 동작하고 새로 고침 후에도 유지되게 한다 (CAP-1~3, CAP-5).
  done_checkpoint: true
- id: "3"
  title: 필터·남은 개수·접근성 마무리
  description: >-
    필터와 전체 기준 남은 개수, 안내 문구, 키보드 조작과 초점 표시를
    완성한다 (CAP-4, CAP-6).
```

## 체크리스트

- [ ] `stories.yaml` 이 `SPEC.md` 옆에 생겼다.
- [ ] 스토리 `id` 가 `"1"`, `"2"`, `"3"` 처럼 따옴표 문자열이다.
- [ ] 모든 Capability 가 적어도 하나의 스토리 설명에 들어 있다.
- [ ] `git status` 가 깨끗하다.

---

# 6 단계: 스토리별 구현 — `/bmad-build`

**목적** — 스토리마다 **새 대화**에서 `bmad-build` 를 불러 앱을 만든다. 한 번의 `bmad-build` 는 다음을 순서대로 한다.

```
① 명확히 하기·경로 결정   스펙·스토리·코드를 읽고, 작업이 하나의 목표인지 확인
② 계획                  스토리 문서(stories/N-….md)를 쓰고 열린 질문을 묻는다 → 사람 승인
③ 구현                  변경 전 기준 커밋(baseline)을 기록하고 코드·테스트 작성
④ 리뷰                  독립 리뷰어들이 diff 를 검토 (적대적 · 엣지 케이스 · 검증 공백)
                        → 이번 변경의 문제는 고치고, 관련 없는 것은 deferred-work.md 로 미룸
⑤ 마무리                 스토리 상태를 done 으로, 로컬 git 커밋, 짧은 요약 + 다음 행동 제안
```

## 6-1. 스토리 1 — 핵심 로직과 테스트

**입력** — 🤖 Claude Code

```text
/clear
```

```text
/bmad-build _bmad-output/specs/spec-todo-app 의 스토리 1 을 구현해 줘.
```

**계획 승인 화면** — 계획(스토리 문서)이 만들어지면 열린 질문을 먼저 묻고, 이어서 셋 중 하나를 고르라고 한다.

| 선택지 | 뜻 | 이 실습 |
| --- | --- | --- |
| **Approve and continue** | 계획 승인, 이 대화에서 바로 구현 | ✅ 계획이 스펙과 맞으면 이것 |
| Approve and stop | 계획만 승인(`ready-for-dev`)하고 멈춤. 새 대화에서 `bmad-build` 를 다시 부르면 구현부터 이어 감 | 대화가 길어졌을 때 |
| Review spec | 계획을 (서브에이전트로) 검토하고 고친 뒤 승인 | 계획이 이상할 때 |

승인 전에 계획에서 다음을 확인한다. (`spec_checkpoint: true` 인 스토리)

- 파일 구조가 스펙의 Constraints 와 같다 (`src/todo.js`, `tests/todo.test.js` …).
- 테스트가 **`node:test`** 를 쓴다. Vitest·Jest·`npm install` 이 보이면 승인하지 말고 "스펙 Constraints 대로 node:test 만 쓰게 계획을 고쳐 줘" 라고 한다.

> 💡 작고 위험이 없는 작업이면 `bmad-build` 가 **가벼운 경로(light path)** 를 골라, 승인을 묻지 않고 짧은 계획 → 구현 → 리뷰로 바로 갈 수도 있다. 정상이다.

구현과 리뷰가 끝나면 이런 요약이 나온다. (예시)

```
스토리 1 완료: 할 일 순수 함수와 단위 테스트 22개 추가, node --test 통과.
리뷰: 2건 수정(공백만 입력 검증, 201자 경계), 미룬 일 없음. 커밋 a1b2c3d.
다음: PR 만들기 / bmad-walkthrough / 다른 변경
```

🖥️ **터미널**에서 확인:

```bash
node --test
git log --oneline -3
```

## 6-2. 스토리 2 · 3

스토리마다 **대화를 비우고** 같은 방식으로 부른다.

```text
/clear
```

```text
/bmad-build _bmad-output/specs/spec-todo-app 의 스토리 2 를 구현해 줘.
```

스토리 2가 끝나면(`done_checkpoint: true`) **6-3 의 화면 확인**을 먼저 하고, 문제가 없으면 스토리 3으로 간다.

```text
/clear
```

```text
/bmad-build _bmad-output/specs/spec-todo-app 의 스토리 3 을 구현해 줘.
```

## 6-3. 처음 실행해 보기 (화면이 비어 있을 때)

🖥️ **터미널** (새 탭)

```bash
cd ~/git/my-todo-bmad
python3 -m http.server 8000
```

🌐 **브라우저** — `http://localhost:8000`

입력란 · 추가 버튼 · 목록이 보이면 [SAMPLE.md](SAMPLE.md) 로 자세히 확인한다.

**화면이 비어 있거나 버튼이 동작하지 않으면** — 브라우저에서 **⌘ + ⌥ + J**(Console)를 열어 빨간 오류를 복사한 뒤 🤖 Claude Code 에:

```text
/clear
```

```text
/bmad-build http://localhost:8000 에서 화면이 비어 있어. 브라우저 콘솔 오류는 아래와 같아. 원인을 찾아 고치고, 같은 문제가 다시 생기지 않게 확인 방법도 알려 줘.
(콘솔 오류 붙여 넣기)
```

자주 있는 원인: `index.html` 의 `<script type="module" src="src/app.js">` 경로가 틀림, `import` 경로에 `.js` 확장자 빠짐, `file://` 로 연 경우.

## 규칙

- **스토리 하나 = 새 대화 하나 = `bmad-build` 한 번.** 이전 대화의 맥락이 섞이면 BMAD가 헷갈린다.
- 시작 전에 `git status` 가 깨끗해야 한다. 직접 고친 파일이 있으면 커밋하거나 되돌린 뒤 부른다.
- **열린 질문은 신중하게 답한다.** 여기서 잘못 답한 것이 가장 비싸게 고쳐야 하는 실수다.
- 요청에 목표가 여러 개면 **Split**(첫 목표만 하고 나머지는 미룸) 과 **Keep all goals** 중 고르라고 한다. 스토리 범위를 지키려면 **Split**.
- 문제가 생겨 되돌리고 싶으면 🖥️ `git revert HEAD` 후, 새 대화에서 다른 방법으로 `bmad-build` 를 다시 부른다.
- 이전 스토리의 결정(코드 구조, 디자인 메모)은 `bmad-build` 가 같은 스펙 폴더의 완료된 스토리 문서에서 이어받는다.

## 산출물

```
_bmad-output/specs/spec-todo-app/stories/
├── 1-core-logic-and-tests.md       ← 이름은 다를 수 있다
├── 2-storage-and-basic-ui.md
└── 3-filter-count-accessibility.md

index.html
package.json          {"type": "module"}
src/todo.js  src/storage.js  src/app.js  src/style.css
tests/todo.test.js
```

스토리 문서 앞부분 (예시):

```markdown
---
status: done              # draft → ready-for-dev → in-progress → in-review → done
baseline_commit: 9f8e7d6  # 구현 전 기준 커밋
---
# 스토리 1: 핵심 로직과 단위 테스트
<frozen-after-approval>   ← 승인 후에는 사람만 바꿀 수 있는 부분
… 의도, 결정, 수용 기준 …
</frozen-after-approval>
## Code Map / Tasks / Design Notes / Spec Change Log …
```

## 체크리스트

- [ ] `stories/` 에 스토리 문서 3개가 있고 모두 `status: done` 이다.
- [ ] `node --test` 가 `# fail 0` 이다.
- [ ] `git log --oneline` 에 스토리마다 커밋이 하나씩 있다 (`feat: …` 같은 conventional 메시지).
- [ ] `package.json` 에 `dependencies`/`devDependencies` 가 없고, `node_modules/` 가 없다.
- [ ] `http://localhost:8000` 에서 화면이 보인다.

---

# 7 단계: 사람이 확인하기 — `/bmad-walkthrough`

**목적** — `bmad-build` 가 스스로 리뷰했지만, **사람이 직접** 무엇이 바뀌었는지 보고 테스트한다. `bmad-walkthrough` 는 변경의 목적 → 꼭 봐야 할 곳 → 테스트 방법 순서로 안내한다.

**입력** — 🤖 Claude Code

```text
/clear
```

```text
/bmad-walkthrough 이 에픽(_bmad-output/specs/spec-todo-app)에서 바뀐 전체 코드를 처음 커밋 이후부터 같이 살펴보자.
```

안내에 따라 파일을 보고, 테스트 방법이 나오면 [SAMPLE.md](SAMPLE.md) 5단계 시나리오를 함께 실행한다.

**(선택) 더 꼼꼼한 리뷰**

```text
/clear
```

```text
/bmad-code-review 처음 커밋 이후 전체 변경을 리뷰해 줘.
```

## 규칙

- 다르게 동작하는 것을 발견하면 SAMPLE 시나리오 번호(예: `F4`)와 함께 메모한다. 고치는 방법은 [SAMPLE.md 7단계](SAMPLE.md#7단계-스펙과-다를-때-고치기) 를 따른다.
- `bmad-code-review` 는 여러 리뷰어가 병렬로 보고 결과를 분류(triage)한다. 발견 사항이 **0개도 정상 결과**다.

## 산출물

- 사람이 확인한 결과 메모 (통과 / 다른 시나리오 번호)
- (선택) 코드 리뷰 발견 사항과 적용된 수정 커밋

## 체크리스트

- [ ] 핵심 파일(`src/todo.js`, `src/app.js`)에서 각 Capability 가 어디 구현되었는지 안다.
- [ ] SAMPLE 5단계 시나리오를 모두 해 보았다.

---

# 8 단계: 에픽 마무리 — `/bmad-retrospective`

**목적** — 스토리를 하나씩이 아니라 **에픽 전체로** 돌아본다. `bmad-retrospective` 는 스펙·스토리 문서·diff·커밋을 증거로 읽고, 스토리 하나만 봐서는 안 보이는 문제를 찾아 **스펙의 성공 기준에 비춰 승인 여부**를 판단한다.

**입력** — 🤖 Claude Code

```text
/clear
```

```text
/bmad-retrospective _bmad-output/specs/spec-todo-app 에픽 회고를 해 줘.
```

🖥️ **터미널**에서 미룬 일과 이력을 확인한다.

```bash
cat _bmad-output/implementation-artifacts/deferred-work.md 2>/dev/null || echo "미룬 일 없음"
git log --oneline
```

## 규칙

- 회고의 발견 사항에는 **근거(파일·줄·커밋)** 가 붙는다. 근거 없는 주장은 BMAD가 스스로 버린다.
- 승인되지 않으면(예: CAP-6 키보드 성공 조건 미충족) 실행 항목(action item)을 `bmad-build` 로 처리한 뒤 다시 회고한다.
- `deferred-work.md` 의 항목은 나중에 `bmad-build` 에 하나씩 넣어 처리할 수 있다.

## 산출물

- 회고 문서 (발견 사항 · 실행 항목 · 승인 결정) — 경로는 회고 끝에 안내된다
- (있으면) `_bmad-output/implementation-artifacts/deferred-work.md`

## 체크리스트

- [ ] 회고 결과가 **승인(accept)** 이거나, 실행 항목을 처리했다.
- [ ] `deferred-work.md` 를 읽고 남길 것과 지금 할 것을 정했다.

---

# 9 단계: (도전) 마감일 기능 추가 — 스펙 갱신 → `/bmad-build`

**목적** — 기능을 바로 코드로 넣지 않고, **스펙을 먼저 갱신**(Non-goals 에서 마감일을 빼고 새 Capability 추가)한 뒤 구현한다. BMAD의 "배우고 조정 → 계획으로 돌아가기" 를 체험한다.

**입력** — 🤖 Claude Code

```text
/clear
```

```text
/bmad-spec _bmad-output/specs/spec-todo-app 스펙을 갱신해 줘.
- Non-goals 에서 마감일을 뺀다.
- 새 기능: 할 일에 선택적으로 마감일을 지정한다. HTML date 입력을 쓰고 YYYY-MM-DD 문자열로 저장한다. 마감일이 지난 미완료 할 일은 눈에 띄게 표시한다. 목록을 마감일이 가까운 순으로 정렬할 수 있다(마감일 없는 항목은 맨 아래). 예전에 저장된 마감일 없는 할 일도 그대로 보여야 한다.
- 테스트는 기존처럼 node --test 로 추가한다.
그리고 이 기능을 스토리 4 로 추가해 줘.
```

🖥️ **터미널**

```bash
git add -A && git commit -m "docs: add due-date capability to todo-app spec"
```

🤖 **Claude Code**

```text
/clear
```

```text
/bmad-build _bmad-output/specs/spec-todo-app 의 스토리 4 를 구현해 줘.
```

## 규칙

- 같은 slug(`todo-app`)로 부르면 **같은 폴더의 스펙을 그 자리에서 갱신**한다. 기존 `CAP-1` ~ `CAP-6` 번호는 그대로이고 새 기능은 `CAP-7` 이 된다.
- 스펙이 바뀌면 `bmad-spec` 이 기존 스토리 설명이 아직 맞는지 확인하고, 다시 나눌지 묻는다. 기존 스토리 1~3 의 id 는 이미 스토리 문서가 있으므로 바뀌지 않는다.
- 저장 형식이 바뀌므로 **기존 데이터 호환**(마감일 없는 할 일)을 꼭 확인한다.
- 작은 기능이므로 스펙 갱신 없이 `/bmad-build 마감일 기능 …` 으로 바로 해도 동작은 한다. 그러나 그러면 `SPEC.md` 의 Non-goals 와 코드가 어긋난다. 스펙 주도 개발에서는 **스펙을 먼저** 바꾼다.

## 산출물

- `SPEC.md` — Non-goals 에서 마감일 제거, `CAP-7` 추가 (`.memlog.md` 에 변경 기록)
- `stories.yaml` — 스토리 `"4"` 추가
- `stories/4-….md` (`status: done`), 바뀐 `src/`·`tests/`, 새 커밋

## 체크리스트

- [ ] `SPEC.md` 에 `CAP-7`(마감일)이 있고 Non-goals 에 마감일이 없다.
- [ ] `node --test` 가 통과한다.
- [ ] [SAMPLE.md 8단계](SAMPLE.md#8단계-도전-마감일-기능-써-보기) 와 5단계(기존 기능) 시나리오가 모두 동작한다.

---

# 부록 A. CLAUDE.md 규칙 조각

프로젝트 루트의 `CLAUDE.md` 에 붙여 두면, BMAD 스킬 밖에서 대화할 때도 같은 흐름을 지킨다.

```markdown
## BMAD 규칙

- 이 프로젝트는 BMAD Method(v6)로 개발한다. 기준 문서는 `_bmad-output/specs/spec-todo-app/SPEC.md` 와 `stories.yaml` 이다.
- 기술 제약은 SPEC.md 의 Constraints 를 따른다: 순수 HTML/CSS/JS(ES 모듈), localStorage, `node --test`, npm 의존성 없음.
- SPEC.md 는 직접 편집하지 않는다. 바꿀 때는 `/bmad-spec` 으로 갱신한다.
- 기능 추가·버그 수정 요청을 받으면 코드를 바로 고치지 말고 `/bmad-build` 를 제안한다. 범위가 크면 먼저 스펙 갱신과 스토리 추가를 제안한다.
- 다음에 무엇을 할지 모르면 `/bmad-help` 를 제안한다.
- 문서와 화면 문구, 대답은 한국어로 쓴다.
```

> 💡 BMAD에는 이런 규칙을 검증해 가며 `AGENTS.md` 로 만들어 주는 `/bmad-project-context` 스킬도 있다. 기존 코드베이스에 BMAD를 붙일 때 특히 유용하다.

# 부록 B. 자주 겪는 문제

| 증상 | 원인 / 해결 |
| --- | --- |
| `/bmad-…` 스킬이 안 보인다 | `my-todo-bmad` 폴더 **안에서** `claude` 를 실행했는지 확인. `ls .claude/skills` 로 설치 확인. Claude Code 재시작 |
| 설치 중 `Python UV check` 경고 | uv 미설치. `brew install uv` 후 설치 명령 다시 실행 |
| 스킬이 `uv: command not found` 로 실패 | 위와 같음. 설치 후 터미널을 새로 열어 `uv --version` 확인 |
| 대답·문서가 영어로 나온다 | 설치 명령을 `--communication-language Korean --document-output-language Korean` 으로 다시 실행 (다시 설치해도 기존 산출물은 그대로) |
| `bmad-build` 가 "작업 폴더가 깨끗하지 않다"며 멈춘다 | 커밋하지 않은 변경이 있다. `git status` 확인 후 `git add -A && git commit -m "…"` |
| `bmad-build` 가 진행 중인 스펙 목록을 보여 주고 멈춘다 | 끝나지 않은 스토리 문서(`draft`·`in-progress` 등)가 있다. 이어서 할 것을 고르거나 그 문서 경로를 직접 넘긴다 |
| 계획에 Vitest·Jest·`npm install` 이 들어갔다 | 승인하지 말고 "SPEC.md Constraints 대로 node:test 만 쓰게 계획을 고쳐 줘". 이미 구현되었으면 `/bmad-build 테스트를 node --test 로 바꾸고 npm 의존성을 없애 줘` |
| 인터넷 글의 `bmad-create-prd`, `bmad-dev-story`, `*agent` 가 안 된다 | 예전 이름이다. 지금은 `bmad-prd`, `bmad-build`, `/bmad-agent-…` |
| GitHub README와 이 문서가 다르다 | `main` 은 v7 알파다. v6 문서는 `V6.12` 브랜치 |
| 대화가 길어지고 답이 이상해졌다 | `/clear` 후 하던 스킬을 다시 부른다. `bmad-build` 는 스토리 문서의 `status` 를 보고 이어서 한다 |
| 어디까지 했는지 모르겠다 | `/bmad-help 지금 어디까지 했어?` |
| 화면이 비어 있다 | `file://` 대신 `python3 -m http.server 8000`. 그래도 비면 6-3 의 프롬프트로 `bmad-build` |
| BMAD를 지우고 싶다 | 🖥️ `npx bmad-method uninstall` (또는 `_bmad/`, `.claude/skills/bmad-*` 삭제) |

# 부록 C. 용어 정리

| 용어 | 뜻 |
| --- | --- |
| 스킬 (skill) | AI 도구에 설치되는 이름 붙은 명령. `SKILL.md` 하나에 지시가 들어 있다. `/bmad-help` 처럼 부른다 |
| 에이전트 (persona) | Mary·John·Winston·Amelia·Sally 처럼 역할과 말투를 가진 스킬. 메뉴 코드로 워크플로를 시작 |
| 메뉴 코드 | 에이전트를 부른 뒤 입력하는 짧은 코드 (`PRD`, `BD`, `CR` …) |
| 에픽 (epic) | 여러 번의 구현 세션이 필요한 하나의 목표. 이 모듈의 할 일 앱 |
| 스토리 (story) | 에픽을 `bmad-build` 한 번에 끝낼 크기로 나눈 조각. `stories.yaml` 의 한 항목 |
| `SPEC.md` | Why · Capabilities · Constraints · Non-goals · Success signal 5개 항목의 계약서 |
| Capability (`CAP-N`) | 스펙의 기능 하나. intent(의도) + success(성공 조건) |
| `.memlog.md` | 결정을 한 줄씩 쌓는 기록. `SPEC.md` 는 여기서 매번 다시 만들어진다 |
| 스토리 문서 | `stories/N-….md`. `bmad-build` 가 쓰는 계획·구현 기록. `status` 로 진행 상태 표시 |
| baseline commit | 구현 전 기준 커밋. 리뷰는 여기서부터의 diff 를 본다 |
| light path / plan | 위험이 없는 작업은 짧은 계획으로 바로 구현, 아니면 전체 계획 + 승인 |
| 독립 리뷰어 | 구현과 분리된 리뷰 서브에이전트 (적대적 · 엣지 케이스 · 검증 공백) |
| deferred work | 리뷰에서 이번 변경과 관계없어 미룬 일. `deferred-work.md` |
| 회고 (retrospective) | 에픽 전체를 증거로 돌아보고 승인 여부를 판단 |
| Fast path / Coaching path | PRD·브리프 작성 방식. 한 번에 초안 / 섹션마다 코칭 |
