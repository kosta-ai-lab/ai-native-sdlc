# 예제 실행 및 프롬프트

> 전제: GUIDE.md 1~7단계를 마쳤다. 즉 다음 상태를 가정한다.
> - `~/work/codegraph/requests`(requests `v2.32.3`)의 `refactor-practice` 브랜치에 첫 번째 리팩터링(`is_proxy_bypassed`)이 커밋되어 있다.
> - `codegraph install`로 Claude Code가 연결되어 있고, `codegraph init`으로 색인이 만들어져 있다.
> - 저장소 루트에 모듈의 `CLAUDE.md`(리팩터링 규칙)가 복사되어 있다.
> - 가상 환경(`.venv`)이 활성화되어 있다.
>
> 이번 과제는 이름 바꾸기가 아니라 **모듈 추출(Extract Module)**이다. `src/requests/utils.py`는 1,000줄이 넘는 "잡동사니" 모듈이다. 그 안에서 IPv4/CIDR을 다루는 도우미 함수 4개를 새 파일 `src/requests/_netutils.py`로 옮긴다.
>
> | 옮길 함수 | 하는 일 |
> |---|---|
> | `address_in_network(ip, net)` | IP가 네트워크(CIDR) 안에 있는지 |
> | `dotted_netmask(mask)` | `24` → `255.255.255.0` 변환 |
> | `is_ipv4_address(string_ip)` | 올바른 IPv4 주소인지 |
> | `is_valid_cidr(string_network)` | 올바른 CIDR 표기인지 |
>
> 이름 바꾸기보다 까다로운 점이 두 가지 있다. 첫째, 함수를 옮기면 **원래 파일의 import가 쓸모없어지거나(`struct`), 새 파일에 import가 필요해진다(`socket`, `struct`).** 둘째, 외부 코드가 쓰던 **옛 경로(`requests.utils.is_valid_cidr`)를 살려 두어야 한다.** CodeGraph로 옮기기 전과 후의 의존 관계를 비교하며 이 두 가지를 확인한다.

## 1단계: 커밋할 변경 만들기

이번 커밋에 들어갈 변경, 즉 리팩터링 목표를 정하고 준비한다. 코드 수정은 3단계에서 Claude Code가 한다.

**① 작업 브랜치와 기준선**
```bash
cd ~/work/codegraph/requests
source .venv/bin/activate
git status --short                         # 비어 있어야 한다
git switch -c refactor/extract-netutils

python -c "import os,tempfile; p=os.path.join(tempfile.gettempdir(),'test_utils.py'); os.path.exists(p) and os.remove(p)"
python -m pytest tests/test_utils.py -q    # failed 0 (204 passed)
codegraph status | head -12                # 색인이 있고, Pending sync가 없는지
```

**② 목표를 한 문장으로 적어 두기**

> `utils.py`의 네트워크 도우미 4개를 `_netutils.py`로 옮긴다. `utils.py`는 이 4개를 다시 내보내(re-export) 옛 import 경로가 계속 동작하게 한다. 테스트 파일은 고치지 않고 그대로 통과해야 한다.

"테스트 파일을 고치지 않는다"를 목표에 넣은 이유가 있다. 테스트는 `from requests.utils import is_valid_cidr`처럼 **옛 경로**로 import한다. 테스트가 그대로 통과한다면, 옛 경로를 쓰는 외부 사용자의 코드도 깨지지 않는다는 증거가 된다.

## 2단계: Claude Code CLI를 실행

저장소 루트에서 Claude Code를 연다.
```bash
claude
```

**① MCP 연결 확인**
```
/mcp
```
목록에 `codegraph`가 connected로 보여야 한다. 보이지 않으면 Claude Code를 종료하고 터미널에서 `codegraph install --target=claude --location=global --yes`를 다시 실행한 뒤 재시작한다.

**② 규칙이 읽혔는지 확인**
```
이 저장소에서 리팩터링할 때 지켜야 할 규칙을 요약해줘.
```
`CLAUDE.md`의 규칙을 요약하면 정상이다. 예를 들면 "고치기 전에 callers/impact 보고", "file 항목(import)도 수정", "공개 모듈은 별칭/재수출", "고친 뒤 callers 재조회", "affected로 테스트 선택" 같은 내용이다.

## 3단계: 프롬프트가 뜨면 자연어로 지시

아래 프롬프트를 **한 번에 하나씩** 입력한다. 각 프롬프트 뒤의 "확인할 것"을 점검한 다음에 넘어간다.

### 3-1. 옮기기 전 의존 관계 조사
```
src/requests/utils.py의 address_in_network, dotted_netmask, is_ipv4_address, is_valid_cidr
네 함수를 새 파일 src/requests/_netutils.py로 옮기려고 해. 아직 고치지 말고 조사만 해줘.
1. 네 함수 각각의 callers를 조회해서 표로 정리해줘.
2. 네 함수가 쓰는 모듈(import)이 무엇인지, 그 모듈을 utils.py의 다른 코드도 쓰는지 알려줘.
```
실습 환경에서 확인한 callers는 다음과 같다.

| 함수 | 소스 쪽 호출자 | 테스트 쪽 |
|---|---|---|
| `address_in_network` | `is_proxy_bypassed` (utils.py) | `test_utils.py`의 `test_valid`, `test_invalid` |
| `dotted_netmask` | `address_in_network` (utils.py) | `test_dotted_netmask` |
| `is_ipv4_address` | `is_proxy_bypassed` (utils.py) | `test_valid`, `test_invalid` |
| `is_valid_cidr` | `is_proxy_bypassed` (utils.py) | `test_valid`, `test_invalid` |

**확인할 것:**
- 소스 쪽 호출자가 **모두 `utils.py` 안**에 있는가? 그렇다면 옮긴 뒤 `utils.py`가 새 모듈을 import하기만 하면 된다.
- 테스트는 네 함수를 `requests.utils`에서 **직접 import**한다(`file test_utils.py` 항목). 재수출이 없으면 테스트가 깨진다.
- 네 함수는 `socket`과 `struct`를 쓴다. `utils.py`의 다른 코드는 `socket`만 쓰고 `struct`는 쓰지 않는다. 따라서 옮긴 뒤에는 **`utils.py`의 `import struct`가 쓸모없어진다.** Claude가 이 점을 짚어 내는지 본다.

### 3-2. 계획 세우고 승인하기
```
조사 결과를 바탕으로 수정 계획을 단계별로 제안해줘. 다음을 포함해야 해.
- _netutils.py에 들어갈 import와 모듈 설명(docstring)
- utils.py에서 지울 것과 추가할 재수출 코드(기존 _internal_utils 재수출과 같은 스타일로)
- 쓸모없어지는 import 처리
계획만 보여주고, 내가 승인하면 적용해.
```

**확인할 것:**
- 재수출 코드가 `utils.py`의 기존 스타일(`from ._internal_utils import (  # noqa: F401`)을 따르는가? 예:
  ```python
  # 하위 호환: 네트워크 도우미는 _netutils로 옮겼지만, 예전 경로로도 import할 수 있게 다시 내보낸다.
  from ._netutils import (  # noqa: F401
      address_in_network,
      dotted_netmask,
      is_ipv4_address,
      is_valid_cidr,
  )
  ```
- `import struct`를 지우고 `import socket`은 남기는가?
- 테스트 파일을 고치는 계획이 **없는가?** 1단계에서 정한 목표다.

계획이 맞으면 "승인. 적용해줘"라고 입력한다.

### 3-3. 적용 후 검증
```
적용이 끝났으면 다음을 차례로 실행해서 결과를 보여줘.
1. python -c "import requests; from requests.utils import is_valid_cidr; from requests._netutils import dotted_netmask; print('import ok')"
2. codegraph sync 후 codegraph node src/requests/_netutils.py 첫 줄
3. codegraph callers is_valid_cidr
4. pip install flake8 후 python -m flake8 src/requests/utils.py src/requests/_netutils.py
```
실습 환경에서 확인한 결과:
```
import ok

**src/requests/_netutils.py** — 71 lines, 4 symbols · used by 2 files: src/requests/utils.py, tests/test_utils.py

Callers of "is_valid_cidr" (5):
  is_proxy_bypassed   src/requests/utils.py
  test_valid / test_invalid   tests/test_utils.py
  file utils.py       src/requests/utils.py     ← 재수출 import
  file test_utils.py  tests/test_utils.py

(flake8 출력 없음 = 통과)
```

**확인할 것:**
- `_netutils.py`가 **`utils.py`와 `tests/test_utils.py` 두 파일에서 쓰이는가?** 새 모듈이 기존 의존 관계에 제대로 연결됐다는 뜻이다.
- flake8이 조용한가? `utils.py`에 `import struct`가 남아 있으면 `F401 'struct' imported but unused`가 나온다. 그러면 지우라고 다시 요청한다.

### 3-4. 영향받는 테스트 확인하고 실행
```
git diff --name-only와 새로 만든 파일 목록을 codegraph affected --stdin --filter "tests/test_*.py" -q에 넘겨서
영향받는 테스트 파일 목록을 보여줘. 그중 tests/test_utils.py를 실행해서 결과를 보여줘.
```
새로 만든 파일은 아직 git이 추적하지 않아 `git diff`에 나오지 않는다. 그래서 새 파일 목록을 따로 넘겨야 한다. 직접 실행한다면 다음과 같다.
```bash
(git diff --name-only; git ls-files --others --exclude-standard src) \
  | codegraph affected --stdin --filter "tests/test_*.py" -q
python -m pytest tests/test_utils.py -q
```
예상 결과: 영향받는 테스트 파일 8개가 나오고, 테스트는 `204 passed, 13 skipped`다.

**확인할 것:**
- 테스트 파일을 **하나도 고치지 않았는데** failed가 0개인가? 옛 import 경로가 살아 있다는 증거다.
- `--filter`를 빼먹지 않았는가? 빼면 `No test files affected`가 나와 착각하기 쉽다.

### 3-5. 커밋
```
검증이 끝났으니 src/requests/utils.py와 새 파일 src/requests/_netutils.py만
"refactor: extract IPv4/CIDR helpers into requests._netutils (re-exported from utils)" 메시지로 커밋해줘.
```

**확인할 것:**
- `git show --stat HEAD`에 **두 파일만** 있는가? `_netutils.py`가 빠지면, 커밋을 받은 사람의 코드가 `ImportError`로 실패한다.
- `codegraph status`에 Pending sync가 없는가?

### 3-6. (도전) 새 경로로 테스트 옮기기
```
tests/test_utils.py에서 네 함수의 import를 requests._netutils에서 가져오도록 바꾸고,
requests.utils의 재수출이 같은 함수를 가리키는지 확인하는 테스트를 하나 추가해줘.
테스트 파일을 고쳤으니 임시 폴더의 test_utils.py를 지운 뒤 테스트를 돌리고,
codegraph node src/requests/_netutils.py로 의존 파일이 여전히 2개인지 확인한 다음 커밋해줘.
```

## 체크리스트
- [ ] 별도 브랜치(`refactor/extract-netutils`)에서 작업하고, 시작 전에 테스트 기준선과 색인 상태를 확인한다.
- [ ] Claude Code에서 `/mcp`로 `codegraph` 연결과 `CLAUDE.md` 규칙 적용을 확인한다.
- [ ] 옮기기 전에 네 함수의 callers와 사용 모듈(`socket`, `struct`)을 조사한다.
- [ ] 계획을 먼저 받아 재수출 코드와 `import struct` 처리를 확인한 뒤 승인한다.
- [ ] 적용 후 `import` 확인, `codegraph node`(의존 파일 2개), flake8을 통과하는지 확인한다.
- [ ] `affected`(`--filter` 포함)로 테스트 범위를 확인하고, 테스트 파일을 고치지 않은 채 failed 0개인지 확인한다.
- [ ] 새 파일(`_netutils.py`)까지 포함해 커밋한다.
