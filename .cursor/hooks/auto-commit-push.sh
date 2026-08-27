#!/usr/bin/env bash
# Auto-commit and push remaining changes when the agent stops (deploy path).
set -euo pipefail

# Consume hook stdin (JSON) so the pipe does not block.
cat >/dev/null || true

cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo '{}'
  exit 0
fi

# Nothing to do
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  echo '{}'
  exit 0
fi

git add -A

# Drop secrets / local DB if staged by mistake
git reset HEAD -- .env .env.* '*.sqlite' '*.sqlite-journal' 2>/dev/null || true

if git diff --cached --quiet; then
  echo '{}'
  exit 0
fi

msg="chore: auto-commit for deploy ($(date '+%Y-%m-%d %H:%M'))"
git commit -m "$msg" >/dev/null 2>&1 || {
  echo '{}'
  exit 0
}

if git remote get-url origin >/dev/null 2>&1; then
  git push origin HEAD >/dev/null 2>&1 || true
fi

echo '{}'
exit 0
