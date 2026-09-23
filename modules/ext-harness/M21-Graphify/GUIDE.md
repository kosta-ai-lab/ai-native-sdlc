# 개념

**graphify**는 코드, 문서, PDF, SQL 스키마, 이미지, 영상이 담긴 저장소를 **질의 가능한 지식 그래프**로 바꿔 주는 도구다. AI 코딩 어시스턴트(Claude Code, Cursor, Codex, Gemini CLI 등)에 `/graphify`라는 스킬로 등록된다. 코드는 tree-sitter 기반 AST로 **로컬에서 결정적으로** 파싱한다(LLM 호출 없음, 외부 전송 없음). 문서·PDF·이미지 등은 AI 어시스턴트의 모델로 의미를 분석해 파싱한다.

핵심 아이디어는 두 가지다.

- **모든 연결에는 근거가 있다.** 각 엣지에는 태그가 붙는다. 소스에서 명시적으로 확인된 연결은 `EXTRACTED`, graphify가 추론한 연결은 `INFERRED`다.
- **벡터 스토어가 아니라 진짜 그래프다.** 임베딩 검색 대신 그래프를 순회하며 질문에 답한다. 두 개념 사이의 경로를 추적하거나 하나의 개념을 설명할 수도 있다.

이 가이드는 graphify를 처음 쓰는 사람을 위한 것이다. 설치부터 그래프 생성, 질의, 팀 협업 설정까지 순서대로 따라 할 수 있다.

## 실습 저장소: psf/requests v2.32.3

모든 단계는 **같은 실습 저장소**를 대상으로 진행한다.

| 항목 | 값 |
|---|---|
| 저장소 | [psf/requests](https://github.com/psf/requests) (파이썬 HTTP 라이브러리) |
| 고정 버전 | 태그 `v2.32.3` |
| 실습 브랜치 | `graphify-practice` (직접 만든다) |
| 규모 | `src/requests/` 아래 파이썬 모듈 약 20개, `docs/` 아래 문서 |

이 저장소를 고른 이유는 세 가지다.

- **크기가 적당하다.** 그래프가 수백 개 노드 규모라 `graph.html`을 브라우저에서 편하게 볼 수 있다.
- **구조가 뚜렷하다.** `Session → HTTPAdapter → 커넥션 풀`, `auth`, `cookies`처럼 질의해 볼 만한 개념이 분명하다.
- **태그로 고정할 수 있다.** 누가 언제 따라 해도 이 가이드와 거의 같은 결과를 얻는다.

> 검증 환경: graphify 0.9.66, requests v2.32.3, Ubuntu 24.04, Python 3.12 (2026-09-23 기준).
> 노드·엣지 수 같은 숫자는 graphify 버전에 따라 조금 달라질 수 있다. 자릿수가 비슷하면 정상이다.

---

# 1 단계: 사전 준비 확인하기

## 규칙

- **Python 3.10 이상**이 필요하다. `python --version`(또는 `python3 --version`)으로 확인한다.
- **git**이 필요하다. `git --version`으로 확인한다.
- 패키지 관리자는 `uv`(권장)나 `pipx` 중 하나를 쓴다. 둘 다 없으면 다음 중 하나로 설치한다.
  - macOS(Homebrew): `brew install python@3.12 uv`
  - Windows: `winget install astral-sh.uv`
  - Ubuntu/Debian: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- `pip install`은 되도록 직접 쓰지 않는다. graphify는 실행할 때 `graphify-out/.graphify_python`에서 파이썬 환경을 찾는다. `pip`으로 설치한 환경과 실제 실행 환경이 다르면 `ModuleNotFoundError`가 날 수 있다. `uv tool install`과 `pipx install`은 격리된 환경을 따로 쓰므로 이 문제가 없다.

## 산출물

- 로컬 환경에 Python 3.10+, git, `uv`(또는 `pipx`) 설치 완료.

## 체크리스트
- [ ] `python --version`이 3.10 이상인지 확인한다.
- [ ] `git --version`이 정상 출력되는지 확인한다.
- [ ] `uv --version`(또는 `pipx --version`)이 정상 출력되는지 확인한다.
- [ ] 사용할 AI 코딩 어시스턴트(Claude Code, Cursor, Codex, Gemini CLI 등)를 정한다.

---

# 2 단계: graphify CLI 설치하기

## 규칙

- 설치 명령은 다음 중 하나를 쓴다.
  ```bash
  uv tool install graphifyy      # 권장
  # 또는
  pipx install graphifyy
  ```
- **PyPI 패키지 이름은 `graphifyy`(y가 두 번)이고, 실행 명령어는 `graphify`다.** 이름이 비슷한 다른 `graphify*` 패키지는 관계없는 패키지이니 혼동하지 않는다.
- 설치 없이 `uvx`로 바로 실행하려면 패키지명을 적어야 한다: `uvx --from graphifyy graphify --version`. `uvx graphify ...`만 쓰면 실패한다.
- 설치 후 `graphify: command not found`가 뜨면 PATH 문제다.
  - uv: `uv tool update-shell`을 실행하고 새 터미널을 연다.
  - pipx: `pipx ensurepath`를 실행하고 새 터미널을 연다.

## 산출물

- 터미널에서 `graphify` 명령을 바로 호출할 수 있는 상태.

## 체크리스트
- [ ] `uv tool install graphifyy`(또는 `pipx install graphifyy`)를 실행한다.
- [ ] `graphify --version`으로 설치를 확인한다. (예: `graphify 0.9.66`)
- [ ] 명령을 찾지 못하면 PATH를 갱신하고 새 터미널을 연다.

---

# 3 단계: 실습 저장소 클론하기

## 규칙

- 작업 폴더(예: `~/work`)로 이동한 뒤, 태그 `v2.32.3`을 **얕은 클론**으로 받는다.
  ```bash
  mkdir -p ~/work && cd ~/work
  git clone --depth 1 --branch v2.32.3 https://github.com/psf/requests.git
  cd requests
  ```
  - `--branch v2.32.3`: 버전을 고정해 이 가이드와 같은 결과를 얻는다.
  - `--depth 1`: 최신 커밋 하나만 받아 빠르다. 이 실습에는 과거 이력이 필요 없다.
- 태그를 클론하면 "detached HEAD" 안내가 나온다. 정상이다. 바로 **실습 브랜치**를 만들어 그 위에서 작업한다.
  ```bash
  git switch -c graphify-practice
  ```
- 이후 단계에서 커밋을 하므로, git 사용자 정보가 설정되어 있지 않다면 이 저장소에만 설정한다.
  ```bash
  git config user.name  "홍길동"
  git config user.email "gildong@example.com"
  ```
- 폴더 구조를 한 번 훑어본다. 그래프에서 보게 될 대부분의 노드는 `src/requests/`에서 나온다.
  ```
  requests/
  ├── src/requests/     ← 라이브러리 본체 (sessions.py, adapters.py, models.py, auth.py ...)
  ├── tests/            ← 테스트 코드 (5단계에서 색인 제외)
  ├── docs/             ← .rst 문서
  ├── ext/              ← 로고 이미지 등 (5단계에서 색인 제외)
  └── pyproject.toml, setup.py ...
  ```
- 참고: graphify에도 `graphify clone https://github.com/psf/requests` 명령이 있다. 이 명령은 `~/.graphify/repos/psf/requests`에 기본 브랜치를 받는다. 버전 고정과 실습 브랜치 작업이 필요하므로 이 가이드에서는 `git clone`을 쓴다.

## 산출물

- `~/work/requests` 폴더, 현재 브랜치 `graphify-practice`, 기준 커밋은 태그 `v2.32.3`.

## 체크리스트
- [ ] `git clone --depth 1 --branch v2.32.3 https://github.com/psf/requests.git`를 실행한다.
- [ ] `cd requests && git switch -c graphify-practice`로 실습 브랜치를 만든다.
- [ ] `git branch --show-current` 결과가 `graphify-practice`인지 확인한다.
- [ ] `ls src/requests`로 `sessions.py`, `adapters.py`가 보이는지 확인한다.

---

# 4 단계: AI 어시스턴트에 스킬 등록하기

## 규칙

- **실습 저장소 루트(`~/work/requests`)에서** 실행한다.
- 기본 명령은 `graphify install`이며 사용자 프로필 전역에 등록된다. 이 실습에서는 설정을 저장소에 함께 커밋하려고 `--project`를 붙인다.
  ```bash
  graphify install --project                    # Claude Code
  graphify install --project --platform codex   # 다른 플랫폼 예시
  ```
- Claude Code 외의 플랫폼은 `--platform`으로 지정한다(예: `cursor`, `codex`, `gemini`). 플랫폼별 전용 명령(`graphify cursor install` 등)도 있다.
- Claude Code에서 `--project`로 설치하면 스킬 파일뿐 아니라 다음도 함께 만들어진다.
  - `CLAUDE.md`의 graphify 섹션: 코드 관련 질문에는 먼저 `graphify query` / `path` / `explain`을 쓰라는 규칙
  - `.claude/settings.json`의 PreToolUse 훅: 어시스턴트가 grep이나 파일 읽기를 하기 전에 그래프를 먼저 확인하게 한다
- PowerShell 사용자는 이후 `/graphify .` 대신 **`graphify .`**(슬래시 없이)를 입력한다. PowerShell은 `/`를 경로 구분자로 해석하기 때문이다.

## 산출물

- `.claude/skills/graphify/SKILL.md`(와 `references/` 폴더), `.claude/settings.json`, `CLAUDE.md`.
- 설치 마지막에 출력되는 안내: `git add .claude/ CLAUDE.md` (커밋은 9단계에서 한꺼번에 한다).

## 체크리스트
- [ ] `~/work/requests`에서 `graphify install --project`를 실행한다.
- [ ] `ls .claude/skills/graphify/SKILL.md`로 스킬 파일이 생겼는지 확인한다.
- [ ] `CLAUDE.md`를 열어 `## graphify` 섹션이 있는지 확인한다.
- [ ] AI 어시스턴트를 열어 `/graphify` 명령이 인식되는지 확인한다.

---

# 5 단계: 색인 제외 규칙 설정하기

## 규칙

- 저장소 루트에 `.graphifyignore`를 만든다. 문법은 `.gitignore`와 같다. `.gitignore`는 자동으로 적용되고, 두 파일이 겹치면 `.graphifyignore`가 우선한다.
- requests 실습에서는 다음 내용을 쓴다.
  ```bash
  cat > .graphifyignore <<'EOF'
  # 테스트·부가 파일은 제외 (핵심 구조를 가림)
  tests/
  ext/
  # 도구 설정 파일은 그래프에 넣지 않음
  .claude/
  .github/
  CLAUDE.md
  EOF
  ```
- **이렇게 하는 이유:**
  - `tests/`를 제외하지 않으면 테스트 클래스 `TestRequests` 하나가 약 200개 엣지로 God node 1위를 차지한다. 노드 수도 약 1,150개로 두 배가 되어, 라이브러리의 실제 구조가 가려진다.
  - `.claude/` 아래 스킬 문서와 `.github/` 워크플로 파일은 `graphify update`나 커밋 훅이 다시 빌드할 때 그래프에 섞여 들어간다. 그러면 요청과 무관한 노드가 수십 개 생긴다.
- 이 파일은 그래프를 처음 만들기 **전에** 만든다. 나중에 추가했다면 `graphify update . --force`로 다시 빌드한다.

## 산출물

- 저장소 루트의 `.graphifyignore`.

## 체크리스트
- [ ] `.graphifyignore`를 위 내용으로 만든다.
- [ ] `cat .graphifyignore`로 `tests/`와 `.claude/`가 들어 있는지 확인한다.

---

# 6 단계: 첫 그래프 생성하기

## 규칙

그래프를 만드는 방법은 두 가지다. **처음에는 A를 권장한다.** API 키가 필요 없고 결과가 항상 같다.

**A. 터미널에서 코드만 색인 (API 키 불필요, 재현 가능)**
```bash
graphify extract . --code-only     # AST 파싱 → graphify-out/graph.json
graphify cluster-only . --no-label # 군집화 → GRAPH_REPORT.md, graph.html 생성
```
- `extract --code-only`는 `graph.json`만 만든다. 리포트와 시각화 파일은 `cluster-only`가 만든다.
- `--no-label`은 커뮤니티 이름을 LLM으로 짓지 않고 `Community N`으로 둔다. 이름을 붙이고 싶으면 나중에 API 키를 설정한 뒤 `graphify label .`을 실행한다.

**B. AI 어시스턴트 안에서 전체 색인 (문서까지 의미 분석)**
```
/graphify .
```
- `docs/`의 `.rst` 문서까지 어시스턴트 모델이 의미를 분석하므로 토큰이 사용된다. 결과는 모델에 따라 조금씩 달라질 수 있다.
- 특정 폴더만 대상으로 하려면 경로를 지정한다: `/graphify ./src`

## 산출물

`graphify-out/` 폴더에 다음 파일이 생긴다.
- `graph.html`: 브라우저에서 열어 노드를 클릭·필터·검색하는 시각화
- `GRAPH_REPORT.md`: 핵심 개념, 의외의 연결, 추천 질문 요약
- `graph.json`: 파일을 다시 읽지 않고 질의할 수 있는 전체 그래프 데이터
- `manifest.json`, `cache/`: 증분 재빌드용 내부 파일

방법 A의 예상 출력은 다음과 같다(숫자는 버전에 따라 약간 다를 수 있다).
```
[graphify extract] found 22 code, 0 docs, 0 papers, 0 images
[graphify extract] wrote .../graphify-out/graph.json: 584 nodes, 1057 edges, 29 communities
Done - 29 communities. GRAPH_REPORT.md, graph.json and graph.html updated.
```

## 체크리스트
- [ ] `graphify extract . --code-only`를 실행하고 노드 수가 수백 개 규모인지 확인한다.
- [ ] `graphify cluster-only . --no-label`을 실행한다.
- [ ] `graphify-out/graph.html`을 브라우저로 열어 그래프가 보이는지 확인한다.
- [ ] `graphify-out/GRAPH_REPORT.md`를 열어 본다.

---

# 7 단계: 리포트와 그래프 이해하기

## 규칙

- `GRAPH_REPORT.md`에는 다음 항목이 있다.
  - **Summary**: 노드·엣지·커뮤니티 수, `EXTRACTED`/`INFERRED` 비율
  - **Graph Freshness**: 그래프를 만든 커밋 해시. `git rev-parse HEAD`와 비교하면 그래프가 오래됐는지 알 수 있다.
  - **God Nodes**: 가장 많이 연결된, 즉 모든 것이 거쳐 가는 핵심 개념
  - **Surprising Connections**: 서로 다른 파일·모듈에 있는데도 연결된 부분
  - **Communities**: 그래프를 하위 시스템 단위로 나눈 군집(Leiden 알고리즘)
  - **Suggested Questions**: 이 그래프로 답할 수 있는 질문
- 코드의 docstring과 `# WHY:`, `# NOTE:`, `# HACK:` 같은 주석은 별도 노드(`rationale_for` 엣지)로 추출된다.
- 모든 엣지에는 신뢰도 태그(`EXTRACTED`/`INFERRED`/`AMBIGUOUS`)가 붙어 있다. 소스에서 직접 읽은 연결과 추론된 연결을 구분할 수 있다.
- God node 목록은 터미널에서도 볼 수 있다.
  ```bash
  graphify god-nodes --top 6
  ```
  requests v2.32.3에서의 예상 결과:
  ```
  1. Response - 35 edges
  2. HTTPAdapter - 34 edges
  3. Session - 33 edges
  4. RequestsCookieJar - 32 edges
  5. PreparedRequest - 29 edges
  6. CaseInsensitiveDict - 26 edges
  ```
  요청(`PreparedRequest`)을 만들어 세션(`Session`)이 어댑터(`HTTPAdapter`)로 보내고 응답(`Response`)을 받는 requests의 핵심 흐름이 그대로 드러난다.
- 노드가 5,000개를 넘어 `graph.html`이 너무 무거워지면 `--no-viz`로 HTML 생성을 건너뛰고 `graph.json`만 쓴다.

## 산출물

- requests의 구조와 핵심 개념에 대한 1차 이해.
- 다음 단계에서 질의할 개념 목록(예: `HTTPAdapter`, `Session`, `HTTPBasicAuth`).

## 체크리스트
- [ ] `graphify god-nodes --top 6`에서 `HTTPAdapter`와 `Session`이 상위에 있는지 확인한다.
- [ ] `GRAPH_REPORT.md`의 Suggested Questions 중 하나를 골라 둔다.
- [ ] `graph.html`에서 `HTTPAdapter` 노드를 검색해 클릭하고, 연결된 노드를 살펴본다.

---

# 8 단계: 그래프에 질의하기

## 규칙

- **하나의 개념 설명**: `graphify explain "개념명"`
  ```bash
  graphify explain "HTTPAdapter"
  ```
  예상 결과(일부):
  ```
  Node: HTTPAdapter
    Source:    src/requests/adapters.py L167
    Degree:    34
  Connections:
    <-- sessions.py [imports] [EXTRACTED] src/requests/sessions.py:L15
    --> BaseAdapter [inherits] [EXTRACTED] src/requests/adapters.py:L167
    --> .send() [method] [EXTRACTED] src/requests/adapters.py:L613
    --> ConnectTimeout [uses] [INFERRED] src/requests/adapters.py:L688
    ...
  ```
- **두 개념 사이의 최단 경로**: `graphify path "개념A" "개념B"`
  ```bash
  graphify path "Session" "init_poolmanager"
  # Session --uses [INFERRED]--> HTTPAdapter --method [EXTRACTED]--> .init_poolmanager()
  ```
  - 기본은 엣지 방향을 따라 찾는다. `No directed path found`가 나오면 `--undirected`를 붙여 방향을 무시하고 다시 찾는다.
  ```bash
  graphify path "HTTPBasicAuth" "HTTPAdapter" --undirected
  # HTTPBasicAuth <--contains-- auth.py <--imports_from-- adapters.py --contains--> HTTPAdapter
  ```
- **자연어 질문**: `graphify query "질문"`
  ```bash
  graphify query "how does a Session send a request through the adapter" --budget 1500
  ```
  - 결과가 `TRUNCATED`로 잘리면 `--budget`을 늘리거나 질문을 좁힌다.
- AI 어시스턴트 안에서도 `/graphify query ...` 형태로 쓸 수 있다.
- 도구 호출로 반복해서 접근하려면 그래프를 MCP 서버로 띄울 수 있다.
  ```bash
  python -m graphify.serve graphify-out/graph.json
  ```
- 질의 로그는 기본적으로 저장되지 않는다. `GRAPHIFY_QUERY_LOG_ENABLE=1`을 설정해야 `~/.cache/graphify-queries.log`에 기록된다.

## 산출물

- 개념별 소스 위치, 연결 관계, 신뢰도 태그가 포함된 답변.
- 두 개념 사이의 관계를 보여 주는 경로(hop) 목록.

## 체크리스트
- [ ] `graphify explain "HTTPAdapter"`에서 `src/requests/adapters.py L167`이 나오는지 확인한다.
- [ ] `graphify path "Session" "init_poolmanager"`로 2-hop 경로를 확인한다.
- [ ] `graphify path "HTTPBasicAuth" "HTTPAdapter"`를 실행하고, 실패하면 `--undirected`로 다시 시도한다.
- [ ] 7단계에서 골라 둔 질문을 `graphify query`로 물어본다.

---

# 9 단계: 그래프 커밋과 자동 갱신 훅 설치하기

## 규칙

- `graphify-out/`은 git에 커밋해서 팀 전체가 같은 그래프에서 시작하게 하는 것을 권장한다. 단, 로컬 전용 파일은 `.gitignore`에 추가한다.
  ```bash
  cat >> .gitignore <<'EOF'
  graphify-out/cost.json
  graphify-out/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/
  EOF
  ```
  - `cost.json`: 로컬 API 비용 기록
  - 날짜 이름 폴더(예: `graphify-out/2026-09-23/`): 커뮤니티 이름이 붙은 그래프를 재빌드할 때 graphify가 하루 한 번 만드는 로컬 백업
- 지금까지 만든 파일을 첫 커밋으로 남긴다.
  ```bash
  git add .gitignore .graphifyignore .claude/ CLAUDE.md graphify-out/
  git commit -m "chore: add graphify skill, ignore rules and knowledge graph"
  ```
- 그다음 **훅을 설치한다.** 클론할 때마다 한 번씩 실행한다.
  ```bash
  graphify hook install
  graphify hook status
  ```
  설치되는 것은 다음과 같다.
  - post-commit 훅: `git commit` 후 백그라운드에서 그래프 재빌드(AST만 사용, API 비용 없음)
  - post-checkout 훅: `git checkout`/`git switch` 후 자동 재빌드
  - git merge driver: `graph.json` 병합 충돌 방지. 이때 `.gitattributes`가 새로 생긴다.
- 새로 생긴 `.gitattributes`도 커밋해야 팀원에게 merge driver 설정이 전달된다.
  ```bash
  git add .gitattributes && git commit -m "chore: register graphify merge driver"
  ```
- **알아 둘 점:** post-commit 훅은 커밋이 끝난 **뒤에** 그래프를 다시 만든다. 그래서 커밋 직후 `git status`를 보면 `graphify-out/` 파일이 수정됨(`M`)으로 표시된다. 정상이다. 다음 커밋에 함께 넣거나 `chore: update graph` 커밋으로 따로 남긴다.
- 재빌드 로그는 `~/.cache/graphify-rebuild.log`에서 확인할 수 있다.

## 산출물

- `graphify-out/`, 설정 파일, `.gitattributes`가 커밋된 실습 브랜치.
- `git commit` / `git switch`만으로 최신 상태가 유지되는 그래프.

## 체크리스트
- [ ] `.gitignore`에 `graphify-out/cost.json`과 날짜 백업 폴더 패턴을 추가한다.
- [ ] 설정 파일과 `graphify-out/`을 커밋한다.
- [ ] `graphify hook install`을 실행한다.
- [ ] `graphify hook status`에서 세 항목이 모두 `installed`/`registered`인지 확인한다.
- [ ] `.gitattributes`를 커밋한다.

---

# 10 단계: 팀원과 동기화하기

## 규칙

- `git pull`/`git merge` 뒤에는 **직접** `graphify update .`를 실행해야 한다. 자동화되지 않는 유일한 단계다.
  ```bash
  git pull
  graphify update .
  ```
- 두 명령을 alias로 묶어 두면 편하다.
  ```bash
  git config --global alias.gpull '!git pull && graphify update .'
  git gpull
  ```
- 문서나 논문이 바뀌었을 때는 AI 어시스턴트에서 `/graphify --update`로 해당 노드만 갱신한다. 코드 그래프와 문서 그래프는 따로 갱신된다.
- 리팩터링으로 파일이 줄었는데 노드 수가 그대로라면 `graphify update . --force`(또는 `GRAPHIFY_FORCE=1`)로 강제 재빌드한다.
- 실제로 팀원의 변경을 받아 보는 연습은 SAMPLE.md 7~8단계에서 로컬 클론을 하나 더 만들어 진행한다.

## 산출물

- 팀원 간 충돌 없이 공유되는 `graph.json`.
- `git gpull` 한 번으로 코드와 그래프가 함께 최신화되는 작업 습관.

## 체크리스트
- [ ] `git config --global alias.gpull '!git pull && graphify update .'`를 설정한다.
- [ ] `git config --get alias.gpull`로 alias가 등록됐는지 확인한다.
- [ ] 문서 변경 시 `/graphify --update`, 대규모 삭제 후 `--force`를 쓴다는 점을 기억한다.
