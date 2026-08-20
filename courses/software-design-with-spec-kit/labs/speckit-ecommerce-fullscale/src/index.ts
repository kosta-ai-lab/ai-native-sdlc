import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { createProductRoutes } from './products'
import { createOrderRoutes } from './orders'
import { createMarketplaceOrderRoutes } from './multiseller-orders'
import { createMarketplacePaymentRoutes } from './multiseller-payments'
import { createMarketplaceShippingRoutes } from './marketplace-shipping'
import { createMarketplaceSettlementRoutes } from './marketplace-settlement'
import { createMarketplaceRefundRoutes } from './marketplace-refund'
import {
  InMemoryProductStore,
  InMemoryOrderStore,
  InMemorySellerStore,
  InMemoryInventoryStore,
  InMemorySubOrderStore,
  InMemoryMarketOrderStore,
  InMemoryPaymentStore,
  InMemoryShipmentStore,
  InMemorySettlementStore,
  InMemoryRefundStore,
} from './store'

export const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

// 하나의 product store를 상품·주문 라우트가 공유한다(주문이 상품을 참조).
const productStore = new InMemoryProductStore()
const orderStore = new InMemoryOrderStore()
app.route('/', createProductRoutes(productStore))
app.route('/', createOrderRoutes(productStore, orderStore))

// 기능 004: 멀티셀러 마켓플레이스. Seller·Inventory·SubOrder store를 product store와 함께 공유한다.
const sellerStore = new InMemorySellerStore()
const inventoryStore = new InMemoryInventoryStore()
const subOrderStore = new InMemorySubOrderStore()
const marketOrderStore = new InMemoryMarketOrderStore()
app.route(
  '/',
  createMarketplaceOrderRoutes(productStore, sellerStore, inventoryStore, subOrderStore, marketOrderStore),
)

// 기능 005: 멱등 결제. SubOrder·Inventory·MarketOrder store를 004와 공유(결제는 그 위에 얹는다).
const paymentStore = new InMemoryPaymentStore()
app.route('/', createMarketplacePaymentRoutes(paymentStore, marketOrderStore, subOrderStore, inventoryStore))

// 기능 006: 배송 & 배송완료. SubOrder store를 004와 공유(배송은 그 위에 얹는다).
// 배송완료(markDelivered)가 정산(007)의 트리거 — SubOrder.status="배송완료"가 곧 정산 큐(원칙 IX).
const shipmentStore = new InMemoryShipmentStore()
app.route('/', createMarketplaceShippingRoutes(subOrderStore, shipmentStore))

// 기능 007: 정산. 배송완료(006) SubOrder를 판매자별로 집계·수수료 공제·지급(원칙 IX·V).
// 정산 큐는 SubOrderStore.listByStatus('배송완료') — subOrder·seller store를 004/006과 공유한다.
const settlementStore = new InMemorySettlementStore()
app.route('/', createMarketplaceSettlementRoutes(subOrderStore, sellerStore, settlementStore))

// 기능 008: 환불 & 역산. SubOrder 상태별 3분기 — 배송 전은 005 void 로직, 정산완료 건은 007 역산 훅을 재사용한다.
// payment·subOrder·inventory·settlement store를 004~007과 공유한다(환불은 그 위에 얹는다).
const refundStore = new InMemoryRefundStore()
app.route('/', createMarketplaceRefundRoutes(refundStore, paymentStore, subOrderStore, inventoryStore, settlementStore))

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 3000)
  serve({ fetch: app.fetch, port })
  console.log(`listening on :${port}`)
}
