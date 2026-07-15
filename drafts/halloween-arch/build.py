#!/usr/bin/env python3
"""Generate every SCHOOLHOUSE SHOCK panel + emit ideas.json for the Signal sender.

    FAL_KEY=... python3 build.py [panel-id ...]      # no args = all
"""
import os, sys, json, subprocess, pathlib

HERE = pathlib.Path(__file__).parent
OUT = HERE / "out"; OUT.mkdir(exist_ok=True)

STYLE = (
    "1973 Schoolhouse Rock Saturday-morning educational cartoon still, art directed by Tom Yohe: "
    "flat gouache-on-paper cel animation, thick uneven hand-inked black outlines, limited 1970s "
    "palette (mustard yellow, burnt orange, avocado green, warm brown, cream, navy), visible paper "
    "grain and screenprint halftone texture, flat color fills, no gradients, no 3D, not photorealistic. "
    "Bold simple shapes that read clearly from far away. "
    "IMPORTANT: no text, no lettering, no words, no numbers, no signage or writing anywhere in the image."
)

# Abbott likeness, appended when a panel uses the reference photo.
ABBOTT = (
    "KEEP THE MAN FROM THE REFERENCE PHOTO CLEARLY RECOGNIZABLE: thick silver-gray hair swept back "
    "from a high forehead, heavy dark eyebrows, broad jowly face, heavy-lidded eyes, prominent nose, "
    "thin mouth. Caricature him with a slightly oversized head and a simplified bouncy cartoon body, "
    "seated in a manual wheelchair, in a blue suit and red tie. Draw the wheelchair plainly and "
    "respectfully — it is never the joke."
)

PANELS = [
    dict(
        id="01-the-governor", title="THE GOVERNOR", slot="arch topper", ref=True, aspect="3:4",
        art="Angry caricature of the governor, alone: mouth wide open mid-shout, brows slammed down, "
            "and two bright orange-and-yellow flames burning where his eyes should be, throwing "
            "flame-light across his face. Plain cream background. Full figure, centered, cut-out ready.",
        caption="The anchor character and arch topper. Fire-eyed, mid-shout, cut out and mounted over "
                "the keystone with an orange gel light so the eyes catch at night.\n\n"
                "The chair is drawn plain and stays factual — it's how he's recognized. The joke is "
                "never the chair; it's always the money and the schools.",
    ),
    dict(
        id="02-the-proud-announcement", title="THE PROUD ANNOUNCEMENT", slot="left column · the money",
        ref=True, aspect="1:1",
        art="The governor at a press podium bristling with old-fashioned microphones, grinning wide and "
            "proud, holding up an ENORMOUS ceremonial novelty bank cheque with both hands like a prize. "
            "THE CHEQUE IS COMPLETELY BLANK — pure flat pale paper, absolutely no writing, no numbers, "
            "no signature, no printing of any kind on it. A second pair of hands reaches in from the "
            "right to accept it, holding a small Israeli national flag (white with two horizontal blue "
            "stripes and a blue six-pointed star). Behind them, the pink granite dome of the Texas State "
            "Capitol. Confetti, camera flashbulbs, a ribbon-cutting mood. Everyone is delighted. "
            "Bright, cheerful, civic.",
        caption="THE MONEY, thread 1. Not a secret — a press release.\n\n"
                "RECEIPT: On Feb 12 2026 Acting Comptroller Kelly Hancock doubled Texas's holding of "
                "Israel bonds from ~$140M to $280M — the state's largest such purchase ever, moving "
                "Texas from the 6th- to the 2nd-largest state investor. His words: \"Texas proudly "
                "stands with Israel.\" Texas has bought Israel bonds every year since 1994; the 2023 "
                "tranche paid 5.4% over 3 years.\n"
                "comptroller.texas.gov — press release, 2026-02-12\n\n"
                "HONEST: these are BONDS (loans that pay Texas interest), not gifts, and the state "
                "never says which fund they come from. The joke is the grin, not a hidden hand.",
    ),
    dict(
        id="03-the-oath", title="THE OATH", slot="left column · the money · KEYSTONE FACT",
        ref=False, aspect="1:1",
        art="Interior of a warm, sunny elementary-school therapy room. A kind young woman speech "
            "therapist in a cardigan sits at a tiny round table across from a small child, mid-lesson, "
            "with alphabet blocks and picture cards spread between them. From the left, a long grey "
            "bureaucratic arm in a dark suit sleeve slides a stiff official certification card and a "
            "fountain pen across the table, right into the middle of the lesson. The therapist looks at "
            "the card. The child waits, still holding a block. Gentle room, cold intrusion.",
        caption="THE MONEY, thread 2 — and the hinge of the whole arch. This is where the Israel thread "
                "and the schools thread actually touch, on the record.\n\n"
                "RECEIPT: Under HB 89 (2017, signed by Abbott), Texas contractors had to certify they "
                "do not and will not boycott Israel. Bahia Amawi — an elementary speech pathologist "
                "who worked with Arabic-speaking kids with speech disorders in PFLUGERVILLE ISD — was "
                "handed that certification at the start of 2018-19. She refused to sign and lost the "
                "job. On 2019-04-25 Judge Robert Pitman (W.D. Tex.) struck the law down in a 56-page "
                "opinion; the AG appealed.\n"
                "theintercept.com + texastribune.org, Apr 2019\n\n"
                "HONEST: Texas then narrowed the law to bigger contractors, mooting the appeal — a "
                "solo therapist wouldn't be covered today. The 2018 facts stand as drawn.",
    ),
    dict(
        id="04-the-biggest-check", title="THE BIGGEST CHECK", slot="left column · the money",
        ref=True, aspect="1:1",
        art="A colossal disembodied hand in a pinstriped sleeve reaches down from a cloud at the top of "
            "the frame, far outside the state, and drops a gigantic bank cheque into the lap of the "
            "small seated governor below, who catches it with a delighted grin. The cheque is so big it "
            "dwarfs him. Below them, the outline of the state of Texas as a simple map shape, with tiny "
            "schoolhouses dotted across it looking up. The hand's cuff has expensive cufflinks.",
        caption="THE MONEY, thread 3 — who bought the policy.\n\n"
                "RECEIPT: Jeff Yass, an out-of-state billionaire (TikTok investor) whose signature "
                "issue is school vouchers, gave Abbott $6,000,000 in Jan 2024 — reported as the "
                "largest single campaign donation in Texas history — after $250K in Oct 2023, then "
                "another $4,000,000 on 2024-04-03. Abbott spent the 2024 primaries hunting fellow "
                "Republicans who had voted vouchers down.\n"
                "texastribune.org, 2024-01-16 + 2024-07-17",
    ),
    dict(
        id="05-corruption-junction", title="CORRUPTION JUNCTION", slot="left column · the money",
        ref=False, aspect="1:1",
        art="A jolly 1970s cartoon railway switching yard. A cheerful anthropomorphic steam locomotive "
            "with a big friendly face pulls a line of open hopper cars heaped with gold coins and "
            "money bags. A grinning switchman in overalls in a little signal tower throws a big lever, "
            "and the track visibly diverts AWAY from a small red schoolhouse sitting sadly on a siding, "
            "curving off toward the horizon instead. Puffy clouds, rolling green hills, coupling hooks "
            "clanking together. Bright and bouncy and completely unbothered.",
        caption="THE MONEY, thread 4 — the arch's title song. Schoolhouse Rock's \"Conjunction "
                "Junction\" was about hooking up words. This one hooks up money.\n\n"
                "\"Corruption Junction, what's your function?\" — the type goes across the sky here. "
                "The schoolhouse is on the siding; the train is not stopping.\n\n"
                "STRUCTURE: this is the panel that names the whole left column.",
    ),
    dict(
        id="06-the-hand", title="THE HAND", slot="right column · the schools",
        ref=False, aspect="1:1",
        art="A cheerful little red one-room schoolhouse with a bell tower and a Texas flag, standing in "
            "a green yard. A COLOSSAL grey stone hand reaches down out of a stormy sky and closes its "
            "fingers around the whole schoolhouse, lifting it off its foundation. Tiny cartoon "
            "schoolchildren and a teacher look up in alarm from the yard below. The hand is carved and "
            "official-looking, like a government monument come to life. Dramatic low angle.",
        caption="THE SCHOOLS, thread 1 — the state takes a district.\n\n"
                "RECEIPT: On 2023-06-01 the Texas Education Agency, under Commissioner Mike Morath, "
                "installed an APPOINTED Board of Managers over HOUSTON ISD — the largest district in "
                "Texas, ~184,000 kids — replacing the board voters had elected, and named Mike Miles "
                "superintendent. State control has since been extended to 2027-06-01.\n"
                "tea.texas.gov — news releases, 2023 + 2025\n\n"
                "HONEST: TEA's rationale (chronic low ratings at Wheatley High, board dysfunction) is "
                "an attributed claim, not a fact — and so is the unions' counter-framing. The arch "
                "shows the hand; the reader weighs it.",
    ),
    dict(
        id="07-im-just-a-voucher", title="I'M JUST A VOUCHER", slot="right column · the schools",
        ref=False, aspect="1:1",
        art="A parody of the sad rolled-up scroll character from Schoolhouse Rock's 'I'm Just a Bill', "
            "sitting slumped on the marble steps of a grand capitol building. But this little scroll "
            "character is halfway through TRANSFORMING into a bank cheque: his lower half is already "
            "crisp printed cheque paper with a signature line, while his rolled-parchment top half "
            "still has a sad hopeful cartoon face. Beside him a jaunty top-hatted cartoon lobbyist "
            "pats him on the head. In the background, up the steps, a grand private academy with "
            "columns and topiary; far down the hill, a small plain public school. Sunny day.",
        caption="THE SCHOOLS, thread 2 — the voucher. The most direct Schoolhouse Rock parody in the "
                "set: the bill on the steps grew up into a cheque.\n\n"
                "RECEIPT: SB 2 (89th Leg.), signed by Abbott 2025-05-03. $1 BILLION to start — the "
                "largest first-year launch of any program of its kind in the country. $10,330 per "
                "student in FY2027, ~$2,000 for homeschoolers, up to $30,000 for special ed. First "
                "usable in the 2026-27 school year — this one.\n"
                "kut.org 2025-05-02 · legiscan SB2 text",
    ),
    dict(
        id="08-the-empty-desk", title="THE EMPTY DESK", slot="right column · the schools",
        ref=False, aspect="1:1",
        art="A bright cheerful cartoon classroom, seen from the back. Sunny windows, a teacher up front "
            "still teaching with a pointer and a determined smile. THE CHALKBOARD BEHIND HER IS "
            "COMPLETELY BLANK AND EMPTY — a plain flat green surface with absolutely nothing on it: no "
            "writing, no chalk marks, no numbers, no diagrams, no shapes, no stars, no symbols of any "
            "kind whatsoever. But the pupils' "
            "desks are DISSOLVING one by one into little gold coins that float up and out through the "
            "open window in a stream, taking the children with them. Two or three kids remain, sitting "
            "in the gaps. The teacher keeps teaching. Warm light, quiet horror, no menace in anyone's "
            "face.",
        caption="THE SCHOOLS, thread 3 — the mechanism, drawn plainly. Texas funds schools per student; "
                "the money walks out with the kid.\n\n"
                "EDITORIAL SPINE: the Texas Observer calls it the \"Texas Three-Step: Defund, Demonize, "
                "and Privatize.\" Jacobin: Abbott \"is trying to destroy public education — and dim "
                "those Friday night lights.\" Texas AFT calls the voucher \"a growing billion-dollar "
                "boondoggle.\"\n"
                "texasobserver.org · jacobin.com · texasaft.org\n\n"
                "HONEST: this panel illustrates the critics' thesis, which is an argument, not a "
                "measured fact. It's the one panel that's a claim rather than a receipt — flagging "
                "that so you can decide whether it earns a slot.",
    ),
    dict(
        id="09-the-tablets", title="THE TABLETS", slot="right column · the schools",
        ref=False, aspect="1:1",
        art="A cheerful cartoon classroom. Two enormous heavy grey stone tablets with rounded tops — "
            "blank, no writing on them at all — have been bolted with big iron industrial bolts "
            "straight over the top of the chalkboard, completely covering it. Chalk dust drifts. A "
            "cartoon child at a desk in the foreground cranes their neck around the edge of the "
            "tablets, trying to see the lesson underneath. A workman on a stepladder tightens the last "
            "bolt with a wrench. Sunny, bright, matter-of-fact.",
        caption="THE SCHOOLS, thread 4 — the state in the classroom.\n\n"
                "RECEIPT: SB 10 (2025) requires the Ten Commandments displayed in EVERY public-school "
                "classroom in Texas. Passed 2025-05-28, signed by Abbott 2025-06-21. Judge Fred Biery "
                "blocked it for 11 districts (2025-08-20); Judge Orlando Garcia blocked 14 more (Nov "
                "2025); the Fifth Circuit UPHELD it on 2026-04-21. It stands.\n"
                "en.wikipedia.org/wiki/Texas_Senate_Bill_10 (+ the opinions)\n\n"
                "NOTE: tablets drawn blank on purpose — the panel is about what's bolted OVER the "
                "chalkboard, not about the text on them.",
    ),
    dict(
        id="10-the-buried-ballot", title="THE BURIED BALLOT", slot="right column · the schools",
        ref=False, aspect="1:1",
        art="A moonlit cartoon graveyard with a crooked picket fence, on a hill behind a small dark "
            "schoolhouse. A fresh grave has just been filled in; a wooden ballot box sits half-buried "
            "in the mound like a headstone, with a paper ballot still sticking out of its slot. "
            "Standing over the grave in a neat row are several translucent pale ghosts in identical "
            "business suits, holding briefcases, looking politely pleased with themselves. A jack-o'- "
            "lantern glows nearby. Big friendly Halloween moon.",
        caption="THE SCHOOLS, thread 5 — the Halloween panel proper, and the one that earns the arch.\n\n"
                "RECEIPT: Houston voters elected a school board. On 2023-06-01 the state replaced it "
                "with appointees who answer to the Commissioner, not to voters. That arrangement now "
                "runs to 2027-06-01 — four years of a district of ~184,000 children run by a board no "
                "one voted for.\n"
                "tea.texas.gov news releases\n\n"
                "The ghosts are the appointed managers. The grave is the election.",
    ),
    dict(
        id="11-the-troopers", title="THE TROOPERS", slot="right column · Austin",
        ref=False, aspect="1:1",
        art="A sunny green university campus lawn with a big clock tower in the background. A long line "
            "of state troopers in tan uniforms, riot helmets and mirrored sunglasses, some MOUNTED ON "
            "HORSEBACK, advances in formation across the grass toward a small cluster of cartoon "
            "college students who are sitting cross-legged on the ground holding books. The troopers "
            "are drawn as a single wall of identical shapes. The students are individuals. Bright blue "
            "sky, absurdly cheerful sunshine.",
        caption="AUSTIN. Our campus, our county, on the record.\n\n"
                "RECEIPT: On 2024-04-24, 100+ DPS troopers went onto the UT-Austin campus at Abbott's "
                "direction. 57 people were arrested — and Travis County Attorney Delia Garza dropped "
                "EVERY charge for lack of probable cause. On 04-29, 79 more were arrested. Abbott that "
                "day, verbatim: \"These protesters belong in jail... Students joining in hate-filled, "
                "antisemitic protests at any public college or university in Texas should be "
                "expelled.\"\n"
                "texastribune.org 2024-04-25 + 04-30 · x.com/GregAbbott_TX/status/1783237229252346194\n\n"
                "The arrests were ordered. The charges didn't survive contact with a lawyer.",
    ),
    dict(
        id="12-the-rating", title="THE RATING", slot="right column · the schools", ref=False, aspect="1:1",
        art="A cosy cartoon school library with warm lamps and full shelves. At a desk, a cheerful "
            "bookseller in an apron is being made to work an absurd giant clanking machine bolted to "
            "the desk: books go in a hopper at the top, and the machine stamps each one and spits it "
            "into one of two chutes — a happy green bin, or a locked black iron cage. A stern grey "
            "official in a suit stands over the bookseller's shoulder pointing at the cage. A couple "
            "of kids peek around a shelf, watching. Blank stamps and blank bins, no writing.",
        caption="THE SCHOOLS, thread 6 — the state makes the bookseller do the banning.\n\n"
                "RECEIPT: HB 900, the READER Act, signed by Abbott 2023-06-13. It didn't ban books "
                "directly — it ordered VENDORS to rate every book they sell to Texas schools, recall "
                "the ones they rated explicit, and adopt TEA's 'corrected rating' within 60 days or be "
                "posted on a public list and cut off from the entire Texas school market.\n"
                "capitol.texas.gov — HB900 enrolled text, §§35.002–35.003\n\n"
                "STATUS (most coverage gets this wrong): the widely-cited Jan 2024 Fifth Circuit "
                "ruling was only PRELIMINARY. On 2025-10-21 Judge Alan Albright made it PERMANENT — "
                "READER 'compels speech, is void for vagueness, and is an unconstitutional prior "
                "restraint.' Texas appealed 2025-10-23 (5th Cir. 25-50891); as of now it's undecided "
                "and the injunction is IN FORCE. So this panel is a law currently blocked — draw it "
                "as a ghost that could come back, or drop it. Your call.",
    ),
    dict(
        id="14-the-blacklist", title="THE BLACKLIST", slot="left column · WHERE THE THREADS MEET",
        ref=False, aspect="1:1",
        art="A grand marble bank vault labelled nothing, its round door open, stuffed with gold coins and "
            "topped with a cheerful little cartoon schoolhouse sitting right on top of the pile like a "
            "hood ornament. In front of the vault a stern grey official in a suit stands at a lectern "
            "holding a long unfurled scroll that spills onto the floor, and with his other hand he is "
            "using enormous iron tongs to lift a sad little cartoon ICE CREAM CONE character out of the "
            "coin pile and drop it into a dustbin. The ice cream cone has a small worried face. Other "
            "small product characters queue up nervously to be inspected. Bright, absurd, bureaucratic.",
        caption="WHERE THE TWO THREADS ACTUALLY MEET — and this is the one I'd build the arch around. "
                "It is better than 'school money buys Israeli bonds,' which I could NOT verify and am "
                "not claiming.\n\n"
                "RECEIPT: Texas Gov't Code §808.001(6) lists who must divest from companies that "
                "boycott Israel. Verbatim, the last item on that list: \"(F) the permanent school "
                "fund.\" The PSF is the endowment that exists to pay for Texas public schools — named "
                "in the statute, by name. Chapter 808 came from HB 89 (2017), the same Abbott-signed "
                "bill as the certification in idea 3. The Comptroller \"shall prepare and maintain... "
                "a list of all companies that boycott Israel\"; listed companies must be divested 50% "
                "by day 180, 100% by day 360.\n\n"
                "The current list (Q4 2025) has 10 companies. BEN & JERRY'S and UNILEVER are on it — "
                "added Sept 2021, never removed. Airbnb was listed 2019-03-01 and gone by 2019-05-08.\n"
                "comptroller.texas.gov/purchasing/docs/anti-bds.xlsx\n\n"
                "So: the schoolkids' endowment is legally required to screen its money against a state "
                "blacklist, and the ice cream is on it. That's the arch in one panel.",
    ),
    dict(
        id="15-the-rulebook", title="THE RULEBOOK", slot="right column · the schools · RISKY, YOUR CALL",
        ref=False, aspect="1:1",
        art="A principal's office. A small cartoon child sits in a chair facing a big desk, swinging "
            "their feet. Behind the desk a principal in a bow tie is not looking at the child at all — "
            "he is holding up an ENORMOUS heavy leather rulebook, so big it hides his whole upper body, "
            "and squinting at it. Over his shoulder a grey official in a suit taps the page with one "
            "finger, showing him where to read. The rulebook's pages are blank. A framed diploma and a "
            "potted plant. Warm office light, bureaucratic absurdity, nobody looking at the kid.",
        caption="THE SCHOOLS, thread 7 — the state supplies the definition.\n\n"
                "RECEIPT: SB 326, signed by Abbott 2025-05-20, effective immediately. When a Texas "
                "school or university disciplines a student for conduct that \"may reasonably be "
                "determined to have been motivated by antisemitism,\" it must use the definition in "
                "Gov't Code §448.001 — which is the IHRA working definition, \"including the examples "
                "referenced in that term.\" Covers K-12 AND higher ed. Passed 129-8 in the House.\n"
                "capitol.texas.gov — SB00326F\n\n"
                "HONEST, AND WHY I'M FLAGGING IT: the bill's own SECTION 3 says the legislature "
                "intends it NOT to punish First Amendment-protected speech. The dispute is over "
                "whether the IHRA examples sweep in criticism of Israel — that is a genuine argument, "
                "not a settled fact, and both sides are making a claim. This is the panel most likely "
                "to be misread on a lawn in two seconds. It's an idea, not a recommendation — I'd "
                "probably leave it off the arch and keep 3 and 14, which are unambiguous.",
    ),
    dict(
        id="13-keystone", title="KEYSTONE — SCHOOLHOUSE SHOCK", slot="top span", ref=True, aspect="16:9",
        art="A wide horizontal banner composition with a big EMPTY sky across the top two thirds for "
            "lettering to be added later. Along the bottom third: on the left, a row of small cheerful "
            "cartoon schoolhouses and tiny waving children; on the right, the seated governor drawn "
            "LARGE and looming over them, grinning, with small orange flames flickering in his eyes, "
            "one hand resting possessively on the roof of the nearest schoolhouse like it's a pet. "
            "Autumn trees, pumpkins, and orange Halloween bunting along the very bottom edge. Keep the "
            "upper sky clean and uncluttered.",
        caption="THE KEYSTONE — the top span of the arch. Deliberately left with a big empty sky so the "
                "type drops in cleanly with no overlap on the art.\n\n"
                "TYPE: \"SCHOOLHOUSE SHOCK\" big across the sky, kicker underneath: \"Knowledge is "
                "power! (Ask your governor.)\"\n\n"
                "Left column = THE MONEY. Right column = THE SCHOOLS. This is where they meet.",
    ),
]


def gen(p):
    prompt = STYLE + "\n\n" + p["art"] + ("\n\n" + ABBOTT if p["ref"] else "")
    env = dict(os.environ, ASPECT=p["aspect"])
    cmd = [sys.executable, str(HERE / "gen.py"), prompt, str(OUT / p["id"])]
    if p["ref"]:
        env["FAL_MODEL"] = "fal-ai/nano-banana/edit"
        env["IMG"] = str(HERE / "ref-abbott.jpg")
    else:
        env["FAL_MODEL"] = "fal-ai/nano-banana"
    r = subprocess.run(cmd, env=env, capture_output=True, text=True)
    ok = (OUT / f"{p['id']}-1.png").exists()
    print(("✓ " if ok else "✗ ") + p["id"] + ("" if ok else " :: " + r.stdout[-300:] + r.stderr[-300:]))
    return ok


want = sys.argv[1:]
todo = [p for p in PANELS if not want or p["id"] in want or p["id"].split("-")[0] in want]
for p in todo:
    gen(p)

ideas = []
for i, p in enumerate(PANELS, 1):
    f = OUT / f"{p['id']}-1.png"
    if not f.exists():
        continue
    ideas.append({
        "id": p["id"],
        "files": [str(f)],
        "caption": f"🎃 SCHOOLHOUSE SHOCK · idea {i}/{len(PANELS)} — {p['title']}\n"
                   f"[{p['slot']}]\n\n{p['caption']}",
    })
(HERE / "ideas.json").write_text(json.dumps(ideas, indent=2))
print(f"\nideas.json: {len(ideas)}/{len(PANELS)} panels")
