"""에이전트(Policy): 환경을 보고 다음 행동을 고르는 전략.

모든 에이전트는 같은 모양을 가집니다.
    name        : 이름
    reset()     : 새 에피소드를 시작할 때 호출 (기억 지우기)
    act(env)    : 다음 행동("UP"/"DOWN"/"LEFT"/"RIGHT")을 돌려줌

단계별 에이전트
    ManualAgent       사람
    RandomAgent       무작위
    GreedyAgent       규칙 기반 1: 출구 쪽으로 가기
    WallFollowerAgent 규칙 기반 2: 우수법 (오른손을 벽에 대고 걷기)
    BFSAgent          탐색 알고리즘: 지도 전체를 보고 최단 경로 계산
    JevAgent          Jev: 학습 없이 지금 상황을 보고 바로 판단 (System 1)
"""
import random
import time

from env import ACTIONS


class Agent:
    name = "agent"
    last = None                         # 마지막 판단 정보 (로그용)

    def reset(self):
        pass

    def act(self, env):
        raise NotImplementedError


# ---------------------------------------------------------------------------
class ManualAgent(Agent):
    name = "manual"
    KEYS = {"w": "UP", "s": "DOWN", "a": "LEFT", "d": "RIGHT"}

    def act(self, env):
        while True:
            key = input("이동 (w=위, s=아래, a=왼쪽, d=오른쪽, q=종료): ").strip().lower()
            if key == "q":
                raise KeyboardInterrupt
            if key in self.KEYS:
                return self.KEYS[key]


# ---------------------------------------------------------------------------
class RandomAgent(Agent):
    """무작위로 고름. valid_only=True면 갈 수 있는 방향 중에서만 고름."""
    name = "random"

    def __init__(self, seed=None, valid_only=False):
        self.rng = random.Random(seed)
        self.valid_only = valid_only

    def act(self, env):
        options = env.valid_actions() if self.valid_only else list(ACTIONS)
        return self.rng.choice(options)


# ---------------------------------------------------------------------------
def manhattan(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


class GreedyAgent(Agent):
    """출구와의 거리가 줄어드는 방향으로 감. 없으면 갈 수 있는 첫 방향."""
    name = "greedy"

    def act(self, env):
        r, c = env.state
        valid = env.valid_actions()
        closer = [a for a in valid
                  if manhattan((r + ACTIONS[a][0], c + ACTIONS[a][1]), env.goal) < manhattan(env.state, env.goal)]
        return closer[0] if closer else valid[0]


# ---------------------------------------------------------------------------
CLOCKWISE = ["UP", "RIGHT", "DOWN", "LEFT"]


class WallFollowerAgent(Agent):
    """우수법: 오른쪽 → 앞 → 왼쪽 → 뒤 순서로, 처음 갈 수 있는 방향으로 감.

    '앞'은 직전에 움직인 방향입니다 (처음엔 위). 그래서 다른 에이전트가 움직이던 중간에
    끼어들어도(6단계의 대체 정책) 바로 이어서 쓸 수 있습니다.
    """
    name = "wall"

    def act(self, env):
        heading = env.history[-1] if env.history else "UP"
        i = CLOCKWISE.index(heading)
        right, front, left, back = (CLOCKWISE[(i + k) % 4] for k in (1, 0, 3, 2))
        valid = env.valid_actions()
        for a in (right, front, left, back):
            if a in valid:
                return a
        return front


# ---------------------------------------------------------------------------
class BFSAgent(Agent):
    """탐색 알고리즘: 시작할 때 지도 전체로 최단 경로를 계산해 두고 그대로 따라감."""
    name = "bfs"

    def reset(self):
        self.plan = None

    def act(self, env):
        if not self.plan:
            self.plan = env.shortest_path()
        return self.plan.pop(0)


# ---------------------------------------------------------------------------
ACTION_TEXT = {
    "UP": "Move up: row decreases by 1",
    "DOWN": "Move down: row increases by 1",
    "LEFT": "Move left: column decreases by 1",
    "RIGHT": "Move right: column increases by 1",
}


class JevAgent(Agent):
    """Jev에게 관측(state)을 보내고 다음 행동을 받아 옴.

    view = "full"  : 미로 전체를 보여 줌 (지도가 있는 상황)
    view = "local" : 주변 3x3만 보여 줌 (센서만 있는 상황, 드론과 비슷)
    mask = True    : 갈 수 있는 방향만 선택지로 줌 (행동 마스킹)
    fallback = 0.6 : Jev가 고른 행동의 확률이 이 값보다 낮으면(애매하면) 우수법으로 대신 움직임
    """
    name = "jev"

    def __init__(self, view="full", mask=True, fallback=None, model="jev-latest"):
        from typesafe_sdk import Choice, TypeSafeClient   # Jev를 쓸 때만 불러옴

        self.Choice = Choice
        self.view, self.mask, self.fallback = view, mask, fallback
        self.backup = WallFollowerAgent()                  # 애매할 때 쓸 대체 정책
        self.name = f"jev-{view}" + ("" if mask else "-nomask") + ("-fb" if fallback else "")
        self.client = TypeSafeClient(model=model)          # TYPESAFE_API_KEY를 자동으로 읽음
        self.calls = 0

    # ---- 관측 만들기 ------------------------------------------------------
    def build_state(self, env):
        r, c = env.state
        gr, gc = env.goal
        state = {
            "coordinate_system": "(row, col); row grows downward, col grows to the right, (0,0) is top-left",
            "agent": {"row": r, "col": c},
            "exit": {"row": gr, "col": gc},
            "exit_direction": {"rows_up": r - gr, "cols_right": gc - c},
            "recent_actions": env.history[-4:],
        }
        if self.view == "full":
            state["maze"] = env.maze_rows()
            state["maze_legend"] = "A=agent, G=exit, S=start, #=obstacle, .=free"
            state["visited_cells"] = [list(cell) for cell in env.visits]
        else:
            # 주변 3x3과, 상하좌우 칸의 종류·방문 횟수 (센서 + 짧은 기억)
            around = []
            for dr in (-1, 0, 1):
                line = ""
                for dc in (-1, 0, 1):
                    cell = (r + dr, c + dc)
                    t = env.cell_type(cell)
                    line += "A" if (dr, dc) == (0, 0) else {"edge": "X", "wall": "#", "exit": "G", "free": "."}[t]
                around.append(line)
            state["surroundings_3x3"] = around
            state["surroundings_legend"] = "A=agent, G=exit, #=obstacle, X=outside the maze, .=free"
            state["neighbors"] = {
                a: {"cell": env.cell_type((r + dr, c + dc)), "times_visited": env.visits.get((r + dr, c + dc), 0)}
                for a, (dr, dc) in ACTIONS.items()
            }
        return state

    # ---- 행동 고르기 ------------------------------------------------------
    def act(self, env):
        options = env.valid_actions() if self.mask else list(ACTIONS)
        if len(options) == 1:                       # 고를 게 하나뿐이면 묻지 않음
            self.last = {"skipped": True, "options": options}
            return options[0]

        state = self.build_state(env)
        question = self.Choice(
            instructions=(
                "Pick the next move that leads the agent out of the maze to the exit. "
                "Prefer cells that were not visited before and avoid going back and forth"
            ),
            criteria={a: ACTION_TEXT[a] for a in options},
        )
        start = time.perf_counter()
        response = self.client.system_one(state=state, questions={"move": question})
        latency_ms = (time.perf_counter() - start) * 1000
        self.calls += 1

        move = response.choices["move"]
        prob = move.probabilities[move.choice]
        action = move.choice
        used_fallback = self.fallback is not None and prob < self.fallback
        if used_fallback:
            action = self.backup.act(env)          # Jev가 확신하지 못함 → 우수법으로 대체
        self.last = {
            "skipped": False, "options": options, "jev_choice": move.choice,
            "probabilities": dict(move.probabilities), "confidence": move.confidence,
            "fallback": used_fallback, "latency_ms": latency_ms, "state": state,
        }
        return action

    def close(self):
        self.client.close()
