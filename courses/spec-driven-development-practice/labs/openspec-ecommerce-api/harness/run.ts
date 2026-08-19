import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { parseSteps } from './types'
import { runStep } from './runner'
import { runCheck } from './verify/checks'
import { claudeExecutor } from './executor'

const cwd = process.cwd()

const git = (cmd: string) => {
  if (cmd.startsWith('!')) execSync(cmd.slice(1), { cwd, stdio: 'inherit' })
  else execSync(`git ${cmd}`, { cwd, stdio: 'inherit' })
}

const arg = (flag: string, fallback: string) =>
  process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1] : fallback

const steps = parseSteps(readFileSync('harness/steps.yaml', 'utf8'))
const from = arg('--from', steps[0].id)
const to = arg('--to', steps[steps.length - 1].id)

for (const s of steps) {
  if (s.id < from || s.id > to) continue
  console.log(`\n▶ ${s.id} — ${s.name}`)
  const r = await runStep(s, { exec: claudeExecutor, git, check: runCheck, cwd })
  if (!r.ok) {
    console.error(`✗ stopped at ${s.id} (gate or move failed)`)
    process.exit(1)
  }
  console.log(`✓ ${s.id} tagged ${s.tag}`)
}
console.log('\n✔ harness run complete')
