---
name: 🔴 회귀 진행 (2026-06-19 12:14 KST)
description: 배포 1/4 UP (Portal만) / 신뢰도 25% / P0 크론 실행 + 부분복구 감지
type: project
---

# 🔴 회귀 진행 상황 (2026-06-19 12:14 KST)

## 배포 상태 (실시간 확인)

| 서비스 | 상태 | HTTP | 상태도 |
|--------|------|------|--------|
| dsc-fms-main | 404 | ❌ | DEPLOYMENT_NOT_FOUND |
| dsc-fms-portal | 200 | ✅ | LIVE (부분복구) |
| dsc-fms-audit | 404 | ❌ | DEPLOYMENT_NOT_FOUND |
| dsc-fms-travel | 404 | ❌ | DEPLOYMENT_NOT_FOUND |

**결과:** 1/4 UP (25% 신뢰도)

**진행도:** 11:40 (0/4) → 11:54 (0/4 + Portal 로딩) → 12:14 (1/4 UP) = **부분복구 신호 ✓**

## 핵심 블로커

### 🔴 P0 — db/30 OVERDUE (104h 48m)
- **상태**: GitHub PAT + Vercel 토큰 대기 중
- **행동**: SQL 즉시 실행 (Supabase 대시보드)
- **영향**: Phase 3-1 마감 연쇄 차단

### 🔴 P0 — 3개 P1 배포 여전히 DOWN
- **main**: 404 (30+ min)
- **audit**: 404 (30+ min)
- **travel**: 404 (30+ min)
- **원인**: Vercel 배포 상태 불안정 (부분복구 중)
- **행동**: Vercel 대시보드 진단 + 재배포 필요 가능

### 🔴 P1 — Cron 자동화 0개 실행
- **08:00 KST 감시**: 미실행
- **메모리 갱신**: 2026-06-17 01:33 이후 중단
- **행동**: 자동화 시스템 재시작 필요

## 팀 상태
- **활용률**: 9% (1/11명만 활동)
- **차단 사유**: BLOCKED_ON_EXTERNAL (사용자 토큰)
- **마감**: Phase 3-1 **26h 20m** (⚠️ 긴급)

## 사용자 액션 필요 (즉시)

### 【긴급 1】GitHub PAT 재생성
**링크**: https://github.com/settings/tokens → Generate token (classic)
**스코프**: `workflow`, `repo`
**제공**: 토큰 텍스트 복사

### 【긴급 2】Vercel API 토큰
**링크**: https://vercel.com/account/tokens
**스코프**: Full Access 권장
**제공**: 토큰 텍스트 복사

### 【긴급 3】db/30 SQL 실행 (Supabase)
**Supabase 대시보드**: https://app.supabase.com/project/pzkvhomhztikhkgwgqzr/sql

**SQL:**
```sql
-- db/30: 예비 관리 테이블 스키마
CREATE TABLE IF NOT EXISTS spare_management (
  id bigserial PRIMARY KEY,
  asset_id bigint NOT NULL,
  spare_code text NOT NULL,
  quantity_on_hand integer DEFAULT 0,
  reorder_level integer DEFAULT 10,
  supplier_id bigint,
  last_ordered_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  CONSTRAINT fk_spare_asset FOREIGN KEY (asset_id) REFERENCES assets(id),
  CONSTRAINT fk_spare_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE INDEX idx_spare_asset ON spare_management(asset_id);
CREATE INDEX idx_spare_code ON spare_management(spare_code);
```

**위치**: Supabase 대시보드 → SQL Editor → 복사한 SQL 붙여넣기 → `RUN` 클릭

---

## 다음 단계

1. **사용자 토큰 제공** (PAT, Vercel)
2. **Supabase SQL 실행** (db/30)
3. **P0 크론 재실행** (배포 진단 + Cron 복구)
4. **모니터링 10분 주기 재개** (신뢰도 회복)

**긴급도**: 🔴 **CRITICAL**  
**마감**: 2026-06-20 14:00 KST (26h 20m)  
**신뢰도**: 25% (1/4)
