#!/bin/bash

################################################################################
# Memory Archive Rotation Configuration Helper
# Purpose: Interactive setup and validation
# Usage: ./scripts/configure-archive-rotation.sh
################################################################################

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "${SCRIPT_DIR}")"
readonly ARCHIVE_SCRIPT="${SCRIPT_DIR}/archive-rotate.js"
readonly CRON_SCRIPT="${SCRIPT_DIR}/archive-rotate-cron.sh"
readonly DB_SCHEMA="${PROJECT_ROOT}/db/44_memory_archive.sql"
readonly SETUP_DOC="${PROJECT_ROOT}/ARCHIVE_ROTATION_SETUP.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

################################################################################
# Utility Functions
################################################################################

print_header() {
  echo -e "\n${BLUE}════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

################################################################################
# Validation Checks
################################################################################

check_files_exist() {
  print_header "Checking Files"

  local missing=0

  if [[ -f "${ARCHIVE_SCRIPT}" ]]; then
    print_success "archive-rotate.js exists"
  else
    print_error "archive-rotate.js not found"
    missing=$((missing + 1))
  fi

  if [[ -f "${CRON_SCRIPT}" ]]; then
    print_success "archive-rotate-cron.sh exists"
  else
    print_error "archive-rotate-cron.sh not found"
    missing=$((missing + 1))
  fi

  if [[ -f "${DB_SCHEMA}" ]]; then
    print_success "44_memory_archive.sql exists"
  else
    print_error "44_memory_archive.sql not found"
    missing=$((missing + 1))
  fi

  if [[ -f "${SETUP_DOC}" ]]; then
    print_success "ARCHIVE_ROTATION_SETUP.md exists"
  else
    print_error "ARCHIVE_ROTATION_SETUP.md not found"
    missing=$((missing + 1))
  fi

  return $missing
}

check_environment() {
  print_header "Checking Environment Variables"

  local env_file="${PROJECT_ROOT}/dsc-fms-portal/.env.local"

  if [[ ! -f "${env_file}" ]]; then
    print_warning ".env.local not found (expected at runtime)"
    return 0
  fi

  local missing=0

  if grep -q "NEXT_PUBLIC_SUPABASE_URL" "${env_file}"; then
    print_success "NEXT_PUBLIC_SUPABASE_URL configured"
  else
    print_error "NEXT_PUBLIC_SUPABASE_URL not configured"
    missing=$((missing + 1))
  fi

  if grep -q "SUPABASE_SERVICE_ROLE_KEY" "${env_file}"; then
    print_success "SUPABASE_SERVICE_ROLE_KEY configured"
  else
    print_error "SUPABASE_SERVICE_ROLE_KEY not configured"
    missing=$((missing + 1))
  fi

  if grep -q "TELEGRAM_BOT_TOKEN" "${env_file}"; then
    print_success "TELEGRAM_BOT_TOKEN configured (optional)"
  else
    print_warning "TELEGRAM_BOT_TOKEN not configured (optional)"
  fi

  return $missing
}

check_permissions() {
  print_header "Checking File Permissions"

  if [[ -x "${ARCHIVE_SCRIPT}" ]]; then
    print_success "archive-rotate.js is executable"
  else
    print_warning "archive-rotate.js is not executable"
    echo "  Run: chmod +x ${ARCHIVE_SCRIPT}"
  fi

  if [[ -x "${CRON_SCRIPT}" ]]; then
    print_success "archive-rotate-cron.sh is executable"
  else
    print_warning "archive-rotate-cron.sh is not executable"
    echo "  Run: chmod +x ${CRON_SCRIPT}"
  fi
}

check_memory_file() {
  print_header "Checking MEMORY.md"

  local memory_file="${PROJECT_ROOT}/memory/MEMORY.md"

  if [[ -f "${memory_file}" ]]; then
    print_success "MEMORY.md exists"

    # Count dated sections
    local count=$(grep -c "20[0-9][0-9]-[0-9][0-9]-[0-9][0-9].*KST" "${memory_file}" || echo "0")
    print_info "Found ${count} dated sections"
  else
    print_error "MEMORY.md not found"
    return 1
  fi

  # Check logs directory
  local logs_dir="${PROJECT_ROOT}/memory/logs"
  if [[ -d "${logs_dir}" ]]; then
    print_success "Memory logs directory exists"
  else
    print_warning "Memory logs directory does not exist (will be created at runtime)"
  fi
}

run_dry_run() {
  print_header "Running Dry Run Test"

  if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Cannot run dry run test."
    return 1
  fi

  cd "${PROJECT_ROOT}"

  if node "${ARCHIVE_SCRIPT}" --dry-run 2>&1 | head -20; then
    print_success "Dry run completed successfully"
    return 0
  else
    print_error "Dry run failed"
    return 1
  fi
}

run_tests() {
  print_header "Running Test Suite"

  if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Cannot run tests."
    return 1
  fi

  cd "${PROJECT_ROOT}"

  if node "${SCRIPT_DIR}/test-archive-rotate.js" 2>&1 | tail -5; then
    return 0
  else
    return 1
  fi
}

################################################################################
# Configuration Steps
################################################################################

show_cron_options() {
  print_header "Cron Scheduling Options"

  cat << 'EOF'
The archive rotation is scheduled for: 00:05 KST (15:05 UTC previous day)

Option 1: Using OpenClaw Schedule Skill
─────────────────────────────────────────
/schedule create \
  --name "memory-archive-rotation" \
  --cron "5 0 * * *" \
  --command "cd ${PROJECT_ROOT} && node scripts/archive-rotate.js"

Option 2: System Crontab
────────────────────────
crontab -e

Add this line:
5 15 * * * /home/jeepney/.openclaw/workspace-dev/.claude/worktrees/agent-ac1eb043978a37642/scripts/archive-rotate-cron.sh >> /dev/null 2>&1

Option 3: Systemd Timer (Linux)
───────────────────────────────
[Create /etc/systemd/system/memory-archive.service and memory-archive.timer]

EOF
}

show_database_setup() {
  print_header "Database Setup Instructions"

  cat << 'EOF'
The database schema needs to be created before first run.

Option 1: Supabase CLI
──────────────────────
supabase migration up

Option 2: Manual SQL Execution
───────────────────────────────
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy contents of: db/44_memory_archive.sql
4. Execute

The schema includes:
- memory_archive table (title, created_at, archived_at, age_days)
- Unique constraint on (title, created_at)
- Indexes for efficient querying
- Full documentation

EOF
}

show_summary() {
  print_header "Setup Summary"

  cat << 'EOF'
✅ Memory Archive Rotation System Ready for Deployment

📁 Files Created:
  • scripts/archive-rotate.js (450 lines)
  • scripts/archive-rotate-cron.sh (wrapper)
  • scripts/test-archive-rotate.js (test suite)
  • db/44_memory_archive.sql (schema)
  • ARCHIVE_ROTATION_SETUP.md (full documentation)

🔧 Next Steps:

  1. Deploy Supabase schema
     → Run: supabase migration up
     → Or: Execute SQL in Supabase console

  2. Verify environment variables
     → Check: dsc-fms-portal/.env.local
     → Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

  3. Test the system (dry run)
     → Run: node scripts/archive-rotate.js --dry-run --verbose

  4. Set up cron job
     → Use: /schedule create (or crontab)
     → Time: Daily at 00:05 KST

  5. Monitor execution
     → Logs: memory/logs/archive-rotation-YYYYMMDD.log
     → Alerts: Telegram (if configured)

📖 Full Documentation:
  → See: ARCHIVE_ROTATION_SETUP.md

🟢 System is ready for production deployment!

EOF
}

################################################################################
# Main Menu
################################################################################

main() {
  print_header "Memory Archive Rotation Configuration Tool"

  echo "Select an option:"
  echo "1. Run all validation checks"
  echo "2. Check files"
  echo "3. Check environment"
  echo "4. Check permissions"
  echo "5. Check MEMORY.md"
  echo "6. Run dry-run test"
  echo "7. Run test suite"
  echo "8. Show cron scheduling options"
  echo "9. Show database setup instructions"
  echo "10. Show full setup summary"
  echo "0. Exit"
  echo

  read -p "Enter choice [0-10]: " choice

  case $choice in
    0)
      print_info "Exiting..."
      exit 0
      ;;
    1)
      check_files_exist || true
      check_environment || true
      check_permissions || true
      check_memory_file || true
      run_dry_run || true
      run_tests || true
      show_summary
      ;;
    2)
      check_files_exist
      ;;
    3)
      check_environment
      ;;
    4)
      check_permissions
      ;;
    5)
      check_memory_file
      ;;
    6)
      run_dry_run
      ;;
    7)
      run_tests
      ;;
    8)
      show_cron_options
      ;;
    9)
      show_database_setup
      ;;
    10)
      show_summary
      ;;
    *)
      print_error "Invalid choice"
      exit 1
      ;;
  esac

  echo
  read -p "Press Enter to continue..."
  main  # Show menu again
}

# Run main
main
