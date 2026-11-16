# Contract: `scripts/generate-scratch-voice` (1.0.0)

**Spec**: FR-016–FR-018, RB-1 · **Research**: R2, R3

A temporary scratch track for demos only. It must be replaced by human recordings before any
public release (RB-1).

## Usage

```text
scripts/generate-scratch-voice [--batch lost-coins|all] [--lang en-GH] [--only id1,id2]
                               [--voice en-NG-EzinneNeural] [--rate -10%] [--retries 3]
                               [--dry-run]
```

| Option | Default | Meaning |
|---|---|---|
| `--batch` | `lost-coins` | `lost-coins`: the Lost Coins flow lines for the default region plus the shared lines it speaks (research R3). `all`: every line in `lines.json` for `--lang`. |
| `--lang` | `en-GH` | The manifest language folder to write to |
| `--only` | — | Comma-separated line IDs (overrides `--batch`) |
| `--voice` | `en-NG-EzinneNeural` | Scratch voice for every language (clarification 2026-11-15) |
| `--rate` | `-10%` | About 10% slower, for ages 4–6 |
| `--retries` | `3` | Attempts per line, with back-off (1 s, 2 s, 4 s) |
| `--dry-run` | off | List what would be generated or skipped; send nothing |

Runs with `uv`, using inline script metadata. It needs **no account and no API key**. Only the
line text is sent to the voice service.

## Behaviour

1. Read `docs/design/narration/lines.json` and choose the lines.
2. For each line, if `prototype/assets/audio-scratch/<lang>/<id>.mp3` exists and is not empty,
   **skip** it.
3. Otherwise, generate to `<id>.mp3.part`. If the file is non-empty, rename it to `<id>.mp3`.
   On error, retry. After the last attempt, mark the line **failed** and delete the `.part`
   file.
4. Run `node tools/design/build-narration.mjs`, so the manifest lists the new files.
5. Print:

   ```text
   scratch voice en-NG-EzinneNeural (-10%) → en-GH, batch lost-coins
   generated 58 · skipped 4 · failed 1
   failed: count.which_most (timeout)
   ```

6. Exit `0` if nothing failed, `1` otherwise.

## Guarantees

- It never writes into `prototype/assets/audio/` (human recordings).
- It never writes a partial file under a final name.
- The output is deterministic per line ID (one file per ID; no other files).
