# 개념

이 모듈에서는 **왼쪽 아래에서 출발해 오른쪽 위 출구로 나가는 미로 탈출 게임**에 정책(무작위 → 규칙 → 탐색 → **Jev**)을 차례로 꽂아 보고, Jev 정책을 단계적으로 다듬습니다. 아래 네 가지만 알면 바로 시작할 수 있습니다. 자세한 개념은 [README.md](README.md)를 참고하세요.

| 용어 | 한 줄 설명 |
|---|---|
| 환경과 에이전트 분리 | `env.py`는 규칙과 보상만, `agents.py`는 "다음 행동 고르기"만. 에이전트를 갈아 끼우며 비교함 |
| 보상 | 출구 도착 +100, 이동 -1, 장애물 충돌 -10 (충돌하면 제자리). 모든 정책을 같은 점수로 채점 |
| 정책 (Policy) | 다음 이동 방향을 고르는 전략. 사람·무작위·규칙 2종·BFS·Jev를 만듦 |
| 관측과 마스킹 | Jev에게 무엇을 보여 줄지(전체 지도 / 주변 3×3), 어떤 행동을 선택지로 줄지 |

**좌표는 (행, 열)입니다.** M03의 (x, y)와 순서가 반대이니 주의하세요.

```
     0 1 2 3 4    ← 열 (오른쪽으로 커짐)
  0  . . . # G    G = 출구 (0, 4)  오른쪽 위
  1  . # . # .    # = 장애물
  2  . # . # .    . = 빈칸
  3  . # . . .    A = 에이전트
  4  A # . # .    S = 시작 (4, 0)  왼쪽 아래
  ↑ 행 (아래로 커짐)    UP = 행이 1 줄어듦, RIGHT = 열이 1 늘어남
```

미로는 `mazes.py`에 0(빈칸)과 1(장애물)로 적혀 있습니다.

```python
"dead_end": [
    [0, 0, 0, 1, 0],
    [0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0],
    [0, 1, 0, 0, 0],
    [0, 1, 0, 1, 0],
],
```

> 이 가이드의 무작위·규칙·BFS 결과는 **실제 실행 결과**입니다. Jev 결과는 실행할 때마다, 버전마다 달라질 수 있습니다.

---

# 1 단계: 준비하고 직접 탈출해 보기

[M01-basics](../M01-basics/GUIDE.md)에서 Python 3.10 이상과 API 키를 준비했다고 가정합니다. 실습 폴더로 이동합니다.

```powershell
cd C:\Users\user\git\ai-native-sdlc\modules\etc-jev\M05-maze-escape\maze-escape
```

Windows PowerShell:
```powershell
py -m venv .venv
```

```powershell
.venv\Scripts\Activate.ps1
```

macOS / Linux:
```bash
python3 -m venv .venv && source .venv/bin/activate
```

공통:
```powershell
pip install -r requirements.txt
```

먼저 사람이 직접 탈출해 봅니다.

```powershell
python 00_play_manual.py
```

`w`(위) `s`(아래) `a`(왼쪽) `d`(오른쪽)로 움직입니다. 장애물로 가면 이렇게 나오고 **제자리에 머물며 -10**을 받습니다.

```
    0 1 2 3 4
  0 . . . . G
  1 . # # . .
  2 . . . # .
  3 A # . # .
  4 S # . . .
턴 2 | 위치 (행, 열) (3, 0) | 누적 보상 -11 | RIGHT(오른쪽) 보상 -10 | 이동할 수 없는 위치입니다.
```

막다른 길 미로도 해 봅니다.

```powershell
python 00_play_manual.py --maze dead_end
```

## 규칙
> M03에서는 벽에 부딪히면 게임이 끝났지만, 이 모듈에서는 **벌점(-10)만 받고 계속**합니다. 충돌도 점수(보상)에 반영해서, 7단계에서 정책들을 "몇 번 부딪혔는가"까지 비교하기 위해서입니다.

> 최대 턴은 `행 × 열 × 2`입니다 (5×5 미로는 50턴). 넘으면 "최대 턴 초과"로 끝납니다.

## 산출물
- 내가 직접 탈출했을 때의 이동 횟수와 누적 보상 메모

## 체크리스트
- [ ] `basic` 미로를 탈출해 봤는지 확인한다 (최단 8턴, 보상 93).
- [ ] 장애물로 가면 -10을 받고 제자리에 머무는 것을 확인한다.
- [ ] 좌표가 (행, 열) 순서라는 것을 화면에서 확인한다.

---

# 2 단계: 에이전트 설계 7요소와 무작위 에이전트

`env.py`를 열어 **에이전트 설계 7요소**를 코드에서 찾아봅니다.

| 요소 | 코드 위치 |
|---|---|
| Environment | `class MazeEnv` |
| State | `self.state` (현재 위치), `self.maze` (미로 상태) |
| Action | `ACTIONS = {"UP": (-1, 0), "DOWN": (1, 0), "LEFT": (0, -1), "RIGHT": (0, 1)}` |
| Goal | `self.goal = (0, self.cols - 1)` (오른쪽 위) |
| Reward | `REWARD_GOAL = 100`, `REWARD_MOVE = -1`, `REWARD_COLLISION = -10` |
| Policy | `agents.py`의 각 에이전트 `act(env)` |
| Termination | `step()` 안의 `self.done` (출구 도착 또는 최대 턴) |

환경의 핵심은 `step()` 하나입니다. 행동을 받아 **(다음 상태, 보상, 끝났는지, 추가 정보)** 네 가지를 돌려줍니다.

```python
state, reward, done, info = env.step("UP")
# 예: (3, 0), -1, False, {"collision": False}
```

가장 단순한 정책인 **무작위 에이전트**를 실행합니다.

```powershell
python 01_random_agent.py
```

한 판으로는 운이 크게 작용하니, 100판 평균을 봅니다.

```powershell
python 01_random_agent.py --runs 100
```

```powershell
python 01_random_agent.py --runs 100 --valid-only
```

실제 결과 (`basic` 미로):

| 설정 | 탈출 성공률 | 평균 이동 | 평균 보상 | 평균 충돌 |
|---|---|---|---|---|
| 네 방향 중 아무거나 | 13% | 48.6 | -265.0 | 25.5 |
| 갈 수 있는 방향 중에서만 (`--valid-only`) | 38% | 42.4 | -4.1 | 0.0 |

"갈 수 있는 방향만 고른다"는 것만으로 충돌이 0이 되고 성공률이 세 배가 됩니다. 이것이 5단계에서 Jev에 쓰는 **행동 마스킹**의 아이디어입니다.

## 규칙
> 무작위 에이전트는 **하한선**입니다. 앞으로 만드는 모든 정책은 적어도 이것보다 나아야 합니다.

> 무작위 요소가 있는 결과는 반드시 **여러 번 돌려 평균**을 봅니다. `--seed`로 같은 결과를 재현할 수 있습니다.

## 산출물
- 무작위 에이전트 100판 결과 (두 설정)

## 체크리스트
- [ ] 7요소를 `env.py`에서 모두 찾았는지 확인한다.
- [ ] 100판 결과가 위 표와 같은지 확인한다.
- [ ] `--valid-only`가 충돌을 없애는 이유를 설명할 수 있는지 확인한다.

---

# 3 단계: 규칙 기반 에이전트 — 탐욕법과 우수법

두 가지 규칙을 비교합니다 (`agents.py`).

**탐욕법 (`GreedyAgent`)**: 출구와의 거리가 줄어드는 방향으로 갑니다.

```python
closer = [a for a in valid if 다음_칸의_출구까지_거리 < 지금_출구까지_거리]
return closer[0] if closer else valid[0]
```

**우수법 (`WallFollowerAgent`)**: 오른손을 벽에 대고 걷듯이 **오른쪽 → 앞 → 왼쪽 → 뒤** 순서로 갈 수 있는 첫 방향으로 갑니다.

```python
right, front, left, back = ...   # 지금 바라보는 방향 기준
for a in (right, front, left, back):
    if a in valid:
        return a
```

각각 막다른 길 미로에서 실행합니다.

```powershell
python 02_rule_agents.py --agent greedy --maze dead_end
```

```powershell
python 02_rule_agents.py --agent wall --maze dead_end
```

실제 결과:

| 에이전트 | `basic` | `dead_end` | `large` |
|---|---|---|---|
| 탐욕법 | 탈출 8턴 (최단) | **최대 턴 초과** | **최대 턴 초과** |
| 우수법 | 탈출 12턴 | 탈출 18턴 | 탈출 14턴 |

탐욕법은 `dead_end`에서 (0, 2)와 (1, 2) 사이를 50턴 동안 왕복합니다.

```
    0 1 2 3 4
  0 . . A # G     ← 오른쪽은 장애물, 위는 미로 밖
  1 . # . # .     → 아래로 갔다가(출구에서 멀어짐) 다시 위로… 반복
  ...
턴 8 | 위치 (행, 열) (0, 2) | UP(위) 보상 -1
턴 9 | 위치 (행, 열) (1, 2) | DOWN(아래) 보상 -1
턴 10 | 위치 (행, 열) (0, 2) | UP(위) 보상 -1
```

우수법은 항상 탈출하지만, 막다른 곳까지 들어갔다 나오느라 최단 경로보다 깁니다.

## 규칙
> 규칙 기반 정책은 **빠르고, 공짜이고, 결과를 설명할 수 있습니다.** 규칙으로 충분한 문제라면 Jev를 쓸 이유가 없습니다. 이 단계의 목적은 "규칙이 어디서 깨지는지"를 확인하는 것입니다.

> `--delay 0.5`로 천천히 실행하면 우수법이 벽을 따라가는 모습을 눈으로 볼 수 있습니다.

## 산출물
- 탐욕법·우수법의 미로별 결과 표

## 체크리스트
- [ ] 탐욕법이 `dead_end`에서 왕복하는 이유를 설명할 수 있는지 확인한다.
- [ ] 우수법이 세 미로를 모두 탈출하는지 확인한다.
- [ ] 우수법의 이동 횟수가 최단보다 긴 이유를 설명할 수 있는지 확인한다.

---

# 4 단계: 탐색 알고리즘 — BFS 최단 경로

**지도 전체를 알고 있다면** 최단 경로를 계산할 수 있습니다. BFS(너비 우선 탐색)는 시작점에서 가까운 칸부터 차례로 넓혀 가며 출구를 찾습니다 (`env.py`의 `shortest_path`).

```powershell
python 03_bfs_agent.py --maze dead_end
```

실제 출력:

```
BFS가 계산한 최단 경로: UP → UP → UP → UP → RIGHT → RIGHT → DOWN → DOWN → DOWN → RIGHT → RIGHT → UP → UP → UP
...
결과      : 탈출 성공
이동 횟수 : 14
누적 보상 : 87
```

```powershell
python 03_bfs_agent.py --maze large
```

| 미로 | 최단 이동 | 최고 보상 |
|---|---|---|
| `basic` | 8 | 93 |
| `dead_end` | 14 | 87 |
| `large` | 12 | 89 |

이 숫자가 각 미로의 **만점**입니다. 다른 정책의 결과를 이 숫자와 비교합니다.

## 규칙
> BFS는 완벽하지만 **지도 전체를 미리 알아야** 합니다. 실제 드론은 처음 가는 공간의 지도가 없거나, 지도가 있어도 사람·물건이 움직여 계속 바뀝니다. 이때는 BFS를 그대로 쓸 수 없습니다.

## 산출물
- 미로별 최단 이동 횟수와 최고 보상 (위 표)

## 체크리스트
- [ ] 세 미로의 최단 이동이 위 표와 같은지 확인한다.
- [ ] BFS가 "지도 전체"를 어디서 읽는지(`self.maze`) 코드에서 확인한다.

---

# 5 단계: Jev 에이전트 1 — 전체 관측과 행동 마스킹

이제 Jev를 정책으로 씁니다. Jev는 **학습도, 경로 계산도 없이** 지금 보이는 상황만으로 다음 행동을 판단합니다. 먼저 미로 전체를 보여 주는 **전체 관측(full)**으로 시작합니다.

**① Jev에게 보내는 state** (`agents.py`의 `build_state`, `--view full`)

막다른 곳 (0, 2)에 도착했을 때의 state입니다.

```python
{
  "coordinate_system": "(row, col); row grows downward, col grows to the right, (0,0) is top-left",
  "agent": {"row": 0, "col": 2},
  "exit": {"row": 0, "col": 4},
  "exit_direction": {"rows_up": 0, "cols_right": 2},
  "recent_actions": ["UP", "UP", "RIGHT", "RIGHT"],
  "maze": ["..A#G", ".#.#.", ".#.#.", ".#...", "S#.#."],
  "maze_legend": "A=agent, G=exit, S=start, #=obstacle, .=free",
  "visited_cells": [[4, 0], [3, 0], [2, 0], [1, 0], [0, 0], [0, 1], [0, 2]]
}
```

**② 행동 마스킹** — 갈 수 있는 방향만 Choice 선택지로 줍니다. 위 상황이라면 위는 미로 밖, 오른쪽은 장애물이라 선택지는 `DOWN`, `LEFT` 두 개뿐입니다. 갈 곳이 하나뿐이면 Jev를 부르지 않습니다.

```python
options = env.valid_actions() if self.mask else list(ACTIONS)
if len(options) == 1:
    return options[0]                      # 묻지 않고 바로 이동
question = Choice(
    instructions="Pick the next move that leads the agent out of the maze to the exit. "
                 "Prefer cells that were not visited before and avoid going back and forth",
    criteria={a: ACTION_TEXT[a] for a in options},
)
```

API 키를 등록하고 (M01 3단계 참고) 실행합니다.

Windows PowerShell:
```powershell
$env:TYPESAFE_API_KEY = "발급받은_키"
```

macOS / Linux:
```bash
export TYPESAFE_API_KEY="발급받은_키"
```

```powershell
python 04_jev_agent.py --maze dead_end --view full
```

마스킹을 끈 경우와 비교합니다.

```powershell
python 04_jev_agent.py --maze dead_end --view full --no-mask
```

큰 미로에서도 실행합니다.

```powershell
python 04_jev_agent.py --maze large --view full
```

출력 형태 (숫자는 **예시**):

```
턴 6 | 위치 (행, 열) (0, 2) | 누적 보상 -6 | RIGHT(오른쪽) 보상 -1 | 확률 0.88
턴 7 | 위치 (행, 열) (1, 2) | 누적 보상 -7 | DOWN(아래) 보상 -1 | 확률 0.91
턴 8 | 위치 (행, 열) (2, 2) | 누적 보상 -8 | DOWN(아래) 보상 -1 | 갈 곳이 하나뿐이라 Jev에게 묻지 않음
...
에이전트  : jev-full
결과      : 탈출 성공
Jev 호출  : 9회, 평균 190ms
로그      : ...\maze-escape\logs\04_jev-full_dead_end_<시각>.jsonl
```

결과를 표로 기록합니다. 만점(BFS)은 `dead_end` 14턴·보상 87, `large` 12턴·보상 89입니다.

| 실험 | 미로 | 마스킹 | 결과 | 이동 | 보상 | 충돌 | Jev 호출 |
|---|---|---|---|---|---|---|---|
| A | dead_end | O | | | | | |
| B | dead_end | X | | | | | |
| C | large | O | | | | | |

**직접 해 보기**
1. 로그 파일에서 (0, 2) 턴의 `probabilities`를 찾습니다. 탐욕법이 왕복했던 그 자리에서 Jev는 `DOWN`(출구에서 잠시 멀어짐)을 골랐나요?
2. 실험 B에서 충돌이 나면, 그 턴의 `probabilities`를 확인합니다. Jev가 장애물 방향에 얼마나 확률을 줬나요?
3. `mazes.py`에 나만의 미로를 추가하고 (시작 왼쪽 아래, 출구 오른쪽 위가 빈칸이어야 함) Jev를 실행합니다. **연습 없이 바로** 시도할 수 있다는 것이 Jev의 강점입니다.

## 규칙
> 마스킹은 **기본으로 켭니다.** `--no-mask`는 마스킹의 효과를 확인하기 위한 실험용입니다.

> 결과가 이상하면 로그의 `state`부터 봅니다. Jev는 state에 넣은 것만 보고 판단합니다.

## 산출물
- 실험 A~C 결과 표
- `logs/04_jev-full_*.jsonl` 결정 기록

## 체크리스트
- [ ] 마스킹을 켠 실험에서 충돌이 0인지 확인한다.
- [ ] "갈 곳이 하나뿐이라 Jev에게 묻지 않음" 메시지와, 그만큼 Jev 호출 수가 이동 횟수보다 적은 것을 확인한다.
- [ ] 로그에서 막다른 곳 (0, 2) 턴의 `probabilities`를 읽어 봤는지 확인한다.

---

# 6 단계: Jev 에이전트 2 — 부분 관측과 확률 기반 대체

실제 드론에는 미로 전체 지도가 없습니다. 카메라나 거리 센서로 **주변만** 압니다. 이번에는 Jev에게 **주변 3×3과 방문 횟수**만 보여 줍니다 (`--view local`).

같은 (0, 2) 상황의 state입니다.

```python
{
  "coordinate_system": "(row, col); ...",
  "agent": {"row": 0, "col": 2},
  "exit": {"row": 0, "col": 4},
  "exit_direction": {"rows_up": 0, "cols_right": 2},
  "recent_actions": ["UP", "UP", "RIGHT", "RIGHT"],
  "surroundings_3x3": ["XXX", ".A#", "#.#"],
  "surroundings_legend": "A=agent, G=exit, #=obstacle, X=outside the maze, .=free",
  "neighbors": {
    "UP":    {"cell": "edge", "times_visited": 0},
    "DOWN":  {"cell": "free", "times_visited": 0},
    "LEFT":  {"cell": "free", "times_visited": 1},
    "RIGHT": {"cell": "wall", "times_visited": 0}
  }
}
```

지도가 없으므로 **방문 횟수(짧은 기억)**가 중요합니다. `LEFT`는 이미 지나온 칸(1번), `DOWN`은 처음 가는 칸(0번)입니다.

```powershell
python 04_jev_agent.py --maze dead_end --view local
```

```powershell
python 04_jev_agent.py --maze large --view local
```

**확률 기반 대체 (fallback)** — Jev가 고른 행동의 확률이 낮으면, 즉 Jev도 확신하지 못하면 **우수법으로 대신 움직이게** 합니다.

```python
prob = move.probabilities[move.choice]
if self.fallback is not None and prob < self.fallback:
    action = self.backup.act(env)          # Jev가 확신하지 못함 → 우수법으로 대체
```

```powershell
python 04_jev_agent.py --maze large --view local --fallback 0.6
```

```powershell
python 04_jev_agent.py --maze large --view local --fallback 0.9
```

대체가 일어나면 이렇게 표시됩니다 (숫자는 **예시**).

```
턴 3 | 위치 (행, 열) (6, 3) | 누적 보상 -3 | RIGHT(오른쪽) 보상 -1 | Jev는 UP(확률 0.50)로 애매 → 우수법으로 대체
...
Jev 호출  : 13회, 평균 190ms
우수법 대체: 2회
```

결과를 표로 기록합니다.

| 실험 | 미로 | 관측 | 대체 기준 | 결과 | 이동 | 보상 | Jev 호출 | 대체 횟수 |
|---|---|---|---|---|---|---|---|---|
| D | dead_end | full (5단계 A) | 없음 | | | | | - |
| E | dead_end | local | 없음 | | | | | - |
| F | large | local | 없음 | | | | | - |
| G | large | local | 0.6 | | | | | |
| H | large | local | 0.9 | | | | | |

**직접 해 보기**
1. 실험 E의 로그에서 (0, 2) 턴의 `neighbors`와 `probabilities`를 확인합니다. Jev가 "가 본 적 없는 칸(DOWN)"을 골랐나요?
2. `agents.py`의 `build_state`에서 `"times_visited"`를 지우고 실험 E를 다시 실행합니다. 기억이 없으면 어떻게 되나요?
3. 대체 기준을 0.6 → 0.9로 올리면(실험 H) 대체 횟수와 이동 횟수가 어떻게 바뀌나요? 기준을 너무 높이면 사실상 우수법과 같아집니다.

## 규칙
> 관측을 바꿀 때는 **한 번에 하나씩** 바꾸고 결과를 기록합니다.

> 대체 정책은 **반드시 혼자서도 목표를 달성할 수 있는 정책**이어야 합니다. 우수법은 느리지만 언제나 탈출하므로 대체 정책으로 적합합니다. 탐욕법처럼 막힐 수 있는 규칙은 대체 정책으로 쓰면 안 됩니다.

> 부분 관측에서 Jev가 막다른 길을 벗어나지 못한다면, 정보가 부족한 것입니다. 방문 횟수 외에 무엇을 더 줄 수 있을지 생각해 봅니다 (예: 지금까지 지나온 경로, 막다른 곳으로 확인된 칸).

## 산출물
- 실험 D~H 결과 표
- `logs/04_jev-local*.jsonl` 결정 기록
- 방문 횟수를 지웠을 때의 결과 메모

## 체크리스트
- [ ] full과 local의 결과 차이를 표로 비교했는지 확인한다.
- [ ] 로그에서 `neighbors.times_visited`와 Jev의 선택이 어떤 관계인지 확인한다.
- [ ] `--fallback`을 켰을 때 "우수법으로 대체" 메시지와 대체 횟수를 확인한다.
- [ ] 대체 기준을 바꾸면 대체 횟수가 달라지는 것을 확인한다.

---

# 7 단계: 정책 비교

모든 정책을 세 미로에서 한 번에 비교합니다. Jev는 세 가지 설정(`jev-full`, `jev-local`, `jev-local-fb` = 부분 관측 + 대체 기준 0.6)으로 들어갑니다.

```powershell
python 05_compare.py
```

키 없이 Jev를 빼고 비교할 수도 있습니다.

```powershell
python 05_compare.py --no-jev
```

실제 결과 (Jev 제외):

```
미로        에이전트          결과          이동     보상   충돌   Jev호출    평균ms   대체
------------------------------------------------------------------------------
basic     random        최대 턴 초과     50   -266   24       -       -    -
basic     greedy        탈출 성공        8     93    0       -       -    -
basic     wall          탈출 성공       12     89    0       -       -    -
basic     bfs           탈출 성공        8     93    0       -       -    -
dead_end  random        최대 턴 초과     50   -284   26       -       -    -
dead_end  greedy        최대 턴 초과     50    -50    0       -       -    -
dead_end  wall          탈출 성공       18     83    0       -       -    -
dead_end  bfs           탈출 성공       14     87    0       -       -    -
large     random        최대 턴 초과     98   -566   52       -       -    -
large     greedy        최대 턴 초과     98    -98    0       -       -    -
large     wall          탈출 성공       14     87    0       -       -    -
large     bfs           탈출 성공       12     89    0       -       -    -
```

Jev를 포함하면 각 미로에 `jev-full`, `jev-local`, `jev-local-fb` 세 줄이 추가됩니다. 표를 보고 아래 질문에 답을 적어 봅니다.

1. Jev의 보상은 **우수법(규칙)**보다 높은가요? **BFS(만점)**에 얼마나 가까운가요?
2. `jev-full`과 `jev-local` 중 어느 쪽이 나았나요? 드론이 실제로 받을 수 있는 정보는 어느 쪽에 가깝나요?
3. `jev-local-fb`는 `jev-local`보다 안정적인가요? 대체가 몇 번 일어났나요?
4. Jev 호출 수 × 평균 지연 시간 = 탈출에 걸린 판단 시간입니다. 실시간으로 움직이는 게임이라면 괜찮은 시간인가요?

## 규칙
> 정답은 "Jev가 언제나 이긴다"가 아닙니다. **상황별로 맞는 정책**을 고르는 것이 목표입니다.
> - 지도가 있고 바뀌지 않는다 → BFS
> - 단순하고 확실한 규칙이 있다 → 규칙
> - 처음 보는 환경에서 바로 판단해야 한다 → Jev (+ 행동 마스킹 + 확률 기반 대체 + 안전 감시)

## 산출물
- `05_compare.py` 비교표 (Jev 포함)
- 질문 1~4에 대한 답 메모

## 체크리스트
- [ ] 비교표에 3개 미로 × 7개 정책 결과가 모두 나오는지 확인한다 (Jev 제외 시 4개).
- [ ] 질문 1~4에 답을 적었는지 확인한다.
- [ ] 상황별로 어떤 정책을 고를지 한 문장씩 정리했는지 확인한다.

---

# 확장 과제 (선택)

- **다중 에이전트 턴제 게임**: `env.py`에 미로 안을 순찰하는 "적"을 추가하고, 에이전트와 적이 번갈아 움직이게 합니다. 적과 같은 칸에 들어가면 -50. Jev의 state에 적 위치를 넣으면 피해 가나요?
- **바뀌는 미로**: 몇 턴마다 장애물 하나가 생기거나 사라지게 합니다. BFS는 경로를 다시 계산해야 합니다. Jev는 매 턴 새로 보고 판단하므로 코드 수정 없이 그대로 쓸 수 있나요?
- **이모지 출력**: `env.py`의 `maze_rows()`에서 `A`, `#`, `G`를 🤖, ⬛, 🏁로 바꿔 봅니다 (터미널 글꼴에 따라 칸이 어긋날 수 있음).

# 다음 단계

**[M07 실시간 게임 에이전트](../M07-realtime-agent/README.md)**에서는 게임이 Jev의 답을 기다려 주지 않습니다. 7단계에서 잰 지연 시간을 바탕으로 판단 주기를 정하고, 응답이 늦을 때 이전 행동을 유지하거나 안전 행동으로 대체하는 방법을 다룹니다. 6단계의 확률 기반 대체가 그대로 "응답 지연 시 대체"로 확장됩니다.
