#!/usr/bin/env node
// quality-guard.mjs — PostToolUse hook. Guards the site's non-negotiable brand
// + editorial tenets on edit, so drift gets caught at authoring time instead of
// on the live site. Exits 2 with a message (surfaced back to Claude) on a
// violation; silent otherwise.
//
// The tenets it enforces (see CLAUDE.md "Visual tone" + "Editorial voice" +
// "Timeline quality bar"):
//
//   VISUAL (styles.css, gallery/gallery.css — the surfaces on the brand token
//   system; the /efta document viewer and the /eating book run their own
//   design languages and are intentionally excluded):
//     • Fonts route through a token — var(--mono) Schoolbell (comic), var(--serif)
//       Quicksand (body), var(--display) Caveat Brush (headline), var(--code)
//       true-monospace (document ids). Never a hardcoded font stack.
//     • Buttons/interactive elements declare a font-family. Form controls don't
//       inherit the page font — an unset one renders Arial, which fights the
//       handwritten brand. (This is the bug that shipped on the Recently-added feed.)
//     • Colors stay on the mustard/navy/red/cream/ink palette via tokens. A raw
//       off-palette *chromatic* hex is flagged; pure grayscale (#000/#fff, video
//       letterbox, overlays) is allowed.
//
//   EDITORIAL (reader-facing text — evidence claims, narrative blurbs, index.html):
//     • No source-video reference. The timeline never says "the reel"/"the video"/
//       an instagram.com/reel link — the video is the gallery's subject, not the
//       timeline's. This is the single most-violated rule on ingest.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

let payload = {};
try { payload = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
const file = payload?.tool_input?.file_path || '';
if (!file) process.exit(0);

const problems = [];
const rel = file.replace(ROOT + '/', '');

// ------------------------------------------------------------------ helpers
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
function normHex(h) {
    let x = h.replace('#', '').toLowerCase();
    if (x.length === 3) x = x.split('').map((c) => c + c).join('');
    if (x.length === 4 || x.length === 8) x = x.slice(0, 6);   // drop alpha
    return x.length === 6 ? x : null;
}
const isGray = (h6) => h6[0] + h6[1] === h6[2] + h6[3] && h6[2] + h6[3] === h6[4] + h6[5];

// palette = every hex assigned to a custom property in the canonical stylesheet
function loadPalette() {
    const set = new Set();
    try {
        for (const m of readFileSync(join(ROOT, 'styles.css'), 'utf8')
            .matchAll(/--[\w-]+\s*:\s*(#[0-9a-fA-F]{3,8})/g)) {
            const n = normHex(m[1]); if (n) set.add(n);
        }
    } catch { /* no stylesheet — skip color check */ }
    return set;
}

// ------------------------------------------------------------------ CSS checks
const GUARDED_CSS = /(^|\/)(styles\.css|gallery\/gallery\.css)$/;
if (GUARDED_CSS.test(file) && !file.includes('/node_modules/')) {
    let css = '';
    try { css = stripComments(readFileSync(file, 'utf8')); } catch { css = ''; }

    // 1. hardcoded font-family
    for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/g)) {
        const val = m[1].trim();
        if (!/^(var\(--[\w-]+\)|inherit|unset|initial)$/.test(val)) {
            problems.push(`hardcoded font-family: "${val}" — route through var(--mono|--serif|--display|--code)`);
        }
    }

    // 2. button / interactive rule with no font-family (the Arial trap)
    const hasGlobalButtonFont = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].some(([, sel, body]) =>
        /(^|,|\s)(button|input|select|textarea)(\s|,|:|$)/.test(sel) && /font(-family)?\s*:/.test(body));
    if (!hasGlobalButtonFont) {
        for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
            const buttonish = /(^|,|\s|>)(button|input|select|textarea)(\s|,|:|\[|$)/.test(sel)
                || /cursor\s*:\s*pointer/.test(body);
            const paintsText = /(color|font-size|font-weight|text-|line-height|letter-spacing)\s*:/.test(body);
            if (buttonish && paintsText && !/font(-family)?\s*:/.test(body)) {
                problems.push(`rule "${sel.trim().replace(/\s+/g, ' ').slice(0, 60)}" styles a button/interactive element with no font-family — it falls back to Arial. Add font-family: var(--serif) (or --display).`);
            }
        }
    }

    // 3. off-palette chromatic hex color
    const palette = loadPalette();
    const noUrl = css.replace(/url\([^)]*\)/g, 'url()');   // ignore data-URI SVG art
    for (const line of noUrl.split('\n')) {
        if (/^\s*--[\w-]+\s*:/.test(line)) continue;       // a palette definition
        for (const m of line.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
            const n = normHex(m[0]);
            if (!n || isGray(n) || palette.has(n)) continue;
            problems.push(`off-palette color ${m[0]} — use a brand token (var(--accent), var(--bus-yellow), var(--ink)…). Palette: mustard/navy/red/cream/ink.`);
        }
    }
}

// ------------------------------------------------------------------ editorial checks
// The video is the gallery's subject; the timeline/reader surfaces never name it.
const VIDEO_RE = /\bthe reel\b|\bthis reel\b|\bsurfacing reel\b|\bper the reel\b|\bthe video\b|instagram\.com\/reel/i;
function scanVideo(text, where) {
    const m = text && text.match(VIDEO_RE);
    if (m) problems.push(`source-video reference "${m[0]}" in ${where} — reader-facing text never names the reel/video (gallery-only rule).`);
}

if (/sources\/evidence\/[^/]+\.json$/.test(file)) {
    try { scanVideo(JSON.parse(readFileSync(file, 'utf8')).claim, `${rel} claim`); } catch { /* skip */ }
} else if (/(^|\/)narrative\.json$/.test(file)) {
    try {
        const walk = (v) => typeof v === 'string' ? scanVideo(v, rel)
            : v && typeof v === 'object' ? Object.values(v).forEach(walk) : null;
        walk(JSON.parse(readFileSync(file, 'utf8')));
    } catch { /* skip */ }
} else if (/(^|\/)index\.html$/.test(file) && !file.includes('/gallery/')) {
    try { scanVideo(stripComments(readFileSync(file, 'utf8')), rel); } catch { /* skip */ }
}

// ------------------------------------------------------------------ report
if (problems.length) {
    console.error(`⚠ quality-guard: ${rel}\n` + problems.map((p) => `  • ${p}`).join('\n') +
        `\nBrand: fonts var(--mono|--serif|--display|--code) · palette mustard #FFD93D / navy #1B3FB5 / red #E63946 / cream #FFF8E7 / ink · reader text never names the source video.`);
    process.exit(2);
}
process.exit(0);
