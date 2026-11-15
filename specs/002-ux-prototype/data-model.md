# Data Model: KudiCubs UX Design System & Clickable Prototype

**Feature**: `002-ux-prototype` | **Date**: 2026-11-14 | **Plan**: [plan.md](./plan.md)

This feature has no database. Its "data" is the design system's structured content, plus the
prototype's mock data and state. These are the shapes, rules and relationships.

---

## 1. Design Token (`docs/design/tokens.json`)

The full contract is in [contracts/tokens.schema.json](./contracts/tokens.schema.json).

| Field | Rule |
|---|---|
| Path (key) | `{category}.{group}.{step}`, e.g. `color.gold.500`, `space.4`, `radius.pill`. Lower-case, dot-separated. |
| `$type` | `color` · `dimension` · `fontFamily` · `fontWeight` · `typography` · `shadow` · `duration` |
| `$value` | Colour as a 6-digit hex string. Dimension in `px` (= pt at 1×). Typography as an object `{ fontFamily, fontWeight, fontSize, lineHeight, letterSpacing }`. |
| `$description` | Required: when to use the token, and when not to |
| `version` (root) | semver; `0.x` before client sign-off, `1.0.0` at sign-off |
| `pairs` (root) | A list of `{ fg, bg, usage, minRatio }`: every text-or-icon on background combination the prototype uses. `minRatio` is 4.5 for normal text, 3.0 for large text (≥ 24 px regular or ≥ 18.66 px bold) and icons. |

**Required token groups**:

| Group | Contents |
|---|---|
| Colour | The palette in research D4, plus semantic aliases: `color.bg.app`, `color.text.primary`, `color.action.primary.bg/fg`, `color.feedback.positive`, `color.parent.bg`, `color.celebrate` |
| Typography | The scale in research D5 |
| Space | A 4-pt scale: `space.1 = 4` … `space.12 = 48`, plus `space.16 = 64` |
| Radius | `radius.sm = 8`, `radius.md = 16`, `radius.lg = 24`, `radius.xl = 32`, `radius.pill = 999` |
| Elevation | `elevation.1–3` as soft, warm-tinted shadows |
| Size | `size.touch.min = 48`, `size.touch.primary_4_6 = 64`, `size.button.height = 64`, `size.button.height_4_6 = 76`, `size.kudi.min = 96` |
| Motion | `motion.fast = 120ms`, `motion.base = 240ms`, `motion.celebrate = 1200ms` |

**Validation**:

- Every pair in `pairs` meets its `minRatio` (`check-contrast.mjs`, SC-003).
- No `color.*` token is named or described as an "error" colour for child screens
  (Constitution III).

## 2. Component (`docs/design/components.md`)

| Field | Rule |
|---|---|
| `name` | One of the 25 components in spec FR-004. The ids are kebab-case, e.g. `choice-card`. |
| `purpose` | One sentence |
| `states` | At least `default`; plus any of `pressed`, `disabled`, `selected`, `hint` (pulsing), `celebrate`, `gentle` (soft bounce), `locked` |
| `minTouch` | ≥ `size.touch.min`. 4–6 primary actions ≥ `size.touch.primary_4_6`. |
| `tokens` | The tokens it uses |
| `screens` | The prototype screen ids that use it (§5) |
| `bandNotes` | How it changes across 4–6 / 7–9 / 10–12 / 13–15 |

**Relationship**: Component **N:M** Prototype Screen. Every element on a screen maps to exactly
one component (SC-005).

## 3. Kudi Pose (`docs/design/kudi-the-cub.md`, `prototype/assets/art/kudi/*.svg`)

| Pose id | Used when | Expression and gesture |
|---|---|---|
| `welcome` | Welcome, "joined the Pride" | Big smile, paw waving |
| `explain` | Mission Intro, narrated prompts | Mouth open, paw out, palm up |
| `point` | Idle hint, "tap here" | Looking at and pointing toward the main action |
| `think` | Decision screens | Paw on chin, eyes up |
| `cheer` | Result (positive), Reward, Level Up | Jumping, both paws up |
| `gentle` | Wrong jar, sub-optimal outcome | Soft smile, head tilt, "let's try this one" |
| `idle` | Long idle or empty states | Curled, sleepy, tail curl |

**Rules**:

- Minimum rendered size is `size.kudi.min`.
- Kudi faces **toward** the main action.
- Only one Kudi per screen.
- **No "sad", "angry" or "disappointed" pose exists**, by design (FR-005, Constitution III).

## 4. Age-Band UI Rule (`docs/design/age-band-rules.md`)

There is one row per band. The values are **copied from spec 001's band rules (plan 001 R9)**,
and the design-specific settings are added here.

| Field | 4–6 | 7–9 | 10–12 | 13–15 |
|---|---|---|---|---|
| Text per prompt | icons + ≤ 3 words | short sentences | full sentences | full sentences |
| Choices per Decision screen | 2 | 2–3 | 2–3 | 2–3 |
| Primary button height | 76 | 64 | 64 | 56 |
| Body text | 20 | 20 | 18 | 18 |
| Failure screens | never (gentle variant) | allowed, plus Try Again | allowed, plus Try Again | allowed, plus Try Again |
| Timers | off | soft (≥ 45 s, never ends the round) | allowed | allowed |
| Numbers | count to 20 | +/− to 1,000 | %, ratios | %, interest, charts |
| Narration | every prompt, autoplay | every prompt, autoplay | every prompt, tap to play | every prompt, tap to play |
| First idle hint | 6 s | 8 s | 10 s | 12 s |
| Feedback style | celebrate effort, soft sounds | celebrate and explain | data and explain | data, trade-offs, humour |
| Kudi presence | every screen | most screens | intros and results | intros only (a "mentor" tone) |

## 5. Prototype Screen (registry in `prototype/assets/screens.js`)

The full contract is in [contracts/screen-flow.md](./contracts/screen-flow.md).

| Field | Rule |
|---|---|
| `id` | kebab-case, unique; also the route `#/{id}` |
| `title` | Reviewer-facing name |
| `audience` | `child` · `parent` · `reviewer` |
| `band` | `b4_6` for every child screen in this prototype |
| `primary` | Exactly one main action (label key and target), for child screens |
| `next` | Next screen id, or a branch map such as `{ save: "result-save", spend: "result-spend" }` |
| `narration` | The spoken line keys (one or more) |
| `components` | Component ids used (§2) |
| `notes` | Reviewer notes, shown only in the reviewer menu |

**The 13 required screens, plus their sub-screens** (FR-009):

```text
welcome → age-select → avatar → parent-gate (hold → maths → pin → region → email)
→ home → mission-intro → activity-find → activity-sort → activity-count
→ decision → result-save | result-spend → summary → reward → home
home ⇄ wallet,  home ⇄ progress   (via bottom navigation)
```

The parent gate's 5 steps are steps of **one** screen (`parent-gate`), so it counts as one of
the 13. The two result variants together count as the one "Result" screen.

## 6. Example Data Set (`prototype/assets/data/mock-data.js` → `window.KC.data`)

| Field | Example value | Rule |
|---|---|---|
| `child.nickname` | `"Ama"` | 2–16 characters (spec 001 data-model) |
| `child.avatarId` | `"cub-friend-2"` | One of the 4 avatars |
| `child.band` | `"b4_6"` | |
| `start.coins` | `120` | |
| `start.savings` | `40` | |
| `start.xp` | `360` | Chosen so the first Lost Coins run crosses into level 3 and the Level Up moment can be seen |
| `start.level` | `{ n: 2, nameKey: "level.market_helper" }` | |
| `levels` | 5 entries `{ n, nameKey, xpFrom }` | e.g. 0, 150, 400, 700, 1100 |
| `badges` | 8 entries `{ id, nameKey, icon, earned: bool }` | 3 earned at the start |
| `walletHistory` | 6 entries `{ kind, amount, category, labelKey, icon, daysAgo }` | Kinds and categories as in spec 001 `wallet_events` |
| `pillars` | `{ know: 0.3, understand: 0.2, decide: 0.1, invest: 0, share: 0.1 }` | 0–1 |
| `daily` | `{ titleKey, progress: 1, goal: 3, rewardCoins: 10 }` | |
| `lostCoins` | `{ hidden: 8, jars: 3, firstReward: { coins: 30, xp: 40, badge: "badge.hard_worker" }, perfectSortBonus: { coins: 10, xp: 10, badge: "badge.smart_sorter" }, replay: { xp: 5 } }` | Mirrors `contracts/examples/mc.lost_coins.json` from spec 001 |

**The data never includes** a real name, email, photo or location (FR-012). The email and PIN
typed into the parent gate are not added to `KC.data`.

## 7. Region Coin Set (`prototype/assets/data/regions.js` → `window.KC.regions`)

| Field | Rule |
|---|---|
| `code` | `gh` · `ng` · `uk`; the default is `gh` |
| `currency` | `{ iso, symbol, majorName, minorName }`, e.g. `{ "GHS", "GH₵", "cedi", "pesewa" }` |
| `denominations` | An array `{ id, kind: coin\|note, label, faceValueMinor, accent }` (research D7); at least 3 coins or small notes |
| `marketExamples` | `{ treat, drink, snack }`, each `{ labelKey, art }` |
| `voiceLang` | `en-GH` · `en-NG` · `en-GB` |

**Rule**: switching region changes **only** the presentation. Coin counts in `KC.state` stay
the same (FR-022, spec 001 FR-043).

**Coin display rule** (spec 001 region config, `coinDisplay`): in-game coins on 4–6 screens are
always the region's **coin picture plus a number** (`coin_icon_amount`), never a currency-symbol
price. The currency name and symbol appear only in labels and narration (for example "These are
Ghana cedis and pesewas").

## 8. Prototype State (`window.KC.state`, partly in `sessionStorage`)

| Field | Persisted? | Notes |
|---|---|---|
| `region` | session | Reviewer menu |
| `sound` | session | Reviewer menu and profile |
| `notes` | session | Reviewer "Show screen notes" toggle; kept across refresh so screen notes stay on during a review. No personal data. |
| `screen` | URL hash | Current route (`#/screen-id`), not stored in `sessionStorage` |
| `coins`, `savings`, `xp`, `badges` | memory | Start from `KC.data.start`; changed by the Lost Coins flow |
| `lostCoins.found`, `.sortedCorrectFirstTry`, `.choice`, `.completedOnce` | memory | `completedOnce` switches the next run to replay rewards (spec edge case) |
| `gate.step` | memory | Values are never kept |

**State transitions** of the Lost Coins run:

```text
intro → find(0..8) → sort(per coin: placed | bounced → hint after 2) → count(per jar)
      → decide(save | spend) → result → summary → reward(first | replay) → home
```

Reward rules:

- **First run**: `coins += found` at count. On save, `savings += found` and `coins -= found`. On
  spend, `coins -= found` and a sticker is added. Then `firstReward`, plus `perfectSortBonus`
  if earned.
- **Replay**: only `replay.xp`.
