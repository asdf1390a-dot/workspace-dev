#!/bin/bash
# Organization Status & Task Status — 30분 주기 스냅샷
# 생성 주기: 매 30분 (00분, 30분)

WORKSPACE_DIR="/home/jeepney/.openclaw/workspace-dev"
LOG_DIR="$WORKSPACE_DIR/memory/logs"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
TIMESTAMP_SHORT=$(date '+%H%M')

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/org-status-snapshot.log"

log_event() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log_event "🔄 조직도 & 업무현황 스냅샷 생성 시작..."

# Phase 2 서비스 상태 조회
P2A_STATUS=$(curl -s http://127.0.0.1:3009/health 2>/dev/null | jq -r '.status // "DOWN"')
P2B_STATUS=$(curl -s http://127.0.0.1:3010/health 2>/dev/null | jq -r '.status // "DOWN"')
P2C_STATUS=$(curl -s http://127.0.0.1:3011/health 2>/dev/null | jq -r '.status // "DOWN"')

# 리소스 체크
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}')
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.1f%%", ($3/$2)*100)}')
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | xargs)

# 스냅샷 생성
SNAPSHOT="{
  \"timestamp\": \"$TIMESTAMP\",
  \"phase2_services\": {
    \"phase2a_message_collection\": \"$P2A_STATUS\",
    \"phase2b_duplicate_detection\": \"$P2B_STATUS\",
    \"phase2c_trust_score\": \"$P2C_STATUS\"
  },
  \"system_resources\": {
    \"disk_usage\": \"$DISK_USAGE\",
    \"memory_usage\": \"$MEMORY_USAGE\",
    \"load_average\": \"$LOAD_AVG\"
  }
}"

# 파일로 저장
OUTPUT_FILE="$WORKSPACE_DIR/ORGANIZATION_STATUS_SNAPSHOT_$(date '+%Y_%m_%d_%H%M').json"
echo "$SNAPSHOT" | jq '.' > "$OUTPUT_FILE" 2>/dev/null

log_event "✅ 스냅샷 완료: $OUTPUT_FILE"
log_event "  Phase2A: $P2A_STATUS | Phase2B: $P2B_STATUS | Phase2C: $P2C_STATUS"
log_event "  Disk: $DISK_USAGE | Memory: $MEMORY_USAGE | Load: $LOAD_AVG"
