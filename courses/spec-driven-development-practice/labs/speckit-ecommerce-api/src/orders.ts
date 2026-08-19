import { Hono } from 'hono'
import type { ProductStore, OrderStore, OrderItem } from './store'

/** items를 productId별 합산 수량으로 집계(중복 item 대응). */
function aggregate(items: OrderItem[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const item of items) totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity)
  return totals
}

/**
 * 주문 라우트. 검증 순서: (1) 구조 400 → (2) 상품 참조 404 → (3) 재고 409(전량 확인) → (4) 차감·저장.
 * 취소: 상태를 cancelled로 바꾸고 재고를 복원.
 */
export function createOrderRoutes(products: ProductStore, orders: OrderStore) {
  const routes = new Hono()

  routes.post('/orders', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { items?: unknown }
    const items = body.items
    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'items must be a non-empty array' }, 400)
    }

    // 1) 구조 검증
    const parsed: OrderItem[] = []
    for (const raw of items) {
      const item = raw as { productId?: unknown; quantity?: unknown }
      if (typeof item.productId !== 'string') {
        return c.json({ error: 'each item requires a string productId' }, 400)
      }
      if (!Number.isInteger(item.quantity) || (item.quantity as number) < 1) {
        return c.json({ error: 'each item quantity must be an integer >= 1' }, 400)
      }
      parsed.push({ productId: item.productId, quantity: item.quantity as number })
    }

    // 2) 참조 검증 + 총액
    let total = 0
    for (const item of parsed) {
      const product = products.get(item.productId)
      if (!product) return c.json({ error: `product not found: ${item.productId}` }, 404)
      total += product.price * item.quantity
    }

    // 3) 재고 확인(전량) — 하나라도 부족하면 아무것도 바꾸지 않는다
    const required = aggregate(parsed)
    for (const [productId, qty] of required) {
      const product = products.get(productId)!
      if (product.stock < qty) {
        return c.json({ error: `insufficient stock for ${productId}` }, 409)
      }
    }

    // 4) 차감 후 주문 저장
    for (const [productId, qty] of required) {
      const product = products.get(productId)!
      products.update(productId, { stock: product.stock - qty })
    }
    const order = orders.create({ items: parsed, total })
    return c.json(order, 201)
  })

  routes.get('/orders', (c) => c.json(orders.list()))

  routes.get('/orders/:id', (c) => {
    const order = orders.get(c.req.param('id'))
    if (!order) return c.json({ error: 'order not found' }, 404)
    return c.json(order)
  })

  routes.post('/orders/:id/cancel', (c) => {
    const order = orders.get(c.req.param('id'))
    if (!order) return c.json({ error: 'order not found' }, 404)
    if (order.status === 'cancelled') {
      return c.json({ error: 'order already cancelled' }, 409)
    }
    // 재고 복원
    for (const [productId, qty] of aggregate(order.items)) {
      const product = products.get(productId)
      if (product) products.update(productId, { stock: product.stock + qty })
    }
    const updated = orders.setStatus(order.id, 'cancelled')
    return c.json(updated)
  })

  return routes
}
