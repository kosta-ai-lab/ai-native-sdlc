## 1. Order store and model
- [x] 1.1 Add `OrderItem`, `Order`, and `OrderStore` (create/list/get) to `src/store.ts`, plus `InMemoryOrderStore`

## 2. Order creation
- [x] 2.1 Write failing tests for `POST /orders`: 201 valid computes total, 400 empty items, 400 quantity<1, 404 unknown product
- [x] 2.2 Implement `POST /orders` in `src/orders.ts` (structure checks → product lookup → total → status "pending")

## 3. Order reads
- [x] 3.1 Write failing tests for `GET /orders` (200 array) and `GET /orders/:id` (200 existing, 404 missing)
- [x] 3.2 Implement `GET /orders` and `GET /orders/:id`

## 4. Wire-up
- [x] 4.1 Create one shared `InMemoryProductStore` in `src/index.ts`; inject into both product and order routes; mount order routes
- [x] 4.2 Run full vitest suite and `tsc` typecheck; confirm every order-management scenario passes
