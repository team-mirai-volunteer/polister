BEGIN;

LOCK TABLE boards IN SHARE ROW EXCLUSIVE MODE;

INSERT INTO boards (
  id,
  board_number,
  name,
  address,
  location,
  municipality_id,
  trust_level,
  status,
  note,
  created_at,
  updated_at
)
SELECT
  s.id,
  COALESCE(s.board_number, 0),
  NULLIF(s.name, ''),
  COALESCE(s.address, ''),
  CASE
    WHEN s.longitude IS NOT NULL AND s.latitude IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint(s.longitude, s.latitude), 4326)
    ELSE NULL
  END,
  s.municipality_id,
  CAST(s.trust_level AS "TrustLevel"),
  CAST(s.status AS "BoardStatus"),
  NULLIF(s.note, ''),
  COALESCE(s.created_at, NOW()),
  COALESCE(s.updated_at, NOW())
FROM boards_import_stage s
ON CONFLICT (id) DO UPDATE SET
  board_number = EXCLUDED.board_number,
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  location = EXCLUDED.location,
  municipality_id = EXCLUDED.municipality_id,
  trust_level = EXCLUDED.trust_level,
  status = EXCLUDED.status,
  note = EXCLUDED.note,
  updated_at = EXCLUDED.updated_at;

COMMIT;
