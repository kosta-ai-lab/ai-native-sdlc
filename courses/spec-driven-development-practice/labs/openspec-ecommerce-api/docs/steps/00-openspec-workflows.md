# OpenSpec 1.5 워크플로우 지도 (기본 3 + 확장 7)

이 교재는 `propose → apply → verify → archive`를 실제로 밟았다. 여기서는 openspec 1.5의 전체 워크플로우와 "언제 무엇을 쓰나"를 정리한다.
근거: 프로젝트에 설치된 `.claude/commands/opsx/*.md`, `.claude/skills/openspec-*/SKILL.md`, `openspec/config.yaml`.

## 기본 사이클

| 슬래시(Claude Code) | 하는 일 | 산출물 |
|---|---|---|
| `/opsx:propose <name>` | change 생성 + 모든 artifact 한 번에 | `proposal`·`specs`·`design`·`tasks` |
| `/opsx:apply [name]` | tasks 따라 구현, 체크박스 갱신 | 코드 |
| `/opsx:archive [name]` | `archive/`로 이동 + delta→main spec 병합 | `openspec/specs/` 갱신 |

> CLI로도 같은 절차를 밟을 수 있다(이 교재 방식): `openspec new change` → `openspec status --json` → `openspec instructions <artifact> --json` → artifact 작성 → `openspec validate --strict` → `openspec archive --yes`.

## artifact-guided 코어 (1.5)

- `openspec status --change <n> --json` — artifact DAG(`proposal → specs,design → tasks`), `applyRequires`, 완료 판정.
- `openspec instructions <artifact> --change <n> --json` — `template`·`instruction`·`context`·`rules`·`resolvedOutputPath`.
- **규칙**: `context`·`rules`는 파일에 넣지 않고 작성 시 제약으로만 쓴다.

## 확장 워크플로우 — 언제 쓰나

| 슬래시 | 언제 쓰나 |
|---|---|
| `/opsx:new <name>` | 한 번에 다 만들지 않고 artifact를 하나씩. 각 단계에서 상의하고 싶을 때 |
| `/opsx:continue [name]` | `new` 이후 다음 artifact를 하나씩 이어서 생성 |
| `/opsx:ff <name>` | `propose`와 동일(빠른 일괄 생성) |
| `/opsx:explore [topic]` | 구현 전 문제 공간을 탐색(코드 작성 없음, 결정이 서면 change 제안) |
| `/opsx:verify [name]` | 구현이 spec과 일치하는지 3C(Completeness·Correctness·Coherence) 검증 |
| `/opsx:sync [name]` | archive 없이 delta를 main spec에 병합(병렬 change 중 점진 반영) |
| `/opsx:bulk-archive` | 여러 change 일괄 아카이브 + capability 충돌 자동 해결(코드 기준) |

## 선택 가이드

- **단순·빠름**: `propose`(ff) → apply → archive
- **복잡·팀 검토**: `new` → `continue`(반복) → apply → `verify` → archive
- **병렬 다기능**: 기능별 `new`/`ff`로 change 여러 개 → 각자 apply → `sync`로 점진 반영 → `bulk-archive`
- **아이디어 단계**: `explore` 먼저

## 이 교재가 실증한 것 vs 남은 확장

| 실증 완료 | 방식 |
|---|---|
| 기본 사이클 2회 | product-catalog, order-management (ADDED) |
| MODIFIED delta + archive sync | order-stock-and-cancellation (`~1 modified, +1 added`) |
| artifact-guided | `status`/`instructions`/`validate --strict` 실제 실행 |
| verify(3C) | E2E smoke로 대체 실증 |

| 다음 확장 실습(권장) | 이유 |
|---|---|
| `new`+`continue` | 단계별 상의형 개발 흐름 |
| 병렬 change + `sync` | 다기능 동시 개발·점진 병합 |
| `bulk-archive` | 충돌 해결 시연 |
| `explore` | 요구사항 불명확 시 |

## KOSTA 대비 난이도
KOSTA(입문)는 확장 7종을 **개념 설명만** 했다. 이 교재는 MODIFIED delta·다중 change·상태 전이·원자적 재고 차감을 **실제 코드와 스냅샷**으로 실증한다. `new/continue/sync/bulk-archive`의 실제 실행은 다음 확장 편에서 이어간다.
