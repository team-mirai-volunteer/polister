# Issue #23 ユーザー認証基盤（NextAuth.js） 実行計画

## 全体像

- 目的: NextAuth.js v5 をベースに、メールアドレス＋パスワードによる認証を実装し、初期管理者アカウントを安全に運用できる基盤を整備する。
- 背景: MVP フェーズではまず内部運用を優先するため、Google OAuth 連携よりも手元で管理しやすい Credentials 認証が求められた。
- スコープ: NextAuth.js 設定の再構成（Credentials プロバイダー化）、パスワードハッシュ管理、初期管理者作成スクリプト、ログイン UI、認証ミドルウェア、環境変数と手順ドキュメント更新。

## 進捗状況（チェックリスト）

- [x] NextAuth.js 基盤導入（JWT セッション化）
- [x] Credentials 認証への転換（Prisma 連携／パスワードハッシュ）
- [x] 初期管理者アカウント作成フローの実装
- [x] 認証ミドルウェアの Edge 対応検証（Credentials 版）
- [x] ログイン画面（フォーム）実装
- [x] 環境変数・運用手順ドキュメント更新
- [x] `yarn validate` の再実行
- [x] 影響範囲に応じたユニットテスト実行
- [x] JWTSessionError 修正（NEXTAUTH_SECRET フォールバック処理）

## 発見と驚き

- 現行コードベースに NextAuth.js 関連の設定は存在しない（`.env.example` には `NEXTAUTH_URL` / `NEXTAUTH_SECRET` のみが存在）。
- `AppShell` 配下の `AppBar` ではダミーユーザー情報を直接渡しており、サインイン/サインアウトは未実装。
- DI コンテナには認証関連の依存関係登録がなく、Prisma のみがグローバル管理されている。
- BoardImport 系サーバーアクションは認証チェックを持たずに公開されていたため、サーバー側でもセッション必須にする方針を採用。
- Next.js ミドルウェアは Edge Runtime 上で動作するため、Prisma/DI 依存を直接持たない JWT セッション構成に切り替える必要があった。
- 認証方式を Google OAuth から Credentials (Email + Password) へ切り替える要望を受け、パスワードハッシュ管理と初期管理者導線が必要。
- `NEXTAUTH_SECRET` が `undefined` の場合に JWTSessionError が発生する問題を発見。開発環境用のフォールバック処理を追加し、本番環境では必須とする設計に変更。

## 決定ログ（日時と理由）

- 2025-10-31 10:04 JST: Issue #23 対応としてブランチ `feature/#23_user-auth-nextauth` を作成（develop 起点）。
- 2025-10-31 10:13 JST: BoardImport 関連のサーバーアクション実行時に `requireAuth` を強制し、未認証アクセスを防止する。
- 2025-10-31 10:22 JST: ミドルウェアの Edge Runtime 制約に合わせてセッション戦略を JWT 化し、Edge 用軽量設定とサーバー用 Prisma Adapter 設定を分離。
- 2025-10-31 10:22 JST: `yarn validate`（typecheck/lint/format:check/test:coverage/test:e2e）を完走し、全テストが成功。
- 2025-10-31 10:30 JST: Google OAuth を後回しにし、Credentials 認証を優先する方針へ転換。
- 2025-10-31 10:45 JST: Prisma スキーマに `passwordHash` を追加し、Credentials プロバイダー＋ログインフォーム＋管理者作成スクリプトを実装。
- 2025-10-31 10:47 JST: `yarn validate` を再実行し、Lint/Typecheck/Jest/Playwright が全て成功。
- 2025-11-09 JST: JWTSessionError の原因を調査し、`NEXTAUTH_SECRET` が未設定の場合のフォールバック処理を実装。開発環境ではデフォルト値を使用し警告を表示、本番環境ではエラーを投げるように修正（src/shared/lib/auth/config.ts）。

## To-Do

- フォローアップ事項は現在なし（次フェーズで追加要件があれば更新）。
