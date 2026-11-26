# 예제 실행 및 프롬프트

GUIDE.md의 흐름에서 명령어와 확인할 결과만 모은 실행용 요약입니다.
개념 설명은 [README.md](README.md), 단계별 설명과 체크리스트는 [GUIDE.md](GUIDE.md)를 참고하세요.

> 준비물: Python 3.10 이상. 1~4단계와 `05_evaluate.py --no-jev`는 API 키 없이 실행됩니다. 5단계부터 TypeSafe API 키가 필요합니다.
> 화면 창: 방향키 이동, `R` 복귀, `L` 그 자리 착륙, `ESC` 종료. 창이 응답하지 않으면 터미널에서 `Ctrl + C`.

## 1단계: 준비하고 직접 비행

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

```powershell
python 00_fly_manual.py
```

```powershell
python 00_fly_manual.py --scenario windy
```

```powershell
python 00_fly_manual.py --scenario nofly --no-safety
```

확인: 자동 이륙 → 방향키 비행 → `R`로 복귀·자동 착륙. `windy`에서 키를 떼도 크게 떠밀리지 않음. 안전 감시를 끄고 금지 구역에 들어가면 위반 기록.

## 2단계: PID 맞추기

```powershell
python 01_pid_tuning.py
```

```powershell
python 01_pid_tuning.py --kp 8 --ki 3 --kd 0.1
```

확인 (실제 결과): 바람 속 20초 떠밀림 P 5.44m → PI 0.69m → PID 0.69m. P만으로는 2m/s에 도달 못 함(1.61m/s).

## 3단계: 임무 단계와 규칙 두뇌

```powershell
python 02_mission_rule.py
```

```powershell
python 02_mission_rule.py --scenario lowbatt --headless
```

확인 (실제 결과, `calm`): 36.2초, 경유지 2/2, 배터리 78.8%, `TAKEOFF → TRANSIT → ... → RETURN → LAND → LANDED`. `lowbatt`는 시드에 따라 완수 또는 중간 포기.

## 4단계: 안전 감시 계층

```powershell
python 03_safety_layer.py
```

```powershell
python 03_safety_layer.py --watch nofly
```

확인 (실제 결과, 10판): `nofly`에서 부주의한 두뇌의 위반 2.0 → 안전 감시로 0, 대신 150초 동안 갇힘. `storm`에서 부주의한 두뇌 + 안전 감시는 326번 개입하며 충돌 2.3. 신중한 두뇌는 개입 0.1~3.6회.

## 5단계: 판단 계층에 Jev (API 키 필요)

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

확인: 결과에 단계 기록, 지연 p95, 입력 토큰·비용 표시. `logs/04_jev_*.jsonl`에 단계·방향 확률과 관측 기록.

## 6단계: 평가 하네스

키 없이:
```powershell
python 05_evaluate.py --no-jev
```

확인 (실제 결과, 10판): `calm` rule 100% / rule+latency 80%, `storm` rule 80% / rule+latency 20%, `lowbatt` rule 완수 20%·무사고 90%. 보고서가 `reports/eval_*.json`, `.csv`로 저장됨.

Jev 포함 (판당 최대 150초):
```powershell
python 05_evaluate.py --seeds 2
```

```powershell
python 05_evaluate.py --scenarios lowbatt storm --seeds 3
```

## 7단계: 개선 → 재평가

```powershell
python 05_evaluate.py --scenarios lowbatt storm --seeds 3 --tag before
```

(한 가지만 바꾼 뒤)

```powershell
python 05_evaluate.py --scenarios lowbatt storm --seeds 3 --tag after
```

확인: `reports/before_*.csv`와 `reports/after_*.csv` 비교. 안전 지표(무사고 귀환율, 충돌·위반)가 나빠지지 않았는지 먼저 확인.

## 자주 나는 오류

| 오류 | 해결 |
|---|---|
| `ModuleNotFoundError: pygame` | `(.venv)` 확인 후 `pip install -r requirements.txt` (최신 Python은 `pygame-ce` 사용) |
| `ModuleNotFoundError: typesafe_sdk` | 5단계부터 필요. `pip install -r requirements.txt` |
| `TypeSafeAuthenticationError` (401) | `$env:TYPESAFE_API_KEY`를 **같은 터미널 창**에서 다시 등록 |
| `TypeSafeRateLimitError` (429) | `config.py`의 `DECISION_HZ`를 낮추거나 `--seeds`를 줄여서 실행 |
| 한글이 깨짐 | PowerShell에서 `$env:PYTHONIOENCODING = "utf-8"` 실행 후 다시 실행 |
