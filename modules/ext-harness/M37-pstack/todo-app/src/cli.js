import { loadTodos, saveTodos } from "./store.js";
import { addTodo, completeTodo, formatTodos } from "./todo.js";

// 사용법:
//   node src/cli.js add <제목> [마감일 YYYY-MM-DD]
//   node src/cli.js done <번호>
//   node src/cli.js list
const filePath = "todos.json";
const [command, ...args] = process.argv.slice(2);

try {
  let todos = loadTodos(filePath);
  if (command === "add") {
    todos = addTodo(todos, args[0] ?? "", args[1] ?? null);
    saveTodos(filePath, todos);
  } else if (command === "done") {
    todos = completeTodo(todos, Number(args[0]));
    saveTodos(filePath, todos);
  } else if (command !== "list") {
    throw new Error("명령은 add, done, list 중 하나여야 합니다.");
  }
  console.log(formatTodos(todos));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
