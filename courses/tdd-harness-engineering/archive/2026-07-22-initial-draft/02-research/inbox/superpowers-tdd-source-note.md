# SRC-SUPERPOWERS-TDD — TDD 스킬 소스 노트

## 확인 범위

- 출처 유형: 공식 공개 소스
- 프로젝트: `obra/superpowers`
- 기준 commit: `d884ae04edebef577e82ff7c4e143debd0bbec99`
- 확인일: 2026-07-22
- 확인 파일: `skills/test-driven-development/SKILL.md`
- 원문 링크: <https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md>

## 확인된 claim

### CLM-SUPERPOWERS-RED-001

스킬은 프로덕션 코드보다 실패 테스트를 먼저 작성하도록 지시한다. 구현을 먼저 작성한 경우 해당 구현을 삭제하고 테스트에서 다시 출발하라는 규칙도 포함한다.

### CLM-SUPERPOWERS-RED-002

Red 단계에서는 테스트가 단순히 실패했는지만 보지 않는다. assertion failure인지, 예상한 실패 메시지인지, 오타가 아니라 아직 구현되지 않은 기능 때문에 실패했는지를 확인하도록 지시한다.

### CLM-SUPERPOWERS-RED-003

테스트가 처음부터 통과하면 기존 행동을 검증하고 있을 가능성을 조사하고, 테스트가 실행 오류를 내면 올바른 기능 실패가 나올 때까지 오류를 먼저 수정하도록 지시한다.

## 프로젝트 측 설명과 조사 한계

공식 스킬은 이러한 순서가 테스트가 올바른 대상을 검증한다는 신뢰를 제공한다고 설명한다. 이번 Evidence는 지침의 존재와 내용을 확인한 것이며, 모든 지원 에이전트가 매번 이 규칙을 준수하는지는 측정하지 않았다.

## 다음 단계에서 사용할 수 있는 정보

- Red는 색상이나 non-zero exit 하나가 아니라 실패 원인의 판정이다.
- 실행 오류와 행동 부재에 의한 assertion failure를 구분해야 한다.
- test-first 준수와 스킬의 실제 runtime enforcement는 별개의 검증 대상이다.
