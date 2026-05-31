#!/bin/bash

# Phase 2F Gate — Monitoring Setup
# Time window: 19:30-21:00 KST
# Purpose: Deploy dashboard and alert rules for Phase 2 memory automation

set -e

MONITORING_LOG="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-monitoring-setup.log"
DASHBOARD_DIR="/home/jeepney/.openclaw/workspace-dev/memory/logs"
ALERT_CONFIG="/home/jeepney/.openclaw/workspace-dev/memory-automation/PHASE2F_ALERT_CONFIG.json"

mkdir -p "$DASHBOARD_DIR"
exec 1> >(tee -a "$MONITORING_LOG")
exec 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 2F GATE - MONITORING SETUP ==="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Target: Deploy dashboard + alert rules (19:30-21:00 KST)"
echo ""

# Create monitoring dashboard
create_dashboard() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Creating real-time monitoring dashboard..."

    cat > /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-dashboard.json << 'EOF'
{
  "dashboard": {
    "title": "Phase 2 Memory Automation — Real-Time Monitor",
    "refresh_interval": 60000,
    "created_at": "2026-05-31T18:30:00Z",
    "sections": [
      {
        "name": "System Status",
        "metrics": [
          {
            "id": "service_health",
            "name": "Service Health",
            "type": "status",
            "values": {
              "Phase2A": "checking",
              "Phase2B": "checking",
              "Phase2C": "checking"
            }
          },
          {
            "id": "uptime",
            "name": "Service Uptime (hours)",
            "type": "gauge",
            "thresholds": { "warning": 0.5, "critical": 0.1 }
          },
          {
            "id": "memory_usage",
            "name": "Memory Usage (MB)",
            "type": "gauge",
            "thresholds": { "warning": 500, "critical": 800 }
          }
        ]
      },
      {
        "name": "Pipeline Metrics",
        "metrics": [
          {
            "id": "cycle_time",
            "name": "5-Min Cycle Duration (ms)",
            "type": "gauge",
            "thresholds": { "warning": 3000, "critical": 5000 },
            "target": 200
          },
          {
            "id": "messages_collected",
            "name": "Messages Collected (per cycle)",
            "type": "counter"
          },
          {
            "id": "duplicates_removed",
            "name": "Duplicates Removed (per cycle)",
            "type": "counter"
          },
          {
            "id": "entries_accepted",
            "name": "Entries Accepted (per cycle)",
            "type": "counter",
            "thresholds": { "warning": 5, "critical": 0 }
          }
        ]
      },
      {
        "name": "Quality Metrics",
        "metrics": [
          {
            "id": "trust_score_avg",
            "name": "Avg Trust Score (accepted entries)",
            "type": "gauge",
            "thresholds": { "warning": 60, "critical": 50 },
            "target": 80
          },
          {
            "id": "duplicate_ratio",
            "name": "Duplicate Detection Ratio (%)",
            "type": "gauge",
            "thresholds": { "warning": 50, "critical": 70 }
          },
          {
            "id": "error_rate",
            "name": "Pipeline Error Rate (%)",
            "type": "gauge",
            "thresholds": { "warning": 5, "critical": 10 }
          }
        ]
      },
      {
        "name": "Operational Status",
        "metrics": [
          {
            "id": "last_cycle",
            "name": "Last Cycle Timestamp",
            "type": "timestamp"
          },
          {
            "id": "cycle_success_rate",
            "name": "Cycle Success Rate (24h) (%)",
            "type": "gauge",
            "thresholds": { "warning": 95, "critical": 90 },
            "target": 100
          },
          {
            "id": "entries_pending",
            "name": "Pending Entries in Queue",
            "type": "gauge",
            "thresholds": { "warning": 100, "critical": 500 }
          }
        ]
      }
    ]
  }
}
EOF

    echo "✅ Dashboard created: $DASHBOARD_DIR/phase2f-dashboard.json"
}

# Create alert rules
create_alert_rules() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Creating alert rules..."

    cat > "$ALERT_CONFIG" << 'EOF'
{
  "alert_rules": {
    "critical": [
      {
        "id": "service_down",
        "name": "Service Down Alert",
        "condition": "Phase2A.status == DOWN || Phase2B.status == DOWN || Phase2C.status == DOWN",
        "duration": "1m",
        "severity": "CRITICAL",
        "action": "page_oncall",
        "channels": ["slack", "discord", "email"],
        "escalation_timeout": "5m"
      },
      {
        "id": "cycle_timeout",
        "name": "Cycle Execution Timeout",
        "condition": "time_since_last_cycle > 6m",
        "severity": "CRITICAL",
        "action": "page_oncall",
        "channels": ["slack", "discord"]
      },
      {
        "id": "error_spike",
        "name": "Error Rate Spike",
        "condition": "error_rate > 20%",
        "duration": "2 consecutive cycles",
        "severity": "CRITICAL",
        "action": "page_oncall"
      },
      {
        "id": "memory_leak",
        "name": "Memory Leak Detection",
        "condition": "memory_usage > 800MB",
        "duration": "5m",
        "severity": "CRITICAL",
        "action": "page_oncall"
      }
    ],
    "warning": [
      {
        "id": "slow_cycle",
        "name": "Slow Cycle Execution",
        "condition": "cycle_time > 3000ms",
        "duration": "3 cycles",
        "severity": "WARNING",
        "action": "notify_team",
        "channels": ["slack"]
      },
      {
        "id": "low_trust_score",
        "name": "Low Average Trust Score",
        "condition": "trust_score_avg < 60",
        "duration": "5 cycles",
        "severity": "WARNING",
        "action": "notify_team",
        "channels": ["slack"]
      },
      {
        "id": "high_duplicate_ratio",
        "name": "High Duplicate Detection Rate",
        "condition": "duplicate_ratio > 50%",
        "duration": "10 cycles",
        "severity": "WARNING",
        "action": "notify_team",
        "channels": ["slack"]
      },
      {
        "id": "entries_pending_queue",
        "name": "Entries Pending in Queue",
        "condition": "entries_pending > 100",
        "duration": "30m",
        "severity": "WARNING",
        "action": "notify_team",
        "channels": ["slack"]
      }
    ],
    "info": [
      {
        "id": "cycle_completed",
        "name": "Cycle Completed Successfully",
        "condition": "cycle_status == SUCCESS",
        "severity": "INFO",
        "action": "log_event",
        "channels": []
      }
    ]
  },
  "notification_channels": {
    "slack": {
      "enabled": true,
      "webhook_url": "${SLACK_WEBHOOK_URL}",
      "format": "rich",
      "rate_limit": "per_rule"
    },
    "discord": {
      "enabled": true,
      "webhook_url": "${DISCORD_WEBHOOK_URL}",
      "format": "rich"
    },
    "email": {
      "enabled": true,
      "recipients": ["ops-team@dscfms.local"],
      "rate_limit": "per_rule"
    }
  },
  "escalation_policies": {
    "default": {
      "level1": { "delay": "0m", "notify": ["slack", "discord"] },
      "level2": { "delay": "5m", "notify": ["email", "page_oncall"] },
      "level3": { "delay": "15m", "notify": ["sms", "call"] }
    }
  }
}
EOF

    echo "✅ Alert rules created: $ALERT_CONFIG"
}

# Create monitoring cron job
create_monitoring_cron() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Setting up monitoring cron job..."

    cat > /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2f-monitor-cron.sh << 'CRON_EOF'
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
CRON_EOF

    chmod +x /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2f-monitor-cron.sh

    # Add to crontab
    (crontab -l 2>/dev/null || true; echo "* * * * * /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2f-monitor-cron.sh >> /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-monitor-cron.log 2>&1") | crontab -

    echo "✅ Monitoring cron job registered (every minute)"
}

# Create health check script
create_health_check() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Creating health check script..."

    cat > /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2f-health-check.sh << 'HEALTH_EOF'
#!/bin/bash
# Health check for Phase 2 services

check_service() {
    local port=$1
    local name=$2

    if curl -sf http://127.0.0.1:$port/health > /dev/null 2>&1; then
        echo "✅ $name (port $port)"
        return 0
    else
        echo "❌ $name (port $port) — NOT RESPONDING"
        return 1
    fi
}

echo "=== Phase 2 Health Check ==="
echo "Timestamp: $(date)"
echo ""

fail_count=0
check_service 3009 "Phase 2A" || ((fail_count++))
check_service 3010 "Phase 2B" || ((fail_count++))
check_service 3011 "Phase 2C" || ((fail_count++))

echo ""
if [ $fail_count -eq 0 ]; then
    echo "🟢 All services healthy"
    exit 0
else
    echo "🔴 $fail_count service(s) down"
    exit 1
fi
HEALTH_EOF

    chmod +x /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2f-health-check.sh
    echo "✅ Health check script created"
}

# Main execution
main() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting monitoring setup..."
    echo ""

    create_dashboard
    create_alert_rules
    create_health_check
    create_monitoring_cron

    echo ""
    echo "========== MONITORING SETUP COMPLETE =========="
    echo ""
    echo "Deployed components:"
    echo "  ✅ Real-time dashboard: $DASHBOARD_DIR/phase2f-dashboard.json"
    echo "  ✅ Alert rules: $ALERT_CONFIG"
    echo "  ✅ Health check script: /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2f-health-check.sh"
    echo "  ✅ Monitoring cron: Every minute (phase2f-monitor-cron.sh)"
    echo ""
    echo "Next phase (20:00):"
    echo "  Alert Routing Setup — Slack/Discord integration"
    echo ""
}

main
