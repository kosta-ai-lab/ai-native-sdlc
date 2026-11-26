"""4단계: 안전 감시 계층. 부주의한 두뇌(비행 금지 구역·배터리 무시)에 안전 감시를 켜고 끄며 비교. (API 키 필요 없음)

    python 03_safety_layer.py                 # 표 (시나리오 3개 × 4가지 조합 × 10판)
    python 03_safety_layer.py --watch nofly   # 부주의한 두뇌 + 안전 감시를 화면으로
"""
import argparse

from brains import RuleBrain
from decider import Decider
from harness import print_summary, run_matrix, summarize
from mission import Mission
from physics import World
from safety import SafetyFilter
from scenarios import SCENARIOS
from sim import print_result, run_mission

parser = argparse.ArgumentParser()
parser.add_argument("--seeds", type=int, default=10)
parser.add_argument("--watch", choices=SCENARIOS.keys(), help="이 시나리오를 부주의한 두뇌 + 안전 감시로 화면에 보기")
args = parser.parse_args()

if args.watch:
    from render import Renderer
    world = World(SCENARIOS[args.watch])
    mission = Mission(world)
    r = run_mission(world, mission, Decider(RuleBrain(careful=False), realtime=True), SafetyFilter(),
                    renderer=Renderer(f"4: naive brain + safety ({args.watch})"), realtime=True)
    print_result(r)
else:
    rows = []
    for safety in (False, True):
        brains = {
            f"naive{'+safety' if safety else ''}": (lambda s: Decider(RuleBrain(careful=False)), False),
            f"rule{'+safety' if safety else ''}": (lambda s: Decider(RuleBrain(careful=True)), False),
        }
        rows += run_matrix(brains, ["nofly", "lowbatt", "storm"], range(args.seeds), safety=safety)
    summary = sorted(summarize(rows), key=lambda s: (s["scenario"], s["brain"]))
    print_summary(summary)
