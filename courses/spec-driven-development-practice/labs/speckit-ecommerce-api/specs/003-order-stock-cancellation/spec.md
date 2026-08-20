# Feature Specification: Order Stock and Cancellation

**Feature Branch**: `003-order-stock-cancellation`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Order stock and cancellation: deduct product stock when ordering (reject if insufficient), and cancel orders to restore stock"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reserve stock when ordering (Priority: P1)

주문이 실제 재고를 소비한다. 재고가 부족하면 주문을 거절한다.

**Why this priority**: 재고 없는 주문은 초과 판매를 낳는다. 실재고 반영이 핵심이다.

**Independent Test**: 재고 N인 상품에 N개를 주문해 재고가 0이 되는지, N+1을 주문하면 409가 나는지 확인.

**Acceptance Scenarios**:

1. **Given** 재고가 충분한 상품, **When** 주문하면, **Then** 201이며 각 상품 재고가 주문 수량만큼 감소한다.
2. **Given** 재고가 부족한 상품, **When** 주문하면, **Then** 409이며 주문은 생성되지 않고 재고도 바뀌지 않는다.

---

### User Story 2 - Cancel and restore stock (Priority: P2)

주문을 취소하면 차감했던 재고가 복원된다.

**Why this priority**: 취소는 소비한 재고를 되돌려야 정합성이 유지된다.

**Independent Test**: 주문 후 취소해 재고가 원래 값으로 돌아오는지 확인.

**Acceptance Scenarios**:

1. **Given** pending 주문, **When** 취소하면, **Then** 200이며 status가 `cancelled`가 되고 재고가 복원된다.
2. **Given** 존재하지 않는 주문, **When** 취소하면, **Then** 404.
3. **Given** 이미 취소된 주문, **When** 다시 취소하면, **Then** 409이며 재고는 바뀌지 않는다.

### Edge Cases

- 재고 부족 → 409 (아무 재고도 바뀌지 않음).
- 같은 상품이 여러 item에 → 합산 수량으로 재고 확인.
- 없는 주문 취소 → 404, 이미 취소된 주문 재취소 → 409.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On order creation, System MUST verify sufficient stock for all items first, then decrement each product's stock by the ordered quantity. If any item is insufficient, reject with 409 and change nothing. *(Amends feature 002 Create Order.)*
- **FR-002**: System MUST aggregate quantities per product across duplicate items for the stock check.
- **FR-003**: System MUST cancel a pending order via `POST /orders/:id/cancel`: set status to "cancelled" and restore the consumed stock (200).
- **FR-004**: Cancelling a non-existent order returns 404; cancelling an already-cancelled order returns 409 and changes no stock.
- **FR-005**: Order status MUST be one of `"pending" | "cancelled"`.

### Key Entities *(include if feature involves data)*

- **Order**: extends feature 002's Order by allowing status `"cancelled"` in addition to `"pending"`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After an order, each product's stock decreases by exactly the ordered quantity.
- **SC-002**: Insufficient stock returns 409 and leaves all stock unchanged.
- **SC-003**: Cancelling a pending order restores stock to its pre-order value.
- **SC-004**: Re-cancelling returns 409 and does not change stock.

## Assumptions

- Extends feature 002 (order-management); the same order and product stores are used.
- Single process; check-then-deduct is treated as atomic.
- No payment/refund flow beyond restoring stock.

## Relationship to feature 002 *(methodology note)*

This feature **changes the behavior** of `POST /orders` from 002 (adds stock deduction) and **adds** `POST /orders/:id/cancel`. In Spec Kit there is no delta file — this feature's spec is a **full specification of the new behavior**, while 002's spec remains as the historical record of the pre-stock version. Contrast with OpenSpec, which expresses the same change as a **MODIFIED delta** that rewrites the original requirement in place and merges into a single living spec at archive time.
