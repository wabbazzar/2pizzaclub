---
name: find-footage
description: Trace a screenshot or low-res clip back to its source video and pull the highest-resolution copy — reverse image search + pixel frame-matching (ORB/RANSAC) + source laddering across YouTube/archive.org/graphic-tolerant mirrors. Use when the user says /find-footage, hands over a frame/screenshot and asks to "find the original video", "find the source", "get the highest-res version", "what video is this from", or wants to verify which camera/timestamp a frame came from (accountability-journalism / OSINT / "private investigator" work).
---

# /find-footage — trace a frame to its source video

Given a still (often a re-compressed, watermarked, cropped screenshot — e.g. pulled from Memos), find the originating video and obtain the highest-resolution copy. Two distinct questions, two techniques:

- **What/where is this?** → reverse image search (the *entity finder*)
- **Which exact camera + timestamp?** → pixel frame-matching (the *provenance prover*)

Never conflate "same event" with "same footage." A video of the right event at the wrong camera is a **false positive** — only frame-matching rules it out.

Working dir convention: `/tmp/<slug>-footage/`. Keep the query frame, every probe, and the matcher there.

---

## 0. Get the frame in hand

If it's a Memos attachment: `mcp__memos__search_memos` → `list_memo_attachments` → `download_attachment` to `/tmp/<slug>-footage/query.png`. Then **read it** — eyeball the scene before automating.

## 1. Identify before you search — squeeze the frame for text

One legible URL/banner usually collapses the whole search. Upscale and crop sub-regions (don't trust a glance at a 200px-wide strip):

```python
from PIL import Image, ImageDraw
im = Image.open('query.png').convert('RGB'); w,h = im.size
im.resize((w*4,h*4), Image.LANCZOS).save('q_4x.png')                 # whole frame upscaled
im.crop((0,0,int(w*.45),int(h*.5))).resize((int(w*.45)*4,int(h*.5)*4),Image.LANCZOS).save('crop_tl.png')  # corners/banners
# face/subject crop (Yandex matches faces well):
im.crop((int(w*.30),int(h*.18),int(w*.62),int(h*.95))).save('q_face.png')
# mask an on-screen platform watermark (e.g. "instagram") so it doesn't dominate the match:
m=im.copy(); ImageDraw.Draw(m).rectangle([int(w*.62),0,w,int(h*.14)],fill=(20,30,90)); m.save('q_masked.png')
```

Read each crop. Banners, sponsor URLs, chyrons, watermarks, logos, jersey/number text — all are search keys.

## 2. Reverse image search — the entity finder

Tells you *what*, *roughly when*, and the **resolution ceiling** (if every match is 1920×1080, that's the native res — stop hoping for 4K). Drive it headless with the `dev-browser` skill.

- **Yandex Images** is the best for faces and video frames, and runs headless. Start here.
- **Google Lens** and **TinEye** frequently throw bot-captchas headless — expect to skip them. (TinEye, when reachable, sorts oldest-first = closest to origin.)
- **Bing Visual Search** is a usable fallback; has a "Pages with this image" tab.

```bash
cd /home/wabbazzar/.claude/plugins/cache/dev-browser-marketplace/dev-browser/*/skills/dev-browser
./server.sh --headless > /tmp/devbrowser.log 2>&1 &   # wait for "Ready" + a listener on :9222/:9223
```
```bash
npx tsx <<'EOF'
import { connect, waitForPageLoad } from "@/client.js";
const client = await connect();
const page = await client.page("rev", { viewport: { width: 1400, height: 1000 } });
await page.goto("https://yandex.com/images/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2000);
const fi = await page.$('input[type=file]');                 // class is CbirCore-FileInput
await fi.setInputFiles("/tmp/<slug>-footage/q_4x.png");
await page.waitForTimeout(7000); await waitForPageLoad(page).catch(()=>{});
console.log(await page.evaluate(()=>document.body.innerText.slice(0,1500)));   // "Image appears to contain" + Sites + sizes
await client.disconnect();
EOF
```
Run it on `q_4x.png`, `q_masked.png`, and `q_face.png` — they surface different matches. Harvest the **source URLs and their pixel dimensions** from the "Sites" list. **When done, kill ONLY the dev-browser server + its playwright chromium — never the user's `/opt/google/chrome`:** `pkill -f "dev-browser-marketplace.*server"; pkill -f "ms-playwright.*chrom"`.

A high-res still found here (even watermarked) may itself be a usable deliverable — see step 6 for cleanup.

## 3. Pixel frame-matching — the provenance prover

`yt-dlp` candidate videos, decode, and ORB+RANSAC-match the query against sampled frames. **Interpretation is the whole game:**
- **High inlier cluster** (e.g. 15–40+) at a contiguous timestamp range → same camera, and you've found the exact moment.
- **Low inliers, all landing on signage/banner text** → same *event*, **wrong camera**. Reject it.
- Noise floor (~4–8 inliers scattered, no cluster) → not present.

```python
# match.py — usage: python3 match.py query.png video.webm [step_seconds]
import cv2, numpy as np, sys
q = cv2.imread(sys.argv[1], cv2.IMREAD_GRAYSCALE)
if q.shape[1] < 900:                                  # upscale tiny queries for more keypoints
    s = 900/q.shape[1]; q = cv2.resize(q, None, fx=s, fy=s, interpolation=cv2.INTER_CUBIC)
orb = cv2.ORB_create(2000); kq, dq = orb.detectAndCompute(q, None)
bf = cv2.BFMatcher(cv2.NORM_HAMMING)
cap = cv2.VideoCapture(sys.argv[2]); fps = cap.get(cv2.CAP_PROP_FPS)
stride = max(1, int(round((float(sys.argv[3]) if len(sys.argv)>3 else 0.5)*fps)))
best=(-1,-1); hits=[]; i=0
while True:
    cap.set(cv2.CAP_PROP_POS_FRAMES, i); ok, fr = cap.read()
    if not ok: break
    kf, df = orb.detectAndCompute(cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY), None); inl=0
    if df is not None and len(kf)>10:
        m=bf.knnMatch(dq,df,k=2); gm=[a for a,b in (p for p in m if len(p)==2) if a.distance<0.75*b.distance]
        if len(gm)>=8:
            src=np.float32([kq[x.queryIdx].pt for x in gm]).reshape(-1,1,2)
            dst=np.float32([kf[x.trainIdx].pt for x in gm]).reshape(-1,1,2)
            H,mask=cv2.findHomography(src,dst,cv2.RANSAC,5.0); inl=int(mask.sum()) if mask is not None else 0
    t=i/fps
    if inl>=12: hits.append((round(t,2),inl))
    if inl>best[0]: best=(inl,t)
    i+=stride
print(f"BEST inliers={best[0]} at t={best[1]:.1f}s ({int(best[1]//60)}m{best[1]%60:04.1f}s)")
hits.sort(key=lambda r:-r[1]); print("top:", hits[:12])
```
Deps already on this box: `yt-dlp` (`~/.local/bin`), `ffmpeg`, `python3 -c "import cv2"` (OpenCV 4.x). Use the cleanest, sharpest copy of the frame you have as the query (a clean 1080p still beats the watermarked screenshot).

## 4. Source laddering — find the raw file

Climb from clean-but-cropped to raw-but-graphic:
1. **YouTube / news** — `yt-dlp -F <url>` to read the resolution ladder (caps at 1080p for most; the `137`/`248`/`399` formats are 1080p). Clean, but often chyron'd or re-cropped.
2. **archive.org** — the JSON search API, sorted by downloads:
   ```bash
   curl -fsSL "https://archive.org/advancedsearch.php?q=<terms>&fl[]=identifier&fl[]=title&fl[]=mediatype&fl[]=downloads&sort[]=downloads+desc&rows=40&output=json"
   curl -fsSL "https://archive.org/metadata/<identifier>"   # lists files with width/height/size
   ```
   "All angles" dumps are gold. **Filenames encode the angle** — e.g. `"10 (not visible, skip to 19 minutes)"` = the shooter/roof is *not* in frame (a subject-facing camera) and the moment is ~19 min in. Pick by what the filename claims, then verify (step 5).
3. **Graphic-tolerant mirrors** — Rumble, Odysee, X, Telegram channels (all `yt-dlp`-supported) survive content that YouTube scrubs. Only go here when the user has explicitly authorized footage they know is graphic.

## 5. Probe before you pull — HTTP frame-seek

`ffmpeg` seeks over HTTPS and grabs a single frame **without downloading the file** — verify resolution + angle on a 1.8 GB file for ~1 MB:
```bash
ffmpeg -nostdin -loglevel error -ss <seconds> -i "https://archive.org/download/<id>/<url-encoded-name>.mp4" -frames:v 1 probe.png -y
```
Read the probe. Only `curl`/`yt-dlp` the whole file once a probe confirms the camera and timestamp. (URL-encode spaces/parens: `python3 -c "import urllib.parse;print(urllib.parse.quote('name.mp4'))"`.)

## 6. Deliver

- **Whole video:** download the confirmed file at max resolution; `ffprobe` to report dims/fps/duration.
- **Best frame:** if only an annotated still exists, inpaint the annotations out — detect bright-red arrows by colour mask, box-inpaint text watermarks, `cv2.inpaint(..., INPAINT_TELEA)`. State plainly that it's a re-compressed copy, not the original encode.
- **Always report the resolution ceiling and how you proved provenance** (inlier counts, which candidates you *rejected* and why). Honesty about "the clean original was scrubbed; this is the best surviving copy" beats a confident wrong answer.

---

## Editorial / ethics note

This is OSINT for accountability journalism. Public, news-documented events are fair game to trace and archive. For footage the user knows is graphic (e.g. moment-of-violence feeds on conspiracy mirrors), **let the user steer** how far to go before downloading — confirm, don't assume. Don't reverse redactions or chase private/non-public material. Per project rules, the source video/handle stays out of reader-visible prose — this skill is investigation tooling, not something the timeline cites by name.

## Gotchas

- **Same event ≠ same camera.** The #1 trap. A match that lives entirely on banner/signage text is a different camera — reject it. Only a keypoint cluster on the *subject/scene geometry* counts.
- **Headless captchas.** Google Lens / TinEye usually block headless; Yandex and Bing usually don't. Don't burn time fighting a captcha — pivot engines.
- **Kill the right Chrome.** The dev-browser playwright chromium ≠ the user's desktop `/opt/google/chrome`. Scope `pkill` to the server/playwright process or you'll close the user's browser.
- **Re-compressed stills lie about quality.** 1920×1080 dimensions on a repost ≠ pristine 1080p. Note the degradation.
- **`yt-dlp` must be current** (`~/.local/bin/yt-dlp`); the system binary's extractors rot. Same install one-liner as the reel pipeline.
