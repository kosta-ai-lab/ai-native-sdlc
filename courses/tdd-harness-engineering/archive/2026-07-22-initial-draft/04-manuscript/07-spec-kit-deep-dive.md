# GitHub Spec Kit 심층 사례 연구

## 1. Spec Kit을 TDD 관점에서 읽는 법

GitHub Spec Kit 공식 저장소는 constitution, specification, clarification, plan, tasks와 implementation을 연결하는 Spec-Driven Development workflow를 제공한다.[^speckit-repository] 본 분석에서는 프로젝트 수준 원칙을 하위 산출물과 구현 workflow에 전파하는 구조를 “테스트를 개인 습관이 아니라 거버넌스로 만드는 사례”로 해석한다.

기본 task template은 테스트를 feature spec에서 명시적으로 요청했을 때만 포함하는 선택 사항으로 표시한다.[^speckit-tasks] 따라서 Test-First constitution 예시의 존재만으로 기본 설치가 모든 기능에 TDD를 의무화한다고 해석해서는 안 된다.

이 장은 2026-07-22에 확인한 공식 저장소 커밋 `d7699c39f2c3ab7d9c4f3eceff8f29ae1601cc3b`를 기준으로 한다.

## 2. 산출물 파이프라인

```text
/speckit.constitution
  → /speckit.specify
  → /speckit.clarify
  → /speckit.plan
  → /speckit.tasks
  → /speckit.analyze
  → /speckit.implement
  → /speckit.converge
```

constitution은 프로젝트의 비협상 원칙을, spec은 사용자 가치와 acceptance scenario를, plan은 기술 선택과 구조를, tasks는 파일 경로가 있는 실행 단위를 담는다. implement는 이 문맥을 읽고 task를 순서대로 수행한다. analyze와 converge는 산출물 사이의 불일치나 구현 후 남은 gap을 찾는 데 사용할 수 있다.

이 구조에서 TDD는 한 지점에만 존재하지 않는다. constitution에서 의무화되고, spec에서 검증 가능한 행동으로 표현되며, tasks에서 테스트가 구현보다 앞에 배치되고, implement와 post-hook에서 실행돼야 한다.

## 3. constitution이 하는 일

공식 `constitution-template.md`에는 Test-First를 비협상 원칙으로 삼고 테스트 작성, 사용자 승인과 실패 확인 뒤 구현하며 Red–Green–Refactor를 따르는 예시가 있다.[^speckit-constitution]

Todo 프로젝트에서는 템플릿 주석을 그대로 두지 말고 판정 가능한 규칙으로 채워야 한다.

```markdown
### III. Test-First (NON-NEGOTIABLE)

- 모든 행동 변경은 acceptance criterion ID를 가진다.
- 구현 전에 해당 ID의 자동 테스트를 작성한다.
- Red 명령, exit code와 기대 실패 이유를 기록한다.
- 실패 테스트 승인 전 production 구현을 시작하지 않는다.
- Green과 refactor 뒤 대상 및 전체 회귀를 실행한다.
- 예외는 generated code와 승인된 spike뿐이며 결과물은 폐기한다.
```

“TDD를 지향한다”는 문장과 달리 위 규칙은 무엇이 위반인지 확인할 수 있다. constitution 변경 명령은 dependent template의 일관성도 점검하도록 지시한다. 즉 원칙을 바꿨다면 plan, spec, tasks와 command가 옛 정책을 유지하지 않는지 함께 살펴야 한다.

## 4. specification에서 BDD 입력 만들기

Spec Kit의 feature spec은 구현 기술보다 사용자와 기대 행동을 먼저 다루는 데 적합하다. 다음처럼 각 story가 독립적인 가치와 검증 방법을 가져야 한다.

```markdown
## User Story 1 - Todo 생성 (P1)

로그인한 사용자는 제목을 입력해 자신에게 속한 Todo를 만든다.

### Independent Test

인증 사용자로 생성 API를 호출한 뒤 응답과 저장된 ownerId를 확인한다.

### Acceptance Scenarios

1. Given u-1이 로그인했고, When `Buy milk`를 제출하면,
   Then 같은 제목과 ownerId `u-1`인 Todo가 생성된다.
2. Given u-1이 로그인했고, When 공백 제목을 제출하면,
   Then `TITLE_REQUIRED`가 반환되고 저장되지 않는다.
```

BDD Discovery가 없는 상태에서 에이전트가 이 문서를 혼자 생성하면 형식은 좋지만 비즈니스 합의가 빠질 수 있다. example mapping 또는 제품 담당자 리뷰를 거쳐야 한다.

## 5. 기본 tasks template의 양면성

공식 template은 story별 contract test와 integration test를 구현 task보다 앞에 배치하며, 포함된 테스트는 먼저 작성하고 실패해야 한다고 명시한다. dependency 설명도 “tests if included”가 구현 앞에 온다고 한다.

하지만 각 테스트 섹션 제목은 “OPTIONAL - only if tests requested”라고 표시된다. polish 단계의 추가 unit test도 선택적이다. 따라서 feature spec이나 constitution이 테스트를 요구하지 않으면 tasks 생성 결과에서 테스트가 빠질 수 있다.

TDD 과정에서는 template override를 다음처럼 강화해야 한다.

```markdown
### Tests for User Story 1 (REQUIRED)

- [ ] T011 [US1] AC-TODO-VALID contract test 작성
- [ ] T012 [US1] T011이 예상 이유로 실패한 로그 저장
- [ ] T013 [US1] AC-TODO-BLANK unit/integration test 작성
- [ ] T014 [US1] T013이 validation 부재로 실패한 로그 저장

### Implementation for User Story 1

- [ ] T015 [US1] 최소 domain validation 구현
- [ ] T016 [US1] persistence와 API 연결
- [ ] T017 [US1] 대상·회귀 테스트와 정적 검사 실행
```

테스트 작성과 Red 확인을 같은 task로 묶지 않으면 task 완료 이력에서 순서가 더 분명해진다.

## 6. implement 명령의 통제 구조

공개 `implement.md`는 tasks, plan, data model, contracts, research, constitution과 quickstart를 읽고 task dependency를 해석하며, test task가 포함된 경우 구현 task보다 먼저 수행하도록 지시한다.[^speckit-implement]

조사 기준 template에는 `.specify/extensions.yml`의 before/after implement hook을 확인하는 절차가 있으며, mandatory hook은 실제로 호출하고 완료를 기다리도록 명시돼 있다.[^speckit-implement] 본 분석에서는 이를 constitution의 문서 규칙을 외부 workflow와 연결할 수 있는 확장점으로 본다.

그러나 주의할 점도 있다.

- 조건식이 있는 hook의 평가는 별도 HookExecutor에 맡겨질 수 있다.
- 잘못된 YAML은 조용히 skip될 수 있다고 template에 적혀 있다.
- task checkbox는 실제 Red 로그를 자동 검증하지 않는다.
- 에이전트 지침의 “MUST”는 런타임의 기계적 차단과 동일하지 않다.

따라서 hook 존재 여부가 아니라 실패를 주입해 실제 전이가 막히는지 확인해야 한다.

## 7. Todo 프로젝트의 권장 설정

```yaml
# .specify/extensions.yml 개념 예시
hooks:
  before_implement:
    - extension: tdd-red-audit
      command: verify-red-evidence
      optional: false
  after_implement:
    - extension: quality-gate
      command: verify-tests-and-traceability
      optional: false
```

before hook은 구현 task가 시작되기 전에 현재 story의 test task와 Red evidence를 확인한다. after hook은 모든 acceptance ID가 테스트에 매핑됐는지, 전체 테스트 결과가 현재 commit에 대응하는지를 확인한다. 실제 extension 형식과 실행 지원은 사용 버전에 맞춰 검증해야 하며, 위 예시는 설계 의도를 보여주는 교육용 형태다.

## 8. analyze와 converge의 역할

`analyze`는 구현 전에 constitution, spec, plan과 tasks의 모순과 누락을 찾는 데 유용하다. 예를 들어 constitution은 모든 행동에 테스트를 요구하지만 tasks에 테스트가 없다면 구현 전에 탐지해야 한다.

`converge`는 구현 뒤 코드와 specification의 gap을 찾아 후속 task로 되돌리는 개념에 적합하다. 하지만 의미 검토가 실제 테스트 실행을 대신하지 않는다. 올바른 조합은 문서 일관성 분석, 실행 가능한 테스트, 최신 결과와 기계적 gate다.

## 9. 실패 모드와 보완

- **constitution이 장식 문서가 됨**: 각 원칙을 template, task와 CI 검사로 연결한다.
- **기본 optional test 유지**: 조직 preset 또는 local override로 required로 바꾼다.
- **형식적인 acceptance scenario**: 실제 예제와 경계값, 부작용을 넣고 사람이 승인한다.
- **task 체크만 하고 Red 미확인**: 별도 evidence task와 commit 기준 로그를 요구한다.
- **hook fail-open**: 잘못된 설정, timeout, non-zero exit를 주입해 차단 동작을 시험한다.
- **산출물 과다**: 변경 위험에 따라 필요한 문서 깊이를 조절하되 test-first 핵심 증거는 유지한다.

## 10. 교육 활용

첫 실습은 기본 template로 tasks를 생성해 테스트가 빠질 수 있음을 관찰한다. 두 번째는 Test-First constitution을 채택하지만 tasks template은 그대로 두어 원칙 전파가 충분한지 본다. 세 번째는 template과 mandatory hook을 보강해 Red evidence가 없을 때 implement가 멈추게 한다.

이 사례의 핵심은 문서에 강한 원칙을 쓰는 것과 실행 환경이 그 원칙을 집행하는 것은 다르다는 점이다. Spec Kit은 원칙을 전체 SDD 산출물에 전파하는 좋은 골격을 제공하지만, 기본 테스트 선택 정책과 동적 hook 동작을 반드시 확인해야 한다.

## 공식 근거

- [GitHub Spec Kit 공식 저장소](https://github.com/github/spec-kit)
- [constitution template](https://github.com/github/spec-kit/blob/main/templates/constitution-template.md)
- [tasks template](https://github.com/github/spec-kit/blob/main/templates/tasks-template.md)
- [implement command](https://github.com/github/spec-kit/blob/main/templates/commands/implement.md)

## 주석

[^speckit-repository]: GitHub, Spec Kit 공식 저장소, commit `d7699c39f2c3ab7d9c4f3eceff8f29ae1601cc3b`, 2026-07-22 확인. <https://github.com/github/spec-kit>

[^speckit-constitution]: GitHub, Spec Kit, `templates/constitution-template.md`, commit `d7699c39f2c3ab7d9c4f3eceff8f29ae1601cc3b`, 2026-07-22 확인. <https://github.com/github/spec-kit/blob/main/templates/constitution-template.md>

[^speckit-tasks]: GitHub, Spec Kit, `templates/tasks-template.md`, commit `d7699c39f2c3ab7d9c4f3eceff8f29ae1601cc3b`, 2026-07-22 확인. <https://github.com/github/spec-kit/blob/main/templates/tasks-template.md>

[^speckit-implement]: GitHub, Spec Kit, `templates/commands/implement.md`, commit `d7699c39f2c3ab7d9c4f3eceff8f29ae1601cc3b`, 2026-07-22 확인. <https://github.com/github/spec-kit/blob/main/templates/commands/implement.md>
