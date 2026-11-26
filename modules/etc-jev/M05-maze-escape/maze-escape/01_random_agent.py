"""2단계: 무작위 에이전트 — 가장 단순한 정책(Policy)과 보상 계산 확인. (API 키 필요 없음)

    python 01_random_agent.py                 # 네 방향 중 아무거나 (충돌도 함)
    python 01_random_agent.py --valid-only    # 갈 수 있는 방향 중에서만
    python 01_random_agent.py --runs 100      # 100판 돌려서 평균 내기
"""
import argparse

from agents import RandomAgent
from env import MazeEnv
from mazes import MAZES
from runner import print_result, run_episode

parser = argparse.ArgumentParser()
parser.add_argument("--maze", default="basic", choices=MAZES.keys())
parser.add_argument("--valid-only", action="store_true", help="갈 수 있는 방향 중에서만 고르기")
parser.add_argument("--seed", type=int, default=0)
parser.add_argument("--runs", type=int, default=1, help="여러 판 돌려서 평균 보기")
args = parser.parse_args()

env = MazeEnv(MAZES[args.maze])
if args.runs == 1:
    agent = RandomAgent(seed=args.seed, valid_only=args.valid_only)
    print_result(run_episode(env, agent, delay=0.1))
else:
    results = [run_episode(env, RandomAgent(seed=s, valid_only=args.valid_only), render=False)
               for s in range(args.runs)]
    n = len(results)
    print(f"{n}판 평균")
    print(f"  탈출 성공률 : {sum(r['outcome'] == 'success' for r in results) / n:.0%}")
    print(f"  평균 이동   : {sum(r['turns'] for r in results) / n:.1f}")
    print(f"  평균 보상   : {sum(r['total_reward'] for r in results) / n:.1f}")
    print(f"  평균 충돌   : {sum(r['collisions'] for r in results) / n:.1f}")
