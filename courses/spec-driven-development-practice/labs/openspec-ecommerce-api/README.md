# openspec-ecommerce-api — 살아있는 교재 (OpenSpec 트랙)

같은 e-커머스 API를 **OpenSpec(스펙주도개발)**으로, 실제 개발자처럼 `init`부터 무브 단위로 만들며, 각 단계를 git 스냅샷으로 박제한 **재현 가능한 교재**입니다. 정본은 사람이 만들고, `harness/`의 `claude -p` 러너는 재현·회귀 검증용입니다.

## 스택
TypeScript · Hono · pnpm · vitest · OpenSpec 1.5

## 실행
```bash
pnpm install
pnpm test        # 47 tests
pnpm dev         # 서버: /health, /products, /orders, /orders/:id/cancel
```

## 교재 (docs/steps/)
- `00-openspec-workflows.md` — 워크플로우 지도(기본 3 + 확장 7), 언제 무엇을 쓰나
- `01-product-catalog.md` — 기본 사이클(propose→apply→verify→archive), delta 작성
- `02-order-management.md` — 다중 change, 엔티티 관계, 서버측 총액, 검증 순서
- `03-order-stock-and-cancellation.md` — **MODIFIED delta**, 재고 차감·복원, 상태 전이
- `_openspec-commands.md` — 검증된 openspec 1.5 CLI 명령

## 재현 (스냅샷 태그)
```bash
git tag -l
#   step-00-init                       openspec init 직후
#   act1-product-catalog               상품 CRUD 완료
#   act1-order-management              주문 완료
#   act2-order-stock-and-cancellation  재고·취소(MODIFIED) 완료
git checkout <tag>     # 그 시점 상태를 그대로 재현
```
각 change 안에서는 무브 단위 커밋(`feat: ...`)으로 개발 여정이 그대로 남아 있습니다.

## 하네스 (재현·회귀 검증)
`harness/`는 SDD 단계를 `claude -p`로 자동 실행하고 검증 후 커밋·태그하는 러너입니다(단계·무브 2계층). `pnpm harness -- --from step-00-init --to step-00-init`.

## 스펙 현황
`openspec list --specs` → `product-catalog`(5 requirements), `order-management`(4 requirements: Create/List/Get/Cancel).

## 시작하기

OpenSpec이 생성하는 파일(`.claude/commands/opsx/`, `.claude/skills/openspec-*`)은 이 사본에 포함하지 않았습니다. 먼저 init을 실행하십시오.

```bash
npx @fission-ai/openspec@latest init
pnpm install
pnpm test
```

`openspec/config.yaml`은 이 프로젝트에 맞게 작성한 내용이니 덮어쓰지 마십시오.
