import { randomUUID } from 'node:crypto'

export interface Product {
  id: string
  name: string
  price: number
  stock: number
}

export interface NewProduct {
  name: string
  price: number
  stock: number
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
