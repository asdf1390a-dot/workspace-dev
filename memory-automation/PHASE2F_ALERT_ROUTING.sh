#!/bin/bash

# Phase 2F Alert Routing Configuration
# 배포: 2026-05-31 18:11 KST
# 목적: Phase 2F 모니터링 중 발생하는 알림을 Discord로 자동 라우팅

set -e

WORKSPACE="/home/jeepney/.openclaw/workspace-dev"
DISCORD_WEBHOOK="${DISCORD_WEBHOOK_PHASE2F}"

# Alert 우선순위 정의
declare -A ALERT_SEVERITY
ALERT_SEVERITY["CRITICAL"]="🔴"
ALERT_SEVERITY["WARNING"]="🟡"
ALERT_SEVERITY["INFO"]="🟢"

# 1. Service Health Alert
check_service_health() {
    local service=$1
    local port=$2
    local max_retries=3
    local retry=0

    while [ $retry -lt $max_retries ]; do
        if curl -s "http://localhost:${port}/health" > /dev/null 2>&1; then
            echo "✅ ${service} is healthy (port ${port})"
            return 0
        fi
        retry=$((retry + 1))
        sleep 2
    done

    # Service is down
    send_alert "CRITICAL" "${service} is DOWN (port ${port})"
    return 1
}

# 2. Performance Alert
check_latency() {
    local service=$1
    local endpoint=$2
    local port=$3
    local max_latency=500  # ms

    local start_time=$(date +%s%N)
    local response=$(curl -s -w "%{time_total}" -o /dev/null "http://localhost:${port}${endpoint}" 2>/dev/null)
    local latency=$(echo "$response * 1000" | bc)

    if (( $(echo "$latency > $max_latency" | bc -l) )); then
        send_alert "WARNING" "${service} latency high: ${latency}ms (threshold: ${max_latency}ms)"
    fi
}

# 3. Error Rate Alert
check_error_rate() {
    local service=$1
    local port=$2
    local error_threshold=5  # %

    # Check recent error logs
    local total_requests=$(tail -n 100 /tmp/phase2f_${service}_requests.log 2>/dev/null | wc -l)
    local error_requests=$(tail -n 100 /tmp/phase2f_${service}_requests.log 2>/dev/null | grep "error" | wc -l)

    if [ $total_requests -gt 0 ]; then
        local error_rate=$((error_requests * 100 / total_requests))
        if [ $error_rate -gt $error_threshold ]; then
            send_alert "CRITICAL" "${service} error rate high: ${error_rate}% (threshold: ${error_threshold}%)"
        fi
    fi
}

# 4. Discord Alert Function
send_alert() {
    local severity=$1
    local message=$2
    local emoji="${ALERT_SEVERITY[$severity]}"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Discord Webhook Payload
    local payload=$(cat <<EOF
{
    "content": "${emoji} **${severity}** | Phase 2F Deployment Alert",
    "embeds": [
        {
            "title": "${message}",
            "color": $([ "$severity" = "CRITICAL" ] && echo "16711680" || ([ "$severity" = "WARNING" ] && echo "16776960" || echo "65280")),
            "timestamp": "${timestamp}",
            "fields": [
                {
                    "name": "Deployment ID",
                    "value": "Phase 2F (2026-05-31)",
                    "inline": true
                },
                {
                    "name": "Severity",
                    "value": "${severity}",
                    "inline": true
                }
            ]
        }
    ]
}
EOF
)

    # Send to Discord (if webhook is configured)
    if [ ! -z "$DISCORD_WEBHOOK" ]; then
        curl -X POST "$DISCORD_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "$payload" 2>/dev/null || true
    fi

    # Log locally
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ${severity}: ${message}" >> "$WORKSPACE/memory/logs/phase2f-alerts.log"
}

# 5. Main Monitoring Loop
main() {
    echo "🟢 Phase 2F Alert Routing Started"
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S KST')"

    # Check each service
    check_service_health "Phase 2A" "3009"
    check_service_health "Phase 2B" "3010"
    check_service_health "Phase 2C" "3011"

    # Check latency
    check_latency "Phase 2A" "/health" "3009"
    check_latency "Phase 2B" "/health" "3010"
    check_latency "Phase 2C" "/health" "3011"

    # Check error rates
    check_error_rate "Phase2A" "3009"
    check_error_rate "Phase2B" "3010"
    check_error_rate "Phase2C" "3011"
}

# Run monitoring
main
