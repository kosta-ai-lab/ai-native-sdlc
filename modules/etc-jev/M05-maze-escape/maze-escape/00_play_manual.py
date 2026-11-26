"""1단계: 사람이 직접 미로를 탈출해 봅니다. (API 키 필요 없음)

    python 00_play_manual.py
    python 00_play_manual.py --maze dead_end
"""
import argparse

from agents import ManualAgent
from env import MazeEnv
from mazes import MAZES
from runner import print_result, run_episode

parser = argparse.ArgumentParser()
parser.add_argument("--maze", default="basic", choices=MAZES.keys())
args = parser.parse_args()

print("A(에이전트)를 왼쪽 아래 S에서 오른쪽 위 G(출구)까지 옮기세요.")
print("보상: 출구 +100, 이동 -1, 장애물 충돌 -10 (충돌하면 제자리)\n")
print_result(run_episode(MazeEnv(MAZES[args.maze]), ManualAgent()))
