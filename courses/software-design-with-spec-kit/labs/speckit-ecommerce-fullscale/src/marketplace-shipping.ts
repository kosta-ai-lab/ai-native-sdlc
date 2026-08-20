import { Hono } from 'hono'
import type { SubOrderStore, ShipmentStore } from './store'

/** 수락이 허용되는 SubOrder 상태 = 결제완료(005가 만든 상태). 그 외는 409(FR-001). */
const ACCEPTABLE_SUBORDER_STATUS = '결제완료'

/** 배송 접수가 허용되는 SubOrder 상태 = 수락됨. 그 외는 409(방어적 순서 보장). */
const SHIPPABLE_SUBORDER_STATUS = '수락됨'

/**
 * 배송 라우트(기능 006). 상태 전이는 상태머신 다이어그램 정본을 따른다:
 *   결제완료 → 수락됨(판매자 수락) → 배송중(배송사 접수) → 배송완료(markDelivered).
 * 배송완료는 정산(007)의 트리거다(Constitution IX) — SubOrder.status="배송완료"가 곧 정산 큐다.
 * markDelivered는 멱등: 이미 배송완료면 부작용 없이 원 결과를 반환한다(중복 정산 차단, FR-004).
 * 004/005의 SubOrder store를 재사용한다(배송은 그 위에 얹는다).
 */
export function createMarketplaceShippingRoutes(subOrders: SubOrderStore, shipments: ShipmentStore) {
  const routes = new Hono()

  // 판매자 수락: 결제완료 → 수락됨 (FR-001). 결제완료가 아니면 409.
  routes.post('/marketplace/suborders/:id/accept', (c) => {
    const subOrder = subOrders.get(c.req.param('id'))
    if (!subOrder) return c.json({ error: 'sub-order not found' }, 404)
    if (subOrder.status !== ACCEPTABLE_SUBORDER_STATUS) {
      return c.json({ error: `cannot accept a sub-order in status ${subOrder.status}` }, 409)
    }
    const updated = subOrders.setStatus(subOrder.id, '수락됨')!
    return c.json(updated, 200)
  })

  // 배송사 접수: 수락됨 → 배송중, Shipment "배송중" 생성 (FR-002).
  routes.post('/marketplace/suborders/:id/ship', async (c) => {
    const subOrder = subOrders.get(c.req.param('id'))
    if (!subOrder) return c.json({ error: 'sub-order not found' }, 404)
    if (subOrder.status !== SHIPPABLE_SUBORDER_STATUS) {
      return c.json({ error: `cannot ship a sub-order in status ${subOrder.status}` }, 409)
    }

    const body = (await c.req.json().catch(() => ({}))) as { carrierId?: unknown }
    const carrierId = typeof body.carrierId === 'string' && body.carrierId.length > 0 ? body.carrierId : 'carrier-default'

    const shipment = shipments.create({ subOrderId: subOrder.id, carrierId })
    const updated = subOrders.setStatus(subOrder.id, '배송중')!
    return c.json({ ...shipment, subOrder: updated }, 201)
  })

  // 배송 상태 조회 (US2). 없으면 404.
  routes.get('/marketplace/shipments/:id', (c) => {
    const shipment = shipments.get(c.req.param('id'))
    if (!shipment) return c.json({ error: 'shipment not found' }, 404)
    return c.json(shipment, 200)
  })

  // markDelivered: 배송중 → 배송완료, Shipment "완료", 정산 큐 등록 (FR-003).
  // 멱등(FR-004): 이미 배송완료면 부작용 없이 원 결과 반환 — SubOrder.status가 큐이므로 중복 등록 불가.
  routes.post('/marketplace/shipments/:id/deliver', (c) => {
    const shipment = shipments.get(c.req.param('id'))
    if (!shipment) return c.json({ error: 'shipment not found' }, 404)

    const subOrder = subOrders.get(shipment.subOrderId)
    if (!subOrder) return c.json({ error: 'sub-order not found' }, 404)

    // 멱등(IX·FR-004): 이미 배송완료면 재-전이·재-등록 없이 현재 상태를 그대로 반환.
    if (subOrder.status === '배송완료') {
      return c.json({ ...shipment, subOrder }, 200)
    }

    const delivered = shipments.markDelivered(shipment.id)!
    const updated = subOrders.setStatus(subOrder.id, '배송완료')! // 정산 큐 진입(원칙 IX)
    return c.json({ ...delivered, subOrder: updated }, 200)
  })

  return routes
}
