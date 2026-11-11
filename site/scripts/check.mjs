#!/usr/bin/env node
// kosta-ai-lab 포털 정적 검사 (Apache-2.0).
// 사용: node scripts/check.mjs [--dist [폴더]]
//  - 원본 링크 manifest를 git ls-files와 대조하고, 상태·담당 문자열을 원문에서 확인한다.
//  - 포털 데이터의 참조 무결성, 제공 상태의 근거, 승인 문구 보존, 과장·추적 표현 금지, 외부 자산 금지를 검사한다.
//  - Pages 워크플로의 권한·배포 조건을 확인한다.
//  - 화면 원본(src): 승인 문구·메타데이터·meta CSP·상대 경로·검토용 흔적/개인 경로 금지를 확인한다.
//  - --dist: 빌드 산출물이 허용 목록과 같고, 원본과 바이트가 같으며(재현성), /ai-native-sdlc/ 와 / 양쪽에서 해석되는지 확인한다.
import fs from 'node:fs';
import path from 'node:path';
import {
  REPO_ROOT, SITE_DIR, DATA_DIR, DEFAULT_OUT, BASE_PATH, MARKER, REPO_URL, ORG_URL, SRC_FILES,
  readJSON, repoUrl, gitTrackedFiles, assetRefs, anchorRefs, listFiles, distAllowlist, isMain
} from './lib.mjs';

const FORBIDDEN_CLAIMS = [
  /진행률/, /진도율/, /완료율/, /수료율/, /완료\s*체크/, /학습\s*완료/, /수강생\s*\d/,
  /\d[\d,]*\s*명\s*(이|의|이상)?\s*(수강|학습|수료|참여)/, /만족도/, /합격률/,
  /완성된\s*모듈/, /모듈\s*완성/, /검증\s*완료/, /회원\s*가입/, /AI\s*튜터/i
];
// 홈 화면(index.html)에 노출하지 않는 내부 제작·검수 용어
const INTERNAL_TERMS = [/시안/, /감사/, /검수/, /초안/, /내부\s*메모/, /TODO/, /미확정/, /preview/i];
// 승인 초안(PORTAL_DRAFT.ko.md)의 제목·핵심 문장. 화면에 그대로 있어야 한다.
const APPROVED_COPY = [
  'kosta-ai-lab',
  'AI와 함께 만드는 소프트웨어,',
  '함께 발전시키는 <em>개발 방식</em>',
  'AI가 코드를 작성하는 시대에도 무엇을 만들지 정하고, 설계를 검토하고, 결과를 확인하는 과정은 중요합니다.',
  '우리는 AI-Native 소프트웨어 개발의 방법과 경험을 나누고, 교재·예제·도구를 함께 발전시킵니다.',
  '로드맵 둘러보기', '공개 자료 보기',
  '왜 함께 공개하나요?',
  '한 사람의 경험이 다른 사람의 출발점이 되고, 새로운 시도와 피드백이 더 나은 개발 방식으로 이어지기 때문입니다.',
  'KOSTA AI 에이전트 코딩 전문가 워크숍에서 출발한 AI-Native SDLC 프로젝트는 강사와 개발자가 자료·사례·실습을 함께 보완합니다.',
  '경험을 나눕니다.', '결과를 확인합니다.', '함께 보완합니다.',
  '무엇을 다루고, 어디로 이어질까요?',
  '이 흐름은 전체를 이해하기 위한 개요이며, 모든 사람이 따라야 하는 고정 학습 순서는 아닙니다.',
  '지금 살펴볼 수 있는 것',
  '작은 수정부터 새로운 사례까지',
  '기여 방법 보기', '오류·개선 제안', 'GitHub 조직 방문',
  '>소개<', '[ 01 ] 소개', '[ 02 ] 로드맵', '[ 03 ] 서비스·자료', '[ 04 ] 참여하기',
  '>GitHub<', '>기여 안내<', '>라이선스<', '>보안 안내<'
];
// 검토용 시안 표시·비교 링크(제작 단계 흔적)와 개인·내부 주소
const REVIEW_MARKERS = [/통합\s*시안/, /시안\s*비교/, /미확정/, /제작\s*제안/, /designs-v2/, /designs-integrated/, /\bEgo\b/];
const PRIVATE_MARKERS = [/\/Users\//, /\/home\/[a-z]/, /\.hermes/, /ts\.net/, /tail[0-9a-f]{5,}/, /127\.0\.0\.1/, /localhost/, /:18483/];
const APPROVED_TITLE = 'kosta-ai-lab — AI와 함께 만드는 소프트웨어, 함께 발전시키는 개발 방식';
const APPROVED_DESCRIPTION = 'kosta-ai-lab은 AI-Native 소프트웨어 개발의 방법과 경험을 나누고, 교재·예제·도구를 함께 발전시킵니다. 로드맵과 공개 자료로 연결합니다.';
// meta CSP 정책(GitHub Pages는 HTTP 헤더를 정할 수 없다). 스크립트는 같은 출처 파일만, 스타일은 CSSOM·속성 갱신을 위해 unsafe-inline 유지,
// 무대 SVG는 문서 안 요소, 데이터는 같은 출처 JSON fetch.
export const REQUIRED_CSP = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'none'"]
};
// meta로 전달하면 브라우저가 무시하고 콘솔에 경고하는 지시어
const META_IGNORED_CSP = ['frame-ancestors', 'report-uri', 'report-to', 'sandbox'];
const SCRIPT_ORDER = /<script src="motion-core\.js" defer><\/script>\s*<script src="layers\.js" defer><\/script>\s*<script src="story\.js" defer><\/script>/;
// story.js·layers.js가 찾는 고정 요소
const REQUIRED_IDS = ['head', 'main', 'toc', 'toc-toggle', 'story', 'top', 'top-title', 'intro', 'roadmap', 'materials', 'courses', 'example', 'join',
  'stage', 'stage-svg', 'cam', 'stage-msg', 'hud-label', 'hud-fill', 'area-index', 'area-steps', 'material-list', 'course-list', 'example-steps', 'example-note', 'layers'];
// 배포 주소: GitHub Pages 프로젝트 하위 경로와, 사용자 도메인을 붙였을 때의 루트
export const SERVE_BASES = [BASE_PATH, '/'];

export function parseCsp(text) {
  const out = {};
  for (const part of text.split(';')) {
    const [dir, ...vals] = part.trim().split(/\s+/);
    if (dir) out[dir.toLowerCase()] = vals;
  }
  return out;
}
/** 상대 경로인지: 스킴·프로토콜 상대·루트 절대·상위 폴더·data: 금지 */
export function isRelativeRef(v) {
  return !!v && !/^[a-z][a-z0-9+.-]*:/i.test(v) && !v.startsWith('/') && !v.startsWith('\\') && !v.split(/[?#]/)[0].split('/').includes('..');
}

// GitHub Docs "Using custom workflows with GitHub Pages" 예시 major (2026-11-11 확인)
const ACTION_MAJORS = { 'actions/checkout': 'v6', 'actions/configure-pages': 'v5', 'actions/upload-pages-artifact': 'v4', 'actions/deploy-pages': 'v4' };
const AREA_TITLES = ['문제·요구사항', '명세·설계', 'AI와 구현', '테스트·검증', '배포·운영'];
const PERCENT_ALLOWED = ['100% 통과'];
const TRACKING = [/localStorage/, /sessionStorage/, /indexedDB/, /document\.cookie/, /navigator\.sendBeacon/, /gtag\(|google-analytics|googletagmanager/];

function allowedExternal(url) {
  return url === ORG_URL || url === REPO_URL || url.startsWith(REPO_URL + '/');
}

export function collectProblems({ dist = null, repoRoot = REPO_ROOT, siteDir = SITE_DIR, dataDir = DATA_DIR, srcDir = path.join(siteDir, 'src') } = {}) {
  const problems = [];
  const notes = [];
  const bad = (msg) => problems.push(msg);

  const tracked = gitTrackedFiles(repoRoot);
  const trackedSet = new Set(tracked);
  const readRepo = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
  const sourcesDoc = readJSON(path.join(dataDir, 'sources.json'));
  const portal = readJSON(path.join(dataDir, 'portal.json'));
  const sources = sourcesDoc.sources;
  const byId = new Map();

  // 1) manifest ↔ git ls-files
  for (const s of sources) {
    if (byId.has(s.id)) bad(`sources: 중복 id ${s.id}`);
    byId.set(s.id, s);
    for (const key of ['id', 'path', 'kind', 'url', 'type', 'title', 'status', 'evidence']) {
      if (typeof s[key] !== 'string' || !s[key]) bad(`sources[${s.id}]: ${key} 누락`);
    }
    if (s.kind === 'file') {
      if (!trackedSet.has(s.path)) bad(`sources[${s.id}]: git 추적 파일 아님 — ${s.path}`);
    } else if (s.kind === 'dir') {
      if (!tracked.some((f) => f.startsWith(s.path + '/'))) bad(`sources[${s.id}]: git 추적 폴더 아님 — ${s.path}`);
    } else bad(`sources[${s.id}]: kind는 file|dir`);
    const expected = repoUrl(s.path, s.kind, sourcesDoc.ref || 'main');
    if (s.url !== expected) bad(`sources[${s.id}]: url 불일치 — ${s.url} ≠ ${expected}`);
    if (s.path.startsWith('courses/_sample-course') && s.type !== 'template') bad(`sources[${s.id}]: _sample-course는 견본(template)으로만 표시`);
    if (Array.isArray(s.verify) && s.kind === 'file' && trackedSet.has(s.path)) {
      const text = readRepo(s.path);
      for (const needle of s.verify) if (!text.includes(needle)) bad(`sources[${s.id}]: 원문에 '${needle}' 없음 (${s.path})`);
    }
  }
  if (sourcesDoc.urlBase !== REPO_URL) bad('sources: urlBase 불일치');
  const ref = (where, id) => { if (!byId.has(id)) bad(`${where}: 없는 source id '${id}'`); return byId.get(id); };

  // 2) 영역
  const areaIds = new Set();
  if (portal.areas.map((a) => a.title).join('|') !== AREA_TITLES.join('|')) bad(`영역: 승인된 큰 영역 5개(${AREA_TITLES.join(' / ')})와 다름`);
  const legacy = new Map();
  for (const a of portal.areas) {
    if (areaIds.has(a.id)) bad(`영역: 중복 id ${a.id}`);
    areaIds.add(a.id);
    if (!a.summary) bad(`영역 ${a.id}: summary 누락`);
    for (const st of a.legacyStages || []) {
      if (legacy.has(st)) bad(`영역: 이전 단계 ${st}가 두 영역에 연결됨`);
      legacy.set(st, a.id);
    }
    for (const k of ['prerequisites', 'requires', 'order', 'next']) if (k in a) bad(`영역 ${a.id}: 선후관계 필드 '${k}'는 근거 없이 두지 않음`);
  }
  const allStages = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0'));
  for (const st of allStages) if (!legacy.has(st)) bad(`영역: 이전 #stage/${st} 링크가 연결될 영역 없음`);

  // 3) 주제·확장 주제: 제공 상태와 원문 상태 근거
  const checkTopicLike = (kind, t) => {
    const where = `${kind} ${t.id}`;
    for (const key of ['id', 'title', 'availability', 'module', 'sourceStatus', 'owner']) if (!t[key]) bad(`${where}: ${key} 누락`);
    if (!['available', 'preparing'].includes(t.availability)) bad(`${where}: availability는 available|preparing`);
    const mod = ref(`${where} module`, t.module);
    (t.related || []).forEach((id) => ref(`${where} related`, id));
    const statusIds = t.statusSources || [t.module];
    for (const id of statusIds) {
      const s = ref(`${where} statusSources`, id);
      if (!s) continue;
      if (!t.sourceStatus.includes(s.status)) bad(`${where}: 원문 상태 '${t.sourceStatus}'가 '${s.status}'(${s.path})를 반영하지 않음`);
      const owner = (s.verify || []).find((v) => v.startsWith('담당: '));
      if (owner && !t.owner.includes(owner.slice(4))) bad(`${where}: 담당 '${t.owner}'가 원문 '${owner}'(${s.path})와 다름`);
    }
    if (/완료|완성/.test(t.sourceStatus)) bad(`${where}: 상태에 완료/완성 표현 금지`);
    // 제공 상태 근거
    //  - modulePending: 모듈 원문 문서의 목적이 '(작성 예정)'인지. 원문과 일치해야 한다(모듈의 완성도 표시).
    //  - availability: 연결된 공개 자료가 있는지. 'available'은 git에 있는 관련 자료(related)가 있거나
    //    목적이 작성된 모듈 문서가 있을 때만. 목적이 비어 있는 README만으로는 '공개 자료 있음'을 주장하지 않는다.
    const docs = statusIds.map((id) => byId.get(id)).filter((s) => s && s.kind === 'file' && trackedSet.has(s.path));
    if (mod && mod.kind === 'file' && !docs.includes(mod) && trackedSet.has(mod.path)) docs.push(mod);
    const pendingFlags = docs.map((s) => readRepo(s.path).includes('(작성 예정)'));
    const pending = pendingFlags.length > 0 && pendingFlags.every(Boolean);
    if (pendingFlags.some(Boolean) && !pending) bad(`${where}: 근거 문서 일부만 '(작성 예정)'이라 상태를 하나로 판단할 수 없음`);
    if (typeof t.modulePending !== 'boolean') bad(`${where}: modulePending(true|false) 필요`);
    else if (docs.length && t.modulePending !== pending) bad(`${where}: modulePending=${t.modulePending}이 원문(${pending ? "'(작성 예정)'" : '목적 작성됨'})과 다름`);
    const relatedReal = (t.related || []).filter((id) => {
      const s = byId.get(id);
      return s && (s.kind === 'file' ? trackedSet.has(s.path) : tracked.some((f) => f.startsWith(s.path + '/')));
    });
    const hasMaterial = relatedReal.length > 0 || (docs.length > 0 && !pending);
    if (t.availability === 'available' && !hasMaterial) bad(`${where}: '공개 자료 있음'인데 연결된 실제 자료가 없고 모듈 목적도 '(작성 예정)'임`);
    if (t.availability === 'preparing' && hasMaterial) bad(`${where}: 연결된 공개 자료가 있는데 '준비 중'으로 표시됨`);
  };
  const topicIds = new Set();
  for (const t of portal.topics) {
    if (topicIds.has(t.id)) bad(`주제: 중복 id ${t.id}`);
    topicIds.add(t.id);
    if (!areaIds.has(t.area)) bad(`주제 ${t.id}: 없는 영역 ${t.area}`);
    checkTopicLike('주제', t);
  }
  for (const a of portal.areas) if (!portal.topics.some((t) => t.area === a.id)) bad(`영역 ${a.id}: 주제가 없음`);
  const extIds = new Set();
  for (const x of portal.extensions) {
    if (extIds.has(x.id) || areaIds.has(x.id)) bad(`확장 주제: 중복 id ${x.id}`);
    extIds.add(x.id);
    if (!x.summary) bad(`확장 주제 ${x.id}: summary 누락`);
    if (!x.relatedAreas || !x.relatedAreas.length) bad(`확장 주제 ${x.id}: relatedAreas 필요`);
    (x.relatedAreas || []).forEach((id) => { if (!areaIds.has(id)) bad(`확장 주제 ${x.id}: 없는 영역 ${id}`); });
    checkTopicLike('확장 주제', x);
  }
  for (const need of ['harness', 'embedded']) if (!extIds.has(need)) bad('확장 주제: 에이전트 하니스와 임베디드가 있어야 함');

  // 4) 공개 항목(resources·courses)
  const statusKeys = Object.keys(portal.statusLabels.resource);
  const checkActionUrl = (where, a) => {
    if (a.href && !/^#[A-Za-z][\w-]*(\/[\w-]+)?$/.test(a.href)) bad(`${where}: 사이트 안 이동은 '#id' 형식만`);
    if (a.url && !allowedExternal(a.url)) bad(`${where}: 확인되지 않은 외부 주소 ${a.url}`);
    if (a.source) ref(where, a.source);
    if (!a.href && !a.url && !a.source) bad(`${where}: href|url|source 중 하나 필요`);
  };
  const html0 = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
  const itemIds = new Set();
  for (const r of portal.resources) {
    const where = `자료 ${r.id}`;
    if (itemIds.has(r.id)) bad(`${where}: 중복 id`);
    itemIds.add(r.id);
    for (const key of ['title', 'type', 'status', 'summary', 'kind']) if (!r[key]) bad(`${where}: ${key} 누락`);
    if (!statusKeys.includes(r.status)) bad(`${where}: 알 수 없는 상태 ${r.status}`);
    if (r.status === 'operating' && !(r.verified && r.verified.date && r.verified.url)) bad(`${where}: 운영 확인 기록 없이 '운영 중' 표시 금지`);
    if (r.kind === 'service' && r.status === 'operating' && !allowedExternal(r.verified?.url || '')) notes.push(`${where}: 운영 서비스 주소를 검사 허용 목록에 추가해야 함`);
    (r.areas || []).forEach((id) => { if (!areaIds.has(id)) bad(`${where}: 없는 영역 ${id}`); });
    (r.actions || []).forEach((a, i) => { checkActionUrl(`${where} 행동 ${i + 1}`, a); if (a.href && !html0.includes(`id="${a.href.slice(1)}"`)) bad(`${where}: 이동할 구역 ${a.href} 없음`); });
    if (r.intro) ref(`${where} intro`, r.intro);
    (r.steps || []).forEach((st, i) => { ref(`${where} 단계 ${i + 1}`, st.source); if (!areaIds.has(st.area)) bad(`${where} 단계 ${i + 1}: 없는 영역`); });
  }
  const ex = portal.resources.find((r) => r.kind === 'example');
  const exOrder = ['todo-req', 'todo-spec', 'todo-acc', 'todo-test', 'todo-impl'];
  // 기준 5단계가 이 순서로 들어 있어야 한다(단계 추가는 허용).
  const exSeq = ex ? ex.steps.map((s) => s.source).filter((id) => exOrder.includes(id)) : [];
  if (!ex || exSeq.join() !== exOrder.join()) bad('예제: 요구사항→명세→인수조건→테스트→구현 원본 순서여야 함');
  if (portal.resources.some((r) => r.kind === 'service')) notes.push('서비스 항목이 있음 — 운영 확인 기록을 검토하세요');

  if (!portal.courses.length) bad('강의: 공개 강의 항목이 하나 이상 필요함');
  const readme = readRepo('README.md');
  const coursesIndex = readRepo('courses/README.md');
  for (const c of portal.courses) {
    const where = `강의 ${c.id}`;
    if (itemIds.has(c.id)) bad(`${where}: 중복 id`);
    itemIds.add(c.id);
    if (!statusKeys.includes(c.status) || c.status === 'operating') bad(`${where}: 강의 상태는 공개됨/준비 중`);
    (c.areas || []).forEach((id) => { if (!areaIds.has(id)) bad(`${where}: 없는 영역 ${id}`); });
    if (!readme.includes(`[${c.title}]`)) bad(`${where}: 제목 '${c.title}'이 README.md 강의 목록에 없음`);
    const linked = c.links.map((l) => ref(where, l.source)).filter(Boolean);
    if (linked.some((s) => s.path.includes('_sample-course'))) bad(`${where}: _sample-course를 강의로 연결하면 안 됨`);
    const pdf = linked.find((s) => s.type === 'slides-pdf');
    if (!pdf || !pdf.path.endsWith('.pdf')) bad(`${where}: 교재 PDF 링크 필요`);
    const courseReadme = linked.find((s) => s.type === 'course');
    if (!courseReadme) bad(`${where}: 강의 README 링크 필요`);
    else {
      const text = readRepo(courseReadme.path);
      if (!text.includes(c.fullTitle)) bad(`${where}: 원제목 '${c.fullTitle}'이 ${courseReadme.path}에 없음`);
      const folder = courseReadme.path.split('/')[1];
      if (!coursesIndex.includes(`](${folder}/)`) && !coursesIndex.includes(`](${encodeURI(folder)}/)`)) {
        notes.push(`${where}: courses/README.md 표의 링크 경로가 실제 폴더 '${folder}'와 다름 — 사이트는 실제 폴더로 연결(원본은 수정하지 않음)`);
      }
    }
    const inst = ref(`${where} instructorSource`, c.instructorSource);
    if (inst && !readRepo(inst.path).includes(c.instructor)) bad(`${where}: 강사 '${c.instructor}'가 ${inst.path}에 없음`);
  }
  for (const a of portal.areas) {
    const n = portal.resources.filter((r) => (r.areas || []).includes(a.id)).length + portal.courses.filter((c) => c.areas.includes(a.id)).length;
    if (!n) notes.push(`영역 ${a.id}: 연결된 공개 항목 없음`);
  }
  for (const [k, v] of Object.entries(portal.links || {})) if (!allowedExternal(v)) bad(`links.${k}: 허용되지 않은 주소 ${v}`);

  // 5) 승인 문구·홈 화면 용어·과장·추적 표현
  const html = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
  for (const s of APPROVED_COPY) if (!html.includes(s)) bad(`index.html: 승인 문구 누락 — ${s}`);
  const visibleHtml = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
  for (const re of INTERNAL_TERMS) if (re.test(visibleHtml)) bad(`index.html: 홈 화면에 내부 용어 ${re}`);
  const codeFiles = SRC_FILES.filter((n) => /\.(js|css|html|svg)$/.test(n));
  const code = Object.fromEntries(codeFiles.map((n) => [n, fs.readFileSync(path.join(srcDir, n), 'utf8')]));
  const jsNames = codeFiles.filter((n) => n.endsWith('.js'));
  const js = jsNames.map((n) => code[n]).join('\n');
  const css = codeFiles.filter((n) => n.endsWith('.css')).map((n) => code[n]).join('\n');
  const texts = { 'data/portal.json': fs.readFileSync(path.join(dataDir, 'portal.json'), 'utf8'), 'src/index.html': html };
  for (const n of jsNames) texts['src/' + n] = code[n];
  for (const [name, text] of Object.entries(texts)) {
    for (const re of FORBIDDEN_CLAIMS) if (re.test(text)) bad(`${name}: 금지 표현 ${re}`);
    let scrub = text;
    for (const ok of PERCENT_ALLOWED) scrub = scrub.split(ok).join('');
    // JS는 화면에 보이는 한글 문자열만 본다(clip-path·크기 계산의 100% 등은 표현이 아님).
    if (name.endsWith('.js')) scrub = (scrub.replace(/\/\*[\s\S]*?\*\//g, '').match(/'[^'\n]*'/g) || []).filter((m) => /[가-힣]/.test(m)).join('\n');
    if (/\d+\s*%/.test(scrub)) bad(`${name}: 근거 없는 백분율 표현`);
    if (name.endsWith('.js')) for (const re of TRACKING) if (re.test(text)) bad(`${name}: 저장·추적 API 사용 금지 ${re}`);
  }
  // 검토용 시안 흔적·개인 로컬 경로·내부 주소가 배포 원본에 남지 않게 한다(데이터 포함).
  const shipped = { ...Object.fromEntries(codeFiles.map((n) => ['src/' + n, code[n]])) };
  for (const n of fs.readdirSync(dataDir).filter((x) => x.endsWith('.json'))) shipped['data/' + n] = fs.readFileSync(path.join(dataDir, n), 'utf8');
  for (const [name, text] of Object.entries(shipped)) {
    for (const re of REVIEW_MARKERS) if (re.test(text)) bad(`${name}: 검토용 흔적 ${re}`);
    for (const re of PRIVATE_MARKERS) if (re.test(text)) bad(`${name}: 개인·내부 경로 ${re}`);
  }

  // 6) 메타데이터·CSP·외부 자산·상대 경로
  const head = (/<head>([\s\S]*?)<\/head>/.exec(html) || [])[1] || '';
  if (!/^<!doctype html>\s*<html lang="ko"[ >]/i.test(html)) bad('index.html: <html lang="ko"> 필요');
  const title = (/<title>([^<]*)<\/title>/.exec(head) || [])[1];
  const metaContent = (attr, name) => {
    const re = new RegExp(`<meta\\s+${attr}="${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+content="([^"]*)"`, 'i');
    return (re.exec(head) || [])[1];
  };
  const desc = metaContent('name', 'description');
  if (title !== APPROVED_TITLE) bad(`index.html: title은 승인 문구 '${APPROVED_TITLE}'만 — ${title}`);
  if (desc !== APPROVED_DESCRIPTION) bad('index.html: description은 승인 문구만');
  if (metaContent('property', 'og:title') !== APPROVED_TITLE) bad('index.html: og:title = title 이어야 함');
  if (metaContent('property', 'og:description') !== APPROVED_DESCRIPTION) bad('index.html: og:description = description 이어야 함');
  if (!/<link rel="icon" href="favicon\.svg" type="image\/svg\+xml">/.test(head)) bad('index.html: favicon.svg 링크 필요');
  // 도메인이 정해지지 않았으므로 절대 주소 메타(canonical·og:url·og:image)와 검색 차단(noindex)을 두지 않는다.
  if (/rel="canonical"|property="og:url"|property="og:image"|name="twitter:image"/i.test(head)) bad('index.html: 도메인 미정 — canonical/og:url/og:image 고정 금지');
  if (/noindex/i.test(head)) bad('index.html: 검토용 noindex가 남아 있음');
  for (const m of head.matchAll(/<meta\b[^>]*\bcontent="([^"]*)"/gi)) if (/https?:\/\//i.test(m[1]) && !/^https:\/\/github\.com\/kosta-ai-lab/.test(m[1])) bad(`index.html: 메타에 외부 주소 ${m[1]}`);

  // CSP: GitHub Pages는 응답 헤더를 정할 수 없으므로 meta로 선언한다. 다른 자원보다 먼저 와야 적용된다.
  const cspTags = [...head.matchAll(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)">/gi)];
  if (cspTags.length !== 1) bad(`index.html: meta CSP는 정확히 1개 (현재 ${cspTags.length})`);
  else {
    const at = head.indexOf(cspTags[0][0]);
    const firstRes = head.search(/<(link|script|style)\b/i);
    if (firstRes >= 0 && firstRes < at) bad('index.html: meta CSP가 link/script보다 먼저 와야 함');
    const csp = parseCsp(cspTags[0][1]);
    for (const [dir, want] of Object.entries(REQUIRED_CSP)) {
      const have = (csp[dir] || []).slice().sort().join(' ');
      if (have !== want.slice().sort().join(' ')) bad(`CSP: ${dir}는 '${want.join(' ')}' 이어야 함 (현재 '${(csp[dir] || []).join(' ')}')`);
    }
    for (const dir of META_IGNORED_CSP) if (dir in csp) bad(`CSP: ${dir}는 meta에서 무시되고 콘솔 경고를 낸다 — 넣지 않음`);
    for (const dir of Object.keys(csp)) if (!(dir in REQUIRED_CSP)) bad(`CSP: 검토되지 않은 지시어 ${dir}`);
  }
  if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) bad('index.html: inline script 금지(CSP script-src self)');
  if (/\son[a-z]+\s*=/i.test(html.replace(/<!--[\s\S]*?-->/g, '')) || /javascript:/i.test(html)) bad('index.html: 이벤트 속성·javascript: 금지');
  if (/<iframe|<object|<embed|<base\b|<form\b/i.test(html)) bad('index.html: iframe/object/embed/base/form 금지');
  if (!SCRIPT_ORDER.test(head)) bad('index.html: 스크립트는 motion-core.js → layers.js → story.js 순서의 defer 상대 경로');
  for (const re of [/\binnerHTML\b/, /\bouterHTML\b/, /insertAdjacentHTML/, /document\.write/, /\beval\(/, /new Function/, /setTimeout\(\s*['"]/, /setAttribute\(\s*['"]on/i, /setAttribute\(\s*['"]style['"]/]) {
    if (re.test(js)) bad(`스크립트: CSP·안전 위반 가능 API ${re}`);
  }
  for (const id of REQUIRED_IDS) if (!html.includes(`id="${id}"`)) bad(`index.html: 스크립트가 쓰는 id="${id}" 없음`);

  for (const r of assetRefs(html)) {
    if (!isRelativeRef(r.value)) bad(`index.html: 상대 경로가 아닌 자산 참조 — ${r.value}`);
    else if (!fs.existsSync((r.value.startsWith('data/') ? path.join(siteDir, r.value) : path.join(srcDir, r.value)))) bad(`index.html: 없는 자산 ${r.value}`);
  }
  for (const href of anchorRefs(html)) {
    if (href.startsWith('#')) {
      if (href.length > 1 && !html.includes(`id="${href.slice(1)}"`)) bad(`index.html: 없는 구역 ${href}`);
      continue;
    }
    if (href.startsWith('https://')) {
      if (!allowedExternal(href)) bad(`index.html: 허용되지 않은 외부 링크 — ${href}`);
      const m = /\/(?:blob|tree)\/main\/(.+)$/.exec(href);
      if (m) {
        const p = decodeURIComponent(m[1]);
        if (!trackedSet.has(p) && !tracked.some((f) => f.startsWith(p + '/'))) bad(`index.html: git 추적 경로 아님 — ${p}`);
      }
      continue;
    }
    if (!isRelativeRef(href)) bad(`index.html: 허용되지 않는 링크 — ${href}`);
    else if (!fs.existsSync((href.startsWith('data/') ? path.join(siteDir, href) : path.join(srcDir, href)))) bad(`index.html: 없는 내부 링크 ${href}`);
  }
  if (/@import|url\(\s*['"]?(https?:)?\/\//i.test(css)) bad('CSS: 외부 import/url 금지');
  if (/fonts\.googleapis|fonts\.gstatic|cdn\.|unpkg|jsdelivr/i.test(html + css + js)) bad('외부 폰트·CDN 참조 금지');
  for (const n of jsNames) {
    for (const u of code[n].match(/https?:\/\/[^'"\s)]+/g) || []) {
      if (!allowedExternal(u) && u !== 'http://www.w3.org/2000/svg') bad(`${n}: 허용되지 않은 URL ${u}`);
    }
    if (/fetch\(\s*['"`]\//.test(code[n]) || /new URL\(\s*['"`]\//.test(code[n])) bad(`${n}: 절대 경로 fetch 금지`);
  }
  if (!/new URL\('data\/' \+ name, document\.baseURI\)/.test(code['story.js'])) bad("story.js: 데이터는 문서 기준 상대 경로 new URL('data/' + name, document.baseURI)로 읽어야 함");
  for (const [name, text] of Object.entries(code)) {
    if (/(?:href|src)\s*[=:]\s*['"]\.\.\//.test(text) || /designs-integrated|designs-v2/.test(text)) bad(`${name}: 상위 폴더·시안 경로 의존 금지`);
  }
  for (const p of [path.join(repoRoot, 'CNAME'), path.join(siteDir, 'CNAME'), path.join(srcDir, 'CNAME')]) if (fs.existsSync(p)) bad(`CNAME 생성 금지(도메인 미정): ${path.relative(repoRoot, p)}`);

  // 7) 워크플로
  const wfPath = path.join(repoRoot, '.github/workflows/learning-site.yml');
  if (!fs.existsSync(wfPath)) bad('워크플로 없음: .github/workflows/learning-site.yml');
  else {
    const wf = fs.readFileSync(wfPath, 'utf8');
    const deployAt = wf.search(/^ {2}deploy:\s*$/m);
    const head = deployAt >= 0 ? wf.slice(0, deployAt) : wf;
    const deploy = deployAt >= 0 ? wf.slice(deployAt) : '';
    if (!/^\s*pull_request:/m.test(wf)) bad('워크플로: pull_request 트리거 필요');
    if (!/^permissions:\s*\n\s+contents:\s*read\s*$/m.test(wf)) bad('워크플로: 최상위 permissions는 contents: read만');
    if (/pages:\s*write|id-token:\s*write/.test(head)) bad('워크플로: pages/id-token write는 deploy job에만');
    if (!deploy) bad('워크플로: deploy job 없음');
    else {
      if (!/pages:\s*write/.test(deploy) || !/id-token:\s*write/.test(deploy)) bad('워크플로: deploy job에 pages/id-token write 필요');
      const cond = /^ {4}if:\s*(.+)$/m.exec(deploy);
      if (!cond || !/github\.event_name\s*!=\s*'pull_request'/.test(cond[1]) || !/github\.ref\s*==\s*'refs\/heads\/main'/.test(cond[1])) {
        bad('워크플로: deploy job은 PR이 아니고 main일 때만 실행되어야 함');
      }
      if (!/environment:\s*\n\s+name:\s*github-pages/.test(deploy)) bad('워크플로: github-pages environment 필요');
    }
    if (!/path:\s*site\/dist\s*$/m.test(wf)) bad('워크플로: Pages artifact path는 site/dist');
    const uploadCond = /- name: Upload Pages artifact\s*\n\s+if:\s*(.+)/.exec(wf);
    if (!uploadCond || !/refs\/heads\/main/.test(uploadCond[1]) || !/pull_request/.test(uploadCond[1])) bad('워크플로: Pages artifact 업로드는 main 배포 조건에서만');
    // PR에서는 검사만: configure/deploy는 deploy job에만, 검사 3단계는 build job에서 실행
    const noComment = (t) => t.replace(/^\s*#.*$/gm, '');
    if (/configure-pages|deploy-pages/.test(noComment(head))) bad('워크플로: configure-pages/deploy-pages는 deploy job에만');
    if (!/needs:\s*build/.test(deploy)) bad('워크플로: deploy job은 needs: build');
    if (!/url:\s*\$\{\{\s*steps\.deployment\.outputs\.page_url\s*\}\}/.test(deploy)) bad('워크플로: environment url은 steps.deployment.outputs.page_url');
    for (const cmd of ['node scripts/build.mjs', 'node scripts/check.mjs --dist', 'node scripts/test.mjs']) if (!head.includes('run: ' + cmd)) bad(`워크플로: build job에서 ${cmd} 실행 필요`);
    for (const [act, major] of Object.entries(ACTION_MAJORS)) {
      const used = [...wf.matchAll(new RegExp(`uses:\\s*${act.replace('/', '\\/')}@(\\S+)`, 'g'))].map((m) => m[1]);
      if (!used.length) bad(`워크플로: ${act} 사용 필요`);
      for (const v of used) if (v !== major) bad(`워크플로: ${act}@${v} — GitHub Docs 예시 major ${major}와 다름(변경 시 확인 후 이 표를 갱신)`);
    }
    if (/CNAME|cname:/.test(noComment(wf))) bad('워크플로: 사용자 도메인 설정 금지(도메인 미정)');
  }

  // 8) 산출물: 허용 목록·원본과 바이트 동일(재현성)·두 base 경로 해석
  if (dist) {
    if (!fs.existsSync(dist)) bad(`dist 없음: ${dist} (먼저 build)`);
    else {
      const allow = distAllowlist(siteDir);
      const files = listFiles(dist);
      const extra = files.filter((f) => !allow.includes(f));
      const missing = allow.filter((f) => !files.includes(f));
      if (extra.length) bad(`dist: 허용 목록 밖 파일 ${extra.join(', ')}`);
      if (missing.length) bad(`dist: 누락 ${missing.join(', ')}`);
      if (files.some((f) => /\.(pdf|pptx|docx|md|ts|feature|mjs|log|txt)$/i.test(f))) bad('dist: 원본 교재·문서·스크립트·로그 복사 금지');
      if (files.includes('CNAME')) bad('dist: CNAME 금지(도메인 미정)');
      for (const f of files) {
        if (f === MARKER || f === '.nojekyll') continue;
        const srcFile = f.startsWith('data/') ? path.join(siteDir, f) : path.join(srcDir, f);
        if (!fs.existsSync(srcFile)) bad(`dist: 원본 없는 파일 ${f}`);
        else if (!fs.readFileSync(srcFile).equals(fs.readFileSync(path.join(dist, f)))) bad(`dist: 소스와 다른 파일 ${f} (다시 build)`);
      }
      if (files.includes(MARKER)) {
        const marker = fs.readFileSync(path.join(dist, MARKER), 'utf8');
        if (/\/Users\/|\/home\/|[A-Z]:\\|\d{4}-\d\d-\d\dT/.test(marker)) bad('dist: 빌드 표식에 로컬 경로·시각 금지');
      }
      const distHtml = fs.existsSync(path.join(dist, 'index.html')) ? fs.readFileSync(path.join(dist, 'index.html'), 'utf8') : '';
      const dataNames = files.filter((f) => f.startsWith('data/'));
      for (const base of SERVE_BASES) {
        const page = new URL(base, 'https://example.invalid');
        const refs = [...assetRefs(distHtml).map((r) => r.value), ...anchorRefs(distHtml).filter((h) => !/^(#|https:)/.test(h)), ...dataNames];
        for (const v of refs) {
          const resolved = new URL(v, page);
          if (resolved.origin !== page.origin || !resolved.pathname.startsWith(base)) bad(`dist(${base}): base 밖으로 해석되는 참조 ${v}`);
          else if (!files.includes(decodeURIComponent(resolved.pathname.slice(base.length)))) bad(`dist(${base}): 없는 자산 ${v}`);
        }
      }
      notes.push(`dist: ${files.length}개 파일 (${files.join(', ')})`);
    }
  }

  notes.unshift(`sources ${sources.length}개 · git 추적 파일 ${tracked.length}개와 대조 · 영역 ${portal.areas.length} · 주제 ${portal.topics.length} · 확장 ${portal.extensions.length} · 공개 항목 ${portal.resources.length} · 강의 ${portal.courses.length}`);
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
