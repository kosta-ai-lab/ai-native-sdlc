# 출처와 조사 범위

> 확인일: 2026-07-22

## 공식 문서와 프로젝트

1. Cucumber, [Behaviour-Driven Development](https://cucumber.io/docs/bdd/)
   - BDD의 Discovery, Formulation, Automation과 실행 가능한 예제의 역할
2. Cucumber, [BDD is not test automation](https://cucumber.io/blog/bdd/bdd-is-not-test-automation)
   - BDD를 단순 테스트 자동화로 축소하지 않기 위한 참고
3. Anthropic, [Claude Code CLI reference](https://docs.anthropic.com/en/docs/claude-code/cli-usage)
   - 비대화형 실행과 도구 허용·차단 범위
4. Anthropic, [Identity and access management](https://docs.anthropic.com/ko/docs/claude-code/iam)
   - 프로젝트 수준 권한 규칙과 도구 통제
5. modu-ai, [MoAI-ADK GitHub repository](https://github.com/modu-ai/moai-adk)
   - SPEC-first 흐름, TDD/DDD 분기, 에이전트·스킬·Hook·품질 체계
6. MoAI-ADK, [`moai` workflow documentation](https://adk.mo.ai.kr/utility-commands/moai)
   - Plan → Run → Sync 명령 흐름
7. obra, [Superpowers](https://github.com/obra/superpowers)
   - TDD, 구현 계획, subagent 개발과 완료 전 검증 스킬
8. Fission-AI, [OpenSpec](https://github.com/Fission-AI/OpenSpec)
   - 변경 명세, scenario, apply·verify·archive workflow
9. GitHub, [Spec Kit](https://github.com/github/spec-kit)
   - constitution, specification, task와 implementation workflow
10. BMAD, [Test Architect](https://bmad-code-org.github.io/bmad-method-test-architecture-enterprise/)
   - ATDD, 테스트 전략, 요구 추적과 release gate
11. Microsoft, [Set up a test-driven development flow in VS Code](https://code.visualstudio.com/docs/agents/guides/test-driven-development-guide)
   - Red·Green·Refactor 역할별 custom agent 구성 사례

## 도구별 심층 분석 기준점

재현성을 위해 장문 사례 연구에서 확인한 공개 저장소의 기준 커밋을 함께 기록한다. 링크의 `main` 내용은 이후 달라질 수 있으므로 강의 실습을 만들 때는 아래 SHA 또는 별도로 검증한 release tag에 고정한다.

- Superpowers: `d884ae04edebef577e82ff7c4e143debd0bbec99`
  - `skills/test-driven-development/SKILL.md`
  - `skills/verification-before-completion/SKILL.md`
- OpenSpec: `60f720c43acd94de7645ac8629c614ede4682b6a`
  - `src/core/templates/workflows/apply-change.ts`
  - `src/core/templates/workflows/verify-change.ts`
  - `docs/commands.md`
- GitHub Spec Kit: `d7699c39f2c3ab7d9c4f3eceff8f29ae1601cc3b`
  - `templates/constitution-template.md`
  - `templates/tasks-template.md`
  - `templates/commands/implement.md`
- BMAD TEA: 공식 웹 문서의 workflow overview, Test Design 및 Trace 가이드를 2026-07-22에 확인했다.

## 연구 자료

1. Pepe Alonso, [TDAD: Test-Driven Agentic Development — Reducing Code Regressions in AI Coding Agents via Graph-Based Impact Analysis](https://arxiv.org/abs/2603.17973), 2026.
   - 코드–테스트 영향 컨텍스트와 회귀 감소, TDD prompting-only 비교
   - 주의: arXiv 사전 공개 연구이며 제한된 모델·표본 결과
2. Tzafrir Rehan, [Test-Driven AI Agent Definition: Compiling Tool-Using Agents from Behavioral Specifications](https://arxiv.org/abs/2603.08806), 2026.
   - 행동 명세, visible/hidden tests, semantic mutation, 역할 분리
   - 주의: arXiv 사전 공개 연구로 후속 검증 필요
3. [Code as Agent Harness](https://arxiv.org/abs/2605.18747), 2026.
   - 실행 가능하고 검증 가능하며 상태를 유지하는 하니스의 연구 지형
   - 주의: 조사 시점에 공개된 사전 연구

## 내부 프로젝트 자료

1. `modules/06-coding-tdd/README.md`
2. `modules/06-coding-tdd/skills/test-first.md`
3. `samples/web-task-system/`
4. `modules/ext-harness/M01/`
5. `modules/ext-harness/M03/`
6. `frentis-vault/business/work/KOSTA/projects/WK-KOSTA AI코딩에이전트 자문회의.md`
7. `frentis-vault/business/work/KOSTA/projects/회차-06-260703-6차워크숍/브리핑-프로젝트-운영방향-260703.md`
8. `frentis-vault/business/work/KOSTA/projects/회차-06-260703-6차워크숍/데모대본-라이브-260703.md`

## MoAI 소스 확인 범위

공식 저장소를 shallow clone하여 다음을 검색·검토했다.

- `.claude/skills/moai-workflow-tdd/SKILL.md`
- `.claude/skills/moai-workflow-tdd/references/`
- `.claude/agents/`
- `.claude/hooks/`
- `.moai/reports/hooks-improvement-plan-20260710.html`
- `internal/session/`

이 조사는 전체 코드 감사나 제품 인증이 아니다. 구조와 교육 사례를 찾기 위한 표본 분석이며, 실제 과정에 MoAI를 포함하기 전에는 특정 버전을 고정하고 시나리오 기반 동작 검증을 별도로 수행해야 한다.

## 조사에서 구분한 것

- 공식 README의 수치와 품질 주장은 프로젝트 자체 보고로 취급했다.
- 저장소에서 파일과 규칙의 존재는 직접 확인했다.
- Hook이 모든 환경에서 실제 차단된다고 단정하지 않았다.
- 연구 논문의 결과는 적용 가능한 단서로 사용했으며 보편 법칙으로 표현하지 않았다.

## 강의 재료에서 확인한 MoAI 파일

- `.claude/commands/moai/run.md`
- `.claude/skills/moai-workflow-tdd/SKILL.md`
- `.claude/agents/moai/manager-develop.md`
- `.claude/agents/moai/e2e-tester.md`
- `.claude/agents/moai/plan-auditor.md`
- `.claude/settings.json`

구체 명령, workflow, timeout과 완료 조건은 위 파일을 기준으로 정리했다. 강의 실습에서는 조사 시점의 `main`이 아니라 검증된 릴리스 또는 커밋 SHA를 고정해야 한다.
