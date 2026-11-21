// T010 (003) + T025 (004): no live or browser speech synthesis, ever (004 FR-012, amending 003 FR-014).
// Pre-generated scratch MP3s are the only AI audio allowed, as a marked, temporary demo track (RB-1):
//   - nothing in prototype/ may call speechSynthesis / SpeechSynthesisUtterance or a TTS service;
//   - every file in prototype/assets/audio-scratch/ must be listed with status "scratch" in the manifest;
//   --release: fails if ANY scratch file or status exists (RB-1: replace with human recordings before release).
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, walk } from './lib.mjs';

const BANNED = /speechSynthesis|SpeechSynthesisUtterance|webkitSpeech|getVoices\b|text-to-speech|\btts\b|speech\.platform\.bing|texttospeech|tts\.speech|cognitiveservices/i;
const release = process.argv.includes('--release');
const hits = [];
for (const file of walk(path.join(ROOT, 'prototype')).filter((f) => /\.(js|html|css|json|webmanifest)$/.test(f))) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (BANNED.test(line)) hits.push(`${path.relative(ROOT, file)}:${i + 1}  ${line.trim().slice(0, 100)}`);
  });
}

const sandbox = { window: {} };
sandbox.KC = sandbox.window.KC = {};
vm.runInNewContext(readFileSync(path.join(ROOT, 'prototype/assets/data/audio-manifest.js'), 'utf8'), sandbox);
const m = sandbox.KC.audioManifest;
const scratchDir = path.join(ROOT, 'prototype/assets/audio-scratch');
const scratchFiles = existsSync(scratchDir) ? walk(scratchDir).filter((f) => f.endsWith('.mp3')) : [];
for (const f of scratchFiles) {
  const rel = 'assets/' + path.relative(path.join(ROOT, 'prototype/assets'), f).split(path.sep).join('/');
  const [, , lang, name] = rel.split('/');
  const entry = m.lines[lang] && m.lines[lang][name.replace(/\.mp3$/, '')];
  if (!entry || entry.scratchFile !== rel) hits.push(`${rel}: a scratch file the manifest doesn't list — run node tools/design/build-narration.mjs`);
}
const scratchLines = Object.values(m.counts).reduce((n, c) => n + c.scratch, 0);
if (release && (scratchFiles.length || scratchLines)) {
  hits.push(`RB-1: ${scratchFiles.length} scratch file(s), ${scratchLines} line(s) with scratch status. Scratch audio must be replaced by human recordings before any public release.`);
}
if (hits.length) {
  console.error(hits.join('\n'));
  console.error(`\n${hits.length} problem(s). No live speech synthesis, ever; scratch audio is temporary (004 FR-012, RB-1).`);
  process.exit(1);
}
console.log(`No speech synthesis: 0 TTS references in prototype/; ${scratchFiles.length} scratch file(s), all listed (temporary, RB-1)${release ? '; release gate passed' : ''}.`);
