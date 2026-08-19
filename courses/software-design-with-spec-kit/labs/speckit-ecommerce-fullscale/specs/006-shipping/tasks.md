# Tasks: Shipping & Delivery

**Feature**: 006-shipping | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 2: Foundational (store 확장)
- [x] T001 `src/store.ts`에 `Shipment`(id·subOrderId·carrierId·status "접수"|"배송중"|"완료"·deliveredAt)·`ShipmentStore`(`create`, `get`, `getBySubOrder`, `markDelivered`) 인터페이스와 인메모리 구현 추가. `SubOrderStatus`에 "수락됨"·"배송중"·"배송완료" 추가(상태머신 다이어그램 정본과 일치, 004/005 시그니처는 유지). `SubOrderStore`에 정산 큐 노출용 `listByStatus(status)` 추가.

## Phase 3: User Story 1 — Ship a sub-order (P1)
- [x] T002 [P] [US1] 테스트 작성: 결제완료 SubOrder를 수락 → "수락됨"(200)(FR-001); 배송 접수 → Shipment "배송중" 생성·SubOrder "배송중"(FR-002); markDelivered → Shipment "완료"·SubOrder "배송완료"·정산 큐 등록(FR-003, SC-001). 정산 큐는 `listByStatus('배송완료')`로 확인.
- [x] T003 [P] [US1] 테스트 작성(멱등·실패 경로): **markDelivered 2회 → 정산 큐 중복 없음**(원 결과 반환)(FR-004, SC-002); 미결제(결제대기) SubOrder 수락 → 409(FR-001, SC-003); 없는 SubOrder 배송 처리 → 404(FR-005).
- [x] T004 [US1] `src/marketplace-shipping.ts` 구현: `POST /marketplace/suborders/:id/accept`(결제완료만 허용, 아니면 409 → "수락됨"), `POST /marketplace/suborders/:id/ship`(Shipment 생성·"배송중"), `POST /marketplace/shipments/:id/deliver`(markDelivered → "배송완료"·정산 큐, 멱등)(FR-001~005).
- Checkpoint: **US1 독립 테스트 가능 — 수락·배송·배송완료·정산 큐 등록·멱등**

## Phase 4: User Story 2 — Track shipment (P2)
- [x] T005 [P] [US2] 테스트 작성: 진행 중 Shipment 조회 → 현재 status 반환(200); 없는 Shipment 조회 → 404 (FR-005).
- [x] T006 [US2] `GET /marketplace/shipments/:id`(없으면 404) 구현.
- Checkpoint: **US2 독립 테스트 가능 — 배송 상태 조회**

## Phase 5: Polish
- [x] T007 `src/index.ts`에 배송 라우트 wiring(subOrder store 공유). 전체 vitest 스위트 통과(001~005 무회귀) + `pnpm build`(tsc strict) 통과 + 상태명 다이어그램 일치 점검.

## Dependencies & Execution Order
- Foundational(T001) → US1(T002–4) → US2(T005–6) → Polish(T007).
- 005를 계승하되 새 라우트 파일로 신설한다(005 라우트 무변경, 회귀 제로).
- 멱등의 축은 **SubOrder.status 검사** — markDelivered는 이미 "배송완료"면 부작용 없이 원 결과를 반환한다. 정산 큐가 곧 status이므로 중복 등록이 구조적으로 불가능하다.
