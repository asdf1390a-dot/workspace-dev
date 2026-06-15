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

# Phase 2 서비스 상태 수집 (jq 대신 python 사용)
extract_status() {
  local response="$1"
  echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'DOWN'))" 2>/dev/null || echo "DOWN"
}

PHASE2A_HEALTH=$(extract_status "$(curl -s --connect-timeout 2 http://127.0.0.1:3009/health 2>/dev/null)")
PHASE2B_HEALTH=$(extract_status "$(curl -s --connect-timeout 2 http://127.0.0.1:3010/health 2>/dev/null)")
PHASE2C_HEALTH=$(extract_status "$(curl -s --connect-timeout 2 http://127.0.0.1:3011/health 2>/dev/null)")

# Vercel 프로덕션 배포 4개 P1 모두 검증
# P1: AUDIT, DISCORD-BOT, BM, TRAVEL-P2-UI
VERCEL_AUDIT_HTTP=""
VERCEL_DISCORD_HTTP=""
VERCEL_BM_HTTP=""
VERCEL_TRAVEL_HTTP=""

for attempt in 1 2 3; do
  VERCEL_AUDIT_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 https://dsc-fms-portal.vercel.app/api/audit/health 2>/dev/null)
  VERCEL_DISCORD_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 https://dsc-fms-portal.vercel.app/api/discord/processors 2>/dev/null)
  VERCEL_BM_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 https://dsc-fms-portal.vercel.app/api/bm/breakdowns 2>/dev/null)
  VERCEL_TRAVEL_HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 https://dsc-fms-portal.vercel.app/api/travels 2>/dev/null)

  P1_COUNT=0
  [[ "$VERCEL_AUDIT_HTTP" == "200" ]] && ((P1_COUNT++))
  [[ "$VERCEL_DISCORD_HTTP" == "200" ]] && ((P1_COUNT++))
  [[ "$VERCEL_BM_HTTP" == "200" ]] && ((P1_COUNT++))
  [[ "$VERCEL_TRAVEL_HTTP" =~ ^(200|401)$ ]] && ((P1_COUNT++))  # 401 expected for auth-protected

  if [[ $P1_COUNT -ge 3 ]]; then
    break
  fi
  [[ $attempt -lt 3 ]] && sleep 1
done

P1_OK=0
[[ "$VERCEL_AUDIT_HTTP" == "200" ]] && ((P1_OK++))
[[ "$VERCEL_DISCORD_HTTP" == "200" ]] && ((P1_OK++))
[[ "$VERCEL_BM_HTTP" == "200" ]] && ((P1_OK++))
[[ "$VERCEL_TRAVEL_HTTP" =~ ^(200|401)$ ]] && ((P1_OK++))

if [[ $P1_OK -ge 4 ]]; then
  VERCEL_HEALTH="OK (4/4 P1)"
  VERCEL_HTTP="200"
elif [[ $P1_OK -ge 3 ]]; then
  VERCEL_HEALTH="DEGRADED ($P1_OK/4 P1)"
  VERCEL_HTTP="206"
  log_event "⚠️  WARNING: Vercel partially degraded — $P1_OK/4 P1 operational (AUDIT=$VERCEL_AUDIT_HTTP, DISCORD=$VERCEL_DISCORD_HTTP, BM=$VERCEL_BM_HTTP, TRAVEL=$VERCEL_TRAVEL_HTTP)"
else
  VERCEL_HEALTH="CRITICAL (only $P1_OK/4 P1)"
  VERCEL_HTTP="000"
  log_event "🚨 CRITICAL: Vercel deployment severely degraded — only $P1_OK/4 P1 operational (AUDIT=$VERCEL_AUDIT_HTTP, DISCORD=$VERCEL_DISCORD_HTTP, BM=$VERCEL_BM_HTTP, TRAVEL=$VERCEL_TRAVEL_HTTP)"
fi

# 진행도 계산 (ready/UP 모두 인식)
SERVICES_OK=0
[[ "$PHASE2A_HEALTH" =~ ^(ready|UP)$ ]] && ((SERVICES_OK++))
[[ "$PHASE2B_HEALTH" =~ ^(ready|UP)$ ]] && ((SERVICES_OK++))
[[ "$PHASE2C_HEALTH" =~ ^(ready|UP)$ ]] && ((SERVICES_OK++))
PROGRESS=$((SERVICES_OK * 100 / 3))

# CTB 상태 파일 생성/업데이트 (Vercel 상태 추가 @ P0 fix)
cat > "$CTB_STATE.tmp" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "progress": $PROGRESS,
  "services": {
    "phase2a": "$PHASE2A_HEALTH",
    "phase2b": "$PHASE2B_HEALTH",
    "phase2c": "$PHASE2C_HEALTH"
  },
  "production": {
    "vercel": "$VERCEL_HEALTH",
    "vercel_http": "$VERCEL_HTTP"
  },
  "last_update": "$(date '+%Y-%m-%d %H:%M:%S')"
}
EOF

# 원자성 있게 파일 이동
mv "$CTB_STATE.tmp" "$CTB_STATE" 2>/dev/null || {
  log_event "❌ Failed to update CTB state"
  exit 1
}

# 로그 기록 (Vercel 상태 포함 @ P0 fix)
log_event "✅ CTB updated: $PROGRESS% | Local: Phase2A=$PHASE2A_HEALTH | Phase2B=$PHASE2B_HEALTH | Phase2C=$PHASE2C_HEALTH | Production: Vercel=$VERCEL_HEALTH"

# 진행도 부족 알림
if [[ $PROGRESS -lt 100 ]]; then
  log_event "⚠️  Warning: CTB progress incomplete ($PROGRESS%)"
fi

exit 0
