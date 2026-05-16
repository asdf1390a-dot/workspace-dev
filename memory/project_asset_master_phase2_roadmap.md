---
name: Asset Master v2 Phase 2 API 개발 로드맵
description: 16개 MVP API 우선순위정렬 + 의존도분석 + 5일주간로드맵 + 신규팀원역할분담
type: project
relatedFiles: dsc-fms-portal/ASSET_MASTER_PHASE2_API_ROADMAP.md
---

# Asset Master v2 Phase 2 — API 개발 로드맵

**대상:** 웹개발자 (5% 진행) + 신규팀원 (2026-05-17~23)  
**마감:** 2026-05-23 18:00 KST (7일)  
**목표:** MVP 16개 API + 3개 UI + 배포

## 현황 분석

| 항목 | 내용 |
|------|------|
| 총 API 개수 | 16개 (MVP) + 9개 (Defer Phase 2.5) |
| 웹개발자 진행률 | 5% (failure_code 드롭다운 명세 완료) |
| 신규팀원 합류 | 2026-05-17 (Day 2) |
| 가용 개발자 일수 | 웹개발자 5.5일 + 신규팀원 4일 |
| DB 마이그레이션 | 필수 완료 (선행 작업) |

## API 16개 우선순위 (정렬)

### 그룹 1: 기본 조회 (5개) — Critical Path (2026-05-17~18)

**#1. GET /api/assets** (목록조회 + 필터 + 검색)
- 복잡도: Mid / 예상시간: 2~3시간
- 의존도: 높음 (다른 조회 API의 기반)
- 구현: FTS 검색 (name_en/name_ta/model/serial_no) + 필터 + 페이지네이션

**#2. GET /api/assets/:id** (상세조회)
- 복잡도: Low / 예상시간: 0.5시간
- 의존도: 중간 (UI 상세 화면 필요)
- 구현: 기존 코드 재사용 (app/api/assets/[assetId]/route.ts)

**#3. GET /api/asset-categories** (카테고리목록)
- 복잡도: Low / 예상시간: 1시간
- 의존도: 높음 (필터 드로어, 임포트 검증에 필요)
- 구현: categories 테이블 조회 + 캐싱

**#4. GET /api/assets/:id/audit-log** (자산이력)
- 복잡도: Low / 예상시간: 1시간
- 의존도: 중간 (상세 화면의 부가 정보)
- 구현: asset_audit 기반 변경 이력

**#5. GET /api/assets/locations** (위치자동완성)
- 복잡도: Low / 예상시간: 0.5시간
- 의존도: 중간 (필터 입력 필드)
- 구현: DISTINCT location FROM assets

### 그룹 2: CRUD (4개) — 병렬 진행 가능

**#6-9: POST/PUT/DELETE /api/assets, POST /api/assets/bulk-update**
- 복잡도: Low~Mid
- POST, PUT: 기존 코드 재사용
- bulk-update: RLS + audit trigger 고려
- 총 예상시간: 4시간

### 그룹 3: Import (5개) — 필수 신기능

**#10-12. POST /api/assets/import/preview, execute + GET /api/assets/import/batches**
- 복잡도: High (파일 파싱 + 부분실패처리)
- 예상시간: 6시간
- 권장: Supabase `rpc`로 bulk insert 위임

**#13-14. GET /api/assets/import/batches/:id, /items**
- 복잡도: Low
- 예상시간: 1시간

### 그룹 4: Export & Stats (2개) — 마무리

**#15-16. GET /api/assets/export/excel, /statistics**
- 복잡도: Mid
- 예상시간: 2시간

## 의존도 분석 (병렬 개발 전략)

**선행 작업 (필수):** DB 마이그레이션 (2026-05-16~17)

**병렬 스트림 1:** 조회 API (5개) → 동시 진행 가능
**병렬 스트림 2:** CRUD (4개) → 스트림 1과 독립적
**병렬 스트림 3:** Import (5개) → 스트림 1 완료 후

**총 리소스 배분:**
- 웹개발자: 스트림 1-2 담당 (예상 6일)
- 신규팀원: 스트림 3 + UI 컴포넌트 (예상 4일)

## 위험 요소 & 완화책

**Import 타임아웃 (1000+ 행):**
- Vercel 10s(hobby) / 60s(pro) 제한
- 완화: Supabase RPC 위임 + 클라이언트 폴링

**audit trigger 성능:**
- bulk insert 시 audit rows 동시 발생
- 완화: batch 단위 1 audit row

**신규팀원 온보딩:**
- Day 1에만 환경 구성 → 개발 일정 감소
- 권장: 사전에 개발 가이드 + 의존성 전부 설치
