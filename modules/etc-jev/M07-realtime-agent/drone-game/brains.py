"""두뇌(Brain): 관측 복사본(snapshot)을 보고 고수준 명령 하나를 고릅니다.

    RuleBrain : 목표 쪽으로 가되 센서 거리가 짧은 방향은 피하는 규칙 (비교 기준)
    JevBrain  : Jev에게 물어봄 (네트워크 호출이라 시간이 걸림)

두 두뇌 모두 decide(snapshot) → Decision 하나만 구현합니다.
"""
import random
import time
from dataclasses import dataclass, field

from config import UNSAFE_DIST
from controller import COMMANDS, DIRS


@dataclass
class Decision:
    command: str
    prob: float = 1.0                   # 고른 명령의 확률 (규칙은 항상 1.0)
    probabilities: dict | None = None
    api_ms: float | None = None         # 실제 API 응답 시간 (Jev만)
    state: dict | None = field(default=None, repr=False)


# ---------------------------------------------------------------------------
class RuleBrain:
    name = "rule"
    blocking_io = False                 # 계산이 즉시 끝남 (네트워크 없음)

    def decide(self, snap):
        tgt = snap["target"]
        if tgt is None:
            return Decision("HOVER")
        tx, ty = tgt["dx"] / tgt["distance"], tgt["dy"] / tgt["distance"]
        best, best_score = "HOVER", -9.0
        for cmd, (dx, dy) in DIRS.items():
            ray = snap["rays"][cmd]
            score = dx * tx + dy * ty                     # 목표 방향과 얼마나 같은가
            if ray < 1.0:
                score -= 2.0                              # 바로 앞이 막힘
            elif ray < 2.0 and ray < tgt["distance"]:
                score -= 0.6                              # 조금 앞이 막힘
            if score > best_score:
                best, best_score = cmd, score
        return Decision(best)


# ---------------------------------------------------------------------------
class NoisyBrain:
    """'확률을 정직하게 말하는 모델' 흉내 (API 키 없이 6단계 실습용).

    error_rate 확률로 엉뚱한 방향을 고르는데, 그때는 확률을 낮게(0.2~0.5) 말합니다.
    맞게 고를 때는 확률을 높게(0.6~0.95) 말합니다. Jev처럼 '보정된' 확률을 흉내 낸 것입니다.
    """
    name = "noisy"
    blocking_io = False

    def __init__(self, error_rate=0.25, seed=0):
        self.rule = RuleBrain()
        self.error_rate = error_rate
        self.rng = random.Random(seed)

    def decide(self, snap):
        good = self.rule.decide(snap)
        if self.rng.random() < self.error_rate:
            wrong = self.rng.choice([c for c in COMMANDS if c != good.command])
            return Decision(wrong, prob=round(self.rng.uniform(0.2, 0.5), 2))
        return Decision(good.command, prob=round(self.rng.uniform(0.6, 0.95), 2))


# ---------------------------------------------------------------------------
class LatencyModel:
    """네트워크 지연 흉내: 보통 base±jitter초, 가끔(spike_prob) spike초만큼 크게 늦음."""

    def __init__(self, base=0.3, jitter=0.1, spike_prob=0.0, spike=1.5, seed=0):
        self.base, self.jitter, self.spike_prob, self.spike = base, jitter, spike_prob, spike
        self.rng = random.Random(seed)

    def sample(self):
        lat = self.base + self.rng.uniform(-self.jitter, self.jitter)
        if self.rng.random() < self.spike_prob:
            lat += self.spike
        return max(0.0, lat)

    def __str__(self):
        s = f"{self.base:.2f}±{self.jitter:.2f}s"
        return s + (f", {self.spike_prob:.0%} 확률로 +{self.spike:.1f}s" if self.spike_prob else "")


# ---------------------------------------------------------------------------
ACTION_TEXT = {
    "N": "Fly north (y increases)", "NE": "Fly north-east", "E": "Fly east (x increases)",
    "SE": "Fly south-east", "S": "Fly south (y decreases)", "SW": "Fly south-west",
    "W": "Fly west (x decreases)", "NW": "Fly north-west", "HOVER": "Stop and hover in place",
}


class JevBrain:
    """Jev 두뇌. 막힌 방향은 선택지에서 빼고(행동 마스킹) 물어봅니다."""
    name = "jev"
    blocking_io = True                  # 네트워크 호출 → 시간이 걸림

    def __init__(self, model="jev-latest"):
        from typesafe_sdk import Choice, TypeSafeClient   # Jev를 쓸 때만 불러옴

        self.Choice = Choice
        self.client = TypeSafeClient(model=model)          # TYPESAFE_API_KEY를 자동으로 읽음

    def build_state(self, snap):
        return {
            "units": "meters and seconds; x grows to the east, y grows to the north",
            "drone_velocity": {"vx": snap["drone"]["vx"], "vy": snap["drone"]["vy"]},
            "target_item": snap["target"],             # dx, dy: 목표까지 상대 위치
            "range_sensors_m": snap["rays"],           # 8방향 거리 센서
            "obstacles_nearby": snap["obstacles_nearby"],
            "items_left": snap["items_left"],
            "decision_period_s": 0.2,
        }

    def decide(self, snap):
        state = self.build_state(snap)
        options = [c for c in DIRS if snap["rays"][c] >= UNSAFE_DIST] + ["HOVER"]
        question = self.Choice(
            instructions=(
                "Pick the flight direction for the next 0.2 seconds that moves the drone toward "
                "the target item while keeping clear of obstacles, including moving ones. "
                "Choose HOVER only if every direction is unsafe"
            ),
            criteria={c: ACTION_TEXT[c] for c in options},
        )
        start = time.perf_counter()
        response = self.client.system_one(state=state, questions={"command": question})
        api_ms = (time.perf_counter() - start) * 1000
        ans = response.choices["command"]
        probs = dict(ans.probabilities)
        return Decision(ans.choice, prob=probs.get(ans.choice, ans.confidence),
                        probabilities=probs, api_ms=api_ms, state=state)

    def close(self):
        self.client.close()


assert set(COMMANDS) == set(ACTION_TEXT), "명령 목록과 설명이 다릅니다"
