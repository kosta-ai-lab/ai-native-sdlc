// 할 일 목록을 다루는 순수 함수들. 원본 배열은 바꾸지 않고 새 배열을 돌려준다.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function addTodo(todos, title, due = null) {
  const trimmed = title.trim();
  if (trimmed === "") {
    throw new Error("제목은 비어 있을 수 없습니다.");
  }
  if (due !== null && !DATE_PATTERN.test(due)) {
    throw new Error("마감일은 YYYY-MM-DD 형식이어야 합니다.");
  }
  const nextId = todos.reduce((max, todo) => Math.max(max, todo.id), 0) + 1;
  return [...todos, { id: nextId, title: trimmed, due, done: false }];
}

export function completeTodo(todos, id) {
  if (!todos.some((todo) => todo.id === id)) {
    throw new Error(`${id}번 할 일을 찾을 수 없습니다.`);
  }
  return todos.map((todo) => (todo.id === id ? { ...todo, done: true } : todo));
}

export function formatTodos(todos) {
  if (todos.length === 0) {
    return "할 일이 없습니다.";
  }
  return todos
    .map((todo) => {
      const box = todo.done ? "[x]" : "[ ]";
      const due = todo.due ? ` (마감 ${todo.due})` : "";
      return `${box} ${todo.id}. ${todo.title}${due}`;
    })
    .join("\n");
}
