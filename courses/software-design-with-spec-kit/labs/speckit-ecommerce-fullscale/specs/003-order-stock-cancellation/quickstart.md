# Quickstart: Order Stock and Cancellation (Phase 1)

## E2E 검증 (SC-001 ~ SC-004)
```bash
pnpm dev   # :3000
PID=$(curl -s -X POST localhost:3000/products -H 'content-type: application/json' \
  -d '{"name":"Widget","price":100,"stock":5}' | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')

OID=$(curl -s -X POST localhost:3000/orders -H 'content-type: application/json' \
  -d "{\"items\":[{\"productId\":\"$PID\",\"quantity\":2}]}" | python3 -c 'import json,sys;print(json.load(sys.stdin)["id"])')
curl localhost:3000/products/$PID          # stock: 3
curl -X POST localhost:3000/orders/$OID/cancel   # 200, status cancelled
curl localhost:3000/products/$PID          # stock: 5 (복원)
curl -X POST localhost:3000/orders -H 'content-type: application/json' \
  -d "{\"items\":[{\"productId\":\"$PID\",\"quantity\":10}]}"   # 409
curl -X POST localhost:3000/orders/$OID/cancel   # 409 (already cancelled)
```

## 테스트
```bash
pnpm test
```
