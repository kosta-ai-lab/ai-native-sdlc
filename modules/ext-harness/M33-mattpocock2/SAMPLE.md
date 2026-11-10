# 예제 실행 및 프롬프트

GUIDE.md의 흐름을 명령어와 프롬프트만 모아 놓은 실행용 요약입니다.
설명과 체크리스트는 [GUIDE.md](GUIDE.md)를 참고하세요.

## 1단계: 플러그인 설치

```bash
claude plugin install mattpocock-skills@claude-plugins-official
```

```bash
claude plugin list
```

설치가 안 되면 저장소를 마켓플레이스로 추가해서 설치합니다.

```bash
claude plugin marketplace add mattpocock/skills
```

```bash
claude plugin install mattpocock-skills@mattpocock
```

## 2단계: 연습용 저장소 `todo-app` 준비

이 모듈 폴더의 `todo-app`을 강의 자료 저장소 밖으로 복사합니다. 터미널을 `M33-mattpocock2` 폴더에서 열고 실행합니다.

macOS / Linux / Git Bash:
```bash
cp -r todo-app ~/todo-app
```

Windows PowerShell:
```powershell
Copy-Item -Recurse todo-app $HOME\todo-app
```

```bash
cd ~/todo-app
```

```bash
git init
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

## 3단계: Claude Code CLI를 실행

플러그인을 설치할 때 Claude Code가 켜져 있었다면 완전히 종료한 뒤, `todo-app` 폴더에서 다시 실행합니다.

```bash
claude
```

## 4단계: 프롬프트가 뜨면 자연어로 지시

**저장소 설정** (저장소마다 한 번)

```text
/setup-matt-pocock-skills
```

질문에는 `Local markdown` → `yes`(기본 라벨) → `CLAUDE.md` → `yes`(초안 승인) 순서로 답합니다.

```text
!git add . && git commit -m "mattpocock skills 설정"
```

**아이디어 인터뷰** — 여기서부터 티켓까지 `/clear` 없이 한 창에서 진행

```text
/grill-with-docs 반복 할 일 기능을 추가하고 싶어.
지금은 "매주 월요일 분리수거"를 끝내면 다음 주 것을 매번 손으로 다시 add 해야 해.
반복으로 등록해 두면 완료할 때 다음 회차가 알아서 생겼으면 좋겠어.
```

질문 라운드에는 기본으로 `전부 추천대로 진행할게`라고 답하고, 추천 답이 아래 결정과 다른 질문만 직접 적어 덧붙입니다.

| 결정할 것 | 답 |
|---|---|
| 반복 주기 | 매일(day)·매주(week)만. 매월은 Out of Scope |
| 다음 회차가 생기는 때 | 완료하는 순간 |
| 다음 마감일 기준 | 원래 마감일 + 주기 |
| 마감일 없는 반복 할 일 | 허용하지 않음 |
| 지난 회차를 안 하고 넘어가면 | 쌓이지 않음. 완료할 때만 다음 회차 생성 |
| 반복 중단·삭제 | Out of Scope |
| 명령 형식 | `add <제목> <마감일> --every day\|week` |
| 목록 표시 | `(마감 2026-11-23, 매주)` 처럼 주기 함께 표시 |

```text
반복 할 일은 마감일이 꼭 있어야 해. 명령은 add <제목> <마감일> --every day 또는 week 로 하자.
반복 중단이나 삭제는 이번엔 안 할 거야.
```

**스펙 만들기**

```text
/to-spec
```

**티켓으로 쪼개기**

```text
/to-tickets
```

```text
다 좋아, 그대로 티켓 만들어줘.
```

```text
!git add . && git commit -m "반복 할 일 스펙과 티켓"
```

**첫 티켓을 TDD로 구현** — 티켓마다 `/clear` 후 새로 시작 (파일 이름은 실제 생성된 이름으로 바꿉니다)

```text
!git switch -c feature/recurring-todos
```

```text
/clear
```

```text
/tdd @.scratch/recurring-todos/issues/01-create-recurring-todo.md
```

```text
티켓 01의 완료 조건 체크박스를 갱신하고 커밋해줘.
```

**나머지 티켓 구현과 리뷰** — `/implement`가 tdd → code-review → 커밋까지 진행

```text
/clear
```

```text
/implement @.scratch/recurring-todos/issues/02-create-next-occurrence-on-complete.md
리뷰 기준점(fixed point)은 main 브랜치로 해줘.
```

```text
/clear
```

```text
/implement @.scratch/recurring-todos/issues/03-reject-invalid-recurrence.md
리뷰 기준점(fixed point)은 main 브랜치로 해줘.
```

**별도 리뷰** (선택, 새 창에서 플러그인 정식 이름으로)

```text
/mattpocock-skills:code-review main
```

**회고** (선택, 구현을 마친 창에서 `/clear` 전에)

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
git log --oneline main..HEAD
```

기대 결과:
- `CLAUDE.md`(`## Agent skills` 블록)와 `docs/agents/issue-tracker.md`, `triage-labels.md`, `domain.md`가 생성된다.
- 루트에 `GLOSSARY.md`가 생기고 할 일·마감일·반복 할 일·반복 주기·회차 같은 용어가 정의된다.
- `.scratch/<기능 이름>/spec.md`와 `.scratch/<기능 이름>/issues/01-….md`, `02-….md`, `03-….md`가 생성된다.
- `done 1` 뒤 목록이 아래처럼 나온다. 새 회차의 마감일은 원래 마감일 + 7일이다.

  ```text
  [x] 1. 분리수거 (마감 2026-11-16, 매주)
  [ ] 2. 분리수거 (마감 2026-11-23, 매주)
  ```

- 마감일 없는 반복 할 일과 `--every month`는 오류 메시지로 거부된다.
- `feature/recurring-todos` 브랜치에 티켓별 커밋이 있고, 각 티켓마다 Standards / Spec 두 축 리뷰 결과가 대화에 남는다.
