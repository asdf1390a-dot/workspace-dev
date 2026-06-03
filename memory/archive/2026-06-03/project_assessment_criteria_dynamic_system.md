---
name: 평가 기준 동적 업데이트 시스템
description: 외부 전문가 기준 + 기술 발전 속도 기반 월간 평가 기준 동적화 (모든 프로젝트 적용)
type: project
relatedFiles: ASSESSMENT_CRITERIA_DYNAMIC_SYSTEM.md, audit_system_framework.md, asset_master_phase_a_rules.md
---

# 평가 기준 동적 업데이트 시스템

**목적:** 고정된 평가 기준 대신 매월 외부 전문가 기준 + 기술 발전 속도를 반영하여 동적으로 업데이트

**적용 대상:** 감시 시스템, Asset Master, Backup App, Travel App, Portfolio Career 등 모든 프로젝트

**운영:** 비서 주도 (팀 의견 수렴) + 매월 15일 리뷰 회의

## 월간 동적 업데이트 프로세스 (매월 15일 실행)

### Timeline
```
15일 08:00 (Step 1) — 외부 전문가 기준 수집 (비서)
15일 10:00 (Step 2) — 기술 발전 속도 분석 (Data-Analyst AI Agent)
15일 14:00 (Step 3) — 현재 기준의 문제점 검토 (팀 전체)
15일 16:00 (Step 4) — 신규 기준 확정 + 기록 + 공지
```

## Step 1: 외부 전문가 기준 수집 (08:00~10:00)

**비서가 수행:**
- 각 도메인별 업계 리더 기준 조사
  - **웹개발:** Vercel/Next.js 블로그 + Chrome DevTools 가이드
  - **QA:** Google Testing Blog + Selenium/Playwright 권장사항
  - **데이터:** Kaggle 톱 데이터사이언티스트 기준
  - **번역:** Google Translate API 벤치마크 + 전문가 표준

- 산출물: `EXTERNAL_BENCHMARKS_YYYYMM.md`
  - 웹개발: Core Web Vitals, API 응답시간, 빌드 시간
  - QA: 테스트 커버리지, 자동화율
  - 번역: 정확도, 용어 일관성

## Step 2: 기술 발전 속도 분석 (10:00~14:00)

**Data-Analyst AI Agent 주도:**
- 지난 1개월 기술 변화 분석
- 새 라이브러리/프레임워크, 성능 개선, 보안 업데이트 평가
- 산출물: `TECHNOLOGY_VELOCITY_YYYYMM.md`

## Step 3: 현재 기준의 문제점 검토 (14:00~16:00)

**전체 팀:**
- 현재 기준이 타당한지 평가
- 실제 성능과 기준 간의 갭 분석
- 개선 제안

## Step 4: 신규 기준 확정 (16:00)

- 최종 기준 확정
- `ASSESSMENT_CRITERIA_MONTHLY_UPDATE.md` 작성
- Telegram으로 팀 공지

## 기존 고정 기준 (현재 갱신 대기)

### Audit System Framework
- 일일 신뢰도 목표: 95% (현재 고정)
- 주간 리뷰: 매주 월요일 10:00

### Asset Master Phase A Rules
- 매일 15:00: 진도 리포트
- 월/목: 편차 스캔
- 매일 08:00: 블로킹 추적

### 기술 검증 기준 (동적화 대상)
- API 응답시간 < 200ms (검토 중)
- DB 쿼리 < 100ms (검토 중)
- 번역 정확도 > 98% (검토 중)
- 코드 리뷰 기준: 린트 + 타입 + 테스트

## 성과 지표

| 지표 | 현재 | 목표 |
|------|------|------|
| 월 1회 기준 검토 | ❌ | ✅ |
| 팀 의견 수렴 | 💬 상의 | ✅ 자동화 |
| 외부 벤치마크 추적 | ❌ | ✅ 매월 |
| 기술 발전 속도 반영 | ❌ | ✅ 매월 |

## 참고 문서
- ASSESSMENT_CRITERIA_DYNAMIC_SYSTEM.md — 전체 상세 설계
- audit_system_framework.md — 감시 체계 기준
- asset_master_phase_a_rules.md — Asset Master 기준
