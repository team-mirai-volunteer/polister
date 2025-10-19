#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH=${BASE_BRANCH:-main}
HEAD_BRANCH=${HEAD_BRANCH:-develop}
RELEASE_LABEL=${RELEASE_LABEL:-release}
DRY_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --base)
      BASE_BRANCH="$2"
      shift 2
      ;;
    --head)
      HEAD_BRANCH="$2"
      shift 2
      ;;
    *)
      echo "Usage: $0 [--dry-run] [--base main] [--head develop]" >&2
      exit 1
      ;;
  esac
done

command -v gh >/dev/null 2>&1 || {
  echo "gh CLI が見つかりません。https://cli.github.com/ からインストールしてください" >&2
  exit 1
}

command -v jq >/dev/null 2>&1 || {
  echo "jq が見つかりません。インストールしてから再実行してください" >&2
  exit 1
}

if ! gh auth status >/dev/null 2>&1; then
  echo "gh auth login を実行してGitHubに認証してください" >&2
  exit 1
fi

git fetch origin "$BASE_BRANCH" "$HEAD_BRANCH" >/dev/null

last_main_merge=$(git log origin/${BASE_BRANCH} --merges -1 --pretty=format:'%cd' --date=iso8601)
if [[ -z "$last_main_merge" ]]; then
  echo "${BASE_BRANCH} にマージコミットが見つかりませんでした。" >&2
  exit 1
fi

echo "最終 ${BASE_BRANCH} マージ日時: $last_main_merge" >&2

pr_numbers=$(git log origin/${HEAD_BRANCH} --merges --since="$last_main_merge" --pretty=format:'%s' \
  | sed -n 's/.*#\([0-9][0-9]*\).*/\1/p' | sort -u)

if [[ -z "${pr_numbers:-}" ]]; then
  echo "${last_main_merge} 以降に ${HEAD_BRANCH} へマージされたPRはありません。" >&2
  exit 0
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

checklist=""
for pr in $pr_numbers; do
  pr_json=$(gh pr view "$pr" --repo "$REPO" --json number,title,author,mergedAt \
              --jq '{number,title,author: .author.login, mergedAt}')
  if [[ -z "$pr_json" ]]; then
    checklist+=$'- [ ] #'"$pr"$' (情報取得に失敗)\n  - マージ日時: N/A\n\n'
    continue
  fi
  title=$(echo "$pr_json" | jq -r '.title')
  author=$(echo "$pr_json" | jq -r '.author // "unknown"')
  merged_at=$(echo "$pr_json" | jq -r '.mergedAt // empty')
  if [[ -n "$merged_at" && "$merged_at" != "null" ]]; then
    merged_text=$(date -d "$merged_at" '+%Y-%m-%d %H:%M %Z' 2>/dev/null || echo "$merged_at")
  else
    merged_text="N/A"
  fi
  checklist+=$'- [ ] #'"$pr"" $title (@$author)
  - マージ日時: $merged_text

"
done

release_title_date=$(date +%F)
release_title="リリース準備（${release_title_date}）"
release_body_datetime=$(date '+%Y年%m月%d日 %H:%M:%S %Z')

tmp_body=$(mktemp)
trap 'rm -f "$tmp_body"' EXIT

cat <<EOF_BODY >"$tmp_body"
リリース準備（${release_title_date}）

このPRは、${HEAD_BRANCH} ブランチから ${BASE_BRANCH} ブランチへのリリースを行うためのものです。

## リリース日時

${release_body_datetime}

## マージ対象のPull Request一覧

$checklist
## リリース前チェックリスト

- [ ] すべてのCIチェックが通過していることを確認
- [ ] 各PRの変更内容を確認
- [ ] ドキュメントの更新が必要な場合は対応済みであることを確認
- [ ] 本番環境への影響を考慮し、必要に応じて関係者に通知

---

🤖 このPRはローカルスクリプトで生成されました。
EOF_BODY

if [[ "$DRY_RUN" == true ]]; then
  echo "--dry-run が指定されたためプルリクエストは作成されません。"
  echo
  echo "=== 作成予定のタイトル ==="
  echo "$release_title"
  echo
  echo "=== 作成予定の本文 ==="
  cat "$tmp_body"
  echo
  echo "=== 対象PR一覧 ==="
  for pr in $pr_numbers; do
    printf '#%s\n' "$pr"
  done
  exit 0
fi

gh label create "$RELEASE_LABEL" --description "Automated release PR" --color "0466C8" --force >/dev/null 2>&1 || true

gh pr create \
  --repo "$REPO" \
  --base "$BASE_BRANCH" \
  --head "$HEAD_BRANCH" \
  --title "$release_title" \
  --body-file "$tmp_body" \
  --label "$RELEASE_LABEL"
