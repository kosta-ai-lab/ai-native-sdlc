"""PID 제어기 — 3계층 중 가장 아래 계층 (실제 드론의 비행 컨트롤러가 하는 일).

    출력 = Kp × 오차  +  Ki × 오차의 누적  +  Kd × 오차의 변화율

- P(비례): 오차가 크면 세게 고침. P만 있으면 바람처럼 계속 미는 힘이 있을 때 오차가 남음
- I(적분): 오래 남은 오차를 누적해서 없앰 → 바람을 이겨 냄
- D(미분): 오차가 빨리 줄면 미리 살살 → 출렁임(오버슈트) 감소
"""


class PID:
    def __init__(self, kp, ki, kd, limit=None):
        self.kp, self.ki, self.kd, self.limit = kp, ki, kd, limit
        self.integral = 0.0
        self.prev_error = None

    def reset(self):
        self.integral = 0.0
        self.prev_error = None

    def update(self, error, dt):
        derivative = 0.0 if self.prev_error is None else (error - self.prev_error) / dt
        self.prev_error = error
        candidate = self.integral + error * dt
        out = self.kp * error + self.ki * candidate + self.kd * derivative
        if self.limit is not None and abs(out) > self.limit:
            out = max(-self.limit, min(self.limit, out))      # 출력이 한계에 닿으면
        else:
            self.integral = candidate                          # 적분을 더 쌓지 않음 (anti-windup)
        return out


class VelocityController:
    """목표 수평 속도 → 필요한 가속(추력) 명령. x, y 축에 PID를 하나씩."""

    def __init__(self, gains, limit):
        self.px, self.py = PID(*gains, limit=limit), PID(*gains, limit=limit)

    def update(self, setpoint, velocity, dt):
        return (self.px.update(setpoint[0] - velocity[0], dt),
                self.py.update(setpoint[1] - velocity[1], dt))

    def reset(self):
        self.px.reset()
        self.py.reset()


class AltitudeController:
    """목표 고도 → 상승·하강 속도 명령."""

    def __init__(self, gains, limit):
        self.pid = PID(*gains, limit=limit)

    def update(self, target_alt, alt, dt):
        return self.pid.update(target_alt - alt, dt)
