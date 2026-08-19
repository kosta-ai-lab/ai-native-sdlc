# Feature Specification: Refund & Reversal

**Feature Branch**: `008-refund`

**Created**: 2026-07-12

**Status**: Draft

**Input**: User description: "Refund a SubOrder (full or partial). Before delivery: void payment and release stock. After delivery: process a return and reverse settlement if already settled."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Refund before delivery (Priority: P1)

배송 전 결제완료 SubOrder를 환불하면 결제를 취소하고 선점 재고를 복원한다.

**Why this priority**: 취소 역흐름은 재고·결제 정합의 핵심. 환불의 가장 흔한 경로.

**Independent Test**: 배송 전 결제완료 SubOrder를 환불해 결제 void + 재고 release + status="환불완료"가 되는지 확인.

**Acceptance Scenarios**:

1. **Given** 배송 전 "결제완료" SubOrder, **When** 환불하면, **Then** 결제가 void(멱등)되고 재고가 release되며 SubOrder.status="환불완료" (200).
2. **Given** 존재하지 않는 SubOrder, **When** 환불하면, **Then** 404.
3. **Given** 이미 환불된 SubOrder, **When** 같은 환불을 재요청하면, **Then** 중복 없이 원래 결과 반환 (멱등).

---

### User Story 2 - Refund after delivery / after settlement (Priority: P2)

배송 완료 또는 정산 완료된 SubOrder를 환불하면 정산을 역산 경로로 처리한다.

**Independent Test**: 정산완료 SubOrder를 환불해 차기 정산에서 역산되는지 확인(007과 연동).

**Acceptance Scenarios**:

1. **Given** "배송완료"·정산 전 SubOrder, **When** 반품 환불하면, **Then** 정산 큐에서 제외되고 status="환불완료".
2. **Given** "정산완료" SubOrder, **When** 환불하면, **Then** 차기 정산 주기에 역산(차감)으로 반영된다 (007 FR-005 연동).

### Edge Cases

- 없는 SubOrder → 404.
- 이미 환불된 건 재요청 → 멱등(부작용 없음).
- 부분 환불 금액이 subtotal 초과 → 400.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A pre-delivery refund MUST void the payment (idempotent) and release reserved stock.
- **FR-002**: A post-delivery refund MUST route to settlement reversal (remove from queue if unsettled; reverse in next cycle if settled).
- **FR-003**: An already-settled SubOrder's refund MUST be deducted in the next settlement cycle (delegates to 007).
- **FR-004**: Partial refunds MUST apply only the requested amount; an amount exceeding subtotal returns 400.
- **FR-005**: System MUST return 404 for an unknown SubOrder and be idempotent on repeated refunds.

### Key Entities *(include if feature involves data)*

- **Refund**: id, subOrderId, paymentId, amount, reason.
- **SubOrder**: status transitions → "환불중" → "환불완료".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A pre-delivery refund restores reserved stock and voids the charge exactly once.
- **SC-002**: A settled refund keeps cumulative payout consistent via reversal.
- **SC-003**: Repeated refund requests are idempotent.

## Assumptions

- Payment states come from feature 005; settlement reversal is handled by feature 007.
- Refund of a fully-shipped multi-item SubOrder is treated at SubOrder granularity for this scope.
