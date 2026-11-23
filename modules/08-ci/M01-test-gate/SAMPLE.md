# 예제 실행 요약

[GUIDE.md](GUIDE.md)의 흐름에서 명령과 요청만 모은 실행용 요약입니다. 설명과 예상 결과는 GUIDE.md에 있고, 워크플로 완성본은 [harness/.github/workflows/test.yml](harness/.github/workflows/test.yml)에 있습니다.

## 0단계: 준비

강의 자료 저장소의 루트 폴더에서 실행합니다.

```bash
gh auth status
mkdir -p ~/work
cp -R modules/08-ci/M01-test-gate/todo-app ~/work/my-todo-ci
cd ~/work/my-todo-ci
pnpm install --frozen-lockfile
pnpm test                 # Tests  4 passed (4)
git init -b main
git add -A && git commit -m "chore: 실습 출발점"
```

## 1단계: 워크플로 파일

```bash
mkdir -p .github/workflows
cp <저장소>/modules/08-ci/M01-test-gate/harness/.github/workflows/test.yml .github/workflows/test.yml     # <저장소>는 실제 경로로 바꾼다
git add -A && git commit -m "ci: 테스트와 타입 검사 워크플로 추가"
```

## 2단계: GitHub에 올리기

```bash
gh repo create my-todo-ci --public --source=. --push
gh run list --limit 1
```

## 3단계: PR에서 검사 확인

```bash
git switch -c docs/readme-note
echo "" >> README.md
echo "CI: PR마다 테스트와 타입 검사를 실행한다." >> README.md
git add -A && git commit -m "docs: CI 안내 추가"
git push -u origin docs/readme-note
gh pr create --fill
gh pr checks --watch      # 통과
```

## 4단계: 일부러 실패시켜 보기

```bash
sed -i '' 's/throw new Error("제목은 필수")/throw new Error("제목을 입력하세요")/' src/todo.ts
git add -A && git commit -m "chore: 오류 문구 변경"
git push
gh pr checks --watch      # 실패(종료 코드 1)
gh run view "$(gh run list --branch docs/readme-note --limit 1 --json databaseId --jq '.[0].databaseId')" --log-failed
git revert --no-edit HEAD
git push
gh pr checks --watch      # 통과
```

## 5단계: 필수 검사로 지정

저장소의 Settings → Branches → Add classic branch protection rule에서 `main`에 Require status checks to pass before merging을 켜고 `Test and typecheck`를 선택합니다. Do not allow bypassing the above settings도 켠 뒤 Create를 누릅니다.

## 6단계: CI 실패를 AI에게 맡기기

```text
CI의 테스트가 실패했어. 아래는 실패 로그야. 원인을 찾아 고쳐 줘. 테스트와 인수조건(docs/)은 고치지 마. 고친 뒤 pnpm test 결과를 보여 줘.

(여기에 gh run view --log-failed에서 나온 실패 줄을 붙인다)
```

```bash
git status --short        # M src/todo.ts만 나와야 한다
git add -A && git commit -m "fix: 오류 문구를 인수조건에 맞춤"
git push
gh pr checks --watch
```
