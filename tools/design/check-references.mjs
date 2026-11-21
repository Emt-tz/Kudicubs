// 005 T058: validate docs/design/references.json and its links to the screen manifests.
//   node check-references.mjs            progress mode: warns when a referenced screen is not built yet
//   node check-references.mjs --strict   fails on that too, and on any influence a manifest does not cite
import { existsSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import path from 'node:path';
import { ROOT, readJson } from './lib.mjs';

const STRICT = process.argv.includes('--strict');
const file = path.join(ROOT, 'docs/design/references.json');
if (!existsSync(file)) { console.warn('check-references: docs/design/references.json does not exist yet (progress mode)'); if (STRICT) process.exit(1); process.exit(0); }
const rec = readJson(file);
const errors = [], warnings = [];
const ajv = new Ajv2020({ allErrors: true, strict: false });
ajv.addFormat('uri', /^https?:\/\/[^\s]+$/);   // no ajv-formats dependency (005 plan: no new deps)
if (!ajv.validate(readJson(path.join(ROOT, 'docs/design/schemas/references-record.schema.json')), rec)) for (const e of ajv.errors) errors.push(`references.json ${e.instancePath || '/'} ${e.message}`);

const load = (f) => { const p = path.join(ROOT, f); return existsSync(p) ? readJson(p) : null; };
const dash = load('dashboard/screens.manifest.json');
const manifests = { app: load('prototype/assets/data/screens.manifest.json'), website: load('website/screens.manifest.json'), hub: load('hub/screens.manifest.json'),
  'parent-dashboard': dash && dash.parent, 'team-console': dash && dash.team };
const ids = new Set((rec.references || []).map((r) => r.id));
if (ids.size !== (rec.references || []).length) errors.push('duplicate reference ids');

/* 1. every manifest `refs` entry names a real reference */
for (const [pl, m] of Object.entries(manifests)) for (const s of (m && m.screens) || [])
  for (const ref of s.refs || []) if (!ids.has(ref)) errors.push(`${pl}/${s.id} cites unknown ${ref}`);
/* 2. every influence is a real screen that cites the reference back */
for (const r of rec.references || []) for (const inf of r.influences || []) {
  const s = ((manifests[inf.platform] || {}).screens || []).find((x) => x.id === inf.screen);
  if (!s) { (STRICT ? errors : warnings).push(`${r.id} influences ${inf.platform}/${inf.screen}, which is not in a manifest yet`); continue; }
  if (!(s.refs || []).includes(r.id)) (STRICT ? errors : warnings).push(`${inf.platform}/${inf.screen} does not cite ${r.id} in its manifest "refs"`);
}
const tally = (v) => (rec.references || []).filter((r) => r.verdict === v).length;
console.log(`references: ${(rec.references || []).length} (${tally('adopted')} adopted, ${tally('adapted')} adapted, ${tally('rejected')} rejected), ${(rec.reviews || []).length} review round(s)`);
for (const w of warnings) console.warn('  ! ' + w);
if (errors.length) { console.error(errors.map((e) => '  ✗ ' + e).join('\n')); console.error(`check-references: ${errors.length} problem(s)`); process.exit(1); }
console.log('check-references: ok' + (STRICT ? ' (strict)' : ''));
