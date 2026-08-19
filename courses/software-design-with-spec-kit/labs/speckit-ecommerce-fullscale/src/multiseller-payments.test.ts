import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { createMarketplaceOrderRoutes } from './multiseller-orders'
import { createMarketplacePaymentRoutes } from './multiseller-payments'
import {
  InMemoryProductStore,
  InMemorySellerStore,
  InMemoryInventoryStore,
  InMemorySubOrderStore,
  InMemoryMarketOrderStore,
  InMemoryPaymentStore,
} from './store'

/**
 * 004 주문 라우트 + 005 결제 라우트를 store를 공유해 함께 마운트한다.
 * 결제는 004가 만든 "결제대기" SubOrder 위에 얹히므로, 실제 주문 생성 경로로 픽스처를 만든다.
 */
function setup() {
  const products = new InMemoryProductStore()
  const sellers = new InMemorySellerStore()
  const inventory = new InMemoryInventoryStore()
  const subOrders = new InMemorySubOrderStore()
  const orders = new InMemoryMarketOrderStore()
  const payments = new InMemoryPaymentStore()

  const app = new Hono()
  app.route('/', createMarketplaceOrderRoutes(products, sellers, inventory, subOrders, orders))
  app.route('/', createMarketplacePaymentRoutes(payments, orders, subOrders, inventory))

  return { products, sellers, inventory, subOrders, orders, payments, app }
}

const send = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

function seedProduct(
  ctx: ReturnType<typeof setup>,
  opts: { name: string; price: number; stock: number; sellerId?: string },
) {
  const sellerId =
    opts.sellerId ?? ctx.sellers.create({ name: `seller-${opts.name}`, status: '승인', commissionRate: 0.1 }).id
  const product = ctx.products.create({ name: opts.name, price: opts.price, stock: opts.stock, sellerId })
  ctx.inventory.set(product.id, opts.stock)
  return { product, sellerId }
}

/** 두 판매자 상품으로 "결제대기" 멀티셀러 주문을 만들어 반환한다(재고 선점 완료 상태). */
async function seedPendingOrder(ctx: ReturnType<typeof setup>) {
  const { product: a } = seedProduct(ctx, { name: 'A', price: 1000, stock: 5 })
  const { product: b } = seedProduct(ctx, { name: 'B', price: 250, stock: 5 })
  const res = await ctx.app.request(
    '/marketplace/orders',
    send('POST', { items: [{ productId: a.id, quantity: 2 }, { productId: b.id, quantity: 3 }] }),
  )
  const order = await res.json()
  return { order, a, b } // total = 1000*2 + 250*3 = 2750
}

// ─────────────────────────────────────────────────────────────
// User Story 1 — Authorize a payment (FR-001, FR-002, FR-003, FR-005)
// ─────────────────────────────────────────────────────────────
describe('POST /marketplace/orders/:id/pay — authorize', () => {
  it('authorizes for the order total and moves every SubOrder to 결제완료 (200)', async () => {
    const ctx = setup()
    const { order } = await seedPendingOrder(ctx)

    const res = await ctx.app.request(`/marketplace/orders/${order.id}/pay`, send('POST', { idempotencyKey: 'key-1' }))
    expect(res.status).toBe(200)
    const payment = await res.json()

    expect(payment.status).toBe('승인') // FR-001
    expect(payment.amount).toBe(2750) // 서버 권위(V): order.total로 청구
    expect(payment.orderId).toBe(order.id)
    // FR-003 / SC-002: 모든 SubOrder 결제완료
    expect(payment.subOrders).toHaveLength(2)
    for (const so of payment.subOrders) expect(so.status).toBe('결제완료')
    expect(ctx.payments.get(payment.id)!.status).toBe('승인')
  })

  it('ignores a client-supplied amount and charges the server total (V)', async () => {
    const ctx = setup()
    const { order } = await seedPendingOrder(ctx)
    const res = await ctx.app.request(
      `/marketplace/orders/${order.id}/pay`,
      send('POST', { idempotencyKey: 'key-amt', amount: 1 }),
    )
    const payment = await res.json()
    expect(payment.amount).toBe(2750)
  })

  // FR-002 / SC-001 — 멱등: 같은 key 2회 → 청구 1회
  it('returns the original result and charges once on a repeated key (idempotent)', async () => {
    const ctx = setup()
    const { order } = await seedPendingOrder(ctx)

    const first = await (
      await ctx.app.request(`/marketplace/orders/${order.id}/pay`, send('POST', { idempotencyKey: 'dup' }))
    ).json()
    const second = await (
      await ctx.app.request(`/marketplace/orders/${order.id}/pay`, send('POST', { idempotencyKey: 'dup' }))
    ).json()

    expect(second.id).toBe(first.id) // 같은 Payment 반환
    expect(second.amount).toBe(first.amount)
    // 단 하나의 Payment만 존재 = 1회 청구 (SC-001)
    const all = [ctx.payments.get(first.id), ctx.payments.getByKey('dup')]
    expect(all[0]!.id).toBe(all[1]!.id)
  })

  it('404 for an unknown order', async () => {
    const ctx = setup()
    const res = await ctx.app.request('/marketplace/orders/nope/pay', send('POST', { idempotencyKey: 'k' }))
    expect(res.status).toBe(404)
  })

  it('409 when paying a cancelled order', async () => {
    const ctx = setup()
    const { order } = await seedPendingOrder(ctx)
    await ctx.app.request(`/marketplace/orders/${order.id}/cancel`, { method: 'POST' })
    const res = await ctx.app.request(`/marketplace/orders/${order.id}/pay`, send('POST', { idempotencyKey: 'k' }))
    expect(res.status).toBe(409)
  })

  it('400 when idempotencyKey is missing', async () => {
    const ctx = setup()
    const { order } = await seedPendingOrder(ctx)
    const res = await ctx.app.request(`/marketplace/orders/${order.id}/pay`, send('POST', {}))
    expect(res.status).toBe(400)
  })
})

// ─────────────────────────────────────────────────────────────
// User Story 2 — Void a payment (FR-004, FR-005)
// ─────────────────────────────────────────────────────────────
describe('POST /marketplace/payments/:id/void — void before shipping', () => {
  it('voids the payment, releases reserved stock, and sets SubOrders to 환불중 (200)', async () => {
    const ctx = setup()
    const { order, a, b } = await seedPendingOrder(ctx)
    // 선점 상태 확인
    expect(ctx.inventory.get(a.id)!.reserved).toBe(2)
    expect(ctx.inventory.get(b.id)!.reserved).toBe(3)

    const payment = await (
      await ctx.app.request(`/marketplace/orders/${order.id}/pay`, send('POST', { idempotencyKey: 'pay' }))
    ).json()

    const res = await ctx.app.request(`/marketplace/payments/${payment.id}/void`, { method: 'POST' })
    expect(res.status).toBe(200)
    const voided = await res.json()

    expect(voided.status).toBe('void') // FR-004
    for (const so of voided.subOrders) expect(so.status).toBe('환불중')
    // SC-003: 선점 수량 정확히 release
    expect(ctx.inventory.get(a.id)!.reserved).toBe(0)
    expect(ctx.inventory.get(b.id)!.reserved).toBe(0)
    expect(ctx.inventory.available(a.id)).toBe(5)
    expect(ctx.inventory.available(b.id)).toBe(5)
  })

  // FR-004 — 멱등: 같은 결제 2회 void → 환불 1회(재고 중복 release 없음)
  it('is idempotent — a second void returns the original result without double-releasing stock', async () => {
    const ctx = setup()
    const { order, a } = await seedPendingOrder(ctx)
    const payment = await (
      await ctx.app.request(`/marketplace/orders/${order.id}/pay`, send('POST', { idempotencyKey: 'pay' }))
    ).json()

    const first = await (
      await ctx.app.request(`/marketplace/payments/${payment.id}/void`, { method: 'POST' })
    ).json()
    const reservedAfterFirst = ctx.inventory.get(a.id)!.reserved

    const res2 = await ctx.app.request(`/marketplace/payments/${payment.id}/void`, { method: 'POST' })
    expect(res2.status).toBe(200)
    const second = await res2.json()

    expect(second.id).toBe(first.id)
    expect(second.status).toBe('void')
    // 두 번째 void가 재고를 또 건드리지 않았다 (중복 환불 없음)
    expect(ctx.inventory.get(a.id)!.reserved).toBe(reservedAfterFirst)
  })

  it('404 for an unknown payment', async () => {
    const ctx = setup()
    const res = await ctx.app.request('/marketplace/payments/nope/void', { method: 'POST' })
    expect(res.status).toBe(404)
  })

  it('409 when voiding an order that is no longer in a pre-shipping state (delivered → 008)', async () => {
    const ctx = setup()
    const { order } = await seedPendingOrder(ctx)
    const payment = await (
      await ctx.app.request(`/marketplace/orders/${order.id}/pay`, send('POST', { idempotencyKey: 'pay' }))
    ).json()

    // 배송 이후 상태를 시뮬레이션: SubOrder를 결제완료가 아닌 상태로 밀어 둔다(006이 도입할 상태 대역).
    // 여기서는 이미 환불중으로 옮겨 "배송 전(결제완료)이 아님"을 만든다 → void 대상 아님.
    for (const so of ctx.subOrders.listByOrder(order.id)) ctx.subOrders.setStatus(so.id, '환불중')

    const res = await ctx.app.request(`/marketplace/payments/${payment.id}/void`, { method: 'POST' })
    expect(res.status).toBe(409)
  })
})
