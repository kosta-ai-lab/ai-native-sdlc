# Feature Specification: Multi-Seller Order & Split

**Feature Branch**: `004-multiseller-order`

**Created**: 2026-07-12

**Status**: Draft

**Input**: User description: "A single order may contain products from multiple sellers. On creation, split the order into one SubOrder per seller, reserve stock before payment, and compute per-seller subtotals with a server-authoritative order total."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Place a multi-seller order (Priority: P1)

구매자가 여러 판매자의 상품을 한 주문에 담아 주문하면, 서버가 판매자별 SubOrder로 분할하고 각 SubOrder의 subtotal과 주문 총액을 계산한다.

**Why this priority**: 멀티셀러 분할은 이후 배송·정산·환불이 모두 딛는 토대다. 이것만으로 "여러 판매자 상품을 한 번에 주문한다"는 가치를 독립적으로 제공한다.

**Independent Test**: 서로 다른 판매자의 상품 2개로 주문을 넣어, SubOrder가 판매자 수만큼 생기고 각 subtotal 합이 주문 총액과 같은지 확인.

**Acceptance Scenarios**:

1. **Given** 판매자 A·B의 상품들, **When** 두 판매자 상품을 한 주문에 담아 주문하면, **Then** SubOrder가 판매자별로 2개 생성되고 각 subtotal이 (상품가 × 수량)의 합이며 order.total은 subtotal들의 합이고 201.
2. **Given** 한 판매자의 상품만, **When** 주문하면, **Then** SubOrder 1개가 생성된다 (201).
3. **Given** 빈 items 목록, **When** 주문하면, **Then** 거부된다 (400).
4. **Given** 존재하지 않는 상품 참조, **When** 주문하면, **Then** 404이며 주문·SubOrder 모두 생성되지 않는다.

---

### User Story 2 - Reserve stock before payment (Priority: P1)

주문 생성 시 각 항목의 재고를 선점(reserve)하여, 결제 전에 재고를 확보한다.

**Why this priority**: 오버셀 방지는 마켓플레이스 신뢰의 핵심. 분할과 함께 P1.

**Independent Test**: 재고가 부족한 상품을 포함해 주문하면 409가 나고 아무 것도 선점·생성되지 않는지 확인.

**Acceptance Scenarios**:

1. **Given** 재고가 충분한 상품들, **When** 주문하면, **Then** 각 항목 수량만큼 reserved가 증가하고 주문이 생성된다 (201).
2. **Given** 한 항목이라도 재고 부족, **When** 주문하면, **Then** 409이며 그 주문의 어떤 항목도 선점되지 않는다 (all-or-nothing).
3. **Given** 선점된 주문을 취소, **When** 취소하면, **Then** 선점 수량이 release되어 available로 복원된다.

### Edge Cases

- 빈 items 또는 quantity < 1 → 400.
- 존재하지 않는 상품 참조 → 404 (미생성).
- 한 항목이라도 재고 부족 → 409, 부분 선점 없음(원자적).
- 승인되지 않은(status ≠ 승인) 판매자의 상품 → 400.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST split an order into one SubOrder per distinct seller referenced by its items.
- **FR-002**: System MUST compute each SubOrder.subtotal as the sum of (product price × quantity) for that seller's items, and order.total as the sum of all subtotals (server authority).
- **FR-003**: System MUST reserve stock for every item before creating the order; if any item's stock is insufficient, it MUST return 409 and reserve/create nothing (atomic).
- **FR-004**: System MUST reject an empty items list or quantity < 1 (400), and return 404 for a non-existent product, creating nothing.
- **FR-005**: System MUST reject items whose seller is not in "승인" status (400).
- **FR-006**: System MUST set each SubOrder.status to "결제대기" and order.status to "pending" on creation.
- **FR-007**: On order cancellation before payment, System MUST release all reserved stock and set SubOrder.status to "취소됨".

### Key Entities *(include if feature involves data)*

- **Order**: id, buyerId, total (integer cents), status ("pending"). Groups SubOrders.
- **SubOrder**: id, orderId, sellerId, subtotal, status ("결제대기" | "취소됨" | ...).
- **OrderItem**: subOrderId, productId, unitPrice, quantity (≥ 1).
- **Inventory**: productId, quantity, reserved. `reserve(qty)` / `release(qty)`.
- **Seller**: id, status ("승인대기" | "승인" | "정지"), commissionRate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An order with N distinct sellers produces exactly N SubOrders.
- **SC-002**: order.total equals the sum of all SubOrder.subtotals, which equals the sum of (price × quantity) over all items.
- **SC-003**: Insufficient stock on any item returns 409 with nothing reserved or created.
- **SC-004**: Cancelling an unpaid order restores reserved stock to available.

## Assumptions

- Products, sellers, inventory come from features 001 (catalog) + this feature's seller/inventory extension; the same in-memory store is shared.
- Payment is feature 005 — here orders stop at "결제대기".
- Shipping (006), settlement (007), refund (008) are out of scope for this feature.
