# 개념

이 모듈에서는 격자 위의 드론(`D`)을 목표(`G`)까지 보내는 게임을 만들고, **Jev가 매 턴 다음 이동을 고르는 에이전트**를 만듭니다. 아래 네 가지만 알면 바로 시작할 수 있습니다. 자세한 개념은 [README.md](README.md)를 참고하세요.

| 용어 | 한 줄 설명 |
|---|---|
| 결정 루프 | 관측 → state 만들기 → Jev 판단 → 안전 감시 → 행동, 이것을 목표에 닿을 때까지 반복 |
| state 설계 | 게임 상황을 Jev가 판단하기 좋은 JSON으로 바꾸는 일. **Jev는 state에 넣은 것만 봄** |
| 행동 = Choice | `up` / `down` / `left` / `right` 네 개를 Choice 선택지로 묻기 |
| 안전 감시 | Jev가 무엇을 고르든 벽 충돌·배터리 방전은 규칙 코드가 막기 |

지도에 쓰는 기호와 좌표는 이렇습니다.

```
   0 1 2 3 4      ← x (오른쪽으로 커짐)
 0 D . . . .      D = 드론   H = 집(출발점)   G = 목표
 1 . # . . .      # = 벽     . = 빈칸
 2 . . . . G
 ↑ y (아래로 커짐)   up = y가 1 줄어듦, down = y가 1 늘어남
```

> 이 가이드는 공식 문서(docs.typesafe.ai, 2026-11-25 확인)와 `jev-latest` 모델을 기준으로 작성했습니다. **규칙 에이전트의 출력은 실제 실행 결과**이고, Jev의 출력은 실행할 때마다, 버전마다 달라질 수 있습니다.

---

# 1 단계: 실습 환경 준비하기

[M01-basics](../M01-basics/GUIDE.md)를 마쳐서 Python 3.10 이상과 API 키가 준비되어 있다고 가정합니다.

터미널(Windows는 PowerShell)에서 실습 폴더로 이동합니다.

```powershell
cd C:\Users\user\git\ai-native-sdlc\modules\etc-jev\M03-grid-agent\grid-agent
```

가상환경을 만들고 켠 뒤 SDK를 설치합니다.

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

API 키를 등록합니다 (4단계부터 필요).

Windows PowerShell:
```powershell
$env:TYPESAFE_API_KEY = "발급받은_키"
```

macOS / Linux:
```bash
export TYPESAFE_API_KEY="발급받은_키"
```

폴더 안의 파일은 역할별로 나뉘어 있습니다.

| 파일 | 역할 | 결정 루프에서 |
|---|---|---|
| `maps.py` | 지도 4개 (`empty`, `walls`, `trap`, `delivery`) | — |
| `grid.py` | 게임 규칙: 이동, 벽, 배터리, 최단 거리 계산 | ① 관측, ⑤ 행동 |
| `agents.py` | 사람 / 규칙 / Jev 에이전트, **state 만들기** | ② state, ③ 판단 |
| `safety.py` | 안전 감시 | ④ 안전 감시 |
| `runner.py` | 결정 루프, 로그 저장 | 전체 |

## 규칙
> 2~3단계는 Jev를 쓰지 않으므로 SDK나 API 키 없이도 실행됩니다. 키 발급을 기다리는 중이라면 2~3단계부터 해 보세요.

> 실행 중 멈추려면 `Ctrl + C`를 누릅니다.

## 산출물
- `grid-agent/.venv/` 가상환경 (`.gitignore`에 들어 있어 커밋되지 않음)

## 체크리스트
- [ ] 프롬프트 앞에 `(.venv)`가 보이는지 확인한다.
- [ ] `pip show typesafe-sdk`가 버전을 출력하는지 확인한다.

---

# 2 단계: 직접 플레이하기

에이전트를 만들기 전에 **사람이 직접** 게임을 해 봅니다. 에이전트가 풀어야 할 문제를 먼저 몸으로 이해하기 위해서입니다.

```powershell
python 00_play_manual.py
```

`w`(위) `s`(아래) `a`(왼쪽) `d`(오른쪽)를 입력하고 Enter를 누릅니다. `D`를 `G`까지 옮기면 성공입니다.

```
   0 1 2 3 4
 0 D . . . .
 1 . . . . .
 2 . . . . .
 3 . . . . .
 4 . . . . G
걸음 0 | 시작

이동 (w=위, s=아래, a=왼쪽, d=오른쪽, q=종료):
```

벽이 있는 지도도 해 봅니다.

```powershell
python 00_play_manual.py --map trap
```

**직접 해 보기**
1. 일부러 격자 밖(`a`를 처음에 입력)으로 가 보고 **충돌**로 끝나는 것을 확인합니다.
2. `trap` 지도에서 목표(왼쪽 아래)까지 가려면 어떤 길로 돌아가야 하는지 찾아봅니다.

## 규칙
> 이 단계에는 **안전 감시가 없습니다.** 벽이나 격자 밖으로 가면 바로 게임이 끝납니다. 5단계에서 안전 감시를 붙이면 무엇이 달라지는지 비교하게 됩니다.

## 산출물
- 없음 (게임 규칙 익히기)

## 체크리스트
- [ ] `empty` 지도에서 성공해 봤는지 확인한다.
- [ ] 격자 밖으로 가면 "충돌"로 끝나는 것을 확인한다.
- [ ] `trap` 지도에서 목표 쪽으로 바로 내려가면 막힌다는 것을 확인한다.

---

# 3 단계: 규칙 에이전트 — 비교 기준 만들기

Jev가 잘하는지 판단하려면 **비교 기준**이 필요합니다. `RuleAgent`(`agents.py`)는 아주 단순한 규칙으로 움직입니다.

> "목표와의 거리가 줄어드는 방향으로 간다. 그런 방향이 없으면 갈 수 있는 아무 방향으로 간다."

세 지도에서 실행합니다.

```powershell
python 01_rule_agent.py --map empty
```

```powershell
python 01_rule_agent.py --map walls
```

```powershell
python 01_rule_agent.py --map trap
```

실제 결과:

| 지도 | 결과 | 걸음 수 |
|---|---|---|
| `empty` | 성공 | 8 (최단) |
| `walls` | 성공 | 10 (최단) |
| `trap` | **시간 초과** | 72 (최대 걸음 수) |

`trap` 지도에서는 이렇게 제자리를 맴돕니다.

```
   0 1 2 3 4 5
 0 H . . . . .
 1 . . # # # .
 2 . . . . # .
 3 D . . . # .       ← 아래(목표 쪽)는 벽, 오른쪽은 목표에서 멀어짐
 4 # # # # # .       → 위로 한 칸 갔다가, 다시 아래로… 무한 반복
 5 G . . . . .
```

목표로 가려면 **잠시 목표에서 멀어져야**(오른쪽 위로 크게 돌아가야) 하는데, 단순 규칙은 그걸 못 합니다. 이것이 Jev에게 풀게 할 과제입니다.

**직접 해 보기**
- `--delay 0.5`로 천천히 실행해서 움직임을 눈으로 따라가 봅니다.

## 규칙
> 기준 에이전트는 **일부러 단순하게** 둡니다. 최단 경로 알고리즘(BFS)을 쓰면 모든 지도를 완벽히 풀겠지만, 실제 드론 환경처럼 지도가 완전하지 않거나 계속 바뀌는 상황에서는 그런 규칙을 짜기 어렵습니다. 이 모듈은 "규칙으로 짜기 어려운 판단을 Jev에게 맡기는" 연습입니다.

## 산출물
- 규칙 에이전트의 지도별 결과 (위 표와 같아야 함)

## 체크리스트
- [ ] `empty`, `walls`는 성공하고 `trap`은 시간 초과인지 확인한다.
- [ ] `trap`에서 왜 막히는지 설명할 수 있는지 확인한다.

---

# 4 단계: Jev 에이전트 첫 실행

이제 `JevAgent`로 바꿉니다. 먼저 `agents.py`에서 두 부분을 읽어 봅니다.

**① 행동을 Choice로 정의** — 행동 네 개가 그대로 선택지입니다.

```python
self.move_question = Choice(
    instructions=(
        "Pick the single move that brings the drone closer to the target "
        "without hitting a wall or leaving the grid"
    ),
    criteria={
        "up": "Move up: y decreases by 1",
        "down": "Move down: y increases by 1",
        "left": "Move left: x decreases by 1",
        "right": "Move right: x increases by 1",
    },
)
```

**② state 만들기** (`build_state`) — 이 단계에서는 기본 정보만 들어갑니다.

```python
state = {
    "grid_size": {"width": 5, "height": 5},
    "coordinate_system": "x grows to the right, y grows downward, (0,0) is the top-left cell",
    "drone": {"x": 0, "y": 0},
    "target": {"name": "goal", "x": 4, "y": 4},
    "recent_moves": [],          # 최근 행동 4개
}
```

벽 없는 지도에서 실행합니다.

```powershell
python 02_jev_empty.py
```

출력 형태 (숫자는 **예시**입니다. 실제 값은 실행해서 확인하세요):

```
   0 1 2 3 4
 0 H D . . .
 ...
걸음 1 | right (확률 0.93)
 ...
========================================
결과          : 성공
걸음 수       : 8
Jev 호출      : 8회, 평균 180ms
로그          : ...\grid-agent\logs\02_jev_empty_20261126_143620.jsonl
```

**로그 읽기** — `logs/` 폴더의 `.jsonl` 파일은 한 줄이 한 턴입니다. VS Code 같은 편집기로 열어 봅니다. (아래 숫자는 예시)

```json
{"step": 0, "pos": [0, 0], "target": "goal", "chosen": "right", "final": "right",
 "override": null, "probabilities": {"up": 0.0, "down": 0.07, "left": 0.0, "right": 0.93},
 "latency_ms": 180.5, "state": {...Jev에게 보낸 state...}}
```

| 필드 | 의미 |
|---|---|
| `chosen` / `final` | Jev가 고른 행동 / 실제로 한 행동 (안전 감시가 바꾸면 다름) |
| `probabilities` | 행동별 확률. `down`과 `right`가 둘 다 정답일 때 확률이 나뉨 |
| `latency_ms` | 이 판단에 걸린 시간 |
| `state` | Jev가 본 정보 그대로. **결과가 이상하면 여기부터 확인** |

## 규칙
> 행동 하나에 **Jev 호출 한 번**입니다. 8걸음이면 8번 호출합니다. 호출 수와 평균 지연 시간을 기록해 두세요. 다음 모듈(실시간 게임)에서 "1초에 몇 번 판단할 수 있는가"를 정할 때 이 숫자를 씁니다.

> 오른쪽(`right`)과 아래(`down`)는 둘 다 목표에 가까워지는 정답입니다. 확률이 둘로 나뉘는 것은 정상입니다.

## 산출물
- `logs/02_jev_empty_<시각>.jsonl` (결정 기록)
- 메모: 결과, 걸음 수, 평균 지연 시간

## 체크리스트
- [ ] 결과가 "성공"이고 걸음 수가 8에 가까운지 확인한다.
- [ ] 로그 파일에서 `state`와 `probabilities`를 찾아 읽어 봤는지 확인한다.
- [ ] 평균 지연 시간을 메모했는지 확인한다.

---

# 5 단계: 벽이 있는 지도 — state 설계와 안전 감시

벽이 생기면 Jev에게 **주변 정보**를 알려 줘야 합니다. `03_jev_walls.py`는 기본으로 state에 두 가지를 더 넣습니다.

```python
state["neighbors"] = {"up": "edge", "down": "free", "left": "edge", "right": "free"}
state["map"] = [
    "D.....",
    ".#.#..",
    "...#..",
    "##....",
    "...#..",
    ".....G",
]
state["map_legend"] = "D=drone, G=goal, H=home, #=wall, .=free"
```

그리고 **안전 감시**(`safety.py`)를 붙입니다. Jev가 막힌 칸을 고르면, 갈 수 있는 행동 중 **Jev가 준 확률이 가장 높은 것**으로 바꿉니다.

```python
best = max(legal, key=lambda m: decision.probabilities.get(m, 0.0))
```

네 가지 조합으로 실행하고 결과를 표에 적습니다.

```powershell
python 03_jev_walls.py
```

```powershell
python 03_jev_walls.py --no-safety
```

```powershell
python 03_jev_walls.py --no-neighbors --no-map
```

```powershell
python 03_jev_walls.py --no-neighbors --no-map --no-safety
```

| 실험 | 주변 칸 | 지도 | 안전 감시 | 결과 | 걸음 | 안전 감시 개입 |
|---|---|---|---|---|---|---|
| A | O | O | O | | | |
| B | O | O | X | | | |
| C | X | X | O | | | |
| D | X | X | X | | | |

안전 감시가 개입하면 화면에 이렇게 나옵니다.

```
걸음 3 | right (확률 0.55) | 안전 감시: 'down' 막힘 → 'right'
```

마지막으로 **도전 과제**: 규칙 에이전트가 실패한 함정 지도입니다.

```powershell
python 03_jev_walls.py --map trap
```

**직접 해 보기**
1. 실험 D에서 충돌이 나면, 로그의 마지막 줄 `state`를 보고 Jev가 **왜** 그 방향을 골랐는지 추측해 봅니다. (힌트: 벽에 대한 정보가 state에 있었나요?)
2. `trap`에서 실패하면 `agents.py`의 `build_state`에 정보를 하나 추가해 봅니다. 예: `"steps_to_target": world.distance(world.pos, target)` (벽을 돌아가는 실제 거리). 다시 실행해 결과가 바뀌는지 봅니다.
3. Choice의 `instructions`에 "If the direct way is blocked, go around the walls even if it moves away from the target for a while"를 덧붙여 봅니다.

## 규칙
> **안전 감시는 끄지 않는 것이 기본입니다.** `--no-safety`는 "안전 감시가 없으면 무슨 일이 생기는지" 보기 위한 실험용입니다. 드론에서는 이 부분이 비행 컨트롤러의 페일세이프이고, 절대 Jev에게만 맡기지 않습니다.

> state를 바꿀 때는 **한 번에 하나씩** 바꾸고 결과를 기록합니다. 여러 개를 한꺼번에 바꾸면 무엇이 효과가 있었는지 알 수 없습니다.

> 안전 감시 개입 횟수가 많다면 "Jev가 상황을 잘 못 보고 있다"는 신호입니다. 안전 감시가 대신 운전하고 있는 셈이니, state를 개선해야 합니다.

## 산출물
- 실험 A~D 결과 표
- `trap` 지도 결과와, 시도한 state 변경 내용 메모

## 체크리스트
- [ ] 실험 A에서 `walls` 지도를 성공하는지 확인한다.
- [ ] 안전 감시를 끈 실험(B, D)과 켠 실험(A, C)의 차이를 설명할 수 있는지 확인한다.
- [ ] state에서 정보를 뺐을 때 안전 감시 개입 횟수나 결과가 어떻게 바뀌는지 확인한다.
- [ ] `trap` 지도에 한 번 이상 도전했는지 확인한다.

---

# 6 단계: 배터리와 복귀 판단

이제 드론 임무에 가까워집니다. `delivery` 지도에서 **집(H) → 목표(G) → 집(H)** 으로 돌아와야 성공입니다. 한 걸음마다 배터리가 1 줄고, 맞바람(`--wind`)이 불면 가끔 2가 줄어듭니다.

Jev에게는 이동(Choice)과 함께 **"지금 복귀해야 하는가?"를 Noul로** 묻습니다.

```python
self.return_question = Noul(
    instructions=(
        "The remaining battery is NOT enough to fly to the goal and then back home, "
        "so the drone should return home now"
    ),
)
```

state에는 판단에 필요한 숫자를 **코드가 계산해서** 넣습니다.

```python
state["battery"] = 18
state["goal_visited"] = False
state["steps_to_home"] = 0          # 지금 위치 → 집
state["steps_to_goal"] = 10         # 지금 위치 → 목표
state["steps_goal_to_home"] = 10    # 목표 → 집
state["headwind_chance"] = 0.0      # 한 걸음에 배터리를 2 쓸 확률
```

복귀는 두 군데에서 결정됩니다.

| 누가 | 언제 복귀 | 코드 |
|---|---|---|
| **Jev** (판단) | `return_home` Noul이 0.7 이상 | `runner.py`의 `RETURN_THRESHOLD` |
| **안전 감시** (강제) | 배터리 ≤ 집까지 거리 + 여유분 2 | `safety.py`의 `must_return` |

세 상황을 실행합니다.

```powershell
python 04_jev_battery.py --battery 30
```

```powershell
python 04_jev_battery.py --battery 18
```

```powershell
python 04_jev_battery.py --battery 24 --wind 0.4
```

| 상황 | 기대하는 행동 |
|---|---|
| 배터리 30 (왕복 20) | 목표를 찍고 돌아와 **성공** |
| 배터리 18 (왕복 20) | 처음부터 부족 → **출발하지 않고 안전 복귀** |
| 배터리 24 + 바람 | 출발은 가능하지만 바람 때문에 모자랄 수 있음 → **판단이 어려운 상황** |

같은 상황을 규칙 에이전트로도 실행해 비교합니다.

```powershell
python 04_jev_battery.py --battery 24 --wind 0.4 --agent rule
```

규칙 에이전트의 실제 결과는 **배터리 방전**입니다. 규칙("남은 배터리 < 목표까지 + 목표→집")이 바람을 고려하지 않아서, 출발할 때는 충분해 보였지만 목표를 찍고 돌아오는 길에 배터리가 다 떨어졌습니다.

```
   0 1 2 3 4 5
 0 H . D . . .
 ...
걸음 18 | 배터리 0 | 목표 방문 O | left

결과          : 배터리 방전
```

**직접 해 보기**
1. Jev는 `headwind_chance`를 보고 더 조심스럽게 판단하나요? 로그에서 매 턴 `return_home` 값이 어떻게 변하는지 봅니다.
2. `--seed 2`, `--seed 3`으로 바람을 바꿔 여러 번 실행합니다.
3. Noul의 `instructions`에 "Keep a safety margin because headwind can double the battery use"를 덧붙이고 다시 실행합니다.
4. `safety.py`의 `battery_margin`을 2에서 4로 올리면 방전이 줄어드는지 봅니다. 대신 무엇을 잃나요?

## 규칙
> **복귀 판단에는 두 겹의 안전망이 있습니다.** Jev가 먼저 판단하고(빠르고 유연함), 안전 감시가 마지막에 막습니다(느슨하지 않고 확실함). 드론에서도 같은 구조를 씁니다.

> 목표를 이미 찍고 집으로 돌아가는 중에는 복귀 판단이 의미가 없습니다. 그래서 **출발 전과 비행 중의 판단**이 중요합니다. 방전이 난다면 "언제 판단을 잘못했는지"를 로그에서 찾습니다.

> Noul 기준값 0.7은 공식 문서가 제시한 **출발점**입니다. 방전이 위험한 작업일수록 기준을 낮춰서(예: 0.5) 더 일찍 복귀하게 합니다.

## 산출물
- 세 상황(30 / 18 / 24+바람)의 Jev 결과와 규칙 에이전트 결과
- 바람 상황 로그에서 `return_home` 값의 변화 메모

## 체크리스트
- [ ] 배터리 30에서 성공하는지 확인한다.
- [ ] 배터리 18에서 출발하지 않고 "안전 복귀"로 끝나는지 확인한다.
- [ ] 바람 상황에서 Jev와 규칙 에이전트의 결과를 비교했는지 확인한다.
- [ ] 복귀를 Jev가 결정했는지, 안전 감시가 강제했는지 화면에서 구분할 수 있는지 확인한다.

---

# 7 단계: 비교 평가와 정리

지금까지의 시나리오 8개를 규칙 에이전트와 Jev로 한 번에 돌려 표로 비교합니다.

```powershell
python 05_compare.py
```

키 없이 규칙 에이전트만 돌릴 수도 있습니다.

```powershell
python 05_compare.py --rule-only
```

규칙 에이전트의 실제 결과:

```
시나리오       에이전트   결과                 걸음    배터리     안전개입     평균지연ms
------------------------------------------------------------------------------
빈 격자       rule   성공                  8      -        0          -
벽          rule   성공                 10      -        0          -
함정         rule   시간 초과              72      -        0          -
배달-충분      rule   성공                 20     10        0          -
배달-부족      rule   안전 복귀 (목표 포기)       0     18        0          -
배달-바람1     rule   배터리 방전             18      0        0          -
배달-바람2     rule   배터리 방전             19      0        0          -
배달-바람3     rule   배터리 방전             17      0        1          -
```

Jev 결과가 이 표 사이사이에 `jev` 줄로 들어갑니다. 결과를 보고 아래 질문에 답을 적어 봅니다.

1. **Jev가 규칙보다 나은 곳**은 어디인가요? (함정 지도? 바람 상황?)
2. **규칙이 Jev보다 나은 곳**은 어디인가요? (속도는 항상 규칙이 빠릅니다. 결과는?)
3. Jev의 **평균 지연 시간**이 몇 ms인가요? 1초에 몇 번 판단할 수 있나요?
4. 안전 감시가 개입한 시나리오는 어디이고, 그때 state에 무엇이 부족했나요?

## 규칙
> Jev가 모든 곳에서 이길 필요는 없습니다. **규칙으로 충분한 곳은 규칙을, 규칙으로 짜기 어려운 판단만 Jev를** 쓰는 것이 실전 설계입니다. 이 표는 그 경계를 찾기 위한 것입니다.

> 바람 시나리오는 무작위 요소가 있어서 시드(`seed`)마다 결과가 다릅니다. 한두 번의 결과로 결론 내리지 말고, `05_compare.py`의 `SCENARIOS`에 시드를 늘려 여러 번 비교합니다.

## 산출물
- `05_compare.py` 비교표 (규칙 + Jev)
- 위 질문 1~4에 대한 답 메모
- `logs/` 폴더의 결정 기록

## 체크리스트
- [ ] 비교표에 8개 시나리오 × 2개 에이전트 결과가 모두 나오는지 확인한다.
- [ ] 질문 1~4에 답을 적었는지 확인한다.
- [ ] Jev의 평균 지연 시간으로 "1초에 몇 번 판단 가능한지" 계산했는지 확인한다.

---

# 다음 단계

다음 모듈 **[M05 격자 미로 탈출](../M05-maze-escape/README.md)**에서는 같은 격자 게임을 미로로 키우고, 무작위·규칙·탐색(BFS)·Jev 정책을 비교합니다. 주변만 보는 **부분 관측**, 갈 수 있는 행동만 선택지로 주는 **행동 마스킹**, Jev가 애매할 때 규칙으로 넘기는 **확률 기반 대체**도 다룹니다.

이 모듈의 결정 루프는 **턴제**라서 Jev가 답할 때까지 게임이 기다려 줍니다. 실제 드론은 기다려 주지 않습니다. 그 다음 모듈 **[M07 실시간 게임 에이전트](../M07-realtime-agent/README.md)**에서는 게임이 계속 움직이는 동안 Jev를 호출하면서 아래를 다룹니다.

- 7단계에서 잰 지연 시간으로 **판단 주기** 정하기 (예: 200ms면 초당 약 5회)
- Jev 응답이 늦을 때 **이전 행동 유지** 또는 **안전 행동**으로 대체하기
- 화면(또는 제어)은 빠르게, 판단은 느리게 돌리는 **두 주기 분리**
