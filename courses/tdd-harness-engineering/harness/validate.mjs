import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const harnessDir = dirname(fileURLToPath(import.meta.url));
const courseDir = resolve(harnessDir, '..');
const manifestPath = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : resolve(harnessDir, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const failures = [];

async function requireFile(relativePath, owner) {
  try {
    await access(resolve(courseDir, relativePath));
  } catch {
    failures.push(`${owner}: missing file ${relativePath}`);
  }
}

function uniqueIds(items, section) {
  const seen = new Set();
  for (const item of items) {
    if (!item.id) failures.push(`${section}: item without id`);
    if (seen.has(item.id)) failures.push(`${section}: duplicate id ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'archive') continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(path));
    if (entry.isFile() && entry.name.endsWith('.md')) files.push(path);
  }
  return files;
}

async function checkLocalLinks() {
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const file of await markdownFiles(courseDir)) {
    const content = await readFile(file, 'utf8');
    for (const match of content.matchAll(linkPattern)) {
      const rawTarget = match[1].trim().replace(/^<|>$/g, '');
      if (!rawTarget || rawTarget.startsWith('#')) continue;
      if (/^(https?:|mailto:)/.test(rawTarget)) continue;
      const fileTarget = decodeURIComponent(rawTarget.split('#')[0]);
      try {
        await access(resolve(dirname(file), fileTarget));
      } catch {
        failures.push(`broken local link in ${file.slice(courseDir.length + 1)}: ${rawTarget}`);
      }
    }
  }
}

await requireFile(manifest.course.brief, manifest.course.id);
await requireFile(manifest.course.questions, manifest.course.id);
await requireFile(manifest.course.intentLedger, manifest.course.id);
await requireFile(manifest.course.researchIndex, manifest.course.id);
await requireFile(manifest.course.designIndex, manifest.course.id);
await requireFile(manifest.course.manuscriptIndex, manifest.course.id);
await requireFile(manifest.course.materialsIndex, manifest.course.id);
await requireFile(manifest.course.deliveriesIndex, manifest.course.id);
await requireFile(manifest.course.archiveIndex, manifest.course.id);
await requireFile(manifest.workflow.facilitation, 'workflow');
await requireFile(manifest.workflow.stageGuides, 'workflow');
await requireFile(manifest.workflow.terminology, 'workflow');

const sourceIds = uniqueIds(manifest.sources, 'sources');
const knowledgeIds = uniqueIds(manifest.knowledge, 'knowledge');
const unitIds = uniqueIds(manifest.units, 'units');
uniqueIds(manifest.deliveries, 'deliveries');

for (const source of manifest.sources) {
  await requireFile(source.path, source.id);
  if (!source.checkedAt) failures.push(`${source.id}: checkedAt is required`);
  if (!source.sourceType) failures.push(`${source.id}: sourceType is required`);
}

for (const knowledge of manifest.knowledge) {
  await requireFile(knowledge.path, knowledge.id);
  if (!knowledge.sources?.length) {
    failures.push(`${knowledge.id}: at least one source reference is required`);
  }
  for (const id of knowledge.sources ?? []) {
    if (!sourceIds.has(id)) failures.push(`${knowledge.id}: unknown source ${id}`);
  }
}

for (const unit of manifest.units) {
  await requireFile(unit.design, unit.id);
  await requireFile(unit.assessment, unit.id);
  for (const material of unit.materials ?? []) {
    await requireFile(material, unit.id);
  }
  for (const id of unit.knowledge ?? []) {
    if (!knowledgeIds.has(id)) failures.push(`${unit.id}: unknown knowledge ${id}`);
  }
  if (unit.status === 'classroom-ready') {
    failures.push(`${unit.id}: classroom-ready requires rehearsal evidence; validator support is not implemented yet`);
  }
}

for (const delivery of manifest.deliveries) {
  await requireFile(delivery.requirements, delivery.id);
  await requireFile(delivery.adaptations, delivery.id);
  for (const id of delivery.uses ?? []) {
    if (!unitIds.has(id)) failures.push(`${delivery.id}: unknown unit ${id}`);
  }
}

await checkLocalLinks();

if (failures.length > 0) {
  console.error('Course harness: FAIL');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Course harness: PASS');
console.log(`- sources: ${manifest.sources.length}`);
console.log(`- knowledge: ${manifest.knowledge.length}`);
console.log(`- units: ${manifest.units.length}`);
console.log(`- deliveries: ${manifest.deliveries.length}`);
