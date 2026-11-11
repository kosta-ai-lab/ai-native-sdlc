import { loadTodos, saveTodos } from "./store.js";
import { addTodo, completeTodo, formatTodos } from "./todo.js";

// TODO_FILE 환경 변수로 저장 위치를 바꿀 수 있다. 기본값은 todos.json.
const filePath = process.env.TODO_FILE ?? "todos.json";
const [command, ...args] = process.argv.slice(2);

try {
  const todos = loadTodos(filePath);
  if (command === "add") {
    saveTodos(filePath, addTodo(todos, args.join(" ")));
    console.log("추가했습니다.");
  } else if (command === "done") {
    saveTodos(filePath, completeTodo(todos, Number(args[0])));
    console.log("완료 처리했습니다.");
  } else if (command === "list") {
    console.log(formatTodos(todos));
  } else {
    console.log("사용법: node src/cli.js <add 제목 | done 번호 | list>");
  }
} catch (error) {
  console.error(`오류: ${error.message}`);
  process.exitCode = 1;
}
