# PostGIS空間データガイド

## 概要

Polisterでは、PostGISを使用して掲示板の位置情報や市区町村の境界データを管理します。

## 座標系

### SRID 4326（WGS84）

全ての空間データは**SRID 4326（WGS84）**を使用します。

- **用途**: GPS、Google Maps、Mapbox等で標準的に使用される座標系
- **単位**: 度（degree）
- **緯度範囲**: -90〜90度
- **経度範囲**: -180〜180度

```sql
-- 座標系の確認
SELECT ST_SRID(location) FROM boards LIMIT 1;
-- 結果: 4326
```

## 空間データ型

### POINT（点）

掲示板の位置を表現します。

```sql
-- POINTの作成
ST_SetSRID(ST_MakePoint(経度, 緯度), 4326)

-- 例: 東京都千代田区永田町1-7-1
ST_SetSRID(ST_MakePoint(139.7453, 35.6762), 4326)
```

**注意**: PostGISでは**経度, 緯度**の順序です（一般的な緯度, 経度とは逆）。

### MULTIPOLYGON（複数ポリゴン）

市区町村の境界を表現します。

```sql
-- MULTIPOLYGONの例
geography(MULTIPOLYGON, 4326)
```

## 基本的な空間クエリ

### 距離計算

```sql
-- 2点間の距離を計算（メートル単位）
SELECT ST_Distance(
  ST_SetSRID(ST_MakePoint(139.7453, 35.6762), 4326)::geography,
  location::geography
) as distance_meters
FROM boards;
```

### 範囲検索

```sql
-- 特定地点から半径1km以内の掲示板を検索
SELECT * FROM boards
WHERE ST_DWithin(
  location::geography,
  ST_SetSRID(ST_MakePoint(139.7453, 35.6762), 4326)::geography,
  1000  -- メートル
);
```

### バウンディングボックス検索

```sql
-- 地図の表示範囲内の掲示板を検索
SELECT * FROM boards
WHERE ST_Within(
  location,
  ST_MakeEnvelope(
    139.70, 35.65,  -- 南西（経度, 緯度）
    139.80, 35.70,  -- 北東（経度, 緯度）
    4326
  )
);
```

### ポリゴン内判定

```sql
-- 掲示板が市区町村ポリゴン内にあるか判定
SELECT b.*, m.name as municipality_name
FROM boards b
JOIN municipalities m ON ST_Within(b.location, m.polygon)
WHERE m.id = 'municipality-id';
```

## Prismaでの空間クエリ

### Repository実装例

```typescript
// src/features/board/infrastructure/repositories/BoardRepository.ts
import { injectable, inject } from "tsyringe";
import type { PrismaClient } from "@prisma/client";
import { TOKENS } from "@/shared/lib/di/tokens";

@injectable()
export class BoardRepository {
  constructor(@inject(TOKENS.PrismaClient) private prisma: PrismaClient) {}

  // 半径検索
  async findByLocation(
    lat: number,
    lng: number,
    radiusMeters: number
  ): Promise<Board[]> {
    return this.prisma.$queryRaw`
      SELECT * FROM boards
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )
      AND deleted_at IS NULL
    `;
  }

  // バウンディングボックス検索
  async findByBounds(
    swLat: number,
    swLng: number,
    neLat: number,
    neLng: number
  ): Promise<Board[]> {
    return this.prisma.$queryRaw`
      SELECT * FROM boards
      WHERE ST_Within(
        location,
        ST_MakeEnvelope(${swLng}, ${swLat}, ${neLng}, ${neLat}, 4326)
      )
      AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1000
    `;
  }

  // 市区町村内の掲示板を検索
  async findByMunicipality(municipalityId: string): Promise<Board[]> {
    return this.prisma.$queryRaw`
      SELECT b.* FROM boards b
      JOIN municipalities m ON b.municipality_id = m.id
      WHERE m.id = ${municipalityId}::uuid
      AND b.deleted_at IS NULL
    `;
  }
}
```

### 型安全性の注意

`$queryRaw`を使用する場合、戻り値の型を明示的に指定します：

```typescript
interface BoardWithDistance extends Board {
  distance_meters: number;
}

async findNearby(lat: number, lng: number): Promise<BoardWithDistance[]> {
  return this.prisma.$queryRaw<BoardWithDistance[]>`
    SELECT *,
      ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) as distance_meters
    FROM boards
    WHERE deleted_at IS NULL
    ORDER BY distance_meters
    LIMIT 10
  `;
}
```

## 空間インデックスの活用

### GISTインデックス

PostGISの空間検索にはGISTインデックスを使用します。

```sql
-- インデックス作成（Prismaスキーマで自動作成）
CREATE INDEX idx_boards_location ON boards USING GIST(location);

-- インデックス使用確認
EXPLAIN ANALYZE
SELECT * FROM boards
WHERE ST_DWithin(
  location::geography,
  ST_SetSRID(ST_MakePoint(139.7453, 35.6762), 4326)::geography,
  1000
);
```

### パフォーマンス Tips

1. **geography型を使用**: 距離計算が正確（メートル単位）
2. **バウンディングボックスで絞り込み**: 空間インデックスが効率的に動作
3. **LIMIT句**: 大量データの場合は結果件数を制限

## よく使う空間関数

### 距離・範囲

| 関数        | 説明             | 例                                |
| ----------- | ---------------- | --------------------------------- |
| ST_Distance | 2点間の距離      | `ST_Distance(point1, point2)`     |
| ST_DWithin  | 指定距離内か判定 | `ST_DWithin(point, center, 1000)` |
| ST_Within   | ポリゴン内か判定 | `ST_Within(point, polygon)`       |

### 作成・変換

| 関数            | 説明       | 例                                              |
| --------------- | ---------- | ----------------------------------------------- |
| ST_MakePoint    | 点を作成   | `ST_MakePoint(lng, lat)`                        |
| ST_SetSRID      | SRIDを設定 | `ST_SetSRID(geom, 4326)`                        |
| ST_MakeEnvelope | 矩形を作成 | `ST_MakeEnvelope(xmin, ymin, xmax, ymax, 4326)` |

### 情報取得

| 関数         | 説明              | 例                   |
| ------------ | ----------------- | -------------------- |
| ST_X         | 経度を取得        | `ST_X(point)`        |
| ST_Y         | 緯度を取得        | `ST_Y(point)`        |
| ST_AsGeoJSON | GeoJSON形式で出力 | `ST_AsGeoJSON(geom)` |

## トラブルシューティング

### 経度と緯度の順序間違い

```typescript
// ❌ 間違い: 緯度, 経度
ST_MakePoint(35.6762, 139.7453);

// ✅ 正しい: 経度, 緯度
ST_MakePoint(139.7453, 35.6762);
```

### geography型とgeometry型の違い

- **geography**: 地球を球体として扱う、距離計算が正確（メートル単位）
- **geometry**: 平面として扱う、計算が高速だが距離が不正確

Polisterでは**geography型を推奨**します。

### 空間インデックスが使われない

```sql
-- ❌ インデックスが使われない
WHERE ST_Distance(location, point) < 1000

-- ✅ インデックスが使われる
WHERE ST_DWithin(location, point, 1000)
```

## 参考リンク

- [PostGIS公式ドキュメント](https://postgis.net/docs/)
- [PostGIS空間関数リファレンス](https://postgis.net/docs/reference.html)
- [Prisma PostGIS](https://www.prisma.io/docs/orm/prisma-schema/data-model/unsupported-database-features)

---

最終更新: 2025年9月27日
