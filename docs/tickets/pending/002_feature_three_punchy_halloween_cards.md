# 002 — Three punchy Halloween trivia cards

- **Status:** Ready
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

## Orchestration Protocol

The builder is the orchestrator. Delegate each phase using the hardened brief below, keep phase ownership disjoint, and personally rerun every named gate before committing. Preserve unrelated dirty files and stage only the paths named by this ticket.

Every delegated brief carries this requirement verbatim:

> Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives.

Toolchain baseline measured during polish on 2026-08-02:

- `node --test halloween-trivia/player-core.test.mjs` → 6 tests, 6 passed, 0 failed.
- `node tools/rag-eval.mjs` → 5/5 fixtures passed.
- `node`, `python3`, `curl`, `git`, and `jq` resolve in `PATH`.
- The installed dev-browser package and dependencies are present at `/home/wabbazzar/.claude/plugins/cache/dev-browser-marketplace/dev-browser/66682fb0513a/skills/dev-browser`; `curl http://127.0.0.1:9222/` returned HTTP 200 with a CDP endpoint. This is a shared service: create fresh ticket-named pages, close only those pages, and do not kill the server or unrelated pages.

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

**Gate classes:** Data artifacts, typecheck/lint, editorial quality, and site render.

**Delegation:** subagent — In `/home/wabbazzar/code/2pizzaclub`, own only `sources/evidence/2001-silverstein-001.json`, `sources/evidence/2001-silverstein-002.json`, `rag-index.json`, `bundle.json`, `halloween-trivia/cards.js`, `halloween-trivia/player-core.js`, `halloween-trivia/player-core.test.mjs`, `halloween-trivia/index.html`, and the data/source-binding portions of `halloween-trivia/player.js` and `halloween-trivia/styles.css`. Add the two checked official sources, narrow and verify the records, rebuild both artifacts, implement the four-stage/three-card data contract, remove projected receipt bindings, and add multi-source hidden-panel rendering. Do not touch visual geometry. Return ≤40 lines: files changed; commands run + exit codes; test counts and RAG result; relevant grep/HTTP evidence; blockers. Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives.

**Verification surface — orchestrator reruns before the phase commit:**

```bash
jq empty sources/evidence/2001-silverstein-001.json sources/evidence/2001-silverstein-002.json
node tools/build-rag-index.mjs && node tools/rag-eval.mjs
node tools/build-bundle.mjs
node --check halloween-trivia/cards.js
node --check halloween-trivia/player-core.js
node --check halloween-trivia/player-core.test.mjs
node --check halloween-trivia/player.js
node --test halloween-trivia/player-core.test.mjs
! rg -n 'data-stage-copy="receipt"|data-card-significance|receipt-detail|receipt-source' halloween-trivia/index.html halloween-trivia/player.js halloween-trivia/styles.css
node --input-type=module -e "import assert from 'node:assert/strict'; import {cards} from './halloween-trivia/cards.js'; import {STAGES} from './halloween-trivia/player-core.js'; assert.deepEqual(STAGES,['stinger','mystery','reveal','transition']); assert.equal(cards.length,3); assert.equal(new Set(cards.map(card=>card.visual.kind)).size,3); for (const card of cards) { assert.ok(card.sources.length); assert.deepEqual(Object.keys(card.timing),STAGES); }"
git diff --check -- sources/evidence/2001-silverstein-001.json sources/evidence/2001-silverstein-002.json rag-index.json bundle.json halloween-trivia/cards.js halloween-trivia/player-core.js halloween-trivia/player-core.test.mjs halloween-trivia/index.html halloween-trivia/player.js halloween-trivia/styles.css
```

**Observable phase DoD:** both Silverstein records report `status: "verified"` with official URL-bearing citations; generated artifacts contain the new record text; RAG prints 5/5; unit tests pin four stages and three-card wraparound; the projection receipt grep returns no matches.

### Phase 2 — Give all three facts distinct vector reveals (5 points)

**Goal:** Make every card visually identifiable at silhouette and reveal stages without leaving the established visual system.

**Steps:**

1. Tune the passport silhouette/reveal to the shortened copy.
2. Build a lease/key skyline SVG renderer and stage-aware CSS motion.
3. Build an MKULTRA vial/eye SVG renderer and stage-aware CSS motion.
4. Register both renderers and verify every card renders the intended unique SVG.
5. Check mystery and reveal states at 1920×1080, 1366×768, and 390×844, including reduced motion.

**Files:** `halloween-trivia/visuals/passport.js`, `halloween-trivia/visuals/lease.js` (new), `halloween-trivia/visuals/mkultra.js` (new), `halloween-trivia/player.js`, `halloween-trivia/styles.css`.

**Gate classes:** Typecheck/lint and site render.

**Delegation:** subagent — In `/home/wabbazzar/code/2pizzaclub`, own `halloween-trivia/visuals/passport.js`, new `halloween-trivia/visuals/lease.js`, new `halloween-trivia/visuals/mkultra.js`, renderer imports/registry in `halloween-trivia/player.js`, and visual/stage CSS in `halloween-trivia/styles.css`. Build the locked passport, lease/key skyline, and MKULTRA vial/eye silhouettes with native SVG geometry only. Preserve the broadcast frame and reduced-motion behavior. Serve on a fresh port, create only ticket-named browser pages, and return ≤40 lines: files changed; commands + exit codes; screenshots and viewport measurements; runtime/network errors; blockers. Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives.

**Verification surface — orchestrator reruns before the phase commit:**

```bash
node --check halloween-trivia/player.js
node --check halloween-trivia/visuals/passport.js
node --check halloween-trivia/visuals/lease.js
node --check halloween-trivia/visuals/mkultra.js
rg -n '<(image|use|foreignObject)|href=|https?://' halloween-trivia/visuals/*.js
rg -n '@keyframes|animation:' halloween-trivia/styles.css
git diff --check -- halloween-trivia/player.js halloween-trivia/styles.css halloween-trivia/visuals/passport.js halloween-trivia/visuals/lease.js halloween-trivia/visuals/mkultra.js
```

Start `python3 -m http.server 8748` in a persistent TTY from the repository root, then require `curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8748/halloween-trivia/` → `200`. Through the installed dev-browser client, create fresh pages named with `ticket002`; exercise autoplay and ArrowRight across all three cards at 1920×1080, 1366×768, and 390×844. At each viewport capture mystery and reveal states and record: `data-card-id`, `svg[data-visual]`, active copy bounding box within the broadcast frame, horizontal/vertical overflow, console errors, failed responses, and screenshot path. Repeat reveal checks with reduced motion and require computed transition/animation durations of zero. Open Source with `I` on every card; require the current evidence IDs and official URLs, then close with Escape and require focus returns to Source. Close only ticket-created pages and verify none remain.

**Observable phase DoD:** the three cards report three distinct `data-visual` values; all six required state captures per viewport stay inside the frame with zero page overflow and zero console/network failures; reduced motion has no motion; source focus behavior passes.

### Phase 3 — Operator guide and live release (2 points)

**Goal:** Leave the direct-only route documented, reproducibly operable, and verified on GitHub Pages.

**Steps:**

1. Update the guide for four states, three cards, multi-source authoring, and current check commands.
2. Run the complete controller, syntax, editorial, responsive, accessibility, and release verification surface.
3. Push `main`, wait for Pages, inspect the live route, and send the final link/result to Signal.

**Files:** `halloween-trivia/README.md`; ticket lifecycle path.

**Gate classes:** Typecheck/lint, data-artifact regression, editorial quality, site render, deploy, and notifications.

**Delegation:** subagent — Independently inspect the finished repository and live Pages route without editing application files. Verify README/runtime agreement, syntax/tests/RAG, `noindex` and direct-only boundary, all three live copy strings and renderer imports, HTTP 200, browser console/network health, and the absence of ticket-owned background pages/processes. Return ≤40 lines: commands + exit codes; test/RAG counts; HTTP/browser evidence; exact blockers. Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives.

**Verification surface — orchestrator reruns before graduation:**

```bash
node --check halloween-trivia/cards.js halloween-trivia/player-core.js halloween-trivia/player-core.test.mjs halloween-trivia/player.js halloween-trivia/visuals/passport.js halloween-trivia/visuals/lease.js halloween-trivia/visuals/mkultra.js
node --test halloween-trivia/player-core.test.mjs
node tools/rag-eval.mjs
rg -n 'WHAT WAS FOUND NEAR THE WORLD TRADE CENTER ON 9/11\?|A HIJACKER.S PASSPORT|WHO TOOK OVER THE WTC LEASE 49 DAYS BEFORE 9/11\?|INSURANCE RECOVERY: \$4.55 BILLION|WHAT DID THE CIA GIVE PEOPLE WITHOUT TELLING THEM\?|LSD . UNDER MKULTRA' halloween-trivia/cards.js
rg -n '<meta name="robots" content="noindex">' halloween-trivia/index.html
git diff --exit-code 4c9a25d -- index.html sw.js manifest.webmanifest
git diff --check
```

Before push, run `git fetch origin main` and `git rev-list --left-right --count HEAD...origin/main`. If origin has advanced, do not stash or autostash the unrelated dirty tree; report the exact divergence and coordinate safely. Otherwise push `main`, then poll `https://2pizzaclub.com/halloween-trivia/` until it returns HTTP 200 and its fetched `cards.js` contains all three IDs. Render the live route once at 1920×1080 and 390×844 using fresh ticket-named pages; require three-card navigation, unique visuals, no overflow, no console/network failures, and working hidden sources. Send exactly one completion notification through `/home/wabbazzar/code/wabbazzar-ice/scripts/notify.sh` containing the live URL and concise pass result.

**Observable phase DoD:** README matches the four-stage/three-card runtime; tests and RAG are green; root/PWA files match pre-ticket commit `4c9a25d`; pushed live files contain all three cards; live renders pass; one Signal completion send succeeds.

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

## Ledger

The builder appends one row after each committed phase. Include the exact commit, builder form, gate result, and any honest deferral.

| Phase | Commit | Builder | Gate evidence | Deferred / notes |
|---|---|---|---|---|
| 1 — sources + four-stage contract | `a9206a9` | builder: inline (two delegated workers stalled before any file change; orchestrator retained the already-read, bounded file set) | JSON 2/2; isolated clean-snapshot RAG rebuild 2,259 units and eval 5/5; bundle 317/317 records + 115/115 captures; controller 6/6; receipt grep clear; contract check clear; local HTTP 200; browser visited all 3 cards with source counts 1/2/2 and `errors:[]`. | First in-place artifact build was discarded because unrelated dirty evidence entered it; committed artifacts were rebuilt from `git archive HEAD` plus only the two owned records. Unrelated worktree changes remain unstaged. |
| 2 — three vector reveals | `0775b29` | builder: inline (delegated vector worker stalled before any file change; orchestrator retained the bounded renderer/CSS set) | Renderer syntax 3/3 + registry syntax passed; vector/remote-asset and repeating-animation scans clear; local HTTP 200; 18 mystery/reveal renders across 1920×1080, 1366×768, and 390×844 all reported `copyInsideFrame:true`, overflow 0/0, `errors:[]`, and `badResponses:[]`; visuals were passport/lease/mkultra; reduced-motion transitions/animations were `0s`; all three source drawers focused and returned focus with 1/2/2 official links. | Representative passport, lease, MKULTRA, and portrait captures inspected at `tmp/ticket002/`; port 8749 and the ticket-owned browser closed. Unrelated worktree changes remain unstaged. |
| 3 — guide + live release | release-candidate commit pending | builder: subagent (1 agent) + orchestrator deploy | Operator guide matches four stages, three cards, hidden multi-source evidence, and three renderers; syntax 7/7, controller 6/6, RAG 5/5, exact-copy scan 6/6, `noindex` present, receipt scan clear, editorial scan clear, and root `index.html`/`sw.js`/manifest unchanged from `4c9a25d`. | Subagent supplied the README update before interruption; orchestrator reran the full local gate. Live Pages proof and Signal remain for the release candidate. Unrelated worktree changes remain unstaged. |

Run this ticket with `execute-ticket` after confirming the Decisions section still has no open item.

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
