---
name: Asset Master Phase 2 블로커 4개 긴급 수정
description: B1-B4 해결완료 (App Router통일, audit스키마, 경로충돌, POST중복) + Web-Builder AI Agent진행가이드
type: project
relatedFiles: dsc-fms-portal/ASSET_MASTER_PHASE2_BLOCKER_FIXES.md
---

# Asset Master v2 Phase 2 — 블로커 4개 긴급 수정 완료

**상태:** 🟢 모든 블로커 해결  
**Web-Builder AI Agent 진행:** Day 1 재개 가능 (10시간 내 5개 API 완료)

## 수정 완료 사항 (4개 블로커)

### B1. App Router vs Pages Router 충돌 ✅
**문제:** CLAUDE.md는 Pages Router, 실제 기존 API는 App Router 사용 → build 실패
**해결:** 설계 변경 → App Router로 통일
```
app/api/assets/route.ts                    (GET, POST)
app/api/assets/[assetId]/route.ts          (GET, PUT, DELETE)
app/api/assets/[assetId]/audit-log/route.ts (GET)
```

### B2. asset_audit 스키마 불일치 ✅
**문제:** 설계의 audit trigger가 기존 테이블 스키마와 맞지 않음
**해결:** audit trigger 제거 → 기존 `asset_audit_log()` 함수 재사용, import_batches/items는 RLS 정책으로 관리

### B3. 라우트 명명 충돌 ✅
**문제:** 설계의 `/history` 경로가 기존 PM/BM 이벤트 이력과 충돌
**해결:** 경로 변경 → `/audit-log` (감사 이력 전용)

### B4. POST /api/assets 중복 ✅
**문제:** 기존 코드가 이미 POST 구현 → 설계에서 중복 개발 지시
**해결:** 기존 POST 코드 재사용 (app/api/assets/route.ts의 기존 검증로직 포함)

## Web-Builder AI Agent 진행 가이드

**파일 검토 순서:**
1. ASSET_MASTER_PHASE2_DESIGN.md → "기술 스택 (App Router 통일)" 섹션
2. ASSET_MASTER_PHASE2_API_GUIDE.md → API 4 섹션 `/audit-log` 확인
3. db/29_asset_master_v2_phase2.sql → 라인 242-260 트리거 제거 & 주석 확인

**Day 1 구현 (2026-05-16~17):**
- DB 마이그레이션: 테이블 + 인덱스 + RLS 적용
- GET endpoints (5개): 1번~5번
- 예상 시간: 10시간
- 블로커 0개, 기술 스택 통일됨

## 기존 코드 활용

**POST /api/assets (API 6):** 변경 불필요 (기존 검증 로직 포함)
- 참조: app/api/assets/route.ts
- UNIQUE 제약: machine_asset_number
- 에러처리: 409 Conflict, 400 Bad Request

**GET /api/assets/:id (API 2):** 기존 구조 재사용
- 참조: app/api/assets/[assetId]/route.ts
- 기존 GET 로직 유지, PUT/DELETE 추가
