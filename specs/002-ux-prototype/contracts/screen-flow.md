# Contract: Prototype Screens, Routes and Test Hooks

This is the contract between the prototype (`prototype/`), the documents (`docs/design/`) and the
verification tools (`tools/design/`). The screen registry in `prototype/assets/screens.js` must
match this table.

## 1. Routes

The prototype uses hash routing: `index.html#/{screen-id}`. The optional query flag `?review=1`
opens the reviewer menu.

| # | Screen id | Audience | Main action (`data-primary`) | Next | Spec |
|---|---|---|---|---|---|
| 1 | `welcome` | child | "Let's Go" (gold, 76 px) | `age-select` | FR-009, US1-1 |
| 2 | `age-select` | child | Selecting a band card (4–6 active; 7–9, 10–12, 13–15 shown "Coming soon", not selectable) | `avatar` | spec 001 FR-015b |
| 3 | `avatar` | child | "That's me!" after choosing 1 of 4 avatars and a nickname chip | `parent-gate` | FR-009 |
| 4 | `parent-gate` | parent | Step-specific: hold 3 s → answer the multiplication on a number pad → 4-digit PIN → region → email → "Join the Pride" | `home` | FR-017 |
| 5 | `home` | child | "Continue" | `mission-intro` | FR-018 |
| 6 | `mission-intro` | child | "Start" | `activity-find` | FR-010 |
| 7a | `activity-find` | child | Tap the hidden coins (the screen finishes when all 8 are found) → "Next" | `activity-sort` | FR-011 |
| 7b | `activity-sort` | child | Drag or tap-tap coins into jars → "Next" | `activity-count` | FR-011 |
| 7c | `activity-count` | child | Tap to count each jar → "Next" | `decision` | FR-011 |
| 8 | `decision` | child | `data-primary-group`: the two choice cards "Save it" and "Spend it" (equally prominent); after a card is chosen, a single `data-primary` "OK" | `result-save` / `result-spend` | FR-010 |
| 9 | `result-save` · `result-spend` | child | "Next" | `summary` | FR-010, US1-4 |
| 10 | `summary` | child | "Next" | `reward` | FR-016 |
| 11 | `reward` | child | "Back to Home" | `home` | FR-019 |
| 12 | `wallet` | child | (bottom navigation) — main action: "Back to Home" | `home` | FR-020 |
| 13 | `progress` | child | (bottom navigation) — main action: "Continue" (goes to the next mission card) | `home` | FR-020 |

**Bottom navigation**: shown on `home`, `wallet` and `progress` only. It has three icon tabs:
**Home**, **Wallet** (jar icon) and **Progress** (path icon). Each tab has a narrated label.

**Back control**: every screen except `welcome` has a back arrow in the top-left corner. It is
not the main action and is styled smaller.

**Dead ends**: none allowed on child screens. Any element that isn't wired up shows the
reviewer note "Not in this prototype" only when the reviewer menu is enabled. Otherwise it does
nothing (spec edge case).

## 2. Reviewer menu

- **Open**: a 2-second long-press on the KudiCubs logo, or `?review=1`.
- **Close**: tap ✕.
- **Controls**:
  - Region: Ghana · Nigeria · UK (default Ghana)
  - Sound: on/off
  - Jump to: a list of every screen id above
  - Show screen notes: on/off
  - Restart prototype: resets `KC.state` to `KC.data.start`
  - Version: `prototype 0.1.0 · tokens 0.1.0`
- The menu uses `data-reviewer` on its root and is **never** marked `data-primary`.

## 3. DOM test hooks (used by `tools/design/tests/flow.spec.mjs`)

| Attribute | Placed on | Meaning |
|---|---|---|
| `data-screen="{id}"` | The root element of the active screen | The current screen |
| `data-audience="child\|parent\|reviewer"` | The screen root | Which rules apply |
| `data-band="b4_6"` | Child screen roots | Band rules |
| `data-primary` | At most one visible element per child screen | The dominant main button (FR-013) |
| `data-primary-group` | The container of a group of equal choices or activity targets, used **instead of** `data-primary` while a choice or activity is in progress | The dominant main action on choice and activity screens (FR-013) |
| `data-region="{gh\|ng\|uk}"` | Every `[data-money]` element and every coin or note image | Which region's art is shown (SC-006) |
| `data-narration="{key}"` | The speaker cue | Has a narration line (FR-015) |
| `data-money` | Any element showing currency | Checked by the region-switch test (SC-006) |
| `data-component="{component-id}"` | Every component instance | Traceability (SC-005) |
| `data-failure` | **Must never appear** under `data-band="b4_6"` | Negative assertion (FR-016) |
| `data-hint-active` | Added to the screen root when an idle hint fires | Idle-hint test (FR-013) |

## 4. Verification assertions (normative)

`flow.spec.mjs` runs at a 390 × 844 viewport with `hasTouch: true`.

1. Starting at `#/welcome` and tapping only `[data-primary]` (plus the required choices on
   `age-select`, `avatar`, the gate steps, the activities and `decision`), it reaches `reward`,
   then `home`, `wallet` and `progress`. All 13 screens are visited (SC-002).
2. At every step of every child screen, `count([data-primary]:visible) + count([data-primary-group]:visible) === 1`.
   So exactly one main action is shown at a time: a button, or a group of choices or targets.
3. No `[data-failure]` exists anywhere during the run.
4. Every `[data-primary]`, `button`, `[role=button]` and `[data-component=choice-card]` has a
   bounding box ≥ 48 × 48. Child primaries are ≥ 64 × 64 (SC-004).
5. After 6.5 s idle on `home`, the screen root has `data-hint-active` (FR-013).
6. For each region in `gh`, `ng` and `uk`: every `[data-money]` and every coin image has
   `data-region` equal to that region, 4–6 screens show **no** currency symbol inside
   `[data-money]` (coin picture plus number only), the reviewer-visible currency label names the
   region's currency,
   and the coin counts are unchanged (SC-006).
7. No request leaves the page's own origin during the run (FR-012).
8. The Save path and the Spend path both reach `reward`. A second run gives only replay XP.
9. No visible text in the prototype matches `/bizkid/i` (FR-027).

The test sorts coins with the **tap-coin-then-tap-jar** path, because touch drags are unreliable
under automation. Dragging is checked by hand (quickstart V3).
