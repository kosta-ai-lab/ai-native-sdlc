# 모듈 — pstack — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

Cursor 공식 플러그인 저장소의 pstack(Lauren Tan, poteto)을 Claude Code에 설치하고, 할 일 관리 앱에 **반복 할 일** 기능을 추가하는 실습으로 **목표와 완료 조건만 말하면 `/poteto-mode`가 플레이북을 골라 설계·구현·검증까지 증거와 함께 끝내는** 방식을 익히며, 원칙·플레이북·검증 스킬로 하네스를 구성하는 방법을 배워본다.

## 이 모듈에서 다루는 것

| 구분 | 내용 |
|---|---|
| 설치 | `claude plugin marketplace add cursor/plugins` → `claude plugin install pstack@cursor-plugins` |
| 설정 | `/pstack:setup-pstack` — 예산과 역할별 모델, **프로젝트 검증 스킬**(`verify-todo-app`) 생성 |
| 이해 | `/pstack:how` — 고치기 전에 현재 코드의 동작을 설명받기 (읽기 전용) |
| 구현 | `/pstack:poteto-mode` — 목표·완료 조건·증거·제약을 담은 한 번의 요청 → Feature 플레이북 → architect/arena 설계 → 서브에이전트 구현 → 실제 실행 증거 |
| 검증 | `/pstack:interrogate` — 여러 적 에이전트가 변경을 깨뜨려 보고, **실행으로 증명된 문제만** 보고 |
| 정리 | `/pstack:no-comments` — 다른 눈(Comment Sicko)으로 주석 정리 |
| 출시 | (선택) Opening a PR 플레이북으로 PR 생성 (GitHub 필요) |
| 실습 예제 | `todo-app` 할 일 관리 CLI에 "완료하면 다음 회차가 생기는 반복 할 일" 추가 |

## 같은 예제로 본 세 하네스 비교

M33(mattpocock/skills), M35(gstack), M37(pstack)은 모두 같은 `todo-app` + 반복 할 일 예제를 씁니다.

| 관점 | mattpocock/skills (M33) | gstack (M35) | pstack (M37) |
|---|---|---|---|
| 철학 | 작고 조합 가능한 스킬. 과정은 사람이 쥠 | 스프린트 전체를 역할별 과정으로 제공 | "빨리 가려면 먼저 깊게". 적지만 좋은 코드 |
| 입구 | 단계마다 다른 스킬 | `/office-hours`부터 순서대로 | **`/poteto-mode` 하나** |
| 사람의 결정 | 인터뷰로 하나씩 합의 | 단계마다 질문 | **프롬프트에 미리** 담음. 진행 후 바로잡기 |
| 계획 | 스펙·티켓 문서 | 설계 문서 + `/autoplan` | 계획 스킬 없음. `architect`·`arena`로 시안 경쟁 |
| 검증 | `tdd` + 두 축 `code-review` | `/review` + `/qa` | 검증 스킬로 **실제 실행 증거** + `/interrogate` |
| 여러 모델 | 사용 안 함 | 선택(Codex 두 번째 의견) | 기본 설계에 포함(Opus·Grok 패널). Claude Code에서는 Claude만 |
| 주 대상 도구 | 여러 에이전트 | Claude Code | **Cursor** (Claude Code 어댑터 제공) |

## 문서 구성

- [GUIDE.md](GUIDE.md) — 개념 설명과 0~8단계 따라하기 (단계별 규칙·산출물·체크리스트)
- [SAMPLE.md](SAMPLE.md) — 명령어와 프롬프트만 모은 실행용 요약
- [todo-app/](todo-app/) — 실습 출발점이 되는 할 일 관리 CLI (Node.js, 의존성 없음, 테스트 5개). 강의 자료 저장소 밖으로 복사해서 사용

## 산출물 4종 (체크리스트)

- [x] 가이드 — GUIDE.md 단계 목적·입력·산출물·체크리스트
- [ ] 규칙 — CLAUDE.md 조각 (pstack은 모델 설정을 `~/.claude/rules/pstack-models.md`에 별도 규칙으로 저장)
- [x] 자동화 — pstack 스킬·서브에이전트 (`/pstack:poteto-mode`, `/pstack:interrogate`, `poteto-agent`, Comment Sicko 등) + 생성된 프로젝트 검증 스킬 `verify-todo-app`
- [x] 샘플 — SAMPLE.md 동작 스텝·프롬프트

## 품질 기준

동작하는 샘플 또는 재현 가능한 프롬프트가 반드시 첨부되어야 하며, 문서는 따라 하면 되는 수준이어야 한다.

## 기준 버전과 주의 사항

- pstack 0.15.36 (cursor/plugins 2026-11-09 커밋 `de8ee15`), MIT 라이선스
- pstack은 **Cursor 우선**으로 만들어졌습니다. Claude Code에서는 명령에 `pstack:` 접두어가 붙고, Cursor 전용 기능(Automations, Bugbot, 클라우드 에이전트)은 건너뛰며, Claude가 아닌 모델(Grok 등) 역할은 세션 모델로 실행됩니다.
- 서브에이전트와 리뷰 패널을 많이 쓰므로 토큰 사용량이 큽니다. 실습에서는 예산 `small`을 권장합니다.
- Claude Code에서는 제3자 마켓플레이스 자동 업데이트가 꺼져 있어 설치한 버전에 머뭅니다.

## 참고 링크
- pstack: https://github.com/cursor/plugins/tree/main/pstack
- pstack 가이드(10장): https://github.com/cursor/plugins/tree/main/pstack/docs/guide
- Claude Code 어댑터(이름 대응표): https://github.com/cursor/plugins/blob/main/pstack/docs/harness/claude-code.md
- `/poteto-mode`와 플레이북: https://github.com/cursor/plugins/tree/main/pstack/skills/poteto-mode
