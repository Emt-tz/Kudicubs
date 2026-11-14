# Research & Decisions: KudiCubs UX Design System & Clickable Prototype

**Feature**: `002-ux-prototype` | **Date**: 2026-11-14 | **Plan**: [plan.md](./plan.md)

Each decision gives what was chosen, why, what was rejected, and what it serves.
Items marked **⚠ Flag** need attention or a confirmation.

---

## D1. How the prototype is built: plain HTML, CSS and JavaScript, with no build step

- **Decision**:
  - The prototype is a static folder, `prototype/`.
  - It is made of one `index.html`, plain CSS files, and **classic `<script>` files** (not ES
    modules).
  - Navigation is hash-based (`#/welcome`, `#/home`, …).
  - Mock data and region data are JavaScript files that set `window.KC.*`, not JSON fetched at
    runtime.
  - There are no frameworks and no bundler.
- **Rationale**:
  - **It works opened straight from disk** (`file://`), from a zip, or from any static host,
    with no tooling. That covers both FR-023 (offline) and a non-technical reviewer (FR-028).
  - ES modules and `fetch()` of local JSON are blocked by browsers on `file://`. Classic scripts
    with data in JS files are not.
  - The prototype is throwaway (spec Assumptions). Picking a framework would wrongly suggest it
    is the start of the app.
- **Rejected**:
  - **Figma prototype**: the client would need a Figma account or link, sound and drag
    interactions are weak, and the tokens wouldn't be executable.
  - **React/Vite single-page app**: needs a build, and a bundle on `file://` is unreliable.
  - **Flutter web**: this would be app code, which the spec rules out, and the first load is
    heavy.

## D2. Sharing with the client: a static link, with the zip as a fallback

- **Decision**:
  - **Primary**: deploy `prototype/` to **Cloudflare Pages** (free plan) with
    `npx wrangler pages deploy prototype --project-name kudicubs-prototype`. Jefferson gets an
    **unlisted** `*.pages.dev` link that he opens on his phone.
  - **Fallback**: `prototype-vX.Y.Z.zip`, to open on a laptop, where double-clicking
    `index.html` works.
  - A service worker caches the prototype after the first visit to the link. Jefferson can then
    demo it offline, and add it to his home screen.
- **Rationale**:
  - A link is the only way a non-technical client can reliably open an interactive HTML
    prototype on a phone. iOS and Android don't run local HTML files from WhatsApp or the Files
    app properly.
  - GitHub Pages isn't a good fit here:
    - Pages for a private repo needs a paid GitHub plan.
    - On non-Enterprise plans the published site is public anyway, so it gives no privacy
      advantage over an unlisted link.
- **Rejected**:
  - **GitHub Pages**: see above.
  - **Netlify Drop or Vercel**: equivalent options, kept as alternatives. Cloudflare was chosen
    for its free unlimited bandwidth and simple CLI deploy.
  - **Zip only**: doesn't work well on phones.
- **⚠ Flag P1**: an unlisted link is **reachable by anyone who has the URL**. The prototype holds
  only made-up data and placeholder art. Even so, **deploying is an outward-facing step that
  needs your explicit go-ahead, and a Cloudflare login by you.** It's a separate implementation
  task (T-deploy), not automatic. If the client wants access control, Cloudflare Access (free for
  small teams) can restrict the link to Jefferson's email.

## D3. Design tokens: one source file, generated into CSS and documentation

- **Decision**:
  - `docs/design/tokens.json` is the **source of truth**. It uses the W3C design-tokens
    community-group shape: `$value`, `$type`, `$description`.
  - A small Node script, `tools/design/build-tokens.mjs`, generates:
    - `prototype/assets/tokens.css`: CSS custom properties.
    - The token tables inside `docs/design/tokens.md`, between marker comments.
  - Tokens are versioned with semver (constitution).
- **Rationale**:
  - Values can't drift between the documents and the prototype (FR-024, SC-005).
  - The same JSON will later generate the Flutter `ThemeData` for spec 001, so the client's
    approval carries into the app (User Story 2).
  - The prototype itself still has no build step. Only token changes need the script.
- **Rejected**:
  - **Hand-maintained CSS plus a markdown table**: they will drift apart.
  - **Style Dictionary**: a heavier dependency than about 80 lines of script.
  - **Tokens only in Figma**: there is no Figma in this workflow.

## D4. Brand palette: original warm African-market colours, all contrast-checked

- **Decision**: draft core palette. The final values are set in `tokens.json` and verified by
  the contrast script.

  | Token | Hex | Role |
  |---|---|---|
  | `color.sand.50` | `#FFF6E8` | App background (sun-washed sand) |
  | `color.sand.100` | `#FCE9CC` | Cards, panels |
  | `color.gold.500` | `#F0A830` | **Primary**: Kudi's mane, main buttons, coins |
  | `color.gold.600` | `#D98A12` | Primary pressed and borders |
  | `color.cocoa.900` | `#3A2315` | Main text, text on gold |
  | `color.cocoa.700` | `#6B4A33` | Secondary text |
  | `color.terracotta.600` | `#B04A26` | Accent: market awnings, highlights |
  | `color.indigo.700` | `#2B3A75` | Adire indigo: the **parent area** and gate (calmer, grown-up) |
  | `color.green.700` | `#1F6B45` | Positive and savings (a deep leaf green, deliberately not a bright lime) |
  | `color.teal.700` | `#0F6670` | Info and narration cue |
  | `color.hibiscus.600` | `#C23B5A` | Celebration accent, badges. **Never used for errors.** |

  **Patterns**: woven-strip (kente-inspired) and dye-resist (adire-inspired) motifs are drawn
  **as original geometric patterns**. They are used only as thin decorative bands, not copied
  from any specific cloth design.

- **Contrast** (checked 2026-11-14):

  | Pair | Ratio |
  |---|---|
  | cocoa.900 on sand.50 | 13.7 |
  | cocoa.700 on sand.50 | 7.4 |
  | cocoa.900 on gold.500 | 7.2 |
  | white on terracotta.600 | 5.5 |
  | white on indigo.700 | 10.7 |
  | white on green.700 | 6.5 |
  | white on hibiscus.600 | 5.2 |
  | white on teal.700 | 6.7 |
  | **white on gold.600** | **2.8 ✗** |

  **Rule**: **gold surfaces always use cocoa text, never white** (FR-002, SC-003).
- **Rationale**: warm earth tones and market-fabric accents give "KudiCubs' own brand" (FR-026).
  It can't be mistaken for any of the reference apps:
  - **Duolingo**: bright lime green and a green owl.
  - **Khan Academy Kids**: soft pastels.
  - **Toca Boca**: flat neon-pastel blocks.
- **Rejected**:
  - **A bright green primary**: too close to Duolingo.
  - **Red for "wrong"**: conflicts with Constitution III. KudiCubs has no error colour on child
    screens.

## D5. Typography: OFL-licensed rounded fonts, served from the prototype folder

- **Decision**:
  - **Display**: **Baloo 2** (weights 600 and 800), for titles, numbers and buttons.
  - **Body**: **Nunito** (weights 400, 700 and 800).
  - Both are under the SIL Open Font License 1.1, which allows commercial use, embedding and
    bundling in apps (FR-003). The `.woff2` files are stored in `prototype/assets/fonts/` with
    `OFL.txt`, so the prototype works offline.
  - **Type scale** (in points; `pt` maps to CSS `px` at 1×):

    | Style | Size |
    |---|---|
    | display-xl | 40 |
    | display-l | 32 |
    | title | 26 |
    | button-4-6 | 24 |
    | button | 20 |
    | body-child | 20 |
    | body | 18 |
    | label | 16 |
    | caption | 14 (parent and reviewer screens only) |

  - Child body text is at least 18 pt, and 4–6 button labels at least 22 pt (FR-003).
- **Rationale**: rounded, open letter shapes read well for early readers. Baloo has wide script
  coverage if local-language versions come later. The same font files work in Flutter.
- **Rejected**:
  - **System fonts only**: inconsistent looks across devices, which weakens the brand review.
  - **Commercial fonts**: licensing cost and friction for the MVP.

## D6. Original placeholder art: hand-built SVG

- **Decision**:
  - **Kudi the Cub** is drawn as an **original SVG lion cub**: a round head, a short spiky golden
    mane, big warm eyes, and a small tuft on the head. He has 7 poses, each its own SVG file in
    `prototype/assets/art/kudi/`:
    1. welcome (waving)
    2. explain (talking)
    3. point (hint)
    4. think
    5. cheer
    6. gentle (encouraging)
    7. idle (curled, sleepy)
  - **Avatars**: 4 original cub-friend characters (a different animal or style for each child
    avatar) plus colour variants.
  - **Scenes**: a market-day park and stalls, built from simple shapes.
  - Every placeholder is labelled "placeholder art" in the review guide (spec Assumptions).
- **Rationale**: SVG is crisp at any size, tiny and can be animated with CSS. Building it by hand
  guarantees originality (FR-025, SC-007). Final illustration comes later (spec 001, open item
  O4).
- **Rejected**:
  - **AI-generated or stock images**: unclear ownership, and they risk looking like other
    mascots.
  - **Emoji**: they look different on every platform and aren't ownable.

## D7. Coin art: stylised, not replicas of real money

- **Decision**:
  - Coins and notes are **original stylised tokens**. Each shows the denomination, the currency
    symbol, and a national colour accent. They are **not reproductions of real coin or banknote
    designs**.
  - Denomination sets:

    | Region | Coins | Notes |
    |---|---|---|
    | Ghana | 10p, 20p, 50p, GH₵1, GH₵2 | GH₵5 |
    | Nigeria | 50k, ₦1, ₦2 | ₦5, ₦10 |
    | UK | 10p, 20p, 50p, £1, £2 | £5 |

  - Nigerian coins exist but are rarely seen, so the Nigeria set leans on small notes. The game
    still calls them "coins".
- **Rationale**: avoids currency-reproduction rules (central banks restrict realistic copies of
  notes in particular) and the cost of licensed imagery. Stylised tokens are also easier for
  4–6 year olds to tell apart by colour and size, and they still read as local (FR-022, FR-026).
- **Rejected**:
  - **Photo-realistic coins and notes**: legal risk, and visually busy for small children.

## D8. Narration in the prototype: the device's speech engine, labelled as a placeholder

- **Decision**:
  - Spoken prompts use the browser's **Web Speech API** (`speechSynthesis`). It picks an
    English voice, preferring `en-GH`, `en-NG` or `en-GB` to match the region, with `en-*` as
    the fallback.
  - Every narrated prompt shows a **speaker cue** that replays the line when tapped (FR-015).
  - If no voice is available, the cue still animates and the line is shown as a caption on
    reviewer screens.
  - Speech starts after the first tap on Welcome, because browsers block audio before the user
    interacts.
- **Rationale**: no audio files to record or license now (spec Assumptions; plan 001, open item
  O3). It works offline on most phones, because the voices are on the device. It's clearly
  "synthetic placeholder", and that is stated in the review guide.
- **Rejected**:
  - **Pre-recorded clips made with macOS `say` or a cloud TTS**: licensing of generated audio is
    unclear, and it's extra work for a placeholder.
  - **Silence**: the client can't judge the narration-first experience.

## D9. Interactions: the Lost Coins activities and feedback

- **Decision**:
  - **Find**: 8 coins hidden in a market-park scene. Tapping one gives a pop, a sparkle and a
    counter tick.
  - **Sort**: 3 jars labelled by a big coin picture. Coins move by drag (Pointer Events) **or**
    by tap-coin-then-tap-jar, for accessibility and small hands.
    - A wrong jar gives a soft bounce back plus Kudi's "gentle" pose.
    - After 2 wrong attempts on the same coin, the right jar glows.
    - There is no red, no "X" and no buzzer (FR-011, FR-016).
  - **Count**: tap each coin in a jar. A big numeral counts up, with a spoken number.
  - **Idle hint**: after 6 s with no input, Kudi switches to the point pose, the main action
    pulses, and the prompt is spoken again. The hint escalates at 12 s and 20 s (FR-013; band
    rules from spec 001, R9).
  - **Celebration**: a CSS/SVG confetti-and-coins burst plus Kudi's cheer pose. It is skipped
    when `prefers-reduced-motion` is set (accessibility).
- **Rationale**: shows the real mechanics with minimal code. Offering both drag and tap covers
  motor-skill differences in 4–6 year olds.

## D10. Reviewer menu, hidden from children

- **Decision**:
  - Opened by a **2-second long-press on the KudiCubs logo** on any screen, or by the
    `?review=1` URL flag.
  - It contains: region (Ghana, Nigeria, UK), jump to screen, sound on/off, restart prototype,
    show screen notes, and the prototype version.
  - It uses the parent-area indigo style.
- **Rationale**: FR-021 says it must not be reachable by an accidental child tap. A long-press on
  the logo is a deliberate adult action and is the same idea as the app's parent gate.
- **Rejected**:
  - **A visible gear icon**: children would tap it.

## D11. State and persistence in the prototype

- **Decision**:
  - In-memory state (region, coins, XP, choices, earned badges) lives in `window.KC.state`.
  - Only **prototype preferences** (region, sound, current screen) go into `sessionStorage`, so a
    page refresh doesn't restart the demo.
  - The parent-gate email and PIN are **never stored or sent**. The fields are validated on the
    page and then discarded (FR-012).
  - There are no network requests at all, apart from fetching the prototype's own files.
- **Rationale**: Constitution V and FR-012. It also makes "nothing is sent" easy to verify
  (quickstart V6).

## D12. Verification tooling

- **Decision** (dev-only tools in `tools/design/`, with their own `package.json`):

  | Tool | What it checks |
  |---|---|
  | `build-tokens.mjs` | Generates the tokens CSS and markdown (D3) |
  | `check-contrast.mjs` | Reads `tokens.json` and the list of *declared text/background pairs* in `docs/design/tokens.json → pairs`; fails if any is below WCAG AA (SC-003) |
  | `check-tokens-usage.mjs` | Scans `prototype/assets/*.css` for raw hex colours, px font sizes or radii not taken from `var(--kc-…)` (SC-005, FR-024) |
  | **Playwright** smoke test `tools/design/tests/flow.spec.mjs` | At a 390×844 viewport: walks Welcome → … → Progress; every one of the 13 screens is reachable; each child screen has exactly one `[data-primary]` action; no 4–6 screen contains `[data-failure]`; touch targets ≥ 48 px (≥ 64 px for 4–6 primary actions); region switch changes the coin art (`data-region`) on every money screen, with no currency symbol inside 4–6 coin amounts; **zero network requests leave the origin** (SC-002, SC-004, SC-006, FR-012, FR-016) |

- **Rationale**: the success criteria are measurable, so they're measured by machine. These are
  checks, not app tests, and they run from the command line.
- **Rejected**:
  - **Manual checking only**: the 48-point targets and contrast would be missed.
  - **A full visual-regression suite**: overkill for a throwaway prototype.

## D13. Design references: patterns kept, and how KudiCubs differs

| Reference | Pattern adopted | How KudiCubs differs |
|---|---|---|
| Duolingo | Winding level path; daily indicator; one big primary button; celebration bursts | Lion cub (not an owl); warm sand, gold and terracotta palette (no lime green); path drawn as a **market road with stalls**; daily indicator is a **"market day" sun**, with **no loss messaging** for 4–6 |
| Khan Academy Kids | Narration-first, characters as guides, icon navigation | One guide (Kudi), not a cast; African-market scenes; bottom navigation with coin, jar and path icons |
| Toca Boca | Free-feeling, gentle, no-failure play; big tactile objects | Goal-driven missions with outcomes (the learning loop); coins and jars as the tactile objects |

All shapes, icons, characters, colours and sounds are original (FR-025). An originality review
against the three apps is a task before the prototype is sent (SC-007).

## D14. Versioning and delivery

- **Decision**:
  - The prototype version is **`0.1.0`**, shown in the reviewer menu and the zip name.
  - `tokens.json` has its own `version` (`1.0.0` at client sign-off, `0.x` before).
  - Feedback rounds bump the MINOR version: `0.2.0`, `0.3.0` and so on.
  - Delivered through PR `002` on the private repo. The client link (D2) is deployed only after
    the PR is reviewed.
- **Rationale**: Constitution, semver on all artifacts and a PR per feature. Fastlane doesn't
  apply, because there is no store build in this feature.
