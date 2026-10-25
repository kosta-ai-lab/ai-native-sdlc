# 모듈 M04 — GSD로 하는 컨텍스트 엔지니어링 스펙 주도 개발

> 상태: 초안 · 담당: 이선아 교수
> 검증 기준: `@opengsd/gsd-core` **v1.16.0** (2026-10-05) · Claude Code (`--claude --local`) · macOS/Linux
> 참고 소개 글: [GeekNews — GSD](https://news.hada.io/topic?id=27622)

## 목적

**GSD**(Get Shit Done, 현재 이름 **GSD Core**)는 Claude Code 같은 AI 코딩 에이전트를 **"논의 → 기획 → 실행 → 검증 → 출시"** 의 단계 루프로 운영하는 스펙 주도 개발(SDD) 시스템이다. 핵심 아이디어는 **컨텍스트 rot**(대화가 길어질수록 AI 품질이 떨어지는 현상)을 막는 것이다. 무거운 리서치·기획·구현은 **매번 새 컨텍스트의 서브에이전트**가 맡고, 메인 대화는 가볍게 유지한다. 결정 사항과 진행 상황은 `.planning/` 폴더의 문서(`PROJECT.md`, `ROADMAP.md`, `STATE.md` …)에 남아 세션이 바뀌어도 이어진다.

이 모듈을 마치면 초보자도 다음을 할 수 있다.

- GSD Core를 설치하고 Claude Code에서 `/gsd-*` 명령을 쓴다.
- `/gsd-new-project` 로 대화를 통해 요구사항(`REQUIREMENTS.md`)과 로드맵(`ROADMAP.md`)을 만든다.
- 단계(phase)마다 `/gsd-discuss-phase` → `/gsd-plan-phase` → `/gsd-execute-phase` → `/gsd-verify-work` 루프를 돌린다.
- 실행 결과가 **작업마다 하나씩 git 커밋**으로 남는 것을 확인한다.
- 할 일 관리 앱을 완성하고, `/gsd-quick` 으로 두 번째 기능(마감일)을 추가한다.

## 한눈에 보는 GSD 흐름

```
 터미널        npx @opengsd/gsd-core@latest --claude --local   →   claude
                                                                       │
 Claude Code   /gsd-new-project ─► 단계(phase)마다 반복 ─────────────────────────────► (선택) /gsd-ship
               질문·요구사항·로드맵   /clear → /gsd-discuss-phase N   구현 방식 결정 (CONTEXT)
                                    /clear → /gsd-plan-phase N      리서치 + 작업 계획 (PLAN)
                                    /clear → /gsd-execute-phase N   서브에이전트 병렬 구현 + 작업별 커밋
                                    /clear → /gsd-verify-work N     사람이 직접 확인 (UAT)
                     │
                     └─ 결과는 모두 .planning/ 에 Markdown 으로 남는다 (세션 간 기억)
```

## M01~M03과 무엇이 다른가?

| 비교 | M01 Kiro | M02 OpenSpec | M03 Spec Kit | M04 GSD |
| --- | --- | --- | --- | --- |
| 형태 | IDE | CLI + Claude Code | CLI + Claude Code | **Claude Code 명령 + 서브에이전트 묶음** |
| 설치 | 앱 다운로드 | `npm i -g @fission-ai/openspec` | `uv tool install specify-cli` | `npx @opengsd/gsd-core@latest` |
| 원칙·맥락 | Steering | `config.yaml` | `constitution.md` | `PROJECT.md` + `STATE.md`(세션 간 기억) |
| 작업 단위 | 기능(Spec) | 변경(change) | 기능(feature) | **마일스톤 → 단계(phase) → 계획(plan)** |
| 계획 문서 | requirements · design · tasks | proposal · specs · design · tasks | spec · plan · tasks 외 | REQUIREMENTS · ROADMAP · CONTEXT · RESEARCH · PLAN(XML 작업) |
| 누가 일하나 | Kiro 에이전트 하나 | Claude Code 하나 | Claude Code 하나 | **역할별 서브에이전트 35종**(리서처·플래너·실행기·검증기…) |
| 구현 방식 | 작업 클릭 / Run all Tasks | `/opsx:apply` | `/speckit-implement` | 웨이브 병렬 실행, **작업마다 git 커밋** |
| 확인 | 작업 상태 | `validate` | `/speckit-converge` | 자동 검증(VERIFICATION) + **사람 인수 테스트(UAT)** |
| 강점 | IDE에서 쉽게 | 가벼운 변경 관리 | 꼼꼼한 설계 | **긴 작업에서도 품질 유지**, 깔끔한 git 이력 |

> 정리: 앞의 세 도구가 "명세 문서를 잘 쓰는 것" 에 집중했다면, GSD는 **"AI가 일하는 방식(컨텍스트·역할 분담·검증·커밋)까지 시스템으로 관리"** 하는 데 초점이 있다.

## 모듈 구성

| 파일 | 역할 | 언제 읽나 |
| --- | --- | --- |
| [README.md](README.md) | 모듈 소개, 목표, 준비물, 품질 기준 (지금 이 문서) | 가장 먼저 |
| [GUIDE.md](GUIDE.md) | GSD 개념 + 단계별 **목적·입력·규칙·산출물·체크리스트** 상세 가이드 | 단계별로 앱 만들기 |
| [SAMPLE.md](SAMPLE.md) | 완성한 "할 일 관리 앱"을 **실행·사용하고 요구사항대로 동작하는지 확인**하는 가이드 | GUIDE 6단계(실행) 이후 |

> 💡 추천 학습 순서: README → GUIDE 개념·1~6단계로 앱 만들기 → SAMPLE로 앱 확인 → GUIDE 7~8단계(검증·마무리) → (도전) GUIDE 9단계 + SAMPLE 8단계

## 사전 준비물

| 항목 | 버전/조건 | 확인 명령 |
| --- | --- | --- |
| Node.js | 20 이상 (GSD 설치 + 예제 테스트) | `node --version` |
| Git | 필수 (GSD가 작업마다 커밋한다) | `git --version` |
| Claude Code CLI | 로그인 완료 상태 | `claude --version` |
| Python 3 | 예제 앱 로컬 실행용 (`python3 -m http.server`) | `python3 --version` |
| (선택) GitHub CLI `gh` | `/gsd-ship` 으로 PR을 만들 때만 | `gh --version` |

> ⚠️ GSD는 서브에이전트를 여러 개 띄우므로 **Claude 사용량(토큰)을 다른 모듈보다 많이** 쓴다. 할 일 앱 정도는 문제없지만, 요금제 한도가 작으면 리서치 단계를 건너뛰는 설정(GUIDE 3단계)을 고른다.

## 산출물 4종 (체크리스트)

- [x] 가이드 — [GUIDE.md](GUIDE.md) 단계 목적·입력·산출물·체크리스트
- [x] 규칙 — `.planning/PROJECT.md`·`config.json` 설정 예시 + [부록 A. CLAUDE.md 규칙 조각](GUIDE.md#부록-a-claudemd-규칙-조각)
- [x] 자동화 — GSD가 설치하는 Claude Code **명령 72종**(`.claude/commands/gsd-*.md`) + **서브에이전트 35종**(`.claude/agents/gsd-*.md`) + 훅
- [x] 샘플 — [SAMPLE.md](SAMPLE.md) 완성 앱 실행·기능별 사용 시나리오·커밋 이력 확인·수정 요청 프롬프트

## 품질 기준

동작하는 샘플 또는 재현 가능한 프롬프트가 반드시 첨부되어야 하며, 문서는 따라 하면 되는 수준이어야 한다.

이 모듈의 완료 기준:

- [ ] `.planning/` 에 `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, `config.json` 이 있다.
- [ ] `.planning/phases/01-…/` 에 `01-CONTEXT.md`, `01-…-PLAN.md`, `01-…-SUMMARY.md`, `01-VERIFICATION.md`, `01-UAT.md` 가 있다.
- [ ] `git log --oneline` 에 작업 단위 커밋(`feat(01-01): …` 형태)이 여러 개 있다.
- [ ] `node --test` 가 통과하고, 브라우저에서 할 일 앱이 SAMPLE 시나리오대로 동작한다.
- [ ] (도전) `/gsd-quick` 으로 마감일 기능을 추가했다.

## 알아 둘 점 (이름과 버전 변화)

GSD는 이름과 저장소가 바뀌었다. 인터넷 글과 다음이 다를 수 있다.

| 예전 글에서 보이는 것 | 현재 |
| --- | --- |
| `npx get-shit-done-cc@latest` | **`npx @opengsd/gsd-core@latest`** — 예전 패키지는 npm에서 "더 이상 지원하지 않음(deprecated)" 표시가 붙었다 |
| 저장소 `gsd-build/get-shit-done` (glittercowboy) | **`open-gsd/gsd-core`** — 예전 저장소는 "GSD Has Moved" 안내만 남음 |
| `/gsd:new-project` (콜론 표기) | **`/gsd-new-project`** (하이픈 표기) |
| 버전 1.4x | 패키지 이름이 바뀌며 버전이 1.x 부터 다시 시작 (현재 1.16.0) |

예전 `get-shit-done-cc` 를 설치한 적이 있으면, 새 설치 프로그램이 남은 파일을 자동으로 정리한다([정리 안내](https://github.com/open-gsd/gsd-core/blob/main/docs/cleanup-get-shit-done-cc.md)).

## 참고 자료

- GSD Core 저장소: https://github.com/open-gsd/gsd-core
- 한국어 README: https://github.com/open-gsd/gsd-core/blob/main/README.ko-KR.md
- 첫 번째 프로젝트 튜토리얼(한국어): https://github.com/open-gsd/gsd-core/blob/main/docs/ko-KR/tutorials/your-first-project.md
- 명령어 참조(한국어): https://github.com/open-gsd/gsd-core/blob/main/docs/ko-KR/COMMANDS.md
- 설정 참조: https://github.com/open-gsd/gsd-core/blob/main/docs/CONFIGURATION.md
- GeekNews 소개 글: https://news.hada.io/topic?id=27622
