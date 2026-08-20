# Implementation Plan: Settlement (Per-Seller, Delivery-Triggered)

**Branch**: `007-settlement` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

## Summary

배송완료(006)된 SubOrder를 정산 주기(배치)마다 판매자별로 집계한다. 판매자 한 명의 gross는 그 판매자 배송완료 SubOrder들의 subtotal 합, commission은 `gross × seller.commissionRate`, netPayout은 `gross − commission`이다(서버 계산, 원칙 V). 집계된 SubOrder는 각각 `정산완료`로 전이하고 settlement_items로 기록한다. 배송되지 않은 SubOrder는 정산에서 제외한다(원칙 IX). 이미 `정산완료`된 SubOrder가 환불되면(008), 차기 정산 주기에 역산(차감) 항목으로 반영되도록 역산 훅을 제공한다(FR-005).

## Technical Context

**Language/Version**: TypeScript, Node.js (ESM)
**Primary Dependencies**: Hono
**Storage**: in-memory. `Settlement`·`SettlementItem`·`SettlementStore`를 신설하고, 006의 `SubOrderStore.listByStatus('배송완료')`를 정산 큐로 재사용한다.
**Testing**: vitest
**Project Type**: Single project (API)
**Constraints**: 정산은 006 위에 얹는다. 정산 큐는 `SubOrderStore.listByStatus('배송완료')`가 유일한 진실의 원천이다(별도 큐 목록을 두지 않는다). 001~006 라우트·테스트 무회귀. 외부 은행 지급은 인메모리로 시뮬레이션한다.

## Data Model (요약)

도메인 모델(`design/diagrams/domain-model.puml`)과 상태머신(`design/diagrams/state-suborder.puml`)을 정본으로 삼아 필드·상태명을 일치시킨다.

- **Settlement** (신설): `id`, `sellerId`, `period`, `grossAmount`, `commission`, `netPayout`, `itemIds`(포함된 SettlementItem id 목록). 도메인 모델의 Settlement 클래스 필드와 일치.
- **SettlementItem** (신설): `id`, `settlementId`, `subOrderId`, `amount`(양수 = 정산 집계, 음수 = 환불 역산), `reversal`(역산 항목 여부 플래그). 스펙의 "SettlementItem: subOrderId (± reversal marker)"를 `amount` 부호 + `reversal` 플래그로 표현.
- **SettlementStore** (신설): `run`은 라우트가 오케스트레이션하고, store는 기록·조회·역산 큐만 담당한다. `saveSettlement`(집계 결과 저장), `list`, `get`, `getBySeller`, `listItems`, **`recordReversal(subOrderId)`**(환불된 정산완료 건을 역산 대기 큐에 등록 — 008이 호출), `pendingReversals()`(차기 집계가 소비할 대기 역산 목록), `consumeReversal(subOrderId)`(집계 시 역산 소진 표시).
- **SubOrder** (006 재사용, 상태 확장): `SubOrderStatus`에 `정산대상`·`정산완료`를 추가한다(상태머신 다이어그램 `배송완료 → 정산대상 → 정산완료`와 일치). 정산 배치는 `배송완료`를 곧바로 `정산완료`로 전이한다(스펙 Acceptance 1). `정산대상`은 상태머신 정본과의 일관성을 위해 타입에 포함한다.

## 접근 방식

- **정산 큐 = `listByStatus('배송완료')` (원칙 IX)**: 006이 노출한 정산 큐를 그대로 읽는다. 별도 큐 자료구조를 두지 않아 이중 쓰기 버그를 원천 차단한다. 배송 안 된 SubOrder는 이 목록에 없으므로 자동으로 정산에서 제외된다(FR-001, SC-002).
- **판매자별 그룹핑 + 서버 권위 계산 (FR-002·003, 원칙 V)**: 배송완료 SubOrder를 `sellerId`로 그룹핑한다. 각 그룹에서 `gross = Σ subtotal`, `commission = gross × seller.commissionRate`, **`netPayout = gross − commission`**을 서버가 계산한다. 클라이언트가 어떤 금액도 보낼 수 없다 — `run` 요청은 body를 받지 않고, gross/commission/netPayout은 전적으로 저장된 SubOrder.subtotal과 Seller.commissionRate에서 파생한다. 이것이 netPayout의 서버 권위 보장의 핵심이다(SC-001).
- **전이 + 기록 (FR-004)**: 집계에 포함된 각 SubOrder를 `정산완료`로 전이하고 SettlementItem(양수 amount)으로 기록한다. 같은 배치를 다시 돌려도 이미 `정산완료`인 건은 `배송완료` 큐에 없으므로 재집계되지 않는다(구조적 멱등).
- **역산 훅 (FR-005, 008 연동)**: 이미 `정산완료`된 SubOrder가 환불되면 008이 `SettlementStore.recordReversal(subOrderId)`를 호출한다(또는 라우트 `POST /marketplace/settlements/reversals`). 이는 역산 대기 큐에 등록만 한다(부작용 지연). 차기 `run`이 각 판매자 그룹에 대해 그 판매자의 대기 역산을 소비해 음수 amount의 SettlementItem을 만들고, gross/commission/netPayout에서 차감한다. 결과적으로 누적 지급액이 정합을 유지한다(SC-003). 배송 안 된 SubOrder는 애초 큐에 없으므로 정산 제외 원칙과 충돌하지 않는다.
- **006과 분리된 새 파일**: `src/marketplace-settlement.ts`에 정산 라우트를 신설한다. 006 라우트(`marketplace-shipping.ts`)는 건드리지 않아 회귀를 원천 차단한다.

## Constitution Check

*GATE.* 관련 원칙을 어떻게 지키는지 명시.

- **IX. Settlement Follows Delivery** ✓ — 정산은 `listByStatus('배송완료')`만 집계한다. 배송 전 상태(결제완료·수락됨·배송중)는 큐에 없어 제외된다. 환불된 정산완료 건은 차기 주기에 역산한다.
- **V. Server Authority** ✓ — `run`은 클라이언트 금액을 일절 받지 않는다. gross/commission/netPayout은 서버가 SubOrder.subtotal 합과 Seller.commissionRate로만 계산한다. `netPayout = gross − commission`은 코드 단일 지점에서만 산출된다(클라이언트가 덮어쓸 경로 없음).
- **VI. Sub-Order as the Unit of Fulfillment** ✓ — 집계·전이·역산 모두 SubOrder 단위. Settlement는 판매자별로 SubOrder들을 묶는다.
- **IV. Explicit Errors** ✓ — 없는 판매자·SubOrder 참조는 방어적으로 건너뛰거나 404. `{ error: string }` 본문. 정산 대상 없으면 빈 목록 반환(빈 Settlement 생성 안 함, 스펙 Edge Case).
- **III. Thin, Swappable Storage** ✓ — `SettlementStore`를 인터페이스로 분리, 라우트는 인터페이스에만 의존한다.

기타 계승 원칙: I(Spec-Driven) spec 선행, II(Test-First) FR·netPayout·판매자 분리·미배송 제외·역산 테스트.

## Project Structure

```
src/
  store.ts                       # Settlement·SettlementItem·SettlementStore 추가, SubOrderStatus에 "정산대상"·"정산완료" 추가
  marketplace-settlement.ts      # (신설) POST /marketplace/settlements/run, GET /marketplace/settlements, POST /marketplace/settlements/reversals(역산 훅 경로)
  marketplace-settlement.test.ts # (신설) FR별·netPayout·판매자 분리·미배송 제외·역산 테스트
  index.ts                       # 정산 라우트 wiring (subOrder·seller store 공유)
specs/007-settlement/
  spec.md · plan.md · tasks.md
```

## Complexity Tracking

위반 없음. 신규 엔티티(Settlement·SettlementItem) 2종과 새 라우트 파일 1개만 추가한다. 정산 큐는 006의 `SubOrderStore.listByStatus('배송완료')`를 재사용해 새 큐 자료구조를 만들지 않는다. netPayout은 코드 단일 지점에서만 계산해 서버 권위를 구조로 보장한다.
