// /efta/ findings viewer. Loads findings.json and paginates pages array.

const $ = (id) => document.getElementById(id);

const state = {
    data: null,
    pageIdx: 0,
};

// Display order + label for each kind, when building the TOC.
const KIND_GROUP = {
    intro_slide:        { order:  0, label: 'Intro slides' },
    narrative_finding:  { order:  0.5, label: 'The deep read' },
    cross_reference:    { order:  0.75, label: 'Surfaced elsewhere — cross-reference' },
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
    doc_dates_year:     { order: 1.5, label: 'Doc-date histogram (corpus overview)' },
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

// Map a dataset name to one of the 5 filter buckets.
//   personal = parsed emails (DS11/12, emails/, dems-released 3-Emails)
//   estate   = House Oversight estate dump — mixed (emails, library scans, iMessages)
//   court    = court / police / grand jury text (DS3/4/6/7) + photo-only (DS1/2/5)
//   doj_feb  = DOJ Feb-2026 release (DS8)
//   ds9      = DOJ DS9 document scans (bates EFTA00039025–01262781, 531K docs)
//   financial= DS10 financial dossier
const DATASET_BUCKET = {
    dataset_3: 'court', dataset_4: 'court', dataset_6: 'court', dataset_7: 'court',
    dataset_11: 'personal', dataset_12: 'personal',
    emails: 'personal', dems: 'personal',
    estate: 'estate',
    dataset_8: 'doj_feb',
    dataset_9: 'ds9',
    dataset_10: 'financial',
    dataset_1: 'court', dataset_2: 'court', dataset_5: 'court',  // photo-only
};
function rowMatchesFilter(row, enabledBuckets) {
    // Per-row datasets dict (NER rank pages, press_recreate, codeword_top, etc.)
    if (row.datasets && Object.keys(row.datasets).length) {
        return Object.keys(row.datasets).some(ds => enabledBuckets.has(DATASET_BUCKET[ds] || 'other'));
    }
    // Person dossier uses `by_dataset`
    if (row.by_dataset && Object.keys(row.by_dataset).length) {
        return Object.keys(row.by_dataset).some(ds => enabledBuckets.has(DATASET_BUCKET[ds] || 'other'));
    }
    // datasets_list (email threads carry it as an array)
    if (Array.isArray(row.datasets_list) && row.datasets_list.length) {
        return row.datasets_list.some(ds => enabledBuckets.has(DATASET_BUCKET[ds] || 'other'));
    }
    // Single-dataset row (topic_search, imessages)
    if (row.dataset) {
        return enabledBuckets.has(DATASET_BUCKET[row.dataset] || 'other');
    }
    // No dataset info → keep visible
    return true;
}

// For person dossiers, recompute displayed mention/doc counts based on filter.
// Returns { mentions, docs, topDs } restricted to enabled buckets.
function filteredPersonCounts(p, enabledBuckets) {
    const by = p.by_dataset || {};
    let mentions = 0;
    let topDs = null;
    for (const [ds, n] of Object.entries(by)) {
        const bucket = DATASET_BUCKET[ds] || 'other';
        if (!enabledBuckets.has(bucket)) continue;
        mentions += n;
        if (!topDs || n > topDs[1]) topDs = [ds, n];
    }
    // We don't have per-dataset doc-set info, so docs becomes an estimate.
    // Approximate: scale total docs by (filtered_mentions / total_mentions).
    const totalMentions = p.mentions || 1;
    const docsApprox = Math.round((p.docs || 0) * mentions / totalMentions);
    return { mentions, docs: docsApprox, topDs };
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
    const pages = state.data.pages || [];
    const g = state.data.generated_at ? state.data.generated_at.slice(0, 10) : '';
    // "docs scanned" = the full-corpus figure the dossier pass reports. It lives
    // only inside the person_dossier subtitle ("N curated persons · M docs
    // scanned full corpus"), which the pipeline regenerates — so parse it from
    // there rather than trust the much-narrower corpus.n_documents subset.
    let docsLabel = `${c.n_documents ?? '—'} docs`;
    const dossier = pages.find(p => p.kind === 'person_dossier' && p.subtitle);
    const m = dossier && dossier.subtitle.match(/([\d,]+)\s*docs\s*scanned/i);
    if (m) docsLabel = `${Number(m[1].replace(/,/g, '')).toLocaleString()} docs scanned`;
    $('meta-summary').textContent = `${docsLabel} · ${pages.length} pages · ${g}`;
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
    renderPageBody();
    decorateDeck();
}

// Inject the deck chrome (fullscreen toggle + in-fullscreen pager) into #findings.
// Slides always get the fullscreen button so the reader can enter the deck. Data
// pages get the chrome only while already in fullscreen — so paging past the last
// slide flows straight into the dossier without dropping out of fullscreen.
function decorateDeck() {
    const root = $('findings');
    // Idempotent — strip any chrome from a previous pass so re-running on a
    // fullscreen change (Esc, the exit button) doesn't stack duplicates.
    root.querySelectorAll(':scope > .deck-fullscreen, :scope > .deck-nav').forEach(el => el.remove());
    const isSlide = root.classList.contains('findings-as-slide');
    const inFs = (document.fullscreenElement || document.webkitFullscreenElement) === root
              || root.classList.contains('is-pseudo-fullscreen');
    // Style the data page as a fullscreen deck slide only while actually fullscreen.
    root.classList.toggle('findings-fs', inFs && !isSlide);
    if (!isSlide && !inFs) return;

    const total = (state.data.pages || []).length;

    const fsBtn = document.createElement('button');
    fsBtn.type = 'button';
    fsBtn.className = 'deck-fullscreen' + (inFs ? ' is-fullscreen' : '');
    fsBtn.dataset.fsTarget = 'findings';
    fsBtn.setAttribute('aria-label', inFs ? 'exit fullscreen' : 'enter fullscreen');
    fsBtn.innerHTML = '<span class="deck-fs-glyph" aria-hidden="true">⛶</span>'
                    + `<span class="deck-fs-label">${inFs ? 'exit' : 'fullscreen'}</span>`;
    root.appendChild(fsBtn);

    // In-fullscreen prev/next — the only way to page in fullscreen, where the
    // pager (#efta-pager-*) is off-screen and iOS Safari has no keyboard for the
    // arrow-key handler. Shown only in fullscreen via CSS.
    const nav = document.createElement('div');
    nav.className = 'deck-nav';
    nav.innerHTML =
        `<button type="button" class="deck-nav-btn" data-deck-nav="prev" aria-label="previous page"${state.pageIdx === 0 ? ' disabled' : ''}>←</button>`
      + `<span class="deck-nav-label">${state.pageIdx + 1} / ${total}</span>`
      + `<button type="button" class="deck-nav-btn" data-deck-nav="next" aria-label="next page"${state.pageIdx >= total - 1 ? ' disabled' : ''}>→</button>`;
    root.appendChild(nav);
}

function renderPageBody() {
    const root = $('findings');
    const origPage = (state.data.pages || [])[state.pageIdx];
    if (!origPage) {
        root.innerHTML = '<p class="placeholder">No findings yet. Re-run the pipeline.</p>';
        return;
    }
    // Intro slide pages: clone the static slide article from #intro-deck into #findings.
    if (origPage.kind === 'intro_slide') {
        const src = document.querySelector(`#intro-deck .slide[data-slide-idx="${origPage.slideIdx}"]`);
        root.classList.add('findings-as-slide');
        root.innerHTML = '';
        if (src) {
            const clone = src.cloneNode(true);
            clone.removeAttribute('hidden');
            root.appendChild(clone);
        }
        renderTOC();
        renderPagerLabels();
        history.replaceState(null, '', `#p=${state.pageIdx + 1}`);
        return;
    }
    root.classList.remove('findings-as-slide');
    // Paging out of a slide into a data page no longer drops fullscreen — the deck
    // flows straight on. decorateDeck() (called after every render) keeps the
    // fullscreen pager available so the reader can keep paging, or exit.
    // Apply current filter — wrap the original page with filtered rows so the
    // subsequent renderers don't need to know about filtering.
    const enabledBuckets = getEnabledBuckets();
    // Aggregate page kinds compute their numbers across ALL sources at build time —
    // the filter would be misleading there. Flag them so the user knows.
    const AGGREGATE_KINDS = new Set(['ngram','tfidf','doc_dates_year','mention_dates_year']);
    const isAggregate = AGGREGATE_KINDS.has(origPage.kind);
    const filteredRows = isAggregate
        ? (origPage.rows || [])
        : (origPage.rows || []).filter(r => rowMatchesFilter(r, enabledBuckets));
    const filterApplied = !isAggregate && filteredRows.length !== (origPage.rows || []).length;
    const allBucketsOn = enabledBuckets.size === document.querySelectorAll('.filter-chip input').length;
    const page = { ...origPage, rows: filteredRows };
    let html = '';
    if (isAggregate && !allBucketsOn) {
        html += `<div class="filter-status filter-status-aggregate">datasource filter does <strong>not</strong> apply to this view — the totals here are computed across <em>all</em> sources at build time. Per-row dataset tagging would require re-running the n-gram / TF-IDF / date pipeline; that's a known limitation.</div>`;
    } else if (filterApplied) {
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
            const fc = filteredPersonCounts(p, enabledBuckets);
            // Filter-aware year breakdown: prefer per-(year, dataset) if present.
            let yearTotals = {};
            if (p.by_year_dataset) {
                for (const [y, ds] of Object.entries(p.by_year_dataset)) {
                    let s = 0;
                    for (const [d, n] of Object.entries(ds)) {
                        if (enabledBuckets.has(DATASET_BUCKET[d] || 'other')) s += n;
                    }
                    if (s > 0) yearTotals[y] = s;
                }
            } else {
                yearTotals = p.by_year || {};
            }
            const yrs = Object.keys(yearTotals)
                .map(Number)
                .filter(y => y >= 1990 && y <= 2026)
                .sort((a,b)=>a-b);
            const wikiSlug = p.wiki ? p.wiki.slug : '';
            html += `<article class="person-card">`;
            html += `<header class="person-head">`;
            html += `<img class="person-thumb" data-wiki-slug="${escapeHTML(wikiSlug)}" data-name="${escapeHTML(p.name)}" alt="" loading="lazy">`;
            html += `<div class="person-info">`;
            html += `<h3 class="person-name">${escapeHTML(p.name)}</h3>`;
            if (p.relation) {
                html += `<p class="person-relation">${escapeHTML(p.relation)}</p>`;
            }
            html += `<p class="person-stats">`;
            html += `${fc.mentions.toLocaleString()} mentions · ~${fc.docs.toLocaleString()} docs`;
            if (fc.topDs) html += ` · top: ${escapeHTML(fc.topDs[0])} (${fc.topDs[1]})`;
            if (fc.mentions !== p.mentions) {
                html += ` <span class="filtered-tag">(filter applied · full ${p.mentions.toLocaleString()})</span>`;
            }
            html += `</p>`;
            if (p.wiki && p.wiki.url) {
                html += `<a class="person-wiki" href="${escapeHTML(p.wiki.url)}" target="_blank" rel="noopener">wiki ↗</a>`;
            }
            html += `</div></header>`;
            // Year sparkline (filter-aware via yearTotals)
            if (yrs.length) {
                const max = Math.max(...yrs.map(y => yearTotals[y]));
                html += `<div class="person-spark">`;
                for (const y of yrs) {
                    const c = yearTotals[y] || 0;
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
        // Editorial context on top — what the hits actually are (news clippings,
        // legal boilerplate, OCR noise vs. genuine correspondence), so a raw
        // keyword count isn't misread as an assertion.
        if (page.editorial) {
            html += `<p class="topic-editorial">${escapeHTML(page.editorial)}</p>`;
        }
        // Prefer the per-(year, dataset) breakdown if present (filter-aware).
        // Fall back to total by_year if the data is older.
        let by = {};
        if (page.by_year_dataset) {
            for (const [y, dsCounts] of Object.entries(page.by_year_dataset)) {
                let sum = 0;
                for (const [ds, n] of Object.entries(dsCounts)) {
                    if (enabledBuckets.has(DATASET_BUCKET[ds] || 'other')) sum += n;
                }
                if (sum > 0) by[y] = sum;
            }
        } else {
            by = page.by_year || {};
        }
        const years = Object.keys(by).map(Number).sort((a,b)=>a-b);
        // Dated count: matches whose dataset is in an enabled bucket AND has a date.
        const dated = Object.values(by).reduce((a,b)=>a+b, 0);
        const total = (page.rows || []).length;  // already filtered above
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

    // Deep-read findings — one verified document quote per card
    if (page.kind === 'narrative_finding') {
        html += '<div class="finding-list">';
        for (const r of page.rows || []) {
            const rank = String(r.rank).padStart(2, '0');
            html += `<article class="finding-card">`
                  + `<header class="finding-head">`
                  + `<span class="finding-rank">${rank}</span>`
                  + `<h3 class="finding-headline">${escapeHTML(r.headline)}</h3>`
                  + `</header>`
                  + `<blockquote class="finding-quote">“${escapeHTML(r.quote)}”`
                  + (r.attribution ? `<cite class="finding-attr">— ${escapeHTML(r.attribution)}</cite>` : '')
                  + `</blockquote>`
                  + `<p class="finding-sig">${escapeHTML(r.significance)}</p>`
                  + `<div class="finding-meta">source: ${docLink(r.doc_id)} · ${escapeHTML(r.dataset || '')}</div>`
                  + `</article>`;
        }
        html += '</div>';
        root.innerHTML = html;
        renderTOC(); renderPagerLabels(); bindInfoBtn();
        history.replaceState(null, '', `#p=${state.pageIdx + 1}`);
        return;
    }

    // Cross-reference index — documents surfaced publicly, grouped by source.
    // Same card shell as the deep read; each card quotes one verbatim line and
    // links its source doc(s) into the unified viewer (text + original scan).
    if (page.kind === 'cross_reference') {
        for (const g of page.groups || []) {
            html += `<p class="xref-group-head">${escapeHTML(g.surfaced_in)}</p>`;
            html += '<div class="finding-list">';
            for (const r of g.rows || []) {
                const rank = String(r.rank).padStart(2, '0');
                const srcs = (r.sources || [])
                    .map(s => `${docLink(s.bates)} · ${escapeHTML(s.dataset || '')}`)
                    .join('<span class="finding-src-sep"> · </span>');
                const badge = r.label
                    ? `<span class="xref-badge">${escapeHTML(r.label)}</span>` : '';
                html += `<article class="finding-card">`
                      + `<header class="finding-head">`
                      + `<span class="finding-rank">${rank}</span>`
                      + `<h3 class="finding-headline">${escapeHTML(r.headline)}${badge}</h3>`
                      + `</header>`
                      + `<blockquote class="finding-quote">“${escapeHTML(r.quote)}”`
                      + (r.attribution ? `<cite class="finding-attr">— ${escapeHTML(r.attribution)}</cite>` : '')
                      + `</blockquote>`
                      + `<div class="finding-meta">source: ${srcs}</div>`
                      + `</article>`;
            }
            html += '</div>';
        }
        root.innerHTML = html;
        renderTOC(); renderPagerLabels(); bindInfoBtn();
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
            // Collapsible "why this matters" body + samples
            if ((r.significance && r.significance.length) || (r.note && r.note.length) || (r.samples && r.samples.length)) {
                html += `<details class="quote-details"><summary>why this matters · ${r.samples ? r.samples.length : 0} sample${r.samples && r.samples.length===1?'':'s'}</summary>`;
                if (r.significance && r.significance.length) {
                    html += `<p class="quote-significance">${escapeHTML(r.significance)}</p>`;
                }
                if (r.note && r.note.length) {
                    const sourceLine = r.url
                        ? `source: <a href="${escapeHTML(r.url)}" target="_blank" rel="noopener">${escapeHTML(r.note)}</a> ↗`
                        : `source: ${escapeHTML(r.note)}`;
                    html += `<p class="quote-source">${sourceLine}</p>`;
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
        if (showNote) {
            const noteText = escapeHTML(r.note || '');
            const cell = r.url
                ? `<a href="${escapeHTML(r.url)}" target="_blank" rel="noopener noreferrer">${noteText}</a>`
                : noteText;
            html += `<td class="datasets-cell">${cell}</td>`;
        }
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
    // In fullscreen, #findings is its own scroll container — reset it too so each
    // page starts at the top rather than wherever the last one was scrolled.
    $('findings').scrollTop = 0;
}

function setAllGroups(open) {
    document.querySelectorAll('.toc-group').forEach(d => { d.open = open; });
}

function bindNav() {
    $('prev-top').addEventListener('click', () => goto(state.pageIdx - 1));
    $('prev-bottom').addEventListener('click', () => goto(state.pageIdx - 1));
    $('next-top').addEventListener('click', () => goto(state.pageIdx + 1));
    $('next-bottom').addEventListener('click', () => goto(state.pageIdx + 1));
    // In-slide fullscreen nav (delegated — buttons are re-created on each render)
    document.body.addEventListener('click', (e) => {
        const nb = e.target.closest('[data-deck-nav]');
        if (!nb || nb.disabled) return;
        e.preventDefault();
        goto(state.pageIdx + (nb.dataset.deckNav === 'next' ? 1 : -1));
    });
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
    $('doc-viewer-close').addEventListener('click', closeDocViewer);
    // Re-sync the deck chrome whenever fullscreen toggles without a page change —
    // native Esc / the exit button (native) fire fullscreenchange; the iOS
    // pseudo-fullscreen exit (button or Esc, handled in intro-deck.js) doesn't, so
    // also refresh on the next frame after any .deck-fullscreen click and on Esc.
    document.addEventListener('fullscreenchange', decorateDeck);
    document.addEventListener('webkitfullscreenchange', decorateDeck);
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.deck-fullscreen')) requestAnimationFrame(decorateDeck);
    });
    window.addEventListener('keydown', (e) => {
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        if (e.key === 'Escape' && $('doc-viewer').classList.contains('open')) {
            closeDocViewer();
            return;
        }
        // Esc out of iOS pseudo-fullscreen (handled in intro-deck.js) — re-sync the
        // deck chrome on the next frame once that handler has dropped the class.
        if (e.key === 'Escape') requestAnimationFrame(decorateDeck);
        if (e.key === 'ArrowLeft') goto(state.pageIdx - 1);
        else if (e.key === 'ArrowRight') goto(state.pageIdx + 1);
    });
}

// Hand-curated portrait map (loaded once on first call).
let curatedPortraits = null;
async function getCuratedPortraits() {
    if (curatedPortraits !== null) return curatedPortraits;
    try {
        const r = await fetch('portraits.json', { cache: 'force-cache' });
        curatedPortraits = r.ok ? await r.json() : {};
    } catch (e) {
        curatedPortraits = {};
    }
    return curatedPortraits;
}

// Wikipedia thumbnail cache (slug -> url or null if not usable)
const wikiThumbCache = new Map();

// Returns true if the Wikipedia page returned is actually about the queried slug
// (rather than e.g. Sarah_Kellen → redirect → Jeffrey_Epstein).
function pageMatchesSlug(returnedTitle, queriedSlug) {
    if (!returnedTitle || !queriedSlug) return false;
    const norm = (s) => s.toLowerCase().replace(/[_\s\-]+/g, ' ').trim();
    const q = norm(queriedSlug);
    const t = norm(returnedTitle);
    // Allow disambig-suffixed pages like "Richard Kahn (economist)"
    return t === q || t.startsWith(q + ' ') || t.startsWith(q + '(');
}

// Fallback avatar — initials on a deterministic color — so no dossier card is
// ever blank when a photo can't be resolved (or is withheld for privacy).
function setMonogram(img) {
    const name = img.dataset.name || (img.dataset.wikiSlug || '?').replace(/_/g, ' ');
    const parts = name.trim().split(/\s+/);
    const initials = ((parts[0] || '?')[0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">`
        + `<rect width="120" height="120" fill="hsl(${h},42%,40%)"/>`
        + `<text x="60" y="60" font-family="Quicksand,sans-serif" font-size="46" font-weight="600" `
        + `fill="#FFF8E7" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    img.classList.add('person-thumb-monogram');
}

async function loadWikiThumbs() {
    const curated = await getCuratedPortraits();
    const imgs = Array.from(document.querySelectorAll('img.person-thumb[data-wiki-slug]'));
    for (const img of imgs) {
        const slug = img.dataset.wikiSlug;
        if (!slug) continue;
        // 1. Curated overrides win first (handles the Wikipedia-redirect cases)
        const personName = img.dataset.name || slug.replace(/_/g, ' ');
        if (curated[personName]) {
            img.src = curated[personName];
            continue;
        }
        if (wikiThumbCache.has(slug)) {
            const url = wikiThumbCache.get(slug);
            if (url) img.src = url; else setMonogram(img);
            continue;
        }
        try {
            // redirect=false stops the REST API from auto-following redirects, so we can
            // detect a mismatch (e.g. Sarah_Kellen -> Jeffrey_Epstein).
            const r = await fetch(
                `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}?redirect=false`,
                { cache: 'force-cache' }
            );
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();
            // If Wikipedia returned a different person's page, treat as no image.
            if (!pageMatchesSlug(data.title || '', slug)) {
                wikiThumbCache.set(slug, null);
                setMonogram(img);
                continue;
            }
            const url = data.thumbnail ? data.thumbnail.source : null;
            wikiThumbCache.set(slug, url);
            if (url) img.src = url; else setMonogram(img);
        } catch (e) {
            wikiThumbCache.set(slug, null);
            setMonogram(img);
        }
    }
}

// Cache fetched doc snippets to avoid re-fetching on re-open.
const docCache = new Map();
// Cache whether docs/<id>.pdf exists, so the viewer probes each doc only once.
const pdfPresence = new Map();

// The doc viewer is a <body>-level element, but the deck runs inside the
// Fullscreen API top layer (Android/desktop PWA) or an iOS pseudo-fullscreen
// overlay. A <body>-level sibling never paints over either, so doc links appear
// dead in the installed PWA. Relocate the viewer into the active fullscreen host
// while it's open, then restore it to <body> on close.
let docViewerHome = null;
function fullscreenHost() {
    return document.fullscreenElement
        || document.webkitFullscreenElement
        || document.querySelector('.is-pseudo-fullscreen')
        || null;
}
function closeDocViewer() {
    const viewer = $('doc-viewer');
    viewer.classList.remove('open');
    if (docViewerHome && viewer.parentNode !== docViewerHome) {
        docViewerHome.appendChild(viewer);
    }
    docViewerHome = null;
}
async function openDocViewer(docId) {
    if (!docId) return;
    const viewer = $('doc-viewer');
    $('doc-viewer-id').textContent = docId;
    $('doc-viewer-meta').textContent = 'loading…';
    $('doc-viewer-text').textContent = '';
    const host = fullscreenHost();
    if (host && !host.contains(viewer)) {
        docViewerHome = viewer.parentNode;
        host.appendChild(viewer);
    }
    viewer.classList.add('open');
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
    const metaEl = $('doc-viewer-meta');
    metaEl.innerHTML = '';
    const info = document.createElement('span');
    info.textContent =
        `dataset: ${doc.dataset} · ${doc.n_chars.toLocaleString()} chars · ${doc.n_words.toLocaleString()} words` +
        (doc.text.endsWith('…') ? ' · truncated to ~5KB' : '');
    metaEl.appendChild(info);
    $('doc-viewer-text').textContent = doc.text;
    // Unified viewer: offer the original DOJ scan whenever one is self-hosted
    // (efta/docs/<id>.pdf). Estate text docs have no scan — the HEAD 404s and no
    // link is shown. Result cached so re-opening a doc doesn't re-probe.
    let hasPdf = pdfPresence.get(docId);
    if (hasPdf === undefined) {
        try {
            const head = await fetch(`docs/${encodeURIComponent(docId)}.pdf`, { method: 'HEAD' });
            hasPdf = head.ok;
        } catch (e) { hasPdf = false; }
        pdfPresence.set(docId, hasPdf);
    }
    if (hasPdf) {
        const a = document.createElement('a');
        a.className = 'doc-viewer-pdf';
        a.href = `docs/${encodeURIComponent(docId)}.pdf`;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = 'open original scan ↗';
        metaEl.appendChild(a);
    }
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
    // Prepend the 4 intro slides as pages 1-4 (person dossier shifts to page 5).
    const INTRO_SLIDES = [
        { kind: 'intro_slide', slideIdx: 0, title: '01 / 04 — the brother on the record' },
        { kind: 'intro_slide', slideIdx: 1, title: '02 / 04 — three receipts, three people' },
        { kind: 'intro_slide', slideIdx: 2, title: '03 / 04 — the corridor' },
        { kind: 'intro_slide', slideIdx: 3, title: '04 / 04 — the price of the petition' },
    ];
    data.pages = [...INTRO_SLIDES, ...(data.pages || [])];
    // Inject the hand-authored cross-reference index (loaded separately so it
    // survives the nightly findings.json regeneration). Placed right after the
    // deep-read page if present, else after the intro slides.
    try {
        const cr = await fetch('crossref.json', { cache: 'no-store' });
        if (cr.ok) {
            const crj = await cr.json();
            if (crj && crj.page) {
                const nfIdx = data.pages.findIndex(p => p.kind === 'narrative_finding');
                const at = nfIdx >= 0 ? nfIdx + 1 : INTRO_SLIDES.length;
                data.pages.splice(at, 0, crj.page);
            }
        }
    } catch (e) { /* no crossref file is fine */ }
    state.data = data;
    const m = location.hash.match(/p=(\d+)/);
    if (m) state.pageIdx = Math.max(0, parseInt(m[1], 10) - 1);
    renderHeaderMeta();
    renderPage();
}

init();
