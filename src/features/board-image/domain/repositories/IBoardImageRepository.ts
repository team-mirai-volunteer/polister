import type { ImageVerificationStatus } from "@prisma/client";

import type { BoardImageFilter } from "../../constants/filters";
import type { BoardImage } from "../entities/BoardImage";

export interface CreateBoardImageInput {
  boardId?: string;
  userId?: string;
  originalFilename: string;
  originalPath: string;
  displayPath?: string;
  thumbnailPath?: string;
  sourceUrl?: string;
  sourceFileId?: string;
  csvPrefecture?: string;
  csvCity?: string;
  csvBoardNumber?: string;
  latitude?: number;
  longitude?: number;
  takenAt?: Date;
  uploadedAt?: Date;
  verificationStatus?: ImageVerificationStatus;
  statusNote?: string;
  reviewNote?: string;
  reviewComment?: string;
}

export interface UpdateBoardImageInput {
  boardId?: string | null;
  verificationStatus?: ImageVerificationStatus;
  isPublic?: boolean;
  csvBoardNumber?: string | null;
}

export type BoardImageSortField =
  | "originalFilename"
  | "csvPrefecture"
  | "csvCity"
  | "csvBoardNumber"
  | "verificationStatus"
  | "takenAt"
  | "createdAt";

export interface FindBoardImagesOptions {
  limit?: number;
  offset?: number;
  verificationStatus?: ImageVerificationStatus;
  hasBoard?: boolean;
  filter?: BoardImageFilter;
  sortField?: BoardImageSortField;
  sortOrder?: "asc" | "desc";
}

/**
 * 掲示場画像リポジトリインターフェース
 */
export interface IBoardImageRepository {
  /**
   * 新規作成
   */
  create(input: CreateBoardImageInput): Promise<BoardImage>;

  /**
   * 一括作成
   */
  createMany(inputs: CreateBoardImageInput[]): Promise<number>;

  /**
   * IDで検索
   */
  findById(id: string): Promise<BoardImage | null>;

  /**
   * 条件で検索
   */
  findMany(options?: FindBoardImagesOptions): Promise<BoardImage[]>;

  /**
   * 総数を取得
   */
  count(options?: FindBoardImagesOptions): Promise<number>;

  /**
   * 掲示場IDで検索
   */
  findByBoardId(boardId: string): Promise<BoardImage[]>;

  /**
   * 更新
   */
  update(id: string, input: UpdateBoardImageInput): Promise<BoardImage>;

  /**
   * 削除
   */
  delete(id: string): Promise<void>;
}
