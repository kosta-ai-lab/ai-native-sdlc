# 모듈 — MAFIA Code-Review harness — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

vibemafiaclub의 MAFIA Code-Review harness를 Claude Code 플러그인으로 설치하고, 할 일 관리 앱에 **반복 할 일** 기능을 구현한 뒤 **설계의도 → 평가기준 → PR 본문 → 근거 기반 코드리뷰 → 리뷰 반영·QA** 파이프라인으로 리뷰해 보며, 팀의 코딩 컨벤션과 ADR을 리뷰 기준으로 삼는 코드리뷰 하네스를 구성하는 방법을 배워본다.

## 이 모듈에서 다루는 것

| 구분 | 내용 |
|---|---|
| 설치 | `claude plugin marketplace add vibemafiaclub/mafia-codereview-harness` → `claude plugin install mafia-codereview@mafia-codereview-harness` |
| 리뷰 기준 | `docs/code-convention.yaml`(항상 지키는 규칙)과 `docs/adr.yaml`(기술 결정과 이유) |
| 파이프라인 | `/mafia-codereview:auto` 한 번으로 6단계 진행 |
| 설계의도 | `design-intent.md` — 구현 대화에서 나온 결정·이유·제외 범위. 리뷰어가 의도적 결정을 존중하게 함 |
| 평가기준 | `code-quality-guide.md` — 서브에이전트가 ADR 중 관련 항목만 추출해 컨벤션과 병합. 리뷰의 유일한 근거 |
| 코드리뷰 | `review-comments.md` — 서브에이전트가 자동 리뷰. `[p1]`~`[p4]` 우선순위, 근거, side effect 명시 |
| 리뷰 반영 | 코멘트별 ACCEPT / REJECT 판정, 코드 수정, 테스트 QA |
| 기준 갱신 | `/mafia-codereview:update-docs` — 작업에서 정한 것을 다음 리뷰 기준으로 |
| 실습 예제 | `todo-app` 할 일 관리 CLI에 "완료하면 다음 회차가 생기는 반복 할 일" 구현 후 리뷰 |

## 다른 하네스와의 차이

M33(mattpocock/skills), M35(gstack), M37(pstack)은 **기능을 만드는 과정 전체**를 다루는 반면, mafia-codereview는 **구현이 끝난 뒤의 코드리뷰**에 집중합니다. 같은 `todo-app` + 반복 할 일 예제를 쓰므로 리뷰 단계만 비교해 볼 수 있습니다.

| 관점 | mattpocock `code-review` (M33) | gstack `/review` (M35) | pstack `/interrogate` (M37) | **mafia-codereview (M39)** |
|---|---|---|---|---|
| 리뷰 근거 | 저장소 코딩 규칙 + 코드 냄새 / 스펙 | 운영에서 터질 위험 체크리스트 | 실행으로 증명한 실패 | **컨벤션 + 관련 ADR + 설계의도** |
| 의도 파악 | 스펙 문서 | 계획·설계 문서 | 의도 재진술 | **설계의도 문서를 따로 작성** |
| 결과 형식 | Standards / Spec 두 축 | AUTO-FIXED / ASK | Findings / Dropped | **`[p1]`~`[p4]` + side effect + ACCEPT/REJECT** |
| 기준 축적 | `/retro`로 환경 개선 | `/learn` | `/reflect`, `/correct` | **`update-docs`로 ADR·컨벤션 갱신** |
| 구성 | 스킬(마크다운) | 스킬 + 도구 | 스킬 + 서브에이전트 | **명령 7개(마크다운)뿐, 매우 가벼움** |

## 문서 구성

- [GUIDE.md](GUIDE.md) — 개념 설명과 0~11단계 따라하기 (단계별 규칙·산출물·체크리스트)
- [SAMPLE.md](SAMPLE.md) — 예제 앱 `todo-app` 설명 (파일 구조·리뷰 기준 문서·실행 방법, 실습 후 바뀌는 점)
- [todo-app/](todo-app/) — 실습 출발점이 되는 할 일 관리 CLI (Node.js, 의존성 없음, 테스트 5개). todo-app에 맞춘 리뷰 기준 문서 `docs/code-convention.yaml`(규칙 7개)·`docs/adr.yaml`(실습용 가상 결정 3개, 그중 1개는 일부러 관련 없는 항목) 포함. 강의 자료 저장소 밖으로 복사해서 사용

## 산출물 4종 (체크리스트)

- [x] 가이드 — GUIDE.md 단계 목적·입력·산출물·체크리스트
- [x] 규칙 — `docs/code-convention.yaml`, `docs/adr.yaml` (리뷰 기준이 되는 팀 규칙과 결정)
- [x] 자동화 — mafia-codereview 플러그인 명령 (`/mafia-codereview:auto` 등 7개, 서브에이전트 리뷰)
- [x] 샘플 — SAMPLE.md 예제 앱 `todo-app` 설명

## 품질 기준

동작하는 샘플 또는 재현 가능한 프롬프트가 반드시 첨부되어야 하며, 문서는 따라 하면 되는 수준이어야 한다.

## 기준 버전과 주의 사항

- mafia-codereview 0.1.0 (2026-03-27 커밋 `e175e34`)
- 라이선스: README와 `plugin.json`에 MIT로 표기되어 있으나, 기준 커밋 시점에 별도의 LICENSE 파일은 없음
- 기준 브랜치 기본값은 `main`. 구현을 **커밋한 뒤** 기능 브랜치에서 실행해야 함
- 설계의도는 "현재 대화"에서 작성되므로, 구현한 대화 창에서 파이프라인을 실행하는 것이 좋음
- Fork 단계는 git worktree에서 실행될 수 있어, 리뷰 반영 커밋이 현재 브랜치에 들어왔는지 확인 필요

## 참고 링크
- 저장소: https://github.com/vibemafiaclub/mafia-codereview-harness
- 하네스·파이프라인 설명 영상: https://www.youtube.com/watch?v=CfLhrS0ww5w
- 명령 원문: https://github.com/vibemafiaclub/mafia-codereview-harness/tree/main/plugin/commands
- 기준 문서 원본 예시: https://github.com/vibemafiaclub/mafia-codereview-harness/tree/main/plugin/docs
