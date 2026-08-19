import type { Step, Executor } from './types'
import type { runCheck } from './verify/checks'

export interface RunnerDeps {
  exec: Executor
  /** git 서브커맨드 실행. '!' 접두면 셸 명령으로 실행(무브의 run). */
  git: (cmd: string) => void
  check: typeof runCheck
  cwd: string
}

/**
 * 한 단계를 사람 개발 흐름으로 실행한다.
 * 각 무브: (프롬프트|셸) → 무브 검증 → 작은 커밋.
 * 모든 무브 성공 + 단계 게이트 통과 시에만 태그를 찍는다.
 */
export async function runStep(step: Step, deps: RunnerDeps): Promise<{ ok: boolean; tagged: boolean }> {
  for (const move of step.moves) {
    if (move.prompt) {
      const r = await deps.exec.runPrompt(move.prompt, deps.cwd)
      if (!r.ok) return { ok: false, tagged: false }
    }
    if (move.run) {
      try { deps.git(`!${move.run}`) } catch { return { ok: false, tagged: false } }
    }
    for (const v of move.verify ?? []) {
      const c = await deps.check(v, deps.cwd)
      if (!c.ok) return { ok: false, tagged: false }
    }
    deps.git('add -A')
    deps.git(`commit -m "${move.commit}"`)
  }
  for (const g of step.gate) {
    const c = await deps.check(g, deps.cwd)
    if (!c.ok) return { ok: false, tagged: false }
  }
  deps.git(`tag ${step.tag}`)
  return { ok: true, tagged: true }
}
