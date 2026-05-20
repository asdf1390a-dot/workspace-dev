---
name: Asset Master v2 설계 (Option A - 기존 자산 유지 + 증분)
description: 506개 기존 자산 보존 + 필수 기능만 25개 API (CRUD, QR, 대량임포트, 검색, 통계)
type: project
relatedFiles: dsc-fms-portal/ASSET_MASTER_V2_DESIGN.md
---

# Asset Master v2 설계 — 기존 자산 기반 증분 업그레이드

**작성일:** 2026-05-15  
**상태:** 설계 완료 (Web-Builder AI Agent 구현 대기)  
**전략:** Option A — 기존 506개 자산 유지 + 증분 개선

## 핵심 선택: Option A (Greenfield 거부)

### Option A의 장점
1. **기존 506개 자산 = 100% 유지**
   - DB 테이블 유지 (categories, asset_classes, assets, asset_audit)
   - 시드 데이터 그대로 (03_seed_assets.sql)
   - BM/PM/Disposal FK 체인 안전

2. **필수 기능만 25개 API로 축소**
   - CRUD (Create, Read, Update, Delete)
   - QR 스캔 및 업데이트
   - 벌크 임포트
   - 검색, 통계, 보고

3. **기존 타입과 호환성 유지**
   - lib/assets/types.ts 그대로 사용
   - 기존 UI (app/assets/page.tsx) 호환

4. **개발 기간 단축**
   - 설계 1일 + 구현 7일 (예상)
   - Greenfield는 3주 이상 소요

## 기존 상태

### DB 스냅샷
- categories (15행) — 대분류
- asset_classes (~120행) — 소분류
- assets (506행) — 자산 마스터
- asset_audit (~0행) — 감시 로그 (INSERT 트리거)

### 기존 API (app/api/assets/)
- POST /api/assets — 신규 추가
- GET /api/assets — 목록 (PostgREST)
- GET /api/assets/[assetId] — 상세
- PUT /api/assets/[assetId] — 수정
- DELETE /api/assets/[assetId] — 삭제
- POST /api/assets/[assetId]/dispose — 폐기 처리
- GET /api/assets/[assetId]/documents — 첨부문서
- GET /api/assets/export/excel, /export/csv

### 기존 UI (app/assets/)
- page.tsx — 자산 목록
- [assetId]/page.tsx — 상세 조회
- new/page.tsx — 신규 추가

## 추가되는 기능 (V2)

| # | 기능 | 도입 이유 | 범위 |
|---|------|---------|------|
| 1 | QR 스캔 → 자산 상세 조회 | 현장에서 QR 스캔 후 즉시 확인 | API + UI |
| 2 | QR 코드 재생성 | 손상된 QR 코드 재지정 | API + UI |
| 3 | 자산 대량 임포트 (Excel) | 신규 자산 일괄 등록 | API + UI |
| 4 | 고급 검색 (필터) | 필터링 기반 조회 | API + UI |
| 5 | 자산 이력 페이지 | asset_audit 기반 변경 이력 | UI |
| 6 | 통계 대시보드 | 자산 현황 요약 | API + UI |
| 7 | 오프라인 모드 | 모바일 앱에서 오프라인 검색 | API |

## 상태
✅ 설계 완료 → Web-Builder AI Agent 구현 대기
