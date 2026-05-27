#!/usr/bin/env python3
"""Minimal fal.ai image generation helper for the Someone's Eating Babies plates.

Usage:
    FAL_KEY=...  python3 gen.py "<prompt>" out_basename
Env knobs:
    FAL_MODEL  default fal-ai/flux/dev   (text->image). Use fal-ai/flux-pro/kontext for reference edits.
    SIZE       default portrait_4_3       (square_hd|portrait_4_3|portrait_16_9|landscape_4_3|...)
    N          default 1                  number of variations
    SEED       optional int               fix for reproducibility
    IMG        optional URL/path          reference image (kontext / image-to-image)
Writes <out_basename>-1.png ... and prints the seed used.
"""
import os, sys, json, base64, mimetypes, urllib.request

FAL_KEY = os.environ["FAL_KEY"]
MODEL = os.environ.get("FAL_MODEL", "fal-ai/flux/dev")
SIZE = os.environ.get("SIZE", "portrait_4_3")
N = int(os.environ.get("N", "1"))
prompt = sys.argv[1]
out = sys.argv[2]

is_kontext = "kontext" in MODEL
body = {"prompt": prompt, "num_images": N, "output_format": "png"}
if os.environ.get("SEED"):
    body["seed"] = int(os.environ["SEED"])

# Reference image: required for kontext, optional (image-to-image) for t2i models.
img_url = None
if os.environ.get("IMG"):
    img = os.environ["IMG"]
    if img.startswith("http"):
        img_url = img
    else:
        mime = mimetypes.guess_type(img)[0] or "image/png"
        with open(img, "rb") as f:
            img_url = f"data:{mime};base64," + base64.b64encode(f.read()).decode()

if is_kontext:
    # flux-pro/kontext: prompt + image_url, guidance, permissive safety. No steps/image_size.
    if not img_url:
        print("kontext requires IMG=<reference>"); sys.exit(1)
    body["image_url"] = img_url
    body["guidance_scale"] = float(os.environ.get("GUIDANCE", "3.5"))
    body["safety_tolerance"] = os.environ.get("SAFETY", "6")
    if os.environ.get("ASPECT"):
        body["aspect_ratio"] = os.environ["ASPECT"]
else:
    body["image_size"] = SIZE
    body["num_inference_steps"] = int(os.environ.get("STEPS", "30"))
    body["guidance_scale"] = float(os.environ.get("GUIDANCE", "3.5"))
    body["enable_safety_checker"] = False
    if img_url:
        body["image_url"] = img_url
        body["strength"] = float(os.environ.get("STRENGTH", "0.85"))

req = urllib.request.Request(
    "https://fal.run/" + MODEL,
    data=json.dumps(body).encode(),
    headers={"Authorization": "Key " + FAL_KEY, "Content-Type": "application/json"},
)
try:
    resp = json.load(urllib.request.urlopen(req, timeout=240))
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode()[:800]); sys.exit(1)

imgs = resp.get("images") or []
if not imgs:
    print("no images in response:", json.dumps(resp)[:800]); sys.exit(1)
for i, im in enumerate(imgs, 1):
    url = im["url"]
    path = f"{out}-{i}.png"
    if url.startswith("data:"):
        data = base64.b64decode(url.split(",", 1)[1])
    else:
        data = urllib.request.urlopen(url, timeout=120).read()
    with open(path, "wb") as f:
        f.write(data)
    print("wrote", path)
print("seed:", resp.get("seed"), "| model:", MODEL)
