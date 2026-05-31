#!/bin/bash
# Monitor Phase 2 pipeline every minute
DASHBOARD="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-dashboard-live.json"

collect_metrics() {
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # Check service health
    local phase2a_health=$(curl -s http://127.0.0.1:3009/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    local phase2b_health=$(curl -s http://127.0.0.1:3010/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    local phase2c_health=$(curl -s http://127.0.0.1:3011/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

    # Get recent log data
    local last_log=$(tail -1 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2d-cron-*.log 2>/dev/null)

    # Create JSON output
    cat > "$DASHBOARD" << EOF
{
  "timestamp": "$timestamp",
  "services": {
    "phase2a": "$phase2a_health",
    "phase2b": "$phase2b_health",
    "phase2c": "$phase2c_health"
  },
  "last_cycle": "$last_log"
}
EOF
}

collect_metrics
