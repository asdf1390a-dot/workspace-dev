#!/bin/bash
# Vercel 배포 헬스체크 — 404 반복 방지 (매 2분마다 실행)
# 목표: 배포 후 자동으로 404 감지 → 즉시 재배포 트리거

VERCEL_URL="https://workspace-dev.vercel.app"
LOG_FILE="memory/logs/deploy-healthcheck.log"
HEALTH_STATE_FILE=".healthcheck-state.json"

# 헬스체크 대상 엔드포인트
ENDPOINTS=("/" "/assets" "/api/backup")
FAILED_COUNT=0
SUCCESS_COUNT=0

# 현재 상태 읽기
if [ -f "$HEALTH_STATE_FILE" ]; then
  LAST_FAILURE=$(jq -r '.last_failure_time // empty' "$HEALTH_STATE_FILE" 2>/dev/null || echo "")
  CONSECUTIVE_FAILURES=$(jq -r '.consecutive_failures // 0' "$HEALTH_STATE_FILE" 2>/dev/null || echo "0")
else
  CONSECUTIVE_FAILURES=0
  LAST_FAILURE=""
fi

# 헬스체크 실행
for endpoint in "${ENDPOINTS[@]}"; do
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL$endpoint" --connect-timeout 5 --max-time 10)

  if [ "$http_code" = "200" ] || [ "$http_code" = "307" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    echo "[✅ $(date '+%Y-%m-%d %H:%M:%S')] $endpoint = $http_code"
  else
    FAILED_COUNT=$((FAILED_COUNT + 1))
    echo "[❌ $(date '+%Y-%m-%d %H:%M:%S')] $endpoint = $http_code (ERROR)"
  fi
done >> "$LOG_FILE"

# 상태 판단
if [ $FAILED_COUNT -gt 0 ]; then
  CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
  LAST_FAILURE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  # 3회 연속 실패 → 재배포 트리거
  if [ $CONSECUTIVE_FAILURES -ge 3 ]; then
    echo "🚨 [CRITICAL] Vercel 404 재발생 감지 (연속 $CONSECUTIVE_FAILURES회) — 자동 재배포 트리거" >> "$LOG_FILE"
    git log --oneline -1 | awk '{print $1}' > /tmp/last_commit.txt
    LAST_COMMIT=$(cat /tmp/last_commit.txt)
    echo "마지막 커밋: $LAST_COMMIT" >> "$LOG_FILE"
    # Vercel 재배포 트리거 (GitHub Actions workflow_dispatch 또는 Vercel webhook)
    curl -X POST https://api.vercel.com/v1/deployments \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"gitSource\": {\"ref\": \"main\", \"repo\": \"asdf1390a-dot/workspace-dev\"}}" \
      2>/dev/null || echo "재배포 트리거 시도 (Vercel Token 필요)" >> "$LOG_FILE"
  fi
else
  CONSECUTIVE_FAILURES=0
  LAST_FAILURE=""
fi

# 상태 저장
python3 << EOF
import json
from datetime import datetime

state = {
  "last_check": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "consecutive_failures": $CONSECUTIVE_FAILURES,
  "last_failure_time": "$LAST_FAILURE",
  "health_status": "CRITICAL" if $FAILED_COUNT > 0 else "OK",
  "endpoints_checked": ${#ENDPOINTS[@]},
  "failures": $FAILED_COUNT,
  "successes": $SUCCESS_COUNT
}

with open("$HEALTH_STATE_FILE", "w") as f:
  json.dump(state, f, indent=2)
EOF

echo "[📊 상태 업데이트] 헬스체크 완료: 성공 $SUCCESS_COUNT / 실패 $FAILED_COUNT | 연속 실패: $CONSECUTIVE_FAILURES회" >> "$LOG_FILE"
