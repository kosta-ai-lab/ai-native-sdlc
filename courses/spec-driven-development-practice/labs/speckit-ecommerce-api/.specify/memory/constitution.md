# E-Commerce API Constitution

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
The server computes derived values (order totals, stock changes). Client-supplied derived fields are ignored.

## Technology Constraints
- TypeScript, Hono, pnpm, vitest, tsx. Node.js (ESM).
- Conventional Commits. One responsibility per file; small focused modules.

## Development Workflow
- `specify → plan → tasks → implement`. A Constitution Check gate runs before plan and before tasks.
- Each User Story is independently testable and delivers a usable increment (MVP-first).

## Governance
This constitution guides all features. A plan that violates a principle must justify it under Complexity Tracking. Amendments bump the version and sync dependent templates.

**Version**: 1.0.0 | **Ratified**: 2026-07-08 | **Last Amended**: 2026-07-08
