# KudiCubs: Architecture & Flow Diagrams

**Source of truth**:

- [specs/001-kudicubs-mvp/spec.md](../../specs/001-kudicubs-mvp/spec.md) (requirements)
- [specs/001-kudicubs-mvp/plan.md](../../specs/001-kudicubs-mvp/plan.md) (architecture)

**Version**: matches tag `v0.2.0-architecture`.

These diagrams summarise those documents. If a diagram and the spec or plan disagree, **the spec
and plan win** and this file should be updated. Requirement ids (FR-xxx) and research ids (Rxx)
point back to the sources.

1. [System architecture](#1-system-architecture)
2. [Data model (ER)](#2-data-model-er)
3. [Child user flow: launch / sign-in → Reward](#3-child-user-flow-launch--sign-in--reward)
4. [Parent flow](#4-parent-flow)
5. [Mission engine: screen-type state machine](#5-mission-engine-screen-type-state-machine)

---

## 1. System architecture

The client is local-first. The device's SQLite database is the source of truth for the UI, and
sync runs in the background (R12). The backend is Supabase, in the London region (R16, R22).
There are no third-party analytics, ads or crash SDKs (R19, R20).

```mermaid
flowchart LR
  subgraph Device["Android / iOS device (Flutter app)"]
    direction TB
    UI["Features<br/>onboarding · home · mission_engine<br/>wallet · progress · profile · parent"]
    Router["go_router<br/>ChildShell · MissionRoute · ParentShell<br/>global redirect guards"]
    Engine["Mission engine (pure Dart)<br/>step state machine · band rules · economy"]
    Render["Rendering<br/>Flutter widgets · Rive (Kudi, rewards)<br/>Flame (mini-game scenes only)"]
    Audio["Narration<br/>just_audio · preloaded AAC"]
    DB[("Drift / SQLite<br/>synced tables + outbox")]
    Packs[("Installed content packs<br/>missions JSON · art · Rive · ARB · audio")]
    Secure[("Keychain / Keystore<br/>PIN hash · refresh token")]
    Sync["Sync worker<br/>push / pull every 30 s + triggers"]
    BandRules["Band rules JSON<br/>(in app binary)"]

    UI --> Router
    UI --> Engine
    Engine --> BandRules
    Engine --> Packs
    Engine --> DB
    UI --> Render
    UI --> Audio
    Audio --> Packs
    UI --> DB
    UI --> Secure
    DB --> Sync
  end

  subgraph Supabase["Supabase (London, eu-west-2)"]
    direction TB
    Auth["Auth<br/>parent email OTP (6-digit code)"]
    PG[("Postgres<br/>RLS on every table<br/>sync_push / sync_pull RPC")]
    Storage[("Storage<br/>content/{packId}/{semver}/pack.zip")]
    Fn["Edge Functions<br/>otp-verify · pin-set · pin-verify<br/>family-export · family-delete<br/>retention-sweep · crash-report"]
    Cron["pg_cron<br/>daily retention sweep"]
    Cron --> Fn
    Fn --> PG
    Fn --> Auth
  end

  SES["Amazon SES<br/>OTP · retention warnings"]
  Tools["content_cli<br/>validate · build · publish"]
  CI["GitHub Actions CI<br/>analyze · test · content · supabase · build<br/>(read-only)"]
  Fastlane["fastlane lanes<br/>beta · release · bump<br/>(run by developer)"]
  Stores["Google Play · App Store"]

  Sync -- "HTTPS + parent JWT" --> PG
  UI -- "sign-in code" --> Auth
  UI -- "lockout-wrapped verify, PIN, export, delete" --> Fn
  UI -- "download packs (SHA-256 checked)" --> Storage
  Auth --> SES
  Fn --> SES
  Tools -- "publish packs + content_versions" --> Storage
  Tools --> PG
  CI -. "validates" .-> Tools
  Fastlane --> Stores
  Stores --> Device
```

---

## 2. Data model (ER)

These are the server tables from [data-model.md](../../specs/001-kudicubs-mvp/data-model.md) §2.

- Child data is limited to **nickname, avatar, age band and progress** (FR-005, FR-007f).
- Balances are always folded from `WALLET_EVENTS`, never stored (R10).
- `PARENT_SECRETS`, `OTP_ATTEMPTS` and `RETENTION_NOTICES` have no client access.

```mermaid
erDiagram
  AUTH_USERS ||--|| PARENTS : "is"
  PARENTS ||--|| PARENT_SECRETS : "has PIN hash"
  PARENTS ||--o{ CONSENT_RECORDS : "grants"
  PARENTS ||--o{ DEVICES : "signs in on"
  PARENTS ||--o{ RETENTION_NOTICES : "receives"
  PARENTS ||--o{ CHILD_PROFILES : "owns"
  CHILD_PROFILES ||--o{ MISSION_ATTEMPTS : "plays"
  CHILD_PROFILES ||--o{ WALLET_EVENTS : "earns / spends / saves"
  CHILD_PROFILES ||--o{ CHILD_BADGES : "earns"
  CHILD_PROFILES ||--o{ CHILD_ITEMS : "owns cosmetic"
  CHILD_PROFILES ||--o{ ANALYTICS_EVENTS : "only if opted in"
  MISSIONS ||--o{ MISSION_ATTEMPTS : "attempted as"
  MISSION_ATTEMPTS ||--o{ WALLET_EVENTS : "emits"
  MISSION_ATTEMPTS |o--o{ MISSION_ATTEMPTS : "retry_of"
  BADGES ||--o{ CHILD_BADGES : "awarded as"
  WALLET_EVENTS |o--o| CHILD_ITEMS : "bought"
  CONTENT_VERSIONS ||--o{ MISSIONS : "packaged in"

  AUTH_USERS {
    uuid id PK
    text email
  }
  PARENTS {
    uuid id PK
    text region_code "gh | ng | uk"
    timestamptz consented_at
    text privacy_notice_version
    boolean analytics_opt_in "default false"
    timestamptz last_active_at
  }
  PARENT_SECRETS {
    uuid parent_id PK
    bytea pin_hash
    bytea pin_salt
    int failed_attempts
    timestamptz locked_until
  }
  CONSENT_RECORDS {
    uuid id PK
    uuid parent_id FK
    text kind "privacy_notice | analytics"
    text version
    timestamptz granted_at
    timestamptz revoked_at
  }
  DEVICES {
    uuid id PK "random, not hardware id"
    uuid parent_id FK
    text mode "family | parent"
    text platform
    text app_version
  }
  RETENTION_NOTICES {
    uuid parent_id PK
    text kind PK "warn_30 | warn_7"
    timestamptz sent_at
  }
  CHILD_PROFILES {
    uuid id PK
    uuid parent_id FK
    text nickname "2-16 chars"
    text avatar_id
    text age_band "b4_6 | b7_9 | b10_12 | b13_15"
    jsonb settings "sound, narration"
    timestamptz deleted_at
  }
  MISSIONS {
    text id PK "e.g. mc.lost_coins"
    text world_id
    text age_band
    int order_index
    text pillars "know understand decide invest share"
    int stage "1-4"
    boolean released
  }
  CONTENT_VERSIONS {
    uuid id PK
    text pack_id
    text pack_type "world | region | parent"
    text version "semver"
    text sha256
    text status
  }
  MISSION_ATTEMPTS {
    uuid id PK
    uuid child_id FK
    text mission_id FK
    text kind "mission | daily_challenge"
    text status "in_progress | completed | abandoned"
    text current_step_id
    uuid retry_of FK
    timestamptz client_updated_at
  }
  WALLET_EVENTS {
    uuid id PK "idempotency key"
    uuid child_id FK
    uuid attempt_id FK
    text kind "earn bonus reward spend save unsave interest"
    int coins_delta
    int savings_delta
    int xp_delta ">= 0"
    text category
  }
  BADGES {
    text id PK
    text world_id
    jsonb criteria
  }
  CHILD_BADGES {
    uuid child_id PK
    text badge_id PK
    timestamptz earned_at
  }
  CHILD_ITEMS {
    uuid child_id PK
    text item_id PK
    uuid wallet_event_id FK
  }
  ANALYTICS_EVENTS {
    uuid id PK
    uuid child_id FK
    text event
    text mission_id
    jsonb props "whitelisted"
  }
```

---

## 3. Child user flow: launch / sign-in → Reward

Children never have accounts or passwords. "Login" for a child means **first-time onboarding**
(the parent creates the family account inside it) or **picking their picture** on the profile
picker. The flow follows the thought paper's direction (Home → Continue → Mission Intro →
Decision → Result → Summary → Reward → Home), the onboarding order in FR-003, the guards in
[routes.md](../../specs/001-kudicubs-mvp/contracts/routes.md), and the 4–6 rules (no failure
screens).

```mermaid
flowchart TD
  Launch([App launch]) --> G1{Onboarding<br/>complete?}
  G1 -- "no" --> W["Welcome<br/>Kudi: 'Join the Pride!'"]
  W --> AB["Age band<br/>4–6 · 7–9 · 10–12 · 13–15<br/>(unreleased = 'Coming soon')"]
  AB --> AV["Avatar + nickname"]
  AV --> PG["Parent gate<br/>3 s hold + spoken multiplication"]
  PG --> RG["Region<br/>Ghana · Nigeria · UK"]
  RG --> PIN["Set 4-digit PIN"]
  PIN --> EM["Parent email + privacy notice"]
  EM --> NET{Online?}
  NET -- "yes" --> OTP["Enter 6-digit code<br/>(consent recorded)"]
  NET -- "no / 'confirm later'" --> LOCAL["Local-only account<br/>(play allowed, no sync)"]
  OTP --> JP["'You joined the Pride!'"]
  LOCAL --> JP
  G1 -- "yes" --> G2{More than one child?}
  G2 -- "yes" --> PP["Profile picker<br/>(tap your picture)"]
  G2 -- "no" --> HOME
  PP --> HOME
  JP --> HOME["Home dashboard<br/>XP bar · coins · level · daily challenge · badges"]
  HOME -- "idle 6 s" --> HINT["Kudi points to Continue<br/>(narrated hint)"]
  HINT --> HOME
  HOME -- "Continue" --> INTRO["Mission Intro<br/>'The Lost Coins': Kudi narrates the goal"]
  INTRO -- "Start" --> FIND["Activity: find the coins"]
  FIND --> SORT["Activity: sort into jars<br/>wrong jar → bounce + hint, never 'wrong'"]
  SORT --> COUNT["Activity: count each jar<br/>(coins earned)"]
  COUNT --> DEC["Decision: Save it or Spend it?<br/>(skippable narrated explainer)"]
  DEC -- "Save" --> RS["Action Result<br/>coins fly to the piggy bank"]
  DEC -- "Spend" --> RP["Action Result<br/>sticker treat unwrapped"]
  RS --> SUM["Round Summary<br/>celebratory recap (no failure screen)"]
  RP --> SUM
  SUM --> REW["Reward<br/>coins · XP · badge(s) · Level Up?"]
  REW -- "Back to Home" --> HOME
  HOME -.-> WAL["Wallet<br/>balance · savings · history · bars"]
  HOME -.-> PRO["Progress<br/>level path · badges · pillars"]
  HOME -.-> PRF["Profile<br/>sound · narration · parent entry"]
```

---

## 4. Parent flow

The parent area is reachable only through the **gate challenge plus PIN** (FR-006, FR-036). It is
reached from Profile on a family device, or is the start screen on a parent device (FR-007h).

```mermaid
flowchart TD
  subgraph FamilyDevice["Family device"]
    PRF["Child: Profile"] -- "Parent area" --> GATE
  end
  subgraph NewDevice["Additional device"]
    SI["Sign in: parent email"] --> CODE["6-digit code<br/>(5 wrong → 15 min lock)"]
    CODE --> MODE{"Device type?"}
    MODE -- "Family device" --> PICK["Child profile picker"]
    MODE -- "This is my phone" --> GATE
  end
  GATE["Parent gate<br/>hold + spoken multiplication"] --> PINV{"PIN correct?"}
  PINV -- "no (5×)" --> LOCK["Cooling-off<br/>1 → 5 → 15 min<br/>or reset PIN via email code"]
  LOCK --> GATE
  PINV -- "yes" --> PH["Parent home<br/>all children: level · coins · savings<br/>badges · pillars · recent missions"]
  PH --> CD["Child detail"]
  CD --> CB["Change age band<br/>(released bands only, rewards kept)"]
  CD --> CE["Edit / remove child"]
  PH --> ADD["Add another child<br/>(skips parent steps)"]
  PH --> SET["Settings"]
  SET --> REG["Region: GH · NG · UK<br/>(coin count unchanged)"]
  SET --> CPIN["Change PIN / email"]
  SET --> AN["Analytics opt-in<br/>(default off)"]
  SET --> DM["Switch device type<br/>family ⇄ parent"]
  SET --> EXP["Download family data (JSON)"]
  SET --> DEL["Delete family account<br/>(confirm) → all data erased"]
  SET --> CONF["Confirm email<br/>(if local-only) → sync starts"]
  PH -. "external links only via gate" .-> EXT["Privacy policy · support"]
  RET(["12 months inactive"]) -. "warn at 30 d and 7 d, then delete" .-> DEL
```

---

## 5. Mission engine: screen-type state machine

The engine runs a mission as a state machine over **six step kinds** plus two **engine-owned
framing screens** (Mission Intro, Reward). This follows FR-016 and FR-017 as amended, and the
mission schema in
[contracts/mission-content.schema.json](../../specs/001-kudicubs-mvp/contracts/mission-content.schema.json).

Band rules (R9) change behaviour at the marked points:

- **4–6**: negative outcomes render as gentle variants; there is no retry or timer.
- **7–15**: Try Again after an unsuccessful round, keeping rewards.
- **7–9**: soft timers that never end a round.

```mermaid
stateDiagram-v2
  [*] --> LoadMission : Continue / mission card
  LoadMission --> MissionIntro : pack + band rules loaded
  LoadMission --> Resume : in-progress attempt exists
  Resume --> NextStep : jump to start of current_step_id

  MissionIntro --> NextStep : Start

  state NextStep <<choice>>
  NextStep --> Activity : kind = activity
  NextStep --> Decision : kind = decision
  NextStep --> ResourceManagement : kind = resource_management
  NextStep --> MarketSimulation : kind = market_simulation
  NextStep --> ActionResult : kind = action_result
  NextStep --> RoundSummary : kind = round_summary
  NextStep --> Reward : no steps left

  Activity --> NextStep : game done → outputs to vars, effects applied
  Decision --> NextStep : choice stored, effects applied
  ResourceManagement --> NextStep : purchases within budget
  MarketSimulation --> NextStep : model outputs (sales, revenue, satisfaction)

  state ActionResult {
    [*] --> PickOutcome
    PickOutcome --> RenderAsIs : tone positive/neutral, or band allows failure
    PickOutcome --> RenderGentle : tone negative and band 4–6
    RenderAsIs --> [*]
    RenderGentle --> [*]
  }
  ActionResult --> NextStep : effects applied

  state RoundSummary {
    [*] --> Evaluate
    Evaluate --> Celebrate : band 4–6 (recap, never failure)
    Evaluate --> Success : successWhen true
    Evaluate --> Unsuccessful : successWhen false (7–15)
    Celebrate --> [*]
    Success --> [*]
    Unsuccessful --> [*]
  }
  RoundSummary --> NextStep : Next
  RoundSummary --> TryAgain : Try Again (7–15 only)
  TryAgain --> MissionIntro : new attempt (retry_of), earned rewards kept

  Reward --> [*] : Back to Home (attempt completed, first-completion or replay rewards)

  note right of Decision
    Idle hints escalate per band rules
    (4–6: 6 s, 12 s, 20 s)
  end note
  note right of Reward
    Emits wallet_events (coins, XP),
    child_badges, and Level Up if an
    XP threshold is crossed
  end note
```
