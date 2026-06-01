---
name: insta-publish
description: Publish a rendered 2pizzaclub Instagram carousel (a post set built by /insta-post) to the @2pizzaclub IG account. Use when the user says /insta-publish, asks to "post to instagram", "publish the carousel", "push post N live", or to actually upload the rendered cards (not just render/Signal-preview them). Logs in with the insta-2pizza creds from ~/.env via instagrapi and uploads the slides as one album.
---

# /insta-publish — push a carousel live to Instagram

Takes a post set already rendered by `/insta-post` (cover + receipts/stats in
`out/`, ordered by `out/manifest.json`) and publishes one post as an Instagram
**album/carousel** to the **@2pizzaclub** account.

This is the OUTWARD-FACING, hard-to-reverse step. Render + eyeball + Signal-preview
the post first (that's `/insta-post`). Only publish once the user has approved both
the images **and** the caption.

## Credentials (never read, only grep)

The account is in `~/.env`:

```
insta-2pizza-user: <username>
insta-2pizza-key:  <password>
```

**Never `cat`/`head`/`Read` `~/.env`** (per the global rule — it leaks every secret).
`run.sh` greps exactly these two keys, exports them into the environment, and passes
them to `publish.py`. They are never printed, never put on argv. Do not echo them.

## The pieces

```
.claude/skills/insta-publish/
├── SKILL.md      # this file
├── run.sh        # greps creds → env, auto-provisions the venv, runs publish.py
└── publish.py    # instagrapi album upload (PNG→JPEG, login w/ session cache)
```

- **venv:** `~/.local/ig-venv` (instagrapi + pillow). `run.sh` creates it if missing.
- **session cache:** `~/.cache/ig-2pizza/session.json` — reused so repeat posts skip
  a fresh login (each fresh login risks an IG challenge). Local only, never in the repo.
- **captions:** one file per post, e.g. `<post-set>/captions/<post-id>.txt`. Plain UTF-8,
  newlines + emoji fine (passed by file path, not argv, so nothing to escape).

## How to publish

1. Confirm the post is rendered: `out/<post-id>-*.png` exist and `out/manifest.json`
   lists the post. (Re-run `/insta-post`'s `node render.mjs` if not.)
2. Write/confirm the caption at `captions/<post-id>.txt`. Editorial voice: flat,
   direct, no "we"; present the receipts, cite sources, end with `2pizzaclub.com/efta`.
   Modest relevant hashtags.
3. **Dry-run first** (validates manifest + images + caption, no login, no post):
   ```bash
   bash .claude/skills/insta-publish/run.sh --post <post-id> \
        --caption-file captions/<post-id>.txt --dry-run
   ```
4. **Get explicit user sign-off** on the exact caption + slide order shown by the dry-run.
5. Publish:
   ```bash
   bash .claude/skills/insta-publish/run.sh --post <post-id> \
        --caption-file captions/<post-id>.txt
   ```
   On success it prints the live `https://www.instagram.com/p/<code>/` URL — share it.

`--post` defaults the post set to `drafts/instagram/efta-intro`; override with
`POST_SET=/path/to/<set> run.sh ...` for other sets.

## Updating an already-published post

**Instagram has no edit-media API** — once a carousel is live you cannot swap a
slide. The only editable field is the caption. To fix the images of a live post,
re-publish the corrected carousel and delete the old one:

```bash
bash .claude/skills/insta-publish/run.sh --post <post-id> \
     --caption-file captions/<post-id>.txt --replace <old-shortcode-or-pk>
```

`--replace` uploads the new carousel FIRST, then deletes the old post (so there's
never a gap with nothing live). **The post URL changes** — share the new one. If
the old post has real engagement (likes/comments), it's lost — only do this for
fresh posts or when the user explicitly wants the correction. The `<old-shortcode>`
is the `XXXX` in `instagram.com/p/XXXX/` (or the numeric media pk).

## Challenges (first login from a new device/IP)

Instagram may demand a verification code (email/SMS) or 2FA on first login. `publish.py`
exits with code 3 and a clear message. Get the code from the account, then re-run with
it injected:

```bash
IG_CHALLENGE_CODE=123456 bash .claude/skills/insta-publish/run.sh --post <post-id> --caption-file ...
```

Once a session is cached, later posts won't re-challenge.

## Hard rules

- **Confirm before posting.** Publishing is public and not cleanly reversible. Never
  post without the user approving the caption + images for that specific post.
- **One post per invocation.** Don't batch-publish multiple posts unless asked.
- **Creds are grep-only.** Never `cat ~/.env`; never echo `IG_USER`/`IG_PASS`.
- **Drafts stay gitignored.** Rendered cards + captions live under `drafts/instagram/`
  (gitignored). The session cache lives under `~/.cache`. Nothing secret in the repo.
