---
name: CTB 자동화 대체방안 (평가자 Critical Issues 해결)
description: 평가자의 3가지 반려 사유를 해결하는 단계별 구체적 대체방안
type: project
---

# CTB 자동화 대체방안 — 평가자 Critical Issues 해결

**기한:** 즉시 (2026-05-16)  
**평가 대상:** 평가자 재검증  
**목표:** 평가자의 3가지 Critical Issues 모두 해결 → 비서 자동화 진행

---

## 평가자 3가지 Critical Issues & 해결책

### Issue 1: Telegram @default 채널 미설정
**문제:** Cron 메시지 50% 이상 손실 위험  
**근인:** 대부분의 정기 체크 Cron이 `delivery.mode="none"` (메시지 미발송)

**해결책 A (기본, 즉시 적용)**
```json
{
  "delivery": {
    "mode": "announce",
    "channel": "telegram",
    "to": "default"
  }
}
```

**대상 Cron 5개:**
1. 08:00 블로킹 추적 (2d26b9ea...)
2. 12:00 평가자 정기 체크 (8469d770...)
3. 14:00 플레너 정기 체크 (e41c61bd...)
4. 15:00 웹개발자 정기 체크 (dfec9588...)
5. 08:00 블로킹 추적 systemEvent (모두)

**예상 효과:** Telegram 메시지 손실률 0% → 신뢰도 ↑

---

### Issue 2: CTB 파일 11개 중복
**문제:** 메모리 낭비 + 유지보수 악화

**현재 중복 파일:**
```
1. memory/active_work_tracking.md       ✅ (MAIN)
2. memory/CTB_프로젝트추적판.md          🗑️ (DELETE)
3. CTB_RESTRUCTURE_PROPOSAL.md          🗑️ (DELETE)
4. active_work_tracking.md (root)       🗑️ (DELETE)
5-11. BACKUPS/ 내 파일들                🗑️ (보관만)
```

**해결책:**
1. **memory/active_work_tracking.md 만 유지** (SINGLE SOURCE OF TRUTH)
2. 나머지 4개 파일 삭제
3. MEMORY.md에서 duplicate 제거, active_work_tracking.md 포인터만 유지

**실행 순서:**
```bash
# Step 1: 백업 확인
ls -la memory/active_work_tracking.md
wc -l memory/active_work_tracking.md

# Step 2: 파일 삭제
rm CTB_RESTRUCTURE_PROPOSAL.md
rm active_work_tracking.md (root)
rm memory/CTB_프로젝트추적판.md

# Step 3: MEMORY.md 정리
# 현재: [Active Work Tracking](active_work_tracking.md)
# 유지: 하나의 포인터만

# Step 4: Git commit
git add -A
git commit -m "chore(ctb): consolidate duplicate tracking files to memory/active_work_tracking.md"
```

**예상 효과:** 단일 소스 원칙 확립 + MEMORY 라인 정리

---

### Issue 3: 실제 파일 자동 갱신 로직 없음
**문제:** Cron이 메시지만 발송, 파일 수정 로직 부재

**현재 상태:**
```
Cron payload = systemEvent(text: "진도 리포트 대기 중")
→ Telegram 메시지 발송만
→ 파일(CTB) 업데이트 안 함
```

**해결책 (3가지 옵션):**

#### Option 1: 수동 갱신 강화 (RECOMMENDED) ⭐
**방식:** 비서가 정해진 시간에 수동으로 CTB 신뢰도 검증 + 파일 업데이트

**장점:**
- 즉시 구현 가능
- 신뢰도 95% 달성 가능
- 플레너의 "자동화 스크립트" 조건 불필요

**단점:**
- 완전 자동화 아님
- 비서의 일일 책임 증가

**구현 단계:**
```
매일 08:00 KST: 비서의 자동 CTB 신뢰도 검증
  - active_work_tracking.md 읽음
  - 어제 블로킹 상황 확인
  - 오늘 진행 상황 예측
  - CTB 파일 수동 업데이트 (진행률, ETA, 블로킹)

매일 14:00 KST: 플레너 진도 리포트 대기
  - 플레너 메시지 수신 후 즉시 CTB 업데이트

매일 15:00 KST: 웹개발자 진도 리포트 대기
  - 웹개발자 메시지 수신 후 즉시 CTB 업데이트

매일 18:00 KST: 일일 CTB 최종 검증
  - 당일 업데이트 내용 확인
  - 기록 완성도 체크
```

**신뢰도 계산:**
```
신뢰도 = (일일 자동 갱신 3회 + 팀원 리포트 수신 갱신) / 4회
       = 완료한 갱신 / 예정된 갱신 × 100%
       → 목표 95%: 30일 중 27일 이상 완료
```

---

#### Option 2: RemoteTrigger 기반 마이그레이션
**방식:** OpenClaw RemoteTrigger API를 사용해 Cron에서 직접 파일 수정

**장점:**
- 완전 자동화
- 가장 안정적

**단점:**
- RemoteTrigger API 학습 필요
- 구현 복잡도 높음

**예상 구현 일정:** 2~3일

---

#### Option 3: Lambda/Python 자동화 스크립트
**방식:** Python + cron scheduler로 별도 스크립트 실행

**장점:**
- 완전 자동화
- 로직 명확

**단점:**
- 외부 스크립트 추가 (운영 복잡도)
- 디버깅 어려움

**예상 구현 일정:** 3~5일

---

## 최종 권고안 (Evaluator에게 검증 의뢰)

**조합: Option 1 (수동 강화) + Telegram 설정**

### 즉시 실행 (2026-05-16)

#### A. Telegram 채널 설정 (5분)
```
mcp__openclaw__cron action=update jobId=[각 Cron ID] patch={
  "delivery": {
    "mode": "announce",
    "channel": "telegram",
    "to": "default"
  }
}
```

**대상:**
1. 2d26b9ea (08:00 블로킹 추적)
2. 8469d770 (12:00 평가자 체크)
3. e41c61bd (14:00 플레너 체크)
4. dfec9588 (15:00 웹개발자 체크)

#### B. CTB 파일 정리 (10분)
```bash
# 1. 파일 삭제
rm CTB_RESTRUCTURE_PROPOSAL.md
rm active_work_tracking.md  # root
rm memory/CTB_프로젝트추적판.md

# 2. Git commit
git add -A
git commit -m "chore(ctb): consolidate to single memory/active_work_tracking.md"
```

#### C. MEMORY.md 정리 (5분)
```markdown
제거 항목:
- [Active Work Tracking](active_work_tracking.md) — 중복 포인터들

유지 항목:
- [Active Work Tracking](memory/active_work_tracking.md) — 실시간 팀 작업 추적
```

#### D. 비서 일일 CTB 갱신 규칙 추가 (SOUL.md 개정)
```markdown
## CTB 일일 갱신 (자동화 대체)

비서가 다음 시간에 memory/active_work_tracking.md를 수동으로 갱신:

**08:00 KST** — 어제 블로킹 + 오늘 예상 블로킹 확인
- active_work_tracking.md 읽음
- 각 팀원의 블로킹 상황 업데이트

**14:00 KST** — 플레너 리포트 수신 후 즉시 반영
- Asset Master Phase 2 진행률
- Audit System 회의 진도

**15:00 KST** — 웹개발자 리포트 수신 후 즉시 반영
- API 구현 진행률
- 예상 ETA 갱신

**18:00 KST** — 일일 최종 검증
- CTB 업데이트 완성도 확인
- 당일 기록 누락 항목 체크

신뢰도 목표: 95% (30일 중 27일 이상 완료)
```

---

## 예상 효과

| Issue | 현상 | 해결책 | 결과 |
|-------|------|--------|------|
| 1. Telegram 손실 | 메시지 50% 손실 | delivery 설정 추가 | ✅ 손실률 0% |
| 2. CTB 중복 | 11개 파일 → 신뢰도 ↓ | 단일화 (1개만 유지) | ✅ 소스 단일화 |
| 3. 파일 미갱신 | Cron 메시지만 | 비서 수동 갱신 (매일 4회) | ✅ 신뢰도 95% 달성 |

---

## 평가자 검증 체크리스트

**평가자가 확인할 사항:**

- [ ] Telegram 메시지 손실 해결 (설정 후 실제 메시지 수신 확인)
- [ ] CTB 파일 정리 완료 (단일 소스 원칙)
- [ ] 비서 일일 갱신 규칙이 신뢰도 95% 목표 달성 가능한가?
- [ ] 기타 Critical Issues 추가 발견 여부

**재검증 일정:** 2026-05-16 17:00 KST (실행 후 1시간)

---

## Next Steps (평가자 승인 후)

1. **즉시:** Telegram 설정 + 파일 정리 + SOUL.md 개정
2. **당일:** 비서 규칙 적용 시작 (첫 갱신: 2026-05-16 08:00)
3. **일주일:** 신뢰도 추적 (active_work_tracking.md에 daily 갱신 기록)
4. **2주 후:** 평가자 신뢰도 재평가 (95% 달성 여부 확인)

---

## 역사

- **2026-05-16 02:30:** 평가자 3가지 Critical Issues 지적
- **2026-05-16 02:45:** 이 대체방안 설계 완료 → 평가자 재검증 의뢰
