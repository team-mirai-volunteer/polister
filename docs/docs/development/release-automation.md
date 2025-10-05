# リリースPR作成手順

## 概要

`develop` ブランチでマージされた変更を `main` ブランチへまとめて取り込むためのリリースPRは、GitHub Actions ではなくローカルスクリプトで生成します。CIでの権限制約により、自動PR作成ワークフローは廃止しました。

## 事前準備

- GitHub CLI (`gh`) をインストールし、`gh auth login` で対象リポジトリに認証済みであること。
- `jq` と `python3` が利用できる環境。
- ローカルの `develop` / `main` が最新状態であること。

## 使用ファイル

- `scripts/create-release-pr.sh`: リリースPRを生成するメインスクリプト。

## 実行方法

リポジトリのルートで次を実行します。

```bash
./scripts/create-release-pr.sh
```

### スクリプトの挙動

1. 既に `HEAD_BRANCH` → `BASE_BRANCH` のリリースPRが開いているか確認。
2. `develop` と `main` の差分コミットから `#番号` 形式のPR番号を抽出。
3. 各PRのタイトル・作成者・マージ日時を取得し、チェックリストを生成。
4. `release` ラベルを作成（存在しない場合）し、PR本文を整形した上で `gh pr create` を実行。

### オプション

環境変数で対象ブランチやラベル名を変更できます。

```bash
BASE_BRANCH=production \
HEAD_BRANCH=release \
RELEASE_LABEL=my-release \
./scripts/create-release-pr.sh
```

差分が無い場合や関連PR番号が抽出できない場合は処理を中断し、理由をメッセージ表示します。

## トラブルシューティング

- `gh CLI が見つかりません` と表示された場合は GitHub CLI をインストールしてください。
- `gh auth login` が求められたら GitHub への認証を実施してください。
- `差分コミットから関連PRを特定できませんでした` と表示された場合は、マージコミットメッセージに `#番号` が含まれているか確認してください。

## 参考リンク

- [GitHub CLI ドキュメント](https://cli.github.com/manual/)
- [jq ドキュメント](https://stedolan.github.io/jq/manual/)

---

最終更新: 2025年
