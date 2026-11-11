# 예제 소스 이해하고 실행하기 — `todo-cli`

이 문서는 실습용 예제 저장소 [`todo-cli/`](todo-cli/)의 소스 코드를 한 파일씩 읽어 보고, 직접 실행해 보는 안내서입니다.
`todo-cli`는 할 일 목록을 관리하는 아주 작은 명령줄 프로그램이며, [GUIDE.md](GUIDE.md) 4단계부터는 이 저장소를 대상으로 OpenWiki 위키를 만듭니다.

위키를 만들기 전에 코드를 먼저 이해해 두면, 나중에 OpenWiki가 쓴 설명이 **맞는지 직접 대조**해 볼 수 있습니다.

> 준비물: Node.js 22.22.0 이상, git. 외부 라이브러리는 쓰지 않으므로 `npm install`이 필요 없습니다.

---

## 1. 전체 구조

```
todo-cli/
├── package.json          ← 프로젝트 정보와 npm test 명령
├── .gitignore            ← git에서 제외할 파일 (todos.json)
├── .openwikiignore       ← 위키 작성 때 읽지 않을 파일 (todos.json)
├── src/
│   ├── cli.js            ← 진입점: 명령어를 해석하고 결과를 출력
│   ├── todo.js           ← 핵심 로직: 추가 · 완료 · 출력 형식 (순수 함수)
│   └── store.js          ← 저장: JSON 파일 읽기 · 쓰기
└── test/
    └── todo.test.js      ← todo.js 단위 테스트 5개
```

세 소스 파일은 역할이 뚜렷하게 나뉘어 있습니다.

```
          사용자 입력 (node src/cli.js add 우유 사기)
                         │
                         ▼
                 ┌───────────────┐
                 │    cli.js     │  명령 해석 · 출력 · 오류 처리
                 └───────┬───────┘
             ┌───────────┴───────────┐
             ▼                       ▼
     ┌───────────────┐       ┌───────────────┐
     │   store.js    │       │    todo.js    │
     │ 파일 읽기/쓰기 │       │ 목록 계산(순수) │
     └───────┬───────┘       └───────────────┘
             ▼
        todos.json
```

- **`todo.js`는 파일도 화면도 모릅니다.** 배열을 받아 새 배열이나 문자열을 돌려줄 뿐입니다. 그래서 테스트하기 쉽습니다.
- **`store.js`는 저장만 합니다.** 할 일이 무엇인지는 모르고 JSON을 읽고 쓰기만 합니다.
- **`cli.js`가 둘을 이어 붙입니다.** "불러오기 → 계산하기 → 저장하기 → 출력하기"의 흐름이 이 파일에만 있습니다.

할 일 하나는 아래 모양의 객체입니다.

```json
{ "id": 1, "title": "우유 사기", "done": false }
```

---

## 2. 파일별 소스 읽기

### 2-1. `package.json`

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

- `"type": "module"` — `import` / `export` 문법(ES 모듈)을 쓰겠다는 선언입니다. 이 줄이 없으면 `import` 문에서 오류가 납니다.
- `"scripts.test"` — `npm test`를 입력하면 Node.js에 들어 있는 테스트 실행기(`node --test`)가 돌아갑니다. 따로 설치할 테스트 라이브러리가 없습니다.
- `dependencies` 항목이 없습니다. 외부 패키지를 하나도 쓰지 않는다는 뜻입니다.

### 2-2. `src/store.js` — 저장 담당

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

| 함수 | 하는 일 |
|---|---|
| `loadTodos(filePath)` | 파일이 **없으면 빈 배열 `[]`**을 돌려주고, 있으면 JSON을 읽어 배열로 바꿉니다. 처음 실행할 때 파일이 없어도 오류가 나지 않는 이유입니다. |
| `saveTodos(filePath, todos)` | 배열을 JSON 문자열로 바꿔 파일에 덮어씁니다. `null, 2`는 사람이 읽기 좋게 두 칸씩 들여쓰라는 뜻입니다. |

### 2-3. `src/todo.js` — 핵심 로직

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

이 파일의 세 함수는 모두 **순수 함수**입니다. 같은 입력이면 항상 같은 결과를 내고, 받은 배열을 직접 고치지 않고 새 배열을 만들어 돌려줍니다(`[...todos, 새항목]`, `todos.map(...)`).

**`addTodo(todos, title)`**
1. 제목 앞뒤 공백을 지웁니다(`trim`). 공백만 있는 제목은 오류를 던집니다.
2. 새 번호는 **지금 있는 번호 중 가장 큰 값 + 1**입니다(`reduce`로 최댓값을 구함). 목록이 비어 있으면 `0 + 1 = 1`부터 시작합니다.
3. `done: false`인 새 항목을 끝에 붙인 새 배열을 돌려줍니다.

**`completeTodo(todos, id)`**
1. 그 번호가 없으면 `"N번 할 일을 찾을 수 없습니다."` 오류를 던집니다.
2. 번호가 같은 항목만 `{ ...todo, done: true }`로 바꾼 새 배열을 돌려줍니다. 나머지 항목은 그대로입니다.

**`formatTodos(todos)`**
- 비어 있으면 `할 일이 없습니다.`를 돌려줍니다.
- 아니면 한 줄에 하나씩 `[x] 1. 우유 사기`(완료) 또는 `[ ] 2. 책 읽기`(미완료) 형식으로 만듭니다.

### 2-4. `src/cli.js` — 진입점

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

- **저장 위치** — 환경 변수 `TODO_FILE`이 있으면 그 파일을, 없으면 현재 폴더의 `todos.json`을 씁니다(`??`는 "왼쪽 값이 없으면 오른쪽 값"이라는 뜻).
- **명령 해석** — `process.argv`의 앞 두 칸은 `node`와 스크립트 경로이므로 `slice(2)`로 버립니다. 첫 단어가 명령(`add` / `done` / `list`), 나머지가 인자입니다.
  - `add`는 나머지 단어를 공백으로 다시 이어 붙이므로 `add 우유 사기`처럼 따옴표 없이 띄어 써도 됩니다.
  - `done`은 인자를 숫자로 바꿔(`Number`) 넘깁니다.
  - 모르는 명령이거나 명령이 없으면 사용법을 출력합니다.
- **오류 처리** — `todo.js`가 던진 오류를 여기서 잡아 `오류: …`로 출력하고, 종료 코드를 `1`로 정합니다. 그래서 스크립트나 CI에서 실패를 알아챌 수 있습니다.

### 2-5. `test/todo.test.js` — 테스트

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

`node:test`와 `node:assert`는 Node.js에 기본으로 들어 있는 모듈입니다. 테스트 5개는 `todo.js`의 규칙을 하나씩 확인합니다.

| 테스트 | 확인하는 규칙 |
|---|---|
| 1부터 번호를 매긴다 | 빈 목록에 두 개를 추가하면 번호가 `[1, 2]` |
| 빈 제목을 거부한다 | 공백만 있는 제목은 오류 |
| 해당 항목만 완료로 바꾼다 | 2번만 완료하면 `done`이 `[false, true]` |
| 없는 번호를 거부한다 | 없는 99번을 완료하면 오류 |
| 체크박스로 보여준다 | 완료 항목은 `[x] 1. 우유 사기` |

`store.js`와 `cli.js`는 테스트가 없습니다. 파일과 화면을 다루는 부분을 얇게 두고, 규칙은 모두 `todo.js`에 모아 둔 덕분에 순수 함수만 테스트해도 핵심 동작을 확인할 수 있습니다.

### 2-6. `.gitignore`, `.openwikiignore`

```gitignore
todos.json
```

두 파일 모두 이 한 줄뿐입니다. 실행하면 생기는 데이터 파일 `todos.json`을 **git 기록**과 **위키 작성 대상** 양쪽에서 뺍니다. 내 할 일 목록이 커밋되거나 위키 내용에 섞여 들어가지 않게 하려는 것입니다.

---

## 3. 실행해 보기

### 3-1. 준비

예제 폴더를 모듈 밖의 작업 위치로 복사하고 git 저장소로 만듭니다. (이유는 GUIDE.md 3단계의 규칙을 참고하세요.)

```bash
cp -r todo-cli ~/work/todo-cli
cd ~/work/todo-cli
git init
```

`ls -a`를 입력해 `.gitignore`와 `.openwikiignore`도 함께 복사되었는지 확인합니다.

### 3-2. 테스트 실행

```bash
npm test
```

마지막 부분에 아래처럼 나오면 정상입니다.

```
# tests 5
# pass 5
# fail 0
```

### 3-3. 기본 사용

아래 명령을 차례로 입력하고, 오른쪽 주석의 결과와 비교해 봅니다.

```bash
node src/cli.js list               # 할 일이 없습니다.
node src/cli.js add 우유 사기       # 추가했습니다.
node src/cli.js add 책 읽기         # 추가했습니다.
node src/cli.js done 1             # 완료 처리했습니다.
node src/cli.js list
```

마지막 명령의 결과:

```
[x] 1. 우유 사기
[ ] 2. 책 읽기
```

이제 생긴 저장 파일을 열어 봅니다.

```bash
cat todos.json
```

```json
[
  {
    "id": 1,
    "title": "우유 사기",
    "done": true
  },
  {
    "id": 2,
    "title": "책 읽기",
    "done": false
  }
]
```

### 3-4. 오류 상황 확인

```bash
node src/cli.js add "   "          # 오류: 제목은 비어 있을 수 없습니다.
node src/cli.js done 99            # 오류: 99번 할 일을 찾을 수 없습니다.
node src/cli.js                    # 사용법: node src/cli.js <add 제목 | done 번호 | list>
```

오류가 났을 때 종료 코드가 `1`인지도 확인해 봅니다.

```bash
node src/cli.js done 99; echo "종료 코드: $?"    # 종료 코드: 1
```

### 3-5. 저장 위치 바꾸기

```bash
TODO_FILE=work.json node src/cli.js add 회의 준비
TODO_FILE=work.json node src/cli.js list          # [ ] 1. 회의 준비
```

`todos.json`과는 별개인 `work.json`에 저장됩니다. (Windows PowerShell에서는 `$env:TODO_FILE="work.json"`을 먼저 입력한 뒤 명령을 실행합니다.)

> 실습이 끝나면 `work.json`은 지워도 됩니다. `.gitignore`에는 `todos.json`만 적혀 있으므로, 지우지 않으면 커밋할 때 함께 들어갑니다.

### 3-6. 첫 커밋

```bash
git status            # todos.json이 목록에 없어야 한다
git add .
git commit -m "todo-cli 초기 버전"
```

---

## 4. 생각해 볼 점

- **번호 규칙** — 새 번호는 "가장 큰 번호 + 1"입니다. GUIDE.md 7단계에서 삭제 기능(`removeTodo`)을 추가하면, 마지막 항목을 지운 뒤 새로 추가할 때 번호가 어떻게 되는지 확인해 보세요.
- **숫자가 아닌 번호** — `node src/cli.js done abc`를 실행하면 `Number("abc")`가 `NaN`이 되어 `NaN번 할 일을 찾을 수 없습니다.`가 출력됩니다. 더 친절한 메시지로 바꾸려면 어느 파일을 고쳐야 할까요?
- **위키와 대조하기** — OpenWiki는 위키 문장마다 `repo://src/todo.js#L2-L9`처럼 근거 줄 번호를 남깁니다. GUIDE.md 5단계에서 위키를 읽을 때, 이 문서에서 이해한 내용과 위키 설명이 같은지 비교해 보세요.

## 5. 다음 단계

코드를 이해하고 커밋까지 마쳤다면 [GUIDE.md](GUIDE.md) **4단계: 위키 생성하기**로 넘어가 이 저장소의 OpenWiki 위키를 만듭니다.
