#!/usr/bin/env python3
"""Find the darkest text-sized region of an image AS DISPLAYED in a CSS panel,
so light verse can be centered there for maximum contrast.

It reproduces `background-size: cover` + `background-position` cropping into a
panel of a given aspect ratio, then slides a text-sized window (an integral
image makes this exact + fast) to find the lowest-mean-luminance placement.

Usage:
    python3 darkest.py <image> --aspect W/H --posy 0..1 [--posx 0..1] \
                        --win-w 0.72 --win-h 0.40
Prints the window-center as panel-relative left%/top% (drop straight into CSS:
  left:<L>%; top:<T>%; transform:translate(-50%,-50%)) plus the mean luminance.
"""
import argparse, numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("image")
ap.add_argument("--aspect", default="0.871", help="panel W/H, e.g. 749/860 or 0.871")
ap.add_argument("--posx", type=float, default=0.5)
ap.add_argument("--posy", type=float, default=0.5)
ap.add_argument("--win-w", type=float, default=0.72)
ap.add_argument("--win-h", type=float, default=0.40)
ap.add_argument("--grid", type=int, default=260, help="panel sampling height in px")
a = ap.parse_args()

aspect = eval(a.aspect) if "/" in a.aspect else float(a.aspect)  # W/H

L = np.asarray(Image.open(a.image).convert("L"), dtype=np.float64)
H, W = L.shape

# panel sampling grid
PH = a.grid
PW = max(1, int(round(PH * aspect)))

# cover transform: scale so the image covers the panel, then offset by position
s = max(PW / W, PH / H)
dispW, dispH = W * s, H * s
offx = a.posx * (dispW - PW)
offy = a.posy * (dispH - PH)

# map every panel pixel back to an image pixel
xs = (np.arange(PW) + offx) / s
ys = (np.arange(PH) + offy) / s
xs = np.clip(xs, 0, W - 1).astype(int)
ys = np.clip(ys, 0, H - 1).astype(int)
panel = L[np.ix_(ys, xs)]  # PH x PW luminance as displayed

# integral image -> exact mean luminance over every window position
I = np.zeros((PH + 1, PW + 1))
I[1:, 1:] = panel.cumsum(0).cumsum(1)
ww = max(1, int(round(PW * a.win_w)))
hh = max(1, int(round(PH * a.win_h)))
# window sums for all top-left positions, vectorized
sums = (I[hh:, ww:] - I[:-hh, ww:] - I[hh:, :-ww] + I[:-hh, :-ww])
means = sums / (ww * hh)
y0, x0 = np.unravel_index(np.argmin(means), means.shape)
cx = (x0 + ww / 2) / PW
cy = (y0 + hh / 2) / PH
print(f"{a.image}")
print(f"  darkest {a.win_w:.2f}x{a.win_h:.2f} window center -> left {cx*100:.1f}%  top {cy*100:.1f}%"
      f"   (mean L {means.min():.0f}/255, brightest window {means.max():.0f})")
