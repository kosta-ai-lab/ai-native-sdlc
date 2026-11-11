# 모듈 — pstack — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

Cursor 공식 플러그인 저장소의 pstack(Lauren Tan, poteto)을 Claude Code에 설치하고, 할 일 관리 앱에 **반복 할 일** 기능을 추가하는 실습으로 **목표와 완료 조건만 말하면 `/poteto-mode`가 플레이북을 골라 설계·구현·검증까지 증거와 함께 끝내는** 방식을 익히며, 원칙·플레이북·검증 스킬로 하네스를 구성하는 방법을 배워본다.

## pstack이란

**pstack**은 React 코어 팀원이자 Cursor 엔지니어인 Lauren Tan(poteto)이 매일 쓰는 **에이전트 스킬 모음**입니다. Cursor 공식 플러그인 저장소([cursor/plugins](https://github.com/cursor/plugins))의 `pstack` 폴더에 있고, **Cursor와 Claude Code 양쪽**에서 플러그인으로 설치할 수 있습니다. 무료 오픈소스(MIT 라이선스)입니다.

저자가 내세우는 말은 "**빨리 가고 싶으면 먼저 깊게 가라**(if you want to go fast, go deep first)"입니다. AI가 코드를 많이 쓰는 것이 목표가 아니라, **더 적지만 더 좋은 코드**를 쓰는 것이 목표입니다. 에이전트 하나를 깊이 믿을 수 있게 만들면, 여러 에이전트를 동시에 돌려도 안심할 수 있다는 생각입니다.

### 핵심 개념 6가지

#### 1. `/poteto-mode` — 정문(front door)
pstack의 거의 모든 일은 이 스킬 하나로 시작합니다. 사람은 **무엇을 원하는지와 끝났는지 확인하는 방법**만 말하고, `/poteto-mode`가 할 일 목록을 만들고 필요한 스킬을 순서대로 부릅니다. 스킬 이름을 하나하나 지정하지 않는 것이 요령입니다.

#### 2. Playbook (플레이북)
`/poteto-mode`가 고르는 **작업 유형별 절차서**입니다. 23개가 있습니다. 예) 조사(investigation), 버그 수정(bug fix), **기능 추가(feature)**, 리팩터링, 성능, 프로토타입, PR 열기(opening a PR) 등.
고른 플레이북의 단계는 **할 일 목록(todo list)에 그대로 복사**됩니다. 건너뛴 단계도 `skip: <이유>`로 목록에 남아서 무엇을 생략했는지 볼 수 있습니다.

#### 3. 좋은 프롬프트의 5요소
pstack 가이드가 권하는 프롬프트 구성입니다. 각각 한 문장이면 충분합니다.

| 요소 | 뜻 | 예 |
|---|---|---|
| **목표** | 무엇이 문제이고 무엇을 원하는지 | "반복 할 일 기능을 추가해줘" |
| **완료 조건** | 통과/실패를 판단할 수 있는 확인 방법 | "완료하면 마감일이 7일 뒤인 새 회차가 생긴다" |
| **보고 싶은 증거** | 실제 명령 출력, 저장된 값, 전후 비교 | "실제 CLI 출력을 보여줘" |
| **이미 아는 것** | 증상, 재현 방법, 로그 | "지금은 done 후에 다음 주 것을 손으로 add 해야 함" |
| **진짜 제약** | 지켜야 할 조건 | "기존 출력 형식은 그대로", "PR은 열지 마" |

빼야 할 것도 있습니다. **어떻게 할지(구현 방법)** 와 **처음부터 내 추측(원인)** 은 적지 않습니다. 에이전트가 더 좋은 길을 찾을 여지를 남기기 위해서입니다.

#### 4. Principle (원칙) 24개
"삭제와 가장 작은 변경을 선호하라(laziness-protocol)", "실제 결과물로 증명하라(prove-it-works)", "구현이 아니라 동작을 테스트하라(test-behavior-not-implementation)" 같은 원칙이 각각 짧은 스킬로 들어 있습니다. `/poteto-mode`는 작업 시작 때 원칙 목록을 읽고, **답변에서 어떤 원칙이 어떤 결정을 바꿨는지 이름을 대서** 설명합니다. 작업 중에 원칙 이름을 말해서 방향을 바꿀 수도 있습니다. 예) "prove-it-works 지켜. 실제로 실행해 봐."

#### 5. 여러 에이전트로 설계하고 공격하기
- **`/architect`**: 코드를 쓰기 전에 호출하는 쪽의 사용법, 타입, 모듈 모양을 먼저 정합니다. 안에서 `/arena`를 씁니다.
- **`/arena`**: 여러 서브에이전트가 같은 과제를 **각자 따로** 풀고, 심판이 점수를 매긴 뒤 가장 좋은 안을 바탕으로 다른 안의 좋은 부분을 합칩니다.
- **`/interrogate`**: 완성된 변경을 여러 "적(adversary)" 에이전트가 **깨뜨려 보려고** 합니다. **실제로 실행해서 증명한 문제만** 남기고 나머지는 버립니다.

#### 6. Verification Skill (검증 스킬)
에이전트가 **앱을 사람처럼 실행해 보고 증거를 남기는 방법**을 적은 프로젝트 전용 스킬입니다. `/create-verification-skill`이 저장소를 살펴보고 `.claude/skills/verify-<앱이름>/`에 만들어 줍니다(Cursor에서는 `.cursor/skills/`). 한 번 만들어 두면 "앱에서 검증해"가 어떤 에이전트든 따라 할 수 있는 단계가 됩니다. pstack 가이드는 **"이 가이드에서 가장 효과가 큰 것"** 으로 이 스킬을 꼽습니다.

### 추가로 알아두면 좋은 개념

| 개념 | 설명 |
|---|---|
| **`pstack:` 접두어** | Claude Code는 플러그인 명령 앞에 플러그인 이름을 붙입니다. `/poteto-mode`는 Claude Code에서 **`/pstack:poteto-mode`** 입니다. 이 가이드는 Claude Code 이름으로 적습니다. |
| **`/setup-pstack`** | 역할별로 어떤 모델·추론 강도를 쓸지 정하는 설정 스킬. Claude Code에서는 `~/.claude/rules/pstack-models.md`에 저장됩니다. |
| **모델 역할** | 기본값은 코드 작성은 Grok, 판단·글쓰기는 Opus입니다. Claude Code에서는 Claude가 아닌 모델을 부를 수 없으므로 그 역할은 **현재 세션 모델**로 실행됩니다. |
| **`poteto-agent`** | `/poteto-mode`가 일을 맡길 때 띄우는 서브에이전트. 시작할 때 poteto-mode 규칙 전체를 읽고 일합니다. |
| **Comment Sicko** | 코드 주석만 검토하는 읽기 전용 서브에이전트. `/no-comments`가 부릅니다. 꼭 필요한 주석(라이선스, 공개 API 문서 등) 외에는 지우자고 합니다. |
| **Cursor 전용 기능** | Cursor Automations, Bugbot, 클라우드 에이전트는 Claude Code에 없습니다. 이런 단계는 `Skipped in Claude Code: …` 한 줄을 남기고 건너뜁니다. |
| **비용** | 서브에이전트와 리뷰 패널을 많이 띄우므로 **토큰을 많이 씁니다.** 실습에서는 `/setup-pstack`에서 예산을 `small`이나 `medium`으로 고르세요. |

## 이 모듈에서 다루는 것

| 구분 | 내용 |
|---|---|
| 설치 | `claude plugin marketplace add cursor/plugins` → `claude plugin install pstack@cursor-plugins` |
| 설정 | `/pstack:setup-pstack` — 예산과 역할별 모델, **프로젝트 검증 스킬**(`verify-todo-app`) 생성 |
| 이해 | `/pstack:how` — 고치기 전에 현재 코드의 동작을 설명받기 (읽기 전용) |
| 구현 | `/pstack:poteto-mode` — 목표·완료 조건·증거·제약을 담은 한 번의 요청 → Feature 플레이북 → architect/arena 설계 → 서브에이전트 구현 → 실제 실행 증거 |
| 검증 | `/pstack:interrogate` — 여러 적 에이전트가 변경을 깨뜨려 보고, **실행으로 증명된 문제만** 보고 |
| 정리 | `/pstack:no-comments` — 다른 눈(Comment Sicko)으로 주석 정리 |
| 출시 | (선택) Opening a PR 플레이북으로 PR 생성 (GitHub 필요) |
| 실습 예제 | `todo-app` 할 일 관리 CLI에 "완료하면 다음 회차가 생기는 반복 할 일" 추가 |

## 같은 예제로 본 세 하네스 비교

M33(mattpocock/skills), M35(gstack), M37(pstack)은 모두 같은 `todo-app` + 반복 할 일 예제를 씁니다.

| 관점 | mattpocock/skills (M33) | gstack (M35) | pstack (M37) |
|---|---|---|---|
| 철학 | 작고 조합 가능한 스킬. 과정은 사람이 쥠 | 스프린트 전체를 역할별 과정으로 제공 | "빨리 가려면 먼저 깊게". 적지만 좋은 코드 |
| 입구 | 단계마다 다른 스킬 | `/office-hours`부터 순서대로 | **`/poteto-mode` 하나** |
| 사람의 결정 | 인터뷰로 하나씩 합의 (많이 물음) | 단계마다 질문 | **프롬프트에 미리** 담음. 거의 묻지 않고 진행 후 바로잡기 |
| 계획 | 스펙·티켓 문서 | 설계 문서 + `/autoplan` | 계획 스킬 없음. "가장 좋은 스펙은 코드"로 보고 `architect`·`arena`로 시안 경쟁 |
| 검증 | `tdd` + 두 축 `code-review` | `/review` + `/qa` | 검증 스킬로 **실제 실행 증거** + `/interrogate` |
| 여러 모델 | 사용 안 함 | 선택(Codex 두 번째 의견) | 기본 설계에 포함(Opus·Grok 패널). Claude Code에서는 Claude만 |
| 특징 | 용어집(공유 언어) | 가상 팀 역할 | 여러 모델·여러 서브에이전트를 경쟁시키고 교차 검증 |
| 주 대상 도구 | 여러 에이전트 | Claude Code | **Cursor** (Claude Code 어댑터 제공) |

## 문서 구성

- [GUIDE.md](GUIDE.md) — 이 실습에서 할 일과 0~8단계 따라하기 (단계별 규칙·산출물·체크리스트)
- [SAMPLE.md](SAMPLE.md) — 예제 앱 `todo-app` 설명 (파일 구조·실행 방법, 실습 후 바뀌는 점)
- [todo-app/](todo-app/) — 실습 출발점이 되는 할 일 관리 CLI (Node.js, 의존성 없음, 테스트 5개). 강의 자료 저장소 밖으로 복사해서 사용

## 산출물 4종 (체크리스트)

- [x] 가이드 — GUIDE.md 단계 목적·입력·산출물·체크리스트
- [ ] 규칙 — CLAUDE.md 조각 (pstack은 모델 설정을 `~/.claude/rules/pstack-models.md`에 별도 규칙으로 저장)
- [x] 자동화 — pstack 스킬·서브에이전트 (`/pstack:poteto-mode`, `/pstack:interrogate`, `poteto-agent`, Comment Sicko 등) + 생성된 프로젝트 검증 스킬 `verify-todo-app`
- [x] 샘플 — SAMPLE.md 예제 앱 `todo-app` 설명

## 품질 기준

동작하는 샘플 또는 재현 가능한 프롬프트가 반드시 첨부되어야 하며, 문서는 따라 하면 되는 수준이어야 한다.

## 기준 버전과 주의 사항

- pstack 0.15.36 (cursor/plugins 2026-11-09 커밋 `de8ee15`), MIT 라이선스
- 가이드는 **Claude Code**에서 쓰는 방법으로 작성했습니다. Cursor에서 쓸 때의 차이는 GUIDE.md 각 단계의 규칙에 적었습니다.
- pstack은 **Cursor 우선**으로 만들어졌습니다. Claude Code에서는 명령에 `pstack:` 접두어가 붙고, Cursor 전용 기능(Automations, Bugbot, 클라우드 에이전트)은 건너뛰며, Claude가 아닌 모델(Grok 등) 역할은 세션 모델로 실행됩니다.
- 서브에이전트와 리뷰 패널을 많이 쓰므로 토큰 사용량이 큽니다. 실습에서는 예산 `small`을 권장합니다.
- Claude Code에서는 제3자 마켓플레이스 자동 업데이트가 꺼져 있어 설치한 버전에 머뭅니다.

## 참고 링크
- pstack: https://github.com/cursor/plugins/tree/main/pstack
- pstack 가이드(10장): https://github.com/cursor/plugins/tree/main/pstack/docs/guide
- Claude Code 어댑터(이름 대응표): https://github.com/cursor/plugins/blob/main/pstack/docs/harness/claude-code.md
- `/poteto-mode`와 플레이북: https://github.com/cursor/plugins/tree/main/pstack/skills/poteto-mode
