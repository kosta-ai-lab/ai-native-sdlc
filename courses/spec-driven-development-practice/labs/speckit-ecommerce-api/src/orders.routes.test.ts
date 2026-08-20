import { describe, it, expect } from 'vitest'
import { createOrderRoutes } from './orders'
import { InMemoryProductStore, InMemoryOrderStore } from './store'

function setup() {
  const products = new InMemoryProductStore()
  const orders = new InMemoryOrderStore()
  const app = createOrderRoutes(products, orders)
  return { products, app }
}
const send = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

// User Story 1 — Place an order
describe('POST /orders', () => {
  it('creates an order and computes the total on the server (201)', async () => {
    const { products, app } = setup()
    const a = products.create({ name: 'A', price: 1000, stock: 5 })
    const b = products.create({ name: 'B', price: 250, stock: 5 })
    const res = await app.request('/orders', send('POST', {
      items: [{ productId: a.id, quantity: 2 }, { productId: b.id, quantity: 3 }],
    }))
    expect(res.status).toBe(201)
    const order = await res.json()
    expect(order.total).toBe(1000 * 2 + 250 * 3)
    expect(order.status).toBe('pending')
    expect(order.items).toHaveLength(2)
  })
  it('rejects empty items (400)', async () => {
    const { app } = setup()
    expect((await app.request('/orders', send('POST', { items: [] }))).status).toBe(400)
  })
  it('rejects quantity < 1 (400)', async () => {
    const { products, app } = setup()
    const p = products.create({ name: 'A', price: 100, stock: 5 })
    expect((await app.request('/orders', send('POST', { items: [{ productId: p.id, quantity: 0 }] }))).status).toBe(400)
  })
  it('rejects an unknown product (404)', async () => {
    const { app } = setup()
    expect((await app.request('/orders', send('POST', { items: [{ productId: 'nope', quantity: 1 }] }))).status).toBe(404)
  })
})

// User Story 2 — Review orders
describe('GET /orders', () => {
  it('lists all orders (200)', async () => {
    const { products, app } = setup()
    const p = products.create({ name: 'A', price: 100, stock: 5 })
    await app.request('/orders', send('POST', { items: [{ productId: p.id, quantity: 1 }] }))
    const res = await app.request('/orders')
    expect(res.status).toBe(200)
    expect(await res.json()).toHaveLength(1)
  })
})

describe('GET /orders/:id', () => {
  it('returns an existing order (200)', async () => {
    const { products, app } = setup()
    const p = products.create({ name: 'A', price: 100, stock: 5 })
    const created = await (await app.request('/orders', send('POST', { items: [{ productId: p.id, quantity: 1 }] }))).json()
    const res = await app.request(`/orders/${created.id}`)
    expect(res.status).toBe(200)
    expect((await res.json()).id).toBe(created.id)
  })
  it('404 for a missing order', async () => {
    const { app } = setup()
    expect((await app.request('/orders/does-not-exist')).status).toBe(404)
  })
})

// Feature 003 — Stock deduction on create
describe('stock deduction on create', () => {
  it('decrements stock by the ordered quantity', async () => {
    const { products, app } = setup()
    const p = products.create({ name: 'A', price: 100, stock: 5 })
    await app.request('/orders', send('POST', { items: [{ productId: p.id, quantity: 2 }] }))
    expect(products.get(p.id)!.stock).toBe(3)
  })
  it('rejects insufficient stock (409) and leaves stock unchanged', async () => {
    const { products, app } = setup()
    const p = products.create({ name: 'A', price: 100, stock: 1 })
    expect((await app.request('/orders', send('POST', { items: [{ productId: p.id, quantity: 2 }] }))).status).toBe(409)
    expect(products.get(p.id)!.stock).toBe(1)
  })
  it('aggregates quantity across duplicate items', async () => {
    const { products, app } = setup()
    const p = products.create({ name: 'A', price: 100, stock: 3 })
    expect((await app.request('/orders', send('POST', { items: [{ productId: p.id, quantity: 2 }, { productId: p.id, quantity: 2 }] }))).status).toBe(409)
    expect(products.get(p.id)!.stock).toBe(3)
  })
})

// Feature 003 — Cancel and restore
describe('POST /orders/:id/cancel', () => {
  it('cancels a pending order and restores stock (200)', async () => {
    const { products, app } = setup()
    const p = products.create({ name: 'A', price: 100, stock: 5 })
    const order = await (await app.request('/orders', send('POST', { items: [{ productId: p.id, quantity: 2 }] }))).json()
    expect(products.get(p.id)!.stock).toBe(3)
    const res = await app.request(`/orders/${order.id}/cancel`, { method: 'POST' })
    expect(res.status).toBe(200)
    expect((await res.json()).status).toBe('cancelled')
    expect(products.get(p.id)!.stock).toBe(5)
  })
  it('404 for a missing order', async () => {
    const { app } = setup()
    expect((await app.request('/orders/nope/cancel', { method: 'POST' })).status).toBe(404)
  })
  it('409 when already cancelled', async () => {
    const { products, app } = setup()
    const p = products.create({ name: 'A', price: 100, stock: 5 })
    const order = await (await app.request('/orders', send('POST', { items: [{ productId: p.id, quantity: 1 }] }))).json()
    await app.request(`/orders/${order.id}/cancel`, { method: 'POST' })
    expect((await app.request(`/orders/${order.id}/cancel`, { method: 'POST' })).status).toBe(409)
  })
})
