"""판단 계층(두뇌): 관측(observe() 복사본)을 보고 두 가지를 고릅니다.

    phase   : 임무 단계 — TRANSIT(계속) / AVOID(회피) / RETURN(복귀)   (허용된 것 중에서)
    heading : 비행 방향 — 8방향 + HOVER

    RuleBrain : 규칙 (careful=False면 비행 금지 구역·배터리를 무시하는 '부주의한' 규칙)
    JevBrain  : Jev에게 두 질문을 한 번에 물어봄
"""
import json
import math
import random
import time
from dataclasses import dataclass, field

from config import FENCE_MARGIN, RESERVE_PCT, UNSAFE_DIST
from physics import DIRS


@dataclass
class Decision:
    phase: str
    heading: str
    prob: float = 1.0                          # 두 답 중 낮은 쪽 확률 (규칙은 1.0)
    probabilities: dict | None = None
    api_ms: float | None = None
    input_tokens: int | None = None
    state: dict | None = field(default=None, repr=False)


def risky_dirs(obs, look=1.5):
    """그 방향으로 가면 위험한 방향들: 장애물이 가깝거나, 비행 금지 구역·지오펜스에 닿음."""
    risky = set()
    for name, (dx, dy) in DIRS.items():
        if obs["range_sensors_m"][name] < UNSAFE_DIST:
            risky.add(name)
            continue
        px, py = dx * look, dy * look                     # look m 앞 지점 (드론 기준 상대 좌표)
        for z in obs["nofly_zones_nearby"]:
            if math.hypot(px - z["dx"], py - z["dy"]) < z["radius"] + 0.6:
                risky.add(name)
        m = obs["geofence_margin_m"]
        if (dx > 0 and m["E"] - px < FENCE_MARGIN) or (dx < 0 and m["W"] + px < FENCE_MARGIN) or \
           (dy > 0 and m["N"] - py < FENCE_MARGIN) or (dy < 0 and m["S"] + py < FENCE_MARGIN):
            risky.add(name)
    return risky


# ---------------------------------------------------------------------------
class RuleBrain:
    blocking_io = False

    def __init__(self, careful=True):
        self.careful = careful
        self.name = "rule" if careful else "rule-naive"
        self.last = None                                  # 직전 방향 (같은 쪽으로 계속 돌아가게)

    def decide(self, obs):
        tgt = obs["target"]
        # 1) 단계
        if obs["returning"]:
            phase = "RETURN"
        elif self.careful and obs["battery_pct"] < obs["battery_needed_finish_mission_pct"] + RESERVE_PCT:
            phase = "RETURN"                              # 끝까지 가면 못 돌아옴 → 지금 복귀
        else:
            phase = "TRANSIT"
        if phase == "RETURN":
            tgt = obs["home"]
        # 2) 방향: 목표 쪽 + 위험 방향 피하기
        tx, ty = tgt["dx"] / max(tgt["distance"], 1e-6), tgt["dy"] / max(tgt["distance"], 1e-6)
        risky = risky_dirs(obs) if self.careful else {n for n, r in obs["range_sensors_m"].items() if r < UNSAFE_DIST}
        best, best_score = "HOVER", -9.0
        for name, (dx, dy) in DIRS.items():
            score = dx * tx + dy * ty
            ray = obs["range_sensors_m"][name]
            if name in risky:
                score -= 3.0
            elif ray < 2.0 and ray < tgt["distance"]:
                score -= 0.6
            if self.last in DIRS:                         # 관성 보너스: 앞뒤로 왔다 갔다 하지 않게
                lx, ly = DIRS[self.last]
                score += 0.4 * (dx * lx + dy * ly)
            if score > best_score:
                best, best_score = name, score
        self.last = best
        # 3) 목표에서 50도 넘게 꺾어 가면 '회피' 단계 (처음 복귀를 결정한 순간은 RETURN이 우선)
        detour = best == "HOVER" or DIRS[best][0] * tx + DIRS[best][1] * ty < 0.64
        if phase != "RETURN" or obs["returning"]:
            if detour:
                phase = "AVOID"
            else:
                phase = "RETURN" if obs["returning"] else "TRANSIT"
        if phase not in obs["allowed_phases"]:
            phase = obs["allowed_phases"][0] if obs["allowed_phases"] else obs["phase"]
        return Decision(phase, best)


# ---------------------------------------------------------------------------
class LatencyModel:
    """네트워크 지연 흉내 (M07과 같음)."""

    def __init__(self, base=0.3, jitter=0.1, spike_prob=0.0, spike=1.5, seed=0):
        self.base, self.jitter, self.spike_prob, self.spike = base, jitter, spike_prob, spike
        self.rng = random.Random(seed)

    def sample(self):
        lat = self.base + self.rng.uniform(-self.jitter, self.jitter)
        if self.rng.random() < self.spike_prob:
            lat += self.spike
        return max(0.0, lat)


# ---------------------------------------------------------------------------
PHASE_TEXT = {
    "TRANSIT": "Keep flying toward the current waypoint",
    "AVOID": "The direct path is blocked by an obstacle, no-fly zone or geofence; fly a slow detour",
    "RETURN": "Fly back home now (if not already returning, this abandons the remaining waypoints for good)",
}
HEADING_TEXT = {
    "N": "Fly north (y increases)", "NE": "Fly north-east", "E": "Fly east (x increases)",
    "SE": "Fly south-east", "S": "Fly south (y decreases)", "SW": "Fly south-west",
    "W": "Fly west (x decreases)", "NW": "Fly north-west", "HOVER": "Hold position",
}


class JevBrain:
    """Jev 판단 계층. 단계와 방향을 한 번의 호출로 함께 묻습니다 (질문은 병렬로 평가됨)."""
    name = "jev"
    blocking_io = True

    def __init__(self, model="jev-latest"):
        from typesafe_sdk import Choice, TypeSafeClient   # Jev를 쓸 때만 불러옴

        self.Choice = Choice
        self.client = TypeSafeClient(model=model)          # TYPESAFE_API_KEY를 자동으로 읽음

    def decide(self, obs):
        state = dict(obs, units="meters, seconds, battery percent; x grows east, y grows north")
        phases = obs["allowed_phases"]
        headings = [h for h in DIRS if h not in risky_dirs(obs)] + ["HOVER"]   # 행동 마스킹
        questions = {
            "phase": self.Choice(
                instructions=(
                    "Decide the drone's mission phase for the next moment. Return home if the battery "
                    "would not cover finishing the mission plus the reserve, or if conditions are too risky"
                ),
                criteria={p: PHASE_TEXT[p] for p in phases},
            ),
            "heading": self.Choice(
                instructions=(
                    "Pick the flight direction for the next 0.2 seconds: toward home when returning, "
                    "otherwise toward the target, while keeping clear of obstacles, no-fly zones and the geofence"
                ),
                criteria={h: HEADING_TEXT[h] for h in headings},
            ),
        }
        start = time.perf_counter()
        response = self.client.system_one(state=state, questions=questions)
        api_ms = (time.perf_counter() - start) * 1000

        ph, hd = response.choices["phase"], response.choices["heading"]
        p_phase = dict(ph.probabilities).get(ph.choice, ph.confidence)
        p_head = dict(hd.probabilities).get(hd.choice, hd.confidence)
        usage = getattr(response, "usage", None)
        tokens = getattr(usage, "input_tokens", None) if usage is not None else None
        if tokens is None:                                 # 사용량이 없으면 대략 4글자 = 1토큰으로 추정
            tokens = len(json.dumps(state)) // 4 + 150
        return Decision(ph.choice, hd.choice, prob=min(p_phase, p_head),
                        probabilities={"phase": dict(ph.probabilities), "heading": dict(hd.probabilities)},
                        api_ms=api_ms, input_tokens=tokens, state=state)

    def close(self):
        self.client.close()
