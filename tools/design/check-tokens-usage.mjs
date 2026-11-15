// T046: the prototype may only use design tokens (FR-024, SC-005), and must never use the old name (FR-027).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const problems = [];
const CSS_FILES = ['prototype/assets/base.css', 'prototype/assets/components.css'];
const JS_FILES = ['prototype/assets/screens.js', 'prototype/assets/activities.js', 'prototype/assets/celebrate.js', 'prototype/assets/app.js'];
const SIZE_PROPS = /^(font-size|border-radius|padding(-[a-z]+)?|margin(-[a-z]+)?|gap|row-gap|column-gap)$/;
const PX = /(^|[^\w.-])(\d*\.?\d+)px\b/g;

function checkDeclaration(file, line, prop, value) {
  if (/#[0-9a-fA-F]{3,8}\b/.test(value) || /\b(rgb|rgba|hsl|hsla)\(/.test(value)) {
    problems.push(`${file}:${line}  raw colour in "${prop}: ${value}" — use var(--kc-color-*)`);
  }
  if (SIZE_PROPS.test(prop)) {
    for (const m of value.matchAll(PX)) {
      const n = Number(m[2]);
      if (n !== 0 && n !== 1) problems.push(`${file}:${line}  raw ${m[2]}px in "${prop}: ${value}" — use var(--kc-space-*/radius-*/typography-*)`);
    }
  }
  if (prop === 'font-family' && !/^(var\(--kc-|inherit)/.test(value.trim())) {
    problems.push(`${file}:${line}  font-family must come from tokens: "${value}"`);
  }
}

for (const rel of CSS_FILES) {
  const text = readFileSync(path.join(ROOT, rel), 'utf8').replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  const lines = text.split('\n');
  lines.forEach((ln, i) => {
    for (const m of ln.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)(;|$|})/g)) {
      const prop = m[1];
      if (/^(hover|active|focus|focus-visible|not|nth-child|before|after|root)$/.test(prop)) continue;
      checkDeclaration(rel, i + 1, prop, m[2]);
    }
  });
}

/* Inline styles built in JavaScript: style: '...' strings */
for (const rel of JS_FILES) {
  const lines = readFileSync(path.join(ROOT, rel), 'utf8').split('\n');
  lines.forEach((ln, i) => {
    for (const m of ln.matchAll(/style:\s*'([^']*)'/g)) {
      for (const decl of m[1].split(';')) {
        const [prop, ...rest] = decl.split(':');
        if (!prop || !rest.length) continue;
        checkDeclaration(rel, i + 1, prop.trim(), rest.join(':').trim());
      }
    }
  });
}

/* Old name check (FR-027): BizKids/BizKidz must not appear in prototype/ or docs/design/,
   except inside a clearly marked "former name" note in design-references.md. */
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
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
console.log(`Token usage OK: ${CSS_FILES.length} CSS files + inline styles in ${JS_FILES.length} scripts use only var(--kc-*); no old product name.`);
