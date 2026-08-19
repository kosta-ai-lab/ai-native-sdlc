import { Hono } from 'hono'
import type {
  InventoryStore,
  SubOrderStore,
  SubOrder,
  MarketOrderStore,
  PaymentStore,
  SubOrderStatus,
} from './store'

/**
 * void가 허용되는 SubOrder 상태 = 배송 전(결제완료). 그 외(배송 관련 상태·이미 환불중·취소됨)는
 * 배송 전 취소 대상이 아니다. 006(배송)이 추가할 상태도 여기 화이트리스트에 들지 않으므로
 * "배송 완료 후 void 시도 → 409"가 자동으로 지켜진다(방어적 설계).
 */
const VOIDABLE_SUBORDER_STATUS: SubOrderStatus = '결제완료'

/**
 * 배송 전 취소(void)의 SubOrder 단위 부작용을 수행하는 순수 헬퍼(005의 핵심 로직).
 * ① 그 SubOrder가 속한 Order의 결제를 void ② 그 SubOrder 품목의 선점 재고를 release
 * ③ SubOrder를 "환불중"으로 전이.
 *
 * 005 void 라우트와 008 환불(배송 전 분기) 양쪽에서 호출한다 — 배송 전 취소 로직을 코드
 * 단일 지점에만 둔다(중복 구현 금지). payment void는 `status==='void'` 가드로 반복 호출에 안전하다(멱등, 원칙 VIII).
 *
 * 반환: void 처리된 결제 id(멱등 재요청·중복 호출에도 그 Order의 결제 id). 결제가 없으면 undefined.
 */
export function voidPreDeliverySubOrder(
  payments: PaymentStore,
  subOrders: SubOrderStore,
  inventory: InventoryStore,
  subOrder: SubOrder,
): string | undefined {
  // 그 SubOrder가 속한 Order의 결제를 찾아 void(이미 void면 그대로 — 멱등, 원칙 VIII).
  const payment = payments.getByOrder(subOrder.orderId)
  if (payment && payment.status !== 'void') {
    payments.void(payment.id)
  }
  // 선점 재고 release(원칙 VII — 배송 전에만).
  for (const item of subOrder.items) {
    inventory.release(item.productId, item.quantity)
  }
  subOrders.setStatus(subOrder.id, '환불중')
  return payment?.id
}

/**
 * 결제 라우트(기능 005). 멱등의 축은 `PaymentStore.getByKey` — authorize/void 모두
 * 부작용(청구·전이·재고 release) 실행 전에 키로 먼저 조회해, 이미 있으면 원 결과를 반환한다(Constitution VIII).
 * 004의 SubOrder·Inventory·MarketOrder store를 재사용한다(결제는 그 위에 얹는다).
 */
export function createMarketplacePaymentRoutes(
  payments: PaymentStore,
  orders: MarketOrderStore,
  subOrders: SubOrderStore,
  inventory: InventoryStore,
) {
  const routes = new Hono()

  // authorize: 주문 총액으로 1회 청구, SubOrder "결제대기"→"결제완료" (FR-001·002·003·005)
  routes.post('/marketplace/orders/:id/pay', async (c) => {
    const order = orders.get(c.req.param('id'))
    if (!order) return c.json({ error: 'order not found' }, 404)
    if (order.status === '취소됨') {
      return c.json({ error: 'cannot pay a cancelled order' }, 409)
    }

    const body = (await c.req.json().catch(() => ({}))) as { idempotencyKey?: unknown }
    const key = body.idempotencyKey
    if (typeof key !== 'string' || key.length === 0) {
      return c.json({ error: 'idempotencyKey is required' }, 400)
    }

    // 멱등(VIII): 같은 키가 이미 있으면 중복 청구 없이 원 결과 반환
    const existing = payments.getByKey(key)
    if (existing) {
      return c.json({ ...existing, subOrders: subOrders.listByOrder(existing.orderId) }, 200)
    }

    // 서버 권위(V): 클라이언트 amount 무시, 주문 total로 청구
    const payment = payments.create({ orderId: order.id, idempotencyKey: key, amount: order.total })
    for (const sub of subOrders.listByOrder(order.id)) {
      subOrders.setStatus(sub.id, '결제완료')
    }

    return c.json({ ...payment, subOrders: subOrders.listByOrder(order.id) }, 200)
  })

  // void: 배송 전 취소 — 결제 void + 재고 release + SubOrder "환불중" (FR-004·005)
  routes.post('/marketplace/payments/:id/void', (c) => {
    const payment = payments.get(c.req.param('id'))
    if (!payment) return c.json({ error: 'payment not found' }, 404)

    const subs = subOrders.listByOrder(payment.orderId)

    // 멱등(VIII): 이미 void면 중복 환불(재고 release) 없이 원 결과 반환
    if (payment.status === 'void') {
      return c.json({ ...payment, subOrders: subs }, 200)
    }

    // 배송 완료(또는 배송 진행) 건은 배송 전 취소 대상이 아님 → 409 (환불 경로는 008)
    const hasNonVoidable = subs.some((s) => s.status !== VOIDABLE_SUBORDER_STATUS)
    if (hasNonVoidable) {
      return c.json({ error: 'cannot void: order is not in a pre-shipping state' }, 409)
    }

    // 부작용: 결제 void + 재고 release + SubOrder "환불중".
    // SubOrder 단위 부작용은 voidPreDeliverySubOrder 헬퍼에 위임한다(008 배송 전 환불과 로직 공유).
    // payment void는 헬퍼 안에서 status 가드로 1회만 실행되므로, 여러 SubOrder를 돌아도 중복 void 없음.
    for (const sub of subs) {
      voidPreDeliverySubOrder(payments, subOrders, inventory, sub)
    }
    const voided = payments.get(payment.id)!

    return c.json({ ...voided, subOrders: subOrders.listByOrder(payment.orderId) }, 200)
  })

  return routes
}
