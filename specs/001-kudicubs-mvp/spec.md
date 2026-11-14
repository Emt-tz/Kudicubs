# Feature Specification: KudiCubs MVP

**Feature Branch**: `001-kudicubs-mvp`

**Created**: 2026-11-14

**Status**: Draft

**Input**: User description: "KudiCubs MVP. Source material is in docs/source/ (the app was renamed
from BizKids/BizKidz to KudiCubs; guide character is Kudi the Cub; children "join the Pride").
Scope: onboarding (welcome, age band, avatar, parent gate with PIN and email), home dashboard (XP,
coins, level, Continue, daily challenge, badges), one world per age band, the core loop Mission
Intro → Decision → Result → Summary → Reward, wallet, progress, profile. Reusable screen types:
Decision, Resource Management, Action Result, Market Simulation, Round Summary. First mission for
4–6: "The Lost Coins" (find, sort, count, then save-or-spend). Rewards: coins, XP, badges, levels.
Curriculum pillars: Know, Understand, Decide, Invest, Share. Out of scope: multiplayer, teacher
dashboards, real payments."

**Source material**: `docs/source/BizKids Thought Paper.pptx` (product vision, UI flows, mockup
boards), `docs/source/BIZ KIDS Content.pptx` (curriculum and missions for all four age bands),
`docs/source/BIZKIDZ.pptx.pdf` (earlier version of the thought paper). All "BizKids"/"BizKidz"
references in the source are read as "KudiCubs".

## Clarifications

### Session 2026-11-14

Answered by the client, Jefferson Agbai:

- Q: Is the parent email for PIN recovery only, or for an online family account? → A: An online
  family account that saves progress and syncs it across devices, so parents can follow progress
  from their own phone (Option B).
- Q: How many missions are playable at MVP launch? → A: Every mission in the content deck, about
  17 across four worlds (Option C).
- Q: Which regions launch? → A: Ghana (cedi), Nigeria (naira) and the United Kingdom (pound).
- Q: Is "Side Hustle" an acceptable name for the 13–15 world? → A: Yes, "Side Hustle" is
  confirmed.
- Q: How does a parent prove it's them when signing in on a new device? → A: With a one-time code
  emailed to the parent each time (no password).
- Q: Should all 17 missions launch together or in stages? → A: In stages. Stage 1 is the full app
  plus the 4–6 world (5 missions). Stages 2–4 each add one world (7–9, then 10–12, then 13–15) as
  an update.
- Q: Which devices must KudiCubs run on at Stage 1 launch? → A: Android and iOS, phones and
  tablets. Minimum device: a budget Android phone with about 2 GB of memory.
- Q: What does a parent's own phone show after the parent signs in? → A: The parent chooses "This
  is my phone", and the app opens to a PIN-protected parent view of all children. Children can't
  play there unless the parent switches the device to "family device".
- Q: How long is an unused family account kept before automatic deletion? → A: 12 months with no
  sign-in or play, with warning emails to the parent 30 days and 7 days before. Any sign-in or
  play resets the clock.
- Q: The five screen types don't cover the Mission Intro, the Reward screen, or the Lost Coins
  find/sort/count activities (found during planning, Flag F2). → A: Add "Activity (mini-game)"
  as a sixth screen type. Mission Intro and Reward become framing screens that the engine
  provides for every mission (approved by the developer).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A family sets up KudiCubs and a child joins the Pride (Priority: P1)

A parent hands the device to their child. The child is greeted by Kudi the Cub on a welcome screen
("Join the Pride"), the age band is chosen, and the child picks an avatar and a nickname. Before the
child can start playing, a parent passes a parent gate, sets a parent PIN, and gives their own
email address. The child then lands on their home dashboard, ready to play in the world for their
age band.

**Why this priority**: Nothing else can be used without a child profile with an age band, and the
parent gate is a non-negotiable safety requirement (Constitution V).

**Independent Test**: On a fresh install, complete onboarding as a parent and child and confirm a
child profile exists with the chosen age band, avatar and nickname, that a parent PIN is set, and
that the home dashboard shows the correct world for the age band.

**Acceptance Scenarios**:

1. **Given** a fresh install, **When** the app opens, **Then** a welcome screen with Kudi the Cub
   and a single "Let's Go!" style primary action is shown, with audio narration.
2. **Given** the welcome screen, **When** the child continues, **Then** an age-band choice
   (4–6, 7–9, 10–12, 13–15) is presented using pictures and narration, not text alone. Bands whose
   world has not been released yet are shown as "Coming soon" and can't be selected (FR-015b).
3. **Given** an age band is chosen, **When** the child moves on, **Then** they can browse and pick
   an avatar character and enter or pick a nickname.
4. **Given** avatar creation is complete, **When** the parent gate appears, **Then** it can only be
   passed by solving a challenge a young child is unlikely to pass by chance. The parent then
   chooses the region (Ghana, Nigeria or United Kingdom), sets a 4-digit PIN, enters their email
   address, and agrees to the privacy notice to create the family account.
5. **Given** the parent gate is complete, **When** onboarding finishes, **Then** the child sees a
   "You joined the Pride!" moment and lands on the home dashboard for their age-band world.
6. **Given** onboarding is in progress, **When** the app is closed and reopened, **Then** onboarding
   resumes at the step it left off, without losing choices already made.
7. **Given** the family account has been created, **When** the parent confirms their email from the
   message sent to it, **Then** parental consent is recorded and the child's progress starts saving
   to the family account. Until the email is confirmed, the child can keep playing and progress is
   kept on the device.
8. **Given** a family account already exists, **When** a parent installs KudiCubs on another device
   and signs in with the parent email and the one-time code emailed to them, **Then** all child
   profiles and their progress appear on that device.

---

### User Story 2 - A 4–6 year old plays "The Lost Coins" (Priority: P1)

From the home dashboard, a young child taps Continue and enters the Money & Choices world. Kudi the
Cub introduces the mission: coins have been lost. The child finds the scattered coins, sorts them
into jars by value, counts how much is in each jar, and then decides whether to save the coins or
spend them. The child sees what happens because of the choice, gets a round summary, and receives
coins, XP and a badge before returning home.

**Why this priority**: This is the first complete pass through the core loop (Mission Intro →
Decision → Result → Summary → Reward), and it proves the product works for the hardest audience,
pre-readers.

**Independent Test**: With a 4–6 profile, play The Lost Coins from start to finish without reading
any text and confirm that each stage is reached, coins, XP and a badge are awarded, and the child
is returned to the home dashboard.

**Acceptance Scenarios**:

1. **Given** a 4–6 profile on the home dashboard, **When** the child taps Continue, **Then** the
   Lost Coins Mission Intro plays, with Kudi narrating the goal and one obvious "Start" action.
2. **Given** the find activity, **When** the child taps hidden coins in the scene, **Then** each
   coin found is celebrated and a progress indicator shows how many are left to find.
3. **Given** all coins are found, **When** the sort activity starts, **Then** the child drags each
   coin into the jar that matches its value, and a coin dropped in the wrong jar gently bounces back
   with a narrated hint (never a failure message).
4. **Given** sorting is complete, **When** the count activity starts, **Then** the child counts the
   coins in each jar with narrated, visual counting support, and the total for each jar is shown.
5. **Given** counting is complete, **When** the save-or-spend Decision screen appears, **Then** the
   child sees two picture cards ("Save it for later" / "Spend it now") with a short, skippable
   narrated explanation of saving and spending.
6. **Given** the child chooses **save**, **When** the Action Result is shown, **Then** the coins
   move into the child's savings and Kudi explains that saved coins add up to bigger rewards.
7. **Given** the child chooses **spend**, **When** the Action Result is shown, **Then** the child
   gets an immediate treat (a cosmetic reward) and Kudi explains that spending gives something now;
   this outcome is presented positively, never as a mistake.
8. **Given** the result is shown, **When** the Round Summary appears, **Then** it celebrates what
   the child did (coins found, sorted, counted, the choice made) with no "wrong" or failure screen.
9. **Given** the summary, **When** the Reward screen appears, **Then** the child receives coins
   (including a bonus for sorting all coins correctly), XP and at least one badge, and a single
   "Back to Home" action.
10. **Given** the child leaves mid-mission, **When** they next tap Continue, **Then** the mission
    resumes at the start of the activity they left.

---

### User Story 3 - The home dashboard keeps the child motivated and always shows what's next (Priority: P2)

Every time the child opens the app, the home dashboard shows their avatar (animated), XP bar,
coin balance and current level, a large Continue button that always takes them to the next thing
to do, today's daily challenge, and a preview of recently earned badges.

**Why this priority**: The dashboard is how the constitution's "never wonder what to do next" rule
is met across every session.

**Independent Test**: With a profile that has partial progress, open the app and confirm every
dashboard element shows correct values, Continue opens the next unfinished activity, and the daily
challenge can be started and completed.

**Acceptance Scenarios**:

1. **Given** a child with progress, **When** the dashboard opens, **Then** it shows XP progress
   toward the next level, coin balance, current level name, Continue, the daily challenge, and a
   badge preview.
2. **Given** any profile state, **When** the child taps Continue, **Then** they go straight to the
   next unfinished mission or activity, or replay a favourite if everything is complete.
3. **Given** a new calendar day, **When** the dashboard opens, **Then** a new daily challenge drawn
   from the child's world is shown with its reward and a progress indicator.
4. **Given** the child does nothing on the dashboard for a short while, **When** idle, **Then** Kudi
   or the Continue button animates and a narrated hint points to Continue.

---

### User Story 4 - The child sees where their money went and how they've grown (Priority: P2)

The child opens their Wallet to see their coin balance, savings, a history of what they earned and
spent, and simple bar charts showing "where your money went". From Progress, they see a level path,
a badge grid, skills unlocked, and how far they've come in each curriculum pillar (Know,
Understand, Decide, Invest, Share).

**Why this priority**: The wallet teaches money visually and reinforces the outcomes of the
child's decisions. Progress makes growth visible to both child and parent.

**Independent Test**: After playing at least one mission, open the Wallet and Progress screens and
confirm every earn and spend appears correctly, the charts match the history, and badges, level and
pillar progress reflect what was played.

**Acceptance Scenarios**:

1. **Given** the child has earned and spent coins, **When** they open the Wallet, **Then** they see
   balance, savings, a chronological earnings and spending history, and bar charts grouped by where
   the money came from and went.
2. **Given** a 4–6 profile, **When** the Wallet is shown, **Then** amounts are shown as coin
   pictures and stacks with narration, and the screen is understandable without reading.
3. **Given** the child opens Progress, **When** the screen loads, **Then** it shows the level path
   with the current level highlighted, earned and locked badges, skills unlocked, and progress
   per curriculum pillar.
4. **Given** the child earns enough XP to reach a new level, **When** the reward is given, **Then**
   a Level Up celebration shows the new level name and what it unlocked.

---

### User Story 5 - Children in every age band play a world built for them (Priority: P3)

Each age band has its own world, all following the same core loop and built from the same six
reusable screen types, with complexity that rises from band to band. Every mission from the
content deck is playable (see the mission list under FR-015):

- **4–6 · Money & Choices**: 5 story missions (The Lost Coins, Shopping for a Picnic, Saving for
  a Bicycle, Building a Playground Together, The Rainy Day Umbrella). Characters guide every
  decision, and rewards are visual.
- **7–9 · Build & Grow**: 4 missions (Birthday Party Budget, The Lemonade Challenge, The Toy Shop,
  The Pizza Festival). Children budget, buy supplies, set prices, run the stand in a market
  simulation, and review profit and loss.
- **10–12 · Founder Mode**: 4 missions (Start-up Funding for a Clothing Brand, Keep the Company
  Running, Business Island, Battle of the Brands). Children raise capital (equity vs debt), plan,
  run, and analyse results.
- **13–15 · Side Hustle**: 4 missions (Side Hustle Simulator, Budget Boss Challenge, Investment
  Arena, The Big Purchase). Teens run a side hustle, manage a monthly budget, invest, and handle
  "Temptation Alerts".

**Why this priority**: The MVP's product promise is "one world per age group". The core loop and
screen types are proven first in the 4–6 world (User Story 2, Stage 1), then reused here. The
7–9, 10–12 and 13–15 worlds ship in Stages 2, 3 and 4 (FR-015a).

**Independent Test**: For each age band, create a profile, play every mission in that world end to
end, and confirm each one uses the core loop and the shared screen types, and that its complexity
matches the band's design rules.

**Acceptance Scenarios**:

1. **Given** a profile in any band, **When** the child opens World, **Then** their band's world is
   shown with its first business or mission active and future ones visibly locked, with an
   unlock hint.
2. **Given** a 7–9 child plays a mission with a Resource Management screen, **When** they buy
   supplies, **Then** they see their budget, item cards with quantity selectors, and the remaining
   balance, which updates as they choose.
3. **Given** a 7–9 or older child plays a Market Simulation screen, **When** the round runs,
   **Then** customer avatars react, sales happen in real time, and demand and price-satisfaction
   indicators respond to the child's earlier decisions.
4. **Given** a round ends for a 7–15 child, **When** the Round Summary is shown, **Then** it shows
   revenue, costs, profit, what went well and what to try differently, and offers both "Try Again"
   and "Next" actions.
5. **Given** a 7–15 child's round ends at a loss, **When** they choose Try Again, **Then** they
   replay the round without losing coins, XP or badges earned before the attempt.
6. **Given** a mission where the source says the child "competes with other players" (for
   example, The Pizza Festival or Battle of the Brands), **When** the child plays it, **Then** the
   rivals are computer-controlled characters and no other real player is involved.
7. **Given** a child completes a mission, **When** they return to World, **Then** the next
   mission in that world is unlocked.

---

### User Story 6 - Profile and parent area (Priority: P3)

The child's Profile shows their avatar, nickname, level and simple settings (sound, narration).
From the Profile, a parent can enter the parent area by passing the parent gate and entering
their PIN. There they can see the child's progress, change the child's age band, add another child
profile, change the region, and manage the PIN and email.

**Why this priority**: Needed for family use and for the safety rules, but the core child
experience can be demonstrated without it.

**Independent Test**: Open Profile as a child, confirm settings work, then enter the parent area
with the PIN and change the age band, add a second child, and switch between child profiles.

**Acceptance Scenarios**:

1. **Given** the child opens Profile, **When** it loads, **Then** avatar, nickname, level and
   sound and narration settings are shown, plus a parent-area entry.
2. **Given** the child taps the parent-area entry, **When** the gate appears, **Then** the parent
   area only opens after the gate challenge and the correct PIN are both completed.
3. **Given** the parent area is open, **When** the parent changes the child's age band, **Then** the
   child's world changes to the new band, and earned coins, XP and badges are kept.
4. **Given** the parent area is open, **When** the parent adds a second child profile, **Then**
   onboarding for that child skips the parent setup steps, and the app shows a picture-based
   profile picker at launch.
5. **Given** the wrong PIN is entered 5 times in a row, **When** another attempt is made, **Then**
   the parent area locks for a cooling-off period, and the parent can reset the PIN through
   their email.
6. **Given** a parent signs in on their own phone and chooses "This is my phone", **When** the app
   opens, **Then** it goes straight to the PIN-protected parent view, which shows every child's
   latest synced level, coins, badges, pillar progress and recent missions. No child profile
   picker or gameplay is offered.
7. **Given** a phone set up as a parent device, **When** the parent switches it to "family device"
   in the parent area, **Then** the child profile picker and gameplay become available, and the
   parent can switch back at any time.
8. **Given** the parent area is open, **When** the parent asks to delete the family account,
   **Then** after confirming, the account and all child data are deleted from the family account
   and from the device.

---

### Edge Cases

- A child taps the parent gate repeatedly or randomly: the gate MUST NOT open by chance, and the
  child is gently returned to where they were.
- A parent forgets the PIN: they can reset it through the parent email, and no child data is lost.
- The device is offline: missions in progress and already-downloaded content remain playable,
  and progress is not lost. It syncs to the family account automatically when the device is
  back online.
- The same child plays on two devices while one is offline: when both sync, no earned coins, XP,
  badges or mission completions are lost. Each earned item is kept once, never duplicated or
  dropped.
- The parent never confirms their email: the child can still play, progress stays on the device,
  and the parent area gently reminds the parent to confirm the email to turn on saving to the
  account.
- The parent signs in on a new device with an email that has no account: they are offered the
  option to create a new family account instead.
- The sign-in code doesn't arrive or has expired: the parent can ask for a new code after a short
  wait, and the screen suggests checking spam folders.
- A family is inactive for nearly 12 months: the parent receives warning emails 30 days and 7
  days before deletion, and signing in or playing once keeps the account. If an offline device
  holds progress for an account that has already been deleted, that progress is not uploaded,
  and the device returns to onboarding.
- The app is closed mid-mission or mid-onboarding: the child resumes at the start of the
  interrupted activity or step.
- A child chooses "spend" every time: the outcome is always constructive, and later missions can
  still be completed.
- A 4–6 child sorts a coin into the wrong jar repeatedly: hints get stronger (highlighting the
  correct jar) until the child succeeds, and no failure is ever shown.
- A child's age band is changed mid-mission: the current mission is closed safely and the new
  band's world is shown on return to Home, with earned rewards kept.
- No daily challenge was completed yesterday: no streak penalty or loss is shown to 4–6 children,
  and older bands see only a gentle encouragement.
- A region's configuration is missing a value (for example, a coin denomination image): the app
  falls back to the default region's value instead of showing a broken screen.

## Requirements *(mandatory)*

### Functional Requirements

**Branding & characters**

- **FR-001**: All child- and parent-facing branding MUST use "KudiCubs". No "BizKids" or "BizKidz"
  text may appear in the product.
- **FR-002**: Kudi the Cub MUST be the guide character who introduces missions, gives hints, and
  narrates outcomes in every world. Joining the game is presented as "joining the Pride".

**Onboarding**

- **FR-003**: Onboarding MUST consist of, in order: Welcome, Age Band, Avatar (character and
  nickname), Parent Gate (gate challenge, region choice, PIN set-up, parent email and privacy
  notice), then the "joined the Pride" celebration. The suggested region MUST be preselected from
  the device's country where possible.
- **FR-004**: The age band MUST be one of 4–6, 7–9, 10–12, 13–15, and MUST select the child's world
  and difficulty profile.
- **FR-005**: The child MUST provide only a nickname and choose an avatar. The system MUST NOT ask
  the child for a full name, birth date, photo, location, or contact details.
- **FR-006**: The parent gate MUST use a challenge that is hard for a young child to pass by chance
  (for example, an adult-level arithmetic or press-and-hold instruction) before the parent sets a
  4-digit PIN and enters a parent email address.
- **FR-007**: The parent email MUST create an online family account that holds the parent PIN, the
  region, and every child profile and its progress.
- **FR-007a**: Parental consent MUST be recorded when the parent confirms their email from a
  message sent to it. Child progress MUST NOT be saved to the family account before consent is
  recorded. Until then, it is kept on the device only.
- **FR-007b**: Once consent is recorded, child progress MUST sync to the family account
  automatically whenever the device is online, with no action needed from the child.
- **FR-007c**: A parent MUST be able to sign in on another device by entering the parent email
  and then a one-time code emailed to that address. No password is used. The code MUST expire
  after a short time (for example, 10 minutes), MUST work only once, and requesting a new code
  MUST make any earlier code invalid. After signing in, the parent sees all child profiles and
  their progress.
- **FR-007d**: Syncing from more than one device MUST never lose or duplicate earned coins, XP,
  badges or mission completions.
- **FR-007e**: A parent MUST be able to download a copy of their family's data and permanently
  delete the family account and all child data from the parent area.
- **FR-007f**: The family account MUST store only the parent email, PIN, region, consent record,
  and the child data allowed by FR-005 (nickname, avatar, age band, progress and rewards).
- **FR-007g**: Repeated wrong sign-in codes MUST be limited (for example, 5 wrong codes lock
  sign-in for that email for a cooling-off period). The parent PIN still guards the parent area on
  every device.
- **FR-007h**: When signing in on a new device, the parent MUST choose whether it is a "family
  device" (children play on it, with the profile picker at launch) or "This is my phone" (a
  parent device). A parent device MUST open to the parent view after the PIN, MUST show every
  child's synced progress (level, coins, savings, badges, pillar progress, recent missions), MUST
  allow the parent-area settings in FR-036, and MUST NOT offer gameplay. The parent MAY switch the
  device type at any time from the parent area.
- **FR-007i**: A family account with no parent sign-in and no child play for 12 months MUST be
  deleted automatically, together with all child data. Warning emails MUST be sent to the parent
  30 days and 7 days before deletion. Any sign-in or play resets the 12-month clock. The privacy
  notice MUST state this rule.
- **FR-008**: Onboarding progress MUST be saved after each step and resumed if interrupted.

**Home dashboard**

- **FR-009**: The home dashboard MUST show the animated avatar, an XP bar toward the next level, the
  coin balance, the current level name, a Continue action, a daily challenge card, and a badge
  preview.
- **FR-010**: Continue MUST always take the child to the next unfinished activity in their world.
  If everything is complete, it MUST offer a replay.
- **FR-011**: A new daily challenge MUST be offered each calendar day, drawn from activities in the
  child's world, with its reward and progress shown.
- **FR-012**: The dashboard MUST give a narrated, animated hint toward Continue after a period of
  inactivity.

**Worlds & missions**

- **FR-013**: The MVP MUST provide one world per age band: Money & Choices (4–6), Build & Grow
  (7–9), Founder Mode (10–12), and Side Hustle (13–15).
- **FR-014**: Each world MUST show its missions as cards with a progress indicator. The first
  mission MUST be open, and each later mission MUST be visibly locked with an unlock hint until
  the mission before it is completed.
- **FR-015**: The MVP MUST include all 17 missions from the content deck, in this order per world:

  | World | # | Mission | Concepts | Pillars |
  |-------|---|---------|----------|---------|
  | Money & Choices (4–6) | 1 | The Lost Coins | What is money; saving vs spending | Know, Understand |
  | | 2 | Shopping for a Picnic | Needs vs wants | Understand, Decide |
  | | 3 | Saving for a Bicycle | Saving vs spending; earning | Understand, Decide |
  | | 4 | Building a Playground Together | Teamwork, shared goals | Share |
  | | 5 | The Rainy Day Umbrella | Needs before wants | Understand, Decide |
  | Build & Grow (7–9) | 1 | Birthday Party Budget | Budgeting | Decide |
  | | 2 | The Lemonade Challenge | Profit and loss | Understand, Decide |
  | | 3 | The Toy Shop | Marketing choices | Decide |
  | | 4 | The Pizza Festival | Budgeting, marketing, profit and loss, competition | Decide, Invest |
  | Founder Mode (10–12) | 1 | Start-up Funding for a Clothing Brand | Equity vs debt; raising capital | Know, Invest |
  | | 2 | Keep the Company Running | Financial planning | Decide |
  | | 3 | Business Island | Full company management; company structures | Decide, Share |
  | | 4 | Battle of the Brands | Competition, market strategy | Understand, Decide |
  | Side Hustle (13–15) | 1 | Side Hustle Simulator | Entrepreneurship, budgeting | Decide |
  | | 2 | Budget Boss Challenge | Budgeting, planning, delayed gratification | Decide |
  | | 3 | Investment Arena | Basics of investing, risk, diversification | Know, Invest |
  | | 4 | The Big Purchase | Saving plans; real-life financial decisions | Decide, Invest |

  Each mission's activities, decision moments and rewards MUST follow `docs/source/BIZ KIDS
  Content.pptx`, adjusted only where the constitution requires it (see Assumptions).
- **FR-015a**: The MVP MUST be released in four stages:

  | Stage | Contents |
  |-------|----------|
  | 1 | Everything outside the worlds (onboarding, family account and sync, dashboard, daily challenge, wallet, progress, profile, parent area, all six screen types, all three regions), plus the complete Money & Choices (4–6) world |
  | 2 | Build & Grow (7–9) |
  | 3 | Founder Mode (10–12) |
  | 4 | Side Hustle (13–15) |

  Each stage MUST be a complete, releasable app update that keeps all existing child progress.
- **FR-015b**: An age band whose world has not been released yet MUST appear as "Coming soon" in
  age-band selection and in the parent area, and MUST NOT be selectable. When its world is
  released, the parent can move a child to that band from the parent area, keeping all earned
  rewards.
- **FR-016**: Every mission MUST follow the core loop: Mission Intro → one or more Decision →
  Result rounds → Round Summary → Reward → back to Home.
- **FR-017**: Missions MUST be built from six reusable screen types. Every mission also gets two
  framing screens, provided automatically by the mission engine: **Mission Intro** (first) and
  **Reward** (last). Content supplies only their words, narration and art.
  - **Activity (mini-game)**: a hands-on mini-game such as find items, sort into jars, or count
    items (for example, the find, sort and count activities in The Lost Coins).
  - **Decision**: a scenario illustration, a question, 2–3 choice cards, and an optional
    feedback preview.
  - **Resource Management**: a budget display, item cards, quantity selectors, and the
    remaining balance.
  - **Action Result**: an outcome animation (for example, coins flying), the gain or loss, XP
    gained, and a feedback message.
  - **Market Simulation**: customer avatars, live sales, and demand and price-satisfaction
    indicators.
  - **Round Summary**: revenue, costs, profit (or, for 4–6, what the child did), what went well
    and what to try next, and the next actions.
- **FR-018**: Every mission MUST be tagged with one or more curriculum pillars (Know, Understand,
  Decide, Invest, Share), and completing it MUST add progress to those pillars.

**The Lost Coins (4–6)**

- **FR-019**: The Lost Coins MUST include four activities in order: find the lost coins in a
  scene, sort them into jars by value, count the coins in each jar, and decide whether to save
  or spend.
- **FR-020**: Coin values, denominations and appearance in The Lost Coins MUST come from the active
  region's configuration.
- **FR-021**: The save-or-spend decision MUST include a short, skippable, narrated explanation of
  saving and spending, and MUST NOT block the child from choosing.
- **FR-022**: Saving MUST move the coins into the child's savings. Spending MUST give an immediate
  cosmetic treat. Both outcomes MUST be presented positively.
- **FR-023**: Correctly sorting all coins MUST award bonus coins, as the source describes.
- **FR-024**: The Lost Coins MUST teach the concepts "what is money" and "saving vs spending", and
  MUST be tagged with the Know and Understand pillars.

**Rewards & progression**

- **FR-025**: The reward system MUST include coins (in-game money), XP (learning mastery), badges
  (skills), and levels (business growth).
- **FR-026**: Each world MUST define named levels (for example, "Lemonade Helper", "Junior
  Entrepreneur"). Reaching a level MUST trigger a Level Up celebration listing what it unlocked.
- **FR-027**: Rewards, once earned, MUST never be taken away as a penalty.

**Age-adaptive behaviour**

- **FR-028**: For 4–6, every activity MUST be completable without reading, instructions MUST be
  short and narrated, and the child MUST NOT see a failure, game-over or "wrong" screen.
- **FR-029**: For 7–9, activities MAY include simple calculations and light time pressure, and MUST
  show consequences clearly and offer Try Again after any unsuccessful outcome.
- **FR-030**: For 10–12, activities MAY include simplified real-world terms (for example, equity,
  debt, cash flow), simple data and reports, and multiple valid strategies, and MUST offer
  Try Again.
- **FR-031**: For 13–15, activities MAY include realistic consequences and long-term trade-offs (for
  example, "Temptation Alerts" to spend now or save), and MUST offer Try Again.
- **FR-032**: Try Again MUST replay the round without losing anything earned before it.

**Wallet & progress**

- **FR-033**: The Wallet MUST show the coin balance, savings, a chronological history of earnings
  and spending, and bar charts of where money came from and went.
- **FR-034**: The Progress screen MUST show the level path, a badge grid (earned and locked),
  skills unlocked, and progress per curriculum pillar.

**Profile & parent area**

- **FR-035**: The Profile MUST show the avatar, nickname and level, sound and narration settings,
  and an entry to the parent area.
- **FR-036**: The parent area MUST require passing the parent gate and the PIN, and MUST let the
  parent view each child's progress, change a child's age band, add, edit or remove child
  profiles, change the region, and change the PIN and email.
- **FR-037**: After 5 consecutive wrong PIN attempts, the parent area MUST lock for a cooling-off
  period, and PIN reset MUST be available through the parent email.
- **FR-038**: The app MUST support more than one child profile per family, with a picture-based
  profile picker at launch when there is more than one.

**Safety, privacy & localisation**

- **FR-039**: All in-game currency MUST be fictional, MUST NOT be purchasable with or convertible
  to real money, and the MVP MUST contain no real-money purchases.
- **FR-040**: The MVP MUST contain no chat, no messaging, no user-generated content shared between
  users, and no multiplayer. Missions the source describes as competing with other players
  MUST use computer-controlled rivals. Leaderboards, if shown, MUST rank the child only against
  those rivals.
- **FR-041**: The MVP MUST NOT include third-party advertising or behavioural tracking.
- **FR-042**: External links and anything else that leaves the game MUST be behind the parent gate.
- **FR-043**: Currency name, symbol, denominations, prices and market examples MUST come from
  per-region configuration. The MVP MUST launch with three regions:
  - **Ghana**: Ghana cedi (GH₵, cedis and pesewas)
  - **Nigeria**: Nigerian naira (₦, naira and kobo)
  - **United Kingdom**: pound sterling (£, pounds and pence)

  Each region MUST include coin and note art and market examples that suit that country. The
  parent MAY change the region at any time from the parent area. Coin amounts already earned are
  kept and shown in the new currency.
- **FR-044**: Every child-facing instruction, prompt and outcome MUST have audio narration, and all
  child-facing text and audio MUST be replaceable per language.
- **FR-045**: Gameplay and progress MUST work without an internet connection once the app and its
  content are installed. Only family account creation, email confirmation, signing in on a new
  device, and syncing need a connection.
- **FR-046**: Each mission MUST be fully localised for all three launch regions before the stage
  that contains it is released, including narration audio and regional examples (Constitution VI
  and VII).
- **FR-047**: Stage 1 and every later stage MUST be released on both Android and iOS, on phones and
  tablets, with layouts adapted to each screen size. The minimum supported device is a budget
  Android phone with about 2 GB of memory. Exact minimum operating system versions are set during
  planning.

### Key Entities *(include if feature involves data)*

- **Family Account**: The online account created with the parent email. Holds the parent PIN, the
  region, the consent record, and one or more child profiles. Can be signed into from several
  devices, exported and deleted.
- **Consent Record**: When and how the parent confirmed their email and agreed to the privacy
  notice.
- **Device**: A phone or tablet signed in to the family account. Its type is "family device"
  (children play) or "parent device" (parent view only).
- **Child Profile**: One child: nickname, avatar, age band, coin balance, savings, XP, level,
  badges, pillar progress, and mission progress. Holds no other personal data.
- **Age Band**: One of 4–6, 7–9, 10–12, 13–15. Selects the world and the difficulty rules.
- **World**: The themed setting for one age band. Contains missions or businesses, named levels,
  and unlock rules.
- **Mission**: A playable unit in a world. Has an intro, an ordered set of activities, the screen
  types used, curriculum pillar tags, concepts taught, and rewards.
- **Screen Type**: One of Activity (mini-game), Decision, Resource Management, Action Result,
  Market Simulation, Round Summary. Reused across missions and worlds. Mission Intro and Reward
  are framing screens that every mission gets.
- **Reward**: Coins, XP, a badge or a level-up given for an achievement.
- **Badge**: A named skill recognition (for example, Smart Saver, Hard Worker), with how it is
  earned.
- **Wallet Transaction**: One earn, spend or save event, with amount, source or destination,
  and time.
- **Daily Challenge**: A once-per-day activity drawn from the child's world, with progress and a
  reward.
- **Curriculum Pillar**: One of Know, Understand, Decide, Invest, Share, with the concepts it covers.
- **Region Configuration**: Currency name, symbol and denominations, coin and note art, price
  ranges, market examples, and the default language.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A parent and child complete onboarding together in under 4 minutes, in at least 90%
  of pilot sessions.
- **SC-002**: At least 85% of 4–6 year olds in pilot sessions complete "The Lost Coins" end to end
  without adult help and without needing to read.
- **SC-003**: In moderated pilot sessions, children in every age band hesitate (fail to act for more
  than 10 seconds without a hint appearing) in fewer than 1 in 20 screens.
- **SC-004**: 0 failure, game-over or "wrong" screens are reachable by a 4–6 profile, verified by
  playing every 4–6 path.
- **SC-005**: 100% of unsuccessful rounds for 7–15 profiles offer Try Again, and no coins, XP or
  badges are lost on retry.
- **SC-006**: Fewer than 1 in 50 attempts by children aged 4–9 pass the parent gate in pilot
  testing.
- **SC-007**: After playing The Lost Coins, at least 75% of 4–6 pilot children can say (or show)
  the difference between saving and spending when asked by an adult.
- **SC-008**: Switching between Ghana, Nigeria and the United Kingdom changes the currency name,
  symbol, coins and market examples on every screen with no code change, verified for all 17
  missions.
- **SC-009**: At least 80% of pilot parents rate the experience as safe and appropriate for their
  child (4 or 5 out of 5).
- **SC-010**: Every screen responds to a tap with visible or audible feedback that children perceive
  as immediate, and a mission loads within 3 seconds on the minimum supported device (a budget
  Android phone with about 2 GB of memory).
- **SC-011**: Progress earned on one device appears on a second signed-in device within 1 minute
  of both being online, with zero lost or duplicated rewards across 100 test sync cycles.
- **SC-012**: At each stage's release, every mission in that stage can be completed end to end by
  pilot children in its age band, with at least 80% completing each mission without adult help.
  By the end of Stage 4, all 17 missions meet this bar.
- **SC-013**: Each stage update installs over the previous stage with zero loss of child profiles,
  coins, XP, badges or mission progress.
- **SC-014**: Every Stage 1 mission plays smoothly, without visible stutter or crashes, on the
  minimum supported device and on a current iPhone and iPad, across a full pilot session.
- **SC-015**: 100% of family accounts inactive for 12 months are deleted within 7 days of the
  deadline, and every one of them received both warning emails first, verified with test
  accounts.

## Assumptions

- **Age bands**: The thought paper lists three bands (4–12). The content deck and the constitution
  use four (4–15). The MVP follows four bands.
- **World names**: The 4–6, 7–9 and 10–12 world names come from the thought paper. The client
  confirmed "Side Hustle" for 13–15.
- **Mission names and order**: These follow the content deck, which is treated as the source of
  truth for missions. The thought paper's "Juice Stand" mockup is the layout reference for The
  Lemonade Challenge.
- **Pillar tags**: The pillar tags in the FR-015 mission list are proposed, not taken from the
  source, and can be adjusted.
- **Language**: All three launch regions use English. Narration voices and examples MAY differ by
  region.
- **Money "in a bank on the app"** (The Big Purchase): This is a simulated, fictional bank with
  in-game interest only (Constitution V).
- **Curriculum pillars**: The pillars are not defined in the source. The assumed mapping is:
  - **Know**: what money is
  - **Understand**: saving vs spending, needs vs wants, profit and loss
  - **Decide**: budgeting, pricing, choices
  - **Invest**: investing, growth, capital
  - **Share**: teamwork and sharing
- **The "spend" outcome**: The source offers save or spend without saying what spending buys. A
  cosmetic treat (for example, an avatar accessory or sticker) is assumed.
- **Explainer pop-ups**: The source's "pop up explaining saving/spending" is kept but made short,
  narrated and skippable, to satisfy the constitution's "no lectures" rule.
- **Round Summary for 4–6**: The source's "what you did right/wrong" is phrased as "what went well
  / what to try next". Wording that labels choices as right or wrong is never used for 4–6.
- **Child data**: The source asks for the child's "Name". It is narrowed to a nickname to satisfy
  minimal data collection (Constitution V).
- **Parent gate**: The source offers "simple math or PIN". A gate challenge plus a PIN is assumed,
  because simple math alone can be passed by older children.
- **Devices**: Android and iOS phones and tablets, confirmed in Clarifications (FR-047).
- **Pilot**: The MVP is validated through a pilot with parents and schools, as in the thought
  paper's Phase 1. Success criteria are measured in moderated pilot sessions, not by tracking
  children.
- **Mockups**: The mockup boards in the thought paper are layout references only. They show
  "BizKids" branding, which is replaced.
- **Out of scope**: multiplayer and team play, competing with other players (the source's
  "compete with other players" missions use computer-controlled rivals in the MVP), teacher and
  school dashboards, real payments, more industries, and curriculum and partner integrations.
