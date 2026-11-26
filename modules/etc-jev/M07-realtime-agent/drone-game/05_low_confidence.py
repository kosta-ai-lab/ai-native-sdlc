"""6단계 준비: '신뢰도 낮으면 안전 행동'을 API 키 없이 먼저 확인합니다.

NoisyBrain은 25% 확률로 엉뚱한 방향을 고르지만, 그때는 확률을 낮게 말합니다 (보정된 모델 흉내).
min_prob 기준을 바꿔 가며 30판씩 비교합니다.

    python 05_low_confidence.py
"""
import argparse

from brains import LatencyModel, NoisyBrain
from decider import Decider
from levels import LEVELS
from safety import SafetyFilter
from sim import run_episode
from world import World

parser = argparse.ArgumentParser()
parser.add_argument("--level", default="moving", choices=LEVELS.keys())
parser.add_argument("--runs", type=int, default=30)
args = parser.parse_args()

keys = ["items", "collisions", "score", "time_s", "safety_stops", "low_conf"]
print(f"레벨 {args.level}, 지연 0.3±0.1초, budget 0.6 / hold 0.8, 기준별 {args.runs}판 평균\n")
print(f"{'min_prob':<9} {'수집':>5} {'충돌':>5} {'점수':>6} {'시간s':>6} {'안전정지':>8} {'자신없음':>8}")
print("-" * 54)
for min_prob in [None, 0.4, 0.55, 0.7, 0.9]:
    tot = dict.fromkeys(keys, 0)
    for seed in range(args.runs):
        d = Decider(NoisyBrain(seed=seed), latency=LatencyModel(0.3, 0.1, seed=seed),
                    budget=0.6, hold=0.8, min_prob=min_prob)
        r = run_episode(World(args.level), d, SafetyFilter())
        for k in keys:
            tot[k] += r[k]
    a = {k: v / args.runs for k, v in tot.items()}
    label = "끔" if min_prob is None else f"{min_prob}"
    print(f"{label:<9} {a['items']:>5.1f} {a['collisions']:>5.1f} {a['score']:>6.0f} {a['time_s']:>6.1f} "
          f"{a['safety_stops']:>8.1f} {a['low_conf']:>8.1f}")
