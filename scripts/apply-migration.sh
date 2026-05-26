#!/bin/bash
# DB Migration Auto-Apply Script
# Detects new migrations in db/ folder and applies them to Supabase
# Usage: ./scripts/apply-migration.sh
# Environment: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL required

set -e

# Configuration
DB_DIR="$(cd "$(dirname "$0")/../db" && pwd)"
LOG_FILE="$(cd "$(dirname "$0")/.." && pwd)/db-migration-log.json"
SUPABASE_URL="${SUPABASE_URL:-https://pzkvhomhztikhkgwgqzr.supabase.co}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

# Ensure required environment variables
if [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY not set"
  exit 1
fi

# Initialize log file if it doesn't exist
if [ ! -f "$LOG_FILE" ]; then
  echo '{"migrations": [], "applied_count": 0, "failed_count": 0, "last_run": null}' > "$LOG_FILE"
fi

# Function to get file hash
get_file_hash() {
  sha256sum "$1" | awk '{print $1}'
}

# Function to check if migration was already applied
is_migration_applied() {
  local filename=$1
  grep -q "\"filename\": \"$filename\"" "$LOG_FILE" && \
  grep -q "\"status\": \"success\"" "$LOG_FILE" && \
  return 0
  return 1
}

# Function to log migration result
log_migration() {
  local filename=$1
  local status=$2
  local error_msg=$3
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Read current log
  local current=$(cat "$LOG_FILE")

  # Create new entry
  local entry=$(jq -n \
    --arg filename "$filename" \
    --arg status "$status" \
    --arg timestamp "$timestamp" \
    --arg error "$error_msg" \
    '{filename: $filename, status: $status, timestamp: $timestamp, error: $error, hash: ""}')

  # Add hash if successful
  if [ "$status" = "success" ]; then
    entry=$(echo "$entry" | jq --arg hash "$(get_file_hash "$DB_DIR/$filename")" '.hash = $hash')
  fi

  # Append to migrations array
  local updated=$(echo "$current" | jq --argjson new_entry "$entry" '.migrations += [$new_entry]')

  # Update counters
  if [ "$status" = "success" ]; then
    updated=$(echo "$updated" | jq '.applied_count += 1')
  else
    updated=$(echo "$updated" | jq '.failed_count += 1')
  fi

  # Update last_run
  updated=$(echo "$updated" | jq --arg now "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" '.last_run = $now')

  echo "$updated" > "$LOG_FILE"
}

# Function to apply SQL file to Supabase
apply_migration() {
  local filepath=$1
  local filename=$(basename "$filepath")

  if is_migration_applied "$filename"; then
    echo "✅ Already applied: $filename"
    return 0
  fi

  echo "🔄 Applying: $filename"

  # Read SQL content
  local sql_content=$(cat "$filepath")

  # Execute via Supabase REST API using rpc or direct query
  # For safety, we'll use the SQL editor endpoint (if available) or log for manual review

  # Attempt 1: Try using pg_execute if available (admin-level)
  local response=$(curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/pg_execute" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"sql\": $(echo "$sql_content" | jq -Rs .)}" \
    -w "\n%{http_code}" 2>&1)

  local http_status=$(echo "$response" | tail -1)
  local body=$(echo "$response" | sed '$d')

  if [ "$http_status" = "200" ] || [ "$http_status" = "201" ]; then
    echo "✅ SUCCESS: $filename (HTTP $http_status)"
    log_migration "$filename" "success" ""
    return 0
  else
    # For direct SQL, we need to create a special endpoint or use migrations table
    # For now, log as pending-manual
    echo "⚠️  PENDING: $filename requires manual execution or custom endpoint"
    log_migration "$filename" "pending" "Requires custom SQL execution endpoint"
    return 1
  fi
}

# Main execution
echo "🚀 DB Migration Auto-Apply Script"
echo "📍 Database folder: $DB_DIR"
echo "📝 Log file: $LOG_FILE"
echo ""

# Find all SQL files in db/ folder
migration_count=0
success_count=0

for sql_file in "$DB_DIR"/*.sql; do
  if [ -f "$sql_file" ]; then
    filename=$(basename "$sql_file")
    migration_count=$((migration_count + 1))

    if apply_migration "$sql_file"; then
      success_count=$((success_count + 1))
    fi
  fi
done

echo ""
echo "📊 Results:"
echo "  Total migrations found: $migration_count"
echo "  Successfully applied: $success_count"
echo "  Log written to: $LOG_FILE"

# Exit with success if all migrations applied
[ "$migration_count" -eq "$success_count" ] && exit 0 || exit 1
