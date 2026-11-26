"""시뮬레이션 루프: 3계층을 60Hz로 연결합니다.

    매 물리 주기 (1/60초)
      [안전] 배터리 감시 → 필요하면 강제 RETURN / LAND
      [판단] 비행 단계면 판단 주기(5Hz)마다 두뇌에게 요청, 도착한 답의 '단계'를 임무에 적용
      [안전] 방향 감시 → 위험하면 HOVER
      [제어] 임무가 방향을 목표 속도로 바꾸고, PID가 추력을 계산
      [세계] 바람·배터리·충돌을 반영해 한 주기 진행
"""
import json
import time
from datetime import datetime
from pathlib import Path

from config import JEV_USD_PER_M_INPUT, PHYSICS_HZ, RESERVE_PCT, TIME_LIMIT
from mission import FLIGHT_PHASES

DT = 1.0 / PHYSICS_HZ


def physics_tick(world, mission, decider, safety, pilot, was_flying):
    if safety is not None:
        safety.check_mission(world, mission)
    heading = "HOVER"
    flying = mission.phase in FLIGHT_PHASES
    if flying and decider is not None:
        if not was_flying:
            decider.reset_clock(world.t)
        blocked = decider.tick(world.t, mission.observe)
        if blocked:                                  # sync: 기다리는 동안 눈 감고 비행
            for _ in range(int(round(blocked / DT))):
                acc, climb = mission.control(decider.heading, DT)
                world.step(DT, acc, climb)
                if mission.done:
                    return flying
        heading = decider.command(world.t)
        phase = decider.pop_phase()
        if phase:
            mission.apply(phase)
    elif flying and pilot is not None:
        heading, phase = pilot.command()
        if phase:
            mission.apply(phase, who="pilot")
    if safety is not None and mission.phase in FLIGHT_PHASES:
        heading = safety.filter_heading(world, mission, heading)
    acc, climb = mission.control(heading, DT)
    world.step(DT, acc, climb)
    return flying


def run_mission(world, mission, decider=None, safety=None, pilot=None, renderer=None, realtime=False,
                log_name=None, time_limit=TIME_LIMIT):
    start = time.perf_counter()
    flying = False
    quit_early = False
    try:
        while not mission.done and world.t < time_limit:
            if renderer is not None and not renderer.handle_events(mission):
                quit_early = True
                break
            if realtime:
                wall = time.perf_counter() - start
                while world.t < wall and not mission.done and world.t < time_limit:
                    flying = physics_tick(world, mission, decider, safety, pilot, flying)
            else:
                flying = physics_tick(world, mission, decider, safety, pilot, flying)
            if renderer is not None:
                renderer.draw(world, mission, decider, safety)
            elif realtime:
                time.sleep(0.001)
    finally:
        if decider is not None:
            decider.close()

    result = evaluate(world, mission, decider, safety, "quit" if quit_early else None)
    if log_name:
        result["log"] = str(save_log(log_name, world, mission, decider, result))
    return result


def evaluate(world, mission, decider, safety, override=None):
    """한 임무의 평가 지표."""
    outcome = override or mission.outcome or "timeout"
    clean = world.collisions == 0 and world.fence_violations == 0 and world.nofly_violations == 0
    reserve_ok = world.drone.battery >= RESERVE_PCT
    safe = outcome == "landed_home" and clean and reserve_ok
    r = {
        "outcome": outcome,
        "mission_complete": safe and mission.wp >= len(world.waypoints),   # 모든 경유지 + 무사고 귀환
        "safe_return": safe,                                  # 충돌·위반 없이, 예비 배터리를 남기고 집에 착륙
        "reserve_breach": outcome == "landed_home" and not reserve_ok,     # 집엔 왔지만 예비 배터리를 써 버림
        "waypoints_done": min(mission.wp, len(world.waypoints)),
        "waypoints_total": len(world.waypoints),
        "collisions": world.collisions,
        "violations": world.fence_violations + world.nofly_violations,
        "time_s": round(world.t, 1),
        "battery_left": round(world.drone.battery, 1),
        "safety_interventions": safety.total if safety else 0,
        "safety_detail": dict(safety.counts) if safety else {},
        "phase_log": mission.log,
    }
    if decider is not None:
        s = decider.stats
        lats = sorted(s["latencies"])
        p95 = lats[min(len(lats) - 1, int(len(lats) * 0.95))] if lats else None
        r.update({
            "brain": decider.brain.name, "requests": s["requests"], "applied": s["applied"],
            "late": s["late"], "low_conf": s["low_conf"], "timeouts": s["timeouts"],
            "latency_avg_s": round(sum(lats) / len(lats), 3) if lats else None,
            "latency_p95_s": round(p95, 3) if p95 is not None else None,
            "input_tokens": s["input_tokens"],
            "cost_usd": round(s["input_tokens"] * JEV_USD_PER_M_INPUT / 1e6, 6),
        })
    return r


def save_log(name, world, mission, decider, result):
    folder = Path(__file__).with_name("logs")
    folder.mkdir(exist_ok=True)
    path = folder / f"{name}_{datetime.now():%Y%m%d_%H%M%S}.jsonl"
    with path.open("w", encoding="utf-8") as f:
        for row in (decider.log if decider else []):
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
        f.write(json.dumps({"result": result}, ensure_ascii=False) + "\n")
    return path


OUTCOME_KO = {"landed_home": "집에 착륙", "landed_away": "비상 착륙(집 밖)", "crashed": "추락(배터리 방전)",
              "timeout": "시간 초과", "quit": "중단"}


def print_result(r):
    print("=" * 50)
    print(f"결과           : {OUTCOME_KO.get(r['outcome'], r['outcome'])} ({r['time_s']}초)")
    print(f"임무 완수      : {'예' if r['mission_complete'] else '아니오'} "
          f"(경유지 {r['waypoints_done']}/{r['waypoints_total']})")
    print(f"무사고 귀환    : {'예' if r['safe_return'] else '아니오'}"
          + (" (예비 배터리 침범)" if r["reserve_breach"] else ""))
    print(f"충돌 / 위반    : {r['collisions']}회 / {r['violations']}회")
    print(f"남은 배터리    : {r['battery_left']}%")
    detail = ", ".join(f"{k} {v}" for k, v in r["safety_detail"].items() if v)
    print(f"안전 감시 개입 : {r['safety_interventions']}회" + (f" ({detail})" if detail else ""))
    if "requests" in r:
        print(f"판단 요청      : {r['requests']}회 (적용 {r['applied']}, 늦어서 버림 {r['late']}, "
              f"자신 없음 {r['low_conf']}, 시간 초과 {r['timeouts']})")
        if r["latency_avg_s"] is not None:
            print(f"응답 지연      : 평균 {r['latency_avg_s']}초, p95 {r['latency_p95_s']}초")
        if r["input_tokens"]:
            print(f"입력 토큰·비용 : {r['input_tokens']:,}토큰, 약 ${r['cost_usd']:.4f}")
    print("단계 기록      : " + " → ".join(f"{p}({t}s)" for t, p, _ in r["phase_log"]))
    if r.get("log"):
        print(f"로그           : {r['log']}")

