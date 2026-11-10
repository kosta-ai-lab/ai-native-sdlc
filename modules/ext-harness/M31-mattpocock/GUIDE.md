# 개념

**mattpocock/skills**는 TypeScript 강사 Matt Pocock이 매일 실무에서 쓰는 **에이전트 스킬 모음**입니다.
Claude Code, Codex, Copilot 같은 코딩 에이전트에 설치해서 `/grill-with-docs`, `/to-spec`, `/implement` 같은 슬래시 명령으로 부릅니다.
무료 오픈소스(MIT 라이선스)이며, Claude Code에서는 **플러그인**(`mattpocock-skills`) 한 번 설치로 스킬 27개가 한꺼번에 들어옵니다.

저자가 내세우는 방향은 "바이브 코딩이 아니라 **진짜 엔지니어링**"입니다.
GSD·BMAD·Spec-Kit처럼 개발 과정 전체를 대신 쥐는 프레임워크와 달리, 이 스킬들은 **작고, 고치기 쉽고, 서로 조합**해서 쓰도록 만들어졌습니다.
각 스킬은 결국 `SKILL.md` 마크다운 파일 하나이므로, 읽어 보고 내 입맛대로 고쳐 쓸 수 있습니다.

> 이 가이드는 mattpocock-skills **1.3.2** (2026-10-31 커밋 `4ae2317`) 를 기준으로 작성했습니다. 버전이 올라가면 스킬 이름·질문 내용·출력이 조금 달라질 수 있습니다.

## 이 스킬들이 고치려는 4가지 문제

| 문제 | 증상 | 해결 스킬 |
|---|---|---|
| **1. 에이전트가 내 뜻대로 안 한다** | 다 만들고 나서야 "그게 아닌데…" | `/grill-with-docs`, `/grill-me` — 시작 전에 에이전트가 나를 **꼬치꼬치 인터뷰** |
| **2. 에이전트가 너무 장황하다** | 한 단어면 될 걸 스무 단어로 설명 | `/grill-with-docs` — 프로젝트 **용어집(`GLOSSARY.md`)** 을 함께 만듦 |
| **3. 코드가 동작하지 않는다** | 테스트 없이 "다 됐습니다" | `/tdd`, `/diagnosing-bugs` — **빨강→초록** 피드백 루프 |
| **4. 진흙덩어리 코드가 된다** | 빨리 만든 만큼 빨리 복잡해짐 | `/to-spec`, `/improve-codebase-architecture` — **설계를 매일 챙김** |

## 핵심 개념 6가지

### 1. Skill (스킬)과 두 가지 호출 방식
스킬은 `skills/<분류>/<이름>/SKILL.md` 파일 하나로 된 "에이전트용 작업 설명서"입니다. 이 저장소의 스킬은 **누가 부를 수 있는가**로 둘로 나뉩니다.

- **User-invoked (사용자 호출)**: **사람이 `/이름`을 직접 입력해야만** 실행됩니다. 흐름을 지휘하는 역할입니다. 예) `/grill-with-docs`, `/to-spec`, `/to-tickets`, `/implement`
- **Model-invoked (모델 호출)**: 사람이 불러도 되고, **상황이 맞으면 에이전트가 알아서** 꺼내 씁니다. 재사용되는 규율을 담고 있습니다. 예) `tdd`, `code-review`, `grilling`, `domain-modeling`

사용자 호출 스킬은 내부에서 모델 호출 스킬을 부릅니다. 예를 들어 `/implement`는 안에서 `tdd`와 `code-review`를 부릅니다.

### 2. Grilling (그릴링, 꼬치꼬치 인터뷰)
에이전트가 나에게 질문을 **라운드(round)** 단위로 묶어서 던집니다. 질문마다 **추천 답(➡️)** 이 붙어 있어서 `yes`만 입력하면 추천 답을 받아들인 것이 됩니다.
결정 하나가 정해지면 그 결정에 딸린 다음 질문들이 열리고(이를 **frontier, 최전선**이라 부름), 더 물을 것이 없을 때 끝납니다.
**사실 확인**(파일에 뭐가 있는지 등)은 에이전트가 직접 하고, **결정**만 사람에게 묻는 것이 원칙입니다.

### 3. Shared Language (공유 언어) — `GLOSSARY.md`와 ADR
- **`GLOSSARY.md`**: 이 프로젝트에서만 쓰는 용어를 한두 문장으로 정의하고, 쓰지 말아야 할 동의어를 `_Avoid_`로 적는 용어집입니다. 에이전트가 이 용어로 말하고, 변수·함수 이름도 이 용어로 짓게 됩니다.
- **ADR (Architecture Decision Record)**: `docs/adr/0001-제목.md` 형태의 짧은 결정 기록입니다. **되돌리기 어렵고, 맥락 없이 보면 이상하고, 진짜 대안 중에 고른 결정**일 때만 만듭니다. 그래서 작은 실습에서는 ADR이 안 생길 수도 있습니다.

### 4. Issue Tracker (이슈 트래커)
스펙과 티켓을 어디에 저장할지 정한 곳입니다. GitHub Issues, GitLab Issues, **로컬 마크다운 파일**(`.scratch/` 폴더) 중에서 고릅니다.
이 가이드는 GitHub 계정 없이도 따라 할 수 있도록 **로컬 마크다운**을 사용합니다.

### 5. Tracer-bullet Ticket (예광탄 티켓)과 Blocking Edge
큰 작업을 **세로로 얇게 자른 조각**(티켓)으로 나눕니다. 각 티켓은 혼자서도 끝까지 동작을 확인할 수 있어야 하고, 새 대화 창 하나에 들어갈 만큼 작아야 합니다.
티켓마다 "이 티켓보다 먼저 끝나야 하는 티켓"(**Blocked by**, 막는 간선)을 적어서 작업 순서를 표시합니다.

### 6. Seam (이음매)과 Two-axis Review (두 축 리뷰)
- **Seam**: 테스트를 거는 공개 경계(함수·모듈의 바깥 인터페이스)입니다. `/tdd`는 테스트를 쓰기 전에 **어느 seam에서 테스트할지 사람에게 먼저 확인**받습니다.
- **Two-axis review**: `code-review`는 변경분을 두 서브에이전트가 따로 봅니다. **Standards**(저장소 코딩 규칙·코드 냄새를 지켰나)와 **Spec**(스펙대로 만들었나)입니다. 두 결과를 섞지 않고 나란히 보여 줍니다.

## 추가로 알아두면 좋은 개념

| 개념 | 설명 |
|---|---|
| **`/setup-matt-pocock-skills`** | 저장소마다 **한 번** 실행하는 준비 스킬. 이슈 트래커·트리아지 라벨·용어집 위치를 정해서 `docs/agents/`에 적고, `CLAUDE.md`에 `## Agent skills` 블록을 추가합니다. |
| **`/ask-matt`** | "지금 상황엔 어떤 스킬을 써야 하지?"를 물어보는 길잡이 스킬. 스킬이 기억나지 않을 때 씁니다. |
| **Context hygiene (맥락 위생)** | `grill-with-docs → to-spec → to-tickets`는 **한 대화 창에서 끊지 않고** 진행하고, 티켓 구현(`/implement`)은 티켓마다 `/clear`로 비운 **새 창**에서 시작합니다. |
| **Smart zone** | 모델이 또렷하게 추론하는 대화 길이(최신 모델 기준 약 15만 토큰). 넘어갈 것 같으면 단계 경계에서 `/compact` 합니다. |
| **Plugin 접두어** | 플러그인으로 설치한 스킬의 정식 이름은 `/mattpocock-skills:grill-with-docs`처럼 앞에 플러그인 이름이 붙습니다. 보통은 `/grill-with-docs`만 입력해도 되지만, Claude Code 기본 명령과 이름이 겹치는 `code-review`·`research`·`prototype`은 **정식 이름**으로 부르는 것이 안전합니다. |
| **skills.sh 설치** | `npx skills@latest add mattpocock/skills`로 스킬 파일을 내 프로젝트에 **복사**하는 방식. 직접 고칠 수 있지만 자동 업데이트가 없습니다. **플러그인과 둘 중 하나만** 고르세요. 둘 다 깔면 스킬이 두 벌이 됩니다. |

## mattpocock/skills의 기본 사이클 (Main flow)

> 이 가이드는 처음 써보는 사람을 위한 **가장 기본적인 흐름**만 다룹니다.
> **설치 → 저장소 준비(setup) → 인터뷰(grill) → 스펙 → 티켓 → 구현(TDD + 리뷰)**
> 미리 준비된 작은 연습용 프로젝트(`dutch-pay` 폴더, 더치페이 계산기)를 복사해서 이 흐름을 한 바퀴 돌아봅니다.

```
플러그인 설치 (한 번)
   │
   ▼
/setup-matt-pocock-skills   ← 저장소마다 한 번
   │
   ▼
┌─────────── 한 대화 창에서 이어서 ───────────┐
│ /grill-with-docs  아이디어를 인터뷰로 다듬기 │ → GLOSSARY.md, (ADR)
│        ▼                                    │
│ /to-spec          대화를 스펙으로 정리       │ → .scratch/<기능>/spec.md
│        ▼                                    │
│ /to-tickets       스펙을 티켓으로 쪼개기     │ → .scratch/<기능>/issues/01-….md
└─────────────────────────────────────────────┘
   │
   ▼  (/clear 후 티켓마다 새 창)
/implement 01 → tdd(빨강→초록) → code-review → 커밋
/implement 02 → …
```

**출처·재사용 범위:** 원출처는 [mattpocock/skills](https://github.com/mattpocock/skills)이며 저장소의 LICENSE는 MIT(Copyright (c) 2026 Matt Pocock)입니다. 이 가이드는 원문을 그대로 옮기지 않고, 공식 README와 각 `SKILL.md`의 내용을 바탕으로 한국어로 새로 설명한 것입니다. 원문을 복사·변형해 배포하는 경우에는 해당 버전·원 경로를 기록하고 LICENSE의 저작권/허락 고지를 보존하세요. 연습용 저장소 `dutch-pay`(이 모듈의 `dutch-pay` 폴더)와 예시 프롬프트·예시 답변은 이 가이드에서 새로 만든 것입니다.

각 단계는 [공식 README](https://github.com/mattpocock/skills)의 Installation 순서와 [`ask-matt`](https://github.com/mattpocock/skills/blob/main/skills/engineering/ask-matt/SKILL.md) 스킬이 설명하는 Main flow를 따릅니다.

| 이 가이드 | 공식 문서 |
|---|---|
| 0 단계: 준비하기 | (가이드에서 추가) |
| 1 단계: 플러그인 설치 | README › Installation › 1. Get the skills |
| 2 단계: 연습용 저장소 준비하기 | (가이드에서 추가한 실습 준비, `dutch-pay` 폴더 제공) |
| 3 단계: 저장소 설정 | README › Installation › 2. Run `/setup-matt-pocock-skills` |
| 4 단계: 아이디어 인터뷰 | ask-matt › The main flow › 1. `/grill-with-docs` |
| 5 단계: 스펙 만들기 | ask-matt › The main flow › 3. `/to-spec` |
| 6 단계: 티켓으로 쪼개기 | ask-matt › The main flow › 3. `/to-tickets` |
| 7 단계: 티켓 구현과 리뷰 | ask-matt › The main flow › 3. `/implement` (`/tdd` + `/code-review`) |

---

# 0 단계: 준비하기

- macOS / Windows / Linux 컴퓨터
- **Node.js 20 이상** ([nodejs.org](https://nodejs.org)에서 LTS 버전 설치) — 연습용 프로젝트를 실행하는 데만 씁니다.
- **git**
- **Claude Code** (설치와 로그인이 끝난 상태)

터미널(Windows는 PowerShell)을 열고 세 가지가 모두 준비됐는지 확인합니다.

```bash
node -v
```

```bash
git --version
```

```bash
claude --version
```

## 규칙
> `claude --version`이 동작하지 않으면 Claude Code부터 설치하고 `claude`를 한 번 실행해 로그인하세요.

> git을 처음 쓴다면 커밋에 쓸 이름과 이메일을 먼저 등록합니다.
> `git config --global user.name "내 이름"` / `git config --global user.email "내 이메일"`

## 산출물
- 없음 (환경 확인만 합니다)

## 체크리스트
- [ ] `node -v`가 v20 이상인지 확인한다.
- [ ] `git --version`과 `claude --version`이 버전 번호를 출력하는지 확인한다.

# 1 단계: 플러그인 설치

1. 터미널에서 Claude Code 공식 마켓플레이스로 플러그인을 설치합니다.

   ```bash
   claude plugin install mattpocock-skills@claude-plugins-official
   ```

2. 설치됐는지 확인합니다.

   ```bash
   claude plugin list
   ```

   목록에 `mattpocock-skills`가 보이면 성공입니다.

3. 위 1번이 "플러그인을 찾을 수 없다"는 오류로 실패하면, 저장소 자체를 마켓플레이스로 추가해서 설치합니다.

   ```bash
   claude plugin marketplace add mattpocock/skills
   ```

   ```bash
   claude plugin install mattpocock-skills@mattpocock
   ```

## 규칙
> Claude Code가 이미 켜져 있었다면 **완전히 종료한 뒤 다시 실행**해야 새 스킬이 보입니다.

> 플러그인은 **자동으로 업데이트**됩니다. 스킬 파일을 직접 고치고 싶다면 플러그인 대신 `npx skills@latest add mattpocock/skills`(skills.sh)로 설치하세요. **둘 중 하나만** 설치합니다. 둘 다 설치하면 모든 스킬이 두 번씩 보입니다.

> 제거는 `claude plugin uninstall mattpocock-skills` 입니다.

## 산출물
- Claude Code에 설치된 `mattpocock-skills` 플러그인 (스킬 27개)

## 체크리스트
- [ ] `claude plugin list`에 `mattpocock-skills`가 표시되는지 확인한다.
- [ ] (2단계 이후) Claude Code 입력창에 `/grill`을 쳤을 때 자동완성에 `grill-with-docs`가 뜨는지 확인한다.

# 2 단계: 연습용 저장소 준비하기

스킬을 시험할 대상이 필요합니다. 여러 사람이 밥값을 똑같이 나누는 작은 CLI `dutch-pay`를 **이 모듈 폴더에 미리 만들어 두었습니다.** 코드를 직접 칠 필요 없이 복사해서 씁니다.

이 코드에는 일부러 남겨 둔 **문제**가 하나 있습니다. 30,000원을 7명이 나누면 1인당 4,285원이 나오는데, 7명 × 4,285원 = 29,995원이라 **5원이 사라집니다.** 4단계부터 이 문제를 스킬로 해결합니다.

## 미리 만들어 둔 파일

```
M31-mattpocock/
└── dutch-pay/
    ├── package.json        npm test 로 테스트를 실행하는 설정 (의존성 없음)
    ├── src/
    │   ├── split.js        splitEvenly(총액, 인원수) — 1인 부담금 계산 (남는 금액은 버림)
    │   └── cli.js          명령어 처리: node src/cli.js <총액> <인원수>
    └── test/
        └── split.test.js   splitEvenly 의 동작을 확인하는 테스트 2개
```

<details>
<summary><code>src/split.js</code> 핵심 코드 보기</summary>

```js
export function splitEvenly(total, people) {
  // (입력 검사 생략)
  return Math.floor(total / people);   // ← 나누어 떨어지지 않으면 남는 금액(끝전)이 버려진다
}
```

끝전 처리 기능은 주로 이 파일과 `src/cli.js`를 고쳐서 만들게 됩니다. 전체 코드는 `dutch-pay/src/split.js`를 열어 보세요.

</details>

## 따라 하기

1. `dutch-pay` 폴더를 **강의 자료 저장소 밖**의 작업할 위치로 복사합니다. 아래는 홈 폴더로 복사하는 예입니다. 터미널을 `M31-mattpocock` 폴더에서 열고 실행하세요.

   macOS / Linux / Git Bash:
   ```bash
   cp -r dutch-pay ~/dutch-pay
   ```

   Windows PowerShell:
   ```powershell
   Copy-Item -Recurse dutch-pay $HOME\dutch-pay
   ```

   파일 탐색기에서 `dutch-pay` 폴더를 복사해 붙여 넣어도 됩니다.

2. 복사한 폴더로 이동해서 git 저장소로 초기화합니다.

   ```bash
   cd ~/dutch-pay
   ```

   ```bash
   git init
   ```

3. 테스트와 실행을 확인합니다.

   ```bash
   npm test
   ```

   ```bash
   node src/cli.js 30000 7
   ```

   `1인당 4,285원`이 출력됩니다. (5원이 어디로 갔는지는 알려 주지 않습니다.)

4. 첫 커밋을 만듭니다.

   ```bash
   git add .
   git commit -m "dutch-pay 초기 버전"
   ```

## 규칙
> **반드시 강의 자료 저장소 밖으로 복사**해서 실습합니다. `M31-mattpocock/dutch-pay`에서 바로 하면 강의 자료 저장소 안에 또 다른 git 저장소가 생기고, 실습 중 만든 파일과 커밋이 강의 자료와 섞입니다. 원본 `dutch-pay` 폴더는 다시 실습할 때를 위해 그대로 둡니다.

> 이후 모든 단계는 **복사한 `dutch-pay` 폴더 안에서** 진행합니다.

## 산출물
- 작업 위치의 `dutch-pay/` 저장소 (`package.json`, `src/split.js`, `src/cli.js`, `test/split.test.js`)
- 첫 커밋 1개

## 체크리스트
- [ ] `npm test`에서 테스트 2개가 모두 통과(pass 2)하는지 확인한다.
- [ ] `node src/cli.js 30000 7`이 `1인당 4,285원`을 출력하는지 확인한다.
- [ ] `git log --oneline`에 커밋이 1개 있는지 확인한다.

# 3 단계: 저장소 설정 — `/setup-matt-pocock-skills`

다른 엔지니어링 스킬들이 "스펙은 어디에 쓰지? 용어집은 어디 있지?"를 알 수 있도록 저장소를 한 번 설정합니다.

1. `dutch-pay` 폴더에서 Claude Code를 실행합니다.

   ```bash
   claude
   ```

2. 입력창에 아래를 입력합니다.

   ```text
   /setup-matt-pocock-skills
   ```

3. 에이전트가 저장소를 살펴본 뒤, 섹션별로 하나씩 묻습니다. 아래처럼 답합니다.

   | 에이전트의 질문 (요지) | 이렇게 답하기 |
   |---|---|
   | **Section A. 이슈 트래커**를 어디로 할까요? (GitHub / GitLab / Local markdown / Other) | `Local markdown` |
   | **Section B. 기본 트리아지 라벨**을 그대로 쓸까요? | `yes` |
   | `CLAUDE.md`와 `AGENTS.md`가 둘 다 없는데 어느 쪽을 만들까요? | `CLAUDE.md` |
   | 작성할 파일 초안을 보여 드립니다. 이대로 쓸까요? | `yes` |

   용어집 위치(Section C)는 단일 저장소이므로 묻지 않고 **single-context**(루트 `GLOSSARY.md` + `docs/adr/`)로 정합니다.

4. 생긴 파일을 확인하고 커밋합니다. (Claude Code 안에서 `!`를 앞에 붙이면 셸 명령을 바로 실행할 수 있습니다.)

   ```text
   !git status
   ```

   ```text
   !git add . && git commit -m "mattpocock skills 설정"
   ```

## 규칙
> 이 스킬은 **저장소마다 한 번**만 실행합니다. 나중에 바꾸고 싶으면 `docs/agents/*.md`를 직접 고치면 됩니다. 이슈 트래커를 통째로 바꿀 때만 다시 실행합니다.

> GitHub를 고르면 `gh` CLI 로그인과 원격 저장소(`git remote`)가 필요합니다. 처음 실습에서는 **Local markdown**을 권장합니다.

> 이 스킬은 정해진 스크립트가 아니라 **프롬프트로 동작**합니다. 질문 문장은 조금씩 다를 수 있으니 위 표의 "요지"를 보고 답하세요.

## 산출물
- `CLAUDE.md` — `## Agent skills` 블록(이슈 트래커 / 트리아지 라벨 / 도메인 문서 안내)
- `docs/agents/issue-tracker.md` — "스펙·티켓은 `.scratch/<기능>/`에 마크다운으로 쓴다"
- `docs/agents/triage-labels.md` — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`
- `docs/agents/domain.md` — `GLOSSARY.md`와 `docs/adr/`를 읽는 규칙

## 체크리스트
- [ ] `CLAUDE.md`에 `## Agent skills` 제목이 있는지 확인한다.
- [ ] `docs/agents/` 폴더에 `.md` 파일 3개가 생겼는지 확인한다.
- [ ] `docs/agents/issue-tracker.md`에 `.scratch/`가 언급되는지 확인한다.

# 4 단계: 아이디어 인터뷰 — `/grill-with-docs`

"5원이 사라지는 문제"를 고치려 합니다. 바로 코드를 시키지 않고, 먼저 에이전트가 **나를 인터뷰**하게 해서 무엇을 만들지 합의합니다.

1. 3단계와 같은 대화 창에서(또는 `claude`를 새로 실행해서) 아래를 입력합니다.

   ```text
   /grill-with-docs 더치페이를 나누어 떨어지지 않는 금액으로 계산하면
   남는 금액이 사라지는 문제가 있어. (30,000원을 7명이 나누면 5원이 사라짐)
   남는 금액을 누가 낼지 정하는 기능을 추가하고 싶어.
   ```

2. 에이전트가 코드를 먼저 읽은 뒤, 아래와 같은 모양으로 **질문 묶음(라운드)** 을 보냅니다. (예시이며 실제 질문은 매번 다릅니다.)

   ```text
   ❓ Q1 - 남는 금액의 이름: "남는 금액"을 용어집에서 "끝전"이라고 부를까요?
   ➡️ 네, "끝전"으로 하고 "나머지", "자투리"는 피할 말로 둡니다.

   ❓ Q2 - 끝전을 누가 내나요? (a) 총무 한 명 (b) 앞사람부터 1원씩 (c) 올림해서 모두 조금씩 더
   ➡️ (a) 총무 한 명이 냅니다.
   ```

3. 추천 답이 마음에 들면 `yes`, 아니면 질문 번호를 붙여 직접 답합니다.

   ```text
   Q1 yes. Q2는 (a) 총무가 내는 걸로. 총무는 항상 첫 번째 사람이야.
   ```

4. 질문이 더 나오지 않으면 에이전트가 정리한 내용을 보여 주고 "이해한 내용이 맞나요?"라고 확인합니다. 맞으면 `yes`라고 답합니다.

5. 인터뷰 도중 용어가 정해질 때마다 `GLOSSARY.md`가 바로 갱신됩니다. 다른 터미널에서 내용을 확인해 봅니다. (예시)

   ```markdown
   # 더치페이

   여러 사람이 한 번의 지출을 나누어 내는 계산.

   ## Language

   **총액**:
   나누기 전 한 번의 지출 전체 금액.
   _Avoid_: 합계, 전체 금액

   **1인 부담금**:
   총액을 인원수로 똑같이 나눈 뒤 각자가 내는 기본 금액.
   _Avoid_: 1인당 금액, 몫

   **끝전**:
   총액을 1인 부담금 × 인원수로 나누고 남는 금액. 총무가 낸다.
   _Avoid_: 나머지, 자투리

   **총무**:
   모임에서 끝전을 내는 사람. 항상 첫 번째 사람이다.
   _Avoid_: 대표, 리더
   ```

## 규칙
> **사실은 에이전트가, 결정은 사람이** 합니다. 에이전트가 "파일에 뭐가 있나요?"처럼 직접 확인할 수 있는 것을 묻지는 않습니다. 대신 "끝전을 누가 내나요?" 같은 결정을 묻습니다.

> 질문에 모두 답하기 전에는 에이전트가 **코드를 고치지 않습니다.** 인터뷰가 끝난 뒤에도 바로 구현하지 말고 5단계로 넘어갑니다.

> 저장소가 없는 일(기획서, 글쓰기 등)을 다듬을 때는 기록을 남기지 않는 `/grill-me`를 씁니다. 저장소가 있다면 항상 `/grill-with-docs`가 낫습니다.

> ADR은 "되돌리기 어렵고, 이상해 보이고, 진짜 대안 중에 고른" 결정일 때만 만들어집니다. 이 실습에서는 **ADR이 생기지 않아도 정상**입니다.

> **이 단계부터 6단계까지는 `/clear`나 `/compact` 없이 한 대화 창에서** 이어서 진행합니다. 스펙과 티켓이 인터뷰 내용을 그대로 이어받아야 하기 때문입니다.

## 산출물
- `GLOSSARY.md` — 총액, 1인 부담금, 끝전, 총무 등 이 프로젝트의 용어
- (선택) `docs/adr/0001-….md` — 중요한 결정이 있었을 때만
- 에이전트와 합의된 기능 설명 (대화 창 안)

## 체크리스트
- [ ] 저장소 루트에 `GLOSSARY.md`가 생겼는지 확인한다.
- [ ] 각 용어에 한두 문장 정의와 `_Avoid_` 줄이 있는지 확인한다.
- [ ] "끝전을 누가 내는가"에 대한 결정이 대화에서 확정됐는지 확인한다.

# 5 단계: 스펙 만들기 — `/to-spec`

인터뷰한 내용을 **스펙 문서**로 정리합니다. 이 스킬은 새로 질문하지 않고, 지금까지의 대화를 요약해서 씁니다.

1. 4단계와 **같은 대화 창**에서 입력합니다.

   ```text
   /to-spec
   ```

2. 에이전트가 테스트를 걸 **seam(이음매)** 을 제안하고 확인을 받습니다. (예시)

   ```text
   테스트 seam 제안: splitEvenly 같은 분배 함수의 공개 인터페이스 한 곳.
   CLI는 이 함수를 그대로 출력만 하므로 별도 seam을 두지 않습니다. 맞습니까?
   ```

   제안이 맞으면 `yes`라고 답합니다.

3. 에이전트가 스펙을 `.scratch/<기능 이름>/spec.md`에 저장합니다. 기능 이름(예: `remainder-to-treasurer`)은 에이전트가 정합니다.

4. 스펙 파일을 열어 아래 제목들이 있는지 훑어봅니다.

   | 제목 | 내용 |
   |---|---|
   | Problem Statement | 사용자 입장에서 본 문제 (5원이 사라짐) |
   | Solution | 사용자 입장에서 본 해결 (총무가 끝전을 냄) |
   | User Stories | "As a 총무, I want …" 형태의 긴 목록 |
   | Implementation Decisions | 바꿀 모듈, 인터페이스, 결정 사항 (파일 경로·코드는 쓰지 않음) |
   | Testing Decisions | 어디를 어떻게 테스트할지 |
   | Out of Scope | 이번에 하지 않을 것 |

## 규칙
> 스펙에는 **파일 경로나 코드 조각을 쓰지 않습니다.** 코드는 금방 바뀌어서 스펙이 낡기 때문입니다.

> 스펙이 마음에 들지 않으면 대화로 고쳐 달라고 하면 됩니다. 예) "Out of Scope에 '사람마다 다른 금액 내기'를 추가해줘."

> "이슈 트래커 정보가 없다"는 말이 나오면 3단계(`/setup-matt-pocock-skills`)를 건너뛴 것입니다.

## 산출물
- `.scratch/<기능 이름>/spec.md` — 스펙 문서 (`Status`/라벨은 `ready-for-agent`)

## 체크리스트
- [ ] `.scratch/` 아래에 `spec.md`가 생겼는지 확인한다.
- [ ] 스펙의 용어가 `GLOSSARY.md`의 용어(끝전, 총무 등)와 같은지 확인한다.
- [ ] Out of Scope 섹션이 있는지 확인한다.

# 6 단계: 티켓으로 쪼개기 — `/to-tickets`

스펙을 **한 번에 하나씩 끝낼 수 있는 티켓**으로 나눕니다.

1. 5단계와 **같은 대화 창**에서 입력합니다.

   ```text
   /to-tickets
   ```

2. 에이전트가 티켓 목록을 제안하고 의견을 묻습니다. (예시)

   ```text
   1. 끝전을 총무에게 배정하는 분배 계산
      Blocked by: 없음 (바로 시작 가능)
      What it delivers: 30,000원 / 7명 → 총무 4,290원, 나머지 6명 4,285원
   2. CLI에서 총무 부담금을 따로 보여 주기
      Blocked by: 1
      What it delivers: node src/cli.js 30000 7 이 총무 금액과 1인 부담금을 함께 출력

   - 크기가 적당한가요? (너무 큼 / 너무 잘게 나눔)
   - Blocked by 관계가 맞나요?
   - 합치거나 더 쪼갤 티켓이 있나요?
   ```

3. 괜찮으면 승인합니다.

   ```text
   좋아, 이대로 만들어줘.
   ```

4. 티켓 파일과 스펙을 함께 커밋합니다.

   ```text
   !git add . && git commit -m "끝전 처리 스펙과 티켓"
   ```

## 규칙
> 티켓은 **세로로 자른 조각**이어야 합니다. "테스트만 전부 먼저", "함수만 전부 먼저" 같은 가로 자르기는 하지 않습니다. 각 티켓이 끝나면 혼자서 동작을 확인할 수 있어야 합니다.

> 로컬 트래커에서는 **티켓 하나당 파일 하나**입니다. 번호는 막는 티켓이 먼저 오도록 `01`부터 매깁니다.

> 이 단계가 끝나면 인터뷰~티켓까지의 대화는 역할을 다했습니다. 이제부터는 티켓 파일이 기억 장치입니다.

## 산출물
- `.scratch/<기능 이름>/issues/01-<제목>.md`, `02-<제목>.md` … — 각각 What to build / Blocked by / Status: ready-for-agent / 완료 조건 체크박스

## 체크리스트
- [ ] `.scratch/<기능 이름>/issues/`에 티켓 파일이 2개 이상 생겼는지 확인한다.
- [ ] 각 티켓에 `Blocked by`와 체크박스 형태의 완료 조건이 있는지 확인한다.
- [ ] 스펙과 티켓이 커밋됐는지 `git log --oneline`으로 확인한다.

# 7 단계: 티켓 구현과 리뷰 — `/implement`

티켓을 하나씩 구현합니다. `/implement`는 안에서 `tdd`(빨강→초록)로 코드를 만들고, 끝나면 `code-review`(두 축 리뷰)를 돌린 뒤 커밋합니다.

1. 리뷰 기준점을 분명히 하기 위해 작업용 브랜치를 만듭니다.

   ```text
   !git switch -c feature/remainder
   ```

2. 대화 창을 비웁니다. 구현은 **티켓마다 새 창**에서 시작합니다.

   ```text
   /clear
   ```

3. 첫 번째 티켓을 구현하게 합니다. 파일 이름은 6단계에서 생긴 이름으로 바꿔 넣습니다. (`@`를 치면 파일 경로 자동완성이 됩니다.)

   ```text
   /implement @.scratch/remainder-to-treasurer/issues/01-assign-remainder-to-treasurer.md
   리뷰 기준점(fixed point)은 main 브랜치로 해줘.
   ```

4. 진행 중에 에이전트가 묻는 것과 답하는 방법입니다.

   | 에이전트의 질문 (요지) | 이렇게 답하기 |
   |---|---|
   | (tdd) "이 seam에서 테스트할까요?" | 스펙에서 합의한 seam이면 `yes` |
   | (code-review) "기준점을 무엇으로 할까요?" | `main` (3번에서 미리 말했다면 묻지 않습니다) |
   | 파일 수정·명령 실행 권한 요청 | 내용을 읽어 보고 허용 |

   진행 순서는 대략 이렇습니다.
   - **빨강**: `test/split.test.js`에 "30,000원 / 7명 → 총무 4,290원" 같은 실패하는 테스트를 먼저 추가하고 `npm test`로 실패를 확인
   - **초록**: 테스트를 통과할 만큼만 `src/split.js`를 고침
   - 다음 동작에 대해 빨강→초록 반복
   - **리뷰**: Standards / Spec 두 서브에이전트의 결과를 `## Standards`, `## Spec`으로 나란히 보고
   - **커밋**: 현재 브랜치(`feature/remainder`)에 커밋

5. 리뷰에서 고칠 점이 나오면 고쳐 달라고 합니다.

   ```text
   Spec 리뷰에서 지적한 부분을 고치고 다시 커밋해줘.
   ```

6. 다음 티켓은 다시 `/clear` 후 같은 방법으로 진행합니다.

   ```text
   /clear
   ```

   ```text
   /implement @.scratch/remainder-to-treasurer/issues/02-show-treasurer-share-in-cli.md
   리뷰 기준점(fixed point)은 main 브랜치로 해줘.
   ```

7. 모든 티켓이 끝나면 결과를 확인합니다.

   ```text
   !npm test
   ```

   ```text
   !node src/cli.js 30000 7
   ```

   ```text
   !git log --oneline main..HEAD
   ```

## 규칙
> **구현 전에 반드시 `/clear`** 합니다. 각 티켓은 그 자체로 충분한 정보를 담고 있으므로 이전 대화는 필요 없고, 오히려 판단을 흐립니다.

> `tdd`의 원칙: **실패하는 테스트가 먼저**, 통과할 만큼만 구현, **한 번에 한 조각**. 테스트를 한꺼번에 몰아 쓰지 않습니다. 리팩터링은 TDD 루프가 아니라 리뷰 단계에서 합니다.

> `/implement`는 블로커가 먼저 끝난 티켓부터 진행합니다. `02`가 `01`에 막혀 있다면 `01`을 먼저 끝내세요.

> 리뷰를 **따로** 받고 싶다면 새 창에서 플러그인 정식 이름으로 부릅니다. `/code-review`만 치면 Claude Code에 기본으로 있는 다른 리뷰 명령이 실행될 수 있습니다.
> `/mattpocock-skills:code-review main`

> 알려진 문제: `code-review`의 서브에이전트가 다시 `code-review`를 부르며 에이전트가 계속 늘어나는 경우가 보고되어 있습니다. 화면에 에이전트가 비정상적으로 많이 뜨면 `Esc`로 멈추세요.

## 산출물
- `src/split.js`, `src/cli.js` — 끝전을 총무에게 배정하도록 수정된 코드
- `test/split.test.js` — 끝전 동작을 검증하는 테스트 추가
- `feature/remainder` 브랜치의 티켓별 커밋
- 티켓마다 Standards / Spec 두 축 리뷰 결과 (대화 창 안)

## 체크리스트
- [ ] `npm test`가 모두 통과하는지 확인한다.
- [ ] `node src/cli.js 30000 7`의 출력에서 총무 금액 + 1인 부담금 × 나머지 인원 = 30,000원인지 계산해 확인한다.
- [ ] `git log --oneline main..HEAD`에 티켓별 커밋이 있는지 확인한다.
- [ ] 각 티켓 파일의 완료 조건 체크박스가 모두 충족됐는지 확인한다.

---

# 더 해보기

기본 사이클을 한 바퀴 돌았다면 아래 스킬도 써 보세요.

| 상황 | 스킬 | 예시 프롬프트 |
|---|---|---|
| 어떤 스킬을 써야 할지 모르겠다 | `/ask-matt` | `/ask-matt 버그 신고가 10개 쌓였는데 어디서부터 시작하지?` |
| 방금 작업을 돌아보고 환경을 개선하고 싶다 | `/retro` | `/retro` (구현을 마친 그 대화 창에서, `/clear` 전에) |
| 에이전트 말이 이해가 안 된다 | `/wait-what` | `/wait-what` |
| 다른 사람·다른 폴더로 작업을 넘긴다 | `/handoff` | `/handoff 다음 세션은 사람마다 다른 금액 내기 기능을 다룬다` |
| 잘 안 잡히는 버그를 고친다 | `diagnosing-bugs` | `총액이 0원일 때 CLI가 이상하게 동작해. diagnosing-bugs 스킬로 원인을 찾아줘.` |
| 코드 구조를 점검한다 | `/improve-codebase-architecture` | `/improve-codebase-architecture` |
| 저장소 없이 생각만 다듬는다 | `/grill-me` | `/grill-me 팀 회식비 정산 규칙을 정하려고 해.` |

# 문제 해결

| 증상 | 해결 |
|---|---|
| `/grill-with-docs`가 자동완성에 안 뜬다 | Claude Code를 완전히 종료 후 재실행. 그래도 없으면 `claude plugin list`로 설치 확인 |
| `/code-review`가 엉뚱한 리뷰를 한다 | Claude Code 기본 명령과 이름이 겹친 것. `/mattpocock-skills:code-review`로 부르기 |
| "run `/setup-matt-pocock-skills`" 라는 안내가 나온다 | 3단계를 건너뛰었거나 다른 폴더에서 실행함. `dutch-pay` 폴더에서 3단계 실행 |
| 스킬이 두 번씩 보인다 | 플러그인과 skills.sh를 둘 다 설치함. 하나를 제거 (`claude plugin uninstall mattpocock-skills` 또는 `.claude/skills/`의 복사본 삭제) |
| 인터뷰 질문이 끝없이 이어진다 | 정상 동작에 가깝습니다. 범위를 줄이고 싶으면 "Out of Scope로 미루자"라고 답하기 |
