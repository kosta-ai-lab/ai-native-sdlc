# OpenSpec vs GitHub Spec Kit — 구조·워크플로우 비교 (실측)

두 SDD 도구를 같은 머신에서 실제로 init한 산출물로 비교한다. 추측이 아니라 파일 구조 실측 기반이다.

- OpenSpec **1.5.0** — `openspec init --tools claude` → `openspec-ecommerce-api`
- Spec Kit(specify) **0.12.8** — `specify init . --integration claude` → `speckit-ecommerce-api`

## 초기화가 만드는 것

| 항목 | OpenSpec | Spec Kit |
|---|---|---|
| 설정/헌법 | `openspec/config.yaml` (schema·context·rules) | `.specify/memory/constitution.md` |
| 템플릿 | 내장 — `openspec instructions`가 제공 | `.specify/templates/` (spec·plan·tasks·constitution·checklist) |
| 스크립트 | 없음 (CLI가 상태·지시를 계산) | `.specify/scripts/bash/*` (create-new-feature·setup-plan·setup-tasks) |
| 슬래시/스킬 | `.claude/commands/opsx/*` (propose·apply·archive·new·ff·continue·verify·sync·explore·bulk-archive) | `.claude/skills/speckit-*` (constitution·specify·clarify·plan·tasks·analyze·checklist·implement·converge) |
| 워크플로우 정의 | config.yaml의 schema | `.specify/workflows/speckit/workflow.yml` |

## 워크플로우

| 항목 | OpenSpec | Spec Kit |
|---|---|---|
| 단계 | propose → apply → archive (3) | constitution → specify → (clarify) → plan → (checklist) → tasks → (analyze) → implement |
| artifact | proposal / **specs(delta)** / design / tasks | spec / plan / tasks (+ data-model·contracts·research·quickstart) |
| 변경 관리 | **delta**(ADDED/MODIFIED/REMOVED), archive 시 main spec 병합 | **기능별 개별 spec 파일**, 변경도 새 feature/재명세 |
| CLI 역할 | `new`/`status`/`instructions`/`validate`/`archive` — 상태·지시를 CLI가 계산(artifact-guided) | `init` + bash 스크립트로 스캐폴드, 나머지는 슬래시커맨드(LLM 주도) |
| 품질 게이트 | `validate --strict`, `verify`(3C) | `clarify`·`checklist`·`analyze`(선택 스킬) |

## 정체성 대비

- **OpenSpec = 연속성 레이어**: 하나의 living spec을 델타로 진화시킨다. 브라운필드·증분 변경에 강함. (본 교재의 `order-stock-and-cancellation`에서 기존 Create Order를 MODIFIED로 바꾼 것이 예)
- **Spec Kit = 거버넌스 레이어**: 기능별 upfront 종합 명세(spec/plan/tasks)와 clarify·analyze 품질 게이트. 그린필드·구조적 진행에 강함.

## 같은 예제로 볼 차이 (다음 실습)

`product-catalog`를 Spec Kit으로 만들면:
- `/speckit.constitution` → `.specify/memory/constitution.md`
- `/speckit.specify` → `specs/001-product-catalog/spec.md` (delta가 아니라 **전체 명세**)
- `/speckit.plan` → `plan.md` + `data-model.md`·`contracts/`
- `/speckit.tasks` → `tasks.md`
- `/speckit.implement`

OpenSpec의 `openspec/changes/<id>/` + delta와 달리, **번호 붙은 feature 폴더**에 전체 spec을 둔다. 변경은 새 feature 또는 재명세로 다룬다 — 이것이 "델타 vs 개별 파일" 대비의 실체다.

## 공통점
둘 다 Claude Code를 지원하고, 의도→스펙→코드의 SDD를 따르며, TDD 친화적이다.
