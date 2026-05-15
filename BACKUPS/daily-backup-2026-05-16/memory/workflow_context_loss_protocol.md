---
name: Context Loss Prevention Protocol v2
description: TCB(호출구조화) + CTB(중앙추적판) + HP(보고형식) + LCS(라이프사이클) + UAS(액션형식) — 설계/구현/배포 단계 분리, git commit 동기화, 사용자 액션 1회 강제
type: feedback
originSessionId: 66795086-9828-4a52-9378-355460d1c886
version: 2
revisedAt: 2026-05-15
---

## v2 변경 이유 (2026-05-15)

**v1 한계:**
1. "설계 완료"만 기록 → 실제 구현 진행이 invisible (Backup Phase 2 사례)
2. CTB에 git commit 해시 누락 → 실제 진행 상태 파악 불가
3. 사용자 액션 형식이 강제되지 않아 3회 위반 (1회 약속 → 3회 메시지)
4. 메모리와 코드 현실 괴리 ("저장만 하고 실행 안 함")

**v2 추가 컴포넌트:**
- **LCS (Lifecycle Stages):** 설계 → DB → API → UI → 배포 → 검증 5단계 분리 추적
- **UAS (User Action Standard):** 1회 강제, 체크리스트 형식, 완료 시 체크마크 업데이트
- **GCS (Git Commit Sync):** 매 commit 후 CTB 즉시 갱신, 표준 메시지 포맷

---

## 1️⃣ Task Context Bundle (TCB) — Subagent 호출 구조화

**호출 시 필수 항목:**
```yaml
task_id: "backup-api-schedule-impl-20260515"  # 단계별 ID
stage: "API_IMPL"  # 5단계 중 어디 (DESIGN/DB/API/UI/DEPLOY/VERIFY)
intent: "Implement backup schedule API endpoints (3 routes)"
scope: "POST /configure, POST /trigger, daily cron"
previous_context:
  completed_deps:
    - "DB migration 22_backup_module.sql ✅ (commit a1b2c3d)"
    - "API spec PHASE2_API_GUIDE.md ✅"
  known_blockers: []
  related_tasks:
    - "backup-api-quota-impl (parallel OK)"
    - "backup-ui-impl (depends on this)"
deadline: "2026-05-15 18:00 KST"
owner: "web-builder"
expected_commits:
  - "feat(backup): schedule configure endpoint"
  - "feat(backup): schedule trigger endpoint"
  - "feat(backup): daily backup cron"
report_format: "HP v2 (필수 git_commits 필드)"
```

---

## 2️⃣ Lifecycle Stages (LCS) — 설계 vs 구현 명확 구분 ⭐ NEW

**모든 기능은 5단계로 추적:**

| 단계 | 마커 | 완료 기준 | 산출물 |
|------|------|----------|--------|
| 1. DESIGN | 📐 | 설계 문서 작성 | `*_DESIGN.md` 파일 |
| 2. DB | 🗄️ | 마이그레이션 SQL 작성 + Supabase 적용 | `db/*.sql` + 적용 확인 |
| 3. API | 🔌 | 엔드포인트 구현 + TypeScript 컴파일 | `pages/api/*.ts` + commit |
| 4. UI | 🎨 | 컴포넌트 구현 + Next.js 빌드 | `components/*.tsx` + commit |
| 5. DEPLOY | 🚀 | Vercel 배포 + 환경변수 | Vercel READY 상태 |
| 6. VERIFY | ✅ | evaluator 3회 반복 검증 | 평가 보고서 |

**메모리 기록 기준:**
- 각 단계 완료 시 `active_work_tracking.md`에 즉시 추가
- 단계마다 git commit 해시 필수 (DESIGN 제외)
- 단계 건너뛰기 금지 (DB 없이 API 작업 X)

**예시 (Backup Phase 2):**
```markdown
## Backup Phase 2

| 단계 | 상태 | 커밋 | 완료시각 |
|------|------|------|---------|
| 📐 DESIGN | ✅ | - | 2026-05-13 |
| 🗄️ DB | ✅ | a1b2c3d | 2026-05-14 16:25 |
| 🔌 API (11/16) | 🟡 | 419ae6d, d0ab732 | 2026-05-15 진행중 |
| 🎨 UI (4 화면) | 🔴 | - | 대기 (API 완료 후) |
| 🚀 DEPLOY | 🔴 | - | 대기 |
| ✅ VERIFY | 🔴 | - | 대기 |
```

**규칙:** "Backup Phase 2 완료"라는 표현 금지. 반드시 단계 명시. ("API 단계 완료, UI 대기")

---

## 3️⃣ Central Task Board (CTB) — 중앙 추적판 v2

**파일:** `memory/active_work_tracking.md`

**v2 표준 표 형식:**
```markdown
| 항목 | 단계 | 상태 | 담당 | 최근 커밋 | ETA |
|------|------|------|------|----------|-----|
| Backup Phase 2 | 🔌 API | 🟡 11/16 | web-builder | d0ab732 | 2026-05-15 18:00 |
```

**필수 컬럼:**
- **단계 (Stage):** 📐/🗄️/🔌/🎨/🚀/✅ 중 하나
- **상태 (Status):** 🟢완료 / 🟡진행중 / 🔴대기 / 🚨차단
- **최근 커밋 (Latest Commit):** 단계 마커가 있다면 git short hash 필수
- **ETA:** 절대 날짜·시간

**갱신 시점 (모두 필수):**
1. ✅ Subagent 호출 직후 → 🟡 진행중으로 변경
2. ✅ 각 git commit 후 → 커밋 해시 추가
3. ✅ 단계 완료 시 → 다음 단계 추가
4. ✅ 차단 발생 시 → 🚨 + 차단 이유

---

## 4️⃣ Git Commit Sync (GCS) — 메모리↔코드 동기화 ⭐ NEW

**표준 커밋 메시지 포맷:**
```
<type>(<scope>): <subject>

<body — task_id 포함>

Refs: <task_id>
Stage: <DESIGN|DB|API|UI|DEPLOY|VERIFY>
```

**type:** feat / fix / refactor / docs / chore / test
**scope:** 모듈명 (backup, asset, travel, weekly, quality, etc.)

**예시:**
```
feat(backup): schedule configure endpoint

POST /api/backup/schedule/configure 구현. 사용자별 백업 정책 (frequency, retention, time)
저장 및 갱신. backup_policies 테이블 사용.

Refs: backup-api-schedule-impl-20260515
Stage: API
```

**자동 동기화 워크플로우:**
1. Subagent가 코드 작성 → commit
2. **즉시** `active_work_tracking.md` 업데이트 (커밋 해시 + 진행률)
3. 단계 마지막 commit 후 → 다음 단계로 전환 표시
4. 비서가 신규 지시 받기 전 → 항상 CTB 먼저 읽기

**위반 시 패널티:** Subagent가 commit 후 CTB 미업데이트 → 결과 보고 시 "GCS 위반" 명시 → 비서가 즉시 수동 갱신

---

## 5️⃣ Handoff Protocol (HP) v2 — 표준 보고 형식

**Subagent 보고 템플릿:**
```markdown
## [task_id] 보고

### Summary (한 줄)
Backup schedule API 3개 엔드포인트 구현 완료, TypeScript 빌드 통과

### Stage
🔌 API (11/16 완료, 5개 남음)

### Git Commits ⭐ 필수
- `419ae6d` feat(backup): schedule configure endpoint
- `d0ab732` feat(backup): schedule trigger + daily cron

### Deliverables
- `pages/api/backup/schedule/configure.ts` (신규)
- `pages/api/backup/schedule/trigger.ts` (신규)
- `pages/api/cron/backup-daily.ts` (신규)
- `vercel.json` (cron 등록)

### Validation
- ✅ TypeScript 컴파일
- ✅ Next.js 빌드
- ⚠️ 로컬 테스트만 (Vercel 미배포)

### Blockers
1. **CRON_SECRET 환경변수 미설정** — Vercel 배포 차단
   - 우선순위: 🔴 즉시
   - 담당: 비서 (Vercel 대시보드에서 설정)
   - 예상 시간: 5분

### Next Owner
- **즉시:** 비서 (env var 설정)
- **다음:** web-builder (5개 API 추가 구현)
- **그 후:** evaluator (UI 검증)

### CTB 업데이트 완료 ✅
`active_work_tracking.md` 갱신 (Backup Phase 2 행: 🔌 API → 11/16)
```

---

## 6️⃣ User Action Standard (UAS) — 사용자 액션 형식 강제 ⭐ NEW

**문제:** 규칙(`feedback_user_action_format.md`)이 있어도 3회 위반 발생.

**v2 강제 메커니즘:**

### A. 단일 메시지 체크리스트 형식 (필수)
```markdown
## 🔴 사용자 액션 필요 (총 N건)

- [ ] **액션 1:** [한 줄 설명]
  - 📍 링크: [클릭 URL]
  - ⚙️ 방법: [3단계 이내]
  - ⏱ 예상시간: N분

- [ ] **액션 2:** [한 줄 설명]
  - 📍 링크: ...
  - ⚙️ 방법: ...
  - ⏱ 예상시간: ...

---
완료 즉시 알려주세요. 체크박스 갱신해드립니다.
```

### B. 체크마크 갱신 (자동)
사용자가 "1번 완료" / "✅" / "끝" 신호 → 비서가 동일 메시지를 **편집** (Telegram edit) 또는 **신규 메시지로 갱신본 발송**:

```markdown
## 🔴 사용자 액션 (1/2 완료)

- [x] ~~액션 1~~ ✅ 완료 (2026-05-15 00:35)
- [ ] **액션 2:** ...
```

### C. 절대 금지
1. ❌ 같은 액션을 별도 메시지로 다시 안내
2. ❌ "방법 1, 방법 2" 식으로 옵션 분리 → 추천안 1개만
3. ❌ "완료되면 알려주세요" 메시지를 별도로 보내기 → 체크리스트 안에 포함
4. ❌ 3건 이상이면 우선순위 분류 (🔴즉시/🟡이번주/🔵다음주)

### D. 자기 검증 루틴
사용자 액션 메시지 보내기 직전:
- [ ] 한 메시지에 모두 들어갔는가?
- [ ] 각 항목에 링크 + 방법 + 시간 모두 있는가?
- [ ] 같은 내용을 직전 30분 내 보낸 적 없는가?

3개 중 하나라도 X → 발송 중단, 재구성

---

## 7️⃣ 적용 체크리스트 (v2)

### 매 subagent 호출 시
- [ ] TCB 형식 사용 (task_id, stage, expected_commits 포함)
- [ ] CTB에 🟡 진행중 + 담당자 등록
- [ ] LCS 단계 명시 (DESIGN/DB/API/UI/DEPLOY/VERIFY)

### 매 commit 후 (Subagent 책임)
- [ ] 표준 commit 메시지 포맷 (Refs + Stage)
- [ ] CTB 즉시 업데이트 (커밋 해시 + 진행률)
- [ ] 단계 전환 시 다음 단계 행 추가

### 매 보고 수신 시 (비서 책임)
- [ ] HP v2 형식 확인 (Git Commits 필드 필수)
- [ ] CTB 업데이트 확인 (안 되어 있으면 수동 갱신)
- [ ] Blockers 즉시 처리 또는 사용자 액션 변환

### 매 사용자 액션 발송 시
- [ ] UAS 체크리스트 형식
- [ ] 자기 검증 3항목 통과
- [ ] 30분 내 동일 내용 발송 이력 확인

### 매 신규 지시 수신 시
- [ ] CTB 먼저 읽기 (충돌/의존성 확인)
- [ ] 우선순위 자율 판단 후 실행

---

## 8️⃣ 책임 매트릭스 (RACI)

| 활동 | 비서 | Subagent | 사용자 |
|------|------|----------|--------|
| TCB 작성 | R | I | - |
| 코드 작성 + commit | - | R | - |
| CTB 갱신 (commit 후) | A | R | - |
| HP v2 보고 | A | R | - |
| 사용자 액션 정리 | R | I | - |
| 사용자 액션 실행 | I | - | R |
| 단계 전환 결정 | R | C | I |

R=Responsible, A=Accountable, C=Consulted, I=Informed

---

## 9️⃣ 예상 효과 (v2 추가)

| 메트릭 | v1 | v2 목표 | 개선 |
|--------|-----|--------|------|
| 설계/구현 혼동 | 주 1-2회 | 0회 | LCS로 명확화 |
| 메모리-코드 괴리 | 60% | <10% | GCS 자동 동기화 |
| 사용자 액션 반복 | 회당 2-3개 메시지 | 1개 메시지 | UAS 강제 |
| Subagent 오해 | 주 0-1회 (v1 수치) | 유지 | TCB 강화 |
| 진행률 가시성 | 단계 정보 없음 | 5단계 실시간 | LCS 추적 |

---

## 🔟 v2 적용 시작

**적용일:** 2026-05-15 즉시
**평가 시점:** 2026-05-29 (2주 후)
**평가 기준:**
1. CTB에 모든 git commit 해시 기록 여부
2. 사용자 액션 메시지 1회 미만 위반
3. "설계 완료"와 "구현 완료" 혼동 0회
4. 단계 전환 시 LCS 마커 정확 사용

**평가 미달 시:** v3 회의 즉시 소집 (담당: 비서 + 4팀원 + 평가자)
