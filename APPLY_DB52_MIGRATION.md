# db/52 FMS 정규화 마이그레이션 실행 가이드

## 📋 마이그레이션 정보

**파일:** `db/52_expense_master_phase3_5_schema.sql`  
**생성일:** 2026-06-12 21:40 KST  
**목적:** Expense Master Phase 3-5 스키마 확장 (트렌드 분석, 감사 추적, KPI 경보, 벤치마크, 스케줄)  
**상태:** ✅ 준비 완료

---

## 🔧 설정 정보

**Supabase Project:** `pzkvhomhztikhkgwgqzr`  
**Supabase URL:** https://app.supabase.com/project/pzkvhomhztikhkgwgqzr/sql  
**Database:** PostgreSQL 15+

---

## 📊 마이그레이션 내용

### 생성 테이블 (5개)
1. **expense_trend_analysis** — 월간 트렌드 분석
   - 기간별 지출 추세, 이동평균, 예측값
   - 인덱스: 3개 (period_month, expense_code, metric_type)

2. **expense_audit_trail** — 감사 추적
   - INSERT/UPDATE/DELETE/APPROVE 이벤트 기록
   - 변경 전/후 상태 저장 (JSONB)
   - 이상치 탐지 플래그
   - 인덱스: 6개
   - RLS 정책: 2개

3. **expense_kpi_alerts** — KPI 경보
   - 예산 초과, 이상치, 편차, 데이터 누락 경보
   - 심각도 레벨: INFO, WARNING, CRITICAL
   - 인덱스: 5개
   - RLS 정책: 2개

4. **expense_benchmark** — 벤치마크 데이터
   - 산업 표준, DSC 역사 평균, 표준 편차
   - 인덱스: 1개
   - RLS 정책: 1개

5. **expense_schedule** — 스케줄 관리
   - 월별/분기별/연간 반복 일정
   - 템플릿: 기계코드, 공급업체, 부품명
   - 인덱스: 4개
   - RLS 정책: 3개

### 트리거 (3개)
1. **tr_kpi_alert_check** — KPI 경보 자동 생성
2. **tr_audit_expense_changes** — 감사 추적 자동 기록
3. **tr_calculate_next_trigger** — 다음 실행 날짜 자동 계산

### 함수 (1개)
- **calculate_monthly_trend()** — 월간 트렌드 계산 (3/12개월 이동평균, 예측)

### RLS 정책
- 인증 사용자 읽기 권한
- 관리자 쓰기 권한
- 감사 추적 읽기 공개 (감사 목적)

---

## 🚀 실행 방법

### 옵션 1: Supabase SQL Editor (권장)

1. Supabase 대시보드 열기:
   https://app.supabase.com/project/pzkvhomhztikhkgwgqzr/sql

2. **새 쿼리** 클릭

3. 다음 SQL 파일 전체 복사:
   ```
   /db/52_expense_master_phase3_5_schema.sql
   ```

4. SQL 에디터에 붙여넣기

5. **Run** 버튼 클릭 또는 `Ctrl+Enter`

6. 결과 확인:
   ```
   Command completed successfully
   ```

### 옵션 2: Supabase CLI (필요한 경우)

```bash
# Supabase CLI 설치
npm install -g supabase

# 마이그레이션 파일 배포
supabase db push --file /db/52_expense_master_phase3_5_schema.sql
```

---

## ✅ 검증 단계

### 1. 테이블 생성 확인
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public' 
AND table_name LIKE 'expense_%'
ORDER BY table_name;
```

**예상 결과:** 5개 행
```
expense_audit_trail
expense_benchmark
expense_kpi_alerts
expense_schedule
expense_trend_analysis
```

### 2. 인덱스 확인
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname='public' 
AND tablename LIKE 'expense_%'
ORDER BY tablename, indexname;
```

**예상 결과:** 10+ 인덱스

### 3. 트리거 확인
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema='public'
AND event_object_table LIKE 'expense_%'
ORDER BY event_object_table, trigger_name;
```

**예상 결과:** 3개 트리거
- tr_kpi_alert_check
- tr_audit_expense_changes
- tr_calculate_next_trigger

### 4. 함수 확인
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema='public'
AND routine_name LIKE 'calculate_%'
OR routine_name LIKE 'check_%'
OR routine_name LIKE 'audit_%';
```

**예상 결과:** 함수들 정상 생성

### 5. RLS 정책 확인
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname='public'
AND tablename LIKE 'expense_%'
ORDER BY tablename, policyname;
```

**예상 결과:** 10+ RLS 정책

---

## 🔄 트랜잭션 안전성

마이그레이션은 **트랜잭션으로 보호됨**:

```sql
BEGIN;
-- 모든 DDL/DML 문
COMMIT;
```

### 오류 발생 시 자동 롤백:
- 모든 테이블 생성이 취소됨
- 기존 스키마 보존
- 재실행 가능

---

## 🎯 다음 단계

### 1. 마이그레이션 실행
- [ ] Supabase SQL Editor에서 db/52 실행
- [ ] 검증 쿼리 5개 모두 확인

### 2. 코드 커밋
```bash
git add db/52_expense_master_phase3_5_schema.sql
git commit -m "chore(db): add FMS expense master phase 3-5 normalization (db/52)

- 5 tables: trend_analysis, audit_trail, kpi_alerts, benchmark, schedule
- 10+ indexes for performance optimization
- 3 triggers: KPI alerts, audit trail, schedule date calculation
- RLS policies: authenticated access with admin overrides
- Utility function: calculate_monthly_trend() with 3/12-month moving averages"
```

### 3. API 통합 (후속 작업)
- [ ] db/52 테이블 기반 API 엔드포인트 개발
- [ ] UI 대시보드 구성 (트렌드, 경보, 벤치마크)

---

## 📞 문제 해결

### ❌ 오류: "expense_master" 테이블 없음
**원인:** 의존 테이블이 없음  
**해결:** db/48 마이그레이션 먼저 실행

### ❌ 오류: "auth.users" 참조 오류
**원인:** auth 스키마 초기화 안 됨  
**해결:** Supabase 대시보드에서 "Authentication" 활성화

### ❌ 오류: 권한 없음 (Permission denied)
**원인:** 서비스 역할 키 필요  
**해결:** SUPABASE_SERVICE_ROLE_KEY 사용

### ✅ 성공한 경우
- Supabase SQL Editor에 "Command completed successfully" 표시
- 5개 테이블 모두 information_schema에 나타남
- 검증 쿼리 5개 모두 예상 결과 반환

---

## 📝 마이그레이션 로그

**생성:** 2026-06-12 21:40 KST  
**파일:** db/52_expense_master_phase3_5_schema.sql (565줄)  
**상태:** ✅ 준비 완료 (검증 완료)

**체크리스트:**
- [x] SQL 문법 검증
- [x] 의존성 확인
- [x] 트랜잭션 래핑
- [x] RLS 정책 설정
- [x] 인덱스 최적화
- [x] 트리거 정의
- [x] 권한 설정
- [ ] 실행 (사용자 작업)
- [ ] 검증 (사용자 작업)

---

## 🔗 관련 문서

- Supabase 프로젝트: https://app.supabase.com/project/pzkvhomhztikhkgwgqzr
- SQL 에디터: https://app.supabase.com/project/pzkvhomhztikhkgwgqzr/sql
- 마이그레이션 파일: `/db/52_expense_master_phase3_5_schema.sql`
