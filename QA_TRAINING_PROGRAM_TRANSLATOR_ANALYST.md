---
name: QA Training Program for Translator & Data-Analyst
description: 4일 교육 과정 (2026-05-26~29) - 기본 QA 스킬 습득 및 가벼운 리뷰 업무 전환
type: project
---

# QA 교육 프로그램 (번역가 & 분석가)
**시작:** 2026-05-26 09:00  
**기간:** 4일 (2026-05-26 ~ 2026-05-29)  
**목표:** 기본 QA 검증 능력 습득 + 가벼운 리뷰 풀 구성  
**효과:** 현재 75% 유휴 자원(50h/week) → 생산적 QA 검토자  

## 프로그램 개요

### 대상 & 현황
| 대상 | 현재 역할 | 현재 가용률 | 목표 |
|------|---------|-----------|------|
| Translator AI Agent | 번역 + 콘텐츠 | 25% | 기본 QA 검토 |
| Data-Analyst AI Agent | 분석 + 보고 | 25% | 기본 QA 검토 |
| 총 가용시간 | - | 50h/week 유휴 | 15h/week QA 할당 |

### 교육 구조
- **Methodology (1일):** QA 개념 + DSC FMS 아키텍처 이해
- **Simulation (2일):** 실제 프로젝트 문서로 연습 + 피드백
- **Independent Review (1일):** 메인 평가자 감독 하 독립 리뷰

---

## 교육 일정

### Day 1: QA 방법론 & 기초 (2026-05-26 09:00 ~ 17:00)

#### Module 1: QA 역할 개요 (09:00 ~ 10:00)
**목표:** 평가자 직무 이해
- 평가자의 3가지 책임 (설계검증 → 구현검증 → 배포검증)
- DSC FMS 품질 기준
- QA 체크리스트 구조
- 블로커/이슈 분류 시스템

**산출물:** QA Checklist Template (샘플)

#### Module 2: DB 스키마 검증 (10:00 ~ 12:00)
**목표:** 데이터베이스 설계 이해 및 검증
- PostgreSQL 기본 개념 (테이블, 컬럼, 제약조건, 인덱스)
- Supabase 스키마 설계 패턴
- 일반적인 스키마 오류 (데이터 타입, NULL 처리, FK 충돌)
- Migration 안전성 체크리스트

**실습:**
- BM-P1 DB 스키마 (technicians 테이블) 분석
- Asset Master Phase 2 스키마 vs 기존 스키마 비교
- 3개 충돌 지점 식별 연습

**산출물:** DB Validation Checklist

#### Module 3: API 로직 검증 (13:00 ~ 15:00)
**목표:** API 엔드포인트 동작 이해
- REST API 기본 (GET/POST/PUT/DELETE)
- 요청/응답 구조 분석
- 에러 핸들링 & 엣지케이스
- 성능 고려사항 (쿼리 효율성, N+1 문제)

**실습:**
- Asset Master API (16개) 명세서 분석
- 각 엔드포인트 별 논리적 흐름 추적
- 잘못된 응답 형식 식별

**산출물:** API Validation Checklist

#### Module 4: UI/UX 일관성 (15:00 ~ 17:00)
**목표:** 프론트엔드 리뷰 기초
- DSC FMS 디자인 시스템 (색상, 타이포그래피, 컴포넌트)
- 반응형 디자인 체크
- 접근성 기준 (WCAG AA)
- 사용자 경험 흐름

**실습:**
- Backup App UI 스크린샷 분석
- 4개 색상 대비 문제 식별
- 모바일 레이아웃 점검

**산출물:** UI/UX Checklist

---

### Day 2: 실제 프로젝트 검증 시뮬레이션 (2026-05-27 09:00 ~ 17:00)

#### Session 1: BM-P1 분석 (09:00 ~ 12:00)
**실습 프로젝트:** Breakdown Management Phase 1
**문서:**
- project_bm_module_design.md (설계)
- db/14_technicians_team_migration.sql (DB)
- resolve.js API 명세

**태스크:**
1. DB 스키마 변경사항 점검 (11개 컬럼 추가)
   - 데이터 타입 정확성 ✓
   - NULL 허용 여부 ✓
   - 기존 데이터와 호환성 ✓

2. API 로직 검증 (POST /api/bm/resolve)
   - 요청 형식 올바른가? ✓
   - 응답 구조 명확한가? ✓
   - 에러 케이스 처리되었는가? ✓

3. TechnicianSelect 컴포넌트 검증
   - UI 일관성 (DSC FMS 스타일) ✓
   - 드롭다운 옵션 정확한가? ✓
   - 모바일 반응성? ✓

**피드백:** Evaluator-1이 실시간 코칭 + 정정

#### Session 2: Asset Master API 분석 (13:00 ~ 17:00)
**실습 프로젝트:** Asset Master Phase 2
**문서:**
- project_asset_master_api_v1.md (API 명세)
- project_asset_master_phase2_roadmap.md (16개 MVP API)

**태스크:**
1. 5개 주요 API 검증
   - GET /api/assets (목록 조회)
   - POST /api/assets/search (전문 검색)
   - POST /api/assets (생성)
   - PUT /api/assets/:id (수정)
   - DELETE /api/assets/:id (삭제)

2. 각 API별 점검 항목
   - 요청 파라미터 타입 ✓
   - 응답 필드명 일관성 ✓
   - 에러 응답 형식 ✓
   - 인증/권한 체크 ✓

3. DB 쿼리 효율성
   - JOIN 구조 분석 ✓
   - 인덱스 활용 ✓
   - N+1 문제 없는가? ✓

**산출물:** API Review Form (템플릿)

---

### Day 3: 독립 리뷰 감시 (2026-05-28 09:00 ~ 17:00)

#### Session 1: Translator 독립 리뷰 (09:00 ~ 13:00)
**할당:** Travel Management UI 설계 1차 검증
**문서:** project_travel_management_phase2_ui_plan.md

**프로세스:**
1. 설계 문서 정독 (1시간)
2. 검증 체크리스트 작성 (1시간)
3. 이슈 식별 & 우선순위 부여 (1시간)
4. Evaluator-1에게 결과 보고 (30분)

**기대 결과:**
- 최소 5개 이상 이슈 식별
- 2개 이상 블로커급 이슈 발견
- 보고서 구조 명확 & 실행가능한 액션

**Evaluator 피드백:**
- 놓친 부분 지적
- 우선순위 재조정 가이드
- 개선점 커칭

#### Session 2: Data-Analyst 독립 리뷰 (14:00 ~ 18:00)
**할당:** Backup App Phase 2 UI 설계 1차 검증
**문서:** project_backup_app_ui_design_system.md

**프로세스:** (Translator와 동일)

**기대 결과:**
- 3~5개 이슈 식별
- 색상 대비, 타이포그래피, 간격 검증
- WCAG AA 준수 확인

---

### Day 4: 정규 QA 워크플로우 편입 (2026-05-29 09:00 ~ 17:00)

#### 독립 운영 시작
**Translator AI Agent:**
- 첫 가벼운 리뷰 태스크: Telegram Bot Phase 1 UI 검증
- 메인 평가자 비동기 감시 (의견 요청 시에만)

**Data-Analyst AI Agent:**
- 첫 가벼운 리뷰 태스크: Weekly Report Form 업데이트 명세 검증
- 메인 평가자 비동기 감시

**정규 프로세스:**
- 일일 09:00 팀 스탠드업 (5분)
- 리뷰 이슈 공유 및 우선순위 동기화
- 메인 평가자 블로커 협력

---

## 예상 효과 (2026-05-30)

### 역할 분담 강화
| 역할 | 기존 | 신규 추가 | 총 책임시간 |
|------|------|---------|------------|
| Evaluator-1 | 설계+구현+배포 검증 | 전략 & 고난도 설계 | 20h/week |
| Translator | 번역 100% | 번역 50% + 가벼운 QA 50% | 25h/week |
| Data-Analyst | 분석 100% | 분석 50% + 가벼운 QA 50% | 25h/week |
| **QA 풀 총력** | 20h/week | **+30h/week** | **50h/week** |

### 품질 개선
- **리뷰 전담 인력:** 1명 → 3명 (200% 증가)
- **병렬 처리 능력:** 2개 → 4개 프로젝트 (100% 증가)
- **평가자 스트레스:** 100% 포화 → 30% 포화 (70% 경감)
- **설계 오류 조기 발견:** 30% → 70% (다수 관점)

### 일정 개선
| 단계 | 기존 | 개선 후 |
|------|------|--------|
| 1차 검토 | 1~2일 | 12시간 |
| 2차 검토 | 2~3일 | 1~2일 |
| 3차 검토 | 1~2일 | 12시간 |
| **전체 QA 사이클** | **4~5일** | **2~3일** |

---

## 교육 자료 & 리소스

### 필수 문서 (Day 1 준비)
1. `qa_methodology_guide.md` — QA 방법론 가이드
2. `checklist_db_validation.md` — DB 검증 체크리스트
3. `checklist_api_validation.md` — API 검증 체크리스트
4. `checklist_ui_ux.md` — UI/UX 일관성 체크리스트

### 실습 문서 (Day 2-3)
1. project_bm_module_design.md
2. project_asset_master_phase2_roadmap.md
3. project_travel_management_phase2_ui_plan.md
4. project_backup_app_ui_design_system.md

### 참고 자료
- DSC FMS 디자인 시스템 (Figma 링크)
- PostgreSQL 공식 문서
- Next.js 모범 사례

---

## 평가 기준

### Day 4 이후 독립 리뷰 품질 평가
| 항목 | 합격 기준 |
|------|---------|
| 이슈 식별 정확도 | 실제 이슈 대비 80% 이상 발견 |
| 우선순위 판단 | Evaluator-1과 80% 이상 일치 |
| 보고서 명확성 | 구현자가 100% 이해 가능 |
| 완료도 | 할당된 리뷰 100% 완료 |

### 합격시 처우
- 정규 가벼운 리뷰 태스크 할당 (매주 8~10시간)
- 분기별 심화 교육 (고급 QA 기법)
- 특별 보너스 ($50/month per person)

---

## 팀 확장 결과 (2026-05-30 이후)

### 팀 구성 (확정)
1. **Evaluator 1명 (주요 검증자)**
   - 설계 + 고난도 구현 + 배포 검증
   - 시간: 20h/week

2. **Translator 1명 (번역 + 가벼운 QA)**
   - 번역 50% + UI/UX 리뷰 50%
   - 시간: 25h/week (새로운 역할 포함)

3. **Data-Analyst 1명 (분석 + 가벼운 QA)**
   - 분석 50% + API/DB 리뷰 50%
   - 시간: 25h/week (새로운 역할 포함)

4. **Secretary 1명 (프로젝트 관리)**
   - CTB 관리, 커뮤니케이션, 스케줄링
   - 시간: 40h/week (자동화전문가 추가 후 30h/week로 감소)

5. **Web-Builder 1명 (개발)**
   - 전체 개발 + 테스트
   - 시간: 100h/week

6. **Automation Specialist 1명 (2026-05-30 추가)**
   - Cron 관리, 모니터링, 자동화
   - 시간: 31h/week

### 팀 가용률 개선
| 지표 | 현재 (5명) | 개선 후 (6명) | 증가율 |
|------|-----------|-------------|--------|
| 총 배정시간 | 190h/week | 241h/week | +26% |
| 실제 활용률 | 49% (94h/week) | 100% (241h/week) | 51% ↑ |
| 가용 시간 | 96h/week 유휴 | 0h/week | 100% 활용 |

### 재정 영향
| 시점 | 월 비용 | 추가 비용 | 누적 |
|------|--------|----------|------|
| 현재 (5명) | $2,800 | - | $2,800 |
| +Evaluator (2026-05-26) | $3,100 | +$300 | $3,100 |
| +Automation (2026-05-30) | $3,565 | +$465 | $3,565 |
| 증가율 | - | +27% | - |
