/**
 * PrefectureDetail エンティティ
 *
 * 都道府県の詳細情報（自治体一覧を含む）を表現するドメインエンティティ
 */

import type { Municipality } from "@/features/municipality/domain/entities/Municipality";
import type { MunicipalityBoardRecord } from "@/features/municipality/domain/repositories/IMunicipalityRepository";
import type { PrefectureProps } from "./Prefecture";
import { Prefecture } from "./Prefecture";

export interface PrefectureDetailProps extends PrefectureProps {
  municipalities: Municipality[];
  boards: MunicipalityBoardRecord[];
}

export class PrefectureDetail extends Prefecture {
  constructor(private readonly detailProps: PrefectureDetailProps) {
    super(detailProps);
  }

  get municipalities(): Municipality[] {
    return this.detailProps.municipalities;
  }

  get boards(): MunicipalityBoardRecord[] {
    return this.detailProps.boards;
  }
}
