# Contract: Share Hub and Deploy (1.0.0)

**Spec**: FR-023–FR-026 · **Research**: R3, R12 · **Extends** 004 `contracts/ci-and-deploy.md`

## Published layout (`dist/`, built by `tools/design/build-site.mjs`)

| Path | Content |
|---|---|
| `/` | Hub page: three platform cards, journeys to try per role, version, date, coverage counts, change list, feedback route |
| `/app/` | Mobile app prototype (`prototype/`) |
| `/website/` | Website prototype |
| `/dashboard/` | Entrance chooser; `/dashboard/parent/` and `/dashboard/team/` |
| `/shared/` | Tokens, adult components, sample family, brand, fonts |
| `/release.json` | Version, date, commit, coverage counts, change list |
| `/sw.js` | Retirement worker: unregisters itself and clears the old root cache |

## Rules

1. The public URL stays `https://emt-tz.github.io/Kudicubs/` for every version.
2. Old links with a hash (`/#/home`) are forwarded to `/app/#/home`.
3. Every HTML page carries `noindex, nofollow`; `robots.txt` disallows all.
4. The hub shows `release.json` values and states the demo scratch voice limit (RB-1).
5. The app's service worker is scoped to `/app/`; the website and dashboards register none.
6. Deploy runs only after the full check passes. Until 005 is merged, `prototype-pages` deploys from
   the 005 branch (temporary, as 004 did), and this is removed at merge.
7. `build-site.mjs` fails if any file referenced by a page is missing from `dist/`.

## Hub page content

- Title, tagline "Play. Earn. Roar!", version and date.
- Three cards: Mobile app, Website, Dashboards, each with "Open" and a one-line "try this" list.
- A role switcher: child, parent, visitor, staff. Each lists its journeys (from the journey map).
- A coverage line: designed / gaps / out of scope, from `release.json`.
- A "what changed" list and a feedback route.
