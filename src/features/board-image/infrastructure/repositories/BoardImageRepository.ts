import { TOKENS } from "@/shared/lib/di/tokens";
import type { PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";
import { BoardImage } from "../../domain/entities/BoardImage";
import type {
  CreateBoardImageInput,
  FindBoardImagesOptions,
  IBoardImageRepository,
  UpdateBoardImageInput,
} from "../../domain/repositories/IBoardImageRepository";

@injectable()
export class BoardImageRepository implements IBoardImageRepository {
  constructor(
    @inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient
  ) {}

  async create(input: CreateBoardImageInput): Promise<BoardImage> {
    const data = await this.prisma.boardImage.create({
      data: {
        boardId: input.boardId ?? null,
        userId: input.userId ?? null,
        originalFilename: input.originalFilename,
        originalPath: input.originalPath,
        displayPath: input.displayPath ?? null,
        thumbnailPath: input.thumbnailPath ?? null,
        sourceUrl: input.sourceUrl ?? null,
        sourceFileId: input.sourceFileId ?? null,
        csvPrefecture: input.csvPrefecture ?? null,
        csvCity: input.csvCity ?? null,
        csvBoardNumber: input.csvBoardNumber ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        takenAt: input.takenAt ?? null,
        uploadedAt: input.uploadedAt ?? null,
        verificationStatus: (input.verificationStatus ?? "PENDING") as never,
        statusNote: input.statusNote ?? null,
        reviewNote: input.reviewNote ?? null,
        reviewComment: input.reviewComment ?? null,
      },
    });

    return this.mapToEntity(data);
  }

  async createMany(inputs: CreateBoardImageInput[]): Promise<number> {
    const result = await this.prisma.boardImage.createMany({
      data: inputs.map((input) => ({
        boardId: input.boardId ?? null,
        userId: input.userId ?? null,
        originalFilename: input.originalFilename,
        originalPath: input.originalPath,
        displayPath: input.displayPath ?? null,
        thumbnailPath: input.thumbnailPath ?? null,
        sourceUrl: input.sourceUrl ?? null,
        sourceFileId: input.sourceFileId ?? null,
        csvPrefecture: input.csvPrefecture ?? null,
        csvCity: input.csvCity ?? null,
        csvBoardNumber: input.csvBoardNumber ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        takenAt: input.takenAt ?? null,
        uploadedAt: input.uploadedAt ?? null,
        verificationStatus: (input.verificationStatus ?? "PENDING") as never,
        statusNote: input.statusNote ?? null,
        reviewNote: input.reviewNote ?? null,
        reviewComment: input.reviewComment ?? null,
      })),
    });

    return result.count;
  }

  async findById(id: string): Promise<BoardImage | null> {
    const data = await this.prisma.boardImage.findUnique({
      where: { id },
    });

    if (!data) return null;

    return this.mapToEntity(data);
  }

  async findMany(options?: FindBoardImagesOptions): Promise<BoardImage[]> {
    const data = await this.prisma.boardImage.findMany({
      where: {
        verificationStatus: options?.verificationStatus as never,
        boardId:
          options?.hasBoard !== undefined
            ? options.hasBoard
              ? { not: null }
              : null
            : undefined,
        csvPrefecture: options?.csvPrefecture,
        csvCity: options?.csvCity,
      },
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.sortField
        ? { [options.sortField]: options.sortOrder ?? "desc" }
        : { createdAt: "desc" },
    });

    return data.map((d) => this.mapToEntity(d));
  }

  async count(options?: FindBoardImagesOptions): Promise<number> {
    return await this.prisma.boardImage.count({
      where: {
        verificationStatus: options?.verificationStatus as never,
        boardId:
          options?.hasBoard !== undefined
            ? options.hasBoard
              ? { not: null }
              : null
            : undefined,
        csvPrefecture: options?.csvPrefecture,
        csvCity: options?.csvCity,
      },
    });
  }

  async findByBoardId(boardId: string): Promise<BoardImage[]> {
    const data = await this.prisma.boardImage.findMany({
      where: { boardId },
      orderBy: { takenAt: "desc" },
    });

    return data.map((d) => this.mapToEntity(d));
  }

  private mapToEntity(data: {
    id: string;
    boardId: string | null;
    userId: string | null;
    originalFilename: string;
    originalPath: string;
    displayPath: string | null;
    thumbnailPath: string | null;
    sourceUrl: string | null;
    sourceFileId: string | null;
    csvPrefecture: string | null;
    csvCity: string | null;
    csvBoardNumber: string | null;
    latitude: unknown;
    longitude: unknown;
    takenAt: Date | null;
    uploadedAt: Date | null;
    verificationStatus: string;
    statusNote: string | null;
    reviewNote: string | null;
    reviewComment: string | null;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): BoardImage {
    return new BoardImage(
      data.id,
      data.boardId,
      data.userId,
      data.originalFilename,
      data.originalPath,
      data.displayPath,
      data.thumbnailPath,
      data.sourceUrl,
      data.sourceFileId,
      data.csvPrefecture,
      data.csvCity,
      data.csvBoardNumber,
      data.latitude ? Number(data.latitude) : null,
      data.longitude ? Number(data.longitude) : null,
      data.takenAt,
      data.uploadedAt,
      data.verificationStatus as never,
      data.statusNote,
      data.reviewNote,
      data.reviewComment,
      data.isPublic,
      data.createdAt,
      data.updatedAt
    );
  }

  async update(id: string, input: UpdateBoardImageInput): Promise<BoardImage> {
    const updateData: {
      verificationStatus: never;
      isPublic?: boolean;
      csvBoardNumber?: string | null;
      board?: { connect: { id: string } } | { disconnect: true };
    } = {
      verificationStatus: input.verificationStatus as never,
      isPublic: input.isPublic,
      csvBoardNumber:
        input.csvBoardNumber === null
          ? null
          : (input.csvBoardNumber ?? undefined),
    };

    // boardIdの更新はリレーション経由で行う
    if (input.boardId !== undefined) {
      if (input.boardId === null) {
        updateData.board = { disconnect: true };
      } else {
        updateData.board = { connect: { id: input.boardId } };
      }
    }

    const data = await this.prisma.boardImage.update({
      where: { id },
      data: updateData,
    });

    return this.mapToEntity(data);
  }
}
