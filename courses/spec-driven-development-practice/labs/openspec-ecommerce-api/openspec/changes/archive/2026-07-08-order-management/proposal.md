## Why

상품을 실제로 판매하려면 고객이 상품을 담아 주문할 수 있어야 합니다. 주문은 상품을 참조해 총액을 계산하고, 처리 상태를 가집니다.

## What Changes

- 주문 자원 REST API
  - `POST /orders` 생성(items 배열), `GET /orders` 목록, `GET /orders/:id` 단건
- 주문 모델: `id`, `items`(`{ productId, quantity }[]`), `total`(정수 cents, 서버 계산), `status`(`"pending"`)
- 생성 시: 각 `productId`가 존재해야 하고, 각 `quantity`는 1 이상, `total`은 `sum(product.price * quantity)`
- 검증 실패: 빈 items·`quantity < 1` → `400`, 존재하지 않는 상품 참조 → `404`

## Capabilities

### New Capabilities
- `order-management`: 주문 생성·조회와 상품 참조·총액 계산·상태

### Modified Capabilities
(없음 — 상품은 읽기만 하며 `product-catalog`의 요구사항은 바뀌지 않습니다)

## Impact

- 신규: `src/orders.ts`(라우트 + 총액 계산), `src/store.ts`에 `Order`/`OrderStore` 추가, `src/orders.routes.test.ts`
- 수정: `src/index.ts`(주문 라우트 마운트, product store 공유)
- 의존성: 추가 없음

## Non-goals

- 재고 차감·복원 → 2막 `order-cancellation-and-stock`
- 주문 취소·상태 전이(pending 외) → 2막
- 결제·배송·인증
