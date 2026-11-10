/* kosta-ai-lab 포털 — 화면 동작 (Apache-2.0).
   데이터는 상대 경로(data/*.json)로 읽으므로 /ai-native-sdlc/ 같은 하위 경로에서도 동작한다.
   진도·완료 여부·사용자 정보는 저장하지 않는다. */
(function () {
  'use strict';

  var L = window.LearningSite;
  var REPO_PREFIX = 'https://github.com/kosta-ai-lab/ai-native-sdlc';
  var ORG_URL = 'https://github.com/kosta-ai-lab';
  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  var data = null;
  var sourceById = {};
  var areaById = {};
  var extById = {};
  var state = { kind: null, id: null };
  var $ = function (id) { return document.getElementById(id); };

  /* ── DOM 도우미: 데이터는 textContent로만 넣는다 ── */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value == null || value === false) return;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key.slice(0, 2) === 'on') node.addEventListener(key.slice(2), value);
        else node.setAttribute(key, value === true ? '' : String(value));
      });
    }
    (children || []).forEach(function (child) {
      if (child == null) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function icon(kind) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    var path = document.createElementNS(ns, 'path');
    if (kind === 'arrow') {
      svg.setAttribute('viewBox', '0 0 16 16');
      svg.setAttribute('class', 'i-arrow');
      path.setAttribute('d', 'M3 8h10M9 4l4 4-4 4');
    } else if (kind === 'up') {
      svg.setAttribute('viewBox', '0 0 16 16');
      svg.setAttribute('class', 'i-arrow i-arrow--down');
      path.setAttribute('d', 'M8 13V3M4 7l4-4 4 4');
    } else if (kind === 'down') {
      svg.setAttribute('viewBox', '0 0 16 16');
      svg.setAttribute('class', 'i-arrow i-arrow--down');
      path.setAttribute('d', 'M8 3v10M4 9l4 4 4-4');
    } else {
      svg.setAttribute('viewBox', '0 0 12 12');
      svg.setAttribute('class', 'i-ext');
      path.setAttribute('d', 'M4 2h6v6M10 2 3 9');
    }
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.appendChild(path);
    return svg;
  }

  function safeUrl(url) {
    if (typeof url !== 'string') return null;
    if (url === ORG_URL || url === REPO_PREFIX || url.indexOf(REPO_PREFIX + '/') === 0) return url;
    return null;
  }

  /* 외부(GitHub 원본) 링크 */
  function sourceLink(id, label, className) {
    var src = sourceById[id];
    if (!src) return null;
    return el('a', { class: className || 'link', href: safeUrl(src.url) }, [label || src.title, icon('ext'), el('span', { class: 'sr-only', text: ' (GitHub 원본)' })]);
  }

  /* 항목의 행동: 사이트 안 이동(href '#…'), 확인된 외부 주소(url), 원본 자료(source) */
  function actionLink(action, primary) {
    var cls = primary ? 'btn-line btn-line--strong' : 'btn-line';
    if (action.href) return el('a', { class: cls, href: action.href }, [action.label, icon(action.href.charAt(0) === '#' ? 'down' : 'arrow')]);
    if (action.url) return el('a', { class: cls, href: safeUrl(action.url) }, [action.label, icon('ext'), el('span', { class: 'sr-only', text: ' (GitHub)' })]);
    if (action.source) return sourceLink(action.source, action.label, cls);
    return null;
  }

  function chip(text, tone) {
    return el('span', { class: 'chip' + (tone ? ' chip--' + tone : ''), text: text });
  }

  function availabilityChip(key) {
    return chip(L.statusLabel(data, 'topic', key), key === 'available' ? 'solid' : 'dashed');
  }

  function animateIn(node) {
    if (reduceMotion.matches || !node || typeof node.animate !== 'function') return;
    node.animate([{ opacity: 0.5, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
      { duration: 200, easing: 'cubic-bezier(.4,0,.2,1)' });
  }

  function scrollToNode(node) {
    if (node) node.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
  }

  function setHash(hash) {
    if (location.hash === hash) return;
    try { history.replaceState(null, '', hash); } catch (e) { /* file:// 등에서는 무시 */ }
  }

  function areaTitles(ids) {
    return (ids || []).map(function (id) { return areaById[id] ? areaById[id].title : id; });
  }

  /* ── 로드맵 노드 ── */
  function nodeButton(kind, item) {
    var children = [el('span', { class: 'node__dot', 'aria-hidden': 'true' })];
    if (kind === 'area') {
      var topics = L.topicsFor(data, item.id).length;
      var related = L.relatedItems(data, item.id).length;
      children.push(
        el('span', { class: 'node__title', text: item.title }),
        el('span', { class: 'node__text', text: item.summary }),
        el('span', { class: 'node__meta', text: '주제 ' + topics + ' · 연결 자료 ' + related })
      );
    } else {
      children.push(
        el('span', { class: 'node__kicker', text: '확장 주제' }),
        el('span', { class: 'node__title', text: item.title }),
        el('span', { class: 'node__meta', text: '연결 영역 · ' + areaTitles(item.relatedAreas).join(', ') }),
        availabilityChip(item.availability)
      );
    }
    return el('button', {
      type: 'button',
      class: 'node node--' + kind,
      'data-kind': kind,
      'data-id': item.id,
      'aria-pressed': 'false',
      'aria-controls': 'area-panel'
    }, children);
  }

  function renderRoadmap() {
    var list = $('areas');
    var ext = $('extensions');
    list.textContent = '';
    ext.textContent = '';
    data.areas.forEach(function (a) { list.appendChild(el('li', null, [nodeButton('area', a)])); });
    data.extensions.forEach(function (x) { ext.appendChild(el('li', null, [nodeButton('ext', x)])); });
    $('ext-label').hidden = false;

    var board = $('board');
    board.addEventListener('click', function (e) {
      var btn = e.target.closest('.node');
      // Enter·Space·클릭으로 실제 선택했을 때만 처리한다(화살표 키는 포커스 이동만).
      if (btn) select(btn.getAttribute('data-kind'), btn.getAttribute('data-id'), { updateHash: true, reveal: true });
    });
    board.addEventListener('keydown', function (e) {
      var btn = e.target.closest && e.target.closest('.node');
      if (!btn) return;
      var all = Array.prototype.slice.call(board.querySelectorAll('.node'));
      var i = all.indexOf(btn);
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = all[Math.min(all.length - 1, i + 1)];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = all[Math.max(0, i - 1)];
      else if (e.key === 'Home') next = all[0];
      else if (e.key === 'End') next = all[all.length - 1];
      if (next) { e.preventDefault(); next.focus(); }
    });

    var pending = false;
    var schedule = function () {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () { pending = false; drawRail(); });
    };
    if (typeof ResizeObserver === 'function') new ResizeObserver(schedule).observe(board);
    else window.addEventListener('resize', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    schedule();
  }

  function measure(board, kind, id) {
    var btn = board.querySelector('.node[data-kind="' + kind + '"][data-id="' + id + '"]');
    if (!btn) return null;
    var box = board.getBoundingClientRect();
    var dot = btn.querySelector('.node__dot').getBoundingClientRect();
    var card = btn.getBoundingClientRect();
    return {
      dot: { x: dot.left + dot.width / 2 - box.left, y: dot.top + dot.height / 2 - box.top },
      bottomCenter: { x: card.left + card.width / 2 - box.left, y: card.bottom - box.top },
      bottom: card.bottom - box.top
    };
  }

  function drawRail() {
    var board = $('board');
    var svg = $('rail');
    var w = board.clientWidth;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + board.clientHeight);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var ns = 'http://www.w3.org/2000/svg';
    var add = function (d, attrs) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', d);
      Object.keys(attrs).forEach(function (k) { p.setAttribute(k, attrs[k]); });
      svg.appendChild(p);
    };

    var m = {};
    data.areas.forEach(function (a) { m[a.id] = measure(board, 'area', a.id); });
    for (var i = 0; i < data.areas.length - 1; i++) {
      var a = m[data.areas[i].id];
      var b = m[data.areas[i + 1].id];
      if (!a || !b) continue;
      add(L.railPath(a.dot, b.dot, { xRight: w - 14, yMid: a.bottom + (b.dot.y - a.bottom) / 2, radius: 10 }),
        { 'data-a': data.areas[i].id, 'data-b': data.areas[i + 1].id });
    }

    // 확장 가지선은 영역이 한 줄로 놓일 때(넓은 화면)만 그린다. 좁은 화면에서는 카드의 '연결 영역' 문구로 대신한다.
    var tops = data.areas.map(function (x) { return m[x.id] ? m[x.id].dot.y : 0; });
    var oneRow = Math.max.apply(null, tops) - Math.min.apply(null, tops) < 4;
    if (!oneRow) { updateRail(); return; }
    data.extensions.forEach(function (x) {
      var to = measure(board, 'ext', x.id);
      if (!to) return;
      (x.relatedAreas || []).forEach(function (areaId) {
        var from = m[areaId];
        if (!from) return;
        var yMid = from.bottom + (to.dot.y - from.bottom) / 2;
        add(L.roundedPath(L.branchPoints(from.bottomCenter, to.dot, yMid), 10),
          { 'data-a': areaId, 'data-b': x.id, class: 'is-branch' });
      });
    });
    updateRail();
  }

  function updateRail() {
    Array.prototype.forEach.call($('rail').querySelectorAll('path'), function (p) {
      var near = L.isNearSegment({ from: p.getAttribute('data-a'), to: p.getAttribute('data-b') }, state.id);
      p.classList.toggle('is-near', near);
    });
  }

  /* ── 선택 패널 ── */
  /* 모듈 원문 상태(완성도)와 연결된 공개 자료(제공 여부)를 나눠 보인다. */
  function moduleLine(t) {
    var src = sourceById[t.module];
    var text = '모듈 원문 상태 ' + t.sourceStatus + ' · 담당 ' + t.owner + (t.modulePending ? ' · 목적 작성 예정' : '');
    return el('p', { class: 'topic__meta' }, [
      text,
      src && src.kind === 'file' ? el('span', { class: 'topic__modlink' }, [' · ', sourceLink(t.module, '모듈 문서', 'link link--small')]) : null
    ]);
  }

  function topicBlock(t) {
    var links = [];
    (t.related || []).forEach(function (id) {
      var s = sourceById[id];
      if (s) links.push(el('li', null, [el('span', { class: 'link__type', text: L.typeLabel(s.type) }), sourceLink(id, s.title, 'link')]));
    });
    return el('li', { class: 'topic', id: 'topic-' + t.id }, [
      el('div', { class: 'topic__head' }, [el('h4', { class: 'topic__title', text: t.title }), availabilityChip(t.availability)]),
      moduleLine(t),
      links.length ? el('ul', { class: 'topic__links', 'aria-label': t.title + ' 연결된 공개 자료' }, links)
        : el('p', { class: 'topic__empty', text: '아직 연결된 공개 자료가 없습니다.' })
    ]);
  }

  function panelTop(kicker) {
    return el('div', { class: 'panel__top' }, [
      el('p', { class: 'panel__kicker', text: kicker }),
      el('button', { type: 'button', class: 'panel__back', onclick: backToMap }, ['로드맵으로 돌아가기', icon('up')])
    ]);
  }

  /* 선택된 노드로 초점과 스크롤을 되돌린다. */
  function backToMap() {
    var btn = document.querySelector('.node[aria-pressed="true"]');
    if (!btn) { scrollToNode($('roadmap')); return; }
    btn.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
    btn.focus({ preventScroll: true });
  }

  function relatedBlock(item) {
    var anchor = item.kind === 'course' ? '#course-' + item.id : '#res-' + item.id;
    var type = item.kind === 'course' ? '강의' : item.type;
    return el('li', { class: 'rel' }, [
      el('span', { class: 'rel__type', text: type + ' · ' + L.statusLabel(data, 'resource', item.status) }),
      el('a', { class: 'rel__title', href: anchor }, [item.title])
    ]);
  }

  function renderAreaPanel(area) {
    var inner = $('area-panel-inner');
    inner.textContent = '';
    var related = L.relatedItems(data, area.id);
    var exts = L.extensionsFor(data, area.id);
    inner.appendChild(panelTop('로드맵 영역'));
    inner.appendChild(el('h3', { class: 'panel__title', id: 'area-title', tabindex: '-1', text: area.title }));
    inner.appendChild(el('p', { class: 'panel__summary', text: area.summary }));
    var cols = [
      el('div', { class: 'panel__col' }, [
        el('h4', { class: 'label', text: '주요 주제' }),
        el('ul', { class: 'topics' }, L.topicsFor(data, area.id).map(topicBlock))
      ]),
      el('div', { class: 'panel__col' }, [
        el('h4', { class: 'label', text: '연결할 자료' }),
        related.length ? el('ul', { class: 'rels' }, related.map(relatedBlock)) : el('p', { class: 'topic__empty', text: '아직 연결된 공개 자료가 없습니다.' }),
        el('a', { class: 'btn-line btn-line--strong', href: '#resources' }, ['관련 자료 보기', icon('down')]),
        exts.length ? el('div', { class: 'panel__ext' }, [
          el('h4', { class: 'label', text: '연결되는 확장 주제' }),
          el('ul', { class: 'rels' }, exts.map(function (x) {
            return el('li', { class: 'rel' }, [
              el('span', { class: 'rel__type', text: '확장 주제 · ' + L.statusLabel(data, 'topic', x.availability) }),
              el('button', { type: 'button', class: 'rel__title rel__btn', onclick: function () { select('ext', x.id, { updateHash: true, focusPanel: true }); } }, [x.title])
            ]);
          }))
        ]) : null
      ])
    ];
    inner.appendChild(el('div', { class: 'panel__grid' }, cols));
  }

  function renderExtPanel(x) {
    var inner = $('area-panel-inner');
    inner.textContent = '';
    inner.appendChild(panelTop('확장 주제'));
    inner.appendChild(el('div', { class: 'panel__titlerow' }, [
      el('h3', { class: 'panel__title', id: 'area-title', tabindex: '-1', text: x.title }),
      availabilityChip(x.availability)
    ]));
    inner.appendChild(el('p', { class: 'panel__summary', text: x.summary }));
    var subs = (x.related || []).map(function (id) {
      var s = sourceById[id];
      return s ? el('li', null, [el('span', { class: 'link__type', text: L.typeLabel(s.type) }), sourceLink(id, s.title, 'link')]) : null;
    });
    var moduleSrc = sourceById[x.module];
    inner.appendChild(el('div', { class: 'panel__grid' }, [
      el('div', { class: 'panel__col' }, [
        el('h4', { class: 'label', text: '세부 주제' }),
        moduleLine(x),
        subs.length ? el('ul', { class: 'topic__links topic__links--cols' }, subs)
          : el('p', { class: 'topic__empty', text: '아직 연결된 공개 자료가 없습니다.' })
      ]),
      el('div', { class: 'panel__col' }, [
        el('h4', { class: 'label', text: '연결 영역' }),
        el('ul', { class: 'rels' }, (x.relatedAreas || []).map(function (id) {
          return el('li', { class: 'rel' }, [
            el('span', { class: 'rel__type', text: '로드맵 영역' }),
            el('button', { type: 'button', class: 'rel__title rel__btn', onclick: function () { select('area', id, { updateHash: true, focusPanel: true }); } }, [areaById[id].title])
          ]);
        })),
        moduleSrc ? sourceLink(x.module, moduleSrc.kind === 'dir' ? '모듈 폴더 보기' : '모듈 문서 보기', 'btn-line') : null
      ])
    ]));
  }

  function singleColumn() {
    return window.matchMedia ? window.matchMedia('(max-width: 639px)').matches : false;
  }

  /* 상세 제목 부분이 화면 안에 보이는지 */
  function panelInView() {
    var r = $('area-panel').getBoundingClientRect();
    return r.top >= 0 && r.top < window.innerHeight - 160;
  }

  /* 해시로 연 경우: 넓은 화면에서 지도와 상세가 한 화면에 들어오면 지도부터, 아니면 상세로 이동하고 상세 제목에 초점을 둔다. */
  function revealFromHash() {
    var board = $('board');
    var panel = $('area-panel');
    var gap = panel.getBoundingClientRect().top - board.getBoundingClientRect().top;
    var target = !singleColumn() && gap < window.innerHeight - 220 ? board : panel;
    scrollToNode(target);
    $('area-title').focus({ preventScroll: true });
  }

  function select(kind, id, opts) {
    var item = kind === 'ext' ? extById[id] : areaById[id];
    if (!item) return false;
    opts = opts || {};
    var changed = state.id !== id;
    state.kind = kind;
    state.id = id;
    Array.prototype.forEach.call(document.querySelectorAll('.node'), function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-id') === id ? 'true' : 'false');
    });
    if (kind === 'ext') renderExtPanel(item); else renderAreaPanel(item);
    $('area-panel').hidden = false;
    updateRail();
    if (changed && opts.animate !== false) animateIn($('area-panel-inner'));
    if (opts.updateHash) setHash(L.nodeHash(kind, id));
    if (opts.reveal && (singleColumn() || !panelInView())) opts.focusPanel = true;
    if (opts.focusPanel) {
      $('area-title').focus({ preventScroll: true });
      scrollToNode($('area-panel'));
    } else if (opts.announce !== false) {
      $('area-live').textContent = (kind === 'ext' ? '확장 주제 ' : '영역 ') + item.title + ' 내용을 표시했습니다.';
    }
    return true;
  }

  /* ── 서비스·자료 ── */
  function renderResources() {
    var list = $('resource-list');
    list.textContent = '';
    data.resources.forEach(function (r) {
      var count = r.collects === 'course' ? data.courses.length : null;
      list.appendChild(el('li', { class: 'resource', id: 'res-' + r.id }, [
        el('p', { class: 'resource__type' }, [
          el('span', { text: r.type + (count ? ' ' + count + '개' : '') }),
          chip(L.statusLabel(data, 'resource', r.status), 'solid')
        ]),
        el('h3', { class: 'resource__title', text: r.title }),
        el('p', { class: 'resource__summary', text: r.summary }),
        r.areas ? el('p', { class: 'resource__areas', text: '로드맵 · ' + areaTitles(r.areas).join(' · ') }) : null,
        el('div', { class: 'resource__actions' }, r.actions.map(function (a, i) { return actionLink(a, i === 0); }))
      ]));
    });
  }

  function renderCourses() {
    var list = $('course-list');
    list.textContent = '';
    data.courses.forEach(function (c) {
      var note = c.instructorSource === 'courses-index' ? ' (강의 목록 표기)' : '';
      list.appendChild(el('li', { class: 'course', id: 'course-' + c.id }, [
        el('div', { class: 'course__main' }, [
          el('p', { class: 'course__series' }, [el('span', { text: c.series }), chip(L.statusLabel(data, 'resource', c.status), 'solid')]),
          el('h4', { class: 'course__title', text: c.title }),
          el('p', { class: 'course__full', text: c.fullTitle }),
          el('p', { class: 'course__areas', text: '로드맵 · ' + areaTitles(c.areas).join(' · ') })
        ]),
        el('dl', { class: 'meta' }, [
          el('div', null, [el('dt', { text: '대상' }), el('dd', { text: c.audience })]),
          el('div', null, [el('dt', { text: '분량' }), el('dd', { text: c.duration })]),
          el('div', null, [el('dt', { text: '강사' }), el('dd', { text: c.instructor + note })])
        ]),
        el('ul', { class: 'course__links', 'aria-label': c.title + ' 원본 자료' }, c.links.map(function (l) {
          return el('li', null, [sourceLink(l.source, l.label, 'link')]);
        }))
      ]));
    });
  }

  function renderExample() {
    var ex = data.resources.filter(function (r) { return r.kind === 'example'; })[0];
    var route = $('example-steps');
    route.textContent = '';
    if (!ex) return;
    ex.steps.forEach(function (step, i) {
      var src = sourceById[step.source];
      route.appendChild(el('li', null, [
        el('span', { class: 'route__step', text: String(i + 1).padStart(2, '0') + ' · ' + step.label + ' · ' + (areaById[step.area] ? areaById[step.area].title : '') }),
        sourceLink(step.source, src ? src.title : step.label, 'route__link'),
        el('p', { class: 'route__look', text: step.look }),
        src ? el('span', { class: 'route__path', text: src.path }) : null
      ]));
    });
    var note = $('example-note');
    note.textContent = '';
    note.appendChild(document.createTextNode('직접 실행하려면 Node.js와 pnpm이 필요하고, 패키지 설치에는 인터넷 연결이 필요합니다. 실행 방법은 '));
    note.appendChild(sourceLink(ex.intro, '예제 안내', 'link'));
    note.appendChild(document.createTextNode('에서 확인하세요.'));
  }

  /* ── 해시 ── */
  function applyHash(fromEvent) {
    var target = L.resolveTarget(data, L.parseHash(location.hash));
    if (!target) return;
    if (target.kind === 'area' || target.kind === 'ext') {
      select(target.kind, target.id, { announce: fromEvent });
      if (target.topic && $('topic-' + target.topic)) scrollToNode($('topic-' + target.topic));
      else revealFromHash();
    } else if (target.kind === 'anchor') {
      var node = $(target.id);
      if (!node) return;
      if (location.hash !== '#' + target.id) { scrollToNode(node); node.focus({ preventScroll: true }); }
      else if (!fromEvent) node.scrollIntoView({ block: 'start' });
    }
  }

  function init(results) {
    data = results[0];
    results[1].sources.forEach(function (s) { sourceById[s.id] = s; });
    data.areas.forEach(function (a) { areaById[a.id] = a; });
    data.extensions.forEach(function (x) { extById[x.id] = x; });

    renderRoadmap();
    select('area', data.areas[0].id, { animate: false, announce: false });
    renderResources();
    renderCourses();
    renderExample();
    document.documentElement.classList.add('is-ready');

    applyHash(false);
    window.addEventListener('hashchange', function () { applyHash(true); });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#area/"], a[href^="#ext/"], a[href^="#topic/"], a[href^="#stage/"], a[href^="#path/"]');
      if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); applyHash(true); }
    });
  }

  function fail(error) {
    var msg = '목록을 불러오지 못했습니다. GitHub 원본에서 직접 확인하세요: ';
    [['areas', '/blob/main/METHODOLOGY.md', '방법론 원문'], ['resource-list', '', 'GitHub 저장소'], ['course-list', '/blob/main/courses/README.md', '강의 목록']]
      .forEach(function (item) {
        var list = $(item[0]);
        list.textContent = '';
        list.appendChild(el('li', { class: 'fallback', role: 'status' }, [msg, el('a', { href: REPO_PREFIX + item[1], text: item[2] })]));
      });
    if (window.console) console.warn('portal: data load failed', error);
  }

  function getJSON(rel) {
    return fetch(new URL(rel, document.baseURI).href, { cache: 'no-cache' }).then(function (res) {
      if (!res.ok) throw new Error(rel + ' ' + res.status);
      return res.json();
    });
  }

  if (!L) return;
  Promise.all([getJSON('data/portal.json'), getJSON('data/sources.json')]).then(init).catch(fail);
})();
