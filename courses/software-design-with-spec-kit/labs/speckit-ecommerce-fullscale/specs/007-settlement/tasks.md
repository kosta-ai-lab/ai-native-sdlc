# Tasks: Settlement (Per-Seller, Delivery-Triggered)

**Feature**: 007-settlement | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Phase 2: Foundational (store 확장)
- [x] T001 `src/store.ts`에 `Settlement`(id·sellerId·period·grossAmount·commission·netPayout·itemIds)·`SettlementItem`(id·settlementId·subOrderId·amount·reversal)·`SettlementStore` 인터페이스와 인메모리 구현 추가. `SubOrderStatus`에 "정산대상"·"정산완료" 추가(상태머신 다이어그램 정본과 일치, 004~006 시그니처는 유지). `SettlementStore`에 역산 훅(`recordReversal`, `pendingReversals`, `consumeReversal`) 포함.

## Phase 3: User Story 1 — Settle delivered sub-orders (P1)
- [x] T002 [P] [US1] 테스트 작성(정산 배치·서버 권위): 판매자 A의 배송완료 SubOrder 2건을 run → gross=subtotal 합·commission=gross×rate·**netPayout=gross−commission**·각 SubOrder="정산완료"(FR-001~004, SC-001); commissionRate 0 → netPayout=gross(Edge). 클라이언트가 보낸 금액이 무시되는지(원칙 V) 확인.
- [x] T003 [P] [US1] 테스트 작성(판매자 분리·미배송 제외): 여러 판매자 배송완료 건 → 판매자별 Settlement 각각 생성(FR-002); 배송 안 된 SubOrder(결제완료·배송중)는 정산 제외(FR-001, SC-002); 정산 대상 없음 → 빈 목록(Edge).
- [x] T004 [US1] `src/marketplace-settlement.ts` 구현: `POST /marketplace/settlements/run`(listByStatus('배송완료') 판매자별 그룹핑·서버 계산·정산완료 전이·settlement_items 기록), `GET /marketplace/settlements`(FR-001~004).
- Checkpoint: **US1 독립 테스트 가능 — 판매자별 집계·netPayout·미배송 제외**

## Phase 4: User Story 2 — Reverse settled amount on refund (P2)
- [x] T005 [P] [US2] 테스트 작성(역산): 정산완료 SubOrder를 recordReversal(또는 POST /settlements/reversals)로 등록 → 차기 run에서 그 판매자 gross/netPayout이 역산 금액만큼 차감되고 음수 SettlementItem(reversal=true) 기록(FR-005, SC-003); 누적 지급액 정합 확인.
- [x] T006 [US2] `POST /marketplace/settlements/reversals` 역산 훅 경로 구현 + `SettlementStore.recordReversal`(008이 함수로 직접 호출 가능). 차기 run이 판매자별 대기 역산을 소비.
- Checkpoint: **US2 독립 테스트 가능 — 환불 역산 반영**

## Phase 5: Polish
- [x] T007 `src/index.ts`에 정산 라우트 wiring(subOrder·seller store 공유). 전체 vitest 스위트 통과(001~006 무회귀) + `pnpm build`(tsc strict) 통과 + 상태명·필드명 다이어그램 일치 점검.

## Dependencies & Execution Order
- Foundational(T001) → US1(T002–4) → US2(T005–6) → Polish(T007).
- 006을 계승하되 새 라우트 파일로 신설한다(006 라우트 무변경, 회귀 제로).
- 정산 큐의 유일한 진실의 원천은 `SubOrderStore.listByStatus('배송완료')` — 별도 큐 목록을 두지 않는다.
- netPayout 서버 권위의 축은 **`run`이 클라이언트 금액을 받지 않는 것** + netPayout을 코드 단일 지점에서만 계산하는 것.
- 역산의 축은 **지연 큐** — `recordReversal`은 등록만, 실제 차감은 차기 `run`이 판매자 그룹 계산에 합산한다.
