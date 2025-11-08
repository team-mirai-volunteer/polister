-- Creates staging tables used during poster board data import.
-- These tables are recreated on every run.

DROP TABLE IF EXISTS boards_import_stage;
CREATE TABLE boards_import_stage (
  id              TEXT PRIMARY KEY,
  board_number    TEXT,
  name            TEXT,
  address         TEXT,
  longitude       DOUBLE PRECISION,
  latitude        DOUBLE PRECISION,
  municipality_id TEXT,
  trust_level     TEXT,
  status          TEXT,
  note            TEXT,
  created_at      TIMESTAMP,
  updated_at      TIMESTAMP
);

DROP TABLE IF EXISTS board_histories_import_stage;
CREATE TABLE board_histories_import_stage (
  id             TEXT PRIMARY KEY,
  board_id       TEXT,
  change_reason  TEXT,
  comment        TEXT,
  before_data    JSONB,
  after_data     JSONB,
  changed_at     TIMESTAMP
);

DROP TABLE IF EXISTS municipalities_import_stage;
CREATE TABLE municipalities_import_stage (
  id               TEXT PRIMARY KEY,
  name             TEXT,
  code             TEXT,
  prefecture       TEXT,
  polygon_geojson  TEXT,
  source           TEXT,
  url              TEXT,
  board_count      INTEGER,
  data_version     TEXT,
  status           TEXT,
  contact_status   TEXT,
  notes            TEXT,
  folder_id        TEXT,
  created_at       TIMESTAMP,
  updated_at       TIMESTAMP
);
