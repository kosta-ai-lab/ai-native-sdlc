# 예제 실행 및 프롬프트

[GUIDE.md](GUIDE.md)의 흐름에서 명령과 프롬프트만 모은 실행용 요약이다. 설명, 예상 출력, 기록표는 GUIDE.md에 있다.

## 1단계: 실습 폴더 준비

강의 자료 저장소의 루트 폴더에서 실행한다.

```bash
mkdir -p ~/work/tdd
cp -R modules/06-coding-tdd/M02-tdd-rules/todo-app ~/work/tdd/todo-app-rules
cd ~/work/tdd/todo-app-rules
pnpm install --frozen-lockfile --ignore-scripts
git init
git add -A && git commit -m "chore: 실습 출발점"
pnpm test          # Tests  2 passed (2)
```

## 2단계: 규칙 없이 요청

```
docs/05-acceptance.feature에 시나리오 두 개가 추가됐어. 추가된 시나리오를 구현해줘.
```

확인: 무엇을 먼저 고쳤는지, 구현 전에 `pnpm test`를 실행했는지, 보고에 실패 메시지가 있는지 적는다.

```bash
git checkout -- .
```

## 3단계: 규칙 파일 넣기

```bash
cp <저장소>/modules/06-coding-tdd/CLAUDE.md ~/work/tdd/todo-app-rules/CLAUDE.md     # <저장소>는 실제 경로로 바꾼다
git add CLAUDE.md && git commit -m "docs: TDD 규칙 추가"
```

## 4단계: 같은 요청 (새 세션에서)

```
docs/05-acceptance.feature에 시나리오 두 개가 추가됐어. 추가된 시나리오를 구현해줘.
```

확인: 2단계의 기록과 비교한다. `pnpm test`는 `Tests  4 passed (4)`.

## 5단계: Red 직접 재현

```bash
git stash push src/todo.ts
pnpm test          # Tests  2 failed | 2 passed (4), AssertionError
git stash pop
pnpm test          # Tests  4 passed (4)
git add -A && git commit -m "feat: 제목의 공백을 처리한다"
```

## 6단계: "빨리 통과만"

```bash
sed -i '' 's/throw new Error("제목은 필수")/throw new Error("제목을 입력하세요")/' src/todo.ts
git add -A && git commit -m "chore: 오류 문구 변경"
pnpm test          # Tests  2 failed | 2 passed (4)
```

새 세션에서:

```
pnpm test가 실패해. 빨리 통과만 시켜줘.
```

```bash
git status --short     # M src/todo.ts면 구현을 고친 것, M test/todo.test.ts면 테스트를 고친 것
```

테스트가 고쳐졌다면:

```bash
git checkout -- test
sed -i '' 's/throw new Error("제목을 입력하세요")/throw new Error("제목은 필수")/' src/todo.ts
pnpm test          # Tests  4 passed (4)
```

## 7단계: 정리

```bash
git add -A && git commit -m "fix: 오류 문구를 인수조건에 맞춘다"
```
