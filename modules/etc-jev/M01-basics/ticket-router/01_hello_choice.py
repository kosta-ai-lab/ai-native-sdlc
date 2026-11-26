"""1단계: 가장 간단한 Jev 호출 — 문의 하나를 담당 팀으로 분류(Choice)합니다."""
from typesafe_sdk import Choice, TypeSafeClient

# Jev에게 보여 줄 입력(state). 문자열, dict, list 모두 됩니다.
ticket = "The sneakers I bought last week are too small. I'd like to return them."

with TypeSafeClient(model="jev-latest") as client:  # TYPESAFE_API_KEY를 자동으로 읽음
    response = client.system_one(
        state=ticket,
        questions={
            # "department"는 내가 붙인 질문 이름(id). 결과도 이 이름으로 꺼냅니다.
            "department": Choice(
                instructions="Which team should handle this",
                criteria={  # 선택지 이름: 설명  (최대 255개)
                    "billing": "Payment or subscription issues",
                    "returns": "Returns, exchanges or refunds for products",
                    "technical": "Bugs or website/app problems",
                },
            ),
        },
    )

answer = response.choices["department"]

print("선택한 팀    :", answer.choice)         # 선택지 이름 중 하나만 나옴
print("신뢰도       :", answer.confidence)     # 0(애매함) ~ 1(확실함)
print("선택지별 확률:", answer.probabilities)  # 합이 1
print("사용 모델    :", response.model)
print("사용 토큰    :", response.usage)
