#!/usr/bin/env bash
# Rewrites the absolute site URL used by canonical tags, Open Graph, JSON-LD,
# robots.txt and sitemap.xml. Run this after moving to a custom domain.
#
#   tools/set-base-url.sh https://umasstriangle.org
#
# Everything else on the site uses relative paths and needs no change.
set -euo pipefail

NEW="${1:-}"
[ -n "$NEW" ] || { echo "usage: $0 https://your-domain.org" >&2; exit 1; }
NEW="${NEW%/}"

OLD=$(grep -o 'https://[^"]*' public/robots.txt | head -1 | sed 's|/sitemap.xml$||')
[ -n "$OLD" ] || { echo "could not detect current base URL" >&2; exit 1; }

echo "  $OLD"
echo "→ $NEW"

grep -rl "$OLD" public | while read -r f; do
  perl -pi -e "s|\Q$OLD\E|$NEW|g" "$f"
done

echo "done. Review with: git diff"
