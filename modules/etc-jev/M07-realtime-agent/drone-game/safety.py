"""안전 감시: 매 물리 주기(60Hz)마다, 두뇌가 무엇을 골랐든 마지막으로 확인합니다.

두 가지를 봅니다.
1. 가려는 방향(명령)의 센서 거리가 SAFETY_DIST보다 짧으면 → HOVER
2. 지금 날아가는 방향(속도)으로 '멈추는 데 필요한 거리'만큼 여유가 없으면 → HOVER
   (드론은 관성이 있어서 명령을 바꿔도 바로 멈추지 못합니다)

두뇌(5Hz, 느림)가 놓친 위험을 빠른 주기로 잡는 것이 목적입니다.
실제 드론에서는 비행 컨트롤러의 충돌 방지(collision prevention) 기능에 해당합니다.

주의: sync 모드에서 두뇌가 답을 기다리는 동안에는 이 코드도 실행되지 못합니다.
"""
import math

from config import MAX_ACCEL, SAFETY_DIST
from controller import DIRS


def heading_of(vx, vy):
    """속도 벡터와 가장 가까운 8방향 이름."""
    best, best_dot = None, -2.0
    speed = math.hypot(vx, vy)
    for name, (dx, dy) in DIRS.items():
        dot = (vx * dx + vy * dy) / speed
        if dot > best_dot:
            best, best_dot = name, dot
    return best


class SafetyFilter:
    def __init__(self, dist=SAFETY_DIST):
        self.dist = dist
        self.interventions = 0
        self.active = False

    def filter(self, world, command):
        danger = command != "HOVER" and world.ray(command) < self.dist
        speed = math.hypot(world.vx, world.vy)
        if not danger and speed > 0.3:
            stop = speed * speed / (2 * MAX_ACCEL)            # 멈추는 데 필요한 거리
            danger = world.ray(heading_of(world.vx, world.vy)) < stop + self.dist * 0.5
        if danger:
            if not self.active:
                self.interventions += 1                       # 새로 개입할 때만 셈
            self.active = True
            return "HOVER"
        self.active = False
        return command
