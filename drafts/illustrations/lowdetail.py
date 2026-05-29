#!/usr/bin/env python3
"""Find the LOWEST-DETAIL (minimum-edge) text-sized region of an image AS
DISPLAYED in a CSS panel, so verse can be centered where the picture is
calmest. A dark-but-busy patch (crowd, foliage, masonry) fights legibility
even under a scrim; a flat patch reads clean. Edge energy is the metric;
darkness is only a tie-breaker. (Supersedes darkest.py, which minimised mean
luminance and so kept landing verse on dark-but-cluttered regions.)

It reproduces `background-size: cover` + `background-position` cropping into a
panel of a given aspect ratio, builds an edge map (gradient magnitude) at the
DISPLAYED scale, then slides a text-sized window (integral image -> exact +
fast) to the position of least mean edge energy.

  score(window) = norm(mean_edge) + lum-weight * norm(mean_luminance)

Single box:
    python3 lowdetail.py <image> --aspect W/H --posy 0..1 [--posx 0..1] \
                          --win-w 0.44 --win-h 0.24 [--cx-min .. --cx-max ..]

Two boxes on ONE image (e.g. a panel carrying r-left + r-right) — adds a
BALANCE term so the pair sits evenly in the frame instead of clustering. It
minimises  SA + SB + balance * asymmetry  over non-overlapping placements,
where asymmetry is how far the pair's centroid drifts from the panel centre
(so a high box pulls its partner low, a left box pulls its partner right):
    python3 lowdetail.py <image> --two --win-a 0.40,0.13 --win-b 0.42,0.24 \
                          --aspect W/H --posy 0..1 [--cx-min .. --cx-max ..]

Prints each window-centre as panel-relative left%/top% — drop straight into
CSS (left:<L>%; top:<T>%; the base .cap already has translate(-50%,-50%)).
"""
import argparse, numpy as np
from PIL import Image


def panel_grid(path, aspect, posx, posy, PH):
    """Luminance grid as the image is displayed under background-size:cover."""
    L = np.asarray(Image.open(path).convert("L"), dtype=np.float64)
    H, W = L.shape
    PW = max(1, int(round(PH * aspect)))
    s = max(PW / W, PH / H)                       # cover scale
    dispW, dispH = W * s, H * s
    offx, offy = posx * (dispW - PW), posy * (dispH - PH)
    xs = np.clip(((np.arange(PW) + offx) / s), 0, W - 1).astype(int)
    ys = np.clip(((np.arange(PH) + offy) / s), 0, H - 1).astype(int)
    return L[np.ix_(ys, xs)], PW                  # PH x PW luminance as shown


def integral(a):
    I = np.zeros((a.shape[0] + 1, a.shape[1] + 1))
    I[1:, 1:] = a.cumsum(0).cumsum(1)
    return I


def window_means(I, ww, hh):
    """Mean of the integral-image field over every ww x hh window (top-lefts)."""
    s = I[hh:, ww:] - I[:-hh, ww:] - I[hh:, :-ww] + I[:-hh, :-ww]
    return s / (ww * hh)


def norm01(a):
    lo, hi = float(a.min()), float(a.max())
    return (a - lo) / (hi - lo) if hi > lo else np.zeros_like(a)


def score_maps(lum, PH, PW, win_w, win_h, lum_weight):
    """Per-top-left score map for one window size, plus its ww/hh in px."""
    # edge map at displayed scale: gradient magnitude, lightly smoothed so the
    # metric reads "busyness behind a text block", not single-pixel noise
    gy, gx = np.gradient(lum)
    edge = np.hypot(gx, gy)
    ww = max(1, int(round(PW * win_w)))
    hh = max(1, int(round(PH * win_h)))
    em = window_means(integral(edge), ww, hh)
    lm = window_means(integral(lum), ww, hh)
    return norm01(em) + lum_weight * norm01(lm), ww, hh


def clamp_mask(shape, ww, hh, PW, PH, cx_min, cx_max, cy_min, cy_max):
    """Boolean mask of valid top-left positions whose CENTRE lands in range."""
    ys, xs = np.indices(shape)
    cx = (xs + ww / 2) / PW
    cy = (ys + hh / 2) / PH
    return (cx >= cx_min) & (cx <= cx_max) & (cy >= cy_min) & (cy <= cy_max)


def nms_candidates(score, ww, hh, PW, PH, valid, k, sep):
    """Top-k low-score top-lefts, greedily spread out by >= sep (panel frac)."""
    flat = np.where(valid, score, np.inf).ravel()
    order = np.argsort(flat)
    picks, cxs, cys = [], [], []
    sx = sep * PW
    sy = sep * PH
    for idx in order:
        if not np.isfinite(flat[idx]):
            break
        y, x = divmod(idx, score.shape[1])
        if any(abs(x - px) < sx and abs(y - py) < sy for px, py in picks):
            continue
        picks.append((x, y))
        cxs.append((x + ww / 2) / PW)
        cys.append((y + hh / 2) / PH)
        if len(picks) >= k:
            break
    return [(x, y, score[y, x], cx, cy)
            for (x, y), cx, cy in zip(picks, cxs, cys)]


def overlap(ax, ay, aw, ah, bx, by, bw, bh, gap):
    """Do two centre-anchored boxes (panel fracs) overlap, plus a gap margin?"""
    return (abs(ax - bx) * 2 < (aw + bw) + 2 * gap) and \
           (abs(ay - by) * 2 < (ah + bh) + 2 * gap)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--aspect", default="0.832", help="panel W/H (52vw/100vh @1440x900 = 0.832)")
    ap.add_argument("--posx", type=float, default=0.5)
    ap.add_argument("--posy", type=float, default=0.5)
    ap.add_argument("--grid", type=int, default=300, help="panel sampling height px")
    ap.add_argument("--lum-weight", type=float, default=0.3, help="darkness tie-breaker weight")
    # centre clamp (keep caps clear of the seam / nav / head)
    ap.add_argument("--cx-min", type=float, default=0.0)
    ap.add_argument("--cx-max", type=float, default=1.0)
    ap.add_argument("--cy-min", type=float, default=0.0)
    ap.add_argument("--cy-max", type=float, default=1.0)
    # single box
    ap.add_argument("--win-w", type=float, default=0.44)
    ap.add_argument("--win-h", type=float, default=0.24)
    # two boxes
    ap.add_argument("--two", action="store_true")
    ap.add_argument("--win-a", default="0.40,0.13", help="W,H of box A (panel frac)")
    ap.add_argument("--win-b", default="0.42,0.24", help="W,H of box B (panel frac)")
    ap.add_argument("--balance", type=float, default=0.25, help="pair-symmetry weight (tie-breaker, not a detail override)")
    ap.add_argument("--gap", type=float, default=0.02, help="min gap between boxes")
    ap.add_argument("--order-ab", action="store_true", help="force box A's centre above box B's (reading order)")
    ap.add_argument("--stack", action="store_true", help="force box A FULLY above box B (true vertical stack, never side-by-side)")
    a = ap.parse_args()

    aspect = eval(a.aspect) if "/" in a.aspect else float(a.aspect)
    PH = a.grid
    lum, PW = panel_grid(a.image, aspect, a.posx, a.posy, PH)

    print(a.image)
    if not a.two:
        S, ww, hh = score_maps(lum, PH, PW, a.win_w, a.win_h, a.lum_weight)
        valid = clamp_mask(S.shape, ww, hh, PW, PH, a.cx_min, a.cx_max, a.cy_min, a.cy_max)
        Sm = np.where(valid, S, np.inf)
        y0, x0 = np.unravel_index(np.argmin(Sm), Sm.shape)
        cx = (x0 + ww / 2) / PW
        cy = (y0 + hh / 2) / PH
        print(f"  min-edge {a.win_w:.2f}x{a.win_h:.2f} -> left {cx*100:.1f}%  top {cy*100:.1f}%"
              f"   (score {S[y0, x0]:.3f})")
        return

    wa = [float(v) for v in a.win_a.split(",")]
    wb = [float(v) for v in a.win_b.split(",")]
    SA, waw, wah = score_maps(lum, PH, PW, wa[0], wa[1], a.lum_weight)
    SB, wbw, wbh = score_maps(lum, PH, PW, wb[0], wb[1], a.lum_weight)
    vA = clamp_mask(SA.shape, waw, wah, PW, PH, a.cx_min, a.cx_max, a.cy_min, a.cy_max)
    vB = clamp_mask(SB.shape, wbw, wbh, PW, PH, a.cx_min, a.cx_max, a.cy_min, a.cy_max)
    candA = nms_candidates(SA, waw, wah, PW, PH, vA, k=90, sep=0.10)
    candB = nms_candidates(SB, wbw, wbh, PW, PH, vB, k=90, sep=0.10)

    best = None
    for _, _, sa, ax, ay in candA:
        for _, _, sb, bx, by in candB:
            if a.order_ab and ay >= by:           # A must read above B
                continue
            if a.stack and (ay + wa[1] / 2 > by - wb[1] / 2 - a.gap):
                continue                          # A must sit FULLY above B (no side-by-side)
            if overlap(ax, ay, wa[0], wa[1], bx, by, wb[0], wb[1], a.gap):
                continue
            asym = abs((ax + bx) / 2 - 0.5) + abs((ay + by) / 2 - 0.5)
            cost = sa + sb + a.balance * asym
            if best is None or cost < best[0]:
                best = (cost, ax, ay, bx, by, sa, sb, asym)
    if best is None:
        print("  no non-overlapping placement in the clamp range")
        return
    _, ax, ay, bx, by, sa, sb, asym = best
    print(f"  box A {wa[0]:.2f}x{wa[1]:.2f} -> left {ax*100:.1f}%  top {ay*100:.1f}%   (score {sa:.3f})")
    print(f"  box B {wb[0]:.2f}x{wb[1]:.2f} -> left {bx*100:.1f}%  top {by*100:.1f}%   (score {sb:.3f})")
    print(f"  pair asymmetry {asym:.3f}  (lower = more balanced)")


if __name__ == "__main__":
    main()
