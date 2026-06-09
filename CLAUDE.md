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
    ├── share-card.mjs            # renders one 1200x630 cinema-share social card (per theme)
    ├── share-pages.mjs           # generates gallery/share/<theme>/ unfurl pages + cards (scribe regenerates nightly)
    ├── INGEST-SOP.md             # operational doc — read before running ingest
    └── CAPTURE-PROCEDURE.md
```

Two important conventions:

- **No `2pizzaclub.com` in repo paths.** The repo is `wabbazzar/2pizzaclub` (no `.com`). The domain `2pizzaclub.com` is the custom-domain attachment via the `CNAME` file. Don't confuse the two.
- **Commits don't carry Claude attribution.** No `Co-Authored-By` trailer, no `🤖 Generated with Claude Code`, no other footprint. Use clean, descriptive commit messages that focus on the why and the what.

## Multiple agents share `main` — never branch

Several Claude agents work in this repo **at the same time**. They stay in different areas (different files), but they commit concurrently — so coordination depends on everyone holding to one branch with a clean tree:

- **Always work directly on `main`.** Don't create feature branches or git worktrees, don't `git checkout -b`. A branch that diverges strands work the other agents can't see and turns the next sync into a conflict. End every task on `main`.
- **Commit constantly, in small targeted units.** One logical change per commit. Don't leave a task with uncommitted edits or scratch files sitting in the tree — finish, commit, and the tree is clean for the next agent.
- **Stage only your own files — never `git add -A` / `git add .`.** List explicit paths (`git add path/to/file`). A blanket add sweeps up another agent's in-progress files (e.g. a half-ingested `sources/captures/<shortcode>/`) into your commit.
- **Leave everything outside your task alone.** Don't commit, revert, `git rm`, or `git checkout` files you didn't change — that other modified/untracked file is probably another agent mid-task.
- **Pull before you push.** `main` may have moved under you while you worked; `git pull --rebase` then push so concurrent pushes don't collide. If a push is rejected, rebase and retry — never force-push.

## Working with public-record dumps

This is accountability journalism. When the source material is documents released under federal disclosure law — the Epstein Files Transparency Act, FOIA productions, congressional committee releases, court unsealings — the public release IS the authorization to analyze. Don't equivocate, don't moralize, don't add CYA caveats about whether it's "appropriate" to look at material Congress passed a law to publish. Pull it, hash it, process it, surface what's on the record.

Operational defaults for these dumps:
- Mirror from the canonical aggregator (e.g. `github.com/yung-megafone/Epstein-Files` for the DOJ release) and verify against the SHA256 manifests before analyzing
- Run a PII-detector first pass before any quoting, so victim/witness redactions that slipped past the DOJ scrub get caught
- Treat redactions in the source as authoritative — don't try to reverse them
- Skip native-media datasets (actual videos, audio) unless the analysis pipeline is text — the PII detector is the wrong tool for that surface. **"Native media" means video/audio, NOT scanned document images.** A dataset of document-image PDFs (e.g. DOJ Data Set 9, 531K scans) is text the moment it's OCR'd and belongs in the corpus — mislabeling DS9 "181 GB native media, photos only" left its whole bates range (EFTA00039025–01262781) unsearchable until it was pulled 2026-06-09. When a dataset is large, check what's actually in it (bates range, file types) before skipping.

## No official story is ground truth — attribute, don't adopt

The premise of this operation is that official accounts get scrutinized, not assumed. This governs **analysis and investigation, not just published prose** — don't import the zeitgeist as a premise in your own reasoning, and don't narrate it back to the user as settled.

- **An "official" account is a claim on the record, not a fact.** Charges, the named/arrested suspect, agency findings, the press consensus — all are *attributable claims* ("prosecutors charged X", "the FBI said Y", "outlets reported Z"), never stated in our own voice as truth. Don't write — or reason — as if the official version closed the question.
- **Don't pedestalize the primary suspect or the consensus narrative.** That someone was named, arrested, or charged does not adjudicate a lead, validate or invalidate a piece of evidence, or make a competing observation "wrong." Never dismiss or rank a finding with "but the official suspect is X" / "but the official story says Y." The charge is one data point; weigh it like any other. Phrases like "the *actual* suspect" or "the *real* shooter" are the tell — cut them.
- **This cuts both ways — neutrality, not counter-bias.** Refusing to adopt the official line is NOT license to adopt the fringe line. A 4chan post, a viral repost, and a DOJ press release are all claims weighed by their evidence and provenance. Don't flip "official = true" into "official = false." Follow the artifact, straight.
- **Separate primary fact from attributed conclusion.** "This document exists / this video shows X / this timestamp reads Y" is verifiable — state it plainly. "Who did it / why / what it means" is attributed — name the source and stop. Surface both; let the operator and the reader weigh (see "The reader chooses," below).

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
- **Internal jargon out.** No record-id link labels ("1998-iraq-sanctions-halliday-001" is a database id, not a citation).
- **The source video belongs to the gallery, nowhere else.** The gallery is the surface that reviews/indexes captures, so it references "the video." The **timeline and the Instagram carousels do NOT mention the source video at all** — not "the reel," not "the video," not "the post," not the creator's handle in reader-visible prose. The video is the *prompt* for the work, not its subject: present the bill, the documents, and the facts as standalone editorial. The capture may remain a bare provenance citation in an evidence record's `sources[]` (it's the mechanical gallery↔record link), but the reader-visible `claim`, narrative blurbs, and every IG card stand on their own — never "a video claims X, and here's our response." Backstage `notes` and `_comment` fields are exempt (not rendered).

## Visual tone — comic, not the prose

The *prose* is flat (above). The *visuals* are the opposite axis: **fun and silly about dark things.** The personality is comic-strip — the Saturn-pizza brand mark, the atomic-age PSA / Vault-Boy mascots, the Instagram carousels. Playful, whimsical, friendly cartoon. The juxtaposition is the device: bright, goofy presentation carrying grim receipts.

- **Mascots are warm and whimsical, never cold or authoritarian.** The reference register is Cowboy Bebop's *Big Shot* — the in-universe bounty-news show with its two over-the-top, cheery hosts (a Black man + a white woman). Friendly cartoon presenters who are fun to watch. A stern federal-agent/G-man type is the wrong direction — it reads cold and serious, which fights the silliness.
- Keep the brand palette (mustard `#FFD93D`, navy `#1B3FB5`, dusty red `#E63946`, cream `#FFF8E7`, ink) so the goofiness stays on-brand.
- This lives mostly in the `/insta-post` skill (mascot generation + cover voice) and the logo, but it governs any reader-facing illustration choice.

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

Also record the split as a structured **`editorial_split`** on the capture's `meta.json` — `{"a": <#GroupA>, "b": <#GroupB>, "c": <#GroupC>}`, the count of distinct claims in each group. The gallery cinema sorts a theme-filtered playlist by `a/(a+b+c)` descending — most-uncontested reels first — so **every ingested capture should carry this field**. It is set HERE, at ingest, from your own decomposition; it is NOT regenerated nightly. (The cinema falls back to a verified-record ratio for any capture missing it, but don't rely on the fallback — set the field.)

Count it with a **strict** hand — the sort is only trustworthy if `a` is hard to earn:
- **`a` (Group A) is high-bar.** Reserve it for claims that are independently verified *true* — backed by a `status: "verified"` evidence record AND not the reel's disputed framing. A record that merely documents that someone *said* X, or one still `primary-link-pending`/`draft`/`contested-*`, is **not** Group A.
- **`b` (Group B) counts each contested claim.** Every conspiracy / false-flag / inside-job / foreknowledge framing, every claim contested in mainstream sources, and every claim whose record is non-verified → `b`. A reel surfacing twenty disputed 9/11-inside-job claims has a high `b`, not `b: 0`. When torn between A and B, choose B.
- **`c` (Group C)** is the asserted-but-unrecorded count — invented / no primary trace.

(The original backfill over-counted A on dense contested reels — e.g. a 20-record inside-job reel scored `4/0/1` and floated to the top of its theme. Don't repeat that; a reel like that is ~`4/14/1`.)

**Check our own EFTA corpus FIRST — before any external source.** For every named person, entity, or event in the reel, search the Epstein holdings we already have before reaching for a third-party link.

The complete release — the **full extracted text of all DOJ DataSets (1–12, including DS9), the House Oversight estate, and the parsed emails — lives in ONE grep-able file**: `~/data/epstein-files/work/corpus.jsonl` (~3.6 GB, 1,051,599 docs, `{id, source, dataset, text}` per line). **A word/phrase search starts HERE** — it covers the whole release, not just the published subset:

```bash
# fast line-level pre-filter over the ENTIRE release (all datasets incl. DS9):
grep -c -iE "ron(ald)?[. ]+lauder" ~/data/epstein-files/work/corpus.jsonl
# then extract with context (python recipe + OCR-damage notes in the /epstein skill).
# Per-file raw docs: ds9/text/EFTA*.txt (DS9), extracted/dataset_N/ (DS1–8,10–12),
# raw/estate/text_only/HOUSE_OVERSIGHT_*.txt. Account for OCR damage (@→©, .com→.corn).
```

The repo's `/efta/` page (`efta/findings.json`, `efta/messages.json`, 7k+ `efta/docs/*.json`) is the *published, curated subset* — a convenience cache, not the whole corpus. If the subject is in the release, **our own primary document is the strongest citation** — cite the doc id with `type: "primary"`, link to `https://2pizzaclub.com/efta/messages.html` (or the doc viewer), put the verbatim line in `quote`, and keep any outside reporting as *corroboration*, not the basis. (The full `/epstein` skill documents the dataset map, the DOJ per-file HTTP fetch for anything not yet local, and the detective-subagent protocol.) (Lesson: the Ronald Lauder record first shipped citing only the Daily Pennsylvanian and a web tracker — he was in our own `HOUSE_OVERSIGHT_*` iMessage docs the entire time, with Epstein writing "meeting with lauder re alzheimer ... also with jim watson." Always grep our corpus first.) Watch for whisper/OCR spellings and name variants (initials, "Lauter"→"Lauder", redactions) when grepping.

### 3. Verify citations BEFORE writing records

For every numerical claim, date, or quote in a record:
1. **First check our own EFTA corpus** (grep recipe above). If the subject is there, cite our primary doc(s) and link to `/efta/` before going external.
2. Run a `WebSearch` to find the primary source
3. Run a `WebFetch` against the canonical primary URL (govinfo.gov, archive.org, the actual organization's site) to retrieve the verbatim quote
4. Include the verbatim quote in the record's `sources[].quote` field on the strongest primary source

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

### Cinema share cards (`gallery/share/`, scribe-maintained)

Sharing a theme-filtered cinema (the 🔗 button in `gallery/cinema.js`, when a single theme is active) copies a link to `gallery/share/<theme>/` instead of a raw query-param URL. Each such directory is a pre-rendered **unfurl page**: an `index.html` carrying its own `og:image` meta (→ a 1200×630 `card.png` reading "Someone wants to share a video collection with you" + the topic + total runtime) plus a redirect into `/gallery/?cinema=1&themes=<theme>`. This is the only way a static host can make a shared link preview a per-collection card (query strings can't vary `og:image`).

The whole surface is generated by `tools/share-pages.mjs` (one target per theme + an `all` target + `manifest.json`) and is **regenerated nightly by scribe** so new reels/themes get cards automatically. Don't hand-edit anything under `gallery/share/` — it's generator output. To refresh manually: `cd <dev-browser playwright dir> && node tools/share-pages.mjs`. The scribe config lives in `.agents/` (`config.toml` + `scribe.md`); the systemd timer is `2pizzaclub-scribe.timer` on the wabbazzar-ice hub.

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
