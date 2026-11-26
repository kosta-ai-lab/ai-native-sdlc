"""2단계: 사람이 직접 게임을 해 봅니다. (API 키 필요 없음)

    python 00_play_manual.py
    python 00_play_manual.py --map walls
"""
import argparse

from agents import ManualAgent
from grid import GridWorld
from maps import MAPS
from runner import print_result, run_episode

parser = argparse.ArgumentParser()
parser.add_argument("--map", default="empty", choices=MAPS.keys())
args = parser.parse_args()

print("D(드론)를 G(목표)까지 옮기세요. 벽(#)이나 격자 밖으로 가면 충돌입니다.\n")
world = GridWorld(MAPS[args.map])
print_result(run_episode(world, ManualAgent()))
