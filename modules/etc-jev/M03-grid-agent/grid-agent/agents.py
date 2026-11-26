"""에이전트: 지금 상황을 보고 다음 행동을 고르는 쪽.

- ManualAgent : 사람이 키보드로 고름
- RuleAgent   : 목표 쪽으로 가는 단순 규칙 (비교 기준)
- JevAgent    : Jev에게 물어서 고름
"""
import time
from dataclasses import dataclass, field

from grid import MOVES


@dataclass
class Decision:
    move: str                           # 고른 행동
    probabilities: dict | None = None   # 행동별 확률 (Jev만)
    return_home: float | None = None    # "지금 복귀해야 한다"가 참일 확률 (4단계)
    latency_ms: float | None = None     # Jev 응답 시간
    state: dict | None = field(default=None, repr=False)  # Jev에게 보낸 state


def manhattan(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])


def needs_return(world):
    """규칙: 남은 배터리로 '목표 → 집'을 다 못 가면 복귀해야 함."""
    to_goal = world.distance(world.pos, world.goal)
    goal_home = world.distance(world.goal, world.home)
    return world.battery < to_goal + goal_home


# ---------------------------------------------------------------------------
class ManualAgent:
    name = "manual"
    KEYS = {"w": "up", "s": "down", "a": "left", "d": "right"}

    def decide(self, world, target_name, target, ask_return):
        while True:
            key = input("이동 (w=위, s=아래, a=왼쪽, d=오른쪽, q=종료): ").strip().lower()
            if key == "q":
                raise KeyboardInterrupt
            if key in self.KEYS:
                return Decision(move=self.KEYS[key])


# ---------------------------------------------------------------------------
class RuleAgent:
    """목표와의 거리(맨해튼 거리)를 줄이는 방향으로만 가는 단순 규칙."""
    name = "rule"

    def decide(self, world, target_name, target, ask_return):
        x, y = world.pos
        legal = world.legal_moves()
        # 갈 수 있는 행동 중 목표와의 거리가 줄어드는 것
        closer = [
            m for m in legal
            if manhattan((x + MOVES[m][0], y + MOVES[m][1]), target) < manhattan(world.pos, target)
        ]
        move = closer[0] if closer else (legal[0] if legal else "up")
        ret = None
        if ask_return:
            ret = 1.0 if needs_return(world) else 0.0
        return Decision(move=move, return_home=ret)


# ---------------------------------------------------------------------------
class JevAgent:
    """Jev에게 state를 보내고 행동을 받아 오는 에이전트.

    show_neighbors : 상하좌우 칸 정보(free/wall/edge)를 state에 넣을지
    show_map       : 지도 전체(글자 그림)를 state에 넣을지
    """
    name = "jev"

    def __init__(self, show_neighbors=False, show_map=False, model="jev-latest"):
        # SDK는 Jev를 쓸 때만 불러옵니다 (1~2단계는 키 없이 실행 가능)
        from typesafe_sdk import Choice, Noul, TypeSafeClient

        self.show_neighbors = show_neighbors
        self.show_map = show_map
        self.client = TypeSafeClient(model=model)   # TYPESAFE_API_KEY를 자동으로 읽음

        self.move_question = Choice(
            instructions=(
                "Pick the single move that brings the drone closer to the target "
                "without hitting a wall or leaving the grid"
            ),
            criteria={
                "up": "Move up: y decreases by 1",
                "down": "Move down: y increases by 1",
                "left": "Move left: x decreases by 1",
                "right": "Move right: x increases by 1",
            },
        )
        self.return_question = Noul(
            instructions=(
                "The remaining battery is NOT enough to fly to the goal and then back home, "
                "so the drone should return home now"
            ),
        )

    # ---- state 만들기: 이 모듈에서 가장 중요한 부분 -----------------------
    def build_state(self, world, target_name, target, ask_return):
        state = {
            "grid_size": {"width": world.width, "height": world.height},
            "coordinate_system": "x grows to the right, y grows downward, (0,0) is the top-left cell",
            "drone": {"x": world.pos[0], "y": world.pos[1]},
            "target": {"name": target_name, "x": target[0], "y": target[1]},
            "recent_moves": world.moves[-4:],
        }
        if self.show_neighbors:
            state["neighbors"] = world.neighbors()     # 예: {"up": "wall", "down": "free", ...}
        if self.show_map:
            state["map"] = world.map_rows()
            state["map_legend"] = "D=drone, G=goal, H=home, #=wall, .=free"
        if world.battery is not None:
            state["battery"] = world.battery
            state["goal_visited"] = world.goal_visited
            state["steps_to_home"] = world.distance(world.pos, world.home)
            state["headwind_chance"] = world.wind      # 한 걸음에 배터리를 2 쓸 확률
            if ask_return:
                state["steps_to_goal"] = world.distance(world.pos, world.goal)
                state["steps_goal_to_home"] = world.distance(world.goal, world.home)
        return state

    def decide(self, world, target_name, target, ask_return):
        state = self.build_state(world, target_name, target, ask_return)
        questions = {"move": self.move_question}
        if ask_return:
            questions["return_home"] = self.return_question

        start = time.perf_counter()
        response = self.client.system_one(state=state, questions=questions)
        latency_ms = (time.perf_counter() - start) * 1000

        move = response.choices["move"]
        ret = response.nouls["return_home"].noul if ask_return else None
        return Decision(
            move=move.choice,
            probabilities=dict(move.probabilities),
            return_home=ret,
            latency_ms=latency_ms,
            state=state,
        )

    def close(self):
        self.client.close()
