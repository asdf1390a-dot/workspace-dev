#!/bin/bash
################################################################################
# Phase 2C Cron Job - Monitoring & Health Check (매시간)
# 주기: 00:00, 01:00, 02:00, ... 23:00 KST
# 목적: Phase 2A/2B/2C 서비스 헬스 체크 + 디스크 공간 모니터링
#
# 작성: Automation Specialist
# 버전: 1.0
# 최종 수정: 2026-05-28
################################################################################

set -euo pipefail

# 설정값
readonly MEMORY_DIR="${MEMORY_DIR:-/home/jeepney/.openclaw/workspace-dev/memory}"
readonly LOG_DIR="${MEMORY_DIR}/logs"
readonly PHASE2A_URL="${PHASE2A_URL:-http://localhost:3009}"
readonly PHASE2B_URL="${PHASE2B_URL:-http://localhost:3010}"
readonly PHASE2C_URL="${PHASE2C_URL:-http://localhost:3011}"

# 초기화
mkdir -p "$LOG_DIR"
readonly TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
readonly HEALTH_LOG="$LOG_DIR/cron-health-$(date +%Y%m%d).log"
readonly HEALTH_JSON="$LOG_DIR/cron-health-$(date +%Y%m%d).json"

################################################################################
# 함수 정의
################################################################################

# 로깅 함수
log() {
  local level="$1"
  shift
  local msg="$@"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo "[$timestamp] [$level] $msg" >> "$HEALTH_LOG"
}

# 헬스 체크
check_service() {
  local name="$1"
  local url="$2"

  if curl -s -m 5 "$url" > /dev/null 2>&1; then
    log "INFO" "$name: OK ✓"
    echo "\"$name\": \"OK\""
    return 0
  else
    log "WARN" "$name: FAILED ✗"
    echo "\"$name\": \"FAILED\""
    return 1
  fi
}

# 디스크 공간 확인
check_disk_space() {
  local threshold=80  # 80% 초과 시 경고

  local usage=$(df "$LOG_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')

  if [[ $usage -gt $threshold ]]; then
    log "WARN" "Disk usage: $usage% (exceeds ${threshold}%)"
    echo "\"disk_usage\": \"$usage%\""
    return 1
  else
    log "INFO" "Disk usage: $usage%"
    echo "\"disk_usage\": \"$usage%\""
    return 0
  fi
}

################################################################################
# 메인 로직
################################################################################

log "INFO" "========== Phase 2C Monitoring Start =========="
log "INFO" "Run ID: $(date +%s)"

# 서비스 헬스 체크
failed_services=0
services_status=""

if ! check_service "Phase2A" "$PHASE2A_URL/health"; then
  ((failed_services++))
fi

if ! check_service "Phase2B" "$PHASE2B_URL/health"; then
  ((failed_services++))
fi

if ! check_service "Phase2C" "$PHASE2C_URL/health"; then
  ((failed_services++))
fi

# 디스크 공간 확인
if ! check_disk_space; then
  ((failed_services++))
fi

# 최종 결과
if [[ $failed_services -eq 0 ]]; then
  log "INFO" "All services and disk checks passed ✓"
  log "INFO" "========== Phase 2C Monitoring End (SUCCESS) =========="
  exit 0
else
  log "WARN" "WARNING: $failed_services check(s) failed"
  log "INFO" "========== Phase 2C Monitoring End (WITH ISSUES) =========="
  exit 1
fi
