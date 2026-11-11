# 모듈 — gstack — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

Garry Tan의 gstack을 설치해 Claude Code를 **역할이 나뉜 가상 개발팀**(YC 파트너, CEO, 스태프 엔지니어, QA 리드, 릴리스 엔지니어)으로 만들고, 할 일 관리 앱에 **반복 할 일** 기능을 추가하는 실습으로 **Think → Plan → Build → Review → Test → Ship → Reflect** 스프린트를 한 바퀴 돌려 보며, 개발 과정 전체를 스킬로 구성하는 하네스 엔지니어링을 배워본다.

## gstack이란

**gstack**은 Y Combinator 대표 Garry Tan이 매일 쓰는 **Claude Code용 스킬 모음**입니다.
Claude Code 하나를 **가상의 개발팀**으로 바꿔 줍니다. 제품을 다시 생각하는 CEO, 설계를 점검하는 엔지니어링 매니저, 운영에서 터질 버그를 찾는 리뷰어, 실제로 앱을 돌려 보는 QA 리드, PR을 올리는 릴리스 엔지니어가 각각 **슬래시 명령 하나**(`/office-hours`, `/review`, `/qa`, `/ship` …)로 들어 있습니다.
모든 스킬은 마크다운이고, 무료 오픈소스(MIT 라이선스)입니다.

저자가 강조하는 말은 "gstack은 **도구 모음이 아니라 과정**"이라는 것입니다. 스킬들은 실제 개발 스프린트 순서대로 이어지고, 앞 단계의 결과물(설계 문서, 테스트 계획, 리뷰 기록)을 다음 단계가 자동으로 읽습니다.

### gstack의 스프린트

```
Think  →  Plan  →  Build  →  Review  →  Test  →  Ship  →  Reflect
생각       계획      구현       리뷰       테스트      출시      회고
```

| 단계 | 스킬 | 가상 팀원 | 하는 일 |
|---|---|---|---|
| Think | `/office-hours` | YC 오피스아워 파트너 | 코드를 쓰기 전에 질문으로 아이디어를 다시 정의하고 **설계 문서**를 씀 |
| Plan | `/autoplan` | 리뷰 파이프라인 | 구현 계획을 CEO → (디자인) → (DX) → 엔지니어링 관점으로 자동 리뷰하고 계획을 고침 |
| Build | (Claude Code 기본 기능) | — | 승인된 계획대로 코드 작성 |
| Review | `/review` | 스태프 엔지니어 | 테스트는 통과해도 **운영에서 터질 버그**를 찾고, 뻔한 것은 바로 고침 |
| Test | `/qa` | QA 리드 | 앱을 실제로 실행해 보며 버그를 재현하고, 실패하는 회귀 테스트를 먼저 쓴 뒤 고침 |
| Ship | `/ship` | 릴리스 엔지니어 | 테스트·커버리지·문서 점검 후 푸시하고 **PR을 생성** |
| Reflect | `/retro` | 엔지니어링 매니저 | 주간 회고. 커밋·테스트 추세·잘한 점·개선점 |

### 핵심 개념 6가지

#### 1. Role Skill (역할 스킬)
gstack의 스킬은 "기능"이 아니라 **사람의 역할**로 나뉘어 있습니다. 같은 코드도 누가 보느냐에 따라 보는 것이 다릅니다.
CEO는 "이게 정말 만들 가치가 있나?", 스태프 엔지니어는 "뭐가 터질 수 있나?", QA 리드는 "실제로 써 보면 되나?"를 묻습니다. 빈 프롬프트 대신 **역할이 정해진 질문**을 받게 되는 것이 gstack의 핵심입니다.

#### 2. Design Doc (설계 문서)
`/office-hours`의 결과물입니다. 문제 정의, 받아들인 전제(premise), 고른 접근 방식, 다음 할 일이 담깁니다.
저장 위치는 저장소 안이 아니라 **내 컴퓨터의 gstack 상태 폴더**(`~/.gstack/projects/<프로젝트>/…-design-….md`)이고, **브랜치별로** 찾습니다. 그래서 기능 브랜치를 먼저 만든 뒤 `/office-hours`를 실행합니다.

#### 3. Reframe (재정의)와 Premise (전제)
`/office-hours`는 내가 말한 기능 요청을 그대로 받아 적지 않고, "당신이 실제로 원하는 건 이것 아닌가요?"라고 **틀을 다시 짭니다.** 그다음 이 제품이 기대고 있는 **전제**들을 하나씩 보여 주며 동의·반대·수정을 묻습니다. 동의한 전제는 설계 문서의 기둥이 됩니다.
모드는 두 가지입니다. 창업·사내 프로젝트는 날카로운 질문을 던지는 **Startup mode**, 학습·취미·해커톤은 아이디어를 키워 주는 **Builder mode**입니다. 이 실습은 **Builder mode**로 진행합니다.

#### 4. Plan Mode와 `/autoplan`
`/autoplan`에 설계 문서를 바탕으로 구현 계획을 요청하면 계획을 세우고 이어서 리뷰합니다. 리뷰 기록 파일을 여러 개 써야 하므로 Claude Code의 **plan mode**(계획 모드)는 **끈 상태**에서 실행합니다(plan mode에서는 막힙니다). `/autoplan`은 CEO → 디자인(화면이 있을 때만) → DX(개발자용 도구일 때만) → 엔지니어링 순서로 리뷰하며 **대부분의 질문은 추천 답으로 자동 결정**하고, 취향의 문제(taste decision)만 사람에게 묻습니다. 리뷰가 끝나면 반영된 계획대로 구현을 요청합니다.

#### 5. Fix-First Review (먼저 고치는 리뷰)
`/review`는 문제를 나열만 하지 않습니다. 뻔한 기계적 문제는 바로 고치고 `[AUTO-FIXED] 파일:줄 문제 → 조치`로 알려 줍니다. 보안·경쟁 상태·설계 결정처럼 **판단이 필요한 것만** 사람에게 묻습니다.

#### 6. QA와 회귀 테스트
`/qa`는 웹페이지뿐 아니라 **CLI, API, 백그라운드 작업도** 테스트합니다. 이 실습의 할 일 앱은 CLI라서 브라우저 없이 명령어를 직접 실행하며 테스트합니다.
버그를 찾으면 ① 재현하고 ② **그 버그 때문에 실패하는 테스트**를 먼저 쓰고 ③ 원인을 고친 뒤 ④ 다시 확인합니다. 결과 보고서는 `.gstack/qa-reports/`에 저장됩니다. 코드는 건드리지 않고 보고서만 원하면 `/qa-only`를 씁니다.

### 추가로 알아두면 좋은 개념

| 개념 | 설명 |
|---|---|
| **설치 위치** | `~/.claude/skills/gstack` 에 저장소를 통째로 내려받고 `./setup`이 스킬을 등록합니다. 모든 프로젝트에서 쓸 수 있습니다. |
| **Review Readiness Dashboard** | 리뷰 결과를 표로 보여 주는 판. **Eng Review만 필수 관문**이며 `/review`나 `/autoplan`의 엔지니어링 단계가 이를 통과시킵니다. |
| **Team mode** | 저장소에 설정을 커밋해서 팀원 모두가 gstack을 자동으로 쓰게 하는 모드(`./setup --team`). 이 실습에서는 다루지 않습니다. |
| **안전 스킬** | `/careful`(위험한 명령 전에 경고), `/freeze`(지정한 폴더 밖은 수정 금지), `/guard`(둘 다), `/unfreeze`(해제). |
| **Outside review** | 다른 회사 모델(OpenAI Codex CLI)에게 두 번째 의견을 받는 기능. Codex CLI가 설치·로그인돼 있을 때만 동작하며, 없으면 건너뜁니다. 코드가 외부로 전송되므로 끄려면 `gstack-config set codex_reviews disabled`. |
| **텔레메트리** | 기본값은 꺼짐이며 처음에 한 번 묻습니다. 업데이트 확인(GitHub 요청)은 기본으로 켜져 있습니다. |
| **지원 범위** | macOS·Linux는 **전체 지원**, Windows(Git Bash/WSL)는 **최소 지원**입니다. Windows에서는 설치와 핵심 스킬(`/review`, `/qa-only`, `/ship`, `/browse`)만 보장되고 나머지는 동작하지 않을 수 있습니다. |

## 이 모듈에서 다루는 것

| 구분 | 내용 |
|---|---|
| 설치 | `~/.claude/skills/gstack`에 내려받고 `./setup` (Bun 1.4.2+ 필요) |
| Think | `/office-hours` — 기능 요청을 재정의하고 전제를 점검해 **설계 문서** 작성 (Builder mode) |
| Plan | `/autoplan` — 구현 계획을 세우고 CEO → (DX) → 엔지니어링 관점으로 자동 리뷰 |
| Build | 승인된 계획대로 Claude Code가 구현 |
| Review | `/review` — 테스트는 통과해도 운영에서 터질 버그를 찾고, 뻔한 것은 바로 고침 |
| Test | `/qa` — CLI를 직접 실행하며 탐색, 버그는 실패하는 회귀 테스트를 먼저 쓰고 수정 |
| Ship | `/ship` (선택) — 테스트·커버리지·문서 점검 후 푸시하고 PR 생성 (GitHub 필요) |
| Reflect | `/retro` — 스프린트 회고 |
| 실습 예제 | `todo-app` 할 일 관리 CLI에 "완료하면 다음 회차가 생기는 반복 할 일" 추가 |

## mattpocock/skills(M31·M33)와 비교

같은 "할 일 앱 + 반복 할 일" 예제를 M33에서 mattpocock/skills로도 다룹니다. 두 모듈을 함께 보면 하네스 설계 철학의 차이를 비교할 수 있습니다.

| 관점 | mattpocock/skills (M33) | gstack (M35) |
|---|---|---|
| 철학 | 작고 고치기 쉬운 스킬을 **조합**. 과정을 사람이 쥠 | 스프린트 전체를 **과정**으로 제공. 단계가 서로 결과물을 넘김 |
| 시작 | `/grill-with-docs` — 질문으로 합의, `GLOSSARY.md` 작성 | `/office-hours` — 기능 요청을 재정의, 설계 문서 작성 |
| 계획 | `/to-spec`, `/to-tickets` — 스펙과 티켓 파일 | `/autoplan` — 구현 계획 작성과 여러 역할의 자동 리뷰 |
| 검증 | `tdd` + `code-review`(Standards / Spec 두 축) | `/review`(운영 위험) + `/qa`(실행 탐색) |
| 마무리 | 커밋 | `/ship`으로 PR 생성까지 |
| 기록 위치 | 저장소 안 (`GLOSSARY.md`, `.scratch/`) | 주로 저장소 밖 (`~/.gstack/projects/`), QA 보고서는 `.gstack/` |
| 무게 | 가벼움 (스킬 27개, 각 수십 줄) | 무거움 (스킬 수십 개, 도구·브라우저 포함) |

## 문서 구성

- [GUIDE.md](GUIDE.md) — 이 실습에서 할 일과 0~9단계 따라하기 (단계별 규칙·산출물·체크리스트)
- [SAMPLE.md](SAMPLE.md) — 예제 앱 `todo-app` 설명 (초기 코드 구성·실행 방법, 실습 후 바뀌는 점)
- [todo-app/](todo-app/) — 실습 출발점이 되는 할 일 관리 CLI (Node.js, 의존성 없음, 테스트 5개). 강의 자료 저장소 밖으로 복사해서 사용

## 산출물 4종 (체크리스트)

- [x] 가이드 — GUIDE.md 단계 목적·입력·산출물·체크리스트
- [ ] 규칙 — CLAUDE.md 조각 (gstack 설치 시 사용자 `CLAUDE.md`에 `gstack` 섹션 추가)
- [x] 자동화 — gstack 스킬 (`/office-hours`, `/autoplan`, `/review`, `/qa`, `/ship`, `/retro` 등)
- [x] 샘플 — SAMPLE.md 예제 앱 `todo-app` 설명

## 품질 기준

동작하는 샘플 또는 재현 가능한 프롬프트가 반드시 첨부되어야 하며, 문서는 따라 하면 되는 수준이어야 한다.

## 기준 버전과 주의 사항

- gstack 1.99.0.0 (2026-11-10 커밋 `6b32714`), MIT 라이선스
- 업데이트가 매우 잦다(일주일 최대 두 번 릴리스). 스킬 이름·질문 내용·출력이 조금씩 달라지고, 스킬이 추가·삭제되기도 한다. 예) `/plan-eng-review`는 2026-11-06에 `/autoplan`으로 흡수됨
- macOS·Linux는 전체 지원, Windows(Git Bash/WSL)는 최소 지원. 강의 환경은 macOS·Linux 또는 WSL을 권장

## 참고 링크
- gstack 저장소: https://github.com/garrytan/gstack
- 스킬별 상세 설명: https://github.com/garrytan/gstack/blob/main/docs/skills.md
- 브라우저 없이 QA하기: https://github.com/garrytan/gstack/blob/main/docs/qa-without-a-webpage.md
- 설치 상세·제거: https://github.com/garrytan/gstack/blob/main/docs/install.md , https://github.com/garrytan/gstack/blob/main/docs/uninstall.md
- 지원 범위: https://github.com/garrytan/gstack/blob/main/docs/support-tiers.md
