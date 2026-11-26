"""한 판(에피소드)을 진행하는 루프: 환경과 에이전트를 연결합니다.

    state = env.reset()
    반복:  action = agent.act(env)  →  state, reward, done, info = env.step(action)
"""
import json
import time
from datetime import datetime
from pathlib import Path

ACTION_KO = {"UP": "위", "DOWN": "아래", "LEFT": "왼쪽", "RIGHT": "오른쪽"}


def run_episode(env, agent, render=True, delay=0.0, log_name=None):
    env.reset()
    agent.reset()
    log, latencies, fallbacks = [], [], 0

    def show(msg):
        if render:
            print(env.render())
            print(f"턴 {env.turns} | 위치 (행, 열) {env.state} | 누적 보상 {env.total_reward} | {msg}\n")
            if delay:
                time.sleep(delay)

    show("시작")
    try:
        while not env.done:
            before = env.state
            action = agent.act(env)
            state, reward, done, info = env.step(action)

            extra = agent.last or {}
            if extra.get("latency_ms") is not None:
                latencies.append(extra["latency_ms"])
            if extra.get("fallback"):
                fallbacks += 1
            log.append({"turn": env.turns, "from": list(before), "action": action, "to": list(state),
                        "reward": reward, "collision": info["collision"], **extra})

            msg = f"{action}({ACTION_KO[action]}) 보상 {reward:+d}"
            if extra.get("fallback"):
                jc = extra["jev_choice"]
                msg += f" | Jev는 {jc}(확률 {extra['probabilities'][jc]:.2f})로 애매 → 우수법으로 대체"
            elif extra.get("probabilities"):
                msg += f" | 확률 {extra['probabilities'].get(action, 0):.2f}"
            if extra.get("skipped"):
                msg += " | 갈 곳이 하나뿐이라 Jev에게 묻지 않음"
            if info["collision"]:
                msg += " | 이동할 수 없는 위치입니다."
            show(msg)
        outcome = "success" if env.reason == "goal" else "timeout"
    except KeyboardInterrupt:
        outcome = "quit"

    result = {
        "agent": agent.name,
        "outcome": outcome,
        "turns": env.turns,
        "total_reward": env.total_reward,
        "collisions": env.collisions,
        "jev_calls": len(latencies),
        "avg_latency_ms": round(sum(latencies) / len(latencies)) if latencies else None,
        "fallbacks": fallbacks,
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


OUTCOME_KO = {"success": "탈출 성공", "timeout": "최대 턴 초과", "quit": "중단"}


def print_result(result):
    print("=" * 40)
    print(f"에이전트  : {result['agent']}")
    print(f"결과      : {OUTCOME_KO.get(result['outcome'], result['outcome'])}")
    print(f"이동 횟수 : {result['turns']}")
    print(f"누적 보상 : {result['total_reward']}")
    print(f"충돌 횟수 : {result['collisions']}")
    if result["jev_calls"]:
        print(f"Jev 호출  : {result['jev_calls']}회, 평균 {result['avg_latency_ms']}ms")
    if result["fallbacks"]:
        print(f"우수법 대체: {result['fallbacks']}회")
    if result.get("log"):
        print(f"로그      : {result['log']}")
