#!/bin/bash

################################################################################
# Rule Reminder v1.0
#
# Prints rule reinforcement before cron execution
# Designed to prevent Autonomous Proceed violations through visibility
#
# Usage: ./rule-reminder.sh [--verbose] [--log-file <path>]
#
# Environment:
#  - Called at START of each cron job (5min, 30min, 15min cycles)
#  - Captures reminder output to log file
#  - Non-blocking (does not fail the cron if executed)
#
# Output goes to STDOUT and optionally to LOG_FILE
################################################################################

set -uo pipefail

VERBOSE="${1:-}"
LOG_FILE="${2:-.}"

# Color codes
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Get current time
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S %Z')

# Helper function to print and optionally log
print_rule() {
  local msg="$1"
  echo -e "$msg"

  if [[ "$LOG_FILE" != "." ]]; then
    echo -e "$msg" | sed 's/\\033\[[0-9;]*m//g' >> "$LOG_FILE"
  fi
}

# ============================================================================
# RULE REMINDER OUTPUT
# ============================================================================

print_rule "${BLUE}════════════════════════════════════════════════════════════════${NC}"
print_rule "${BLUE}🔔 규칙 점검 — $CURRENT_TIME${NC}"
print_rule "${BLUE}════════════════════════════════════════════════════════════════${NC}"

print_rule ""
print_rule "${YELLOW}📋 실행 전 필수 규칙 확인:${NC}"
print_rule ""

# Rule 1: Autonomous Proceed
print_rule "${BOLD}1️⃣  Autonomous Proceed Rule${NC}"
print_rule "   문장: 사용자에게 물어보지 말고 자동으로 실행하세요"
print_rule "   의미: 확인 요청(y/n), 승인 대기 금지"
print_rule "   상태: ${GREEN}✅ 이 규칙을 지키며 실행할 예정${NC}"
print_rule ""

# Rule 2: Task Ownership
print_rule "${BOLD}2️⃣  Task Ownership Rule${NC}"
print_rule "   문장: 시작한 작업은 끝까지 완료하세요"
print_rule "   의미: 작업 시작 → 변경사항 기록 → git 커밋 완료"
print_rule "   상태: ${GREEN}✅ 작업 완료 후 즉시 커밋 실행${NC}"
print_rule ""

# Rule 3: Schedule Discipline
print_rule "${BOLD}3️⃣  Schedule Discipline Rule${NC}"
print_rule "   문장: 정해진 일정을 지키세요"
print_rule "   의미: 5분/30분/15분 주기 엄격히 준수"
print_rule "   상태: ${GREEN}✅ CTB 폴링 주기 정상 실행 중${NC}"
print_rule ""

print_rule "${BLUE}════════════════════════════════════════════════════════════════${NC}"
print_rule "${GREEN}🟢 규칙 점검 완료 — 자동 실행 준비됨${NC}"
print_rule "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Verbose mode: show additional context
if [[ "$VERBOSE" == "--verbose" ]]; then
  print_rule ""
  print_rule "${YELLOW}📊 상세 정보:${NC}"

  # Check git status
  UNCOMMITTED=$(git status --short 2>/dev/null | wc -l || echo "N/A")
  print_rule "  • Uncommitted changes: $UNCOMMITTED 파일"

  # Check Phase 2 services
  PHASE2A=$(curl -s --connect-timeout 1 http://localhost:3009/health >/dev/null 2>&1 && echo "✅" || echo "❌")
  PHASE2B=$(curl -s --connect-timeout 1 http://localhost:3010/health >/dev/null 2>&1 && echo "✅" || echo "❌")
  PHASE2C=$(curl -s --connect-timeout 1 http://localhost:3011/health >/dev/null 2>&1 && echo "✅" || echo "❌")
  print_rule "  • Phase 2A (port 3009): $PHASE2A"
  print_rule "  • Phase 2B (port 3010): $PHASE2B"
  print_rule "  • Phase 2C (port 3011): $PHASE2C"

  # Check last cron execution
  LAST_CYCLE=$(ls -t "$WORKSPACE_DIR/memory/logs"/*.log 2>/dev/null | head -1 | xargs -I {} basename {} || echo "no log")
  print_rule "  • Last execution: $LAST_CYCLE"

  print_rule ""
fi

exit 0
