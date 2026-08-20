## ADDED Requirements

### Requirement: Create Product
The system SHALL create a product from `name`, `price` (integer cents), and `stock` (non-negative integer), assign a unique `id`, and return the created product.

#### Scenario: Create with valid input
- **WHEN** a client sends `POST /products` with `{ "name": "Keyboard", "price": 4200, "stock": 10 }`
- **THEN** the system responds `201`
- **AND** the body contains the product with a generated `id` and the submitted `name`, `price`, `stock`

#### Scenario: Reject missing name
- **WHEN** a client sends `POST /products` without `name`, or with an empty `name`
- **THEN** the system responds `400`
- **AND** no product is created

#### Scenario: Reject negative price
- **WHEN** a client sends `POST /products` with `price` less than `0`
- **THEN** the system responds `400`

#### Scenario: Reject negative stock
- **WHEN** a client sends `POST /products` with `stock` less than `0`
- **THEN** the system responds `400`

### Requirement: List Products
The system SHALL return all products as a JSON array.

#### Scenario: List returns all products
- **WHEN** a client sends `GET /products`
- **THEN** the system responds `200`
- **AND** the body is a JSON array containing every created product

### Requirement: Get Product By Id
The system SHALL return a single product by `id`, or `404` when no product with that `id` exists.

#### Scenario: Get existing product
- **WHEN** a client sends `GET /products/{id}` for an existing product
- **THEN** the system responds `200` with that product

#### Scenario: Get missing product
- **WHEN** a client sends `GET /products/{id}` for an `id` that does not exist
- **THEN** the system responds `404`

### Requirement: Update Product
The system SHALL apply a partial update to an existing product's `name`, `price`, or `stock`, enforcing the same validation as creation, or `404` when the product does not exist.

#### Scenario: Update existing product
- **WHEN** a client sends `PATCH /products/{id}` with `{ "price": 3900 }` for an existing product
- **THEN** the system responds `200`
- **AND** the returned product reflects the new `price` and keeps its other fields

#### Scenario: Update missing product
- **WHEN** a client sends `PATCH /products/{id}` for an `id` that does not exist
- **THEN** the system responds `404`

#### Scenario: Reject invalid update
- **WHEN** a client sends `PATCH /products/{id}` with `price` less than `0`
- **THEN** the system responds `400`
- **AND** the product is left unchanged

### Requirement: Delete Product
The system SHALL delete an existing product, or return `404` when it does not exist.

#### Scenario: Delete existing product
- **WHEN** a client sends `DELETE /products/{id}` for an existing product
- **THEN** the system responds `204`
- **AND** a subsequent `GET /products/{id}` responds `404`

#### Scenario: Delete missing product
- **WHEN** a client sends `DELETE /products/{id}` for an `id` that does not exist
- **THEN** the system responds `404`
