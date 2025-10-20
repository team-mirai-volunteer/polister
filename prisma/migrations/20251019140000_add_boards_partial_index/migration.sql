-- Add partial index for active boards per municipality
DROP INDEX IF EXISTS "Board_municipalityId_deletedAt_boardNumber_createdAt_idx";
DROP INDEX IF EXISTS "boards_municipality_id_deleted_at_board_number_created_at_idx";

CREATE INDEX "boards_municipality_active_idx"
  ON "boards" ("municipality_id", "board_number", "created_at")
  WHERE "deleted_at" IS NULL;
