#!/usr/bin/env node
// kosta-ai-lab 학습 로드맵 시험 (Apache-2.0). 외부 테스트 프레임워크 없이 node:assert만 쓴다.
// 사용: node scripts/test.mjs   (임시 폴더는 os.tmpdir() 아래에 만들고 끝나면 지운다)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { REPO_ROOT, SITE_DIR, BASE_PATH, MARKER, build, distAllowlist, listFiles, readJSON, resolveOutDir } from './lib.mjs';
import { collectProblems, parseCsp, visibleStrings, REQUIRED_CSP, COLUMNS } from './check.mjs';
import { createSiteServer, normalizeBase } from './serve.mjs';
import '../src/core.js';

const R = globalThis.KostaRoadmap;
const data = readJSON(path.join(SITE_DIR, 'data', 'roadmap.json'));
const html = fs.readFileSync(path.join(SITE_DIR, 'src', 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(SITE_DIR, 'src', 'app.js'), 'utf8');
const { items, lines } = R.index(data);
const clone = (v) => JSON.parse(JSON.stringify(v));

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const tmpDirs = [];
const tmp = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'kosta-roadmap-')); tmpDirs.push(d); return d; };

/** 데이터를 고친 사본으로 검사를 돌려 문제 목록을 돌려준다. */
const withData = (mutate) => { const d = clone(data); mutate(d); return collectProblems({ overrides: { data: d } }).problems; };
const withHtml = (mutate) => collectProblems({ overrides: { html: mutate(html) } }).problems;
const withApp = (mutate) => collectProblems({ overrides: { js: { 'app.js': mutate(appJs) } } }).problems;
const item = (d, id) => d.items.find((i) => i.id === id);
const caught = (problems, re) => assert.ok(problems.some((p) => re.test(p)), '검사가 잡아야 함: ' + re + '\n  실제: ' + (problems.join(' | ') || '(문제 없음)'));

function request(port, rawPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: rawPath, method }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}
async function withServer(root, base, fn) {
  const server = createSiteServer({ root, base });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try { return await fn(server.address().port); } finally { await new Promise((resolve) => server.close(resolve)); }
}

// ── 계산(core.js) ──
test('자식 목록: 배열이 겹쳐 있어도 요소만 남긴다 (강사별 자료의 묶음, 안내판의 배우는 것)', () => {
  const h3 = { tag: 'h3' }, h4a = { tag: 'h4' }, ula = { tag: 'ul' }, h4b = { tag: 'h4' }, ulb = { tag: 'ul' };
  // 강사별 자료: h('div', props, h3, groups.map(g => [h4, ul]))
  assert.deepEqual(R.flatKids([h3, [[h4a, ula], [h4b, ulb]]]), [h3, h4a, ula, h4b, ulb]);
  // 안내판: h('div', props, [p, learn ? [h3, ul] : null, button])
  assert.deepEqual(R.flatKids([['요약', [h3, ula], null, false, '단추']]), ['요약', h3, ula, '단추']);
  assert.ok(R.flatKids([h3, [[h4a, ula]]]).every((c) => !Array.isArray(c)));
});
test('저장소 주소: 공백이 있는 폴더를 인코딩하고, 폴더는 tree, 파일은 blob으로 연다', () => {
  assert.equal(R.repoUrl(data, { path: 'courses/Agentic Coding using Claude Code/README.md', kind: 'file' }),
    'https://github.com/kosta-ai-lab/ai-native-sdlc/blob/main/courses/Agentic%20Coding%20using%20Claude%20Code/README.md');
  assert.equal(R.repoUrl(data, { path: 'modules/06-coding-tdd/sample', kind: 'dir' }), 'https://github.com/kosta-ai-lab/ai-native-sdlc/tree/main/modules/06-coding-tdd/sample');
});
test('단계 상태: 공개 자료가 없으면 soon, 공개 자료를 모두 마치면 done, 준비 중 자료는 세지 않는다', () => {
  const dev = lines.get('dev');
  const req = dev.stages.find((s) => s.items.includes('todo'));
  assert.deepEqual(req.items, ['todo', 's03']);
  assert.equal(R.stageState(req, items, new Set()), 'open');
  assert.equal(R.stageState(req, items, new Set(['todo'])), 'done');
  assert.equal(R.stageState(dev.stages.find((s) => s.items.includes('s08')), items, new Set(['s08'])), 'soon');
});
test('마친 자료 수: 로드맵의 공개 자료만 세고, 두 로드맵에 걸친 강의는 양쪽에 반영된다', () => {
  const done = new Set(['vibe', 's01']);
  assert.deepEqual(R.progress(lines.get('start'), items, done), { total: 3, done: 1 });
  assert.deepEqual(R.progress(lines.get('dev'), items, done), { total: 10, done: 1 });
  assert.deepEqual(R.counts(lines.get('dev'), items), { stages: 10, open: 10, soon: 8 });
  assert.deepEqual(R.counts(lines.get('harness'), items), { stages: 8, open: 17, soon: 1 });
});
test('고르기: 단계를 누르면 공개 자료가 먼저, 없으면 준비 중 자료가 열린다', () => {
  const dev = lines.get('dev');
  assert.equal(R.stageEntry(dev.stages[2], items), 'todo');
  assert.equal(R.stageEntry(dev.stages[1], items), 's01');
  assert.equal(R.firstItem(dev, items), 'vibe');
  assert.equal(R.lineOfItem(data, 'vibe').id, 'start');
  assert.equal(R.lineOfItem(data, 'h39').id, 'harness');
  assert.equal(R.shortTitle({ title: '긴 이름', short: '짧은 이름' }), '짧은 이름');
});
test('주소의 #로드맵/자료: 없는 로드맵은 무시하고, 그 로드맵에 없는 자료는 버린다', () => {
  assert.deepEqual(R.parseHash('#dev/sddc', data), { line: 'dev', item: 'sddc' });
  assert.deepEqual(R.parseHash('#dev/golf', data), { line: 'dev', item: undefined });
  assert.deepEqual(R.parseHash('#people', data), {});
  assert.deepEqual(R.parseHash('', data), {});
});

// ── 데이터와 정적 검사 ──
test('정적 검사(check)가 문제 없이 통과한다', () => {
  assert.deepEqual(collectProblems().problems, []);
});
test('로드맵은 세 개이고 노선도 ' + COLUMNS + '칸 안에 놓인다', () => {
  assert.deepEqual(data.lines.map((l) => l.id), ['start', 'dev', 'harness']);
  for (const l of data.lines) assert.ok(l.col + l.stages.length - 1 <= COLUMNS, l.id);
});
test('준비 중 자료 9개는 모두 README가 "(작성 예정)"인 모듈을 가리킨다', () => {
  const soon = data.items.filter((i) => i.kind === 'soon');
  assert.equal(soon.length, 9);
  for (const s of soon) assert.ok(fs.readFileSync(path.join(REPO_ROOT, s.path, 'README.md'), 'utf8').includes('(작성 예정)'), s.id);
});
test('공개 자료의 링크는 모두 저장소에 있는 파일·폴더다', () => {
  for (const it of data.items.filter((i) => i.kind !== 'soon')) {
    for (const k of it.links) {
      const st = fs.statSync(path.join(REPO_ROOT, k.path));
      assert.equal(st.isDirectory() ? 'dir' : 'file', k.kind, it.id + ' ' + k.path);
    }
  }
});
test('check는 잘못된 데이터를 잡아낸다', () => {
  caught(withData((d) => { item(d, 'vibe').links[0].path = 'courses/없는-폴더/slides.pdf'; }), /git이 추적하지 않는 파일/);
  caught(withData((d) => { item(d, 'tdd').links[3].kind = 'file'; }), /git이 추적하지 않는 파일/);
  caught(withData((d) => { d.items.push(clone(item(d, 'vibe'))); }), /자료 id 중복/);
  caught(withData((d) => { d.lines[0].stages[0].items.push('nope'); }), /없는 자료 nope/);
  caught(withData((d) => { d.items.push({ id: 'orphan', kind: 'soon', title: '어디에도 없는 자료', by: '협의 중', path: 'modules/10-security' }); }), /어느 단계에도 놓이지 않은 자료/);
  caught(withData((d) => { item(d, 'vibe').kind = 'video'; }), /알 수 없는 kind/);
  caught(withData((d) => { d.lines[1].col = 5; }), /노선도 11칸을 넘음/);
  caught(withData((d) => { d.lines[1].stages[0].items = ['s01']; }), /환승 표시/);
  caught(withData((d) => { d.lines[2].shape = 'square'; }), /도형이 달라야/);
  caught(withData((d) => { d.lines[0].next.line = 'nowhere'; }), /next는 다른 로드맵/);
  caught(withData((d) => { d.lines[0].stages[0].items = []; }), /자료가 하나도 없음/);
});
test('check는 상태와 만든 사람의 근거가 원문과 다르면 잡아낸다', () => {
  // 본문이 있는 모듈을 준비 중으로 표시
  caught(withData((d) => { item(d, 's03').path = 'modules/06-coding-tdd'; }), /본문이 올라왔다/);
  // 본문이 없는 모듈을 공개 자료로 표시
  caught(withData((d) => { item(d, 'tdd').source = 'modules/03-requirements/README.md'; }), /아직 "\(작성 예정\)"/);
  caught(withData((d) => { item(d, 's02').by = '윤성열'; }), /담당 '윤성열'가 원문/);
  caught(withData((d) => { item(d, 'kiro').by = '홍길동'; d.people[2].groups[0].items = d.people[2].groups[0].items.filter((x) => x !== 'kiro'); d.people.push({ name: '홍길동', groups: [{ label: '가이드', items: ['kiro'] }] }); }), /만든 사람 '홍길동'의 근거/);
  caught(withData((d) => { item(d, 'sddc').title = '스펙 주도 개발'; }), /제목\(또는 원제\)이/);
  caught(withData((d) => { item(d, 'golf').original = 'Golf Scorecard'; }), /제목\(또는 원제\)이/);
});
test('check는 강사별 자료가 만든 사람과 어긋나면 잡아낸다', () => {
  caught(withData((d) => { d.people[0].groups[0].items.push('vibe'); }), /만든 사람은 윤성열|두 번 나옴/);
  caught(withData((d) => { d.people[1].groups[0].items = ['sddc', 'design']; }), /강사별 자료에 빠진 공개 자료: vibe/);
  caught(withData((d) => { d.people[1].groups[1].items.push('s03'); }), /준비 중 자료 s03는 넣지 않음/);
});
test('check는 화면 글의 제작 단계 용어·근거 없는 약속·내부 주소를 잡아낸다', () => {
  caught(withData((d) => { item(d, 'golf').summary = '비용 없이 앱을 만듭니다.'; }), /근거 없이 약속하는 표현/);
  caught(withData((d) => { d.lines[0].stages[0].summary = '아직 초안입니다.'; }), /제작 단계 용어/);
  caught(withHtml((h) => h.replace('자료 이용 방법', '자료 이용 방법 (시안)')), /제작 단계 용어/);
  caught(withApp((s) => s + '\n// http://localhost:3000\n'), /개인·내부 주소|허용하지 않은 주소/);
});
test('갱신 대응: 강의를 하나 더하고 단계에 놓아도 검사를 통과한다', () => {
  const problems = withData((d) => {
    d.items.push({ ...clone(item(d, 'design')), id: 'design2' });
    d.lines[1].stages[4].items.push('design2');
    d.people[1].groups[0].items.push('design2');
  });
  assert.deepEqual(problems, []);
});
test('화면에 나오는 글은 모두 모아진다(검사와 한국어 점검의 대상)', () => {
  const shown = visibleStrings(data);
  for (const s of ['처음 시작하기', 'AI로 첫 앱 만들어 보기', '규칙과 스킬', '이선아 교수', 'SDD 도구 가이드', '교재 PDF']) assert.ok(shown.includes(s), s);
  const paths = new Set(data.items.flatMap((i) => [i.path, i.source, ...(i.links || []).map((k) => k.path)]));
  assert.ok(!shown.some((s) => paths.has(s)), '경로는 화면 글이 아님');
});

// ── 화면 원본 ──
test('check는 화면 원본의 CSP·inline 코드·경로 위반을 잡아낸다', () => {
  caught(withHtml((h) => h.replace("style-src 'self';", "style-src 'self' 'unsafe-inline';")), /CSP: style-src/);
  caught(withHtml((h) => h.replace('</body>', '<script>alert(1)</script></body>')), /inline script 금지/);
  caught(withHtml((h) => h.replace('<p class="hero__p">', '<p class="hero__p" style="color:red">')), /inline style 금지/);
  caught(withHtml((h) => h.replace('href="app.css"', 'href="/app.css"')), /상대 경로가 아닌 자산/);
  caught(withHtml((h) => h.replace('src="core.js" defer', 'src="https://example.com/core.js" defer')), /상대 경로가 아닌 자산|core\.js → app\.js/);
  caught(withHtml((h) => h.replace('id="people-grid"', 'id="people-list"')), /id="people-grid" 없음/);
  caught(withHtml((h) => h.replace(/<noscript>[\s\S]*?<\/noscript>/, '')), /noscript/);
  caught(withHtml((h) => h.replace('blob/main/SECURITY.md', 'blob/main/NOPE.md')), /git이 추적하지 않는 경로/);
  caught(withHtml((h) => h.replace('href="https://github.com/kosta-ai-lab/ai-native-sdlc/issues"', 'href="https://example.com/"')), /허용하지 않은 외부 링크/);
});
test('check는 화면 스크립트의 위험한 API·추적·외부 요청을 잡아낸다', () => {
  caught(withApp((s) => s.replace('e.textContent = v;', 'e.innerHTML = v;')), /문자열을 HTML이나 코드로 실행하는 API/);
  caught(withApp((s) => s + '\nsessionStorage.setItem("a", "b");\n'), /추적·외부 전송 API/);
  caught(withApp((s) => s + '\nfetch("https://example.com/collect");\n'), /허용하지 않은 주소|fetch는 로드맵 데이터를 읽는 한 번만/);
  caught(withApp((s) => s + '\nlocalStorage.setItem("visits", "1");\n'), /localStorage는 마친 자료 표시/);
  caught(withApp((s) => s.replace("new URL('data/roadmap.json', document.baseURI)", "'/data/roadmap.json'")), /절대 경로 fetch 금지|데이터는 fetch/);
});
test('meta CSP 정책: 같은 출처의 스크립트·스타일·글꼴·데이터만 허용한다', () => {
  const m = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/.exec(html);
  assert.ok(m);
  assert.deepEqual(parseCsp(m[1]), REQUIRED_CSP);
  assert.ok(html.indexOf(m[0]) < html.search(/<(link|script)\b/));
});

// ── 빌드 출력 ──
test('출력 위치: 위험한 경로를 거부한다', () => {
  for (const bad of ['/', os.homedir(), REPO_ROOT, path.dirname(REPO_ROOT), SITE_DIR, path.join(REPO_ROOT, 'courses')]) {
    assert.throws(() => resolveOutDir(bad), (e) => e.code === 'EOUTDIR', bad);
  }
  const foreign = tmp();
  fs.writeFileSync(path.join(foreign, 'keep.txt'), 'x');
  assert.throws(() => resolveOutDir(foreign), (e) => e.code === 'EOUTDIR');
});
test('빌드: 허용 목록의 파일만 원본과 같은 바이트로 복사하고, 다시 빌드해도 같다', () => {
  const out = path.join(tmp(), 'dist');
  const first = build(out);
  assert.deepEqual(listFiles(out), distAllowlist());
  assert.ok(first.files.includes('fonts/OFL.txt') && first.files.includes('data/roadmap.json'));
  const snapshot = () => listFiles(out).map((f) => f + ':' + fs.readFileSync(path.join(out, f)).toString('base64').length);
  const before = snapshot();
  build(out);
  assert.deepEqual(snapshot(), before);
  assert.deepEqual(collectProblems({ dist: out }).problems, []);
  assert.ok(!/\/Users\/|\/home\//.test(fs.readFileSync(path.join(out, MARKER), 'utf8')));
});
test('빌드: 빌드가 만들지 않은 파일이 있으면 아무것도 지우지 않고 멈춘다', () => {
  const out = path.join(tmp(), 'dist');
  build(out);
  fs.writeFileSync(path.join(out, 'notes.md'), '남의 파일');
  assert.throws(() => build(out), (e) => e.code === 'EOUTDIR');
  assert.ok(fs.existsSync(path.join(out, 'notes.md')) && fs.existsSync(path.join(out, 'index.html')));
  caught(collectProblems({ dist: out }).problems, /허용 목록 밖 파일 notes\.md/);
});
test('check --dist는 원본과 달라진 산출물을 잡아낸다', () => {
  const out = path.join(tmp(), 'dist');
  build(out);
  fs.appendFileSync(path.join(out, 'app.js'), '\n// 고침\n');
  caught(collectProblems({ dist: out }).problems, /원본과 다른 파일 app\.js/);
});

// ── 미리보기 서버 ──
test('서버: 하위 경로와 루트 양쪽에서 화면·데이터·글꼴을 주고, 그 밖의 파일은 주지 않는다', async () => {
  const out = path.join(tmp(), 'dist');
  build(out);
  await withServer(out, BASE_PATH, async (port) => {
    assert.equal((await request(port, '/')).status, 302);
    const page = await request(port, BASE_PATH);
    assert.equal(page.status, 200);
    assert.match(page.headers['content-type'], /text\/html/);
    assert.ok(page.body.toString('utf8').includes('<title>'));
    assert.equal((await request(port, BASE_PATH + 'data/roadmap.json')).status, 200);
    const font = await request(port, BASE_PATH + 'fonts/roadmap-sans-400-core.woff2');
    assert.equal(font.status, 200);
    assert.equal(font.headers['content-type'], 'font/woff2');
    assert.equal((await request(port, BASE_PATH + MARKER)).status, 404);
    assert.equal((await request(port, BASE_PATH + '../package.json')).status, 404);
    assert.equal((await request(port, BASE_PATH + 'index.html', 'POST')).status, 405);
  });
  await withServer(out, '/', async (port) => {
    assert.equal((await request(port, '/')).status, 200);
    assert.equal((await request(port, '/app.css')).status, 200);
  });
  assert.equal(normalizeBase('ai-native-sdlc'), '/ai-native-sdlc/');
  assert.throws(() => normalizeBase('/a/../b/'));
  assert.throws(() => createSiteServer({ root: tmp(), base: '/' }), /표식이 없습니다/);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log('test: ✓ ' + name);
  } catch (err) {
    failed += 1;
    console.error('test: ✗ ' + name + '\n      ' + String(err && err.message ? err.message : err).split('\n').join('\n      '));
  }
}
for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
console.log(`test: ${tests.length - failed}/${tests.length} 통과`);
if (failed) process.exit(1);
