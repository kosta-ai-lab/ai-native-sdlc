"""임무 단계(phase) 관리 + 계층 연결.

    TAKEOFF ─▶ TRANSIT ⇄ AVOID ─▶ RETURN (⇄ AVOID) ─▶ LAND ─▶ LANDED
                  └──────────────▶ RETURN (임무 포기)

- 기계적인 전환(이륙 완료, 경유지 도착, 집 도착, 착지)은 코드가 정확히 처리합니다.
- 판단이 필요한 전환(계속 갈지 / 돌아갈지 / 회피할지)은 두뇌(규칙·Jev)가 고릅니다.
- 안전 감시는 언제든 강제로 RETURN 또는 LAND 시킬 수 있습니다.

control()은 '방향 명령'을 목표 속도로 바꾸고 PID에 넘겨 추력을 계산합니다.
"""
import math

from config import (ALT_PID, AVOID_SPEED, CRUISE_ALT, CRUISE_SPEED, DRAIN_AIRSPEED, DRAIN_HOVER,
                    HOME_RADIUS, MAX_CLIMB, MAX_THRUST_ACC, RESERVE_PCT, VEL_PID, WAYPOINT_RADIUS)
from physics import DIRS
from pid import AltitudeController, VelocityController

FLIGHT_PHASES = ("TRANSIT", "AVOID", "RETURN")


def energy_pct(distance, wind, direction=None):
    """distance(m)를 순항 속도로 날 때 드는 배터리(%) 추정. direction은 진행 방향 단위벡터."""
    if distance <= 0:
        return 0.0
    ux, uy = direction if direction else (0.0, 0.0)
    air = math.hypot(CRUISE_SPEED * ux - wind[0], CRUISE_SPEED * uy - wind[1])
    return (DRAIN_HOVER + DRAIN_AIRSPEED * air * air) * distance / CRUISE_SPEED


def leg_energy(a, b, wind):
    dx, dy = b[0] - a[0], b[1] - a[1]
    dist = math.hypot(dx, dy)
    return energy_pct(dist, wind, (dx / dist, dy / dist) if dist > 0 else None)


class Mission:
    def __init__(self, world, vel_gains=VEL_PID):
        self.world = world
        self.phase = "TAKEOFF"
        self.wp = 0                          # 다음에 갈 경유지 번호
        self.returning = False
        self.done = False
        self.outcome = None
        self.land_spot = None
        self.log = [(0.0, "TAKEOFF", "start")]
        self.vel = VelocityController(vel_gains, MAX_THRUST_ACC)
        self.alt = AltitudeController(ALT_PID, MAX_CLIMB)

    # ---- 목표와 허용된 단계 ----------------------------------------------------
    def target(self):
        if self.returning or self.wp >= len(self.world.waypoints):
            return "home", self.world.home
        return f"waypoint {self.wp + 1}", self.world.waypoints[self.wp]

    def allowed_phases(self):
        if self.phase not in FLIGHT_PHASES:
            return []
        return ["RETURN", "AVOID"] if self.returning else ["TRANSIT", "AVOID", "RETURN"]

    def set_phase(self, phase, reason):
        if phase != self.phase:
            self.phase = phase
            self.log.append((round(self.world.t, 1), phase, reason))

    # ---- 두뇌·안전 감시가 단계를 바꿀 때 --------------------------------------
    def apply(self, phase, who="brain"):
        if phase not in self.allowed_phases():
            return
        if phase == "RETURN":
            self.returning = True
        self.set_phase(phase, who)

    def force_return(self, reason):
        if self.phase in FLIGHT_PHASES and not self.returning:
            self.returning = True
            self.set_phase("RETURN", reason)

    def force_land(self, reason):
        if self.phase not in ("LAND", "LANDED"):
            d = self.world.drone
            self.land_spot = (d.x, d.y)
            self.set_phase("LAND", reason)

    # ---- 배터리 예상 (두뇌에게 주는 '계산된 값') -------------------------------
    def battery_to_home(self):
        d = self.world.drone
        return leg_energy((d.x, d.y), self.world.home, self.world.wind.mean) + DRAIN_HOVER * 3

    def battery_to_finish(self):
        d, w = self.world.drone, self.world.wind.mean
        points = [(d.x, d.y)] + ([] if self.returning else self.world.waypoints[self.wp:]) + [self.world.home]
        return sum(leg_energy(a, b, w) for a, b in zip(points, points[1:])) + DRAIN_HOVER * 3

    # ---- 매 물리 주기: 단계 진행 + 목표 속도 + PID -----------------------------
    def control(self, heading, dt):
        world, d = self.world, self.world.drone
        if world.crashed and not self.done:
            self.done, self.outcome = True, "crashed"
            self.log.append((round(world.t, 1), "CRASHED", "battery empty in the air"))
        alt_target, vel_sp = CRUISE_ALT, (0.0, 0.0)

        if self.phase == "TAKEOFF":
            if d.z >= CRUISE_ALT - 0.1:
                self.set_phase("TRANSIT", "reached cruise altitude")

        elif self.phase in FLIGHT_PHASES:
            name, (tx, ty) = self.target()
            dist = math.hypot(tx - d.x, ty - d.y)
            if not self.returning and dist < WAYPOINT_RADIUS:
                self.wp += 1
                self.log.append((round(world.t, 1), self.phase, f"reached {name}"))
                if self.wp >= len(world.waypoints):
                    self.returning = True
                    self.set_phase("RETURN", "all waypoints done")
            elif self.returning and dist < HOME_RADIUS:
                self.land_spot = world.home
                self.set_phase("LAND", "reached home")
            if heading in DIRS:
                speed = AVOID_SPEED if self.phase == "AVOID" else CRUISE_SPEED
                vel_sp = (DIRS[heading][0] * speed, DIRS[heading][1] * speed)

        elif self.phase == "LAND":
            alt_target = 0.0
            lx, ly = self.land_spot
            k = 0.8                                   # 착륙 지점 위로 천천히 맞춤
            vx, vy = (lx - d.x) * k, (ly - d.y) * k
            s = math.hypot(vx, vy)
            vel_sp = (vx, vy) if s <= 0.8 else (vx / s * 0.8, vy / s * 0.8)
            if d.z <= 0.02:
                at_home = math.hypot(d.x - world.home[0], d.y - world.home[1]) < HOME_RADIUS * 1.5
                self.set_phase("LANDED", "touchdown")
                self.done, self.outcome = True, "landed_home" if at_home else "landed_away"

        acc = self.vel.update(vel_sp, (d.vx, d.vy), dt)
        climb = self.alt.update(alt_target, d.z, dt) if self.phase != "LANDED" else -MAX_CLIMB
        return acc, climb

    # ---- 두뇌에게 넘길 관측 복사본 ---------------------------------------------
    def observe(self):
        world, d = self.world, self.world.drone
        name, (tx, ty) = self.target()
        hx, hy = world.home
        nofly = []
        for nx, ny, r in world.nofly:
            gap = math.hypot(nx - d.x, ny - d.y) - r
            if gap < 8:
                nofly.append({"dx": round(nx - d.x, 1), "dy": round(ny - d.y, 1), "radius": r, "gap": round(gap, 1)})
        return {
            "phase": self.phase,
            "returning": self.returning,
            "allowed_phases": self.allowed_phases(),
            "altitude_m": round(d.z, 1),
            "velocity_mps": {"vx": round(d.vx, 2), "vy": round(d.vy, 2)},
            "battery_pct": round(d.battery, 1),
            "battery_needed_return_home_pct": round(self.battery_to_home(), 1),
            "battery_needed_finish_mission_pct": round(self.battery_to_finish(), 1),
            "battery_reserve_pct": RESERVE_PCT,
            "target": {"name": name, "dx": round(tx - d.x, 2), "dy": round(ty - d.y, 2),
                       "distance": round(math.hypot(tx - d.x, ty - d.y), 2)},
            "home": {"dx": round(hx - d.x, 2), "dy": round(hy - d.y, 2),
                     "distance": round(math.hypot(hx - d.x, hy - d.y), 2)},
            "waypoints_left": 0 if self.returning else len(world.waypoints) - self.wp,
            "wind_mps": {"vx": round(world.wind_now[0], 2), "vy": round(world.wind_now[1], 2)},
            "range_sensors_m": world.rays(),
            "nofly_zones_nearby": nofly,
            "geofence_margin_m": world.fence_margins(),
        }
