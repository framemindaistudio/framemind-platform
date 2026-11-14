#!/usr/bin/env bash
# Build one FrameMind <Name>OS app as a static export and copy it into this site at public/apps/<id>/.
#
#   scripts/publish-app.sh <id>            build D:/FrameMind-Apps/apps/<id> with basePath /apps/<id> and copy it in
#   scripts/publish-app.sh --remove <id>   delete public/apps/<id>/ (unpublish)
#
# The site then serves it at /apps/<id>/ through the afterFiles rewrites in next.config.ts (no proxy, no functions).
# Set FM_APPS_DIR to use a different checkout of the apps repo. Run from Git Bash; builds one app at a time.
set -euo pipefail

HQ_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPS_DIR="${FM_APPS_DIR:-D:/FrameMind-Apps}"

usage() { echo "usage: scripts/publish-app.sh [--remove] <id>   (id: trade, table, fit, … or _starter)" >&2; exit 2; }

REMOVE=0
if [[ "${1:-}" == "--remove" ]]; then REMOVE=1; shift; fi
ID="${1:-}"
[[ -n "$ID" ]] || usage
[[ "$ID" =~ ^[a-z0-9_-]+$ ]] || { echo "error: id must be lowercase letters, digits, - or _ (got '$ID')" >&2; exit 2; }

DEST="$HQ_DIR/public/apps/$ID"

if [[ $REMOVE -eq 1 ]]; then
  rm -rf "$DEST"
  rmdir "$HQ_DIR/public/apps" 2>/dev/null || true
  echo "removed public/apps/$ID"
  exit 0
fi

SRC="$APPS_DIR/apps/$ID"
[[ -f "$SRC/package.json" ]] || { echo "error: no app at $SRC" >&2; exit 1; }

echo "→ building $ID with basePath /apps/$ID"
cd "$SRC"
rm -rf out
# MSYS_NO_PATHCONV stops Git Bash from turning "/apps/<id>" into a Windows path.
# The app's "build" script is `next build` + flatten-export-segments.mjs (fixes 404ing prefetch files on Windows).
MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH="/apps/$ID" NEXT_TELEMETRY_DISABLED=1 npm run build

[[ -f out/index.html ]] || { echo "error: out/index.html missing — is output: \"export\" set?" >&2; exit 1; }
grep -q "/apps/$ID/_next" out/index.html || { echo "error: out/index.html does not reference /apps/$ID/_next — basePath not applied" >&2; exit 1; }

echo "→ copying to public/apps/$ID"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R out/. "$DEST/"

FILES=$(find "$DEST" -type f | wc -l | tr -d ' ')
SIZE=$(du -sh "$DEST" | cut -f1)
echo "✓ published $ID: $FILES files, $SIZE → /apps/$ID/"
echo "  check: npm run dev, then open http://localhost:3011/apps/$ID/"
