# Implementation Plan: Product Catalog

**Branch**: `001-product-catalog` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

## Summary

상품 CRUD REST API를 Hono로 구현한다. Product는 name·price(정수 cents)·stock(0 이상 정수)을 가지며, 교체 가능한 인메모리 저장소 뒤에서 관리된다. 검증(400)·미존재(404)를 명확히 하고, 요청 수준 테스트로 모든 Acceptance Scenario를 커버한다.

## Technical Context

**Language/Version**: TypeScript, Node.js (ESM)
**Primary Dependencies**: Hono, @hono/node-server
**Storage**: in-memory, behind a `ProductStore` interface (swappable)
**Testing**: vitest (`app.request` 요청 수준)
**Target Platform**: Node.js server
**Project Type**: Single project (API)
**Performance Goals**: N/A (교육 예제)
**Constraints**: 외부 검증 라이브러리 없이 수동 검증(순수 함수)
**Scale/Scope**: 단일 프로세스, 상품 CRUD 5개 엔드포인트

## Constitution Check

*GATE: Phase 0 전 통과, Phase 1 후 재확인.*

- I. Spec-Driven: spec.md 선행 ✓
- II. Test-First: 각 FR → vitest 시나리오 ✓
- III. Thin Storage: `ProductStore` 인터페이스 뒤 인메모리 ✓
- IV. Explicit Errors: 400/404 + `{ error }` ✓
- V. Server Authority: id를 서버가 생성 ✓

→ 위반 없음. Gate 통과.

## Project Structure

### Documentation (this feature)
```text
specs/001-product-catalog/
├── plan.md          # 이 파일
├── research.md      # Phase 0
├── data-model.md    # Phase 1
├── quickstart.md    # Phase 1
├── contracts/       # Phase 1
└── tasks.md         # Phase 2 (setup-tasks.sh)
```

### Source Code (repository root)
```text
src/
├── index.ts              # Hono 앱 + 라우트 마운트
├── store.ts              # Product, ProductStore, InMemoryProductStore
├── products.ts           # validateProductInput, createProductRoutes
├── products.test.ts      # validation 단위 테스트
└── products.routes.test.ts   # 라우트 요청 테스트
```
**Structure Decision**: Single project(API). `models/services` 분리 대신, 작은 예제라 store/routes 파일 분리로 충분(one responsibility per file).

## Complexity Tracking

위반 없음 — 표 비움.
