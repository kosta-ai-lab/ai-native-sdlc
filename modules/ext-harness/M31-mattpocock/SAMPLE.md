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

## 2단계: 연습용 저장소 `dutch-pay` 준비

이 모듈 폴더의 `dutch-pay`를 강의 자료 저장소 밖으로 복사합니다. 터미널을 `M31-mattpocock` 폴더에서 열고 실행합니다.

macOS / Linux / Git Bash:
```bash
cp -r dutch-pay ~/dutch-pay
```

Windows PowerShell:
```powershell
Copy-Item -Recurse dutch-pay $HOME\dutch-pay
```

```bash
cd ~/dutch-pay
```

```bash
git init
```

```bash
npm test
```

```bash
node src/cli.js 30000 7
```

```bash
git add .
git commit -m "dutch-pay 초기 버전"
```

## 3단계: Claude Code CLI를 실행

플러그인을 설치할 때 Claude Code가 켜져 있었다면 완전히 종료한 뒤, `dutch-pay` 폴더에서 다시 실행합니다.

```bash
claude
```

## 4단계: 프롬프트가 뜨면 자연어로 지시

**저장소 설정** (저장소마다 한 번)

```text
/setup-matt-pocock-skills
```

질문에는 `Local markdown` → `yes`(기본 라벨) → `CLAUDE.md` → `yes`(초안 승인) 순서로 답합니다.

**아이디어 인터뷰** — 여기서부터 티켓까지 `/clear` 없이 한 창에서 진행

```text
/grill-with-docs 더치페이를 나누어 떨어지지 않는 금액으로 계산하면
남는 금액이 사라지는 문제가 있어. (30,000원을 7명이 나누면 5원이 사라짐)
남는 금액을 누가 낼지 정하는 기능을 추가하고 싶어.
```

질문 라운드에 답하는 예시입니다.

```text
Q1 yes. Q2는 (a) 총무가 내는 걸로. 총무는 항상 첫 번째 사람이야.
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
좋아, 이대로 만들어줘.
```

```text
!git add . && git commit -m "끝전 처리 스펙과 티켓"
```

**티켓 구현** — 티켓마다 `/clear` 후 새로 시작 (파일 이름은 실제 생성된 이름으로 바꿉니다)

```text
!git switch -c feature/remainder
```

```text
/clear
```

```text
/implement @.scratch/remainder-to-treasurer/issues/01-assign-remainder-to-treasurer.md
리뷰 기준점(fixed point)은 main 브랜치로 해줘.
```

```text
/clear
```

```text
/implement @.scratch/remainder-to-treasurer/issues/02-show-treasurer-share-in-cli.md
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
node src/cli.js 30000 7
```

```bash
git log --oneline main..HEAD
```

```bash
git status
```

기대 결과:
- `CLAUDE.md`(`## Agent skills` 블록)와 `docs/agents/issue-tracker.md`, `triage-labels.md`, `domain.md`가 생성된다.
- 루트에 `GLOSSARY.md`가 생기고 총액·1인 부담금·끝전·총무 같은 용어가 정의된다.
- `.scratch/<기능 이름>/spec.md`와 `.scratch/<기능 이름>/issues/01-….md`, `02-….md`가 생성된다.
- 구현 후 `node src/cli.js 30000 7`의 출력에서 총무 금액과 나머지 사람의 금액을 더하면 30,000원이 된다.
- `feature/remainder` 브랜치에 티켓별 커밋이 있고, 각 티켓마다 Standards / Spec 두 축 리뷰 결과가 대화에 남는다.
