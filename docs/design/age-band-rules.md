# Per-Age-Band UI Rules

All four bands share **the same structure**, and complexity rises from band to band
(Constitution IV).

- The values below **match spec 001**: FR-028–FR-031, and the engine band rules in
  [plan 001 research R9](../../specs/001-kudicubs-mvp/research.md) and
  [band-rules.schema.json](../../specs/001-kudicubs-mvp/contracts/band-rules.schema.json).
- The design-only settings (sizes, feedback style, Kudi's presence) are added here.
- If this page ever disagrees with spec 001, spec 001 wins and this page must be updated.

## The table

| Setting | 4–6 · Money & Choices | 7–9 · Build & Grow | 10–12 · Founder Mode | 13–15 · Side Hustle |
|---|---|---|---|---|
| Text per prompt | Icons + **≤ 3 words** | Short sentences | Full sentences | Full sentences |
| Reading needed? | **No**: fully playable without reading | A little | Yes | Yes |
| Choices per Decision screen | **2** | 2–3 | 2–3 | 2–3 |
| Main button height | 76 | 64 | 64 | 56 |
| Body text | 20 | 20 | 18 | 18 |
| Failure screens | **Never**; the gentle variant is used instead | Allowed, with Try Again | Allowed, with Try Again | Allowed, with Try Again |
| Try Again | n/a (nothing fails) | **Always**, keeps rewards | **Always**, keeps rewards | **Always**, keeps rewards |
| Timers | **Off** | Soft (≥ 45 s, never ends the round) | Allowed | Allowed |
| Numbers | Count to 20 | +/− up to 1,000 | %, ratios | %, interest, charts |
| Money display | Coin pictures + numbers only | Coin pictures + numbers, currency words in labels | Simplified real terms (equity, debt, cash flow) | Realistic terms, simple charts |
| Narration | Every prompt, **plays automatically** | Every prompt, plays automatically | Every prompt, tap to play | Every prompt, tap to play |
| First idle hint | 6 s (then 12 s, 20 s) | 8 s | 10 s | 12 s |
| Feedback style | Celebrate effort; soft sounds; big visuals | Celebrate, then explain cause and effect | Data plus explanation; several valid strategies | Data, trade-offs, humour, trends |
| Kudi presence | Every screen | Most screens | Intros and results | Intros only (mentor tone) |
| Competition | None | Computer rivals only, light | Computer rivals, market share | Computer rivals and tournaments (no real players) |

## One screen, four bands: the Decision screen

The same screen type (Decision: a scenario, a question, 2–3 choice cards) at rising complexity:

| Band | What the child sees |
|---|---|
| **4–6** (in the prototype) | Kudi in `think`: "Save them, or spend them?" (spoken). Two big picture cards, 🫙 *Save it* and ⭐ *Spend it*. Picking one shows a single **OK**. Both outcomes are happy. |
| **7–9** | "Your stand has 50 coins. What price for a cup?" Three cards: *5 coins*, *10 coins*, *20 coins*, each with a small customer-mood icon. A soft 60-second timer ring may run, but never ends the round. |
| **10–12** | "You need 2,000 coins to grow. How will you raise it?" Cards: *Bank loan (pay back + 10%)*, *Investor (gives 20% of your company)*. Each card has a tiny "what this means" line. |
| **13–15** | A "Temptation Alert": "Limited sneakers drop — 300 coins. Your savings goal: 800." Cards: *Buy now*, *Keep saving*, *Sell an old pair first*. The result shows the effect on the goal timeline. |

## Tablets

Tablets are described here but not prototyped:

- Keep the **phone column centred**, up to 600 px wide, so the main action stays in the same
  place.
- Put scenes and illustrations at the sides.
- Choice cards may sit side by side, but there are **never more than 3**.
- Touch targets stay the same size, and text is one step larger (body 22).
- The parent area may use a two-pane layout (list on the left, detail on the right).

## Five sample situations

Each is worked from these rules and [kudi-the-cub.md](./kudi-the-cub.md) alone.

| # | Situation | What Kudi does | What the screen shows |
|---|---|---|---|
| 1 | **A 4–6 child drops a coin in the wrong jar** | Switches to `gentle` (head tilt): "Hmm, let's find this coin a different jar!" (spoken) | The coin bounces softly back to the tray. **No red, no X, no buzzer.** After 2 tries with that coin, the right jar glows teal. *(Prototype: `activity-sort`.)* |
| 2 | **A 4–6 child is idle for 15 s on Decision** | At 6 s switches to `point`; at 12 s repeats "Save them, or spend them?" | At 6 s both choice cards (the main action group) get a pulsing teal ring; at 12 s the prompt is spoken again; at 20 s a stronger pulse. *(Prototype: idle hint on `decision`.)* |
| 3 | **A 7–9 round ends at a loss** (lemonade priced too high) | `gentle` then `explain`: "Fewer people bought at 20 coins. Want to try a lower price?" | The Round Summary shows revenue, costs and a small loss in plain numbers with a calm look (no red). **Try Again** and **Next** appear, with Try Again first. Rewards already earned are kept. |
| 4 | **A 10–12 child chooses between equity and debt** | `think`, then a one-line hint after 10 s idle | Two or three cards with simplified real terms and a "what this means" line each; numbers to percentages. Either choice continues, and the result shows the trade-off. |
| 5 | **A 13–15 "Temptation Alert" appears** | Not on the alert itself (intros only); a short mentor line on the result | A pop-up card with the item, its price and the savings goal, with three equal choices. The result shows the effect on the goal timeline, with a light touch of humour. No pressure wording ("Hurry!"). |


## Adult surfaces (spec 005)

The website, Parent Dashboard, Team Console and hub are for adults and have no age-band behaviour of their
own. They show each child at the child's own band and region. They are **calmer and denser** than the child
screens: body text is 0.9× the child scale (`--kc-adult-type-scale`), targets are at least 44 px, and text may
be longer. They still use only the brand tokens, never show a failure or a score to a child, and are never
linked from a child screen without the parent gate.
