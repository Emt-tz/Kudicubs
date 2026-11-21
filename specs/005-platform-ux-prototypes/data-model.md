# Data Model: Complete UI/UX and Prototypes

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

These are design-time records kept as JSON in the repository, plus the fictional sample data. No
production data exists. The app's own saved-progress schema (004) is unchanged.

## Journey map row (`docs/design/journey-map.json`)

| Field | Type | Rules |
|---|---|---|
| `id` | string | Unique. Pattern `J-<PLATFORM>-<NN>` where platform is `APP`, `WEB`, `PD` (Parent Dashboard) or `TC` (Team Console) |
| `source` | string | The originating story: `001-US1`…`001-US6` or `005-US1`…`005-US9` |
| `platform` | enum | `app`, `website`, `parent-dashboard`, `team-console` |
| `actor` | enum | `child-4-6`, `child-7-9`, `child-10-12`, `child-13-15`, `parent`, `visitor`, `support`, `content-editor` |
| `title` | string | Short journey name |
| `priority` | enum | `P1`, `P2`, `P3` |
| `status` | enum | `designed`, `gap`, `out-of-scope` |
| `screens` | array of screen link | Required and non-empty when `designed` |
| `reason` | string | Required when `out-of-scope` |

State: `gap` → `designed` when screens exist and resolve; `gap` or `designed` → `out-of-scope` only
with a reason. The summary is derived: designed, gap and out-of-scope counts per platform and in total.

## Screen link and platform manifest entry

| Field | Type | Rules |
|---|---|---|
| `platform` | enum | As above |
| `screen` | string | Route id inside that platform (an app hash route, or a page or view id) |
| `states` | array of enum | Any of `default`, `loading`, `empty`, `error`, `success`, `disabled`, `focus` that are designed for this screen |

Every `screen` must exist in the platform's manifest (see `contracts/platform-manifest.md`).

## Component record (`docs/design/components.md`)

| Field | Rules |
|---|---|
| `name` | Unique across all surfaces |
| `surface` | `shared`, `child`, `adult` |
| `states` | The states shown above, each documented |
| `sizes` | Named sizes (for adult: compact and comfortable) |
| `usedBy` | Platforms where it appears |

## Design reference (`docs/design/references.json`)

| Field | Type | Rules |
|---|---|---|
| `id` | string | `REF-NN`, unique |
| `url` | string | Public link to the page viewed |
| `platform` | enum | As above |
| `pattern` | string | The pattern learned (not an asset) |
| `influences` | array of screen link | Screens affected |
| `differs` | string | Required, how KudiCubs is different |
| `verdict` | enum | `adopted`, `adapted`, `rejected` |
| `rejectReason` | string | Required when `rejected` |
| `review` | object | `{method, reviewer, date, result}`, required once per review round |

## Sample family (`shared/sample-family.js`, built from one JSON)

| Entity | Key fields | Rules |
|---|---|---|
| Family | `id`, `parentLabel`, `region` default, `devices[]` | Fictional; no real email |
| Child | `nickname`, `ageBand`, `region`, `avatar`, `level`, `xp`, `coins`, `badges[]`, `events[]` | At least three children covering at least three bands and two regions. Nicknames only |
| Skill progress | per pillar: Know, Understand, Decide, Invest, Share | Derived from events |
| Device | `label`, `mode` (`my-phone`, `family`), `lastSeen` | Shown on the dashboard |
| Staff user | `role` (`support`, `content`) | Reviewer-selected |

Every number on the dashboard is derived from the children's events, using the same derivation as
the app, so both surfaces agree.

## Release record (`dist/release.json`, generated)

`version`, `date`, `commit`, `coverage` (designed, gap, out-of-scope counts), `changes[]`. It feeds the
hub page and the reviewer menu.
