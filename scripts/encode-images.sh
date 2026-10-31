#!/usr/bin/env bash
# Turns the raw PNG renders and screenshots (see scripts/capture/) into the WebP/AVIF files the page uses.
# Needs ImageMagick 7 (`magick`), `cwebp` and `avifenc`.
#
#   scripts/encode-images.sh <renders-dir> <shots-dir> [release-shots-dir]
#
# <renders-dir> holds hero/, looks/, deal/, fx/, channels/ as written by scripts/capture/*.js;
# <shots-dir> holds ui-*-{zh,en}.png (3200×2000 screenshots of the app's own window);
# [release-shots-dir] holds v031.png and v040.png, the screenshots from the GitHub release notes.
set -euo pipefail
R=${1:?renders dir}; S=${2:?shots dir}; REL=${3:-}
OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/img"
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"/{hero,looks,deal,fx,channels,ui,rel}

# webp <src> <dst.webp> <width> [quality]
webp() { magick "$1" -resize "$3x>" -strip "$TMP/x.png"; cwebp -quiet -q "${4:-80}" -m 6 -sharp_yuv "$TMP/x.png" -o "$2"; }
# avif <src> <dst.avif> <width> [quality]
avif() { magick "$1" -resize "$3x>" -strip "$TMP/y.png"; avifenc -q "${4:-55}" -s 4 "$TMP/y.png" "$2" >/dev/null; }

# 1. hero: one cover at every size, two widths each (by the longer side: 1800 and 900)
for f in "$R"/hero/cel-*.png; do
  b=$(basename "$f" .png)
  w=$(magick identify -format %w "$f"); h=$(magick identify -format %h "$f")
  if [ "$w" -ge "$h" ]; then big=1800; small=900; else big=$((1800 * w / h)); small=$((900 * w / h)); fi
  webp "$f" "$OUT/hero/$b-lg.webp" "$big" 82
  avif "$f" "$OUT/hero/$b-lg.avif" "$big" 58
  webp "$f" "$OUT/hero/$b-sm.webp" "$small" 80
done

# 2. looks: a thumbnail and a stage picture each
for f in "$R"/looks/*.png; do
  b=$(basename "$f" .png)
  webp "$f" "$OUT/looks/$b-sm.webp" 480 76
  webp "$f" "$OUT/looks/$b-lg.webp" 1120 72
  avif "$f" "$OUT/looks/$b-lg.avif" 1120 50
done

# 3. Surprise me's hands (3:4)
for f in "$R"/deal/*.png; do webp "$f" "$OUT/deal/$(basename "$f" .png).webp" 540 78; done

# 4. text effects and bends: the title and subtitle, cropped out of a 1600×900 16:9 render
for f in "$R"/fx/*.png; do
  magick "$f" -crop 1024x396+32+162 +repage "$TMP/c.png"
  webp "$TMP/c.png" "$OUT/fx/$(basename "$f" .png).webp" 720 80
done

# 5. one cover per channel
for f in "$R"/channels/*.png; do webp "$f" "$OUT/channels/$(basename "$f" .png).webp" 960 80; done

# 6. the app's own window
for f in "$S"/ui-*.png; do
  b=$(basename "$f" .png)
  webp "$f" "$OUT/ui/$b-1280.webp" 1280 82
  webp "$f" "$OUT/ui/$b-2400.webp" 2400 80
  avif "$f" "$OUT/ui/$b-2400.avif" 2400 55
done

# 7. the screenshots from the release notes (Chinese UI)
if [ -n "$REL" ]; then
  magick "$REL/v031.png" -crop 1040x585+490+143 +repage "$TMP/r.png"
  webp "$TMP/r.png" "$OUT/rel/cutout-weave.webp" 1040 82
  webp "$REL/v040.png" "$OUT/rel/agents-1560.webp" 1560 82
  webp "$REL/v040.png" "$OUT/rel/agents-960.webp" 960 80
fi
du -sh "$OUT"/*
