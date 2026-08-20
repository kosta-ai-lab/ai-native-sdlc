import { describe, it, expect } from 'vitest'
import { validateProductInput } from './products'

describe('validateProductInput (create)', () => {
  it('accepts valid input', () => {
    expect(validateProductInput({ name: 'Keyboard', price: 4200, stock: 10 })).toBeNull()
  })
  it('rejects missing name', () => {
    expect(validateProductInput({ price: 100, stock: 1 })).toMatch(/name/)
  })
  it('rejects empty name', () => {
    expect(validateProductInput({ name: '   ', price: 100, stock: 1 })).toMatch(/name/)
  })
  it('rejects negative price', () => {
    expect(validateProductInput({ name: 'X', price: -1, stock: 1 })).toMatch(/price/)
  })
  it('rejects non-integer price', () => {
    expect(validateProductInput({ name: 'X', price: 9.99, stock: 1 })).toMatch(/price/)
  })
  it('rejects negative stock', () => {
    expect(validateProductInput({ name: 'X', price: 1, stock: -5 })).toMatch(/stock/)
  })
})

describe('validateProductInput (partial)', () => {
  it('allows omitted fields in partial mode', () => {
    expect(validateProductInput({ price: 3900 }, { partial: true })).toBeNull()
  })
  it('still rejects an invalid provided field in partial mode', () => {
    expect(validateProductInput({ price: -1 }, { partial: true })).toMatch(/price/)
  })
})
