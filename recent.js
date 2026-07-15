// recent.js — "Recently added" feed. A flat, newest-first list of evidence
// records ordered by the date each entered git history (record.date_added,
// baked into bundle.json by tools/build-bundle.mjs). This is a SEPARATE view:
// the timeline itself stays in event chronology (era -> chapter -> cards). The
// feed just answers "what landed lately" and jumps to the live card on click.
(function () {
    'use strict';

    function esc(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    function fmtDate(iso) {
        const d = new Date(iso);
        if (isNaN(d)) return '';
        return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
    }
    function dayKey(iso) {
        const d = new Date(iso);
        return isNaN(d) ? '' : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }

    // chapter <h3> text for an anchor, so feed headings match the timeline
    function chapterTitle(anchor) {
        const h = document.querySelector(`.chapter[data-anchor="${CSS.escape(anchor)}"] header h3`);
        return h ? h.textContent.trim() : anchor;
    }

    function snippet(claim, n = 160) {
        const s = String(claim || '').trim();
        return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s;
    }

    async function loadRecords() {
        let bundle;
        try {
            const r = await fetch('bundle.json', { cache: 'default' });
            bundle = await r.json();
        } catch (e) {
            return [];
        }
        const recs = Object.values(bundle.records || {}).filter((r) => r && r.date_added);
        recs.sort((a, b) => (a.date_added < b.date_added ? 1 : a.date_added > b.date_added ? -1 : 0));
        return recs;
    }

    // reveal + scroll + flash the live card (mirrors rag.js jump behavior)
    function jumpToCard(id) {
        const card = document.querySelector(`.evidence-card[data-evidence-id="${CSS.escape(id)}"]`);
        if (!card) { document.getElementById(id)?.scrollIntoView({ block: 'start' }); return; }
        card.classList.remove('search-hidden', 'filter-hidden');
        const ch = card.closest('.chapter');
        if (ch) {
            ch.classList.remove('search-hidden', 'filter-hidden');
            let div = ch.previousElementSibling;
            while (div && !div.classList.contains('era-divider')) div = div.previousElementSibling;
            div?.classList.remove('search-hidden');
        }
        document.querySelectorAll('.evidence-card.rag-focus').forEach((c) => c.classList.remove('rag-focus'));
        // reflow so the animation replays even on the same card
        void card.offsetWidth;
        card.classList.add('rag-focus');
        card.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    function renderList(recs, panel) {
        const list = panel.querySelector('.recent-list');
        let lastDay = null;
        list.innerHTML = recs.map((r) => {
            const dk = dayKey(r.date_added);
            const sep = dk !== lastDay
                ? `<li class="recent-daymark" aria-hidden="true">${esc(fmtDate(r.date_added))}</li>` : '';
            lastDay = dk;
            return `${sep}<li><button class="recent-card" type="button" data-id="${esc(r.id)}">
                <span class="recent-card-head"><span class="recent-year">${esc(r.year)}</span><span class="recent-title">${esc(chapterTitle(r.anchor))}</span></span>
                <span class="recent-claim">${esc(snippet(r.claim))}</span>
            </button></li>`;
        }).join('');
        list.addEventListener('click', (e) => {
            const btn = e.target.closest('.recent-card');
            if (!btn) return;
            jumpToCard(btn.dataset.id);
            togglePanel(panel, false);
        });
    }

    function togglePanel(panel, show) {
        const open = show === undefined ? panel.hidden : show;
        panel.hidden = !open;
        const btn = document.getElementById('recent-toggle');
        if (btn) btn.setAttribute('aria-expanded', String(open));
        if (open) panel.querySelector('.recent-list')?.scrollTo?.(0, 0);
    }

    async function init() {
        const recs = await loadRecords();
        if (!recs.length) return;

        // toggle in the header nav
        const nav = document.querySelector('.header-nav');
        const btn = document.createElement('button');
        btn.id = 'recent-toggle';
        btn.type = 'button';
        btn.className = 'exit-mark recent-toggle';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'recent-feed');
        btn.textContent = `recently added`;
        if (nav) nav.insertBefore(btn, nav.firstChild);

        // panel under the theme-bar (same slot as the RAG results panel)
        const panel = document.createElement('section');
        panel.id = 'recent-feed';
        panel.className = 'recent-feed';
        panel.hidden = true;
        panel.setAttribute('aria-label', 'recently added evidence');
        panel.innerHTML = `<div class="recent-inner">
            <p class="recent-head"><span class="recent-head-label">// RECENTLY ADDED</span><span class="recent-status">${recs.length} records · newest first</span><button class="recent-close" type="button" aria-label="close">✕</button></p>
            <ol class="recent-list"></ol>
        </div>`;
        const bar = document.getElementById('theme-bar');
        if (bar && bar.parentNode) bar.parentNode.insertBefore(panel, bar.nextSibling);
        else document.body.insertBefore(panel, document.body.firstChild);

        renderList(recs, panel);
        btn.addEventListener('click', () => togglePanel(panel));
        panel.querySelector('.recent-close').addEventListener('click', () => togglePanel(panel, false));
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) togglePanel(panel, false); });
    }

    // wait for the timeline cards + chapter shells to exist so jumps + titles resolve
    if (document.querySelector('.evidence-card')) init();
    else document.addEventListener('receipts:evidence-ready', init, { once: true });
})();
