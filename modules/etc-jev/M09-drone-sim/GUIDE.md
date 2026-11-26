# 개념

이 모듈에서는 바람·배터리·장애물·지오펜스가 있는 **2D 드론 시뮬레이터**에서 배달 임무를 수행하는 드론 에이전트를 만듭니다. 아래 네 가지만 알면 바로 시작할 수 있습니다. 자세한 개념은 [README.md](README.md)를 참고하세요.

| 용어 | 한 줄 설명 |
|---|---|
| 3계층 | ① 판단(Jev, 5Hz) → ② 안전 감시(규칙, 60Hz) → ③ 제어(PID, 60Hz) |
| 임무 단계 | TAKEOFF → TRANSIT ⇄ AVOID → RETURN → LAND. "계속 / 회피 / 복귀"는 Jev가 판단 |
| PID | 목표 속도와의 오차로 추력을 계산. I항이 바람을 이겨 냄 |
| 평가 하네스 | 같은 시나리오·시드로 여러 두뇌를 돌려 완수율·무사고 귀환율·충돌·지연·비용을 비교 |

좌표와 단위는 M07과 같습니다.

```
  y (북)  ↑     비행 구역 30m × 20m, 왼쪽 아래 (0, 0)
          │     집 H = (3, 3), 순항 고도 3m, 속도 2m/s
          └──→ x (동)    배터리 %: 떠 있기 0.35%/초 + 공기 대비 속도² × 0.08%/초
```

시나리오는 5개입니다.

| 시나리오 | 특징 | 정답 행동 |
|---|---|---|
| `calm` | 바람 없음, 경유지 2개 | 완수 |
| `windy` | 동쪽으로 1.2m/s 바람 + 돌풍 | 완수 (PID I항 필요) |
| `nofly` | 집과 경유지 사이에 비행 금지 구역 | 돌아가서 완수 |
| `lowbatt` | 배터리 32%, 맞바람 | **끝까지 가면 예비 배터리를 침범** → 적절한 때 포기하고 귀환 |
| `storm` | 강한 바람(1.7m/s) + 큰 돌풍 + 금지 구역 | 안전하게 완수하거나 포기 |

> 이 가이드의 규칙 두뇌·PID·안전 감시·평가 결과는 **실제 실행 결과**입니다. Jev 결과는 실행할 때마다, 네트워크 상태마다 달라집니다.

---

# 1 단계: 준비하고 직접 비행해 보기

[M01-basics](../M01-basics/GUIDE.md)에서 Python 3.10 이상과 API 키를 준비했다고 가정합니다.

```powershell
cd C:\Users\user\git\ai-native-sdlc\modules\etc-jev\M09-drone-sim\drone-sim
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

직접 비행합니다. **이륙은 자동**이고, 고도 3m에 도달하면 방향키로 움직일 수 있습니다. `R`은 복귀(집으로 가면 자동 착륙), `L`은 그 자리 착륙, `ESC`는 종료입니다.

```powershell
python 00_fly_manual.py
```

바람이 부는 날도 날아 봅니다. 키를 떼면(HOVER) PID가 제자리를 지키려고 버티는 것을 봅니다.

```powershell
python 00_fly_manual.py --scenario windy
```

비행 금지 구역에서 안전 감시를 끄고 일부러 들어가 봅니다.

```powershell
python 00_fly_manual.py --scenario nofly --no-safety
```

화면에서 확인할 것:

| 화면 요소 | 의미 |
|---|---|
| 드론 테두리 색 | 단계: 하늘색 이륙, 초록 이동, 노랑 회피, 주황 복귀, 보라 착륙 |
| 드론 크기 | 고도가 높을수록 크게 |
| 왼쪽 위 화살표 | 지금 바람 (돌풍 때문에 계속 바뀜) |
| 오른쪽 배터리 막대 | 초록 30% 초과, 노랑 8~30%, 빨강 8% 미만 (예비 배터리) |
| `home needs` | 지금 집으로 가는 데 필요한 배터리 예상 (%) |
| 빨간 사각 선 / 붉은 원 | 지오펜스 안쪽 경계 / 비행 금지 구역 |

## 규칙
> 비행 금지 구역은 **부딪히지 않습니다.** 물리적으로는 들어갈 수 있지만 규칙상 들어가면 안 되는 곳입니다. 결과에 "위반"으로 기록됩니다.

> 배터리는 공기 대비 속도가 빠를수록 많이 줄어듭니다. 맞바람을 안고 날면 같은 거리라도 배터리가 더 듭니다.

## 산출물
- 직접 비행한 결과 (임무 완수 여부, 남은 배터리, 위반 횟수)

## 체크리스트
- [ ] 자동 이륙 후 방향키로 비행하고 `R`로 집에 돌아와 착륙했는지 확인한다.
- [ ] `windy`에서 키를 떼도 드론이 크게 떠밀리지 않는 것을 확인한다.
- [ ] 안전 감시를 끄고 금지 구역에 들어가면 위반이 기록되는 것을 확인한다.

---

# 2 단계: 제어 계층 — PID 맞추기

가장 아래 계층부터 봅니다. `pid.py`의 PID는 **목표 속도와 실제 속도의 오차**로 추력을 계산합니다.

```python
out = kp * error + ki * integral + kd * derivative
```

| 항 | 하는 일 | 없으면 |
|---|---|---|
| P (비례) | 오차가 크면 세게 고침 | 반응이 없음 |
| I (적분) | 오래 남은 오차를 누적해서 없앰 | 바람·공기 저항 때문에 **오차가 계속 남음** |
| D (미분) | 오차가 빨리 줄면 미리 살살 | 출렁임이 커질 수 있음 |

P / PI / PID를 두 가지로 시험합니다 (화면 없이 몇 초).

```powershell
python 01_pid_tuning.py
```

실제 결과:

```
제어기     (Kp, Ki, Kd)         90%도달s     최고속도     5초뒤오차      바람떠밀림m       평균속도오차
--------------------------------------------------------------------------------
P       (2.5, 0.0, 0.0)        못 도달     1.61      0.39        5.44         0.28
PI      (2.5, 1.2, 0.0)        1.07     1.98      0.02        0.69         0.10
PID     (2.5, 1.2, 0.05)       1.08     1.99      0.01        0.69         0.10
```

- **P만**: 공기 저항 때문에 2m/s에 끝내 도달하지 못하고(1.61m/s), 바람 속 제자리 비행에서 20초 동안 **5.4m나 떠밀립니다.**
- **PI**: I항이 남은 오차를 없애서 1초 만에 도달하고, 떠밀림이 0.7m로 줄어듭니다.
- **PID**: 이 시뮬레이터에서는 D항의 효과가 작습니다. 실제 드론의 자세 제어처럼 출렁이기 쉬운 곳에서 D항이 중요해집니다.

내 이득으로 시험해 봅니다.

```powershell
python 01_pid_tuning.py --kp 8 --ki 3 --kd 0.1
```

```powershell
python 01_pid_tuning.py --kp 1 --ki 0 --kd 0
```

실제 결과: `(8, 3, 0.1)`은 0.53초 만에 도달하고 떠밀림 0.28m, `(1, 0, 0)`은 1.25m/s까지만 오르고 떠밀림 10.35m.

## 규칙
> 이득은 `config.py`의 `VEL_PID`에서 바꿉니다. 바꾼 뒤에는 반드시 6단계 평가 하네스로 **임무 전체 결과**도 확인합니다. 제어만 좋아지고 임무는 나빠질 수 있습니다.

> 이득을 너무 크게 하면 실제 드론에서는 모터 한계와 센서 잡음 때문에 떨림이 생깁니다. 이 시뮬레이터는 그런 것을 단순화했습니다.

## 산출물
- P / PI / PID 비교표, 내가 시험한 이득과 결과

## 체크리스트
- [ ] P만으로는 바람 속에서 크게 떠밀리는 것을 확인한다.
- [ ] I항이 그 오차를 없애는 이유를 설명할 수 있는지 확인한다.
- [ ] 내 이득으로 한 번 이상 시험해 봤는지 확인한다.

---

# 3 단계: 임무 단계와 규칙 두뇌

이제 판단 계층을 붙입니다. 먼저 규칙 두뇌(`RuleBrain`)로 임무 단계가 어떻게 바뀌는지 봅니다.

`mission.py`는 기계적인 전환(고도 도달, 경유지 도착, 집 도착, 착지)을 처리하고, 두뇌는 **판단이 필요한 전환**만 고릅니다.

```python
def allowed_phases(self):
    if self.phase not in FLIGHT_PHASES:      # 이륙·착륙 중에는 두뇌에게 묻지 않음
        return []
    return ["RETURN", "AVOID"] if self.returning else ["TRANSIT", "AVOID", "RETURN"]
```

규칙 두뇌의 단계 판단은 이렇습니다.

```python
if battery < battery_needed_finish_mission + RESERVE_PCT:
    phase = "RETURN"          # 끝까지 가면 예비 배터리를 못 남김 → 지금 포기
elif 목표에서 50도 넘게 꺾어 가야 함:
    phase = "AVOID"
else:
    phase = "TRANSIT"
```

```powershell
python 02_mission_rule.py
```

화면 없이 결과만:

```powershell
python 02_mission_rule.py --headless
```

실제 결과 (`calm`):

```
결과           : 집에 착륙 (36.2초)
임무 완수      : 예 (경유지 2/2)
무사고 귀환    : 예
남은 배터리    : 78.8%
단계 기록      : TAKEOFF(0.0s) → TRANSIT(2.7s) → TRANSIT(11.2s) → AVOID(17.3s) → TRANSIT(17.5s)
                 → TRANSIT(20.9s) → RETURN(20.9s) → LAND(33.1s) → LANDED(36.2s)
```

배터리가 모자라는 임무를 봅니다.

```powershell
python 02_mission_rule.py --scenario lowbatt
```

```powershell
python 02_mission_rule.py --scenario lowbatt --seed 1 --headless
```

`lowbatt`는 시드(돌풍)에 따라 결과가 달라집니다. 실제로 10개 시드 중 규칙 두뇌는 **2번 완수, 9번 무사고 귀환**했습니다 (나머지 7번은 중간에 포기하고 귀환). 단계 기록에서 `RETURN ... brain`이 찍힌 시각이 "포기를 결정한 순간"입니다.

## 규칙
> **RETURN은 되돌릴 수 없습니다.** 한 번 포기하면 남은 경유지는 가지 않습니다. 그래서 이 판단이 임무에서 가장 중요합니다.

> 배터리 예상(`battery_needed_*`)은 직선 거리와 평균 바람으로 계산한 **낙관적인 값**입니다. 실제로는 회피·돌풍·이착륙 때문에 더 듭니다. 예비 배터리(8%)가 그 차이를 메웁니다.

## 산출물
- `calm`, `lowbatt`의 단계 기록

## 체크리스트
- [ ] 단계 기록에서 코드가 바꾼 전환(`reached ...`)과 두뇌가 바꾼 전환(`brain`)을 구분할 수 있는지 확인한다.
- [ ] `lowbatt`에서 규칙 두뇌가 포기를 결정한 시각과 그때의 배터리를 확인한다.

---

# 4 단계: 안전 감시 계층

안전 감시(`safety.py`)는 60Hz로 매번, 판단 계층이 무엇을 골랐든 마지막에 확인합니다.

| 감시 | 조건 | 조치 |
|---|---|---|
| 장애물 | 가려는 방향이 가깝거나, 지금 속도로 멈추기 전에 닿거나, 제자리에서도 너무 가까움 | **트인 쪽으로 비켜남** (돌풍 속 HOVER는 밀려서 부딪힐 수 있음) |
| 지오펜스 | 0.8초 뒤 예상 위치가 경계 밖 | HOVER |
| 비행 금지 구역 | 0.8초 뒤 예상 위치가 구역 안 | HOVER |
| 배터리 | 집까지 필요한 양 + 4%보다 적음 | 강제 RETURN |
| 배터리 | 4% 미만 | 그 자리에 강제 LAND |

효과를 보려고 **부주의한 두뇌**(`RuleBrain(careful=False)`: 금지 구역·배터리를 무시)를 만들었습니다. 신중한 두뇌·부주의한 두뇌 × 안전 감시 켬·끔을 10판씩 비교합니다.

```powershell
python 03_safety_layer.py
```

실제 결과:

```
시나리오      두뇌               판    완수율    무사고    충돌    위반    시간s    배터리    안전
------------------------------------------------------------------------------------------
lowbatt   naive           10    20%    20%   0.0   0.0   36.5    6.9   0.0
lowbatt   naive+safety    10    20%    20%   0.0   0.0   36.5    6.9   0.5
lowbatt   rule            10    20%    90%   0.0   0.0   24.4   16.5   0.0
lowbatt   rule+safety     10    20%    90%   0.0   0.0   24.4   16.5   0.1
nofly     naive           10     0%     0%   0.0   2.0   33.4   80.5   0.0
nofly     naive+safety    10     0%     0%   0.0   0.0  150.0   46.3   2.0
nofly     rule            10   100%   100%   0.0   0.0   38.2   78.8   0.0
nofly     rule+safety     10   100%   100%   0.0   0.0   38.3   78.7   2.0
storm     naive           10     0%     0%   0.1   1.0   36.7   64.6   0.0
storm     naive+safety    10     0%     0%   2.3   3.6  121.7    2.4 326.0
storm     rule            10    90%    90%   0.2   0.0   52.7   52.9   0.0
storm     rule+safety     10    80%    80%   0.2   0.0   52.5   52.7   3.6
```

결과 읽기:
- **nofly**: 안전 감시가 위반을 2.0 → 0으로 막았습니다. 하지만 부주의한 두뇌는 계속 금지 구역으로 가려 하고, 안전 감시는 계속 멈춰 세워서 **150초 동안 갇혀** 있다가 시간 초과로 끝납니다. **안전하지만 임무는 못 합니다.**
- **lowbatt**: 부주의한 두뇌는 안전 감시가 있어도 배터리 6.9%로 착륙합니다 (예비 8% 침범). 안전 감시의 강제 복귀 기준(집까지 + 4%)은 "추락만은 막는 선"이지 "예비 배터리를 지키는 선"이 아니기 때문입니다.
- **storm**: 부주의한 두뇌와 안전 감시가 326번이나 부딪히며 싸우다가 오히려 **충돌·위반이 늘고** 배터리 2.4%까지 버팁니다.
- **신중한 두뇌**: 안전 감시가 거의 개입하지 않습니다 (0.1~3.6회).

부주의한 두뇌 + 안전 감시를 화면으로 봅니다. 금지 구역 가장자리에서 멈췄다 갔다 하는 모습을 확인합니다.

```powershell
python 03_safety_layer.py --watch nofly
```

## 규칙
> **안전 감시는 마지막 방어선이지, 나쁜 판단을 고쳐 주지 않습니다.** 판단 계층이 제약(금지 구역·배터리)을 이해하고 지켜야 하고, 안전 감시는 그래도 놓친 것을 막습니다.

> 안전 감시 개입 횟수는 판단 계층의 **건강 지표**입니다. 개입이 많다면 판단 계층이 상황을 잘못 보고 있다는 뜻입니다.

## 산출물
- 안전 감시 비교표 (위 표와 같아야 함)
- "안전 감시만으로 해결되지 않은 경우" 세 가지 메모

## 체크리스트
- [ ] 안전 감시가 금지 구역 위반을 막는 것을 확인한다.
- [ ] 부주의한 두뇌 + 안전 감시가 `nofly`에서 갇히는 이유를 설명할 수 있는지 확인한다.
- [ ] `--watch nofly`로 화면에서 직접 확인했는지 확인한다.

---

# 5 단계: 판단 계층에 Jev

이제 판단 계층을 Jev로 바꿉니다. 안전 감시와 PID는 그대로입니다.

Jev에게 보내는 관측 (요약, 숫자는 **예시**):

```python
{
  "phase": "TRANSIT", "returning": False,
  "allowed_phases": ["TRANSIT", "AVOID", "RETURN"],
  "battery_pct": 21.4,
  "battery_needed_return_home_pct": 6.2,      # 코드가 계산한 값
  "battery_needed_finish_mission_pct": 17.9,  # 코드가 계산한 값
  "battery_reserve_pct": 8.0,
  "target": {"name": "waypoint 2", "dx": 12.1, "dy": -9.8, "distance": 15.6},
  "home": {"dx": -10.0, "dy": -13.0, "distance": 16.4},
  "waypoints_left": 1,
  "wind_mps": {"vx": -1.3, "vy": 0.2},
  "range_sensors_m": {"N": 6.0, "NE": 6.0, "E": 4.1, ...},
  "nofly_zones_nearby": [],
  "geofence_margin_m": {"N": 3.9, "S": 16.1, "E": 17.0, "W": 13.0}
}
```

두 질문을 한 번에 묻습니다 (`brains.py`의 `JevBrain`).

```python
questions = {
    "phase": Choice(instructions="Decide the drone's mission phase ... Return home if the battery would not "
                                 "cover finishing the mission plus the reserve ...",
                    criteria={p: PHASE_TEXT[p] for p in obs["allowed_phases"]}),
    "heading": Choice(instructions="Pick the flight direction for the next 0.2 seconds ...",
                      criteria={h: HEADING_TEXT[h] for h in 안전한_방향 + ["HOVER"]}),   # 행동 마스킹
}
```

판단 관리자는 M07에서 정한 **async + budget 0.6초 + hold 0.8초**를 그대로 씁니다. API 키를 등록하고 실행합니다.

Windows PowerShell:
```powershell
$env:TYPESAFE_API_KEY = "발급받은_키"
```

macOS / Linux:
```bash
export TYPESAFE_API_KEY="발급받은_키"
```

```powershell
python 04_jev_mission.py
```

```powershell
python 04_jev_mission.py --scenario lowbatt
```

```powershell
python 04_jev_mission.py --scenario nofly
```

```powershell
python 04_jev_mission.py --scenario storm --min-prob 0.5
```

출력 형태 (숫자는 **예시**):

```
결과           : 집에 착륙 (38.9초)
임무 완수      : 예 (경유지 2/2)
무사고 귀환    : 예
안전 감시 개입 : 13회 (obstacle 13)
판단 요청      : 91회 (적용 90, 늦어서 버림 0, 자신 없음 0, 시간 초과 0)
응답 지연      : 평균 0.28초, p95 0.38초
입력 토큰·비용 : 57,600토큰, 약 $0.0024
단계 기록      : TAKEOFF(0.0s) → TRANSIT(2.7s) → ... → RETURN(23.5s) → LAND(35.8s) → LANDED(38.9s)
```

| 실험 | 시나리오 | 결과 | 완수 | 무사고 | 포기 시각·배터리 | 안전 개입 | 지연 p95 | 비용 |
|---|---|---|---|---|---|---|---|---|
| A | calm | | | | - | | | |
| B | lowbatt | | | | | | | |
| C | nofly | | | | - | | | |
| D | storm (+min_prob 0.5) | | | | | | | |

**직접 해 보기**
1. 실험 B의 로그(`logs/04_jev_lowbatt_*.jsonl`)에서 `phase`가 처음 `RETURN`이 된 줄을 찾습니다. 그때 `battery_pct`와 `battery_needed_finish_mission_pct + reserve`를 비교합니다. Jev는 규칙과 같은 시점에 포기했나요?
2. 그 줄의 `probabilities.phase`를 봅니다. TRANSIT과 RETURN 사이에서 얼마나 망설였나요?
3. 안전 감시 개입이 많다면 어떤 종류(`obstacle`, `nofly`, ...)인지 보고, 관측에 무엇이 부족했는지 생각합니다.

## 규칙
> Jev의 `phase` 선택지는 **지금 허용된 단계만** 줍니다 (단계 마스킹). 이륙 중에 RETURN을 고르는 일이 원천적으로 없습니다.

> RETURN은 되돌릴 수 없으므로, 자신 없을 때 바로 포기하지 않게 `--min-prob`(낮은 확률이면 HOVER하고 다음 판단을 기다림)를 함께 시험합니다.

## 산출물
- 실험 A~D 결과 표
- `logs/04_jev_*.jsonl` 판단 기록

## 체크리스트
- [ ] Jev 두뇌로 `calm` 임무를 완수하는지 확인한다.
- [ ] `lowbatt`에서 Jev가 포기를 결정한 시각과 근거(배터리 숫자)를 로그에서 찾았는지 확인한다.
- [ ] 지연 p95와 비용을 기록했는지 확인한다.

---

# 6 단계: 평가 하네스

한두 번의 비행으로는 두뇌를 비교할 수 없습니다 (돌풍·지연이 매번 다름). 평가 하네스(`harness.py`)는 **두뇌 × 시나리오 × 시드**를 모두 돌려 같은 지표로 채점합니다.

먼저 키 없이 규칙 두뇌 두 가지를 비교합니다 (`rule`: 지연 없음, `rule+latency`: M07의 지연 흉내 0.3±0.1초, 10% 확률로 +1.2초).

```powershell
python 05_evaluate.py --no-jev
```

실제 결과 (시나리오·두뇌마다 10판):

```
시나리오      두뇌               판    완수율    무사고    충돌    위반    시간s    배터리    안전  p95s    호출      비용$
--------------------------------------------------------------------------------------------------------
calm      rule            10   100%   100%   0.0   0.0   36.2   78.8   0.0  0.00   153   0.0000
calm      rule+latency    10    80%    80%   0.2   0.0   47.8   75.0   1.4  1.50    80   0.0000
windy     rule            10   100%   100%   0.0   0.0   36.4   71.7   0.6  0.00   154   0.0000
windy     rule+latency    10    90%    90%   0.1   0.0   47.8   66.8   1.6  1.51    80   0.0000
nofly     rule            10   100%   100%   0.0   0.0   38.3   78.7   2.0  0.00   163   0.0000
nofly     rule+latency    10   100%   100%   0.0   0.0   52.5   74.1   3.8  1.52    89   0.0000
lowbatt   rule            10    20%    90%   0.0   0.0   24.4   16.5   0.1  0.00    93   0.0000
lowbatt   rule+latency    10     0%   100%   0.0   0.0   19.8   21.3   0.0  1.29    28   0.0000
storm     rule            10    80%    80%   0.2   0.0   52.5   52.7   3.6  0.00   234   0.0000
storm     rule+latency    10    20%    20%   1.3   0.1   83.7   26.0  14.7  1.52   150   0.0000
```

결과 읽기:
- **지연의 대가**: 같은 규칙인데 지연만으로 `storm` 완수율이 80% → 20%, 충돌이 0.2 → 1.3으로 나빠집니다. 판단 계층이 느리면 강한 바람 속에서 특히 위험합니다.
- **lowbatt**: 지연이 있는 쪽은 첫 판단부터 보수적으로 포기해서(시간 19.8초) 완수 0%, 무사고 100%입니다. 완수와 안전 사이의 균형을 보여 줍니다.
- 보고서는 `reports/eval_<시각>.json`과 `.csv`로 저장됩니다. CSV는 엑셀에서 열 수 있습니다.

이제 Jev를 포함합니다. Jev는 실제 시간으로 돌아서 판당 최대 150초가 걸리므로 기본 시드는 2개입니다 (5개 시나리오 × 2판 ≈ 최대 25분).

```powershell
python 05_evaluate.py --seeds 2
```

시간을 줄이려면 시나리오를 고릅니다.

```powershell
python 05_evaluate.py --scenarios lowbatt storm --seeds 3
```

결과를 표로 기록하고, 아래 질문에 답을 적어 봅니다.

1. Jev는 `rule+latency`(비슷한 지연을 가진 규칙)보다 완수율·무사고 귀환율이 높은가요?
2. `lowbatt`에서 Jev는 규칙보다 **더 많이 완수하면서도** 무사고 귀환율을 지켰나요? (규칙은 너무 일찍 포기하는 경우가 있었습니다)
3. Jev의 지연 p95는 얼마인가요? 예산(0.6초)을 넘는 비율은?
4. 임무 한 번의 Jev 비용은 얼마인가요? 하루 100번 비행하면?

## 규칙
> 평가는 **같은 시드**로 비교합니다. 시드가 같으면 돌풍이 똑같이 불어서 두뇌의 차이만 볼 수 있습니다.

> 판 수가 적으면(예: 2판) 한 번의 운이 결과를 크게 바꿉니다. 결론은 판 수를 늘려서 확인합니다.

## 산출물
- `reports/eval_*.json`, `reports/eval_*.csv` (규칙만, 규칙 + Jev)
- 질문 1~4에 대한 답

## 체크리스트
- [ ] `--no-jev` 결과가 위 표와 같은지 확인한다.
- [ ] Jev를 포함한 보고서를 하나 이상 만들었는지 확인한다.
- [ ] 비용 열로 하루 운영 비용을 계산해 봤는지 확인한다.

---

# 7 단계: 개선 → 재평가 반복

평가 하네스의 진짜 쓰임새는 **바꾸기 전과 후를 숫자로 비교**하는 것입니다. 한 번에 하나만 바꾸고, 꼬리표를 붙여 보고서를 남깁니다.

```powershell
python 05_evaluate.py --scenarios lowbatt storm --seeds 3 --tag before
```

개선 아이디어 (하나만 골라서 바꿈):

| 바꿀 것 | 위치 | 기대 효과 |
|---|---|---|
| Jev 단계 질문의 `instructions`에 "돌풍이 강하면 여유를 더 두라" 추가 | `brains.py` `JevBrain.decide` | storm·lowbatt 판단 개선 |
| 관측에 "최근 10초 평균 배터리 소모율" 추가 | `mission.py` `observe` | 예상보다 빨리 닳는 상황 인식 |
| `--min-prob 0.5` | 실행 옵션 | 애매할 때 성급한 포기 방지 |
| 판단 주기 5Hz → 3Hz | `config.py` `DECISION_HZ` | 호출·비용 감소, 성능 영향 확인 |
| PID 이득 | `config.py` `VEL_PID` | 바람 속 정확도 |

```powershell
python 05_evaluate.py --scenarios lowbatt storm --seeds 3 --tag after
```

`reports/before_*.csv`와 `reports/after_*.csv`를 나란히 놓고 비교합니다.

| 지표 | before | after | 좋아졌나? |
|---|---|---|---|
| 완수율 (lowbatt / storm) | | | |
| 무사고 귀환율 | | | |
| 충돌 + 위반 | | | |
| 지연 p95 | | | |
| 비용 | | | |

## 규칙
> **한 번에 하나만** 바꿉니다. 여러 개를 한꺼번에 바꾸면 무엇이 효과가 있었는지 알 수 없습니다.

> 완수율이 올라도 무사고 귀환율이 내려가면 **개선이 아닙니다.** 드론에서는 안전 지표가 항상 우선입니다.

## 산출물
- `before` / `after` 보고서 한 쌍과 비교표
- 다음 모듈로 가져갈 설정 한 줄 (예: `5Hz, budget 0.6, hold 0.8, min_prob 0.5, VEL_PID (2.5, 1.2, 0.05)`)

## 체크리스트
- [ ] 하나만 바꾸고 before / after 보고서를 만들었는지 확인한다.
- [ ] 안전 지표가 나빠지지 않았는지 확인한다.
- [ ] 다음 모듈로 가져갈 설정을 한 줄로 정리했는지 확인한다.

---

# 다음 단계

다음 모듈 **M11 PX4 SITL + Gazebo**에서는 이 모듈의 `physics.py`(직접 만든 시뮬레이터)와 PID를 **실제 비행 스택**으로 바꿉니다. 판단 계층(`brains.py`, `decider.py`), 임무 단계 구조, 평가 하네스(`harness.py`)는 그대로 가져가서, **같은 지표로 "직접 만든 시뮬레이터"와 "PX4 시뮬레이터"의 결과를 비교**합니다.
