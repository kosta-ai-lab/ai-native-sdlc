"""3단계: 규칙 기반 에이전트 두 가지. (API 키 필요 없음)

    greedy : 출구와의 거리가 줄어드는 방향으로 감
    wall   : 우수법 — 오른손을 벽에 대고 걷듯이 오른쪽 → 앞 → 왼쪽 → 뒤 순서로 감

    python 02_rule_agents.py --agent greedy --maze basic
    python 02_rule_agents.py --agent greedy --maze dead_end
    python 02_rule_agents.py --agent wall --maze dead_end
"""
import argparse

from agents import GreedyAgent, WallFollowerAgent
from env import MazeEnv
from mazes import MAZES
from runner import print_result, run_episode

parser = argparse.ArgumentParser()
parser.add_argument("--agent", default="greedy", choices=["greedy", "wall"])
parser.add_argument("--maze", default="basic", choices=MAZES.keys())
parser.add_argument("--delay", type=float, default=0.2)
args = parser.parse_args()

agent = GreedyAgent() if args.agent == "greedy" else WallFollowerAgent()
print_result(run_episode(MazeEnv(MAZES[args.maze]), agent, delay=args.delay))
