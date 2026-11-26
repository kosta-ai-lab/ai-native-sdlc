# 이 단원이 말하려는 것

AI에게 "할 일 생성 함수를 만들어 줘"라고 하면 코드는 금방 나온다. 말로 시켜서 바로 만들어 보는 것은 좋은 출발점이다. 이 단원은 그다음 걸음을 다룬다. 나온 코드가 요구한 대로인지 **무엇으로 판단하는가**.

이 단원의 답은 테스트다. 인수조건으로 테스트를 판정하고, 테스트로 구현을 판정한다. 테스트와 구현은 AI가 쓴다. 그 테스트가 인수조건과 맞는지, 요구하지 않은 것이 구현에 들어갔는지는 사람이 판단한다. AI가 "실패를 확인했다", "통과했다"고 말해도 `pnpm test`의 출력을 직접 본다.

# 개념

**테스트 주도 개발**(TDD)은 테스트를 먼저 쓰고, 그 테스트가 통과하도록 코드를 쓰는 작업 방식이다. Martin Fowler는 세 단계를 반복한다고 설명한다. 다음에 넣을 기능의 테스트를 쓴다. 테스트가 통과할 때까지 기능 코드를 쓴다. 새 코드와 기존 코드를 다듬는다. 이 셋을 흔히 **Red → Green → Refactor**라고 부른다.

Kent Beck은 2023년에 TDD의 정본 절차를 다섯 줄로 다시 적었다(Canon TDD).

1. 다루려는 테스트 시나리오의 목록을 쓴다.
2. 목록에서 **딱 하나**를 골라 실제로 실행할 수 있는 테스트로 만든다.
3. 그 테스트와 이전 테스트가 모두 통과하도록 코드를 고친다. 하다가 떠오른 항목은 목록에 더한다.
4. 필요하면 구현을 다듬는다.
5. 목록이 빌 때까지 2번으로 돌아간다.

이 단원은 이 다섯 줄을 작은 기능 하나에 그대로 적용한다.

## AI와 일할 때 테스트를 먼저 쓰는 이유

Claude Code 공식 문서는 Claude에게 **스스로 돌려 볼 확인 수단**을 주라고 권한다. 확인 수단이 없으면 Claude는 "다 된 것처럼 보일 때" 멈추고, 그러면 사람이 테스트 역할을 떠맡게 된다는 것이다. 같은 문서는 "모든 테스트가 통과했다"는 말만으로는 알 수 있는 것이 적으니 **실행한 명령과 그 출력**을 요구하라고도 적는다.

먼저 써 둔 테스트가 바로 그 확인 수단이다. 테스트는 실행할 때마다 같은 답을 내므로, 같은 요청에도 매번 다른 코드를 내는 AI의 결과를 같은 기준으로 판정할 수 있다.

## 유효한 Red

Red는 "테스트 명령이 실패했다"는 뜻이 아니다. **원하는 동작이 아직 없어서, 단언(assertion)이 예상한 이유로 실패한 상태**다. Superpowers의 TDD 스킬은 실패를 본 뒤 세 가지를 확인하라고 적는다.

| 확인할 것 | 아니라면 |
|---|---|
| 오류가 아니라 **테스트가 실패**했는가 | 오류부터 고치고, 제대로 실패할 때까지 다시 실행한다 |
| 실패 메시지가 **예상한 내용**인가 | 테스트가 다른 것을 보고 있다. 테스트를 고친다 |
| 오타가 아니라 **기능이 없어서** 실패했는가 | 오타를 고친다 |

'아니라면' 열의 첫 줄은 원문의 지시이고, 나머지 두 줄은 이 단원에서 덧붙인 대응이다.

테스트가 처음부터 통과하면 이미 있는 동작을 시험하고 있는 것이다. 이 단원의 3~4단계에서 "오류"와 "유효한 Red"의 차이를 직접 본다.

## 이 단원의 실습

| 항목 | 값 |
|---|---|
| 출발점 | 이 단원의 [todo-app/](todo-app/) 폴더 (인수조건만 있고 테스트와 구현은 없다) |
| 작업 폴더 | `~/work/tdd/todo-app` |
| 과제 | 인수조건 두 개(제목이 있는 할 일 생성, 빈 제목 거부)를 TDD로 구현한다 |
| 도구 | TypeScript, Vitest, pnpm, Claude Code |

> 검증 환경(2026-11-24): macOS, Node.js v24.22.0, pnpm 12.21.0, Vitest 3.2.6, TypeScript 5.9.3, Claude Code 2.1.330(모델 Sonnet 5.5).
> 이 문서의 명령은 이 환경에서 직접 실행했고, 예상 출력은 그 결과에서 핵심 줄만 옮겼다. 실제 출력에는 실행 경로, 코드 위치, 실행 시간 같은 줄이 더 나온다. 프롬프트 여섯 개는 Claude Code에서 한 세션으로 차례로 실행해 확인했다. AI가 쓰는 테스트 이름과 코드, 설명 문장은 실행할 때마다 달라질 수 있다. 그래서 단계마다 **`pnpm test` 출력으로 확인할 것**을 적었다.

**출처와 재사용 범위:** 이 단원의 출발점 코드, 프롬프트, 설명은 이 저장소에서 새로 썼다. 개념 설명은 문서 끝의 참고 자료를 요약한 것이며 원문을 옮겨 적지 않았다.


---

# 0 단계: 준비 확인하기

## 확인

- **Node.js 20.19 이상**(22 계열은 22.12 이상)과 **pnpm**이 필요하다. 이 실습이 쓰는 Vite 7의 요구 조건이다. `node --version`, `pnpm --version`으로 확인한다. pnpm이 없으면 `npm install -g pnpm`으로 설치한다.
- **git**이 필요하다. `git --version`으로 확인한다.
- **Claude Code**가 설치되어 있고 로그인되어 있어야 한다. `claude --version`으로 확인한다.

## 산출물

- Node.js, pnpm, git, Claude Code가 준비된 환경.

## 체크리스트
- [ ] `node --version`이 v20.19 이상(또는 v22.12 이상)을 출력한다.
- [ ] `pnpm --version`, `git --version`, `claude --version`이 버전을 출력한다.

---

# 1 단계: 실습 폴더 준비하고 기준 상태 확인하기

> 이 단원에서 테스트와 구현을 판정하는 기준은 출발점 폴더에 들어 있는 인수조건이다.

## 직접 하기

- 강의 자료 저장소를 받은 뒤, 출발점 폴더를 **저장소 밖으로 복사**한다. 저장소 안에서 실습하면 강의 자료가 바뀐다. 아래 명령은 강의 자료 저장소의 루트 폴더에서 실행한다.
  ```bash
  mkdir -p ~/work/tdd
  cp -R modules/06-coding-tdd/M01-red-green-refactor/todo-app ~/work/tdd/todo-app
  cd ~/work/tdd/todo-app
  ```
- 의존성을 설치하고 git 저장소로 만든다.
  ```bash
  pnpm install --frozen-lockfile --ignore-scripts
  git init
  git add -A && git commit -m "chore: 실습 출발점"
  ```
  설치가 끝나면 `typescript`와 `vitest`가 devDependencies로 표시된다. git 사용자 정보가 없다는 오류가 나면 이 저장소에만 설정한다(`git config user.name "홍길동"`, `git config user.email "gildong@example.com"`).

## 확인

- **기준 상태를 확인한다.** 아직 테스트 파일이 없으므로 다음과 같이 나온다.
  ```bash
  pnpm test
  ```
  ```
  No test files found, exiting with code 1
  ```
- 인수조건 파일 `docs/05-acceptance.feature`를 읽는다. 시나리오는 두 개다.
  ```gherkin
  시나리오: 제목이 있는 할 일을 만든다
    조건 제목이 "보고서 작성"이다
    만일 할 일을 생성하면
    그러면 제목이 "보고서 작성"이고 상태가 "할 일"인 항목이 만들어진다

  시나리오: 빈 제목은 거부한다
    조건 제목이 비어 있다
    만일 할 일을 생성하면
    그러면 "제목은 필수" 오류가 발생한다
  ```
  이 파일은 사람이 읽는 기준이다. 이 단원에서는 Cucumber로 실행하지 않고 Vitest 테스트로 옮긴다.

## 판단

- 이 단원에서 만들 것은 이 두 시나리오까지다.

## 산출물

- `~/work/tdd/todo-app` (git 저장소, 커밋 1개).
- "No test files found"라는 기준 상태.
- 2단계의 기준이 되는 인수조건 두 개.

## 체크리스트
- [ ] `pnpm install --frozen-lockfile --ignore-scripts`가 오류 없이 끝났다.
- [ ] `pnpm test`가 `No test files found`를 출력한다.
- [ ] 인수조건 두 개를 읽었다.

---

# 2 단계: 인수조건에서 테스트 목록 만들기

## 요청

- 작업 폴더에서 Claude Code를 시작한다.
  ```bash
  claude
  ```
- 코드를 쓰기 전에 **테스트 목록부터** 만든다(Canon TDD 1번). 다음 프롬프트를 입력한다.
  ```
  docs/05-acceptance.feature를 읽고 테스트 목록을 docs/test-list.md에 적어줘. 시나리오마다 한 줄씩 쓰고, 아직 테스트 코드나 구현 코드는 쓰지 마.
  ```
- 검증 실행에서는 다음 두 줄이 만들어졌다.
  ```markdown
  - [ ] 제목이 "보고서 작성"이면 제목이 "보고서 작성"이고 상태가 "할 일"인 항목이 만들어진다
  - [ ] 제목이 비어 있으면 "제목은 필수" 오류가 발생한다
  ```

## 확인

- `docs/test-list.md`를 열어 항목을 읽는다.
- `git status`로 `test/`, `src/` 폴더가 아직 없는지 본다.

## 판단

- **목록에 인수조건에 없는 항목이 들어갔는지 본다.** 공백만 있는 제목, 아주 긴 제목 같은 경계 사례는 인수조건에 없다. 필요하다고 생각되면 코드에 넣지 말고 인수조건을 정하는 사람에게 묻는다.
- 항목이 인수조건의 시나리오와 하나씩 맞으면 이 목록을 받아들인다.

## 산출물

- `docs/test-list.md` (항목 2개). 3단계부터는 이 목록에서 한 줄씩 꺼내 테스트로 옮긴다.

## 체크리스트
- [ ] `docs/test-list.md`에 인수조건의 시나리오 수만큼 항목이 있다.
- [ ] `test/`, `src/` 폴더가 아직 없다(`git status`로 확인한다).

---

# 3 단계: 첫 테스트를 쓰고 실패 확인하기

## 요청

- 목록에서 **하나만** 테스트로 옮긴다(Canon TDD 2번). 다음 프롬프트를 입력한다.
  ```
  테스트 목록의 첫 번째 항목만 Vitest 테스트로 옮겨 test/todo.test.ts에 작성해줘. src/ 아래 구현 파일은 만들지 마. 그다음 pnpm test를 실행하고, 실패한 이유가 단언 실패인지 파일을 불러오지 못한 오류인지 구분해서 알려줘.
  ```
- 만들어진 테스트는 다음과 비슷하다. 테스트 이름은 다를 수 있다.
  ```typescript
  import { describe, it, expect } from "vitest";
  import { createTodo } from "../src/todo";

  describe("할 일 생성", () => {
    it("제목이 있으면 '할 일' 상태로 생성된다", () => {
      const todo = createTodo({ title: "보고서 작성" });
      expect(todo.title).toBe("보고서 작성");
      expect(todo.status).toBe("할 일");
    });
  });
  ```

## 확인

- `pnpm test`를 직접 실행해 출력을 본다.
  ```
  FAIL  test/todo.test.ts [ test/todo.test.ts ]
  Error: Cannot find module '../src/todo' imported from '…/test/todo.test.ts'

   Test Files  1 failed (1)
        Tests  no tests
  ```

## 판단

- **이것은 아직 유효한 Red가 아니다.** `Tests  no tests`는 테스트가 한 건도 실행되지 않았다는 뜻이다. 구현 파일을 불러오지 못해 멈춘 **오류**이고, `expect`는 한 번도 실행되지 않았다. 검증 실행에서 Claude도 "파일을 불러오지 못한 오류이고 단언 실패는 아니다"라고 답했다.
- 이 단계에서 얻은 것은 하나다. 테스트가 **구현의 겉모습**을 먼저 정했다. 함수 이름은 `createTodo`, 입력은 `{ title }`, 돌려주는 값에는 `title`과 `status`가 있다.
- 테스트가 인수조건의 값("보고서 작성", "할 일")을 그대로 쓰는지 본다. 다르면 Claude에게 인수조건에 맞게 고치게 한다.

## 산출물

- `test/todo.test.ts` (테스트 1개).
- `Cannot find module` 오류 출력.

## 체크리스트
- [ ] 테스트가 인수조건의 값("보고서 작성", "할 일")을 그대로 쓴다.
- [ ] `src/` 폴더가 아직 없다.
- [ ] `pnpm test` 출력에서 `Tests  no tests`를 확인했다.

---

# 4 단계: 뼈대를 만들어 유효한 Red 만들기

## 요청

- 테스트가 단언까지 가도록 **뼈대만** 만든다. 동작은 넣지 않는다.
  ```
  테스트가 단언에서 실패하도록 src/todo.ts에 뼈대만 만들어줘. createTodo의 동작은 아직 구현하지 마. 다시 pnpm test를 실행해서 실패 메시지를 그대로 보여줘.
  ```
- 뼈대는 다음과 비슷하다. 함수는 있지만 아무 일도 하지 않는다.
  ```typescript
  export type Todo = {
    title: string;
    status: "할 일" | "진행" | "완료";
  };

  export function createTodo(input: { title: string }): Todo {
    return {} as Todo; // 뼈대: 아직 구현하지 않았다
  }
  ```
  검증 실행에서 Claude는 빈 문자열을 돌려주는 뼈대(`{ title: "", status: "" }`)를 만들었다. 어느 쪽이든 된다. 이 뼈대라면 실패 메시지는 `expected '' to be '보고서 작성'`이다.

## 확인

- `pnpm test`를 실행한다.
  ```
   ❯ test/todo.test.ts (1 test | 1 failed)
     × 할 일 생성 > 제목이 있으면 '할 일' 상태로 생성된다
       → expected undefined to be '보고서 작성' // Object.is equality

  AssertionError: expected undefined to be '보고서 작성' // Object.is equality

   Test Files  1 failed (1)
        Tests  1 failed (1)
  ```

## 판단

- **이것이 유효한 Red다.** 개념 절의 세 가지를 확인한다.
  - 오류가 아니라 테스트가 실패했다: `Tests  1 failed (1)`, `AssertionError`.
  - 메시지가 예상한 내용이다: 제목이 "보고서 작성"이어야 하는데 값이 없다.
  - 기능이 없어서 실패했다: `createTodo`가 아직 제목을 넣지 않는다.

## 산출물

- 유효한 Red를 확인했으면 **테스트 파일을 스테이징해 둔다.** 다음 단계에서 테스트가 바뀌었는지 확인하는 기준이 된다.
  ```bash
  git add test
  ```
- `src/todo.ts` (뼈대).
- `AssertionError`로 실패한 출력.

## 체크리스트
- [ ] `pnpm test` 출력에 `AssertionError`가 있다.
- [ ] `Tests  1 failed (1)`이다. `no tests`가 아니다.
- [ ] 실패 메시지가 인수조건의 값("보고서 작성")을 말하고 있다.
- [ ] `git add test`로 테스트 파일을 스테이징했다.

---

# 5 단계: 최소 구현으로 통과시키기

## 요청

- 방금 실패한 테스트를 통과하는 **최소 코드만** 쓴다(Canon TDD 3번).
  ```
  방금 실패한 테스트를 통과하는 최소 구현만 작성해줘. 인수조건에 없는 기능은 넣지 마. pnpm test 결과를 그대로 보여줘.
  ```
- 구현은 다음과 비슷하다.
  ```typescript
  export function createTodo(input: { title: string }): Todo {
    return { title: input.title, status: "할 일" };
  }
  ```

## 확인

- `pnpm test`를 실행한다.
  ```
   ✓ test/todo.test.ts (1 test)

   Test Files  1 passed (1)
        Tests  1 passed (1)
  ```
- 커밋하기 전에 `git diff -- test`를 실행한다. 아무것도 나오지 않아야 한다. 테스트 파일이 4단계에서 스테이징한 그대로라는 뜻이다.

## 판단

- **빈 제목 검사가 들어갔는지 본다.** 들어갔다면 지운다. 빈 제목은 목록의 두 번째 항목이고, 아직 그 테스트가 없다. 검증 실행에서 Claude는 "빈 제목 검증은 두 번째 시나리오의 몫이라 넣지 않았다"고 답했다.
- 테스트가 통과했고 테스트 파일이 그대로면 이 구현을 받아들인다.

## 산출물

- 통과했으면 커밋한다.
  ```bash
  git add -A && git commit -m "feat: 제목이 있는 할 일을 만든다"
  ```
- 테스트 1개가 통과하는 `src/todo.ts`.
- 커밋 1개.

## 체크리스트
- [ ] `Tests  1 passed (1)`이다.
- [ ] `src/todo.ts`에 빈 제목 검사, 길이 제한, ID 생성 같은 인수조건 밖의 코드가 없다.
- [ ] 커밋하기 전에 `git diff -- test`가 아무것도 출력하지 않았다. 테스트 파일이 4단계에서 스테이징한 그대로라는 뜻이다.

---

# 6 단계: 두 번째 항목 반복하기

## 요청

- 목록의 다음 항목으로 같은 순서를 반복한다(Canon TDD 5번).
  ```
  테스트 목록의 두 번째 항목을 같은 순서로 진행해줘. 테스트 추가, 실패 확인, 최소 구현, 통과 확인 순서이고, 단계마다 pnpm test 출력을 보여줘. 테스트는 고치지 말고 구현만 고쳐.
  ```
- 추가되는 테스트는 다음과 비슷하다.
  ```typescript
  it("빈 제목은 거부한다", () => {
    expect(() => createTodo({ title: "" })).toThrow("제목은 필수");
  });
  ```

## 확인

- **Red를 먼저 확인한다.** 구현을 고치기 전의 출력은 다음과 같아야 한다.
  ```
   ❯ test/todo.test.ts (2 tests | 1 failed)
     ✓ 할 일 생성 > 제목이 있으면 '할 일' 상태로 생성된다
     × 할 일 생성 > 빈 제목은 거부한다
       → expected [Function] to throw an error

        Tests  1 failed | 1 passed (2)
  ```
  이번에는 뼈대가 이미 있으므로 바로 유효한 Red가 나온다. 앞의 테스트는 계속 통과한다.
- 구현에 검사 한 줄이 들어가면 두 테스트가 모두 통과한다.
  ```typescript
  if (!input.title) throw new Error("제목은 필수");
  ```
  ```
   ✓ test/todo.test.ts (2 tests)

        Tests  2 passed (2)
  ```

## 판단

- Claude가 Red 출력을 보여 주지 않고 통과 결과만 보여 줬다면, Red를 확인했다고 볼 수 없다. 구현의 검사 줄을 잠깐 지우고 `pnpm test`를 실행해 새 테스트가 실패하는지 직접 본 뒤 되돌린다.
- Red와 Green을 모두 출력으로 봤으면 이 구현을 받아들인다.

## 산출물

- 통과했으면 커밋한다.
  ```bash
  git add -A && git commit -m "feat: 빈 제목은 거부한다"
  ```
- 테스트 2개가 통과하는 코드.
- 커밋 1개.

## 체크리스트
- [ ] 구현을 고치기 전에 `1 failed | 1 passed`를 봤다.
- [ ] 실패 메시지가 `expected [Function] to throw an error`였다.
- [ ] 구현을 고친 뒤 `Tests  2 passed (2)`이다.

---

# 7 단계: 다듬기

## 요청

- 테스트가 통과하는 상태에서 구조를 다듬는다(Canon TDD 4번). **동작은 바꾸지 않는다.**
  ```
  테스트가 통과하는 상태를 유지하면서 src/todo.ts를 읽기 좋게 다듬어줘. 동작은 바꾸지 마. 끝나면 pnpm test와 pnpm typecheck 결과를 보여줘. 다듬을 곳이 없으면 없다고 말해줘.
  ```
- 다듬는 동안 **테스트 파일은 건드리지 않는다.**

## 확인

- 테스트와 타입 검사를 실행한다. 타입 검사는 성공하면 `$ tsc --noEmit` 한 줄만 나온다.
  ```bash
  pnpm test && pnpm typecheck
  ```
  ```
        Tests  2 passed (2)
  ```
- `git diff -- test`를 실행한다. 아무것도 나오지 않아야 한다. 테스트 파일이 바뀌지 않았다는 뜻이다.

## 판단

- 테스트가 깨지면 다듬기를 되돌린다.
- 이만큼 작은 코드에서는 **다듬을 곳이 없을 수 있다.** 검증 실행에서 Claude는 "다듬을 곳이 없어서 고치지 않았다"고 답했다. 그것도 올바른 결과다.

## 더 해 보기 (선택)

- 직접 다듬어 보려면 상태 타입과 초기 상태에 이름을 붙인다.
  ```typescript
  export type TodoStatus = "할 일" | "진행" | "완료";

  export type Todo = {
    title: string;
    status: TodoStatus;
  };

  const INITIAL_STATUS: TodoStatus = "할 일";

  export function createTodo(input: { title: string }): Todo {
    if (!input.title) throw new Error("제목은 필수");
    return { title: input.title, status: INITIAL_STATUS };
  }
  ```
  다듬은 뒤에는 `pnpm test && pnpm typecheck`를 다시 실행한다.

## 산출물

- 고친 것이 있으면 커밋한다.
  ```bash
  git add -A && git commit -m "refactor: 상태 타입과 초기 상태에 이름을 붙인다"
  ```
- 다듬은 `src/todo.ts` 또는 "다듬을 곳 없음"이라는 판단.

## 체크리스트
- [ ] 다듬은 뒤에도 `Tests  2 passed (2)`이다.
- [ ] `pnpm typecheck`가 오류 없이 끝났다.
- [ ] 테스트 파일은 바뀌지 않았다.

---

# 8 단계: 목록을 닫고 기록 확인하기

## 확인

- 커밋 기록에 순서가 남았는지 본다.
  ```bash
  git log --oneline
  ```
  ```
  b8b044c refactor: 상태 타입과 초기 상태에 이름을 붙인다
  92e5eaf feat: 빈 제목은 거부한다
  9ae257d feat: 제목이 있는 할 일을 만든다
  812d447 chore: 실습 출발점
  ```
  커밋 해시는 사람마다 다르다.
- 인수조건, 테스트, 구현이 이어지는지 표로 확인한다.

  | 인수조건 | 테스트 | 구현 |
  |---|---|---|
  | 제목이 있는 할 일을 만든다 | 제목이 있으면 '할 일' 상태로 생성된다 | `return { title, status }` |
  | 빈 제목은 거부한다 | 빈 제목은 거부한다 | `if (!input.title) throw …` |

## 판단

- 목록에 남은 항목이 없으므로 이 기능은 끝났다고 판단한다. `docs/test-list.md`의 두 항목을 `[x]`로 바꾼다.

## 산출물

- 바꾼 목록을 커밋한다.
  ```bash
  git add -A && git commit -m "docs: 테스트 목록을 닫는다"
  ```
- 항목이 모두 닫힌 테스트 목록.
- 테스트와 구현이 인수조건과 하나씩 이어진 저장소.

## 체크리스트
- [ ] `docs/test-list.md`의 항목이 모두 `[x]`다.
- [ ] 인수조건 하나에 테스트 하나가 대응한다.
- [ ] 인수조건에 없는 테스트나 기능이 없다.

---

# 자주 막히는 곳

| 증상 | 원인과 해결 |
|---|---|
| `pnpm test`가 `No test files found`만 낸다 | 테스트 파일 이름이 `*.test.ts`가 아니다. `test/todo.test.ts`인지 확인한다 |
| 4단계에서도 `Cannot find module`이 나온다 | 테스트의 import 경로와 구현 파일 위치가 다르다. `../src/todo`와 `src/todo.ts`를 맞춘다 |
| 테스트를 쓰자마자 통과한다 | 이미 있는 동작을 시험하고 있다. 테스트가 인수조건의 값을 실제로 단언하는지 본다 |
| Claude가 테스트와 구현을 한꺼번에 썼다 | Red를 확인하지 못했다. 구현을 지우거나 되돌리고 4단계부터 다시 한다. 첫 항목에서는 `src/`가 아직 커밋되지 않았으므로 `rm -r src`로 지우고, 6단계에서는 `git checkout -- src`로 되돌린다. 단원 M02에서 이 순서를 규칙으로 고정한다 |
| Claude가 실패한 테스트를 고쳐서 통과시켰다 | 테스트를 되돌린다(`git checkout -- test`). 고칠 것은 구현이다 |

# 참고 자료

- Kent Beck, "Canon TDD", 2023-12-11. https://newsletter.kentbeck.com/p/canon-tdd
- Martin Fowler, "Test Driven Development", 2005-03-05 작성, 2023-12-11 개정. https://martinfowler.com/bliki/TestDrivenDevelopment.html
- Kent Beck, *Test-Driven Development: By Example*, Addison-Wesley, 2002.
- Anthropic, Claude Code 문서, "Best practices for Claude Code"의 "Give Claude a check to run" 절. https://code.claude.com/docs/en/best-practices
- obra/superpowers, `skills/test-driven-development/SKILL.md`의 "Verify RED" 절 (커밋 `d884ae0`, MIT). https://github.com/obra/superpowers/blob/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/test-driven-development/SKILL.md
- Vitest 안내서. https://vitest.dev/guide/
- Gherkin의 한국어 키워드(기능, 시나리오, 조건, 만일, 그러면): cucumber/gherkin 저장소의 `gherkin-languages.json`. https://github.com/cucumber/gherkin/blob/main/gherkin-languages.json
