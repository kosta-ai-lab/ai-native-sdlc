# Spec Kit 트랙 교재 — 목차

상품·주문 e-커머스 REST API를 **GitHub Spec Kit(스펙주도개발)**으로, `constitution → specify → plan → tasks → implement` 워크플로우로 개발한 교재입니다. OpenSpec 트랙(`../../openspec-ecommerce-api`)의 짝으로, 같은 기능을 두 방법론으로 만들어 비교합니다.

## 읽는 순서
1. **[../openspec-vs-speckit.md](../openspec-vs-speckit.md)** — 두 도구 구조·워크플로우 실측 비교(먼저 읽기).
2. **[01-product-catalog.md](01-product-catalog.md)** — Spec Kit 한 사이클(constitution~implement), OpenSpec과 산출물 매핑.
3. **[02-orders-and-change-management.md](02-orders-and-change-management.md)** — 다중 feature(002·003)와 **"delta vs 새 feature"** 대조.

## Spec Kit 산출물 (feature별)
```text
specs/
├── 001-product-catalog/          # 상품 CRUD
├── 002-order-management/         # 주문(상품 참조·서버 총액)
└── 003-order-stock-cancellation/ # 재고 차감·취소(변경 관리)
    └── 각 폴더: spec · plan · research · data-model · contracts/ · quickstart · tasks
```

## 재현 (스냅샷 태그)
```bash
git tag -l
#   speckit-product-catalog            상품 CRUD(001)
#   speckit-order-management           주문(002)
#   speckit-order-stock-cancellation   재고·취소(003)
git checkout <tag>
```

## 결과 현황
- **34 tests**, 3 feature (상품 CRUD / 주문 / 재고·취소)
- OpenSpec 트랙(change 3개)과 **대칭 완성** — 같은 도메인을 두 방법론으로 개발한 정면 비교 자산
