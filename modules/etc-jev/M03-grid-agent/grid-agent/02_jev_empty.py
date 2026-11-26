"""4단계: Jev 에이전트 첫 실행 — 벽 없는 격자에서 목표까지 가기.

state에는 드론 위치와 목표 위치만 들어갑니다. 안전 감시는 아직 없습니다.

    python 02_jev_empty.py
"""
from agents import JevAgent
from grid import GridWorld
from maps import MAPS
from runner import print_result, run_episode

world = GridWorld(MAPS["empty"])
agent = JevAgent()
try:
    result = run_episode(world, agent, log_name="02_jev_empty")
finally:
    agent.close()
print_result(result)
