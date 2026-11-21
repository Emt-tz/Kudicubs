# Design References & Originality Record

KudiCubs studied three products **for interaction patterns only**. No assets, mascots, colours,
layouts, fonts or sounds were copied (spec 002 FR-007, FR-025, FR-026; research D13).

## What we learned, and how KudiCubs differs

| Reference | Pattern adopted | How KudiCubs differs |
|---|---|---|
| **Duolingo** | A winding level path; a daily indicator; one big single-action button per screen; celebration moments at the end of a lesson | The guide is the client's **lion cub**, not an owl. The palette is the client's **Sunshine Yellow, Mane Brown and orange** brand, with **no lime green**. The level path is drawn as a **market road with stalls**. The daily indicator is a **"market day" sun** with **no loss or "streak lost" messaging** for 4–6. Buttons are Sunshine Yellow with a Mane Brown label and outline. |
| **Khan Academy Kids** | Narration first; a character guides every step; icon-based navigation for pre-readers | **One** guide (Kudi), not a cast of characters. The scenes are **African market** settings (stalls, baobab, woven patterns). The bottom navigation uses **coin-jar and path** icons. Every prompt has a visible speaker cue that replays it. |
| **Toca Boca** | Free-feeling, gentle, no-failure play; big tactile objects to touch and move | KudiCubs is **goal-driven**: each mission is a learning loop with a decision and an outcome (Constitution II). The tactile objects are **localised coins and jars**. Feedback is a soft bounce and Kudi's encouragement, never a "wrong" state. |

## Brand elements that are KudiCubs' own

These come from the client's brand guide (round 1, [brand.md](./brand.md)):

- **Kudi the Cub**: the client's lion cub in a navy explorer vest, with an orange neckerchief and a
  gold "K" coin. Five supplied poses are used as supplied.
- **The logo**: the cub holding the "K" coin, the "Kudicub's" wordmark, and **"Play. Earn.
  Roar!"**. Three approved versions.
- **The palette**: Sunshine Yellow, Mane Brown, Adventure Orange and Golden Orange; Soft Gold,
  Peach Cream, Warm Cream, White and Charcoal.
- **"Join the Pride"**: the welcome promise.
- **Localised coins**: stylised tokens for Ghana, Nigeria and the UK (placeholder art, not
  replicas of real money).
- **Type**: Baloo 2 and Nunito (OFL) for the UI, proposed. Sobas Play and Skia appear only inside
  the logo.

## Originality review record (SC-007)

| Field | Entry |
|---|---|
| Date | 2026-11-14 (round 0); re-checked 2026-11-15 for round 1 (official brand) |
| Reviewer | Design pass during `/speckit-implement` (developer to countersign before the client review) |
| Method | Each prototype screen was compared side by side with public screenshots and store listings of the three reference products, viewed privately. **No screenshots of other apps are committed to this repository.** |
| Mascot | ✅ The client's own lion cub (brand guide), different in species, silhouette, colours and outfit from all three references' characters. Round 1 uses only the five supplied poses. |
| Palette | ✅ The client's brand palette (yellow, Mane Brown, orange); no bright lime primary, no pastel-first or neon-block palette. |
| Layouts | ✅ Original. A phone column with a Kudi bubble, a single gold main button, a market-road level path, and jar-based sorting. Shared patterns (a path, one main button) are generic interaction patterns, applied in our own layout. |
| Icons | ✅ Original. Hand-built SVG in one stroke style. |
| Sounds | ✅ None copied. Round 1: narration is **human recordings only** (pending; captions until then), with no synthetic voice. Sound effects are **original tones generated in the page** (no sound files, no speech). The tone reference video in the voice brief is for tone only and is never copied or cloned. |
| Fonts | ✅ OFL-licensed Baloo 2 and Nunito, not used by the references as their brand fonts. |
| Result | **0 copied assets, mascots, colours or layouts found.** |

> **Former name note**: the source documents call the product "BizKids" or "BizKidz"; the
> product name is now **KudiCubs** everywhere (spec 001 FR-001).


---

## Round 3 (spec 005): gallery references for the website, dashboards and parent area

The machine-checked source is [references.json](./references.json) (`node tools/design/check-references.mjs`).
Screens cite their references in their manifest `refs`. Public Dribbble listings were found by search and
read as titles, tags and descriptions only. **No shot was downloaded and no image is stored in this repository.**

| Ref | Source | Pattern learned | Used for | How KudiCubs differs | Verdict |
|---|---|---|---|---|---|
| REF-01 | [Youth Finance, kids' banking dashboard](https://dribbble.com/shots/24144047-Youth-Finance-Personalized-Dashboard-for-a-Kids-Banking-App) | A personal money card with the child's goals | nothing | Real banking; KudiCubs has no real money (Constitution V) | **Rejected** |
| REF-02 | [Kids Education Report Card Dashboard](https://dribbble.com/shots/6981829-Kids-Education-Report-Card-Dashboard) | A single report-card style view of one child for a parent | Parent Dashboard: child, skills | Skills grow; no grades or ranking; own brand | Adapted |
| REF-03 | [MindHero learning app](https://dribbble.com/shots/21426214-MindHero-The-Learning-App-for-Kids-with-Learning-Difficulties) | A clear switch from the learner's view to a parent view | App: profile, parent area | A gate and PIN sit between the views | Adapted |
| REF-04 | [Parents Dashboard iOS App](https://dribbble.com/shots/3918005-Parents-Dashboard-iOS-App) | Children listed first, then one child's progress | App: parent child view | Original layout and icons; region coins per child | Adapted |
| REF-05 | [Kids learning website landing page](https://dribbble.com/shots/21029859-Kids-learning-website-landing-page) | A bright, scannable page that speaks to parents | Website home | Client logo and Kudi, one action, no timers | Adapted |
| REF-06 | [Landing Page for Parents on Brainly](https://dribbble.com/shots/14608306-Landing-Page-for-Parents-on-Brainly) | A page that explains how the product helps parents | Website how-it-works, safety | Plain-words missions and a dedicated safety page | Adapted |
| REF-07 | [Kids app landing page](https://dribbble.com/shots/2636208-Kids-app-Landing-page) | A single flow that ends with the download route | Website get-the-app | A page of its own with Android, iOS and a desktop "send the link" action | Adapted |

**Rejected on principle** (no specific shot needed): streak-shaming, countdown timers and urgency prompts,
loot-box style rewards, real-money or card imagery, and anything that asks a child for personal details.

### Originality review record, round 3 (SC-006)

| Field | Entry |
|---|---|
| Date | 2026-11-20 |
| Reviewer | Claude Code design pass. **The developer should open each linked shot once and countersign before the client review.** |
| Method | The listings above were found by search and read as text. Screens were designed from the pattern in words, then compared with the listing text for mascot, palette and layout. |
| Mascot | ✅ Only the client's Kudi, in the supplied poses |
| Palette | ✅ Only the brand and derived tokens (`check-tokens-usage`, `check-contrast`) |
| Layouts | ✅ Original; shared ideas (a children list, a report-style view, a download page) are generic patterns |
| Limit | The shots' images were not viewed by the tooling used here, so a visual side-by-side is still the developer's step |
| Countersigned | ☐ pending |
