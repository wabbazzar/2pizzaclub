// /efta/ findings viewer. Loads findings.json and paginates pages array.

const $ = (id) => document.getElementById(id);

const state = {
    data: null,
    pageIdx: 0,
};

// Display order + label for each kind, when building the TOC.
const KIND_GROUP = {
    names_top20:        { order:  1, label: 'Top names — NER discovered' },
    names_grep:         { order:  2, label: 'Top names — curated grep (cross-check)' },
    topic_search:       { order:  3, label: 'Topic search' },
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
    const page = (state.data.pages || [])[state.pageIdx];
    if (!page) {
        root.innerHTML = '<p class="placeholder">No findings yet. Re-run the pipeline.</p>';
        return;
    }
    let html = '';
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
                  + `<td class="text-cell"><code>${escapeHTML(r.doc_id)}</code><br><small style="color:var(--ink-soft)">${escapeHTML(r.dataset || '')}</small></td>`
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

    // iMessage chronological
    if (page.kind === 'imessages') {
        html += '<div class="imsg-list">';
        for (const r of page.rows || []) {
            const cls = r.sender === 'epstein' ? 'imsg-jee' : 'imsg-other';
            html += `<div class="imsg ${cls}">`
                  + `<span class="imsg-ts">${escapeHTML(r.note || '?')}</span>`
                  + `<span class="imsg-sender">${escapeHTML(r.sender === 'epstein' ? 'JE' : '◼')}</span>`
                  + `<span class="imsg-body">${escapeHTML(r.text)}</span>`
                  + `<span class="imsg-doc">${escapeHTML(r.doc_id || '')}</span>`
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
                              + `<span class="quote-meta">[${escapeHTML(s.doc_id)} · ${escapeHTML(s.dataset)}]</span>`
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
    window.addEventListener('keydown', (e) => {
        // Don't hijack arrow keys when user is in a form field
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        if (e.key === 'ArrowLeft') goto(state.pageIdx - 1);
        else if (e.key === 'ArrowRight') goto(state.pageIdx + 1);
    });
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
