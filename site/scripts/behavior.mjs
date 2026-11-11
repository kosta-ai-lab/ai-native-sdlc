#!/usr/bin/env node
// kosta-ai-lab 포털 동작 회귀 (Apache-2.0). Node 내장 모듈만 사용한다. 배포 대상이 아니다.
// 최소 DOM + 가짜 시계(rAF·타이머) + 가짜 history 위에서 실제 화면 스크립트(motion-core.js → layers.js → story.js)를 실행해
//   스크롤 연동, 영역 펼침 시작→중간→끝 기하, 영역 전환, 자료 상세 열기·중첩, Escape/history/초점/스크롤 잠금·복원,
//   빠른 닫기·재열기, resize, 모션 축소, 데이터 오류, 이전 주소 형식을 확인한다.
// 브라우저 모델: Chrome inert 초점 fixup(비관적), history 전환 때 이전 초점(section) 복원(popstate 전·후·늦게).
// 실제 브라우저 렌더·성능·스크린리더를 대신하지 않는다.
// 사용: node scripts/behavior.mjs [--dist [폴더]]   (기본: site/src + site/data, --dist: 빌드 산출물)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { SITE_DIR, DATA_DIR, DEFAULT_OUT, BASE_PATH, isMain } from './lib.mjs';

const SCRIPTS = ['motion-core.js', 'layers.js', 'story.js'];
let CFG = null;
let results = [];
const check = (name, ok, detail) => results.push({ name, ok: !!ok, detail: detail === undefined ? null : detail });

function parseC(s) {
  const c = { tag: null, id: null, cls: [], attrs: [], not: [] };
  s = s.replace(/:not\(([^)]*)\)/g, (_, x) => { c.not.push(x); return ''; });
  const m = /^([a-zA-Z][\w-]*)?/.exec(s);
  if (m[1]) c.tag = m[1].toUpperCase();
  const re = /#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:([\^]?=)"([^"]*)")?\]/g;
  let t;
  while ((t = re.exec(s.slice(m[0].length)))) { if (t[1]) c.id = t[1]; else if (t[2]) c.cls.push(t[2]); else c.attrs.push([t[3], t[4], t[5]]); }
  return c;
}
function mc(n, c) {
  if (!n || !n.isEl) return false;
  if (c.tag && n.tagName !== c.tag) return false;
  if (c.id && n.getAttribute('id') !== c.id) return false;
  if (c.cls.some((x) => !(' ' + (n.getAttribute('class') || '') + ' ').includes(' ' + x + ' '))) return false;
  if (c.not.some((x) => mc(n, parseC(x)))) return false;
  return c.attrs.every(([a, op, v]) => n.hasAttribute(a) && (op === undefined || (op === '=' ? n.getAttribute(a) === v : n.getAttribute(a).startsWith(v))));
}
function matches(n, sel) {
  return sel.split(',').some((one) => {
    const parts = one.trim().split(/\s+/).filter((x) => x !== '>').map(parseC);
    if (!mc(n, parts[parts.length - 1])) return false;
    let cur = n.parent;
    for (let i = parts.length - 2; i >= 0; i--) { while (cur && !mc(cur, parts[i])) cur = cur.parent; if (!cur) return false; cur = cur.parent; }
    return true;
  });
}
let D, W, clock;
class T { constructor(s) { this.data = String(s); this.parent = null; } get textContent() { return this.data; } }
class E {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.isEl = true; this.kids = []; this.parent = null; this.attrs = {}; this.ls = {}; this.style = { setProperty(k, v) { this[k] = v; } }; this.docTop = null; this.h = 400; this.rect = null; this.scrollTop = 0; }
  get children() { return this.kids.filter((k) => k.isEl); }
  get firstChild() { return this.kids[0] || null; }
  get lastChild() { return this.kids[this.kids.length - 1] || null; }
  get parentNode() { return this.parent; }
  get isConnected() { let n = this; while (n.parent) n = n.parent; return n === D.documentElement; }
  appendChild(c) { if (c.parent) c.parent.kids = c.parent.kids.filter((x) => x !== c); this.kids.push(c); c.parent = this; return c; }
  removeChild(c) { this.kids = this.kids.filter((x) => x !== c); c.parent = null; return c; }
  contains(n) { while (n) { if (n === this) return true; n = n.parent; } return false; }
  get textContent() { return this.kids.map((k) => k.textContent).join(''); }
  set textContent(v) { this.kids = []; if (v) this.appendChild(new T(v)); }
  setAttribute(k, v) {
    // Chrome 모델(비관적): 초점이 든 요소가 inert가 되면 지연 focus fixup이 나중에 무조건 body로 보낸다
    if (k === 'inert' && D.fixup && D.active && D.active !== D.body && this.contains(D.active)) { D.fixups++; W.setTimeout(() => { D.active = D.body; D.blurs++; }, 1); }
    this.attrs[k] = String(v);
  }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  hasAttribute(k) { return k in this.attrs; }
  removeAttribute(k) { delete this.attrs[k]; }
  get inert() { return this.hasAttribute('inert'); }
  set inert(v) { if (v) this.setAttribute('inert', ''); else this.removeAttribute('inert'); }
  get className() { return this.getAttribute('class') || ''; }
  set className(v) { this.setAttribute('class', v); }
  get hidden() { return this.hasAttribute('hidden'); }
  set hidden(v) { if (v) this.setAttribute('hidden', ''); else this.removeAttribute('hidden'); }
  get tabIndex() { return this.hasAttribute('tabindex') ? Number(this.getAttribute('tabindex')) : -1; }
  get clientWidth() { return this.cw || 1200; }
  get clientHeight() { return this.ch || 700; }
  get classList() { const s = this; const l = () => s.className.split(/\s+/).filter(Boolean); return { add: (x) => { s.className = [...new Set([...l(), x])].join(' '); }, remove: (x) => { s.className = l().filter((y) => y !== x).join(' '); }, toggle: (x, f) => { const on = f === undefined ? !l().includes(x) : f; s.className = (on ? [...new Set([...l(), x])] : l().filter((y) => y !== x)).join(' '); return on; }, contains: (x) => l().includes(x) }; }
  addEventListener(t, f) { (this.ls[t] = this.ls[t] || []).push(f); }
  matches(s) { return matches(this, s); }
  closest(s) { let n = this; while (n && n.isEl) { if (matches(n, s)) return n; n = n.parent; } return null; }
  *walk() { for (const c of this.children) { yield c; yield* c.walk(); } }
  querySelectorAll(s) { return [...this.walk()].filter((n) => matches(n, s)); }
  querySelector(s) { return this.querySelectorAll(s)[0] || null; }
  getClientRects() { let n = this; while (n) { if (n.isEl && n.hidden) return []; n = n.parent; } return [1]; }
  focus() { if (this.closest('[inert]')) return; D.active = this; (D.ls.focusin || []).forEach((f) => f({ target: this })); }
  scrollIntoView() { D.scrolledTo = this; }
  getBoundingClientRect() {
    if (this.rect) { const r = this.rect; return { left: r.x, top: r.y, width: r.w, height: r.h, right: r.x + r.w, bottom: r.y + r.h }; }
    const top = (this.docTop == null ? 0 : this.docTop) - W.scrollY;
    return { top, bottom: top + this.h, height: this.h, left: 0, right: 600, width: 600 };
  }
}
function page({ reduce = false, narrow = false, hash = '', failFetch = false, fixup = false, popRestore = null } = {}) {
  const root = new E('html');
  const mk = (tag, attrs = {}, kids = []) => { const e = new E(tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); kids.forEach((k) => e.appendChild(k)); return e; };
  const step = (id) => mk('section', { id, 'data-step': '', tabindex: '-1' });
  const body = mk('body', {}, [
    mk('a', { class: 'skip', href: '#top-title' }), mk('a', { class: 'skip', href: '#materials' }),
    mk('header', { id: 'head' }, [mk('button', { id: 'toc-toggle' }, [mk('span', { class: 'toc-toggle__label' })]), mk('nav', { id: 'toc' }, ['top', 'intro', 'roadmap', 'materials', 'join'].map((c) => mk('a', { 'data-chapter': c, href: '#' + c })))]),
    mk('main', { id: 'main' }, [
      mk('div', { id: 'story' }, [
        step('top'),
        mk('div', { id: 'stage' }, [mk('span', { id: 'hud-label' }), mk('span', { id: 'hud-fill' }), mk('svg', { id: 'stage-svg' }, [mk('g', { id: 'cam' })]), mk('p', { id: 'stage-msg', hidden: '' })]),
        mk('div', {}, [step('intro'), mk('section', { id: 'roadmap', 'data-step': '', tabindex: '-1' }, [mk('ol', { id: 'area-index' })]), mk('div', { id: 'area-steps' }), mk('section', { id: 'materials', 'data-step': '', tabindex: '-1' }, [mk('ol', { id: 'material-list' })])])
      ]),
      mk('section', { id: 'courses', tabindex: '-1' }, [mk('ol', { id: 'course-list' })]), mk('section', { id: 'example', tabindex: '-1' }, [mk('ol', { id: 'example-steps' }), mk('p', { id: 'example-note' })]), mk('section', { id: 'join' })
    ]),
    mk('footer', { class: 'foot' }),
    mk('div', { class: 'layers', id: 'layers' })
  ]);
  root.appendChild(body);
  clock = { now: 0, rafs: [], timers: [], nextId: 1 };
  D = { documentElement: root, body, active: null, scrolledTo: null, baseURI: CFG.baseURI, ls: {}, visibilityState: 'visible',
    get activeElement() { return this.active; },
    getElementById: (id) => root.querySelector('#' + id), querySelector: (s) => root.querySelector(s), querySelectorAll: (s) => root.querySelectorAll(s),
    createElement: (t) => new E(t), createElementNS: (_, t) => new E(t), createTextNode: (t) => new T(t),
    addEventListener(t, f) { (this.ls[t] = this.ls[t] || []).push(f); } };
  const hist = { entries: [{ state: null }], i: 0 };
  const firePop = () => (W.ls.popstate || []).forEach((f) => f({ state: hist.entries[hist.i].state }));
  const history = {
    get state() { return hist.entries[hist.i].state; },
    get length() { return hist.entries.length; },
    pushState(s) { hist.entries = hist.entries.slice(0, hist.i + 1); hist.entries.push({ state: JSON.parse(JSON.stringify(s)) }); hist.i++; },
    replaceState(s) { hist.entries[hist.i] = { state: s == null ? null : JSON.parse(JSON.stringify(s)) }; },
    go(n) {
      const j = Math.max(0, Math.min(hist.entries.length - 1, hist.i + n)); if (j === hist.i) return;
      // popRestore: Chrome이 history 전환 때 이전 초점(section#roadmap)을 되살리는 모델 — popstate 전/후/늦게
      const restore = () => { const sec = D.getElementById('roadmap'); D.active = sec; D.popRestores = (D.popRestores || 0) + 1; };
      W.setTimeout(() => { hist.i = j; if (popRestore === 'before') restore(); firePop(); if (popRestore === 'after') restore(); if (popRestore === 'late') W.setTimeout(restore, 90); }, 3);
    },
    back() { this.go(-1); }
  };
  const loc = { _hash: hash, get hash() { return this._hash; }, set hash(v) { this._hash = v.startsWith('#') ? v : '#' + v; loc.sets.push(this._hash); }, sets: [] };
  W = { document: D, console: { warn() {} }, URL, Promise, Math, Object, String, Number, Array, JSON, Error, Date,
    scrollY: 1700, innerHeight: 900, innerWidth: 1440, location: loc, history,
    performance: { now: () => clock.now },
    matchMedia: (q) => ({ matches: q.includes('reduce') ? reduce : q.includes('max-width: 860px') ? narrow : q.includes('min-width: 861px') ? !narrow : false, addEventListener() {} }),
    requestAnimationFrame: (f) => { clock.rafs.push(f); return clock.rafs.length; }, cancelAnimationFrame() {},
    setTimeout: (f, ms) => { const id = clock.nextId++; clock.timers.push({ id, at: clock.now + (ms || 0), f }); return id; },
    clearTimeout: (id) => { clock.timers = clock.timers.filter((t) => t.id !== id); },
    scrollTo: (o, y) => { W.scrollY = typeof o === "object" ? o.top : y; W.scrolls.push(W.scrollY); }, scrolls: [],
    ls: {}, addEventListener(t, f) { (this.ls[t] = this.ls[t] || []).push(f); } };
  W.window = W; W.globalThis = W;
  W.fetch = (u) => failFetch ? Promise.reject(new Error('net')) : Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(CFG.json[u.split('/').pop()])) });
  W.fetchLog = [];
  const f0 = W.fetch; W.fetch = (u) => { W.fetchLog.push(u); return f0(u); };
  vm.createContext(W);
  D.fixup = fixup; D.fixups = 0; D.blurs = 0;
  for (const f of ['motion-core.js', 'layers.js', 'story.js']) vm.runInContext(CFG.code[f], W, { filename: f });
  // 가짜 시계: 16ms 프레임마다 rAF 실행, 만기된 타이머 실행
  const advance = (ms) => {
    const end = clock.now + ms;
    while (clock.now < end) {
      clock.now = Math.min(end, clock.now + 16);
      const r = clock.rafs; clock.rafs = [];
      r.forEach((f) => f(clock.now));
      let due;
      while ((due = clock.timers.filter((t) => t.at <= clock.now)).length) { clock.timers = clock.timers.filter((t) => t.at > clock.now); due.forEach((t) => t.f()); }
    }
  };
  const flush = () => { let n = 0; while (clock.rafs.length && n++ < 50) { const r = clock.rafs; clock.rafs = []; r.forEach((f) => f(clock.now)); } };
  const layoutSteps = () => {
    const st = D.getElementById('story'); st.docTop = 64; st.h = 10 * 900; D.getElementById('join').docTop = 64 + 10 * 900 + 2000;
    D.querySelectorAll('#story [data-step]').forEach((s, i) => { s.docTop = 64 + i * 900; s.h = 900; });
    // 무대 영역 도형 위치(화면 좌표)와 펼침 필드
    D.querySelectorAll('#cam [data-piece]').forEach((g, i) => { if (g.getAttribute('data-piece').startsWith('area:')) g.rect = { x: 800 + i * 70, y: 300 + (i % 2) * 120, w: 92, h: 92 }; });
  };
  const fieldRect = () => { const f = D.querySelector('.xl__field'); if (f) { f.rect = { x: 48, y: 140, w: 1200, h: 700 }; f.cw = 1200; f.ch = 700; } };
  const scrollTo = (y) => { W.scrollY = y; (W.ls.scroll || []).forEach((f) => f()); flush(); };
  const click = (n) => { let prevented = false; (D.ls.click || []).forEach((f) => f({ target: n, preventDefault: () => { prevented = true; } })); return prevented; };
  const key = (k, shift) => (D.ls.keydown || []).forEach((f) => f({ key: k, shiftKey: !!shift, preventDefault() {} }));
  return { D, W, root, flush, advance, layoutSteps, fieldRect, scrollTo, click, key, hist, story: () => D.getElementById('story') };
}
const tick = () => new Promise((r) => setTimeout(r, 5));
const geom = (n) => n.getAttribute('data-geom').split(',').map(Number);

/**
 * 동작 회귀 실행.
 * @param {object} o
 * @param {string} [o.codeDir]  화면 스크립트 폴더(기본 site/src)
 * @param {string} [o.dataDir]  데이터 폴더(기본 site/data)
 * @param {object} [o.json]     { 'portal.json': 문자열, 'sources.json': 문자열 } — 데이터 갱신 시험용 대체 데이터
 * @param {string} [o.baseURI]  문서 주소(기본 https://example.invalid/ai-native-sdlc/index.html)
 */
export async function runBehavior({ codeDir = path.join(SITE_DIR, 'src'), dataDir = DATA_DIR, json = null, baseURI = 'https://example.invalid' + BASE_PATH + 'index.html' } = {}) {
  const code = Object.fromEntries(SCRIPTS.map((f) => [f, fs.readFileSync(path.join(codeDir, f), 'utf8')]));
  const data = json || Object.fromEntries(['portal.json', 'sources.json'].map((f) => [f, fs.readFileSync(path.join(dataDir, f), 'utf8')]));
  CFG = { code, json: data, baseURI, dataPrefix: new URL('data/', baseURI).href };
  results = [];
  const portal = JSON.parse(data['portal.json']);
  const sources = JSON.parse(data['sources.json']);
  const coreCtx = { Math, Object, String, Number };
  coreCtx.globalThis = coreCtx;
  vm.createContext(coreCtx);
  vm.runInContext(code['motion-core.js'], coreCtx);
  const M = coreCtx.MotionA;
  check('motion-core: 장면 수 = 데이터 장면, 영역 장면 카메라 1.8', M.buildStates(portal, M.layout(portal)).length === M.sceneNames(portal).length && M.buildStates(portal, M.layout(portal))[3]['cam.s'] === 1.8);

  {
    const p = page();
    await tick(); await tick();
    p.layoutSteps(); p.fieldRect();
    (p.W.ls.resize || []).forEach((f) => f()); p.flush();
    const st = p.story();
    check('DOM: data-motion=scroll, 데이터 경로', p.root.getAttribute('data-motion') === 'scroll' && p.W.fetchLog.length > 0 && p.W.fetchLog.every((u) => u.startsWith(CFG.dataPrefix)), p.W.fetchLog);
    const exRes = portal.resources.find((r) => r.kind === 'example');
    const want = { steps: M.sceneNames(portal).length, topics: portal.topics.length, items: portal.resources.length, courses: portal.courses.length, example: exRes ? exRes.steps.length : 0, pieces: portal.areas.length + portal.topics.length + portal.extensions.length };
    const have = { steps: p.D.querySelectorAll('#story [data-step]').length, topics: p.D.querySelectorAll('#area-steps li.topic').length, items: p.D.querySelectorAll('#material-list [tabindex]').length, courses: p.D.querySelectorAll('#course-list [tabindex]').length, example: p.D.getElementById('example-steps').children.length, pieces: p.D.querySelectorAll('#cam [data-piece]').length };
    check('DOM: 장면·주제·공개 항목·강의·예제 단계·무대 조각 수 = 데이터에서 계산한 값', JSON.stringify(have) === JSON.stringify(want), { have, want });
    check('DOM: 여는 버튼 수(영역 목록·영역 장면 = 영역 수, 자료·강의 = 항목 수, 영역 관련 자료)', p.D.querySelectorAll('#area-index [data-open-area]').length === portal.areas.length && p.D.querySelectorAll('#area-steps [data-open-area]').length === portal.areas.length && p.D.querySelectorAll('#material-list [data-open-item]').length === portal.resources.length && p.D.querySelectorAll('#course-list [data-open-item]').length === portal.courses.length && p.D.querySelectorAll('#area-steps .related [data-open-item]').length > 0);
    p.scrollTo(514 + 900 * 3 + 450);
    check('A 스크롤 연동 유지: 장면 4 중간', st.getAttribute('data-scene') === '4' && st.getAttribute('data-scene-progress') === '0.5000');
    const y0 = p.W.scrollY;
    const progress0 = st.getAttribute('data-progress');
    const camBefore = p.D.getElementById('cam').getAttribute('transform');

    // 영역 펼침 열기
    const opener = p.D.querySelector('#area-index [data-open-area="spec"]');
    const xl = p.D.getElementById('explore');
    check('영역 펼침 DOM: 영역 수만큼 공간, 처음 닫힘', xl && xl.hidden && xl.querySelectorAll('.zone').length === portal.areas.length);
    p.click(opener);
    const zSpec = xl.querySelector('[data-zone="spec"]');
    const start = geom(zSpec);
    check('열기 직후: 깊이1·잠금·inert·history', p.root.getAttribute('data-layers') === '1' && p.root.classList.contains('is-layered') && p.D.getElementById('main').inert && p.D.getElementById('head').inert && p.W.history.state && p.W.history.state.d === 1 && p.D.getElementById('layers').getAttribute('data-stack') === 'area:spec');
    const specPiece = p.D.querySelector('#cam [data-piece="area:spec"]');
    check('열기 시작 기하 = 무대 영역 도형 위치(필드 기준)', start[0] === specPiece.rect.x - 48 && start[2] === 92, start);
    check('열기 직후 초점 = 영역 제목', p.D.active && p.D.active.getAttribute('id') === 'xl-title' && p.D.active.textContent === portal.areas.find((a) => a.id === 'spec').title);
    p.advance(352);
    const mid = geom(zSpec);
    const midT = Number(xl.getAttribute('data-t'));
    check('중간: opening, 0<t<1, 폭이 시작과 끝 사이', xl.getAttribute('data-state') === 'opening' && midT > 0.3 && midT < 0.7 && mid[2] > 92 && mid[2] < 864, { t: midT, mid });
    p.advance(600);
    const end = geom(zSpec);
    const prob = geom(xl.querySelector('[data-zone="problem"]'));
    check('끝: open, 선택 공간 864×700, 다른 공간 76px 압축', xl.getAttribute('data-state') === 'open' && end[2] === 864 && end[3] === 700 && prob[2] === 76 && prob[0] === 0 && end[0] === 84, { end, prob });
    check('프레임 계측: data-frames > 30, trace 기록', Number(xl.getAttribute('data-frames')) > 30 && p.W.KLayers.trace.some((t) => t.what === 'area:opening' && t.kind === 'anim-end'), xl.getAttribute('data-frames'));
    check('선택 공간 본문: 주제·관련 자료·범례', xl.querySelectorAll('.zone.is-selected .topic').length === portal.topics.filter((t) => t.area === 'spec').length && xl.querySelectorAll('.zone.is-selected [data-open-item]').length > 0 && /공개 자료 있음/.test(xl.textContent));
    check('스크롤 잠금 중 A 상태 불변', st.getAttribute('data-progress') === progress0 && p.D.getElementById('cam').getAttribute('transform') === camBefore);

    // 다른 영역으로 전환(압축 공간 클릭)
    const histLen = p.W.history.length;
    p.click(xl.querySelector('[data-zone-tab="verify"]'));
    check('전환: history 추가 없음(replace), stack area:verify', p.W.history.length === histLen && p.W.history.state.item === 'area:verify' && p.D.getElementById('layers').getAttribute('data-stack') === 'area:verify' && xl.getAttribute('data-state') === 'switching');
    p.advance(700);
    check('전환 끝: verify 확대·spec 압축', geom(xl.querySelector('[data-zone="verify"]'))[2] === 864 && geom(zSpec)[2] === 76 && xl.getAttribute('data-area') === 'verify');

    // 영역 → 관련 자료 상세
    const relBtn = xl.querySelector('.zone.is-selected [data-open-item]');
    relBtn.parent.rect = { x: 700, y: 420, w: 380, h: 96 };
    p.click(relBtn);
    const dl1 = p.D.querySelector('.dl');
    check('상세 열기: 깊이2, 영역 화면 inert, history d=2', p.root.getAttribute('data-layers') === '2' && xl.inert && !dl1.inert && p.W.history.state.d === 2 && dl1.getAttribute('data-item') === relBtn.getAttribute('data-open-item'));
    dl1.querySelector('.dl__sheet').rect = { x: 320, y: 80, w: 800, h: 800 };
    check('상세 초점 = 상세 제목', p.D.active && /dl-title-/.test(p.D.active.getAttribute('id') || ''));
    p.advance(300);
    check('상세 중간: opening, clip 진행 중', dl1.getAttribute('data-state') === 'opening' && Number(dl1.getAttribute('data-t')) > 0.2 && Number(dl1.getAttribute('data-t')) < 0.8);
    p.advance(500);
    check('상세 끝: open, clip 0', dl1.getAttribute('data-state') === 'open' && dl1.querySelector('.dl__sheet').getAttribute('data-clip') === '0,0,0,0');

    // Tab 순환
    const focusables = dl1.querySelectorAll('a[href],button:not([disabled])');
    p.D.active = focusables[focusables.length - 1];
    p.key('Tab');
    check('Tab 가두기: 마지막 → 첫 요소', p.D.active === focusables[0]);

    // Escape: 상세 닫기 → 영역 → 스토리
    p.key('Escape');
    check('Escape 1: 상세 닫힘(깊이1), 초점 = 상세 연 버튼', p.root.getAttribute('data-layers') === '1' && p.D.active === relBtn && !xl.inert, p.D.active && p.D.active.textContent);
    p.advance(40);
    check('history back 반영 d=1', p.W.history.state && p.W.history.state.d === 1);
    p.advance(600);
    check('닫힌 상세 DOM 제거', !p.D.querySelector('.dl'));
    p.key('Escape');
    check('Escape 2: 영역 닫힘, 잠금 해제, 초점 = 원래 선택 버튼', p.root.getAttribute('data-layers') === '0' && !p.root.classList.contains('is-layered') && !p.D.getElementById('main').inert && p.D.active === opener);
    p.advance(100);
    check('닫기 중간: closing, 도형 위치로 돌아가는 중', xl.getAttribute('data-state') === 'closing' && geom(xl.querySelector('[data-zone="verify"]'))[2] < 864);
    p.advance(700);
    const back = geom(xl.querySelector('[data-zone="verify"]'));
    check('닫기 끝: hidden, 마지막 기하 = 무대 도형', xl.hidden && xl.getAttribute('data-state') === 'closed' && back[2] === 92, back);
    check('복귀: 스크롤·A 진행도·카메라 동일', p.W.scrollY === y0 && st.getAttribute('data-progress') === progress0 && p.D.getElementById('cam').getAttribute('transform') === camBefore && p.W.history.state == null);

    // 빠른 닫기·재열기: 열기 중 Escape → 현재 기하에서 되돌아감 → 닫는 중 다시 열기
    p.click(opener);
    p.advance(240);
    const g1 = geom(zSpec);
    p.key('Escape');
    p.flush();
    const g2 = geom(zSpec);
    check('열기 중 Escape: 현재 기하에서 이어서 닫힘(점프 없음)', xl.getAttribute('data-state') === 'closing' && Math.abs(g2[2] - g1[2]) < 40, { g1, g2 });
    p.advance(80);
    p.click(opener); // popstate 전이면 대기 후 실행
    p.advance(30);
    const g3 = geom(zSpec);
    check('닫는 중 재열기: 깊이1, opening, 현재 기하에서 출발', p.root.getAttribute('data-layers') === '1' && xl.getAttribute('data-state') === 'opening' && g3[2] > 92 && g3[2] < 864 && p.W.history.state.d === 1, g3);
    // 열기 중 resize → 즉시 최종 배치
    (p.W.ls.resize || []).forEach((f) => f());
    check('열기 중 resize: 즉시 open·최종 기하', xl.getAttribute('data-state') === 'open' && geom(zSpec)[2] === 864);

    // 브라우저 뒤로: popstate로 닫힘
    p.W.history.back(); p.advance(20);
    check('브라우저 뒤로: 영역 닫힘, 초점 복원', p.root.getAttribute('data-layers') === '0' && p.D.active === opener);
    p.advance(700);

    // 자료 목록 → 강의 모음 상세 → 중첩 강의 상세 → 연속 Escape
    const colBtn = p.D.querySelector('#material-list [data-open-item="res:courses"]');
    p.click(colBtn);
    const dCol = p.D.querySelector('[data-item="res:courses"]');
    check('강의 모음 상세: 강의 수만큼 버튼', dCol && dCol.querySelectorAll('[data-open-item^="course:"]').length === portal.courses.length);
    p.advance(700);
    const cBtn = dCol.querySelector('[data-open-item="course:sdd"]');
    p.click(cBtn);
    const dC = p.D.querySelector('[data-item="course:sdd"]');
    const sdd = portal.courses.find((c) => c.id === 'sdd');
    check('중첩 상세: 깊이2, 강의 원본 링크·대상·분량·강사', p.root.getAttribute('data-layers') === '2' && dCol.inert && dC.querySelectorAll('.dl__src a').length >= sdd.links.length && dC.textContent.includes(sdd.audience) && dC.textContent.includes(sdd.duration) && dC.textContent.includes(sdd.instructor));
    p.key('Escape'); p.key('Escape');
    check('연속 Escape 2회: 둘째는 history 정리 후 실행', p.root.getAttribute('data-layers') === '1');
    p.advance(40);
    check('연속 Escape 결과: 모두 닫힘, 초점 = 자료 카드 버튼', p.root.getAttribute('data-layers') === '0' && p.D.active === colBtn && p.W.history.state == null, p.root.getAttribute('data-layers'));
    p.advance(700);

    // 상세 안의 페이지 내 링크(#roadmap) → 모두 닫고 이동
    p.click(p.D.querySelector('#material-list [data-open-item="res:project"]'));
    p.advance(700);
    const dP = p.D.querySelector('[data-item="res:project"]');
    const projIds = ['readme', 'methodology', 'getting-started', 'verification'].filter((id) => sources.sources.some((x) => x.id === id));
    check('프로젝트 상세: 함께 읽는 원본 = manifest에 있는 항목', projIds.length > 0 && dP.querySelectorAll('.dl__src a').length === projIds.length);
    const prevented = p.click(dP.querySelector('a[href="#roadmap"]'));
    p.advance(40);
    check('상세 안 #roadmap: 닫고 이동', prevented && p.root.getAttribute('data-layers') === '0' && p.W.location.sets.includes('#roadmap'));
    p.advance(700);

    // 예제 상세 5단계
    p.click(p.D.querySelector('#material-list [data-open-item="res:example"]'));
    const dE = p.D.querySelector('[data-item="res:example"]');
    check('예제 상세: 데이터 단계 수·볼 곳', dE.querySelectorAll('.dl__link-step').length === exRes.steps.length && /볼 곳: /.test(dE.textContent));
    p.key('Escape'); p.advance(700);

    // 모든 강의 상세: 원본 링크 수 = links + 같은 폴더 추가 원본
    let allCourse = true;
    for (const c of portal.courses) {
      p.click(p.D.querySelector('#course-list [data-open-item="course:' + c.id + '"]'));
      const d = p.D.querySelector('[data-item="course:' + c.id + '"]');
      if (!d || d.querySelectorAll('.dl__src a').length < c.links.length) allCourse = false;
      p.key('Escape'); p.advance(700);
    }
    check('강의 상세 모두 원본 링크 포함', allCourse);

    // 영역 5개 모두 주제 수 일치
    let topicSum = 0;
    p.click(p.D.querySelector('#area-index [data-open-area="' + portal.areas[0].id + '"]')); p.advance(800);
    for (const a of portal.areas) { p.click(xl.querySelector('[data-zone-tab="' + a.id + '"]') || xl.querySelector('#xl-title')); p.advance(600); topicSum += xl.querySelectorAll('.zone.is-selected .topic').length; }
    check('영역 펼침 전체 순회: 주제 합계 = 데이터 주제 수', topicSum === portal.topics.length, topicSum);
    p.key('Escape'); p.advance(800);

    // TOC Escape는 같은 소유자가 처리
    p.click(p.D.getElementById('toc-toggle'));
    (p.D.getElementById('toc-toggle').ls.click || []).forEach((f) => f({}));
    const tocOpen = p.D.getElementById('toc-toggle').getAttribute('aria-expanded') === 'true';
    p.key('Escape');
    check('목차 Escape: 겹 화면 없을 때 목차 닫고 버튼 초점', tocOpen && p.D.getElementById('toc-toggle').getAttribute('aria-expanded') === 'false' && p.D.active === p.D.getElementById('toc-toggle'));
  }
  {
    const p = page({ reduce: true });
    await tick(); await tick();
    p.layoutSteps(); p.fieldRect(); p.scrollTo(3000);
    check('reduced: 정적 지도(장면 2)', p.root.getAttribute('data-motion') === 'reduced' && p.story().getAttribute('data-scene') === '2');
    p.click(p.D.querySelector('#area-index [data-open-area="build"]'));
    const xl = p.D.getElementById('explore');
    check('reduced 영역 펼침: 같은 경로, 즉시 open(프레임 1)', xl.getAttribute('data-state') === 'open' && xl.getAttribute('data-frames') === '1' && geom(xl.querySelector('[data-zone="build"]'))[2] === 864);
    p.click(xl.querySelector('.zone.is-selected [data-open-item]'));
    const d = p.D.querySelector('.dl');
    check('reduced 상세: 즉시 open', d.getAttribute('data-state') === 'open' && d.getAttribute('data-frames') === '1');
    p.key('Escape'); p.advance(20); p.key('Escape'); p.advance(20);
    check('reduced 닫기: 즉시 제거·숨김', !p.D.querySelector('.dl') && xl.hidden && p.root.getAttribute('data-layers') === '0');
  }
  {
    const p = page({ narrow: true });
    await tick(); await tick();
    p.layoutSteps();
    const f = () => { const fl = p.D.querySelector('.xl__field'); fl.rect = { x: 12, y: 116, w: 336, h: 512 }; fl.cw = 336; fl.ch = 512; };
    f();
    p.click(p.D.querySelector('#area-index [data-open-area="deploy"]'));
    p.advance(800);
    const xl = p.D.getElementById('explore');
    const sel = geom(xl.querySelector('[data-zone="deploy"]'));
    const other = geom(xl.querySelector('[data-zone="problem"]'));
    check('모바일(336px 필드): 선택 공간 아래 전체 폭, 나머지 4개 상단 한 줄', !xl.classList.contains('is-wide') && sel[0] === 0 && sel[2] === 336 && sel[1] === 64 && other[3] === 56 && other[1] === 0, { sel, other });
  }
  {
    const p = page({ failFetch: true });
    await tick(); await tick();
    check('오류: data-motion=error, 안내 문구, 겹 화면 미생성', p.root.getAttribute('data-motion') === 'error' && /데이터를 불러오지 못했습니다/.test(p.D.getElementById('area-steps').textContent) && !p.D.getElementById('explore'));
    p.key('Escape');
    check('오류 상태 Escape 안전', p.root.getAttribute('data-layers') == null);
  }
  {
    // 이전 주소 형식: 모든 #stage/NN은 legacyStages로 영역에, 그 밖의 형식은 같은 위치로
    const cases = [['#stage/04', 'area-spec'], ['#area/verify', 'area-verify'], ['#topic/tdd', 'topic-tdd'], ['#ext/harness', 'ext-harness'], ['#path/todo', 'example'], ['#area-build', 'area-build']];
    for (const a of portal.areas) for (const st of a.legacyStages || []) cases.push(['#stage/' + st, 'area-' + a.id]);
    const bad = [];
    for (const [hash, id] of cases) {
      const p = page({ hash });
      await tick(); await tick();
      const got = p.D.scrolledTo && p.D.scrolledTo.getAttribute('id');
      if (got !== id) bad.push({ hash, want: id, got });
    }
    check('해시: 이전 형식(#stage/NN·#area/·#topic/·#ext/·#path/todo)과 새 형식이 해당 위치로', bad.length === 0, bad.length ? bad : cases.length);
  }

  /* 회귀: 영역 spec → course:sdd 상세 → Escape 후 초점이 상위 층 opener로 (1440 실제 브라우저 검수에서 찾은 결함) */
  async function focusPath(opts, label) {
    const p = page(opts);
    await tick(); await tick();
    p.layoutSteps(); p.fieldRect();
    const out = [];
    for (let run = 1; run <= 3; run++) {
      p.click(p.D.querySelector('#area-index [data-open-area="spec"]')); p.advance(800);
      const btn = p.D.querySelector('#explore [data-open-item="course:sdd"]');
      p.D.active = btn; // 마우스 클릭으로 버튼에 초점
      p.click(btn); p.advance(800);
      p.key('Escape'); p.advance(40);
      const early = p.D.active;
      p.advance(1000);
      const xl = p.D.getElementById('explore');
      out.push({ run, depth: p.root.getAttribute('data-layers'), detailGone: !p.D.querySelector('.dl'), mainInert: p.D.getElementById('main').inert, area: xl.getAttribute('data-area'),
        activeIsOpener: p.D.active === btn, activeTag: p.D.active && p.D.active.tagName, earlyIsOpener: early === btn, blurs: p.D.blurs, fixups: p.D.fixups });
      p.key('Escape'); p.advance(1000);
      out[out.length - 1].storyFocus = p.D.active && p.D.active.getAttribute('data-open-area');
    }
    return { p, out };
  }
  {
    const fixd = await focusPath({ fixup: true }, 'fixed');
    check('같은 경로 3회 — depth1·main inert·area spec·상세 제거·초점=course:sdd 버튼', fixd.out.every((r) => r.depth === '1' && r.detailGone && r.mainInert && r.area === 'spec' && r.activeIsOpener && r.earlyIsOpener), fixd.out);
    check('최종 스토리 복귀 초점=spec 버튼(3회)', fixd.out.every((r) => r.storyFocus === 'spec'), fixd.out.map((r) => r.storyFocus));
    check('초점이 든 요소를 inert로 만드는 순서 0회', fixd.out.every((r) => r.fixups === 0), fixd.out.map((r) => r.fixups));
  }
  {
    // 보장 안전망: 닫기 직후 외부 요인으로 body가 되어도 같은 세대 의도면 복구
    const p = page();
    await tick(); await tick(); p.layoutSteps(); p.fieldRect();
    p.click(p.D.querySelector('#area-index [data-open-area="spec"]')); p.advance(800);
    const btn = p.D.querySelector('#explore [data-open-item="course:sdd"]');
    p.click(btn); p.advance(800);
    p.key('Escape');
    p.D.active = p.D.body; // 비동기 blur 경합 모사
    p.advance(1000);
    check('안전망: 닫기 후 body로 떨어져도 상위층 opener로 복구', p.D.active === btn && p.W.KLayers.trace.some((t) => t.kind === 'focus-restore'));
    // 빠른 다른 선택: 닫자마자 다른 자료 열기 → 새 상세 제목 유지(이전 opener로 빼앗지 않음)
    p.click(btn); p.advance(800);
    p.key('Escape'); p.advance(5);
    const other = [...p.D.querySelectorAll('#explore .zone.is-selected [data-open-item]')].find((b) => b !== btn);
    p.click(other); p.advance(1200);
    const top = p.D.querySelector('.dl[data-state="open"]');
    check('빠른 다른 선택: 새 상세 제목 초점 유지', top && top.getAttribute('data-item') === other.getAttribute('data-open-item') && p.D.active && /dl-title-/.test(p.D.active.getAttribute('id') || ''), p.D.active && p.D.active.getAttribute('id'));
    p.key('Escape'); p.advance(5);
    // 빠른 같은 재열기
    p.click(other); p.advance(1200);
    check('빠른 같은 재열기: 상세 1개·제목 초점', p.D.querySelectorAll('.dl').length === 1 && /dl-title-/.test(p.D.active.getAttribute('id') || ''));
    p.key('Escape'); p.advance(5);
    // 사용자가 다른 곳을 포인터로 누르면 의도 포기(빼앗지 않음)
    (p.D.ls.pointerdown || []).forEach((f) => f({ target: p.D.querySelector('#explore .zb__title') }));
    p.D.active = p.D.body;
    p.advance(1000);
    check('포인터 조작 후 초점 강제 이동 없음', p.D.active === p.D.body);
  }

  /* 회귀: 정상 모션 영역 열기 ~11ms 뒤 Escape → 브라우저 history 초점 복원(section#roadmap)이 와도 opener로 (실제 브라우저 검수 결함) */
  async function fastClose(opts) {
    const p = page(opts);
    await tick(); await tick(); p.layoutSteps(); p.fieldRect();
    const sec = p.D.getElementById('roadmap');
    p.D.active = sec; // #roadmap 경로로 들어와 section에 초점
    const btn = p.D.querySelector('#area-index [data-open-area="spec"]');
    p.D.active = btn; // 실제 마우스 누름으로 버튼 초점
    p.click(btn); p.advance(11);
    const state = p.D.getElementById('explore').getAttribute('data-state');
    p.key('Escape'); p.advance(1200);
    return { p, btn, sec, r: { stateAtEscape: state, depth: p.root.getAttribute('data-layers'), locked: p.root.classList.contains('is-layered'), active: p.D.active && (p.D.active.getAttribute('data-open-area') || p.D.active.getAttribute('id') || p.D.active.tagName), restores: p.D.popRestores || 0 } };
  }
  {
    for (const mode of ['before', 'after', 'late']) {
      const fx = await fastClose({ popRestore: mode });
      check('history 초점 복원 모델(' + mode + '): 열기 11ms 뒤 Escape → depth0·잠금해제·초점=spec 버튼', fx.r.active === 'spec' && fx.r.depth === '0' && !fx.r.locked && fx.r.restores === 1, fx.r);
    }
    // 3회 반복(같은 문서)
    const rep3 = await fastClose({ popRestore: 'after' });
    let ok3 = rep3.r.active === 'spec';
    for (let i = 0; i < 2; i++) { rep3.p.D.active = rep3.btn; rep3.p.click(rep3.btn); rep3.p.advance(11); rep3.p.key('Escape'); rep3.p.advance(1200); ok3 = ok3 && rep3.p.D.active === rep3.btn; }
    check('빠른 열기·닫기 3회 반복: 초점 spec 버튼', ok3);
    // 사용자 Tab 의도 존중: 닫은 직후 Tab으로 다른 링크 → 브라우저 복원(late)이 와도 강제 이동 없음
    const t = await fastClose({ popRestore: null });
    t.p.D.active = t.btn; t.p.click(t.btn); t.p.advance(11); t.p.key('Escape');
    t.p.key('Tab'); const link = t.p.D.querySelector('#toc a'); t.p.D.active = link; t.p.advance(1200);
    check('Tab 의도 존중: 닫은 직후 Tab 이동한 링크 유지', t.p.D.active === link);
    // 포인터로 section을 눌러 초점이 section이 된 경우도 유지
    t.p.D.active = t.btn; t.p.click(t.btn); t.p.advance(11); t.p.key('Escape'); t.p.advance(5);
    (t.p.D.ls.pointerdown || []).forEach((f) => f({ target: t.sec })); t.p.D.active = t.sec; t.p.advance(1200);
    check('포인터 의도 존중: 사용자가 누른 section 초점 유지', t.p.D.active === t.sec);
  }


  return results;
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const di = args.indexOf('--dist');
  const dist = di >= 0 ? path.resolve(args[di + 1] && !args[di + 1].startsWith('--') ? args[di + 1] : DEFAULT_OUT) : null;
  const res = await runBehavior(dist ? { codeDir: dist, dataDir: path.join(dist, 'data') } : {});
  const failed = res.filter((r) => !r.ok);
  for (const r of res) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}${r.ok ? '' : ' — ' + JSON.stringify(r.detail)}`);
  console.log(`behavior: ${res.length - failed.length}/${res.length} 통과`);
  process.exit(failed.length ? 1 : 0);
}
