# Tasks: Product Catalog

**Feature**: 001-product-catalog | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 1: Setup
- [x] T001 Initialize TypeScript + Hono project — `pnpm add hono @hono/node-server`; `pnpm add -D typescript tsx vitest @types/node`; add `package.json` scripts, `tsconfig.json`
- [x] T002 Add `/health` route and its test in `src/index.ts`, `src/index.test.ts`

## Phase 2: Foundational (blocks all user stories)
- [x] T003 Define `Product`, `NewProduct`, `ProductStore` and `InMemoryProductStore` in `src/store.ts`
- [x] T004 [P] Implement `validateProductInput(input, { partial })` in `src/products.ts` with unit tests in `src/products.test.ts`
- Checkpoint: 모델·검증 준비 완료

## Phase 3: User Story 1 — Register and browse products (P1)
- [x] T005 [P] [US1] Write request tests for `POST /products` (201, 400×3) in `src/products.routes.test.ts`
- [x] T006 [US1] Implement `POST /products` in `src/products.ts` (`createProductRoutes`)
- [x] T007 [P] [US1] Write tests for `GET /products` and `GET /products/:id` (200, 404)
- [x] T008 [US1] Implement `GET /products` and `GET /products/:id`
- [x] T009 [US1] Mount product routes in `src/index.ts`
- Checkpoint: **US1 독립 테스트 가능 — 등록·조회 MVP**

## Phase 4: User Story 2 — Correct product details (P2)
- [x] T010 [P] [US2] Write tests for `PATCH /products/:id` (200 update, 404 missing, 400 leaves unchanged)
- [x] T011 [US2] Implement `PATCH /products/:id` (`pickProductFields`, partial validation)
- Checkpoint: US2 독립 테스트 가능

## Phase 5: User Story 3 — Remove discontinued products (P3)
- [x] T012 [P] [US3] Write tests for `DELETE /products/:id` (204 then 404, and 404 when missing)
- [x] T013 [US3] Implement `DELETE /products/:id`

## Phase 6: Polish
- [x] T014 Full vitest suite (21) + `tsc` typecheck; quickstart E2E smoke

## Dependencies & Execution Order
- **Phase order**: Setup(T001–2) → Foundational(T003–4) → US1(T005–9) → US2(T010–11) → US3(T012–13) → Polish(T014).
- **US1 = MVP**. US2·US3는 US1 이후 독립적으로 추가 가능.
- **[P]** = 다른 파일이라 병렬 가능(주로 테스트 작성). 같은 파일을 만지는 구현 태스크는 순차.
