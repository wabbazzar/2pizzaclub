#!/usr/bin/env bash
# Publish a rendered 2pizzaclub carousel to Instagram.
#
# Credentials live in ~/.env as:
#     insta-2pizza-user: <username>
#     insta-2pizza-key:  <password>
# They are grepped here and exported into the environment ONLY — never printed,
# never passed on argv, never `cat`'d. Same shape as the `ice` sudo pattern.
#
# Usage:
#   run.sh --post p2-the-corridor --caption-file captions/p2-the-corridor.txt
#   run.sh --post p2-the-corridor --caption-file ... --dry-run
#
# Override the post set with POST_SET=/path/to/<set> (defaults to efta-intro).
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$HOME/.local/ig-venv"
POST_SET="${POST_SET:-/home/wabbazzar/code/2pizzaclub/drafts/instagram/efta-intro}"

# auto-provision the venv if missing
if [ ! -x "$VENV/bin/python" ]; then
    echo "creating instagrapi venv at $VENV ..." >&2
    python3 -m venv "$VENV"
    "$VENV/bin/pip" install --quiet --upgrade pip
    "$VENV/bin/pip" install --quiet instagrapi pillow
fi

# caption-file may be given relative to the post set
args=("$@")
for i in "${!args[@]}"; do
    if [ "${args[$i]}" = "--caption-file" ]; then
        j=$((i + 1))
        cf="${args[$j]}"
        if [ -n "$cf" ] && [ ! -f "$cf" ] && [ -f "$POST_SET/$cf" ]; then
            args[$j]="$POST_SET/$cf"
        fi
    fi
done

IG_USER="$(grep '^insta-2pizza-user:' ~/.env | cut -d':' -f2- | sed 's/^[[:space:]]*//;s/"//g')"
IG_PASS="$(grep '^insta-2pizza-key:'  ~/.env | cut -d':' -f2- | sed 's/^[[:space:]]*//;s/"//g')"
export IG_USER IG_PASS

exec "$VENV/bin/python" "$SKILL_DIR/publish.py" --out "$POST_SET/out" "${args[@]}"
