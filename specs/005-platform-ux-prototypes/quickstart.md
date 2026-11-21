# Quickstart: Validating Complete UI/UX and Prototypes

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · Contracts in [contracts/](./contracts/)

Prerequisites: Node 20 or newer, `ffprobe` (from ffmpeg), and the dev tools installed once:

```bash
cd tools/design
npm ci && npx playwright install chromium webkit
```

## Q1. Run every automated check

```bash
cd tools/design
npm run check
```

Expected: every step passes, including the new coverage, references and per-surface tests.

## Q2. Coverage is complete (SC-001)

```bash
cd tools/design
node check-coverage.mjs
```

Expected: a summary with zero gaps for in-scope rows, and every 001 and 005 story id found.

## Q3. Build and preview the whole set

```bash
cd tools/design
node build-site.mjs && npm run serve
```

Open `http://127.0.0.1:4173/`. Expected: the hub with three platform cards, version, date, coverage
counts and a change list.

## Q4. Mobile app, all bands (SC-002)

From the hub open the app on a phone-size window. For each age band, go from the welcome screen to
reward, wallet, progress and profile. Expected: no dead ends, 4–6 shows no failure screen, 7–15 offers
a retry. Switch the region in the reviewer menu and confirm coins and examples change.

## Q5. Parent area on the phone

Open the parent entry, pass the gate, try a wrong PIN until the lock-out, use recovery, sign in on a
"new device" with the demo code, pick device mode, and reach delete-account. Expected: each state
shows a calm message and a way back.

## Q6. Website (SC-003, SC-008)

Open `/website/` at 320, 768 and 1280 px. Expected: no sideways scroll, one primary action per page,
the download route per platform, working FAQ and contact states, legal pages present.

## Q7. Parent Dashboard (SC-004)

Open `/dashboard/parent/`, sign in with the demo code, then find a child's recent play and strongest
skill. Expected: under 90 seconds without help; new-family, wrong-code and expired-code states are
reachable from the reviewer menu.

## Q8. Team Console

Open `/dashboard/team/` as support, then as content editor. Expected: support sees nicknames only,
content sees mission and voice status, restricted pages show the no-access state.

## Q9. References and originality (SC-006)

```bash
cd tools/design
node check-references.mjs
```

Expected: every adopted or adapted reference has a "differs" note; the latest review round is
recorded; rejected references list reasons.

## Q10. Share test (SC-007, SC-009)

Send the hub link to three people who have not seen the project. Expected: each completes one journey
on each platform unaided. After a new version is published, the same link shows the new version,
date and change list.
