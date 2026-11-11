#!/usr/bin/env node
// kosta-ai-lab 포털 데이터·빌드·서버·동작 테스트 (Apache-2.0). 외부 테스트 프레임워크 없이 node:assert로 실행한다.
// 사용: node scripts/test.mjs   (임시 폴더는 os.tmpdir() = TMPDIR 아래에 만들고 끝나면 지운다)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {
  SITE_DIR, REPO_ROOT, SRC_DIR, DATA_DIR, MARKER, BASE_PATH, SRC_FILES,
  readJSON, repoUrl, resolveOutDir, build, listFiles, assetRefs, distAllowlist, copyPlan
} from './lib.mjs';
import { collectProblems, parseCsp, isRelativeRef, REQUIRED_CSP, SERVE_BASES } from './check.mjs';
import { createSiteServer, normalizeBase } from './serve.mjs';
import { runBehavior } from './behavior.mjs';

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-site-test-'));
const portal = readJSON(path.join(DATA_DIR, 'portal.json'));
const sourcesDoc = readJSON(path.join(DATA_DIR, 'sources.json'));
const sources = new Map(sourcesDoc.sources.map((s) => [s.id, s]));
const clone = (v) => JSON.parse(JSON.stringify(v));

function request(port, rawPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: rawPath, method }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => { const buf = Buffer.concat(chunks); resolve({ status: res.statusCode, headers: res.headers, body: buf.toString('utf8'), buf }); });
    });
    req.on('error', reject);
    req.end();
  });
}
async function withServer(root, base, fn) {
  const server = createSiteServer({ root, base });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try { return await fn(server.address().port); } finally { await new Promise((r) => server.close(r)); }
}

function tamperedProblems(mutate) {
  const dir = fs.mkdtempSync(path.join(tmpRoot, 'tampered-'));
  const src = clone(sourcesDoc);
  const data = clone(portal);
  mutate(data, src);
  fs.writeFileSync(path.join(dir, 'sources.json'), JSON.stringify(src));
  fs.writeFileSync(path.join(dir, 'portal.json'), JSON.stringify(data));
  return collectProblems({ dataDir: dir }).problems;
}
/** 화면 원본(src)을 임시 폴더에 복사해 바꾼 뒤 검사한다. 실제 src는 건드리지 않는다. */
function tamperedSrcProblems(file, mutate) {
  const dir = fs.mkdtempSync(path.join(tmpRoot, 'src-'));
  for (const n of SRC_FILES) fs.copyFileSync(path.join(SRC_DIR, n), path.join(dir, n));
  const p = path.join(dir, file);
  const before = fs.readFileSync(p, 'utf8');
  const after = mutate(before);
  assert.notEqual(after, before, `변조가 적용되지 않음: ${file}`);
  fs.writeFileSync(p, after);
  return collectProblems({ srcDir: dir }).problems;
}
const expectProblem = (problems, needle) =>
  assert.ok(problems.some((p) => p.includes(needle)), `기대한 검출 없음: ${needle}\n${problems.join('\n')}`);
const behaviorOk = (res) => {
  const failed = res.filter((r) => !r.ok);
  assert.deepEqual(failed.map((r) => `${r.name} — ${JSON.stringify(r.detail)}`), []);
  assert.ok(res.length >= 50, `동작 검사 수 ${res.length}`);
};

// ── 링크와 manifest ──
test('공백이 있는 강의 폴더를 URL 인코딩한다', () => {
  assert.equal(
    repoUrl('courses/Agentic Coding using Claude Code/README.md'),
    'https://github.com/kosta-ai-lab/ai-native-sdlc/blob/main/courses/Agentic%20Coding%20using%20Claude%20Code/README.md'
  );
  assert.equal(repoUrl('modules/04-sdd', 'dir'), 'https://github.com/kosta-ai-lab/ai-native-sdlc/tree/main/modules/04-sdd');
});

test('manifest URL은 경로에서 계산한 값과 같고, Agentic 강의는 실제 폴더로 연결한다', () => {
  for (const s of sourcesDoc.sources) assert.equal(s.url, repoUrl(s.path, s.kind), s.id);
  assert.equal(sources.get('c-agentic').path, 'courses/Agentic Coding using Claude Code/README.md');
  assert.ok(!sourcesDoc.sources.some((x) => x.path.includes('agentic-coding-using-claude-code')));
});

test('정적 검사(check)가 문제 없이 통과한다', () => {
  assert.deepEqual(collectProblems().problems, []);
});

test('check는 변조된 포털 데이터를 잡아낸다', () => {
  expectProblem(tamperedProblems((d) => { d.topics.find((t) => t.id === 'business').availability = 'available'; }), "'공개 자료 있음'인데");
  expectProblem(tamperedProblems((d) => { d.topics.find((t) => t.id === 'sdd').availability = 'preparing'; }), "'준비 중'으로 표시됨");
  expectProblem(tamperedProblems((d) => { const t = d.topics.find((x) => x.id === 'object'); t.related = []; }), "'공개 자료 있음'인데");
  expectProblem(tamperedProblems((d) => { d.topics.find((t) => t.id === 'bdd').modulePending = false; }), 'modulePending=false');
  expectProblem(tamperedProblems((d) => { d.topics.find((t) => t.id === 'requirements').owner = '홍길동'; }), "담당 '홍길동'");
  expectProblem(tamperedProblems((d) => { d.topics[0].area = 'nowhere'; }), '없는 영역 nowhere');
  expectProblem(tamperedProblems((d) => { d.areas[1].title = '설계'; }), '승인된 큰 영역');
  expectProblem(tamperedProblems((d) => { d.areas[0].prerequisites = ['spec']; }), '선후관계');
  expectProblem(tamperedProblems((d) => { d.areas[0].legacyStages = ['02', '03']; }), '#stage/01');
  expectProblem(tamperedProblems((d) => { d.resources.push({ id: 'svc', kind: 'service', title: '가짜 서비스', type: '서비스', status: 'operating', summary: 'x', actions: [{ label: '열기', url: 'https://example.com' }] }); }), "'운영 중' 표시 금지");
  expectProblem(tamperedProblems((d) => { d.resources[0].actions[1].url = 'https://example.com/'; }), '확인되지 않은 외부 주소');
  expectProblem(tamperedProblems((d) => { d.courses[0].title = '없는 강의 이름'; }), 'README.md 강의 목록에 없음');
  expectProblem(tamperedProblems((d) => { d.courses[1].links.push({ label: '견본', source: 'sample-course' }); }), '_sample-course를 강의로 연결하면 안 됨');
  expectProblem(tamperedProblems((d) => { d.areas[2].summary += ' 진행률을 보여 줍니다.'; }), '금지 표현');
  expectProblem(tamperedProblems((d) => { d.extensions = d.extensions.filter((x) => x.id !== 'harness'); }), '에이전트 하니스와 임베디드');
  expectProblem(tamperedProblems((d) => { const ex = d.resources.find((r) => r.kind === 'example'); ex.steps.reverse(); }), '원본 순서');
  expectProblem(tamperedProblems((d) => { d.areas[0].summary += ' 통합 시안'; }), '검토용 흔적');
  expectProblem(tamperedProblems((d, s) => { s.note = '/Users/someone/work'; }), '개인·내부 경로');
  expectProblem(tamperedProblems((d, s) => { s.sources.find((x) => x.id === 'todo-req').path = 'samples/missing.md'; }), 'git 추적 파일 아님');
});

test('check는 화면 원본의 검토 흔적·CSP·메타·경로 위반을 잡아낸다', () => {
  const html = 'index.html';
  expectProblem(tamperedSrcProblems(html, (t) => t.replace('</title>', ' · 통합 시안(제안)</title>')), 'title은 승인 문구');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace('</ol>\n      </nav>', '</ol>\n        <a class="toc__compare" href="../designs-v2/index.html">시안 비교로</a>\n      </nav>')), '검토용 흔적');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace('<meta name="color-scheme"', '<meta name="robots" content="noindex">\n  <meta name="color-scheme"')), 'noindex');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace(/  <meta http-equiv="Content-Security-Policy"[^\n]*\n/, '')), 'meta CSP는 정확히 1개');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace("form-action 'none'", "form-action 'none'; frame-ancestors 'none'")), 'frame-ancestors');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")), 'script-src');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace("connect-src 'self'", "connect-src 'self' https:")), 'connect-src');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace(/(  <meta http-equiv="Content-Security-Policy"[^\n]*\n)([\s\S]*?)(  <link rel="stylesheet" href="story.css">\n)/, '$2$3$1')), 'link/script보다 먼저');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace('</head>', '<script>1</script>\n</head>')), 'inline script');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace('<a class="jump" href="#materials">', '<a class="jump" href="#materials" onclick="x()">')), '이벤트 속성');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace('href="story.css"', 'href="/story.css"')), '상대 경로가 아닌 자산');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace('href="layers.css"', 'href="../designs-integrated/layers.css"')), '상대 경로가 아닌 자산');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace('<meta name="twitter:card"', '<link rel="canonical" href="https://github.com/kosta-ai-lab">\n  <meta name="twitter:card"')), 'canonical');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace('<script src="layers.js" defer></script>\n  <script src="story.js" defer></script>', '<script src="story.js" defer></script>\n  <script src="layers.js" defer></script>')), '스크립트는 motion-core.js');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace('id="area-index"', 'id="area-list"')), 'id="area-index"');
  expectProblem(tamperedSrcProblems(html, (t) => t.replace('로드맵 둘러보기', '로드맵 보기')), '승인 문구 누락');
  expectProblem(tamperedSrcProblems('story.js', (t) => t.replace("new URL('data/' + name, document.baseURI)", "new URL('/data/' + name, document.baseURI)")), '절대 경로 fetch');
  expectProblem(tamperedSrcProblems('layers.js', (t) => t + '\n// /Users/someone/.hermes\n'), '개인·내부 경로');
  expectProblem(tamperedSrcProblems('story.js', (t) => t + "\nvar x = document.body.innerHTML;\n"), 'innerHTML');
  expectProblem(tamperedSrcProblems('story.css', (t) => t + '\n@import url("https://fonts.googleapis.com/css");\n'), '외부 import');
});

test('meta CSP 정책: 같은 출처 스크립트·JSON fetch, 문서 안 SVG, 스타일 unsafe-inline 유지, meta 무시 지시어 없음', () => {
  const html = fs.readFileSync(path.join(SRC_DIR, 'index.html'), 'utf8');
  const m = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/.exec(html);
  assert.ok(m);
  const csp = parseCsp(m[1]);
  assert.deepEqual(csp, REQUIRED_CSP);
  assert.ok(!('frame-ancestors' in csp));
  assert.ok(!csp['script-src'].includes("'unsafe-inline'") && !csp['script-src'].includes("'unsafe-eval'"));
  // 화면 스크립트가 쓰는 동작이 정책 안에 있는지: 데이터는 문서 기준 상대 URL(같은 출처), 스타일은 CSSOM(.style/setProperty)만
  const story = fs.readFileSync(path.join(SRC_DIR, 'story.js'), 'utf8');
  const layers = fs.readFileSync(path.join(SRC_DIR, 'layers.js'), 'utf8');
  assert.match(story, /new URL\('data\/' \+ name, document\.baseURI\)/);
  for (const base of SERVE_BASES) {
    const page = new URL(base + 'index.html', 'https://example.invalid');
    assert.equal(new URL('data/portal.json', page).origin, page.origin);
  }
  assert.ok(!/setAttribute\(\s*['"]style['"]/.test(story + layers));
  assert.ok(/createElementNS\(/.test(story), '무대 SVG는 문서 안에서 만든다');
});

// ── 데이터 ──
test('로드맵은 승인된 큰 영역 5개와 확장 주제(하니스·임베디드)를 포함하고, 이전 #stage 링크가 모두 영역으로 이어진다', () => {
  assert.deepEqual(portal.areas.map((a) => a.title), ['문제·요구사항', '명세·설계', 'AI와 구현', '테스트·검증', '배포·운영']);
  for (const t of ['에이전트 하니스', '임베디드']) assert.ok(portal.extensions.some((x) => x.title === t), t);
  const stages = portal.areas.flatMap((a) => a.legacyStages || []);
  for (let i = 1; i <= 10; i++) assert.ok(stages.includes(String(i).padStart(2, '0')), i);
});

test('제공 상태: 준비 중 주제에는 연결 자료가 없고, 모듈 원문 상태는 따로 유지한다', () => {
  const all = [...portal.topics, ...portal.extensions];
  for (const t of all) {
    assert.ok(['available', 'preparing'].includes(t.availability), t.id);
    if (t.availability === 'preparing') assert.equal((t.related || []).length, 0, t.id);
    assert.equal(typeof t.modulePending, 'boolean', t.id);
    assert.ok(t.sourceStatus && !/완료|완성/.test(t.sourceStatus), t.id);
  }
});

test('예제는 할 일 예제 원본 5개를 순서대로 잇는다(추가 단계 허용)', () => {
  const ex = portal.resources.find((r) => r.kind === 'example');
  const order = ['samples/web-task-system/docs/03-requirements.md', 'samples/web-task-system/docs/04-spec.md', 'samples/web-task-system/docs/05-acceptance.feature', 'samples/web-task-system/test/todo.test.ts', 'samples/web-task-system/src/todo.ts'];
  assert.deepEqual(ex.steps.map((s) => sources.get(s.source).path).filter((p) => order.includes(p)), order);
});

test('공개 강의는 견본을 포함하지 않고 실제 원본·교재 PDF에 연결된다', () => {
  assert.ok(portal.courses.length > 0);
  for (const c of portal.courses) {
    const paths = c.links.map((l) => sources.get(l.source).path);
    assert.ok(paths.every((p) => !p.includes('_sample-course')), c.id);
    assert.ok(paths.some((p) => p.endsWith('.pdf')), c.id);
  }
});

test('갱신 대응: 유효한 추가 강의·자료는 개수 제한 없이 정적 검사를 통과한다', () => {
  // 기존 원본을 재사용하는 검사용 항목이다. 공개 데이터에는 추가하지 않는다.
  const problems = tamperedProblems((d) => {
    const extra = clone(d.courses[0]);
    extra.id = 'regression-extra-course';
    d.courses.push(extra);
  });
  assert.deepEqual(problems, []);
  expectProblem(tamperedProblems((d) => { d.courses.push(clone(d.courses[0])); }), '중복 id');
});

// ── 화면 동작(최소 DOM·가짜 시계) ──
test('동작 회귀: site/src + site/data, /ai-native-sdlc/ 하위 경로', async () => {
  behaviorOk(await runBehavior());
});

test('동작 회귀: 루트(/) 문서 주소에서도 데이터 경로·동작이 같다', async () => {
  behaviorOk(await runBehavior({ baseURI: 'https://example.invalid/' }));
});

test('갱신 대응: 강의·주제·공개 항목을 하나씩 더해도 화면 수가 데이터를 따라가고 동작이 유지된다', async () => {
  const data = clone(portal);
  const course = clone(data.courses[0]);
  course.id = 'regression-extra-course';
  course.title += ' (검사용)';
  data.courses.push(course);
  const topic = clone(data.topics.find((t) => t.area === 'deploy'));
  topic.id = 'regression-extra-topic';
  topic.title += ' (검사용)';
  data.topics.push(topic);
  const res = clone(data.resources.find((r) => r.kind === 'project'));
  res.id = 'regression-extra-resource';
  res.title += ' (검사용)';
  data.resources.push(res);
  const out = await runBehavior({ json: { 'portal.json': JSON.stringify(data), 'sources.json': JSON.stringify(sourcesDoc) } });
  behaviorOk(out);
  const counts = out.find((r) => r.name.startsWith('DOM: 장면·주제'));
  assert.equal(counts.detail.have.courses, portal.courses.length + 1);
  assert.equal(counts.detail.have.topics, portal.topics.length + 1);
  assert.equal(counts.detail.have.items, portal.resources.length + 1);
});

// ── 빌드 출력 경로 안전성·재현성 ──
test('출력 위치: 위험한 경로를 거부한다', () => {
  const reject = (p, why) => assert.throws(() => resolveOutDir(p, { cwd: SITE_DIR }), { code: 'EOUTDIR' }, why);
  reject('/', '루트');
  reject(os.homedir(), '홈');
  reject(REPO_ROOT, '저장소 루트');
  reject(path.dirname(REPO_ROOT), '저장소 상위');
  reject(SITE_DIR, 'site 자체');
  reject(path.join(SITE_DIR, 'src'), 'src');
  reject(path.join(SITE_DIR, 'data'), 'data');
  reject(path.join(REPO_ROOT, 'modules'), '원본 폴더');
  reject(path.join(REPO_ROOT, 'review-dist'), '저장소 안 임의 폴더');
});

test('출력 위치: site/dist와 저장소 밖 새 폴더는 허용한다', () => {
  assert.equal(resolveOutDir(undefined), path.join(SITE_DIR, 'dist'));
  const fresh = path.join(tmpRoot, 'review', 'dist');
  assert.equal(resolveOutDir(fresh), fresh);
});

test('표식 없는 비어 있지 않은 폴더와 심볼릭 링크는 거부하고 파일을 지우지 않는다', () => {
  const foreign = path.join(tmpRoot, 'foreign');
  fs.mkdirSync(foreign, { recursive: true });
  fs.writeFileSync(path.join(foreign, 'keep.txt'), 'do not delete');
  assert.throws(() => build(foreign), { code: 'EOUTDIR' });
  assert.equal(fs.readFileSync(path.join(foreign, 'keep.txt'), 'utf8'), 'do not delete');
  const target = path.join(tmpRoot, 'link-target');
  const link = path.join(tmpRoot, 'link-out');
  fs.mkdirSync(target);
  fs.symlinkSync(target, link);
  assert.throws(() => build(link), { code: 'EOUTDIR' });
});

test('빌드 계획: 화면 파일 7개 + site/data의 모든 JSON, 옛 UI(app.js·lib.js·styles.css) 없음', () => {
  const plan = copyPlan();
  assert.deepEqual(plan.filter((c) => !c.to.startsWith('data/')).map((c) => c.to).sort(), SRC_FILES.slice().sort());
  const dataJson = fs.readdirSync(DATA_DIR).filter((n) => n.endsWith('.json')).sort();
  assert.deepEqual(plan.filter((c) => c.to.startsWith('data/')).map((c) => c.to.slice(5)), dataJson);
  for (const old of ['app.js', 'lib.js', 'styles.css']) {
    assert.ok(!fs.existsSync(path.join(SRC_DIR, old)), old);
    assert.ok(!distAllowlist().includes(old), old);
  }
});

test('빌드는 허용 목록만 출력하고, 원본과 바이트가 같으며, 두 번 빌드해도 같다(재현성)', () => {
  const a = path.join(tmpRoot, 'review', 'dist');
  const b = path.join(tmpRoot, 'review2', 'dist');
  build(a);
  build(b);
  assert.deepEqual(listFiles(a), distAllowlist());
  for (const f of listFiles(a)) assert.ok(fs.readFileSync(path.join(a, f)).equals(fs.readFileSync(path.join(b, f))), f);
  for (const { from, to } of copyPlan()) assert.ok(fs.readFileSync(path.join(SITE_DIR, from)).equals(fs.readFileSync(path.join(a, to))), to);
  build(a);
  assert.deepEqual(listFiles(a), distAllowlist());
  fs.writeFileSync(path.join(a, 'stray.txt'), 'x');
  assert.throws(() => build(a), { code: 'EOUTDIR' });
  assert.deepEqual(listFiles(a), [...distAllowlist(), 'stray.txt'].sort(), '중단할 때 기존 빌드 파일도 지우지 않는다');
  fs.unlinkSync(path.join(a, 'stray.txt'));
  assert.deepEqual(collectProblems({ dist: a }).problems, []);
});

test('빌드 산출물에서 실행한 동작 회귀도 통과한다', async () => {
  const out = path.join(tmpRoot, 'review', 'dist');
  build(out);
  behaviorOk(await runBehavior({ codeDir: out, dataDir: path.join(out, 'data') }));
});

test('이전 빌드 표식의 옛 파일(app.js 등)은 정리하고, 위험한 표식 항목은 따르지 않는다', () => {
  const out = path.join(tmpRoot, 'legacy-dist');
  build(out);
  for (const old of ['app.js', 'lib.js', 'styles.css', 'data/learning.json']) fs.writeFileSync(path.join(out, old), '/* old */');
  const outside = path.join(tmpRoot, 'outside.json');
  fs.writeFileSync(outside, 'keep');
  const marker = JSON.parse(fs.readFileSync(path.join(out, MARKER), 'utf8'));
  marker.files.push('app.js', 'lib.js', 'styles.css', 'data/learning.json', '../outside.json', '/etc/hosts');
  fs.writeFileSync(path.join(out, MARKER), JSON.stringify(marker));
  build(out);
  assert.deepEqual(listFiles(out), distAllowlist());
  assert.equal(fs.readFileSync(outside, 'utf8'), 'keep');
});

test('dist 검사: 원본과 바이트가 다른 산출물을 잡아낸다', () => {
  const out = path.join(tmpRoot, 'tampered-dist');
  build(out);
  fs.appendFileSync(path.join(out, 'index.html'), '\n<!-- x -->\n');
  expectProblem(collectProblems({ dist: out }).problems, '소스와 다른 파일 index.html');
});

test('index.html 참조는 모두 상대 경로라 /ai-native-sdlc/ 와 / 양쪽에서 같은 출처·base 안으로 해석된다', () => {
  const html = fs.readFileSync(path.join(SRC_DIR, 'index.html'), 'utf8');
  const refs = assetRefs(html);
  assert.ok(refs.length >= 6);
  for (const r of refs) {
    assert.ok(isRelativeRef(r.value), r.value);
    for (const base of SERVE_BASES) assert.ok(new URL(r.value, `https://example.invalid${base}`).pathname.startsWith(base), `${base} ${r.value}`);
  }
  assert.ok(!isRelativeRef('/x.css') && !isRelativeRef('../x.css') && !isRelativeRef('https://x/y') && !isRelativeRef('//x/y') && !isRelativeRef('data:,x'));
});

// ── 미리보기 서버 ──
test('서버는 빌드 표식 없는 폴더(저장소 루트)를 제공하지 않는다', () => {
  assert.throws(() => createSiteServer({ root: REPO_ROOT }), /표식/);
});

test('서버 --base 정규화: 하위 경로·루트 허용, 위험한 값 거부', () => {
  assert.equal(normalizeBase('/ai-native-sdlc/'), '/ai-native-sdlc/');
  assert.equal(normalizeBase('ai-native-sdlc'), '/ai-native-sdlc/');
  assert.equal(normalizeBase('/'), '/');
  for (const bad of ['/../', '/a//b/', '/a b/', '/%2e%2e/']) assert.throws(() => normalizeBase(bad), /base/, bad);
});

test('서버(기본 /ai-native-sdlc/): 하위 경로, 리다이렉트, 차단 경로, CSP 헤더 없음(Pages와 같음)', async () => {
  const out = path.join(tmpRoot, 'review', 'dist');
  build(out);
  await withServer(out, undefined, async (port) => {
    let res = await request(port, '/');
    assert.equal(res.status, 302); assert.equal(res.headers.location, BASE_PATH);
    res = await request(port, '/ai-native-sdlc');
    assert.equal(res.status, 301); assert.equal(res.headers.location, BASE_PATH);
    res = await request(port, BASE_PATH);
    assert.equal(res.status, 200); assert.match(res.headers['content-type'], /text\/html/);
    assert.match(res.body, /AI와 함께 만드는 소프트웨어,/);
    assert.equal(res.headers['content-security-policy'], undefined);
    for (const p of ['/other', '/ai-native-sdlc/app.js', '/ai-native-sdlc/data/learning.json', '/ai-native-sdlc/%2e%2e/package.json', '/ai-native-sdlc/..%2fscripts%2fbuild.mjs', `/ai-native-sdlc/${MARKER}`, '/ai-native-sdlc/.nojekyll', '/designs-integrated/index.html']) {
      res = await request(port, p);
      assert.equal(res.status, 404, p);
    }
    assert.equal((await request(port, BASE_PATH, 'POST')).status, 405);
  });
});

test('서버(--base /): / 에서 바로 index를 주고 자기 자신으로 리다이렉트하지 않는다', async () => {
  const out = path.join(tmpRoot, 'review', 'dist');
  build(out);
  await withServer(out, '/', async (port) => {
    let res = await request(port, '/');
    assert.equal(res.status, 200, '루트는 리다이렉트 없이 200');
    assert.equal(res.headers.location, undefined);
    assert.match(res.body, /AI와 함께 만드는 소프트웨어,/);
    res = await request(port, '/index.html');
    assert.equal(res.status, 200);
    for (const p of ['/ai-native-sdlc/', '/ai-native-sdlc', '/.site-build', '/%2e%2e/package.json']) {
      res = await request(port, p);
      assert.equal(res.status, 404, p);
    }
  });
});

test('서버 두 base 모두: index.html의 모든 자산과 스크립트가 읽는 data/*.json이 상대 경로로 200·올바른 형식', async () => {
  const out = path.join(tmpRoot, 'review', 'dist');
  build(out);
  const types = { css: /text\/css/, js: /javascript/, svg: /image\/svg\+xml/, json: /application\/json/ };
  for (const base of SERVE_BASES) {
    await withServer(out, base, async (port) => {
      const page = new URL(base, `http://127.0.0.1:${port}`);
      const index = await request(port, page.pathname);
      assert.equal(index.status, 200, base);
      const refs = [...assetRefs(index.body).map((r) => r.value), ...listFiles(out).filter((f) => f.startsWith('data/'))];
      for (const ref of refs) {
        const u = new URL(ref, page);
        const res = await request(port, u.pathname);
        assert.equal(res.status, 200, `${base} ${ref}`);
        assert.match(res.headers['content-type'], types[ref.split('.').pop()], ref);
        assert.ok(res.buf.equals(fs.readFileSync(path.join(out, ref))), `${base} ${ref} 바이트`);
      }
      const portalRes = await request(port, new URL('data/portal.json', page).pathname);
      assert.equal(JSON.parse(portalRes.body).areas.length, portal.areas.length);
    });
  }
});

// ── 실행 ──
let failed = 0;
for (const t of tests) {
  try {
    await t.fn();
    console.log(`ok   ${t.name}`);
  } catch (err) {
    failed++;
    console.error(`FAIL ${t.name}\n     ${String(err && err.stack || err).split('\n').slice(0, 8).join('\n     ')}`);
  }
}
fs.rmSync(tmpRoot, { recursive: true, force: true });
console.log(`\ntest: ${tests.length - failed}/${tests.length} 통과`);
process.exit(failed ? 1 : 0);
