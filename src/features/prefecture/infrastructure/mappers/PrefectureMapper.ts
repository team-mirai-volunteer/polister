/**
 * Prefecture Mapper
 *
 * PrefectureドメインモデルをDTOへ変換するマッパー
 */

import type { BoardLocationDTO } from "@/features/board/application/dto/BoardLocationDTO";
import { MunicipalityMapper } from "@/features/municipality/infrastructure/mappers/MunicipalityMapper";

import type { Prefecture } from "../../domain/entities/Prefecture";
import type { PrefectureDetail } from "../../domain/entities/PrefectureDetail";

export type MunicipalityDTO = ReturnType<typeof MunicipalityMapper.toDTO>;

export interface PrefectureDTO {
  code: string;
  name: string;
  municipalityCount: number;
  totalBoardCount: number | null;
  completedMunicipalityCount: number;
  completionRate: number;
  statusCounts: Record<string, number | undefined>;
}

export interface PrefectureDetailDTO extends PrefectureDTO {
  municipalities: MunicipalityDTO[];
  boards: BoardLocationDTO[];
}

export class PrefectureMapper {
  static toDTO(prefecture: Prefecture): PrefectureDTO {
    return {
      code: prefecture.code,
      name: prefecture.name,
      municipalityCount: prefecture.municipalityCount,
      totalBoardCount: prefecture.totalBoardCount,
      completedMunicipalityCount: prefecture.completedMunicipalityCount,
      completionRate: prefecture.completionRate,
      statusCounts: { ...prefecture.statusCounts },
    };
  }

  static toDetailDTO(prefecture: PrefectureDetail): PrefectureDetailDTO {
    return {
      ...PrefectureMapper.toDTO(prefecture),
      municipalities: prefecture.municipalities.map((municipality) =>
        MunicipalityMapper.toDTO(municipality)
      ),
      boards: prefecture.boards.map(
        (board) =>
          ({
            id: board.id,
            boardNumber: board.boardNumber,
            name: board.name,
            address: board.address,
            longitude: board.longitude,
            latitude: board.latitude,
            status: board.status,
            trustLevel: board.trustLevel,
          }) satisfies BoardLocationDTO
      ),
    };
  }
}
