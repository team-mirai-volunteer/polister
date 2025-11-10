import type {
  CreateBoardImportBatchInput,
  CreateBoardImportMissingInput,
  CreateBoardImportRowInput,
  IBoardImportRepository,
  ListBoardImportBatchesFilter,
  UpdateBoardImportBatchStatsInput,
  UpdateBoardImportBatchStatusInput,
  UpdateBoardImportMissingDecisionInput,
  UpdateBoardImportRowDecisionInput,
} from "@/features/board-import/domain/repositories/IBoardImportRepository";
import {
  toDomainBatch,
  toDomainMissing,
  toDomainRow,
} from "@/features/board-import/infrastructure/mappers/PrismaBoardImportMapper";
import { TOKENS } from "@/shared/lib/di/tokens";
import { Prisma, type PrismaClient } from "@prisma/client";
import { inject, injectable } from "tsyringe";

@injectable()
export class BoardImportRepository implements IBoardImportRepository {
  constructor(
    @inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient
  ) {}

  async createBatchWithDetails(params: {
    batch: CreateBoardImportBatchInput;
    rows: CreateBoardImportRowInput[];
    missing: CreateBoardImportMissingInput[];
  }) {
    const result = await this.prisma.$transaction(async (tx) => {
      const batchRecord = await tx.boardImportBatch.create({
        data: this.mapBatchCreateData(params.batch),
      });

      const batchId = batchRecord.id;

      if (params.rows.length > 0) {
        await tx.boardImportRow.createMany({
          data: params.rows.map((row) => this.mapRowCreateData(row, batchId)),
        });
      }

      if (params.missing.length > 0) {
        await tx.boardImportMissing.createMany({
          data: params.missing.map((missing) =>
            this.mapMissingCreateData(missing, batchId)
          ),
        });
      }

      const [rowRecords, missingRecords] = await Promise.all([
        tx.boardImportRow.findMany({
          where: { batchId },
          orderBy: { createdAt: "asc" },
        }),
        tx.boardImportMissing.findMany({
          where: { batchId },
          orderBy: { createdAt: "asc" },
        }),
      ]);

      return {
        batch: batchRecord,
        rows: rowRecords,
        missing: missingRecords,
      };
    });

    return {
      batch: toDomainBatch(result.batch),
      rows: result.rows.map(toDomainRow),
      missing: result.missing.map(toDomainMissing),
    };
  }

  async createBatch(input: CreateBoardImportBatchInput) {
    const record = await this.prisma.boardImportBatch.create({
      data: this.mapBatchCreateData(input),
    });

    return toDomainBatch(record);
  }

  async updateBatchStats(
    batchId: string,
    stats: UpdateBoardImportBatchStatsInput
  ) {
    const record = await this.prisma.boardImportBatch.update({
      where: { id: batchId },
      data: {
        matchedCount: stats.matchedCount,
        newCount: stats.newCount,
        missingCount: stats.missingCount,
        updatedCount: stats.updatedCount,
        duplicateCount: stats.duplicateCount,
      },
    });

    return toDomainBatch(record);
  }

  async updateBatchStatus(
    batchId: string,
    input: UpdateBoardImportBatchStatusInput
  ) {
    const record = await this.prisma.boardImportBatch.update({
      where: { id: batchId },
      data: {
        status: input.status,
        confirmedBy: input.confirmedBy ?? null,
        confirmedAt: input.confirmedAt ?? null,
        notes: input.notes ?? null,
      },
    });

    return toDomainBatch(record);
  }

  async findBatchById(batchId: string) {
    const record = await this.prisma.boardImportBatch.findUnique({
      where: { id: batchId },
    });

    return record ? toDomainBatch(record) : null;
  }

  async listBatches(filter?: ListBoardImportBatchesFilter) {
    const limit = filter?.limit ?? 50;
    const records = await this.prisma.boardImportBatch.findMany({
      where: {
        municipalityId: filter?.municipalityId,
        status: filter?.status,
        uploadedBy: filter?.uploadedBy,
      },
      orderBy: { uploadedAt: "desc" },
      take: limit + 1,
      ...(filter?.cursor
        ? {
            skip: 1,
            cursor: { id: filter.cursor },
          }
        : {}),
    });

    let nextCursor: string | null = null;
    if (records.length > limit) {
      const cursorCandidate = records.pop();
      nextCursor = cursorCandidate?.id ?? null;
    }

    return {
      items: records.map(toDomainBatch),
      nextCursor,
    };
  }

  async createRows(batchId: string, rows: CreateBoardImportRowInput[]) {
    if (rows.length === 0) {
      return [];
    }

    const data = rows.map<Prisma.BoardImportRowCreateManyInput>((row) => ({
      ...this.mapRowCreateData(row, batchId),
    }));

    await this.prisma.boardImportRow.createMany({ data });

    const records = await this.prisma.boardImportRow.findMany({
      where: { batchId },
      orderBy: { createdAt: "asc" },
    });

    return records.map(toDomainRow);
  }

  async findRowsByBatchId(batchId: string) {
    const records = await this.prisma.boardImportRow.findMany({
      where: { batchId },
      orderBy: { createdAt: "asc" },
    });

    return records.map(toDomainRow);
  }

  async updateRowDecision(
    rowId: string,
    input: UpdateBoardImportRowDecisionInput
  ) {
    const record = await this.prisma.boardImportRow.update({
      where: { id: rowId },
      data: {
        finalDecision: input.finalDecision ?? null,
        assigneeId: input.assigneeId ?? null,
        comment: input.comment ?? null,
      },
    });

    return toDomainRow(record);
  }

  async createMissing(
    batchId: string,
    missing: CreateBoardImportMissingInput[]
  ) {
    if (missing.length === 0) {
      return [];
    }

    const data = missing.map<Prisma.BoardImportMissingCreateManyInput>((item) =>
      this.mapMissingCreateData(item, batchId)
    );

    await this.prisma.boardImportMissing.createMany({ data });

    const records = await this.prisma.boardImportMissing.findMany({
      where: { batchId },
      orderBy: { createdAt: "asc" },
    });

    return records.map(toDomainMissing);
  }

  async findMissingByBatchId(batchId: string) {
    const records = await this.prisma.boardImportMissing.findMany({
      where: { batchId },
      orderBy: { createdAt: "asc" },
    });

    return records.map(toDomainMissing);
  }

  async updateMissingDecision(
    missingId: string,
    input: UpdateBoardImportMissingDecisionInput
  ) {
    const record = await this.prisma.boardImportMissing.update({
      where: { id: missingId },
      data: {
        finalDecision: input.finalDecision ?? null,
        comment: input.comment ?? null,
      },
    });

    return toDomainMissing(record);
  }

  async findExistingBoardsByMunicipality(municipalityId: string) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        board_number: string | null;
        address: string;
        name: string | null;
        note: string | null;
        status: string;
        trust_level: string;
        updated_at: Date;
        longitude: number | null;
        latitude: number | null;
      }>
    >(Prisma.sql`
      SELECT
        id,
        board_number,
        address,
        name,
        note,
        status,
        trust_level,
        updated_at,
        ST_X(location::geometry) AS longitude,
        ST_Y(location::geometry) AS latitude
      FROM boards
      WHERE municipality_id = ${municipalityId}
        AND deleted_at IS NULL
      ORDER BY
        CASE
          WHEN board_number ~ '^\d+(-\d+)?$' THEN split_part(board_number, '-', 1)::int
          ELSE NULL
        END ASC NULLS LAST,
        CASE
          WHEN board_number ~ '^\d+-\d+$' THEN split_part(board_number, '-', 2)::int
          ELSE NULL
        END ASC NULLS LAST,
        board_number ASC NULLS LAST,
        id ASC
    `);

    return rows.map((row) => ({
      id: row.id,
      boardNumber: row.board_number?.trim() ?? null,
      address: row.address,
      name: row.name,
      note: row.note,
      status: row.status,
      trustLevel: row.trust_level,
      updatedAt: row.updated_at,
      longitude: row.longitude,
      latitude: row.latitude,
    }));
  }

  async findExistingBoardsByIds(boardIds: string[]) {
    if (boardIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        board_number: string | null;
        address: string;
        name: string | null;
        note: string | null;
        status: string;
        trust_level: string;
        updated_at: Date;
        longitude: number | null;
        latitude: number | null;
      }>
    >(Prisma.sql`
      SELECT
        id,
        board_number,
        address,
        name,
        note,
        status,
        trust_level,
        updated_at,
        ST_X(location::geometry) AS longitude,
        ST_Y(location::geometry) AS latitude
      FROM boards
      WHERE id IN (${Prisma.join(boardIds.map((id) => Prisma.sql`${id}`))})
        AND deleted_at IS NULL
    `);

    return rows.map((row) => ({
      id: row.id,
      boardNumber: row.board_number?.trim() ?? null,
      address: row.address,
      name: row.name,
      note: row.note,
      status: row.status,
      trustLevel: row.trust_level,
      updatedAt: row.updated_at,
      longitude: row.longitude,
      latitude: row.latitude,
    }));
  }

  async deleteBatch(batchId: string): Promise<void> {
    await this.prisma.boardImportBatch.delete({ where: { id: batchId } });
  }

  private mapBatchCreateData(
    input: CreateBoardImportBatchInput
  ): Prisma.BoardImportBatchCreateInput {
    const base: Prisma.BoardImportBatchCreateInput = {
      municipality: {
        connect: { id: input.municipalityId },
      },
      status: input.status ?? "UPLOADED",
      sourceFileName: input.sourceFileName,
      storagePath: input.storagePath,
      fileSize: input.fileSize,
      checksum: input.checksum,
      totalRows: input.totalRows,
      matchedCount: input.matchedCount ?? 0,
      newCount: input.newCount ?? 0,
      missingCount: input.missingCount ?? 0,
      updatedCount: input.updatedCount ?? 0,
      duplicateCount: input.duplicateCount ?? 0,
      uploadedAt: input.uploadedAt,
      confirmedAt: input.confirmedAt ?? null,
      notes: input.notes ?? null,
    };

    if (input.uploadedBy) {
      base.uploadedByUser = {
        connect: { id: input.uploadedBy },
      };
    }

    if (input.confirmedBy) {
      base.confirmedByUser = {
        connect: { id: input.confirmedBy },
      };
    }

    return base;
  }

  private mapRowCreateData(
    row: CreateBoardImportRowInput,
    batchId: string
  ): Prisma.BoardImportRowCreateManyInput {
    return {
      batchId,
      prefecture: row.prefecture,
      city: row.city,
      boardNumber: row.boardNumber ?? null,
      address: row.address,
      name: row.name ?? null,
      latitude: row.latitude,
      longitude: row.longitude,
      note: row.note ?? null,
      rawJson: row.rawData as Prisma.InputJsonValue,
      matchedBoardId: row.matchedBoardId ?? null,
      matchConfidence: row.matchConfidence,
      distanceMeter: row.distanceMeter ?? null,
      diff: row.diff
        ? (row.diff as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      suggestedAction: row.suggestedAction,
      finalDecision: row.finalDecision ?? null,
      assigneeId: row.assigneeId ?? null,
      comment: row.comment ?? null,
    };
  }

  private mapMissingCreateData(
    item: CreateBoardImportMissingInput,
    batchId: string
  ): Prisma.BoardImportMissingCreateManyInput {
    return {
      batchId,
      boardId: item.boardId,
      reason: item.reason,
      finalDecision: item.finalDecision ?? null,
      comment: item.comment ?? null,
    };
  }
}
