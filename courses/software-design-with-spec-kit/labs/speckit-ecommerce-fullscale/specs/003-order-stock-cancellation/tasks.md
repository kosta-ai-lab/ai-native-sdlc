# Tasks: Order Stock and Cancellation

**Feature**: 003-order-stock-cancellation | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 2: Foundational
- [x] T001 Change `Order.status` to `'pending' | 'cancelled'` and add `OrderStore.setStatus(id, status)` in `src/store.ts`

## Phase 3: User Story 1 — Reserve stock when ordering (P1)
- [x] T002 [P] [US1] Write tests: create decrements stock; insufficient → 409 unchanged; aggregate duplicate items
- [x] T003 [US1] Update `POST /orders` to check-all-then-deduct stock (409 on insufficient)
- Checkpoint: **US1 독립 테스트 가능 — 재고 반영**

## Phase 4: User Story 2 — Cancel and restore stock (P2)
- [x] T004 [P] [US2] Write tests: cancel restores stock + status (200); missing → 404; already-cancelled → 409
- [x] T005 [US2] Implement `POST /orders/:id/cancel`

## Phase 5: Polish
- [x] T006 Full vitest suite + `tsc` typecheck; quickstart E2E smoke

## Dependencies & Execution Order
- Foundational(T001) → US1(T002–3) → US2(T004–5) → Polish(T006).
- 002 order-management를 확장한다(같은 store 재사용).
