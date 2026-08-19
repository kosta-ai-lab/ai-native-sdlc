# Data Model: Order Stock and Cancellation (Phase 1)

## Order (extends feature 002)
| field | change |
|---|---|
| status | `'pending'` → `'pending' | 'cancelled'` |

- `OrderStore` gains `setStatus(id, status)`.

## Product (reused from feature 001)
- `stock` decreases on order creation and increases on cancellation. No new field.

## 재고 조정 규칙
- **주문**: `aggregate(items)`로 productId별 합산 수량 → **전량 확인** → 부족하면 409(변경 없음) → **전량 차감**.
- **취소**: 주문의 각 수량을 상품 `stock`에 되돌린다. 이미 cancelled면 409.
