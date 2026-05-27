// /efta/messages.html — searchable iMessages + reconstructed email threads.
// Data: messages.json (built by curate.mjs from the full pipeline output).

const $ = (id) => document.getElementById(id);

const state = {
    data: null,
    view: 'imessages',   // 'imessages' | 'threads'
    query: '',
    sender: 'all',       // 'all' | 'epstein' | 'counterpart'
};

function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
    }[c]));
}

function docLink(id) {
    if (!id) return '';
    return `<button class="doc-link" type="button" data-doc-id="${escapeHTML(id)}">${escapeHTML(id)}</button>`;
}

function matchesQuery(haystack, q) {
    if (!q) return true;
    return haystack.toLowerCase().includes(q);
}

// Escape HTML, then wrap case-insensitive matches of the query in <mark> so the
// exact (substring) hit is visible — search is a within-word substring match.
function highlight(text, q) {
    const safe = escapeHTML(text == null ? '' : String(text));
    if (!q) return safe;
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp(`(${esc})`, 'gi'), '<mark>$1</mark>');
}

// --- iMessages -----------------------------------------------------------
function filteredIMessages() {
    const q = state.query;
    return (state.data.imessages || []).filter(m => {
        if (state.sender !== 'all' && m.sender !== state.sender) return false;
        return matchesQuery(`${m.text} ${m.note || ''} ${m.doc_id || ''}`, q);
    });
}

function renderIMessages() {
    const rows = filteredIMessages();
    $('msg-count').textContent = `${rows.length.toLocaleString()} message${rows.length === 1 ? '' : 's'}`;
    if (!rows.length) {
        $('msg-results').innerHTML = '<p class="placeholder">No messages match.</p>';
        return;
    }
    let html = '<div class="imsg-list">';
    let lastDoc = null;
    for (const r of rows) {
        if (r.doc_id && r.doc_id !== lastDoc) {
            html += `<div class="imsg-session-break">— session ${docLink(r.doc_id)} —</div>`;
            lastDoc = r.doc_id;
        }
        const cls = r.sender === 'epstein' ? 'imsg-jee' : 'imsg-other';
        html += `<div class="imsg ${cls}">`
              + `<span class="imsg-ts">${highlight(r.note || '?', state.query)}</span>`
              + `<span class="imsg-sender">${escapeHTML(r.sender === 'epstein' ? 'JE' : '◼')}</span>`
              + `<span class="imsg-body">${highlight(r.text, state.query)}</span>`
              + `</div>`;
    }
    html += '</div>';
    $('msg-results').innerHTML = html;
}

// --- Email threads -------------------------------------------------------
function threadMatches(t, q) {
    if (!q) return true;
    if (matchesQuery(`${t.subject} ${(t.participants_from || []).join(' ')}`, q)) return true;
    return (t.messages || []).some(m => matchesQuery(`${m.subject || ''} ${m.from || ''} ${m.to || ''}`, q));
}

function renderThreads() {
    const q = state.query;
    const rows = (state.data.threads || []).filter(t => threadMatches(t, q));
    $('msg-count').textContent = `${rows.length} thread${rows.length === 1 ? '' : 's'}`;
    if (!rows.length) {
        $('msg-results').innerHTML = '<p class="placeholder">No threads match.</p>';
        return;
    }
    let html = '<div class="thread-list">';
    for (const r of rows) {
        const fs = r.first_sent ? r.first_sent.slice(0, 10) : '?';
        const ls = r.last_sent ? r.last_sent.slice(0, 10) : '?';
        const fromList = (r.participants_from || []).slice(0, 3).join(', ') || '—';
        html += `<details class="thread-card"${q ? ' open' : ''}>`;
        html += `<summary>`
              + `<span class="thread-rank">${r.rank}</span>`
              + `<span class="thread-subject">${highlight(r.subject, state.query)}</span>`
              + `<span class="thread-count">${r.n_messages} msgs</span>`
              + `<span class="thread-dates">${fs} → ${ls}</span>`
              + `</summary>`;
        html += `<div class="thread-meta"><strong>senders:</strong> ${escapeHTML(fromList)} · <strong>datasets:</strong> ${(r.datasets_list || []).join(', ') || '—'}</div>`;
        if (r.messages && r.messages.length) {
            html += `<table class="efta-table thread-msgs"><thead><tr>`
                  + `<th>#</th><th>sent</th><th>doc</th><th>from</th><th>to</th><th>subject</th>`
                  + `</tr></thead><tbody>`;
            r.messages.forEach((m, i) => {
                const s = m.sent_iso ? m.sent_iso.slice(0, 16).replace('T', ' ') : '—';
                html += `<tr>`
                      + `<td class="rank-cell">${i + 1}</td>`
                      + `<td class="docs-cell">${escapeHTML(s)}</td>`
                      + `<td class="text-cell">${docLink(m.id)}</td>`
                      + `<td class="datasets-cell">${highlight(m.from || '', state.query)}</td>`
                      + `<td class="datasets-cell">${highlight(m.to || '', state.query)}</td>`
                      + `<td class="datasets-cell">${highlight(m.subject || '', state.query)}</td>`
                      + `</tr>`;
            });
            html += `</tbody></table>`;
        }
        html += `</details>`;
    }
    html += '</div>';
    $('msg-results').innerHTML = html;
}

function render() {
    // Active-tab styling + sender-filter visibility
    document.querySelectorAll('.msg-tab').forEach(b => {
        b.classList.toggle('msg-tab-active', b.dataset.view === state.view);
    });
    $('msg-sender-filter').style.display = state.view === 'imessages' ? '' : 'none';
    if (state.view === 'imessages') renderIMessages();
    else renderThreads();
}

// --- Doc viewer (shared with the findings page) --------------------------
const docCache = new Map();
async function openDocViewer(docId) {
    if (!docId) return;
    const viewer = $('doc-viewer');
    $('doc-viewer-id').textContent = docId;
    $('doc-viewer-meta').textContent = 'loading…';
    $('doc-viewer-text').textContent = '';
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
    $('doc-viewer-meta').textContent =
        `dataset: ${doc.dataset} · ${doc.n_chars.toLocaleString()} chars · ${doc.n_words.toLocaleString()} words` +
        (doc.text.endsWith('…') ? ' · excerpt' : '');
    $('doc-viewer-text').textContent = doc.text;
}

function bind() {
    document.querySelectorAll('.msg-tab').forEach(b => {
        b.addEventListener('click', () => { state.view = b.dataset.view; render(); });
    });
    let t = null;
    $('msg-search').addEventListener('input', (e) => {
        clearTimeout(t);
        const v = e.target.value.trim().toLowerCase();
        t = setTimeout(() => { state.query = v; render(); }, 120);
    });
    document.querySelectorAll('input[name=sender]').forEach(r => {
        r.addEventListener('change', () => { state.sender = r.value; render(); });
    });
    document.body.addEventListener('click', (e) => {
        const a = e.target.closest('.doc-link');
        if (a) { e.preventDefault(); openDocViewer(a.dataset.docId); }
    });
    $('doc-viewer-close').addEventListener('click', () => $('doc-viewer').classList.remove('open'));
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') $('doc-viewer').classList.remove('open');
    });
}

async function init() {
    bind();
    try {
        const r = await fetch('messages.json', { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        state.data = await r.json();
    } catch (e) {
        $('msg-results').innerHTML = `<p class="placeholder">messages.json not loaded (${escapeHTML(e.message)}).</p>`;
        return;
    }
    const nMsg = (state.data.imessages || []).length;
    const nThread = (state.data.threads || []).length;
    $('meta-summary').textContent = `${nMsg.toLocaleString()} iMessages · ${nThread} email threads`;
    render();
}

init();
