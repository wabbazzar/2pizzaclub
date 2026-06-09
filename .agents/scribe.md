# Scribe — 2pizzaclub project block

Concatenated AFTER `agents/scribe/role.md`. The generic role describes
regenerating doc / Learn pages from a front-matter template. **That does NOT
apply here.** 2pizzaclub has exactly one scribe surface: the pre-rendered
cinema **share cards** under `gallery/share/`. Keep that surface in sync with
the live capture/evidence data — nothing else.

## The one task (daily)

Regenerate the share cards by running the project's generator. Run EXACTLY
this (the `cd` resolves the dev-browser plugin's bundled Playwright/Chromium,
whose path carries a version hash — the glob picks the installed one):

```bash
cd "$(echo /home/wabbazzar/.claude/plugins/cache/dev-browser-marketplace/dev-browser/*/skills/dev-browser)" \
  && node /home/wabbazzar/code/2pizzaclub/tools/share-pages.mjs
```

`tools/share-pages.mjs` is deterministic and idempotent. It reads the live
captures (`sources/captures/*/meta.json`) + evidence records, recomputes each
theme's video count + total runtime, and rewrites:

- `gallery/share/<theme>/index.html` — the per-theme unfurl page (its own
  `og:image` meta + a redirect into `/gallery/?cinema=1&themes=<theme>`)
- `gallery/share/<theme>/card.png` — the 1200×630 social card (navy "cinema
  marquee" design, from `tools/share-card.mjs`)
- `gallery/share/all/…` — the unfiltered "whole cinema" target
- `gallery/share/manifest.json` — the generated target set

It also prunes share dirs for themes that no longer exist. New reels ingested
since the last run change theme counts/durations and can add brand-new themes;
re-running the generator is what surfaces them. After it runs, the runner
commits any diff inside `content_paths` (`gallery/share/`) and pushes, so the
cards go live on the next Pages build.

Verify (report in your result JSON; do NOT "fix" code):
- The generator exits 0. If headless Chromium can't launch under the service,
  report it and STOP — never hand-edit cards.
- A spot-checked `card.png` is 1200×630 (matches the `og:image:width/height`
  the page declares). If the render size drifted, flag it; don't patch.

## Read-only coverage check (report, never write)

`editorial_split {a,b,c}` on each `sources/captures/*/meta.json` (Group A
verifiable / B disputed / C unsupported) drives the cinema's
most-uncontested-first sort. It is set at **ingest**, not by you. Do a
read-only sweep and list any capture id missing `editorial_split` in your
result JSON under `coverage_gaps`. **Do NOT write to `sources/captures/`** —
those files are other agents' territory, and a mid-ingest capture must never
be committed by scribe.

## Hard prohibitions
- Never edit anything outside `gallery/share/`. Not code, not captures, not
  evidence, not `CLAUDE.md`.
- Never hand-author or hand-edit a `card.png` or a share `index.html` — they
  are generator output. If the generator can't produce them, the run fails
  loudly; that's correct.
- Never `git add -A`; never stage paths outside `content_paths`. (The runner's
  commit is already pathspec-scoped to `gallery/share/` — keep it that way.)

## Self-check before the runner commits
- Did the generator exit 0 and leave only `gallery/share/` dirty? If anything
  outside `gallery/share/` changed because of you, ABORT.
- Is the diff explainable in one sentence as "refreshed N share targets from
  current data"? If not, you're doing too much — reduce scope.
