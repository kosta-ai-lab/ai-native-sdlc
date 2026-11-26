"""5~6단계: Jev 두뇌로 날기. 진짜 네트워크 지연이 생기므로 4단계의 규칙을 그대로 씁니다.

5단계:
    python 04_jev_brain.py                              # async, budget 0.6, hold 0.8
    python 04_jev_brain.py --mode sync                  # 동기 호출과 비교
    python 04_jev_brain.py --decision-hz 2
6단계:
    python 04_jev_brain.py --min-prob 0.5               # 자신 없으면 HOVER
    python 04_jev_brain.py --level dense --min-prob 0.5
공통:
    --headless   화면 없이 (실제 시간으로 돌아감)
"""
import argparse

from brains import JevBrain
from decider import Decider
from levels import LEVELS
from safety import SafetyFilter
from sim import print_result, run_episode
from world import World

parser = argparse.ArgumentParser()
parser.add_argument("--level", default="moving", choices=LEVELS.keys())
parser.add_argument("--mode", default="async", choices=["sync", "async"])
parser.add_argument("--decision-hz", type=float, default=5)
parser.add_argument("--budget", type=float, default=0.6, help="지연 시간 예산 (초), 0이면 끔")
parser.add_argument("--hold", type=float, default=0.8, help="이전 명령 유지 한도 (초), 0이면 끔")
parser.add_argument("--min-prob", type=float, default=0.0, help="이 확률보다 낮으면 HOVER, 0이면 끔")
parser.add_argument("--no-safety", action="store_true")
parser.add_argument("--headless", action="store_true")
args = parser.parse_args()

renderer = None
if not args.headless:
    from render import Renderer
    renderer = Renderer(f"Jev brain ({args.mode})")

brain = JevBrain()
decider = Decider(brain, mode=args.mode, decision_hz=args.decision_hz,
                  budget=args.budget or None, hold=args.hold or None, min_prob=args.min_prob or None,
                  realtime=True)
try:
    result = run_episode(World(args.level), decider, None if args.no_safety else SafetyFilter(),
                         renderer=renderer, realtime=True, log_name=f"04_jev_{args.mode}_{args.level}")
finally:
    brain.close()
print_result(result)
