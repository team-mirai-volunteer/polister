# Polister コーディング規約

Polister プロジェクトでコードを記述する際の共通ルールをまとめています。Next.js 15 / React 19 / TypeScript を前提とし、Clean Architecture 実装ガイドやテスト戦略ガイドを補完します。

## 適用対象

- `src/` 配下のアプリケーションコード（App Router、features、shared、infrastructure）
- テストコード（ユニット・統合・E2E）
- 開発用スクリプトやユーティリティ

## 参照ガイド

重複を避けるため、以下のドキュメントも併せて参照してください。

- [Clean Architecture実装ガイド](./clean-architecture-guide.md)
- [DDD導入ガイド](./ddd-guide.md)
- [Polister テスト戦略ガイド](./testing-guide.md)

## 基本原則

1. **読みやすさ優先**: 目的がすぐ理解できる命名・配置にする
2. **変更容易性**: 機能単位で完結し、他モジュールへの影響を最小化
3. **型安全性**: `strict` の前提で型を必ず定義し、`any` は最後の手段
4. **自動化ツール尊重**: ESLint / Prettier / Yarn Scripts の結果を常に信頼

## 命名規則

| 対象 | 形式 | 例 | 備考 |
| --- | --- | --- | --- |
| コンポーネント | PascalCase | `BoardList` | デフォルトエクスポートでも PascalCase |
| Hooks | `use` + PascalCase | `useBoardFilters` | React Hooks ルールに従う |
| 型エイリアス | PascalCase | `type BoardId = string;` | ドメインモデル・共有型に使用 |
| interface | PascalCase | `interface PaginationParams` | 外部契約・DI トークンなど拡張を想定する場合 |
| 変数 / 関数 | camelCase | `boardCount`, `fetchBoards` | boolean は `is`, `has`, `should` で開始 |
| 定数 | SCREAMING_SNAKE_CASE | `DEFAULT_PAGE_SIZE` | `const` かつ変更不可の値 |
| ファイル（React Component） | kebab-case | `board-card.tsx` | コンポーネント名とは切り離す |
| テストファイル | 対象 + `.test.ts[x]` | `board-card.test.tsx` | Arrange / Act / Assert のコメントは任意 |
| Storybook | 対象 + `.stories.tsx` | `board-card.stories.tsx` | 将来導入を想定 |

## ディレクトリとモジュール構成

- `src/features/<feature>/` 以下にドメイン・アプリケーション・インフラ・UI をまとめ、[Clean Architecture実装ガイド](./clean-architecture-guide.md) の構成に従います。
- 共通処理は `src/shared/` に配置し、特定機能へ依存しないことを確認してください。
- App Router 配下では Route Group を活用し、`(auth)` / `(public)` のようにアクセス制御単位でまとめます。
- ファイルの肥大化を避け、概ね 150 行を超える場合は責務を分割することを検討してください。

## TypeScript スタイル

- `type` と `interface` は用途で使い分ける：
  - 複合型やユニオンを扱う場合は `type`
  - 外部実装に実装義務を課したい抽象契約（DI トークン、Repository など）は `interface`
- `any` / `unknown` を導入する場合は必ず理由をコメントで明記し、早期に除去する
- `as` キャストは最小限とし、型ガードや型推論で解決できないか検討する
- Nullable は明示的に `null | undefined` ではなく `T | null` など必要な片方に限定する
- 配列・マップ操作は不変データを基本とし、破壊的更新が必要な場合はコメントで意図を残す
- 例外メッセージにはユーザー向けと開発者向けの情報を分離し、必要に応じてログで詳細を残す

## React / Next.js ベストプラクティス

- デフォルトは Server Component。ブラウザ限定機能を使う場合のみ `"use client"` を付与
- Hook 内で非同期処理を行う際は `useEffect` / `useTransition` を適切に選択し、副作用を隔離する
- フォームや入力系は制御コンポーネントを基本とし、バリデーションは `features/<feature>/ui` から `shared/lib/validation` 等のユーティリティに抽出
- `features/<feature>/ui` のコンポーネントはユースケースから props でデータを受け渡し、直接 Repository に依存させない
- MUI コンポーネントの `sx` は軽量な調整に留め、再利用が想定されるスタイルは `shared/ui` にテーマ化
- ルーティングは Next.js の `Route Segment Config` を用い、`generateMetadata` 等の静的メソッドで SEO 設定をまとめる

## データアクセスと DI

- Repository や外部 API クライアントは `src/infrastructure/` で実装し、`src/shared/lib/di` のトークン経由で依存解決
- Prisma 利用時は `src/infrastructure/database/schema.prisma` にスキーマを集約し、必ず GIST インデックスなど [データベーススキーマガイド](../../development/database/schema.md) の要件を満たす
- `TOKENS` に新しい依存を追加する際は命名を `camelCase` + `Token` で統一し、`container.ts` に登録処理を追加

## テスト・バリデーション

- テストの層別方針とモック戦略は [Polister テスト戦略ガイド](./testing-guide.md) に準拠
- ユースケースのテストでは jest-mock-extended を用い、`beforeEach` で `mockReset` を行う
- ドメインサービスは純粋関数として実装し、副作用が生じる場合は別サービスに切り出す
- バリデーションは Zod 等のスキーマバリデータ導入を検討し、`shared/lib/validation` へ配置（未導入の場合は Issue 化）

## Lint / Format / コミット前チェック

| コマンド | 目的 | 実行タイミング |
| --- | --- | --- |
| `yarn lint` | ESLint による静的解析 | 保存時はエディタ連携、PR 前に必須 |
| `yarn typecheck` | TypeScript 型チェック | 主要な仕様変更時、CI 直前 |
| `yarn format` | Prettier 書式統一 | 大量編集後や自動整形が崩れた場合 |
| `yarn validate` | lint + typecheck + format:check | Pull Request 前の最終確認 |

- Prettier 設定は `.prettierrc.json` に従い、`prettier-plugin-organize-imports` が自動で import を整列します。手動の import 並び替えは不要です。
- ESLint は `next/core-web-vitals` と `next/typescript` 拡張を利用しているため、`use client` の有無や React Hooks の使用ルールは自動チェックされます。

## PR 作成時のチェックポイント

1. Issue 番号を紐づけ、スコープ外の変更が混在していないか確認
2. `yarn validate` を通過し、フォーマット差分が存在しないことを確認
3. 設計判断を行った場合は ADR または関連 Issue に根拠を記録
4. レビューコメントには対応内容を明記し、未対応がある場合は TODO として追跡

---

最終更新: 2025年10月
