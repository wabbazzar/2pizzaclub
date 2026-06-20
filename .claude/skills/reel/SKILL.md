---
name: reel
description: Ingest an Instagram reel into the 2pizzaclub timeline — capture + transcribe, decompose every claim into the A/B/C editorial split, verify against our own EFTA corpus first, write evidence records, wire them into the site, and end with a printed A/B/C split plus a proposed-push (a go/no-go next-investigation suggestion). Use when the user says /reel, pastes an Instagram reel URL (instagram.com/reel/<shortcode>) with no other instruction, or asks to ingest / process / log / "do the editorial pass on" a reel.
---

# /reel — reel ingest + editorial pass

The user drops Instagram reel URLs; this turns each one into a sourced,
A/B/C-decomposed addition to the timeline. The full mechanical procedure and
all editorial law live in `CLAUDE.md` ("Reel ingest — the standard procedure",
"Editorial voice", "No official story as truth", theme + site-mechanics
sections) — **read those rules, don't restate them in your head wrong.** This
skill is the operational checklist + the two output blocks that must appear
**every** time, so ingests stay consistent across agents and sessions.

Fires on a bare reel URL too: if the user pastes `instagram.com/reel/<code>`
with no other instruction, that IS the request — load this skill and run it.

## The non-negotiable output contract

Two blocks are REQUIRED at the end of every ingest, even a trivial one. They are
the whole point of this skill. Never skip them, never bury them.

1. **The A/B/C split** — printed in the final summary, matching the
   `editorial_split` you wrote to the capture's `meta.json`.
2. **A proposed push** — 1–3 concrete next-investigation suggestions the user
   can go/no-go (or ignore by dropping the next reel). See the templates below.

## Run order

### 1. Capture + transcribe

```bash
cd /home/wabbazzar/code/2pizzaclub
node tools/ingest-reel.mjs "<URL or SHORTCODE>"
```

(yt-dlp original + delivery webm + frames + whisper transcript + meta.json +
captures/manifest.json. ~1–2 min. Multiple reels: sequential. See CLAUDE.md for
`--skip-capture`, cookies for login-walled reels, the stale-yt-dlp gotcha.)

### 2. Read + identify

Read `sources/captures/<code>/transcript.txt` and the first frame
`frames/f001.png`. Identify the speaker and note the on-screen cover/overlay
text and the caption separately from the spoken audio — **claims that live only
in the caption or cover card are not the same as spoken claims**, and the split
must say which is which. (Recent reels have buried the inflammatory claims in
the cover card while the audio is tamer; that's a Group-C tell.)

### 3. Decompose — the strict A/B/C rubric

Every distinct claim → exactly one group. Count with a **strict hand**; the
gallery cinema sorts by `a/(a+b+c)`, so `a` must be hard to earn.

- **A (verifiable)** — independently verified **true**, backed by a
  `status:"verified"` evidence record, AND not the reel's disputed framing. A
  record that merely documents someone *said* X, or one still `draft` /
  `primary-link-pending` / `contested-*`, is **not** A.
- **B (disputed)** — real but contested in mainstream sources, OR any
  conspiracy / false-flag / inside-job / foreknowledge framing, OR any claim
  whose record is non-verified. **When torn between A and B, choose B.**
- **C (invented)** — asserted with no primary trace. No evidence record. Lives
  only in `implied_frame` / `notes`.

Decomposition is **factual only** — never inject moral labels
("antisemitic" / CYA caveats) into the split. Record the counts as
`editorial_split: {"a":N,"b":N,"c":N}` on `meta.json`. Set it HERE, by hand,
from your own decomposition — it is not regenerated nightly.

### 4. Verify — corpus FIRST, then external

For every named person/entity/event, **grep our own EFTA corpus before any
third-party source** (`~/data/epstein-files/work/corpus.jsonl`; recipe in
CLAUDE.md / `/epstein`). If the subject is in the release, our own primary doc
is the strongest citation — cite the bates id `type:"primary"`, link the
viewer, put the verbatim line in `quote`. Then `WebSearch` → `WebFetch` the
canonical primary for any external claim and capture its verbatim quote.

### 5. Write records (Group A only) + wire up

Per `sources/SCHEMA.md`. For each Group-A claim:
`sources/evidence/<year>-<slug>-NN.json` (`id, anchor, year, era, themes,
claim, sources, status, notes`). Then:

1. Add filename to `sources/evidence/manifest.json` `records[]`.
2. Append record id to the capture's `meta.json` `evidence_records[]`.
3. New anchor? → nav entry in `index.html` + chapter shell in the right era +
   blurb in `chapters/narrative.json`. Reuse an existing anchor when one fits
   (e.g. the Epstein cluster lives at `y2019`).
4. `node tools/clip-evidence.mjs <id>` (from the dev-browser playwright dir) for
   any source that has BOTH a public URL and a `quote` — DS-corpus docs with
   `url:null` get no clip, the verbatim renders as text instead.
5. **Rebuild the semantic search index** so the new records are findable in the
   search bar: `node tools/build-rag-index.mjs && node tools/rag-eval.mjs`
   (re-embeds all manifest records; eval must stay 5/5; commit `rag-index.json`).
   The index is precompiled, not built at runtime — skip this and the new claims
   won't appear in search. Also rebuild if you EDIT any existing `claim`/`quote`
   text (offsets drift otherwise). See CLAUDE.md → "Timeline semantic search".
6. Screenshot-verify the card/chapter renders AND the search bar returns it,
   before calling it done (`python3 -m http.server` on a fresh port + dev-browser).

### 6. Commit (own files only) + push

Stage explicit paths only — never `git add -A` (other agents are mid-task in
the same tree). Clean message, **no Claude attribution**. `git commit` →
`git pull --rebase --autostash` → `git push`. Confirm others' modified/untracked
files are untouched afterward. End site work by sharing the live URL to the
exact chapter (per the always-share-a-URL rule).

## Output block templates

End the run with these, filled in:

```
### A/B/C split — <N>/<N>/<N>
- A (verifiable, recorded): <one line per Group-A claim → record id>
- B (disputed): <short list of the contested framings>
- C (invented / caption-only): <short list, note if cover/caption vs spoken>
```

```
### Proposed push — go / no-go
1. <strongest lead> — "I did <X>; I could <specific deeper dig: a corpus
   sweep, a primary-doc pull, a second record on thread Y> to <what it'd add>."
2. <optional second lead>
3. <optional third lead>
(Reply go / no-go on any, or just drop the next reel.)
```

Keep the push **concrete and bounded** — a named doc to pull, a specific
corpus phrase to grep, a specific second record to write — not "research more."
If the reel was fully mined and there's genuinely no further thread, say so
plainly rather than inventing a push.
