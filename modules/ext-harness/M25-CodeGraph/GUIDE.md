# 개념

**CodeGraph**는 코드베이스를 미리 색인해 둔 **지식 그래프**다. 그래프에는 모든 심볼(함수·클래스·메서드), 호출 관계, import 관계가 담긴다. 이 그래프를 AI 코딩 어시스턴트(Claude Code, Cursor, Codex 등)에 MCP 도구와 CLI로 제공한다. 파싱은 Rust로 만든 엔진이 **로컬에서** 하고, 결과는 저장소 안의 `.codegraph/codegraph.db`(SQLite)에 저장된다. API 키도 외부 서버도 필요 없고, 라이선스는 MIT다.

리팩터링 관점에서 CodeGraph의 특징은 세 가지다.

| 특징 | 내용 | 리팩터링에서의 의미 |
|---|---|---|
| **호출자·영향 범위 조회** | `callers`, `impact`, `explore`로 "누가 이 함수를 쓰는지"를 파일:줄 단위로 보여 준다. 호출은 하지 않고 **import만 하는 파일**도 잡아낸다 | 고치기 전에 할 일 목록을 만든다 |
| **자동 동기화** | 파일이 바뀌면 약 2초 안에 그래프가 스스로 갱신된다 | 고친 직후 "옛 이름을 아직 쓰는 곳"을 다시 조회하면 **남은 할 일 목록**이 된다 |
| **영향받는 테스트 찾기** | `affected`가 바뀐 파일에 의존하는 테스트 파일을 찾아 준다 | 무엇을 테스트해야 하는지 고른다 |

앞 모듈의 GitNexus와 가장 크게 다른 점은 **자동 이름 바꾸기(`rename`) 도구가 없다**는 것이다. 수정은 Claude Code가 평소처럼 파일을 편집해서 한다. CodeGraph는 **수정 전에는 할 일 목록을, 수정 후에는 남은 일 목록을** 정확하게 알려 주는 역할을 맡는다. 그래서 이 가이드의 리팩터링 루프는 다음과 같다.

> **조회(callers/impact) → 계획 승인 → 수정 → 다시 조회(옛 이름 callers) → 테스트(affected) → 커밋**

## 실습 저장소와 실습 과제

| 항목 | 값 |
|---|---|
| 저장소 | [psf/requests](https://github.com/psf/requests) 태그 `v2.32.3` (파이썬 HTTP 라이브러리) |
| 작업 폴더 | `~/work/codegraph/requests` (앞 모듈 폴더와 섞지 않는다) |
| 실습 브랜치 | `refactor-practice` |
| 실습 과제 (이 가이드) | 이름 바꾸기: `should_bypass_proxies` → `is_proxy_bypassed` |
| 실습 과제 (SAMPLE.md) | 모듈 추출: 네트워크 도우미 함수 4개를 `utils.py`에서 새 파일 `_netutils.py`로 옮기기 |

> 검증 환경: CodeGraph 1.6.0, Python 3.12, Ubuntu 24.04 (2026-09-23 기준).
> 이 문서의 CLI 명령과 결과는 이 환경에서 실제로 실행해 확인했다. 숫자와 줄 번호는 버전에 따라 조금 달라질 수 있다.

---

# 1 단계: 사전 준비 확인하기

## 규칙

- **git**이 필요하다. `git --version`으로 확인한다.
- **Python 3.10 이상**이 필요하다. 실습 저장소(requests)의 테스트를 돌리는 데 쓴다. `python3 --version`으로 확인한다.
- **Claude Code**가 설치되어 있어야 한다. `claude --version`으로 확인한다.
- **Node.js는 필요 없다.** CodeGraph는 자체 실행 환경을 포함한 단일 배포판으로 설치된다. 이미 Node가 있다면 npm으로 설치해도 된다.

## 산출물

- git, Python 3.10+, Claude Code가 설치된 로컬 환경.

## 체크리스트
- [ ] `git --version`, `python3 --version`(3.10 이상)을 확인한다.
- [ ] `claude --version`으로 Claude Code가 설치되어 있는지 확인한다.

---

# 2 단계: CodeGraph 설치하고 Claude Code에 연결하기

## 규칙

- CLI를 설치한다. 셋 중 하나를 고른다.
  ```bash
  # macOS / Linux
  curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh

  # Windows (PowerShell)
  irm https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.ps1 | iex

  # Node가 이미 있다면
  npm i -g @colbymchenry/codegraph
  ```
- 설치 스크립트는 현재 터미널의 PATH를 바꾸지 않는다. **새 터미널을 열고** 설치를 확인한다.
  ```bash
  codegraph version        # 예: 1.6.0
  ```
- Claude Code에 연결한다. **최초 한 번만** 하면 모든 프로젝트에 적용된다.
  ```bash
  codegraph install --target=claude --location=global --yes
  ```
  이 명령은 다음을 설정한다.

  | 위치 | 내용 |
  |---|---|
  | `~/.claude.json` | MCP 서버 등록 (`codegraph serve --mcp`) |
  | `~/.claude/settings.json` | CodeGraph 도구 자동 허용(`mcp__codegraph__*`), 프롬프트 훅 |
  | `~/.claude/CLAUDE.md` | "`.codegraph/`가 있는 저장소에서는 grep보다 CodeGraph를 먼저 써라"라는 짧은 안내 |

  옵션 없이 `codegraph install`만 실행하면 대화형으로 에이전트를 고를 수 있다.
- **Claude Code를 다시 시작**해야 MCP 서버가 로드된다.
- 알아 둘 점:
  - MCP로는 기본적으로 **`codegraph_explore` 도구 하나만** 노출된다. 이 도구 하나로 관련 코드, 호출 경로, 영향 범위를 한꺼번에 받는다.
  - `callers`, `impact`, `affected` 같은 세부 조회는 **CLI 명령**으로 쓴다. Claude Code도 필요하면 터미널 명령으로 실행한다.
- 익명 사용 통계가 켜져 있다. 원하지 않으면 `codegraph telemetry off`로 끈다. 코드, 경로, 심볼 이름은 수집되지 않는다.

## 산출물

- 전역 `codegraph` 명령.
- Claude Code의 MCP 설정, 권한, 전역 안내문.

## 체크리스트
- [ ] 새 터미널에서 `codegraph version`이 출력되는지 확인한다.
- [ ] `codegraph install --target=claude ...` 출력에 `Updated ~/.claude/settings.json`이 보이는지 확인한다.
- [ ] Claude Code를 재시작한다.

---

# 3 단계: 실습 저장소 클론하고 기준선 테스트 통과시키기

## 규칙

- 버전을 고정하려고 태그 `v2.32.3`을 얕은 클론으로 받는다.
  ```bash
  mkdir -p ~/work/codegraph && cd ~/work/codegraph
  git clone --depth 1 --branch v2.32.3 https://github.com/psf/requests.git
  cd requests
  git switch -c refactor-practice
  git config user.name  "홍길동"                  # 커밋용 정보가 없다면
  git config user.email "gildong@example.com"
  ```
- **고치기 전에 테스트가 통과하는지 먼저 확인한다.** 처음부터 실패하던 테스트는 내가 망가뜨린 것과 구분할 수 없다.
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
  `tests/test_utils.py`는 네트워크 없이 돌아가므로 기준선으로 쓰기 좋다.
- **함정 주의 — `test_zipped_paths_extracted`가 혼자 실패할 때.** 이 테스트는 자기 파일(`test_utils.py`)을 임시 폴더에 풀어 두고, **이미 같은 이름의 파일이 있으면 새로 쓰지 않고 재사용한다.** 그래서 다음 경우에 코드와 상관없이 이 테스트 하나만 실패한다.
  - 앞 모듈(GitNexus)에서 `test_utils.py`를 고친 적이 있을 때
  - 이 실습에서 `test_utils.py`를 고친 뒤 다시 돌릴 때

  이럴 때는 임시 파일을 지우고 다시 실행한다. 이후에도 **테스트 파일을 고칠 때마다** 이렇게 한다.
  ```bash
  python -c "import os,tempfile; p=os.path.join(tempfile.gettempdir(),'test_utils.py'); os.path.exists(p) and os.remove(p)"
  python -m pytest tests/test_utils.py -q
  ```

## 산출물

- `~/work/codegraph/requests`, 브랜치 `refactor-practice`.
- 실패 0개인 기준선 테스트 결과.

## 체크리스트
- [ ] 클론하고 `refactor-practice` 브랜치를 만든다.
- [ ] 가상 환경에 `pip install -e . pytest`를 설치한다.
- [ ] `python -m pytest tests/test_utils.py -q`에서 failed가 0개인지 확인한다(`test_zipped_paths_extracted`만 실패하면 임시 파일을 지우고 다시 실행).

---

# 4 단계: 저장소 색인하고 리팩터링 규칙 붙이기

## 규칙

- 저장소 루트에서 색인한다. 한 번만 하면 이후에는 자동으로 갱신된다.
  ```bash
  codegraph init --yes
  ```
  예상 출력:
  ```
  Indexed 45 files
  1,164 nodes, 2,636 edges in 559ms
  ```
- `.codegraph/`는 로컬 색인이므로 커밋하지 않는다. requests의 `.gitignore`에는 이 폴더가 없어서 `git status`에 미추적 폴더로 보인다. 저장소 파일을 건드리지 않도록 **로컬 전용 제외 목록**에 추가한다.
  ```bash
  echo ".codegraph/" >> .git/info/exclude
  git status --short        # .codegraph/가 사라져야 한다
  ```
- **리팩터링 규칙을 붙인다.** 2단계에서 설치된 전역 안내문은 "CodeGraph를 먼저 써라" 정도만 말해 준다. 리팩터링 절차는 담겨 있지 않다. 이 모듈에 함께 제공되는 [`CLAUDE.md`](./CLAUDE.md) 조각을 실습 저장소 루트에 `CLAUDE.md`라는 이름으로 복사한다. 이 파일이 이 모듈의 "규칙" 산출물이다.
  ```bash
  cp /path/to/module/CLAUDE.md ./CLAUDE.md     # 모듈 폴더 경로에 맞게 수정
  echo "CLAUDE.md" >> .git/info/exclude        # 실습 저장소에는 커밋하지 않음
  ```
  규칙의 핵심은 다음과 같다.
  - 고치기 전에 `callers`/`impact`로 조회하고 사용자에게 보고한다.
  - `file` 종류로 나오는 호출자(import 문)도 함께 고친다.
  - 공개 모듈의 이름은 별칭으로 남긴다.
  - 고친 뒤 옛 이름의 callers를 다시 조회한다.
  - 테스트는 `affected`로 고른 목록에서 돌린다.
- (선택) Claude Code가 `codegraph callers` 같은 CLI 명령을 실행할 때마다 허용 여부를 묻는 게 번거롭다면, 처음 물을 때 "항상 허용"을 선택한다.
- 색인 상태 확인:
  ```bash
  codegraph status          # Files, Nodes, Edges, Journal: wal 등이 보이면 정상
  ```

## 산출물

- `.codegraph/` 색인(로컬 전용).
- 저장소 루트의 `CLAUDE.md`(리팩터링 규칙).

## 체크리스트
- [ ] `codegraph init --yes`로 색인하고 nodes/edges 수를 확인한다.
- [ ] `.codegraph/`를 `.git/info/exclude`에 추가해 `git status`에서 사라지게 한다.
- [ ] 모듈의 `CLAUDE.md` 조각을 저장소 루트에 복사하고 내용을 읽어 본다.

---

# 5 단계: 고치기 전에 할 일 목록 만들기

## 규칙

과제는 `should_bypass_proxies`를 `is_proxy_bypassed`로 바꾸는 것이다. **아무것도 고치기 전에** 세 가지를 조회한다.

**① 대상 확인 — `node`**
```bash
codegraph node should_bypass_proxies
```
정의 위치(`src/requests/utils.py:765`), 시그니처 `(url, no_proxy)`, 줄 번호가 붙은 소스 코드가 나온다.

**② 누가 쓰는가 — `callers`** (가장 중요)
```bash
codegraph callers should_bypass_proxies
```
예상 결과:
```
Callers of "should_bypass_proxies" (10):

function    get_environ_proxies
  src/requests/utils.py:826
function    resolve_proxies
  src/requests/utils.py:864
function    test_should_bypass_proxies
  tests/test_utils.py:727
  ... (테스트 함수 5개 더)
file        sessions.py
  src/requests/sessions.py:1
```
읽는 법:
- **`function`** 항목은 이 함수를 **호출하는** 곳이다. `utils.py` 안의 2곳과 테스트 6개가 있다.
- **`file sessions.py`** 항목은 `sessions.py`가 이 함수를 **import만 하고 호출은 하지 않는다**는 뜻이다. 호출이 없다고 빠뜨리면, 원본 이름이 사라지는 순간 `import requests` 자체가 실패한다. 앞 모듈에서 GitNexus의 자동 `rename`이 놓쳤던 바로 그 줄이다. CodeGraph는 이 줄을 호출자 목록에 보여 준다.

**③ 어디까지 영향이 가는가 — `impact`**
```bash
codegraph impact should_bypass_proxies
```
예상 결과(요약):
```
Impact of changing "should_bypass_proxies" — 16 affected symbols:

src/requests/utils.py
  function    should_bypass_proxies:765
  function    get_environ_proxies:826
  function    resolve_proxies:864
src/requests/sessions.py
  method      merge_environment_settings:750
  file        sessions.py:1
tests/test_utils.py
  ... (테스트 11개)
```
`callers`는 직접 사용하는 곳만 보여 준다. `impact`는 그 사용처를 다시 쓰는 곳까지 따라간다. 예를 들어 `Session.merge_environment_settings`는 `get_environ_proxies`를 거쳐 영향을 받는다. 이런 곳은 고칠 필요는 없지만 **테스트로 확인해야 할 범위**다.

**④ 할 일 목록으로 정리**

| 파일 | 할 일 |
|---|---|
| `src/requests/utils.py` | 정의 1곳, 호출 2곳(`get_environ_proxies`, `resolve_proxies`) 변경 + 하위 호환 별칭 추가 |
| `src/requests/sessions.py` | import 1줄 변경 |
| `tests/test_utils.py` | import와 호출을 새 이름으로 변경 + 별칭 테스트 추가 |

> Claude Code 안에서라면 "should_bypass_proxies의 이름을 바꾸려고 해. 고치지 말고 callers와 impact로 할 일 목록부터 표로 만들어줘"라고 요청하면 된다. `CLAUDE.md` 규칙 때문에 수정 전에 조회하고 보고한다.

## 산출물

- 파일별 **할 일 목록**(수정 위치)과 **확인 범위**(테스트할 곳).

## 체크리스트
- [ ] `codegraph node`로 정의 위치를 확인한다.
- [ ] `codegraph callers`에서 `function` 항목과 `file` 항목(import)을 구분해 읽는다.
- [ ] `codegraph impact`로 간접 영향 범위를 확인한다.
- [ ] 파일별 할 일 목록을 표로 정리한다.

---

# 6 단계: 고치고, 남은 일을 다시 조회하기

## 규칙

수정은 Claude Code에게 맡긴다. 저장소 루트에서 `claude`를 실행하고 요청한다.

**① 소스 코드 먼저 고치기**
```
5단계 할 일 목록 중 src 쪽만 먼저 고쳐줘.
- utils.py: should_bypass_proxies를 is_proxy_bypassed로 이름을 바꾸고 호출 2곳도 바꿔.
  함수 정의 바로 아래에 "should_bypass_proxies = is_proxy_bypassed" 별칭을 주석과 함께 남겨.
- sessions.py: import 줄을 is_proxy_bypassed로 바꿔.
테스트 파일은 아직 건드리지 마.
```

**② 남은 일을 다시 조회 — CodeGraph 리팩터링의 핵심**

Claude Code 세션이 열려 있는 동안 CodeGraph가 파일 변경을 감지해 2초쯤 뒤에 그래프를 갱신한다. 확실히 하고 싶으면 `codegraph sync`를 한 번 실행한다. 그다음 **옛 이름**과 **새 이름**의 호출자를 각각 조회한다.
```bash
codegraph sync
codegraph callers should_bypass_proxies     # 옛 이름: 아직 옛 이름을 쓰는 곳 = 남은 일
codegraph callers is_proxy_bypassed         # 새 이름: 제대로 옮겨졌는지 확인
```
예상 결과:
```
Callers of "should_bypass_proxies" (7):
  test_should_bypass_proxies ... tests/test_utils.py   (테스트 6개)
  file test_utils.py                                    ← 남은 일은 테스트뿐

Callers of "is_proxy_bypassed" (4):
  get_environ_proxies   src/requests/utils.py
  resolve_proxies       src/requests/utils.py
  file sessions.py      src/requests/sessions.py        ← import가 새 이름으로 옮겨감
  file utils.py         src/requests/utils.py           ← 별칭 줄
```
이 시점에 `python -m pytest tests/test_utils.py -q`를 돌리면 **이미 통과한다.** 테스트가 옛 이름을 쓰더라도 별칭이 받아 주기 때문이다. 이것이 별칭을 남기는 이유다. 외부 사용자의 코드도 똑같이 계속 동작한다.

**③ 테스트를 새 이름으로 옮기기**
```
tests/test_utils.py에서 should_bypass_proxies를 호출하는 곳을 is_proxy_bypassed로 바꿔줘.
import 목록에 is_proxy_bypassed를 추가하고, should_bypass_proxies import는 남겨서
"별칭이 같은 함수를 가리키는지" 확인하는 test_should_bypass_proxies_alias 테스트를 파일 끝에 추가해줘.
```

**④ 다시 조회해서 끝났는지 확인**
```bash
codegraph sync
codegraph callers should_bypass_proxies
```
예상 결과:
```
Callers of "should_bypass_proxies" (1):
file        test_utils.py      ← 별칭 테스트의 import. 의도적으로 남긴 것뿐
```
마지막으로 문자열까지 확인한다. 테스트 함수 이름이나 설명 문구에 옛 이름이 남는 것은 괜찮다.
```bash
git grep -n "should_bypass_proxies" -- src
# src/requests/utils.py: 별칭 줄 하나만 나오면 된다
```

## 산출물

- `utils.py`(이름 변경 + 별칭), `sessions.py`(import), `tests/test_utils.py`(새 이름 + 별칭 테스트).
- 옛 이름의 callers가 "의도적으로 남긴 것"만 남은 상태.

## 체크리스트
- [ ] 소스 코드를 먼저 고치고, 옛 이름·새 이름의 `callers`를 각각 조회한다.
- [ ] 별칭 덕분에 테스트를 고치기 전에도 테스트가 통과하는지 확인한다.
- [ ] 테스트를 새 이름으로 옮긴 뒤 옛 이름의 callers가 `file test_utils.py` 하나만 남는지 확인한다.

---

# 7 단계: 영향받는 테스트 돌리고 커밋하기

## 규칙

**① 무엇을 테스트해야 하나 — `affected`**
```bash
git diff --name-only | codegraph affected --stdin --filter "tests/test_*.py" -q
```
예상 결과:
```
tests/test_adapters.py
tests/test_help.py
tests/test_lowlevel.py
tests/test_packages.py
tests/test_requests.py
tests/test_structures.py
tests/test_testserver.py
tests/test_utils.py
```
- **`--filter "tests/test_*.py"`를 꼭 붙인다.** 이 버전에서는 필터 없이 실행하면 requests의 테스트 파일을 알아보지 못하고 `No test files affected`가 나온다(실습 환경에서 확인). "영향 없음"으로 착각하기 쉬우니 주의한다.
- `utils.py`는 거의 모든 모듈이 import하는 핵심 파일이라 테스트 파일 대부분이 목록에 나온다. 이 목록은 CI에서 돌릴 전체 범위다.
- 이 중 `test_requests.py` 등 일부는 네트워크와 추가 패키지(`requirements-dev.txt`)가 필요하다. 실습에서는 오프라인으로 도는 **`tests/test_utils.py`**를 확인한다.

**② 테스트 실행**

테스트 파일을 고쳤으므로 3단계의 임시 파일부터 지운다.
```bash
python -c "import os,tempfile; p=os.path.join(tempfile.gettempdir(),'test_utils.py'); os.path.exists(p) and os.remove(p)"
python -m pytest tests/test_utils.py -q
python -c "import requests; print('import ok')"
```
예상 결과:
```
204 passed, 13 skipped      ← 별칭 테스트 1개가 늘었고 failed는 0
import ok
```

**③ 커밋**
```bash
git status --short          # src/requests/utils.py, src/requests/sessions.py, tests/test_utils.py
git add src tests
git commit -m "refactor: rename should_bypass_proxies to is_proxy_bypassed (keep alias)"
```

**④ 색인 상태 확인**

CodeGraph는 파일이 바뀔 때마다 자동으로 동기화되므로 커밋 후 따로 할 일이 없다. 확인만 해 둔다.
```bash
codegraph status            # "Pending sync" 항목이 없으면 최신 상태
```
Claude Code가 꺼진 동안 터미널에서 `git pull` 등으로 파일이 바뀌었다면, 다음 세션의 첫 질의 때 자동으로 따라잡는다. 급하면 `codegraph sync`를 실행한다.

## 산출물

- `affected`로 확인한 테스트 범위와 failed 0개인 테스트 결과.
- 리팩터링 커밋 1개.

## 체크리스트
- [ ] `codegraph affected`를 **`--filter "tests/test_*.py"`와 함께** 실행해 테스트 목록을 확인한다.
- [ ] 임시 파일을 지우고 `tests/test_utils.py`를 실행해 failed 0개를 확인한다.
- [ ] `import requests`가 성공하는지 확인한다.
- [ ] `src`, `tests` 변경만 커밋한다.
