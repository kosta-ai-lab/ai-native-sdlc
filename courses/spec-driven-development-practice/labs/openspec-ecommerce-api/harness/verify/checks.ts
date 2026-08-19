import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

/**
 * 검증 프리미티브. spec 형식:
 *  - file:<path>         파일/폴더 존재
 *  - cmd:<shell>         셸 명령 exit 0
 *  - openspec-validate   openspec validate --strict
 *  - smoke:<route>       로컬 서버 GET 2xx
 */
export async function runCheck(spec: string, cwd: string): Promise<{ ok: boolean; detail: string }> {
  const idx = spec.indexOf(':')
  const kind = idx === -1 ? spec : spec.slice(0, idx)
  const arg = idx === -1 ? '' : spec.slice(idx + 1)
  try {
    if (kind === 'file') return { ok: existsSync(join(cwd, arg)), detail: arg }
    if (kind === 'cmd') { execSync(arg, { cwd, stdio: 'pipe' }); return { ok: true, detail: arg } }
    if (kind === 'openspec-validate') { execSync('openspec validate --strict', { cwd, stdio: 'pipe' }); return { ok: true, detail: 'validate' } }
    if (kind === 'smoke') {
      const code = execSync(`curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000${arg}`, { cwd }).toString().trim()
      return { ok: code.startsWith('2'), detail: `GET ${arg} -> ${code}` }
    }
    return { ok: false, detail: `unknown check: ${spec}` }
  } catch (e: any) {
    return { ok: false, detail: `${spec}: ${String(e?.message ?? e).slice(0, 200)}` }
  }
}
