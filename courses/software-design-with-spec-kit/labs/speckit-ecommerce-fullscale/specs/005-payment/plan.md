# Implementation Plan: Payment (Idempotent)

**Branch**: `005-payment` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

## Summary

멀티셀러 주문(004)의 "결제대기" SubOrder를 실제 매출로 확정하는 결제 단계를 얹는다. 주문 총액으로 결제를 승인(authorize)하되, `idempotencyKey`를 고유키로 삼아 같은 키의 재요청은 원래 결과를 그대로 돌려준다(중복 청구 없음). 승인 성공 시 그 주문의 모든 SubOrder를 "결제대기"→"결제완료"로 전환한다. 배송 전 취소(void)는 결제를 취소하고 선점 재고를 release하며 SubOrder를 "환불중"으로 바꾼다. void도 같은 키로 멱등하다.

## Technical Context

**Language/Version**: TypeScript, Node.js (ESM)
**Primary Dependencies**: Hono
**Storage**: in-memory. `Payment`·`PaymentStore`를 신설하고, 기존 004의 `SubOrder`·`Inventory`·`MarketOrder` store를 재사용한다.
**Testing**: vitest
**Project Type**: Single project (API)
**Constraints**: 결제는 004 위에 얹는다. 재고 release·SubOrder 상태·주문 조회는 004 store를 그대로 쓴다. 001~004 라우트·테스트 무회귀. 외부 PG는 인메모리로 시뮬레이션(실제 결제사 연동 없음).

## Data Model (요약)

도메인 모델·시퀀스·상태머신 다이어그램을 정본으로 삼아 엔티티/상태명을 일치시킨다.

- **Payment** (신설): `id`, `orderId`, `idempotencyKey`(고유키), `amount`(정수 cents), `status`("승인" | "void"). 한 주문에 대한 1회 청구.
- **PaymentStore** (신설): `idempotencyKey`로 기존 Payment를 조회(`getByKey`)해 멱등을 보장한다. `create`는 새 Payment를, `void`는 상태를 "void"로 바꾼다.
- **SubOrder** (004 재사용, 상태 확장): 상태 전이 "결제대기" → "결제완료"(authorize) / "결제완료" → "환불중"(void). 상태머신 다이어그램의 전이를 그대로 따른다.
- **Inventory** (004 재사용): void 시 SubOrder items의 수량만큼 `release`.
- **MarketOrder** (004 재사용): 취소된 주문(status="취소됨")은 결제 불가(409).

`SubOrderStatus` 타입에 "결제완료"·"환불중"을 추가한다(현재 "결제대기"|"취소됨"만 존재). 상태머신 다이어그램(state-suborder.puml)의 결제대기→결제완료, 결제완료→환불중 전이를 코드로 옮기는 것이므로 정본과 일치한다.

## 접근 방식

- **멱등(VIII)의 구현 축**: `PaymentStore.getByKey(idempotencyKey)`. authorize/void 진입 시 먼저 키로 조회해 **이미 있으면 부작용 없이 원래 결과를 반환**한다. 새 요청일 때만 Payment 생성·상태 전이·재고 변경 같은 부작용을 실행한다. 키가 고유키이므로 재시도·네트워크 중복이 한 번의 청구/환불로만 반영된다.
- **재고 선점의 확정·해제(VII)**: 004가 주문 생성 시 reserve해 둔 재고를, 결제 승인은 "확정"(reserved 유지로 매출 확정), void는 "해제"(release로 반납)한다. 결제 성공이 선점을 실제 매출로 굳히는 지점이다.
- **서버 권위(V)**: 결제 금액은 클라이언트가 보낸 값을 쓰지 않고 서버가 주문의 `total`을 그대로 청구한다. 요청 body는 `idempotencyKey`만 받는다.
- **상태 전이는 라우트가 오케스트레이션**: authorize는 그 주문의 모든 SubOrder를 "결제완료"로, void는 관련 SubOrder를 "환불중"으로 바꾸고 재고를 release한다. store는 얇게 유지(단일 책임), 전이 규칙은 라우트에 둔다.
- **004 라우트와 분리된 새 파일**: `src/multiseller-payments.ts`에 결제 라우트를 신설한다. 004 라우트(`multiseller-orders.ts`)는 건드리지 않아 회귀를 원천 차단한다.

## Constitution Check

*GATE.* 관련 원칙을 어떻게 지키는지 명시.

- **VIII. Idempotent Money Operations** ✓ — authorize/void 모두 `idempotencyKey`를 받는다. 라우트 진입 시 `PaymentStore.getByKey(key)`로 먼저 조회하고, 이미 있으면 **부작용 없이 원래 Payment를 반환**한다(중복 청구·중복 환불 없음). Payment 생성·SubOrder 전이·재고 release는 "키가 없을 때"만 실행. void의 멱등도 같은 키로 조회한 Payment가 이미 "void"면 그대로 반환.
- **VII. Reserve Before Pay** ✓ — 004가 결제 전 reserve해 둔 재고를 authorize가 확정(reserved 유지), void가 release로 되돌린다. 결제 성공이 선점을 매출로 확정하는 지점.
- **V. Server Authority** ✓ — 청구 금액은 서버가 주문의 `total`을 그대로 쓴다. 클라이언트가 amount를 보내도 무시(요청 스키마는 idempotencyKey만).
- **IV. Explicit Errors** ✓ — 없는 주문 404, 취소된 주문 authorize 409, 배송 완료 건 void 409, idempotencyKey 누락 400. 모두 `{ error: string }` 본문. 500·묵살 없음.
- **VI. Sub-Order as the Unit of Fulfillment** ✓ — 결제는 Order 단위 1회 청구지만, 상태 전이(결제대기→결제완료→환불중)는 SubOrder 단위로 이뤄진다.

기타 계승 원칙: I(Spec-Driven) spec 선행, II(Test-First) 각 FR·멱등·실패 경로 테스트, III(Thin Storage) PaymentStore를 인터페이스로 분리. IX(정산)은 이 기능 범위 밖(007).

## Project Structure

```
src/
  store.ts                    # Payment·PaymentStore 추가, SubOrderStatus에 "결제완료"·"환불중" 추가
  multiseller-payments.ts     # (신설) POST /marketplace/orders/:id/pay, POST /marketplace/payments/:id/void
  multiseller-payments.test.ts# (신설) FR별·멱등·404/409 테스트
  index.ts                    # 결제 라우트 wiring (store 공유)
specs/005-payment/
  spec.md · plan.md · tasks.md
```

## Complexity Tracking

위반 없음. 신규 엔티티(Payment) 1종과 새 라우트 파일 1개만 추가하며, 상태 전이는 상태머신 다이어그램 정본을 그대로 따른다.
