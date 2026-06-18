# 샘플 — TDD로 "할 일 생성" 기능 만들기

> 사내 업무 관리 시스템(레퍼런스 앱)의 한 기능을 TDD로 만드는 최소 예시. 스택: TypeScript · Vitest.

## 1. 입력 — 인수 조건 (모듈 05 산출물)

```gherkin
기능: 할 일 생성
  시나리오: 제목이 있는 할 일을 만든다
    조건 제목이 "보고서 작성"이고
    실행 할 일을 생성하면
    결과 상태가 "할 일"인 항목이 만들어진다

  시나리오: 빈 제목은 거부한다
    조건 제목이 비어 있고
    실행 할 일을 생성하면
    결과 "제목은 필수" 오류가 발생한다
```

## 2. 테스트 먼저 (Red)

```typescript
// todo.test.ts
import { describe, it, expect } from "vitest";
import { createTodo } from "./todo";

describe("할 일 생성", () => {
  it("제목이 있으면 '할 일' 상태로 생성된다", () => {
    const todo = createTodo({ title: "보고서 작성" });
    expect(todo.title).toBe("보고서 작성");
    expect(todo.status).toBe("할 일");
  });

  it("빈 제목은 거부한다", () => {
    expect(() => createTodo({ title: "" })).toThrow("제목은 필수");
  });
});
```

이 시점에 `todo.ts`가 없으므로 테스트는 **실패한다(Red)**. 먼저 이것을 확인한다.

## 3. 최소 구현 (Green)

```typescript
// todo.ts
export type Todo = { title: string; status: "할 일" | "진행" | "완료" };

export function createTodo(input: { title: string }): Todo {
  if (!input.title) throw new Error("제목은 필수");
  return { title: input.title, status: "할 일" };
}
```

이제 테스트가 **통과한다(Green)**. 인수 조건에 없는 필드·동작은 추가하지 않았다.

## 4. 재현 프롬프트

```
docs/acceptance/todo-create.feature 의 인수 조건을 Vitest 테스트로 1:1 변환해 todo.test.ts 에 작성하라.
구현 파일은 만들지 말고, 테스트를 실행해 실패하는 것을 먼저 보여라.
그다음 그 테스트를 통과하는 최소 구현만 todo.ts 에 작성하라.
인수 조건에 없는 기능은 추가하지 마라.
```

## 핵심

- 테스트가 기대 동작을 **결정적으로 고정**하므로, 에이전트 구현이 그쪽으로 수렴한다.
- "인수 조건에 없는 기능 추가 금지"가 환각을 막는다.
