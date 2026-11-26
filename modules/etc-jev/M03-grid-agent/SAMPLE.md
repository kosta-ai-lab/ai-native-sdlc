# 예제 실행 및 프롬프트

GUIDE.md의 흐름에서 명령어와 확인할 결과만 모은 실행용 요약입니다.
개념 설명은 [README.md](README.md), 단계별 설명과 체크리스트는 [GUIDE.md](GUIDE.md)를 참고하세요.

> 준비물: Python 3.10 이상, TypeSafe API 키 (2~3단계와 `05_compare.py --rule-only`는 키 없이 실행 가능)

## 1단계: 실습 폴더 이동, 가상환경, 설치, 키 등록

```powershell
cd C:\Users\user\git\ai-native-sdlc\modules\etc-jev\M03-grid-agent\grid-agent
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

Windows PowerShell:
```powershell
$env:TYPESAFE_API_KEY = "발급받은_키"
```

macOS / Linux:
```bash
export TYPESAFE_API_KEY="발급받은_키"
```

## 2단계: 직접 플레이 (키 필요 없음)

```powershell
python 00_play_manual.py
```

```powershell
python 00_play_manual.py --map trap
```

확인: `w/s/a/d`로 이동, `G`에 닿으면 "성공", 격자 밖으로 가면 "충돌".

## 3단계: 규칙 에이전트 (키 필요 없음)

```powershell
python 01_rule_agent.py --map empty
```

```powershell
python 01_rule_agent.py --map walls
```

```powershell
python 01_rule_agent.py --map trap
```

확인 (실제 결과):

| 지도 | 결과 | 걸음 |
|---|---|---|
| `empty` | 성공 | 8 |
| `walls` | 성공 | 10 |
| `trap` | 시간 초과 | 72 |

## 4단계: Jev 첫 실행

```powershell
python 02_jev_empty.py
```

확인: "성공", 걸음 수 8 근처. `logs/02_jev_empty_<시각>.jsonl`에서 `state`, `probabilities`, `latency_ms` 확인.

## 5단계: 벽, state 설계, 안전 감시

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

```powershell
python 03_jev_walls.py --map trap
```

확인: 실험별 결과·걸음·안전 감시 개입 횟수를 표로 기록. 안전 감시가 개입하면 `안전 감시: 'down' 막힘 → 'right'`처럼 표시됩니다.

## 6단계: 배터리와 복귀 판단

```powershell
python 04_jev_battery.py --battery 30
```

```powershell
python 04_jev_battery.py --battery 18
```

```powershell
python 04_jev_battery.py --battery 24 --wind 0.4
```

```powershell
python 04_jev_battery.py --battery 24 --wind 0.4 --agent rule
```

확인:

| 명령 | 기대 결과 |
|---|---|
| `--battery 30` | 성공 |
| `--battery 18` | 안전 복귀 (출발하지 않음) |
| `--battery 24 --wind 0.4` | 직접 확인 (판단이 어려운 상황) |
| `--battery 24 --wind 0.4 --agent rule` | 배터리 방전 (실제 결과) |

## 7단계: 비교 평가

```powershell
python 05_compare.py
```

키 없이 규칙 에이전트만:
```powershell
python 05_compare.py --rule-only
```

확인: 8개 시나리오 × (rule, jev) 비교표. 규칙 에이전트는 함정에서 시간 초과, 바람 시나리오 3개에서 배터리 방전.

## 자주 나는 오류

| 오류 | 해결 |
|---|---|
| `ModuleNotFoundError: typesafe_sdk` | `(.venv)` 확인 후 `pip install -r requirements.txt` (2~3단계는 SDK 없이도 실행됨) |
| `TypeSafeAuthenticationError` (401) | `$env:TYPESAFE_API_KEY`를 **같은 터미널 창**에서 다시 등록 |
| `TypeSafeRateLimitError` (429) | 잠시 후 재시도. `05_compare.py`는 호출이 많으니 시나리오 수를 줄여서 실행 |
| 한글이 깨짐 | PowerShell에서 `$env:PYTHONIOENCODING = "utf-8"` 실행 후 다시 실행 |
