import { describe, it, expect } from 'vitest'
import { parseSteps } from '../types'

describe('parseSteps', () => {
  it('parses a step with moves', () => {
    const yaml = `
- id: step-00-init
  name: init
  tag: step-00-init
  gate: ["smoke:/health"]
  moves:
    - id: scaffold
      run: "echo hi"
      commit: "chore: scaffold"
`
    const steps = parseSteps(yaml)
    expect(steps[0].id).toBe('step-00-init')
    expect(steps[0].moves[0].commit).toBe('chore: scaffold')
    expect(steps[0].gate).toEqual(['smoke:/health'])
  })

  it('defaults gate to empty array when omitted', () => {
    const steps = parseSteps(`
- id: s1
  name: n
  tag: t
  moves:
    - id: m1
      commit: "feat: x"
`)
    expect(steps[0].gate).toEqual([])
  })

  it('rejects a step missing tag', () => {
    expect(() => parseSteps(`- id: x\n  name: x\n  moves: []`)).toThrow()
  })
})
