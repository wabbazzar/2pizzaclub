# 003 — Seven more Halloween trivia cards

- **Status:** Polished — ready for execution
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

## Visual System

- **Ink `#1A1A2E`:** outer surface, silhouette fill, and darkest line work.
- **Royal `#1B3FB5`:** broadcast field and structural blue.
- **Cream `#FFF8E7`:** primary projected text, frame, and high-contrast reveal fill.
- **Mustard `#FFD93D`:** aperture, mystery energy, and visible keyboard focus.
- **Dusty red `#E63946`:** alert marks and one reveal accent per scene.
- **Green `#06D6A0`:** sparing confirmation/source accent; never a second dominant accent.
- **Display role:** Impact/Haettenschweiler/Arial Black for stinger, question, and reveal; large uppercase forms sized for yard projection.
- **Body role:** rounded system face for operator controls and Source detail.
- **Utility role:** monospaced system face for card count and evidence identifiers.
- **Layout:** visual artifact at left and copy at right in 16:9; portrait recomposes artifact above copy instead of shrinking the desktop split.
- **Signature element:** the yellow evidence aperture opens around each artifact; per-card props and transformations do the differentiation.

### Pre-build critique findings

- The aperture is the only repeated flourish; every new scene needs a different central silhouette and reveal action so the set does not become seven recolors of one template.
- The dart-pistol and Paperclip punchlines are the overflow stress cases; size the shared copy system against them instead of shrinking only those cards.
- The portrait layout must recompose artifact-above-copy and keep controls/source usable; scaling the 16:9 canvas down is not acceptable.
- Motion explains silhouette → artifact continuity only. Repeating ambient animation, particles without meaning, and motion that survives `prefers-reduced-motion` are removed.
- The Source drawer is backstage evidence, not a fifth projected state; its focus entry/return is a release gate.

## Decisions

### Locked decisions

| # | Question | Punchline | Evidence / checked source |
|---|---|---|---|
| 4 | `WHAT DID THE JOINT CHIEFS PROPOSE STAGING IN U.S. CITIES IN 1962?` | `TERROR ATTACKS TO BLAME ON CUBA — PART OF OPERATION NORTHWOODS.` | `1962-northwoods-001`; [declassified JCS memorandum](https://nsarchive.gwu.edu/CMC-60/joint-chiefs-pretexts-to-invade-Cuba-1962) |
| 5 | `WHAT SECRET WEAPON DID THE CIA SHOW THE SENATE IN 1975?` | `A PISTOL THAT FIRED A TINY POISON DART — DESIGNED TO KILL WITHOUT AN OBVIOUS TRACE.` | `1975-heart-attack-gun-001`; [Church Committee hearing](https://intelligence.senate.gov/sites/default/files/94intelligence_activities_I.pdf) |
| 6 | `WHICH U.S. NAVY SHIP DID ISRAELI FORCES ATTACK OFF GAZA IN 1967?` | `THE USS LIBERTY — 34 AMERICANS WERE KILLED. ISRAEL SAID IT WAS MISTAKEN IDENTITY.` | new `1967-uss-liberty-001`; [NSA history](https://www.nsa.gov/History/National-Cryptologic-Museum/Exhibits-Artifacts/Exhibit-View/Article/2718838/cold-war-uss-liberty/) |
| 7 | `WHAT OUTNUMBERED UNITED AIRLINES CALL OPTIONS BY MORE THAN 20 TO 1 FIVE DAYS BEFORE 9/11?` | `PUT OPTIONS — BETS THAT THE STOCK WOULD FALL. INVESTIGATORS LATER REPORTED NO 9/11 FOREKNOWLEDGE.` | `2001-put-options-001`; [9/11 Commission monograph](https://govinfo.library.unt.edu/911/staff_statements/911_TerrFin_Monograph.pdf) |
| 8 | `HOW MANY GERMAN SCIENTISTS DID THE U.S. BRING OVER AFTER WORLD WAR II?` | `MORE THAN 1,500 UNDER PAPERCLIP AND RELATED PROGRAMS — INCLUDING MEN TIED TO SLAVE LABOR AND CAMP EXPERIMENTS.` | `1945-operation-paperclip-001`; [National Archives](https://www.archives.gov/iwg/declassified-records/rg-330-defense-secretary) |
| 9 | `WHAT DID THE FBI ANONYMOUSLY SEND MARTIN LUTHER KING JR. IN 1964?` | `SECRET RECORDINGS AND A THREATENING LETTER — WIDELY READ AS PRESSURING HIM TO KILL HIMSELF.` | `1956-cointelpro-001`; [Church Committee report](https://www.intelligence.senate.gov/sites/default/files/94755_III.pdf) and [FBI Vault](https://vault.fbi.gov/Martin%20Luther%20King%2C%20Jr.) |
| 10 | `DID THE BULLET FRAGMENT RECOVERED FROM CHARLIE KIRK MATCH THE RIFLE?` | `THE ATF COULD NEITHER MATCH NOR EXCLUDE IT — THE RESULT WAS INCONCLUSIVE.` | new `2025-kirk-ballistics-001`; [AP court-reporting receipt](https://apnews.com/article/76ccb25a0e71f9436334c2029dceb20c) |

Locked hidden details, projected nowhere:

| Card | Hidden detail |
|---|---|
| Northwoods | `A 1962 Joint Chiefs memorandum proposed pretexts for invading Cuba, including a terror campaign in Miami, other Florida cities, and Washington. The proposal was not carried out.` |
| Dart pistol | `At a September 1975 Church Committee hearing, CIA Director William Colby displayed a pistol modified to fire a tiny toxin dart. Testimony said the wound and toxin were designed to be difficult to detect.` |
| USS Liberty | `The National Security Agency says Israeli fighters and torpedo boats attacked USS Liberty 25 miles off Gaza on June 8, 1967, killing 34 Americans. Israel described it as an identification error, and the U.S. government accepted that explanation.` |
| Put options | `The 9/11 Commission staff reported that United Airlines put volume on September 6 exceeded call volume by more than 20 to 1. The SEC and FBI traced the trades and reported no evidence of advance knowledge.` |
| Paperclip | `National Archives files cover more than 1,500 German and other foreign specialists brought to the United States under Paperclip and related programs. The files include men tied to forced labor and concentration-camp experiments.` |
| COINTELPRO | `The Church Committee documented an anonymous FBI letter and surveillance recordings mailed to Martin Luther King Jr. in November 1964. The package became known as the FBI “suicide letter.”` |
| Kirk ballistics | `Court filings and later testimony described the ATF comparison of a damaged bullet-jacket fragment to the recovered rifle as inconclusive: examiners could neither identify nor exclude the rifle as the source.` |

Additional locked outcomes:

- Keep `STAGES` unchanged at `stinger`, `mystery`, `reveal`, and `transition`.
- Lock the shared timings at `stinger: 1200`, `mystery: 4200`, `reveal: 3600`, and `transition: 900` milliseconds for all ten cards.
- Keep the Source panel as the only location for detail and links.
- Keep `/halloween-trivia/` unlinked and `noindex`; do not change the root navigation, service worker, or PWA shell.

### Open decisions

None.

## Orchestration Protocol

The builder is the orchestrator. Build in the clean clone at `/tmp/2pizzaclub-ticket003.ted8Im` on `main`; the original checkout contains unrelated in-progress evidence work and is read-only for this ticket. Delegate the heavy slices below, keep file ownership disjoint, and personally rerun every named gate before every commit. Stage explicit ticket-owned paths only; never use `git add -A`, stash/autostash, clean, reset, or force-push.

Every delegated brief carries this requirement verbatim:

> Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives. If it needs a spend, an outward-facing action, or a destructive change, stop and report instead.

Toolchain baseline measured during polish on 2026-08-03:

- Node `v24.12.0`, Python `3.12.3`, curl `8.5.0`, git `2.43.0`, and jq `1.7` resolve in `PATH`.
- Existing JavaScript syntax checks pass for `cards.js`, `player-core.js`, `player-core.test.mjs`, `player.js`, and the three shipped renderers.
- `node --test halloween-trivia/player-core.test.mjs` reports 6 tests, 6 passed, 0 failed.
- `node tools/rag-eval.mjs` reports 5/5 fixtures passed. In the disposable clone, `tools/node_modules` may be temporarily symlinked to the installed original-checkout directory; it appears untracked, must never be staged, and must be unlinked before every phase boundary.
- The shared dev-browser server answers `http://127.0.0.1:9222/` with HTTP 200. Its installed client is `/home/wabbazzar/.claude/plugins/cache/dev-browser-marketplace/dev-browser/66682fb0513a/skills/dev-browser`. It is shared infrastructure: create fresh `ticket003-*` pages, close only those pages, and never kill its server or unrelated Chromium processes.
- A fresh local serve on port 8753 returned HTTP 200. The 1920×1080 baseline rendered `suqami-passport`/`passport` with page overflow `0/0`, `noindex`, `errors:[]`, and `bad:[]`; the ticket page and owned HTTP server were closed.
- The pre-build application baseline is commit `4e507fd`; forbidden root/PWA files are compared to it before release.

## Technical Requirements

1. Add the identified Senate PDF URL and a short supporting quote to `sources/evidence/1975-heart-attack-gun-001.json`, narrow unsupported mechanism language, and promote the record only after the official transcript supports the published wording.
2. Add `sources/evidence/1967-uss-liberty-001.json` under the existing `y1967-six-day-war` anchor with the NSA account: Israeli fighters and torpedo boats attacked the U.S. Navy ship off Gaza on June 8, 1967; 34 Americans were killed; Israel described the attack as an identification error and the U.S. government accepted that explanation.
3. Add `sources/evidence/2025-kirk-ballistics-001.json` under the existing `y2025-kirk` anchor, limited to the disclosed ATF comparison: the recovered bullet-jacket fragment could neither be identified nor excluded as fired from the recovered rifle, so the result was inconclusive. Attribute procedural claims to court filings/reporting and do not state who killed Kirk. Do not edit the concurrently modified `2025-cullen-no-ballistic-001.json`.
4. Update `sources/evidence/2001-put-options-001.json` so the 9/11 Commission citation carries the direct `more than 20` put-to-call support and the no-foreknowledge finding. Update `sources/evidence/1945-operation-paperclip-001.json` to use the checked National Archives URL and support the `more than 1,500`/forced-labor/camp-experiment wording. Do not change the card conclusions beyond the locked copy.
5. Add both new records to `sources/evidence/manifest.json`, then rebuild and commit `rag-index.json` and `bundle.json` after all five ticket-owned evidence claim/quote edits.
6. Extend `halloween-trivia/cards.js` to exactly ten entries in the locked order. Every new entry supplies `id`, `evidenceIds`, exact `question`, exact `reveal`, the locked hidden `detail`, checked `sources`, the locked timings for every current stage, and a unique registered `visual.kind`.
7. Add seven renderer modules under `halloween-trivia/visuals/`: `northwoods.js`, `dart-pistol.js`, `uss-liberty.js`, `put-options.js`, `paperclip.js`, `cointelpro.js`, and `kirk-ballistics.js`. Each renderer returns native SVG, exposes a unique `data-visual`, includes a useful accessible label, and uses no `<image>`, remote reference, generated asset, or copyrighted character.
8. Register the seven renderers in `halloween-trivia/player.js` without changing controller or source-panel behavior.
9. Extend the stage-aware styles in `halloween-trivia/styles.css`. Mystery must read as a silhouette at projection distance; reveal may add only finite state-transition motion. Preserve focus indicators, 16:9 composition, portrait recomposition at 390×844, and `prefers-reduced-motion` zero-duration behavior.
10. Extend `halloween-trivia/player-core.test.mjs` and add `halloween-trivia/cards.test.mjs` so the latter proves ten-card count/order, unique visual kinds, positive timings, valid source arrays, exact approved copy, and card 10 → card 1 controller wraparound.
11. Update `halloween-trivia/README.md` from three to ten cards, list all renderer checks, and document the seven new source-backed scenes without exposing the route from the root site.

## Implementation Plan

### Phase 1 — Evidence and generated artifacts (5 points)

**Goal:** Put the seven projected statements on a checked evidence footing without changing the live Halloween runtime.

**Steps:** update the dart-pistol, put-options, and Paperclip records; add USS Liberty and Kirk ballistics records under existing anchors; update the evidence manifest; rebuild both committed artifacts; render the two new timeline cards; remove the pre-existing 11 px mobile header spill exposed by the required 390 px gate.

**Files:** `sources/evidence/1975-heart-attack-gun-001.json`, new `sources/evidence/1967-uss-liberty-001.json`, `sources/evidence/2001-put-options-001.json`, `sources/evidence/1945-operation-paperclip-001.json`, new `sources/evidence/2025-kirk-ballistics-001.json`, `sources/evidence/manifest.json`, `rag-index.json`, `bundle.json`, and `styles.css`.

**Gate classes:** Data artifacts, editorial quality, site render, and path-limited diff hygiene.

**Delegation:** subagent — In `/tmp/2pizzaclub-ticket003.ted8Im`, own only the eight files named above. Check the locked official/authoritative URLs, retain only source-supported language, add short supporting quotes, set `status: "verified"` only when supported, add the two new manifest entries exactly once, and rebuild both artifacts. Do not edit `2025-cullen-no-ballistic-001.json` or any Halloween runtime file. Return ≤40 lines: files changed; commands + exit codes; artifact counts; RAG result; rendered record IDs/HTTP status; blockers. Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives. If it needs a spend, an outward-facing action, or a destructive change, stop and report instead.

**Verification surface — orchestrator reruns before commit:**

```bash
jq empty sources/evidence/1975-heart-attack-gun-001.json sources/evidence/1967-uss-liberty-001.json sources/evidence/2001-put-options-001.json sources/evidence/1945-operation-paperclip-001.json sources/evidence/2025-kirk-ballistics-001.json sources/evidence/manifest.json
jq -e --argjson want '["1967-uss-liberty-001.json","2025-kirk-ballistics-001.json"]' '.records as $records | $want | all(.[]; . as $f | ([$records[] | select(. == $f)] | length) == 1)' sources/evidence/manifest.json
node tools/build-rag-index.mjs && node tools/rag-eval.mjs
node tools/build-bundle.mjs
node --input-type=module -e "import assert from 'node:assert/strict'; import {readFile} from 'node:fs/promises'; const ids=['1975-heart-attack-gun-001','1967-uss-liberty-001','2001-put-options-001','1945-operation-paperclip-001','2025-kirk-ballistics-001']; const bundle=JSON.parse(await readFile('bundle.json')); const rag=JSON.parse(await readFile('rag-index.json')); for (const id of ids) { const record=JSON.parse(await readFile('sources/evidence/'+id+'.json')); const built=bundle.records[id+'.json']; assert.equal(record.status,'verified'); assert.ok(record.sources.some(source=>source.url&&source.quote?.trim())); assert.equal(built.id,record.id); assert.equal(built.claim,record.claim); assert.deepEqual(built.sources,record.sources); assert.equal(built.status,record.status); assert.ok(rag.units.some(unit=>unit.id===id)); }"
if jq -r '.claim' sources/evidence/{1975-heart-attack-gun-001,1967-uss-liberty-001,2001-put-options-001,1945-operation-paperclip-001,2025-kirk-ballistics-001}.json | rg -ni '\b(reel|the post|the video|we|our)\b|@[[:alnum:]_]'; then exit 1; fi
if jq -r '.claim' sources/evidence/{1975-heart-attack-gun-001,1967-uss-liberty-001,2001-put-options-001,1945-operation-paperclip-001,2025-kirk-ballistics-001}.json | rg -ni '\b(proves?|proof|obviously|clearly|conspiracy)\b'; then exit 1; fi
git diff --check -- sources/evidence/1975-heart-attack-gun-001.json sources/evidence/1967-uss-liberty-001.json sources/evidence/2001-put-options-001.json sources/evidence/1945-operation-paperclip-001.json sources/evidence/2025-kirk-ballistics-001.json sources/evidence/manifest.json rag-index.json bundle.json
```

Start `python3 -m http.server 8755` from the clone and require `curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8755/` → `200`. Through the installed dev-browser client, create `ticket003-phase1` at 390×844; require `[data-evidence-id="1967-uss-liberty-001"]` and `[data-evidence-id="2025-kirk-ballistics-001"]`, their checked source links, page overflow `0/0`, `errors:[]`, and `badResponses:[]`. Close that page and stop only port 8755.

**Observable phase DoD:** all five records have checked URL-bearing quotes and `verified` status; the manifest contains each new record exactly once; the committed bundle matches each record; RAG prints 5/5; both new timeline cards render locally without browser errors; the 390 px timeline has zero horizontal overflow. Commit with explicit Phase 1 paths only.

### Phase 2 — Cards 4–7 and four vector reveals (5 points)

**Goal:** Extend the healthy runtime from three to seven cards with complete Northwoods, dart-pistol, USS Liberty, and put-options scenes in one atomic slice.

**Steps:** append cards 4–7 with exact copy/details/sources; build and register four native-SVG renderers; add scoped stage-aware CSS; extend tests to seven cards; render the complete seven-card sequence.

**Files:** `halloween-trivia/cards.js`, `halloween-trivia/player.js`, `halloween-trivia/player-core.test.mjs`, new `halloween-trivia/cards.test.mjs`, `halloween-trivia/styles.css`, and new `halloween-trivia/visuals/northwoods.js`, `dart-pistol.js`, `uss-liberty.js`, and `put-options.js`.

**Gate classes:** Typecheck/lint, site render, accessibility/reduced motion, and path-limited diff hygiene.

**Delegation:** subagent — In `/tmp/2pizzaclub-ticket003.ted8Im`, own only the Phase 2 files. Append locked cards 4–7 using IDs/visual kinds `operation-northwoods`/`northwoods`, `cia-dart-pistol`/`dart-pistol`, `uss-liberty`/`uss-liberty`, and `united-put-options`/`put-options`; build four complete original SVG scenes and their scoped finite reveal styles; register all four; extend tests from three to seven without weakening existing assertions. Return ≤40 lines: files changed; commands + exits/test counts; seven-card viewport/source/reduced-motion evidence; screenshot paths; console/network results; blockers. Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives. If it needs a spend, an outward-facing action, or a destructive change, stop and report instead.

**Verification surface — orchestrator reruns before commit:**

```bash
for file in halloween-trivia/cards.js halloween-trivia/player.js halloween-trivia/player-core.test.mjs halloween-trivia/cards.test.mjs halloween-trivia/visuals/passport.js halloween-trivia/visuals/lease.js halloween-trivia/visuals/mkultra.js halloween-trivia/visuals/northwoods.js halloween-trivia/visuals/dart-pistol.js halloween-trivia/visuals/uss-liberty.js halloween-trivia/visuals/put-options.js; do node --check "$file"; done
node --test halloween-trivia/player-core.test.mjs halloween-trivia/cards.test.mjs
node --input-type=module -e "import assert from 'node:assert/strict'; import {cards} from './halloween-trivia/cards.js'; import {STAGES} from './halloween-trivia/player-core.js'; assert.equal(cards.length,7); assert.equal(new Set(cards.map(card=>card.visual.kind)).size,7); assert.deepEqual(cards.slice(3).map(card=>card.id),['operation-northwoods','cia-dart-pistol','uss-liberty','united-put-options']); for (const card of cards) { assert.deepEqual(Object.keys(card.timing),STAGES); assert.ok(STAGES.every(stage=>card.timing[stage]>0)); assert.ok(card.evidenceIds.length&&card.sources.length&&card.sources.every(source=>source.url)); }"
! rg --pcre2 -n '<(image|use|foreignObject)|(?:xlink:)?href\s*=|https?://(?!www\.w3\.org/2000/svg)' halloween-trivia/visuals/*.js
! rg -n 'animation-iteration-count:\s*infinite|animation:[^;]*\binfinite\b' halloween-trivia/styles.css
git diff --check -- halloween-trivia/cards.js halloween-trivia/player.js halloween-trivia/player-core.test.mjs halloween-trivia/cards.test.mjs halloween-trivia/styles.css halloween-trivia/visuals/northwoods.js halloween-trivia/visuals/dart-pistol.js halloween-trivia/visuals/uss-liberty.js halloween-trivia/visuals/put-options.js
```

Start `python3 -m http.server 8756`. The delegated worker creates ignored `tmp/ticket003/phase2-browser.ts`; the orchestrator reruns it from the installed dev-browser directory with `npx tsx /tmp/2pizzaclub-ticket003.ted8Im/tmp/ticket003/phase2-browser.ts`. It must create fresh `ticket003-phase2-*` pages and, for all 7 cards × `mystery`/`reveal` × 1920×1080, 1366×768, and 390×844, record the exact card ID, unique `svg[data-visual]`, nonempty SVG accessible label, active-copy/frame rectangles with `inside:true`, page overflow `0/0`, `errors:[]`, and `badResponses:[]`. For every card, `I` must focus `source-panel`, show the expected evidence IDs/URLs, and Escape must return focus to `source-toggle`. With `reducedMotion:'reduce'`, all four stages must have maximum computed transition/animation duration `0`. Close only `ticket003-phase2-*`, require none remain in `client.list()`, stop port 8756, and do not kill the shared browser service.

**Observable phase DoD:** the player remains healthy and cycles exactly seven cards; all seven visuals are unique; 42 mystery/reveal viewport cases are inside the frame with no browser failures; all seven source/focus checks and reduced-motion checks pass. Commit with explicit Phase 2 paths only.

### Phase 3 — Cards 8–10, full visual pass, and guide (5 points)

**Goal:** Extend the healthy runtime from seven to ten cards with Paperclip, COINTELPRO, and Kirk-ballistics scenes, then prove the complete show and operator guide.

**Steps:** append cards 8–10 with exact copy/details/sources; build and register three native-SVG renderers; add scoped CSS; lock exact ten-card data tests and wraparound; update the guide; traverse all ten cards and revise the largest rendered mismatch before commit.

**Files:** `halloween-trivia/cards.js`, `halloween-trivia/player.js`, `halloween-trivia/player-core.test.mjs`, `halloween-trivia/cards.test.mjs`, `halloween-trivia/styles.css`, `halloween-trivia/README.md`, and new `halloween-trivia/visuals/paperclip.js`, `cointelpro.js`, and `kirk-ballistics.js`.

**Gate classes:** Typecheck/lint, data-artifact regression, editorial quality, site render, accessibility/reduced motion, and path-limited diff hygiene.

**Delegation:** subagent — In `/tmp/2pizzaclub-ticket003.ted8Im`, own only the Phase 3 files. Append locked cards 8–10 using IDs/visual kinds `operation-paperclip`/`paperclip`, `fbi-king-letter`/`cointelpro`, and `kirk-ballistics`/`kirk-ballistics`; build three complete original SVG scenes and scoped finite reveal styles; register them; lock the exact 10-card contract and update the guide. Render the full matrix and fix the largest thesis/hierarchy/overflow mismatch. Return ≤40 lines: files; commands + exits/test/RAG counts; 10-card viewport/source/reduced-motion evidence; screenshots; console/network results; blockers. Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives. If it needs a spend, an outward-facing action, or a destructive change, stop and report instead.

**Verification surface — orchestrator reruns before commit:**

```bash
for file in halloween-trivia/cards.js halloween-trivia/player-core.js halloween-trivia/player-core.test.mjs halloween-trivia/cards.test.mjs halloween-trivia/player.js halloween-trivia/visuals/*.js; do node --check "$file"; done
node --test halloween-trivia/player-core.test.mjs halloween-trivia/cards.test.mjs
node tools/rag-eval.mjs
node --input-type=module -e "import assert from 'node:assert/strict'; import {cards} from './halloween-trivia/cards.js'; import {createPlayerController,STAGES} from './halloween-trivia/player-core.js'; assert.equal(cards.length,10); assert.equal(new Set(cards.map(card=>card.id)).size,10); assert.equal(new Set(cards.map(card=>card.visual.kind)).size,10); assert.deepEqual(cards.slice(7).map(card=>card.id),['operation-paperclip','fbi-king-letter','kirk-ballistics']); for (const card of cards) { assert.deepEqual(Object.keys(card.timing),STAGES); assert.ok(STAGES.every(stage=>card.timing[stage]>0)); assert.ok(card.evidenceIds.length&&card.sources.length&&card.sources.every(source=>source.url)); } const player=createPlayerController({cards,autoplay:false}); player.previous(); assert.equal(player.getState().card.id,'kirk-ballistics'); for (let i=0;i<STAGES.length;i++) player.advance(); assert.equal(player.getState().card.id,'suqami-passport');"
! rg --pcre2 -n '<(image|use|foreignObject)|(?:xlink:)?href\s*=|https?://(?!www\.w3\.org/2000/svg)' halloween-trivia/visuals/*.js
! rg -n 'animation-iteration-count:\s*infinite|animation:[^;]*\binfinite\b' halloween-trivia/styles.css
! rg -n 'reel|the post|the video|@[[:alnum:]_]' halloween-trivia/cards.js
rg -n '<meta name="robots" content="noindex">' halloween-trivia/index.html
git diff --exit-code 4e507fd -- index.html sw.js manifest.webmanifest
git diff --check -- halloween-trivia/cards.js halloween-trivia/player.js halloween-trivia/player-core.test.mjs halloween-trivia/cards.test.mjs halloween-trivia/styles.css halloween-trivia/README.md halloween-trivia/visuals/paperclip.js halloween-trivia/visuals/cointelpro.js halloween-trivia/visuals/kirk-ballistics.js
```

Start `python3 -m http.server 8757`. The delegated worker creates ignored `tmp/ticket003/phase3-browser.ts`; the orchestrator reruns it via the installed dev-browser package. For all 10 cards × `mystery`/`reveal` × the three declared viewports, require 60 cases with the same ID/visual/accessibility/rectangle/overflow/console/network assertions as Phase 2. Require all ten source drawers and focus returns, card 10 → card 1 autoplay and manual wrap, visible focus, and reduced-motion maximum durations `0`. Save representative screenshots for all seven new mystery/reveal pairs plus one portrait composition under ignored `tmp/ticket003/`; inspect them with the local image viewer. Close only ticket pages and stop port 8757.

**Observable phase DoD:** the guide and runtime agree on exactly ten cards; syntax and both test suites pass; RAG stays 5/5; 60 rendered state cases, all ten source/focus checks, wraparound, and reduced motion pass; root/PWA files are unchanged. Commit with explicit Phase 3 paths only.

### Phase 4 — Live release, notification, and lifecycle (2 points)

**Goal:** Deploy the already-green Phase 1–3 commits, independently verify the live ten-card route, notify the owner once, and graduate the ticket with the release evidence.

**Files:** ticket lifecycle path only; no application file changes in this phase.

**Gate classes:** Full regression, deploy, live site render, notifications, lifecycle, and cleanup.

**Delegation:** subagent — Independently inspect the finished clean clone and, after the orchestrator pushes, `https://2pizzaclub.com/halloween-trivia/`. Do not edit application files or send notifications. Verify syntax/tests/RAG, all exact card IDs/copy/renderer imports, direct-only/noindex boundary, live HTTP/browser health at 1920×1080 and 390×844, source/focus behavior, and ticket-page/server cleanup. Return ≤40 lines: commands + exits; test/RAG counts; HTTP and browser matrices; exact blockers. Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives. If it needs a spend, an outward-facing action, or a destructive change, stop and report instead.

**Verification surface — orchestrator reruns:**

```bash
for file in halloween-trivia/cards.js halloween-trivia/player-core.js halloween-trivia/player-core.test.mjs halloween-trivia/cards.test.mjs halloween-trivia/player.js halloween-trivia/visuals/*.js; do node --check "$file"; done
node --test halloween-trivia/player-core.test.mjs halloween-trivia/cards.test.mjs
node tools/rag-eval.mjs
rg -n '<meta name="robots" content="noindex">' halloween-trivia/index.html
git diff --exit-code 4e507fd -- index.html sw.js manifest.webmanifest
git diff --check
git fetch origin main
git rev-list --left-right --count HEAD...origin/main
```

If the second divergence count is nonzero, the clean clone may run `git pull --rebase origin main`; rerun the entire Phase 4 local gate afterward and never force-push. Push `main`, then poll both `https://2pizzaclub.com/halloween-trivia/` and `https://2pizzaclub.com/halloween-trivia/cards.js` until each returns HTTP 200 and the fetched module contains all ten IDs. Through fresh `ticket003-live-*` pages, traverse all ten cards at 1920×1080 and 390×844; require ten unique visuals, exact active copy, inside-frame rectangles, overflow `0/0`, every Source receipt/focus return, `errors:[]`, and `badResponses:[]`. Confirm the root page does not link `/halloween-trivia/`.

After live success, send exactly once:

```bash
/home/wabbazzar/code/wabbazzar-ice/scripts/notify.sh "Halloween trivia" "10-card haunted broadcast is live: https://2pizzaclub.com/halloween-trivia/ — syntax, tests, RAG 5/5, 10 unique vector reveals, projector/mobile renders, sources, focus, reduced motion, and live HTTP checks passed."
```

Require exit 0 and a same-day `notify.send` event with `title=Halloween trivia`, `status=ok`, and HTTP 200/201 in the configured event stream. Update this ticket’s Ledger with exact commits/evidence, set status Complete, then run `/home/wabbazzar/code/shipyard/scripts/ticket-lifecycle.sh --project /tmp/2pizzaclub-ticket003.ted8Im --graduate docs/tickets/pending/003_feature_seven_more_halloween_cards.md`; stage the resulting rename explicitly, commit the release evidence, push, and require `ticket-lifecycle.sh --project /tmp/2pizzaclub-ticket003.ted8Im --check` → exit 0. Close only ticket pages; stop every ticket-owned HTTP server; shared dev-browser processes are exempt and must remain running.

**Observable phase DoD:** live route/cards return 200 and traverse all ten exact cards at projector and phone widths with no browser failures; one Signal send and event succeed; the ticket is complete under `docs/tickets/complete/`; lifecycle check is green; the clean clone has no ticket-owned leftovers.

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
- [ ] The dart-pistol, put-options, and Paperclip records have checked source-supported wording/quotes; new USS Liberty and Kirk ballistics records contain narrow attributable claims; regenerated `rag-index.json` and `bundle.json` match the evidence manifest.
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

## Ledger

The builder appends one row after every phase. Record the plan, exact commit, builder form, commands/results, and any honest deferral; evidence longer than 40 lines belongs here rather than in orchestrator context.

| Phase | Commit | Builder | Gate evidence | Deferred / notes |
|---|---|---|---|---|
| 1 — evidence + artifacts | `4dc3f3b` | builder: inline (delegated worker verified the source passages but stalled before edits; orchestrator retained the bounded evidence set) | `jq empty` + exact-once manifest check pass; RAG rebuilt 319 records / 2,270 vectors and eval passed 5/5; bundle rebuilt 319/319 records and five-record artifact contract passed; editorial scans and `git diff --check` clean; local HTTP `200`; dev-browser at 390×844 rendered `1967-uss-liberty-001` and `2025-kirk-ballistics-001` with source links, overflow `0/0`, `errors:[]`, and `badResponses:[]`. | Required mobile gate exposed an existing 11 px header spill; fixed in `styles.css` and re-rendered at zero overflow. No Halloween runtime changed in this phase. |
| 2 — cards 4–7 + vectors | `58c2ee4` | builder: subagent (`phase2_vectors`), independently gated by orchestrator | 11/11 syntax checks; 9/9 tests; exact seven-card/order/copy/source/timing contract passed; native/no-remote asset and no-infinite-motion scans passed; `git diff --check` clean; local HTTP `200`; 42/42 mystery/reveal captures across 1920×1080, 1366×768, and 390×844 were inside the frame with overflow `0/0`, `errors:[]`, and `badResponses:[]`; 28/28 reduced-motion checks computed zero duration; 7/7 Source checks entered `source-panel` and Escape returned focus to `source-toggle`; owned pages/server cleaned. | Initial browser pass found the put-options reveal extending to x=1380.30 beyond a 1366 px frame; specialist fixed shared grid sizing/wrapping and the orchestrator rerun passed unchanged gates. |
| 3 — cards 8–10 + full pass | `a7b819c` | builder: subagent (`phase2_vectors`), independently gated by orchestrator | Syntax passed across runtime/tests/all ten renderers; 9/9 tests; RAG 5/5; exact ten-card/order/copy/source/timing/unique-ID/unique-visual/wrap contract passed; asset, finite-motion, editorial, `noindex`, root/PWA boundary, and diff checks passed; local HTTP `200`; 60/60 viewport cases were inside the frame with overflow `0/0`, autoplay wrap true, `errors:[]`, and `badResponses:[]`; 10/10 Source/focus checks, visible focus, manual wrap, and 40/40 zero-duration reduced-motion checks passed; owned pages/server cleaned. | Visual critique found `INCONCLUSIVE.` orphaning its final period; desktop deck widened 1 percentage point and wrapping changed to `break-word`/normal. Both specialist and orchestrator reruns passed; representative projector/portrait captures were visually inspected. |
| 4 — live release + lifecycle | pending | builder: inline; independent reviewer: `phase4_release_review` | Plan: reviewer reruns the bounded local release audit while orchestrator reruns the full gate and fetch/divergence check; push only from green main, poll live artifacts, traverse all ten cards at projector/phone widths, send exactly one Signal notification, record the event, graduate the ticket, push lifecycle evidence, and clean only owned resources. | In progress; no Phase 4 application edits permitted. |

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

Execute with `execute-ticket`; stop only for a user-decision-class item named in this ticket.
