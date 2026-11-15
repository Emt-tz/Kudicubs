# Quickstart & Validation Guide: KudiCubs UX Prototype

**Feature**: `002-ux-prototype` | **Plan**: [plan.md](./plan.md)

How to open, check and share the prototype. Implementation steps belong in `tasks.md`.

## 1. Prerequisites

| Item | Why |
|---|---|
| A modern browser (Chrome, Safari or Firefox) | To open the prototype |
| Node.js 20+ | Only for the design tools: tokens, contrast and the flow test |
| Playwright browsers | Installed once with `npx playwright install chromium webkit` |
| A Cloudflare account and `npx wrangler login` | **Only** for sharing the link (research D2). Deploy only with your go-ahead. |

## 2. Open the prototype

```bash
open prototype/index.html                 # macOS: opens from disk (file://), no server needed
# or, to test the offline cache and "Add to Home Screen":
npx --yes serve prototype -l 4173          # then visit http://localhost:4173 on the laptop,
                                           # or http://<laptop-ip>:4173 on a phone on the same Wi-Fi
```

In desktop Chrome, use DevTools → device toolbar → iPhone 14 (390 × 844) to see the phone
frame.

**Reviewer menu**: long-press the KudiCubs logo for 2 seconds, or open
`index.html?review=1#/welcome`.

## 3. Design-system checks

```bash
cd tools/design && npm ci
node build-tokens.mjs        # regenerates prototype/assets/tokens.css + the tables in docs/design/tokens.md
node check-contrast.mjs      # every pair in tokens.json → pairs meets WCAG AA       (SC-003)
node check-tokens-usage.mjs  # no raw colours, sizes or radii outside tokens.css      (SC-005, FR-024)
npx playwright test          # flow.spec.mjs: contracts/screen-flow.md §4             (SC-002, SC-004, SC-006, FR-012/013/016)
```

**Expected**: all four exit with code 0. Running `build-tokens.mjs` twice in a row produces no
git diff.

## 4. Manual validation scenarios

| # | Scenario | Steps | Expected | Spec |
|---|---|---|---|---|
| V1 | Full walkthrough | On a phone, from Welcome, tap through to Reward, then Wallet and Progress, without guidance | Reached in under 5 minutes, with no dead ends | US1, SC-001, SC-002 |
| V2 | Save and spend | Play both choices (back from Result, or restart) | Save: coins fly into the jar and savings go up. Spend: a sticker treat. Both happy. | US1-4, FR-010 |
| V3 | Gentle feedback | Sort: drop a coin in the wrong jar twice | Soft bounce and Kudi's gentle pose; then the right jar glows. No red, X or buzzer. | FR-011, FR-016, US5-2 |
| V4 | Idle hint | Wait on Home and on the Decision screen | Within about 6 s: Kudi points, the main action pulses, the prompt is spoken again | FR-013, US5-1 |
| V5 | Regions | Reviewer menu → Ghana → Nigeria → UK; visit find, sort, Wallet and Home | GH₵, ₦ and £ with each region's coin set; counts unchanged | US4, SC-006 |
| V6 | Privacy | DevTools → Network, run the gate with a made-up email and PIN | No requests beyond the prototype's own files; nothing in `localStorage`; only preferences in `sessionStorage` | FR-012, research D11 |
| V7 | Offline | Serve, load once, then turn Wi-Fi off and reload | The prototype still works | FR-023 |
| V8 | Sound off | Mute the device or turn sound off in the reviewer menu | Speaker cues still animate; the flow is still usable | Spec edge case |
| V9 | Large screen | Open on a laptop at full width | A centred phone frame, not stretched | FR-008 |
| V10 | Tokens and components traceability | Pick 3 screens; inspect elements | Every element has `data-component`; every style comes from `var(--kc-*)` | SC-005 |
| V11 | Originality review | Compare side by side with Duolingo, Khan Academy Kids and Toca Boca screenshots (checked privately, never committed) | No copied mascot, colour, layout or asset; record the result in `docs/design/design-references.md` | SC-007, FR-025 |
| V12 | Optional child session | With parental permission, 3 or more children aged 4–6, one at a time, Home → Reward, no reading aloud | At least 3 of 4 reach Reward; hesitations over 10 s are noted | US5, SC-009 |

## 5. Share with the client (only after PR review and your go-ahead)

```bash
npx wrangler pages deploy prototype --project-name kudicubs-prototype --branch main
# prints https://kudicubs-prototype.pages.dev (plus a per-deploy preview URL)
cd prototype && zip -r ../prototype-v0.1.0.zip . && cd ..   # laptop fallback
```

Then send Jefferson the link together with `docs/design/review-guide.md`, written in plain
language. The signed-off feedback is recorded for SC-008.
