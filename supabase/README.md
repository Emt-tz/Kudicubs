# KudiCubs local backend

Local Supabase stack for project `kudicubs` (ports 563xx, set in `config.toml`). Schema: `migrations/20261121000100_core.sql`; `20261121000200_seed_helpers.sql` adds a service-role-only helper used by the seed to set demo PINs.

## Run it

```bash
scripts/dev-up.sh                          # start stack if needed, db reset, seed, print URLs and keys
cd scripts && npm ci                       # first time only
node seed.mjs                              # re-seed (idempotent)
node seed.mjs --reset                      # wipe seed users and data, then seed
node --test access-tests.mjs               # RLS / RPC access tests (re-seeds first)
npm run audit                              # npm audit, must be clean
```

`seed.mjs` and the tests read the service key from `supabase status -o env`, or from `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The service key is for scripts only; never ship it in a client.

## Local URLs

| What | URL |
|---|---|
| API | http://127.0.0.1:56321 |
| DB | postgresql://postgres:postgres@127.0.0.1:56322/postgres |
| Studio | http://127.0.0.1:56323 |
| Mailpit (sign-in codes) | http://127.0.0.1:56324 |

## Demo accounts

| Account | What it is |
|---|---|
| `parent@example.com` | The Sample family: Ama (4-6), Kofi (7-9), Zara (10-12), Tobi (13-15), two devices |
| `parent2@example.com` | A second family with one child (Nia), used as the "other family" in access tests |
| `staff@example.com` | Team Console user, role `admin` (no family) |

- **Sign-in codes:** email one-time codes only. This CLI version has no fixed email code, so every code arrives in Mailpit at http://127.0.0.1:56324. Open the newest message and use the 6-digit code.
- **Parent PIN:** `5821` for both parents.
- Seed data: all 17 missions (ids like `m_4_6_lost_coins`, 5 + 4 + 4 + 4 across the four worlds), 8 badges, wallet events from each child's `events` in `shared/sample-family.json` (`ago` days become `created_at`), mission attempts from `play`, child badges. Sample `pillar` events have no table in the core schema and are not seeded.
- `config.toml` sets `auth.rate_limit.email_sent = 100` so repeated sign-ins in tests are not throttled (the default is 2 per hour).
