---
name: Asset Master Phase 1 실행 가이드
description: asset_qr_scans 테이블 생성 및 DB 마이그레이션 (db/28_asset_master_v2.sql)
type: project
relatedFiles: ASSET_MASTER_PHASE1_EXECUTION_GUIDE.md
---

# Asset Master Phase 1 — DB 마이그레이션 실행 가이드

**담당:** web-builder  
**우선순위:** 🔴 CRITICAL  
**목표:** db/28_asset_master_v2.sql을 Supabase에 실행하여 asset_qr_scans 테이블 생성  
**예상 소요:** 5분  
**완료 기준:** asset_qr_scans 테이블 생성 + 인덱스 + RLS 정책 설정

## 핵심 작업

### asset_qr_scans 테이블 생성
- UUID 기반 QR 스캔 기록 테이블
- asset_id FK 참조 (on delete cascade)
- 3개 인덱스 (asset_id, qr_payload, scanned_at)
- RLS 정책: authenticated 사용자 전체 접근

### 검증 항목
1. asset_qr_scans 테이블 존재 (0개 행)
2. assets 테이블 행 수 변경 없음 (506+ 유지)
3. 인덱스 3개 생성 확인
4. RLS 정책 설정 확인

### 실행 단계
1. Supabase SQL Editor 오픈
2. db/28_asset_master_v2.sql 전체 복사
3. SQL 실행 (1~2초 소요)
4. 검증 쿼리 4개 실행

## 기술 세부사항

### 테이블 구조
```sql
create table asset_qr_scans (
  id uuid primary key,
  asset_id uuid not null (FK: assets),
  qr_payload text not null,
  scanned_at timestamptz default now(),
  scanned_by uuid (FK: auth.users),
  device_info text,
  location_gps text
)
```

### 인덱스
- asset_qr_scans_asset_idx (asset_id)
- asset_qr_scans_payload_idx (qr_payload)
- asset_qr_scans_scanned_at_idx (scanned_at desc)

## 상태
🔴 **준비 완료** — SQL 파일 준비됨, 실행 대기 (Web-Builder AI Agent)
