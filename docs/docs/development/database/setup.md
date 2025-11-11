# データベースセットアップ

## 概要

Polisterでは、PostgreSQL + PostGIS（空間データ拡張）を使用してデータを管理します。

## 必要な環境

- Docker
- Docker Compose
- Prisma

## ローカル環境のセットアップ

### 1. Docker Composeでデータベース起動（推奨）

プロジェクトルートの`docker-compose.yml`を使用：

```bash
# データベースとRedisを起動
docker-compose up -d

# 起動確認
docker-compose ps

# ログ確認
docker-compose logs postgres
```

### 使用イメージ

- **PostgreSQL + PostGIS**: `postgis/postgis:17-3.5`
  - PostgreSQL 17（最新版）
  - PostGIS 3.5（空間データ拡張）
  - PostGIS拡張が自動的に有効化
- **Redis**: `redis:latest`
  - ジオコーディング結果のキャッシュ用

### 2. データベース接続確認

```bash
# PostgreSQLコンテナに接続
docker-compose exec postgres psql -U postgres -d polister_development

# PostGISバージョン確認
SELECT PostGIS_version();

# 拡張機能確認
\dx
```

### 3. 環境変数設定

プロジェクトルートに`.env`ファイルを作成（`.env.example`をコピー）：

```bash
cp .env.example .env
```

`.env`の内容：

```env
# Database（Docker Compose使用時）
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/polister_development?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Prisma
PRISMA_GENERATE_DATAPROXY=false
```

**注意**: `.env`ファイルはGitにコミットされません（`.gitignore`で除外）。

### 4. Prismaセットアップ

```bash
# Prismaクライアント生成
yarn db:generate

# スキーマをデータベースに反映（開発中はdb:pushを使用）
yarn db:push

# Prisma Studioでデータ確認（オプション）
yarn db:studio
```

**注意**: 開発初期はスキーマが頻繁に変わるため、マイグレーションではなく`db:push`を使用します。スキーマが安定してからマイグレーションに移行します。

## データベーススキーマ

### 主要テーブル

#### boards（掲示場）

```sql
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_number TEXT,
  address TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  municipality_id UUID NOT NULL REFERENCES municipalities(id),
  trust_level TEXT NOT NULL DEFAULT 'LEVEL_3',
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- 空間インデックス
CREATE INDEX idx_boards_location ON boards USING GIST(location);
CREATE INDEX idx_boards_municipality ON boards(municipality_id);
CREATE INDEX idx_boards_trust_level ON boards(trust_level);
```

#### municipalities（市区町村）

```sql
CREATE TABLE municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  prefecture TEXT NOT NULL,
  polygon GEOGRAPHY(MULTIPOLYGON, 4326),
  source TEXT DEFAULT 'MLIT',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 空間インデックス
CREATE INDEX idx_municipalities_polygon ON municipalities USING GIST(polygon);
CREATE INDEX idx_municipalities_code ON municipalities(code);
```

#### users（ユーザー）

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  image TEXT,
  role TEXT NOT NULL DEFAULT 'VIEWER',
  trust_score FLOAT DEFAULT 0.0,
  verification_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### verifications（検証記録）

```sql
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  result BOOLEAN NOT NULL,
  has_photo BOOLEAN DEFAULT FALSE,
  gps_accuracy FLOAT,
  comment TEXT,
  verified_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verifications_board ON verifications(board_id);
CREATE INDEX idx_verifications_user ON verifications(user_id);
```

#### board_images（掲示場画像）

```sql
CREATE TABLE board_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  image_url TEXT NOT NULL,
  taken_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_board_images_board ON board_images(board_id);
```

#### user_locations（ユーザー居住地）

```sql
CREATE TABLE user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  municipality_id UUID NOT NULL REFERENCES municipalities(id),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_locations_user ON user_locations(user_id);
CREATE INDEX idx_user_locations_municipality ON user_locations(municipality_id);
```

## Prismaスキーマ

詳細は`src/infrastructure/database/schema.prisma`を参照。

### 主要モデル

```prisma
model Board {
  id             String     @id @default(uuid())
  boardNumber    String?    @map("board_number")
  address        String
  location       Unsupported("geography(POINT, 4326)")
  municipalityId String     @map("municipality_id")
  trustLevel     TrustLevel @default(LEVEL_3) @map("trust_level")
  status         BoardStatus @default(PENDING)
  createdAt      DateTime   @default(now()) @map("created_at")
  updatedAt      DateTime   @updatedAt @map("updated_at")
  deletedAt      DateTime?  @map("deleted_at")

  municipality   Municipality @relation(fields: [municipalityId], references: [id])
  images         BoardImage[]
  verifications  Verification[]

  @@index([location], type: Gist)
  @@map("boards")
}

enum TrustLevel {
  LEVEL_1 // 公式
  LEVEL_2 // 確認済み
  LEVEL_3 // 報告
  LEVEL_4 // 記憶
}

enum BoardStatus {
  PENDING    // 未検証
  VERIFIED   // 検証済み
  REJECTED   // 却下
}
```

## スキーマ変更の反映

開発中は`db:push`を使用してスキーマをデータベースに反映します。

```bash
# スキーマをデータベースに反映
yarn db:push

# スキーマ変更後は必ずクライアント再生成
yarn db:generate
```

**マイグレーションについて**:
スキーマが安定した後、本番デプロイ前にマイグレーションに移行します。その際は別途ドキュメントを作成予定です。

## PostGIS空間クエリ

### 基本的な空間クエリ

```sql
-- 特定地点から半径1km以内の掲示場を検索
SELECT * FROM boards
WHERE ST_DWithin(
  location::geography,
  ST_SetSRID(ST_MakePoint(139.7453, 35.6762), 4326)::geography,
  1000  -- メートル
);

-- バウンディングボックス内の掲示場を検索
SELECT * FROM boards
WHERE ST_Within(
  location,
  ST_MakeEnvelope(
    139.70, 35.65,  -- 南西（経度、緯度）
    139.80, 35.70,  -- 北東（経度、緯度）
    4326
  )
);

-- 市区町村ポリゴン内の掲示場を検索
SELECT b.* FROM boards b
JOIN municipalities m ON ST_Within(b.location, m.polygon)
WHERE m.id = 'municipality-id';
```

### Prismaでの空間クエリ

```typescript
// Repository実装例
async findByLocation(
  lat: number,
  lng: number,
  radius: number
): Promise<Board[]> {
  return this.prisma.$queryRaw`
    SELECT * FROM boards
    WHERE ST_DWithin(
      location::geography,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
      ${radius}
    )
  `;
}
```

## 国土数値情報のインポート

### 概要

Polisterでは、国土交通省の[国土数値情報 行政区域データ](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html)を使用して、全国約1,900の市区町村データ（名称、コード、境界ポリゴン）を取得します。

### 前提条件

以下のツールをインストールしてください：

```bash
# GDAL/OGR（地理空間データ変換ツール）
brew install gdal  # macOS
sudo apt-get install gdal-bin  # Ubuntu

# wellknownライブラリ（GeoJSON→WKT変換）
yarn add wellknown
yarn add -D @types/wellknown
```

### インポート手順

**推奨方法**: Yarnコマンドで公式同期スクリプトを使用

```bash
# 国土数値情報をダウンロード・インポート（一括処理）
yarn municipalities:sync
```

このコマンドは以下を自動実行します：

#### インポート処理フロー

```mermaid
flowchart TD
  A["国土数値情報をダウンロード<br/>MLIT N03-2025"] --> B["ZIPファイルを解凍"]
  B --> C["Shapefileを読み込み"]
  C --> D["PostgreSQLにインポート<br/>1905市区町村"]
  D --> E["データ検証"]
  E --> F{検証結果}
  F -->|OK| G["✓ インポート完了"]
  F -->|NG| H["✗ エラー通知"]
```

1. 国土数値情報（N03-2025）をダウンロード
2. ZIPファイルを解凍
3. Shapefileを読み込み
4. PostgreSQLにインポート（1905市区町村）

**詳細**: スクリプトの実装は `src/scripts/sync-municipalities.ts` を参照してください。

#### データ検証

```sql
-- 件数確認（約1,900件）
SELECT COUNT(*) FROM municipalities;

-- 都道府県別の件数確認
SELECT prefecture, COUNT(*) as count
FROM municipalities
GROUP BY prefecture
ORDER BY prefecture;

-- ポリゴンの有無確認
SELECT
  COUNT(*) as total,
  COUNT(polygon) as with_polygon,
  COUNT(*) - COUNT(polygon) as without_polygon
FROM municipalities;

-- サンプルデータの確認
SELECT name, code, prefecture
FROM municipalities
ORDER BY code
LIMIT 10;

-- 空間クエリのテスト（国会議事堂の位置で確認）
SELECT name, code, prefecture
FROM municipalities
WHERE ST_Within(
  ST_SetSRID(ST_MakePoint(139.7453, 35.6762), 4326),
  polygon::geometry
);
-- 期待される結果: 千代田区
```

### 簡略版: ogr2ogrで直接インポート

TypeScriptスクリプトを使わず、ogr2ogrとpsqlで直接インポートする方法：

```bash
#!/bin/bash
# scripts/import-municipalities.sh

set -e

echo "=== Municipalities Import Script ==="

# 1. GeoJSONをPostGISに直接インポート
echo "Step 1: Importing GeoJSON to PostgreSQL..."
ogr2ogr -f PostgreSQL \
  PG:"host=localhost port=5432 dbname=polister_development user=postgres password=postgres" \
  -nln municipalities_temp \
  -t_srs EPSG:4326 \
  scripts/data/municipalities.geojson

# 2. 一時テーブルからMunicipalitiesテーブルにマージ
echo "Step 2: Merging to municipalities table..."
psql -h localhost -U postgres -d polister_development <<EOF
INSERT INTO municipalities (id, name, code, prefecture, polygon, source, created_at, updated_at)
SELECT
  gen_random_uuid(),
  n03_004 as name,
  n03_007 as code,
  n03_001 as prefecture,
  ST_Transform(wkb_geometry, 4326)::geography as polygon,
  'MLIT' as source,
  CURRENT_TIMESTAMP as created_at,
  CURRENT_TIMESTAMP as updated_at
FROM municipalities_temp
WHERE n03_004 IS NOT NULL
  AND n03_007 IS NOT NULL
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  prefecture = EXCLUDED.prefecture,
  polygon = EXCLUDED.polygon,
  updated_at = CURRENT_TIMESTAMP;

-- 一時テーブルを削除
DROP TABLE municipalities_temp;

-- 件数確認
SELECT COUNT(*) as total FROM municipalities;
SELECT prefecture, COUNT(*) as count FROM municipalities GROUP BY prefecture ORDER BY prefecture;
EOF

echo "✓ Import completed!"
```

実行：

```bash
chmod +x scripts/import-municipalities.sh
./scripts/import-municipalities.sh
```

### 年次更新

国土数値情報は年1回更新されます。更新時の手順：

#### 年次更新ワークフロー

```mermaid
flowchart TD
  A["新年度版をダウンロード<br/>N03-2026"] --> B["インポートスクリプト実行<br/>yarn municipalities:sync"]
  B --> C["ON CONFLICT DO UPDATE"]
  C --> D["新規追加レコード"]
  C --> E["更新レコード"]
  D --> F["孤立Boardレコードの検出"]
  E --> F
  F --> G{孤立レコード<br/>あり?}
  G -->|あり| H["位置情報から<br/>市区町村を自動割り当て"]
  G -->|なし| I["✓ 更新完了"]
  H --> I
```

1. **新年度版のダウンロード**

   ```bash
   curl -O https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2026/N03-20260101_GML.zip
   ```

2. **インポートスクリプト実行**
   - `ON CONFLICT (code) DO UPDATE`により既存データを更新
   - 新しい市区町村が追加される
   - 合併・廃止された市区町村は削除されない（孤立レコードとして残る）

3. **孤立したBoardレコードの確認と修正**

   ```sql
   -- 市区町村が合併・廃止されたBoardを検出
   SELECT b.id, b.board_number, b.address, old_m.name as old_municipality
   FROM boards b
   LEFT JOIN municipalities old_m ON b.municipality_id = old_m.id
   WHERE NOT EXISTS (
     SELECT 1 FROM municipalities m
     WHERE m.id = b.municipality_id
   );

   -- 位置情報から適切な市区町村を自動割り当て
   UPDATE boards b
   SET municipality_id = m.id
   FROM municipalities m
   WHERE ST_Within(b.location::geometry, m.polygon::geometry)
     AND NOT EXISTS (
       SELECT 1 FROM municipalities m2 WHERE m2.id = b.municipality_id
     );
   ```

## データベースメンテナンス

### バックアップ

```bash
# データベース全体のバックアップ
pg_dump polister_development > backup.sql

# 特定テーブルのバックアップ
pg_dump -t boards polister_development > boards_backup.sql

# 圧縮してバックアップ
pg_dump polister_development | gzip > backup_$(date +%Y%m%d).sql.gz
```

### リストア

```bash
# バックアップからリストア
psql polister_development < backup.sql

# 圧縮ファイルからリストア
gunzip -c backup_20251017.sql.gz | psql polister_development
```

### 空間インデックスの再構築

```sql
-- インデックス再構築
REINDEX INDEX idx_boards_location;
REINDEX INDEX idx_municipalities_polygon;

-- VACUUMとANALYZE
VACUUM ANALYZE boards;
VACUUM ANALYZE municipalities;
```

## トラブルシューティング

### PostGIS拡張が見つからない

```bash
# PostGISがインストールされているか確認
psql -c "SELECT * FROM pg_available_extensions WHERE name = 'postgis';"

# インストールされていない場合
brew install postgis  # macOS
sudo apt-get install postgresql-17-postgis-3  # Ubuntu
```

### スキーマ同期エラー

```bash
# データベースをリセット（開発環境のみ）
yarn db:push --force-reset

# スキーマを再度反映
yarn db:push
```

### 接続エラー

```bash
# PostgreSQLが起動しているか確認
pg_isready

# 接続テスト
psql -h localhost -U postgres -d polister_development
```

## 参考リンク

- [国土数値情報 行政区域データ](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html)
- [GDAL/OGR](https://gdal.org/) - 地理空間データ変換ツール
- [PostGIS空間データガイド](./spatial.md)
- [データベーススキーマ](./schema.md)

---

最終更新: 2025年10月17日
