# Polister

## Politics + Poster = Polister

選挙ポスター掲示場の位置情報をデジタル化し、オープンデータとして提供するWebサービス

[![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE)
[![CI](https://github.com/team-mirai-volunteer/polister/actions/workflows/ci.yml/badge.svg)](https://github.com/team-mirai-volunteer/polister/actions/workflows/ci.yml)

## 📖 概要

Polisterは、全国の選挙ポスター掲示場の位置情報を管理・公開するプラットフォームです。

### 主な機能

- 🗺️ **地図表示**: Mapbox GL JSによるインタラクティブな地図
- 📍 **位置管理**: 掲示場の位置情報の登録・編集・検索
- ✅ **検証システム**: 地域ベースの検証依頼と自動承認
- 📊 **データ品質**: 信頼度レベルによるデータ管理
- 🔄 **データインポート**: CSV、Excel、KML形式の一括登録
- 🌐 **オープンデータ**: API経由でのデータアクセス

### 運営

新党「チームみらい」のサポーター主導プロジェクト

## 🚀 クイックスタート

### 前提条件

- Node.js 20.x以上
- Yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/team-mirai-volunteer/polister.git
cd polister

# 依存関係をインストール
yarn install
```

### 開発サーバーの起動

```bash
# Next.jsアプリケーション
yarn dev

# ドキュメントサイト（Next.jsとポート競合を避けるため3100番を使用）
PORT=3100 yarn docs:dev
```

- アプリケーション: <http://localhost:3000>
- ドキュメント: <http://localhost:3100（`PORT=3100> yarn docs:dev` で起動）

### 環境変数

`.env.example` をコピーして `.env` を作成し、以下の値を設定してください：

- `NEXTAUTH_URL`: ローカル開発では `http://localhost:3000` を指定
- `NEXTAUTH_SECRET`: `openssl rand -base64 32` などで生成したランダム文字列
- 初期管理者作成時は `ADMIN_EMAIL` / `ADMIN_PASSWORD`（任意で `ADMIN_NAME`）をセットして `yarn user:create-admin` を実行

サインインはメールアドレスとパスワードで行います。Google OAuth 連携は今後の実装予定です。

```bash
# 初期管理者アカウントの作成例
ADMIN_EMAIL="admin@example.com" \
ADMIN_PASSWORD="change-me" \
yarn user:create-admin
```

## 📚 ドキュメント

詳細なドキュメントは以下で公開しています：

- **オンライン**: <https://team-mirai-volunteer.github.io/polister/>
- **ローカル**: `PORT=3100 yarn docs:dev` で起動

### 主要ドキュメント

- [要件定義書](https://team-mirai-volunteer.github.io/polister/requirements/project-overview)
- [アーキテクチャガイド](https://team-mirai-volunteer.github.io/polister/architecture/)
- [クリーンアーキテクチャ実装ガイド](https://team-mirai-volunteer.github.io/polister/architecture/guidelines/clean-architecture-guide)
- [開発ガイド](https://team-mirai-volunteer.github.io/polister/development/)

## 🛠️ 技術スタック

### フロントエンド

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19, Material UI
- **Language**: TypeScript
- **Styling**: Emotion
- **Map**: Mapbox GL JS

### バックエンド

- **API**: Next.js API Routes
- **Database**: PostgreSQL + PostGIS
- **Cache**: Redis

### 開発ツール

- **Linter**: ESLint
- **Formatter**: Prettier (import自動整理)
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions
- **Code Review**: CodeRabbit

### ドキュメント

- **Framework**: Docusaurus 3
- **Diagrams**: Mermaid

## 🏗️ アーキテクチャ

**Clean Architecture + Domain-Driven Design (DDD)** に基づいた設計を採用：

### アーキテクチャ方針

- **Clean Architecture**: ビジネスロジックを技術的詳細から分離
- **DDD**: ドメインモデル中心の設計
  - ユビキタス言語の徹底
  - バウンデッドコンテキスト（`features/`配下）
  - 集約、値オブジェクト、ドメインサービス
  - ドメインイベントによる副作用の分離

### ディレクトリ構造

```text
src/
├── app/              # Next.js App Router (Presentation層)
├── features/         # 機能別モジュール（バウンデッドコンテキスト）
│   ├── board/        # 掲示場管理コンテキスト
│   │   ├── domain/           # ドメイン層（DDD Core）
│   │   │   ├── aggregates/   # 集約ルート
│   │   │   ├── value-objects/# 値オブジェクト
│   │   │   ├── services/     # ドメインサービス
│   │   │   └── repositories/ # リポジトリIF
│   │   ├── application/      # ユースケース
│   │   ├── infrastructure/   # リポジトリ実装
│   │   └── ui/               # UIコンポーネント
│   ├── verification/ # 検証管理コンテキスト
│   └── import/       # インポートコンテキスト
├── shared/           # 共有リソース
└── infrastructure/   # 共有インフラ（DB、外部API）
```

詳細は以下のドキュメントを参照：

- [アーキテクチャ概要](https://team-mirai-volunteer.github.io/polister/architecture/)
- [Clean Architecture実装ガイド](https://team-mirai-volunteer.github.io/polister/architecture/guidelines/clean-architecture-guide)
- [DDD導入ガイド](https://team-mirai-volunteer.github.io/polister/architecture/guidelines/ddd-guide)

## 🧪 テスト

```bash
# 全チェック（lint + typecheck + format）
yarn validate

# 個別実行
yarn lint        # ESLint
yarn typecheck   # TypeScript型チェック
yarn format      # コードフォーマット
```

## 🤝 コントリビューション

### 貢献の流れ

1. Issueを作成（または既存のIssueを選択）
2. featureブランチを作成: `git checkout -b feature/#N_description`
3. 変更を実施、コミット
4. Pull Requestを作成（develop向け）
5. CIチェックとコードレビューを通過
6. マージ

### Pull Request作成前のチェック

```bash
yarn validate  # 全チェックを実行
```

### CLA（貢献者ライセンス契約）

初回のPull Request作成時に、[CLA](CLA.md)への同意が必要です。PRテンプレートのチェックボックスで同意を示してください。

### ブランチ保護ルール

`develop`と`main`ブランチは保護されており、以下が必須です：

- Pull Requestの作成
- CIチェックの通過（ESLint、TypeScript、Prettier）
- コードレビューの承認

## 📋 開発コマンド

### アプリケーション

```bash
yarn dev          # 開発サーバー起動
yarn build        # 本番ビルド
yarn start        # 本番サーバー起動
yarn lint         # ESLint実行
yarn typecheck    # 型チェック
yarn format       # フォーマット実行
yarn validate     # 全チェック実行
```

### ドキュメントコマンド

```bash
yarn docs:dev     # ドキュメントサーバー起動
yarn docs:build   # ドキュメントビルド
yarn docs:serve   # ビルド済みドキュメント配信
```

## 📄 ライセンス

このプロジェクトは[AGPL-3.0ライセンス](LICENSE)の下で公開されています。

## 🔗 リンク

- **ドキュメント**: <https://team-mirai-volunteer.github.io/polister/>
- **Issues**: <https://github.com/team-mirai-volunteer/polister/issues>
- **Pull Requests**: <https://github.com/team-mirai-volunteer/polister/pulls>
