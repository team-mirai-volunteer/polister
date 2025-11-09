import type { ImageVerificationStatus } from "@prisma/client";

/**
 * 掲示板画像エンティティ
 */
export class BoardImage {
  constructor(
    public readonly id: string,
    public readonly boardId: string | null,
    public readonly userId: string | null,
    public readonly originalFilename: string,
    public readonly originalPath: string,
    public readonly displayPath: string | null,
    public readonly thumbnailPath: string | null,
    public readonly sourceUrl: string | null,
    public readonly sourceFileId: string | null,
    public readonly csvPrefecture: string | null,
    public readonly csvCity: string | null,
    public readonly csvBoardNumber: string | null,
    public readonly latitude: number | null,
    public readonly longitude: number | null,
    public readonly takenAt: Date | null,
    public readonly uploadedAt: Date | null,
    public readonly verificationStatus: ImageVerificationStatus,
    public readonly statusNote: string | null,
    public readonly reviewNote: string | null,
    public readonly reviewComment: string | null,
    public readonly isPublic: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * CSVから位置情報を持っているか
   */
  hasLocation(): boolean {
    return this.latitude !== null && this.longitude !== null;
  }

  /**
   * 掲示板に紐付いているか
   */
  isLinkedToBoard(): boolean {
    return this.boardId !== null;
  }

  /**
   * 検証済みか
   */
  isVerified(): boolean {
    return this.verificationStatus === "VERIFIED";
  }
}
