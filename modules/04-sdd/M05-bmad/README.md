# 모듈 M05 — BMAD Method로 하는 에이전트 협업형 스펙 주도 개발

> 상태: 초안 · 담당: 이선아 교수
> 검증 기준: `bmad-method` **v6.12.2** (npm `latest`, 2026-10) · Claude Code · macOS/Linux
> 공식 저장소: [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)

## 목적

**BMAD Method**(BMad, *Agile AI-Driven Development*)는 아이디어나 변경 요청을 **"명확히 하기 → 계획 → 만들고 검증 → 배우고 조정"** 의 애자일 루프로 다루는 스펙 주도 개발(SDD) 방법론이다. Claude Code 같은 AI 도구에 **스킬(skill)** 묶음을 설치하고, 분석가(Mary)·PM(John)·아키텍트(Winston)·개발자(Amelia)·UX 디자이너(Sally) 같은 **역할 에이전트**와 워크플로를 불러 쓴다.

BMAD의 핵심 생각은 **"일의 크기에 맞게 계획을 키운다(right-sized process)"** 이다. 작은 수정은 바로 `bmad-build` 로 가고, 큰 일은 스펙(`SPEC.md`) → 스토리(`stories.yaml`) → 스토리마다 `bmad-build` 로 나눈다. 어떤 경로든 구현 단위는 같다. **`bmad-build` 한 번 = 계획 승인 → 구현 → 독립 리뷰 → 수정 → 커밋**.

이 모듈을 마치면 초보자도 다음을 할 수 있다.

- BMAD를 프로젝트에 설치하고, 한국어로 대화하도록 설정한다.
- `bmad-help` 로 "지금 무엇을 해야 하는지" 묻는다.
- `bmad-spec` 으로 요구사항을 5개 항목(Why · Capabilities · Constraints · Non-goals · Success signal)의 **짧은 계약서 `SPEC.md`** 로 만든다.
- 스펙을 **스토리**로 나누고, 스토리마다 `bmad-build` 로 계획 승인 → 구현 → 리뷰 → 커밋을 돌린다.
- `bmad-walkthrough` · `bmad-retrospective` 로 결과를 사람이 확인하고 에픽을 마무리한다.
- 스펙을 갱신해 두 번째 기능(마감일)을 추가한다.

## 한눈에 보는 BMAD 흐름

```
 터미널        npx bmad-method install  →  git commit (깨끗한 시작점)  →  claude
                                                                         │
 Claude Code   /bmad-help ─► (선택) /bmad-agent-pm → PRD
                     │
                     ▼
               /bmad-spec  ── 할 일 앱 요구사항 ──► _bmad-output/specs/spec-todo-app/SPEC.md
                     │      "스토리로 나눠 줘"   ──► stories.yaml (스토리 1, 2, 3)
                     ▼
               스토리마다 새 대화에서 반복
               /bmad-build 스토리 N  ── 계획(스토리 문서) 승인 → 구현 → 독립 리뷰 → 수정 → 커밋
                     │
                     ▼
               /bmad-walkthrough (사람 확인)  →  /bmad-retrospective (에픽 승인)
                     │
                     └─ (도전) /bmad-spec 으로 마감일 추가 → /bmad-build
```

## M01~M04와 무엇이 다른가?

| 비교 | M01 Kiro | M02 OpenSpec | M03 Spec Kit | M04 GSD | M05 BMAD |
| --- | --- | --- | --- | --- | --- |
| 형태 | IDE | CLI + Claude Code | CLI + Claude Code | Claude Code 명령 + 서브에이전트 | **AI 도구용 스킬 + 역할 에이전트(페르소나)** |
| 설치 | 앱 다운로드 | `npm i -g @fission-ai/openspec` | `uv tool install specify-cli` | `npx @opengsd/gsd-core@latest` | `npx bmad-method install` |
| 원칙·맥락 | Steering | `config.yaml` | `constitution.md` | `PROJECT.md` + `STATE.md` | `_bmad/config.toml` + `SPEC.md` 의 Constraints (+ 선택: `AGENTS.md`) |
| 작업 단위 | 기능(Spec) | 변경(change) | 기능(feature) | 마일스톤 → 단계 → 계획 | **크기에 따라**: 변경 1개 / 에픽(스펙 + 스토리) / 프로젝트(PRD + 에픽 여러 개) |
| 계획 문서 | requirements · design · tasks | proposal · specs · design · tasks | spec · plan · tasks 외 | REQUIREMENTS · ROADMAP · PLAN | `SPEC.md`(5필드) · `stories.yaml` · 스토리별 문서 (선택: brief · PRD · 아키텍처 · UX) |
| 누가 일하나 | Kiro 에이전트 하나 | Claude Code 하나 | Claude Code 하나 | 역할별 서브에이전트 35종 | **이름 있는 역할 에이전트 5명** + 워크플로 스킬 + 독립 리뷰어 |
| 구현 방식 | 작업 클릭 / Run all Tasks | `/opsx:apply` | `/speckit-implement` | 웨이브 병렬 실행, 작업별 커밋 | `/bmad-build` — 계획 승인 → 구현 → **자체 리뷰·수정** → 스토리별 커밋 |
| 확인 | 작업 상태 | `validate` | `/speckit-converge` | VERIFICATION + UAT | 독립 리뷰(적대적·엣지 케이스·검증 공백) + `bmad-walkthrough` + `bmad-retrospective` |
| 강점 | IDE에서 쉽게 | 가벼운 변경 관리 | 꼼꼼한 설계 | 긴 작업에서도 품질 유지 | **일 크기에 맞춘 계획**, 역할별 관점, 리뷰가 기본 내장 |

> 정리: 앞의 도구들이 "정해진 단계 순서"를 따르게 한다면, BMAD는 **"이 일에 계획이 얼마나 필요한가"를 먼저 묻고 그만큼만 계획**한다. 그리고 구현 뒤 **리뷰와 사람 확인**을 흐름 안에 넣어 둔다.

## 모듈 구성

| 파일 | 역할 | 언제 읽나 |
| --- | --- | --- |
| [README.md](README.md) | 모듈 소개, 목표, 준비물, 품질 기준 (지금 이 문서) | 가장 먼저 |
| [GUIDE.md](GUIDE.md) | BMAD 개념 + 단계별 **목적·입력·규칙·산출물·체크리스트** 상세 가이드 | 단계별로 앱 만들기 |
| [SAMPLE.md](SAMPLE.md) | 완성한 "할 일 관리 앱"을 **실행·사용하고 스펙대로 동작하는지 확인**하는 가이드 | GUIDE 6단계(구현) 이후 |

> 💡 추천 학습 순서: README → GUIDE 개념·1~6단계로 앱 만들기 → SAMPLE로 앱 확인 → GUIDE 7~8단계(사람 확인·마무리) → (도전) GUIDE 9단계 + SAMPLE 8단계

## 사전 준비물

| 항목 | 버전/조건 | 확인 명령 |
| --- | --- | --- |
| Node.js | **20.12 이상** (설치 프로그램 + 예제 테스트) | `node --version` |
| Python | 3.10 이상 (BMAD 보조 스크립트 + 예제 앱 실행) | `python3 --version` |
| **uv** | 필수 — BMAD 스킬이 `uv run …` 으로 설정을 읽는다 | `uv --version` |
| Git | 필수 — `bmad-build` 가 변경 전 기준 커밋을 잡고, 끝나면 커밋한다 | `git --version` |
| Claude Code CLI | 로그인 완료 상태 | `claude --version` |

> uv 가 없으면 설치 프로그램이 경고만 하고 끝나지만, `bmad-build` 등이 제대로 동작하지 않는다. macOS: `brew install uv` 또는 `curl -LsSf https://astral.sh/uv/install.sh | sh`.

> ⚠️ `bmad-build` 는 구현 뒤 **여러 리뷰어(서브에이전트)** 를 띄우므로 Claude 사용량을 M01~M03보다 많이 쓴다. 할 일 앱 정도는 문제없다.

## 산출물 4종 (체크리스트)

- [x] 가이드 — [GUIDE.md](GUIDE.md) 단계 목적·입력·산출물·체크리스트
- [x] 규칙 — `SPEC.md` 의 Constraints · Non-goals 예시 + [부록 A. CLAUDE.md 규칙 조각](GUIDE.md#부록-a-claudemd-규칙-조각)
- [x] 자동화 — BMAD가 설치하는 Claude Code **스킬 29종**(`.claude/skills/bmad-*`) + 설정·보조 스크립트(`_bmad/`)
- [x] 샘플 — [SAMPLE.md](SAMPLE.md) 완성 앱 실행·기능별 사용 시나리오·스펙 추적·수정 요청 프롬프트

## 품질 기준

동작하는 샘플 또는 재현 가능한 프롬프트가 반드시 첨부되어야 하며, 문서는 따라 하면 되는 수준이어야 한다.

이 모듈의 완료 기준:

- [ ] `_bmad/` 와 `.claude/skills/bmad-*` 가 있고, `/bmad-help` 가 다음 할 일을 알려 준다.
- [ ] `_bmad-output/specs/spec-todo-app/` 에 `SPEC.md`, `stories.yaml` 이 있다.
- [ ] 스토리마다 `stories/N-….md` 가 생기고 상태가 `done` 이다.
- [ ] `git log --oneline` 에 스토리별 커밋이 있다.
- [ ] `node --test` 가 통과하고, 브라우저에서 할 일 앱이 SAMPLE 시나리오대로 동작한다.
- [ ] (도전) 스펙에 마감일 Capability 를 추가하고 `bmad-build` 로 구현했다.

## 알아 둘 점 (버전 변화)

BMAD는 빠르게 바뀌고 있다. 인터넷 글·영상과 다음이 다를 수 있다.

| 예전 글에서 보이는 것 | 현재 (v6.12) |
| --- | --- |
| v4 의 `*agent` 명령, `docs/prd.md`·`docs/architecture.md` 고정 경로, "웹 UI에서 계획 → IDE에서 개발" | 스킬(`/bmad-…`) 방식. 산출물은 `_bmad-output/` 아래 |
| `bmad-create-prd`, `bmad-dev-story`, `bmad-quick-dev` 같은 v6 초기 스킬 이름 | `bmad-prd`, **`bmad-build`** 로 정리됨 (옛 이름 일부는 안내용으로만 남음) |
| Analyst → PM → Architect → SM → Dev 의 **긴 고정 순서** | 일의 크기에 맞춰 고른다. 작은 앱은 `bmad-spec` → `bmad-build` 로 충분 |
| `.bmad-core/` 폴더 | `_bmad/` (설정·스크립트), `_bmad-output/` (산출물) |

**BMAD v7 (미리보기)** — GitHub `main` 브랜치는 이미 v7 알파다. 설치 마지막 화면에도 안내가 나온다. v7은 `npx skills add bmad-code-org/BMAD-METHOD` 로 설치하고 `bmad setup` 으로 시작하며, 정식 출시 전이다(2026-10 기준). **이 모듈은 안정판 v6.12 를 쓴다.** GitHub 첫 화면의 README가 이 문서와 다르면 v7 설명을 보고 있는 것이다. v6 문서는 `V6.12` 브랜치나 [docs.bmad-method.org](https://docs.bmad-method.org/) 에 있다.

## 참고 자료

- BMAD Method 저장소: https://github.com/bmad-code-org/BMAD-METHOD
- v6.12 브랜치 (이 모듈 기준): https://github.com/bmad-code-org/BMAD-METHOD/tree/V6.12
- 한국어 README (v6.12): https://github.com/bmad-code-org/BMAD-METHOD/blob/V6.12/README_KR.md
- 공식 문서: https://docs.bmad-method.org/ — 설치(`start/install-bmad`), 첫 변경 만들기(`start/build-your-first-change`), 계획 경로 고르기(`plan/choose-a-planning-path`), 스킬과 에이전트(`reference/skills-and-agents`)
- npm 패키지: https://www.npmjs.com/package/bmad-method
