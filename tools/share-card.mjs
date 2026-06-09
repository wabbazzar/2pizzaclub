// tools/share-card.mjs
//
// Pre-renders the social/OG "share card" PNG for a targeted cinema share —
// the image that unfurls when someone shares a theme-filtered gallery link
// (e.g. /gallery/?cinema=1&themes=september-11). Mirrors the starbird pattern:
// a static site can't vary og:image by query string, so we pre-generate one
// PNG per share target and a thin redirect HTML page that carries the og:image
// meta tag (see tools/share-pages.mjs, which calls into this).
//
// The card is "the standard sourced-timeline card" but the big headline reads
// "Someone wants to share a video collection with you" and it shows the topic
// + the total runtime of the filtered collection.
//
// Run with the dev-browser plugin's playwright install:
//   cd /home/wabbazzar/.claude/plugins/cache/dev-browser-marketplace/dev-browser/66682fb0513a/skills/dev-browser
//   node /home/wabbazzar/code/2pizzaclub/tools/share-card.mjs --theme september-11 --variant a --out /tmp/card.png
//
// Flags:
//   --theme <slug>     theme to summarize (required unless --headline-only)
//   --variant a|b      design variant (default a)
//   --out <path>       output PNG path (required)
//   --count <n>        override computed capture count
//   --seconds <n>      override computed total seconds

import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const META_TAGS = new Set(["contested", "evidence", "alt-theory", "documents"]);

// ---- data: replicate the gallery's capture→themes + duration computation off disk ----
function loadRec(id) {
    try { return JSON.parse(fs.readFileSync(`${ROOT}/sources/evidence/${id}.json`, "utf8")); }
    catch { return null; }
}

// Returns { byTheme: Map<theme, {count, seconds, captures:[]}>, captures: [...] }
export function computeCollections() {
    const capMan = JSON.parse(fs.readFileSync(`${ROOT}/sources/captures/manifest.json`, "utf8"));
    const capIds = capMan.captures || [];
    const byTheme = new Map();
    const captures = [];
    for (const cid of capIds) {
        let meta;
        try { meta = JSON.parse(fs.readFileSync(`${ROOT}/sources/captures/${cid}/meta.json`, "utf8")); }
        catch { continue; }
        const recs = (meta.evidence_records || []).map(loadRec).filter(Boolean);
        const themes = new Set();
        for (const r of recs) for (const t of (r.themes || [])) if (!META_TAGS.has(t)) themes.add(t);
        const m = (meta.video_download_status || "").match(/(\d+)s\b/);
        const seconds = m ? Number(m[1]) : 0;
        const cap = { id: cid, themes: [...themes], seconds };
        captures.push(cap);
        for (const t of themes) {
            if (!byTheme.has(t)) byTheme.set(t, { count: 0, seconds: 0, captures: [] });
            const e = byTheme.get(t);
            e.count++; e.seconds += seconds; e.captures.push(cid);
        }
    }
    return { byTheme, captures };
}

// ---- presentation helpers ----
const ACRONYMS = new Set(["ai", "fbi", "cia", "idf", "nsa", "doj", "ice", "gfc", "wmd", "un", "us", "uk", "eu", "foia", "efta", "adl", "aes", "sec"]);
const SPECIAL = { "9-11": "9/11", "september-11": "September 11", "big-tech": "Big Tech", "body-count": "Body Count", "mcafee": "McAfee" };

export function humanizeTheme(slug) {
    if (SPECIAL[slug]) return SPECIAL[slug];
    return slug.split("-").map((w) => ACRONYMS.has(w) ? w.toUpperCase() : (w[0]?.toUpperCase() || "") + w.slice(1)).join(" ");
}

export function runtimeLabel(seconds) {
    const m = Math.round(seconds / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60), rem = m % 60;
    return rem ? `${h} hr ${rem} min` : `${h} hr`;
}

// ---- the card HTML ----
const SHARE_HEADLINE = "Someone wants to share a video collection with you";

let LOGO_URI = null;
function logoDataUri() {
    if (LOGO_URI === null) {
        const svg = fs.readFileSync(`${ROOT}/icon.svg`, "utf8");
        LOGO_URI = "data:image/svg+xml;base64," + Buffer.from(svg, "utf8").toString("base64");
    }
    return LOGO_URI;
}

export function cardHtml({ variant, topicLabel, count, seconds }) {
    const logo = logoDataUri();
    const videos = `${count} video${count === 1 ? "" : "s"}`;
    const runtime = runtimeLabel(seconds);
    const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat+Brush&family=Quicksand:wght@400;500;600;700&family=Schoolbell&display=swap" rel="stylesheet">`;
    const palette = `--navy:#1B3FB5;--yellow:#FFD93D;--red:#E63946;--cream:#FFF8E7;--ink:#1A1A2E;
--display:'Caveat Brush','Marker Felt',cursive;--serif:'Quicksand','Trebuchet MS',sans-serif;--mono:'Schoolbell','Comic Sans MS',cursive;`;

    if (variant === "b") {
        // ---- Variant B: cream "ticket stub" — paper card, red rail, rotated topic stamp ----
        return `<!doctype html><html><head><meta charset="utf-8">${fonts}<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{${palette}}
html,body{width:1200px;height:630px;overflow:hidden}
.card{position:relative;width:1200px;height:630px;background:var(--cream);
  background-image:radial-gradient(var(--navy) 1.1px,transparent 1.1px);background-size:26px 26px;
  background-position:-6px -6px;font-family:var(--serif);color:var(--ink)}
.card::before{content:"";position:absolute;inset:34px;border:3px solid var(--navy);border-radius:14px}
.rail{position:absolute;left:34px;top:34px;bottom:34px;width:18px;background:var(--red);border-radius:14px 0 0 14px}
.wrap{position:absolute;inset:34px 34px 34px 52px;padding:48px 60px;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:16px}
.brand img{width:64px;height:64px}
.brand .wm{font-family:var(--mono);font-size:30px;color:var(--navy);letter-spacing:.5px}
.kicker{font-family:var(--mono);font-size:24px;color:var(--red);margin-top:auto;text-transform:uppercase;letter-spacing:1px}
.headline{font-family:var(--display);font-size:74px;line-height:.98;color:var(--ink);margin:10px 0 0;max-width:760px}
.meta{display:flex;align-items:center;gap:18px;margin-top:30px}
.stamp{font-family:var(--display);font-size:46px;color:var(--cream);background:var(--navy);
  padding:8px 26px 12px;border-radius:10px;transform:rotate(-3deg);box-shadow:5px 6px 0 rgba(26,26,46,.18)}
.runtime{font-family:var(--mono);font-size:30px;color:var(--ink)}
.runtime b{color:var(--red)}
.foot{position:absolute;right:70px;bottom:58px;font-family:var(--mono);font-size:21px;color:var(--navy);opacity:.85}
</style></head><body><div class="card"><div class="rail"></div><div class="wrap">
  <div class="brand"><img src="${logo}"><span class="wm">2pizzaclub.com</span></div>
  <div class="kicker">a video collection</div>
  <div class="headline">${SHARE_HEADLINE}</div>
  <div class="meta"><span class="stamp">${topicLabel}</span>
    <span class="runtime"><b>${videos}</b> · ${runtime}</span></div>
  <div class="foot">// the cinema · grouped by theme</div>
</div></div></body></html>`;
    }

    // ---- Variant A: navy "cinema marquee" — starfield, yellow ticket chip ----
    return `<!doctype html><html><head><meta charset="utf-8">${fonts}<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{${palette}}
html,body{width:1200px;height:630px;overflow:hidden}
.card{position:relative;width:1200px;height:630px;background:var(--navy);
  background-image:radial-gradient(circle,rgba(255,248,231,.9) 1.4px,transparent 1.5px),
    radial-gradient(circle,rgba(255,217,61,.55) 1.2px,transparent 1.3px);
  background-size:120px 120px,77px 77px;background-position:0 0,40px 30px;
  font-family:var(--serif);color:var(--cream)}
.card::before{content:"";position:absolute;inset:30px;border:3px dashed rgba(255,217,61,.55);border-radius:18px}
.wrap{position:absolute;inset:30px;padding:54px 64px;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:18px}
.brand img{width:70px;height:70px;filter:drop-shadow(0 4px 10px rgba(0,0,0,.35))}
.brand .wm{font-family:var(--mono);font-size:32px;color:var(--cream);letter-spacing:.5px}
.brand .wm b{color:var(--yellow)}
.headline{font-family:var(--display);font-size:80px;line-height:.96;margin:auto 0 0;max-width:840px;
  color:var(--cream);text-shadow:0 3px 0 rgba(0,0,0,.18)}
.ticket{display:inline-flex;align-items:center;gap:20px;margin-top:34px;align-self:flex-start;
  background:var(--yellow);color:var(--ink);border-radius:14px;padding:18px 30px;
  box-shadow:6px 7px 0 rgba(0,0,0,.28)}
.ticket .play{font-size:34px;color:var(--red)}
.ticket .topic{font-family:var(--display);font-size:48px;line-height:1}
.ticket .sep{width:3px;height:46px;background:rgba(26,26,46,.25);border-radius:3px}
.ticket .stat{font-family:var(--mono);font-size:27px;line-height:1.15}
.foot{position:absolute;right:64px;bottom:50px;font-family:var(--mono);font-size:22px;color:var(--yellow);opacity:.9}
</style></head><body><div class="card"><div class="wrap">
  <div class="brand"><img src="${logo}"><span class="wm"><b>2</b>pizzaclub.com</span></div>
  <div class="headline">${SHARE_HEADLINE}</div>
  <div class="ticket"><span class="play">▶</span>
    <span class="topic">${topicLabel}</span><span class="sep"></span>
    <span class="stat">${videos}<br>${runtime}</span></div>
  <div class="foot">// the cinema · grouped by theme</div>
</div></div></body></html>`;
}

export async function renderCard({ variant = "a", topicLabel, count, seconds, out }) {
    const html = cardHtml({ variant, topicLabel, count, seconds });
    const browser = await chromium.launch();
    try {
        const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
        await page.setContent(html, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(250);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
    } finally {
        await browser.close();
    }
    return out;
}

// ---- CLI ----
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
    const args = process.argv.slice(2);
    const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
    const theme = get("--theme");
    const variant = (get("--variant") || "a").toLowerCase();
    const out = get("--out");
    if (!theme || !out) { console.error("usage: --theme <slug> --variant a|b --out <path>"); process.exit(1); }
    const { byTheme } = computeCollections();
    const entry = byTheme.get(theme) || { count: 0, seconds: 0 };
    const count = get("--count") ? Number(get("--count")) : entry.count;
    const seconds = get("--seconds") ? Number(get("--seconds")) : entry.seconds;
    const topicLabel = humanizeTheme(theme);
    console.log(`rendering ${variant} · ${topicLabel} · ${count} videos · ${seconds}s → ${out}`);
    await renderCard({ variant, topicLabel, count, seconds, out });
    console.log("done");
}
