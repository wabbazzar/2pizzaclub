// receipts/search.js
//
// Full-text search across chapters, narrative blurbs, claims, and source text.
//
// On `receipts:dag-ready` (and again on `receipts:filter-applied`):
//   1. Builds an in-memory index of every searchable unit (chapter, narrative,
//      claim) keyed by anchor with a lowercased, diacritic-stripped haystack.
//   2. Renders the desktop search box into `.theme-bar-inner` and a Search tab
//      into the mobile bottom sheet plus a small glyph button on the pill.
//   3. Reads ?q= URL param + localStorage and applies the query.
//
// Match algorithm: tokenize on whitespace, AND every token, indexOf hit on the
// haystack. Min query length 2.
//
// Visibility: hides cards/chapters/era-dividers/rail entries that don't match
// via `.search-hidden`, parallel to themes.js's `.filter-hidden`. The two
// systems compose: a node is visible only if it has NEITHER class.

(function () {
    'use strict';

    const MIN_QUERY_LEN = 2;
    const DEBOUNCE_MS = 120;

    let searchIndex = [];                    // built lazily
    let narrativeData = null;                // loaded once
    let currentQuery = '';                   // raw input string
    let currentTokens = [];                  // normalized tokens
    let matchingAnchors = new Set();
    let matchingCardIds = new Set();
    let debounceTimer = null;
    let indexBuilt = false;

    // ---------- string utils ----------

    function normalize(s) {
        return String(s || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '');
    }

    function tokenize(q) {
        return normalize(q).split(/\s+/).filter((t) => t.length >= MIN_QUERY_LEN);
    }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // ---------- index build ----------

    function buildIndex() {
        searchIndex = [];

        // 1. chapter shells from DOM (year, title, anchor)
        for (const ch of document.querySelectorAll('.chapter')) {
            const anchor = ch.dataset.anchor;
            if (!anchor) continue;
            const year = ch.dataset.year || '';
            const era = ch.dataset.era || '';
            const title = ch.querySelector('h3')?.textContent?.trim() || '';
            searchIndex.push({
                kind: 'chapter',
                anchor,
                year,
                era,
                title,
                haystack: normalize([year, title, era, anchor].join(' ')),
            });
        }

        // 2. narrative blurbs (eras + anchors)
        if (narrativeData && narrativeData.enabled !== false) {
            const eraMap = { i: 'era-1', ii: 'era-2', iii: 'era-3', iv: 'era-4', v: 'era-5' };
            for (const [eraKey, text] of Object.entries(narrativeData.eras || {})) {
                if (!text) continue;
                // anchor: first chapter of this era so we have something to scroll to
                const firstCh = document.querySelector(`.chapter[data-era="${eraKey}"]`);
                if (!firstCh) continue;
                searchIndex.push({
                    kind: 'narrative',
                    anchor: firstCh.dataset.anchor,
                    era: eraKey,
                    eraDom: eraMap[eraKey],
                    haystack: normalize(text),
                });
            }
            for (const [anchor, text] of Object.entries(narrativeData.anchors || {})) {
                if (!text) continue;
                searchIndex.push({
                    kind: 'narrative',
                    anchor,
                    haystack: normalize(text),
                });
            }
        }

        // 3. claims + sources from RECEIPTS_DAG
        const dag = window.RECEIPTS_DAG;
        if (dag) {
            // build claim-id -> sources map from edges
            const sourcesByClaim = new Map();
            for (const e of dag.edges) {
                if (e.kind !== 'cites') continue;
                if (!sourcesByClaim.has(e.from)) sourcesByClaim.set(e.from, []);
                sourcesByClaim.get(e.from).push(e.to);
            }
            const nodeById = new Map();
            for (const n of dag.nodes) nodeById.set(n.id, n);

            for (const n of dag.nodes) {
                if (n.type !== 'claim') continue;
                const recordId = n.id.replace(/^claim:/, '');
                const parts = [
                    n.claim || '',
                    (n.themes || []).join(' '),
                    n.anchor || '',
                    String(n.year || ''),
                ];
                for (const sid of sourcesByClaim.get(n.id) || []) {
                    const s = nodeById.get(sid);
                    if (!s) continue;
                    parts.push(s.label || '');
                    parts.push(s.quote || '');
                }
                searchIndex.push({
                    kind: 'claim',
                    anchor: n.anchor,
                    recordId,
                    year: n.year,
                    themes: n.themes || [],
                    haystack: normalize(parts.join(' \n ')),
                });
            }
        }

        indexBuilt = true;
    }

    // ---------- match ----------

    function recompute() {
        matchingAnchors = new Set();
        matchingCardIds = new Set();
        if (!currentTokens.length) return;
        for (const entry of searchIndex) {
            let ok = true;
            for (const t of currentTokens) {
                if (entry.haystack.indexOf(t) === -1) { ok = false; break; }
            }
            if (!ok) continue;
            if (entry.anchor) matchingAnchors.add(entry.anchor);
            if (entry.kind === 'claim' && entry.recordId) matchingCardIds.add(entry.recordId);
        }
    }

    // ---------- highlight ----------

    function clearMarks(root) {
        const marks = (root || document).querySelectorAll('mark.search-mark');
        for (const m of marks) {
            const txt = document.createTextNode(m.textContent);
            m.replaceWith(txt);
        }
        // merge adjacent text nodes left behind
        (root || document).normalize?.();
    }

    function highlightInNode(node, tokens) {
        // node is a text node; tokens already normalized lowercase
        const raw = node.nodeValue;
        if (!raw) return;
        const lower = normalize(raw);
        // find earliest occurrence of any token (run multiple passes if needed)
        const ranges = [];
        for (const t of tokens) {
            let from = 0;
            while (true) {
                const idx = lower.indexOf(t, from);
                if (idx === -1) break;
                ranges.push([idx, idx + t.length]);
                from = idx + t.length;
            }
        }
        if (!ranges.length) return;
        // merge overlapping ranges
        ranges.sort((a, b) => a[0] - b[0]);
        const merged = [];
        for (const r of ranges) {
            if (merged.length && r[0] <= merged[merged.length - 1][1]) {
                merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], r[1]);
            } else {
                merged.push([r[0], r[1]]);
            }
        }
        // build replacement DOM
        const frag = document.createDocumentFragment();
        let cursor = 0;
        for (const [a, b] of merged) {
            if (cursor < a) frag.appendChild(document.createTextNode(raw.slice(cursor, a)));
            const m = document.createElement('mark');
            m.className = 'search-mark';
            m.textContent = raw.slice(a, b);
            frag.appendChild(m);
            cursor = b;
        }
        if (cursor < raw.length) frag.appendChild(document.createTextNode(raw.slice(cursor)));
        node.parentNode.replaceChild(frag, node);
    }

    function highlightInElement(el, tokens) {
        // TreeWalker over text nodes; skip script/style/mark
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
            acceptNode(n) {
                const p = n.parentNode;
                if (!p) return NodeFilter.FILTER_REJECT;
                const tag = p.nodeName;
                if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'MARK') return NodeFilter.FILTER_REJECT;
                if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            },
        });
        const targets = [];
        let curr;
        while ((curr = walker.nextNode())) targets.push(curr);
        for (const n of targets) highlightInNode(n, tokens);
    }

    // ---------- apply (visibility + highlights + rails) ----------

    function applySearch() {
        const active = currentTokens.length > 0;
        recompute();

        // 1. clear any previous marks first (cheap if none)
        clearMarks(document.querySelector('main.chapters'));

        // 2. evidence cards
        const allCards = document.querySelectorAll('.evidence-card');
        for (const card of allCards) {
            if (!active) {
                card.classList.remove('search-hidden');
                card.classList.remove('search-hit');
                continue;
            }
            const id = card.dataset.evidenceId;
            const ch = card.closest('.chapter');
            const chAnchor = ch?.dataset.anchor;
            const cardMatch = matchingCardIds.has(id);
            const narrativeOnly = chAnchor && matchingAnchors.has(chAnchor) && !cardMatch;
            const show = cardMatch || narrativeOnly;
            card.classList.toggle('search-hidden', !show);
            card.classList.toggle('search-hit', cardMatch);
        }

        // 3. chapters
        for (const ch of document.querySelectorAll('.chapter')) {
            if (!active) {
                ch.classList.remove('search-hidden');
                continue;
            }
            const anchor = ch.dataset.anchor;
            const anchorMatch = matchingAnchors.has(anchor);
            // chapter visible if its anchor matches (chapter title or narrative) OR
            // any of its cards matches
            const anyCardMatch = Array.from(ch.querySelectorAll('.evidence-card'))
                .some((c) => matchingCardIds.has(c.dataset.evidenceId));
            ch.classList.toggle('search-hidden', !(anchorMatch || anyCardMatch));
        }

        // 4. era dividers + rail dimming (compose with theme filter-hidden)
        recomputeEraAndRail();

        // 5. highlight inside visible matching chapters
        if (active) {
            for (const ch of document.querySelectorAll('.chapter:not(.search-hidden):not(.filter-hidden)')) {
                // highlight in h3 and chapter-body
                const h3 = ch.querySelector('header h3');
                if (h3) highlightInElement(h3, currentTokens);
                const body = ch.querySelector('.chapter-body');
                if (body) highlightInElement(body, currentTokens);
                // highlight only inside cards that matched (not narrative-only fillers)
                for (const card of ch.querySelectorAll('.evidence-card:not(.search-hidden):not(.filter-hidden)')) {
                    if (matchingCardIds.has(card.dataset.evidenceId)) {
                        highlightInElement(card, currentTokens);
                    }
                }
            }
        }

        // 6. counts + empty-state
        updateCounters(active);

        // 7. mobile results list
        renderMobileResults();
    }

    function recomputeEraAndRail() {
        // A chapter is "effectively visible" iff it has neither hide class.
        function visible(ch) {
            return !ch.classList.contains('search-hidden') && !ch.classList.contains('filter-hidden');
        }

        // era dividers: hide if no visible chapter in its run AND at least one
        // hide layer is active.
        const themesActive = document.querySelectorAll('.evidence-card.filter-hidden').length > 0
            || document.querySelectorAll('.chapter.filter-hidden').length > 0;
        const searchActive = currentTokens.length > 0;
        const anyActive = themesActive || searchActive;

        for (const era of document.querySelectorAll('.era-divider')) {
            const chs = [];
            let n = era.nextElementSibling;
            while (n && !n.classList.contains('era-divider')) {
                if (n.classList.contains('chapter')) chs.push(n);
                n = n.nextElementSibling;
            }
            const anyVisible = chs.some(visible);
            era.classList.toggle('search-hidden', anyActive && !anyVisible && chs.length > 0);
        }

        // rail dimming
        for (const a of document.querySelectorAll('.timeline-list a[data-anchor]')) {
            const anchor = a.dataset.anchor;
            const ch = document.querySelector(`.chapter[data-anchor="${anchor}"]`);
            const dim = anyActive && (!ch || !visible(ch));
            a.classList.toggle('filter-dim', dim);
        }
    }

    function updateCounters(active) {
        const box = document.querySelector('.search-box');
        if (!box) return;
        const count = box.querySelector('.search-count');
        if (!count) return;

        if (!active) {
            count.textContent = '';
            box.classList.remove('is-empty-result', 'is-active');
            return;
        }
        box.classList.add('is-active');
        const chapters = matchingAnchors.size;
        const cards = matchingCardIds.size;
        const total = chapters + cards;
        if (total === 0) {
            count.textContent = 'no matches';
            box.classList.add('is-empty-result');
        } else {
            box.classList.remove('is-empty-result');
            count.textContent = `${chapters} chapter${chapters === 1 ? '' : 's'} · ${cards} card${cards === 1 ? '' : 's'}`;
        }
    }

    // ---------- scroll to next/prev hit ----------

    function visibleHitChapters() {
        return Array.from(document.querySelectorAll('.chapter:not(.search-hidden):not(.filter-hidden)'));
    }

    function scrollToHit(direction) {
        const hits = visibleHitChapters();
        if (!hits.length) return;
        const scrollY = window.scrollY;
        let idx = -1;
        for (let i = 0; i < hits.length; i++) {
            const top = hits[i].getBoundingClientRect().top + scrollY;
            if (top > scrollY + 8) { idx = i; break; }
        }
        let target;
        if (direction === 'next') {
            target = idx === -1 ? hits[0] : hits[idx];
        } else {
            // prev: last hit whose top < scrollY (allow small fudge)
            let prev = null;
            for (let i = 0; i < hits.length; i++) {
                const top = hits[i].getBoundingClientRect().top + scrollY;
                if (top < scrollY - 8) prev = hits[i];
                else break;
            }
            target = prev || hits[hits.length - 1];
        }
        if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
    }

    // ---------- URL + state ----------

    // Only an explicit ?q= deep-link seeds the search on load. A free-text query
    // is transient — do NOT auto-restore the previous session's search from
    // localStorage. A silently-resurrected query composes with a theme chip
    // (search-hidden AND filter-hidden) and blanks the whole timeline: the user,
    // who never typed a search, just sees "clicking any theme empties the page."
    function readState() {
        const url = new URL(window.location.href);
        const fromUrl = url.searchParams.get('q');
        return fromUrl != null ? fromUrl : '';
    }

    function writeState(q) {
        const url = new URL(window.location.href);
        if (q) url.searchParams.set('q', q);
        else url.searchParams.delete('q');
        window.history.replaceState({}, '', url.toString());
    }

    // ---------- DOM: desktop search box ----------

    function ensureDesktopBox() {
        const inner = document.querySelector('.theme-bar-inner');
        if (!inner) return null;
        let box = inner.querySelector('.search-box');
        if (box) return box;

        // rename "// THEMES" label to "// FILTER"
        const label = inner.querySelector('.theme-label');
        if (label) label.textContent = '// FILTER';

        box = document.createElement('form');
        box.className = 'search-box';
        box.setAttribute('role', 'search');
        box.addEventListener('submit', (e) => e.preventDefault());
        box.innerHTML = `
            <input class="search-input" type="search" autocomplete="off" spellcheck="false"
                   placeholder="search…" aria-label="search receipts">
            <div class="search-nav" hidden>
                <button class="search-nav-btn" type="button" data-dir="prev" aria-label="previous hit">▴</button>
                <button class="search-nav-btn" type="button" data-dir="next" aria-label="next hit">▾</button>
            </div>
            <span class="search-count" aria-live="polite"></span>
        `;
        // insert immediately after the label (or as first child if no label)
        if (label && label.nextSibling) inner.insertBefore(box, label.nextSibling);
        else inner.insertBefore(box, inner.firstChild);

        const input = box.querySelector('.search-input');
        input.addEventListener('input', () => onQueryChanged(input.value, 'desktop'));
        const nav = box.querySelector('.search-nav');
        nav.querySelectorAll('.search-nav-btn').forEach((b) => {
            b.addEventListener('click', () => scrollToHit(b.dataset.dir));
        });
        return box;
    }

    // ---------- DOM: mobile sheet Search tab + pill glyph ----------

    function ensureMobileTab() {
        const sheet = document.querySelector('.mnav-sheet');
        if (!sheet) return;
        const panel = sheet.querySelector('.mnav-tab-panel[data-panel="search"]');
        if (!panel || panel.dataset.searchReady === '1') return;

        panel.innerHTML = `
            <div class="mnav-search-box">
                <input class="mnav-search-input" type="search" autocomplete="off"
                       spellcheck="false" placeholder="search receipts…"
                       aria-label="search receipts">
                <p class="mnav-search-count" aria-live="polite"></p>
            </div>
            <ol class="mnav-search-results"></ol>
        `;
        panel.dataset.searchReady = '1';

        const minput = panel.querySelector('.mnav-search-input');
        minput.addEventListener('input', () => onQueryChanged(minput.value, 'mobile'));

        // autofocus input when the Search tab becomes active
        const searchTab = sheet.querySelector('.mnav-tab[data-tab="search"]');
        if (searchTab) {
            searchTab.addEventListener('click', () => setTimeout(() => minput.focus(), 80));
        }
        sheet.addEventListener('mnav:tab-opened', (e) => {
            if (e.detail?.tab === 'search') setTimeout(() => minput.focus(), 80);
        });

        // Wire result row clicks — close sheet, scroll to chapter
        const results = panel.querySelector('.mnav-search-results');
        results.addEventListener('click', (e) => {
            const a = e.target.closest('a[data-anchor]');
            if (!a) return;
            const closeBtn = sheet.querySelector('.mnav-close');
            if (closeBtn) setTimeout(() => closeBtn.click(), 50);
        });
    }

    function renderMobileResults() {
        const panel = document.querySelector('.mnav-tab-panel[data-panel="search"]');
        if (!panel) return;
        const count = panel.querySelector('.mnav-search-count');
        const results = panel.querySelector('.mnav-search-results');
        if (!count || !results) return;

        if (!currentTokens.length) {
            count.textContent = '';
            results.innerHTML = '';
            return;
        }

        // Build per-chapter hit list
        const chapterHits = new Map(); // anchor -> { year, title, hits }
        for (const ch of document.querySelectorAll('.chapter')) {
            const anchor = ch.dataset.anchor;
            if (!matchingAnchors.has(anchor)) continue;
            const year = ch.dataset.year || '';
            const title = ch.querySelector('h3')?.textContent?.trim() || '';
            let hits = 0;
            for (const card of ch.querySelectorAll('.evidence-card')) {
                if (matchingCardIds.has(card.dataset.evidenceId)) hits++;
            }
            chapterHits.set(anchor, { year, title, hits });
        }

        const arr = Array.from(chapterHits.entries());
        if (!arr.length) {
            count.textContent = 'no matches';
            results.innerHTML = '';
            return;
        }
        count.textContent = `${arr.length} chapter${arr.length === 1 ? '' : 's'} · ${matchingCardIds.size} card${matchingCardIds.size === 1 ? '' : 's'}`;
        results.innerHTML = arr.map(([anchor, info]) => `
            <li><a href="#${esc(anchor)}" data-anchor="${esc(anchor)}">
                <span class="mnav-search-year">${esc(info.year)}</span>
                <span class="mnav-search-title">${esc(info.title)}</span>
                <span class="mnav-search-hits">${info.hits ? info.hits + ' hit' + (info.hits === 1 ? '' : 's') : 'narrative'}</span>
            </a></li>
        `).join('');
    }

    // ---------- entry: query change ----------

    function onQueryChanged(value, origin) {
        currentQuery = value;
        currentTokens = tokenize(value);

        // notify the semantic layer (rag.js); it debounces + renders its own panel
        document.dispatchEvent(new CustomEvent('receipts:query', { detail: { q: value } }));

        // sync the other input
        const dInput = document.querySelector('.search-input');
        const mInput = document.querySelector('.mnav-search-input');
        if (origin !== 'desktop' && dInput && dInput.value !== value) dInput.value = value;
        if (origin !== 'mobile' && mInput && mInput.value !== value) mInput.value = value;

        // toggle desktop nav visibility
        const box = document.querySelector('.search-box');
        if (box) {
            const nav = box.querySelector('.search-nav');
            if (nav) nav.hidden = currentTokens.length === 0;
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            requestAnimationFrame(() => {
                writeState(value);
                applySearch();
            });
        }, DEBOUNCE_MS);
    }

    // ---------- init ----------

    async function loadNarrative() {
        try {
            const r = await fetch('chapters/narrative.json', { cache: 'no-cache' });
            if (r.ok) narrativeData = await r.json();
        } catch (e) { narrativeData = null; }
    }

    async function init() {
        if (!window.RECEIPTS_DAG) return;
        if (!narrativeData) await loadNarrative();
        ensureDesktopBox();
        ensureMobileTab();
        buildIndex();

        const initial = readState();
        if (initial) {
            const dInput = document.querySelector('.search-input');
            const mInput = document.querySelector('.mnav-search-input');
            if (dInput) dInput.value = initial;
            if (mInput) mInput.value = initial;
            currentQuery = initial;
            currentTokens = tokenize(initial);
            const box = document.querySelector('.search-box');
            if (box) {
                const nav = box.querySelector('.search-nav');
                if (nav) nav.hidden = currentTokens.length === 0;
            }
        }
        applySearch();
    }

    // listen for themes.js re-applying its filter so we can recompute the
    // composed visibility (era dividers, rail dimming) on top.
    document.addEventListener('receipts:filter-applied', () => {
        if (!indexBuilt) return;
        applySearch();
    });

    if (window.RECEIPTS_DAG) init();
    document.addEventListener('receipts:dag-ready', init);
})();
