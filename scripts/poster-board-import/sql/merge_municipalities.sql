BEGIN;

LOCK TABLE municipalities IN SHARE ROW EXCLUSIVE MODE;

INSERT INTO municipalities (
  id,
  name,
  code,
  prefecture,
  polygon,
  source,
  url,
  board_count,
  data_version,
  status,
  contact_status,
  notes,
  folder_id,
  created_at,
  updated_at
)
SELECT
  s.id,
  s.name,
  s.code,
  s.prefecture,
  CASE
    WHEN s.polygon_geojson IS NOT NULL AND s.polygon_geojson <> ''
      THEN ST_GeomFromGeoJSON(s.polygon_geojson)::geography
    ELSE NULL
  END,
  COALESCE(s.source, 'MLIT'),
  NULLIF(s.url, ''),
  s.board_count,
  NULLIF(s.data_version, ''),
  CAST(s.status AS "MunicipalityStatus"),
  CASE
    WHEN s.contact_status IS NOT NULL AND s.contact_status <> ''
      THEN CAST(s.contact_status AS "ContactStatus")
    ELSE NULL
  END,
  NULLIF(s.notes, ''),
  NULLIF(s.folder_id, ''),
  COALESCE(s.created_at, NOW()),
  COALESCE(s.updated_at, NOW())
FROM municipalities_import_stage s
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  prefecture = EXCLUDED.prefecture,
  polygon = EXCLUDED.polygon,
  source = EXCLUDED.source,
  url = EXCLUDED.url,
  board_count = EXCLUDED.board_count,
  data_version = EXCLUDED.data_version,
  status = EXCLUDED.status,
  contact_status = EXCLUDED.contact_status,
  notes = EXCLUDED.notes,
  folder_id = EXCLUDED.folder_id,
  updated_at = EXCLUDED.updated_at;

COMMIT;
