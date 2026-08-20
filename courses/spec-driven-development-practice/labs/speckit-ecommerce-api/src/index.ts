import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { createProductRoutes } from './products'
import { createOrderRoutes } from './orders'
import { InMemoryProductStore, InMemoryOrderStore } from './store'

export const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

// 하나의 product store를 상품·주문 라우트가 공유한다(주문이 상품을 참조).
const productStore = new InMemoryProductStore()
const orderStore = new InMemoryOrderStore()
app.route('/', createProductRoutes(productStore))
app.route('/', createOrderRoutes(productStore, orderStore))

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 3000)
  serve({ fetch: app.fetch, port })
  console.log(`listening on :${port}`)
}
