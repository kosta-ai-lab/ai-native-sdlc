// kosta-ai-lab 학습 로드맵: 화면 동작 (Apache-2.0)
// 내용은 data/roadmap.json에서 읽고, 계산은 core.js(KostaRoadmap)를 쓴다. 화면은 DOM API로만 만든다.
(() => {
  'use strict';
  const R = self.KostaRoadmap;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const OUT = 'cubic-bezier(.16,1,.3,1)', POP = 'cubic-bezier(.34,1.56,.64,1)';
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 999px)');
  const DONE_KEY = 'kosta-roadmap-done';
  // 공개한 날을 포함해 이 날수 동안 NEW를, 내용이 바뀐 날을 포함해 이 날수 동안 업데이트를 붙인다.
  const FRESH_DAYS = 14;

  /** 요소를 만든다. props: class, text, data, vars(CSS 변수), on(이벤트), 그 밖은 속성. */
  const h = (tag, props, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'data') Object.assign(e.dataset, v);
      else if (k === 'vars') for (const [n, x] of Object.entries(v)) e.style.setProperty(n, String(x));
      else if (k === 'on') for (const [n, fn] of Object.entries(v)) e.addEventListener(n, fn);
      else e.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of R.flatKids(kids)) e.append(c);
    return e;
  };
  const icon = (cls, box, d) => {
    const s = document.createElementNS(SVG_NS, 'svg'), p = document.createElementNS(SVG_NS, 'path');
    if (cls) s.setAttribute('class', cls);
    s.setAttribute('viewBox', box); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    p.setAttribute('d', d); s.append(p);
    return s;
  };
  const check = () => icon('chk', '0 0 24 24', 'M5 12.6l4.6 4.6L19 7.6');
  const arrow = dir => icon('', '0 0 16 16', dir < 0 ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5');
  const shape = line => h('span', { class: 'shape shape--' + line.shape });
  const no = i => String(i + 1).padStart(2, '0');
  /** 가운뎃점 뒤에서 줄을 바꿀 수 있게 한다. */
  const breakable = text => text.split('·').flatMap((part, i) => (i ? ['·', document.createElement('wbr'), part] : [part]));
  const mark = (e, st) => { e.classList.toggle('is-soon', st === 'soon'); e.classList.toggle('is-done', st === 'done'); };
  const smooth = () => (still.matches ? 'auto' : 'smooth');
  const goRoute = () => $('#route').scrollIntoView({ behavior: smooth(), block: 'start' });
  const goStage = i => { const e = $('#stn-' + i); if (e) e.scrollIntoView({ behavior: smooth(), block: 'start' }); };

  let data, items, lines, dates = {}, done = new Set(), cur = { line: null, item: null };
  // 방문자 기준의 날짜(YYYY-MM-DD). 자료 날짜와 견주어 NEW·업데이트를 정한다.
  const today = (() => { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); })();
  /** NEW·업데이트 표시. 해당하지 않으면 null. */
  const badge = id => { const f = R.freshness(dates[id], today, FRESH_DAYS); return f ? h('span', { class: 'badge badge--' + f, text: f === 'new' ? 'NEW' : '업데이트' }) : null; };
  /** 자료 한 줄에 붙는 날짜. NEW인 동안과 내용이 바뀐 적이 없을 때는 공개한 날, 그 밖에는 마지막으로 바뀐 날. */
  const stamp = id => {
    const d = dates[id];
    if (!d) return null;
    const changed = d.updated !== d.added && R.freshness(d, today, FRESH_DAYS) !== 'new';
    return h('time', { class: 'exit__d', datetime: changed ? d.updated : d.added, text: changed ? d.updated + ' 업데이트' : d.added + ' 공개' });
  };
  const loadDone = () => { try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) || '[]')); } catch { return new Set(); } };
  const saveDone = () => { try { localStorage.setItem(DONE_KEY, JSON.stringify([...done])); } catch { /* 저장할 수 없는 환경에서는 화면에만 표시한다 */ } };

  // ── 첫 화면 노선도 ──
  function renderNet() {
    $('#net').replaceChildren(...data.lines.map((l, r) => {
      const bar = h('span', { class: 'net__bar' }, h('i', { class: 'net__run' }));
      const track = h('div', { class: 'net__track', vars: { '--s': l.col, '--n': l.stages.length } }, bar,
        l.stages.map((s, i) => {
          const open = s.items.filter(id => R.isOpen(items.get(id))).length;
          return h('button', { class: 'st', type: 'button', data: { stage: i }, vars: { '--i': i },
            'aria-label': l.name + ' ' + (i + 1) + '단계 ' + s.title + (open ? ', 자료 ' + open + '개' : ', 자료 준비 중'),
            on: { click: () => { select(l.id, R.stageEntry(s, items)); goStage(i); } } },
          h('span', { class: 'st__m' }, shape(l)), h('span', { class: 'st__l' }, breakable(R.shortTitle(s))));
        }));
      if (r === 1) track.insertBefore(h('span', { class: 'net__x', 'aria-hidden': 'true' }), bar.nextSibling);
      const id = h('button', { class: 'net__id', type: 'button', 'aria-pressed': 'false',
        on: { click: () => { select(l.id); goRoute(); }, pointerenter: () => run(l.id), focus: () => run(l.id) } },
      shape(l), h('span', { class: 'net__name', text: l.name }), h('span', { class: 'net__who', text: l.who }));
      return h('div', { class: 'net__row' + (r === 0 ? ' net__row--up' : ''), data: { line: l.id } }, id, track);
    }));
  }
  /** 노선을 따라 한 번 달리는 표시. 노선의 방향(왼쪽에서 오른쪽)을 보여 준다. */
  function run(lineId) {
    if (still.matches) return;
    const bar = $('.net__row[data-line="' + lineId + '"] .net__bar'), dot = bar && $('.net__run', bar);
    if (!dot || !bar.offsetWidth || dot.getAnimations().length) return;
    dot.animate([{ transform: 'translateX(0)', opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .88 }, { transform: 'translateX(' + bar.offsetWidth + 'px)', opacity: 0 }],
      { duration: 520 + bar.offsetWidth * .9, easing: 'cubic-bezier(.45,0,.3,1)' });
  }
  /** 첫 화면에서 한 번: 노선이 왼쪽부터 그려지고 단계가 차례로 찍힌다. 제목과 설명은 처음부터 보인다. */
  function intro() {
    if (still.matches) return;
    $$('.net__row').forEach((row, r) => {
      const sts = $$('.st', row), n = sts.length, base = 180 + r * 170, span = 520 + n * 48;
      $('.net__bar', row).animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: span + 160, delay: base, easing: 'cubic-bezier(.35,0,.25,1)', fill: 'backwards' });
      sts.forEach((b, i) => {
        const d = base + (n > 1 ? i / (n - 1) : 0) * span;
        $('.st__m', b).animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 440, delay: d, easing: POP, fill: 'backwards' });
        $('.st__l', b).animate([{ opacity: 0, transform: 'translateY(' + (r === 0 ? 6 : -6) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 440, delay: d + 90, easing: OUT, fill: 'backwards' });
      });
    });
    const x = $('.net__x');
    if (x) x.animate([{ transform: 'scaleY(0)', opacity: 0 }, { transform: 'scaleY(1)', opacity: 1 }], { duration: 460, delay: 1000, easing: OUT, fill: 'backwards' });
  }

  // ── 고른 로드맵 ──
  function renderTabs() {
    $('#tabs').replaceChildren(...data.lines.map(l => h('button', { class: 'tab', type: 'button', role: 'tab', 'aria-selected': 'false', data: { line: l.id }, on: { click: () => select(l.id) } }, shape(l), l.name)));
    $('#prog').replaceChildren(
      h('span', null, '자료 ', h('span', { id: 'prog-all' }), '개 중 ', h('b', { id: 'prog-done' }), ' 마침'),
      h('span', { class: 'prog__bar', 'aria-hidden': 'true' }, h('i', { id: 'prog-fill' })));
  }
  function renderRoute(animate) {
    const l = lines.get(cur.line), c = R.counts(l, items);
    $('#route').dataset.line = l.id;
    const head = $('#route-head');
    head.replaceChildren(h('h2', { text: l.name }),
      h('p', { text: l.lead + ' ' + c.stages + '개 단계에 공개 자료 ' + c.open + '개가 있습니다.' + (c.soon ? ' 준비 중인 자료는 ' + c.soon + '개입니다.' : '') }));
    const rail = $('#rail');
    rail.replaceChildren(...l.stages.map((s, i) => h('li', { class: 'stn', id: 'stn-' + i },
      h('span', { class: 'stn__seg' }), h('span', { class: 'stn__mark' }, shape(l)),
      h('div', { class: 'stn__head' }, h('span', { class: 'stn__no', text: no(i) }), h('h3', { class: 'stn__t', text: s.title }), h('p', { class: 'stn__d', text: s.summary }), s.note ? h('p', { class: 'stn__note', text: s.note }) : null),
      h('ul', { class: 'exits' }, s.items.map(id => {
        const m = items.get(id), soon = !R.isOpen(m), when = stamp(id);
        return h('li', null, h('button', { class: 'exit' + (soon ? ' is-soon' : ''), type: 'button', data: { id }, on: { click: () => { select(l.id, id); if (narrow.matches) openSheet(); } } },
          h('span', { class: 'exit__k', text: data.kinds[m.kind] }),
          h('span', null, h('span', { class: 'exit__t' }, m.title, badge(id)), h('span', { class: 'exit__m' }, soon ? '담당 ' + R.displayBy(data, m.by) : R.displayBy(data, m.by) + ', ' + m.meta, when ? ', ' : null, when)),
          check()));
      })))));
    if (l.next) {
      const n = lines.get(l.next.line);
      rail.append(h('li', { class: 'stn stn--next', data: { line: n.id } },
        h('button', { class: 'next', type: 'button', on: { click: () => { select(n.id); goRoute(); } } }, shape(n),
          h('span', null, h('small', { text: l.next.text }), h('strong', { text: '다음 로드맵: ' + n.name })))));
    }
    if (!animate || still.matches) return;
    $$('.stn', rail).forEach((li, i) => {
      const d = i * 70, seg = $('.stn__seg', li), mk = $('.stn__mark', li);
      if (seg) seg.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 560, delay: d + 110, easing: OUT, fill: 'backwards' });
      if (mk) mk.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 440, delay: d, easing: POP, fill: 'backwards' });
      Array.from(li.children).filter(c => c !== seg && c !== mk).forEach(c => c.animate([{ opacity: 0, transform: 'translateX(-12px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: d + 60, easing: OUT, fill: 'backwards' }));
    });
    head.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: OUT });
  }

  // ── 자료 안내판 ──
  function renderSign(dir, sameStage) {
    const l = lines.get(cur.line), m = items.get(cur.item), si = R.stageIndex(l, cur.item), s = l.stages[si], sign = $('#sign');
    sign.dataset.line = l.id;
    const adj = (i, d) => {
      const st = l.stages[i];
      if (!st) return h('span');
      return h('button', { class: 'sign__adj sign__adj--' + (d < 0 ? 'prev' : 'next'), type: 'button', 'aria-label': (d < 0 ? '이전' : '다음') + ' 단계: ' + st.title,
        on: { click: () => { select(l.id, R.stageEntry(st, items)); if (!narrow.matches) goStage(i); } } },
      d < 0 ? arrow(-1) : null, h('span', { text: R.shortTitle(st) }), d > 0 ? arrow(1) : null);
    };
    const open = (label, href, hint) => h('a', { class: 'open', href }, label, h('small', { text: hint }));
    const fact = (k, v) => (v ? [h('dt', { text: k }), h('dd', { text: v })] : []);
    let body;
    if (!R.isOpen(m)) {
      body = [h('p', { class: 'sign__k', text: data.kinds.soon }), h('h2', { class: 'sign__t', text: m.title }),
        h('div', { class: 'soonbox' }, '아직 본문이 올라오지 않은 자리입니다. 담당은 ', h('b', { text: R.displayBy(data, m.by) }), '입니다. 자료가 올라오면 이 자리에서 바로 열 수 있습니다.'),
        h('h3', { text: '지금 할 수 있는 것' }),
        h('div', { class: 'opens' },
          open('모듈 폴더 보기', R.repoUrl(data, { path: m.path, kind: 'dir' }), 'GitHub에서 열기'),
          open('이 자리를 함께 채우기', R.repoUrl(data, { path: 'CONTRIBUTING.md' }), '기여 안내'))];
    } else {
      const marked = done.has(m.id), d = dates[m.id] || {};
      body = [h('p', { class: 'sign__k' }, data.kinds[m.kind], badge(m.id)), h('h2', { class: 'sign__t', text: m.title }), h('p', { class: 'sign__sum', text: m.summary }),
        h('dl', { class: 'facts' }, fact('만든 사람', R.displayBy(data, m.by)), fact('구성', m.meta), fact('대상', m.audience), fact('선수 지식', m.prerequisite), fact('원제', m.original),
          fact('공개한 날', d.added), fact('업데이트한 날', d.updated !== d.added ? d.updated : null)),
        m.learn ? [h('h3', { text: '배우는 것' }), h('ul', { class: 'pts' }, m.learn.map(t => h('li', { text: t })))] : null,
        h('h3', { text: '이용 순서' }), h('ol', { class: 'steps' }, m.how.map(t => h('li', { text: t }))),
        h('h3', { text: '자료 열기' }), h('div', { class: 'opens' }, m.links.map(k => open(k.label, R.repoUrl(data, k), 'GitHub에서 열기'))),
        h('button', { class: 'done', type: 'button', 'aria-pressed': String(marked), on: { click: () => toggleDone(m.id) } }, check(), h('span', { text: marked ? '마친 자료로 표시됨' : '마친 자료로 표시' }))];
    }
    const here = h('div', { class: 'sign__here' }, h('span', { class: 'sign__no', text: no(si) }), h('span', { class: 'sign__name', text: R.shortTitle(s) }));
    const box = h('div', { class: 'sign__body' }, body);
    sign.replaceChildren(h('div', { class: 'sign__band' }, adj(si - 1, -1), here, adj(si + 1, 1)), box,
      h('button', { class: 'sign__close', type: 'button', text: '닫기', on: { click: closeSheet } }));
    sign.scrollTop = 0;
    if (still.matches) return;
    if (!sameStage) here.animate([{ opacity: 0, transform: 'translateX(' + (dir * 36) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: OUT });
    box.animate([{ opacity: 0, transform: 'translateY(' + (dir < 0 ? -12 : 12) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: OUT });
  }

  // ── 마친 자료 표시 ──
  function paint() {
    data.lines.forEach(l => { const row = $('.net__row[data-line="' + l.id + '"]'); l.stages.forEach((s, i) => mark($('.st[data-stage="' + i + '"]', row), R.stageState(s, items, done))); });
    const l = lines.get(cur.line), p = R.progress(l, items, done);
    l.stages.forEach((s, i) => { const e = $('#stn-' + i + ' .stn__mark'); if (e) mark(e, R.stageState(s, items, done)); });
    $$('.exit').forEach(b => b.classList.toggle('is-done', done.has(b.dataset.id)));
    $('#prog').dataset.line = l.id;
    $('#prog-all').textContent = String(p.total);
    $('#prog-done').textContent = p.done + '개';
    $('#prog-fill').style.transform = 'scaleX(' + (p.total ? p.done / p.total : 0) + ')';
  }
  function toggleDone(id) {
    const on = !done.has(id);
    if (on) done.add(id); else done.delete(id);
    saveDone(); paint();
    const b = $('.done');
    if (b) { b.setAttribute('aria-pressed', String(on)); $('span', b).textContent = on ? '마친 자료로 표시됨' : '마친 자료로 표시'; }
    if (!on || still.matches) return;
    data.lines.forEach(l => {
      const i = R.stageIndex(l, id);
      if (i < 0 || R.stageState(l.stages[i], items, done) !== 'done') return;
      const marks = [$('.net__row[data-line="' + l.id + '"] .st[data-stage="' + i + '"] .st__m')];
      if (l.id === cur.line) marks.push($('#stn-' + i + ' .stn__mark'));
      marks.forEach(e => e && e.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 560, easing: OUT }));
    });
  }

  // ── 고르기 ──
  function select(lineId, itemId) {
    const l = lines.get(lineId) || data.lines[0], changed = l.id !== cur.line, first = cur.line === null;
    const before = changed ? -1 : R.stageIndex(l, cur.item);
    if (!itemId || R.idsOf(l).indexOf(itemId) < 0) itemId = changed ? R.firstItem(l, items) : cur.item;
    cur = { line: l.id, item: itemId };
    if (changed) {
      $$('.tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.line === l.id)));
      $$('.net__id').forEach(b => b.setAttribute('aria-pressed', String(b.parentElement.dataset.line === l.id)));
      renderRoute(!first);
      if (!first) run(l.id);
    }
    $$('.exit').forEach(b => b.setAttribute('aria-current', String(b.dataset.id === itemId)));
    const now = R.stageIndex(l, itemId);
    renderSign(changed ? 0 : Math.sign(now - before), !changed && now === before);
    paint();
    if (!first) history.replaceState(null, '', '#' + l.id + '/' + itemId);
  }

  // ── 좁은 화면: 자료 안내판을 아래에서 올린다 ──
  function openSheet() { $('#sign').classList.add('is-open'); $('#scrim').hidden = false; document.documentElement.classList.add('is-locked'); }
  function closeSheet() { $('#sign').classList.remove('is-open'); $('#scrim').hidden = true; document.documentElement.classList.remove('is-locked'); }

  // ── 강사별 자료 ──
  function renderPeople() {
    $('#people-grid').replaceChildren(...data.people.map(p => h('div', { class: 'person' + (p.wide ? ' person--wide' : '') }, h('h3', { text: R.displayBy(data, p.name) }),
      p.groups.map(g => [h('h4', { text: g.label + ' ' + g.items.length + '개' }), h('ul', null, g.items.map(id => {
        const l = R.lineOfItem(data, id);
        return h('li', null, h('button', { class: 'plink', type: 'button', data: { line: l.id }, on: { click: () => { select(l.id, id); goStage(R.stageIndex(l, id)); if (narrow.matches) openSheet(); } } },
          shape(l), h('span', { class: 'plink__t' }, items.get(id).title, badge(id))));
      }))]))));
  }

  function start(json, dated) {
    data = json; ({ items, lines } = R.index(data)); done = loadDone();
    dates = (dated && dated.items) || {};
    renderNet(); renderTabs(); renderPeople();
    const from = R.parseHash(location.hash, data);
    select(from.line || data.lines[0].id, from.item);
    $('#scrim').addEventListener('click', closeSheet);
    addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
    narrow.addEventListener('change', closeSheet);
    addEventListener('hashchange', () => { const x = R.parseHash(location.hash, data); if (x.line && (x.line !== cur.line || (x.item && x.item !== cur.item))) select(x.line, x.item); });
    intro();
  }
  function fail() {
    document.body.dataset.state = 'error';
    $('#net').replaceChildren(h('p', { class: 'notice' }, '로드맵을 불러오지 못했습니다. 화면을 새로 고쳐 보세요. 계속 안 되면 ',
      h('a', { href: 'https://github.com/kosta-ai-lab/ai-native-sdlc/blob/main/courses/README.md', text: 'GitHub 저장소의 강의 목록' }), '에서 자료를 직접 열어 주세요.'));
  }

  // 날짜는 빌드가 git 이력에서 만든 파일이다. 없거나 못 읽어도 로드맵은 그대로 보여 준다.
  const dated = fetch(new URL('data/dates.json', document.baseURI)).then(r => (r.ok ? r.json() : null)).catch(() => null);
  fetch(new URL('data/roadmap.json', document.baseURI))
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(json => dated.then(d => start(json, d)))
    .catch(fail);
})();
