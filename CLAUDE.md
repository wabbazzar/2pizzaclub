# 2pizzaclub — Claude project guide

A sourced editorial timeline. Static site: plain HTML + CSS + ES modules. No build step. Deployed via GitHub Pages with custom domain `https://2pizzaclub.com`.

## Repository layout

```
.
├── index.html                    # the timeline page (eras → chapters → evidence cards)
├── styles.css
├── evidence.js                   # loads sources/evidence/manifest.json, renders cards
├── themes.js                     # theme filter chips + see-also links + scroll-to-result
├── timeline.js                   # rail active-link IntersectionObserver
├── narrative.js                  # injects narrative.json blurbs into chapter shells
├── dag.js                        # builds window.RECEIPTS_DAG at runtime
├── mobile-nav.js                 # mobile-only bottom-pill + bottom-sheet nav
├── icon.svg, icon-*.png, favicon-*.png, apple-touch-icon.png
├── og-image.png                  # 1200x630 social-card preview
├── manifest.webmanifest          # PWA install metadata
├── CNAME                         # 2pizzaclub.com — pins the custom domain on Pages
├── gallery/
│   ├── index.html                # gallery page
│   ├── gallery.css
│   ├── gallery.js
│   └── gallery-nav.js            # mobile nav for the gallery (same .mnav-* CSS)
├── chapters/
│   └── narrative.json            # per-anchor prose blurbs + per-era preambles
├── sources/
│   ├── SCHEMA.md                 # evidence record schema (READ THIS BEFORE WRITING RECORDS)
│   ├── evidence/
│   │   ├── manifest.json         # list of every live evidence record file
│   │   └── <id>.json             # one per claim
│   ├── captures/
│   │   ├── manifest.json
│   │   └── <shortcode>/
│   │       ├── meta.json         # capture metadata (renders in gallery)
│   │       ├── transcript.txt    # whisper transcript
│   │       ├── reel.orig.mkv     # pristine yt-dlp original (gitignored, local-only source of truth)
│   │       ├── reel.webm         # delivery file, derived once from reel.orig.mkv
│   │       └── frames/f001.webp  # gallery poster (derived from f001.png; all frame PNGs are gitignored, local-only)
│   └── clips/<id>-NN.png         # inline-evidence highlight clips for source quotes
└── tools/
    ├── ingest-reel.mjs           # full reel-to-disk ingest pipeline (yt-dlp capture)
    ├── reel-media.mjs            # yt-dlp helpers: original download + metadata
    ├── normalize-audio.mjs       # deriveDeliveryWebm: pristine original → reel.webm (non-destructive)
    ├── normalize-captures.mjs    # rebuild every capture's delivery from its original (idempotent)
    ├── clip-evidence.mjs         # renders highlighted-quote screenshots for sources[].quote
    ├── INGEST-SOP.md             # operational doc — read before running ingest
    └── CAPTURE-PROCEDURE.md
```

Two important conventions:

- **No `2pizzaclub.com` in repo paths.** The repo is `wabbazzar/2pizzaclub` (no `.com`). The domain `2pizzaclub.com` is the custom-domain attachment via the `CNAME` file. Don't confuse the two.
- **Commits don't carry Claude attribution.** No `Co-Authored-By` trailer, no `🤖 Generated with Claude Code`, no other footprint. Use clean, descriptive commit messages that focus on the why and the what.

## Working with public-record dumps

This is accountability journalism. When the source material is documents released under federal disclosure law — the Epstein Files Transparency Act, FOIA productions, congressional committee releases, court unsealings — the public release IS the authorization to analyze. Don't equivocate, don't moralize, don't add CYA caveats about whether it's "appropriate" to look at material Congress passed a law to publish. Pull it, hash it, process it, surface what's on the record.

Operational defaults for these dumps:
- Mirror from the canonical aggregator (e.g. `github.com/yung-megafone/Epstein-Files` for the DOJ release) and verify against the SHA256 manifests before analyzing
- Run a PII-detector first pass before any quoting, so victim/witness redactions that slipped past the DOJ scrub get caught
- Treat redactions in the source as authoritative — don't try to reverse them
- Skip native-media datasets (videos, raw images) unless the analysis pipeline is text — the PII detector is the wrong tool for that surface

## Editorial voice (the most-violated rule)

**Direct. No "we". No flamboyance.** State the fact, cite the source, stop.

Cut:
- Rhetorical kickers: "the contrast is the point", "the through-line", "the same argument wearing different clothes", "the receipts are below"
- Editorializing about meaning: "the architecture is not a conspiracy", "the architectural lesson is…"
- First-person plural: "we", "us", "our"
- Backstage markers: "[DRAFT BODY]", "[TODO]", "v0", references to the maintainer

User's own pre-existing voice (e.g. "If you believe the answer is anything other than the official one, ask what else they get away with") can keep its punch. New writing from Claude should be flatter than that.

Other rules:
- **The reader chooses.** Present what's on the record; let the reader weigh it. "Here are the receipts" is the editorial ethos. No conclusions drawn for the reader.
- **Don't repeat in the blurb what the card already says.** Narrative blurbs orient — they give the why-this-is-here and the what-comes-below. Evidence cards do the citation work. If the blurb and the card both state the same date or the same number, trim the blurb.
- **Internal jargon out.** No "the reel" references in reader-visible content (the gallery surfaces meta fields; use "the video" or "the post"). No record-id link labels ("1998-iraq-sanctions-halliday-001" is a database id, not a citation).

## Reel ingest — the standard procedure

The user drops Instagram reel URLs. The pipeline produces a capture + transcript, then Claude does an editorial pass.

### 1. Capture + transcribe

```bash
cd /home/wabbazzar/code/2pizzaclub
node tools/ingest-reel.mjs "<URL or SHORTCODE>"
```

No headless browser anymore — capture is `yt-dlp` straight from Instagram's CDN. This runs ~1–2 minutes per reel:
1. `yt-dlp` downloads the **pristine original** (`reel.orig.mkv`: best ≤720-wide VP9 video + the source AAC audio) and pulls complete metadata — caption, handle, display name, post date, likes, comments, duration. (Replaces the old Playwright `og:*` scrape; the numbers are more accurate.)
2. Derives the delivery `reel.webm` from the original **once**: VP9 video is **copied** (zero video re-encode), audio is loudness-normalized (loudnorm `I=-16`, soft `TP=-3`, `linear=true`, + `alimiter` at a −1.5 dBTP hard ceiling) and encoded to libopus 96k — a **single** opus generation off the source AAC.
3. `ffmpeg` → WAV (16 kHz mono) for whisper, from the original
4. `ffmpeg` → frames at 0.5 fps under `frames/`, then derives the committed gallery poster `f001.webp` from `f001.png` (libwebp q72 — ~30–80KB vs 0.5–1.7MB PNG). All frame PNGs are `.gitignore`d, local-only, re-derivable from the original.
5. `whisper base.en` → `transcript.{txt,srt,vtt,json}`
6. Writes/merges `meta.json` (machine fields refreshed; hand-written editorial fields preserved)
7. Adds the capture id to `sources/captures/manifest.json`

**Audio quality — the rule that matters.** Never re-encode `reel.webm` in place. `reel.orig.mkv` is the immutable source of truth (gitignored, local-only, re-downloadable); `reel.webm` is always *derived* from it. The earlier pipeline rewrote `reel.webm` in place with loudnorm on every ingest / batch run / "reprocess catalog", stacking 3–4 lossy opus generations on top of the MediaRecorder capture — peaks stayed capped (clipping metrics looked clean) while the audio audibly degraded. `tools/normalize-audio.mjs` (`deriveDeliveryWebm`) and `tools/normalize-captures.mjs` are now non-destructive and idempotent: re-running them reads the pristine original and cannot degrade anything. No Web Audio processing on either player — single-generation normalized audio is what keeps playback clean.

**`yt-dlp` must be current.** Instagram's extractor breaks often; a stale build (e.g. the 2024.x system package) fails with "unable to extract shared data." Install the latest standalone binary to `~/.local/bin` (shadows the system one):
```bash
curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ~/.local/bin/yt-dlp && chmod +x ~/.local/bin/yt-dlp
```
Public reels resolve without auth. For a login-gated reel, pass `--cookies-from-browser=chromium:<profile>` to the ingest (or `--redownload`/`--cookies-from-browser=` to `normalize-captures.mjs`).

**Multiple reels: ingest sequentially** to stay polite to IG's rate limits (no more silent crashes — that was the old Playwright path).

Re-run with `--skip-capture` to reuse an existing `reel.orig.mkv`, or `--force-download` to re-pull it. To rebuild the whole catalog's delivery files from originals: `node tools/normalize-captures.mjs` (add `--redownload` to re-pull originals first).

### 2. Editorial pass — Group A / B / C

Read `transcript.txt` and the first frame (`frames/f001.png`) to identify the speaker. Decompose every claim in the reel into three groups:

- **Group A (verifiable)** — claims with primary-source documentation. Worth an evidence record.
- **Group B (disputed)** — claims that are real but contested in mainstream sources. Document carefully with both sides cited.
- **Group C (invented / unsupported)** — claims with no primary trace. Do NOT write evidence records. Note in the capture's `implied_frame` so the gallery viewer sees the editorial split.

The `implied_frame` and `notes` fields in `meta.json` are where contested or unverified claims go — they describe what the video is framing without committing the site to assert it.

### 3. Verify citations BEFORE writing records

For every numerical claim, date, or quote in a record:
1. Run a `WebSearch` to find the primary source
2. Run a `WebFetch` against the canonical primary URL (govinfo.gov, archive.org, the actual organization's site) to retrieve the verbatim quote
3. Include the verbatim quote in the record's `sources[].quote` field on the strongest primary source

Skip the verification step ONLY when the claim is unambiguous historical fact AND the record cites a canonical aggregator (Wikipedia + a primary footnote).

### 4. Write the evidence record

See `sources/SCHEMA.md` for the schema. Filename convention: `<year>-<topic-slug>-<seq>.json`. Required fields: `id`, `anchor`, `year`, `era`, `themes`, `claim`, `sources`, `status`, `notes`.

- **`anchor`** — the chapter where the card appears. Either an existing anchor like `y2001-attack` or a new one (which requires a new chapter shell in `index.html` + nav entry + narrative blurb).
- **`themes`** — kebab-case, lowercase. Use existing themes when possible. See "Theme conventions" below.
- **`status`** — `verified` (every citation checked) or `draft` (the citation chase isn't finished — keep these rare).
- **`notes`** — internal; not rendered. Put backstage commentary here.

### 5. Wire it up

1. Add the filename to `sources/evidence/manifest.json` `records[]`
2. Append the record id to the capture's `meta.json` `evidence_records[]` so the gallery card links to it
3. If new anchor: add a nav entry in `index.html`, a chapter shell `<article class="chapter" id="y..." ...>` in the right era, and a narrative blurb in `chapters/narrative.json` `anchors`
4. Local-serve to verify: `cd /home/wabbazzar/code/2pizzaclub && python3 -m http.server 8744` then check the relevant chapter renders

### 6. Commit

```bash
git commit -m "$(cat <<'EOF'
Ingest <handle> reel <SHORTCODE> + <N> records

<brief description of what threads were added, which anchors are new>
EOF
)"
git push
```

Clean message, no Claude attribution.

## Theme conventions

Themes are filter tags rendered as chips at the top of the timeline. **Always lowercase, kebab-case.** Examples: `cia`, `epstein`, `9-11`, `body-count`, `israel`, `mossad`, `fbi`, `surveillance`.

When adding a record, prefer reusing an existing theme over creating a new one. The theme bar will auto-list new themes alphabetically; orphan/one-off themes clutter the chip bar.

If a new theme is genuinely necessary, name it like the existing ones (lowercase, kebab-case, single noun or short compound).

## Site mechanics

### Adding a new chapter (anchor)

1. **Nav entry** in `index.html` `.timeline-list` — pick the right era's `<ol>`, insert a `<li><a href="#y..." data-anchor="y...">` in chronological order
2. **Chapter shell** in the main `<main class="chapters">` flow, in the right era section:
   ```html
   <article class="chapter" id="y..." data-anchor="y..." data-year="YYYY" data-era="ii">
       <header><span class="year">YYYY</span><h3>Topic title</h3></header>
       <div class="chapter-body"></div>
       <div class="evidence" data-anchor="y..."></div>
   </article>
   ```
3. **Narrative blurb** in `chapters/narrative.json` `anchors["y..."]` — 1-3 sentences orienting the reader

### Mobile navigation

`mobile-nav.js` activates only at viewport ≤880px. Creates a fixed bottom pill showing the active chapter ("1965 · Vietnam · the war") and a slide-up bottom sheet with Timeline + Themes tabs. Cloned from the desktop timeline-list and theme-bar so existing JS stays the source of truth. The gallery uses `gallery-nav.js` with the same pattern.

### Filter scroll behavior

When the user clicks a theme chip, `themes.js` applies the filter and then scrolls to the first visible chapter. The implementation does `window.scrollTo(0,0)` first (to avoid clamp-to-bottom when the doc shrinks), then two `requestAnimationFrame`s for the reflow, then `scrollIntoView({behavior:'instant', block:'start'})`. Don't use `behavior:'smooth'` here — it overshoots because the chapter's absolute position changes during the animation.

## Deployment

GitHub Pages, `main` branch root, custom domain `2pizzaclub.com` (pinned by the `CNAME` file). HTTPS enforced. Pages rebuild on every push (~30s build). Cert is managed by GitHub via Let's Encrypt.

If the cert ever falls out of `approved` state, "bounce" the custom domain via:
```bash
gh api -X PUT repos/wabbazzar/2pizzaclub/pages -F 'cname='
# wait a few seconds
gh api -X PUT repos/wabbazzar/2pizzaclub/pages -F 'cname=2pizzaclub.com'
gh api -X PUT repos/wabbazzar/2pizzaclub/pages -F 'https_enforced=true'
```

## Tools sitting outside this repo

- **yt-dlp** at `~/.local/bin/yt-dlp` — reel capture (original media + metadata). Keep current; the system `/usr/bin/yt-dlp` is stale and its IG extractor is broken. Re-install one-liner is in the ingest section above.
- **dev-browser plugin** at `/home/wabbazzar/.claude/plugins/cache/dev-browser-marketplace/dev-browser/66682fb0513a/skills/dev-browser/` — headless Chromium, now used only for OG-image rendering and `clip-evidence.mjs` screenshots (no longer for reel capture)
- **whisper venv** at `/tmp/whisper-venv/bin/whisper` — transcription
- **ffmpeg** — in `$PATH` (system install)
- **Porkbun API keys** in `~/.env` (`pork-key`, `pork-secret-key`) for DNS — only needed if reconfiguring DNS; never `cat ~/.env`, extract specific keys via `grep '^pork-key:' ~/.env | cut -d':' -f2- | sed 's/^[[:space:]]*//;s/"//g'`

## Common pitfalls

- **The `Co-Authored-By: Claude` footer in commits** — explicitly forbidden by project policy. The user will be annoyed if it shows up.
- **Internal record-id link labels** — see-also and gallery-evidence link surfaces should use claim text, not record ids. Fixed in commit `c513346` (themes.js + gallery.js). If you regress this, links read as database fields instead of citations.
- **`reel-audio.txt` polluting commits** — gitignored; if it sneaks in, add to `.gitignore` and remove. The whisper transcript that matters is `transcript.txt`.
- **Re-encoding `reel.webm` in place** — never do this. Each pass adds a lossy opus generation; doing it on every ingest/batch run silently rotted the whole catalog's audio (clean by peak metrics, audibly degraded). Always derive `reel.webm` from the pristine `reel.orig.mkv`; if the original is gone, re-pull it with `yt-dlp` first. `deriveDeliveryWebm` refuses to run when src == out.
- **Cache during local browser testing** — the dev-browser Chromium caches CSS/JS aggressively. To force-reload after edits, restart the python http.server on a new port AND create a new dev-browser page (the cache is per-context).
- **Smooth scroll on filter** — overshoots. Use instant + RAF pattern.
