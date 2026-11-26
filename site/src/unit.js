// kosta-ai-lab 학습 로드맵: 단원 한눈에 보기 화면 동작 (Apache-2.0)
// 내용은 data/unit-<단원>.json에서 읽는다. 화면은 DOM API로만 만든다. 프롬프트·명령·출력은 가이드 문서와 같은지 검사(scripts/check.mjs)가 대조한다.
(() => {
  'use strict';
  const R = self.KostaRoadmap;
  const $ = (s, r = document) => r.querySelector(s);
  const DOC_BASE = 'https://github.com/kosta-ai-lab/ai-native-sdlc/blob/main/';
  const SITE = 'kosta-ai-lab 학습 로드맵';
  // '칸 읽는 법'에 보이는 순서. 단원이 따로 정한 칸(검증 실행에서 본 것, 더 해 보기 등)은 그 뒤에 오고, 단계 안에서는 한 줄을 다 쓴다.
  const KIND_ORDER = ['hand', 'do', 'check', 'decide', 'pass'];
  const STEP_MS = 2800;
  const still = matchMedia('(prefers-reduced-motion: reduce)');

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
  /** 글 안의 낱말 강조 표시를 요소로 바꾼다. 억음 부호로 감싼 부분은 code, 별표 두 개로 감싼 부분은 strong. */
  const rich = (text) => {
    const s = String(text), out = [], re = /\x60([^\x60]+)\x60|\*\*([^*]+)\*\*/g;
    let at = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > at) out.push(s.slice(at, m.index));
      out.push(m[1] != null ? h('code', { text: m[1] }) : h('strong', { text: m[2] }));
      at = m.index + m[0].length;
    }
    if (at < s.length) out.push(s.slice(at));
    return out;
  };
  const dot = (state, i) => h('span', { class: 'dot', data: { state }, text: String(i) });
  /** 출력 한 줄. [[ ]]로 감싼 부분은 눈여겨볼 곳으로 표시한다. */
  const termLine = ([cls, text]) => h('span', { class: cls || null }, String(text).split(/\[\[(.+?)\]\]/).map((p, i) => (i % 2 ? h('mark', { text: p }) : p)));
  const term = (t) => h('div', { class: 'term' },
    h('div', { class: 'term__cmd' }, t.cmd ? ['$ ', h('b', { text: t.cmd })] : t.title),
    h('pre', { class: 'term__out' }, t.out.map((l, i) => [i ? '\n' : null, termLine(l)])));

  let u, cur = -1, timer = 0, stns = [], panes = [];

  /** 한 줄에 놓을 칸 수: 한 줄을 다 쓰는 칸 사이에 이어서 놓이는 칸이 가장 많은 곳에 맞춘다. */
  const rowWidth = (lanes) => {
    let most = 0, run = 0;
    for (const l of lanes) { run = KIND_ORDER.includes(l.kind) ? run + 1 : 0; most = Math.max(most, run); }
    return most;
  };

  /** 칸 안의 조각 하나를 요소로 만든다. */
  function block(b) {
    if (b.p) return h('p', null, rich(b.p));
    if (b.label) return h('p', { class: 'b-label' }, rich(b.label));
    if (b.prompt) return [h('p', { class: 'b-label', text: u.promptLabel || 'AI에게 입력' }), h('p', { class: 'b-prompt', text: b.prompt })];
    if (b.code) return h('pre', { class: 'b-code', text: b.code });
    if (b.cmd) return h('pre', { class: 'b-cmd' }, b.cmd.split('\n').map((l, i, lines) => {
      // 명령 뒤에 붙은 주석(공백 두 칸 이상 뒤의 #)은 흐리게 보이고, 사이의 긴 공백은 한 칸으로 줄여 보인다
      const m = /^(.*?\S)\s{2,}(#.*)$/.exec(l);
      // 앞줄이 역슬래시로 끝나면 이어지는 줄이다. $를 붙이지 않는다
      const more = i > 0 && /\\\s*$/.test(lines[i - 1]);
      return [i ? '\n' : null, h('i', { text: more ? '  ' : '$ ' }), m ? [m[1], h('i', { class: 'b-cmd__c', text: '  ' + m[2] })] : l];
    }));
    if (b.term) return term(b.term);
    if (b.verdict) return h('p', { class: 'verdict verdict--' + b.verdict[0] }, h('span', null, rich(b.verdict[1])));
    if (b.ticks) return h('ul', { class: 'ticks' }, b.ticks.map((x) => h('li', { class: x.k ? 'is-' + x.k : null },
      h('i', { class: 'tick tick--' + (x.k || 'ok') }), h('div', null, rich(x.t), x.s ? h('small', null, rich(x.s)) : null))));
    if (b.outs) return h('ul', { class: 'outs' }, b.outs.map((x) => h('li', null, h('span', null, rich(x)))));
    if (b.list) return h('ul', { class: 'b-list' }, b.list.map((x) => h('li', null, rich(x))));
    if (b.next) return h('p', { class: 'next' }, h('span', null, rich(b.next)));
    if (b.table) return h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
      h('thead', null, h('tr', null, b.table.head.map((x) => h('th', { scope: 'col' }, rich(x))))),
      h('tbody', null, b.table.rows.map((r) => h('tr', null, r.map((x) => h('td', null, rich(x))))))));
    return null;
  }

  // ── 제목과 안내 ──
  function renderHead() {
    const parts = Array.isArray(u.title) ? u.title : [[u.title]];
    $('#title').replaceChildren(...parts.map(([text, tone]) => (tone ? h('span', { class: 'tone-' + tone, text }) : text)));
    document.title = parts.map((p) => p[0]).join('') + ' | ' + SITE;
    $('#lead').replaceChildren(...rich(u.lead));
    $('#where').textContent = u.where;
    $('#doc').href = DOC_BASE + u.guide.split('/').map(encodeURIComponent).join('/');
    $('#env').textContent = u.env || '';
    const used = new Set(u.steps.map((s) => s.state));
    const shown = (k) => used.has(k) || (used.has('both') && (k === 'bad' || k === 'good'));
    $('#key').replaceChildren(...Object.entries(u.marks || {}).filter(([k]) => shown(k)).map(([k, label]) => h('li', { class: 'k-' + k }, h('i'), label)),
      u.pips ? h('li', { class: 'k-pip' }, h('i'), u.pips) : '');
  }

  // ── 단계 선로와 고른 단계 ──
  function renderTrack() {
    const track = $('#track');
    track.style.setProperty('--n', String(u.steps.length));
    stns = u.steps.map((s, i) => h('button', { class: 'stn', id: 'stn-' + i, role: 'tab', type: 'button', 'aria-selected': 'false', 'aria-controls': 'pane-' + i, tabindex: '-1', on: { click: () => { stop(); select(i); } } },
      dot(s.state, i), h('span', { class: 'stn__name', text: s.name }),
      h('span', { class: 'stn__pips', role: s.pips ? 'img' : null, 'aria-label': s.pips ? s.pipsLabel : null },
        (s.pips || []).map((g, k) => [k ? h('i', { class: 'pip-arrow', text: '→' }) : null, g.map((p) => h('i', { class: 'pip pip--' + p }))])),
      h('span', { class: 'stn__out' }, (s.out || []).map((t) => h('span', { text: t })))));
    track.replaceChildren(h('div', { class: 'track__line', 'aria-hidden': 'true' }, h('span', { class: 'track__fill' })), ...stns);
    track.addEventListener('keydown', (e) => {
      const to = e.key === 'ArrowRight' ? cur + 1 : e.key === 'ArrowLeft' ? cur - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? u.steps.length - 1 : null;
      if (to === null) return;
      e.preventDefault(); stop(); select(to, { focus: true });
    });
  }
  function renderPanes() {
    const nav = (label, to) => h('button', { type: 'button', disabled: to < 0 || to > u.steps.length - 1, on: { click: () => { stop(); select(to); } } }, label);
    panes = u.steps.map((s, i) => h('article', { class: 'pane', id: 'pane-' + i, role: 'tabpanel', 'aria-labelledby': 'stn-' + i, hidden: true },
      h('header', { class: 'step__head' },
        h('h2', { class: 'step__title' }, dot(s.state, i), h('span', null, h('span', { class: 'step__unit', text: i + '단계 ' }), s.title)),
        s.note ? h('p', { class: 'step__note', text: s.note }) : null,
        h('div', { class: 'step__nav' }, nav('이전 단계', i - 1), nav('다음 단계', i + 1))),
      h('div', { class: 'lanes', vars: { '--k': Math.max(1, Math.min(4, rowWidth(s.lanes))) } }, s.lanes.map((l, k) => h('section', { class: 'lane' + (KIND_ORDER.includes(l.kind) ? '' : ' lane--wide'), vars: { '--i': k } },
        h('h3', { class: 'lane__h' }, h('span', { class: 'lane__no', text: String(k + 1) }), u.kinds[l.kind][0]),
        h('div', { class: 'lane__b' }, l.blocks.map(block)))))));
    $('#step').replaceChildren(h('span', { class: 'step__notch', 'aria-hidden': 'true' }), ...panes);
    const used = new Set(u.steps.flatMap((s) => s.lanes.map((l) => l.kind)));
    const order = [...KIND_ORDER.filter((k) => used.has(k)), ...[...used].filter((k) => !KIND_ORDER.includes(k))];
    $('#kinds').replaceChildren(h('p', { class: 'kinds__h', text: '칸 읽는 법' }), ...order.map((k) => h('div', null, h('dt', { text: u.kinds[k][0] }), h('dd', { text: u.kinds[k][1] }))));
  }
  function place() {
    if (cur < 0) return;
    const s = stns[cur], track = $('#track');
    const r = s.getBoundingClientRect(), b = $('#step').getBoundingClientRect();
    $('.step__notch').style.setProperty('--x', (r.left + r.width / 2 - b.left) + 'px');
    if (track.scrollWidth > track.clientWidth + 1) track.scrollTo({ left: Math.max(0, s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2), behavior: still.matches ? 'auto' : 'smooth' });
  }
  function select(i, opt) {
    opt = opt || {};
    i = Math.max(0, Math.min(u.steps.length - 1, i));
    if (i === cur) return;
    cur = i;
    stns.forEach((s, k) => { s.setAttribute('aria-selected', String(k === i)); s.tabIndex = k === i ? 0 : -1; });
    panes.forEach((p, k) => { p.hidden = k !== i; p.classList.remove('is-in'); });
    void panes[i].offsetWidth;
    panes[i].classList.add('is-in');
    $('.track__fill').style.setProperty('--p', String(u.steps.length > 1 ? i / (u.steps.length - 1) : 0));
    place();
    if (opt.focus) stns[i].focus();
    if (!opt.silent) history.replaceState(null, '', '#s' + i);
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = 0; }
    const b = $('#play');
    b.setAttribute('aria-pressed', 'false'); b.textContent = '처음부터 차례로 보기';
  }
  function start() {
    stop(); select(0);
    const b = $('#play');
    b.setAttribute('aria-pressed', 'true'); b.textContent = '멈추기';
    timer = setInterval(() => { if (cur >= u.steps.length - 1) { stop(); return; } select(cur + 1); }, STEP_MS);
  }

  // ── 단원마다 다른 구역 ──
  function chain(s) {
    const box = h('div', { class: 'chain', vars: { '--c': s.cols.length } }, s.cols.map(([t, sub]) => h('div', { class: 'chain__hd' }, t, sub ? h('small', { text: sub }) : null)));
    const light = (row) => box.querySelectorAll('.chain__c').forEach((c) => { c.classList.toggle('is-on', row !== null && c.dataset.row === row); c.classList.toggle('is-off', row !== null && c.dataset.row !== row); });
    s.rows.forEach((row, r) => row.forEach((cell, c) => box.append(h('div', {
      class: 'chain__c' + (c === row.length - 1 ? ' is-last' : '') + (c === 0 ? ' is-first' : '') + (r === 0 ? ' is-top' : ''), tabindex: '0', data: { row: String(r) },
      on: { mouseenter: () => light(String(r)), focus: () => light(String(r)), mouseleave: () => light(null), blur: () => light(null) }
    }, h('span', { class: 'chain__lb', text: s.cols[c][0] }), rich(cell)))));
    return box;
  }
  function compare(s) {
    const cols = s.cols.map((c) => h('div', { class: 'duo__col' }, h('p', { class: 'duo__cap', text: c.cap }), c.blocks.map(block)));
    const bridged = s.mid && cols.length === 2;
    return h('div', { class: 'duo' + (bridged ? '' : ' duo--plain') }, bridged ? [cols[0], h('p', { class: 'duo__mid' }, h('span', null, rich(s.mid))), cols[1]] : cols);
  }
  function renderSections() {
    $('#sections').replaceChildren(...(u.sections || []).map((s) => h('section', { class: 'sec' }, h('div', { class: 'wrap' },
      h('h2', { class: 'sec__h', text: s.title }), s.lead ? h('p', { class: 'sec__p' }, rich(s.lead)) : null,
      s.type === 'compare' ? compare(s) : s.type === 'chain' ? chain(s) : s.type === 'table' ? block({ table: s }) : null,
      s.note ? h('p', { class: 'sec__note' }, rich(s.note)) : null))));
  }

  function show(json) {
    u = json;
    renderHead(); renderTrack(); renderPanes(); renderSections();
    $('#play').addEventListener('click', () => (timer ? stop() : start()));
    addEventListener('resize', place);
    const m = /^#s(\d+)$/.exec(location.hash);
    select(m && Number(m[1]) < u.steps.length ? Number(m[1]) : (Number.isInteger(u.start) ? u.start : 0), { silent: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  }
  function fail() {
    document.body.dataset.state = 'error';
    $('#lap').hidden = true;
    $('#title').textContent = '단원을 불러오지 못했습니다';
    $('#lead').replaceChildren('주소가 바뀌었거나 아직 올라오지 않은 단원입니다. ', h('a', { href: 'index.html', text: '학습 로드맵' }), '에서 자료를 다시 골라 주세요.');
  }

  const id = new URLSearchParams(location.search).get('u') || '';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail();
  else fetch(new URL('data/unit-' + id + '.json', document.baseURI)).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(show).catch(fail);
})();
