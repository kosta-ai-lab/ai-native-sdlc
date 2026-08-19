import { Hono } from 'hono'
import type {
  PaymentStore,
  SubOrderStore,
  InventoryStore,
  SettlementStore,
  RefundStore,
  Refund,
} from './store'
import { voidPreDeliverySubOrder } from './multiseller-payments'
import { reverseSettledSubOrder } from './marketplace-settlement'

/**
 * 환불 라우트(기능 008). 라우트는 `POST /marketplace/suborders/:id/refund` 하나이며,
 * SubOrder 상태로 **세 갈래**로 분기한다. 각 분기의 실제 부작용은 기존 코드를 재사용한다(중복 구현 금지):
 *  1) 배송 전(결제완료) → 005의 `voidPreDeliverySubOrder`(결제 void + 재고 release).
 *  2) 배송완료·정산 전(배송완료) → 정산 큐(listByStatus('배송완료'))에서 빠지도록 상태 전이(역산 불필요).
 *  3) 정산완료(정산완료) → 007의 `reverseSettledSubOrder`(차기 정산 주기 역산 예약).
 * 세 갈래 공통 최종 상태는 "환불완료"다.
 *
 * 멱등의 축은 `RefundStore.getBySubOrder` — 부작용 전에 먼저 조회해, 이미 환불된 SubOrder면
 * 중복 void·이중 역산 없이 원 Refund를 그대로 반환한다(원칙 VIII). 004~007의 store를 재사용한다.
 */
export function createMarketplaceRefundRoutes(
  refunds: RefundStore,
  payments: PaymentStore,
  subOrders: SubOrderStore,
  inventory: InventoryStore,
  settlements: SettlementStore,
) {
  const routes = new Hono()

  routes.post('/marketplace/suborders/:id/refund', async (c) => {
    const subOrder = subOrders.get(c.req.param('id'))
    if (!subOrder) return c.json({ error: 'sub-order not found' }, 404) // FR-005

    // 멱등(VIII): 이미 환불된 SubOrder면 부작용 없이 원 결과 반환(중복 void·이중 역산 차단, SC-003).
    const existing = refunds.getBySubOrder(subOrder.id)
    if (existing) {
      return c.json({ ...existing, subOrder: subOrders.get(subOrder.id) }, 200)
    }

    // 부분 환불 금액(FR-004): body.amount가 있으면 그 금액, 없으면 전액(subtotal).
    // amount는 클라이언트 제안값이지만 상한(subtotal)은 서버가 강제한다(원칙 V).
    const body = (await c.req.json().catch(() => ({}))) as { amount?: unknown; reason?: unknown }
    let amount = subOrder.subtotal
    if (body.amount !== undefined) {
      if (typeof body.amount !== 'number' || body.amount <= 0 || body.amount > subOrder.subtotal) {
        return c.json({ error: 'amount must be > 0 and <= sub-order subtotal' }, 400)
      }
      amount = body.amount
    }
    const reason = typeof body.reason === 'string' ? body.reason : undefined

    // 상태별 3분기 — 실제 부작용은 기존 코드를 재사용한다.
    let paymentId: string | undefined
    switch (subOrder.status) {
      case '결제완료': {
        // 분기 1 — 배송 전: 005 void 로직 재사용(결제 void + 재고 release, 원칙 VII·VIII).
        paymentId = voidPreDeliverySubOrder(payments, subOrders, inventory, subOrder)
        break
      }
      case '배송완료': {
        // 분기 2 — 배송 후·정산 전: 정산 큐는 status로 표현되므로(원칙 IX),
        // "배송완료"에서 벗어나기만 하면 정산 큐(listByStatus('배송완료'))에서 자동 제외된다.
        // 이미 출고되어 재고 release 하지 않는다(배송 전 취소와의 차이).
        break
      }
      case '정산완료': {
        // 분기 3 — 정산완료: 즉시 되돌리지 않고 007 역산 훅으로 차기 정산 주기 차감을 예약한다(FR-002·003).
        reverseSettledSubOrder(settlements, {
          subOrderId: subOrder.id,
          sellerId: subOrder.sellerId,
          amount,
        })
        break
      }
      default:
        // 환불 가능한 상태가 아님(결제대기·수락됨·배송중·환불중·취소됨 등) → 409(원칙 IV).
        return c.json({ error: `cannot refund a sub-order in status ${subOrder.status}` }, 409)
    }

    // 세 갈래 공통: 최종 상태 "환불완료"(상태머신 환불중 → 환불완료) + Refund 기록.
    subOrders.setStatus(subOrder.id, '환불완료')
    const refund: Refund = refunds.create({ subOrderId: subOrder.id, paymentId, amount, reason })

    return c.json({ ...refund, subOrder: subOrders.get(subOrder.id) }, 200)
  })

  return routes
}
