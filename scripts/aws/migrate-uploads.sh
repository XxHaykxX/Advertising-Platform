#!/usr/bin/env bash
#
# Copies the Hostinger uploads tree into the S3 bucket.
#
# Two hops, because the shared host has no AWS CLI: rsync down to a local
# staging directory, then `aws s3 sync` up. Both halves are incremental, so the
# first run can happen weeks before cutover and the last run only moves what
# changed since.
#
# Required:
#   SSH_HOST         user@srvNNN.hstgr.io
#   REMOTE_UPLOADS   absolute UPLOADS_DIR on Hostinger
#   BUCKET           S3 bucket name
#   STAGING          local staging directory (defaults to ./.migration/uploads)
set -euo pipefail

for v in SSH_HOST REMOTE_UPLOADS BUCKET; do
  if [ -z "${!v:-}" ]; then echo "missing env var: $v" >&2; exit 1; fi
done
STAGING="${STAGING:-./.migration/uploads}"

# Matches the Cache-Control the /uploads route serves today. Safe because upload
# filenames are content-unique (timestamp + uuid) and never rewritten in place.
CACHE="public, max-age=31536000, immutable"

mkdir -p "$STAGING"

echo "==> rsync from $SSH_HOST:$REMOTE_UPLOADS"
rsync -az --info=progress2 --delete "$SSH_HOST:$REMOTE_UPLOADS/" "$STAGING/"

# Objects land under the `uploads/` prefix so that the key matches the path
# already stored in the database (`/uploads/videos/x.mp4`) one-to-one. That is
# what lets the CloudFront `/uploads/*` behaviour point straight at the bucket
# with no origin-path rewriting, and what makes the migration need no database
# changes at all.
echo "==> sync to s3://$BUCKET/uploads/ (everything but presentations)"
aws s3 sync "$STAGING/" "s3://$BUCKET/uploads/" \
  --exclude "presentations/*" \
  --cache-control "$CACHE" \
  --size-only

# PDFs keep the attachment disposition the Node route sets today (IA-44): a PDF
# opened inline runs its embedded scripting in whatever origin served it, and
# the only link to these says "Download presentation" anyway.
if [ -d "$STAGING/presentations" ]; then
  echo "==> sync presentations with Content-Disposition: attachment"
  aws s3 sync "$STAGING/presentations/" "s3://$BUCKET/uploads/presentations/" \
    --content-disposition attachment \
    --cache-control "$CACHE" \
    --size-only
fi

echo "==> counts"
echo "    local: $(find "$STAGING" -type f | wc -l) files"
echo "    s3:    $(aws s3 ls "s3://$BUCKET/uploads/" --recursive --summarize \
  | awk '/Total Objects/ {print $3}') objects"

echo "done."
