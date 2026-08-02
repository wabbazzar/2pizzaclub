# 001 — Halloween trivia projection prototype

- **Status:** Polished — ready for autonomous execution
- **Priority:** High
- **Type:** feature
- **Created:** 2026-08-02
- **Owner:** wabbazzar
- **Estimated Points:** 13 (3 + 5 + 3 + 2)
- **Refs:** [Commission staff report](https://www.9-11commission.gov/staff_statements/911_TerrTrav_Monograph.pdf) · [persistent GovInfo copy](https://www.govinfo.gov/content/pkg/GOVPUB-Y3-PURL-LPS53197/pdf/GOVPUB-Y3-PURL-LPS53197.pdf) · [visual-reference description](https://bulbapedia.bulbagarden.net/wiki/Who%27s_That_Pok%C3%A9mon%3F)

## Goal

Create an unlinked, browser-native Halloween projection route that plays sourced 2pizzaclub facts as animated silhouette-question-reveal cards. The first slice ships the reusable animation system and one finished, verified card about the passport attributed to Flight 11 hijacker Satam al-Suqami; the remaining twelve cards follow only after the owner reviews the prototype's art and motion.

## Context and Pointers

The Halloween yard program will interleave spooky cartoons with short factual eyecatches. The interaction borrows the readable grammar of the original *Who's That Pokémon?* segment—a bold silhouette, a guessing pause, and a reveal—but must use original art, copy, branding, and motion rather than Pokémon footage or assets. The segment is documented as a question-and-answer eyecatch built around a silhouette or outline ([Bulbapedia, “Who's That Pokémon?”](https://bulbapedia.bulbagarden.net/wiki/Who%27s_That_Pok%C3%A9mon%3F)); reference screenshots show the high-contrast silhouette, radial field, oversized question mark, and title/answer hierarchy.

This work is Halloween-specific and intentionally separate from the main timeline and gallery. It lives in this repository because 2pizzaclub already provides the evidence corpus and editorial rules: records are canonical under `sources/evidence/<id>.json` (`sources/SCHEMA.md:3-27`), and official and counter-narratives must be attributed rather than adopted (`CLAUDE.md:90-97`). The project already uses bright comic visuals to carry flat prose (`CLAUDE.md:128-134`), while the related still-image work establishes a 1970s educational-cartoon register with bold shapes that read at 20+ feet (`drafts/halloween-arch/ARCH-SPEC.md:26-38`).

The first proposed fact exists at `sources/evidence/2001-suqami-passport-001.json:1-38`, but its primary URL is null and its status is `primary-link-pending` (`:13-16`, `:36`). The Commission staff report says Suqami's passport survived the attack; note 109 says NYPD Detective Yuk H. Chin recovered it from an unidentified passerby who left while debris was falling from WTC 2, and that Chin gave it to the FBI that day (printed pp. 22 and 40). The report also says it is Commission-staff work that commissioners did not approve as a body, so every reader-facing clause attributes it to “a 9/11 Commission staff report.” “Passports were found on the sidewalk beneath 9/11” is not supported.

## Confirmed Product Scope

- Audience: Halloween passersby and trick-or-treaters, including people joining mid-loop and viewing from roughly 15–30 feet at night.
- Job: earn attention immediately, allow a short guess, reveal one surprising sourced fact, and return cleanly to the surrounding cartoon program.
- Delivery: an unlinked fullscreen 16:9 browser route served from the existing static site; no MP4 export in this slice.
- Editorial sequence: thirteen eventual cards—three developed closely with the owner, five more reviewed by the owner, then five drafted independently. This ticket ships only the first approved prototype card and the structure needed for the later twelve.
- Creative reference: actual *Who's That Pokémon?* material is research only. Production artwork is original SVG/CSS shape work.

## Decisions

### Locked decisions

| Decision | Locked outcome |
|---|---|
| First deliverable | One complete passport card plus the reusable player and authoring contract; the remaining twelve cards wait for owner review. |
| Route and publication | Build and deploy the unlinked, `noindex` route at `/halloween-trivia/`; do not add root navigation or PWA-shell links. The owner explicitly authorized polish and execution on 2026-08-02 after being told execution includes commit, push, and Pages deployment. |
| Runtime | Native HTML, CSS, JavaScript ES modules, and SVG only; no bundler, framework, package, remote font, media file, or image generator. |
| Card art | Original 1970s haunted-educational-broadcast art; reference material supplies only the abstract silhouette/question/reveal grammar. |
| Evidence stance | Attribute the recovery account to a 9/11 Commission staff report; do not turn survival, recovery, or an unidentified passerby into a conspiracy inference. |
| Preview contract | `?autoplay=0&stage=stinger|mystery|reveal|receipt|transition` freezes an exact state for deterministic review. Invalid stages fall back to `stinger`. |
| Player test seam | Create `player-core.js` with an injected clock/scheduler and `player-core.test.mjs`; tests are mandatory, not optional. |
| SVG renderer | Create `halloween-trivia/visuals/passport.js`; the player dispatches through a renderer registry keyed by `visual.kind`. |
| Sound/export | Silent browser playback only. Audio and rendered video remain out of scope. |
| Deploy rollback | If the live route fails, revert the four phase commits in newest-to-oldest order from the Ledger, push the revert commits, and repeat the live HTTP/render probes. Never force-push. |

### Open decisions with defaults

None.

### User-decision class

None. Public deployment of the unlinked prototype is explicitly authorized above; publishing or promoting a navigable link remains outside this ticket.

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
- Mystery question: `WHAT SURVIVED THE ATTACK?`
- Reveal: `SATAM AL-SUQAMI'S PASSPORT`
- Receipt copy: `A 9/11 Commission staff report says Detective Yuk H. Chin recovered the passport from a passerby, who left unidentified while debris fell from the South Tower. Chin gave it to the FBI on 9/11.`
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

- Create `halloween-trivia/index.html` for the semantic stage, accessible controls, source panel, and `<meta name="robots" content="noindex">` metadata.
- Create `halloween-trivia/styles.css` for the 16:9 stage, safe areas, vector scene styling, animation states, focus treatment, portrait recomposition, and reduced-motion mode.
- Create `halloween-trivia/cards.js` as the authored card registry. Each card exposes `id`, `evidenceId`, `topic`, `question`, `reveal`, `detail`, `source.label`, `source.url`, `timing`, and `visual.kind`.
- Create `halloween-trivia/player-core.js` for the injected-clock state machine and preview-query parsing, plus `halloween-trivia/player-core.test.mjs` with the six named timing/navigation cases below.
- Create `halloween-trivia/player.js` for DOM binding, controls, fullscreen behavior, exact `?autoplay=0&stage=...` preview states, status copy, and renderer dispatch by `visual.kind`.
- Create the first original passport SVG in `halloween-trivia/visuals/passport.js`. Do not add raster generation or copyrighted reference assets.
- Keep the verification DOM stable: `main#projection-stage[data-stage][data-card-id]`; the control/source/status IDs locked in Phase 2; `svg[data-visual="passport"]`; `[data-active-copy]` on visible state copy; and `[data-contrast-check]` on every essential text surface with an explicit non-transparent text/background pair.
- Add a short `halloween-trivia/README.md` operator note covering local serving, fullscreen startup, keyboard controls, 16:9 projector setup, and how a future verified card is added.
- Do not add the route to `sw.js`'s precached shell (`sw.js:14-33`) or to the root header navigation (`index.html:44-49`) in this slice. Same-origin runtime caching may continue to work through the existing fetch handler (`sw.js:56-81`).

### Evidence record

- Update `sources/evidence/2001-suqami-passport-001.json` to use the canonical 9/11 Commission staff report URL, carry a short verbatim supporting quote, use flat attributable wording, and move to `status: "verified"` only after every cited URL has been opened and checked.
- Remove or correct unsupported specificity if the primary record does not establish it. Do not publish “multiple passports,” “on the sidewalk,” or a conspiracy inference as fact.
- The animation card references this evidence ID but keeps its shorter projection-specific copy in `cards.js`.
- Because the record claim/quote changes, regenerate and commit both precompiled artifacts as required by `CLAUDE.md:229-236` and `.agents/gates.md:41-46`.

### Dependencies

- No new framework, bundler, transpiler, animation library, font package, image generator, or runtime dependency.
- Node's built-in test runner is required for the pure state/timing logic; no DOM test library is added.
- The primary editorial dependency is the Commission's [*9/11 and Terrorist Travel* staff report](https://www.govinfo.gov/content/pkg/GOVPUB-Y3-PURL-LPS53197/pdf/GOVPUB-Y3-PURL-LPS53197.pdf), especially note 109.

## Execution Protocol

The builder is the orchestrator. Delegate each phase using its hardened brief, keep only the compact return, inspect the changed files, and rerun every named gate personally before committing. Each phase ends in one task-scoped commit and an updated Ledger entry. The final ticket-lifecycle commit is allowed after the live deploy gate.

Every delegated brief ends with this clause:

> Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives.

Work directly on `main`; stage explicit ticket-owned paths only; never use `git add .`, `git add -A`, autostash, or force-push. Unrelated modified/untracked files predate this ticket and remain untouched. Before the final push, run `git pull --rebase`; if an upstream change and the unrelated dirty worktree prevent rebasing, report the exact blocker rather than stashing another agent's work.

### Render-gate lifecycle used by every UI phase

Use a new HTTP port and a new named browser page after every edit batch. The installed render harness is:

```bash
DEV_BROWSER_DIR=/home/wabbazzar/.claude/plugins/cache/dev-browser-marketplace/dev-browser/66682fb0513a/skills/dev-browser
TICKET001_BROWSER_PID=
if curl -fsS http://127.0.0.1:9222/ >/tmp/ticket001-dev-browser.json; then
    echo dev-browser=reused
else
    cd "$DEV_BROWSER_DIR"
    HEADLESS=true npx tsx scripts/start-server.ts >/tmp/ticket001-dev-browser.log 2>&1 &
    TICKET001_BROWSER_PID=$!
    for TICKET001_BROWSER_ATTEMPT in $(seq 1 40); do
        curl -fsS http://127.0.0.1:9222/ >/tmp/ticket001-dev-browser.json && break
        kill -0 "$TICKET001_BROWSER_PID" 2>/dev/null || { sed -n '1,160p' /tmp/ticket001-dev-browser.log; exit 1; }
        sleep 0.25
    done
    curl -fsS http://127.0.0.1:9222/ >/tmp/ticket001-dev-browser.json || { echo dev-browser-not-ready; exit 1; }
fi
```

If port 9222 already returns healthy JSON, reuse it, record that fact in the Ledger, and do not assign or kill a browser PID. Every script must call `client.close("<phase-page>")` and `client.disconnect()`. Start each local site server with the phase's exact port, record its PID, and after the checks kill/wait only those recorded PIDs. Cleanup proof:

```bash
kill "$TICKET001_HTTP_PID" && wait "$TICKET001_HTTP_PID" 2>/dev/null || true
if [ -n "${TICKET001_BROWSER_PID:-}" ]; then kill "$TICKET001_BROWSER_PID" && wait "$TICKET001_BROWSER_PID" 2>/dev/null || true; fi
ss -ltnp '( sport = :8744 or sport = :8745 or sport = :8746 or sport = :8747 or sport = :9222 or sport = :9223 )'
ps -eo pid,cmd | grep -iE 'chrome-headless|dev-browser/.*/start-server|python3 -m http.server 87(44|45|46|47)' | grep -v grep || true
```

Expected cleanup: no listener/process created by the phase remains. A pre-existing healthy shared dev-browser may remain only if the Ledger names it and the phase's named pages are closed.

## Toolchain Baseline (polish, 2026-08-02)

- `node --version` → `v24.12.0`; `node --check /dev/null` exited 0; `node --help` exposes the built-in `--test` runner.
- `python3 --version` → `3.12.3`; `python3 -m http.server --help` exited 0.
- `curl --version` → `8.5.0`; `git --version` → `2.43.0`; Google Chrome → `147.0.7727.101`.
- Installed dev-browser uses Playwright `1.57.0`. A stale several-hours-old service failed one client connection and exited; a fresh local service then loaded `/` at an explicitly set 390×844 viewport with HTTP 200 and zero console/page errors. The test page, browser service, Chrome child, and port-8744 server were closed; `ss` and `ps` showed no remaining listener/process.
- `git fetch origin main && git rev-list --left-right --count HEAD...origin/main` returned `1 0` after the draft-ticket commit: local was one commit ahead and zero behind at polish time. Recheck immediately before push.

## Implementation Plan

### Phase 1 — Verify the first fact and establish the card contract (3 points)

**Slice:** Make the evidence record publishable, add the one-card registry, regenerate derived artifacts, and leave both the timeline and card data valid.

**Files owned:** `sources/evidence/2001-suqami-passport-001.json`, `halloween-trivia/cards.js` (new), `rag-index.json`, `bundle.json`, and this ticket's Ledger. Do not edit the manifest unless the record is actually absent (it is present at `sources/evidence/manifest.json:113`).

**Delegation brief:** Subagent. Open both Commission URLs in Refs; compare every proposed claim/card clause against printed pp. 22 and 40; update only the owned files, including the two generated artifacts after the source edit; retain only opened URLs; use a ≤25-word verbatim primary quote; do not infer carriage aboard Flight 11, a sidewalk location, multiple passports, or conspiracy. Return ≤40 lines: files changed; exact supported wording and quote; commands run with exit codes; RAG fixture count; bundle record/status; blockers. Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives.

**Exact verification surface:** Data artifacts, editorial quality, JavaScript syntax, and site render apply.

```bash
node --check halloween-trivia/cards.js
node --input-type=module -e "const {cards}=await import('./halloween-trivia/cards.js'); if(cards.length!==1||cards[0].evidenceId!=='2001-suqami-passport-001'||cards[0].question!=='WHAT SURVIVED THE ATTACK?') process.exit(1); console.log('cards=1 evidence=2001-suqami-passport-001')"
node -e "const r=require('./sources/evidence/2001-suqami-passport-001.json'); if(r.status!=='verified'||!r.sources.some(s=>s.type==='primary'&&s.url&&s.quote)) process.exit(1); if(/sidewalk|passports were|the 9\/11 Commission said/i.test(r.claim)) process.exit(1); console.log('passport-record=verified primary=url+quote')"
node --input-type=module <<'NODE'
import fs from 'node:fs';
const {cards}=await import('./halloween-trivia/cards.js'); const record=JSON.parse(fs.readFileSync('./sources/evidence/2001-suqami-passport-001.json','utf8'));
const reader=[record.claim,...cards.flatMap(c=>[c.question,c.reveal,c.detail,c.source.label])].join('\n');
if(/\b(reel|the post|the video)\b|@[A-Za-z0-9_]+/i.test(reader)) process.exit(1);
if(/sidewalk|passports were|the 9\/11 Commission said|\bWTC\b/i.test(reader)) process.exit(1);
console.log('editorial-quality=pass');
NODE
node tools/build-rag-index.mjs && node tools/rag-eval.mjs
node tools/build-bundle.mjs
node -e "const b=require('./bundle.json'); const r=b.records['2001-suqami-passport-001.json']; if(!r||r.status!=='verified') process.exit(1); console.log('bundle-passport=verified')"
python3 -m http.server 8744 >/tmp/ticket001-p1-http.log 2>&1 & TICKET001_HTTP_PID=$!
curl --retry 20 --retry-connrefused --retry-delay 1 -fsS -o /dev/null -w 'phase1-http=%{http_code}\n' http://127.0.0.1:8744/
```

From `$DEV_BROWSER_DIR`, run:

```bash
npx tsx <<'EOF'
import assert from "node:assert/strict";
import { connect, waitForPageLoad } from "@/client.js";
const client=await connect();
try {
  const errors=[]; const page=await client.page("ticket001-phase1"); page.on("console",m=>{if(m.type()==="error") errors.push(m.text())}); page.on("pageerror",e=>errors.push(e.message));
  await page.setViewportSize({width:390,height:844}); await page.goto("http://127.0.0.1:8744/"); await waitForPageLoad(page);
  const card=page.locator('.evidence-card[data-evidence-id="2001-suqami-passport-001"]'); await card.waitFor(); assert.match(await card.innerText(),/Commission staff report/i); assert.deepEqual(errors,[]);
  console.log(JSON.stringify({phase:1,viewport:page.viewportSize(),card:true,errors}));
} finally { try { await client.close("ticket001-phase1"); } catch {} await client.disconnect(); }
EOF
```

**Observable DoD:** syntax/import assertions exit 0; RAG prints `5/5 fixtures pass`; bundle assertion prints `bundle-passport=verified`; curl prints `phase1-http=200`; browser output has `card:true`, viewport 390×844, and `errors:[]`; render harness cleanup is empty. Orchestrator inspects diff, stages only owned paths plus the Ledger, commits `feat: verify first Halloween trivia card`, and records the hash.

### Phase 2 — Build one complete projection-player slice (5 points)

**Slice:** Ship a locally complete stinger → mystery → reveal → receipt → transition loop, including the structurally finished passport SVG, basic responsive layout, controls, preview query, and tests. Phase 3 refines a working design; it does not fill a missing scene.

**Files owned:** `halloween-trivia/index.html`, `styles.css`, `player-core.js`, `player-core.test.mjs`, `player.js`, `visuals/passport.js`, and this ticket's Ledger. Phase 1 owns `cards.js`; edit it only if integration proves its locked contract impossible, and record why.

**Delegation brief:** Subagent. Implement the complete native route against the locked IDs/data/copy/design; keep the pure state machine injected-clock and DOM-free; create exactly six failure-capable tests for stage order/wrap, authored durations, pause/resume remainder, restart, previous/next wrap, and preview-query parsing; implement `main#projection-stage[data-stage][data-card-id]`, `#play-toggle[aria-pressed]`, `#previous-card`, `#next-card`, `#restart-card`, `#fullscreen-toggle`, `#source-toggle`, `#source-panel[hidden]`, and `#player-status[aria-live="polite"]`; include the passport renderer now. Return ≤40 lines: files changed; commands + exit codes; six-test count; local HTTP/browser evidence; blockers. Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives.

**Exact verification surface:** JavaScript syntax, controller tests, dependency boundary, interaction, and site render apply.

```bash
node --check halloween-trivia/cards.js
node --check halloween-trivia/player-core.js
node --check halloween-trivia/player-core.test.mjs
node --check halloween-trivia/player.js
node --check halloween-trivia/visuals/passport.js
node --test halloween-trivia/player-core.test.mjs
node <<'NODE'
const fs=require('node:fs');
const files=['halloween-trivia/cards.js','halloween-trivia/player-core.js','halloween-trivia/player.js','halloween-trivia/visuals/passport.js'];
const bad=files.filter(file=>/\bfrom\s+["'](?![./])|\bimport\s*\(\s*["'](?![./])/.test(fs.readFileSync(file,'utf8')));
const html=fs.readFileSync('halloween-trivia/index.html','utf8'),css=fs.readFileSync('halloween-trivia/styles.css','utf8');
if(bad.length||/<(?:script|link)[^>]+(?:src|href)=["']https?:/i.test(html)||/@import|url\(\s*["']?https?:/i.test(css)){console.error({bad});process.exit(1)}
console.log('no-external-runtime-dependencies');
NODE
python3 -m http.server 8745 >/tmp/ticket001-p2-http.log 2>&1 & TICKET001_HTTP_PID=$!
curl --retry 20 --retry-connrefused --retry-delay 1 -fsS -o /dev/null -w 'phase2-http=%{http_code}\n' 'http://127.0.0.1:8745/halloween-trivia/?autoplay=0&stage=mystery'
```

From `$DEV_BROWSER_DIR`, run:

```bash
npx tsx <<'EOF'
import assert from "node:assert/strict";
import { connect, waitForPageLoad } from "@/client.js";
const client=await connect();
try {
  const errors=[]; const page=await client.page("ticket001-phase2"); page.on("console",m=>{if(m.type()==="error") errors.push(m.text())}); page.on("pageerror",e=>errors.push(e.message));
  await page.setViewportSize({width:1920,height:1080}); await page.goto("http://127.0.0.1:8745/halloween-trivia/?autoplay=0&stage=mystery"); await waitForPageLoad(page);
  const stage=page.locator("#projection-stage"); assert.equal(await stage.getAttribute("data-stage"),"mystery"); assert.equal(await stage.getAttribute("data-card-id"),"suqami-passport"); assert.match(await page.locator("body").innerText(),/WHAT SURVIVED THE ATTACK\?/); assert.equal(await page.locator('svg[data-visual="passport"]').count(),1);
  await page.keyboard.press("i"); assert.equal(await page.locator("#source-panel").getAttribute("hidden"),null); assert.match(await page.locator("#source-panel a").getAttribute("href"),/^https:\/\//);
  await page.keyboard.press("r"); assert.equal(await stage.getAttribute("data-stage"),"stinger"); await page.keyboard.press("Space"); assert.equal(await page.locator("#play-toggle").getAttribute("aria-pressed"),"true"); await page.keyboard.press("ArrowRight"); assert.equal(await stage.getAttribute("data-card-id"),"suqami-passport"); assert.deepEqual(errors,[]);
  console.log(JSON.stringify({phase:2,viewport:page.viewportSize(),stage:await stage.getAttribute("data-stage"),card:await stage.getAttribute("data-card-id"),sourceOpen:true,errors}));
} finally { try { await client.close("ticket001-phase2"); } catch {} await client.disconnect(); }
EOF
```

Then run the common cleanup.

**Observable DoD:** all five syntax checks exit 0; test output says `tests 6`, `pass 6`, `fail 0`; dependency scan prints `no-external-runtime-dependencies`; curl prints `phase2-http=200`; browser JSON proves every named DOM/keyboard assertion and `errors:[]`; cleanup is empty. Orchestrator inspects the working route, stages only owned paths plus Ledger, commits `feat: add Halloween trivia projection player`, and records the hash.

### Phase 3 — Projection art, responsive, and accessibility critique (3 points)

**Slice:** Critique and refine the already-working route against real rendered frames, then prove distance legibility, safe motion, contrast, focus, source access, and all declared viewports.

**Files owned:** `halloween-trivia/index.html`, `styles.css`, `player.js`, `visuals/passport.js`, and this ticket's Ledger. Do not change approved factual copy or timings without reporting a blocker.

**Delegation brief:** Subagent. Start from Phase 2's working route; render mystery/reveal/receipt at 1920×1080 and 1366×768 plus portrait receipt at 390×844; emulate reduced motion; critique generic styling, weak hierarchy, franchise resemblance, distance legibility, unsafe flash, focus, and overflow; make only owned-file refinements; remove at least one accessory; never introduce raster assets. Return ≤40 lines: files changed; screenshot paths; largest mismatch fixed; accessory removed; exact browser assertions/exit evidence; blockers. Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives.

**Exact verification surface:** UI-design critique, site render, accessibility interaction, contrast, overflow, motion safety, and browser cleanup apply.

```bash
node --check halloween-trivia/player.js
node --check halloween-trivia/visuals/passport.js
node --test halloween-trivia/player-core.test.mjs
node <<'NODE'
const css=require('node:fs').readFileSync('halloween-trivia/styles.css','utf8');
if(/animation[^;]*(infinite|alternate)|steps\s*\(/i.test(css)){console.error('unsafe repeating animation');process.exit(1)}
let at=0; while((at=css.indexOf('@keyframes',at))>=0){const start=css.indexOf('{',at);let depth=0,end=start;for(;end<css.length;end++){if(css[end]==='{')depth++;if(css[end]==='}'&&--depth===0)break}const body=css.slice(start,end+1);if((body.match(/\bopacity\s*:/g)||[]).length>2){console.error('keyframe opacity toggles more than once');process.exit(1)}at=end+1}
console.log('no-repeating-flash-animation');
NODE
mkdir -p tmp/ticket001
python3 -m http.server 8746 >/tmp/ticket001-p3-http.log 2>&1 & TICKET001_HTTP_PID=$!
curl --retry 20 --retry-connrefused --retry-delay 1 -fsS -o /dev/null -w 'phase3-http=%{http_code}\n' 'http://127.0.0.1:8746/halloween-trivia/?autoplay=0&stage=receipt'
```

From `$DEV_BROWSER_DIR`, run this deterministic render check:

```bash
npx tsx <<'EOF'
import assert from "node:assert/strict";
import { connect, waitForPageLoad } from "@/client.js";
const client=await connect();
const names=[];
const cases=[
  ["1920-mystery",1920,1080,"mystery"], ["1920-reveal",1920,1080,"reveal"], ["1920-receipt",1920,1080,"receipt"],
  ["1366-mystery",1366,768,"mystery"], ["1366-reveal",1366,768,"reveal"], ["1366-receipt",1366,768,"receipt"],
  ["390-receipt",390,844,"receipt"]
];
const results=[];
try {
  for (const [name,width,height,state] of cases) {
    const pageName=`ticket001-p3-${name}`; names.push(pageName); const errors=[]; const page=await client.page(pageName); page.on("console",m=>{if(m.type()==="error") errors.push(m.text())}); page.on("pageerror",e=>errors.push(e.message));
    await page.setViewportSize({width,height}); await page.goto(`http://127.0.0.1:8746/halloween-trivia/?autoplay=0&stage=${state}`); await waitForPageLoad(page);
    const metrics=await page.evaluate(() => {
      const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number); const lum=c=>{const v=c/255; return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)};
      const ratio=(a,b)=>{const x=.2126*lum(a[0])+.7152*lum(a[1])+.0722*lum(a[2]),y=.2126*lum(b[0])+.7152*lum(b[1])+.0722*lum(b[2]); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
      const stage=document.querySelector("#projection-stage").getBoundingClientRect(); const active=[...document.querySelectorAll("[data-active-copy]")].filter(e=>e.getClientRects().length); const activeRects=active.map(e=>e.getBoundingClientRect()); const insetX=stage.width*.05,insetY=stage.height*.05;
      const contrasts=[...document.querySelectorAll("[data-contrast-check]")].filter(e=>e.getClientRects().length).map(e=>{const s=getComputedStyle(e); return ratio(rgb(s.color),rgb(s.backgroundColor))});
      return {activeCount:active.length,overflow:document.documentElement.scrollWidth-innerWidth,stageRatio:stage.width/stage.height,safe:activeRects.every(r=>r.left>=stage.left+insetX&&r.right<=stage.right-insetX&&r.top>=stage.top+insetY&&r.bottom<=stage.bottom-insetY),contrasts,minFont:active.length?Math.min(...active.map(e=>parseFloat(getComputedStyle(e).fontSize))):0};
    });
    assert.ok(metrics.activeCount>0); assert.ok(metrics.overflow<=0); assert.ok(metrics.safe); assert.ok(metrics.contrasts.length>0&&metrics.contrasts.every(v=>v>=4.5)); if(width>height) assert.ok(Math.abs(metrics.stageRatio-16/9)<.03); if(width===390) assert.ok(metrics.minFont>=20); assert.deepEqual(errors,[]);
    await page.screenshot({path:`/home/wabbazzar/code/2pizzaclub/tmp/ticket001/${name}.png`}); results.push({name,...metrics,errors});
  }
  const reducedName="ticket001-p3-reduced"; names.push(reducedName); const reduced=await client.page(reducedName); await reduced.setViewportSize({width:1920,height:1080}); await reduced.emulateMedia({reducedMotion:"reduce"}); const reducedStates={};
  for(const state of ["stinger","mystery","reveal","receipt","transition"]){await reduced.goto(`http://127.0.0.1:8746/halloween-trivia/?autoplay=0&stage=${state}`);await waitForPageLoad(reduced);reducedStates[state]=await reduced.evaluate(()=>({animations:document.getAnimations().length,active:[...document.querySelectorAll("[data-active-copy]")].filter(e=>e.getClientRects().length).length}));assert.equal(reducedStates[state].animations,0);assert.ok(reducedStates[state].active>0)}
  await reduced.goto("http://127.0.0.1:8746/halloween-trivia/?autoplay=0&stage=reveal"); await waitForPageLoad(reduced); await reduced.screenshot({path:"/home/wabbazzar/code/2pizzaclub/tmp/ticket001/reduced-reveal.png"});
  const controlsName="ticket001-p3-controls"; names.push(controlsName); const controls=await client.page(controlsName); await controls.setViewportSize({width:1920,height:1080}); await controls.goto("http://127.0.0.1:8746/halloween-trivia/?autoplay=0&stage=receipt"); await waitForPageLoad(controls); const outlines=[]; for(let i=0;i<6;i++){await controls.keyboard.press("Tab"); outlines.push(await controls.evaluate(()=>({tag:document.activeElement?.tagName,outline:getComputedStyle(document.activeElement).outlineStyle})));} assert.ok(outlines.filter(x=>x.tag==="BUTTON"&&x.outline!=="none").length>=6); await controls.keyboard.press("f"); await controls.waitForTimeout(100); const fullscreen=await controls.evaluate(()=>Boolean(document.fullscreenElement)||/unavailable/i.test(document.querySelector("#player-status").textContent)); assert.ok(fullscreen);
  console.log(JSON.stringify({results,reducedStates,outlines,fullscreen}));
} finally { for(const name of names){try{await client.close(name)}catch{}} await client.disconnect(); }
EOF
```

Run cleanup. The orchestrator must inspect all eight screenshots with the image viewer and record the largest mismatch fixed plus the removed accessory in the Ledger.

**Observable DoD:** syntax/tests/animation scan and curl exit 0; eight screenshots exist and are inspected; all JSON assertions report active copy, contrast ≥4.5, 5%-safe text, measured 16:9 landscape composition, legible portrait copy, no horizontal overflow, zero reduced-motion animations with visible copy in all five states, visible focus, a handled fullscreen result, and `errors:[]`; cleanup is empty. Orchestrator stages only owned paths plus Ledger, commits `style: refine Halloween projection card`, and records the hash.

### Phase 4 — Operator handoff, deploy, and live verification (2 points)

**Slice:** Document operation, rerun the complete gate, push the unlinked route, prove the live surface, and graduate the ticket only after success.

**Files owned:** `halloween-trivia/README.md`, narrow fixes in `halloween-trivia/`, generated `rag-index.json`/`bundle.json` only if their source changed, and this ticket's Ledger/lifecycle path. `index.html` and `sw.js` are explicitly forbidden.

**Delegation brief:** Subagent. Perform a release-minded, read-only review after the orchestrator's final local gate: verify all viewports/states, keyboard/source access, exact approved copy, no external/copyrighted assets, README accuracy, direct-route/noindex behavior, unchanged root nav/precache, and ticket-path git cleanliness. Return failures only, ≤40 lines, with command, exit code, and exact evidence. Converge honestly or report the precise blocker with the actual evidence — NEVER fake green, weaken a check, or hand-wave "should work". Run the real command, read the real file, curl the real port, and report exact output (exit codes, JSONL lines, HTTP codes), not adjectives.

**Exact verification surface:** repeat all prior syntax/tests/data/editorial/render checks, then git discipline, deploy, live HTTP, and live render apply.

```bash
node --check halloween-trivia/cards.js && node --check halloween-trivia/player-core.js && node --check halloween-trivia/player-core.test.mjs && node --check halloween-trivia/player.js && node --check halloween-trivia/visuals/passport.js
node --test halloween-trivia/player-core.test.mjs
node tools/build-rag-index.mjs && node tools/rag-eval.mjs
node tools/build-bundle.mjs
git diff --exit-code 09320b7 -- index.html sw.js
python3 -m http.server 8747 >/tmp/ticket001-p4-http.log 2>&1 & TICKET001_HTTP_PID=$!
curl --retry 20 --retry-connrefused --retry-delay 1 -fsS -o /dev/null -w 'phase4-root=%{http_code}\n' http://127.0.0.1:8747/
curl --retry 20 --retry-connrefused --retry-delay 1 -fsS -o /dev/null -w 'phase4-route=%{http_code}\n' http://127.0.0.1:8747/halloween-trivia/
```

Run the Phase 3 browser assertions one final time on port 8747 with fresh page names, inspect the final eight screenshots, and clean the render harness. Verify only ticket-owned paths are staged, commit `docs: add Halloween projection operator guide`, update the Ledger, then:

```bash
git pull --rebase
git push origin main
curl --retry 12 --retry-all-errors --retry-delay 5 -fsS -o /dev/null -w 'live-root=%{http_code}\n' https://2pizzaclub.com/
curl --retry 12 --retry-all-errors --retry-delay 5 -fsS -o /dev/null -w 'live-route=%{http_code}\n' https://2pizzaclub.com/halloween-trivia/
TICKET001_ROOT_HTML=$(curl --retry 12 --retry-all-errors --retry-delay 5 -fsS https://2pizzaclub.com/) || exit 1
if rg -q 'halloween-trivia' <<<"$TICKET001_ROOT_HTML"; then echo route-linked-from-root && exit 1; else echo route-remains-unlinked; fi
```

Use a fresh dev-browser page at 1920×1080 against `https://2pizzaclub.com/halloween-trivia/?autoplay=0&stage=receipt`; assert the locked reveal/receipt/source text, original passport SVG, `noindex`, and zero console/page errors; close it and clean up. If live verification fails, use the locked revert plan and verify the rollback. If green, set Status Complete, finish the Ledger, then graduate and commit the lifecycle change:

```bash
bash /home/wabbazzar/code/shipyard/scripts/ticket-lifecycle.sh --project /home/wabbazzar/code/2pizzaclub --graduate docs/tickets/pending/001_feature_halloween_trivia_projection.md
git add docs/tickets/complete/001_feature_halloween_trivia_projection.md docs/tickets/pending/001_feature_halloween_trivia_projection.md
git commit -m "docs: complete Halloween projection ticket"
git pull --rebase
git push origin main
```

If the old pending path no longer exists, stage the move with `git add -A -- docs/tickets/pending/001_feature_halloween_trivia_projection.md docs/tickets/complete/001_feature_halloween_trivia_projection.md`; this path-limited form is permitted and must not include unrelated files.

**Observable DoD:** tests print six passes/zero fails; RAG prints `5/5 fixtures pass`; both local curls and both live curls print 200; forbidden-file diff is empty; root probe prints `route-remains-unlinked`; live browser JSON shows the approved card, `noindex`, and `errors:[]`; task-owned paths are clean; no created background process remains; phase commit, deploy, and lifecycle commit hashes are in the Ledger; the ticket exists only in `docs/tickets/complete/`.

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

## Roll-up Definition of Done

- [ ] Every phase's exact command surface shows the expected exit code/output and every per-phase Observable DoD is copied compactly into the Ledger.
- [ ] Phase commits and the lifecycle commit are recorded; `git log` shows no AI attribution; all ticket-owned paths are clean after the final push.
- [ ] Unrelated pre-existing dirty-worktree paths remain unmodified and unstaged by this ticket.
- [ ] RAG remains 5/5, player tests remain 6/6, both derived artifacts match the verified record, and the final eight screenshots have been personally inspected by the orchestrator.
- [ ] Local and live route probes return 200, the live page renders the locked receipt without console errors, and the route remains absent from root navigation and the service-worker shell.
- [ ] All HTTP/dev-browser/headless processes created by the build are stopped and the exact `ss`/`ps` cleanup evidence is in the Ledger.
- [ ] The ticket is `Status: Complete` and exists only at `docs/tickets/complete/001_feature_halloween_trivia_projection.md`.

## Ledger

The builder appends to this section; do not erase the polish baseline.

### Polish baseline

- **builder:** orchestrator with three read-only probe subagents
- **commit:** the commit containing this hardened ticket; record its hash with `git log -1 --format=%H -- docs/tickets/pending/001_feature_halloween_trivia_projection.md` at execution start
- **evidence:** Node/Python/curl/git/Chrome/dev-browser versions and successful 390×844 render recorded under Toolchain Baseline; source wording corrected to Commission-staff attribution; no user-decision-class item remains.
- **deferred:** feature implementation belongs to `execute-ticket`.

### Phase 1

- **plan:** pending
- **builder:** pending
- **commit:** pending
- **commands/evidence:** pending
- **notes/deferred:** pending

### Phase 2

- **plan:** pending
- **builder:** pending
- **commit:** pending
- **commands/evidence:** pending
- **notes/deferred:** pending

### Phase 3

- **plan:** pending
- **builder:** pending
- **commit:** pending
- **commands/evidence:** pending
- **notes/deferred:** pending

### Phase 4 / live

- **plan:** pending
- **builder:** pending
- **phase commit:** pending
- **deploy evidence:** pending
- **lifecycle commit:** pending
- **notes/deferred:** pending

## Execute

Run this ticket with the project `execute-ticket` skill: `execute ticket docs/tickets/pending/001_feature_halloween_trivia_projection.md`.
