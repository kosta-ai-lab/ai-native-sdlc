# 예제 실행 및 프롬프트

GUIDE.md의 흐름을 명령어와 프롬프트만 모아 놓은 실행용 요약입니다.
설명과 체크리스트는 [GUIDE.md](GUIDE.md)를 참고하세요.

## 1단계: OpenWiki 설치하고 Claude Code에 연결

```bash
npm install -g openwiki
```

```bash
openwiki integrations install claude
```

```bash
openwiki integrations list
```

Claude Code가 켜져 있었다면 종료 후 다시 실행합니다.

## 2단계: 연습용 저장소 `todo-cli` 준비

GUIDE.md 3단계의 파일(`package.json`, `src/store.js`, `src/todo.js`, `src/cli.js`, `test/todo.test.js`, `.gitignore`, `.openwikiignore`)을 만든 뒤 실행합니다.

```bash
npm test
```

```bash
git add .
git commit -m "todo-cli 초기 버전"
```

## 3단계: Claude Code CLI를 실행

```bash
claude
```

`/mcp`를 입력해 `openwiki` 서버가 연결되어 있는지 확인합니다.

## 4단계: 프롬프트가 뜨면 자연어로 지시

**위키 생성**

```text
이 저장소의 현재 소스와 테스트를 바탕으로 OpenWiki를 초기화해줘.
위키는 한국어(ko)로 작성해줘.
```

**위키 검색**

```text
이 저장소의 OpenWiki에서 할 일 번호(id)가 어떻게 매겨지는지 검색하고,
관련 섹션을 읽은 뒤 설명해줘.
```

**기능 추가**

```text
src/todo.js에 할 일을 삭제하는 removeTodo(todos, id) 함수를 추가해줘.
없는 번호면 completeTodo처럼 에러를 던져야 해.
src/cli.js에는 remove 명령을 연결하고, test/todo.test.js에 테스트도 추가해줘.
```

**위키 업데이트** (기능 추가를 커밋한 뒤 실행)

```text
마지막으로 성공한 실행 이후의 변경 사항을 반영해서 이 저장소의 OpenWiki를 업데이트해줘.
```

## 5단계: 결과 확인

```bash
openwiki visualize
```

```bash
git status
```

```bash
git diff
```

기대 결과:
- `openwiki/quickstart.md`와 주제별 페이지, `openwiki/.claims/`, 루트의 `AGENTS.md`가 생성된다.
- 업데이트 후에는 삭제 기능과 관련된 페이지만 변경된다.
- 변경 없이 업데이트를 다시 요청하면 "업데이트할 것 없음"으로 끝난다.
