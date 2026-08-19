# E-Commerce API Constitution

> 3일차 확장: 단일 판매자 API를 멀티셀러 마켓플레이스로 확장한다. 원칙 I~V는 2일차 계승, VI~IX는 3일차 추가.

## Core Principles

### I. Spec-Driven (NON-NEGOTIABLE)
Every feature begins as a spec (WHAT / WHY) before any code. Specs describe observable API behavior — status codes, payloads, error conditions — not implementation details.

### II. Test-First
Each functional requirement maps to at least one test. Failure paths (400 validation, 404 missing, 409 conflict) are specified and tested, not only happy paths.

### III. Thin, Swappable Storage
Persistence sits behind an interface (in-memory for now). Routes depend on the interface, never on a concrete store, so storage can be replaced without touching handlers.

### IV. Explicit Errors
Every error returns a proper HTTP status (400 / 404 / 409) with a JSON `{ "error": string }` body. No silent failures, and no 500 for an expected condition.

### V. Server Authority
The server computes derived values (order totals, stock changes, commissions). Client-supplied derived fields are ignored.

### VI. Sub-Order as the Unit of Fulfillment (3일차)
A multi-seller order is split into one SubOrder per seller. Shipping, settlement, and refund all operate on SubOrders. Payment is per Order (one buyer charge); fulfillment status lives on the SubOrder.

### VII. Reserve Before Pay (3일차)
Stock is reserved at order creation (before payment) to prevent overselling. Payment success confirms the reservation; failure or cancellation releases it. Insufficient stock returns 409, and nothing is created.

### VIII. Idempotent Money Operations (3일차)
Payment authorize/void carry an idempotencyKey. Repeated requests with the same key MUST NOT double-charge or double-refund; the original result is returned instead.

### IX. Settlement Follows Delivery (3일차)
A SubOrder enters the settlement queue only after delivery (markDelivered). Settlement aggregates delivered SubOrders per seller, deducts commission (netPayout = gross − commission), and pays out. Refunds reverse already-settled amounts in the next cycle.

## Technology Constraints
- TypeScript, Hono, pnpm, vitest, tsx. Node.js (ESM).
- Conventional Commits. One responsibility per file; small focused modules.

## Development Workflow
- `specify → plan → tasks → implement`. A Constitution Check gate runs before plan and before tasks.
- Each User Story is independently testable and delivers a usable increment (MVP-first).

## Governance
This constitution guides all features. A plan that violates a principle must justify it under Complexity Tracking. Amendments bump the version and sync dependent templates.

**Version**: 2.0.0 | **Ratified**: 2026-07-08 | **Last Amended**: 2026-07-12 (multi-seller marketplace expansion)
