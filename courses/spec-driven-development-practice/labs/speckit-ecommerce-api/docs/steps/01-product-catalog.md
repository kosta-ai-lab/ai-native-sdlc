# Step 1 — product-catalog: Spec Kit 한 사이클

GitHub Spec Kit으로 상품 CRUD를 `constitution → specify → plan → tasks → implement`로 개발한다. OpenSpec 트랙(`../openspec-ecommerce-api`)의 같은 기능과 대조하며 읽으면 두 방법론의 차이가 선명하다.

## Spec Kit 워크플로우 (실행 로그)

| 스텝 | 명령 / 산출물 | 커밋 |
|---|---|---|
| 0. init | `specify init . --integration claude` → `.specify/`(templates·scripts·memory·workflows) + `.claude/skills/speckit-*` | `4cbb344` |
| 1. constitution | `.specify/memory/constitution.md` — 5개 Core Principle + governance | `0b215bf` |
| 2. specify | `create-new-feature.sh` → `specs/001-product-catalog/spec.md` (User Story P1/P2/P3, FR-001~006, SC-001~004) | `e2cc35a` |
| 3. plan | `setup-plan.sh` → `plan.md` + `research.md`·`data-model.md`·`contracts/`·`quickstart.md` | `17bef8d` |
| 4. tasks | `setup-tasks.sh`(템플릿 경로) → `tasks.md` (Phase·`[P]`·`[US]` 포맷) | `ea17633` |
| 5. implement | `src/` 구현, 21 tests, E2E smoke(201/200/404/400) | `93daa21`, `869ffa9` |

## Spec Kit 특징 (OpenSpec 대비)

- **feature 폴더**: `specs/001-product-catalog/`(번호 붙은 폴더). OpenSpec은 `openspec/changes/<name>/`.
- **전체 spec**: delta가 아니라 완전한 명세. 변경은 새 feature 또는 재명세로.
- **User Story 우선순위(P1/P2/P3)**: 각 스토리가 독립 테스트 가능한 MVP 슬라이스. OpenSpec은 Requirement + Scenario(WHEN/THEN).
- **여러 Phase 1 산출물**: research·data-model·contracts·quickstart. OpenSpec은 design.md 하나.
- **Constitution**: `.specify/memory/constitution.md`가 plan/tasks 전 거버넌스 게이트. OpenSpec은 config.yaml의 context/rules.
- **CLI 방식**: bash 스크립트로 스캐폴드(create-new-feature/setup-plan/setup-tasks) 후 템플릿을 채운다. OpenSpec은 `openspec new`/`status`/`instructions`로 artifact-guided.

## 산출물 매핑 (SDD 공통 개념)

| SDD 개념 | OpenSpec | Spec Kit |
|---|---|---|
| 왜 / 무엇 | proposal.md | spec.md (User Scenarios) |
| 요구사항 | specs/ delta (Requirement/Scenario) | spec.md FR + Acceptance Scenarios |
| 설계 | design.md | plan.md + data-model + contracts + research |
| 작업 | tasks.md | tasks.md (Phase / [P] / [US]) |
| 검증 | verify(3C) / validate --strict | quickstart + checklist / analyze |

## 재현
```bash
git checkout speckit-product-catalog
```

## 결과
21 tests, 상품 CRUD 5개 엔드포인트, User Story 3개(P1 등록·조회 / P2 수정 / P3 삭제) 모두 구현.
