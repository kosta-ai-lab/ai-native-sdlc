# 개념

## 1. 메타 하네스(Harness)란?

Harness는 Claude Code용 "메타 스킬(meta-skill)"입니다. 한 문장으로 원하는 작업 도메인을 설명하면, 그 도메인에 맞는 전문 에이전트 팀(agent team)과 각 에이전트가 사용할 스킬(skill)을 자동으로 설계·생성해 줍니다. 쉽게 말해 "에이전트 팀을 만들어주는 공장" 역할을 합니다.

Harness 자체가 서베이 보고서를 써주는 도구는 아닙니다. 대신 "서베이 보고서를 작성하는 에이전트 팀"을 설계해서 내 프로젝트(`.claude/agents`, `.claude/skills`)에 생성해 주고, 그 팀이 실제 리서치·집필 작업을 수행하게 됩니다.

**소스 저장소:** github.com/revfactory/harness

### 동작 원리 (6단계 워크플로우)

1. **Phase 1 — Domain Analysis**: 요청한 도메인(주제)을 분석
2. **Phase 2 — Team Architecture Design**: 에이전트 팀 vs 서브에이전트 방식, 6가지 아키텍처 패턴 중 적합한 구조 선택
3. **Phase 3 — Agent Definition Generation**: `.claude/agents/` 에 에이전트 정의 파일 생성
4. **Phase 4 — Skill Generation**: `.claude/skills/` 에 각 에이전트가 사용할 스킬 생성
5. **Phase 5 — Integration & Orchestration**: 에이전트 간 데이터 전달, 오류 처리, 팀 조율 프로토콜 구성
6. **Phase 6 — Validation & Testing**: 트리거 검증, 드라이런 테스트, 스킬 유무 비교 테스트

### 6가지 팀 아키텍처 패턴

| 패턴 | 설명 |
|---|---|
| Pipeline | 순차적으로 의존 관계가 있는 작업을 처리 (예: 자료 수집 → 분석 → 작성 → 검수) |
| Fan-out / Fan-in | 독립적인 작업을 병렬로 수행한 뒤 결과를 취합 |
| Expert Pool | 주제·맥락에 따라 필요한 전문 에이전트만 선택적으로 호출 |
| Producer-Reviewer | 생성 담당과 검수 담당을 분리해 품질을 검증 |
| Supervisor | 중앙 감독 에이전트가 하위 작업을 동적으로 배분 |
| Hierarchical Delegation | 상위 에이전트가 하위 에이전트에게 재귀적으로 위임 |
---

# 1 단계: 사전 준비

### 2-1. Claude Code 설치

Harness는 Claude Code의 플러그인(마켓플레이스) 기능과 Agent Teams 기능 위에서 동작합니다. Claude Code가 아직 없다면 먼저 설치되어 있어야 합니다.

### 2-2. Agent Teams 기능 활성화 (필수)

> ⚠ Harness의 기본 실행 모드인 'Agent Teams'를 쓰려면 환경변수를 설정해 실험적 기능을 켜야 합니다. 이 설정 없이는 하네스가 생성한 팀이 서로 협업하는 형태로 정상 동작하지 않을 수 있습니다.

터미널(맥/리눅스)에서 아래처럼 환경변수를 설정한 뒤 Claude Code를 실행하세요.

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
claude
```

Windows(PowerShell)의 경우:

```powershell
$env:CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS="1"
claude
```

매번 설정하기 번거롭다면 쉘 설정 파일(`~/.zshrc`, `~/.bashrc` 등)에 `export` 구문을 추가해 영구적으로 적용할 수 있습니다.

## 체크리스트
[ ]  Claude 코드가 잘 실행되는지 확인한다.

# 2 단계: Claude Code에서 Meta-harness 설치하기

Claude Code를 실행한 상태에서 아래 슬래시 명령어를 순서대로 입력합니다.

### Step 1. 마켓플레이스 추가

```
/plugin marketplace add revfactory/harness
```

이 명령은 revfactory/harness 저장소를 플러그인 마켓플레이스로 등록합니다.

### Step 2. 플러그인 설치

```
/plugin install harness@harness-marketplace
```

> ⚠ 만약 `harness@harness-marketplace`로 입력했을 때 플러그인을 찾지 못한다는 오류가 나오면, 위 명령(`harness@harness`)으로 다시 시도해 보세요. `/plugin` 명령을 인자 없이 입력하면 설치 가능한 마켓플레이스/플러그인 목록을 확인할 수 있습니다.

## 체크리스트
[ ] harness 플러그인이 설치되었는지 확인한다.

설치가 끝나면 Claude Code에서 아래처럼 입력해 정상적으로 인식되는지 확인합니다.
```
/plugin
```
목록에 harness 플러그인이 활성화(enabled) 상태로 보이면 설치가 완료된 것입니다.

# 3 단계: 하네스 만들기 위한 작업 폴더 준비

보고서를 만들 새 프로젝트 폴더를 하나 만들고 그 안에서 Claude Code를 실행합니다. (하네스가 생성하는 `.claude/agents`, `.claude/skills` 폴더가 여기에 만들어집니다.)

```bash
mkdir neuro-symbolic-survey
cd neuro-symbolic-survey
claude
```
## 체크리스트
[ ] 폴더가 생성되었는지 확인한다.

# 4 단계: 하네스 트리거 프롬프트 입력

Claude Code 대화창에 아래와 같이 '이 도메인을 위한 하네스를 만들어줘' 라는 취지의 문장을 입력합니다. 한국어로도 동작합니다.

```
하네스 구성해줘.

주제: Neuro-Symbolic AI 연구 동향 서베이 보고서 작성

딥러닝(신경망)과 기호주의(Symbolic AI) 접근을 결합하는 Neuro-Symbolic AI 분야의
최신 연구를 조사해서 서베이 보고서를 작성하는 에이전트 팀을 만들어줘.
다음 역할을 포함했으면 해:
- 학술 논문/아카이브(arXiv 등) 및 웹 자료 조사 담당
- 조사 결과를 주제별로 분류하고 비교분석하는 담당
- 서론-본론(분류체계, 대표 연구, 한계)-결론 구조로 초안을 작성하는 담당
- 사실 확인, 인용 형식, 논리적 일관성을 검수하는 담당
각 에이전트가 작업 결과를 다음 에이전트에게 넘기는 파이프라인 구조로 설계해줘.
```

## 규칙
단순히 '하네스 구성해줘'라고만 해도 동작하지만, 위 예시처럼 (1) 다루려는 주제, (2) 원하는 역할 구성, (3) 선호하는 아키텍처(파이프라인/병렬 등)를 함께 적어주면 훨씬 더 목적에 맞는 팀이 만들어집니다.

Harness는 Phase 1~2에 따라 입력한 도메인을 분석하고, 이번 사례에 적합한 아키텍처 패턴(리서치 성격상 보통 Pipeline 또는 Producer-Reviewer)을 제안합니다. 이 단계에서 Claude Code가 제안하는 에이전트 구성(예: researcher, analyst, writer, reviewer)과 실행 모드(Agent Teams vs Subagents)를 확인하고, 필요하면 수정 요청을 합니다.

- 예: "researcher 에이전트를 2개로 나눠서 학술 논문 담당과 산업/블로그 자료 담당으로 분리해줘"
- 예: "최종 결과물은 워드 문서(.docx)로 만들 수 있게 writer 에이전트에 docx 스킬을 포함해줘"

## 산출물

승인하면 Phase 3~4가 진행되며 아래와 같은 파일들이 프로젝트에 생성됩니다.

```
neuro-symbolic-survey/
└── .claude/
    ├── agents/
    │   ├── researcher.md
    │   ├── analyst.md
    │   ├── writer.md
    │   └── reviewer.md
    └── skills/
        ├── research/
        │   └── SKILL.md
        ├── analyze/
        │   └── SKILL.md
        ├── write-survey/
        │   └── SKILL.md
        └── review/
            └── SKILL.md
```

각 파일을 열어 에이전트의 역할, 스킬의 사용 시점(트리거 조건)이 내가 원하는 방향과 맞는지 가볍게 검토합니다. 마음에 들지 않으면 자연어로 "analyst.md에서 비교 기준에 '성능(benchmark)' 항목도 추가해줘"처럼 수정을 요청할 수 있습니다.

이후, Harness는 실제로 팀을 실행하기 전에 트리거가 잘 작동하는지, 스킬이 있을 때와 없을 때 결과 품질에 차이가 있는지 간단히 점검하는 과정을 제공합니다. 이 단계에서 제안하는 테스트를 그대로 진행하거나, 생략하고 바로 다음 단계로 넘어갈 수 있습니다.

## 체크리스트
[ ] 상기 산출물의 구조가 구성되는지 확인한다.

