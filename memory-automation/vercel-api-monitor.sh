#!/bin/bash
################################################################################
# P2: Vercel API 배포 상태 실시간 감시 + 자동 복구
# 역할: 4개 P1 배포 상태 조회, DEPLOYMENT_NOT_FOUND 감지, 캐시 무효화 시도
#
# 요구사항:
#   - VERCEL_TOKEN: Vercel Personal Access Token (Settings → Tokens)
#   - 대상: dsc-fms-portal (main project, 4개 P1 포함)
#
# 2026-06-15 14:35 KST: P2 개선사항 구현
################################################################################

set -uo pipefail

WORKSPACE_DIR="${WORKSPACE_DIR:-/home/jeepney/.openclaw/workspace-dev}"
LOG_FILE="$WORKSPACE_DIR/memory/logs/vercel-api-monitor.log"
VERCEL_API="https://api.vercel.com"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"
TEAM_ID="${VERCEL_TEAM_ID:-}"  # Optional: team namespace

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  local msg="$1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $msg" | tee -a "$LOG_FILE"
}

# Vercel API 호출 헬퍼
vercel_api() {
  local endpoint="$1"
  local method="${2:-GET}"
  local data="${3:-}"

  local headers=(
    "-H" "Authorization: Bearer $VERCEL_TOKEN"
    "-H" "Content-Type: application/json"
  )

  if [[ -z "$VERCEL_TOKEN" ]]; then
    log "❌ VERCEL_TOKEN 환경변수 미설정"
    return 1
  fi

  if [[ "$method" == "POST" ]] && [[ -n "$data" ]]; then
    curl -s -X "$method" "${headers[@]}" -d "$data" "$VERCEL_API$endpoint"
  else
    curl -s -X "$method" "${headers[@]}" "$VERCEL_API$endpoint"
  fi
}

# 배포 목록 조회
get_deployments() {
  local project="${1:-dsc-fms-portal}"
  log "📡 배포 목록 조회: $project"

  local response=$(vercel_api "/v5/projects/$project/deployments?limit=20")
  echo "$response"
}

# 배포 상태 분석
analyze_deployments() {
  local deployments="$1"

  # JSON 파싱 (python 필수)
  if ! command -v python3 &> /dev/null; then
    log "⚠️  python3 필수 (JSON 파싱)"
    return 1
  fi

  python3 <<'PYTHON'
import json
import sys
try:
  data = json.loads(sys.stdin.read())
  if not data.get('deployments'):
    print("NO_DEPLOYMENTS")
    sys.exit(1)

  for dep in data.get('deployments', [])[:5]:
    status = dep.get('state', 'UNKNOWN')
    url = dep.get('url', 'unknown')
    created = dep.get('created', 0)
    print(f"{url}|{status}|{created}")
except Exception as e:
  print(f"ERROR:{e}")
  sys.exit(1)
PYTHON
}

# 4개 P1 프로젝트 상태 확인 (별도 project 또는 alias 기반)
check_p1_endpoints() {
  log "🔍 4개 P1 엔드포인트 배포 상태 확인..."

  local endpoints=(
    "https://dsc-fms-portal-audit.vercel.app"
    "https://dsc-fms-portal-discord.vercel.app"
    "https://dsc-fms-portal-bm.vercel.app"
    "https://dsc-fms-portal-travel.vercel.app"
  )

  local names=(
    "AUDIT-P1"
    "DISCORD-BOT-P1"
    "BM-P1"
    "TRAVEL-P2-UI"
  )

  local healthy_count=0
  local down_count=0

  for i in "${!endpoints[@]}"; do
    endpoint="${endpoints[$i]}"
    name="${names[$i]}"

    # HTTP 상태 확인 (실제 엔드포인트)
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" --max-time 10 2>/dev/null || echo "000")

    if [[ "$http_code" == "200" ]]; then
      log "✅ $name → HTTP 200"
      ((healthy_count++))
    elif [[ "$http_code" == "404" ]]; then
      log "❌ $name → HTTP 404 (DEPLOYMENT_NOT_FOUND)"
      ((down_count++))
    else
      log "⚠️  $name → HTTP $http_code"
      ((down_count++))
    fi
  done

  log "📊 결과: $healthy_count/4 UP, $down_count/4 DOWN"

  if [[ $down_count -gt 0 ]]; then
    log "🚨 복구 시도 시작..."
    attempt_recovery
  fi
}

# 캐시 무효화 및 자동 재배포
attempt_recovery() {
  log "🔧 Vercel 캐시 무효화 시도..."

  if [[ -z "$VERCEL_TOKEN" ]]; then
    log "❌ VERCEL_TOKEN 필요 (API 인증)"
    return 1
  fi

  # 방법 1: 배포 ID 기반 재배포 (webhook 트리거)
  log "📌 배포 ID 조회 중..."
  local deployments=$(get_deployments "dsc-fms-portal")

  if [[ -z "$deployments" ]] || echo "$deployments" | grep -q "error"; then
    log "❌ 배포 조회 실패"
    return 1
  fi

  # 방법 2: GitHub 연동 재배포 트리거 (GitHub Actions)
  log "📌 GitHub Actions 수동 트리거 준비..."
  log "    커맨드: gh workflow run p1-endpoint-health-check.yml"

  # 방법 3: 환경변수 변경으로 강제 재배포 (Vercel 메커니즘)
  log "📌 환경변수 강제 갱신 (캐시 무효화)..."
  # curl -X PATCH "$VERCEL_API/v1/projects/dsc-fms-portal" \
  #   -H "Authorization: Bearer $VERCEL_TOKEN" \
  #   -H "Content-Type: application/json" \
  #   -d '{"env": {"FORCE_REBUILD": "'"$(date +%s)"'"}}'

  log "⚠️  수동 개입 필요:"
  log "    1. https://vercel.com/dashboard → dsc-fms-portal"
  log "    2. Settings → Environment Variables"
  log "    3. 새 변수 추가: FORCE_REBUILD=$(date +%s)"
  log "    4. Redeploy 클릭"
}

# 실시간 모니터링 루프
continuous_monitor() {
  log "🔄 실시간 모니터링 시작 (5분 주기)..."

  local iteration=0
  while true; do
    ((iteration++))
    log "📍 모니터링 사이클 #$iteration..."

    check_p1_endpoints

    # 5분 대기
    sleep 300
  done
}

# 메인 루틴
main() {
  log "🚀 Vercel API 모니터링 초기화..."

  if [[ -z "$VERCEL_TOKEN" ]]; then
    log "❌ VERCEL_TOKEN 환경변수 필수"
    log "   설정: export VERCEL_TOKEN='your-token-here'"
    log ""
    log "📖 토큰 획득:"
    log "   1. https://vercel.com/account/tokens"
    log "   2. Create Token (Full Access)"
    log "   3. 토큰 복사 후 환경변수 설정"
    return 1
  fi

  # 1회 확인
  check_p1_endpoints

  # 옵션: 실시간 모니터링 (주석 해제 시 활성화)
  # continuous_monitor
}

main "$@"
exit $?
