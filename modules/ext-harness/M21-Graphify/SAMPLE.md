# 예제 실행 및 프롬프트

> 전제: GUIDE.md 1~10단계를 마쳤다. 즉 다음 상태를 가정한다.
> - `~/work/requests`에 psf/requests `v2.32.3`을 클론했고, 현재 브랜치는 `graphify-practice`다.
> - `.graphifyignore`, `.claude/`, `CLAUDE.md`, `graphify-out/`이 커밋되어 있다.
> - `graphify hook install`로 훅이 설치되어 있고, `git gpull` alias가 등록되어 있다.
>
> 이 샘플은 requests에 **작은 속도 제한 모듈을 직접 추가**한다. 그다음 커밋 → 자동 재빌드 → 질의 → 팀원 변경 동기화까지 한 바퀴 돌려 본다.

## 1단계: 시작 상태 확인하기

```bash
cd ~/work/requests
git branch --show-current     # graphify-practice
graphify hook status          # post-commit / post-checkout / merge driver
ls graphify-out               # GRAPH_REPORT.md  graph.html  graph.json ...
git status --short            # 비어 있어야 한다
```

`git status`에 `graphify-out/` 파일이 수정됨으로 보이면 이전 커밋 뒤에 훅이 그래프를 다시 만든 것이다. 먼저 커밋해 둔다.
```bash
git add graphify-out && git commit -m "chore: update graph"
```

## 2단계: 실습용 코드 추가하기

`src/requests/ratelimit.py` 파일을 새로 만든다. 기존 `Session`을 상속하므로 그래프에서 기존 코드와의 연결을 확인하기 좋다.

```bash
cat > src/requests/ratelimit.py <<'EOF'
"""
requests.ratelimit
~~~~~~~~~~~~~~~~~~

graphify 실습용 모듈: 간단한 클라이언트 측 요청 속도 제한기.
"""
import threading
import time

from .sessions import Session


class RateLimiter:
    """period초 동안 최대 max_calls번까지만 호출을 허용한다."""

    def __init__(self, max_calls=5, period=1.0):
        self.max_calls = max_calls
        self.period = period
        self._calls = []
        self._lock = threading.Lock()

    def wait(self):
        # WHY: 예외를 던지지 않고 호출자를 잠시 재워서 기존 코드가 그대로 동작하게 한다.
        with self._lock:
            now = time.monotonic()
            self._calls = [t for t in self._calls if now - t < self.period]
            if len(self._calls) >= self.max_calls:
                time.sleep(self.period - (now - self._calls[0]))
            self._calls.append(time.monotonic())


class RateLimitedSession(Session):
    """매 요청 전에 RateLimiter를 거치는 Session."""

    def __init__(self, limiter=None):
        super().__init__()
        self.limiter = limiter or RateLimiter()

    def request(self, method, url, *args, **kwargs):
        self.limiter.wait()
        return super().request(method, url, *args, **kwargs)
EOF
```

문법 오류가 없는지 한 번 확인한다(네트워크 요청은 보내지 않는다).
```bash
python -c "import sys; sys.path.insert(0, 'src'); from requests.ratelimit import RateLimitedSession; print('import ok')"
```
의존성 버전 경고(`RequestsDependencyWarning`)가 함께 출력될 수 있지만 `import ok`가 보이면 된다.

## 3단계: 커밋하고 자동 재빌드 확인하기

```bash
git add src/requests/ratelimit.py
git commit -m "feat: add rate limiter helper"
```

커밋 직후 다음 메시지가 보이면 post-commit 훅이 동작한 것이다.
```
[graphify hook] launching background rebuild (log: ~/.cache/graphify-rebuild.log)
```

재빌드는 백그라운드에서 몇 초 걸린다. 로그로 끝났는지 확인한다.
```bash
sleep 10
tail -2 ~/.cache/graphify-rebuild.log
# [graphify watch] Rebuilt: 610 nodes, 1127 edges, ...
# [graphify watch] graph.json, graph.html and GRAPH_REPORT.md updated in graphify-out
```

노드 수가 6단계 때(약 584~598개)보다 늘었으면 새 모듈이 그래프에 들어간 것이다.

## 4단계: 갱신된 그래프 커밋하기

훅은 커밋이 끝난 **뒤에** 그래프를 다시 만들므로, 지금 `git status`를 보면 `graphify-out/` 파일이 수정됨으로 표시된다. 팀원이 같은 그래프를 받도록 커밋한다.

```bash
git status --short        # M graphify-out/graph.json ...
git add graphify-out
git commit -m "chore: update graph after rate limiter"
```

> 이 커밋도 훅을 다시 실행시킨다. 하지만 코드가 바뀌지 않았으므로 그래프 내용은 거의 그대로다. 남는 변경(`cache/stat-index.json` 등)은 다음 커밋에 함께 넣으면 된다.

## 5단계: 터미널에서 직접 질의해 보기

**새로 추가한 클래스 설명**
```bash
graphify explain "RateLimitedSession"
```
예상 결과:
```
Node: RateLimitedSession
  Source:    src/requests/ratelimit.py L32
  Degree:    5
Connections (5):
  <-- ratelimit.py [contains] [EXTRACTED] src/requests/ratelimit.py:L32
  --> .__init__() [method] [EXTRACTED] src/requests/ratelimit.py:L35
  --> .request() [method] [EXTRACTED] src/requests/ratelimit.py:L39
  --> Session [inherits] [EXTRACTED] src/requests/ratelimit.py:L32
  <-- 매 요청 전에 RateLimiter를 거치는 Session. [rationale_for] [EXTRACTED] ...
```
확인 포인트는 두 가지다.
- `Session [inherits]`: 기존 코드와의 연결이 소스에서 명시적으로 확인되어 `EXTRACTED`로 표시된다.
- docstring이 `rationale_for` 노드로 따로 추출된다.

**새 모듈에서 기존 핵심 개념까지의 경로**
```bash
graphify path "RateLimiter" "HTTPAdapter"
# No directed path found ... Re-run with --undirected ...
graphify path "RateLimiter" "HTTPAdapter" --undirected
# RateLimiter <--contains-- ratelimit.py --imports_from--> sessions.py --imports--> HTTPAdapter
```
`ratelimit.py`가 `sessions.py`를 통해 `HTTPAdapter`까지 3-hop으로 이어진다.

**기존 코드 경로 복습**
```bash
graphify path "Session" "init_poolmanager"
# Session --uses [INFERRED]--> HTTPAdapter --method [EXTRACTED]--> .init_poolmanager()
```

## 6단계: Claude Code에서 자연어로 질의하기

저장소 루트에서 Claude Code를 연다.
```bash
claude
```

GUIDE.md 4단계의 `graphify install --project`가 `CLAUDE.md`에 규칙을 넣어 두었다. 코드 관련 질문에는 먼저 `graphify query`/`path`/`explain`을 쓰라는 내용이다. `.claude/settings.json`의 PreToolUse 훅도 grep이나 파일 읽기 전에 그래프를 확인하게 한다. 따라서 파일을 하나씩 열어 보라고 지시할 필요가 없다.

아래 프롬프트를 하나씩 입력해 본다.

```
방금 추가한 RateLimitedSession이 어떤 클래스와 모듈에 연결돼 있는지 알려줘.
```

```
HTTPBasicAuth 같은 인증 클래스가 HTTPAdapter까지 어떤 경로로 이어지는지 찾아줘.
```

```
Session.request()를 호출하면 실제로 네트워크 요청이 나가기까지 어떤 클래스와 메서드를 거치는지 순서대로 설명해줘.
```

어시스턴트는 내부적으로 다음과 비슷한 명령을 호출할 것으로 예상된다.
```
graphify explain "RateLimitedSession"
graphify path "HTTPBasicAuth" "HTTPAdapter" --undirected
graphify query "Session.request flow to HTTPAdapter.send"
```

**확인할 것:**
- 답변에 `src/requests/ratelimit.py L32`, `Session` 상속 같은 **소스 위치와 연결 근거**가 들어 있는가?
- 어시스턴트가 `sessions.py`, `adapters.py`를 통째로 읽기 전에 **graphify 명령을 먼저 호출**하는가? (도구 호출 내역에서 확인)

## 7단계: 팀원의 변경 만들기 (로컬 시뮬레이션)

혼자서도 팀 동기화를 연습할 수 있도록, 같은 저장소를 **로컬에서 한 번 더 클론**해 팀원 역할을 맡긴다.

```bash
cd ~/work
git clone -b graphify-practice requests requests-teammate
cd requests-teammate
git config user.name  "팀원"
git config user.email "teammate@example.com"
```

팀원이 편의 함수를 하나 추가하고 커밋한다.
```bash
cat >> src/requests/ratelimit.py <<'EOF'


def limited_get(url, limiter=None, **kwargs):
    """속도 제한이 걸린 GET 요청 한 번을 보내는 편의 함수."""
    with RateLimitedSession(limiter) as session:
        return session.get(url, **kwargs)
EOF
git commit -am "feat: add limited_get helper"
```

## 8단계: 변경 받아오고 그래프 동기화하기

원래 저장소로 돌아와 팀원 클론을 원격(`teammate`)으로 등록한다. 그다음 현재 브랜치가 그 원격을 따라가도록 설정한다.

```bash
cd ~/work/requests
git remote add teammate ../requests-teammate
git fetch teammate
git branch --set-upstream-to=teammate/graphify-practice
```

GUIDE.md 10단계에서 만든 alias로 코드와 그래프를 한 번에 갱신한다.
```bash
git gpull
# ... Fast-forward ...
# [graphify watch] Rebuilt: 611 nodes, 1131 edges, ...
# Code graph updated. ...
```

팀원이 추가한 함수가 그래프에 들어왔는지 확인한다.
```bash
graphify explain "limited_get()"
```
```
Node: limited_get()
  Source:    src/requests/ratelimit.py L44
Connections (3):
  <-- ratelimit.py [contains] [EXTRACTED] src/requests/ratelimit.py:L44
  --> RateLimitedSession [calls] [EXTRACTED] src/requests/ratelimit.py:L46
  <-- 속도 제한이 걸린 GET 요청 한 번을 보내는 편의 함수. [rationale_for] [EXTRACTED] ...
```

> `git pull`만 하고 `graphify update .`를 빼먹으면 `limited_get()` 노드가 없다고 나온다. pull은 훅으로 자동화되지 않는다는 점을 직접 확인해 보자.

## 9단계: 정리하기 (선택)

실습을 마쳤으면 시뮬레이션용 원격과 클론을 지운다.
```bash
cd ~/work/requests
git branch --unset-upstream
git remote remove teammate
rm -rf ../requests-teammate
```

처음부터 다시 하고 싶으면 `~/work/requests` 폴더를 통째로 지우고 GUIDE.md 3단계부터 다시 시작한다. 훅을 지우려면 `graphify hook uninstall`, 스킬과 설정을 모두 지우려면 `graphify uninstall`을 쓴다.

## 체크리스트
- [ ] `src/requests/ratelimit.py`를 추가하고 커밋해 post-commit 훅이 그래프를 다시 만드는지 로그로 확인한다.
- [ ] 재빌드된 `graphify-out/`을 커밋한다.
- [ ] `graphify explain "RateLimitedSession"`에서 `Session [inherits] [EXTRACTED]` 연결을 확인한다.
- [ ] `graphify path "RateLimiter" "HTTPAdapter" --undirected`로 3-hop 경로를 확인한다.
- [ ] Claude Code에서 자연어 질문을 했을 때 graphify 명령이 먼저 호출되는지 확인한다.
- [ ] 로컬 팀원 클론에서 만든 변경을 `git gpull`로 받아 `limited_get()` 노드가 생겼는지 확인한다.
