#!/usr/bin/env node
// build-bundle.mjs — inline every evidence record + capture meta into a single
// bundle.json at the repo root.
//
// Why: the timeline used to fetch all ~274 evidence records AND ~100 capture
// metas as individual files (evidence.js serially, dag.js in parallel) — 500+
// HTTP requests per page load. This emits one file both consumers read instead.
//
// Run after any record/capture change (alongside build-rag-index.mjs):
//   node tools/build-bundle.mjs
//
// Deterministic: reads the same manifests the timeline renders, so bundle.json
// is authoritative iff it's regenerated. Consumers fall back to per-file fetches
// if a key is missing, so a stale bundle degrades gracefully rather than breaking.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = async (p) => JSON.parse(await readFile(join(ROOT, p), 'utf8'));

const evidenceManifest = await readJSON('sources/evidence/manifest.json');
const capturesManifest = await readJSON('sources/captures/manifest.json');

const recordFiles = evidenceManifest.records || [];
const captureIds = capturesManifest.captures || [];

const records = {};
let recOk = 0;
for (const fname of recordFiles) {
    try {
        records[fname] = await readJSON(`sources/evidence/${fname}`);
        recOk++;
    } catch (e) {
        console.warn(`  ! skip record ${fname}: ${e.message}`);
    }
}

const captures = {};
let capOk = 0;
for (const cid of captureIds) {
    try {
        captures[cid] = await readJSON(`sources/captures/${cid}/meta.json`);
        capOk++;
    } catch (e) {
        console.warn(`  ! skip capture ${cid}: ${e.message}`);
    }
}

const bundle = { records, captures };
await writeFile(join(ROOT, 'bundle.json'), JSON.stringify(bundle));

const bytes = Buffer.byteLength(JSON.stringify(bundle));
console.log(`bundle.json — ${recOk}/${recordFiles.length} records, ${capOk}/${captureIds.length} captures, ${(bytes / 1024).toFixed(0)} KB`);
