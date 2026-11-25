# 예제 실행 및 프롬프트

GUIDE.md의 흐름에서 명령어와 확인할 결과만 모은 실행용 요약입니다.
개념 설명과 체크리스트는 [GUIDE.md](GUIDE.md)를 참고하세요.

> 준비물: Python 3.10 이상, TypeSafe 얼리 액세스 승인, API 키 ([console.typesafe.ai/keys](https://console.typesafe.ai/keys))

## 1단계: 실습 폴더로 이동

```powershell
cd C:\Users\user\git\ai-native-sdlc\modules\etc-jev\M01-basics\ticket-router
```

## 2단계: 가상환경 만들고 SDK 설치

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

> `Activate.ps1` 실행이 막히면 `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` 후 다시 실행합니다.

## 3단계: API 키 등록 후 연결 확인

Windows PowerShell:
```powershell
$env:TYPESAFE_API_KEY = "발급받은_키"
```

macOS / Linux:
```bash
export TYPESAFE_API_KEY="발급받은_키"
```

```powershell
python 00_check_setup.py
```

확인: `[O]` 세 줄과 `준비 완료!`가 나오면 성공입니다.

## 4단계: 첫 질문 (Choice)

```powershell
python 01_hello_choice.py
```

확인: `선택한 팀 : returns`, 선택지별 확률의 합이 약 1.

## 5단계: 질문 3종 (Choice + Score + Noul)

```powershell
python 02_three_questions.py
```

확인: 공식 문서 예시와 비교합니다.

| 질문 | 문서 예시 값 | 의미 |
|---|---|---|
| `department` (Choice) | `technical` | 기술팀 담당 |
| `frustration` (Score) | `0.59` (범위 0~2) | 약간 불만 |
| `is_urgent` (Noul) | `0.99` | 거의 확실히 긴급 |

## 6단계: 똑똑한 if문 라우터

```powershell
python 03_smart_if.py
```

확인: 6개 문의가 각각 `[urgent]` / `[auto]` / `[human]` 중 하나로 분기되고, 애매한 문의(#4 "Hi, just wondering...")는 `[human]`으로 갑니다.

바꿔 볼 것:
- `03_smart_if.py`의 `AUTO_ROUTE_MIN_PROB`를 `0.9`로 올리고 다시 실행
- `tickets.json`에 문의 추가 후 다시 실행

## 7단계 (선택): Raw HTTP 호출

Windows PowerShell:
```powershell
$body = @{
  state     = "I was charged twice for my subscription this month."
  model     = "jev-latest"
  questions = @{
    department = @{
      type         = "choice"
      instructions = "Which team should handle this"
      criteria     = @{ billing = "Payment or subscription issues"; technical = "Bugs or integration problems"; sales = "Pricing or account questions" }
    }
    is_urgent = @{ type = "noul"; instructions = "The message conveys urgency or time-sensitivity" }
  }
} | ConvertTo-Json -Depth 10
$res = Invoke-RestMethod -Method Post -Uri "https://api.typesafe.ai/v1/systemone" -Headers @{ Authorization = "Bearer $env:TYPESAFE_API_KEY" } -ContentType "application/json" -Body $body
$res | ConvertTo-Json -Depth 10
```

macOS / Linux:
```bash
curl -s https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"state":"I was charged twice for my subscription this month.","model":"jev-latest","questions":{"department":{"type":"choice","instructions":"Which team should handle this","criteria":{"billing":"Payment or subscription issues","technical":"Bugs or integration problems","sales":"Pricing or account questions"}},"is_urgent":{"type":"noul","instructions":"The message conveys urgency or time-sensitivity"}}}'
```

확인: 응답 JSON에 `model`, `answers`(`department`, `is_urgent`), `usage`가 있습니다.

## 자주 나는 오류

| 오류 | 해결 |
|---|---|
| `ModuleNotFoundError: typesafe_sdk` | 프롬프트에 `(.venv)`가 있는지 확인하고 `pip install -r requirements.txt` |
| `TYPESAFE_API_KEY 환경 변수가 없습니다` | 3단계의 `$env:TYPESAFE_API_KEY = ...`를 **같은 터미널 창**에서 다시 실행 |
| `TypeSafeAuthenticationError` (401) | 키 오타 또는 만료. 콘솔에서 확인 |
| `TypeSafeRateLimitError` (429) | 잠시 후 재시도 |
