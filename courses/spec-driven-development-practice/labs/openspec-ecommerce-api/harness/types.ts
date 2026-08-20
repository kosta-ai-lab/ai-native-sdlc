import { z } from 'zod'
import { parse } from 'yaml'

/** claude -p 실행 등 프롬프트 기반 작업을 추상화 (실제 실행 vs Mock 주입). */
export interface Executor {
  runPrompt(prompt: string, cwd: string): Promise<{ ok: boolean; log: string }>
}

const MoveSchema = z.object({
  id: z.string(),
  /** claude -p로 실행할 프롬프트 (openspec instructions 결과 등). */
  prompt: z.string().optional(),
  /** 셸로 실행할 명령 (openspec init 등). */
  run: z.string().optional(),
  /** 이 무브 완료 시 남길 커밋 메시지 (Conventional Commits). */
  commit: z.string(),
  /** 무브 검증 스펙 목록 (file:/cmd:/smoke:/openspec-validate). */
  verify: z.array(z.string()).optional(),
})

const StepSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** 단계 검증 통과 시 찍을 git tag (예: step-01-propose). */
  tag: z.string(),
  /** 단계 게이트 검증 스펙. 모두 통과해야 태그. */
  gate: z.array(z.string()).default([]),
  moves: z.array(MoveSchema),
})

export type Move = z.infer<typeof MoveSchema>
export type Step = z.infer<typeof StepSchema>

/** steps.yaml 텍스트를 파싱·검증한다. 스키마 위반 시 throw. */
export function parseSteps(yamlText: string): Step[] {
  return z.array(StepSchema).parse(parse(yamlText))
}
