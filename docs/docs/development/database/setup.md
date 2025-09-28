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

#### boards（掲示板）

```sql
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_number INTEGER NOT NULL,
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

#### board_images（掲示板画像）

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

詳細は`prisma/schema.prisma`を参照。

### 主要モデル

```prisma
model Board {
  id             String     @id @default(uuid())
  boardNumber    Int        @map("board_number")
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
-- 特定地点から半径1km以内の掲示板を検索
SELECT * FROM boards
WHERE ST_DWithin(
  location::geography,
  ST_SetSRID(ST_MakePoint(139.7453, 35.6762), 4326)::geography,
  1000  -- メートル
);

-- バウンディングボックス内の掲示板を検索
SELECT * FROM boards
WHERE ST_Within(
  location,
  ST_MakeEnvelope(
    139.70, 35.65,  -- 南西（経度、緯度）
    139.80, 35.70,  -- 北東（経度、緯度）
    4326
  )
);

-- 市区町村ポリゴン内の掲示板を検索
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

## データベースメンテナンス

### バックアップ

```bash
# データベース全体のバックアップ
pg_dump polister_development > backup.sql

# 特定テーブルのバックアップ
pg_dump -t boards polister_development > boards_backup.sql
```

### リストア

```bash
# バックアップからリストア
psql polister_development < backup.sql
```

### 空間インデックスの再構築

```sql
-- インデックス再構築
REINDEX INDEX idx_boards_location;

-- VACUUMとANALYZE
VACUUM ANALYZE boards;
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

---

最終更新: 2025年9月27日
