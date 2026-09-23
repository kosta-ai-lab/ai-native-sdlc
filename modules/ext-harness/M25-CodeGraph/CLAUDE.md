<!-- refactoring-rules:start (CodeGraph 리팩터링 규칙 — 실습 저장소 루트의 CLAUDE.md에 붙여 넣는다) -->
## 리팩터링 규칙 (CodeGraph)

이 저장소는 CodeGraph로 색인되어 있다(`.codegraph/`). 함수·클래스·메서드의 **이름, 시그니처, 위치**를 바꾸는 작업은 모두 리팩터링으로 보고 아래 순서를 지킨다.

### 고치기 전에
1. `codegraph callers <이름>`과 `codegraph impact <이름>`을 실행한다. 다음을 사용자에게 먼저 보고한다.
   - 호출자 목록(파일:줄)
   - 영향받는 심볼
   - 관련 테스트
2. 호출자 목록에 `file` 종류로 나오는 항목(예: `file sessions.py  src/requests/sessions.py:1`)은 **import 문**이다. 그 파일이 심볼을 호출하지 않더라도 import 줄은 반드시 함께 고친다.
3. 사용자가 계획을 승인하기 전에는 파일을 수정하지 않는다.

### 고치는 동안
4. 공개 모듈(예: `requests.utils`)에 있는 심볼의 이름을 바꾸거나 다른 모듈로 옮길 때는, 옛 이름을 **별칭 또는 재수출**로 남겨 외부 사용자의 코드가 깨지지 않게 한다.
5. 옮긴 뒤 원래 파일에서 쓰이지 않게 된 import(예: `import struct`)는 지운다.

### 고친 뒤에
6. `codegraph sync`를 실행한 뒤 `codegraph callers <옛 이름>`을 다시 확인한다. 남은 항목은 의도적으로 남긴 것(별칭, 별칭을 검증하는 테스트)뿐이어야 한다. 마지막으로 `git grep -n "<옛 이름>"`으로 문자열(주석, 문서, mock 경로)까지 확인한다.
7. `python -c "import requests"`로 패키지가 불러와지는지 확인한다.
8. 테스트를 다음 순서로 확인한다.
   - `git diff --name-only | codegraph affected --stdin --filter "tests/test_*.py" -q`로 영향받는 테스트 파일 목록을 보고한다.
   - 그중 네트워크 없이 도는 `tests/test_utils.py`를 먼저 실행한다.
   - failed가 있으면 커밋하지 않는다.
9. 커밋 메시지는 `refactor: ...` 형식으로 쓰고, 코드 변경(`src`, `tests`)만 커밋한다.

### 하지 말 것
- 코드 탐색을 파일 읽기 서브에이전트에게 맡기지 않는다. CodeGraph(`codegraph_explore`, `codegraph callers`/`impact`)로 직접 확인한다.
- 찾아 바꾸기(sed 등)로 여러 파일을 한꺼번에 고치지 않는다. 호출자 목록의 위치를 하나씩 수정한다.
<!-- refactoring-rules:end -->
