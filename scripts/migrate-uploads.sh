#!/usr/bin/env bash
# One-time prod migration: copy pre-existing uploaded media from the OLD
# on-disk locations (process.cwd()/public/uploads, i.e. under public_html) into
# the new UPLOADS_DIR that the app now writes/reads/serves from after the
# 2026-07-20 uploads fix. Non-destructive: `cp -n` never overwrites, so files
# already in the new dir (e.g. freshly generated posters) are left untouched.
# Run via Hostinger cron:  bash <this file>
set -u

DEST="${UPLOADS_DIR:-/home/u998961932/domains/igovazd.am/uploads}"
mkdir -p "$DEST"
echo "DEST=$DEST (before: $(find "$DEST" -type f 2>/dev/null | wc -l) files)"

for SRC in \
  /home/u998961932/domains/igovazd.am/public_html/public/uploads \
  /home/u998961932/domains/igovazd.am/public_html/uploads ; do
  if [ -d "$SRC" ] && [ "$SRC" != "$DEST" ]; then
    n=$(find "$SRC" -type f 2>/dev/null | wc -l)
    echo "SRC=$SRC ($n files) -> copying"
    cp -rn "$SRC"/. "$DEST"/ 2>/dev/null || true
  else
    echo "SRC=$SRC (absent or same as dest, skipped)"
  fi
done

echo "DEST=$DEST (after: $(find "$DEST" -type f 2>/dev/null | wc -l) files)"
echo "SUBDIRS:"; ls -1 "$DEST" 2>/dev/null
