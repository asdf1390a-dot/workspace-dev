#!/bin/bash

# Phase 2F Pre-Deployment Verification Checklist
# 2026-05-31 17:00 KST 자동 실행
# 담당: Secretary Agent + DevOps Engineer

set -e

BASE_DIR="/home/jeepney/.openclaw/workspace-dev"
MEMORY_DIR="$BASE_DIR/memory"
LOG_DIR="$MEMORY_DIR/logs"
REPORT_FILE="$BASE_DIR/PHASE2F_PRE_DEPLOYMENT_REPORT_20260531_1700.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S KST')

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 점수 추적
TOTAL_CHECKS=0
PASSED_CHECKS=0

log() {
  echo -e "${GREEN}[✓]${NC} $1" | tee -a "$REPORT_FILE"
}

warn() {
  echo -e "${YELLOW}[!]${NC} $1" | tee -a "$REPORT_FILE"
}

fail() {
  echo -e "${RED}[✗]${NC} $1" | tee -a "$REPORT_FILE"
}

check_item() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  local result=$1
  local description=$2

  if [ $result -eq 0 ]; then
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    log "$description"
  else
    fail "$description"
  fi
}

# 보고서 헤더
cat > "$REPORT_FILE" << 'EOF'
---
title: Phase 2F Pre-Deployment Verification Report
date: 2026-05-31 17:00 KST
status: RUNNING
---

# Phase 2F Pre-Deployment Verification Report
**실행 시간:** 2026-05-31 17:00 KST
**담당:** Secretary Agent + DevOps Engineer
**목표:** 모든 선행조건 확인 및 Go/No-Go 판정

---

## 📋 점검 결과

EOF

echo -e "\n${YELLOW}=== Phase 2F Pre-Deployment Verification 시작 ===${NC}\n" | tee -a "$REPORT_FILE"

# Section A: 인프라 준비
echo "### Section A: 인프라 준비" | tee -a "$REPORT_FILE"

# A.1 포트 가용성
echo "#### A.1 포트 가용성 확인" | tee -a "$REPORT_FILE"
if lsof -i :3009 -i :3010 2>/dev/null | grep -q LISTEN; then
  PORT_CHECK=0
else
  PORT_CHECK=1
fi
check_item $PORT_CHECK "포트 3009/3010 LISTEN 상태 확인"
echo "" | tee -a "$REPORT_FILE"

# A.2 시스템 리소스
echo "#### A.2 시스템 리소스 확인" | tee -a "$REPORT_FILE"
DISK_AVAIL=$(df -h / | awk 'NR==2 {print $4}' | sed 's/G//' | sed 's/M//')
if (( $(echo "$DISK_AVAIL > 0.5" | bc -l) )); then
  check_item 0 "디스크 여유 공간: ${DISK_AVAIL}GB"
else
  check_item 1 "디스크 여유 부족: ${DISK_AVAIL}GB"
fi

MEM_AVAIL=$(free -h | awk '/^Mem:/ {print $7}')
check_item 0 "메모리 여유: $MEM_AVAIL"

LOAD=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | tr -d ' ')
check_item 0 "CPU 부하: $LOAD"
echo "" | tee -a "$REPORT_FILE"

# A.3 Node.js 환경
echo "#### A.3 Node.js 환경 확인" | tee -a "$REPORT_FILE"
NODE_VERSION=$(node --version)
check_item 0 "Node.js 설치: $NODE_VERSION"

NPM_VERSION=$(npm --version)
check_item 0 "npm 설치: $NPM_VERSION"

if [ -d "$BASE_DIR/memory-automation/node_modules" ]; then
  check_item 0 "npm 의존성 설치됨"
else
  check_item 1 "npm 의존성 미설치"
fi
echo "" | tee -a "$REPORT_FILE"

# Section B: 배포 스크립트
echo "### Section B: 배포 스크립트 준비" | tee -a "$REPORT_FILE"

# B.1 스크립트 파일 존재
echo "#### B.1 스크립트 파일 존재 확인" | tee -a "$REPORT_FILE"
for script in phase2a-deploy.sh phase2b-deploy.sh phase2c-deploy.sh phase2d-cron.sh phase2e-full-test.sh; do
  if [ -f "$BASE_DIR/memory-automation/$script" ] && [ -x "$BASE_DIR/memory-automation/$script" ]; then
    check_item 0 "$script 실행 권한 확인"
  else
    check_item 1 "$script 누락 또는 권한 없음"
  fi
done
echo "" | tee -a "$REPORT_FILE"

# B.2 스크립트 문법
echo "#### B.2 스크립트 문법 검증" | tee -a "$REPORT_FILE"
for script in phase2a-deploy.sh phase2b-deploy.sh; do
  if bash -n "$BASE_DIR/memory-automation/$script" 2>/dev/null; then
    check_item 0 "$script 문법 OK"
  else
    check_item 1 "$script 문법 오류"
  fi
done
echo "" | tee -a "$REPORT_FILE"

# Section C: 모니터링
echo "### Section C: 모니터링 준비" | tee -a "$REPORT_FILE"

# C.1 Phase 2A Health Check
echo "#### C.1 Phase 2A (Message Collection) Health Check" | tee -a "$REPORT_FILE"
PHASE2A_HEALTH=$(curl -s http://localhost:3009/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$PHASE2A_HEALTH" = "ok" ] || [ "$PHASE2A_HEALTH" = "ready" ] || [ "$PHASE2A_HEALTH" = "healthy" ]; then
  check_item 0 "Phase 2A 상태: $PHASE2A_HEALTH (정상)"
else
  check_item 1 "Phase 2A 상태: $PHASE2A_HEALTH (불안정)"
fi

# C.2 Phase 2B Health Check
echo "#### C.2 Phase 2B (Duplicate Detection) Health Check" | tee -a "$REPORT_FILE"
PHASE2B_HEALTH=$(curl -s http://localhost:3010/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$PHASE2B_HEALTH" = "ok" ] || [ "$PHASE2B_HEALTH" = "ready" ] || [ "$PHASE2B_HEALTH" = "healthy" ]; then
  check_item 0 "Phase 2B 상태: $PHASE2B_HEALTH (정상)"
else
  check_item 1 "Phase 2B 상태: $PHASE2B_HEALTH (불안정)"
fi
echo "" | tee -a "$REPORT_FILE"

# Section D: 알림 채널
echo "### Section D: 알림 채널 준비" | tee -a "$REPORT_FILE"

# D.1 Telegram 확인
echo "#### D.1 Telegram 채널 확인" | tee -a "$REPORT_FILE"
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
  check_item 0 "Telegram 토큰 및 Chat ID 설정됨"

  # 테스트 메시지 발송
  TEST_MSG=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}&text=Phase%202F%20Pre-Deployment%20Verification%20시작" 2>/dev/null)
  if echo "$TEST_MSG" | grep -q '"ok":true'; then
    check_item 0 "Telegram 테스트 메시지 발송 성공"
  else
    check_item 1 "Telegram 메시지 발송 실패"
  fi
else
  warn "Telegram 토큰/Chat ID 미설정 (선택사항)"
fi
echo "" | tee -a "$REPORT_FILE"

# Section E: 로그 & 백업
echo "### Section E: 로그 & 백업 준비" | tee -a "$REPORT_FILE"

# E.1 로그 디렉토리
echo "#### E.1 로그 디렉토리 확인" | tee -a "$REPORT_FILE"
if [ -d "$LOG_DIR" ] && [ -w "$LOG_DIR" ]; then
  check_item 0 "로그 디렉토리: $LOG_DIR (쓰기 권한 OK)"

  LOG_COUNT=$(find "$LOG_DIR" -name "*.log" | wc -l)
  log "로그 파일 개수: $LOG_COUNT개"
else
  check_item 1 "로그 디렉토리 미사용 또는 권한 없음"
fi
echo "" | tee -a "$REPORT_FILE"

# E.2 MEMORY.md 백업
echo "#### E.2 MEMORY.md 백업" | tee -a "$REPORT_FILE"
if [ -f "$MEMORY_DIR/MEMORY.md" ]; then
  BACKUP_FILE="$BASE_DIR/BACKUPS/MEMORY_20260531_1700.md.bak"
  cp "$MEMORY_DIR/MEMORY.md" "$BACKUP_FILE"
  check_item 0 "MEMORY.md 백업 생성: $(basename $BACKUP_FILE)"
else
  check_item 1 "MEMORY.md 파일 미존재"
fi
echo "" | tee -a "$REPORT_FILE"

# Section F: 최종 점수
echo "### Section F: 최종 점수" | tee -a "$REPORT_FILE"
SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

cat >> "$REPORT_FILE" << EOF

**점검 완료:** $PASSED_CHECKS / $TOTAL_CHECKS 항목 통과 ($SCORE%)

---

## 🚀 Go/No-Go 판정

EOF

if [ $SCORE -ge 90 ]; then
  echo "🟢 **결정: GO** — Phase 2F 배포 진행 가능" | tee -a "$REPORT_FILE"
  echo "**근거:** $SCORE% 점검 통과 (90% 이상)" | tee -a "$REPORT_FILE"
  DECISION="GO"
else
  echo "🔴 **결정: NO-GO** — 원인 분석 및 수정 필요" | tee -a "$REPORT_FILE"
  echo "**근거:** $SCORE% 점검 통과 (90% 미만)" | tee -a "$REPORT_FILE"
  DECISION="NO-GO"
fi

cat >> "$REPORT_FILE" << EOF

**실행 시간:** $TIMESTAMP
**담당자:** Secretary Agent
**다음 단계:** 2026-05-31 18:00 KST 배포 시작 (Go 인 경우)

---

**문서 생성:** $(date)
EOF

echo -e "\n${YELLOW}=== Pre-Deployment Verification 완료 ===${NC}\n"
echo "📊 최종 점수: $SCORE% ($PASSED_CHECKS/$TOTAL_CHECKS)"
echo "🎯 판정: $DECISION"
echo "📄 보고서: $REPORT_FILE"

if [ "$DECISION" = "GO" ]; then
  echo -e "\n${GREEN}✅ 배포 준비 완료. 18:00 배포 진행 가능${NC}\n"
  exit 0
else
  echo -e "\n${RED}❌ 배포 준비 미완료. 원인 분석 필요${NC}\n"
  exit 1
fi
