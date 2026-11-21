# KudiCubs: Voice Direction Brief

**For**: the voice actor and the recording studio.

**With**: [narration-script.md](./narration-script.md), which lists every line with its ID,
delivery note, target length and file name.

**Status**: casting not started. The **first recording language is Ghanaian English
(provisional, waiting for the client's confirmation)**.

## 1. The project

KudiCubs is a money and entrepreneurship game for children aged 4 to 15. You are the voice of
**Kudi the Cub**, a friendly lion cub who guides **4–6 year olds** through short market
adventures: finding lost coins, sorting them into jars, counting them, and choosing whether to
save or spend.

Most listeners **can't read yet**, so your voice is how they understand what to do and how they
feel about it.

## 2. The voice we're looking for

- **A warm, friendly female storyteller.** Think of a favourite aunty or a nursery teacher who
  loves story time.
- **A natural, local Ghanaian English accent.** We want her own accent, not a "neutral" one. If
  the first language changes, the same brief applies to Nigerian or British English.
- **A smile you can hear.** Lift the corners of your mouth. Kudi is always glad to see the child.
- **A natural pace for young children**: about **120–140 words per minute**. That's slower than
  conversation, but never drawn out. Leave a short breath between ideas.
- **Never robotic, flat, sing-song or "announcer".** Never sarcastic, never scolding.

**Tone reference (for tone only):** https://www.youtube.com/watch?v=47MNn4bsmSw

This shows the kind of warmth and storytelling energy we mean. **Do not copy, closely imitate or
try to sound like that performer**, and the recording must never be used to clone or train a
voice. We want *your* voice.

## 3. Delivery notes

Each line in the script has one of these notes.

| Note | What it means | ✅ Like this | ❌ Not like this |
|---|---|---|---|
| **excited** | Bright, a little faster, rising energy, and a real smile | "Oh no! Coins are lost in the market." (as if sharing a fun mystery) | Shouting, or alarm |
| **warm** | Relaxed, kind, steady | "Pick a friend, then pick a name." | Bored or instructional |
| **gentle, slow** | Softer and slower, each idea clear | "Saving keeps coins for later. Spending gets something now." | A lecture, or a sleepy drone |
| **celebrating** | A big happy lift, as if you're clapping | "Yes! In it goes!" | Over the top or screamy |
| **curious question** | Genuinely asking, inviting, with the pitch rising at the end | "Which jar has the most coins?" | A quiz-master or test voice |
| **encouraging** | "You can do it", with a soft smile | "Hmm, let's try a different jar!" | Disappointment, a sigh, or "wrong" in your tone |
| **proud** | Warm pride in the child | "You counted every coin!" | Smug or teacherly |
| **playful** | Light, bouncy, a little cheeky | "Play. Earn. Roar!" (with a tiny playful roar) | A silly cartoon voice |
| **calm** | Even and clear; used for names and labels | "Coins from games." | Monotone |

**The golden rule:** a mistake is never a failure. The encouraging lines must sound like you're
on the child's side.

## 4. Lines

- **Every line is 8 seconds or less, with one idea.** Read it as written. If something feels
  unnatural to say, flag it and don't change it on the spot. We'll update the script.
- **Numbers** (`num.1` to `num.20`) are counted aloud one at a time: "One!", "Two!"… Keep them
  bright and evenly paced, because they play as a child taps each coin.
- **Names** (coins, friends, badges, levels) are short and clear. Say them as if you're showing
  the child something lovely.
- **Region lines** are marked GH, NG or UK in the script. In a Ghanaian English session, record
  the GH lines first. The NG and UK lines are recorded later by their own voices.

## 5. Pronunciation

| Word | Say it like | Notes |
|---|---|---|
| pesewas | peh-SEH-wahs | Ghana minor unit |
| cedi / cedis | SEE-dee / SEE-deez | Ghana currency |
| kelewele | keh-leh-WEH-leh | Spicy fried plantain (a Ghanaian treat) |
| sobolo | soh-BOH-loh | Hibiscus drink (Ghana) |
| kobo | KOH-boh | Nigeria minor unit (later NG session) |
| naira | NIGH-rah | Nigeria currency (later NG session) |
| puff-puff | PUFF-puff | Nigerian treat (later NG session) |
| zobo | ZOH-boh | Hibiscus drink (Nigeria) |
| Kofi / Ama | KOH-fee / AH-mah | Child names |
| Kudi | KOO-dee | The cub's name |

If your natural local pronunciation differs from this table, **use yours** and note it. Local
authenticity matters more than the table.

## 6. Session tips

- Record **three takes** of each line and mark the best one.
- Take a **short pause before and after** each take (about 150 ms of room tone).
- Keep the same distance from the mic and the same energy across the session, so lines
  recorded on different days sound alike.
- Drink water, and take breaks. There are about 140 short lines, roughly 2–3 hours with
  retakes.

## 7. Files and format

| | Masters (studio) | Prototype files |
|---|---|---|
| Format | WAV, 48 kHz, 24-bit, **mono** | AAC (`.m4a`), mono, 64 kbps |
| Level | Peaks no higher than −3 dBFS; loudness around −16 LUFS (spoken word) | Same, after conversion |
| Name | `<lineId>.wav`, e.g. `intro.say.wav` | `<lineId>.m4a` |
| Folder | `masters/en-GH/` | `prototype/assets/audio/en-GH/` |

- **One file per line ID.** The IDs and names are in the "File naming table" at the end of the
  script.
- No music, effects or processing beyond gentle noise reduction and levelling.
- Deliver the masters as a zip. The team converts them with `tools/design/encode-audio.mjs`, or
  you can also deliver `.m4a` files directly.

## 8. Consent and usage

Before recording, the actor and the client sign a usage agreement:

- **Use**: the recordings are for the KudiCubs app, its prototypes and its marketing.
- **No synthetic re-use**: the recordings **must not** be used to create a synthetic, cloned or
  AI voice, or to train any voice model, **without separate, explicit written consent** from the
  actor.
- **Credit and payment** terms are set out in the agreement.
- **Children's privacy**: the recordings contain no information about any child.

## 9. Checklist before you start

- [ ] You've read this brief and the script.
- [ ] You know which language session this is (en-GH first).
- [ ] The pronunciations are agreed (§5).
- [ ] The usage agreement is signed (§8).
- [ ] Files are named exactly by line ID (§7).

## 10. The scratch track (temporary, not a casting decision)

Until the human recordings exist, the prototype can play a **scratch track** so the client and
reviewers can hear the flow (spec 004, FR-012–FR-022):

- **What it is**: pre-generated audio from the stock neural voice `en-NG-EzinneNeural`, about
  10% slower for ages 4–6. It's made by `scripts/generate-scratch-voice`, one MP3 per line ID,
  in `prototype/assets/audio-scratch/<lang>/`. That folder is kept apart from the human
  recordings.
- **What it isn't**: a casting decision, a clone of anyone, or a copy of the tone reference.
  The casting brief above, a warm Ghanaian female storyteller, is unchanged. The scratch voice
  is Nigerian English for every region, including Ghana.
- **Playback**: a human recording always wins. Scratch audio plays only where no recording
  exists yet. Nothing is ever synthesised in the browser.
- **Labelled**: with reviewer notes on, each line shows "Scratch voice" or "Recording pending",
  and the reviewer menu counts recorded, scratch and pending lines per language.

> **⚠ Release blocker RB-1: scratch audio MUST be replaced by human recordings before any
> public release.** `node tools/design/check-no-tts.mjs --release` fails while any scratch file
> or scratch status exists. To remove the scratch track, delete
> `prototype/assets/audio-scratch/` and run `node tools/design/build-narration.mjs`.
