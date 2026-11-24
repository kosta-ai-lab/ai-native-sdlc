#!/usr/bin/env node
// 사이트 빌드: 허용 목록의 파일만 출력 폴더(기본 site/dist)로 복사하고, 자료 날짜(data/dates.json)를 git 이력에서 만든다. (Apache-2.0)
// 사용: node scripts/build.mjs [--out <폴더>] [--require-history]
//   --require-history: git 이력이 온전하지 않으면(얕은 복제) 날짜 없이 빌드하지 않고 실패한다. 배포 워크플로가 쓴다.
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
  const { outDir, files, dates } = build(outArg, { requireHistory: args.includes('--require-history') });
  console.log(`build: ${files.length}개 파일 → ${path.relative(process.cwd(), outDir) || outDir}`);
  console.log(dates.complete
    ? `build: 자료 ${Object.keys(dates.items).length}개의 날짜를 git 이력에서 읽음`
    : 'build: git 이력이 온전하지 않아 자료 날짜를 넣지 않음(화면에 날짜와 NEW 표시가 나오지 않는다)');
  for (const f of files) console.log(`  ${f}`);
} catch (err) {
  console.error(`build: 실패 — ${err.message}`);
  process.exit(1);
}
