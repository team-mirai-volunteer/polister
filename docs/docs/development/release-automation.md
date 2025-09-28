# リリースPR自動化

## 概要

developブランチからmainブランチへのリリースPull Requestを自動生成する機能です。

## 動作仕様

### トリガー

developブランチへのpushがトリガーとなり、GitHub Actionsが自動実行されます。

### 自動生成されるPRの内容

リリースPRには以下の情報が自動的に含まれます：

- リリース日時
- マージ対象のPull Request一覧（チェックリスト形式）
- 各PRのマージ日時と作成者
- リリース前のチェックリスト
- 注意事項

### ラベル

自動生成されたリリースPRには`release`ラベルが自動的に付与されます。

## 使用技術

- **git-pr-release**: リリースPR自動生成ツール
- **GitHub Actions**: CI/CDパイプライン
- **ERB**: PRテンプレートエンジン

## 関連ファイル

### ワークフロー定義

- `.github/workflows/create-release-pull-request.yaml`: GitHub Actionsワークフロー

### PRテンプレート

- `.github/git-pr-release.erb`: リリースPRのテンプレート

## ワークフローの詳細

```yaml
name: Create Release Pull Request

on:
  push:
    branches:
      - develop

jobs:
  create-release-pr:
    name: Create Release PR
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
```

### 実行ステップ

1. **Checkout**: リポジトリをチェックアウト（全履歴を取得）
2. **Setup Ruby**: Ruby 3.2環境をセットアップ
3. **Install git-pr-release**: git-pr-releaseツールをインストール
4. **Create Release Pull Request**: リリースPRを自動生成

### 環境変数

| 環境変数                           | 説明                     | 値                            |
| ---------------------------------- | ------------------------ | ----------------------------- |
| `GIT_PR_RELEASE_TOKEN`             | GitHub認証トークン       | `${{ secrets.GITHUB_TOKEN }}` |
| `GIT_PR_RELEASE_BRANCH_PRODUCTION` | 本番ブランチ             | `main`                        |
| `GIT_PR_RELEASE_BRANCH_STAGING`    | ステージングブランチ     | `develop`                     |
| `GIT_PR_RELEASE_TEMPLATE`          | テンプレートファイルパス | `.github/git-pr-release.erb`  |
| `GIT_PR_RELEASE_LABELS`            | 付与するラベル           | `release`                     |

補足: ラベルはワークフロー内で自動作成されます。手動で作成する場合は、リポジトリのラベル設定で事前に作成してください。

## テンプレートのカスタマイズ

`.github/git-pr-release.erb`を編集することで、リリースPRの内容をカスタマイズできます。

### 注意点

- **テンプレートの先頭行はPRタイトルとして使用されます。**2行目以降が本文になります。
- 先頭行にMarkdown見出し記号（`#`）を使用すると、PRタイトルに記号が混入しますので注意してください。

### 利用可能な変数

- `pull_requests`: マージ対象のPR配列
  - `pr.number`: PR番号
  - `pr.title`: PRタイトル
  - `pr.user.login`: PR作成者のGitHubユーザー名
  - `pr.merged_at`: マージ日時
- `Time.now`: 現在日時

### テンプレート例

```erb
# リリース準備

このPRは、developブランチからmainブランチへのリリースを行うためのものです。

## リリース日時

<%= Time.now.strftime('%Y年%m月%d日 %H:%M:%S') %>

## マージ対象のPull Request一覧

<% pull_requests.each do |pr| %>
- [ ] #<%= pr.number %> <%= pr.title %> (@<%= pr.user.login %>)
  - マージ日時: <%= pr.merged_at.strftime('%Y-%m-%d %H:%M') %>
<% end %>
```

## 運用フロー

1. **feature/#N_xxxブランチで開発**
   - 機能開発を行う

2. **developブランチへPR作成**
   - developブランチへのPRを作成
   - CIチェック（ESLint、TypeScript、Prettier）が自動実行

3. **PRレビュー＆マージ**
   - レビュー後、developブランチへマージ

4. **リリースPR自動生成**
   - developへのマージをトリガーに、mainへのリリースPRが自動生成
   - `release`ラベルが付与される

5. **リリースPRのレビュー**
   - 自動生成されたリリースPRの内容を確認
   - チェックリストを確認

6. **本番リリース**
   - リリースPRをmainブランチへマージ
   - 本番環境への変更が反映

## トラブルシューティング

### リリースPRが生成されない場合

1. **GitHub Actionsの実行状態を確認**
   - リポジトリの「Actions」タブで実行ログを確認

2. **権限の確認**
   - `GITHUB_TOKEN`に適切な権限が付与されているか確認
   - `contents: write`と`pull-requests: write`が必要

3. **ブランチの確認**
   - developブランチへの直接pushであることを確認
   - PRマージはpushとしてカウントされる

### リリースPRでCIが起動しない場合

- 既定の`GITHUB_TOKEN`が起点のイベントは別Workflowを起動しません。必要に応じてPersonal Access Tokenの使用や`pull_request_target`の設計を検討してください（セキュリティに配桞）。

### テンプレートエラー

1. **ERB構文の確認**
   - `.github/git-pr-release.erb`の構文エラーをチェック

2. **変数の確認**
   - 利用可能な変数名が正しいか確認

## 参考リンク

- [git-pr-release公式リポジトリ](https://github.com/x-motemen/git-pr-release)
- [GitHub Actions公式ドキュメント](https://docs.github.com/en/actions)

---

最終更新: 2025年9月
