# Research: Order Management (Phase 0)

## 기술 결정
- **총액 서버 계산**: 클라이언트가 보낸 total은 무시하고 참조 시점의 상품 가격으로 계산한다(Constitution V).
- **store 공유**: `index.ts`에서 하나의 `ProductStore`를 product·order 라우트에 함께 주입한다. `OrderStore`는 별도 인터페이스.
- **검증 순서**: 구조(빈 items·quantity<1) → 400, 상품 참조 → 404, 그 다음 total 계산. 형식 오류를 상품 조회 이전에 거른다.
- **주문에 상품 스냅샷 미저장**: productId 참조 + 계산된 total만 저장(가격 변동 이력은 후속 과제).

## NEEDS CLARIFICATION 해소
- 재고 차감: 이 feature 범위 밖(003 order-stock). 결제·배송·인증: 범위 밖.
