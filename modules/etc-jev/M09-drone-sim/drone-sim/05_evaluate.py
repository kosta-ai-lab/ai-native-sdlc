"""6~7단계: 평가 하네스. 두뇌 × 시나리오 × 시드를 돌려 성공률·충돌·지연·비용을 한 표로.

    python 05_evaluate.py --no-jev                       # 규칙 두뇌만 (빠름, 시드 10개)
    python 05_evaluate.py --seeds 2                      # 규칙 + Jev (Jev는 실제 시간: 판당 최대 150초)
    python 05_evaluate.py --scenarios lowbatt storm --seeds 3
    python 05_evaluate.py --tag after_tuning             # 보고서 이름에 꼬리표

결과는 reports/<꼬리표>_<시각>.json / .csv 로 저장됩니다.
"""
import argparse

from brains import JevBrain, LatencyModel, RuleBrain
from decider import Decider
from harness import print_summary, run_matrix, save_report, summarize
from scenarios import SCENARIOS

parser = argparse.ArgumentParser()
parser.add_argument("--scenarios", nargs="+", default=list(SCENARIOS), choices=SCENARIOS.keys())
parser.add_argument("--seeds", type=int, default=None, help="시나리오·두뇌마다 몇 판 (기본: Jev 없으면 10, 있으면 2)")
parser.add_argument("--no-jev", action="store_true")
parser.add_argument("--min-prob", type=float, default=0.0, help="Jev 두뇌의 min_prob")
parser.add_argument("--tag", default="eval")
args = parser.parse_args()
seeds = range(args.seeds or (10 if args.no_jev else 2))

brains = {
    "rule": (lambda s: Decider(RuleBrain()), False),
    "rule+latency": (lambda s: Decider(RuleBrain(), latency=LatencyModel(0.3, 0.1, 0.1, 1.2, seed=s)), False),
}
jev = None
if not args.no_jev:
    jev = JevBrain()
    brains["jev"] = (lambda s: Decider(jev, min_prob=args.min_prob or None, realtime=True), True)

total = len(args.scenarios) * len(brains) * len(seeds)
done = [0]


def progress(r):
    done[0] += 1
    print(f"  [{done[0]}/{total}] {r['scenario']:<8} {r['brain_label']:<13} seed {r['seed']}: "
          f"{r['outcome']}, 경유지 {r['waypoints_done']}/{r['waypoints_total']}, {r['time_s']}s")


try:
    rows = run_matrix(brains, args.scenarios, seeds, on_done=progress)
finally:
    if jev:
        jev.close()

summary = summarize(rows)
print()
print_summary(summary)
json_path, csv_path = save_report(rows, summary, tag=args.tag)
print(f"\n보고서: {json_path}\n        {csv_path}")
