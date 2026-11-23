export type TodoStatus = "할 일" | "진행" | "완료";

export type Todo = {
  title: string;
  status: TodoStatus;
};

const INITIAL_STATUS: TodoStatus = "할 일";

export function createTodo(input: { title: string }): Todo {
  const title = input.title.trim();
  if (!title) throw new Error("제목은 필수");
  return { title, status: INITIAL_STATUS };
}
