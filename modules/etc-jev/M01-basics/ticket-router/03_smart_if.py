"""3단계: 확률과 신뢰도로 분기하는 "똑똑한 if문" 라우터.

tickets.json에 있는 문의를 하나씩 Jev에게 묻고, 결과에 따라
  - 긴급 처리 (urgent)    : 긴급할 확률이 높으면
  - 자동 배정 (auto)      : 담당 팀 확률이 충분히 높으면
  - 사람 검토 (human)     : 애매하면
중 하나로 보냅니다. 기준값은 공식 문서(/confidence)의 출발점을 따랐습니다.
"""
import json
from pathlib import Path

from typesafe_sdk import Choice, Noul, TypeSafeClient

# ---- 기준값 (내 데이터로 실험하며 조정하세요) ---------------------------
AUTO_ROUTE_MIN_PROB = 0.67   # 고른 팀의 확률이 이 값 이상이면 자동 배정
URGENT_YES = 0.7             # Noul이 0.7 이상이면 '예'로 봄
URGENT_NO = 0.3              # 0.3 이하면 '아니오', 그 사이는 애매함

QUESTIONS = {
    "department": Choice(
        instructions="Which team should handle this customer message",
        criteria={
            "billing": "Payment, charges, refunds or subscription issues",
            "technical": "Bugs, errors or integration problems",
            "sales": "Pricing, plans or purchasing questions",
        },
    ),
    "is_urgent": Noul(
        instructions="The message conveys urgency or time-sensitivity",
    ),
}


def decide(dept, urgent_prob):
    """Jev의 답을 받아 처리 방법을 정하는 '똑똑한 if문'."""
    team_prob = dept.probabilities[dept.choice]

    if urgent_prob >= URGENT_YES:
        return "urgent", f"{dept.choice} 팀 긴급 호출"
    if team_prob >= AUTO_ROUTE_MIN_PROB:
        return "auto", f"{dept.choice} 팀에 자동 배정"
    return "human", "상담원이 직접 확인"


def main():
    tickets = json.loads(Path(__file__).with_name("tickets.json").read_text(encoding="utf-8"))

    with TypeSafeClient(model="jev-latest") as client:
        for i, ticket in enumerate(tickets, start=1):
            response = client.system_one(state=ticket, questions=QUESTIONS)
            dept = response.choices["department"]
            urgent_prob = response.nouls["is_urgent"].noul

            route, action = decide(dept, urgent_prob)
            uncertain = URGENT_NO < urgent_prob < URGENT_YES

            print(f"#{i} {ticket[:60]}")
            print(f"   팀={dept.choice} (확률 {dept.probabilities[dept.choice]:.2f}), "
                  f"긴급={urgent_prob:.2f}{' (애매함)' if uncertain else ''}")
            print(f"   → [{route}] {action}\n")


if __name__ == "__main__":
    main()
