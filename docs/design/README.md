# KudiCubs Design System

This is the design system for KudiCubs: the **durable** source that both the clickable prototype
and the real app (spec 001) are built from. **`prototype/` is a throwaway demonstration. This
folder is what lasts.**

- **Spec**: [specs/002-ux-prototype/spec.md](../../specs/002-ux-prototype/spec.md)
- **Tokens version**: `0.1.0`, which becomes `1.0.0` when the client signs off.
- **Prototype version**: `0.1.0`

## Files

| File | What it's for |
|---|---|
| [tokens.json](./tokens.json) | **Source of truth** for colour, type, space, radius, elevation, size and motion |
| [tokens.md](./tokens.md) | Principles, when to use what, and the generated token tables |
| [components.md](./components.md) | The 25 components: purpose, states, touch sizes, tokens, screens, band notes. Also the "one main action at a time" rule. |
| [kudi-the-cub.md](./kudi-the-cub.md) | Kudi's character, visual spec, 7 poses, voice and lines, placement, and the never-do list |
| [age-band-rules.md](./age-band-rules.md) | 4–6 / 7–9 / 10–12 / 13–15 UI rules, one screen at four bands, tablets, 5 worked situations |
| [design-references.md](./design-references.md) | Patterns learned from Duolingo, Khan Academy Kids and Toca Boca, how KudiCubs differs, and the originality record |
| [review-guide.md](./review-guide.md) | A plain-language guide for the client to review the prototype |
| [child-session-protocol.md](./child-session-protocol.md) and [child-session-results.md](./child-session-results.md) | An optional, consent-first test with 4–6 year olds |
| [diagrams.md](./diagrams.md) | Architecture and flow diagrams (from spec 001) |
| `img/components/` | Component thumbnails, captured from the prototype |

## How to change something

```bash
cd tools/design
npm ci                      # first time only; then `npx playwright install chromium webkit`
# edit ../../docs/design/tokens.json
npm run check               # rebuild tokens.css + tables → contrast → token usage → flow tests
node capture-components.mjs # optional: refresh component thumbnails
```

**Rules:**

- Never edit `prototype/assets/tokens.css` or the generated block in `tokens.md` by hand.
- Prototype CSS may use only `var(--kc-*)`. `check-tokens-usage.mjs` fails on raw colours, sizes
  or radii, and on the old product name.
- New text and background pairings must be added to `tokens.json → pairs`, so their contrast is
  checked.

## Validation record

### Automated (2026-11-14)

| Check | Result |
|---|---|
| `build-tokens.mjs`: schema-valid, deterministic | ✅ 72 tokens; identical output on re-run |
| `check-contrast.mjs` (SC-003) | ✅ All 19 declared pairs meet WCAG AA (lowest is 4.14:1, for a large-only pair with a 3:1 minimum) |
| `check-tokens-usage.mjs` (SC-005, FR-024, FR-027) | ✅ Only `var(--kc-*)`; no old product name. A planted violation was caught. |
| `flow.spec.mjs`, Chromium + WebKit, 390 × 844 touch (SC-002, SC-004, SC-006, FR-012/013/016) | ✅ 4/4 passed. Every required screen is reached. There is exactly one main action at every step, no failure state, all targets ≥ 48 (4–6 main actions ≥ 64), and every element maps to one of the 25 components. The idle hint fires at 6.5 s. Save and Spend paths both work, and a replay gives 5 XP only. Region switching changes the coin art but never the counts, with no currency symbol in 4–6 amounts. No off-origin requests; the gate email and PIN are never stored. |
| Accessible names and alt text (T063) | ✅ Every control has a name, and every image has `alt` |
| Offline (V7) | ✅ Served over http, loaded once, then offline: still works, fonts included |
| Large screen (V9) | ✅ A centred 390 px phone frame at 1280 px width |
| Size (T062) | ✅ `prototype/` is **488 KB** in total (budget 3 MB): fonts 80 KB, art 264 KB |
| Speed (SC-010) | ✅ First load 110 ms; the slowest screen renders in 17 ms, both with 4× CPU throttling |

### Manual, on real devices (still to do before sending to the client)

| Scenario | Status |
|---|---|
| V1: first-time walkthrough in under 5 min on a phone (SC-001) | ☐ To run on an iPhone (Safari) and an Android phone (Chrome) |
| V3: drag-to-sort feel on a real touch screen | ☐ To check (drag is automated only through tap-tap) |
| V8: sound off, and speech voices on each phone | ☐ To check (voices differ by device) |
| V11: originality countersignature | ☐ The developer countersigns [design-references.md](./design-references.md) |
| V12: optional child session | ☐ Optional |
