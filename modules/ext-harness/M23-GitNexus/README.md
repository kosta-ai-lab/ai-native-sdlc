# 모듈 — GitNexus로 안전하게 리팩터링하기 — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

.claude 폴더에 에이전트와 스킬을 만들어 Claude Code용 하네스 엔지니어링을 구성하는 방법을 배운다. 예시 도구는 **[GitNexus](https://github.com/abhigyanpatwari/GitNexus)**다.

GitNexus는 코드베이스를 지식 그래프로 색인한다. 그리고 `impact`(영향 분석), `rename`(그래프 기반 이름 변경), `detect_changes`(커밋 전 변경 범위 검증) 같은 MCP 도구로 AI 에이전트에게 제공한다.

이 모듈의 목표는 초보자가 **"영향 분석 → 미리보기 → 적용 → 누락 확인 → 검증 → 커밋"**이라는 안전한 리팩터링 루프를 몸에 익히는 것이다. 순서는 GUIDE.md → SAMPLE.md다.

## 실습 저장소

**[psf/requests](https://github.com/psf/requests) 태그 `v2.32.3`**을 `~/work/gitnexus/requests`에 클론해 `refactor-practice` 브랜치에서 진행한다.

```bash
mkdir -p ~/work/gitnexus && cd ~/work/gitnexus
git clone --depth 1 --branch v2.32.3 https://github.com/psf/requests.git
cd requests && git switch -c refactor-practice
```

| 문서 | 리팩터링 과제 | 숨은 함정 (실습에서 직접 확인) |
|---|---|---|
| GUIDE.md | `get_auth_from_url` → `extract_auth_from_url` | `rename`이 `tests/test_utils.py`를 놓쳐 테스트가 `ImportError`로 시작조차 안 됨 |
| SAMPLE.md | `should_bypass_proxies` → `is_proxy_bypassed` | `rename`이 `sessions.py`의 import 한 줄을 놓쳐 `import requests` 자체가 실패함 |

## 산출물 4종 (체크리스트)

- [x] 가이드 — GUIDE.md: 7단계로 구성하고, 단계마다 규칙·산출물·체크리스트를 넣었다.
  - 사전 준비 → 설치·Claude Code 연결 → 실습 저장소 클론·기준선 테스트 → 색인·규칙 파일 이해 → 영향 분석 → rename·누락 보완 → 검증·커밋·재색인
- [x] 규칙 — CLAUDE.md 조각: `gitnexus analyze`가 저장소에 자동으로 만든다.
  - 규칙 내용: 수정 전 `impact` 필수, 커밋 전 `detect_changes` 필수, HIGH/CRITICAL 경고, 찾아 바꾸기 대신 `rename`, 호출자 0개를 안전으로 간주하지 않기
  - 해설은 GUIDE.md 4단계에 있다. 팀과 공유하려면 `CLAUDE.md`, `AGENTS.md`를 커밋한다.
- [x] 자동화 — 스킬과 훅
  - `gitnexus setup -c claude`: MCP 서버, 전역 스킬 12종, PreToolUse/PostToolUse 훅을 설치한다.
  - `gitnexus analyze`: 저장소용 스킬 6종(`gitnexus-refactoring` 포함)을 설치한다.
- [x] 샘플 — SAMPLE.md: Claude Code에게 자연어로 리팩터링을 맡긴다. 단계별 프롬프트와 "확인할 것"을 함께 담았다.

## 품질 기준

- 동작하는 샘플이나 재현 가능한 프롬프트를 반드시 첨부한다.
- 문서는 따라 하기만 하면 되는 수준이어야 한다.

**검증 기록 (2026-09-23)**

- 환경: GitNexus 1.6.12 / Node.js 22 / Python 3.12 / requests v2.32.3
- CLI 명령(`analyze`, `status`, `context`, `impact`, `detect-changes`)과 MCP `rename` 도구(dry run 및 적용)를 직접 실행했다. 문서의 예상 출력과 두 가지 함정은 이 실행 결과에서 옮겼다.
- Claude Code가 자연어 프롬프트를 받아 도구를 어떤 순서로 호출하는지는 사용 환경에서 확인해야 한다. 그래서 SAMPLE.md에 단계별 "확인할 것"을 두었다.
