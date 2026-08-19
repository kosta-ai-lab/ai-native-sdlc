# Implementation Plan: Multi-Seller Order & Split

**Branch**: `004-multiseller-order` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

## Summary

단일 판매자 주문을 멀티셀러 주문으로 확장한다. 주문 생성 시 서버가 판매자별 SubOrder로 분할하고, 각 SubOrder.subtotal과 order.total을 서버 권위로 계산한다. 결제 전에 재고를 선점(reserve)하며, 한 항목이라도 부족하면 409로 아무것도 만들지 않는다(원자적). 취소 시 선점 재고를 release하고 SubOrder를 "취소됨"으로 바꾼다.

## Technical Context

**Language/Version**: TypeScript, Node.js (ESM)
**Primary Dependencies**: Hono
**Storage**: in-memory (Seller·Inventory·SubOrder store를 신설, 기존 Product store와 공유)
**Testing**: vitest
**Project Type**: Single project (API)
**Constraints**: 재고 확인→선점을 원자적으로(단일 프로세스). 기존 001~003 라우트·테스트 무회귀.

## Data Model (요약)

도메인 모델·ERD·상태머신 다이어그램을 정본으로 삼아 엔티티/상태명을 일치시킨다.

- **Seller**: `id`, `name`, `status`("승인대기"|"승인"|"정지"), `commissionRate`. `canSell()` = status === "승인".
- **Inventory**: `productId`(키), `quantity`, `reserved`. `reserve(qty)`는 `quantity - reserved >= qty`일 때만 성공(available 개념), `release(qty)`는 reserved를 되돌린다.
- **Order**: `id`, `buyerId`, `total`(정수 cents), `status`("pending"|"취소됨"). SubOrder들을 묶는다.
- **SubOrder**: `id`, `orderId`, `sellerId`, `subtotal`, `status`("결제대기"|"취소됨"). 배송·정산의 단위(Constitution VI).
- **OrderItem**: `productId`, `unitPrice`, `quantity`(≥1). SubOrder에 속한다(판매자별로 묶임).

기존 `Product`에 `sellerId`를 더한다(도메인 모델: Seller "1"→"\*" Product). `Product.stock`(기능 003)은 그대로 두고, 기능 004는 별도 `Inventory`를 재고 권위로 쓴다.

## 접근 방식

- **분리 신설**: 기능 003의 `POST /orders`(Product.stock 차감)를 건드리지 않는다. 멀티셀러 주문은 새 라우트 `POST /marketplace/orders`로 신설하고, Inventory를 재고 권위로 쓴다. 기존 orders.ts·store.ts의 003 경로는 무변경 → 회귀 제로.
- **검증 순서**(명시적 에러, Constitution IV): (1) 구조 400(빈 items·quantity<1) → (2) 상품 참조 404 → (3) 판매자 승인 400 → (4) 재고 확인 409(전량 선확인) → (5) 선점·SubOrder 분할·저장.
- **원자성**(Constitution VII): productId별 필요 수량을 집계한 뒤, 모든 항목의 가용 재고를 먼저 확인한다. 하나라도 부족하면 409를 반환하고 어떤 reserve도 하지 않는다. 전량 통과 후에만 일괄 reserve → 부분 선점 불가능.
- **분할**(Constitution VI): 통과한 items를 sellerId로 그룹핑해 SubOrder를 판매자 수만큼 만든다. 각 SubOrder.subtotal = Σ(unitPrice × quantity), order.total = Σ subtotal(서버 계산, Constitution V).
- **취소**(FR-007): order의 각 SubOrder items를 release하고, SubOrder.status="취소됨", order.status="취소됨"으로 바꾼다.

## Constitution Check

*GATE.* 관련 원칙을 어떻게 지키는지 명시.

- **III. Thin, Swappable Storage** ✓ — Seller/Inventory/SubOrder를 각각 인터페이스(`SellerStore`·`InventoryStore`·`SubOrderStore`)로 정의하고 라우트는 인터페이스에만 의존. 인메모리 구현은 교체 가능.
- **IV. Explicit Errors** ✓ — 빈 items/quantity<1/미승인 판매자 400, 미존재 상품 404, 재고 부족 409. 모두 `{ error: string }` 본문. 500·묵살 없음.
- **V. Server Authority** ✓ — subtotal·total·재고 변화는 서버가 계산. 클라이언트가 보낸 total/subtotal은 무시(요청 스키마에 없음).
- **VI. Sub-Order as the Unit of Fulfillment** ✓ — 주문을 판매자별 SubOrder로 분할, 상태(결제대기/취소됨)는 SubOrder에 둔다. 결제는 Order 단위(향후 기능 005), 이행 상태는 SubOrder 단위.
- **VII. Reserve Before Pay** ✓ — 결제 이전 주문 생성 시점에 reserve. 부족 시 409·미생성. 취소는 release. (결제 승인은 기능 005 범위.)

기타 계승 원칙: I(Spec-Driven) spec 선행, II(Test-First) 각 FR에 테스트, VIII·IX(결제·정산)는 이 기능 범위 밖.

## Project Structure

### Source Code (repository root)
```text
src/
├── store.ts                  # Product에 sellerId 추가, Seller·Inventory·SubOrder 엔티티·스토어 신설
├── multiseller-orders.ts     # POST /marketplace/orders 분할·reserve·409, POST /marketplace/orders/:id/cancel
├── index.ts                  # 새 store 4종 배선, /marketplace 라우트 마운트
└── multiseller-orders.test.ts # FR-001~007 + 실패 경로(400/404/409) 테스트
```
**Structure Decision**: 기존 001~003을 계승·확장한다. `store.ts`는 추가만(기존 타입 무변경, Product에 optional-free `sellerId`는 신규 판매자용 create 경로로만 들어감), 새 라우트 파일 1개·테스트 1개를 더한다.

## Complexity Tracking

위반 없음 — 비움.
