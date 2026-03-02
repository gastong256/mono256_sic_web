#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Template Initialization Script
# Replaces placeholder values and removes the sentinel file.
# Idempotent: safe to run multiple times.
# CI mode: reads values from environment variables.
# ─────────────────────────────────────────────────────────────

set -euo pipefail

SENTINEL=".template-sentinel"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

# ── Guard: already initialized ──────────────────────────────
if [ ! -f "$SENTINEL" ]; then
  echo "✓ Template already initialized. Nothing to do."
  exit 0
fi

echo "Initializing template..."

# ── Collect values ───────────────────────────────────────────
if [ "${CI:-false}" = "true" ]; then
  # Non-interactive: read from environment variables
  PROJECT_NAME="${TEMPLATE_PROJECT_NAME:-My App}"
  PROJECT_SLUG="${TEMPLATE_PROJECT_SLUG:-my-app}"
  OWNER="${TEMPLATE_OWNER:-owner}"
  DESCRIPTION="${TEMPLATE_DESCRIPTION:-A React application}"
  API_BASE_URL="${TEMPLATE_API_BASE_URL:-http://localhost:8000/api}"
  SENTRY_DSN="${TEMPLATE_SENTRY_DSN:-}"
else
  # Interactive mode
  read -rp "  Project name        [My App]:              " PROJECT_NAME
  PROJECT_NAME="${PROJECT_NAME:-My App}"

  # Auto-generate slug from name: lowercase, spaces → hyphens, remove specials
  DEFAULT_SLUG="$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')"
  read -rp "  Project slug        [${DEFAULT_SLUG}]: " PROJECT_SLUG
  PROJECT_SLUG="${PROJECT_SLUG:-$DEFAULT_SLUG}"

  read -rp "  GitHub owner/org    [owner]:              " OWNER
  OWNER="${OWNER:-owner}"

  read -rp "  Description         [A React application]:" DESCRIPTION
  DESCRIPTION="${DESCRIPTION:-A React application}"

  read -rp "  API base URL        [http://localhost:8000/api]: " API_BASE_URL
  API_BASE_URL="${API_BASE_URL:-http://localhost:8000/api}"

  read -rp "  Sentry DSN          [leave blank to skip]: " SENTRY_DSN
  SENTRY_DSN="${SENTRY_DSN:-}"
fi

echo ""
echo "  PROJECT_NAME  = $PROJECT_NAME"
echo "  PROJECT_SLUG  = $PROJECT_SLUG"
echo "  OWNER         = $OWNER"
echo "  DESCRIPTION   = $DESCRIPTION"
echo "  API_BASE_URL  = $API_BASE_URL"
echo ""

# ── File patterns to process ──────────────────────────────────
FILE_PATTERNS=(
  "*.ts" "*.tsx" "*.js" "*.cjs" "*.mjs"
  "*.json" "*.md" "*.sh" "*.yml" "*.yaml"
  "*.html" "*.css" ".env*"
)

# Build the find expression
FIND_ARGS=()
for i in "${!FILE_PATTERNS[@]}"; do
  if [ $i -gt 0 ]; then
    FIND_ARGS+=("-o")
  fi
  FIND_ARGS+=("-name" "${FILE_PATTERNS[$i]}")
done

# ── Replace placeholders ──────────────────────────────────────
# Using perl for cross-platform compatibility (macOS + Linux)
while IFS= read -r -d '' file; do
  perl -pi \
    -e "s|__PROJECT_NAME__|${PROJECT_NAME}|g" \
    -e "s|__PROJECT_SLUG__|${PROJECT_SLUG}|g" \
    -e "s|__OWNER__|${OWNER}|g" \
    -e "s|__DESCRIPTION__|${DESCRIPTION}|g" \
    -e "s|__API_BASE_URL__|${API_BASE_URL}|g" \
    -e "s|__SENTRY_DSN__|${SENTRY_DSN}|g" \
    "$file" 2>/dev/null || true
done < <(find . \
  -type f \
  \( "${FIND_ARGS[@]}" \) \
  ! -path "./node_modules/*" \
  ! -path "./.git/*" \
  ! -path "./dist/*" \
  ! -path "./coverage/*" \
  ! -path "./playwright-report/*" \
  ! -path "./${SENTINEL}" \
  -print0)

# ── Create .env from .env.example if missing ──────────────────
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
  echo "  Created .env from .env.example"
fi

# ── Remove sentinel ───────────────────────────────────────────
rm -f "$SENTINEL"

echo ""
echo "✓ Template initialized successfully as '${PROJECT_NAME}'!"
echo ""
echo "Next steps:"
echo "  pnpm install"
echo "  pnpm dev"
