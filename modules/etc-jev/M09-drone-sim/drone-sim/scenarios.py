"""임무 시나리오. 좌표는 미터, 왼쪽 아래가 (0, 0), 위쪽이 북쪽(N), 오른쪽이 동쪽(E).

home       : 이륙·착륙 지점
waypoints  : 순서대로 들러야 할 경유지 (배달 지점)
obstacles  : (x, y, 반지름) 물리 장애물 — 부딪히면 충돌
nofly      : (x, y, 반지름) 비행 금지 구역 — 부딪히지는 않지만 들어가면 위반
wind       : 평균 바람 (vx, vy) m/s — 바람이 '불어 가는' 방향
gust       : 돌풍 세기 (m/s, 무작위)
battery    : 출발 배터리 (%)
"""

COMMON_OBSTACLES = [(10.0, 6.0, 1.2), (16.0, 12.0, 1.5), (22.0, 8.0, 1.2), (7.0, 13.0, 1.0)]

SCENARIOS = {
    # 바람 없는 기본 임무
    "calm": {
        "home": (3.0, 3.0), "waypoints": [(13.0, 16.0), (26.0, 5.0)],
        "obstacles": COMMON_OBSTACLES, "nofly": [],
        "wind": (0.0, 0.0), "gust": 0.0, "battery": 100.0,
    },
    # 서풍(동쪽으로 부는 바람) + 돌풍 — PID의 I항과 배터리 계산이 중요해짐
    "windy": {
        "home": (3.0, 3.0), "waypoints": [(13.0, 16.0), (26.0, 5.0)],
        "obstacles": COMMON_OBSTACLES, "nofly": [],
        "wind": (1.2, 0.3), "gust": 0.6, "battery": 100.0,
    },
    # 집과 경유지 사이에 비행 금지 구역
    "nofly": {
        "home": (3.0, 3.0), "waypoints": [(25.0, 15.0)],
        "obstacles": [(20.0, 6.0, 1.2), (8.0, 14.0, 1.0)], "nofly": [(14.0, 9.0, 4.0)],
        "wind": (0.0, 0.0), "gust": 0.0, "battery": 100.0,
    },
    # 배터리가 모자라는 임무 — 끝까지 가면 못 돌아옴. 언제 포기하고 복귀할지가 관건
    "lowbatt": {
        "home": (3.0, 3.0), "waypoints": [(13.0, 16.0), (26.0, 5.0)],
        "obstacles": COMMON_OBSTACLES, "nofly": [],
        "wind": (-1.0, 0.0), "gust": 0.4, "battery": 32.0,
    },
    # 강한 바람과 돌풍
    "storm": {
        "home": (3.0, 3.0), "waypoints": [(13.0, 16.0), (26.0, 5.0)],
        "obstacles": COMMON_OBSTACLES, "nofly": [(20.0, 14.0, 2.5)],
        "wind": (-1.5, 0.8), "gust": 1.2, "battery": 100.0,
    },
}
