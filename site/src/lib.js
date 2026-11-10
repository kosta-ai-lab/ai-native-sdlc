/* kosta-ai-lab 포털 — 순수 함수 모음 (Apache-2.0).
   DOM에 의존하지 않으므로 브라우저(app.js)와 Node 테스트(scripts/test.mjs)가 함께 쓴다. */
(function (root) {
  'use strict';

  var TYPE_LABELS = {
    'module': '모듈 문서',
    'module-group': '모듈 폴더',
    'rules': '작업 규칙',
    'automation': '자동화',
    'sample': '코드 예제',
    'method': '방법론',
    'guide': '안내',
    'record': '기록',
    'policy': '운영 정책',
    'license': '라이선스',
    'course': '강의 안내',
    'course-index': '강의 목록',
    'template': '견본',
    'lab': '실습',
    'resource': '참고 자료',
    'slides': '발표 자료(PPTX)',
    'slides-pdf': '교재 PDF'
  };

  function typeLabel(type) {
    return TYPE_LABELS[type] || '자료';
  }

  /* 해시 해석. 새 형식 '#area/spec'·'#topic/sdd'와 이전 시안 형식 '#stage/04'·'#path/todo'를 함께 받는다. */
  function parseHash(hash) {
    if (typeof hash !== 'string') return null;
    var raw = hash.charAt(0) === '#' ? hash.slice(1) : hash;
    if (!raw) return null;
    try { raw = decodeURIComponent(raw); } catch (e) { return null; }
    var m = /^(area|topic|ext|stage|path)\/([A-Za-z0-9_-]{1,40})$/.exec(raw);
    if (m) return { type: m[1], id: m[2] };
    if (/^[A-Za-z][A-Za-z0-9_-]{0,40}$/.test(raw)) return { type: 'anchor', id: raw };
    return null;
  }

  /* 해시 → 화면 대상. 이전 '#stage/NN'은 해당 주제가 속한 영역으로, '#path/todo'는 예제로 보낸다. */
  function resolveTarget(data, parsed) {
    if (!parsed) return null;
    var id = parsed.id;
    var find = function (list, key, value) {
      for (var i = 0; i < list.length; i++) if (list[i][key] === value) return list[i];
      return null;
    };
    if (parsed.type === 'area' && find(data.areas, 'id', id)) return { kind: 'area', id: id };
    if (parsed.type === 'ext' && find(data.extensions, 'id', id)) return { kind: 'ext', id: id };
    if (parsed.type === 'topic') {
      var t = find(data.topics, 'id', id);
      return t ? { kind: 'area', id: t.area, topic: t.id } : null;
    }
    if (parsed.type === 'stage') {
      if (find(data.extensions, 'id', id)) return { kind: 'ext', id: id };
      for (var i = 0; i < data.areas.length; i++) {
        if ((data.areas[i].legacyStages || []).indexOf(id) !== -1) return { kind: 'area', id: data.areas[i].id };
      }
      return null;
    }
    if (parsed.type === 'path') return id === 'todo' ? { kind: 'anchor', id: 'example' } : null;
    if (parsed.type === 'anchor') return { kind: 'anchor', id: id };
    return null;
  }

  function nodeHash(kind, id) { return '#' + (kind === 'ext' ? 'ext' : 'area') + '/' + id; }

  /* 영역에 연결된 공개 항목: 공개 목록(resources)과 강의(courses) 중 areas에 해당 영역이 있는 것. */
  function relatedItems(data, areaId) {
    var out = [];
    (data.resources || []).forEach(function (r) { if ((r.areas || []).indexOf(areaId) !== -1) out.push(r); });
    (data.courses || []).forEach(function (c) { if ((c.areas || []).indexOf(areaId) !== -1) out.push(c); });
    return out;
  }

  function topicsFor(data, areaId) {
    return (data.topics || []).filter(function (t) { return t.area === areaId; });
  }

  function extensionsFor(data, areaId) {
    return (data.extensions || []).filter(function (x) { return (x.relatedAreas || []).indexOf(areaId) !== -1; });
  }

  function statusLabel(data, group, key) {
    var g = data.statusLabels && data.statusLabels[group];
    return (g && g[key]) || key;
  }

  /* 두 점 사이 레일 꼭짓점: 같은 열이면 수직, 같은 행이면 수평, 행이 바뀌면 오른쪽 여백을 돌아 되돌림 띠를 지난다. */
  function railPoints(a, b, opts) {
    var tol = 4;
    if (Math.abs(a.x - b.x) < tol) return [a, { x: a.x, y: b.y }];
    if (Math.abs(a.y - b.y) < tol) return [a, { x: b.x, y: a.y }];
    var xR = opts && typeof opts.xRight === 'number' ? opts.xRight : Math.max(a.x, b.x) + 24;
    var yMid = opts && typeof opts.yMid === 'number' ? opts.yMid : (a.y + b.y) / 2;
    return [a, { x: xR, y: a.y }, { x: xR, y: yMid }, { x: b.x, y: yMid }, b];
  }

  /* 가지선: 영역 카드 아래 중앙에서 내려와 확장 주제 점으로 이어진다. */
  function branchPoints(from, to, yMid) {
    if (Math.abs(from.x - to.x) < 4) return [from, to];
    return [from, { x: from.x, y: yMid }, { x: to.x, y: yMid }, to];
  }

  function fmt(n) { return Math.round(n * 10) / 10; }

  function roundedPath(points, r) {
    if (!points.length) return '';
    var radius = typeof r === 'number' ? r : 10;
    var d = 'M' + fmt(points[0].x) + ' ' + fmt(points[0].y);
    for (var i = 1; i < points.length; i++) {
      var p = points[i];
      var prev = points[i - 1];
      var next = points[i + 1];
      if (!next) { d += 'L' + fmt(p.x) + ' ' + fmt(p.y); break; }
      var inLen = Math.hypot(p.x - prev.x, p.y - prev.y);
      var outLen = Math.hypot(next.x - p.x, next.y - p.y);
      var rr = Math.min(radius, inLen / 2, outLen / 2);
      if (rr < 0.5) { d += 'L' + fmt(p.x) + ' ' + fmt(p.y); continue; }
      var x1 = p.x - (p.x - prev.x) / inLen * rr;
      var y1 = p.y - (p.y - prev.y) / inLen * rr;
      var x2 = p.x + (next.x - p.x) / outLen * rr;
      var y2 = p.y + (next.y - p.y) / outLen * rr;
      d += 'L' + fmt(x1) + ' ' + fmt(y1) + 'Q' + fmt(p.x) + ' ' + fmt(p.y) + ' ' + fmt(x2) + ' ' + fmt(y2);
    }
    return d;
  }

  function railPath(a, b, opts) {
    return roundedPath(railPoints(a, b, opts), opts && opts.radius);
  }

  function isNearSegment(seg, selected) {
    return seg.from === selected || seg.to === selected;
  }

  root.LearningSite = {
    typeLabel: typeLabel,
    parseHash: parseHash,
    resolveTarget: resolveTarget,
    nodeHash: nodeHash,
    relatedItems: relatedItems,
    topicsFor: topicsFor,
    extensionsFor: extensionsFor,
    statusLabel: statusLabel,
    railPoints: railPoints,
    branchPoints: branchPoints,
    roundedPath: roundedPath,
    railPath: railPath,
    isNearSegment: isNearSegment
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
