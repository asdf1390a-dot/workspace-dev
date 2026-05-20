---
name: Parts & Inventory (부품/재고) 모듈 설계
description: 부품 마스터 + 공급업체 관리 + 입출고 추적 + 재고 대시보드 (기존 확장)
type: project
relatedFiles: DESIGN_PARTS.md
---

# Parts & Inventory 모듈 설계

**작성일:** 2026-05-12  
**상태:** 설계 완료 → Web-Builder AI Agent 개발 대기  
**담당:** Web-Builder  
**포털:** https://dsc-fms-portal.vercel.app

## 기존 구현 현황

**이미 존재하는 것:**
- `pages/inventory/index.js` — 목록 페이지
- `pages/inventory/new.js` — 부품 등록 폼
- `pages/inventory/[id].js` — 상세/입출고 처리
- `db/07_spare_parts.sql` — spare_parts + stock_movements 테이블

**이번 설계의 누락 항목:**
| 부족한 기능 | 영향 |
|---|---|
| 공급업체(vendor) 테이블 없음 | 발주처 추적 불가 |
| spare_parts에 updated_at 없음 | 최종 수정일 추적 불가 |
| spare_parts에 vendor_id 없음 | 공급업체 연결 불가 |
| stock_movements에 bm_event_id 없음 | BM 이력과 출고 연결 불가 |
| 재고부족 알림 없음 | 관리자에게 알림 없음 |
| 재고 현황 대시보드 없음 | 전체 현황 파악 불가 |
| 부품 편집 페이지 없음 | 등록 후 수정 불가 |
| 공급업체 관리 페이지 없음 | 발주 추적 불가 |

## DB 스키마 (파일: db/14_parts_module.sql)

### vendors 테이블 (신규)
```
- id, name, name_short, country, city
- contact_name, contact_phone, contact_email, address
- lead_time_days (평균 납기)
- payment_terms ('30일 후불', 'COD' 등)
- currency (INR | KRW | USD)
- is_active, notes
- 인덱스: name, is_active
```

### spare_parts 테이블 추가 칼럼 (ALTER)
```
- vendor_id (FK: vendors)
- unit_price (단가, vendor currency 기준)
- currency (통화, default INR)
- lead_time_days (이 부품의 납기)
- specs (규격/사양, 예: "60x110x22mm")
- maker (제조사, SKF/NSK 등)
- image_url (Supabase Storage)
- updated_at (자동 갱신)
```

### stock_movements 테이블 추가 칼럼 (ALTER)
```
- bm_event_id (FK: bm_events, 선택사항)
- user_id (auth.users, 처리자)
```

## UI 페이지 (신규 & 개선)

### 신규 페이지
- `/inventory/vendors` — 공급업체 목록
- `/inventory/vendors/new` — 공급업체 등록
- `/inventory/vendors/:id` — 공급업체 상세/편집
- `/inventory/:id/edit` — 부품 편집 (기존 new.js 확장)
- `/inventory/dashboard` — 재고 현황 대시보드

### 개선 사항
- 부품 상세(/inventory/:id)에 공급업체 정보 추가
- 입출고 폼에 BM 이벤트 연결 옵션
- 재고부족 배지 (threshold 기반)

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/inventory/vendors | 공급업체 목록 |
| POST | /api/inventory/vendors | 공급업체 등록 |
| GET | /api/inventory/vendors/:id | 공급업체 상세 |
| PUT | /api/inventory/vendors/:id | 공급업체 편집 |
| DELETE | /api/inventory/vendors/:id | 공급업체 삭제 |
| GET | /api/inventory/parts | 부품 목록 |
| POST | /api/inventory/parts | 부품 등록 |
| PUT | /api/inventory/parts/:id | 부품 편집 |
| GET | /api/inventory/stock-movements | 입출고 이력 |
| POST | /api/inventory/stock-movements | 입출고 처리 |
| GET | /api/inventory/dashboard | 재고 현황 요약 (KPI) |

## 개발 순서

1. DB 마이그레이션 (vendors, spare_parts ALTER, stock_movements ALTER)
2. 공급업체 API 5개 엔드포인트
3. 부품 편집 API (PUT)
4. 공급업체 관리 UI (목록/등록/상세/편집)
5. 부품 편집 페이지
6. 재고 현황 대시보드 (차트 + KPI)
7. BM 연결 UI (입출고 폼에 옵션 추가)
8. 재고부족 알림 (이메일 + 인앱)
9. 테스트 & 배포

## 설계 원칙
- **모바일 퍼스트:** 현장 작업자 사용 고려
- **기존 UI 패턴 유지:** 다크 테마, 카드, 탭
- **Supabase 직접 호출:** SWR/React Query 미사용
- **인라인 스타일:** Tailwind 미사용

## 상태
🟡 **설계 완료** → Web-Builder AI Agent 개발 대기
