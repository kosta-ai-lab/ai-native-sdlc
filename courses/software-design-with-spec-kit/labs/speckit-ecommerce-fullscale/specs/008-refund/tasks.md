# Tasks: Refund & Reversal

**Feature**: 008-refund | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 2: Foundational (store 확장 · 005 헬퍼 추출)
- [x] T001 `src/store.ts`에 `Refund`(id·subOrderId·paymentId·amount·reason)·`RefundStore`(create·get·getBySubOrder) 인터페이스와 인메모리 구현 추가. `SubOrderStatus`에 "환불완료" 추가(상태머신 정본과 일치, "환불중"은 005 기존, 004~007 시그니처 유지).
- [x] T002 `src/multiseller-payments.ts`에서 배송 전 취소(void)의 SubOrder 단위 부작용을 순수 헬퍼 `voidPreDeliverySubOrder(payments, subOrders, inventory, subOrder)`로 추출·export. 005 void 라우트는 이 헬퍼를 SubOrder마다 호출하도록 리팩터(동작 불변, 005 테스트 무회귀). payment void는 status 가드로 반복 호출에 안전(멱등).

## Phase 3: User Story 1 — Refund before delivery (P1)
- [x] T003 [P] [US1] 테스트 작성(배송 전 환불·멱등·404): 배송 전 "결제완료" SubOrder 환불 → 결제 void·재고 release·status="환불완료"(FR-001, SC-001); 없는 SubOrder → 404; 같은 환불 재요청 → 중복 부작용 없이 원 결과(멱등, FR-005·SC-003).
- [x] T004 [US1] `src/marketplace-refund.ts` 구현 시작: `POST /marketplace/suborders/:id/refund` — 404 검사, `getBySubOrder` 선조회 멱등, 배송 전(`결제완료`) 분기에서 `voidPreDeliverySubOrder` 호출 후 "환불완료" 전이, Refund 기록.
- Checkpoint: **US1 독립 테스트 가능 — 배송 전 환불(005 void 재사용)·멱등·404**

## Phase 4: User Story 2 — Refund after delivery / after settlement (P2)
- [x] T005 [P] [US2] 테스트 작성(배송 후·정산완료 환불): 배송완료·정산 전 SubOrder 환불 → 정산 큐(listByStatus('배송완료'))에서 제외·status="환불완료"(FR-002); 정산완료 SubOrder 환불 → 007 역산 예약되어 차기 run에서 차감·status="환불완료"(FR-002·003, 007 연동).
- [x] T006 [US2] 환불 라우트에 배송완료 분기(정산 큐 제외 전이)와 정산완료 분기(`reverseSettledSubOrder` 호출) 추가. 세 갈래 공통 최종 상태 "환불완료".
- Checkpoint: **US2 독립 테스트 가능 — 배송 후 정산 큐 제외·정산완료 역산(007 재사용)**

## Phase 5: 부분 환불·검증 & Polish
- [x] T007 [P] 테스트 작성(부분환불·400): body `amount`로 부분 환불 → 그 금액만 Refund에 기록; `amount > subtotal` 또는 `amount <= 0` → 400(FR-004).
- [x] T008 환불 라우트에 amount 파싱·검증(전액 기본, 초과·비정상 400) 반영. `src/index.ts`에 환불 라우트 wiring(payment·subOrder·inventory·settlement·seller store 공유). 전체 vitest 통과(001~007 무회귀) + `pnpm build`(tsc strict) 통과 + 상태명·필드명 다이어그램 일치 점검.

## Dependencies & Execution Order
- Foundational(T001–2) → US1(T003–4) → US2(T005–6) → 부분환불·Polish(T007–8).
- **재사용 원칙(핵심)**: 배송 전 환불은 005의 `voidPreDeliverySubOrder`(추출한 단일 지점), 정산완료 환불은 007의 `reverseSettledSubOrder`를 호출한다 — 두 로직을 008에서 재구현하지 않는다.
- 정산 전 환불 분기는 상태 전이 한 번뿐 — 정산 큐가 `listByStatus('배송완료')`로 표현되므로 큐를 직접 조작하지 않는다(원칙 IX).
- 멱등의 축은 `RefundStore.getBySubOrder` 선조회 — 부작용 전에 이미 환불된 건을 걸러 원 결과를 반환한다.
- 007 라우트는 무변경, 005 라우트는 헬퍼 추출로만 변경(동작 불변) — 회귀를 구조로 차단한다.
