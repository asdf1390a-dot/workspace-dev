# Cron Automation Expansion Design — Phase 2A/2B/C Support

**작성일:** 2026-05-27 19:35 KST  
**목표:** Memory Automation Phase 2A/2B 자동화를 위한 3개 Cron job 설계 & 구현  
**기한:** 2026-06-02 18:00 KST  
**상태:** 🟡 설계 진행 중 (2026-05-27 19:35 시작)

---

## 📋 개요

### 목표
- Phase 2A (메시지 수집) 자동화: 6시간 주기로 데이터 수집
- Phase 2B (중복 감지) 자동화: 4시간 주기로 중복 검출
- Phase 2C (모니터링) 자동화: 매시간 헬스 체크 + 오류 관리

### 예상 효과
- 메모리 손실 제거: 자동 수집으로 100% 데이터 포괄
- 중복 제거: 자동 감지로 일관성 99% 이상
- 신뢰도: Phase C까지 완성 시 96% 이상 보장
- 수동 개입: 주 1회 검토만 필요

---

## 🔧 Cron Job 설계

### Job A: Message Collection (6시간 주기)

**용도:** Phase 2A API를 이용한 메시지 자동 수집

| 설정 | 값 |
|------|---|
| **주기** | 6시간 (00:00, 06:00, 12:00, 18:00 KST) |
| **실행 파일** | `memory-automation/phase2a-message-collection.js` |
| **포트** | 3009 |
| **API 엔드포인트** | `POST /api/collect-and-deduplicate` |
| **수집 대상** | Telegram, Discord, GitHub sessions |
| **결과 저장** | `memory/collected_messages_YYYY-MM-DD_HH.jsonl` |
| **예상 실행 시간** | 2-5분 (세션 크기에 따라) |
| **성공 기준** | HTTP 200 + 메시지 >0 |
| **실패 시 재시도** | 3회 (5초 간격) |
| **알림** | Telegram (@user_bot) |

**스크립트:** `phase2a-cron.sh`

```bash
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

# 헬스 체크
for attempt in {1..3}; do
  if curl -s "$PHASE2A_URL/health" > /dev/null 2>&1; then
    echo "[$TIMESTAMP] Phase 2A service running ✓" >> "$LOG_FILE"
    break
  elif [[ $attempt -eq 3 ]]; then
    echo "[$TIMESTAMP] ERROR: Phase 2A service not responding" >> "$LOG_FILE"
    exit 1
  else
    sleep 5
  fi
done

# 메시지 수집 요청
RESPONSE=$(curl -s -X POST "$PHASE2A_URL/api/collect-and-deduplicate" \
  -H "Content-Type: application/json" \
  -d '{}' 2>/dev/null || echo '{"success": false}')

SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')

if [[ "$SUCCESS" == "true" ]]; then
  COUNT=$(echo "$RESPONSE" | jq -r '.messagesCollected // 0')
  echo "[$TIMESTAMP] SUCCESS: $COUNT messages collected" >> "$LOG_FILE"
else
  ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown"')
  echo "[$TIMESTAMP] FAILED: $ERROR" >> "$LOG_FILE"
  exit 1
fi
```

**Crontab 표현식:**
```crontab
0 0,6,12,18 * * * /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2a-cron.sh >> /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2a.log 2>&1
```

---

### Job B: Duplicate Detection (4시간 주기)

**용도:** Phase 2B를 이용한 중복 자동 감지

| 설정 | 값 |
|------|---|
| **주기** | 4시간 (02:00, 06:00, 10:00, 14:00, 18:00, 22:00 KST) |
| **실행 파일** | `memory-automation/phase2b-duplicate-detection.js` |
| **포트** | 3010 |
| **API 엔드포인트** | `POST /api/detect-duplicates` |
| **입력 데이터** | 수집된 메시지 + 메모리 파일 |
| **감지 방식** | 3-layer (Pattern/Fuzzy/Semantic) |
| **결과 저장** | `memory/duplicate_detection_report_YYYY-MM-DD_HH.jsonl` |
| **예상 실행 시간** | 1-3분 (항목 수에 따라) |
| **성공 기준** | HTTP 200 + 분석 완료 |
| **실패 시 재시도** | 3회 (5초 간격) |
| **알림** | Telegram + Discord #일반 |

**스크립트:** `phase2b-cron.sh` (기존 체크리스트 기반)

```bash
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

# 헬스 체크
for attempt in {1..3}; do
  if curl -s "$PHASE2B_URL/health" > /dev/null 2>&1; then
    echo "[$TIMESTAMP] Phase 2B service running ✓" >> "$LOG_FILE"
    break
  elif [[ $attempt -eq 3 ]]; then
    echo "[$TIMESTAMP] ERROR: Phase 2B service not responding" >> "$LOG_FILE"
    exit 1
  else
    sleep 5
  fi
done

# 메모리 파일 수집
MEMORY_FILES=$(find "$MEMORY_DIR" -maxdepth 1 -name "*.md" -type f 2>/dev/null | wc -l)

# 중복 감지 요청
RESPONSE=$(curl -s -X POST "$PHASE2B_URL/api/detect-duplicates" \
  -H "Content-Type: application/json" \
  -d "{\"memoryDir\": \"$MEMORY_DIR\"}" 2>/dev/null || echo '{"success": false}')

SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')

if [[ "$SUCCESS" == "true" ]]; then
  CLUSTERS=$(echo "$RESPONSE" | jq -r '.duplicateClusters | length // 0')
  echo "[$TIMESTAMP] SUCCESS: Found $CLUSTERS duplicate clusters across $MEMORY_FILES files" >> "$LOG_FILE"
else
  ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown"')
  echo "[$TIMESTAMP] FAILED: $ERROR" >> "$LOG_FILE"
  exit 1
fi
```

**Crontab 표현식:**
```crontab
0 2,6,10,14,18,22 * * * /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2b-cron.sh >> /home/jeepney/.openclaw/workspace-dev/memory/logs/phase2b.log 2>&1
```

---

### Job C: Monitoring & Health Check (매시간)

**용도:** Phase 2A/2B 서비스 모니터링 + 오류 감지 + 알림

| 설정 | 값 |
|------|---|
| **주기** | 매시간 (HH:00 KST) |
| **헬스 체크** | Phase 2A (3009), Phase 2B (3010), Phase 2C (3011) |
| **체크 항목** | 서비스 상태, 응답 시간, 에러 로그, 디스크 공간 |
| **결과 저장** | `memory/logs/cron-health-$(date +%Y%m%d).json` |
| **예상 실행 시간** | <30초 |
| **성공 기준** | 모든 서비스 200 OK |
| **실패 시 재시도** | 2회 (10초 간격) |
| **알림 기준** | 1회 실패 시 경고, 3회 연속 실패 시 CRITICAL |
| **알림 채널** | Telegram (즉시), Discord (1시간 주기) |

**스크립트:** `phase2c-monitoring-cron.sh`

```bash
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

declare -A services=(
  ["Phase2A"]="http://localhost:3009/health"
  ["Phase2B"]="http://localhost:3010/health"
  ["Phase2C"]="http://localhost:3011/health"
)

echo "[$TIMESTAMP] Starting monitoring check..." >> "$HEALTH_LOG"

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
  echo "[$TIMESTAMP] All services healthy" >> "$HEALTH_LOG"
  exit 0
fi
```

**Crontab 표현식:**
```crontab
0 * * * * /home/jeepney/.openclaw/workspace-dev/memory-automation/phase2c-monitoring-cron.sh >> /home/jeepney/.openclaw/workspace-dev/memory/logs/cron-monitoring.log 2>&1
```

---

## 📊 Cron 일정표

### 2026-05-28 (수) 기준

| 시각 | Job A (2A) | Job B (2B) | Job C (Monitor) |
|------|-----------|-----------|-----------------|
| 00:00 | ✓ | - | ✓ |
| 01:00 | - | - | ✓ |
| 02:00 | - | ✓ | ✓ |
| 03:00 | - | - | ✓ |
| 04:00 | - | - | ✓ |
| 05:00 | - | - | ✓ |
| 06:00 | ✓ | ✓ | ✓ |
| 07:00 | - | - | ✓ |
| ... | ... | ... | ... |
| 18:00 | ✓ | ✓ | ✓ |
| 22:00 | - | ✓ | ✓ |

**월 실행 횟수:**
- Job A: 4회/일 × 30일 = 120회/월
- Job B: 6회/일 × 30일 = 180회/월
- Job C: 24회/일 × 30일 = 720회/월

---

## 🛠 구현 로드맵

### Phase 1: 설계 (2026-05-27 완료)
- [x] 3개 Job 설계
- [x] Cron 표현식 정의
- [x] 스크립트 스켈레톤 작성
- [x] 일정표 수립

### Phase 2: 스크립트 구현 (2026-05-28 예정)
- [ ] 3개 .sh 스크립트 작성 & 테스트
- [ ] 로그 디렉토리 구조 수립
- [ ] 오류 처리 & 재시도 로직 추가
- [ ] 알림 통합 (Telegram/Discord)

### Phase 3: Cron 등록 (2026-05-29 예정)
- [ ] OpenClaw cron tool로 Job A 등록
- [ ] OpenClaw cron tool로 Job B 등록
- [ ] OpenClaw cron tool로 Job C 등록
- [ ] 각 Job별 delivery 설정 (알림)

### Phase 4: 검증 & 배포 (2026-05-30 예정)
- [ ] 각 스크립트 수동 실행 테스트
- [ ] 로그 파일 생성 & 포맷 확인
- [ ] Cron 자동 실행 검증 (최소 1회)
- [ ] 성능 메트릭 기록

### Phase 5: 모니터링 & 최적화 (2026-05-31 ~ 06-02)
- [ ] 1주일 자동 실행 결과 분석
- [ ] 성능 기준 달성 확인
- [ ] 필요시 주기 조정
- [ ] 최종 보고서 작성

---

## 📌 성능 기준 (SLA)

| 메트릭 | 목표 | 허용 범위 | 모니터링 |
|-------|------|---------|---------|
| **실행 시간** | A: <5min, B: <3min, C: <30s | ±100% | 로그 타임스탬프 |
| **성공률** | 99.5% | >98% | 로그 분석 |
| **알림 응답** | <5분 | <30분 | Telegram 타임스탬프 |
| **메모리 수집 완성도** | >95% | >90% | A 실행 결과 |
| **중복 감지율** | >90% | >85% | B 실행 결과 |
| **서비스 가용성** | 99.9% | >99% | C 헬스 체크 |

---

## 🔔 알림 설정

### Telegram 알림
- **채널:** @memory_automation_bot
- **시점:** Job 실패, 3회 연속 실패 (CRITICAL), 성능 저하
- **포맷:** `[Phase 2A] ✓ 42 messages collected | [2026-05-28 06:00:15]`

### Discord 알림
- **채널:** #자동화-로그
- **빈도:** 매 6시간 (Job A/B 완료 후)
- **포맷:** 집계 보고서 (성공/실패 건수, 성능 메트릭)

### CTB (Central Task Board) 업데이트
- **항목:** Cron Automation Expansion
- **상태:** Phase 별 진행률 업데이트
- **주기:** 일일 갱신

---

## 📂 파일 구조

```
memory-automation/
├── phase2a-cron.sh                    # Job A: Message Collection
├── phase2b-cron.sh                    # Job B: Duplicate Detection
├── phase2c-monitoring-cron.sh          # Job C: Monitoring
├── CRON_DESIGN_SPEC.md                 # 이 파일
├── CRON_DEPLOYMENT_CHECKLIST.md        # 배포 체크리스트
└── CRON_MONITORING_DASHBOARD.md        # 모니터링 대시보드

memory/logs/
├── phase2a-cron-YYYYMMDD.log          # Job A 로그
├── phase2b-cron-YYYYMMDD.log          # Job B 로그
├── cron-health-YYYYMMDD.log           # Job C 로그
├── phase2a-errors.log                 # A 오류 누적
├── phase2b-errors.log                 # B 오류 누적
└── cron-monitoring.log                # C 오류 누적
```

---

## ⚠️ 위험 요소 & 완화 전략

| 위험 | 확률 | 영향 | 완화 방안 |
|------|------|------|---------|
| 서비스 포트 충돌 | 중 | 높음 | 포트 미리 예약, health check 재시도 |
| 네트워크 일시 장애 | 중 | 중간 | 3회 재시도, exponential backoff |
| 디스크 공간 부족 | 낮음 | 높음 | 로그 자동 rotation, 용량 모니터링 |
| 권한 부족 (디렉토리 쓰기) | 낮음 | 높음 | 초기 설정 시 권한 검증 |
| 메모리 누수 | 낮음 | 중간 | 서비스 재시작 (weekly), 메모리 모니터링 |

---

## ✅ 검증 기준

### Job A (Message Collection)
- [ ] 6시간 주기로 정확히 실행
- [ ] 각 실행 시 메시지 >0 수집
- [ ] 로그 파일 생성 & 포맷 정상
- [ ] 실행 시간 <5분

### Job B (Duplicate Detection)
- [ ] 4시간 주기로 정확히 실행
- [ ] 중복 감지율 >90% (샘플 검증)
- [ ] 로그 파일 생성 & 포맷 정상
- [ ] 실행 시간 <3분

### Job C (Monitoring)
- [ ] 매시간 정확히 실행
- [ ] 3개 서비스 헬스 체크 성공
- [ ] 서비스 다운 감지 시 알림 발송
- [ ] 실행 시간 <30초

---

## 📞 연락처 & 에스컬레이션

| 상황 | 담당자 | 연락처 | 대응 시간 |
|------|--------|--------|---------|
| Cron 실패 1회 | Automation Specialist | Telegram | <5분 |
| Cron 실패 3회 연속 | Tech Lead | Telegram + Phone | <30분 |
| 서비스 완전 다운 | CEO | All Channels | <10분 |

---

**작성 완료:** 2026-05-27 19:35 KST  
**다음 단계:** Phase 2 스크립트 구현 (2026-05-28 시작)
