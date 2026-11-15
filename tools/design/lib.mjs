// Shared helpers for the KudiCubs design tools (spec 002, research D3/D12).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TOKENS_JSON = path.join(ROOT, 'docs/design/tokens.json');
export const TOKENS_SCHEMA = path.join(ROOT, 'specs/003-brand-voice-interactive/contracts/tokens.schema.json');
export const TOKENS_CSS = path.join(ROOT, 'prototype/assets/tokens.css');
export const TOKENS_MD = path.join(ROOT, 'docs/design/tokens.md');

export const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** Every file under a directory, recursively. */
export const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = path.join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

/** Walk token leaves (objects with $value) and yield [dotPath, token]. */
export function* leaves(node, prefix = []) {
  for (const [key, val] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    if (val && typeof val === 'object' && '$value' in val) yield [[...prefix, key].join('.'), val];
    else if (val && typeof val === 'object') yield* leaves(val, [...prefix, key]);
  }
}

const GROUPS = ['color', 'font', 'typography', 'space', 'radius', 'elevation', 'size', 'motion', 'tint', 'opacity'];

/** Map of dotPath -> token for every token group. */
export function tokenMap(tokens) {
  const map = new Map();
  for (const g of GROUPS) if (tokens[g]) for (const [p, t] of leaves(tokens[g], [g])) map.set(p, t);
  return map;
}

/** Resolve "{a.b.c}" aliases recursively (strings or objects). */
export function resolve(value, map, seen = new Set()) {
  if (typeof value === 'string') {
    const m = value.match(/^\{([a-z0-9_.]+)\}$/);
    if (!m) return value;
    if (seen.has(m[1])) throw new Error(`Alias cycle at {${m[1]}}`);
    const target = map.get(m[1]);
    if (!target) throw new Error(`Unknown token alias {${m[1]}}`);
    return resolve(target.$value, map, new Set([...seen, m[1]]));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, map, seen)]));
  }
  return value;
}

export const cssName = (dotPath) => `--kc-${dotPath.replace(/[._]/g, '-')}`;

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two #RRGGBB colours. */
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
