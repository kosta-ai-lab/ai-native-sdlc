"""1단계: 방향키로 직접 조종해 봅니다. (API 키 필요 없음)

    python 00_play_manual.py
    python 00_play_manual.py --level moving

방향키(대각선은 두 키 동시에)로 날고, 손을 떼면 제자리 비행(HOVER). ESC로 종료.
"""
import argparse

from levels import LEVELS
from render import ManualPilot, Renderer
from safety import SafetyFilter
from sim import print_result, run_episode
from world import World

parser = argparse.ArgumentParser()
parser.add_argument("--level", default="open", choices=LEVELS.keys())
parser.add_argument("--no-safety", action="store_true", help="안전 감시 끄기")
args = parser.parse_args()

renderer = Renderer("1: manual")
world = World(args.level)
result = run_episode(world, pilot=ManualPilot(renderer), safety=None if args.no_safety else SafetyFilter(),
                     renderer=renderer, realtime=True)
print_result(result)
