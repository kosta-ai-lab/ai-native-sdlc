"""4단계: 지연 시간 예산(budget)과 이전 행동 유지(hold) — 다섯 가지 설정을 30판씩 비교. (API 키 필요 없음)

지연: 보통 0.3±0.1초, 15% 확률로 1.5초 더 늦음 (가끔 크게 늦는 실제 네트워크 흉내).
화면 없이 시계를 기다리지 않고 돌리므로 1분 안팎이면 끝납니다.

    python 03_latency_policies.py                       # 비교표
    python 03_latency_policies.py --watch budget+hold   # 한 설정을 화면으로 보기
"""
import argparse

from brains import LatencyModel, RuleBrain
from decider import Decider
from levels import LEVELS
from safety import SafetyFilter
from sim import print_result, run_episode
from world import World

CONFIGS = {
    "ideal":       dict(mode="async", latency=False),                        # 지연 없음 (기준)
    "sync":        dict(mode="sync", latency=True),                          # 기다리는 동안 멈춤
    "async":       dict(mode="async", latency=True),                         # 늦게 온 답도 그대로 적용
    "budget":      dict(mode="async", latency=True, budget=0.6),             # 0.6초 넘게 걸린 답은 버림
    "budget+hold": dict(mode="async", latency=True, budget=0.6, hold=0.8),   # + 0.8초 넘게 새 답 없으면 HOVER
}

parser = argparse.ArgumentParser()
parser.add_argument("--level", default="moving", choices=LEVELS.keys())
parser.add_argument("--runs", type=int, default=30)
parser.add_argument("--watch", choices=CONFIGS.keys(), help="이 설정 하나를 화면으로 실행")
args = parser.parse_args()


def make_decider(cfg, seed, realtime=False):
    lat = LatencyModel(base=0.3, jitter=0.1, spike_prob=0.15, spike=1.5, seed=seed) if cfg["latency"] else None
    return Decider(RuleBrain(), mode=cfg["mode"], latency=lat, budget=cfg.get("budget"),
                   hold=cfg.get("hold"), realtime=realtime)


if args.watch:
    from render import Renderer
    renderer = Renderer(f"4: {args.watch}")
    r = run_episode(World(args.level), make_decider(CONFIGS[args.watch], 0, True), SafetyFilter(),
                    renderer=renderer, realtime=True)
    print_result(r)
else:
    keys = ["items", "collisions", "score", "time_s", "safety_stops", "late", "timeouts"]
    print(f"레벨 {args.level}, 설정별 {args.runs}판 평균\n")
    print(f"{'설정':<12} {'수집':>5} {'충돌':>5} {'점수':>6} {'시간s':>6} {'안전정지':>8} {'버림':>5} {'시간초과':>8}")
    print("-" * 64)
    for name, cfg in CONFIGS.items():
        tot = dict.fromkeys(keys, 0)
        for seed in range(args.runs):
            r = run_episode(World(args.level), make_decider(cfg, seed), SafetyFilter())
            for k in keys:
                tot[k] += r[k]
        a = {k: v / args.runs for k, v in tot.items()}
        print(f"{name:<12} {a['items']:>5.1f} {a['collisions']:>5.1f} {a['score']:>6.0f} {a['time_s']:>6.1f} "
              f"{a['safety_stops']:>8.1f} {a['late']:>5.1f} {a['timeouts']:>8.1f}")
