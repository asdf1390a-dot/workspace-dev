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
