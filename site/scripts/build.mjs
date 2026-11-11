#!/usr/bin/env node
// 사이트 빌드: 허용 목록의 파일만 출력 폴더(기본 site/dist)로 복사한다. (Apache-2.0)
// 사용: node scripts/build.mjs [--out <폴더>]
import path from 'node:path';
import { build } from './lib.mjs';

const args = process.argv.slice(2);
const i = args.indexOf('--out');
const outArg = i >= 0 ? args[i + 1] : undefined;
if (i >= 0 && !outArg) {
  console.error('build: --out 뒤에 폴더를 지정하세요');
  process.exit(2);
}
try {
  const { outDir, files } = build(outArg);
  console.log(`build: ${files.length}개 파일 → ${path.relative(process.cwd(), outDir) || outDir}`);
  for (const f of files) console.log(`  ${f}`);
} catch (err) {
  console.error(`build: 실패 — ${err.message}`);
  process.exit(1);
}
