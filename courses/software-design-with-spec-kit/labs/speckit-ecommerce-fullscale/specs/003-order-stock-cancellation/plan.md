# Implementation Plan: Order Stock and Cancellation

**Branch**: `003-order-stock-cancellation` | **Date**: 2026-07-08 | **Spec**: [spec.md](./spec.md)

## Summary

002 주문에 재고 차감(부족 시 409)과 취소(재고 복원)를 더한다. check-all-then-deduct로 원자성을 지키고, 취소는 역연산으로 재고를 되돌린다.

## Technical Context

**Language/Version**: TypeScript, Node.js (ESM)
**Primary Dependencies**: Hono
**Storage**: in-memory (Product·Order store 공유)
**Testing**: vitest
**Project Type**: Single project (API)
**Constraints**: 확인→차감을 원자적으로(단일 프로세스)

## Constitution Check

*GATE.* I~V ✓ — 특히 IV Explicit Errors(409 conflict), V Server Authority(서버가 재고 조정). 위반 없음.

## Project Structure

### Source Code (repository root)
```text
src/
├── store.ts    # Order.status union('pending'|'cancelled'), OrderStore.setStatus
└── orders.ts   # POST /orders 재고 로직(aggregate·409), POST /orders/:id/cancel
```
**Structure Decision**: 002를 확장한다. 새 파일 없이 `store.ts`·`orders.ts`를 수정한다.

## Complexity Tracking

위반 없음 — 비움.
