/**
 * 行政区域コード（5桁）値オブジェクト
 *
 * 全国地方公共団体コード（5桁）を表現する値オブジェクト
 *
 * 構造:
 *   01101
 *   ├─ 01: 都道府県コード（北海道）
 *   └─ 101: 市区町村コード（札幌市中央区）
 *
 * 例:
 *   - 13101: 東京都千代田区
 *   - 27128: 大阪府大阪市北区
 *   - 01101: 北海道札幌市中央区
 */
export class MunicipalityCode {
  private constructor(private readonly value: string) {}

  /**
   * 行政区域コードを生成
   *
   * @param code 5桁の行政区域コード
   * @throws バリデーションエラー
   */
  static create(code: string): MunicipalityCode {
    // バリデーション: 5桁の数字
    if (!/^\d{5}$/.test(code)) {
      throw new Error(`Invalid municipality code: ${code}. Must be 5 digits.`);
    }

    return new MunicipalityCode(code);
  }

  /**
   * 文字列として取得
   */
  toString(): string {
    return this.value;
  }

  /**
   * 都道府県コード（最初の2桁）を取得
   */
  getPrefectureCode(): string {
    return this.value.substring(0, 2);
  }

  /**
   * 市区町村コード（後ろの3桁）を取得
   */
  getCityCode(): string {
    return this.value.substring(2, 5);
  }

  /**
   * 値の等価性を判定
   */
  equals(other: MunicipalityCode): boolean {
    return this.value === other.value;
  }
}
