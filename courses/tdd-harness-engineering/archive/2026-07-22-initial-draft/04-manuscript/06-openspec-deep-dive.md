# OpenSpec 심층 사례 연구

## 1. OpenSpec은 TDD 도구인가

OpenSpec 공식 저장소와 문서는 현재 시스템의 명세와 제안된 change artifact를 분리하고 proposal·spec·design·tasks를 apply, verify와 archive에 연결하는 Spec-Driven Development workflow를 설명한다.[^openspec-repository] 본 분석에서는 이를 Red–Green–Refactor 실행기보다 변경 명세 중심 도구로 분류한다.

TDD 과정에서 가치가 있는 이유는 테스트가 출발할 명세 단위를 안정적으로 제공하기 때문이다. 채팅에만 남은 요구와 달리 requirement와 scenario가 change artifact에 남으면 테스트 역할과 구현 역할이 같은 기준을 읽을 수 있다. OpenSpec의 중심은 테스트 실행 순서보다 “무엇을 테스트할 것인가”와 “변경이 현재 진실에 어떻게 합쳐지는가”다.

이 장은 2026-07-22에 확인한 공식 저장소 커밋 `60f720c43acd94de7645ac8629c614ede4682b6a`를 기준으로 한다.

## 2. 현재 명세와 변경 명세

```text
openspec/
├── specs/                  # 현재 시스템의 합의된 행동
└── changes/
    └── add-todo/
        ├── proposal.md     # 왜 바꾸는가
        ├── design.md       # 어떻게 접근하는가
        ├── tasks.md        # 어떤 작업을 수행하는가
        └── specs/...       # 이번 변경의 requirement와 scenario
```

`specs/`는 현재 진실이고 `changes/`는 아직 합쳐지지 않은 제안이다. archive할 때 delta가 현재 명세에 반영된다. brownfield에서는 기존 행동과 원하는 행동을 한 문서에 덮어쓰지 않고 추가·수정·삭제 범위를 검토할 수 있다.

TDD 관점에서는 현재 명세가 characterization test의 기준, 변경 명세가 새로운 failing test의 기준이 될 수 있다. 보존할 행동과 의도적으로 바꿀 행동을 구분하는 셈이다.

## 3. workflow와 산출물

```text
/opsx:new add-todo
  → /opsx:continue 또는 /opsx:ff
  → /opsx:apply add-todo
  → /opsx:verify add-todo
  → /opsx:archive add-todo
```

`continue`는 다음 artifact를 단계적으로 만들고 `ff`는 가능한 planning artifact를 빠르게 채운다. proposal은 변경 이유와 경계를, spec delta는 requirement와 scenario를, design은 기술 결정과 위험을, tasks는 실행 가능한 작업을 담는다.

여기서 TDD 강도는 tasks의 표현에 크게 좌우된다. 기본 apply는 pending task를 순서대로 구현하지만 모든 task에서 실패 테스트를 먼저 만들라는 범용 규칙을 자동 삽입하지 않는다.

## 4. Todo 변경을 artifact로 표현하기

### 4.1 proposal

```markdown
# Change: 로그인 사용자의 Todo 생성

## Why
사용자는 현재 할 일을 조회할 수 있지만 새 항목을 만들 수 없다.

## What Changes
- 로그인 사용자가 제목으로 Todo를 생성한다.
- 공백 제목은 거부한다.
- 생성된 Todo에는 현재 사용자 ID를 기록한다.

## Out of Scope
- 공유 Todo
- 반복 일정
```

### 4.2 scenario

```markdown
## ADDED Requirements

### Requirement: Todo creation
The system SHALL create a todo owned by the authenticated user when a valid
title is submitted.

#### Scenario: Blank title
- **WHEN** user `u-1` submits a whitespace-only title
- **THEN** the request is rejected with `TITLE_REQUIRED`
- **AND** no todo is persisted
```

### 4.3 TDD 순서를 보존하는 tasks

“validation 구현 및 테스트” 하나로 쓰면 실제 순서를 알 수 없다. Red와 Green을 독립 완료 조건으로 둔다.

```markdown
- [ ] 1.1 AC-BLANK 단위 테스트를 작성한다.
- [ ] 1.2 TITLE_REQUIRED 행동 부재로 실패한 증거를 남긴다.
- [ ] 1.3 최소 validation을 구현하고 대상 테스트를 통과시킨다.
- [ ] 1.4 저장 부작용이 없음을 통합 테스트로 Red부터 검증한다.
- [ ] 1.5 전체 회귀와 정적 검사를 실행한다.
```

artifact 설계 자체가 이후 증거의 해상도를 결정한다.

## 5. apply가 하는 일과 하지 않는 일

공개 `apply-change` 템플릿은 change를 선택하고 `openspec status --change ... --json`으로 schema와 상태를 읽은 뒤 `openspec instructions apply --change ... --json`에서 context file, progress와 task를 받아 관련 artifact를 읽도록 지시한다.[^openspec-apply]

구현 루프는 pending task를 하나씩 수행하고 최소 범위로 변경한 뒤 체크박스를 완료로 바꾼다. task가 모호하거나 구현 중 설계 문제가 드러나면 추측하지 않고 멈추도록 한다. 이는 장시간 에이전트 작업의 유용한 상태 관리다.

하지만 다음은 자동 보장되지 않는다.

- task 완료 체크가 테스트 통과를 증명하지 않는다.
- task 문서가 나쁘면 Red–Green 순서도 보존되지 않는다.
- 구현자가 테스트 기대값을 약화했는지 별도 검사하지 않는다.
- 체크박스와 실제 코드·실행 결과가 일치하는지 apply만으로 알 수 없다.

## 6. verify의 세 차원

`/opsx:verify`는 구현과 change artifact를 Completeness, Correctness, Coherence로 검토한다.

- **Completeness**: task 완료와 requirement 구현 근거를 찾는다.
- **Correctness**: 구현이 requirement 의도와 scenario 행동을 만족하는지, 관련 테스트가 있는지 본다.
- **Coherence**: design decision과 프로젝트 관례가 코드에 반영됐는지 본다.

공식 명령 문서는 문제를 CRITICAL, WARNING, SUGGESTION으로 보고하지만 verify 자체가 archive를 차단하지는 않는다고 설명한다.[^openspec-commands] 조사 기준의 공개 템플릿에서는 scenario test 누락을 WARNING으로 보고하도록 지시한다.[^openspec-verify] 따라서 본 분석에서는 “verify 실행”과 “모든 테스트가 존재하며 상태 전이가 차단됨”을 구분한다.

또한 코드 검색과 에이전트의 의미 판단은 실제 테스트 실행 결과가 아니다. 테스트 파일을 찾았다고 그 테스트가 현재 commit에서 통과한다는 뜻도 아니다.

## 7. 문서 검증을 실행 게이트로 바꾸기

1. 모든 scenario에 안정적인 ID를 부여한다.
2. 테스트 이름이나 메타데이터에 scenario ID를 넣는다.
3. verify 전에 실제 테스트 명령과 결과 파일을 생성한다.
4. scenario–test 누락을 CI 실패로 처리한다.
5. 결과가 오래됐거나 task가 미완료면 archive를 거부한다.

```yaml
change: add-todo
scenarios:
  TODO-BLANK:
    tests:
      - tests/api/todo-create.test.ts::rejects_blank_title
      - tests/unit/todo-service.test.ts::does_not_persist_blank_title
    status: passed
evidence_commit: abc1234
```

CI는 `evidence_commit`과 HEAD가 같은지, 모든 scenario가 테스트에 매핑됐는지, 결과가 성공인지 확인한다. 이 보강이 있어야 문서 추적성이 실행 통제로 바뀐다.

## 8. archive의 의미

archive는 단순 폴더 이동이 아니라 제안된 delta를 현재 명세에 합치는 상태 전이다. 테스트가 부족한 변경을 archive하면 불완전한 행동 정의가 현재 진실이 될 수 있다.

좋은 archive 전 조건은 requirement와 scenario 검토, checkbox와 diff의 일치, scenario별 검증 근거, 현재 commit의 전체 회귀 결과, 의도적으로 남긴 gap의 waiver다. OpenSpec 기본 verify가 이를 자동 차단하지 않는 부분은 조직 workflow나 mandatory hook, CI로 구현해야 한다.

## 9. 대표 실패 모드

- **모호한 scenario**: “정상 처리” 대신 구체 입력, 출력, 오류와 부작용을 쓴다.
- **구현 중심 tasks**: 각 acceptance behavior에 Red 증거와 Green을 나눈다.
- **checkbox를 증거로 오해**: diff, 테스트 결과, scenario mapping으로 교차 검증한다.
- **verify 경고 무시**: 위험도 높은 누락은 blocking condition으로 승격한다.
- **artifact와 현실의 분기**: 구현자가 조용히 문서를 바꾸지 말고 blocker로 올려 재승인한다.

## 10. 교육 활용

OpenSpec은 BDD 예제를 세션 밖에 보존하고 현재 행동과 변경 행동을 분리하는 사례로 적합하다. 첫 실습에서는 모호한 task로 apply해 테스트 순서가 사라지는 모습을 보고, 두 번째에는 scenario ID와 Red/Green task를 추가한다. 마지막에는 테스트 하나를 일부러 누락해 verify의 경고와 CI의 차단을 비교한다.

결론은 OpenSpec이 TDD를 자동 해결한다는 것이 아니다. 좋은 명세 artifact가 TDD 입력과 추적성을 제공하지만, test-first 순서와 완료 차단은 task 설계와 실행 하니스가 보완해야 한다.

## 공식 근거

- [OpenSpec 공식 저장소](https://github.com/Fission-AI/OpenSpec)
- [명령 문서](https://github.com/Fission-AI/OpenSpec/blob/main/docs/commands.md)
- [apply-change 템플릿](https://github.com/Fission-AI/OpenSpec/blob/main/src/core/templates/workflows/apply-change.ts)
- [verify-change 템플릿](https://github.com/Fission-AI/OpenSpec/blob/main/src/core/templates/workflows/verify-change.ts)

## 주석

[^openspec-repository]: Fission-AI, OpenSpec 공식 저장소, commit `60f720c43acd94de7645ac8629c614ede4682b6a`, 2026-07-22 확인. <https://github.com/Fission-AI/OpenSpec>

[^openspec-apply]: Fission-AI, OpenSpec, `src/core/templates/workflows/apply-change.ts`, commit `60f720c43acd94de7645ac8629c614ede4682b6a`, 2026-07-22 확인. <https://github.com/Fission-AI/OpenSpec/blob/main/src/core/templates/workflows/apply-change.ts>

[^openspec-commands]: Fission-AI, “OpenSpec Commands,” 2026-07-22 확인. <https://github.com/Fission-AI/OpenSpec/blob/main/docs/commands.md>

[^openspec-verify]: Fission-AI, OpenSpec, `src/core/templates/workflows/verify-change.ts`, commit `60f720c43acd94de7645ac8629c614ede4682b6a`, 2026-07-22 확인. <https://github.com/Fission-AI/OpenSpec/blob/main/src/core/templates/workflows/verify-change.ts>
