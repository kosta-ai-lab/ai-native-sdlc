# Implementation Plan: Refund & Reversal

**Branch**: `008-refund` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

## Summary

SubOrder 하나를 환불한다(전액 또는 부분). 상태머신(`design/diagrams/state-suborder.puml`)의 `→ 환불중 → 환불완료` 경로를 따르되, **환불 시점에 따라 세 갈래로 분기**한다.

- **배송 전(`결제완료`)**: 005의 배송 전 취소(void) 경로를 재사용 — 결제 void + 선점 재고 release.
- **배송완료·정산 전(`배송완료`)**: 정산 큐(`listByStatus('배송완료')`)에서 빠지도록 상태를 전이. 정산된 적이 없으므로 역산 불필요.
- **정산완료(`정산완료`)**: 007의 `reverseSettledSubOrder(...)` 훅을 호출해 차기 정산 주기에 역산(차감) 예약.

세 갈래 모두 최종 상태는 `환불완료`다. 부분 환불(body `amount`)은 요청 금액만 반영하며, subtotal을 초과하면 400. 없는 SubOrder는 404. **멱등**: 이미 `환불완료`인 건에 같은 환불을 재요청하면 부작용 없이 원 결과를 반환한다(Constitution VIII).

## Technical Context

**Language/Version**: TypeScript, Node.js (ESM)
**Primary Dependencies**: Hono
**Storage**: in-memory. `Refund`·`RefundStore`를 신설하고, `SubOrderStatus`에 `환불완료`를 추가한다(`환불중`은 005가 이미 추가). 005의 void 로직과 007의 역산 훅을 **재사용**한다(중복 구현 금지).
**Testing**: vitest
**Project Type**: Single project (API)
**Constraints**: 환불은 004~007 위에 얹는다. 배송 전 환불은 005의 void 로직을, 정산완료 환불은 007의 `reverseSettledSubOrder`를 재사용한다(재구현 금지). 001~007 라우트·테스트 무회귀. tsc strict 통과.

## Data Model (요약)

도메인 모델·상태머신(`design/diagrams/state-suborder.puml`)을 정본으로 필드·상태명을 일치시킨다.

- **Refund** (신설): `id`, `subOrderId`, `paymentId`, `amount`, `reason`. 스펙 Key Entities와 일치.
- **RefundStore** (신설): `create`, `get`, `getBySubOrder`(멱등 조회의 축 — 이미 환불된 SubOrder인지 확인). 인터페이스로 분리(원칙 III).
- **SubOrder** (재사용, 상태 확장): `SubOrderStatus`에 `환불완료`를 추가한다(상태머신 `환불중 → 환불완료`와 일치). `환불중`은 005가 이미 추가.

## 접근 방식 — 세 갈래 분기 + 재사용

라우트는 `POST /marketplace/suborders/:id/refund` **하나**이며, SubOrder 상태로 분기한다. 각 분기의 실제 부작용은 **기존 코드를 호출**한다.

- **분기 1 — 배송 전(`결제완료`) → 005 void 재사용 (FR-001)**: 005의 배송 전 취소는 "결제 void + 재고 release + `환불중` 전이"다. 이 부작용을 005 라우트에 인라인으로 두지 않고 `multiseller-payments.ts`에 순수 헬퍼 `voidPreDeliverySubOrder(...)`로 **추출**한다. 005 라우트는 그 헬퍼를 SubOrder마다 호출하도록 바꾸고(동작 불변), 008도 같은 헬퍼를 그 SubOrder 하나에 호출한다. 결과적으로 배송 전 환불 로직은 코드 단일 지점에만 존재한다(중복 구현 제로). payment void는 `status==='void'` 가드로 반복 호출에 안전(멱등, 원칙 VIII).
- **분기 2 — 배송완료·정산 전(`배송완료`) (FR-002 전반)**: 정산 큐는 `SubOrderStore.listByStatus('배송완료')`가 유일한 진실의 원천(원칙 IX)이므로, `배송완료`에서 벗어나기만 하면 정산 큐에서 자동 제외된다. 정산된 적이 없어 역산 대상이 아니다. 재고는 이미 판매(출고)되었으므로 release하지 않는다(배송 전 취소와의 핵심 차이).
- **분기 3 — 정산완료(`정산완료`) → 007 역산 훅 재사용 (FR-002·003)**: 이미 지급된 건이므로 즉시 되돌리지 않고 007의 `reverseSettledSubOrder(settlements, { subOrderId, sellerId, amount })`를 호출해 차기 정산 주기 역산(차감)으로 예약한다. 실제 차감은 다음 `runSettlement`가 수행한다(007 FR-005). 008은 역산 로직을 재구현하지 않고 이 함수만 호출한다.
- **공통 — 부분 환불·검증·멱등 (FR-004·005)**: `amount`는 body 선택값. 없으면 전액(subtotal). `amount <= 0` 또는 `amount > subtotal`이면 400. 없는 SubOrder는 404. **멱등의 축은 `RefundStore.getBySubOrder`** — 부작용 실행 전에 먼저 조회해, 이미 환불된 SubOrder면 원 Refund를 그대로 반환한다(중복 void·중복 역산 차단). 최종 상태 전이는 세 갈래 공통으로 `환불완료`.
- **기존 파일 분리**: 환불 라우트는 새 파일 `src/marketplace-refund.ts`에 둔다. 005 라우트는 헬퍼 추출로만 바뀌며(동작 불변), 007 라우트는 건드리지 않는다 — 회귀를 구조로 차단한다.

## Constitution Check

*GATE.* 관련 원칙을 어떻게 지키는지 명시.

- **VIII. Idempotent Money Operations** ✓ — 멱등의 축은 `RefundStore.getBySubOrder`. 부작용(결제 void·재고 release·역산 예약) 전에 먼저 조회해 이미 환불된 건이면 원 결과 반환. 배송 전 void 자체도 payment status 가드로 이중 안전. 중복 환불·이중 역산 없음(SC-003).
- **IX. Settlement Follows Delivery** ✓ — 정산 전(`배송완료`) 환불은 상태를 큐에서 빼 정산 제외, 정산완료 건 환불은 007 역산 훅으로 차기 주기 차감. 큐의 유일한 진실의 원천(`listByStatus('배송완료')`)을 존중한다.
- **VII. Reserve Before Pay** ✓ — 배송 전 환불만 재고를 release(005 로직 재사용). 배송 후에는 이미 출고되어 release하지 않는다.
- **V. Server Authority** ✓ — 역산·void 금액은 저장된 subtotal에서 파생. 부분 환불 `amount`만 클라이언트가 제안하고, subtotal 상한을 서버가 강제한다(초과 시 400).
- **IV. Explicit Errors** ✓ — 404(없는 SubOrder)·400(subtotal 초과·잘못된 amount)·`{ error: string }` 본문. 예상 조건에 500 없음.
- **III. Thin, Swappable Storage** ✓ — `RefundStore`를 인터페이스로 분리, 라우트는 인터페이스에만 의존.

기타 계승 원칙: I(Spec-Driven) spec 선행, II(Test-First) 세 분기·부분환불·400·404·멱등 각각 테스트. **핵심: 005·007 로직을 재구현하지 않고 재사용**(중복 방지 = 회귀 방지).

## Project Structure

```
src/
  store.ts                    # Refund·RefundStore 추가, SubOrderStatus에 "환불완료" 추가("환불중"은 005 기존)
  multiseller-payments.ts     # 배송 전 void 로직을 voidPreDeliverySubOrder(...) 헬퍼로 추출·export (005 라우트는 이를 호출, 동작 불변)
  marketplace-refund.ts       # (신설) POST /marketplace/suborders/:id/refund — 상태별 3분기(005 void 재사용 · 정산 큐 제외 · 007 역산 훅 호출)
  marketplace-refund.test.ts  # (신설) 세 분기 + 부분환불 + 400/404 + 멱등
  index.ts                    # 환불 라우트 wiring (payment·subOrder·inventory·settlement·seller store 공유)
specs/008-refund/
  spec.md · plan.md · tasks.md
```

## Complexity Tracking

위반 없음. 신규 엔티티(Refund) 1종과 새 라우트 파일 1개만 추가한다. 세 갈래 분기의 실제 부작용은 모두 **기존 코드 호출**이다 — 배송 전은 005에서 추출한 `voidPreDeliverySubOrder`, 정산완료는 007의 `reverseSettledSubOrder`. 정산 전 분기는 상태 전이 한 번뿐(정산 큐가 상태로 표현되므로 큐 조작 코드 불필요). 멱등은 `getBySubOrder` 선조회 단일 지점에서 구조로 보장한다.
