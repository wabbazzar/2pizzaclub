---
name: make-reel
description: Build a news-style 2pizzaclub Instagram Reel (9:16 vertical video) — a source clip placed in a blurred-fill frame with animated text overlays (swoop-in/out chyrons, keyword pops, lower-thirds) timed to the audio, plus an animated logo outro. Use when the user says /make-reel, asks to build/edit a Reel, put animated text over a video, make a news-clip reel, kinetic captions over footage, or turn a hearing/interview clip into a posted reel. Pairs with animate-logo (outro) and insta-publish/clip_upload (posting).
---

# /make-reel — animated text-over-video reels

Turns a source clip (hearing, interview, news footage) into a 9:16 Reel with
broadcast-style motion graphics in the house palette/voice. Two reference builds:

- `drafts/instagram/jfk-3shots/` — the original coverage-led format (16:9 clip,
  chyrons as ffmpeg PNG overlays + panel concat).
- `drafts/instagram/jacobs-224-reel/` — the **current format** (June 2026, shipped
  as reel DZNtHSnM2xM): in-video text panels + a chart endcap, one `render(t)`
  scene driving everything. Copy this one for new data-backed builds.

## Source footage: get the official feed first

Don't build on a creator's phone-formatted repost (platform watermarks, low rez,
baked captions). If the clip is from a public proceeding (hearing, markup, presser),
run **/find-footage** to pull the official stream: locate the moment by grepping the
stream's auto-captions (`yt-dlp --write-auto-subs`), verify the camera with one
`ffmpeg -ss <t> -i <direct-url> -frames:v 1` HTTP probe, then download only the
segment (`--download-sections "*HH:MM:SS-HH:MM:SS" --force-keyframes-at-cuts`,
1080p formats `137+140`). The official feed self-authenticates (nameplates, room)
and gives a clean 16:9 for the blur-fill frame.

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
- **NEVER pause/freeze the footage to host text** (user rule, June 2026). A frozen
  frame with editorial beats on top is not a hookable format — it reads as a slideshow
  and kills retention. The video keeps playing for the entire reel. Place text either
  (a) synced to what the speaker is saying at that moment, or (b) in the natural gaps
  between spoken passages — never on a freeze. If the editorial copy needs more time
  than the clip gives, cut a longer clip, let beats overlap speech they relate to, or
  trim the copy. The only freeze permitted is the short logo-outro tail (~4s).
- **The shipped two-act structure (jacobs-224):** Act 1 — the footage plays start
  to finish with ALL text panels riding it in the lower blur zone, each on an ink
  plate (`rgba(7,7,11,.85)`, radius ~22px — bare cream text over blurred video is
  low-contrast and violates the no-overlap rule): speaker name plate → synced fact
  chip (timed to the words) → result panel → big-number punch panel. Act 2 — a
  short endcap of at most 2 data/chart panels on full ink, then logo. Text panels
  never go in the endcap; charts never interrupt the footage.
- **End the clip on a completed sentence, dissolve out.** Never hard-cut, and never
  let the audio fade land mid-phrase: if the next phrase starts immediately (no room
  tone), trim BEFORE it rather than fading over it, then re-whisper the trimmed clip
  to confirm the last words are a full sentence. Video: `fade=t=out` ~0.9s into ink;
  audio: `afade` ~0.3s riding only the final word's natural decay. Keeping the last
  text panel up across the dissolve bridges the two acts.
- **Charts need reel-sized type.** Site/card-sized matplotlib output is unreadable
  on phones — render dedicated variants (at 1080×1350: titles ~44pt, legends/axis
  labels 23–24pt, one-line footer ~16pt). Pop them in with slight scale drift; add
  animated pointer arrows (CSS `clip-path` triangles, `sin` bounce) when the key
  datum isn't where the eye lands (e.g. $0 bars next to big bars). Check adjacent
  labels for collisions after upsizing — stack/shrink as needed.
- **Order for a "coverage-led" piece:** hook → "don't feel bad if you missed it" →
  the coverage beat → the payoff (the subject's own words, synced) → logo.
- **Fit within the clip length** — ride the footage; don't pad with long dead tails.
  The only tail is the endcap + logo.
- **Outro:** animate-logo presets; current pick is `stamp` with the impact flash
  zeroed out (full-screen color flashes and the spark circles were both rejected).
  The melt presets exist but read as squash-and-stretch, not liquid — skip until
  the engine has real displacement warping.
- **House register:** Big Shot — friendly/bouncy graphics carrying grim receipts.
  Brand palette: ink `#07070b`, cream `#FFF8E7`, mustard `#FFD93D`, navy `#1B3FB5`,
  planet-red `#E63946`. Font Quicksand. Saturn brand chip + `2pizzaclub.com`.
- **Editorial:** flat copy, reader-chooses, no source-video reference, attribute
  contested claims as testimony (not asserted fact). See project CLAUDE.md.

## Motion engine (`scene.html`)

`render(t)` (t in seconds) sets each absolutely-positioned beat via `blk(el,t,t0,t1,opts)`
— enter with overshoot, hold, exit. Easing helpers (`eOutBack`, `eOutCubic`, …)
included. Retiming = editing the t0/t1 numbers, then re-render frames + recomposite.
**Always eyeball composited frames before done** and Signal-preview the cut for
sign-off. Iterate on the user's notes — this format took ~5 Signal rounds to land.

Conventions from the jacobs-224 scene (`scene-money.html`):
- Two timeline constants drive everything: `VIDEO_END` (clip length) and `LOGO`
  (outro start) — retimes are mostly edits to those plus the beat windows.
- Two bands: `.lowbeat` (top:~1180, below the centered 16:9 clip) for in-video
  panels; `.beat` (centered) for endcap panels.
- **z-index explicitly**: ink backdrop `z1`, all text/charts/arrows `z2`, outro
  `z3`. A positioned element with `z-index:auto` paints UNDER a z-indexed sibling —
  this silently hid both the first scrim text pass and the pointer arrows.
- Chart PNGs are embedded base64 by `render-frames.mjs` (`--scene`, `--dur`,
  `--version` flags); swapping a chart = regenerating its PNG, same scene.

## Post it

Reels need `clip_upload`, not the carousel album path. The insta-publish skill is
photos-only; copy `publish_reel.py` (instagrapi `clip_upload`) into the post-set.
Run it with the insta-publish venv + creds — system python lacks instagrapi:
```bash
IG_USER="$(grep '^insta-2pizza-user:' ~/.env | cut -d':' -f2- | sed 's/^[[:space:]]*//;s/"//g')" \
IG_PASS="$(grep '^insta-2pizza-key:'  ~/.env | cut -d':' -f2- | sed 's/^[[:space:]]*//;s/"//g')" \
"$HOME/.local/ig-venv/bin/python" publish_reel.py --video out/reel.mp4 \
  --caption-file captions/post.txt --thumbnail out/cover.jpg
```
Provide a JPEG `--thumbnail` (a strong frame — the big-number panel over the footage
works well) so it doesn't need moviepy. Caption follows the JFK pattern: dated lede,
attributed facts, "See the receipts.", site, hashtags — no reel/creator references.
**Send cover + caption to Signal and get explicit sign-off before the (public,
irreversible) post.**
