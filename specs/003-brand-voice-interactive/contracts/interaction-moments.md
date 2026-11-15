# Contract: Interaction Moments, Kudi Reactions & Sound Effects (1.0.0)

This extends [002 contracts/screen-flow.md](../../002-ux-prototype/contracts/screen-flow.md). The
routes, `data-primary`, `data-primary-group` and the other DOM hooks there stay in force.

## 1. New DOM hooks

| Attribute | Placed on | Meaning |
|---|---|---|
| `data-child-action="<kind>"` | Every child tap or drag target that isn't "Next". Kinds: `hear`, `answer`, `drag`, `tap`, `find`, `count`. | A child action (FR-022, FR-023). **Never navigates. Never `data-primary`.** |
| `data-say="<lineId>"` | Any item, coin, picture or word that speaks its name when tapped | Tap-to-hear (FR-026) |
| `data-kudi-pose="<pose>"` | The Kudi `<img>` | The current pose: `wave` · `celebrate` · `fist` · `thumbs-up` · `headphones` |
| `data-caption-state` | The `narration-caption` root | `playing` · `pending` · `hidden` |
| `data-replay` | The header replay button (`replay-button` component) | Replays the last line on this screen (FR-029) |
| `data-sfx-log` | `document.body` (tests only) | The list of sound-effect IDs played, read by the flow test |

## 2. Kudi reactions (`KC.kudiReact(state)`, FR-025)

| Trigger | Pose | Sound effect | Line kind |
|---|---|---|---|
| A screen with a greeting opens; welcome-back after a long idle | `wave` | — | prompt or hint |
| A correct action (coin in the right jar, right answer, coin found) | `thumbs-up` | `chime` (sort) · `pop` (find) · `tick` (count) | reaction (optional, short) |
| A step completes (all found, all sorted, all counted, Reward) | `celebrate` | `sparkle` | reaction |
| A mistake (wrong jar), or encouragement during an idle hint | `fist` | `boop` (soft, low) | `sort.try_again` or hint |
| Any line is playing | `headphones` | — | (any) |

**Pose order** (resolves `/speckit-analyze` U1): when an action both reacts and plays a line,
Kudi shows:

1. the **reaction pose** for about 0.6 s;
2. then **`headphones`** while the line plays (US2-1);
3. then the screen's **base pose** when the line ends, or fails and falls back to the caption.

If an action has no line, the reaction pose holds for 1.2 s, then Kudi returns to the base pose.
Tap-to-hear actions (`hear`) skip step 1 and go straight to `headphones`.

## 3. Sound effects (`KC.sfx(id)`, research R8): generated tones, never speech

| ID | Recipe (Web Audio) | Used for |
|---|---|---|
| `pop` | sine at 880 Hz, falling to 440 Hz over 120 ms | A coin found |
| `chime` | two triangle notes, C6 then E6, 90 ms each | A coin lands in the right jar |
| `tick` | square at 1.2 kHz, 30 ms, quiet | Each counted coin |
| `boop` | sine at 220 Hz, falling to 180 Hz over 200 ms, soft | Try again (never a buzzer) |
| `sparkle` | four rising sine notes (C6–E6–G6–C7), 70 ms each | A step completes, a celebration |
| `tap` | sine at 660 Hz, 40 ms, very quiet | Tap-to-hear feedback |

## 4. Per-screen moments (The Lost Coins and its frame)

**Every screen keeps one main action** (`data-primary` or `data-primary-group`), **plus** at
least the child actions listed here. All child actions are enabled at render. They are never
locked behind narration (FR-022).

| Screen | Base pose | Child actions (`data-child-action`) | Call and response (FR-027) | Main action |
|---|---|---|---|---|
| `welcome` | `wave` | Tap Kudi to hear "Hello!" (`hear`); tap the logo coin to hear "Join the Pride!" (`hear`) | — | Let's Go |
| `age-select` | `wave` | Tap each age card to hear it (`hear`) | Kudi: "How old are you?" The card is the answer. | (the group) → Next |
| `avatar` | `wave` | Tap each friend to hear "Hello, I'm …!" (`hear`); tap a name chip to hear the name (`hear`) | — | (the group) → That's me! |
| `home` | `wave` | Tap the coin counter: "You have N coins" (`hear`); tap a badge to hear its name (`hear`); tap the daily sun (`hear`) | — | Continue |
| `mission-intro` | `wave` | Tap the stall picture to hear "The market!" (`hear`) | **Kudi: "Can you help me find them?" The child taps the 👍 answer** (`answer`). The answer reveals Start, so Start is the only main action after the answer. | (answer) → Start |
| `activity-find` | `wave` | Tap each coin: it is found, and **speaks its name** ("Fifty pesewas!") (`find` + `data-say`) | — | (the scene group) → Next |
| `activity-sort` | `wave` | **Drag** each coin into a jar (`drag`). The jar's **count badge rises by one per coin**. Tap a coin to hear it (`hear`). | — | (the tray group) → Next |
| `activity-count` | `wave` | Tap each coin to count it, with a spoken number (`count`) | **After counting: "Which jar has the most coins?" The child taps a jar** (`answer`). Any jar gets a kind reaction; the right one gets `thumbs-up` and `sparkle`. | (the jar group) → (answer) → Next |
| `decision` | `wave` | Tap each card to hear it (`hear`) | Kudi: "Save them, or spend them?" The choice card is the answer. | (the group) → OK |
| `result-save` · `result-spend` | `celebrate` | **Tap the jar to drop in the last coin** (save), or **tap the sticker to stick it on** (spend) (`tap`). Tap the amount to hear it (`hear`). | — | Next |
| `summary` | `celebrate` | Tap each recap tile to hear it (`hear`) | **Kudi: "What did you do with your coins?" The child taps the save or spend picture** (`answer`). Either matching answer gets `thumbs-up`. | Next |
| `reward` | `celebrate` | Tap each badge to hear its name (`hear`); **tap the coin burst to pop it** (`tap`) | — | Back to Home |
| `wallet` | `wave` | Tap a bar to hear "Games: N coins" (`hear`); tap a history line (`hear`) | — | Back to Home |
| `progress` | `wave` | Tap a level node to hear its name (`hear`); tap a badge (`hear`); tap a pillar (`hear`) | — | Continue |
| `parent-gate` | — (grown-up screen) | unchanged | — | (steps) |

## 5. Replay button

The header right slot, which was a spacer in 002, now holds `[data-replay]`. It's a 48 px round
Adventure Orange button with a Mane Brown outline and a Mane Brown replay icon, on **every
screen**. It replays `KC.voice.last` for that screen. Before any line has played on the screen,
it plays the screen's first prompt (FR-029).

## 6. Verification (extends 002 §4)

1. On every Lost Coins screen there is at least one enabled `[data-child-action]` immediately
   after render (FR-023, SC-004, FR-022).
2. Tapping each `[data-child-action]` does all of these:
   - changes `data-kudi-pose`, or plays a line (shown by `data-caption-state` becoming `playing`
     or `pending`);
   - logs a sound effect (`data-sfx-log`) or a line;
   - never changes `data-screen` (SC-006).
3. Dragging a coin onto its jar makes that jar's count badge go up by exactly 1. A wrong jar
   leaves it unchanged, shows `fist`, and logs `boop`. There is no `[data-failure]`.
4. `window.speechSynthesis.speak` is never called. It is stubbed to count calls, and the count
   must stay 0 (SC-003).
5. Every screen has a visible `[data-replay]`. Clicking it re-shows the last caption, or replays
   the line.
6. With no recordings, every line shows `data-caption-state="pending"` and the "Recording
   pending" badge. With 3 sample files dropped in and the manifest rebuilt, those 3 lines report
   `playing`, with no code change (SC-008).
