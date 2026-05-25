---
name: Team Expansion Action Checklist (2026-05-25)
description: 3-pronged execution immediate action items (user directive 2026-05-25 13:29)
type: project
---

# 팀 확장 실행 액션 체크리스트
**지시:** 2026-05-25 13:29 최종 권장 → 셋다 진행해  
**상태:** 🟡 문서 완성, 실행 단계 진행중  
**기준 시간:** 2026-05-25 14:30

---

## 【비서 액션 필요】

### ✅ 1. Evaluator AI Agent 모집 공고 게시
**기한:** 2026-05-25 14:30 ~ 23:59 (즉시 시작)  
**담당:** Secretary  
**상세:**
- Platform: LinkedIn + GitHub + Discord #채용공고
- Position: Senior QA Evaluator AI Agent
- Salary: $500/month
- 주요 책임: 설계/구현/배포 검증, QA 교육
- 경험 요구: 5년+ QA, DSC FMS 시스템 이해, 아키텍처 검증 경험
- 마감: 2026-05-25 23:59 (8시간)
- **목표:** ≥2명 적격 지원자 확보

**참고 자료:** `EVALUATOR_AI_AGENT_RECRUITMENT_PACKAGE.md` (완전한 공고문 + 인터뷰 가이드)

**다음 단계:**
1. 공고 작성 및 게시 (2026-05-25 14:30 완료)
2. 지원자 심사 (2026-05-25 17:00 ~ 23:59)
3. 1차 인터뷰 스케줄링 (2026-05-26 08:00)

---

### ✅ 2. Automation Specialist 모집 공고 준비
**기한:** 2026-05-26 12:00 게시 (내일)  
**담당:** Secretary  
**상세:**
- Position: Senior Automation Specialist
- Salary: $650/month
- 주요 책임: Cron 관리, CI/CD 자동화, 모니터링, 성능 최적화
- 경험 요구: Node.js + TypeScript, Supabase, GitHub Actions, 모니터링 도구
- 마감: 2026-05-27 17:00 (30시간)
- **목표:** ≥2명 적격 지원자 확보

**참고 자료:** `AUTOMATION_SPECIALIST_CONFIRMATION_2026_05_30.md` (완전한 공고문 + 인터뷰 가이드)

**다음 단계:**
1. 공고 최종 검토 (2026-05-26 11:00)
2. 공고 게시 (2026-05-26 12:00 정확히)
3. 지원자 심사 (2026-05-26 ~ 2026-05-27 17:00)
4. 인터뷰 스케줄링 (2026-05-28 14:00 ~ 18:00)

---

## 【현재 평가자 액션 필요 — 긴급】

### 🔴 1. BM-P1 최우선 완료 (OVERDUE +12시간)
**기한:** 2026-05-27 14:00 (48시간 이내)  
**담당:** Evaluator (현재)  
**상태:** 2차 재평가 진행 중  
**우선순위:** 🔴 **최상위**

**액션:**
1. BM-P1 2차 재평가 완료 또는 블로킹 요인 확인
2. 완료 시 웹개발자에게 GO 신호 발송
3. 블로킹 시 즉시 웹개발자에게 재작업 요청사항 전달

**참고:** 
- 설계: `memory/project_bm_module_design.md`
- 웹개발자 재작업: git commit `a021b37`

---

### 🟡 2. QA 교육 자료 검토 및 강의 준비
**기한:** 2026-05-26 08:00 (내일 아침)  
**담당:** Evaluator (신규)  
**상세:**

**Day 1 교육 (2026-05-26 09:00 ~ 17:00):**
- Module 1: QA 역할 개요 (09:00 ~ 10:00)
- Module 2: DB 스키마 검증 (10:00 ~ 12:00)
- Module 3: API 로직 검증 (13:00 ~ 15:00)
- Module 4: UI/UX 일관성 (15:00 ~ 17:00)

**참고 자료:** `QA_TRAINING_PROGRAM_TRANSLATOR_ANALYST.md` (전체 4일 커리큘럼)

**다음 단계:**
1. Day 1 교육 자료 최종 검토 (2026-05-26 08:00)
2. Translator + Data-Analyst 전화 확인 (2026-05-26 08:30)
3. Day 1 교육 시작 (2026-05-26 09:00)
4. Day 2-4 진행 (2026-05-27~29)

---

## 【사용자 액션 필요】

### 👤 1. Evaluator 1차 인터뷰
**기한:** 2026-05-26 08:00 (내일 아침)  
**담당:** User  
**소요시간:** 30분 ~ 1시간  
**대상:** 2026-05-25 23:59 까지의 지원자 중 최대 2명

**준비물:**
- `EVALUATOR_AI_AGENT_RECRUITMENT_PACKAGE.md` 리뷰 완료
- 인터뷰 질문 세트 (문서에 포함)
- 평가 기준 (문서에 포함)

**평가 항목:**
1. QA 방법론 이해도 (설계/구현/배포 검증 경험)
2. 아키텍처 검증 능력 (복잡한 시스템 설계 평가 가능)
3. 팀 교육 역량 (Translator/Data-Analyst 지도 가능)
4. 독립 운영 준비도 (2026-05-27 18:00까지 독립 운영 가능)

**결정:** 최대 1명 내정, 최소 2026-05-26 12:00까지 합격 통보

---

### 👤 2. Automation Specialist 인터뷰
**기한:** 2026-05-28 14:00 ~ 18:00  
**담당:** User  
**소요시간:** 1시간 (2명 × 30분)  
**대상:** 2026-05-27 17:00까지의 지원자 중 최대 2명

**준비물:**
- `AUTOMATION_SPECIALIST_CONFIRMATION_2026_05_30.md` 리뷰 완료
- 인터뷰 질문 세트 (문서에 포함)
- Cron/배포/모니터링 과제 (선택)

**평가 항목:**
1. Node.js + TypeScript 숙련도 (3년+)
2. Supabase/PostgreSQL 실전 경험
3. GitHub Actions/CI-CD 자동화 경험
4. 에러 모니터링 (Sentry, DataDog 등) 경험

**결정:** 최대 1명 내정, 2026-05-28 17:00까지 합격 통보

---

## 📊 실행 현황 타임라인

| 시간 | 담당 | 액션 | 상태 |
|------|------|------|------|
| 2026-05-25 14:30 | Secretary | Evaluator 공고 게시 | ⏳ 예정 |
| 2026-05-25 17:00 | Secretary | 지원자 심사 시작 | ⏳ 예정 |
| 2026-05-25 23:59 | Secretary | Evaluator 모집 마감 | ⏳ 예정 |
| 2026-05-26 08:00 | User | Evaluator 1차 인터뷰 | ⏳ 예정 |
| 2026-05-26 09:00 | Evaluator-신규 + Translator + Data-Analyst | QA 교육 Day 1 시작 | ⏳ 예정 |
| 2026-05-26 12:00 | Secretary | Automation 공고 게시 | ⏳ 예정 |
| 2026-05-26 17:00 | Evaluator-신규 | 온보딩 완료, 독립 준비 | ⏳ 예정 |
| 2026-05-27 14:00 | Evaluator-현재 | BM-P1 2차 검토 완료 | 🔴 긴급 |
| 2026-05-27 18:00 | Evaluator-신규 | 독립 운영 시작 (DISCORD-BOT-P1, BM-P1 2차) | ⏳ 예정 |
| 2026-05-28 14:00 | User | Automation 인터뷰 | ⏳ 예정 |
| 2026-05-28 17:00 | User | Automation 고용 승인 | ⏳ 예정 |
| 2026-05-29 17:00 | Evaluator-신규 | QA 교육 Day 4 완료 | ⏳ 예정 |
| 2026-05-30 09:00 | Automation + Secretary | 온보딩 Day 1 시작 | ⏳ 예정 |
| 2026-06-01 | - | 팀 최종 구성 완료 (6명, 100% 활용) | ⏳ 예정 |

---

## 🎯 성공 기준

### Evaluator 추가 (2026-05-27 18:00)
- ✅ ≥2명 지원자 확보
- ✅ 1명 이상 합격 및 온보딩 완료
- ✅ BM-P1 2차 평가 완료
- ✅ QA 교육 Day 1-2 완료
- ✅ 2026-05-27 18:00 독립 운영 시작

### QA 교육 (2026-05-29 17:00)
- ✅ 4일 교육 커리큘럼 100% 진행
- ✅ Translator 독립 리뷰 최소 3개 이슈 식별
- ✅ Data-Analyst 독립 리뷰 최소 3개 이슈 식별
- ✅ 2026-05-29 18:00 정규 QA 풀 편입

### Automation 추가 (2026-05-30 18:00)
- ✅ ≥2명 지원자 확보
- ✅ 1명 이상 합격 및 온보딩 완료
- ✅ 2026-05-30 18:00 첫 번째 자동화 업무 독립 운영

---

## 📋 참고 문서

**실행 상세:**
- `EVALUATOR_AI_AGENT_RECRUITMENT_PACKAGE.md` — Evaluator 모집 + 온보딩 (800줄)
- `QA_TRAINING_PROGRAM_TRANSLATOR_ANALYST.md` — QA 교육 커리큘럼 (1,200줄)
- `AUTOMATION_SPECIALIST_CONFIRMATION_2026_05_30.md` — Automation 모집 + 온보딩 (1,000줄)
- `TEAM_EXPANSION_EXECUTION_2026_05_25.md` — 통합 실행 계획 (1,800줄)

**팀 상황:**
- `memory/team_expansion_decision_2026_05_25.md` — 사용자 최종 권장사항
- `FINAL_RETURN_BRIEFING.md` — 휴가 복귀 브리핑 (3개 긴급 액션)

---

## ⚠️ 주의사항

1. **BM-P1 최우선:** OVERDUE +12시간 (2026-05-27 14:00 deadline 절대 준수)
2. **평행 실행:** 3개 항목 동시 진행 (Evaluator 모집 + 교육 + Automation 모집)
3. **Evaluator 이중역할:** 신규 Evaluator는 온보딩 완료 후 즉시 교육 강사 역할
4. **교육 강사:** Evaluator-신규가 2026-05-26 09:00부터 Day 1 교육 진행 (빠른 적응 필요)
5. **독립 운영:** Evaluator-신규는 2026-05-27 18:00부터 본격 프로젝트 평가 (DISCORD-BOT-P1 시작)

---

**Document Status:** Created 2026-05-25 14:30  
**Last Updated:** 2026-05-25 14:30  
**Next Review:** 2026-05-26 09:00 (교육 시작 전)
