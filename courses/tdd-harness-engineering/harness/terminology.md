# 과정개발 하네스 용어 경계

## 과정 제작 하니스

이 강의를 만드는 운영 환경이다. 사용자의 의도를 질문으로 발견하고 Planning·Research·Design·Manuscript·Materials·Deliveries의 산출물과 상태 전이를 통제한다.

과정 제작 하니스는 `harness/`의 규칙·검사기뿐 아니라, 그 규칙이 생성하고 갱신하는 제작 의도와 결정 기록을 포함한다. 반면 `01-planning/`부터 `06-deliveries/`까지는 TDD 과정 자체의 산출물이다.

## 개발 하니스와의 구분

| 구분 | 개발 하니스 | 과정 제작 하니스 |
|---|---|---|
| 목적 | AI 개발 결과의 품질과 안전 통제 | 강의 제작 과정의 의도와 품질 통제 |
| 대상 | 코드, 명세, test, eval, agent run | brief, research, design, manuscript, material |
| 사용자 | 개발자와 AI 코딩 에이전트 | 과정 기획자, 저자, 강사와 제작 에이전트 |
| 완료 증거 | 테스트·평가 결과, trace, gate decision | 의도 승인, 출처, 정렬, 리허설 결과 |
| 위치 | 강의의 학습 내용 | 강의를 만드는 운영 방법 |

개발 하니스의 과정 지식 정본은 [`../02-research/wiki/development-harness.md`](../02-research/wiki/development-harness.md)다.

## 작성 규칙

- 첫 언급에서는 `개발 하니스` 또는 `과정 제작 하니스`라고 쓴다.
- 같은 절에 두 개념이 함께 나오면 수식어를 생략하지 않는다.
- `TDD 하니스`는 개발 하니스의 하위 유형으로만 사용한다.
- 과정 제작 규칙과 상태는 `harness/`, 과정 산출물은 `01-planning/`부터 `06-deliveries/`에 둔다.
