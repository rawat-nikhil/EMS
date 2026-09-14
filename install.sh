#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Installing backend dependencies..."
(cd "$ROOT/backend" && npm install)

echo "Installing frontend dependencies..."
(cd "$ROOT/frontend" && npm install)

echo "Dependencies installed."
