# Tasks: Multi-Seller Order & Split

**Feature**: 004-multiseller-order | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 2: Foundational (store 확장)
- [x] T001 `src/store.ts`에 `Seller`·`SellerStore`(status "승인대기"|"승인"|"정지", `canSell`), `Inventory`·`InventoryStore`(quantity·reserved, `reserve`/`release`/`available`), `SubOrder`·`SubOrderStore`(orderId·sellerId·subtotal·status "결제대기"|"취소됨") 인터페이스와 인메모리 구현 추가. `Product`에 `sellerId` 필드 추가. `Order.status`에 "취소됨" 허용, `OrderStore`가 buyerId·subtotal 없는 멀티셀러 Order를 만들 수 있게 확장(기존 003 시그니처는 유지).

## Phase 3: User Story 1 — Place a multi-seller order (P1)
- [x] T002 [P] [US1] 테스트 작성: 판매자 A·B 상품 2개 주문 → SubOrder 2개, 각 subtotal=Σ(가격×수량), order.total=Σsubtotal, 201 (FR-001·FR-002, SC-001·SC-002). 한 판매자만 → SubOrder 1개.
- [x] T003 [P] [US1] 테스트 작성(실패 경로): 빈 items→400, quantity<1→400, 미존재 상품→404(미생성), 미승인 판매자→400 (FR-004·FR-005).
- [x] T004 [US1] `src/multiseller-orders.ts` `POST /marketplace/orders`: 구조 400 → 참조 404 → 판매자 승인 400 → sellerId 그룹핑·SubOrder 분할·서버 subtotal/total 계산. SubOrder.status="결제대기", order.status="pending" (FR-001·002·004·005·006).
- Checkpoint: **US1 독립 테스트 가능 — 판매자별 분할·서버 총액**

## Phase 4: User Story 2 — Reserve stock before payment (P1)
- [x] T005 [P] [US2] 테스트 작성: 충분 재고 주문 시 항목 수량만큼 reserved 증가·201; 한 항목 부족 시 409이며 어떤 것도 reserve·생성 안 됨(원자적); 취소 시 release되어 available 복원 (FR-003·FR-007, SC-003·SC-004).
- [x] T006 [US2] `POST /marketplace/orders`에 재고 로직 통합: 필요 수량 집계 → 전량 available 확인(부족 시 409, 무선점) → 전량 reserve. `POST /marketplace/orders/:id/cancel`: release + SubOrder/order status="취소됨" (FR-003·FR-006·FR-007).
- Checkpoint: **US2 독립 테스트 가능 — 결제 전 선점·원자적 롤백·취소 복원**

## Phase 5: Polish
- [x] T007 전체 vitest 스위트 통과 확인(기존 001~003 무회귀) + 도메인 용어 다이어그램 일치 점검.

## Dependencies & Execution Order
- Foundational(T001) → US1(T002–4) → US2(T005–6) → Polish(T007).
- 001~003을 계승하되 새 라우트로 신설한다(기존 경로 무변경, 회귀 제로).
