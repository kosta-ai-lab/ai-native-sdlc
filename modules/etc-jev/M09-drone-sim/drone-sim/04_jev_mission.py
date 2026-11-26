"""5단계: 판단 계층에 Jev. 단계(계속/회피/복귀)와 방향을 Jev가 판단합니다.

    python 04_jev_mission.py                              # calm, 화면
    python 04_jev_mission.py --scenario lowbatt           # 언제 포기하고 돌아올까?
    python 04_jev_mission.py --scenario nofly
    python 04_jev_mission.py --scenario storm --min-prob 0.5
    python 04_jev_mission.py --headless                   # 화면 없이 (실제 시간으로 돎)
"""
import argparse

from brains import JevBrain
from decider import Decider
from mission import Mission
from physics import World
from safety import SafetyFilter
from scenarios import SCENARIOS
from sim import print_result, run_mission

parser = argparse.ArgumentParser()
parser.add_argument("--scenario", default="calm", choices=SCENARIOS.keys())
parser.add_argument("--seed", type=int, default=0)
parser.add_argument("--decision-hz", type=float, default=5)
parser.add_argument("--budget", type=float, default=0.6)
parser.add_argument("--hold", type=float, default=0.8)
parser.add_argument("--min-prob", type=float, default=0.0)
parser.add_argument("--no-safety", action="store_true")
parser.add_argument("--headless", action="store_true")
args = parser.parse_args()

renderer = None
if not args.headless:
    from render import Renderer
    renderer = Renderer(f"5: Jev ({args.scenario})")

brain = JevBrain()
decider = Decider(brain, decision_hz=args.decision_hz, budget=args.budget or None, hold=args.hold or None,
                  min_prob=args.min_prob or None, realtime=True)
world = World(SCENARIOS[args.scenario], seed=args.seed)
mission = Mission(world)
try:
    result = run_mission(world, mission, decider, None if args.no_safety else SafetyFilter(),
                         renderer=renderer, realtime=True, log_name=f"04_jev_{args.scenario}")
finally:
    brain.close()
print_result(result)
