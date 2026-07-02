// 06 TDD — 05 인수 조건(docs/05-acceptance.feature)을 테스트로 1:1 변환한다.
// 구현(src/todo.ts)이 없는 상태에서 먼저 실행해 실패(Red)를 확인한다.
import { describe, it, expect } from "vitest";
import { createTodo } from "../src/todo";

describe("할 일 생성", () => {
  // 시나리오 1: 제목이 있는 할 일을 만든다
  it("제목이 있으면 '할 일' 상태로 생성된다", () => {
    const todo = createTodo({ title: "보고서 작성" });
    expect(todo.title).toBe("보고서 작성");
    expect(todo.status).toBe("할 일");
  });

  // 시나리오 2: 빈 제목은 거부한다
  it("빈 제목은 거부한다", () => {
    expect(() => createTodo({ title: "" })).toThrow("제목은 필수");
  });
});
