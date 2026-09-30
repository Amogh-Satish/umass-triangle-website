#!/usr/bin/env bash
# Creates a PRIVATE GitHub repo for this project and pushes to it.
# Usage: scripts/setup-github.sh [repo-name]
set -euo pipefail
cd "$(dirname "$0")/.."
NAME="${1:-umass-triangle-website}"

if ! gh auth status >/dev/null 2>&1; then
  echo "Not signed in to GitHub. Run:  gh auth login   then re-run this script."
  exit 1
fi
if git remote get-url origin >/dev/null 2>&1; then
  echo "Already connected: $(git remote get-url origin)"
  git push -u origin HEAD
  exit 0
fi

gh repo create "$NAME" --private --source=. --remote=origin --push \
  --description "Website for the Triangle Fraternity chapter at UMass"
echo "Done. Repo: $(gh repo view --json url -q .url)"
