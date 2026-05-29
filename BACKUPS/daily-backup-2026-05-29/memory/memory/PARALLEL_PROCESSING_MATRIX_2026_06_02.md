# PARALLEL_PROCESSING_MATRIX_2026_06_02.md

**7개 프로젝트 병렬 테스트 실행 계획**  
작성: Phase C #14 QA Specialist  
기한: 2026-06-02 18:00 KST

---

## 📊 Executive Summary

7개 프로젝트를 **2개 독립 레인** + **4개 동시 Jest 워커**로 구성하여:
- **안전 레인 (Safe Lane)**: Discord Bot P1, Team Dashboard P2, Travel P2 UI (병렬 실행 ✅)
- **의존성 레인 (Dependency Lane)**: Asset Master P2 → Harness Eng P2 → Memory Auto P2B (순차 실행 필수)
- **전체 소요시간**: 6일 (2026-05-29 ~ 2026-06-02)
- **병렬화 효율**: 레인별 독립 실행으로 48시간 → 6일 단축

---

## 🛣️ 실행 레인 구조

```
┌─────────────────────────────────────────────────────────┐
│         Day 1-2: Unit Test Stage (50+ tests)            │
├──────────────────────┬──────────────────────────────────┤
│  SAFE LANE           │  DEPENDENCY LANE                 │
│  (병렬 실행)         │  (순차 실행)                     │
├──────────────────────┼──────────────────────────────────┤
│ 1. Discord Bot P1    │  4. Asset Master P2              │
│    - 5 unit tests    │     - 15 unit tests              │
│    - 1 worker        │     - 1 worker                   │
│    - Port: 3001      │     - Port: 3002                 │
│    - Org: test-1     │     - Org: test-2                │
│                      │                                  │
│ 2. Team Dashboard P2 │  ┌─→ 5. Harness Eng P2           │
│    - 12 unit tests   │  │     - 16 unit tests           │
│    - 1 worker        │  │     - 1 worker                │
│    - Port: 3003      │  │     - Port: 3003 (seq)        │
│    - Org: test-3     │  │     - Org: test-2 (shared)    │
│                      │  │                               │
│ 3. Travel P2 UI      │  └─→ 6. Memory Auto P2B          │
│    - 8 unit tests    │      - 4 unit tests              │
│    - 1 worker        │      - 1 worker                  │
│    - Port: 3004      │      - Port: 3002 (reuse)        │
│    - Org: test-4     │      - Org: test-2 (shared)      │
│                      │                                  │
│                      │  7. Backup App P2                │
│                      │     - 9 unit tests               │
│                      │     - 1 worker                   │
│                      │     - Port: 3002 (reuse)         │
│                      │     - Org: test-2 (shared)       │
└──────────────────────┴──────────────────────────────────┘
```

---

## 📋 레인별 상세 계획

### A. SAFE LANE (병렬 실행) — Day 1-2

**특징:**
- 공유 의존성 **없음** ✅
- 4개 동시 워커 모두 사용
- 독립적 데이터 격리 (org_id = test-{1,3,4})
- 충돌 가능성 0%

**프로젝트 1: Discord Bot Phase 1**
```
Timeline:  Day 1 08:00 - Day 2 12:00 (28시간)
Status:    API Complete ✅ → Unit Test 진행중

Tests (5):
  1. verifyDiscordSignature() — Ed25519 signature validation
  2. verifyTelegramSignature() — HMAC-SHA256 validation
  3. POST /api/discord/sync — Telegram↔Discord 메시지 싱크
  4. GET /api/message-sync — 페이지네이션 + 필터링
  5. Conflict Detection — 중복 메시지 409 반환

Coverage Target: ≥80% (현재 74% → 80% 달성)
Database: test_org_1 (4 tables: discord_channels, telegram_chats, message_sync, audit_logs)

Blockers: None
Dependencies: None
```

**프로젝트 2: Team Dashboard Phase 2**
```
Timeline:  Day 1 08:00 - Day 2 14:00 (30시간)
Status:    UI 70% 진행중 → Unit Test 병렬

Tests (12):
  1-4. Performance Card Component (render, props, trend calc)
  5-8. Role-Based Access (admin, operator, viewer, unauthorized)
  9-12. API Route Tests (GET metrics, POST goals, PATCH update, DELETE)

Coverage Target: ≥82% (현재 68% → 82% 달성)
Database: test_org_3 (3 tables: goals, performance_metrics, role_assignments)

Blockers: None (UI 70% 진행이 Unit Test와 병렬 가능)
Dependencies: None
```

**프로젝트 3: Travel Management Phase 2 UI**
```
Timeline:  Day 1 08:00 - Day 2 10:00 (26시간)
Status:    UI 개발 진행중 → Unit Test 병렬

Tests (8):
  1-3. calculateTravelCost() — 기본요금, 할인, GST 적용
  4-5. ItineraryTimeline Component — 렌더링, 정렬
  6-7. dateRangeValidator() — 시작일 < 종료일, 최소 1일
  8. Conflict Detection — 겹치는 여행 감지

Coverage Target: ≥79% (현재 65% → 79% 달성)
Database: test_org_4 (8 tables: travels, itinerary_items, approvals, accommodations, …)

Blockers: None
Dependencies: None (Asset Master 의존도 → Integration 단계에서 확인)
```

**프로젝트 4: Backup App Phase 2**
```
Timeline:  Day 2 18:00 - Day 3 22:00 (28시간)
Status:    Backend 30% 진행중 → Unit Test 병렬

Tests (9):
  1-3. Retention Policy Calculation (daily 7d, weekly 28d, monthly 365d)
  2-5. Archive Size Formula (gzip 40%, zstd 45%, mixed)
  6-7. Checksum Validation (SHA256, tamper detection)
  8-9. Cleanup Logic (orphaned S3 객체, retention expired backups)

Coverage Target: ≥81%
Database: test_org_2_backup (4 tables: backups, restore_jobs, archive_jobs, cleanup_logs)

Blockers: None
Dependencies: None (Asset Master 백업 모니터링 → Integration에서 확인)
```

**병렬 실행 확인 사항:**
```bash
# Day 1 08:00 시작
jest --maxWorkers=4 \
  --testPathPattern="discord-bot|team-dashboard|travel" \
  --forceExit \
  --verbose \
  2>&1 | tee logs/safe-lane-day1.log

# 예상 완료: Day 2 14:00
# 포트 확인 (동시 사용 가능)
  Discord: 3001 ✅
  Team Dashboard: 3003 ✅
  Travel: 3004 ✅
  Asset Master: 3002 (아직 미사용) ✅

# Org 격리 확인
  test_org_1: 4 테이블 (Discord)
  test_org_3: 3 테이블 (Team Dashboard)
  test_org_4: 8 테이블 (Travel)
  → 크로스 오그 접근 0건 예상
```

---

### B. DEPENDENCY LANE (순차 실행) — Day 2-6

**특징:**
- 3개 프로젝트 **순차 실행** (순서 엄격함)
- 공유 테스트 DB (test_org_2, port 3002 재사용)
- Asset Master 완료 후 Harness 시작
- Harness 완료 후 Memory Auto 시작

**프로젝트 4: Asset Master Phase 2 (CRITICAL GATE)**
```
Timeline:  Day 2 08:00 - Day 3 14:00 (30시간)
Status:    API Complete ✅ → Unit Test 필수

Tests (15):
  1-3. Duplicate Detection (exact match, fuzzy >0.85, variants)
  4-6. Health Score Calculation (condition × reliability × age formula)
  7-10. Bulk Import RLS (org isolation, transaction atomicity, count rollback)
  11-13. API CRUD (create, update, delete soft)
  14-15. Pagination + Filtering (limit=20, asset_code filter)

Coverage Target: ≥85% (critical)
Database: test_org_2 (5 tables: assets, asset_history, health_scores, imports, audit_logs)

⚠️ GATE CRITERIA (Day 3 14:00):
  [ ] Unit test coverage ≥85%
  [ ] All 15 tests passing
  [ ] RLS isolation verified (cross-org = 0)
  [ ] Bulk import atomicity confirmed
  [ ] No data leakage

❌ If GATE FAILS:
  → Day 3 15:00 blocker review
  → Root cause analysis (unit test failure? RLS issue? Data integrity?)
  → Fallback: Harness + Memory Auto 지연 (Day 4로 미룸)
  → Alternative: Asset Master Integration 단계 우선 (Unit 부분 완료)

✅ If GATE PASSES (예상):
  → Day 3 14:30: Harness 시작 신호
```

**프로젝트 5: Harness Eng Phase 2 (의존성: Asset Master ✅)**
```
Timeline:  Day 3 14:30 - Day 4 22:00 (31.5시간)
Status:    설계중 → Unit Test 병렬

Tests (16):
  1-4. Conflict Detection Logic (time_overlap, resource_contention, capacity_exceeded)
  5-8. Conflict Metrics Aggregation (total_conflicts, critical_count, coverage, avg_time)
  9-12. Validation Formatters (duration, severity, type, error codes)
  13-16. Error Analysis (categorizeErrorCodes, retry delay, coverage calc)

Coverage Target: ≥82%
Database: test_org_2_harness (4 tables: schedules, maintenance_plans, validations, audit_logs)

**Asset Master 의존도 확인:**
  - Asset existence validation (asset_id INNER JOIN assets 테이블)
  - Health score factor in conflict severity (SELECT health_score FROM assets)
  - Capacity exceeded logic uses asset capacity limits
  
**테스트 순서:**
  1. Asset Master Unit ✅ (prerequisite)
  2. Harness Unit 시작 (asset 테이블 포함된 test_org_2 사용)
  3. Asset Master Integration (Day 4)
  4. Harness Integration (Asset Master Integration 완료 후, Day 5)

⚠️ Asset Master Integration 완료 전까지:
  - Mock asset data로 Harness Unit 진행 가능 ✅
  - Harness Integration은 대기 (Day 4 night 예정)
```

**프로젝트 6: Memory Auto Phase 2B (의존성: Asset Master ✅)**
```
Timeline:  Day 4 22:00 - Day 5 18:00 (20시간)
Status:    Day 1 완료 ✅ → Unit Test 진행

Tests (4):
  1. Duplicate Detection Logic (exact, fuzzy, semantic)
  2. Pattern Matching (file path, project name, team member)
  3. Fuzzy Scoring (Levenshtein, Soundex, semantic similarity >0.75)
  4. Cron Execution (validates entries, publishes duplicates_detected)

Coverage Target: ≥90% (대부분 pure functions)
Database: No persistent DB (memory/ 파일시스템만 사용)

**Asset Master 의존도:**
  - Asset code pattern matching (asset_master/memory files 비교)
  - Semantic similarity for asset variants
  - Cross-project duplicate detection (Asset Master entries ↔ Memory entries)

**테스트 성격:**
  - 사실상 독립적 (DB 의존 없음)
  - Asset Master Unit ✅ 확인 후 시작 가능
  - Integration 테스트는 Asset Master와 동시 실행 (Day 5-6)
```

**순차 실행 확인:**
```
Timeline 체크:
  Day 2 08:00 ─ Asset Master Unit 시작
  Day 3 14:00 ─ Asset Master Unit 완료 (GATE 검사)
  Day 3 14:30 ─ Harness Unit 시작
  Day 4 22:00 ─ Harness Unit 완료 → Memory Auto Unit 시작
  Day 5 18:00 ─ Memory Auto Unit 완료

Fallback 타이밍:
  - Asset Master GATE 실패 → Day 4 시작 지연 (Harness/Memory Auto 미룸)
  - Harness Unit 실패 → Day 5 Integration 지연
  - Memory Auto Unit 실패 → Day 6 배포 확인 필수

Port 재사용:
  Asset Master: test_org_2, port 3002 ✅
  Harness: test_org_2, port 3002 (순차이므로 충돌 없음)
  Memory Auto: N/A (파일시스템)
```

---

## 🔀 Cross-Project 의존도 맵

### 의존도 유형 분류

| 프로젝트 쌍 | 타입 | 영향도 | 미티게이션 |
|-----------|------|-------|----------|
| Asset Master → Harness | **HARD** | 🔴 Critical | Harness는 Asset Master Unit 완료 후 시작 필수 |
| Asset Master → Memory Auto | **HARD** | 🔴 Critical | Memory Auto Unit은 Mock asset 사용, Integration은 순차 |
| Travel → Asset Master | **SOFT** | 🟡 Monitor | Travel booking에 asset 할당 (optional), 데이터 교차 없음 |
| Backup → Asset Master | **SOFT** | 🟡 Monitor | Backup 모니터링에서 asset health score 참조 (read-only) |
| Discord → All | **NONE** | 🟢 Safe | 격리된 메시지 동기화, 다른 프로젝트와 무관 |
| Team Dashboard → All | **NONE** | 🟢 Safe | 조직도 + 포트폴리오, 타 프로젝트 데이터 미참조 |
| Harness → Memory Auto | **NONE** | 🟢 Safe | 독립적 conflict detection 및 duplicate detection |

### 동시성 안전성 검증

```typescript
// 동시 실행 시 Race Condition 체크
Conflict Level: 🟢 SAFE (동시 실행 가능)
  - Safe Lane (Discord, Team Dashboard, Travel) ← 공유 테이블 0개
  - Safe from Dependency Lane ← Safe Lane과 db 격리 (test_org_1,3,4 vs test_org_2)

Conflict Level: 🟡 MONITOR (순차 필수)
  - Asset Master → Harness ← hard FK constraint (asset_id)
  - Asset Master → Memory Auto ← semantic matching requires Asset data

Fallback Strategy:
  1. Safe Lane 실패 → 해당 프로젝트만 재실행 (다른 프로젝트 무관)
  2. Asset Master GATE 실패 → Dependency Lane 미룸 (Day 4로)
  3. Harness 실패 → Memory Auto는 Mock 데이터로 완료 (격리 가능)
  4. 최악 시나리오 → Asset Master Integration 먼저 (Unit 부분 스킵, Day 4 시작)
```

---

## 📊 Jest Worker 할당 전략

**Day 1-2: Safe Lane (병렬)**
```bash
Worker 1 (Port 3001): Discord Bot P1
Worker 2 (Port 3002): (예약 - Dependency Lane용)
Worker 3 (Port 3003): Team Dashboard P2
Worker 4 (Port 3004): Travel P2 UI

cmd: jest --maxWorkers=4 --testPathPattern="discord|dashboard|travel"
cpu: ~60% (4개 워커 × 15% each)
mem: ~1.2GB (Jest overhead 200MB × 4 + shared 400MB)
```

**Day 2-3: Dependency Lane 시작 + Safe Lane 마무리**
```bash
Worker 1 (Port 3001): (Safe Lane 정리)
Worker 2 (Port 3002): Asset Master P2 (새로운 Dependency Lane)
Worker 3 (Port 3003): Team Dashboard (정리)
Worker 4 (Port 3004): Travel (정리)

Harness/Memory Auto는 Worker 2 순차 (Worker 1,3,4 재사용 가능)
```

**Day 2: Backup App Unit (독립)**
```bash
Worker 2 (Port 3002): Backup App Unit
Status: Asset Master 완료 후 재사용 가능 (또는 Worker 1에서 실행)
```

---

## 🎯 병렬 실행 체크리스트

### 시작 전 (Day 1 07:00)
- [ ] Test DB 초기화 (`truncate test_org_*; drop schema test_*;`)
- [ ] Supabase test keys 로드 (SUPABASE_TEST_URL, ANON_KEY)
- [ ] Git branches 업데이트 (각 프로젝트 최신 main)
- [ ] Environment variables 설정 (PORT, ORG_ID, NODE_ENV=test)
- [ ] Node modules 설치 완료 (npm install in each project)

### 실행 중 모니터링 (매 2시간)
- [ ] Port 3001-3004 사용 가능 여부 (`lsof -i :3001-3004`)
- [ ] DB 연결 상태 확인 (Supabase connection pool < 20)
- [ ] CPU 사용률 < 80% (과부하 감지)
- [ ] 메모리 누수 감지 (힙 크기 증가 추세)
- [ ] 파일 핸들 < 500 (fd 누수)

### 완료 후 (각 Lane 완료 시)
- [ ] Test org 데이터 정리 (`DELETE FROM * WHERE org_id LIKE 'test-%'`)
- [ ] 포트 release (killed processes 확인)
- [ ] 테스트 로그 아카이브 (logs/safe-lane-day1.log 등)
- [ ] Coverage 리포트 생성 (coverage/ 디렉토리)

---

## ⚡ 성능 목표 & 예상값

| 메트릭 | Safe Lane | Dependency Lane | 전체 |
|-------|-----------|-----------------|------|
| 병렬도 | 4개 동시 | 1개 순차 | 4개 max |
| 실행시간 | 30시간 | 90시간 (순차) | **6일 (144시간)** |
| CPU 평균 | ~60% | ~20% | ~40% |
| 메모리 | ~1.2GB | ~300MB | ~1.5GB |
| 포트 사용 | 3001, 3003, 3004 | 3002 | 4개 |
| DB 격리 | test_org_{1,3,4} | test_org_2 | 5개 org |

**시간 절감:**
- 순차 실행: 50 + 40 + 15 + 48 + 9 + 16 + 4 = **182시간**
- 병렬 실행: Safe Lane (30h) + Dependency Lane (90h) = **120시간** → 6일
- **절감: 62시간 (34% 단축)**

---

## 🚨 위험도 평가 & 대응

### 🔴 CRITICAL Risk: Asset Master GATE 실패

**시나리오:** Day 3 14:00, Asset Master Unit 85% 미달성
```
영향도:
  ├─ Harness Unit 지연 (Day 4로)
  ├─ Memory Auto Unit 지연 (Day 5로)
  └─ 전체 Timeline: 6일 → 7-8일 연장

원인 예상:
  ├─ 중복 감지 로직 버그 (fuzzy matching edge case)
  ├─ Bulk import 원자성 위반 (rollback 실패)
  ├─ RLS 정책 누수 (cross-org 접근 감지)
  └─ 성능 이슈 (1000개 asset import timeout)

대응:
  1. Unit 부분 완료 (70%) → Asset Master Integration 우선 (Day 3 18:00)
  2. Harness는 Mock asset data로 Unit 진행 (Day 4 08:00, 병렬)
  3. Asset Master 완료 후 (Day 4 18:00) Harness Integration 시작
  4. Memory Auto는 Day 5 시작 (영향 최소화)
```

### 🟡 MEDIUM Risk: Harness Unit 실패

**시나리오:** Day 4 12:00, Harness conflict detection 로직 오류
```
영향도:
  ├─ Harness Integration 지연 (Day 5→6)
  └─ Memory Auto Integration 지연 (Day 6→7) [연쇄]

대응:
  1. Asset Master Integration 결과 검증 (conflict data 정확도 확인)
  2. Harness Mock conflict scenarios 추가 (Asset data 없이 검증)
  3. Memory Auto는 Day 5 시작 가능 (독립 실행)
```

### 🟢 LOW Risk: Safe Lane 개별 실패

**시나리오:** Day 2 10:00, Travel component 테스트 실패
```
영향도:
  └─ Travel만 지연 (Discord, Team Dashboard 무관)

대응:
  1. Travel Unit 재실행 (동일 Worker에서, 1-2시간)
  2. 다른 프로젝트는 Integration으로 진행
  3. Travel Integration 시간 조정 (Day 4로 미룸, 리소스 유연성)
```

---

## 📋 최종 실행 명령어

### Day 1 08:00 — Safe Lane 시작
```bash
cd /home/jeepney/.openclaw/workspace-dev

# 환경 설정
export NODE_ENV=test
export SUPABASE_TEST_URL="https://..."
export SUPABASE_ANON_KEY="..."
export MAX_WORKERS=4

# Safe Lane 시작
npm run test:safe-lane -- --coverage

# Expected output:
#   Discord Bot P1: ✅ 5/5 tests (coverage 80%)
#   Team Dashboard P2: ✅ 12/12 tests (coverage 82%)
#   Travel P2 UI: ✅ 8/8 tests (coverage 79%)
#   Total: 25/25 tests, avg coverage 80.3%
```

### Day 2 08:00 — Dependency Lane 시작
```bash
# Asset Master Unit (GATE)
npm run test:asset-master -- --coverage

# 결과 평가:
#   ✅ Coverage ≥85% → Harness 시작 신호
#   ❌ Coverage <85% → Day 3 18:00 재계획
```

### Day 3 14:30 — Harness Unit (조건부 시작)
```bash
# Asset Master GATE 통과 후
npm run test:harness -- --coverage

# Expected:
#   Harness Unit: ✅ 16/16 tests (coverage 82%)
```

### Day 4 22:00 — Memory Auto Unit
```bash
npm run test:memory-auto -- --coverage

# Expected:
#   Memory Auto: ✅ 4/4 tests (coverage 90%)
```

---

## 📈 진도 추적 (CTB 연동)

매일 18:00 업데이트:
```
Day 1: Safe Lane 25/25 unit tests → 100% ✅
Day 2: Asset Master 15/15 unit tests → GATE검사
Day 3: Harness 16/16 unit tests → Day 4 준비
Day 4: Memory Auto 4/4 unit tests → Integration 준비
Day 5: All Integration Tests → E2E 준비
Day 6: All E2E Tests → 배포 승인
```

---

**문서 버전:** 1.0  
**마지막 갱신:** 2026-05-28 03:30 KST  
**상태:** 🟢 DESIGN_COMPLETE — 구현팀(Web-Builder) 위임 준비 완료
