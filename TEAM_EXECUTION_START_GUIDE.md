# 휴가 기간 팀 실행 가이드 (2026-05-16 ~ 2026-05-24)

**비서로부터:** C-3PO  
**발행일:** 2026-05-15 23:00 KST  
**유효기간:** 2026-05-16 08:00 ~ 2026-05-24 23:59 KST

---

## 📌 상황 요약

사용자가 휴가 중(2026-05-15 ~ 2026-05-24)이므로, 팀이 완전 자율 운영으로 진행합니다.
- ✅ 확인 없이 즉시 진행
- ✅ 완료된 작업만 보고
- ✅ 블로킹 항목은 팀 논의 후 즉시 해결

---

## 🎯 각 팀원 역할

### web-builder: Asset Master Phase 1 + Team Dashboard 개발

**Priority:** 🔴 **CRITICAL** (Phase 1 DB)  
**Timeline:** 2026-05-16 ~ 2026-05-24

#### 1️⃣ Asset Master Phase 1 — DB 마이그레이션 (2026-05-16)
**완료 기준:** 10분 이내  
**가이드:** `ASSET_MASTER_PHASE1_EXECUTION_GUIDE.md`

```
단계:
1. 가이드 읽기 (3분)
2. Supabase SQL Editor 열기 (1분)
3. SQL 실행 (1분)
4. 검증 (5분)
5. Discord #일반채널에서 "DB 마이그레이션 완료" 보고
```

**다음:** DB 마이그레이션 완료 후 즉시 40+ API 구현 시작

---

#### 2️⃣ Asset Master Phase 1 — 40+ API 구현 (2026-05-16 ~ 2026-05-24)

**일정:** 매일 5개 API 구현 (05:00 ~ 완료)
- 2026-05-16: API 1~5 (get_asset, list_assets, search_assets, filter_by_class, filter_by_category)
- 2026-05-17: API 6~10
- 2026-05-18: API 11~15 + Team Dashboard 개발 시작 (병렬)
- ...
- 2026-05-24: API 36~40 (최종)

**참고:** `ASSET_MASTER_DESIGN.md`, `ASSET_MASTER_API_GUIDE.md`

**매일 15:00 진도 리포트** (자동):
```
예: "Asset Master API 5~10 구현 완료 (누적 10/40)"
```

---

#### 3️⃣ Team Dashboard 개발 (2026-05-18 ~ 2026-05-24)

**선행 조건:** planner 설계 완료 (2026-05-17)  
**가이드:** `TEAM_DASHBOARD_DESIGN_BRIEF.md`

```
순서:
1. 설계 리뷰 (1시간) — planner 산출물 확인
2. DB 마이그레이션 실행 (15분)
3. API 5개 구현 (2026-05-19 ~ 2026-05-20)
4. UI 컴포넌트 구현 (2026-05-21 ~ 2026-05-22)
5. 테스트 & 배포 (2026-05-23 ~ 2026-05-24)
```

---

### planner: Team Dashboard 설계 + Audit Framework 검토

**Priority:** 🟡 **HIGH**  
**Timeline:** 2026-05-16 ~ 2026-05-17

#### 1️⃣ Team Dashboard 설계 (2026-05-16 ~ 2026-05-17)

**완료 기한:** 2026-05-17 18:00 KST  
**가이드:** `TEAM_DASHBOARD_DESIGN_BRIEF.md`

```
산출물 (4가지 필수):
✅ TEAM_DASHBOARD_DESIGN.md (UI 스케치, 컴포넌트 구조)
✅ TEAM_DASHBOARD_API_GUIDE.md (API 명세)
✅ TEAM_DASHBOARD_DB_SCHEMA.sql (DB 마이그레이션)
✅ TEAM_DASHBOARD_CHECKLIST.md (개발 순서)
```

**기술 선택:**
- 차트 라이브러리: **Recharts** (권장)
- 상태 관리: **Context API** (간단함) 또는 **Zustanad**
- 실시간: **Supabase realtime subscription**

**완료 후:** Discord #일반채널에서 "Team Dashboard 설계 완료" 공지 + 산출물 경로 안내

---

#### 2️⃣ Audit System Framework 검토

**상태:** 설계 완료됨 (`audit_system_framework.md`)  
**작업:** 팀 피드백 기반 개선 사항 검토

```
체크리스트:
- [ ] 일일 신뢰도 평가 95% 목표 타당성 검토
- [ ] 팀 피드백 루프 프로세스 최종 확인
- [ ] 개선 액션 자동 생성 규칙 검토
- [ ] 팀 논의 일정 확인 (2026-05-22 예정)
```

---

### evaluator: Backup Phase 2 UI 검증

**Priority:** 🟠 **MEDIUM**  
**Timeline:** 2026-05-20 ~ 2026-05-21  
**상태:** 🔴 대기 (API 배포 후 시작)

#### 1️⃣ UI 검증 준비 (2026-05-18 ~ 2026-05-19)

**가이드:** `BACKUP_PHASE2_UI_EVALUATION_CHECKLIST.md`

```
준비 작업:
- [ ] 체크리스트 읽기
- [ ] 테스트 환경 준비 (테스트 계정, 브라우저)
- [ ] 검증 도구 준비 (Lighthouse, DevTools)
```

---

#### 2️⃣ 3회 반복 검증 (2026-05-20 ~ 2026-05-21)

**Round 1 (2026-05-20 14:00):** 기본 기능  
**Round 2 (2026-05-20 18:00):** 에러 케이스  
**Round 3 (2026-05-21 10:00):** 최종 UX  

각 라운드별 산출물:
```
BACKUP_PHASE2_UI_EVAL_ROUND1.md
BACKUP_PHASE2_UI_EVAL_ROUND2.md
BACKUP_PHASE2_UI_EVAL_FINAL.md
```

**완료 후:** Discord #일반채널에서 "Backup Phase 2 UI 검증 완료 ✅" + 승인 서명

---

## 🔔 자동화된 일일 체크-인

### 08:00 KST — 블로킹 추적
**담당:** 비서 (자동)
```
• web-builder의 DB 마이그레이션 상태 확인
• 어제 예상된 블로킹 확인
• 오늘 예상되는 블로킹 사전 확인
```

### 12:00 KST — 평가자 정기 체크
**담당:** 평가자
```
• Backup Phase 2 UI 검증 준비 상황 (2026-05-18 ~ 2026-05-19)
• API 배포 상태 확인
• 검증 스케줄 확정
```

### 14:00 KST — 플래너 정기 체크
**담당:** 플래너
```
• Team Dashboard 설계 진도 (2026-05-16)
• 설계 산출물 준비 상황 (2026-05-17)
• 기술 선택 이슈 해결
```

### 15:00 KST — 웹개발자 정기 체크
**담당:** 웹개발자
```
• Asset Master API 진도 (오늘 완료한 API 개수)
• Team Dashboard 개발 준비 상황 (2026-05-18 이후)
• 블로킹 항목 리포트
```

---

## 📋 우선순위 규칙

### 🔴 **CRITICAL (즉시 진행)**
1. Asset Master Phase 1 DB 마이그레이션 (web-builder, 2026-05-16)
2. Team Dashboard 설계 (planner, 2026-05-16 ~ 2026-05-17)

### 🟡 **HIGH (당일 진행)**
3. Asset Master Phase 1 API 매일 5개 (web-builder, 매일)
4. Team Dashboard 개발 (web-builder, 2026-05-18부터)

### 🟠 **MEDIUM (대기 후 진행)**
5. Backup Phase 2 UI 검증 (evaluator, 2026-05-20부터)

### 🟢 **NORMAL (정기 진행)**
6. 일일 진도 리포트 (모두, 매일 자동)
7. Audit Framework 팀 논의 (팀원, 2026-05-22)

---

## 📁 준비 문서 위치

모든 문서는 `/home/jeepney/.openclaw/workspace-dev/` 디렉토리에 저장됨:

### Asset Master 관련
- `ASSET_MASTER_PHASE1_EXECUTION_GUIDE.md` ← **web-builder 즉시 읽기**
- `ASSET_MASTER_DESIGN.md` (기존)
- `ASSET_MASTER_API_GUIDE.md` (기존)
- `ASSET_MASTER_IMPORT_GUIDE.md` (기존)

### Team Dashboard 관련
- `TEAM_DASHBOARD_DESIGN_BRIEF.md` ← **planner 즉시 읽기**

### Backup Phase 2 관련
- `BACKUP_PHASE2_UI_EVALUATION_CHECKLIST.md` ← **evaluator 2026-05-18 읽기**

### 현황 추적
- `active_work_tracking.md` (실시간 업데이트)
- `vacation_task_handoff.md` (초기 계획)

---

## 🎯 성공 기준

### web-builder
✅ Asset Master Phase 1 DB 마이그레이션: 2026-05-16 12:00까지  
✅ Asset Master API 40개: 2026-05-24 18:00까지  
✅ Team Dashboard UI: 2026-05-24 18:00까지

### planner
✅ Team Dashboard 설계 4가지 산출물: 2026-05-17 18:00까지  
✅ Audit Framework 팀 피드백 반영: 2026-05-22까지

### evaluator
✅ Backup Phase 2 UI 3회 검증 완료: 2026-05-21 18:00까지  
✅ 최종 승인 리포트: 2026-05-21 18:00까지

---

## 💬 커뮤니케이션 채널

**매일 진행 상황 공유:**
- **Discord #일반채널:** 기술 세부사항, 완료 보고, 블로킹 항목
- **Telegram:** 긴급 연락, 결과 요약

**팀 논의:**
- Discord 스레드에서 진행
- 합의된 결정은 위키/메모리에 기록

---

## ⚠️ 블로킹 항목 해결 프로세스

**발견 시:**
1. Discord #일반채널에서 "🔴 BLOCKING: [항목명]" 공지
2. 관련 팀원들 태그
3. 30분 내 팀 논의 시작
4. 결정 사항 기록 (결정일, 이유, 담당자)
5. 즉시 해결 또는 우회 방안 실행

**예시:**
```
🔴 BLOCKING: Asset Master API 응답 시간 초과 (>3초)
담당: web-builder
논의: planner, evaluator
결정: Caching 적용 (2026-05-17)
담당자: web-builder
```

---

## 📞 긴급 상황

**사용자 복귀 필요한 경우:**
1. 비서가 사용자 Telegram에 "🔴 긴급 결정 필요" 메시지
2. 문제 설명 + 제안된 해결책 전달
3. 사용자 지시 대기

**예상 긴급 상황:**
- 아키텍처 변경 필요
- 일정 재계획 필요
- 리소스 추가 필요

---

## ✅ 체크리스트 (팀 리더용)

**2026-05-16 09:00 전:**
- [ ] 모든 팀원이 본 가이드 읽음
- [ ] web-builder가 EXECUTION_GUIDE 읽음
- [ ] planner가 DESIGN_BRIEF 읽음

**2026-05-16 08:00:**
- [ ] 비서의 첫 번째 블로킹 추적 확인
- [ ] 모든 팀원 준비 완료

**2026-05-17 18:00:**
- [ ] Team Dashboard 설계 4가지 산출물 완료
- [ ] web-builder가 API 10개 이상 구현

**2026-05-20 14:00:**
- [ ] evaluator의 Round 1 검증 시작

**2026-05-24 18:00:**
- [ ] Asset Master Phase 1 완료 (API 40개 + UI)
- [ ] Team Dashboard 개발 완료
- [ ] Backup Phase 2 UI 검증 완료

---

**생성:** 2026-05-15 23:00 KST  
**발행자:** 비서 (C-3PO)  
**다음 업데이트:** 2026-05-16 08:00 KST

