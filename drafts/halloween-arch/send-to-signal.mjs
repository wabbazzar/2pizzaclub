#!/usr/bin/env node
// Send each Halloween-arch idea to Signal note-to-self as: indexed caption + image.
// One message per idea so they arrive as a readable numbered list.
//
// Usage: node send-to-signal.mjs [ideas.json]

import { readFileSync } from 'node:fs';
import { join, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API = process.env.SIGNAL_API || 'http://127.0.0.1:8080';
const IDEAS = process.argv[2] || join(__dirname, 'ideas.json');

const accounts = await fetch(`${API}/v1/accounts`).then(r => r.json());
if (!accounts.length) { console.error('no signal-cli accounts registered'); process.exit(1); }
const NUMBER = accounts[0];

const ideas = JSON.parse(readFileSync(IDEAS, 'utf8'));
const b64 = p => readFileSync(isAbsolute(p) ? p : join(__dirname, p)).toString('base64');

let failed = null;
for (const idea of ideas) {
    const payload = {
        number: NUMBER,
        recipients: [NUMBER],                 // note-to-self
        message: idea.caption,
        base64_attachments: (idea.files || []).map(f => `data:image/png;base64,${b64(f)}`),
    };
    const r = await fetch(`${API}/v2/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!r.ok) {
        console.error(`✗ ${idea.id} → HTTP ${r.status}: ${await r.text()}`);
        failed ??= idea.id;
    } else {
        console.log(`✓ ${idea.id}`);
    }
    await new Promise(r => setTimeout(r, 900));   // keep ordering stable in the thread
}
if (failed) process.exit(2);
