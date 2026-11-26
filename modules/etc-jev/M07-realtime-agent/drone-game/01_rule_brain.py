"""2단계: 규칙 두뇌와 세 가지 주기 (물리 60Hz / 판단 N Hz / 화면 60FPS). (API 키 필요 없음)

    python 01_rule_brain.py                    # 판단 5Hz
    python 01_rule_brain.py --decision-hz 1    # 1초에 한 번만 판단하면?
    python 01_rule_brain.py --decision-hz 20
    python 01_rule_brain.py --headless         # 화면 없이 빠르게 결과만
"""
import argparse

from brains import RuleBrain
from decider import Decider
from levels import LEVELS
from safety import SafetyFilter
from sim import print_result, run_episode
from world import World

parser = argparse.ArgumentParser()
parser.add_argument("--level", default="moving", choices=LEVELS.keys())
parser.add_argument("--decision-hz", type=float, default=5)
parser.add_argument("--headless", action="store_true")
args = parser.parse_args()

renderer = None
if not args.headless:
    from render import Renderer
    renderer = Renderer(f"2: rule brain {args.decision_hz:g} Hz")

decider = Decider(RuleBrain(), decision_hz=args.decision_hz, realtime=not args.headless)
result = run_episode(World(args.level), decider, SafetyFilter(), renderer=renderer, realtime=not args.headless)
print_result(result)
