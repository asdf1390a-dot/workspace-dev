---
name: Phase 7 생태계 확장 (2026-07-01~09-30)
description: Data Platform + Mobile Field App 병렬 개발로 멀티 테넌트 확장, 데이터분석가 + 웹개발자(지원가) 추가 필요
type: project
relatedFiles: PHASE7_ECOSYSTEM_EXPANSION_OVERVIEW.md
---

# Phase 7: 생태계 확장 Phase 2

**기간:** 2026-07-01 ~ 2026-09-30 (3개월)  
**목표:** DSC FMS v1.0 완성 후 다중 팀/프로젝트/지역 확장을 위한 기초 시스템 구축

## 핵심 전략

DSC FMS는 v1.0일 뿐 → 멀티 테넌트 생태계 확장. 다중 팀 지원(Auto Info Collection), 지역별 확장(Mannur 공장→글로벌), Data Platform + Mobile Field App 병렬 개발

## 5개 Sub-Phase

| Phase | 기간 | 담당자 | 산출물 |
|-------|------|--------|--------|
| **7-1: 설계** | 07-01~07-31 | 데이터분석가/웹개발자 | 아키텍처 + 기술 결정 |
| **7-2/3: 개발** | 08-01~08-31 | 데이터분석가/웹개발자 | Data Platform v1 + Mobile App v1 |
| **7-4: 생태계 통합** | 09-01~09-15 | 플레너 주도 | 다중 팀 아키텍처 확정 |
| **7-5: 다국어화** | 09-16~09-30 | 번역가 | KO/EN/HI 지원 |

## Data Platform (데이터분석가 담당)

**기술:** Supabase (수집) + Python (분석) + Metabase/Superset (시각화)  
**목표:** KPI 대시보드 + 생산 오류율 예측(85% 정확도) + 이상 탐지  
**배포:** AWS Lambda/Supabase Functions + Vercel

## Mobile Field App (웹개발자 담당)

**기술:** React Native/Flutter (오프라인 우선)  
**기능:** 작업 목록 CRUD + 필드 입력 + 사진/영상 + 위치 정보 + 오프라인 동기화  
**배포:** App Store + Google Play

## 다중 팀 확장 아키텍처 (Phase 7-4)

- Auto Info Collection 다중 팀 버전
- Dynamic Assessment Criteria 통합 프레임워크
- Supabase 멀티 테넌트 지원

## 성공 기준

**정량:** Data Platform <200ms, 정확도 85%+, 일일 가동률 99.9% | Mobile App <100MB, 오프라인 100%, 동기화 에러 <0.1%  
**정성:** 현장 작업자 만족도 4.5/5, 의사결정 시간 30% 단축
