#!/bin/bash
# Rule Compliance Monitor — Real-time Validation
# 점검 항목: Phase 2 서비스 상태, 메모리 누수, 디스크 공간, 포트 바인딩

WORKSPACE_DIR="/home/jeepney/.openclaw/workspace-dev"
LOG_DIR="$WORKSPACE_DIR/memory/logs"
COMPLIANCE_LOG="$LOG_DIR/rule-compliance-monitor.log"

mkdir -p "$LOG_DIR"

log_event() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$COMPLIANCE_LOG"
}

VIOLATIONS=()

log_event "🔍 Rule Compliance 검증 시작..."

# 1. Phase 2 서비스 상태 체크
for service in "phase2a:3009" "phase2b:3010" "phase2c:3011"; do
  name=$(echo $service | cut -d: -f1)
  port=$(echo $service | cut -d: -f2)

  if ! curl -s --connect-timeout 2 http://127.0.0.1:$port/health >/dev/null 2>&1; then
    VIOLATIONS+=("$name (port $port) DOWN")
  fi
done

# 2. 디스크 사용량 체크 (90% 이상 위험)
DISK_USAGE=$(df -h / | tail -1 | awk '{gsub("%",""); print $5}')
if [[ $DISK_USAGE -gt 90 ]]; then
  VIOLATIONS+=("Disk usage critical: ${DISK_USAGE}%")
fi

# 3. 메모리 사용량 체크 (85% 이상 경고)
MEM_PERCENT=$(free | grep Mem | awk '{printf("%.0f", ($3/$2)*100)}')
if [[ $MEM_PERCENT -gt 85 ]]; then
  VIOLATIONS+=("Memory usage high: ${MEM_PERCENT}%")
fi

# 4. 포트 바인딩 체크
for port in 3009 3010 3011; do
  if ! netstat -tlnp 2>/dev/null | grep -q ":$port "; then
    if ! lsof -i -P -n 2>/dev/null | grep -q ":$port "; then
      VIOLATIONS+=("Port $port not listening")
    fi
  fi
done

# 5. 프로세스 개수 체크 (메모리 누수 감지용)
PROCESS_COUNT=$(ps aux | grep -E "phase2[abc]|node" | grep -v grep | wc -l)
if [[ $PROCESS_COUNT -lt 3 ]]; then
  VIOLATIONS+=("Phase 2 process count low: $PROCESS_COUNT")
fi

# 결과 기록
if [[ ${#VIOLATIONS[@]} -eq 0 ]]; then
  log_event "✅ All compliance rules PASSED (5/5 checks OK)"
else
  log_event "⚠️  VIOLATIONS FOUND: ${#VIOLATIONS[@]} rule(s) failed"
  for violation in "${VIOLATIONS[@]}"; do
    log_event "   ❌ $violation"
  done
fi

log_event "Cycle complete"
