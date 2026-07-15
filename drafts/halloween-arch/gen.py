#!/usr/bin/env python3
"""fal.ai image helper for the Halloween arch panels.

Unlike drafts/illustrations/gen.py (tuned for flux/dev + kontext), this one speaks
nano-banana's body shape too — fal rejects flux-only fields on that endpoint.

Usage:
    FAL_KEY=... python3 gen.py "<prompt>" out_basename
Env:
    FAL_MODEL  fal-ai/nano-banana (default) | fal-ai/flux/dev | fal-ai/nano-banana/edit
    ASPECT     nano-banana aspect_ratio (1:1, 9:16, 16:9, 3:4, 4:3, 21:9)
    SIZE       flux image_size (square_hd|portrait_4_3|portrait_16_9|...)
    N          num images (default 1)
    IMG        reference image path/URL (edit models; comma-separate for multiple)
"""
import os, sys, json, base64, mimetypes, urllib.request, urllib.error

FAL_KEY = os.environ["FAL_KEY"]
MODEL = os.environ.get("FAL_MODEL", "fal-ai/nano-banana")
N = int(os.environ.get("N", "1"))
prompt, out = sys.argv[1], sys.argv[2]


def as_url(p):
    if p.startswith("http"):
        return p
    mime = mimetypes.guess_type(p)[0] or "image/png"
    with open(p, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode()


body = {"prompt": prompt, "num_images": N, "output_format": "png"}

if "nano-banana" in MODEL:
    if os.environ.get("ASPECT"):
        body["aspect_ratio"] = os.environ["ASPECT"]
    if os.environ.get("IMG"):
        body["image_urls"] = [as_url(p) for p in os.environ["IMG"].split(",")]
else:
    body["image_size"] = os.environ.get("SIZE", "portrait_4_3")
    body["num_inference_steps"] = int(os.environ.get("STEPS", "30"))
    body["guidance_scale"] = float(os.environ.get("GUIDANCE", "3.5"))
    body["enable_safety_checker"] = False
    if os.environ.get("SEED"):
        body["seed"] = int(os.environ["SEED"])
    if os.environ.get("IMG"):
        body["image_url"] = as_url(os.environ["IMG"])
        body["strength"] = float(os.environ.get("STRENGTH", "0.85"))

req = urllib.request.Request(
    "https://fal.run/" + MODEL,
    data=json.dumps(body).encode(),
    headers={"Authorization": "Key " + FAL_KEY, "Content-Type": "application/json"},
)
try:
    resp = json.load(urllib.request.urlopen(req, timeout=300))
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode()[:1000])
    sys.exit(1)

imgs = resp.get("images") or []
if not imgs:
    print("no images:", json.dumps(resp)[:1000])
    sys.exit(1)
for i, im in enumerate(imgs, 1):
    url = im["url"]
    data = (base64.b64decode(url.split(",", 1)[1]) if url.startswith("data:")
            else urllib.request.urlopen(url, timeout=180).read())
    path = f"{out}-{i}.png"
    with open(path, "wb") as f:
        f.write(data)
    print("wrote", path)
print("model:", MODEL, "| desc:", (resp.get("description") or "")[:200])
