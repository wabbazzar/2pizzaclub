// /efta/ findings viewer. Loads findings.json and paginates pages array.

const $ = (id) => document.getElementById(id);

const state = {
    data: null,
    pageIdx: 0,
};

// Display order + label for each kind, when building the TOC.
const KIND_GROUP = {
    person_dossier:     { order:  1, label: 'Person dossiers' },
    names_top20:        { order:  2, label: 'Top names — NER discovered' },
    names_grep:         { order:  3, label: 'Top names — curated grep (cross-check)' },
    topic_search:       { order:  4, label: 'Topic search' },
    verbatim_quote:     { order:  4, label: 'Verbatim press quotes' },
    press_recreate:     { order:  5, label: 'Press-cited terms — counts' },
    codeword_top:       { order:  6, label: 'Code-language counts' },
    cooccur_pairs:      { order:  7, label: 'Co-occurrence pairs' },
    email_threads:      { order:  8, label: 'Email threads' },
    imessages:          { order:  9, label: 'Epstein iMessages (chrono)' },
    doc_dates_year:     { order: 10, label: 'Doc-date histogram' },
    mention_dates_year: { order: 11, label: 'Mention-date histogram' },
    tfidf:              { order: 12, label: 'TF-IDF n-grams' },
    ngram:              { order: 13, label: 'Doc-spread n-grams' },
    label_top:          { order: 14, label: 'Other PII labels (NER)' },
    email_top:          { order: 15, label: 'Top email addresses (NER)' },
    ds10_financial:     { order: 16, label: 'DS10 financial dossier (end)' },
};

function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
    }[c]));
}

// Render a doc_id as a clickable button that opens the doc viewer side-panel.
function docLink(id) {
    if (!id) return '';
    return `<button class="doc-link" type="button" data-doc-id="${escapeHTML(id)}">${escapeHTML(id)}</button>`;
}

// Map a dataset name to one of the 4 filter buckets.
const DATASET_BUCKET = {
    dataset_3: 'court', dataset_4: 'court', dataset_6: 'court', dataset_7: 'court',
    dataset_11: 'personal', dataset_12: 'personal',
    emails: 'personal', estate: 'personal', dems: 'personal',
    dataset_8: 'doj_feb',
    dataset_10: 'financial',
    dataset_1: 'court', dataset_2: 'court', dataset_5: 'court',  // photo-heavy
};
function rowMatchesFilter(row, enabledBuckets) {
    // Per-row datasets dict (NER rank pages, press_recreate, codeword_top, etc.)
    if (row.datasets && Object.keys(row.datasets).length) {
        return Object.keys(row.datasets).some(ds => enabledBuckets.has(DATASET_BUCKET[ds] || 'other'));
    }
    // Single-dataset row (topic_search, imessages)
    if (row.dataset) {
        return enabledBuckets.has(DATASET_BUCKET[row.dataset] || 'other');
    }
    // Sample doc_ids may give us datasets indirectly — fallback: keep if no dataset info
    return true;
}

function getEnabledBuckets() {
    const set = new Set();
    document.querySelectorAll('.filter-chip input[type=checkbox]').forEach(cb => {
        if (cb.checked) set.add(cb.dataset.bucket);
    });
    return set;
}

function fmtDatasets(d) {
    if (!d) return '';
    return Object.entries(d).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}:${v}`).join('  ');
}

function renderHeaderMeta() {
    const c = state.data.corpus || {};
    const g = state.data.generated_at ? state.data.generated_at.slice(0, 10) : '';
    $('meta-summary').textContent =
        `${c.n_documents ?? '—'} docs · ${state.data.pages.length} pages · ${g}`;
}

function renderTOC() {
    const root = $('toc-groups');
    const pages = state.data.pages || [];
    // Group pages by kind, preserving original index for navigation
    const groups = new Map();  // kind -> [{idx, page}]
    pages.forEach((p, i) => {
        const arr = groups.get(p.kind) || [];
        arr.push({ idx: i, page: p });
        groups.set(p.kind, arr);
    });
    const ordered = Array.from(groups.entries()).sort((a, b) => {
        const ao = (KIND_GROUP[a[0]]?.order ?? 999);
        const bo = (KIND_GROUP[b[0]]?.order ?? 999);
        return ao - bo;
    });

    root.innerHTML = '';
    for (const [kind, items] of ordered) {
        const label = KIND_GROUP[kind]?.label || kind;
        // Auto-open the group containing the current page
        const containsCurrent = items.some(it => it.idx === state.pageIdx);
        const det = document.createElement('details');
        if (containsCurrent) det.open = true;
        det.className = 'toc-group';
        det.dataset.kind = kind;
        const sum = document.createElement('summary');
        sum.innerHTML = `<span class="toc-label">${escapeHTML(label)}</span>`
                      + `<span class="toc-count">${items.length} page${items.length===1?'':'s'}</span>`;
        det.appendChild(sum);
        const ul = document.createElement('ul');
        for (const { idx, page } of items) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#p=${idx + 1}`;
            a.textContent = page.title;
            if (idx === state.pageIdx) a.className = 'toc-current';
            a.addEventListener('click', (e) => { e.preventDefault(); goto(idx); });
            li.appendChild(a);
            ul.appendChild(li);
        }
        det.appendChild(ul);
        root.appendChild(det);
    }
}

function renderPagerLabels() {
    const total = (state.data.pages || []).length;
    const cur = state.pageIdx + 1;
    $('page-label-top').textContent = `page ${cur} / ${total}`;
    $('page-label-bottom').textContent = `page ${cur} / ${total}`;
    const atStart = state.pageIdx === 0;
    const atEnd = state.pageIdx >= total - 1;
    for (const id of ['prev-top','prev-bottom']) $(id).disabled = atStart;
    for (const id of ['next-top','next-bottom']) $(id).disabled = atEnd;
}

function renderPage() {
    const root = $('findings');
    const origPage = (state.data.pages || [])[state.pageIdx];
    if (!origPage) {
        root.innerHTML = '<p class="placeholder">No findings yet. Re-run the pipeline.</p>';
        return;
    }
    // Apply current filter — wrap the original page with filtered rows so the
    // subsequent renderers don't need to know about filtering.
    const enabledBuckets = getEnabledBuckets();
    const filteredRows = (origPage.rows || []).filter(r => rowMatchesFilter(r, enabledBuckets));
    const filterApplied = filteredRows.length !== (origPage.rows || []).length;
    const page = { ...origPage, rows: filteredRows };
    let html = '';
    if (filterApplied) {
        html += `<div class="filter-status">showing ${filteredRows.length} of ${(origPage.rows||[]).length} rows after datasource filter</div>`;
    }
    html += `<div class="page-title-row">`
          + `<h2>${escapeHTML(page.title)}</h2>`
          + (page.explainer ? `<button class="info-btn" type="button" aria-label="what is this?" data-target="info-${state.pageIdx}">ⓘ</button>` : '')
          + `</div>`;
    // Hidden explainer panel (toggled by the info button)
    if (page.explainer) {
        html += `<div class="page-info" id="info-${state.pageIdx}" hidden>${escapeHTML(page.explainer)}</div>`;
    }
    if (page.subtitle) {
        html += `<p class="page-sub">${escapeHTML(page.subtitle)}</p>`;
    }

    // Bar-histogram render
    if (page.kind === 'doc_dates_year' || page.kind === 'mention_dates_year') {
        const maxBar = Math.max(1, ...page.rows.map(r => r.count));
        html += '<div class="histo">';
        for (const r of page.rows) {
            const pct = Math.max(2, Math.round(100 * r.count / maxBar));
            html += `<div class="histo-row">`
              + `<span class="histo-label">${escapeHTML(r.text)}</span>`
              + `<span class="histo-bar"><span class="histo-fill" style="width:${pct}%"></span></span>`
              + `<span class="histo-count">${r.count}</span>`
              + `</div>`;
        }
        html += '</div>';
        root.innerHTML = html;
        renderTOC();
        renderPagerLabels();
        history.replaceState(null, '', `#p=${state.pageIdx + 1}`);
        return;
    }

    // Email thread expanders
    if (page.kind === 'email_threads') {
        html += '<div class="thread-list">';
        for (const r of page.rows || []) {
            const fs = r.first_sent ? r.first_sent.slice(0,10) : '?';
            const ls = r.last_sent ? r.last_sent.slice(0,10) : '?';
            const fromList = (r.participants_from || []).slice(0,3).join(', ') || '—';
            html += `<details class="thread-card">`;
            html += `<summary>`
                  + `<span class="thread-rank">${r.rank}</span>`
                  + `<span class="thread-subject">${escapeHTML(r.subject)}</span>`
                  + `<span class="thread-count">${r.n_messages} msgs</span>`
                  + `<span class="thread-dates">${fs} → ${ls}</span>`
                  + `</summary>`;
            html += `<div class="thread-meta"><strong>senders:</strong> ${escapeHTML(fromList)} · <strong>datasets:</strong> ${(r.datasets_list||[]).join(', ')||'—'}</div>`;
            if (r.messages && r.messages.length) {
                html += `<table class="efta-table thread-msgs"><thead><tr>`
                      + `<th>#</th><th>sent</th><th>doc</th><th>from</th><th>to</th><th>subject</th>`
                      + `</tr></thead><tbody>`;
                r.messages.forEach((m, i) => {
                    const s = m.sent_iso ? m.sent_iso.slice(0,16).replace('T',' ') : '—';
                    html += `<tr>`
                          + `<td class="rank-cell">${i+1}</td>`
                          + `<td class="docs-cell">${escapeHTML(s)}</td>`
                          + `<td class="text-cell">${docLink(m.id)}</td>`
                          + `<td class="datasets-cell">${escapeHTML(m.from || '')}</td>`
                          + `<td class="datasets-cell">${escapeHTML(m.to || '')}</td>`
                          + `<td class="datasets-cell">${escapeHTML(m.subject || '')}</td>`
                          + `</tr>`;
                });
                html += `</tbody></table>`;
            }
            html += `</details>`;
        }
        html += '</div>';
        root.innerHTML = html;
        renderTOC(); renderPagerLabels(); bindInfoBtn();
        history.replaceState(null, '', `#p=${state.pageIdx + 1}`);
        return;
    }

    // Person dossier cards
    if (page.kind === 'person_dossier') {
        html += '<div class="person-list">';
        for (const p of page.rows || []) {
            const topDs = Object.entries(p.by_dataset || {}).sort((a,b)=>b[1]-a[1])[0];
            const yrs = Object.keys(p.by_year || {}).map(Number).sort((a,b)=>a-b);
            const wikiSlug = p.wiki ? p.wiki.slug : '';
            html += `<article class="person-card">`;
            html += `<header class="person-head">`;
            html += `<img class="person-thumb" data-wiki-slug="${escapeHTML(wikiSlug)}" alt="" loading="lazy">`;
            html += `<div class="person-info">`;
            html += `<h3 class="person-name">${escapeHTML(p.name)}</h3>`;
            html += `<p class="person-stats">${p.mentions.toLocaleString()} mentions · ${p.docs.toLocaleString()} docs`;
            if (topDs) html += ` · top: ${escapeHTML(topDs[0])} (${topDs[1]})`;
            html += `</p>`;
            if (p.wiki && p.wiki.url) {
                html += ` <a class="person-wiki" href="${escapeHTML(p.wiki.url)}" target="_blank" rel="noopener">wiki ↗</a>`;
            }
            html += `</div></header>`;
            // Year sparkline
            if (yrs.length) {
                const max = Math.max(...yrs.map(y => p.by_year[y]));
                html += `<div class="person-spark">`;
                for (const y of yrs) {
                    const c = p.by_year[y] || 0;
                    const pct = Math.max(5, Math.round(100 * c / max));
                    const era = y >= 2020 ? 'post' : 'pre';
                    html += `<span class="spark-bar histo-${era}" style="height:${pct}%" title="${y}: ${c}"></span>`;
                }
                html += `<span class="spark-yrange">${yrs[0]}–${yrs[yrs.length-1]}</span></div>`;
            }
            // Sample contexts
            if (p.samples && p.samples.length) {
                html += `<details class="person-samples"><summary>${p.samples.length} sample context${p.samples.length===1?'':'s'}</summary>`;
                for (const s of p.samples) {
                    const d = s.date ? s.date.slice(0,10) : '—';
                    html += `<blockquote class="person-sample">`
                          + `<div class="sample-meta">${docLink(s.doc_id)} · ${escapeHTML(s.dataset)} · ${escapeHTML(d)}</div>`
                          + `<div class="sample-context">…${escapeHTML(s.context)}…</div>`
                          + `</blockquote>`;
                }
                html += `</details>`;
            }
            html += `</article>`;
        }
        html += '</div>';
        root.innerHTML = html;
        renderTOC(); renderPagerLabels(); bindInfoBtn();
        // Lazy-load Wikipedia thumbnails after render
        loadWikiThumbs();
        history.replaceState(null, '', `#p=${state.pageIdx + 1}`);
        return;
    }

    // Topic-search render: year histogram at top, then per-match table
    if (page.kind === 'topic_search') {
        const by = page.by_year || {};
        const years = Object.keys(by).map(Number).sort((a,b)=>a-b);
        const dated = Object.values(by).reduce((a,b)=>a+b, 0);
        const total = (page.rows || []).length;
        const undated = total - dated;
        if (years.length) {
            const ymin = Math.min(...years), ymax = Math.max(...years);
            const filled = [];
            for (let y = ymin; y <= ymax; y++) filled.push([y, by[y] || 0]);
            const maxBar = Math.max(1, ...filled.map(([_,c])=>c));
            html += '<div class="topic-histo">';
            html += `<p class="topic-histo-label">matches by year — <strong>${dated} dated, ${undated} undated</strong> (histogram shows dated only). `
                  + 'Bars: <span class="pre2020">pre-2020</span> · <span class="post2020">2020+</span></p>';
            html += '<div class="histo">';
            for (const [y, c] of filled) {
                const pct = c ? Math.max(2, Math.round(100 * c / maxBar)) : 0;
                const era = y >= 2020 ? 'post' : 'pre';
                html += `<div class="histo-row">`
                  + `<span class="histo-label">${y}</span>`
                  + `<span class="histo-bar"><span class="histo-fill histo-${era}" style="width:${pct}%"></span></span>`
                  + `<span class="histo-count">${c}</span>`
                  + `</div>`;
            }
            html += '</div></div>';
        }
        html += '<table class="efta-table topic-table"><thead><tr>'
              + '<th>#</th><th>date</th><th>doc id</th><th>matched</th><th>context</th>'
              + '</tr></thead><tbody>';
        for (const r of page.rows || []) {
            const d = r.date ? r.date.slice(0,10) : '—';
            html += `<tr>`
                  + `<td class="rank-cell">${r.rank}</td>`
                  + `<td class="docs-cell">${escapeHTML(d)}</td>`
                  + `<td class="text-cell">${docLink(r.doc_id)}<br><small style="color:var(--ink-soft)">${escapeHTML(r.dataset || '')}</small></td>`
                  + `<td class="count-cell"><mark>${escapeHTML(r.matched)}</mark></td>`
                  + `<td class="datasets-cell">${escapeHTML(r.context)}</td>`
                  + `</tr>`;
        }
        html += '</tbody></table>';
        root.innerHTML = html;
        renderTOC(); renderPagerLabels(); bindInfoBtn();
        history.replaceState(null, '', `#p=${state.pageIdx + 1}`);
        return;
    }

    // iMessage chronological — visual divider when source doc (=session) changes
    if (page.kind === 'imessages') {
        html += '<div class="imsg-list">';
        let lastDoc = null;
        for (const r of page.rows || []) {
            if (r.doc_id && r.doc_id !== lastDoc) {
                html += `<div class="imsg-session-break">— session ${docLink(r.doc_id)} —</div>`;
                lastDoc = r.doc_id;
            }
            const cls = r.sender === 'epstein' ? 'imsg-jee' : 'imsg-other';
            html += `<div class="imsg ${cls}">`
                  + `<span class="imsg-ts">${escapeHTML(r.note || '?')}</span>`
                  + `<span class="imsg-sender">${escapeHTML(r.sender === 'epstein' ? 'JE' : '◼')}</span>`
                  + `<span class="imsg-body">${escapeHTML(r.text)}</span>`
                  + `</div>`;
        }
        html += '</div>';
        root.innerHTML = html;
        renderTOC();
        renderPagerLabels();
        history.replaceState(null, '', `#p=${state.pageIdx + 1}`);
        return;
    }

    // Verbatim quotes (samples + context) — collapsible "why this matters"
    if (page.kind === 'verbatim_quote') {
        html += '<div class="quote-list">';
        for (const r of page.rows || []) {
            const found = r.count > 0;
            const cls = found ? 'quote-hit' : 'quote-miss';
            html += `<article class="${cls}">`;
            html += `<header><span class="quote-rank">${r.rank}</span>`
                  + `<span class="quote-phrase">${escapeHTML(r.text)}</span>`
                  + `<span class="quote-counts">${r.count} hits / ${r.docs} docs</span></header>`;
            // Collapsible source + sample context
            if ((r.note && r.note.length) || (r.samples && r.samples.length)) {
                html += `<details class="quote-details"><summary>why this matters · ${r.samples ? r.samples.length : 0} sample${r.samples && r.samples.length===1?'':'s'}</summary>`;
                if (r.note && r.note.length) {
                    html += `<p class="quote-source"><em>${escapeHTML(r.note)}</em></p>`;
                }
                if (r.samples && r.samples.length) {
                    for (const s of r.samples) {
                        html += `<blockquote>`
                              + `<span class="quote-meta">[${docLink(s.doc_id)} · ${escapeHTML(s.dataset)}]</span>`
                              + `<br><span class="quote-context">…${escapeHTML(s.context)}…</span>`
                              + `</blockquote>`;
                    }
                }
                html += `</details>`;
            }
            html += '</article>';
        }
        html += '</div>';
        root.innerHTML = html;
        renderTOC();
        renderPagerLabels();
        history.replaceState(null, '', `#p=${state.pageIdx + 1}`);
        return;
    }

    // Default table render
    const showDatasets = !['ngram','tfidf','doc_dates_year','mention_dates_year','email_threads','ds10_financial'].includes(page.kind);
    const showNote = ['press_recreate','codeword_top','email_threads'].includes(page.kind);
    const showPeakDoc = page.kind === 'tfidf';
    html += '<table class="efta-table"><thead><tr>';
    html += '<th>#</th><th>text</th><th>count</th><th>docs</th>';
    if (showDatasets) html += '<th>datasets</th>';
    if (showPeakDoc)  html += '<th>peak doc</th>';
    if (showNote)     html += '<th>source</th>';
    html += '</tr></thead><tbody>';
    for (const r of page.rows || []) {
        html += '<tr>';
        html += `<td class="rank-cell">${r.rank}</td>`;
        html += `<td class="text-cell">${escapeHTML(r.text)}</td>`;
        html += `<td class="count-cell">${r.count}</td>`;
        html += `<td class="docs-cell">${r.docs ?? ''}</td>`;
        if (showDatasets) html += `<td class="datasets-cell">${escapeHTML(fmtDatasets(r.datasets))}</td>`;
        if (showPeakDoc)  html += `<td class="datasets-cell">${escapeHTML(r.peak_doc || '')}</td>`;
        if (showNote)     html += `<td class="datasets-cell">${escapeHTML(r.note || '')}</td>`;
        html += '</tr>';
    }
    html += '</tbody></table>';
    root.innerHTML = html;
    renderTOC();
    renderPagerLabels();
    bindInfoBtn();
    history.replaceState(null, '', `#p=${state.pageIdx + 1}`);
}

// Wire the ⓘ info button on the current page to toggle the explainer panel
function bindInfoBtn() {
    const btn = document.querySelector('.info-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        if (target) target.hidden = !target.hidden;
    });
}

function goto(i) {
    const total = (state.data.pages || []).length;
    state.pageIdx = Math.max(0, Math.min(total - 1, i));
    renderPage();
    window.scrollTo({ top: 0, behavior: 'instant' });
}

function setAllGroups(open) {
    document.querySelectorAll('.toc-group').forEach(d => { d.open = open; });
}

function bindNav() {
    $('prev-top').addEventListener('click', () => goto(state.pageIdx - 1));
    $('prev-bottom').addEventListener('click', () => goto(state.pageIdx - 1));
    $('next-top').addEventListener('click', () => goto(state.pageIdx + 1));
    $('next-bottom').addEventListener('click', () => goto(state.pageIdx + 1));
    $('toc-collapse-all').addEventListener('click', (e) => { e.preventDefault(); setAllGroups(false); });
    $('toc-expand-all').addEventListener('click', (e) => { e.preventDefault(); setAllGroups(true); });
    // Datasource filter — re-render current page whenever a checkbox flips
    document.querySelectorAll('.filter-chip input[type=checkbox]').forEach(cb => {
        cb.addEventListener('change', () => renderPage());
    });
    // Delegated doc-link clicks → open doc viewer
    document.body.addEventListener('click', (e) => {
        const a = e.target.closest('.doc-link');
        if (a) {
            e.preventDefault();
            openDocViewer(a.dataset.docId);
        }
    });
    // Doc viewer close
    $('doc-viewer-close').addEventListener('click', () => {
        $('doc-viewer').hidden = true;
    });
    window.addEventListener('keydown', (e) => {
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        // Esc closes doc viewer
        if (e.key === 'Escape' && !$('doc-viewer').hidden) {
            $('doc-viewer').hidden = true;
            return;
        }
        if (e.key === 'ArrowLeft') goto(state.pageIdx - 1);
        else if (e.key === 'ArrowRight') goto(state.pageIdx + 1);
    });
}

// Wikipedia thumbnail cache (slug -> url or null if 404)
const wikiThumbCache = new Map();
async function loadWikiThumbs() {
    const imgs = Array.from(document.querySelectorAll('img.person-thumb[data-wiki-slug]'));
    for (const img of imgs) {
        const slug = img.dataset.wikiSlug;
        if (!slug) continue;
        if (wikiThumbCache.has(slug)) {
            const url = wikiThumbCache.get(slug);
            if (url) img.src = url; else img.style.display = 'none';
            continue;
        }
        try {
            const r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`, { cache: 'force-cache' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();
            const url = data.thumbnail ? data.thumbnail.source : null;
            wikiThumbCache.set(slug, url);
            if (url) img.src = url; else img.style.display = 'none';
        } catch (e) {
            wikiThumbCache.set(slug, null);
            img.style.display = 'none';
        }
    }
}

// Cache fetched doc snippets to avoid re-fetching on re-open.
const docCache = new Map();
async function openDocViewer(docId) {
    if (!docId) return;
    const viewer = $('doc-viewer');
    $('doc-viewer-id').textContent = docId;
    $('doc-viewer-meta').textContent = 'loading…';
    $('doc-viewer-text').textContent = '';
    viewer.hidden = false;
    let doc = docCache.get(docId);
    if (!doc) {
        try {
            const r = await fetch(`docs/${encodeURIComponent(docId)}.json`, { cache: 'force-cache' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            doc = await r.json();
            docCache.set(docId, doc);
        } catch (e) {
            $('doc-viewer-meta').textContent = `(no snippet available — ${e.message})`;
            return;
        }
    }
    $('doc-viewer-meta').textContent =
        `dataset: ${doc.dataset} · ${doc.n_chars.toLocaleString()} chars · ${doc.n_words.toLocaleString()} words` +
        (doc.text.endsWith('…') ? ' · truncated to ~5KB' : '');
    $('doc-viewer-text').textContent = doc.text;
}

async function init() {
    bindNav();
    let data;
    try {
        const r = await fetch('findings.json', { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        data = await r.json();
    } catch (e) {
        $('findings').innerHTML =
            `<p class="placeholder">findings.json not loaded (${escapeHTML(e.message)}).</p>`;
        return;
    }
    state.data = data;
    const m = location.hash.match(/p=(\d+)/);
    if (m) state.pageIdx = Math.max(0, parseInt(m[1], 10) - 1);
    renderHeaderMeta();
    renderPage();
}

init();
