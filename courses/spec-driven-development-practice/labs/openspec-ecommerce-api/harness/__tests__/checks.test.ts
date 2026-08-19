import { describe, it, expect } from 'vitest'
import { runCheck } from '../verify/checks'

describe('runCheck file:', () => {
  it('passes when file exists', async () => {
    const r = await runCheck('file:package.json', process.cwd())
    expect(r.ok).toBe(true)
  })
  it('fails when file missing', async () => {
    const r = await runCheck('file:nope.xyz', process.cwd())
    expect(r.ok).toBe(false)
  })
})

describe('runCheck cmd:', () => {
  it('passes on exit 0', async () => {
    const r = await runCheck('cmd:true', process.cwd())
    expect(r.ok).toBe(true)
  })
  it('fails on nonzero exit', async () => {
    const r = await runCheck('cmd:false', process.cwd())
    expect(r.ok).toBe(false)
  })
})

describe('runCheck unknown', () => {
  it('fails for unknown kind', async () => {
    const r = await runCheck('bogus:thing', process.cwd())
    expect(r.ok).toBe(false)
  })
})
