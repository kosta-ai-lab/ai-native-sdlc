# Tasks: Payment (Idempotent)

**Feature**: 005-payment | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 2: Foundational (store 확장)
- [x] T001 `src/store.ts`에 `Payment`(id·orderId·idempotencyKey·amount·status "승인"|"void")·`PaymentStore`(`getByKey`로 멱등 조회, `create`, `void`) 인터페이스와 인메모리 구현 추가. `SubOrderStatus`에 "결제완료"·"환불중" 추가(상태머신 다이어그램 정본과 일치, 004 시그니처는 유지).

## Phase 3: User Story 1 — Authorize a payment (P1)
- [x] T002 [P] [US1] 테스트 작성: 결제대기 주문 + idempotencyKey로 authorize → Payment "승인" 생성·amount=order.total, 모든 SubOrder "결제완료", 200 (FR-001·FR-003, SC-002). 서버가 order.total로 청구(V).
- [x] T003 [P] [US1] 테스트 작성(멱등·실패 경로): **같은 key 2회 authorize → 청구 1회**(Payment 1개, 원래 결과 반환)(FR-002, SC-001); 없는 주문 404, 취소된 주문 authorize 409, idempotencyKey 누락 400 (FR-005).
- [x] T004 [US1] `src/multiseller-payments.ts` `POST /marketplace/orders/:id/pay`: 없는 주문 404 → 취소된 주문 409 → key 누락 400 → `getByKey` 멱등 조회(있으면 원 결과) → Payment 생성·SubOrder "결제완료" 전이 (FR-001·002·003·005).
- Checkpoint: **US1 독립 테스트 가능 — 멱등 결제 승인·상태 전이**

## Phase 4: User Story 2 — Void a payment (P2)
- [x] T005 [P] [US2] 테스트 작성: 결제완료 주문 void → Payment "void", 관련 SubOrder items 재고 release, SubOrder "환불중"(FR-004, SC-003); **같은 key 2회 void → 환불 1회**(원 결과 반환, 재고 중복 release 없음)(FR-004); 없는 결제 404, 배송 완료 건 void 409 (FR-005).
- [x] T006 [US2] `POST /marketplace/payments/:id/void`: 없는 결제 404 → 배송 완료(SubOrder 중 배송 관련 상태) 409 → 이미 void면 원 결과(멱등) → Payment void·재고 release·SubOrder "환불중" (FR-004·005).
- Checkpoint: **US2 독립 테스트 가능 — 배송 전 취소·재고 반납·멱등 void**

## Phase 5: Polish
- [x] T007 `src/index.ts`에 결제 라우트 wiring(subOrder·inventory·marketOrder store 공유). 전체 vitest 스위트 통과(001~004 무회귀) + `pnpm build`(tsc strict) 통과 + 상태명 다이어그램 일치 점검.

## Dependencies & Execution Order
- Foundational(T001) → US1(T002–4) → US2(T005–6) → Polish(T007).
- 004를 계승하되 새 라우트 파일로 신설한다(004 라우트 무변경, 회귀 제로).
- 멱등의 축은 `PaymentStore.getByKey` — authorize/void 모두 부작용 실행 전에 키로 먼저 조회한다.
