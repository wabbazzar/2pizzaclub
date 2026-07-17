#!/usr/bin/env node
// font-guard.mjs — PostToolUse hook. Flags the two ways a wrong font ships on
// this site:
//
//   1. A hardcoded font-family. Every font must go through a brand token
//      (var(--mono) Schoolbell, var(--serif) Quicksand, var(--display) Caveat
//      Brush) — never a literal 'Arial' / 'Helvetica' / bare `sans-serif`.
//
//   2. The <button> Arial trap. Form controls (button/input/select/textarea)
//      do NOT inherit font-family from the page — a styled .whatever-card button
//      with no explicit font-family renders in the browser default (Arial),
//      jarring against the site's handwritten fonts. This is exactly what
//      shipped on the "Recently added" feed. Any interactive/button rule must
//      set font-family (or the sheet must carry a global button font reset).
//
// Reads the hook payload on stdin, inspects the edited .css file on disk, and
// exits 2 with a message (surfaced back to Claude) when it finds a violation.

import { readFileSync } from 'node:fs';

const APPROVED = /^(var\(--(mono|serif|display)\)|inherit|unset|initial)$/;

let payload = {};
try { payload = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }

// Scoped to the timeline stylesheet. The gallery (gallery/gallery.css) is a
// separate surface with its own font system (JetBrains Mono) — the brand tokens
// below don't govern it, so guarding it would only produce false positives.
const file = payload?.tool_input?.file_path || '';
if (!/(^|\/)styles\.css$/.test(file) || file.includes('/node_modules/')) process.exit(0);

let css;
try { css = readFileSync(file, 'utf8'); } catch { process.exit(0); }

// strip comments so we don't scan example/disabled code
const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
const problems = [];

// --- Check 1: hardcoded font-family values ---
for (const m of clean.matchAll(/font-family\s*:\s*([^;}]+)/g)) {
    const val = m[1].trim();
    if (!APPROVED.test(val)) {
        problems.push(`hardcoded font-family: "${val}" — use var(--mono|--serif|--display) instead`);
    }
}

// --- Check 2: button / interactive rules missing an explicit font ---
// If the sheet sets a font on the bare `button` element selector, controls
// inherit globally and class-based button rules are fine without their own.
const hasGlobalButtonFont = [...clean.matchAll(/([^{}]+)\{([^}]*)\}/g)].some(([, sel, body]) =>
    /(^|,|\s)(button|input|select|textarea)(\s|,|:|$)/.test(sel) && /font(-family)?\s*:/.test(body));

if (!hasGlobalButtonFont) {
    for (const [, sel, body] of clean.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
        const isButtonish = /(^|,|\s|>)(button|input|select|textarea)(\s|,|:|\[|$)/.test(sel)
            || /cursor\s*:\s*pointer/.test(body);
        const declaresFont = /font(-family)?\s*:/.test(body);
        // only care about blocks that actually paint text/appearance
        const paintsText = /(color|font-size|font-weight|text-|line-height|letter-spacing)\s*:/.test(body);
        if (isButtonish && paintsText && !declaresFont) {
            problems.push(`rule "${sel.trim().replace(/\s+/g, ' ').slice(0, 60)}" styles a button/interactive element but sets no font-family — it will fall back to Arial. Add font-family: var(--serif) (or --display).`);
        }
    }
}

if (problems.length) {
    console.error(`⚠ font-guard: ${file}\n` + problems.map((p) => `  • ${p}`).join('\n') +
        `\nBrand fonts only: var(--mono) Schoolbell · var(--serif) Quicksand · var(--display) Caveat Brush.`);
    process.exit(2);
}
process.exit(0);
