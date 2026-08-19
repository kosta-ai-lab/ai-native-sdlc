# Quickstart: Product Catalog (Phase 1)

## 사전조건
```bash
pnpm install
```

## E2E 검증 (SC-001 ~ SC-004)
```bash
pnpm dev   # :3000
curl -X POST localhost:3000/products -H 'content-type: application/json' \
  -d '{"name":"Keyboard","price":4200,"stock":10}'   # 201 + { id, ... }
curl localhost:3000/products                         # 200 [ ... ]
curl localhost:3000/products/<id>                    # 200
curl localhost:3000/products/nope                    # 404
curl -X POST localhost:3000/products -H 'content-type: application/json' \
  -d '{"price":-1}'                                   # 400
```

## 테스트
```bash
pnpm test
```
