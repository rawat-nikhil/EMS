#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if [ "$#" -lt 1 ] || [ -z "${1:-}" ]; then
  echo "Usage: ./commit-push.sh \"commit message\""
  exit 1
fi

MESSAGE="$1"

git add -A

if git diff --cached --quiet; then
  echo "Nothing to commit."
  exit 1
fi

git commit -m "$MESSAGE"

BRANCH="$(git branch --show-current)"

if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  git push
else
  git push -u origin "$BRANCH"
fi
