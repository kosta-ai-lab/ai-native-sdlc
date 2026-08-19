# Step 2 — order-management: 두 번째 change와 엔티티 관계

같은 워크플로우(propose → apply → verify → archive)를 **두 번째 change**로 반복한다. Step 1과 겹치는 절차는 생략하고, 이 장의 새로움만 짚는다. 완료 시점 태그: `act1-order-management`.

## 이 장의 새로움
- **다중 change**: `product-catalog`와 독립된 별개 change. 각자 자기 폴더·커밋·아카이브를 가진다. main spec에는 두 capability가 나란히 쌓인다.
- **엔티티 관계**: 주문이 상품을 참조한다. `index.ts`에서 하나의 `InMemoryProductStore`를 만들어 상품·주문 라우트에 **공유 주입**한다(커밋 `adff3e0`).
- **서버 권위 총액**: 요청의 `total`을 믿지 않고 `Σ product.price × quantity`를 서버가 계산한다. 클라이언트 조작 방지.

## 검증 순서 — 관찰 가능한 계약
주문 생성은 세 단계로 검증한다(커밋 `a1cf11f`):
1. **구조(400)**: `items` 비었거나 `quantity < 1`, `productId`가 문자열 아님 → 형식 오류를 상품 조회 이전에 거른다.
2. **참조(404)**: 각 `productId`를 `ProductStore.get`으로 확인, 없으면 `404`.
3. **총액**: 통과한 항목만으로 total 계산 후 `status: "pending"`으로 저장.

> 순서가 곧 계약이다. "형식 오류(400)"와 "없는 상품(404)"을 뒤섞으면 클라이언트가 원인을 구분할 수 없다. 스펙 시나리오(`Reject empty items` / `Reject unknown product`)가 이 순서를 못박는다.

## 커밋 히스토리 (apply 무브)
| 무브 | 커밋 | 내용 |
|---|---|---|
| A | `8a1429e` | `Order`/`OrderStore`/`InMemoryOrderStore` 추가 |
| B | `a1cf11f` | 주문 라우트 — 검증·서버 총액·reads |
| C | `adff3e0` | product store 공유 + 주문 라우트 마운트 |

## verify (E2E)
상품 등록 → `POST /orders`(qty 2)로 `total=8400` 확인, `empty items`→400, `unknown product`→404.

## 재현
```bash
git checkout act1-order-management
git checkout 8a1429e   # order store 추가 시점
```

## 다음 (Step 3) — 난이도 상승
지금까지는 새 capability를 **ADDED**로만 쌓았다. 다음 change는 기존 동작을 바꾸는 **MODIFIED delta**를 다룬다: 주문 시 재고 차감(부족하면 409), 주문 취소 시 재고 복원. 여기서 `openspec`의 **MODIFIED requirement**와 **verify/sync** 확장 워크플로우를 실증한다.
