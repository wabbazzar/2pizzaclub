// tools/build-rag-index.mjs
//
// Build the sentence-level RAG index for the timeline search bar.
//
//   node tools/build-rag-index.mjs
//
// Reads every evidence record listed in sources/evidence/manifest.json, splits
// each `claim` into sentences (with character offsets), embeds each sentence
// with all-MiniLM-L6-v2 (384-dim), int8-quantizes the vectors, and writes
// ../rag-index.json.
//
// The index does NOT duplicate claim text — the runtime (rag.js) reads claim
// strings from window.RECEIPTS_DAG, the same source search.js uses. The offsets
// stored here index into the *raw* claim string, so the runtime can re-render
// `.evidence-claim` with sentence-tint + keyword-mark highlighting in one pass.
//
// Sentences are embedded context-augmented ("[<year> · <chapter title>]
// <sentence>") so isolated sentences keep their referents, but the stored
// offsets cover the bare sentence only.
//
// node_modules here is build-only and gitignored; rag-index.json ships.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from '@huggingface/transformers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EVID = path.join(ROOT, 'sources', 'evidence');
const OUT = path.join(ROOT, 'rag-index.json');

const MODEL = 'Xenova/all-MiniLM-L6-v2';
const DTYPE = 'q8';     // quantized — matches the self-hosted browser model (parity + lean ship)
const DIMS = 384;
const MIN_SENT_LEN = 3; // skip whitespace/punctuation-only fragments

// ---- chapter titles (for context-augmented embeddings) from index.html ----
function loadChapterTitles() {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const re = /id="(y[^"]+)"[^>]*data-year="([^"]*)"[^>]*>\s*<header><span class="year">[^<]*<\/span><h3>([^<]+)<\/h3>/g;
    const map = {};
    let m;
    while ((m = re.exec(html))) map[m[1]] = { year: m[2], title: m[3] };
    return map;
}

const seg = new Intl.Segmenter('en', { granularity: 'sentence' });

// Length-preserving abbreviation mask: replace the PERIOD inside common
// abbreviations / initials with a one-dot-leader (U+2024, same width) so
// Intl.Segmenter doesn't treat it as a sentence break. Offsets are preserved
// (1 char -> 1 char), and we always slice the ORIGINAL text for output, so the
// real periods survive in the stored sentence. Fixes "U.S. | Military" splits.
const DOT = '․';
const MULTI = /\b(U\.S\.A|U\.S|U\.N|U\.K|U\.S\.S\.R|D\.C|Ph\.D|a\.m|p\.m|e\.g|i\.e|Dr|Mr|Mrs|Ms|Jr|Sr|St|Inc|Corp|Co|Ltd|No|vs|etc|Gen|Sen|Rep|Gov|Pres|Lt|Sgt|Col|Adm|Capt|Maj|Brig|Rev|approx|Vol|Fig|pp)\./g;
function maskAbbrev(t) {
    // single capital initials (J. F. Kennedy, U.S.) — \b ensures we don't catch
    // sentence-final ALLCAPS like "the FBI." (the I has no preceding word boundary)
    let m = t.replace(/\b([A-Z])\./g, '$1' + DOT);
    // multi-letter abbreviations (re-mask any internal dots already turned, plus the trailing one)
    m = m.replace(MULTI, (s) => s.replace(/\./g, DOT));
    return m;
}

function splitSentences(text) {
    const masked = maskAbbrev(text); // same length as text
    const out = [];
    for (const s of seg.segment(masked)) {
        const raw = text.slice(s.index, s.index + s.segment.length); // ORIGINAL text, real periods
        const trimmed = raw.trim();
        if (trimmed.length < MIN_SENT_LEN) continue;
        const lead = raw.length - raw.trimStart().length;
        const start = s.index + lead;
        const end = start + trimmed.length;
        out.push({ text: trimmed, start, end });
    }
    return out;
}

// int8 symmetric quantization over a batch; one shared scale keeps dot-products comparable
function quantizeInt8(vectors) {
    let absMax = 0;
    for (const v of vectors) for (const x of v) { const a = Math.abs(x); if (a > absMax) absMax = a; }
    const scale = absMax / 127 || 1;
    const q = vectors.map((v) => Array.from(v, (x) => Math.max(-127, Math.min(127, Math.round(x / scale)))));
    return { scale, q };
}

async function main() {
    const titles = loadChapterTitles();
    const manifest = JSON.parse(fs.readFileSync(path.join(EVID, 'manifest.json'), 'utf8'));
    const files = manifest.records || [];
    console.log(`[rag] ${files.length} records in manifest`);

    console.log(`[rag] loading ${MODEL} (${DTYPE}) …`);
    const extractor = await pipeline('feature-extraction', MODEL, { dtype: DTYPE });

    const inputs = [];   // strings to embed (context-augmented)
    const units = [];    // {id, field, srcIdx?, start, end} parallel to inputs

    for (const file of files) {
        let rec;
        try { rec = JSON.parse(fs.readFileSync(path.join(EVID, file), 'utf8')); }
        catch (e) { console.warn('[rag] skip', file, e.message); continue; }
        const claim = rec.claim || '';
        if (!claim) continue;
        const ctx = titles[rec.anchor] || { year: rec.year || '', title: '' };
        const prefix = `[${ctx.year}${ctx.title ? ' · ' + ctx.title : ''}] `;
        // claim sentences (offsets index into the claim string)
        for (const sent of splitSentences(claim)) {
            inputs.push(prefix + sent.text);
            units.push({ id: rec.id, field: 'claim', start: sent.start, end: sent.end });
        }
        // source-quote sentences (offsets index into that source's quote string)
        const sources = rec.sources || [];
        for (let i = 0; i < sources.length; i++) {
            const q = sources[i].quote;
            if (!q) continue;
            for (const sent of splitSentences(q)) {
                inputs.push(prefix + sent.text);
                units.push({ id: rec.id, field: 'quote', srcIdx: i, start: sent.start, end: sent.end });
            }
        }
    }

    console.log(`[rag] embedding ${units.length} sentences …`);
    const vectors = [];
    const BATCH = 64;
    for (let i = 0; i < inputs.length; i += BATCH) {
        const batch = inputs.slice(i, i + BATCH);
        const out = await extractor(batch, { pooling: 'mean', normalize: true });
        // out is a Tensor [n, DIMS]; slice per row
        const data = out.data;
        const n = batch.length;
        for (let r = 0; r < n; r++) vectors.push(data.slice(r * DIMS, (r + 1) * DIMS));
        process.stdout.write(`\r[rag]   ${Math.min(i + BATCH, inputs.length)}/${inputs.length}`);
    }
    process.stdout.write('\n');

    const { scale, q } = quantizeInt8(vectors);
    for (let i = 0; i < units.length; i++) units[i].vec = q[i];

    const payload = {
        model: MODEL,
        dims: DIMS,
        quant: 'int8',
        scale,
        built: new Date().toISOString().slice(0, 10),
        count: units.length,
        units,
    };
    fs.writeFileSync(OUT, JSON.stringify(payload));
    const mb = (fs.statSync(OUT).size / 1e6).toFixed(2);
    console.log(`[rag] wrote ${OUT} — ${units.length} sentence vectors, ${mb} MB`);
}

main().catch((e) => { console.error(e); process.exit(1); });
