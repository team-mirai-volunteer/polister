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

### PRマージ前の最終確認

Pull Requestを作成する前に、以下を必ず確認：

```bash
# 全チェックを実行
yarn validate

# 結果確認
# ✅ lint: エラーなし
# ✅ typecheck: エラーなし
# ✅ format:check: フォーマット済み
```

**マージ前チェックリスト**:

- [ ] `yarn validate`を実行して全て通過
- [ ] CIチェックが全て通過（ESLint、TypeScript、Prettier）
- [ ] CodeRabbitのレビュー指摘に対応済み
- [ ] CLAチェックボックスにチェック済み
- [ ] スコープ外の変更が含まれていないか確認

## コード品質チェック

- **実行ディレクトリ**: 必ずプロジェクトルート（リポジトリルート）で実行
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

## CodeRabbitレビュー対応

### レビュー指摘の確認

```bash
# PRのレビューコメントを確認
gh pr view <PR番号> --comments

# APIでコメント詳細を取得
gh api repos/team-mirai-volunteer/polister/pulls/<PR番号>/comments
```

### 対応プロセス

1. **レビュー指摘を確認**: 全ての指摘（Major、Minor、Nitpick）を確認
2. **設計判断が必要な場合**: コメントで説明し`@coderabbitai`メンション
3. **修正を実施**: コードを修正してコミット
4. **対応内容を報告**: コメントで修正内容を説明

### 設計判断の文書化

重要な設計判断は以下に記録：

- **コメント**: PRのレビュースレッドで説明
- **Issue**: 関連Issueを更新して要件を明確化
- **ドキュメント**: 該当ドキュメントに理由を記載

## Prisma/データベース

### スキーマ配置

- **場所**: `prisma/schema.prisma`（規約で必須）
- **理由**: Prisma CLI が標準ディレクトリを参照するため、`prisma/` 直下に配置

### Prisma開発フロー

```bash
# 開発中（スキーマが頻繁に変わる）
yarn db:push          # スキーマをDBに反映
yarn db:generate      # Prismaクライアント生成
yarn db:studio        # データ確認

# 本番デプロイ前（スキーマが安定後）
npx prisma migrate dev --name description
npx prisma migrate deploy
```

### PostGIS空間インデックス

**必須**: location、polygon等の空間カラムには必ずGISTインデックスを設定

```prisma
model Board {
  location Unsupported("geography(POINT, 4326)")
  @@index([location], type: Gist)  // 必須
}
```

### 論理削除の設計方針

#### 論理削除を使用するモデル

- **User**: 検証履歴・画像データの保全のため
- **Board**: 削除履歴の追跡のため

```prisma
model User {
  deletedAt DateTime? @map("deleted_at")
}
```

#### カスケード削除の判断基準

| データの性質     | カスケード削除 | 例                       |
| ---------------- | -------------- | ------------------------ |
| 一時的な認証情報 | ✅ 維持        | Account、Session         |
| 現在の設定値     | ✅ 維持        | UserLocation             |
| 永続的な履歴     | ❌ 除去        | Verification、BoardImage |

**理由**: 検証履歴と証拠写真は監査証跡として永続的に保持

## Issue管理

### スコープ管理

- **原則**: 1つのPRは1つのIssueに集中
- **スコープ外の変更**: 別Issueを作成して分離
- **例**: データベース設計PRに図のズーム機能を含めない

### Issueの更新

```bash
# Issueの内容を更新
gh issue edit <番号> --body "$(cat <<'EOF'
更新内容...
EOF
)"
```

設計判断や要件変更があった場合は、Issueを更新して記録します。

## Exec Plan運用

- Issue開始時に `docs/docs/plan/` 配下へ `<issue番号>_<概要_snake>.md` を作成し、目的・スコープ・タスク・検証方法を記載する。軽微な対応でもスコープ共有が必要と判断した場合は同様に作成する。
- ドキュメント冒頭のタイトルは `# Issue #<番号> <日本語タイトル> 実行計画` 形式に統一する（例: `# Issue #25 基本レイアウト整備 実行計画`）。
- Exec Plan の更新内容は常に最新状態を保ち、追記・修正を行った際は PR 本文やコミットメッセージで差分を共有する。必要に応じて Issue 側にもリンクを記録する。
- 追加で実施したテストや調査は、実行コマンドと結果を Exec Plan の進捗欄または決定ログに追記し、再現手順を明示する。
- Plan 完了後は成果物との整合性を確認し、残タスクやフォローアップ事項があれば To-Do に整理して後続 Issue へ引き継ぐ。
- Exec Plan は以下のフォーマットに従う（作業中も最新状態を保つこと）：
  1. **全体像**（目的・背景・スコープを簡潔に列挙）
  2. **進捗状況（チェックリスト）**（タスクの完了状況を `[ ]` / `[x]` で管理）
  3. **発見と驚き**（調査で得られた知見や想定外の事項）
  4. **決定ログ（日時と理由）**（ `YYYY-MM-DD HH:MM JST` 形式を推奨）
  5. **To-Do**（次に取るアクションやフォローアップ）
- 実装時は常に該当 Plan を参照し、進捗・決定事項・検証結果を反映させながら作業する。

## ドキュメント作成

### 標準構成

技術ドキュメントには以下を含める：

1. **概要図**: Mermaid ER図、アーキテクチャ図
2. **詳細説明**: テーブル定義、カラム説明
3. **使用例**: コードサンプル、クエリ例
4. **トラブルシューティング**: よくある問題と解決方法

### Mermaid図

- テーブル構造: ER図
- フロー: flowchart、sequenceDiagram
- 状態遷移: stateDiagram

## プロジェクト概要

これは TypeScript サポートを持つ Next.js 15.5.4 アプリケーションで、React 19.1.0 を使用しています。
パッケージ管理には Yarn を使用し、より高速な開発ビルドのために Turbopack を含んでいます。

## よく使用する開発コマンド

### 開発サーバー

```bash
yarn dev
```

開発サーバーを起動します（Turbopack使用）。<http://localhost:3000> でアクセス可能。

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

## アーキテクチャ

Polisterは**Clean Architecture**と**Domain-Driven Design (DDD)**を組み合わせた設計を採用しています。

### 基本方針

- **Clean Architecture**: 依存関係逆転の原則でビジネスロジックを技術的詳細から分離
- **DDD（Domain-Driven Design）**: ドメインモデルを中心とした設計
  - **ユビキタス言語**: ドメイン専門家と開発者が同じ語彙を使用
  - **バウンデッドコンテキスト**: `features/`配下に独立したコンテキストを配置
  - **集約**: 不変条件を守る責任境界
  - **値オブジェクト**: イミュータブルな値型
  - **ドメインサービス**: 複数集約にまたがるロジック
  - **ドメインイベント**: 副作用の分離

### プロジェクト構造

```text
polister/
├── src/
│   ├── app/                       # Next.js App Router (Presentation層)
│   ├── features/                  # 機能別モジュール（バウンデッドコンテキスト）
│   │   ├── board/                 # 掲示板管理コンテキスト
│   │   │   ├── domain/            # ドメイン層（DDD Core）
│   │   │   │   ├── aggregates/   # 集約ルート
│   │   │   │   ├── entities/     # エンティティ
│   │   │   │   ├── value-objects/# 値オブジェクト
│   │   │   │   ├── services/     # ドメインサービス
│   │   │   │   ├── events/       # ドメインイベント
│   │   │   │   └── repositories/ # リポジトリIF
│   │   │   ├── application/       # アプリケーション層
│   │   │   │   ├── usecases/     # ユースケース
│   │   │   │   └── services/     # アプリケーションサービス
│   │   │   ├── infrastructure/    # インフラ層
│   │   │   │   ├── repositories/ # リポジトリ実装
│   │   │   │   └── mappers/      # マッパー
│   │   │   └── ui/                # UIコンポーネント
│   │   ├── verification/          # 検証管理コンテキスト
│   │   ├── import/                # インポートコンテキスト
│   │   └── municipality/          # 自治体管理コンテキスト
│   ├── shared/                    # 共有リソース
│   │   ├── ui/                    # 共通UIコンポーネント
│   │   ├── lib/                   # ユーティリティ（DI、エラー等）
│   │   └── types/                 # 共通型定義
│   └── infrastructure/            # 共有インフラ層
│       ├── database/              # Prisma設定
│       └── external/              # 外部APIクライアント
├── docs/                          # Docusaurusドキュメント
├── public/                        # 静的ファイル
└── .claude/                       # Claudeコマンド定義
```

詳細は[アーキテクチャドキュメント](https://team-mirai-volunteer.github.io/polister/architecture/)を参照してください。

### 技術スタック

- **フレームワーク**: Next.js 15 with App Router
- **TypeScript**: Strict モード有効、パスマッピング設定 (`@/*` → `./src/*`)
- **スタイリング**: Material UI 7 + Emotion
- **地図**: Mapbox GL JS
- **データベース**: PostgreSQL + PostGIS (Prisma 6)
- **DI Container**: tsyringe
- **リンティング**: ESLint + Prettier

## 主要な設定詳細

- TypeScript パスマッピング: `@/*` は `./src/*` にマップ
- ESLint 拡張: `next/core-web-vitals` および `next/typescript`
- 開発とビルドの両方で Turbopack を有効化
- モダンな ES2017 ターゲットを持つ Strict TypeScript 設定
