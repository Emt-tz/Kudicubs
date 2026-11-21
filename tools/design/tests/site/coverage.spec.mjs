// 005 T019: prove the coverage check fails when its rules are broken (like 004 "prove the rule fails").
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ROOT } from '../../lib.mjs';

const real = JSON.parse(readFileSync(path.join(ROOT, 'docs/design/journey-map.json'), 'utf8'));
const tool = path.join(ROOT, 'tools/design/check-coverage.mjs');
const run = (map, extra = []) => {
  const f = path.join(mkdtempSync(path.join(tmpdir(), 'kc-map-')), 'map.json');
  writeFileSync(f, JSON.stringify(map));
  const r = spawnSync('node', [tool, '--map', f, ...extra], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
};
const clone = () => JSON.parse(JSON.stringify(real));

test('the real map passes in progress mode', () => { expect(run(real).code).toBe(0); });

test('fails when a story id has no row', () => {
  const m = clone(); m.rows = m.rows.filter((r) => r.source !== '001-US4');
  const r = run(m); expect(r.code).toBe(1); expect(r.out).toContain('story 001-US4 has no row');
});
test('fails when a "designed" row links to a screen that does not exist', () => {
  const m = clone(); const row = m.rows.find((x) => x.status === 'designed');
  row.screens = [{ platform: row.screens[0].platform, screen: 'no-such-screen' }];
  const r = run(m); expect(r.code).toBe(1); expect(r.out).toContain('no-such-screen');
});
test('fails when a "designed" row has no screens (schema)', () => {
  const m = clone(); const row = m.rows.find((x) => x.status === 'designed'); delete row.screens;
  expect(run(m).code).toBe(1);
});
test('fails when an out-of-scope row has no reason (schema)', () => {
  const m = clone(); const row = m.rows.find((x) => x.status === 'out-of-scope'); delete row.reason;
  expect(run(m).code).toBe(1);
});
test('strict mode fails on any in-scope gap, progress mode does not', () => {
  const m = clone(); const row = m.rows.find((x) => x.status === 'designed'); row.status = 'gap';
  expect(run(m).code).toBe(0);
  const r = run(m, ['--strict']); expect(r.code).toBe(1); expect(r.out).toContain('no designed screens');
});
