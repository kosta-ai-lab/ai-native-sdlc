"""2단계: 제어 계층 — PID 맞추기. (API 키 필요 없음, 화면 없음)

두 가지 시험을 P / PI / PID 세 가지 이득으로 해 봅니다.
  시험 1 (속도 계단 응답): 멈춰 있다가 '동쪽 2m/s'로 명령 → 얼마나 빨리, 얼마나 넘치게 따라가나
  시험 2 (바람 속 제자리 비행): windy 바람 속에서 HOVER 20초 → 얼마나 떠밀려 가나

    python 01_pid_tuning.py
    python 01_pid_tuning.py --kp 4 --ki 0 --kd 0       # 내 이득으로 시험
"""
import argparse
import math

from config import MAX_THRUST_ACC, PHYSICS_HZ, VEL_PID
from physics import World
from pid import VelocityController
from scenarios import SCENARIOS

DT = 1.0 / PHYSICS_HZ

parser = argparse.ArgumentParser()
parser.add_argument("--kp", type=float)
parser.add_argument("--ki", type=float)
parser.add_argument("--kd", type=float)
args = parser.parse_args()

GAINS = {"P": (VEL_PID[0], 0.0, 0.0), "PI": (VEL_PID[0], VEL_PID[1], 0.0), "PID": VEL_PID}
if args.kp is not None:
    GAINS = {"custom": (args.kp, args.ki or 0.0, args.kd or 0.0)}


def airborne_world(scenario):
    w = World(SCENARIOS[scenario], seed=0)
    w.drone.x, w.drone.y, w.drone.z = 15.0, 10.0, 3.0
    w.obstacles = []
    return w


def step_response(gains):
    """멈춘 상태에서 동쪽 2m/s 명령. (도달 시간, 최대 속도, 5초 뒤 속도 오차)"""
    w = airborne_world("calm")
    ctrl = VelocityController(gains, MAX_THRUST_ACC)
    t90, peak = None, 0.0
    for i in range(int(5 / DT)):
        acc = ctrl.update((2.0, 0.0), (w.drone.vx, w.drone.vy), DT)
        w.step(DT, acc, 0.0)
        peak = max(peak, w.drone.vx)
        if t90 is None and w.drone.vx >= 1.8:
            t90 = (i + 1) * DT
    return t90, peak, abs(2.0 - w.drone.vx)


def hover_drift(gains):
    """windy 바람 속에서 HOVER(목표 속도 0) 20초. (최종 떠밀린 거리, 평균 속도 오차)"""
    w = airborne_world("windy")
    ctrl = VelocityController(gains, MAX_THRUST_ACC)
    err = 0.0
    n = int(20 / DT)
    for _ in range(n):
        acc = ctrl.update((0.0, 0.0), (w.drone.vx, w.drone.vy), DT)
        w.step(DT, acc, 0.0)
        err += math.hypot(w.drone.vx, w.drone.vy)
    return math.hypot(w.drone.x - 15.0, w.drone.y - 10.0), err / n


print(f"{'제어기':<7} {'(Kp, Ki, Kd)':<18} {'90%도달s':>8} {'최고속도':>8} {'5초뒤오차':>9} {'바람떠밀림m':>11} {'평균속도오차':>12}")
print("-" * 80)
for name, g in GAINS.items():
    t90, peak, final_err = step_response(g)
    drift, verr = hover_drift(g)
    t90s = f"{t90:.2f}" if t90 is not None else "못 도달"
    print(f"{name:<7} {str(g):<18} {t90s:>8} {peak:>8.2f} {final_err:>9.2f} {drift:>11.2f} {verr:>12.2f}")
