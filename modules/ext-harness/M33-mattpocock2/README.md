# 모듈 — mattpocock/skills (할 일 앱 + 반복 할 일) — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

Matt Pocock의 에이전트 스킬 모음(mattpocock/skills)을 Claude Code 플러그인으로 설치하고, 할 일 관리 앱에 **반복 할 일** 기능을 추가하는 실습으로 **인터뷰(grill) → 스펙 → 티켓 → TDD 구현 → 두 축 리뷰**의 기본 흐름을 한 바퀴 돌려 보며, 작고 조합 가능한 스킬로 하네스를 구성하는 방법을 배워본다.

## mattpocock/skills란

**mattpocock/skills**는 TypeScript 강사 Matt Pocock이 매일 실무에서 쓰는 **에이전트 스킬 모음**입니다.
Claude Code, Codex, Copilot 같은 코딩 에이전트에 설치해서 `/grill-with-docs`, `/to-spec`, `/implement` 같은 슬래시 명령으로 부릅니다.
무료 오픈소스(MIT 라이선스)이며, Claude Code에서는 **플러그인**(`mattpocock-skills`) 한 번 설치로 스킬 27개가 한꺼번에 들어옵니다.

저자가 내세우는 방향은 "바이브 코딩이 아니라 **진짜 엔지니어링**"입니다.
GSD·BMAD·Spec-Kit처럼 개발 과정 전체를 대신 쥐는 프레임워크와 달리, 이 스킬들은 **작고, 고치기 쉽고, 서로 조합**해서 쓰도록 만들어졌습니다.
각 스킬은 결국 `SKILL.md` 마크다운 파일 하나이므로, 읽어 보고 내 입맛대로 고쳐 쓸 수 있습니다.

### 이 스킬들이 고치려는 4가지 문제

| 문제 | 증상 | 해결 스킬 |
|---|---|---|
| **1. 에이전트가 내 뜻대로 안 한다** | 다 만들고 나서야 "그게 아닌데…" | `/grill-with-docs`, `/grill-me` — 시작 전에 에이전트가 나를 **꼬치꼬치 인터뷰** |
| **2. 에이전트가 너무 장황하다** | 한 단어면 될 걸 스무 단어로 설명 | `/grill-with-docs` — 프로젝트 **용어집(`GLOSSARY.md`)** 을 함께 만듦 |
| **3. 코드가 동작하지 않는다** | 테스트 없이 "다 됐습니다" | `/tdd`, `/diagnosing-bugs` — **빨강→초록** 피드백 루프 |
| **4. 진흙덩어리 코드가 된다** | 빨리 만든 만큼 빨리 복잡해짐 | `/to-spec`, `/improve-codebase-architecture` — **설계를 매일 챙김** |

### 핵심 개념 6가지

#### 1. Skill (스킬)과 두 가지 호출 방식
스킬은 `skills/<분류>/<이름>/SKILL.md` 파일 하나로 된 "에이전트용 작업 설명서"입니다. 이 저장소의 스킬은 **누가 부를 수 있는가**로 둘로 나뉩니다.

- **User-invoked (사용자 호출)**: **사람이 `/이름`을 직접 입력해야만** 실행됩니다. 흐름을 지휘하는 역할입니다. 예) `/grill-with-docs`, `/to-spec`, `/to-tickets`, `/implement`
- **Model-invoked (모델 호출)**: 사람이 불러도 되고, **상황이 맞으면 에이전트가 알아서** 꺼내 씁니다. 재사용되는 규율을 담고 있습니다. 예) `tdd`, `code-review`, `grilling`, `domain-modeling`

사용자 호출 스킬은 내부에서 모델 호출 스킬을 부릅니다. 예를 들어 `/implement`는 안에서 `tdd`와 `code-review`를 부릅니다.

#### 2. Grilling (그릴링, 꼬치꼬치 인터뷰)
에이전트가 나에게 질문을 **라운드(round)** 단위로 묶어서 던집니다. 질문마다 **추천 답(➡️)** 이 붙어 있습니다. 기본 대답은 **`전부 추천대로 진행할게`** 입니다. 이렇게 답하면 그 라운드의 추천 답을 모두 받아들인 것이 되고, 다르게 정하고 싶은 질문만 따로 적으면 됩니다.
결정 하나가 정해지면 그 결정에 딸린 다음 질문들이 열리고(이를 **frontier, 최전선**이라 부름), 더 물을 것이 없을 때 끝납니다.
**사실 확인**(파일에 뭐가 있는지 등)은 에이전트가 직접 하고, **결정**만 사람에게 묻는 것이 원칙입니다.

#### 3. Shared Language (공유 언어) — `GLOSSARY.md`와 ADR
- **`GLOSSARY.md`**: 이 프로젝트에서만 쓰는 용어를 한두 문장으로 정의하고, 쓰지 말아야 할 동의어를 `_Avoid_`로 적는 용어집입니다. 에이전트가 이 용어로 말하고, 변수·함수 이름도 이 용어로 짓게 됩니다.
- **ADR (Architecture Decision Record)**: `docs/adr/0001-제목.md` 형태의 짧은 결정 기록입니다. **되돌리기 어렵고, 맥락 없이 보면 이상하고, 진짜 대안 중에 고른 결정**일 때만 만듭니다.

#### 4. Issue Tracker (이슈 트래커)
스펙과 티켓을 어디에 저장할지 정한 곳입니다. GitHub Issues, GitLab Issues, **로컬 마크다운 파일**(`.scratch/` 폴더) 중에서 고릅니다.
이 모듈의 실습은 GitHub 계정 없이도 따라 할 수 있도록 **로컬 마크다운**을 사용합니다.

#### 5. Tracer-bullet Ticket (예광탄 티켓)과 Blocking Edge
큰 작업을 **세로로 얇게 자른 조각**(티켓)으로 나눕니다. 각 티켓은 혼자서도 끝까지 동작을 확인할 수 있어야 하고, 새 대화 창 하나에 들어갈 만큼 작아야 합니다.
티켓마다 "이 티켓보다 먼저 끝나야 하는 티켓"(**Blocked by**, 막는 간선)을 적어서 작업 순서를 표시합니다.

#### 6. Seam (이음매)과 Two-axis Review (두 축 리뷰)
- **Seam**: 테스트를 거는 공개 경계(함수·모듈의 바깥 인터페이스)입니다. `/tdd`는 테스트를 쓰기 전에 **어느 seam에서 테스트할지 사람에게 먼저 확인**받습니다.
- **Two-axis review**: `code-review`는 변경분을 두 서브에이전트가 따로 봅니다. **Standards**(저장소 코딩 규칙·코드 냄새를 지켰나)와 **Spec**(스펙대로 만들었나)입니다. 두 결과를 섞지 않고 나란히 보여 줍니다.

### 추가로 알아두면 좋은 개념

| 개념 | 설명 |
|---|---|
| **`/setup-matt-pocock-skills`** | 저장소마다 **한 번** 실행하는 준비 스킬. 이슈 트래커·트리아지 라벨·용어집 위치를 정해서 `docs/agents/`에 적고, `CLAUDE.md`에 `## Agent skills` 블록을 추가합니다. |
| **`/ask-matt`** | "지금 상황엔 어떤 스킬을 써야 하지?"를 물어보는 길잡이 스킬. 스킬이 기억나지 않을 때 씁니다. |
| **Context hygiene (맥락 위생)** | `grill-with-docs → to-spec → to-tickets`는 **한 대화 창에서 끊지 않고** 진행하고, 티켓 구현(`/tdd`)은 티켓마다 `/clear`로 비운 **새 창**에서 시작합니다. |
| **Smart zone** | 모델이 또렷하게 추론하는 대화 길이(최신 모델 기준 약 15만 토큰). 넘어갈 것 같으면 단계 경계에서 `/compact` 합니다. |
| **Plugin 접두어** | 플러그인으로 설치한 스킬의 정식 이름은 `/mattpocock-skills:grill-with-docs`처럼 앞에 플러그인 이름이 붙습니다. 보통은 `/grill-with-docs`만 입력해도 되지만, Claude Code 기본 명령과 이름이 겹치는 `code-review`·`research`·`prototype`은 **정식 이름**으로 부르는 것이 안전합니다. |
| **skills.sh 설치** | `npx skills@latest add mattpocock/skills`로 스킬 파일을 내 프로젝트에 **복사**하는 방식. 직접 고칠 수 있지만 자동 업데이트가 없습니다. **플러그인과 둘 중 하나만** 고르세요. 둘 다 깔면 스킬이 두 벌이 됩니다. |

## 이 모듈에서 다루는 것

| 구분 | 내용 |
|---|---|
| 설치 | `claude plugin install mattpocock-skills@claude-plugins-official` (스킬 27개, 자동 업데이트) |
| 저장소 설정 | `/setup-matt-pocock-skills` — 이슈 트래커·트리아지 라벨·용어집 위치를 `CLAUDE.md`와 `docs/agents/`에 기록 |
| 정렬(Alignment) | `/grill-with-docs` — 에이전트가 사람을 인터뷰하며 `GLOSSARY.md`와 ADR을 함께 작성 |
| 계획 | `/to-spec`, `/to-tickets` — 대화를 스펙으로, 스펙을 예광탄(tracer-bullet) 티켓으로 |
| 구현·검증 | `/tdd` — 티켓을 하나씩 빨강→초록 루프로 구현 (리뷰까지 묶은 `/implement`는 '더 해보기'에서 소개) |
| 실습 예제 | `todo-app` 할 일 관리 CLI에 "완료하면 다음 회차가 생기는 반복 할 일" 추가 |

## 왜 할 일 앱 + 반복 할 일인가

- **친숙함**: 할 일 앱은 누구나 알아서 앱 자체를 설명할 필요가 없다.
- **인터뷰할 거리**: 다음 회차가 언제 생기는지, 다음 마감일을 무엇 기준으로 정하는지, 놓친 회차는 어떻게 되는지처럼 사람이 정해야 할 결정이 많다.
- **공유 언어**: 반복 할 일, 반복 주기, 회차처럼 이 프로젝트에서만 뜻이 정해지는 용어가 생겨 `GLOSSARY.md`가 실제로 채워진다.
- **확인하기 쉬움**: "2026-11-16 마감 분리수거를 완료하면 2026-11-23 회차가 생긴다"처럼 결과를 달력으로 바로 검증할 수 있다.

## 문서 구성

- [GUIDE.md](GUIDE.md) — 기본 사이클(Main flow)과 0~7단계 따라하기 (단계별 규칙·산출물·체크리스트)
- [SAMPLE.md](SAMPLE.md) — 예제 앱 `todo-app` 설명 (초기 코드 구성·실행 방법, 실습 후 바뀌는 점)
- [todo-app/](todo-app/) — 실습 출발점이 되는 할 일 관리 CLI (Node.js, 의존성 없음, 테스트 5개). 강의 자료 저장소 밖으로 복사해서 사용

## 산출물 4종 (체크리스트)

- [x] 가이드 — GUIDE.md 단계 목적·입력·산출물·체크리스트
- [ ] 규칙 — CLAUDE.md 조각 (`/setup-matt-pocock-skills`가 `## Agent skills` 블록을 자동 생성)
- [x] 자동화 — mattpocock-skills 플러그인 스킬 (`/grill-with-docs`, `/to-spec`, `/to-tickets`, `/tdd` 등)
- [x] 샘플 — SAMPLE.md 예제 앱 `todo-app` 설명

## 품질 기준

동작하는 샘플 또는 재현 가능한 프롬프트가 반드시 첨부되어야 하며, 문서는 따라 하면 되는 수준이어야 한다.

## 기준 버전

- mattpocock-skills 1.3.2 (2026-10-31 커밋 `4ae2317`), MIT 라이선스. 버전이 올라가면 스킬 이름·질문 내용·출력이 조금 달라질 수 있습니다.

## 관련 모듈

- M31-mattpocock — 같은 흐름을 더치페이 계산기(`dutch-pay`) 예제로 다룬 짧은 버전

## 참고 링크
- mattpocock/skills 저장소: https://github.com/mattpocock/skills
- 스킬 흐름 길잡이(ask-matt): https://github.com/mattpocock/skills/blob/main/skills/engineering/ask-matt/SKILL.md
- skills.sh 페이지: https://skills.sh/mattpocock/skills
- 저자 뉴스레터(AI Hero): https://www.aihero.dev/s/skills-newsletter
