"""1단계: 직접 비행. 이륙은 자동, 방향키로 이동, R = 복귀(집으로), L = 그 자리 착륙, ESC = 종료.

    python 00_fly_manual.py
    python 00_fly_manual.py --scenario windy
    python 00_fly_manual.py --scenario nofly --no-safety
"""
import argparse

from mission import Mission
from physics import World
from render import ManualPilot, Renderer
from safety import SafetyFilter
from scenarios import SCENARIOS
from sim import print_result, run_mission

parser = argparse.ArgumentParser()
parser.add_argument("--scenario", default="calm", choices=SCENARIOS.keys())
parser.add_argument("--no-safety", action="store_true")
args = parser.parse_args()

renderer = Renderer(f"1: manual ({args.scenario})")
world = World(SCENARIOS[args.scenario])
mission = Mission(world)
result = run_mission(world, mission, pilot=ManualPilot(renderer),
                     safety=None if args.no_safety else SafetyFilter(), renderer=renderer, realtime=True)
print_result(result)
