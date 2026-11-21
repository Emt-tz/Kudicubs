// T049 (optional): convert studio WAV masters in prototype/assets/audio/<lang>/*.wav to .m4a (AAC-LC, mono, 64 kbps),
// then rebuild the audio manifest. Needs ffmpeg; exits with a clear message if it is missing. (spec 003 research R6)
import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch (e) {
  console.error('ffmpeg is not installed. Install it (e.g. `brew install ffmpeg`) or ask the studio to deliver .m4a files directly.');
  process.exit(1);
}
const AUDIO = path.join(ROOT, 'prototype/assets/audio');
let n = 0;
for (const lang of readdirSync(AUDIO).filter((d) => !d.includes('.'))) {
  for (const wav of readdirSync(path.join(AUDIO, lang)).filter((f) => f.endsWith('.wav'))) {
    const out = path.join(AUDIO, lang, wav.replace(/\.wav$/, '.m4a'));
    if (existsSync(out) && !process.argv.includes('--force')) continue;
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(AUDIO, lang, wav), '-ac', '1', '-c:a', 'aac', '-b:a', '64k', out]);
    n++;
  }
}
console.log(`encoded ${n} file(s)`);
execFileSync('node', [path.join(ROOT, 'tools/design/build-narration.mjs')], { stdio: 'inherit' });
