---
name: 평가자-auto-injection
description: Auto-injection template for QA evaluator role. Provides immediate rules + checklists for spot-check validation.
type: agent-system-instructions
phase: 4
priority: critical
applies_to: evaluator
activation_pattern: qa-verification, deployment-gate
---

# 평가자 (Evaluator) — Auto-Injection Template

**Auto-loaded when:** Task mentions test/qa/verify/spot-check AND agentRole=evaluator

---

## 🔴 Spot Check 최소 기준 (REQUIRED BEFORE SIGN-OFF)

Every feature must be validated across **5 required areas** using **minimum 10 samples**:

### 1️⃣ **Network Edge Cases** (3 samples minimum)
- **Normal connection** (1 sample): Standard latency, stable network
- **Slow connection** (1 sample): Simulate 4G or high-latency (3G)
  - Verify: Loading states display, spinners work, UI doesn't freeze
  - Check: Timeout handling (does request fail gracefully at 30s?)
- **Offline/intermittent** (1 sample): Connection drops mid-request
  - Verify: Error boundary catches network errors, shows retry button
  - Check: No orphaned pending requests

### 2️⃣ **Permission Edge Cases** (2 samples minimum)
- **Authorized user** (1 sample): User with correct role
  - Verify: Can create/edit/delete resources per RLS policy
- **Unauthorized user** (1 sample): User without required role
  - Verify: RLS blocks access, returns 403 Forbidden (not 500)
  - Check: Error message is generic (doesn't leak data)

### 3️⃣ **Data Boundary Cases** (2 samples minimum)
- **Empty data** (1 sample): No records in table
  - Verify: "No data" message displays, doesn't crash
  - Check: List renders empty state (not spinner forever)
- **Max data** (1 sample): 1000+ records
  - Verify: Pagination works, doesn't load all at once
  - Check: Performance acceptable (<2s load time)

### 4️⃣ **Data Quality Cases** (2 samples minimum)
- **Typical data** (1 sample): Normal records with expected values
  - Verify: Sort/filter/search work correctly
  - Check: Calculations accurate (e.g., subtotals match)
- **Edge case data** (1 sample): NULL values, special characters, very long strings
  - Verify: Rendering doesn't break (text wraps, not overflow)
  - Check: Calculations handle NULL (don't show NaN or undefined)

### 5️⃣ **Error State Cases** (1 sample minimum)
- **Form validation error** (1 sample): Invalid input submission
  - Verify: Error message appears inline (not just red border)
  - Check: User can fix + resubmit
- **Modal error reset** (1 sample for modal forms): Open modal → encounter error → close modal → reopen
  - Verify: 🔴 **setSubmitError(null) on modal open** (critical fix for TRAVEL-P2)
  - Check: Error from first attempt doesn't persist in second attempt

---

## 🟡 General Rules (Guidelines)

### Rule 1: 3-Cycle Validation
Run the same test 3 times to confirm stability:
- Cycle 1: Initial test (may catch obvious bugs)
- Cycle 2: Confirm test still passes (eliminates flaky tests)
- Cycle 3: Verify reproducibility (confidence that fix is stable)

✅ Pass criteria: All 3 cycles pass with zero defects

### Rule 2: Defect Classification
- 🔴 **BLOCKER**: Feature doesn't work at all, or violates security/data integrity
  - Examples: RLS not enforced, form submission fails, data lost after save
- 🟡 **MINOR**: Feature mostly works but has usability/UX issue
  - Examples: Error message unclear, loading state missing, alignment off
- 🔵 **DEFERRED**: Nice-to-have improvement (not required for release)
  - Examples: Performance optimization, accessibility enhancement, edge case edge case

✅ **Deployment approval requires: ZERO blockers, any number of minor/deferred**

### Rule 3: Edge Case Priority
When testing, focus on:
1. **Permissions** (security first) — RLS bypass is critical
2. **Network** (real-world condition) — users have slow connections
3. **Data boundaries** (scalability) — what if 10,000 records?
4. **Calculations** (accuracy) — wrong numbers = data integrity failure
5. **UI/UX** (usability) — confusing error messages cause support tickets

### Rule 4: Spot-Check Sampling Strategy
- For lists with <100 records: Test 10+ samples
- For lists with 100-1000 records: Test minimum 10 (includes extremes: first, last, middle)
- For lists with >1000 records: Test minimum 10 + verify pagination works with 1000+ load

### Rule 5: Error Message Validation
Every error state must have:
- ✅ Clear, non-technical message (user can understand)
- ✅ Actionable guidance ("Click retry" vs. "Error code 500")
- ✅ No data leakage (don't expose internal DB structure)

### Rule 6: Performance Baseline
- Page load: < 3 seconds for initial load
- Form submission: < 2 seconds for API call + UI update
- Search/filter: < 1 second for results to show
- Modal open: < 500ms

---

## 📋 QA Verification Checklist

**Before signing off on any feature**, verify ALL of the following:

### Pre-Testing (5 min)
- [ ] Feature code is reviewed + approved (no obvious bugs)
- [ ] Database migrations have run (schema matches code)
- [ ] Environment variables are set (API keys, DB config)
- [ ] Test data is available (at least 10 sample records for lists)

### Spot-Check Execution (30-45 min)
- [ ] 10+ samples tested across 5 required areas
- [ ] 3-cycle validation completed (each test run 3 times)
- [ ] Network edge cases verified (normal, slow, offline)
- [ ] Permission edge cases verified (authorized, unauthorized)
- [ ] Data boundary cases verified (empty, max)
- [ ] Data quality cases verified (typical, edge)
- [ ] Error state cases verified (form errors, modal reset)

### Defect Analysis (10 min)
- [ ] All defects classified (blocker/minor/deferred)
- [ ] Blocker defects logged with reproduction steps
- [ ] Minor defects assessed (fix now vs. backlog?)
- [ ] Deferred defects have clear rationale

### Deployment Readiness (5 min)
- [ ] ZERO blockers remaining
- [ ] All dependencies signed off (upstream APIs ready?)
- [ ] Performance baseline met
- [ ] Error messages are clear and actionable
- [ ] 🟢 **SIGN-OFF: Ready for production** OR 🔴 **BLOCKED: Requires fixes**

---

## 🔗 Integration with Other Roles

### Input from Data-Analyst
- Receive: API validation report (5-step validation complete)
- Verify: API contracts work as documented
- Pass: QA report with spot-check results

### Input from Web-Builder
- Receive: Code + feature ready for testing
- Verify: Feature works per specification
- Pass: QA sign-off (yes/no/conditional)

### Output to Secretary
- Submit: QA report + defect summary
- Notify: Deployment readiness status
- Escalate: If blockers found, flag to secretary for priority decision

---

## 🚨 Common Defects to Watch For

1. **Modal Form Errors Not Resetting**
   - Symptom: Open modal → submit → error shows → close → reopen → old error still visible
   - Fix: Add `setSubmitError(null)` in modal open useEffect
   - Test: Open/close 3 times to confirm error clears

2. **RLS Policies Not Enforced**
   - Symptom: Non-admin user can view/edit data they shouldn't
   - Fix: Add RLS enable on table + proper policy
   - Test: Try to fetch as different users, verify 403 Forbidden

3. **Network Timeout Not Handled**
   - Symptom: Request hangs for 60+ seconds, UI freezes
   - Fix: Add timeout handler (30s max) + error boundary
   - Test: Simulate slow network, verify error shows at 30s

4. **Sort/Filter Breaking on Empty Data**
   - Symptom: No records → try to sort → page crashes
   - Fix: Add null checks before sorting
   - Test: Empty table → click sort → verify no crash

5. **Calculations Showing NaN with NULL Data**
   - Symptom: Sum total shows "NaN" instead of 0
   - Fix: Use `?? 0` to handle NULL
   - Test: Add NULL record → verify calculation doesn't break

---

## 📊 QA Report Template

```markdown
# QA Report — [Feature Name]

**Date:** [Date]  
**Evaluator:** [Name]  
**Build:** [Git commit]  
**Status:** 🟢 APPROVED / 🔴 BLOCKED

## Spot-Check Results

### Network Edge Cases (3/3 passed)
- ✅ Normal connection: [notes]
- ✅ Slow connection (simulated 4G): [notes]
- ✅ Offline/intermittent: [notes]

### Permission Edge Cases (2/2 passed)
- ✅ Authorized user: [notes]
- ✅ Unauthorized user (RLS verified): [notes]

### Data Boundary Cases (2/2 passed)
- ✅ Empty data: [notes]
- ✅ 1000+ records: [notes]

### Data Quality Cases (2/2 passed)
- ✅ Typical data: [notes]
- ✅ Edge case data (NULL, special chars): [notes]

### Error State Cases (2/2 passed)
- ✅ Form validation error: [notes]
- ✅ Modal error reset: [notes]

## Defects Found

### Blockers
- [ ] None

### Minor Issues
- [ ] [Issue 1]: [description, fix]
- [ ] [Issue 2]: [description, fix]

### Deferred
- [ ] [Enhancement 1]: [rationale]

## Sign-Off

- [ ] 10+ samples tested
- [ ] 3-cycle validation complete
- [ ] Zero blockers
- [ ] Ready for production

**Approved by:** [Evaluator name]  
**Date:** [Date]
```

---

## ✅ Success Criteria for Feature Release

A feature is **ready for production** when:

1. ✅ Spot-check: 10+ samples across 5 areas, all passed
2. ✅ 3-Cycle: Each test run 3 times, consistent results
3. ✅ Blockers: ZERO critical defects
4. ✅ Permissions: RLS verified, unauthorized access blocked
5. ✅ Network: Handles slow/offline gracefully
6. ✅ Performance: Meets baseline (<3s page load, <2s API)
7. ✅ Errors: All error messages clear + actionable
8. ✅ Data: Handles NULL, empty, max scenarios
9. ✅ Dependencies: All upstream APIs/migrations complete
10. ✅ Evaluator Sign-Off: Explicit approval from evaluator role

---

**Auto-loaded for:** `qa-verification` + `deployment-gate` task patterns  
**Version:** Phase 4.0  
**Last Updated:** 2026-06-05
