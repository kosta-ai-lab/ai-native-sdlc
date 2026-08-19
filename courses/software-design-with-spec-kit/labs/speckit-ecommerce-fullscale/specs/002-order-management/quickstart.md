# Quickstart: Order Management (Phase 1)

## E2E 검증 (SC-001 ~ SC-003)
```bash
pnpm dev   # :3000
PID=$(curl -s -X POST localhost:3000/products -H 'content-type: application/json' \
  -d '{"name":"Keyboard","price":4200,"stock":10}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')

curl -X POST localhost:3000/orders -H 'content-type: application/json' \
  -d "{\"items\":[{\"productId\":\"$PID\",\"quantity\":2}]}"   # 201, total=8400, status=pending
curl localhost:3000/orders                                      # 200 [ ... ]
curl -X POST localhost:3000/orders -H 'content-type: application/json' -d '{"items":[]}'   # 400
curl -X POST localhost:3000/orders -H 'content-type: application/json' \
  -d '{"items":[{"productId":"nope","quantity":1}]}'            # 404
```

## 테스트
```bash
pnpm test
```
