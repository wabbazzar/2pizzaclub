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
| House Oversight estate text | `raw/estate/text_only/HOUSE_OVERSIGHT_*.txt` | **647 docs, text-ready** — the richest narrative/email slice |
| DOJ DS8 (pre-OCR'd) | `raw/dataset_8/*_djvu.xml` | ~10,487 docs, police-report era |
| DOJ DS10 ("financial") | `extracted/dataset_10/VOL00010/` | 503,154 PDFs. **Mislabelled: a 50-doc random sample is ~60% EMAIL, ~22% financial statements, 0 iMessage** (heavy OCR damage — `@`→`©`, `.com`→`.corn`). The biggest unread Epstein *email* trove. Load file (`DATA/VOL00010.DAT`) carries only Begin/End Bates — no email metadata, so content must be read, not queried. Only grep'd for financial signals so far. |
| DS11/DS12 emails | `extracted/dataset_11,12/` | text-extracted, 2017 ops |
| Parsed email corpus | `emails/txt/` + `INDEX.csv` | 194 emails |
| Estate bundles 002, 004–012 | not downloaded | **~20K of ~24K bates pages unpulled.** The 647-doc sample we have is 72% email + 25 iMessage forensic exports + court/news — the bundles are the same mix, i.e. the only source of *more iMessages* |
| Pipeline output | `work/findings.json`, `work/corpus*.jsonl` | feeds the statistical layer |
| Living work log | `WORK_LOG.md` | **read before any pipeline work — documents what's been tried + what failed** |

Already-extracted convenience data in THIS repo: `efta/messages.json` (1,200
iMessages + 20 email threads, parsed) and `efta/docs/*.json` (doc-viewer
snippets). Prefer these compact files over re-reading raw docs when they cover
the question.

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
