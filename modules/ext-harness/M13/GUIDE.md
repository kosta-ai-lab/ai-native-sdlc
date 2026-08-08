# 개념

> "Graph Engineering"이란 하나의 작업을 여러 개의 하위 작업(Task)으로 쪼개고,
> 그 작업들을 **의존관계 그래프(DAG)** 로 연결한 뒤, 여러 AI 코딩 에이전트에게
> 병렬 또는 순차적으로 분배해서 실행시키는 작업 방식을 말합니다.

## Orca로 구현하는 그래프 엔지니어링
핵심 개념 3가지만 먼저 알고 가면 됩니다.

| 개념 | 설명 |
|---|---|
| **Worktree** | 하나의 저장소(repo)에서 브랜치를 분리해 만든 독립 작업 공간. 에이전트마다 별도의 worktree를 주면 서로 파일을 덮어쓰지 않습니다. |
| **Agent** | 그 worktree 안에서 실제로 코드를 짜는 CLI 에이전트 (Claude Code, Codex 등) |
| **Orchestration (오케스트레이션)** | 여러 Task와 Agent를 하나의 "그래프"로 묶어서 관리하는 Orca의 기능. 이 문서에서 다루는 **Graph Engineering**의 핵심입니다. |

즉 "Graph Engineering"은 Orca 안에서 **여러 개의 Task 노드(node)를 만들고,
그 Task들 사이의 의존관계(edge)를 정의해서, 이 그래프를 여러 에이전트에게
분배 실행**시키는 작업이라고 이해하면 됩니다.

## Graph Engineering의 핵심 개념 이해하기

Orca의 오케스트레이션은 다음 5가지 요소로 이루어진 그래프 모델입니다.

- **Run** — 그래프 전체를 담는 "네임스페이스"이자 코디네이터의 받은편지함(inbox). 스스로 작업을 스케줄링하지는 않습니다.
- **Task** — 그래프의 "노드(node)"입니다. 명세(spec), 의존관계, 상태(`pending` → `ready` → `dispatched` → `completed`/`failed`/`blocked`)를 가집니다.
- **Dispatch** — 하나의 Task를 특정 터미널(에이전트)에 실행시킨 "한 번의 시도"입니다.
- **Message** — Run의 inbox로 오가는 메일 (`status`, `dispatch`, `worker_done`, `escalation`, `question`, `heartbeat` 등)
- **Decision gate** — 그래프 흐름 중 사람(코디네이터)의 판단이 필요할 때 Task를 막아두는 "게이트"입니다.

즉:
```
Run (그래프 전체)
 └─ Task A (노드) ──depends on──> Task B (노드)
      └─ Dispatch (Task A를 codex 에이전트에게 실행 지시)
           └─ Message: worker_done (완료 보고)
```

## 요약 다이어그램 (개념도)

```
[Run: "블로그 QA 나누고 블로커 요약"]
   │
   ├── Task 1: 모바일 UI 감사 ──(worker-start: codex)──▶ Dispatch ──▶ worker_done
   │
   ├── Task 2: 링크, 이미지 무결성 감사 ──(worker-start: claude)─▶ Dispatch ──▶ worker_done
   │                                                              │
   │                                                     [Decision Gate: 병합 여부?]
   │                                                              │
   └── Task 3: 회귀 테스트 (Task 1, 2 완료 후 시작) ──▶ Dispatch ──▶ worker_done
```

이렇게 노드(Task)와 엣지(의존관계)를 정의하고, 각 노드를 에이전트에게 분배해
동시에 혹은 순서대로 처리시키는 전체 과정이 **Orca에서의 Graph Engineering**입니다.


# 1 단계: Orca에서 Graph Engineering 활성화하기
오케스트레이션(=그래프 엔지니어링) 기능은 실험적 기능이므로 먼저 켜야 합니다.
1. **Settings → AI기능**로 이동해 Orchestration 스킬을 설치합니다.
2. 터미널에서 CLI가 런타임과 통신되는지 확인합니다.
   ```bash
   orca status --json
   ```
   이 명령이 정상적으로 응답하면 준비가 끝난 것입니다.

## 규칙
1. 만약 Orchestration 스킬에서 에러가 난다면 node의 버전이 22.20 버전보다 낮아서 생기는 일일 수 있다.
   이 경우 다음을 실행힌다.
   
   ```bash
   nvm install 22
   nvm use 22
   node --version   # confirm it's 22.20+
   ```
2. node의 버전을 설치한 후에 버전이 안 잡히는 경우 다음과 같이 디폴트 값을 바꾸어 해결할 수 있다.
   ```bash
   nvm alias default 22
   cat ~/.nvm/alias/default
   ```
## 체크리스트
[ ] CLI가 런타임으로 통신되는지를 확인한다.

# 2 단계: 첫 그래프 만들기: Run 생성
터미널에서 다음 명령을 싱행합니다. 
`--objective`에는 이 그래프 전체가 달성하려는 목표를 자연어로 적습니다.
이 명령이 반환하는 `runId`를 이후 명령들에서 사용하게 됩니다 (Orca가 대부분 자동 바인딩해줍니다).

```bash
orca orchestration run-create --objective "블로그 QA를 나누고 블로커 요약하기" --json
```

## 체크리스트
[ ] 해당 명령의 결과로 JSON 포맷의 응답이 있는지 확인한다.

# 3 단계: Task(노드) 만들기

```bash
orca orchestration task-create \
  --spec "블로그 내 모든 내부/외부 링크와 이미지 경로가 깨지지 않았는지 감사하기" \
  --task-title "링크·이미지 무결성 감사" \
  --json
```

- `--spec`: 에이전트에게 전달될 상세 작업 지시문
- `--task-title`: 그래프에서 보이는 짧은 이름

이 명령을 여러 번 실행해 여러 개의 Task 노드를 만들 수 있습니다.
Task 사이에 의존관계(예: "B는 A가 끝나야 시작 가능")를 설정하면
그것이 곧 그래프의 **엣지(edge)** 가 됩니다.

## 체크리스트
[ ] 해당 명령의 결과로 JSON 포맷의 응답이 있는지 확인한다.

# 4 단계: Worker(에이전트) 배치해서 노드 실행하기
1. 현재의 실행에 어떤 task들이 있는지 확인하고, 실행시킬 테스크의 id를 확인한다. task_...으로 시작한다.
```bash
   orca orchestration task-list --json
```
2. 확인한 태스크의 id를 대입하여 다음 명령을 실행하여 지정한 Task(노드)가 실제 에이전트에게 "디스패치"되어 작업이 시작되도록 한다.

```bash
# 현재 worktree에서 실행
orca orchestration worker-start --task <taskId> --worktree current --agent claude --json

# 또는 새 worktree를 만들어 실행
orca orchestration worker-start \
  --task <taskId> --worktree new-child --name billing-audit \
  --agent codex --setup run --json
```
## 규칙
여러 Task에 대해 이 명령을 반복하면, 여러 에이전트가 **그래프의 여러 노드를 동시에 처리**하게 됩니다 — 이것이 병렬 Graph Engineering의 실체입니다.

## 체크리스트
[ ] JSON 응답이 false가 아닌 true가 되는지 확인한다.

# 5 단계: 완료 메시지 기다리기 (그래프 진행 상황 확인)

코디네이터(당신, 혹은 상위 에이전트) 입장에서는 아래 명령으로 완료/에스컬레이션/질문 메시지를 기다립니다.
```bash
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
```
또한 아래 명령어와 같이 반드시 ack(확인 처리) 해야 다음 메시지로 넘어갑니다. 이 때 deliveryId는 delivery_...로 시작합니다.
```bash
orca orchestration check --ack <deliveryId> --wait --types worker_done,escalation,question --timeout-ms 900000 --json
```

## 규칙
워커(에이전트) 쪽에서는 작업이 끝나면 아래처럼 완료 보고를 보냅니다 (자동으로 처리되는 경우가 많습니다).
```bash
orca orchestration send \
  --type worker_done \
  --subject "모바일 감사 완료" \
  --body "푸터 겹침 문제 수정, 추가 조치 없음." \
  --task-id <taskId> \
  --dispatch-id <dispatchId> \
  --outcome succeeded \
  --files-modified "src/app/settings/Billing.tsx" \
  --json
```

## 체크리스트
[ ] 응답으로의 JSON 결과가 제대로 오는지 확인한다.

# 6 단계: 그래프에 "판단 지점" 추가하기: Decision Gate

여러 노드가 얽힌 복잡한 그래프에서는 특정 지점에서 사람의 결정을 기다려야 할 때가 있습니다.
이럴 때 **Decision Gate**를 사용합니다.

```bash
orca orchestration gate-create \
  --task <taskId> \
  --question "공통 버튼 변경사항을 task 브랜치에 병합할까요?" \
  --options '["yes","no"]' \
  --json
```

결정이 내려지면 게이트를 해제해서 그래프 흐름을 이어갑니다.

```bash
orca orchestration gate-resolve --id <gateId> --resolution "yes" --json
```

에이전트가 직접 질문해야 하는 경우(작업 중 막혔을 때)는 `ask`를 사용합니다.

```bash
orca orchestration ask \
  --to <coordinatorHandle> \
  --question "공통 컴포넌트를 수정할까요, 이 페이지만 수정할까요?" \
  --options "shared,page-only" \
  --timeout-ms 600000 \
  --json
```

## 체크리스트
[ ] 응답으로의 JSON 결과가 제대로 오는지 확인한다.

# 7 단계: 그래프 전체 초기화 (필요할 때만)

그래프 상태를 완전히 리셋하고 싶을 때만 사용하세요. 다른 코디네이터가 활성 상태일 때는 사용하지 마세요.

```bash
orca orchestration reset --tasks --json     # Task만 초기화
orca orchestration reset --messages --json  # 메시지만 초기화
orca orchestration reset --all --json       # 전체 초기화
```

## 체크리스트
[ ] 초기화 요청 후 JSON 응답이 오는지 확인한다.

# 8 단계: 더 깊이 배우기
Orca 설치 후 에이전트에게 아래 명령을 실행시키면, 최신 오케스트레이션 전체 가이드를 CLI가 직접 보여줍니다 (문서 UI보다 최신 상태를 반영합니다).

```bash
orca skills get orchestration --full
```

## 체크리스트
[ ] 최신 오케스트레이션 전체 가이드가 잘 나오는지 확인한다.

# 참조: Orca가 에이전트를 다룰 때의 3가지 방식
Orca가 에이전트를 다룰 때의 3가지 방식이 있습니다.

| 상황 | 추천 방법 |
|---|---|
| 에이전트 하나에게 가벼운 지시 하나만 내리면 될 때 | `orca terminal send` |
| 완료 추적/소유권 없이 그냥 통째로 맡길 때 | worktree + terminal 명령 (2단계 방식) |
| **작업 완료 추적, 여러 Task 간 의존관계(DAG), 여러 에이전트 협업**이 필요할 때 | **`orca orchestration run-create` + task + worker (Graph Engineering)** |

앞에서 보인 Graph Engineering은 해당 방식 중 마지막 방식입니다. 여러 에이전트 협업, 작업 간의 의존 관계, 완료 추적이 필요할 때 고려할 수 있습니다.

