# 003 — Seven more Halloween trivia cards

- **Status:** Draft
- **Priority:** High
- **Type:** feature
- **Created:** 2026-08-03
- **Owner:** wabbazzar
- **Estimated Points:** 17 (5 + 5 + 5 + 2)
- **Refs:** [Operation Northwoods memorandum](https://nsarchive.gwu.edu/CMC-60/joint-chiefs-pretexts-to-invade-Cuba-1962) · [Church Committee intelligence-activities hearing](https://intelligence.senate.gov/sites/default/files/94intelligence_activities_I.pdf) · [NSA USS Liberty history](https://www.nsa.gov/History/National-Cryptologic-Museum/Exhibits-Artifacts/Exhibit-View/Article/2718838/cold-war-uss-liberty/) · [9/11 Commission terrorist-financing monograph](https://govinfo.library.unt.edu/911/staff_statements/911_TerrFin_Monograph.pdf) · [National Archives Paperclip records](https://www.archives.gov/iwg/declassified-records/rg-330-defense-secretary) · [Church Committee COINTELPRO report](https://www.intelligence.senate.gov/sites/default/files/94755_III.pdf) · [AP report on Kirk-case ballistics](https://apnews.com/article/76ccb25a0e71f9436334c2029dceb20c)

## Summary

Extend the shipped `/halloween-trivia/` projection from three cards to ten by integrating all seven owner-approved facts, each with its own native-SVG mystery/reveal illustration and hidden source receipt. Preserve the existing four-stage quiz-show rhythm, direct-only route, controls, accessibility, and responsive projector/operator layouts.

## Problem / Background

Ticket 002 shipped a three-card haunted broadcast player and deliberately left later facts out of scope. The owner has now approved seven additional question/reveal pairs and asked to tie them into that animation.

The existing player is already data-driven: `halloween-trivia/cards.js:8` exports a card array, `createPlayerController` derives count and wraparound from the supplied array in `halloween-trivia/player-core.js`, and `populateCard` binds the active card and hidden source drawer in `halloween-trivia/player.js`. Each current card selects a registered renderer through `visual.kind`, with original SVG geometry under `halloween-trivia/visuals/`. The runtime therefore needs extension, not replacement.

The current evidence corpus already contains supporting records for Operation Northwoods (`1962-northwoods-001`), the CIA dart pistol (`1975-heart-attack-gun-001`), pre-9/11 put options (`2001-put-options-001`), Operation Paperclip (`1945-operation-paperclip-001`), and COINTELPRO (`1956-cointelpro-001`). The dart-pistol record still lacks its identified Senate URL. Add a sourced USS Liberty record and a new, narrowly worded Kirk ballistics record rather than rewriting the unrelated in-progress Cullen record.

## Confirmed Product Scope

- Card order: retain passport, Silverstein, and MKULTRA first; append the seven approved cards in the locked order below.
- Projected grammar: `DID YOU KNOW?` stinger → question/mystery → punchline/reveal → transition.
- Copy density: one question and one punchline only on the projection; context, attribution, evidence IDs, and links stay in the hidden Source panel.
- Art: one unique original vector scene per added card inside the existing haunted broadcast frame. No raster, remote, generated, or copyrighted media.
- Delivery: update, test, commit, push, verify the live unlinked route, and send one completion message to the owner through Signal.

## Design Thesis

Each fact feels like a different forbidden file pulled from the same haunted broadcast archive: one bold silhouette creates the mystery, one decisive artifact transformation delivers the reveal, and no generic decoration competes with the copy.

The fixed broadcast frame and mustard/navy/red/cream/ink palette maintain continuity. The seven signatures are: a stamped Northwoods war-plan folder, a poison-dart pistol cutaway, the USS Liberty under attack, a collapsing options chart, a Paperclip personnel file and rocket, an FBI tape-and-letter package, and an inconclusive ballistics comparison.

## Decisions

### Locked decisions

| # | Question | Punchline | Evidence / receipt |
|---|---|---|---|
| 4 | `WHAT DID THE JOINT CHIEFS PROPOSE STAGING IN U.S. CITIES IN 1962?` | `TERROR ATTACKS TO BLAME ON CUBA — PART OF OPERATION NORTHWOODS.` | `1962-northwoods-001`; declassified JCS memorandum |
| 5 | `WHAT SECRET WEAPON DID THE CIA SHOW THE SENATE IN 1975?` | `A PISTOL THAT FIRED A TINY POISON DART — DESIGNED TO KILL WITHOUT AN OBVIOUS TRACE.` | `1975-heart-attack-gun-001`; Church Committee hearing |
| 6 | `WHICH U.S. NAVY SHIP DID ISRAELI FORCES ATTACK OFF GAZA IN 1967?` | `THE USS LIBERTY — 34 AMERICANS WERE KILLED. ISRAEL SAID IT WAS MISTAKEN IDENTITY.` | new `1967-uss-liberty-001`; NSA history |
| 7 | `WHAT OUTNUMBERED UNITED AIRLINES CALL OPTIONS BY MORE THAN 20 TO 1 FIVE DAYS BEFORE 9/11?` | `PUT OPTIONS — BETS THAT THE STOCK WOULD FALL. INVESTIGATORS LATER REPORTED NO 9/11 FOREKNOWLEDGE.` | `2001-put-options-001`; 9/11 Commission monograph |
| 8 | `HOW MANY GERMAN SCIENTISTS DID THE U.S. BRING OVER AFTER WORLD WAR II?` | `MORE THAN 1,500 UNDER PAPERCLIP AND RELATED PROGRAMS — INCLUDING MEN TIED TO SLAVE LABOR AND CAMP EXPERIMENTS.` | `1945-operation-paperclip-001`; National Archives |
| 9 | `WHAT DID THE FBI ANONYMOUSLY SEND MARTIN LUTHER KING JR. IN 1964?` | `SECRET RECORDINGS AND A THREATENING LETTER — WIDELY READ AS PRESSURING HIM TO KILL HIMSELF.` | `1956-cointelpro-001`; Church Committee report and FBI Vault |
| 10 | `DID THE BULLET FRAGMENT RECOVERED FROM CHARLIE KIRK MATCH THE RIFLE?` | `THE ATF COULD NEITHER MATCH NOR EXCLUDE IT — THE RESULT WAS INCONCLUSIVE.` | new `2026-kirk-ballistics-001`; AP and hearing reporting |

Additional locked outcomes:

- Keep `STAGES` unchanged at `stinger`, `mystery`, `reveal`, and `transition`.
- Preserve the shared timings unless a render proves the longest question/reveal needs more reading time; any timing adjustment applies consistently to all ten cards.
- Keep the Source panel as the only location for detail and links.
- Keep `/halloween-trivia/` unlinked and `noindex`; do not change the root navigation, service worker, or PWA shell.

### Open decisions

None.

## Technical Requirements

1. Add the identified Senate PDF URL to `sources/evidence/1975-heart-attack-gun-001.json`, narrow any unsupported mechanism language if needed, and promote the record only after the official transcript supports the published wording.
2. Add `sources/evidence/1967-uss-liberty-001.json` with the NSA account: Israeli fighters and torpedo boats attacked the U.S. Navy ship off Gaza on June 8, 1967; 34 Americans were killed; Israel described the attack as an identification error and the U.S. government accepted that explanation.
3. Add `sources/evidence/2026-kirk-ballistics-001.json` limited to the disclosed ATF comparison: the recovered bullet-jacket fragment could neither be identified nor excluded as fired from the recovered rifle, so the result was inconclusive. Attribute procedural claims to court filings/reporting and do not state who killed Kirk.
4. Add both new records to `sources/evidence/manifest.json`, then rebuild and commit `rag-index.json` and `bundle.json` after all evidence claim/quote edits.
5. Extend `halloween-trivia/cards.js` to exactly ten entries in the locked order. Every new entry supplies `id`, `evidenceIds`, exact `question`, exact `reveal`, a concise hidden `detail`, checked `sources`, positive timings for every current stage, and a unique registered `visual.kind`.
6. Add seven renderer modules under `halloween-trivia/visuals/`: `northwoods.js`, `dart-pistol.js`, `uss-liberty.js`, `put-options.js`, `paperclip.js`, `cointelpro.js`, and `kirk-ballistics.js`. Each renderer returns native SVG, exposes a unique `data-visual`, includes a useful accessible label, and uses no `<image>`, remote reference, generated asset, or copyrighted character.
7. Register the seven renderers in `halloween-trivia/player.js` without changing controller or source-panel behavior.
8. Extend the stage-aware styles in `halloween-trivia/styles.css`. Mystery must read as a silhouette at projection distance; reveal may add only finite state-transition motion. Preserve focus indicators, 16:9 composition, portrait recomposition at 390×844, and `prefers-reduced-motion` zero-duration behavior.
9. Extend `halloween-trivia/player-core.test.mjs` or add a focused card-contract test that proves ten-card count/order, unique visual kinds, positive timings, valid source arrays, forward/back wraparound, and card 10 → card 1 automatic advance.
10. Update `halloween-trivia/README.md` from three to ten cards, list all renderer checks, and document the seven new source-backed scenes without exposing the route from the root site.

## Implementation Plan

### Phase 1 — Evidence and ten-card contract (5 points)

**Goal:** Land the seven exact facts as source-backed data while proving the existing controller traverses ten cards.

**Steps:** verify/add the three ticket-owned evidence records, update the manifest and generated artifacts, append all seven card objects, register renderer placeholders only when needed for contract tests, and extend deterministic tests.

**Files:** the three ticket-owned evidence records, `sources/evidence/manifest.json`, `rag-index.json`, `bundle.json`, `halloween-trivia/cards.js`, `halloween-trivia/player-core.test.mjs`, and the minimal renderer registry surface in `halloween-trivia/player.js`.

**Gate classes:** Data artifacts, typecheck/lint, editorial quality, and site render.

**Delegation:** subagent — own the evidence/card/test contract, return changed files, commands and exit codes, RAG/test counts, and blockers in no more than 40 lines.

**Observable phase DoD:** generated artifacts contain the three ticket-owned evidence updates; RAG remains 5/5; card-contract/controller tests prove a ten-card loop; every exact approved string and checked source appears in card data.

### Phase 2 — Four vector reveals (5 points)

**Goal:** Build distinct Northwoods, dart-pistol, USS Liberty, and put-options mystery/reveal scenes.

**Steps:** add four native-SVG renderers, register them, add scoped stage-aware CSS, and render mystery/reveal states at the declared projector and phone viewports.

**Files:** four new renderer modules, `halloween-trivia/player.js`, and their scoped portions of `halloween-trivia/styles.css`.

**Gate classes:** Typecheck/lint and site render.

**Delegation:** subagent — own only the first four renderer modules plus their registry/CSS selectors; return files, command exit codes, viewport measurements/screenshots, console/network results, and blockers in no more than 40 lines.

**Observable phase DoD:** the four new cards expose four unique `data-visual` values; mystery/reveal copy remains inside the frame at 1920×1080, 1366×768, and 390×844; reduced motion reports no animation or transition duration.

### Phase 3 — Three vector reveals and ten-card visual pass (5 points)

**Goal:** Build Paperclip, COINTELPRO, and Kirk-ballistics scenes, then inspect the complete ten-card sequence.

**Steps:** add three native-SVG renderers, register them, add scoped CSS, traverse all ten cards through mystery/reveal/source states, and correct the largest hierarchy or overflow mismatch.

**Files:** three new renderer modules, `halloween-trivia/player.js`, and their scoped portions of `halloween-trivia/styles.css`.

**Gate classes:** Typecheck/lint and site render.

**Delegation:** subagent — own only the final three renderer modules plus their registry/CSS selectors; return files, command exit codes, all-card viewport evidence, focus/reduced-motion results, and blockers in no more than 40 lines.

**Observable phase DoD:** all ten cards expose unique registered visuals, wrap correctly, keep projected copy inside the frame, open the correct hidden receipt, return focus on close, and produce no console/network failures at every declared viewport.

### Phase 4 — Operator guide and live release (2 points)

**Goal:** Leave the ten-card show documented, deployed, and independently verified.

**Steps:** update the guide, run the complete local gate, push `main`, wait for GitHub Pages, inspect the live route on projector and phone viewports, graduate the ticket, and send one Signal completion.

**Files:** `halloween-trivia/README.md` and ticket lifecycle path.

**Gate classes:** Typecheck/lint, data-artifact regression, editorial quality, site render, deploy, and notifications.

**Delegation:** subagent — independently review the finished local and live route without editing application files; return commands/exit codes, test/RAG counts, HTTP/browser evidence, background-process status, and blockers in no more than 40 lines.

**Observable phase DoD:** guide and runtime agree on ten cards; all tests and render checks are green; the live route returns HTTP 200 with all ten IDs/visuals; one Signal completion succeeds; the ticket lifecycle check passes.

## Testing Strategy

- Syntax-check every touched JavaScript module and renderer.
- Run the controller suite plus a ten-card data/renderer/source contract test that can fail on a missing card, duplicate visual, invalid timing, or broken wraparound.
- Rebuild the RAG index and evidence bundle for evidence-record changes; require RAG 5/5.
- Scan all renderer modules for remote/raster/embedded assets and inspect each SVG accessible label.
- Serve the real static route on a fresh port. Exercise all ten cards at 1920×1080, 1366×768, and 390×844 across mystery, reveal, source-open/close, keyboard navigation, autoplay wraparound, and reduced motion.
- Require zero page overflow, zero active-copy overflow outside the broadcast frame, zero console errors, and zero failed local responses.
- After push, repeat representative live renders at 1920×1080 and 390×844 and confirm every card ID and `data-visual` is reachable.

## Acceptance Criteria / Definition of Done

- [ ] The player contains exactly ten cards: the original three followed by the seven locked additions.
- [ ] Every new question and punchline matches the Decisions table exactly.
- [ ] The dart-pistol record has its checked Senate source; new USS Liberty and Kirk ballistics records contain narrow attributable claims; regenerated `rag-index.json` and `bundle.json` match the evidence manifest.
- [ ] Every new card’s hidden panel shows a concise factual detail, the correct evidence ID, and the checked supporting source links; no detail or citation enters projected copy.
- [ ] The seven added cards render seven distinct original native-SVG scenes, for ten unique `data-visual` values total, with no raster, remote, generated, package-supplied, or copyrighted artwork.
- [ ] Mystery silhouettes and reveal states remain legible and inside the broadcast frame at 1920×1080, 1366×768, and 390×844.
- [ ] Autoplay, pause/resume, restart, previous/next, card 10 → card 1 wraparound, preview queries, fullscreen, Source, Escape, and focus return work without console or network failures.
- [ ] Reduced-motion mode preserves all four states with computed animation and transition durations of zero.
- [ ] All touched JavaScript passes syntax checks; controller/card-contract tests pass; RAG remains 5/5.
- [ ] The route remains unlinked and `noindex`; root navigation, `sw.js`, and `manifest.webmanifest` remain unchanged.
- [ ] The pushed live route returns HTTP 200 and visibly traverses all ten cards on desktop/projector and phone viewports.
- [ ] The owner receives one Signal completion message containing the live URL and concise gate result.
- [ ] Every phase is committed with explicit paths, the ticket is graduated on full completion, and the original shared checkout’s unrelated work is untouched.

## Boundaries

### Always

- Keep evidence/context in the hidden Source panel and projection copy to the approved question/punchline grammar.
- Use original native SVG, the existing palette/type system, responsive composition, keyboard access, and reduced-motion support.
- Stage explicit ticket-owned paths and verify the rendered route before every phase commit.

### Ask first

- Any wording change to the seven approved questions or punchlines.
- Any new public navigation link, search indexing, audio/video export, social post, or change to the direct-only route boundary.
- Any need to replace, delete, or materially reinterpret an existing evidence record outside the three ticket-owned records.

### Never

- Introduce a framework, bundler, package dependency, new top-level module boundary, or external asset service.
- Add copyrighted cartoon/Pokémon footage, AI-generated raster art, remote images, audio, or video.
- State that any cited anomaly proves a broader perpetrator, motive, explosion, or conspiracy claim.
- Touch, stage, stash, clean, or revert unrelated work in the shared checkout.

## Dependencies

- Builds on completed tickets 001 and 002.
- Requires the seven approved source URLs to remain reachable for the hidden Source panel.
- No new runtime or package dependency.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Seven scenes become visually repetitive | Give each one a different central artifact and reveal transformation while retaining only the shared aperture/frame. |
| Long approved lines overflow at projector distance | Size against the longest dart-pistol and Paperclip lines, then render every card at all declared viewports before commit. |
| A sensational card implies more than its source | Keep full attribution/context in the hidden detail and constrain the projected line to the exact approved factual wording. |
| Current Kirk-case reporting changes | Record the comparison result and date/source only; avoid conclusions about guilt, weapon identity, or the pending case. |
| Evidence rebuild sweeps unrelated dirty records | Build in the clean isolated clone and stage only ticket-owned paths. |
| Seven renderer/CSS additions leak across cards | Use `data-visual`/card-scoped classes and split the art into two independently verified phases. |

## Out of Scope

- Sourcing or editing cartoon footage.
- Exporting a composited video or adding sound.
- Linking the Halloween route into the public site navigation or PWA shell.
- Adding more than the seven approved facts.
- Publishing any social-media post.
- Reworking the original three card concepts or their approved copy.

Draft ready for `polish-ticket`.
