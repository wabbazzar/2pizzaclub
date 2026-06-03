---
name: make-reel
description: Build a news-style 2pizzaclub Instagram Reel (9:16 vertical video) — a source clip placed in a blurred-fill frame with animated text overlays (swoop-in/out chyrons, keyword pops, lower-thirds) timed to the audio, plus an animated logo outro. Use when the user says /make-reel, asks to build/edit a Reel, put animated text over a video, make a news-clip reel, kinetic captions over footage, or turn a hearing/interview clip into a posted reel. Pairs with animate-logo (outro) and insta-publish/clip_upload (posting).
---

# /make-reel — animated text-over-video reels

Turns a source clip (hearing, interview, news footage) into a 9:16 Reel with
broadcast-style motion graphics in the house palette/voice. The reference build
is `drafts/instagram/jfk-3shots/` (Douglas Horne "three head shots" reel) — copy
that post-set as the template.

## The pipeline (4 stages)

1. **Cut the clip** — find the exact in/out on sentence boundaries (don't cut
   mid-sentence). Transcribe to get word timings so overlays sync to speech:
   ```bash
   ffmpeg -y -ss <in> -to <out> -i src.mp4 -c:v libx264 -crf 20 -c:a aac clip.mp4
   ffmpeg -i clip.mp4 -ar 16000 -ac 1 a.wav && /tmp/whisper-venv/bin/whisper a.wav --model base.en --output_format srt
   ```

2. **Base footage (9:16)** — blurred-fill background + the sharp 16:9 clip centered
   (keep any on-screen nameplate visible — it self-authenticates). Duck audio after
   the key line; add a short freeze tail only for the logo outro:
   ```
   [0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=26,eq=brightness=-0.20:saturation=0.65[bg];
   [0:v]scale=1080:-2,pad=iw+8:ih+8:4:4:color=0x1B3FB5[fg];
   [bg][fg]overlay=(W-w)/2:536,tpad=stop_mode=clone:stop_duration=4[v];
   [0:a]afade=t=out:st=<end>:d=0.5,apad[a]
   ```

3. **Motion layer** — a browser `render(t)` engine (`scene.html`) lays out every
   text beat with real easing; `render-frames.mjs` screenshots transparent PNG
   frames at 30fps. Composite over the base:
   ```bash
   NODE_PATH=$PWD/node_modules node scene/render-frames.mjs        # -> frames/
   ffmpeg -i base.mp4 -framerate 30 -i frames/f%05d.png \
     -filter_complex "[0:v][1:v]overlay=0:0,format=yuv420p[v]" -map "[v]" -map 0:a out/reel.mp4
   ```

4. **Logo outro** — use the **animate-logo** skill (its `.webm` alpha sting, or render
   the outro inside the same scene as the JFK reel does).

## Layout & motion rules (learned the hard way)

- **All text beats share one centered band** in the lower blurred zone — consistent
  position, horizontally centered. Don't scatter elements (reads sloppy).
- **Everything animates over the video.** No static full-screen intro/outro panels —
  they're boring and kill retention. Swoop in/out (overshoot easing), keyword pops.
- **Order for a "coverage-led" piece:** hook → "don't feel bad if you missed it" →
  the coverage beat → the payoff (the subject's own words, synced) → logo.
- **Fit within the clip length** — ride the footage; don't pad with long dead tails.
  The only tail is the logo (~4s).
- **House register:** Big Shot — friendly/bouncy graphics carrying grim receipts.
  Brand palette: ink `#07070b`, cream `#FFF8E7`, mustard `#FFD93D`, navy `#1B3FB5`,
  planet-red `#E63946`. Font Quicksand. Saturn brand chip + `2pizzaclub.com`.
- **Editorial:** flat copy, reader-chooses, no source-video reference, attribute
  contested claims as testimony (not asserted fact). See project CLAUDE.md.

## Motion engine (`scene.html`)

`render(t)` (t in seconds) sets each absolutely-positioned beat via `blk(el,t,t0,t1,opts)`
— enter with overshoot, hold, exit. Beats live in a shared `.beat` band. Easing
helpers (`eOutBack`, `eOutCubic`, …) included. Retiming = editing the t0/t1 numbers,
then re-render frames + recomposite. **Always eyeball composited frames before done**
and Signal-preview the cut for sign-off.

## Post it

Reels need `clip_upload`, not the carousel album path. The insta-publish skill is
photos-only; the JFK set ships `publish_reel.py` (instagrapi `clip_upload`, reuses
the same `~/.cache/ig-2pizza` session + grepped creds). Provide a JPEG `--thumbnail`
(a strong frame, e.g. the climax) so it doesn't need moviepy. Confirm caption +
cover with the user before the (public, irreversible) post.
