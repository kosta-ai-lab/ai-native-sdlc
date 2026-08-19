import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { createMarketplaceOrderRoutes } from './multiseller-orders'
import { createMarketplacePaymentRoutes } from './multiseller-payments'
import { createMarketplaceShippingRoutes } from './marketplace-shipping'
import {
  InMemoryProductStore,
  InMemorySellerStore,
  InMemoryInventoryStore,
  InMemorySubOrderStore,
  InMemoryMarketOrderStore,
  InMemoryPaymentStore,
  InMemoryShipmentStore,
} from './store'

/**
 * 004 주문 + 005 결제 + 006 배송 라우트를 store를 공유해 함께 마운트한다.
 * 배송은 005가 만든 "결제완료" SubOrder 위에 얹히므로, 실제 주문·결제 경로로 픽스처를 만든다.
 */
function setup() {
  const products = new InMemoryProductStore()
  const sellers = new InMemorySellerStore()
  const inventory = new InMemoryInventoryStore()
  const subOrders = new InMemorySubOrderStore()
  const orders = new InMemoryMarketOrderStore()
  const payments = new InMemoryPaymentStore()
  const shipments = new InMemoryShipmentStore()

  const app = new Hono()
  app.route('/', createMarketplaceOrderRoutes(products, sellers, inventory, subOrders, orders))
  app.route('/', createMarketplacePaymentRoutes(payments, orders, subOrders, inventory))
  app.route('/', createMarketplaceShippingRoutes(subOrders, shipments))

  return { products, sellers, inventory, subOrders, orders, payments, shipments, app }
}

const send = (method: string, body?: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body ?? {}),
})

function seedProduct(ctx: ReturnType<typeof setup>, opts: { name: string; price: number; stock: number }) {
  const sellerId = ctx.sellers.create({ name: `seller-${opts.name}`, status: '승인', commissionRate: 0.1 }).id
  const product = ctx.products.create({ name: opts.name, price: opts.price, stock: opts.stock, sellerId })
  ctx.inventory.set(product.id, opts.stock)
  return { product, sellerId }
}

/** 단일 판매자 상품으로 "결제완료"된 SubOrder 하나를 만들어 반환한다(수락 직전 상태). */
async function seedPaidSubOrder(ctx: ReturnType<typeof setup>) {
  const { product } = seedProduct(ctx, { name: 'A', price: 1000, stock: 5 })
  const orderRes = await ctx.app.request('/marketplace/orders', send('POST', { items: [{ productId: product.id, quantity: 2 }] }))
  const order = await orderRes.json()
  await ctx.app.request(`/marketplace/orders/${order.id}/pay`, send('POST', { idempotencyKey: 'pay' }))
  const [subOrder] = ctx.subOrders.listByOrder(order.id)
  expect(subOrder.status).toBe('결제완료')
  return { order, subOrder }
}

/** 결제완료 → 수락 → 배송 접수까지 진행해 "배송중" Shipment를 반환한다. */
async function seedShippedSubOrder(ctx: ReturnType<typeof setup>) {
  const { order, subOrder } = await seedPaidSubOrder(ctx)
  await ctx.app.request(`/marketplace/suborders/${subOrder.id}/accept`, send('POST'))
  const shipRes = await ctx.app.request(`/marketplace/suborders/${subOrder.id}/ship`, send('POST', { carrierId: 'CJ' }))
  const shipment = await shipRes.json()
  return { order, subOrderId: subOrder.id, shipment }
}

// ─────────────────────────────────────────────────────────────
// User Story 1 — Ship a sub-order (FR-001, FR-002, FR-003, FR-004, FR-005)
// ─────────────────────────────────────────────────────────────
describe('POST /marketplace/suborders/:id/accept — seller accept', () => {
  it('accepts a 결제완료 sub-order and moves it to 수락됨 (200) — FR-001', async () => {
    const ctx = setup()
    const { subOrder } = await seedPaidSubOrder(ctx)

    const res = await ctx.app.request(`/marketplace/suborders/${subOrder.id}/accept`, send('POST'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('수락됨')
    expect(ctx.subOrders.get(subOrder.id)!.status).toBe('수락됨')
  })

  it('409 when accepting an unpaid (결제대기) sub-order — FR-001, SC-003', async () => {
    const ctx = setup()
    const { product } = seedProduct(ctx, { name: 'A', price: 1000, stock: 5 })
    const orderRes = await ctx.app.request('/marketplace/orders', send('POST', { items: [{ productId: product.id, quantity: 1 }] }))
    const order = await orderRes.json()
    // 결제하지 않음 → SubOrder는 "결제대기"
    const [subOrder] = ctx.subOrders.listByOrder(order.id)
    expect(subOrder.status).toBe('결제대기')

    const res = await ctx.app.request(`/marketplace/suborders/${subOrder.id}/accept`, send('POST'))
    expect(res.status).toBe(409)
  })

  it('404 when accepting an unknown sub-order — FR-005', async () => {
    const ctx = setup()
    const res = await ctx.app.request('/marketplace/suborders/nope/accept', send('POST'))
    expect(res.status).toBe(404)
  })
})

describe('POST /marketplace/suborders/:id/ship — carrier pickup', () => {
  it('creates a 배송중 Shipment and sets the sub-order to 배송중 (201) — FR-002', async () => {
    const ctx = setup()
    const { subOrder } = await seedPaidSubOrder(ctx)
    await ctx.app.request(`/marketplace/suborders/${subOrder.id}/accept`, send('POST'))

    const res = await ctx.app.request(`/marketplace/suborders/${subOrder.id}/ship`, send('POST', { carrierId: 'CJ' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.status).toBe('배송중') // Shipment.status
    expect(body.subOrderId).toBe(subOrder.id)
    expect(body.carrierId).toBe('CJ')
    expect(ctx.subOrders.get(subOrder.id)!.status).toBe('배송중')
  })

  it('409 when shipping a sub-order that was not accepted (still 결제완료)', async () => {
    const ctx = setup()
    const { subOrder } = await seedPaidSubOrder(ctx)
    const res = await ctx.app.request(`/marketplace/suborders/${subOrder.id}/ship`, send('POST'))
    expect(res.status).toBe(409)
  })

  it('404 when shipping an unknown sub-order — FR-005', async () => {
    const ctx = setup()
    const res = await ctx.app.request('/marketplace/suborders/nope/ship', send('POST'))
    expect(res.status).toBe(404)
  })
})

describe('POST /marketplace/shipments/:id/deliver — markDelivered', () => {
  it('completes the shipment, sets the sub-order to 배송완료, and enters the settlement queue (200) — FR-003, SC-001', async () => {
    const ctx = setup()
    const { subOrderId, shipment } = await seedShippedSubOrder(ctx)

    // 배송완료 전에는 정산 큐가 비어 있다 (원칙 IX)
    expect(ctx.subOrders.listByStatus('배송완료')).toHaveLength(0)

    const res = await ctx.app.request(`/marketplace/shipments/${shipment.id}/deliver`, send('POST'))
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.status).toBe('완료') // Shipment.status
    expect(body.deliveredAt).toBeTruthy()
    expect(body.subOrder.status).toBe('배송완료')
    expect(ctx.subOrders.get(subOrderId)!.status).toBe('배송완료')

    // SC-001: 배송완료 후에만 정산 큐에 진입
    const queue = ctx.subOrders.listByStatus('배송완료')
    expect(queue).toHaveLength(1)
    expect(queue[0].id).toBe(subOrderId)
  })

  it('is idempotent — a second markDelivered does not double-register in the settlement queue — FR-004, SC-002', async () => {
    const ctx = setup()
    const { subOrderId, shipment } = await seedShippedSubOrder(ctx)

    const first = await (await ctx.app.request(`/marketplace/shipments/${shipment.id}/deliver`, send('POST'))).json()
    const deliveredAtAfterFirst = first.deliveredAt

    const res2 = await ctx.app.request(`/marketplace/shipments/${shipment.id}/deliver`, send('POST'))
    expect(res2.status).toBe(200)
    const second = await res2.json()

    // 원 결과 반환: deliveredAt이 재-기록되지 않는다(부작용 없음)
    expect(second.deliveredAt).toBe(deliveredAtAfterFirst)
    expect(second.subOrder.status).toBe('배송완료')

    // 정산 큐에 정확히 한 번만 존재 (중복 등록 없음)
    const queue = ctx.subOrders.listByStatus('배송완료')
    expect(queue.filter((s) => s.id === subOrderId)).toHaveLength(1)
    expect(queue).toHaveLength(1)
  })

  it('404 when delivering an unknown shipment — FR-005', async () => {
    const ctx = setup()
    const res = await ctx.app.request('/marketplace/shipments/nope/deliver', send('POST'))
    expect(res.status).toBe(404)
  })
})

// ─────────────────────────────────────────────────────────────
// User Story 2 — Track shipment
// ─────────────────────────────────────────────────────────────
describe('GET /marketplace/shipments/:id — track shipment', () => {
  it('returns the current status of an in-progress shipment (200)', async () => {
    const ctx = setup()
    const { shipment } = await seedShippedSubOrder(ctx)

    const res = await ctx.app.request(`/marketplace/shipments/${shipment.id}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(shipment.id)
    expect(body.status).toBe('배송중')
  })

  it('404 for an unknown shipment', async () => {
    const ctx = setup()
    const res = await ctx.app.request('/marketplace/shipments/nope')
    expect(res.status).toBe(404)
  })
})
