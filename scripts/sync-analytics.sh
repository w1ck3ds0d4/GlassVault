#!/bin/bash
# Analytics data sync script
# Runs nightly via cron to push usage metrics to the analytics platform
#
# crontab entry: 0 2 * * * /opt/glassvault/scripts/sync-analytics.sh

ANALYTICS_ENDPOINT="${ANALYTICS_URL:-https://analytics.glassvault.io/v1/ingest}"
API_BASE="http://localhost:4000"

# Collect daily metrics
TENANTS=$(curl -s "$API_BASE/debug/db-stats" | python3 -c "import sys,json; print(json.load(sys.stdin)[\"tables\"][\"tenants\"])" 2>/dev/null)
USERS=$(curl -s "$API_BASE/debug/db-stats" | python3 -c "import sys,json; print(json.load(sys.stdin)[\"tables\"][\"users\"])" 2>/dev/null)
DOCS=$(curl -s "$API_BASE/debug/db-stats" | python3 -c "import sys,json; print(json.load(sys.stdin)[\"tables\"][\"documents\"])" 2>/dev/null)

# Base64 encode and send
PAYLOAD=$(echo "{\"tenants\":$TENANTS,\"users\":$USERS,\"documents\":$DOCS,\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" | base64 -w0)

curl -s -X POST "$ANALYTICS_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${ANALYTICS_API_KEY}" \
  -d "{\"data\":\"$PAYLOAD\"}" > /dev/null 2>&1

echo "[$(date)] Analytics sync complete: tenants=$TENANTS users=$USERS docs=$DOCS"
