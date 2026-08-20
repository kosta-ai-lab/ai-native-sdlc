import { Hono } from 'hono'
import type {
  ProductStore,
  SellerStore,
  InventoryStore,
  SubOrderStore,
  MarketOrderStore,
  SubOrderItem,
} from './store'

interface ParsedItem {
  productId: string
  quantity: number
}

/** productId별 필요 수량 합산(중복 item 대응). */
function aggregate(items: ParsedItem[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const item of items) totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity)
  return totals
}

/**
 * 멀티셀러 주문 라우트. 검증 순서(Constitution IV):
 *   (1) 구조 400 → (2) 상품 참조 404 → (3) 판매자 승인 400 → (4) 재고 409(전량 선확인) → (5) reserve·분할·저장.
 * 분할(VI): items를 sellerId로 그룹핑해 판매자별 SubOrder 생성. total·subtotal은 서버 계산(V).
 * reserve(VII): 결제 전 선점, 한 항목이라도 부족하면 아무것도 선점·생성하지 않음(원자적).
 */
export function createMarketplaceOrderRoutes(
  products: ProductStore,
  sellers: SellerStore,
  inventory: InventoryStore,
  subOrders: SubOrderStore,
  orders: MarketOrderStore,
) {
  const routes = new Hono()

  routes.post('/marketplace/orders', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { items?: unknown; buyerId?: unknown }
    const items = body.items
    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'items must be a non-empty array' }, 400)
    }

    // 1) 구조 검증 (FR-004: 빈 items·quantity<1)
    const parsed: ParsedItem[] = []
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

    // 2) 상품 참조 검증 (FR-004: 미존재 상품 404, 미생성)
    for (const item of parsed) {
      if (!products.get(item.productId)) {
        return c.json({ error: `product not found: ${item.productId}` }, 404)
      }
    }

    // 3) 판매자 승인 검증 (FR-005: 미승인 판매자 400)
    for (const item of parsed) {
      const product = products.get(item.productId)!
      if (!product.sellerId || !sellers.canSell(product.sellerId)) {
        return c.json({ error: `seller not approved for product ${item.productId}` }, 400)
      }
    }

    // 4) 재고 확인(전량) — 하나라도 부족하면 아무것도 선점하지 않는다 (FR-003, 원자적)
    const required = aggregate(parsed)
    for (const [productId, qty] of required) {
      if (inventory.available(productId) < qty) {
        return c.json({ error: `insufficient stock for ${productId}` }, 409)
      }
    }

    // 5) 전량 통과 → 일괄 reserve (VII)
    for (const [productId, qty] of required) {
      inventory.reserve(productId, qty)
    }

    // 6) 판매자별 분할 → Order + SubOrder 저장 (VI)
    const bySeller = new Map<string, SubOrderItem[]>()
    for (const item of parsed) {
      const product = products.get(item.productId)!
      const line: SubOrderItem = { productId: product.id, unitPrice: product.price, quantity: item.quantity }
      const list = bySeller.get(product.sellerId!) ?? []
      list.push(line)
      bySeller.set(product.sellerId!, list)
    }

    let total = 0
    for (const lines of bySeller.values()) {
      for (const line of lines) total += line.unitPrice * line.quantity
    }

    const order = orders.create({ buyerId: typeof body.buyerId === 'string' ? body.buyerId : undefined, total })
    const createdSubOrders = []
    for (const [sellerId, lines] of bySeller) {
      const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
      createdSubOrders.push(subOrders.create({ orderId: order.id, sellerId, subtotal, items: lines }))
    }

    return c.json({ ...order, subOrders: createdSubOrders }, 201)
  })

  routes.get('/marketplace/orders/:id', (c) => {
    const order = orders.get(c.req.param('id'))
    if (!order) return c.json({ error: 'order not found' }, 404)
    return c.json({ ...order, subOrders: subOrders.listByOrder(order.id) })
  })

  // 취소: 선점 재고 release + SubOrder·order 상태 '취소됨' (FR-007)
  routes.post('/marketplace/orders/:id/cancel', (c) => {
    const order = orders.get(c.req.param('id'))
    if (!order) return c.json({ error: 'order not found' }, 404)
    if (order.status === '취소됨') {
      return c.json({ error: 'order already cancelled' }, 409)
    }

    const subs = subOrders.listByOrder(order.id)
    for (const sub of subs) {
      for (const item of sub.items) {
        inventory.release(item.productId, item.quantity)
      }
      subOrders.setStatus(sub.id, '취소됨')
    }
    const updated = orders.setStatus(order.id, '취소됨')!
    return c.json({ ...updated, subOrders: subOrders.listByOrder(order.id) })
  })

  return routes
}
