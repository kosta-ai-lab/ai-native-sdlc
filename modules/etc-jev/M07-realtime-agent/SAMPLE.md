# 예제 실행 및 프롬프트

GUIDE.md의 흐름에서 명령어와 확인할 결과만 모은 실행용 요약입니다.
개념 설명은 [README.md](README.md), 단계별 설명과 체크리스트는 [GUIDE.md](GUIDE.md)를 참고하세요.

> 준비물: Python 3.10 이상. 1~4단계와 6단계 앞부분은 API 키 없이 실행됩니다. 5단계부터 TypeSafe API 키가 필요합니다.
> 화면 창에서 `ESC`로 끝냅니다. 창이 응답하지 않으면 터미널에서 `Ctrl + C`.

## 1단계: 준비하고 직접 조종

```powershell
cd C:\Users\user\git\ai-native-sdlc\modules\etc-jev\M07-realtime-agent\drone-game
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
python 00_play_manual.py
```

```powershell
python 00_play_manual.py --no-safety
```

확인: 방향키로 비행, 키를 떼면 조금 미끄러진 뒤 멈춤(관성). 안전 감시를 켜면 장애물 앞에서 멈춰 섬.

## 2단계: 규칙 두뇌와 세 가지 주기

```powershell
python 01_rule_brain.py
```

```powershell
python 01_rule_brain.py --decision-hz 1
```

```powershell
python 01_rule_brain.py --headless --decision-hz 20
```

확인 (실제 결과, `moving`): 1Hz 21.9초 / 22회, 5Hz 19.1초 / 96회, 20Hz 18.9초 / 378회. 화면 FPS는 항상 60 근처.

## 3단계: 동기 vs 비동기

```powershell
python 02_latency_sync.py --mode sync
```

```powershell
python 02_latency_sync.py --mode async
```

확인 (실제 측정): sync 평균 18FPS(끊기고 점프), async 61FPS(부드러움).

## 4단계: 지연 시간 예산과 이전 행동 유지

```powershell
python 03_latency_policies.py
```

```powershell
python 03_latency_policies.py --watch budget+hold
```

확인 (실제 결과, `moving` 30판 평균, 1분 안팎): 충돌 sync 2.2 → async 1.4 → budget 1.3 → **budget+hold 1.0**, 안전 감시 개입 15.7 → 7.9 (async → budget+hold). 화면에서 `status`가 FRESH → HOLD → LATE → TIMEOUT으로 바뀜.

## 5단계: Jev 두뇌 (API 키 필요)

Windows PowerShell:
```powershell
$env:TYPESAFE_API_KEY = "발급받은_키"
```

macOS / Linux:
```bash
export TYPESAFE_API_KEY="발급받은_키"
```

```powershell
python 04_jev_brain.py
```

```powershell
python 04_jev_brain.py --mode sync
```

```powershell
python 04_jev_brain.py --decision-hz 2
```

확인: async에서 FPS 60 유지, 결과에 실제 평균·최대 지연 표시, `logs/04_jev_*.jsonl`에 `age_s`, `api_ms`, `state` 기록.

## 6단계: 신뢰도가 낮으면 안전 행동

키 없이 먼저:
```powershell
python 05_low_confidence.py
```

확인 (실제 결과, 30판 평균): min_prob 0.55에서 점수 410 → 460, 시간 36.3 → 31.6초, 안전 감시 개입 13.0 → 5.4. 0.9에서는 수집 1.3개로 드론이 얼어붙음.

Jev로:
```powershell
python 04_jev_brain.py --min-prob 0.5
```

```powershell
python 04_jev_brain.py --min-prob 0.7
```

```powershell
python 04_jev_brain.py --level dense --min-prob 0.5
```

## 7단계: 종합 비교

```powershell
python 06_compare.py
```

키 없이:
```powershell
python 06_compare.py --no-jev
```

확인 (실제 결과, Jev 제외): 지연 없는 규칙은 세 레벨 모두 약 19~25초에 수집 완료, 지연 0.3초 + budget/hold 규칙은 약 34~39초 (레벨마다 한 판이라 운의 영향이 큼). Jev를 포함하면 레벨마다 Jev 두 줄 추가.

## 자주 나는 오류

| 오류 | 해결 |
|---|---|
| `ModuleNotFoundError: pygame` | `(.venv)` 확인 후 `pip install -r requirements.txt` |
| `pygame` 설치 실패 | 최신 Python에서는 `pygame` 대신 `pygame-ce`를 씁니다 (requirements에 이미 반영) |
| `ModuleNotFoundError: typesafe_sdk` | 5단계부터 필요. `pip install -r requirements.txt` |
| `TypeSafeAuthenticationError` (401) | `$env:TYPESAFE_API_KEY`를 **같은 터미널 창**에서 다시 등록 |
| `TypeSafeRateLimitError` (429) | `--decision-hz 2`로 요청 수를 줄여서 실행 |
| 한글이 깨짐 | PowerShell에서 `$env:PYTHONIOENCODING = "utf-8"` 실행 후 다시 실행 |
