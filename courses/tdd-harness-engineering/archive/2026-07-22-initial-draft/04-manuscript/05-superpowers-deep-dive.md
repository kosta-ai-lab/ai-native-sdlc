# Superpowers 심층 사례 연구

## 1. 도구의 정체와 분석 범위

Superpowers 공식 저장소는 아이디어 탐색, 설계, 계획, 구현, 리뷰와 완료 검증에 사용하는 여러 스킬을 제공한다. 그중 `test-driven-development`는 구현의 미시적 순서를, `verification-before-completion`은 완료 주장의 증거를 규정한다.[^superpowers-repository] 본 분석에서는 이 구성을 테스트 프레임워크나 요구사항 저장소가 아니라 에이전트의 절차 하니스로 분류한다.

이 장은 2026-07-22에 확인한 공식 저장소 커밋 `d884ae04edebef577e82ff7c4e143debd0bbec99`의 스킬을 기준으로 한다. 공개 지침을 분석한 것이며 모든 에이전트와 환경에서의 준수를 보증하는 제품 감사는 아니다.

## 2. 전체 workflow에서 TDD의 위치

TDD 스킬만 떼어 보면 요구 발견 과정이 보이지 않는다. Superpowers의 전체 흐름은 대략 다음처럼 읽을 수 있다.

```text
아이디어 탐색 → 설계 합의 → 구체적 구현 계획 → 격리 작업 공간
→ 태스크별 Red–Green–Refactor → 리뷰 → 최신 검증 → 브랜치 마무리
```

BDD와 결합할 때는 Discovery와 Formulation에서 합의한 예제를 구현 계획에 넣고, 그 예제를 작은 행동 단위의 테스트로 옮겨야 한다. 그러지 않으면 에이전트가 잘못된 요구를 매우 엄격하게 테스트할 수 있다.

```markdown
### Task: 공백 제목 거부

- 요구: AC-TODO-002
- 테스트: tests/todo-service.test.ts
- 구현: src/todo-service.ts
- Red: 공백 제목이 ValidationError를 반환해야 한다.
- Green: trim 결과가 비면 거부한다.
- 검증: 대상 테스트와 전체 회귀를 실행한다.
```

## 3. TDD 스킬의 실제 규율

공식 스킬은 프로덕션 코드보다 실패 테스트가 먼저 있어야 하며, 구현을 먼저 썼다면 참고용으로 남기지 말고 삭제한 뒤 테스트에서 다시 출발하라고 지시한다.[^superpowers-tdd] 본 분석에서는 이를 단순한 test-first 권고보다 강한 절차 규칙으로 해석한다.

### 3.1 Red는 올바른 실패여야 한다

Red에는 세 가지 판정이 필요하다.

1. 테스트가 실제로 실패했는가.
2. import나 문법 오류가 아니라 assertion failure인가.
3. 오타가 아니라 아직 행동이 없기 때문에 예상한 메시지로 실패했는가.

```typescript
it('rejects a title containing only whitespace', () => {
  expect(() => createTodo({ title: '   ', userId: 'u-1' }))
    .toThrow('TITLE_REQUIRED');
});
```

첫 실행이 `Cannot find module`이면 대상 행동까지 도달하지 못했으므로 유효한 Red가 아니다. 반대로 처음부터 통과하면 기존 행동을 검사했거나 테스트가 너무 약할 수 있다. 강의에서는 색깔만 보지 않고 다음 증거를 남기게 한다.

```markdown
## RED-EVIDENCE AC-TODO-002

- command: pnpm vitest run tests/todo-service.test.ts
- exit: 1
- observed: 예외가 발생하지 않아 assertion 실패
- expected reason: 공백 제목 검증이 아직 없음
- unrelated error: 없음
```

### 3.2 Green에서는 구현을 고친다

Green은 현재 실패를 해결하는 가장 작은 일반 해법을 작성한다. “작다”는 fixture 값을 하드코딩한다는 뜻이 아니라, 합의된 행동을 일반적으로 만족하되 아직 요구되지 않은 설정과 확장을 만들지 않는다는 뜻이다.

```typescript
export function createTodo(input: CreateTodoInput): Todo {
  if (input.title.trim().length === 0) throw new Error('TITLE_REQUIRED');
  return { title: input.title.trim(), ownerId: input.userId };
}
```

실패 테스트를 자신의 구현에 맞게 약화하면 테스트의 독립성이 사라진다. 요구 해석 자체가 틀렸다면 구현을 억지로 맞추지 말고 사이클을 멈춰 BDD 예제와 계획을 다시 승인받아야 한다.

### 3.3 Refactor는 행동 보존 단계다

Green 뒤에는 중복 제거, 이름 개선과 책임 분리가 가능하다. 새 비즈니스 행동을 발견했다면 refactor에 몰래 넣지 않고 다음 Red로 표현한다. 구조 변경 뒤에는 대상 테스트뿐 아니라 관련 회귀 테스트도 다시 실행한다.

이는 생성 모델이 인접 코드를 함께 정리하거나 미래 확장을 추가하는 경향을 억제한다. 허용 범위를 행동 보존으로 제한하면 diff가 작아지고 실패 원인을 좁힐 수 있다.

## 4. 완료 검증은 별도의 게이트다

`verification-before-completion`은 완료, 수정 성공, 테스트 통과나 PR 준비를 주장하기 직전에 그 주장을 증명하는 전체 명령을 새로 실행하고 출력과 exit code를 확인하도록 지시한다.[^superpowers-verification]

```text
주장 식별 → 증명 명령 선택 → 현재 상태에서 전체 실행
→ 출력·exit code·실패 수 확인 → 일치할 때만 완료 보고
```

lint 성공은 build 성공의 증거가 아니고 대상 단위 테스트 성공은 전체 회귀 성공의 증거가 아니다. 직전 실행 뒤 파일이 바뀌었다면 과거의 성공도 현재 근거가 아니다.

버그 회귀 테스트에는 수정 상태에서 통과한 뒤 수정 내용을 되돌려 같은 테스트의 실패를 확인하고, 수정본을 복구해 다시 통과시키는 방법이 제시된다.[^superpowers-verification] 이 절차는 테스트가 해당 버그를 실제로 탐지하는지 확인하려는 장치로 해석할 수 있다.

## 5. Todo 사례의 전체 적용

```gherkin
Scenario: 공백 제목으로 할 일을 만들 수 없다
  Given 사용자 "u-1"이 로그인해 있다
  When 제목 "   "으로 할 일을 생성한다
  Then 오류 코드 "TITLE_REQUIRED"를 받는다
  And 할 일은 저장되지 않는다
```

첫 사이클은 도메인 함수가 공백을 거부하는 단위 행동을 다룬다. 두 번째 사이클은 잘못된 입력일 때 `repository.save`가 호출되지 않는 통합 행동을 다룬다. 각 사이클에서 테스트 작성, 예상 실패 확인, 최소 구현, 대상 및 회귀 테스트, 구조 정리와 재검증 순서를 반복한다.

최종 보고도 “테스트를 추가했다”가 아니라 아래처럼 현재 증거를 제공해야 한다.

```markdown
- AC-TODO-002 unit: 1 passed
- AC-TODO-002 side effect: 1 passed
- full suite: 42 passed, 0 failed
- typecheck: exit 0
- lint: exit 0
- executed after final refactor: yes
```

## 6. 강제되는 것과 강제되지 않는 것

Superpowers의 문구는 강하지만 기본 통제는 에이전트가 읽고 따라야 하는 스킬 지침이다. 프로덕션 파일 쓰기를 운영체제 수준에서 반드시 차단하거나 Red 로그가 없으면 커밋을 거부하는 범용 게이트가 TDD 스킬 자체에 있다고 보기는 어렵다.

| 층 | 제공하는 것 | 별도 보강 |
|---|---|---|
| 의도 | test-first와 최신 증거를 강하게 명시 | 조직별 예외 정책 |
| 절차 | Red 확인, 최소 Green, Refactor, 완료 검증 | 요구–테스트 추적 저장소 |
| 통제 | 도구별 스킬 호출과 통합 | CI 차단, 파일 권한, 증거 검증 |

기능 구현 요청에서 스킬이 실제 활성화됐는지, 다른 지침과 충돌할 때 무엇이 우선되는지, 긴 세션에서도 규칙이 유지되는지를 관찰해야 한다.

## 7. 대표 실패 모드와 보완

- **스킬 미호출**: 세션 로그에서 활성화를 확인하고 CI가 테스트 증거를 다시 요구한다.
- **Red 증거 소실**: 명령, exit code, 핵심 실패와 소스 기준점을 구조화해 저장한다.
- **잘못된 요구의 엄격한 구현**: 앞단에 example mapping과 제품 책임자 승인을 둔다.
- **테스트 약화**: 테스트와 구현 변경을 다른 역할 또는 별도 리뷰로 분리한다.
- **회귀 생략**: fast gate와 release gate를 구분하되 실행 시점과 필수 조건을 명시한다.

## 8. 교육 활용

Superpowers는 TDD 규율의 선명한 사례다. 먼저 수강생이 도구 없이 Red를 판정하게 하고, 다음에 같은 작업을 스킬과 함께 수행해 누락이 줄어드는지 비교한다. 평가는 코드 양보다 테스트가 구현보다 먼저였는지, 실패 이유를 설명할 수 있는지, Green이 요구 범위를 넘지 않았는지, 최종 주장이 최신 실행과 일치하는지를 본다.

이 도구에서 가져올 핵심은 강한 문구 자체가 아니다. Red를 관찰하지 않았다면 테스트의 유효성을 알 수 없고, 현재 증거가 없다면 완료를 주장할 수 없다는 두 원칙이다.

## 공식 근거

- [Superpowers 공식 저장소](https://github.com/obra/superpowers)
- [TDD 스킬](https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md)
- [완료 검증 스킬](https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md)

## 주석

[^superpowers-repository]: obra, Superpowers 공식 저장소, commit `d884ae04edebef577e82ff7c4e143debd0bbec99`, 2026-07-22 확인. <https://github.com/obra/superpowers>

[^superpowers-tdd]: obra, Superpowers, `skills/test-driven-development/SKILL.md`, commit `d884ae04edebef577e82ff7c4e143debd0bbec99`, 2026-07-22 확인. <https://github.com/obra/superpowers/blob/main/skills/test-driven-development/SKILL.md>

[^superpowers-verification]: obra, Superpowers, `skills/verification-before-completion/SKILL.md`, commit `d884ae04edebef577e82ff7c4e143debd0bbec99`, 2026-07-22 확인. <https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md>
