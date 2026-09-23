# 예제 실행 및 프롬프트

> 전제: GUIDE.md 1~7단계를 마쳤다. 즉 다음 상태를 가정한다.
> - `~/work/gitnexus/requests`(requests `v2.32.3`)의 `refactor-practice` 브랜치에 첫 번째 리팩터링(`extract_auth_from_url`)이 커밋되어 있다.
> - `gitnexus setup -c claude`로 Claude Code에 MCP·스킬·훅이 연결되어 있고, `gitnexus analyze`로 색인이 최신이다.
> - 가상 환경(`.venv`)이 활성화되어 있고, `python -m pytest tests/test_utils.py -q`의 failed가 0개다.
>
> 이번에는 **대부분의 작업을 Claude Code에게 자연어로 맡긴다.** 과제는 `should_bypass_proxies` 함수를 `is_proxy_bypassed`로 바꾸는 것이다.
>
> 이 과제에는 **함정이 하나 숨어 있다.** `rename` 미리보기가 한 파일의 import 한 줄을 놓치고, 그대로 적용하면 `import requests` 자체가 실패한다(실습 환경에서 직접 확인했다). 사람이 어떤 순서로 검증해야 이런 실수를 커밋 전에 잡을 수 있는지 익히는 것이 이 샘플의 목표다.

## 1단계: 커밋할 변경 만들기

이번 커밋에 들어갈 변경, 즉 리팩터링 목표를 정하고 작업 준비를 한다. 실제 코드 수정은 3단계에서 Claude Code가 한다.

**① 작업 브랜치 만들기**

리팩터링이 잘못되면 브랜치째 버릴 수 있도록 별도 브랜치에서 한다.
```bash
cd ~/work/gitnexus/requests
source .venv/bin/activate
git status --short                  # 코드 변경이 없어야 한다 (.claude/, CLAUDE.md 등 미추적 파일은 괜찮다)
git switch -c refactor/is-proxy-bypassed
```

**② 기준선 확인**
```bash
python -m pytest tests/test_utils.py -q      # failed 0
gitnexus status 2>/dev/null | grep -E "Indexed commit|Current commit|Status"
```
Indexed commit과 Current commit이 다르거나 `stale`이 보이면 `gitnexus analyze`를 먼저 실행한다. 오래된 색인으로 영향 분석을 하면 결과를 믿을 수 없다.

**③ 목표를 한 문장으로 적어 두기**

> `src/requests/utils.py`의 `should_bypass_proxies`를 `is_proxy_bypassed`로 이름을 바꾼다. 외부 사용자를 위해 옛 이름은 별칭으로 남기고, 테스트는 모두 통과해야 한다.

이 문장이 3단계 프롬프트의 기준이 된다.

## 2단계: Claude Code CLI를 실행

저장소 루트에서 Claude Code를 연다.
```bash
claude
```

프롬프트가 뜨면 GitNexus가 제대로 연결됐는지 먼저 확인한다.

**① MCP 서버 확인**
```
/mcp
```
목록에 `gitnexus`가 `connected`로 보여야 한다. 보이지 않으면 Claude Code를 종료하고 터미널에서 `gitnexus setup -c claude`를 다시 실행한다.

**② 규칙과 스킬 확인**

Claude Code는 시작할 때 저장소의 `CLAUDE.md`를 자동으로 읽는다. 그 안의 GitNexus 규칙(수정 전 `impact` 필수, 커밋 전 `detect_changes` 필수, 이름 변경은 `rename` 사용)이 이 세션에 적용된다. 리팩터링 요청을 받으면 `gitnexus-refactoring` 스킬의 "Rename Symbol" 체크리스트를 따르게 된다.

## 3단계: 프롬프트가 뜨면 자연어로 지시

아래 프롬프트를 **한 번에 하나씩** 입력한다. 각 프롬프트 뒤의 "확인할 것"을 직접 점검한 다음에 다음 프롬프트로 넘어간다. AI에게 전부 맡기지 않고, **사람이 단계마다 문을 여닫는 것**이 핵심이다.

### 3-1. 영향 분석부터 시킨다
```
src/requests/utils.py의 should_bypass_proxies를 is_proxy_bypassed로 이름을 바꾸려고 해.
아직 아무것도 고치지 말고, 먼저 GitNexus로 영향 분석만 해줘.
호출자, 영향받는 실행 흐름, 위험도를 정리하고, 테스트 파일까지 포함해서 봐줘.
```
Claude Code는 내부적으로 `impact`(upstream, 테스트 포함)와 `context`를 호출한다.

**확인할 것:**
- 직접 호출자로 같은 파일의 `get_environ_proxies`, `resolve_proxies`가 나오는가?
- 위험도(risk)를 보고하는가? HIGH/CRITICAL이면 경고하라는 것이 `CLAUDE.md` 규칙이다.
- 도구 호출 내역에 `impact`가 **파일 수정보다 먼저** 있는가?

### 3-2. 미리보기를 받고, 텍스트 검색과 대조시킨다
```
rename 도구를 dry_run: true로 실행해서 미리보기를 보여줘.
그리고 git grep으로 src와 tests에서 should_bypass_proxies가 나오는 모든 줄을 찾아서,
미리보기에 빠진 줄이 있는지 표로 비교해줘.
```
예상 미리보기(실습 환경에서 확인한 결과):
```
files_affected: 1
total_edits: 3
changes:
  src/requests/utils.py  L765 (정의), L832, L881
```
`git grep` 결과에는 미리보기에 없는 줄이 있다.
```
src/requests/sessions.py:50:    should_bypass_proxies,     ← import만 하고 호출은 하지 않는 줄
tests/test_utils.py:38:     should_bypass_proxies,     ← 테스트 import
tests/test_utils.py:744, 765, 817 ...                  ← 테스트 호출
```

**확인할 것:**
- Claude Code가 `sessions.py:50`을 **누락 항목으로 짚어 내는가?**
- 왜 빠졌는지 이해했는가? `sessions.py`는 이 함수를 import만 하고 호출하지 않는다. 그래서 호출 그래프에 연결이 없다. 하지만 import 줄이 옛 이름을 가리키므로, 원본 함수 이름이 바뀌면 **패키지를 불러오는 순간 실패한다.**

### 3-3. 누락까지 고려한 계획으로 적용시킨다
```
미리보기대로 rename을 적용해줘. 그다음 누락된 곳은 이렇게 처리해줘.
1. utils.py에서 is_proxy_bypassed 함수 정의 바로 아래에
   should_bypass_proxies = is_proxy_bypassed 별칭을 주석과 함께 추가해서 하위 호환을 유지해.
2. sessions.py의 import는 별칭 덕분에 그대로 둬도 되니 건드리지 마.
3. 아직 테스트 파일은 고치지 마.
적용이 끝나면 python -c "import requests"와 tests/test_utils.py 테스트를 실행해서 결과를 보여줘.
```
참고로, 별칭 없이 rename만 적용하면 다음 오류가 난다. 실습 환경에서 실제로 확인한 결과다.
```
ImportError: cannot import name 'should_bypass_proxies' from 'requests.utils'
```
별칭을 추가한 뒤의 예상 결과:
```
import ok
204 passed, 13 skipped
```

**확인할 것:**
- `git diff`에 `utils.py`만 바뀌었는가? 정의·호출 3곳이 바뀌고 별칭 2줄이 추가됐는가?
- `import requests`가 성공하고 테스트가 failed 0개인가?

> 궁금하면 직접 확인해 보자: 별칭 줄을 잠시 지우고 `python -c "import requests"`를 실행하면 위의 ImportError를 볼 수 있다. 확인한 뒤에는 별칭을 되돌려 놓는다.

### 3-4. 커밋 전에 변경 범위를 검증시킨다
```
커밋하기 전에 detect_changes를 scope "all"로 실행해서,
바뀐 심볼과 영향받는 실행 흐름이 3-1의 영향 분석 결과와 일치하는지 확인해줘.
예상 밖의 파일이나 심볼이 있으면 커밋하지 말고 알려줘.
```
예상 결과(요약):
```
Changes: 1 files, 3 symbols
Risk level: medium
Changed symbols:
  Function should_bypass_proxies → src/requests/utils.py
  Function get_environ_proxies → src/requests/utils.py
  Function resolve_proxies → src/requests/utils.py
```

**확인할 것:**
- 바뀐 심볼 3개가 3-1에서 본 대상과 호출자뿐인가?
- `scope: all`로 실행했는가? 기본값(unstaged)은 `git add`한 변경을 보지 못한다.

### 3-5. 커밋하고 색인을 갱신시킨다
```
검증이 끝났으니 "refactor: rename should_bypass_proxies to is_proxy_bypassed (keep alias)"
메시지로 src 변경만 커밋해줘. 커밋 후 색인이 stale이면 gitnexus analyze로 갱신하고,
is_proxy_bypassed가 새 이름으로 조회되는지 context로 확인해줘.
```

**확인할 것:**
- `git log --oneline -1`에 커밋이 보이는가?
- `gitnexus context is_proxy_bypassed 2>/dev/null`에서 새 이름과 호출자(`get_environ_proxies`, `resolve_proxies`)가 보이는가?

### 3-6. (도전) 테스트까지 새 이름으로 옮기기
```
tests/test_utils.py에서 should_bypass_proxies를 쓰는 테스트들을 is_proxy_bypassed로 바꾸고,
별칭이 같은 함수를 가리키는지 확인하는 테스트를 하나 추가해줘.
테스트 파일을 고쳤으니 임시 폴더의 test_utils.py를 지운 뒤 테스트를 돌려서 failed가 0인지 보여주고,
detect_changes로 테스트 파일만 바뀌었는지 확인한 다음 커밋해줘.
```

## 체크리스트
- [ ] 별도 브랜치(`refactor/is-proxy-bypassed`)에서 작업하고, 시작 전에 테스트 기준선과 색인 상태를 확인한다.
- [ ] Claude Code에서 `/mcp`로 `gitnexus` 연결을 확인한다.
- [ ] 코드를 고치기 **전에** `impact`가 실행되고 위험도가 보고되는지 확인한다.
- [ ] `rename` 미리보기와 `git grep` 결과를 대조해 `sessions.py:50` 누락을 찾는다.
- [ ] 별칭을 추가해 `import requests`가 성공하고 테스트가 failed 0개인지 확인한다.
- [ ] `detect_changes`를 `scope: all`로 실행해 예상한 심볼만 바뀌었는지 확인한 뒤 커밋한다.
- [ ] 커밋 후 `gitnexus analyze`로 재색인하고 새 이름이 조회되는지 확인한다.
