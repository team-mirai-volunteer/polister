# Issue #83 掲示場写真アップロード・管理機能の実装 実行計画

## 全体像

### 目的

2025年参院選時に収集された掲示場写真2,000件超のCSVログから、Google Drive画像をダウンロード・保存し、掲示場レコードと関連付けて管理・閲覧できるシステムを構築する。

### 背景

- CSV形式で管理されている掲示場写真のメタデータ（2,083行）
- Google Driveに保存された画像ファイル
- 位置情報（緯度・経度）、掲示場番号、ステータス情報を含む

### スコープ

- **対象**: CSVインポート、画像ダウンロード・保存、一覧・詳細表示、候補掲示場マッチング
- **除外**: CSVアップロード機能（CLI実行のみ）、本番Cloud Storage実装

## 進捗状況（チェックリスト）

### Phase 1: データモデル・インフラ整備

- [x] Prismaスキーマ拡張（BoardImage、ImageVerificationStatus enum）
- [x] CSV由来フィールド追加（csvPrefecture, csvCity, csvBoardNumber）
- [x] 3種類の画像パス対応（originalPath, displayPath, thumbnailPath）
- [x] db:push でスキーマ反映
- [x] ストレージサービス実装（LocalStorageService: `tmp/storage/`）
- [x] Cloud Storageスタブ作成
- [x] DI登録（TOKENS.StorageService）

### Phase 2: 候補掲示場マッチング機能

- [ ] BoardMatchingService実装（スコアリングアルゴリズム）
- [ ] GetBoardCandidatesUseCase実装
- [ ] BoardRepository拡張（空間検索、市区町村検索）
- [ ] ユニットテスト

### Phase 3: CLIインポート機能

- [x] BoardImageエンティティ作成
- [x] IBoardImageRepository インターフェース定義
- [x] BoardImageRepository 実装
- [x] ImportBoardImagesFromCSVUseCase 実装
- [x] CLIスクリプト実装（Commander.js）
- [x] package.json スクリプト追加（`import:board-images`）
- [x] DI登録

### Phase 4: ダウンロード・保存機能

- [x] GoogleDriveDownloadService 実装
- [x] ダウンロードキャッシュ機能（`tmp/download-cache/`）
- [x] ImageResizeService 実装（Sharp）
- [x] 3種類リサイズ（Original/Display/Thumbnail）
- [x] ExifParserService 実装（exifr）
- [x] Exif位置情報抽出（GPS + 撮影日時）
- [x] CSV位置情報とのフォールバック
- [x] 並列処理（バッチサイズ10）
- [x] エラーハンドリング・リトライ（3回、exponential backoff）
- [x] DI登録

### Phase 5: UI実装

- [x] 画像配信API（`/api/images/[...path]`）
- [x] 画像一覧ページ（`/board-images`）
  - [x] サーバーサイドページネーション
  - [x] ステータス別色分け
  - [x] 位置情報カラム追加
  - [x] ファイル名リンク
  - [x] サーバーサイドソート機能
  - [x] ページ幅xl（1536px）
- [x] 画像詳細ページ（`/board-images/[id]`）
  - [x] BoardImageViewer コンポーネント
  - [x] BoardImageMap コンポーネント（Mapbox連携）
  - [x] 地図表示（位置情報あり: 赤マーカー、なし: 警告オーバーレイ）
  - [x] メタデータ表示
  - [x] Google Drive URLリンク
- [ ] レビュー画面（`/board-images/review`）
- [ ] 候補掲示場API（`GET /api/board-images/[id]/candidates`）
- [ ] 紐付けAPI（`PATCH /api/board-images/[id]/link`）

### Phase 6: テスト・ドキュメント

- [ ] ユニットテスト
- [x] CLIスクリプトのテスト（2件、全件）
- [ ] E2Eテスト
- [x] Exec Plan 作成（本ドキュメント）
- [ ] アーキテクチャドキュメント更新
- [ ] CLIコマンド使用方法ドキュメント

## 発見と驚き

### 技術的発見

1. **Exif位置情報の精度**
   - Exifから抽出した位置情報とCSVの位置情報がほぼ一致
   - 緯度: 33.1171167 (Exif) vs 33.11711667 (CSV)
   - Exif優先で正しい判断

2. **画像リサイズの効果**
   - Original: 2-8MB
   - Display: 200-500KB（約1/10）
   - Thumbnail: 16-30KB（約1/100）
   - 大幅な容量削減に成功

3. **ダウンロードキャッシュの効果**
   - 初回: 3.14秒（2件）
   - 2回目: 0.76秒（約4倍高速化）
   - 全件再インポート時に大幅な時間短縮

4. **画像フォーマットエラー**
   - 2,034件中1件のみエラー（行297）
   - Sharpでサポートされていない画像フォーマット
   - 99.95%の成功率

### 設計判断

1. **StorageProvider enum削除**
   - 環境変数（NODE_ENV）で自動切り替え
   - DI登録時に判定するため、データベースに保存不要

2. **保存先をtmp/に変更**
   - 開発データを一元管理
   - .gitignore対象でコミット回避
   - `tmp/storage/`: リサイズ済み画像
   - `tmp/download-cache/`: ダウンロードキャッシュ

3. **Exif優先の位置情報**
   - Exif GPS → CSV位置情報の優先順位
   - より正確なメタデータを優先

4. **地図の常時表示**
   - 位置情報なしでも日本地図を表示
   - 警告を青いアラートでオーバーレイ
   - ユーザーに状況を明確に伝達

## 決定ログ（日時と理由）

### 2025-11-09 17:22 JST - Phase 1開始

- Prismaスキーマ拡張を優先実施
- 3種類の画像パス（original/display/thumbnail）を設計

### 2025-11-09 17:30 JST - StorageProvider削除

- 環境で自動決定するため、enum不要と判断
- DI登録で切り替えるシンプルな設計に変更

### 2025-11-09 17:50 JST - CLIインポート機能実装

- 10件テストで動作確認
- バッチ処理（10並列）で実装

### 2025-11-09 18:10 JST - 画像リサイズ3種類対応

- Sharp使用してOriginal/Display/Thumbnail生成
- Display: 最大1920x1080、品質85%
- Thumbnail: 300x300（中央クロップ）、品質80%

### 2025-11-09 18:30 JST - 全データインポート実行

- 2,032件 / 2,033件 成功（99.95%）
- 1件のみ画像フォーマットエラー

### 2025-11-09 18:45 JST - Exif位置情報抽出追加

- exifrパッケージ導入
- GPS情報とDateTimeOriginalを抽出
- CSV位置情報よりExifを優先

### 2025-11-09 19:00 JST - ダウンロードキャッシュ追加

- `tmp/download-cache/` にFile ID単位でキャッシュ
- 再インポート時に4倍高速化を確認

### 2025-11-09 19:10 JST - 保存先をtmp/に変更

- `public/uploads/` → `tmp/storage/` に変更
- 開発データをtmpディレクトリで一元管理

### 2025-11-09 19:15 JST - 地図表示機能追加

- MapboxMapコンポーネント活用
- 位置情報なし時の警告オーバーレイ実装

### 2025-11-09 19:25 JST - ソート機能追加

- サーバーサイドソート実装
- URLパラメータ対応（sortField, sortOrder）

## To-Do

### 短期（優先度: 高）

- [ ] **Phase 2: 候補掲示場マッチング機能の実装**
  - BoardMatchingService（スコアリングアルゴリズム）
  - GetBoardCandidatesUseCase
  - BoardRepository拡張（PostGIS空間検索）
- [ ] **レビュー画面の実装**
  - 候補掲示場リスト表示
  - ワンクリック紐付け機能
  - 紐付けAPI

### 中期（優先度: 中）

- [ ] フィルタ機能の実装（都道府県、市区町村、ステータス）
- [ ] 一括操作機能（選択した画像の一括ステータス変更）
- [ ] 掲示場詳細ページへの写真ギャラリー表示
- [ ] ユニットテスト追加

### 長期（優先度: 低）

- [ ] Cloud Storage実装（本番環境用）
- [ ] @google-cloud/storageパッケージ導入
- [ ] 認証機能追加（画像閲覧権限）
- [ ] E2Eテスト追加

## 実装完了機能の詳細

### CLIインポートコマンド

```bash
# 全データインポート
yarn import:board-images "tmp/掲示場写真アップロード（2025参院選） - アップロードログ.csv"

# テスト（10件）
yarn import:board-images "tmp/..." --limit 10

# ダウンロードスキップ（メタデータのみ）
yarn import:board-images "tmp/..." --skip-download

# 並列数変更
yarn import:board-images "tmp/..." --batch-size 20
```

### ディレクトリ構造

```
tmp/
├── download-cache/          # Google Driveダウンロードキャッシュ
│   └── {fileId}            # オリジナル画像（再利用可能）
└── storage/
    └── board-images/
        └── {都道府県}/
            └── {市区町村}/
                ├── original/      # 2-8MB
                ├── display/       # 200-500KB
                └── thumbnail/     # 16-30KB
```

### API エンドポイント

```
GET /api/images/[...path]                  # 画像配信（実装済み）
GET /api/board-images                      # 画像一覧（Server Action）
GET /api/board-images/[id]                 # 画像詳細（Server Action）
GET /api/board-images/[id]/candidates      # 候補掲示場（未実装）⭐
PATCH /api/board-images/[id]/link          # 紐付け（未実装）⭐
```

### データベース統計

- **総件数**: 2,034件
- **位置情報あり**: 約800件（Exif GPS + CSV）
- **位置情報なし**: 約1,200件（ExifもCSVもなし）
- **ステータス内訳**:
  - 未検証（PENDING）: 約1,000件
  - 番号なし（NO_NUMBER）: 約800件
  - 重複（DUPLICATE）: 約200件
  - その他: 約34件

## 次のマイルストーン

### Milestone 1: 候補掲示場マッチング機能

**期限**: 未定
**内容**:

- スコアリングアルゴリズム実装（位置情報50点 + 市区町村30点 + 掲示場番号20点）
- PostGIS空間検索（ST_DWithin）
- 候補掲示場リスト表示（スコア順、上位20件）

### Milestone 2: レビュー画面

**期限**: 未定
**内容**:

- 未検証写真の一覧
- 候補掲示場との紐付けUI
- 一括自動紐付け（HIGH確度のみ）

### Milestone 3: ドキュメント整備

**期限**: 未定
**内容**:

- アーキテクチャドキュメント更新
- CLIコマンド使用方法ドキュメント
- テスト追加

## 技術メモ

### パッケージ追加

- `exifr@7.1.3`: Exif解析
- `commander@14.0.2`: CLIコマンド
- `sharp@0.34.5`: 画像リサイズ
- `axios@1.13.2`: HTTPダウンロード
- `csv-parse@6.1.0`: CSV解析（既存）

### パフォーマンス計測

- **初回インポート（2,034件）**: 約15-20分
- **キャッシュ利用時**: 約4倍高速化
- **画像容量削減率**: 約90%（Original → Display）

### エラー対応

- **画像フォーマットエラー**: 1件（行297）
  - 原因: Sharpでサポートされていない画像形式
  - 対応: エラーログに記録し、処理継続
  - ステータス: DOWNLOAD_FAILED

## 参考リンク

- Issue #83: https://github.com/team-mirai-volunteer/polister/issues/83
- Exifr: https://github.com/MikeKovarik/exifr
- Sharp: https://sharp.pixelplumbing.com/
- PostGIS ST_DWithin: https://postgis.net/docs/ST_DWithin.html
