"""안전 감시: Jev가 무엇을 고르든 '절대 하면 안 되는 일'을 코드로 막습니다.

드론의 지오펜스(비행 금지 구역)와 배터리 부족 시 자동 복귀(RTL)에 해당합니다.
"""


class SafetyFilter:
    def __init__(self, battery_margin=2):
        self.battery_margin = battery_margin
        self.overrides = 0              # 안전 감시가 개입한 횟수

    def check_move(self, world, decision):
        """막힌 칸으로 가려 하면, 갈 수 있는 행동 중 확률이 가장 높은 것으로 바꿈."""
        legal = world.legal_moves()
        if decision.move in legal:
            return decision.move, None
        if not legal:
            return None, "no legal move"
        if decision.probabilities:
            best = max(legal, key=lambda m: decision.probabilities.get(m, 0.0))
        else:
            best = legal[0]
        self.overrides += 1
        return best, f"'{decision.move}' 막힘 → '{best}'"

    def must_return(self, world):
        """남은 배터리가 '집까지 거리 + 여유분' 이하면 무조건 복귀."""
        if world.battery is None or world.pos == world.home:
            return False
        return world.battery <= world.distance(world.pos, world.home) + self.battery_margin
