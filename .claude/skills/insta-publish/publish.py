#!/usr/bin/env python3
"""Publish a rendered 2pizzaclub carousel to Instagram via instagrapi.

Reads the post set's out/manifest.json, finds the post by id, converts each
slide PNG to JPEG (Instagram wants JPEG; our cards are opaque 1080x1350 4:5),
logs in with IG_USER / IG_PASS from the environment (NEVER passed on argv,
never printed), and uploads the ordered slides as one album (carousel).

Credentials come in through env only — run.sh greps them from ~/.env. This
script never echoes them. Session tokens cache to ~/.cache/ig-2pizza/session.json
so repeat posts skip a fresh login (and the extra challenge risk that carries).

Usage (via run.sh, which injects creds):
    run.sh --post p2-the-corridor --caption-file captions/p2-the-corridor.txt
    run.sh --post p2-the-corridor --caption-file ... --dry-run   # validate only
"""
import os, sys, json, argparse, tempfile
from pathlib import Path
from PIL import Image

CREAM = (255, 248, 231)  # --paper; flatten any alpha onto the brand cream


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def to_jpeg(src: Path, dst_dir: Path) -> Path:
    im = Image.open(src)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, CREAM)
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    dst = dst_dir / (src.stem + ".jpg")
    im.save(dst, "JPEG", quality=92)
    return dst


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--post", required=True, help="post id in out/manifest.json")
    ap.add_argument("--out", required=True, help="path to the post set's out/ dir")
    ap.add_argument("--caption-file", required=True)
    ap.add_argument("--dry-run", action="store_true",
                    help="validate images + caption, do not log in or post")
    ap.add_argument("--replace", default=None,
                    help="shortcode or media pk of an ALREADY-PUBLISHED post to "
                         "delete after this upload succeeds. Instagram has no "
                         "edit-media API, so 'updating' a live post = repost the "
                         "corrected carousel then delete the old one. URL changes.")
    args = ap.parse_args()

    user = os.environ.get("IG_USER")
    pw = os.environ.get("IG_PASS")
    if not args.dry_run and (not user or not pw):
        log("ERROR: IG_USER / IG_PASS not in environment (use run.sh)")
        sys.exit(2)

    out = Path(args.out)
    manifest = json.loads((out / "manifest.json").read_text())
    post = next((p for p in manifest["posts"] if p["id"] == args.post), None)
    if not post:
        ids = ", ".join(p["id"] for p in manifest["posts"])
        log(f"ERROR: post '{args.post}' not in manifest. have: {ids}")
        sys.exit(2)

    files = [out / f for f in post["files"]]
    missing = [str(f) for f in files if not f.exists()]
    if missing:
        log("ERROR: missing slide files:\n  " + "\n  ".join(missing))
        sys.exit(2)
    if not (2 <= len(files) <= 10):
        log(f"ERROR: album needs 2-10 images, post has {len(files)}")
        sys.exit(2)

    caption = Path(args.caption_file).read_text().rstrip("\n")
    if not caption.strip():
        log("ERROR: caption file is empty")
        sys.exit(2)

    log(f"post={args.post}  title={post.get('title')!r}  slides={len(files)}")
    for f in files:
        log("   ", f.name)
    log("--- caption (%d chars) ---" % len(caption))
    log(caption)
    log("--------------------------")

    if args.dry_run:
        log("dry-run: validated, NOT logging in or posting.")
        return

    tmp = Path(tempfile.mkdtemp(prefix="ig-jpg-"))
    jpegs = [to_jpeg(f, tmp) for f in files]

    from instagrapi import Client
    from instagrapi.exceptions import ChallengeRequired, TwoFactorRequired

    cl = Client()
    cl.delay_range = [2, 5]  # be polite / less bot-like
    code = os.environ.get("IG_CHALLENGE_CODE")
    if code:
        cl.challenge_code_handler = lambda username, choice: code

    sess = Path.home() / ".cache" / "ig-2pizza" / "session.json"
    sess.parent.mkdir(parents=True, exist_ok=True)

    try:
        if sess.exists():
            try:
                cl.load_settings(sess)
                cl.login(user, pw)
                log("logged in (cached session reused)")
            except Exception as e:
                log("cached session rejected, fresh login:", repr(e))
                cl.set_settings({})
                cl.login(user, pw)
        else:
            cl.login(user, pw)
            log("logged in (fresh)")
    except TwoFactorRequired:
        log("CHALLENGE: this account has 2FA. Re-run with IG_CHALLENGE_CODE=<code>.")
        sys.exit(3)
    except ChallengeRequired:
        log("CHALLENGE: Instagram wants a verification code sent to the account "
            "email/SMS. Get the code, then re-run with IG_CHALLENGE_CODE=<code>.")
        sys.exit(3)

    cl.dump_settings(sess)

    media = cl.album_upload(jpegs, caption)
    mcode = getattr(media, "code", None)
    log(f"POSTED ok  media_pk={media.pk}  code={mcode}")
    if mcode:
        print(f"https://www.instagram.com/p/{mcode}/")

    # Update-a-live-post path: new carousel is up, now remove the stale one.
    if args.replace:
        ref = args.replace.strip()
        try:
            old_pk = ref if ref.isdigit() else cl.media_pk_from_code(ref)
            cl.media_delete(str(old_pk))
            log(f"replaced: deleted old post {ref} (pk={old_pk})")
        except Exception as e:
            log(f"WARNING: new post is live but deleting old '{ref}' failed: {e!r}. "
                f"Delete it manually in the app.")


if __name__ == "__main__":
    main()
