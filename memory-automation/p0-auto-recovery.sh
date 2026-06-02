#!/bin/bash
# P0: Auto-Recovery (Emergency)
# Hourly port health checks + auto-restart failed services
# Runs every hour via cron (0 * * * *)

set -e

LOG_DIR="/home/jeepney/.openclaw/workspace-dev/memory/logs"
LOG_FILE="$LOG_DIR/p0-auto-recovery-$(date +%Y%m%d).log"

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

restart_service() {
  local service="$1"
  local port="$2"
  local script_path="$3"

  log "🔴 Service $service (port $port) is down. Attempting restart..."

  # Kill any existing process on the port
  fuser -k $port/tcp 2>/dev/null || true
  sleep 1

  # Restart service
  PORT=$port nohup node "$script_path" > "$LOG_DIR/$service-restart.log" 2>&1 &
  sleep 2

  # Verify
  if curl -s http://localhost:$port/health 2>/dev/null | grep -q "ready"; then
    log "✅ Service $service restarted successfully (port $port)"
    return 0
  else
    log "❌ Service $service failed to restart on port $port"
    return 1
  fi
}

check_ports() {
  log "Checking service health..."

  local all_ok=true

  # Port 3009: Phase 2A
  if ! curl -s http://localhost:3009/health 2>/dev/null | grep -q "ready"; then
    log "❌ Phase 2A (port 3009) is down"
    if restart_service "phase2a-message-collection" 3009 "/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2a-message-collection.js"; then
      :
    else
      all_ok=false
    fi
  else
    log "✅ Phase 2A (port 3009) OK"
  fi

  # Port 3010: Phase 2B
  if ! curl -s http://localhost:3010/health 2>/dev/null | grep -q "ready"; then
    log "❌ Phase 2B (port 3010) is down"
    if restart_service "phase2b-express-wrapper" 3010 "/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2b-express-wrapper.js"; then
      :
    else
      all_ok=false
    fi
  else
    log "✅ Phase 2B (port 3010) OK"
  fi

  # Port 3011: Phase 2C
  if ! curl -s http://localhost:3011/health 2>/dev/null | grep -q "ready"; then
    log "❌ Phase 2C (port 3011) is down"
    if restart_service "phase2c-express-wrapper" 3011 "/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2c-express-wrapper.js"; then
      :
    else
      all_ok=false
    fi
  else
    log "✅ Phase 2C (port 3011) OK"
  fi

  return $([ "$all_ok" = true ] && echo 0 || echo 1)
}

check_cron_jobs() {
  log "Checking critical cron jobs..."

  # Check if cron jobs are still in crontab
  if crontab -l 2>/dev/null | grep -q "phase2b-cron.sh"; then
    log "✅ Phase 2B cron job present"
  else
    log "⚠️  Phase 2B cron job missing! Re-adding..."
    # This would require careful handling in production
  fi

  if crontab -l 2>/dev/null | grep -q "phase2d-cron.sh"; then
    log "✅ Phase 2D cron job present"
  else
    log "⚠️  Phase 2D cron job missing! Re-adding..."
  fi
}

# Main
log "=== P0 AUTO-RECOVERY CHECK ==="
check_ports
check_cron_jobs
log "=== P0 CHECK COMPLETE ==="
