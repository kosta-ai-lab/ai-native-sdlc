"""5단계: 벽이 있는 지도 — state에 주변 정보를 넣고, 안전 감시를 붙입니다.

    python 03_jev_walls.py                    # walls 지도, 주변 칸 + 지도 + 안전 감시
    python 03_jev_walls.py --no-safety        # 안전 감시를 끄면?
    python 03_jev_walls.py --no-neighbors --no-map   # state를 줄이면?
    python 03_jev_walls.py --map trap         # 도전: 함정 지도
"""
import argparse

from agents import JevAgent
from grid import GridWorld
from maps import MAPS
from runner import print_result, run_episode
from safety import SafetyFilter

parser = argparse.ArgumentParser()
parser.add_argument("--map", default="walls", choices=MAPS.keys())
parser.add_argument("--no-safety", action="store_true", help="안전 감시 끄기")
parser.add_argument("--no-neighbors", action="store_true", help="state에서 주변 칸 정보 빼기")
parser.add_argument("--no-map", action="store_true", help="state에서 지도 빼기")
args = parser.parse_args()

world = GridWorld(MAPS[args.map])
safety = None if args.no_safety else SafetyFilter()
agent = JevAgent(show_neighbors=not args.no_neighbors, show_map=not args.no_map)
try:
    result = run_episode(world, agent, safety=safety, log_name=f"03_jev_{args.map}")
finally:
    agent.close()
print_result(result)
