import { Hono } from 'hono'
import type { SubOrderStore, SellerStore, SettlementStore, Settlement } from './store'

/** 정산 큐 = 배송완료 SubOrder(원칙 IX). 이 상태만 집계 대상이며, 배송 안 된 건은 자동 제외된다. */
const SETTLEMENT_QUEUE_STATUS = '배송완료'

/**
 * 정산 배치 1회 실행(FR-001~005). 순수 로직으로 분리해 라우트·직접 호출(008) 양쪽에서 재사용한다.
 *
 * 서버 권위(원칙 V)의 축: 이 함수는 클라이언트 금액을 일절 받지 않는다.
 * gross/commission/netPayout은 전적으로 저장된 SubOrder.subtotal 합과 Seller.commissionRate에서 파생하며,
 * netPayout = gross − commission은 코드 단일 지점(아래 한 줄)에서만 계산된다.
 *
 * 절차:
 *  1) listByStatus('배송완료')를 sellerId로 그룹핑(FR-001·002, 미배송 제외).
 *  2) 판매자별 pendingReversals(환불 역산 대기, FR-005)를 합류 — 정산완료 건이 없어도 역산만 있으면 정산을 연다.
 *  3) gross = Σ 배송완료 subtotal, commission = gross × rate, netPayout = gross − commission − Σ 역산분.
 *     (역산은 판매자 순지급에서 차감; 음수 SettlementItem으로 기록.)
 *  4) 집계된 배송완료 SubOrder를 '정산완료'로 전이(FR-004), 역산은 소진 표시.
 *
 * 대상(배송완료·역산)이 하나도 없는 판매자는 빈 Settlement를 만들지 않는다(스펙 Edge Case).
 */
export function runSettlement(
  subOrders: SubOrderStore,
  sellers: SellerStore,
  settlements: SettlementStore,
  period = new Date().toISOString(),
): Settlement[] {
  // 1) 배송완료 SubOrder를 판매자별로 그룹핑(미배송은 이 목록에 없어 자동 제외 — FR-001, SC-002).
  const queue = subOrders.listByStatus(SETTLEMENT_QUEUE_STATUS)
  const bySeller = new Map<string, typeof queue>()
  for (const sub of queue) {
    const group = bySeller.get(sub.sellerId) ?? []
    group.push(sub)
    bySeller.set(sub.sellerId, group)
  }

  // 2) 역산 대기(FR-005)를 판매자별로 그룹핑. 배송완료가 없는 판매자도 역산만 있으면 정산을 연다.
  const reversalsBySeller = new Map<string, ReturnType<SettlementStore['pendingReversals']>>()
  for (const rev of settlements.pendingReversals()) {
    const group = reversalsBySeller.get(rev.sellerId) ?? []
    group.push(rev)
    reversalsBySeller.set(rev.sellerId, group)
  }

  const created: Settlement[] = []
  const sellerIds = new Set<string>([...bySeller.keys(), ...reversalsBySeller.keys()])

  for (const sellerId of sellerIds) {
    const delivered = bySeller.get(sellerId) ?? []
    const reversals = reversalsBySeller.get(sellerId) ?? []

    // 대상 없음(배송완료·역산 모두 0) → 빈 Settlement 생성 안 함(Edge Case).
    if (delivered.length === 0 && reversals.length === 0) continue

    const rate = sellers.get(sellerId)?.commissionRate ?? 0

    // 3) 서버 권위 계산(원칙 V) — 클라이언트 값 없음.
    const gross = delivered.reduce((sum, s) => sum + s.subtotal, 0)
    const commission = gross * rate
    const reversalTotal = reversals.reduce((sum, r) => sum + r.amount, 0)
    // netPayout은 여기 단일 지점에서만 산출된다: gross − commission − (환불 역산 차감분).
    const netPayout = gross - commission - reversalTotal

    const items = [
      ...delivered.map((s) => ({ subOrderId: s.id, amount: s.subtotal, reversal: false })),
      ...reversals.map((r) => ({ subOrderId: r.subOrderId, amount: -r.amount, reversal: true })),
    ]

    const settlement = settlements.saveSettlement({
      sellerId,
      period,
      grossAmount: gross,
      commission,
      netPayout,
      items,
    })

    // 4) 집계된 배송완료 SubOrder를 '정산완료'로 전이(FR-004). 재실행 시 큐에서 빠져 중복 집계 불가.
    for (const s of delivered) {
      subOrders.setStatus(s.id, '정산완료')
    }
    // 반영한 역산은 소진 표시(차기 run에서 중복 차감 방지).
    for (const r of reversals) {
      settlements.consumeReversal(r.subOrderId)
    }

    created.push(settlement)
  }

  return created
}

/**
 * 정산완료된 SubOrder의 환불을 차기 정산 주기의 역산(차감)으로 예약한다(FR-005).
 * 008(환불)이 함수로 직접 호출하거나, 아래 POST /marketplace/settlements/reversals 경로로 호출한다.
 * 즉시 차감하지 않고 대기 큐에 등록만 하며, 실제 차감은 다음 runSettlement가 수행한다.
 */
export function reverseSettledSubOrder(
  settlements: SettlementStore,
  input: { subOrderId: string; sellerId: string; amount: number },
): void {
  settlements.recordReversal(input)
}

/**
 * 정산 라우트(기능 007). 006이 노출한 정산 큐(SubOrderStore.listByStatus('배송완료'))를 재사용한다.
 * 004의 Seller·SubOrder store, 신설 Settlement store를 공유한다(정산은 그 위에 얹는다).
 */
export function createMarketplaceSettlementRoutes(
  subOrders: SubOrderStore,
  sellers: SellerStore,
  settlements: SettlementStore,
) {
  const routes = new Hono()

  // 정산 배치 실행: 배송완료 건을 판매자별로 집계·전이·기록 (FR-001~004). body 없음(서버 권위).
  routes.post('/marketplace/settlements/run', (c) => {
    const created = runSettlement(subOrders, sellers, settlements)
    return c.json(created, 200)
  })

  // 정산 목록 조회 (US1).
  routes.get('/marketplace/settlements', (c) => {
    return c.json(settlements.list(), 200)
  })

  // 역산 훅 경로(FR-005) — 008이 정산완료 건 환불을 차기 정산 역산으로 예약한다.
  routes.post('/marketplace/settlements/reversals', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as {
      subOrderId?: unknown
      amount?: unknown
    }
    const subOrderId = typeof body.subOrderId === 'string' ? body.subOrderId : ''
    if (!subOrderId) return c.json({ error: 'subOrderId is required' }, 400)

    const subOrder = subOrders.get(subOrderId)
    if (!subOrder) return c.json({ error: 'sub-order not found' }, 404)
    // 역산은 이미 정산완료된 건에만 성립한다(원칙 IX·FR-005). 그 외 상태는 409.
    if (subOrder.status !== '정산완료') {
      return c.json({ error: `cannot reverse a sub-order in status ${subOrder.status}` }, 409)
    }

    // 서버 권위(원칙 V): 차감 금액은 클라이언트 값이 아니라 저장된 subtotal로 결정한다.
    // 부분 환불 금액은 008이 별도 검증하며, 여기서는 SubOrder 단위 전액 역산을 기본으로 한다.
    const amount =
      typeof body.amount === 'number' && body.amount > 0 && body.amount <= subOrder.subtotal
        ? body.amount
        : subOrder.subtotal

    reverseSettledSubOrder(settlements, { subOrderId, sellerId: subOrder.sellerId, amount })
    return c.json({ subOrderId, sellerId: subOrder.sellerId, amount, scheduled: true }, 200)
  })

  return routes
}
