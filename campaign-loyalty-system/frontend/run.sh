#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

if [ ! -d "node_modules" ]; then
  echo "Frontend dependencies are missing."
  echo "Run: npm install"
  exit 1
fi

export VITE_DEV_HOST="${VITE_DEV_HOST:-0.0.0.0}"
export VITE_DEV_PORT="${VITE_DEV_PORT:-5173}"

echo "Starting frontend on http://localhost:${VITE_DEV_PORT}"
if [ -n "${VITE_PUBLIC_APP_URL:-}" ]; then
  echo "Public app URL: ${VITE_PUBLIC_APP_URL}"
fi
if [ -n "${VITE_API_BASE_URL:-}" ]; then
  echo "API base URL: ${VITE_API_BASE_URL}"
else
  echo "API base URL: /api via Vite proxy"
fi

npm run dev
