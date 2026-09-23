# 개념

**GitNexus**는 코드베이스 전체를 **지식 그래프**로 색인하는 도구다. 그래프에는 누가 누구를 호출하는지, 무엇을 import하는지, 어떤 실행 흐름이 어떤 함수를 거치는지가 담긴다. 이 그래프를 MCP 도구로 AI 코딩 어시스턴트(Claude Code, Cursor, Codex 등)에 제공한다. 코드는 Tree-sitter로 **로컬에서** 파싱하며, 색인 데이터는 저장소 안의 `.gitnexus/` 폴더에 저장된다.

리팩터링할 때 AI가 가장 자주 저지르는 실수는 **"고친 함수를 누가 쓰고 있는지 모르고 고치는 것"**이다. 예를 들어 이름을 바꿨는데 다른 파일의 import 한 줄을 놓치면, 프로그램 전체가 시작조차 안 될 수 있다. GitNexus는 이 문제를 네 가지 도구로 막는다.

| 도구 | 하는 일 | 리팩터링에서의 역할 |
|---|---|---|
| `context` | 한 심볼의 호출자·피호출자·실행 흐름을 한 번에 보여 준다 | "이 함수는 누가 쓰나?" |
| `impact` | 바꾸면 영향받는 범위(blast radius)와 위험도를 계산한다 | "고치면 어디가 깨지나?" |
| `rename` | 그래프를 따라 여러 파일의 이름을 한꺼번에 바꾼다 (미리보기 지원) | "안전하게 이름 바꾸기" |
| `detect_changes` | git diff를 심볼·실행 흐름 단위로 해석한다 | "커밋 전에 예상한 곳만 바뀌었나?" |

이 가이드는 GitNexus를 처음 쓰는 사람을 위한 것이다. 설치부터 **"영향 분석 → 이름 바꾸기 → 검증 → 커밋"**이라는 안전한 리팩터링 루프까지 순서대로 따라 할 수 있다.

## 실습 저장소와 실습 과제

| 항목 | 값 |
|---|---|
| 저장소 | [psf/requests](https://github.com/psf/requests) 태그 `v2.32.3` (파이썬 HTTP 라이브러리) |
| 작업 폴더 | `~/work/gitnexus/requests` |
| 실습 브랜치 | `refactor-practice` |
| 실습 과제 (이 가이드) | `get_auth_from_url` 함수를 `extract_auth_from_url`로 이름 바꾸기 |
| 실습 과제 (SAMPLE.md) | `should_bypass_proxies` 함수를 `is_proxy_bypassed`로 이름 바꾸기 |

> 검증 환경: GitNexus 1.6.12, Node.js 22, Python 3.12, Ubuntu 24.04 (2026-09-23 기준).
> 이 문서의 모든 CLI 명령과 MCP `rename` 호출은 이 환경에서 실제로 실행해 결과를 확인했다. 숫자는 버전에 따라 조금 달라질 수 있다.

> **라이선스 안내:** GitNexus는 PolyForm Noncommercial 라이선스다. 학습·개인·비상업 용도는 자유롭게 쓸 수 있지만, 회사 업무 같은 상업적 사용에는 별도 라이선스가 필요하다.

---

# 1 단계: 사전 준비 확인하기

## 규칙

- **Node.js**가 필요하다. GitNexus는 npm 패키지로 배포된다. `node --version`으로 확인하고, 없으면 LTS 버전(22 권장)을 설치한다.
  - macOS(Homebrew): `brew install node@22`
  - Windows: `winget install OpenJS.NodeJS.LTS`
  - Ubuntu/Debian: [nodejs.org](https://nodejs.org) 안내 또는 `nvm install 22`
- **git**이 필요하다. `git --version`으로 확인한다.
- **Python 3.10 이상**이 필요하다. 실습 저장소(requests)의 테스트를 돌리는 데 쓴다. `python3 --version`으로 확인한다.
- **Claude Code**가 설치되어 있어야 한다. `claude --version`으로 확인한다. 이 가이드는 Claude Code를 기준으로 설명한다. Cursor, Codex도 같은 방식으로 연결할 수 있다.
- **npm 11 사용자 주의:** npm 11.x에서는 `npx gitnexus ...`가 설치 도중 `Cannot destructure property 'package'` 오류로 멈출 수 있다(npm 쪽 버그). 이 가이드처럼 `npm install -g`로 전역 설치하면 이 문제를 피할 수 있다.

## 산출물

- Node.js, git, Python 3.10+, Claude Code가 설치된 로컬 환경.

## 체크리스트
- [ ] `node --version`이 정상 출력되는지 확인한다.
- [ ] `git --version`, `python3 --version`(3.10 이상)을 확인한다.
- [ ] `claude --version`으로 Claude Code가 설치되어 있는지 확인한다.

---

# 2 단계: GitNexus 설치하고 Claude Code에 연결하기

## 규칙

- GitNexus를 **전역으로** 설치한다. 전역 설치를 하면 MCP 서버가 `npx`를 거치지 않고 바로 실행된다. 그래서 Claude Code의 MCP 시작 시간 제한(약 30초)에 걸리지 않는다.
  ```bash
  npm install -g gitnexus@latest
  gitnexus --version        # 예: 1.6.12
  ```
  - 설치 중 C++ 컴파일러가 없다는 오류가 나면, 다음 환경 변수를 붙여 다시 설치한다. 이 실습에 필요 없는 Dart/Proto/Swift/Kotlin 파서만 건너뛴다.
    ```bash
    GITNEXUS_SKIP_OPTIONAL_GRAMMARS=1 npm install -g gitnexus@latest
    ```
- Claude Code에 연결한다. **최초 한 번만** 하면 되고, 이후 모든 저장소에서 쓸 수 있다.
  ```bash
  gitnexus setup -c claude
  ```
  이 명령은 세 가지를 설치한다.
  - **MCP 서버 등록**: `~/.claude.json`. Claude Code가 `impact`, `rename` 같은 도구를 쓸 수 있게 된다.
  - **스킬 12종**: `~/.claude/skills/`. 탐색, 디버깅, 영향 분석, **리팩터링** 등 상황별 작업 절차다.
  - **훅**: PreToolUse, PostToolUse. 검색할 때 그래프 정보를 덧붙이고, 커밋 후 색인이 오래되면 알려 준다.
- `-c claude`를 빼고 `gitnexus setup`만 실행하면, 설치된 에디터(Cursor, Codex 등)를 자동으로 찾아 모두 설정한다.
- **중요:** 이름 바꾸기(`rename`)는 **MCP 도구로만** 제공된다. 터미널 명령(`gitnexus rename`)은 없다. 그래서 리팩터링 적용 단계는 Claude Code 안에서 진행한다.

## 산출물

- 전역 `gitnexus` 명령.
- Claude Code의 MCP 설정, 스킬, 훅.

## 체크리스트
- [ ] `npm install -g gitnexus@latest`를 실행하고 `gitnexus --version`을 확인한다.
- [ ] `gitnexus setup -c claude`를 실행하고, 출력에 `Claude Code`, `skills`, `hooks`가 모두 `+`로 표시되는지 확인한다.

---

# 3 단계: 실습 저장소 클론하고 기준선 테스트 통과시키기

## 규칙

- 버전을 고정하려고 태그 `v2.32.3`을 얕은 클론으로 받는다. 다른 실습 폴더와 섞이지 않도록 `~/work/gitnexus` 아래에 둔다.
  ```bash
  mkdir -p ~/work/gitnexus && cd ~/work/gitnexus
  git clone --depth 1 --branch v2.32.3 https://github.com/psf/requests.git
  cd requests
  git switch -c refactor-practice
  ```
  태그를 클론하면 "detached HEAD" 안내가 나오는데 정상이다. 바로 실습 브랜치를 만들면 된다.
- git 사용자 정보가 없다면 이 저장소에만 설정한다.
  ```bash
  git config user.name  "홍길동"
  git config user.email "gildong@example.com"
  ```
- **리팩터링의 제1원칙: 고치기 전에 테스트가 통과하는지 먼저 확인한다.** 처음부터 실패하던 테스트는 내가 망가뜨린 것과 구분할 수 없기 때문이다. 가상 환경을 만들어 requests와 pytest를 설치한다.
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate          # Windows: .venv\Scripts\activate
  pip install -e . pytest
  python -m pytest tests/test_utils.py -q
  ```
  예상 결과:
  ```
  203 passed, 13 skipped
  ```
  - `tests/test_utils.py`는 네트워크 없이 돌아가므로 실습용 기준선으로 쓰기 좋다.
  - 통과 개수는 환경에 따라 조금 다를 수 있다. **실패(failed)가 0개**인지가 중요하다.
- `.venv/`는 requests의 `.gitignore`에 이미 들어 있어 커밋되지 않는다.
- **함정 주의 — `test_zipped_paths_extracted`가 혼자 실패할 때.** 이 테스트는 자기 파일(`test_utils.py`)을 임시 폴더에 풀어 두고, **이미 같은 이름의 파일이 있으면 새로 쓰지 않고 재사용한다.** 그래서 한 번 테스트를 돌린 뒤 `test_utils.py`를 고치면, 코드와 상관없이 이 테스트 하나만 실패한다. **테스트 파일을 고친 뒤에는** 임시 파일을 지우고 다시 실행한다.
  ```bash
  python -c "import os,tempfile; p=os.path.join(tempfile.gettempdir(),'test_utils.py'); os.path.exists(p) and os.remove(p)"
  ```

## 산출물

- `~/work/gitnexus/requests`, 브랜치 `refactor-practice`.
- 실패 0개인 기준선 테스트 결과.

## 체크리스트
- [ ] `git clone --depth 1 --branch v2.32.3 ...`으로 클론하고 `refactor-practice` 브랜치를 만든다.
- [ ] 가상 환경을 만들고 `pip install -e . pytest`를 실행한다.
- [ ] `python -m pytest tests/test_utils.py -q`에서 failed가 0개인지 확인한다.

---

# 4 단계: 저장소 색인하고 생성된 규칙 파일 이해하기

## 규칙

- 저장소 루트에서 색인한다.
  ```bash
  gitnexus analyze
  ```
  예상 출력:
  ```
  Repository indexed successfully (5.2s)
  1,136 nodes | 2,162 edges | 57 clusters | 95 flows
  ```
  - **nodes**: 함수, 클래스, 파일 같은 코드 요소
  - **edges**: 호출, import, 상속 같은 관계
  - **clusters**: 서로 긴밀하게 연결된 기능 묶음
  - **flows**: 진입점에서 시작하는 실행 흐름(예: `Session.send → ... → get_auth_from_url`)
- `analyze`는 색인 외에도 다음 파일을 만든다.

  | 파일 | 역할 | 커밋 여부 |
  |---|---|---|
  | `.gitnexus/` | 색인 데이터베이스 | 커밋 안 함 (자동으로 git에서 제외됨) |
  | `CLAUDE.md` | Claude Code가 항상 지키는 규칙 | 팀과 공유하려면 커밋 |
  | `AGENTS.md` | 다른 에이전트(Codex 등)용 같은 규칙 | 팀과 공유하려면 커밋 |
  | `.claude/skills/gitnexus-*/` | 저장소용 스킬 6종 (`gitnexus-refactoring` 포함) | 팀과 공유하려면 커밋 |

- **`CLAUDE.md`를 꼭 한 번 읽어 본다.** 이 모듈의 "규칙" 산출물이 바로 이 파일이다. 리팩터링과 관련된 핵심 규칙은 다음과 같다.
  - 함수·클래스·메서드를 고치기 전에 **반드시 `impact`를 먼저 실행**한다.
  - 커밋 전에 **반드시 `detect_changes`로 변경 범위를 확인**한다.
  - 위험도가 HIGH/CRITICAL이면 **사용자에게 경고**한다.
  - 이름은 찾아 바꾸기(find-and-replace)가 아니라 **`rename` 도구**로 바꾼다.
  - 호출자가 0개로 나와도 안전하다는 뜻이 아니다. **텍스트 검색으로 한 번 더 확인**한다.
- 색인 상태는 언제든 확인할 수 있다.
  ```bash
  gitnexus status     # Indexed commit과 Current commit이 같으면 최신 상태
  gitnexus list       # 색인된 저장소 목록 (이름: requests)
  ```
- `analyze` 출력에 `full-text/BM25 search is disabled` 경고가 보이면, 검색 확장을 내려받지 못한 것이다(방화벽 등). 이 경우 `query`(키워드 검색)만 약해지고, 이 가이드에서 쓰는 `context`/`impact`/`rename`/`detect_changes`는 정상 동작한다. 네트워크가 되는 곳에서 `gitnexus analyze --repair-fts`를 실행하면 복구된다.

## 산출물

- `.gitnexus/` 색인, `CLAUDE.md`, `AGENTS.md`, `.claude/skills/gitnexus-*/`.

## 체크리스트
- [ ] `gitnexus analyze`를 실행하고 nodes/edges 수가 출력되는지 확인한다.
- [ ] `CLAUDE.md`를 열어 "Always Do"와 "Never Do" 규칙을 읽는다.
- [ ] `.claude/skills/gitnexus-refactoring/SKILL.md`를 열어 "Rename Symbol" 체크리스트를 확인한다.
- [ ] `gitnexus status`에서 Indexed commit과 Current commit이 같은지 확인한다.

---

# 5 단계: 고치기 전에 영향 분석하기

## 규칙

실습 과제는 `get_auth_from_url`을 `extract_auth_from_url`로 바꾸는 것이다. **아무것도 고치기 전에** 다음을 먼저 확인한다. 명령 뒤의 `2>/dev/null`은 로그 메시지를 숨겨 결과만 보이게 한다(Windows PowerShell에서는 `2>$null`).

**① 누가 이 함수를 쓰는가 — `context`**
```bash
gitnexus context get_auth_from_url 2>/dev/null
```
예상 결과(요약):
```json
"symbol":   { "name": "get_auth_from_url", "filePath": "src/requests/utils.py", "startLine": 1018 },
"incoming": { "calls": [
    { "name": "proxy_headers",     "filePath": "src/requests/adapters.py" },
    { "name": "proxy_manager_for", "filePath": "src/requests/adapters.py" },
    { "name": "prepare_auth",      "filePath": "src/requests/models.py" },
    { "name": "rebuild_proxies",   "filePath": "src/requests/sessions.py" } ] },
"processes": [ { "name": "Send → Get_auth_from_url" }, { "name": "Get_connection → Get_auth_from_url" }, ... ]
```
호출자는 3개 파일에 걸친 4곳이고, `Session.send`(요청 보내기) 같은 핵심 실행 흐름에 들어 있다.

**② 고치면 어디까지 영향이 가는가 — `impact`**
```bash
gitnexus impact get_auth_from_url --direction upstream 2>/dev/null
```
예상 결과(요약):
```json
"impactedCount": 12,
"risk": "CRITICAL",
"summary": { "direct": 4, "processes_affected": 12, "modules_affected": 1 },
"byDepthCounts": { "1": 4, "2": 4, "3": 4 }
```
- `--direction upstream`은 "이 함수에 **의존하는 쪽**"을 찾는다. 이름을 바꾸거나 동작을 바꿀 때는 항상 upstream을 본다.
- **깊이(depth)**:
  - 1은 직접 호출하는 곳이다. 고치지 않으면 **확실히 깨진다**.
  - 2~3은 그 호출자를 다시 호출하는 곳이다. **영향을 받을 수 있다**.
- **`risk: CRITICAL`**은 "하지 마라"가 아니라 **"핵심 흐름을 건드리니 신중하게 하라"**는 뜻이다. 이 함수는 모든 HTTP 요청이 거치는 경로에 있으므로 CRITICAL이 나오는 게 자연스럽다.

**③ 테스트 코드까지 포함해서 보기**

`impact`는 기본적으로 테스트 파일을 결과에서 뺀다. 리팩터링할 때는 테스트도 함께 고쳐야 하므로 `--include-tests`를 붙여 한 번 더 본다.
```bash
gitnexus impact get_auth_from_url --direction upstream --include-tests 2>/dev/null
```
`tests/test_requests.py`의 테스트들이 결과에 추가된다. 하지만 `tests/test_utils.py`에서 이 함수를 **직접 import해서 테스트하는 코드는 결과에 나오지 않는다.** 그래프가 모든 연결을 잡지는 못한다는 뜻이다. 그래서 텍스트 검색으로 교차 확인한다.
```bash
git grep -n "get_auth_from_url" -- src tests
```
결과는 다음과 같다.
- `src/requests/utils.py` 정의 1줄
- `src/` 사용처 7줄(import 3줄, 호출 4줄)
- `tests/test_utils.py` 3줄

이 목록을 메모해 둔다. 6단계에서 빠짐없이 바뀌었는지 비교할 때 쓴다.

## 산출물

- 직접 호출자 4곳, 영향받는 실행 흐름, 위험도(CRITICAL)가 정리된 **영향 분석 메모**.
- 그래프에 잡히지 않은 사용처(`tests/test_utils.py`) 목록.

## 체크리스트
- [ ] `gitnexus context get_auth_from_url`로 호출자 4곳을 확인한다.
- [ ] `gitnexus impact ... --direction upstream`에서 `risk`와 `byDepthCounts`를 확인한다.
- [ ] `--include-tests`를 붙여 테스트 쪽 영향도 확인한다.
- [ ] `git grep`으로 그래프가 놓친 사용처가 있는지 교차 확인한다.

---

# 6 단계: rename으로 이름 바꾸고 빠진 곳 채우기

## 규칙

`rename`은 MCP 도구이므로 **Claude Code 안에서** 실행한다. 저장소 루트에서 `claude`를 실행한 뒤 아래처럼 요청한다.

**① 반드시 미리보기(dry run)부터**
```
gitnexus rename 도구로 get_auth_from_url을 extract_auth_from_url로 바꾸는 미리보기(dry_run: true)만 보여줘. 아직 파일은 고치지 마.
```
예상 결과(요약):
```
files_affected: 4
total_edits: 8
graph_edits: 8        (그래프 근거, 신뢰도 높음)
text_search_edits: 0  (텍스트 검색 근거, 있다면 한 줄씩 직접 검토)
changes:
  src/requests/utils.py     L1018  def get_auth_from_url(url):  →  def extract_auth_from_url(url):
  src/requests/adapters.py  L52, L281, L606
  src/requests/models.py    L58, L593
  src/requests/sessions.py  L44, L322
```
5단계의 `git grep` 결과와 비교한다. **`tests/test_utils.py`가 목록에 없다.**

**② 적용**
```
미리보기 내용대로 적용해줘(dry_run: false).
```

**③ 빠진 곳 확인 — 테스트가 알려 준다**
```bash
git grep -n "get_auth_from_url" -- src tests
python -m pytest tests/test_utils.py -q
```
예상 결과:
```
tests/test_utils.py:22:    get_auth_from_url,
...
E   ImportError: cannot import name 'get_auth_from_url' from 'requests.utils'
```
테스트 파일이 옛 이름을 import하고 있어서 테스트가 아예 시작되지 않는다. **rename만 믿고 커밋했다면 이 오류가 그대로 들어갔을 것이다.**

**④ 하위 호환 별칭 추가하기**

requests는 누구나 쓰는 공개 라이브러리다. 외부 사용자가 `from requests.utils import get_auth_from_url`을 쓰고 있을 수 있다. 그래서 옛 이름을 바로 지우지 않고, 새 이름을 가리키는 **별칭**을 남긴다. `src/requests/utils.py`에서 `extract_auth_from_url` 함수가 끝나는 `return auth` 바로 아래에 다음을 추가한다.
```python
# 하위 호환: 외부 코드가 예전 이름을 계속 쓸 수 있도록 별칭을 남긴다.
get_auth_from_url = extract_auth_from_url
```

**⑤ 테스트를 새 이름에 맞추기**

`tests/test_utils.py`를 다음처럼 고친다. 새 이름을 테스트하고, 별칭이 살아 있는지도 확인한다.
```diff
 from requests.utils import (
     ...
+    extract_auth_from_url,
     get_auth_from_url,
     ...
 )
 ...
-def test_get_auth_from_url(url, auth):
-    assert get_auth_from_url(url) == auth
+def test_extract_auth_from_url(url, auth):
+    assert extract_auth_from_url(url) == auth
+
+
+def test_get_auth_from_url_alias():
+    assert get_auth_from_url is extract_auth_from_url
```
Claude Code에게 "별칭을 추가하고 테스트를 새 이름에 맞게 고쳐줘"라고 맡겨도 된다. 그래도 결과 diff는 직접 확인한다.

**⑥ 기준선과 같은지 확인**

테스트 파일을 고쳤으므로, 3단계에서 설명한 임시 파일부터 지운다. 지우지 않으면 `test_zipped_paths_extracted` 하나가 코드와 상관없이 실패한다.
```bash
python -c "import os,tempfile; p=os.path.join(tempfile.gettempdir(),'test_utils.py'); os.path.exists(p) and os.remove(p)"
python -m pytest tests/test_utils.py -q
# 204 passed, 13 skipped   ← 별칭 테스트 1개가 늘었고 failed는 0
```

## 산출물

- 4개 소스 파일 8곳의 이름 변경, 하위 호환 별칭, 새 이름에 맞춘 테스트.
- failed 0개인 테스트 결과.

## 체크리스트
- [ ] `rename`을 **dry_run: true**로 먼저 실행해 변경 목록을 확인한다.
- [ ] 미리보기와 5단계의 `git grep` 결과를 비교해 빠진 파일을 찾는다.
- [ ] 적용 후 테스트를 돌려 `ImportError`를 직접 확인한다.
- [ ] 하위 호환 별칭을 추가하고 테스트를 고친다.
- [ ] 테스트가 다시 failed 0개가 되는지 확인한다.

---

# 7 단계: 변경 범위 검증하고 커밋·재색인하기

## 규칙

**① 커밋 전에 `detect_changes`로 변경 범위 확인**
```bash
gitnexus detect-changes --scope all 2>/dev/null
```
예상 결과(요약):
```
Changes: 5 files, ...
Risk level: high
Changed symbols:
  Method proxy_manager_for → src/requests/adapters.py
  Method proxy_headers → src/requests/adapters.py
  Method prepare_auth → src/requests/models.py
  Method rebuild_proxies → src/requests/sessions.py
  Function get_auth_from_url → src/requests/utils.py
  ...
Affected execution flows:
  • Send → Get_auth_from_url (5 steps) — changed: ...
```
- **확인 포인트:** "바뀐 심볼"이 5단계 영향 분석에서 본 호출자 목록과 일치하는가? 예상하지 못한 파일이나 함수가 끼어 있으면 커밋하지 말고 원인을 찾는다.
- **`--scope all`을 꼭 붙인다.** 기본값(`unstaged`)은 아직 `git add`하지 않은 변경만 본다. `git add` 뒤에 옵션 없이 실행하면 `No changes detected`가 나와 "문제없음"으로 착각하기 쉽다.

**② 커밋**
```bash
git add src tests
git commit -m "refactor: rename get_auth_from_url to extract_auth_from_url (keep alias)"
```

**③ 색인을 최신으로**

커밋하면 코드가 바뀌었으므로 색인은 오래된(stale) 상태가 된다.
```bash
gitnexus status      # Status: ⚠️ stale (re-run gitnexus analyze)
gitnexus analyze     # 변경된 파일만 다시 처리하므로 금방 끝난다
gitnexus context extract_auth_from_url 2>/dev/null
```
새 이름으로 조회되고, 실행 흐름 이름도 `Send → Extract_auth_from_url`로 바뀌었으면 끝이다. Claude Code의 PostToolUse 훅도 커밋 뒤 색인이 오래됐으면 에이전트에게 재색인하라고 알려 준다.

**④ (선택) 팀과 규칙 공유**

`CLAUDE.md`, `AGENTS.md`, `.claude/skills/`를 커밋하면, 팀원이 클론한 뒤 `gitnexus analyze`만 실행해도 같은 규칙으로 작업하게 된다. 이 파일들은 `analyze`를 실행할 때마다 GitNexus 구역(`<!-- gitnexus:start -->` ~ `<!-- gitnexus:end -->`)이 갱신된다. 직접 수정한 내용을 지키려면 `gitnexus analyze --skip-agents-md`를 쓴다.

## 산출물

- 변경 범위가 검증된 리팩터링 커밋.
- 최신 커밋과 일치하는 색인.

## 체크리스트
- [ ] `gitnexus detect-changes --scope all`의 바뀐 심볼 목록이 5단계 영향 분석과 일치하는지 확인한다.
- [ ] 테스트가 failed 0개인 상태에서 커밋한다.
- [ ] `gitnexus status`로 stale 상태를 확인한 뒤 `gitnexus analyze`로 재색인한다.
- [ ] `gitnexus context extract_auth_from_url`로 새 이름이 색인에 반영됐는지 확인한다.
