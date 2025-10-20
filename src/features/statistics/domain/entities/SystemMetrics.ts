/**
 * SystemMetrics エンティティ
 *
 * システム全体の統計値を表現するドメインエンティティ
 */

export class SystemMetrics {
  constructor(
    private readonly municipalityCount: number,
    private readonly boardCount: number
  ) {}

  get totalMunicipalities(): number {
    return this.municipalityCount;
  }

  get totalBoards(): number {
    return this.boardCount;
  }
}
