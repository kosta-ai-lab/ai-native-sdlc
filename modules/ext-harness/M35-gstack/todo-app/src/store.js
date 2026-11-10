import { existsSync, readFileSync, writeFileSync } from "node:fs";

// 할 일 목록을 JSON 파일 하나에 저장한다. 파일이 없으면 빈 목록으로 시작한다.
export function loadTodos(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function saveTodos(filePath, todos) {
  writeFileSync(filePath, JSON.stringify(todos, null, 2) + "\n");
}
