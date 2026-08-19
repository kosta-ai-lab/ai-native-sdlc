# Feature Specification: Settlement (Per-Seller, Delivery-Triggered)

**Feature Branch**: `007-settlement`

**Created**: 2026-07-12

**Status**: Draft

**Input**: User description: "In a settlement cycle, aggregate delivered SubOrders per seller, deduct commission (netPayout = gross − commission), and pay out. Refunds reverse already-settled amounts in the next cycle."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Settle delivered sub-orders (Priority: P1)

정산 주기에 배송 완료된 SubOrder를 판매자별로 집계하고, 수수료를 공제해 순지급액을 산출한다.

**Why this priority**: 정산은 멀티셀러 마켓플레이스의 정산 정합성을 실현하는 최종 단계이자 이 장의 설계 하이라이트다.

**Independent Test**: 판매자 A의 배송완료 SubOrder 2건을 정산 집계해 gross·commission·netPayout이 규칙대로 계산되는지 확인.

**Acceptance Scenarios**:

1. **Given** 판매자 A의 "배송완료" SubOrder들, **When** 정산을 집계하면, **Then** Settlement가 gross=subtotal 합, commission=gross×rate, netPayout=gross−commission으로 생성되고 각 SubOrder.status="정산완료".
2. **Given** 배송되지 않은 SubOrder, **When** 집계하면, **Then** 정산 대상에서 제외된다.
3. **Given** 여러 판매자의 배송완료 건, **When** 집계하면, **Then** 판매자별로 각각 Settlement가 생성된다.

---

### User Story 2 - Reverse settled amount on refund (Priority: P2)

이미 정산 완료된 건에 환불이 발생하면 차기 정산 주기에 역산(차감)한다.

**Independent Test**: 정산완료 SubOrder에 환불을 발생시키고 차기 집계에서 차감 항목이 반영되는지 확인.

**Acceptance Scenarios**:

1. **Given** "정산완료" SubOrder에 환불, **When** 차기 정산을 집계하면, **Then** 해당 금액이 역산(차감) 항목으로 반영되어 총 지급액이 정합한다.

### Edge Cases

- 배송 안 된 SubOrder → 정산 제외.
- commissionRate 0 → netPayout = gross.
- 정산 대상 없음 → 빈 Settlement 생성 안 함(또는 0건 반환).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST aggregate only "배송완료" SubOrders (원칙 IX).
- **FR-002**: System MUST group by seller; gross = sum of that seller's SubOrder subtotals.
- **FR-003**: System MUST compute commission = gross × seller.commissionRate and netPayout = gross − commission (server authority).
- **FR-004**: Aggregated SubOrders MUST be recorded as settlement_items and set to "정산완료".
- **FR-005**: A refund on an already-settled SubOrder MUST be reversed (deducted) in the next cycle.

### Key Entities *(include if feature involves data)*

- **Settlement**: id, sellerId, period, grossAmount, commission, netPayout.
- **SettlementItem**: id, settlementId, subOrderId (± reversal marker).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: netPayout always equals gross − commission for each settlement.
- **SC-002**: Only delivered SubOrders are settled.
- **SC-003**: After a refund on a settled item, cumulative payout stays consistent via reversal.

## Assumptions

- The settlement queue is populated by feature 006 (shipping, markDelivered).
- Refund events come from feature 008.
- Payout to an external banking system is simulated in-process.
