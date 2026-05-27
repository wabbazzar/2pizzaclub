// tools/reel-media.mjs
//
// Pull a reel's PRISTINE original media + metadata straight from Instagram's CDN
// via yt-dlp — no headless-browser re-recording, so the audio is the source AAC
// (single generation) instead of MediaRecorder opus stacked with normalize passes.
//
// yt-dlp also returns complete metadata (caption, handle, display name, post date,
// likes, comments, duration), which fully replaces the old og:* scrape, so ingest
// no longer needs Playwright/the dev-browser at all.
//
// Requires a CURRENT yt-dlp — Instagram's extractor breaks often. A stale build
// (e.g. the 2024.x system package) fails with "unable to extract shared data".
// Install the latest standalone binary to ~/.local/bin:
//   curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
//     -o ~/.local/bin/yt-dlp && chmod +x ~/.local/bin/yt-dlp
//
// Public reels resolve without auth. For login-gated reels, pass
// cookiesFromBrowser (e.g. "chromium:/path/to/profile") to reuse a logged-in
// session.

import { spawnSync } from "node:child_process";
import * as fs from "node:fs";

// Prefer the updated standalone binary in ~/.local/bin over any stale system one.
export const YTDLP = (() => {
    const local = `${process.env.HOME}/.local/bin/yt-dlp`;
    return fs.existsSync(local) ? local : "yt-dlp";
})();

export function ytDlpVersion() {
    const r = spawnSync(YTDLP, ["--version"], { stdio: ["ignore", "pipe", "ignore"] });
    return (r.stdout?.toString() || "").trim();
}

// Full metadata, no download. Returns the fields the meta.json skeleton needs.
export function fetchMeta(url, { cookiesFromBrowser = null } = {}) {
    const args = ["-j", "--no-warnings"];
    if (cookiesFromBrowser) args.push("--cookies-from-browser", cookiesFromBrowser);
    args.push(url);
    const r = spawnSync(YTDLP, args, { stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
    if (r.status !== 0) throw new Error(`yt-dlp -j failed: ${r.stderr?.toString().slice(-500)}`);
    const d = JSON.parse(r.stdout.toString());

    const handle = d.channel
        ? `@${d.channel}`
        : (d.uploader_url ? `@${d.uploader_url.split("/").filter(Boolean).pop()}` : null);
    const caption = d.description || "";
    const hashtags = Array.from(caption.matchAll(/#([A-Za-z0-9_]+)/g)).map((x) => x[1]);
    let posted_at = null;
    if (d.upload_date && /^\d{8}$/.test(d.upload_date)) {
        posted_at = `${d.upload_date.slice(0, 4)}-${d.upload_date.slice(4, 6)}-${d.upload_date.slice(6, 8)}`;
    }
    const engagement = (d.like_count != null || d.comment_count != null)
        ? { likes: d.like_count ?? null, comments: d.comment_count ?? null }
        : null;

    return {
        handle,
        author: d.uploader || null,
        caption,
        hashtags,
        posted_at,
        engagement,
        duration: d.duration ?? null
    };
}

// Download best video (short side ≤ maxShort) + original audio, muxed copy into
// reel.orig.mkv. Idempotent: skips if the original already exists unless force.
// Capping at ~720 keeps the delivery file lean; the audio is identical at any
// video rung, so this never touches audio quality.
export function downloadOriginal(url, outDir, { maxShort = 720, force = false, cookiesFromBrowser = null } = {}) {
    const out = `${outDir}/reel.orig.mkv`;
    if (fs.existsSync(out) && !force) return { path: out, skipped: true };

    // Portrait reels are W×H = 720×1280, so cap on the SHORT side (width for
    // portrait, height for landscape); fall back progressively if unavailable.
    // --remux-video mkv forces an mkv container even when a single progressive
    // format is chosen (no separate streams to merge) — a lossless container
    // change, so the reel.orig.mkv invariant always holds.
    const fmt = `bv*[width<=${maxShort}]+ba/bv*[height<=${maxShort}]+ba/bv*+ba/b`;
    const args = [
        "-f", fmt, "--merge-output-format", "mkv", "--remux-video", "mkv",
        "-o", `${outDir}/reel.orig.%(ext)s`, "--no-progress", "--no-warnings"
    ];
    if (force) args.push("--force-overwrites");
    if (cookiesFromBrowser) args.push("--cookies-from-browser", cookiesFromBrowser);
    args.push(url);

    const r = spawnSync(YTDLP, args, { stdio: ["ignore", "pipe", "pipe"] });
    if (r.status !== 0) {
        const tail = r.stderr?.toString().slice(-600) || "";
        const hint = /login|rate-limit|not available|empty media/i.test(tail)
            ? "\n  (login-gated, removed, or rate-limited — retry with cookiesFromBrowser, e.g. chromium:<profile>)"
            : "";
        throw new Error(`yt-dlp download failed: ${tail}${hint}`);
    }
    if (fs.existsSync(out)) return { path: out, skipped: false };
    // Tolerant fallback: yt-dlp produced a reel.orig.* in some other container.
    const alt = fs.readdirSync(outDir).find((f) => /^reel\.orig\.(mkv|mp4|webm|m4v)$/.test(f));
    if (alt) { fs.renameSync(`${outDir}/${alt}`, out); return { path: out, skipped: false }; }
    throw new Error(`yt-dlp finished but no reel.orig.* produced in ${outDir}`);
}
