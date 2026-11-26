# 모듈 08 · 단원 M01 — 테스트를 PR의 관문으로 걸기

> 상태: 초안 · 담당: 윤성열
> 검증 기준: GitHub Actions(ubuntu-latest, Node.js v24.22.3) · pnpm 12 · Vitest 3.2.6 · gh 2.105.0 · Claude Code 2.1.330(모델 Sonnet 5.5) · 2026-11-24

## 목적

로컬에서 통과한 테스트를 PR마다 GitHub Actions에서 다시 실행하고, 실패한 PR은 병합할 수 없게 합니다. [모듈 06](../../06-coding-tdd/README.md)에서 만든 테스트를 병합의 관문으로 거는 단원입니다.

이 단원의 뼈대는 이 과정의 네 가지 원칙입니다. ① AI는 제안하고, 결정은 사람이 한다. ② 말이 아니라 실행 결과로 확인한다. ③ 맡길수록 절차가 필요하다. ④ 앞 단계가 뒤 단계의 기준이다. 그래서 가이드의 단계는 **맡긴다 → 확인한다 → 정한다 → 넘긴다**의 마디로 나뉩니다. AI에게 맡기는 단계는 6단계 하나이고, 직접 하는 0~5단계는 ‘맡긴다’ 대신 ‘한다’로 시작합니다.

이 단원을 마치면 다음을 할 수 있습니다.

- 설치, 테스트, 타입 검사를 실행하는 GitHub Actions 워크플로를 작성한다.
- PR에 붙은 검사 결과를 `gh pr checks`로 확인하고, 실패 로그를 `gh run view --log-failed`로 읽는다.
- 검사를 필수로 지정해 실패한 PR의 병합을 막는다.
- CI의 실패를 AI에게 맡길 때 테스트와 인수조건을 고치지 못하게 요청한다.

## 이 단원에서 다루는 것

| 구분 | 내용 |
|---|---|
| 개념 | CI에서 테스트를 다시 실행하는 이유, 검사 실행과 병합 차단의 차이, CI가 막지 못하는 것 |
| 실습 | 워크플로 작성, 저장소에 올리기, PR에서 검사 확인, 일부러 실패시켜 보기, 필수 검사 지정, AI에게 실패 맡기기 |
| 실습 예제 | [todo-app/](todo-app/): 테스트 네 개가 통과하는 할 일 생성 기능. 모듈 06 단원 M02를 마친 상태입니다 |
| 필요한 것 | GitHub 계정, git, GitHub CLI(`gh`), Node.js, pnpm, Claude Code(6단계) |

## 문서 구성

| 자료 | 읽고 할 일 |
|---|---|
| [GUIDE.md](GUIDE.md) | 개념을 읽고 0~6단계를 따라 합니다 |
| [SAMPLE.md](SAMPLE.md) | 명령과 요청만 모은 실행용 요약입니다 |
| [todo-app/](todo-app/) | 실습 출발점입니다. 저장소 밖으로 복사해 씁니다 |
| [harness/.github/workflows/test.yml](harness/.github/workflows/test.yml) | 워크플로 완성본입니다 |

## 사전 준비물

- 이 강의 자료 저장소의 사본. 0단계의 명령을 저장소 루트 폴더에서 실행합니다.
- GitHub 계정과 GitHub CLI. `gh auth status`로 로그인 상태를 확인합니다.
- git, Node.js, pnpm. `git --version`, `node --version`, `pnpm --version`으로 확인합니다.
- Claude Code. 6단계에서만 씁니다.

## 산출물 4종 (체크리스트)

- [x] 가이드 — [GUIDE.md](GUIDE.md)
- [ ] 규칙 — 이 단원에는 없습니다. 테스트를 고치지 못하게 하는 규칙은 [모듈 06의 CLAUDE.md](../../06-coding-tdd/CLAUDE.md)에 있습니다.
- [x] 자동화 — [harness/.github/workflows/test.yml](harness/.github/workflows/test.yml)
- [x] 샘플 — [SAMPLE.md](SAMPLE.md)와 [todo-app/](todo-app/)

## 완료 기준

- [ ] 자기 저장소의 PR에 `Test and typecheck` 검사가 붙고 통과한다.
- [ ] 일부러 실패시킨 커밋에서 검사가 실패하고, 실패 로그에서 어긋난 기대를 찾았다.
- [ ] 필수 검사를 지정했고, 검사가 실패한 PR에서 병합이 막히는 것을 봤다.
- [ ] AI가 CI 실패를 고친 뒤 `test/`와 `docs/`가 바뀌지 않았다.

## 검증 기록 (2026-11-24)

- 워크플로는 이 강의 자료 저장소의 PR에서 실제로 실행했습니다. 실행한 워크플로는 `.github/workflows/practice-examples.yml`입니다. 단원의 완성본과 설치, 테스트, 타입 검사 단계가 같습니다. 다른 점은 예제 폴더에서 실행하는 설정(`working-directory`), 예제 폴더나 워크플로 파일이 바뀔 때만 도는 설정(`paths`), 앞선 실행을 취소하는 설정(`concurrency`), Checkout의 `persist-credentials: false`, 워크플로와 작업의 이름입니다.
  - 예제와 워크플로를 올린 커밋: 성공, 12초. 러너의 Node.js v24.22.3, `Tests  4 passed (4)`, 타입 검사 통과
  - 오류 문구를 일부러 바꾼 커밋: 실패, 11초. 테스트 2개 실패, 타입 검사 단계는 건너뜀
  - 되돌린 커밋: 성공, 14초
- `gh pr checks`와 `gh run view --log-failed`의 출력은 위 실행에서 옮겼습니다. `gh pr checks`의 출력은 스크립트로 받은 형식입니다.
- 가이드의 0~6단계는 공개 연습용 저장소(`my-todo-ci`)에서 처음부터 끝까지 한 번 따라 했습니다. 단원의 완성본을 그대로 저장소 루트에 넣었습니다.
  - 2단계: `gh repo create`로 저장소를 만들어 올리자 main 푸시로 실행이 시작됐고 8초 만에 성공했습니다.
  - 3단계: `gh pr create --fill`로 연 PR에서 검사가 9초 만에 통과했습니다. 직후의 `gh pr checks --watch`는 `no checks reported`를 내고 끝났고, 8초 뒤에 다시 실행하자 결과가 나왔습니다.
  - 4단계: 실패 9초, 되돌린 뒤 통과 12초. 보호 규칙이 없을 때 실패한 PR의 상태는 `MERGEABLE`, `UNSTABLE`이었습니다.
  - 5단계: 화면의 1~7번 이름을 확인했습니다. Create를 누르자 GitHub가 본인 확인을 요구해 화면에서는 저장하지 못했고, 같은 설정을 가이드의 명령(`gh api`)으로 걸었습니다. 그 뒤 실패한 PR은 `BLOCKED`가 됐고 `gh pr merge --squash`와 `--admin`이 모두 거부됐습니다. PR 화면의 Merge pull request 버튼은 누를 수 없는 상태였습니다.
  - 6단계: AI가 고친 커밋을 올리자 13초 만에 통과했고 PR이 병합됐습니다.
- 0단계의 명령(복사, 설치, 테스트, 타입 검사)은 저장소 밖의 사본에서 직접 실행했습니다.
- 6단계의 요청은 Claude Code 비대화형 모드(`claude -p`)로 세 번 실행했습니다. 로컬 사본에서 두 번, 연습용 저장소에서 한 번입니다. 설정 파일은 프로젝트 것만 읽게 했고 사용자 전역 지침 파일은 읽지 않게 했습니다. 허용한 실행 명령은 `pnpm test`, `git status`, `git diff`이고(연습용 저장소의 실행에서는 `pnpm typecheck`도 허용했습니다), 파일 수정은 묻지 않고 허용했습니다.
- 직접 확인하지 않은 것은 다음과 같습니다.
  - 5단계에서 Create를 눌러 화면으로 규칙을 저장하는 것. 본인 확인 화면에서 멈췄습니다.
  - 보호 규칙이 없을 때 검사가 실패한 PR의 병합 버튼이 화면에서 어떻게 보이는지. 상태는 명령으로만 확인했습니다.
  - `--private`으로 만든 저장소. 무료 계정에서 보호된 브랜치를 쓸 수 없다는 것은 GitHub 문서에서 옮겼습니다.
- 한계: 연습용 저장소에서의 실행은 한 번입니다. 러너와 액션의 버전은 바뀝니다. Claude Code의 대화형 화면, 터미널에 표로 나오는 gh 출력, 다른 운영체제의 로컬 명령은 확인하지 않았습니다. 0단계와 4단계의 명령은 macOS 터미널 기준입니다.

## 참고 자료

[GUIDE.md의 참고 자료](GUIDE.md#참고-자료)에 모았습니다.
