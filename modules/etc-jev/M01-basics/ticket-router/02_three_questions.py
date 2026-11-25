"""2단계: 질문 3종(Choice, Score, Noul)을 한 번에 묻습니다.

공식 Quickstart(docs.typesafe.ai/introduction/quickstart)의 예제와 같은 입력이라
결과를 문서의 예시 출력(technical / 0.59 / 0.99)과 비교해 볼 수 있습니다.
"""
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

ticket = (
    "Our API integration started returning 500 errors on every request about "
    "20 minutes ago, and we can't process any customer orders until this is fixed."
)

FRUSTRATION_LEVELS = [          # Score 기준표: 0단계 → 2단계 (최대 10단계)
    "Calm, just stating facts",
    "Frustrated but civil",
    "Very angry, strong language",
]

with TypeSafeClient(model="jev-latest") as client:
    response = client.system_one(
        state=ticket,
        questions={
            # Choice: 선택지 중 하나 고르기
            "department": Choice(
                instructions="Which team should handle this",
                criteria={
                    "billing": "Payment or subscription issues",
                    "technical": "Bugs or integration problems",
                    "sales": "Pricing or account questions",
                },
            ),
            # Score: 기준표의 몇 단계쯤인지 (단계 번호의 확률 가중 평균)
            "frustration": Score(
                instructions="How frustrated the customer appears",
                criteria=FRUSTRATION_LEVELS,
            ),
            # Noul: 이 문장이 참일 확률 (0~1)
            "is_urgent": Noul(
                instructions="The message conveys urgency or time-sensitivity",
            ),
        },
    )

dept = response.choices["department"]
frus = response.scores["frustration"]
urgent = response.nouls["is_urgent"]

print("[Choice] 담당 팀 :", dept.choice, f"(신뢰도 {dept.confidence:.2f})")

# Score 값은 0~1이 아니라 0 ~ (단계 수 - 1) 범위입니다. 여기서는 0~2.
max_level = len(FRUSTRATION_LEVELS) - 1
print("[Score ] 불만 정도:", frus.score, f"/ {max_level}",
      f"(0~1로 환산 {frus.score / max_level:.2f}, 신뢰도 {frus.confidence:.2f})")

# Noul에는 confidence가 없고 noul 값 자체가 '참일 확률'입니다.
print("[Noul  ] 긴급 여부:", urgent.noul)
