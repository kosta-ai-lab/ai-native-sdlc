# 모듈 — Graphify — 하니스 엔지니어링

> 상태: 초안 · 담당: 이선아 교수

## 목적

.claude 폴더에 에이전트와 스킬을 만들어 Claude Code용 하네스 엔지니어링을 구성하는 방법을, **graphify**라는 실제 도구를 예시로 배운다. [graphify](https://github.com/Graphify-Labs/graphify)는 코드·문서·PDF·SQL 스키마를 로컬 AST 파싱 기반의 질의 가능한 지식 그래프로 바꿔 주는 `/graphify` 스킬이다.

이 모듈에서는 초보자가 다음 전체 흐름을 GUIDE.md → SAMPLE.md 순서로 실습한다.
1. graphify를 설치하고 스킬로 등록한다.
2. 그래프를 생성하고 질의한다.
3. 커밋 훅으로 그래프가 자동 갱신되게 만든다.

## 실습 저장소

모든 실습은 **[psf/requests](https://github.com/psf/requests) 태그 `v2.32.3`** 을 클론해 `graphify-practice` 브랜치에서 진행한다.

```bash
git clone --depth 1 --branch v2.32.3 https://github.com/psf/requests.git
cd requests && git switch -c graphify-practice
```

## 산출물 4종 (체크리스트)

- [x] 가이드 — GUIDE.md: 10단계로 구성하고, 단계마다 규칙·산출물·체크리스트를 넣었다.
  - 사전 준비 → CLI 설치 → **실습 저장소 클론** → 스킬 등록 → **색인 제외 규칙** → 그래프 생성 → 리포트 해석 → 질의 → 커밋·훅 설치 → 팀 동기화
- [ ] 규칙 — CLAUDE.md 조각: 어시스턴트가 코드를 읽기 전에 graphify를 실제로 쓰도록 유도·강제하는 always-on 규칙.
  - `graphify install --project`(또는 `graphify claude install`)가 CLAUDE.md에 자동으로 추가하는 섹션과 PreToolUse 훅을 그대로 채택하거나 문서화하면 된다.
  - 아직 별도 조각으로 정리하지 않았다.
- [x] 자동화 — graphify CLI가 두 가지를 제공한다.
  - 스킬 등록: `graphify install`
  - 커밋·브랜치 전환 시 자동 재빌드 훅: `graphify hook install`
- [x] 샘플 — SAMPLE.md: requests에 `ratelimit.py`를 추가하고 커밋·질의·팀원 변경 동기화(로컬 클론 시뮬레이션)까지 실행하는 동작 스텝과 프롬프트.

## 품질 기준

- 동작하는 샘플이나 재현 가능한 프롬프트를 반드시 첨부한다.
- 문서는 따라 하기만 하면 되는 수준이어야 한다.
- graphify 명령은 실습용 저장소에 최소 한 번 실행해 실제 출력(그래프 파일, 질의 결과)으로 확인한 것이어야 한다.

**검증 기록:** graphify 0.9.66 / requests v2.32.3 / Python 3.12 환경에서 GUIDE.md와 SAMPLE.md의 CLI 단계를 처음부터 끝까지 실행했다(2026-09-23). 문서의 예상 출력은 이 실행 결과에서 옮겼다. Claude Code 안에서의 자연어 질의(SAMPLE.md 6단계)는 직접 확인해야 한다.
