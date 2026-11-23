# 모듈 06 — 코딩 + TDD

> 상태: 단원 3개 초안 (담당: 윤성열)
> 한 줄: **테스트를 먼저 짜서 결정적으로 고정한 뒤, 에이전트에게 소스 코드를 생성하게 한다.**

## 목적

AI 에이전트는 같은 프롬프트에도 매번 다른 코드를 낸다(비일관성). 또한 스펙에 없는 동작을 지어낸다(환각). **테스트 코드를 먼저 작성해 기대 동작을 결정적으로 고정**하면, 에이전트의 구현이 그 테스트를 통과하는 쪽으로 모인다. 이 모듈은 그 흐름을 표준화한다.

근거와 한계를 함께 적는다.

- 문제 설명과 함께 테스트를 주면 코드 생성 벤치마크의 성공률이 높아졌다는 실험 결과가 있다(Mathews & Nagappan, 2024).
- TDD 절차만 지시해서는 부족할 수 있다. 어떤 테스트를 확인할지 알려 주지 않고 절차만 지시했더니 회귀가 늘었다는 사전 공개 연구가 있다(Alonso 외, 2026).
- 이 모듈의 단원 M02는 규칙 파일이 있을 때와 없을 때를 직접 실행해 비교한 기록을 담고 있다.

## 단원 구성

한 단원씩 순서대로 따라 한다. 단원마다 README(목적과 준비물), GUIDE(단계별 따라 하기), SAMPLE(명령과 프롬프트 요약)이 있다.

| 단원 | 내용 | 만드는 것 |
|---|---|---|
| [M01 — Red → Green → Refactor 한 바퀴](M01-red-green-refactor/) | 인수 조건 두 개를 테스트 목록, 실패하는 테스트, 최소 구현, 다듬기 순서로 구현한다. 불러오기 오류와 유효한 Red를 구분한다 | 테스트 2개가 통과하는 할 일 생성 기능 |
| [M02 — 규칙으로 고정하기](M02-tdd-rules/) | 같은 요청을 규칙 파일 없이 한 번, 넣고 한 번 실행해 차이를 기록한다. 통과시키려고 테스트를 고치는 일(테스트 세탁)을 찾아낸다 | 프로젝트의 `CLAUDE.md`, 관찰 기록 |
| [M03 — 스킬과 훅으로 절차 지키기](M03-test-first-skill/) | 절차를 스킬에 담고, 구현을 서브에이전트에게 맡기고, 구현 담당의 테스트 수정을 훅으로 막는다 | `/test-first` 스킬, `implementer` 서브에이전트, 테스트 보호 훅 |

## 입력

- 모듈 04(SDD)의 스펙
- 모듈 05(BDD)의 Gherkin 인수 조건

## 산출물

- 인수 조건을 1:1로 옮긴 테스트 스위트
- 테스트를 통과하는 소스 코드
- 모듈 08(CI)로 넘길 회귀 테스트 자산

## 흐름 (Red - Green - Refactor)

1. **인수 조건을 테스트로 변환** — Gherkin의 Given·When·Then을 테스트 케이스로 옮긴다.
2. **실패 확인(Red)** — 테스트가 단언에서 실패하는 것을 먼저 본다. 파일을 불러오지 못한 오류는 Red가 아니다.
3. **최소 구현(Green)** — 에이전트에게 "이 테스트를 통과하는 최소 코드"를 생성하게 한다.
4. **리팩터(Refactor)** — 테스트를 통과한 채로 구조를 다듬는다(모듈 07 객체설계와 연계).
5. **누적·게이트화** — 테스트를 회귀 스위트에 쌓고, 모듈 08에서 테스트 통과를 머지 게이트로 건다.

## 체크리스트

- [ ] 새 기능마다 실패하는 테스트를 먼저 작성했는가
- [ ] 그 실패가 단언 실패였는가
- [ ] 인수 조건(BDD)과 테스트가 1:1로 대응되는가
- [ ] 테스트가 통과하기 전에 다음 기능으로 넘어가지 않았는가
- [ ] 스펙에 없는 동작을 임의로 추가하지 않았는가
- [ ] 회귀 스위트에 누적되어 CI에서 자동 검증되는가

## 안티패턴

- 소스를 먼저 짜고 테스트를 나중에 맞추기(환각·비일관성 그대로 노출)
- 테스트를 통과시키려 구현이 아니라 테스트를 무르게 고치기
- 한 번에 여러 기능을 구현해 어디서 깨졌는지 추적 불가하게 만들기

## 산출물 4종

- 가이드: 이 문서와 단원별 GUIDE.md
- 규칙: [CLAUDE.md](CLAUDE.md) — 프로젝트의 `CLAUDE.md`로 복사하거나 불러와 쓴다(단원 M02)
- 자동화: [M03-test-first-skill/harness/.claude/](M03-test-first-skill/harness/.claude/) — `test-first` 스킬, `implementer` 서브에이전트, 테스트 보호 훅. 설계는 [skills/test-first.md](skills/test-first.md)에 있다
- 샘플: 단원별 SAMPLE.md와 실습 출발점(`todo-app`), 그리고 읽는 예시 [sample/](sample/)

## 검증 기록

단원마다 README에 검증 기록이 있다. 공통 환경은 macOS, Node.js v24.22.0, pnpm 12.21.0, Vitest 3.2.6, TypeScript 5.9.3, Claude Code 2.1.330(모델 Sonnet 5.5)이고 확인일은 2026-11-24다. 명령은 직접 실행했고, 프롬프트는 Claude Code 비대화형 실행으로 확인했다. AI의 응답은 실행마다 달라질 수 있다.

## 참고 자료

- Kent Beck, "Canon TDD", 2023-12-11. https://newsletter.kentbeck.com/p/canon-tdd
- Martin Fowler, "Test Driven Development", 2005-03-05 작성, 2023-12-11 개정. https://martinfowler.com/bliki/TestDrivenDevelopment.html
- Kent Beck, *Test-Driven Development: By Example*, Addison-Wesley, 2002.
- Noble Saji Mathews, Meiyappan Nagappan, "Test-Driven Development for Code Generation", arXiv:2402.13521, 2024. https://arxiv.org/abs/2402.13521
- Pepe Alonso, Sergio Yovine, Victor A. Braberman, "TDAD: Test-Driven Agentic Development - Reducing Code Regressions in AI Coding Agents via Graph-Based Impact Analysis", arXiv:2603.17973, 2026 (사전 공개 논문). https://arxiv.org/abs/2603.17973
- Anthropic, Claude Code 문서, "Best practices for Claude Code". https://code.claude.com/docs/en/best-practices
- obra/superpowers, `skills/test-driven-development/SKILL.md` (커밋 `d884ae0`, MIT). https://github.com/obra/superpowers/blob/d884ae04edebef577e82ff7c4e143debd0bbec99/skills/test-driven-development/SKILL.md
