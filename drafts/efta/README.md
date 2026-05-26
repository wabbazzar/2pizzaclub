# /efta/ curation

The published `/efta/` deck is a curated subset of the analysis pipeline's full
output. This directory documents what was retired and how to rebuild.

## What's published (`efta/findings.json`)

24 finding pages (plus 4 intro slides injected by `efta.js`):

- **The deep read** — 12 document-level findings from a full read of the House
  Oversight estate release (`efta/deepread.json`; every quote verified verbatim
  against its source file before publishing)
- Person dossiers · top names (NER + curated grep) · topic searches
- Verbatim press-quote recreations · press-cited terms · code-language counts
- Doc-date and mention-date histograms · one page of co-occurrence pairs

Plus a searchable **messages** page (`efta/messages.html`) holding the 1,200
recovered iMessages and 20 reconstructed email threads.

## What was retired (110 pages, not published)

| Kind | Pages | Reason |
|---|---|---|
| `label_top` | 64 | Raw NER "PII" dumps (CITY/STREET/SSN/DOB/card/etc.) — unanalyzed, mostly OCR noise, not worth serving |
| `ds10_financial` | 22 | Raw wire/account/dollar extractions with no analysis layer |
| `ngram` | 15 | Raw doc-spread n-gram frequency tables |
| `tfidf` | 9 | Raw TF-IDF n-gram tables |

The interesting hits from these surfaces already appear on the published deck
(press-cited terms, code-language, verbatim quotes).

## Rebuild

The pipeline lives outside the repo (`~/data/epstein-files/`). After it
regenerates the full findings:

```bash
cp <pipeline-out>/findings.json drafts/efta/findings-full.json   # local only (gitignored)
node efta/curate.mjs                                              # → efta/findings.json + efta/messages.json
```

The cut is defined in `efta/curate.mjs` (the `KEEP` / `MOVE` lists). The full
156-page input is **not** committed: the repo is public, the retired NER pages
carry raw scraped identifiers, and the file is recoverable from git history (the
`efta/findings.json` committed immediately before curation).
