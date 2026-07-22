# BMAD Test Architect(TEA) 심층 사례 연구

## 1. TEA의 범위

BMAD 공식 문서는 TEA(Test Engineering Architect)를 테스트 전략과 자동화를 위한 모듈로 설명하며, Test Design, Framework Setup, CI/CD Integration, ATDD, Test Automation, Test Review, NFR Evidence Audit와 Requirements Tracing 등의 workflow를 제시한다.[^bmad-overview]

본 분석에서는 이 범위를 단위 TDD 한 사이클보다 넓은 테스트 엔지니어링 수명주기로 해석한다.

따라서 Superpowers와 같은 미시적 구현 규율로 평가하면 TEA의 강점을 놓친다. Superpowers가 “다음 production line 전에 실패 테스트를 봤는가”를 묻는다면 TEA는 “어떤 위험을 어떤 테스트 수준으로 다루며, 릴리스 결정을 뒷받침하는 증거가 충분한가”를 묻는다.

이 장은 2026-07-22에 확인한 BMAD TEA 공식 문서를 기준으로 한다. 실제 설치 버전의 workflow 파일은 릴리스에 따라 달라질 수 있으므로 강의 실습 전 버전 고정과 재검증이 필요하다.

## 2. 아홉 workflow와 관계

공식 문서가 제시하는 핵심 workflow는 다음과 같다.

| Workflow | 목적 | TDD·BDD와의 관계 |
|---|---|---|
| Teach Me Testing | 테스트 개념 학습 | 선수 지식 형성 |
| Test Design | 위험·NFR 기반 전략 | 어떤 행동을 어느 수준에서 검증할지 결정 |
| Framework Setup | 자동화 기반 구성 | 테스트가 실행될 하니스 준비 |
| CI/CD Integration | 품질 파이프라인 | 모델 밖의 반복 실행과 차단 |
| ATDD | 실패 인수 테스트 생성 | BDD 시나리오를 executable example로 변환 |
| Test Automation | 자동화 범위 확장 | 회귀 스위트 구현 |
| Test Review | 테스트 품질 감사 | 약한 assertion과 나쁜 구조 탐지 |
| NFR Evidence Audit | 비기능 증거 평가 | 성능·보안·신뢰성 기준 검증 |
| Requirements Tracing | 요구–테스트 매핑과 gate | coverage gap과 go/no-go 판단 |

공식 문서에서 `GATE`는 독립 artifact를 생성하는 workflow가 아니라 선택적인 review와 NFR 평가를 거쳐 trace Phase 2로 안내하는 routing helper로 설명된다.[^bmad-overview] 따라서 이를 그 자체로 자동 배포 차단 엔진이라고 표현해서는 안 된다.

## 3. Test Design: 테스트 코드를 쓰기 전의 결정

공식 가이드는 Test Design을 아키텍처 이후 구현 준비 전의 시스템 수준 또는 epic 시작 시점의 epic 수준에서 수행하도록 안내하며, 위험과 NFR을 포함한 테스트 전략을 산출한다고 설명한다.[^bmad-test-design]

Todo 사례의 단순 기능도 다음처럼 위험을 구분할 수 있다.

| 위험 | 확률 | 영향 | 우선순위 | 검증 방법 |
|---|---:|---:|---|---|
| 다른 사용자 ownerId로 저장 | 중 | 높음 | P0 | API+DB 통합 테스트 |
| 공백 제목 허용 | 높음 | 중 | P1 | 단위+API 테스트 |
| 중복 제출로 두 건 생성 | 중 | 중 | P1/P2 | 동시성·idempotency 테스트 |
| 응답 지연 증가 | 낮음 | 중 | P2 | 부하/성능 증거 |

위험 우선순위는 낮은 항목을 영원히 생략하는 면허가 아니다. 어떤 테스트를 가장 먼저, 어느 gate에서 반드시 실행할지 정하는 근거다. 또한 line coverage가 높다는 사실만으로 권한 오염 같은 P0 위험이 검증됐다고 판단하지 않는다.

## 4. ATDD: BDD 예제를 실패 인수 테스트로

TEA의 ATDD workflow는 구현 전에 failing acceptance test를 만드는 지점이다. BDD 시나리오가 대화 가능한 예제라면 ATDD는 그 예제를 시스템 경계에서 실행 가능한 계약으로 만든다.

```gherkin
Scenario: 현재 사용자의 소유로 Todo를 생성한다
  Given 사용자 "u-1"이 인증되어 있다
  When 제목 "Buy milk"로 Todo를 생성한다
  Then 응답 상태는 201이다
  And 응답의 ownerId는 "u-1"이다
  And 데이터베이스의 Todo ownerId도 "u-1"이다
```

ATDD 결과는 구현 전이므로 실패해야 하지만 모든 실패가 유효하지는 않다. 서버가 뜨지 않거나 인증 fixture가 깨진 실패와 기능이 없어서 404 또는 계약 mismatch가 나는 실패를 구분해야 한다. 따라서 Red evidence에는 환경 health check와 예상 실패 이유도 포함한다.

인수 테스트만으로 내부 설계 피드백이 느릴 수 있다. 같은 acceptance criterion에서 도메인 단위 테스트를 파생해 빠른 TDD 사이클을 돌리고, ATDD 테스트는 외부 계약의 이중 루프를 담당하게 하는 방식이 적합하다.

```text
BDD example
  ├─ outer loop: failing acceptance test → story 완료 판정
  └─ inner loop: unit/integration Red–Green–Refactor → 구현 설계
```

## 5. Framework Setup과 CI의 의미

테스트 파일만 생성해서는 반복 가능한 하니스가 되지 않는다. framework setup은 fixture, 데이터 격리, 인증 helper, report와 directory convention을 준비한다. CI/CD integration은 동일한 명령을 깨끗한 환경에서 실행하고 결과와 artifact를 보존한다.

교육에서는 framework 생성 결과의 화려함보다 다음을 검증해야 한다.

- 테스트가 실행 순서와 무관한가.
- 병렬 실행에서도 데이터가 격리되는가.
- 실패 시 screenshot, trace, 로그가 남는가.
- retry가 실제 결함을 가리지 않는가.
- 로컬과 CI의 명령 및 버전이 일치하는가.
- non-zero exit가 pipeline을 실제로 막는가.

## 6. Test Review는 테스트의 존재가 아니라 품질을 본다

요구에 매핑된 테스트가 있어도 assertion이 약하거나 내부 구현에 과결합될 수 있다. Test Review는 테스트 구조, 결정성, 격리, 유지보수성과 assertion의 의미를 평가하는 단계다.

Todo 테스트가 HTTP 201만 확인하고 ownerId나 persistence를 보지 않는다면 시나리오를 부분적으로만 덮는다. 모든 dependency를 mock해 실제 authorization context 전달을 건너뛴다면 빠르지만 핵심 위험을 검증하지 못한다. 테스트 수와 coverage 퍼센트보다 위험에 대한 탐지 능력을 본다는 점이 중요하다.

강의에서는 mutation을 간단히 주입할 수 있다. production code가 현재 사용자 대신 request body의 ownerId를 쓰도록 바꿨을 때 테스트가 실패하지 않으면, P0 위험에 대한 테스트는 존재해도 효과가 없다.

## 7. Requirements Tracing의 두 단계

공식 trace workflow는 coverage traceability와 quality gate decision의 두 단계로 설명된다.[^bmad-trace]

### Phase 1: Coverage Traceability

요구 또는 brownfield에서 추론한 journey를 구현된 테스트에 매핑하고 FULL, PARTIAL, NONE과 같은 coverage 상태와 gap 우선순위를 만든다. formal requirement가 가장 좋은 oracle이고, 없으면 contract/spec, 외부 pointer, 마지막으로 소스에서 추론한 journey를 사용할 수 있다.

```markdown
| Requirement | Priority | Tests | Coverage | Evidence |
|---|---|---|---|---|
| AC-OWNER | P0 | API-12, DB-04 | FULL | run-20260722.json |
| AC-BLANK | P1 | UNIT-07 | PARTIAL | API 부작용 검증 누락 |
| NFR-LATENCY | P2 | 없음 | NONE | 성능 실행 필요 |
```

### Phase 2: Quality Gate Decision

Phase 2는 Phase 1 결과와 실제 test run 결과를 요구하며 PASS, CONCERNS, FAIL 또는 WAIVED 결정을 만든다. 공식 가이드는 story, epic, release와 hotfix gate 및 deterministic·manual decision mode를 설명한다.[^bmad-trace]

여기서 중요한 것은 gate가 coverage 숫자만 읽지 않는다는 점이다. test review와 NFR evidence는 선택적으로 추가할 수 있고, waiver에는 승인자, 이유, 수용 위험, 조건과 후속 계획이 필요하다.

## 8. Todo release gate 예시

```markdown
# Gate Decision: Todo Creation

- Decision: CONCERNS
- P0 coverage: 100%
- P1 coverage: 50%
- Functional test run: 48 passed, 0 failed
- NFR: latency evidence missing

## Reason

owner isolation은 충분히 검증됐으나 공백 요청에서 persistence가 발생하지 않는
API 수준 증거가 없고, 목표 p95 200ms의 실행 근거가 없다.

## Required before PASS

1. AC-BLANK 부작용 통합 테스트 추가
2. staging 부하 테스트 결과 첨부
```

모든 기능 테스트가 초록이어도 NFR 증거가 없으면 PASS가 아닐 수 있다. 반대로 P2 gap을 사업적으로 수용해 WAIVED로 진행할 수도 있지만, 이는 조용한 무시가 아니라 명시적 위험 수용이다.

## 9. brownfield 적용

기존 시스템에는 정돈된 requirement가 없을 수 있다. 이때 trace는 현재 테스트와 소스에서 journey를 추론해 baseline을 만들 수 있다. 그러나 추론된 행동을 곧바로 바람직한 요구로 승격해서는 안 된다. characterization은 “현재 무엇을 하는가”를 고정할 뿐 “무엇을 해야 하는가”를 결정하지 않는다.

brownfield 순서는 다음이 안전하다.

1. 현재 행동과 테스트 coverage baseline을 만든다.
2. 위험한 미검증 행동에 characterization test를 추가한다.
3. 변경할 행동은 BDD로 다시 합의한다.
4. ATDD와 내부 TDD로 새 행동을 구현한다.
5. trace를 갱신하고 baseline 대비 악화 여부를 본다.

## 10. 강제 수준과 한계

TEA 공식 가이드는 traceability 결과를 CI에서 사용해 coverage 임계치 미달 시 실패시키는 자동화 예를 별도로 제시한다.[^bmad-trace] 이는 gate decision artifact 생성과 배포 파이프라인의 기계적 집행을 별도 층으로 설계해야 한다는 근거가 된다.

또한 P0 100%, P1 90% 같은 숫자는 조직과 상황에 맞게 정해야 한다. 예시 임계치를 품질의 보편 법칙으로 복사하면 위험 분석이 체크리스트로 변질된다. test review score와 coverage도 실제 결함 탐지력을 보조하는 지표일 뿐 목표 그 자체가 아니다.

## 11. 대표 실패 모드

- **모든 테스트를 P0로 지정**: 우선순위가 의미를 잃고 pipeline 비용만 증가한다.
- **ATDD를 UI E2E로만 해석**: API와 component level의 더 빠른 인수 테스트도 고려한다.
- **trace를 파일명 매칭으로 끝냄**: scenario의 assertion과 부작용을 직접 검토한다.
- **테스트 통과를 release PASS로 오해**: NFR, risk, waiver와 최신 결과를 함께 본다.
- **문서 gate와 배포 gate 분리**: decision artifact를 CI/CD transition에 연결한다.
- **brownfield 현재 행동을 정답으로 간주**: characterization과 desired behavior를 구분한다.

## 12. 교육 활용

TEA는 TDD 과정을 팀과 릴리스 수준으로 확장하는 후반부 사례에 적합하다. 수강생은 같은 Todo 기능에 위험 점수를 매기고, BDD 시나리오에서 failing acceptance test를 만들며, 단위 TDD로 구현한 뒤 trace matrix와 release decision을 작성한다. 마지막에는 기능 테스트는 통과하지만 NFR 증거가 없는 상태를 주어 PASS, CONCERNS, WAIVED 중 어떤 결정을 할지 근거로 토론하게 한다.

핵심 교훈은 테스트를 많이 생성하는 것이 아니다. 위험에서 테스트 전략을 도출하고, 요구와 테스트를 연결하며, 현재 실행 증거가 실제 go/no-go 결정에 도달하도록 만드는 것이다.

## 공식 근거

- [BMAD Test Architect 공식 문서](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/)
- [Test Design 실행 가이드](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/how-to/workflows/run-test-design/)
- [Trace 실행 가이드](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/how-to/workflows/run-trace/)

## 주석

[^bmad-overview]: BMAD, “Test Architect (TEA),” 2026-07-22 확인. <https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/>

[^bmad-test-design]: BMAD, “How to Run Test Design with TEA,” 2026-07-22 확인. <https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/how-to/workflows/run-test-design/>

[^bmad-trace]: BMAD, “How to Run Trace with TEA,” 2026-07-22 확인. <https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/how-to/workflows/run-trace/>
