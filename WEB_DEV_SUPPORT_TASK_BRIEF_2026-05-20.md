---
task_id: web-dev-support-phase2-api-batch1
assignment_date: 2026-05-19 13:03 KST
owner: Web-Dev-Support (신규팀원)
start_date: 2026-05-20 (화)
deadline: 2026-05-23 18:00 KST (목)
duration: 5 days (Day 1 온보딩 + Day 2-4 개발)
priority: P0 (Critical Path)
status: 준비 완료 → 2026-05-20 08:00 KST 시작
---

# Asset Master Phase 2 — Web-Dev-Support 업무 브리프

> 📌 **당신의 역할:** Asset Master Phase 2 API Group 1 (기본 조회 5개) 담당
> 📌 **목표:** 2026-05-20~23 (5일) 동안 5개 API 구현 + 배포
> 📌 **평가자:** Phase 1 Day 1 Pass 후 평가자와 협력 QA

---

## 🎯 5일 로드맵 (Day-by-Day)

### **Day 1: 2026-05-20 (화)** — 온보딩 & 개발 준비 (4시간)

**오전 (09:00~12:00) — 환경 설정 + 코드 이해**
- [ ] Git 클론 & 브랜치 생성 (feature/asset-phase2-api)
- [ ] 환경 변수 확인 (.env.local)
- [ ] Supabase 대시보드 접근 확인
- [ ] Asset Master Phase 1 API 코드 리뷰 (`app/api/assets/route.ts`)
- [ ] Next.js App Router 구조 파악 (30분)

**오후 (14:00~18:00) — 설계 이해 + 첫 API 시작**
- [ ] ASSET_MASTER_PHASE2_ONBOARDING_PACKAGE.md 정독 (30분)
- [ ] ASSET_MASTER_PHASE2_API_GUIDE.md 설계 섹션 리뷰 (1시간)
- [ ] DB 스키마 확인 (asset, asset_audit_log, asset_categories 테이블)
- [ ] API #1 구현 시작 (`GET /api/assets` 기본 쿼리)
- **체크포인트:** 18:00 — Day 1 진도 보고 (리드 완료, API #1 50%)

---

### **Day 2: 2026-05-21 (수)** — API Group 1 단계별 구현 (8시간)

**오전 (09:00~13:00) — API #1, #2 완료**
- [ ] **API #1:** `GET /api/assets` (필터+검색+페이지네이션) — 2~3시간
  - 구현 파일: `app/api/assets/route.ts` (GET 분기)
  - 기능: FTS 검색 (q 파라미터), 필터 (category, status, location, make), 정렬, 페이지네이션
  - 테스트: curl/Postman으로 최소 3가지 쿼리 검증
- [ ] **API #2:** `GET /api/assets/:id` (개별 조회) — 30분
  - 구현 파일: `app/api/assets/[assetId]/route.ts`
  - 기능: 단일 자산 상세 정보 + audit_log 요약
  - **Tip:** Phase 1 코드 재사용 가능

**오후 (14:00~18:00) — API #3, #4 완료**
- [ ] **API #3:** `GET /api/asset-categories` (카테고리 목록) — 1시간
  - 구현 파일: `app/api/assets/categories/route.ts`
  - 기능: 모든 카테고리 목록 조회 (asset_categories 테이블)
  - 응답 형식: `{ id, name_en, name_ta, color }`
- [ ] **API #4:** `GET /api/assets/:id/audit-log` (감시 로그) — 1~1.5시간
  - 구현 파일: `app/api/assets/[assetId]/audit-log/route.ts`
  - 기능: asset_audit_log 쿼리 (최신 10개, 페이지네이션)
  - **Tip:** 기존 감시 로직 재사용 (asset_audit() 함수)

**체크포인트:** 18:00 — Day 2 진도 보고 (API #1~4 완료, #5 50%)

---

### **Day 3: 2026-05-22 (목)** — API Group 1 마무리 + Group 2 시작 (8시간)

**오전 (09:00~12:00) — API #5 완료 + Group 2 시작**
- [ ] **API #5:** `GET /api/assets/locations` (위치 목록) — 1시간
  - 구현 파일: `app/api/assets/locations/route.ts`
  - 기능: 모든 위치 목록 조회 (assets 테이블에서 distinct location)
  - 응답 형식: `[{ location, count }]` (위치별 자산 개수)

- [ ] **API #6 시작:** `POST /api/assets` (생성) — 2시간 (Day 3에서 50%)
  - 구현 파일: `app/api/assets/route.ts` (POST 분기)
  - 기능: 새 자산 생성 + asset_audit 기록
  - 필드: asset_id(중복체크), category, status, location, model, serial_no, ...
  - 검증: 필수 필드 확인, asset_id 유니크 확인

**오후 (14:00~18:00) — Group 2 API #6-7 진행**
- [ ] **API #6 계속:** POST 로직 + 트랜잭션 테스트 (1시간)
- [ ] **API #7 시작:** `PUT /api/assets/:id` (수정) — 1.5시간 (50%)
  - 구현 파일: `app/api/assets/[assetId]/route.ts` (PUT 분기)
  - 기능: 자산 정보 수정 + audit_log 기록 (old_value vs new_value)
  - 필수 필드: 변경 가능 필드만 (status, location, model 등)

**체크포인트:** 18:00 — Day 3 진도 보고 (API #1~5 완료, #6 80%, #7 50%)

---

### **Day 4: 2026-05-23 (금)** — Group 2 마무리 (8시간)

**오전~오후 (09:00~18:00) — API #7-9 완료 + 배포**
- [ ] **API #7 완료:** PUT 트랜잭션 + audit_log 기록 (1시간)
- [ ] **API #8:** `DELETE /api/assets/:id` — 1시간
  - 구현 파일: `app/api/assets/[assetId]/route.ts` (DELETE 분기)
  - 기능: 소프트 삭제 (상태를 'scrapped'로 변경) + audit_log
  - **중요:** 실제 삭제 아님 (규정 준수)
  
- [ ] **API #9:** `POST /api/assets/bulk-update` — 2.5시간
  - 구현 파일: `app/api/assets/bulk-update/route.ts`
  - 기능: 여러 자산 일괄 수정 (상태, 위치 주로)
  - 요청: `{ asset_ids: [1, 2, 3], updates: { status: 'maintenance' } }`
  - 트랜잭션 처리 필수

- [ ] **배포 & 테스트:** (1.5시간)
  - Git commit (message format: `feat(assets): add Group 1-2 CRUD APIs | Refs: web-dev-support-phase2-api-batch1, Stage: API`)
  - Git push → origin feature/asset-phase2-api
  - Vercel 빌드 확인 (2~3분)
  - 프로덕션 환경에서 최소 5개 엔드포인트 테스트

**체크포인트:** 18:00 — Day 4 최종 보고 (모든 API 완료 + 배포 성공)

---

## 📋 의존성 & 사전준비

### ✅ 이미 준비됨:
- DB 마이그레이션 (db/29_asset_master_v2_phase2.sql) ✅
- 설계 문서 (ASSET_MASTER_PHASE2_*.md) ✅
- Phase 1 API 코드 참조 가능 ✅

### ❌ 당신이 해야할 것:
- Supabase 권한 확인 (asset, asset_audit_log 테이블 쓰기 권한)
- Git SSH 키 설정 확인

---

## 📞 연락처 & 도움말

- **온보딩 담당:** 웹개발자 (코드 리뷰 + 질문 답변)
- **설계 문서:** `/workspace-dev/dsc-fms-portal/ASSET_MASTER_PHASE2_*`
- **질문:** Discord #asset-master 채널에서 실시간 물어보기

---

## 🏆 성공 기준

- ✅ 5개 API 구현 (Group 1) + 4개 API 구현 (Group 2 #6-9)
- ✅ 모든 API 배포 (Vercel READY)
- ✅ 매일 18:00 KST 진도 보고
- ✅ 모든 코드 커밋 메시지 표준 형식 (Refs + Stage)
- ✅ 2026-05-23 18:00 KST 완료 (일정 준수)

---

**할당자:** 비서 (Claude Agent)  
**할당 시간:** 2026-05-19 13:03 KST  
**최종 승인:** CEO (Kyeongtae Na)
