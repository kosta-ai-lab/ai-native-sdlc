"""3단계: 임무 단계와 규칙 두뇌. 이륙 → 이동 ⇄ 회피 → 복귀 → 착륙. (API 키 필요 없음)

    python 02_mission_rule.py                         # calm, 화면
    python 02_mission_rule.py --scenario lowbatt      # 배터리가 모자라는 임무
    python 02_mission_rule.py --scenario windy --headless
"""
import argparse

from brains import RuleBrain
from decider import Decider
from mission import Mission
from physics import World
from safety import SafetyFilter
from scenarios import SCENARIOS
from sim import print_result, run_mission

parser = argparse.ArgumentParser()
parser.add_argument("--scenario", default="calm", choices=SCENARIOS.keys())
parser.add_argument("--seed", type=int, default=0)
parser.add_argument("--headless", action="store_true")
args = parser.parse_args()

renderer = None
if not args.headless:
    from render import Renderer
    renderer = Renderer(f"3: rule brain ({args.scenario})")

world = World(SCENARIOS[args.scenario], seed=args.seed)
mission = Mission(world)
result = run_mission(world, mission, Decider(RuleBrain(), realtime=not args.headless), SafetyFilter(),
                     renderer=renderer, realtime=not args.headless)
print_result(result)
print("\n단계 전환 기록 (시각, 단계, 이유):")
for t, phase, why in result["phase_log"]:
    print(f"  {t:6.1f}s  {phase:<8} {why}")
