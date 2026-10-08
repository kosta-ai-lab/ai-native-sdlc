# 개념

OpenWiki는 **코드 저장소를 읽고, 서로 링크된 마크다운 위키를 만들어 주고, 코드가 바뀌면 그 위키를 갱신해 주는 CLI 도구**입니다.
LangChain 팀이 만든 무료 오픈소스(MIT 라이선스)이며 npm 패키지 `openwiki`로 배포됩니다.

README가 "사람이 처음 읽는 소개글"이라면, OpenWiki가 만드는 위키는
**코딩 에이전트(Claude Code 등)가 저장소를 이해하려고 꺼내 읽는 기억 장치**에 가깝습니다.
위키는 저장소 안 `openwiki/` 폴더에 일반 마크다운 파일로 저장되므로 사람도 그대로 읽고, git으로 버전 관리할 수 있습니다.

> 이 가이드는 OpenWiki 0.7.1 (2026-10 기준) 을 기준으로 작성했습니다. 버전이 올라가면 화면과 출력이 조금 달라질 수 있습니다.

## 핵심 개념 5가지

### 1. Wiki (위키)
저장소 루트의 `openwiki/` 폴더에 생기는 마크다운 문서 묶음입니다.
`openwiki/quickstart.md`가 입구 역할을 하고, 여기서 아키텍처·개념·워크플로 등 주제별 페이지로 링크가 뻗어 나갑니다.

### 2. Integration (코딩 에이전트 통합)
OpenWiki를 Claude Code 같은 코딩 에이전트 안에서 쓰게 해 주는 연결입니다.
설치하면 에이전트에 **스킬 1개**와 **MCP 서버 1개**가 추가됩니다.
이 방식에서는 에이전트가 이미 로그인한 모델을 그대로 쓰기 때문에 **별도 API 키가 필요 없습니다.** 이 가이드는 이 방식을 사용합니다.

### 3. Page job (페이지 작업)
위키 생성은 "페이지 계획 → 한 페이지씩 작성 → 마무리" 순서로 진행됩니다.
조사와 글쓰기는 에이전트가 맡고, 작업 대기열·검증·색인·마무리는 OpenWiki가 맡습니다.
페이지가 하나 끝날 때마다 진행 상황이 저장되므로 중간에 끊겨도 이어서 할 수 있습니다.

### 4. Grounded Claim (근거 있는 주장)
위키에 적힌 사실 하나하나를 **Claim**이라 부르고, 각 Claim은 `repo://src/todo.js#L2-L9`처럼 근거가 된 소스 위치를 기록합니다.
이 정보는 `openwiki/.claims/` 폴더에 JSON으로 저장됩니다.
나중에 그 소스가 바뀌면 OpenWiki가 "이 사실은 다시 확인해야 한다"고 알아챕니다.

### 5. Update (업데이트)
코드를 고친 뒤 위키를 갱신하는 작업입니다. 전체를 다시 쓰지 않고 **바뀐 코드와 관련된 페이지만** 고칩니다.
바뀐 것이 없으면 모델을 쓰지 않고 "갱신할 것 없음"으로 끝납니다.

## 추가로 알아두면 좋은 개념

| 개념 | 설명 |
|---|---|
| **Search / Read** | 에이전트가 위키에서 답을 찾을 때 쓰는 MCP 도구(`openwiki_search`, `openwiki_read`). 로컬에서만 동작하고 모델을 호출하지 않습니다. |
| **Visualizer** | `openwiki visualize`. 위키를 노드 그래프와 마크다운 뷰어로 브라우저에 띄워 줍니다. |
| **AGENTS.md** | OpenWiki가 저장소 루트에 관리하는 파일. 에이전트에게 "위키를 이렇게 참고하라"고 알려 줍니다. `<!-- OPENWIKI:START -->`와 `<!-- OPENWIKI:END -->` 사이만 OpenWiki가 고칩니다. |
| **INSTRUCTIONS.md** | `openwiki/INSTRUCTIONS.md`. 위키의 범위와 우선순위를 사용자가 직접 적는 파일. OpenWiki가 읽기만 하고 덮어쓰지 않습니다. |
| **.openwikiignore** | 위키 작성 때 읽지 말아야 할 경로를 적는 파일. 문법은 `.gitignore`와 비슷합니다. |
| **Standalone CLI** | 에이전트 없이 `openwiki --init`으로 직접 실행하는 방식. 모델 제공자와 API 키 설정이 필요합니다. 이 가이드에서는 다루지 않습니다. |

## OpenWiki의 기본 사이클

> 이 가이드는 OpenWiki를 처음 써보는 사람을 위한 **가장 기본적인 흐름**만 다룹니다.
> **설치 → Claude Code 연결 → 위키 생성 → 읽기·검색 → 코드 변경 후 갱신**
> 작은 연습용 프로젝트(`todo-cli`)를 직접 만들어 이 흐름을 한 바퀴 돌아봅니다.

```
OpenWiki 설치
   │
   ▼
Claude Code에 통합 설치
   │
   ▼
저장소에서 위키 생성 (openwiki/ 폴더)
   │
   ▼
위키 읽기 · 검색 · 그래프로 보기
   │
   ▼
코드 변경 → 위키 업데이트 → 커밋
```

각 단계는 [공식 README](https://github.com/langchain-ai/openwiki)의 안내 순서를 그대로 따릅니다. 3단계(연습용 저장소)만 이 가이드에서 추가한 것입니다.

| 이 가이드 | 공식 README |
|---|---|
| 1 단계: OpenWiki 설치 | Quick start › 1. Install OpenWiki |
| 2 단계: Claude Code에 연결하기 | Quick start › 2. Connect your coding agent |
| 3 단계: 연습용 저장소 만들기 | (가이드에서 추가한 실습 준비) |
| 4 단계: 위키 생성하기 | Quick start › 3. Create your wiki |
| 5 단계: 위키 읽고 검색하기 | Search your wiki |
| 6 단계: 그래프로 시각화하기 | Explore your wiki |
| 7 단계: 코드 변경 후 위키 업데이트하기 | Keep your wiki current |

---

# 0 단계: 준비하기

- macOS / Windows / Linux 컴퓨터
- **Node.js 22.22.0 이상** ([nodejs.org](https://nodejs.org)에서 LTS 버전 설치)
- **git**
- **Claude Code** (설치와 로그인이 끝난 상태)

터미널(Windows는 PowerShell)을 열고 세 가지가 모두 준비됐는지 확인합니다.

```bash
node -v
```

```bash
git --version
```

```bash
claude --version
```

## 규칙
> `node -v` 결과가 `v22.22.0`보다 낮으면 OpenWiki가 설치되지 않습니다. Node.js를 먼저 올리세요.

## 체크리스트
- [ ] `node -v`가 v22.22.0 이상인지 확인한다.
- [ ] `git --version`과 `claude --version`이 버전 번호를 출력하는지 확인한다.

# 1 단계: OpenWiki 설치

```bash
npm install -g openwiki
```

설치가 끝나면 도움말이 나오는지 확인합니다.

```bash
openwiki --help
```

## 규칙
> Windows에서는 `npm`(또는 `pnpm`)으로 설치하세요. `bun`으로 설치하면 네이티브 모듈을 직접 컴파일하려다 실패할 수 있습니다.

> `openwiki`를 찾을 수 없다고 나오면 터미널을 닫았다가 다시 열어 보세요.

## 산출물
- 전역 명령어 `openwiki`

## 체크리스트
- [ ] `openwiki --help`가 명령어 목록을 출력하는지 확인한다.

# 2 단계: Claude Code에 연결하기

1. Claude Code용 통합을 설치합니다.

   ```bash
   openwiki integrations install claude
   ```

2. 설치 상태를 확인합니다.

   ```bash
   openwiki integrations list
   ```

## 규칙
> 기본값은 **사용자 범위** 설치입니다. 한 번 설치하면 내 컴퓨터의 모든 git 저장소에서 쓸 수 있습니다.
> 특정 저장소에만 설치하려면 그 저장소 안에서 `openwiki integrations install claude --project`를 실행합니다.

> 제거는 `openwiki integrations uninstall claude` 입니다.

> Claude Code 말고 다른 에이전트를 쓴다면 `claude` 자리에 `codex`, `cursor`, `opencode`, `copilot` 등을 넣습니다. 전체 목록은 공식 README의 표를 참고하세요.

## 산출물
- Claude Code에 설치된 OpenWiki 통합 (사용자 범위)

## 체크리스트
- [ ] `openwiki integrations list`에서 claude가 설치됨으로 표시되는지 확인한다.

# 3 단계: 연습용 저장소 만들기

위키로 만들 대상이 필요합니다. 할 일 목록을 관리하는 작은 CLI `todo-cli`를 만듭니다.
(이미 가진 프로젝트로 해도 되지만, 처음에는 작은 저장소가 빠르고 결과를 확인하기 쉽습니다.)

1. 폴더를 만들고 git 저장소로 초기화합니다.

   ```bash
   mkdir todo-cli
   cd todo-cli
   git init
   mkdir src
   mkdir test
   ```

2. VS Code 같은 편집기로 아래 파일 5개를 만듭니다.

   **`package.json`**
   ```json
   {
     "name": "todo-cli",
     "version": "1.0.0",
     "description": "OpenWiki 실습용 할 일 관리 CLI",
     "type": "module",
     "scripts": {
       "test": "node --test"
     }
   }
   ```

   **`src/store.js`**
   ```js
   import { existsSync, readFileSync, writeFileSync } from "node:fs";

   // 할 일 목록을 JSON 파일 하나에 저장한다.
   export function loadTodos(filePath) {
     if (!existsSync(filePath)) {
       return [];
     }
     return JSON.parse(readFileSync(filePath, "utf8"));
   }

   export function saveTodos(filePath, todos) {
     writeFileSync(filePath, JSON.stringify(todos, null, 2));
   }
   ```

   **`src/todo.js`**
   ```js
   // 할 일 목록을 다루는 순수 함수들. 원본 배열은 바꾸지 않고 새 배열을 돌려준다.
   export function addTodo(todos, title) {
     const trimmed = title.trim();
     if (trimmed === "") {
       throw new Error("제목은 비어 있을 수 없습니다.");
     }
     const nextId = todos.reduce((max, todo) => Math.max(max, todo.id), 0) + 1;
     return [...todos, { id: nextId, title: trimmed, done: false }];
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
       .map((todo) => `${todo.done ? "[x]" : "[ ]"} ${todo.id}. ${todo.title}`)
       .join("\n");
   }
   ```

   **`src/cli.js`**
   ```js
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
   ```

   **`test/todo.test.js`**
   ```js
   import assert from "node:assert/strict";
   import { test } from "node:test";
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

   test("completeTodo는 해당 항목만 완료로 바꾼다", () => {
     const todos = completeTodo(addTodo(addTodo([], "a"), "b"), 2);
     assert.deepEqual(
       todos.map((todo) => todo.done),
       [false, true],
     );
   });

   test("completeTodo는 없는 번호를 거부한다", () => {
     assert.throws(() => completeTodo([], 99));
   });

   test("formatTodos는 완료 여부를 체크박스로 보여준다", () => {
     const todos = completeTodo(addTodo([], "우유 사기"), 1);
     assert.equal(formatTodos(todos), "[x] 1. 우유 사기");
   });
   ```

3. 실행 중 생기는 데이터 파일은 git과 위키 양쪽에서 제외합니다. 아래 두 파일을 저장소 루트에 만듭니다. 내용은 둘 다 한 줄입니다.

   **`.gitignore`**
   ```gitignore
   todos.json
   ```

   **`.openwikiignore`**
   ```gitignore
   todos.json
   ```

4. 테스트와 프로그램이 동작하는지 확인합니다.

   ```bash
   npm test
   ```

   ```bash
   node src/cli.js add 우유 사기
   ```

   ```bash
   node src/cli.js list
   ```

   마지막 명령이 `[ ] 1. 우유 사기`를 출력하면 정상입니다.

5. 첫 커밋을 만듭니다.

   ```bash
   git add .
   git commit -m "todo-cli 초기 버전"
   ```

## 규칙
> OpenWiki는 **git 저장소**에서만 동작합니다. `git init`을 빠뜨리지 마세요.

> `.openwikiignore`에 적은 경로는 위키를 만들 때 읽지 않습니다. 비밀 키, 로그, 생성된 파일처럼 문서에 들어가면 안 되는 경로를 여기에 적습니다.

## 산출물
- git 저장소 `todo-cli/` (소스 3개, 테스트 1개, 커밋 1개)

## 체크리스트
- [ ] `npm test` 결과가 `pass 5`, `fail 0`인지 확인한다.
- [ ] `git log --oneline`에 커밋이 1개 보이는지 확인한다.

# 4 단계: 위키 생성하기 (샘플)

1. **Claude Code를 재시작합니다.** 2단계에서 통합을 설치할 때 Claude Code가 켜져 있었다면 완전히 종료합니다.

2. `todo-cli` 폴더 안에서 Claude Code를 실행합니다.

   ```bash
   claude
   ```

3. 아래 프롬프트를 입력합니다. 공식 README가 안내하는 문장입니다.

   ```text
   Initialize this repository's OpenWiki from the current source and tests.
   ```

   같은 뜻의 한국어로 요청해도 됩니다. 위키를 한국어로 받고 싶으면 둘째 줄을 덧붙입니다.

   ```text
   이 저장소의 현재 소스와 테스트를 바탕으로 OpenWiki를 초기화해줘.
   위키는 한국어로 작성해줘.
   ```

4. 진행 과정을 지켜봅니다. Claude Code가 저장소를 조사하고, 페이지를 계획한 뒤, 한 페이지씩 작성해 `openwiki/` 폴더에 서로 링크된 위키를 만듭니다. 페이지가 하나 끝날 때마다 진행 상황이 저장됩니다.

5. Claude Code가 완료를 보고하면 결과를 커밋합니다. 터미널을 하나 더 열거나 Claude Code를 `/exit`로 나온 뒤 실행합니다.

   ```bash
   git status
   ```

   ```bash
   git add .
   git commit -m "docs: OpenWiki 초기 생성"
   ```

## 규칙
> 위키 언어 지정은 공식 README에 없는, 이 가이드에서 덧붙인 요청입니다. 적지 않으면 영어로 작성될 수 있습니다.

> 중간에 끊기거나 오류가 나면 같은 프롬프트를 다시 입력하세요. 끝난 페이지는 저장되어 있으므로 남은 페이지부터 이어서 진행합니다.

> 위키 작성에는 Claude Code의 사용량이 듭니다. 저장소가 클수록 오래 걸리고 많이 쓰므로, 처음에는 이 예제처럼 작은 저장소로 연습하세요.

> 페이지 구성은 에이전트가 저장소를 보고 정하므로 실행할 때마다, 사람마다 조금씩 다릅니다. 아래 산출물의 하위 폴더 이름이 똑같지 않아도 정상입니다.

## 산출물
```
todo-cli/
├── AGENTS.md                  ← 에이전트용 안내 (OpenWiki 관리 블록 포함)
└── openwiki/
    ├── quickstart.md          ← 위키의 입구
    ├── index.md               ← 전체 색인
    ├── architecture/ …        ← 주제별 페이지 (구성은 저장소마다 다름)
    ├── .claims/               ← 페이지별 Claim과 근거 (JSON)
    ├── .page-manifest.json    ← 페이지 목록과 상태
    └── .last-update.json      ← 마지막 실행 기록
```

## 체크리스트
- [ ] `openwiki/quickstart.md` 파일이 생겼는지 확인한다.
- [ ] 저장소 루트에 `AGENTS.md`가 생겼고 `<!-- OPENWIKI:START -->` 블록이 들어 있는지 확인한다.
- [ ] `openwiki/.claims/` 폴더에 JSON 파일이 있는지 확인한다.
- [ ] (한국어로 요청했다면) 위키 본문이 한국어로 작성되었는지 확인한다.

# 5 단계: 위키 읽고 검색하기

1. **사람이 읽기** — 편집기에서 `openwiki/quickstart.md`를 열어 읽고, 본문의 링크를 따라 다른 페이지로 이동해 봅니다.

2. **근거 확인하기** — `openwiki/.claims/` 안의 JSON 파일 하나를 열어 봅니다.
   "빈 제목은 거부된다" 같은 문장마다 `repo://src/todo.js#L…` 형태의 근거 위치가 붙어 있습니다.

3. **에이전트에게 물어보기** — Claude Code에서 아래 프롬프트를 입력합니다.

   ```text
   이 저장소의 OpenWiki에서 할 일 번호(id)가 어떻게 매겨지는지 검색하고,
   관련 섹션을 읽은 뒤 설명해줘.
   ```

   공식 README의 예시 문장(`Search this repository's OpenWiki for how retry handling works, then read the relevant sections.`)을 이 저장소에 맞게 바꾼 것입니다.
   Claude Code가 `openwiki_search`로 관련 섹션을 찾고 `openwiki_read`로 그 섹션만 읽어 답합니다.

## 규칙
> 위키는 **참고 자료**이지 정답이 아닙니다. 중요한 내용은 실제 소스와 대조해 확인하세요.

> 검색과 읽기 도구는 로컬에서 동작하며 모델을 따로 호출하지 않고, 위키를 수정하지도 않습니다.

## 산출물
- 없음 (읽기 전용 단계)

## 체크리스트
- [ ] Claude Code의 답변에 `openwiki_search` 도구 호출이 보이는지 확인한다.
- [ ] 답변 내용("가장 큰 id에 1을 더한다")이 `src/todo.js`의 `addTodo` 코드와 일치하는지 확인한다.

# 6 단계: 그래프로 시각화하기

1. `todo-cli` 폴더의 터미널에서 실행합니다.

   ```bash
   openwiki visualize
   ```

2. 브라우저가 자동으로 열립니다(기본 주소 `http://127.0.0.1:4321`).
   왼쪽에는 페이지들이 노드 그래프로, 오른쪽에는 선택한 페이지의 마크다운이 보입니다.

3. 노드를 클릭해 페이지 사이의 연결 관계를 살펴봅니다.

4. 다 봤으면 터미널에서 `Ctrl + C`로 서버를 종료합니다.

## 규칙
> 서버는 내 컴퓨터에서만 접속할 수 있는 주소(`127.0.0.1`)로 뜹니다. 다만 화면에 쓰는 라이브러리를 CDN에서 받아오므로 **인터넷 연결이 필요**합니다.

> 기본 포트 `4321`이 사용 중이면 다음 번호로 자동으로 올라갑니다. 직접 정하려면 `openwiki visualize --port 4400`처럼 지정하고, 브라우저를 자동으로 열지 않으려면 `--no-open`을 붙입니다.

> 서버가 떠 있는 동안 위키 파일을 고치면 그래프에 자동으로 반영됩니다.

## 산출물
- 없음 (로컬 미리보기). 정적 사이트로 내보내려면 `openwiki visualize openwiki --export docs/openwiki-visualizer`를 사용합니다.

## 체크리스트
- [ ] 브라우저에 위키 페이지들이 그래프로 표시되는지 확인한다.
- [ ] 노드를 클릭하면 오른쪽에 해당 페이지 내용이 보이는지 확인한다.

# 7 단계: 코드 변경 후 위키 업데이트하기 (샘플)

위키의 진짜 가치는 "코드가 바뀌어도 따라온다"는 점입니다. 기능을 하나 추가하고 위키가 갱신되는지 확인합니다.

1. Claude Code에서 기능 추가를 요청합니다.

   ```text
   src/todo.js에 할 일을 삭제하는 removeTodo(todos, id) 함수를 추가해줘.
   없는 번호면 completeTodo처럼 에러를 던져야 해.
   src/cli.js에는 remove 명령을 연결하고, test/todo.test.js에 테스트도 추가해줘.
   ```

2. 테스트가 통과하는지 확인하고 커밋합니다.

   ```bash
   npm test
   ```

   ```bash
   git add .
   git commit -m "feat: 할 일 삭제 기능 추가"
   ```

3. Claude Code에서 위키 업데이트를 요청합니다. 공식 README가 안내하는 문장입니다.

   ```text
   Update this repository's OpenWiki for changes since its last successful run.
   ```

   같은 뜻의 한국어로 요청해도 됩니다.

   ```text
   마지막으로 성공한 실행 이후의 변경 사항을 반영해서 이 저장소의 OpenWiki를 업데이트해줘.
   ```

4. 무엇이 바뀌었는지 확인합니다.

   ```bash
   git status
   ```

   ```bash
   git diff
   ```

   삭제 기능과 관련된 페이지와 그 페이지의 `.claims` 파일만 바뀌고, 무관한 페이지는 그대로인 것이 정상입니다.

5. 위키 변경을 커밋합니다.

   ```bash
   git add .
   git commit -m "docs: OpenWiki 업데이트"
   ```

6. (선택) 아무것도 고치지 않고 3번 프롬프트를 한 번 더 입력해 봅니다.
   바뀐 것이 없으므로 모델 작업을 건너뛰고 위키 본문은 그대로 둡니다. 점검했다는 기록만 `openwiki/.last-update.json`에 남습니다.

## 규칙
> **코드를 먼저 커밋하고, 그다음 위키를 업데이트**하세요. 순서를 지키면 "어떤 코드 변경이 어떤 문서 변경을 만들었는지"를 git 기록에서 따로 볼 수 있습니다.

> 위키를 처음부터 다시 만들고 싶을 때만 4단계의 초기화 프롬프트를 다시 씁니다. 평소에는 항상 업데이트를 사용합니다.

> 위키에 꼭 담고 싶은 범위나 강조점이 있으면 `openwiki/INSTRUCTIONS.md`에 적어 두세요. 이 파일은 OpenWiki가 덮어쓰지 않습니다.

## 산출물
- `removeTodo`가 추가된 소스와 테스트 (커밋 1개)
- 삭제 기능이 반영된 위키 페이지와 Claim (커밋 1개)

## 체크리스트
- [ ] `npm test`가 모두 통과하는지 확인한다.
- [ ] `git diff`에서 위키에 `removeTodo`(삭제 기능) 설명이 추가되었는지 확인한다.
- [ ] 변경과 무관한 위키 페이지의 본문은 바뀌지 않았는지 확인한다.

---

# 문제 해결

| 증상 | 확인할 것 |
|---|---|
| `openwiki` 명령을 찾을 수 없다 | 터미널을 다시 열고 `npm install -g openwiki`가 오류 없이 끝났는지 확인합니다. |
| 설치 중 Node 버전 오류가 난다 | `node -v`가 v22.22.0 이상인지 확인합니다. |
| Claude Code가 초기화 요청에 OpenWiki를 쓰지 않는다 | `openwiki integrations list`로 설치 여부를 보고, Claude Code를 완전히 종료 후 다시 실행합니다. |
| 초기화 프롬프트에서 git 관련 오류가 난다 | 현재 폴더가 git 저장소인지(`git status`) 확인합니다. |
| 위키가 영어로 만들어졌다 | 초기화 프롬프트에 "위키는 한국어로 작성해줘"를 넣어 다시 실행합니다. |
| 생성 도중 멈췄다 | 같은 프롬프트를 다시 입력하면 남은 페이지부터 이어서 진행합니다. |
| `openwiki visualize` 화면이 비어 있다 | 인터넷 연결을 확인하고, `openwiki/` 폴더가 있는 저장소 루트에서 실행했는지 확인합니다. |

# 다음 단계

- **자동 업데이트**: GitHub Actions에서 주기적으로 위키를 갱신하고 문서 PR을 여는 예시가 공식 저장소의 `examples/openwiki-update.yml`에 있습니다. (이 방식은 Standalone CLI를 쓰므로 모델 제공자 API 키가 필요합니다.)
- **여러 저장소 묶기**: `openwiki link`로 관련 저장소들의 위키를 하나의 워크스페이스로 묶어 한꺼번에 검색할 수 있습니다.
- **사용 통계 끄기**: OpenWiki는 익명 사용 통계를 기본으로 수집합니다. 끄려면 환경 변수 `OPENWIKI_TELEMETRY_DISABLED=1`을 설정합니다.
