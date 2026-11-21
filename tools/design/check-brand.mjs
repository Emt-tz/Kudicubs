// T009: brand colours must equal the client's brand guide exactly; every other colour must be a recorded
// derivation, the flagged success green, or (art only) the recorded illustration palette.
// --art also scans placeholder SVG art (FR-001, FR-002, FR-004, FR-047, SC-001). Supplied brand art is exempt.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, TOKENS_JSON, readJson, tokenMap, resolve, walk } from './lib.mjs';

/* Fixed copy of docs/source/KudiCubs Brand.pdf pp.5–6 (Warm Cream = swatch value, provisional; Charcoal = swatch, assumed). */
const GUIDE = {
  sunshine_yellow: '#FBCE16', mane_brown: '#3E2312', adventure_orange: '#F68C1F', golden_orange: '#FBAA19',
  soft_gold: '#FBE57E', peach_cream: '#FCE6C6', warm_cream: '#FEF5E0', white: '#FFFFFF', charcoal: '#231F20',
};

const tokens = readJson(TOKENS_JSON);
const map = tokenMap(tokens);
const problems = [];
const allowedUi = new Set();
const allowedArt = new Set();

for (const [name, hex] of Object.entries(GUIDE)) {
  const t = map.get(`color.brand.${name}`);
  if (!t) problems.push(`missing brand token color.brand.${name}`);
  else if (t.$value.toUpperCase() !== hex) problems.push(`color.brand.${name} is ${t.$value}, brand guide says ${hex} — brand colours must never be altered (FR-004)`);
  else if (t.$extensions?.kudicubs?.source !== 'brand-guide') problems.push(`color.brand.${name} lacks $extensions.kudicubs.source = "brand-guide"`);
}

for (const [p, t] of map) {
  if (t.$type === 'tint') {
    const base = t.$value.color.slice(1, -1);
    if (!map.has(base) || map.get(base).$type !== 'color') problems.push(`${p}: tint must point at a recorded colour token`);
    else if (base.startsWith('color.illustration.')) problems.push(`${p}: UI tint may not use the illustration palette`);
    continue;
  }
  if (t.$type !== 'color') continue;
  const isAlias = typeof t.$value === 'string' && t.$value.startsWith('{');
  const v = resolve(t.$value, map).toUpperCase();
  const x = t.$extensions?.kudicubs || {};
  if (isAlias) {
    const target = t.$value.slice(1, -1);
    if (target.startsWith('color.illustration.')) problems.push(`${p}: UI alias may not point at the illustration palette`);
    continue;
  }
  if (p.startsWith('color.brand.')) { allowedUi.add(v); allowedArt.add(v); continue; }
  if (p.startsWith('color.derived.')) {
    if (!x.derivedFrom || !x.rule) problems.push(`${p}: derived colour must record derivedFrom and rule`);
    if (x.needsApproval !== true) problems.push(`${p}: derived colour must be marked needsApproval until the client approves`);
    allowedUi.add(v); allowedArt.add(v); continue;
  }
  if (p === 'color.success.green') {
    if (!x.notInPalette || !x.needsApproval) problems.push(`${p}: must be flagged notInPalette + needsApproval (FR-007)`);
    allowedUi.add(v); allowedArt.add(v); continue;
  }
  if (p.startsWith('color.illustration.')) {
    if (!x.purpose || x.needsApproval !== true) problems.push(`${p}: illustration colour must record purpose and needsApproval (FR-047)`);
    allowedArt.add(v); continue;
  }
  problems.push(`${p}: ${v} is not a brand colour, a recorded derivation, the success green or an illustration colour`);
}

if (process.argv.includes('--art')) {
  const artDir = path.join(ROOT, 'prototype/assets/art');
  let files = 0, colours = 0;
  for (const file of walk(artDir).filter((f) => f.endsWith('.svg'))) {
    files++;
    const svg = readFileSync(file, 'utf8');
    for (const m of svg.matchAll(/(?:fill|stroke|stop-color)="(#[0-9a-fA-F]{6})"/g)) {
      colours++;
      if (!allowedArt.has(m[1].toUpperCase())) problems.push(`${path.relative(ROOT, file)}: ${m[1]} is not a brand, derived or illustration token (FR-047)`);
    }
    if (/(?:fill|stroke|stop-color)="#[0-9a-fA-F]{3}"/.test(svg)) problems.push(`${path.relative(ROOT, file)}: 3-digit hex colour; use full token values`);
  }
  console.log(`art: ${files} placeholder SVGs, ${colours} colour uses checked (prototype/assets/brand/ is exempt)`);
}

if (problems.length) {
  console.error([...new Set(problems)].join('\n'));
  console.error(`\n${new Set(problems).size} brand problem(s).`);
  process.exit(1);
}
console.log(`Brand OK: ${Object.keys(GUIDE).length} brand colours match the guide; ${allowedUi.size} UI colours, ${allowedArt.size} art colours, all recorded.`);
