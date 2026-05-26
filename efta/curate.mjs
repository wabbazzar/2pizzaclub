// Curate the full pipeline output into the published /efta/ deck.
//
// Inputs:
//   drafts/efta/findings-full.json  — the complete pipeline output (source of truth, NOT served)
//   efta/deepread.json              — hand-authored deep-read findings page
// Outputs:
//   efta/findings.json   — the curated, published deck (~24 pages + 4 JS intro slides)
//   efta/messages.json   — iMessages + reconstructed email threads, for the search page
//
// Everything not in KEEP and not in MOVE is retired: it stays in
// drafts/efta/findings-full.json but is never published. Re-run after the
// pipeline regenerates the full file:  node efta/curate.mjs
//
// The cut, in one place. Order here is the published page order.

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FULL = JSON.parse(fs.readFileSync(path.join(ROOT, 'drafts/efta/findings-full.json'), 'utf8'));
const DEEP = JSON.parse(fs.readFileSync(path.join(ROOT, 'efta/deepread.json'), 'utf8'));

// Kinds kept on the published deck, in display order, with an optional page cap.
const KEEP = [
  ['person_dossier',     Infinity], // analysed: samples, year-sparklines, wiki portraits
  ['names_top20',        Infinity], // NER discovery
  ['names_grep',         Infinity], // curated grep cross-check
  ['topic_search',       Infinity], // WW3, simulation, pandemic, sacrifice, ritual, …
  ['verbatim_quote',     Infinity], // press-finding recreations (verbatim, with doc IDs)
  ['press_recreate',     Infinity], // journalist-cited terms recreated at scale
  ['codeword_top',       Infinity], // documented code-language counts
  ['doc_dates_year',     Infinity], // when each doc was written
  ['mention_dates_year', Infinity], // years referenced in bodies
  ['cooccur_pairs',      1],        // one page of the strongest co-occurrence pairs
];

// Kinds pulled out of the deck and onto the searchable messages page.
const MOVE = new Set(['imessages', 'email_threads']);

// Everything else (label_top PII tables, ds10_financial, ngram, tfidf, email_top)
// is retired — preserved in drafts/efta/findings-full.json, never served.

const byKind = new Map();
for (const p of FULL.pages) {
  if (!byKind.has(p.kind)) byKind.set(p.kind, []);
  byKind.get(p.kind).push(p);
}

// --- Published deck -------------------------------------------------------
const pages = [DEEP.page];
const kept = { 'narrative_finding': 1 };
for (const [kind, cap] of KEEP) {
  const ps = byKind.get(kind) || [];
  const take = cap === Infinity ? ps : ps.slice(0, cap);
  pages.push(...take);
  kept[kind] = take.length;
}

const curated = {
  ...FULL,
  generated_at: new Date().toISOString(),
  curated: true,
  pages,
};
fs.writeFileSync(path.join(ROOT, 'efta/findings.json'), JSON.stringify(curated));

// --- Searchable messages page data ---------------------------------------
const imessages = (byKind.get('imessages') || []).flatMap(p => p.rows || []);
const threads   = (byKind.get('email_threads') || []).flatMap(p => p.rows || []);
const messages = {
  generated_at: new Date().toISOString(),
  corpus: FULL.corpus,
  imessages,
  threads,
};
fs.writeFileSync(path.join(ROOT, 'efta/messages.json'), JSON.stringify(messages));

// --- Report ---------------------------------------------------------------
const retired = FULL.pages.filter(p => !KEEP.some(([k]) => k === p.kind) && !MOVE.has(p.kind));
const retiredByKind = {};
for (const p of retired) retiredByKind[p.kind] = (retiredByKind[p.kind] || 0) + 1;
console.log(`published deck: ${pages.length} pages`, kept);
console.log(`messages page: ${imessages.length} iMessages, ${threads.length} threads`);
console.log(`retired to drafts: ${retired.length} pages`, retiredByKind);
