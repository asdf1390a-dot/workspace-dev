# THREE_ITERATION_VALIDATION_PROTOCOL_2026_06_02.md

**7개 프로젝트 3회 반복 검증 프로토콜**  
작성: Phase C #14 QA Specialist  
기한: 2026-06-02 18:00 KST

---

## 📋 Executive Summary

모든 7개 프로젝트는 **3회 반복 검증(Three-Iteration Validation)**을 거쳐야 **배포 승인(Go/No-Go)**을 받습니다:

1. **Iteration 1 (Unit Validation)**: 코드 품질 + 테스트 격리
2. **Iteration 2 (Integration Validation)**: RLS 보안 + API 계약 + DB 원자성
3. **Iteration 3 (E2E Validation)**: 사용자 경로 + 접근성 + 성능 + 모바일

각 반복은 **Go/No-Go 게이트**를 통과해야 다음 단계 진행 가능.  
최종 배포 승인은 **10단계 Pre-Deployment 체크리스트** 완료 후.

---

## 🎯 반복 검증 프레임워크 (공통 패턴)

### Iteration 1: Unit Validation (Day 1-2)

**목표:** 코드가 기본 기능/품질 기준 충족  
**담당:** 웹개발자 (구현팀)  
**검증 기한:** 각 프로젝트별 Day 1-2 단계

#### 체크리스트 (공통)

```
[ ] Code Coverage ≥80% (new code lines + branches)
    → npm run test:coverage
    → coverage/index.html 열어서 > 80% 확인
    
[ ] ESLint/TypeScript 0 errors
    → npm run lint (0 warnings 목표)
    → npm run type-check (0 errors)
    
[ ] Test Isolation ✅
    → beforeEach() 격리 (공유 DB state 없음)
    → afterEach() 정리 (test org data 삭제)
    → Cross-test data leakage 0건
    
[ ] Unit Test Pass Rate = 100%
    → npm run test --testPathPattern="unit"
    → Failed: 0
    
[ ] Dependency Check
    → npm audit (critical 0, high ≤2)
    → Outdated packages ≤3 (minor upgrade only)
```

#### Go/No-Go 게이트 1 (Iteration 1)

**Pass 조건:**
```
Coverage ≥80% AND
ESLint 0 errors AND
TypeScript 0 errors AND
Test Isolation ✅ AND
Unit Pass Rate = 100%
```

**Fail 시 조치:**
```
❌ Coverage <80% → Unit test 추가 + 리팩토링 (2-4시간)
❌ Linter errors → 자동 fix (eslint --fix) + review
❌ Isolation 위반 → 테스트 재설계 (공유 state 제거)
```

**통과 신호:** "✅ Unit Validation PASSED"  
**진행:** Iteration 2로 이동 (즉시)

---

### Iteration 2: Integration Validation (Day 2-3)

**목표:** API/DB 레벨에서 보안 + 계약 + 무결성 검증  
**담당:** 웹개발자 + QA (검증)  
**검증 기한:** 각 프로젝트별 Day 2-3 단계

#### 체크리스트 (공통)

```
[ ] RLS Cross-Org Prevention ✅
    Scenario:
      1. Create org_1 asset (asset_code: 'A', org_id: 'test-org-1')
      2. Try SELECT as org_2 user
      3. Assert: result = null (RLS blocks)
    
[ ] API Contract Compliance
    Scenario:
      1. GET /api/resource (200, JSON schema match)
      2. POST /api/resource (201, correct headers)
      3. PATCH /api/resource/[id] (200, version increment)
      4. DELETE /api/resource/[id] (204, soft delete verified)
    
[ ] Pagination & Filtering ✅
    Scenario:
      1. INSERT 100 records
      2. GET ?limit=20&offset=0 (20 rows)
      3. GET ?limit=20&offset=20 (next 20)
      4. GET ?filter=asset_code&value=A (matches only)
      5. Assert: count correct, order stable
    
[ ] Transaction Atomicity (bulk ops)
    Scenario:
      1. INSERT batch 50 items (items 1-49 valid, item 50 invalid FK)
      2. Assert: all 50 rolled back (count = 0)
      3. Asset not partially imported
    
[ ] Authorization Validation
    Scenario:
      1. Unauthorized user (no token) → GET /api/protected (401)
      2. Expired token → PATCH /api/protected (401)
      3. Wrong org_id → DELETE /api/protected (403)
    
[ ] Error Handling ✅
    Scenario:
      1. 404 on missing resource (proper message)
      2. 400 on invalid input (validation errors)
      3. 500 error logging enabled (Sentry integration)
    
[ ] API Response Time
    → GET responses <500ms (p99)
    → Complex queries <1000ms (p99)
    → Measure: npm run test:perf
```

#### 프로젝트별 추가 검증

**Discord Bot P1:**
```
[ ] Webhook Signature Validation ✅
    Scenario:
      1. POST /api/discord/webhook (valid signature)
      2. Verify timestamp NOT older than 5min
      3. POST with tampered payload → 401 Unauthorized
    
[ ] Message Sync RLS ✅
    Scenario:
      1. org-alpha syncs message → message_sync (org_id: alpha)
      2. org-beta reads message_sync
      3. Assert: message_sync invisible to org-beta (RLS)
    
[ ] Duplicate Message Prevention ✅
    Scenario:
      1. POST /api/discord/sync (telegram_id: X, org_id: alpha)
      2. POST same webhook again → 409 Conflict
      3. Assert: Only 1 row in db
```

**Team Dashboard P2:**
```
[ ] Role-Based Access Control ✅
    Scenario:
      1. Operator reads performance_metrics (allowed)
      2. Operator updates goals (denied by RLS)
      3. Admin updates goals (allowed)
      4. Assert: RLS triggers correct errors
    
[ ] Goal Atomicity ✅
    Scenario:
      1. Create goal (target_percentage: 95%, deadline: 2026-06-30)
      2. Concurrent: User A updates to 90%, User B updates to 92%
      3. Assert: Last write wins (version control)
      4. Audit log records both changes
```

**Travel P2 UI:**
```
[ ] Expense Calculation ✅
    Scenario:
      1. Travel 5 days: hotel_rate 100 × 5 = 500
      2. Transport 300 + Meals 100 = 900
      3. Total: 1400 (no discount, <7 days)
      
      2. Travel 10 days: 100 × 10 × (1 - 0.10) = 900 + 300 + 100 = 1300
      4. Assert: 10% discount applied
    
[ ] Travel Conflict Detection ✅
    Scenario:
      1. Employee booked: May 1-10
      2. New travel request: May 5-15
      3. Assert: Conflict detected (overlap 5-10)
      4. Error message: "Conflict with existing travel (May 1-10)"
    
[ ] Approver Workflow ✅
    Scenario:
      1. Employee submits travel (status: pending_approval)
      2. Approver views /app/travel/pending (sees request)
      3. Approver clicks Approve → status: approved
      4. Itinerary generated → employee sees /app/travel/my-itinerary
```

**Asset Master P2:**
```
[ ] Duplicate Detection Engine ✅
    Scenario:
      1. Exact: asset_code 'JIG-001' appears twice → detected
      2. Fuzzy: 'JIG-001A' vs 'JIG-001B' (distance 1, >0.85) → detected
      3. Assert: Message "Duplicates detected: 2 items"
    
[ ] Bulk Import Atomicity ✅
    Scenario:
      1. Upload 100 assets (1-99 valid, 100 has invalid fk_facility_id)
      2. System shows "Preview: 100 records, 1 error"
      3. User fixes item 100
      4. Click Approve → All 100 inserted atomically
      5. Revert scenario: Item 50 fails validation
      6. Assert: count = 0 (full rollback, not 49)
    
[ ] RLS Org Isolation ✅
    Scenario:
      1. org-alpha: INSERT 50 assets
      2. org-beta: GET /api/asset → count = 0 (RLS blocks)
      3. org-alpha: GET /api/asset → count = 50
    
[ ] Asset Health Score Calc ✅
    Scenario:
      1. Asset: condition=good, reliability=0.95, age_months=6
      2. Score = condition_factor(0.9) × reliability(0.95) × age_factor(0.95)
      3. Assert: 0.9 × 0.95 × 0.95 = 0.812 (health_score)
```

**Backup App P2:**
```
[ ] Retention Policy Enforcement ✅
    Scenario:
      1. Create backup_daily on 2026-05-21 (7 days old)
      2. Cron runs cleanup: backup should delete (age > 7 days)
      3. Create backup_weekly on 2026-05-01 (27 days old)
      4. Cron runs: backup should delete (age > 28 days is false, 27 < 28)
      5. Create backup_monthly on 2026-04-27 (31 days old)
      6. Cron runs: backup should delete (age > 365 is false, 31 < 365)
    
[ ] Archive Integrity ✅
    Scenario:
      1. Create tar.gz of 10 backups (100MB total)
      2. Verify compressed size ~60MB (40% ratio)
      3. Extract & verify checksum matches original
    
[ ] S3 Versioning ✅
    Scenario:
      1. Upload version 1 (v1-metadata, version_id: abc123)
      2. Upload version 2 (v2-metadata, version_id: def456)
      3. GET ?versionId=abc123 → return v1
      4. GET latest → return v2
    
[ ] Orphaned Cleanup ✅
    Scenario:
      1. S3 has object (version_id: xyz789)
      2. DB entry deleted (backup.id gone)
      3. Cron cleanup: detects orphan, deletes from S3
      4. Cleanup report generated
```

**Harness Eng P2:**
```
[ ] Conflict Detection Logic ✅
    Scenario:
      1. Schedule 1: facility_id=1, date=2026-06-01, shift=A (08:00-16:00)
      2. Maintenance Plan 1: facility_id=1, scheduled_start=2026-06-01 10:00
      3. detectConflict() → type='time_overlap'
      4. Assert: Conflict.severity = 'critical'
    
[ ] Resource Contention ✅
    Scenario:
      1. Plan A: asset_id=100, scheduled_start=10:00, duration=2h
      2. Plan B: asset_id=100, scheduled_start=11:00, duration=1h
      3. Assert: resource_contention detected (asset used by multiple plans)
    
[ ] Capacity Exceeded ✅
    Scenario:
      1. Facility capacity: 10 assets
      2. Schedule 15 maintenance tasks for this facility
      3. Assert: capacity_exceeded, severity=critical
    
[ ] Validation API RLS ✅
    Scenario:
      1. org-alpha creates schedule → validation API stores in org_id=alpha
      2. org-beta GET /api/harness/validations → count=0 (RLS blocks)
      3. org-alpha GET /api/harness/validations → count=correct
```

**Memory Auto P2B:**
```
[ ] Duplicate Detection (Unit+Integration) ✅
    Scenario:
      1. memory/ has entries:
         - "Asset Master Phase 2 API Design" (created 2026-05-20)
         - "Asset Master P2 API Specification" (created 2026-05-21)
      2. System calculates similarity (Levenshtein + semantic)
      3. Score >0.75 → flagged as potential duplicate
      4. Cron publishes: "Duplicates detected: 1 pair"
    
[ ] Cron Execution ✅
    Scenario:
      1. Cron trigger: 2026-05-31 18:00
      2. Scans memory/ for new entries (mtime > last_run)
      3. Duplicate detection engine runs
      4. Publishes duplicates_detected event
      5. Assert: Event in DB (memory_automation table)
```

#### Go/No-Go 게이트 2 (Iteration 2)

**Pass 조건:**
```
RLS Cross-Org ✅ AND
API Contract ✅ AND
Pagination/Filter ✅ AND
Transaction Atomicity ✅ AND
Authorization ✅ AND
Error Handling ✅ AND
API Response <500ms (p99) AND
Project-Specific Tests ✅
```

**Fail 시 조치:**
```
❌ RLS leak detected → 정책 재검토 + RLS rule 수정 (2-4시간)
❌ API contract fail → endpoint 수정 + 문서 갱신
❌ Atomicity fail → transaction 로직 재설계 (1-2시간)
❌ Perf issue → 쿼리 최적화 + index 추가
```

**통과 신호:** "✅ Integration Validation PASSED"  
**진행:** Iteration 3로 이동 (즉시)

---

### Iteration 3: E2E Validation (Day 3-4)

**목표:** 최종 사용자 워크플로우 + 접근성 + 성능  
**담당:** 웹개발자 (Playwright) + 평가자 (QA)  
**검증 기한:** 각 프로젝트별 Day 3-4 단계

#### 체크리스트 (공통)

```
[ ] Critical User Path Complete (Golden Path)
    Scenario: 각 프로젝트별 "Happy Path" 실행
    → Playwright E2E 테스트 (timeout: 30s per test)
    → 성공 rate ≥95% (3회 반복 실행)
    
[ ] Accessibility (WCAG AA) ✅
    Tool: axe-core
    Command: npm run test:a11y
    Assert:
      - 0 violations (critical)
      - 0 violations (serious)
      - ≤5 violations (moderate) [리팩터링 대기]
    
    Manual Checks:
      [ ] Keyboard navigation (Tab, Enter, Esc)
      [ ] Screen reader (NVDA/VoiceOver) — 주요 라벨 읽음
      [ ] Color contrast ≥4.5:1 (normal text), ≥3:1 (large)
    
[ ] Performance Baselines
    Metrics:
      - FCP (First Contentful Paint) <3s
      - LCP (Largest Contentful Paint) <4s
      - CLS (Cumulative Layout Shift) <0.1
      - API response p99 <500ms
    
    Command: npm run test:perf
    
[ ] Mobile Responsiveness
    Viewports: iPhone 12 (390×844), Android (375×667), iPad (1024×1366)
    Checks:
      [ ] Text readable (no zoom needed)
      [ ] Touch targets ≥44×44px
      [ ] Scrolling smooth (no jank)
      [ ] Forms functional (mobile keyboard handling)
    
    Playwright:
      await page.setViewportSize({ width: 390, height: 844 });
      → Verify layout stacked (flexDirection: column)
    
[ ] Error States ✅
    Scenarios:
      [ ] 404 Not Found (graceful message)
      [ ] 500 Server Error (error logging, user alert)
      [ ] Network timeout (retry logic, user feedback)
      [ ] Validation error (form highlights, message)
    
[ ] Cross-Browser Testing
    Browsers: Chrome, Firefox, Safari
    Command: npm run test:e2e -- --project=chromium --project=firefox
    Assert: All scenarios pass on all browsers
```

#### 프로젝트별 E2E 시나리오

**Discord Bot P1:**
```
Golden Path:
  1. webhook POST /api/discord/webhook
     {
       update_id: 12345,
       message: {
         message_id: 999,
         from: { id: 111, username: "alice" },
         text: "Hello Discord",
         date: 1234567890
       }
     }
  
  2. /app/discord/sync-history loads
     → table has 1 row (message visible)
     → text: "Hello Discord"
     → from: "alice"
  
  3. Click message row
     → detail pane shows full message + metadata
     → timestamp formatted: "2026-05-28 14:30"
  
  4. Audit Log visible
     → event_type: "message_sync"
     → status: "completed"

Accessibility:
  [ ] Keyboard: Tab navigates table rows, Enter expands detail
  [ ] Screen reader: Message content, user, timestamp read aloud
  [ ] Color: Message highlight contrast ≥4.5:1

Mobile:
  [ ] iPhone: table → list layout (flex column)
  [ ] Touch targets: row height ≥44px
  [ ] Text: readable without zoom
```

**Team Dashboard P2:**
```
Golden Path:
  1. /app/dashboard loads
     → Performance Card visible
     → KPIs: OEE 87.5%, Downtime 12.3h, Quality 98.1%
  
  2. Click "Set Goal" button
     → Modal opens: target_percentage field, deadline picker
     → Input: target=92%, deadline=2026-06-30
  
  3. Submit
     → Goal created (DB verify: goals table count +1)
     → Card updates: "Goal Set: 92% by 2026-06-30"
     → Audit log: goal_created event
  
  4. Navigate to /app/dashboard/history
     → Timeline shows:
       * Goal created: 2026-05-28 15:00
       * Performance updated: 2026-05-28 14:30
     → Filtering works: filter by type="goal_created" → 1 result

Accessibility:
  [ ] Keyboard: Tab through KPI cards, Enter to expand
  [ ] Modal: Escape closes, Focus trap enabled
  [ ] Color: KPI values ≥4.5:1 contrast
  [ ] Picker: Date input accessible

Mobile:
  [ ] Cards stack vertically
  [ ] Modal responsive (full width on mobile)
  [ ] Touch buttons ≥48px
```

**Travel P2 UI:**
```
Golden Path:
  1. /app/travel/new loads
     → Form: employee_name, destination, start_date, end_date
  
  2. Fill form:
     employee_name: "Alice"
     destination: "Bangalore"
     start_date: 2026-06-05
     end_date: 2026-06-12 (8 days)
  
  3. Click "Calculate Cost"
     → System: hotel 100 × 8 × 0.9 = 720, transport 300, meal 100
     → Total displayed: ₹1120 (with 10% discount for >7 days)
  
  4. Submit for Approval
     → Status: pending_approval
     → Message: "Submitted to Approver (Alice's Manager)"
     → Redirect to /app/travel/my-itinerary
  
  5. Manager approves (as approver)
     → /app/travel/pending shows 1 request
     → Click Approve
     → Status changes to approved
  
  6. Alice sees itinerary:
     → /app/travel/itinerary/[id]
     → Timeline: Hotel (6/5-6/12), Transport (6/5, 6/12), Meals (6/5-6/12)
     → "Total Cost: ₹1120"

Accessibility:
  [ ] Form labels: associated with inputs (for="...")
  [ ] Date picker: keyboard accessible (arrow keys)
  [ ] Timeline: list structure (semantic HTML)
  [ ] Color: ₹1120 (cost highlight) ≥4.5:1 contrast

Mobile (iPhone 12):
  [ ] Form inputs: full width
  [ ] Cost display: readable without zoom
  [ ] Timeline: horizontal scroll (if needed)
  [ ] Touch buttons: ≥44px height
```

**Asset Master P2:**
```
Golden Path:
  1. /app/assets/import loads
     → File input: "Select Excel"
  
  2. Upload test-assets.xlsx (100 rows)
     → Preview shows:
       * "Assets to import: 100"
       * "Duplicates detected: 3 items"
       * List of duplicates with suggestions
  
  3. User reviews duplicates:
     → Merge 2 exact matches (asset_code identical)
     → Keep 1 fuzzy match (variant, different model)
     → Count updates: "98 unique assets"
  
  4. Click "Approve & Import"
     → Loading: "Importing 98 assets..."
     → Complete (timeout 10s)
     → Message: "✅ Import Complete"
     → Redirect to /app/assets (list view)
  
  5. Asset list visible:
     → 98 rows loaded
     → Pagination: "Showing 1-20 of 98"
     → Filters: asset_code, status, health_score
  
  6. Click asset "JIG-001"
     → Detail view: asset_code, description, health_score (0.81)
     → History: "Imported on 2026-05-28 14:30"

Accessibility:
  [ ] File input label: "Choose file to import"
  [ ] Duplicate list: semantic (ul/li), keyboard accessible
  [ ] Table headers: scope="col"
  [ ] Keyboard: Tab through table rows, Enter to view detail

Mobile:
  [ ] File input: full width
  [ ] Duplicate list: stack vertically
  [ ] Table: horizontal scroll (or card layout)
  [ ] Touch buttons: ≥44px
```

**Backup App P2:**
```
Golden Path:
  1. /app/backup/new loads
     → File input: "Select file to backup"
  
  2. Select 500MB file
     → Upload with progress: "Uploading... 45% (225MB)"
     → Chunked upload (100MB per chunk)
  
  3. Complete
     → Backup created: ID=backup-2026-0528-001
     → Status: "processing" → "completed" (after 5s)
     → Message: "✅ Backup created"
  
  4. /app/backup/list shows:
     → Backup row: size 500MB, date 2026-05-28, status "completed"
     → Actions: Archive, Restore, Delete
  
  5. Click Archive
     → Dialog: "Archive before 2026-06-28?"
     → Confirm
     → Status changes: "archived"
     → Message: "✅ Archived"
  
  6. Retention Cleanup (simulated cron)
     → 8-day-old daily backups: deleted (age > 7d)
     → Cleanup report: "3 backups deleted, 245MB freed"

Accessibility:
  [ ] File input label: "Select file"
  [ ] Progress bar: aria-label="Upload progress: 45%"
  [ ] Table: scope="col" headers
  [ ] Dialog: focus trap, Escape closes

Mobile:
  [ ] File input: full width
  [ ] Progress bar: responsive
  [ ] Action buttons: ≥44px
  [ ] Table: card layout (on mobile)
```

**Harness Eng P2:**
```
Golden Path:
  1. /app/harness/schedules loads
     → Schedule list: facility, date, shift, quantity
  
  2. Create new schedule:
     → Click "+ New Schedule"
     → Form: facility_id (dropdown), scheduled_date, shift (A/B/C), target_quantity
     → Submit
     → Schedule created: "Schedule-2026-0528-001"
  
  3. Create maintenance plan:
     → /app/harness/maintenance/new
     → Form: facility_id, asset_id, scheduled_start (time), duration (hours)
     → Submit
     → Plan created
  
  4. System validates conflicts (auto):
     → /app/harness/validations shows:
       * 0 time_overlap conflicts
       * 0 resource_contention
       * 0 capacity_exceeded
     → Status: "All Clear ✅"
  
  5. Create conflicting plan (optional test):
     → Maintenance overlaps schedule → time_overlap detected
     → Validation report: "Conflict detected at 10:00-11:00"
     → Severity: critical
     → Recommendation: "Reschedule to afternoon"
  
  6. Audit log (manual verification):
     → /app/harness/audit logs validation event
     → Event: "validation_completed"
     → Conflict count: 1

Accessibility:
  [ ] Form labels: <label for="facility_id">
  [ ] Dropdowns: keyboard navigable
  [ ] Conflict message: color not sole indicator
  [ ] Audit log table: scope="col"

Mobile:
  [ ] Form inputs: full width
  [ ] Dropdowns: expanded overlay (full screen on mobile)
  [ ] Validation status: clear text + color
```

**Memory Auto P2B:**
```
Golden Path (Cron Validation):
  1. memory/ directory contents:
     - project_asset_master_phase2.md (created 2026-05-20)
     - project_asset_master_p2_api.md (created 2026-05-21)
  
  2. Trigger cron: 2026-05-31 18:00
     → Scan memory/ for new/modified files
     → Run duplicate detection
  
  3. System detects:
     → Similarity score: 0.82 (>0.75 threshold)
     → Flags: Asset Master Phase 2 files similar
  
  4. Publish event:
     → memory_automation table entry created
     → duplicates_detected event
     → Pair list: [file_a, file_b, score: 0.82]
  
  5. Manual verification:
     → Admin reviews pair
     → Merges duplicates OR confirms intentional (different scopes)

Golden Path (Non-E2E):
  - Cron is server-side only (no UI)
  - E2E validation done via:
    [ ] Cron execution logs (process output)
    [ ] Database event table (memory_automation)
    [ ] Duplicate detection accuracy (F1 score >0.9)
```

#### Go/No-Go 게이트 3 (Iteration 3)

**Pass 조건:**
```
Golden Path ≥95% pass rate (3회 반복) AND
WCAG AA 0 critical violations AND
Mobile responsive ✅ (all 3 viewports) AND
Performance targets met (FCP <3s, API <500ms) AND
Keyboard accessibility ✅ AND
Cross-browser ✅ (Chrome, Firefox)
```

**Fail 시 조치:**
```
❌ Golden Path fail (1 failure per 20 runs) → UI 버그 수정 + 테스트 재실행
❌ Accessibility violation → WCAA AA 정책 수정 + 재검증
❌ Mobile responsive fail → CSS 미디어쿼리 수정
❌ Performance issue → 최적화 (lazy load, code split, query optimization)
```

**통과 신호:** "✅ E2E Validation PASSED"  
**진행:** Pre-Deployment Validation (10단계) 시작

---

## 🚀 10단계 Pre-Deployment Validation

모든 프로젝트가 Iteration 3를 통과한 후:

### Stage 1: Code Quality (Day 5 08:00)
```bash
# Build 성공 확인
npm run build
→ 0 errors, 0 warnings

# Test coverage 최종 확인
npm run test:coverage
→ Overall ≥75%

# Linter 최종 확인
npm run lint
→ 0 errors, 0 warnings (strict mode)
```

**Gate:** ✅ All builds clean

---

### Stage 2: Security & Auth (Day 5 12:00)
```bash
# JWT 만료 토큰 거절 확인
Test: POST /api/protected with expired JWT → 401

# CORS 화이트리스트 확인
Test: Origin: https://unauthorized.com → CORS rejection

# RLS 정책 검토
Checklist:
  [ ] 26개 테이블 RLS 활성화 ✅
  [ ] 35+ RLS 정책 검토 ✅
  [ ] Cross-org 테스트 통과 ✅

# 시크릿 스캔
git secrets scan
→ 0 exposed API keys, passwords, tokens
```

**Gate:** ✅ No security issues

---

### Stage 3: Database Integrity (Day 5 16:00)
```bash
# Foreign Key 강제 확인
Test: INSERT invalid FK → constraint violation

# Unique 제약 테스트
Test: INSERT duplicate unique field → error

# Trigger 원자성 테스트
Test: Bulk insert with trigger → all-or-nothing

# Rollback 성공 확인
Test: SAVEPOINT → rollback → initial state restored
```

**Gate:** ✅ DB constraints enforced

---

### Stage 4: Performance (Day 5 18:00)
```bash
# API p99 response time
npm run test:perf
→ API <500ms, Query <100ms

# 대규모 데이터셋 (10k+ rows)
Test: GET /api/resource?limit=100 with 10k rows
→ <500ms, pagination works

# 메모리 누수 감지
Load test 30분 → 힙 크기 안정적 (증가 <10%)
```

**Gate:** ✅ Performance baseline met

---

### Stage 5: Accessibility (Day 6 08:00)
```bash
# axe-core 검사 (자동)
npm run test:a11y
→ 0 critical violations

# WCAG AA 컴플라이언스
Manual checklist:
  [ ] Keyboard navigation complete (Tab, Enter, Escape)
  [ ] Screen reader compatible (major paths tested)
  [ ] Color contrast ≥4.5:1 (normal), ≥3:1 (large)
  [ ] Focus visible (outline, indicator)
```

**Gate:** ✅ Accessibility compliant

---

### Stage 6: Error Handling (Day 6 10:00)
```bash
# 404 페이지
GET /api/nonexistent → proper 404 response

# 500 에러 로깅
Trigger server error → logs to Sentry/DataDog

# 사용자 에러 메시지
Form validation fail → clear, actionable message

# Alert thresholds
Check: Monitoring system configured
  [ ] Alert on >5% error rate
  [ ] Alert on API p99 >1000ms
  [ ] Alert on DB availability <99.9%
```

**Gate:** ✅ Error handling operational

---

### Stage 7: Deployment Infrastructure (Day 6 12:00)
```bash
# Vercel 빌드 성공
Push to main → Vercel build succeeds (0 errors)

# 환경 변수 설정 (Vercel Dashboard)
Check:
  [ ] SUPABASE_URL set
  [ ] SUPABASE_ANON_KEY set
  [ ] NEXT_PUBLIC_* vars public only
  [ ] No secrets in git history

# HTTPS 강제
Test: http://... → redirects to https://...

# 백업 확인 (최근 24시간)
Check: Last backup timestamp <24h ago
```

**Gate:** ✅ Infrastructure ready

---

### Stage 8: Smoke Tests (Staging) (Day 6 14:00)
```bash
# Staging deployment
Deploy to staging.vercel.app (or dev environment)

# Critical workflows
Test each golden path:
  1. Create asset → list → update → ✅
  2. Upload backup → archive → ✅
  3. Submit travel → approve → itinerary → ✅
  4. Detect conflict → audit log → ✅

# RLS validation (staging)
Cross-org access test → 0 leakage
```

**Gate:** ✅ Smoke tests passed

---

### Stage 9: Stakeholder Sign-Off (Day 6 15:00)

**PM:**
```
Checklist:
  [ ] All requirements met (feature completeness)
  [ ] User stories tested (acceptance criteria)
  [ ] No scope creep (requirements match design)
```

**Security:**
```
Checklist:
  [ ] RLS review passed (no leakage)
  [ ] Auth flow validated (JWT, session, OAuth)
  [ ] Secrets secured (no hardcoding)
```

**DevOps:**
```
Checklist:
  [ ] Build pipeline verified
  [ ] Monitoring/alerting configured
  [ ] Backup strategy confirmed
  [ ] Rollback procedure documented
```

**QA:**
```
Checklist:
  [ ] All test plans executed ✅
  [ ] Coverage targets met (≥75%)
  [ ] Critical bugs resolved (0 critical, ≤5 high)
  [ ] Regression testing passed
```

**All Sign-Offs:** ✅ (Each stakeholder initials)

---

### Stage 10: Go/No-Go Decision (Day 6 17:00)

**Final Decision Matrix:**

| Criterion | Status | Owner | Decision |
|-----------|--------|-------|----------|
| Code Quality | ✅ Pass | QA | GO |
| Security & Auth | ✅ Pass | Security | GO |
| Database | ✅ Pass | DevOps | GO |
| Performance | ✅ Pass | Performance Team | GO |
| Accessibility | ✅ Pass | UX | GO |
| Error Handling | ✅ Pass | DevOps | GO |
| Infrastructure | ✅ Pass | DevOps | GO |
| Smoke Tests | ✅ Pass | QA | GO |
| PM Sign-Off | ✅ Approved | PM | GO |
| Security Sign-Off | ✅ Approved | Security | GO |
| DevOps Sign-Off | ✅ Approved | DevOps | GO |
| QA Sign-Off | ✅ Approved | QA | GO |

**Final Verdict:** 🟢 GO FOR PRODUCTION DEPLOYMENT

**Deploy Command (Day 6 18:00):**
```bash
# 전체 팀 승인 후
git tag v1.0-release-2026-06-02
git push origin v1.0-release-2026-06-02

# Vercel production deployment
vercel --prod

# Verify
curl https://api.dsc-fms.com/health → 200 OK
```

**Post-Deployment Monitoring (Day 6 18:00 ~ Day 7 18:00):**
```
[ ] Monitor error rate (<1%)
[ ] Monitor API latency (p99 <500ms)
[ ] Monitor user feedback (0 critical bugs)
[ ] Monitor Sentry/DataDog alerts (none)
[ ] Prepare rollback procedure (if critical issue)
```

---

## 📅 타임라인 서머리

```
Day 1-2: Iteration 1 (Unit Validation) — All 7 projects
Day 2-3: Iteration 2 (Integration Validation) — All 7 projects
Day 3-4: Iteration 3 (E2E Validation) — All 7 projects
Day 5-6: Pre-Deployment Validation (10 stages) — All projects combined
Day 6 18:00: 🟢 GO FOR PRODUCTION

기한: 2026-06-02 18:00 KST ✅
```

---

## 🎯 성공 지표

```
✅ Iteration 1 Pass Rate: 100% (7/7 projects)
✅ Iteration 2 Pass Rate: 100% (7/7 projects)
✅ Iteration 3 Pass Rate: ≥95% (3회 반복 평균)
✅ Code Coverage: ≥75% (전체 프로젝트)
✅ Critical Bugs: 0개
✅ Accessibility Violations: 0개 (critical)
✅ Production Deployment: 2026-06-02 18:00 KST ✅
```

---

**문서 버전:** 1.0  
**마지막 갱신:** 2026-05-28 03:45 KST  
**상태:** 🟢 DESIGN_COMPLETE — 구현팀 (Web-Builder + Evaluator AI) 위임 준비 완료
