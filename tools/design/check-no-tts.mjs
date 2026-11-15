// T010: no synthetic speech anywhere in the prototype (spec 003 FR-014, SC-003).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, walk } from './lib.mjs';

const BANNED = /speechSynthesis|SpeechSynthesisUtterance|webkitSpeech|getVoices\b|text-to-speech|\btts\b/i;
const hits = [];
for (const file of walk(path.join(ROOT, 'prototype')).filter((f) => /\.(js|html|css|json|webmanifest)$/.test(f))) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (BANNED.test(line)) hits.push(`${path.relative(ROOT, file)}:${i + 1}  ${line.trim().slice(0, 100)}`);
  });
}
if (hits.length) {
  console.error(hits.join('\n'));
  console.error(`\n${hits.length} synthetic-speech reference(s). Narration must be human recordings only (FR-014).`);
  process.exit(1);
}
console.log('No synthetic speech: 0 text-to-speech references in prototype/.');
