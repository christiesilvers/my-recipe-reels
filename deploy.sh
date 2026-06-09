#!/usr/bin/env bash
set -euo pipefail

INFRA_DIR="$(dirname "$0")/infra"

echo "▶ Building site…"
npm run build

BUCKET=$(cd "$INFRA_DIR" && tofu output -raw bucket_name)
SITE_URL=$(cd "$INFRA_DIR" && tofu output -raw site_url)

echo "▶ Syncing to s3://$BUCKET …"
aws s3 sync dist/ "s3://$BUCKET" \
  --delete \
  --profile dream-reel

echo "✅  Live at $SITE_URL"
