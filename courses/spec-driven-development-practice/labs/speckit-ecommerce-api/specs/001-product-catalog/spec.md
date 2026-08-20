# Feature Specification: Product Catalog

**Feature Branch**: `001-product-catalog`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Product catalog REST API: create, list, get, update, delete products with validation and proper error codes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Register and browse products (Priority: P1)

카탈로그 운영자가 판매할 상품을 등록하고, 전체 목록과 개별 상품을 조회한다.

**Why this priority**: 상품이 없으면 주문도 판매도 불가능하다. 등록·조회는 카탈로그의 최소 기능이며, 이것만으로도 "상품을 올리고 확인한다"는 가치를 독립적으로 제공한다.

**Independent Test**: 상품을 하나 등록한 뒤 목록과 단건 조회로 그 상품이 보이는지 확인하면 검증된다.

**Acceptance Scenarios**:

1. **Given** 빈 카탈로그, **When** 이름·가격·재고를 담아 상품을 등록하면, **Then** 생성된 상품이 식별자와 함께 반환된다 (201).
2. **Given** 상품이 여러 개 등록된 상태, **When** 목록을 조회하면, **Then** 등록된 모든 상품이 반환된다 (200).
3. **Given** 등록된 상품, **When** 그 식별자로 조회하면, **Then** 해당 상품이 반환된다 (200).
4. **Given** 존재하지 않는 식별자, **When** 조회하면, **Then** 찾을 수 없음이 반환된다 (404).

---

### User Story 2 - Correct product details (Priority: P2)

운영자가 이미 등록한 상품의 이름·가격·재고를 부분 수정한다.

**Why this priority**: 가격·재고는 자주 바뀐다. 등록 다음으로 중요하나, 등록·조회 없이는 의미가 없어 P2.

**Independent Test**: 상품을 등록한 뒤 가격만 바꾸고 다시 조회해 반영됐는지 확인.

**Acceptance Scenarios**:

1. **Given** 등록된 상품, **When** 가격만 수정하면, **Then** 가격이 갱신되고 나머지 필드는 유지된다 (200).
2. **Given** 존재하지 않는 상품, **When** 수정을 시도하면, **Then** 찾을 수 없음이 반환된다 (404).
3. **Given** 등록된 상품, **When** 음수 가격으로 수정하면, **Then** 거부되고 (400) 상품은 변경되지 않는다.

---

### User Story 3 - Remove discontinued products (Priority: P3)

운영자가 단종된 상품을 카탈로그에서 삭제한다.

**Why this priority**: 정리 기능. 없어도 카탈로그는 동작하므로 P3.

**Independent Test**: 상품 등록 후 삭제하고, 재조회 시 사라졌는지 확인.

**Acceptance Scenarios**:

1. **Given** 등록된 상품, **When** 삭제하면, **Then** 성공하고 (204) 이후 조회는 404다.
2. **Given** 존재하지 않는 상품, **When** 삭제를 시도하면, **Then** 찾을 수 없음이 반환된다 (404).

### Edge Cases

- 이름이 비었거나 없을 때 → 등록·수정 거부 (400).
- 가격 또는 재고가 음수이거나 정수가 아닐 때 → 거부 (400).
- 존재하지 않는 상품의 조회·수정·삭제 → 404.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a product from a name, a price in integer cents, and a non-negative integer stock, assign a unique identifier, and return it (201).
- **FR-002**: System MUST reject creation when name is missing or empty, or when price/stock is negative or non-integer (400), and create nothing.
- **FR-003**: System MUST return all products on a list request (200).
- **FR-004**: System MUST return a single product by identifier (200), or "not found" (404).
- **FR-005**: Users MUST be able to partially update a product's name, price, or stock under the same validation as creation (200); a missing product returns 404, and an invalid update (400) leaves the product unchanged.
- **FR-006**: Users MUST be able to delete a product (204), or receive 404 if it does not exist; a deleted product is no longer retrievable.

### Key Entities *(include if feature involves data)*

- **Product**: a sellable item. Attributes: identifier, name, price (integer cents), stock (non-negative integer).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All five operations (create, list, get, update, delete) are exercisable end-to-end against a running server.
- **SC-002**: Every invalid-input path returns 400 and every missing-resource path returns 404; no expected condition returns 500.
- **SC-003**: A created product is retrievable by list and by id; a deleted product is not.
- **SC-004**: An invalid update never mutates the stored product.

## Assumptions

- Storage is in-memory for this iteration (no persistence across restarts).
- No authentication or authorization is in scope.
- Single currency; price is stored as integer cents.
- Pagination, search, and filtering are out of scope for v1.
