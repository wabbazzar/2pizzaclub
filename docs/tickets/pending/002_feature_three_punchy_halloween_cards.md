# 002 — Three punchy Halloween trivia cards

- **Status:** Draft
- **Priority:** High
- **Type:** feature
- **Created:** 2026-08-02
- **Owner:** wabbazzar
- **Estimated Points:** 12 (5 + 5 + 2)
- **Refs:** [Port Authority 2007 financial statement](https://www.panynj.gov/content/dam/corporate/financial-statements/financial-statement-2007.pdf) · [New York State Comptroller financial-plan review](https://www.osc.ny.gov/files/reports/osdc/pdf/report-3-2008.pdf) · [Senate MKULTRA hearing](https://www.intelligence.senate.gov/sites/default/files/hearings/95mkultra.pdf)

## Goal

Turn the approved Halloween projection prototype into a three-card quiz loop with sharply reduced projection copy. Each card must show only the shared “DID YOU KNOW?” stinger, one short question, and one punchline before transitioning; complete factual details and source links remain available only in the operator’s hidden source panel.

## Context and Pointers

The prototype currently contains one passport card in `halloween-trivia/cards.js:1-27` and a five-stage controller whose fourth projected stage is a long receipt (`halloween-trivia/player-core.js:1-7`, `halloween-trivia/index.html:37-41`). The owner rejected receipt-style explanatory copy for this surface and explicitly approved a faster *Who’s That Pokémon?*-like rhythm: setup, pause, reveal.

The existing player already separates projected copy from the hidden source drawer: `populateCard` fills both surfaces (`halloween-trivia/player.js:26-41`), and `I` toggles the source panel independently (`halloween-trivia/player.js:77-86`, `halloween-trivia/player.js:114-138`). Removing the receipt from the projected state machine therefore does not require removing evidence access.

The first and third claims already have verified evidence records: the 9/11 Commission staff report recovery account is at `sources/evidence/2001-suqami-passport-001.json`, and the Senate-documented use of LSD on unwitting subjects under MKULTRA is at `sources/evidence/1953-mkultra-001.json`. The Silverstein records at `sources/evidence/2001-silverstein-001.json` and `sources/evidence/2001-silverstein-002.json` are still marked `primary-link-pending`, but the exact lease date and insurance recovery are stated in official documents now identified for this work: the Port Authority’s 2007 financial statement says the leases began July 24, 2001 and reports an approximately $4.57 billion total recovery; the New York State Comptroller reports the commonly rounded $4.55 billion total. This ticket promotes those two records only after adding the official sources, narrowing their claims to what those documents support, and rebuilding the generated evidence artifacts.

## Confirmed Product Scope

- Card order: passport, Silverstein/WTC lease and insurance recovery, MKULTRA/LSD.
- Projected grammar: `DID YOU KNOW?` stinger → question → punchline → transition. No projected receipt, interpretation paragraph, significance line, or source label.
- Hidden evidence: the `I`/Source panel retains a factual detail, evidence record ID or IDs, and every source needed to support a combined punchline.
- Art: three distinct original vector illustrations inside the established haunted educational-broadcast frame; no raster, remote, generated, or copyrighted media.
- Delivery: update, test, commit, push, verify the live unlinked route, and notify the owner through Signal.

## Design Thesis

A haunted quiz-show eyecatch turns each documented artifact into a bold silhouette and then snaps to one oversized answer. Evidence is backstage unless the operator calls it up, so the yard projection reads instantly at distance without sacrificing the source trail.

## Decisions

### Locked decisions

| Decision | Locked outcome |
|---|---|
| Passport copy | Question: “WHAT WAS FOUND NEAR THE WORLD TRADE CENTER ON 9/11?” Punchline: “A HIJACKER’S PASSPORT.” |
| Silverstein copy | Question: “WHO TOOK OVER THE WTC LEASE 49 DAYS BEFORE 9/11?” Punchline: “LARRY SILVERSTEIN. INSURANCE RECOVERY: $4.55 BILLION.” |
| MKULTRA copy | Question: “WHAT DID THE CIA GIVE PEOPLE WITHOUT TELLING THEM?” Punchline: “LSD — UNDER MKULTRA.” |
| State model | Remove `receipt` from `STAGES`; keep `stinger`, `mystery`, `reveal`, and `transition`. |
| Source model | Support one or more source links per card in the hidden source panel. |
| Evidence corpus | Update only the two Silverstein records with checked official sources, then rebuild `rag-index.json` and `bundle.json`; leave every other evidence record untouched. |
| Route boundary | Keep `/halloween-trivia/` unlinked and `noindex`; do not touch root navigation or the PWA shell. |

### Open decisions

None.

## Technical Requirements

1. Update `sources/evidence/2001-silverstein-001.json` and `sources/evidence/2001-silverstein-002.json` so their claims are limited to the official Port Authority and New York State Comptroller documents, their strongest official citations carry short supporting quotes, and their status becomes `verified` only after the URLs and claim text have been checked. Rebuild `rag-index.json` and `bundle.json` after these claim/quote changes.
2. Update the `cards` array in `halloween-trivia/cards.js` from one to three entries in the locked order. Every entry must provide `id`, evidence identifier text, short question, punchline, hidden detail, one-or-more source links, positive timings for all four stages, and a registered `visual.kind`.
3. Remove projected receipt markup from `halloween-trivia/index.html:37-41`. The remaining projected sections must not contain card detail, significance, or citation text. Retain the hidden `#source-panel` at `halloween-trivia/index.html:60-67` and allow it to render multiple source anchors.
4. Remove `receipt` from `STAGES` in `halloween-trivia/player-core.js:1-7`. Preserve pause/resume, restart, autoplay, preview query parsing, previous/next wraparound, and automatic card advance after transition.
5. Update `halloween-trivia/player.js:1-68` so it registers three renderers, fills only question/reveal fields on the projection, and safely replaces the hidden panel’s source-link list for each active card.
6. Keep and refine `halloween-trivia/visuals/passport.js`; add two new SVG DOM renderers under `halloween-trivia/visuals/` for a lease/key skyline and an MKULTRA vial/eye. Each renderer must expose a unique `data-visual` value and use only native SVG geometry.
7. Update `halloween-trivia/styles.css` to remove receipt-only styling and add stage-aware reveal treatments for all three vector objects. Preserve the 16:9 projector composition, portrait recomposition, high contrast, focus indicators, and `prefers-reduced-motion` behavior.
8. Update `halloween-trivia/player-core.test.mjs` for the four-stage contract and three-card wraparound. Update `halloween-trivia/README.md` so stage, authoring, sourcing, and verification instructions match the shipped player.

## Implementation Plan

### Phase 1 — Verify the sources and lock the four-stage contract (5 points)

**Goal:** Make the controller and DOM express only the approved quiz-show copy while preserving hidden evidence access.

**Steps:**

1. Add checked official sources to the two Silverstein records, narrow their claims, mark them verified, and rebuild the RAG index and evidence bundle.
2. Add the three card records and their source arrays to `cards.js`.
3. Remove receipt from the state machine, markup, runtime bindings, and receipt-specific CSS.
4. Teach the source panel to render all sources for the current card.
5. Update controller and data-contract tests for four stages and three-card navigation.

**Files:** `sources/evidence/2001-silverstein-001.json`, `sources/evidence/2001-silverstein-002.json`, `rag-index.json`, `bundle.json`, `halloween-trivia/cards.js`, `halloween-trivia/player-core.js`, `halloween-trivia/player-core.test.mjs`, `halloween-trivia/index.html`, `halloween-trivia/player.js`, `halloween-trivia/styles.css`.

**Proof class:** Data-artifact rebuild/RAG evaluation, JavaScript syntax/unit tests, editorial-quality scan, and local site render.

**Delegation:** subagent — implement the isolated state/data contract and return changed paths plus unit-test output.

### Phase 2 — Give all three facts distinct vector reveals (5 points)

**Goal:** Make every card visually identifiable at silhouette and reveal stages without leaving the established visual system.

**Steps:**

1. Tune the passport silhouette/reveal to the shortened copy.
2. Build a lease/key skyline SVG renderer and stage-aware CSS motion.
3. Build an MKULTRA vial/eye SVG renderer and stage-aware CSS motion.
4. Register both renderers and verify every card renders the intended unique SVG.
5. Check mystery and reveal states at 1920×1080, 1366×768, and 390×844, including reduced motion.

**Files:** `halloween-trivia/visuals/passport.js`, `halloween-trivia/visuals/lease.js` (new), `halloween-trivia/visuals/mkultra.js` (new), `halloween-trivia/player.js`, `halloween-trivia/styles.css`.

**Proof class:** JavaScript syntax, animation scan, and local browser render at declared viewports.

**Delegation:** subagent — implement both new original SVG renderers and report screenshots, computed layout, and runtime errors.

### Phase 3 — Operator guide and live release (2 points)

**Goal:** Leave the direct-only route documented, reproducibly operable, and verified on GitHub Pages.

**Steps:**

1. Update the guide for four states, three cards, multi-source authoring, and current check commands.
2. Run the complete controller, syntax, editorial, responsive, accessibility, and release verification surface.
3. Push `main`, wait for Pages, inspect the live route, and send the final link/result to Signal.

**Files:** `halloween-trivia/README.md`; ticket lifecycle path.

**Proof class:** Documentation accuracy, local site render, deploy, and one owner notification.

**Delegation:** subagent — independently inspect the live route and return HTTP/browser/route-boundary evidence.

## Testing Strategy

- Run `node --check` for every touched JavaScript module and renderer.
- Run `node --test halloween-trivia/player-core.test.mjs`; do not weaken assertions to pass.
- Scan projected markup and runtime bindings to prove detail, significance, and source labels cannot appear in the four-stage projection.
- Serve the actual static site on a fresh port and render all three cards at 1920×1080, 1366×768, and 390×844. Exercise autoplay, manual navigation, source-panel focus/close, fullscreen, and reduced-motion behavior; capture mystery/reveal proofs and inspect console/network failures and overflow.
- Confirm original SVG-only assets and distinct `data-visual` values for all three renderers.
- Rebuild with `node tools/build-rag-index.mjs && node tools/rag-eval.mjs` and `node tools/build-bundle.mjs`; require RAG 5/5 and commit both generated artifacts with the two Silverstein record changes.
- After pushing, require HTTP 200 and the new three-card copy/renderer registry on `https://2pizzaclub.com/halloween-trivia/`.

## Acceptance Criteria / Definition of Done

- [ ] The route cycles exactly three cards in the locked order and wraps from card 3 to card 1.
- [ ] Both Silverstein evidence records cite the checked official documents, contain only supported claim text, and are `verified`; regenerated `rag-index.json` and `bundle.json` match them.
- [ ] Each card projects only the shared stinger, its short question, its punchline, and the generic transition; no receipt/detail/significance/source prose appears in the projection DOM.
- [ ] The three locked questions and punchlines match this ticket exactly.
- [ ] `I`/Source opens the current card’s factual detail, evidence ID text, and all required official source links; closing returns focus to the Source control.
- [ ] Passport, lease/key skyline, and MKULTRA vial/eye render as three distinct original SVG illustrations with no raster, remote, generated, or copyrighted assets.
- [ ] Autoplay, pause/resume, restart, previous/next wraparound, preview queries, fullscreen, and source controls work without console errors.
- [ ] Mystery and reveal copy remains within the broadcast frame at 1920×1080, 1366×768, and 390×844; reduced-motion mode has no animated transitions.
- [ ] All touched JavaScript passes syntax checks and the controller tests pass.
- [ ] The rebuilt RAG evaluation remains 5/5 and unrelated dirty worktree files are untouched.
- [ ] The route stays unlinked and `noindex`; root navigation and `sw.js` are unchanged.
- [ ] The pushed live route returns HTTP 200 and visibly contains all three cards.
- [ ] The owner receives one Signal completion message containing the live URL.

## Dependencies

- Built on completed ticket `docs/tickets/complete/001_feature_halloween_trivia_projection.md`.
- External availability of the official Port Authority, New York State Comptroller, Senate, and GovInfo source URLs for the hidden panel.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| The Silverstein line implies the entire recovery was a personal cash payout | Use the neutral label “INSURANCE RECOVERY,” and explain allocation/rebuilding uses only in the hidden detail. |
| Long answers overflow at projector distance | Keep the locked copy under two short clauses, size against the longest Silverstein reveal, and render every viewport. |
| Removing receipt breaks preview or autoplay timing | Pin the four-stage order and authored delays in unit tests before visual work. |
| New renderer CSS leaks across cards | Scope object classes and verify each `data-card-id`/`data-visual` combination independently. |
| Multi-agent worktree sweeps unrelated evidence changes | Stage and commit explicit Halloween/ticket paths only; never blanket add, stash, or clean. |

## Out of Scope

- Researching or sourcing cartoon footage.
- Adding the remaining ten planned trivia cards.
- Editing the main 2pizzaclub timeline, any evidence record beyond the two named Silverstein records, root navigation, service worker, or PWA shell.
- Exporting MP4/video, adding audio, or publishing to social platforms.
- Drawing a conspiracy inference from lease timing, insurance litigation, passport recovery, or MKULTRA documentation.
