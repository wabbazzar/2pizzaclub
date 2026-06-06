---
name: animate-logo
description: Animate the 2pizzaclub Saturn logo into a short brand sting (a few seconds) with a chosen reveal style — scale-bounce, spray/graffiti, wipe, iris, drop, spin, glitch, or stamp. Outputs an opaque mp4 (on brand ink) for preview and a transparent VP9 webm for compositing into reels. Use when the user says /animate-logo, asks for an animated logo, a logo reveal/sting/bumper, a "graffiti logo" animation, or wants a logo outro for a reel.
---

# /animate-logo — 2pizzaclub logo reveal stings

Renders the brand mark (`logo.png`, the Saturn pizza-planet) into a ~3.4s animated
reveal, in the house palette/voice. Built on a browser `render(t)` motion engine
(real easing), screenshotted to transparent frames, then encoded two ways:

- `out/<preset>.mp4` — opaque, on brand ink `#07070b`, 1080×1080. Preview / standalone sting.
- `out/<preset>.webm` — VP9 with alpha. Drop straight onto video as a reel outro.

The wordmark **2pizzaclub** + `2PIZZACLUB.COM` rise in after the mark lands (the lockup).

## Presets

| preset | motion |
|---|---|
| `bounce` | scale up from nothing with an overshoot + tiny counter-rotate |
| `spray`  | radial "graffiti" spray-reveal from center (clears corners) + scale-bounce + speckles |
| `wipe`   | left→right reveal wipe |
| `iris`   | circular iris opens from center |
| `drop`   | drops from the top, squash-settles (easeOutBounce) |
| `spin`   | scales in while spinning a full turn, settles |
| `glitch` | RGB-split / jitter glitch that snaps into place |
| `stamp`  | slams in from oversize with a shake + white flash |
| `dropout` | melt_slide's drop-in + settle-wiggle, lockup rises, then the whole thing exits out the bottom — text first, logo right behind with a pre-hop (4.0s; built 2026-06-06 to user spec) |

The brand's visual register is **fun + silly about dark things** (Big Shot): warm,
whimsical, bouncy — never cold. Favor `bounce` / `spray` / `drop` / `spin` over the
harsher `glitch` / `stamp` unless the moment wants a hit.

## Run

```bash
SK=.claude/skills/animate-logo
# spot-check a preset (5 frames -> work/probe/)
NODE_PATH=$PWD/node_modules node $SK/render-logo.mjs spray --probe
# render frames + encode mp4 + webm
NODE_PATH=$PWD/node_modules node $SK/render-logo.mjs spray
bash $SK/build-logo.sh spray            # -> $SK/out/spray.mp4  +  $SK/out/spray.webm
```

Flags: `--dur 3.4` (seconds), `--logo <path>` (default the bundled mark),
`--out <dir>` (frame dir). Renderer needs the repo's `node_modules` (playwright) on
`NODE_PATH`. Always **eyeball a composited frame before calling it done** (house rule),
and send renders to Signal note-to-self for review (see `/insta-post` for the Signal loop).

## Tuning / new presets

All motion lives in `logo-scene.html` → `PRESETS` (one function per style; each gets
`t` in seconds and sets transform/opacity/mask via `set()` / `lock()`). Easing helpers
(`eOutBack`, `eOutBounce`, `eOutElastic`, …) are in the same file. Add a preset by
adding a `PRESETS.<name>(t)` function. Keep stings 3–5s with a clear settle + hold.

## Reuse in a reel

The `.webm` (alpha) composites over footage as the outro:
```bash
ffmpeg -i base.mp4 -i $SK/out/spray.webm -filter_complex \
  "[0:v][1:v]overlay=(W-w)/2:(H-h)/2:enable='gte(t,40.5)'" out.mp4
```
For the full text-over-video reel pipeline, see the **make-reel** skill.
