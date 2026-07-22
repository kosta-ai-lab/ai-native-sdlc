# TDD Harness Engineering

> 상태: Planning
>
> 결정적 소프트웨어의 Test와 LLM 소프트웨어의 Evaluation을 구분하고, 그 증거를 개발 하니스의 품질 gate로 연결하는 과정을 설계합니다.

## 두 하니스의 구분

이 프로젝트에는 목적이 다른 두 하니스가 있습니다.

- **개발 하니스(Development Harness)**: 강의에서 가르치고 수강생이 구축하는 대상입니다. AI 개발 과정의 명세, test, eval, 권한, 실행 증거와 완료 조건을 통제합니다.
- **과정 제작 하니스(Course Production Harness)**: 이 강의를 만드는 운영 환경입니다. 사용자의 의도를 수집하고 Planning부터 Delivery까지의 작업과 품질을 통제합니다.

문서에서는 수식어 없는 `하니스` 사용을 피합니다. 자세한 기준은 [하니스 용어 경계](02-research/wiki/harness-terminology.md)를 따릅니다.

## 과정 제작 workflow

```text
01 Planning
→ 02 Research
→ 03 Design
→ 04 Manuscript
→ 05 Materials
→ 06 Deliveries
```

| 단계 | 질문 | 현재 상태 |
|---|---|---|
| [`01-planning/`](01-planning/) | 무엇을 왜 만들 것인가 | 진행 중 |
| [`02-research/`](02-research/) | 무엇을 알아야 하는가 | 용어 경계부터 재정립 |
| [`03-design/`](03-design/) | 어떻게 배우게 할 것인가 | Planning 승인 대기 |
| [`04-manuscript/`](04-manuscript/) | 무엇을 읽게 할 것인가 | 활성 원고 없음 |
| [`05-materials/`](05-materials/) | 무엇을 보고 수행하게 할 것인가 | 활성 자료 없음 |
| [`06-deliveries/`](06-deliveries/) | 특정 현장에 어떻게 적용할 것인가 | 활성 납품 없음 |

## 현재 활성 자료

### Planning

- [과정 Brief](01-planning/brief.md)
- [조사·설계 질문](01-planning/questions.md)
- [Intent Ledger](01-planning/intent-ledger.md)
- [과정 제작 결정 기록](01-planning/decisions.md)

### Research

- [하니스 용어 경계](02-research/wiki/harness-terminology.md)

### 과정 제작 하니스

- [의도 중심 진행 방식](harness/FACILITATION.md)
- [단계별 유도 질문과 승인 계약](harness/STAGE-GUIDES.md)
- [근거·인용 규칙](harness/EVIDENCE-GUIDE.md)
- [정성 검토 체크리스트](harness/review-checklist.md)

## 기존 자료 아카이브

초기 조사, 설계, 장문 원고 8개, 데모·실습 prototype과 7시간 납품 샘플은 삭제하지 않고 [2026-07-22 초기 초안 아카이브](archive/2026-07-22-initial-draft/README.md)에 보존했습니다.

아카이브는 참고 자료이며 활성 과정의 정본이 아닙니다. 당시 문서에는 두 하니스의 용어가 명시적으로 구분되지 않은 부분이 있으므로, 재사용할 때는 출처와 최신성을 다시 확인하고 현재 용어 체계로 다시 작성합니다.

## 과정 제작 하니스 실행

```bash
node courses/tdd-harness-engineering/harness/validate.mjs
```

검증기는 활성 문서와 source → knowledge → Unit → material → delivery 관계를 확인합니다. `archive/`는 읽기 전용 참고 자료이므로 활성 link gate의 대상에서 제외합니다.

## 기존 저장소 자산과의 연결

- `modules/05-bdd`: 합의된 행동과 인수조건
- `modules/06-coding-tdd`: Red–Green–Refactor와 test-first 스킬 명세
- `modules/ext-harness`: 개발 하니스의 에이전트·스킬·Hook 구성
- `samples/web-task-system`: 요구사항부터 테스트·구현까지 이어지는 관통 실습
