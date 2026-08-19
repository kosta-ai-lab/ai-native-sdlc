## Context

주문이 재고를 소비·복원해야 합니다. 재고 조정은 `ProductStore.update`로 하고, 주문 취소를 위해 `OrderStore`가 상태 변경을 지원합니다.

## Goals / Non-Goals

**Goals:** 주문 생성 시 재고 차감·부족 시 `409`, 주문 취소 시 재고 복원, 상태 전이 `pending → cancelled`.
**Non-Goals:** 부분 취소, 재고 예약 타임아웃, 결제.

## Decisions

### 재고 차감 — 전량 확인 후 차감(부분 실패 방지)
1. 모든 item에 대해 상품 존재·재고 충분을 **먼저 전부** 확인. 하나라도 부족하면 `409`를 반환하고 아무 재고도 바꾸지 않는다.
2. 전부 통과하면 각 상품 `stock -= quantity` (`products.update`).
- 인메모리 단일 프로세스라 확인→차감 사이 경쟁이 없다. "전량 확인 후 전량 차감"으로 부분 차감을 방지한다.
- 같은 상품이 여러 item에 나오면 합산 수량으로 확인한다.

### 주문 취소
- `POST /orders/:id/cancel`. 없으면 `404`, 이미 `cancelled`면 `409`.
- `pending → cancelled`로 바꾸고, 그 주문의 각 item 수량을 상품 `stock`에 되돌린다.

### 모델 변경
- `Order.status`: `'pending' | 'cancelled'`.
- `OrderStore.setStatus(id, status)` 추가.

### Rejected Alternatives
- 재고 예약(reserve/commit 2단계): 1막 스코프 초과. 즉시 차감으로 단순화.

## Risks / Trade-offs

- 확인→차감을 원자적으로 가정(단일 프로세스). 동시성 환경에서는 락이 필요 — 교육 범위 밖.
- `total`은 생성 시점 가격을 유지(재고 변동과 무관).
