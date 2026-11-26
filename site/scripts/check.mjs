#!/usr/bin/env node
// kosta-ai-lab 학습 로드맵 정적 검사 (Apache-2.0).
// 사용: node scripts/check.mjs [--dist [폴더]]
//  - 로드맵 데이터(data/roadmap.json)의 구조와 참조를 확인하고, 연결한 경로를 git ls-files와 대조한다.
//  - 상태의 근거를 원문에서 확인한다. 준비 중으로 표시한 모듈은 README에 "(작성 예정)"이 있어야 하고, 공개 자료는 없어야 한다.
//  - 단원 한눈에 보기 내용(data/unit-*.json)의 형식을 확인하고, 프롬프트·명령·출력이 가이드 문서와 같은지 대조한다(scripts/unit-check.mjs).
//  - 화면 원본(src)의 메타데이터, meta CSP, 상대 경로, 안전하지 않은 DOM API, 외부 자원, 글꼴 파일을 확인한다.
//  - Pages 워크플로의 권한과 배포 조건을 확인한다.
//  - --dist: 빌드 산출물이 허용 목록과 같고, 원본과 바이트가 같으며, /ai-native-sdlc/ 와 / 양쪽에서 해석되는지 확인한다.
//    빌드가 만든 자료 날짜(data/dates.json)는 형식과, 지금 저장소 이력에서 다시 읽은 값과 같은지를 확인한다.
import fs from 'node:fs';
import path from 'node:path';
import {
  REPO_ROOT, SITE_DIR, DEFAULT_OUT, BASE_PATH, MARKER, DATES_FILE, REPO_URL, ORG_URL, SRC_FILES,
  readJSON, gitTrackedFiles, assetRefs, anchorRefs, listFiles, distAllowlist, fontFiles, collectDates, watchedPaths, isMain
} from './lib.mjs';
import { unitFiles, unitProblems, unitStrings, UNIT_FILE } from './unit-check.mjs';
import '../src/core.js';

const R = globalThis.KostaRoadmap;

// meta CSP 정책(GitHub Pages는 HTTP 헤더를 정할 수 없다). 스크립트·스타일·글꼴·데이터 모두 같은 출처 파일만 쓴다.
export const REQUIRED_CSP = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'none'"]
};
// meta로 전달하면 브라우저가 무시하고 콘솔에 경고하는 지시어
const META_IGNORED_CSP = ['frame-ancestors', 'report-uri', 'report-to', 'sandbox'];
// 배포 주소: GitHub Pages 프로젝트 하위 경로와, 사용자 도메인을 붙였을 때의 루트
export const SERVE_BASES = [BASE_PATH, '/'];
// GitHub Docs "Using custom workflows with GitHub Pages" 예시 major (2026-11-11 확인)
const ACTION_MAJORS = { 'actions/checkout': 'v6', 'actions/configure-pages': 'v5', 'actions/upload-pages-artifact': 'v4', 'actions/deploy-pages': 'v4' };

export const COLUMNS = 11;
const SHAPES = ['circle', 'square', 'diamond'];
const KINDS = ['course', 'guide', 'sample', 'rule', 'soon'];
const REQUIRED_IDS = ['top', 'net', 'route', 'tabs', 'prog', 'route-head', 'rail', 'sign', 'people', 'people-grid', 'guide', 'about', 'scrim'];
const SCRIPT_ORDER = /<script src="core\.js" defer><\/script>\s*<script src="app\.js" defer><\/script>/;
// 단원 한눈에 보기 화면(unit.html)
const UNIT_IDS = ['top', 'title', 'lead', 'where', 'doc', 'lap', 'key', 'play', 'track', 'step', 'kinds', 'sections', 'env'];
const UNIT_SCRIPT_ORDER = /<script src="core\.js" defer><\/script>\s*<script src="unit\.js" defer><\/script>/;
// 단원 내용에는 실습의 로컬 주소가 나올 수 있어, 개인·내부 주소 가운데 이 둘은 보지 않는다
const LOCAL_OK = [/127\.0\.0\.1/, /localhost/];
// 터미널 출력에 나오는 기호. 원본 글꼴에 없어 시스템 글꼴로 보인다
const SYSTEM_GLYPHS = '❯✓';
// 공개 화면에 내보내지 않는 제작 단계 용어, 개인·내부 주소, 근거 없이 약속하는 표현
const INTERNAL_TERMS = [/시안/, /검수/, /초안/, /내부\s*메모/, /TODO/, /미확정/, /preview/i];
const PRIVATE_MARKERS = [/\/Users\//, /\/home\/[a-z]/, /\.hermes/, /ts\.net/, /tail[0-9a-f]{5,}/, /127\.0\.0\.1/, /localhost/, /\bstudio:\d/];
const PROMISES = /무료|비용\s*없이|보장|누구나|반드시|완벽|100\s*%/;
// 화면 스크립트에서 쓰지 않는 API: 문자열을 HTML로 넣는 API와, 방문자를 추적하거나 밖으로 보내는 API
const UNSAFE_DOM = [/\binnerHTML\b/, /\bouterHTML\b/, /insertAdjacentHTML/, /document\.write/, /\beval\(/, /new Function/, /setTimeout\(\s*['"]/, /setAttribute\(\s*['"]on/i, /setAttribute\(\s*['"]style['"]/];
const TRACKING = [/sessionStorage/, /indexedDB/, /document\.cookie/, /navigator\.sendBeacon/, /XMLHttpRequest/, /WebSocket/, /gtag\(|google-analytics|googletagmanager/];
const PENDING = '(작성 예정)';

export function parseCsp(text) {
  const out = {};
  for (const part of text.split(';')) {
    const [dir, ...vals] = part.trim().split(/\s+/);
    if (dir) out[dir.toLowerCase()] = vals;
  }
  return out;
}
/** 상대 경로인지: 스킴·프로토콜 상대·루트 절대·상위 폴더 금지 */
export function isRelativeRef(v) {
  return !!v && !/^[a-z][a-z0-9+.-]*:/i.test(v) && !v.startsWith('/') && !v.startsWith('\\') && !v.split(/[?#]/)[0].split('/').includes('..');
}
function allowedExternal(url) {
  return url === ORG_URL || url === REPO_URL || url.startsWith(REPO_URL + '/');
}
const isText = (v) => typeof v === 'string' && v.trim() !== '';
const isList = (v) => Array.isArray(v) && v.length > 0;

/** 데이터에서 화면에 나오는 글만 모은다(경로·id 제외). */
export function visibleStrings(data) {
  const out = [];
  const push = (...xs) => { for (const x of xs.flat()) if (typeof x === 'string') out.push(x); };
  push(Object.values(data.kinds || {}), Object.values(data.names || {}));
  for (const l of data.lines || []) {
    push(l.name, l.who, l.lead, l.next && l.next.text);
    for (const s of l.stages || []) push(s.title, s.short, s.summary, s.note);
  }
  for (const i of data.items || []) push(i.title, i.original, i.by, i.meta, i.summary, i.audience, i.prerequisite, i.learn, i.how, (i.links || []).map((k) => k.label));
  for (const p of data.people || []) { push(p.name); for (const g of p.groups || []) push(g.label); }
  return out;
}

/**
 * 문제 목록을 모은다. overrides로 데이터·화면 원본을 바꿔 넣을 수 있다(시험에서 변조 검출 확인용).
 * overrides: { data, html, css: {이름: 내용}, js: {이름: 내용}, workflow }
 */
export function collectProblems({ dist = null, repoRoot = REPO_ROOT, siteDir = SITE_DIR, overrides = {} } = {}) {
  const problems = [];
  const notes = [];
  const bad = (msg) => problems.push(msg);
  const srcDir = path.join(siteDir, 'src');
  const dataDir = path.join(siteDir, 'data');

  const tracked = gitTrackedFiles(repoRoot);
  const trackedSet = new Set(tracked);
  const isTrackedDir = (p) => tracked.some((f) => f.startsWith(p + '/'));
  const readRepo = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
  const readSrc = (n) => fs.readFileSync(path.join(srcDir, n), 'utf8');

  const data = overrides.data || readJSON(path.join(dataDir, 'roadmap.json'));
  const html = overrides.html != null ? overrides.html : readSrc('index.html');
  const unitHtml = overrides.unitHtml != null ? overrides.unitHtml : readSrc('unit.html');
  const css = { 'app.css': readSrc('app.css'), 'unit.css': readSrc('unit.css'), 'fonts.css': readSrc('fonts.css'), ...(overrides.css || {}) };
  const js = { 'core.js': readSrc('core.js'), 'app.js': readSrc('app.js'), 'unit.js': readSrc('unit.js'), ...(overrides.js || {}) };
  // 단원 한눈에 보기 내용: data/unit-<id>.json. overrides.units로 바꿔 넣을 수 있다({ id: 내용 }).
  const units = overrides.units
    ? Object.entries(overrides.units).map(([id, u]) => ({ id, name: 'unit-' + id + '.json', data: u }))
    : unitFiles(siteDir).map((name) => { let u = null; try { u = readJSON(path.join(dataDir, name)); } catch { u = null; } return { id: UNIT_FILE.exec(name)[1], name, data: u }; });

  // 1) 데이터 구조
  if (fs.existsSync(path.join(siteDir, DATES_FILE))) bad(`site/${DATES_FILE}은 두지 않음(자료 날짜는 빌드가 git 이력에서 만든다)`);
  if (data.schema !== 1) bad('roadmap.json: schema는 1');
  if (data.repository !== REPO_URL.replace('https://github.com/', '')) bad('roadmap.json: repository는 ' + REPO_URL.replace('https://github.com/', ''));
  if (data.ref !== 'main') bad('roadmap.json: ref는 main');
  for (const k of KINDS) if (!isText(data.kinds && data.kinds[k])) bad(`roadmap.json: kinds.${k} 이름 없음`);
  // 화면 표기(names): 원문의 이름을 화면에서 어떻게 보일지 정한 표. 값은 그 이름으로 시작하고, 쓰이지 않는 이름은 두지 않는다.
  if (data.names != null) {
    if (typeof data.names !== 'object' || Array.isArray(data.names)) bad('roadmap.json: names는 이름과 화면 표기의 표');
    else {
      const written = [...(data.items || []).map((i) => i.by), ...(data.people || []).map((p) => p.name)].flatMap((s) => String(s).split(/\s*,\s*/));
      for (const [name, shown] of Object.entries(data.names)) {
        if (!isText(name) || !isText(shown) || !shown.startsWith(name)) bad(`roadmap.json: names의 화면 표기는 그 이름으로 시작해야 함 — ${name}: ${shown}`);
        else if (!written.some((w) => w === name || w.startsWith(name + ' '))) bad(`roadmap.json: names에 쓰이지 않는 이름 — ${name}`);
      }
    }
  }
  if (!isList(data.lines) || !isList(data.items) || !isList(data.people)) {
    bad('roadmap.json: lines, items, people이 비어 있음');
    return { problems, notes };
  }
  const items = new Map();
  for (const it of data.items) {
    if (!isText(it.id) || !/^[a-z][a-z0-9]*$/.test(it.id)) { bad(`자료 id 형식: ${it.id}`); continue; }
    if (items.has(it.id)) bad(`자료 id 중복: ${it.id}`);
    items.set(it.id, it);
    if (!KINDS.includes(it.kind)) { bad(`자료 ${it.id}: 알 수 없는 kind ${it.kind}`); continue; }
    if (!isText(it.title) || !isText(it.by)) bad(`자료 ${it.id}: title, by 필요`);
    if (it.kind === 'soon') {
      if (!isText(it.path)) bad(`자료 ${it.id}: 준비 중 자료는 path(모듈 폴더) 필요`);
      continue;
    }
    for (const f of ['source', 'meta', 'summary']) if (!isText(it[f])) bad(`자료 ${it.id}: ${f} 필요`);
    if (!isList(it.how) || !it.how.every(isText)) bad(`자료 ${it.id}: how(이용 순서) 필요`);
    if (it.learn && !(isList(it.learn) && it.learn.every(isText))) bad(`자료 ${it.id}: learn은 글 목록`);
    if (!isList(it.links)) bad(`자료 ${it.id}: links 필요`);
    for (const k of it.links || []) {
      if (!isText(k.label) || !isText(k.path)) bad(`자료 ${it.id}: 링크에 label, path 필요`);
      if (!['file', 'dir'].includes(k.kind)) bad(`자료 ${it.id}: 링크 kind는 file 또는 dir — ${k.path}`);
    }
  }

  // 2) 로드맵 배치와 참조
  const lineIds = new Set();
  const placed = new Set();
  for (const l of data.lines) {
    if (!isText(l.id) || !/^[a-z]+$/.test(l.id)) { bad(`로드맵 id 형식: ${l.id}`); continue; }
    if (lineIds.has(l.id)) bad(`로드맵 id 중복: ${l.id}`);
    lineIds.add(l.id);
    for (const f of ['name', 'who', 'lead']) if (!isText(l[f])) bad(`로드맵 ${l.id}: ${f} 필요`);
    if (!SHAPES.includes(l.shape)) bad(`로드맵 ${l.id}: shape는 ${SHAPES.join('/')}`);
    if (!isList(l.stages)) { bad(`로드맵 ${l.id}: 단계 없음`); continue; }
    if (!Number.isInteger(l.col) || l.col < 1 || l.col + l.stages.length - 1 > COLUMNS) bad(`로드맵 ${l.id}: 노선도 ${COLUMNS}칸을 넘음(col ${l.col}, 단계 ${l.stages.length})`);
    l.stages.forEach((s, i) => {
      if (!isText(s.title) || !isText(s.summary)) bad(`로드맵 ${l.id} ${i + 1}단계: title, summary 필요`);
      if (!isList(s.items)) { bad(`로드맵 ${l.id} ${i + 1}단계: 자료가 하나도 없음(준비 중이면 준비 중 자료를 둔다)`); return; }
      for (const id of s.items) {
        if (!items.has(id)) bad(`로드맵 ${l.id} ${i + 1}단계: 없는 자료 ${id}`);
        placed.add(id);
      }
    });
  }
  if (new Set(data.lines.map((l) => l.shape)).size !== data.lines.length) bad('로드맵마다 도형이 달라야 함');
  for (const l of data.lines) {
    if (l.next && (!lineIds.has(l.next.line) || l.next.line === l.id || !isText(l.next.text))) bad(`로드맵 ${l.id}: next는 다른 로드맵과 안내 글`);
  }
  for (const id of items.keys()) if (!placed.has(id)) bad(`어느 단계에도 놓이지 않은 자료: ${id}`);
  // 노선도의 환승 표시는 첫 로드맵 2단계와 둘째 로드맵 1단계가 같은 칸, 같은 자료일 때만 맞다(app.js·app.css의 .net__x)
  if (data.lines.length >= 2 && isList(data.lines[0].stages) && isList(data.lines[1].stages)) {
    const [a, b] = data.lines;
    const shared = a.stages[1] && b.stages[0] && (a.stages[1].items || []).some((id) => (b.stages[0].items || []).includes(id));
    if (a.col + 1 !== b.col || !shared) bad('노선도 환승 표시: 첫 로드맵 2단계와 둘째 로드맵 1단계가 같은 칸에서 같은 자료를 가리켜야 함');
  }

  // 3) 강사별 자료: 공개 자료는 만든 사람 아래에 한 번씩 나온다
  const listed = new Map();
  for (const p of data.people) {
    if (!isText(p.name) || !isList(p.groups)) { bad(`강사 항목: name, groups 필요 — ${p.name}`); continue; }
    for (const g of p.groups) {
      if (!isText(g.label) || !isList(g.items)) { bad(`강사 ${p.name}: 묶음에 label, items 필요`); continue; }
      for (const id of g.items) {
        const it = items.get(id);
        if (!it) { bad(`강사 ${p.name}: 없는 자료 ${id}`); continue; }
        if (!R.isOpen(it)) bad(`강사 ${p.name}: 준비 중 자료 ${id}는 넣지 않음`);
        if (it.by !== p.name) bad(`강사 ${p.name}: 자료 ${id}의 만든 사람은 ${it.by}`);
        if (listed.has(id)) bad(`강사별 자료에 두 번 나옴: ${id}`);
        listed.set(id, p.name);
      }
    }
  }
  for (const it of items.values()) if (R.isOpen(it) && !listed.has(it.id)) bad(`강사별 자료에 빠진 공개 자료: ${it.id}`);

  // 4) 원본 대조: 경로는 git이 추적하는 파일·폴더, 상태와 만든 사람은 원문에 근거가 있어야 한다
  const coursesIndex = trackedSet.has('courses/README.md') ? readRepo('courses/README.md') : '';
  const h1 = (text) => ((/^# (.+)$/m.exec(text) || [])[1] || '').trim();
  for (const it of items.values()) {
    if (it.kind === 'soon') {
      const readme = it.path + '/README.md';
      if (!isText(it.path)) continue;
      if (!trackedSet.has(readme)) { bad(`자료 ${it.id}: 모듈 README 없음 — ${readme}`); continue; }
      const text = readRepo(readme);
      if (!text.includes(PENDING)) bad(`자료 ${it.id}: ${readme}에 본문이 올라왔다. 준비 중에서 공개 자료로 바꾼다`);
      const owner = (/담당:\s*([^\n)]+)/.exec(text) || [])[1] || '';
      const names = it.by === '협의 중' ? ['협의'] : String(it.by).split(/\s*[,·]\s*/);
      for (const n of names) if (!owner.includes(n)) bad(`자료 ${it.id}: 담당 '${it.by}'가 원문('${owner.trim()}')과 다름`);
      continue;
    }
    if (!KINDS.includes(it.kind) || !isText(it.source)) continue;
    if (!trackedSet.has(it.source)) { bad(`자료 ${it.id}: 안내 문서 없음 — ${it.source}`); continue; }
    const text = readRepo(it.source);
    if (text.includes(PENDING)) bad(`자료 ${it.id}: ${it.source}가 아직 "${PENDING}"이다. 공개 자료로 표시하지 않는다`);
    if (it.byEvidence !== 'git-history' && !text.includes(it.by) && !coursesIndex.includes(it.by)) bad(`자료 ${it.id}: 만든 사람 '${it.by}'의 근거가 ${it.source}나 courses/README.md에 없음`);
    if (it.byEvidence && it.byEvidence !== 'git-history') bad(`자료 ${it.id}: byEvidence는 git-history만`);
    if (it.kind === 'course' && h1(text) !== (it.original || it.title)) bad(`강의 ${it.id}: 제목(또는 원제)이 ${it.source}의 제목 '${h1(text)}'과 다름`);
    for (const k of it.links || []) {
      if (!isText(k.path)) continue;
      if (k.kind === 'file' && !trackedSet.has(k.path)) bad(`자료 ${it.id}: git이 추적하지 않는 파일 — ${k.path}`);
      if (k.kind === 'dir' && !isTrackedDir(k.path)) bad(`자료 ${it.id}: git이 추적하지 않는 폴더 — ${k.path}`);
    }
  }

  // 5) 화면에 나오는 글: 제작 단계 용어, 근거 없는 약속, 개인·내부 주소
  const shown = visibleStrings(data);
  const htmlText = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ');
  for (const re of INTERNAL_TERMS) {
    if (re.test(htmlText)) bad(`index.html: 제작 단계 용어 ${re}`);
    for (const s of shown) if (re.test(s)) bad(`roadmap.json: 제작 단계 용어 ${re} — ${s}`);
  }
  for (const s of [...shown, htmlText]) if (PROMISES.test(s)) bad(`근거 없이 약속하는 표현 — ${s.trim().slice(0, 60)}`);
  const unitText = unitHtml.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ');
  for (const re of INTERNAL_TERMS) if (re.test(unitText)) bad(`unit.html: 제작 단계 용어 ${re}`);
  if (PROMISES.test(unitText)) bad('unit.html: 근거 없이 약속하는 표현');
  const allSrc = { 'index.html': html, 'unit.html': unitHtml, 'roadmap.json': JSON.stringify(data), ...css, ...js };
  for (const [name, text] of Object.entries(allSrc)) for (const re of PRIVATE_MARKERS) if (re.test(text)) bad(`${name}: 개인·내부 주소 ${re}`);

  // 5-1) 단원 한눈에 보기 내용: 형식, 가이드 대조, 로드맵 자료와의 짝
  const unitShown = [];
  const unitIds = new Set(units.map((x) => x.id));
  for (const x of units) {
    const u = x.data;
    if (!u) { bad(`${x.name}: JSON으로 읽을 수 없음`); continue; }
    const guide = isText(u.guide) && trackedSet.has(u.guide) ? readRepo(u.guide) : null;
    for (const p of unitProblems(u, { name: x.name, guide })) bad(p);
    const it = items.get(u.item);
    if (!it || !R.isOpen(it)) bad(`${x.name}: item이 공개 자료가 아님 — ${u.item}`);
    else {
      if (it.visual !== x.id) bad(`${x.name}: 로드맵 자료 ${it.id}의 visual이 이 단원(${x.id})을 가리켜야 함`);
      if (!(it.links || []).some((k) => k.kind === 'file' && k.path === u.guide)) bad(`${x.name}: guide는 자료 ${it.id}의 링크에 있는 문서여야 함 — ${u.guide}`);
    }
    const text = JSON.stringify(u);
    for (const re of PRIVATE_MARKERS) if (!LOCAL_OK.some((ok) => String(ok) === String(re)) && re.test(text)) bad(`${x.name}: 개인·내부 주소 ${re}`);
    unitShown.push(...unitStrings(u));
  }
  for (const it of items.values()) {
    if (it.visual === undefined) continue;
    if (!isText(it.visual) || !unitIds.has(it.visual)) bad(`자료 ${it.id}: visual이 가리키는 단원 내용이 없음 — data/unit-${it.visual}.json`);
  }

  // 6) 메타데이터, meta CSP, 자산 경로 (화면마다 같은 규칙)
  const srcPath = (v) => { const p = v.split(/[?#]/)[0]; return p.startsWith('data/') ? path.join(siteDir, p) : path.join(srcDir, p); };
  const checkPage = (name, html, { ids, order, orderHint }) => {
    const head = (/<head>([\s\S]*?)<\/head>/.exec(html) || [])[1] || '';
    if (!/^<!doctype html>\s*<html lang="ko"[ >]/i.test(html)) bad(name + ': <html lang="ko"> 필요');
    const title = (/<title>([^<]*)<\/title>/.exec(head) || [])[1];
    const metaContent = (attr, name) => (new RegExp(`<meta\\s+${attr}="${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+content="([^"]*)"`, 'i').exec(head) || [])[1];
    const desc = metaContent('name', 'description');
    if (!isText(title) || !isText(desc)) bad(name + ': title과 description 필요');
    if (metaContent('property', 'og:title') !== title) bad(name + ': og:title은 title과 같아야 함');
    if (metaContent('property', 'og:description') !== desc) bad(name + ': og:description은 description과 같아야 함');
    if (!/<link rel="icon" href="favicon\.svg" type="image\/svg\+xml">/.test(head)) bad(name + ': favicon.svg 링크 필요');
    // 도메인이 정해지지 않았으므로 절대 주소 메타(canonical·og:url·og:image)와 검색 차단(noindex)을 두지 않는다.
    if (/rel="canonical"|property="og:url"|property="og:image"|name="twitter:image"/i.test(head)) bad(name + ': canonical/og:url/og:image는 두지 않음(도메인 미정)');
    if (/noindex/i.test(head)) bad(name + ': noindex가 남아 있음');
    const cspTags = [...head.matchAll(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)">/gi)];
    if (cspTags.length !== 1) bad(`${name}: meta CSP는 정확히 1개 (현재 ${cspTags.length})`);
    else {
      const at = head.indexOf(cspTags[0][0]);
      const firstRes = head.search(/<(link|script|style)\b/i);
      if (firstRes >= 0 && firstRes < at) bad(name + ': meta CSP가 link/script보다 먼저 와야 함');
      const csp = parseCsp(cspTags[0][1]);
      for (const [dir, want] of Object.entries(REQUIRED_CSP)) {
        const have = (csp[dir] || []).slice().sort().join(' ');
        if (have !== want.slice().sort().join(' ')) bad(`CSP: ${dir}는 '${want.join(' ')}' 이어야 함 (현재 '${(csp[dir] || []).join(' ')}')`);
      }
      for (const dir of META_IGNORED_CSP) if (dir in csp) bad(`CSP: ${dir}는 meta에서 무시된다`);
      for (const dir of Object.keys(csp)) if (!(dir in REQUIRED_CSP)) bad(`CSP: 검토하지 않은 지시어 ${dir}`);
    }
    const bare = html.replace(/<!--[\s\S]*?-->/g, '');
    if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(bare)) bad(name + ': inline script 금지(CSP script-src self)');
    if (/<style\b/i.test(bare) || /\sstyle\s*=/i.test(bare)) bad(name + ': inline style 금지(CSP style-src self)');
    if (/\son[a-z]+\s*=/i.test(bare) || /javascript:/i.test(bare)) bad(name + ': 이벤트 속성·javascript: 금지');
    if (/<iframe|<object|<embed|<base\b|<form\b/i.test(bare)) bad(name + ': iframe/object/embed/base/form 금지');
    if (!order.test(head)) bad(name + ': 스크립트는 ' + orderHint + ' 순서의 defer 상대 경로');
    if (!/<noscript>/.test(html)) bad(name + ': JavaScript를 끈 방문자를 위한 안내(noscript) 필요');
    for (const id of ids) if (!html.includes(`id="${id}"`)) bad(`${name}: 스크립트가 쓰는 id="${id}" 없음`);
    for (const r of assetRefs(html)) {
      if (!isRelativeRef(r.value)) bad(`${name}: 상대 경로가 아닌 자산 참조 — ${r.value}`);
      else if (!fs.existsSync(srcPath(r.value))) bad(`${name}: 없는 자산 ${r.value}`);
    }
    for (const href of anchorRefs(html)) {
      if (href.startsWith('#')) {
        if (href.length > 1 && !html.includes(`id="${href.slice(1)}"`)) bad(`${name}: 없는 구역 ${href}`);
      } else if (href.startsWith('https://')) {
        if (!allowedExternal(href)) bad(`${name}: 허용하지 않은 외부 링크 — ${href}`);
        const m = /\/(?:blob|tree)\/main\/(.+)$/.exec(href);
        if (m) {
          const p = decodeURIComponent(m[1]);
          if (!trackedSet.has(p) && !isTrackedDir(p)) bad(`${name}: git이 추적하지 않는 경로 — ${p}`);
        }
      } else if (!isRelativeRef(href)) bad(`${name}: 허용하지 않는 링크 — ${href}`);
      else if (!fs.existsSync(srcPath(href))) bad(`${name}: 없는 내부 링크 ${href}`);
    }
  };
  checkPage('index.html', html, { ids: REQUIRED_IDS, order: SCRIPT_ORDER, orderHint: 'core.js → app.js' });
  checkPage('unit.html', unitHtml, { ids: UNIT_IDS, order: UNIT_SCRIPT_ORDER, orderHint: 'core.js → unit.js' });
  const allCss = Object.values(css).join('\n');
  const allJs = Object.values(js).join('\n');
  if (/@import|url\(\s*['"]?(https?:)?\/\//i.test(allCss)) bad('CSS: 외부 import/url 금지');
  if (/fonts\.googleapis|fonts\.gstatic|cdn\.|unpkg|jsdelivr/i.test(html + unitHtml + allCss + allJs)) bad('외부 글꼴·CDN 참조 금지');
  for (const p of [path.join(repoRoot, 'CNAME'), path.join(siteDir, 'CNAME'), path.join(srcDir, 'CNAME')]) if (fs.existsSync(p)) bad(`CNAME은 두지 않음(도메인 미정): ${path.relative(repoRoot, p)}`);

  // 7) 화면 스크립트: 안전한 DOM API만, 추적·외부 전송 없음, 데이터는 문서 기준 상대 경로, 저장은 마친 자료 표시 하나뿐
  for (const [name, text] of Object.entries(js)) {
    for (const re of UNSAFE_DOM) if (re.test(text)) bad(`${name}: 문자열을 HTML이나 코드로 실행하는 API ${re}`);
    for (const re of TRACKING) if (re.test(text)) bad(`${name}: 추적·외부 전송 API ${re}`);
    // 허용: 이 저장소 주소, 저장소 주소를 만드는 GitHub 머리, SVG 이름공간
    for (const u of text.match(/https?:\/\/[^'"\s)]+/g) || []) if (!allowedExternal(u) && u !== 'https://github.com/' && u !== 'http://www.w3.org/2000/svg') bad(`${name}: 허용하지 않은 주소 ${u}`);
    if (/fetch\(\s*['"`]\//.test(text) || /new URL\(\s*['"`]\//.test(text)) bad(`${name}: 절대 경로 fetch 금지`);
    if (/(?:href|src)\s*[=:]\s*['"]\.\.\//.test(text)) bad(`${name}: 상위 폴더 경로 금지`);
  }
  if (!/fetch\(new URL\('data\/roadmap\.json', document\.baseURI\)\)/.test(js['app.js'])) bad("app.js: 데이터는 fetch(new URL('data/roadmap.json', document.baseURI))로 읽어야 함");
  if (!/fetch\(new URL\('data\/dates\.json', document\.baseURI\)\)/.test(js['app.js'])) bad("app.js: 날짜는 fetch(new URL('data/dates.json', document.baseURI))로 읽어야 함");
  if ((js['app.js'].match(/\bfetch\(/g) || []).length !== 2) bad('app.js: fetch는 로드맵 데이터와 자료 날짜를 읽는 두 번만');
  const storage = js['app.js'].match(/localStorage\.\w+\([^)]*\)?/g) || [];
  if (storage.length !== 2 || !storage.every((s) => /^localStorage\.(getItem|setItem)\(DONE_KEY/.test(s))) bad('app.js: localStorage는 마친 자료 표시(DONE_KEY)를 읽고 쓰는 두 곳에서만');
  if (/localStorage|document\.|window\./.test(js['core.js'])) bad('core.js: 화면·저장 API를 쓰지 않는 계산만');
  if (!/fetch\(new URL\('data\/unit-' \+ id \+ '\.json', document\.baseURI\)\)/.test(js['unit.js'])) bad("unit.js: 내용은 fetch(new URL('data/unit-' + id + '.json', document.baseURI))로 읽어야 함");
  if ((js['unit.js'].match(/\bfetch\(/g) || []).length !== 1) bad('unit.js: fetch는 단원 내용을 읽는 한 번만');
  if (/localStorage/.test(js['unit.js'])) bad('unit.js: 저장 API를 쓰지 않음');
  if (!/\^\[a-z0-9\]\+\(\?:-\[a-z0-9\]\+\)\*\$/.test(js['unit.js'])) bad('unit.js: 주소의 단원 id는 소문자·숫자·붙임표만 받아야 함');

  // 8) 글꼴: 선언한 파일이 있고, 화면 글자가 글꼴에 들어 있다
  const fontDir = path.join(srcDir, 'fonts');
  const fontRefs = [...css['fonts.css'].matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/['"]/g, ''));
  for (const ref of fontRefs) {
    if (!isRelativeRef(ref) || !ref.startsWith('fonts/')) bad(`fonts.css: 글꼴 경로는 fonts/ 아래 상대 경로 — ${ref}`);
    else if (!fs.existsSync(path.join(srcDir, ref))) bad(`fonts.css: 없는 글꼴 파일 ${ref}`);
  }
  const shipped = fontFiles(siteDir);
  for (const f of shipped.filter((n) => n.endsWith('.woff2'))) if (!fontRefs.includes('fonts/' + f)) bad(`fonts: 선언에 없는 글꼴 파일 ${f}`);
  if (!shipped.includes('OFL.txt')) bad('fonts: 글꼴 라이선스 전문(OFL.txt) 필요');
  if (/url\(/.test(css['app.css'])) bad('app.css: url() 참조는 fonts.css에만');
  const charsetFile = (n) => path.join(siteDir, 'fonts', n);
  if (!fs.existsSync(charsetFile('charset-core.txt')) || !fs.existsSync(charsetFile('charset-rest.txt'))) bad('fonts: site/fonts/charset-core.txt, charset-rest.txt 필요(scripts/fonts.py가 만든다)');
  else {
    const core = new Set(fs.readFileSync(charsetFile('charset-core.txt'), 'utf8'));
    const rest = new Set(fs.readFileSync(charsetFile('charset-rest.txt'), 'utf8'));
    const used = new Set([...(htmlText + unitText + shown.join('') + unitShown.join('') + js['app.js'] + js['unit.js'])].filter((c) => c.codePointAt(0) > 0x7e && !/\s/.test(c) && !SYSTEM_GLYPHS.includes(c)));
    const outside = [...used].filter((c) => !core.has(c) && !rest.has(c));
    const late = [...used].filter((c) => !core.has(c) && rest.has(c));
    if (outside.length) bad(`fonts: 글꼴에 없는 글자 ${outside.join('')} — scripts/fonts.py로 다시 만든다`);
    if (late.length) notes.push(`글꼴: 기본 묶음에 없는 글자 ${late.length}개(${late.join('')})는 추가 묶음에서 받는다. scripts/fonts.py를 다시 돌리면 기본 묶음에 들어간다`);
  }

  // 9) 워크플로
  const wfPath = path.join(repoRoot, '.github/workflows/learning-site.yml');
  if (!fs.existsSync(wfPath)) bad('워크플로 없음: .github/workflows/learning-site.yml');
  else {
    const wf = overrides.workflow != null ? overrides.workflow : fs.readFileSync(wfPath, 'utf8');
    const deployAt = wf.search(/^ {2}deploy:\s*$/m);
    const top = deployAt >= 0 ? wf.slice(0, deployAt) : wf;
    const deploy = deployAt >= 0 ? wf.slice(deployAt) : '';
    const noComment = (t) => t.replace(/^\s*#.*$/gm, '');
    if (!/^\s*pull_request:/m.test(wf)) bad('워크플로: pull_request 트리거 필요');
    if (!/^permissions:\s*\n\s+contents:\s*read\s*$/m.test(wf)) bad('워크플로: 최상위 permissions는 contents: read만');
    if (/pages:\s*write|id-token:\s*write/.test(top)) bad('워크플로: pages/id-token write는 deploy job에만');
    if (!deploy) bad('워크플로: deploy job 없음');
    else {
      if (!/pages:\s*write/.test(deploy) || !/id-token:\s*write/.test(deploy)) bad('워크플로: deploy job에 pages/id-token write 필요');
      const cond = /^ {4}if:\s*(.+)$/m.exec(deploy);
      if (!cond || !/github\.event_name\s*!=\s*'pull_request'/.test(cond[1]) || !/github\.ref\s*==\s*'refs\/heads\/main'/.test(cond[1])) bad('워크플로: deploy job은 PR이 아니고 main일 때만 실행되어야 함');
      if (!/environment:\s*\n\s+name:\s*github-pages/.test(deploy)) bad('워크플로: github-pages environment 필요');
      if (!/needs:\s*build/.test(deploy)) bad('워크플로: deploy job은 needs: build');
      if (!/url:\s*\$\{\{\s*steps\.deployment\.outputs\.page_url\s*\}\}/.test(deploy)) bad('워크플로: environment url은 steps.deployment.outputs.page_url');
    }
    if (!/path:\s*site\/dist\s*$/m.test(wf)) bad('워크플로: Pages artifact path는 site/dist');
    const uploadCond = /- name: Upload Pages artifact\s*\n\s+if:\s*(.+)/.exec(wf);
    if (!uploadCond || !/refs\/heads\/main/.test(uploadCond[1]) || !/pull_request/.test(uploadCond[1])) bad('워크플로: Pages artifact 업로드는 main 배포 조건에서만');
    if (/configure-pages|deploy-pages/.test(noComment(top))) bad('워크플로: configure-pages/deploy-pages는 deploy job에만');
    for (const cmd of ['node scripts/build.mjs --require-history', 'node scripts/check.mjs --dist', 'node scripts/test.mjs']) if (!top.includes('run: ' + cmd)) bad(`워크플로: build job에서 ${cmd} 실행 필요`);
    if (!/^\s+fetch-depth:\s*0\s*$/m.test(noComment(top))) bad('워크플로: build job의 checkout은 fetch-depth: 0 (자료 날짜를 git 이력에서 읽는다)');
    // 자료가 바뀌면 날짜도 바뀐다. 자료가 있는 경로에 push가 오면 다시 빌드해 배포해야 한다.
    const pushBlock = (/^ {2}push:\s*\n([\s\S]*?)(?=^ {2}\S)/m.exec(wf) || [])[1] || '';
    const watchedTops = new Set(watchedPaths(data).flatMap((w) => [...w.files, ...w.dirs]).map((p) => (p.includes('/') ? p.split('/')[0] + '/**' : p)));
    for (const t of [...watchedTops].sort()) if (!pushBlock.includes(`"${t}"`)) bad(`워크플로: main push의 paths에 "${t}" 필요(자료가 바뀌면 날짜를 다시 읽어 배포한다)`);
    for (const [act, major] of Object.entries(ACTION_MAJORS)) {
      const used = [...wf.matchAll(new RegExp(`uses:\\s*${act.replace('/', '\\/')}@(\\S+)`, 'g'))].map((m) => m[1]);
      if (!used.length) bad(`워크플로: ${act} 사용 필요`);
      for (const v of used) if (v !== major) bad(`워크플로: ${act}@${v} — GitHub Docs 예시 major ${major}와 다름(바꿀 때는 확인 후 이 표를 고친다)`);
    }
    if (/CNAME|cname:/.test(noComment(wf))) bad('워크플로: 사용자 도메인 설정 금지(도메인 미정)');
  }

  // 10) 산출물: 허용 목록, 원본과 바이트 동일(재현성), 두 base 경로 해석
  if (dist) {
    if (!fs.existsSync(dist)) bad(`dist 없음: ${dist} (먼저 build)`);
    else {
      const allow = distAllowlist(siteDir);
      const files = listFiles(dist);
      const extra = files.filter((f) => !allow.includes(f));
      const missing = allow.filter((f) => !files.includes(f));
      if (extra.length) bad(`dist: 허용 목록 밖 파일 ${extra.join(', ')}`);
      if (missing.length) bad(`dist: 누락 ${missing.join(', ')}`);
      if (files.some((f) => /\.(pdf|pptx|docx|md|ts|feature|mjs|py|log)$/i.test(f) || (/\.txt$/i.test(f) && f !== 'fonts/OFL.txt'))) bad('dist: 원본 교재·문서·스크립트·로그 복사 금지');
      if (files.includes('CNAME')) bad('dist: CNAME 금지(도메인 미정)');
      for (const f of files) {
        if (f === MARKER || f === '.nojekyll' || f === DATES_FILE) continue;
        const srcFile = f.startsWith('data/') ? path.join(siteDir, f) : path.join(srcDir, f);
        if (!fs.existsSync(srcFile)) bad(`dist: 원본 없는 파일 ${f}`);
        else if (!fs.readFileSync(srcFile).equals(fs.readFileSync(path.join(dist, f)))) bad(`dist: 원본과 다른 파일 ${f} (다시 build)`);
      }
      if (files.includes(DATES_FILE)) {
        let dated = null;
        try { dated = JSON.parse(fs.readFileSync(path.join(dist, DATES_FILE), 'utf8')); } catch { bad(`dist: ${DATES_FILE}을 읽을 수 없음`); }
        const DAY = /^\d{4}-\d\d-\d\d$/;
        const keys = (o) => Object.keys(o).sort().join();
        if (dated && (typeof dated.complete !== 'boolean' || !dated.items || typeof dated.items !== 'object' || Array.isArray(dated.items) || keys(dated) !== 'complete,items')) bad(`dist: ${DATES_FILE}은 { complete, items } 형식`);
        else if (dated) {
          for (const [id, e] of Object.entries(dated.items)) {
            if (!R.isOpen(items.get(id))) bad(`dist: ${DATES_FILE}에 공개 자료가 아닌 id ${id}`);
            if (!e || typeof e !== 'object' || keys(e) !== 'added,updated' || !DAY.test(e.added) || !DAY.test(e.updated) || e.added > e.updated) bad(`dist: ${DATES_FILE}의 ${id}는 { added, updated } 날짜(YYYY-MM-DD)이고 added가 updated보다 늦지 않아야 함`);
          }
          if (JSON.stringify(collectDates({ repoRoot, data })) !== JSON.stringify(dated)) bad(`dist: ${DATES_FILE}이 지금 저장소 이력과 다름 (다시 build)`);
          const dateless = [...items.values()].filter((i) => R.isOpen(i) && !dated.items[i.id]).map((i) => i.id);
          notes.push(!dated.complete ? '날짜: git 이력이 온전하지 않아 넣지 않음(얕은 복제). 화면에 날짜와 NEW 표시가 나오지 않는다'
            : `날짜: 공개 자료 ${Object.keys(dated.items).length}개` + (dateless.length ? ` · 아직 커밋하지 않아 날짜가 없는 자료 ${dateless.join(', ')}` : ''));
        }
      }
      if (files.includes(MARKER)) {
        const marker = fs.readFileSync(path.join(dist, MARKER), 'utf8');
        if (/\/Users\/|\/home\/|[A-Z]:\\|\d{4}-\d\d-\d\dT/.test(marker)) bad('dist: 빌드 표식에 로컬 경로·시각 금지');
      }
      const distHtml = ['index.html', 'unit.html'].map((n) => (fs.existsSync(path.join(dist, n)) ? fs.readFileSync(path.join(dist, n), 'utf8') : '')).join('\n');
      const loaded = files.filter((f) => f.startsWith('data/') || /^fonts\/.+\.woff2$/.test(f));
      for (const base of SERVE_BASES) {
        const page = new URL(base, 'https://example.invalid');
        const refs = [...assetRefs(distHtml).map((r) => r.value), ...anchorRefs(distHtml).filter((h) => !/^(#|https:)/.test(h)), ...loaded];
        for (const v of refs) {
          const resolved = new URL(v, page);
          if (resolved.origin !== page.origin || !resolved.pathname.startsWith(base)) bad(`dist(${base}): base 밖으로 해석되는 참조 ${v}`);
          else if (!files.includes(decodeURIComponent(resolved.pathname.slice(base.length)) || 'index.html')) bad(`dist(${base}): 없는 자산 ${v}`);
        }
      }
      notes.push(`dist: ${files.length}개 파일`);
    }
  }

  const open = [...items.values()].filter((i) => R.isOpen(i)).length;
  notes.push(`단원 한눈에 보기 ${units.length}개`);
  notes.unshift(`로드맵 ${data.lines.length}개 · 단계 ${data.lines.reduce((n, l) => n + (l.stages || []).length, 0)}개 · 공개 자료 ${open}개 · 준비 중 ${items.size - open}개 · git 추적 파일 ${tracked.length}개와 대조`);
  return { problems, notes };
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const di = args.indexOf('--dist');
  const dist = di >= 0 ? path.resolve(args[di + 1] && !args[di + 1].startsWith('--') ? args[di + 1] : DEFAULT_OUT) : null;
  const { problems, notes } = collectProblems({ dist });
  for (const n of notes) console.log(`check: · ${n}`);
  if (problems.length) {
    for (const p of problems) console.error(`check: ✗ ${p}`);
    console.error(`check: 실패 ${problems.length}건`);
    process.exit(1);
  }
  console.log('check: 통과');
}
