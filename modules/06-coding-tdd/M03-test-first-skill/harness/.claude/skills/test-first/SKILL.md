---
name: test-first
description: 인수조건 파일의 시나리오를 한 번에 하나씩, 테스트를 먼저 쓰는 순서로 구현한다.
argument-hint: [인수조건 파일 경로]
disable-model-invocation: true
allowed-tools: Bash(pnpm test *) Bash(pnpm typecheck *) Bash(git status *) Bash(git diff *)
---

# test-first

인수조건 파일 `$ARGUMENTS`의 시나리오를 한 번에 하나씩 구현한다. 아래 순서를 건너뛰지 않는다.

## 준비

1. `$ARGUMENTS`를 읽는다. 파일이 없으면 멈추고 경로를 묻는다.
2. `docs/test-list.md`가 없으면 시나리오마다 한 줄씩 `- [ ]` 항목으로 만든다. 이미 테스트가 있는 시나리오는 `[x]`로 적는다. 인수조건에 없는 항목은 넣지 않는다.

## 항목마다 반복

`[ ]`인 첫 항목 **하나만** 골라 다음을 한다. 한 항목이 끝나기 전에는 다음 항목의 테스트를 쓰지 않는다.

1. **테스트 하나 추가.** 그 항목의 테스트 하나만 test/ 아래에 쓴다. 인수조건의 값을 그대로 쓴다. 구현 파일은 건드리지 않는다.
2. **Red 확인.** `pnpm test`를 실행한다.
   - 파일을 불러오지 못한 오류면 implementer 서브에이전트에게 "동작 없는 뼈대만" 만들게 한 뒤 다시 실행한다.
   - 새 테스트가 처음부터 통과하면 구현하지 않는다. 이미 있는 동작이라는 뜻이다. 그 사실을 기록하고 5번으로 간다.
   - 단언 실패이고 메시지가 인수조건의 값을 말하면 유효한 Red다.
3. **구현은 implementer에게 맡긴다.** implementer 서브에이전트에게 실패한 테스트의 이름과 실패 메시지를 주고 "이 테스트를 통과하는 최소 구현"을 요청한다. 직접 구현하지 않는다.
4. **Green 확인.** `pnpm test`를 직접 실행해 모든 테스트가 통과하는지 본다. implementer가 테스트가 잘못됐다고 보고하면 테스트를 고치지 말고 멈춰서 사용자에게 묻는다.
5. **기록.** `docs/tdd-log.md`에 항목 이름, Red의 실패 메시지 한 줄, Green의 결과 줄(`Tests …`)을 덧붙이고, `docs/test-list.md`의 항목을 `[x]`로 바꾼다.

## 끝

모든 항목이 `[x]`가 되면 `pnpm test`와 `pnpm typecheck`를 실행하고, 항목별 Red와 Green을 한 줄씩 보고한다. 커밋은 하지 않는다.
