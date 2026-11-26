"""판단 관리자 — M07의 Decider를 그대로 가져와 '단계 + 방향' 결정을 다루도록 넓혔습니다.

- mode="async" : 두뇌는 다른 스레드에서, 나머지는 60Hz로 계속
- budget       : 이보다 늦게 도착한 답은 버림
- hold         : 새 답이 이보다 오래 없으면 HOVER
- min_prob     : 답의 확률이 이보다 낮으면 HOVER (단계는 바꾸지 않음)
"""
import time
from concurrent.futures import ThreadPoolExecutor

from config import DECISION_HZ


class Decider:
    def __init__(self, brain, mode="async", latency=None, budget=0.6, hold=0.8, min_prob=None,
                 decision_hz=DECISION_HZ, realtime=False):
        self.brain, self.mode, self.latency = brain, mode, latency
        self.budget, self.hold, self.min_prob = budget, hold, min_prob
        self.period = 1.0 / decision_hz
        self.realtime = realtime
        self.executor = ThreadPoolExecutor(max_workers=1) if brain.blocking_io and mode == "async" else None

        self.heading = "HOVER"
        self.new_phase = None               # 아직 적용 안 된 단계 결정
        self.status = "START"
        self.last_fresh_t = 0.0
        self.next_tick_t = 0.0
        self.pending = None
        self.last_latency = None
        self.log = []
        self.stats = {"requests": 0, "applied": 0, "late": 0, "low_conf": 0, "timeouts": 0,
                      "latencies": [], "input_tokens": 0}

    def tick(self, now, observe):
        """판단 주기가 되면 요청. sync 모드에서는 멈춘 시간(초)을 돌려줌."""
        if now + 1e-9 < self.next_tick_t:
            return 0.0
        self.next_tick_t = now + self.period
        self._collect(now)
        if self.pending is not None:
            return 0.0
        obs = observe()
        self.stats["requests"] += 1
        if self.mode == "sync":
            start = time.perf_counter()
            decision = self.brain.decide(obs)
            lat = self.latency.sample() if self.latency else 0.0
            if self.realtime and lat:
                time.sleep(lat)
            blocked = (time.perf_counter() - start) if self.realtime else lat
            self.pending = {"sent": now, "arrive": now + blocked, "decision": decision}
            return blocked
        if self.executor:
            self.pending = {"sent": now, "future": self.executor.submit(self.brain.decide, obs)}
        else:
            lat = self.latency.sample() if self.latency else 0.0
            self.pending = {"sent": now, "arrive": now + lat, "decision": self.brain.decide(obs)}
        return 0.0

    def command(self, now):
        self._collect(now)
        if self.hold is not None and self.heading != "HOVER" and now - self.last_fresh_t > self.hold:
            self.heading, self.status = "HOVER", "TIMEOUT"
            self.stats["timeouts"] += 1
        elif self.status in ("FRESH", "START") and now - self.last_fresh_t > self.period * 1.5:
            self.status = "HOLD"
        return self.heading

    def pop_phase(self):
        p, self.new_phase = self.new_phase, None
        return p

    def reset_clock(self, now):
        """비행 단계가 아닌 동안(이륙·착륙)은 판단하지 않으므로, 다시 시작할 때 시계를 맞춤."""
        self.last_fresh_t = now

    def _collect(self, now):
        p = self.pending
        if p is None:
            return
        if "future" in p:
            if not p["future"].done():
                return
            decision = p["future"].result()
        else:
            if now + 1e-9 < p["arrive"]:
                return
            decision = p["decision"]
        self.pending = None
        age = now - p["sent"]
        self.last_latency = age
        self.stats["latencies"].append(age)
        self.stats["input_tokens"] += decision.input_tokens or 0

        if self.budget is not None and age > self.budget:
            result = "LATE"
            self.stats["late"] += 1
        elif self.min_prob is not None and decision.prob < self.min_prob:
            result = "LOW_CONF"
            self.heading = "HOVER"
            self.last_fresh_t = now
            self.stats["low_conf"] += 1
        else:
            result = "FRESH"
            self.heading = decision.heading
            self.new_phase = decision.phase
            self.last_fresh_t = now
            self.stats["applied"] += 1
        self.status = result
        self.log.append({"sent": round(p["sent"], 3), "arrived": round(now, 3), "age_s": round(age, 3),
                         "result": result, "phase": decision.phase, "heading": decision.heading,
                         "prob": decision.prob, "probabilities": decision.probabilities,
                         "api_ms": decision.api_ms, "input_tokens": decision.input_tokens,
                         "state": decision.state})

    def close(self):
        if self.executor:
            self.executor.shutdown(wait=False, cancel_futures=True)
