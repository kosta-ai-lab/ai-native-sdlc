"""3단계: 단순 규칙 에이전트 — 나중에 Jev와 비교할 기준입니다. (API 키 필요 없음)

규칙: "목표와의 거리가 줄어드는 방향으로 간다. 그런 방향이 없으면 아무 데나 간다."

    python 01_rule_agent.py --map empty
    python 01_rule_agent.py --map walls
    python 01_rule_agent.py --map trap
"""
import argparse

from agents import RuleAgent
from grid import GridWorld
from maps import MAPS
from runner import print_result, run_episode

parser = argparse.ArgumentParser()
parser.add_argument("--map", default="empty", choices=MAPS.keys())
parser.add_argument("--delay", type=float, default=0.2, help="한 걸음마다 쉬는 시간(초)")
args = parser.parse_args()

world = GridWorld(MAPS[args.map])
print_result(run_episode(world, RuleAgent(), delay=args.delay))
