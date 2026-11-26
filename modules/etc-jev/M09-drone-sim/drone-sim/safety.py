"""안전 감시 계층 — 60Hz로 매번, 두뇌가 무엇을 골랐든 마지막에 확인합니다.

방향 감시 (filter_heading)
  1. 장애물: 가려는 방향이 가깝거나, 지금 속도로는 멈추기 전에 닿거나,
     제자리에서도 너무 가까우면 → 가장 트인 방향으로 비켜남 (돌풍 속 HOVER는 위험하므로)
  2. 지오펜스·비행 금지 구역: 잠시 뒤(LOOKAHEAD_S) 위치가 밖이거나 금지 구역 안이면 → HOVER
임무 감시 (check_mission)
  3. 배터리: 집까지 필요한 양 + 여유분의 절반보다 적으면 → 강제 RETURN
  4. 배터리: LAND_NOW_PCT 미만이면 → 그 자리에 강제 LAND

실제 드론에서는 비행 컨트롤러의 지오펜스·충돌 방지·배터리 페일세이프에 해당합니다.
"""
import math

from config import (AVOID_SPEED, CRUISE_SPEED, DRONE_R, FENCE_MARGIN, LAND_NOW_PCT, LOOKAHEAD_S,
                    MAX_THRUST_ACC, RESERVE_PCT, SAFETY_DIST)
from mission import FLIGHT_PHASES
from physics import DIRS


def nearest_dir(vx, vy):
    s = math.hypot(vx, vy)
    return max(DIRS, key=lambda n: (vx * DIRS[n][0] + vy * DIRS[n][1]) / s)


class SafetyFilter:
    def __init__(self):
        self.counts = {"obstacle": 0, "geofence": 0, "nofly": 0, "force_return": 0, "force_land": 0}
        self._active = None

    @property
    def total(self):
        return sum(self.counts.values())

    def check_mission(self, world, mission):
        b = world.drone.battery
        if mission.phase in FLIGHT_PHASES and not mission.returning and \
                b < mission.battery_to_home() + RESERVE_PCT / 2:
            mission.force_return("safety: battery")
            self.counts["force_return"] += 1
        if b < LAND_NOW_PCT and mission.phase not in ("LAND", "LANDED") and world.drone.airborne:
            mission.force_land("safety: battery critical")
            self.counts["force_land"] += 1

    def filter_heading(self, world, mission, heading):
        reason = None
        d = world.drone
        if heading != "HOVER":
            dx, dy = DIRS[heading]
            speed = math.hypot(d.vx, d.vy)
            # 1) 장애물
            if world.ray(heading) < SAFETY_DIST:
                reason = "obstacle"
            elif speed > 0.3:
                stop = speed * speed / (2 * MAX_THRUST_ACC)
                if world.ray(nearest_dir(d.vx, d.vy)) < stop + SAFETY_DIST * 0.5:
                    reason = "obstacle"
            # 2) 지오펜스·비행 금지 구역 (잠시 뒤 위치 예측)
            if reason is None:
                cmd_speed = AVOID_SPEED if mission.phase == "AVOID" else CRUISE_SPEED
                px = d.x + (0.5 * d.vx + 0.5 * dx * cmd_speed) * LOOKAHEAD_S
                py = d.y + (0.5 * d.vy + 0.5 * dy * cmd_speed) * LOOKAHEAD_S
                if world.outside_fence(px, py, FENCE_MARGIN * 0.5):
                    reason = "geofence"
                elif world.in_nofly(px, py, pad=DRONE_R):
                    reason = "nofly"
        # 3) 제자리(HOVER)여도 돌풍에 밀려 장애물에 너무 가까우면
        if reason is None and min(world.rays().values()) < SAFETY_DIST * 0.3:
            reason = "obstacle"
        if reason:
            if self._active != reason:
                self.counts[reason] += 1
            self._active = reason
            if reason == "obstacle":
                return self.escape(world, heading)   # 장애물: 트인 쪽으로 비켜남
            return "HOVER"                           # 지오펜스·금지 구역: 멈춤
        self._active = None
        return heading

    def escape(self, world, heading):
        """장애물에서 비켜날 방향: 트여 있으면서 원래 가려던 쪽에 가까운 방향.
        (지오펜스·금지 구역 쪽은 제외) 돌풍 속에서 그냥 멈추면 바람에 밀려 부딪힐 수 있기 때문입니다."""
        d = world.drone
        hx, hy = DIRS.get(heading, (0.0, 0.0))
        best, best_score = "HOVER", -1e9
        for name, (dx, dy) in DIRS.items():
            px, py = d.x + dx, d.y + dy
            if world.outside_fence(px, py, FENCE_MARGIN * 0.5) or world.in_nofly(px, py, pad=DRONE_R):
                continue
            r = world.ray(name)
            if r < SAFETY_DIST * 1.5:
                continue
            score = min(r, 3.0) + 1.5 * (dx * hx + dy * hy)
            if score > best_score:
                best, best_score = name, score
        return best
