# Feature Specification: Shipping & Delivery

**Feature Branch**: `006-shipping`

**Created**: 2026-07-12

**Status**: Draft

**Input**: User description: "A seller accepts a paid SubOrder and hands it to a carrier; the carrier updates status; markDelivered transitions the SubOrder to 배송완료, which opens it for settlement."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ship a sub-order (Priority: P1)

판매자가 결제완료된 SubOrder를 수락하고 배송사에 접수하면 배송이 시작되고, 배송 완료 시 정산 대상이 된다.

**Why this priority**: 배송 완료가 정산의 트리거(원칙 IX)라, 정산(007) 전에 반드시 필요하다.

**Independent Test**: 결제완료 SubOrder를 수락→배송접수→markDelivered로 진행해 상태가 "배송완료"가 되고 정산 큐에 등록되는지 확인.

**Acceptance Scenarios**:

1. **Given** "결제완료" SubOrder, **When** 판매자가 수락하면, **Then** SubOrder.status="수락됨" (200).
2. **Given** "수락됨" SubOrder, **When** 배송사가 접수하면, **Then** Shipment가 status="배송중"으로 생성되고 SubOrder.status="배송중".
3. **Given** "배송중" Shipment, **When** markDelivered하면, **Then** Shipment.status="완료", SubOrder.status="배송완료", 정산 큐에 등록.
4. **Given** "결제대기"(미결제) SubOrder, **When** 수락하면, **Then** 409.

---

### User Story 2 - Track shipment (Priority: P2)

배송사가 배송 상태를 갱신하고 조회한다.

**Acceptance Scenarios**:

1. **Given** 진행 중 Shipment, **When** 상태를 조회하면, **Then** 현재 status가 반환된다 (200).
2. **Given** 없는 SubOrder, **When** 배송 처리하면, **Then** 404.

### Edge Cases

- 미결제 SubOrder 수락 → 409.
- 없는 SubOrder 배송 처리 → 404.
- 이미 배송완료된 건 재-markDelivered → 멱등(중복 정산 등록 없음).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow accepting only "결제완료" SubOrders (otherwise 409).
- **FR-002**: On carrier pickup, System MUST create a Shipment and set SubOrder.status="배송중".
- **FR-003**: markDelivered MUST set Shipment.status="완료", SubOrder.status="배송완료", and register the SubOrder for settlement (원칙 IX 트리거).
- **FR-004**: A repeated markDelivered MUST be idempotent (no duplicate settlement registration).
- **FR-005**: System MUST return 404 for shipping actions on an unknown SubOrder.

### Key Entities *(include if feature involves data)*

- **Shipment**: id, subOrderId, carrierId, status ("접수" | "배송중" | "완료"), deliveredAt.
- **SubOrder**: status transitions "결제완료" → "수락됨" → "배송중" → "배송완료".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A SubOrder enters the settlement queue only after "배송완료".
- **SC-002**: markDelivered is idempotent.
- **SC-003**: Accepting an unpaid SubOrder is rejected (409).

## Assumptions

- SubOrders come from feature 004/005 in "결제완료".
- Carrier is simulated in-process.
- Settlement (007) reads the queue this feature populates.
