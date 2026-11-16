# Scratch voice (temporary): spec 004, RB-1

This folder holds the **temporary scratch track**: pre-generated audio from the stock voice
`en-NG-EzinneNeural` at about −10%, made by `scripts/generate-scratch-voice`. It is used only for
demos until the human recordings exist.

- **Never released.** **RB-1: scratch audio must be replaced by human recordings before any public
  release.** `node tools/design/check-no-tts.mjs --release` fails while this folder has files.
- A human recording in `../audio/<lang>/<lineId>.m4a` always plays instead of the scratch file.
- **To remove it all**: delete this folder, then run `node tools/design/build-narration.mjs`.
- **To add lines**: run `scripts/generate-scratch-voice --batch all` (only after the voice has been
  approved by ear), then `node tools/design/check-audio.mjs`.
