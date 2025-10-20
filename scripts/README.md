# スクリプトガイド

## 国土数値情報 行政区域データのインポート

### 概要

国土交通省が提供する[国土数値情報 行政区域データ](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html)をダウンロードし、データベースにインポートするスクリプトです。

**完全TypeScript実装** - 本番環境でも実行可能

### 使用方法

#### クイックスタート

```bash
yarn municipalities:sync
```

このコマンド一つで以下をすべて実行します：

1. 国土数値情報のZIPファイルをダウンロード
2. ZIPファイルを解凍
3. Shapefileをストリーミング読み込み
4. データベースにバッチインポート（UPSERT）

### 実行例

```bash
$ yarn municipalities:sync

╔════════════════════════════════════════════════════════╗
║   国土数値情報 行政区域データ 同期スクリプト         ║
╚════════════════════════════════════════════════════════╝

━━━ Step 1/3: ダウンロード ━━━
URL: https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2025/N03-20250101_GML.zip

  進捗: 45.23MB / 45.23MB (100.0%)
  ✓ ダウンロード完了

━━━ Step 2/3: 解凍 ━━━
  解凍中...
  ✓ 解凍完了

━━━ Step 3/3: データベースにインポート ━━━
  入力: ./scripts/data/N03-20250101.shp

Shapefileを読み込み中...
  進捗: 1897 件処理済み (挿入: 1897, エラー: 0)

✓ インポート完了

結果サマリー:
  処理件数: 1897 件
  新規追加: 1897 件
  更新: 0 件
  エラー: 0 件

  データベース総件数: 1897 件

都道府県別件数（上位5件）:
  北海道: 179 件
  青森県: 40 件
  岩手県: 33 件
  宮城県: 35 件
  秋田県: 25 件

╔════════════════════════════════════════════════════════╗
║   ✓ すべての処理が完了しました！                     ║
╚════════════════════════════════════════════════════════╝

データ確認:
  yarn db:studio
```

### 特徴

#### 1. 完全TypeScript実装

- **外部ツール不要**: ogr2ogr、psql等の外部コマンド不要
- **本番環境対応**: Node.jsがあれば実行可能
- **クロスプラットフォーム**: macOS、Linux、Windowsで動作

#### 2. メモリ効率的

- **ストリーミング処理**: Shapefileを一度にメモリに読み込まない
- **バッチ処理**: 100件ずつデータベースに挿入

#### 3. 高速処理

- **並列処理**: バッチ処理で効率的にINSERT
- **UPSERT**: 既存データは更新、新規データは追加

#### 4. エラーハンドリング

- **詳細な進捗表示**: 処理件数、エラー件数をリアルタイム表示
- **エラー時も継続**: 一部のデータにエラーがあっても処理を継続

### インポート後の確認

#### Prisma Studioで確認

```bash
yarn db:studio
```

ブラウザでMunicipalitiesテーブルを確認できます。

#### SQLで確認

```bash
docker-compose exec postgres psql -U postgres -d polister_development
```

```sql
-- 件数確認
SELECT COUNT(*) FROM municipalities;

-- 都道府県別件数
SELECT prefecture, COUNT(*) as count
FROM municipalities
GROUP BY prefecture
ORDER BY prefecture;

-- サンプルデータ
SELECT name, code, prefecture
FROM municipalities
ORDER BY code
LIMIT 10;

-- 空間クエリのテスト（国会議事堂の位置）
SELECT name, code, prefecture
FROM municipalities
WHERE ST_Within(
  ST_SetSRID(ST_MakePoint(139.7453, 35.6762), 4326),
  polygon::geometry
);
-- 期待される結果: 千代田区
```

### トラブルシューティング

#### データベースに接続できない

```bash
# PostgreSQLが起動しているか確認
docker-compose ps

# 起動していない場合
docker-compose up -d

# 接続確認
yarn db:studio
```

#### ダウンロードに失敗する

- インターネット接続を確認
- 国土数値情報サイトのURLが変更されている可能性
  - `src/scripts/sync-municipalities.ts`のCONFIG.downloadUrlを確認・更新

#### インポート時にエラーが発生する

```bash
# スキーマが最新か確認
yarn db:push

# Prismaクライアントを再生成
yarn db:generate

# データベースをリセット（開発環境のみ）
yarn db:push --force-reset
```

#### 既にデータが存在する場合

再実行すると既存データは自動的に更新されます（UPSERT）。

### ファイル構成

```
scripts/
├── README.md                        # このファイル
└── data/                            # データディレクトリ（.gitignore対象）
    ├── N03-20250101_GML.zip         # ダウンロードファイル
    ├── N03-20250101.shp             # Shapefile
    ├── N03-20250101.shx             # Shapefileインデックス
    ├── N03-20250101.dbf             # 属性データ
    └── N03-20250101.prj             # 座標系情報

src/scripts/
└── sync-municipalities.ts           # 同期スクリプト（TypeScript）
```

### データの詳細

- **提供元**: 国土交通省 国土数値情報
- **データ種別**: 行政区域データ（N03）
- **座標系**: JGD2011 → WGS84（EPSG:4326）に自動変換
- **件数**: 約1,900件（全国の市区町村）
- **更新頻度**: 年1回

### 年次更新

国土数値情報は年1回更新されます。新年度版が公開されたら：

1. `src/scripts/sync-municipalities.ts`のCONFIG.downloadUrlを新年度版に更新
2. `yarn municipalities:sync`を実行
3. 既存データは自動的に更新される（UPSERT）

### 参考リンク

- [国土数値情報 行政区域データ](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2025.html)
- [PostGIS空間データガイド](/docs/docs/development/database/spatial.md)
- [データベースセットアップ](/docs/docs/development/database/setup.md)

---

作成日: 2025年10月17日
