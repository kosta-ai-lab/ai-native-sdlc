"""격자 세계(게임 규칙). Jev와 상관없는 순수 Python 코드입니다."""
import random
from collections import deque

# 행동 이름 → (x 변화, y 변화)
MOVES = {
    "up": (0, -1),
    "down": (0, 1),
    "left": (-1, 0),
    "right": (1, 0),
}


class GridWorld:
    def __init__(self, rows, battery=None, wind=0.0, seed=None):
        self.height = len(rows)
        self.width = len(rows[0])
        self.walls = set()
        for y, row in enumerate(rows):
            for x, ch in enumerate(row):
                if ch == "#":
                    self.walls.add((x, y))
                elif ch == "H":
                    self.home = (x, y)
                elif ch == "G":
                    self.goal = (x, y)
        self.pos = self.home
        self.battery = battery          # None이면 배터리 규칙을 쓰지 않음
        self.wind = wind                # 이동할 때 배터리를 1 더 쓸 확률 (맞바람)
        self.rng = random.Random(seed)
        self.goal_visited = False
        self.steps = 0
        self.moves = []                 # 지금까지 고른 행동 기록
        self.path = [self.pos]

    # ---- 칸 정보 ---------------------------------------------------------
    def cell(self, p):
        x, y = p
        if not (0 <= x < self.width and 0 <= y < self.height):
            return "edge"               # 격자 밖
        if p in self.walls:
            return "wall"
        return "free"

    def neighbors(self, p=None):
        x, y = p or self.pos
        return {m: self.cell((x + dx, y + dy)) for m, (dx, dy) in MOVES.items()}

    def legal_moves(self, p=None):
        return [m for m, c in self.neighbors(p).items() if c == "free"]

    # ---- 이동 ------------------------------------------------------------
    def step(self, move):
        """move 방향으로 한 칸 이동. 막힌 칸이면 False를 돌려주고 움직이지 않음."""
        dx, dy = MOVES[move]
        nxt = (self.pos[0] + dx, self.pos[1] + dy)
        if self.cell(nxt) != "free":
            return False
        self.pos = nxt
        self.steps += 1
        self.moves.append(move)
        self.path.append(nxt)
        if self.battery is not None:
            cost = 2 if self.rng.random() < self.wind else 1
            self.battery = max(0, self.battery - cost)
        if nxt == self.goal:
            self.goal_visited = True
        return True

    # ---- 거리 계산 (벽을 돌아가는 최단 걸음 수) -------------------------
    def distance(self, a, b):
        seen = {a}
        queue = deque([(a, 0)])
        while queue:
            p, d = queue.popleft()
            if p == b:
                return d
            for dx, dy in MOVES.values():
                q = (p[0] + dx, p[1] + dy)
                if q not in seen and self.cell(q) == "free":
                    seen.add(q)
                    queue.append((q, d + 1))
        return None                     # 갈 수 없음

    # ---- 화면 출력 -------------------------------------------------------
    def map_rows(self):
        rows = []
        for y in range(self.height):
            line = ""
            for x in range(self.width):
                p = (x, y)
                if p == self.pos:
                    line += "D"         # 드론(에이전트)
                elif p in self.walls:
                    line += "#"
                elif p == self.goal and not self.goal_visited:
                    line += "G"
                elif p == self.home:
                    line += "H"
                else:
                    line += "."
            rows.append(line)
        return rows

    def render(self):
        header = "   " + " ".join(str(x) for x in range(self.width))
        lines = [header]
        for y, row in enumerate(self.map_rows()):
            lines.append(f"{y:2} " + " ".join(row))
        return "\n".join(lines)
