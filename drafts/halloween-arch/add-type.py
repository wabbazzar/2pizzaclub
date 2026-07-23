#!/usr/bin/env python3
"""Overlay a clean surname on each card's blank banner (avoids baked-text garble).
   python3 add-type.py
Outputs out-babies/<id>.png (typed) from out-babies/<id>-1.png (raw)."""
from PIL import Image, ImageDraw, ImageFont
import pathlib
HERE = pathlib.Path(__file__).parent
OUT = HERE / "out-babies"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# banner box as fractions (l, t, r, b) of the 864x1184 card, text fill, optional stroke
CARDS = {
    "netanyahu": dict(name="NETANYAHU", box=(.14, .81, .88, .915), fill=(27, 40, 90),  stroke=None),
    "thiel":     dict(name="THIEL",     box=(.11, .815, .90, .915), fill=(255, 248, 231), stroke=(20, 30, 70)),
    "karp":      dict(name="KARP",      box=(.14, .855, .88, .955), fill=(255, 248, 231), stroke=(120, 25, 30)),
}

def fit(draw, text, maxw, maxh):
    for sz in range(160, 20, -2):
        f = ImageFont.truetype(FONT, sz)
        l, t, r, b = draw.textbbox((0, 0), text, font=f)
        if (r - l) <= maxw and (b - t) <= maxh:
            return f, (r - l, b - t, l, t)
    f = ImageFont.truetype(FONT, 22)
    l, t, r, b = draw.textbbox((0, 0), text, font=f)
    return f, (r - l, b - t, l, t)

for cid, c in CARDS.items():
    src = OUT / f"{cid}-1.png"
    if not src.exists():
        print("skip", cid, "(no raw)"); continue
    im = Image.open(src).convert("RGBA")
    W, H = im.size
    d = ImageDraw.Draw(im)
    bl, bt, br, bb = (c["box"][0]*W, c["box"][1]*H, c["box"][2]*W, c["box"][3]*H)
    bw, bh = br - bl, bb - bt
    f, (tw, th, ox, oy) = fit(d, c["name"], bw * .92, bh * .8)
    x = bl + (bw - tw) / 2 - ox
    y = bt + (bh - th) / 2 - oy
    kw = dict(font=f, fill=c["fill"])
    if c["stroke"]:
        kw.update(stroke_width=max(2, f.size // 22), stroke_fill=c["stroke"])
    d.text((x, y), c["name"], **kw)
    dst = OUT / f"{cid}.png"
    im.convert("RGB").save(dst)
    print("wrote", dst.name, "@", f.size)
