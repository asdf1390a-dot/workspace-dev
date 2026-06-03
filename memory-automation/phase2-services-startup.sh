#!/bin/bash
# Phase 2 Services Auto-Start Script
# Handles: Phase 2A (message collection), Phase 2B (duplicate detection), Phase 2C (trust score)
# Called by: @reboot cron entry

set -e

WORKSPACE_DIR="/home/jeepney/.openclaw/workspace-dev"
MEMORY_DIR="$WORKSPACE_DIR/memory-automation"
LOGS_DIR="$WORKSPACE_DIR/memory/logs"

# Ensure log directory exists
mkdir -p "$LOGS_DIR"

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Phase 2 Services Auto-Start Initiated" >> "$LOGS_DIR/phase2-startup.log"

# Wait for system to fully boot (optional, helps with port conflicts)
sleep 2

# Start Phase 2A - Message Collection Service
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting Phase 2A (Message Collection)" >> "$LOGS_DIR/phase2-startup.log"
cd "$MEMORY_DIR"
nohup node phase2a-message-collection.js >> "$LOGS_DIR/phase2a-message-collection.log" 2>&1 &
P2A_PID=$!
echo $P2A_PID > "$MEMORY_DIR/phase2a.pid"
sleep 1

# Start Phase 2B - Duplicate Detection (Express wrapper)
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting Phase 2B (Duplicate Detection)" >> "$LOGS_DIR/phase2-startup.log"
nohup bash -c "PORT=3010 node phase2b-express-wrapper.js" >> "$LOGS_DIR/phase2b-express-wrapper.log" 2>&1 &
P2B_PID=$!
echo $P2B_PID > "$MEMORY_DIR/phase2b.pid"
sleep 1

# Start Phase 2C - Trust Score Calculator (Express wrapper)
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting Phase 2C (Trust Score Calculator)" >> "$LOGS_DIR/phase2-startup.log"
nohup bash -c "PORT=3011 node phase2c-express-wrapper.js" >> "$LOGS_DIR/phase2c-express-wrapper.log" 2>&1 &
P2C_PID=$!
echo $P2C_PID > "$MEMORY_DIR/phase2c.pid"
sleep 2

# Verify services are running
STARTUP_OK=true
for service in "phase2a:3009" "phase2b:3010" "phase2c:3011"; do
  service_name=$(echo $service | cut -d: -f1)
  port=$(echo $service | cut -d: -f2)

  if curl -s http://localhost:$port/health >/dev/null 2>&1; then
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $service_name ($port) — READY" >> "$LOGS_DIR/phase2-startup.log"
  else
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $service_name ($port) — FAILED" >> "$LOGS_DIR/phase2-startup.log"
    STARTUP_OK=false
  fi
done

if [ "$STARTUP_OK" = true ]; then
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✅ All Phase 2 services started successfully" >> "$LOGS_DIR/phase2-startup.log"
  exit 0
else
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️ One or more Phase 2 services failed to start" >> "$LOGS_DIR/phase2-startup.log"
  exit 1
fi
