"""시뮬레이션 루프: 세 가지 주기(물리 60Hz, 판단 5Hz, 화면 60FPS)를 한 루프에서 돌립니다.

    매 물리 주기 (1/60초):
        1. 판단 주기가 됐으면 두뇌에게 요청 (decider.tick)
        2. 지금 실행할 명령 결정 (decider.command)   ← 도착한 답, 예산, 유지, 안전 행동
        3. 안전 감시 (safety.filter)                  ← 60Hz로 매번
        4. 세계 한 주기 진행 (world.step)
    화면이 있으면 프레임마다 그림.

realtime=False면 시계를 기다리지 않고 최대한 빨리 돌립니다 (흉내 낸 지연만 쓸 때, 비교 실험용).
"""
import json
import time
from datetime import datetime
from pathlib import Path

from config import PHYSICS_HZ

DT = 1.0 / PHYSICS_HZ


def advance_blind(world, seconds, command):
    """sync 모드에서 두뇌를 기다린 시간만큼, 이전 명령 그대로·안전 감시 없이 세계를 진행.
    (프로그램은 멈춰 있어도 실제 드론은 계속 날아가고 있기 때문)"""
    for _ in range(int(round(seconds / DT))):
        world.step(DT, command)
        if world.done:
            break


def physics_tick(world, decider, safety, pilot):
    if decider is not None:
        blocked = decider.tick(world)
        if blocked:
            advance_blind(world, blocked, decider.current)
            if world.done:
                return
        command = decider.command(world.t)
    else:
        command = pilot.command()
    if safety is not None:
        command = safety.filter(world, command)
    world.step(DT, command)


def run_episode(world, decider=None, safety=None, pilot=None, renderer=None, realtime=False,
                log_name=None):
    start = time.perf_counter()
    frames = 0
    quit_early = False
    try:
        while not world.done:
            if renderer is not None and not renderer.handle_events():
                quit_early = True
                break
            if realtime:
                wall = time.perf_counter() - start
                while world.t < wall and not world.done:
                    physics_tick(world, decider, safety, pilot)
            else:
                physics_tick(world, decider, safety, pilot)
            if renderer is not None:
                renderer.draw(world, decider, safety)
                frames += 1
            elif realtime:
                time.sleep(0.001)
    finally:
        if decider is not None:
            decider.close()

    elapsed = time.perf_counter() - start
    result = {
        "level": world.level,
        "outcome": "quit" if quit_early else world.reason,
        "items": world.collected,
        "collisions": world.collisions,
        "score": world.score(),
        "time_s": round(world.t, 1),
        "safety_stops": safety.interventions if safety else 0,
        "avg_fps": round(frames / elapsed) if renderer is not None and elapsed > 0 else None,
    }
    if decider is not None:
        s = decider.stats
        lats = s["latencies"]
        result.update({
            "brain": decider.brain.name, "mode": decider.mode,
            "requests": s["requests"], "applied": s["applied"], "late": s["late"],
            "low_conf": s["low_conf"], "timeouts": s["timeouts"],
            "avg_latency_s": round(sum(lats) / len(lats), 3) if lats else None,
            "max_latency_s": round(max(lats), 3) if lats else None,
        })
        if log_name:
            result["log"] = str(save_log(log_name, decider.log, result))
    return result


def save_log(name, log, result):
    folder = Path(__file__).with_name("logs")
    folder.mkdir(exist_ok=True)
    path = folder / f"{name}_{datetime.now():%Y%m%d_%H%M%S}.jsonl"
    with path.open("w", encoding="utf-8") as f:
        for row in log:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
        f.write(json.dumps({"result": result}, ensure_ascii=False) + "\n")
    return path


OUTCOME_KO = {"all_items": "모두 수집", "time_limit": "시간 종료", "quit": "중단"}


def print_result(r):
    print("=" * 44)
    print(f"결과          : {OUTCOME_KO.get(r['outcome'], r['outcome'])} ({r['time_s']}초)")
    print(f"수집 / 충돌   : {r['items']}개 / {r['collisions']}회")
    print(f"점수          : {r['score']}")
    if r.get("avg_fps") is not None:
        print(f"평균 FPS      : {r['avg_fps']}")
    if "requests" in r:
        print(f"판단 요청     : {r['requests']}회 (적용 {r['applied']}, 늦어서 버림 {r['late']}, "
              f"자신 없음 {r['low_conf']}, 시간 초과 {r['timeouts']})")
        if r["avg_latency_s"] is not None:
            print(f"응답 지연     : 평균 {r['avg_latency_s']}초, 최대 {r['max_latency_s']}초")
    print(f"안전 감시 정지: {r['safety_stops']}회")
    if r.get("log"):
        print(f"로그          : {r['log']}")
