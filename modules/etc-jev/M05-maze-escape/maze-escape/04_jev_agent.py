"""5~6단계: Jev 에이전트 — 학습 없이, 지금 보이는 상황만으로 다음 행동을 판단합니다.

5단계 (전체 관측):
    python 04_jev_agent.py --maze dead_end --view full
    python 04_jev_agent.py --maze dead_end --view full --no-mask    # 막힌 방향도 선택지에 넣으면?

6단계 (부분 관측 + 대체 정책):
    python 04_jev_agent.py --maze dead_end --view local
    python 04_jev_agent.py --maze large --view local
    python 04_jev_agent.py --maze large --view local --fallback 0.6  # 애매하면 우수법으로 대체
"""
import argparse

from agents import JevAgent
from env import MazeEnv
from mazes import MAZES
from runner import print_result, run_episode

parser = argparse.ArgumentParser()
parser.add_argument("--maze", default="dead_end", choices=MAZES.keys())
parser.add_argument("--view", default="full", choices=["full", "local"])
parser.add_argument("--no-mask", action="store_true", help="갈 수 없는 방향도 선택지에 포함")
parser.add_argument("--fallback", type=float, default=None,
                    help="Jev가 고른 행동의 확률이 이 값보다 낮으면 우수법으로 대체 (예: 0.6)")
parser.add_argument("--delay", type=float, default=0.0)
args = parser.parse_args()

agent = JevAgent(view=args.view, mask=not args.no_mask, fallback=args.fallback)
try:
    result = run_episode(MazeEnv(MAZES[args.maze]), agent, delay=args.delay,
                         log_name=f"04_{agent.name}_{args.maze}")
finally:
    agent.close()
print_result(result)
