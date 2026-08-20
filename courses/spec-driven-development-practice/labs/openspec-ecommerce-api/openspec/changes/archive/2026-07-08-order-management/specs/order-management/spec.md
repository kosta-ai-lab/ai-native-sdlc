## ADDED Requirements

### Requirement: Create Order
The system SHALL create an order from a non-empty list of items — each referencing an existing product `id` with a `quantity` of at least 1 — compute the `total` in cents from current product prices, set `status` to `"pending"`, and return the created order.

#### Scenario: Create order with valid items
- **WHEN** a client sends `POST /orders` with `{ "items": [{ "productId": "<existing>", "quantity": 2 }] }`
- **THEN** the system responds `201`
- **AND** the body contains an `id`, the submitted `items`, a `total` equal to the product price times quantity summed over items, and `status` `"pending"`

#### Scenario: Reject empty items
- **WHEN** a client sends `POST /orders` with an empty `items` array, or without `items`
- **THEN** the system responds `400`
- **AND** no order is created

#### Scenario: Reject non-positive quantity
- **WHEN** a client sends `POST /orders` with an item whose `quantity` is less than `1`
- **THEN** the system responds `400`

#### Scenario: Reject unknown product
- **WHEN** a client sends `POST /orders` with an item whose `productId` does not exist
- **THEN** the system responds `404`
- **AND** no order is created

### Requirement: List Orders
The system SHALL return all orders as a JSON array.

#### Scenario: List returns all orders
- **WHEN** a client sends `GET /orders`
- **THEN** the system responds `200`
- **AND** the body is a JSON array containing every created order

### Requirement: Get Order By Id
The system SHALL return a single order by `id`, or `404` when no order with that `id` exists.

#### Scenario: Get existing order
- **WHEN** a client sends `GET /orders/{id}` for an existing order
- **THEN** the system responds `200` with that order

#### Scenario: Get missing order
- **WHEN** a client sends `GET /orders/{id}` for an `id` that does not exist
- **THEN** the system responds `404`
