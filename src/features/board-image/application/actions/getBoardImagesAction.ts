"use server";

import {
  BOARD_IMAGE_FILTER_FIELDS,
  BOARD_IMAGE_FILTER_OPERATORS,
  type BoardImageFilterField,
  type BoardImageFilterOperator,
} from "@/features/board-image/constants/filters";
import type { BoardImageSortField } from "@/features/board-image/domain/repositories/IBoardImageRepository";
import { resolve } from "@/shared/lib/di";
import { TOKENS } from "@/shared/lib/di/tokens";
import type { ImageVerificationStatus } from "@prisma/client";

const BOARD_IMAGE_SORT_FIELDS: BoardImageSortField[] = [
  "originalFilename",
  "csvPrefecture",
  "csvCity",
  "csvBoardNumber",
  "verificationStatus",
  "takenAt",
  "createdAt",
];

const IMAGE_VERIFICATION_STATUSES: ImageVerificationStatus[] = [
  "PENDING",
  "VERIFIED",
  "REJECTED",
  "LOCATION_ISSUE",
  "DUPLICATE",
  "NO_NUMBER",
  "DOWNLOAD_FAILED",
];

export interface BoardImageDTO {
  id: string;
  boardId: string | null;
  originalFilename: string;
  originalPath: string;
  displayPath: string | null;
  thumbnailPath: string | null;
  sourceUrl: string | null;
  sourceFileId: string | null;
  csvPrefecture: string | null;
  csvCity: string | null;
  csvBoardNumber: string | null;
  latitude: number | null;
  longitude: number | null;
  takenAt: string | null;
  uploadedAt: string | null;
  verificationStatus: string;
  statusNote: string | null;
  reviewNote: string | null;
  reviewComment: string | null;
  isPublic: boolean;
  createdAt: string;
  linkedBoard?: {
    id: string;
    boardNumber: string | null;
    name: string | null;
    latitude: number | null;
    longitude: number | null;
    address: string;
  } | null;
}

export interface GetBoardImagesInput {
  limit?: number;
  offset?: number;
  verificationStatus?: string;
  hasBoard?: boolean;
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

export interface GetBoardImagesResult {
  images: BoardImageDTO[];
  total: number;
}

export async function getBoardImagesAction(
  input: GetBoardImagesInput = {}
): Promise<GetBoardImagesResult> {
  const repository = resolve(TOKENS.BoardImageRepository);

  const normalizedFilterField = normalizeFilterField(input.filterField);
  const normalizedFilterOperator = normalizedFilterField
    ? normalizeFilterOperator(input.filterOperator, normalizedFilterField)
    : undefined;
  const trimmedValue = input.filterValue?.trim();
  const filterValue =
    normalizedFilterField && normalizedFilterOperator && trimmedValue
      ? trimmedValue
      : undefined;

  const filter =
    normalizedFilterField && normalizedFilterOperator && filterValue
      ? {
          field: normalizedFilterField,
          operator: normalizedFilterOperator,
          value: filterValue,
        }
      : undefined;

  const normalizedVerificationStatus = normalizeVerificationStatus(
    input.verificationStatus
  );
  const normalizedSortField = normalizeSortField(input.sortField);

  const [images, total] = await Promise.all([
    repository.findMany({
      limit: input.limit ?? 50,
      offset: input.offset ?? 0,
      verificationStatus: normalizedVerificationStatus,
      hasBoard: input.hasBoard,
      filter,
      sortField: normalizedSortField,
      sortOrder: input.sortOrder,
    }),
    repository.count({
      verificationStatus: normalizedVerificationStatus,
      hasBoard: input.hasBoard,
      filter,
    }),
  ]);

  return {
    images: images.map(
      (image): BoardImageDTO => ({
        id: image.id,
        boardId: image.boardId,
        originalFilename: image.originalFilename,
        originalPath: image.originalPath,
        displayPath: image.displayPath,
        thumbnailPath: image.thumbnailPath,
        sourceUrl: image.sourceUrl,
        sourceFileId: image.sourceFileId,
        csvPrefecture: image.csvPrefecture,
        csvCity: image.csvCity,
        csvBoardNumber: image.csvBoardNumber,
        latitude: image.latitude,
        longitude: image.longitude,
        takenAt: image.takenAt?.toISOString() ?? null,
        uploadedAt: image.uploadedAt?.toISOString() ?? null,
        verificationStatus: image.verificationStatus,
        statusNote: image.statusNote,
        reviewNote: image.reviewNote,
        reviewComment: image.reviewComment,
        isPublic: image.isPublic,
        createdAt: image.createdAt.toISOString(),
        linkedBoard: null,
      })
    ),
    total,
  };
}

function normalizeFilterField(
  value: string | undefined
): BoardImageFilterField | undefined {
  if (!value) {
    return undefined;
  }

  return BOARD_IMAGE_FILTER_FIELDS.includes(value as BoardImageFilterField)
    ? (value as BoardImageFilterField)
    : undefined;
}

function normalizeFilterOperator(
  operator: string | undefined,
  field: BoardImageFilterField
): BoardImageFilterOperator {
  if (!operator) {
    return field === "verificationStatus" ? "equals" : "contains";
  }

  const allowed = BOARD_IMAGE_FILTER_OPERATORS[field];
  return allowed.includes(operator as BoardImageFilterOperator)
    ? (operator as BoardImageFilterOperator)
    : field === "verificationStatus"
      ? "equals"
      : "contains";
}

function normalizeVerificationStatus(
  value: string | undefined
): ImageVerificationStatus | undefined {
  if (!value) {
    return undefined;
  }

  return IMAGE_VERIFICATION_STATUSES.includes(value as ImageVerificationStatus)
    ? (value as ImageVerificationStatus)
    : undefined;
}

function normalizeSortField(
  value: string | undefined
): BoardImageSortField | undefined {
  if (!value) {
    return undefined;
  }

  return BOARD_IMAGE_SORT_FIELDS.includes(value as BoardImageSortField)
    ? (value as BoardImageSortField)
    : undefined;
}
