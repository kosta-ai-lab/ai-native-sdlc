# 모듈 — mattpocock/skills — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

Matt Pocock의 에이전트 스킬 모음(mattpocock/skills)을 Claude Code 플러그인으로 설치하고, **인터뷰(grill) → 스펙 → 티켓 → TDD 구현 → 두 축 리뷰**로 이어지는 기본 흐름을 작은 예제 저장소에서 한 바퀴 돌려 보며, 작고 조합 가능한 스킬로 하네스를 구성하는 방법을 배워본다.

## 이 모듈에서 다루는 것

| 구분 | 내용 |
|---|---|
| 설치 | `claude plugin install mattpocock-skills@claude-plugins-official` (스킬 27개, 자동 업데이트) |
| 저장소 설정 | `/setup-matt-pocock-skills` — 이슈 트래커·트리아지 라벨·용어집 위치를 `CLAUDE.md`와 `docs/agents/`에 기록 |
| 정렬(Alignment) | `/grill-with-docs` — 에이전트가 사람을 인터뷰하며 `GLOSSARY.md`와 ADR을 함께 작성 |
| 계획 | `/to-spec`, `/to-tickets` — 대화를 스펙으로, 스펙을 예광탄(tracer-bullet) 티켓으로 |
| 구현·검증 | `/implement` — 안에서 `tdd`(빨강→초록)와 `code-review`(Standards + Spec 두 축)를 호출 |
| 실습 예제 | `dutch-pay` 더치페이 계산기의 "끝전이 사라지는 문제"를 위 흐름으로 해결 |

## 문서 구성

- [GUIDE.md](GUIDE.md) — 개념 설명과 0~7단계 따라하기 (단계별 규칙·산출물·체크리스트)
- [SAMPLE.md](SAMPLE.md) — 명령어와 프롬프트만 모은 실행용 요약
- [dutch-pay/](dutch-pay/) — 실습 출발점이 되는 더치페이 계산기 CLI (Node.js, 의존성 없음, 테스트 2개). 강의 자료 저장소 밖으로 복사해서 사용

## 산출물 4종 (체크리스트)

- [x] 가이드 — GUIDE.md 단계 목적·입력·산출물·체크리스트
- [ ] 규칙 — CLAUDE.md 조각 (`/setup-matt-pocock-skills`가 `## Agent skills` 블록을 자동 생성)
- [x] 자동화 — mattpocock-skills 플러그인 스킬 (`/grill-with-docs`, `/to-spec`, `/to-tickets`, `/implement` 등)
- [x] 샘플 — SAMPLE.md 동작 스텝·프롬프트

## 품질 기준

동작하는 샘플 또는 재현 가능한 프롬프트가 반드시 첨부되어야 하며, 문서는 따라 하면 되는 수준이어야 한다.

## 기준 버전

- mattpocock-skills 1.3.2 (2026-10-31 커밋 `4ae2317`), MIT 라이선스

## 참고 링크
- mattpocock/skills 저장소: https://github.com/mattpocock/skills
- 스킬 흐름 길잡이(ask-matt): https://github.com/mattpocock/skills/blob/main/skills/engineering/ask-matt/SKILL.md
- skills.sh 페이지: https://skills.sh/mattpocock/skills
- 저자 뉴스레터(AI Hero): https://www.aihero.dev/s/skills-newsletter
