"""평가 하네스: 여러 두뇌 × 여러 시나리오 × 여러 시드를 돌려 같은 기준으로 채점합니다.

지표
  완수율       : 모든 경유지를 들르고 무사고로 귀환한 비율
  무사고귀환율 : 충돌·위반 없이, 예비 배터리(8%)를 남기고 집에 착륙한 비율
                 (lowbatt처럼 다 못 하는 임무에서는 '포기하고 무사히 돌아오기'가 정답)
  충돌, 위반   : 평균 횟수
  시간, 배터리 : 평균 비행 시간, 평균 남은 배터리
  지연 p95     : 판단 응답 시간의 95번째 백분위수 (100번 중 95번은 이보다 빠름)
  호출, 비용   : 평균 판단 요청 수, 평균 Jev 비용 (입력 토큰 × 단가)

결과는 reports/ 폴더에 JSON과 CSV로 저장합니다.
"""
import csv
import json
from datetime import datetime
from pathlib import Path

from mission import Mission
from physics import World
from safety import SafetyFilter
from scenarios import SCENARIOS
from sim import run_mission


def run_matrix(brains, scenarios, seeds, safety=True, on_done=None):
    """brains: {이름: (decider를 만드는 함수(seed), realtime 여부)}"""
    rows = []
    for scen in scenarios:
        for name, (make_decider, realtime) in brains.items():
            for seed in seeds:
                world = World(SCENARIOS[scen], seed=seed)
                mission = Mission(world)
                r = run_mission(world, mission, make_decider(seed), SafetyFilter() if safety else None,
                                realtime=realtime)
                r.update({"scenario": scen, "brain_label": name, "seed": seed})
                rows.append(r)
                if on_done:
                    on_done(r)
    return rows


def summarize(rows):
    groups = {}
    for r in rows:
        groups.setdefault((r["scenario"], r["brain_label"]), []).append(r)
    out = []
    for (scen, brain), rs in groups.items():
        n = len(rs)

        def avg(key):
            vals = [r[key] for r in rs if r.get(key) is not None]
            return sum(vals) / len(vals) if vals else None
        out.append({
            "scenario": scen, "brain": brain, "runs": n,
            "complete_rate": sum(r["mission_complete"] for r in rs) / n,
            "safe_rate": sum(r["safe_return"] for r in rs) / n,
            "collisions": avg("collisions"), "violations": avg("violations"),
            "time_s": avg("time_s"), "battery_left": avg("battery_left"),
            "safety": avg("safety_interventions"),
            "latency_p95_s": avg("latency_p95_s"), "requests": avg("requests"),
            "cost_usd": avg("cost_usd"),
        })
    return out


def print_summary(summary):
    head = (f"{'시나리오':<9} {'두뇌':<14} {'판':>3} {'완수율':>6} {'무사고':>6} {'충돌':>5} {'위반':>5} "
            f"{'시간s':>6} {'배터리':>6} {'안전':>5} {'p95s':>5} {'호출':>5} {'비용$':>8}")
    print(head)
    print("-" * 104)
    for s in summary:
        def f(v, fmt):
            return format(v, fmt) if v is not None else "-"
        print(f"{s['scenario']:<9} {s['brain']:<14} {s['runs']:>3} {s['complete_rate']:>6.0%} {s['safe_rate']:>6.0%} "
              f"{f(s['collisions'], '>5.1f')} {f(s['violations'], '>5.1f')} {f(s['time_s'], '>6.1f')} "
              f"{f(s['battery_left'], '>6.1f')} {f(s['safety'], '>5.1f')} {f(s['latency_p95_s'], '>5.2f')} "
              f"{f(s['requests'], '>5.0f')} {f(s['cost_usd'], '>8.4f')}")


def save_report(rows, summary, tag="eval"):
    folder = Path(__file__).with_name("reports")
    folder.mkdir(exist_ok=True)
    stamp = f"{tag}_{datetime.now():%Y%m%d_%H%M%S}"
    (folder / f"{stamp}.json").write_text(
        json.dumps({"summary": summary, "runs": rows}, ensure_ascii=False, indent=1), encoding="utf-8")
    with (folder / f"{stamp}.csv").open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=list(summary[0].keys()))
        w.writeheader()
        w.writerows(summary)
    return folder / f"{stamp}.json", folder / f"{stamp}.csv"
