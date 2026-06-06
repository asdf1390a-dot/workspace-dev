#!/bin/bash
# CTB Auto-Update — Continuous Task Board 5분 주기 폴링
# 역할: 진행 중인 작업 상태 동기화 및 진행도 업데이트

WORKSPACE_DIR="/home/jeepney/.openclaw/workspace-dev"
LOG_DIR="$WORKSPACE_DIR/memory/logs"
CTB_LOG="$LOG_DIR/ctb-auto-update.log"
CTB_STATE="$WORKSPACE_DIR/.ctb-state.json"

mkdir -p "$LOG_DIR"

log_event() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$CTB_LOG"
}

log_event "🔄 CTB Auto-Update 폴링 시작..."

# Phase 2 서비스 상태 수집
PHASE2A_HEALTH=$(curl -s --connect-timeout 2 http://127.0.0.1:3009/health 2>/dev/null | jq -r '.status // "DOWN"')
PHASE2B_HEALTH=$(curl -s --connect-timeout 2 http://127.0.0.1:3010/health 2>/dev/null | jq -r '.status // "DOWN"')
PHASE2C_HEALTH=$(curl -s --connect-timeout 2 http://127.0.0.1:3011/health 2>/dev/null | jq -r '.status // "DOWN"')

# 진행도 계산
SERVICES_OK=0
[[ "$PHASE2A_HEALTH" == "UP" ]] && ((SERVICES_OK++))
[[ "$PHASE2B_HEALTH" == "UP" ]] && ((SERVICES_OK++))
[[ "$PHASE2C_HEALTH" == "UP" ]] && ((SERVICES_OK++))
PROGRESS=$((SERVICES_OK * 100 / 3))

# CTB 상태 파일 생성/업데이트
cat > "$CTB_STATE.tmp" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "progress": $PROGRESS,
  "services": {
    "phase2a": "$PHASE2A_HEALTH",
    "phase2b": "$PHASE2B_HEALTH",
    "phase2c": "$PHASE2C_HEALTH"
  },
  "last_update": "$(date '+%Y-%m-%d %H:%M:%S')"
}
EOF

# 원자성 있게 파일 이동
mv "$CTB_STATE.tmp" "$CTB_STATE" 2>/dev/null || {
  log_event "❌ Failed to update CTB state"
  exit 1
}

# 로그 기록
log_event "✅ CTB updated: $PROGRESS% (Phase2A: $PHASE2A_HEALTH | Phase2B: $PHASE2B_HEALTH | Phase2C: $PHASE2C_HEALTH)"

# 진행도 부족 알림
if [[ $PROGRESS -lt 100 ]]; then
  log_event "⚠️  Warning: CTB progress incomplete ($PROGRESS%)"
fi

exit 0
