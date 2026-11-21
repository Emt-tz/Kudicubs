# Narration recordings

Put human voice recordings here, one file per line, in the folder for its language:

    prototype/assets/audio/<language>/<lineId>.m4a      e.g. en-GH/intro.say.m4a

- `<lineId>` is the ID in `docs/design/narration/lines.json` and in `docs/design/narration-script.md`.
- Format: AAC (`.m4a`), mono, 64 kbps. Studio masters (`.wav`) can go here too; they are not committed.
  `node tools/design/encode-audio.mjs` converts them to `.m4a` if ffmpeg is installed.
- After adding or removing files, run `node tools/design/build-narration.mjs` (or `npm run check`
  in `tools/design/`). The audio manifest then marks those lines `recorded` and the prototype plays them,
  with no code change. Lines without a file show their caption with "Recording pending".
- Never put synthetic or AI-generated voices here.
