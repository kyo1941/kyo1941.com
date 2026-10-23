#!/usr/bin/env bash
# my-page MCP のセットアップ（このスクリプトは秘匿情報を含まない）。
# 設定値は macOS Keychain に保存し、サーバーが起動時に読み取る。
# 新しい Mac でも `./setup.sh` を実行してプロンプトに答えるだけで再現できる。
set -euo pipefail

SERVICE="my-page-mcp"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== my-page MCP セットアップ ==="

echo "[1/3] 依存インストールとビルド..."
(cd "$DIR" && npm install --silent && npm run --silent build)

echo "[2/3] 設定値を Keychain に保存..."
KEYS=(BACKEND_URL FRONTEND_URL ADMIN_USERNAME ADMIN_PASSWORD)
PROMPTS=("バックエンド URL（読み取り/ログイン先）" "フロントエンド URL（変更系の経路 & Origin）" "管理者ユーザー名" "管理者パスワード")
DEFAULTS=("http://localhost:8080" "http://localhost:3000" "" "")
SECRETS=("" "" "" "secret")

is_stored() { security find-generic-password -s "$SERVICE" -a "$1" >/dev/null 2>&1; }
stored_value() { security find-generic-password -s "$SERVICE" -a "$1" -w 2>/dev/null; }

# $1=Keychainの項目名 $2=プロンプト $3=既定値 $4=secret(指定時は非表示入力)
store() {
  local key="$1" prompt="$2" default="${3:-}" secret="${4:-}" val
  if [ -n "$secret" ]; then
    read -r -s -p "  $prompt: " val; echo
  elif [ -n "$default" ]; then
    read -r -p "  $prompt [$default]: " val; val="${val:-$default}"
  else
    read -r -p "  $prompt: " val
  fi
  security add-generic-password -U -s "$SERVICE" -a "$key" -w "$val"
  echo "    ✓ $key を保存"
}

targets=" "
has_stored=""
for i in "${!KEYS[@]}"; do
  if is_stored "${KEYS[$i]}"; then
    has_stored=1
  else
    targets="$targets$i "
  fi
done

if [ -n "$has_stored" ]; then
  echo "  保存済みの項目:"
  for i in "${!KEYS[@]}"; do
    is_stored "${KEYS[$i]}" || continue
    if [ -n "${SECRETS[$i]}" ]; then
      shown="（非表示）"
    else
      shown="$(stored_value "${KEYS[$i]}")"
    fi
    echo "    $((i + 1))) ${KEYS[$i]} = $shown"
  done
  read -r -p "  変更する項目の番号（スペース区切り。変更しないなら空のまま Enter）: " answer
  for n in $answer; do
    case "$n" in
      *[!0-9]*) echo "    ✗ 番号で指定してください: $n" >&2; exit 1 ;;
    esac
    i=$((n - 1))
    if [ "$i" -lt 0 ] || [ "$i" -ge "${#KEYS[@]}" ] || ! is_stored "${KEYS[$i]}"; then
      echo "    ✗ 一覧にない番号です: $n" >&2
      exit 1
    fi
    targets="$targets$i "
  done
fi

if [ "$targets" = " " ]; then
  echo "    変更なし"
fi
for i in "${!KEYS[@]}"; do
  case "$targets" in *" $i "*) ;; *) continue ;; esac
  default="${DEFAULTS[$i]}"
  if [ -z "${SECRETS[$i]}" ] && is_stored "${KEYS[$i]}"; then
    default="$(stored_value "${KEYS[$i]}")"
  fi
  store "${KEYS[$i]}" "${PROMPTS[$i]}" "$default" "${SECRETS[$i]}"
done

echo "[3/3] Claude Code に user スコープで登録..."
if claude mcp list 2>/dev/null | grep -q '^my-page-blog:'; then
  echo "    ✓ 既に登録済み"
else
  claude mcp add my-page-blog -s user -- \
    sh -c "cd \"$DIR\" && [ -f dist/index.js ] || npm run --silent build 1>&2; exec node dist/index.js"
  echo "    ✓ 登録完了"
fi

echo "=== 完了。新しい claude セッションから利用できます ==="
echo "（値を変更したいときは ./setup.sh を再実行するか、Keychain Access.app で"
echo "  サービス名 '$SERVICE' の項目を編集してください）"
