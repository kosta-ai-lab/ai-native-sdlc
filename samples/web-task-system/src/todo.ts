// 06 최소 구현 — 05 인수 조건을 통과하는 최소 코드.
// 04 명세(docs/04-spec.md)에 없는 필드·동작은 추가하지 않는다(환각 방지).

export type Todo = {
  title: string;
  status: "할 일" | "진행" | "완료";
};

export function createTodo(input: { title: string }): Todo {
  if (!input.title) throw new Error("제목은 필수"); // R-03
  return { title: input.title, status: "할 일" }; // R-01, R-02
}
