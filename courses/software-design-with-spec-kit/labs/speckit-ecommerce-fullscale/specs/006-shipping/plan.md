# Implementation Plan: Shipping & Delivery

**Branch**: `006-shipping` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

## Summary

결제완료(005)된 SubOrder를 판매자가 수락하고 배송사에 접수해 배송을 시작한 뒤, `markDelivered`로 배송을 완료하는 이행 단계를 얹는다. 배송완료는 정산(007)의 트리거다(원칙 IX) — SubOrder.status가 "배송완료"가 된 시점에만 정산 큐에 진입한다. `markDelivered`는 멱등이라, 이미 배송완료된 건을 다시 호출해도 정산 큐에 중복 등록되지 않는다.

## Technical Context

**Language/Version**: TypeScript, Node.js (ESM)
**Primary Dependencies**: Hono
**Storage**: in-memory. `Shipment`·`ShipmentStore`를 신설하고, 004의 `SubOrder`·`SubOrderStore`를 재사용·확장한다.
**Testing**: vitest
**Project Type**: Single project (API)
**Constraints**: 배송은 005 위에 얹는다. 상태 전이·정산 큐 노출은 004의 SubOrder store를 그대로 쓴다. 001~005 라우트·테스트 무회귀. 배송사는 인메모리로 시뮬레이션(외부 물류 연동 없음).

## Data Model (요약)

상태머신 다이어그램(`design/diagrams/state-suborder.puml`)을 정본으로 삼아 상태명을 일치시킨다.

- **Shipment** (신설): `id`, `subOrderId`, `carrierId`, `status`("접수" | "배송중" | "완료"), `deliveredAt`(배송완료 시각, 그 전엔 undefined). 한 SubOrder에 대한 1건의 배송.
- **ShipmentStore** (신설): `create`(배송 접수), `get`, `getBySubOrder`(SubOrder로 조회), `markDelivered`(status를 "완료"로, deliveredAt 기록). 멱등 판단은 라우트가 SubOrder.status로 한다.
- **SubOrder** (004 재사용, 상태 확장): 상태 전이 "결제완료" → "수락됨"(판매자 수락) → "배송중"(배송사 접수) → "배송완료"(markDelivered). 상태머신 다이어그램의 전이를 그대로 옮긴다.
- **SubOrderStore** (004 재사용, 조회 추가): 정산 큐를 노출하는 `listByStatus(status)`를 추가한다. 007은 `listByStatus('배송완료')`로 정산 대상을 읽는다.

`SubOrderStatus` 타입에 "수락됨"·"배송중"·"배송완료"를 추가한다(현재 "결제대기"|"결제완료"|"환불중"|"취소됨"). 상태머신 다이어그램의 결제완료→수락됨→배송중→배송완료 전이를 코드로 옮기는 것이므로 정본과 일치한다.

## 접근 방식

- **정산 큐 = SubOrder.status "배송완료" (원칙 IX)**: 정산 큐를 별도 목록으로 이중 관리하지 않는다. SubOrder.status가 유일한 진실의 원천이고, 007은 `SubOrderStore.listByStatus('배송완료')`로 정산 대상을 읽는다. "배송완료 목록"을 따로 두면 상태와 목록이 어긋나는 이중 쓰기 버그가 생기므로, 상태 하나로 큐를 표현한다.
- **markDelivered의 멱등(FR-004)**: 멱등의 축은 **SubOrder.status 검사**다. markDelivered 진입 시 SubOrder가 이미 "배송완료"면 부작용(상태 전이·정산 큐 등록) 없이 원 결과를 반환한다. 큐가 곧 status이므로, 재호출해도 그 SubOrder는 큐에 정확히 한 번만 존재한다(중복 정산 원천 차단).
- **상태 전이는 라우트가 오케스트레이션**: 수락은 "결제완료"→"수락됨", 배송 접수는 Shipment 생성 + "수락됨"→"배송중", markDelivered는 Shipment "완료" + "배송중"→"배송완료". store는 얇게 유지(단일 책임), 전이 순서 규칙은 라우트에 둔다.
- **005와 분리된 새 파일**: `src/marketplace-shipping.ts`에 배송 라우트를 신설한다. 005 라우트(`multiseller-payments.ts`)는 건드리지 않아 회귀를 원천 차단한다. 005의 void 화이트리스트(`VOIDABLE_SUBORDER_STATUS = '결제완료'`)는 배송 상태를 포함하지 않으므로, "배송 시작·완료 후 void 시도 → 409"가 자동으로 유지된다.

## Constitution Check

*GATE.* 관련 원칙을 어떻게 지키는지 명시.

- **IX. Settlement Follows Delivery** ✓ — SubOrder는 markDelivered로 "배송완료"가 된 시점에만 정산 큐에 들어간다. 큐는 `SubOrderStore.listByStatus('배송완료')`로 노출하며, status가 유일한 진실의 원천이다. markDelivered 이전 상태(수락됨·배송중)는 큐에 없다.
- **VI. Sub-Order as the Unit of Fulfillment** ✓ — 수락·배송·배송완료 모두 SubOrder 단위로 이뤄진다. Shipment는 SubOrder 1건에 대응한다.
- **IV. Explicit Errors** ✓ — 없는 SubOrder/Shipment 404, 결제완료가 아닌 SubOrder 수락 409, 잘못된 상태의 배송 접수 409. 모두 `{ error: string }` 본문. 500·묵살 없음.
- **V. Server Authority** ✓ — 상태 전이·deliveredAt·Shipment status는 서버가 계산·기록한다. 클라이언트가 보낸 상태값은 쓰지 않는다.
- **III. Thin, Swappable Storage** ✓ — ShipmentStore를 인터페이스로 분리, 라우트는 인터페이스에만 의존한다.

기타 계승 원칙: I(Spec-Driven) spec 선행, II(Test-First) 각 FR·멱등·404/409 테스트.

## Project Structure

```
src/
  store.ts                    # Shipment·ShipmentStore 추가, SubOrderStatus에 "수락됨"·"배송중"·"배송완료" 추가, SubOrderStore.listByStatus 추가
  marketplace-shipping.ts     # (신설) POST /suborders/:id/accept, /suborders/:id/ship, /shipments/:id/deliver, GET /shipments/:id
  marketplace-shipping.test.ts# (신설) FR별·멱등(markDelivered 2회)·409(미결제 수락)·404 테스트
  index.ts                    # 배송 라우트 wiring (subOrder store 공유)
specs/006-shipping/
  spec.md · plan.md · tasks.md
```

## Complexity Tracking

위반 없음. 신규 엔티티(Shipment) 1종과 새 라우트 파일 1개만 추가하며, 상태 전이는 상태머신 다이어그램 정본을 그대로 따른다. 정산 큐는 새 자료구조 없이 기존 SubOrder.status로 표현한다.
