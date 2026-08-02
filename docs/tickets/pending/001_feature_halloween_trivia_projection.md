# 001 — Halloween trivia projection prototype

- **Status:** Draft
- **Priority:** High
- **Type:** feature
**Estimated Points:** 13 (3 + 5 + 3 + 2)

## Summary

Create an unlinked, browser-native Halloween projection route that plays sourced 2pizzaclub facts as animated silhouette-question-reveal cards. The first slice ships the reusable animation system and one finished, verified card about the passport attributed to Flight 11 hijacker Satam al-Suqami; the remaining twelve cards follow only after the owner reviews the prototype's art and motion.

## Problem / Background

The Halloween yard program will interleave spooky cartoons with short factual eyecatches. The interaction borrows the readable grammar of the original *Who's That Pokémon?* segment—a bold silhouette, a guessing pause, and a reveal—but must use original art, copy, branding, and motion rather than Pokémon footage or assets. The segment is documented as a question-and-answer eyecatch built around a silhouette or outline ([Bulbapedia, “Who's That Pokémon?”](https://bulbapedia.bulbagarden.net/wiki/Who%27s_That_Pok%C3%A9mon%3F)); reference screenshots show the high-contrast silhouette, radial field, oversized question mark, and title/answer hierarchy.

This work is Halloween-specific and intentionally separate from the main timeline and gallery. It lives in this repository because 2pizzaclub already provides the evidence corpus and editorial rules: records are canonical under `sources/evidence/<id>.json` (`sources/SCHEMA.md:3-27`), and official and counter-narratives must be attributed rather than adopted (`CLAUDE.md:90-97`). The project already uses bright comic visuals to carry flat prose (`CLAUDE.md:128-134`), while the related still-image work establishes a 1970s educational-cartoon register with bold shapes that read at 20+ feet (`drafts/halloween-arch/ARCH-SPEC.md:26-38`).

The first proposed fact exists at `sources/evidence/2001-suqami-passport-001.json:1-38`, but its primary URL is null and its status is `primary-link-pending` (`:13-16`, `:36`). The 9/11 Commission's terrorist-travel staff report records that an unidentified passerby handed the passport to NYPD Detective Yuk H. Chin while debris was falling from WTC 2, after which Chin gave it to the FBI that day. That attributable official account is the publishable fact; “passports were found on the sidewalk beneath 9/11” is not.

## Confirmed Product Scope

- Audience: Halloween passersby and trick-or-treaters, including people joining mid-loop and viewing from roughly 15–30 feet at night.
- Job: earn attention immediately, allow a short guess, reveal one surprising sourced fact, and return cleanly to the surrounding cartoon program.
- Delivery: an unlinked fullscreen 16:9 browser route served from the existing static site; no MP4 export in this slice.
- Editorial sequence: thirteen eventual cards—three developed closely with the owner, five more reviewed by the owner, then five drafted independently. This ticket ships only the first approved prototype card and the structure needed for the later twelve.
- Creative reference: actual *Who's That Pokémon?* material is research only. Production artwork is original SVG/CSS shape work.

## Design Intent

### Design thesis

An interrupted haunted educational broadcast turns a stark mystery silhouette into a bright 1970s evidence card, giving sidewalk viewers the instant guessing pleasure of a cartoon eyecatch while keeping every grim claim flat, legible, and sourced.

### Information and motion hierarchy

1. **Station stinger:** `DID YOU KNOW?` establishes the recurring segment in no more than 1.5 seconds.
2. **Mystery:** one large object silhouette and a short question occupy the 16:9 safe area for at least 4 seconds.
3. **Reveal:** a wipe or iris changes the silhouette into an original color illustration and names the answer.
4. **Receipt:** one short explanatory statement and a compact source label remain visible for at least 6 seconds.
5. **Transition:** the card clears to the dark stage before the loop restarts or advances.

The signature element is an off-kilter “evidence aperture”: irregular radial wedges frame the mystery object, then flip from shadow to color and leave behind a small green source strip. Each later card may supply its own SVG vignette and reveal motion through a renderer registry, while the aperture, timing grammar, typography, and receipt strip keep the series coherent.

### Visual system

| Token | Value | Role |
|---|---:|---|
| Midnight ink | `#1A1A2E` | Projection surface and silhouette |
| Royal broadcast | `#1B3FB5` | Secondary field and aperture wedges |
| Cream paper | `#FFF8E7` | Primary text and revealed document |
| Bus yellow | `#FFD93D` | Question/reveal emphasis |
| Dusty red | `#E63946` | Decorative transition accent only |
| Comet green | `#06D6A0` | Source/verified strip |

Cream on midnight/royal, midnight on yellow, and midnight on green are the text pairs. Dusty red is not used for small text. Display type uses a heavy system sans stack; body type uses a rounded system sans; utility/source type uses a system monospace. No font download is required for playback.

### First-card art direction and copy

- Mystery object: an unmistakable passport silhouette drifting through large abstract paper/debris shapes; no people, impact imagery, gore, or photorealism.
- Reveal treatment: the document rotates face-on, gains a cream fill, thick ink outline, simple abstract stamp marks, and the green receipt strip. It must not reproduce an actual passport page or personal identifier.
- Stinger: `DID YOU KNOW?`
- Mystery question: `WHAT SURVIVED FLIGHT 11?`
- Reveal: `SATAM AL-SUQAMI'S PASSPORT`
- Receipt copy: `The 9/11 Commission said an unidentified passerby handed it to NYPD Detective Yuk H. Chin while debris was falling from WTC 2. Chin gave it to the FBI that day.`
- Projected source label: `9/11 Commission staff report · 2004`
- The full source label and URL remain available in the accessible DOM and operator source view.

### Interaction and responsive behavior

- Autoplay begins without sound and loops the available cards.
- Visible-on-focus/cursor operator controls support play/pause, previous, next, restart, fullscreen, and source details.
- Keyboard: `Space` play/pause, `ArrowLeft`/`ArrowRight` previous/next, `R` restart, `F` fullscreen, and `I` source information. Controls use semantic buttons, visible focus, and plain state text.
- The stage preserves a centered 16:9 composition at 1920×1080 and 1366×768. At the project's required 390×844 mobile viewport, the composition recomposes into a readable portrait operator preview instead of scaling the landscape scene into illegibility.
- `prefers-reduced-motion: reduce` removes travel, rotation, and flashing transitions while preserving the same timed information states. No transition may flash more than three times per second.

## Technical Requirements

### Runtime and files

The project is plain HTML/CSS/ES modules with no app build (`README.md:25-26`; `.agents/gates.md:9-15`). Add a self-contained route and do not modify the timeline or gallery navigation:

- Create `halloween-trivia/index.html` for the semantic stage, accessible controls, source panel, and noindex metadata.
- Create `halloween-trivia/styles.css` for the 16:9 stage, safe areas, vector scene styling, animation states, focus treatment, portrait recomposition, and reduced-motion mode.
- Create `halloween-trivia/cards.js` as the authored card registry. Each card exposes `id`, `evidenceId`, `topic`, `question`, `reveal`, `detail`, `source.label`, `source.url`, `timing`, and `visual.kind`.
- Create `halloween-trivia/player.js` with a small state-machine/controller that owns stage timing, pause/resume/restart/skip/fullscreen behavior, URL-selected preview state if useful for verification, control labels, and renderer dispatch by `visual.kind`.
- Create the first original passport SVG in the route itself or in a dedicated `halloween-trivia/visuals/passport.js` renderer. Do not add raster generation or copyrighted reference assets.
- Add a short `halloween-trivia/README.md` operator note covering local serving, fullscreen startup, keyboard controls, 16:9 projector setup, and how a future verified card is added.
- Do not add the route to `sw.js`'s precached shell (`sw.js:14-33`) or to the root header navigation (`index.html:44-49`) in this slice. Same-origin runtime caching may continue to work through the existing fetch handler (`sw.js:56-81`).

### Evidence record

- Update `sources/evidence/2001-suqami-passport-001.json` to use the canonical 9/11 Commission staff report URL, carry a short verbatim supporting quote, use flat attributable wording, and move to `status: "verified"` only after every cited URL has been opened and checked.
- Remove or correct unsupported specificity if the primary record does not establish it. Do not publish “multiple passports,” “on the sidewalk,” or a conspiracy inference as fact.
- The animation card references this evidence ID but keeps its shorter projection-specific copy in `cards.js`.
- Because the record claim/quote changes, regenerate and commit both precompiled artifacts as required by `CLAUDE.md:213-220` and `.agents/gates.md:27-38`.

### Dependencies

- No new framework, bundler, transpiler, animation library, font package, image generator, or runtime dependency.
- Node's built-in test runner may be used for pure state/timing logic if it materially improves coverage; no DOM test library is added.
- The primary editorial dependency is the Commission's [*9/11 and Terrorist Travel* staff report](https://www.govinfo.gov/content/pkg/GOVPUB-Y3-PURL-LPS53197/pdf/GOVPUB-Y3-PURL-LPS53197.pdf), especially note 109.

## Implementation Plan

### Phase 1 — Verify the first fact and establish the card contract (3 points)

**Goal:** Make the first trivia fact publishable and define the authored shape future cards will use.

- Open the Commission source and any retained secondary URLs; revise the existing record to the strongest supportable wording, URL, quote, notes, and status.
- Add `cards.js` with the first approved projection copy and a documented schema that can hold thirteen cards without changing the player contract.
- Rebuild the required evidence artifacts.
- Prove the evidence record, data artifacts, RAG regression, and editorial quality gate classes pass.

**Files:** `sources/evidence/2001-suqami-passport-001.json`, `sources/evidence/manifest.json` only if needed, `rag-index.json`, `bundle.json`, `halloween-trivia/cards.js` (new).
**Delegation:** subagent — independently compare every first-card clause with the opened primary source and return only supported wording plus citations.

### Phase 2 — Build the projection player as one working vertical slice (5 points)

**Goal:** Play the complete stinger → mystery → reveal → receipt → transition sequence with operable controls.

- Build the semantic route, stage sizing, controller/state machine, autoplay loop, pause-safe timers, fullscreen handling, keyboard path, source panel, and responsive recomposition.
- Make timings data-driven per card while providing safe series defaults.
- Ensure joining mid-loop, pausing during any state, restarting, and reduced-motion operation all produce deterministic visible states.
- Prove the JavaScript syntax and site-render gate classes pass at 1920×1080, 1366×768, and 390×844, including console inspection and keyboard operation.

**Files:** `halloween-trivia/index.html` (new), `halloween-trivia/styles.css` (new), `halloween-trivia/player.js` (new), and optional pure-controller test file (new).
**Delegation:** subagent — implement the isolated player/controller contract and return touched files plus state-transition test evidence; the orchestrator integrates and visually critiques it.

### Phase 3 — Render and critique the original passport vignette (3 points)

**Goal:** Deliver a distinctive first card that reads from a yard without copying the reference franchise.

- Create the evidence-aperture background and original passport/debris SVG scene from simple paths and shapes.
- Animate silhouette entry, guessing hold, reveal wipe/iris, source-strip arrival, and clean exit using state classes controlled by the player.
- Keep all important text and the mystery silhouette inside a projector-safe inset; remove one decorative accessory during critique.
- Capture and inspect real rendered frames for mystery, reveal, receipt, portrait, and reduced-motion states; revise the largest mismatch with the design thesis.
- Prove the site-render, accessibility interaction, contrast, overflow, and reduced-motion gate surfaces pass.

**Files:** `halloween-trivia/styles.css`, `halloween-trivia/index.html`, `halloween-trivia/player.js`, and optional `halloween-trivia/visuals/passport.js` (new).
**Delegation:** inline (the visual critique depends on the confirmed design thesis and rendered projection states already held by the orchestrator).

### Phase 4 — Operator handoff and live-route verification (2 points)

**Goal:** Make the prototype repeatable on a projector and safe to review before multiplying the card format.

- Document local serving, fullscreen startup, keys, card authoring, source requirements, and the deliberate absence of audio/video export.
- Re-run all applicable roll-up gates, verify no unrelated dirty-worktree files are staged, and exercise the unlinked route from a fresh browser context.
- Commit and push the verified route through the normal GitHub Pages flow; verify the direct live URL loads while remaining absent from site navigation.

**Files:** `halloween-trivia/README.md` (new) plus any narrow fixes from final verification.
**Delegation:** subagent — run an independent release-minded review of the declared viewports, controls, source visibility, and out-of-scope boundaries and return failures only.

## Testing Strategy

- Run `node --check` on every new or touched JavaScript module.
- If pure player timing is extracted, cover pause/resume/restart/skip and stage wraparound with Node's built-in test runner.
- Run `node tools/build-rag-index.mjs && node tools/rag-eval.mjs`; the five golden RAG queries must remain 5/5.
- Run `node tools/build-bundle.mjs` and confirm the updated passport record is present.
- Exercise the actual locally served route in a fresh browser context at 1920×1080, 1366×768, and 390×844; inspect mystery, reveal, receipt, controls, focus, fullscreen behavior, console, overflow, and reduced-motion states.
- Confirm the page contains no Pokémon assets, external animation/runtime dependencies, unsupported passport wording, reader-facing internal record IDs, or source-video framing.
- After push, verify the direct GitHub Pages route returns successfully and displays the shipped card; confirm the root navigation remains unchanged.

## Acceptance Criteria / Definition of Done

- [ ] `/halloween-trivia/` loads as an unlinked, noindex static route with no console errors and no framework/build/runtime dependency.
- [ ] The route automatically plays a deterministic stinger → mystery → reveal → receipt → transition loop containing the approved passport card.
- [ ] The mystery stage holds for at least 4 seconds, the receipt remains readable for at least 6 seconds, and all timings are authored as data rather than scattered CSS delays.
- [ ] The first card uses only original SVG/CSS shapes and visibly follows the haunted educational-broadcast thesis without Pokémon art, logos, audio, video, or copied screen composition.
- [ ] The projected copy matches the approved question, reveal, receipt, and source label in this ticket; the accessible source view exposes the full label and opened primary URL.
- [ ] `2001-suqami-passport-001` has a checked primary Commission URL and supporting quote, flat attributable wording, no unsupported “sidewalk/passports/conspiracy” assertion, and `verified` status only if every retained citation was checked.
- [ ] `rag-index.json` and `bundle.json` are regenerated from the updated evidence record, and the RAG gate remains 5/5.
- [ ] `Space`, arrow keys, `R`, `F`, and `I` perform the documented actions; every visible control is keyboard reachable, has visible focus, and reports its current state in text or accessible labeling.
- [ ] The important silhouette and text stay readable and unclipped at 1920×1080 and 1366×768; the 390×844 view recomposes into a usable portrait preview with no horizontal page overflow.
- [ ] Reduced-motion mode preserves every information state without travel/rotation effects, and no normal transition flashes more than three times per second.
- [ ] Text uses only the declared high-contrast pairs; dusty red remains decorative rather than carrying small essential text.
- [ ] The operator README is sufficient to serve the route locally, enter fullscreen, control playback, and add a later verified card without discovering an undocumented build step.
- [ ] The direct live route is verified after push, while the root timeline/gallery navigation and service-worker precache list remain unchanged.
- [ ] All commits stage only ticket-owned paths, remain on `main`, and contain no AI/Claude attribution.

## Boundaries

### Always

- Attribute official accounts and disputed interpretations; state only what the opened artifact supports.
- Use native HTML, CSS, JavaScript, and SVG with a legible 16:9 projection-safe layout and a reduced-motion equivalent.
- Keep future trivia content data-driven and traceable to a checked 2pizzaclub evidence record or an equally strong primary source.

### Ask first

- Add any of the remaining twelve trivia cards or choose their facts, copy, and individualized art direction.
- Add audio, export rendered video, download/source copyrighted media, or introduce any new package/tool/plugin.
- Link the Halloween route from the main site, include it in the installable PWA shell, or publish/promote it beyond the unlinked direct URL.

### Never

- Introduce a framework, bundler, transpiler, new top-level runtime boundary, or integration into the timeline/gallery modules for this prototype.
- Present unsupported or disputed interpretations as settled fact, even when a more sensational formulation would be punchier.
- Use AI-generated raster art, Pokémon franchise assets, actual passport identifiers, graphic attack imagery, or visual treatment that makes victims the joke.
- Modify, replace, delete, or publish any existing live social-media content as part of this work.

## Dependencies

- **Blocked by:** None for this prototype; the first fact and design direction are approved.
- **Blocks:** Collaborative selection and production of the remaining twelve Halloween trivia cards.
- **External:** Browser Fullscreen API; canonical 9/11 Commission source hosted by govinfo.gov; GitHub Pages deployment after push.

## Risks & Mitigations

- **Projection readability:** Fine text and low-contrast texture disappear on an uneven outdoor surface. Mitigation: strict safe area, very short copy, oversized silhouettes, high-contrast pairs, and real 1080p/768p render inspection.
- **Derivative visual treatment:** A close replica could read as copied Pokémon branding. Mitigation: retain only the abstract silhouette-question-reveal grammar and replace its composition, palette, typography, shapes, logo, and motion with the original evidence-aperture system.
- **Sensationalized disputed material:** The format can turn an attributable account into an implied conspiracy. Mitigation: keep question/reveal copy artifact-level, include an explicit source strip, expose the full source, and apply the existing attributed-not-adopted editorial gate.
- **Motion sensitivity:** A bright outdoor bumper can accidentally use unsafe flashing. Mitigation: prohibit >3 flashes/second, provide reduced motion, and inspect actual transitions rather than only static frames.
- **Timer drift and awkward pauses:** Browser throttling or operator interaction can desynchronize CSS-only animations. Mitigation: use one JavaScript-owned state clock and drive visuals from explicit stage classes.
- **Premature format multiplication:** Building thirteen bespoke scenes before reviewing one could multiply the wrong art direction. Mitigation: ship one complete prototype and require owner review before adding the remaining twelve.
- **Shared dirty worktree:** Other agents already own unrelated skill, capture, and Charlie Kirk evidence changes. Mitigation: stage only the explicit ticket/feature paths and never clean, revert, or blanket-add the worktree.

## Out of Scope

- The remaining twelve trivia facts, their research, copy, and individualized animations.
- Cartoon acquisition, playlist scheduling, commercial-break detection, audio playback, or synchronization with Scooby-Doo/Courage footage.
- MP4/WebM export, recording automation, projector hardware calibration, projection mapping, or multi-screen output.
- A content-management UI, remote controls, analytics, sharing, main-site navigation, PWA precaching, or gallery/timeline integration.
- AI image generation, downloaded Pokémon references, or reuse of the existing Halloween arch's raster renders.
