(function () {
    'use strict';

    async function loadJSON(url) {
        const r = await fetch(url, { cache: 'default' });
        if (!r.ok) throw new Error(`fetch ${url} -> ${r.status}`);
        return r.json();
    }

    function escapeHTML(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function renderSource(src, idx) {
        const n = String(idx + 1).padStart(2, '0');
        const inner = src.url
            ? `<a href="${escapeHTML(src.url)}" rel="noopener" target="_blank">${escapeHTML(src.label)}</a>`
            : escapeHTML(src.label);
        const type = src.type ? `<span class="src-type">${escapeHTML(src.type)}</span>` : '';
        const quote = src.quote ? `<blockquote class="source-quote">${escapeHTML(src.quote)}</blockquote>` : '';
        const clip = src.clip
            ? `<figure class="source-clip"><a href="${escapeHTML(src.url || '')}" target="_blank" rel="noopener"><img src="sources/${escapeHTML(src.clip)}" alt="Highlighted excerpt from source" loading="lazy"></a></figure>`
            : '';
        return `<li data-n="${n}">${inner}${type}${quote}${clip}</li>`;
    }

    function renderCard(record) {
        const sources = (record.sources || []).map(renderSource).join('');
        return `
<div class="evidence-card" data-evidence-id="${escapeHTML(record.id)}">
  <p class="evidence-claim">${escapeHTML(record.claim)}</p>
  <ol class="evidence-sources">${sources}</ol>
</div>`.trim();
    }

    // Fetch every record. Prefer the prebuilt bundle.json (one request for the
    // whole corpus); fall back to fetching each manifest entry in parallel if the
    // bundle is missing or stale. Either way, no serial-await chain.
    async function fetchRecords() {
        let manifest;
        try {
            manifest = await loadJSON('sources/evidence/manifest.json');
        } catch (e) {
            console.warn('[receipts] no evidence manifest yet:', e.message);
            return [];
        }
        const entries = manifest.records || [];

        let bundle = null;
        try {
            bundle = await loadJSON('bundle.json');
        } catch (e) {
            // no bundle — fall through to per-file fetches
        }

        const out = await Promise.all(entries.map(async (entry) => {
            const fromBundle = bundle && bundle.records && bundle.records[entry];
            if (fromBundle) return fromBundle;
            try {
                return await loadJSON(`sources/evidence/${entry}`);
            } catch (e) {
                console.warn('[receipts] could not load', entry, e.message);
                return null;
            }
        }));
        return out.filter(Boolean);
    }

    async function loadEvidence() {
        const records = await fetchRecords();

        const byAnchor = new Map();
        for (const rec of records) {
            const anchor = rec.anchor;
            if (!byAnchor.has(anchor)) byAnchor.set(anchor, []);
            byAnchor.get(anchor).push(rec);
        }

        for (const [anchor, recs] of byAnchor) {
            const slot = document.querySelector(`.evidence[data-anchor="${anchor}"]`);
            if (!slot) continue;
            const cards = recs.map(renderCard).join('');
            slot.innerHTML = `<p class="evidence-head">Evidence</p>${cards}`;
        }

        // Cards are now in the DOM. themes.js / search.js annotate and filter
        // against these elements, but they boot off receipts:dag-ready, which
        // (since dag.js fetches in parallel) fires well before this serial
        // render finishes. Announce completion so they can wire the cards
        // whenever they land — order between the two events doesn't matter.
        document.dispatchEvent(new CustomEvent('receipts:evidence-ready'));
    }

    loadEvidence();
})();
