# MoAI-ADK 구체 사용 흐름

> 목적: MoAI 설치 튜토리얼이 아니라, 실제 명령과 생성 자산이 테스트 중심 하니스에서 어떤 역할을 하는지 설명하기 위한 사례 자료
>
> 주의: 실제 강의 전 특정 릴리스 버전을 고정하고 별도 샌드박스에서 재검증해야 한다.

## 1. 전체 사용 시나리오

예제 요구:

> 로그인한 사용자가 제목을 입력해 할 일을 만들 수 있다. 공백뿐인 제목은 거부한다.

MoAI가 제시하는 대표 흐름은 다음과 같다.

```bash
moai init todo-harness-lab
cd todo-harness-lab
claude
```

Claude Code 안에서:

```text
/moai plan "로그인한 사용자의 할 일 생성 기능"
/moai run SPEC-TODO-001
/moai sync SPEC-TODO-001
```

| 명령 | 하니스 역할 | 확인할 산출물 |
|------|-------------|---------------|
| `moai init` | 언어·프레임워크·개발 모드 감지 및 환경 구성 | `.claude/`, `.moai/`, 품질 설정 |
| `/moai plan` | 요구를 구현 전 SPEC과 인수조건으로 고정 | spec, plan, acceptance, progress |
| `/moai run` | 선택된 TDD/레거시 workflow 실행 | 테스트, 구현, 체크포인트, 품질 결과 |
| `/moai sync` | 문서와 구현 상태를 맞추고 PR 준비 | 변경 문서, 보고서, PR 정보 |

## 2. 개발 모드 설정

MoAI의 TDD 스킬은 `.moai/config/sections/quality.yaml`의 설정을 기준으로 workflow를 고른다고 명시한다.

```yaml
constitution:
  development_mode: tdd
```

레거시의 현재 행동 보존을 우선할 때는 `ddd` 모드를 사용한다.

```yaml
constitution:
  development_mode: ddd
```

강의에서는 자동 감지를 그대로 신뢰하지 않고 다음 질문을 먼저 답하게 한다.

- 신규 행동을 추가하는가?
- 기존 행동을 보존하며 구조만 바꾸는가?
- 기존 테스트가 현재 행동을 충분히 보호하는가?
- 버그를 현재 행동으로 고정할 위험은 없는가?

## 3. SPEC에서 테스트 케이스 도출

MoAI의 TDD workflow는 구현 전에 SPEC을 읽고 acceptance criteria에서 테스트 케이스를 식별한다.

강의용 최소 SPEC 예:

```markdown
## REQ-TODO-001

시스템은 로그인한 사용자가 제목으로 할 일을 생성할 수 있게 해야 한다.

## Acceptance Criteria

- AC-TODO-001: 유효한 제목이면 생성된 할 일을 반환한다.
- AC-TODO-002: 공백뿐인 제목이면 입력 오류를 반환한다.
- AC-TODO-003: 생성된 할 일에는 현재 사용자 ID가 기록된다.
```

강의에서는 각 AC에 최소 하나의 테스트가 연결됐는지 표로 검사한다.

| AC | 테스트 | 계층 | 상태 |
|----|--------|------|------|
| AC-TODO-001 | `creates todo with valid title` | 단위/인수 | Red |
| AC-TODO-002 | `rejects blank title` | 단위/인수 | Red |
| AC-TODO-003 | `records current user id` | 통합 | Red |

## 4. Red 단계의 구체적 용법

MoAI 스킬에서 확인한 절차:

1. 요구를 명확히 이해한다.
2. 한 번에 하나의 행동 테스트를 작성한다.
3. 테스트 이름을 구현이 아니라 행동으로 표현한다.
4. 테스트를 실행해 올바른 이유로 실패하는지 확인한다.
5. 구현과 테스트가 동시에 생기거나 첫 실행부터 모두 통과하면 Red 누락을 의심한다.

강의용 증거 형식:

```markdown
## RED EVIDENCE — AC-TODO-002

- command: pnpm vitest run test/todo.test.ts
- expected failure: blank title is rejected
- actual failure: expected error, received Todo object
- unrelated failures: none
- source checkpoint: no production change for AC-TODO-002
```

## 5. Green 단계의 구체적 용법

MoAI `manager-develop`의 핵심 규율:

- 테스트가 요구한 일반 해법을 구현
- 특정 fixture 값에 대한 하드코딩 금지
- 테스트 즉시 재실행
- 기존 테스트를 깨뜨리지 않음
- LSP·타입 오류가 없어야 함

강의에서는 구현 에이전트의 변경 범위를 `src/`로 제한하고 `test/` 변경을 차단한다.

## 6. Refactor 단계의 구체적 용법

- 중복 제거
- 이름 개선
- 작은 함수·객체 추출
- 단계마다 테스트 실행
- 실패하면 직전 작은 변경만 되돌림

MoAI는 각 사이클 뒤 체크포인트를 남기고 전체 테스트와 커버리지 조건을 다시 확인하는 구조를 제시한다.

## 7. Hook 연결 사례

조사한 MoAI 설정에는 다음 이벤트가 연결되어 있다.

| 이벤트 | 용도 예시 | 조사된 timeout |
|--------|-----------|----------------|
| `PreToolUse` | Write/Edit/Bash 전 정책 검사 | 5초 |
| `PostToolUse` | 변경 후 상태 전이·관찰 | 5~10초 |
| `Stop` | 종료 시 품질 게이트·상태 처리 | 5초 및 품질 게이트 60초 |
| `TeammateIdle` | 팀 에이전트가 쉬기 전 검증 | 60초 |
| `TaskCompleted` | 작업 완료 조건 검증 | 60초 |

이 수치는 조사한 저장소 시점의 설정이며 버전에 따라 달라질 수 있다.

## 8. 완료 조건

MoAI TDD 자료에서 확인한 대표 완료 조건:

- Red 증거 또는 Git 이력
- 모든 테스트 통과 결과
- 비활성화된 테스트 추가 없음
- 변경 파일의 커버리지 보고
- Refactor 수행 또는 생략 사유
- LSP, lint, type 오류 없음
- 기존 테스트 수정·삭제는 SPEC 근거 필요

강의에서는 이 조건을 단순 체크리스트와 기계적 Hook으로 각각 구현해 차이를 비교한다.

## 9. 실패 복구

MoAI 구조에서 가져올 복구 패턴:

- 테스트가 너무 크면 한 행동으로 분해
- 구현이 커지면 현재 Red에 필요한 코드만 남김
- 리팩터가 테스트를 깨면 작은 변경 단위로 되돌림
- TDD 규율이 깨졌다면 현재 코드를 characterization test로 고정하고 남은 기능부터 TDD 재개
- 반복 루프에는 최대 횟수와 무진전 감지를 둠

## 10. 비판적 실습

MoAI를 실행한 뒤 다음 질문에 증거로 답한다.

1. 첫 테스트가 실제로 구현 전에 실패했는가?
2. 실패 이유는 요구 행동 미구현 때문인가?
3. 구현 에이전트가 테스트를 수정할 수 있었는가?
4. 관련 테스트뿐 아니라 기존 회귀 테스트도 실행됐는가?
5. Hook이 실패 시 실제로 다음 상태 전이를 막았는가?
6. Hook timeout이나 잘못된 응답으로 silent bypass되지 않았는가?
7. 커버리지 숫자 외에 테스트 강도를 검증했는가?

## 공식 참고

- [MoAI-ADK GitHub](https://github.com/modu-ai/moai-adk)
- [MoAI 명령 문서](https://adk.mo.ai.kr/utility-commands/moai)
