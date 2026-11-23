# 모듈 06 · 단원 M03 — 스킬과 훅으로 절차 지키기

> 상태: 초안 · 담당: 윤성열
> 검증 기준: Claude Code 2.1.330(모델 Sonnet 5.5) · Vitest 3.2.6 · TypeScript 5.9.3 · pnpm 12.21.0 · Node.js v24.22.0 (2026-11-24)

## 목적

테스트를 먼저 쓰는 절차를 **스킬**에 담고, 구현을 **구현 담당 서브에이전트**에게 맡기고, 구현 담당이 테스트를 고치지 못하게 **훅**으로 막는다. 단원 M02에서 본 문제 두 가지를 줄이는 구성이다. 규칙이 있어도 "한 번에 한 기능"은 잘 지켜지지 않았고, 규칙이 없으면 테스트 세탁이 일어났다.

이 단원을 마치면 다음을 할 수 있다.

- 프로젝트 스킬(`.claude/skills/<이름>/SKILL.md`)을 만들고 `/이름`으로 부른다.
- 서브에이전트(`.claude/agents/<이름>.md`)를 만들어 구현을 맡긴다.
- `PreToolUse` 훅으로 특정 서브에이전트의 파일 수정을 막고, 스크립트를 직접 실행해 판정을 확인한다.
- 규칙, 스킬, 훅의 강제력이 어떻게 다른지, 이 구성이 무엇을 막지 못하는지 설명한다.

## 이 단원에서 다루는 것

| 구분 | 내용 |
|---|---|
| 스킬 | `/test-first <인수조건 파일>`: 한 번에 한 항목씩 테스트, Red 확인, 구현 위임, Green 확인, 기록 |
| 서브에이전트 | `implementer`: 실패한 테스트를 통과하는 최소 구현만 작성 |
| 훅 | `protect-tests.mjs`: 구현 담당이 `test/`, `docs/`를 고치려 하면 종료 코드 2로 막는다 |
| 실습 예제 | [단원 M02의 todo-app](../M02-tdd-rules/todo-app/): 구현되지 않은 시나리오 두 개 |

## 문서 구성

- [GUIDE.md](GUIDE.md) — 개념과 0~7단계 따라 하기 (파일 내용 전체 포함)
- [SAMPLE.md](SAMPLE.md) — 명령과 프롬프트만 모은 실행용 요약
- [harness/.claude/](harness/.claude/) — 완성본. 스킬, 서브에이전트, 훅 스크립트, 설정 파일

## 사전 준비물

[단원 M01](../M01-red-green-refactor/README.md#사전-준비물)과 같다.

## 산출물 4종 (체크리스트)

- [x] 가이드 — [GUIDE.md](GUIDE.md)
- [x] 규칙 — [../CLAUDE.md](../CLAUDE.md) (단원 M02)
- [x] 자동화 — [harness/.claude/](harness/.claude/): `test-first` 스킬, `implementer` 서브에이전트, 테스트 보호 훅
- [x] 샘플 — [SAMPLE.md](SAMPLE.md)

## 완료 기준

- [ ] 훅을 직접 실행했을 때 구현 담당과 `test/`의 조합에서 `exit=2`가 나온다.
- [ ] `/test-first docs/05-acceptance.feature` 실행 뒤 `pnpm test`가 `Tests  4 passed (4)`를 출력한다.
- [ ] `docs/tdd-log.md`에 두 항목의 Red(단언 실패 메시지)와 Green(결과 줄)이 있다.
- [ ] 구현 담당에게 테스트를 고치게 해도 테스트 파일이 바뀌지 않는다.

## 검증 기록 (2026-11-24)

- 환경: macOS, Node.js v24.22.0, pnpm 12.21.0, Vitest 3.2.6, TypeScript 5.9.3, Claude Code 2.1.330(모델 Sonnet 5.5)
- 훅 스크립트를 다섯 가지 입력으로 직접 실행했다. 구현 담당과 `test/`, 구현 담당과 `docs/`는 종료 코드 2, 구현 담당과 `src/`, 메인 세션과 `test/`, 다른 서브에이전트와 `test/`는 종료 코드 0이었다.
- `/test-first docs/05-acceptance.feature`를 Claude Code 비대화형 모드(`claude -p`)로 2회 실행했다. 두 번 모두 한 항목씩 진행했고, 구현은 `implementer`가 했고, `docs/test-list.md`와 `docs/tdd-log.md`가 만들어졌고, 테스트 4개가 통과했다.
- 구현 담당에게 테스트 수정을 맡기는 요청을 3회 실행했다. 지시문이 있는 구현 담당(1회)은 시도하지 않고 거절했다. 지시문을 한 줄로 바꾼 구현 담당(2회, 그중 1회는 `CLAUDE.md`의 TDD 규칙도 뺀 상태)은 Edit를 시도했다가 훅에 막혔다. 세 번 모두 테스트 파일은 바뀌지 않았다.
- 메인 세션에 테스트 파일 수정을 요청한 1회에서는 셸 명령(`printf … >>`)으로 고쳤고 훅은 실행되지 않았다(GUIDE 7단계의 한계). 메인 세션의 Edit가 막히지 않는 것은 `/test-first` 2회에서 확인했다.
- 확인하지 않은 것: 대화형 화면에서의 표시(신뢰 확인 창, 서브에이전트 표시), 다른 운영체제(Windows의 경로 구분자), 다른 모델.

## 참고 자료

[GUIDE.md의 참고 자료](GUIDE.md#참고-자료)에 모았다.
