# データベーススキーマ

## 概要

Polisterのデータベーススキーマは、PostgreSQL 17 + PostGIS 3.5を使用し、掲示板の位置情報を空間データとして管理します。

## ER図

```mermaid
erDiagram
    BOARDS ||--o{ BOARD_IMAGES : has
    BOARDS ||--o{ VERIFICATIONS : receives
    BOARDS }o--|| MUNICIPALITIES : belongs_to
    USERS ||--o{ VERIFICATIONS : performs
    USERS ||--o{ BOARD_IMAGES : uploads
    USERS ||--o{ USER_LOCATIONS : has
    USERS ||--o{ ACCOUNTS : has
    USERS ||--o{ SESSIONS : has
    USER_LOCATIONS }o--|| MUNICIPALITIES : references

    BOARDS {
        uuid id PK
        int board_number
        string address
        geography location "POINT"
        uuid municipality_id FK
        enum trust_level
        enum status
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    MUNICIPALITIES {
        uuid id PK
        string name
        string code UK
        string prefecture
        geography polygon "MULTIPOLYGON"
        string source
        timestamp created_at
        timestamp updated_at
    }

    USERS {
        uuid id PK
        string email UK
        string name
        string image
        enum role
        float trust_score
        int verification_count
        timestamp created_at
        timestamp updated_at
        timestamp email_verified
    }

    VERIFICATIONS {
        uuid id PK
        uuid board_id FK
        uuid user_id FK
        boolean result
        boolean has_photo
        float gps_accuracy
        text comment
        timestamp verified_at
        timestamp created_at
    }

    BOARD_IMAGES {
        uuid id PK
        uuid board_id FK
        uuid user_id FK
        string image_url
        timestamp taken_at
        timestamp created_at
    }

    USER_LOCATIONS {
        uuid id PK
        uuid user_id FK
        uuid municipality_id FK
        boolean is_primary
        timestamp created_at
    }

    ACCOUNTS {
        uuid id PK
        uuid user_id FK
        string type
        string provider
        string provider_account_id
    }

    SESSIONS {
        uuid id PK
        string session_token UK
        uuid user_id FK
        timestamp expires
    }
```

## 主要テーブル

### boards（掲示板）

掲示板の位置情報と基本データを管理します。

| カラム名        | 型               | 説明                   |
| --------------- | ---------------- | ---------------------- |
| id              | UUID             | 主キー                 |
| board_number    | Integer          | 掲示板番号             |
| address         | String           | 住所                   |
| location        | Geography(POINT) | 位置情報（緯度経度）   |
| municipality_id | UUID             | 市区町村ID（外部キー） |
| trust_level     | TrustLevel       | 信頼度レベル           |
| status          | BoardStatus      | ステータス             |
| created_at      | Timestamp        | 作成日時               |
| updated_at      | Timestamp        | 更新日時               |
| deleted_at      | Timestamp        | 削除日時（論理削除）   |

**インデックス**:

- location（空間インデックス - GIST）
- municipality_id
- trust_level
- status

**リレーション**:

- Municipality（所属市区町村）
- BoardImage[]（関連画像）
- Verification[]（検証記録）

### municipalities（市区町村）

国土数値情報から取得した市区町村データを管理します。

| カラム名   | 型                      | 説明                               |
| ---------- | ----------------------- | ---------------------------------- |
| id         | UUID                    | 主キー                             |
| name       | String                  | 市区町村名                         |
| code       | String                  | 市区町村コード（ユニーク）         |
| prefecture | String                  | 都道府県名                         |
| polygon    | Geography(MULTIPOLYGON) | 行政区域ポリゴン                   |
| source     | String                  | データソース（デフォルト: "MLIT"） |
| created_at | Timestamp               | 作成日時                           |
| updated_at | Timestamp               | 更新日時                           |

**インデックス**:

- code（ユニーク）
- polygon（空間インデックス - GIST）

**リレーション**:

- Board[]（所属掲示板）
- UserLocation[]（ユーザー居住地）

### users（ユーザー）

ユーザー情報と信頼度スコアを管理します。

| カラム名           | 型        | 説明                       |
| ------------------ | --------- | -------------------------- |
| id                 | UUID      | 主キー                     |
| email              | String    | メールアドレス（ユニーク） |
| name               | String    | 表示名                     |
| image              | String    | プロフィール画像URL        |
| role               | UserRole  | 役割                       |
| trust_score        | Float     | 信頼度スコア（0.0-1.0）    |
| verification_count | Integer   | 検証実施回数               |
| created_at         | Timestamp | 作成日時                   |
| updated_at         | Timestamp | 更新日時                   |
| deleted_at         | Timestamp | 削除日時（論理削除）       |
| email_verified     | Timestamp | メール認証日時             |

**インデックス**:

- email（ユニーク）
- role

**リレーション**:

- Account[]（OAuth認証情報）
- Session[]（セッション）
- Verification[]（検証記録）
- BoardImage[]（アップロード画像）
- UserLocation[]（居住地）

### verifications（検証記録）

掲示板の検証履歴を記録します。

| カラム名     | 型        | 説明                    |
| ------------ | --------- | ----------------------- |
| id           | UUID      | 主キー                  |
| board_id     | UUID      | 掲示板ID（外部キー）    |
| user_id      | UUID      | ユーザーID（外部キー）  |
| result       | Boolean   | 検証結果（正しい/誤り） |
| has_photo    | Boolean   | 写真添付有無            |
| gps_accuracy | Float     | GPS精度（メートル）     |
| comment      | Text      | コメント                |
| verified_at  | Timestamp | 検証日時                |
| created_at   | Timestamp | 作成日時                |

**インデックス**:

- board_id
- user_id

**用途**:

- 複数人による検証結果の集約
- 自動承認の判定材料
- 検証履歴の追跡

### board_images（掲示板画像）

掲示板の写真を管理します。

| カラム名   | 型        | 説明                               |
| ---------- | --------- | ---------------------------------- |
| id         | UUID      | 主キー                             |
| board_id   | UUID      | 掲示板ID（外部キー）               |
| user_id    | UUID      | アップロードユーザーID（外部キー） |
| image_url  | String    | 画像URL                            |
| taken_at   | Timestamp | 撮影日時                           |
| created_at | Timestamp | 作成日時                           |

**用途**:

- 現地確認時の証拠写真
- データ信頼度向上

### user_locations（ユーザー居住地）

ユーザーの活動地域を管理し、地域ベース検証依頼に使用します。

| カラム名        | 型        | 説明                   |
| --------------- | --------- | ---------------------- |
| id              | UUID      | 主キー                 |
| user_id         | UUID      | ユーザーID（外部キー） |
| municipality_id | UUID      | 市区町村ID（外部キー） |
| is_primary      | Boolean   | 主要居住地フラグ       |
| created_at      | Timestamp | 作成日時               |

**用途**:

- 地域ベース検証依頼の送信先決定
- ユーザーの活動エリア管理

## Enum定義

### TrustLevel（信頼度レベル）

データの信頼度を4段階で管理します。

| 値      | 名称     | 説明                                 |
| ------- | -------- | ------------------------------------ |
| LEVEL_1 | 公式     | 自治体から提供された公式データ       |
| LEVEL_2 | 確認済み | 現地確認・写真付きで検証されたデータ |
| LEVEL_3 | 報告     | 協力者からの報告（未検証）           |
| LEVEL_4 | 記憶     | 過去の記憶や伝聞（要検証）           |

**遷移**:

- LEVEL_4 → LEVEL_3: 1人が現地確認
- LEVEL_3 → LEVEL_2: 3人以上が検証
- LEVEL_1 → LEVEL_2: 現地検証完了

### BoardStatus（掲示板ステータス）

| 値       | 名称     | 説明                         |
| -------- | -------- | ---------------------------- |
| PENDING  | 未検証   | 検証待ち状態                 |
| VERIFIED | 検証済み | 検証が完了し承認された       |
| REJECTED | 却下     | 検証の結果、誤りと判断された |

### UserRole（ユーザー役割）

| 値          | 名称                 | 説明                 | 権限                                   |
| ----------- | -------------------- | -------------------- | -------------------------------------- |
| VIEWER      | 閲覧者               | データ閲覧のみ       | データ閲覧                             |
| EDITOR      | 編集者               | データ登録・編集可能 | 閲覧、登録、編集、検証報告             |
| COORDINATOR | 地域コーディネーター | 承認権限あり         | 全て（承認・却下含む）                 |
| ADMIN       | 管理者               | システム管理者       | 全て（ユーザー管理、システム設定含む） |

## PostGIS空間データ

### 座標系（SRID）

全ての空間データはSRID 4326（WGS84）を使用します。

- **SRID 4326**: GPS等で使用される世界測地系
- **緯度**: -90〜90度
- **経度**: -180〜180度

### 空間データ型

#### POINT（掲示板位置）

```sql
-- boards.location
geography(POINT, 4326)

-- 例: 東京都千代田区永田町1-7-1
-- 緯度: 35.6762, 経度: 139.7453
POINT(139.7453 35.6762)
```

#### MULTIPOLYGON（市区町村境界）

```sql
-- municipalities.polygon
geography(MULTIPOLYGON, 4326)

-- 複数のポリゴンで複雑な行政区域を表現
```

### 空間インデックス（GIST）

空間検索のパフォーマンス向上のため、GISTインデックスを使用：

```sql
CREATE INDEX idx_boards_location ON boards USING GIST(location);
CREATE INDEX idx_municipalities_polygon ON municipalities USING GIST(polygon);
```

## データ整合性

### カスケード削除

関連データの整合性を保つため、適切なカスケード設定：

- **Board削除時**: 関連するBoardImage、Verificationも削除
- **User削除時**:
  - **物理削除は行わない**（論理削除を使用）
  - Account、Sessionのみカスケード削除
  - Verification、BoardImageは保持（検証履歴の保全）
  - UserLocationはカスケード削除
- **Municipality削除時**: 参照整合性エラー（先にBoardを削除する必要あり）

### ソフトデリート（論理削除）

Board、Userテーブルは論理削除（`deleted_at`）をサポート：

```typescript
// Boardの論理削除
await prisma.board.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Userの論理削除
await prisma.user.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// 削除済みを除外
await prisma.board.findMany({
  where: { deletedAt: null },
});

await prisma.user.findMany({
  where: { deletedAt: null },
});
```

**Userの論理削除の重要性**:

ユーザーを物理削除すると、以下のデータ整合性の問題が発生します：

1. **検証履歴の喪失**: 過去の検証記録から検証者情報が失われる
2. **信頼度の低下**: 誰が検証したか不明になり、データの信頼度が判断できない
3. **監査証跡の欠損**: データ品質管理の履歴が追跡できない

そのため、ユーザーは論理削除し、検証記録・画像データは保持します。GDPR等の削除要求には、個人情報（email、name、image）のみを匿名化して対応します。

```typescript
// GDPR対応の匿名化
await prisma.user.update({
  where: { id },
  data: {
    email: `deleted-${id}@deleted.local`,
    name: "削除されたユーザー",
    image: null,
    deletedAt: new Date(),
  },
});
```

## パフォーマンス考慮事項

### インデックス戦略

1. **空間インデックス**: location、polygon（GIST）
2. **外部キー**: municipality_id、user_id、board_id
3. **検索頻度の高いカラム**: trust_level、status、role

### クエリ最適化

- **N+1問題の回避**: Prismaの`include`で関連データを一括取得
- **ページネーション**: `take`と`skip`の使用
- **空間クエリ**: 適切なバウンディングボックスで検索範囲を限定

## NextAuth統合

### NextAuth用テーブル

NextAuth.js v5に対応したテーブル構成：

- **accounts**: OAuth認証情報
- **sessions**: セッション管理
- **verification_tokens**: メール認証トークン

詳細は[NextAuth.js Prisma Adapter](https://authjs.dev/getting-started/adapters/prisma)を参照。

---

最終更新: 2025年9月27日
