#!/usr/bin/env bash
# One-time setup for the headshot cropper. Creates a local venv and installs
# OpenCV into it. The face model (yunet.onnx) is committed alongside.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m venv tools/.venv
tools/.venv/bin/pip install --quiet --disable-pip-version-check opencv-python-headless
echo "ready. now run:  tools/add-headshots.sh <folder-of-photos>"
