import { randomUUID } from 'node:crypto'

export interface Product {
  id: string
  name: string
  price: number
  stock: number
  /** 소유 판매자(도메인 모델: Seller 1→* Product). 기능 004에서 도입, 001~003 상품은 미지정. */
  sellerId?: string
}

export interface NewProduct {
  name: string
  price: number
  stock: number
  sellerId?: string
}

/** 상품 저장소. 인메모리이며, 이후 구현 교체를 위해 인터페이스로 분리(Constitution III). */
export interface ProductStore {
  create(input: NewProduct): Product
  list(): Product[]
  get(id: string): Product | undefined
  update(id: string, patch: Partial<NewProduct>): Product | undefined
  delete(id: string): boolean
}

export class InMemoryProductStore implements ProductStore {
  private items = new Map<string, Product>()

  create(input: NewProduct): Product {
    const product: Product = { id: randomUUID(), ...input }
    this.items.set(product.id, product)
    return product
  }

  list(): Product[] {
    return [...this.items.values()]
  }

  get(id: string): Product | undefined {
    return this.items.get(id)
  }

  update(id: string, patch: Partial<NewProduct>): Product | undefined {
    const existing = this.items.get(id)
    if (!existing) return undefined
    const updated: Product = { ...existing, ...patch }
    this.items.set(id, updated)
    return updated
  }

  delete(id: string): boolean {
    return this.items.delete(id)
  }
}

export type OrderStatus = 'pending' | 'cancelled'

export interface OrderItem {
  productId: string
  quantity: number
}

export interface Order {
  id: string
  items: OrderItem[]
  total: number
  status: OrderStatus
}

/** 주문 저장소. total은 서버가 계산해 넘겨준 값을 저장한다. */
export interface OrderStore {
  create(input: { items: OrderItem[]; total: number }): Order
  list(): Order[]
  get(id: string): Order | undefined
  setStatus(id: string, status: OrderStatus): Order | undefined
}

export class InMemoryOrderStore implements OrderStore {
  private items = new Map<string, Order>()

  create(input: { items: OrderItem[]; total: number }): Order {
    const order: Order = { id: randomUUID(), items: input.items, total: input.total, status: 'pending' }
    this.items.set(order.id, order)
    return order
  }

  list(): Order[] {
    return [...this.items.values()]
  }

  get(id: string): Order | undefined {
    return this.items.get(id)
  }

  setStatus(id: string, status: OrderStatus): Order | undefined {
    const existing = this.items.get(id)
    if (!existing) return undefined
    const updated: Order = { ...existing, status }
    this.items.set(id, updated)
    return updated
  }
}

// ─────────────────────────────────────────────────────────────
// 기능 004: 멀티셀러 마켓플레이스 (Seller · Inventory · SubOrder)
// 도메인 모델·ERD·상태머신 다이어그램을 정본으로 삼는다.
// ─────────────────────────────────────────────────────────────

export type SellerStatus = '승인대기' | '승인' | '정지'

export interface Seller {
  id: string
  name: string
  status: SellerStatus
  commissionRate: number
}

export interface NewSeller {
  name: string
  status?: SellerStatus
  commissionRate?: number
}

/** 판매자 저장소. canSell = status === '승인'(Constitution VI 토대). */
export interface SellerStore {
  create(input: NewSeller): Seller
  get(id: string): Seller | undefined
  canSell(id: string): boolean
}

export class InMemorySellerStore implements SellerStore {
  private items = new Map<string, Seller>()

  create(input: NewSeller): Seller {
    const seller: Seller = {
      id: randomUUID(),
      name: input.name,
      status: input.status ?? '승인대기',
      commissionRate: input.commissionRate ?? 0,
    }
    this.items.set(seller.id, seller)
    return seller
  }

  get(id: string): Seller | undefined {
    return this.items.get(id)
  }

  canSell(id: string): boolean {
    return this.items.get(id)?.status === '승인'
  }
}

/** 재고. available = quantity − reserved. reserve는 available 범위에서만 성공(Constitution VII). */
export interface Inventory {
  productId: string
  quantity: number
  reserved: number
}

export interface InventoryStore {
  /** productId 재고를 등록(이미 있으면 quantity를 덮어씀). */
  set(productId: string, quantity: number): Inventory
  get(productId: string): Inventory | undefined
  /** available( = quantity − reserved). 미등록이면 0. */
  available(productId: string): number
  /** available 이상이면 reserve 후 true, 부족하면 아무 변화 없이 false. */
  reserve(productId: string, qty: number): boolean
  /** reserved를 qty만큼 되돌린다(0 미만으로 내려가지 않음). */
  release(productId: string, qty: number): void
}

export class InMemoryInventoryStore implements InventoryStore {
  private items = new Map<string, Inventory>()

  set(productId: string, quantity: number): Inventory {
    const existing = this.items.get(productId)
    const inv: Inventory = { productId, quantity, reserved: existing?.reserved ?? 0 }
    this.items.set(productId, inv)
    return inv
  }

  get(productId: string): Inventory | undefined {
    return this.items.get(productId)
  }

  available(productId: string): number {
    const inv = this.items.get(productId)
    if (!inv) return 0
    return inv.quantity - inv.reserved
  }

  reserve(productId: string, qty: number): boolean {
    const inv = this.items.get(productId)
    if (!inv || inv.quantity - inv.reserved < qty) return false
    this.items.set(productId, { ...inv, reserved: inv.reserved + qty })
    return true
  }

  release(productId: string, qty: number): void {
    const inv = this.items.get(productId)
    if (!inv) return
    this.items.set(productId, { ...inv, reserved: Math.max(0, inv.reserved - qty) })
  }
}

export type SubOrderStatus =
  | '결제대기'
  | '결제완료'
  | '수락됨'
  | '배송중'
  | '배송완료'
  | '정산대상'
  | '정산완료'
  | '환불중'
  | '환불완료'
  | '취소됨'

export interface SubOrderItem {
  productId: string
  unitPrice: number
  quantity: number
}

export interface SubOrder {
  id: string
  orderId: string
  sellerId: string
  subtotal: number
  status: SubOrderStatus
  items: SubOrderItem[]
}

export interface SubOrderStore {
  create(input: { orderId: string; sellerId: string; subtotal: number; items: SubOrderItem[] }): SubOrder
  get(id: string): SubOrder | undefined
  listByOrder(orderId: string): SubOrder[]
  /** 상태로 조회. 정산(007)은 listByStatus('배송완료')로 정산 큐를 읽는다(원칙 IX). */
  listByStatus(status: SubOrderStatus): SubOrder[]
  setStatus(id: string, status: SubOrderStatus): SubOrder | undefined
}

export class InMemorySubOrderStore implements SubOrderStore {
  private items = new Map<string, SubOrder>()

  create(input: { orderId: string; sellerId: string; subtotal: number; items: SubOrderItem[] }): SubOrder {
    const subOrder: SubOrder = {
      id: randomUUID(),
      orderId: input.orderId,
      sellerId: input.sellerId,
      subtotal: input.subtotal,
      status: '결제대기',
      items: input.items,
    }
    this.items.set(subOrder.id, subOrder)
    return subOrder
  }

  get(id: string): SubOrder | undefined {
    return this.items.get(id)
  }

  listByOrder(orderId: string): SubOrder[] {
    return [...this.items.values()].filter((s) => s.orderId === orderId)
  }

  listByStatus(status: SubOrderStatus): SubOrder[] {
    return [...this.items.values()].filter((s) => s.status === status)
  }

  setStatus(id: string, status: SubOrderStatus): SubOrder | undefined {
    const existing = this.items.get(id)
    if (!existing) return undefined
    const updated: SubOrder = { ...existing, status }
    this.items.set(id, updated)
    return updated
  }
}

export type MarketOrderStatus = 'pending' | '취소됨'

export interface MarketOrder {
  id: string
  buyerId?: string
  total: number
  status: MarketOrderStatus
}

/** 멀티셀러 주문 저장소. total은 서버가 SubOrder subtotal 합으로 계산(Constitution V). */
export interface MarketOrderStore {
  create(input: { buyerId?: string; total: number }): MarketOrder
  get(id: string): MarketOrder | undefined
  list(): MarketOrder[]
  setStatus(id: string, status: MarketOrderStatus): MarketOrder | undefined
}

export class InMemoryMarketOrderStore implements MarketOrderStore {
  private items = new Map<string, MarketOrder>()

  create(input: { buyerId?: string; total: number }): MarketOrder {
    const order: MarketOrder = { id: randomUUID(), buyerId: input.buyerId, total: input.total, status: 'pending' }
    this.items.set(order.id, order)
    return order
  }

  get(id: string): MarketOrder | undefined {
    return this.items.get(id)
  }

  list(): MarketOrder[] {
    return [...this.items.values()]
  }

  setStatus(id: string, status: MarketOrderStatus): MarketOrder | undefined {
    const existing = this.items.get(id)
    if (!existing) return undefined
    const updated: MarketOrder = { ...existing, status }
    this.items.set(id, updated)
    return updated
  }
}

// ─────────────────────────────────────────────────────────────
// 기능 005: 멱등 결제 (Payment)
// 결제는 Order 단위 1회 청구. idempotencyKey가 고유키이며,
// 같은 키 재요청은 중복 청구·환불 없이 원 결과를 돌려준다(Constitution VIII).
// ─────────────────────────────────────────────────────────────

export type PaymentStatus = '승인' | 'void'

export interface Payment {
  id: string
  orderId: string
  /** 멱등 고유키. 같은 키의 authorize/void는 원 결과를 반환한다(VIII). */
  idempotencyKey: string
  amount: number
  status: PaymentStatus
}

/**
 * 결제 저장소. 멱등의 축은 `getByKey` — authorize/void는 부작용 실행 전에
 * 키로 먼저 조회해 이미 있으면 원 Payment를 반환한다.
 */
export interface PaymentStore {
  create(input: { orderId: string; idempotencyKey: string; amount: number }): Payment
  get(id: string): Payment | undefined
  /** idempotencyKey로 조회. 멱등 보장의 핵심(VIII). */
  getByKey(idempotencyKey: string): Payment | undefined
  /** orderId로 결제 조회(Order당 1회 청구, 원칙 VI). 008 환불이 SubOrder→Order 결제를 찾을 때 사용. */
  getByOrder(orderId: string): Payment | undefined
  /** status를 'void'로 전환. 반환은 갱신된 Payment. */
  void(id: string): Payment | undefined
}

export class InMemoryPaymentStore implements PaymentStore {
  private items = new Map<string, Payment>()
  /** idempotencyKey → paymentId 인덱스. O(1) 멱등 조회. */
  private byKey = new Map<string, string>()

  create(input: { orderId: string; idempotencyKey: string; amount: number }): Payment {
    const payment: Payment = {
      id: randomUUID(),
      orderId: input.orderId,
      idempotencyKey: input.idempotencyKey,
      amount: input.amount,
      status: '승인',
    }
    this.items.set(payment.id, payment)
    this.byKey.set(payment.idempotencyKey, payment.id)
    return payment
  }

  get(id: string): Payment | undefined {
    return this.items.get(id)
  }

  getByKey(idempotencyKey: string): Payment | undefined {
    const id = this.byKey.get(idempotencyKey)
    return id ? this.items.get(id) : undefined
  }

  getByOrder(orderId: string): Payment | undefined {
    return [...this.items.values()].find((p) => p.orderId === orderId)
  }

  void(id: string): Payment | undefined {
    const existing = this.items.get(id)
    if (!existing) return undefined
    const updated: Payment = { ...existing, status: 'void' }
    this.items.set(id, updated)
    return updated
  }
}

// ─────────────────────────────────────────────────────────────
// 기능 006: 배송 & 배송완료 (Shipment)
// 판매자가 결제완료 SubOrder를 수락하고 배송사에 접수하면 배송이 시작되고,
// markDelivered가 SubOrder를 "배송완료"로 전환한다 — 이것이 정산의 트리거다(Constitution IX).
// 정산 큐는 별도 목록이 아니라 SubOrder.status "배송완료"로 표현한다(단일 진실의 원천).
// ─────────────────────────────────────────────────────────────

export type ShipmentStatus = '접수' | '배송중' | '완료'

export interface Shipment {
  id: string
  subOrderId: string
  carrierId: string
  status: ShipmentStatus
  /** 배송완료 시각. markDelivered 전에는 undefined. */
  deliveredAt?: string
}

/**
 * 배송 저장소. 한 SubOrder에 배송 1건이 대응한다.
 * markDelivered는 status를 "완료"로 바꾸고 deliveredAt을 기록한다.
 * 멱등 판단(중복 정산 차단)은 라우트가 SubOrder.status로 하므로, store는 얇게 유지한다.
 */
export interface ShipmentStore {
  create(input: { subOrderId: string; carrierId: string }): Shipment
  get(id: string): Shipment | undefined
  getBySubOrder(subOrderId: string): Shipment | undefined
  markDelivered(id: string): Shipment | undefined
}

export class InMemoryShipmentStore implements ShipmentStore {
  private items = new Map<string, Shipment>()

  create(input: { subOrderId: string; carrierId: string }): Shipment {
    const shipment: Shipment = {
      id: randomUUID(),
      subOrderId: input.subOrderId,
      carrierId: input.carrierId,
      status: '배송중',
    }
    this.items.set(shipment.id, shipment)
    return shipment
  }

  get(id: string): Shipment | undefined {
    return this.items.get(id)
  }

  getBySubOrder(subOrderId: string): Shipment | undefined {
    return [...this.items.values()].find((s) => s.subOrderId === subOrderId)
  }

  markDelivered(id: string): Shipment | undefined {
    const existing = this.items.get(id)
    if (!existing) return undefined
    const updated: Shipment = { ...existing, status: '완료', deliveredAt: new Date().toISOString() }
    this.items.set(id, updated)
    return updated
  }
}

// ─────────────────────────────────────────────────────────────
// 기능 007: 정산 (Settlement) — 판매자별, 배송완료 트리거
// 정산 주기(배치)마다 "배송완료" SubOrder를 판매자별로 집계한다.
// gross = 그 판매자 SubOrder subtotal 합, commission = gross × seller.commissionRate,
// netPayout = gross − commission (모두 서버가 계산, 원칙 V).
// 정산 큐는 별도 목록이 아니라 SubOrderStore.listByStatus('배송완료')이다(원칙 IX, 단일 진실의 원천).
// 이미 "정산완료"된 SubOrder가 환불되면(008) recordReversal로 역산 대기에 등록되고,
// 차기 정산 주기에 음수 SettlementItem으로 차감된다(FR-005).
// ─────────────────────────────────────────────────────────────

export interface Settlement {
  id: string
  sellerId: string
  /** 정산 주기 식별자(예: ISO 타임스탬프). 서버가 run 시점에 부여. */
  period: string
  grossAmount: number
  commission: number
  /** netPayout = grossAmount − commission. 서버 단일 지점에서만 계산(원칙 V). */
  netPayout: number
  /** 이 정산에 포함된 SettlementItem id 목록(양수 집계 + 음수 역산). */
  itemIds: string[]
}

export interface SettlementItem {
  id: string
  settlementId: string
  subOrderId: string
  /** 양수 = 정산 집계 금액, 음수 = 환불 역산 차감 금액. */
  amount: number
  /** 역산(환불 차감) 항목이면 true. 스펙의 "± reversal marker". */
  reversal: boolean
}

/**
 * 정산 저장소. 집계 계산·전이는 라우트가 오케스트레이션하고, store는 기록·조회·역산 큐만 담당한다(단일 책임).
 * 역산 훅(recordReversal/pendingReversals/consumeReversal)은 008 환불이 호출하는 지연 큐다:
 * 이미 정산완료된 SubOrder가 환불되면 recordReversal로 등록만 하고, 실제 차감은 차기 run이 수행한다.
 */
export interface SettlementStore {
  /** 집계 결과 Settlement + 그에 속한 SettlementItem들을 저장한다. */
  saveSettlement(input: {
    sellerId: string
    period: string
    grossAmount: number
    commission: number
    netPayout: number
    items: { subOrderId: string; amount: number; reversal: boolean }[]
  }): Settlement
  list(): Settlement[]
  get(id: string): Settlement | undefined
  getBySeller(sellerId: string): Settlement[]
  listItems(settlementId: string): SettlementItem[]
  /**
   * 역산 훅(FR-005) — 008이 호출. 이미 정산완료된 SubOrder의 환불을 역산 대기 큐에 등록한다.
   * amount는 차감할 금액(양수로 전달; run이 음수 항목으로 반영). 즉시 차감하지 않고 차기 run이 소비한다.
   */
  recordReversal(input: { subOrderId: string; sellerId: string; amount: number }): void
  /** 아직 소비되지 않은 역산 대기 목록. 차기 run이 판매자 그룹 계산에 합산한다. */
  pendingReversals(): { subOrderId: string; sellerId: string; amount: number }[]
  /** 집계에 반영한 역산을 소진 표시한다(중복 차감 방지). */
  consumeReversal(subOrderId: string): void
}

export class InMemorySettlementStore implements SettlementStore {
  private settlements = new Map<string, Settlement>()
  private items = new Map<string, SettlementItem>()
  /** subOrderId → 역산 대기 항목. 같은 SubOrder 중복 등록은 마지막 값으로 덮어쓴다. */
  private reversals = new Map<string, { subOrderId: string; sellerId: string; amount: number }>()

  saveSettlement(input: {
    sellerId: string
    period: string
    grossAmount: number
    commission: number
    netPayout: number
    items: { subOrderId: string; amount: number; reversal: boolean }[]
  }): Settlement {
    const settlementId = randomUUID()
    const itemIds: string[] = []
    for (const it of input.items) {
      const item: SettlementItem = {
        id: randomUUID(),
        settlementId,
        subOrderId: it.subOrderId,
        amount: it.amount,
        reversal: it.reversal,
      }
      this.items.set(item.id, item)
      itemIds.push(item.id)
    }
    const settlement: Settlement = {
      id: settlementId,
      sellerId: input.sellerId,
      period: input.period,
      grossAmount: input.grossAmount,
      commission: input.commission,
      netPayout: input.netPayout,
      itemIds,
    }
    this.settlements.set(settlementId, settlement)
    return settlement
  }

  list(): Settlement[] {
    return [...this.settlements.values()]
  }

  get(id: string): Settlement | undefined {
    return this.settlements.get(id)
  }

  getBySeller(sellerId: string): Settlement[] {
    return [...this.settlements.values()].filter((s) => s.sellerId === sellerId)
  }

  listItems(settlementId: string): SettlementItem[] {
    return [...this.items.values()].filter((i) => i.settlementId === settlementId)
  }

  recordReversal(input: { subOrderId: string; sellerId: string; amount: number }): void {
    this.reversals.set(input.subOrderId, { ...input })
  }

  pendingReversals(): { subOrderId: string; sellerId: string; amount: number }[] {
    return [...this.reversals.values()]
  }

  consumeReversal(subOrderId: string): void {
    this.reversals.delete(subOrderId)
  }
}

// ─────────────────────────────────────────────────────────────
// 기능 008: 환불 & 역산 (Refund)
// SubOrder 하나를 환불한다(전액 또는 부분). 실제 부작용은 시점별로 세 갈래로 분기한다:
//  - 배송 전(결제완료): 005의 배송 전 취소(void) 로직을 재사용 — 결제 void + 재고 release.
//  - 배송완료·정산 전: 정산 큐(listByStatus('배송완료'))에서 빠지도록 상태 전이(역산 불필요).
//  - 정산완료: 007의 reverseSettledSubOrder 훅으로 차기 정산 주기 역산(차감)을 예약.
// 세 갈래 모두 최종 상태는 "환불완료"다(상태머신 환불중 → 환불완료).
// 멱등의 축은 RefundStore.getBySubOrder — 부작용 전에 이미 환불된 SubOrder인지 먼저 조회한다(원칙 VIII).
// ─────────────────────────────────────────────────────────────

export interface Refund {
  id: string
  subOrderId: string
  /** 배송 전 환불이면 void 대상 결제 id, 배송 후(결제 void 없음)면 undefined. */
  paymentId?: string
  amount: number
  reason?: string
}

/**
 * 환불 저장소. 멱등의 축은 `getBySubOrder` — 라우트는 부작용(void·역산 예약) 실행 전에
 * SubOrder로 먼저 조회해, 이미 환불된 건이면 원 Refund를 그대로 반환한다(중복 환불·이중 역산 차단, 원칙 VIII).
 */
export interface RefundStore {
  create(input: { subOrderId: string; paymentId?: string; amount: number; reason?: string }): Refund
  get(id: string): Refund | undefined
  /** subOrderId로 조회. 멱등 보장의 핵심(VIII) — 한 SubOrder는 최대 한 번만 환불된다. */
  getBySubOrder(subOrderId: string): Refund | undefined
}

export class InMemoryRefundStore implements RefundStore {
  private items = new Map<string, Refund>()
  /** subOrderId → refundId 인덱스. O(1) 멱등 조회. */
  private bySubOrder = new Map<string, string>()

  create(input: { subOrderId: string; paymentId?: string; amount: number; reason?: string }): Refund {
    const refund: Refund = {
      id: randomUUID(),
      subOrderId: input.subOrderId,
      paymentId: input.paymentId,
      amount: input.amount,
      reason: input.reason,
    }
    this.items.set(refund.id, refund)
    this.bySubOrder.set(refund.subOrderId, refund.id)
    return refund
  }

  get(id: string): Refund | undefined {
    return this.items.get(id)
  }

  getBySubOrder(subOrderId: string): Refund | undefined {
    const id = this.bySubOrder.get(subOrderId)
    return id ? this.items.get(id) : undefined
  }
}
