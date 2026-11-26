// kosta-ai-lab 학습 로드맵: 영상 자료 화면 동작 (Apache-2.0)
// 영상 목록은 data/videos.json에서 읽는다. 화면은 DOM API로만 만든다. 영상은 끼워 넣지 않고 유튜브 주소로만 연결한다.
(() => {
  'use strict';
  const R = self.KostaRoadmap;
  const $ = (s, r = document) => r.querySelector(s);
  // 주소는 영상 번호와 채널 번호로만 만든다. 데이터에 주소를 통째로 적지 않는다.
  const WATCH = 'https://www.youtube.com/watch?v=';
  const CHANNEL = 'https://www.youtube.com/channel/';
  const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
  const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;

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

  let d, topic = '';

  function row(v) {
    const who = v.by.map((n) => d.names[n] || n).join(', ');
    // 읽는 순서는 제목, 정보, 길이, 여는 곳이다. 길이는 스타일로 왼쪽에 놓는다.
    return h('li', null, h('a', { class: 'v', href: WATCH + v.id },
      h('span', { class: 'v__main' },
        h('span', { class: 'v__title', text: v.title }),
        ' ', h('span', { class: 'v__meta' }, [v.date, who, v.series, d.topics[v.topic]].filter(Boolean).map((t) => [h('span', { text: t }), ' ']))),
      h('span', { class: 'v__time' }, h('span', { class: 'sr', text: '길이 ' + spoken(v.seconds) }), h('span', { 'aria-hidden': 'true', text: clock(v.seconds) })),
      ' ', h('span', { class: 'v__go', text: '유튜브에서 열기' })));
  }
  /** 주제 버튼은 한 번만 만든다. 누를 때는 눌림 상태만 바꿔서 키보드 초점이 그 버튼에 남게 한다. */
  function renderPick(all) {
    $('#pick').replaceChildren(...[['', '전체'], ...Object.entries(d.topics)].map(([k, label]) => {
      const n = k ? all.filter((v) => v.topic === k).length : all.length;
      return h('button', { type: 'button', 'data-topic': k, 'aria-pressed': String(k === topic), 'aria-label': label + ' ' + n + '편', on: { click: () => { topic = k; render(); } } }, label, h('small', { text: String(n) }));
    }));
  }
  function render() {
    const all = d.videos.filter((v) => VIDEO_ID.test(v.id));
    const shown = all.filter((v) => !topic || v.topic === topic);
    for (const b of document.querySelectorAll('#pick button')) b.setAttribute('aria-pressed', String(b.getAttribute('data-topic') === topic));
    $('#count').textContent = topic ? '영상 ' + all.length + '편 가운데 ' + shown.length + '편을 보여 줍니다.' : '영상은 모두 ' + all.length + '편입니다.';
    $('#list').replaceChildren(...Object.entries(d.kinds).map(([k, [name, about]]) => {
      const list = shown.filter((v) => v.kind === k).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      if (!list.length) return null;
      return h('section', { class: 'reel reel--' + k, 'aria-labelledby': 'reel-' + k }, h('div', { class: 'wrap' },
        h('header', { class: 'reel__head' }, h('h2', { class: 'reel__h', id: 'reel-' + k, text: name }), h('p', { class: 'reel__p', text: about }), h('span', { class: 'reel__n', text: list.length + '편' })),
        h('ol', { class: 'reel__list' }, list.map(row))));
    }));
  }
  function show(json) {
    d = json;
    renderPick(d.videos.filter((v) => VIDEO_ID.test(v.id)));
    render();
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
