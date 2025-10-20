#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT=$(cd -- "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)
SQL_DIR="$PROJECT_ROOT/scripts/poster-board-import/sql"
DATA_DIR="$PROJECT_ROOT/data/poster-board"

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

if [ ! -f "$DATA_DIR/municipalities.csv" ] || [ ! -f "$DATA_DIR/boards.csv" ] || [ ! -f "$DATA_DIR/board_histories.csv" ]; then
  echo "ERROR: data/poster-board/ 以下に municipalities.csv, boards.csv, board_histories.csv が必要です。" >&2
  exit 1
fi

echo "Step 1/4: ステージングテーブル作成"
psql "$DB_URL_NO_PARAMS" -v ON_ERROR_STOP=1 -f "$SQL_DIR/create_stage_tables.sql"

echo "Step 2/4: CSV -> ステージング"
psql "$DB_URL_NO_PARAMS" -v ON_ERROR_STOP=1 \
  -c "\\copy municipalities_import_stage FROM '$DATA_DIR/municipalities.csv' WITH (FORMAT csv, HEADER true)"
psql "$DB_URL_NO_PARAMS" -v ON_ERROR_STOP=1 \
  -c "\\copy boards_import_stage FROM '$DATA_DIR/boards.csv' WITH (FORMAT csv, HEADER true)"
psql "$DB_URL_NO_PARAMS" -v ON_ERROR_STOP=1 \
  -c "\\copy board_histories_import_stage FROM '$DATA_DIR/board_histories.csv' WITH (FORMAT csv, HEADER true)"

echo "Step 3/4: 本テーブルへマージ"
psql "$DB_URL_NO_PARAMS" -v ON_ERROR_STOP=1 -f "$SQL_DIR/merge_municipalities.sql"
psql "$DB_URL_NO_PARAMS" -v ON_ERROR_STOP=1 -f "$SQL_DIR/merge_boards.sql"
psql "$DB_URL_NO_PARAMS" -v ON_ERROR_STOP=1 -f "$SQL_DIR/merge_board_histories.sql"

echo "Step 4/4: 件数確認"
psql "$DB_URL_NO_PARAMS" -v ON_ERROR_STOP=1 \
  -c "SELECT 'municipalities' AS table, COUNT(*) FROM municipalities" \
  -c "SELECT 'boards' AS table, COUNT(*) FROM boards" \
  -c "SELECT 'board_histories' AS table, COUNT(*) FROM board_histories"

echo "Import completed."
