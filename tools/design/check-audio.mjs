// T026 (004 FR-021, FR-045; research R6): every audio file the manifest lists exists, is > 1 KB and lasts
// ≤ 8 s (ffprobe; the hard limit); no unlisted file; every Lost Coins line for the default region has a recorded
// or scratch file. A file longer than its line's maxSeconds (a reading-pace estimate for the actor) is a warning:
// the slower 4–6 scratch rate runs a little over it. --allow-missing skips the Lost Coins rule.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, walk } from './lib.mjs';
import { batch, defaultRegion } from './lib/batches.mjs';

const PROTO = path.join(ROOT, 'prototype');
const problems = [];
try { execFileSync('ffprobe', ['-version'], { stdio: 'ignore' }); } catch {
  console.error('ffprobe not found: install ffmpeg (brew install ffmpeg, or apt-get install ffmpeg)');
  process.exit(1);
}
const sandbox = { window: {} };
sandbox.KC = sandbox.window.KC = {};
vm.runInNewContext(readFileSync(path.join(PROTO, 'assets/data/audio-manifest.js'), 'utf8'), sandbox);
const m = sandbox.KC.audioManifest;

const listed = new Map();                                     // rel path → the line's maxSeconds estimate
const warnings = [];
for (const lang of m.languages) for (const [id, e] of Object.entries(m.lines[lang])) {
  for (const f of [e.file, e.scratchFile]) if (f) listed.set(f, e.maxSeconds || 8);
  if (e.status === 'pending' && (e.file || e.scratchFile)) problems.push(`${lang} ${id}: pending but points at a file`);
}
const duration = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());
let checked = 0;
for (const [rel, max] of listed) {
  const file = path.join(PROTO, rel);
  if (!existsSync(file)) { problems.push(`${rel}: listed in the manifest but missing`); continue; }
  const size = statSync(file).size;
  if (size <= 1024) { problems.push(`${rel}: only ${size} bytes`); continue; }
  let d;
  try { d = duration(file); } catch { problems.push(`${rel}: not playable (ffprobe failed)`); continue; }
  if (!(d > 0)) problems.push(`${rel}: no duration`);
  else if (d > 8) problems.push(`${rel}: ${d.toFixed(2)} s is longer than 8 s`);
  else if (d > max + 0.05) warnings.push(`${rel}: ${d.toFixed(2)} s (line estimate ${max} s)`);
  checked++;
}
for (const dir of ['assets/audio', 'assets/audio-scratch']) {
  const abs = path.join(PROTO, dir);
  if (!existsSync(abs)) continue;
  for (const f of walk(abs).filter((x) => /\.(m4a|mp3)$/.test(x))) {
    const rel = path.relative(PROTO, f).split(path.sep).join('/');
    if (!listed.has(rel)) problems.push(`${rel}: not listed in the manifest (run node tools/design/build-narration.mjs, or remove it)`);
  }
}
if (!process.argv.includes('--allow-missing')) {
  const region = defaultRegion();
  const lang = m.regionLanguage[region];
  for (const id of batch('lost-coins', { region })) {
    const e = m.lines[lang][id];
    if (!e || !(e.status === 'recorded' || e.status === 'scratch')) problems.push(`${lang} ${id}: The Lost Coins line has no recorded or scratch audio`);
  }
}
if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} audio problem(s).`);
  process.exit(1);
}
if (warnings.length) console.log(`${warnings.length} file(s) over their line's pace estimate (warning only, all ≤ 8 s):\n  ${warnings.join('\n  ')}`);
const c = m.counts[m.defaultLanguage];
console.log(`Audio OK: ${checked} file(s) exist, > 1 KB, ≤ 8 s; none unlisted; every Lost Coins line has audio (${m.defaultLanguage}: recorded ${c.recorded} · scratch ${c.scratch} · pending ${c.pending}).`);
