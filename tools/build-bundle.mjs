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
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = async (p) => JSON.parse(await readFile(join(ROOT, p), 'utf8'));

// Map every evidence record file to the date it FIRST entered git history, in
// one log pass (--reverse → oldest first, so the first sighting of a path is its
// add). Renames carry the original add-date forward. This is the "date added"
// the Recently-added feed sorts on; uncommitted records get no date and sort last.
function gitAddDates() {
    const map = {};
    let out = '';
    try {
        out = execFileSync('git', [
            'log', '--reverse', '--diff-filter=AR', '--name-status',
            '--format=C\t%aI', '--', 'sources/evidence',
        ], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch (e) {
        console.warn(`  ! git add-dates unavailable: ${e.message}`);
        return map;
    }
    let date = null;
    for (const line of out.split('\n')) {
        if (line.startsWith('C\t')) { date = line.slice(2); continue; }
        const parts = line.split('\t');
        if (parts[0] === 'A' && parts[1]) {
            if (!(parts[1] in map)) map[parts[1]] = date;
        } else if (parts[0]?.startsWith('R') && parts[1] && parts[2]) {
            // rename: new path inherits the old path's add-date if known
            if (!(parts[2] in map)) map[parts[2]] = map[parts[1]] ?? date;
        }
    }
    return map;
}

const evidenceManifest = await readJSON('sources/evidence/manifest.json');
const capturesManifest = await readJSON('sources/captures/manifest.json');

const recordFiles = evidenceManifest.records || [];
const captureIds = capturesManifest.captures || [];

const addDates = gitAddDates();

const records = {};
let recOk = 0;
let dated = 0;
for (const fname of recordFiles) {
    try {
        const rec = await readJSON(`sources/evidence/${fname}`);
        const added = addDates[`sources/evidence/${fname}`] || null;
        if (added) { rec.date_added = added; dated++; }
        records[fname] = rec;
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
console.log(`bundle.json — ${recOk}/${recordFiles.length} records (${dated} dated), ${capOk}/${captureIds.length} captures, ${(bytes / 1024).toFixed(0)} KB`);
