# Data Model: Order Management (Phase 1)

## Order
| field | type | rules |
|---|---|---|
| id | string | server-generated (uuid) |
| items | OrderItem[] | non-empty |
| total | integer | server-computed, cents |
| status | 'pending' | fixed at creation |

## OrderItem
| field | type | rules |
|---|---|---|
| productId | string | references a Product (feature 001) |
| quantity | integer | >= 1 |

- 관계: Order → Product via `productId` (참조). 총액은 참조 시점의 상품 가격으로 계산한다.
- OrderStore는 ProductStore와 별개이나, 같은 앱에서 하나의 ProductStore를 공유해 상품을 조회한다.
