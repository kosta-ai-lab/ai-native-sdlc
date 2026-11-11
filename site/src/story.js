/* kosta-ai-lab 포털 — 스크롤 스토리 화면 (Apache-2.0). 영역 펼침·자료 상세 겹 화면은 layers.js(KLayers)가 단독 소유한다.
   본문은 정상 문서 스크롤로 읽고, sticky 무대의 SVG 조각은 스크롤 거리에 선형으로 연동된다(관성·smoothing 없음).
   데이터: data/portal.json, data/sources.json(같은 폴더). 진도·사용자 정보는 저장하지 않는다. */
(function () {
  'use strict';

  var M = window.MotionA;
  var NS = 'http://www.w3.org/2000/svg';
  var REPO = 'https://github.com/kosta-ai-lab/ai-native-sdlc';
  var ORG = 'https://github.com/kosta-ai-lab';
  var html = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var mq = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
  var reduceQ = mq('(prefers-reduced-motion: reduce)');
  var narrowQ = mq('(max-width: 860px)');

  var TYPE = {
    'module': '모듈 문서', 'module-group': '모듈 폴더', 'rules': '작업 규칙', 'automation': '자동화', 'sample': '코드 예제',
    'method': '방법론', 'guide': '안내', 'record': '기록', 'policy': '운영 정책', 'license': '라이선스', 'course': '강의 안내',
    'course-index': '강의 목록', 'template': '견본', 'lab': '실습', 'resource': '참고 자료', 'slides': '발표 자료(PPTX)', 'slides-pdf': '교재 PDF'
  };

  var data = null;
  var src = {};
  var areaById = {};
  var steps = [];
  var anchors = [];
  var states = [];
  var names = [];
  var view = { pieces: {}, labels: {}, lines: {}, cam: null, mats: null, lineGroup: null };
  var last = { scene: -1, chapter: null, mobile: null };
  var pending = false;

  /* ── DOM 도우미 ── */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v; else n.setAttribute(k, v === true ? '' : String(v));
    });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function svg(tag, attrs, kids) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] != null) n.setAttribute(k, String(attrs[k])); });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function svgText(x, y, anchor, cls, text) { var t = svg('text', { x: x, y: y, 'text-anchor': anchor, class: cls }); t.textContent = text; return t; }
  function ext() { var s = svg('svg', { viewBox: '0 0 12 12', class: 'i-ext', 'aria-hidden': 'true', focusable: 'false' }, [svg('path', { d: 'M4 2h6v6M10 2 3 9' })]); return s; }
  function num(i) { return String(i + 1).padStart(2, '0'); }
  function safe(url) { return typeof url === 'string' && (url === ORG || url === REPO || url.indexOf(REPO + '/') === 0) ? url : null; }
  function srcLink(id, label, cls) {
    var s = src[id];
    if (!s || !safe(s.url)) return null;
    return el('a', { class: cls || 'link', href: s.url }, [label || s.title, ext(), el('span', { class: 'sr-only', text: ' (GitHub 원본)' })]);
  }
  function goLink(id, label, cls) {
    var s = src[id];
    if (!s || !safe(s.url)) return null;
    return el('a', { class: cls || 'golink', href: s.url }, [el('span', { class: 'golink__label', text: label }), el('span', { class: 'golink__dest', text: 'GitHub' }), ext()]);
  }
  function chip(availability) {
    var label = (data.statusLabels.topic || {})[availability] || availability;
    return el('span', { class: 'chip chip--' + availability, text: label });
  }
  function resChip(status) { return el('span', { class: 'chip chip--available', text: (data.statusLabels.resource || {})[status] || status }); }
  function areaTitle(id) { return areaById[id] ? areaById[id].title : id; }
  function openAreaBtn(a, cls, label) { return el('button', { type: 'button', class: cls, 'data-open-area': a.id, 'aria-label': a.title + ' ' + label }, [label, el('span', { class: 'btn__mark', 'aria-hidden': 'true' })]); }
  function openItemBtn(key, title, cls, label, tail) {
    return el('button', { type: 'button', class: cls, 'data-open-item': key, 'aria-haspopup': 'dialog', 'aria-label': tail ? title + tail : title + ' ' + label }, tail ? [label, el('span', { class: 'linkbtn__tail', 'aria-hidden': 'true', text: tail })] : [label]);
  }
  function areaIndex(id) { for (var i = 0; i < data.areas.length; i++) if (data.areas[i].id === id) return i; return -1; }

  /* ── 모바일 목차 ── */
  function initToc() {
    var btn = $('toc-toggle');
    var nav = $('toc');
    var open = false;
    html.classList.add('has-js');
    function set(v, back) {
      open = v;
      btn.setAttribute('aria-expanded', v ? 'true' : 'false');
      btn.querySelector('.toc-toggle__label').textContent = v ? '닫기' : '목차';
      nav.classList.toggle('is-open', v);
      if (!v && back) btn.focus();
    }
    btn.addEventListener('click', function () { set(!open); });
    nav.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) set(false); });
    if (window.KLayers) window.KLayers.registerToc({ isOpen: function () { return open; }, close: function (back) { set(false, back); } });
    else document.addEventListener('keydown', function (e) { if (open && e.key === 'Escape') set(false, true); });
    var wide = mq('(min-width: 861px)');
    var onWide = function (e) { if (e.matches) set(false); };
    if (wide.addEventListener) wide.addEventListener('change', onWide);
  }

  /* ── 본문 렌더 ── */
  function hasDoc(t) { var s = src[t.module]; return !!(s && s.kind === 'file' && safe(s.url)); }
  // 주제 상태 두 축: '연결 자료'(공개 자료가 있는지)와 '모듈 원문 상태'(모듈 문서 자체의 작성 상태)를 같은 위치·같은 중요도로 둔다.
  function moduleLine(t) {
    return el('div', { class: 'status' }, [
      el('dl', { class: 'status__pair' }, [
        el('div', { class: 'status__row' }, [el('dt', { text: '연결 자료' }), el('dd', null, [chip(t.availability)])]),
        el('div', { class: 'status__row' }, [el('dt', { text: '모듈 원문 상태' }), el('dd', { class: 'status__val', text: t.sourceStatus })])
      ]),
      el('p', { class: 'module' }, [
        '담당 ' + t.owner,
        t.modulePending ? el('span', { class: 'module__pending', text: ' · 목적 작성 예정' }) : null,
        hasDoc(t) ? ' · ' : null,
        hasDoc(t) ? srcLink(t.module, '모듈 문서 열기', 'link link--small') : null
      ])
    ]);
  }
  function sourceList(ids, label, t) {
    var items = (ids || []).map(function (id) {
      var s = src[id];
      return s ? el('li', null, [el('span', { class: 'src__type', text: TYPE[s.type] || '자료' }), srcLink(id, s.title)]) : null;
    }).filter(Boolean);
    if (items.length) return el('ul', { class: 'src', 'aria-label': label }, items);
    return t ? null : el('p', { class: 'empty', text: '아직 연결된 공개 자료가 없습니다.' }); // 주제는 상태 줄의 '준비 중'으로 충분
  }
  function topicItem(t, attrs) {
    return el('li', Object.assign({ class: 'topic topic--' + t.availability }, attrs || {}), [
      el('h4', { class: 'topic__title', text: t.title }),
      moduleLine(t),
      sourceList(t.related, t.title + ' 연결된 공개 자료', t)
    ]);
  }
  function relatedOf(areaId) {
    var out = [];
    data.resources.forEach(function (r) { if ((r.areas || []).indexOf(areaId) !== -1) out.push({ key: 'res:' + r.id, href: '#res-' + r.id, type: r.type, status: r.status, title: r.title }); });
    data.courses.forEach(function (c) { if (c.areas.indexOf(areaId) !== -1) out.push({ key: 'course:' + c.id, href: '#course-' + c.id, type: '강의', status: c.status, title: c.title }); });
    return out;
  }

  function renderPicks() {
    var picks = data.courses.filter(function (c) { return c.pick; });
    var list = $('pick-list');
    if (!list) return;
    list.textContent = '';
    picks.forEach(function (c) {
      list.appendChild(el('li', { class: 'pick' }, [
        el('p', { class: 'pick__label', text: c.pick }),
        el('a', { class: 'pick__title', href: '#course-' + c.id }, [c.title, el('span', { class: 'pick__go', 'aria-hidden': 'true', text: '↓' })]),
        c.goal ? el('p', { class: 'pick__goal', text: c.goal }) : null
      ]));
    });
    $('hero-picks').hidden = !picks.length;
  }

  function renderAreas() {
    var host = $('area-steps');
    host.textContent = '';
    data.areas.forEach(function (a, i) {
      var topics = data.topics.filter(function (t) { return t.area === a.id; });
      var rel = relatedOf(a.id);
      var exts = data.extensions.filter(function (x) { return (x.relatedAreas || []).indexOf(a.id) !== -1; });
      host.appendChild(el('section', { class: 'step step--area', id: 'area-' + a.id, 'data-step': true, tabindex: '-1', 'aria-labelledby': 'area-' + a.id + '-title' }, [
        el('span', { class: 'step__rail', 'aria-hidden': 'true' }),
        el('p', { class: 'step__label', text: '[ 02·' + (i + 1) + ' ] 영역 ' + num(i) + ' / ' + num(data.areas.length - 1) }),
        el('h3', { class: 'step__title step__title--area', id: 'area-' + a.id + '-title', text: a.title }),
        el('p', { class: 'step__lede', text: a.summary }),
        el('p', { class: 'step__meta', text: '주요 주제 ' + topics.length + ' · 연결 자료 ' + rel.length }),
        openAreaBtn(a, 'btn btn--open step__open', '이 영역 펼쳐 보기'),
        el('ul', { class: 'topics', 'aria-label': a.title + ' 주요 주제' }, topics.map(function (t) {
          return topicItem(t, { id: 'topic-' + t.id, tabindex: '-1' });
        })),
        el('div', { class: 'related' }, [
          el('h4', { class: 'related__title', text: '이 영역과 연결된 강의·예제' }),
          rel.length ? el('ul', { class: 'related__list' }, rel.map(function (r) {
            return el('li', { 'data-card': true }, [el('span', { class: 'src__type', text: r.type + ' · ' + ((data.statusLabels.resource || {})[r.status] || r.status) }), openItemBtn(r.key, r.title, 'linkbtn', r.title, ' 정보 보기')]);
          })) : el('p', { class: 'empty', text: '아직 연결된 공개 자료가 없습니다.' }),
          exts.length ? el('p', { class: 'related__ext' }, ['연결되는 확장 주제: '].concat(exts.map(function (x, j) {
            return el('span', null, [j ? ', ' : '', el('a', { class: 'link', href: '#ext-' + x.id, text: x.title })]);
          }))) : null
        ])
      ]));
    });

    host.appendChild(el('section', { class: 'step step--ext', id: 'extensions', 'data-step': true, tabindex: '-1', 'aria-labelledby': 'ext-title' }, [
      el('span', { class: 'step__rail', 'aria-hidden': 'true' }),
      el('p', { class: 'step__label', text: '[ 02·' + (data.areas.length + 1) + ' ] 확장 주제' }),
      el('h3', { class: 'step__title step__title--area', id: 'ext-title', text: '관련 영역에서 이어지는 확장 주제' }),
      el('div', { class: 'exts' }, data.extensions.map(function (x) {
        var s = src[x.module];
        return el('article', { class: 'ext', id: 'ext-' + x.id, tabindex: '-1', 'aria-labelledby': 'ext-' + x.id + '-title' }, [
          el('h4', { class: 'ext__title', id: 'ext-' + x.id + '-title', text: x.title }),
          el('p', { class: 'ext__summary', text: x.summary }),
          el('p', { class: 'ext__from' }, ['연결 영역 · '].concat((x.relatedAreas || []).map(function (id, j) {
            return el('span', null, [j ? ', ' : '', el('a', { class: 'link', href: '#area-' + id, text: areaTitle(id) })]);
          }))),
          moduleLine(x),
          sourceList(x.related, x.title + ' 세부 주제', x),
          s && s.kind === 'dir' ? el('p', { class: 'ext__module' }, [srcLink(x.module, '모듈 폴더 열기', 'link')]) : null // 파일 모듈은 상태 줄에 링크가 있다
        ]);
      }))
    ]));

    var idx = $('area-index');
    idx.textContent = '';
    data.areas.forEach(function (a, i) {
      var ts = data.topics.filter(function (t) { return t.area === a.id; });
      var open = ts.filter(function (t) { return t.availability === 'available'; }).length;
      idx.appendChild(el('li', null, [el('button', { type: 'button', class: 'area-index__open', 'data-open-area': a.id, 'aria-label': a.title + (a.hint ? ' — ' + a.hint : '') + ', 주제 ' + ts.length + '개 중 공개 자료 있음 ' + open + '개. 영역 열기' }, [
        el('span', { class: 'area-index__num', 'aria-hidden': 'true', text: num(i) }),
        el('span', { class: 'area-index__text' }, [
          el('span', { class: 'area-index__name', text: a.title }),
          a.hint ? el('span', { class: 'area-index__hint', text: a.hint }) : null
        ]),
        el('span', { class: 'area-index__meta', text: '주제 ' + ts.length + ' · 공개 자료 ' + open }),
        el('span', { class: 'area-index__go', 'aria-hidden': 'true', text: '열기' })
      ])]));
    });
    data.extensions.forEach(function (x) {
      idx.appendChild(el('li', { class: 'area-index__ext' }, [el('a', { href: '#ext-' + x.id }, [
        el('span', { class: 'area-index__num', 'aria-hidden': 'true', text: '+' }), x.title,
        el('span', { class: 'area-index__meta', text: ' · 확장' })
      ])]));
    });
  }

  // 버튼 이름에 결과를 드러낸다: 페이지 안 이동은 이름 그대로(↓), 외부 원문은 'GitHub' 표시, 상세는 한 단계만.
  function actionLink(a, primary) {
    var cls = 'btn ' + (primary ? 'btn--ink' : 'btn--line');
    if (a.href) return el('a', { class: cls, href: a.href }, [a.label, el('span', { class: 'btn__go', 'aria-hidden': 'true', text: '↓' })]);
    if (a.url && safe(a.url)) return el('a', { class: cls, href: a.url }, [a.label, el('span', { class: 'btn__dest', text: '(GitHub)' }), ext()]);
    return null;
  }
  var MAT_ORDER = { collection: 0, example: 1, project: 2 };
  function matOrder() {
    return data.resources.map(function (r, i) { return { r: r, i: i }; }).sort(function (a, b) {
      var x = r0(a.r), y = r0(b.r);
      return x !== y ? x - y : a.i - b.i;
    }).map(function (o) { return o.r; });
    function r0(r) { return r.kind in MAT_ORDER ? MAT_ORDER[r.kind] : 9; }
  }
  function renderMaterials() {
    var list = $('material-list');
    list.textContent = '';
    matOrder().forEach(function (r, i) {
      var count = r.collects === 'course' ? ' ' + data.courses.length + '개' : '';
      var inline = r.collects === 'course' ? el('ul', { class: 'mat__courses', 'aria-label': '공개 강의 ' + data.courses.length + '개 — 강의 목록에서 보기' }, data.courses.map(function (c) {
        return el('li', null, [el('a', { class: 'link', href: '#course-' + c.id }, [c.title]), el('span', { class: 'mat__course-aud', text: c.audience })]);
      })) : null;
      var detail = r.kind === 'project' ? openItemBtn('res:' + r.id, r.title, 'btn btn--open', '함께 읽을 원문 목록') : null;
      list.appendChild(el('li', { class: 'mat mat--' + r.kind, id: 'res-' + r.id, tabindex: '-1', 'data-card': true }, [
        el('span', { class: 'mat__num', 'aria-hidden': 'true', text: num(i) }),
        el('div', { class: 'mat__body' }, [
          el('p', { class: 'mat__type' }, [el('span', { text: r.type + count }), resChip(r.status)]),
          el('h3', { class: 'mat__title', text: r.title }),
          el('p', { class: 'mat__summary', text: r.summary }),
          inline,
          r.areas ? el('p', { class: 'mat__areas', text: '로드맵 · ' + r.areas.map(areaTitle).join(' · ') }) : null,
          el('div', { class: 'mat__actions' }, r.actions.map(function (a, j) { return actionLink(a, j === 0); }).concat([detail]))
        ])
      ]));
    });
  }

  // 강의 카드: 공식명 · 대상 · 학습목표(강의 안내 원문) · 원문 바로 열기. 추가 정보는 한 단계 상세.
  function renderCourses() {
    var list = $('course-list');
    list.textContent = '';
    data.courses.forEach(function (c, i) {
      var note = c.instructorSource === 'courses-index' ? ' (강의 목록 표기)' : '';
      list.appendChild(el('li', { class: 'course', id: 'course-' + c.id, tabindex: '-1', 'data-card': true, 'aria-labelledby': 'course-' + c.id + '-title' }, [
        el('span', { class: 'course__num', 'aria-hidden': 'true', text: num(i) }),
        el('div', { class: 'course__main' }, [
          el('p', { class: 'course__series' }, [el('span', { text: c.series }), resChip(c.status)]),
          el('h3', { class: 'course__title', id: 'course-' + c.id + '-title', text: c.title }),
          el('p', { class: 'course__full', text: c.fullTitle }),
          el('dl', { class: 'course__key' }, [
            el('div', null, [el('dt', { text: '대상' }), el('dd', { text: c.audience })]),
            c.goal ? el('div', null, [el('dt', { text: '배우는 것' }), el('dd', { text: c.goal })]) : null
          ])
        ]),
        el('div', { class: 'course__side' }, [
          el('ul', { class: 'course__go', 'aria-label': c.title + ' 원문 바로 열기 (GitHub)' }, c.links.map(function (l) { return el('li', null, [goLink(l.source, l.label + ' 열기')]); })),
          el('dl', { class: 'course__meta' }, [
            el('div', null, [el('dt', { text: '분량' }), el('dd', { text: c.duration })]),
            el('div', null, [el('dt', { text: '강사' }), el('dd', { text: c.instructor + note })]),
            el('div', null, [el('dt', { text: '로드맵' }), el('dd', { text: c.areas.map(areaTitle).join(' · ') })])
          ]),
          openItemBtn('course:' + c.id, c.title, 'btn btn--open course__open', '강의 정보 더 보기')
        ])
      ]));
    });
  }

  function renderExample() {
    var ex = data.resources.filter(function (r) { return r.kind === 'example'; })[0];
    var list = $('example-steps');
    list.textContent = '';
    if (!ex) return;
    ex.steps.forEach(function (s, i) {
      var f = src[s.source];
      list.appendChild(el('li', { class: 'chain__item' }, [
        el('span', { class: 'chain__num', 'aria-hidden': 'true', text: num(i) }),
        el('p', { class: 'chain__label', text: s.label + ' · ' + areaTitle(s.area) }),
        srcLink(s.source, f ? f.title : s.label, 'chain__link'),
        el('p', { class: 'chain__look', text: '확인할 것: ' + s.look }),
        f ? el('p', { class: 'chain__path', text: f.path }) : null
      ]));
    });
    var note = $('example-note');
    note.textContent = '';
    note.appendChild(document.createTextNode('직접 실행하려면 Node.js와 pnpm이 필요하고, 패키지 설치에는 인터넷 연결이 필요합니다. 실행 방법은 '));
    note.appendChild(srcLink(ex.intro, '예제 안내') || document.createTextNode('예제 안내'));
    note.appendChild(document.createTextNode('에서 확인하세요.'));
  }

  /* ── 무대 SVG ── */
  function shapeEl(kind, cls) {
    if (kind === 'circle') return svg('circle', { r: 46, class: cls });
    if (kind === 'square') return svg('rect', { x: -44, y: -44, width: 88, height: 88, class: cls });
    if (kind === 'diamond') return svg('polygon', { points: '0,-58 58,0 0,58 -58,0', class: cls });
    if (kind === 'triangle') return svg('polygon', { points: '0,-60 52,30 -52,30', class: cls });
    return svg('polygon', { points: hex(52), class: cls });
  }
  function hex(r) {
    var pts = [];
    for (var i = 0; i < 6; i++) { var a = (60 * i - 90) * Math.PI / 180; pts.push((Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1)); }
    return pts.join(' ');
  }

  function buildStage(lay) {
    var cam = $('cam');
    cam.textContent = '';
    view.cam = cam;
    var lines = svg('g', { class: 'st-lines' });
    view.lineGroup = lines;
    view.lines = { main: [], spoke: [], branch: [] };
    var main = svg('path', { d: lay.mainPath, pathLength: 1, class: 'st-line st-line--main' });
    lines.appendChild(main);
    view.lines.main.push(main);
    var areaPos = {};
    lay.areas.forEach(function (a) { areaPos[a.id] = a; });
    lay.topics.forEach(function (t) {
      var a = areaPos[t.area];
      var p = svg('path', { d: 'M' + a.x + ' ' + a.y + 'L' + t.x + ' ' + t.y, pathLength: 1, class: 'st-line st-line--spoke' });
      lines.appendChild(p);
      view.lines.spoke.push(p);
    });
    lay.exts.forEach(function (x) {
      var d = 'M' + x.from.x + ' ' + x.from.y + 'C' + x.from.x + ' ' + (x.from.y + 120) + ' ' + x.x + ' ' + (x.y - 120) + ' ' + x.x + ' ' + (x.y - 34);
      var p = svg('path', { d: d, pathLength: 1, class: 'st-line st-line--branch' + (x.available ? '' : ' is-pending') });
      lines.appendChild(p);
      view.lines.branch.push(p);
    });
    cam.appendChild(lines);

    // 자료 형상(장면 9): 프로젝트 틀, 강의 책등, 예제 사슬
    var ex = data.resources.filter(function (r) { return r.kind === 'example'; })[0];
    var exCount = ex ? ex.steps.length : 0;
    var mats = svg('g', { class: 'st-mats', opacity: 0 });
    mats.appendChild(svg('rect', { x: 140, y: 150, width: 720, height: 230, rx: 24, class: 'st-mat-frame' }));
    mats.appendChild(svgText(160, 132, 'start', 'st-mat-label', '프로젝트 · 로드맵 ' + data.areas.length + '영역'));
    data.courses.forEach(function (c, i) { mats.appendChild(svg('rect', { x: 150 + i * 110, y: 470, width: 90, height: 240, rx: 8, class: 'st-mat-book' })); });
    mats.appendChild(svgText(150, 452, 'start', 'st-mat-label', '강의 ' + data.courses.length + '개'));
    var pts = [];
    for (var k = 0; k < exCount; k++) pts.push([k % 2 ? 830 : 690, 500 + k * 50]);
    if (pts.length) {
      mats.appendChild(svg('path', { d: 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join('L'), class: 'st-mat-chain' }));
      pts.forEach(function (p) { mats.appendChild(svg('circle', { cx: p[0], cy: p[1], r: 16, class: 'st-mat-node' })); });
      mats.appendChild(svgText(660, 452, 'start', 'st-mat-label', '예제 ' + exCount + '단계'));
    }
    cam.appendChild(mats);
    view.mats = mats;

    var pieces = svg('g', { class: 'st-pieces' });
    view.pieces = {};
    lay.areas.forEach(function (a) {
      var g = svg('g', { class: 'st-piece st-piece--area', 'data-piece': 'area:' + a.id }, [shapeEl(a.shape, 'st-base'), shapeEl(a.shape, 'st-hi')]);
      pieces.appendChild(g);
      view.pieces['area:' + a.id] = { g: g, hi: g.lastChild };
    });
    lay.topics.forEach(function (t) {
      var g = svg('g', { class: 'st-piece st-piece--topic', 'data-piece': 'topic:' + t.id }, [svg('circle', { r: 13, class: 'st-dot' + (t.available ? ' is-available' : ' is-preparing') })]);
      pieces.appendChild(g);
      view.pieces['topic:' + t.id] = { g: g };
    });
    lay.exts.forEach(function (x) {
      var g = svg('g', { class: 'st-piece st-piece--ext', 'data-piece': 'ext:' + x.id }, [svg('polygon', { points: hex(34), class: 'st-ring' + (x.available ? '' : ' is-pending') })]);
      pieces.appendChild(g);
      view.pieces['ext:' + x.id] = { g: g };
    });
    cam.appendChild(pieces);

    var labels = svg('g', { class: 'st-labels' });
    view.labels = {};
    var titleOf = {};
    data.areas.forEach(function (a) { titleOf[a.id] = a.title; });
    data.topics.forEach(function (t) { titleOf[t.id] = t.title; });
    data.extensions.forEach(function (x) { titleOf[x.id] = x.title; });
    lay.areas.forEach(function (a) { view.labels[a.id] = labels.appendChild(svgText(a.label.x, a.label.y, a.label.anchor, 'st-label st-label--area', titleOf[a.id])); });
    lay.topics.forEach(function (t) { view.labels[t.id] = labels.appendChild(svgText(t.label.x, t.label.y, t.label.anchor, 'st-label st-label--topic', titleOf[t.id])); });
    lay.exts.forEach(function (x) { view.labels[x.id] = labels.appendChild(svgText(x.label.x, x.label.y, x.label.anchor, 'st-label st-label--ext', titleOf[x.id])); });
    cam.appendChild(labels);
  }

  function fx(n) { return Math.round(n * 100) / 100; }

  function applyState(s) {
    view.cam.setAttribute('transform', 'translate(' + fx(s['cam.x']) + ' ' + fx(s['cam.y']) + ') scale(' + fx(s['cam.s']) + ')');
    Object.keys(view.pieces).forEach(function (key) {
      var p = 'p.' + key + '.';
      var v = view.pieces[key];
      v.g.setAttribute('transform', 'translate(' + fx(s[p + 'x']) + ' ' + fx(s[p + 'y']) + ') rotate(' + fx(s[p + 'r']) + ') scale(' + fx(s[p + 's']) + ')');
      v.g.setAttribute('opacity', fx(s[p + 'o']));
      if (v.hi) v.hi.setAttribute('opacity', fx(s[p + 'h']));
    });
    view.lines.main.forEach(function (p) { p.setAttribute('stroke-dashoffset', fx(1 - s['line.main'])); });
    view.lines.spoke.forEach(function (p) { p.setAttribute('stroke-dashoffset', fx(1 - s['line.spoke'])); });
    view.lines.branch.forEach(function (p) { p.setAttribute('stroke-dashoffset', fx(1 - s['line.branch'])); });
    view.lineGroup.setAttribute('opacity', fx(s['line.o']));
    view.mats.setAttribute('opacity', fx(s.mats));
    var k = 0.7 + 0.3 * s.mats;
    view.mats.setAttribute('transform', 'translate(500 500) scale(' + fx(k) + ') translate(-500 -500)');
    Object.keys(view.labels).forEach(function (id) { view.labels[id].setAttribute('opacity', fx(s['lab.' + id])); });
  }

  /* ── 스크롤 연동 ── */
  function headH() { var h = $('head'); return h ? h.getBoundingClientRect().height : 64; }
  function refY() {
    if (narrowQ.matches) return headH() + (window.innerHeight - headH()) * 0.3;
    return window.innerHeight * 0.5;
  }
  // 모바일: 무대가 화면 아래에서 들어와 위쪽에 닿을 때까지 흩어진 도형 → 조립된 지도(장면 2)
  function mobileScene() {
    var r = $('stage').getBoundingClientRect();
    var vh = window.innerHeight || 1;
    var q = (vh - r.top) / (vh * 0.85);
    return 2 * (q < 0 ? 0 : q > 1 ? 1 : q);
  }
  function measure() {
    steps = Array.prototype.slice.call(document.querySelectorAll('#story [data-step]'));
    var y0 = window.scrollY || window.pageYOffset || 0;
    var ref = refY();
    anchors = M.normalizeAnchors(steps.map(function (s) { return s.getBoundingClientRect().top + y0 - ref; }));
  }

  function chapterFor(scene) {
    var join = $('join');
    if (join && join.getBoundingClientRect().top < window.innerHeight * 0.5) return 'join';
    var story = $('story');
    if (story.getBoundingClientRect().bottom < window.innerHeight * 0.5) return 'materials';
    if (scene <= 0) return 'top';
    if (scene === 1) return 'intro';
    if (scene >= steps.length - 1) return 'materials';
    return 'roadmap';
  }

  function render() {
    pending = false;
    if (!states.length) return;
    var y = window.scrollY || window.pageYOffset || 0;
    var reduced = reduceQ.matches;
    var f = reduced ? 2 : M.sceneAt(anchors, y);
    var n = steps.length;
    var i = Math.min(n - 1, Math.floor(f));
    var t = f - i;
    var p = n > 1 ? f / (n - 1) : 0;
    var mobile = !reduced && narrowQ.matches;
    var fm = mobile ? mobileScene() : f;
    applyState(M.stateAt(states, fm));
    var story = $('story');
    story.setAttribute('data-progress', reduced ? 'reduced' : p.toFixed(4));
    story.setAttribute('data-scene', String(i));
    story.setAttribute('data-scene-progress', reduced ? '0' : t.toFixed(4));
    $('stage-svg').setAttribute('data-scene', String(i));
    $('hud-fill').style.transform = 'scaleX(' + (reduced ? 1 : mobile ? fm / 2 : p).toFixed(4) + ')';
    steps.forEach(function (s, k) { s.style.setProperty('--t', reduced ? '1' : String(k < i ? 1 : k === i ? Math.round(t * 1000) / 1000 : 0)); });
    var shown = Math.min(n - 1, Math.round(f));
    if (shown !== last.scene || mobile !== last.mobile) {
      last.scene = shown;
      last.mobile = mobile;
      // 학습 진도가 아니라 이 페이지 안의 위치임을 이름으로 밝힌다
      $('hud-label').textContent = reduced ? '개발 과정 지도' : mobile ? '개발 과정 지도 · 영역별로 모입니다' : '페이지 안내 ' + (shown + 1) + '/' + n + ' · ' + (names[shown] || '');
      steps.forEach(function (s, k) { s.classList.toggle('is-current', k === shown); });
    }
    var chapter = chapterFor(Math.round(f));
    if (chapter !== last.chapter) {
      last.chapter = chapter;
      Array.prototype.forEach.call(document.querySelectorAll('#toc a[data-chapter]'), function (a) {
        if (a.getAttribute('data-chapter') === chapter) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(render); } }
  function remeasure() { measure(); last.scene = -1; schedule(); }

  /* ── 해시 (이전 형식 포함) ── */
  function resolveHash(hash) {
    var raw = (hash || '').replace(/^#/, '');
    try { raw = decodeURIComponent(raw); } catch (e) { return null; }
    var m = /^(area|topic|ext|stage|path)\/([A-Za-z0-9_-]{1,40})$/.exec(raw);
    if (!m) return /^[A-Za-z][\w-]{0,60}$/.test(raw) ? raw : null;
    if (m[1] === 'area') return 'area-' + m[2];
    if (m[1] === 'topic') return 'topic-' + m[2];
    if (m[1] === 'ext') return 'ext-' + m[2];
    if (m[1] === 'path') return m[2] === 'todo' ? 'example' : null;
    if (data.extensions.some(function (x) { return x.id === m[2]; })) return 'ext-' + m[2];
    var hit = data.areas.filter(function (a) { return (a.legacyStages || []).indexOf(m[2]) !== -1; })[0];
    return hit ? 'area-' + hit.id : null;
  }
  function goToHash(initial) {
    var id = resolveHash(location.hash);
    var node = id && $(id);
    if (!node) return;
    var legacy = location.hash.indexOf('/') !== -1;
    if (initial || legacy) {
      node.scrollIntoView({ block: 'start' });
      if (node.tabIndex === -1) node.focus({ preventScroll: true });
    }
  }

  /* ── 오류 ── */
  function fail(err) {
    html.setAttribute('data-motion', 'error');
    var msg = function (what, path, label) {
      return el('p', { class: 'notice', role: 'status' }, [what + ' 데이터를 불러오지 못했습니다. 새로 고치거나 GitHub 원본에서 확인하세요: ', el('a', { href: REPO + path, text: label })]);
    };
    $('area-steps').textContent = '';
    $('area-steps').appendChild(msg('로드맵 영역·주제', '/blob/main/METHODOLOGY.md', '방법론 원문'));
    $('material-list').textContent = '';
    $('material-list').appendChild(el('li', null, [msg('공개 항목', '', 'GitHub 저장소')]));
    $('course-list').textContent = '';
    $('course-list').appendChild(el('li', null, [msg('강의', '/blob/main/courses/README.md', '강의 목록')]));
    var sm = $('stage-msg');
    sm.hidden = false;
    sm.textContent = '데이터를 불러오지 못해 지도 장면을 표시하지 않습니다.';
    $('hud-label').textContent = '데이터 오류';
    if (window.console) console.warn('story: data load failed', err);
  }

  function getJSON(name) {
    return fetch(new URL('data/' + name, document.baseURI).href, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(name + ' ' + r.status);
      return r.json();
    });
  }

  function init(res) {
    data = res[0];
    res[1].sources.forEach(function (s) { src[s.id] = s; });
    data.areas.forEach(function (a) { areaById[a.id] = a; });
    renderPicks();
    renderAreas();
    renderMaterials();
    renderCourses();
    renderExample();
    var lay = M.layout(data);
    states = M.buildStates(data, lay);
    names = M.sceneNames(data);
    buildStage(lay);
    var setMode = function () { html.setAttribute('data-motion', reduceQ.matches ? 'reduced' : 'scroll'); remeasure(); };
    setMode();
    if (reduceQ.addEventListener) reduceQ.addEventListener('change', setMode);
    if (narrowQ.addEventListener) narrowQ.addEventListener('change', remeasure);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', remeasure);
    if (typeof ResizeObserver === 'function') new ResizeObserver(remeasure).observe($('story'));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    if (window.KLayers) window.KLayers.init({
      data: data, src: src, TYPE: TYPE, el: el, svg: svg, ext: ext, num: num, safe: safe, srcLink: srcLink, goLink: goLink, chip: chip, resChip: resChip,
      moduleLine: moduleLine, sourceList: sourceList, topicItem: topicItem, actionLink: actionLink, issues: REPO + '/issues', areaTitle: areaTitle, relatedOf: relatedOf, layout: lay, shapeEl: shapeEl,
      pieceRect: function (id) { var p = view.pieces['area:' + id]; return p ? p.g.getBoundingClientRect() : null; },
      afterClose: function () { last.scene = -1; schedule(); }
    });
    window.addEventListener('hashchange', function () { goToHash(false); });
    goToHash(true);
    render();
  }

  initToc();
  if (!M) { fail(new Error('motion-core.js not loaded')); return; }
  Promise.all([getJSON('portal.json'), getJSON('sources.json')]).then(init).catch(fail);
})();
