-- boards.created_at でのソートを高速化するための部分インデックス
CREATE INDEX IF NOT EXISTS boards_created_at_active_location_idx
  ON boards (created_at)
  WHERE deleted_at IS NULL AND location IS NOT NULL;
