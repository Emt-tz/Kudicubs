# Contract: Platform Screen Manifest (1.0.0)

**Spec**: FR-001–FR-003, FR-005, FR-011, FR-015, FR-018 · **Research**: R1

Each surface publishes a list of its screens so the coverage check can resolve journey-map links to
real, reachable screens.

## Files

| Surface | Manifest | Route form |
|---|---|---|
| App | `prototype/assets/data/screens.manifest.json` | hash route, `/app/#/<id>` |
| Website | `website/screens.manifest.json` | page file, `/website/<id>.html` (home is `index`) |
| Parent Dashboard | `dashboard/screens.manifest.json` (key `parent`) | hash route, `/dashboard/parent/#/<id>` |
| Team Console | `dashboard/screens.manifest.json` (key `team`) | hash route, `/dashboard/team/#/<id>` |

## Shape

```json
{
  "version": "1.0.0",
  "screens": [
    { "id": "welcome", "title": "Welcome", "states": ["default"] },
    { "id": "otp", "title": "Enter code", "states": ["default", "error", "loading"], "refs": ["REF-03"] }
  ]
}
```

`refs` is optional. It lists the `REF-` ids from `docs/design/references.json` that influenced the
screen. `check-references.mjs` fails on an unknown id, and fails when a reference's `influences`
names a screen whose `refs` does not include it.

- `id` is unique within the surface and equals its route.
- `states` lists the states the screen actually renders; a journey-map link may name only those.

## Rules the check enforces

1. Every manifest `id` loads without a console error at its surface's default viewport.
2. Every journey-map `screens[].screen` exists in the matching manifest, and every named state is
   listed for it.
3. App screens that need a mission run (for example `decision`) are reachable by the documented
   reviewer jump, not only through a long path.
4. Manifests are generated from the screen registries by `build-site.mjs`; they are not hand-edited.
