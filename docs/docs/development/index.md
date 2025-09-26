# 開発ドキュメント

## 概要

このディレクトリには、Polisterプロジェクトの開発に関する実践的なドキュメントが含まれています。

## 対象読者

- 開発チームメンバー
- コントリビューター
- 技術レビュワー

## 関連ドキュメント

- [アーキテクチャガイド](../architecture/index.md)

## 開発チーム向けクイックリンク

### 新規開発者向け

1. [プロジェクト概要](../requirements/project-overview.md)
2. [アーキテクチャガイド](../architecture/index.md)

## 開発ツール

### 推奨エディタ設定

- **VS Code**: 推奨設定とエクステンション
- **WebStorm**: プロジェクト設定

### 必須ツール

- Node.js 18+
- Yarn (パッケージマネージャー)
- Git
- Docker (ローカル環境)

### 開発支援ツール

- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Jest, React Testing Library
- **E2E Testing**: Playwright

## トラブルシューティング

### よくある開発時の問題

1. **依存関係の問題**
   - `yarn install` の実行
   - `node_modules` の削除と再インストール

2. **型エラー**
   - TypeScript設定の確認
   - 型定義ファイルの更新

3. **ビルドエラー**
   - 環境変数の設定確認
   - キャッシュのクリア

### サポート

開発に関する質問は以下で受け付けています：

- **Slack**: #dev-support チャンネル
- **GitHub Issues**: 技術的な問題報告
- **Tech Lead**: 設計・アーキテクチャ相談

---

最終更新: 2025年9月
