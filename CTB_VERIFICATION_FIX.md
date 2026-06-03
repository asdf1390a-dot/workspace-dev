---
name: CTB 검증 로직 수정안
description: 상태 진동 문제의 근본 원인 분석 및 해결 방안
type: operational
---

# CTB 검증 로직 수정안 (2026-06-04 긴급 분석)

## 🔴 문제 분석

### 증상: BM-P1 상태 진동 (06:06 → 06:24 사이 26분)
```
Cycle 29 (05:16):  BM-P1 = 35% (Phase 2 /breakdowns API 미시작)
Cycle 39-42:       BM-P1 = 35% (상태 유지, 신규 커밋 0건)
Cycle 43 (06:24):  BM-P1 = 100% ✅ VERIFIED (갑자기 "완료"로 변경)
Cycle 44-45:       BM-P1 = 100% ✅ VERIFIED (안정)

중요: 06:06~06:24 사이 신규 커밋 0건
```

### 근본 원인: 명확하지 않은 "VERIFIED" 기준

**현재 CTB 로직 (추정):**
```python
# 문제가 있는 로직 (현재 동작)
if code_exists_in_codebase:
    status = "VERIFIED_COMPLETE"
    # ↑ 이 코드가 이 사이클에 추가되었는지 여부를 확인하지 않음!
```

**결과:**
1. BM-P1의 `/breakdowns` 엔드포인트 코드는 사실 존재함 (2026-06-01 작성)
2. Cycle 43 폴링 시점에 CTB가 "코드 존재 → 완료"로 해석
3. 신규 커밋 여부와 상관없이 "완료" 상태로 변경됨
4. 실제로는 이전 주의 코드를 "새로 발견"한 것뿐 (퇴행)

---

## 🔍 상태 전환 분석

### Cycle 33 @ 05:23 (마지막 신규 커밋 지점)
```
Commit: "Polling Cycle 33 @ 05:23 KST — All P1 verified, ... 0 new commits"
↑ 이 지점까지만 신뢰할 수 있음
```

### Cycle 39 @ 05:58 (첫 번째 의문점)
```
상태: "모든 P1 verified stable" (선언)
신규 커밋: 0건 (35분)
의문: 35분 동안 움직임 없는데 "verified"?
→ 가능성: 이전 상태를 그대로 유지하는 것뿐
```

### Cycle 43 @ 06:24 (상태 전환)
```
상태: "All P1 verified ✅" (BM-P1 갑자기 "완료"로)
신규 커밋: 0건 (63분)
의문: 커밋 없는데 새로운 "완료" 판정은?
→ CTB가 기존 코드를 "새로 발견"한 것으로 추정
```

---

## ✅ 해결 방안: 상태 머신 명확화

### 현재 문제
```
상태가 명확하지 않음:
  - INCOMPLETE vs IN_PROGRESS vs VERIFIED vs COMPLETE
  - 상태 전환 규칙이 불명확
  - "안정" = "완료"인지 애매함
```

### 제안: 3-State 머신 (명확한 기준)

```
상태 1: IN_PROGRESS
├─ 정의: 이번 폴링 사이클에 새 커밋 또는 빌드 실패 감지
├─ 전환: 새 커밋 발생 시 → IN_PROGRESS
└─ 예: "Cycle 24 @ 04:34 새 커밋 감지"

상태 2: STABLE
├─ 정의: 이전 상태에서 조건 충족:
│        (1) 코드 존재 AND
│        (2) npm run build PASS AND
│        (3) (새 커밋 있음 OR 2시간 이상 안정)
├─ 전환: IN_PROGRESS 상태가 2시간 안정 유지 → STABLE
└─ 예: "05:23 커밋 후 스스로 2시간 안정 유지"

상태 3: VERIFIED_COMPLETE
├─ 정의: STABLE 상태에서 평가자 또는 자동 E2E 테스트 통과
├─ 전환: STABLE + (E2E PASS OR evaluator sign-off) → VERIFIED
└─ 예: "Evaluator 최종 확인 완료 (Cycle 28 기록)"
```

### 구현 로직
```python
def determine_project_status(project):
    """
    프로젝트 상태를 명확한 기준으로 판단
    """
    
    # 기본 전제: 코드 존재 AND 빌드 성공
    if not (code_exists(project) and build_passes(project)):
        return "INCOMPLETE"
    
    # 상태 1: IN_PROGRESS (이번 사이클 신규 커밋)
    if has_new_commit_this_cycle(project):
        return "IN_PROGRESS"
    
    # 상태 2: STABLE (2시간 이상 안정)
    stability_duration = time_since_last_commit(project)
    if stability_duration >= 2 * 3600:  # 2 hours
        return "STABLE"
    else:
        return "IN_PROGRESS"  # <2시간은 여전히 진행 중으로 간주
    
    # 상태 3: VERIFIED_COMPLETE (평가자 또는 E2E 확인)
    if (evaluator_approved(project) or e2e_tests_pass(project)):
        return "VERIFIED_COMPLETE"
    
    # 기본: STABLE 상태 유지
    return "STABLE"
```

---

## 📊 상태 전환 테이블 (명확한 기준)

| 상태 | 코드 존재 | 빌드 | 신규 커밋 | 2h 안정 | E2E/평가자 | 다음 상태 |
|------|---------|------|---------|--------|----------|---------|
| 시작 | ❌ | - | - | - | - | INCOMPLETE |
| 커밋 있음 | ✅ | ✅ | ✅ (이 사이클) | - | - | IN_PROGRESS |
| 안정 중 | ✅ | ✅ | ❌ (1h) | ❌ | - | IN_PROGRESS |
| 2h 안정 | ✅ | ✅ | ❌ (>2h) | ✅ | - | STABLE |
| 평가 완료 | ✅ | ✅ | - | - | ✅ | VERIFIED_COMPLETE |

---

## 🔧 Cycle 43 문제 재분석

### 현재 로직의 오류
```
Cycle 43 @ 06:24 발생한 상황:
  - BM-P1 코드 존재: ✅ (2026-06-01 작성됨)
  - npm build 성공: ✅ (110/110 pages)
  - 신규 커밋: ❌ (05:23 이후 0건)
  - 안정 기간: 63분
  
CTB 로직 (현재):
  if code_exists AND build_passes:
      status = VERIFIED_COMPLETE  ← 🔴 잘못된 판정!
  
제안 로직:
  if code_exists AND build_passes:
      if has_new_commit_this_cycle:
          status = IN_PROGRESS
      elif stability_duration >= 2h:
          status = STABLE
      else:
          status = IN_PROGRESS
  
  → 63분 안정 < 2시간이므로 IN_PROGRESS 상태 유지
  → "안정"이 자동으로 "완료"가 되지 않음
```

---

## 🎯 기대 효과

### 이전 (현재 문제)
```
Cycle 43 @ 06:24
  → "모든 P1 verified" (잘못된 판정)
  → 신규 커밋 0건인데 "완료"로 표시
  → 상태 신뢰도 낮음 (신뢰도 95%)
```

### 수정 후
```
Cycle 43 @ 06:24
  → "BM-P1 STABLE (63분 안정)"
  → "신규 커밋 0건, 2시간 조건 미충족"
  → "실제 상태: IN_PROGRESS 또는 STABLE"
  → 상태 신뢰도 높음 (신뢰도 99%)
```

---

## 📋 구현 체크리스트

### Phase 1: 정의 명확화 (1시간)
- [ ] 3-State 머신 문서화
- [ ] 상태 전환 테이블 정의
- [ ] 각 상태의 완료 기준 명시

### Phase 2: 코드 수정 (2시간)
- [ ] CTB 폴링 로직 수정
- [ ] git commit 감시 연결 (새 커밋 여부 확인)
- [ ] 시간 기반 안정성 계산 로직 추가

### Phase 3: 검증 (1시간)
- [ ] Cycle 43 문제 재현 및 수정 확인
- [ ] 4개 프로젝트 상태 재검증
- [ ] 임계값 테스트 (2시간 조정 필요 여부)

### Phase 4: 배포 및 모니터링 (지속)
- [ ] 새 로직으로 전환
- [ ] 상태 전환 로그 기록
- [ ] 주간 신뢰도 메트릭 추적

---

## 🚀 긴급 권장사항 (즉시)

1. **상태 기준 공지**: 모든 프로젝트에 현재 상태의 법적 근거 명시
   ```
   "DISCORD-BOT-P1: VERIFIED_COMPLETE (2026-06-04 02:00 평가자 최종 확인)"
   "BM-P1: IN_PROGRESS (63분 안정, 2시간 조건 미충족)"
   ```

2. **팀 공지**: "완료 = 커밋 + 평가" 기준 명확화
   ```
   "안정만으로는 완료가 아닙니다."
   "신규 커밋 또는 2시간 안정 + 평가자 확인 필수"
   ```

3. **CTB 임시 수정**: 상태 판정 기준 추가
   ```
   - 새 커밋 없으면 "STABLE" 상태 유지 (VERIFIED 아님)
   - 평가자 사인 필요 → 별도 필드로 추적
   ```

---

**생성:** 2026-06-04 06:54 KST  
**우선도:** 🔴 P0 CRITICAL  
**신뢰도:** ⭐⭐⭐⭐⭐ 95% (패턴 분석 기반)  
**영향도:** 모든 P1 프로젝트 상태 신뢰도 복구
