"""판단 관리자(Decider): 느린 두뇌와 빠른 세계 사이의 '시간 문제'를 해결합니다.

매 물리 주기(60Hz)마다 command(now)로 "지금 실행할 명령"을 내주고,
판단 주기(5Hz)마다 tick(world)로 두뇌에게 새 판단을 요청합니다.

다루는 규칙 (모두 끄고 켤 수 있음)
- mode="sync"   : 두뇌가 답할 때까지 프로그램 전체가 멈춤 (나쁜 예)
- mode="async"  : 두뇌는 뒤에서 생각하고, 그동안 세계·화면·안전 감시는 계속 돌아감
- budget        : 지연 시간 예산. 이보다 늦게 도착한 답은 '이미 지난 상황'이라 버림
- hold          : 새 답이 없을 때 이전 명령을 유지하는 최대 시간. 넘으면 안전 행동(HOVER)
- min_prob      : 답의 확률이 이보다 낮으면(자신 없으면) 안전 행동(HOVER)

latency(LatencyModel)를 주면 네트워크 지연을 '흉내'냅니다 (API 키 없이 실습 가능).
"""
import time
from concurrent.futures import ThreadPoolExecutor

from config import DECISION_HZ

SAFE_ACTION = "HOVER"


class Decider:
    def __init__(self, brain, mode="async", latency=None, budget=None, hold=None, min_prob=None,
                 decision_hz=DECISION_HZ, realtime=False):
        self.brain, self.mode, self.latency = brain, mode, latency
        self.budget, self.hold, self.min_prob = budget, hold, min_prob
        self.period = 1.0 / decision_hz
        self.realtime = realtime            # True면 지연을 실제로 기다림 (화면 모드)
        self.executor = ThreadPoolExecutor(max_workers=1) if brain.blocking_io and mode == "async" else None

        self.current = SAFE_ACTION          # 지금 실행 중인 명령
        self.status = "START"               # 화면에 보여 줄 상태
        self.last_fresh_t = 0.0             # 마지막으로 새 답을 적용한 시각
        self.next_tick_t = 0.0
        self.pending = None                 # 진행 중인 요청: dict
        self.last_decision = None
        self.last_latency = None
        self.log = []
        self.stats = {"requests": 0, "applied": 0, "late": 0, "low_conf": 0,
                      "timeouts": 0, "latencies": []}

    # ---- 판단 주기마다: 새 요청 보내기 ------------------------------------
    def tick(self, world):
        """판단할 때가 됐으면 두뇌에게 요청. sync 모드에서 멈춘 시간(초)을 돌려줌."""
        if world.t + 1e-9 < self.next_tick_t:
            return 0.0
        self.next_tick_t = world.t + self.period
        self._collect(world.t)              # 방금 도착한 답이 있으면 먼저 받고
        if self.pending is not None:        # 이전 요청이 아직 안 끝남 → 이번 판단은 건너뜀
            return 0.0

        snap = world.snapshot()             # 지금 이 순간의 복사본
        self.stats["requests"] += 1
        sent = world.t

        if self.mode == "sync":
            start = time.perf_counter()
            decision = self.brain.decide(snap)
            lat = self.latency.sample() if self.latency else 0.0
            if self.realtime and lat:
                time.sleep(lat)             # 흉내 낸 지연만큼 실제로 멈춤
            blocked = (time.perf_counter() - start) if self.realtime else lat
            self.pending = {"sent": sent, "arrive": sent + blocked, "decision": decision}
            return blocked                  # 호출한 쪽이 이 시간만큼 '눈 감고' 세계를 진행

        if self.executor:                   # 진짜 네트워크 호출 (Jev) → 다른 스레드에서
            self.pending = {"sent": sent, "future": self.executor.submit(self.brain.decide, snap)}
        else:                               # 흉내 낸 지연: 답은 지금 계산, 도착은 나중에
            lat = self.latency.sample() if self.latency else 0.0
            self.pending = {"sent": sent, "arrive": sent + lat, "decision": self.brain.decide(snap)}
        return 0.0

    # ---- 매 물리 주기마다: 도착한 답 확인 + 지금 실행할 명령 결정 -----------
    def command(self, now):
        self._collect(now)
        # 새 답이 오래 안 오면: 이전 명령 유지 → hold 초과 시 안전 행동
        if self.hold is not None and self.current != SAFE_ACTION and now - self.last_fresh_t > self.hold:
            self.current, self.status = SAFE_ACTION, "TIMEOUT"
            self.stats["timeouts"] += 1
        elif self.status in ("FRESH", "START") and now - self.last_fresh_t > self.period * 1.5:
            self.status = "HOLD"            # 새 답 없이 이전 명령을 유지하는 중
        return self.current

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
        age = now - p["sent"]                # 요청 시점부터 지금까지 걸린 시간
        self.last_latency = age
        self.last_decision = decision
        self.stats["latencies"].append(age)

        if self.budget is not None and age > self.budget:
            result = "LATE"                  # 예산 초과 → 버림 (이전 명령 계속)
            self.stats["late"] += 1
        elif self.min_prob is not None and decision.prob < self.min_prob:
            result = "LOW_CONF"              # 자신 없음 → 안전 행동
            self.current = SAFE_ACTION
            self.last_fresh_t = now
            self.stats["low_conf"] += 1
        else:
            result = "FRESH"
            self.current = decision.command
            self.last_fresh_t = now
            self.stats["applied"] += 1
        self.status = result
        self.log.append({"sent": round(p["sent"], 3), "arrived": round(now, 3), "age_s": round(age, 3),
                         "result": result, "command": decision.command, "prob": decision.prob,
                         "probabilities": decision.probabilities, "api_ms": decision.api_ms,
                         "state": decision.state})

    def close(self):
        if self.executor:
            self.executor.shutdown(wait=False, cancel_futures=True)
