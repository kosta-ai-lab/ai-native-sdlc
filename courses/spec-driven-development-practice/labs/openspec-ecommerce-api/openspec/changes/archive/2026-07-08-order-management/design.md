## Context

주문은 상품을 참조하므로 product store를 공유해야 합니다. 주문 저장도 인터페이스 뒤 인메모리로 둡니다. 총액은 서버가 계산해 클라이언트 조작을 막습니다.

## Goals / Non-Goals

**Goals:** 주문 생성·조회, 상품 참조 검증, 서버측 총액 계산, 상태 필드.
**Non-Goals:** 재고 차감, 주문 취소·상태 전이, 결제.

## Decisions

### 데이터 모델
```ts
interface OrderItem { productId: string; quantity: number }
interface Order { id: string; items: OrderItem[]; total: number; status: 'pending' }
```

### 라우트 테이블
| 메서드 | 경로 | 성공 | 실패 |
|---|---|---|---|
| POST | `/orders` | 201 | 400 / 404 |
| GET | `/orders` | 200 | — |
| GET | `/orders/:id` | 200 | 404 |

### 총액 계산·검증 순서
1. 구조 검증: `items`가 비었으면 `400`, 각 `quantity`가 정수 1 이상 아니면 `400`.
2. 참조 검증: 각 `productId`를 `ProductStore.get`으로 확인, 없으면 `404`.
3. `total = Σ product.price × quantity` (요청의 `total`은 무시하고 서버가 계산).
- 구조(400)를 참조(404)보다 먼저 검사해, 형식이 틀린 요청은 상품 조회 이전에 거른다.

### store 공유
- `index.ts`에서 `InMemoryProductStore` 하나를 만들어 product 라우트와 order 라우트에 함께 주입.
- `OrderStore` 인터페이스(create/list/get) + `InMemoryOrderStore`.

### Rejected Alternatives
- 주문에 상품 가격 스냅샷 저장: 1막은 참조 + 생성 시점 total로 충분. 가격 변동 이력은 후속 과제.

## Risks / Trade-offs

- `total`을 생성 시점 가격으로 저장하므로 이후 상품 가격이 바뀌어도 재계산하지 않음(1막 수용).
- 재고를 차감하지 않아 재고를 초과하는 주문이 가능 → 2막 `order-cancellation-and-stock`에서 해결.
