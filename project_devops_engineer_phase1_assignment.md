---
name: DevOps Engineer Phase 1 Assignment
type: team_assignment
date: 2026-05-19 KST
status: ACTIVE
owner: CEO (Kyeongtae Na)
assignee: DevOps Engineer (신규팀원)
deadline: 2026-05-30
---

# DevOps Engineer Phase 1 Assignment (2026-05-19)

**Status:** 🔴 PENDING (대기 중 — 팀원 배정 필요)  
**Duration:** 2026-05-19 ~ 2026-05-30 (11일)  
**Target Completion:** 2026-05-30 (1차 완료)

---

## 📋 Role Definition

**Title:** DevOps Engineer  
**Scope:** Vercel 배포 최적화, Supabase 자동화, 실시간 모니터링  
**Key Skills Required:**
- Vercel/Next.js 배포 경험 (ISR, Edge Functions)
- Supabase/PostgreSQL 성능 튜닝
- CI/CD 파이프라인 설계
- 모니터링 대시보드 구축 (Prometheus, Grafana 또는 유사)
- Telegram/Discord API 통합

**FTE:** 5일/주 × 2주 = 80시간

---

## 🎯 3개 병렬 프로젝트 (Priority-based)

### 📌 **Project 1: Vercel 배포 최적화** — 🔴 P0 (우선순위 최고)

**Target Date:** 2026-05-23 17:00 KST  
**Duration:** 5일 (2026-05-19 ~ 2026-05-23)  
**Allocation:** 40시간

#### 1.1 빌드 시간 단축 (현재 ~5min → 목표 2-3min)

**Current State Analysis:**
- [ ] Next.js 빌드 구조 분석 (`next build` 시간 측정)
- [ ] 번들 크기 분석 (webpack-bundle-analyzer)
- [ ] 의존성 최적화 (트리셰이킹, 중복 제거)

**Optimization Actions:**
- [ ] 불필요한 페이지/컴포넌트 식별 → 지연 로딩 적용
- [ ] 이미지 최적화 (Next.js Image 컴포넌트 적용)
- [ ] 캐싱 레이어 구현 (npm 패키지 캐싱, build artifacts)
- [ ] Vercel Cache 설정 (codeowners, api routes)

**Success Criteria:**
- ✅ 빌드 시간 < 3분 (측정값 첨부)
- ✅ 번들 크기 감소 ≥ 15%
- ✅ 최적화 로그 문서화 (어디를, 얼마나, 왜)

---

#### 1.2 콜드스타트 최적화

**Actions:**
- [ ] 함수형 API 분석 (serverless function 콜드스타트 시간 측정)
- [ ] 무거운 import 식별 및 lazy-load 전환
- [ ] Environment 설정 최적화 (node_modules 용량 축소)

**Success Criteria:**
- ✅ 콜드스타트 < 1초 (측정값)
- ✅ 배포 후 첫 요청 응답시간 < 500ms

---

#### 1.3 Edge Function 활용 (기능별)

**Target Functions:**
- [ ] Authentication redirects (login/logout)
- [ ] Static asset serving (gzip, compression)
- [ ] Geo-based routing (지역별 캐싱)

**Deliverables:**
- ✅ Edge Function 구현 (최소 3개)
- ✅ 성능 측정 (응답시간 비교 before/after)

---

#### 1.4 캐싱 전략 (Static + ISR)

**Actions:**
- [ ] Static Generation (SSG) 적용 대상 식별
  - Asset Master 목록 페이지
  - Backup 메트릭 대시보드
  - Travel 가이드 페이지
- [ ] ISR (Incremental Static Regeneration) 구성
  - 재검증 시간: 300초 (5분)
  - 데이터 변경 시 on-demand revalidation
- [ ] Cache-Control 헤더 최적화

**Deliverables:**
- ✅ SSG/ISR 설정 가이드 (vercel.json 예시)
- ✅ 캐싱 전략 문서 (TTL, revalidation rules)

---

### 📌 **Project 2: Supabase 자동화 + 성능 설정** — 🟡 P1

**Target Date:** 2026-05-27 17:00 KST  
**Duration:** 5일 (2026-05-24 ~ 2026-05-27)  
**Allocation:** 25시간

#### 2.1 데이터베이스 인덱스 최적화

**Performance Target:** Query 성능 20% 개선

**Analysis:**
- [ ] 모든 테이블 스캔 쿼리 식별 (Supabase Stats 분석)
- [ ] 느린 쿼리 로그 수집 (slow_query_log)
- [ ] 인덱스 누락 구간 찾기

**Index Creation:**
- [ ] Asset Master 테이블 (assets)
  - `asset_code` (단일 - 매우 빈번)
  - `category_id + status` (복합 - 필터)
  - `updated_at DESC` (정렬)
- [ ] Backup 테이블 (backup_metrics)
  - `created_at DESC` (일일 집계)
  - `user_id + status` (복합)
- [ ] Travel 테이블 (travel_requests)
  - `status + created_at` (상태별 정렬)
  - `traveler_id` (사용자별)

**Validation:**
- ✅ EXPLAIN ANALYZE 실행 (쿼리 플랜 확인)
- ✅ before/after 응답시간 측정
- ✅ 인덱스 크기 모니터링 (bloat 확인)

---

#### 2.2 자동 백업 정책

**Policy:**
- 매일 02:00 KST (한국 시간 기준)
- 보관기간: 90일 (자동 삭제)
- 저장소: Supabase Storage (gzip 압축)

**Implementation:**
- [ ] Backup function 생성 (Edge Function 또는 cron)
- [ ] 백업 메타데이터 테이블 (backup_log)
- [ ] 복구 프로시저 문서화

**Monitoring:**
- ✅ 일일 백업 상태 확인 (Telegram 알림)
- ✅ 저장소 사용량 추적
- ✅ 복구 테스트 1회 수행

---

#### 2.3 Read Replica 설정

**Target:** 보고서 쿼리 분리 (메인 DB 부하 감소)

**Use Cases:**
- Asset Master: 자산 통계 조회
- Backup: 일일 메트릭 레포팅
- Travel: 여행 통계

**Configuration:**
- [ ] Read replica 생성 (Supabase)
- [ ] 연결 풀링 설정 (PgBouncer)
- [ ] 쿼리 라우팅 로직 (읽기 전용 쿼리 → replica)

**Success Criteria:**
- ✅ Read replica lag < 1초
- ✅ 보고서 쿼리 응답시간 30% 개선

---

#### 2.4 RLS (Row-Level Security) 검증

**Scope:**
- [ ] 현재 RLS 정책 감시 (enable/disable 확인)
- [ ] 모든 테이블에 RLS 활성화
- [ ] 정책 검증 (user_id 기반 필터링)

**Testing:**
- ✅ 각 역할별 데이터 접근 테스트 (admin vs user vs viewer)
- ✅ 보안 테스트 케이스 작성

---

### 📌 **Project 3: 실시간 모니터링 대시보드** — 🟡 P1

**Target Date:** 2026-05-30 17:00 KST  
**Duration:** 5일 (2026-05-28 ~ 2026-05-30)  
**Allocation:** 15시간

#### 3.1 API 응답 시간 모니터링

**Metrics:**
- 목표: < 200ms (p95)
- 목표: < 500ms (p99)

**Implementation:**
- [ ] Vercel Analytics 설정
- [ ] 커스텀 메트릭 (Web Vitals)
- [ ] Prometheus 내보내기 (또는 유사 도구)

**Tracking:**
- ✅ 실시간 대시보드 (최근 1시간 데이터)
- ✅ 일일 리포트 (p50/p95/p99)

---

#### 3.2 에러율 모니터링

**Target:** < 0.1% (API 호출 당 에러율)

**Collection:**
- [ ] 에러 로깅 통합 (Sentry 또는 유사)
- [ ] Vercel Function 에러 추적
- [ ] 데이터베이스 연결 실패 감지

**Alerts:**
- ✅ 에러율 > 1% → 즉시 Telegram 알림 (CEO)
- ✅ 연속 5회 실패 → 심각 경고

---

#### 3.3 배포 상태 추적

**Status Dashboard:**
- 현재 배포 버전 (commit hash, timestamp)
- 최근 배포 히스토리 (지난 7일)
- 빌드 상태 (성공/실패/진행 중)

**Implementation:**
- [ ] GitHub Action 로그 연동
- [ ] Vercel Deployments API 사용
- [ ] Discord #배포 채널 자동 알림

---

#### 3.4 자동 알림 (이상 감지 시)

**Telegram Alert Rules:**
- [ ] API 응답시간 > 500ms (3회 연속) → "응답 지연 감지"
- [ ] 에러율 > 1% (5분) → "에러율 급증"
- [ ] 배포 실패 → "배포 실패"
- [ ] 데이터베이스 연결 시간초과 → "DB 연결 끊김"

**Alert Template:**
```
🔴 [ALERT] 응답 지연 감지
- 현재: 652ms (p95)
- 목표: < 200ms
- 시간: 2026-05-30 14:23:45 KST
- 검증: https://vercel.com/analytics
```

---

## 📊 산출물 (Deliverables)

### **Project 1 (2026-05-23)**
- ✅ Vercel 빌드 최적화 리포트 (시간, 크기, 아키텍처)
- ✅ 배포 가능한 빌드 파일 (프로덕션 적용 가능)
- ✅ vercel.json 설정 (ISR, 캐싱 정책)
- ✅ Edge Function 예시 코드 (3개 이상)

### **Project 2 (2026-05-27)**
- ✅ 데이터베이스 최적화 리포트 (인덱스, 성능 측정)
- ✅ 자동 백업 구현 (cron job, 복구 절차)
- ✅ Read Replica 설정 가이드
- ✅ RLS 검증 테스트 결과

### **Project 3 (2026-05-30)**
- ✅ 실시간 모니터링 대시보드 (URL + 액세스 가이드)
- ✅ 자동 알림 설정 문서 (Telegram/Discord 봇 구성)
- ✅ 모니터링 SOP (Standard Operating Procedure)
- ✅ 성능 기준선 데이터 (baseline metrics)

---

## 📅 일정표 (Weekly Schedule)

### **Week 1: 2026-05-19 ~ 2026-05-23 (Vercel Optimization)**

| 날짜 | 작업 | 시간 | 우선순위 |
|-----|------|------|---------|
| Mon 19 | 온보딩 + 환경 설정 + 분석 계획 | 8h | 🔴 P0 |
| Tue 20 | 빌드 최적화 + 번들 분석 | 8h | 🔴 P0 |
| Wed 21 | Edge Functions 구현 + 캐싱 설정 | 8h | 🔴 P0 |
| Thu 22 | 콜드스타트 최적화 + 테스트 | 8h | 🔴 P0 |
| Fri 23 | 통합 테스트 + 배포 + 리포팅 | 8h | 🔴 P0 |
| **소계** | | **40h** | |

### **Week 2: 2026-05-24 ~ 2026-05-30 (Supabase + Monitoring)**

| 날짜 | 작업 | 시간 | 우선순위 |
|-----|------|------|---------|
| Mon 26 | DB 분석 + 인덱스 설계 | 5h | 🟡 P1 |
| Tue 27 | 인덱스 생성 + 검증 + 백업 구현 | 5h | 🟡 P1 |
| Wed 28 | Read Replica 설정 + RLS 검증 | 5h | 🟡 P1 |
| Thu 29 | 모니터링 대시보드 구축 | 5h | 🟡 P1 |
| Fri 30 | 알림 설정 + 최종 테스트 + 배포 | 5h | 🟡 P1 |
| **소계** | | **25h** | |

---

## 🤝 협력 체계

### **팀원 연락처**
- **웹개발자:** [Slack/Discord/Telegram 채널] — DB 스키마 질문, API 통합
- **데이터분석가:** [Slack/Discord/Telegram 채널] — 메트릭 정의, 쿼리 최적화
- **평가자(QA):** [Slack/Discord/Telegram 채널] — 성능 검증, 배포 체크
- **플레너(CEO 비서):** asdf1390a@gmail.com — 일정 조정, 최종 승인, 보고

### **일일 리포팅**
- **시간:** 매일 17:00 KST
- **형식:** [프로젝트 이름] 진도율 XX% | 완료한 것 | 다음 단계
- **채널:** Telegram (CEO 개인 메시지) 또는 Discord #devops
- **예시:**
  ```
  ✅ P1: Vercel Optimization 40% | 
  - 빌드 시간 4분 10초 → 3분 30초 달성
  - ISR 설정 완료
  - 다음: Edge Functions 3개 구현
  ```

### **주간 회의**
- **시간:** 매주 금요일 17:00 KST
- **주제:** 주간 산출물 검증 + 다음 주 계획 확인
- **참석:** DevOps + 웹개발자 + 평가자 + 플레너

---

## 🚨 블로킹 요소 및 리스크

### **Potential Blockers**

1. **데이터베이스 백업 전략**
   - 현재 백업 정책 미정의 (조회 필요)
   - 해결: Day 2에 웹개발자/데이터분석가와 협의

2. **모니터링 도구 선택**
   - Prometheus vs Datadog vs 커스텀 대시보드
   - 해결: CEO 승인 후 진행

3. **Vercel 콘현 빌드 전략**
   - 기존 프로덕션 코드와 호환성 확인 필요
   - 해결: 스테이징 환경에서 먼저 테스트

### **Risk Mitigation**

- 모든 최적화 변경은 **스테이징 환경에서 먼저 검증**
- 프로덕션 배포 전 **평가자(QA) 사인오프** 필수
- 성능 변화 **before/after 측정 문서화** (회귀 방지)

---

## ✅ 성공 기준 (Success Criteria)

### **Project 1 완료 기준 (2026-05-23)**
- ✅ 빌드 시간 < 3분 (측정값 첨부)
- ✅ 콜드스타트 < 1초
- ✅ 3개 이상 Edge Function 배포
- ✅ 캐싱 전략 문서 + vercel.json 커밋
- ✅ 성능 리포트 (before/after 비교)

### **Project 2 완료 기준 (2026-05-27)**
- ✅ 쿼리 성능 20% 개선 (측정값)
- ✅ 자동 백업 매일 02:00 KST 실행 + 로그 기록
- ✅ Read Replica lag < 1초
- ✅ RLS 정책 100% 검증 (테스트 결과)

### **Project 3 완료 기준 (2026-05-30)**
- ✅ 실시간 모니터링 대시보드 배포 (URL 공개)
- ✅ 자동 알림 3개 이상 설정 + 테스트
- ✅ 초기 성능 기준선 수집 (최소 7일)
- ✅ SOP 문서 (유지보수 가이드)

---

## 📞 연락처 및 지원

### **온보딩 담당자**
- **플레너(비서):** asdf1390a@gmail.com
  - 일정 조정, 환경 설정, 팀 소개, 최종 보고

### **기술 지원**
- **웹개발자:** [연락처] — 코드 통합, API 질문
- **데이터분석가:** [연락처] — 메트릭, 성능 분석
- **평가자:** [연락처] — 검증, 배포 체크

### **긴급 연락 (Blockers)**
- CEO (Kyeongtae Na): Telegram [@username] 또는 asdf1390a@gmail.com
- 예상 응답 시간: 1시간 이내 (업무 시간)

---

## 🔗 관련 문서

- `ACTIVE_WORK_TRACKING.md` — 팀 전체 업무 현황판
- `project_capacity_100percent.md` — 팀 구성 및 용량 계획
- `project_backup_phase2_completion_report.md` — Supabase 아키텍처
- `project_discord_bot_phase1.md` — Telegram/Discord API 통합 예시

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-19 13:00 KST  
**Status:** READY FOR ASSIGNMENT ✅
