# TDD·테스트 중심 에이전트 도구 비교

## 들어가며

AI 코딩 도구 가운데 상당수는 테스트를 생성하거나 실행한다. 그러나 “테스트를 사용한다”는 표현만으로는 도구의 개발 규율을 판단하기 어렵다. 어떤 도구는 구현 후 테스트를 추가하고, 어떤 도구는 실패 테스트를 먼저 확인하도록 요구한다. 어떤 도구는 요구사항과 테스트의 추적성을 관리하지만 테스트 실행 순서는 구현자에게 맡기고, 또 다른 도구는 완료 시점의 테스트와 품질 증거까지 확인한다.

따라서 MoAI-ADK, Superpowers, OpenSpec, GitHub Spec Kit와 BMAD Test Architect를 같은 종류의 제품처럼 단순 비교하면 안 된다. 이들은 서로 다른 층에서 문제를 해결한다.

- MoAI-ADK는 명세, 구현 방법, 역할, Hook과 상태를 묶은 종합 하니스다.
- Superpowers는 에이전트가 따라야 할 개발 절차를 강한 스킬 규율로 제공한다.
- OpenSpec은 현재 명세와 변경 제안을 분리해 요구와 구현의 일치를 관리한다.
- GitHub Spec Kit은 constitution에서 구현 태스크까지 이어지는 SDD 골격을 제공한다.
- BMAD Test Architect는 테스트 전략, ATDD, 자동화, 추적성과 릴리스 게이트를 전문 영역으로 다룬다.

이 장에서는 각 도구가 테스트를 어느 시점에 도입하고, 무엇을 실제로 강제하며, TDD 하니스 강의에서 어떤 사례로 사용할 수 있는지를 자세히 살펴본다.

## 1. 비교 기준

### 1.1 요구와 테스트의 연결

테스트가 어떤 요구나 시나리오를 검증하는지 추적할 수 있는지를 본다. 테스트 파일이 많아도 합의된 요구와 연결되지 않으면 에이전트가 잘못 이해한 행동을 정교하게 검증할 수 있다.

### 1.2 test-first 순서

구현 전에 테스트를 작성하고 올바른 이유로 실패하는 것을 직접 확인하도록 요구하는지를 본다. 단순히 최종 단계에서 테스트를 실행하는 것과 TDD는 다르다.

### 1.3 역할과 변경 권한

명세 작성, 테스트 작성, 구현과 검증 역할이 분리되는지, 구현 역할이 테스트나 요구를 임의로 바꾸지 못하도록 경계를 제공하는지를 본다.

### 1.4 실행 증거

테스트가 통과한다는 자연어 보고 대신 실제 명령, exit code, 실패 수와 결과를 요구하는지를 본다. Red와 Green을 모두 증명할 수 있어야 한다.

### 1.5 완료·릴리스 게이트

테스트나 추적성이 부족한 상태에서 작업 완료, archive, PR 또는 release로 넘어가는 것을 차단하거나 최소한 경고하는지를 본다.

### 1.6 강제 방식

강한 문구의 지침만 제공하는지, task 순서와 역할을 구조화하는지, Hook·CI처럼 모델 바깥에서 기계적으로 차단하는지를 구분한다.

## 2. Superpowers — 가장 직접적인 TDD 절차 스킬

### 2.1 전체 개발 흐름 안에서의 위치

Superpowers는 개별 TDD 스킬 하나만 제공하는 프로젝트가 아니다. 아이디어 탐색, 설계, 구현 계획, worktree, subagent 기반 개발, 코드 리뷰와 완료 검증을 여러 스킬로 연결한다. 공식 README의 흐름에서 TDD 스킬은 승인된 설계와 세분화된 계획 다음의 구현 단계에 활성화된다.

즉 Superpowers가 보는 TDD의 입력은 막연한 한 줄 요구가 아니다. brainstorming과 design 단계를 거쳐 합의된 기능이며, writing-plans 스킬은 구현 태스크에 정확한 파일 경로와 검증 단계를 포함하도록 요구한다. 이 구조는 BDD 자체를 완전하게 제공하지는 않지만, 구현 전에 기대 행동과 작업 범위를 명확히 하려는 점에서 BDD–TDD 연결의 앞단으로 활용할 수 있다.

### 2.2 TDD 스킬의 강한 규율

`skills/test-driven-development/SKILL.md`는 다음 원칙을 명시한다.

```text
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

구현 코드가 테스트보다 먼저 작성됐다면 참고용으로 남기지 말고 삭제한 뒤 테스트에서 다시 구현하라고 요구한다. Red 단계에서는 테스트가 단순히 빨간색으로 끝나는 것이 아니라 다음 세 가지를 확인한다.

1. 테스트가 실패했는가?
2. 테스트 실행 오류가 아니라 assertion failure인가?
3. 오타가 아니라 기능이 아직 없기 때문에 예상한 메시지로 실패했는가?

테스트가 처음부터 통과하면 기존 행동을 검사하고 있거나 잘못된 테스트일 수 있으므로 수정해야 한다. 테스트가 실행 오류를 내면 올바른 실패가 나올 때까지 오류를 먼저 고친다.

Green에서도 현재 테스트를 통과하는 데 필요한 코드만 작성하고, 다른 기능이나 추상화를 추가하지 않도록 요구한다. 관련 테스트뿐 아니라 다른 기존 테스트도 통과하는지 확인하고, 경고나 오류가 없는 깨끗한 출력을 요구한다.

### 2.3 완료 검증 스킬

Superpowers의 중요한 특징은 TDD 스킬과 별도로 `verification-before-completion` 스킬이 있다는 점이다. 이 스킬은 완료나 성공을 주장하기 직전에 해당 주장을 증명하는 명령을 새로 실행하도록 요구한다. 이전 메시지나 이전 세션의 테스트 결과, 에이전트의 성공 보고, 일부 테스트 결과는 충분한 증거로 인정하지 않는다.

회귀 테스트의 경우 테스트가 현재 코드에서 한 번 통과했다는 사실만으로는 부족하다고 본다. 수정 내용을 되돌렸을 때 테스트가 실패하고 다시 수정했을 때 통과하는 Red–Green 검증을 요구한다. 이는 버그 수정 후 추가한 테스트가 실제로 원래 버그를 잡는지 확인하는 실용적인 방법이다.

### 2.4 강점과 한계

Superpowers는 조사한 도구 가운데 TDD 절차를 가장 명확하고 엄격하게 설명한다. 흔한 합리화와 테스트 안티패턴까지 별도 자료로 다루므로 교육용 텍스트로 가치가 높다. writing-skills 자료에서는 코드뿐 아니라 에이전트 스킬 자체도 baseline 실패 시나리오를 먼저 실행하고, 스킬을 작성한 뒤 같은 시나리오에서 행동이 개선되는지 확인하는 방식으로 TDD를 적용한다.

그러나 기본적인 강제 수단은 여전히 에이전트가 읽고 따라야 하는 스킬 지침이다. 문구가 매우 강하다고 해서 파일 권한이나 Hook이 구현 에이전트의 테스트 수정을 기계적으로 막는 것은 아니다. 따라서 Superpowers는 “절차와 자기 규율이 강한 하니스” 사례로 보고, 실제 강제력을 높이려면 권한 분리나 외부 완료 게이트를 결합해야 한다.

### 2.5 강의에서 사용할 구체 사례

- Red 확인 시 failure와 error를 구분하는 시연
- 구현이 먼저 생겼을 때 삭제하고 테스트에서 재구현하는 논쟁
- regression test를 fix revert로 검증하는 방법
- 성공 주장 직전에 최신 전체 검증 명령을 실행하는 gate function
- TDD를 코드가 아닌 에이전트 스킬 작성에 적용하는 baseline pressure test

공식 저장소: [obra/superpowers](https://github.com/obra/superpowers)

## 3. OpenSpec — 변경 명세와 구현 검증의 연결

### 3.1 OpenSpec이 해결하려는 문제

OpenSpec은 요구가 채팅 기록에만 남아 AI와 사람이 서로 다른 것을 구현하는 문제를 줄이려는 spec-driven development 도구다. 현재 시스템의 진실은 `openspec/specs/`에 두고, 제안된 변경은 `openspec/changes/<change-name>/` 아래의 proposal, tasks, design과 spec delta로 관리한다.

이 분리는 기존 시스템을 변경하는 brownfield 작업에서 의미가 있다. 현재 동작과 앞으로 바꿀 동작을 한 문서에 섞지 않고, 변경이 승인되고 archive될 때 현재 명세에 합쳐진다.

대표 흐름은 다음과 같다.

```text
/opsx:new 또는 proposal
  → proposal·spec delta·tasks 작성
  → apply
  → verify
  → archive
```

### 3.2 시나리오의 테스트 가능성

OpenSpec의 requirement는 적어도 하나의 scenario를 가져야 하고, WHEN–THEN 형태로 기대 행동을 표현한다. 공식 onboarding 템플릿은 이 형식이 요구를 테스트 가능한 형태로 만든다고 설명한다. 이는 BDD Formulation과 유사한 역할을 한다.

그러나 시나리오가 문서에 있다는 것과 실제 자동 테스트가 작성됐다는 것은 다르다. OpenSpec의 기본 `apply` 템플릿은 pending task를 순서대로 구현하고 체크박스를 완료 상태로 바꾸도록 지시하지만, 각 task에서 반드시 실패 테스트를 먼저 만들도록 일반적으로 강제하지 않는다.

### 3.3 verify-change가 검사하는 것

확장 workflow의 `/opsx:verify`는 구현과 change artifact의 일치를 Completeness, Correctness, Coherence 세 차원에서 검토한다.

- Completeness: task가 모두 완료됐는지, requirement 구현 근거가 있는지 확인
- Correctness: 각 requirement가 코드에 반영됐는지, scenario를 다루는 코드와 테스트가 있는지 확인
- Coherence: design decision과 프로젝트 패턴을 따르는지 확인

scenario에 대응하는 테스트가 없으면 경고와 함께 테스트 또는 구현을 추가하라고 권고한다. 이 검증은 구현 후 명세 누락을 찾는 데 유용하지만 Red–Green 순서를 증명하지는 않는다. 또한 소스 템플릿에서 incomplete task와 missing requirement는 CRITICAL로, missing scenario coverage는 WARNING으로 분류된다. 따라서 기본 의미상 테스트 누락이 항상 archive를 막는 절대 게이트라고 해석하면 안 된다.

### 3.4 강점과 한계

OpenSpec의 강점은 기존 명세와 변경 명세를 분리하고, requirement와 scenario를 구현 및 archive 상태에 연결한다는 점이다. BDD 인수조건이 채팅에 사라지지 않고 변경 단위의 감사 가능한 자산으로 남는다.

반면 OpenSpec만 설치했다고 TDD가 보장되지는 않는다. tasks에 “실패 테스트 작성 및 실행”을 명시하거나, 조직 schema를 확장하고, Superpowers 같은 TDD 스킬 또는 Hook 기반 gate를 결합해야 한다. OpenSpec은 TDD 엔진이라기보다 BDD/SDD 입력과 사후 추적성의 토대에 가깝다.

### 3.5 강의에서 사용할 구체 사례

- 현재 spec과 proposed delta를 분리해 레거시 행동 변경 설명
- scenario는 있지만 테스트가 없는 변경을 `/opsx:verify`로 탐지
- task checkbox 완료와 실제 요구 충족의 차이
- missing scenario test가 WARNING인 기본 정책을 조직 규칙으로 CRITICAL화
- OpenSpec artifact를 TDD 하니스의 입력으로 사용하는 결합 실습

공식 저장소: [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec)

## 4. GitHub Spec Kit — constitution으로 강화하는 선택적 TDD

### 4.1 전체 SDD 흐름

GitHub Spec Kit은 constitution, specification, clarification, plan, tasks와 implementation을 연결한다. 프로젝트가 중요하게 여기는 원칙을 constitution에 먼저 기록하고, 이후 생성되는 명세와 계획, 태스크가 이를 따르게 한다.

대표 흐름은 다음과 같다.

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

`constitution-template.md`에는 Test-First를 비협상 원칙으로 두고, 테스트 작성, 사용자 승인, 실패 확인 뒤 구현하며 Red–Green–Refactor를 엄격히 지킨다는 예시가 있다. 이 원칙을 실제 constitution에 채택하면 이후 plan과 task에 TDD 요구를 전파할 수 있다.

### 4.2 기본 task template의 중요한 조건

Spec Kit의 기본 `tasks-template.md`에는 테스트 task 예제가 포함돼 있다. 각 user story 안에서 contract test와 integration test를 구현보다 먼저 배치하고, 테스트는 먼저 작성해 실패를 확인해야 한다고 설명한다.

그러나 같은 템플릿 상단에는 테스트가 선택 사항이며 feature specification에서 명시적으로 요청된 경우에만 포함한다고 적혀 있다. 구현 명령도 “테스트가 필요한 경우” 테스트 task를 코드보다 먼저 실행한다.

따라서 다음 두 문장은 동시에 사실이다.

- Spec Kit은 TDD task 순서와 constitution 예시를 제공한다.
- 기본 설정만으로 모든 feature에 테스트와 TDD가 의무화되지는 않는다.

이 차이를 놓치면 Spec Kit이 자동으로 test-first를 강제한다고 과장하게 된다.

### 4.3 TDD 하니스로 강화하는 방법

Spec Kit을 TDD 중심으로 사용하려면 constitution에 테스트 우선 원칙을 실제로 채우고, specification이 acceptance scenario와 테스트 요구를 명시하게 해야 한다. task template override 또는 preset을 사용해 “tests optional” 정책을 “tests required”로 바꾸고, 구현 후에는 `/speckit.converge`로 requirement, acceptance criterion과 constitution의 남은 gap을 task로 다시 만들 수 있다.

Spec Kit의 공식 커뮤니티 preset 목록에는 Test-First Governance preset이 등록돼 있다. 설명상 BDD/ATDD Gherkin, suite ownership, 테스트 보고서, 추적성과 위험 기반 gate를 제공한다. 다만 공식 문서는 community preset의 코드 품질을 GitHub가 감사하거나 보증하지 않는다고 명시하므로, 교육에 포함하기 전 소스 검토와 버전 고정이 필요하다.

### 4.4 강점과 한계

Spec Kit의 강점은 프로젝트 수준 원칙을 constitution이라는 상위 규칙으로 만들고, 명세부터 task와 구현까지 전달할 수 있다는 점이다. TDD를 한 스킬의 습관이 아니라 프로젝트 거버넌스로 표현하기 좋다.

한계는 기본 template에서 테스트가 optional이라는 점과 constitution이 결국 에이전트가 따라야 하는 문서 규칙이라는 점이다. 실제 Red 증거, 테스트 파일 변경 차단과 완료 Hook은 추가해야 한다.

### 4.5 강의에서 사용할 구체 사례

- 비어 있는 constitution과 Test-First constitution의 tasks 결과 비교
- tests optional 기본 task와 조직 override 비교
- acceptance scenario에서 contract/integration test task 생성
- `/speckit.converge`로 누락된 테스트·요구 gap을 다시 task화
- constitution 준수와 실제 Hook 강제의 차이

공식 저장소: [github/spec-kit](https://github.com/github/spec-kit)

## 5. BMAD Test Architect — TDD보다 넓은 테스트 엔지니어링 하니스

### 5.1 TEA의 범위

BMAD Method에는 간단한 test automation을 위한 기본 QA workflow와 별도로 Test Architect, 줄여서 TEA라는 공식 모듈이 있다. TEA는 단위 테스트를 먼저 쓰는 규율 하나보다 테스트 전략과 품질 의사결정의 전체 수명주기를 다룬다.

공식 문서가 제시하는 주요 workflow는 다음과 같다.

- Test Design: 요구와 위험을 바탕으로 테스트 전략 수립
- Framework Setup: 테스트 프레임워크 구성
- ATDD: 실패하는 인수 테스트를 먼저 생성
- Test Automation: 자동화 범위 확대
- Test Review: 테스트 품질과 커버리지 검토
- Requirements Tracing: 요구와 테스트 매핑
- NFR Evidence Audit: 성능·보안 같은 비기능 증거 검토
- CI/CD Integration: 품질 파이프라인 연결
- Release Gate: 근거 기반 go/no-go 판단

### 5.2 TDD 과정과의 관계

TEA의 ATDD workflow는 BDD 인수조건을 실패하는 인수 테스트로 연결하는 과정 사례로 적합하다. Requirements Tracing과 Release Gate는 테스트를 구현 부속물이 아니라 요구 충족 증거와 릴리스 판단의 입력으로 본다. P0~P3 위험 우선순위는 모든 테스트를 동일한 비용으로 실행하는 대신 중요한 행동과 변경에 더 강한 gate를 적용하는 근거가 된다.

그러나 TEA는 모든 작은 프로덕션 변경에 Red–Green–Refactor를 강제하는 단위 TDD 스킬과는 목적이 다르다. Superpowers가 개발자의 미시적 구현 리듬을 강하게 통제한다면, TEA는 프로젝트와 릴리스 수준의 테스트 전략 및 품질 거버넌스를 제공한다.

### 5.3 강의에서 사용할 구체 사례

- BDD scenario에서 failing acceptance test를 만드는 ATDD workflow
- requirement–test 추적표와 release gate 결정
- 위험도에 따른 P0/P1 테스트 우선 실행
- 테스트가 모두 통과해도 NFR 증거 부족으로 release를 보류하는 사례
- 단위 TDD 하니스와 프로젝트 테스트 아키텍처의 역할 구분

공식 문서: [BMAD Test Architect](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/)

## 6. VS Code 공식 TDD custom agent 사례

Microsoft의 VS Code 공식 문서에는 Red, Green과 Refactor 단계를 별도 custom agent로 구성하는 TDD 가이드가 있다. 이는 특정 대형 프레임워크를 설치하지 않고도 역할별 agent instruction으로 TDD 흐름을 구성할 수 있다는 실용적인 사례다.

이 접근은 강의의 최소 하니스 실습과 잘 맞는다. 수강생이 test-writer, implementer와 refactor 역할을 직접 만들고 파일 범위와 도구를 제한할 수 있다. 다만 custom agent 분리만으로 단계 전이와 완료 조건이 기계적으로 보장되는지는 별도로 검증해야 한다. 역할 정의와 Hook·CI gate는 서로 다른 통제 층이다.

공식 문서: [Set up a test-driven development flow in VS Code](https://code.visualstudio.com/docs/agents/guides/test-driven-development-guide)

## 7. 조합형 사례

### 7.1 Spec Kit + Superpowers

Spec Kit은 요구, constitution과 task를 제공하고 Superpowers는 각 구현 task에서 엄격한 Red–Green–Refactor와 완료 검증을 제공할 수 있다. Spec Kit 공식 community 문서는 Superpowers 기반 quality gate를 결합한 `cc-spex`를 friend project로 소개한다.

이 조합의 장점은 명세 추적성과 구현 규율을 분리해 각자 강한 도구에 맡기는 것이다. 단점은 여러 도구의 instruction 우선순위와 상태가 충돌할 수 있다는 점이다. 어떤 문서가 단일 진실인지, task 완료를 누가 승인하는지 명확히 해야 한다.

### 7.2 OpenSpec + Superpowers

OpenSpec change의 requirement와 scenario를 Superpowers TDD task의 입력으로 사용할 수 있다. OpenSpec은 기존 동작과 변경 delta를 관리하고, Superpowers는 승인된 task를 실패 테스트부터 구현한다. OpenSpec verify에서 scenario test 누락을 확인하고 Superpowers 완료 검증에서 최신 실행 증거를 요구하도록 결합할 수 있다.

### 7.3 Spec Kit/OpenSpec + Hook gate

명세 도구의 task checkbox나 verify report는 유용하지만 모델 바깥의 차단 장치와 동일하지 않다. 다음 조건은 Hook이나 CI로 옮길 수 있다.

- 테스트 task가 구현 task보다 앞서 완료됐는가?
- Red 실행 증거가 존재하는가?
- 구현 역할이 승인 없이 테스트를 변경했는가?
- 모든 requirement/scenario가 테스트에 매핑됐는가?
- 전체 회귀와 타입·린트 검사가 통과했는가?

## 8. 비교 결과

| 도구 | 주된 층 | test-first 기본 강도 | 요구–테스트 추적 | 완료 검증 | 기계적 차단 |
|------|---------|----------------------|----------------|-----------|-------------|
| Superpowers | 구현 절차·스킬 | 매우 강함 | 설계·plan을 통해 간접 연결 | 최신 실행 증거를 강하게 요구 | 기본은 지침 중심 |
| OpenSpec | 변경 명세·검증 | 기본 apply에서는 약함 | requirement·scenario 중심으로 강함 | verify와 archive 검사 | 경고·artifact 중심 |
| Spec Kit | 프로젝트 SDD·거버넌스 | constitution에 따라 강해짐, 기본 tests는 선택 | user story·acceptance·task 연결 | implement/converge 검사 | 기본은 template·지침 중심 |
| BMAD TEA | 테스트 전략·ATDD·릴리스 | ATDD에서 강함, 모든 단위 변경 TDD는 아님 | requirements tracing이 핵심 | release gate 제공 | workflow·evidence 중심 |
| MoAI-ADK | 종합 에이전트 하니스 | TDD mode에서 강함 | SPEC·AC·workflow 연결 | Hook·품질 framework | Hook 기반이나 동적 검증 필요 |
| VS Code TDD agents | 역할별 최소 workflow | agent 설계에 따라 강함 | 사용자가 연결해야 함 | 추가 구성 필요 | 역할 분리만으로는 제한적 |

이 표의 “강함”은 도구 설명의 엄격함과 구조를 비교한 것이며, 모든 실행에서 규율이 실제로 지켜진다는 제품 인증이 아니다. 특히 지침 기반 도구는 모델이 instruction을 누락하거나 충돌하는 상황을 실험해야 하고, Hook 기반 도구는 이벤트 계약과 fail-open 여부를 검사해야 한다.

## 9. 과정에 포함할 추천 사례

모든 도구를 설치하고 명령을 따라 하는 방식은 과정의 초점을 흐린다. 각 도구에서 하나의 핵심 교훈을 가져오는 편이 좋다.

1. **Cucumber/BDD**: 구현 전에 예제를 발견하고 정형화하는 방법
2. **OpenSpec**: 현재 진실과 변경 delta를 분리하고 scenario를 보존하는 방법
3. **Spec Kit**: Test-First를 constitution과 task ordering으로 조직 규칙화하는 방법
4. **Superpowers**: Red를 직접 확인하고 최신 검증 증거 없이는 완료를 주장하지 않는 방법
5. **MoAI-ADK**: 명세·역할·상태·Hook을 종합 하니스로 연결하는 방법
6. **BMAD TEA**: 위험 기반 테스트 전략, 추적성과 release gate로 확장하는 방법
7. **자체 최소 하니스**: 위 패턴을 작은 agent, state와 Hook으로 직접 구현하고 실패 주입으로 검증

## 맺음말

MoAI 이외에도 테스트를 적극적으로 활용하는 도구는 많다. 그러나 각 도구가 테스트를 사용하는 목적과 강제 수준은 다르다. Superpowers는 구현 순서와 증거 규율에 가장 직접적이고, OpenSpec과 Spec Kit은 테스트가 나올 수 있는 명세와 task 구조를 제공한다. BMAD TEA는 요구 추적과 릴리스 품질 판단까지 범위를 넓힌다.

따라서 좋은 과정은 특정 도구 하나를 정답으로 가르치지 않는다. BDD 예제를 입력으로 보존하고, 실패 테스트를 먼저 확인하며, 역할과 권한을 분리하고, 최신 실행 증거와 완료 gate를 남긴다는 공통 원리를 여러 도구에서 비교한 뒤 최소 하니스를 직접 만들게 해야 한다.
