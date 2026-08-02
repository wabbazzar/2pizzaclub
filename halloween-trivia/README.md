# Halloween trivia projection operator guide

This is a silent, self-contained browser projection. It uses native HTML, CSS,
JavaScript modules, and original SVG shapes; there is no install or build step.

## Run and project

From the repository root:

```bash
python3 -m http.server 8747
```

Open <http://127.0.0.1:8747/halloween-trivia/> directly. The bare route starts
the stinger-to-transition loop automatically and produces no audio. Leave the
server terminal open; press `Ctrl+C` there when the show is over.

Use a 16:9 projector display, preferably 1920×1080 or 1366×768. Put the browser
window on that display, then press `F` or use the **Fullscreen** button. If the
browser blocks page-initiated fullscreen, use its own fullscreen command. The
390×844 portrait layout is a recomposed operator preview, not the primary yard
composition.

For a paused rehearsal or screenshot, use the exact preview query. For example:

- <http://127.0.0.1:8747/halloween-trivia/?autoplay=0&stage=mystery>
- <http://127.0.0.1:8747/halloween-trivia/?autoplay=0&stage=receipt>

Valid stages are `stinger`, `mystery`, `reveal`, `receipt`, and `transition`.
An invalid stage falls back to `stinger`.

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

The **Source** button or `I` opens the evidence panel, including the evidence
record ID and primary-source link. Close it with **Close**, **Hide source**,
`I`, or `Escape`. The page follows the device/browser reduced-motion preference:
all five information states remain available, but travel and rotation stop.

## Add a later verified card

The remaining cards require owner approval first. After approval:

1. Add or update the matching JSON record in `sources/evidence/`. Open and check
   every retained citation, prefer the strongest primary source, include a short
   supporting quote, use flat attributable wording, and mark it `verified` only
   after those checks.
2. Add one object to `halloween-trivia/cards.js` with `id`, `evidenceId`, `topic`,
   `question`, `reveal`, `detail`, `significance`, `source.label`, `source.url`,
   `timing`, and `visual.kind`. `detail` is the sourced receipt. `significance`
   becomes the explicit **SO WHAT?** line: make the scale or consequence tangible,
   but keep the interpretation bounded by the evidence and avoid implying an
   unsupported conclusion.
3. Supply positive millisecond timings for `stinger`, `mystery`, `reveal`,
   `receipt`, and `transition`. Keep the mystery at least 4000 ms and the receipt
   at least 6000 ms; the current card's authored timings are the working model.
4. Create an original vector renderer in `halloween-trivia/visuals/`, export its
   render function, then import and register it in the `renderers` map in
   `halloween-trivia/player.js` under the same `visual.kind`. Do not add raster,
   copyrighted, remote, or package-supplied assets.

Run the checks from the repository root:

```bash
node --check halloween-trivia/cards.js
node --check halloween-trivia/player-core.js
node --check halloween-trivia/player-core.test.mjs
node --check halloween-trivia/player.js
node --check halloween-trivia/visuals/passport.js # repeat for the new renderer
node --test halloween-trivia/player-core.test.mjs
node tools/build-rag-index.mjs && node tools/rag-eval.mjs
node tools/build-bundle.mjs
```

Then serve the repository and review every preview stage at 1920×1080,
1366×768, and 390×844, including reduced-motion mode, source access, focus, and
overflow. Evidence-record changes require committing the regenerated
`rag-index.json` and `bundle.json`.

## Publication boundary

This route is intentionally direct-only and has `noindex` metadata. Do not link
it from the root site, edit the root `index.html`, or add it to the `sw.js` PWA
precache shell without explicit owner approval.
