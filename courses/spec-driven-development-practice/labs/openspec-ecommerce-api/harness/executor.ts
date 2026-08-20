import { execSync } from 'node:child_process'
import type { Executor } from './types'

/**
 * 실제 claude -p 실행기. 프롬프트를 헤드리스 print 모드로 돌린다.
 * acceptEdits로 파일 편집을 허용(사람 개입 없이 개발 무브 진행).
 */
export const claudeExecutor: Executor = {
  async runPrompt(prompt, cwd) {
    try {
      const log = execSync(
        `claude -p ${JSON.stringify(prompt)} --permission-mode acceptEdits`,
        { cwd, stdio: 'pipe', timeout: 600_000, maxBuffer: 64 * 1024 * 1024 },
      ).toString()
      return { ok: true, log }
    } catch (e: any) {
      return { ok: false, log: String(e?.message ?? e) }
    }
  },
}
