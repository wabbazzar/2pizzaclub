---
name: epstein
description: Playbook for the 2pizzaclub Epstein-files analysis — the EFTA dataset map, the publish/curate pipeline for /efta/, the editorial + PII rules, and how to task context-efficient "detective" subagents to read primary documents and assemble findings. Use when the user says /epstein, asks to read/analyze Epstein documents, mentions the EFTA/estate/DOJ release, the /efta/ page, the mystery iMessage contact, the Wolff drafts, DS10 financials, or wants to spawn document-reading subagents.
---

# /epstein — analysis playbook

Accountability journalism over the public Epstein-file releases. The releases
(EFTA, DOJ DataSets, House Oversight estate dumps, court unsealings) ARE the
authorization to analyze — pull it, verify it, surface what's on the record, let
the reader weigh it. No moralizing, no CYA caveats.

Project editorial + commit rules live in `CLAUDE.md` (flat voice, no "we", no
Claude attribution on commits). This skill is the operational layer on top.

## Where the data lives

Corpus root: `~/data/epstein-files/` (outside this repo). Map + status:

| Slice | Path | State |
|---|---|---|
| **Full-text search layer** | `work/corpus.jsonl` (~3.6 GB) | **1,051,599 docs — the extracted text of the ENTIRE release in one grep-able JSONL.** One line per doc: `{id, source, dataset, text}`. Coverage: DS10 503,150 (≈100%), **DS9 531,282 (≈100%, added 2026-06-09)**, DS8 9,927, DS1 3,142, estate 2,710, DS2 574, DS1–7 the rest, DS11 100, DS12 151, parsed emails 194. **Any word/phrase search starts HERE** — see the search recipe below. `corpus.hi.jsonl` = text-heavy subset (456K, pre-DS9). The 5,163/1,143 counts in `WORK_LOG.md` describe the pre-DS10 build and are stale. |
| **DOJ DS9 (document images)** | `ds9/images/*.pdf` + `ds9/text/*.txt` | **531,282 document PDFs, bates EFTA00039025–01262781** — pulled + text-extracted 2026-06-09 (pdftotext ~89%, tesseract OCR ~11%). NOT "181 GB native media to skip" (an earlier wrong label that left this whole bates range unsearchable); the video/audio NATIVES (2,324 files) were the only part skipped. Already folded into `corpus.jsonl` (rebuild via `tools/build_ds9_corpus.py`). Per-file manifest under `ds9meta/`. |
| House Oversight estate text | `raw/estate/text_only/HOUSE_OVERSIGHT_*.txt` | **647 docs, text-ready** — the richest narrative/email slice |
| DOJ DS8 (pre-OCR'd) | `raw/dataset_8/*_djvu.xml` | ~10,487 docs, police-report era |
| DOJ DS10 ("financial") | `extracted/dataset_10/VOL00010/` | 503,154 PDFs. **Mislabelled: a 50-doc random sample is ~60% EMAIL, ~22% financial statements, 0 iMessage** (heavy OCR damage — `@`→`©`, `.com`→`.corn`). The biggest unread Epstein *email* trove. **Full text already extracted into `work/corpus.jsonl` — searchable in seconds.** What's still missing is *metadata*: the load file (`DATA/VOL00010.DAT`) carries only Begin/End Bates, no sender/date table, so "all emails from X" still needs content reads; "every doc containing phrase Y" does not. |
| DS11/DS12 emails | `extracted/dataset_11,12/` | text-extracted, 2017 ops |
| Parsed email corpus | `emails/txt/` + `INDEX.csv` | 194 emails |
| Estate bundles 002, 004–012 | not downloaded | **~20K of ~24K bates pages unpulled.** The 647-doc sample we have is 72% email + 25 iMessage forensic exports + court/news — the bundles are the same mix, i.e. the only source of *more iMessages* |
| Pipeline output | `work/findings.json`, `work/corpus*.jsonl` | feeds the statistical layer |
| Living work log | `WORK_LOG.md` | **read before any pipeline work — documents what's been tried + what failed** |

### Word/phrase search — always do this first

The whole release is one flat-file query away. Don't reach for subagents, don't
gate, don't be skeptical — a phrase search over all 520K docs takes seconds:

```bash
# fast pre-filter (line-level), then exact extraction with context:
grep -c -iE "PATTERN" ~/data/epstein-files/work/corpus.jsonl
python3 - <<'EOF'
import json, re
pat = re.compile(r'PATTERN', re.I)
for line in open('/home/wabbazzar/data/epstein-files/work/corpus.jsonl'):
    if not pat.search(line): continue
    d = json.loads(line); t = d['text']
    for m in pat.finditer(t):
        s,e = max(0,m.start()-150), min(len(t),m.end()+150)
        print(d['id'], d['dataset'], '...'+' '.join(t[s:e].split())+'...')
EOF
```

Account for OCR/encoding damage before concluding "not found": quoted-printable
(`fr=m` = "from", `=` mid-word), `@`→`©`, `.com`→`.corn`, dropped letters. Search
a distinctive *substring* first ("transfusi"), then tighten. Proof of value: the
phrase "all you need is a blood transfusion" hit exactly one doc in 520K
(EFTA01801501, Josephson→Epstein 2016, promoted to the timeline 2026-06-05).

Already-extracted convenience data in THIS repo: `efta/messages.json` (1,200
iMessages + 20 email threads, parsed) and `efta/docs/*.json` (doc-viewer
snippets). Prefer these compact files over re-reading raw docs when they cover
the question.

### Pulling more of the release on demand (DOJ HTTP)

If a bates isn't in `corpus.jsonl`, the DOJ still serves every individual file
over HTTP at full speed — the bulk ZIPs are gone (404) but per-file works behind
a one-line age cookie:

```bash
# any file, any dataset — works with the cookie, 302→age-verify without it
curl -sL -b "justiceGovAgeVerified=true" -A "Mozilla/5.0 Chrome/120" \
  "https://www.justice.gov/epstein/files/DataSet%209/EFTA00578213.pdf" -o out.pdf
# bulk: aria2c -i urls.txt -j20 --header "Cookie: justiceGovAgeVerified=true"
```

Bates→dataset map: DS1–8 `00000001–00039023`, **DS9 `00039025–01262781`**, DS10/11
`01262782–02213051`, DS12 `02730265–02731852`. DS9's removed videos + ~25
reconstruction-only images 404 on DOJ — those live only in the @jeefiles 181 GB
torrent (magnet in the aggregator README; starved swarm, avoid). Per-file SHA256
manifest + load files: `ds9meta/` (mirrored from the aggregator `notes/DS09/`).

## The /efta/ publish pipeline

The page loads `efta/findings.json` → `pages[]` (each a `kind`); `efta.js`
prepends 4 intro slides and renders per-kind; `efta/messages.html` is the
searchable iMessage/thread reader. Curation flow:

```
pipeline (~/data/epstein-files) regenerates the full findings
  → cp to drafts/efta/findings-full.json   (LOCAL ONLY, gitignored — public repo + raw PII)
  → node efta/curate.mjs                    (KEEP/MOVE lists → efta/findings.json + efta/messages.json)
  → verify locally, commit, push (Pages deploys from main)
```

Published deck = 24 curated pages. Raw NER/PII dumps, DS10 tables, n-gram/TF-IDF
tables are **retired** (see `drafts/efta/README.md`). Hand-authored findings live
in `efta/deepread.json` (kind `narrative_finding`).

## Non-negotiables before publishing any finding

1. **Verify every quote against its source file.** `grep` the distinctive phrase
   in `raw/estate/text_only/HOUSE_OVERSIGHT_<id>.txt` and confirm the doc id is
   right. The last deep-read synthesis had 3 bad citations (wrong doc / OCR
   variant) that this step caught. A wrong Bates number discredits the site.
2. **Reproduce OCR verbatim**, flag damage (`starts`→`stars`), don't silently fix.
3. **PII:** never publish victim/witness identifiers, SSNs, DOBs, account/card
   numbers. The retired label pages existed because raw NER dumps leak these.
4. **Editorial pass:** Group A (verifiable) / B (disputed, cite both sides) /
   C (unsupported — do NOT write a record; note in `implied_frame`).

## Tasking detective subagents (the smart-reader pattern)

When a task means reading many documents, spawn subagents — but make them
**context-efficient detectives**, not whole-corpus readers. The reusable
protocol is `.claude/skills/epstein/detective-protocol.md`: read one doc → write
a compact entry to a disk CASEFILE → discard the raw text → refresh from the
CASEFILE, never from raw docs. This keeps each agent's context (and cost) flat
regardless of how many docs it reads.

How to spawn:
- Use `subagent_type: "Explore"` or `general-purpose`, **model `sonnet`** for the
  reading grunt-work (reserve Opus for synthesis). Run independent readers in
  parallel (one message, multiple Agent calls). Reading is parallel-safe; only
  the *ingest* pipeline must run sequentially.
- The prompt MUST: (a) tell it to read `detective-protocol.md` first; (b) give an
  **explicit scoped manifest** (doc ids or a dir + filter) — never "read
  everything"; (c) state the single question; (d) require the CASEFILE + the
  final report with the READING META section.
- Relay the agent's findings to the user, then run the verify step before any of
  it reaches `/efta/`.

Expensive slices (DS10's 158K docs, the unpulled estate bundles) are **gated**:
filter to a shortlist first (grep/script, no model), confirm the budget with the
user, then read the shortlist. Never point a reader at 158K docs.

## Open task queue

1. **Identify the redacted iMessage contact** (highest yield). The 2017–2019
   counterpart who claims "I have Kudlow and Bolton in there", meets MBS/HBJ in
   Paris, is filmed at Cambridge, has William Burck as attorney, intel-briefing
   access, a "former Soros partner" sponsor, travels Abu Dhabi/Dubai. Source:
   `efta/messages.json` (511 counterpart messages) + key raw docs 025408/027148/
   027260/027133. Output: suspect profile + ranked candidates + confirmation path.
2. **Read the two Wolff profile drafts as one artifact** — `HOUSE_OVERSIGHT_022746`
   + `_023627`. Closest thing to an Epstein memoir. Build a structured digest:
   every factual claim, guest list, quote, with line anchors.
3. **DS10 financial deep-read (gated)** — filter `extracted/dataset_10/` to a
   shortlist (`wire|transfer|beneficiary|swift|J.P. Morgan|Deutsche`) first, then
   read the shortlist. Confirm budget before launching.
4. **Pull unpulled estate bundles 002/004–012 (ops, gated)** — surgical extracts
   from the IA `FULL_djvu.txt` mirror per `WORK_LOG.md`; that file documents the
   download pitfalls (Dropbox/Cloudflare/DNS-storm). Not a subagent job.

After any detective run: relay findings, capture the READING META into this file
(below) so the next run is smarter.

## Reading-meta log (improve over time)

- 2026-05-25 deep read: 6 parallel sonnet readers over the 647-doc estate slice
  produced 12 findings; weakness was citation drift (3 wrong doc ids) → added the
  mandatory verify-against-source step above.
- 2026-05-26 Wolff drafts (sonnet, 51k tokens, ~30:1 compression, clean run):
  lesson — for multi-draft / multi-version targets, run a `diff` pass between the
  files BEFORE reading so the second read covers only the delta; and pre-grep for
  `[TK ]` placeholders + named entities to surface structural gaps in one shot.
  Finding worth noting: the two Wolff drafts are a draft + a revision Wolff emailed
  to Epstein himself (`jeevacation@gmail.com`, 10/8/2016), and the revision
  systematically softens the candid lines ("usefulness of disgrace" → "colorful
  reputation"; "blackmail" → "under his spell"). The earlier draft 022746 is the
  more candid source.
- 2026-05-26 mystery contact (sonnet, 136k tokens, ~13 min): IDed the redacted
  2017–2019 iMessage counterpart as **Steve Bannon** (very high confidence) —
  Epstein names him directly ("wants Steve to succeed" [025734]; "Epstein Bannon
  Kurz" [027307]), and public reporting (NBC/THR/Jacobin/CNN) already names him,
  so this confirms rather than breaks. Two lessons: (1) the parsed `messages.json`
  collapses every redacted sender into one "counterpart" — but doc 027225 carries
  a June-4 birthday + "younger son at Stern" that does NOT fit Bannon (an archive
  `1111`-labelled likely-different contact merged into the stream). The iMessage
  parser should retain each message's source-archive filename so merged contacts
  are visible without a raw read. **Do NOT assert "all counterpart messages =
  Bannon".** (2) Earlier notes mis-stated direction on the "one holy shit after
  another" briefing [025408] — that is Epstein describing HIS OWN briefing to the
  counterpart, not the counterpart's. Re-verify direction of attribution on quotes.
- 2026-05-27 full-estate rerun (8 sonnet detectives over the 2,037 docs the first run
  missed; synthesis at `tmp/epstein-deepread-new-2026-05-27/SYNTHESIS.md`). Confirmed
  the new estate = Epstein's 2014–2019 bipartisan leverage/PR/brokerage machine (Bannon
  spine, Wolff instrument, Ruemmler through-line, 2011 Osborne reputation blueprint).
  Verify gate again caught citation drift (Ittihadieh "free information" misattributed to
  032792). **Manifest-prep lesson (all 8 agents flagged it): before slicing, (1) content-hash
  dedup on first ~200 chars — ~35-40% of estate docs are multi-recipient duplicates stored
  once per Bates; (2) extract From/To/Sent into a sender table and slice by actor; (3)
  date-sort (Bates order ≠ chronological); (4) auto-skip Flipboard / Apple-News JSON /
  JPMorgan-GIO / HBRK news-clipping boilerplate. These cut the next read ~⅓ for free.**
- 2026-06-05 phrase search ("all you need is a blood transfusion"): single hit in 520K docs
  (EFTA01801501, Josephson→Epstein, Jan 5 2016, subject "Dr. Agus") → promoted to the
  timeline (record 2016-epstein-blood-transfusion-001, PDF hosted at efta/docs/). Two
  lessons: (1) this skill's data map previously said DS10 "must be read, not queried" —
  wrong since the May 27 corpus rebuild; `work/corpus.jsonl` carries full extracted text
  of ~100% of DS10. Fixed above; trust the search layer first. (2) The verify gate caught
  citation drift again, this time in MY OWN prose: the NYT 2019 eugenics article documents
  cryonics/transhumanism, not young-blood transfusions — drafted claim said otherwise from
  memory. Verbatim-verify every secondary citation too, not just Bates quotes.
- 2026-06-09 DS9 pulled + integrated: a reel cited an EFTA-bates doc that no local search could
  find — root cause, DS9 (531K document PDFs, bates 00039025–01262781) had been skipped on a
  wrong "181 GB native media, photos only" label. It is actually document scans; only the 2,324
  video/audio NATIVES are media. Pulled all 531,282 PDFs over DOJ HTTP (age cookie, not the
  starved torrent), text-extracted (pdftotext 89% / tesseract 11%), folded into `corpus.jsonl`
  (now 1.05M docs). Verified three reel documents as genuine: Zorro Ranch petroglyph task list
  (EFTA00578213), FBI Las Trampas "Death Bell" TIR (EFTA00129047), Kiswa/Kaaba-cloth customs
  import to Little St James (EFTA00787686/697) → records under y2019. Lesson: when a search comes
  up empty, check the dataset coverage list BEFORE concluding "not in the files" — a whole
  dataset can be missing. Also: ~98% of DOJ image PDFs already carry a text layer; try
  `pdftotext` before OCR.
- 2026-06-12 /efta topic-search regenerated over the full 1.05M-doc corpus. The 8 auto topic
  pages (`topic_search` kind) had been built 2026-05-28 against the pre-DS9 ~520K corpus; re-ran
  `portadoc/.venv/bin/python scripts/efta/topic_grep.py ~/data/epstein-files/work/corpus.jsonl
  ~/data/epstein-files/work/topics_full` then spliced the fresh pages into both `efta/findings.json`
  (deployed) and `drafts/efta/findings-full.json` (curate input) by topic name. Counts ~2-3×ed
  (WW3 160→373, Pandemic 981→4220, Pedophilia 5061→15599). Two gotchas that make a corpus refresh
  incomplete on its own: (1) DS9 rows carry `dataset_9`, which had NO entry in `efta.js`
  `DATASET_BUCKET` → fell to the unshown `'other'` bucket → every DS9 match was invisible. Fixed by
  adding `dataset_9:'ds9'` + a "DS9 documents" filter chip (default on; DS10/financial stays off).
  Any future dataset needs both a bucket-map entry AND a chip or its rows silently vanish.
  (2) New rows referenced ~2,700 DS9/DS10 doc-ids with no `efta/docs/<id>.json` snippet → viewer
  links 404. Regenerate snippets after any topic/findings refresh:
  `build_doc_snippets.py corpus.jsonl efta/findings.json <out> efta/messages.json`. Hand-curated
  topic pages (Blood transfusion) are NOT in topic_grep's TOPICS list — splice by name and leave
  them untouched. Multi-agent note: another agent's `git add` swept my in-progress `efta.js` edit
  into their commit mid-task — verify your own uncommitted edits survived before relying on them.
