---
name: Phase 7 생태계 확장 Phase 2 개요
description: Data Platform + Mobile Field App 병렬 개발 전략 (2026-07-01 ~ 09-30)
type: project
---

# Phase 7: 생태계 확장 Phase 2 — Data Platform + Mobile Field App

**기간:** 2026-07-01 ~ 2026-09-30 (3개월)  
**목표:** DSC FMS v1.0 완성 후 다중 팀/프로젝트/지역 확장을 위한 기초 시스템 구축  
**상태:** 📋 설계 완료 (2026-05-16) → 구현 대기 (2026-07-01 착수)

---

## 🎯 전략 방향

### DSC FMS v1.0 완성 후 확장 방향 (사용자 지시, 2026-05-16)

> "너희는 dsc fms쪽만 담당하는게아니라 내가 만들 생태계를 전부관리해야되... 생태계확장방향도 고민해줘야되"

**사용자 선택:** Data Platform + Mobile Field App 병렬 진행

### 핵심 원칙

1. **DSC FMS는 v1.0일 뿐** → 멀티 테넌트 생태계로 확장
2. **다중 팀 지원** → Auto Info Collection + Assessment Criteria 다중 팀 버전
3. **지역별 확장** → Mannur 공장(인도) → 추가 공장 → 글로벌
4. **병렬 개발** → Data Platform(분석) + Mobile App(현장) 동시 진행

---

## 📊 Phase 7 구조 (5개 Sub-Phase)

### Phase 7-1: 설계 (2026-07-01 ~ 07-31)

**목표:** Data Platform + Mobile Field App 상세 설계 완료

#### Data Platform (타겟: Mannur 공장 분석 + 경영진 리포팅)

**기술 스택:**
- **데이터 수집:** Supabase (분석용 View + 실시간 파이프라인)
- **데이터 분석:** Python (예측 모델 + 이상 탐지)
- **시각화:** Metabase/Superset (드래그앤드롭 BI 대시보드)

**주요 기능:**
- 일일 KPI 대시보드 (생산, 품질, 효율성, 비용)
- 생산 오류율 예측 (목표: 85% 정확도)
- 설비 이상 탐지 + 실시간 알림
- 주간/월간 경영진 리포트 (PDF + Telegram)

**산출물:**
- `DATA_PLATFORM_DESIGN.md` — 아키텍처 + 기술 결정
- Metabase 템플릿 3개 (일일/주간/이상탐지)
- Python 모듈 스캐폴딩

#### Mobile Field App (타겟: 현장 작업자, 오프라인-우선 설계)

**기술 스택:**
- **프론트:** React Native or Flutter (팀 의견 수렴)
- **오프라인:** WatermelonDB or SQLite
- **동기화:** Supabase Realtime + 큐 기반 배치

**주요 기능:**
- 작업 목록 조회 (CRUD)
- 작업 상세 입력 (필드, 체크박스, 사진/영상 캡처)
- 위치 정보 자동 저장
- 오프라인 지원 (인터넷 없어도 작동, 온라인 복구 시 자동 동기화)
- Push 알림 (새 작업, 피드백, 완료 확인)

**산출물:**
- `MOBILE_APP_ARCHITECTURE.md` — 오프라인 동기화 전략
- UI/UX 피그마 목업 5개
- 기술 비교표 (React Native vs Flutter)

---

### Phase 7-2/3: 병렬 개발 (2026-08-01 ~ 08-31)

**전략:** Data Platform + Mobile Field App 동시 개발 (4주 스프린트)

#### Data Platform 개발 (데이터분석가 담당)

**Sprint 1 (08-01~07):** Data Pipeline + Metabase 기본
- Supabase View 5개 (KPI 정규화)
- Metabase 초기 대시보드 5개
- 실시간 Refresh 설정

**Sprint 2 (08-08~14):** 예측 모델 + 이상 탐지
- Python 모듈 배포 (AWS Lambda 또는 Supabase Functions)
- 생산 오류율 예측 모델 (정확도 85%)
- 설비 이상 탐지 (임계값 설정)

**Sprint 3 (08-15~21):** 경영진 리포팅 + 조직화
- 주간/월간 자동 리포트 (PDF + Telegram)
- 성과 대시보드 (KPI 추적, 월 대비)
- 역할별 액세스 제어

**Sprint 4 (08-22~31):** QA + 배포 준비
- 평가자: 3회 검증
- Metabase → Vercel 배포
- 문서화 + 운영 매뉴얼

**예상 완료:** 2026-08-31 (베타 배포)

#### Mobile Field App 개발 (웹개발자 + 신규 팀원)

**Sprint 1 (08-01~07):** Offline Sync + Core UI
- React Native/Flutter 프로젝트 초기화
- WatermelonDB/SQLite 스키마
- 작업 목록 화면 (CRUD)

**Sprint 2 (08-08~14):** 폼 입력 + 미디어
- 작업 상세 입력 폼
- 카메라 + 갤러리 통합
- 위치 정보 자동 캡처

**Sprint 3 (08-15~21):** Sync + 알림
- Supabase Realtime 동기화
- 오프라인 큐 관리
- Push 알림

**Sprint 4 (08-22~31):** 테스트 + 배포
- iOS + Android 검증
- App Store + Google Play 준비
- 초기 사용자 피드백

**예상 완료:** 2026-08-31 (v1.0 배포)

---

### Phase 7-4: 생태계 통합 설계 (2026-09-01 ~ 09-15)

**목표:** 다중 팀/프로젝트/지역 확장 아키텍처 확정

#### 설계 항목

1. **Auto Info Collection 다중 팀 확장**
   - 현재: DSC FMS 팀만 받음
   - 목표: 여러 팀/프로젝트가 각자 필터링된 정보 받기
   - 예상: Mannur 공장 팀 → 다른 공장 → HQ → 신규 고객사

2. **Dynamic Assessment Criteria 통합 프레임워크**
   - 현재: DSC FMS 기준만 동적 업데이트
   - 목표: 여러 프로젝트가 각자 기준 정의, 공통 프레임워크 사용
   - 예상: API <150ms, 신뢰도 98% (DSC FMS) / 복구 <5분 (Backup) / 사용성 4.5/5 (Travel)

3. **다중 팀 운영 구조**
   - 마스터 팀: 코어 시스템 관리
   - 프로젝트별 팀: 각 프로젝트 전담
   - 지역별 팀: 각 지역/공장 전담

4. **기술 스택 표준화**
   - Supabase: 멀티 테넌트 지원
   - Vercel: 프로젝트별 배포
   - Python/Node.js: 자동화 스크립트

#### 산출물

- `ECOSYSTEM_MULTI_TENANT_DESIGN.md` — 전체 아키텍처 통합
- `AUTO_INFO_MULTI_PROJECT_DESIGN.md` — 다중 팀 정보 배포
- `ASSESSMENT_CRITERIA_ECOSYSTEM_FRAMEWORK.md` — 통합 평가 기준
- `TEAM_EXPANSION_ROADMAP.md` — 향후 12개월 팀 확대 계획

---

### Phase 7-5: 모바일 앱 다국어화 (2026-09-16 ~ 09-30)

**목표:** Mobile Field App 한국어화 + 인도 현지화

**언어 지원:**
- 한국어 (KO) — 본사/한국 사용자
- 영어 (EN) — 인도 영어권
- 힌디어 (HI) — 인도 지역 현장 작업자

**작업:**
1. 앱 UI 전체 번역 (번역가)
2. 문화적 맥락 적용 (색상, 레이아웃, 이모지)
3. 최종 검증 (평가자)

**산출물:**
- Mobile App 다국어 지원 (KO/EN/HI)
- 현지화 가이드 문서

---

## 🔄 생태계 확장 로드맵 (2026-2027)

### 현재: Phase 1-6 (DSC FMS v1.0 완성)
**기간:** 2026-05-16 ~ 2026-06-27  
**산출물:** DSC FMS v1.0, Auto Info Collection v1, Assessment Criteria v1

### Phase 7 (생태계 확장 Phase 2)
**기간:** 2026-07-01 ~ 2026-09-30  
**산출물:** Data Platform, Mobile Field App, 다중 팀 아키텍처

### Phase 8+ (예상)
**2026-10~12:** 다중 공장 확장 (인도 2차, 3차 공장)  
**2027-01~:** 한국 HQ 통합 + 신규 고객사 온보딩

---

## 📋 팀별 역할 (Phase 7 기준)

| 역할 | 담당자 | Phase 7-1 | Phase 7-2/3 | Phase 7-4 | Phase 7-5 |
|------|--------|----------|-----------|----------|----------|
| **Data Platform** | 데이터분석가 | 설계 | 개발 (4주) | 통합 | — |
| **Mobile App** | 웹개발자 | 설계 | 개발 (4주) | 통합 | — |
| **생태계 설계** | 플레너 | 지원 | 모니터링 | 주도 | — |
| **다국어화** | 번역가 | — | — | — | 주도 |
| **QA 검증** | 평가자 | 지원 | QA (3회) | 통합 | 최종검증 |
| **자동화 관리** | 비서 | 일정 | 블로킹 추적 | 배포 | 배포 |

---

## 🚀 성공 기준

### 정량 지표
- **Data Platform:** 대시보드 성능 <200ms, 예측 정확도 85%+, 일일 구동률 99.9%
- **Mobile App:** 앱 크기 <100MB, 오프라인 기능 100%, 동기화 에러율 <0.1%
- **다중 팀:** 10개 팀까지 지원 가능, 확장 시 아키텍처 변경 최소 (<10%)

### 정성 지표
- 현장 작업자 만족도: 4.5/5
- 경영진 리포트 의사결정 시간: 30% 단축
- 팀 자율성 증대 (설정 변경 가능)

---

## ✅ 다음 액션 (2026-05-16~06-27)

1. **Phase 1-6 완성 추진** (2026-05-16 ~ 06-27)
   - Asset Master P2 API (05-16~19)
   - Backup Phase 2 UI (05-14~21)
   - Audit System (05-19~22)
   - Portfolio Career (05-23~06-12)
   - Travel Phase 2 (06-04~27)

2. **Phase 7 준비 (병렬 수행)**
   - 팀 교육 (Data Platform 이해, Mobile App 기술 선택)
   - 개발 환경 준비 (Python 라이브러리, React Native/Flutter 셋업)
   - 설계 리뷰 준비 (스터디 세션)

3. **2026-07-01 Phase 7 공식 시작**

---

**참고 문서:**
- [Ecosystem Vision](memory/project_ecosystem_vision.md)
- [Master Recovery Plan](MASTER_RECOVERY_PLAN_2026-05-16.md)
- [Auto Info Collection System](TEAM_DISCUSSION_AUTO_INFO_COLLECTION_SYSTEM.md)
- [Assessment Criteria Dynamic System](ASSESSMENT_CRITERIA_DYNAMIC_SYSTEM.md)
