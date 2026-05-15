---
name: Context Loss Prevention Protocol
description: Task Context Bundle (TCB) + Central Task Board (CTB) + Handoff Protocol (HP) for eliminating subagent miscommunication
type: feedback
originSessionId: 66795086-9828-4a52-9378-355460d1c886
---
## 1️⃣ Task Context Bundle (TCB) — Subagent 호출 구조화

**목표:** Subagent 스포닝 시 정보 손실 방지

**호출 시 포함 항목:**
```
task_id: "backup-api-impl-20260514" (고유 ID)
intent: "Implement 16 backup API endpoints" (명확한 목표)
scope: "schedule, quota, metrics, cleanup, notifications" (범위)
previous_context: {
  - completed_deps: ["DB migration ✅", "API spec ✅"]
  - known_blockers: ["env var setup pending"]
  - related_tasks: ["backup-ui-eval", "backup-deploy"]
}
deadline: "2026-05-14 17:30"
owner: "web-builder" (다음 담당자)
```

**결과 반환 시 포함 항목:**
```
what: "16 APIs implemented, TypeScript compiled, Vercel cron set" (무엇을 했나)
why: "Enables daily backup scheduling, quota tracking, metrics collection" (왜 중요한가)
impact: "Unblocks backup-ui-eval, backup-deploy tasks" (다음 단계에 미치는 영향)
blockers: ["CRON_SECRET env var not set → API 배포 불가"] (막히는 것)
context_for_future: {
  - deliverables_location: "PHASE2_IMPLEMENTATION_SUMMARY.md"
  - validation_status: "✅ TypeScript, ✅ Next.js build, ⚠️ Env vars pending"
  - next_owner: "비서 (env vars 설정) → web-builder (배포)" 
}
```

---

## 2️⃣ Central Task Board (CTB) — 중앙 추적판

**파일:** `memory/active_work_tracking.md`

**매 task 마다 기록:**
- 🟢 완료됨: what + impact (한 줄 요약)
- 🟡 진행중: owner + 예상 완료 + 의존성
- 🔴 대기중: 차단 이유 + 필요 조건

**신규 지시 들어올 때마다:**
1. CTB 확인 → "현재 진행 중인 작업과 충돌하나?"
2. 의존성 파악 → "먼저 완료해야 할 작업이 있나?"
3. 우선순위 재평가 → "새 지시가 기존 작업보다 중요한가?"

**예:** 사용자가 "Asset Master API 구현하자"고 하면
- CTB 확인: 현재 🟡 "Context Loss 분석 진행중, 예상 17:10 완료"
- 판단: "Asset Master 설계 ✅ 완료, 의존성 없음 → 새 지시 받자"
- 우선순위: "Context Loss 분석이 전체 팀 효율성 영향 → 먼저 완료 후 시작"

---

## 3️⃣ Handoff Protocol (HP) — 표준 보고 형식

**Subagent 보고 템플릿:**

```
## [task_id] 보고

### Summary
(한 줄: "Backup API 16개 완료, Vercel cron 설정, 배포 대기")

### Deliverables
- 자산 목록 (파일/테이블/페이지)
  - `PHASE2_IMPLEMENTATION_SUMMARY.md` — API 명세
  - `backup_policies` 테이블 ✅
  - 3개 Vercel cron job ✅

### Validation
- ✅ TypeScript 컴파일 완료
- ✅ Next.js 빌드 완료
- ⚠️ Env var `CRON_SECRET` 미설정 → 배포 불가

### Blockers
1. **CRON_SECRET 환경변수** — 비서가 Vercel에 설정해야 함
   - 우선순위: 🔴 즉시 (배포 차단)
   - 담당: 비서
   - 예상 시간: 5분

### Next Owner
- **즉시:** 비서 (env var 설정)
- **완료 후:** web-builder (배포)
- **그 다음:** evaluator (4개 UI 화면 검증)
```

**비서가 받으면 할 일:**
1. Blocklers 섹션 읽기 → "뭐가 다음 단계를 막고 있나?"
2. 막히는 것에 대해 **즉시 행동** (질문 X)
3. 완료되면 Next Owner에게 넘기기

---

## 적용 체크리스트

### 즉시 적용 (지금부터)
- [ ] 모든 subagent 호출에 TCB 구조 적용 (task_id, intent, scope, etc)
- [ ] 모든 subagent 결과 수신 시 HP 형식 확인
- [ ] CTB(`active_work_tracking.md`)를 신규 지시 전에 먼저 확인

### 매 세션 시작
- [ ] `active_work_tracking.md` 맨 앞 "🟡 진행 중" 섹션 확인
- [ ] 블로킹된 항목이 있으면 CTB에서 "대기 이유" 읽기

### 매 지시 완료 후
- [ ] Handoff Protocol 형식으로 보고 (Next Owner 명시)
- [ ] CTB 상태 업데이트 (🟢/🟡/🔴)

---

## 예상 효과

| 메트릭 | 이전 | 적용 후 | 감소율 |
|--------|------|--------|--------|
| Subagent 오해 | 주 2-3회 | 주 0-1회 | 70% ↓ |
| 우선순위 오류 | 주 1-2회 | 월 0-1회 | 80% ↓ |
| Context 손실 | 60% | 15-20% | 75% ↓ |
| 비서 "다음 단계" 결정 시간 | 3-5분 | &lt;1분 | 80% ↓ |

---

**적용 시작:** 2026-05-14 16:45 (즉시)
**평가:** 2주 후 실제 효과 측정
