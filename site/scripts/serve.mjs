#!/usr/bin/env node
// 로컬 미리보기 서버 (Apache-2.0). 빌드 산출물만 127.0.0.1의 /ai-native-sdlc/ 하위 경로로 제공한다.
// 사용: node scripts/serve.mjs [--port 0] [--dir site/dist]   (port 0 = 비어 있는 포트 자동 선택)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { BASE_PATH, DEFAULT_OUT, MARKER, isMain } from './lib.mjs';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

export function createSiteServer({ root, base = BASE_PATH }) {
  const rootReal = fs.realpathSync(root);
  if (!fs.existsSync(path.join(rootReal, MARKER))) {
    throw new Error(`${root}에 ${MARKER} 표식이 없습니다. 빌드 산출물 폴더만 제공합니다(먼저 build 실행).`);
  }
  const baseNoSlash = base.replace(/\/$/, '');

  return http.createServer((req, res) => {
    const send = (status, body, headers = {}) => {
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff', ...headers });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'Method Not Allowed', { Allow: 'GET, HEAD' });

    const rawPath = (req.url || '/').split('?')[0].split('#')[0];
    if (rawPath === '/') return send(302, 'Found', { Location: base });
    if (rawPath === baseNoSlash) return send(301, 'Moved Permanently', { Location: base });
    if (!rawPath.startsWith(base)) return send(404, 'Not Found');

    let rel;
    try { rel = decodeURIComponent(rawPath.slice(base.length)); } catch { return send(400, 'Bad Request'); }
    if (rel.includes('\0') || rel.includes('\\')) return send(400, 'Bad Request');
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    const segments = rel.split('/');
    if (segments.some((s) => s === '..' || s.startsWith('.'))) return send(404, 'Not Found');

    const file = path.resolve(rootReal, ...segments);
    const relToRoot = path.relative(rootReal, file);
    if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) return send(404, 'Not Found');

    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) return send(404, 'Not Found');
      const type = TYPES[path.extname(file).toLowerCase()];
      if (!type) return send(404, 'Not Found');
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).pipe(res);
    });
  });
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const get = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
  const port = Number(get('--port', '0'));
  const dir = path.resolve(get('--dir', DEFAULT_OUT));
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    console.error('serve: --port는 0~65535 정수여야 합니다');
    process.exit(2);
  }
  let server;
  try { server = createSiteServer({ root: dir }); } catch (err) { console.error(`serve: ${err.message}`); process.exit(1); }
  server.listen(port, '127.0.0.1', () => {
    const { port: actual } = server.address();
    console.log(`serve: ${dir}`);
    console.log(`serve: http://127.0.0.1:${actual}${BASE_PATH}  (Ctrl+C로 종료)`);
  });
}
