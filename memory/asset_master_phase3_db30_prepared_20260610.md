---
name: Asset Master Phase 3 db/30 마이그레이션 준비 완료
description: db/30 마이그레이션 파일 생성, GitHub 푸시 완료 (2026-06-10 12:35 KST) — asset_edit_history + asset_disposals 테이블 준비
type: project
---

# Asset Master Phase 3 db/30 마이그레이션 준비 완료

**Status:** ✅ **PREPARED & PUSHED TO GITHUB**  
**Preparation Time:** 2026-06-10 12:35 KST  
**Next Action:** User 실행 (Supabase SQL Editor에서 마이그레이션 실행)  
**Deadline:** 2026-06-15 (Asset Master Phase 3-1/3-2/3-3 완료)

---

## 📋 마이그레이션 내용

### 파일 정보
- **Location:** `/db/30_asset_master_phase3_schema.sql`
- **Commit:** 8d93d4a1
- **GitHub URL:** https://raw.githubusercontent.com/asdf1390a-dot/workspace-dev/main/db/30_asset_master_phase3_schema.sql
- **Status:** ✅ Pushed to main branch

### 생성될 테이블

**1. asset_edit_history**
- 목적: 자산 필드 수정 이력 추적
- 컬럼:
  - id BIGSERIAL PRIMARY KEY
  - asset_id UUID FK (assets)
  - changed_by UUID FK (auth.users)
  - changed_field VARCHAR (수정된 필드명)
  - previous_value TEXT (이전 값)
  - new_value TEXT (새 값)
  - changed_at TIMESTAMPTZ (수정 시간)

**2. asset_disposals**
- 목적: 자산 폐기/해제 기록 관리
- 컬럼:
  - id BIGSERIAL PRIMARY KEY
  - asset_id UUID FK (assets)
  - disposed_by UUID FK (auth.users)
  - disposal_reason VARCHAR (폐기 사유)
  - disposal_date DATE (폐기 일자)
  - disposal_certificate_url TEXT (폐기 증명서 URL)
  - created_at TIMESTAMPTZ

### 추가 컬럼 (assets 테이블)
- edit_history JSONB (수정 이력 JSON, 기본값 '[]')
- last_edited_by UUID (마지막 편집자)
- last_edited_at TIMESTAMPTZ (마지막 편집 시간)

### 적용될 보안 정책

**RLS Policy: asset_edit_history**
- 사용자는 자신의 포트폴리오 자산의 edit_history만 조회 가능
- Subquery: assets → portfolios → owner_id = auth.uid()

**RLS Policy: asset_disposals**
- 사용자는 자신의 포트폴리오 자산의 disposal 기록만 조회 가능
- 동일한 subquery 구조

### 생성될 인덱스

**asset_edit_history:**
- idx_asset_edit_history_asset_id: (asset_id)
- idx_asset_edit_history_changed_at: (changed_at DESC) ← 타임라인 쿼리 최적화
- idx_asset_edit_history_changed_by: (changed_by) ← 사용자별 수정 조회 최적화

**asset_disposals:**
- idx_asset_disposals_asset_id: (asset_id)
- idx_asset_disposals_disposed_by: (disposed_by) ← 사용자별 폐기 기록 조회
- idx_asset_disposals_created_at: (created_at DESC) ← 최근 폐기 기록 조회

---

## 🔧 실행 방법

### 1단계: Supabase SQL Editor 열기
```
https://supabase.com/dashboard/project/[project-id]/sql/new
```

### 2단계: SQL 복사
```bash
curl https://raw.githubusercontent.com/asdf1390a-dot/workspace-dev/main/db/30_asset_master_phase3_schema.sql | pbcopy
```
또는 위 GitHub URL에서 직접 복사

### 3단계: Supabase에 붙여넣고 실행
- SQL Editor에 붙여넣기
- "Run" 버튼 클릭

### 4단계: 검증
```sql
-- 테이블 존재 확인
\dt asset_edit_history
\dt asset_disposals

-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename IN ('asset_edit_history', 'asset_disposals');

-- 인덱스 확인
SELECT * FROM pg_indexes WHERE tablename IN ('asset_edit_history', 'asset_disposals');
```

---

## 📊 Phase 3-6 타임라인

| 단계 | 날짜 | 작업 | 상태 |
|------|------|------|------|
| Prep | 2026-06-10 | db/30 마이그레이션 파일 생성 | ✅ DONE |
| Exec | 2026-06-10 | 사용자가 Supabase SQL 실행 | ⏳ PENDING |
| Phase 3-1 | 2026-06-10~11 | Detail Page 개발 (1.5 days) | ⏳ READY |
| Phase 3-2 | 2026-06-11~13 | Edit Page 개발 (2 days) | ⏳ READY |
| Phase 3-3 | 2026-06-13~14 | Dispose Page 개발 (1.5 days) | ⏳ READY |
| Testing | 2026-06-14 | 통합 테스트 & 배포 | ⏳ READY |
| Deploy | 2026-06-15 | Vercel 프로덕션 배포 | 🎯 DEADLINE |

---

## 🎯 이 마이그레이션이 필요한 이유

**Phase 3-1: Detail Page**
- 자산 상세 정보 표시
- 유지보수 타임라인 표시 (edit_history 활용)

**Phase 3-2: Edit Page**
- 자산 필드 수정
- 수정 이력 기록 (asset_edit_history 쓰기)

**Phase 3-3: Dispose Page**
- 자산 폐기 프로세스
- 폐기 기록 생성 (asset_disposals 쓰기)

---

## ⚡ 핵심 체크리스트

**마이그레이션 전:**
- [ ] Supabase SQL Editor 접속 가능 확인
- [ ] 프로젝트 백업 확인 (선택사항)

**마이그레이션 후:**
- [ ] 2개 테이블 생성 확인 (asset_edit_history, asset_disposals)
- [ ] assets 테이블에 3개 컬럼 추가 확인
- [ ] RLS 정책 6개 생성 확인 (2개 테이블 × 2 policies)
- [ ] 인덱스 6개 생성 확인

**이후:**
- [ ] Phase 3-1 Detail Page 개발 시작
- [ ] API 라우트 생성 (/api/assets/[id])
- [ ] 타임라인 컴포넌트 개발

---

**Created By:** Autonomous Execution  
**Commit:** 8d93d4a1 (chore(db/30): Add Asset Master Phase 3 schema)  
**Next Action:** User executes migration in Supabase  
**Reference:** /memory/asset_master_phase3_6_sprint_plan_20260610.md
