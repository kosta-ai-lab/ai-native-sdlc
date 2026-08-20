import { Hono } from 'hono'
import type { ProductStore, NewProduct } from './store'

/**
 * 상품 입력 검증(순수 함수). 오류 메시지 문자열 또는 null(유효) 반환.
 * partial=true면 제공된 필드만 검증(부분 수정용). FR-002, FR-005.
 */
export function validateProductInput(
  input: Record<string, unknown>,
  opts: { partial?: boolean } = {},
): string | null {
  const partial = opts.partial ?? false
  const provided = (k: string) => input[k] !== undefined

  if (!partial || provided('name')) {
    if (typeof input.name !== 'string' || input.name.trim() === '') {
      return 'name is required and must be a non-empty string'
    }
  }
  if (!partial || provided('price')) {
    if (!Number.isInteger(input.price) || (input.price as number) < 0) {
      return 'price must be a non-negative integer (cents)'
    }
  }
  if (!partial || provided('stock')) {
    if (!Number.isInteger(input.stock) || (input.stock as number) < 0) {
      return 'stock must be a non-negative integer'
    }
  }
  return null
}

/** body에서 허용된 상품 필드만 추출(id 등 오염 방지). */
function pickProductFields(body: Record<string, unknown>): Partial<NewProduct> {
  const patch: Partial<NewProduct> = {}
  if (body.name !== undefined) patch.name = body.name as string
  if (body.price !== undefined) patch.price = body.price as number
  if (body.stock !== undefined) patch.stock = body.stock as number
  return patch
}

/** 상품 라우트. store를 주입받아 REST 엔드포인트를 구성한다. */
export function createProductRoutes(store: ProductStore) {
  const routes = new Hono()

  routes.post('/products', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
    const err = validateProductInput(body, {})
    if (err) return c.json({ error: err }, 400)
    const product = store.create(pickProductFields(body) as NewProduct)
    return c.json(product, 201)
  })

  routes.get('/products', (c) => c.json(store.list()))

  routes.get('/products/:id', (c) => {
    const product = store.get(c.req.param('id'))
    if (!product) return c.json({ error: 'product not found' }, 404)
    return c.json(product)
  })

  routes.patch('/products/:id', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
    const err = validateProductInput(body, { partial: true })
    if (err) return c.json({ error: err }, 400)
    const updated = store.update(c.req.param('id'), pickProductFields(body))
    if (!updated) return c.json({ error: 'product not found' }, 404)
    return c.json(updated)
  })

  routes.delete('/products/:id', (c) => {
    const ok = store.delete(c.req.param('id'))
    if (!ok) return c.json({ error: 'product not found' }, 404)
    return c.body(null, 204)
  })

  return routes
}
