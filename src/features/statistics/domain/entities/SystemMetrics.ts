/**
 * SystemMetrics エンティティ
 *
 * システム全体の統計値を表現するドメインエンティティ
 */

export class SystemMetrics {
  constructor(
    private readonly municipalityCount: number,
    private readonly boardCount: number
  ) {
    if (municipalityCount < 0) {
      throw new RangeError("Municipality count cannot be negative");
    }

    if (boardCount < 0) {
      throw new RangeError("Board count cannot be negative");
    }
  }

  get totalMunicipalities(): number {
    return this.municipalityCount;
  }

  get totalBoards(): number {
    return this.boardCount;
  }
}
