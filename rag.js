// rag.js — sentence-level semantic search for the timeline search bar
//
// Listens for `receipts:query` (dispatched by search.js on every keystroke).
// Lazily loads transformers.js (CDN) + the SELF-HOSTED MiniLM model (models/)
// + rag-index.json on first real query, embeds the query in-browser, scores it
// against precomputed claim- AND source-quote sentence vectors, and:
//   • renders a ranked "closest matches" panel under the theme bar, and
//   • on click, highlights the matched sentences IN PLACE in the timeline card
// with two composed layers:
//   • semantic — sentences tinted by cosine score (.rag-sent, navy)
//   • keyword  — query terms marked (mark.search-mark, yellow), reused style
//
// Durability: the embedding model is served from our own origin (models/), so
// the runtime never depends on the Hugging Face hub. Only the transformers.js
// library + onnxruntime WASM come from jsDelivr (npm-backed, reliable).
//
// Scope: timeline evidence records only (no EFTA). Desktop search bar; the
// existing lexical filter/keyword-highlight in search.js is untouched. On
// mobile the panel is hidden (the bottom-sheet keeps the lexical search).

(function () {
    'use strict';

    const CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
    const MODEL_ID = 'all-MiniLM-L6-v2';
    const MIN_QUERY_LEN = 3;
    const DEBOUNCE_MS = 220;
    const TOP_N = 8;          // records shown
    const TINT_FLOOR = 0.30;  // sentences below this cosine are not tinted
    const QUOTE_SHOW = 0.34;  // only surface a source quote if a sentence beats this
    const STOP = new Set(['the', 'and', 'for', 'was', 'were', 'are', 'has', 'had', 'have', 'who',
        'how', 'what', 'when', 'why', 'with', 'that', 'this', 'from', 'into', 'over', 'did', 'does',
        'his', 'her', 'its', 'their', 'they', 'them', 'about', 'much', 'many', 'been', 'would', 'could']);

    let extractor = null;          // transformers feature-extraction pipeline
    let units = null;              // [{id, field, srcIdx, start, end, v:Float32Array, norm}]
    let recData = null;            // id -> {claim, anchor, year, title, quotes:{srcIdx:{url,label,quote}}}
    let loadPromise = null;
    let debounceTimer = null;
    let lastQuery = '';
    let lastResults = null;         // current ranked results (for click-to-highlight)
    const litCards = new Set();     // cards currently highlighted in place
    const mqMobile = window.matchMedia('(max-width: 880px)');
    const isMobile = () => mqMobile.matches;

    // ---------- utils ----------

    function esc(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
    function queryTokens(q) {
        return q.toLowerCase().split(/[^a-z0-9$]+/i).filter((t) => t.length >= 3 && !STOP.has(t));
    }

    // ---------- panel ----------

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
        // click a result -> highlight the card in place + scroll to it
        p.addEventListener('click', (e) => {
            const jump = e.target.closest('.rag-jump');
            if (!jump) return;
            e.preventDefault();
            lightCard(jump.dataset.id, queryTokens(lastQuery));
        });
        return p;
    }
    function setStatus(t) { const s = panel().querySelector('.rag-status'); if (s) s.textContent = t || ''; }

    // ---------- lazy load (model + index + claim/quote text) ----------

    async function ensureLoaded() {
        if (units && extractor) return;
        if (loadPromise) return loadPromise;
        loadPromise = (async () => {
            setStatus('loading…');
            panel().hidden = false;
            const [idx] = await Promise.all([
                fetch('rag-index.json', { cache: 'force-cache' }).then((r) => r.json()),
                (async () => {
                    const { pipeline, env } = await import(CDN);
                    // serve the model from our own origin; never hit the HF hub
                    env.allowLocalModels = true;
                    env.allowRemoteModels = false;
                    env.localModelPath = new URL('models/', document.baseURI).href;
                    extractor = await pipeline('feature-extraction', MODEL_ID, { dtype: 'q8' });
                })(),
            ]);
            const scale = idx.scale;
            units = idx.units.map((u) => {
                const v = new Float32Array(u.vec.length);
                let n = 0;
                for (let i = 0; i < u.vec.length; i++) { const x = u.vec[i] * scale; v[i] = x; n += x * x; }
                return { id: u.id, field: u.field, srcIdx: u.srcIdx, start: u.start, end: u.end, v, norm: Math.sqrt(n) || 1 };
            });
            // claim + quote text + meta from the runtime DAG (same source search.js uses)
            recData = new Map();
            const dag = window.RECEIPTS_DAG;
            if (dag) {
                for (const node of dag.nodes) {
                    if (node.type === 'claim') {
                        const id = node.id.replace(/^claim:/, '');
                        const ch = document.querySelector(`.chapter[data-anchor="${node.anchor}"]`);
                        const rec = recData.get(id) || { quotes: {} };
                        rec.claim = node.claim || '';
                        rec.anchor = node.anchor;
                        rec.year = ch?.dataset.year || node.year || '';
                        rec.title = ch?.querySelector('h3')?.textContent?.trim() || node.anchor || '';
                        recData.set(id, rec);
                    } else if (node.type === 'source') {
                        const m = /^source:(.+)-(\d+)$/.exec(node.id);
                        if (!m) continue;
                        const rec = recData.get(m[1]) || { quotes: {} };
                        rec.quotes[+m[2]] = { url: node.url || '', label: node.label || '', quote: node.quote || '' };
                        recData.set(m[1], rec);
                    }
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
        const byId = new Map();
        for (const u of units) {
            let dot = 0;
            for (let i = 0; i < qvec.length; i++) dot += qvec[i] * u.v[i];
            const score = dot / u.norm;
            let rec = byId.get(u.id);
            if (!rec) { rec = { id: u.id, best: -1, bestUnit: null, claim: [], quotes: new Map() }; byId.set(u.id, rec); }
            if (score > rec.best) { rec.best = score; rec.bestUnit = { field: u.field, srcIdx: u.srcIdx, start: u.start, end: u.end, score }; }
            if (u.field === 'quote') {
                if (!rec.quotes.has(u.srcIdx)) rec.quotes.set(u.srcIdx, []);
                rec.quotes.get(u.srcIdx).push({ start: u.start, end: u.end, score });
            } else {
                rec.claim.push({ start: u.start, end: u.end, score });
            }
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
        for (const r of ranges) { const l = merged[merged.length - 1]; if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else merged.push([r[0], r[1]]); }
        let out = '', cur = 0;
        for (const [a, b] of merged) { out += esc(text.slice(cur, a)) + `<mark class="search-mark">${esc(text.slice(a, b))}</mark>`; cur = b; }
        return out + esc(text.slice(cur));
    }

    // generic offset highlighter over any text + its scored sentence ranges
    function renderSpans(text, sents, tokens) {
        if (!sents.length) return markTokens(text, tokens);
        const best = Math.max(TINT_FLOOR + 1e-3, ...sents.map((s) => s.score));
        const sorted = [...sents].sort((a, b) => a.start - b.start);
        const segs = [];
        let cur = 0;
        for (const s of sorted) {
            if (s.start > cur) segs.push({ start: cur, end: s.start, tint: 0 });
            const tint = s.score >= TINT_FLOOR ? clamp((s.score - TINT_FLOOR) / (best - TINT_FLOOR), 0, 1) : 0;
            segs.push({ start: s.start, end: s.end, tint, score: s.score });
            cur = Math.max(cur, s.end);
        }
        if (cur < text.length) segs.push({ start: cur, end: text.length, tint: 0 });
        return segs.map((seg) => {
            const inner = markTokens(text.slice(seg.start, seg.end), tokens);
            if (seg.tint > 0) {
                const alpha = (0.10 + 0.42 * seg.tint).toFixed(3);
                return `<span class="rag-sent" style="--rag-a:${alpha}" title="match ${seg.score.toFixed(2)}">${inner}</span>`;
            }
            return inner;
        }).join('');
    }

    // quote blocks for a result (only quotes with a sentence above QUOTE_SHOW)
    function quoteBlocks(r, rec, tokens, forPanel) {
        const out = [];
        for (const [srcIdx, sents] of r.quotes) {
            const best = Math.max(...sents.map((s) => s.score));
            if (best < QUOTE_SHOW) continue;
            const q = rec.quotes[srcIdx];
            if (!q || !q.quote) continue;
            out.push({ srcIdx, best, q, html: renderSpans(q.quote, sents, tokens) });
        }
        out.sort((a, b) => b.best - a.best);
        if (!forPanel) return out;
        return out.slice(0, 2).map((b) => {
            const link = b.q.url
                ? `<a class="rag-src-link" href="${esc(b.q.url)}" target="_blank" rel="noopener">${esc(b.q.label || b.q.url)} ↗</a>`
                : `<span class="rag-src-link">${esc(b.q.label || '')}</span>`;
            return `<blockquote class="rag-quote">${b.html}</blockquote>${link}`;
        }).join('');
    }

    // text of a single unit (claim sentence or source-quote sentence)
    function unitText(rec, u) {
        if (!u) return '';
        const base = u.field === 'quote' ? (rec.quotes[u.srcIdx]?.quote || '') : (rec.claim || '');
        return base.slice(u.start, u.end);
    }

    // ---------- render: dispatch by viewport ----------

    function render(results, tokens) {
        if (isMobile()) { const p = document.getElementById('rag-results'); if (p) p.hidden = true; renderMobile(results, tokens); }
        else { clearMobile(); renderDesktop(results, tokens); }
    }

    // ---------- desktop panel ----------

    function renderDesktop(results, tokens) {
        const p = panel();
        const list = p.querySelector('.rag-list');
        if (!results.length) { list.innerHTML = `<p class="rag-empty">no close matches</p>`; p.hidden = false; return; }
        list.innerHTML = results.map((r) => {
            const rec = recData.get(r.id) || { claim: '', anchor: '', year: '', title: r.id, quotes: {} };
            return `<article class="rag-card">
                <div class="rag-card-head">
                    <a class="rag-jump" href="#${esc(rec.anchor)}" data-id="${esc(r.id)}"><span class="rag-year">${esc(rec.year)}</span><span class="rag-title">${esc(rec.title)}</span></a>
                    <span class="rag-score" title="best sentence cosine">${r.best.toFixed(2)}</span>
                </div>
                <p class="rag-claim">${renderSpans(rec.claim, r.claim, tokens)}</p>
                ${quoteBlocks(r, rec, tokens, true)}
            </article>`;
        }).join('');
        p.hidden = false;
    }

    // ---------- mobile: render into the bottom-sheet search panel ----------

    function mobileBox() {
        const mp = document.querySelector('.mnav-tab-panel[data-panel="search"]');
        if (!mp) return null;
        let box = mp.querySelector('.mnav-rag');
        if (!box) {
            box = document.createElement('div');
            box.className = 'mnav-rag';
            const ol = mp.querySelector('.mnav-search-results');
            if (ol) mp.insertBefore(box, ol); else mp.appendChild(box);
            box.addEventListener('click', (e) => {
                const card = e.target.closest('.mnav-rag-card');
                if (!card) return;
                const id = card.dataset.id;
                const close = document.querySelector('.mnav-sheet .mnav-close');
                if (close) close.click();
                setTimeout(() => lightCard(id, queryTokens(lastQuery)), 90);
            });
        }
        return box;
    }

    function clearMobile() {
        const mp = document.querySelector('.mnav-tab-panel[data-panel="search"]');
        if (!mp) return;
        mp.classList.remove('mnav-has-rag');
        const box = mp.querySelector('.mnav-rag');
        if (box) box.innerHTML = '';
    }

    function mobileLoading() {
        const box = mobileBox();
        if (box) box.innerHTML = `<p class="mnav-rag-loading">loading semantic search…</p>`; // lexical list stays visible below
    }

    function renderMobile(results, tokens) {
        const box = mobileBox();
        if (!box) return;
        const mp = box.closest('.mnav-tab-panel');
        mp.classList.add('mnav-has-rag'); // hides the lexical list + count via CSS
        if (!results.length) { box.innerHTML = `<p class="mnav-rag-loading">no close matches</p>`; return; }
        box.innerHTML = `<p class="mnav-rag-label">// closest matches</p>` + results.map((r) => {
            const rec = recData.get(r.id) || { claim: '', year: '', title: r.id, quotes: {} };
            const u = r.bestUnit;
            const snip = unitText(rec, u);
            const snipHtml = u ? renderSpans(snip, [{ start: 0, end: snip.length, score: u.score }], tokens) : '';
            return `<button class="mnav-rag-card" type="button" data-id="${esc(r.id)}">
                <span class="mnav-rag-head"><span class="mnav-rag-year">${esc(rec.year)}</span><span class="mnav-rag-title">${esc(rec.title)}</span><span class="mnav-rag-score">${r.best.toFixed(2)}</span></span>
                <span class="mnav-rag-snip">${snipHtml}</span>
            </button>`;
        }).join('');
    }

    // ---------- in-place highlight on the live timeline card ----------

    function clearInPlace() {
        for (const card of litCards) {
            const id = card.dataset.evidenceId;
            const rec = recData && recData.get(id);
            if (rec) {
                const claimEl = card.querySelector('.evidence-claim');
                if (claimEl) claimEl.textContent = rec.claim;
                const lis = card.querySelectorAll('.evidence-sources > li');
                Object.entries(rec.quotes).forEach(([i, q]) => {
                    const bq = lis[i]?.querySelector('.source-quote');
                    if (bq && q.quote) bq.textContent = q.quote;
                });
            }
            card.classList.remove('rag-focus');
        }
        litCards.clear();
    }

    function lightCard(id, tokens) {
        clearInPlace();
        const rec = recData && recData.get(id);
        const card = document.querySelector(`.evidence-card[data-evidence-id="${CSS.escape(id)}"]`);
        if (!rec || !card) { document.getElementById(id)?.scrollIntoView({ block: 'start' }); return; }
        // the lexical filter (search.js) may have hidden this card — reveal it so the
        // jump lands somewhere visible (semantic match != lexical AND-token match)
        card.classList.remove('search-hidden', 'filter-hidden');
        const ch = card.closest('.chapter');
        if (ch) {
            ch.classList.remove('search-hidden', 'filter-hidden');
            let div = ch.previousElementSibling;
            while (div && !div.classList.contains('era-divider')) div = div.previousElementSibling;
            div?.classList.remove('search-hidden');
        }
        // re-score this record against the current query result so tints are fresh
        const r = (lastResults || []).find((x) => x.id === id);
        const claimEl = card.querySelector('.evidence-claim');
        if (claimEl) claimEl.innerHTML = renderSpans(rec.claim, r ? r.claim : [], tokens);
        if (r) {
            const lis = card.querySelectorAll('.evidence-sources > li');
            for (const b of quoteBlocks(r, rec, tokens, false)) {
                const bq = lis[b.srcIdx]?.querySelector('.source-quote');
                if (bq) bq.innerHTML = b.html;
            }
        }
        card.classList.add('rag-focus');
        litCards.add(card);
        card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    // ---------- entry ----------

    async function run(q) {
        const query = (q || '').trim();
        lastQuery = query;
        clearInPlace();
        if (query.length < MIN_QUERY_LEN) { const p = document.getElementById('rag-results'); if (p) p.hidden = true; clearMobile(); return; }
        try {
            if (!extractor && isMobile()) mobileLoading(); // keep lexical list as fallback during one-time model load
            await ensureLoaded();
            if (lastQuery !== query) return;
            const qvec = await embed(query);
            if (lastQuery !== query) return;
            lastResults = scoreRecords(qvec);
            render(lastResults, queryTokens(query));
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

    // re-render to the right surface if the viewport crosses the mobile breakpoint
    mqMobile.addEventListener('change', () => {
        if (lastResults && lastQuery.length >= MIN_QUERY_LEN) render(lastResults, queryTokens(lastQuery));
    });
})();
