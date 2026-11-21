# Quickstart: Validate Prototype Round 2

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Contracts**: [contracts/](./contracts/)

**Live demo link**: **https://emt-tz.github.io/Kudicubs/** (first deployed 2026-11-16, v0.3.0 · commit `28e5a24`; see
[ci-and-deploy.md §4](./contracts/ci-and-deploy.md))

## Prerequisites

- Node 22, `uv`, and `ffmpeg`/`ffprobe` (`brew install ffmpeg`).
- The first time:

  ```bash
  cd tools/design && npm ci && npx playwright install chromium webkit
  ```

## Scenarios

| # | Scenario | Run | Expected |
|---|---|---|---|
| Q1 | Everything | `cd tools/design && npm run check` | Every generator and check passes; all Playwright specs pass on Chromium and WebKit |
| Q2 | Scratch voice, first batch | `scripts/generate-scratch-voice --dry-run`, then `scripts/generate-scratch-voice` | The dry run lists about 60–65 Lost Coins lines for en-GH. The real run prints `generated N · skipped 0 · failed 0`; a second run prints `skipped N`. The files are in `prototype/assets/audio-scratch/en-GH/` |
| Q3 | Approve the voice by ear | `node tools/design/serve.mjs`, open `http://127.0.0.1:4173/`, play The Lost Coins with the sound on | Every line is heard in the scratch voice; no badges with notes off; "Scratch voice" badges with notes on; the reviewer menu shows en-GH `recorded 0 · scratch N · pending M` |
| Q4 | The rest of the voice (only after Q3 is approved) | `scripts/generate-scratch-voice --batch all` (repeat with `--lang en-NG` and `--lang en-GB` if wanted) | `check-audio.mjs` still passes |
| Q5 | Small phone | DevTools 360×640: play the flow | Next is always fully visible, including after answering on Count and Summary ([validation-suite.md](./contracts/validation-suite.md) E2) |
| Q6 | Real data | Reviewer menu → Restart; open Home, Wallet and Progress; play one run (save, perfect sort); refresh | Zeros and friendly Kudi invitations, then coins 40, savings 8, XP 50, 3 badges, 4 history rows ([data-model.md](./data-model.md) §3), unchanged after the refresh |
| Q7 | Sample data | Reviewer menu → Load sample data | The screens show full sample values; Restart → zeros |
| Q8 | Nothing from the gate is stored | Complete the gate; DevTools → Application → Storage | No email, PIN or answer anywhere |
| Q9 | Back and Reward | Finish a run → Home → browser Back; then open `#/reward` directly | Never back on Reward, a Result screen or the gate; `#/reward` goes to Home and grants nothing |
| Q10 | Release gate | `node tools/design/check-no-tts.mjs --release` | **Fails** while any scratch file exists (RB-1) |
| Q11 | Hosting precondition | Plan task T001 | Pages availability confirmed, or work stopped with options (research R1) |
| Q12 | Deploy and smoke check | Merge to `main` (after PRs #1 → #4) | The Pages workflow deploys; the smoke job passes; the reviewer menu shows `v0.3.0 · built <date>` |
| Q13 | CI on a PR | Open a PR that breaks one rule (for example, a 47 px coin) | The `prototype-ci` check fails and names the rule; reverting it passes |
| Q14 | Load failure | DevTools → Network → block `screens.js`, then reload | Kudi and "Tap to try again"; unblock it and tap → the app starts |
| Q15 | Live link recorded | Open `README.md`, `docs/design/README.md` and this file | Each shows the live URL; the reviewer menu there shows `v0.3.0 · built <date>` |
