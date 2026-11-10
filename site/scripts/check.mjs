#!/usr/bin/env node
// kosta-ai-lab 포털 정적 검사 (Apache-2.0).
// 사용: node scripts/check.mjs [--dist [폴더]]
//  - 원본 링크 manifest를 git ls-files와 대조하고, 상태·담당 문자열을 원문에서 확인한다.
//  - 포털 데이터의 참조 무결성, 제공 상태의 근거, 승인 문구 보존, 과장·추적 표현 금지, 외부 자산 금지를 검사한다.
//  - Pages 워크플로의 권한·배포 조건을 확인한다.
//  - --dist: 빌드 산출물이 허용 목록과 정확히 같은지 확인한다.
import fs from 'node:fs';
import path from 'node:path';
import {
  REPO_ROOT, SITE_DIR, SRC_DIR, DATA_DIR, DEFAULT_OUT, DIST_ALLOWLIST, REPO_URL, ORG_URL,
  readJSON, repoUrl, gitTrackedFiles, assetRefs, anchorRefs, listFiles, isMain
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
  '>소개<', '>로드맵<', '>서비스·자료<', '>참여하기<',
  '>GitHub<', '>기여 안내<', '>라이선스<', '>보안 안내<'
];
const AREA_TITLES = ['문제·요구사항', '명세·설계', 'AI와 구현', '테스트·검증', '배포·운영'];
const PERCENT_ALLOWED = ['100% 통과'];
const TRACKING = [/localStorage/, /sessionStorage/, /indexedDB/, /document\.cookie/, /navigator\.sendBeacon/, /gtag\(|google-analytics|googletagmanager/];

function allowedExternal(url) {
  return url === ORG_URL || url === REPO_URL || url.startsWith(REPO_URL + '/');
}

export function collectProblems({ dist = null, repoRoot = REPO_ROOT, siteDir = SITE_DIR, dataDir = DATA_DIR } = {}) {
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
  if ([...extIds].sort().join() !== 'embedded,harness') bad('확장 주제: 에이전트 하니스와 임베디드가 있어야 함');

  // 4) 공개 항목(resources·courses)
  const statusKeys = Object.keys(portal.statusLabels.resource);
  const checkActionUrl = (where, a) => {
    if (a.href && !/^#[A-Za-z][\w-]*(\/[\w-]+)?$/.test(a.href)) bad(`${where}: 사이트 안 이동은 '#id' 형식만`);
    if (a.url && !allowedExternal(a.url)) bad(`${where}: 확인되지 않은 외부 주소 ${a.url}`);
    if (a.source) ref(where, a.source);
    if (!a.href && !a.url && !a.source) bad(`${where}: href|url|source 중 하나 필요`);
  };
  const html = fs.readFileSync(path.join(SRC_DIR, 'index.html'), 'utf8');
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
    (r.actions || []).forEach((a, i) => { checkActionUrl(`${where} 행동 ${i + 1}`, a); if (a.href && !html.includes(`id="${a.href.slice(1)}"`)) bad(`${where}: 이동할 구역 ${a.href} 없음`); });
    if (r.intro) ref(`${where} intro`, r.intro);
    (r.steps || []).forEach((st, i) => { ref(`${where} 단계 ${i + 1}`, st.source); if (!areaIds.has(st.area)) bad(`${where} 단계 ${i + 1}: 없는 영역`); });
  }
  const ex = portal.resources.find((r) => r.kind === 'example');
  const exOrder = ['todo-req', 'todo-spec', 'todo-acc', 'todo-test', 'todo-impl'];
  if (!ex || ex.steps.map((s) => s.source).join() !== exOrder.join()) bad('예제: 요구사항→명세→인수조건→테스트→구현 원본 순서여야 함');
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
  for (const s of APPROVED_COPY) if (!html.includes(s)) bad(`index.html: 승인 문구 누락 — ${s}`);
  const visibleHtml = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
  for (const re of INTERNAL_TERMS) if (re.test(visibleHtml)) bad(`index.html: 홈 화면에 내부 용어 ${re}`);
  const texts = {
    'data/portal.json': fs.readFileSync(path.join(dataDir, 'portal.json'), 'utf8'),
    'src/index.html': html,
    'src/app.js': fs.readFileSync(path.join(SRC_DIR, 'app.js'), 'utf8'),
    'src/lib.js': fs.readFileSync(path.join(SRC_DIR, 'lib.js'), 'utf8')
  };
  for (const [name, text] of Object.entries(texts)) {
    for (const re of FORBIDDEN_CLAIMS) if (re.test(text)) bad(`${name}: 금지 표현 ${re}`);
    let scrub = text;
    for (const ok of PERCENT_ALLOWED) scrub = scrub.split(ok).join('');
    if (/\d+\s*%/.test(scrub)) bad(`${name}: 근거 없는 백분율 표현`);
    if (name.endsWith('.js')) for (const re of TRACKING) if (re.test(text)) bad(`${name}: 저장·추적 API 사용 금지 ${re}`);
  }

  // 6) 외부 자산·상대 경로
  const css = fs.readFileSync(path.join(SRC_DIR, 'styles.css'), 'utf8');
  for (const r of assetRefs(html)) {
    if (/^(https?:)?\/\//i.test(r.value) || r.value.startsWith('/') || r.value.startsWith('data:')) bad(`index.html: 외부·절대 자산 참조 금지 — ${r.value}`);
    else if (!fs.existsSync(path.join(siteDir, r.value.startsWith('data/') ? r.value : path.join('src', r.value)))) bad(`index.html: 없는 자산 ${r.value}`);
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
    if (href.startsWith('/') || /^[a-z]+:/i.test(href)) bad(`index.html: 허용되지 않는 링크 — ${href}`);
    else if (!fs.existsSync(path.join(siteDir, href.startsWith('data/') ? href : path.join('src', href)))) bad(`index.html: 없는 내부 링크 ${href}`);
  }
  if (/@import|url\(\s*['"]?(https?:)?\/\//i.test(css)) bad('styles.css: 외부 import/url 금지');
  if (/fonts\.googleapis|fonts\.gstatic|cdn\.|unpkg|jsdelivr/i.test(html + css + texts['src/app.js'])) bad('외부 폰트·CDN 참조 금지');
  if (/https?:\/\//.test(texts['src/lib.js'])) bad('lib.js: 외부 URL 금지');
  for (const u of texts['src/app.js'].match(/https?:\/\/[^'"\s)]+/g) || []) {
    if (!allowedExternal(u) && u !== 'http://www.w3.org/2000/svg') bad(`app.js: 허용되지 않은 URL ${u}`);
  }
  if (/fetch\(\s*['"]\//.test(texts['src/app.js'])) bad('app.js: 절대 경로 fetch 금지');

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
  }

  // 8) 산출물 허용 목록
  if (dist) {
    if (!fs.existsSync(dist)) bad(`dist 없음: ${dist} (먼저 build)`);
    else {
      const files = listFiles(dist);
      const extra = files.filter((f) => !DIST_ALLOWLIST.includes(f));
      const missing = DIST_ALLOWLIST.filter((f) => !files.includes(f));
      if (extra.length) bad(`dist: 허용 목록 밖 파일 ${extra.join(', ')}`);
      if (missing.length) bad(`dist: 누락 ${missing.join(', ')}`);
      if (files.some((f) => /\.(pdf|pptx|docx|md|ts|feature)$/i.test(f))) bad('dist: 원본 교재·문서 복사 금지');
      for (const f of files) {
        const srcFile = f.startsWith('data/') ? path.join(siteDir, f) : path.join(siteDir, 'src', f);
        if (fs.existsSync(srcFile) && !fs.readFileSync(srcFile).equals(fs.readFileSync(path.join(dist, f)))) bad(`dist: 소스와 다른 파일 ${f} (다시 build)`);
      }
      const distHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
      for (const r of assetRefs(distHtml)) {
        const resolved = new URL(r.value, 'http://127.0.0.1/ai-native-sdlc/');
        if (!resolved.pathname.startsWith('/ai-native-sdlc/')) bad(`dist: 하위 경로 밖으로 해석되는 참조 ${r.value}`);
        else if (!fs.existsSync(path.join(dist, resolved.pathname.slice('/ai-native-sdlc/'.length)))) bad(`dist: 없는 자산 ${r.value}`);
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
