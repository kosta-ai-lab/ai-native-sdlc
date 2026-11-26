import { describe, it, expect } from "vitest";
import { createTodo } from "../src/todo";

describe("할 일 생성", () => {
  // 시나리오: 제목이 있는 할 일을 만든다
  it("제목이 있으면 '할 일' 상태로 생성된다", () => {
    const todo = createTodo({ title: "보고서 작성" });
    expect(todo.title).toBe("보고서 작성");
    expect(todo.status).toBe("할 일");
  });

  // 시나리오: 빈 제목은 거부한다
  it("빈 제목은 거부한다", () => {
    expect(() => createTodo({ title: "" })).toThrow("제목은 필수");
  });

  // 시나리오: 제목 앞뒤 공백은 제거한다
  it("제목 앞뒤 공백은 제거한다", () => {
    const todo = createTodo({ title: "  보고서 작성  " });
    expect(todo.title).toBe("보고서 작성");
  });

  // 시나리오: 공백만 있는 제목은 거부한다
  it("공백만 있는 제목은 거부한다", () => {
    expect(() => createTodo({ title: "   " })).toThrow("제목은 필수");
  });
});
