"""게임 세계(시뮬레이터): 드론, 장애물, 목표물, 거리 센서, 물리.

두뇌는 이 객체를 직접 만지지 않고 snapshot()으로 만든 **복사본**만 받습니다.
판단하는 동안에도 세계는 계속 움직이기 때문입니다 (이 모듈의 핵심).
"""
import math

from config import (ARENA_H, ARENA_W, DRONE_R, ITEM_R, RAY_MAX, SCORE_COLLISION, SCORE_ITEM,
                    TIME_LIMIT)
from controller import DIRS, track, velocity_setpoint
from levels import LEVELS


class Obstacle:
    def __init__(self, x, y, r, vx=0.0, vy=0.0):
        self.x, self.y, self.r, self.vx, self.vy = x, y, r, vx, vy

    @property
    def moving(self):
        return self.vx != 0 or self.vy != 0


class World:
    def __init__(self, level="open"):
        cfg = LEVELS[level]
        self.level = level
        self.x, self.y = cfg["start"]
        self.vx = self.vy = 0.0
        self.items = list(cfg["items"])
        self.obstacles = [Obstacle(*o) for o in cfg["obstacles"]]
        self.t = 0.0
        self.collected = 0
        self.collisions = 0
        self.touching = set()           # 지금 닿아 있는 장애물 (한 번 닿으면 1회로 셈)
        self.command = "HOVER"          # 지금 실행 중인 명령
        self.done = False
        self.reason = None

    # ---- 한 물리 주기 진행 ------------------------------------------------
    def step(self, dt, command):
        if self.done:
            return
        self.command = command
        # 1) 제어기: 명령 → 목표 속도 → 실제 속도 (관성 있음)
        self.vx, self.vy = track(self.vx, self.vy, velocity_setpoint(command), dt)
        self.x += self.vx * dt
        self.y += self.vy * dt
        # 2) 경기장 벽 (지오펜스)
        if not DRONE_R <= self.x <= ARENA_W - DRONE_R:
            self.x = min(max(self.x, DRONE_R), ARENA_W - DRONE_R)
            self.vx = 0.0
        if not DRONE_R <= self.y <= ARENA_H - DRONE_R:
            self.y = min(max(self.y, DRONE_R), ARENA_H - DRONE_R)
            self.vy = 0.0
        # 3) 움직이는 장애물 (벽에서 튕김)
        for o in self.obstacles:
            if o.moving:
                o.x += o.vx * dt
                o.y += o.vy * dt
                if not o.r <= o.x <= ARENA_W - o.r:
                    o.vx = -o.vx
                if not o.r <= o.y <= ARENA_H - o.r:
                    o.vy = -o.vy
        # 4) 충돌: 밀어내고 멈춤
        for i, o in enumerate(self.obstacles):
            dx, dy = self.x - o.x, self.y - o.y
            d = math.hypot(dx, dy)
            gap = o.r + DRONE_R
            if d < gap:
                if i not in self.touching:
                    self.collisions += 1
                    self.touching.add(i)
                nx, ny = (dx / d, dy / d) if d > 1e-6 else (1.0, 0.0)
                self.x, self.y = o.x + nx * gap, o.y + ny * gap
                self.vx = self.vy = 0.0
            elif d > gap + 0.1:
                self.touching.discard(i)
        # 5) 목표물 줍기
        before = len(self.items)
        self.items = [p for p in self.items if math.hypot(p[0] - self.x, p[1] - self.y) > ITEM_R]
        self.collected += before - len(self.items)
        # 6) 시간과 종료
        self.t += dt
        if not self.items:
            self.done, self.reason = True, "all_items"
        elif self.t >= TIME_LIMIT:
            self.done, self.reason = True, "time_limit"

    # ---- 거리 센서 (드론의 레이저 거리계·깊이 카메라 역할) -----------------
    def ray(self, direction):
        """direction(예: "NE") 쪽으로 그대로 날아가면 몇 m 뒤에 부딪히는지 (드론 몸통 크기 포함).

        드론은 점이 아니라 반지름 DRONE_R인 원이므로, 장애물을 DRONE_R만큼 부풀려서 계산합니다.
        """
        dx, dy = DIRS[direction]
        best = RAY_MAX
        # 벽까지 거리
        if dx > 0:
            best = min(best, (ARENA_W - DRONE_R - self.x) / dx)
        if dx < 0:
            best = min(best, (DRONE_R - self.x) / dx)
        if dy > 0:
            best = min(best, (ARENA_H - DRONE_R - self.y) / dy)
        if dy < 0:
            best = min(best, (DRONE_R - self.y) / dy)
        # 원형 장애물까지 거리 (광선-원 교차, 원 반지름 = 장애물 + 드론)
        for o in self.obstacles:
            R = o.r + DRONE_R
            mx, my = self.x - o.x, self.y - o.y
            b = mx * dx + my * dy
            c = mx * mx + my * my - R * R
            if c > 0 and b > 0:
                continue
            disc = b * b - c
            if disc < 0:
                continue
            best = min(best, max(0.0, -b - math.sqrt(disc)))
        return round(min(RAY_MAX, max(0.0, best)), 2)

    def rays(self):
        return {d: self.ray(d) for d in DIRS}

    def nearest_item(self):
        if not self.items:
            return None
        return min(self.items, key=lambda p: math.hypot(p[0] - self.x, p[1] - self.y))

    # ---- 두뇌에게 넘길 관측 복사본 -----------------------------------------
    def snapshot(self):
        target = self.nearest_item()
        near = []
        for o in self.obstacles:
            dist = math.hypot(o.x - self.x, o.y - self.y) - o.r - DRONE_R
            if dist < RAY_MAX:
                near.append({"dx": round(o.x - self.x, 2), "dy": round(o.y - self.y, 2),
                             "radius": o.r, "vx": o.vx, "vy": o.vy, "gap": round(dist, 2)})
        return {
            "t": round(self.t, 2),
            "drone": {"x": round(self.x, 2), "y": round(self.y, 2),
                      "vx": round(self.vx, 2), "vy": round(self.vy, 2)},
            "target": None if target is None else {
                "dx": round(target[0] - self.x, 2), "dy": round(target[1] - self.y, 2),
                "distance": round(math.hypot(target[0] - self.x, target[1] - self.y), 2)},
            "rays": self.rays(),
            "obstacles_nearby": near,
            "items_left": len(self.items),
            "time_left": round(TIME_LIMIT - self.t, 1),
        }

    def score(self):
        return self.collected * SCORE_ITEM + self.collisions * SCORE_COLLISION
