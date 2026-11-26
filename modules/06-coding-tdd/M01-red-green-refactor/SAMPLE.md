# 예제 실행 및 프롬프트

[GUIDE.md](GUIDE.md)의 흐름에서 명령과 프롬프트만 모은 실행용 요약이다. 설명, 예상 출력, 체크리스트는 GUIDE.md에 있다.

## 1단계: 실습 폴더 준비

강의 자료 저장소의 루트 폴더에서 실행한다.

```bash
mkdir -p ~/work/tdd
cp -R modules/06-coding-tdd/M01-red-green-refactor/todo-app ~/work/tdd/todo-app
cd ~/work/tdd/todo-app
pnpm install --frozen-lockfile --ignore-scripts
git init
git add -A && git commit -m "chore: 실습 출발점"
pnpm test          # No test files found, exiting with code 1
claude
```

## 2단계: 테스트 목록

```
docs/05-acceptance.feature를 읽고 테스트 목록을 docs/test-list.md에 적어줘. 시나리오마다 한 줄씩 쓰고, 아직 테스트 코드나 구현 코드는 쓰지 마.
```

확인: `docs/test-list.md`에 항목이 2개 있고, `test/`와 `src/`는 아직 없다.

## 3단계: 첫 테스트

```
테스트 목록의 첫 번째 항목만 Vitest 테스트로 옮겨 test/todo.test.ts에 작성해줘. src/ 아래 구현 파일은 만들지 마. 그다음 pnpm test를 실행하고, 실패한 이유가 단언 실패인지 파일을 불러오지 못한 오류인지 구분해서 알려줘.
```

확인: `pnpm test` 출력에 `Cannot find module`과 `Tests  no tests`가 있다. 아직 유효한 Red가 아니다.

## 4단계: 유효한 Red

```
테스트가 단언에서 실패하도록 src/todo.ts에 뼈대만 만들어줘. createTodo의 동작은 아직 구현하지 마. 다시 pnpm test를 실행해서 실패 메시지를 그대로 보여줘.
```

확인: `AssertionError`와 `Tests  1 failed (1)`이 나온다.

```bash
git add test
```

## 5단계: Green

```
방금 실패한 테스트를 통과하는 최소 구현만 작성해줘. 인수조건에 없는 기능은 넣지 마. pnpm test 결과를 그대로 보여줘.
```

확인: `Tests  1 passed (1)`. `git diff -- test`가 아무것도 출력하지 않는다.

```bash
git add -A && git commit -m "feat: 제목이 있는 할 일을 만든다"
```

## 6단계: 두 번째 항목

```
테스트 목록의 두 번째 항목을 같은 순서로 진행해줘. 테스트 추가, 실패 확인, 최소 구현, 통과 확인 순서이고, 단계마다 pnpm test 출력을 보여줘. 테스트는 고치지 말고 구현만 고쳐.
```

확인: 구현 전에 `1 failed | 1 passed`, 구현 뒤에 `Tests  2 passed (2)`.

```bash
git add -A && git commit -m "feat: 빈 제목은 거부한다"
```

## 7단계: 다듬기

```
테스트가 통과하는 상태를 유지하면서 src/todo.ts를 읽기 좋게 다듬어줘. 동작은 바꾸지 마. 끝나면 pnpm test와 pnpm typecheck 결과를 보여줘. 다듬을 곳이 없으면 없다고 말해줘.
```

확인: `Tests  2 passed (2)`, `pnpm typecheck`는 오류 없이 끝난다.

```bash
git add -A && git commit -m "refactor: 상태 타입과 초기 상태에 이름을 붙인다"   # 고친 것이 있을 때만
```

## 8단계: 기록 확인

```bash
git log --oneline
```

`docs/test-list.md`의 두 항목을 `[x]`로 바꾸고 커밋한다.

```bash
git add -A && git commit -m "docs: 테스트 목록을 닫는다"
```
