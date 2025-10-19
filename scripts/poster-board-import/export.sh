#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR=${1:-exports}
PROJECT_ROOT=$(cd -- "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)

if [ ! -f "$PROJECT_ROOT/.env" ]; then
  echo "ERROR: .env が見つかりません。DATABASE_URL を設定してください。" >&2
  exit 1
fi

set -a
source "$PROJECT_ROOT/.env"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL が設定されていません。" >&2
  exit 1
fi

DB_URL_NO_PARAMS=${DATABASE_URL%%\?*}

mkdir -p "$OUTPUT_DIR"

copy_query() {
  local query="$1"
  local target="$2"
  psql "$DB_URL_NO_PARAMS" -v ON_ERROR_STOP=1 -c "\\copy (${query}) TO '${target}' WITH (FORMAT csv, HEADER true)"
}

echo "Exporting municipalities -> $OUTPUT_DIR/municipalities.csv"
copy_query "SELECT id, name, code, prefecture, CASE WHEN polygon IS NOT NULL THEN ST_AsGeoJSON(polygon::geometry) ELSE NULL END AS polygon_geojson, source, url, board_count, data_version, status, contact_status, notes, folder_id, created_at, updated_at FROM municipalities ORDER BY prefecture, name" "$OUTPUT_DIR/municipalities.csv"

echo "Exporting boards -> $OUTPUT_DIR/boards.csv"
copy_query "SELECT id, board_number, name, address, ST_X(location::geometry) AS longitude, ST_Y(location::geometry) AS latitude, municipality_id, trust_level, status, note, created_at, updated_at FROM boards ORDER BY created_at" "$OUTPUT_DIR/boards.csv"

echo "Exporting board histories -> $OUTPUT_DIR/board_histories.csv"
copy_query "SELECT id, board_id, change_reason, comment, before_data, after_data, changed_at FROM board_histories ORDER BY changed_at" "$OUTPUT_DIR/board_histories.csv"

echo "Export completed."
