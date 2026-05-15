---
name: Weekly Report Automation Design
description: Data-driven automatic weekly form generation for DSC Mannur 4 departments
type: project
originSessionId: 45bbf3e7-02e9-4d9b-851d-34a279b3cff6
---

## 📋 주간업무양식 자동화 설계

**설계 완료:** 2026-05-14 20:16 KST

### 개요

각 부서의 실적 데이터를 자동으로 수집하여 주간업무양식을 자동 생성하는 시스템.

**데이터 흐름:**
```
생산/기술/보전/생산관리 부서 실적 입력
         ↓
  [일요일 23:00 자동 집계]
         ↓
    주간 실적 통합 계산
    (달성율, MTTR, 비용절감 등)
         ↓
   주간업무양식 자동 생성
   (JSON → DB 저장)
         ↓
부서별 검토 + 관리자 승인
         ↓
   Excel/PDF 다운로드

```

### 선정 방식: Option B (중간 수준, Mixed Pattern)

| 항목 | 결정사항 |
|------|--------|
| **자동화 수준** | 중간 (Option B) |
| **생성 타이밍** | 매주 일요일 23:00 |
| **저장 방식** | JSON + DB 스냅샷 |
| **검토 프로세스** | 3단계 (Generated→Reviewed→Approved) |
| **기술 스택** | Supabase RPC + Vercel Cron |

### 부서별 데이터 매핑

**생산부 (생산량)**
- 계획: `production_target` (월 기준값 ÷ 4)
- 결과: `production_volume` (주간 합계)
- 달성율: `= 결과 / 계획 × 100`
- 비고: 이상 상황 자동 감지

**기술부 (장비 점검)**
- 계획: `equipment_plan` (월 계획 ÷ 4)
- 결과: `inspection_count` (주간 완료건수)
- 달성율: `= 결과 / 계획 × 100`
- 비고: 장비별 점검율

**보전부 (유지보수)**
- 계획: `maintenance_plan` (월 계획 ÷ 4)
- 결과: `pm_completed` + `breakdown_fixed` (주간)
- 달성율: `= 결과 / 계획 × 100`
- 비고: MTTR, MTBF 지표

**생산관리 (비용/안전/품질)**
- 계획: 월간 목표
- 결과: 주간 실적
- 달성율: 자동 계산
- 비고: 원가절감, 일정준수, 안전지표

### 신규 DB 테이블 (3개)

```sql
-- 주간 보고서 (자동 생성)
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY,
  year INT,
  week INT,
  status ENUM ('generated', 'reviewed', 'approved'),
  data JSONB,  -- {생산: {...}, 기술: {...}, ...}
  created_at TIMESTAMP,
  approved_at TIMESTAMP
);

-- 부서별 코멘트
CREATE TABLE weekly_comments (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES weekly_reports,
  dept_name VARCHAR,
  comment TEXT,
  author_id UUID,
  created_at TIMESTAMP
);

-- 자동화 로그
CREATE TABLE weekly_auto_logs (
  id UUID PRIMARY KEY,
  execution_time TIMESTAMP,
  status VARCHAR,
  error_msg TEXT,
  rows_processed INT
);
```

### API 엔드포인트 (8개)

1. `POST /api/weekly-reports/generate-auto` — Vercel Cron 실행
2. `GET /api/weekly-reports/:year/:week` — 조회
3. `PATCH /api/weekly-reports/:year/:week` — 부분 수정
4. `POST /api/weekly-reports/:year/:week/comments` — 코멘트 추가
5. `PATCH /api/weekly-reports/:year/:week/status` — 상태 변경 (검토→승인)
6. `GET /api/weekly-reports/list` — 목록 (월별)
7. `POST /api/weekly-reports/:year/:week/export` — Excel 다운로드
8. `GET /api/weekly-reports/metrics` — 요약 통계

### 구현 로드맵 (3-4주)

| Phase | 항목 | 예상 기간 |
|-------|------|---------|
| 1 | DB 마이그레이션 + RPC (자동집계 로직) | 3-4일 |
| 2 | API 개발 (8개 엔드포인트) | 5-6일 |
| 3 | UI 개발 (5개 화면 + 상태전환) | 4-5일 |
| 4 | 테스트 + 배포 | 2-3일 |
| **전체** | | **14-18일** |

**예상 완료:** 2026-06-04 (수요일)

### 설계 문서

**경로:** `/dsc-fms-portal/WEEKLY_REPORT_AUTO_GENERATION_DESIGN.md`

**크기:** ~1,200줄 (완전한 기술 명세)

**포함 내용:**
- 요구사항 분석 & 비즈니스 프로세스
- 데이터 흐름 다이어그램
- 3가지 자동화 수준 비교
- DB 설계 & SQL 마이그레이션 스크립트
- API 명세 (요청/응답 예제 포함)
- 부서별 데이터 매핑 & 계산식
- Vercel Cron 설정
- UI/UX 설계 (5개 화면 레이아웃)
- 구현 체크리스트
- 테스트 전략

### 다음 단계

**재시작 후:**
1. 설계 파일 확인 ✓
2. 웹개발자에게 구현 위임 (설계 리뷰 → DB 마이그레이션부터 시작)
3. 진행 추적 (Weekly Reports 프로젝트로 중앙화)

**의존성:**
- Travel Phase 2 개발과 병렬 진행 가능
- Asset Master와 직접 의존성 없음
- Backup Phase 2와 동일 기술 스택 재사용

**위험 요소:**
- 데이터 정합성 (여러 테이블에서 수집할 때 트랜잭션 일관성 필요)
- 타임존 (일요일 23:00 UTC vs IST 차이)
- 권한 관리 (부서별 RLS 정책)

---

**상태:** 설계 완료 ✅ → 웹개발자 구현 대기 (2026-05-14)
