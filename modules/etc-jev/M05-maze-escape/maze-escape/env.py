"""게임 환경(Environment): 미로의 규칙만 담당합니다. 에이전트가 누구인지는 모릅니다.

에이전트 설계 요소와의 대응
- Environment : MazeEnv (2차원 격자 미로)
- State       : self.state (현재 위치 (행, 열)) + 미로 상태
- Action      : ACTIONS (UP, DOWN, LEFT, RIGHT)
- Goal        : self.goal (오른쪽 위 출구)
- Reward      : 출구 도착 +100, 이동 -1, 장애물 충돌 -10
- Termination : 출구 도착 또는 최대 턴 초과
"""
from collections import deque

# 행동 이름 → (행 변화, 열 변화)
ACTIONS = {
    "UP": (-1, 0),
    "DOWN": (1, 0),
    "LEFT": (0, -1),
    "RIGHT": (0, 1),
}

REWARD_GOAL = 100
REWARD_MOVE = -1
REWARD_COLLISION = -10


class MazeEnv:
    def __init__(self, maze, max_turns=None):
        self.maze = maze
        self.rows = len(maze)
        self.cols = len(maze[0])
        self.start = (self.rows - 1, 0)         # 왼쪽 아래
        self.goal = (0, self.cols - 1)          # 오른쪽 위
        self.max_turns = max_turns or self.rows * self.cols * 2
        self.reset()

    # ---- 에피소드 시작 ---------------------------------------------------
    def reset(self):
        self.state = self.start
        self.turns = 0
        self.done = False
        self.reason = None                      # "goal" 또는 "max_turns"
        self.total_reward = 0
        self.collisions = 0
        self.visits = {self.start: 1}           # 칸별 방문 횟수
        self.history = []                       # 지금까지 고른 행동
        return self.state

    # ---- 칸 정보 ---------------------------------------------------------
    def in_bounds(self, cell):
        r, c = cell
        return 0 <= r < self.rows and 0 <= c < self.cols

    def is_free(self, cell):
        return self.in_bounds(cell) and self.maze[cell[0]][cell[1]] == 0

    def cell_type(self, cell):
        if not self.in_bounds(cell):
            return "edge"
        if self.maze[cell[0]][cell[1]] == 1:
            return "wall"
        if cell == self.goal:
            return "exit"
        return "free"

    def valid_actions(self, state=None):
        r, c = state or self.state
        return [a for a, (dr, dc) in ACTIONS.items() if self.is_free((r + dr, c + dc))]

    # ---- 한 턴 진행 ------------------------------------------------------
    def step(self, action):
        """행동을 하나 실행하고 (다음 상태, 보상, 끝났는지, 추가 정보)를 돌려줌."""
        if self.done:
            raise RuntimeError("에피소드가 끝났습니다. reset()을 먼저 호출하세요.")
        dr, dc = ACTIONS[action]
        nxt = (self.state[0] + dr, self.state[1] + dc)
        self.turns += 1
        self.history.append(action)

        collision = not self.is_free(nxt)
        if collision:
            reward = REWARD_COLLISION           # 제자리에 머무름
            self.collisions += 1
        else:
            self.state = nxt
            self.visits[nxt] = self.visits.get(nxt, 0) + 1
            reward = REWARD_GOAL if nxt == self.goal else REWARD_MOVE

        if self.state == self.goal:
            self.done, self.reason = True, "goal"
        elif self.turns >= self.max_turns:
            self.done, self.reason = True, "max_turns"

        self.total_reward += reward
        return self.state, reward, self.done, {"collision": collision}

    # ---- 최단 경로 (탐색 알고리즘에서 사용) ------------------------------
    def shortest_path(self, start=None, goal=None):
        """BFS로 찾은 최단 행동 목록. 길이 없으면 None."""
        start, goal = start or self.state, goal or self.goal
        prev = {start: None}
        queue = deque([start])
        while queue:
            cell = queue.popleft()
            if cell == goal:
                break
            for a, (dr, dc) in ACTIONS.items():
                nxt = (cell[0] + dr, cell[1] + dc)
                if nxt not in prev and self.is_free(nxt):
                    prev[nxt] = (cell, a)
                    queue.append(nxt)
        if goal not in prev:
            return None
        path, cell = [], goal
        while prev[cell] is not None:
            cell, a = prev[cell]
            path.append(a)
        return path[::-1]

    # ---- 화면 출력 -------------------------------------------------------
    def maze_rows(self):
        """A=에이전트, G=출구, S=시작, #=장애물, .=빈칸"""
        rows = []
        for r in range(self.rows):
            line = ""
            for c in range(self.cols):
                cell = (r, c)
                if cell == self.state:
                    line += "A"
                elif self.maze[r][c] == 1:
                    line += "#"
                elif cell == self.goal:
                    line += "G"
                elif cell == self.start:
                    line += "S"
                else:
                    line += "."
            rows.append(line)
        return rows

    def render(self):
        lines = ["    " + " ".join(str(c) for c in range(self.cols))]
        for r, row in enumerate(self.maze_rows()):
            lines.append(f"{r:3} " + " ".join(row))
        return "\n".join(lines)
