# K-VALID-RED — 유효한 Red는 실패가 아니라 진단이다

## 사용하는 Evidence

- `SRC-SUPERPOWERS-TDD`
- `CLM-SUPERPOWERS-RED-001`
- `CLM-SUPERPOWERS-RED-002`
- `CLM-SUPERPOWERS-RED-003`

## 지식 유형

- 원리
- 판정 절차
- 오개념 교정

## 핵심 명제

TDD의 Red는 테스트 명령이 실패한 상태가 아니다. 아직 원하는 행동이 없기 때문에 테스트의 관찰 가능한 assertion이 예상한 방식으로 실패한 상태다.

## 정보에서 지식으로의 변환

공식 지침에는 assertion failure, 예상 메시지와 기능 부재를 확인하라는 개별 정보가 있다. 이를 함께 보면 Red 판정에는 최소 세 층이 있다는 판단 모델을 만들 수 있다.

```text
실행 가능성: 테스트가 대상 코드까지 도달했는가
관찰 타당성: assertion이 원하는 행동을 관찰하는가
원인 일치: 행동 부재 때문에 예상한 방식으로 실패했는가
```

세 조건 중 하나라도 충족되지 않으면 구현을 시작할 근거가 부족하다.

## 판정 절차

1. 테스트 명령과 exit code를 확인한다.
2. import, syntax, fixture와 환경 오류를 먼저 제외한다.
3. 실패한 assertion이 acceptance behavior를 관찰하는지 확인한다.
4. 실제 메시지가 사전에 예상한 실패 이유와 일치하는지 확인한다.
5. 테스트가 처음부터 통과하면 기존 행동 또는 약한 assertion을 조사한다.
6. 위 조건을 충족한 실행만 Red evidence로 보존한다.

## 적용되는 상황

- 신규 기능의 첫 테스트
- 버그를 재현하는 regression test
- AI 에이전트가 생성한 테스트의 타당성 검토
- test-first 완료 게이트의 Evidence 판정

## 적용하면 안 되는 방식

- 컴파일 실패를 원하는 Red로 기록한다.
- 테스트 파일이 존재한다는 사실만으로 Red를 인정한다.
- 처음부터 통과한 테스트를 test-first 증거로 사용한다.
- 예상 실패 이유를 실행 후에 결과에 맞춰 작성한다.

## 경계와 한계

올바른 Red는 테스트가 요구한 행동을 반드시 완전하게 검증한다는 뜻은 아니다. assertion이 일부 결과만 보거나 중요한 부작용을 빠뜨릴 수 있다. Red 판정 뒤에도 요구–테스트 추적과 테스트 품질 검토가 필요하다.

## 의사결정에 미치는 영향

하니스는 `test command exited non-zero`만 검사해서는 안 된다. 실행 오류와 예상 assertion failure를 구분하고, acceptance criterion과 예상 실패 이유를 함께 저장해야 한다.
