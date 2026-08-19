## Why

주문이 실제 재고를 반영해야 초과 판매를 막을 수 있습니다. 주문 생성은 재고를 차감하고, 주문 취소는 차감했던 재고를 되돌립니다.

## What Changes

- 주문 생성 시 각 상품의 재고를 확인 → 부족하면 `409`, 충분하면 주문 수량만큼 `stock`을 차감합니다 (**BREAKING**: 기존 Create Order 동작이 바뀝니다)
- 주문 취소: `POST /orders/:id/cancel` → `status`를 `"cancelled"`로 바꾸고 차감했던 재고를 복원합니다
- 주문 `status`: `"pending" | "cancelled"`
- 이미 취소된 주문을 다시 취소하면 `409`

## Capabilities

### New Capabilities
(없음)

### Modified Capabilities
- `order-management`: Create Order에 재고 차감·부족 시 `409`를 추가하고, Cancel Order 요구사항을 신설합니다

## Impact

- 수정: `src/orders.ts`(재고 차감·취소 라우트), `src/store.ts`(`Order.status` 확장·`OrderStore.setStatus`), 재고 조정은 `ProductStore.update` 사용
- 테스트: `src/orders.routes.test.ts` 확장
- 의존성: 추가 없음

## Non-goals

- 결제·배송, 부분 취소, 재고 예약(reservation) 타임아웃
