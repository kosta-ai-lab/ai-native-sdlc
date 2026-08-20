# Contract: Products API (Phase 1)

| Method | Path | Request Body | Success | Errors |
|---|---|---|---|---|
| POST | `/products` | `{ name, price, stock }` | `201` Product | `400` |
| GET | `/products` | — | `200` Product[] | — |
| GET | `/products/:id` | — | `200` Product | `404` |
| PATCH | `/products/:id` | `{ name?, price?, stock? }` | `200` Product | `400`, `404` |
| DELETE | `/products/:id` | — | `204` (no body) | `404` |

- **Product**: `{ id: string, name: string, price: number, stock: number }`
- **Error body**: `{ "error": string }`
- PATCH는 부분 수정, 생성과 동일한 검증. 무효 입력은 400이며 상품을 변경하지 않는다.
