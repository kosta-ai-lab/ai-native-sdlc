# 테스트를 PR의 관문으로 걸기 가이드

> 검증 기준: GitHub Actions(ubuntu-latest, Node.js v24.22.3), pnpm 12, Vitest 3.2.6, gh 2.105.0, Claude Code 2.1.330(모델 Sonnet 5.5), 2026-11-24. 워크플로는 이 강의 자료 저장소의 PR에서 실제로 실행했고, ‘검증 실행에서 본 것’은 그 결과에서 옮겼습니다. 직접 실행하지 않은 단계는 그렇게 적었습니다.

## 이 단원이 말하려는 것

테스트가 통과했다는 것을 **무엇으로 확인하고 병합하는가**. 검사가 실패하면 **누가 무엇을 고치는가**. 이 단원은 이 두 물음을 다룹니다.

“내 컴퓨터에서는 통과했다”는 말 대신 PR에 남은 검사 결과를 봅니다. PR마다 같은 검사를 실행하고, 그 검사를 필수로 지정해 실패한 PR은 병합하지 못하게 합니다. 검사가 실패했을 때 고치는 일은 AI에게 맡길 수 있습니다. 맡길 때는 테스트와 인수조건을 건드리지 않게 하고, 고친 뒤에는 무엇이 바뀌었는지 사람이 직접 보고 받아들일지 정합니다.

## 1. CI에서 테스트를 다시 실행하는 이유

“내 컴퓨터에서는 통과했다”는 말은 병합의 근거로 약합니다. 어떤 코드로, 어떤 환경에서, 누가 실행했는지 남지 않기 때문입니다. CI(지속적 통합)는 코드를 올릴 때마다 깨끗한 환경에서 같은 검사를 다시 실행하고 그 결과를 PR에 남깁니다.

AI와 함께 일할 때는 이 관문이 더 필요합니다. [모듈 06 단원 M03](../../06-coding-tdd/M03-test-first-skill/README.md)에서 만든 훅은 구현 담당 서브에이전트가 테스트를 고치는 것은 막았지만, 메인 세션이 셸 명령으로 테스트 파일을 고치는 것은 막지 못했습니다. 로컬의 규칙과 훅을 빠져나간 변경도 병합 전에 한 번 더 걸러야 합니다.

| 정할 것 | 이 단원의 선택 |
|---|---|
| 언제 실행하는가 | PR을 열 때와 그 PR의 브랜치에 커밋을 더 올릴 때, 그리고 main에 푸시할 때 |
| 어디서 실행하는가 | GitHub가 제공하는 러너(`ubuntu-latest`) |
| 무엇을 실행하는가 | 의존성 설치, `pnpm test`, `pnpm typecheck` |

## 2. 검사가 관문이 되는 조건

검사를 실행하는 것과 병합을 막는 것은 다른 일입니다. 워크플로만 추가하면 검사가 실패해도 PR을 병합할 수 있습니다. GitHub에서는 보호할 브랜치에 ‘필수 상태 검사’를 지정해야 합니다. GitHub 문서는 필수 상태 검사를 켜면 모든 필수 검사가 통과해야 보호된 브랜치에 병합할 수 있다고 적습니다. 보호된 브랜치는 무료 계정에서는 공개 저장소에서만 쓸 수 있습니다. 또 기본 설정에서는 저장소 관리자에게 규칙이 적용되지 않으므로, 자기 저장소에서 확인하려면 우회를 막는 항목도 켜야 합니다.

CI가 막지 못하는 것도 있습니다.

- 테스트가 확인하지 않는 동작은 CI도 확인하지 않습니다.
- 테스트를 함께 고친 PR은 통과합니다. [모듈 06 단원 M02](../../06-coding-tdd/M02-tdd-rules/README.md)의 검증 실행에서, 규칙 파일이 없을 때 “빨리 통과만 시켜줘”라고 요청하자 Claude는 두 번 모두 테스트의 기대 문구를 고쳤습니다. 그렇게 고친 PR은 검사를 통과합니다. 사람이 리뷰에서 `test/`와 `docs/`의 변경을 따로 봐야 합니다.

## 3. 단계별 실습

실습은 자기 GitHub 계정의 저장소에서 합니다. ‘검증 실행에서 본 것’에는 두 가지 실행이 있습니다. 하나는 이 강의 자료 저장소의 PR에서 실행한 결과이고, 다른 하나는 이 가이드의 0~6단계를 공개 연습용 저장소(`my-todo-ci`)에서 처음부터 끝까지 따라 한 결과입니다. 어느 쪽인지는 항목마다 적었습니다.

### 0단계 — 준비하기

**목적:** 로컬에서 테스트가 통과하는 프로젝트를 git 저장소로 만듭니다.

**직접 하기**

도구를 확인한 뒤, 강의 자료 저장소의 루트 폴더에서 아래 명령을 실행합니다. [모듈 06 단원 M02](../../06-coding-tdd/M02-tdd-rules/README.md)를 마친 자기 폴더를 써도 됩니다. 그 폴더는 이미 git 저장소라 `git init -b main`이 브랜치 이름을 바꾸지 못합니다. `git branch --show-current`가 `main`이 아니면 `git branch -M main`을 실행합니다.

```bash
git --version && node --version && pnpm --version
gh auth status            # GitHub에 로그인되어 있어야 한다

mkdir -p ~/work
cp -R modules/08-ci/M01-test-gate/todo-app ~/work/my-todo-ci
cd ~/work/my-todo-ci
pnpm install --frozen-lockfile
pnpm test                 # Tests  4 passed (4)
pnpm typecheck            # 오류 없이 끝난다
git init -b main
git add -A && git commit -m "chore: 실습 출발점"
```

**산출물**

테스트 네 개가 통과하는 로컬 git 저장소(브랜치 `main`).

**검토**

- [ ] `pnpm test`가 `Tests  4 passed (4)`를 출력한다.
- [ ] `git status --short`가 아무것도 출력하지 않는다. `node_modules/`는 `.gitignore`에 있어 올라가지 않는다.

### 1단계 — 워크플로 파일 만들기

**목적:** 로컬에서 하던 설치, 테스트, 타입 검사를 GitHub가 대신 실행하게 합니다.

**직접 하기**

편집기로 `.github/workflows/test.yml`을 만들어 아래 내용을 그대로 넣습니다. 완성본 [harness/.github/workflows/test.yml](harness/.github/workflows/test.yml)을 복사해도 됩니다.

```bash
mkdir -p .github/workflows
```

```yaml
# 테스트 관문: PR과 main 푸시마다 테스트와 타입 검사를 실행한다.
name: Test

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  test:
    name: Test and typecheck
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Install pnpm
        uses: pnpm/action-setup@v6
        with:
          version: 12

      - name: Install Node.js
        uses: actions/setup-node@v7
        with:
          node-version: 24

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Type check
        run: pnpm typecheck
```

| 줄 | 뜻 |
|---|---|
| `on: pull_request`, `push: branches: [main]` | PR을 열 때와 그 PR의 브랜치에 커밋을 더 올릴 때, 그리고 main에 푸시할 때 실행합니다 |
| `permissions: contents: read` | 워크플로에 저장소 읽기 권한만 줍니다 |
| `runs-on: ubuntu-latest` | GitHub가 제공하는 리눅스 러너에서 실행합니다 |
| `actions/checkout` | 저장소의 코드를 러너로 가져옵니다 |
| `pnpm/action-setup`, `actions/setup-node` | pnpm과 Node.js를 설치합니다 |
| `pnpm install --frozen-lockfile` | 잠금 파일에 적힌 버전 그대로 설치합니다. 잠금 파일과 어긋나면 실패합니다 |
| `pnpm test`, `pnpm typecheck` | 로컬에서 실행하던 것과 같은 명령입니다. 하나라도 실패하면 검사 전체가 실패합니다 |

**산출물**

워크플로 파일을 커밋합니다.

```bash
git add -A && git commit -m "ci: 테스트와 타입 검사 워크플로 추가"
```

워크플로 파일이 커밋된 저장소.

**검증 실행에서 본 것**

- 이 강의 자료 저장소에는 같은 단계를 가진 워크플로(`.github/workflows/practice-examples.yml`)가 있습니다. 설치, 테스트, 타입 검사 단계는 같고 다른 점은 다섯 가지입니다. 예제 폴더 안에서 실행하도록 `working-directory`를 정했고, 예제 폴더나 그 워크플로 파일이 바뀔 때만 돌도록 `paths`를 정했습니다. 같은 PR에 새 커밋이 오면 앞선 실행을 취소하는 `concurrency`와 Checkout의 `persist-credentials: false`를 넣었고, 워크플로와 작업의 이름이 다릅니다.
- 그 워크플로는 PR에서 12초 만에 성공했습니다. 러너의 Node.js는 v24.22.3이었고 `Tests  4 passed (4)`가 나왔습니다. 단계는 Checkout, Install pnpm, Install Node.js, Install dependencies, Run tests, Type check 순서로 모두 성공했습니다.
- 연습용 저장소에서는 위 완성본을 그대로 `.github/workflows/test.yml`에 넣었습니다. 2단계에서 main에 올리자 실행이 시작됐고 8초 만에 성공했습니다. 작업 이름은 `Test and typecheck`였습니다.

**검토**

- [ ] 파일 위치가 `.github/workflows/test.yml`이다. 다른 폴더에 두면 실행되지 않는다.
- [ ] 들여쓰기가 공백 두 칸이고 탭이 없다.

### 2단계 — GitHub에 올리기

**목적:** 워크플로가 실행될 GitHub 저장소를 만듭니다.

**직접 하기**

아래 명령으로 자기 계정에 저장소를 만들고 올립니다. 5단계의 필수 검사를 무료 계정에서 쓰려면 공개 저장소여야 합니다. 공개하고 싶지 않으면 `--private`으로 만들고 5단계는 읽기만 합니다.

```bash
gh repo create my-todo-ci --public --source=. --push
gh run list --limit 1     # main 푸시로 시작된 실행이 보인다
```

**산출물**

GitHub 저장소와, main 푸시로 시작된 첫 실행.

**검증 실행에서 본 것**

- `gh repo create my-todo-ci --public --source=. --push`는 새 저장소의 주소를 출력하고, 원격 `origin`을 등록한 뒤 `main`을 올렸습니다.
- 바로 뒤에 실행한 `gh run list --limit 1`에는 main 푸시로 시작된 ‘Test’ 실행이 `queued` 상태로 보였습니다. 이 실행은 8초 만에 성공했습니다.

**검토**

- [ ] 저장소의 Actions 탭에 ‘Test’ 워크플로의 실행이 있다.
- [ ] 실행이 초록색으로 끝났다.

### 3단계 — PR에서 검사 확인하기

**목적:** PR마다 검사가 실행되고 결과가 PR에 붙는 것을 확인합니다.

**직접 하기**

브랜치를 만들어 작은 변경을 올리고 PR을 엽니다.

```bash
git switch -c docs/readme-note
echo "" >> README.md
echo "CI: PR마다 테스트와 타입 검사를 실행한다." >> README.md
git add -A && git commit -m "docs: CI 안내 추가"
git push -u origin docs/readme-note
gh pr create --fill
gh pr checks --watch      # 검사가 끝날 때까지 기다린다
```

명령은 한 줄씩 실행합니다. `--fill`은 PR의 제목과 본문을 커밋에서 채우고, 병합 대상은 저장소의 기본 브랜치(`main`)입니다.

**확인**

`gh pr checks --watch`가 통과로 끝나는지 봅니다. 푸시 직후에는 검사가 아직 등록되지 않아 `gh pr checks --watch`가 `no checks reported`를 내고 바로 끝날 수 있습니다. 5~10초 뒤에 다시 실행합니다.

**산출물**

검사가 통과한 PR.

**검증 실행에서 본 것**

- 강의 자료 저장소의 PR에서 `gh pr checks`는 검사 이름, 결과, 걸린 시간, 실행 주소를 한 줄로 보여 줬습니다.
  ```
  Test and typecheck (module 08 example)	pass	12s	https://github.com/…/actions/runs/…
  ```
- 이 한 줄은 출력을 스크립트로 받았을 때의 형식입니다. 터미널에서는 `All checks were successful` 같은 요약과 표가 나옵니다.
- 자기 저장소에서는 검사 이름이 `Test and typecheck`로 나옵니다. 워크플로의 `jobs.test.name`에 적은 이름입니다.
- 연습용 저장소에서는 `gh pr create --fill` 바로 뒤의 `gh pr checks --watch`가 `no checks reported on the 'docs/readme-note' branch`를 내고 끝났습니다. 8초 뒤에 다시 실행하자 `pending`에서 `pass`로 바뀌었고, 검사는 9초가 걸렸습니다.

**검토**

- [ ] PR 화면 아래쪽에 검사 결과가 보인다.
- [ ] `gh pr checks`가 `All checks were successful`을 출력한다. 출력을 파이프로 넘기면 `pass`가 나온다.

### 4단계 — 일부러 실패시켜 보기

> CI가 실패하면 AI에게 맡기기 전에 로그를 먼저 읽고 원인을 이해합니다.

**목적:** 검사가 실제로 실패를 잡는지, 실패 로그를 어떻게 읽는지 확인합니다.

**직접 하기**

같은 브랜치에서 구현의 오류 문구를 바꿔 올립니다. 인수조건은 여전히 “제목은 필수”이므로 테스트 두 개가 실패해야 합니다.

```bash
sed -i '' 's/throw new Error("제목은 필수")/throw new Error("제목을 입력하세요")/' src/todo.ts
git add -A && git commit -m "chore: 오류 문구 변경"
git push
gh pr checks --watch      # 실패로 끝난다(종료 코드 1)
gh run view "$(gh run list --branch docs/readme-note --limit 1 --json databaseId --jq '.[0].databaseId')" --log-failed
```

Linux에서는 `sed -i` 뒤의 `''`를 뺍니다. 편집기로 그 한 줄을 고쳐도 됩니다.

**확인**

실패 로그에서 어느 테스트가 어떤 기대와 어긋났는지 찾습니다.

**직접 하기**

로그를 읽은 뒤 되돌립니다.

```bash
git revert --no-edit HEAD
git push
gh pr checks --watch      # 다시 통과한다
```

**산출물**

실패한 실행 하나와, 되돌린 뒤 통과한 실행 하나가 남은 PR.

**검증 실행에서 본 것**

- 오류 문구를 바꾼 커밋을 올리자 검사가 11초 만에 실패했습니다. Run tests 단계가 실패했고 Type check 단계는 건너뛰었습니다. `gh pr checks`는 그 검사를 `fail`로 표시하고 종료 코드 1로 끝났습니다.
- `gh run view … --log-failed`는 실패한 단계(Run tests)의 로그만 보여 줬습니다. 핵심 줄은 다음과 같습니다. 줄 앞의 작업 이름, 단계 이름, 시각과 색상 제어 문자는 뺐습니다.
  ```
   ❯ test/todo.test.ts (4 tests | 2 failed) 11ms
     ✓ 할 일 생성 > 제목이 있으면 '할 일' 상태로 생성된다 1ms
     × 할 일 생성 > 빈 제목은 거부한다 8ms
       → expected [Function] to throw error including '제목은 필수' but got '제목을 입력하세요'
     ✓ 할 일 생성 > 제목 앞뒤 공백은 제거한다 0ms
     × 할 일 생성 > 공백만 있는 제목은 거부한다 1ms
       → expected [Function] to throw error including '제목은 필수' but got '제목을 입력하세요'
  ```
- `git revert`로 되돌린 커밋을 올리자 14초 만에 다시 통과했습니다.
- 연습용 저장소에서도 같은 순서로 실행했습니다. 실패는 9초, 되돌린 뒤의 통과는 12초가 걸렸고 실패 로그의 핵심 줄은 위와 같았습니다. `gh pr checks --watch`는 검사가 실패로 끝나면 종료 코드 1, 통과로 끝나면 0이었습니다.
- 검사가 실패했다고 해서 병합이 저절로 막히지는 않습니다. 병합을 막는 것은 5단계의 설정입니다. 보호 규칙을 걸기 전의 연습용 저장소에서 검사가 실패한 PR을 `gh pr view --json mergeable,mergeStateStatus`로 보면 `MERGEABLE`, `UNSTABLE`이었습니다. 병합할 수 있는 상태라는 뜻입니다. 이 상태의 병합 버튼을 화면에서 보지는 않았습니다.

**검토**

- [ ] 실패 로그에서 어느 테스트가 어떤 기대와 어긋났는지 찾았다.
- [ ] 되돌린 뒤 검사가 다시 통과했다.

### 5단계 — 필수 검사로 지정하기

**목적:** 검사가 실패한 PR을 병합할 수 없게 합니다.

**직접 하기**

GitHub 문서의 절차를 따릅니다. 저장소 화면에서 다음 순서로 설정합니다.

1. Settings → 왼쪽 메뉴의 Branches로 갑니다.
2. Branch protection rules에서 Add classic branch protection rule을 누릅니다.
3. Branch name pattern에 `main`을 입력합니다.
4. Require status checks to pass before merging을 선택합니다.
5. 검색 칸에서 `Test and typecheck`를 찾아 선택합니다.
6. Do not allow bypassing the above settings를 선택합니다. 선택하지 않으면 저장소 관리자인 자기 계정에는 규칙이 적용되지 않습니다.
7. Create를 누릅니다.

절차는 GitHub 문서 “Managing a branch protection rule”에서 옮겼습니다(2026-11-24 확인). 화면의 이름은 바뀔 수 있습니다.

화면 대신 명령으로 같은 규칙을 걸 수도 있습니다. 프로젝트 폴더에서 실행합니다. `enforce_admins`가 화면의 Do not allow bypassing the above settings에 해당합니다.

```bash
cat > protect.json <<'JSON'
{
  "required_status_checks": { "strict": false, "contexts": ["Test and typecheck"] },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON
gh api -X PUT "repos/{owner}/{repo}/branches/main/protection" --input protect.json --jq '.required_status_checks.contexts, .enforce_admins.enabled'
rm protect.json
```

`{owner}`와 `{repo}`는 그대로 입력합니다. gh가 지금 폴더의 저장소 이름으로 바꿔 줍니다. 성공하면 `["Test and typecheck"]`와 `true`가 나옵니다.

**확인**

그다음 4단계의 `sed`, 커밋, 푸시 명령으로 실패하는 커밋을 다시 올려 병합 버튼이 막히는지 확인합니다.

**산출물**

필수 검사가 걸린 `main`과, 실패한 검사 때문에 병합이 막힌 PR. 6단계를 이어서 한다면 실패 커밋을 되돌리지 않고 둡니다.

**검증 실행에서 본 것**

- 연습용 저장소의 화면에서 1~7번의 이름을 확인했습니다. Branch protection rules, Add classic branch protection rule, Branch name pattern, Require status checks to pass before merging, Do not allow bypassing the above settings, Create가 화면에 그대로 있었습니다.
- Branches 화면에는 Add branch ruleset 버튼도 함께 있습니다. GitHub는 그 화면에서 ruleset을 권장하고 classic 규칙은 기능이 더 적다고 안내합니다. 이 단원은 필수 검사 하나만 걸면 되므로 classic 규칙을 씁니다.
- 5번의 검색 칸은 최근 일주일 동안 그 저장소에서 실행된 검사를 찾습니다. `Test and typecheck`를 입력하자 같은 이름의 검사가 나왔고, 선택하자 필수 검사 목록에 들어갔습니다.
- Create를 누르자 GitHub가 본인 확인 화면(Confirm access)을 띄웠습니다. 화면은 패스키, GitHub Mobile, 인증 앱, 이메일 코드 가운데 하나로 확인하라고 안내합니다. 검증 실행에서는 여기서 멈추고 위의 명령으로 같은 규칙을 걸었습니다.
- 규칙을 건 뒤 실패하는 커밋을 올리자 병합이 막혔습니다.
  - `gh pr view --json mergeStateStatus`가 `BLOCKED`로 바뀌었습니다.
  - `gh pr merge --squash`는 `is not mergeable: the base branch policy prohibits the merge.`를 내고 병합하지 않았습니다.
  - 관리자 권한으로 병합하는 `gh pr merge --squash --admin`도 `Required status check "Test and typecheck" is failing.`으로 거부됐습니다.
  - PR 화면에는 `All checks have failed`와 `1 failing check`가 나오고, 검사 옆에 `Required` 표시가 붙었습니다. Merge pull request 버튼은 누를 수 없는 상태였습니다.
- 6단계에서 고친 커밋을 올려 검사가 통과하자 상태가 `CLEAN`으로 바뀌었고 `gh pr merge --squash`로 병합됐습니다.

**검토**

- [ ] 검사가 실패한 PR에서 병합 버튼이 막힌다.
- [ ] 검사가 통과하면 병합할 수 있다(6단계를 마친 뒤 확인한다).

### 6단계 — CI 실패를 AI에게 맡기기

**목적:** 실패 로그를 근거로 고치게 하되, 테스트와 인수조건은 건드리지 않게 합니다.

**요청**

5단계에서 올린 실패 커밋이 그대로 있는 상태에서 시작합니다. 이미 되돌렸다면 4단계의 명령을 다시 실행합니다. 프로젝트 폴더에서 Claude Code를 새로 시작해 실패 로그의 핵심 줄을 붙여 요청합니다.

```text
CI의 테스트가 실패했어. 아래는 실패 로그야. 원인을 찾아 고쳐 줘. 테스트와 인수조건(docs/)은 고치지 마. 고친 뒤 pnpm test 결과를 보여 줘.

× 할 일 생성 > 빈 제목은 거부한다
  → expected [Function] to throw error including '제목은 필수' but got '제목을 입력하세요'
× 할 일 생성 > 공백만 있는 제목은 거부한다
  → expected [Function] to throw error including '제목은 필수' but got '제목을 입력하세요'
```

**확인**

AI가 고친 뒤 바뀐 파일과 고친 줄을 확인합니다.

```bash
git status --short        # M src/todo.ts만 나와야 한다
git diff                  # 고친 줄을 읽는다
```

**판단**

`src/todo.ts`만 바뀌었고 고친 줄이 인수조건과 맞으면 이 수정을 받아들입니다. `test/`나 `docs/`가 바뀌었다면 `git checkout -- test docs`로 되돌리고, 인수조건과 다르게 고쳤다면 다시 요청합니다.

**산출물**

받아들였으면 커밋해 올립니다.

```bash
git add -A && git commit -m "fix: 오류 문구를 인수조건에 맞춤"
git push
gh pr checks --watch
```

**검증 실행에서 본 것 (3회)**

실패 커밋까지 만든 로컬 사본에서 두 번, 연습용 저장소에서 한 번 실행했습니다.

- 세 번 모두 `src/todo.ts` 한 파일만 고쳤고, 테스트와 `docs/`는 고치지 않았습니다.
- 세 번 모두 원인을 직전 커밋(오류 문구 변경)으로 짚었고, 인수조건과 테스트가 “제목은 필수”를 요구한다는 것을 근거로 들었습니다.
- 세 번 모두 `pnpm test`를 실행해 `Tests  4 passed (4)`를 보였습니다.
- 고친 문구는 같지 않았습니다. 로컬 사본의 두 번은 “제목은 필수”로 되돌렸고, 연습용 저장소의 한 번은 “제목은 필수입니다”로 고쳤습니다. 테스트는 `toThrow("제목은 필수")`로 그 문구가 들어 있는지만 확인하므로 두 수정 모두 통과합니다. 원래 문구와 같은지는 테스트가 알려 주지 않으므로 `git diff`로 직접 봅니다.
- 연습용 저장소에서는 고친 커밋을 올리자 검사가 13초 만에 통과했고 PR을 병합할 수 있었습니다.

**검토**

- [ ] `git status --short`에 `M src/todo.ts`만 나온다. `test/`나 `docs/`가 바뀌었다면 되돌린다.
- [ ] `git diff`로 고친 줄을 읽었다. 통과하더라도 인수조건과 다르게 고쳤다면 다시 요청한다.
- [ ] 고친 커밋을 올린 뒤 PR의 검사가 통과했다.

## 4. 자주 막히는 곳

| 증상 | 확인하고 고칠 것 |
|---|---|
| PR을 열었는데 검사가 시작되지 않는다 | 워크플로 파일이 `.github/workflows/` 아래에 있는지, 그 파일이 PR의 브랜치에 커밋되어 있는지 봅니다 |
| Install dependencies 단계가 실패한다 | `pnpm-lock.yaml`이 커밋되어 있는지 봅니다. `package.json`을 고쳤다면 로컬에서 `pnpm install`을 실행해 잠금 파일을 갱신하고 함께 커밋합니다 |
| 로컬에서는 통과하는데 CI에서 실패한다 | 러너는 저장소에 커밋된 파일만 봅니다. 커밋하지 않은 파일이 있는지 `git status`로 확인합니다 |
| `gh pr checks`가 “no checks reported”라고 한다 | 검사가 아직 등록되지 않았습니다. `--watch`를 붙여도 같은 메시지를 내고 바로 끝납니다. 5~10초 뒤에 다시 실행합니다 |
| 푸시가 `without workflow scope`로 거부된다 | `gh auth status`의 Token scopes에 `workflow`가 있는지 봅니다. 없으면 `gh auth refresh -s workflow`를 실행합니다 |
| 5단계의 검색 칸에 검사 이름이 나오지 않는다 | 검색 칸은 최근 일주일 동안 그 저장소에서 실행된 검사만 찾습니다. 3단계의 검사가 끝난 뒤에 다시 검색합니다 |
| Create를 눌렀더니 Confirm access 화면이 나온다 | GitHub가 설정을 바꾸기 전에 본인 확인을 요구하는 화면입니다. 화면이 안내하는 방법 가운데 하나로 확인합니다. 5단계의 명령으로 규칙을 걸 수도 있습니다 |
| `sed` 명령이 오류를 낸다 | macOS와 Linux의 `sed -i` 문법이 다릅니다. 편집기로 `src/todo.ts`의 오류 문구 한 줄을 직접 고칩니다 |

## 참고 자료

- GitHub Docs, “About protected branches”. 필수 상태 검사의 뜻과 요금제별 제공 범위. https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches (2026-11-24 확인)
- GitHub Docs, “Managing a branch protection rule”. 5단계의 설정 절차. https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule (2026-11-24 확인)
- pnpm/action-setup README. pnpm을 설치하는 액션의 사용법. https://github.com/pnpm/action-setup (2026-11-24 확인)
- actions/setup-node README. Node.js를 설치하는 액션의 사용법. https://github.com/actions/setup-node (2026-11-24 확인)
- GitHub CLI 설명서, `gh repo create`, `gh pr checks`, `gh run view`. https://cli.github.com/manual/
