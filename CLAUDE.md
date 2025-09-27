# CLAUDE.md

このファイルはClaude Code (claude.ai/code) がこのリポジトリでコードを扱う際のガイダンスを提供します。

**重要**: このリポジトリでの作業では、常に日本語で回答してください。

## Git コミットガイドライン

- **コミットメッセージは日本語で記述する**
- コミット形式: `タイプ: 説明`
- 例: `feat: Material UI統合を追加`, `fix: リンクエラーを修正`, `docs: ドキュメントを更新`
- **重要**: ユーザーから明示的な指示があるまでコミットしないこと

## ブランチ戦略

### ブランチ構成

- **develop**: メインブランチ（デフォルト）
- **main**: 本番リリース用ブランチ
- **feature/#N_xxx**: 機能開発ブランチ（Nはイシュー番号）
  - 例: `feature/#1_kml-import`
  - developからブランチを作成
  - developへマージ

### ブランチ保護

- `main`と`develop`への直接pushは禁止
- 必ずPull Requestを経由してマージ
- PRマージ後、featureブランチは自動削除

### 開発フロー

1. **Issueを作成** - GitHub Issuesで課題を登録
2. **featureブランチ作成** - `git checkout -b feature/#1_xxx`
3. **開発・コミット** - 変更を実施、コミット
4. **Push** - `git push -u origin feature/#1_xxx`
5. **Pull Request作成** - developブランチへのPRを作成
6. **レビュー・マージ** - レビュー後にマージ
7. **Issueクローズ** - PR本文に`Closes #1`を記載して自動クローズ

### Pull Request作成

- **タイトル**: `feat: KML形式のインポート機能を追加` (日本語)
- **本文**:

  ```markdown
  ## 概要

  [変更内容の説明]

  ## 変更内容

  - [具体的な変更]

  Closes #1
  ```

- **ターゲットブランチ**: `develop`

## コード品質チェック

- **実行ディレクトリ**: 必ずプロジェクトルート（`/Users/seiichiro/apps/team-mirai/polister`）で実行
- **lint**: `yarn lint` - ESLintを実行
- **typecheck**: `yarn typecheck` - TypeScriptの型チェック
- **format**: `yarn format` - Prettierでフォーマット
- **validate**: `yarn validate` - 全チェック（typecheck + lint + format:check）

### CI/CD自動チェック

Pull Requestを作成すると、以下のチェックが自動実行されます：

- **ESLint**: コードの静的解析
- **TypeScript Type Check**: 型の整合性チェック
- **Prettier Format Check**: コードフォーマットチェック

全てのチェックが通過しないとマージできません。

## ブランチ保護ルールの設定

### developブランチの保護設定

GitHubリポジトリの Settings → Branches で以下を設定：

1. **Add branch protection rule**をクリック
2. **Branch name pattern**: `develop`
3. 以下をチェック：
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
     - **Required checks**:
       - `ESLint`
       - `TypeScript Type Check`
       - `Prettier Format Check`
   - ✅ **Do not allow bypassing the above settings**
4. **Create**をクリック

### mainブランチの保護設定

同様の設定を`main`ブランチにも適用します。

## プロジェクト概要

これは TypeScript サポートを持つ Next.js 15.5.4 アプリケーションで、React 19.1.0 を使用しています。パッケージ管理には Yarn を使用し、より高速な開発ビルドのために Turbopack を含んでいます。

## よく使用する開発コマンド

### 開発サーバー

```bash
yarn dev
```

開発サーバーを起動します（Turbopack使用）。http://localhost:3000 でアクセス可能。

### ビルド

```bash
yarn build
```

本番用ビルドを作成します（Turbopack使用）。

### 本番サーバー

```bash
yarn start
```

本番用サーバーを起動します。

### リンティング

```bash
yarn lint
```

ESLintを実行してコードをチェックします。

### 型チェック

```bash
yarn typecheck
```

TypeScriptの型チェックを実行します。

### フォーマット

```bash
yarn format
```

Prettierでコードをフォーマットします。

### 全チェック

```bash
yarn validate
```

型チェック、lint、フォーマットチェックを一括実行します。

## プロジェクト構造

```
polister/
├── src/
│   └── app/            # Next.js App Router ディレクトリ
│       ├── layout.tsx  # ルートレイアウトコンポーネント
│       ├── page.tsx    # ホームページ
│       ├── globals.css # グローバルスタイル
│       └── page.module.css # ページ固有のスタイル
├── public/             # 静的ファイル
├── package.json        # 依存関係とスクリプト
├── tsconfig.json       # TypeScript 設定
├── next.config.ts      # Next.js 設定
└── eslint.config.mjs   # ESLint 設定
```

## アーキテクチャ

- **フレームワーク**: Next.js 15 with App Router
- **TypeScript**: Strict モード有効、パスマッピング設定 (`@/*` → `./src/*`)
- **スタイリング**: CSS Modules + Global CSS
- **フォント**: Geist Sans & Geist Mono (next/font/google 経由でロード)
- **リンティング**: Next.js TypeScript 設定を使用した ESLint

## 主要な設定詳細

- TypeScript パスマッピング: `@/*` は `./src/*` にマップ
- ESLint 拡張: `next/core-web-vitals` および `next/typescript`
- 開発とビルドの両方で Turbopack を有効化
- モダンな ES2017 ターゲットを持つ Strict TypeScript 設定
