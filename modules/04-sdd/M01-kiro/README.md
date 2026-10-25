# 모듈 M01 — Kiro로 하는 IDE 안의 스펙 주도 개발

> 상태: 초안 · 담당: 이선아 교수
> 기준 문서: [kiro.dev/docs](https://kiro.dev/docs/) (2026-10-07 갱신본) · Kiro IDE 1.x · macOS

## 목적

AWS가 만든 AI 개발 환경 **[Kiro](https://kiro.dev)** 를 사용해, **"명세를 먼저 쓰고 그 명세로 코드를 만드는"** 스펙 주도 개발(SDD)을 **IDE 화면 안에서 버튼과 채팅으로** 처음 경험해 본다. Kiro는 명세(Spec), 프로젝트 규칙(Steering), 자동화(Hooks)를 IDE에 기본으로 넣어 두었기 때문에 따로 설치할 CLI나 명령어를 외울 필요가 없어, 이 과정의 **첫 모듈**로 삼는다.

이 모듈을 마치면 초보자도 다음을 할 수 있다.

- Kiro IDE를 설치하고 로그인한 뒤 프로젝트 폴더를 연다.
- **스티어링 파일**(`.kiro/steering/product.md`, `tech.md`, `structure.md`)로 프로젝트의 목적·기술·구조를 AI에게 알려 준다.
- **Spec** 을 만들어 `requirements.md`(EARS 형식 요구사항) → `design.md` → `tasks.md` 를 단계별로 검토하고 승인한다.
- `tasks.md` 의 작업을 실행해 할 일 관리 앱을 완성한다.
- **Agent Hook** 으로 "파일을 저장하면 자동으로 테스트 실행" 같은 자동화를 만든다.
- 기존 Spec을 고쳐 두 번째 기능(마감일)을 추가하고 **Sync Files** 로 작업 목록을 갱신한다.

## 한눈에 보는 Kiro 흐름

```
 Kiro IDE (한 화면 안에서)
 ┌────────────────────────────────────────────────────────────────────────┐
 │ ① Steering          ② Spec (Feature · Requirements-First)      ③ 실행    │
 │ product.md      →   requirements.md → design.md → tasks.md  →  Run all │
 │ tech.md             (EARS: WHEN … THE SYSTEM SHALL …)            Tasks  │
 │ structure.md        각 단계마다 사람이 검토하고 다음으로 진행             │
 │                                                                        │
 │ ④ Agent Hooks: 파일 저장 → 테스트 자동 실행                               │
 └────────────────────────────────────────────────────────────────────────┘
        결과물은 모두 프로젝트 안 .kiro/ 폴더에 Markdown·JSON 파일로 남는다
```

## 이 과정에서 M01의 위치

| 순서 | 모듈 | 도구 형태 | 이 모듈에서 익히는 것 |
| --- | --- | --- | --- |
| **M01** | **Kiro (지금)** | IDE (데스크톱 앱) | SDD의 기본 순서: 규칙(Steering) → 요구사항 → 설계 → 작업 → 구현 |
| M02 | OpenSpec | CLI + Claude Code | 같은 흐름을 터미널·Claude Code로, 변경(델타) 중심으로 |
| M03 | Spec Kit | CLI + Claude Code | 더 많은 단계로 꼼꼼하게 설계·검증 + 세 도구 종합 비교 |

> 세 모듈 모두 같은 **"할 일 관리 웹 앱"** 을 만든다. Kiro에서 익힌 개념(규칙 → 요구사항 → 설계 → 작업)이 M02·M03에서 어떤 이름과 방식으로 바뀌는지 비교하며 보면 좋다. 세 도구의 종합 비교표는 [M03 Spec Kit README](../M03-spec-kit/README.md#m01-kiro--m02-openspec과-무엇이-다른가) 에 있다.

## 모듈 구성

| 파일 | 역할 | 언제 읽나 |
| --- | --- | --- |
| [README.md](README.md) | 모듈 소개, 목표, 준비물, 품질 기준 (지금 이 문서) | 가장 먼저 |
| [GUIDE.md](GUIDE.md) | Kiro 개념 + 단계별 **목적·입력·규칙·산출물·체크리스트** 상세 가이드 | 개념을 이해하며 단계별로 앱 만들기 |
| [SAMPLE.md](SAMPLE.md) | 완성한 "할 일 관리 앱"을 **실행·사용하고 명세대로 동작하는지 확인**하는 가이드 | GUIDE 6단계(작업 실행) 이후 |

> 💡 추천 학습 순서: README → GUIDE 개념·1~6단계로 앱 만들기 → SAMPLE로 앱 실행·확인 → GUIDE 7단계(Hook) → (도전) GUIDE 8단계 + SAMPLE 8단계

## 사전 준비물

| 항목 | 버전/조건 | 확인 방법 |
| --- | --- | --- |
| Kiro IDE | 최신 (1.x) | kiro.dev 에서 다운로드 — Intel·Apple Silicon Mac 모두 지원 |
| 로그인 계정 | Google, GitHub, AWS Builder ID, 조직 계정 중 하나 | 첫 실행 때 선택 |
| Node.js | 20 이상 (예제 테스트용) | `node --version` |
| Python 3 | 예제 앱 로컬 실행용 (`python3 -m http.server`) | `python3 --version` |
| Git | 아무 최신 버전 | `git --version` |
| 웹 브라우저 | Chrome/Safari 등 | — |

> Claude Code는 이 모듈에서 필요 없다. Kiro 안의 에이전트가 같은 역할을 한다.
> 요금제(무료 사용량 등)는 계속 바뀌므로 [kiro.dev/pricing](https://kiro.dev/pricing) 에서 확인한다.

## 산출물 4종 (체크리스트)

- [x] 가이드 — [GUIDE.md](GUIDE.md) 단계 목적·입력·산출물·체크리스트
- [x] 규칙 — Kiro **스티어링 파일** 3종 예시([GUIDE.md 2단계](GUIDE.md#2-단계-스티어링steering--프로젝트-규칙-알려-주기)) + [부록 A. 팀 규칙 스티어링 조각](GUIDE.md#부록-a-팀-규칙-스티어링-조각)
- [x] 자동화 — **Agent Hook**: 소스 저장 시 `node --test` 자동 실행 ([GUIDE.md 7단계](GUIDE.md#7-단계-agent-hook--저장하면-테스트-자동-실행))
- [x] 샘플 — [SAMPLE.md](SAMPLE.md) 완성 앱 실행·기능별 사용 시나리오·데이터 확인·수정 요청 프롬프트

## 품질 기준

동작하는 샘플 또는 재현 가능한 프롬프트가 반드시 첨부되어야 하며, 문서는 따라 하면 되는 수준이어야 한다.

이 모듈의 완료 기준:

- [ ] `.kiro/steering/` 에 `product.md`, `tech.md`, `structure.md` 가 있다.
- [ ] `.kiro/specs/todo-list/` 에 `requirements.md`, `design.md`, `tasks.md` 가 있고, 모든 작업이 완료 표시되어 있다.
- [ ] `node --test` 가 통과하고, 브라우저에서 할 일 앱이 SAMPLE 시나리오대로 동작한다.
- [ ] `.kiro/hooks/` 에 테스트 자동 실행 Hook이 있고, 소스를 저장하면 테스트가 실행된다.
- [ ] (도전) 같은 Spec에 마감일 요구사항을 추가하고 Sync Files 로 작업을 갱신·구현했다.

## 알아 둘 점 (버전 차이)

Kiro는 2025년 프리뷰 이후 빠르게 바뀌었다. 인터넷의 예전 글과 다음이 다를 수 있다.

| 예전 글에서 보이는 것 | 현재 문서 기준 |
| --- | --- |
| 채팅 시작 때 "Vibe / Spec" 중 고르기 | 왼쪽 Kiro 아이콘 → Kiro 패널 **SPECS** 의 **+** 로 Spec 시작 |
| Spec이 항상 요구사항부터 시작 | Feature Spec 은 **Requirements-First / Design-First** 선택, 승인 없이 한 번에 만드는 **Quick Spec** 도 있음 |
| 버그도 Feature Spec 으로 | **Bugfix Spec** (`bugfix.md`) 이 따로 있음 |
| Hook 파일 `*.kiro.hook` | `.kiro/hooks/<이름>.json` (`"version": "v1"`) |
| IDE만 있음 | IDE 외에 **CLI(`kiro-cli`)**, Web, 모바일이 같은 `.kiro/` 설정을 공유 |

이 문서의 버튼 이름은 공식 문서를 기준으로 썼다. 화면 문구가 조금 다르면 **같은 역할을 하는 버튼**을 찾으면 된다.

## 참고 자료

- Kiro 공식 사이트: https://kiro.dev
- 첫 프로젝트 튜토리얼: https://kiro.dev/docs/getting-started/first-project/
- Specs: https://kiro.dev/docs/specs/ · Feature Specs: https://kiro.dev/docs/specs/feature-specs/ · Best Practices: https://kiro.dev/docs/specs/best-practices/
- Steering: https://kiro.dev/docs/steering/
- Hooks: https://kiro.dev/docs/hooks/ · Hook 종류: https://kiro.dev/docs/hooks/types/
