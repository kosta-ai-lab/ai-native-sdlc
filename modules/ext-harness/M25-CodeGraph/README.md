# 모듈 — CodeGraph로 안전하게 리팩터링하기 — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

.claude 폴더에 에이전트와 스킬을 만들어 Claude Code용 하네스 엔지니어링을 구성하는 방법을 배운다. 예시 도구는 **[CodeGraph](https://github.com/colbymchenry/codegraph)**다.

CodeGraph는 코드베이스를 미리 색인한 지식 그래프다. 파일이 바뀌면 자동으로 동기화되고, `callers`, `impact`, `affected`로 "누가 쓰는가", "어디까지 영향이 가는가", "무엇을 테스트해야 하는가"를 알려 준다.

자동 이름 바꾸기 도구는 없다. 대신 **"고치기 전 할 일 목록 → 고친 뒤 남은 일 목록"**을 정확하게 조회할 수 있다. 이 모듈에서는 이 조회를 중심으로 한 리팩터링 루프를 GUIDE.md → SAMPLE.md 순서로 실습한다.

> **조회(callers/impact) → 계획 승인 → 수정 → 다시 조회(옛 이름 callers) → 테스트(affected) → 커밋**

## 실습 저장소

**[psf/requests](https://github.com/psf/requests) 태그 `v2.32.3`**을 `~/work/codegraph/requests`에 클론해 `refactor-practice` 브랜치에서 진행한다.

```bash
mkdir -p ~/work/codegraph && cd ~/work/codegraph
git clone --depth 1 --branch v2.32.3 https://github.com/psf/requests.git
cd requests && git switch -c refactor-practice
```

| 문서 | 리팩터링 유형 | 과제 | 배우는 것 |
|---|---|---|---|
| GUIDE.md | 이름 바꾸기 (Rename) | `should_bypass_proxies` → `is_proxy_bypassed` | callers의 `file` 항목(import만 하는 파일) 읽기, 옛 이름 callers를 남은 일 목록으로 쓰기, 별칭 |
| SAMPLE.md | 모듈 추출 (Extract Module) | 네트워크 도우미 4개를 `utils.py` → `_netutils.py` | 재수출로 옛 경로 유지, 쓸모없어진 import 정리, 새 모듈의 의존 관계 확인 |

> GUIDE의 과제는 GitNexus 모듈 SAMPLE과 **같은 함수**를 일부러 골랐다. GitNexus의 자동 `rename`은 `sessions.py`의 import 한 줄을 놓쳤지만, CodeGraph의 `callers`는 같은 줄을 `file sessions.py` 항목으로 보여 준다. 두 도구의 성격 차이를 비교해 볼 수 있다.

## 산출물 4종 (체크리스트)

- [x] 가이드 — GUIDE.md: 7단계로 구성하고, 단계마다 규칙·산출물·체크리스트를 넣었다.
  - 사전 준비 → 설치·Claude Code 연결 → 실습 저장소 클론·기준선 테스트 → 색인·규칙 붙이기 → 할 일 목록 만들기 → 수정·남은 일 재조회 → affected 테스트·커밋
- [x] 규칙 — CLAUDE.md 조각: 이 모듈의 [`CLAUDE.md`](./CLAUDE.md)를 실습 저장소 루트에 복사해 쓴다.
  - `codegraph install`이 만드는 전역 안내문에는 "CodeGraph를 먼저 써라"만 있고 리팩터링 절차는 없어서 따로 작성했다.
  - 규칙 내용: 수정 전 `callers`/`impact` 보고와 승인, `file` 항목(import) 수정, 별칭·재수출, 수정 후 옛 이름 callers 재조회, `affected`로 테스트 선택
- [x] 자동화 — CodeGraph 설치 도구와 자동 동기화
  - `codegraph install`: MCP 서버, 도구 자동 허용, 프롬프트 훅, 전역 안내문을 설정한다.
  - 자동 동기화: 파일 변경을 감지해 색인을 스스로 갱신한다.
- [x] 샘플 — SAMPLE.md: Claude Code에게 자연어로 모듈 추출을 맡긴다. 단계별 프롬프트와 "확인할 것"을 함께 담았다.

## 품질 기준

- 동작하는 샘플이나 재현 가능한 프롬프트를 반드시 첨부한다.
- 문서는 따라 하기만 하면 되는 수준이어야 한다.

**검증 기록 (2026-09-23)**

- 환경: CodeGraph 1.6.0 / Python 3.12 / requests v2.32.3
- CLI 명령(`init`, `status`, `node`, `callers`, `impact`, `explore`, `sync`, `affected`, `install`)을 직접 실행했다.
- GUIDE와 SAMPLE의 수정 내용(이름 바꾸기 + 별칭, 모듈 추출 + 재수출)을 직접 적용했고, `import requests`, flake8, `tests/test_utils.py`(204 passed)를 통과했다. 문서의 예상 출력은 이 결과에서 옮겼다.
- 실습 중 발견한 함정 두 가지를 문서에 반영했다.
  - `affected`는 `--filter` 없이 실행하면 테스트를 찾지 못한다.
  - `test_zipped_paths_extracted`는 임시 폴더에 남은 파일 때문에 테스트 파일을 고친 뒤 혼자 실패한다.
- Claude Code가 자연어 프롬프트를 받아 도구를 어떤 순서로 쓰는지는 사용 환경에서 확인해야 한다. 그래서 SAMPLE.md에 단계별 "확인할 것"을 두었다.
