# 예제 실행 및 프롬프트

GUIDE.md의 흐름을 명령어와 프롬프트만 모아 놓은 실행용 요약입니다.
설명과 체크리스트는 [GUIDE.md](GUIDE.md)를 참고하세요.
명령은 **Claude Code** 기준입니다. Cursor에서는 `/add-plugin pstack`으로 설치하고, 명령에서 `pstack:` 접두어를 빼고 입력합니다.

## 1단계: pstack 설치

```bash
claude plugin marketplace add cursor/plugins
```

```bash
claude plugin install pstack@cursor-plugins
```

```bash
claude plugin list
```

설치 후 Claude Code를 완전히 종료했다가 다시 실행합니다.

## 2단계: 연습용 저장소 `todo-app` 준비

이 모듈 폴더의 `todo-app`을 강의 자료 저장소 밖으로 복사합니다. 터미널을 `M37-pstack` 폴더에서 열고 실행합니다.

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
git init -b main
```

```bash
npm test
```

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

```bash
git switch -c feature/recurring-todos
```

## 3단계: Claude Code CLI를 실행

```bash
claude
```

## 4단계: 프롬프트가 뜨면 자연어로 지시

**모델 설정과 검증 스킬** — 예산 `small`, 역할 표는 그대로, 검증 스킬 `yes`, 형식 검증 `no`

```text
/pstack:setup-pstack
```

```text
!git add .claude && git commit -m "verify-todo-app 검증 스킬 추가"
```

설정은 새 세션부터 적용되므로 `/exit` 후 `claude`를 다시 실행합니다.

**코드 이해하기** (읽기 전용)

```text
/pstack:how 할 일을 완료하면 어떤 순서로 처리되고 todos.json 에 어떻게 저장돼?
마감일은 어떤 형태로 다뤄지고 있어?
```

**기능 구현** — 새 대화에서, 결정할 것은 모두 프롬프트에 (`verify-todo-app`은 실제 생긴 이름으로)

```text
/clear
```

```text
/pstack:poteto-mode 반복 할 일 기능을 추가해줘.
지금은 "매주 월요일 분리수거"를 done 하면 다음 주 것을 손으로 다시 add 해야 해.

정해진 동작:
- node src/cli.js add <제목> <마감일> --every day|week 로 반복 할 일을 만든다. 반복 할 일은 마감일이 꼭 있어야 한다.
- 반복 할 일을 done 하면 그 순간 같은 제목의 다음 회차가 새 할 일로 추가된다.
  다음 마감일은 완료한 날이 아니라 원래 마감일 + 주기(1일 또는 7일)다.
- 목록에는 "[ ] 2. 분리수거 (마감 2026-11-23, 매주)" 처럼 주기를 함께 보여준다.
- 마감일 없는 반복, day/week 이외의 주기는 오류 메시지와 함께 종료 코드 1로 거부한다.

완료 조건: npm test 통과(기존 5개 포함), 2026-12-28 매주 반복을 완료하면 2027-01-04 회차가 생김.
증거: /verify-todo-app 으로 실제 CLI를 실행한 출력을 보여줘.
제약: 기존 할 일의 목록 출력 형식은 바꾸지 마. 의존성 추가 금지.
이 폴더의 현재 브랜치(feature/recurring-todos)에서 작업하고 커밋까지만 해. PR은 열지 마.
```

**깨뜨려 보기** — 새 대화에서

```text
/clear
```

```text
/pstack:interrogate main 이후 이 브랜치의 변경 전체를 회의적으로 봐줘.
실제 버그나 회귀가 아니면 지적하지 마.
```

찾은 문제가 있으면:

```text
/pstack:poteto-mode new task. interrogate 결과 1번을 고쳐줘. repro first, then fix and verify.
```

**주석 정리**

```text
/pstack:no-comments the diff
```

```text
!git add . && git commit -m "주석 정리"
```

**PR 열기** (선택, GitHub 저장소와 `gh` 로그인 필요)

```bash
gh repo create todo-app --private --source=. --remote=origin
```

```bash
git push -u origin main
```

```text
/pstack:poteto-mode feature/recurring-todos 브랜치로 main 에 PR을 열어줘.
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
ls .claude/skills/
```

```bash
git log --oneline main..HEAD
```

기대 결과:
- `~/.claude/rules/pstack-models.md`에 예산과 역할별 모델이 기록되어 있다.
- `.claude/skills/verify-todo-app/`에 `SKILL.md`와 `features/` 기능 지도가 있다.
- `done 1` 뒤 목록이 아래처럼 나온다. 새 회차의 마감일은 원래 마감일 + 7일이다.

  ```text
  [x] 1. 분리수거 (마감 2026-11-16, 매주)
  [ ] 2. 분리수거 (마감 2026-11-23, 매주)
  ```

- 마감일 없는 반복 할 일과 `--every month`는 오류 메시지로 거부된다.
- `/pstack:poteto-mode`의 최종 답변에 설계 시안 비교, 원칙 이름, 실제 CLI 출력이 들어 있다.
- `/pstack:interrogate` 보고서에 Intent / Findings / Dropped가 있다.
- `feature/recurring-todos` 브랜치에 작은 커밋 여러 개가 있다.
