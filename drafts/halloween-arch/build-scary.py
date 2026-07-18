#!/usr/bin/env python3
"""Dense/scary Where's-Waldo redesign of the arch panels.
    FAL_KEY=... python3 build-scary.py [id ...]   # no args = all
"""
import os, sys, json, subprocess, pathlib
HERE = pathlib.Path(__file__).parent
OUT = HERE / "out-scary"; OUT.mkdir(exist_ok=True)

STYLE = (
    "1970s Saturday-morning educational cartoon pushed into a dense, teeming, nightmarish "
    "Where's-Waldo panorama: flat gouache-and-ink cel look, thick uneven hand-inked black "
    "outlines, but DARK — a stormy-night palette of deep navy, charcoal, ember orange, sickly "
    "mustard, blood red, bone cream, lit by fire glow. HUNDREDS of tiny detailed figures each "
    "doing something at once, packed corner to corner, layered vignettes of simultaneous action, "
    "NO empty space. Grim and busy like a Bruegel disaster or an Edward Gorey crowd drawn by a "
    "Schoolhouse Rock artist. Cross-hatched shadows, drifting smoke and embers, dread under the "
    "cartoon — unsettling, not cute. IMPORTANT: no text, no lettering, no words, no numbers, no "
    "signage anywhere in the image."
)
ABBOTT = (
    "Any caricature of the governor must stay recognizable as Greg Abbott: thick silver-gray hair "
    "swept back from a high forehead, heavy dark eyebrows, broad jowly face, prominent nose, thin "
    "mouth, no glasses, dark blue suit and red tie, seated in a manual wheelchair drawn plainly "
    "and never mocked."
)

PANELS = [
    dict(id="mega", ref=True, aspect="16:9",
        art="A vast panoramic map-of-Texas nightmare at night, the whole state seen from above and "
            "teeming. TOWERING at dead center, grown colossal: a caricature of Greg Abbott in his "
            "wheelchair, mouth open in a roar, two roaring orange flames where his eyes should be, "
            "throwing firelight across the entire scene. From his lap a thick river of gold coins "
            "pours down and snakes across the state — flowing toward the lower-left corner where a "
            "giant disembodied pinstriped arm with jeweled cufflinks reaches down from a storm cloud "
            "and a colossal marble bank vault stands stuffed with gold. Scattered across the whole "
            "map: dozens of tiny cheerful red one-room schoolhouses, and from the ground giant grey "
            "carved stone hands rise up to pluck the schoolhouses away while swarms of tiny children "
            "flee in every direction. In one quarter a line of tan-uniformed state troopers on "
            "horseback in riot helmets charges a small knot of tiny cross-legged students holding "
            "books. In another, a huge iron lottery drum on a crank spills a stream of tiny children "
            "down onto an enormous heaped mountain of waitlisted kids. Elsewhere, translucent ghosts "
            "in identical business suits stand in rows over little fresh graves each marked with a "
            "wooden ballot box. Everyone is tiny, everything is happening at once, frantic and "
            "packed, embers and smoke drifting over all of it. No flags, no text."),
    dict(id="harvest", ref=False, aspect="16:9",
        art="A dense teeming nighttime hillside crawling with action: a whole countryside of tiny "
            "cheerful red one-room schoolhouses with little bell towers, and rising from the storm "
            "clouds and the earth, DOZENS of enormous grey carved government-monument stone hands "
            "plucking the schoolhouses up one by one like a grim harvest, some crushing them, some "
            "stuffing them into a giant sack. Hundreds of tiny cartoon schoolchildren and teachers "
            "swarm the ground below, some fleeing, some reaching up for their vanishing schools, some "
            "being scooped up with the buildings. A few tiny appointed men in grey suits stand calmly "
            "on platforms directing the hands with pointers. Fires burning in the distance, embers, "
            "smoke, cross-hatched shadow, absolute dread packed into every inch. No text."),
    dict(id="lottery", ref=False, aspect="16:9",
        art="A vast dim cavernous hall crammed with frantic action, like a nightmare carnival of "
            "chance. At center a colossal iron bingo-style lottery drum on a giant crank, stuffed "
            "with hundreds of tiny frightened children, pours a stream of them out of a chute — a few "
            "land in a small bright golden winners' pen guarded by a grinning top-hatted official, "
            "but the vast majority tumble down onto an ENORMOUS mountain of discarded waitlisted "
            "children that fills half the hall. Off to one side, a sorting machine with grey "
            "officials pulls small children in wheelchairs and leg braces OUT of the golden winners' "
            "line and drops them down a chute into the waitlist heap. Tiny parents crowd at the edges "
            "reaching through bars. A stern clerk stamps a mountain of paper. Cobwebs, guttering "
            "lamplight, long shadows, teeming and grim, hundreds of figures. No text."),
    dict(id="troopers", ref=False, aspect="16:9",
        art="A teeming nighttime university quad under a huge clock tower, packed with frantic "
            "action. A vast wall of tan-uniformed state troopers in riot helmets and mirrored "
            "goggles, many MOUNTED ON HORSEBACK with batons raised, sweeps across the lawn in "
            "formation, driving before them a scattering crowd of tiny individual cartoon students "
            "sitting cross-legged holding books, some being lifted away, some running, some kneeling. "
            "The troopers are drawn as one identical faceless grey-tan mass; the students are all "
            "different tiny individuals. Zip-tied figures led off in a long line at the edge. A "
            "handful of tiny journalists with cameras being shoved back. Searchlights, smoke, embers, "
            "a cold moon, dread and chaos in every corner, hundreds of figures. No text."),
]

def gen(p):
    prompt = STYLE + "\n\n" + p["art"] + ("\n\n" + ABBOTT if p["ref"] else "")
    env = dict(os.environ, ASPECT=p["aspect"])
    cmd = [sys.executable, str(HERE / "gen.py"), prompt, str(OUT / p["id"])]
    if p["ref"]:
        env["FAL_MODEL"] = "fal-ai/nano-banana/edit"; env["IMG"] = str(HERE / "ref-abbott.jpg")
    else:
        env["FAL_MODEL"] = "fal-ai/nano-banana"
    r = subprocess.run(cmd, env=env, capture_output=True, text=True)
    ok = (OUT / f"{p['id']}-1.png").exists()
    print(("OK " if ok else "FAIL ") + p["id"] + ("" if ok else " :: " + r.stdout[-200:] + r.stderr[-200:]))

want = sys.argv[1:]
for p in PANELS:
    if not want or p["id"] in want:
        gen(p)
