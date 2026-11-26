"""3단계: 두뇌가 느리면? 동기(sync) 호출 vs 비동기(async) 호출. (API 키 필요 없음)

규칙 두뇌에 '네트워크 지연'을 흉내 내서 붙입니다 (기본 0.3±0.1초).

    python 02_latency_sync.py --mode sync      # 답을 기다리는 동안 프로그램 전체가 멈춤
    python 02_latency_sync.py --mode async     # 두뇌는 뒤에서 생각, 화면·물리·안전 감시는 계속
    python 02_latency_sync.py --mode sync --latency 0.8
"""
import argparse

from brains import LatencyModel, RuleBrain
from decider import Decider
from levels import LEVELS
from render import Renderer
from safety import SafetyFilter
from sim import print_result, run_episode
from world import World

parser = argparse.ArgumentParser()
parser.add_argument("--mode", default="sync", choices=["sync", "async"])
parser.add_argument("--latency", type=float, default=0.3, help="평균 응답 지연 (초)")
parser.add_argument("--level", default="moving", choices=LEVELS.keys())
args = parser.parse_args()

renderer = Renderer(f"3: {args.mode}, latency {args.latency}s")
decider = Decider(RuleBrain(), mode=args.mode, latency=LatencyModel(base=args.latency, jitter=0.1),
                  realtime=True)
result = run_episode(World(args.level), decider, SafetyFilter(), renderer=renderer, realtime=True)
print_result(result)
