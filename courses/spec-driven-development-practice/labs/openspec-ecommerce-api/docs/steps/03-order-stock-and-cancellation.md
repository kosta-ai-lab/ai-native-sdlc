# Step 3 — order-stock-and-cancellation: MODIFIED delta와 재고

첫 두 change는 **ADDED**로만 스펙을 쌓았다. 이 change는 **기존 동작을 바꾸는 MODIFIED delta**를 실증한다. 완료 태그: `act2-order-stock-and-cancellation`.

## 이 장의 핵심 — MODIFIED delta
- 기존 `order-management`의 `Create Order` requirement를 바꾼다(주문 시 재고 차감, 부족하면 `409`).
- delta 파일의 `## MODIFIED Requirements`에 기존 requirement 블록을 **전체 복사한 뒤 수정**한다.
  - **함정**: MODIFIED에 부분 내용만 쓰면 archive 시 나머지 시나리오가 사라진다("partial content loses detail at archive time"). 그래서 기존 4개 시나리오(valid/empty/quantity/unknown)를 모두 옮기고 `Reject insufficient stock`(409)을 더했다.
- 새 기능(Cancel Order)은 같은 delta의 `## ADDED Requirements`로. 한 change 안에서 MODIFIED와 ADDED가 공존한다.

## archive 병합 결과 (실측)
```
openspec archive order-stock-and-cancellation --yes
  Applying changes to openspec/specs/order-management/spec.md:
    + 1 added      # Cancel Order
    ~ 1 modified   # Create Order (재고 시나리오 반영)
```
main spec `order-management`는 이제 `Create Order` / `List Orders` / `Get Order By Id` / **`Cancel Order`** 4개 requirement이며, `insufficient stock` 시나리오가 Create Order에 병합됐다.

## 구현 결정 — check-all-then-deduct
재고 차감의 원자성(커밋: order-stock 무브 2):
1. 모든 item의 상품 참조·재고를 **먼저 전부 확인**한다. 하나라도 부족하면 `409`를 반환하고 아무 재고도 바꾸지 않는다.
2. 전부 통과한 뒤에야 일괄 차감한다.
- 중복 item은 `aggregate()`로 productId별 합산 수량으로 확인한다.
- 취소는 역연산: 상태를 `cancelled`로, 각 수량을 `stock`에 복원. 이미 `cancelled`면 `409`.

## verify (E2E)
`stock 5` → 주문(2) → `3` → 취소 → `5`(복원). 초과주문(10) → `409`. 재취소 → `409`.

## 재현
```bash
git checkout act2-order-stock-and-cancellation   # 이 change 완료 시점
```

## 난이도 상 포인트 (KOSTA 대비)
1. **MODIFIED delta 전체 복사** 규칙과 부분 손실 함정 — KOSTA는 propose/apply/archive 기본만 다뤘다.
2. 상태 전이(`pending → cancelled`)와 역연산 재고 복원.
3. check-all-then-deduct 원자성 패턴(부분 차감 방지).
