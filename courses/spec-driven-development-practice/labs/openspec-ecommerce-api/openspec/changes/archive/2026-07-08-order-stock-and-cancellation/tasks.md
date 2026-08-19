## 1. Model and store
- [x] 1.1 Change `Order.status` to `'pending' | 'cancelled'` and add `OrderStore.setStatus(id, status)` in `src/store.ts`

## 2. Stock deduction on create (MODIFIED behavior)
- [x] 2.1 Write failing tests: successful create decrements stock; insufficient stock → 409 leaving all stock unchanged; aggregate quantity across duplicate items
- [x] 2.2 Update `POST /orders` to check-all-then-deduct stock (409 on insufficient)

## 3. Cancel order (ADDED)
- [x] 3.1 Write failing tests: cancel restores stock and sets status (200); missing order → 404; already-cancelled → 409
- [x] 3.2 Implement `POST /orders/:id/cancel` in `src/orders.ts`

## 4. Verify
- [x] 4.1 Full vitest suite + `tsc` typecheck; smoke: create order then cancel restores stock
