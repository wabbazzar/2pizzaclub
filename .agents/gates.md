# Verification gates — 2pizzaclub

> The single source of truth for **how to prove a change works on this
> project**. `polish-ticket` reads this file to assemble the per-phase
> verification surface; `execute-ticket` reads it to know which gates to run
> before every commit. There is no one test command that covers everything —
> a phase declares which of the classes below apply, and this file supplies
> the exact commands.

2pizzaclub is a **no-build static site** (plain HTML + CSS + ES modules,
GitHub Pages, custom domain `2pizzaclub.com`) plus a local media-ingest
pipeline (`tools/*.mjs`: yt-dlp → ffmpeg → whisper) and reel-production
skills. There is no bundler, no framework, no test framework — verification
is (1) the RAG regression gate, (2) deterministic data-artifact rebuilds,
(3) rendering the actual site, and (4) whole-file media QC. `CLAUDE.md`
carries the full rationale; this file is the command surface.

## Commands

| What | Command |
|---|---|
| Test suite | `node tools/rag-eval.mjs` — the ONLY automated gate; 5 golden queries, must stay **5/5**. Never loosen a fixture to pass. (One-time setup if `tools/node_modules` missing: `cd tools && npm install`) |
| Typecheck / lint | `node --check <file>` for every touched `.mjs`/`.js` (no repo linter) |
| Build | n/a for the site (no build step). Data artifacts: `node tools/build-rag-index.mjs` + `node tools/build-bundle.mjs` (see gate below) |
| Dev run | `cd /home/wabbazzar/code/2pizzaclub && python3 -m http.server 8744` |
| Deploy | `git push` → GitHub Pages rebuilds `main` root in ~30s; probe `curl -s -o /dev/null -w "%{http_code}\n" https://2pizzaclub.com` = 200 |
| Notify (owner alert) | `$QUARTET_NOTIFY_CMD` (baked into units at install; the ONLY notification path) |
| Event stream dir | `$QUARTET_EVENTS_DIR` (append-only JSONL, one `job.*` / incident object per line) |

## Gate classes — which apply, with the exact commands

For each phase, the ticket names which of these apply; "the code looks right"
is never proof.

### Data artifacts (RAG index + bundle)  — APPLIES: yes (any record/claim/quote/capture change)
Both artifacts are **precompiled and committed** — the runtime never builds them.
After ANY change to a record's `claim` or `sources[].quote` text (new record,
edit, quality pass), or to `sources/evidence/manifest.json` or a capture
`meta.json`:

```bash
node tools/build-rag-index.mjs && node tools/rag-eval.mjs   # ~30s, deterministic; eval must print 5/5
node tools/build-bundle.mjs                                 # fast; inlines all records + capture metas
```

Commit the regenerated `rag-index.json` and `bundle.json` with the change.
Skipping the index rebuild leaves stored sentence offsets pointing at the old
text — highlights land on the wrong characters. A stale bundle degrades to the
slow per-file path, but never leave it stale on purpose.

### Site render check (local serve)  — APPLIES: yes (any HTML/CSS/JS/record change)
No build step, but you still render the real page:

```bash
cd /home/wabbazzar/code/2pizzaclub && python3 -m http.server 8744
```

then load the touched surface (`/`, `/gallery/`, `/efta/`…) and confirm the
change is visible: the new chapter/card renders, the search bar returns the new
record, no console errors. **Mobile matters**: `mobile-nav.js` activates only at
viewport ≤880px and the site ships as a PWA — render the changed view at a
mobile viewport (e.g. 390×844) with the `dev-browser` skill, not just desktop
width. **Cache trap:** dev-browser Chromium caches CSS/JS per-context — after
edits, restart the http.server on a NEW port AND create a new dev-browser page.
**Kill the headless browser afterward** and verify with
`ps -eo pid,cmd | grep -iE "chrome-headless|dev-browser"` that it's gone.

### Editorial quality bar  — APPLIES: yes (any reader-facing text: `claim`s, blurbs, `index.html` headers/nav)
The four checks in `CLAUDE.md` §"Timeline quality bar" are a gate, not a style
suggestion: (1) no source-video reference — grep new claims for
`reel|the post|the video|@\w` before committing; (2) chapter header matches its
cards, no empty anchors; (3) acronyms glossed on first reader-facing use, no raw
database ids in prose; (4) flat voice, no "we", no rhetorical kickers, official
accounts attributed never adopted. The `tools/hooks/quality-guard.mjs`
PostToolUse hook enforces brand fonts/palette + the no-reel-reference rule at
edit time (exit 2 = violation) — a hook block is a failed gate, fix the content
not the hook.

### Media output QC (whole-file)  — APPLIES: yes (any produced/derived audio or video)
House rule: produced media gets **whole-file QC** before it ships or is
previewed — edge checks miss a silent middle, peak metrics miss audible rot.
On the final composited file (not the base):

```bash
# levels: whole-file integrated + per-segment (foreground within ±2 LU; ducked bed 6–9 dB under)
ffmpeg -i out/reel.mp4 -af ebur128 -f null /dev/null
# silence scan across the WHOLE file (a silent interior segment is a failed gate)
ffmpeg -i out/reel.mp4 -af silencedetect=noise=-35dB:d=1.5 -f null /dev/null
# interior + ending transcription: confirm speech is present and the closing sentence is complete
ffmpeg -y -ss <end-7> -i out/reel.mp4 -ar 16000 -ac 1 /tmp/end.wav
/tmp/whisper-venv/bin/whisper /tmp/end.wav --model base.en --output_format txt --output_dir /tmp
```

Hard rules (all documented in `.claude/skills/make-reel/SKILL.md` §Final audio
spec): NEVER `-shortest` when audio must survive (it truncates the last word);
every splice gets a ≥50 ms crossfade on a sentence boundary; the end fade lands
after the final word's natural decay. If the last word is cut, it does NOT ship.
Ingest side: `reel.webm` is always **derived** from the pristine `reel.orig.mkv`
via `tools/normalize-audio.mjs` — never re-encoded in place (each pass stacks a
lossy opus generation; this silently rotted the whole catalog once).

### Ingest pipeline scripts  — APPLIES: yes (any `tools/*.mjs` change)
`node --check` the touched file, then **run it for real** on one capture and
read the output (artifacts on disk + printed values, not vibes).
`tools/normalize-captures.mjs` is idempotent — safe to re-run. Requires current
standalone `yt-dlp` at `~/.local/bin/yt-dlp` (the system package's IG extractor
is broken; re-install one-liner in `CLAUDE.md`). Ingest reels **sequentially**,
never in parallel (IG rate limits).

### systemd (user) units  — APPLIES: yes (scribe only)
The only unit is `2pizzaclub-chronicler.{service,timer}` (nightly share-card
refresh at 01:00). After a change: `systemctl --user daemon-reload`, confirm
`systemctl --user list-timers '2pizza*'` shows the next fire, then
`systemctl --user start 2pizzaclub-chronicler.service` once and read the
`job.end` line in `$QUARTET_EVENTS_DIR/$(date +%F).jsonl`. Never wait for
`OnCalendar`. Don't hand-edit `gallery/share/` — it's generator output
(`tools/share-pages.mjs`).

### Event stream / notifications  — APPLIES: yes
If the phase emits events, read the actual JSONL line in
`$QUARTET_EVENTS_DIR/$(date +%F).jsonl`. If it notifies, either confirm one real
`$QUARTET_NOTIFY_CMD` send or deliberately stub it (say which in the Ledger) —
don't spam the owner from a loop.

### Deploy (GitHub Pages)  — APPLIES: yes (any pushed site change)
Pages rebuilds on every push to `main` (~30s). After push:
`curl -s -o /dev/null -w "%{http_code}\n" https://2pizzaclub.com` must be 200
and the change visible on the live page. The service worker (`sw.js`) serves
stale-while-revalidate — a deploy lands on a returning visitor's NEXT visit;
bump `CACHE_VERSION` in `sw.js` when retiring old cached shells. Cert-bounce
recipe for a stuck Pages cert is in `CLAUDE.md` §Deployment.

### Live posting (Instagram)  — APPLIES: yes (any publish step — HARD human gate)
Posting is public and irreversible. Signal-preview (cover + caption) and get
**explicit sign-off before every post**. NEVER replace or delete a live post
without explicit per-post permission — `--replace` destroys comments/likes and
the URL. This gate cannot be automated away; it is always the user-decision
class.

## Git discipline (multiple agents share `main`)

Not a gate class but enforced on every commit: work directly on `main` (never
branch), stage **explicit paths only** (never `git add -A` / `git add .` — a
blanket add sweeps another agent's mid-ingest capture), leave files outside the
task alone, `git pull --rebase` before push, never force-push. **Commits carry
NO Claude attribution** — no `Co-Authored-By`, no "Generated with" footer
(explicit project policy, overrides any global default).

## Traps that have bitten this project  (append-only)

- Re-encoding `reel.webm` in place stacked 3–4 lossy opus generations across
  the catalog — peaks measured clean while the audio audibly rotted. Always
  derive from `reel.orig.mkv`; `deriveDeliveryWebm` refuses src == out.
- `-shortest` when muxing VO truncates the closing word (user, furious,
  repeatedly, 2026-06). Video must be ≥ audio + ~2s tail; re-whisper the last
  ~7s before any preview send.
- Whole-file loudness/peak numbers pass while one segment is 5 dB off or the
  middle is silent — measure every segment of the FINAL file, and silencedetect
  + interior transcription across the whole file, not just the edges.
- Editing a record's `claim`/`quote` without rebuilding `rag-index.json` leaves
  stale sentence offsets — highlights land on the wrong characters.
- dev-browser Chromium cache: edits invisible until you restart http.server on
  a new port AND open a new dev-browser page (cache is per-context).
- `behavior:'smooth'` on filter scroll overshoots (chapter position moves
  during the animation) — use the instant + double-RAF pattern in `themes.js`.
- Record-id link labels regressed once (fixed `c513346`) — see-also and
  gallery-evidence links use claim text, never database ids.
- Stale system `yt-dlp` fails with "unable to extract shared data" — use the
  current standalone binary at `~/.local/bin/yt-dlp`.
- `editorial_split` backfill over-counted Group A on dense contested reels
  (a 20-record inside-job reel scored 4/0/1, should be ~4/14/1) — A is
  high-bar: verified-true records only; when torn between A and B, choose B.
- DOJ Data Set 9 was mislabeled "native media, photos only" and its whole bates
  range went unsearchable — "native media" means video/audio, NOT scanned
  document images; check bates range + file types before skipping a dataset.
- A live reel with real engagement was deleted on inferred permission —
  replacement/deletion of a live post needs explicit per-post sign-off, always.
- An empty anchor (chapter shell with zero records) renders blank — broaden the
  header or move the card, never leave the shell empty.
