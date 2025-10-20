# Polisterプロジェクトドキュメント

## 概要

このディレクトリには、Polisterプロジェクトに関するすべてのドキュメントが含まれています。開発者向け、利用者向け、要件定義など、様々な種類のドキュメントが整理されています。

## ドキュメント構造

### 📋 requirements/ - 要件定義

プロジェクトの要件と仕様に関するドキュメント

- **[プロジェクト概要](./requirements/project-overview.md)** - プロジェクトの目的と要件の詳細

### 🏛️ architecture/ - アーキテクチャドキュメント

システムアーキテクチャに関する設計文書

- **[アーキテクチャ概要](./architecture/index.md)** - Clean Architecture + DDD統合方針
- **[Clean Architecture実装ガイド](./architecture/guidelines/clean-architecture-guide.md)** - 実装パターンと例
- **[DDD導入ガイド](./architecture/guidelines/ddd-guide.md)** - ドメイン駆動設計の実践

### 🛠️ development/ - 開発ドキュメント

開発チーム向けの実践的な開発ガイド

- **[開発ガイド](./development/index.md)** - 開発環境構築・開発フロー

### 👥 user-guides/ - 利用者向けガイド

エンドユーザー向けの利用方法ガイド

- **[利用者ガイド](./user-guides/index.md)** - 基本的な使い方から詳細機能まで

## 読者別クイックガイド

### 🆕 新規参加者（開発者）

1. **プロジェクト理解**: [要件定義](./requirements/project-overview.md)
2. **技術アーキテクチャ**: [アーキテクチャ概要](./architecture/index.md)
3. **開発環境構築**: [開発ガイド](./development/index.md)

### 👩‍💻 現役開発者

- **開発フロー**: [開発ガイド](./development/index.md)
- **アーキテクチャ**: [実装ガイドライン](./architecture/index.md)

### 👥 エンドユーザー

- **使い方**: [利用者ガイド](./user-guides/index.md)
- **困った時**: 今後FAQ追加予定

### 📊 プロジェクトマネージャー

- **プロジェクト概要**: [要件定義](./requirements/project-overview.md)
- **アーキテクチャ方針**: [アーキテクチャ概要](./architecture/index.md)

## 技術スタック概要

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **開発環境**: Node.js 18+, Yarn
- **品質保証**: ESLint, Prettier, Jest
- **インフラ**: [環境に応じて記載]

## ドキュメント管理方針

### 更新ルール

- **アーキテクチャガイド**: 設計方針変更時に更新（定期的にレビュー）
- **実装ガイドライン**: 実装パターン変更時に更新
- **要件定義**: 機能変更・追加時に更新
- **アーカイブ**: 古いドキュメントは削除せずアーカイブへ移動

### 品質保証

- ドキュメント更新時はPull Requestでレビュー
- 重要な設計判断はガイドラインに記録
- 定期的なドキュメント整理・更新

### 命名規則

- **ガイドライン**: `{topic}-guide.md` (例: `clean-architecture-guide.md`)
- **一般ドキュメント**: `descriptive-name.md`

## よく使用するドキュメントリンク

### 重要なドキュメント

- [アーキテクチャ概要](./architecture/index.md)
- [Clean Architecture実装ガイド](./architecture/guidelines/clean-architecture-guide.md)
- [DDD導入ガイド](./architecture/guidelines/ddd-guide.md)

### 開発者向けガイド

- [開発ガイド](./development/index.md)
- [コーディング規約](./architecture/guidelines/coding-conventions.md)

### トラブルシューティング

- [アーキテクチャガイド](./architecture/index.md)
- 利用者向けFAQ: 今後追加予定

## 貢献方法

ドキュメントの改善にご協力いただける場合：

1. GitHub Issuesでドキュメントの問題を報告
2. Pull Requestでドキュメントの修正・追加を提案
3. 開発チームのレビューを経て反映

## メンテナンス

### 定期レビュー

- **月次**: ドキュメントの整合性確認
- **四半期**: 古いドキュメントのアーカイブ
- **随時**: 新機能追加時のドキュメント更新

### 問い合わせ

ドキュメントに関する質問は、開発チームまでご連絡ください。

---

**文書情報**

- **作成日**: 2025年9月
- **最終更新**: 2025年9月
- **管理者**: Polister 開発チーム
- **版数**: v1.0
