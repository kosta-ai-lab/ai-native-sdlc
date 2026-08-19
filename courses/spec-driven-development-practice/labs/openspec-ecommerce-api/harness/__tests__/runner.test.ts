import { describe, it, expect, vi } from 'vitest'
import { runStep } from '../runner'
import type { Step, Executor } from '../types'

const okExec: Executor = { runPrompt: async () => ({ ok: true, log: 'done' }) }
const failExec: Executor = { runPrompt: async () => ({ ok: false, log: 'boom' }) }

const baseStep: Step = {
  id: 'step-01', name: 'propose', tag: 'step-01-propose', gate: [],
  moves: [{ id: 'm1', prompt: '/opsx propose products', commit: 'feat: propose', verify: [] }],
}

describe('runStep', () => {
  it('commits each move and tags on gate pass', async () => {
    const git = vi.fn()
    const check = vi.fn(async () => ({ ok: true, detail: '' }))
    const r = await runStep(baseStep, { exec: okExec, git, check, cwd: '.' })
    expect(r.ok).toBe(true)
    expect(r.tagged).toBe(true)
    expect(git).toHaveBeenCalledWith('commit -m "feat: propose"')
    expect(git).toHaveBeenCalledWith('tag step-01-propose')
  })

  it('stops without tag when a move verify fails', async () => {
    const git = vi.fn()
    const check = vi.fn(async () => ({ ok: false, detail: 'x' }))
    const failStep: Step = { ...baseStep, moves: [{ ...baseStep.moves[0], verify: ['file:nope'] }] }
    const r = await runStep(failStep, { exec: okExec, git, check, cwd: '.' })
    expect(r.ok).toBe(false)
    expect(r.tagged).toBe(false)
    expect(git).not.toHaveBeenCalledWith('tag step-01-propose')
  })

  it('stops without commit when the prompt executor fails', async () => {
    const git = vi.fn()
    const check = vi.fn(async () => ({ ok: true, detail: '' }))
    const r = await runStep(baseStep, { exec: failExec, git, check, cwd: '.' })
    expect(r.ok).toBe(false)
    expect(git).not.toHaveBeenCalled()
  })

  it('fails when a step gate fails after moves commit', async () => {
    const git = vi.fn()
    const check = vi.fn(async () => ({ ok: false, detail: 'gate' }))
    const gated: Step = { ...baseStep, gate: ['cmd:pnpm build'] }
    const r = await runStep(gated, { exec: okExec, git, check, cwd: '.' })
    expect(r.tagged).toBe(false)
    expect(git).not.toHaveBeenCalledWith('tag step-01-propose')
  })
})
