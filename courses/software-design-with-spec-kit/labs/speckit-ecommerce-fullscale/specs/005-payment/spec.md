# Feature Specification: Payment (Idempotent)

**Feature Branch**: `005-payment`

**Created**: 2026-07-12

**Status**: Draft

**Input**: User description: "Authorize payment for an order (one charge per order), void on cancellation, with an idempotency key so retries never double-charge or double-refund. Successful payment confirms the reserved stock."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authorize a payment (Priority: P1)

구매자가 결제대기 상태의 주문을 결제하면, 서버가 주문 총액으로 결제를 승인하고 SubOrder들을 "결제완료"로 전환한다.

**Why this priority**: 결제는 재고 선점을 실제 매출로 확정하는 단계. 주문 분할(004) 다음의 핵심.

**Independent Test**: 결제대기 주문에 idempotencyKey로 결제를 요청해 승인되고 상태가 전환되는지 확인.

**Acceptance Scenarios**:

1. **Given** "결제대기" 주문과 idempotencyKey, **When** 결제하면, **Then** Payment가 "승인"으로 생성되고 각 SubOrder.status가 "결제완료"가 되며 200/201.
2. **Given** 이미 결제된 주문에 **같은 idempotencyKey**, **When** 다시 결제 요청하면, **Then** 중복 승인 없이 원래 결과가 반환된다 (멱등).
3. **Given** 존재하지 않는 주문, **When** 결제하면, **Then** 404.
4. **Given** 이미 취소된 주문, **When** 결제하면, **Then** 409.

---

### User Story 2 - Void a payment (Priority: P2)

배송 전 취소 시 결제를 취소(void)하고 선점 재고를 release한다.

**Independent Test**: 결제된 주문을 배송 전 취소해 void되고 재고가 복원되는지 확인.

**Acceptance Scenarios**:

1. **Given** "결제완료" SubOrder(배송 전), **When** 취소하면, **Then** Payment가 void되고 재고 release, SubOrder.status="환불중"→"환불완료" 경로 진입.
2. **Given** 이미 void된 결제에 같은 key, **When** 다시 void하면, **Then** 중복 환불 없이 원래 결과 반환 (멱등).

### Edge Cases

- 없는 주문 결제/취소 → 404.
- 취소된 주문 결제 → 409.
- 같은 idempotencyKey 재시도 → 원 결과 반환, 부작용 없음.
- 배송 완료 후 void 시도 → 409 (환불 경로는 008에서 처리).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST authorize a payment for the order total, keyed by an idempotencyKey (Order 단위 1회 청구).
- **FR-002**: A repeated authorize with the same idempotencyKey MUST return the original result without a second charge (idempotent).
- **FR-003**: On successful authorize, System MUST transition each SubOrder from "결제대기" to "결제완료".
- **FR-004**: System MUST void a payment before shipping, releasing reserved stock, keyed idempotently.
- **FR-005**: System MUST return 404 for an unknown order, 409 for authorizing a cancelled order or voiding a delivered one.

### Key Entities *(include if feature involves data)*

- **Payment**: id, orderId, idempotencyKey (unique), amount, status ("승인" | "void").
- **SubOrder**: status transitions "결제대기" → "결제완료" (auth) / → "환불중" (void).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authorizing the same order twice with the same key charges once.
- **SC-002**: A successful payment moves every SubOrder of the order to "결제완료".
- **SC-003**: Voiding before shipping releases exactly the reserved quantities.

## Assumptions

- Orders come from feature 004 (multiseller-order) in "결제대기".
- An external payment gateway is simulated in-process (no real PG).
- Settlement (007) and refund (008) build on the "결제완료" / void states set here.
