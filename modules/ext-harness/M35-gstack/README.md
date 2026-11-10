# 모듈 — gstack — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

Garry Tan의 gstack을 설치해 Claude Code를 **역할이 나뉜 가상 개발팀**(YC 파트너, CEO, 스태프 엔지니어, QA 리드, 릴리스 엔지니어)으로 만들고, 할 일 관리 앱에 **반복 할 일** 기능을 추가하는 실습으로 **Think → Plan → Build → Review → Test → Ship → Reflect** 스프린트를 한 바퀴 돌려 보며, 개발 과정 전체를 스킬로 구성하는 하네스 엔지니어링을 배워본다.

## 이 모듈에서 다루는 것

| 구분 | 내용 |
|---|---|
| 설치 | `~/.claude/skills/gstack`에 내려받고 `./setup` (Bun 1.4.2+ 필요) |
| Think | `/office-hours` — 기능 요청을 재정의하고 전제를 점검해 **설계 문서** 작성 (Builder mode) |
| Plan | plan mode + `/autoplan` — 구현 계획을 CEO → (DX) → 엔지니어링 관점으로 자동 리뷰 |
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
| 계획 | `/to-spec`, `/to-tickets` — 스펙과 티켓 파일 | plan mode + `/autoplan` — 여러 역할의 자동 리뷰 |
| 검증 | `tdd` + `code-review`(Standards / Spec 두 축) | `/review`(운영 위험) + `/qa`(실행 탐색) |
| 마무리 | 커밋 | `/ship`으로 PR 생성까지 |
| 기록 위치 | 저장소 안 (`GLOSSARY.md`, `.scratch/`) | 주로 저장소 밖 (`~/.gstack/projects/`), QA 보고서는 `.gstack/` |
| 무게 | 가벼움 (스킬 27개, 각 수십 줄) | 무거움 (스킬 수십 개, 도구·브라우저 포함) |

## 문서 구성

- [GUIDE.md](GUIDE.md) — 개념 설명과 0~8단계 따라하기 (단계별 규칙·산출물·체크리스트)
- [SAMPLE.md](SAMPLE.md) — 명령어와 프롬프트만 모은 실행용 요약
- [todo-app/](todo-app/) — 실습 출발점이 되는 할 일 관리 CLI (Node.js, 의존성 없음, 테스트 5개). 강의 자료 저장소 밖으로 복사해서 사용

## 산출물 4종 (체크리스트)

- [x] 가이드 — GUIDE.md 단계 목적·입력·산출물·체크리스트
- [ ] 규칙 — CLAUDE.md 조각 (gstack 설치 시 사용자 `CLAUDE.md`에 `gstack` 섹션 추가)
- [x] 자동화 — gstack 스킬 (`/office-hours`, `/autoplan`, `/review`, `/qa`, `/ship`, `/retro` 등)
- [x] 샘플 — SAMPLE.md 동작 스텝·프롬프트

## 품질 기준

동작하는 샘플 또는 재현 가능한 프롬프트가 반드시 첨부되어야 하며, 문서는 따라 하면 되는 수준이어야 한다.

## 기준 버전과 주의 사항

- gstack 1.99.0.0 (2026-11-10 커밋 `6b32714`), MIT 라이선스
- 업데이트가 매우 잦다(일주일 최대 두 번 릴리스). 스킬이 추가·삭제되기도 한다. 예) `/plan-eng-review`는 2026-11-06에 `/autoplan`으로 흡수됨
- macOS·Linux는 전체 지원, Windows(Git Bash/WSL)는 최소 지원. 강의 환경은 macOS·Linux 또는 WSL을 권장

## 참고 링크
- gstack 저장소: https://github.com/garrytan/gstack
- 스킬별 상세 설명: https://github.com/garrytan/gstack/blob/main/docs/skills.md
- 브라우저 없이 QA하기: https://github.com/garrytan/gstack/blob/main/docs/qa-without-a-webpage.md
- 설치 상세·제거: https://github.com/garrytan/gstack/blob/main/docs/install.md , https://github.com/garrytan/gstack/blob/main/docs/uninstall.md
- 지원 범위: https://github.com/garrytan/gstack/blob/main/docs/support-tiers.md
