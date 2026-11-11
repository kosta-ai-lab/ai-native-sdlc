// kosta-ai-lab 포털 사이트 스크립트 공통 모듈 (Apache-2.0). Node 내장 모듈만 사용한다.
// 원본: site/src(화면) + site/data(데이터) → 산출물: site/dist(Pages 배포 대상, 하위 경로·루트 모두 상대 경로로 동작).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const SITE_DIR = path.resolve(SCRIPTS_DIR, '..');
export const REPO_ROOT = path.resolve(SITE_DIR, '..');
export const SRC_DIR = path.join(SITE_DIR, 'src');
export const DATA_DIR = path.join(SITE_DIR, 'data');
export const DEFAULT_OUT = path.join(SITE_DIR, 'dist');
export const BASE_PATH = '/ai-native-sdlc/';
export const REPO_URL = 'https://github.com/kosta-ai-lab/ai-native-sdlc';
export const ORG_URL = 'https://github.com/kosta-ai-lab';
export const MARKER = '.site-build';

// 배포 화면 파일. 스크립트 실행 순서는 index.html이 정한다(motion-core → layers → story).
export const SRC_FILES = ['index.html', 'story.css', 'layers.css', 'motion-core.js', 'layers.js', 'story.js', 'favicon.svg'];
// 데이터는 site/data의 *.json 전체를 그대로 복사한다(파일 추가를 고정 목록으로 막지 않는다).
const DATA_NAME = /^[a-z0-9][a-z0-9_-]*\.json$/;
export function dataFiles(siteDir = SITE_DIR) {
  return fs.readdirSync(path.join(siteDir, 'data')).filter((n) => DATA_NAME.test(n)).sort();
}
/** 배포 산출물 계획(원본 → dist). 이 밖의 파일은 dist에 들어가지 않는다. */
export function copyPlan(siteDir = SITE_DIR) {
  return [
    ...SRC_FILES.map((n) => ({ from: 'src/' + n, to: n })),
    ...dataFiles(siteDir).map((n) => ({ from: 'data/' + n, to: 'data/' + n }))
  ];
}
export const GENERATED = ['.nojekyll', MARKER];
export function distAllowlist(siteDir = SITE_DIR) {
  return [...copyPlan(siteDir).map((c) => c.to), ...GENERATED].sort();
}

export function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** 저장소 경로를 GitHub blob/tree URL로 바꾼다. 경로 조각마다 encodeURIComponent를 적용한다. */
export function repoUrl(repoPath, kind = 'file', ref = 'main') {
  const enc = repoPath.split('/').map((seg) => encodeURIComponent(seg)).join('/');
  return `${REPO_URL}/${kind === 'dir' ? 'tree' : 'blob'}/${ref}/${enc}`;
}

export function gitTrackedFiles(root = REPO_ROOT) {
  const out = execFileSync('git', ['-C', root, 'ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return out.split('\0').filter(Boolean);
}

function isInside(child, parent) {
  const rel = path.relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/** 존재하는 가장 가까운 상위까지 realpath로 풀어 심볼릭 링크 우회를 막는다. */
function realish(p) {
  let cur = path.resolve(p);
  const tail = [];
  while (!fs.existsSync(cur)) {
    const parent = path.dirname(cur);
    if (parent === cur) break;
    tail.unshift(path.basename(cur));
    cur = parent;
  }
  return path.join(fs.realpathSync(cur), ...tail);
}

/**
 * 빌드 출력 위치를 검증한다.
 * - 기본값 site/dist. 저장소 안에서는 site/dist(또는 그 하위)만 허용한다.
 * - 저장소 밖(예: ../review/dist)은 허용하되, 루트·홈·저장소의 상위 폴더는 거부한다.
 * - 이미 있는 폴더가 비어 있지 않으면 이전 빌드 표식(.site-build)이 있을 때만 사용한다.
 */
export function resolveOutDir(arg, { siteDir = SITE_DIR, repoRoot = REPO_ROOT, cwd = process.cwd(), home = os.homedir() } = {}) {
  const requested = arg ? path.resolve(cwd, arg) : path.join(siteDir, 'dist');
  const out = realish(requested);
  const repo = realish(repoRoot);
  const site = realish(siteDir);
  const dist = realish(path.join(siteDir, 'dist'));
  const fail = (why) => { const e = new Error(`출력 위치 거부: ${requested} — ${why}`); e.code = 'EOUTDIR'; throw e; };

  if (out === path.parse(out).root) fail('파일시스템 루트');
  if (home && out === realish(home)) fail('홈 폴더');
  if (isInside(repo, out)) fail('저장소 자체 또는 저장소의 상위 폴더');
  if (isInside(out, repo) && !isInside(out, dist)) fail('저장소 안에서는 site/dist만 허용');
  if (out === site) fail('site 폴더 자체');

  if (fs.existsSync(requested)) {
    const st = fs.lstatSync(requested);
    if (st.isSymbolicLink()) fail('심볼릭 링크');
    if (!st.isDirectory()) fail('폴더가 아님');
    const entries = fs.readdirSync(requested);
    if (entries.length && !entries.includes(MARKER)) fail(`비어 있지 않고 ${MARKER} 표식이 없음 — 다른 파일을 지우지 않기 위해 중단`);
  }
  return requested;
}

// 이전 빌드가 만들었다고 인정할 수 있는 파일 이름 형식(사이트 정적 파일과 빌드 표식만).
const BUILT_NAME = /^(?:data\/)?[A-Za-z0-9_-][A-Za-z0-9_.-]*\.(?:html|css|js|json|svg)$|^\.(?:nojekyll|site-build)$/;

/** 이전 빌드 표식에 적힌 파일 가운데 안전한 이름 형식인 것만 돌려준다. */
export function previousBuildFiles(outDir) {
  const markerFile = path.join(outDir, MARKER);
  if (!fs.existsSync(markerFile)) return [];
  let listed = [];
  try { listed = JSON.parse(fs.readFileSync(markerFile, 'utf8')).files || []; } catch { listed = []; }
  return listed.filter((rel) => typeof rel === 'string' && BUILT_NAME.test(rel) && isInside(path.join(outDir, rel), outDir));
}

/** 이전 빌드가 기록한 파일만 지운다. 표식에 없는 파일은 건드리지 않는다. 재귀 삭제는 하지 않는다. */
export function cleanPreviousBuild(outDir) {
  const removed = [];
  for (const rel of previousBuildFiles(outDir)) {
    const target = path.join(outDir, rel);
    if (fs.existsSync(target) && fs.lstatSync(target).isFile()) { fs.unlinkSync(target); removed.push(rel); }
  }
  const dataDir = path.join(outDir, 'data');
  if (fs.existsSync(dataDir) && fs.readdirSync(dataDir).length === 0) fs.rmdirSync(dataDir);
  return removed;
}

export function build(outArg, opts = {}) {
  const outDir = resolveOutDir(outArg, opts);
  const siteDir = opts.siteDir || SITE_DIR;
  fs.mkdirSync(outDir, { recursive: true });
  // 아무것도 지우기 전에, 빌드가 만들지 않은 파일이 있는지 먼저 확인한다.
  const plan = copyPlan(siteDir);
  const allow = distAllowlist(siteDir);
  const known = new Set([...allow, ...previousBuildFiles(outDir)]);
  const foreign = listFiles(outDir).filter((f) => !known.has(f));
  if (foreign.length) {
    const e = new Error(`출력 폴더에 빌드가 만들지 않은 파일이 있음: ${foreign.join(', ')} — 아무것도 지우지 않고 중단합니다`);
    e.code = 'EOUTDIR';
    throw e;
  }
  cleanPreviousBuild(outDir);
  for (const { from, to } of plan) {
    const src = path.join(siteDir, from);
    const dest = path.join(outDir, to);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  const files = allow.slice();
  fs.writeFileSync(path.join(outDir, MARKER), JSON.stringify({ tool: 'kosta-ai-lab portal build', files }, null, 2) + '\n');
  return { outDir, files };
}

/** dist 안의 모든 파일(상대 경로)을 나열한다. */
export function listFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else out.push(path.relative(dir, full).split(path.sep).join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

/** HTML의 link/script/img 자산 참조를 뽑는다. */
export function assetRefs(html) {
  const refs = [];
  const re = /<(link|script|img|source)\b[^>]*?\b(href|src)\s*=\s*"([^"]*)"/gi;
  let m;
  while ((m = re.exec(html))) refs.push({ tag: m[1].toLowerCase(), attr: m[2], value: m[3] });
  return refs;
}

export function anchorRefs(html) {
  const refs = [];
  const re = /<a\b[^>]*?\bhref\s*=\s*"([^"]*)"/gi;
  let m;
  while ((m = re.exec(html))) refs.push(m[1]);
  return refs;
}

export function isMain(metaUrl) {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(fileURLToPath(metaUrl)) === fs.realpathSync(path.resolve(process.argv[1]));
  } catch {
    return false;
  }
}
