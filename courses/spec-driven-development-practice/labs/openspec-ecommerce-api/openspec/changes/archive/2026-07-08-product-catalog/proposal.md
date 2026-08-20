## Why

주문 기능은 판매할 상품이 있어야 성립합니다. 이 변경은 e-커머스 API의 토대인 상품 카탈로그를 세워, 이후 주문·재고 기능이 참조할 상품 자원과 그 수명주기(등록·조회·수정·삭제)를 제공합니다.

## What Changes

- 상품 자원 REST API 신설
  - `POST /products` 등록, `GET /products` 목록, `GET /products/:id` 단건 조회
  - `PATCH /products/:id` 부분 수정, `DELETE /products/:id` 삭제
- 상품 모델: `id`(문자열), `name`, `price`(정수 cents), `stock`(정수, 0 이상)
- 입력 검증: `name` 필수·비어있지 않음, `price`·`stock`은 정수이며 음수 불가 → 위반 시 `400`
- 존재하지 않는 상품 조회·수정·삭제 시 `404`
- 저장은 인메모리 리포지토리(교체 가능한 인터페이스) 뒤에 둡니다

## Capabilities

### New Capabilities
- `product-catalog`: 상품의 등록·조회·수정·삭제와 입력 검증 규칙

### Modified Capabilities
(없음 — 최초 capability이므로 기존 스펙 수정 없음)

## Impact

- 신규: `src/store.ts`(리포지토리 인터페이스 + 인메모리 구현), `src/products.ts`(라우트), `src/products.test.ts`
- 수정: `src/index.ts`(상품 라우트 마운트)
- 의존성: 추가 없음(기존 Hono 사용)

## Non-goals

- 주문 생성·주문과 상품 연동 → 별도 change `order-management`
- 주문에 따른 재고 차감·복원 → 2막 change `order-cancellation-and-stock`
- 인증·인가, 영속 데이터베이스 → 1막은 인메모리
- 페이지네이션·검색·정렬 필터
