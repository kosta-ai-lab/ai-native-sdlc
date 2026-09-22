# 개념

## 1. 루프 엔지니어링이란?

기존 방식은 사람이 매번 AI 코딩 에이전트에게 "이거 해줘", "저거 고쳐줘"라고 직접 프롬프트를 입력하는 것이었습니다.

루프 엔지니어링은 이 역할을 바꿉니다. 사람이 에이전트에게 매번 명령하는 대신, **에이전트를 스스로 실행시키는 "루프(시스템)"를 설계**합니다. 이 루프가 알아서 다음을 반복합니다.

1. 일정에 따라 실행됨 (스케줄링)
2. 무엇을 할지 판단함 (트리아지)
3. 상태를 기록/참조함 (메모리)
4. 격리된 작업 공간에서 실행함 (워크트리)
5. 실제로 구현함 (구현 서브에이전트)
6. 검증함 (검증 서브에이전트)
7. 안전하면 자동 반영, 애매하면 사람에게 확인 요청 (휴먼 게이트)

이 저장소가 인용하는 두 명언이 이 개념을 잘 요약합니다.

> "You shouldn't be prompting coding agents anymore. You should be designing loops that prompt your agents." — Peter Steinberger

> "I don't prompt Claude anymore. I have loops running that prompt Claude and figuring out what to do. My job is to write loops." — Boris Cherny (Anthropic, Claude Code 총괄)

즉, 루프 엔지니어링에서 여러분의 역할은 "프롬프트 작성자"가 아니라 **"루프(제어 시스템) 설계자"** 입니다.

## 2. 핵심 구성 요소 (5가지 + 메모리)

| 구성 요소 | 루프에서의 역할 |
|---|---|
| **자동화/스케줄링** | 주기적으로 작업 발굴 및 트리아지 실행 |
| **워크트리(Worktree)** | 안전한 병렬 작업 공간 |
| **스킬(Skills)** | 프로젝트에 대한 지속적인 지식 저장 |
| **플러그인/커넥터** | MCP를 통해 실제 도구(GitHub, Slack 등)와 연결 |
| **서브에이전트** | 구현 담당 / 검증 담당으로 역할 분리 |
| **+ 메모리/상태** | 대화가 끝나도 남아있는 지속적인 기록 |

### 루프의 흐름도

```
스케줄/자동화 → 트리아지 스킬 → STATE.md 읽기/쓰기 → 격리된 워크트리
   → 구현 서브에이전트 → 검증 서브에이전트(테스트+게이트)
   → MCP/Git/티켓 연동 → 휴먼 게이트 확인
        ├─ 안전하면 → 커밋/PR/액션 실행 → (다시 처음으로)
        └─ 위험하면 → 사람에게 에스컬레이션 → (다시 처음으로)
```

## 3. 복사해서 바로 쓰는 치트시트

다음이 전체적인 흐름이며, 각 단계를 통해 자세히 설명한다.

```bash
# 1) 스캐폴드 생성
npx @cobusgreyling/loop init . --pattern daily-triage --tool grok

# 2) 비용 확인
npx @cobusgreyling/loop cost --pattern daily-triage --level L1 --cadence 1d

# 3) 준비 상태 점검 + 개선 제안
npx @cobusgreyling/loop audit . --suggest

# 4) (선택) README용 배지 생성
npx @cobusgreyling/loop audit . --badge

# 5) 상태 대시보드 확인
npx @cobusgreyling/loop status .

# 6) 종합 헬스체크 (audit + sync + 파일 점검 → 상위 3개 액션 제안)
npx @cobusgreyling/loop doctor .
```

# 1 단계: 시작 전 준비하기.
시작하기 전에 아래 항목을 준비하세요.
- **Node.js** (npx 명령을 쓰기 위해 필요, LTS 버전 권장)
- **Git 저장소** — 루프를 적용할 프로젝트 (git 초기화가 된 폴더)
- AI 코딩 에이전트 중 하나: **Grok**, **Claude Code**, **Codex** 등 (튜토리얼에서는 Claude Code 예시를 다룹니다)
- 별도 클론(clone) 불필요 — 모든 도구는 `npx`로 바로 실행됩니다.

## 체크리스트
[ ] 사전 준비가 되었는지 체크한다.

# 2 단계: 어떤 루프를 먼저 만들지 정하기

이 저장소는 7가지 검증된 패턴을 제공합니다.

| 패턴 | 주기 | 1주차 목표 | 토큰 비용 |
|---|---|---|---|
| Daily Triage | 1일~2시간 | L1 리포트 | 낮음 |
| PR Babysitter | 5~15분 | L1 감시 | 높음 |
| CI Sweeper | 5~15분 | L2 신중 처리 | 매우 높음 |
| Dependency Sweeper | 6시간~1일 | L2 패치만 | 중간 |
| Changelog Drafter | 1일 또는 태그 시 | L1 초안 작성 | 낮음 |
| Post-Merge Cleanup | 1일~6시간 | L1 비피크 시간 | 낮음 |
| Issue Triage | 2시간~1일 | L1 제안만 | 낮음 |

처음이라면 **Daily Triage**로 시작하는 것을 추천합니다. 위험도가 낮고 루프의 기본 동작 방식을 익히기 좋습니다.

## 규칙
> **1주차 원칙:** 처음에는 "리포트만" 생성하도록 합니다. 자동 수정(auto-fix)·자동 병합(auto-merge)은 아직 켜지 마세요. 루프가 무엇을 기록하는지 먼저 사람이 확인하는 습관을 들이는 것이 중요합니다.

## 체크리스트
[ ] Daily Triage에 대해서 이해한다.

# 3 단계: 프로젝트에 루프 뼈대(scaffold) 만들기
작업할 git 프로젝트의 루트 폴더에서 아래 명령을 실행합니다. (클론 필요 없음)
```bash
npx @cobusgreyling/loop init . --pattern daily-triage --tool claude
```
- `--tool` 옵션은 `grok`, `claude`, `codex` 중 사용하는 에이전트에 맞게 바꿉니다.
- 이 명령은 스킬, 상태 파일, 예산 파일을 자동 생성하고 **Loop Ready 점수**와 첫 실행 명령을 출력해 줍니다.
- 생성되는 파일 예시: `STATE.md`, `LOOP.md`, `loop-budget.md`, `loop-run-log.md`

## 규칙
> 참고: 예전 방식인 `npx @cobusgreyling/loop-init .` 도 동일하게 계속 지원됩니다.

## 산출물

```bash
my-loop-demo/
└── .claude/
    ├── AGENTS.md
    ├── loop-budget.md
    ├── loop-constraints.md
    ├── loop-run-log.md
    ├── LOOP.md          
    └── STATE.md     
```

## 체크리스트
[ ] 루프가 실행되어 산출물이 생성되었는지 확인한다.

# 4 단계: 실행 전 토큰 비용 확인하기

루프를 스케줄에 올리기 전에 예상 비용을 확인합니다.
```bash
npx @cobusgreyling/loop cost --pattern daily-triage --level L1 --cadence 1d
```
## 규칙
- `--level`은 자동화 단계를 의미합니다: `L1`(리포트만) → `L2`(보조 수정) → `L3`(완전 무인 실행)
- `--cadence`(주기)는 실제로 계획한 주기로 맞춰서 확인하세요. CI Sweeper처럼 5분마다 도는 루프는 토큰을 빠르게 소모할 수 있습니다.

## 산출물
다음과 같은 예측이 출력됩니다.

```bash
Loop Cost Estimate — Daily Triage (daily-triage)
══════════════════════════════════════════════════
Cadence: 1d  →  1 runs/day
Level: L1  ·  Registry tier: low
Suggested daily cap: 100k tokens

Daily token estimates:
  Early-exit / no-op:  5k  (5k/run)
  Full triage:         50k  (50k/run)
  Action every run:    200k  (200k/run)
  Realistic blend:     23k  (L1: 60% no-op, 40% full triage)

Warnings:
  ! Worst case (action every run) exceeds suggested cap (100k/day).

Docs: docs/operating-loops.md · Scaffold: npx @cobusgreyling/loop-init    
```

## 체크리스트
[ ] 예산 비용을 확인한다.

# 5 단계: 준비 상태 점검하기 (Audit)
```bash
npx @cobusgreyling/loop audit . --suggest
```
- 0~100점으로 루프의 준비 상태를 채점하고, 구체적인 개선 제안을 함께 보여줍니다.
- 개선할 때마다 다시 실행해서 점수 변화를 확인하세요.

점수에 자신 있으면 README용 배지도 만들 수 있습니다.
```bash
npx @cobusgreyling/loop audit . --badge
```

## 체크리스트
[ ] 준비 상태를 점검한다.

# 6 단계: 첫 루프 실행하기 (리포트 전용)
코딩 에이전트(클로드)를 사용하는 에이전트 안에서 아래 명령어를 입력합니다.
**Claude Code 사용 시:**
```
/loop 1d Run $loop-triage. Read STATE.md. Merge findings into High Priority and Watch List. Update Last run. Do not edit code.
```
## 규칙
**Grok 사용 시:**
```
/loop 1d Run loop-triage. Update STATE.md. No auto-fix in week one.
```
**Codex 사용 시:**
- `loop init` 실행 시 출력된 패턴 전용 첫 실행 명령을 그대로 사용합니다. 1주차에는 트리아지와 상태 업데이트만 하도록 합니다.
**Cursor/Windsurf 사용 시:**
- 아직 `--tool cursor` 전용 스캐폴드는 없습니다. 다른 스타터에서 스킬과 상태 파일을 복사한 뒤, 에디터의 Automations/Workflows 기능에 스케줄링을 연결하세요.

## 체크리스트
[ ] 루프가 실행되는지 확인한다.

# 7 단계: 결과 확인 및 상태 커밋하기
1. `STATE.md` 파일을 열어 루프가 실제로 유효한 우선순위를 파악했는지 확인합니다.
2. 잘못된 내용이 있으면 직접 수정합니다 — **최종 판단은 여전히 사람 몫**입니다.
3. 뼈대 파일 + 첫 실행 결과를 git commit 합니다. (다음 `loop audit` 때 활동 기록으로 인식됩니다)




