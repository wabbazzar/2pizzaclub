// /efta/ findings viewer.
// Loads findings.json (built by portadoc/scripts/efta/export_findings.py) and
// paginates the pages array with prev/next + a TOC.

const $ = (id) => document.getElementById(id);

const state = {
    data: null,
    pageIdx: 0,
};

const KIND_LABEL = {
    names_top20: 'names',
    label_top: 'label',
    email_top: 'emails',
    press_recreate: 'press recreate',
    codeword_top: 'code language',
    doc_dates_year: 'doc dates',
    mention_dates_year: 'mention dates',
    cooccur_pairs: 'co-occurrence',
    tfidf: 'tf-idf',
    ngram: 'n-gram',
};

function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
    }[c]));
}

function fmtDatasets(d) {
    if (!d) return '';
    const entries = Object.entries(d).sort((a, b) => b[1] - a[1]);
    return entries.map(([k, v]) => `${k}:${v}`).join('  ');
}

function renderMeta() {
    const c = state.data.corpus || {};
    $('meta-docs').textContent = `documents: ${c.n_documents ?? '—'}`;
    $('meta-hits').textContent = `entity hits: ${c.n_entity_hits ?? '—'}`;
    $('meta-datasets').textContent = `datasets: ${(c.datasets_present || []).join(', ') || '—'}`;
    const g = state.data.generated_at ? state.data.generated_at.slice(0, 10) : '—';
    $('meta-generated').textContent = `generated: ${g}`;
}

function renderTOC() {
    const chips = $('toc-chips');
    chips.innerHTML = '';
    const pages = state.data.pages || [];
    // Build short labels per page
    pages.forEach((p, i) => {
        let lbl;
        if (p.kind === 'names_top20') lbl = 'NAMES';
        else if (p.kind === 'label_top') lbl = `${p.label}·${p.page}`;
        else if (p.kind === 'ngram') lbl = `${p.n}-gram·${p.page}`;
        else lbl = String(i + 1);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'toc-chip' + (i === state.pageIdx ? ' active' : '');
        b.textContent = lbl;
        b.addEventListener('click', () => goto(i));
        chips.appendChild(b);
    });
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
    const subParts = [];
    subParts.push(`// ${KIND_LABEL[page.kind] || page.kind}`);
    if (page.label) subParts.push(`label: ${page.label}`);
    if (page.n) subParts.push(`n=${page.n}`);
    if (page.page) subParts.push(`page ${page.page}`);

    let html = '';
    html += `<h2>${escapeHTML(page.title)}</h2>`;
    if (page.subtitle) {
        html += `<p class="page-sub">${escapeHTML(subParts.join(' · '))} — ${escapeHTML(page.subtitle)}</p>`;
    } else {
        html += `<p class="page-sub">${escapeHTML(subParts.join(' · '))}</p>`;
    }

    // Bar-histogram render for date pages
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

    // Default table render
    const showDatasets = !['ngram','tfidf','doc_dates_year','mention_dates_year'].includes(page.kind);
    const showNote = ['press_recreate','codeword_top'].includes(page.kind);
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
    history.replaceState(null, '', `#p=${state.pageIdx + 1}`);
}

function goto(i) {
    const total = (state.data.pages || []).length;
    state.pageIdx = Math.max(0, Math.min(total - 1, i));
    renderPage();
    window.scrollTo({ top: 0, behavior: 'instant' });
}

function bindNav() {
    $('prev-top').addEventListener('click', () => goto(state.pageIdx - 1));
    $('prev-bottom').addEventListener('click', () => goto(state.pageIdx - 1));
    $('next-top').addEventListener('click', () => goto(state.pageIdx + 1));
    $('next-bottom').addEventListener('click', () => goto(state.pageIdx + 1));
    window.addEventListener('keydown', (e) => {
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
            `<p class="placeholder">findings.json not loaded (${escapeHTML(e.message)}).<br>` +
            `Run <code>bash ~/code/portadoc/scripts/efta/run_pipeline.sh</code> ` +
            `then <code>cp ~/data/epstein-files/work/findings.json ./</code>.</p>`;
        return;
    }
    state.data = data;
    // Honor #p=N deep-link
    const m = location.hash.match(/p=(\d+)/);
    if (m) state.pageIdx = Math.max(0, parseInt(m[1], 10) - 1);
    renderMeta();
    renderPage();
}

init();
