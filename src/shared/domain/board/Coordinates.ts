/**
 * Coordinates 値オブジェクト
 *
 * 掲示場の位置情報（緯度経度）を表す
 */

export interface CoordinatesProps {
  latitude: number;
  longitude: number;
}

export class Coordinates {
  private readonly _latitude: number;
  private readonly _longitude: number;

  constructor(props: CoordinatesProps) {
    // 緯度のバリデーション
    if (
      typeof props.latitude !== "number" ||
      !Number.isFinite(props.latitude)
    ) {
      throw new Error("緯度は有効な数値である必要があります。");
    }
    if (props.latitude < -90 || props.latitude > 90) {
      throw new Error("緯度は-90から90の範囲で指定してください。");
    }

    // 経度のバリデーション
    if (
      typeof props.longitude !== "number" ||
      !Number.isFinite(props.longitude)
    ) {
      throw new Error("経度は有効な数値である必要があります。");
    }
    if (props.longitude < -180 || props.longitude > 180) {
      throw new Error("経度は-180から180の範囲で指定してください。");
    }

    this._latitude = props.latitude;
    this._longitude = props.longitude;
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  /**
   * WKT (Well-Known Text) 形式で座標を返す
   * PostGIS geography型への変換用
   */
  toWKT(): string {
    return `POINT(${this._longitude} ${this._latitude})`;
  }

  /**
   * 別の座標との距離を計算（メートル単位）
   * Haversine式を使用
   */
  distanceTo(other: Coordinates): number {
    const R = 6371000; // 地球の半径（メートル）
    const lat1Rad = this.toRadians(this._latitude);
    const lat2Rad = this.toRadians(other._latitude);
    const deltaLatRad = this.toRadians(other._latitude - this._latitude);
    const deltaLonRad = this.toRadians(other._longitude - this._longitude);

    const a =
      Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
      Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLonRad / 2) *
        Math.sin(deltaLonRad / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * 度をラジアンに変換
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 等価性チェック
   */
  equals(other: Coordinates): boolean {
    if (!(other instanceof Coordinates)) {
      return false;
    }
    return (
      this._latitude === other._latitude && this._longitude === other._longitude
    );
  }

  /**
   * プレーンオブジェクトに変換
   */
  toJSON(): CoordinatesProps {
    return {
      latitude: this._latitude,
      longitude: this._longitude,
    };
  }

  /**
   * プレーンオブジェクトから復元
   */
  static fromJSON(json: CoordinatesProps): Coordinates {
    return new Coordinates(json);
  }
}
