// kosta-ai-lab 학습 로드맵: 화면(app.js)과 시험(scripts/test.mjs)이 함께 쓰는 계산 (Apache-2.0)
// DOM을 쓰지 않는다. 브라우저에서는 일반 스크립트로, Node에서는 import로 불러 globalThis.KostaRoadmap을 쓴다.
(function (root) {
  'use strict';

  /** 본문이 올라온 자료인지. 준비 중(kind: soon)이면 false. */
  function isOpen(item) { return !!item && item.kind !== 'soon'; }

  function index(data) {
    return {
      items: new Map(data.items.map(function (i) { return [i.id, i]; })),
      lines: new Map(data.lines.map(function (l) { return [l.id, l]; }))
    };
  }

  /** 로드맵에 놓인 자료 id를 단계 순서대로, 겹치지 않게. */
  function idsOf(line) {
    var out = [];
    line.stages.forEach(function (s) { s.items.forEach(function (id) { if (out.indexOf(id) < 0) out.push(id); }); });
    return out;
  }
  function openIds(line, items) { return idsOf(line).filter(function (id) { return isOpen(items.get(id)); }); }

  /** 단계 상태: 자료가 없으면 soon, 공개 자료를 모두 마쳤으면 done, 그 밖에는 open. */
  function stageState(stage, items, done) {
    var open = stage.items.filter(function (id) { return isOpen(items.get(id)); });
    if (!open.length) return 'soon';
    return open.every(function (id) { return done.has(id); }) ? 'done' : 'open';
  }
  function stageIndex(line, id) { return line.stages.findIndex(function (s) { return s.items.indexOf(id) >= 0; }); }
  /** 단계를 눌렀을 때 먼저 보여 줄 자료: 공개 자료가 있으면 그 첫 번째. */
  function stageEntry(stage, items) {
    return stage.items.find(function (id) { return isOpen(items.get(id)); }) || stage.items[0];
  }
  function firstItem(line, items) { return openIds(line, items)[0] || idsOf(line)[0]; }
  function lineOfItem(data, id) { return data.lines.find(function (l) { return idsOf(l).indexOf(id) >= 0; }); }
  function shortTitle(stage) { return stage.short || stage.title; }

  function progress(line, items, done) {
    var open = openIds(line, items);
    return { total: open.length, done: open.filter(function (id) { return done.has(id); }).length };
  }
  function counts(line, items) {
    var all = idsOf(line), open = openIds(line, items);
    return { stages: line.stages.length, open: open.length, soon: all.length - open.length };
  }

  /** 요소에 붙일 자식 목록을 한 줄로 편다. 배열이 몇 겹이든 풀고 null과 false는 뺀다. */
  function flatKids(kids) { return kids.flat(Infinity).filter(function (c) { return c != null && c !== false; }); }

  /** 'YYYY-MM-DD' 두 날짜 사이의 날수(to − from). 형식이 다르면 NaN. */
  function dayGap(from, to) {
    return Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000);
  }
  /**
   * 자료의 새로움. 올라온 날을 포함해 days일 동안은 'new', 그 뒤에 내용이 바뀌면 바뀐 날을 포함해 days일 동안 'updated', 아니면 ''.
   * entry: { added, updated } (없으면 ''), today: 방문자의 오늘 날짜.
   */
  function freshness(entry, today, days) {
    if (!entry) return '';
    if (dayGap(entry.added, today) < days) return 'new';
    if (entry.updated !== entry.added && dayGap(entry.updated, today) < days) return 'updated';
    return '';
  }

  /** 저장소 경로를 GitHub 주소로. 폴더는 tree, 파일은 blob. 경로 조각마다 인코딩한다. */
  function repoUrl(data, link) {
    var enc = link.path.split('/').map(encodeURIComponent).join('/');
    return 'https://github.com/' + data.repository + '/' + (link.kind === 'dir' ? 'tree' : 'blob') + '/' + data.ref + '/' + enc;
  }

  /**
   * 화면에 보일 사람 이름. 자료의 by는 원문(README)의 표기를 따르고, 화면에서는 names 표의 표기로 통일한다.
   * 쉼표로 이은 여러 사람은 한 사람씩 바꾼다. 표에 없는 이름은 그대로 둔다.
   */
  function displayBy(data, by) {
    var names = (data && data.names) || {};
    return String(by).split(/\s*,\s*/).map(function (part) {
      var key = Object.keys(names).find(function (n) { return part === n || part.indexOf(n + ' ') === 0; });
      return key ? names[key] : part;
    }).join(', ');
  }

  /** 주소의 #로드맵/자료 부분을 읽는다. 없는 로드맵이면 빈 객체, 그 로드맵에 없는 자료면 로드맵만. */
  function parseHash(hash, data) {
    var parts = String(hash || '').replace(/^#/, '').split('/');
    var line = data.lines.find(function (l) { return l.id === parts[0]; });
    if (!line) return {};
    return { line: line.id, item: idsOf(line).indexOf(parts[1]) >= 0 ? parts[1] : undefined };
  }

  root.KostaRoadmap = {
    isOpen: isOpen, index: index, idsOf: idsOf, openIds: openIds, stageState: stageState, stageIndex: stageIndex,
    stageEntry: stageEntry, firstItem: firstItem, lineOfItem: lineOfItem, shortTitle: shortTitle,
    progress: progress, counts: counts, flatKids: flatKids, freshness: freshness, repoUrl: repoUrl, displayBy: displayBy, parseHash: parseHash
  };
})(typeof globalThis !== 'undefined' ? globalThis : self);
