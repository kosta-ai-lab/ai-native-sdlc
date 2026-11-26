#!/usr/bin/env node
// kosta-ai-lab 학습 로드맵: 단원 한눈에 보기 내용(data/unit-*.json) 검사 (Apache-2.0).
// 사용: node scripts/unit-check.mjs [단원 id ...]   (id를 주지 않으면 모든 단원)
//  - 형식: 화면(src/unit.js)이 읽는 모양인지 본다.
//  - 가이드 대조: 프롬프트, 명령, 코드, 출력의 모든 줄이 그 단원의 가이드 문서에 그대로 있는지 본다.
//    단계 제목도 가이드의 단계 제목과 같은지 본다. 설명 문장은 가이드에서 줄여 옮긴 글이라 대조하지 않는다. 사람이 읽고 확인한다.
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, SITE_DIR, readJSON, isMain } from './lib.mjs';

export const UNIT_FILE = /^unit-([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/;
export const STATES = ['plain', 'ink', 'warn', 'bad', 'good', 'both', 'calm'];
const TONES = ['bad', 'good', 'calm'];
const VERDICTS = ['ink', 'warn', 'bad', 'good', 'calm'];
const PIPS = ['ok', 'bad', 'none'];
const TICKS = [undefined, 'no', 'na'];
const LINE_TONES = ['', 'ok', 'bad', 'dim'];
const BLOCKS = ['p', 'label', 'prompt', 'code', 'cmd', 'term', 'verdict', 'ticks', 'outs', 'list', 'next', 'table'];
const SECTIONS = ['compare', 'chain', 'table'];
const isText = (v) => typeof v === 'string' && v.trim() !== '';
const isList = (v) => Array.isArray(v) && v.length > 0;

export function unitFiles(siteDir = SITE_DIR) {
  return fs.readdirSync(path.join(siteDir, 'data')).filter((n) => UNIT_FILE.test(n)).sort();
}

/** 조각을 모두 돈다: 단계의 마디와, 견주기 구역의 칸. */
function eachBlock(u, fn) {
  (u.steps || []).forEach((s, i) => (s.lanes || []).forEach((l, k) => (l.blocks || []).forEach((b) => fn(b, i + '단계 ' + (k + 1) + '번째 마디'))));
  (u.sections || []).forEach((s) => (s.cols || []).forEach((c) => (c && c.blocks ? c.blocks : []).forEach((b) => fn(b, '구역 "' + s.title + '"'))));
}

/** 가이드와 글자 그대로 같아야 하는 줄: 프롬프트, 명령, 코드, 출력. */
export function verbatimLines(u) {
  const out = [];
  const add = (text, where) => { for (const line of String(text).split('\n')) { const t = line.replace(/\[\[|\]\]/g, '').trim(); if (t) out.push({ line: t, where }); } };
  eachBlock(u, (b, where) => {
    if (isText(b.prompt)) add(b.prompt, where);
    if (isText(b.code)) add(b.code, where);
    if (isText(b.cmd)) add(b.cmd, where);
    if (b.term) { if (isText(b.term.cmd)) add(b.term.cmd, where); for (const l of b.term.out || []) add(Array.isArray(l) ? l[1] : '', where); }
  });
  return out;
}

/** 화면에 나오는 글을 모두 모은다(글꼴 확인과 한국어 점검의 대상). */
export function unitStrings(u) {
  const out = [];
  const push = (...xs) => { for (const x of xs.flat(Infinity)) if (typeof x === 'string') out.push(x); };
  push(u.where, u.lead, Array.isArray(u.title) ? u.title.map((p) => p[0]) : u.title, Object.values(u.marks || {}), u.pips, u.promptLabel, u.env);
  push(Object.values(u.kinds || {}));
  for (const p of u.principles || []) push(p.name, p.here);
  for (const s of u.steps || []) push(s.title, s.name, s.out, s.pipsLabel, s.note);
  const block = (b) => {
    push(b.p, b.label, b.prompt, b.code, b.cmd, b.next, b.outs, b.list);
    if (b.term) push(b.term.cmd, b.term.title, (b.term.out || []).map((l) => (Array.isArray(l) ? String(l[1]).replace(/\[\[|\]\]/g, '') : '')));
    if (b.verdict) push(b.verdict[1]);
    for (const t of b.ticks || []) push(t.t, t.s);
    if (b.table) push(b.table.head, b.table.rows);
  };
  eachBlock(u, block);
  for (const s of u.sections || []) {
    push(s.title, s.lead, s.note, s.mid, s.head);
    if (s.type === 'chain') push((s.cols || []).map((c) => c), s.rows);
    if (s.type === 'table') push(s.rows);
    if (s.type === 'compare') push((s.cols || []).map((c) => c && c.cap));
  }
  return out;
}

/**
 * 단원 내용 하나의 문제를 모은다.
 * ctx: { name(파일 이름), guide(가이드 문서의 글, 없으면 null) }
 */
export function unitProblems(u, ctx = {}) {
  const problems = [];
  const at = ctx.name || 'unit';
  const bad = (msg) => problems.push(at + ': ' + msg);
  if (!u || typeof u !== 'object') { bad('읽을 수 없는 내용'); return problems; }
  const m = UNIT_FILE.exec(ctx.name || '');
  if (u.schema !== 1) bad('schema는 1');
  if (!isText(u.id) || (m && m[1] !== u.id)) bad('id는 파일 이름의 단원 id와 같아야 함');
  for (const f of ['item', 'guide', 'where', 'lead']) if (!isText(u[f])) bad(f + ' 필요');
  if (isText(u.guide) && !/^modules\/.+\.md$/.test(u.guide)) bad('guide는 modules/ 아래의 문서 경로');
  const titleOk = isText(u.title) || (isList(u.title) && u.title.every((p) => Array.isArray(p) && typeof p[0] === 'string' && p[0] !== '' && (p[1] === undefined || TONES.includes(p[1]))));
  if (!titleOk) bad('title은 글이거나 [글, 색] 조각의 목록(색은 ' + TONES.join('/') + ')');
  if (u.promptLabel !== undefined && !isText(u.promptLabel)) bad('promptLabel은 글');
  if (u.env !== undefined && !isText(u.env)) bad('env는 글');
  if (u.pips !== undefined && !isText(u.pips)) bad('pips는 네모가 무엇인지 알리는 글');

  const kinds = u.kinds && typeof u.kinds === 'object' && !Array.isArray(u.kinds) ? u.kinds : {};
  if (!Object.keys(kinds).length) bad('kinds(마디 이름과 설명) 필요');
  for (const [k, v] of Object.entries(kinds)) if (!/^[a-z]+$/.test(k) || !Array.isArray(v) || v.length !== 2 || !v.every(isText)) bad('kinds.' + k + '는 [이름, 설명]');

  const prs = u.principles;
  if (prs !== undefined && !(isList(prs) && prs.every((p) => p && isText(p.name) && isText(p.here)))) bad('principles는 { name, here }의 목록');
  const prCount = Array.isArray(prs) ? prs.length : 0;

  const checkBlock = (b, where) => {
    const keys = b && typeof b === 'object' ? Object.keys(b) : [];
    if (keys.length !== 1 || !BLOCKS.includes(keys[0])) { bad(where + ': 조각은 ' + BLOCKS.join('/') + ' 가운데 하나 — ' + keys.join(',')); return; }
    const k = keys[0], v = b[k];
    if (['p', 'label', 'prompt', 'code', 'cmd', 'next'].includes(k) && !isText(v)) bad(where + ': ' + k + '는 글');
    if (['outs', 'list'].includes(k) && !(isList(v) && v.every(isText))) bad(where + ': ' + k + '는 글 목록');
    if (k === 'verdict' && !(Array.isArray(v) && v.length === 2 && VERDICTS.includes(v[0]) && isText(v[1]))) bad(where + ': verdict는 [색, 글](색은 ' + VERDICTS.join('/') + ')');
    if (k === 'ticks' && !(isList(v) && v.every((t) => t && isText(t.t) && (t.s === undefined || isText(t.s)) && TICKS.includes(t.k)))) bad(where + ': ticks는 { t, s?, k? }의 목록(k는 no/na)');
    if (k === 'table' && !(v && isList(v.head) && v.head.every(isText) && isList(v.rows) && v.rows.every((r) => Array.isArray(r) && r.length === v.head.length && r.every(isText)))) bad(where + ': table은 { head, rows }이고 줄마다 칸 수가 같아야 함');
    if (k === 'term') {
      if (!v || (isText(v.cmd) === isText(v.title))) bad(where + ': term은 cmd(직접 실행한 명령)나 title(출력의 이름) 가운데 하나');
      if (!v || !(isList(v.out) && v.out.every((l) => Array.isArray(l) && l.length === 2 && LINE_TONES.includes(l[0]) && typeof l[1] === 'string'))) bad(where + ': term.out은 [색, 글] 줄의 목록(색은 ok/bad/dim 또는 빈 글)');
    }
  };

  if (!isList(u.steps)) { bad('steps 필요'); return problems; }
  const used = new Set();
  u.steps.forEach((s, i) => {
    const w = i + '단계';
    if (!s || !isText(s.title) || !isText(s.name)) bad(w + ': title, name 필요');
    if (!STATES.includes(s && s.state)) bad(w + ': state는 ' + STATES.join('/'));
    else used.add(s.state);
    if (s.out !== undefined && !(Array.isArray(s.out) && s.out.every(isText))) bad(w + ': out은 글 목록');
    if (s.pips !== undefined && !(isList(s.pips) && s.pips.every((g) => isList(g) && g.every((p) => PIPS.includes(p))) && isText(s.pipsLabel))) bad(w + ': pips는 ok/bad/none 묶음의 목록이고 pipsLabel(읽어 주는 글)이 필요');
    if (s.note !== undefined && !isText(s.note)) bad(w + ': note는 글');
    if (!(Array.isArray(s.principles) && s.principles.every((n) => Number.isInteger(n) && n >= 1 && n <= prCount) && new Set(s.principles).size === s.principles.length)) bad(w + ': principles는 1~' + prCount + ' 사이의 원칙 번호 목록');
    if (!isList(s.lanes)) { bad(w + ': lanes(마디) 필요'); return; }
    s.lanes.forEach((l, k) => {
      const where = w + ' ' + (k + 1) + '번째 마디';
      if (!l || !Object.prototype.hasOwnProperty.call(kinds, l.kind)) bad(where + ': kind가 kinds에 없음 — ' + (l && l.kind));
      if (!l || !isList(l.blocks)) bad(where + ': blocks 필요');
      else l.blocks.forEach((b) => checkBlock(b, where));
    });
  });
  if (u.start !== undefined && !(Number.isInteger(u.start) && u.start >= 0 && u.start < u.steps.length)) bad('start는 처음에 보일 단계 번호');
  const marks = u.marks && typeof u.marks === 'object' ? u.marks : {};
  for (const [k, v] of Object.entries(marks)) if (!STATES.includes(k) || k === 'both' || !isText(v)) bad('marks.' + k + ': 표시 이름은 ' + STATES.filter((x) => x !== 'both').join('/') + '이고 값은 글');
  for (const st of used) for (const need of st === 'both' ? ['bad', 'good'] : [st]) if (!isText(marks[need])) bad('marks.' + need + ' 필요(단계가 쓰는 표시의 뜻)');

  (Array.isArray(u.sections) ? u.sections : u.sections === undefined ? [] : [null]).forEach((s, i) => {
    const w = '구역 ' + (i + 1);
    if (!s || !SECTIONS.includes(s.type) || !isText(s.title)) { bad(w + ': type은 ' + SECTIONS.join('/') + '이고 title 필요'); return; }
    for (const f of ['lead', 'note', 'mid']) if (s[f] !== undefined && !isText(s[f])) bad(w + ': ' + f + '는 글');
    if (s.type === 'compare') {
      if (!(isList(s.cols) && s.cols.length >= 2 && s.cols.every((c) => c && isText(c.cap) && isList(c.blocks)))) bad(w + ': compare는 { cap, blocks } 칸이 둘 이상');
      else s.cols.forEach((c) => c.blocks.forEach((b) => checkBlock(b, w)));
      if (s.mid !== undefined && (s.cols || []).length !== 2) bad(w + ': mid(사이에 한 일)는 칸이 둘일 때만');
    }
    if (s.type === 'chain' && !(isList(s.cols) && s.cols.every((c) => Array.isArray(c) && isText(c[0]) && (c[1] === undefined || isText(c[1]))) && isList(s.rows) && s.rows.every((r) => Array.isArray(r) && r.length === s.cols.length && r.every(isText)))) bad(w + ': chain은 cols([이름, 설명])와, 칸 수가 같은 rows');
    if (s.type === 'table' && !(isList(s.head) && s.head.every(isText) && isList(s.rows) && s.rows.every((r) => Array.isArray(r) && r.length === s.head.length && r.every(isText)))) bad(w + ': table은 head와, 칸 수가 같은 rows');
  });

  // 가이드 대조
  if (ctx.guide == null) bad('가이드 문서를 읽을 수 없음 — ' + u.guide);
  else {
    const flat = ctx.guide.replace(/[ \t]+/g, ' ');
    for (const { line, where } of verbatimLines(u)) if (!flat.includes(line.replace(/[ \t]+/g, ' '))) bad(where + ': 가이드에 없는 줄 — ' + line);
    // 단계 제목도 가이드의 단계 제목 그대로여야 한다(제목 줄 안에 들어 있는지 본다)
    const heads = ctx.guide.split('\n').filter((l) => /^#{1,4} /.test(l)).map((l) => l.replace(/[ \t]+/g, ' '));
    u.steps.forEach((s, i) => { if (isText(s.title) && !heads.some((h) => h.includes(s.title.replace(/[ \t]+/g, ' ')))) bad(i + '단계: 가이드의 단계 제목과 다름 — ' + s.title); });
  }
  return problems;
}

/** 저장소의 단원 내용을 모두 읽어 문제를 모은다. ids를 주면 그 단원만. */
export function checkUnits({ siteDir = SITE_DIR, repoRoot = REPO_ROOT, ids = null } = {}) {
  const problems = [];
  const units = [];
  for (const name of unitFiles(siteDir)) {
    const id = UNIT_FILE.exec(name)[1];
    if (ids && !ids.includes(id)) continue;
    let u = null;
    try { u = readJSON(path.join(siteDir, 'data', name)); } catch (e) { problems.push(name + ': JSON으로 읽을 수 없음 — ' + e.message); continue; }
    const guideFile = u && isText(u.guide) ? path.join(repoRoot, u.guide) : null;
    const guide = guideFile && fs.existsSync(guideFile) ? fs.readFileSync(guideFile, 'utf8') : null;
    problems.push(...unitProblems(u, { name, guide }));
    units.push({ name, id, data: u });
  }
  return { problems, units };
}

if (isMain(import.meta.url)) {
  const ids = process.argv.slice(2);
  const { problems, units } = checkUnits({ ids: ids.length ? ids : null });
  for (const id of ids) if (!units.some((x) => x.id === id)) problems.push('없는 단원: data/unit-' + id + '.json');
  for (const x of units) console.log('unit-check: · ' + x.name + ' 단계 ' + x.data.steps.length + '개, 대조한 줄 ' + verbatimLines(x.data).length + '개');
  if (problems.length) {
    for (const p of problems) console.error('unit-check: ✗ ' + p);
    console.error('unit-check: 실패 ' + problems.length + '건');
    process.exit(1);
  }
  console.log('unit-check: 통과');
}
