"""4단계: 탐색 알고리즘(BFS) 에이전트 — 지도 전체를 알면 최단 경로를 계산할 수 있습니다. (API 키 필요 없음)

    python 03_bfs_agent.py --maze dead_end
    python 03_bfs_agent.py --maze large
"""
import argparse

from agents import BFSAgent
from env import MazeEnv
from mazes import MAZES
from runner import print_result, run_episode

parser = argparse.ArgumentParser()
parser.add_argument("--maze", default="dead_end", choices=MAZES.keys())
parser.add_argument("--delay", type=float, default=0.2)
args = parser.parse_args()

env = MazeEnv(MAZES[args.maze])
print("BFS가 계산한 최단 경로:", " → ".join(env.shortest_path()), "\n")
print_result(run_episode(env, BFSAgent(), delay=args.delay))
