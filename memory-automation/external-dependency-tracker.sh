#!/bin/bash
################################################################################
# 외부 의존 작업 자동 추적 (P1 개선사항)
# 역할: 30분 이상 블로킹된 외부 의존 작업을 감지하고 자동 알림
#
# 추적 항목:
#   - db/[N] 마이그레이션 (Supabase 수동 실행 필요)
#   - 기타 사용자 액션 필요 작업
#
# 2026-06-15 추가: BLOCKED_ON_USER 추적 시스템
################################################################################

set -uo pipefail

WORKSPACE_DIR="${WORKSPACE_DIR:-/home/jeepney/.openclaw/workspace-dev}"
MEMORY_DIR="$WORKSPACE_DIR/memory"
LOG_FILE="$MEMORY_DIR/logs/external-dependency-tracker.log"
TRACKER_FILE="$MEMORY_DIR/.external-dependency-tracker.json"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  local msg="$1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" >> "$LOG_FILE"
}

# 외부 의존 항목 초기화 또는 읽기
init_tracker() {
  if [[ ! -f "$TRACKER_FILE" ]]; then
    cat > "$TRACKER_FILE" << 'EOF'
{
  "blockers": [],
  "last_check": "",
  "alerts_sent": 0
}
EOF
    log "✅ 추적 파일 초기화됨"
  fi
}

# 외부 의존 항목 등록 (언제 시작되었는지 기록)
register_blocker() {
  local blocker_name="$1"
  local blocker_type="$2"  # "db_migration", "user_action", 등
  local description="$3"

  local tracker=$(cat "$TRACKER_FILE")
  local start_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  # 새 블로커 추가
  tracker=$(echo "$tracker" | python3 << EOF
import sys, json
tracker = json.load(sys.stdin)
tracker['blockers'].append({
  'name': '$blocker_name',
  'type': '$blocker_type',
  'description': '$description',
  'start_time': '$start_time',
  'duration_minutes': 0,
  'alerted': False
})
print(json.dumps(tracker, indent=2))
EOF
)

  echo "$tracker" > "$TRACKER_FILE"
  log "📌 블로커 등록: $blocker_name ($blocker_type) — $description"
}

# 블로커 해제
resolve_blocker() {
  local blocker_name="$1"

  local tracker=$(cat "$TRACKER_FILE")
  tracker=$(echo "$tracker" | python3 << EOF
import sys, json
tracker = json.load(sys.stdin)
tracker['blockers'] = [b for b in tracker['blockers'] if b['name'] != '$blocker_name']
print(json.dumps(tracker, indent=2))
EOF
)

  echo "$tracker" > "$TRACKER_FILE"
  log "✅ 블로커 해제: $blocker_name"
}

# 블로커 모니터링 및 자동 알림
check_blockers() {
  init_tracker

  local tracker=$(cat "$TRACKER_FILE")
  local now=$(date +%s)
  local threshold_seconds=$((30 * 60))  # 30분

  local alerts_needed=false
  local alert_message=""

  tracker=$(echo "$tracker" | python3 << EOF
import sys, json, time
tracker = json.load(sys.stdin)
now = $now

for blocker in tracker['blockers']:
    start = int(time.mktime(time.strptime(blocker['start_time'], '%Y-%m-%dT%H:%M:%SZ')))
    duration_sec = now - start
    duration_min = duration_sec // 60
    blocker['duration_minutes'] = duration_min

    if duration_min >= 30 and not blocker['alerted']:
        blocker['alerted'] = True
        tracker['alerts_sent'] += 1

print(json.dumps(tracker, indent=2))
EOF
)

  echo "$tracker" > "$TRACKER_FILE"

  # 30분 이상 블로킹된 항목 확인
  local blocked_items=$(echo "$tracker" | python3 << EOF
import sys, json
tracker = json.load(sys.stdin)
blocked = [b for b in tracker['blockers'] if b['duration_minutes'] >= 30]
for b in blocked:
    print(f"{b['name']} ({b['duration_minutes']}분 블로킹)")
EOF
)

  if [[ -n "$blocked_items" ]]; then
    alert_message="🔴 외부 의존 30분 초과: $blocked_items"
    log "$alert_message"
    return 1
  else
    log "✅ 모든 외부 의존 항목 정상 (30분 이내)"
    return 0
  fi
}

# 메모리 파일에 알림 기록
alert_to_memory() {
  local alert_msg="$1"
  local memory_alert_file="$MEMORY_DIR/EXTERNAL_DEPENDENCY_ALERTS.md"

  if [[ ! -f "$memory_alert_file" ]]; then
    cat > "$memory_alert_file" << 'EOF'
# 🔴 외부 의존 작업 알림

자동으로 생성된 알림 목록입니다. 30분 이상 블로킹된 항목은 아래에 표시됩니다.

## 활성 알림

EOF
  fi

  echo "- **$(TZ='Asia/Seoul' date '+%Y-%m-%d %H:%M KST')** $alert_msg" >> "$memory_alert_file"
  log "📝 메모리에 알림 기록됨: $alert_msg"
}

# 메인 루틴
main() {
  log "🔄 외부 의존 추적 시작..."
  init_tracker

  # 현재 활성 블로커 확인
  if ! check_blockers; then
    local blocked_items=$(cat "$TRACKER_FILE" | python3 << EOF
import sys, json
tracker = json.load(sys.stdin)
blocked = [b for b in tracker['blockers'] if b['duration_minutes'] >= 30 and b['alerted']]
for b in blocked:
    alert_to_memory(f"{b['name']} ({b['duration_minutes']}분 블로킹)")
EOF
)
  fi

  log "✅ 외부 의존 추적 완료"
}

main "$@"
exit $?
