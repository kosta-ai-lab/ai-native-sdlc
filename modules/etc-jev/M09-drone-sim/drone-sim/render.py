"""pygame 화면 (위에서 내려다본 모습). 시뮬레이션과 분리되어 있어 화면 없이도 같은 결과가 나옵니다.
정보 패널은 글꼴 문제를 피하려고 영어로 표시합니다.
"""
import math

import pygame

from config import ARENA_H, ARENA_W, CRUISE_ALT, FENCE_MARGIN, HUD_W, RENDER_FPS, RESERVE_PCT, SCALE

PHASE_COLOR = {"TAKEOFF": (120, 180, 255), "TRANSIT": (80, 200, 120), "AVOID": (240, 200, 60),
               "RETURN": (240, 140, 40), "LAND": (180, 120, 230), "LANDED": (180, 180, 180)}
STATUS_COLOR = {"FRESH": (80, 200, 120), "HOLD": (230, 200, 60), "LATE": (240, 140, 40),
                "LOW_CONF": (180, 120, 230), "TIMEOUT": (230, 70, 70)}


class Renderer:
    def __init__(self, title="Jev drone simulator"):
        pygame.init()
        self.w, self.h = int(ARENA_W * SCALE), int(ARENA_H * SCALE)
        self.screen = pygame.display.set_mode((self.w + HUD_W, self.h))
        pygame.display.set_caption(title)
        self.font = pygame.font.SysFont("consolas,menlo,dejavusansmono,couriernew", 15)
        self.small = pygame.font.SysFont("consolas,menlo,dejavusansmono,couriernew", 12)
        self.clock = pygame.time.Clock()
        self.keys = {"return": False, "land": False}

    def px(self, x, y):
        return int(x * SCALE), int((ARENA_H - y) * SCALE)

    def handle_events(self, mission=None):
        for e in pygame.event.get():
            if e.type == pygame.QUIT or (e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE):
                return False
            if e.type == pygame.KEYDOWN and e.key == pygame.K_r:
                self.keys["return"] = True
            if e.type == pygame.KEYDOWN and e.key == pygame.K_l and mission is not None:
                mission.force_land("pilot")
        return True

    def keys_heading(self):
        k = pygame.key.get_pressed()
        dx = (1 if k[pygame.K_RIGHT] else 0) - (1 if k[pygame.K_LEFT] else 0)
        dy = (1 if k[pygame.K_UP] else 0) - (1 if k[pygame.K_DOWN] else 0)
        names = {(0, 1): "N", (1, 1): "NE", (1, 0): "E", (1, -1): "SE", (0, -1): "S",
                 (-1, -1): "SW", (-1, 0): "W", (-1, 1): "NW"}
        return names.get((dx, dy), "HOVER")

    def draw(self, world, mission, decider=None, safety=None):
        sc = self.screen
        sc.fill((22, 26, 30))
        for i in range(int(ARENA_W) + 1):
            pygame.draw.line(sc, (34, 40, 46), (i * SCALE, 0), (i * SCALE, self.h))
        for j in range(int(ARENA_H) + 1):
            pygame.draw.line(sc, (34, 40, 46), (0, j * SCALE), (self.w, j * SCALE))
        m = int(FENCE_MARGIN * SCALE)                                  # 지오펜스 여유선
        pygame.draw.rect(sc, (200, 60, 60), (m, m, self.w - 2 * m, self.h - 2 * m), 1)

        zone = pygame.Surface((self.w, self.h), pygame.SRCALPHA)       # 비행 금지 구역
        for nx, ny, r in world.nofly:
            pygame.draw.circle(zone, (220, 50, 50, 70), self.px(nx, ny), int(r * SCALE))
        sc.blit(zone, (0, 0))
        for nx, ny, r in world.nofly:
            pygame.draw.circle(sc, (220, 60, 60), self.px(nx, ny), int(r * SCALE), 2)
        for ox, oy, r in world.obstacles:                              # 장애물
            pygame.draw.circle(sc, (110, 115, 125), self.px(ox, oy), int(r * SCALE))

        hx, hy = self.px(*world.home)                                  # 집
        pygame.draw.rect(sc, (70, 150, 255), (hx - 12, hy - 12, 24, 24), 2)
        sc.blit(self.small.render("H", True, (70, 150, 255)), (hx - 4, hy - 7))
        for i, (x, y) in enumerate(world.waypoints):                   # 경유지
            done = i < mission.wp
            color = (90, 90, 90) if done else (250, 210, 60)
            pygame.draw.circle(sc, color, self.px(x, y), 9, 0 if not done else 2)
            sc.blit(self.small.render(str(i + 1), True, (20, 20, 20) if not done else color),
                    (self.px(x, y)[0] - 4, self.px(x, y)[1] - 7))

        d = world.drone                                                # 드론 (고도가 높을수록 크게)
        c = self.px(d.x, d.y)
        radius = int(SCALE * (0.3 + 0.12 * d.z))
        pygame.draw.circle(sc, PHASE_COLOR.get(mission.phase, (200, 200, 200)), c, radius, 3)
        pygame.draw.line(sc, (255, 255, 255), c, self.px(d.x + d.vx * 0.6, d.y + d.vy * 0.6), 2)

        wx, wy = world.wind_now                                        # 바람 화살표 (왼쪽 위)
        pygame.draw.circle(sc, (60, 70, 80), (40, 40), 28, 1)
        pygame.draw.line(sc, (120, 200, 255), (40, 40), (40 + int(wx * 12), 40 - int(wy * 12)), 3)
        sc.blit(self.small.render("wind", True, (120, 200, 255)), (24, 72))

        self._hud(world, mission, decider, safety)
        pygame.display.flip()
        self.clock.tick(RENDER_FPS)

    def _bar(self, x, y, frac, color, label):
        pygame.draw.rect(self.screen, (50, 55, 60), (x, y, 160, 12))
        pygame.draw.rect(self.screen, color, (x, y, int(160 * max(0, min(1, frac))), 12))
        self.screen.blit(self.font.render(label, True, (220, 220, 220)), (x + 168, y - 3))

    def _hud(self, world, mission, decider, safety):
        x0, y = self.w + 12, 12
        pygame.draw.rect(self.screen, (14, 16, 20), (self.w, 0, HUD_W, self.h))
        d = world.drone
        bcol = (80, 200, 120) if d.battery > 30 else (240, 200, 60) if d.battery > RESERVE_PCT else (230, 70, 70)
        self._bar(x0, y + 4, d.battery / 100, bcol, f"{d.battery:5.1f}%")
        y += 24
        self._bar(x0, y + 4, d.z / (CRUISE_ALT * 1.3), (120, 180, 255), f"{d.z:4.1f} m")
        y += 30
        need = mission.battery_to_home()
        lines = [
            (f"phase  {mission.phase}", PHASE_COLOR.get(mission.phase)),
            (f"time   {world.t:5.1f}s", None),
            (f"wp     {mission.wp}/{len(world.waypoints)}  {'returning' if mission.returning else ''}", None),
            (f"speed  {math.hypot(d.vx, d.vy):4.1f} m/s", None),
            (f"wind   {math.hypot(*world.wind_now):4.1f} m/s", None),
            (f"home   needs {need:4.1f}%", None),
            (f"crash  {world.collisions}  viol {world.fence_violations + world.nofly_violations}", None),
            ("", None),
        ]
        if decider is not None:
            lat = f"{decider.last_latency:.2f}s" if decider.last_latency is not None else "-"
            s = decider.stats
            lines += [
                (f"brain  {decider.brain.name} ({decider.mode})", None),
                (f"status {decider.status}", STATUS_COLOR.get(decider.status)),
                (f"head   {decider.heading}", None),
                (f"lat    {lat}", None),
                (f"calls  {s['requests']}  late {s['late']}", None),
                (f"lowcf  {s['low_conf']}  tmo {s['timeouts']}", None),
                ("", None),
            ]
        if safety is not None:
            lines += [(f"safety {safety.total}", (230, 70, 70) if safety._active else None)]
            lines += [(f"  {k} {v}", None) for k, v in safety.counts.items() if v]
        lines += [("", None), (f"FPS    {self.clock.get_fps():4.0f}", None)]
        for text, color in lines:
            if text:
                self.screen.blit(self.font.render(text, True, color or (220, 220, 220)), (x0, y))
            y += 20


class ManualPilot:
    """방향키로 방향, R = 복귀, L = 그 자리 착륙. 이륙은 자동."""

    def __init__(self, renderer):
        self.r = renderer

    def command(self):
        phase = None
        if self.r.keys["return"]:
            self.r.keys["return"] = False
            phase = "RETURN"
        return self.r.keys_heading(), phase
