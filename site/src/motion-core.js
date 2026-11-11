/* kosta-ai-lab 포털 스크롤 스토리 — 순수 계산 (DOM 없음, Apache-2.0).
   장면 기준점 → 장면 값 f, 장면별 무대 상태 S_i, 선형 보간. 브라우저(story.js)와 Node 검사(scripts/)가 같이 쓴다. */
(function (root) {
  'use strict';

  var AREA_POS = [[170, 300], [390, 210], [560, 440], [770, 330], [850, 610]];
  var AREA_SHAPES = ['circle', 'square', 'hexagon', 'diamond', 'triangle'];
  var BASE_ANGLE = [180, 270, 180, 270, 90];
  var AREA_LABEL = [[0, 82, 'middle'], [0, 84, 'middle'], [0, -74, 'middle'], [0, 86, 'middle'], [-82, 10, 'end']];
  var SCATTER_AREA = [[230, 170, -24, 1.9], [790, 150, 32, 1.5], [600, 560, 18, 2.4], [150, 760, -40, 1.6], [860, 840, 28, 1.4]];
  var SCATTER_TOPIC = [[90, 90, -10], [420, 80, 20], [940, 330, 0], [300, 420, 15], [700, 300, -25], [480, 900, 30], [950, 560, 10], [80, 520, -15], [360, 690, 5], [720, 720, -30], [560, 200, 25]];
  var EXT_POS = [[470, 720], [620, 800]];
  var EXT_LABEL = [[-52, 8, 'end'], [52, 8, 'start']];
  var SCATTER_EXT = [[300, 900, 30, 1.3], [930, 90, -20, 1.2]];
  var MAIN_PATH = 'M170 300C260 240 300 210 390 210C480 210 480 440 560 440C640 440 680 330 770 330C860 330 830 520 850 610';
  var FOCUS_SCALE = 1.8;

  function pick(list, i, fallback) { return list[i] || fallback(i); }
  function round(n) { return Math.round(n * 100) / 100; }

  /* 데이터 → 무대 배치(좌표·도형·이름 위치) */
  function layout(data) {
    var areas = data.areas.map(function (a, i) {
      var p = pick(AREA_POS, i, function (k) { return [150 + (k * 170) % 700, 900]; });
      var lab = pick(AREA_LABEL, i, function () { return [0, 80, 'middle']; });
      return { id: a.id, index: i, x: p[0], y: p[1], shape: AREA_SHAPES[i % AREA_SHAPES.length], label: { x: p[0] + lab[0], y: p[1] + lab[1], anchor: lab[2] } };
    });
    var byId = {};
    areas.forEach(function (a) { byId[a.id] = a; });
    var topics = [];
    areas.forEach(function (a) {
      var list = data.topics.filter(function (t) { return t.area === a.id; });
      var base = BASE_ANGLE[a.index] != null ? BASE_ANGLE[a.index] : 90;
      list.forEach(function (t, j) {
        var ang = (base + (j - (list.length - 1) / 2) * 42) * Math.PI / 180;
        var x = round(a.x + Math.cos(ang) * 110);
        var y = round(a.y + Math.sin(ang) * 110);
        var dx = x - a.x;
        var dy = y - a.y;
        var label = dx < -5 ? { x: x - 22, y: y + 6, anchor: 'end' } : dx > 5 ? { x: x + 22, y: y + 6, anchor: 'start' } : { x: x, y: dy < 0 ? y - 24 : y + 38, anchor: 'middle' };
        topics.push({ id: t.id, area: a.id, x: x, y: y, available: t.availability === 'available', label: label });
      });
    });
    var exts = data.extensions.map(function (x, i) {
      var p = pick(EXT_POS, i, function (k) { return [320 + k * 150, 880]; });
      var lab = pick(EXT_LABEL, i, function () { return [0, 56, 'middle']; });
      var from = byId[(x.relatedAreas || [])[0]] || areas[0];
      return { id: x.id, x: p[0], y: p[1], available: x.availability === 'available', from: { x: from.x, y: from.y + 52 }, relatedAreas: x.relatedAreas || [], label: { x: p[0] + lab[0], y: p[1] + lab[1], anchor: lab[2] } };
    });
    return { areas: areas, topics: topics, exts: exts, mainPath: MAIN_PATH };
  }

  /* 장면 순서: 취지, 소개, 로드맵, 영역×N, 확장, 자료 */
  function sceneNames(data) {
    return ['취지', '소개', '로드맵'].concat(data.areas.map(function (a) { return a.title; }), ['확장 주제', '공개 자료']);
  }

  function base(lay, pos) {
    var s = { 'cam.x': 0, 'cam.y': 0, 'cam.s': 1, 'line.main': 0, 'line.spoke': 0, 'line.branch': 0, 'line.o': 1, 'mats': 0 };
    lay.areas.forEach(function (a) { s['lab.' + a.id] = 0; });
    lay.topics.forEach(function (t) { s['lab.' + t.id] = 0; });
    lay.exts.forEach(function (x) { s['lab.' + x.id] = 0; });
    lay.areas.forEach(function (a, i) { var p = pos.area(a, i); setPiece(s, 'area:' + a.id, p); });
    lay.topics.forEach(function (t, i) { setPiece(s, 'topic:' + t.id, pos.topic(t, i)); });
    lay.exts.forEach(function (x, i) { setPiece(s, 'ext:' + x.id, pos.ext(x, i)); });
    return s;
  }
  function setPiece(s, key, p) {
    s['p.' + key + '.x'] = p[0]; s['p.' + key + '.y'] = p[1]; s['p.' + key + '.r'] = p[2] || 0;
    s['p.' + key + '.s'] = p[3] == null ? 1 : p[3]; s['p.' + key + '.o'] = p[4] == null ? 1 : p[4]; s['p.' + key + '.h'] = p[5] || 0;
  }
  function focus(s, cx, cy, k) { s['cam.s'] = k; s['cam.x'] = round(500 - k * cx); s['cam.y'] = round(500 - k * cy); }

  /* 장면별 무대 상태 */
  function buildStates(data, lay) {
    lay = lay || layout(data);
    var scatter = {
      area: function (a, i) { return pick(SCATTER_AREA, i, function () { return [a.x, 950, 0, 1]; }); },
      topic: function (t, i) { var p = SCATTER_TOPIC[i % SCATTER_TOPIC.length]; return [p[0], p[1], p[2], 1.4, 0.85]; },
      ext: function (x, i) { return pick(SCATTER_EXT, i, function () { return [x.x, 960, 0, 1]; }); }
    };
    var map = {
      area: function (a) { return [a.x, a.y, 0, 1, 1, 0]; },
      topic: function (t) { return [t.x, t.y, 0, 1, 1]; },
      ext: function (x) { return [x.x, x.y, 0, 1, 1]; }
    };
    var S0 = base(lay, scatter);
    var S2 = base(lay, map);
    S2['line.main'] = 1; S2['line.spoke'] = 1; S2['line.branch'] = 1;
    lay.areas.forEach(function (a) { S2['lab.' + a.id] = 1; });
    lay.exts.forEach(function (x) { S2['lab.' + x.id] = 0.85; });
    var S1 = mix(S0, S2, 0.5);
    Object.keys(S1).forEach(function (k) { if (/\.r$/.test(k)) S1[k] = round(S0[k] * 0.4); });
    S1['line.main'] = 0.25; S1['line.spoke'] = 0; S1['line.branch'] = 0;
    Object.keys(S1).forEach(function (k) { if (k.indexOf('lab.') === 0) S1[k] = 0; });

    var states = [S0, S1, S2];
    lay.areas.forEach(function (a) {
      var s = Object.assign({}, S2);
      focus(s, a.x, a.y, FOCUS_SCALE);
      s['line.o'] = 0.45;
      lay.areas.forEach(function (b) {
        s['p.area:' + b.id + '.o'] = b.id === a.id ? 1 : 0.22;
        s['p.area:' + b.id + '.h'] = b.id === a.id ? 1 : 0;
        s['lab.' + b.id] = b.id === a.id ? 1 : 0.25;
      });
      lay.topics.forEach(function (t) {
        s['p.topic:' + t.id + '.o'] = t.area === a.id ? 1 : 0.22;
        s['lab.' + t.id] = t.area === a.id ? 1 : 0;
      });
      lay.exts.forEach(function (x) {
        var near = x.relatedAreas.indexOf(a.id) !== -1;
        s['p.ext:' + x.id + '.o'] = near ? 1 : 0.22;
        s['lab.' + x.id] = near ? 0.6 : 0;
      });
      states.push(s);
    });

    var S8 = Object.assign({}, S2);
    focus(S8, 545, 700, 1.7);
    S8['line.o'] = 0.45;
    var related = {};
    lay.exts.forEach(function (x) { x.relatedAreas.forEach(function (id) { related[id] = true; }); });
    lay.areas.forEach(function (a) {
      S8['p.area:' + a.id + '.o'] = related[a.id] ? 1 : 0.22;
      S8['p.area:' + a.id + '.h'] = related[a.id] ? 0.5 : 0;
      S8['lab.' + a.id] = related[a.id] ? 1 : 0.2;
    });
    lay.topics.forEach(function (t) { S8['p.topic:' + t.id + '.o'] = 0.22; });
    lay.exts.forEach(function (x) { S8['lab.' + x.id] = 1; S8['p.ext:' + x.id + '.s'] = 1.25; });
    states.push(S8);

    var S9 = base(lay, {
      area: function (a, i) { return [240 + i * 130, 265, 0, 0.75, 1, 0]; },
      topic: function (t, i) { return [195 + 110 * (i % 4), 530 + 50 * Math.floor(i / 4), 0, 0.8, 1]; },
      ext: function (x) { return [x.x, x.y + 60, 0, 0.5, 0]; }
    });
    S9['line.o'] = 0;
    S9['mats'] = 1;
    states.push(S9);
    return states;
  }

  function mix(a, b, t) {
    var out = {};
    Object.keys(a).forEach(function (k) { out[k] = a[k] + ((k in b ? b[k] : a[k]) - a[k]) * t; });
    return out;
  }

  /* 기준점 정규화: 첫 값 0, 단조 증가 */
  function normalizeAnchors(raw) {
    var out = [];
    raw.forEach(function (v, i) { out.push(i === 0 ? 0 : Math.max(v, out[i - 1] + 1)); });
    return out;
  }

  /* 스크롤 위치 → 장면 값 f (선형, smoothing 없음) */
  function sceneAt(anchors, y) {
    var n = anchors.length;
    if (!n || y <= anchors[0]) return 0;
    for (var i = 0; i < n - 1; i++) {
      if (y < anchors[i + 1]) return i + (y - anchors[i]) / (anchors[i + 1] - anchors[i]);
    }
    return n - 1;
  }

  function stateAt(states, f) {
    var last = states.length - 1;
    var c = Math.max(0, Math.min(last, f));
    var i = Math.min(last, Math.floor(c));
    var j = Math.min(last, i + 1);
    return mix(states[i], states[j], c - i);
  }

  root.MotionA = {
    layout: layout,
    sceneNames: sceneNames,
    buildStates: buildStates,
    mix: mix,
    normalizeAnchors: normalizeAnchors,
    sceneAt: sceneAt,
    stateAt: stateAt,
    FOCUS_SCALE: FOCUS_SCALE
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
