import { randomUUID } from "crypto";

/**
 * Sanitize filename for storage
 */
export const sanitizeFileName = (fileName: string): string =>
  fileName.replace(/[^a-zA-Z0-9_.-]+/g, "_");

/**
 * Generate storage path for board import file
 * Format: board-imports/{municipalityId}/{uuid}/{sanitized-filename}
 */
export const generateBoardImportStoragePath = (
  municipalityId: string,
  fileName: string
): { storagePath: string; identifier: string } => {
  const identifier = randomUUID();
  const safeFileName = sanitizeFileName(fileName);
  const storagePath = `board-imports/${municipalityId}/${identifier}/${safeFileName}`;

  return { storagePath, identifier };
};
