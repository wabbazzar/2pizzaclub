// tools/share-pages.mjs
//
// Generates the static "targeted share" surface for the gallery cinema —
// the starbird pattern, adapted to a no-build static site.
//
// A static host (GitHub Pages) can't vary og:image by query string, so for
// every theme we pre-generate a thin redirect page that carries its OWN
// og:image meta tag (pointing at a pre-rendered PNG) and bounces a human
// browser into the live cinema:
//
//   gallery/share/<theme>/index.html   <- og:image meta + JS/meta redirect
//   gallery/share/<theme>/card.png     <- the 1200x630 social card (variant A)
//   gallery/share/all/...              <- the unfiltered "whole cinema" share
//   gallery/share/manifest.json        <- the generated target set
//
// Crawlers (Slack, iMessage, Twitter, Facebook) read the meta tag before any
// JS runs and render the card; humans get redirected into
// /gallery/?cinema=1&themes=<theme>.
//
// The cinema share button (gallery/cinema.js) copies the /gallery/share/<theme>/
// link when a single theme is active, so the shared link unfurls with the card.
//
// Run with the dev-browser plugin's playwright install:
//   cd /home/wabbazzar/.claude/plugins/cache/dev-browser-marketplace/dev-browser/66682fb0513a/skills/dev-browser
//   node /home/wabbazzar/code/2pizzaclub/tools/share-pages.mjs
//
// Idempotent: re-running overwrites every card/page deterministically and prunes
// share dirs for themes that no longer exist. Safe for a nightly scribe pass.

import { chromium } from "playwright";
import * as fs from "node:fs";
import * as path from "node:path";
import { ROOT, computeCollections, humanizeTheme, runtimeLabel, cardHtml } from "./share-card.mjs";

const SITE = "https://2pizzaclub.com";
const VARIANT = "a"; // chosen design: navy "cinema marquee"
const SHARE_DIR = `${ROOT}/gallery/share`;
const SHARE_HEADLINE = "Someone wants to share a video collection with you";

function escAttr(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// The thin redirect/unfurl page for one target.
function redirectHtml({ topicLabel, count, seconds, slug }) {
    const videos = `${count} video${count === 1 ? "" : "s"}`;
    const runtime = runtimeLabel(seconds);
    const desc = `${topicLabel} — ${videos} · ${runtime}. Show me the receipts.`;
    const pageUrl = `${SITE}/gallery/share/${slug}/`;
    const imgUrl = `${pageUrl}card.png`;
    const cinemaUrl = slug === "all"
        ? `${SITE}/gallery/?cinema=1`
        : `${SITE}/gallery/?cinema=1&themes=${encodeURIComponent(slug)}`;
    const A = escAttr;
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${A(topicLabel)} — a video collection · 2pizzaclub</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="2pizzaclub.com">
<meta property="og:title" content="${A(SHARE_HEADLINE)}">
<meta property="og:description" content="${A(desc)}">
<meta property="og:url" content="${A(pageUrl)}">
<meta property="og:image" content="${A(imgUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${A(topicLabel)} — ${A(videos)}, ${A(runtime)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${A(SHARE_HEADLINE)}">
<meta name="twitter:description" content="${A(desc)}">
<meta name="twitter:image" content="${A(imgUrl)}">
<link rel="canonical" href="${A(cinemaUrl)}">
<meta http-equiv="refresh" content="0; url=${A(cinemaUrl)}">
<script>location.replace(${JSON.stringify(cinemaUrl)});</script>
<style>
  html,body{margin:0;height:100%;background:#1B3FB5;color:#FFF8E7;
    font-family:'Quicksand','Trebuchet MS',sans-serif;display:grid;place-items:center;text-align:center;padding:24px}
  a{color:#FFD93D}
</style>
</head>
<body>
<p>Opening the <strong>${A(topicLabel)}</strong> video collection…<br>
<a href="${A(cinemaUrl)}">tap here if it doesn't load.</a></p>
</body>
</html>
`;
}

async function main() {
    const { byTheme, captures } = computeCollections();

    // Build the target list: every theme + an "all" target for the unfiltered cinema.
    const targets = [];
    for (const [theme, e] of byTheme) {
        targets.push({ slug: theme, topicLabel: humanizeTheme(theme), count: e.count, seconds: e.seconds });
    }
    targets.sort((a, b) => a.slug.localeCompare(b.slug));
    const allSeconds = captures.reduce((s, c) => s + (c.seconds || 0), 0);
    targets.unshift({ slug: "all", topicLabel: "All threads", count: captures.length, seconds: allSeconds });

    fs.mkdirSync(SHARE_DIR, { recursive: true });

    const browser = await chromium.launch();
    try {
        // 1:1 so the committed PNG is exactly 1200x630, matching the og:image:width/height
        // declared in each share page (and a smaller repo footprint than a 2x render).
        const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
        for (const t of targets) {
            const dir = `${SHARE_DIR}/${t.slug}`;
            fs.mkdirSync(dir, { recursive: true });
            const html = cardHtml({ variant: VARIANT, topicLabel: t.topicLabel, count: t.count, seconds: t.seconds });
            await page.setContent(html, { waitUntil: "networkidle" });
            await page.evaluate(() => document.fonts.ready);
            await page.waitForTimeout(150);
            await page.screenshot({ path: `${dir}/card.png`, clip: { x: 0, y: 0, width: 1200, height: 630 } });
            fs.writeFileSync(`${dir}/index.html`, redirectHtml(t));
            console.log(`  ${t.slug.padEnd(22)} ${t.count} videos · ${runtimeLabel(t.seconds)}`);
        }
    } finally {
        await browser.close();
    }

    // Prune share dirs for targets that no longer exist (only dirs that look
    // like ours — i.e. contain a card.png — so unrelated content is never touched).
    const live = new Set(targets.map((t) => t.slug));
    for (const name of fs.readdirSync(SHARE_DIR)) {
        const dir = `${SHARE_DIR}/${name}`;
        if (!fs.statSync(dir).isDirectory()) continue;
        if (live.has(name)) continue;
        if (fs.existsSync(`${dir}/card.png`)) {
            fs.rmSync(dir, { recursive: true, force: true });
            console.log(`  pruned stale target: ${name}`);
        }
    }

    const manifest = {
        generated_variant: VARIANT,
        targets: targets.map((t) => ({ slug: t.slug, topic: t.topicLabel, count: t.count, seconds: t.seconds })),
    };
    fs.writeFileSync(`${SHARE_DIR}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`\nwrote ${targets.length} share targets → gallery/share/`);
}

main();
