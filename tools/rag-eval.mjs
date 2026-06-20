// tools/rag-eval.mjs
//
//   node tools/rag-eval.mjs
//
// Regression gate for the timeline RAG index. Runs every fixture in
// rag-fixtures.json through the SAME query-embed + score pipeline rag.js uses,
// and asserts: (a) the expected record is within top-K by best-sentence score,
// and (b) the highest-scoring sentence for that record contains the expected
// substring. Exits non-zero on any failure. Prints a rank table for tuning.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from '@huggingface/transformers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EVID = path.join(ROOT, 'sources', 'evidence');

const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'rag-index.json'), 'utf8'));
const { fixtures, topK } = JSON.parse(fs.readFileSync(path.join(__dirname, 'rag-fixtures.json'), 'utf8'));

// id -> { claim, sources } (to resolve which sentence/quote won)
const recById = new Map();
for (const f of fs.readdirSync(EVID)) {
    if (!f.endsWith('.json') || f === 'manifest.json') continue;
    try { const r = JSON.parse(fs.readFileSync(path.join(EVID, f), 'utf8')); if (r.id) recById.set(r.id, r); }
    catch { /* ignore */ }
}
// resolve a unit's source text (claim string or the relevant source quote)
function unitText(u) {
    const r = recById.get(u.id);
    if (!r) return '';
    const base = u.field === 'quote' ? (r.sources?.[u.srcIdx]?.quote || '') : (r.claim || '');
    return base.slice(u.start, u.end);
}

// pre-dequantize unit vectors and precompute their norms
const scale = index.scale;
const units = index.units.map((u) => {
    const v = new Float32Array(u.vec.length);
    let n = 0;
    for (let i = 0; i < u.vec.length; i++) { const x = u.vec[i] * scale; v[i] = x; n += x * x; }
    return { id: u.id, field: u.field, srcIdx: u.srcIdx, start: u.start, end: u.end, v, norm: Math.sqrt(n) || 1 };
});

function cosineScores(qvec) {
    // qvec is mean-pooled + L2-normalized (|qvec| = 1)
    return units.map((u) => {
        let dot = 0;
        for (let i = 0; i < qvec.length; i++) dot += qvec[i] * u.v[i];
        return dot / u.norm;
    });
}

function rankRecords(scores) {
    // best-sentence (max-pool) per record, plus the winning unit
    const best = new Map(); // id -> {score, unitIdx}
    for (let i = 0; i < units.length; i++) {
        const id = units[i].id, s = scores[i];
        const cur = best.get(id);
        if (!cur || s > cur.score) best.set(id, { score: s, unitIdx: i });
    }
    return [...best.entries()].map(([id, b]) => ({ id, ...b })).sort((a, b) => b.score - a.score);
}

const extractor = await pipeline('feature-extraction', index.model, { dtype: 'q8' });
async function embed(text) {
    const out = await extractor([text], { pooling: 'mean', normalize: true });
    return Array.from(out.data); // already L2-normalized
}

let pass = 0;
console.log(`\nRAG eval — ${fixtures.length} fixtures, top-${topK}, model ${index.model}\n` + '='.repeat(72));
for (const fx of fixtures) {
    const qvec = await embed(fx.q);
    const ranked = rankRecords(cosineScores(qvec));
    const rank = ranked.findIndex((r) => r.id === fx.expectTopId);
    const within = rank >= 0 && rank < topK;

    // winning sentence for the expected record
    let sentOk = false, wonSent = '(record not retrieved)';
    const recEntry = ranked.find((r) => r.id === fx.expectTopId);
    if (recEntry) {
        const u = units[recEntry.unitIdx];
        wonSent = `${u.field === 'quote' ? '[quote] ' : ''}${unitText(u)}`;
        sentOk = wonSent.toLowerCase().includes(fx.expectSentence.toLowerCase());
    }
    const ok = within && sentOk;
    if (ok) pass++;

    console.log(`\n${ok ? '✅' : '❌'}  "${fx.q}"`);
    console.log(`    expect ${fx.expectTopId} in top-${topK} → rank ${rank < 0 ? '—' : rank + 1} ${within ? 'OK' : 'MISS'} (score ${recEntry ? recEntry.score.toFixed(3) : '—'})`);
    console.log(`    expect sentence ⊇ "${fx.expectSentence}" → ${sentOk ? 'OK' : 'MISS'}`);
    console.log(`    won sentence: ${wonSent.slice(0, 90)}${wonSent.length > 90 ? '…' : ''}`);
    console.log(`    top 3: ${ranked.slice(0, 3).map((r) => `${r.id}(${r.score.toFixed(2)})`).join('  ')}`);
}
console.log('\n' + '='.repeat(72));
console.log(`${pass}/${fixtures.length} fixtures pass\n`);
process.exit(pass === fixtures.length ? 0 : 1);
