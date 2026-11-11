import { test } from "node:test";
import assert from "node:assert/strict";
import { addTodo, completeTodo, formatTodos } from "../src/todo.js";

test("addTodo는 1부터 번호를 매긴다", () => {
  const todos = addTodo(addTodo([], "우유 사기"), "책 읽기");
  assert.deepEqual(
    todos.map((todo) => todo.id),
    [1, 2],
  );
});

test("addTodo는 빈 제목을 거부한다", () => {
  assert.throws(() => addTodo([], "   "));
});

test("addTodo는 형식이 틀린 마감일을 거부한다", () => {
  assert.throws(() => addTodo([], "분리수거", "11월 16일"));
});

test("completeTodo는 해당 항목만 완료로 바꾼다", () => {
  const todos = completeTodo(addTodo(addTodo([], "a"), "b"), 2);
  assert.deepEqual(
    todos.map((todo) => todo.done),
    [false, true],
  );
});

test("formatTodos는 완료 여부와 마감일을 보여준다", () => {
  const todos = completeTodo(addTodo([], "분리수거", "2026-11-16"), 1);
  assert.equal(formatTodos(todos), "[x] 1. 분리수거 (마감 2026-11-16)");
});
