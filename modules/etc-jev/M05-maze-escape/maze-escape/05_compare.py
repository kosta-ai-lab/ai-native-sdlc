"""7단계: 모든 정책을 같은 미로에서 비교합니다.

    python 05_compare.py            # 무작위·규칙·탐색 + Jev 3종
    python 05_compare.py --no-jev   # API 키 없이
"""
import argparse

from agents import BFSAgent, GreedyAgent, JevAgent, RandomAgent, WallFollowerAgent
from env import MazeEnv
from mazes import MAZES
from runner import OUTCOME_KO, run_episode

parser = argparse.ArgumentParser()
parser.add_argument("--no-jev", action="store_true")
args = parser.parse_args()

agents = [RandomAgent(seed=0), GreedyAgent(), WallFollowerAgent(), BFSAgent()]
jev_agents = []
if not args.no_jev:
    jev_agents = [JevAgent(view="full"), JevAgent(view="local"), JevAgent(view="local", fallback=0.6)]

rows = []
try:
    for maze_name, maze in MAZES.items():
        env = MazeEnv(maze)
        for agent in agents + jev_agents:
            log_name = f"05_{agent.name}_{maze_name}" if agent in jev_agents else None
            r = run_episode(env, agent, render=False, log_name=log_name)
            rows.append((maze_name, r))
            print(f"  끝: {maze_name} / {agent.name}")
finally:
    for a in jev_agents:
        a.close()

print()
print(f"{'미로':<9} {'에이전트':<13} {'결과':<9} {'이동':>4} {'보상':>6} {'충돌':>4} {'Jev호출':>7} {'평균ms':>7} {'대체':>4}")
print("-" * 78)
for maze_name, r in rows:
    calls = r["jev_calls"] or "-"
    lat = r["avg_latency_ms"] if r["avg_latency_ms"] is not None else "-"
    fb = r["fallbacks"] or "-"
    print(f"{maze_name:<9} {r['agent']:<13} {OUTCOME_KO[r['outcome']]:<9} {r['turns']:>4} "
          f"{r['total_reward']:>6} {r['collisions']:>4} {calls:>7} {lat:>7} {fb:>4}")
