#!/usr/bin/env node
// tools/ingest-reel.mjs
//
// One-shot ingest of an Instagram reel into the receipts pipeline.
//
// Usage:
//   node tools/ingest-reel.mjs <SHORTCODE>            # full pipeline
//   node tools/ingest-reel.mjs <URL>                  # accepts full URL too
//   node tools/ingest-reel.mjs <SHORTCODE> --skip-capture     # reuse reel.orig.mkv
//   node tools/ingest-reel.mjs <SHORTCODE> --force-download   # re-pull the original
//   node tools/ingest-reel.mjs <SHORTCODE> --skip-transcribe
//   node tools/ingest-reel.mjs <SHORTCODE> --cookies-from-browser=chromium:<profile>
//
// Steps:
//   1. yt-dlp → pristine original media (reel.orig.mkv: best ≤720 VP9 + source AAC)
//      and complete metadata (caption, handle, display name, date, likes, comments)
//   2. derive delivery reel.webm from the original ONCE — VP9 copied, audio
//      normalized to -16 LUFS / -1.5 dBTP (single opus generation off the AAC)
//   3. ffmpeg → audio (wav, mono 16k for whisper) from the original
//   4. ffmpeg → frames at 0.5fps under frames/ from the original
//   5. whisper → transcript.{txt,srt,vtt,json}
//   6. write/merge meta.json (machine fields refreshed, editorial fields preserved)
//   7. add capture id to sources/captures/manifest.json
//
// reel.orig.mkv is the pristine source of truth and is kept LOCAL (gitignored,
// regenerable via yt-dlp). Delivery is always derived from it, never re-encoded
// in place — re-running ingest cannot degrade the audio.
//
// Dependencies (machine-local):
//   - yt-dlp (CURRENT build; see tools/reel-media.mjs for the install one-liner)
//   - ffmpeg + ffprobe in PATH
//   - whisper at /tmp/whisper-venv (python3 -m venv + pip install openai-whisper)
//
// No headless browser / Playwright needed anymore.

import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveDeliveryWebm } from "./normalize-audio.mjs";
import { fetchMeta, downloadOriginal, ytDlpVersion } from "./reel-media.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CAPS_DIR = `${ROOT}/sources/captures`;
const WHISPER = "/tmp/whisper-venv/bin/whisper";

// ---------- argument parsing ----------
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--") && !a.includes("=")));
const positional = args.filter((a) => !a.startsWith("--"));
const inputArg = positional[0];
if (!inputArg) {
    console.error("usage: ingest-reel.mjs <SHORTCODE|URL> [--skip-capture] [--force-download] [--skip-transcribe] [--model=base.en] [--cookies-from-browser=SPEC]");
    process.exit(1);
}
let shortcode;
const urlMatch = inputArg.match(/instagram\.com\/reel\/([A-Za-z0-9_-]+)/);
if (urlMatch) shortcode = urlMatch[1];
else if (/^[A-Za-z0-9_-]+$/.test(inputArg)) shortcode = inputArg;
else { console.error(`invalid input: ${inputArg}`); process.exit(1); }

const valFlag = (name) => {
    const hit = args.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(`--${name}=`.length) : null;
};
const WHISPER_MODEL = valFlag("model") || "base.en";
const COOKIES = valFlag("cookies-from-browser");

const REEL_URL = `https://www.instagram.com/reel/${shortcode}/`;
const outDir = `${CAPS_DIR}/${shortcode}`;
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(`${outDir}/frames`, { recursive: true });

console.log(`==== ingest-reel: ${shortcode} ====`);
console.log(`     url: ${REEL_URL}`);
console.log(`     out: ${outDir}`);
console.log(`     model: ${WHISPER_MODEL}   yt-dlp: ${ytDlpVersion()}`);

// ---------- ffmpeg helpers ----------
function runOrThrow(cmd, a) {
    const r = spawnSync(cmd, a, { stdio: ["ignore", "ignore", "pipe"] });
    if (r.status !== 0) throw new Error(`${cmd} ${a.join(" ")} failed: ${r.stderr?.toString().slice(0, 500)}`);
}
function extractAudio(srcPath, wavPath) {
    runOrThrow("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", srcPath, "-vn", "-ac", "1", "-ar", "16000", wavPath]);
}
function extractFrames(srcPath, framesDir) {
    runOrThrow("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", srcPath, "-vf", "fps=0.5", `${framesDir}/f%03d.png`]);
}

// ---------- whisper ----------
function transcribe(wavPath, outDir, model) {
    const r = spawnSync(WHISPER, [wavPath, "--model", model, "--output_format", "all", "--output_dir", outDir, "--language", "en", "--fp16", "False"], {
        stdio: ["ignore", "ignore", "pipe"]
    });
    if (r.status !== 0) throw new Error(`whisper failed: ${r.stderr?.toString().slice(0, 500)}`);
}

// ---------- starter meta.json ----------
//
// Consumer-facing reminder: every field the gallery surfaces to readers
// (audio_track_actual, video_overlay_text_observed, audio_content_summary,
// implied_frame) MUST be third-person factual prose — no "TODO:" markers, no
// second-person address, no repo paths / record IDs / workflow steps. Empty is
// fine; the gallery skips empty strings.
function writeStarterMeta(shortcode, parsed, status) {
    const metaPath = `${CAPS_DIR}/${shortcode}/meta.json`;
    // Re-running ingest must NOT clobber the hand-written editorial pass. Merge
    // onto any existing meta: refresh machine-derived fields, keep a fresh OG
    // value only when we got one, preserve every editorial / custom field.
    const prev = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, "utf8")) : {};
    const isEmpty = (x) => x === null || x === undefined || x === "" || (Array.isArray(x) && x.length === 0);
    const fresh = (next, prior) => (isEmpty(next) ? prior : next);

    const meta = {
        ...prev,
        id: shortcode,
        url: `https://www.instagram.com/reel/${shortcode}/`,
        platform: "instagram",
        captured_at: prev.captured_at ?? new Date().toISOString().slice(0, 10),
        handle: fresh(parsed.handle, prev.handle ?? null),
        author_display_name: fresh(parsed.author, prev.author_display_name ?? null),
        posted_at: fresh(parsed.posted_at, prev.posted_at ?? null),
        engagement: fresh(parsed.engagement, prev.engagement ?? null),
        caption: fresh(parsed.caption, prev.caption ?? null),
        hashtags: fresh(parsed.hashtags, prev.hashtags ?? []),
        audio_track_actual: prev.audio_track_actual ?? "",
        video_overlay_text_observed: prev.video_overlay_text_observed ?? "",
        audio_content_summary: prev.audio_content_summary ?? "",
        implied_frame: prev.implied_frame ?? "",
        capture_method: "Pristine original media + metadata pulled from Instagram's CDN via yt-dlp; delivery webm derived once (VP9 video copied, audio normalized to -16 LUFS / -1.5 dBTP off the source AAC — no re-recording, no in-place re-encode).",
        video_download_status: status || (prev.video_download_status ?? ""),
        audio_transcription_status: "Transcribed with openai-whisper.",
        evidence_records: prev.evidence_records ?? [],
        supporting_research_links: prev.supporting_research_links ?? []
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 4) + "\n");
}

function writeTranscriptWrapper(shortcode, model) {
    const raw = fs.readFileSync(`${CAPS_DIR}/${shortcode}/reel-audio.txt`, "utf8");
    // Consumer-facing: loaded into the gallery's transcript drawer. Editorial
    // review (proper-noun fixes, miss-hears) belongs in a "Transcription notes"
    // section added during the editorial pass — not as a TODO marker.
    const wrapped = `Source: reel.orig.mkv (Instagram original)
Audio: source AAC extracted to 16kHz mono WAV
Transcribed: ${new Date().toISOString().slice(0, 10)}, openai-whisper ${model}

— FULL TEXT —

${raw.trim()}

— END —
`;
    fs.writeFileSync(`${CAPS_DIR}/${shortcode}/transcript.txt`, wrapped);
}

// ---------- manifest ----------
function addToCapturesManifest(shortcode) {
    const p = `${CAPS_DIR}/manifest.json`;
    const m = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!m.captures.includes(shortcode)) {
        m.captures.push(shortcode);
        fs.writeFileSync(p, JSON.stringify(m, null, 4) + "\n");
        console.log(`     manifest: added ${shortcode}`);
    } else {
        console.log(`     manifest: ${shortcode} already present`);
    }
}

const MB = (bytes) => (bytes / 1_000_000).toFixed(1);

// ---------- main ----------
async function main() {
    const origPath = `${outDir}/reel.orig.mkv`;
    const webmPath = `${outDir}/reel.webm`;
    const wavPath = `${outDir}/reel-audio.wav`;

    let parsed = { handle: null, author: null, caption: null, hashtags: [], posted_at: null, engagement: null, duration: null };

    if (!flags.has("--skip-capture")) {
        console.log("[1/6] fetch original + metadata (yt-dlp)…");
        parsed = fetchMeta(REEL_URL, { cookiesFromBrowser: COOKIES });
        const dl = downloadOriginal(REEL_URL, outDir, { maxShort: 720, force: flags.has("--force-download"), cookiesFromBrowser: COOKIES });
        console.log(`     ${dl.skipped ? "reusing" : "downloaded"} reel.orig.mkv (${MB(fs.statSync(origPath).size)} MB)`);
        console.log(`     handle: ${parsed.handle}   posted: ${parsed.posted_at}   likes: ${parsed.engagement?.likes ?? "?"}`);
    } else {
        if (!fs.existsSync(origPath)) throw new Error(`--skip-capture but no ${origPath} (run without --skip-capture to download it)`);
        console.log("[1/6] capture skipped (using existing reel.orig.mkv)");
        try { parsed = fetchMeta(REEL_URL, { cookiesFromBrowser: COOKIES }); }
        catch (e) { console.warn(`     (metadata refresh skipped: ${e.message.slice(0, 120)})`); }
    }

    console.log("[2/6] derive delivery webm (video copy + single-pass loudness)…");
    const d = deriveDeliveryWebm(origPath, webmPath);
    console.log(`     video: ${d.videoMode}   audio: I ${d.input.I}→${d.output.I} LUFS, TP ${d.input.TP}→${d.output.TP} dBTP`);
    const status = `Original pulled via yt-dlp (~${MB(fs.statSync(origPath).size)} MB); delivery ~${MB(fs.statSync(webmPath).size)} MB webm`
        + (parsed.duration ? `, ${Math.round(parsed.duration)}s.` : ".");

    console.log("[3/6] extract audio for whisper (ffmpeg)…");
    extractAudio(origPath, wavPath);

    console.log("[4/6] extract frames (ffmpeg @ 0.5fps)…");
    extractFrames(origPath, `${outDir}/frames`);
    console.log(`     ${fs.readdirSync(`${outDir}/frames`).length} frames`);

    if (!flags.has("--skip-transcribe")) {
        console.log(`[5/6] transcribe (whisper ${WHISPER_MODEL}, may take 1–3 min)…`);
        transcribe(wavPath, outDir, WHISPER_MODEL);
        console.log("     transcript written");
    } else {
        console.log("[5/6] transcribe skipped");
    }

    console.log("[6/6] write meta.json + transcript wrapper + manifest…");
    writeStarterMeta(shortcode, parsed, status);
    if (fs.existsSync(`${outDir}/reel-audio.txt`)) writeTranscriptWrapper(shortcode, WHISPER_MODEL);
    addToCapturesManifest(shortcode);

    console.log("\n==== DONE ====");
    console.log(`  open: ${outDir}/transcript.txt`);
    console.log(`  edit: ${outDir}/meta.json`);
    console.log(`\nNext steps (editorial pass):`);
    console.log("  1. Read transcript.txt; sketch claims into Group A/B/C (verifiable / disputed / invented).");
    console.log("  2. For each Group A claim, write sources/evidence/<id>.json with sourced URLs.");
    console.log("  3. Add a `quote` field to the strongest primary source on each new record.");
    console.log("  4. Run clip-evidence.mjs against the new ids to generate inline clip screenshots.");
    console.log("  5. Update sources/evidence/manifest.json and the meta.json `evidence_records[]`.");
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
