# Contract: Orders API (Phase 1)

| Method | Path | Request Body | Success | Errors |
|---|---|---|---|---|
| POST | `/orders` | `{ items: [{ productId, quantity }] }` | `201` Order | `400`, `404` |
| GET | `/orders` | — | `200` Order[] | — |
| GET | `/orders/:id` | — | `200` Order | `404` |

- **Order**: `{ id, items: OrderItem[], total, status: "pending" }`
- **OrderItem**: `{ productId, quantity }`
- **Error body**: `{ "error": string }`
- 검증 순서: 구조(빈 items·quantity<1) → `400`, 상품 참조 → `404`, 그다음 서버가 total 계산.
