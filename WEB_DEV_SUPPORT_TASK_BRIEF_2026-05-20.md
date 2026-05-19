# 웹 개발 지원가 작업 지시 (Day 4-7, 2026-05-20~05-23)

**대상:** Web-Dev-Support  
**리드:** Web Developer  
**기간:** 2026-05-20 09:00 ~ 2026-05-23 23:59 (4일)  
**용량:** 75% Asset Master Phase 2 + 25% Backup Phase 2

---

## 📋 핵심 업무 분배

### PRIMARY: Asset Master Phase 2 API 개발 (75%)
**목표:** 16개 API 중 12-13개 완성 (MVP 기준 70~80%)  
**파일:** `dsc-fms-portal/app/api/assets/*`

### SECONDARY: Backup Phase 2 API 수정 (25%)
**목표:** 7개 구현 이슈 해결 + 2개 helper 함수 구현  
**파일:** `dsc-fms-portal/app/api/backup/*`

---

## 🎯 Asset Master Phase 2 — 16 API 상세 로드맵

### Group 1: 기본 조회 (Critical Path) — Day 4-5 완료 ⭐
**소요:** ~6시간 (우선순위 1번, 다른 그룹의 의존도 높음)  
**파일:** `app/api/assets/route.ts` (GET), `app/api/assets/[id]/route.ts` (GET)

| # | 엔드포인트 | 메소드 | 설명 | Time | 상태 |
|----|-----------|--------|------|------|------|
| 1.1 | `/api/assets` | GET | 전체 자산 목록 (필터/정렬/페이징) | 1.5h | 예정 |
| 1.2 | `/api/assets/:id` | GET | 단일 자산 상세 조회 | 1h | 예정 |
| 1.3 | `/api/asset-categories` | GET | 자산 카테고리 목록 (드롭다운용) | 0.75h | 예정 |
| 1.4 | `/api/assets/:id/audit-log` | GET | 자산 변경 이력 | 1.5h | 예정 |
| 1.5 | `/api/assets/locations` | GET | 저장소 위치 목록 | 1.25h | 예정 |

**기술 요구사항:**
- Supabase RLS 정책 (읽기만 활성화)
- Full-text search (검색명/설명)
- 페이징: offset/limit
- 정렬: 필드명/방향 (ASC/DESC)

**완료 기준:**
- ✅ 모든 응답 필드 일치 (status, statusCode, data, error)
- ✅ 필터 3개 이상 동작 (카테고리, 위치, 상태)
- ✅ pagination: total/page/pageSize 반환
- ✅ 에러 처리 (404, 400, 500)

---

### Group 2: CRUD 작업 (쓰기) — Day 5-6 완료
**소요:** ~7.5시간 (의존도: Group 1 완료 후)  
**파일:** `app/api/assets/route.ts` (POST), `app/api/assets/[id]/route.ts` (PUT, DELETE)

| # | 엔드포인트 | 메소드 | 설명 | Time | 의존성 |
|----|-----------|--------|------|------|--------|
| 2.1 | `/api/assets` | POST | 신규 자산 등록 | 2h | Group 1.3 |
| 2.2 | `/api/assets/:id` | PUT | 자산 정보 수정 | 2h | Group 1.2 |
| 2.3 | `/api/assets/:id` | DELETE | 자산 삭제 | 1.5h | Group 1.2 |
| 2.4 | `/api/assets/bulk-update` | POST | 일괄 수정 (체크박스 선택) | 2h | Group 1.1 |

**기술 요구사항:**
- Validation: 필수 필드 + 타입 검증
- RLS: INSERT/UPDATE/DELETE 정책 활성화
- Audit trail: 변경자, 변경시간, 변경내용 자동 기록
- Transaction 사용 (bulk-update는 원자성 보장)

**완료 기준:**
- ✅ 모든 입력값 검증 (필수/옵션/형식)
- ✅ 중복 체크 (자산명 동일, 시리얼번호)
- ✅ 권한 검증 (user_id 일치)
- ✅ audit_logs 테이블에 기록
- ✅ 응답: 생성/수정된 자산 객체 반환

---

### Group 3: Import/Export — Day 6-7 완료
**소요:** ~7.5시간 (의존도: Group 2 완료 후)  
**파일:** `app/api/assets/import/*`, `app/api/assets/export/*`

| # | 엔드포인트 | 메소드 | 설명 | Time | 의존성 |
|----|-----------|--------|------|------|--------|
| 3.1 | `/api/assets/import/template.xlsx` | GET | Excel 템플릿 다운로드 | 1h | - |
| 3.2 | `/api/assets/import/preview` | POST | 파일 업로드 + 미리보기 | 2h | 3.1 |
| 3.3 | `/api/assets/import/execute` | POST | 미리보기 승인 후 DB 저장 | 2h | 3.2 |
| 3.4 | `/api/assets/import/batches` | GET | 임포트 배치 목록 | 1h | 3.3 |
| 3.5 | `/api/assets/import/batches/:id` | GET | 배치별 상세 및 에러 로그 | 1.5h | 3.4 |

**기술 요구사항:**
- xlsx 라이브러리 사용
- 유효성 검증: 필수 컬럼 5개 (자산명, 카테고리, 위치, 상태, 모델)
- 에러 행 별도 수집 (계속 진행, 마지막에 요약)
- Batch 테이블에 기록: batch_id, imported_count, error_count, created_at

**완료 기준:**
- ✅ 템플릿 다운로드 시 헤더 + 예시 5행 포함
- ✅ 미리보기: 유효한 행만 표시, 에러 행은 빨강 하이라이트
- ✅ execute 시 batch 생성 + 자산 생성 + 이력 기록
- ✅ 배치 목록: 최신순 정렬, pagination
- ✅ 배치 상세: 실패한 행만 별도 표시 (이유 포함)

---

### Group 4: 내보내기 & 통계 — Day 7 완료
**소요:** ~3시간  
**파일:** `app/api/assets/export/*`, `app/api/assets/statistics/*`

| # | 엔드포인트 | 메소드 | 설명 | Time | 의존성 |
|----|-----------|--------|------|------|--------|
| 4.1 | `/api/assets/export/excel` | GET | 현재 자산 목록 Excel 다운로드 | 1.5h | Group 1.1 |
| 4.2 | `/api/assets/statistics` | GET | 자산 집계 (카테고리별, 상태별, 위치별) | 1.5h | Group 1.1 |

**기술 요구사항:**
- Export: 필터 유지 + xlsx 형식 + 포맷팅 (헤더 굵게, 자동 열폭)
- Statistics: 쿼리 최적화 (집계 쿼리 1회), 캐싱 (1시간)

**완료 기준:**
- ✅ Export: 사용자가 선택한 필터 적용된 데이터만 내보내기
- ✅ Statistics: 카테고리별 총수 + 상태별 분포 + 위치별 분포
- ✅ 빈 결과 처리 (에러 아닌 정상 응답)

---

## 🔧 Backup Phase 2 API — 7개 이슈 수정 (25%)

**합계:** 10-12시간 (Day 4-7에 분산)

- Issue #1 (CRITICAL): authorization 미정의 — 1시간
- Issue #2 (HIGH): storage-connectivity 구현 — 1.5시간
- Issue #3 (HIGH): audit-summary 구현 — 1시간
- Issue #4 (HIGH): validation-history 구현 — 1시간
- Issue #5 (MEDIUM): analytics/trends 구현 — 1.5시간
- Issue #6 (MEDIUM): analytics/storage-quota 구현 — 1.5시간
- Issue #7 (MEDIUM): analytics/compression 구현 — 1.5시간
- Helper 함수 2개: decompressGzip + createDailyBackup — 1시간

**상세:** `/home/jeepney/.openclaw/workspace-dev/dsc-fms-portal/BACKUP_APP_PHASE2_API_GUIDE.md` (라인 1~2094)

---

## 📅 Day 4-7 일일 스케줄

### Day 4 (2026-05-20)
**Asset Master 75% + Backup 25%**

| 시간 | 업무 | 소요 | 상태 |
|------|------|------|------|
| 09:00~12:00 | Asset Group 1 (자산 조회 5개 API) | 3h | 예정 |
| 12:00~13:00 | 점심 | - | - |
| 13:00~15:00 | Asset Group 1 계속 | 2h | 예정 |
| 15:00 | 일일 진도 리포트 (리드에게) | 15m | 필수 |
| 15:30~17:00 | Backup Issue #1, #2 | 1.5h | 예정 |

**목표:** Asset Group 1 완료 (100%) + Backup Issue #1~2 진행 중

---

### Day 5 (2026-05-21)
**Asset Master 75% + Backup 25%**

| 시간 | 업무 | 소요 | 상태 |
|------|------|------|------|
| 09:00~12:00 | Asset Group 2 (CRUD 4개 API) | 3h | 예정 |
| 12:00~13:00 | 점심 | - | - |
| 13:00~15:00 | Asset Group 2 계속 | 2h | 예정 |
| 15:00 | 일일 진도 리포트 | 15m | 필수 |
| 15:30~17:00 | Backup Issue #3, #4 | 1.5h | 예정 |

**목표:** Asset Group 2 완료 (100%) + Backup Issue #1~4 해결

---

### Day 6 (2026-05-22)
**Asset Master 75% + Backup 25%**

| 시간 | 업무 | 소요 | 상태 |
|------|------|------|------|
| 09:00~12:00 | Asset Group 3 (Import 5개 API) | 3h | 예정 |
| 12:00~13:00 | 점심 | - | - |
| 13:00~15:00 | Asset Group 3 계속 | 2h | 예정 |
| 15:00 | 일일 진도 리포트 | 15m | 필수 |
| 15:30~17:00 | Backup Issue #5~7 | 1.5h | 예정 |

**목표:** Asset Group 3 완료 (100%) + Backup Issue #5~7 진행 중

---

### Day 7 (2026-05-23)
**Asset Master 75% + Backup 25%**

| 시간 | 업무 | 소요 | 상태 |
|------|------|------|------|
| 09:00~11:00 | Asset Group 4 (Export + Statistics 2개 API) | 2h | 예정 |
| 11:00~12:00 | Asset Group 1~4 QA | 1h | 예정 |
| 12:00~13:00 | 점심 | - | - |
| 13:00~15:00 | Backup Helper 함수 + Issue #7 마무리 | 2h | 예정 |
| 15:00 | 최종 진도 리포트 + 완료 확인 | 30m | 필수 |
| 15:30~ | 버퍼 & 추가 테스트 | 2h | 예정 |

**목표:** Asset Master Phase 2 MVP 100% (16API) + Backup Phase 2 모든 이슈 해결

---

## ✅ 완료 기준 (Acceptance Criteria)

### Asset Master Phase 2
- [ ] 모든 16개 API 구현 완료 (4개 그룹)
- [ ] 각 API 응답 형식 통일: `{ status, statusCode, data/error }`
- [ ] 에러 처리 완성 (400, 401, 404, 500)
- [ ] Supabase RLS 정책 활성화
- [ ] 자동 테스트 통과 (모든 엔드포인트 기본 케이스)
- [ ] Audit trail 자동 기록 (변경자, 시간, 내용)

### Backup Phase 2
- [ ] Issue #1: authorization 정의됨
- [ ] Issue #2: storage-connectivity 구현 + 테스트 통과
- [ ] Issue #3: audit-summary 구현 + 응답 필드 완성
- [ ] Issue #4: validation-history 구현 + 페이징 동작
- [ ] Issue #5-7: analytics 3개 API 구현
- [ ] Helper 함수 2개 정의 + 테스트

### 통합
- [ ] 모든 새 엔드포인트 Vercel 배포 성공
- [ ] 프로덕션 환경 smoke test 통과
- [ ] 리드 개발자 Code Review 통과

---

## 📊 진도 리포팅 형식

**매일 15:00 KST — Web Developer(리드)에게 보고:**

```
✅ Day 4 진도 리포트 (2026-05-20 15:00)

【Asset Master Phase 2】
🟢 Group 1 완료 (5/5 API)
  - GET /api/assets ✅
  - GET /api/assets/:id ✅
  - GET /api/asset-categories ✅
  - GET /api/assets/:id/audit-log ✅
  - GET /api/assets/locations ✅

【Backup Phase 2】
🟡 Issue #1, #2 진행 중 (2/7)
  - [CRITICAL] restore-test.ts authorization fix ✅
  - [HIGH] storage-connectivity 구현 진행 중...

【예상】
- Day 5: Asset Group 2 완료 + Backup Issue #3~4 해결
- Day 6-7: Group 3-4 + Backup 마무리

【블로킹】
없음
```

---

## 🔗 참고 문서

- Asset Master Phase 2 상세: `dsc-fms-portal/ASSET_MASTER_PHASE2_ONBOARDING_PACKAGE.md`
- Backup Phase 2 API 명세: `dsc-fms-portal/BACKUP_APP_PHASE2_API_GUIDE.md`
- 팀 확대 일정: `HEARTBEAT.md`

---

**작성:** C-3PO (Secretary)  
**배포:** 2026-05-20 09:00 KST
