#!/usr/bin/env node
// tools/normalize-captures.mjs
//
// Rebuild delivery reel.webm files from PRISTINE originals — non-destructively.
//
// For each capture: ensure reel.orig.mkv exists (pull it from Instagram via yt-dlp
// if missing), then derive reel.webm from it ONCE (VP9 copied, audio normalized to
// -16 LUFS / -1.5 dBTP off the source AAC). Because the delivery is always derived
// from the immutable original and never from the previous reel.webm, running this
// repeatedly is idempotent — it can no longer stack lossy opus generations the way
// the old in-place loudnorm did.
//
// Usage:
//   node tools/normalize-captures.mjs                 # every capture in the manifest
//   node tools/normalize-captures.mjs <id> [<id>...]  # specific ids only
//   node tools/normalize-captures.mjs --redownload    # re-pull originals even if present
//   node tools/normalize-captures.mjs --cookies-from-browser=SPEC
//   node tools/normalize-captures.mjs --dry-run       # report plan, change nothing

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { deriveDeliveryWebm } from "./normalize-audio.mjs";
import { downloadOriginal, ytDlpVersion } from "./reel-media.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CAPS_DIR = `${ROOT}/sources/captures`;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const redownload = args.includes("--redownload");
const cookiesHit = args.find((a) => a.startsWith("--cookies-from-browser="));
const COOKIES = cookiesHit ? cookiesHit.slice("--cookies-from-browser=".length) : null;
const explicit = args.filter((a) => !a.startsWith("--"));

const manifest = JSON.parse(fs.readFileSync(`${CAPS_DIR}/manifest.json`, "utf8"));
const ids = explicit.length ? explicit : (manifest.captures || []);

console.log(`==== rebuild ${ids.length} delivery files from originals (dry-run=${dryRun}, redownload=${redownload}) ====`);
console.log(`     yt-dlp: ${ytDlpVersion()}\n`);

let ok = 0;
const errs = [];

for (const id of ids) {
    const dir = `${CAPS_DIR}/${id}`;
    const orig = `${dir}/reel.orig.mkv`;
    const webm = `${dir}/reel.webm`;
    const url = (() => {
        try { return JSON.parse(fs.readFileSync(`${dir}/meta.json`, "utf8")).url; }
        catch { return null; }
    })() || `https://www.instagram.com/reel/${id}/`;

    try {
        const haveOrig = fs.existsSync(orig);
        if (dryRun) {
            const plan = (!haveOrig || redownload) ? "download original + derive" : "derive from existing original";
            console.log(`  ${id}: ${plan}`);
            continue;
        }
        if (!haveOrig || redownload) {
            const dl = downloadOriginal(url, dir, { maxShort: 720, force: redownload, cookiesFromBrowser: COOKIES });
            process.stdout.write(`  ${id}: ${dl.skipped ? "orig present" : "pulled original"} → `);
        } else {
            process.stdout.write(`  ${id}: orig present → `);
        }
        const d = deriveDeliveryWebm(orig, webm);
        console.log(`derived (${d.videoMode}, audio TP ${d.input.TP}→${d.output.TP} dBTP)`);
        ok++;
    } catch (e) {
        errs.push({ id, msg: e.message });
        console.warn(`  ${id}: FAILED — ${e.message.slice(0, 200)}`);
    }
}

if (!dryRun) {
    console.log(`\n==== summary ====`);
    console.log(`  rebuilt: ${ok}`);
    console.log(`  errors:  ${errs.length}`);
    for (const e of errs) console.log(`    ${e.id}: ${e.msg.slice(0, 120)}`);
}
