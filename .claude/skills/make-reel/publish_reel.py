#!/usr/bin/env python3
"""Publish a single 2pizzaclub Reel (video) to Instagram via instagrapi.

Reuses the same machinery as the insta-publish skill: creds arrive through env
(IG_USER / IG_PASS) only — never argv, never printed — and the session caches to
~/.cache/ig-2pizza/session.json so we don't re-challenge. This is the video
counterpart to publish.py (which only does photo carousels via album_upload).

Usage (creds injected by the caller, same grep pattern as the skill's run.sh):
    IG_USER=.. IG_PASS=.. python publish_reel.py --video out/reel.mp4 \
        --caption-file captions/post.txt --thumbnail out/cover.jpg [--dry-run]
"""
import os, sys, argparse
from pathlib import Path


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--caption-file", required=True)
    ap.add_argument("--thumbnail", default=None, help="JPEG cover (avoids moviepy)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    video = Path(args.video)
    if not video.exists():
        log(f"ERROR: video not found: {video}"); sys.exit(2)
    caption = Path(args.caption_file).read_text().rstrip("\n")
    if not caption.strip():
        log("ERROR: caption empty"); sys.exit(2)
    thumb = Path(args.thumbnail) if args.thumbnail else None
    if thumb and not thumb.exists():
        log(f"ERROR: thumbnail not found: {thumb}"); sys.exit(2)

    log(f"video={video.name}  thumbnail={thumb.name if thumb else '(auto)'}")
    log("--- caption (%d chars) ---" % len(caption)); log(caption); log("-" * 26)

    if args.dry_run:
        log("dry-run: validated, NOT logging in or posting."); return

    user, pw = os.environ.get("IG_USER"), os.environ.get("IG_PASS")
    if not user or not pw:
        log("ERROR: IG_USER / IG_PASS not in environment"); sys.exit(2)

    from instagrapi import Client
    cl = Client()
    cl.delay_range = [2, 5]
    code = os.environ.get("IG_CHALLENGE_CODE")
    if code:
        cl.challenge_code_handler = lambda username, choice: code

    sess = Path.home() / ".cache" / "ig-2pizza" / "session.json"
    sess.parent.mkdir(parents=True, exist_ok=True)
    try:
        if sess.exists():
            try:
                cl.load_settings(sess); cl.login(user, pw); log("logged in (cached session)")
            except Exception as e:
                log("cached session rejected, fresh login:", repr(e))
                cl.set_settings({}); cl.login(user, pw)
        else:
            cl.login(user, pw); log("logged in (fresh)")
        cl.dump_settings(sess)
    except Exception as e:
        log("LOGIN FAILED:", repr(e))
        if "challenge" in repr(e).lower():
            sys.exit(3)
        sys.exit(2)

    kw = {"thumbnail": str(thumb)} if thumb else {}
    media = cl.clip_upload(str(video), caption, **kw)
    code_ = getattr(media, "code", None)
    if code_:
        print(f"https://www.instagram.com/reel/{code_}/")
    else:
        print("uploaded; media:", media)


if __name__ == "__main__":
    main()
