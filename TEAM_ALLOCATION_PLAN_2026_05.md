# 팀원 할당 재계획 (2026년 5월)
**Date:** 2026-05-15 | **Status:** 제안 | **Task ID:** improve_tracking_process_v1

---

## 팀원 현황 요약

| 순번 | 담당자 | 전문 분야 | 현황 | 진행률 | 예상 완료 |
|------|--------|---------|------|--------|----------|
| 1 | **웹개발자** | Backend/Frontend | 🟡 진행중 | 10% | 2026-06-03 |
| 2 | **평가자** | QA/UX 검증 | 🟡 진행중 | 30% | 2026-05-20 |
| 3 | **데이터분석가** | 데이터 품질/분석 | 🟡 신규할당 | 0% | 2026-05-31 |
| 4 | **번역가** | KO↔EN/타밀어 | 🟢 유휴 | — | — |
| 5 | **플레너(본인)** | 설계/PM/시스템 | 🟡 진행중 | 50% | 2026-05-20 |

---

## 1. 웹개발자 (계속 진행)

### 현재 업무: Backup App Phase 2 API 개발
- **진행률:** 10% (설계 완료, 개발 시작)
- **단계:** 🔌 API (16개 구현)
- **예정 완료:** 2026-06-03
- **담당 코드:** `/dsc-fms-portal/app/api/backup/`

**주간 목표 (5/15~5/21)**
- [ ] 설계서 재검토 (BACKUP_APP_PHASE2_DESIGN.md + API_GUIDE.md)
- [ ] DB 마이그레이션 실행 (backup_* 4개 테이블)
- [ ] Schedule API 구현 (POST, PATCH, DELETE)
- [ ] API 테스트 (Jest)
- **예상 진행률:** 40%

**의존성 (차단 요소 없음)**

**커밋 규칙**
```
feat(backup-api): implement schedule endpoints
Refs: improve_tracking_process_v1
Stage: API

- POST /api/backup/schedule (create)
- PATCH /api/backup/schedule/:id (update)
- DELETE /api/backup/schedule/:id (delete)
```

---

## 2. 평가자 (신규 할당 추가)

### 현재 업무 1: Travel Phase 2 UX 검증 (진행중)
- **진행률:** 30% (설계서 검토 중)
- **단계:** 🎨 UI (UX 검증)
- **예정 완료:** 2026-05-18
- **담당 파일:** `/home/jeepney/.openclaw/workspace-dev/TRAVEL_PHASE2_DESIGN.md`

**주간 목표 (5/15~5/18)**
- [ ] 플레너 설계서 상세 검토 (사용성, 일관성, 오류)
- [ ] UX 피드백 문서 작성 (3~5개 항목)
- [ ] 플레너와 피드백 리뷰 미팅 (5/18)
- **예상 완료:** 2026-05-18 18:00 KST

**산출물**
```
travel-evaluator-feedback.md
├─ UX Issues (우선순위별)
│  ├─ 🔴 Critical: 일정 입력 흐름 개선 필요
│  ├─ 🟡 High: 지도 API 통합 검증
│  └─ 🟢 Low: 색상 대비 개선 제안
├─ 코드 리뷰 항목 (추후 개발)
│  └─ API 설계 피드백
└─ 승인 판정: ✅ 준비됨 (개발 시작 가능)
```

---

### 현재 업무 2: 메모리 파일 통합 (신규)
- **진행률:** 0% (신규 할당)
- **단계:** 정리
- **예정 완료:** 2026-05-17
- **대상 파일:**
  - `feedback_status_reporting_format.md` (deprecated)
  - `feedback_auto_status.md` (deprecated)
  - `feedback_user_action_status_format.md` (deprecated)
  - `feedback_user_action_explicit_rules.md` (메인, 수정)
  - `workflow_context_loss_protocol.md` (메인, 추가)

**작업 내용**

1. **feedback_user_action_explicit_rules.md 강화**
   ```markdown
   [기존 내용 유지]
   
   ## 색상 규칙 추가
   - 🟢 완료
   - 🟡 진행중
   - 🔴 대기/블로킹
   ```

2. **workflow_context_loss_protocol.md 추가**
   ```markdown
   ## 현황판 자동 출력 규칙
   [기존 auto-status 내용 통합]
   ```

3. **deprecated 파일 제거**
   ```bash
   git rm memory/feedback_status_reporting_format.md
   git rm memory/feedback_auto_status.md
   git rm memory/feedback_user_action_status_format.md
   git commit -m "chore(memory): deprecate duplicate status files"
   ```

4. **MEMORY.md 색인 갱신**
   - 삭제된 3개 파일 제거
   - 새 구조 문서화

**예정 완료:** 2026-05-17 17:00 KST

**의존성**
- 플레너가 MEMORY.md 색인 갱신 후 확인 필요

---

### 현재 업무 3: 정기 팀 코드 리뷰 (유지)
- **주기:** 주 2회 (수요일, 금요일)
- **시간:** 30분
- **대상:** 웹개발자 PR

---

## 3. 데이터분석가 (신규 할당)

### 신규 업무 1: CTB 해시 검증 자동화
- **진행률:** 0% (신규)
- **단계:** 구현
- **예정 완료:** 2026-05-24
- **담당 파일:** `/home/jeepney/.openclaw/workspace-dev/scripts/validate-ctb-commits.sh`

**작업 내용**

1. **자동 검증 스크립트 작성**
   ```bash
   #!/bin/bash
   # validate-ctb-commits.sh
   
   # 1. workspace 커밋 유효성 검사
   #    - DESIGN, 설계 관련 커밋 존재 여부
   #    - 각 항목별 설계 commit 유효성
   
   # 2. dsc-fms-portal 커밋 유효성 검사
   #    - main branch에 해당 커밋 존재 여부
   #    - 커밋 메시지 포맷 확인
   
   # 3. CTB 필드 검증
   #    - [workspace] / [dsc-fms-portal] 표기 일관성
   #    - 해시 형식 (7자리)
   
   # 4. 리포트 생성
   #    - 오류 항목 목록
   #    - 수정 제안
   ```

2. **Cron 작업 설정**
   ```bash
   # 주 1회 (월요일 09:00 KST)
   0 9 * * 1 /home/jeepney/.openclaw/workspace-dev/scripts/validate-ctb-commits.sh
   ```

3. **산출물**
   ```
   CTB_VALIDATION_REPORT_2026_05_20.md
   ├─ Validation Summary
   │  ├─ Total Items: 5
   │  ├─ Valid: 4
   │  └─ Invalid: 1
   ├─ Issues Found
   │  └─ 여행앱 MVP: [코드 commit] 없음 (설계 단계)
   └─ Recommendations
      └─ 설계 단계 항목은 [코드 commit] 필드 삭제 또는 "N/A" 표기
   ```

---

### 신규 업무 2: 월간 시스템 로그 분석
- **진행률:** 0% (신규)
- **단계:** 수집 + 분석
- **주기:** 월 1회 (말일)
- **예정 첫 완료:** 2026-05-31
- **담당 파일:** `/home/jeepney/.openclaw/workspace-dev/LOGS/MONTHLY_SYSTEM_LOG_*.md`

**작업 내용**

1. **로그 수집**
   - Gateway 재시작 이력 (2026-05 전체)
   - API 응답시간 (Supabase 쿼리 로그)
   - 배포 히스토리 (Vercel)

2. **분석**
   - 재시작 원인 분류 (정기점검, 긴급, 오류)
   - 응답시간 추세 (P50, P95, P99)
   - 느린 엔드포인트 식별

3. **산출물 포맷**
   ```
   MONTHLY_SYSTEM_LOG_2026_05.md
   ├─ Executive Summary
   ├─ Gateway Events
   │  ├─ Total Restarts: N
   │  ├─ Avg Duration: Xms
   │  └─ Breakdown: [정기/긴급/오류]
   ├─ API Performance
   │  ├─ Slowest: [엔드포인트, Xms]
   │  ├─ Most Called: [엔드포인트, X calls]
   │  └─ Error Rate: X%
   ├─ Deployments
   │  ├─ Success: N
   │  ├─ Failed: N
   │  └─ Rollbacks: N
   └─ Recommendations
      ├─ 최적화 필요: [항목]
      └─ 모니터링 강화: [항목]
   ```

**의존성**
- Supabase 로그 접근 권한 필요
- Vercel API 토큰 필요

---

## 4. 번역가 (유휴 → 대기중)

### 현재 상태
- **진행률:** 0% (유휴)
- **다음 할당:** Travel Phase 2 설계서 번역 (대기)

### 예상 할당 (2026-05-20 이후)

**Travel Phase 2 설계서 KO → EN 번역**
- **시작:** 2026-05-20 (웹개발자 개발 착수 시)
- **대상:** TRAVEL_PHASE2_DESIGN.md, TRAVEL_PHASE2_API.md
- **산출물:** TRAVEL_PHASE2_DESIGN_EN.md
- **예정:** 2026-05-23 완료

**정기 업무**
- 주간 보고서 한영 번역 (매주 금요일)
- 사용자 지시 한영 번역 (필요 시)

---

## 5. 플레너 (계속 진행 + 신규 할당)

### 현재 업무 1: 추적 프로세스 개선 설계 (진행중)
- **진행률:** 50% (설계 완료)
- **단계:** 📐 DESIGN
- **예정 완료:** 2026-05-20
- **산출물:**
  - [x] TRACKING_PROCESS_IMPROVEMENT_DESIGN.md (완료)
  - [ ] CTB_RESTRUCTURE_PROPOSAL.md (예정)
  - [ ] team_task_tracking.md 템플릿 (예정)

**주간 목표 (5/15~5/20)**
- [x] 개선 설계서 작성
- [ ] CTB 재구성안 검토 + 최종화
- [ ] team_task_tracking.md 신규 생성
- [ ] 평가자에게 리뷰 요청 (5/17)
- [ ] 설계서 배포 (5/20)

---

### 신규 업무 1: Travel Phase 2 Scope 최종화
- **진행률:** 0% (신규)
- **단계:** 📐 DESIGN (재검토)
- **예정 완료:** 2026-05-19
- **담당 파일:** `TRAVEL_PHASE2_DESIGN.md` (재검토)

**작업 내용**

1. **현재 설계서 재검토**
   - 평가자 피드백 반영 준비
   - scope 범위 재확인

2. **평가자 피드백 수집 (5/18)**
   - 회의 예약
   - 피드백 정리

3. **최종 scope 문서 작성 (5/19)**
   ```
   TRAVEL_PHASE2_SCOPE_FINAL.md
   ├─ MVP Features (필수)
   │  ├─ 여행지 등록
   │  ├─ 일정 계획
   │  └─ 비용 추적
   ├─ Phase 2 Features (선택)
   │  ├─ 그룹 공유
   │  └─ 날씨 통합
   └─ Out of Scope
      ├─ AI 추천
      └─ 소셜 연동
   ```

4. **웹개발자 인수인계 (5/20)**
   - 최종 설계서 전달
   - 구현 시작 신호

**의존성**
- 평가자의 UX 검증 피드백 필요 (5/18 완료 예정)

---

### 신규 업무 2: Asset Master 설계 우선순위 확인
- **진행률:** 0% (신규)
- **단계:** 📋 스코핑
- **예정 완료:** 2026-05-16
- **담당 파일:** —

**작업 내용**

1. **사용자 액션 필요 (2026-05-16)**
   - Telegram 메시지 발송
   - 우선순위 확인: Asset Master vs Travel App vs Backup Phase 2

2. **응답 기한:** 2026-05-16 18:00 KST

3. **응답 시나리오별 다음 단계**
   ```
   Scenario A: Asset Master 우선 (확률 40%)
   → ASSET_MASTER_PHASE1_DESIGN.md 작성 시작 (2026-05-17)
   
   Scenario B: Travel App 우선 (확률 40%)
   → TRAVEL_PHASE2_DESIGN.md 최종화 (2026-05-19)
   → 웹개발자 개발 착수 (2026-05-20)
   
   Scenario C: Backup Phase 2 우선 (확률 20%)
   → 웹개발자 API 개발 가속 (이미 진행중)
   ```

**의존성**
- 사용자(Kyeongtae) 응답 필수

---

## 일정표 (2026년 5월)

| 날짜 | 담당자 | 업무 | 상태 | 산출물 |
|------|--------|------|------|--------|
| **5/15** | 플레너 | 개선 설계 수립 | ✅ 완료 | TRACKING_PROCESS_IMPROVEMENT_DESIGN.md |
| **5/15** | 플레너 | CTB 재구성안 작성 | 예정 | CTB_RESTRUCTURE_PROPOSAL.md |
| **5/16** | **사용자** | 우선순위 확정 | ⏳ 필요 | — |
| **5/16** | 플레너 | 팀원 할당 재계획 | 예정 | TEAM_ALLOCATION_PLAN_2026_05.md |
| **5/17** | 평가자 | 메모리 파일 통합 | 예정 | — |
| **5/17** | 플레너 | Travel scope 재검토 | 예정 | TRAVEL_SCOPE_DECISION.md |
| **5/18** | 평가자 | Travel Phase 2 UX 검증 | 예정 | travel-evaluator-feedback.md |
| **5/18** | 평가자 | 플레너 피드백 리뷰 미팅 | 예정 | — |
| **5/19** | 플레너 | Travel scope 최종 확정 | 예정 | TRAVEL_PHASE2_SCOPE_FINAL.md |
| **5/20** | 플레너 | CTB + team_task_tracking 최종화 | 예정 | — |
| **5/20** | 웹개발자 | Travel App 개발 착수 (if 우선) | 예정 | — |
| **5/24** | 데이터분석가 | CTB 해시 검증 자동화 | 예정 | validate-ctb-commits.sh |
| **5/31** | 데이터분석가 | 월간 시스템 로그 리포트 | 예정 | MONTHLY_SYSTEM_LOG_2026_05.md |

---

## 메모

### 팀 효율성 분석

**before (현재)**
- CTB만 존재 → 기능 단위 추적만 가능
- 팀원별 역할 분산 불명확
- 메모리 파일 중복 → 유지보수 어려움

**after (개선 후)**
- CTB + team_task_tracking.md 이원화
- 기능 단위 + 팀원 단위 추적 동시 가능
- 자동화 스크립트로 오류 감지
- 월간 분석 리포트로 패턴 파악

**예상 효과**
- CTB 갱신 오류 50% 감소
- 팀원 활용도 가시성 향상 → 우선순위 조정 용이
- 시스템 성능 병목 조기 발견

---

## 메타

**작성자:** 플레너  
**작성일:** 2026-05-15  
**상태:** 제안  
**다음 단계:** 평가자 review → 사용자 확인 → 실행  
