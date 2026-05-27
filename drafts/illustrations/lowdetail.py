#!/usr/bin/env python3
"""Find the lowest-DETAIL (fewest image-lines/edges) window in an image AS DISPLAYED
in a CSS panel, so a verse block can be slotted where it covers the least art.

Same cover-crop model as darkest.py, but scores by edge-magnitude (gradient) instead
of luminance — "where are the fewest lines present." Constrain the window-center y to
[--ymin,--ymax] to place two non-overlapping blocks (top half / bottom half).

Usage:
    python3 lowdetail.py <image> --aspect W/H --posy 0..1 [--posx 0..1] \
            --win-w 0.44 --win-h 0.20 [--ymin 0 --ymax 0.5]
Prints the window-center as panel-relative left%/top% (drop into CSS:
  left:<L>%; top:<T>%; transform:translate(-50%,-50%)) + edge & luminance means.
"""
import argparse, numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("image")
ap.add_argument("--aspect", default="0.83", help="panel W/H, e.g. 749/900 or 0.83")
ap.add_argument("--posx", type=float, default=0.5)
ap.add_argument("--posy", type=float, default=0.5)
ap.add_argument("--win-w", type=float, default=0.44)
ap.add_argument("--win-h", type=float, default=0.20)
ap.add_argument("--ymin", type=float, default=0.0)
ap.add_argument("--ymax", type=float, default=1.0)
ap.add_argument("--grid", type=int, default=300)
a = ap.parse_args()
aspect = eval(a.aspect) if "/" in a.aspect else float(a.aspect)

L = np.asarray(Image.open(a.image).convert("L"), float)
H, W = L.shape
PH = a.grid; PW = max(1, int(round(PH * aspect)))
s = max(PW / W, PH / H)
offx = a.posx * (W * s - PW); offy = a.posy * (H * s - PH)
xs = np.clip(((np.arange(PW) + offx) / s), 0, W - 1).astype(int)
ys = np.clip(((np.arange(PH) + offy) / s), 0, H - 1).astype(int)
panel = L[np.ix_(ys, xs)]                       # luminance as displayed
gy, gx = np.gradient(panel)
E = np.sqrt(gx * gx + gy * gy)                   # edge magnitude as displayed

def integ(M):
    I = np.zeros((PH + 1, PW + 1)); I[1:, 1:] = M.cumsum(0).cumsum(1); return I
IE, IL = integ(E), integ(panel)
ww = max(1, int(round(PW * a.win_w))); hh = max(1, int(round(PH * a.win_h)))
def winmean(I): return (I[hh:, ww:] - I[:-hh, ww:] - I[hh:, :-ww] + I[:-hh, :-ww]) / (ww * hh)
emean, lmean = winmean(IE), winmean(IL)

cys = (np.arange(emean.shape[0]) + hh / 2) / PH
mask = (cys >= a.ymin) & (cys <= a.ymax)
score = np.where(mask[:, None], emean, emean.max() + 1)
y0, x0 = np.unravel_index(np.argmin(score), score.shape)
cx = (x0 + ww / 2) / PW; cy = (y0 + hh / 2) / PH
print(f"{a.image}")
print(f"  lowest-edge {a.win_w:.2f}x{a.win_h:.2f} win (y in [{a.ymin},{a.ymax}]) "
      f"-> left {cx*100:.1f}%  top {cy*100:.1f}%   (edge {emean[y0,x0]:.1f}, lum {lmean[y0,x0]:.0f}/255)")
