import { describe, it, expect } from 'vitest'
import { app } from './index'

describe('health', () => {
  it('returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })
})

describe('app wiring', () => {
  it('mounts the product routes', async () => {
    const res = await app.request('/products')
    expect(res.status).toBe(200)
    expect(Array.isArray(await res.json())).toBe(true)
  })
})
