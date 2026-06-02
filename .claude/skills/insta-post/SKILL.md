---
name: insta-post
description: Prime on the 2pizzaclub Instagram-carousel workflow at `drafts/instagram/<post-set>/` — the data-object structure for every post, the cover-voice rules the user enforces, the mascot library, the template stack (cards.json + card.html + render.mjs + send-carousels.mjs), and the Signal delivery loop. Use when the user says /insta-post, /instagram, /ig, asks to build/edit Instagram posts or carousels, work on cover slides, mascots for IG, or wants to send rendered post mockups to Signal.
---

# /insta-post — 2pizzaclub Instagram carousels

A repeatable pipeline for editorial Instagram carousels derived from the timeline + the `/efta/` deck. Each post = one cover (the hook) + N receipts/stats (the evidence). The user is the editor; the agent is the structure-and-render layer. **The user picks voice. The agent presents options, never improvises punchlines.**

Reference build (the one the system was developed on, 2026-06-01): **`drafts/instagram/efta-intro/`** — 4 carousels (1A · 1B · 2 · 3) cut from the 4-slide `/efta/` intro deck. Every script and template that exists, exists there. Copy that directory wholesale as the starting point for a new post set.

## How the user works with the agent (THE workflow)

**For each new post,** lay it out as a data object before writing copy. Do not freestyle.

```
post {
  id, title, tag_top:    "// the editorial-section slug"
  what_the_slides_do:    one-sentence purpose
  contents:              the actual receipts/stats that will appear
  leading_question:      what a reader naturally wants to know going in
  punchline:             the payoff the receipts deliver
  cover_candidates:      3–4 spunky options across formats — Q / statement
                         / quote-led / number-led / cause-effect
}
```

Present the data object **plus a small-multiples table** of 3–4 cover candidates. The user picks one or rewrites. **Do not pre-render images during this discussion.** Once copy is locked, then render.

```
| | Format | Cover copy |
|---|---|---|
| A | Question | "..."  |
| B | Statement | "..."  |
| C | Quote-led | "..."  |
| D | Number-led | "..."  |
```

Pattern the user landed on (reference build):
- **1A** (1 receipt) — verbatim quote on the cover: *"They would have to cancel the election."*
- **1B** (3 receipts) — question naming the three institutions: *"What connects a US President, the British baron behind Macmillan textbooks, and Bill Gates?"*
- **2** (4 stats) — bare question: *"What's a 'co-opted Mossad agent'?"*
- **3** (3 stats) — question with subline answer: *"What does $32 million buy you in Kentucky? / One Congressman, removed."*

## Cover-voice rules (THE most-violated)

The session went through ~6 cover rewrites because the agent kept breaking these. Read them and don't drift.

1. **The cover must be UNIQUE against the receipts. Never restate the receipt verbatim on the cover.** The cover asks the question the receipt *provokes*. Bad: cover says *"They would have to cancel the election"* + receipt repeats the exact quote → boring. Good: cover asks *"What are the grounds for canceling a 2016 election?"* + receipt delivers the Mark Epstein quote as the answer.
2. **No call-and-response inserts.** Don't add an "announcement slide" between cover and receipts that just shouts the answer. The receipts ARE the statement. That layer was tried; user called it "noise that doesn't add anything to the story."
3. **Don't pre-answer the cover with the obvious payoff** (e.g. don't write "…One Jeffrey Epstein" on a cover whose receipts will reveal Epstein). Let the receipts deliver.
4. **Voice failures to avoid:** the agent is not good at humor / spunk / "PSA-cheery". User direct quote: *"you're not very good at this."* So: don't write *"Say, kids!"* / *"Boy howdy!"* / *"Gee whiz!"* / *"Pop quiz, neighbor!"* unless the user explicitly asks for that register. Default to **flat-but-hard** — state the question, no kitsch, no dress-up. *"Today's word from your friends at the Bureau: what's a 'co-opted Mossad agent'?"* got rejected for being too dressed up. Just *"What's a 'co-opted Mossad agent'?"* won.
5. **Recognition over precision.** If an institution isn't recognizable to US Instagram readers, name a recognizable proxy and verify it's accurate. Maxwell → *"the British baron behind Macmillan textbooks"* (Macmillan is real; McGraw-Hill is **not** Maxwell-owned, common confusion). When using a proxy, also update the *receipt body* to lead with the same institutional anchor so the cover hook pays off.
6. **Order matters.** Within each post, the receipt/stat that DIRECTLY answers the cover question goes first after the cover. The rest are backup. Renumber `num` fields ("01 / 04" etc.) to match the new ordering — they're hand-set in `cards.json`, not auto-derived.
7. **Click + sense.** *"we want people to click on these but they need to make logical sense."* The cover must be a logical hook for the receipts. *"What did it cost to ask for the Epstein files?"* failed because asking is free — the actual cost was the seat. *"What does $32 million buy you in Kentucky?"* won.
8. **Vary the construction across the SET.** Don't open every cover with "What ___?" — a stack of identical question stems reads repetitive (user: *"feels repetative"*). Mix formats across the carousel: question / flat statement / number-led / cause-effect / joke-setup. A cover only needs the question form when its mascot is the **asker** (the floating `?`); covers carrying an object icon (ballot box, money bag) or the **stater** kid can be statements. Worked set: 1A *"How much dirt does it take to cancel an election?"* (Q) · 1B *"A President, the Macmillan baron-Mossad agent, and Bill Gates walk into the same address book."* (joke, stater) · 2 *"The FBI wrote down what Jeffrey Epstein actually was."* (statement) · 3 number-led. Keep mascot↔voice matched: asker `?` = a question; stater/object = fine for a statement.

## Mascot library (`drafts/instagram/efta-intro/templates/mascots/`)

All Gemini Nano Banana (see [[reference-gemini-nano-banana-for-poses]]). Backgrounds stripped to transparent alpha via `strip-mascot-bg.py` (flood-fills from the four corners; backup originals in `mascots/.bg-bak/`).

| File | Character | Pose | Use for |
|---|---|---|---|
| `SHIP-1-kid-salute.png` | kid, yellow shirt + bow tie + sweater vest | Boy-Scout salute | early cover concept (centered) |
| `SHIP-2-kid-callout.png` | same kid | cupped hand calling out | cover (split) when calling attention right |
| `SHIP-3-man-thumbsup.png` | adult man, navy shirt + yellow badge | double thumbs-up | "everything is fine, citizen!" ironic |
| `SHIP-4-man-pointing.png` | same man | finger pointing right | gesture-to-text-element |
| **`SHIP-5-asker.png`** | kid, yellow shirt + navy suspenders | head tilt + finger on chin + floating `?` | **question covers** (default character) |
| `SHIP-6-announcer.png` | same man | old-timey megaphone, mid-shout | retired (was the announcement layer; cut) |
| `SHIP-7-stater.png` | same kid | finger raised UP, declaring | statement covers (kid variant) |
| `SHIP-8-gman.png` | **REJECTED** — stern federal G-man | arms crossed | do NOT use: cold/authoritarian, breaks the whimsical tone (user-rejected) |
| **`SHIP-9-host-woman.png`** | whimsical blonde TV co-host, mustard blouse + red neckerchief | hands clasped at cheek, delighted | **statement covers** (Big Shot register; on post 2) |

The kid and man share a face (man = "kid grown up"); the user dislikes that, so the man variants (`SHIP-3/4/6/8`) are effectively retired. The two characters in active use are the **kid** (`SHIP-5` asker) and the **host-woman** (`SHIP-9`). New characters should be visually DISTINCT, not age-variants of an existing one — see [[feedback-visual-tone-comic-big-shot]].

Per-mascot split-layout offsets live in `card.html` (keyed on `data-mascot*=`): the asker uses the default `-280px`; `stater` and `host` are nudged right (`-225`/`-210px`) so their gesture/figure clears the left edge; an arms-crossed bust (`gman`) needs a narrower width. When a new mascot's limb or content clips at the card edge, give it its own `data-mascot` offset rather than changing the shared rule.

**Statement covers want a different character** — the asker's floating `?` reads as "asking", mismatches statement copy. The user asked for a stater mascot but it hadn't been generated yet at session end. When generating:
- Use Gemini Nano Banana (`fal-ai/nano-banana`), not Flux — Flux Pro v1.1 refuses every dynamic pose (validated over 16 generations, see memory)
- Match the kid bible: "wholesome cartoon boy ~10, neat brown side-part hair, large round eyes with white sparkle highlights, rosy cheeks, mustard-yellow short-sleeve collared shirt, navy-blue suspendered trousers"
- Stater pose ideas: pointing at camera "matter of fact", hand on hip with knowing smile + raised index finger, holding up a small open hand "here's the thing"
- Background: solid cream `#FFF8E7`, no patterns/sunbursts/halftone — Gemini still sometimes adds decoration; strip with the script
- After generation, run `python3 strip-mascot-bg.py` to alpha-out the bg before compositing

## Cover imagery — the per-card theme (the imagery rule)

**Each cover's icon is drawn from THAT card's content. Do not reuse one generic mascot across every cover.** Repeating the same character (e.g. the kid-asker on 3 of 4 covers) makes the set read as a template and wastes the cover — the highest-value real estate for a click. The cover image should telegraph what the post is about before a word is read. (User correction, this session: "the repetitive nature of same person icon… tailor a theme/look/feel to each card.")

Tone is fixed by CLAUDE.md "Visual tone" + [[feedback-visual-tone-comic-big-shot]]: warm, whimsical, comic — "fun and silly about dark things." Never cold/authoritarian.

Two icon flavors, pick per card:

1. **Anthropomorphized object** (a thing-with-a-face) — best for concept/number/abstract cards. The object is the card's subject. Worked examples (efta-intro):
   - 1A "what cancels an election" → a nervous **modern ballot box**
   - 3 "$32M buys a Congressman" → a smug **money bag**
   - (tried, then cut: a **case file** for post 2 — user kept the host-woman there instead)
2. **Character mascot** — the **kid** (`SHIP-5` asker) for question covers, the **host-woman** (`SHIP-9`) for statement covers. Use where a presenter actually fits the card.

**Avoid real-person caricatures.** Cartoonized likenesses of named figures (Trump/Gates) were tried via Flux and dropped: Flux gets the likeness but renders too detailed/semi-realistic and clashes with the flat house style, while nano-banana refuses named politicians. Default to a house-style anthropomorphized icon instead (e.g. 1B "President / Macmillan baron / Gates" kept the kid rather than three caricatures). Only do caricatures if the user explicitly asks and accepts the style break.

### Anthropomorphized-object recipe (`gen-anthro.mjs`, nano-banana)

- Same HOUSE preamble as the mascots (flat-vector, thick uniform outlines, flat fills, cream `#FFF8E7` bg, restricted palette mustard/navy/red/cream/ink, **NO text/letters/numbers/symbols** — that includes `$` on a money bag; imply money with coins + bills instead).
- Add: *"ANTHROPOMORPHIZED: a simple cute cartoon face (big round eyes with white sparkle), little cartoon white-gloved hands/arms."*
- **Keep the face in clear space.** An object's internal detail must not compete with the eyes. Ballot-box lesson: a transparent box's internal ballots clashed with the face; fixed by floating the eyes on a clean panel with a margin and minimizing the internals. Whenever the subject has busy internals, give the face its own empty zone.
- `gen-anthro.mjs <id-substring>` regenerates only matching jobs (e.g. `node gen-anthro.mjs ballotbox`) so iterating on one icon doesn't reroll the approved ones.
- After it lands: `python3 strip-mascot-bg.py` (drop the icon into `templates/mascots/` first so the script picks it up), then point the card's `cover.mascot` at it and re-render. Same split-offset tuning as any mascot if it clips.

## The template stack

```
drafts/instagram/<post-set>/
├── templates/
│   ├── card.html              # the renderer (1080×1350 IG cards, all kinds)
│   ├── cards.json             # post data — the whole carousel set
│   ├── logo.png               # Saturn-pizza brand mark (copied from drafts/instagram/logo/dressed-2-master.png)
│   └── mascots/
│       ├── SHIP-{1..6}-*.png  # alpha-channel mascots (run strip-mascot-bg.py)
│       └── .bg-bak/           # originals before bg-strip (idempotency)
├── render.mjs                 # Playwright → screenshots each .ig-card to a PNG
├── send-carousels.mjs         # POSTs to local signal-cli-rest-api
├── gen-mascots-*.mjs          # historical Gemini batches (reference)
├── strip-mascot-bg.py         # PIL flood-fill bg → transparent
└── out/
    ├── <post-id>-NN-<kind>.png   # rendered cards
    └── manifest.json             # per-post ordered file lists
```

### `cards.json` schema

```jsonc
{
  "_comment": "…",
  "posts": [
    {
      "id": "p1a-the-brother",
      "title": "the brother on the record",
      "cards": [
        {
          "kind": "cover",
          "tag_top": "// the brother on the record",
          "mascot": "mascots/SHIP-5-asker.png",
          "layout": "split",                    // or "centered"
          "lead":   "Cover question / statement here.",
          "attr":   "— optional smaller subline."
        },
        {
          "kind": "receipt",                    // a quote card
          "num":  "01 / 03",                    // hand-set per ordering
          "tag_top": "// …",
          "tag":  "SUBJECT · SOURCE · DATE",
          "quote": "The quoted line.",
          "attr":  "— Attribution + context.",
          "source": "Mono-uppercase source line at footer."
        },
        {
          "kind": "stat",                       // a number card
          "num":  "01 / 04",
          "tag_top": "// …",
          "stat":  "$15.5M",
          "stat_plus": "+",                     // optional superscript
          "text":  "What the number means.",
          "source": "Mono-uppercase source line at footer."
        }
      ]
    }
  ]
}
```

### `card.html` behavior

- Web fetches `cards.json`, builds one `<article class="ig-card">` per card, signals `document.body.dataset.ready = '1'` once all webfonts and mascot images load.
- Three kinds (`cover` / `receipt` / `stat`). Past kinds tried and CUT: `announcement` (call-and-response), `cover` with embedded answer text.
- Meta strip (`.meta`, `justify-content: space-between`): left `.num`, right `.tag-top`. Receipts/stats put the slide number ("01 / 04") in `.num`. **Covers leave `.num` empty — no "COVER" label in the top-left** (user-requested, all posts). The empty span is kept (not removed) so space-between still right-aligns the `// tag`.
- Fonts: Caveat Brush (display), Schoolbell (mono-handwritten), Quicksand (serif). Loaded from Google Fonts in the head.
- Palette tokens: `--paper #FFF8E7`, `--ink #1A1A2E`, `--accent #E63946` (planet red), `--bus-yellow #FFD93D`, `--paper-rule #1B3FB5`. Match the `/efta/` site exactly.
- Cover bubble: cream fill, 7px black outline, `border-radius: 60% / 35%` oval, 12px yellow drop-shadow, SVG triangle tail. Question is auto-sized via `fitCoverLead(text, layout, hasAttr)` — longest-word-aware so 8-char words like "BROTHER!" never bleed past the edge.
- Layout types: `centered` (bubble top, mascot anchored bottom-center clipped at -340px) and `split` (mascot anchored left at -280px, bubble takes right 64%). Mascot is positioned **absolutely outside `.ig-inner`** so `.ig-card`'s `overflow: hidden` clips it at the card edge — that's how "mascot off-screen" works.
- Brand mark (Saturn-pizza logo) sits top-right at z-index 3 — never as the text watermark that used to overlap the tag-top.

### `render.mjs`

Spins up a tiny local HTTP server on a random port, Playwright (chromium) navigates to `card.html`, waits for fonts + `dataset.ready`, screenshots each `#card-${i}` element to `out/<post-id>-NN-<kind>.png`. Writes `out/manifest.json` with the per-post ordering for the sender. Naming: cover gets `NN=00`, receipts/stats start at `01`.

### `send-carousels.mjs`

Reads `out/manifest.json`, sends one Signal message per post (cover first, then receipts/stats) with a triage caption. Uses **`http://127.0.0.1:8080/v1/accounts`** to discover the registered number, sends to itself (Note to Self). Captions are hardcoded per post id — update when adding new posts. See [[feedback-signal-for-image-review]].

## Generation pipeline (mascots only — text + layout is CSS)

- **Gemini Nano Banana** via `fal-ai/nano-banana` (auth: `Key <fal-key>` from `~/.env`, extract via grep, never `cat`). First-try pose success for salute/thumbs-up/pointing/callout/curious. ~5–10s per generation. See [[reference-gemini-nano-banana-for-poses]].
- **Flux Pro v1.1** via `fal-ai/flux-pro/v1.1` — DO NOT use for poses or text-bearing surfaces. It silently refuses dynamic body language and fills blank "?"-tagged areas with hallucinated text. Reserve for atmospheric/symbol scenes (per [[project-eating-book-illustrations]]).
- Prompts have a house-style preamble (1950s atomic-PSA mascot, Vault Boy aesthetic, flat-vector, palette pinned, **"NO TEXT, NO LETTERS, NO BADGES WITH WRITING"**) and a character-bible block. Look at `gen-mascots-roles.mjs` for the working template.
- After generation: `python3 strip-mascot-bg.py` flood-fills the four corners to alpha so the cream background blends with the cream cover page. Originals go to `mascots/.bg-bak/`.
- `mix-blend-mode: multiply` is a fallback if you can't strip the bg, but Gemini bg-cream is slightly darker than page-cream so multiply leaves a faint rectangle. Always strip.

## Signal delivery (default for any rendered PNG)

`signal-cli-rest-api` is already running on `127.0.0.1:8080` as a systemd-user service (`bopboo.service`). Account `+18176766617`. Send to `recipients: [own_number]` → Note to Self.

```js
// send to self
const payload = {
  number: NUMBER,
  recipients: [NUMBER],
  message: "caption with triage notes — file ID, what to look at, what's off",
  base64_attachments: pngs.map(b => `data:image/png;base64,${b}`),
};
await fetch('http://127.0.0.1:8080/v2/send', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload) });
```

Reusable sender at `drafts/instagram/efta-intro/send-mascots.mjs` (single message, arbitrary files + caption). Caption like a triage note — file IDs, what each shows, what's wrong with the ones that didn't land. The user uses captions to grep later. See [[feedback-signal-for-image-review]].

## Hard rules (each one came from a user correction)

1. **No text/image overlap. Ever.** Before sending any batch, open EVERY rendered card and verify text + image art share zero pixels. Drop-shadows and watermark text-area count as text. Reserve room with `padding-right` on the meta strip so the brand mark and `.tag-top` can't collide. See [[feedback-no-text-image-overlap]].
2. **Visually verify before declaring done.** A layout is only done when a screenshot proves it. Don't infer correctness from the diff. See [[feedback-visual-confirmation-before-done]].
3. **Inspect AI generations for slop.** Every Gemini/Flux output gets eyeballed before staging. Don't trust the prompt. See [[feedback-inspect-ai-images]].
4. **Don't over-reach scope.** Fix what's asked. Don't bundle speculative redesigns into a "while I was at it" push. See [[feedback-dont-over-reach-scope]].
5. **No commits unless asked.** This is journalism material; the drafts directory is gitignored. Don't `git add` anything in `drafts/instagram/` unless the user says so. Per `/home/wabbazzar/code/2pizzaclub/CLAUDE.md`: only stage your own paths, never `git add -A`.
6. **Don't `cat ~/.env`.** Extract only the key you need: `grep '^fal-key:' ~/.env | cut -d':' -f2- | sed 's/^[[:space:]]*//;s/"//g'`.
7. **Never reference the source video on the cards.** The carousel is standalone editorial about the substance — the bill, the documents, the facts. It does NOT mention "the reel," "the video," "the post," or the creator's handle anywhere reader-visible. The video is only the *prompt*; referencing the source video is reserved for the **gallery** (which reviews/indexes captures). So no "WHY THE VIDEO SAYS X" tags, no "the viral video claims…" attributions, no "@handle" on a card. When a card needs to set up a claim-vs-text contrast, frame it impersonally and quote the **bill's own words** (e.g. tag "WHAT §224 DOES — AND DOESN'T — SAY", quote a verbatim statutory line) rather than quoting the video. This also governs the timeline evidence record — see CLAUDE.md "The source video belongs to the gallery, nowhere else." (User correction, 2026-06-01: a "WHY THE VIDEO SAYS PALANTIR" card and a debunk card quoting the reel were both rejected; reframed to quote §224 itself.)

## Common pitfalls

- **Restating the receipt on the cover.** The single biggest voice failure of the session. Re-read rule #1 of cover voice before writing each cover.
- **Asker mascot on a statement cover.** Floating `?` reads as asking; mismatched. Generate a stater (per the Mascot library section) or note the mismatch openly when sending.
- **Flux for poses.** Wastes credits. Go to Gemini.
- **PSA voice from the agent.** "Say kids!" / "Pop quiz, neighbor!" got rejected. Default flat.
- **Watermark text in the corner.** Old `.watermark` div used to render "2pizzaclub" diagonally and overlap the `.tag-top`. Replaced with the Saturn-pizza logo image. If you ever re-introduce a corner element, reserve its bounding box with padding on the meta strip.
- **Macmillan ≠ McGraw-Hill.** Maxwell owned Macmillan (1988–91), and the Macmillan/McGraw-Hill K-12 textbook JV (50% via Macmillan), but McGraw-Hill the parent was independent. If you reframe Maxwell for recognition, write "Macmillan publishers" or "the British baron behind Macmillan textbooks" — not McGraw-Hill.
- **Mascot bg halo.** Gemini's cream is slightly off-white from the page cream. Always run `strip-mascot-bg.py` (idempotent — backs up originals to `.bg-bak/`). `mix-blend-mode: multiply` is unreliable across mascots.
- **8-character words in shout text.** The shout-text sizer in `card.html` is longest-word-aware — if you add new kinds of bold display copy, port the same `text.split(/\s+/).reduce((a,w)=>Math.max(a,w.length), 0)` check or single long words will overflow the 74% width container.
- **Mascot limb overlapping the bubble.** When a mascot has an extended pose (horizontal pointing arm, raised megaphone, extended palm), the bubble in split layout (`z-index: 2` via `.ig-inner`) will paint over the mascot (`z-index: 1`). The pointing fingertip / megaphone bell / palm gets swallowed by the cream bubble fill. **This is the same class as text/image overlap and gets caught by the same inspection pass — every cover before sending, including checking that mascot extremities are fully visible against the bubble.** Fix: choose a vertical-axis pose (finger UP, salute, head tilt) for split layouts where the bubble sits horizontally beside the mascot; OR shrink the mascot width / push it further left; OR switch to `centered` layout where bubble-top + mascot-bottom don't compete horizontally. Validated 2026-06-01: stater-B (finger pointing right) failed on 1A/2; stater-A (finger pointing up) passed.

## How to start a NEW post set (not editing efta-intro)

1. `cp -r drafts/instagram/efta-intro drafts/instagram/<new-set>` — copy the whole working pipeline.
2. Clear `templates/cards.json` and start with the post-data-object workflow above. Present small multiples per post; don't pre-render.
3. If new mascots are needed: edit `gen-mascots-roles.mjs` with new prompts, run it (~10 sec/gen via Gemini), copy chosen results to `templates/mascots/SHIP-N-<role>.png`, run `python3 strip-mascot-bg.py`.
4. Update captions in `send-carousels.mjs` per new post id.
5. `node render.mjs` → eyeball **every** card in `out/` → `node send-carousels.mjs` to push to Signal.

## How to fix the existing efta-intro post set

The state at session end:
- Cover wording locked for **1B** (Macmillan question) and **3** (Kentucky / $32M question).
- Cover wording locked for **2** (just *"What's a 'co-opted Mossad agent'?"*) with subline *"— a question the FBI answered, Oct 16, 2020."*
- Cover wording for **1A** was **NOT yet locked** — the user was deciding between *"What are the grounds for canceling a 2016 election?"* (option A) and three alternates. Currently rendered with the earlier quote-led version (*"They would have to cancel the election."*) — needs to be revisited.
- Stater mascot for statement covers was **NOT generated** at session end. If you generate one, follow the Mascot library section and update the relevant `cover.mascot` paths in `cards.json`.
- All 11 receipts/stats are in their final order (most-relevant first per post).

To iterate: edit `templates/cards.json`, run `node render.mjs`, open the changed `out/*-cover.png` in Read tool, verify no overlap, then `node send-carousels.mjs`.

## Conventions (from `/home/wabbazzar/code/2pizzaclub/CLAUDE.md`)

- No `2pizzaclub.com` in repo paths. The domain is the custom-domain attachment via CNAME.
- Commits carry **no Claude attribution** — no `Co-Authored-By`, no `🤖 Generated with Claude Code`.
- Stage only your own paths; never `git add -A`. Drafts directory is workspace, not for commits unless asked.
- Editorial voice is **direct, flat, no "we", no flamboyance** for the site at large; covers can borrow editorial spunk only within the user's approval.
