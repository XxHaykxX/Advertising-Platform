#!/usr/bin/env bash
#
# Copies the Hostinger production database into RDS MariaDB.
#
# Re-runnable on purpose: run it once now for a dry run against the dev
# database, and again at cutover for the final copy. It DROPs and recreates
# every table it carries, so the destination is replaced, not merged.
#
# Config comes from the environment. Keep it in a gitignored file and source it:
#
#   set -a; . .env.aws-migration; set +a
#   ./scripts/aws/migrate-db.sh
#
# Required:
#   SRC_HOST SRC_DB SRC_USER SRC_PASS      Hostinger (srv2026.hstgr.io from outside)
#   DST_HOST DST_DB DST_USER DST_PASS      RDS endpoint
#
# The client must be the MySQL 8 one (--column-statistics does not exist in the
# MariaDB client). The documented way to get it on Windows is the mysql:8 Docker
# image; see docs/DEPLOY-PLAYBOOK.md.
set -euo pipefail

for v in SRC_HOST SRC_DB SRC_USER SRC_PASS DST_HOST DST_DB DST_USER DST_PASS; do
  if [ -z "${!v:-}" ]; then echo "missing env var: $v" >&2; exit 1; fi
done

out="./.migration/$(date +%Y%m%d-%H%M%S)-${SRC_DB}.sql"
mkdir -p "$(dirname "$out")"

echo "==> dumping $SRC_DB from $SRC_HOST"
# --column-statistics=0: the MySQL 8 client otherwise queries
#   information_schema.COLUMN_STATISTICS, which MariaDB does not have. Without
#   it the dump fails but still leaves a ~6 KB file that looks plausible — hence
#   the completion check further down.
# --no-tablespaces: avoids needing the PROCESS privilege, which shared hosting
#   does not grant.
mysqldump \
  --host="$SRC_HOST" --user="$SRC_USER" --password="$SRC_PASS" \
  --single-transaction --routines --triggers --events \
  --no-tablespaces --column-statistics=0 \
  --default-character-set=utf8mb4 \
  --set-gtid-purged=OFF \
  "$SRC_DB" > "$out"

# A dump that failed halfway still exits 0 through a pipe and still has a
# header. The trailer is the only honest signal that it finished.
if ! tail -c 2000 "$out" | grep -q -- "-- Dump completed"; then
  echo "dump did not finish — refusing to restore. See $out" >&2
  exit 1
fi
echo "    $(du -h "$out" | cut -f1) written to $out"

echo "==> stripping DEFINER clauses"
# Views, triggers and routines carry `DEFINER=`u998961932_x`@`localhost``. That
# user does not exist on RDS, and the restore dies on the first one with
# ERROR 1227 (access denied). Nothing in this app depends on a definer.
sed -i -E 's/DEFINER=`[^`]*`@`[^`]*`//g' "$out"

echo "==> restoring into $DST_DB on $DST_HOST"
mysql \
  --host="$DST_HOST" --user="$DST_USER" --password="$DST_PASS" \
  --default-character-set=utf8mb4 \
  "$DST_DB" < "$out"

echo "==> verifying"
src_tables=$(mysql -N -B --host="$SRC_HOST" --user="$SRC_USER" --password="$SRC_PASS" \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$SRC_DB'")
dst_tables=$(mysql -N -B --host="$DST_HOST" --user="$DST_USER" --password="$DST_PASS" \
  -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DST_DB'")
echo "    tables: source=$src_tables destination=$dst_tables"
[ "$src_tables" = "$dst_tables" ] || { echo "table count differs" >&2; exit 1; }

echo "done."
