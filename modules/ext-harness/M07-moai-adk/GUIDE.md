# 개념

## 왜 필요할까? — 바이브코딩의 문제점

"이런 기능 만들어줘"라고 편하게 대화하며 코딩하는 방식을 **바이브코딩**이라 부릅니다. 빠르고 직관적이지만 실무에서는 아래와 같은 문제가 생깁니다.

| 문제 | 상황 예시 |
|---|---|
| 맥락 유실 | 어제 논의한 내용을 오늘 다시 설명해야 함 |
| 품질 불일치 | AI가 어떤 때는 좋은 코드, 어떤 때는 나쁜 코드를 생성 |
| 기존 코드 파괴 | "이 부분 고쳐줘" 했더니 다른 기능이 망가짐 |
| 반복 설명 | 프로젝트 구조·규칙을 매번 다시 알려줘야 함 |
| 검증 부재 | 생성된 코드가 안전한지 확인할 방법이 없음 |

MoAI-ADK는 각 문제에 대응하는 해결책을 제공합니다.

| 문제 | 해결책 |
|---|---|
| 맥락 유실 | **SPEC 문서**로 요구사항을 파일로 영구 보존 |
| 품질 불일치 | **TRUST 5** 프레임워크로 일관된 품질 기준 적용 |
| 기존 코드 파괴 | **DDD/TDD**로 테스트를 먼저 작성해 기존 기능 보호 |
| 반복 설명 | **CLAUDE.md와 스킬 시스템**으로 프로젝트 컨텍스트 자동 로드 |
| 검증 부재 | **LSP 품질 게이트**로 코드 품질 자동 검증 |

## MoAI-ADK란? 

> 참조: [(공식 문서)](https://adk.mo.ai.kr/ko/core-concepts/what-is-moai-adk)

MoAI-ADK는 **Claude Code를 위한 AI 개발 환경**입니다. 28개의 전문 AI 에이전트와 52개의 스킬이 협력하여 코드를 작성합니다.
- **MoAI**: "모두의 AI"(Everybody's AI)
- **ADK**: Agentic Development Kit — AI 에이전트가 개발을 주도하는 도구 모음

Go 언어로 작성된 **단일 바이너리**라서 별도 설치 없이 모든 운영체제에서 바로 실행됩니다.
즉, AI와 나눈 대화를 문서(SPEC)로 남기고, 안전하게 코드를 개선(DDD/TDD)하며, 품질을 자동 검증(TRUST 5)하는 AI 개발 프레임워크입니다.

## SPEC → 구현 → 동기화, 3단계 워크플로우 실행

MoAI-ADK의 핵심 흐름은 **Plan → Run → Sync** 세 단계입니다.

```
/moai plan "사용자 인증 기능 구현"   # 1. SPEC 문서 생성
/moai run SPEC-001                  # 2. TDD/DDD 방식 구현
/moai sync SPEC-001                 # 3. 문서 동기화 및 PR 생성
```

## 예제: 간단한 API 엔드포인트 만들기

```
# 1) 프로젝트 문서 생성 (최초 1회만)
/moai project

# 2) SPEC 생성
/moai plan "사용자 목록 조회 API 엔드포인트 구현"
/clear

# 3) 구현
/moai run SPEC-001
/clear

# 4) 문서화 및 PR
/moai sync SPEC-001
```

## 한 번에 자동 실행하기

세 단계를 모두 자동으로 처리하고 싶다면:

```
/moai "사용자 인증 기능 구현"
```

# 1 단계: 시스템 요구사항 확인하기

| 플랫폼 | 지원 환경 | 비고 |
|---|---|---|
| macOS | Terminal, iTerm2 | 완전 지원 |
| Linux | Bash, Zsh | 완전 지원 |
| Windows | WSL(권장), PowerShell 7.x+ | cmd.exe 미지원 |

**필수 조건**
- 모든 플랫폼에 **Git** 설치 필요
- Windows는 [Git for Windows](https://gitforwindows.org/) 필수 (WSL 사용을 권장)

## 체크리스트
[ ] 설치 가능한 운영환경인지 확인한다.


# 2 단계: MoAI-ADK 설치하기

## macOS / Linux / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/modu-ai/moai-adk/main/install.sh | bash
```

## Windows (PowerShell 7.x+)

```powershell
irm https://raw.githubusercontent.com/modu-ai/moai-adk/main/install.ps1 | iex
```

> Git for Windows가 먼저 설치되어 있어야 합니다.

## 소스에서 직접 빌드 (Go 1.26+)

```bash
git clone https://github.com/modu-ai/moai-adk.git
cd moai-adk && make build
```

설치가 끝나면 아래 명령으로 상태를 점검해보세요.

```bash
moai doctor
```

## 체크리스트
[ ] MoAI-ADK설치가 잘 되었는지 확인한다.

# 3 단계: 첫 신규 프로젝트 만들기

```bash
moai init my-first-project
cd my-first-project
```

기존 프로젝트에 적용하려면 해당 폴더에서 다음을 실행합니다.

```bash
cd existing-project
moai init
```

대화형 마법사가 언어, 프레임워크, 개발 방법론(TDD/DDD)을 자동 감지하고 Claude Code 통합 파일을 생성합니다.

## 산출물

`moai init` 실행 후 다음과 같은 구조가 생성됩니다. 해당 구조 확인은 맥이나 리눅스라면 다음 명령어로 확인 가능합니다.

```bash
treee -a -L 3
```

```
my-first-project/
├── CLAUDE.md                  # MoAI가 읽는 실행 지침서
├── .claude/
│   ├── agents/moai/           # AI 에이전트 정의
│   ├── skills/moai-*/         # 스킬 모듈
│   ├── hooks/moai/            # 자동화 훅 스크립트
│   └── rules/moai/            # 코딩 규칙
└── .moai/
    ├── config/sections/
    │   └── quality.yaml       # TRUST 5 품질 설정
    ├── specs/
    │   └── SPEC-XXX/spec.md   # SPEC 문서 저장소
    └── memory/                # 세션 간 컨텍스트 유지
```

| 파일/디렉토리 | 역할 |
|---|---|
| `CLAUDE.md` | 프로젝트 규칙, 에이전트 카탈로그, 워크플로우 정의 |
| `.claude/agents/` | 각 에이전트의 전문 분야와 도구 권한 정의 |
| `.claude/skills/` | 언어·플랫폼별 모범 사례 지식 모듈 |
| `.moai/specs/` | 기능별 SPEC 문서 저장 |
| `.moai/config/` | 품질 기준, DDD/TDD 설정 등 프로젝트 설정 |

## 체크리스트
[ ] 프로젝트 폴더가 있는지 확인한다.


# 4 단계: 프로젝트 문서 생성

Claude Code를 실행한 뒤, 프로젝트를 이해시키기 위한 기초 문서를 만듭니다.

```
/moai project
```

## 규칙
이 명령은 프로젝트 초기 설정 후, 또는 구조가 크게 바뀐 후에 다시 실행하면 됩니다.

## 산출물
.moai/project 폴더 하에 다음 3개 파일이 자동 생성됩니다.

| 파일 | 내용 |
|---|---|
| `product.md` | 프로젝트 이름, 설명, 타겟 사용자, 핵심 기능 |
| `structure.md` | 디렉토리 트리, 주요 폴더 목적, 모듈 구성 |
| `tech.md` | 사용 기술, 프레임워크, 빌드/배포 설정 |

## 체크리스트
[ ] `product.md`, `structure.md`, `tech.md` 파일이 만들어졌는지 확인한다.

# 5 단계: SPEC 작성하기

SPEC은 "AI와 나눈 대화를 문서로 남기는 것"입니다. 세션이 끊기거나 컨텍스트가 초기화되어도, SPEC 문서만 읽으면 다시 이어서 작업할 수 있습니다.

```
/moai plan "사용자 인증 기능 구현"
```

## 규칙
> 팁: SPEC 생성 후에는 `/clear`로 세션을 초기화해 토큰을 절약하세요.

## 산출물
생성된 SPEC은 `.moai/specs/SPEC-001/spec.md`에 저장됩니다. EARS 형식으로 요구사항이 명확하게 구조화되고, 인수 기준(완료 조건)도 함께 정의됩니다.

## 체크리스트
[ ]  spec.md가 있는지 확인한다.

# 6 단계: Spec. 구현하기

```
/clear
/moai run SPEC-001
```

MoAI-ADK는 프로젝트 상태를 보고 방법론을 자동 선택합니다.

**TDD (신규 프로젝트 / 커버리지 10% 이상)** — "시험 문제를 먼저 만들고 공부하기"에 비유할 수 있습니다.

| 단계 | 의미 |
|---|---|
| 🔴 RED | 아직 없는 기능의 테스트를 먼저 작성 (실패) |
| 🟢 GREEN | 테스트를 통과하는 최소한의 코드 작성 |
| 🔵 REFACTOR | 테스트를 유지하며 코드 품질 개선 |

**DDD (기존 프로젝트 / 커버리지 10% 미만)** — "집을 부수지 않고 리모델링하기"에 비유할 수 있습니다.

| 단계 | 비유 | 실제 작업 |
|---|---|---|
| ANALYZE | 집 점검하기 | 현재 코드 구조와 문제점 파악 |
| PRESERVE | 현재 상태 사진 찍기 | 특성화 테스트로 현재 동작 기록 |
| IMPROVE | 방 하나씩 리모델링 | 테스트 통과를 유지하며 점진적 개선 |

## 규칙
`/moai run`은 기본적으로 테스트 커버리지 85% 이상을 목표로 합니다. 완료 조건은 커버리지 85%↑, 오류 0건, 타입 오류 0건입니다.

## 산출물
테스트 케이스

## 체크리스트
[ ] 테스트 케이스가 생성되었는지 확인한다.

# 7 단계: 문서 동기화하기 

```
/clear
/moai sync SPEC-001
```

품질 검증과 함께 문서(코드맵 등)를 자동 생성하고, 필요 시 PR도 생성합니다.

## 체크리스트
[ ] 문서가 업데이트 되었는지 확인한다.

# 상황별 명령어 선택 가이드

| 상황 | 권장 명령어 | 이유 |
|---|---|---|
| 신규 프로젝트 | `/moai project` 먼저 실행 | 기초 문서가 필수적 |
| 단순 기능 | `/moai plan` + `/moai run` | 빠른 실행 |
| 복잡한 기능 | `/moai` | 자동 최적화 |
| 병렬 개발 | `--worktree` 플래그 사용 | 독립된 작업 환경 보장 |

# 품질 확인과 자동 수정

개발 중 언제든 품질 상태를 확인할 수 있습니다.

```bash
moai doctor
```

이 명령은 LSP 진단(오류·경고), 테스트 커버리지, 린터 상태, 보안 검증을 확인합니다.

버그를 자동으로 고치고 싶다면:

```
/moai fix "테스트에서 발생하는 TypeError 수정"    # 한 번 수정
/moai loop "모든 린터 경고 수정"                  # 완료될 때까지 반복 수정
```

---

# 알아두면 좋은 핵심 개념

- **TRUST 5**: Tested(테스트됨) · Readable(읽기 쉬움) · Unified(통일됨) · Secured(안전함) · Trackable(추적 가능) — 모든 코드 변경을 검증하는 5가지 품질 기준
- **@MX 태그**: 에이전트 간 컨텍스트·위험 영역을 전달하는 코드 주석 시스템(`@MX:ANCHOR`, `@MX:WARN`, `@MX:NOTE`, `@MX:TODO`)
- **이중 실행 모드**: 여러 에이전트가 동시에 작업하는 **Agent Teams** 모드(기본값)와, 한 번에 하나씩 순차 위임하는 **Sub-Agent**(`--solo`) 모드

---

# 토큰 관리 팁

대규모 작업에서는 각 단계 뒤에 `/clear`를 실행해 토큰을 절약하세요.

```
/moai plan "복잡한 기능 구현"
/clear
/moai run SPEC-001
/clear
/moai sync SPEC-001
```

---

# 다음 단계

이 튜토리얼로 기본 흐름을 익혔다면, 아래 공식 문서로 더 깊이 알아보세요.

- [SPEC 기반 개발](https://adk.mo.ai.kr/ko/core-concepts/spec-based-dev) — 요구사항을 문서로 정의하는 방법
- [MoAI-ADK 개발 방법론(DDD)](https://adk.mo.ai.kr/ko/core-concepts/ddd) — 기존 코드를 안전하게 개선하는 방법
- [TRUST 5 품질](https://adk.mo.ai.kr/ko/core-concepts/trust-5) — 코드 품질 자동 검증 방법
- [MoAI Memory](https://adk.mo.ai.kr/ko/core-concepts/moai-memory) — 세션 간 컨텍스트 보존 방식
- [CLI 레퍼런스](https://adk.mo.ai.kr/ko/getting-started/cli) — 전체 명령어 목록

