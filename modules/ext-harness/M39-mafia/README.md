# 모듈 — MAFIA Code-Review harness — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

vibemafiaclub의 MAFIA Code-Review harness를 Claude Code 플러그인으로 설치하고, 할 일 관리 앱에 **반복 할 일** 기능을 구현한 뒤 **설계의도 → 평가기준 → PR 본문 → 근거 기반 코드리뷰 → 리뷰 반영·QA** 파이프라인으로 리뷰해 보며, 팀의 코딩 컨벤션과 ADR을 리뷰 기준으로 삼는 코드리뷰 하네스를 구성하는 방법을 배워본다.

## mafia-codereview란

**MAFIA Code-Review harness**(이하 mafia-codereview)는 vibemafiaclub이 만든 **Claude Code용 코드리뷰 자동화 파이프라인**입니다. Claude Code 플러그인 하나로 설치하며, 명령 하나(`/mafia-codereview:auto`)로 아래 과정을 순서대로 진행합니다.

**설계의도 정리 → 평가기준 수립 → PR 본문 작성 → 근거 기반 코드리뷰 → 리뷰 반영과 QA**

이 하네스의 핵심 생각은 **"리뷰는 기준과 의도에 근거해야 한다"** 입니다. AI 리뷰가 흔히 빠지는 두 가지 문제를 막도록 설계되어 있습니다.

| 흔한 AI 리뷰의 문제 | mafia-codereview의 해결 |
|---|---|
| **근거 없는 취향 리뷰** ("저라면 이렇게 하겠어요") | 팀의 **코딩 컨벤션과 ADR**에서 이번 작업에 맞는 항목만 뽑아 **평가기준 문서**를 만들고, 모든 리뷰 코멘트가 그 기준을 인용하게 함 |
| **의도를 모르는 리뷰** (일부러 그렇게 한 것을 "왜 이렇게 했나요?") | 리뷰 전에 **설계의도 문서**를 만들어, 의도적인 결정은 존중하고 **의도와 구현이 어긋난 곳만** 지적하게 함 |

### 파이프라인 6단계

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

### 핵심 개념 6가지

#### 1. Code Convention (`docs/code-convention.yaml`)
팀이 **항상** 지키는 코딩 규칙 목록입니다. 항목마다 `id`, `rule`(규칙), `stacks`(적용 대상 기술)를 적습니다. `stacks: [all]`은 모든 작업, `stacks: [node]`는 Node.js 코드에만 적용됩니다. 평가기준을 만들 때 이번 작업과 관련된 stacks의 항목만 골라 씁니다.

#### 2. ADR (`docs/adr.yaml`)
**Architecture Decision Record**, 팀이 내린 **중요한 기술 결정과 그 이유**의 기록입니다. 항목마다 `context`(왜 이 결정이 필요했나), `decision`(무엇을 정했나), `consequence`(그 결과 지켜야 할 것)를 적습니다. 평가기준을 만들 때 **서브에이전트가 ADR 전체를 읽고 이번 작업과 관련된 항목만** 뽑아 "이 작업에 어떻게 적용되는지"를 설명합니다. 관련 없는 ADR은 빠집니다.

#### 3. Design Intent (설계의도, `design-intent.md`)
**이번 작업이 무엇을 해결하고, 어떤 선택을 왜 했고, 무엇을 일부러 뺐는지**를 적은 문서입니다. **현재 대화에서 논의된 내용**으로 작성되므로, 구현할 때 나눈 설계 대화가 그대로 재료가 됩니다. 리뷰어는 이 문서에 적힌 의도적 결정에는 이의를 달지 않습니다.

#### 4. Evaluation Criteria (평가기준, `code-quality-guide.md`)
Code Convention(공통 기준) + 이번 작업 관련 ADR(작업별 기준)을 합친 문서입니다. **리뷰의 유일한 근거**입니다.

#### 5. 우선순위 `[p1]`~`[p4]` 와 side effect
리뷰 코멘트는 네 단계로 나뉩니다.

| 표시 | 뜻 | 리뷰 반영 단계의 기본 처리 |
|---|---|---|
| `[p1]` | 반드시 수정 (버그, 기준 위반, 의도-구현 불일치) | 기본 수용. 거부하려면 명확한 근거 필요 |
| `[p2]` | 강력 권장 (유지보수성·가독성에 의미 있는 영향) | 판단과 근거를 보여 주고 **사람이 확인** |
| `[p3]` | 권장 (지금도 동작에는 문제 없음) | 판단을 보여 주고 **사람 재량** |
| `[p4]` | 사소한 개선 (이름, 형식) | 일괄 수용 또는 무시 |

변경을 제안할 때는 **side effect(부수 효과)와 그럼에도 제안하는 이유**를 함께 적습니다. 리뷰는 무조건 따라야 하는 명령이 아니라 **판단 재료**라는 생각입니다.

#### 6. Fork와 Sub-agent
- **Fork(worktree)**: 현재 저장소의 **별도 작업 폴더**(git worktree)를 만들어 그 안에서 단계를 실행합니다. [2]~[4]는 **문서만 만들고 소스코드는 건드리지 않습니다.**
- **Sub-agent**: 메인 대화와 분리된 별도 에이전트. ADR 분석([3])과 코드리뷰([5])를 맡깁니다. 리뷰를 메인 대화가 아닌 별도 에이전트가 하므로, **구현한 대화의 생각에 끌려가지 않는 리뷰**가 됩니다.

### 추가로 알아두면 좋은 개념

| 개념 | 설명 |
|---|---|
| **`.review-artifacts/{브랜치명}/`** | 모든 산출물이 저장되는 폴더. 브랜치마다 따로 생깁니다. 예) `.review-artifacts/feature/recurring-todos/` |
| **단계별 명령** | `auto` 대신 단계를 하나씩 실행할 수도 있습니다: `write-intent`, `gen-criteria`, `create-pr-body`, `review`, `reflect-review` |
| **`update-docs`** | 작업에서 새로 정한 규칙·결정을 `code-convention.yaml`과 `adr.yaml`에 반영하는 명령. 두 문서의 **충돌·연쇄 수정·폐기 대상**을 찾아 MUST / RECOMMENDED로 제안합니다. |
| **base branch** | 비교 기준 브랜치. 따로 말하지 않으면 `main`입니다. 변경분은 `git diff main...HEAD`로 봅니다. |
| **ACCEPT / REJECT 판정** | 리뷰 반영 단계에서 코멘트마다 수용·거부와 그 근거를 `review-comments.md`에 덧붙입니다. |

## 이 모듈에서 다루는 것

| 구분 | 내용 |
|---|---|
| 설치 | `claude plugin marketplace add vibemafiaclub/mafia-codereview-harness` → `claude plugin install mafia-codereview@mafia-codereview-harness` |
| 리뷰 기준 | `docs/code-convention.yaml`(항상 지키는 규칙)과 `docs/adr.yaml`(기술 결정과 이유) |
| 파이프라인 | `/mafia-codereview:auto` 한 번으로 6단계 진행 |
| 설계의도 | `design-intent.md` — 구현 대화에서 나온 결정·이유·제외 범위. 리뷰어가 의도적 결정을 존중하게 함 |
| 평가기준 | `code-quality-guide.md` — 서브에이전트가 ADR 중 관련 항목만 추출해 컨벤션과 병합. 리뷰의 유일한 근거 |
| 코드리뷰 | `review-comments.md` — 서브에이전트가 자동 리뷰. `[p1]`~`[p4]` 우선순위, 근거, side effect 명시 |
| 리뷰 반영 | 코멘트별 ACCEPT / REJECT 판정, 코드 수정, 테스트 QA |
| 기준 갱신 | `/mafia-codereview:update-docs` — 작업에서 정한 것을 다음 리뷰 기준으로 |
| 실습 예제 | `todo-app` 할 일 관리 CLI에 "완료하면 다음 회차가 생기는 반복 할 일" 구현 후 리뷰 |

## 다른 하네스와의 차이

M33(mattpocock/skills), M35(gstack), M37(pstack)은 **기능을 만드는 과정 전체**를 다루는 반면, mafia-codereview는 **구현이 끝난 뒤의 코드리뷰**에 집중합니다. 같은 `todo-app` + 반복 할 일 예제를 쓰므로 리뷰 단계만 비교해 볼 수 있습니다.

| 관점 | mattpocock `code-review` (M33) | gstack `/review` (M35) | pstack `/interrogate` (M37) | **mafia-codereview (M39)** |
|---|---|---|---|---|
| 리뷰 근거 | 저장소 코딩 규칙 + 코드 냄새 / 스펙 | 운영에서 터질 위험 체크리스트 | 실행으로 증명한 실패 | **컨벤션 + 관련 ADR + 설계의도** |
| 의도 파악 | 스펙 문서 | 계획·설계 문서 | 의도 재진술 | **설계의도 문서를 따로 작성** |
| 결과 형식 | Standards / Spec 두 축 | AUTO-FIXED / ASK | Findings / Dropped | **`[p1]`~`[p4]` + side effect + ACCEPT/REJECT** |
| 기준 축적 | `/retro`로 환경 개선 | `/learn` | `/reflect`, `/correct` | **`update-docs`로 ADR·컨벤션 갱신** |
| 구성 | 스킬(마크다운) | 스킬 + 도구 | 스킬 + 서브에이전트 | **명령 7개(마크다운)뿐, 매우 가벼움** |

## 문서 구성

- [GUIDE.md](GUIDE.md) — 이 실습에서 할 일과 0~11단계 따라하기 (단계별 규칙·산출물·체크리스트)
- [SAMPLE.md](SAMPLE.md) — 예제 앱 `todo-app` 설명 (파일 구조·리뷰 기준 문서·실행 방법, 실습 후 바뀌는 점)
- [todo-app/](todo-app/) — 실습 출발점이 되는 할 일 관리 CLI (Node.js, 의존성 없음, 테스트 5개). todo-app에 맞춘 리뷰 기준 문서 `docs/code-convention.yaml`(규칙 7개)·`docs/adr.yaml`(실습용 가상 결정 3개, 그중 1개는 일부러 관련 없는 항목) 포함. 강의 자료 저장소 밖으로 복사해서 사용

## 산출물 4종 (체크리스트)

- [x] 가이드 — GUIDE.md 단계 목적·입력·산출물·체크리스트
- [x] 규칙 — `docs/code-convention.yaml`, `docs/adr.yaml` (리뷰 기준이 되는 팀 규칙과 결정)
- [x] 자동화 — mafia-codereview 플러그인 명령 (`/mafia-codereview:auto` 등 7개, 서브에이전트 리뷰)
- [x] 샘플 — SAMPLE.md 예제 앱 `todo-app` 설명

## 품질 기준

동작하는 샘플 또는 재현 가능한 프롬프트가 반드시 첨부되어야 하며, 문서는 따라 하면 되는 수준이어야 한다.

## 기준 버전과 주의 사항

- mafia-codereview 0.1.0 (2026-03-27 커밋 `e175e34`)
- 라이선스: README와 `plugin.json`에 MIT로 표기되어 있으나, 기준 커밋 시점에 별도의 LICENSE 파일은 없음
- 기준 브랜치 기본값은 `main`. 구현을 **커밋한 뒤** 기능 브랜치에서 실행해야 함
- 설계의도는 "현재 대화"에서 작성되므로, 구현한 대화 창에서 파이프라인을 실행하는 것이 좋음
- Fork 단계는 git worktree에서 실행될 수 있어, 리뷰 반영 커밋이 현재 브랜치에 들어왔는지 확인 필요

## 참고 링크
- 저장소: https://github.com/vibemafiaclub/mafia-codereview-harness
- 하네스·파이프라인 설명 영상: https://www.youtube.com/watch?v=CfLhrS0ww5w
- 명령 원문: https://github.com/vibemafiaclub/mafia-codereview-harness/tree/main/plugin/commands
- 기준 문서 원본 예시: https://github.com/vibemafiaclub/mafia-codereview-harness/tree/main/plugin/docs
