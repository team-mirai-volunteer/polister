# CLAUDE.md

このファイルはClaude Code (claude.ai/code) がこのリポジトリでコードを扱う際のガイダンスを提供します。

**重要**: このリポジトリでの作業では、常に日本語で回答してください。

## Git コミットガイドライン

- **コミットメッセージは日本語で記述する**
- コミット形式: `タイプ: 説明`
- 例: `feat: Material UI統合を追加`, `fix: リンクエラーを修正`, `docs: ドキュメントを更新`
- **重要**: ユーザーから明示的な指示があるまでコミットしないこと

## プロジェクト概要

これは TypeScript サポートを持つ Next.js 15.5.4 アプリケーションで、React 19.1.0 を使用しています。パッケージ管理には Yarn を使用し、より高速な開発ビルドのために Turbopack を含んでいます。

## よく使用する開発コマンド

### 開発サーバー

```bash
yarn dev
# または
npm run dev
```

開発サーバーを起動します（Turbopack使用）。http://localhost:3000 でアクセス可能。

### ビルド

```bash
yarn build
# または
npm run build
```

本番用ビルドを作成します（Turbopack使用）。

### 本番サーバー

```bash
yarn start
# または
npm run start
```

本番用サーバーを起動します。

### リンティング

```bash
yarn lint
# または
npm run lint
```

ESLintを実行してコードをチェックします。

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
