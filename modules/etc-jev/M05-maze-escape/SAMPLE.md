# 예제 실행 및 프롬프트

GUIDE.md의 흐름에서 명령어와 확인할 결과만 모은 실행용 요약입니다.
개념 설명은 [README.md](README.md), 단계별 설명과 체크리스트는 [GUIDE.md](GUIDE.md)를 참고하세요.

> 준비물: Python 3.10 이상. 1~4단계는 API 키 없이 실행됩니다. 5단계부터 TypeSafe API 키가 필요합니다.
> 시작은 왼쪽 아래, 출구는 오른쪽 위, 좌표는 (행, 열)입니다.

## 1단계: 준비하고 직접 탈출

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

```powershell
python 00_play_manual.py
```

```powershell
python 00_play_manual.py --maze dead_end
```

확인: `w/s/a/d`로 이동, 장애물로 가면 `이동할 수 없는 위치입니다.`와 보상 -10. `basic` 최단은 8턴, 보상 93.

## 2단계: 무작위 에이전트

```powershell
python 01_random_agent.py --runs 100
```

```powershell
python 01_random_agent.py --runs 100 --valid-only
```

확인 (실제 결과, `basic`): 성공률 13% / 평균 보상 -265.0 → `--valid-only`에서 38% / -4.1, 충돌 0.

## 3단계: 규칙 기반 (탐욕법, 우수법)

```powershell
python 02_rule_agents.py --agent greedy --maze dead_end
```

```powershell
python 02_rule_agents.py --agent wall --maze dead_end
```

확인 (실제 결과): 탐욕법은 최대 턴 초과 ((0, 2)와 (1, 2) 사이 왕복), 우수법은 18턴에 탈출.

## 4단계: 탐색 (BFS)

```powershell
python 03_bfs_agent.py --maze dead_end
```

```powershell
python 03_bfs_agent.py --maze large
```

확인 (실제 결과): `dead_end` 14턴 / 보상 87, `large` 12턴 / 보상 89 (각 미로의 만점).

## 5단계: Jev 1 — 전체 관측과 행동 마스킹 (API 키 필요)

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

```powershell
python 04_jev_agent.py --maze dead_end --view full --no-mask
```

```powershell
python 04_jev_agent.py --maze large --view full
```

확인: 마스킹을 켜면 충돌 0, 갈 곳이 하나뿐인 턴은 `갈 곳이 하나뿐이라 Jev에게 묻지 않음`. 결과를 만점(BFS)과 비교.

## 6단계: Jev 2 — 부분 관측과 확률 기반 대체

```powershell
python 04_jev_agent.py --maze dead_end --view local
```

```powershell
python 04_jev_agent.py --maze large --view local
```

```powershell
python 04_jev_agent.py --maze large --view local --fallback 0.6
```

```powershell
python 04_jev_agent.py --maze large --view local --fallback 0.9
```

확인: `--fallback`을 켜면 Jev가 애매한 턴에 `Jev는 ...로 애매 → 우수법으로 대체`가 나오고, 결과에 `우수법 대체: N회`가 표시됨. 기준을 높이면 대체 횟수가 늘어남.

## 7단계: 정책 비교

```powershell
python 05_compare.py
```

키 없이:
```powershell
python 05_compare.py --no-jev
```

확인 (실제 결과, Jev 제외):

| 미로 | random | greedy | wall | bfs |
|---|---|---|---|---|
| `basic` | 실패 (-266) | 8턴 (93) | 12턴 (89) | 8턴 (93) |
| `dead_end` | 실패 (-284) | 실패 (-50) | 18턴 (83) | 14턴 (87) |
| `large` | 실패 (-566) | 실패 (-98) | 14턴 (87) | 12턴 (89) |

Jev를 포함하면 `jev-full`, `jev-local`, `jev-local-fb` 결과가 미로마다 추가됩니다.

## 자주 나는 오류

| 오류 | 해결 |
|---|---|
| `ModuleNotFoundError: typesafe_sdk` | 5단계부터 필요. `(.venv)` 확인 후 `pip install -r requirements.txt` |
| `TypeSafeAuthenticationError` (401) | `$env:TYPESAFE_API_KEY`를 **같은 터미널 창**에서 다시 등록 |
| `TypeSafeRateLimitError` (429) | 잠시 후 재시도. `05_compare.py`는 호출이 많으니 `04_jev_agent.py`로 하나씩 실행 |
| 한글이 깨짐 | PowerShell에서 `$env:PYTHONIOENCODING = "utf-8"` 실행 후 다시 실행 |
