# 예제 실행 및 프롬프트

GUIDE.md의 흐름을 명령어와 프롬프트만 모아 놓은 실행용 요약입니다.
설명과 체크리스트는 [GUIDE.md](GUIDE.md)를 참고하세요.
Windows에서는 모든 터미널 명령을 **Git Bash**(또는 WSL)에서 실행합니다.

## 1단계: gstack 설치

Claude Code를 실행하고 공식 설치 문장을 붙여 넣습니다.

```bash
claude
```

```text
Install gstack: run git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack && cd ~/.claude/skills/gstack && ./setup then add a "gstack" section to CLAUDE.md that says to use the /browse skill from gstack for all web browsing and never use mcp__claude-in-chrome__* tools. Claude Code lists the installed skills itself, so the section needs no skill list. Then ask the user if they also want to add gstack to the current project so teammates get it.
```

또는 터미널에서 직접 설치합니다.

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
```

```bash
cd ~/.claude/skills/gstack && ./setup
```

```bash
cat ~/.claude/skills/gstack/VERSION
```

설치 후 Claude Code를 완전히 종료했다가 다시 실행합니다.

## 2단계: 연습용 저장소 `todo-app` 준비

이 모듈 폴더의 `todo-app`을 강의 자료 저장소 밖으로 복사합니다. 터미널을 `M35-gstack` 폴더에서 열고 실행합니다.

```bash
cp -r todo-app ~/todo-app
```

```bash
cd ~/todo-app
```

```bash
git init -b main
```

```bash
npm test
```

반복되는 일을 매번 다시 추가해야 하는 불편함을 확인합니다.

```bash
node src/cli.js add 분리수거 2026-11-16
```

```bash
node src/cli.js done 1
```

```bash
node -e "require('fs').rmSync('todos.json', { force: true })"
```

```bash
git add .
git commit -m "todo-app 초기 버전"
```

## 3단계: 기능 브랜치를 만들고 Claude Code 실행

```bash
git switch -c feature/recurring-todos
```

```bash
claude
```

## 4단계: 프롬프트가 뜨면 자연어로 지시

**오피스아워** — 목표를 물으면 `학습(Learning)`을 골라 Builder mode로 진행

```text
/office-hours 할 일 앱에 반복 할 일 기능을 넣고 싶어.
지금은 "매주 월요일 분리수거"를 끝내면 다음 주 것을 매번 손으로 다시 add 해야 해.
```

질문과 접근 방식 선택에는 아래 결정대로 답합니다.

| 결정할 것 | 답 |
|---|---|
| 범위 | 가장 작은 버전 (반복 중단·알림·연속 기록은 하지 않음) |
| 반복 주기 | 매일(day)·매주(week)만 |
| 다음 회차가 생기는 때 | 완료하는 순간 |
| 다음 마감일 기준 | 원래 마감일 + 주기 |
| 마감일 없는 반복 할 일 | 허용하지 않음 |
| 지난 회차를 안 하고 넘어가면 | 쌓이지 않음 |
| 명령 형식 | `add <제목> <마감일> --every day\|week` |
| 목록 표시 | `(마감 2026-11-23, 매주)` |

```text
가장 작은 버전으로 하자. 주기는 매일과 매주만, 완료하는 순간 다음 회차를 만들고,
다음 마감일은 원래 마감일에 주기를 더해. 반복 할 일은 마감일이 꼭 있어야 해.
명령은 add <제목> <마감일> --every day 또는 week, 목록에는 "(마감 2026-11-23, 매주)"처럼 보여줘.
반복 중단, 알림, 연속 기록은 이번엔 안 해.
```

**계획 + 자동 리뷰** — `Shift+Tab`으로 plan mode를 켠 뒤

```text
방금 만든 설계 문서대로 반복 할 일 기능의 구현 계획을 세워줘.
테스트는 test/todo.test.js 에 node:test 로 추가하는 걸로.
```

계획이 나오면 승인하기 전에 실행합니다. TASTE DECISIONS에 답한 뒤 계획을 승인하면 구현이 시작됩니다.

```text
/autoplan
```

**구현 확인과 커밋**

```text
!npm test
```

```text
!git add . && git commit -m "반복 할 일 기능 구현"
```

**코드 리뷰** — 새 대화에서

```text
/clear
```

```text
/review
```

```text
!npm test
```

```text
!git add . && git commit -m "review 반영"
```

**QA** — 새 대화에서

```text
/clear
```

```text
/qa 이 저장소의 CLI(node src/cli.js)를 테스트해줘.
반복 할 일의 add / done / list, 잘못된 입력(마감일 없음, --every month, 없는 번호),
종료 코드와 오류 메시지, 월말·연말을 넘는 다음 마감일을 확인해줘.
todos.json 은 임시 폴더에서 만들어서 쓰고, 외부 서비스에는 접속하지 마.
```

**PR 출시** (선택, GitHub 저장소와 `gh` 로그인 필요)

```bash
gh auth status
```

```bash
gh repo create todo-app --private --source=. --remote=origin
```

```bash
git push -u origin main
```

```text
/ship
```

**회고** (선택)

```text
/retro
```

## 5단계: 결과 확인

```bash
npm test
```

```bash
node -e "require('fs').rmSync('todos.json', { force: true })"
```

```bash
node src/cli.js add 분리수거 2026-11-16 --every week
```

```bash
node src/cli.js done 1
```

```bash
node src/cli.js add "물 마시기" --every day
```

```bash
node src/cli.js add 운동 2026-11-16 --every month
```

```bash
ls ~/.gstack/projects/*/
```

```bash
ls .gstack/qa-reports/
```

```bash
git log --oneline main..HEAD
```

기대 결과:
- `~/.gstack/projects/<프로젝트>/` 아래에 `-design-`이 들어간 설계 문서와 리뷰 기록이 생긴다.
- `done 1` 뒤 목록이 아래처럼 나온다. 새 회차의 마감일은 원래 마감일 + 7일이다.

  ```text
  [x] 1. 분리수거 (마감 2026-11-16, 매주)
  [ ] 2. 분리수거 (마감 2026-11-23, 매주)
  ```

- 마감일 없는 반복 할 일과 `--every month`는 오류 메시지로 거부된다.
- `.gstack/qa-reports/`에 QA 보고서가 있고, "테스트하지 못한 것"이 따로 적혀 있다.
- `feature/recurring-todos` 브랜치에 구현·리뷰 반영(·QA 수정) 커밋이 있다.
- (`/ship`을 했다면) GitHub에 `feature/recurring-todos` → `main` PR이 생성되어 있다.
