"""pygame 화면. 게임 규칙과는 분리되어 있어서, 화면 없이(headless)도 같은 시뮬레이션이 돕니다.

화면 정보 패널은 글꼴 문제를 피하려고 영어로 표시합니다.
"""
import pygame

from config import (ARENA_H, ARENA_W, DECISION_HZ, HUD_W, ITEM_R, PHYSICS_HZ, RENDER_FPS, SCALE,
                    TIME_LIMIT)
from controller import DIRS

STATUS_COLOR = {
    "START": (180, 180, 180), "FRESH": (80, 200, 120), "HOLD": (230, 200, 60),
    "LATE": (240, 140, 40), "LOW_CONF": (180, 120, 230), "TIMEOUT": (230, 70, 70),
}


class Renderer:
    def __init__(self, title="Jev drone game"):
        pygame.init()
        self.w, self.h = int(ARENA_W * SCALE), int(ARENA_H * SCALE)
        self.screen = pygame.display.set_mode((self.w + HUD_W, self.h))
        pygame.display.set_caption(title)
        self.font = pygame.font.SysFont("consolas,menlo,dejavusansmono,couriernew", 16)
        self.clock = pygame.time.Clock()

    def px(self, x, y):
        return int(x * SCALE), int((ARENA_H - y) * SCALE)

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT or (event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE):
                return False
        return True

    def keys_command(self):
        k = pygame.key.get_pressed()
        dx = (1 if k[pygame.K_RIGHT] else 0) - (1 if k[pygame.K_LEFT] else 0)
        dy = (1 if k[pygame.K_UP] else 0) - (1 if k[pygame.K_DOWN] else 0)
        name = {(0, 1): "N", (1, 1): "NE", (1, 0): "E", (1, -1): "SE", (0, -1): "S",
                (-1, -1): "SW", (-1, 0): "W", (-1, 1): "NW"}
        return name.get((dx, dy), "HOVER")

    def draw(self, world, decider=None, safety=None):
        sc = self.screen
        sc.fill((24, 26, 32))
        for i in range(int(ARENA_W) + 1):                  # 1m 격자
            pygame.draw.line(sc, (36, 40, 48), (i * SCALE, 0), (i * SCALE, self.h))
        for j in range(int(ARENA_H) + 1):
            pygame.draw.line(sc, (36, 40, 48), (0, j * SCALE), (self.w, j * SCALE))

        for (x, y) in world.items:                          # 목표물
            pygame.draw.circle(sc, (250, 210, 60), self.px(x, y), int(ITEM_R * SCALE * 0.6))
        for o in world.obstacles:                           # 장애물
            color = (230, 130, 60) if o.moving else (110, 115, 125)
            pygame.draw.circle(sc, color, self.px(o.x, o.y), int(o.r * SCALE))

        rays = world.rays()                                 # 거리 센서
        for d, (dx, dy) in DIRS.items():
            dist = rays[d] + 0.3
            color = (80, 200, 120) if rays[d] > 2 else (230, 200, 60) if rays[d] > 1 else (230, 70, 70)
            pygame.draw.line(sc, color, self.px(world.x, world.y),
                             self.px(world.x + dx * dist, world.y + dy * dist), 1)

        center = self.px(world.x, world.y)                  # 드론과 명령 방향
        pygame.draw.circle(sc, (70, 150, 255), center, int(0.3 * SCALE))
        if world.command in DIRS:
            dx, dy = DIRS[world.command]
            pygame.draw.line(sc, (255, 255, 255), center, self.px(world.x + dx * 0.9, world.y + dy * 0.9), 3)

        self._hud(world, decider, safety)
        pygame.display.flip()
        self.clock.tick(RENDER_FPS)

    def _hud(self, world, decider, safety):
        x0 = self.w + 12
        pygame.draw.rect(self.screen, (16, 18, 22), (self.w, 0, HUD_W, self.h))
        lines = [
            (f"time   {world.t:5.1f} / {TIME_LIMIT:.0f}s", None),
            (f"items  {world.collected} / {world.collected + len(world.items)}", None),
            (f"crash  {world.collisions}", None),
            (f"score  {world.score()}", None),
            ("", None),
            (f"FPS     {self.clock.get_fps():5.1f}", None),
            (f"physics {PHYSICS_HZ} Hz", None),
            (f"command {world.command}", None),
        ]
        if decider is not None:
            hz = 1 / decider.period if decider.period else DECISION_HZ
            lat = f"{decider.last_latency:.2f}s" if decider.last_latency is not None else "-"
            wait = f"{world.t - decider.pending['sent']:.2f}s" if decider.pending else "-"
            s = decider.stats
            lines += [
                (f"decide  {hz:.0f} Hz ({decider.brain.name}, {decider.mode})", None),
                (f"status  {decider.status}", STATUS_COLOR.get(decider.status)),
                (f"latency {lat}", None),
                (f"waiting {wait}", None),
                ("", None),
                (f"budget  {decider.budget if decider.budget is not None else '-'}", None),
                (f"hold    {decider.hold if decider.hold is not None else '-'}", None),
                (f"minprob {decider.min_prob if decider.min_prob is not None else '-'}", None),
                ("", None),
                (f"applied {s['applied']}", None),
                (f"late    {s['late']}", None),
                (f"lowconf {s['low_conf']}", None),
                (f"timeout {s['timeouts']}", None),
            ]
        if safety is not None:
            lines.append((f"safety  {safety.interventions} stops", (230, 70, 70) if safety.active else None))
        y = 12
        for text, color in lines:
            if text:
                img = self.font.render(text, True, color or (220, 220, 220))
                self.screen.blit(img, (x0, y))
            y += 22


class ManualPilot:
    """방향키로 조종. 손을 떼면 HOVER."""

    def __init__(self, renderer):
        self.renderer = renderer

    def command(self):
        return self.renderer.keys_command()
