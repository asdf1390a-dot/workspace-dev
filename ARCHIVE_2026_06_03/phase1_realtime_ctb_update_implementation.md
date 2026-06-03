---
name: Phase 1 실시간 CTB 자동 갱신 구현 계획
description: Git commit 감지 → 자동 CTB 이벤트드리븐 로그 업데이트 (2026-05-25 완료 목표)
type: project
---

# Phase 1: 실시간 CTB 자동 갱신 구현 계획

**상태:** 구현 계획 수립 (2026-05-18)  
**목표 완료 일자:** 2026-05-25  
**담당:** Web-Builder AI Agent (비서 설계)

---

## 1. 아키텍처 설계

### 1.1 시스템 흐름

```
Git Commit (Stage marker) 
    ↓
Vercel Cron Job (매 10분)
    ↓
Git Log 파싱 (최근 50개 커밋)
    ↓
Stage 마크 추출 + 완료 시간 계산
    ↓
active_work_tracking.md 이벤트드리븐 로그 업데이트
    ↓
시간델타 계산 (실제 - 예정)
    ↓
다음 작업 ETA 조정 (시간델타 > 0이면)
    ↓
Telegram 알림 발송 (변경사항)
```

### 1.2 주요 컴포넌트

#### A. Vercel Cron Route
- 경로: `/app/api/cron/ctb/realtime-update/route.ts`
- 트리거: `0 * * * *` (매 시간) 또는 매 10분
- 입력: git log (최근 50개)
- 처리: Stage marker 파싱, 이벤트드리븐 로그 업데이트
- 출력: 변경사항 JSON + Telegram 알림

#### B. Git Commit 파싱 로직
- 패턴: `Stage: DESIGN|DB|API|UI|DEPLOY|VERIFY`
- 추출 정보:
  - 커밋 해시
  - 타이머스탬프 (완료 시간)
  - 작업명 (커밋 메시지에서)
  - Stage (완료 단계)

#### C. 시간델타 계산
- 예정 시간: CTB의 각 작업별 예정 소요 시간
- 실제 시간: 커밋 타이머스탬프 - 이전 Stage 커밋 타이머스탬프
- 델타: 실제 - 예정 (양수=단축, 음수=초과)

#### D. ETA 조정 로직
- 현재 작업 완료 감지 → 다음 작업 찾기
- 시간델타 > 0 → 다음 작업 ETA에서 델타만큼 뺄셈
- ETA 변경 기록 + Telegram 알림

---

## 2. 구현 체크리스트

### Phase 1-1: 기본 Cron Route (2026-05-18 완료✅)

- [x] `/app/api/cron/ctb/realtime-update/route.ts` 생성 ✅
  - [x] POST 메서드 + CRON_SECRET 검증
  - [x] git log --oneline -50 파싱
  - [x] Stage marker regex 매칭
  - [x] 새 커밋 감지 로직

- [x] Git 정보 추출 함수 (`lib/ctb/git-parser.ts`) ✅
  - [x] 커밋 해시, 메시지, 타임스탬프 추출
  - [x] Stage 필드 추출
  - [x] 작업명 추출 (Refs: 필드에서)

- [x] active_work_tracking.md 업데이트 함수
  - [x] 이벤트드리븐 로그 파싱
  - [x] 신규 커밋 행 추가
  - [x] 마크다운 형식 유지

**구현 완료 산출물:**
- `app/api/cron/ctb/realtime-update/route.ts` — Vercel Cron 엔드포인트
- `lib/ctb/git-parser.ts` — Stage marker/task name 추출
- `lib/ctb/telegram-notifier.ts` — Telegram 알림 발송
- `lib/ctb/__tests__/git-parser.test.ts` — 단위 테스트
- `vercel.json` — 새 cron job 등록 (schedule: "0 * * * *")

**빌드 상태:** ✅ 컴파일 성공 (Next.js build 통과)

### Phase 1-2: 시간델타 계산 (2026-05-18 완료 ✅)

**완료 상태:** 3일 조기 완료 (예정 2026-05-21 → 완료 2026-05-18)

- [x] CTB 작업별 예정 시간 매핑 함수
  - [x] 작업명 → 예정 시간 (분) 룩업 ✅
  - [x] 기본값 설정 (60분) ✅
  - [x] `lib/ctb/task-estimates.ts` (88줄) 완성

- [x] 시간델타 계산 로직
  - [x] 현재 커밋의 완료 시간 ✅
  - [x] 이전 작업의 완료 시간 ✅
  - [x] 예정 시간과 비교 ✅
  - [x] 델타 계산 및 저장 ✅

**구현 세부사항:**

- `lib/ctb/task-estimates.ts` (88줄)
  - TaskEstimateMap interface + TASK_ESTIMATE_MAP 상수 (30+ 작업별 예정시간)
  - getTaskEstimate(taskName) — exact/partial match + default fallback
  - updateTaskEstimate(taskName, minutes) — 동적 업데이트
  - learnFromActualTime(taskName, actual) — 자동 학습 함수 (average: (old + actual)/2)

- `app/api/cron/ctb/realtime-update/route.ts` (수정)
  - getTaskEstimate() import 추가
  - calculateTimeDelta() 호출 (estim vs actual 비교)
  - formatTimeDelta() 적용 ("+15분" 포맷)
  - CTB entry에 estimated/actual/delta 값 저장

- `lib/ctb/telegram-notifier.ts` (수정)
  - NotificationPayload에 estimatedMinutes, actualMinutes, isAccelerated 필드 추가
  - Phase 1-2 메시지: 시간델타 정보 포함 (예: "⏱️ 예정: 60분 | 실제: 45분 | ⚡ 단축: +15분")

- **테스트 (새로 작성)**
  - `lib/ctb/__tests__/task-estimates.test.ts` (210줄, 5 describe, 17 test cases)
  - `lib/ctb/__tests__/time-delta.test.ts` (185줄, 6 describe, 15 test cases)
  - 빌드 상태: ✅ TypeScript 컴파일 성공

**Phase 1-2 출시 계획:**
- vercel.json의 cron schedule 이미 등록됨 (0 * * * *)
- 환경변수 설정만 완료되면 즉시 작동

### Phase 1-3: ETA 조정 & 알림 (완료 2026-05-18 ✅ - 4일 조기)

**완료 상태:** 3단계 구현 완료 (예정 2026-05-22 → 실제 2026-05-18)

- [x] 다음 작업 검색 함수 ✅
  - [x] CTB의 다음 미완료 작업 찾기 (findNextTask 구현) ✅
  - [x] 현재 ETA 추출 (extractScheduledETA 구현) ✅
  - [x] 담당자 정보 추출 (기본 구현, 향후 확장 가능) ✅

- [x] ETA 조정 로직 ✅
  - [x] 시간델타 > 0 시에만 조정 (isAccelerated && timeDelta > 0 검사) ✅
  - [x] 새로운 ETA = 기존 ETA - 델타 (newETADate 계산) ✅
  - [x] calcETAChange() 함수로 변화량 계산 ✅
  - [x] CTB entry 업데이트 (updateTaskETA로 다음작업 행 수정) ✅
  - [x] 마크다운 형식 유지 (테이블 정렬성 검증됨) ✅

- [x] Telegram 알림 개선 ✅
  - [x] 알림 형식: "【일정 앞당김】✅ 현재작업(완료시간) ⚡ 단축분 | 📋 다음작업 🔄 새ETA" ✅
  - [x] 에러 처리 (전송 실패 시 로그 기록) ✅
  - [x] Telegram 메시지: Phase 1-2의 기본 메시지 + next task + ETA change 정보 통합 ✅

**Phase 1-3 구현 파일:**

- `lib/ctb/eta-calculator.ts` (180줄, 완성)✅
  - findNextTask(ctbContent, currentTaskName) → {taskName, eta} ✅
  - extractScheduledETA(ctbEntry) → Date | null ✅
  - updateTaskETA(ctbContent, taskName, newETA) → updatedContent ✅
  - calcETAChange(oldETA, newETA) → {minutesPulled, changed} ✅
  - parseCTBEntry(line) → CTBEntry | null ✅
  - isTaskComplete(ctbEntry) → boolean ✅
  - getIncompleteTasks(ctbContent) → CTBEntry[] ✅

- `app/api/cron/ctb/realtime-update/route.ts` (수정, 완성)✅
  - Phase 1-3: ETA 조정 로직 추가 (lines 101-133) ✅
  - findNextTask() 호출로 다음 작업 검색 ✅
  - newETADate 계산으로 새 ETA 결정 ✅
  - updateTaskETA()로 CTB 업데이트 ✅
  - scheduleAccelerationInfo로 Telegram 메시지 강화 ✅

- `lib/ctb/telegram-notifier.ts` (완성, 수정 불필요)✅
  - NotificationPayload에 nextTaskName, originalETA, newETA, minutesPulled 필드 존재 ✅
  - isAccelerated && nextTaskName 조건으로 "【일정 앞당김】" 메시지 자동 활성화 ✅

- **테스트 (새로 작성, 225줄)** ✅
  - `lib/ctb/__tests__/eta-calculator.test.ts` (225줄)
    - findNextTask() 테스트 (다음 미완료 작업 검색) ✅
    - extractScheduledETA() 테스트 (ETA 파싱) ✅
    - updateTaskETA() 테스트 (CTB 엔트리 업데이트) ✅
    - calcETAChange() 테스트 (시간 변화 계산) ✅
    - parseCTBEntry() 테스트 ✅
    - isTaskComplete() 테스트 ✅
    - getIncompleteTasks() 테스트 ✅

**Phase 1-3 구현 요약:**
- 시간델타 > 0일 때 자동으로 다음 작업의 ETA를 앞당김 ✅
- CTB 테이블 실시간 업데이트 (다음작업의 "새로운ETA" 컬럼 수정) ✅
- Telegram 알림에 "【일정 앞당김】" + 다음작업명 + ETA 변화 (기존→신규) 포함 ✅
- NPM build 성공 (TypeScript 컴파일 0 에러) ✅

### Phase 1-4: 테스트 & 검증 (2026-05-19~20)

- [x] 단위 테스트 ✅
  - [x] Git 파싱 로직 (`git-parser.test.ts` 완료) ✅
  - [x] 시간델타 계산 (`time-delta.test.ts` 완료) ✅
  - [x] ETA 조정 로직 (`eta-calculator.test.ts` 완료) ✅

- [ ] 통합 테스트 (대기중)
  - [ ] 실제 git commit으로 cron job 실행 (수동 테스트 필요)
  - [ ] active_work_tracking.md 업데이트 확인
  - [ ] Telegram 알림 확인

- [ ] 일관성 검증 (대기중)
  - [ ] 중복 기록 방지 (커밋 해시 검사로 구현됨)
  - [ ] 이전 로그와 새 로그 동기화 (확인 필요)
  - [ ] 타임존 일관성 (KST 명시, toLocaleString 사용)

---

## 3. 기술 사양

### 3.1 Vercel Cron 설정

**추가할 cron job (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/ctb/realtime-update",
      "schedule": "0 * * * *"  // 매 시간 0분
    }
  ]
}
```

또는 더 자주 실행:
```json
"schedule": "*/10 * * * *"  // 매 10분 (Vercel Free Plan 제한 확인 필수)
```

### 3.2 환경 변수

```
CRON_SECRET=<secure_token>
TELEGRAM_BOT_TOKEN=<token>
TELEGRAM_SECRETARY_CHAT_ID=<id>
GITHUB_TOKEN=<optional_for_higher_rate_limits>
```

### 3.3 Git 정보 추출 명령

```bash
# 최근 50개 커밋 정보
git log --oneline -50 --format="%H %ai %s" origin/master

# 특정 커밋의 타임스탬프
git show -s --format=%ai <commit_hash>

# Stage marker 검색
git log --oneline -50 | grep "Stage:"
```

---

## 4. 파일 구조

```
dsc-fms-portal/
├── app/api/cron/
│   └── ctb/
│       └── realtime-update/
│           └── route.ts (신규)
│
├── lib/
│   └── ctb/
│       ├── git-parser.ts (신규)
│       ├── time-delta.ts (신규)
│       ├── eta-calculator.ts (신규)
│       └── telegram-notifier.ts (기존 확장)
│
└── vercel.json (수정: cron job 추가)

memory/
└── active_work_tracking.md (자동 갱신)
```

---

## 5. 의존성

- **git**: Node.js 환경에서 child_process로 git 명령 실행
- **fs**: 마크다운 파일 읽기/쓰기
- **telegram-bot-api**: Telegram 알림 발송

---

## 6. 위험 요소 & 완화 방안

| 위험 | 영향 | 완화 방안 |
|------|------|---------|
| Git rate limit | 자주 실행 시 느린 응답 | --max-count=50 + caching |
| 중복 기록 | 같은 커밋 여러 번 기록 | 커밋 해시 기반 중복 검사 |
| 타임존 불일치 | 시간 계산 오류 | KST 명시 + UTC 변환 함수 |
| Telegram 실패 | 알림 미발송 | 에러 로깅 + retry 로직 |
| 마크다운 형식 깨짐 | CTB 파일 손상 | 백업 + 형식 검증 |

---

## 7. 실제 사용 예시

### Scenario: Asset API 개발 완료

**1단계: 개발자가 커밋**
```
git commit -m "feat(asset): API GET /assets 구현 완료

Stage: API
Refs: asset-master-p2"
```

**2단계: Cron Job 실행 (10분 후)**
- Git log에서 이 커밋 감지
- 시간: 14:45 (commit timestamp)
- 작업명: "Asset API"
- 예정 시간: 60분
- 실제 시간: 45분 (이전 완료 시간과 비교)
- 델타: +15분

**3단계: CTB 자동 업데이트**
```
| 2026-05-18 | Asset API | 60 | 45 | +15 | 15:00 | 14:45 | ✅ |
```

**4단계: Telegram 알림**
```
【일정 앞당김】
- 작업: Asset API (14:45 완료)
- 단축: 15분
- 다음작업 새 ETA: 14:45 (기존 15:00)
- 담당자: @Web-Builder AI Agent
```

---

## 8. 릴리스 계획 (실제 진행)

**2026-05-18:** 구현 계획 수립 ✓  
**2026-05-18:** Phase 1-1 완료 (기본 Cron Route) ✅ (예정: 2026-05-20)
**2026-05-18:** Phase 1-2 완료 (시간델타 계산) ✅ (예정: 2026-05-21)  
**2026-05-18:** Phase 1-3 완료 (ETA 조정) ✅ (예정: 2026-05-22) — **3일 조기 완료**
**2026-05-19~20:** Phase 1-4 진행 중 (테스트 & 검증)  
**2026-05-21:** 🚀 **Phase 1 배포 예상** (기존 예정 2026-05-25보다 4일 빠름)

---

## 9. 향후 Phase

**Phase 2 (2026-06-01):** Telegram 메시지 파싱 → 자동 일정 재계산  
**Phase 3 (2026-06-15):** AI 예측 기반 당겨오기 (3일 전부터)

