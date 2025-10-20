/**
 * Prefecture エンティティ
 *
 * 都道府県単位の集約情報を表現するドメインエンティティ
 */

import type { MunicipalityStatus } from "@prisma/client";

export interface PrefectureProps {
  code: string;
  name: string;
  municipalityCount: number;
  totalBoardCount: number | null;
  statusCounts: Partial<Record<MunicipalityStatus, number>>;
}

export class Prefecture {
  constructor(private readonly props: PrefectureProps) {}

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get municipalityCount(): number {
    return this.props.municipalityCount;
  }

  get totalBoardCount(): number | null {
    return this.props.totalBoardCount;
  }

  get statusCounts(): Partial<Record<MunicipalityStatus, number>> {
    return this.props.statusCounts;
  }

  /**
   * 完了済み自治体数
   */
  get completedMunicipalityCount(): number {
    return this.props.statusCounts.COMPLETED ?? 0;
  }

  /**
   * 進捗率（0〜1）
   */
  get completionRate(): number {
    if (this.props.municipalityCount === 0) {
      return 0;
    }

    return this.completedMunicipalityCount / this.props.municipalityCount;
  }
}
