#!/bin/bash
# Phase 2A Auto-Restart Script
# 실행: cron 또는 systemd service에서 주기적으로 확인

PHASE2A_PID=$(pgrep -f "node phase2a-message-collection.js")
MEMORY_AUTOMATION_DIR="/home/jeepney/.openclaw/workspace-dev/memory-automation"

if [[ -z "$PHASE2A_PID" ]]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Phase 2A service not running. Restarting..."
  cd "$MEMORY_AUTOMATION_DIR"
  PORT=3009 nohup node phase2a-message-collection.js > logs/phase2a-service.log 2>&1 &
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Phase 2A service restarted (PID: $!)"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Phase 2A service is running (PID: $PHASE2A_PID)"
fi
