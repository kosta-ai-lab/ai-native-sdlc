# 개념

**Jev**는 문장을 만드는 LLM이 아니라, **미리 정해 준 선택지 중에서 결정하고 그 확률을 함께 돌려주는 모델**입니다. 코드 안의 `if` 조건을 사람이 규칙으로 적는 대신 Jev에게 묻는다고 생각하면 됩니다.
이 가이드에서는 아래 네 가지만 알면 충분합니다. 자세한 개념은 [README.md](README.md)를 참고하세요.

| 용어 | 한 줄 설명 |
|---|---|
| `state` | Jev가 보고 판단할 입력 (문자열, dict, list) |
| `questions` | 묻고 싶은 질문들. `{"내가 붙인 이름": 질문}` 형태로, 결과도 그 이름으로 꺼냄 |
| Choice / Score / Noul | 선택지 고르기 / 기준표의 몇 단계인가 / 이 문장이 참인가 |
| 확률·신뢰도 | 답이 얼마나 확실한지. 높으면 자동 처리, 애매하면 사람에게 넘김 |

> 이 가이드는 공식 문서(docs.typesafe.ai, 2026-11-25 확인)와 `jev-latest` 모델을 기준으로 작성했습니다. Jev는 얼리 액세스 단계라 API·출력 값이 바뀔 수 있습니다.

---

# 1 단계: 준비하기

필요한 것은 세 가지입니다.

- **Python 3.10 이상**
- **TypeSafe 얼리 액세스 승인** — [typesafe.ai](https://typesafe.ai)에서 대기 목록에 등록하고, 승인 메일을 기다립니다.
- **API 키** — 승인 후 [console.typesafe.ai/keys](https://console.typesafe.ai/keys)에서 발급합니다.

터미널(Windows는 PowerShell)을 열고 Python 버전을 확인합니다.

Windows:
```powershell
py --version
```

macOS / Linux:
```bash
python3 --version
```

API 키는 콘솔에서 **Create key**(키 만들기)를 눌러 만들고, 화면에 나온 키를 복사해 둡니다. 키는 보통 만들 때 한 번만 보여 주니 안전한 곳에 저장하세요.

## 규칙
> **API 키는 비밀번호와 같습니다.** 코드 파일에 직접 적거나, git에 커밋하거나, 채팅·스크린샷으로 공유하지 마세요. 이 실습에서는 **환경 변수**로만 넘깁니다.

> Python이 없다면 [python.org](https://www.python.org/downloads/)에서 설치합니다. Windows 설치 화면에서 **"Add python.exe to PATH"**를 꼭 체크하세요.

## 산출물
- 발급받은 API 키 (내 컴퓨터에만 보관)

## 체크리스트
- [ ] `py --version`(또는 `python3 --version`)이 3.10 이상인지 확인한다.
- [ ] 콘솔에서 API 키를 발급받아 안전한 곳에 보관했는지 확인한다.

---

# 2 단계: 실습 폴더와 가상환경 만들기

이 모듈 폴더의 `ticket-router/`가 실습 폴더입니다. 터미널에서 그 폴더로 이동합니다.

```powershell
cd C:\Users\user\git\ai-native-sdlc\modules\etc-jev\M01-basics\ticket-router
```

폴더 안에는 이런 파일이 미리 들어 있습니다.

```
ticket-router/
├── requirements.txt        # 설치할 패키지: typesafe-sdk
├── 00_check_setup.py       # 3단계: 환경 확인
├── 01_hello_choice.py      # 4단계: 첫 질문
├── 02_three_questions.py   # 5단계: 질문 3종
├── 03_smart_if.py          # 6단계: 똑똑한 if문
└── tickets.json            # 6단계에서 쓰는 고객 문의 6개
```

**가상환경**(이 프로젝트 전용 Python 공간)을 만들고 켭니다.

Windows PowerShell:
```powershell
py -m venv .venv
```

```powershell
.venv\Scripts\Activate.ps1
```

macOS / Linux:
```bash
python3 -m venv .venv
```

```bash
source .venv/bin/activate
```

켜지면 프롬프트 앞에 `(.venv)`가 붙습니다. 이제 SDK를 설치합니다.

```powershell
pip install -r requirements.txt
```

설치를 확인합니다.

```powershell
pip show typesafe-sdk
```

## 규칙
> PowerShell에서 `Activate.ps1`을 실행할 때 **"스크립트를 실행할 수 없습니다"** 오류가 나면, 현재 창에서만 실행을 허용합니다.
> `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` 를 실행한 뒤 다시 `.venv\Scripts\Activate.ps1`을 실행하세요.

> 새 터미널을 열 때마다 가상환경을 **다시 켜야** 합니다. 프롬프트 앞에 `(.venv)`가 있는지 항상 확인하세요.

> `uv`를 쓴다면 `uv venv` 와 `uv pip install -r requirements.txt`로 대신할 수 있습니다.

## 산출물
- `ticket-router/.venv/` 폴더 (`.gitignore`에 들어 있어 커밋되지 않음)
- 가상환경에 설치된 `typesafe-sdk`

## 체크리스트
- [ ] 프롬프트 앞에 `(.venv)`가 보이는지 확인한다.
- [ ] `pip show typesafe-sdk`가 이름과 버전을 출력하는지 확인한다.

---

# 3 단계: API 키 등록하고 연결 확인하기

SDK는 **`TYPESAFE_API_KEY`** 환경 변수에서 키를 자동으로 읽습니다. 1단계에서 받은 키를 넣습니다.

Windows PowerShell:
```powershell
$env:TYPESAFE_API_KEY = "발급받은_키"
```

macOS / Linux:
```bash
export TYPESAFE_API_KEY="발급받은_키"
```

확인 스크립트를 실행합니다.

```powershell
python 00_check_setup.py
```

이 스크립트는 세 가지를 차례로 확인합니다.

1. `TYPESAFE_API_KEY`가 있는지
2. `typesafe_sdk`를 불러올 수 있는지
3. 서버에 접속해 **사용할 수 있는 모델 목록**(`client.models.list()`)을 받아 오는지

성공하면 이렇게 나옵니다 (모델 목록 모양은 SDK 버전에 따라 다를 수 있습니다).

```
[O] API 키를 찾았습니다. (앞 4글자: xxxx...)
[O] typesafe-sdk를 불러왔습니다.
[O] 서버에 접속했습니다. 사용할 수 있는 모델:
...  (jev-latest 등이 보임)

준비 완료! 다음은 01_hello_choice.py 입니다.
```

## 규칙
> `$env:...`로 넣은 값은 **그 터미널 창에서만** 유지됩니다. 창을 닫으면 다시 넣어야 합니다.

> 자주 쓰는 오류와 원인:
>
> | 오류 | 원인 | 해결 |
> |---|---|---|
> | `TypeSafeAuthenticationError` (401) | 키가 틀렸거나 만료됨 | 콘솔에서 키를 다시 확인·발급 |
> | `TypeSafeRateLimitError` (429) | 너무 자주 호출함 | 잠시 기다렸다 재시도 (SDK가 기본으로 자동 재시도함) |
> | `TypeSafeAPIConnectionError` | 인터넷·방화벽 문제 | 네트워크 확인 |
> | `ModuleNotFoundError: typesafe_sdk` | 가상환경이 꺼져 있음 | `(.venv)` 확인 후 다시 실행 |

## 산출물
- 없음 (환경 확인만 합니다)

## 체크리스트
- [ ] `00_check_setup.py`가 `[O]` 세 줄과 "준비 완료!"를 출력하는지 확인한다.
- [ ] 모델 목록에 `jev-latest`(또는 `jev-`로 시작하는 모델)가 있는지 확인한다.

---

# 4 단계: 첫 질문 — Choice로 문의 분류하기

`01_hello_choice.py`를 열어 봅니다. 핵심은 이 부분입니다.

```python
from typesafe_sdk import Choice, TypeSafeClient

ticket = "The sneakers I bought last week are too small. I'd like to return them."

with TypeSafeClient(model="jev-latest") as client:  # TYPESAFE_API_KEY를 자동으로 읽음
    response = client.system_one(
        state=ticket,                       # ① 판단할 입력
        questions={
            "department": Choice(           # ② 내가 붙인 질문 이름
                instructions="Which team should handle this",   # ③ 질문
                criteria={                                      # ④ 선택지: 설명
                    "billing": "Payment or subscription issues",
                    "returns": "Returns, exchanges or refunds for products",
                    "technical": "Bugs or website/app problems",
                },
            ),
        },
    )

answer = response.choices["department"]     # ⑤ 이름으로 결과 꺼내기
```

| 번호 | 의미 |
|---|---|
| ① `state` | Jev가 읽을 입력. 여기서는 고객 문의 한 줄 |
| ② `"department"` | 질문에 붙인 이름. 아무 이름이나 되고, ⑤에서 같은 이름으로 꺼냄 |
| ③ `instructions` | 무엇을 판단할지 |
| ④ `criteria` | 선택지 이름과 설명. **설명을 구체적으로 쓸수록** 결과가 좋아짐 |
| ⑤ `response.choices[...]` | Choice 결과. Score는 `response.scores`, Noul은 `response.nouls` |

실행합니다.

```powershell
python 01_hello_choice.py
```

예상 출력 (값은 모델 버전에 따라 조금 다를 수 있습니다):

```
선택한 팀    : returns
신뢰도       : 1.0
선택지별 확률: {'billing': 0.0, 'returns': 1.0, 'technical': 0.0}
사용 모델    : jev-1.14.0
사용 토큰    : ...
```

**직접 해 보기**
1. `ticket`을 `"My card was charged twice."`로 바꿔 실행하고 `billing`이 나오는지 봅니다.
2. `"The app crashes when I try to start a return."`처럼 **두 팀에 걸친 문의**를 넣고 확률이 어떻게 나뉘는지 봅니다.
3. `criteria`에 `"shipping": "Delivery delays or tracking"`을 추가해 봅니다.

## 규칙
> 결과는 **반드시 `criteria`에 적은 이름 중 하나**입니다. `if answer.choice == "returns":`처럼 문자열을 그대로 비교해도 안전합니다. LLM처럼 대소문자나 마침표를 걱정할 필요가 없습니다.

> "해당 없음(none of the above)" 같은 선택지는 잘 동작하지 않을 수 있다고 문서에 나와 있습니다. 그런 경우는 별도의 **Noul 질문**("이 문의는 위 팀 중 하나에 해당한다")으로 따로 묻는 것을 권장합니다.

> `instructions`와 `criteria`는 문서 예제처럼 **영어**로 쓰는 것을 기본으로 합니다. 한국어도 넣을 수 있지만 결과 품질은 직접 확인해야 합니다 (6단계에서 한국어 문의로 시험합니다).

## 산출물
- `01_hello_choice.py` 실행 결과 (팀 이름, 신뢰도, 확률)

## 체크리스트
- [ ] 출력된 팀 이름이 `criteria`의 이름 중 하나인지 확인한다.
- [ ] 선택지별 확률을 더하면 약 1이 되는지 확인한다.
- [ ] 문의 문장을 바꿨을 때 결과가 달라지는 것을 확인한다.

---

# 5 단계: 질문 3종 — Choice, Score, Noul 한 번에 묻기

`02_three_questions.py`는 **공식 Quickstart와 같은 입력**을 씁니다. 그래서 결과를 문서의 예시와 비교할 수 있습니다.

```python
questions={
    "department": Choice(               # 어느 팀?
        instructions="Which team should handle this",
        criteria={"billing": "...", "technical": "...", "sales": "..."},
    ),
    "frustration": Score(               # 얼마나 화났나? (0~2단계)
        instructions="How frustrated the customer appears",
        criteria=[
            "Calm, just stating facts",        # 0단계
            "Frustrated but civil",            # 1단계
            "Very angry, strong language",     # 2단계
        ],
    ),
    "is_urgent": Noul(                  # 긴급한가? (참일 확률)
        instructions="The message conveys urgency or time-sensitivity",
    ),
}
```

세 질문은 **한 번의 호출**로 보내고, Jev가 **병렬로** 평가합니다.

```powershell
python 02_three_questions.py
```

예상 출력 (문서 예시 값 기준):

```
[Choice] 담당 팀 : technical (신뢰도 1.00)
[Score ] 불만 정도: 0.59 / 2 (0~1로 환산 0.29, 신뢰도 0.38)
[Noul  ] 긴급 여부: 0.99
```

결과 읽는 법:
- **technical**: "500 에러, 연동 문제"이므로 기술팀. 확률이 한쪽에 몰려 신뢰도 1.0.
- **0.59 / 2**: 0단계(차분함) 41%, 1단계(불만이지만 정중함) 59%의 가중 평균. 즉 "약간 불만". 신뢰도 0.38은 두 단계 사이에서 꽤 갈렸다는 뜻입니다.
- **0.99**: "20분째 주문을 못 받고 있다" → 거의 확실히 긴급.

## 규칙
> **Score는 0~1이 아닙니다.** `0 ~ (단계 수 - 1)` 범위입니다. 기준값과 비교하기 전에 `score / (단계 수 - 1)`로 0~1로 바꾸거나, 단계 번호 기준으로 비교하세요.

> Score 기준표는 **낮은 단계 → 높은 단계 순서**로 적고, 2단계 이상 10단계 이하로 만듭니다.

> 결과 값은 Jev 버전이 바뀌면 달라질 수 있습니다. 숫자가 문서와 조금 달라도 **방향**(technical / 약간 불만 / 긴급)이 같으면 정상입니다.

## 산출물
- `02_three_questions.py` 실행 결과 (세 질문의 답)

## 체크리스트
- [ ] 세 결과가 문서 예시(`technical` / `0.59` / `0.99`)와 같거나 비슷한지 확인한다.
- [ ] Score 값이 `0 ~ 2` 범위에 있는지 확인한다.
- [ ] Noul 결과에는 신뢰도(confidence)가 없다는 것을 확인한다.

---

# 6 단계: 똑똑한 if문 — 확률로 분기하는 라우터

이제 Jev의 결과로 **실제 처리 방법을 정하는** 코드를 만듭니다. `03_smart_if.py`는 `tickets.json`의 문의 6개(영어 4개, 한국어 2개)를 차례로 Jev에게 묻고, 아래 규칙으로 분기합니다.

```python
AUTO_ROUTE_MIN_PROB = 0.67   # 고른 팀의 확률이 이 값 이상이면 자동 배정
URGENT_YES = 0.7             # Noul이 0.7 이상이면 '예'
URGENT_NO = 0.3              # 0.3 이하면 '아니오', 그 사이는 애매함

def decide(dept, urgent_prob):
    team_prob = dept.probabilities[dept.choice]
    if urgent_prob >= URGENT_YES:
        return "urgent", f"{dept.choice} 팀 긴급 호출"
    if team_prob >= AUTO_ROUTE_MIN_PROB:
        return "auto", f"{dept.choice} 팀에 자동 배정"
    return "human", "상담원이 직접 확인"
```

기준값 0.67, 0.7, 0.3은 공식 문서(`/confidence`)가 제시한 **출발점**입니다.

```powershell
python 03_smart_if.py
```

출력 형태 (아래 숫자는 모양을 보여 주기 위한 **예시**입니다. 실제 값은 실행해서 확인하세요):

```
#1 I was charged twice for my subscription this month. Please r
   팀=billing (확률 0.99), 긴급=0.12
   → [auto] billing 팀에 자동 배정

#2 Our API integration started returning 500 errors on every re
   팀=technical (확률 1.00), 긴급=0.99
   → [urgent] technical 팀 긴급 호출

#4 Hi, just wondering how things are going.
   팀=sales (확률 0.41), 긴급=0.03
   → [human] 상담원이 직접 확인
...
```

#4처럼 **어느 팀에도 딱 맞지 않는 문의**는 확률이 퍼지고, 자동 처리되지 않고 사람에게 갑니다. 이것이 확률을 함께 주는 모델의 장점입니다.

**직접 해 보기**
1. `AUTO_ROUTE_MIN_PROB`를 `0.9`로 올리면 `human`으로 가는 문의가 늘어나는지 봅니다.
2. `tickets.json`에 내가 만든 문의를 추가합니다 (JSON 배열이므로 쉼표를 잊지 마세요).
3. 한국어 문의(#5, #6)가 영어 문의(#1, #2)와 비슷한 결과를 내는지 비교합니다.
4. `QUESTIONS`에 Score 질문(불만 정도)을 추가하고, "매우 화남이면 팀장에게 알림" 분기를 만들어 봅니다.

## 규칙
> **기준값은 정답이 아니라 출발점입니다.** 문서도 "보수적인 기준값으로 시작하고, 내 데이터로 시험하라"고 권합니다. 잘못 처리했을 때 손해가 큰 작업(환불, 계정 정지 등)일수록 기준값을 높입니다 (문서 예: 0.93).

> 자동 처리되지 않은 문의는 **반드시 사람이 볼 수 있는 경로**(`human`)로 보냅니다. Jev가 "모르겠다"고 말할 수 있다는 점을 활용하는 것이 핵심입니다.

> 문의 하나에 질문 여러 개는 **한 번의 호출**로 묻습니다. 질문마다 따로 호출하면 느리고 토큰도 더 씁니다.

## 산출물
- `03_smart_if.py` 실행 결과 (문의별 팀·확률·처리 방법)
- 내가 추가한 문의가 들어간 `tickets.json` (선택)

## 체크리스트
- [ ] 6개 문의가 모두 `urgent` / `auto` / `human` 중 하나로 분기되는지 확인한다.
- [ ] 애매한 문의(#4)가 `human`으로 가는지 확인한다.
- [ ] 기준값을 바꿨을 때 분기 결과가 달라지는 것을 확인한다.

---

# 7 단계: (선택) SDK 없이 Raw HTTP로 호출하기

SDK가 내부에서 하는 일은 결국 **HTTP POST 한 번**입니다. 직접 호출해 보면 요청·응답 JSON 구조를 정확히 이해할 수 있습니다.

| 항목 | 값 |
|---|---|
| 주소 | `POST https://api.typesafe.ai/v1/systemone` |
| 헤더 | `Authorization: Bearer <API_KEY>`, `Content-Type: application/json` |
| 본문 | `state`, `model`, `questions` |

PowerShell에서 실행합니다 (3단계에서 `$env:TYPESAFE_API_KEY`를 넣은 창에서).

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

macOS / Linux (curl):
```bash
curl -s https://api.typesafe.ai/v1/systemone \
  -H "Authorization: Bearer $TYPESAFE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"state":"I was charged twice for my subscription this month.","model":"jev-latest","questions":{"department":{"type":"choice","instructions":"Which team should handle this","criteria":{"billing":"Payment or subscription issues","technical":"Bugs or integration problems","sales":"Pricing or account questions"}},"is_urgent":{"type":"noul","instructions":"The message conveys urgency or time-sensitivity"}}}'
```

응답은 이런 구조입니다 (숫자는 **예시**).

```json
{
  "model": "jev-1.14.0",
  "answers": {
    "department": {
      "type": "choice",
      "choice": "billing",
      "confidence": 1.0,
      "probabilities": { "billing": 1.0, "technical": 0.0, "sales": 0.0 }
    },
    "is_urgent": { "type": "noul", "noul": 0.1 }
  },
  "usage": { "input_tokens": 120, "output_tokens": 20 }
}
```

- `answers` 아래에 **내가 붙인 질문 이름** 그대로 결과가 들어 있습니다.
- `usage.output_tokens`는 현재 **과금되지 않습니다** (입력 토큰만 과금).

## 규칙
> 명령어 기록이나 스크립트에 키를 직접 적지 말고 `$env:TYPESAFE_API_KEY`처럼 **환경 변수로 참조**하세요.

> 실제 서비스 코드에서는 Raw HTTP보다 **SDK를 쓰는 것을 권장**합니다. SDK는 재시도, 오류 분류, 타입 변환을 자동으로 해 줍니다.

## 산출물
- Raw HTTP 응답 JSON

## 체크리스트
- [ ] 응답에 `model`, `answers`, `usage` 세 항목이 있는지 확인한다.
- [ ] `answers` 아래의 이름이 요청에서 붙인 질문 이름과 같은지 확인한다.

---

# 다음 단계

- **내 문제에 적용하기**: 내 업무에서 "사람이 규칙으로 판단하던 if문"을 하나 찾아 Choice/Noul 질문으로 바꿔 봅니다. (예: 코드 리뷰 코멘트 분류, 로그 경보 등급, 테스트 실패 원인 분류)
- **LLM과 비교하기**: [system-one-adapter-python](https://github.com/typesafe-ai/system-one-adapter-python)은 같은 인터페이스로 OpenAI·Anthropic·Gemini 모델을 호출합니다. 같은 문의를 넣고 속도·결과를 Jev와 비교해 봅니다.
- **문서 더 읽기**: 이미지 입력(`Box`), 비동기 클라이언트(`AsyncTypeSafeClient`), 재시도 정책(`RetryPolicy`)은 docs.typesafe.ai에 있습니다.
