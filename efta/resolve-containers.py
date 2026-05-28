#!/usr/bin/env python3
"""Resolve estate container doc-ids to the real Bates page that holds each hit.

Background
----------
The estate dataset was ingested two ways. Most of it is per-document records
(HOUSE_OVERSIGHT_<bates>), but two 2000-page House-Oversight scans were also
ingested whole, as single records with the bare ids "001" and "003":

    001  ->  HOUSE_OVERSIGHT_010477 .. 012476   (6.4M chars OCR)
    003  ->  HOUSE_OVERSIGHT_014477 .. 016476   (5.9M chars OCR)

Every hit found inside those blobs was labelled with the container id. In the
viewer, clicking "003" opened the container's first ~5KB snippet (a finance
table) — never the page the hit was actually on. The id printed in the result
("003") therefore disagreed with the Bates stamp printed inside the context.

Fix
---
Each container's OCR text carries its sequential `HOUSE_OVERSIGHT_<bates>` page
stamps. So a hit maps deterministically to its real page: find the hit's
context inside the container text, take the most recent stamp before it. That
page id replaces the container id, and a per-page doc snippet is written so the
viewer shows the actual page.

Scope: the published deck only (the curate.mjs KEEP set). Reads the full
container text from the local corpus (gitignored, not in the repo). Rewrites
drafts/efta/findings-full.json in place and writes new efta/docs/<page>.json
snippets. Run `node efta/curate.mjs` afterwards to rebuild findings.json.

Idempotent: refs already pointing at a real page are skipped; existing doc
snippets are never overwritten.

    python3 efta/resolve-containers.py
"""

import bisect
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = "/home/wabbazzar/data/epstein-files/work/corpus.jsonl"
FINDINGS_FULL = os.path.join(ROOT, "drafts/efta/findings-full.json")
DOCS_DIR = os.path.join(ROOT, "efta/docs")

CONTAINER_RE = re.compile(r"^\d{1,4}$")          # bare numeric id == whole-PDF container
STAMP_RE = re.compile(r"HOUSE_OVERSIGHT_(\d+)")
NORM_RE = re.compile(r"[^a-z0-9]+")
DOC_TEXT_CAP = 5000

# Kinds curate.mjs publishes, with its page caps. Only these get rewritten.
KEEP_CAPS = {
    "person_dossier": None, "names_top20": None, "names_grep": None,
    "topic_search": None, "verbatim_quote": None, "press_recreate": None,
    "codeword_top": None, "doc_dates_year": None, "mention_dates_year": None,
    "cooccur_pairs": 1,
}


def norm(s):
    return NORM_RE.sub(" ", s.lower()).strip()


def load_containers():
    """Pull the whole-PDF container records out of the 2GB corpus stream."""
    out = {}
    if not os.path.exists(CORPUS):
        sys.exit(f"corpus not found: {CORPUS}\n(the full container text is local-only, not in the repo)")
    with open(CORPUS, encoding="utf-8") as f:
        for line in f:
            if '"001"' not in line and '"003"' not in line:
                continue
            try:
                r = json.loads(line)
            except json.JSONDecodeError:
                continue
            rid = str(r.get("id"))
            if rid in ("001", "003") and r.get("dataset") == "estate":
                out[rid] = r["text"]
            if len(out) == 2:
                break
    return out


def build_index(text):
    """Normalised page index + raw per-page slices, keyed by Bates page id.

    Returns (joined_norm, starts, ids, raw_by_id): `joined_norm` is the page
    texts normalised and space-joined; `starts[i]`/`ids[i]` give the offset and
    page id of each page within it; `raw_by_id` is the verbatim slice per page.
    """
    parts = list(STAMP_RE.finditer(text))
    chunks, starts, ids, raw_by_id = [], [], [], {}
    acc = 0
    for i, m in enumerate(parts):
        s = m.start()
        e = parts[i + 1].start() if i + 1 < len(parts) else len(text)
        page_id = "HOUSE_OVERSIGHT_" + m.group(1)
        nc = norm(text[s:e])
        starts.append(acc)
        ids.append(page_id)
        chunks.append(nc)
        acc += len(nc) + 1
        raw_by_id.setdefault(page_id, text[s:e].strip())
    return " ".join(chunks), starts, ids, raw_by_id


def page_at(idx, pos):
    starts, ids = idx[1], idx[2]
    j = bisect.bisect_right(starts, pos) - 1
    return ids[j] if 0 <= j < len(ids) else None


def resolve_context(idx, ctx):
    """Locate a hit's context in the container; return its Bates page id."""
    joined = idx[0]
    nc = norm(ctx)
    for sl in (nc[20:140], nc[20:80], nc[:90], nc[:50]):
        if not sl:
            continue
        pos = joined.find(sl)
        if pos != -1:
            return page_at(idx, pos)
    return None


def resolve_term(idx, terms):
    """Find any of `terms` (canonical + OCR variants) in the container; return
    the page of the first hit. Names often live in the scan only under an OCR
    variant (e.g. Rabin -> "Robin"/"Rubin"), so the canonical spelling alone
    misses them."""
    joined = idx[0]
    for term in terms:
        nt = norm(term)
        if not nt:
            continue
        pos = joined.find(nt)
        if pos == -1 and " " in nt:
            pos = joined.find(nt.split(" ")[0])
        if pos != -1:
            return page_at(idx, pos)
    return None


def main():
    containers = load_containers()
    idx = {cid: build_index(text) for cid, text in containers.items()}
    have = {f[:-5] for f in os.listdir(DOCS_DIR) if f.endswith(".json")}

    with open(FINDINGS_FULL, encoding="utf-8") as f:
        full = json.load(f)

    targets = set()          # real page ids we rewrote refs to
    rewrites = 0
    unresolved = 0
    examples = []
    kept_counts = {}

    for page in full["pages"]:
        kind = page.get("kind")
        if kind not in KEEP_CAPS:
            continue
        cap = KEEP_CAPS[kind]
        n = kept_counts.get(kind, 0)
        if cap is not None and n >= cap:
            continue                      # beyond curate's cap -> not published
        kept_counts[kind] = n + 1

        for row in page.get("rows", []):
            # rows / samples carrying a verbatim context -> exact page
            ctx_refs = []
            if CONTAINER_RE.match(str(row.get("doc_id", ""))) and (row.get("context") or row.get("quote")):
                ctx_refs.append(("row", row, row.get("context") or row.get("quote")))
            for s in row.get("samples", []) or []:
                if CONTAINER_RE.match(str(s.get("doc_id", ""))) and s.get("context"):
                    ctx_refs.append(("sample", s, s["context"]))
            for _, obj, ctx in ctx_refs:
                cid = str(obj["doc_id"])
                page_id = resolve_context(idx[cid], ctx)
                if not page_id:
                    unresolved += 1
                    continue
                obj["doc_id"] = page_id
                targets.add(page_id)
                rewrites += 1
                if len(examples) < 6:
                    examples.append((cid, page_id, ctx[:48]))

            # sample_doc_ids[] (no per-hit context) -> page of the row's term.
            # A container chip that can't be located by term or variant is a
            # meaningless link; drop it rather than leave it pointing nowhere.
            sids = row.get("sample_doc_ids")
            if sids and any(CONTAINER_RE.match(str(x)) for x in sids):
                terms = [row.get("text", "")] + list(row.get("ocr_variants", []) or [])
                new_sids = []
                for x in sids:
                    if not CONTAINER_RE.match(str(x)):
                        new_sids.append(x)
                        continue
                    page_id = resolve_term(idx[str(x)], terms)
                    if not page_id:
                        unresolved += 1
                        continue            # drop the dead container chip
                    new_sids.append(page_id)
                    targets.add(page_id)
                    rewrites += 1
                row["sample_doc_ids"] = new_sids

    # Emit a per-page snippet for every resolved page that lacks one.
    created = 0
    for cid, ix in idx.items():
        raw_by_id = ix[3]
        for page_id in targets:
            if page_id in have or page_id not in raw_by_id:
                continue
            text = raw_by_id[page_id]
            doc = {
                "id": page_id,
                "dataset": "estate",
                "n_chars": len(text),
                "n_words": len(text.split()),
                "text": (text[:DOC_TEXT_CAP].rstrip() + "…") if len(text) > DOC_TEXT_CAP else text,
                "source": f"/home/wabbazzar/data/epstein-files/raw/estate/pdfs/{cid}.pdf "
                          f"(Bates {page_id.split('_')[-1]}, split from whole-PDF container)",
            }
            with open(os.path.join(DOCS_DIR, page_id + ".json"), "w", encoding="utf-8") as f:
                json.dump(doc, f, ensure_ascii=False)
            have.add(page_id)
            created += 1

    with open(FINDINGS_FULL, "w", encoding="utf-8") as f:
        json.dump(full, f, ensure_ascii=False, indent=2)

    print(f"container refs rewritten : {rewrites}")
    print(f"unresolved (left as-is)  : {unresolved}")
    print(f"distinct real pages      : {len(targets)}")
    print(f"doc snippets created     : {created} (reused {len(targets) - created} existing)")
    print("examples (container -> page):")
    for cid, pid, ctx in examples:
        print(f"  {cid} -> {pid}   {ctx!r}")


if __name__ == "__main__":
    main()
