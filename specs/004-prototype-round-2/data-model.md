# Data Model: Prototype Round 2

**Spec**: [spec.md](./spec.md) · **Research**: [research.md](./research.md) R4, R7, R8

All data is fictional game data on one device. Nothing is sent anywhere.

## 1. Saved progress (device storage, `localStorage["kudicubs.proto.progress"]`)

Schema: [contracts/saved-progress.schema.json](./contracts/saved-progress.schema.json)
(`schema: 1`).

| Field | Type | Rules |
|---|---|---|
| `schema` | integer | `1`. Any other value: discard and start fresh (FR-031). |
| `profile.nickname` | string \| null | One of `KC.data.nicknames`, or `null` until the child picks one; otherwise discard. **No free text** (FR-024, FR-028). |
| `profile.avatarId` | string | One of `KC.data.avatars`. |
| `profile.band` | string | `b4_6` (the only playable band). |
| `profile.region` | `gh` \| `ng` \| `uk` | The parent-gate choice; also mirrored in session prefs. |
| `profile.onboarded` | boolean | `true` after "Join the Pride". Returning players skip onboarding and the gate. |
| `events` | PlayEvent[] | Append-only, oldest first, at most 500 items. Over the cap, the oldest are **folded into summary events with the same totals** (coins, savings, XP, badges, pillars, "played before"), shown as one "Earlier" history row. |
| `sample` | boolean | `true` when the log came from "Load sample data". |

**Never present** (FR-028), and checked by the data test: an email or anything shaped like one,
PIN digits, maths answers, real names, or any key containing `email`, `pin`, `gate` or `answer`.

## 2. PlayEvent

| Field | Type | Notes |
|---|---|---|
| `t` | string | Kind (see table). |
| `n` | integer ≥ 0 | Coins (or XP for `xp`). |
| `date` | `YYYY-MM-DD` | The device's local date at the time of the event (for the daily challenge and history labels). |
| `run` | integer | The run number that caused it. `0` for sample data. |
| `mission` | string | `lost-coins` (or `sample`). |
| `badge` | string? | For `badge` events. |
| `label` | string | A string key for the history row (e.g. `history.found`). |

| `t` | Effect on derived state | History row | Chart category |
|---|---|---|---|
| `earn` | coins + n | yes | `missions` |
| `bonus` | coins + n | yes | `bonus` |
| `daily` | coins + n | yes | `daily` |
| `save` | coins − n, savings + n | yes | `savings` |
| `spend` | coins − n, item + 1 | yes | `treats` |
| `xp` | xp + n | no | — |
| `badge` | badge added (once) | no | — |
| `pillar` | pillar[p] + n/100 (capped at 1) | no | — |
| `mission_done` | daily progress + 1 (if `date` is today) | no | — |
| `mission_replay` | daily progress + 1 (if `date` is today) | no | — |

## 3. Derivation rules, `KC.derive(events, today)` (FR-023, FR-025, FR-026, FR-033)

- **Fresh start** (empty log): coins 0, savings 0, XP 0, level 1 (`level.market_visitor`), no
  badges, empty history, all pillars 0, daily progress 0 (FR-023).
- **Level**: the highest `KC.data.levels[n]` with `xpFrom ≤ xp`.
- **History**: the money events, newest first. The label shows "Today", "Yesterday" or "N days
  ago" from `date`.
- **Chart**: totals per category from the money events only.
- **Daily**: `progress` = the number of `mission_done` and `mission_replay` events dated today,
  capped at `goal`, which is 3. When a run takes progress to `goal`, one `daily` event of
  `rewardCoins` (10) is added, once per date.

### The Lost Coins run, events in order

| When | First completion | Replay |
|---|---|---|
| **Result** (child chose save or spend) | `earn` n = coins found (8, `history.found`); then `save` 8 *or* `spend` 8 (`history.sticker`) | nothing |
| (changing the choice before Summary) | the run's `save`/`spend` event is replaced, never duplicated (003 rule) | — |
| **First coins ever** | `badge` `badge.first_coins` (with the first `earn`) | — |
| **Reward** | `earn` 30 (`history.lost_coins`), `xp` 40, `badge` `badge.hard_worker`, `pillar` know +20 and understand +15, `mission_done` | `xp` 5, `mission_replay` |
| **Perfect sort** (first completion only) | `bonus` 10 (`history.lost_coins_bonus`), `xp` 10, `badge` `badge.smart_sorter` | — |
| **Daily goal reached** | `daily` 10 (once per day) | same: the daily challenge pays it, not the mission (FR-033 clarification) |

**Fresh run, save, perfect sort**: coins 40, savings 8, XP 50, level 1, 3 badges, 4 history
rows. This is the expected value in the data test (FR-047).
**Replay**: coins and history unchanged, XP + 5 (FR-033).

## 4. Visit state (memory only, never saved)

| Field | Meaning |
|---|---|
| `run.active` | A mission run started from the intro in this visit. |
| `run.reached` | The furthest mission screen this run has reached (used by the navigation guard). |
| `run.pendingReward` | Set when Summary is answered; consumed by Reward. Without it, Reward redirects to Home and grants nothing (FR-005). |
| `gate.*` | Hold, maths, PIN and confirm-PIN entries, and the email. Kept in local variables, cleared when the gate is left, **never written** (FR-011, FR-028). |

A refresh clears the visit state, so an unfinished run is not resumed.

## 5. Sample data set (`KC.sample.events`)

A fixed log with `run: 0` and `mission: 'sample'`, built from the 002/003 mock values: coins 120,
savings 40, XP 360 (level 2), badges first_coins, kind_friend and early_bird, six history rows
over the last four days, and pillars know 30, understand 20, decide 10 and share 10. Dates are
relative to today when loaded. "Load sample data" replaces the log (`sample: true`) and keeps the
profile; "Restart" clears both.

## 6. Narration line status (extends 003 audio manifest)

Per `lang` and `lineId`:

| Field | Values |
|---|---|
| `status` | `recorded` (human file in `audio/<lang>/`), `scratch` (only a file in `audio-scratch/<lang>/`), `pending` (neither) |
| `file` | the recorded file if any, else the scratch file, else `null` |
| `scratchFile` | the scratch file when one exists, even if a recording exists |
| `counts[lang]` | `{ recorded, scratch, pending }`, generated |

**Playback order**: recorded, then scratch, then the caption (FR-014). **Badge**: shown only with
notes on (FR-019).

## 7. Build information

`KC.build = { version: '0.3.0', builtAt: 'YYYY-MM-DD' | 'local', commit: 'abc1234' | null }`,
shown in the reviewer menu (FR-037).

## 8. Empty states (FR-030)

| Screen | Condition | Shown instead |
|---|---|---|
| Home | 0 coins and no events | Kudi `wave`: "Let's find some coins!", with The Lost Coins as the main action |
| Wallet | no money events | Kudi bubble "Play The Lost Coins to fill your jar!" and a Play button; no chart and no history list |
| Progress | no badges | Badge row with locked silhouettes and "Play to earn your first badge!"; pillars hidden until the first gain |
| Daily | progress 0 today | "Play a game to light the first sun!" (dots hollow) |

New spoken lines get IDs in `lines.json` (for example `empty.home`, `empty.wallet`,
`empty.progress`, `empty.daily`, `gate.pin_confirm`, `gate.pin_mismatch`).
