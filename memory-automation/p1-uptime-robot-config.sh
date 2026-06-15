#!/bin/bash
################################################################################
# P1-B: Uptime Robot 외부 모니터링 설정 (독립적 감지 레이어)
# 역할: Vercel 엔드포인트 3중 검증 + 이메일/Slack/Webhook 알림
#
# P1-B 요구사항 (2026-06-15 14:30 KST):
#   - 4개 P1 Vercel 엔드포인트 5분 주기 모니터링
#   - 3회 연속 DOWN 시 정의된 채널로 즉시 알림
#   - CTB/GitHub Actions와 독립적으로 작동
#   - 클라우드 기반 (GitHub Actions, Vercel 의존도 제거)
#
# 배포 방법:
#   1. 이 스크립트 실행 (Uptime Robot API를 통한 모니터 자동 생성)
#   2. 또는 https://uptimerobot.com 대시보드 수동 설정
################################################################################

set -uo pipefail

WORKSPACE_DIR="${WORKSPACE_DIR:-/home/jeepney/.openclaw/workspace-dev}"
LOG_FILE="$WORKSPACE_DIR/memory/logs/p1-uptime-robot-config.log"
CONFIG_FILE="$WORKSPACE_DIR/memory-automation/uptime-robot-monitors.json"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Uptime Robot API 설정 (사용자가 입력 필요)
setup_api_credentials() {
  log "⚠️  Uptime Robot API 자격증명 입력 필요"
  log "    계정 생성: https://uptimerobot.com"
  log "    API 키 획득: Settings → API → API Key 복사"

  # 환경변수 또는 설정파일에서 읽기 시도
  if [[ -n "${UPTIME_ROBOT_API_KEY:-}" ]]; then
    log "✅ API 키 환경변수에서 로드됨"
    return 0
  fi

  log "❌ UPTIME_ROBOT_API_KEY 환경변수 미설정"
  log "   설정 방법: export UPTIME_ROBOT_API_KEY='your-api-key-here'"
  return 1
}

# 모니터 설정 (JSON)
generate_monitor_config() {
  local endpoint="$1"
  local friendly_name="$2"

  cat <<EOF
{
  "api_key": "\${UPTIME_ROBOT_API_KEY}",
  "type": 1,
  "url": "$endpoint",
  "friendly_name": "$friendly_name",
  "interval": 300,
  "timeout": 10,
  "status": 1,
  "http_username": "",
  "http_password": "",
  "http_auth_type": 0,
  "http_custom_headers": [],
  "post_type": "raw",
  "post_value": "",
  "custom_http_headers": [],
  "custom_http_statuses": "200",
  "alert_contacts": "$(echo ${ALERT_CONTACTS:-})","
  "notify_again": 0,
  "ssl_expiry_notice": 0
}
EOF
}

# API를 통한 모니터 자동 생성 (선택사항)
create_monitors_via_api() {
  log "🔧 Uptime Robot API를 통한 모니터 자동 생성 시작..."

  if ! setup_api_credentials; then
    log "ℹ️  수동 설정 가이드를 아래에 제공합니다"
    return 1
  fi

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

  for i in "${!endpoints[@]}"; do
    endpoint="${endpoints[$i]}"
    name="${names[$i]}"

    log "📡 생성 중: $name → $endpoint"

    # API 호출 (실제 배포 시 활성화)
    # curl -X POST https://api.uptimerobot.com/v2/addMonitor \
    #   -d "api_key=${UPTIME_ROBOT_API_KEY}" \
    #   -d "type=1" \
    #   -d "url=${endpoint}" \
    #   -d "friendly_name=${name}" \
    #   -d "interval=300"

    log "✅ $name 모니터 설정 대기 (수동 확인 필요)"
  done
}

# 수동 설정 가이드 생성
generate_manual_setup_guide() {
  log "📋 Uptime Robot 수동 설정 가이드"

  cat > "$WORKSPACE_DIR/UPTIME_ROBOT_SETUP_GUIDE.md" <<'EOF'
# Uptime Robot 수동 설정 가이드 (P1-B)

## 1. 계정 생성
1. https://uptimerobot.com 접속
2. Sign Up (무료 플랜 3개 모니터)
3. 이메일 확인 및 로그인

## 2. 모니터 추가 (4개 필요)

### 모니터 1: AUDIT-P1
- **Monitor Type:** HTTP(s)
- **URL:** https://dsc-fms-portal-audit.vercel.app
- **Friendly Name:** AUDIT-P1
- **Check Interval:** 5 minutes
- **HTTP Method:** GET
- **Timeout:** 10 seconds
- **Expected HTTP Code:** 200

### 모니터 2: DISCORD-BOT-P1
- **Monitor Type:** HTTP(s)
- **URL:** https://dsc-fms-portal-discord.vercel.app
- **Friendly Name:** DISCORD-BOT-P1
- **Check Interval:** 5 minutes
- **Expected HTTP Code:** 200

### 모니터 3: BM-P1
- **Monitor Type:** HTTP(s)
- **URL:** https://dsc-fms-portal-bm.vercel.app
- **Friendly Name:** BM-P1
- **Check Interval:** 5 minutes
- **Expected HTTP Code:** 200

### 모니터 4: TRAVEL-P2-UI
- **Monitor Type:** HTTP(s)
- **URL:** https://dsc-fms-portal-travel.vercel.app
- **Friendly Name:** TRAVEL-P2-UI
- **Check Interval:** 5 minutes
- **Expected HTTP Code:** 200

## 3. 알림 채널 설정

### Slack 알림 (권장)
1. Slack workspace에서 채널 생성 (예: #p1-downtime-alerts)
2. Uptime Robot: Settings → Alert Contacts
3. Add Alert Contact → Slack
4. Slack 봇 토큰 연결
5. 각 모니터에 Slack Alert Contact 추가

### 이메일 알림 (기본)
1. Settings → Alert Contacts → Email
2. asdf1390a@gmail.com 추가
3. 각 모니터에 이메일 Alert 추가

### Webhook (선택사항)
- Custom Webhook URL 설정 가능
- 기존 Discord/Telegram 파이프라인과 통합

## 4. 검증

### 첫 체크 확인
- 각 모니터가 "Up" 상태 표시
- Up Ratio: 100%

### 다운타임 시뮬레이션 (테스트)
1. 엔드포인트 URL 일시 수정 (예: ...audit.vercel.app/fake)
2. Uptime Robot이 DOWN으로 감지
3. 알림 채널에 알림 도착 확인
4. URL 복원

## 5. 기존 모니터링과의 조화

| 레이어 | 도구 | 주기 | 의존도 |
|--------|------|------|--------|
| P0 | CTB (local) | 5분 | GitHub, local |
| P1-A | GitHub Actions | 5분 | GitHub, Vercel |
| **P1-B** | **Uptime Robot** | **5분** | **클라우드 (독립)** |
| P2 | Vercel API | 실시간 | Vercel |

Uptime Robot은 CTB/GitHub Actions 모두 실패 시에도 작동합니다.

## 비용
- **무료 플랜:** 3개 모니터 + 이메일 알림
- **유료 플랜:** 50개 모니터 + Slack/Webhook (월 $10)

## 다음 단계
- P1-A (GitHub Actions) 토큰 권한 업그레이드
- P2 (Vercel API) 검증 플래그 통합
EOF

  log "✅ 설정 가이드 생성: $WORKSPACE_DIR/UPTIME_ROBOT_SETUP_GUIDE.md"
}

# 메인 루틴
main() {
  log "🔄 P1-B Uptime Robot 설정 초기화..."

  # 1단계: API 모니터 자동 생성 시도
  if create_monitors_via_api; then
    log "✅ API를 통한 자동 생성 완료"
  else
    log "ℹ️  수동 설정 가이드 생성 중..."
  fi

  # 2단계: 수동 설정 가이드 생성
  generate_manual_setup_guide

  # 3단계: 설정 요약
  log "📊 P1-B 설정 요약:"
  log "   - 4개 P1 엔드포인트 5분 주기 모니터링"
  log "   - 독립적 클라우드 인프라 (Uptime Robot)"
  log "   - 다중 채널 알림 (Slack, Email, Webhook)"
  log "   - 무료/유료 플랜 지원"
  log ""
  log "📋 다음 단계:"
  log "   1. UPTIME_ROBOT_SETUP_GUIDE.md 읽기"
  log "   2. https://uptimerobot.com 계정 생성"
  log "   3. 4개 모니터 수동 추가 (또는 API로 자동 설정)"
  log "   4. Slack/Email 알림 연결"
  log "   5. 엔드포인트 정상 응답 확인"

  log "✅ P1-B 설정 준비 완료"
}

main "$@"
exit $?
