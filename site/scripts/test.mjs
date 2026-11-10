#!/usr/bin/env node
// kosta-ai-lab 포털 데이터·빌드·서버 테스트 (Apache-2.0). 외부 테스트 프레임워크 없이 node:assert로 실행한다.
// 사용: node scripts/test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import vm from 'node:vm';
import {
  SITE_DIR, REPO_ROOT, SRC_DIR, DATA_DIR, DIST_ALLOWLIST, MARKER, BASE_PATH,
  readJSON, repoUrl, resolveOutDir, build, listFiles, assetRefs
} from './lib.mjs';
import { collectProblems } from './check.mjs';
import { createSiteServer } from './serve.mjs';

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'portal-site-test-'));
const portal = readJSON(path.join(DATA_DIR, 'portal.json'));
const sourcesDoc = readJSON(path.join(DATA_DIR, 'sources.json'));
const sources = new Map(sourcesDoc.sources.map((s) => [s.id, s]));
const clone = (v) => JSON.parse(JSON.stringify(v));
const plain = (v) => JSON.parse(JSON.stringify(v)); // vm 컨텍스트 객체를 비교 가능한 값으로

function loadLib() {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.runInNewContext(fs.readFileSync(path.join(SRC_DIR, 'lib.js'), 'utf8'), sandbox, { filename: 'lib.js' });
  return sandbox.LearningSite;
}
const L = loadLib();

function request(port, rawPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: rawPath, method }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
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
const expectProblem = (problems, needle) =>
  assert.ok(problems.some((p) => p.includes(needle)), `기대한 검출 없음: ${needle}\n${problems.join('\n')}`);

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
  expectProblem(tamperedProblems((d) => { d.topics.find((t) => t.id === 'requirements').availability = 'preparing'; }), "'준비 중'으로 표시됨");
  expectProblem(tamperedProblems((d) => { const t = d.topics.find((x) => x.id === 'object'); t.related = []; }), "'공개 자료 있음'인데");
  expectProblem(tamperedProblems((d) => { d.topics.find((t) => t.id === 'bdd').modulePending = false; }), 'modulePending=false');
  expectProblem(tamperedProblems((d) => { d.topics.find((t) => t.id === 'tdd').modulePending = true; }), 'modulePending=true');
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
  expectProblem(tamperedProblems((d, s) => { s.sources.find((x) => x.id === 'todo-req').path = 'samples/missing.md'; }), 'git 추적 파일 아님');
});

// ── 데이터 ──
test('로드맵은 승인된 큰 영역 5개와 확장 주제 2개이며, 이전 #stage 링크가 모두 영역으로 이어진다', () => {
  assert.deepEqual(portal.areas.map((a) => a.title), ['문제·요구사항', '명세·설계', 'AI와 구현', '테스트·검증', '배포·운영']);
  assert.deepEqual(portal.extensions.map((x) => x.title), ['에이전트 하니스', '임베디드']);
  for (let i = 1; i <= 10; i++) {
    const id = String(i).padStart(2, '0');
    const t = L.resolveTarget(portal, L.parseHash('#stage/' + id));
    assert.equal(t && t.kind, 'area', id);
  }
  assert.equal(L.resolveTarget(portal, L.parseHash('#stage/04')).id, 'spec');
  assert.equal(L.resolveTarget(portal, L.parseHash('#stage/06')).id, 'build');
  assert.deepEqual(plain(L.resolveTarget(portal, L.parseHash('#stage/harness'))), { kind: 'ext', id: 'harness' });
});

test('제공 상태: 연결된 실제 자료가 있는 주제만 공개 자료 있음, 모듈 원문 상태는 따로 유지', () => {
  const all = [...portal.topics, ...portal.extensions];
  const available = all.filter((t) => t.availability === 'available').map((t) => t.id).sort();
  assert.deepEqual(available, ['bdd', 'harness', 'object', 'requirements', 'rules', 'sdd', 'tdd']);
  const preparing = all.filter((t) => t.availability === 'preparing').map((t) => t.id).sort();
  assert.deepEqual(preparing, ['business', 'cd', 'ci', 'embedded', 'security', 'semantic']);
  for (const id of ['requirements', 'object', 'bdd']) {
    const t = all.find((x) => x.id === id);
    assert.equal(t.sourceStatus, '초안', id);
    assert.equal(t.modulePending, true, id);
    assert.ok(t.related.length > 0, id);
  }
  for (const t of all.filter((x) => x.availability === 'preparing')) assert.equal(t.related.length, 0, t.id);
});

test('운영 중 표시는 확인 기록이 필요하고, 외부 주소는 정적 검사를 통과한다', () => {
  for (const r of portal.resources.filter((r) => r.status === 'operating')) {
    assert.ok(r.verified?.date && r.verified?.url, r.id);
  }
  assert.deepEqual(collectProblems().problems, []);
});

test('예제는 할 일 예제 원본 5개를 순서대로 잇는다', () => {
  const ex = portal.resources.find((r) => r.kind === 'example');
  assert.deepEqual(ex.steps.map((s) => sources.get(s.source).path), [
    'samples/web-task-system/docs/03-requirements.md',
    'samples/web-task-system/docs/04-spec.md',
    'samples/web-task-system/docs/05-acceptance.feature',
    'samples/web-task-system/test/todo.test.ts',
    'samples/web-task-system/src/todo.ts'
  ]);
});

test('공개 강의는 견본을 포함하지 않고 실제 원본·교재 PDF에 연결된다', () => {
  assert.ok(portal.courses.length > 0);
  for (const c of portal.courses) {
    const paths = c.links.map((l) => sources.get(l.source).path);
    assert.ok(paths.every((p) => !p.includes('_sample-course')), c.id);
    assert.ok(paths.some((p) => p.endsWith('.pdf')), c.id);
  }
});

test('영역에 연결된 자료는 항목의 areas에서 계산된다 (명세·설계)', () => {
  const expected = [...portal.resources, ...portal.courses].filter((x) => (x.areas || []).includes('spec')).map((x) => x.id);
  assert.deepEqual(plain(L.relatedItems(portal, 'spec').map((x) => x.id)), expected);
  assert.deepEqual(plain(L.topicsFor(portal, 'spec').map((t) => t.id)), ['sdd', 'object']);
  assert.deepEqual(plain(L.extensionsFor(portal, 'build').map((x) => x.id)), ['harness', 'embedded']);
});

test('갱신 대응: 강의 항목 하나만 추가해도 영역 연결이 함께 반영된다', () => {
  const data = clone(portal);
  data.courses.push({ id: 'new-course', kind: 'course', title: '새 강의', areas: ['deploy'], links: [] });
  const ids = plain(L.relatedItems(data, 'deploy').map((x) => x.id));
  assert.ok(ids.includes('new-course'));
  assert.ok(!plain(L.relatedItems(data, 'spec').map((x) => x.id)).includes('new-course'));
});

test('갱신 대응: 유효한 추가 강의는 개수 제한 없이 정적 검사를 통과한다', () => {
  // 기존 원본을 재사용하는 검사용 항목이다. 공개 데이터에는 추가하지 않는다.
  const problems = tamperedProblems((d) => {
    const extra = clone(d.courses[0]);
    extra.id = 'regression-extra-course';
    d.courses.push(extra);
  });
  assert.deepEqual(problems, []);
  expectProblem(tamperedProblems((d) => { d.courses.push(clone(d.courses[0])); }), '중복 id');
});

// ── lib.js 순수 함수 ──
test('해시를 해석한다 (새 형식·이전 형식·잘못된 값)', () => {
  assert.deepEqual(plain(L.parseHash('#area/spec')), { type: 'area', id: 'spec' });
  assert.deepEqual(plain(L.resolveTarget(portal, L.parseHash('#topic/tdd'))), { kind: 'area', id: 'verify', topic: 'tdd' });
  assert.deepEqual(plain(L.resolveTarget(portal, L.parseHash('#path/todo'))), { kind: 'anchor', id: 'example' });
  assert.deepEqual(plain(L.resolveTarget(portal, L.parseHash('#courses'))), { kind: 'anchor', id: 'courses' });
  assert.equal(L.resolveTarget(portal, L.parseHash('#area/none')), null);
  assert.equal(L.resolveTarget(portal, L.parseHash('#stage/11')), null);
  assert.equal(L.parseHash('#stage/<script>'), null);
  assert.equal(L.parseHash('#%E0%A4%A'), null);
  assert.equal(L.nodeHash('ext', 'harness'), '#ext/harness');
  assert.equal(L.nodeHash('area', 'spec'), '#area/spec');
});

test('레일·가지선 경로', () => {
  assert.equal(L.railPath({ x: 10, y: 20 }, { x: 110, y: 20 }), 'M10 20L110 20');
  assert.equal(L.railPath({ x: 10, y: 20 }, { x: 10, y: 120 }), 'M10 20L10 120');
  assert.deepEqual(plain(L.railPoints({ x: 900, y: 20 }, { x: 40, y: 220 }, { xRight: 980, yMid: 190 }).map((p) => [p.x, p.y])),
    [[900, 20], [980, 20], [980, 190], [40, 190], [40, 220]]);
  assert.deepEqual(plain(L.branchPoints({ x: 500, y: 200 }, { x: 460, y: 300 }, 250).map((p) => [p.x, p.y])),
    [[500, 200], [500, 250], [460, 250], [460, 300]]);
  assert.match(L.roundedPath(L.branchPoints({ x: 500, y: 200 }, { x: 460, y: 300 }, 250), 10), /^M500 200L500 240Q500 250 490 250/);
  assert.equal(L.isNearSegment({ from: 'build', to: 'harness' }, 'harness'), true);
});

test('상태 라벨과 원본 유형 라벨', () => {
  assert.equal(L.statusLabel(portal, 'topic', 'available'), '공개 자료 있음');
  assert.equal(L.statusLabel(portal, 'topic', 'preparing'), '준비 중');
  assert.equal(L.statusLabel(portal, 'resource', 'available'), '공개됨');
  for (const s of sourcesDoc.sources) assert.notEqual(L.typeLabel(s.type), '자료', s.type);
});

// ── 빌드 출력 경로 안전성 ──
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

test('빌드는 허용 목록만 출력하고, 다시 빌드할 때 자기 파일만 정리한다', () => {
  const out = path.join(tmpRoot, 'review', 'dist');
  build(out);
  assert.deepEqual(listFiles(out), DIST_ALLOWLIST);
  build(out);
  assert.deepEqual(listFiles(out), DIST_ALLOWLIST);
  fs.writeFileSync(path.join(out, 'stray.txt'), 'x');
  assert.throws(() => build(out), { code: 'EOUTDIR' });
  assert.deepEqual(listFiles(out), [...DIST_ALLOWLIST, 'stray.txt'].sort(), '중단할 때 기존 빌드 파일도 지우지 않는다');
  fs.unlinkSync(path.join(out, 'stray.txt'));
  assert.deepEqual(collectProblems({ dist: out }).problems, []);
});

test('이전 빌드 표식의 옛 파일은 정리하고, 위험한 표식 항목은 따르지 않는다', () => {
  const out = path.join(tmpRoot, 'legacy-dist');
  build(out);
  fs.writeFileSync(path.join(out, 'data', 'learning.json'), '{}');
  const outside = path.join(tmpRoot, 'outside.json');
  fs.writeFileSync(outside, 'keep');
  const marker = JSON.parse(fs.readFileSync(path.join(out, MARKER), 'utf8'));
  marker.files.push('data/learning.json', '../outside.json', '/etc/hosts');
  fs.writeFileSync(path.join(out, MARKER), JSON.stringify(marker));
  build(out);
  assert.deepEqual(listFiles(out), DIST_ALLOWLIST);
  assert.equal(fs.readFileSync(outside, 'utf8'), 'keep');
});

test('index.html 자산 참조는 모두 상대 경로라 하위 경로 안에서 해석된다', () => {
  const refs = assetRefs(fs.readFileSync(path.join(SRC_DIR, 'index.html'), 'utf8'));
  assert.ok(refs.length >= 4);
  for (const r of refs) assert.ok(new URL(r.value, `http://127.0.0.1${BASE_PATH}`).pathname.startsWith(BASE_PATH), r.value);
});

// ── 미리보기 서버 ──
test('서버는 빌드 표식 없는 폴더(저장소 루트)를 제공하지 않는다', () => {
  assert.throws(() => createSiteServer({ root: REPO_ROOT }), /표식/);
});

test('서버: /ai-native-sdlc/ 하위 경로, 리다이렉트, 차단 경로', async () => {
  const out = path.join(tmpRoot, 'review', 'dist');
  const server = createSiteServer({ root: out });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  try {
    let res = await request(port, '/');
    assert.equal(res.status, 302); assert.equal(res.headers.location, BASE_PATH);
    res = await request(port, '/ai-native-sdlc');
    assert.equal(res.status, 301); assert.equal(res.headers.location, BASE_PATH);
    res = await request(port, BASE_PATH);
    assert.equal(res.status, 200); assert.match(res.headers['content-type'], /text\/html/);
    assert.match(res.body, /AI와 함께 만드는 소프트웨어,/);
    for (const [p, type] of [['styles.css', /text\/css/], ['lib.js', /javascript/], ['app.js', /javascript/], ['favicon.svg', /svg/], ['data/portal.json', /json/], ['data/sources.json', /json/]]) {
      res = await request(port, BASE_PATH + p);
      assert.equal(res.status, 200, p); assert.match(res.headers['content-type'], type, p);
    }
    assert.equal(JSON.parse((await request(port, BASE_PATH + 'data/portal.json')).body).areas.length, 5);
    for (const p of ['/other', '/ai-native-sdlc/data/learning.json', '/ai-native-sdlc/%2e%2e/package.json', '/ai-native-sdlc/..%2fscripts%2fbuild.mjs', `/ai-native-sdlc/${MARKER}`, '/ai-native-sdlc/.nojekyll']) {
      res = await request(port, p);
      assert.equal(res.status, 404, p);
    }
    assert.equal((await request(port, BASE_PATH, 'POST')).status, 405);
  } finally {
    await new Promise((r) => server.close(r));
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
