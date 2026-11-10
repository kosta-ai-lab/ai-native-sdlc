# 예제 실행 및 프롬프트

GUIDE.md의 흐름을 명령어와 프롬프트만 모아 놓은 실행용 요약입니다.
설명과 체크리스트는 [GUIDE.md](GUIDE.md)를 참고하세요.

## 1단계: 플러그인 설치

```bash
claude plugin marketplace add vibemafiaclub/mafia-codereview-harness
```

```bash
claude plugin install mafia-codereview@mafia-codereview-harness
```

```bash
claude plugin list
```

설치 후 Claude Code를 완전히 종료했다가 다시 실행합니다.

## 2단계: 연습용 저장소 `todo-app` 준비

이 모듈 폴더의 `todo-app`(리뷰 기준 문서 `docs/code-convention.yaml`, `docs/adr.yaml` 포함)을 강의 자료 저장소 밖으로 복사합니다. 터미널을 `M39-mafia` 폴더에서 열고 실행합니다.

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

> 아래는 모두 **한 대화 창**에서 이어서 진행합니다. 중간에 `/clear` 하지 않습니다.

**설계 논의** (코드는 아직 쓰지 않음)

```text
반복 할 일 기능을 추가하려고 해. 코드는 아직 쓰지 말고 설계부터 같이 정하자.
지금은 "매주 월요일 분리수거"를 done 하면 다음 주 것을 손으로 다시 add 해야 해.
내가 정한 것:
- 주기는 매일(day)·매주(week)만. 매월은 이번엔 안 함
- 반복 할 일을 done 하는 순간 같은 제목의 다음 회차를 새 할 일로 추가
- 다음 마감일은 완료한 날이 아니라 원래 마감일 + 주기 (늦게 끝내도 요일이 밀리지 않게)
- 반복 할 일은 마감일 필수. 명령은 add <제목> <마감일> --every day|week
- 목록에는 "[ ] 2. 분리수거 (마감 2026-11-23, 매주)" 처럼 주기를 표시
- 반복 중단·삭제는 이번엔 안 함
docs/code-convention.yaml 과 docs/adr.yaml 을 읽고, 데이터 모양과 날짜 계산 방법을 제안해줘.
```

**구현**

```text
좋아, 그대로 구현해줘. 테스트는 test/todo.test.js 에 추가하고,
2026-12-28 매주 반복을 완료하면 2027-01-04 회차가 생기는 테스트도 넣어줘.
```

```text
!npm test
```

```text
!git add . && git commit -m "반복 할 일 기능 구현"
```

**코드리뷰 파이프라인**

```text
/mafia-codereview:auto
```

단계별로 이렇게 답합니다.

| 단계 | 답하기 예시 |
|---|---|
| [1] 상태 점검 | `yes` (branch: feature/recurring-todos, base: main 확인) |
| [2] 설계의도 논의점 | `마감일 없는 할 일을 반복으로 바꾸는 기능은 의도적으로 제외. 이미 완료된 할 일을 다시 done 하면 회차를 또 만들지 않아야 해. repeat 이 없으면 일반 할 일이야.` |
| [3] 평가기준 논의점 | `GEN-001은 테스트 파일에는 적용하지 마. 주기 일수는 매직 넘버에 해당돼. ADR-003은 web 전용이니 제외.` |
| [4] PR 본문 논의점 | `Breaking Changes 는 없음. 관련 이슈 없음, Related 에는 ADR-002 만.` |
| [5] 코드리뷰 | (자동 진행, 답할 것 없음) |
| [6] 리뷰 반영 판단 | `좋아, 제안대로 진행해줘.` |

리뷰 반영 커밋이 현재 브랜치에 없으면:

```text
리뷰 반영 커밋이 지금 브랜치(feature/recurring-todos)에 없어. 워크트리의 변경을 이 브랜치로 가져와줘.
```

**기준 문서 업데이트**

```text
/mafia-codereview:update-docs
```

```text
!git add docs && git commit -m "반복 할 일 작업의 결정을 기준 문서에 반영"
```

**PR 열기** (선택, GitHub 저장소와 `gh` 로그인 필요)

```bash
gh pr create --base main --title "feat: 반복 할 일" --body-file .review-artifacts/feature/recurring-todos/pr-body.md
```

## 5단계: 결과 확인

```bash
ls .review-artifacts/feature/recurring-todos/
```

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
git log --oneline main..HEAD
```

기대 결과:
- `.review-artifacts/feature/recurring-todos/`에 `design-intent.md`, `code-quality-guide.md`, `pr-body.md`, `review-comments.md` 4개 파일이 있다.
- `code-quality-guide.md`에 ADR-001·ADR-002가 적용 방법과 함께 들어 있고, ADR-003은 빠져 있다.
- `review-comments.md`의 코멘트는 `[p1]`~`[p4]`로 분류되고, 각각 근거와 판정(ACCEPT / REJECT)이 붙어 있다.
- `done 1` 뒤 목록이 아래처럼 나온다.

  ```text
  [x] 1. 분리수거 (마감 2026-11-16, 매주)
  [ ] 2. 분리수거 (마감 2026-11-23, 매주)
  ```

- `feature/recurring-todos` 브랜치에 구현 → 리뷰 반영 → 기준 문서 반영 커밋이 있다.
