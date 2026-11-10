# 모듈 — mattpocock/skills (할 일 앱 + 반복 할 일) — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

Matt Pocock의 에이전트 스킬 모음(mattpocock/skills)을 Claude Code 플러그인으로 설치하고, 할 일 관리 앱에 **반복 할 일** 기능을 추가하는 실습으로 **인터뷰(grill) → 스펙 → 티켓 → TDD 구현 → 두 축 리뷰**의 기본 흐름을 한 바퀴 돌려 보며, 작고 조합 가능한 스킬로 하네스를 구성하는 방법을 배워본다.

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

- [GUIDE.md](GUIDE.md) — 개념 설명과 0~7단계 따라하기 (단계별 규칙·산출물·체크리스트)
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

- mattpocock-skills 1.3.2 (2026-10-31 커밋 `4ae2317`), MIT 라이선스

## 관련 모듈

- M31-mattpocock — 같은 흐름을 더치페이 계산기(`dutch-pay`) 예제로 다룬 짧은 버전

## 참고 링크
- mattpocock/skills 저장소: https://github.com/mattpocock/skills
- 스킬 흐름 길잡이(ask-matt): https://github.com/mattpocock/skills/blob/main/skills/engineering/ask-matt/SKILL.md
- skills.sh 페이지: https://skills.sh/mattpocock/skills
- 저자 뉴스레터(AI Hero): https://www.aihero.dev/s/skills-newsletter
