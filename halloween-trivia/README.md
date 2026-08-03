# Halloween trivia projection operator guide

This is a silent, self-contained browser projection. It uses native HTML, CSS,
JavaScript modules, and original SVG shapes; there is no install or build step.

## Run and project

From the repository root:

```bash
python3 -m http.server 8747
```

Open <http://127.0.0.1:8747/halloween-trivia/> directly. The bare route starts
the four-stage loop automatically, cycles the ten shipped cards, and produces
no audio. Leave the server terminal open; press `Ctrl+C` there when the show is
over.

Use a 16:9 projector display, preferably 1920×1080 or 1366×768. Put the browser
window on that display, then press `F` or use the **Fullscreen** button. If the
browser blocks page-initiated fullscreen, use its own fullscreen command. The
390×844 portrait layout is a recomposed operator preview, not the primary yard
composition.

For a paused rehearsal or screenshot, use the exact preview query. For example:

- <http://127.0.0.1:8747/halloween-trivia/?autoplay=0&stage=mystery>
- <http://127.0.0.1:8747/halloween-trivia/?autoplay=0&stage=reveal>

Valid stages are `stinger`, `mystery`, `reveal`, and `transition`. An invalid
stage, including the retired `receipt` stage, falls back to `stinger`.

## Operate the player

Point at the lower-right controls or tab into them to reveal the buttons. In
portrait they appear along the bottom. The buttons and equivalent keys are:

| Action | Key |
| --- | --- |
| Play or pause | `Space` |
| Previous or next card | `ArrowLeft` / `ArrowRight` |
| Restart the current card | `R` |
| Enter or exit fullscreen | `F` |
| Show or hide source details | `I` |

The **Source** button or `I` opens the hidden evidence panel for the current
card. It includes the factual detail, all evidence record IDs, and every
authored official-source link. That material is for operator inspection and is
never projected as a receipt stage. Close it with **Close**, **Hide source**,
`I`, or `Escape`. The page follows the device/browser reduced-motion preference:
all four projected states remain available, but travel and rotation stop.

## Shipped scene set

The ten-card order is passport, World Trade Center lease, MKULTRA, Operation
Northwoods, CIA dart pistol, USS Liberty, United Airlines put options,
Operation Paperclip, the FBI package sent to Martin Luther King Jr., and the
Kirk ballistics comparison. Each card has its own native-SVG silhouette/reveal
renderer while sharing the evidence aperture, broadcast frame, palette, and
four-stage timing.

## Add a later verified card

Any future card requires owner approval first. After approval:

1. Add or update the matching JSON record in `sources/evidence/`. Open and check
   every retained citation, prefer the strongest primary source, include a short
   supporting quote, use flat attributable wording, and mark it `verified` only
   after those checks.
2. Add one object to `halloween-trivia/cards.js` with `id`, `evidenceIds`,
   `question`, `reveal`, `detail`, `sources`, `timing`, and `visual.kind`.
   `evidenceIds` and `sources` are arrays: use one entry or several as the claim
   requires, and give each source a `label` and `url`. Keep `detail`, evidence
   IDs, and source links in the hidden operator panel. The projection itself
   shows only the shared stinger, short question, punchline, and transition.
3. Supply positive millisecond timings for `stinger`, `mystery`, `reveal`, and
   `transition`. The current shared timings in `cards.js` are the working model.
4. Create an original vector renderer in `halloween-trivia/visuals/`, export its
   render function, then import and register it in the `renderers` map in
   `halloween-trivia/player.js` under the same `visual.kind`. Do not add raster,
   copyrighted, remote, or package-supplied assets.

Run the checks from the repository root:

```bash
for file in halloween-trivia/cards.js halloween-trivia/player-core.js halloween-trivia/player-core.test.mjs halloween-trivia/cards.test.mjs halloween-trivia/player.js halloween-trivia/visuals/*.js; do node --check "$file"; done
node --test halloween-trivia/player-core.test.mjs halloween-trivia/cards.test.mjs
node tools/rag-eval.mjs
```

Then serve the repository; traverse all ten cards and review every four-stage
preview at 1920×1080, 1366×768, and 390×844, including reduced-motion mode,
source access, focus, distinct visuals, and overflow. If an evidence record
changed, also regenerate and commit the data artifacts before rerunning the
evaluation:

```bash
node tools/build-rag-index.mjs && node tools/rag-eval.mjs
node tools/build-bundle.mjs
```

## Publication boundary

This route is intentionally direct-only and has `noindex` metadata. Do not link
it from the root site, edit the root `index.html`, or add it to the `sw.js` PWA
precache shell without explicit owner approval.
