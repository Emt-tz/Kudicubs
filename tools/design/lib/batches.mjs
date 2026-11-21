// 004 research R3: which narration lines make a scratch-voice batch. Shared by scripts/generate-scratch-voice
// (via `node tools/design/lib/batches.mjs --print lost-coins`) and tools/design/check-audio.mjs, so they never drift.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from '../lib.mjs';

export const LINES_FILE = path.join(ROOT, 'docs/design/narration/lines.json');
/* The mission's screens come from the prototype itself (KC.MISSION in app.js), so the two never drift. */
const appSrc = readFileSync(path.join(ROOT, 'prototype/assets/app.js'), 'utf8');
const mission = appSrc.match(/KC\.MISSION = \[([^\]]+)\]/);
if (!mission) throw new Error('KC.MISSION not found in prototype/assets/app.js');
export const LOST_COINS_SCREENS = [...mission[1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
/* Shared lines the Lost Coins flow speaks: counting, the long-idle hint and the badges a first run can award. */
export const LOST_COINS_SHARED = ['num.1', 'num.2', 'num.3', 'num.4', 'num.5', 'num.6', 'num.7', 'num.8', 'hint.welcome_back',
  'badge.first_coins', 'badge.hard_worker', 'badge.smart_sorter'];

/** The default region: the one whose language is lines.json's defaultLanguage (Ghana, en-GH, today). */
export function defaultRegion(doc = JSON.parse(readFileSync(LINES_FILE, 'utf8'))) {
  return Object.keys(doc.regionLanguage).find((r) => doc.regionLanguage[r] === doc.defaultLanguage);
}

/** Line IDs for a batch. 'lost-coins': the flow's lines for one region (default region) plus the shared lines it speaks. */
export function batch(name = 'lost-coins', { region } = {}) {
  const doc = JSON.parse(readFileSync(LINES_FILE, 'utf8'));
  region = region || defaultRegion(doc);
  if (name === 'all') return doc.lines.map((l) => l.id);
  if (name !== 'lost-coins') throw new Error(`unknown batch "${name}" (lost-coins | all)`);
  const ids = doc.lines.filter((l) => LOST_COINS_SCREENS.includes(l.screen) && (!l.region || l.region === region)).map((l) => l.id);
  for (const id of LOST_COINS_SHARED) if (doc.lines.some((l) => l.id === id) && !ids.includes(id)) ids.push(id);
  return ids;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--print');
  const region = process.argv.includes('--region') ? process.argv[process.argv.indexOf('--region') + 1] : undefined;
  process.stdout.write(JSON.stringify(batch(i > -1 ? process.argv[i + 1] : 'lost-coins', { region })) + '\n');
}
