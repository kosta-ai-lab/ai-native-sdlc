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
