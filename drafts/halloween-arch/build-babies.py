#!/usr/bin/env python3
"""'Rogues' Gallery' trading cards — Thiel / Netanyahu / Karp as recognizable cartoon babies.
   Baseball-card format, minus the baseball. Reference-photo driven for likeness.
       FAL_KEY=... python3 build-babies.py [id ...]   # no args = all
   Art renders with a BLANK nameplate banner (dodges baked-text garble); add-type.py
   overlays clean name text afterward.
"""
import os, sys, subprocess, pathlib
HERE = pathlib.Path(__file__).parent
OUT = HERE / "out-babies"; OUT.mkdir(exist_ok=True)

STYLE = (
    "A vintage 1970s Saturday-morning cartoon TRADING CARD, like a collectible bubble-gum card but "
    "NOT baseball. Flat gouache-and-ink Schoolhouse Rock cel look, thick clean hand-inked black "
    "outlines, warm limited palette of mustard yellow, navy blue, dusty red, cream and ink. The card "
    "has a bold ornate cartoon border framing a single portrait, a small blank round badge in the top "
    "corner, and a wide BLANK banner ribbon across the bottom (absolutely no text, no letters, no "
    "numbers, no words anywhere — leave the banner empty). Bright, friendly, comic-strip presentation "
    "with a knowing edge. Centered single subject, three-quarter portrait, playful."
)

# Turn the referenced adult into a chubby cartoon BABY while holding the likeness.
def baby(features, prop, palette):
    return (
        "Redraw the person in the reference photo as an adorable CHUBBY CARTOON BABY — big round head, "
        "fat cheeks, tiny body, seated like an infant — but keep them INSTANTLY RECOGNIZABLE as the same "
        f"specific person. Preserve their signature features exactly: {features}. {prop} "
        f"Background is a flat {palette}. The baby is cute and goofy but unmistakably this individual."
    )

CARDS = [
    dict(id="netanyahu", ref="ref-netanyahu.jpg",
         art=baby(
             "silver-grey hair combed back over a receding hairline, heavy hooded eyes, jowly "
             "downturned mouth, broad tanned face, thick neck",
             "The baby wears a tiny navy suit with an oversized bright-blue necktie and clutches a huge "
             "baby bottle brimming with gold coins and cash instead of milk.",
             "navy-blue field with faint radiating cartoon sunburst")),
    dict(id="thiel", ref="ref-thiel.jpg",
         art=baby(
             "very high domed forehead with a receding brown hairline and only a wisp of hair, pale skin, "
             "close-set pale-blue eyes, a tight thin-lipped tense smile",
             "The baby sits on a stack of blocky computer-server bricks and grips a chess king piece in "
             "one pudgy fist and a plain juice box in the other.",
             "dusty-red field with faint radiating cartoon sunburst")),
    dict(id="karp",  ref="ref-karp.jpg",
         art=baby(
             "an enormous wild frizzy electric cloud of grey-brown hair, thin rimless wire eyeglasses, "
             "a gaunt narrow face with stubble, wide alert eyes",
             "The baby cradles a large glowing crystal ball — an all-seeing seeing-stone — that lights his "
             "face from below, and wears a tiny grey blazer over an open collar.",
             "mustard-yellow field with faint radiating cartoon sunburst")),
]

def gen(c):
    prompt = STYLE + "\n\n" + c["art"]
    env = dict(os.environ, ASPECT="3:4",
               FAL_MODEL="fal-ai/nano-banana/edit", IMG=str(HERE / c["ref"]))
    cmd = [sys.executable, str(HERE / "gen.py"), prompt, str(OUT / c["id"])]
    r = subprocess.run(cmd, env=env, capture_output=True, text=True)
    ok = (OUT / f"{c['id']}-1.png").exists()
    print(("OK " if ok else "FAIL ") + c["id"] + ("" if ok else " :: " + r.stdout[-300:] + r.stderr[-300:]))

want = sys.argv[1:]
for c in CARDS:
    if not want or c["id"] in want:
        gen(c)
