import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { createMarketplaceOrderRoutes } from './multiseller-orders'
import { createMarketplacePaymentRoutes } from './multiseller-payments'
import { createMarketplaceShippingRoutes } from './marketplace-shipping'
import {
  createMarketplaceSettlementRoutes,
  runSettlement,
  reverseSettledSubOrder,
} from './marketplace-settlement'
import {
  InMemoryProductStore,
  InMemorySellerStore,
  InMemoryInventoryStore,
  InMemorySubOrderStore,
  InMemoryMarketOrderStore,
  InMemoryPaymentStore,
  InMemoryShipmentStore,
  InMemorySettlementStore,
} from './store'

/**
 * 004 주문 + 005 결제 + 006 배송 + 007 정산 라우트를 store를 공유해 함께 마운트한다.
 * 정산은 006이 만든 "배송완료" SubOrder(정산 큐) 위에 얹히므로, 실제 주문→결제→배송→배송완료 경로로 픽스처를 만든다.
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

  const app = new Hono()
  app.route('/', createMarketplaceOrderRoutes(products, sellers, inventory, subOrders, orders))
  app.route('/', createMarketplacePaymentRoutes(payments, orders, subOrders, inventory))
  app.route('/', createMarketplaceShippingRoutes(subOrders, shipments))
  app.route('/', createMarketplaceSettlementRoutes(subOrders, sellers, settlements))

  return { products, sellers, inventory, subOrders, orders, payments, shipments, settlements, app }
}

const send = (method: string, body?: unknown) => ({
  method,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body ?? {}),
})

/** 승인된 판매자 + 상품 + 재고를 하나 만든다. commissionRate를 지정할 수 있다. */
function seedSeller(
  ctx: ReturnType<typeof setup>,
  opts: { name: string; price: number; stock: number; commissionRate: number },
) {
  const sellerId = ctx.sellers.create({ name: `seller-${opts.name}`, status: '승인', commissionRate: opts.commissionRate }).id
  const product = ctx.products.create({ name: opts.name, price: opts.price, stock: opts.stock, sellerId })
  ctx.inventory.set(product.id, opts.stock)
  return { sellerId, product }
}

/**
 * 주어진 상품으로 주문→결제→수락→배송→배송완료까지 진행해 "배송완료" SubOrder id를 반환한다.
 * 이 상태가 곧 정산 큐 진입(원칙 IX).
 */
async function seedDeliveredSubOrder(
  ctx: ReturnType<typeof setup>,
  product: { id: string },
  quantity: number,
  idempotencyKey: string,
) {
  const orderRes = await ctx.app.request('/marketplace/orders', send('POST', { items: [{ productId: product.id, quantity }] }))
  const order = await orderRes.json()
  await ctx.app.request(`/marketplace/orders/${order.id}/pay`, send('POST', { idempotencyKey }))
  const [subOrder] = ctx.subOrders.listByOrder(order.id)
  await ctx.app.request(`/marketplace/suborders/${subOrder.id}/accept`, send('POST'))
  const shipRes = await ctx.app.request(`/marketplace/suborders/${subOrder.id}/ship`, send('POST', { carrierId: 'CJ' }))
  const shipment = await shipRes.json()
  await ctx.app.request(`/marketplace/shipments/${shipment.id}/deliver`, send('POST'))
  expect(ctx.subOrders.get(subOrder.id)!.status).toBe('배송완료')
  return subOrder.id as string
}

// ─────────────────────────────────────────────────────────────
// User Story 1 — Settle delivered sub-orders (FR-001~004, SC-001·002)
// ─────────────────────────────────────────────────────────────
describe('POST /marketplace/settlements/run — settlement batch', () => {
  it('aggregates a seller 배송완료 sub-orders: gross=Σsubtotal, commission=gross×rate, netPayout=gross−commission, and marks 정산완료 (FR-001~004, SC-001)', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 10, commissionRate: 0.1 })
    // 배송완료 2건: subtotal 2000 + 3000 = 5000
    const sub1 = await seedDeliveredSubOrder(ctx, product, 2, 'k1') // 2×1000
    const sub2 = await seedDeliveredSubOrder(ctx, product, 3, 'k2') // 3×1000

    const res = await ctx.app.request('/marketplace/settlements/run', send('POST'))
    expect(res.status).toBe(200)
    const settlements = await res.json()
    expect(settlements).toHaveLength(1)

    const s = settlements[0]
    expect(s.grossAmount).toBe(5000)
    expect(s.commission).toBe(500) // 5000 × 0.1
    expect(s.netPayout).toBe(4500) // gross − commission
    // SC-001: netPayout은 언제나 gross − commission
    expect(s.netPayout).toBe(s.grossAmount - s.commission)

    // FR-004: 집계된 SubOrder는 모두 정산완료
    expect(ctx.subOrders.get(sub1)!.status).toBe('정산완료')
    expect(ctx.subOrders.get(sub2)!.status).toBe('정산완료')

    // settlement_items 기록: 2건, 각 SubOrder subtotal
    const items = ctx.settlements.listItems(s.id)
    expect(items).toHaveLength(2)
    expect(items.every((i) => i.reversal === false)).toBe(true)
    expect(items.reduce((sum: number, i) => sum + i.amount, 0)).toBe(5000)
  })

  it('commissionRate 0 → netPayout equals gross (Edge Case)', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'Z', price: 500, stock: 5, commissionRate: 0 })
    await seedDeliveredSubOrder(ctx, product, 4, 'z1') // 2000

    const settlements = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    expect(settlements).toHaveLength(1)
    expect(settlements[0].grossAmount).toBe(2000)
    expect(settlements[0].commission).toBe(0)
    expect(settlements[0].netPayout).toBe(2000) // netPayout = gross
  })

  it('ignores client-supplied amounts — server authority computes netPayout (원칙 V)', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 5, commissionRate: 0.2 })
    await seedDeliveredSubOrder(ctx, product, 2, 'k1') // 2000

    // 클라이언트가 조작된 금액을 넣어도 무시된다(run은 body를 읽지 않음).
    const res = await ctx.app.request(
      '/marketplace/settlements/run',
      send('POST', { grossAmount: 999999, commission: 0, netPayout: 999999 }),
    )
    const settlements = await res.json()
    expect(settlements[0].grossAmount).toBe(2000)
    expect(settlements[0].commission).toBe(400) // 2000 × 0.2
    expect(settlements[0].netPayout).toBe(1600) // 서버 계산, 클라이언트 값 무시
  })

  it('groups by seller — each seller gets its own settlement (FR-002)', async () => {
    const ctx = setup()
    const a = seedSeller(ctx, { name: 'A', price: 1000, stock: 5, commissionRate: 0.1 })
    const b = seedSeller(ctx, { name: 'B', price: 2000, stock: 5, commissionRate: 0.25 })
    await seedDeliveredSubOrder(ctx, a.product, 1, 'a1') // gross 1000, seller A
    await seedDeliveredSubOrder(ctx, b.product, 2, 'b1') // gross 4000, seller B

    const settlements = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    expect(settlements).toHaveLength(2)

    const byId = new Map<string, { grossAmount: number; commission: number; netPayout: number }>()
    for (const s of settlements) byId.set(s.sellerId, s)
    const sa = byId.get(a.sellerId)!
    const sb = byId.get(b.sellerId)!

    expect(sa.grossAmount).toBe(1000)
    expect(sa.netPayout).toBe(900) // 1000 − 100
    expect(sb.grossAmount).toBe(4000)
    expect(sb.netPayout).toBe(3000) // 4000 − 1000
  })

  it('excludes sub-orders that are not delivered (FR-001, SC-002)', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 10, commissionRate: 0.1 })
    // 배송완료 1건(정산 대상)
    await seedDeliveredSubOrder(ctx, product, 2, 'k1') // 2000

    // 배송 안 된 건: 결제완료에서 멈춘 SubOrder(수락·배송·배송완료 전) → 정산 제외 대상
    const orderRes = await ctx.app.request('/marketplace/orders', send('POST', { items: [{ productId: product.id, quantity: 5 }] }))
    const order = await orderRes.json()
    await ctx.app.request(`/marketplace/orders/${order.id}/pay`, send('POST', { idempotencyKey: 'k2' }))
    const [pending] = ctx.subOrders.listByOrder(order.id)
    expect(pending.status).toBe('결제완료')

    const settlements = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    expect(settlements).toHaveLength(1)
    // 배송완료 건(2000)만 집계, 미배송 결제완료 건(5000)은 제외
    expect(settlements[0].grossAmount).toBe(2000)
    // 미배송 건은 여전히 결제완료(전이 안 됨)
    expect(ctx.subOrders.get(pending.id)!.status).toBe('결제완료')
  })

  it('no delivered sub-orders → no settlement created (Edge Case)', async () => {
    const ctx = setup()
    seedSeller(ctx, { name: 'A', price: 1000, stock: 5, commissionRate: 0.1 })
    const settlements = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    expect(settlements).toHaveLength(0)
  })

  it('re-running the batch does not double-settle already-settled sub-orders', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 5, commissionRate: 0.1 })
    await seedDeliveredSubOrder(ctx, product, 2, 'k1') // 2000

    const first = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    expect(first).toHaveLength(1)
    // 2차 실행: 큐(배송완료)가 비었으므로 새 정산 없음
    const second = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    expect(second).toHaveLength(0)
    // 정산은 총 1건만 존재
    const all = await (await ctx.app.request('/marketplace/settlements')).json()
    expect(all).toHaveLength(1)
  })
})

describe('GET /marketplace/settlements — list settlements', () => {
  it('returns settlements created by the batch', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 5, commissionRate: 0.1 })
    await seedDeliveredSubOrder(ctx, product, 1, 'k1')
    await ctx.app.request('/marketplace/settlements/run', send('POST'))

    const res = await ctx.app.request('/marketplace/settlements')
    expect(res.status).toBe(200)
    const list = await res.json()
    expect(list).toHaveLength(1)
    expect(list[0].sellerId).toBeTruthy()
  })
})

// ─────────────────────────────────────────────────────────────
// User Story 2 — Reverse settled amount on refund (FR-005, SC-003)
// ─────────────────────────────────────────────────────────────
describe('reversal hook — refund on a settled sub-order deducts in the next cycle (FR-005, SC-003)', () => {
  it('POST /marketplace/settlements/reversals schedules a reversal; next run deducts it from that seller netPayout', async () => {
    const ctx = setup()
    const { product, sellerId } = seedSeller(ctx, { name: 'A', price: 1000, stock: 20, commissionRate: 0.1 })

    // 1주기: 배송완료 2건(각 2000) → 정산완료
    const sub1 = await seedDeliveredSubOrder(ctx, product, 2, 'k1') // 2000
    await seedDeliveredSubOrder(ctx, product, 2, 'k2') // 2000
    const cycle1 = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    expect(cycle1[0].grossAmount).toBe(4000)
    expect(cycle1[0].netPayout).toBe(3600) // 4000 − 400

    // sub1(2000) 환불 → 정산완료 건이므로 차기 주기 역산 예약
    const revRes = await ctx.app.request('/marketplace/settlements/reversals', send('POST', { subOrderId: sub1 }))
    expect(revRes.status).toBe(200)

    // 2주기: 새 배송완료 1건(3000) + 역산(−2000)
    await seedDeliveredSubOrder(ctx, product, 3, 'k3') // 3000
    const cycle2 = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    expect(cycle2).toHaveLength(1)
    const s2 = cycle2.find((s: { sellerId: string }) => s.sellerId === sellerId)!
    expect(s2.grossAmount).toBe(3000)
    expect(s2.commission).toBe(300) // 3000 × 0.1
    // netPayout = gross − commission − 역산(2000) = 3000 − 300 − 2000 = 700
    expect(s2.netPayout).toBe(700)

    // 음수 SettlementItem(reversal=true) 기록
    const items = ctx.settlements.listItems(s2.id)
    const reversalItem = items.find((i) => i.reversal)!
    expect(reversalItem.amount).toBe(-2000)
    expect(reversalItem.subOrderId).toBe(sub1)
  })

  it('a reversal alone (no new delivered orders) still opens a settlement that deducts it', async () => {
    const ctx = setup()
    const { product, sellerId } = seedSeller(ctx, { name: 'A', price: 1000, stock: 10, commissionRate: 0.1 })
    const sub1 = await seedDeliveredSubOrder(ctx, product, 2, 'k1') // 2000
    await ctx.app.request('/marketplace/settlements/run', send('POST'))

    // 환불 예약 후 새 배송 없이 run → 역산만 있는 정산 생성
    await ctx.app.request('/marketplace/settlements/reversals', send('POST', { subOrderId: sub1 }))
    const cycle2 = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    expect(cycle2).toHaveLength(1)
    expect(cycle2[0].sellerId).toBe(sellerId)
    expect(cycle2[0].grossAmount).toBe(0)
    expect(cycle2[0].netPayout).toBe(-2000) // 0 − 0 − 2000
  })

  it('a scheduled reversal is consumed once — a later run does not deduct it again', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 10, commissionRate: 0.1 })
    const sub1 = await seedDeliveredSubOrder(ctx, product, 2, 'k1')
    await ctx.app.request('/marketplace/settlements/run', send('POST'))
    await ctx.app.request('/marketplace/settlements/reversals', send('POST', { subOrderId: sub1 }))

    const cycle2 = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    expect(cycle2).toHaveLength(1)
    expect(cycle2[0].netPayout).toBe(-2000)

    // 3주기: 역산 소진됨 → 새 정산 없음
    const cycle3 = await (await ctx.app.request('/marketplace/settlements/run', send('POST'))).json()
    expect(cycle3).toHaveLength(0)
  })

  it('reversal route: 404 for unknown sub-order, 409 for a not-settled sub-order', async () => {
    const ctx = setup()
    const { product } = seedSeller(ctx, { name: 'A', price: 1000, stock: 5, commissionRate: 0.1 })
    // 배송완료지만 아직 정산 안 됨(정산완료 아님) → 409
    const delivered = await seedDeliveredSubOrder(ctx, product, 1, 'k1')
    const notSettled = await ctx.app.request('/marketplace/settlements/reversals', send('POST', { subOrderId: delivered }))
    expect(notSettled.status).toBe(409)

    const unknown = await ctx.app.request('/marketplace/settlements/reversals', send('POST', { subOrderId: 'nope' }))
    expect(unknown.status).toBe(404)
  })

  it('reverseSettledSubOrder() is callable directly as a function hook (008 integration surface)', async () => {
    const ctx = setup()
    const { product, sellerId } = seedSeller(ctx, { name: 'A', price: 1000, stock: 10, commissionRate: 0.1 })
    const sub1 = await seedDeliveredSubOrder(ctx, product, 2, 'k1') // 2000
    runSettlement(ctx.subOrders, ctx.sellers, ctx.settlements)

    // 008이 라우트 대신 함수를 직접 호출하는 경로
    reverseSettledSubOrder(ctx.settlements, { subOrderId: sub1, sellerId, amount: 2000 })
    const cycle2 = runSettlement(ctx.subOrders, ctx.sellers, ctx.settlements)
    expect(cycle2).toHaveLength(1)
    expect(cycle2[0].netPayout).toBe(-2000)
  })
})
