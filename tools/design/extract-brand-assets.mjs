// T004: extract the official logo versions and the five mascot poses from the client's brand guide.
// Never redraws: logos are cropped only by changing the SVG root viewBox/width/height; mascots are
// recombined with their own masks and scaled in proportion. (spec 003 FR-009, FR-010, research R1)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { ROOT } from './lib.mjs';

const PDF = path.join(ROOT, 'docs/source/KudiCubs Brand.pdf');
const OUT = path.join(ROOT, 'prototype/assets/brand');
const DPI = 144;
const tmp = mkdtempSync(path.join(tmpdir(), 'kc-brand-'));
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: 'utf8', ...opts });

// 1. Render pages 2–3 for panel detection, export them as vector SVG, extract page-4 images.
run('pdftoppm', ['-r', String(DPI), '-f', '2', '-l', '3', '-png', PDF, path.join(tmp, 'pg')]);
run('pdftocairo', ['-svg', '-f', '2', '-l', '2', PDF, path.join(tmp, 'p2.svg')]);
run('pdftocairo', ['-svg', '-f', '3', '-l', '3', PDF, path.join(tmp, 'p3.svg')]);
run('pdfimages', ['-png', '-f', '4', '-l', '4', PDF, path.join(tmp, 'm')]);
const pages = readdirSync(tmp).filter((f) => /^pg-\d+\.png$/.test(f)).sort();

// 2. Find bounds + build mascot images (Python/Pillow helper, isolated mode).
const bounds = JSON.parse(run('uv', ['run', '--quiet', '--no-project', '--with', 'pillow', 'python', '-I',
  path.join(ROOT, 'tools/design/lib/brand_extract.py'),
  path.join(tmp, pages[0]), path.join(tmp, pages[1]), tmp, OUT, String(DPI)], { cwd: tmp }));

// 3. Logos: rewrite only the root <svg> width/height/viewBox. All artwork paths are untouched.
function crop(srcSvg, [x, y, w, h], outName) {
  const svg = readFileSync(srcSvg, 'utf8');
  const cropped = svg.replace(/<svg([^>]*)>/, (m, attrs) => {
    const kept = attrs.replace(/\s(width|height|viewBox)="[^"]*"/g, '');
    return `<svg${kept} width="${w}pt" height="${h}pt" viewBox="${x} ${y} ${w} ${h}">`;
  });
  if (cropped.replace(/<svg[^>]*>/, '') !== svg.replace(/<svg[^>]*>/, '')) throw new Error('artwork changed');
  writeFileSync(path.join(OUT, outName), cropped);
}
crop(path.join(tmp, 'p2.svg'), bounds['logo-on-white'], 'logo-on-white.svg');
crop(path.join(tmp, 'p3.svg'), bounds['logo-on-yellow'], 'logo-on-yellow.svg');
crop(path.join(tmp, 'p3.svg'), bounds['logo-on-brown'], 'logo-on-brown.svg');
crop(path.join(tmp, 'p3.svg'), bounds['app-icon'], 'app-icon.svg');

// 4. PNG renders of the SVGs (2×) and the app icons, at their own aspect ratio.
const browser = await chromium.launch();
const page = await browser.newPage();
async function render(svgName, pngName, width) {
  const [, , w, h] = svgName === 'app-icon.svg' ? bounds['app-icon'] : bounds[svgName.replace('.svg', '')];
  const height = Math.round(width * h / w);
  await page.setViewportSize({ width, height });
  const wrapper = path.join(tmp, 'render.html');
  writeFileSync(wrapper, `<html><body style="margin:0"><img src="file://${path.join(OUT, svgName)}" style="display:block;width:100vw;height:100vh"></body></html>`);
  await page.goto('file://' + wrapper);
  await page.waitForFunction(() => document.images[0].complete && document.images[0].naturalWidth > 0);
  await page.screenshot({ path: path.join(OUT, pngName) });
}
await render('logo-on-white.svg', 'logo-on-white.png', 640);
await render('logo-on-yellow.svg', 'logo-on-yellow.png', 640);
await render('logo-on-brown.svg', 'logo-on-brown.png', 640);
await render('app-icon.svg', 'app-icon-192.png', 192);
await render('app-icon.svg', 'app-icon-512.png', 512);
await browser.close();
rmSync(tmp, { recursive: true, force: true });

// 5. SOURCES.md with provenance and checksums.
const SRC = {
  'logo-on-white': 'Brand guide p.2 (vector) — viewBox crop of the white panel',
  'logo-on-yellow': 'Brand guide p.3 left (vector) — viewBox crop on Sunshine Yellow',
  'logo-on-brown': 'Brand guide p.3 right (vector) — viewBox crop of the Mane Brown box',
  'app-icon': 'Brand guide p.3 left (vector) — viewBox crop of the cub + K coin only',
  'kudi-wave': 'Brand guide p.4 image 1 + mask (raises the K coin) → wave',
  'kudi-celebrate': 'Brand guide p.4 image 2 + mask (wink, sparkling coin) → celebrate (provisional: no peace-sign pose supplied)',
  'kudi-headphones': 'Brand guide p.4 image 3 + mask → headphones',
  'kudi-fist': 'Brand guide p.4 image 4 + mask → fist',
  'kudi-thumbs-up': 'Brand guide p.4 image 5 + mask → thumbs-up',
};
const files = readdirSync(OUT).filter((f) => /\.(svg|png|webp)$/.test(f)).sort();
const rows = files.map((f) => {
  const key = f.replace(/\.(svg|png|webp)$/, '').replace(/-(192|512)$/, '');
  const sha = createHash('sha256').update(readFileSync(path.join(OUT, f))).digest('hex').slice(0, 16);
  return `| \`${f}\` | ${SRC[key] || ''} | \`${sha}…\` |`;
});
writeFileSync(path.join(OUT, 'SOURCES.md'), `# Brand asset sources

Generated by \`tools/design/extract-brand-assets.mjs\` from \`docs/source/KudiCubs Brand.pdf\`. Do not edit the
artwork. Logos are vector exports cropped **only** by their SVG \`viewBox\`; mascots are the guide's own images
recombined with their own transparency masks and scaled in proportion to 640 px tall. Replace with the client's
master files when supplied (spec 003 B8), keeping the same file names.

Commands: \`pdftoppm -r ${DPI}\` (panel detection only), \`pdftocairo -svg\` (pages 2–3), \`pdfimages -png\` (page 4).

| File | Source | SHA-256 (first 16) |
|---|---|---|
${rows.join('\n')}
`);
console.log(`brand assets → prototype/assets/brand/ (${files.length} files)`, JSON.stringify(bounds));
