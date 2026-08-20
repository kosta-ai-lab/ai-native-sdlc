# Tasks: Order Management

**Feature**: 002-order-management | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 2: Foundational (blocks all user stories)
- [x] T001 Add `Order`, `OrderItem`, `OrderStore` and `InMemoryOrderStore` to `src/store.ts`

## Phase 3: User Story 1 — Place an order (P1)
- [x] T002 [P] [US1] Write tests for `POST /orders` (201 with server total, 400 empty, 400 quantity<1, 404 unknown product) in `src/orders.routes.test.ts`
- [x] T003 [US1] Implement `POST /orders` in `src/orders.ts` (structure → product lookup → total)
- Checkpoint: **US1 독립 테스트 가능 — 주문 생성 MVP**

## Phase 4: User Story 2 — Review orders (P2)
- [x] T004 [P] [US2] Write tests for `GET /orders` (200) and `GET /orders/:id` (200, 404)
- [x] T005 [US2] Implement `GET /orders` and `GET /orders/:id`

## Phase 5: Wire-up & Polish
- [x] T006 Share one `InMemoryProductStore`, mount order routes in `src/index.ts`
- [x] T007 Full vitest suite + `tsc` typecheck; quickstart E2E smoke

## Dependencies & Execution Order
- Foundational(T001) → US1(T002–3) → US2(T004–5) → Wire-up(T006–7).
- US1 = MVP. Product store는 feature 001에서 재사용.
