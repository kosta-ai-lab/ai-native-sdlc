"""저수준 제어기 = 드론의 비행 컨트롤러 역할.

두뇌(규칙·Jev)는 "북동쪽으로 가" 같은 **고수준 명령**만 냅니다.
이 제어기가 그 명령을 **목표 속도(velocity setpoint)**로 바꾸고, 1초에 60번
현재 속도를 목표 속도에 맞춰 조금씩 바꿉니다. (실제 드론에서는 PX4 같은 비행 컨트롤러가 하는 일)
"""
import math

from config import CRUISE_SPEED, MAX_ACCEL, VEL_GAIN

S = 1 / math.sqrt(2)
# 명령 → 단위 방향 벡터 (x: 동쪽 +, y: 북쪽 +)
DIRS = {
    "N": (0.0, 1.0), "NE": (S, S), "E": (1.0, 0.0), "SE": (S, -S),
    "S": (0.0, -1.0), "SW": (-S, -S), "W": (-1.0, 0.0), "NW": (-S, S),
}
COMMANDS = list(DIRS) + ["HOVER"]       # 두뇌가 고를 수 있는 명령 9개


def velocity_setpoint(command):
    """명령 → 목표 속도 (m/s). HOVER는 제자리(0, 0)."""
    if command == "HOVER":
        return 0.0, 0.0
    dx, dy = DIRS[command]
    return dx * CRUISE_SPEED, dy * CRUISE_SPEED


def track(vx, vy, setpoint, dt):
    """현재 속도를 목표 속도 쪽으로 바꿈. 가속도는 MAX_ACCEL을 넘지 못함 (관성)."""
    ax = (setpoint[0] - vx) * VEL_GAIN
    ay = (setpoint[1] - vy) * VEL_GAIN
    a = math.hypot(ax, ay)
    if a > MAX_ACCEL:
        ax, ay = ax / a * MAX_ACCEL, ay / a * MAX_ACCEL
    return vx + ax * dt, vy + ay * dt
