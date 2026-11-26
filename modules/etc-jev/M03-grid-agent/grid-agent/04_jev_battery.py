"""6단계: 배터리와 복귀 판단 — 목표에 들렀다가 집(H)으로 돌아오는 배달 임무.

매 걸음 배터리가 1씩 줄고, 맞바람(--wind)이 불면 가끔 2가 줄어듭니다.
Jev에게 "지금 복귀해야 하는가?"를 Noul로 묻고, 안전 감시는 배터리가 정말 부족하면 강제로 복귀시킵니다.

    python 04_jev_battery.py --battery 30              # 충분한 배터리 → 성공해야 함
    python 04_jev_battery.py --battery 18              # 부족한 배터리 → 출발하지 않고 복귀해야 함
    python 04_jev_battery.py --battery 24 --wind 0.4   # 비행 중에 부족해지는 상황
    python 04_jev_battery.py --battery 24 --wind 0.4 --agent rule   # 규칙 에이전트와 비교
"""
import argparse

from agents import JevAgent, RuleAgent
from grid import GridWorld
from maps import MAPS
from runner import print_result, run_episode
from safety import SafetyFilter

parser = argparse.ArgumentParser()
parser.add_argument("--battery", type=int, default=30)
parser.add_argument("--wind", type=float, default=0.0, help="배터리를 2 쓰게 될 확률 (0~1)")
parser.add_argument("--seed", type=int, default=1, help="바람을 똑같이 재현하기 위한 숫자")
parser.add_argument("--agent", default="jev", choices=["jev", "rule"])
args = parser.parse_args()

world = GridWorld(MAPS["delivery"], battery=args.battery, wind=args.wind, seed=args.seed)
print(f"집→목표→집 최단 거리: {2 * world.distance(world.home, world.goal)}칸, 배터리: {args.battery}\n")

agent = JevAgent(show_neighbors=True, show_map=True) if args.agent == "jev" else RuleAgent()
try:
    result = run_episode(world, agent, safety=SafetyFilter(), log_name=f"04_{args.agent}_battery")
finally:
    if hasattr(agent, "close"):
        agent.close()
print_result(result)
