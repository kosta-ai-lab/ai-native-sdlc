"""7단계: 종합 비교. 규칙 두뇌(지연 흉내)와 Jev 두뇌(실제 지연)를 같은 레벨에서 비교합니다.

    python 06_compare.py            # 규칙 + Jev (Jev는 실제 시간으로 돌아서 판마다 최대 45초)
    python 06_compare.py --no-jev   # API 키 없이
"""
import argparse

from brains import JevBrain, LatencyModel, RuleBrain
from decider import Decider
from levels import LEVELS
from safety import SafetyFilter
from sim import OUTCOME_KO, run_episode
from world import World

parser = argparse.ArgumentParser()
parser.add_argument("--levels", nargs="+", default=["open", "moving", "dense"], choices=LEVELS.keys())
parser.add_argument("--no-jev", action="store_true")
args = parser.parse_args()

rows = []
jev = None if args.no_jev else JevBrain()
try:
    for level in args.levels:
        runs = [
            ("rule (지연 없음)", Decider(RuleBrain()), False),
            ("rule (지연 0.3s, async+budget+hold)",
             Decider(RuleBrain(), latency=LatencyModel(0.3, 0.1, 0.15, 1.5, seed=0), budget=0.6, hold=0.8), False),
        ]
        if jev:
            runs += [
                ("jev (async+budget+hold)", Decider(jev, budget=0.6, hold=0.8, realtime=True), True),
                ("jev (+min_prob 0.5)", Decider(jev, budget=0.6, hold=0.8, min_prob=0.5, realtime=True), True),
            ]
        for name, decider, realtime in runs:
            r = run_episode(World(level), decider, SafetyFilter(), realtime=realtime,
                            log_name=f"06_{level}_{name.split()[0]}" if realtime else None)
            rows.append((level, name, r))
            print(f"  끝: {level} / {name}")
finally:
    if jev:
        jev.close()

print()
print(f"{'레벨':<7} {'두뇌':<36} {'결과':<6} {'수집':>4} {'충돌':>4} {'점수':>5} {'시간s':>6} {'평균지연':>8} {'버림':>4} {'자신없음':>8}")
print("-" * 104)
for level, name, r in rows:
    lat = f"{r['avg_latency_s']:.2f}" if r.get("avg_latency_s") is not None else "-"
    print(f"{level:<7} {name:<36} {OUTCOME_KO[r['outcome']]:<6} {r['items']:>4} {r['collisions']:>4} "
          f"{r['score']:>5} {r['time_s']:>6} {lat:>8} {r['late']:>4} {r['low_conf']:>8}")
