#!/usr/bin/env bash
# build-logo.sh <preset> — frames/<preset>/ -> out/<preset>.mp4 (on brand ink)
#                          and out/<preset>.webm (VP9 + alpha, for reuse over video)
set -euo pipefail
cd "$(dirname "$0")"
P="${1:?usage: build-logo.sh <preset>}"
mkdir -p out
INK="0x07070b"
N=$(ls "frames/$P" | wc -l)
[ "$N" -gt 0 ] || { echo "no frames for $P — run render-logo.mjs first"; exit 1; }
# opaque mp4 over ink (square sting)
ffmpeg -y -f lavfi -i "color=c=${INK}:s=1080x1080:d=10" -framerate 30 -i "frames/$P/f%04d.png" \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto:shortest=1,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 18 -preset medium -r 30 \
  -movflags +faststart "out/$P.mp4" -loglevel error
# transparent webm (VP9 yuva420p) for compositing into reels
ffmpeg -y -framerate 30 -i "frames/$P/f%04d.png" \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 28 -r 30 "out/$P.webm" -loglevel error
echo "built out/$P.mp4 + out/$P.webm"
