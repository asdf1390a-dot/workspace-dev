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
