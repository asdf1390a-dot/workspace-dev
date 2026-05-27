# Cron Automation Deployment Checklist

**작성일:** 2026-05-27 19:40 KST  
**목표:** Phase 2A/2B/C Cron Job 배포 & 검증  
**기한:** 2026-06-02 18:00 KST  
**실행자:** Automation Specialist (Team)

---

## 📋 Pre-Deployment (2026-05-27 ~ 05-28)

### ✅ 환경 준비

#### 1.1 Node.js & npm 확인
```bash
node --version    # v16+ 확인
npm --version     # v8+ 확인
npm list -g npm   # 최신 버전 확인
```

**체크박스:**
- [ ] Node.js v16+ 설치됨
- [ ] npm v8+ 설치됨
- [ ] PATH 설정 완료

**예상 출력:**
```
v18.x.x
9.x.x
```

#### 1.2 필수 디렉토리 생성
```bash
# 로그 디렉토리
mkdir -p /home/jeepney/.openclaw/workspace-dev/memory/logs
chmod 755 /home/jeepney/.openclaw/workspace-dev/memory/logs

# 캐시 디렉토리
mkdir -p /tmp/embedding_cache
chmod 777 /tmp/embedding_cache

# 스크립트 디렉토리
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
ls -la
```

**체크박스:**
- [ ] `/memory/logs` 생성됨
- [ ] `/tmp/embedding_cache` 생성됨
- [ ] 권한 설정 완료 (755)

#### 1.3 환경 변수 설정
```bash
# ~/.bashrc 또는 ~/.profile에 추가
export ANTHROPIC_API_KEY="sk-ant-..."
export GATEWAY_URL="http://localhost:3000"
export GATEWAY_TOKEN="your-token-here"
export MEMORY_DIR="/home/jeepney/.openclaw/workspace-dev/memory"
export PORT_2A=3009
export PORT_2B=3010
export PORT_2C=3011

# 적용
source ~/.bashrc
```

**검증:**
```bash
echo $ANTHROPIC_API_KEY    # 출력 확인
echo $MEMORY_DIR           # /home/... 확인
```

**체크박스:**
- [ ] ANTHROPIC_API_KEY 설정됨
- [ ] MEMORY_DIR 설정됨
- [ ] 포트 변수 설정됨

#### 1.4 npm 의존성 설치
```bash
cd /home/jeepney/.openclaw/workspace-dev/memory-automation
npm install
npm list  # 설치 확인
```

**예상 출력:**
```
memory-automation-api@2.0.0
├── express@4.18.2
└── (devDependencies)
```

**체크박스:**
- [ ] npm install 완료
- [ ] package-lock.json 생성됨
- [ ] node_modules 디렉토리 생성됨

---

### ✅ 서비스 상태 확인 (Phase 2A/2B/C)

#### 2.1 Phase 2A (Message Collection) 확인
```bash
# 포트 3009에서 실행 중인지 확인
curl http://localhost:3009/health

# 출력 예:
# {"status":"ready","timestamp":"2026-05-27T10:30:00Z","uptime":3600}
```

**체크박스:**
- [ ] Phase 2A 서비스 구동 중
- [ ] Health 엔드포인트 200 응답
- [ ] 포트 3009 개방

#### 2.2 Phase 2B (Duplicate Detection) 확인
```bash
curl http://localhost:3010/health

# 출력 예:
# {"status":"ready","timestamp":"2026-05-27T10:30:00Z","uptime":3600}
```

**체크박스:**
- [ ] Phase 2B 서비스 구동 중
- [ ] Health 엔드포인트 200 응답
- [ ] 포트 3010 개방
- [ ] 54개 테스트 통과 (npm test)

#### 2.3 Phase 2C (Trust Score) 확인
```bash
curl http://localhost:3011/health

# 또는 스크립트가 아직 없으면
ls -la /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2c*
```

**체크박스:**
- [ ] Phase 2C 서비스 구동 중 (또는 구현 확인)
- [ ] 포트 3011 개방

---

## 📝 Cron 스크립트 배포 (2026-05-28)

### ✅ Step 1: Job A (Message Collection) 배포

#### 1.1 스크립트 작성
```bash
cat > /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2a-cron.sh << 'EOF'
#!/bin/bash
################################################################################
# Phase 2A Cron Job - Message Collection (6시간 주기)
# 주기: 00:00, 06:00, 12:00, 18:00 KST
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MEMORY_DIR="/home/jeepney/.openclaw/workspace-dev/memory"
LOG_DIR="$MEMORY_DIR/logs"
PHASE2A_URL="http://localhost:3009"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="$LOG_DIR/phase2a-cron-$(date +%Y%m%d).log"

mkdir -p "$LOG_DIR"

echo "[$TIMESTAMP] Starting Phase 2A Cron Job..." >> "$LOG_FILE"

# 헬스 체크 (최대 3회 재시도)
success=0
for attempt in {1..3}; do
  if curl -s -m 5 "$PHASE2A_URL/health" > /dev/null 2>&1; then
    echo "[$TIMESTAMP] Phase 2A service running ✓" >> "$LOG_FILE"
    success=1
    break
  elif [[ $attempt -eq 3 ]]; then
    echo "[$TIMESTAMP] ERROR: Phase 2A service not responding after 3 attempts" >> "$LOG_FILE"
    exit 1
  else
    echo "[$TIMESTAMP] Health check attempt $attempt failed, retrying..." >> "$LOG_FILE"
    sleep 5
  fi
done

if [[ $success -eq 0 ]]; then
  echo "[$TIMESTAMP] ERROR: Failed to connect to Phase 2A service" >> "$LOG_FILE"
  exit 1
fi

# 메시지 수집 요청
echo "[$TIMESTAMP] Requesting message collection..." >> "$LOG_FILE"

RESPONSE=$(timeout 300 curl -s -X POST "$PHASE2A_URL/api/collect-and-deduplicate" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null || echo '{"success": false, "error": "Request timeout"}')

SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
COUNT=$(echo "$RESPONSE" | jq -r '.messagesCollected // 0')

if [[ "$SUCCESS" == "true" ]]; then
  echo "[$TIMESTAMP] ✓ SUCCESS: $COUNT messages collected" >> "$LOG_FILE"
  exit 0
else
  echo "[$TIMESTAMP] ✗ FAILED: $ERROR" >> "$LOG_FILE"
  exit 1
fi
EOF

chmod +x /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2a-cron.sh
```

**체크박스:**
- [ ] 스크립트 파일 생성됨
- [ ] 파일 크기 >500 bytes
- [ ] 실행 권한 755 설정됨

#### 1.2 수동 실행 테스트
```bash
/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2a-cron.sh

# 로그 확인
tail -20 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a-cron-$(date +%Y%m%d).log
```

**체크박스:**
- [ ] 스크립트 오류 없이 실행됨
- [ ] 로그 파일 생성됨
- [ ] 성공 메시지 기록됨
- [ ] 실행 시간 <5분

**예상 로그:**
```
[2026-05-28 14:30:00] Starting Phase 2A Cron Job...
[2026-05-28 14:30:01] Phase 2A service running ✓
[2026-05-28 14:30:02] Requesting message collection...
[2026-05-28 14:30:05] ✓ SUCCESS: 42 messages collected
```

---

### ✅ Step 2: Job B (Duplicate Detection) 배포

#### 2.1 스크립트 작성
```bash
cat > /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2b-cron.sh << 'EOF'
#!/bin/bash
################################################################################
# Phase 2B Cron Job - Duplicate Detection (4시간 주기)
# 주기: 02:00, 06:00, 10:00, 14:00, 18:00, 22:00 KST
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MEMORY_DIR="/home/jeepney/.openclaw/workspace-dev/memory"
LOG_DIR="$MEMORY_DIR/logs"
PHASE2B_URL="http://localhost:3010"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="$LOG_DIR/phase2b-cron-$(date +%Y%m%d).log"

mkdir -p "$LOG_DIR"

echo "[$TIMESTAMP] Starting Phase 2B Cron Job..." >> "$LOG_FILE"

# 헬스 체크 (최대 3회 재시도)
success=0
for attempt in {1..3}; do
  if curl -s -m 5 "$PHASE2B_URL/health" > /dev/null 2>&1; then
    echo "[$TIMESTAMP] Phase 2B service running ✓" >> "$LOG_FILE"
    success=1
    break
  elif [[ $attempt -eq 3 ]]; then
    echo "[$TIMESTAMP] ERROR: Phase 2B service not responding after 3 attempts" >> "$LOG_FILE"
    exit 1
  else
    echo "[$TIMESTAMP] Health check attempt $attempt failed, retrying..." >> "$LOG_FILE"
    sleep 5
  fi
done

if [[ $success -eq 0 ]]; then
  echo "[$TIMESTAMP] ERROR: Failed to connect to Phase 2B service" >> "$LOG_FILE"
  exit 1
fi

# 메모리 파일 수집
MEMORY_FILES=$(find "$MEMORY_DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l)
echo "[$TIMESTAMP] Found $MEMORY_FILES memory files" >> "$LOG_FILE"

# 중복 감지 요청
echo "[$TIMESTAMP] Requesting duplicate detection..." >> "$LOG_FILE"

RESPONSE=$(timeout 180 curl -s -X POST "$PHASE2B_URL/api/detect-duplicates" \
  -H "Content-Type: application/json" \
  -d "{\"memoryDir\": \"$MEMORY_DIR\"}" 2>/dev/null || echo '{"success": false, "error": "Request timeout"}')

SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
CLUSTERS=$(echo "$RESPONSE" | jq -r '.duplicateClusters | length // 0')
EXEC_TIME=$(echo "$RESPONSE" | jq -r '.executionTime // 0')

if [[ "$SUCCESS" == "true" ]]; then
  echo "[$TIMESTAMP] ✓ SUCCESS: Found $CLUSTERS clusters across $MEMORY_FILES files in ${EXEC_TIME}ms" >> "$LOG_FILE"
  exit 0
else
  echo "[$TIMESTAMP] ✗ FAILED: $ERROR" >> "$LOG_FILE"
  exit 1
fi
EOF

chmod +x /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2b-cron.sh
```

**체크박스:**
- [ ] 스크립트 파일 생성됨
- [ ] 파일 크기 >500 bytes
- [ ] 실행 권한 755 설정됨

#### 2.2 수동 실행 테스트
```bash
/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2b-cron.sh

# 로그 확인
tail -20 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2b-cron-$(date +%Y%m%d).log
```

**체크박스:**
- [ ] 스크립트 오류 없이 실행됨
- [ ] 로그 파일 생성됨
- [ ] 중복 감지 결과 기록됨
- [ ] 실행 시간 <3분

**예상 로그:**
```
[2026-05-28 14:35:00] Starting Phase 2B Cron Job...
[2026-05-28 14:35:01] Phase 2B service running ✓
[2026-05-28 14:35:02] Found 87 memory files
[2026-05-28 14:35:03] Requesting duplicate detection...
[2026-05-28 14:35:05] ✓ SUCCESS: Found 5 clusters across 87 files in 1250ms
```

---

### ✅ Step 3: Job C (Monitoring) 배포

#### 3.1 스크립트 작성
```bash
cat > /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2c-monitoring-cron.sh << 'EOF'
#!/bin/bash
################################################################################
# Phase 2C Cron Job - Monitoring & Health Check (매시간)
# 주기: 00:00, 01:00, 02:00, ... 23:00 KST
################################################################################

set -euo pipefail

MEMORY_DIR="/home/jeepney/.openclaw/workspace-dev/memory"
LOG_DIR="$MEMORY_DIR/logs"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
HEALTH_LOG="$LOG_DIR/cron-health-$(date +%Y%m%d).log"

mkdir -p "$LOG_DIR"

echo "[$TIMESTAMP] Starting monitoring check..." >> "$HEALTH_LOG"

# 서비스 체크
declare -A services=(
  ["Phase2A"]="http://localhost:3009/health"
  ["Phase2B"]="http://localhost:3010/health"
  ["Phase2C"]="http://localhost:3011/health"
)

failed=0
for service in "${!services[@]}"; do
  url="${services[$service]}"
  
  if curl -s -m 5 "$url" > /dev/null 2>&1; then
    echo "[$TIMESTAMP] $service: OK ✓" >> "$HEALTH_LOG"
  else
    echo "[$TIMESTAMP] $service: FAILED ✗" >> "$HEALTH_LOG"
    ((failed++))
  fi
done

# 알림 발송
if [[ $failed -gt 0 ]]; then
  echo "[$TIMESTAMP] WARNING: $failed service(s) down" >> "$HEALTH_LOG"
  exit 1
else
  echo "[$TIMESTAMP] All services healthy ✓" >> "$HEALTH_LOG"
  exit 0
fi
EOF

chmod +x /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2c-monitoring-cron.sh
```

**체크박스:**
- [ ] 스크립트 파일 생성됨
- [ ] 파일 크기 >300 bytes
- [ ] 실행 권한 755 설정됨

#### 3.2 수동 실행 테스트
```bash
/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2c-monitoring-cron.sh

# 로그 확인
tail -20 /home/jeepney/.openclaw/workspace-dev/memory/logs/cron-health-$(date +%Y%m%d).log
```

**체크박스:**
- [ ] 스크립트 오류 없이 실행됨
- [ ] 로그 파일 생성됨
- [ ] 서비스 상태 기록됨
- [ ] 실행 시간 <30초

**예상 로그:**
```
[2026-05-28 14:40:00] Starting monitoring check...
[2026-05-28 14:40:01] Phase2A: OK ✓
[2026-05-28 14:40:02] Phase2B: OK ✓
[2026-05-28 14:40:03] Phase2C: FAILED ✗
[2026-05-28 14:40:03] WARNING: 1 service(s) down
```

---

## 🔧 Cron 작업 등록 (2026-05-29)

### ✅ OpenClaw Cron Tool 등록

#### Option 1: mcp__openclaw__cron Tool 사용 (권장)

**Job A: Message Collection (6시간 주기)**

```bash
# 수동 등록 (또는 스크립트에서 호출)
curl -X POST http://localhost:3000/cron \
  -H "Authorization: Bearer $GATEWAY_TOKEN" \
  -d '{
    "job": {
      "name": "Memory Automation - Phase 2A Collection",
      "description": "6-hourly message collection from Telegram, Discord, GitHub",
      "schedule": {
        "kind": "cron",
        "expr": "0 0,6,12,18 * * *",
        "tz": "Asia/Seoul"
      },
      "payload": {
        "kind": "agentTurn",
        "message": "/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2a-cron.sh"
      },
      "delivery": {
        "mode": "announce",
        "channel": "telegram",
        "to": "@memory_automation_bot"
      }
    }
  }'
```

**Job B: Duplicate Detection (4시간 주기)**

```bash
curl -X POST http://localhost:3000/cron \
  -H "Authorization: Bearer $GATEWAY_TOKEN" \
  -d '{
    "job": {
      "name": "Memory Automation - Phase 2B Detection",
      "description": "4-hourly duplicate detection across memory files",
      "schedule": {
        "kind": "cron",
        "expr": "0 2,6,10,14,18,22 * * *",
        "tz": "Asia/Seoul"
      },
      "payload": {
        "kind": "agentTurn",
        "message": "/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2b-cron.sh"
      },
      "delivery": {
        "mode": "announce",
        "channel": "telegram",
        "to": "@memory_automation_bot"
      }
    }
  }'
```

**Job C: Monitoring (매시간)**

```bash
curl -X POST http://localhost:3000/cron \
  -H "Authorization: Bearer $GATEWAY_TOKEN" \
  -d '{
    "job": {
      "name": "Memory Automation - Service Health",
      "description": "Hourly health check for Phase 2A/2B/C services",
      "schedule": {
        "kind": "cron",
        "expr": "0 * * * *",
        "tz": "Asia/Seoul"
      },
      "payload": {
        "kind": "agentTurn",
        "message": "/home/jeepney/.openclaw/workspace-dev/memory-automation/phase2c-monitoring-cron.sh"
      },
      "delivery": {
        "mode": "announce",
        "channel": "discord",
        "to": "#자동화-로그"
      }
    }
  }'
```

**체크박스:**
- [ ] Job A 등록됨 (Job ID: _____)
- [ ] Job B 등록됨 (Job ID: _____)
- [ ] Job C 등록됨 (Job ID: _____)

#### Option 2: System Crontab 사용

```bash
# crontab 편집
crontab -e

# 다음 라인 추가
0 0,6,12,18 * * * /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2a-cron.sh >> /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a.log 2>&1
0 2,6,10,14,18,22 * * * /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2b-cron.sh >> /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2b.log 2>&1
0 * * * * /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2c-monitoring-cron.sh >> /home/jeepney/.openclaw/workspace-dev/memory/logs/cron-health.log 2>&1

# 저장 후 확인
crontab -l
```

**체크박스:**
- [ ] 3개 cron 라인 추가됨
- [ ] crontab -l에서 확인됨
- [ ] 문법 오류 없음

---

## ✅ 검증 (2026-05-30)

### Step 1: 로그 파일 확인

```bash
# 각 Job의 로그 파일 생성 여부 확인
ls -la /home/jeepney/.openclaw/workspace-dev/memory/logs/

# 예상 파일들:
# - phase2a-cron-20260530.log
# - phase2b-cron-20260530.log
# - cron-health-20260530.log
```

**체크박스:**
- [ ] phase2a-cron-YYYYMMDD.log 생성됨
- [ ] phase2b-cron-YYYYMMDD.log 생성됨
- [ ] cron-health-YYYYMMDD.log 생성됨
- [ ] 파일 크기 > 0 bytes

### Step 2: 로그 내용 검증

```bash
# Job A 로그
tail -10 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a-cron-$(date +%Y%m%d).log

# 예상 출력:
# [2026-05-30 00:00:00] Starting Phase 2A Cron Job...
# [2026-05-30 00:00:01] Phase 2A service running ✓
# [2026-05-30 00:00:05] ✓ SUCCESS: 42 messages collected
```

```bash
# Job B 로그
tail -10 /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2b-cron-$(date +%Y%m%d).log

# 예상 출력:
# [2026-05-30 02:00:00] Starting Phase 2B Cron Job...
# [2026-05-30 02:00:01] Phase 2B service running ✓
# [2026-05-30 02:00:05] ✓ SUCCESS: Found 5 clusters
```

```bash
# Job C 로그
tail -10 /home/jeepney/.openclaw/workspace-dev/memory/logs/cron-health-$(date +%Y%m%d).log

# 예상 출력:
# [2026-05-30 00:00:00] Starting monitoring check...
# [2026-05-30 00:00:01] Phase2A: OK ✓
# [2026-05-30 00:00:02] Phase2B: OK ✓
# [2026-05-30 00:00:03] All services healthy ✓
```

**체크박스:**
- [ ] Job A 로그에 성공 메시지 있음
- [ ] Job B 로그에 클러스터 감지 기록 있음
- [ ] Job C 로그에 서비스 상태 기록 있음
- [ ] 모든 로그에 타임스탬프 있음

### Step 3: 실행 간격 검증

```bash
# 각 Job의 실행 타임스탐프 추출하여 간격 확인
grep "Starting" /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a-cron-*.log | tail -10

# 예상:
# [2026-05-30 00:00:xx] - 첫 번째 실행
# [2026-05-30 06:00:xx] - 두 번째 실행
# [2026-05-30 12:00:xx] - 세 번째 실행
# [2026-05-30 18:00:xx] - 네 번째 실행
```

**체크박스:**
- [ ] Job A: 6시간 간격 확인
- [ ] Job B: 4시간 간격 확인
- [ ] Job C: 1시간 간격 확인

### Step 4: 성능 메트릭 확인

```bash
# Job A: 실행 시간 확인
grep "SUCCESS\|FAILED" /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a-cron-*.log | tail -5

# Job B: 실행 시간 확인
grep "SUCCESS\|FAILED" /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2b-cron-*.log | tail -5

# Job C: 서비스 상태 확인
grep "healthy\|down" /home/jeepney/.openclaw/workspace-dev/memory/logs/cron-health-*.log | tail -10
```

**체크박스:**
- [ ] Job A: 모든 실행 성공 (0 failures)
- [ ] Job B: 모든 실행 성공 (0 failures)
- [ ] Job C: 모든 서비스 정상 (0 down)

---

## 📊 모니터링 (2026-05-31 ~ 06-02)

### Step 1: 주간 요약

```bash
# 지난 7일 통계
echo "=== Phase 2A Statistics ==="
wc -l /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a-cron-*.log | tail -1

echo "=== Phase 2B Statistics ==="
wc -l /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2b-cron-*.log | tail -1

echo "=== Phase 2C Statistics ==="
wc -l /home/jeepney/.openclaw/workspace-dev/memory/logs/cron-health-*.log | tail -1
```

**체크박스:**
- [ ] Job A: 총 4회 실행 (1주일 기준)
- [ ] Job B: 총 6회 실행
- [ ] Job C: 총 24회 실행

### Step 2: 오류 분석

```bash
# 오류 발생 여부 확인
grep "ERROR\|FAILED\|down" /home/jeepney/.openclaw/workspace-dev/memory/logs/phase*.log

# 출력이 없으면: 오류 없음 ✓
# 출력이 있으면: 아래 단계로
```

**체크박스:**
- [ ] Job A 오류: ___개 (목표: 0)
- [ ] Job B 오류: ___개 (목표: 0)
- [ ] Job C 오류: ___개 (목표: 0)

### Step 3: 알림 확인

```bash
# Telegram 알림 로그 확인 (별도 로그)
cat /home/jeepney/.openclaw/workspace-dev/memory/logs/telegram-alerts.log 2>/dev/null || echo "No alerts"

# Discord 알림 확인 (Discord API 로그)
```

**체크박스:**
- [ ] Telegram 알림 전송됨 (필요 시)
- [ ] Discord 알림 전송됨 (필요 시)
- [ ] 알림 응답 시간 <5분

---

## 🎯 최종 체크리스트

| 항목 | 상태 | 검증자 | 날짜 |
|------|------|--------|------|
| Pre-Deployment | ⬜ | | |
| Job A 배포 | ⬜ | | |
| Job B 배포 | ⬜ | | |
| Job C 배포 | ⬜ | | |
| Cron 등록 | ⬜ | | |
| 검증 (로그 확인) | ⬜ | | |
| 모니터링 (1주) | ⬜ | | |
| 최종 승인 | ⬜ | | |

---

## 🔄 Rollback 계획

### 시나리오 A: Cron 실행 안 됨

**진단:**
```bash
# Cron 상태 확인
crontab -l
systemctl status cron

# OpenClaw Cron 상태
curl http://localhost:3000/cron/jobs
```

**복구:**
```bash
# Cron 재등록
crontab -e

# 또는 OpenClaw에서 Job ID로 재시작
curl -X POST http://localhost:3000/cron/jobs/{job_id}/restart
```

### 시나리오 B: API 연결 실패

**진단:**
```bash
curl http://localhost:3009/health
curl http://localhost:3010/health
```

**복구:**
```bash
# 서비스 재시작
npm start --prefix /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2a-message-collection.js
```

### 시나리오 C: 디스크 공간 부족

**진단:**
```bash
df -h /home/jeepney/.openclaw/workspace-dev/memory/logs
du -sh /home/jeepney/.openclaw/workspace-dev/memory/logs
```

**복구:**
```bash
# 오래된 로그 압축
gzip /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2*-cron-*.log

# 또는 삭제
find /home/jeepney/.openclaw/workspace-dev/memory/logs -mtime +30 -delete
```

---

## 📞 연락처

| 역할 | 이름 | 연락처 | 응답 시간 |
|------|------|--------|---------|
| Automation Specialist | Team | Telegram | <5분 |
| Tech Lead | Lead | Phone | <30분 |
| CEO | CEO | All Channels | <10분 |

---

**작성 완료:** 2026-05-27 19:40 KST  
**다음 단계:** Phase 2 배포 (2026-05-28 시작)  
**최종 승인 예정:** 2026-06-02 18:00 KST
