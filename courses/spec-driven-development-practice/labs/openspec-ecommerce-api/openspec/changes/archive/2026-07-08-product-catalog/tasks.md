## 1. Store and model
- [x] 1.1 Define `Product` interface and `ProductStore` interface (create/list/get/update/delete) in `src/store.ts`
- [x] 1.2 Implement `InMemoryProductStore` (Map-based) with `crypto.randomUUID()` ids

## 2. Validation
- [x] 2.1 Write failing tests for `validateProductInput`: missing/empty name, negative price, negative stock, partial mode allows omitted fields
- [x] 2.2 Implement `validateProductInput(input, { partial })` in `src/products.ts` (pure function returning error message or null)

## 3. Routes (test-first, one scenario group per task)
- [x] 3.1 Write failing request tests for `POST /products`: 201 valid, 400 missing name, 400 negative price, 400 negative stock
- [x] 3.2 Implement `POST /products`
- [x] 3.3 Write failing tests for `GET /products` (200 array) and `GET /products/:id` (200 existing, 404 missing)
- [x] 3.4 Implement `GET /products` and `GET /products/:id`
- [x] 3.5 Write failing tests for `PATCH /products/:id`: 200 update, 404 missing, 400 invalid leaves product unchanged
- [x] 3.6 Implement `PATCH /products/:id`
- [x] 3.7 Write failing tests for `DELETE /products/:id`: 204 then subsequent 404, and 404 when missing
- [x] 3.8 Implement `DELETE /products/:id`

## 4. Wire-up
- [x] 4.1 Mount the products router in `src/index.ts`
- [x] 4.2 Run full vitest suite and `tsc` typecheck; confirm every product-catalog scenario passes
