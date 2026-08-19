# Implementation Plan: Order Management

**Branch**: `002-order-management` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

## Summary

주문 생성·조회 API를 Hono로 추가한다. 주문은 상품(feature 001)을 참조하며, 서버가 총액을 계산한다. 검증 순서(구조 400 → 참조 404)를 지키고 요청 수준 테스트로 커버한다.

## Technical Context

**Language/Version**: TypeScript, Node.js (ESM)
**Primary Dependencies**: Hono, @hono/node-server
**Storage**: in-memory `OrderStore`; the shared `ProductStore`(feature 001) is injected for lookups
**Testing**: vitest (`app.request`)
**Target Platform**: Node.js server
**Project Type**: Single project (API)
**Constraints**: 서버측 총액 계산, 클라이언트 total 무시
**Scale/Scope**: 단일 프로세스, 주문 3개 엔드포인트

## Constitution Check

*GATE.*
- I Spec-Driven ✓ · II Test-First ✓ · III Thin Storage(`OrderStore` 인터페이스) ✓ · IV Explicit Errors(400/404) ✓ · V Server Authority(총액 서버 계산) ✓
→ 위반 없음.

## Project Structure

### Documentation (this feature)
```text
specs/002-order-management/
├── plan.md · research.md · data-model.md · quickstart.md · contracts/ · tasks.md
```

### Source Code (repository root)
```text
src/
├── store.ts      # Order, OrderItem, OrderStore, InMemoryOrderStore 추가
├── orders.ts     # createOrderRoutes (신설)
└── index.ts      # 하나의 ProductStore를 product·order 라우트에 공유 주입
```
**Structure Decision**: 001과 동일 single project. `store.ts`에 Order 계열을 추가하고 `orders.ts`를 신설한다.

## Complexity Tracking

위반 없음 — 비움.
