#!/usr/bin/env node
// kosta-ai-lab 학습 로드맵: 영상 자료(data/videos.json) 검사 (Apache-2.0).
// 사용: node scripts/videos-check.mjs                   형식만 본다(네트워크를 쓰지 않는다). check.mjs도 같은 검사를 부른다.
//       node scripts/videos-check.mjs --live            영상마다 유튜브에 물어, 주소가 살아 있는지, 제목·채널이 적어 둔 것과 같은지, 섬네일이 있는지 본다.
//       node scripts/videos-check.mjs --live --stamp    모두 맞으면 checked(확인한 날)를 오늘 날짜로 고쳐 쓴다. 제목을 확인하지 못한 영상이 있으면 고쳐 쓰지 않는다.
// 영상 주소는 영상 번호(id)로만 만든다. 데이터에 주소를 통째로 적지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { SITE_DIR, readJSON, isMain } from './lib.mjs';

export const VIDEOS_FILE = 'videos.json';
export const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
export const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
const DAY = /^\d{4}-\d\d-\d\d$/;
const KEY = /^[a-z]+$/;
const VIDEO_KEYS = ['id', 'title', 'yt', 'date', 'seconds', 'kind', 'series', 'channel', 'by', 'topic'];
const isText = (v) => typeof v === 'string' && v.trim() !== '';
const isTable = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length > 0;
const squeeze = (s) => String(s).replace(/\s+/g, ' ').trim();
/** 달력에 있는 날짜인지. Date.parse는 2월 30일을 3월 2일로 받아 주므로 되돌려 견준다. */
const isDay = (s) => { if (!DAY.test(s || '')) return false; const t = new Date(s + 'T00:00:00Z'); return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === s; };

export const watchUrl = (id) => 'https://www.youtube.com/watch?v=' + id;
export const thumbUrl = (id) => 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
const SHAPES = ['wide', 'tall'];

/** 화면에 나오는 글을 모은다(글꼴 확인과 한국어 점검의 대상). titles: false면 바깥에서 붙인 영상 제목은 뺀다. */
export function videoStrings(d, { titles = true } = {}) {
  const out = [];
  const push = (...xs) => { for (const x of xs.flat(Infinity)) if (typeof x === 'string') out.push(x); };
  if (!d || typeof d !== 'object') return out;
  push(d.checked, Object.values(d.names || {}), Object.values(d.channels || {}).map((c) => c && c.name), Object.values(d.kinds || {}).map((k) => k && [k.name, k.about]), Object.values(d.topics || {}));
  for (const v of Array.isArray(d.videos) ? d.videos : []) { push(v.date, v.series); if (titles) push(v.title); }
  return out;
}

/**
 * 영상 자료의 문제를 모은다.
 * ctx: { names(로드맵의 화면 표기 표. 주면 같은 표기인지 본다) }
 */
export function videoProblems(d, ctx = {}) {
  const problems = [];
  const bad = (msg) => problems.push(VIDEOS_FILE + ': ' + msg);
  if (!d || typeof d !== 'object' || Array.isArray(d)) { bad('읽을 수 없는 내용'); return problems; }
  if (d.schema !== 1) bad('schema는 1');
  if (!isDay(d.checked)) bad('checked는 주소를 마지막으로 확인한 날(YYYY-MM-DD)');
  if (/https?:/i.test(JSON.stringify(d))) bad('주소를 통째로 적지 않음(영상 번호와 채널 번호만 적는다)');

  const names = isTable(d.names) ? d.names : {};
  if (!isTable(d.names)) bad('names(사람 이름과 화면 표기) 필요');
  for (const [n, shown] of Object.entries(names)) {
    if (!isText(shown) || !shown.startsWith(n)) bad('names의 화면 표기는 그 이름으로 시작해야 함 — ' + n + ': ' + shown);
    // 로드맵에도 있는 사람이면 화면 표기가 같아야 한다. 로드맵에 없는 사람(영상에만 나오는 분)은 대조하지 않는다.
    else if (ctx.names && Object.prototype.hasOwnProperty.call(ctx.names, n) && ctx.names[n] !== shown) bad('names의 화면 표기가 로드맵(roadmap.json)과 다름 — ' + n + ': ' + shown);
  }
  const channels = isTable(d.channels) ? d.channels : {};
  if (!isTable(d.channels)) bad('channels(채널) 필요');
  for (const [k, c] of Object.entries(channels)) if (!KEY.test(k) || !c || !isText(c.name) || !CHANNEL_ID.test(c.id || '')) bad('channels.' + k + '는 { name, id(UC로 시작하는 채널 번호) }');
  const kinds = isTable(d.kinds) ? d.kinds : {};
  if (!isTable(d.kinds)) bad('kinds(형식별 묶음) 필요');
  for (const [k, v] of Object.entries(kinds)) if (!KEY.test(k) || !v || typeof v !== 'object' || !isText(v.name) || !isText(v.about) || !SHAPES.includes(v.shape)) bad('kinds.' + k + '는 { name, about, shape(' + SHAPES.join('/') + ') }');
  const topics = isTable(d.topics) ? d.topics : {};
  if (!isTable(d.topics)) bad('topics(주제) 필요');
  for (const [k, v] of Object.entries(topics)) if (!KEY.test(k) || !isText(v)) bad('topics.' + k + '는 주제 이름');

  if (!Array.isArray(d.videos) || !d.videos.length) { bad('videos가 비어 있음'); return problems; }
  const seen = new Set();
  const used = { kinds: new Set(), topics: new Set(), channels: new Set(), names: new Set() };
  d.videos.forEach((v, i) => {
    const w = (v && isText(v.id) ? v.id : (i + 1) + '번째 영상');
    if (!v || typeof v !== 'object') { bad(w + ': 읽을 수 없는 항목'); return; }
    if (!VIDEO_ID.test(v.id || '')) bad(w + ': id는 유튜브 영상 번호 11자');
    else if (seen.has(v.id)) bad(w + ': 같은 영상이 두 번 나옴');
    seen.add(v.id);
    for (const k of Object.keys(v)) if (!VIDEO_KEYS.includes(k)) bad(w + ': 알 수 없는 항목 ' + k);
    if (!isText(v.title)) bad(w + ': title(화면에 보일 제목) 필요');
    if (!isText(v.yt)) bad(w + ': yt(유튜브의 원래 제목) 필요');
    if (!isDay(v.date)) bad(w + ': date는 올라온 날(YYYY-MM-DD)');
    else if (isDay(d.checked) && v.date > d.checked) bad(w + ': date가 확인한 날(checked)보다 늦음');
    if (!Number.isInteger(v.seconds) || v.seconds <= 0) bad(w + ': seconds는 길이(초)');
    if (!Object.prototype.hasOwnProperty.call(kinds, v.kind)) bad(w + ': kind가 kinds에 없음 — ' + v.kind); else used.kinds.add(v.kind);
    if (!Object.prototype.hasOwnProperty.call(topics, v.topic)) bad(w + ': topic이 topics에 없음 — ' + v.topic); else used.topics.add(v.topic);
    if (!Object.prototype.hasOwnProperty.call(channels, v.channel)) bad(w + ': channel이 channels에 없음 — ' + v.channel); else used.channels.add(v.channel);
    if (v.series !== undefined && !isText(v.series)) bad(w + ': series는 글');
    if (!Array.isArray(v.by) || !v.by.length || new Set(v.by).size !== v.by.length) bad(w + ': by(나온 사람) 필요');
    else for (const n of v.by) { if (!Object.prototype.hasOwnProperty.call(names, n)) bad(w + ': by의 이름이 names에 없음 — ' + n); else used.names.add(n); }
  });
  for (const [what, table] of [['kinds', kinds], ['topics', topics], ['channels', channels], ['names', names]]) {
    for (const k of Object.keys(table)) if (!used[what].has(k)) bad(what + '.' + k + ': 쓰는 영상이 없음');
  }
  return problems;
}

/** 유튜브에 물어 영상 하나를 확인한다. 돌려주는 값: { ok, note } */
async function askYoutube(v, channelName) {
  const url = 'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(watchUrl(v.id));
  let res;
  // 유튜브는 언어 설정에 따라 제목을 번역해 줄 때가 있다. 원래 제목(한국어)과 견주려고 한국어를 청한다.
  try { res = await fetch(url, { signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'kosta-ai-lab-link-check', 'accept-language': 'ko-KR,ko;q=0.9' } }); } catch (err) { return { ok: false, note: '응답 없음(' + String(err && err.name ? err.name : err) + ')' }; }
  // 401은 채널이 다른 사이트에 끼워 넣는 것을 막아 둔 영상이다. 영상은 있지만 제목은 확인하지 못한다.
  if (res.status === 401) { const t = await askThumb(v); return t.ok ? { ok: true, note: '제목을 확인하지 못함(끼워 넣기를 막은 영상)' } : t; }
  if (res.status !== 200) return { ok: false, note: '열리지 않음(HTTP ' + res.status + ')' };
  let body;
  try { body = await res.json(); } catch { return { ok: false, note: '응답을 읽을 수 없음' }; }
  if (squeeze(body.title) !== squeeze(v.yt)) return { ok: false, note: '제목이 바뀜 — 지금 제목: ' + squeeze(body.title) };
  if (channelName && body.author_name !== channelName) return { ok: false, note: '채널 이름이 다름 — ' + body.author_name };
  return askThumb(v);
}

/** 섬네일이 있는지 본다. 없는 영상은 유튜브가 404와 회색 그림을 돌려준다. */
async function askThumb(v) {
  let res;
  try { res = await fetch(thumbUrl(v.id), { method: 'HEAD', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'kosta-ai-lab-link-check' } }); } catch (err) { return { ok: false, note: '섬네일 응답 없음(' + String(err && err.name ? err.name : err) + ')' }; }
  if (res.status !== 200) return { ok: false, note: '섬네일이 없음(HTTP ' + res.status + ')' };
  return { ok: true, note: '' };
}

/** 영상을 차례로 확인한다. 한꺼번에 묻지 않고 네 개씩 묻는다. */
export async function checkLive(d, { ask = askYoutube, width = 4 } = {}) {
  const out = [];
  const queue = d.videos.slice();
  const work = async () => { for (let v = queue.shift(); v; v = queue.shift()) out.push({ id: v.id, title: v.title, ...(await ask(v, (d.channels[v.channel] || {}).name)) }); };
  await Promise.all(Array.from({ length: width }, work));
  return out;
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const file = path.join(SITE_DIR, 'data', VIDEOS_FILE);
  const d = readJSON(file);
  const problems = videoProblems(d);
  for (const p of problems) console.error('videos: ✗ ' + p);
  if (problems.length) { console.error('videos: 실패 ' + problems.length + '건'); process.exit(1); }
  console.log('videos: · 영상 ' + d.videos.length + '개 · 형식 통과');
  if (args.includes('--live')) {
    const results = await checkLive(d);
    const failed = results.filter((r) => !r.ok);
    const noted = results.filter((r) => r.ok && r.note);
    for (const r of noted) console.log('videos: · ' + r.id + ' ' + r.note + ' — ' + r.title);
    for (const r of failed) console.error('videos: ✗ ' + r.id + ' ' + r.note + ' — ' + r.title);
    if (failed.length) { console.error('videos: 확인 실패 ' + failed.length + '건 / ' + results.length + '건'); process.exit(1); }
    console.log('videos: · 유튜브 확인 ' + results.length + '건 통과' + (noted.length ? '(제목을 확인하지 못한 영상 ' + noted.length + '건)' : ''));
    if (args.includes('--stamp') && noted.length) console.log('videos: · 제목을 확인하지 못한 영상이 있어 checked를 고쳐 쓰지 않음. 그 영상을 직접 열어 본 뒤 손으로 고친다');
    else if (args.includes('--stamp')) {
      const now = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
      if (d.checked !== now) { d.checked = now; fs.writeFileSync(file, JSON.stringify(d, null, 2) + '\n'); console.log('videos: · checked를 ' + now + '로 고쳐 씀'); }
    }
  }
  console.log('videos: 통과');
}
