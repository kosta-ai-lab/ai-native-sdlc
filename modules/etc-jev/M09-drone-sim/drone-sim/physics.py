"""직접 만든 2D 드론 시뮬레이터: 수평 2D + 고도(z) 하나.

- 바람: 평균 바람 + 돌풍(천천히 변하는 무작위). 공기 저항으로 드론을 밀어냄
- 배터리: 떠 있기만 해도 줄고, 공기 대비 속도가 빠를수록(맞바람) 더 빨리 줆
- 장애물: 부딪히면 충돌 (물리)
- 지오펜스·비행 금지 구역: 부딪히지는 않지만 들어가면 위반 (규칙)
- 거리 센서: 8방향, 장애물까지 거리
"""
import math
import random

from config import (ARENA_H, ARENA_W, DRAG, DRAIN_AIRSPEED, DRAIN_HOVER, DRONE_R, MAX_CLIMB,
                    RAY_MAX)

S = 1 / math.sqrt(2)
DIRS = {
    "N": (0.0, 1.0), "NE": (S, S), "E": (1.0, 0.0), "SE": (S, -S),
    "S": (0.0, -1.0), "SW": (-S, -S), "W": (-1.0, 0.0), "NW": (-S, S),
}


class Wind:
    """평균 바람 + 돌풍. 돌풍은 갑자기 튀지 않고 몇 초에 걸쳐 천천히 변함."""

    def __init__(self, mean, gust, seed=0, tau=3.0):
        self.mean, self.gust, self.tau = mean, gust, tau
        self.gx = self.gy = 0.0
        self.rng = random.Random(seed)

    def step(self, dt):
        if self.gust > 0:
            k = math.sqrt(2 * dt / self.tau) * self.gust
            self.gx += -self.gx / self.tau * dt + k * self.rng.gauss(0, 1)
            self.gy += -self.gy / self.tau * dt + k * self.rng.gauss(0, 1)
        return self.mean[0] + self.gx, self.mean[1] + self.gy


class Drone:
    def __init__(self, x, y, battery):
        self.x, self.y, self.z = x, y, 0.0
        self.vx = self.vy = self.vz = 0.0
        self.battery = battery

    @property
    def airborne(self):
        return self.z > 0.15


class World:
    def __init__(self, scenario, seed=0):
        self.cfg = scenario
        self.home = scenario["home"]
        self.waypoints = list(scenario["waypoints"])
        self.obstacles = list(scenario["obstacles"])
        self.nofly = list(scenario["nofly"])
        self.drone = Drone(*self.home, scenario["battery"])
        self.wind = Wind(scenario["wind"], scenario["gust"], seed=seed)
        self.wind_now = scenario["wind"]
        self.t = 0.0
        # 평가 지표
        self.collisions = 0
        self.fence_violations = 0
        self.nofly_violations = 0
        self.crashed = False
        self._touching, self._in_nofly, self._outside = set(), set(), False

    # ---- 한 물리 주기 --------------------------------------------------------
    def step(self, dt, acc_cmd, climb_cmd):
        d = self.drone
        wx, wy = self.wind_now = self.wind.step(dt)

        # 고도
        d.vz = max(-MAX_CLIMB, min(MAX_CLIMB, climb_cmd))
        d.z = max(0.0, d.z + d.vz * dt)

        if d.airborne:
            # 수평: 추력(PID 출력) + 공기 저항(바람 쪽으로 끌려감)
            ax = acc_cmd[0] - DRAG * (d.vx - wx)
            ay = acc_cmd[1] - DRAG * (d.vy - wy)
            d.vx += ax * dt
            d.vy += ay * dt
            d.x += d.vx * dt
            d.y += d.vy * dt
            # 배터리
            air = math.hypot(d.vx - wx, d.vy - wy)
            d.battery -= (DRAIN_HOVER + DRAIN_AIRSPEED * air * air) * dt
            if d.battery <= 0:
                d.battery = 0.0
                self.crashed = True              # 공중에서 배터리 방전 = 추락
            self._check_contacts()
        else:
            d.vx = d.vy = 0.0
            if d.vz > 0:
                d.battery -= DRAIN_HOVER * dt
        self.t += dt

    def _check_contacts(self):
        d = self.drone
        for i, (ox, oy, r) in enumerate(self.obstacles):        # 장애물 충돌
            dx, dy = d.x - ox, d.y - oy
            dist = math.hypot(dx, dy)
            gap = r + DRONE_R
            if dist < gap:
                if i not in self._touching:
                    self.collisions += 1
                    self._touching.add(i)
                nx, ny = (dx / dist, dy / dist) if dist > 1e-6 else (1.0, 0.0)
                d.x, d.y = ox + nx * gap, oy + ny * gap
                d.vx = d.vy = 0.0
            elif dist > gap + 0.15:
                self._touching.discard(i)
        for i, (nx, ny, r) in enumerate(self.nofly):            # 비행 금지 구역
            inside = math.hypot(d.x - nx, d.y - ny) < r
            if inside and i not in self._in_nofly:
                self.nofly_violations += 1
                self._in_nofly.add(i)
            elif not inside:
                self._in_nofly.discard(i)
        outside = not (0 <= d.x <= ARENA_W and 0 <= d.y <= ARENA_H)   # 지오펜스
        if outside and not self._outside:
            self.fence_violations += 1
        self._outside = outside

    # ---- 센서 ------------------------------------------------------------------
    def ray(self, direction):
        """그 방향으로 날면 몇 m 뒤 장애물에 닿는지 (드론 크기 포함)."""
        d = self.drone
        dx, dy = DIRS[direction]
        best = RAY_MAX
        for ox, oy, r in self.obstacles:
            R = r + DRONE_R
            mx, my = d.x - ox, d.y - oy
            b = mx * dx + my * dy
            c = mx * mx + my * my - R * R
            if c > 0 and b > 0:
                continue
            disc = b * b - c
            if disc < 0:
                continue
            best = min(best, max(0.0, -b - math.sqrt(disc)))
        return round(best, 2)

    def rays(self):
        return {k: self.ray(k) for k in DIRS}

    def fence_margins(self):
        d = self.drone
        return {"N": round(ARENA_H - d.y, 2), "S": round(d.y, 2),
                "E": round(ARENA_W - d.x, 2), "W": round(d.x, 2)}

    def in_nofly(self, x, y, pad=0.0):
        return any(math.hypot(x - nx, y - ny) < r + pad for nx, ny, r in self.nofly)

    def outside_fence(self, x, y, margin):
        return not (margin <= x <= ARENA_W - margin and margin <= y <= ARENA_H - margin)
