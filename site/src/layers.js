/* kosta-ai-lab 포털 — 겹 화면 단일 소유자 (Apache-2.0).
   스크롤 스토리 위에 두 종류의 겹 화면을 하나의 스택으로 관리한다.
     1) 영역 펼침(area): 조립된 로드맵의 영역 도형이 공간으로 커지고 나머지 영역은 가장자리로 압축된다.
     2) 자료 상세(detail): 자료·강의 카드가 제자리에서 상세 화면으로 펼쳐진다. 상세는 한 단계만 연다(영역 위의 상세는 허용).
   Escape · history(popstate) · 스크롤 잠금 · inert/초점 · resize는 이 파일의 핸들러 하나씩만 담당한다.
   상태 관측: html[data-layers], #layers[data-stack], .xl[data-state|data-area|data-t|data-frames], .zone[data-geom],
   .dl[data-state|data-item|data-t|data-frames], .dl__sheet[data-clip], window.KLayers.trace */
(function () {
  'use strict';

  var html = document.documentElement;
  var TOKEN = 'kl' + Date.now().toString(36);
  var mq = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
  var reduceQ = mq('(prefers-reduced-motion: reduce)');
  var MAX = 4;
  var DUR = { areaOpen: 720, areaClose: 560, areaSwitch: 520, detailOpen: 620, detailClose: 460 };

  var ctx = null;
  var root = null;
  var stack = [];
  var ignorePops = 0;
  var waiters = [];
  var waitTimer = 0;
  var toc = null;
  var savedY = 0;
  var seq = 0;
  var trace = [];
  var X = null; // 영역 펼침 단일 화면

  function $(id) { return document.getElementById(id); }
  function reduced() { return reduceQ.matches || html.getAttribute('data-motion') === 'reduced'; }
  function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function r2(v) { return Math.round(v * 100) / 100; }
  function note(kind, what, extra) {
    trace.push({ t: Math.round(performance.now()), kind: kind, what: what, depth: stack.length, extra: extra || null });
    if (trace.length > 60) trace.shift();
  }

  /* ── 공통 보간: rAF + 완료 보장 타이머 ── */
  function tween(dur, step, done) {
    var h = { dead: false, raf: 0, guard: 0 };
    function finish() { if (h.dead) return; h.dead = true; cancelAnimationFrame(h.raf); clearTimeout(h.guard); step(1, 1); if (done) done(); }
    h.cancel = function () { h.dead = true; cancelAnimationFrame(h.raf); clearTimeout(h.guard); };
    h.finish = finish;
    if (dur <= 0 || reduced()) { finish(); return h; }
    var t0 = null;
    function frame(now) {
      if (h.dead) return;
      if (t0 === null) t0 = now;
      var p = Math.min(1, (now - t0) / dur);
      if (p >= 1) { finish(); return; }
      step(ease(p), p);
      h.raf = requestAnimationFrame(frame);
    }
    h.raf = requestAnimationFrame(frame);
    h.guard = setTimeout(finish, dur + 500); // 백그라운드 탭 등 rAF 정지 시 끝 상태 보장
    return h;
  }
  function mixRect(a, b, t) { return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), r: lerp(a.r, b.r, t) }; }
  function copyRect(r) { return { x: r.x, y: r.y, w: r.w, h: r.h, r: r.r }; }

  /* ── 스택 · inert · 스크롤 잠금 ── */
  function baseEls() {
    return Array.prototype.slice.call(document.querySelectorAll('body > .skip, #head, #main, body > .foot'));
  }
  function setInert(node, v) {
    if (!node) return;
    if ('inert' in node) node.inert = v;
    if (v) node.setAttribute('aria-hidden', 'true'); else node.removeAttribute('aria-hidden');
  }
  function sync() {
    var n = stack.length;
    html.setAttribute('data-layers', String(n));
    if (n && !html.classList.contains('is-layered')) {
      savedY = window.scrollY || window.pageYOffset || 0;
      html.classList.add('is-layered');
      if (toc && toc.isOpen()) toc.close(false);
    } else if (!n && html.classList.contains('is-layered')) {
      html.classList.remove('is-layered');
      var y = window.scrollY || window.pageYOffset || 0;
      if (Math.abs(y - savedY) > 1) window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
    }
    baseEls().forEach(function (b) { setInert(b, n > 0); });
    stack.forEach(function (l, i) { setInert(l.el, i < n - 1); });
    if (root) root.setAttribute('data-stack', stack.map(function (l) { return l.key; }).join(' '));
  }
  function histDepth() { var s = history.state; return s && s.kl === TOKEN ? s.d : 0; }
  function settle(fn) {
    if (!ignorePops) { fn(); return; }
    waiters.push(fn);
    clearTimeout(waitTimer);
    waitTimer = setTimeout(flushWaiters, 600);
  }
  function flushWaiters() {
    clearTimeout(waitTimer);
    ignorePops = 0;
    var w = waiters; waiters = [];
    w.forEach(function (f) { f(); });
  }
  function usable(node) {
    if (!node || !node.isConnected) return false;
    if (node.closest && node.closest('[inert]')) return false;
    return !node.getClientRects || node.getClientRects().length > 0;
  }
  function focusNode(node) { if (node && node.focus) { try { node.focus({ preventScroll: true }); } catch (e) { node.focus(); } } }

  /* ── 초점 의도: 마지막으로 정한 대상을 닫기 완료·브라우저 focus fixup 뒤에도 보장한다.
     새 열기·닫기·전환(세대 증가)이나 사용자의 포인터 조작이 있으면 이전 보장은 포기해 다른 선택을 빼앗지 않는다. */
  var intent = { gen: 0, target: null };
  function inTop(node) {
    var top = stack[stack.length - 1];
    return top ? top.el.contains(node) : !(root && root.contains(node));
  }
  function activeOk() {
    var a = document.activeElement;
    if (!a || a === document.body || a === html || !a.isConnected) return false;
    if (a.closest && a.closest('[inert]')) return false;
    return inTop(a);
  }
  function claimFocus(node) {
    var g = ++intent.gen;
    intent.target = node || null;
    focusNode(node);
    requestAnimationFrame(function () { ensureFocus(g); });
    setTimeout(function () { ensureFocus(g); }, 0);
    setTimeout(function () { ensureFocus(g); }, 150);
    setTimeout(function () { ensureFocus(g); }, 400);
  }
  function dropIntent() { intent.gen++; intent.target = null; }
  function interactive(n) {
    if (!n || !n.matches) return false;
    if (n.matches('a[href],button,input,select,textarea,summary,[contenteditable="true"]')) return true;
    var ti = n.getAttribute('tabindex');
    return ti !== null && Number(ti) >= 0;
  }
  // 의도 세대 안에서(사용자 포인터·Tab이 없었는데) 초점이 대상이 아닌 비대화형 요소로 옮겨졌는가.
  // 예: 빠른 열기→닫기 뒤 history 전환에서 브라우저가 이전 초점(section#roadmap, tabindex=-1)을 되살린 경우.
  function browserMoved() {
    var a = document.activeElement;
    return !!intent.target && a !== intent.target && !interactive(a);
  }
  function ensureFocus(g) {
    if (g !== intent.gen || !intent.target) return;
    if (activeOk() && !browserMoved()) return;
    var t = intent.target;
    if (!usable(t) || !inTop(t)) t = stack.length ? stack[stack.length - 1].heading() : null;
    if (!usable(t)) return;
    focusNode(t);
    note('focus-restore', (t.getAttribute && (t.getAttribute('data-open-item') || t.getAttribute('data-open-area') || t.id)) || t.tagName);
  }

  function pushLayer(layer) {
    stack.push(layer);
    setInert(layer.el, false);
    claimFocus(layer.heading()); // 새 층 안으로 먼저 초점을 옮긴 뒤 아래층을 inert로 만든다
    history.pushState({ kl: TOKEN, d: stack.length, item: layer.key }, '');
    sync();
    note('open', layer.key);
  }
  // 스택을 target 깊이까지 닫는다. animateLast=false이면 모두 즉시.
  function popTo(target, animateLast, restore) {
    var lowest = null;
    var closing = [];
    while (stack.length > target) {
      var l = stack.pop();
      l.close({ instant: !(animateLast && stack.length === target) });
      closing.push(l);
      lowest = l;
      note('close', l.key);
    }
    sync(); // 남은 최상위 층(또는 스토리)의 inert를 먼저 푼다
    if (lowest && restore !== false) {
      var t = usable(lowest.opener) ? lowest.opener : (lowest.fallback ? lowest.fallback() : null);
      if (!usable(t) && stack.length) t = stack[stack.length - 1].heading();
      claimFocus(t);
    } else if (lowest) {
      dropIntent();
    }
    // 초점을 옮긴 다음에 닫히는 층을 inert로 만든다(초점이 inert 안에 남아 body로 떨어지는 경합 방지)
    closing.forEach(function (c) { if (stack.indexOf(c) === -1) setInert(c.el, true); });
    if (!stack.length && ctx && ctx.afterClose) ctx.afterClose();
    return lowest;
  }
  function requestClose() {
    if (!stack.length) return;
    var d = stack.length;
    var mine = histDepth() === d;
    popTo(d - 1, true, true);
    if (mine) { ignorePops++; history.back(); }
  }
  function closeAll(then) {
    var d = stack.length;
    if (!d) { if (then) then(); return; }
    var mine = histDepth() === d;
    popTo(0, false, false);
    if (mine) { ignorePops++; history.go(-d); }
    settle(function () { if (then) then(); });
  }
  function onPop() {
    if (ignorePops > 0) { ignorePops--; if (!ignorePops) flushWaiters(); }
    var target = histDepth();
    if (stack.length > target) popTo(target, true, true);
    var g = intent.gen; // history 전환 뒤 브라우저의 초점 복원보다 늦게 한 번 더 확인
    requestAnimationFrame(function () { ensureFocus(g); });
    setTimeout(function () { ensureFocus(g); }, 50);
  }

  /* ── 열기 요청 (단일 진입점) ── */
  function openArea(id, opener) {
    if (!X || !X.zones[id]) return;
    var areaLayer = stack.filter(function (l) { return l.kind === 'area'; })[0];
    if (areaLayer) { if (stack[stack.length - 1] === areaLayer) X.switchTo(id); return; }
    if (stack.length) return; // 영역 펼침은 스토리 바로 위에서만 연다
    X.open(id, opener);
  }
  function openItem(key, opener) {
    if (stack.length >= MAX) return;
    var top = stack[stack.length - 1];
    if (top && top.key === 'detail:' + key) return;
    var d = makeDetail(key, opener);
    if (d) d.open();
  }
  function request(fn) { settle(fn); }

  /* ── 영역 펼침 ── */
  function buildExplore() {
    var el = ctx.el, data = ctx.data;
    var host = el('div', { class: 'xl', id: 'explore', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'xl-title', 'data-state': 'closed', hidden: true });
    var back = el('div', { class: 'xl__back', 'aria-hidden': 'true' });
    var close = el('button', { type: 'button', class: 'btn btn--line xl__close', 'data-close-layer': true, 'aria-label': '영역 펼침 닫고 로드맵으로 돌아가기' }, [
      el('span', { class: 'xl__close-mark', 'aria-hidden': 'true', text: '←' }), '로드맵으로'
    ]);
    var curName = el('strong', { class: 'xl__current-name', id: 'xl-current-name' });
    var navBtns = {};
    var nav = el('nav', { class: 'xl__nav', 'aria-label': '영역 바꾸기' }, [el('ul', null, data.areas.map(function (a, i) {
      var b = el('button', { type: 'button', class: 'xl__nav-btn', 'data-zone-tab': a.id }, [el('span', { class: 'xl__nav-num', 'aria-hidden': 'true', text: ctx.num(i) }), a.title]);
      navBtns[a.id] = b;
      return el('li', null, [b]);
    }))]);
    var bar = el('div', { class: 'xl__bar' }, [
      el('div', { class: 'xl__where' }, [
        el('p', { class: 'step__label xl__label', text: '[ 02 ] 로드맵 · 영역' }),
        el('p', { class: 'xl__current' }, [el('span', { class: 'xl__current-k', text: '지금 보는 영역 ' }), curName])
      ]),
      close,
      nav
    ]);
    var field = el('div', { class: 'xl__field' });
    var zones = {};
    var order = data.areas.map(function (a) { return a.id; });
    var shapeOf = {};
    ctx.layout.areas.forEach(function (a) { shapeOf[a.id] = a.shape; });
    data.areas.forEach(function (a, i) {
      var icon = ctx.svg('svg', { viewBox: '-64 -64 128 128', class: 'zone__shape', 'aria-hidden': 'true', focusable: 'false' }, [ctx.shapeEl(shapeOf[a.id], 'zone__shape-fill')]);
      var tab = el('button', { type: 'button', class: 'zone__tab', 'data-zone-tab': a.id, 'aria-label': '영역 ' + ctx.num(i) + ' ' + a.title + ' 펼치기' }, [
        el('span', { class: 'zone__num', 'aria-hidden': 'true', text: ctx.num(i) }), icon,
        el('span', { class: 'zone__name', 'aria-hidden': 'true', text: a.title })
      ]);
      var body = el('div', { class: 'zone__body' });
      var z = el('section', { class: 'zone', 'data-zone': a.id, 'data-shape': shapeOf[a.id] }, [tab, body]);
      zones[a.id] = { el: z, tab: tab, body: body, index: i };
      field.appendChild(z);
    });
    host.appendChild(back);
    host.appendChild(bar);
    host.appendChild(field);
    root.appendChild(host);

    var S = { el: host, field: field, zones: zones, order: order, area: null, cur: {}, k: 0, b: 0, anim: null, state: 'closed', frames: 0, layer: null, shape: shapeOf, origin: null };

    function fieldBox() { var r = field.getBoundingClientRect(); return { left: r.left, top: r.top, w: field.clientWidth, h: field.clientHeight }; }
    function targetFor(id) {
      var f = fieldBox(), g = 8, out = {};
      var wide = f.w >= 720;
      if (wide) {
        var C = 76, sel = Math.max(240, f.w - 4 * C - 4 * g), x = 0;
        order.forEach(function (z) { var w = z === id ? sel : C; out[z] = { x: x, y: 0, w: w, h: f.h, r: 22 }; x += w + g; });
      } else {
        var cw = (f.w - 3 * g) / 4, i = 0;
        order.forEach(function (z) {
          if (z === id) out[z] = { x: 0, y: 0, w: f.w, h: Math.max(160, f.h), r: 18 };
          else { out[z] = { x: i * (cw + g), y: 0, w: cw, h: 0, r: 0 }; i++; }
        });
      }
      out._wide = wide;
      return out;
    }
    // inert 여부와 무관하게 화면에 배치돼 있는지(닫는 순간 아래층은 아직 inert)
    function shown(n) { return !!n && n.isConnected && (!n.getClientRects || n.getClientRects().length > 0); }
    function onScreen(r) { return !!r && r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < (window.innerHeight || 0); }
    function pieceStart() {
      var f = fieldBox(), out = {};
      var o = shown(S.origin) ? S.origin.getBoundingClientRect() : null;
      var fromButton = onScreen(o) && !onScreen(ctx.pieceRect(S.area));
      order.forEach(function (z, i) {
        var pr = ctx.pieceRect(z);
        if (fromButton) {
          // 선택 영역은 누른 버튼 모양에서, 나머지는 그 자리의 크기 0에서 시작
          out[z] = z === S.area ? { x: o.left - f.left, y: o.top - f.top, w: o.width, h: o.height, r: 12 } : { x: o.left - f.left, y: o.top - f.top, w: 0, h: 0, r: 0 };
        } else if (onScreen(pr)) {
          out[z] = { x: pr.left - f.left, y: pr.top - f.top, w: pr.width, h: pr.height, r: S.shape[z] === 'circle' ? Math.min(pr.width, pr.height) / 2 : 6 };
        } else {
          var w = f.w / order.length; // 무대가 없을 때(오류 등): 같은 폭의 기둥에서 시작
          out[z] = { x: i * w + w * 0.35, y: f.h * 0.4, w: w * 0.3, h: f.h * 0.2, r: 8 };
        }
      });
      return out;
    }
    function apply(rects, k, b) {
      S.k = k; S.b = b;
      host.style.setProperty('--k', r2(k));
      host.style.setProperty('--b', r2(b));
      order.forEach(function (z) {
        var r = rects[z], n = zones[z].el;
        S.cur[z] = copyRect(r);
        n.style.left = r2(r.x) + 'px';
        n.style.top = r2(r.y) + 'px';
        n.style.width = r2(Math.max(0, r.w)) + 'px';
        n.style.height = r2(Math.max(0, r.h)) + 'px';
        n.style.borderRadius = r2(Math.max(0, r.r)) + 'px';
        n.setAttribute('data-geom', [r.x, r.y, r.w, r.h].map(function (v) { return Math.round(v); }).join(','));
      });
    }
    function sizeBody(t) {
      var sel = t[S.area];
      host.classList.toggle('is-wide', !!t._wide);
      var body = zones[S.area].body;
      body.style.width = Math.round(sel.w) + 'px';
      body.style.height = Math.round(sel.h) + 'px';
      body.classList.toggle('zone__body--cols', sel.w >= 860);
      // 모바일에서 접힌 영역의 세로 탭은 숨겨 Tab 순서에서 뺀다(영역 바꾸기는 바의 목록)
      order.forEach(function (z) { zones[z].tab.hidden = z === S.area || !t._wide; });
    }
    function markSelected() {
      order.forEach(function (z) {
        var on = z === S.area;
        zones[z].el.classList.toggle('is-selected', on);
        zones[z].tab.hidden = on;
        zones[z].body.hidden = !on;
        if (!on) zones[z].body.textContent = '';
      });
      host.setAttribute('data-area', S.area || '');
      var a = data.areas.filter(function (x) { return x.id === S.area; })[0];
      curName.textContent = a ? a.title : '';
      order.forEach(function (z) {
        if (z === S.area) navBtns[z].setAttribute('aria-current', 'true'); else navBtns[z].removeAttribute('aria-current');
      });
      revealNav();
    }
    // 가로 영역 목록 안에서 선택 버튼이 보이도록 목록(ul)의 scrollLeft만 최소로 맞춘다.
    // 문서·영역 본문의 스크롤은 건드리지 않는다(scrollIntoView를 쓰지 않음).
    function revealNav() {
      var list = nav.firstChild, btn = navBtns[S.area];
      if (!list || !btn || !list.getBoundingClientRect || !btn.getBoundingClientRect) return;
      var lr = list.getBoundingClientRect(), br = btn.getBoundingClientRect();
      if (!(lr.width > 0) || !(br.width > 0)) return; // 숨김·배치 전이면 그대로
      var pad = 8, cur = Number(list.scrollLeft) || 0, next = cur;
      if (br.left < lr.left + pad) next = cur - (lr.left + pad - br.left);
      else if (br.right > lr.right - pad) next = cur + (br.right - (lr.right - pad));
      if (next !== cur) list.scrollLeft = Math.max(0, Math.round(next));
    }
    function run(state, from, to, k0, k1, bFrom, dur, done) {
      if (S.anim) S.anim.cancel();
      S.state = state;
      host.setAttribute('data-state', state);
      S.frames = 0;
      var t0 = performance.now();
      note('anim-start', 'area:' + state, { dur: dur, reduced: reduced() });
      S.anim = tween(dur, function (e, p) {
        S.frames++;
        var rects = {};
        order.forEach(function (z) { rects[z] = mixRect(from[z], to[z], e); });
        var k = lerp(k0, k1, e);
        var b = state === 'closing' ? lerp(bFrom, 0, clamp01(e * 2.2)) : clamp01((e - 0.5) / 0.5);
        apply(rects, k, b);
        host.setAttribute('data-t', p.toFixed(3));
        host.setAttribute('data-frames', String(S.frames));
      }, function () {
        S.anim = null;
        note('anim-end', 'area:' + state, { ms: Math.round(performance.now() - t0), frames: S.frames });
        done();
      });
    }

    S.open = function (id, opener) {
      var wasClosing = S.state === 'closing';
      host.hidden = false;
      host.classList.remove('is-closing');
      S.area = id;
      S.origin = opener || null;
      markSelected();
      zones[id].body.appendChild(zoneBody(id));
      var target = targetFor(id);
      sizeBody(target);
      var from = wasClosing ? S.cur : pieceStart();
      if (!wasClosing) apply(from, 0, 0);
      var layer = {
        kind: 'area', key: 'area:' + id, el: host, opener: opener,
        heading: function () { return $('xl-title'); },
        fallback: function () { return document.querySelector('[data-open-area="' + S.area + '"]'); },
        close: function (o) { S.close(o); }
      };
      S.layer = layer;
      pushLayer(layer);
      run('opening', from, target, wasClosing ? S.k : 0, 1, 0, DUR.areaOpen, function () { S.state = 'open'; host.setAttribute('data-state', 'open'); });
    };
    S.switchTo = function (id) {
      if (id === S.area || !zones[id]) return;
      var from = {};
      order.forEach(function (z) { from[z] = copyRect(S.cur[z]); });
      S.area = id;
      markSelected();
      zones[id].body.appendChild(zoneBody(id));
      var target = targetFor(id);
      sizeBody(target);
      S.origin = null; // 전환 뒤 닫으면 지금 영역의 여는 버튼으로 돌아간다
      S.layer.key = 'area:' + id;
      if (histDepth() === stack.length) history.replaceState({ kl: TOKEN, d: stack.length, item: S.layer.key }, '');
      sync();
      note('switch', S.layer.key);
      run('switching', from, target, 1, 1, 0, DUR.areaSwitch, function () { S.state = 'open'; host.setAttribute('data-state', 'open'); });
      claimFocus($('xl-title'));
    };
    S.close = function (o) {
      host.classList.add('is-closing');
      var finish = function () {
        S.state = 'closed';
        host.setAttribute('data-state', 'closed');
        host.hidden = true;
        host.classList.remove('is-closing');
        order.forEach(function (z) { zones[z].body.textContent = ''; });
        S.area = null;
        host.setAttribute('data-area', '');
        ensureFocus(intent.gen); // 닫기 완료 후 초점 재확인
      };
      if (o && o.instant) { if (S.anim) S.anim.cancel(); S.anim = null; finish(); note('anim-end', 'area:closed-instant'); return; }
      var from = {};
      order.forEach(function (z) { from[z] = copyRect(S.cur[z]); });
      // 돌아갈 곳: 처음 누른 버튼, 없으면 같은 영역의 여는 버튼
      if (!shown(S.origin) && S.layer && S.layer.fallback) S.origin = S.layer.fallback();
      run('closing', from, pieceStart(), S.k, 0, S.b, DUR.areaClose, finish);
    };
    S.relayout = function () {
      if (S.state === 'closed' || S.state === 'closing') return;
      if (S.anim) { S.anim.cancel(); S.anim = null; }
      var t = targetFor(S.area);
      sizeBody(t);
      apply(t, 1, 1);
      S.state = 'open';
      host.setAttribute('data-state', 'open');
      host.setAttribute('data-t', '1.000');
      revealNav();
    };
    return S;
  }

  function zoneBody(id) {
    var el = ctx.el, data = ctx.data;
    var a = data.areas.filter(function (x) { return x.id === id; })[0];
    var i = data.areas.indexOf(a);
    var topics = data.topics.filter(function (t) { return t.area === id; });
    var avail = topics.filter(function (t) { return t.availability === 'available'; });
    var prep = topics.filter(function (t) { return t.availability !== 'available'; });
    var rel = ctx.relatedOf(id);
    var exts = data.extensions.filter(function (x) { return (x.relatedAreas || []).indexOf(id) !== -1; });
    var ex = data.resources.filter(function (r) { return r.kind === 'example'; })[0];
    var exSteps = ex ? ex.steps.filter(function (s) { return s.area === id; }) : [];
    var resLabel = function (s) { return (data.statusLabels.resource || {})[s] || s; };
    var secId = function (k) { return 'zb-' + k; };
    var head = function (k, text) { return el('h3', { class: 'zb__h', id: secId(k), tabindex: '-1', text: text }); };
    var topicList = function (list, label) { return el('ul', { class: 'topics', 'aria-label': label }, list.map(function (t) { return ctx.topicItem(t); })); };

    var secAvail = el('section', { class: 'zb__sec zb__sec--avail', 'aria-labelledby': secId('avail') }, [
      head('avail', '공개 자료가 있는 주제 ' + avail.length),
      avail.length ? topicList(avail, a.title + ' — 공개 자료가 있는 주제') : el('p', { class: 'empty', text: '이 영역에는 아직 공개 자료가 연결된 주제가 없습니다.' })
    ]);
    var secRel = el('section', { class: 'zb__sec zb__sec--rel', 'aria-labelledby': secId('rel') }, [
      head('rel', '이 영역과 연결된 강의·예제 ' + rel.length),
      rel.length ? el('ul', { class: 'zb__rels' }, rel.map(function (r) {
        return el('li', { class: 'zb__rel', 'data-card': true }, [
          el('p', { class: 'zb__rel-type', text: r.type + ' · ' + resLabel(r.status) }),
          el('p', { class: 'zb__rel-title', text: r.title }),
          el('button', { type: 'button', class: 'btn btn--open zb__rel-open', 'data-open-item': r.key, 'aria-haspopup': 'dialog', 'aria-label': r.title + ' 정보 보기' }, ['정보 보기'])
        ]);
      })) : el('p', { class: 'empty', text: '아직 연결된 공개 자료가 없습니다.' }),
      exSteps.length ? el('div', { class: 'zb__ex' }, [
        el('h4', { class: 'zb__h4', text: '코드 예제에서 이 영역에 해당하는 파일' }),
        el('ul', { class: 'src' }, exSteps.map(function (s) {
          return el('li', null, [el('span', { class: 'src__type', text: s.label }), ctx.srcLink(s.source), el('span', { class: 'zb__look', text: '확인할 것: ' + s.look })]);
        }))
      ]) : null
    ]);
    var secPrep = prep.length ? el('section', { class: 'zb__sec zb__sec--prep', 'aria-labelledby': secId('prep') }, [
      head('prep', '준비 중인 주제 ' + prep.length),
      topicList(prep, a.title + ' — 준비 중인 주제')
    ]) : null;
    var secExt = exts.length ? el('section', { class: 'zb__sec zb__sec--ext', 'aria-labelledby': secId('ext') }, [
      head('ext', '이어지는 확장 주제'),
      el('ul', { class: 'zb__ext-list' }, exts.map(function (x) {
        var s = ctx.src[x.module];
        return el('li', { class: 'zb__ext' }, [
          el('h4', { class: 'ext__title', text: x.title }),
          el('p', { class: 'ext__summary', text: x.summary }),
          ctx.moduleLine(x),
          s && s.kind === 'dir' ? el('p', { class: 'ext__module' }, [ctx.srcLink(x.module, '모듈 폴더 열기', 'link')]) : null // 파일 모듈은 상태 줄에 링크가 있다
        ]);
      }))
    ]) : null;
    var jumps = [['avail', '공개 자료 있는 주제', avail.length], ['rel', '연결된 강의·예제', rel.length]];
    if (prep.length) jumps.push(['prep', '준비 중인 주제', prep.length]);
    return el('div', { class: 'zb' }, [
      el('p', { class: 'step__label', text: '[ 02·' + (i + 1) + ' ] 영역 ' + ctx.num(i) + ' / ' + ctx.num(data.areas.length - 1) }),
      el('h2', { class: 'zb__title', id: 'xl-title', tabindex: '-1', text: a.title }),
      el('p', { class: 'step__lede zb__lede', text: a.summary }),
      el('nav', { class: 'zb__jumps', 'aria-label': a.title + ' 안에서 바로 가기' }, [el('ul', null, jumps.map(function (j) {
        return el('li', null, [el('button', { type: 'button', class: 'zb__jump', 'data-zone-jump': secId(j[0]) }, [j[1], el('span', { class: 'zb__jump-n', text: String(j[2]) })])]);
      }))]),
      el('div', { class: 'zb__cols' }, [
        el('div', { class: 'zb__col zb__col--main' }, [secAvail, secPrep]),
        el('div', { class: 'zb__col zb__col--side' }, [secRel, secExt])
      ]),
      el('p', { class: 'legend' }, [
        el('span', { class: 'legend__item' }, [el('strong', { text: '연결 자료' }), ' 지금 열어 볼 자료가 있는지 (완성·실행 보장 아님)']),
        el('span', { class: 'legend__item' }, [el('strong', { text: '모듈 원문 상태' }), ' 주제 설명 문서의 작성 상태 (강의·예제 상태 아님)'])
      ])
    ]);
  }

  /* ── 자료 상세 ── */
  function findItem(key) {
    var m = /^(res|course):([\w-]{1,40})$/.exec(key || '');
    if (!m) return null;
    var list = m[1] === 'res' ? ctx.data.resources : ctx.data.courses;
    var item = list.filter(function (x) { return x.id === m[2]; })[0];
    return item ? { kind: m[1], item: item } : null;
  }
  function courseExtras(c) {
    var base = (c.links[0] && c.links[0].source) || '';
    return Object.keys(ctx.src).filter(function (id) {
      return base && id.indexOf(base + '-') === 0 && !c.links.some(function (l) { return l.source === id; });
    });
  }
  function linkList(ids, label) {
    var items = ids.map(function (id) {
      var s = ctx.src[id];
      var a = s ? ctx.srcLink(id, s.title) : null;
      return a ? ctx.el('li', null, [ctx.el('span', { class: 'src__type', text: ctx.TYPE[s.type] || '자료' }), a]) : null;
    }).filter(Boolean);
    return items.length ? ctx.el('ul', { class: 'src dl__src', 'aria-label': label }, items) : null;
  }
  function reportLine() {
    var el = ctx.el;
    return el('p', { class: 'dl__small dl__report' }, ['오류를 발견했다면 ',
      el('a', { class: 'link', href: ctx.issues }, ['오류·개선 제안 (GitHub)', ctx.ext()]),
      ' (GitHub 로그인 필요)']);
  }
  // 상세 닫기 버튼 이름: 닫으면 어디로 돌아가는지
  function backLabel(opener) {
    var under = stack[stack.length - 1];
    if (under && under.kind === 'area' && X && X.area) {
      var a = ctx.data.areas.filter(function (x) { return x.id === X.area; })[0];
      return a ? '‘' + a.title + '’ 영역으로' : '영역으로';
    }
    var at = function (sel) { return opener && opener.closest && opener.closest(sel); };
    if (at('#course-list')) return '강의 목록으로';
    if (at('#material-list')) return '공개 자료로';
    if (at('#area-steps')) return '로드맵으로';
    return '닫기';
  }
  function detailContent(found, titleId) {
    var el = ctx.el, data = ctx.data, it = found.item;
    var resLabel = function (s) { return (data.statusLabels.resource || {})[s] || s; };
    var cover, body = [];
    var index = (found.kind === 'res' ? data.resources : data.courses).indexOf(it);
    if (found.kind === 'course') {
      var note = it.instructorSource === 'courses-index' ? ' (강의 목록 표기)' : '';
      cover = [
        el('span', { class: 'dl__num', 'aria-hidden': 'true', text: ctx.num(index) }),
        el('p', { class: 'mat__type' }, [el('span', { text: '공개 강의 · ' + it.series }), ctx.resChip(it.status)]),
        el('h2', { class: 'dl__title', id: titleId, tabindex: '-1', text: it.title }),
        el('p', { class: 'course__full', text: it.fullTitle })
      ];
      body.push(el('dl', { class: 'dl__facts' }, [
        el('div', null, [el('dt', { text: '대상' }), el('dd', { text: it.audience })]),
        it.goal ? el('div', null, [el('dt', { text: '배우는 것' }), el('dd', { text: it.goal })]) : null,
        el('div', null, [el('dt', { text: '분량' }), el('dd', { text: it.duration })]),
        el('div', null, [el('dt', { text: '강사' }), el('dd', { text: it.instructor + note })]),
        el('div', null, [el('dt', { text: '로드맵' }), el('dd', { text: it.areas.map(ctx.areaTitle).join(' · ') })])
      ]));
      body.push(el('h3', { class: 'zb__h', text: '원문 바로 열기' }));
      body.push(el('p', { class: 'dl__small dl__small--top', text: '원문은 GitHub에서 열립니다. 브라우저 뒤로 가기로 돌아옵니다.' }));
      body.push(el('ul', { class: 'src dl__src dl__go', 'aria-label': it.title + ' 원문 바로 열기 (GitHub)' }, it.links.map(function (l) {
        return el('li', null, [ctx.goLink(l.source, l.label + ' 열기')]); // 이름이 곧 종류(강의 안내·교재 PDF·실습)
      })));
      var extras = courseExtras(it);
      if (extras.length) {
        body.push(el('h3', { class: 'zb__h', text: '같은 강의 폴더의 다른 원본' }));
        body.push(linkList(extras, it.title + ' 추가 원본'));
      }
      body.push(el('p', { class: 'dl__small', text: '도구 계정·설치 환경·이용 비용은 과정마다 다릅니다. 강의 안내에서 먼저 확인하세요.' }));
      body.push(reportLine());
    } else {
      var count = it.collects === 'course' ? ' ' + data.courses.length + '개' : '';
      cover = [
        el('span', { class: 'dl__num', 'aria-hidden': 'true', text: ctx.num(index) }),
        el('p', { class: 'mat__type' }, [el('span', { text: it.type + count }), ctx.resChip(it.status)]),
        el('h2', { class: 'dl__title', id: titleId, tabindex: '-1', text: it.title })
      ];
      body.push(el('p', { class: 'dl__lede', text: it.summary }));
      if (it.areas) body.push(el('p', { class: 'mat__areas', text: '로드맵 · ' + it.areas.map(ctx.areaTitle).join(' · ') }));
      if (it.kind === 'project') {
        var ids = ['readme', 'methodology', 'getting-started', 'verification'].filter(function (s) { return ctx.src[s]; });
        if (ids.length) { body.push(el('h3', { class: 'zb__h', text: '함께 읽는 원본' })); body.push(linkList(ids, it.title + ' 원본')); }
      } else if (it.kind === 'collection') {
        // 상세 위에 상세를 겹치지 않는다: 같은 페이지의 강의 카드로 이동(상세는 닫힘)
        body.push(el('h3', { class: 'zb__h', text: '공개 강의 ' + data.courses.length + '개' }));
        body.push(el('ul', { class: 'dl__courses' }, data.courses.map(function (c, j) {
          return el('li', { class: 'dl__course', 'data-card': true }, [
            el('span', { class: 'dl__course-num', 'aria-hidden': 'true', text: ctx.num(j) }),
            el('div', null, [
              el('p', { class: 'course__series' }, [el('span', { text: c.series }), ctx.resChip(c.status)]),
              el('p', { class: 'dl__course-title', text: c.title }),
              el('p', { class: 'dl__course-meta', text: c.audience + ' · ' + c.duration })
            ]),
            el('a', { class: 'btn btn--line', href: '#course-' + c.id, 'aria-label': c.title + ' 강의 카드로 이동' }, ['강의 카드로 이동'])
          ]);
        })));
        body.push(el('p', { class: 'dl__small', text: '교재와 실습은 GitHub 원본에서 열립니다. 도구 계정·설치 환경·이용 비용은 과정마다 다르므로 각 강의 안내를 먼저 읽어 주세요.' }));
      } else if (it.kind === 'example') {
        body.push(el('p', { class: 'dl__small', text: '실제 웹앱 데모가 아니라, GitHub에서 문서와 코드를 읽는 예제입니다. 아래 파일을 차례로 여세요.' }));
        body.push(el('ol', { class: 'dl__chain' }, (it.steps || []).map(function (s, j) {
          var f = ctx.src[s.source];
          return el('li', { class: 'dl__link-step' }, [
            el('span', { class: 'chain__num', 'aria-hidden': 'true', text: ctx.num(j) }),
            el('p', { class: 'chain__label', text: s.label + ' · ' + ctx.areaTitle(s.area) }),
            ctx.srcLink(s.source, f ? f.title : s.label, 'chain__link'),
            el('p', { class: 'chain__look', text: '확인할 것: ' + s.look }),
            f ? el('p', { class: 'chain__path', text: f.path }) : null
          ]);
        })));
        var intro = ctx.srcLink(it.intro, '예제 안내');
        body.push(el('p', { class: 'dl__small' }, ['직접 실행하려면 Node.js와 pnpm이 필요하고, 패키지 설치에는 인터넷 연결이 필요합니다. 실행 방법은 ', intro || '예제 안내', '에서 확인하세요.']));
      }
      body.push(el('div', { class: 'mat__actions' }, (it.actions || []).map(function (a, j) { return ctx.actionLink(a, j === 0); })));
      body.push(reportLine());
    }
    return { cover: cover, body: body };
  }

  function makeDetail(key, opener) {
    var found = findItem(key);
    if (!found) return null;
    var el = ctx.el;
    var n = ++seq;
    var titleId = 'dl-title-' + n;
    var parts = detailContent(found, titleId);
    var scrim = el('div', { class: 'dl__scrim', 'data-close-layer': true, 'aria-hidden': 'true' });
    var back = backLabel(opener);
    var closeBtn = el('button', { type: 'button', class: 'dl__close', 'data-close-layer': true, 'aria-label': back === '닫기' ? '상세 닫기' : '상세 닫고 ' + back.replace(/으로$/, '으로 돌아가기') }, [el('span', { class: 'dl__back', 'aria-hidden': 'true', text: '←' }), el('span', { 'aria-hidden': 'true', text: back })]);
    var cover = el('div', { class: 'dl__cover' }, parts.cover);
    var body = el('div', { class: 'dl__body' }, parts.body);
    var sheet = el('div', { class: 'dl__sheet' }, [closeBtn, cover, body]);
    var host = el('div', { class: 'dl', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId, 'data-item': key, 'data-state': 'closed' }, [scrim, sheet]);
    host.style.zIndex = String(70 + stack.length);
    var D = { host: host, anim: null, frames: 0, state: 'closed', clip: null };
    var card = opener && opener.closest ? (opener.closest('[data-card]') || opener) : null;

    function sheetBox() { return sheet.getBoundingClientRect(); }
    function srcClip(sb) {
      var r = card && card.isConnected ? card.getBoundingClientRect() : null;
      var vis = r && r.width > 4 && r.bottom > 0 && r.top < window.innerHeight;
      if (!vis) {
        var cx = sb.width * 0.2, cy = sb.height * 0.3;
        return { t: cy, r: cx, b: cy, l: cx, rad: 16, ty: 40, fade: true };
      }
      return {
        t: Math.max(0, r.top - sb.top), r: Math.max(0, sb.right - r.right), b: Math.max(0, sb.bottom - r.bottom), l: Math.max(0, r.left - sb.left),
        rad: 12, ty: Math.max(-sb.height, Math.min(sb.height, r.top - sb.top)), fade: false
      };
    }
    var FULL = { t: 0, r: 0, b: 0, l: 0, rad: -1, ty: 0, fade: false };
    function apply(c, e, b) {
      var rad = c.rad < 0 ? '' : ' round ' + r2(c.rad) + 'px';
      sheet.style.clipPath = 'inset(' + [c.t, c.r, c.b, c.l].map(function (v) { return r2(v) + 'px'; }).join(' ') + rad + ')';
      cover.style.transform = c.ty ? 'translateY(' + r2(c.ty) + 'px)' : '';
      host.style.setProperty('--k', r2(e));
      host.style.setProperty('--b', r2(b));
      sheet.style.opacity = c.fade ? String(r2(Math.max(0.001, e))) : '';
      sheet.setAttribute('data-clip', [c.t, c.r, c.b, c.l].map(function (v) { return Math.round(v); }).join(','));
      D.clip = c;
    }
    function mixClip(a, b2, t) {
      var radA = a.rad < 0 ? 0 : a.rad, radB = b2.rad < 0 ? 0 : b2.rad;
      return { t: lerp(a.t, b2.t, t), r: lerp(a.r, b2.r, t), b: lerp(a.b, b2.b, t), l: lerp(a.l, b2.l, t), rad: t >= 1 && b2.rad < 0 ? -1 : lerp(radA, radB, t), ty: lerp(a.ty, b2.ty, t), fade: a.fade || b2.fade };
    }
    function run(state, from, to, dur, kFrom, kTo, done) {
      if (D.anim) D.anim.cancel();
      D.state = state; host.setAttribute('data-state', state);
      D.frames = 0;
      var t0 = performance.now();
      note('anim-start', 'detail:' + key + ':' + state, { dur: dur, reduced: reduced() });
      D.anim = tween(dur, function (e, p) {
        D.frames++;
        var c = mixClip(from, to, e);
        if (to.fade && p >= 1) c.fade = state !== 'opening';
        var k = lerp(kFrom, kTo, e);
        var b = state === 'opening' ? clamp01((e - 0.45) / 0.55) : clamp01(1 - e * 2);
        apply(c, k, b);
        host.setAttribute('data-t', p.toFixed(3));
        host.setAttribute('data-frames', String(D.frames));
      }, function () {
        D.anim = null;
        note('anim-end', 'detail:' + key + ':' + state, { ms: Math.round(performance.now() - t0), frames: D.frames });
        done();
      });
    }

    D.open = function () {
      root.appendChild(host);
      var sb = sheetBox();
      var from = srcClip(sb);
      apply(from, 0, 0);
      var layer = {
        kind: 'detail', key: 'detail:' + key, el: host, opener: opener,
        heading: function () { return $(titleId); },
        fallback: function () { return null; },
        close: function (o) { D.close(o); }
      };
      pushLayer(layer);
      run('opening', from, FULL, DUR.detailOpen, 0, 1, function () {
        apply(FULL, 1, 1);
        sheet.style.clipPath = '';
        D.state = 'open'; host.setAttribute('data-state', 'open');
      });
    };
    D.close = function (o) {
      host.classList.add('is-closing');
      var remove = function () { D.state = 'closed'; host.setAttribute('data-state', 'closed'); if (host.parentNode) host.parentNode.removeChild(host); ensureFocus(intent.gen); };
      if (o && o.instant) { if (D.anim) D.anim.cancel(); D.anim = null; remove(); note('anim-end', 'detail:' + key + ':closed-instant'); return; }
      var from = D.clip || FULL;
      sheet.scrollTop = 0;
      var to = srcClip(sheetBox());
      run('closing', { t: from.t, r: from.r, b: from.b, l: from.l, rad: from.rad < 0 ? 0 : from.rad, ty: from.ty, fade: false }, to, DUR.detailClose, 1, 0, remove);
    };
    D.relayout = function () {
      if (D.state !== 'opening' && D.state !== 'open') return;
      if (D.anim) { D.anim.cancel(); D.anim = null; }
      apply(FULL, 1, 1);
      sheet.style.clipPath = '';
      D.state = 'open'; host.setAttribute('data-state', 'open'); host.setAttribute('data-t', '1.000');
    };
    host._detail = D;
    return D;
  }

  /* ── 전역 핸들러: 각 1개 ── */
  function onKey(e) {
    if (e.key === 'Tab') dropIntent(); // 사용자의 Tab 이동은 초점 보장보다 우선
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (stack.length) { e.preventDefault(); request(requestClose); return; }
      if (toc && toc.isOpen()) toc.close(true);
      return;
    }
    if (e.key === 'Tab' && stack.length) {
      var box = stack[stack.length - 1].el;
      var f = Array.prototype.filter.call(box.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'), function (n) { return !n.hidden && usable(n); });
      if (!f.length) return;
      var first = f[0], lastF = f[f.length - 1], act = document.activeElement;
      if (!box.contains(act)) { e.preventDefault(); focusNode(first); }
      else if (e.shiftKey && (act === first || act === stack[stack.length - 1].heading())) { e.preventDefault(); focusNode(lastF); }
      else if (!e.shiftKey && act === lastF) { e.preventDefault(); focusNode(first); }
    }
  }
  function onFocusIn(e) {
    if (!stack.length) return;
    var top = stack[stack.length - 1];
    if (!top.el.contains(e.target)) focusNode(top.heading());
  }
  function onClick(e) {
    var j = e.target && e.target.closest ? e.target.closest('[data-zone-jump]') : null;
    if (j) {
      e.preventDefault();
      var sec = $(j.getAttribute('data-zone-jump'));
      if (sec && stack.length && stack[stack.length - 1].el.contains(sec)) { sec.scrollIntoView({ block: 'start' }); focusNode(sec); }
      return;
    }
    var t = e.target && e.target.closest ? e.target.closest('[data-open-area],[data-open-item],[data-close-layer],[data-zone-tab]') : null;
    if (t) {
      e.preventDefault();
      if (t.hasAttribute('data-close-layer')) { var lay = t.closest('.dl,.xl'); if (stack.length && lay === stack[stack.length - 1].el) request(requestClose); return; }
      if (t.hasAttribute('data-zone-tab')) { var id = t.getAttribute('data-zone-tab'); request(function () { openArea(id, t); }); return; }
      if (t.hasAttribute('data-open-area')) { var aid = t.getAttribute('data-open-area'); request(function () { openArea(aid, t); }); return; }
      var key = t.getAttribute('data-open-item');
      request(function () { openItem(key, t); });
      return;
    }
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (a && stack.length && root.contains(a)) {
      e.preventDefault();
      var href = a.getAttribute('href');
      request(function () {
        closeAll(function () {
          var node = $(href.slice(1));
          if (!node) return;
          if (location.hash === href) node.scrollIntoView({ block: 'start' }); else location.hash = href;
          if (node.tabIndex === -1) claimFocus(node);
        });
      });
    }
  }
  function onResize() {
    if (X) X.relayout();
    stack.forEach(function (l) { if (l.kind === 'detail' && l.el._detail) l.el._detail.relayout(); });
  }
  function onVisibility() {
    if (document.visibilityState !== 'hidden') return;
    if (X && X.anim) X.anim.finish();
    stack.forEach(function (l) { if (l.el._detail && l.el._detail.anim) l.el._detail.anim.finish(); });
  }

  document.addEventListener('keydown', onKey);
  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('click', onClick);
  window.addEventListener('popstate', onPop);
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('pointerdown', function (e) { if (!(e.target && e.target.closest && e.target.closest('[data-open-area],[data-open-item],[data-close-layer],[data-zone-tab]'))) dropIntent(); }, true);
  if (reduceQ.addEventListener) reduceQ.addEventListener('change', onResize);
  if (history.state && history.state.kl) history.replaceState(null, ''); // 새로 고침 후 남은 겹 화면 기록 정리

  window.KLayers = {
    registerToc: function (t) { toc = t; },
    init: function (c) {
      ctx = c;
      root = $('layers');
      if (!root) { root = ctx.el('div', { class: 'layers', id: 'layers' }); document.body.appendChild(root); }
      X = buildExplore();
      html.setAttribute('data-layers', '0');
    },
    depth: function () { return stack.length; },
    stack: function () { return stack.map(function (l) { return l.key; }); },
    trace: trace,
    durations: DUR
  };
})();
