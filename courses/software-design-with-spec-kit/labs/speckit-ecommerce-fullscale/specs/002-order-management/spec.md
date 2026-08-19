# Feature Specification: Order Management

**Feature Branch**: `002-order-management`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Order management: create orders that reference existing products, with server-computed totals; list and get orders"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Place an order (Priority: P1)

고객이 상품과 수량을 골라 주문하면, 서버가 총액을 계산해 주문을 만든다.

**Why this priority**: 주문은 판매의 핵심 행위다. 이것만으로 "카탈로그의 상품을 실제로 주문한다"는 가치를 독립적으로 제공한다.

**Independent Test**: 상품을 등록한 뒤 그 상품으로 주문을 넣어 총액과 상태가 맞는지 확인.

**Acceptance Scenarios**:

1. **Given** 등록된 상품들, **When** 상품·수량 목록으로 주문하면, **Then** 총액이 (상품 가격 × 수량)의 합으로 계산되고 status는 `pending`이며 201.
2. **Given** 빈 items 목록, **When** 주문하면, **Then** 거부된다 (400).
3. **Given** quantity가 1 미만인 항목, **When** 주문하면, **Then** 거부된다 (400).
4. **Given** 존재하지 않는 상품을 참조, **When** 주문하면, **Then** 404이며 주문은 생성되지 않는다.

---

### User Story 2 - Review orders (Priority: P2)

운영자가 주문 목록과 개별 주문을 조회한다.

**Why this priority**: 주문 이력 확인. 생성 다음으로 중요하나 생성 없이는 의미가 없어 P2.

**Independent Test**: 주문을 생성한 뒤 목록·단건 조회로 확인.

**Acceptance Scenarios**:

1. **Given** 주문이 여러 개, **When** 목록을 조회하면, **Then** 모든 주문이 반환된다 (200).
2. **Given** 등록된 주문, **When** id로 조회하면, **Then** 해당 주문이 반환된다 (200).
3. **Given** 존재하지 않는 id, **When** 조회하면, **Then** 찾을 수 없음 (404).

### Edge Cases

- 빈 items 또는 quantity < 1 → 400.
- 존재하지 않는 상품 참조 → 404 (주문 미생성).
- 존재하지 않는 주문 조회 → 404.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create an order from a non-empty list of items (each an existing productId with quantity ≥ 1), compute the total from current product prices, set status to "pending", and return it (201).
- **FR-002**: System MUST reject an empty items list or a quantity < 1 (400), creating nothing.
- **FR-003**: System MUST return 404 when an item references a non-existent product, creating nothing.
- **FR-004**: System MUST return all orders on a list request (200).
- **FR-005**: System MUST return a single order by identifier (200), or "not found" (404).
- **FR-006**: The order total MUST be computed by the server; a client-supplied total is ignored (server authority).

### Key Entities *(include if feature involves data)*

- **Order**: identifier, items (OrderItem list), total (integer cents), status ("pending").
- **OrderItem**: productId (references a Product from feature 001), quantity (integer ≥ 1).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An order's total equals the sum of (product price × quantity) over its items.
- **SC-002**: Invalid structure returns 400, an unknown product returns 404, and nothing is created on failure.
- **SC-003**: Created orders are retrievable by list and by id.

## Assumptions

- Products come from feature 001 (product-catalog); the same in-memory store is shared.
- Stock is not decremented yet — that is feature 003 (order-stock-and-cancellation).
- No payment, shipping, or authentication in scope.
