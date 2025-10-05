#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH=${BASE_BRANCH:-main}
HEAD_BRANCH=${HEAD_BRANCH:-develop}
RELEASE_LABEL=${RELEASE_LABEL:-release}

command -v gh >/dev/null 2>&1 || {
  echo "gh CLI が見つかりません。https://cli.github.com/ からインストールしてください" >&2
  exit 1
}

command -v jq >/dev/null 2>&1 || {
  echo "jq が見つかりません。インストールしてから再実行してください" >&2
  exit 1
}

command -v python3 >/dev/null 2>&1 || {
  echo "python3 が見つかりません。インストールしてから再実行してください" >&2
  exit 1
}

if ! gh auth status >/dev/null 2>&1; then
  echo "gh auth login を実行してGitHubに認証してください" >&2
  exit 1
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)

existing_pr=$(gh pr list --state open --base "$BASE_BRANCH" --head "$HEAD_BRANCH" --json number --jq '.[].number' 2>/dev/null || true)
if [[ -n "${existing_pr:-}" ]]; then
  echo "既に #$existing_pr のリリースPRが開かれています。" >&2
  exit 0
fi

compare_json=$(gh api "repos/$REPO/compare/$BASE_BRANCH...$HEAD_BRANCH")

ahead_by=$(echo "$compare_json" | jq -r '.ahead_by')
if [[ "$ahead_by" == "0" ]]; then
  echo "main ブランチに対して新しいコミットはありません。" >&2
  exit 0
fi

commit_messages=$(echo "$compare_json" | jq -r '.commits[]?.commit?.message // empty')
pr_numbers=$(echo "$commit_messages" | sed -n 's/.*#\([0-9]\+\).*/\1/p' | sort -u)

if [[ -z "${pr_numbers:-}" ]]; then
  echo "差分コミットから関連PRを特定できませんでした。" >&2
  exit 1
fi

collect_checklist() {
  local pr_number="$1"
  local pr_json
  pr_json=$(gh pr view "$pr_number" --json number,title,author,mergedAt --jq '{number,title,author: .author.login, mergedAt}')
  local title
  local author
  local merged_at
  title=$(echo "$pr_json" | jq -r '.title')
  author=$(echo "$pr_json" | jq -r '.author // empty')
  if [[ -z "$author" || "$author" == "null" ]]; then
    author="unknown"
  fi
  merged_at=$(echo "$pr_json" | jq -r '.mergedAt // empty')
  local merged_text
  if [[ -n "$merged_at" ]]; then
    merged_text=$(python3 - "$merged_at" <<'PY'
import sys
from datetime import datetime
value = sys.argv[1].strip() if len(sys.argv) > 1 else ""
if not value:
    print("N/A")
    sys.exit(0)
value = value.replace('Z', '+00:00')
dt = datetime.fromisoformat(value)
local_dt = dt.astimezone()
print(local_dt.strftime('%Y-%m-%d %H:%M'))
PY
)
  else
    merged_text="N/A"
  fi
  printf '%s' "- [ ] #$pr_number $title (@$author)\n  - マージ日時: $merged_text"
}

declare -a checklist_entries=()
while IFS= read -r pr_number; do
  checklist_entries+=("$(collect_checklist "$pr_number")")
done <<< "$pr_numbers"

checklist=""
for entry in "${checklist_entries[@]}"; do
  checklist+="$entry"$'\n\n'
done

release_title_date=$(date +%F)
release_body_datetime=$(python3 - <<'PY'
from datetime import datetime
print(datetime.now().astimezone().strftime('%Y年%m月%d日 %H:%M:%S %Z'))
PY
)

body=$(cat <<EOF_BODY
リリース準備（$release_title_date）

このPRは、developブランチからmainブランチへのリリースを行うためのものです。

## リリース日時

$release_body_datetime

## マージ対象のPull Request一覧

$checklist
## リリース前チェックリスト

- [ ] すべてのCIチェックが通過していることを確認
- [ ] 各PRの変更内容を確認
- [ ] ドキュメントの更新が必要な場合は対応済みであることを確認
- [ ] 本番環境への影響を考慮し、必要に応じて関係者に通知

## 注意事項

このPRをマージすると、main（本番）ブランチに変更が反映されます。
慎重にレビューしてからマージしてください。

---

🤖 このPRはローカルスクリプトで生成されました。
EOF_BODY
)

release_title="リリース準備（$release_title_date）"

tmp_body=$(mktemp)
trap 'rm -f "$tmp_body"' EXIT
printf '%s' "$body" >"$tmp_body"

gh label create "$RELEASE_LABEL" --description "Automated release PR" --color "0466C8" --force >/dev/null 2>&1 || true

gh pr create \
  --base "$BASE_BRANCH" \
  --head "$HEAD_BRANCH" \
  --title "$release_title" \
  --body-file "$tmp_body" \
  --label "$RELEASE_LABEL"
