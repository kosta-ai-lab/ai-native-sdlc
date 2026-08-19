# OpenSpec 트랙 교재 — 목차

상품·주문 e-커머스 REST API를 **OpenSpec(스펙주도개발)**으로, `init`부터 실제 개발자 무브로 만든 재현 가능한 교재입니다. 각 문서는 실행된 명령·산출물·커밋을 근거로 합니다.

## 읽는 순서
1. **[00-openspec-workflows.md](00-openspec-workflows.md)** — 워크플로우 지도(기본 3 + 확장 7). 먼저 읽어 전체 그림을 잡는다.
2. **[01-product-catalog.md](01-product-catalog.md)** — 기본 사이클 propose→apply→verify→archive, delta 작성, validate --strict.
3. **[02-order-management.md](02-order-management.md)** — 다중 change, 엔티티 관계(주문↔상품), 서버측 총액, 검증 순서.
4. **[03-order-stock-and-cancellation.md](03-order-stock-and-cancellation.md)** — MODIFIED delta, 재고 차감/복원, 상태 전이, archive sync.
5. **[04-extended-workflows-handson.md](04-extended-workflows-handson.md)** — 확장 워크플로우 실습(new/continue·sync·bulk-archive·explore).
- **[_openspec-commands.md](_openspec-commands.md)** — 검증된 OpenSpec 1.5 CLI 명령 레퍼런스.

## 재현 (스냅샷 태그)
```bash
git tag -l
#   step-00-init                       openspec init 직후
#   act1-product-catalog               상품 CRUD 완료
#   act1-order-management              주문(엔티티 관계) 완료
#   act2-order-stock-and-cancellation  재고·취소(MODIFIED delta) 완료
git checkout <tag>          # 그 시점을 그대로 재현
```
각 change 안에서는 무브 단위 커밋(`feat: …`)으로 개발 여정이 그대로 남습니다.

## 결과 현황
- **47 tests** (product·order·store·harness), `pnpm test`
- main spec 2 capability: `product-catalog`(5 requirements), `order-management`(4: Create/List/Get/Cancel)
- 36 commits, 4 재현 태그

## 다음 확장 (예정)
- OpenSpec 확장 워크플로우 실행 실습: `new`/`continue`(단계별)·`sync`(병렬 병합)·`bulk-archive`(충돌 해결)
- 하네스 `claude -p` 여정 자동화(회귀 검증)
- Spec Kit 트랙과의 정면 비교(→ `speckit-ecommerce-api`)
