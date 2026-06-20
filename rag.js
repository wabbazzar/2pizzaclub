// rag.js — sentence-level semantic search for the timeline search bar (prototype)
//
// Listens for `receipts:query` (dispatched by search.js on every keystroke).
// Lazily loads transformers.js + rag-index.json on first real query, embeds the
// query with all-MiniLM-L6-v2 (same model the index was built with), scores it
// against the precomputed sentence vectors, and renders a ranked results panel
// under the theme bar. Each result shows the claim with TWO highlight layers:
//   • semantic  — sentences tinted by cosine score (.rag-sent, mustard)
//   • keyword   — query terms marked (mark.search-mark, dusty red), reused style
//
// Scope: timeline evidence records only (no EFTA). The existing lexical filter in
// search.js keeps working untouched; this adds a parallel semantic surface.

(function () {
    'use strict';

    const TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';

    const MIN_QUERY_LEN = 3;
    const DEBOUNCE_MS = 220;
    const TOP_N = 8;          // results shown
    const TINT_FLOOR = 0.30;  // sentences below this cosine are not tinted
    const STOP = new Set(['the', 'and', 'for', 'was', 'were', 'are', 'has', 'had', 'have', 'who',
        'how', 'what', 'when', 'why', 'with', 'that', 'this', 'from', 'into', 'over', 'did', 'does',
        'his', 'her', 'its', 'their', 'they', 'them', 'about', 'much', 'many', 'been']);

    let extractor = null;          // transformers feature-extraction pipeline
    let units = null;              // [{id, start, end, v:Float32Array, norm}]
    let claimById = null;          // id -> raw claim text
    let metaById = null;           // id -> {anchor, year, title}
    let loadPromise = null;
    let debounceTimer = null;
    let lastQuery = '';

    // ---------- utils ----------

    function esc(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }

    function queryTokens(q) {
        return q.toLowerCase().split(/[^a-z0-9$]+/i)
            .filter((t) => t.length >= 3 && !STOP.has(t));
    }

    // ---------- lazy load (model + index + claim text) ----------

    function panel() {
        let p = document.getElementById('rag-results');
        if (p) return p;
        p = document.createElement('section');
        p.id = 'rag-results';
        p.className = 'rag-results';
        p.hidden = true;
        p.innerHTML = `<div class="rag-results-inner">
            <p class="rag-head"><span class="rag-head-label">// CLOSEST MATCHES</span><span class="rag-status"></span></p>
            <div class="rag-list"></div></div>`;
        const bar = document.getElementById('theme-bar');
        if (bar && bar.parentNode) bar.parentNode.insertBefore(p, bar.nextSibling);
        else document.body.insertBefore(p, document.body.firstChild);
        return p;
    }

    function setStatus(text) {
        const s = panel().querySelector('.rag-status');
        if (s) s.textContent = text || '';
    }

    async function ensureLoaded() {
        if (units && extractor) return;
        if (loadPromise) return loadPromise;
        loadPromise = (async () => {
            setStatus('loading model…');
            panel().hidden = false;
            const [idx] = await Promise.all([
                fetch('rag-index.json', { cache: 'force-cache' }).then((r) => r.json()),
                (async () => {
                    const { pipeline } = await import(TRANSFORMERS_CDN);
                    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
                })(),
            ]);
            const scale = idx.scale;
            units = idx.units.map((u) => {
                const v = new Float32Array(u.vec.length);
                let n = 0;
                for (let i = 0; i < u.vec.length; i++) { const x = u.vec[i] * scale; v[i] = x; n += x * x; }
                return { id: u.id, start: u.start, end: u.end, v, norm: Math.sqrt(n) || 1 };
            });
            // claim text + meta from the runtime DAG (same source search.js uses)
            claimById = new Map();
            metaById = new Map();
            const dag = window.RECEIPTS_DAG;
            if (dag) {
                for (const node of dag.nodes) {
                    if (node.type !== 'claim') continue;
                    const id = node.id.replace(/^claim:/, '');
                    claimById.set(id, node.claim || '');
                    const ch = document.querySelector(`.chapter[data-anchor="${node.anchor}"]`);
                    metaById.set(id, {
                        anchor: node.anchor,
                        year: ch?.dataset.year || node.year || '',
                        title: ch?.querySelector('h3')?.textContent?.trim() || node.anchor || '',
                    });
                }
            }
            setStatus('');
        })();
        return loadPromise;
    }

    // ---------- embed + score ----------

    async function embed(text) {
        const out = await extractor([text], { pooling: 'mean', normalize: true });
        return out.data; // Float32Array, L2-normalized
    }

    function scoreRecords(qvec) {
        // per-record: best sentence score + every sentence's {start,end,score}
        const byId = new Map();
        for (const u of units) {
            let dot = 0;
            for (let i = 0; i < qvec.length; i++) dot += qvec[i] * u.v[i];
            const score = dot / u.norm;
            let rec = byId.get(u.id);
            if (!rec) { rec = { id: u.id, best: -1, sents: [] }; byId.set(u.id, rec); }
            rec.sents.push({ start: u.start, end: u.end, score });
            if (score > rec.best) rec.best = score;
        }
        return [...byId.values()].sort((a, b) => b.best - a.best).slice(0, TOP_N);
    }

    // ---------- highlight (semantic tint + keyword mark, one offset pass) ----------

    function markTokens(text, tokens) {
        if (!tokens.length) return esc(text);
        const lower = text.toLowerCase();
        const ranges = [];
        for (const t of tokens) {
            let from = 0;
            for (;;) { const i = lower.indexOf(t, from); if (i < 0) break; ranges.push([i, i + t.length]); from = i + t.length; }
        }
        if (!ranges.length) return esc(text);
        ranges.sort((a, b) => a[0] - b[0]);
        const merged = [];
        for (const r of ranges) {
            const last = merged[merged.length - 1];
            if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
            else merged.push([r[0], r[1]]);
        }
        let out = '', cur = 0;
        for (const [a, b] of merged) {
            out += esc(text.slice(cur, a)) + `<mark class="search-mark">${esc(text.slice(a, b))}</mark>`;
            cur = b;
        }
        return out + esc(text.slice(cur));
    }

    function renderClaim(claim, sents, tokens) {
        const sorted = [...sents].sort((a, b) => a.start - b.start);
        const best = Math.max(TINT_FLOOR + 1e-3, ...sents.map((s) => s.score));
        const segs = [];
        let cur = 0;
        for (const s of sorted) {
            if (s.start > cur) segs.push({ start: cur, end: s.start, tint: 0 });
            const tint = s.score >= TINT_FLOOR ? clamp((s.score - TINT_FLOOR) / (best - TINT_FLOOR), 0, 1) : 0;
            segs.push({ start: s.start, end: s.end, tint, score: s.score });
            cur = Math.max(cur, s.end);
        }
        if (cur < claim.length) segs.push({ start: cur, end: claim.length, tint: 0 });
        return segs.map((seg) => {
            const inner = markTokens(claim.slice(seg.start, seg.end), tokens);
            if (seg.tint > 0) {
                const alpha = (0.10 + 0.42 * seg.tint).toFixed(3);
                return `<span class="rag-sent" style="--rag-a:${alpha}" title="match ${seg.score.toFixed(2)}">${inner}</span>`;
            }
            return inner;
        }).join('');
    }

    // ---------- render panel ----------

    function render(results, tokens) {
        const p = panel();
        const list = p.querySelector('.rag-list');
        if (!results.length) { list.innerHTML = `<p class="rag-empty">no close matches</p>`; p.hidden = false; return; }
        list.innerHTML = results.map((r) => {
            const claim = claimById.get(r.id) || '';
            const m = metaById.get(r.id) || { anchor: '', year: '', title: r.id };
            return `<article class="rag-card">
                <div class="rag-card-head">
                    <a class="rag-jump" href="#${esc(m.anchor)}"><span class="rag-year">${esc(m.year)}</span><span class="rag-title">${esc(m.title)}</span></a>
                    <span class="rag-score" title="best sentence cosine">${r.best.toFixed(2)}</span>
                </div>
                <p class="rag-claim">${renderClaim(claim, r.sents, tokens)}</p>
            </article>`;
        }).join('');
        p.hidden = false;
    }

    // ---------- entry ----------

    async function run(q) {
        const query = (q || '').trim();
        lastQuery = query;
        if (query.length < MIN_QUERY_LEN) { const p = document.getElementById('rag-results'); if (p) p.hidden = true; return; }
        try {
            await ensureLoaded();
            if (lastQuery !== query) return; // superseded while loading
            const qvec = await embed(query);
            if (lastQuery !== query) return;
            const results = scoreRecords(qvec);
            render(results, queryTokens(query));
        } catch (e) {
            console.warn('[rag]', e);
            setStatus('search unavailable');
        }
    }

    document.addEventListener('receipts:query', (e) => {
        const q = e.detail?.q ?? '';
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => run(q), DEBOUNCE_MS);
    });
})();
