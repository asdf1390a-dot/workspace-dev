---
name: Asset Master v2 API 명세서 (25개 엔드포인트)
description: CRUD, QR코드, 이력, 검색필터, 대량임포트, QR스캔로그, 통계, 내보내기, 에러처리, 성능최적화
type: project
relatedFiles: dsc-fms-portal/ASSET_MASTER_V2_API_GUIDE.md
---

# Asset Master v2 API 명세서

**버전:** v2.0 (Option A 증분 업그레이드)  
**엔드포인트 수:** 25개  
**기본 URL:** https://dsc-fms-portal.vercel.app/api/assets

## 설계 원칙

1. **기존 호환성:** 506개 기존 자산 100% 유지
2. **모바일 우선:** QR 스캔 → 즉시 조회
3. **RESTful 표준:** GET, POST, PUT, DELETE 명확
4. **JSON 기반:** 모든 요청/응답 JSON
5. **페이징:** 500개 자산도 성능 저하 없음

## 기술 스택

- **호스팅:** Vercel (Next.js 14)
- **DB:** Supabase Postgres
- **인증:** Supabase Auth (JWT 토큰)
- **API 스타일:** Next.js API Routes + Supabase PostgREST

## 인증 & 보안

**요청 헤더 (필수):**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**RLS 정책:** 현재 모든 authenticated 사용자 → 전체 접근  
(향후: org_id 기반 액세스 제어)

## 자산 CRUD

### 1. 자산 목록 조회
**요청:** `GET /api/assets?page=1&limit=20&category=01&status=active&sort=updated_at.desc`

**쿼리 매개변수:**
| 매개변수 | 타입 | 기본값 | 설명 |
|---------|------|-------|------|
| `page` | int | 1 | 페이지 번호 |
| `limit` | int | 20 | 한 페이지당 행 수 (최대 100) |
| `category` | text | - | 카테고리 코드 필터 |
| `status` | text | - | 상태 필터 (active/idle/maintenance/sold/scrapped) |
| `location_like` | text | - | 위치 포함 검색 |
| `make` | text | - | 제조사 필터 |
| `sort` | text | created_at.desc | 정렬 |

### 2. 자산 상세 조회
**요청:** `GET /api/assets/[id]`  
**응답:** 전체 자산 정보 포함

### 3. 자산 생성 (기존 코드 재사용)
**요청:** `POST /api/assets` + JSON 본문  
**필수 필드:** asset_class_code, machine_asset_number, name_en, status

### 4. 자산 수정
**요청:** `PUT /api/assets/[id]` + JSON 본문  
**업데이트 가능 필드:** 대부분 (읽기전용: id, created_at, created_by 제외)

### 5. 자산 삭제
**요청:** `DELETE /api/assets/[id]`  
**주의:** FK(BM/PM/Disposal) 체인 확인

## QR 코드 기능

**POST /api/assets/[id]/qr/regenerate** — QR 코드 재생성  
**응답:** { qr_payload: "새로운값", qr_image: "data:image/..." }

## 자산 이력

**GET /api/assets/[id]/audit-log** — asset_audit 기반 변경 이력  
**응답:** [{operation, old_values, new_values, changed_at, changed_by}, ...]

## 대량 임포트

**POST /api/assets/import/preview** — Excel 미리보기 + 검증  
**응답:** {batch_id, file_name, total_rows, valid_rows, errors[], preview[]}

**POST /api/assets/import/execute** — 일괄 입력 실행  
**요청:** {batch_id, confirm: true}

**GET /api/assets/import/batches** — 배치 목록  
**GET /api/assets/import/batches/[batch_id]** — 배치 상세

## 내보내기 & 통계

**GET /api/assets/export/excel** — Excel 다운로드  
**GET /api/assets/statistics** — 통계 API (자산 현황 요약)

## 에러 처리

**401 Unauthorized:** {success: false, error: {message: "Unauthorized"}}  
**403 Forbidden:** {success: false, error: {message: "Forbidden"}}  
**404 Not Found:** {success: false, error: {message: "Asset not found"}}  
**409 Conflict:** {success: false, error: {message: "Duplicate machine_asset_number"}}

## 성능 최적화

- FTS 인덱스 (name_en, name_ta, model, serial_no)
- 상태별 인덱스 (status)
- 위치별 인덱스 (location)
- 페이지네이션 (offset/limit)
