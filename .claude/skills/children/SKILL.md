---
name: children
description: Prime on the "Someone's Eating Babies" children's-horror picture book at /eating/ — its verse + per-line primary sources, the editorial voice, the illustration pipeline, the pyramid→smoke easter egg, and the tools. Use when the user says /children or /story, or asks to read/write/illustrate the children's book, the eating page, the poem/scenes/verse, the book illustrations, or the smoke transition.
---

# /children — "Someone's Eating Babies"

A sourced children's-horror picture book at **`/eating/`** (separate from the timeline). A nursery-rhyme on the surface; every line points at a documented fact about the network the timeline catalogues. The horror is the public record set in nursery meter. The reader is shown and decides — no conclusions drawn.

## Prose + sources — read these first
- **`drafts/story_prompt.md`** — the spec: the voice, the structure (Donaldson *Room on the Broom* accumulating-objects engine; the mirror as scrying device set in scene 1, carried by the art after; the six-permissions refusal that pays off in the final scene), and the **four working rules** (every line must name a real referent; the agent annotates each line with its source before it stays).
- **`drafts/children_story_1.md`** — the canonical draft: 7 scenes + "the telling", each with the verse AND per-line annotations tying every image to a primary source (govinfo/Wikipedia/court records/the capture reels). Appendix: "the small doors" (hides the acrostic PROMIS THE OCTOPUS — Casolaro/Inslaw), drafted, not yet wired.
- **`sources/evidence/` + the timeline** — the records the lines cite. `drafts/illustrations/SYMBOL-KIT.md` — the occult/Kabbalah symbol program (mirror frame = Tree of Life inverting to the Qliphoth; the entity = Yaldabaoth = Moloch/Baal Hammon = the brass mill; ouroboros/octopus = PROMIS) to weave into the art.

## Voice (most-violated rule)
Donaldson cadence + Gorey / Mother-Goose dread. AABB couplets, simple nouns, **real named referents — never fairy-tale generics** (Jerusalem, not "a far land"; the blue-striped white temple, not "a dark castle"). The refrain *"Someone's eating babies"* appears once (scene 1) and is trusted to echo. No "we" in editorial framing. See memory **[[feedback-voice-creepy-truth-not-fairytale]]**.

## Illustrations (images)
- **Pipeline:** fal.ai (key in `~/.env` as `fal-key`, extract via grep — never cat ~/.env). Helper **`drafts/illustrations/gen.py`** — FLUX.1[dev] for text→image, `fal-ai/flux-pro/kontext` for reference edits (holds the same child/room across scenes). Reference-only consistency (no LoRA). `fal-ai/imageutils/rembg` for background cutouts.
- **Canonical child:** ~7yo, pale, dark blunt-fringe bob, large dark eyes, plain pale linen nightdress, barefoot. **Always spot-check generations for slop before using** — see **[[feedback-inspect-ai-images-before-use]]**.
- **Page layout:** each scene = a full-bleed **two-up** (two illustration panels split by a diagonal `clip-path` seam), verse overlaid on soft scrims, placed on each image's darkest region via **`drafts/illustrations/darkest.py`**. The `clip-path` is on the inner `.art` div (background only) — but that does **not** protect the verse text. An absolutely-positioned `.cap` can still straddle the gold `.seam` line, which paints *on top* and swallows the leading letter of every centered line (this was the scene-1 `.cap.r-left` bug: "Past"→"ast", "past"→"ast"). Keep each `.cap` entirely on one side of the seam (its left edge clear of the seam at all widths — the seam runs ~52%→48% across the spread), give it a soft radial scrim, and **confirm in a browser**. Narrow widths get a scrim back + reflow to a vertical stack.
- **Production:** finals in `eating/art/`. **Scene 1 is illustrated + wired** into `eating/index.html` (`scene1a` = mirror/reaching, `scene1b` = staircase→capitol). Scenes ii–vii are still text-only. Prototypes + tooling in `drafts/illustrations/`.

## The pyramid→smoke easter egg
Long-press empty space on the timeline → a gold pyramid forms (cutout `eating/art/pyramid.png`), its eye opens, then calm smoke wafts in and dissolves the timeline into the book, handing off to the live interactive book. Files: **`eating-egg.js`** + **`fluid.js`** (Pavel Dobryakov WebGL sim, MIT, rebuilt from `drafts/illustrations/fluid-src.js` via `patch_fluid.py`). Full mechanism + gotchas (the "checkerboard" was the sim's own `drawCheckerboard`; opaque reveal-mask composite; finger-math strokes for the calm; bump `?v=` after edits) in memory **[[project-smoke-transition]]** and **[[project-eating-book-illustrations]]**.

## "Done" requires visual confirmation (hard rule)
Never call a scene/page **done**, **wired**, or **legible** from reading the code or the diff. A layout is done only when a screenshot proves it. Open the page in dev-browser at a **wide desktop and at least one narrow width**, screenshot, and actually **read every verse line** — confirm no leading letter is clipped by the seam, no line spills off its scrim or onto a bright region, nothing overlaps the nav/head, the refrain is visible. Zoom-crop the suspect `.cap` if unsure. Scene 1 shipped "illustrated + wired" while the seam ate the first letter of four lines, because the rendered page was never opened. **Screenshot first, claim done second.** Same bar for the smoke egg: watch the transition, don't infer it from the splat math.

## Preview
`cd /home/wabbazzar/code/2pizzaclub && python3 -m http.server 8744` → open `http://localhost:8744/eating/` (or trigger the egg at `/`). Reachable over Tailscale at `http://wabbazzar-ice.taila666cc.ts.net:8744/`. The dev-browser caches hard — hard-refresh / bump `?v=` after edits.

## Conventions (from CLAUDE.md)
No `2pizzaclub.com` in repo paths. Commits carry **no Claude attribution**. Flat editorial voice.
