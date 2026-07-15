# SCHOOLHOUSE SHOCK — a Halloween arch

A Costco-style walk-through Halloween archway, made by us, for an Austin front yard.
Surface read: a bright 1970s Saturday-morning cartoon. Payload: the documented record on
where Texas school money goes and who runs the schools.

The device is the same one the children's book uses — cheerful presentation carrying grim
receipts. Schoolhouse Rock taught kids how a bill becomes a law. This arch teaches the rest.

## Title

**SCHOOLHOUSE SHOCK** across the top span.
Kicker under it: *"Knowledge is power! (Ask your governor.)"*

## Anatomy

A freestanding walk-through arch, ~8 ft tall × ~5 ft wide opening.

```
            [ TOPPER: fire-eyed Abbott bust, cut-out ]
   ╔═══════════════════════════════════════════════╗
   ║   TOP SPAN / KEYSTONE  — title + kicker       ║   ~24in tall
   ╚═══════════════════════════════════════════════╝
   ┌─────────────┐                   ┌─────────────┐
   │  L-PANEL 1  │                   │  R-PANEL 1  │   each ~24x24in
   ├─────────────┤                   ├─────────────┤
   │  L-PANEL 2  │    walk-through   │  R-PANEL 2  │
   ├─────────────┤                   ├─────────────┤
   │  L-PANEL 3  │                   │  R-PANEL 3  │
   └─────────────┘                   └─────────────┘
      left column                       right column
```

- **Left column = THE MONEY.** Where it goes.
- **Right column = THE SCHOOLS.** Who took them.
- **Keystone** = the two threads meeting.
- **Under-arch soffit** = the payoff line, only visible walking through.

## Build

Recommended: **4mm coroplast** panels (weatherproof, light, ~$20/sheet at a sign shop,
takes a direct print) zip-tied to a **1in PVC** frame, feet in two 5-gal buckets of
concrete. Alternative: 1/2in plywood + exterior latex if you want it to last years and
don't mind the weight and the wind load.

Print path: send each panel PNG to a local sign shop as a coroplast direct print, or
print on adhesive vinyl and squeegee onto blank coroplast. Austin options: Ideal Signs,
FastSigns, or a banner shop on Burnet.

Lighting: warm amber uplights at the feet. Orange gel on the topper so the eye-flames
catch at night.

## Art rules

- **Style:** 1973 Schoolhouse Rock (Tom Yohe): flat gouache cel look, thick uneven
  hand-inked outlines, limited palette (mustard, burnt orange, avocado, warm brown,
  cream, navy), paper grain + halftone, flat fills, no gradients, no 3D.
- **Legibility beats authenticity.** Viewed from the sidewalk at 20+ ft. Bold flat
  shapes and heavy outlines read; fine grain muds out. Keep figures big.
- **Recognizable people, cartoon form.** Drive every likeness from a public-domain
  reference photo through `fal-ai/nano-banana/edit` — text-only prompts produce generic
  faces (the first Abbott test came back a bald stranger; he has a full head of
  swept-back silver-gray hair).
- **Abbott's wheelchair is present and never the punchline.** It is how he is recognized.
  The target is the policy, not the body. No gag ever lands on the chair.
- **No text baked into generated art.** Image models garble lettering. Panels are
  generated art-only; all type is set afterward in a layout pass on a flat plate, never
  overlapping a figure.
- **Every panel is sourced.** A claim that can't survive its own footnote doesn't ship.
  Facts and citations live in `PANELS.md`.

## Files

- `gen.py` — fal helper (speaks nano-banana + flux body shapes)
- `ref-*.jpg` — public-domain likeness references
- `PANELS.md` — the panel list, each with its documented source
- `out/` — rendered panels
