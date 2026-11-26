#!/usr/bin/env node
// 구현 담당(implementer) 서브에이전트가 테스트와 인수조건을 고치지 못하게 막는다.
// Claude Code가 Edit·Write 도구를 쓰기 직전에 이 스크립트를 실행하고, 도구 입력을 표준 입력으로 준다.
// 종료 코드 2로 끝나면 그 도구 호출이 막히고, 표준 오류에 쓴 글이 이유로 전달된다.
import { readFileSync } from "node:fs";
import path from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const file = String(input.tool_input?.file_path ?? "");
const relative = path.relative(root, file).split(path.sep).join("/");
const guarded = relative.startsWith("test/") || relative.startsWith("docs/");

if (input.agent_type === "implementer" && guarded) {
  console.error(
    `차단: 구현 담당은 ${relative} 파일을 고칠 수 없다. 테스트나 인수조건이 잘못됐다고 보면 고치지 말고 이유를 보고한다.`,
  );
  process.exit(2);
}
process.exit(0);
