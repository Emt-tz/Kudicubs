// T046: the prototype may only use design tokens (FR-024, SC-005; 003 FR-002), and must never use the old name (FR-027).
//  - no raw colours, sizes, radii, tints or opacities in prototype CSS or inline styles;
//  - every var(--kc-*) used in CSS, JS or HTML must exist in the generated tokens.css.
// Exempt, with reasons: @keyframes motion distances and fades (motion, not layout), @media breakpoints
// (custom properties can't be used there), 0/1px hairlines, and the standard visually-hidden pattern.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, TOKENS_CSS, walk } from './lib.mjs';

const problems = [];
const CSS_FILES = ['prototype/assets/base.css', 'prototype/assets/components.css'];
const JS_FILES = ['prototype/assets/screens.js', 'prototype/assets/activities.js', 'prototype/assets/celebrate.js', 'prototype/assets/app.js',
  'prototype/assets/screens-bands.js', 'prototype/assets/screens-parent.js', 'prototype/assets/missions/band-7-9.js', 'prototype/assets/missions/band-10-12.js', 'prototype/assets/missions/band-13-15.js'];
const HTML_FILES = ['prototype/index.html'];
const PX = /(^|[^\w.-])(\d*\.?\d+)px\b/g;
/* 005 T053: the adult surfaces (website, dashboards, hub, shared components) follow the same rules, with one allowance:
   layout box sizes (width, height, max-width, top, ...) may be px, because container widths, nav heights and chart sizes are not
   spacing or type tokens. Colours, type sizes, spacing (padding, margin, gap), radii, borders and shadows must still be tokens. */
const ADULT_CSS = ['shared/adult-components.css', 'website/assets/site.css', 'dashboard/assets/dashboard.css', 'hub/hub.css', 'shared/component-sheet.html'];
const ADULT_JS = ['website/assets/site.js', 'dashboard/assets/dashboard.js', 'dashboard/assets/parent.js', 'dashboard/assets/team.js', 'dashboard/assets/derive.js', 'hub/hub.js'];
const ADULT_HTML = [...walk(path.join(ROOT, 'website')), ...walk(path.join(ROOT, 'dashboard')), ...walk(path.join(ROOT, 'hub'))].filter((f) => f.endsWith('.html')).map((f) => path.relative(ROOT, f)).concat(['shared/component-sheet.html']);
const LAYOUT_PX_OK = /^(width|height|min-width|max-width|min-height|max-height|top|left|right|bottom|inset|flex-basis|grid-template-columns|outline-offset|translate|transform)$/;
const DEFINED = new Set([...readFileSync(path.join(ROOT, 'shared/tokens.css'), 'utf8').matchAll(/^\s*(--kc-[a-z0-9-]+)\s*:/gm)].map((m) => m[1]));
for (const x of [...readFileSync(TOKENS_CSS, 'utf8').matchAll(/^\s*(--kc-[a-z0-9-]+)\s*:/gm)].map((m) => m[1])) DEFINED.add(x);

let adultMode = false;
function checkDeclaration(file, line, prop, value) {
  if (/#[0-9a-fA-F]{3,8}\b/.test(value) || /\b(rgb|rgba|hsl|hsla)\(/.test(value)) {
    problems.push(`${file}:${line}  raw colour in "${prop}: ${value}" — use var(--kc-color-*)`);
  }
  if (/color-mix\(/.test(value)) problems.push(`${file}:${line}  untokenised tint in "${prop}" — record it as a tint token (var(--kc-tint-*))`);
  for (const m of value.matchAll(PX)) {
    const n = Number(m[2]);
    if (n !== 0 && n !== 1 && !(adultMode && LAYOUT_PX_OK.test(prop))) problems.push(`${file}:${line}  raw ${m[2]}px in "${prop}: ${value}" — use a space, radius, size or typography token`);
  }
  if (prop === 'opacity' && /^\s*0?\.\d+\s*$/.test(value)) problems.push(`${file}:${line}  raw opacity ${value.trim()} — use var(--kc-opacity-*)`);
  if (prop === 'font-family' && !/^(var\(--kc-|inherit)/.test(value.trim())) {
    problems.push(`${file}:${line}  font-family must come from tokens: "${value}"`);
  }
}

function checkVars(file, text) {
  text.split('\n').forEach((ln, i) => {
    for (const m of ln.matchAll(/var\((--kc-[a-z0-9-]+)/g)) {
      if (!DEFINED.has(m[1])) problems.push(`${file}:${i + 1}  ${m[1]} is not defined in tokens.css (renamed or removed token?)`);
    }
  });
}

for (const rel of CSS_FILES) {
  const raw = readFileSync(path.join(ROOT, rel), 'utf8');
  checkVars(rel, raw);
  const text = raw.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const lines = text.split('\n');
  lines.forEach((ln, i) => {
    if (/@keyframes|@media/.test(ln) || /^\.kc-sr-only\b/.test(ln.trim())) return;
    for (const m of ln.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)(;|$|})/g)) {
      const prop = m[1];
      if (/^(hover|active|focus|focus-visible|not|nth-child|before|after|root|disabled)$/.test(prop)) continue;
      checkDeclaration(rel, i + 1, prop, m[2]);
    }
  });
}

/* Inline styles built in JavaScript: style: '...' strings; and every token name used in scripts or HTML */
for (const rel of JS_FILES) {
  const raw = readFileSync(path.join(ROOT, rel), 'utf8');
  checkVars(rel, raw);
  raw.split('\n').forEach((ln, i) => {
    for (const m of ln.matchAll(/style:\s*'([^']*)'/g)) {
      for (const decl of m[1].split(';')) {
        const [prop, ...rest] = decl.split(':');
        if (!prop || !rest.length) continue;
        checkDeclaration(rel, i + 1, prop.trim(), rest.join(':').trim());
      }
    }
    if (/--kc-[a-z0-9-]*'\s*\+/.test(ln)) problems.push(`${rel}:${i + 1}  token name built from pieces — write the full var(--kc-*) so it can be checked`);
  });
}
for (const rel of HTML_FILES) checkVars(rel, readFileSync(path.join(ROOT, rel), 'utf8'));

/* 005: adult surfaces */
adultMode = true;
for (const rel of ADULT_CSS.filter((f) => f.endsWith('.css'))) {
  if (!existsSync(path.join(ROOT, rel))) continue;
  const raw = readFileSync(path.join(ROOT, rel), 'utf8');
  checkVars(rel, raw);
  raw.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' ')).split('\n').forEach((ln, i) => {
    if (/@keyframes|@media/.test(ln) || /^\.kc-sr-only\b/.test(ln.trim())) return;
    for (const m of ln.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)(;|$|})/g)) {
      if (/^(hover|active|focus|focus-visible|not|nth-child|before|after|root|disabled|where|is|has)$/.test(m[1])) continue;
      checkDeclaration(rel, i + 1, m[1], m[2]);
    }
  });
}
for (const rel of ADULT_JS) {
  if (!existsSync(path.join(ROOT, rel))) continue;
  const raw = readFileSync(path.join(ROOT, rel), 'utf8');
  checkVars(rel, raw);
  raw.split('\n').forEach((ln, i) => {
    for (const m of ln.matchAll(/style(?:\.cssText)?\s*[:=]\s*['"]([^'"]*)['"]/g)) for (const decl of m[1].split(';')) {
      const [prop, ...rest] = decl.split(':'); if (!prop || !rest.length) continue; checkDeclaration(rel, i + 1, prop.trim(), rest.join(':').trim());
    }
  });
}
for (const rel of ADULT_HTML) {
  if (!existsSync(path.join(ROOT, rel))) continue;
  const raw = readFileSync(path.join(ROOT, rel), 'utf8');
  checkVars(rel, raw);
  raw.split('\n').forEach((ln, i) => {
    for (const m of ln.matchAll(/\sstyle="([^"]*)"/g)) for (const decl of m[1].split(';')) {
      const [prop, ...rest] = decl.split(':'); if (!prop || !rest.length) continue; checkDeclaration(rel, i + 1, prop.trim(), rest.join(':').trim());
    }
  });
}
adultMode = false;

/* Old name check (FR-027): BizKids/BizKidz must not appear in prototype/ or docs/design/,
   except inside a clearly marked "former name" note in design-references.md. */
for (const file of [...walk(path.join(ROOT, 'prototype')), ...walk(path.join(ROOT, 'docs/design'))]) {
  if (!/\.(html|css|js|md|json|svg|webmanifest|txt)$/.test(file)) continue;
  const rel = path.relative(ROOT, file);
  readFileSync(file, 'utf8').split('\n').forEach((ln, i) => {
    if (/bizkid/i.test(ln) && !(rel.endsWith('design-references.md') && /former name/i.test(ln))) {
      problems.push(`${rel}:${i + 1}  old product name found — use "KudiCubs"`);
    }
  });
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} token/name violation(s).`);
  process.exit(1);
}
console.log(`Token usage OK: ${CSS_FILES.length} CSS files, inline styles in ${JS_FILES.length} scripts and ${HTML_FILES.length} HTML file use only defined var(--kc-*) tokens (${DEFINED.size} defined); no old product name.`);
