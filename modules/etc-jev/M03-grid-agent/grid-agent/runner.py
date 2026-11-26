"""한 판(에피소드)을 진행하는 결정 루프.

    관측(state) → 판단(agent) → 안전 감시(safety) → 행동(step) → 반복
"""
import json
import time
from datetime import datetime
from pathlib import Path

RETURN_THRESHOLD = 0.7      # Noul이 이 값 이상이면 '복귀해야 한다'로 봄 (공식 문서의 출발점)

OUTCOME_NAMES = {
    "success": "성공",
    "returned_safe": "안전 복귀 (목표 포기)",
    "collision": "충돌",
    "crash_battery": "배터리 방전",
    "timeout": "시간 초과",
    "stuck": "갇힘",
    "quit": "중단",
}


def run_episode(world, agent, safety=None, max_steps=None, render=True, delay=0.0, log_name=None):
    max_steps = max_steps or world.width * world.height * 2
    battery_mode = world.battery is not None
    returning = False
    outcome = None
    latencies = []
    log = []

    def show(msg=""):
        if not render:
            return
        print(world.render())
        info = f"걸음 {world.steps}"
        if battery_mode:
            info += f" | 배터리 {world.battery} | 목표 방문 {'O' if world.goal_visited else 'X'}"
        print(info + (f" | {msg}" if msg else "") + "\n")
        if delay:
            time.sleep(delay)

    show("시작")
    try:
        while True:
            # ---- 1. 끝났는지 확인 ---------------------------------------
            if not battery_mode and world.pos == world.goal:
                outcome = "success"
                break
            if battery_mode and world.pos == world.home and world.goal_visited:
                outcome = "success"
                break
            if battery_mode and world.pos == world.home and returning:
                outcome = "returned_safe"
                break
            if battery_mode and world.battery <= 0:
                outcome = "crash_battery"
                break
            if world.steps >= max_steps:
                outcome = "timeout"
                break

            # ---- 2. 안전 감시: 배터리 강제 복귀 -------------------------
            note = ""
            if safety and not returning and not world.goal_visited and safety.must_return(world):
                returning = True
                safety.overrides += 1
                note = "안전 감시: 배터리 부족 → 강제 복귀"

            # ---- 3. 판단 ------------------------------------------------
            go_home = battery_mode and (world.goal_visited or returning)
            target_name, target = ("home", world.home) if go_home else ("goal", world.goal)
            ask_return = battery_mode and not go_home
            decision = agent.decide(world, target_name, target, ask_return)
            if decision.latency_ms is not None:
                latencies.append(decision.latency_ms)

            if ask_return and decision.return_home is not None and decision.return_home >= RETURN_THRESHOLD:
                # 에이전트가 '복귀'를 결정 → 목표를 집으로 바꿔 다시 판단
                returning = True
                note = f"에이전트 판단: 복귀 (확률 {decision.return_home:.2f})"
                if world.pos == world.home:
                    show(note)
                    continue
                target_name, target = "home", world.home
                decision = agent.decide(world, target_name, target, False)
                if decision.latency_ms is not None:
                    latencies.append(decision.latency_ms)

            # ---- 4. 안전 감시: 막힌 칸 ----------------------------------
            move, reason = decision.move, None
            if safety:
                move, reason = safety.check_move(world, decision)
                if move is None:
                    outcome = "stuck"
                    break

            log.append({
                "step": world.steps, "pos": list(world.pos), "target": target_name,
                "chosen": decision.move, "final": move, "override": reason,
                "probabilities": decision.probabilities, "return_home": decision.return_home,
                "latency_ms": decision.latency_ms, "state": decision.state,
            })

            # ---- 5. 행동 ------------------------------------------------
            if not world.step(move):
                outcome = "collision"   # 안전 감시 없이 벽이나 격자 밖으로 이동
                show(f"충돌! '{move}' 방향은 막혀 있어요")
                break

            msg = move
            if decision.probabilities:
                msg += f" (확률 {decision.probabilities.get(decision.move, 0):.2f})"
            if reason:
                msg += f" | 안전 감시: {reason}"
            if note:
                msg += f" | {note}"
            show(msg)
    except KeyboardInterrupt:
        outcome = "quit"

    result = {
        "agent": agent.name,
        "outcome": outcome,
        "steps": world.steps,
        "battery_left": world.battery,
        "jev_calls": len(latencies),
        "avg_latency_ms": round(sum(latencies) / len(latencies)) if latencies else None,
        "safety_overrides": safety.overrides if safety else 0,
    }
    if log_name:
        result["log"] = str(save_log(log_name, log, result))
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


def print_result(result):
    print("=" * 40)
    print(f"결과          : {OUTCOME_NAMES.get(result['outcome'], result['outcome'])}")
    print(f"걸음 수       : {result['steps']}")
    if result["battery_left"] is not None:
        print(f"남은 배터리   : {result['battery_left']}")
    if result["jev_calls"]:
        print(f"Jev 호출      : {result['jev_calls']}회, 평균 {result['avg_latency_ms']}ms")
    if result["safety_overrides"]:
        print(f"안전 감시 개입: {result['safety_overrides']}회")
    if result.get("log"):
        print(f"로그          : {result['log']}")
