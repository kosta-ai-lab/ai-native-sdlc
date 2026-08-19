import { describe, it, expect } from 'vitest'
import { createProductRoutes } from './products'
import { InMemoryProductStore } from './store'

const makeApp = () => createProductRoutes(new InMemoryProductStore())
const send = (method: string, body: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})
const create = async (app: ReturnType<typeof makeApp>, body: unknown) => {
  const res = await app.request('/products', send('POST', body))
  return res.json()
}

// User Story 1 — Register and browse
describe('POST /products', () => {
  it('creates a product (201)', async () => {
    const res = await makeApp().request('/products', send('POST', { name: 'Keyboard', price: 4200, stock: 10 }))
    expect(res.status).toBe(201)
    const p = await res.json()
    expect(p).toMatchObject({ name: 'Keyboard', price: 4200, stock: 10 })
    expect(typeof p.id).toBe('string')
  })
  it('rejects missing name (400)', async () => {
    expect((await makeApp().request('/products', send('POST', { price: 100, stock: 1 }))).status).toBe(400)
  })
  it('rejects negative price (400)', async () => {
    expect((await makeApp().request('/products', send('POST', { name: 'X', price: -1, stock: 1 }))).status).toBe(400)
  })
  it('rejects negative stock (400)', async () => {
    expect((await makeApp().request('/products', send('POST', { name: 'X', price: 1, stock: -1 }))).status).toBe(400)
  })
})

describe('GET /products', () => {
  it('lists all products (200)', async () => {
    const app = makeApp()
    await create(app, { name: 'A', price: 1, stock: 1 })
    await create(app, { name: 'B', price: 2, stock: 2 })
    const res = await app.request('/products')
    expect(res.status).toBe(200)
    expect(await res.json()).toHaveLength(2)
  })
})

describe('GET /products/:id', () => {
  it('returns an existing product (200)', async () => {
    const app = makeApp()
    const created = await create(app, { name: 'A', price: 1, stock: 1 })
    const res = await app.request(`/products/${created.id}`)
    expect(res.status).toBe(200)
    expect((await res.json()).id).toBe(created.id)
  })
  it('404 for a missing product', async () => {
    expect((await makeApp().request('/products/does-not-exist')).status).toBe(404)
  })
})

// User Story 2 — Correct details
describe('PATCH /products/:id', () => {
  it('updates and keeps other fields (200)', async () => {
    const app = makeApp()
    const created = await create(app, { name: 'A', price: 100, stock: 1 })
    const res = await app.request(`/products/${created.id}`, send('PATCH', { price: 3900 }))
    expect(res.status).toBe(200)
    const p = await res.json()
    expect(p.price).toBe(3900)
    expect(p.name).toBe('A')
  })
  it('404 when updating a missing product', async () => {
    expect((await makeApp().request('/products/nope', send('PATCH', { price: 1 }))).status).toBe(404)
  })
  it('400 invalid update leaves the product unchanged', async () => {
    const app = makeApp()
    const created = await create(app, { name: 'A', price: 100, stock: 1 })
    expect((await app.request(`/products/${created.id}`, send('PATCH', { price: -1 }))).status).toBe(400)
    const after = await (await app.request(`/products/${created.id}`)).json()
    expect(after.price).toBe(100)
  })
})

// User Story 3 — Remove
describe('DELETE /products/:id', () => {
  it('deletes (204) then subsequent get is 404', async () => {
    const app = makeApp()
    const created = await create(app, { name: 'A', price: 1, stock: 1 })
    expect((await app.request(`/products/${created.id}`, { method: 'DELETE' })).status).toBe(204)
    expect((await app.request(`/products/${created.id}`)).status).toBe(404)
  })
  it('404 when deleting a missing product', async () => {
    expect((await makeApp().request('/products/nope', { method: 'DELETE' })).status).toBe(404)
  })
})
