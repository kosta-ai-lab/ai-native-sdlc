// kosta-ai-lab 학습 로드맵: 영상 자료 화면 동작 (Apache-2.0)
// 영상 목록은 data/videos.json에서 읽는다. 화면은 DOM API로만 만든다.
// 영상은 끼워 넣지 않고 유튜브 주소로만 연결한다. 섬네일은 유튜브의 그림 서버에서 리퍼러 없이 불러온다(ADR 0008).
(() => {
  'use strict';
  const R = self.KostaRoadmap;
  const $ = (s, r = document) => r.querySelector(s);
  // 주소는 영상 번호와 채널 번호로만 만든다. 데이터에 주소를 통째로 적지 않는다.
  const WATCH = 'https://www.youtube.com/watch?v=';
  const CHANNEL = 'https://www.youtube.com/channel/';
  const THUMB = 'https://i.ytimg.com/vi/';
  const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
  const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
  const VIEWS = ['kind', 'new'];
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const newest = (a, b) => (a.v.date < b.v.date ? 1 : a.v.date > b.v.date ? -1 : 0);

  /** 요소를 만든다. props: class, text, on(이벤트), 그 밖은 속성. */
  const h = (tag, props, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'on') for (const [n, fn] of Object.entries(v)) e.addEventListener(n, fn);
      else e.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of R.flatKids(kids)) e.append(c);
    return e;
  };
  /** 초를 읽어 주는 글로: '1시간 13분 29초', '11분 22초', '54초'. */
  const spoken = (sec) => {
    const s = Math.max(0, Math.round(sec)), hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return [hh ? hh + '시간' : '', mm ? mm + '분' : '', ss || (!hh && !mm) ? ss + '초' : ''].filter(Boolean).join(' ');
  };
  /** 초를 '분:초' 또는 '시:분:초'로. */
  const clock = (sec) => {
    const s = Math.max(0, Math.round(sec)), hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = String(s % 60).padStart(2, '0');
    return hh ? hh + ':' + String(mm).padStart(2, '0') + ':' + ss : mm + ':' + ss;
  };
  /** 찾기: 띄어쓰기와 대소문자를 가리지 않는다. */
  const fold = (s) => String(s).toLowerCase().replace(/\s+/g, '');

  let d, cards = [], reels = [], mixed = null, countTimer = 0;
  const state = { view: 'kind', who: '', topic: '', q: '' };

  /** 영상 하나. 읽는 순서는 제목, 형식(최신순 보기에서만), 사람과 날짜, 주제, 길이다. 섬네일은 꾸밈이라 읽지 않는다. */
  function card(v, kind) {
    const who = v.by.map((n) => d.names[n] || n).join(', ');
    const img = h('img', { src: THUMB + v.id + '/hqdefault.jpg', alt: '', width: '480', height: '360', loading: 'lazy', decoding: 'async', referrerpolicy: 'no-referrer' });
    const pic = h('span', { class: 'card__pic' }, img, h('span', { class: 'card__len', 'aria-hidden': 'true', text: clock(v.seconds) }));
    // 그림을 못 받으면 회색 칸으로 둔다. 내려간 영상이면 유튜브가 120×90 회색 그림을 주므로 그것도 못 받은 것으로 본다.
    img.addEventListener('error', () => pic.classList.add('is-missing'), { once: true });
    img.addEventListener('load', () => { if (img.naturalWidth <= 120) pic.classList.add('is-missing'); }, { once: true });
    const el = h('li', { class: 'card' }, h('a', { class: 'card__a', href: WATCH + v.id },
      pic,
      h('span', { class: 'card__body' },
        h('span', { class: 'card__title', text: v.title }), ' ',
        h('span', { class: 'card__meta' }, h('span', { class: 'card__kind', text: kind.name }), ' ', h('span', { text: who }), ' ', h('span', { class: 'card__date', text: v.date }), kind.shape === 'wide' && v.series ? [' ', h('span', { text: v.series })] : null),
        h('span', { class: 'card__topic', text: d.topics[v.topic] }),
        h('span', { class: 'sr', text: ', 길이 ' + spoken(v.seconds) + ', 유튜브에서 열기' }))));
    return { el, v, hay: fold([v.title, v.yt, who, v.series || '', d.topics[v.topic], kind.name].join(' ')) };
  }

  /** 고르기 버튼은 한 번만 만든다. 누를 때는 눌림 상태와 편수만 바꿔서 키보드 초점이 그 버튼에 남게 한다. */
  function chips(box, key, items) {
    box.replaceChildren(...items.map(([val, label, withCount]) => h('button', {
      type: 'button', 'data-val': val, 'data-label': label, 'aria-pressed': 'false', on: { click: () => { state[key] = val; apply(); } }
    }, label, withCount ? h('small') : null)));
  }

  function build() {
    const vids = d.videos.filter((v) => VIDEO_ID.test(v.id));
    chips($('#view'), 'view', [['kind', '형식별', false], ['new', '최신순', false]]);
    chips($('#who'), 'who', [['', '전체', true], ...Object.keys(d.names).map((n) => [n, d.names[n], true])]);
    chips($('#pick'), 'topic', [['', '전체', true], ...Object.entries(d.topics).map(([k, label]) => [k, label, true])]);
    reels = Object.entries(d.kinds).map(([k, kind]) => {
      const list = vids.filter((v) => v.kind === k).map((v) => card(v, kind)).sort(newest);
      cards.push(...list);
      const n = h('span', { class: 'reel__n' });
      const grid = h('ol', { class: 'grid grid--' + kind.shape });
      const el = h('section', { class: 'reel', id: 'k-' + k, 'aria-labelledby': 'reel-' + k }, h('div', { class: 'wrap' },
        h('header', { class: 'reel__head' }, h('h2', { class: 'reel__h', id: 'reel-' + k, text: kind.name }), h('p', { class: 'reel__p', text: kind.about }), n), grid));
      const jn = h('small');
      // 건너뛰기는 주소의 # 뒤(고른 사람·주제)를 바꾸지 않고 그 묶음으로 스크롤만 한다.
      const jump = h('a', { href: '#k-' + k, on: { click: (e) => { e.preventDefault(); el.scrollIntoView({ block: 'start' }); $('#reel-' + k).focus({ preventScroll: true }); } } }, kind.name, jn);
      $('#reel-' + k, el).setAttribute('tabindex', '-1');
      return { k, kind, el, grid, list, n, jump, jn };
    }).filter((r) => r.list.length);
    cards.sort(newest);
    const mn = h('span', { class: 'reel__n' });
    mixed = { n: mn, grid: h('ol', { class: 'grid grid--wide grid--mixed' }) };
    mixed.el = h('section', { class: 'reel', id: 'k-all', 'aria-labelledby': 'reel-all' }, h('div', { class: 'wrap' },
      h('header', { class: 'reel__head' }, h('h2', { class: 'reel__h', id: 'reel-all', text: '최신순' }), h('p', { class: 'reel__p', text: '모든 형식을 최근에 올라온 것부터 놓았습니다. 쇼츠도 가로 섬네일로 보입니다.' }), mn), mixed.grid));
    $('#list').replaceChildren(...reels.map((r) => r.el), mixed.el);
    $('#jump').replaceChildren(...reels.map((r) => r.jump));
  }

  /** 보기를 바꾸면 카드를 옮겨 담는다. 카드와 그림은 새로 만들지 않는다. */
  function layout() {
    if (state.view === 'new') mixed.grid.replaceChildren(...cards.map((c) => c.el));
    else for (const r of reels) r.grid.replaceChildren(...r.list.map((c) => c.el));
    mixed.el.hidden = state.view !== 'new';
  }

  function apply(opt) {
    opt = opt || {};
    const q = fold(state.q);
    const match = (c, skip) => (skip === 'who' || !state.who || c.v.by.includes(state.who)) && (skip === 'topic' || !state.topic || c.v.topic === state.topic) && (!q || c.hay.includes(q));
    let shown = 0;
    for (const c of cards) { const ok = match(c); c.el.hidden = !ok; if (ok) shown += 1; }
    if (!opt.keepLayout) layout();
    for (const r of reels) {
      const n = r.list.filter((c) => !c.el.hidden).length;
      r.el.hidden = state.view === 'new' || !n;
      r.jump.hidden = state.view === 'new' || !n;
      r.n.textContent = n + '편'; r.jn.textContent = String(n);
      r.jump.setAttribute('aria-label', r.kind.name + ' ' + n + '편');
    }
    mixed.n.textContent = shown + '편';
    if (state.view === 'new' && !shown) mixed.el.hidden = true;
    // 버튼의 편수는 다른 쪽 조건(사람이면 주제와 찾기, 주제면 사람과 찾기)을 넣은 채 센다.
    for (const [box, key] of [['#view', 'view'], ['#who', 'who'], ['#pick', 'topic']]) {
      for (const b of document.querySelectorAll(box + ' button')) {
        const val = b.getAttribute('data-val');
        b.setAttribute('aria-pressed', String(val === state[key]));
        const small = b.querySelector('small');
        if (!small) continue;
        const n = cards.filter((c) => match(c, key) && (!val || (key === 'who' ? c.v.by.includes(val) : c.v.topic === val))).length;
        small.textContent = String(n);
        b.setAttribute('aria-label', b.getAttribute('data-label') + ' ' + n + '편');
      }
    }
    const say = shown === cards.length ? '영상은 모두 ' + cards.length + '편입니다.' : '영상 ' + cards.length + '편 가운데 ' + shown + '편을 보여 줍니다.';
    // 찾기 칸에 글자를 칠 때마다 읽히지 않게, 입력이 멈춘 뒤에 알린다.
    clearTimeout(countTimer);
    if (opt.typing) countTimer = setTimeout(() => { $('#count').textContent = say; }, 450);
    else $('#count').textContent = say;
    $('#empty').hidden = shown > 0;
    if (!opt.silent) save();
  }

  /** 보기, 사람, 주제는 주소의 # 뒤에 남겨, 그 주소를 그대로 나눠 줄 수 있게 한다. 예: #view=new&topic=arch&who=박준성 */
  function save() {
    const p = new URLSearchParams();
    if (state.view !== 'kind') p.set('view', state.view);
    if (state.topic) p.set('topic', state.topic);
    if (state.who) p.set('who', state.who);
    const s = p.toString();
    if (s !== location.hash.slice(1)) history.replaceState(null, '', s ? '#' + s : location.pathname + location.search);
  }
  /** 주소의 #을 읽는다. '#k-short'처럼 묶음 이름이면 그 묶음으로 간다. */
  function load() {
    const raw = location.hash.slice(1);
    if (/^k-[a-z]+$/.test(raw)) return raw;
    const p = new URLSearchParams(raw.includes('=') ? raw : '');
    const v = p.get('view') || '', t = p.get('topic') || '', w = p.get('who') || '';
    state.view = VIEWS.includes(v) ? v : 'kind';
    state.topic = has(d.topics, t) ? t : '';
    state.who = has(d.names, w) ? w : '';
    return '';
  }

  function show(json) {
    d = json;
    build();
    const go = load();
    apply({ silent: true });
    if (go && $('#' + go)) $('#' + go).scrollIntoView({ block: 'start' });
    addEventListener('hashchange', () => { load(); apply({ silent: true }); });
    $('#q').addEventListener('input', (e) => { state.q = e.target.value; apply({ silent: true, typing: true }); });
    $('#reset').addEventListener('click', () => { state.who = ''; state.topic = ''; state.q = ''; $('#q').value = ''; apply(); $('#q').focus(); });
    const chans = Object.values(d.channels).filter((c) => CHANNEL_ID.test(c.id));
    $('#source').replaceChildren(...R.flatKids(['채널: ', chans.map((c, i) => [i ? ', ' : null, h('a', { href: CHANNEL + c.id, text: c.name })]), '. 주소를 마지막으로 확인한 날은 ' + d.checked + '입니다.']));
  }
  function fail() {
    document.body.dataset.state = 'error';
    $('#title').textContent = '영상 목록을 불러오지 못했습니다';
    $('#list').replaceChildren(h('div', { class: 'wrap' }, h('p', { class: 'notice' }, '잠시 뒤에 다시 열어 주세요. ', h('a', { href: 'index.html', text: '학습 로드맵' }), '은 그대로 볼 수 있습니다.')));
  }

  fetch(new URL('data/videos.json', document.baseURI)).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(show).catch(fail);
})();
