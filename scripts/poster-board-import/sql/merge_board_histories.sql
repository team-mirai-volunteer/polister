BEGIN;

LOCK TABLE board_histories IN SHARE ROW EXCLUSIVE MODE;

INSERT INTO board_histories (
  id,
  board_id,
  change_reason,
  comment,
  before_data,
  after_data,
  changed_at
)
SELECT
  h.id,
  h.board_id,
  CAST(h.change_reason AS "ChangeReason"),
  NULLIF(h.comment, ''),
  h.before_data,
  h.after_data,
  h.changed_at
FROM board_histories_import_stage h
WHERE EXISTS (SELECT 1 FROM boards b WHERE b.id = h.board_id)
ON CONFLICT (id) DO UPDATE SET
  change_reason = EXCLUDED.change_reason,
  comment = EXCLUDED.comment,
  before_data = EXCLUDED.before_data,
  after_data = EXCLUDED.after_data,
  changed_at = EXCLUDED.changed_at;

COMMIT;
