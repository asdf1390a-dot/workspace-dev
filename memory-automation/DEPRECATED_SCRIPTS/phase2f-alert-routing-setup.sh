#!/bin/bash

# Phase 2F Gate — Alert Routing Setup
# Time window: 21:00-21:30 KST
# Purpose: Integrate alert systems with Slack and Discord

set -e

ROUTING_LOG="/home/jeepney/.openclaw/workspace-dev/memory/logs/phase2f-alert-routing.log"
ROUTING_CONFIG="/home/jeepney/.openclaw/workspace-dev/memory-automation/PHASE2F_ROUTING_CONFIG.json"

mkdir -p /home/jeepney/.openclaw/workspace-dev/memory/logs
exec 1> >(tee -a "$ROUTING_LOG")
exec 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === PHASE 2F GATE - ALERT ROUTING SETUP ==="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Target: Slack/Discord integration (21:00-21:30 KST)"
echo ""

# Create routing configuration
create_routing_config() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Creating alert routing configuration..."

    cat > "$ROUTING_CONFIG" << 'EOF'
{
  "routing_rules": {
    "critical_alerts": {
      "target_channels": [
        "slack:ops-alerts",
        "discord:phase2-critical",
        "email:oncall@dscfms.local"
      ],
      "escalation": "immediate",
      "requires_acknowledgement": true
    },
    "warning_alerts": {
      "target_channels": [
        "slack:phase2-warnings",
        "discord:phase2-monitoring"
      ],
      "escalation": "delayed_5min",
      "requires_acknowledgement": false
    },
    "info_events": {
      "target_channels": [
        "slack:phase2-logs",
        "discord:phase2-monitoring"
      ],
      "escalation": "none",
      "requires_acknowledgement": false
    }
  },
  "channel_configs": {
    "slack": {
      "base_url": "https://hooks.slack.com/services/",
      "message_format": "blocks",
      "rate_limit": {
        "per_rule": 60,
        "global": 1000
      },
      "retry": {
        "max_attempts": 3,
        "backoff": "exponential"
      }
    },
    "discord": {
      "base_url": "https://discordapp.com/api/webhooks/",
      "message_format": "embeds",
      "rate_limit": {
        "per_rule": 120,
        "global": 5000
      },
      "retry": {
        "max_attempts": 3,
        "backoff": "exponential"
      }
    },
    "email": {
      "smtp_server": "smtp.google.com",
      "smtp_port": 587,
      "from_address": "phase2-automation@dscfms.local",
      "retry": {
        "max_attempts": 2,
        "backoff": "linear"
      }
    }
  },
  "alert_format_templates": {
    "slack_critical": {
      "color": "#FF0000",
      "icon_emoji": ":rotating_light:",
      "title_template": "🚨 CRITICAL: {alert_name}",
      "fields": [
        "timestamp",
        "severity",
        "service",
        "condition",
        "action",
        "escalation"
      ]
    },
    "slack_warning": {
      "color": "#FFA500",
      "icon_emoji": ":warning:",
      "title_template": "⚠️  WARNING: {alert_name}",
      "fields": [
        "timestamp",
        "service",
        "condition",
        "current_value"
      ]
    },
    "discord_critical": {
      "color": 16711680,
      "title": "CRITICAL ALERT: {alert_name}",
      "description": "{condition}",
      "fields": {
        "Service": "{service}",
        "Severity": "CRITICAL",
        "Action": "{action}",
        "Timestamp": "{timestamp}"
      }
    },
    "email_critical": {
      "subject": "[CRITICAL] Phase 2 Alert: {alert_name}",
      "body_template": "email_critical.html"
    }
  }
}
EOF

    echo "✅ Routing configuration created: $ROUTING_CONFIG"
}

# Create alert dispatcher
create_alert_dispatcher() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Creating alert dispatcher..."

    cat > /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2f-alert-dispatcher.js << 'DISPATCHER_EOF'
#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL || '';
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || '';
const PORT = process.env.ALERT_PORT || 9000;

// Alert severity levels
const SEVERITY = { CRITICAL: 3, WARNING: 2, INFO: 1 };

// Log function
function log(level, msg) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${msg}`);
}

// Send Slack notification
async function sendSlack(alert) {
  if (!SLACK_WEBHOOK) return;

  const color = alert.severity === 'CRITICAL' ? '#FF0000' : '#FFA500';
  const payload = {
    attachments: [{
      color,
      title: `${alert.severity}: ${alert.name}`,
      text: alert.message,
      fields: [
        { title: 'Service', value: alert.service, short: true },
        { title: 'Severity', value: alert.severity, short: true },
        { title: 'Condition', value: alert.condition, short: false },
        { title: 'Timestamp', value: new Date().toISOString(), short: false }
      ],
      footer: 'Phase 2 Alert Dispatcher'
    }]
  };

  return new Promise((resolve) => {
    const options = new URL(SLACK_WEBHOOK);
    const req = https.request(options, { method: 'POST' }, (res) => {
      if (res.statusCode === 200) {
        log('INFO', `Slack notification sent: ${alert.name}`);
      } else {
        log('ERROR', `Slack notification failed: ${res.statusCode}`);
      }
      resolve();
    });
    req.on('error', (e) => log('ERROR', `Slack error: ${e.message}`));
    req.write(JSON.stringify(payload));
    req.end();
  });
}

// Send Discord notification
async function sendDiscord(alert) {
  if (!DISCORD_WEBHOOK) return;

  const color = alert.severity === 'CRITICAL' ? 16711680 : 16755200;
  const payload = {
    embeds: [{
      title: `${alert.severity}: ${alert.name}`,
      description: alert.message,
      color,
      fields: [
        { name: 'Service', value: alert.service, inline: true },
        { name: 'Severity', value: alert.severity, inline: true },
        { name: 'Condition', value: alert.condition, inline: false },
        { name: 'Timestamp', value: new Date().toISOString(), inline: false }
      ],
      footer: { text: 'Phase 2 Alert Dispatcher' }
    }]
  };

  return new Promise((resolve) => {
    const options = new URL(DISCORD_WEBHOOK);
    const req = https.request(options, { method: 'POST' }, (res) => {
      if (res.statusCode === 204) {
        log('INFO', `Discord notification sent: ${alert.name}`);
      } else {
        log('ERROR', `Discord notification failed: ${res.statusCode}`);
      }
      resolve();
    });
    req.on('error', (e) => log('ERROR', `Discord error: ${e.message}`));
    req.write(JSON.stringify(payload));
    req.end();
  });
}

// Alert router
async function routeAlert(alert) {
  log('INFO', `Routing alert: ${alert.name} (${alert.severity})`);

  if (alert.severity === 'CRITICAL') {
    await Promise.all([sendSlack(alert), sendDiscord(alert)]);
  } else if (alert.severity === 'WARNING') {
    await sendSlack(alert);
  }
}

// HTTP server
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/alert') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const alert = JSON.parse(body);
        await routeAlert(alert);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'routed' }));
      } catch (e) {
        log('ERROR', `Failed to route alert: ${e.message}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  } else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ready' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  log('INFO', `Alert Dispatcher listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  log('INFO', 'Shutting down gracefully...');
  server.close(() => process.exit(0));
});
DISPATCHER_EOF

    chmod +x /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2f-alert-dispatcher.js
    echo "✅ Alert dispatcher created"
}

# Create integration test
create_integration_test() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Creating alert routing integration test..."

    cat > /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2f-test-alerts.sh << 'TEST_EOF'
#!/bin/bash
# Test alert routing

echo "=== Testing Alert Routing ==="
echo "Timestamp: $(date)"
echo ""

# Test CRITICAL alert
echo "1. Testing CRITICAL alert routing..."
curl -s -X POST http://127.0.0.1:9000/api/alert \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Service Down Test",
    "severity": "CRITICAL",
    "service": "Phase2A",
    "condition": "Health check failed",
    "message": "Phase 2A service is not responding"
  }' | grep -q status && echo "✅ CRITICAL alert routed" || echo "❌ Failed"

# Test WARNING alert
echo "2. Testing WARNING alert routing..."
curl -s -X POST http://127.0.0.1:9000/api/alert \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slow Execution",
    "severity": "WARNING",
    "service": "Phase2D",
    "condition": "Cycle time > 3000ms",
    "message": "Pipeline execution is slower than expected"
  }' | grep -q status && echo "✅ WARNING alert routed" || echo "❌ Failed"

echo ""
echo "Alert routing test complete"
TEST_EOF

    chmod +x /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2f-test-alerts.sh
    echo "✅ Alert routing test created"
}

# Main execution
main() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting alert routing setup..."
    echo ""

    create_routing_config
    create_alert_dispatcher
    create_integration_test

    echo ""
    echo "========== ALERT ROUTING SETUP COMPLETE =========="
    echo ""
    echo "Deployed components:"
    echo "  ✅ Routing configuration: $ROUTING_CONFIG"
    echo "  ✅ Alert dispatcher: /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2f-alert-dispatcher.js"
    echo "  ✅ Integration test: /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2f-test-alerts.sh"
    echo ""
    echo "Next phase (21:30):"
    echo "  Full System Validation — End-to-end smoke tests"
    echo ""
}

main
