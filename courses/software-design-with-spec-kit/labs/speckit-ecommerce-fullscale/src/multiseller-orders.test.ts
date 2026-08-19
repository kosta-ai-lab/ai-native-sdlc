import { describe, it, expect } from 'vitest'
import { createMarketplaceOrderRoutes } from './multiseller-orders'
import {
  InMemoryProductStore,
  InMemorySellerStore,
  InMemoryInventoryStore,
  InMemorySubOrderStore,
  InMemoryMarketOrderStore,
} from './store'

function setup() {
  const products = new InMemoryProductStore()
  const sellers = new InMemorySellerStore()
  const inventory = new InMemoryInventoryStore()
  const subOrders = new InMemorySubOrderStore()
  const orders = new InMemoryMarketOrderStore()
  const app = createMarketplaceOrderRoutes(products, sellers, inventory, subOrders, orders)
  return { products, sellers, inventory, subOrders, orders, app }
}

const send = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

/** 승인된 판매자 + 상품 + 재고를 한 번에 만든다. */
function seedProduct(
  ctx: ReturnType<typeof setup>,
  opts: { name: string; price: number; stock: number; sellerStatus?: '승인대기' | '승인' | '정지'; sellerId?: string },
) {
  const sellerId =
    opts.sellerId ?? ctx.sellers.create({ name: `seller-${opts.name}`, status: opts.sellerStatus ?? '승인', commissionRate: 0.1 }).id
  const product = ctx.products.create({ name: opts.name, price: opts.price, stock: opts.stock, sellerId })
  ctx.inventory.set(product.id, opts.stock)
  return { product, sellerId }
}

// User Story 1 — Place a multi-seller order (FR-001, FR-002, FR-006)
describe('POST /marketplace/orders — split & totals', () => {
  it('splits into one SubOrder per seller and computes subtotals + total (201)', async () => {
    const ctx = setup()
    const { product: a } = seedProduct(ctx, { name: 'A', price: 1000, stock: 5 })
    const { product: b } = seedProduct(ctx, { name: 'B', price: 250, stock: 5 })

    const res = await ctx.app.request('/marketplace/orders', send('POST', {
      items: [{ productId: a.id, quantity: 2 }, { productId: b.id, quantity: 3 }],
    }))
    expect(res.status).toBe(201)
    const order = await res.json()

    expect(order.status).toBe('pending')
    expect(order.subOrders).toHaveLength(2) // SC-001: 판매자 2 → SubOrder 2
    const sumSubtotals = order.subOrders.reduce((s: number, so: { subtotal: number }) => s + so.subtotal, 0)
    expect(order.total).toBe(1000 * 2 + 250 * 3) // SC-002
    expect(order.total).toBe(sumSubtotals)
    for (const so of order.subOrders) expect(so.status).toBe('결제대기') // FR-006
  })

  it('creates a single SubOrder for a single-seller order (201)', async () => {
    const ctx = setup()
    const sellerId = ctx.sellers.create({ name: 's', status: '승인', commissionRate: 0.1 }).id
    const { product: a } = seedProduct(ctx, { name: 'A', price: 500, stock: 5, sellerId })
    const { product: b } = seedProduct(ctx, { name: 'B', price: 700, stock: 5, sellerId })

    const res = await ctx.app.request('/marketplace/orders', send('POST', {
      items: [{ productId: a.id, quantity: 1 }, { productId: b.id, quantity: 2 }],
    }))
    expect(res.status).toBe(201)
    const order = await res.json()
    expect(order.subOrders).toHaveLength(1)
    expect(order.subOrders[0].subtotal).toBe(500 + 700 * 2)
    expect(order.total).toBe(500 + 700 * 2)
  })

  // FR-004 / FR-005 — failure paths
  it('rejects empty items (400)', async () => {
    const ctx = setup()
    expect((await ctx.app.request('/marketplace/orders', send('POST', { items: [] }))).status).toBe(400)
  })

  it('rejects quantity < 1 (400)', async () => {
    const ctx = setup()
    const { product } = seedProduct(ctx, { name: 'A', price: 100, stock: 5 })
    const res = await ctx.app.request('/marketplace/orders', send('POST', { items: [{ productId: product.id, quantity: 0 }] }))
    expect(res.status).toBe(400)
  })

  it('rejects an unknown product (404) and creates nothing', async () => {
    const ctx = setup()
    const res = await ctx.app.request('/marketplace/orders', send('POST', { items: [{ productId: 'nope', quantity: 1 }] }))
    expect(res.status).toBe(404)
    expect(ctx.orders.list()).toHaveLength(0)
  })

  it('rejects an unapproved seller (400)', async () => {
    const ctx = setup()
    const { product } = seedProduct(ctx, { name: 'A', price: 100, stock: 5, sellerStatus: '승인대기' })
    const res = await ctx.app.request('/marketplace/orders', send('POST', { items: [{ productId: product.id, quantity: 1 }] }))
    expect(res.status).toBe(400)
    expect(ctx.orders.list()).toHaveLength(0)
  })
})

// User Story 2 — Reserve stock before payment (FR-003, FR-007)
describe('POST /marketplace/orders — reserve before pay', () => {
  it('reserves stock for each item on success (201)', async () => {
    const ctx = setup()
    const { product } = seedProduct(ctx, { name: 'A', price: 100, stock: 5 })
    const res = await ctx.app.request('/marketplace/orders', send('POST', { items: [{ productId: product.id, quantity: 2 }] }))
    expect(res.status).toBe(201)
    expect(ctx.inventory.get(product.id)!.reserved).toBe(2)
    expect(ctx.inventory.available(product.id)).toBe(3)
  })

  it('returns 409 and reserves/creates nothing when one item is short (atomic)', async () => {
    const ctx = setup()
    const { product: ok } = seedProduct(ctx, { name: 'OK', price: 100, stock: 5 })
    const { product: short } = seedProduct(ctx, { name: 'SHORT', price: 100, stock: 1 })

    const res = await ctx.app.request('/marketplace/orders', send('POST', {
      items: [{ productId: ok.id, quantity: 2 }, { productId: short.id, quantity: 5 }],
    }))
    expect(res.status).toBe(409)
    // 원자성: 통과 항목도 선점되지 않음 (SC-003)
    expect(ctx.inventory.get(ok.id)!.reserved).toBe(0)
    expect(ctx.inventory.get(short.id)!.reserved).toBe(0)
    expect(ctx.orders.list()).toHaveLength(0)
  })

  it('aggregates duplicate items and rejects when the sum exceeds stock (409)', async () => {
    const ctx = setup()
    const { product } = seedProduct(ctx, { name: 'A', price: 100, stock: 3 })
    const res = await ctx.app.request('/marketplace/orders', send('POST', {
      items: [{ productId: product.id, quantity: 2 }, { productId: product.id, quantity: 2 }],
    }))
    expect(res.status).toBe(409)
    expect(ctx.inventory.get(product.id)!.reserved).toBe(0)
  })

  it('cancel releases reserved stock and sets statuses to 취소됨 (FR-007, SC-004)', async () => {
    const ctx = setup()
    const { product } = seedProduct(ctx, { name: 'A', price: 100, stock: 5 })
    const created = await (
      await ctx.app.request('/marketplace/orders', send('POST', { items: [{ productId: product.id, quantity: 2 }] }))
    ).json()
    expect(ctx.inventory.available(product.id)).toBe(3)

    const res = await ctx.app.request(`/marketplace/orders/${created.id}/cancel`, { method: 'POST' })
    expect(res.status).toBe(200)
    const cancelled = await res.json()
    expect(cancelled.status).toBe('취소됨')
    for (const so of cancelled.subOrders) expect(so.status).toBe('취소됨')
    // release되어 available 복원 (SC-004)
    expect(ctx.inventory.available(product.id)).toBe(5)
    expect(ctx.inventory.get(product.id)!.reserved).toBe(0)
  })

  it('404 when cancelling a missing order', async () => {
    const ctx = setup()
    expect((await ctx.app.request('/marketplace/orders/nope/cancel', { method: 'POST' })).status).toBe(404)
  })

  it('409 when cancelling an already-cancelled order', async () => {
    const ctx = setup()
    const { product } = seedProduct(ctx, { name: 'A', price: 100, stock: 5 })
    const created = await (
      await ctx.app.request('/marketplace/orders', send('POST', { items: [{ productId: product.id, quantity: 1 }] }))
    ).json()
    await ctx.app.request(`/marketplace/orders/${created.id}/cancel`, { method: 'POST' })
    expect((await ctx.app.request(`/marketplace/orders/${created.id}/cancel`, { method: 'POST' })).status).toBe(409)
  })
})

// GET view
describe('GET /marketplace/orders/:id', () => {
  it('returns an order with its SubOrders (200)', async () => {
    const ctx = setup()
    const { product } = seedProduct(ctx, { name: 'A', price: 100, stock: 5 })
    const created = await (
      await ctx.app.request('/marketplace/orders', send('POST', { items: [{ productId: product.id, quantity: 1 }] }))
    ).json()
    const res = await ctx.app.request(`/marketplace/orders/${created.id}`)
    expect(res.status).toBe(200)
    const order = await res.json()
    expect(order.id).toBe(created.id)
    expect(order.subOrders).toHaveLength(1)
  })

  it('404 for a missing order', async () => {
    const ctx = setup()
    expect((await ctx.app.request('/marketplace/orders/does-not-exist')).status).toBe(404)
  })
})
