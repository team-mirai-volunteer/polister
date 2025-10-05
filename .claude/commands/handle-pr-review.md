---
allowed-tools: Bash(gh api:*), Bash(gh pr:*), Bash(jq:*), Bash(yarn:*), TodoWrite, Read, Edit, MultiEdit
argument-hint: [PR番号]
description: PolisterのCodeRabbitレビュー対応（全コメント取得・優先度順対応・返信投稿）
---

# Polister CodeRabbit PR レビュー対応

PR #$1 に対する Polister プロジェクトの CodeRabbit レビューコメントへ対応するための手順です。

## タスク概要

1. CodeRabbitコメントの全件取得
2. 優先度順にToDo整理・修正対応
3. 必要なチェックとテストの実行
4. コミット・プッシュ
5. コメントへの日本語返信

## 手順1: レビューコメントの全件取得

**重要**: 必ず `--paginate` オプションを付与して全件取得してください（デフォルトは30件のみ）。

```bash
# GitHubログイン名を取得（必要に応じて環境変数へ保存）
GH_USER=$(gh api user --jq '.login')

# コメント総数の確認
gh api --paginate repos/team-mirai-volunteer/polister/pulls/$1/comments | jq -s 'add | length'

# 未返信の CodeRabbit コメント一覧
gh api --paginate repos/team-mirai-volunteer/polister/pulls/$1/comments | \
  jq --arg user "$GH_USER" -sr 'add |
    [.[] | select(.user.login == "coderabbitai[bot]" and (.body | startswith("@" + $user) | not))] as $all |
    [.[] | select(.user.login == $user and .in_reply_to_id)] | map(.in_reply_to_id) as $replied |
    $all | map(select([.id] | inside($replied) | not)) |
    .[] | "ID: \(.id) | File: \(.path // "(no file)"):\(.line // .start_line // "-") | Severity: " + (.body | split("\n")[0])'
```

結果を確認し、未対応のコメントを把握してください。

## 手順2: 優先度順に対応

CodeRabbitの重要度に基づき、以下の順序で対応します。

1. 🔴 **Critical**
2. 🟠 **Major**
3. 🟡 **Minor**
4. 🔵 **Trivial / Nitpick**

### 対応フロー

1. **TodoWriteで管理**: 未返信コメントをToDoに登録
2. **原因調査・修正方針決定**: コメント内容から修正方針を整理
3. **実装**: 対応コードの修正
4. **テスト・チェック**: 下記「手順3」を実行
5. **コミット・プッシュ**: 日本語のコミットメッセージで記録
6. **返信投稿**: コメントへ日本語で返答

## 手順3: 必須チェック・テスト

Polisterでは以下を基本チェックとします。該当箇所のみ追加でテストを実行してください。

```bash
# 必須チェック
yarn format:check

# 変更内容に応じて必要なものを追加実行
# yarn lint
# yarn typecheck
# yarn validate        # lint + typecheck + format:check
# yarn test            # 単体テストが必要な場合
# yarn docs:build      # ドキュメントのみ変更でビルド確認が必要な場合
```

テストを省略した場合は、理由をコメント返信に明記してください。

## 手順4: コミット・プッシュ

- コミットメッセージは日本語で `タイプ: 説明` 形式
- 例: `fix: 検証ロジックの境界値を修正`
- 必要なコミットをまとめたら `git push`

## 手順5: コメントへの返信

修正が完了したら、各コメントへ日本語で返信します。返信には修正内容とテスト結果（または未実施理由）を記載してください。

### 1行返信例

GitHub の review comment への返信は `POST /repos/:owner/:repo/pulls/comments/:id/replies` を JSON で呼び出します。`--input` とヒアドキュメントを使うと日本語や改行を安全に扱えます。

```bash
gh api repos/team-mirai-volunteer/polister/pulls/comments/<コメントID>/replies \
  --method POST --input - <<'EOF'
{
  "body": "ご指摘ありがとうございます。該当箇所を修正し、yarn format:check を実行しました。対応コミット: abc1234"
}
EOF
```

### 詳細返信例

```bash
gh api repos/team-mirai-volunteer/polister/pulls/comments/<コメントID>/replies \
  --method POST --input - <<'EOF'
{
  "body": "ご指摘ありがとうございます。以下の内容で対応しました。\n\n- 掲示板集約の検証ロジックを修正\n- DDD導入ガイドの記述を更新\n\nyarn validate を実行し、lint / typecheck / format:check が通過しています。\n対応コミット: abc1234"
}
EOF
```

### Issue化する場合

対応を後回しにする場合は Issue を作成し、URL と意図を明記してください。

```bash
gh api repos/team-mirai-volunteer/polister/pulls/comments/<コメントID>/replies \
  --method POST --input - <<'EOF'
{
  "body": "ご指摘ありがとうございます。対応には追加調査が必要なため Issue #XX を作成しました。https://github.com/team-mirai-volunteer/polister/issues/XX"
}
EOF
```

## 対応パターン

- **即時修正**: コード修正 → チェック → コミット → 返信
- **Issue化**: 調査や別スプリント対応が妥当な場合はIssue作成 → 返信
- **設計意図の説明**: 変更不要と判断した場合は意図と根拠を明記して返信

## 完了条件

1. 未返信の CodeRabbit コメントが 0 件であること（設計意図の説明や Issue 化の返信も含む）
2. 必要なテスト結果が共有されていること
3. PR が最新の状態（コンフリクトなし、CI成功）

これらを満たしたらレビュー対応完了です。
