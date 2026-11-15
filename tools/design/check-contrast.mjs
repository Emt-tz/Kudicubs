// T007: every declared fg/bg pair in docs/design/tokens.json must meet WCAG AA (SC-003).
import { TOKENS_JSON, readJson, tokenMap, resolve, contrast } from './lib.mjs';

const tokens = readJson(TOKENS_JSON);
const map = tokenMap(tokens);
let failed = 0;

console.log('fg                        bg                        ratio   min  result  usage');
for (const pair of tokens.pairs) {
  const fg = resolve(pair.fg, map);
  const bg = resolve(pair.bg, map);
  const ratio = contrast(fg, bg);
  const ok = ratio >= pair.minRatio;
  if (!ok) failed++;
  console.log(`${pair.fg.padEnd(26)}${pair.bg.padEnd(26)}${ratio.toFixed(2).padStart(5)}  ${String(pair.minRatio).padStart(4)}  ${ok ? 'PASS' : 'FAIL'}    ${pair.usage}`);
}

if (failed) {
  console.error(`\n${failed} pair(s) below WCAG AA.`);
  process.exit(1);
}
console.log(`\nAll ${tokens.pairs.length} pairs meet WCAG AA.`);
