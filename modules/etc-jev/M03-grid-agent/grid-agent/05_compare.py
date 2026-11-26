"""7단계: 규칙 에이전트와 Jev 에이전트를 같은 시나리오에서 비교합니다.

    python 05_compare.py              # 규칙 + Jev
    python 05_compare.py --rule-only  # API 키 없이 규칙 에이전트만
"""
import argparse

from agents import JevAgent, RuleAgent
from grid import GridWorld
from maps import MAPS
from runner import OUTCOME_NAMES, run_episode
from safety import SafetyFilter

# (이름, 지도, 배터리, 바람, 시드)
SCENARIOS = [
    ("빈 격자", "empty", None, 0.0, 1),
    ("벽", "walls", None, 0.0, 1),
    ("함정", "trap", None, 0.0, 1),
    ("배달-충분", "delivery", 30, 0.0, 1),
    ("배달-부족", "delivery", 18, 0.0, 1),
    ("배달-바람1", "delivery", 24, 0.4, 1),
    ("배달-바람2", "delivery", 24, 0.4, 2),
    ("배달-바람3", "delivery", 24, 0.4, 3),
]

parser = argparse.ArgumentParser()
parser.add_argument("--rule-only", action="store_true")
args = parser.parse_args()

agents = {"rule": RuleAgent()}
if not args.rule_only:
    agents["jev"] = JevAgent(show_neighbors=True, show_map=True)

rows = []
try:
    for title, map_name, battery, wind, seed in SCENARIOS:
        for name, agent in agents.items():
            world = GridWorld(MAPS[map_name], battery=battery, wind=wind, seed=seed)
            r = run_episode(world, agent, safety=SafetyFilter(), render=False,
                            log_name=f"05_{name}_{map_name}_{seed}" if name == "jev" else None)
            rows.append((title, name, OUTCOME_NAMES.get(r["outcome"], r["outcome"]), r["steps"],
                         r["battery_left"], r["safety_overrides"], r["avg_latency_ms"]))
            print(f"  끝: {title} / {name}")
finally:
    if "jev" in agents:
        agents["jev"].close()

print()
header = f"{'시나리오':<10} {'에이전트':<6} {'결과':<16} {'걸음':>4} {'배터리':>6} {'안전개입':>8} {'평균지연ms':>10}"
print(header)
print("-" * 78)
for title, name, outcome, steps, bat, ov, lat in rows:
    bat = "-" if bat is None else bat
    lat = "-" if lat is None else lat
    print(f"{title:<10} {name:<6} {outcome:<16} {steps:>4} {bat:>6} {ov:>8} {lat:>10}")
