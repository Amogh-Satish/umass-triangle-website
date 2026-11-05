#!/usr/bin/env bash
# Crop every photo in a folder to a square headshot and wire it into the page.
#
#   tools/add-headshots.sh ~/Desktop/headshots
#
# Name each file after the member -- "Harsith Thokala.jpg", "aarav_singh.heic".
# Case, spaces and underscores don't matter. Run tools/setup-headshots.sh first.
set -euo pipefail
cd "$(dirname "$0")/.."
[ $# -ge 1 ] || { echo "usage: $0 <folder-of-photos>" >&2; exit 2; }
[ -x tools/.venv/bin/python ] || { echo "run tools/setup-headshots.sh first" >&2; exit 1; }

tools/.venv/bin/python tools/crop_headshots.py "$1" public/img/eboard 2>&1 | grep -v 'WARN' || true
echo
python3 tools/wire_headshots.py
