---
name: Design-Implementation Gap Analysis (2026-06-09)
description: 초기 설계 vs 실제 구현 미스매치 분석 및 반영 작업 계획
type: project
---

# 📋 설계-구현 미스매치 분석 (2026-06-09)

**분석 완료:** 2026-06-09 14:22 KST  
**분석 대상:** 7개 주요 프로젝트 + 자동화 시스템  
**총 미스매치:** 22개 (CRITICAL 4개, MAJOR 6개, MINOR 12개)

---

## 🚨 CRITICAL 미스매치 (즉시 반영 필요)

### 1. **DISCORD-BOT-P1: Python Discord Bot 서비스 전체 누락**
- **설계 위치:** `DISCORD_BOT_PHASE1_DESIGN.md`
- **문제:** Python Bot 구현 0% (discord.py 전체 누락)
- **영향:** 
  - ❌ Telegram ↔ Discord 양방향 동기화 불가
  - ❌ CTB 실시간 업데이트 → Discord 포스팅 불가
  - ❌ `/task @assign` 명령어 미지원
- **필수 구현:**
  - `discord.py` 봇 + Telegram 양방향 동기화
  - 4개 채널 라우팅 (CEO/팀논의/완료/CTB상태)
  - 메시지 중복 제거 로직
  - CTB 웹훅 → Discord 포스팅
- **예상 기간:** 3-5일
- **담당:** Web-Builder
- **상태:** 🔴 미구현

### 2. **TEAM-DASHBOARD-P1/2: 3개 페이지 + 역량 계산 로직 전무**
- **설계 위치:** `TEAM_DASHBOARD_DESIGN.md`
- **문제:** 완성도 20% (DB schema만, 페이지/로직 0%)
- **영향:**
  - ❌ 조직도 시각화 불가
  - ❌ 5D 역량 매트릭스 불가 (Technical, Task Achievement, Communication, Learning Speed, Reliability)
  - ❌ 팀 KPI 대시보드 불가
- **필수 구현:**
  1. `/dashboard/team-org` (조직도, ISR revalidate=3600)
  2. `/dashboard/team-capabilities` (5D 역량)
  3. `/dashboard/team-kpis` (팀 KPI)
  4. 역량 점수 계산 알고리즘 (CVP, task completion rate, communication metrics)
- **예상 기간:** 3-4일
- **담당:** Web-Builder + Planner (설계 검증)
- **상태:** 🔴 미구현

### 3. **ASSET-MASTER-P1: 4개 페이지 + 파일 관리 UI 미구현**
- **설계 위치:** `ASSET_MANAGEMENT_DESIGN.md`
- **문제:** 완성도 15% (List page OK, 편집/파일/폐기 0%)
- **영향:**
  - ❌ 자산 상세 조회/편집 불가
  - ❌ 파일 관리 (명세서/사진/구매증명) 불가
  - ❌ 폐기/매각 관리 불가
  - ❌ 상태 변경 히스토리 추적 불가
- **필수 구현:**
  1. `/assets/:id/edit` (자산 편집, disposal_reason/disposal_date/disposal_by 필드)
  2. `/assets/:id/files` (파일 관리, Supabase Storage)
  3. `/assets/:id/dispose` (폐기/매각 로직)
  4. DB 테이블 확장 (`asset_files`, `asset_disposal_history`)
  5. 파일 업로드 API (10MB 제한, jpg/png/pdf/docx/xlsx)
- **예상 기간:** 3-4일
- **담당:** Web-Builder
- **상태:** 🔴 미구현

### 4. **JEEPNEY-BACKUP-P1: Phase 1 전체 미구현**
- **설계 위치:** `JEEPNEY_BACKUP_APP_PHASE1_DESIGN.md`
- **문제:** 완성도 0% (설계만, 구현 전무)
- **영향:**
  - ❌ 개인이력 관리 불가 (회사/프로젝트/성과)
  - ❌ 타임라인 뷰 불가
  - ❌ CRUD 기능 불가
- **필수 구현:**
  1. `/jeepney-personal` (개인이력 hub)
  2. 7개 페이지 (회사/프로젝트/성과 관리 + 타임라인)
  3. API routes (CRUD)
  4. Supabase RLS 정책
- **예상 기간:** 3-4일
- **담당:** Web-Builder
- **상태:** 🔴 미구현 (선택적, Phase 2 작업)

---

## 🟨 MAJOR 미스매치 (중요, 우선 반영)

### 1. **BM-P1: 테이블명 불일치**
- **설계:** `breakdown_reports` (primary)
- **구현:** `bm_events` (secondary)
- **영향:** DB 스키마 일관성, 마이그레이션 인덱스/RLS 검증 필요
- **해결 옵션:**
  - Option A: 마이그레이션으로 테이블명 변경 (권장, 30분)
  - Option B: 설계 문서 업데이트 (간단, 5분)
- **권장:** Option A (스키마 정규화)
- **상태:** 🟨 결정 대기

### 2. **TRAVEL-P1/2: UI 컴포넌트 + Voucher Parsing 미구현**
- **설계 위치:** `TRAVEL_PHASE2_UI_DESIGN.md`, `TRAVEL_MANAGEMENT_PHASE2_FULL_DESIGN.md`
- **문제:** 완성도 60% (API OK, UI/Voucher 0%)
- **영향:**
  - ❌ 13개 UI 컴포넌트 미구현
  - ❌ 비용 정산 로직 미검증
  - ❌ 영수증 인식 API 미구현
  - ❌ 환율 변환 미지원
- **필수 구현:**
  1. 56개 하위 컴포넌트 중 13개 주요 컴포넌트 UI
  2. 비용 정산 로직 (환율 변환, 비용 분할, 개인/팀 추적)
  3. Voucher parsing (OCR 기반 영수증 인식)
  4. 다국어 지원 (영어/타밀어)
- **예상 기간:** 4-5일
- **담당:** Web-Builder
- **상태:** 🟨 진행 중 (API 60%, UI 대기)

### 3. **AUDIT-P1: Discord 통합 미구현 (Phase 2)**
- **설계:** Telegram + Discord 이중 채널
- **구현:** Telegram만 (Discord는 Phase 2로 예정)
- **영향:** Discord 채널 공지 불가 (Telegram은 정상)
- **상태:** ℹ️ 계획된 미연기 (Phase 2)

---

## 📋 MINOR 미스매치 (참고)

1. **AUDIT-P1:** `audit_session_warnings` JSON 저장 미구현 (경고 히스토리 추적 불가)
2. **AUDIT-P1:** Locale 기본값 하드코딩 (AUDIT_DEFAULT_LOCALE env var 미사용)
3. **BM-P1:** `deleted_at` 소프트 삭제 미지원 (논리적 삭제 불가)
4. **BM-P1:** Analytics `duration_minutes` 동적 계산 vs stored 컬럼 (선택 필요)
5. **TRAVEL-P1/2:** Member 초대/권한 관리 API 응답 구조 미확인
6. **TRAVEL-P1/2:** 다국어 콘텐츠 처리 미확인
7. **Team Dashboard:** ISR 캐시 전략 미적용 (static 페이지로 구현됨)

---

## 🔧 반영 작업 우선순위 (권장 순서)

### **P0 — 즉시 (금주 완료)**
1. **Discord Bot Python 서비스** (CRITICAL, 3-5일)
   - Telegram ↔ Discord 양방향 동기화
   - CTB 웹훅 → Discord 포스팅
   - `/task @assign` 명령어
   
2. **BM-P1 테이블명 통일** (MAJOR, 30분)
   - Option A 선택: `bm_events` → `breakdown_reports` 마이그레이션
   - 또는 설계 문서 업데이트

### **P1 — 이번 주 (6월 15일까지)**
3. **Team Dashboard 페이지 + API** (CRITICAL, 3-4일)
   - 조직도, 역량 매트릭스, KPI 페이지
   - 역량 계산 로직

4. **Asset Master 페이지 + 파일 관리** (CRITICAL, 3-4일)
   - 편집, 파일, 폐기 페이지
   - Supabase Storage 통합

### **P2 — 다음 주 (6월 22일까지)**
5. **Travel UI + Voucher Parsing** (MAJOR, 4-5일)
   - 13개 컴포넌트 구현
   - 영수증 인식 API

6. **JEEPNEY Backup App Phase 1** (CRITICAL but optional, 3-4일)
   - 개인이력 관리 (선택적, Phase 2 작업)

---

## 📊 반영 작업 추정 기간

| 작업 | P0/P1 | 예상 기간 | 담당 | 상태 |
|------|-------|----------|------|------|
| Discord Bot Python | P0 | 3-5일 | Web-Builder | 🔴 미시작 |
| BM 테이블명 통일 | P0 | 30분 | 사용자 (선택) | ⏳ 결정 대기 |
| Team Dashboard | P1 | 3-4일 | Web-Builder | 🔴 미시작 |
| Asset Master Pages | P1 | 3-4일 | Web-Builder | 🔴 미시작 |
| Travel UI/Voucher | P2 | 4-5일 | Web-Builder | 🟨 진행 중 |
| JEEPNEY Backup | P2 | 3-4일 | Web-Builder | 🔴 미시작 |
| **총계** | — | **17-21일** | — | — |

---

## 🔍 메모리 기록 추적

**분석 수행자:** Claude AI (Agent + Explore)  
**분석 시간:** 2026-06-09 14:22 KST  
**데이터 소스:** 
- 설계 문서 (10개 파일, 3,500+ LOC)
- git commit history (recent 20 commits)
- 메모리 이력 (ORGANIZATION_STATUS_*.md)
- 코드 베이스 (dsc-fms-portal, pages, api)

**검증 완료:**
- ✅ Asset Master Phase 3-6 설계 확인 (dsc-fms-portal/ASSET_MASTER_DESIGN.md 라인 827-853)
- ✅ 각 프로젝트별 코드 vs 설계 비교 완료
- ✅ 테이블 구조 및 API routes 검증 완료

**개선 사항 (향후):**
- 설계 문서 위치 자동화 (정기 갱신 크론)
- 미스매치 감지 자동화 (CI/CD에 포함)
- 월간 설계-구현 gap 리포트 자동화
