import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { createMarketplaceOrderRoutes } from './multiseller-orders'
import { createMarketplacePaymentRoutes } from './multiseller-payments'
import { createMarketplaceShippingRoutes } from './marketplace-shipping'
import { createMarketplaceSettlementRoutes } from './marketplace-settlement'
import { createMarketplaceRefundRoutes } from './marketplace-refund'
import {
  InMemoryProductStore,
  InMemorySellerStore,
  InMemoryInventoryStore,
  InMemorySubOrderStore,
  InMemoryMarketOrderStore,
  InMemoryPaymentStore,
  InMemoryShipmentStore,
  InMemorySettlementStore,
  InMemoryRefundStore,
} from './store'

/**
 * 004 주문 + 005 결제 + 006 배송 + 007 정산 + 008 환불 라우트를 store를 공유해 함께 마운트한다.
 * 환불은 004~007이 만든 SubOrder 상태(결제완료·배송완료·정산완료) 위에 얹히므로,
 * 실제 주문→결제→(배송→배송완료→정산) 경로로 픽스처를 만든다.
 */
function setup() {
  const products = new InMemoryProductStore()
  const sellers = new InMemorySellerStore()
  const inventory = new InMemoryInventoryStore()
  const subOrders = new InMemorySubOrderStore()
  const orders = new InMemoryMarketOrderStore()
  const payments = new InMemoryPaymentStore()
  const shipments = new InMemoryShipmentStore()
  const settlements = new InMemorySettlementStore()
  const refunds = new InMemoryRefundStore()

  const app = new Hono()
  app.route('/', createMarketplaceOrderRoutes(products, sellers, inventory, subOrders, orders))
  app.route('/', createMarketplacePaymentRoutes(payments, orders, subOrders, inventory))
  app.route('/', createMarketplaceShippingRoutes(subOrders, shipments))
  app.route('/', createMarketplaceSettlementRoutes(subOrders, sellers, settlements))
  app.route('/', createMarketplaceRefundRoutes(refunds, payments, subOrders, inventory, settlements))

  return { products, sellers, inventory, subOrders, orders, payments, shipments, settlements, refunds, app }
}

const send = (method: string, body?: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body ?? {}),
})

/** 승인된 판매자 + 상품 + 재고를 하나 만든다. */
function seedSeller(
  ctx: ReturnType<typeof setup>,
  opts: { name: string; price: number; stock: number; commissionRate: number },
) {
  const sellerId = ctx.sellers.create({ name: `seller-${opts.name}`, status: '승인', commissionRate: opts.commissionRate }).id
  const product = ctx.products.create({ name: opts.name, price: opts.price, stock: opts.stock, sellerId })
  ctx.inventory.set(product.id, opts.stock)
  return { sellerId, product }
}

/** 주문→결제까지 진행해 "결제완료" SubOrder(배송 전)를 반환한다. */
async function seedPaidSubOrder(
  ctx: ReturnType<typeof setup>,
  product: { id: string },
  quantity: number,
  idempotencyKey: string,
) {
  const orderRes = await ctx.app.request('/marketplace/orders', send('POST', { items: [{ productId: product.id, quantity }] }))
  const order = await orderRes.json()
  await ctx.app.request(`/marketplace/orders/${order.id}/pay`, send('POST', { idempotencyKey }))
  const [subOrder] = ctx.subOrders.listByOrder(order.id)
  expect(subOrder.status).toBe('결제완료')
  return subOrder.id as string
}

/** 배송완료까지 진행해 "배송완료" SubOrder id를 반환한다(정산 큐 진입). */
async function seedDeliveredSubOrder(
  ctx: ReturnType<typeof setup>,
  product: { id: string },
  quantity: number,
  idempotencyKey: string,
) {
  const subOrderId = await seedPaidSubOrder(ctx, product, quantity, idempotencyKey)
  await ctx.app.request(`/marketplace/suborders/${subOrderId}/accept`, send('POST'))
  const shipRes = await ctx.app.request(`/marketplace/suborders/${subOrderId}/ship`, send('POST', { carrierId: 'CJ' }))
  const shipment = await shipRes.json()
  await ctx.app.request(`/marketplace/shipments/${shipment.id}/deliver`, send('POST'))
  expect(ctx.subOrders.get(subOrderId)!.status).toBe('배송완료')
  return subOrderId
}

// ─────────────────────────────────────────────────────────────
// User Story 1 — Refund before delivery (FR-001, FR-005, SC-001·003)
// ─────────────────────────────────────────────────────────────
describe('POST /marketplace/suborders/:id/refund — before delivery (005 void 재사용)', () => {
  it('voids the payment, releases reserved stock, and marks 환불완료 (FR-001, SC-001)', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 10, commissionRate: 0.1 })
    const subId = await seedPaidSubOrder(ctx, product, 3, 'k1') // subtotal 3000, reserved 3

    // 환불 전: 재고 3 선점(available = 10 − 3 = 7)
    expect(ctx.inventory.available(product.id)).toBe(7)

    const res = await ctx.app.request(`/marketplace/suborders/${subId}/refund`, send('POST'))
    expect(res.status).toBe(200)
    const refund = await res.json()

    // 결제 void(멱등 경로 재사용)
    const sub = ctx.subOrders.get(subId)!
    const payment = ctx.payments.getByOrder(sub.orderId)!
    expect(payment.status).toBe('void')

    // 선점 재고 release → 다시 available 10
    expect(ctx.inventory.available(product.id)).toBe(10)

    // SubOrder "환불완료", Refund 전액(subtotal)
    expect(sub.status).toBe('환불완료')
    expect(refund.amount).toBe(3000)
    expect(refund.subOrderId).toBe(subId)
    expect(refund.paymentId).toBe(payment.id)
  })

  it('returns 404 for an unknown sub-order (FR-005)', async () => {
    const ctx = setup()
    const res = await ctx.app.request('/marketplace/suborders/nope/refund', send('POST'))
    expect(res.status).toBe(404)
  })

  it('is idempotent — a repeated refund does not double-void or double-release; returns the original refund (FR-005, SC-003)', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 10, commissionRate: 0.1 })
    const subId = await seedPaidSubOrder(ctx, product, 3, 'k1')

    const first = await (await ctx.app.request(`/marketplace/suborders/${subId}/refund`, send('POST'))).json()
    const availAfterFirst = ctx.inventory.available(product.id)
    expect(availAfterFirst).toBe(10) // release 1회

    const res2 = await ctx.app.request(`/marketplace/suborders/${subId}/refund`, send('POST'))
    expect(res2.status).toBe(200)
    const second = await res2.json()

    // 원 Refund 그대로 반환(같은 id), 이중 release 없음(available 변화 없음)
    expect(second.id).toBe(first.id)
    expect(second.amount).toBe(first.amount)
    expect(ctx.inventory.available(product.id)).toBe(10)
    expect(ctx.subOrders.get(subId)!.status).toBe('환불완료')
  })
})

// ─────────────────────────────────────────────────────────────
// User Story 2 — Refund after delivery / after settlement (FR-002·003)
// ─────────────────────────────────────────────────────────────
describe('POST /marketplace/suborders/:id/refund — after delivery', () => {
  it('delivered but not settled: removes from settlement queue and marks 환불완료 (FR-002)', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 10, commissionRate: 0.1 })
    const subId = await seedDeliveredSubOrder(ctx, product, 2, 'k1') // 배송완료, 정산 큐 진입

    // 환불 전: 정산 큐(배송완료)에 잡힘
    expect(ctx.subOrders.listByStatus('배송완료').map((s) => s.id)).toContain(subId)

    const res = await ctx.app.request(`/marketplace/suborders/${subId}/refund`, send('POST'))
    expect(res.status).toBe(200)

    // status="환불완료" → 정산 큐에서 제외
    expect(ctx.subOrders.get(subId)!.status).toBe('환불완료')
    expect(ctx.subOrders.listByStatus('배송완료').map((s) => s.id)).not.toContain(subId)

    // 후속 정산 run: 이 건은 집계되지 않는다
    const settlements = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    expect(settlements).toHaveLength(0)
  })

  it('already settled: schedules a settlement reversal deducted in the next cycle and marks 환불완료 (FR-002·003, 007 연동)', async () => {
    const ctx = setup()
    const { product, sellerId } = seedSeller(ctx, { name: 'A', price: 1000, stock: 20, commissionRate: 0.1 })
    const subId = await seedDeliveredSubOrder(ctx, product, 2, 'k1') // 배송완료, subtotal 2000

    // 1주기 정산 → 정산완료
    const cycle1 = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    expect(cycle1[0].netPayout).toBe(1800) // 2000 − 200
    expect(ctx.subOrders.get(subId)!.status).toBe('정산완료')

    // 정산완료 건 환불 → 007 역산 훅 재사용(차기 주기 예약)
    const res = await ctx.app.request(`/marketplace/suborders/${subId}/refund`, send('POST'))
    expect(res.status).toBe(200)
    expect(ctx.subOrders.get(subId)!.status).toBe('환불완료')
    // 역산 대기에 등록됨(007 pendingReversals)
    expect(ctx.settlements.pendingReversals().map((r) => r.subOrderId)).toContain(subId)

    // 2주기: 새 배송완료 1건(3000) + 역산(−2000)
    await seedDeliveredSubOrder(ctx, product, 3, 'k2') // 3000
    const cycle2 = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    const s2 = cycle2.find((s: { sellerId: string }) => s.sellerId === sellerId)!
    // netPayout = 3000 − 300 − 2000(역산) = 700
    expect(s2.netPayout).toBe(700)
    const reversalItem = ctx.settlements.listItems(s2.id).find((i) => i.reversal)!
    expect(reversalItem.amount).toBe(-2000)
    expect(reversalItem.subOrderId).toBe(subId)
  })

  it('is idempotent on a settled refund — a repeated request does not schedule a second reversal (SC-003)', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 10, commissionRate: 0.1 })
    const subId = await seedDeliveredSubOrder(ctx, product, 2, 'k1')
    await ctx.app.request('/marketplace/settlements/run', send('POST'))

    const first = await (await ctx.app.request(`/marketplace/suborders/${subId}/refund`, send('POST'))).json()
    const second = await (await ctx.app.request(`/marketplace/suborders/${subId}/refund`, send('POST'))).json()

    expect(second.id).toBe(first.id)
    // 역산은 한 번만 예약(중복 등록 없음)
    expect(ctx.settlements.pendingReversals().filter((r) => r.subOrderId === subId)).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────
// Partial refund & validation (FR-004)
// ─────────────────────────────────────────────────────────────
describe('POST /marketplace/suborders/:id/refund — partial refund & validation (FR-004)', () => {
  it('applies only the requested amount for a partial refund', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 10, commissionRate: 0.1 })
    const subId = await seedPaidSubOrder(ctx, product, 5, 'k1') // subtotal 5000

    const res = await ctx.app.request(`/marketplace/suborders/${subId}/refund`, send('POST', { amount: 2000 }))
    expect(res.status).toBe(200)
    const refund = await res.json()
    expect(refund.amount).toBe(2000) // 요청 금액만 반영(전액 아님)
    expect(ctx.subOrders.get(subId)!.status).toBe('환불완료')
  })

  it('deducts the partial amount on a settled refund reversal (FR-004 × 007)', async () => {
    const ctx = setup()
    const { product, sellerId } = seedSeller(ctx, { name: 'A', price: 1000, stock: 20, commissionRate: 0.1 })
    const subId = await seedDeliveredSubOrder(ctx, product, 3, 'k1') // subtotal 3000
    await ctx.app.request('/marketplace/settlements/run', send('POST'))

    // 부분 환불 1200 → 차기 주기 역산 1200만 차감
    await ctx.app.request(`/marketplace/suborders/${subId}/refund`, send('POST', { amount: 1200 }))
    await seedDeliveredSubOrder(ctx, product, 2, 'k2') // 2000
    const cycle2 = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    const s2 = cycle2.find((s: { sellerId: string }) => s.sellerId === sellerId)!
    // netPayout = 2000 − 200 − 1200 = 600
    expect(s2.netPayout).toBe(600)
  })

  it('returns 400 when amount exceeds subtotal (FR-004)', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 10, commissionRate: 0.1 })
    const subId = await seedPaidSubOrder(ctx, product, 2, 'k1') // subtotal 2000

    const res = await ctx.app.request(`/marketplace/suborders/${subId}/refund`, send('POST', { amount: 2001 }))
    expect(res.status).toBe(400)
    // 부작용 없음: 여전히 결제완료
    expect(ctx.subOrders.get(subId)!.status).toBe('결제완료')
  })

  it('returns 400 for a non-positive amount (FR-004)', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 10, commissionRate: 0.1 })
    const subId = await seedPaidSubOrder(ctx, product, 2, 'k1')

    const res = await ctx.app.request(`/marketplace/suborders/${subId}/refund`, send('POST', { amount: 0 }))
    expect(res.status).toBe(400)
    expect(ctx.subOrders.get(subId)!.status).toBe('결제완료')
  })
})
